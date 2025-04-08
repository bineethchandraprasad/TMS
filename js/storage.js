// storage.js - Manages local storage operations
export class StorageManager {
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
    
    // Export all data as JSON
    exportData() {
        const exportData = {};
        const keys = this.getAllKeys();
        
        keys.forEach(key => {
            exportData[key] = this.getData(key);
        });
        
        return JSON.stringify(exportData, null, 2);
    }
    
    // Import data from JSON
    importData(jsonData) {
        try {
            const data = JSON.parse(jsonData);
            
            // Clear existing data
            this.getAllKeys().forEach(key => {
                this.removeData(key);
            });
            
            // Import new data
            Object.keys(data).forEach(key => {
                this.saveData(key, data[key]);
            });
            
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }
}