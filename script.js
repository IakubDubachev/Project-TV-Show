async function setup() {
  try {
    // Display a loading message while fetching data
    displayMessage("Loading episodes, please wait...");

    // Fetch data from the API
    const allEpisodes = await fetchEpisodes();
    if (!allEpisodes) throw new Error("Failed to load episodes.");

    // Initialize the page
    makePageForEpisodes(allEpisodes);
    liveSearch(allEpisodes);
    episodeSelector(allEpisodes);

    // Remove any loading or error messages
    clearMessage();
  } catch (error) {
    // Display error message to the user
    displayMessage(`Error: ${error.message}`);
  }
}

// Fetch episodes data from the API
async function fetchEpisodes() {
  const url = "https://api.tvmaze.com/shows/82/episodes";
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Unable to fetch episodes from the API.");
  }
  return response.json();
}

// Function to render all episodes on the page
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ""; // Clear any existing content

  const episodeCount = document.createElement("p");
  episodeCount.textContent = `Got ${episodeList.length} episode(s)`;
  rootElem.appendChild(episodeCount);

  // Create a container for episodes
  const episodeContainer = document.createElement("div");
  episodeContainer.id = "episode-container";
  rootElem.appendChild(episodeContainer);

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement("div");
    episodeCard.className = "episode-card";

    // Episode Title with Episode Code
    const episodeTitle = document.createElement("h3");
    episodeTitle.textContent = `${episode.name} - ${formatEpisodeCode(
      episode.season,
      episode.number
    )}`;

    // Episode Image
    const episodeImage = document.createElement("img");
    episodeImage.src = episode.image?.medium || "placeholder.jpg";
    episodeImage.alt = episode.name;

    // Episode Summary
    const episodeSummary = document.createElement("p");
    episodeSummary.innerHTML = episode.summary || "No summary available.";

    // Link to TVMaze episode page
    const episodeLink = document.createElement("a");
    episodeLink.href = episode.url;
    episodeLink.target = "_blank";
    episodeLink.textContent = "View on TVMaze";

    // Append elements to the episode card
    episodeCard.appendChild(episodeTitle);
    episodeCard.appendChild(episodeImage);
    episodeCard.appendChild(episodeSummary);
    episodeCard.appendChild(episodeLink);

    // Add episode card to container
    episodeContainer.appendChild(episodeCard);
  });
  updateCount(episodeList.length);
}

// Format the episode code (e.g., S02E07)
function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

// Update episode count
function updateCount(count) {
  const result = document.getElementById("search-result");
  result.textContent = `${count} episode(s).`;
}

// Function to handle live search
function liveSearch(allEpisodes) {
  const searchBar = document.getElementById("search-bar");
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
    } else {
      makePageForEpisodes(filteredEpisodes);
    }
  });
}

// Function to handle episode selection from the dropdown
function episodeSelector(allEpisodes) {
  const selector = document.getElementById("episodes-selector");

  // Populate the selector with options
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

  // Event listener for selector changes
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

// Display a temporary message to the user
function displayMessage(message) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p>${message}</p>`;
}

// Clear any temporary messages
function clearMessage() {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = "";
}

// Run the setup when the page loads
window.onload = setup;


