document.addEventListener('DOMContentLoaded', async () => {
    const SEAT_PRICE = 15.00; // Price per seat

    // DOM Elements
    const seatLayout = document.querySelector('.seat-layout');
    const bookingDetails = document.getElementById('booking-details');
    const seatsListSpan = document.getElementById('seats-list');
    const totalPriceSpan = document.getElementById('total-price');
    const confirmSeatsBtn = document.getElementById('confirm-seats-btn');
    
    // AUTH CHECK: Get user login status from localStorage
    const loggedInUser = localStorage.getItem('loggedInUser'); // Check for the key set by login.html

    // Get movie selection from localStorage
    const movieSelection = JSON.parse(localStorage.getItem('movieSelection'));

    if (movieSelection) {
        bookingDetails.innerHTML = `
            <strong>${movieSelection.movie}</strong> at ${movieSelection.location} - ${movieSelection.time}
        `;
    }

    /**
     * Handles UI/UX changes based on user login status.
     */
    function checkUserLoginStatus() {
        if (!loggedInUser) {
            // 1. Visually disable the seat layout
            seatLayout.classList.add('disabled-selection');

            // 2. Disable and update the confirmation button
            confirmSeatsBtn.disabled = true;
            confirmSeatsBtn.textContent = 'Please Sign In to Select Seats';

            // 3. Display an alert message in the summary area
            const summary = document.querySelector('.summary');
            if (summary) {
                const alertDiv = document.createElement('div');
                alertDiv.className = 'login-alert';
                // Inline styles for display, can be moved to CSS if preferred
                alertDiv.style.color = '#ff4d4d';
                alertDiv.style.marginTop = '20px';
                alertDiv.style.fontSize = '1.1em';
                alertDiv.innerHTML = 'You must be <a href="login.html" style="color:#00ccff; text-decoration: none; font-weight: bold;">Signed In</a> to select seats.';
                summary.prepend(alertDiv); // Place it inside the summary box
            }
        } else {
             // If logged in, set default button text
             confirmSeatsBtn.textContent = 'Proceed to Food & Drinks';
             // Button enabled status is managed by updateSummary()
        }
    }


    /**
     * Fetches booked seats from the database and marks them as taken
     */
    async function fetchAndMarkBookedSeats() {
        if (!movieSelection) return;

        try {
            const response = await fetch('fetch_bookings.php');
            const data = await response.json();

            if (data.status === 'success' && data.bookings) {
                // Filter bookings that match current movie selection
                const matchingBookings = data.bookings.filter(booking => 
                    booking.movie_name === movieSelection.movie &&
                    booking.location === movieSelection.location &&
                    booking.time === movieSelection.time
                );
                
                // Get all seats that need to be marked as taken
                const seatsToMarkTaken = matchingBookings.flatMap(b => b.seats_list).filter(Boolean);

                // Mark seats as taken
                seatsToMarkTaken.forEach(seatName => {
                    const seatElement = document.querySelector(`.seat[data-seat="${seatName}"]`);
                    if (seatElement) {
                        seatElement.classList.remove('available');
                        seatElement.classList.add('taken');
                    }
                });
            }
        } catch (error) {
            console.error('Error fetching booked seats:', error);
            // Optionally, display an error message on the page
        }
    }

    /**
     * Updates the summary of selected seats and total price.
     */
    function updateSummary() {
        const selectedSeats = document.querySelectorAll('.seat.selected');
        const numSeats = selectedSeats.length;

        if (numSeats > 0) {
            const seatNames = [...selectedSeats].map(seat => seat.dataset.seat).join(', ');
            seatsListSpan.textContent = seatNames;
            totalPriceSpan.textContent = `RM ${(numSeats * SEAT_PRICE).toFixed(2)}`;
            
            // Only enable button if logged in AND seats are selected
            if (loggedInUser) {
                confirmSeatsBtn.disabled = false;
            } else {
                // If not logged in, keep it disabled
                confirmSeatsBtn.disabled = true;
            }
        } else {
            seatsListSpan.textContent = 'None';
            totalPriceSpan.textContent = 'RM 0.00';
            confirmSeatsBtn.disabled = true;
        }
    }

    // Event listener for seat clicks
    seatLayout.addEventListener('click', (e) => {
        // NEW CHECK: Prevent seat selection if the user is not logged in
        if (!loggedInUser) {
            e.preventDefault();
            return; 
        }

        const seat = e.target.closest('.seat');
        if (seat && !seat.classList.contains('taken') && seat.classList.contains('available')) {
            seat.classList.toggle('selected');
            updateSummary();
        }
    });

    // Event listener for the confirm button
    confirmSeatsBtn.addEventListener('click', () => {
        // Redundant check, but safe
        if (!loggedInUser) {
            alert("You must be signed in to proceed!");
            window.location.href = 'login.html';
            return;
        }
        
        const selectedSeats = document.querySelectorAll('.seat.selected');
        const seatData = {
            seats: [...selectedSeats].map(seat => seat.dataset.seat),
            count: selectedSeats.length,
            price: selectedSeats.length * SEAT_PRICE
        };
        
        // Save seat data to localStorage
        localStorage.setItem('seatSelection', JSON.stringify(seatData));
        
        // Navigate to the food page
        window.location.href = 'food.html';
    });
    
    // Initial calls
    checkUserLoginStatus(); // Run the new login check
    fetchAndMarkBookedSeats();
    updateSummary(); // Initial summary update
});