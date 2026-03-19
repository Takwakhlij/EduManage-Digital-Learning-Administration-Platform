import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import classeService from './classeService';

const initialState = {
    classes: [],
    availableClasses: [],
    classe: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    enrollLoading: false,
    enrollMessage: '',
    message: '',
};

// Créer une nouvelle classe
export const createClasse = createAsyncThunk(
    'classes/create',
    async (classeData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.createClasse(classeData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer toutes les classes (pour l'étudiant connecté)
export const getClasses = createAsyncThunk(
    'classes/getAll',
    async (studentId = null, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.getClasses(token, studentId);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer toutes les classes disponibles (auto-inscription)
export const getAvailableClasses = createAsyncThunk(
    'classes/getAvailable',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.getAvailableClasses(token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer une classe par ID
export const getClasseById = createAsyncThunk(
    'classes/getById',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.getClasseById(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Modifier une classe
export const updateClasse = createAsyncThunk(
    'classes/update',
    async ({ id, classeData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.updateClasse(id, classeData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Supprimer une classe
export const deleteClasse = createAsyncThunk(
    'classes/delete',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.deleteClasse(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Mettre à jour le planning d'une classe
export const updateClassePlanning = createAsyncThunk(
    'classes/updatePlanning',
    async ({ id, planningData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.updateClassePlanning(id, planningData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Mettre à jour les étudiants d'une classe
export const updateClasseEtudiants = createAsyncThunk(
    'classes/updateEtudiants',
    async ({ id, etudiantsData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.updateClasseEtudiants(id, etudiantsData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Auto-inscription dans une classe
export const enrollInClasse = createAsyncThunk(
    'classes/enroll',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.enrollInClasse(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Désinscription d'une classe
export const unenrollFromClasse = createAsyncThunk(
    'classes/unenroll',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.unenrollFromClasse(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const classeSlice = createSlice({
    name: 'classes',
    initialState,
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        resetEnroll: (state) => {
            state.enrollLoading = false;
            state.enrollMessage = '';
        },
    },
    extraReducers: (builder) => {
        builder
            // Create Classe
            .addCase(createClasse.pending, (state) => { state.isLoading = true; })
            .addCase(createClasse.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classes.unshift(action.payload.data);
            })
            .addCase(createClasse.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get All Classes
            .addCase(getClasses.pending, (state) => { state.isLoading = true; })
            .addCase(getClasses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classes = action.payload.data;
            })
            .addCase(getClasses.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get Available Classes
            .addCase(getAvailableClasses.pending, (state) => { state.isLoading = true; })
            .addCase(getAvailableClasses.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.availableClasses = action.payload.data;
            })
            .addCase(getAvailableClasses.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get Classe By ID
            .addCase(getClasseById.pending, (state) => { state.isLoading = true; })
            .addCase(getClasseById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classe = action.payload.data;
            })
            .addCase(getClasseById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Classe
            .addCase(updateClasse.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
            })
            .addCase(updateClasse.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classe = action.payload.data;
                state.classes = state.classes.map((c) =>
                    c._id === action.payload.data._id ? action.payload.data : c
                );
            })
            .addCase(updateClasse.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete Classe
            .addCase(deleteClasse.pending, (state) => { state.isLoading = true; })
            .addCase(deleteClasse.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classes = state.classes.filter((c) => c._id !== action.payload.id);
            })
            .addCase(deleteClasse.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Classe Planning
            .addCase(updateClassePlanning.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
            })
            .addCase(updateClassePlanning.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classe = action.payload.data;
                state.classes = state.classes.map((c) =>
                    c._id === action.payload.data._id ? action.payload.data : c
                );
            })
            .addCase(updateClassePlanning.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Classe Etudiants
            .addCase(updateClasseEtudiants.pending, (state) => {
                state.isLoading = true;
                state.isError = false;
                state.isSuccess = false;
            })
            .addCase(updateClasseEtudiants.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classe = action.payload.data;
                state.classes = state.classes.map((c) =>
                    c._id === action.payload.data._id ? action.payload.data : c
                );
            })
            .addCase(updateClasseEtudiants.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Enroll in Classe
            .addCase(enrollInClasse.pending, (state) => {
                state.enrollLoading = true;
                state.enrollMessage = '';
            })
            .addCase(enrollInClasse.fulfilled, (state, action) => {
                state.enrollLoading = false;
                state.enrollMessage = 'success';
                const enrolled = action.payload.data;
                if (!state.classes.find(c => c._id === enrolled._id)) {
                    state.classes.push(enrolled);
                }
                state.availableClasses = state.availableClasses.map(c =>
                    c._id === enrolled._id ? enrolled : c
                );
            })
            .addCase(enrollInClasse.rejected, (state, action) => {
                state.enrollLoading = false;
                state.enrollMessage = action.payload;
            })
            // Unenroll from Classe
            .addCase(unenrollFromClasse.pending, (state) => { state.enrollLoading = true; })
            .addCase(unenrollFromClasse.fulfilled, (state, action) => {
                state.enrollLoading = false;
                state.enrollMessage = 'unenrolled';
                state.classes = state.classes.filter(c => c._id !== action.payload.id);
            })
            .addCase(unenrollFromClasse.rejected, (state, action) => {
                state.enrollLoading = false;
                state.enrollMessage = action.payload;
            });
    },
});

export const { reset, resetEnroll } = classeSlice.actions;
export default classeSlice.reducer;
