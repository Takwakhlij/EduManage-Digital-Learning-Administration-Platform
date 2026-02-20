
import axios from 'axios';

const API_URL = '/api/matieres/';

// Créer une nouvelle matiere
const createMatiere = async (matiereData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.post(API_URL, matiereData, config);

    return response.data;
};

// Récupérer toutes les matieres
const getMatieres = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL, config);

    return response.data;
};

// Supprimer une matiere
const deleteMatiere = async (id, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.delete(API_URL + id, config);

    return response.data;
};

const matiereService = {
    createMatiere,
    getMatieres,
    deleteMatiere,
};

export default matiereService;
