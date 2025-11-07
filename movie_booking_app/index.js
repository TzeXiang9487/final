document.addEventListener('DOMContentLoaded', () => {
  const movieGrid = document.getElementById('movie-grid');
  const modalOverlay = document.getElementById('modalOverlay');
  const closeModal = document.getElementById('closeModal');
  const selectTimeBtn = document.getElementById('selectTimeBtn');
  const dateOptions = document.getElementById('dateOptions');
  const loadingMessage = document.getElementById('movie-loading-message');

  // Modal elements
  const movieTitle = document.getElementById('modalMovieTitle');
  const movieDescription = document.getElementById('modalMovieDescription');
  const movieTrailer = document.getElementById('movieTrailer');

  let allMovies = {};
  let selectedMovie = null;
  let selectedDate = null;

  // Fetch movies
  async function fetchAndRenderMovies() {
    loadingMessage.textContent = 'Loading movies...';
    loadingMessage.style.display = 'block';
    movieGrid.innerHTML = '';

    try {
      const response = await fetch('movie_api.php');
      if (!response.ok) throw new Error("HTTP " + response.status);
      const data = await response.json();

      if (data.status === 'success') {
        allMovies = data.movies;
        renderMovieGrid(allMovies);
      } else {
        movieGrid.innerHTML = '<p class="error-message">Error loading movies</p>';
      }
    } catch (err) {
      console.error('Error fetching movies:', err);
      movieGrid.innerHTML = '<p class="error-message">Network Error</p>';
    } finally {
      loadingMessage.style.display = 'none';
    }
  }

  function renderMovieGrid(movies) {
    movieGrid.innerHTML = '';
    const user = localStorage.getItem("loggedInUser");
    let userCategories = [];

    if (user) {
      try {
        const usersData = JSON.parse(localStorage.getItem("usersData") || "[]");
        const currentUser = usersData.find(u => u.email === user);
        userCategories = currentUser?.categories || [];
      } catch (e) {
        console.error("Loading category error", e);
      }
    }

    const sorted = Object.entries(movies).map(([title, movieData]) => {
      let matchScore = 0;
      let showSparkle = false;

      if (userCategories.length && movieData.labels) {
        const matches = movieData.labels.filter(l => userCategories.includes(l));
        matchScore = matches.length;
        showSparkle = matches.length > 0;
      }

      return { title, movieData, showSparkle, matchScore };
    });

    sorted.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.title.localeCompare(b.title);
    });

    if (!sorted.length) {
      movieGrid.innerHTML = '<p>No movies available</p>';
      return;
    }

    sorted.forEach(({ title, movieData, showSparkle }) => {
      const card = document.createElement('div');
      card.className = 'movie-card';
      card.dataset.movie = title;

      card.innerHTML = `
        <div class="movie-image-container">
          <img src="${movieData.image}" alt="${title}">
          ${movieData.rating ? `<div class="movie-card-rating">⭐ ${movieData.rating}/10</div>` : ''}
          ${showSparkle ? `<div class="movie-card-sparkle">✨</div>` : ''}
        </div>
        <h3>${title}</h3>
      `;

      movieGrid.appendChild(card);
    });
  }

  function generateNext7Days() {
    const days = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
    const arr = [];

    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);

      const dname = days[date.getDay()];
      const d = String(date.getDate()).padStart(2,'0');
      const m = String(date.getMonth()+1).padStart(2,'0');
      const y = date.getFullYear();

      arr.push({
        display: `${dname}, ${d}/${m}`,
        day: dname,
        date: `${d}/${m}`,
        value: `${y}-${m}-${d}`
      });
    }
    return arr;
  }

  function initializeDateOptions() {
    const arr = generateNext7Days();
    dateOptions.innerHTML = '';

    arr.forEach(obj => {
      const opt = document.createElement('div');
      opt.className = 'date-option';
      opt.dataset.dateValue = obj.value;
      opt.innerHTML = `
        <div class="date-day">${obj.day}</div>
        <div class="date-date">${obj.date}</div>
      `;

      opt.addEventListener('click', () => {
        dateOptions.querySelectorAll('.date-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selectedDate = { display: obj.display, value: obj.value };
        checkSelections();
      });

      dateOptions.appendChild(opt);
    });
  }

  function openMovieModal(name) {
    const movie = allMovies[name];
    if (!movie) return;

    selectedMovie = { title: name, ...movie };
    selectedDate = null;

    movieTitle.textContent = name;
    movieDescription.textContent = movie.description;
    movieTrailer.src = movie.trailer;

    const old = document.querySelector('.labels-row');
    if (old) old.remove();

    if (movie.labels && movie.labels.length > 0) {
      const row = document.createElement('div');
      row.className = 'info-row labels-row';
      row.innerHTML = `
        <span class="info-label">Labels</span>
        <div class="info-content">
          <div class="movie-labels">
            ${movie.labels.map(l=>`<span class="label-tag">${l}</span>`).join('')}
          </div>
        </div>
      `;
      const descRow = document.querySelector('.info-row:first-child');
      descRow.parentNode.insertBefore(row, descRow.nextSibling);
    }

    dateOptions.querySelectorAll('.date-option').forEach(o => o.classList.remove('selected'));

    selectTimeBtn.disabled = true;
    modalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeMovieModal() {
    modalOverlay.classList.remove('active');
    setTimeout(() => {
      document.body.style.overflow = 'auto';
      movieTrailer.src = '';
      selectedMovie = null;
      selectedDate = null;
    }, 300);
  }

  function checkSelections() {
    selectTimeBtn.disabled = !(selectedMovie && selectedDate);
  }

  function handleSelectTime() {
    if (selectedMovie && selectedDate) {
      localStorage.setItem('selectionData', JSON.stringify({ movie:selectedMovie, date:selectedDate }));
      window.location.href = 'time-selection.html';
    }
  }

  movieGrid.addEventListener('click', e => {
    const card = e.target.closest('.movie-card');
    if (!card) return;
    openMovieModal(card.dataset.movie);
  });

  closeModal.addEventListener('click', closeMovieModal);
  selectTimeBtn.addEventListener('click', handleSelectTime);

  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeMovieModal();
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalOverlay.classList.contains('active')) {
      closeMovieModal();
    }
  });

  initializeDateOptions();
  fetchAndRenderMovies();


  /* ✅ ADMIN EVENT LISTENERS FIXED — moved inside DOMContentLoaded */
  document.getElementById("adminCancelBtn").addEventListener("click", () => {
    document.getElementById("adminModal").classList.remove("active");
    document.getElementById("adminPasswordInput").value = "";
    document.getElementById("adminError").textContent = "";
  });

  document.getElementById("adminSubmitBtn").addEventListener("click", () => {
    const password = document.getElementById("adminPasswordInput").value;
    const adminError = document.getElementById("adminError");

    const correctPassword = "admin123";

    if (password === correctPassword) {
      window.location.href = "admin.html";
    } else {
      adminError.textContent = "Incorrect password!";
    }
  });

});


// Login toggle
window.handleAuthAction = function() {
  const user = localStorage.getItem("loggedInUser");
  if (user) {
    localStorage.removeItem("loggedInUser");
    alert("Logged out successfully.");
    location.reload();
  } else {
    window.location.href = "login.html";
  }
};


// Open admin modal
window.handleAdminAction = function () {
  document.getElementById("adminModal").classList.add("active");
};


// Auth button text
window.onload = function () {
  const authButton = document.getElementById('authButton');
  const user = localStorage.getItem("loggedInUser");
  authButton.textContent = user ? "Logout" : "Sign In";
};
