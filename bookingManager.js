// bookingManager.js - Manages all booking-related functionality
export class BookingManager {
    constructor(storageManager, tableConfigManager) {
        this.storageManager = storageManager;
        this.tableConfigManager = tableConfigManager;
        this.bookings = this.storageManager.getData('bookings') || [];
        this.tableStatuses = this.storageManager.getData('tableStatuses') || [];
        this.restaurantInfo = this.storageManager.getData('restaurantInfo') || {
            reservationDuration: 90 // Default duration
        };
        
        // References to DOM elements
        this.bookingList = document.getElementById('booking-list');
        this.bookingModal = document.getElementById('booking-modal');
        this.bookingForm = document.getElementById('booking-form');
        this.tableAssignment = document.getElementById('table-assignment');
        this.bookingCalendar = document.getElementById('booking-calendar');
        
        // Initialize event listeners
        this.initEventListeners();
        
        // Initial rendering
        this.setDefaultDates();
        this.renderBookingList();
        this.renderCalendarView();
    }
    
    // Initialize all event listeners for booking management
    initEventListeners() {
        // New booking button
        const newBookingBtn = document.getElementById('new-booking');
        newBookingBtn.addEventListener('click', () => {
            this.openBookingModal();
        });
        
        // View toggle (list/calendar)
        const viewButtons = document.querySelectorAll('.view-btn');
        viewButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                viewButtons.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Show the corresponding view
                const viewType = btn.getAttribute('data-view');
                document.querySelectorAll('.booking-view').forEach(view => {
                    view.classList.remove('active');
                });
                document.getElementById(`${viewType}-view`).classList.add('active');
                
                // Refresh the view
                if (viewType === 'list') {
                    this.renderBookingList();
                } else if (viewType === 'calendar') {
                    this.renderCalendarView();
                }
            });
        });
        
        // Date filter
        const dateFilter = document.getElementById('booking-date');
        dateFilter.addEventListener('change', () => {
            this.renderBookingList();
            this.renderCalendarView();
        });
        
        // Search filter
        const searchInput = document.querySelector('.search-filter input');
        searchInput.addEventListener('input', () => {
            this.renderBookingList();
        });
        
        // Party size filter
        const partySizeFilter = document.getElementById('party-size');
        partySizeFilter.addEventListener('change', () => {
            this.renderBookingList();
        });
        
        // Calendar navigation
        document.getElementById('prev-day').addEventListener('click', () => {
            const dateInput = document.getElementById('booking-date');
            const currentDate = new Date(dateInput.value);
            currentDate.setDate(currentDate.getDate() - 1);
            dateInput.value = this.formatDate(currentDate);
            this.renderCalendarView();
            this.renderBookingList();
        });
        
        document.getElementById('next-day').addEventListener('click', () => {
            const dateInput = document.getElementById('booking-date');
            const currentDate = new Date(dateInput.value);
            currentDate.setDate(currentDate.getDate() + 1);
            dateInput.value = this.formatDate(currentDate);
            this.renderCalendarView();
            this.renderBookingList();
        });
        
        // Booking form submission
        this.bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveBooking();
        });
        
        // Cancel booking button
        document.getElementById('cancel-booking').addEventListener('click', () => {
            this.closeBookingModal();
        });
        
        // Close modal button
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeBookingModal();
                document.getElementById('table-details-modal').classList.remove('active');
            });
        });
        
        // Party size input
        document.getElementById('party-size-input').addEventListener('input', () => {
            this.updateTableAssignment();
        });
        
        // Booking date input
        document.getElementById('booking-date-input').addEventListener('change', () => {
            this.updateTableAssignment();
        });
        
        // Booking time input
        document.getElementById('booking-time').addEventListener('change', () => {
            this.updateTableAssignment();
        });
    }
    
    // Set default dates for date inputs
    setDefaultDates() {
        const today = new Date();
        const formattedDate = this.formatDate(today);
        
        // Filter date
        const dateFilter = document.getElementById('booking-date');
        dateFilter.value = formattedDate;
        
        // New booking date
        const bookingDateInput = document.getElementById('booking-date-input');
        bookingDateInput.value = formattedDate;
        bookingDateInput.min = formattedDate; // Prevent past dates
    }
    
    // Open booking modal for new booking or edit existing
    openBookingModal(bookingId = null) {
        const modalTitle = document.getElementById('booking-modal-title');
        const bookingIdInput = document.getElementById('booking-id');
        
        // Reset form
        this.bookingForm.reset();
        
        // Set default date to today
        const bookingDateInput = document.getElementById('booking-date-input');
        const today = new Date();
        bookingDateInput.value = this.formatDate(today);
        bookingDateInput.min = this.formatDate(today); // Prevent past dates
        
        // Set default duration from restaurant settings
        document.getElementById('duration').value = this.restaurantInfo.reservationDuration;
        
        if (bookingId) {
            // Edit existing booking
            modalTitle.textContent = 'Edit Booking';
            
            // Find booking data
            const booking = this.bookings.find(b => b.id === bookingId);
            if (booking) {
                // Populate form with booking data
                document.getElementById('guest-name').value = booking.guestName;
                document.getElementById('guest-phone').value = booking.phone;
                document.getElementById('guest-email').value = booking.email || '';
                document.getElementById('booking-date-input').value = booking.date;
                document.getElementById('booking-time').value = booking.time;
                document.getElementById('party-size-input').value = booking.partySize;
                document.getElementById('duration').value = booking.duration;
                document.getElementById('special-requests').value = booking.specialRequests || '';
                bookingIdInput.value = booking.id;
                
                // Update available tables
                this.updateTableAssignment(booking.tableId);
            }
        } else {
            // New booking
            modalTitle.textContent = 'New Booking';
            bookingIdInput.value = '';
            
            // Update available tables
            this.updateTableAssignment();
        }
        
        // Show modal
        this.bookingModal.classList.add('active');
    }
    
    // Close booking modal
    closeBookingModal() {
        this.bookingModal.classList.remove('active');
    }
    
    // Update table assignment options based on party size and date/time
    updateTableAssignment(selectedTableId = null) {
        // Clear current options
        this.tableAssignment.innerHTML = '';
        
        // Get form values
        const partySize = parseInt(document.getElementById('party-size-input').value) || 2;
        const date = document.getElementById('booking-date-input').value;
        const time = document.getElementById('booking-time').value;
        
        // Skip if no date/time is selected
        if (!date || !time) {
            const message = document.createElement('p');
            message.textContent = 'Please select date and time to see available tables.';
            this.tableAssignment.appendChild(message);
            return;
        }
        
        // Get available tables
        const availableTables = this.tableConfigManager.getAvailableTablesForPartySize(partySize, { date, time });
        
        // Add booking ID if in edit mode
        const bookingId = document.getElementById('booking-id').value;
        
        // If editing, include the currently assigned table
        let tables = [...availableTables];
        if (bookingId && selectedTableId) {
            const currentTable = this.tableConfigManager.getAllTables().find(t => t.id === selectedTableId);
            if (currentTable && !tables.some(t => t.id === currentTable.id)) {
                tables.push(currentTable);
            }
        }
        
        // Sort tables by capacity (smallest appropriate tables first)
        tables.sort((a, b) => a.capacity - b.capacity);
        
        if (tables.length === 0) {
            const message = document.createElement('p');
            message.textContent = 'No tables available for this party size and time. Try changing the date, time or party size.';
            this.tableAssignment.appendChild(message);
            return;
        }
        
        // Create table elements
        tables.forEach(table => {
            const tableElement = document.createElement('div');
            tableElement.className = `assignment-table ${table.shape}`;
            tableElement.setAttribute('data-table-id', table.id);
            tableElement.innerHTML = `
                ${table.id}
                <div class="table-capacity">${table.capacity}</div>
            `;
            
            // Mark as selected if it's the current table
            if (selectedTableId && table.id === selectedTableId) {
                tableElement.classList.add('selected');
            }
            
            // Add click event
            tableElement.addEventListener('click', () => {
                // Remove selected class from all tables
                document.querySelectorAll('.assignment-table').forEach(el => {
                    el.classList.remove('selected');
                });
                
                // Add selected class to clicked table
                tableElement.classList.add('selected');
            });
            
            this.tableAssignment.appendChild(tableElement);
        });
    }
    
    // Save booking from form
    saveBooking() {
        // Get form values
        const bookingId = document.getElementById('booking-id').value;
        const guestName = document.getElementById('guest-name').value;
        const phone = document.getElementById('guest-phone').value;
        const email = document.getElementById('guest-email').value;
        const date = document.getElementById('booking-date-input').value;
        const time = document.getElementById('booking-time').value;
        const partySize = parseInt(document.getElementById('party-size-input').value);
        const duration = parseInt(document.getElementById('duration').value);
        const specialRequests = document.getElementById('special-requests').value;
        
        // Get selected table
        const selectedTableElement = document.querySelector('.assignment-table.selected');
        if (!selectedTableElement) {
            alert('Please select a table for this booking.');
            return;
        }
        const tableId = selectedTableElement.getAttribute('data-table-id');
        
        if (bookingId) {
            // Update existing booking
            const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
            if (bookingIndex !== -1) {
                // Get previous table ID
                const previousTableId = this.bookings[bookingIndex].tableId;
                
                // Update booking
                this.bookings[bookingIndex] = {
                    ...this.bookings[bookingIndex],
                    guestName,
                    phone,
                    email,
                    date,
                    time,
                    partySize,
                    duration,
                    specialRequests,
                    tableId
                };
                
                // Update table status if table has changed
                if (previousTableId !== tableId) {
                    // Remove reservation from previous table
                    const previousTableStatus = this.tableStatuses.find(s => s.tableId === previousTableId);
                    if (previousTableStatus) {
                        previousTableStatus.status = 'available';
                        previousTableStatus.reservation = null;
                    }
                    
                    // Update new table
                    const tableStatus = this.tableStatuses.find(s => s.tableId === tableId);
                    if (tableStatus) {
                        tableStatus.status = 'reserved';
                        tableStatus.reservation = bookingId;
                    }
                }
                
                this.storageManager.saveData('bookings', this.bookings);
                this.storageManager.saveData('tableStatuses', this.tableStatuses);
                
                this.showNotification('Booking updated successfully', 'success');
            }
        } else {
            // Create new booking
            const newBookingId = `B${Date.now()}`;
            const newBooking = {
                id: newBookingId,
                guestName,
                phone,
                email,
                date,
                time,
                partySize,
                duration,
                specialRequests,
                tableId,
                status: 'confirmed'
            };
            
            // Add to bookings array
            this.bookings.push(newBooking);
            
            // Update table status
            const tableStatus = this.tableStatuses.find(s => s.tableId === tableId);
            if (tableStatus) {
                tableStatus.status = 'reserved';
                tableStatus.reservation = newBookingId;
            }
            
            this.storageManager.saveData('bookings', this.bookings);
            this.storageManager.saveData('tableStatuses', this.tableStatuses);
            
            this.showNotification('Booking created successfully', 'success');
        }
        
        // Close modal
        this.closeBookingModal();
        
        // Refresh views
        this.renderBookingList();
        this.renderCalendarView();
    }
    
    // Render booking list based on filters
    renderBookingList() {
        if (!this.bookingList) return;
        
        // Clear current list
        this.bookingList.innerHTML = '';
        
        // Get filter values
        const dateFilter = document.getElementById('booking-date').value;
        const searchFilter = document.querySelector('.search-filter input').value.toLowerCase();
        const partySizeFilter = document.getElementById('party-size').value;
        
        // Filter bookings
        let filteredBookings = this.bookings.filter(booking => {
            // Date filter
            if (dateFilter && booking.date !== dateFilter) {
                return false;
            }
            
            // Search filter (guest name)
            if (searchFilter && !booking.guestName.toLowerCase().includes(searchFilter)) {
                return false;
            }
            
            // Party size filter
            if (partySizeFilter !== 'any') {
                const size = booking.partySize;
                
                if (partySizeFilter === '1-2' && (size < 1 || size > 2)) {
                    return false;
                } else if (partySizeFilter === '3-4' && (size < 3 || size > 4)) {
                    return false;
                } else if (partySizeFilter === '5-8' && (size < 5 || size > 8)) {
                    return false;
                } else if (partySizeFilter === '9+' && size < 9) {
                    return false;
                }
            }
            
            return true;
        });
        
        // Sort by time
        filteredBookings.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.time.localeCompare(b.time);
        });
        
        // Render each booking
        filteredBookings.forEach(booking => {
            const row = document.createElement('tr');
            
            row.innerHTML = `
                <td>${booking.time}</td>
                <td>${booking.guestName}</td>
                <td>${booking.phone}</td>
                <td>${booking.partySize}</td>
                <td>${booking.tableId}</td>
                <td><span class="status-badge ${booking.status}">${booking.status}</span></td>
                <td>
                    <div class="booking-actions">
                        <button class="btn small" data-action="edit" title="Edit"><i class="fas fa-edit"></i></button>
                        <button class="btn small" data-action="delete" title="Delete"><i class="fas fa-trash"></i></button>
                    </div>
                </td>
            `;
            
            // Add action event listeners
            const editBtn = row.querySelector('[data-action="edit"]');
            editBtn.addEventListener('click', () => {
                this.openBookingModal(booking.id);
            });
            
            const deleteBtn = row.querySelector('[data-action="delete"]');
            deleteBtn.addEventListener('click', () => {
                if (confirm(`Are you sure you want to delete the booking for ${booking.guestName}?`)) {
                    this.deleteBooking(booking.id);
                }
            });
            
            this.bookingList.appendChild(row);
        });
        
        // Show empty state if no bookings
        if (filteredBookings.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.innerHTML = `
                <td colspan="7" class="text-center">No bookings found for the selected filters.</td>
            `;
            this.bookingList.appendChild(emptyRow);
        }
    }
    
    // Render calendar view
    renderCalendarView() {
        if (!this.bookingCalendar) return;
        
        // Clear calendar
        this.bookingCalendar.innerHTML = '';
        
        // Get selected date
        const selectedDate = document.getElementById('booking-date').value;
        
        // Update calendar header date display
        document.getElementById('calendar-date').textContent = this.formatDateForDisplay(selectedDate);
        
        // Get restaurant hours
        const openingTime = this.restaurantInfo.openingTime || '10:00';
        const closingTime = this.restaurantInfo.closingTime || '22:00';
        
        // Calculate start and end hours
        const startHour = parseInt(openingTime.split(':')[0]);
        const endHour = parseInt(closingTime.split(':')[0]);
        
        // Get all tables
        const tables = this.tableConfigManager.getAllTables();
        
        // Create time labels column
        const timeLabelsCol = document.createElement('div');
        timeLabelsCol.className = 'time-label';
        timeLabelsCol.innerHTML = `<div class="time-slot time-label">Tables</div>`;
        
        // Add table labels
        tables.forEach(table => {
            const tableLabel = document.createElement('div');
            tableLabel.className = 'time-slot time-label';
            tableLabel.textContent = `${table.id} (${table.capacity})`;
            timeLabelsCol.appendChild(tableLabel);
        });
        
        this.bookingCalendar.appendChild(timeLabelsCol);
        
        // Create columns for each hour
        for (let hour = startHour; hour <= endHour; hour++) {
            const timeCol = document.createElement('div');
            timeCol.className = 'time-column';
            
            // Create header with time
            const timeHeader = document.createElement('div');
            timeHeader.className = 'time-slot time-header';
            timeHeader.textContent = `${hour}:00`;
            timeCol.appendChild(timeHeader);
            
            // Create slots for each table
            tables.forEach(table => {
                const timeSlot = document.createElement('div');
                timeSlot.className = 'time-slot';
                timeSlot.setAttribute('data-table', table.id);
                timeSlot.setAttribute('data-hour', hour);
                
                // Check if there's a booking for this table at this time
                const bookingsForTable = this.bookings.filter(booking => {
                    if (booking.tableId !== table.id || booking.date !== selectedDate) {
                        return false;
                    }
                    
                    const bookingHour = parseInt(booking.time.split(':')[0]);
                    const bookingDuration = booking.duration || 90;
                    const bookingEndHour = bookingHour + Math.ceil(bookingDuration / 60);
                    
                    return hour >= bookingHour && hour < bookingEndHour;
                });
                
                if (bookingsForTable.length > 0) {
                    // We have a booking for this slot
                    const booking = bookingsForTable[0];
                    timeSlot.classList.add('booked');
                    timeSlot.innerHTML = `
                        <div class="booking-info">
                            <div>${booking.guestName}</div>
                            <div>${booking.partySize} guests</div>
                        </div>
                    `;
                    
                    // Add click to edit
                    timeSlot.addEventListener('click', () => {
                        this.openBookingModal(booking.id);
                    });
                } else {
                    // Create a new booking when clicking on an empty slot
                    timeSlot.addEventListener('click', () => {
                        // Prepare booking modal with this time slot
                        const modalTitle = document.getElementById('booking-modal-title');
                        modalTitle.textContent = 'New Booking';
                        
                        document.getElementById('booking-id').value = '';
                        document.getElementById('booking-date-input').value = selectedDate;
                        document.getElementById('booking-time').value = `${hour.toString().padStart(2, '0')}:00`;
                        
                        // Update available tables
                        setTimeout(() => {
                            this.updateTableAssignment(table.id);
                            
                            // Select this table
                            const tableElement = document.querySelector(`.assignment-table[data-table-id="${table.id}"]`);
                            if (tableElement) {
                                tableElement.click();
                            }
                        }, 100);
                        
                        this.bookingModal.classList.add('active');
                    });
                }
                
                timeCol.appendChild(timeSlot);
            });
            
            this.bookingCalendar.appendChild(timeCol);
        }
    }
    
    // Delete a booking
    deleteBooking(bookingId) {
        // Find booking
        const bookingIndex = this.bookings.findIndex(b => b.id === bookingId);
        if (bookingIndex === -1) return;
        
        // Get table ID
        const tableId = this.bookings[bookingIndex].tableId;
        
        // Remove from bookings array
        this.bookings.splice(bookingIndex, 1);
        
        // Update table status
        const tableStatus = this.tableStatuses.find(s => s.tableId === tableId);
        if (tableStatus && tableStatus.reservation === bookingId) {
            tableStatus.status = 'available';
            tableStatus.reservation = null;
        }
        
        // Save changes
        this.storageManager.saveData('bookings', this.bookings);
        this.storageManager.saveData('tableStatuses', this.tableStatuses);
        
        // Refresh views
        this.renderBookingList();
        this.renderCalendarView();
        
        this.showNotification('Booking deleted', 'success');
    }
    
    // Get all bookings for a specific date
    getBookingsForDate(date) {
        return this.bookings.filter(booking => booking.date === date);
    }
    
    // Get upcoming bookings
    getUpcomingBookings(limit = 5) {
        const now = new Date();
        const today = this.formatDate(now);
        const currentHour = now.getHours();
        const currentMinutes = now.getMinutes();
        
        // Filter to today's bookings that are upcoming
        const upcomingBookings = this.bookings.filter(booking => {
            // Future date
            if (booking.date > today) {
                return true;
            }
            
            // Today, but future time
            if (booking.date === today) {
                const [bookingHour, bookingMinutes] = booking.time.split(':').map(Number);
                
                if (bookingHour > currentHour) {
                    return true;
                }
                
                if (bookingHour === currentHour && bookingMinutes > currentMinutes) {
                    return true;
                }
            }
            
            return false;
        });
        
        // Sort by date and time
        upcomingBookings.sort((a, b) => {
            if (a.date !== b.date) {
                return a.date.localeCompare(b.date);
            }
            return a.time.localeCompare(b.time);
        });
        
        // Return limited number
        return upcomingBookings.slice(0, limit);
    }
    
    // Format date to YYYY-MM-DD
    formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Format date for display (e.g. "Tuesday, April 1, 2025")
    formatDateForDisplay(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
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