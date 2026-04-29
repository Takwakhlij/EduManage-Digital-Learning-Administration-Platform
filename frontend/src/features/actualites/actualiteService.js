import axios from 'axios';

const API_URL = '/api/actualites/';

// Get all actualites
const getActualites = async () => {
    const response = await axios.get(API_URL);
    return response.data;
};

// Create new actualite (Admin)
const createActualite = async (actualiteData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    };
    const response = await axios.post(API_URL, actualiteData, config);
    return response.data;
};

// Update actualite (Admin)
const updateActualite = async (id, actualiteData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    };
    const response = await axios.put(API_URL + id, actualiteData, config);
    return response.data;
};

// Delete actualite (Admin)
const deleteActualite = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.delete(API_URL + id, config);
    return response.data;
};

const actualiteService = {
    getActualites,
    createActualite,
    updateActualite,
    deleteActualite,
};

export default actualiteService;
