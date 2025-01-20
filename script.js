// Global caches for shows and episodes
let cachedShows = null;
let cachedEpisodes = {}; // Cache for episodes by show ID

// Backup for the root element's original content
let originalRootContent = null;

async function setup() {
  const rootElem = document.getElementById("root");
  rootElem.textContent = "Loading shows, please wait...";

  // Backup the original root content for restoration
  originalRootContent = rootElem.innerHTML;

  try {
    // Fetch and cache all shows
    cachedShows = await fetchShows();
    const sortedShows = sortShowsAlphabetically(cachedShows);
    makePageForShows(sortedShows); // Render shows
    populateShowDropdown(sortedShows); // Populate dropdown
    setupShowSelector(); // Add event listeners
    liveSearch(sortedShows, []); // Initialize search
  } catch (error) {
    showError(`Failed to load shows: ${error.message}`);
  }
}

// Fetch all shows
async function fetchShows() {
  if (cachedShows) return cachedShows;
  const response = await fetch("https://api.tvmaze.com/shows");
  if (!response.ok)
    throw new Error(`Failed to fetch shows: ${response.status}`);
  return response.json();
}

// Fetch episodes for a specific show
async function fetchEpisodes(showId) {
  if (cachedEpisodes[showId]) return cachedEpisodes[showId];
  const response = await fetch(
    `https://api.tvmaze.com/shows/${showId}/episodes`
  );
  if (!response.ok)
    throw new Error(`Failed to fetch episodes: ${response.status}`);
  const data = await response.json();
  cachedEpisodes[showId] = data; // Cache episodes
  return data;
}

// Render all shows
function makePageForShows(showList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear current view
  const showsContainer = document.createElement("div");
  showsContainer.className = "shows-container";

  showList.forEach((show) => {
    const showCard = document.createElement("div");
    showCard.className = "show-card";

    showCard.innerHTML = `
      <h3>${show.name}</h3>
      <img src="${
        show.image?.medium || "https://via.placeholder.com/210x295"
      }" alt="${show.name}">
      <p><strong>Genres:</strong> ${show.genres.join(", ") || "N/A"}</p>
      <p><strong>Status:</strong> ${show.status}</p>
      <p><strong>Rating:</strong> ${show.rating?.average || "N/A"}</p>
      <p><strong>Runtime:</strong> ${show.runtime || "N/A"} mins</p>
      <p>${show.summary || "No summary available."}</p>
    `;

    showCard.addEventListener("click", async () => {
      const episodes = await fetchEpisodes(show.id);
      makePageForEpisodes(episodes);
      populateEpisodeDropdown(episodes);
      setupEpisodeSelector(); // Add event listener for episode dropdown
      addBackToShowsButton(); // Add back button
    });

    showsContainer.appendChild(showCard);
  });

  rootElem.appendChild(showsContainer);
}

// Render all episodes
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear current view
  const episodeContainer = document.createElement("div");
  episodeContainer.id = "episode-container";

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";
    episodeCard.setAttribute("data-episode-id", episode.id); // Add data attribute

    episodeCard.innerHTML = `
      <h3>${formatEpisodeCode(episode.season, episode.number)} - ${
      episode.name
    }</h3>
      <img src="${
        episode.image?.medium || "https://via.placeholder.com/210x295"
      }" alt="${episode.name}">
      <p>${episode.summary || "No summary available."}</p>
      <a href="${episode.url}" target="_blank">View on TVMaze</a>
    `;

    episodeContainer.appendChild(episodeCard);
  });

  rootElem.appendChild(episodeContainer);
  updateCount(episodeList.length);
}

// Add "Back to Shows" button
function addBackToShowsButton() {
  const rootElem = document.getElementById("root");

  // Create the button
  const backButton = document.createElement("button");
  backButton.textContent = "Back to Shows";
  backButton.className = "back-button";
  backButton.style.display = "block";
  backButton.style.margin = "10px auto";

  // Add click event to restore the original shows view
  backButton.addEventListener("click", restoreShowsView);

  // Add the button to the root
  rootElem.prepend(backButton);
}

