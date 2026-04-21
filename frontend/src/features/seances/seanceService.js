import axios from 'axios';

const API_URL = '/api/seances/';

// Récupérer toutes les séances (calendrier global)
const getAllSeances = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.get(API_URL, config);
    return response.data;
};

// Créer une nouvelle séance (Admin)
const createSeance = async (seanceData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, seanceData, config);
    return response.data;
};

// Récupérer toutes les séances d'une session
const getSeancesBySession = async (sessionId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(`${API_URL}session/${sessionId}`, config);
    return response.data;
};

// Récupérer toutes les séances d'un enseignant
const getSeancesByEnseignant = async (enseignantId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(`${API_URL}enseignant/${enseignantId}`, config);
    return response.data;
};

// Mettre à jour une séance
const updateSeance = async (id, seanceData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(`${API_URL}${id}`, seanceData, config);
    return response.data;
};

// Supprimer une séance
const deleteSeance = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(`${API_URL}${id}`, config);
    return response.data;
};

const seanceService = {
    getAllSeances,
    createSeance,
    getSeancesBySession,
    getSeancesByEnseignant,
    updateSeance,
    deleteSeance
};

export default seanceService;
