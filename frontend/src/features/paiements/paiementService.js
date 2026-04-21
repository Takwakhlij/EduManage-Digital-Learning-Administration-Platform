import axios from 'axios';

const API_URL = '/api/paiements/';

const config = (token) => ({
    headers: { Authorization: `Bearer ${token}` }
});

// Enregistrer un versement
const enregistrerPaiement = async (data, token) => {
    const response = await axios.post(API_URL, data, config(token));
    return response.data;
};

// Historique des paiements d'une inscription
const getPaiementsParInscription = async (inscriptionId, token) => {
    const response = await axios.get(`${API_URL}inscription/${inscriptionId}`, config(token));
    return response.data;
};

// Liste des débiteurs
const getDebiteurs = async (token) => {
    const response = await axios.get(`${API_URL}debiteurs`, config(token));
    return response.data;
};

// Rapport caisse du jour (optionnel: ?date=YYYY-MM-DD)
const getCaisseJour = async (date, token) => {
    const url = date ? `${API_URL}caisse?date=${date}` : `${API_URL}caisse`;
    const response = await axios.get(url, config(token));
    return response.data;
};

// Supprimer un paiement
const deletePaiement = async (id, token) => {
    const response = await axios.delete(`${API_URL}${id}`, config(token));
    return response.data;
};

const paiementService = {
    enregistrerPaiement,
    getPaiementsParInscription,
    getDebiteurs,
    getCaisseJour,
    deletePaiement,
};

export default paiementService;
