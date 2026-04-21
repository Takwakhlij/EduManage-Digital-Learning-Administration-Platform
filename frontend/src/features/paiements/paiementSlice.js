import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import paiementService from './paiementService';

const initialState = {
    paiements: [],
    debiteurs: [],
    caisse: null,
    resume: null,
    isLoading: false,
    isError: false,
    isSuccess: false,
    message: '',
};

// Enregistrer un versement
export const enregistrerPaiement = createAsyncThunk(
    'paiements/enregistrer',
    async (data, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await paiementService.enregistrerPaiement(data, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Historique des paiements d'une inscription
export const getPaiementsParInscription = createAsyncThunk(
    'paiements/getByInscription',
    async (inscriptionId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await paiementService.getPaiementsParInscription(inscriptionId, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Liste des débiteurs
export const getDebiteurs = createAsyncThunk(
    'paiements/debiteurs',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await paiementService.getDebiteurs(token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Rapport caisse du jour
export const getCaisseJour = createAsyncThunk(
    'paiements/caisse',
    async (date, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await paiementService.getCaisseJour(date, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Supprimer un paiement
export const deletePaiement = createAsyncThunk(
    'paiements/delete',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await paiementService.deletePaiement(id, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const paiementSlice = createSlice({
    name: 'paiements',
    initialState,
    reducers: {
        resetPaiement: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearPaiements: (state) => {
            state.paiements = [];
            state.resume = null;
        }
    },
    extraReducers: (builder) => {
        builder
            // Enregistrer paiement
            .addCase(enregistrerPaiement.pending, (state) => { state.isLoading = true; })
            .addCase(enregistrerPaiement.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.paiements.unshift(action.payload.paiement);
            })
            .addCase(enregistrerPaiement.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get paiements inscription
            .addCase(getPaiementsParInscription.pending, (state) => { state.isLoading = true; })
            .addCase(getPaiementsParInscription.fulfilled, (state, action) => {
                state.isLoading = false;
                state.paiements = action.payload.paiements;
                state.resume = action.payload.resume;
            })
            .addCase(getPaiementsParInscription.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Débiteurs
            .addCase(getDebiteurs.pending, (state) => { state.isLoading = true; })
            .addCase(getDebiteurs.fulfilled, (state, action) => {
                state.isLoading = false;
                state.debiteurs = action.payload.debiteurs;
            })
            .addCase(getDebiteurs.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Caisse jour
            .addCase(getCaisseJour.pending, (state) => { state.isLoading = true; })
            .addCase(getCaisseJour.fulfilled, (state, action) => {
                state.isLoading = false;
                state.caisse = action.payload;
            })
            .addCase(getCaisseJour.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete paiement
            .addCase(deletePaiement.pending, (state) => { state.isLoading = true; })
            .addCase(deletePaiement.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.paiements = state.paiements.filter(p => p._id !== action.payload.id);
            })
            .addCase(deletePaiement.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    }
});

export const { resetPaiement, clearPaiements } = paiementSlice.actions;
export default paiementSlice.reducer;
