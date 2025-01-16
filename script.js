let cachedEpisodes = null; // Cache to avoid multiple fetches

async function setup() {
  const rootElem = document.getElementById("root");
  rootElem.textContent = "Loading shows, please wait...";

  try {
    // Fetch and cache all shows
    const allShows = await fetchShows();
    const sortedShows = sortShowsAlphabetically(allShows);

    // Populate the show selector dropdown
    showsDropdown(sortedShows);

    // Load episodes for the first show by default
    const firstShowId = sortedShows[0].id;
    const allEpisodes = await fetchEpisodes(firstShowId);
    cachedEpisodes = allEpisodes;

    // Render episodes and setup functionality
    makePageForEpisodes(allEpisodes);
    liveSearch(allEpisodes);
    updateEpisodeSelector(allEpisodes);

    // Add event listener for the show selector dropdown
    setupShowSelector(sortedShows);
  } catch (error) {
    showError(`Failed to load data: ${error.message}`);
  }
}

// Fetch the list of shows
async function fetchShows() {
  const response = await fetch("https://api.tvmaze.com/shows");
  if (!response.ok) {
    throw new Error(`Failed to fetch shows: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

// Fetch the episodes of a specific show
async function fetchEpisodes(showId) {
  const response = await fetch(
    `https://api.tvmaze.com/shows/${showId}/episodes`
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch episodes: ${response.status}`);
  }
  const data = await response.json();
  return data;
}

// Render episodes on the page
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear any existing content

  const episodeCount = document.createElement("p");
  episodeCount.textContent = `Got ${episodeList.length} episode(s)`;
  rootElem.appendChild(episodeCount);

  const episodeContainer = document.createElement("div");
  episodeContainer.id = "episode-container";
  rootElem.appendChild(episodeContainer);

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";

    const episodeTitle = document.createElement("h3");
    episodeTitle.textContent = `${episode.name} - ${formatEpisodeCode(
      episode.season,
      episode.number
    )}`;

    const episodeImage = document.createElement("img");
    episodeImage.src =
      episode.image?.medium || "https://via.placeholder.com/210x295";
    episodeImage.alt = episode.name;

    const episodeSummary = document.createElement("p");
    episodeSummary.innerHTML = episode.summary || "No summary available.";

    const episodeLink = document.createElement("a");
    episodeLink.href = episode.url;
    episodeLink.target = "_blank";
    episodeLink.textContent = "View on TVMaze";

    episodeCard.appendChild(episodeTitle);
    episodeCard.appendChild(episodeImage);
    episodeCard.appendChild(episodeSummary);
    episodeCard.appendChild(episodeLink);
    episodeContainer.appendChild(episodeCard);
  });

  updateCount(episodeList.length);
}

// Format episode code (e.g., S01E02)
function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(
    2,
    "0"
  )}`;
}

// Update the episode count
function updateCount(count) {
  const result = document.getElementById("search-result");
  result.textContent = `${count} episode(s).`;
}

// Live search functionality
function liveSearch(allEpisodes) {
  const searchIcon = document.querySelector(".search-icon");
  const searchContainer = document.querySelector(".containr-fluid");
  const searchBar = document.getElementById("search-bar");

  searchIcon.addEventListener("click", () => {
    searchContainer.classList.toggle("active");
    if (searchContainer.classList.contains("active")) {
      searchBar.focus(); // Automatically focus on the search bar
    }
  });
  searchBar.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();

    const filteredEpisodes = allEpisodes.filter((episode) => {
      const episodeName = episode.name.toLowerCase();
      const episodeSummary = episode.summary?.toLowerCase() || "";

      return (
        episodeName.includes(searchTerm) || episodeSummary.includes(searchTerm)
      );
    });

    if (searchTerm === "") {
      makePageForEpisodes(allEpisodes);
      updateEpisodeSelector(allEpisodes);
    } else {
      makePageForEpisodes(filteredEpisodes);
      updateEpisodeSelector(filteredEpisodes);
    }
  });
}

// Populate and handle the episode selector dropdown
function updateEpisodeSelector(allEpisodes) {
  const selector = document.getElementById("episodes-selector");
  selector.innerHTML = '<option value="">All Episodes</option>';

  allEpisodes.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${formatEpisodeCode(
      episode.season,
      episode.number
    )} - ${episode.name}`;
    selector.appendChild(option);
  });
}

// Handle episode selection from the dropdown
function episodeSelector(allEpisodes) {
  const selector = document.getElementById("episodes-selector");

  selector.addEventListener("change", (event) => {
    const selectedEpisodeId = event.target.value;

    if (selectedEpisodeId === "") {
      makePageForEpisodes(allEpisodes);
    } else {
      const selectedEpisode = allEpisodes.find(
        (episode) => episode.id.toString() === selectedEpisodeId
      );
      makePageForEpisodes([selectedEpisode]);
    }
  });
}

// Setup the show selector dropdown
function setupShowSelector(sortedShows) {
  const showSelector = document.getElementById("show-selector");

  showSelector.addEventListener("change", async (event) => {
    const selectedShowId = event.target.value;

    if (!selectedShowId) return;

    const episodes = await fetchEpisodes(selectedShowId);
    cachedEpisodes = episodes;

    makePageForEpisodes(episodes);
    liveSearch(episodes);
    updateEpisodeSelector(episodes);
  });
}

// Populate the show selector dropdown
function showsDropdown(showsList) {
  const showSelector = document.getElementById("show-selector");
  showSelector.innerHTML = '<option value="">Select a Show...</option>';

  showsList.forEach((show) => {
    const option = document.createElement("option");
    option.value = show.id;
    option.textContent = show.name;
    showSelector.appendChild(option);
  });
}

// Sort shows alphabetically
function sortShowsAlphabetically(shows) {
  return shows.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );
}

// Show error message
function showError(message) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p class="error">${message}</p>`;
}

// Initialize the app when the page loads
window.onload = setup;
