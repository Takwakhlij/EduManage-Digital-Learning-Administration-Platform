import axios from 'axios'; // Axios est utilisé pour envoyer des requêtes HTTP (GET, POST, etc.) vers le Backend

// L'URL de base pour les requêtes de cette fonctionnalité (sera préfixée automatiquement par le proxy dans vite.config.js le cas échéant)
const API_URL = '/api/users/';

// Register user (Inscription)
// @action  Envoie les données du formulaire au backend. Si le backend renvoie un jeton, on connecte l'utilisateur en le sauvegardant localement.
const register = async (userData) => {
    const response = await axios.post(API_URL + 'register', userData);

    if (response.data && response.data.token) {
        // Sauvegarde des données utilisateur et du Jeton (Token) dans le LocalStorage du navigateur
        // Cela permet de rester connecté même si on ferme l'onglet ou rafraîchit la page
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data; // Retourne les données pour que le Slice Redux puisse mettre à jour l'état de l'application
};

// Login user (Connexion)
// @action  Envoie les identifiants au backend. En cas de succès, stocke les informations de session localement.
const login = async (userData) => {
    const response = await axios.post(API_URL + 'login', userData);
    // response.data contient les données utilisateur renvoyées par le backend (incluant le Token JWT)

    if (response.data) {
        // Sauvegarde la session dans le navigateur
        localStorage.setItem('user', JSON.stringify(response.data));
        // JSON.stringify convertit l'objet JS complexe en chaîne de caractères pour le stocker dans Local Storage
    }

    return response.data;
};

// Logout user (Déconnexion)
// @action  Supprime les informations d'identification locales. Au prochain rechargement ou navigation, l'utilisateur devra se reconnecter.
const logout = () => {
    localStorage.removeItem('user'); // remove user from local storage
};

// Update user profile
const updateProfile = async (formData, token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
            // Don't set Content-Type - let browser set it with boundary for FormData
        },
    };

    const response = await axios.put(API_URL + 'profile', formData, config);

    if (response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
    }

    return response.data;
};

// Get user data
const getMe = async (token) => {
    const config = {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    };

    const response = await axios.get(API_URL + 'me', config);

    if (response.data) {
        // Merge the new data with the existing token because /me might not return the token
        const existingUser = JSON.parse(localStorage.getItem('user'));
        const updatedUser = { ...existingUser, ...response.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        return updatedUser;
    }

    return response.data;
};

// Deactivate own account (Soft Delete)
const deactivateAccount = async (token) => {
    const config = {
        headers: { Authorization: `Bearer ${token}` },
    };
    const response = await axios.put(API_URL + 'deactivate', {}, config);
    // Remove user from localStorage since account is now inactive
    localStorage.removeItem('user');
    return response.data;
};

const authService = {
    register,
    login,
    logout,
    updateProfile,
    getMe,
    deactivateAccount,
};

export default authService;

