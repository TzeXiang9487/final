document.addEventListener("DOMContentLoaded", () => {

    let moviesData = {};
    // Tab navigation elements
    const bookingsTab = document.getElementById("bookings-tab");
    const moviesTab = document.getElementById("movies-tab");
    const bookingsSlide = document.getElementById("bookings-slide");
    const moviesSlide = document.getElementById("movies-slide");
   
    // Movie management elements
    const movieCardList = document.getElementById("movie-card-list");
    const movieManagementMessage = document.getElementById("movie-management-message");


    // ========== OLD BOOKING RECORD FEATURES ==========
    const bookingsTableBody = document.querySelector('#bookings-table tbody');
    const loadingMessage = document.getElementById('loading-message');
    const errorMessage = document.getElementById('error-message');
    const noBookingsMessage = document.getElementById('no-bookings-message');
    const searchInput = document.getElementById('search-bookings');
    const dateFilter = document.getElementById('date-filter');
    const modal = document.getElementById('confirmation-modal');
    const confirmBtn = document.getElementById('confirm-delete');
    const cancelBtn = document.getElementById('cancel-delete');


    let bookingToDelete = null;
    let lastFetchedBookings = [];


    // Utility function to check if a value is a string
    const isString = (value) => typeof value === 'string' || value instanceof String;


    // Function to format date for display (convert to YYYY-MM-DD)
    function formatDateForDisplay(dateString) {
        if (!dateString) return 'N/A';
       
        console.log('Original date string:', dateString);
       
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            console.log('Already YYYY-MM-DD format:', dateString);
            return dateString;
        }
       
        // Handle formats like "Mon, 30/9", "Sat, 28/9", etc.
        const match = dateString.match(/(\w+), (\d+)\/(\d+)/);
        if (match) {
            const [, dayName, day, month] = match;
            const currentYear = new Date().getFullYear();
            const formattedDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            console.log('Converted from display format:', dateString, '->', formattedDate);
            return formattedDate;
        }
       
        // Try to parse as Date object
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const formattedDate = date.toISOString().split('T')[0];
            console.log('Converted from Date object:', dateString, '->', formattedDate);
            return formattedDate;
        }
       
        console.log('Could not parse date, returning original:', dateString);
        return dateString;
    }


    // Function to normalize date for filtering comparison
    function normalizeDate(dateString) {
        if (!dateString) return '';
       
        console.log('Normalizing date for filter:', dateString);
       
        // If it's already in YYYY-MM-DD format, return as is
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            console.log('Filter: Already YYYY-MM-DD format:', dateString);
            return dateString;
        }
       
        // Handle formats like "Mon, 30/9", "Sat, 28/9", etc.
        const match = dateString.match(/(\w+), (\d+)\/(\d+)/);
        if (match) {
            const [, dayName, day, month] = match;
            const currentYear = new Date().getFullYear();
            const formattedDate = `${currentYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            console.log('Filter: Converted from display format:', dateString, '->', formattedDate);
            return formattedDate;
        }
       
        // Try to parse as Date object
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            const formattedDate = date.toISOString().split('T')[0];
            console.log('Filter: Converted from Date object:', dateString, '->', formattedDate);
            return formattedDate;
        }
       
        console.log('Filter: Could not parse date, returning original:', dateString);
        return dateString;
    }


    // Function to render the bookings table
    function displayBookings(bookings) {
        bookingsTableBody.innerHTML = '';
        if (!bookings || bookings.length === 0) {
            noBookingsMessage.style.display = 'block';
            return;
        }
        noBookingsMessage.style.display = 'none';


        bookings.forEach(b => {
            const row = bookingsTableBody.insertRow();
            row.insertCell().textContent = b.id || '';
            row.insertCell().textContent = b.user_email || 'N/A';
            row.insertCell().textContent = b.movie_name || '';
            row.insertCell().textContent = b.location || '';
            row.insertCell().textContent = b.time || '';
           
            // Format date for display (YYYY-MM-DD)
            const displayDate = formatDateForDisplay(b.selected_date);
            row.insertCell().textContent = displayDate;
           
            // Seats List
            const seatsList = Array.isArray(b.seats_list) ? b.seats_list.join(', ') : (b.seats_list || '');
            row.insertCell().textContent = seatsList;
           
            // Food Items
            const foodItems = Array.isArray(b.food_items)
                ? b.food_items.map(fi => isString(fi) ? fi : (fi.name || 'N/A')).join(', ')
                : 'None';
            row.insertCell().textContent = foodItems;


            // Total Price
            const total = parseFloat(b.grand_total || 0).toFixed(2);
            row.insertCell().textContent = `RM ${total}`;
           
            // Cardholder Name
            row.insertCell().textContent = b.cardholder_name || 'N/A';
           
            // Card Number (Masked)
            row.insertCell().textContent = b.card_number_masked || 'N/A';
           
            // Actions
            const actionCell = row.insertCell();
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('action-btn', 'delete-btn');
            deleteButton.onclick = () => showDeleteConfirmation(b.id);
            actionCell.appendChild(deleteButton);
        });
    }


    // Function to fetch all bookings from the server
    async function fetchBookings() {
        loadingMessage.style.display = 'block';
        errorMessage.style.display = 'none';
        noBookingsMessage.style.display = 'none';
        bookingsTableBody.innerHTML = '';
       
        try {
            const response = await fetch('fetch_bookings.php');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();


            if (data.status === 'success') {
                lastFetchedBookings = data.bookings;
                console.log('Fetched bookings:', lastFetchedBookings);
                displayBookings(lastFetchedBookings);
                loadingMessage.style.display = 'none';
            } else {
                errorMessage.textContent = data.message || 'Failed to fetch bookings.';
                errorMessage.style.display = 'block';
                loadingMessage.style.display = 'none';
            }
        } catch (error) {
            console.error('Error fetching bookings:', error);
            errorMessage.textContent = `Error: Could not connect to the booking service. (${error.message})`;
            errorMessage.style.display = 'block';
            loadingMessage.style.display = 'none';
        }
    }


    // Function to show the delete confirmation modal
    function showDeleteConfirmation(bookingId) {
        bookingToDelete = bookingId;
        modal.style.display = 'block';
    }


    // Function to delete a booking
    async function deleteBooking(id) {
        modal.style.display = 'none';
       
        try {
            const response = await fetch(`delete_booking.php?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });
           
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
           
            const data = await response.json();


            if (data.status === 'success') {
                alert('Booking successfully deleted!');
                fetchBookings(); // Refresh the table
            } else {
                alert(`Deletion failed: ${data.message}`);
            }
           
        } catch (error) {
            console.error('Error deleting booking:', error);
            alert(`An error occurred during deletion: ${error.message}`);
        }
       
        bookingToDelete = null;
    }


    // Function to filter bookings based on search term and date
    function filterBookings(searchTerm, dateValue) {
        const t = (searchTerm || '').toLowerCase();
        const dateVal = dateValue || '';


        console.log('=== FILTERING START ===');
        console.log('Search term:', t);
        console.log('Date filter value:', dateVal);
        console.log('Total bookings to filter:', lastFetchedBookings.length);


        const filtered = lastFetchedBookings.filter(b => {
            const seats = (Array.isArray(b.seats_list) ? b.seats_list.join(' ') : (b.seats_list || '')).toLowerCase();
            const food = (Array.isArray(b.food_items) ? b.food_items.map(fi => (isString(fi) ? fi : (fi.name || ''))).join(' ') : '').toLowerCase();
            const base = `${b.movie_name || ''} ${b.location || ''} ${b.user_email || ''} ${b.cardholder_name || ''} ${seats} ${food}`.toLowerCase();
           
            // Date filtering
            let dateOK = true;
            if (dateVal) {
                const bookingDate = normalizeDate(b.selected_date);
                const filterDate = normalizeDate(dateVal);
                console.log('Date comparison - Booking:', b.selected_date, '->', bookingDate, 'Filter:', dateVal, '->', filterDate, 'Match:', bookingDate === filterDate);
                dateOK = bookingDate === filterDate;
            }
           
            const termOK = !t || base.includes(t);
            console.log('Booking ID:', b.id, 'Date OK:', dateOK, 'Term OK:', termOK);
            return dateOK && termOK;
        });
       
        console.log('Filtered results:', filtered.length, 'bookings');
        console.log('=== FILTERING END ===');
       
        displayBookings(filtered);
    }


    // Function to clear date filter
    function clearDateFilter() {
        if (dateFilter) {
            dateFilter.value = '';
            filterBookings(searchInput?.value || '', '');
        }
    }


    // Add clear button for date filter
