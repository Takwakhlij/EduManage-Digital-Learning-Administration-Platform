import axios from 'axios';

const API_URL = '/api/classes/';

// Créer une nouvelle classe
const createClasse = async (classeData, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(API_URL, classeData, config);
    return response.data;
};

// Récupérer les classes de l'étudiant connecté
const getClasses = async (token, studentId = null) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    let url = API_URL;
    if (studentId) url += `?studentId=${studentId}`;
    const response = await axios.get(url, config);
    return response.data;
};

// Récupérer toutes les classes disponibles (pour auto-inscription)
const getAvailableClasses = async (token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(API_URL + 'available', config);
    return response.data;
};

// Récupérer une classe par ID
const getClasseById = async (id, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.get(API_URL + id, config);
    return response.data;
};

// Modifier une classe
const updateClasse = async (id, classeData, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(API_URL + id, classeData, config);
    return response.data;
};

// Supprimer une classe
const deleteClasse = async (id, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.delete(API_URL + id, config);
    return { ...response.data, id };
};

// Modifier le planning d'une classe
const updateClassePlanning = async (id, planningData, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(API_URL + id + '/planning', { planning: planningData }, config);
    return response.data;
};

// Modifier les étudiants d'une classe
const updateClasseEtudiants = async (id, etudiantsData, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.put(API_URL + id + '/etudiants', { etudiants: etudiantsData }, config);
    return response.data;
};

// Auto-inscription dans une classe
const enrollInClasse = async (id, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.post(API_URL + id + '/enroll', {}, config);
    return response.data;
};

// Désinscription d'une classe
const unenrollFromClasse = async (id, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.delete(API_URL + id + '/enroll', config);
    return { ...response.data, id };
};

const classeService = {
    createClasse,
    getClasses,
    getAvailableClasses,
    getClasseById,
    updateClasse,
    deleteClasse,
    updateClassePlanning,
    updateClasseEtudiants,
    enrollInClasse,
    unenrollFromClasse,
};

export default classeService;
