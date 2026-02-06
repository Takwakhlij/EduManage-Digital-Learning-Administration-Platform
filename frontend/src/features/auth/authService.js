import axios from 'axios';

const API_URL = '/api/users/';

// Register user
const register = async (userData) => {
    const response = await axios.post(API_URL + 'register', userData);

    if (response.data && response.data.token) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data; // return user data from backend
};

// Login user
const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);
    // response.data is the user data from backend

    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        // JSON.stringify convert object to string for saving in local storage
    }

    return response.data;
};

// Logout user
const logout = () => {
    localStorage.removeItem('user'); // remove user from local storage
};

// Update user profile
const updateProfile = async (formData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary for FormData
        },
    };

    const response = await axios.put(API_URL + 'profile', formData, config);

    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
};

// Get user data
const getMe = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL + 'me', config);

    if (response.data) {
        // Merge the new data with the existing token because /me might not return the token
        const existingUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...existingUser, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    }

    return response.data;
};

const authService = {
    register,
    login,
    logout,
    updateProfile,
    getMe,
};

export default authService;
