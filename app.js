// Main app.js file
import { TableConfigManager } from './tableConfig.js';
import { BookingManager } from './bookingManager.js';
import { DashboardManager } from './dashboard.js';
import { SettingsManager } from './settings.js';
import { StorageManager } from './storage.js';

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Storage Manager
    const storageManager = new StorageManager();
    
    // Check if this is the first time loading the app
    if (!storageManager.hasData('appInitialized')) {
        // Initialize with default data
        initializeDefaultData(storageManager);
    }
    
    // Initialize modules
    const tableConfigManager = new TableConfigManager(storageManager);
    const bookingManager = new BookingManager(storageManager, tableConfigManager);
    const dashboardManager = new DashboardManager(storageManager, tableConfigManager, bookingManager);
    const settingsManager = new SettingsManager(storageManager);
    
    // Set up navigation
    setupNavigation();
    
    // Set up theme toggle
    setupThemeToggle();
    
    // Set up sidebar toggle
    setupSidebarToggle();
    
    // Initialize active module based on URL or default to dashboard
    const activeModule = getActiveModuleFromUrl() || 'dashboard';
    activateModule(activeModule);
    
    // Update stats and floor view on load
    dashboardManager.updateStats();
    dashboardManager.renderFloorView();
    dashboardManager.updateUpcomingReservations();
});

// Initialize app with default data
function initializeDefaultData(storageManager) {
    // Default restaurant info
    const defaultRestaurantInfo = {
        name: 'Restaurant Name',
        openingTime: '10:00',
        closingTime: '22:00',
        reservationDuration: 90
    };
    
    // Default tables
    const defaultTables = [
        {
            id: 'T1',
            shape: 'round',
            capacity: 2,
            x: 50,
            y: 50,
            width: 60,
            height: 60,
            section: 'main',
            isVip: false
        },
        {
            id: 'T2',
            shape: 'square',
            capacity: 4,
            x: 150,
            y: 50,
            width: 80,
            height: 80,
            section: 'main',
            isVip: false
        },
        {
            id: 'T3',
            shape: 'rectangle',
            capacity: 6,
            x: 50,
            y: 150,
            width: 100,
            height: 60,
            section: 'main',
            isVip: true
        }
    ];
    
    // Default bookings (today's date)
    const today = new Date();
    const formattedDate = formatDate(today);
    
    const defaultBookings = [
        {
            id: 'B1',
            guestName: 'John Doe',
            phone: '555-1234',
            email: 'john@example.com',
            date: formattedDate,
            time: '18:00',
            partySize: 2,
            duration: 90,
            tableId: 'T1',
            specialRequests: 'Window seat preferred',
            status: 'confirmed'
        },
        {
            id: 'B2',
            guestName: 'Jane Smith',
            phone: '555-5678',
            email: 'jane@example.com',
            date: formattedDate,
            time: '19:30',
            partySize: 4,
            duration: 90,
            tableId: 'T2',
            specialRequests: '',
            status: 'confirmed'
        }
    ];
    
    // Default table statuses
    const defaultTableStatuses = [
        {
            tableId: 'T1',
            status: 'reserved',
            reservation: 'B1'
        },
        {
            tableId: 'T2',
            status: 'reserved',
            reservation: 'B2'
        },
        {
            tableId: 'T3',
            status: 'available',
            reservation: null
        }
    ];
    
    // Save default data to storage
    storageManager.saveData('restaurantInfo', defaultRestaurantInfo);
    storageManager.saveData('tables', defaultTables);
    storageManager.saveData('bookings', defaultBookings);
    storageManager.saveData('tableStatuses', defaultTableStatuses);
    storageManager.saveData('appInitialized', true);
}

// Helper function to format date as YYYY-MM-DD
function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Set up navigation between sections
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const target = item.getAttribute('data-target');
            activateModule(target);
            
            // Update URL without reloading the page
            history.pushState({}, '', `?module=${target}`);
        });
    });
}

// Activate the specified module
function activateModule(moduleName) {
    // Remove active class from all nav items and sections
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Add active class to selected nav item and section
    const selectedNavItem = document.querySelector(`.nav-item[data-target="${moduleName}"]`);
    const selectedSection = document.getElementById(moduleName);
    
    if (selectedNavItem && selectedSection) {
        selectedNavItem.classList.add('active');
        selectedSection.classList.add('active');
    }
}

// Get active module from URL parameters
function getActiveModuleFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('module');
}

// Set up theme toggle
function setupThemeToggle() {
    const themeSwitch = document.getElementById('theme-switch');
    
    // Check saved theme preference
    const darkMode = localStorage.getItem('darkMode') === 'true';
    
    if (darkMode) {
        document.body.classList.add('dark-mode');
        themeSwitch.checked = true;
    }
    
    themeSwitch.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', themeSwitch.checked);
    });
}

// Set up sidebar toggle
function setupSidebarToggle() {
    const toggleButton = document.querySelector('.toggle-sidebar');
    const sidebar = document.querySelector('.sidebar');
    const content = document.querySelector('.content');
    
    toggleButton.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        content.classList.toggle('expanded');
    });
}