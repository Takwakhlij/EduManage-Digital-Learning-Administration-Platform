import axios from 'axios';

const API_URL = '/api/cours/';

// Récupérer les cours de l'enseignant connecté ou de l'étudiant
const getCours = async (token, { matiereId = null, studentId = null } = {}) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const params = [];
    if (matiereId) params.push(`matiereId=${matiereId}`);
    if (studentId) params.push(`studentId=${studentId}`);
    let url = API_URL + (params.length ? '?' + params.join('&') : '');
    const response = await axios.get(url, config);
    return response.data;
};

// Créer un cours (avec fichier via FormData)
const createCours = async (coursData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    };
    try {
        const response = await axios.post(API_URL, coursData, config);
        console.log("Create Cours Success Response:", response.data);
        return response.data;
    } catch (error) {
        console.error("Create Cours Axios Error:", error);
        throw error;
    }
};

// Mettre à jour un cours
const updateCours = async (id, coursData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
        },
    };
    const response = await axios.put(API_URL + id, coursData, config);
    return response.data;
};

// Supprimer un cours
const deleteCours = async (id, token) => {
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const response = await axios.delete(API_URL + id, config);
    return { ...response.data, id };
};

const coursService = {
    getCours,
    createCours,
    updateCours,
    deleteCours,
};

export default coursService;
