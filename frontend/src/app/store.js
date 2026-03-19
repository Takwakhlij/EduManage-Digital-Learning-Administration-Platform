import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import adminReducer from '../features/admin/adminSlice';
import classeReducer from '../features/classes/classeSlice';
import matiereReducer from '../features/matieres/matiereSlice';
import coursReducer from '../features/cours/coursSlice';
import sessionReducer from '../features/sessions/sessionSlice';
import inscriptionReducer from '../features/inscriptions/inscriptionSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        admin: adminReducer,
        classes: classeReducer,
        matieres: matiereReducer,
        cours: coursReducer,
        sessions: sessionReducer,
        inscriptions: inscriptionReducer,
    },
});
