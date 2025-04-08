// settings.js - Manages application settings
export class SettingsManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.restaurantInfo = this.storageManager.getData('restaurantInfo') || {
            name: 'Restaurant Name',
            openingTime: '10:00',
            closingTime: '22:00',
            reservationDuration: 90
        };
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Load current settings
        this.loadSettings();
    }
    
    // Initialize settings event listeners
    initEventListeners() {
        // Restaurant info form
        const restaurantInfoForm = document.getElementById('restaurant-info-form');
        if (restaurantInfoForm) {
            restaurantInfoForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveRestaurantInfo();
            });
        }
        
        // Export data button
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        // Import data button
        const importDataBtn = document.getElementById('import-data');
        if (importDataBtn) {
            importDataBtn.addEventListener('click', () => {
                this.importData();
            });
        }
        
        // Reset data button
        const resetDataBtn = document.getElementById('reset-data');
        if (resetDataBtn) {
            resetDataBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to reset all data? This will delete all tables, bookings, and settings.')) {
                    this.resetAllData();
                }
            });
        }
    }
    
    // Load settings into form
    loadSettings() {
        // Restaurant info
        const nameInput = document.getElementById('restaurant-name');
        const openingTimeInput = document.getElementById('opening-time');
        const closingTimeInput = document.getElementById('closing-time');
        const reservationDurationInput = document.getElementById('reservation-duration');
        
        if (nameInput) nameInput.value = this.restaurantInfo.name;
        if (openingTimeInput) openingTimeInput.value = this.restaurantInfo.openingTime;
        if (closingTimeInput) closingTimeInput.value = this.restaurantInfo.closingTime;
        if (reservationDurationInput) reservationDurationInput.value = this.restaurantInfo.reservationDuration;
    }
    
    // Save restaurant info from form
    saveRestaurantInfo() {
        const nameInput = document.getElementById('restaurant-name');
        const openingTimeInput = document.getElementById('opening-time');
        const closingTimeInput = document.getElementById('closing-time');
        const reservationDurationInput = document.getElementById('reservation-duration');
        
        this.restaurantInfo = {
            name: nameInput.value || 'Restaurant Name',
            openingTime: openingTimeInput.value || '10:00',
            closingTime: closingTimeInput.value || '22:00',
            reservationDuration: parseInt(reservationDurationInput.value) || 90
        };
        
        // Save to storage
        this.storageManager.saveData('restaurantInfo', this.restaurantInfo);
        
        this.showNotification('Settings saved successfully', 'success');
    }
    
    // Export all data
    exportData() {
        const exportData = this.storageManager.exportData();
        
        // Create a download link
        const blob = new Blob([exportData], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `table_manager_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.showNotification('Data exported successfully', 'success');
    }
    
    // Import data
    importData() {
        // Create file input
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = '.json';
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const success = this.storageManager.importData(event.target.result);
                    
                    if (success) {
                        this.showNotification('Data imported successfully. Reloading page...', 'success');
                        setTimeout(() => {
                            window.location.reload();
                        }, 2000);
                    } else {
                        this.showNotification('Error importing data. Please check file format.', 'error');
                    }
                } catch (error) {
                    console.error('Import error:', error);
                    this.showNotification('Error importing data', 'error');
                }
            };
            
            reader.readAsText(file);
        });
        
        fileInput.click();
    }
    
    // Reset all data
    resetAllData() {
        const keys = this.storageManager.getAllKeys();
        keys.forEach(key => {
            this.storageManager.removeData(key);
        });
        
        this.showNotification('All data has been reset. Reloading page...', 'success');
        
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }
    
    // Get restaurant info
    getRestaurantInfo() {
        return { ...this.restaurantInfo };
    }
    
    // Show notification
    showNotification(message, type = 'info') {
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
}