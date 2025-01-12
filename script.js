function setup() {
  const allEpisodes = getAllEpisodes();
  makePageForEpisodes(allEpisodes);
  liveSearch(allEpisodes);
  episodeSelector(allEpisodes);
}

// Function to render all episodes on the page
function makePageForEpisodes(episodeList) {
  const rootElem = document.getElementById("root");
  rootElem.innerHTML = ''; // Clear any existing content

  const episodeCount = document.createElement('p');
  episodeCount.textContent = `Got ${episodeList.length} episode(s)`;
  rootElem.appendChild(episodeCount);

  // Create a container for episodes
  const episodeContainer = document.createElement('div');
  episodeContainer.id = 'episode-container';
  rootElem.appendChild(episodeContainer);

  episodeList.forEach((episode) => {
    const episodeCard = document.createElement('div');
    episodeCard.className = 'episode-card';

    // Episode Title with Episode Code
    const episodeTitle = document.createElement('h3');
    episodeTitle.textContent = `${episode.name} - ${formatEpisodeCode(
      episode.season,
      episode.number
    )} `;

    // Episode Image
    const episodeImage = document.createElement('img');
    episodeImage.src = episode.image?.medium || 'placeholder.jpg';
    episodeImage.alt = episode.name;

    // Episode Summary
    const episodeSummary = document.createElement('p');
    episodeSummary.innerHTML = episode.summary || 'No summary available.';

    // Link to TVMaze episode page
    const episodeLink = document.createElement('a');
    episodeLink.href = episode.url;
    episodeLink.target = '_blank';
    episodeLink.textContent = 'View on TVMaze';

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
  return `S${String(season).padStart(2, '0')}E${String(number).padStart(2, '0')}`;
}

function liveSearch(allEpisodes) {
  const searchIcon = document.querySelector(".search-icon");
  const searchContainer = document.querySelector(".containr-fluid");
  const searchBar = document.getElementById("search-bar");
  const selector = document.getElementById("episodes-selector");


  // Toggle the visibility of the search bar
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
      const episodeSummary = episode.summary.toLowerCase();

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

function updateCount(count) {
  const result = document.getElementById("search-result");
  result.textContent = `${count} episode(s).`;
}

function updateEpisodeSelector(episodeList) {
  const selector = document.getElementById("episodes-selector");
  selector.innerHTML = '<option value="">All Episodes</option>'; // Reset selector

  episodeList.forEach((episode) => {
    const option = document.createElement("option");
    option.value = episode.id;
    option.textContent = `${formatEpisodeCode(
      episode.season,
      episode.number
    )} - ${episode.name}`;
    selector.appendChild(option);
  });
}

function episodeSelector (allEpisodes) {
  const selector = document.getElementById("episodes-selector");

  selector.addEventListener("change", (event) => {
    const selectedEpisodeId = event.target.value;
    
    if (selectedEpisodeId === "") {
      // Show all episodes if "All Episodes" is selected
      makePageForEpisodes(allEpisodes);
    } else {
      // Show only the selected episode
      const selectedEpisode = allEpisodes.find(
        (episode) => episode.id.toString() === selectedEpisodeId
      );
      makePageForEpisodes([selectedEpisode]);
    }
  });
}

// Run the setup when the page loads
window.onload = setup;
