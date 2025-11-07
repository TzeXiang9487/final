document.addEventListener('DOMContentLoaded', () => {
    // Get elements from the page
    const selectedMovieInfo = document.getElementById('selectedMovieInfo');
    const locationOptions = document.getElementById('locationOptions');
    const timeOptions = document.getElementById('timeOptions');
    const continueBtn = document.getElementById('continueBtn');
    const backBtn = document.getElementById('backBtn');

    // Variables to store the user's choices
    let selectedLocation = null;
    let selectedTime = null;

    // --- 1. Load and Display Movie/Date Info ---
    
    // Get the selection data (movie/date) saved by the previous page
    const selectionData = JSON.parse(localStorage.getItem('selectionData'));
    
    // Safely extract essential information (using optional chaining for robustness)
    const movieTitle = selectionData?.movie?.title;
    const movieDescriptionText = selectionData?.movie?.description;
    const selectedDateDisplay = selectionData?.date?.display; // The date display string
    const selectedDateValue = selectionData?.date?.value;     // The date value (YYYY-MM-DD)

    // Check for essential data
    if (movieTitle && selectedDateDisplay) {
        // Populate the movie info box with the data from the last page
        selectedMovieInfo.innerHTML = `
            <div class="movie-info-content">
                <div class="movie-info-text">
                    <h2>${movieTitle}</h2>
                    <p class="movie-description">${movieDescriptionText || 'No description available.'}</p>
                    <p class="selected-date">Selected Date: <strong>${selectedDateDisplay}</strong></p>
                </div>
            </div>
        `;
    } else {
        // Handle case where no data is found (e.g., user landed here directly)
        selectedMovieInfo.innerHTML = '<p style="color: red; text-align: center;">Error: Movie selection not found. Please go back.</p>';
        continueBtn.disabled = true; // Disable continue button
    }

    // --- 2. Check Selections Function ---

    // This function checks if both a location AND a time are selected
    function checkSelections() {
        if (selectedLocation && selectedTime) {
            continueBtn.disabled = false; // Enable the button
        } else {
            continueBtn.disabled = true; // Keep button disabled
        }
    }

    // --- 3. Handle Location Selection ---

    locationOptions.addEventListener('click', (e) => {
        // Find the card that was clicked
        const card = e.target.closest('.option-card');
        if (!card) return; // Exit if user clicked on empty space

        // Remove 'selected' class from all other location cards
        locationOptions.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        
        // Add 'selected' class to the clicked card
        card.classList.add('selected');
        
        // Store the selected location from the 'data-location' attribute
        selectedLocation = card.dataset.location;
        
        // Check if the 'Continue' button can be enabled
        checkSelections();
    });

    // --- 4. Handle Time Selection ---

    timeOptions.addEventListener('click', (e) => {
        // Find the card that was clicked
        const card = e.target.closest('.option-card');
        if (!card) return; // Exit if user clicked on empty space

        // Remove 'selected' class from all other time cards
        timeOptions.querySelectorAll('.option-card').forEach(c => c.classList.remove('selected'));
        
        // Add 'selected' class to the clicked card
        card.classList.add('selected');
        
        // Store the selected time from the 'data-time' attribute
        selectedTime = card.dataset.time;
        
        // Check if the 'Continue' button can be enabled
        checkSelections();
    });

    // --- 5. Handle Button Clicks ---

    // 'Back' button
    backBtn.addEventListener('click', () => {
        // Go back to the previous page (movie list)
        window.history.back();
    });

    // 'Continue' button
continueBtn.addEventListener('click', () => {
    // Use the safely extracted data
    if (selectedLocation && selectedTime && movieTitle && selectedDateDisplay) {
        // Create proper movie selection data structure
        const movieSelection = {
            movie: movieTitle,                          // Simple movie title string
            description: movieDescriptionText,
            location: selectedLocation,
            time: selectedTime,
            date: selectedDateDisplay,                  // The date string read by checkout.js
            selected_date: selectedDateValue            // The YYYY-MM-DD value for other uses
        };
        
        // Save for the next page
        localStorage.setItem('movieSelection', JSON.stringify(movieSelection));
        
        // Redirect to the seat selection page
        window.location.href = 'seats.html';
    } else {
        alert("Please ensure a movie, date, location, and time are selected.");
    }
});
});