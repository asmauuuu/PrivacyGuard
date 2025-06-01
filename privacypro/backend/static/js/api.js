// frontend/api.js
const API_URL = 'http://localhost:5500/api';

/**
 * Helper function for making API requests
 * @param {string} endpoint - API endpoint (e.g., '/auth/login')
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {object} data - Data to send in the request body
 * @returns {Promise} - Promise that resolves to the API response
 */
async function apiRequest(endpoint, method = 'GET', data = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    // Add token to headers if available
    const token = localStorage.getItem('token');
    if (token) {
        options.headers['Authorization'] = `Bearer ${token}`;
    }

    // Add body data if provided
    if (data) {
        options.body = JSON.stringify(data);
    }

    // Make the request
    const response = await fetch(`${API_URL}${endpoint}`, options);
    const result = await response.json();

    // Handle error responses
    if (!response.ok) {
        throw new Error(result.error || 'Something went wrong');
    }

    return result;
}

// Authentication functions
const auth = {
    /**
     * Register a new user
     * @param {string} name - User's full name
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise} - Promise that resolves to the API response
     */
    async register(name, email, password) {
        return await apiRequest('/auth/register', 'POST', { name, email, password });
    },
    
    /**
     * Log in a user
     * @param {string} email - User's email
     * @param {string} password - User's password
     * @returns {Promise} - Promise that resolves to the API response
     */
    async login(email, password) {
        const result = await apiRequest('/auth/login', 'POST', { email, password });
        
        // Save token and user data
        localStorage.setItem('token', result.token);
        localStorage.setItem('user', JSON.stringify(result.user));
        
        return result;
    },
    
    /**
     * Log out the current user
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },
    
    /**
     * Check if a user is logged in
     * @returns {boolean} - True if a user is logged in
     */
    isLoggedIn() {
        return !!localStorage.getItem('token');
    },
    
    /**
     * Get the current user's information
     * @returns {object|null} - User object or null if not logged in
     */
    getCurrentUser() {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
};

// Export the API functions
window.api = { auth };