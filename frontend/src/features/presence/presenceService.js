import axios from 'axios';

const API_URL = 'http://localhost:5000/api/presences';

// Récupérer l'appel d'une séance pour une date donnée
const getPresenceBySeance = async (seanceId, date, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(`${API_URL}?seanceId=${seanceId}&date=${date}`, config);
    return response.data;
};

// Enregistrer tout l'appel
const savePresence = async (presenceData, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(API_URL, presenceData, config);
    return response.data;
};

// Récupérer l'historique de présence d'un étudiant
const getPresenceByInscription = async (inscriptionId, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(`${API_URL}/etudiant?inscriptionId=${inscriptionId}`, config);
    return response.data;
};

const presenceService = { getPresenceBySeance, savePresence, getPresenceByInscription };
export default presenceService;
