import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import inscriptionService from './inscriptionService';

const initialState = {
    inscriptions: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Inscrire un étudiant
export const createInscription = createAsyncThunk(
    'inscriptions/create',
    async (inscriptionData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await inscriptionService.inscrireEtudiant(inscriptionData, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Get ALL inscriptions (Admin)
export const getAllInscriptions = createAsyncThunk(
    'inscriptions/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await inscriptionService.getAllInscriptions(token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Inscrire un étudiant (enroll)
export const inscrireEtudiant = createAsyncThunk(
    'inscriptions/enroll',
    async (inscriptionData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await inscriptionService.inscrireEtudiant(inscriptionData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer les inscriptions d'une session
export const getInscriptionsParSession = createAsyncThunk(
    'inscriptions/getBySession',
    async (sessionId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await inscriptionService.getInscriptionsParSession(sessionId, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Mettre à jour le statut d'une inscription (Admin)
export const updateInscriptionStatut = createAsyncThunk(
    'inscriptions/updateStatut',
    async ({ id, statut }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await inscriptionService.updateStatutInscription(id, statut, token);
        } catch (error) {
            const message =
                (error.response && error.response.data && error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const inscriptionSlice = createSlice({
    name: 'inscriptions',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            // Enroll Student
            .addCase(inscrireEtudiant.pending, (state) => { state.isLoading = true; })
            .addCase(inscrireEtudiant.fulfilled, (state) => {
                state.isLoading = false;
                state.isSuccess = true;
            })
            .addCase(inscrireEtudiant.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get Inscriptions By Session
            .addCase(getInscriptionsParSession.pending, (state) => { state.isLoading = true; })
            .addCase(getInscriptionsParSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.inscriptions = action.payload.inscriptions;
            })
            .addCase(getInscriptionsParSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Create Inscription
            .addCase(createInscription.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createInscription.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.inscriptions.push(action.payload.inscription);
            })
            .addCase(createInscription.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get All Inscriptions
            .addCase(getAllInscriptions.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllInscriptions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.inscriptions = action.payload.inscriptions;
            })
            .addCase(getAllInscriptions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Inscription Statut
            .addCase(updateInscriptionStatut.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateInscriptionStatut.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Update the inscription in the list
                const updated = action.payload.inscription;
                state.inscriptions = state.inscriptions.map((ins) =>
                    ins._id === updated._id ? updated : ins
                );
            })
            .addCase(updateInscriptionStatut.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = inscriptionSlice.actions;
export default inscriptionSlice.reducer;