function addClearDateFilter() {
    const dateFilterContainer = dateFilter.parentElement;

    if (dateFilterContainer.querySelector('.clear-date-btn')) {
        return;
    }

    const clearButton = document.createElement('button');
    clearButton.textContent = 'Clear';
    clearButton.classList.add('clear-date-btn');
    clearButton.style.marginLeft = '10px';
    clearButton.style.padding = '5px 10px';
    clearButton.style.backgroundColor = '#666';
    clearButton.style.color = 'white';
    clearButton.style.border = 'none';
    clearButton.style.borderRadius = '4px';
    clearButton.style.cursor = 'pointer';

    clearButton.addEventListener('click', clearDateFilter, { once: true });
    dateFilterContainer.appendChild(clearButton);
}



    // Initialize booking features
    function initializeBookingFeatures() {
        fetchBookings();
        addClearDateFilter();


        // Event listeners for filtering and deletion
        if (searchInput) searchInput.addEventListener('input', e => filterBookings(e.target.value, dateFilter?.value || ''));
        if (dateFilter) dateFilter.addEventListener('change', e => filterBookings(searchInput?.value || '', e.target.value));


        if (confirmBtn) confirmBtn.addEventListener('click', () => { if (bookingToDelete) deleteBooking(bookingToDelete); });
        if (cancelBtn) cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; bookingToDelete = null; });
        window.addEventListener('click', e => { if (e.target === modal) { modal.style.display = 'none'; bookingToDelete = null; } });
    }


    // ========== NEW MOVIE MANAGEMENT FEATURES ==========
   
