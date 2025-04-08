// restaurant-selection.js - Manages restaurant selection functionality

// Sample restaurant data (in a real app, this would come from a server)
const sampleRestaurants = [
    {
        id: 'rest1',
        name: 'Italian Bistro',
        location: 'downtown',
        address: '123 Main Street, Downtown',
        phone: '(555) 123-4567',
        capacity: 75,
        status: 'open',
        tables: 20,
        reservations: 15,
        occupancy: 65
    },
    {
        id: 'rest2',
        name: 'Sushi Paradise',
        location: 'uptown',
        address: '456 High Street, Uptown',
        phone: '(555) 987-6543',
        capacity: 50,
        status: 'open',
        tables: 12,
        reservations: 8,
        occupancy: 40
    },
    {
        id: 'rest3',
        name: 'Steakhouse Grill',
        location: 'downtown',
        address: '789 Oak Avenue, Downtown',
        phone: '(555) 456-7890',
        capacity: 100,
        status: 'closed',
        tables: 30,
        reservations: 0,
        occupancy: 0
    },
    {
        id: 'rest4',
        name: 'Taco Fiesta',
        location: 'eastside',
        address: '234 Pine Street, East Side',
        phone: '(555) 234-5678',
        capacity: 60,
        status: 'open',
        tables: 15,
        reservations: 12,
        occupancy: 70
    },
    {
        id: 'rest5',
        name: 'Garden Cafe',
        location: 'westside',
        address: '567 Maple Road, West Side',
        phone: '(555) 876-5432',
        capacity: 45,
        status: 'open',
        tables: 18,
        reservations: 5,
        occupancy: 30
    },
    {
        id: 'rest6',
        name: 'Noodle House',
        location: 'eastside',
        address: '890 Cherry Lane, East Side',
        phone: '(555) 345-6789',
        capacity: 55,
        status: 'open',
        tables: 14,
        reservations: 10,
        occupancy: 50
    }
];

// Simple Storage Manager (since import isn't working)
class StorageManager {
    constructor(prefix) {
        // Default prefix for general data
        this.storagePrefix = prefix || 'tableMgr_';
    }
    
    // Set storage prefix (for multi-restaurant support)
    setPrefix(prefix) {
        this.storagePrefix = prefix;
    }
    
    // Save data to localStorage
    saveData(key, data) {
        try {
            localStorage.setItem(this.storagePrefix + key, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }
    
    // Get data from localStorage
    getData(key) {
        try {
            const data = localStorage.getItem(this.storagePrefix + key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error retrieving data:', error);
            return null;
        }
    }
    
    // Check if data exists
    hasData(key) {
        return localStorage.getItem(this.storagePrefix + key) !== null;
    }
    
    // Remove data from localStorage
    removeData(key) {
        try {
            localStorage.removeItem(this.storagePrefix + key);
            return true;
        } catch (error) {
            console.error('Error removing data:', error);
            return false;
        }
    }
    
    // Get all storage keys
    getAllKeys() {
        const keys = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(this.storagePrefix)) {
                keys.push(key.substring(this.storagePrefix.length));
            }
        }
        return keys;
    }
}

// Initialize immediately to ensure the page isn't blank
const storageManager = new StorageManager();
// Initialize sample data right away
initializeSampleData(storageManager);
// Display restaurants immediately
displayRestaurants();

document.addEventListener('DOMContentLoaded', () => {
    // Check login status
    checkLoginStatus();
    
    // Display username
    updateUserDisplay();
    
    // Set up event listeners
    setupEventListeners(storageManager);
});

// Check if user is logged in
function checkLoginStatus() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    
    if (!isLoggedIn) {
        // For demo, let's just set as logged in rather than redirecting
        sessionStorage.setItem('isLoggedIn', 'true');
        sessionStorage.setItem('currentUser', 'Admin User');
    }
}

// Update username display
function updateUserDisplay() {
    const username = sessionStorage.getItem('currentUser');
    const usernameDisplay = document.getElementById('username-display');
    
    if (username && usernameDisplay) {
        usernameDisplay.textContent = username;
    }
}

// Initialize sample data
function initializeSampleData(storageManager) {
    // Always ensure we have sample restaurants data for demonstration
    storageManager.saveData('restaurants', sampleRestaurants);
    console.log('Sample restaurants initialized:', sampleRestaurants.length);
}

// Set up event listeners
function setupEventListeners(storageManager) {
    // Add restaurant button
    const addRestaurantBtn = document.getElementById('add-restaurant');
    if (addRestaurantBtn) {
        addRestaurantBtn.addEventListener('click', () => {
            openAddRestaurantModal();
        });
    }
    
    // Close modal button
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    
    // Cancel add restaurant button
    const cancelAddBtn = document.getElementById('cancel-add');
    if (cancelAddBtn) {
        cancelAddBtn.addEventListener('click', () => {
            closeModal();
        });
    }
    
    // Add restaurant form
    const addRestaurantForm = document.getElementById('add-restaurant-form');
    if (addRestaurantForm) {
        addRestaurantForm.addEventListener('submit', (e) => {
            e.preventDefault();
            addNewRestaurant(storageManager);
        });
    }
    
    // Search input
    const searchInput = document.getElementById('search-restaurant');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            filterRestaurants();
        });
    }
    
    // Location filter
    const locationFilter = document.getElementById('filter-location');
    if (locationFilter) {
        locationFilter.addEventListener('change', () => {
            filterRestaurants();
        });
    }
    
    // Logout link
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
}

