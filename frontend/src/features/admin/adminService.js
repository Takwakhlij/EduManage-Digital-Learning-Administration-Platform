import axios from 'axios';

const API_URL = '/api/users/';

// Get all users
const getUsers = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL, config);
    return response.data;
};

// Update user status
const updateUserStatus = async (userId, status, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(API_URL + userId + '/status', { status }, config);
    return response.data;
};

// Delete user
const deleteUser = async (userId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(API_URL + userId, config);
    return response.data;
};

// Update user details
const updateUser = async (userId, userData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(API_URL + userId, userData, config);
    return response.data;
};

// Create new user (Admin)
const createUserAdmin = async (userData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, userData, config);
    return response.data;
};

const adminService = {
    getUsers,
    createUserAdmin,
    updateUserStatus,
    deleteUser,
    updateUser,
};

export default adminService;