// 🔹 Utility function: Always return array safely
const toArray = (data) => {
    if (Array.isArray(data)) return data;
    if (data === null || data === undefined) return [];
    if (typeof data === "object") return Object.values(data);
    try {
        const parsed = JSON.parse(data);
        return Array.isArray(parsed) ? parsed : Object.values(parsed);
    } catch {
        return [];
    }
};

async function fetchMovies(noCache = false) {
    try {
        const url = noCache ? `movie_data.json?t=${Date.now()}` : "movie_data.json";
        const res = await fetch(url);
        const data = await res.json();
        
        // ADD THIS LINE to store movies data globally
        moviesData = data;
        
        const movies = Array.isArray(data) ? data : Object.entries(data);
        console.log("Movies Data:", movies);

        movieCardList.innerHTML = `
            <div class="movie-card add-new-card" id="open-add-movie-modal">
                <span class="add-icon">+</span>
                <h3>Add New Movie</h3>
            </div>
        `;

        movies.forEach(([title, movie]) => {
            movieCardList.innerHTML += `
                <div class="movie-card">
                    <button class="delete-card-btn" data-title="${title}">×</button>
                    <img src="${movie.image}" alt="${title}" style="cursor: pointer;">
                    <h3>${title}</h3>
                    ${movie.rating ? `<div class="movie-rating">⭐ ${movie.rating}/10</div>` : ''}
                    <p>${movie.description}</p>
                    ${movie.labels && movie.labels.length > 0 ? `
                        <div class="movie-labels">
                            ${movie.labels.map(label => `<span class="label-tag">${label}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `;
        });

        attachMovieEventListeners();
        
        // ADD THIS LINE to attach click events to movie images
        attachMovieImageClickEvents();
        
    } catch (err) {
        console.error("Error fetching movies:", err);
        movieManagementMessage.textContent = "Failed to load movie list.";
    }
}

// 🔹 Attach all movie-related event listeners
function attachMovieEventListeners() {
    const addMovieModal = document.getElementById("add-movie-modal");
    const deleteModal = document.getElementById("delete-modal");
    const openAddMovieModalBtn = document.getElementById("open-add-movie-modal");
    const closeAddMovieModalBtn = document.getElementById("close-add-movie-modal");
    const addMovieForm = document.getElementById("add-movie-form");
    const modalAddMessage = document.getElementById("modal-add-message");

    const closeDeleteModalBtn = document.getElementById("close-delete-modal");
    const confirmDeleteBtn = document.getElementById("confirm-delete-btn");
    const cancelDeleteBtn = document.getElementById("cancel-delete-btn");
    const deleteMovieTitle = document.getElementById("delete-movie-title");

    // Edit modal event listeners
    const editModal = document.getElementById("edit-movie-modal");
    const closeEditModalBtn = document.getElementById("close-edit-movie-modal");
    const editMovieForm = document.getElementById("edit-movie-form");

    if (closeEditModalBtn) {
        closeEditModalBtn.addEventListener("click", () => {
            editModal.style.display = "none";
        });
    }

    if (editMovieForm) {
        editMovieForm.addEventListener("submit", handleEditMovie);
    }

    // Close edit modal when clicking outside
    window.addEventListener("click", (e) => {
        if (e.target === editModal) editModal.style.display = "none";
    });

    let movieToDelete = null;

    // Open "Add Movie" modal
    if (openAddMovieModalBtn) {
        openAddMovieModalBtn.addEventListener("click", () => {
            addMovieModal.style.display = "flex";
            modalAddMessage.textContent = "";
            addMovieForm.reset();
        });
    }

    // Close "Add Movie" modal
    if (closeAddMovieModalBtn) {
        closeAddMovieModalBtn.addEventListener("click", () => {
            addMovieModal.style.display = "none";
        });
    }

    // Handle Add Movie form submission
    if (addMovieForm) {
        addMovieForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const formData = new FormData(addMovieForm);
            const movieData = Object.fromEntries(formData.entries());

            try {
                const response = await fetch("movie_api.php", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(movieData),
                });

                const data = await response.json();
                if (data.status === "success") {
                    modalAddMessage.textContent = "✅ Movie added successfully!";
                    setTimeout(() => {
                        addMovieModal.style.display = "none";
                        fetchMovies(true);
                    }, 800);
                } else {
                    modalAddMessage.textContent = "❌ " + (data.message || "Failed to add movie.");
                }
            } catch (err) {
                modalAddMessage.textContent = "⚠️ Network error adding movie.";
                console.error("Add movie error:", err);
            }
        });
    }

    // Delete movie logic
    document.querySelectorAll(".delete-card-btn").forEach((btn) => {
        btn.addEventListener("click", () => {
            movieToDelete = btn.dataset.title;
            deleteMovieTitle.textContent = movieToDelete;
            deleteModal.style.display = "flex";
        });
    });

    // Confirm delete
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener("click", async () => {
            if (!movieToDelete) return;
            try {
                const res = await fetch(`movie_api.php?title=${encodeURIComponent(movieToDelete)}`, {
                    method: "DELETE",
                });
                const data = await res.json();
                if (data.status === "success") {
                    const deletedCard = document.querySelector(
                        `.delete-card-btn[data-title="${movieToDelete}"]`
                    )?.closest(".movie-card");
                    if (deletedCard) deletedCard.remove();

                    alert(`✅ ${movieToDelete} deleted successfully.`);
                    setTimeout(() => fetchMovies(true), 500);
                } else {
                    alert(`❌ ${data.message || "Failed to delete movie."}`);
                }
            } catch (err) {
                alert("⚠️ Error deleting movie.");
                console.error(err);
            } finally {
                deleteModal.style.display = "none";
                movieToDelete = null;
            }
        });
    }

    // Cancel delete
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener("click", () => {
            deleteModal.style.display = "none";
            movieToDelete = null;
        });
    }

    // Close delete modal (× button)
    if (closeDeleteModalBtn) {
        closeDeleteModalBtn.addEventListener("click", () => {
            deleteModal.style.display = "none";
            movieToDelete = null;
        });
    }

    // Click outside modal to close
    window.addEventListener("click", (e) => {
        if (e.target === addMovieModal) addMovieModal.style.display = "none";
        if (e.target === deleteModal) deleteModal.style.display = "none";
    });
}

