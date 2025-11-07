document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const foodMenu = document.getElementById('food-menu');
    const foodTotalSpan = document.getElementById('food-total');
    const checkoutBtn = document.getElementById('checkout-btn');
    
    let selectedFood = [];
    let foodTotal = 0.0;
    
    // --- NEW: Login Check ---
    const loggedInUser = localStorage.getItem('loggedInUser');

    function checkUserLoginStatus() {
        if (!loggedInUser) {
            alert('You must be signed in to access the Food & Drinks page.');
            window.location.href = 'login.html'; // Redirect to login page
            return false;
        }
        return true;
    }
    
    // Immediately check login status
    if (!checkUserLoginStatus()) {
        return; // Stop execution if not logged in
    }
    // --- END NEW: Login Check ---


    /**
     * Updates the total price of selected food items.
     */
    function updateFoodTotal() {
        foodTotal = selectedFood.reduce((total, item) => total + parseFloat(item.price), 0);
        foodTotalSpan.textContent = `RM ${foodTotal.toFixed(2)}`;

        // Enable or disable the checkout button based on total
        checkoutBtn.disabled = foodTotal === 0 && selectedFood.length === 0;
    }

    // Event listener for food item clicks
    foodMenu.addEventListener('click', (e) => {
        const foodItem = e.target.closest('.food-item');

        if (foodItem) {
            foodItem.classList.toggle('selected');
            const name = foodItem.dataset.name;
            const price = foodItem.dataset.price;

            // Check if item is already selected
            const selectedIndex = selectedFood.findIndex(item => item.name === name);

            if (selectedIndex > -1) {
                // If it is, remove it
                selectedFood.splice(selectedIndex, 1);
            } else {
                // If it's not, add it
                selectedFood.push({ name, price });
            }
            
            updateFoodTotal();
        }
    });

    // Event listener for checkout button
    checkoutBtn.addEventListener('click', () => {
        // Allow checkout even if no food is selected (foodTotal=0.0)
        
        const foodData = {
            items: selectedFood,
            total: foodTotal
        };

        // Save food data to localStorage
        localStorage.setItem('foodSelection', JSON.stringify(foodData));

        // Navigate to the checkout page
        window.location.href = 'checkout.html';
    });
    
    // Initial calls
    updateFoodTotal();
});