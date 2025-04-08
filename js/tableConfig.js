// tableConfig.js - Manages the table configuration functionality
export class TableConfigManager {
    constructor(storageManager) {
        this.storageManager = storageManager;
        this.tables = this.storageManager.getData('tables') || [];
        this.floorPlan = document.getElementById('floor-plan-canvas');
        this.selectedTable = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.nextTableId = this.getNextTableId();
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Render existing tables
        this.renderTables();
    }
    
    // Initialize all event listeners for table configuration
    initEventListeners() {
        // Tool item drag start
        const toolItems = document.querySelectorAll('.tool-item');
        toolItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('shape', item.getAttribute('data-shape'));
                e.dataTransfer.effectAllowed = 'copy';
            });
        });
        
        // Floor plan drag and drop events
        this.floorPlan.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });
        
        this.floorPlan.addEventListener('drop', (e) => {
            e.preventDefault();
            const shape = e.dataTransfer.getData('shape');
            if (shape) {
                const rect = this.floorPlan.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                this.createNewTable(shape, x, y);
            }
        });
        
        // Save layout button
        const saveButton = document.getElementById('save-layout');
        saveButton.addEventListener('click', () => {
            this.saveTables();
            this.showNotification('Floor plan saved successfully', 'success');
        });
        
        // Clear layout button
        const clearButton = document.getElementById('clear-layout');
        clearButton.addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the entire floor plan? This cannot be undone.')) {
                this.clearTables();
            }
        });
        
        // Toggle grid button
        const toggleGridButton = document.getElementById('toggle-grid');
        toggleGridButton.addEventListener('click', () => {
            this.floorPlan.classList.toggle('grid');
        });
        
        // Table properties form
        const tablePropertiesForm = document.getElementById('table-properties-form');
        tablePropertiesForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateSelectedTable();
        });
        
        // Delete table button
        const deleteButton = document.getElementById('delete-table');
        deleteButton.addEventListener('click', () => {
            if (this.selectedTable) {
                this.deleteTable(this.selectedTable.id);
            }
        });
    }
    
    // Create a new table at specified position
    createNewTable(shape, x, y) {
        const tableId = `T${this.nextTableId++}`;
        
        // Set default dimensions based on shape
        let width, height;
        switch (shape) {
            case 'round':
                width = height = 60;
                break;
            case 'square':
                width = height = 80;
                break;
            case 'rectangle':
                width = 100;
                height = 60;
                break;
            default:
                width = height = 60;
        }
        
        // Create new table object
        const newTable = {
            id: tableId,
            shape: shape,
            capacity: 4, // Default capacity
            x: x - (width / 2),
            y: y - (height / 2),
            width: width,
            height: height,
            section: document.getElementById('section-select').value,
            isVip: false
        };
        
        // Add to tables array
        this.tables.push(newTable);
        
        // Create DOM element for the table
        this.createTableElement(newTable);
        
        // Add default table status
        const tableStatuses = this.storageManager.getData('tableStatuses') || [];
        tableStatuses.push({
            tableId: tableId,
            status: 'available',
            reservation: null
        });
        this.storageManager.saveData('tableStatuses', tableStatuses);
        
        // Save tables
        this.saveTables();
        
        // Select the new table
        this.selectTable(tableId);
    }
    
    // Render all tables on the floor plan
    renderTables() {
        // Clear existing tables
        const existingTables = this.floorPlan.querySelectorAll('.table-element');
        existingTables.forEach(table => table.remove());
        
        // Create elements for each table
        this.tables.forEach(table => {
            this.createTableElement(table);
        });
    }
    
    // Create DOM element for a table
    createTableElement(table) {
        const tableElement = document.createElement('div');
        tableElement.className = `table-element ${table.shape}`;
        tableElement.id = table.id;
        tableElement.style.left = `${table.x}px`;
        tableElement.style.top = `${table.y}px`;
        tableElement.style.width = `${table.width}px`;
        tableElement.style.height = `${table.height}px`;
        tableElement.textContent = table.id;
        tableElement.setAttribute('data-table-id', table.id);
        
        // Add VIP designation if applicable
        if (table.isVip) {
            tableElement.classList.add('vip');
        }
        
        // Add capacity indicator
        const capacityIndicator = document.createElement('div');
        capacityIndicator.className = 'table-capacity';
        capacityIndicator.textContent = table.capacity;
        tableElement.appendChild(capacityIndicator);
        
        // Add table selection event
        tableElement.addEventListener('click', (e) => {
            e.stopPropagation();
            this.selectTable(table.id);
        });
        
        // Add mouse down event for drag functionality
        tableElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Only left mouse button
            e.stopPropagation();
            e.preventDefault();
            
            this.selectTable(table.id);
            
            // Calculate drag offset
            const rect = tableElement.getBoundingClientRect();
            this.dragOffset = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            
            this.isDragging = true;
            
            // Add temporary move and up event listeners to document
            document.addEventListener('mousemove', this.handleMouseMove);
            document.addEventListener('mouseup', this.handleMouseUp);
        });
        
        // Store mousemove/mouseup event handlers as bound methods
        this.handleMouseMove = this.handleMouseMove.bind(this, tableElement);
        this.handleMouseUp = this.handleMouseUp.bind(this);
        
        // Add table to the floor plan
        this.floorPlan.appendChild(tableElement);
    }
    
    // Handle mouse move during table drag
    handleMouseMove(tableElement, e) {
        if (!this.isDragging) return;
        
        const rect = this.floorPlan.getBoundingClientRect();
        let newX = e.clientX - rect.left - this.dragOffset.x;
        let newY = e.clientY - rect.top - this.dragOffset.y;
        
        // Keep table within floor plan boundaries
        newX = Math.max(0, Math.min(newX, rect.width - parseInt(tableElement.style.width)));
        newY = Math.max(0, Math.min(newY, rect.height - parseInt(tableElement.style.height)));
        
        // Grid snapping if enabled
        if (this.floorPlan.classList.contains('grid')) {
            newX = Math.round(newX / 20) * 20;
            newY = Math.round(newY / 20) * 20;
        }
        
        // Update element position
        tableElement.style.left = `${newX}px`;
        tableElement.style.top = `${newY}px`;
        
        // Update table object in array
        const tableId = tableElement.getAttribute('data-table-id');
        const tableIndex = this.tables.findIndex(t => t.id === tableId);
        if (tableIndex !== -1) {
            this.tables[tableIndex].x = newX;
            this.tables[tableIndex].y = newY;
        }
    }
    
    // Handle mouse up after table drag
    handleMouseUp() {
        if (this.isDragging) {
            this.isDragging = false;
            this.saveTables();
            
            // Remove temporary event listeners
            document.removeEventListener('mousemove', this.handleMouseMove);
            document.removeEventListener('mouseup', this.handleMouseUp);
        }
    }
    
    // Select a table and populate the properties form
    selectTable(tableId) {
        // Clear previous selection
        document.querySelectorAll('.table-element.selected').forEach(el => {
            el.classList.remove('selected');
        });
        
        // Find the table
        const tableElement = document.getElementById(tableId);
        const tableData = this.tables.find(t => t.id === tableId);
        
        if (tableElement && tableData) {
            // Add selected class
            tableElement.classList.add('selected');
            this.selectedTable = tableData;
            
            // Enable form inputs
            const inputs = document.querySelectorAll('#table-properties-form input, #table-properties-form select, #table-properties-form button');
            inputs.forEach(input => {
                input.disabled = false;
            });
            
            // Populate form
            document.getElementById('table-id').value = tableData.id;
            document.getElementById('seating-capacity').value = tableData.capacity;
            document.getElementById('table-section').value = tableData.section;
            document.getElementById('is-vip').checked = tableData.isVip;
        }
    }
    
    // Update selected table with form values
    updateSelectedTable() {
        if (!this.selectedTable) return;
        
        // Get form values
        const capacity = parseInt(document.getElementById('seating-capacity').value);
        const section = document.getElementById('table-section').value;
        const isVip = document.getElementById('is-vip').checked;
        
        // Update table object
        const tableIndex = this.tables.findIndex(t => t.id === this.selectedTable.id);
        if (tableIndex !== -1) {
            this.tables[tableIndex].capacity = capacity;
            this.tables[tableIndex].section = section;
            this.tables[tableIndex].isVip = isVip;
            
            // Update DOM element
            const tableElement = document.getElementById(this.selectedTable.id);
            if (tableElement) {
                // Update VIP status
                if (isVip) {
                    tableElement.classList.add('vip');
                } else {
                    tableElement.classList.remove('vip');
                }
                
                // Update capacity indicator
                const capacityIndicator = tableElement.querySelector('.table-capacity');
                if (capacityIndicator) {
                    capacityIndicator.textContent = capacity;
                }
            }
            
            // Save tables
            this.saveTables();
            this.showNotification('Table updated', 'success');
        }
    }
    
    // Delete a table
    deleteTable(tableId) {
        // Remove from tables array
        this.tables = this.tables.filter(t => t.id !== tableId);
        
        // Remove from DOM
        const tableElement = document.getElementById(tableId);
        if (tableElement) {
            tableElement.remove();
        }
        
        // Remove table status
        const tableStatuses = this.storageManager.getData('tableStatuses') || [];
        const updatedStatuses = tableStatuses.filter(s => s.tableId !== tableId);
        this.storageManager.saveData('tableStatuses', updatedStatuses);
        
        // Clear selected table
        this.selectedTable = null;
        
        // Disable form inputs
        const inputs = document.querySelectorAll('#table-properties-form input, #table-properties-form select, #table-properties-form button');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        // Save tables
        this.saveTables();
        this.showNotification('Table deleted', 'success');
    }
    
    // Save tables to storage
    saveTables() {
        this.storageManager.saveData('tables', this.tables);
    }
    
    // Clear all tables
    clearTables() {
        this.tables = [];
        this.renderTables();
        this.saveTables();
        
        // Clear table statuses
        this.storageManager.saveData('tableStatuses', []);
        
        // Clear selected table
        this.selectedTable = null;
        
        // Disable form inputs
        const inputs = document.querySelectorAll('#table-properties-form input, #table-properties-form select, #table-properties-form button');
        inputs.forEach(input => {
            input.disabled = true;
        });
        
        this.showNotification('Floor plan cleared', 'success');
    }
    
    // Get next available table ID
    getNextTableId() {
        if (this.tables.length === 0) {
            return 1;
        }
        
        // Extract numeric parts of table IDs
        const numericIds = this.tables.map(table => {
            const match = table.id.match(/\d+/);
            return match ? parseInt(match[0]) : 0;
        });
        
        // Return max ID + 1
        return Math.max(...numericIds) + 1;
    }
    
    // Get all tables
    getAllTables() {
        return [...this.tables];
    }
    
    // Get available tables for a specific party size
    getAvailableTablesForPartySize(partySize, dateTime) {
        // Get current table statuses
        const tableStatuses = this.storageManager.getData('tableStatuses') || [];
        const bookings = this.storageManager.getData('bookings') || [];
        
        // Filter tables by capacity and availability
        return this.tables.filter(table => {
            // Check if capacity is sufficient
            if (table.capacity < partySize) {
                return false;
            }
            
            // Find current status
            const status = tableStatuses.find(s => s.tableId === table.id);
            if (!status || status.status === 'occupied' || status.status === 'cleaning') {
                return false;
            }
            
            // If table is reserved, check if it conflicts with the requested time
            if (status.status === 'reserved' && status.reservation) {
                const booking = bookings.find(b => b.id === status.reservation);
                if (booking) {
                    // TODO: Implement more sophisticated time conflict checking
                    // For now, simple check if dates match
                    if (booking.date === dateTime.date) {
                        return false;
                    }
                }
            }
            
            return true;
        });
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