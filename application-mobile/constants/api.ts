// Replace with your computer's local IP address (e.g., 192.168.1.50)
// You can find it by running 'ipconfig' in your terminal
export const SERVER_URL = 'http://192.168.1.85:5000';
export const BASE_URL = `${SERVER_URL}/api`; 

export const API_ENDPOINTS = {
  LOGIN: `${BASE_URL}/users/login`,
  REGISTER: `${BASE_URL}/users/register`,
  GET_ME: `${BASE_URL}/users/me`,
  UPDATE_PROFILE: `${BASE_URL}/users/profile`,
  
  // Sessions
  GET_ALL_SESSIONS: `${BASE_URL}/sessions`,
  GET_TEACHER_SESSIONS: `${BASE_URL}/sessions/teacher`,
  GET_SESSION_DETAILS: (id: string) => `${BASE_URL}/sessions/${id}`,
  COMPLETE_SESSION: (id: string) => `${BASE_URL}/sessions/${id}/complete`,
  UPLOAD_SESSION_RESOURCES: (id: string) => `${BASE_URL}/sessions/${id}/cours`,
  
  // Inscriptions & Presence
  CREATE_INSCRIPTION: `${BASE_URL}/inscriptions`,
  GET_MY_INSCRIPTIONS: `${BASE_URL}/inscriptions/my`,
  GET_SESSION_STUDENTS: (id: string) => `${BASE_URL}/inscriptions/session/${id}`,
  GET_SESSION_SEANCES: (id: string) => `${BASE_URL}/seances/session/${id}`,
  GET_TEACHER_SEANCES: (id: string) => `${BASE_URL}/seances/enseignant/${id}`,
  GET_SEANCES_BY_SESSION: (sessionId: string) => `${BASE_URL}/seances/session/${sessionId}`,
  GET_PRESENCE: `${BASE_URL}/presences`,
  SAVE_PRESENCE: `${BASE_URL}/presences`,
  GET_MY_PRESENCE_STATS: (id: string) => `${BASE_URL}/presences/etudiant/${id}/stats`,

  // Paiements
  GET_MY_PAIEMENTS: `${BASE_URL}/paiements/my`,
  CREATE_PAYMENT_INTENT: `${BASE_URL}/paiements/create-payment-intent`,
  CONFIRM_STRIPE_PAYMENT: `${BASE_URL}/paiements/confirm-stripe-payment`,
  MOBILE_DEMO_STRIPE: `${BASE_URL}/paiements/mobile-demo-stripe`,

  // Cours (Ressources)
  GET_MY_COURS: `${BASE_URL}/cours`,
  GET_SESSION_COURS: (sessionId: string) => `${BASE_URL}/cours?sessionId=${sessionId}`,
  UPLOAD_COURS: `${BASE_URL}/cours`,

  // Actualités & Annonces
  GET_ACTUALITES: `${BASE_URL}/actualites`,

  // Notifications
  GET_NOTIFICATIONS: `${BASE_URL}/notifications`,

  // Certificats
  GET_MY_CERTIFICATES: `${BASE_URL}/certificates/my`,
  DOWNLOAD_CERTIFICATE: (id: string) => `${BASE_URL}/certificates/${id}/download`,
};