// Edit movie functionality
function openEditMovieModal(title, movieData) {
    const editModal = document.getElementById("edit-movie-modal");
    const editForm = document.getElementById("edit-movie-form");
    const editMessage = document.getElementById("modal-edit-message");
    
    // Fill form with existing data
    document.getElementById("edit-original-title").value = title;
    document.getElementById("edit-title").value = title;
    document.getElementById("edit-description").value = movieData.description;
    document.getElementById("edit-trailer").value = movieData.trailer;
    document.getElementById("edit-image").value = movieData.image;
    document.getElementById("edit-rating").value = movieData.rating || '';
    document.getElementById("edit-labels").value = movieData.labels ? movieData.labels.join(', ') : '';
    
    editMessage.textContent = "";
    editModal.style.display = "flex";
}

// Handle edit form submission
async function handleEditMovie(e) {
    e.preventDefault();
    const formData = new FormData(document.getElementById("edit-movie-form"));
    const movieData = Object.fromEntries(formData.entries());
    const originalTitle = movieData.original_title;
    
    const editMessage = document.getElementById("modal-edit-message");
    
    try {
        const response = await fetch("movie_api.php", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                original_title: originalTitle,
                ...movieData
            }),
        });
        
        const data = await response.json();
        if (data.status === "success") {
            editMessage.textContent = "✅ Movie updated successfully!";
            setTimeout(() => {
                document.getElementById("edit-movie-modal").style.display = "none";
                fetchMovies(true); // Refresh the movie list
            }, 800);
        } else {
            editMessage.textContent = "❌ " + (data.message || "Failed to update movie.");
        }
    } catch (err) {
        editMessage.textContent = "⚠️ Network error updating movie.";
        console.error("Edit movie error:", err);
    }
}

