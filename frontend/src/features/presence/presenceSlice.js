import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import presenceService from './presenceService';

const initialState = {
    presences: [],       // Liste des présences pour la séance/date sélectionnée
    editable: true,      // Si la date est encore dans la fenêtre de 48h
    stats: null,         // Statistiques de présence d'un étudiant
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: ''
};

// Récupérer l'appel d'une séance pour une date
export const fetchPresence = createAsyncThunk(
    'presence/fetch',
    async ({ seanceId, date }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await presenceService.getPresenceBySeance(seanceId, date, token);
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Enregistrer l'appel complet
export const savePresence = createAsyncThunk(
    'presence/save',
    async (presenceData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await presenceService.savePresence(presenceData, token);
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer l'historique d'un étudiant
export const fetchPresenceByInscription = createAsyncThunk(
    'presence/fetchByInscription',
    async (inscriptionId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await presenceService.getPresenceByInscription(inscriptionId, token);
        } catch (error) {
            const message = error.response?.data?.message || error.message;
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const presenceSlice = createSlice({
    name: 'presence',
    initialState,
    reducers: {
        resetPresence: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        }
    },
    extraReducers: (builder) => {
        builder
            // fetchPresence
            .addCase(fetchPresence.pending, (state) => { state.isLoading = true; })
            .addCase(fetchPresence.fulfilled, (state, action) => {
                state.isLoading = false;
                state.presences = action.payload.data;
                state.editable = action.payload.editable;
            })
            .addCase(fetchPresence.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // savePresence
            .addCase(savePresence.pending, (state) => { state.isLoading = true; })
            .addCase(savePresence.fulfilled, (state) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.message = 'Appel enregistré avec succès !';
            })
            .addCase(savePresence.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // fetchPresenceByInscription
            .addCase(fetchPresenceByInscription.pending, (state) => { state.isLoading = true; })
            .addCase(fetchPresenceByInscription.fulfilled, (state, action) => {
                state.isLoading = false;
                state.presences = action.payload.data;
                state.stats = action.payload.stats;
            })
            .addCase(fetchPresenceByInscription.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { resetPresence } = presenceSlice.actions;
export default presenceSlice.reducer;
