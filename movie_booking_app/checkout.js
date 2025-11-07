// checkout.js
document.addEventListener('DOMContentLoaded', () => {
    // Get all data from localStorage
    const movieSelection = JSON.parse(localStorage.getItem('movieSelection'));
    const seatSelection = JSON.parse(localStorage.getItem('seatSelection'));
    const foodSelection = JSON.parse(localStorage.getItem('foodSelection'));
    const userEmail = localStorage.getItem('userEmail'); // Get user email if available

    // DOM containers
    const movieSummaryDiv = document.getElementById('movie-summary');
    const seatsSummaryDiv = document.getElementById('seats-summary');
    const foodSummaryDiv = document.getElementById('food-summary');
    const grandTotalSpan = document.getElementById('grand-total');
    const confirmPaymentBtn = document.getElementById('confirm-payment-btn');

    // Payment details input fields
    const cardNumberInput = document.getElementById('card-number');
    const cardNameInput = document.getElementById('card-name');
    const expiryMonthInput = document.getElementById('expiry-month');
    const expiryYearInput = document.getElementById('expiry-year');
    const cvvInput = document.getElementById('cvv');

    // Modal elements
    const confirmationModal = document.getElementById('confirmation-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalMessage = document.getElementById('modal-message');
    const modalOkBtn = document.getElementById('modal-ok-btn');
    const closeButton = document.querySelector('.close-button');

    let grandTotal = 0;

    // Function to safely check if a value is a string
    const isString = (value) => typeof value === 'string' || value instanceof String;
    
    // Function to calculate grand total
    function calculateGrandTotal() {
        const seatPrice = seatSelection ? parseFloat(seatSelection.price) : 0;
        const foodTotal = foodSelection ? parseFloat(foodSelection.total) : 0;
        grandTotal = seatPrice + foodTotal;
        grandTotalSpan.textContent = `RM ${grandTotal.toFixed(2)}`;
    }

    // Function to render movie summary
    function renderMovieSummary() {
        let content = '<h2>🎞️ Movie & Showtime</h2>';
        if (movieSelection) {
            content += `<div class="order-item">Movie: <span>${movieSelection.movie}</span></div>`;
            content += `<div class="order-item">Location: <span>${movieSelection.location}</span></div>`;
            content += `<div class="order-item">Date: <span>${movieSelection.date || 'N/A'}</span></div>`;
            content += `<div class="order-item">Time: <span>${movieSelection.time}</span></div>`;
        } else {
            content += '<div class="order-item">No movie selected. Please go back to the <a href="index.html">home page</a>.</div>';
        }
        movieSummaryDiv.innerHTML = content;
    }

    // Function to render seats summary
    function renderSeatsSummary() {
        let content = '<h2>💺 Seats</h2>';
        if (seatSelection && seatSelection.seats && seatSelection.seats.length > 0) {
            content += `<div class="order-item">Selected Seats: <span>${seatSelection.seats.join(', ')}</span></div>`;
            content += `<div class="order-item">Seats Count: <span>${seatSelection.count || seatSelection.seats.length}</span></div>`;
            content += `<div class="order-item">Seats Price: <span>RM ${(seatSelection.price || 0).toFixed(2)}</span></div>`;
        } else {
            content += '<div class="order-item">No seats selected. Please go back to the <a href="seats.html">seat selection page</a>.</div>';
        }
        seatsSummaryDiv.innerHTML = content;
    }

    // Function to render food summary
    function renderFoodSummary() {
        let content = '<h2>🍿 Food & Drinks</h2>';
        if (foodSelection && foodSelection.items && foodSelection.items.length > 0) {
            foodSelection.items.forEach(item => {
                const name = isString(item) ? item : (item.name || 'Unknown Item');
                const price = item.price ? parseFloat(item.price).toFixed(2) : '0.00';
                content += `<div class="order-item">${name}: <span>RM ${price}</span></div>`;
            });
            content += `<div class="order-item">Food Total: <span>RM ${(foodSelection.total || 0).toFixed(2)}</span></div>`;
        } else {
            content += '<div class="order-item">No food or drinks selected.</div>';
        }
        foodSummaryDiv.innerHTML = content;
    }

    // Function to show the custom modal
    function showModal(title, message, isSuccess) {
        modalTitle.textContent = title;
        modalMessage.innerHTML = message;
        
        if (isSuccess) {
            modalTitle.style.color = '#00ccff';
            modalOkBtn.style.backgroundColor = '#00ccff';
            modalOkBtn.style.color = '#000000';
            modalOkBtn.onclick = () => { 
                confirmationModal.style.display = 'none'; 
                localStorage.removeItem('movieSelection');
                localStorage.removeItem('seatSelection');
                localStorage.removeItem('foodSelection');
                window.location.href = 'index.html';
            };
        } else {
            modalTitle.style.color = '#ff4d4d';
            modalOkBtn.style.backgroundColor = '#ff4d4d';
            modalOkBtn.style.color = '#ffffff';
            modalOkBtn.onclick = () => {
                confirmationModal.style.display = 'none';
            };
        }
        
        confirmationModal.style.display = 'block';
    }

    // Function to validate payment fields
    function validatePaymentDetails(cardNumber, cardName, expiryMonth, expiryYear, cvv) {
        if (!cardNumber || !cardName || !expiryMonth || !expiryYear || !cvv) {
            return { isValid: false, message: 'All payment fields are required.' };
        }

        const strippedCardNumber = cardNumber.replace(/\s/g, '');
        if (!/^\d{16}$/.test(strippedCardNumber)) {
             return { isValid: false, message: 'Invalid card number. Must be 16 digits.' };
        }
        
        if (cardName.trim().length < 2) {
            return { isValid: false, message: 'Invalid cardholder name.' };
        }

        const currentYear = new Date().getFullYear() % 100;
        const currentMonth = new Date().getMonth() + 1;
        const month = parseInt(expiryMonth, 10);
        const year = parseInt(expiryYear, 10);

        if (isNaN(month) || month < 1 || month > 12) {
             return { isValid: false, message: 'Invalid expiry month (MM).' };
        }
        
        if (isNaN(year) || year < currentYear) {
            return { isValid: false, message: 'Invalid expiry year (YY).' };
        }

        if (year === currentYear && month < currentMonth) {
            return { isValid: false, message: 'Card has expired.' };
        }
        
        if (!/^\d{3,4}$/.test(cvv)) {
            return { isValid: false, message: 'Invalid CVV. Must be 3 or 4 digits.' };
        }

        return { isValid: true };
    }

    // Event listener for card number formatting
    cardNumberInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.match(/.{1,4}/g)?.join(' ') || '';
        e.target.value = value;
    });

    // Initial render and calculation
    if (movieSelection && seatSelection) {
        renderMovieSummary();
        renderSeatsSummary();
        renderFoodSummary();
        calculateGrandTotal();
        confirmPaymentBtn.disabled = false;
    } else {
        confirmPaymentBtn.disabled = true;
        showModal('Missing Data', 'Essential booking data is missing. Please restart the booking process from the <a href="index.html">home page</a>.', false);
    }
    
    closeButton.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });
    
    window.addEventListener('click', (e) => {
        if (e.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });

    // Event listener for confirm payment button
    confirmPaymentBtn.addEventListener('click', () => {
        const cardNumber = cardNumberInput.value.replace(/\s/g, '');
        const cardName = cardNameInput.value;
        const expiryMonth = expiryMonthInput.value;
        const expiryYear = expiryYearInput.value;
        const cvv = cvvInput.value;

        const validation = validatePaymentDetails(cardNumber, cardName, expiryMonth, expiryYear, cvv);
        
        if (!validation.isValid) {
            showModal('Validation Error', validation.message, false);
            return;
        }

        // Data payload to send to the server
        const orderData = {
            userEmail: userEmail || 'guest@example.com',
            movie: movieSelection,
            seats: seatSelection,
            food: foodSelection || { items: [], total: 0 },
            total: grandTotal,
            paymentDetails: {
                cardNumber: cardNumber,
                cardName: cardName,
                expiryMonth: expiryMonth,
                expiryYear: expiryYear,
                cvv: cvv
            }
        };

        // Use fetch to send the data to your save_booking.php script
        fetch('save_booking.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(orderData),
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Backend Response:', data);
            if(data.status === 'success') {
                showModal('Booking Confirmed!', '✅ Your booking has been confirmed! Enjoy your movie 🎉', true);
            } else {
                showModal('Booking Failed', data.message || 'There was an error processing your order. Please try again.', false);
            }
        })
        .catch((error) => {
            console.error('Error during checkout submission:', error);
            showModal('Error', `An error occurred: ${error.message}. Please check the console for details.`, false);
        });
    });
});