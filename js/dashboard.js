// dashboard.js - Manages dashboard functionality
export class DashboardManager {
    constructor(storageManager, tableConfigManager, bookingManager) {
        this.storageManager = storageManager;
        this.tableConfigManager = tableConfigManager;
        this.bookingManager = bookingManager;
        this.tables = this.tableConfigManager.getAllTables();
        this.tableStatuses = this.storageManager.getData('tableStatuses') || [];
        
        // References to DOM elements
        this.dashboardFloorView = document.getElementById('dashboard-floor-view');
        this.upcomingReservationsList = document.getElementById('upcoming-reservations-list');
        this.currentGuestsElement = document.getElementById('current-guests');
        this.totalCapacityElement = document.getElementById('total-capacity');
        this.occupancyPercentageElement = document.getElementById('occupancy-percentage');
        this.avgDiningTimeElement = document.getElementById('avg-dining-time');
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Set update interval
        this.startUpdateInterval();
    }
    
    // Initialize dashboard event listeners
    initEventListeners() {
        // Refresh floor button
        const refreshButton = document.getElementById('refresh-floor');
        refreshButton.addEventListener('click', () => {
            this.updateDashboard();
        });
        
        // Table detail modal
        document.addEventListener('click', (e) => {
            if (e.target.closest('.dashboard-table')) {
                const tableElement = e.target.closest('.dashboard-table');
                const tableId = tableElement.getAttribute('data-table-id');
                this.openTableDetailsModal(tableId);
            }
        });
        
        // Status change buttons
        document.addEventListener('click', (e) => {
            if (e.target.closest('.status-btn')) {
                const statusButton = e.target.closest('.status-btn');
                const status = statusButton.getAttribute('data-status');
                const tableId = document.getElementById('table-details-content').getAttribute('data-table-id');
                
                if (tableId && status) {
                    this.changeTableStatus(tableId, status);
                    document.getElementById('table-details-modal').classList.remove('active');
                }
            }
        });
        
        // Walk-in form submission
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'walk-in-form') {
                e.preventDefault();
                const tableId = document.getElementById('table-details-content').getAttribute('data-table-id');
                if (tableId) {
                    this.seatWalkInGuest(tableId);
                }
            }
        });
    }
    
    // Start interval to update dashboard
    startUpdateInterval() {
        // Update every 60 seconds
        setInterval(() => {
            this.updateDashboard();
        }, 60000);
        
        // Initial update
        this.updateDashboard();
    }

    // Add this method to DashboardManager class
    seatWalkInGuest(tableId) {
        // Get form values
        const guestName = document.getElementById('walk-in-name').value;
        const partySize = parseInt(document.getElementById('walk-in-party-size').value);
        const phone = document.getElementById('walk-in-phone').value || '';
        
        // Get current time
        const now = new Date();
        const currentDate = this.formatDate(now);
        const currentTime = now.toTimeString().substring(0, 5); // HH:MM format
        
        // Create a new booking ID
        const bookingId = `B${Date.now()}`;
        
        // Create booking object
        const newBooking = {
            id: bookingId,
            guestName,
            phone,
            email: '',
            date: currentDate,
            time: currentTime,
            partySize,
            duration: this.storageManager.getData('restaurantInfo')?.reservationDuration || 90,
            specialRequests: 'Walk-in guest',
            tableId,
            status: 'confirmed'
        };
        
        // Add to bookings array
        const bookings = this.storageManager.getData('bookings') || [];
        bookings.push(newBooking);
        this.storageManager.saveData('bookings', bookings);
        
        // Update table status
        this.changeTableStatus(tableId, 'occupied', bookingId);
        
        // Close modal
        document.getElementById('table-details-modal').classList.remove('active');
        
        // Show notification
        this.showNotification(`Table ${tableId} assigned to ${guestName}`, 'success');
    }

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

    // Add this helper method if it doesn't exist already
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Update all dashboard elements
    updateDashboard() {
        // Refresh table statuses from storage
        this.tableStatuses = this.storageManager.getData('tableStatuses') || [];
        
        // Update stats
        this.updateStats();
        
        // Render floor view
        this.renderFloorView();
        
        // Update upcoming reservations
        this.updateUpcomingReservations();
    }
    
    // Render floor view with current table statuses
    renderFloorView() {
        if (!this.dashboardFloorView) return;
        
        // Clear current view
        this.dashboardFloorView.innerHTML = '';
        
        // Get latest tables
        this.tables = this.tableConfigManager.getAllTables();
        
        // Create elements for each table
        this.tables.forEach(table => {
            // Find status for this table
            const tableStatus = this.tableStatuses.find(s => s.tableId === table.id) || {
                status: 'available',
                reservation: null
            };
            
            // Create table element
            const tableElement = document.createElement('div');
            tableElement.className = `dashboard-table ${table.shape} ${tableStatus.status}`;
            tableElement.setAttribute('data-table-id', table.id);

            tableElement.style.left = `${table.x}px`;
            tableElement.style.top = `${table.y}px`;
            
            // Add table number
            const tableNumber = document.createElement('div');
            tableNumber.className = 'table-number';
            tableNumber.textContent = table.id;
            tableElement.appendChild(tableNumber);
            
            // Add VIP designation if applicable
            if (table.isVip) {
                tableElement.classList.add('vip');
            }
            
            // Add capacity indicator
            const capacityIndicator = document.createElement('div');
            capacityIndicator.className = 'table-capacity';
            capacityIndicator.textContent = table.capacity;
            tableElement.appendChild(capacityIndicator);
            
            // Add status indicator
            const statusIndicator = document.createElement('div');
            statusIndicator.className = 'table-status';
            statusIndicator.textContent = tableStatus.status.charAt(0).toUpperCase() + tableStatus.status.slice(1);
            
            // If occupied or reserved, add guest information
            if (tableStatus.status === 'occupied' || tableStatus.status === 'reserved') {
                const bookings = this.storageManager.getData('bookings') || [];
                const booking = bookings.find(b => b.id === tableStatus.reservation);
                
                if (booking) {
                    const guestInfo = document.createElement('div');
                    guestInfo.className = 'guest-info';
                    guestInfo.innerHTML = `
                        <div class="booking-time">${booking.time}</div>
                    `;
                    tableElement.appendChild(guestInfo);
                }
            }
            
            // Add to floor view
            this.dashboardFloorView.appendChild(tableElement);
        });
    }
    
    // Update stats panel
    updateStats() {
        // Calculate current stats
        const stats = this.calculateStats();
        
        // Update DOM elements
        if (this.currentGuestsElement) {
            this.currentGuestsElement.textContent = stats.currentGuests;
        }
        
        if (this.totalCapacityElement) {
            this.totalCapacityElement.textContent = stats.totalCapacity;
        }
        
        if (this.occupancyPercentageElement) {
            this.occupancyPercentageElement.textContent = `${stats.occupancyPercentage}%`;
        }
        
        if (this.avgDiningTimeElement) {
            this.avgDiningTimeElement.textContent = `${stats.avgDiningTime} min`;
        }
    }
    
    // Calculate current stats
    calculateStats() {
        // Total capacity (sum of all table capacities)
        const totalCapacity = this.tables.reduce((sum, table) => sum + table.capacity, 0);
        
        // Count occupied tables and guests
        let occupiedTables = 0;
        let currentGuests = 0;
        
        this.tableStatuses.forEach(status => {
            if (status.status === 'occupied') {
                occupiedTables++;
                
                // Find the table to get capacity
                const table = this.tables.find(t => t.id === status.tableId);
                if (table) {
                    // If there's a booking, use actual guest count
                    if (status.reservation) {
                        const bookings = this.storageManager.getData('bookings') || [];
                        const booking = bookings.find(b => b.id === status.reservation);
                        if (booking) {
                            currentGuests += booking.partySize;
                        } else {
                            // Otherwise use table capacity
                            currentGuests += table.capacity;
                        }
                    } else {
                        // No booking reference, use table capacity
                        currentGuests += table.capacity;
                    }
                }
            }
        });
        
        // Calculate occupancy percentage
        const occupancyPercentage = totalCapacity > 0 
            ? Math.round((currentGuests / totalCapacity) * 100) 
            : 0;
        
        // Average dining time (default to 90 minutes)
        // In a real app, this would be calculated from historical data
        const avgDiningTime = 90;
        
        return {
            totalCapacity,
            currentGuests,
            occupancyPercentage,
            avgDiningTime
        };
    }
    
    // Update upcoming reservations list
    updateUpcomingReservations() {
        if (!this.upcomingReservationsList) return;
        
        // Clear current list
        this.upcomingReservationsList.innerHTML = '';
        
        // Get upcoming bookings
        const upcomingBookings = this.bookingManager.getUpcomingBookings(6);
        
        if (upcomingBookings.length === 0) {
            const noBookings = document.createElement('div');
            noBookings.className = 'no-bookings';
            noBookings.textContent = 'No upcoming reservations.';
            this.upcomingReservationsList.appendChild(noBookings);
            return;
        }
        
        // Create reservation cards
        upcomingBookings.forEach(booking => {
            const card = document.createElement('div');
            card.className = 'reservation-card';
            
            // Format date for display
            const bookingDate = new Date(booking.date);
            const today = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(today.getDate() + 1);
            
            let dateDisplay = '';
            if (this.isSameDay(bookingDate, today)) {
                dateDisplay = 'Today';
            } else if (this.isSameDay(bookingDate, tomorrow)) {
                dateDisplay = 'Tomorrow';
            } else {
                dateDisplay = bookingDate.toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                });
            }
            
            card.innerHTML = `
                <div class="reservation-time">${dateDisplay}, ${booking.time}</div>
                <div class="reservation-details">
                    <strong>${booking.guestName}</strong> - ${booking.partySize} guests
                </div>
                <div class="reservation-table">Table ${booking.tableId}</div>
            `;
            
            // Add click handler to open booking modal
            card.addEventListener('click', () => {
                this.bookingManager.openBookingModal(booking.id);
            });
            
            this.upcomingReservationsList.appendChild(card);
        });
    }
    
    // Check if two dates are the same day
    isSameDay(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    // Open table details modal
    openTableDetailsModal(tableId) {
        const modal = document.getElementById('table-details-modal');
        const modalContent = document.getElementById('table-details-content');
        
        // Find table and status
        const table = this.tables.find(t => t.id === tableId);
        const tableStatus = this.tableStatuses.find(s => s.tableId === tableId) || {
            status: 'available',
            reservation: null
        };
        
        if (!table) return;
        
        // Set table ID attribute on content container
        modalContent.setAttribute('data-table-id', tableId);
        
        // Clear previous content
        modalContent.innerHTML = '';
        
        // Basic table details
        const tableDetails = document.createElement('div');
        tableDetails.innerHTML = `
            <div class="table-detail-row">
                <span class="table-detail-label">Table Number:</span>
                <span>${table.id}</span>
            </div>
            <div class="table-detail-row">
                <span class="table-detail-label">Shape:</span>
                <span>${table.shape.charAt(0).toUpperCase() + table.shape.slice(1)}</span>
            </div>
            <div class="table-detail-row">
                <span class="table-detail-label">Capacity:</span>
                <span>${table.capacity} guests</span>
            </div>
            <div class="table-detail-row">
                <span class="table-detail-label">Section:</span>
                <span>${table.section.charAt(0).toUpperCase() + table.section.slice(1)}</span>
            </div>
            <div class="table-detail-row">
                <span class="table-detail-label">Type:</span>
                <span>${table.isVip ? 'VIP' : 'Regular'}</span>
            </div>
            <div class="table-detail-row">
                <span class="table-detail-label">Status:</span>
                <span class="status-badge ${tableStatus.status}">${tableStatus.status.charAt(0).toUpperCase() + tableStatus.status.slice(1)}</span>
            </div>
        `;
        
        // If occupied or reserved, add guest information
        if (tableStatus.status === 'occupied' || tableStatus.status === 'reserved') {
            const bookings = this.storageManager.getData('bookings') || [];
            const booking = bookings.find(b => b.id === tableStatus.reservation);
            
            if (booking) {
                const guestDetails = document.createElement('div');
                guestDetails.innerHTML = `
                    <h3>Guest Information</h3>
                    <div class="table-detail-row">
                        <span class="table-detail-label">Guest Name:</span>
                        <span>${booking.guestName}</span>
                    </div>
                    <div class="table-detail-row">
                        <span class="table-detail-label">Party Size:</span>
                        <span>${booking.partySize} guests</span>
                    </div>
                    <div class="table-detail-row">
                        <span class="table-detail-label">Phone:</span>
                        <span>${booking.phone}</span>
                    </div>
                    <div class="table-detail-row">
                        <span class="table-detail-label">Time:</span>
                        <span>${booking.time}</span>
                    </div>
                    <div class="table-detail-row">
                        <span class="table-detail-label">Duration:</span>
                        <span>${booking.duration} minutes</span>
                    </div>
                `;
                
                if (booking.specialRequests) {
                    guestDetails.innerHTML += `
                        <div class="table-detail-row">
                            <span class="table-detail-label">Special Requests:</span>
                            <span>${booking.specialRequests}</span>
                        </div>
                    `;
                }
                
                tableDetails.appendChild(guestDetails);
                
                // Add button to edit booking
                const editBookingBtn = document.createElement('button');
                editBookingBtn.className = 'btn primary';
                editBookingBtn.innerHTML = '<i class="fas fa-edit"></i> Edit Booking';
                editBookingBtn.addEventListener('click', () => {
                    modal.classList.remove('active');
                    this.bookingManager.openBookingModal(booking.id);
                });
                
                tableDetails.appendChild(editBookingBtn);
            }
        }
        
        modalContent.appendChild(tableDetails);
        
        // Show appropriate status buttons based on current status
        if (tableStatus.status === 'available') {
            // Add walk-in form for available tables
            const walkInForm = document.createElement('div');
            walkInForm.innerHTML = `
                <h3>Seat Walk-in Guest</h3>
                <form id="walk-in-form">
                    <div class="form-group">
                        <label for="walk-in-name">Guest Name</label>
                        <input type="text" id="walk-in-name" required>
                    </div>
                    <div class="form-group">
                        <label for="walk-in-party-size">Party Size</label>
                        <input type="number" id="walk-in-party-size" min="1" max="${table.capacity}" value="2" required>
                    </div>
                    <div class="form-group">
                        <label for="walk-in-phone">Phone (Optional)</label>
                        <input type="tel" id="walk-in-phone">
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn primary">
                            <i class="fas fa-chair"></i> Seat Now
                        </button>
                    </div>
                </form>
            `;
            
            // Attach to modal content
            modalContent.appendChild(walkInForm);
        } else if (tableStatus.status === 'occupied') {
            document.querySelector('.status-btn.occupied').disabled = true;
        } else if (tableStatus.status === 'cleaning') {
            document.querySelector('.status-btn.cleaning').disabled = true;
        }
        
        // Show modal
        modal.classList.add('active');
    }
    
    // Change table status
    changeTableStatus(tableId, newStatus, reservationId = null) {
        // Find table status
        const tableStatusIndex = this.tableStatuses.findIndex(s => s.tableId === tableId);
        
        if (tableStatusIndex !== -1) {
            const currentStatus = this.tableStatuses[tableStatusIndex];
            
            // Handle reservation implications
            if (currentStatus.status === 'reserved' && newStatus !== 'reserved') {
                // Changing away from reserved status should clear reservation
                this.tableStatuses[tableStatusIndex].reservation = null;
            }
            
            // Update status
            this.tableStatuses[tableStatusIndex].status = newStatus;
            
            // Set reservation ID if provided
            if (reservationId) {
                this.tableStatuses[tableStatusIndex].reservation = reservationId;
            }
            
            // Save to storage
            this.storageManager.saveData('tableStatuses', this.tableStatuses);
            
            // Update views
            this.updateDashboard();
        } else {
            // Create new status if it doesn't exist
            this.tableStatuses.push({
                tableId,
                status: newStatus,
                reservation: reservationId
            });
            
            // Save to storage
            this.storageManager.saveData('tableStatuses', this.tableStatuses);
            
            // Update views
            this.updateDashboard();
        }
    }
}