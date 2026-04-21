import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import adminReducer from '../features/admin/adminSlice';
import classeReducer from '../features/classes/classeSlice';
import matiereReducer from '../features/matieres/matiereSlice';
import coursReducer from '../features/cours/coursSlice';
import sessionReducer from '../features/sessions/sessionSlice';
import inscriptionReducer from '../features/inscriptions/inscriptionSlice';
import seanceReducer from '../features/seances/seanceSlice';
import presenceReducer from '../features/presence/presenceSlice';
import paiementReducer from '../features/paiements/paiementSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        admin: adminReducer,
        classes: classeReducer,
        matieres: matiereReducer,
        cours: coursReducer,
        sessions: sessionReducer,
        inscriptions: inscriptionReducer,
        seances: seanceReducer,
        presence: presenceReducer,
        paiements: paiementReducer,
    },
});
