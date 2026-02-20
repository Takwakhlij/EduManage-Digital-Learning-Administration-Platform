import axios from 'axios';

const API_URL = 'http://localhost:5000/api/classes/';

// Créer une nouvelle classe
const createClasse = async (classeData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, classeData, config);
    return response.data;
};

// Récupérer toutes les classes
const getClasses = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL, config);
    return response.data;
};

// Récupérer une classe par ID
const getClasseById = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL + id, config);
    return response.data;
};

// Modifier une classe
const updateClasse = async (id, classeData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(API_URL + id, classeData, config);
    return response.data;
};

// Supprimer une classe
const deleteClasse = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(API_URL + id, config);
    return { ...response.data, id };
};

const classeService = {
    createClasse,
    getClasses,
    getClasseById,
    updateClasse,
    deleteClasse,
};

export default classeService;
