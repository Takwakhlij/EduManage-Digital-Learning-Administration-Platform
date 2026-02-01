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

const adminService = {
    getUsers,
    updateUserStatus,
    deleteUser,
    updateUser,
};

export default adminService;