// Restore shows view
function restoreShowsView() {
  const rootElem = document.getElementById("root");

  // Restore original root content
  if (originalRootContent) {
    rootElem.innerHTML = "";
    makePageForShows(sortShowsAlphabetically(cachedShows)); // Rebuild the shows
  }
}

// Update count of displayed episodes
function updateCount(count) {
  const resultElem = document.getElementById("search-result");
  resultElem.textContent = `${count} episode(s) found.`;
}

// Format episode code
function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(
    2,
    "0"
  )}`;
}

// Populate show dropdown
function populateShowDropdown(shows) {
  const showSelector = document.getElementById("show-selector");
  showSelector.innerHTML = '<option value="">Select a Show...</option>';
  shows.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  });
}

// Populate episode dropdown
function populateEpisodeDropdown(episodes) {
  const episodeSelector = document.getElementById("episodes-selector");
  episodeSelector.innerHTML = '<option value="">All Episodes</option>';
  episodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${formatEpisodeCode(
      episode.season,
      episode.number
    )} - ${episode.name}`;
    episodeSelector.appendChild(option);
  });
}

// Setup event listener for show selector
function setupShowSelector() {
  const showSelector = document.getElementById("show-selector");
  showSelector.addEventListener("change", async (event) => {
    const showId = event.target.value;
    if (!showId) return;
    const episodes = await fetchEpisodes(showId);
    makePageForEpisodes(episodes);
    populateEpisodeDropdown(episodes);
    setupEpisodeSelector(); // Add event listener for episode dropdown
    addBackToShowsButton(); // Add back button
  });
}

// Setup event listener for episode selector
function setupEpisodeSelector() {
  const episodeSelector = document.getElementById("episodes-selector");
  episodeSelector.addEventListener("change", (event) => {
    const episodeId = event.target.value;

    // Fetch all episodes from the currently displayed ones
    const episodeContainer = document.getElementById("episode-container");
    const allEpisodes = Array.from(episodeContainer.children).map((card) => ({
      id: card.getAttribute("data-episode-id"),
      html: card.outerHTML,
    }));

    // Filter for the selected episode or show all episodes if "All Episodes" is selected
    if (episodeId) {
      const filteredEpisode = allEpisodes.find((ep) => ep.id === episodeId);
      if (filteredEpisode) {
        episodeContainer.innerHTML = filteredEpisode.html;
      }
    } else {
      episodeContainer.innerHTML = allEpisodes.map((ep) => ep.html).join("");
    }

    // Update count
    updateCount(episodeId ? 1 : allEpisodes.length);
  });
}

// Live search functionality
function liveSearch(allShows, allEpisodes) {
  const searchIcon = document.querySelector(".search-icon");
  const searchContainer = document.querySelector(".containr-fluid");
  const searchBar = document.getElementById("search-bar");

  searchIcon.addEventListener("click", () => {
    searchContainer.classList.toggle("active");
    searchBar.focus();
  });

  searchBar.addEventListener("input", () => {
    const searchTerm = searchBar.value.toLowerCase().trim();

    if (allEpisodes.length > 0) {
      const filteredEpisodes = allEpisodes.filter(
        (ep) =>
          ep.name.toLowerCase().includes(searchTerm) ||
          ep.summary?.toLowerCase().includes(searchTerm)
      );
      makePageForEpisodes(filteredEpisodes);
    } else {
      const filteredShows = allShows.filter(
        (show) =>
          show.name.toLowerCase().includes(searchTerm) ||
          show.summary?.toLowerCase().includes(searchTerm) ||
          show.genres.join(", ").toLowerCase().includes(searchTerm)
      );
      makePageForShows(filteredShows);
    }
  });
}

// Sort shows alphabetically
function sortShowsAlphabetically(shows) {
  return shows.sort((a, b) => a.name.localeCompare(b.name));
}

// Show error
function showError(message) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p class="error">${message}</p>`;
}

// Initialize the app
window.onload = setup;
