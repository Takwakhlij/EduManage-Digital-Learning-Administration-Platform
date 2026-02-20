import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import classeService from './classeService';

const initialState = {
    classes: [],
    classe: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
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
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer toutes les classes
export const getClasses = createAsyncThunk(
    'classes/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await classeService.getClasses(token);
        } catch (error) {
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
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
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
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
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
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
            const message =
                (error.response &&
                    error.response.data &&
                    error.response.data.message) ||
                error.message ||
                error.toString();
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
    },
    extraReducers: (builder) => {
        builder
            // Create Classe
            .addCase(createClasse.pending, (state) => {
                state.isLoading = true;
            })
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
            .addCase(getClasses.pending, (state) => {
                state.isLoading = true;
            })
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
            // Get Classe By ID
            .addCase(getClasseById.pending, (state) => {
                state.isLoading = true;
            })
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
                // Mettre à jour la classe courante
                state.classe = action.payload.data;
                // Mettre à jour dans la liste aussi
                state.classes = state.classes.map((classe) =>
                    classe._id === action.payload.data._id
                        ? action.payload.data
                        : classe
                );
            })
            .addCase(updateClasse.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete Classe
            .addCase(deleteClasse.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteClasse.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.classes = state.classes.filter(
                    (classe) => classe._id !== action.payload.id
                );
            })
            .addCase(deleteClasse.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = classeSlice.actions;
export default classeSlice.reducer;