// Add click event to movie images for editing
function attachMovieImageClickEvents() {
    document.querySelectorAll(".movie-card img").forEach(img => {
        img.style.cursor = "pointer";
        img.addEventListener("click", function() {
            const movieCard = this.closest(".movie-card");
            const title = movieCard.querySelector("h3").textContent;
            
            if (moviesData && moviesData[title]) {
                openEditMovieModal(title, moviesData[title]);
            }
        });
    });
}

// Handle tab switching
[bookingsTab, moviesTab, document.getElementById('upload-tab')].forEach((tab) => {
    if (tab) {
        tab.addEventListener("click", () => {
            document.querySelectorAll(".nav-tab").forEach((t) => t.classList.remove("active"));
            document.querySelectorAll(".admin-slide").forEach((s) => s.classList.remove("active"));
            tab.classList.add("active");
            document.getElementById(tab.dataset.target).classList.add("active");

            if (tab.id === "bookings-tab") initializeBookingFeatures();
            if (tab.id === "movies-tab") fetchMovies(true);
        });
    }
});

// 🔹 Initial load
initializeBookingFeatures();

});

// ========== UPLOAD IMAGE FUNCTIONS ==========
// THESE FUNCTIONS ARE NOW GLOBALLY AVAILABLE
async function previewUploadImage() {
    const imageUrl = document.getElementById('image-url-input').value.trim();
    const previewContainer = document.getElementById('uploadPreview');
    const previewImage = document.getElementById('uploadPreviewImage');
    const uploadMessage = document.getElementById('upload-message');
    
    if (!imageUrl) {
        uploadMessage.textContent = '❌ Please enter an image URL';
        uploadMessage.style.color = '#ff4444';
        return;
    }
    
    // Show loading state
    previewImage.src = '';
    previewContainer.style.display = 'block';
    previewImage.alt = 'Loading...';
    uploadMessage.textContent = '⏳ Loading image...';
    uploadMessage.style.color = '#00ccff';
    
    // Test if image loads successfully with CORS handling
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = function() {
        previewImage.src = imageUrl;
        previewImage.alt = 'Image Preview';
        uploadMessage.textContent = '✅ Image loaded successfully! Click "Upload" to save.';
        uploadMessage.style.color = '#00ff00';
    };
    
    img.onerror = function() {
        previewImage.alt = 'Failed to load image';
        uploadMessage.textContent = '❌ Could not load image due to CORS restrictions. The upload might still work.';
        uploadMessage.style.color = '#ff9900';
        
        previewImage.src = imageUrl;
        previewImage.alt = 'Image may not preview due to CORS';
    };
    
    img.src = imageUrl;
}

