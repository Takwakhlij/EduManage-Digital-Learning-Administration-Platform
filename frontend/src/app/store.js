import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import adminReducer from '../features/admin/adminSlice';
import classeReducer from '../features/classes/classeSlice';
import matiereReducer from '../features/matieres/matiereSlice';

export const store = configureStore({
    reducer: {
        auth: authReducer,
        admin: adminReducer,
        classes: classeReducer,
        matieres: matiereReducer,
    },
});
