let cachedEpisodes = null; // Cache for episodes to avoid repeated fetches

// Setup function to initialize the app
function setup() {
  fetchEpisodes()
    .then((allEpisodes) => {
      console.log("All episodes fetched:", allEpisodes); // Debug log
      makePageForEpisodes(allEpisodes);
      liveSearch(allEpisodes);
      episodeSelector(allEpisodes);
    })
    .catch((error) => {
      showError(`Failed to load episodes: ${error.message}`);
    });
}

// Fetch episodes from the TVMaze API
function fetchEpisodes() {
  if (cachedEpisodes) return Promise.resolve(cachedEpisodes); // Use cache if available

  showLoadingMessage("Loading episodes...");
  return fetch("https://api.tvmaze.com/shows/82/episodes")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((episodes) => {
      cachedEpisodes = episodes; // Cache the data
      hideLoadingMessage();
      return episodes;
    })
    .catch((error) => {
      hideLoadingMessage();
      throw error;
    });
}

// Show a loading message while data is being fetched
function showLoadingMessage(message) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p class="loading">${message}</p>`;
}

// Remove the loading message
function hideLoadingMessage() {
  const loadingElem = document.querySelector(".loading");
  if (loadingElem) loadingElem.remove();
}

// Show an error message to the user
function showError(message) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = `<p class="error">${message}</p>`;
}

// Render all episodes on the page
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
    episodeImage.src = episode.image?.medium || "https://via.placeholder.com/210x295";
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

// Format the episode code (e.g., S01E02)
function formatEpisodeCode(season, number) {
  return `S${String(season).padStart(2, "0")}E${String(number).padStart(2, "0")}`;
}

// Update the episode count
function updateCount(count) {
  const result = document.getElementById("search-result");
  result.textContent = `${count} episode(s).`;
}

// Live search functionality
function liveSearch(allEpisodes) {
  const searchBar = document.getElementById("search-bar");
  if (!searchBar) {
    console.error("Search bar element not found!");
    return;
  }

  searchBar.addEventListener("input", (event) => {
    const searchTerm = event.target.value.toLowerCase().trim();
    console.log("Search term entered:", searchTerm); // Debug log

    const filteredEpisodes = allEpisodes.filter((episode) => {
      const episodeName = episode.name.toLowerCase();
      const episodeSummary = episode.summary?.toLowerCase() || "";

      return (
        episodeName.includes(searchTerm) || episodeSummary.includes(searchTerm)
      );
    });

    console.log("Filtered episodes:", filteredEpisodes); // Debug log

    if (searchTerm === "") {
      makePageForEpisodes(allEpisodes);
    } else {
      makePageForEpisodes(filteredEpisodes);
    }
  });
}

// Populate and handle the episode selector dropdown
function episodeSelector(allEpisodes) {
  const selector = document.getElementById("episodes-selector");
  if (!selector) {
    console.error("Episode selector element not found!");
    return;
  }

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

// Initialize the app when the page loads
window.onload = setup;