async function uploadImage() {
    const imageUrl = document.getElementById('image-url-input').value.trim();
    const uploadMessage = document.getElementById('upload-message');
    
    if (!imageUrl) {
        uploadMessage.textContent = '❌ Please enter an image URL first';
        uploadMessage.style.color = '#ff4444';
        return;
    }
    
    uploadMessage.textContent = '⏳ Uploading image...';
    uploadMessage.style.color = '#00ccff';
    
    try {
        const formData = new FormData();
        formData.append('image_url', imageUrl);
        
        const response = await fetch('upload_image.php', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        if (data.status === 'success') {
            // Update the copy button to copy the full path
            updateCopyButton(data.path);
            
            uploadMessage.textContent = `✅ ${data.message}`;
            uploadMessage.style.color = '#00ff00';
            
            // Auto-copy the full path to clipboard
            await navigator.clipboard.writeText(data.path);
            
            setTimeout(() => {
                uploadMessage.textContent = `✅ ${data.message} Path copied: ${data.path}`;
                alert(`Image uploaded successfully!\nPath: ${data.path}\n\nFull path has been copied to clipboard!`);
            }, 500);
            
            document.getElementById('image-url-input').value = '';
            document.getElementById('uploadPreview').style.display = 'none';
            
        } else {
            uploadMessage.textContent = `❌ ${data.message}`;
            uploadMessage.style.color = '#ff4444';
        }
    } catch (error) {
        console.error('Upload error:', error);
        uploadMessage.textContent = '❌ Network error during upload';
        uploadMessage.style.color = '#ff4444';
    }
}

// Function to update the copy button with the uploaded image path
function updateCopyButton(fullPath) {
    const pathBtn = document.querySelector('.path-btn');
    if (pathBtn) {
        // Extract filename from full path for display
        const filename = fullPath.split('/').pop();
        pathBtn.textContent = `Copy Path: ${filename}`;
        pathBtn.setAttribute('data-full-path', fullPath);
        pathBtn.onclick = function() {
            copyFullImagePath(fullPath);
        };
    }
}

// Function to copy the full image path
function copyFullImagePath(fullPath) {
    navigator.clipboard.writeText(fullPath).then(() => {
        const uploadMessage = document.getElementById('upload-message');
        uploadMessage.textContent = `✅ Full path copied: ${fullPath}`;
        uploadMessage.style.color = '#00ff00';
        setTimeout(() => {
            alert(`Full path copied to clipboard!\n${fullPath}`);
        }, 100);
    });
}

// Keep the original copyImagePath function for the base path
function copyImagePath() {
    const basePath = 'image/movie/';
    navigator.clipboard.writeText(basePath).then(() => {
        const uploadMessage = document.getElementById('upload-message');
        uploadMessage.textContent = `✅ Base path copied: ${basePath}`;
        uploadMessage.style.color = '#00ff00';
        setTimeout(() => {
            alert(`Base path "${basePath}" copied to clipboard!`);
        }, 100);
    });
}

function copyImagePath() {
    const basePath = 'image/';
    navigator.clipboard.writeText(basePath).then(() => {
        const uploadMessage = document.getElementById('upload-message');
        uploadMessage.textContent = `✅ Base path copied: ${basePath}`;
        uploadMessage.style.color = '#00ff00';
        setTimeout(() => {
            alert(`Base path "${basePath}" copied to clipboard!`);
        }, 100);
    });
}

// Add Enter key support for image URL input
document.addEventListener('DOMContentLoaded', function() {
    const imageUrlInput = document.getElementById('image-url-input');
    if (imageUrlInput) {
        imageUrlInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                previewUploadImage();
            }
        });
    }
});

// Edit movie functionality
function openEditMovieModal(title, movieData) {
    const editModal = document.getElementById("edit-movie-modal");
    const editForm = document.getElementById("edit-movie-form");
    const editMessage = document.getElementById("modal-edit-message");
    
    // Fill form with existing data
    document.getElementById("edit-original-title").value = title;
    document.getElementById("edit-title").value = title;
    document.getElementById("edit-description").value = movieData.description;
    document.getElementById("edit-trailer").value = movieData.trailer;
    document.getElementById("edit-image").value = movieData.image;
    document.getElementById("edit-rating").value = movieData.rating || '';
    document.getElementById("edit-labels").value = movieData.labels ? movieData.labels.join(', ') : '';
    
    editMessage.textContent = "";
    editModal.style.display = "flex";
}

// Handle edit form submission
async function handleEditMovie(e) {
    e.preventDefault();
    const formData = new FormData(document.getElementById("edit-movie-form"));
    const movieData = Object.fromEntries(formData.entries());
    const originalTitle = movieData.original_title;
    
    const editMessage = document.getElementById("modal-edit-message");
    
    try {
        const response = await fetch("movie_api.php", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                original_title: originalTitle,
                ...movieData
            }),
        });
        
        const data = await response.json();
        if (data.status === "success") {
            editMessage.textContent = "✅ Movie updated successfully!";
            setTimeout(() => {
                document.getElementById("edit-movie-modal").style.display = "none";
                fetchMovies(true); // Refresh the movie list
            }, 800);
        } else {
            editMessage.textContent = "❌ " + (data.message || "Failed to update movie.");
        }
    } catch (err) {
        editMessage.textContent = "⚠️ Network error updating movie.";
        console.error("Edit movie error:", err);
    }
}

// Add click event to movie images for editing
function attachMovieImageClickEvents() {
    document.querySelectorAll(".movie-card img").forEach(img => {
        img.style.cursor = "pointer";
        img.addEventListener("click", function() {
            const movieCard = this.closest(".movie-card");
            const title = movieCard.querySelector("h3").textContent;
            const movieData = window.moviesData ? window.moviesData[title] : null;
            
            if (movieData) {
                openEditMovieModal(title, movieData);
            }
        });
    });
}