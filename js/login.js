// login.js - Handles login functionality

document.addEventListener('DOMContentLoaded', () => {
    // Get form element
    const loginForm = document.getElementById('login-form');
    
    // Add submit event listener
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Check if there's a stored username in localStorage
    const rememberedUser = localStorage.getItem('rememberedUser');
    if (rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('remember').checked = true;
    }
});

// Handle login form submission
function handleLogin(e) {
    e.preventDefault();
    
    // Get form inputs
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('remember').checked;
    
    // Simple validation
    if (!username || !password) {
        showNotification('Please enter both username and password', 'error');
        return;
    }
    
    // For demo purposes, accept any username/password
    // In a real app, you would authenticate against a server
    
    // Store username if "remember me" is checked
    if (rememberMe) {
        localStorage.setItem('rememberedUser', username);
    } else {
        localStorage.removeItem('rememberedUser');
    }
    
    // Store logged in status and username
    sessionStorage.setItem('isLoggedIn', 'true');
    sessionStorage.setItem('currentUser', username);
    
    // Show success message
    showNotification('Login successful! Redirecting...', 'success');
    
    // Redirect to restaurant selection page after a short delay
    setTimeout(() => {
        window.location.href = 'restaurant-selection.html';
    }, 1500);
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