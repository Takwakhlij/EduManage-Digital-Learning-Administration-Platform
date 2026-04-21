import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import seanceService from './seanceService';

const initialState = {
    seances: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Créer une séance
export const createSeance = createAsyncThunk(
    'seances/create',
    async (seanceData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await seanceService.createSeance(seanceData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer toutes les séances (calendrier global)
export const getAllSeances = createAsyncThunk(
    'seances/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await seanceService.getAllSeances(token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer les séances par session
export const getSeancesBySession = createAsyncThunk(
    'seances/getBySession',
    async (sessionId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await seanceService.getSeancesBySession(sessionId, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer les séances par enseignant
export const getSeancesByEnseignant = createAsyncThunk(
    'seances/getByEnseignant',
    async (enseignantId, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await seanceService.getSeancesByEnseignant(enseignantId, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Mettre à jour une séance
export const updateSeance = createAsyncThunk(
    'seances/update',
    async ({ id, seanceData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await seanceService.updateSeance(id, seanceData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Supprimer une séance
export const deleteSeance = createAsyncThunk(
    'seances/delete',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await seanceService.deleteSeance(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const seanceSlice = createSlice({
    name: 'seance',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(createSeance.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createSeance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.seances.push(action.payload);
            })
            .addCase(createSeance.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getAllSeances.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getAllSeances.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.seances = action.payload;
            })
            .addCase(getAllSeances.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getSeancesBySession.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSeancesBySession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.seances = action.payload;
            })
            .addCase(getSeancesBySession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(getSeancesByEnseignant.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getSeancesByEnseignant.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.seances = action.payload;
            })
            .addCase(getSeancesByEnseignant.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateSeance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.seances = state.seances.map((s) =>
                    s._id === action.payload._id ? action.payload : s
                );
            })
            .addCase(deleteSeance.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Since delete only returns a message, we might need to filter by ID from session. Look into service return
                state.seances = state.seances.filter((s) => s._id !== action.meta.arg);
            });
    },
});

export const { reset } = seanceSlice.actions;
export default seanceSlice.reducer;