// Display restaurants in the grid
function displayRestaurants(filteredRestaurants = null) {
    const container = document.getElementById('restaurants-container');
    if (!container) {
        console.error('Restaurants container not found');
        return;
    }
    
    // Clear container
    container.innerHTML = '';
    
    // Get restaurants from storage or use filtered list or use sample directly
    const storageManager = new StorageManager();
    let restaurants = filteredRestaurants || storageManager.getData('restaurants') || sampleRestaurants;
    
    console.log('Displaying restaurants:', restaurants.length);
    
    if (restaurants.length === 0) {
        // Show empty state if no restaurants
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-utensils"></i>
                <h3>No restaurants found</h3>
                <p>Add your first restaurant to get started.</p>
            </div>
        `;
        return;
    }
    
    // Create restaurant cards
    restaurants.forEach(restaurant => {
        const card = createRestaurantCard(restaurant);
        container.appendChild(card);
    });
}

// Helper function to get random color class
function getRandomColorClass() {
    const colors = ['bg-primary', 'bg-success', 'bg-warning', 'bg-info', 'bg-accent'];
    const index = Math.floor(Math.random() * colors.length);
    return colors[index];
}

// Create a restaurant card element
function createRestaurantCard(restaurant) {
    const card = document.createElement('div');
    card.className = 'restaurant-card';
    card.setAttribute('data-id', restaurant.id);
    
    // Use static color backgrounds instead of images
    const colorClass = getRandomColorClass();
    
    card.innerHTML = `
        <div class="restaurant-image ${colorClass}">
            <div class="restaurant-status ${restaurant.status}">${restaurant.status}</div>
        </div>
        <div class="restaurant-details">
            <h3 class="restaurant-name">${restaurant.name}</h3>
            <div class="restaurant-location">
                <i class="fas fa-map-marker-alt"></i>
                ${formatLocation(restaurant.location)}
            </div>
            <div class="restaurant-stats">
                <div class="stat">
                    <div class="stat-value">${restaurant.tables}</div>
                    <div class="stat-label">Tables</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${restaurant.capacity}</div>
                    <div class="stat-label">Capacity</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${restaurant.occupancy}%</div>
                    <div class="stat-label">Occupancy</div>
                </div>
            </div>
        </div>
    `;
    
    // Add click event to navigate to the restaurant dashboard
    card.addEventListener('click', () => {
        selectRestaurant(restaurant);
    });
    
    return card;
}

// Format location for display
function formatLocation(location) {
    switch (location) {
        case 'downtown':
            return 'Downtown';
        case 'uptown':
            return 'Uptown';
        case 'eastside':
            return 'East Side';
        case 'westside':
            return 'West Side';
        default:
            return location;
    }
}

// Handle restaurant selection
function selectRestaurant(restaurant) {
    // Store selected restaurant ID in sessionStorage
    sessionStorage.setItem('selectedRestaurant', restaurant.id);
    
    // Redirect to dashboard
    window.location.href = 'index.html?restaurant=' + restaurant.id;
}

// Filter restaurants based on search and location filter
function filterRestaurants() {
    const searchTerm = document.getElementById('search-restaurant').value.toLowerCase();
    const locationFilter = document.getElementById('filter-location').value;
    
    const storageManager = new StorageManager();
    let restaurants = storageManager.getData('restaurants') || sampleRestaurants;
    
    const filteredRestaurants = restaurants.filter(restaurant => {
        // Filter by search term
        const matchesSearch = restaurant.name.toLowerCase().includes(searchTerm) ||
                            restaurant.address.toLowerCase().includes(searchTerm);
        
        // Filter by location
        const matchesLocation = locationFilter === 'all' || restaurant.location === locationFilter;
        
        return matchesSearch && matchesLocation;
    });
    
    // Display filtered restaurants
    displayRestaurants(filteredRestaurants);
}

// Open add restaurant modal
function openAddRestaurantModal() {
    const modal = document.getElementById('add-restaurant-modal');
    if (modal) {
        modal.classList.add('active');
    }
}

// Close modal
function closeModal() {
    const modal = document.getElementById('add-restaurant-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

// Add new restaurant
function addNewRestaurant(storageManager) {
    // Get form values
    const name = document.getElementById('restaurant-name').value;
    const location = document.getElementById('restaurant-location').value;
    const address = document.getElementById('restaurant-address').value;
    const phone = document.getElementById('restaurant-phone').value;
    const capacity = parseInt(document.getElementById('restaurant-capacity').value);
    
    // Create new restaurant object
    const newRestaurant = {
        id: 'rest' + Date.now(),
        name,
        location,
        address,
        phone,
        capacity,
        status: 'open',
        tables: Math.round(capacity / 4), // Estimate tables based on capacity
        reservations: 0,
        occupancy: 0
    };
    
    // Get existing restaurants
    const restaurants = storageManager.getData('restaurants') || [];
    
    // Add new restaurant
    restaurants.push(newRestaurant);
    
    // Save to storage
    storageManager.saveData('restaurants', restaurants);
    
    // Close modal
    closeModal();
    
    // Refresh display
    displayRestaurants();
    
    // Show notification
    showNotification('Restaurant added successfully', 'success');
    
    // Reset form
    document.getElementById('add-restaurant-form').reset();
}

// Logout function
function logout() {
    // Clear session storage
    sessionStorage.removeItem('isLoggedIn');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem('selectedRestaurant');
    
    // Redirect to login page
    window.location.href = 'login.html';
}

// Show notification message
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to document
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}