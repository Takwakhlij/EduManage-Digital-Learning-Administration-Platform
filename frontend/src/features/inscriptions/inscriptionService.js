import axios from 'axios';

const API_URL = '/api/inscriptions/';

// Inscrire un étudiant à une session (Étudiant / Parent)
const inscrireEtudiant = async (inscriptionData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, inscriptionData, config);
    return response.data;
};

// Récupérer les inscriptions d'une session (Admin / Enseignant)
const getInscriptionsParSession = async (sessionId, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(`${API_URL}session/${sessionId}`, config);
    return response.data;
};

// Récupérer toutes les inscriptions (Admin)
const getAllInscriptions = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL, config);
    return response.data;
};

const inscriptionService = {
    inscrireEtudiant,
    getInscriptionsParSession,
    getAllInscriptions,
};

export default inscriptionService;
