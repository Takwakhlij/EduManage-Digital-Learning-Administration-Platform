import axios from 'axios';

const API_URL = '/api/sessions/';

// Créer une nouvelle session (Admin)
const createSession = async (sessionData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, sessionData, config);
    return response.data;
};

// Récupérer toutes les sessions (Filtré pour Etudiants / Complet pour Admin)
const getAllSessions = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.get(API_URL, config);
    return response.data;
};

// Récupérer les sessions publiées pour le public
const getPublishedSessions = async () => {
    const response = await axios.get(API_URL + 'published');
    return response.data;
};

// Récupérer une session par son ID
const getSessionById = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL + id, config);
    return response.data;
};

// Ajouter un cours à une session (Enseignant/Admin)
const ajouterCoursSession = async (sessionId, coursData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(`${API_URL}${sessionId}/cours`, coursData, config);
    return response.data;
};

// Récupérer les sessions de l'enseignant connecté
const getTeacherSessions = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };
    const response = await axios.get(`${API_URL}teacher`, config);
    return response.data;
};

// Marquer une session comme terminée
const completeSession = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(`${API_URL}${id}/complete`, {}, config);
    return response.data;
};

// Activer/Désactiver la publication d'une session
const togglePublishSession = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.put(`${API_URL}${id}/toggle-publish`, {}, config);
    return response.data;
};

const sessionService = {
    createSession,
    getAllSessions,
    getSessionById,
    ajouterCoursSession,
    getTeacherSessions,
    completeSession,
    togglePublishSession,
    getPublishedSessions
};

export default sessionService;
