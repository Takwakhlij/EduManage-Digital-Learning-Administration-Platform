import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import coursService from './coursService';

const initialState = {
    cours: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Récupérer les cours (avec studentId optionnel pour le cas parent→enfant)
export const getCours = createAsyncThunk('cours/getAll', async (params = {}, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        return await coursService.getCours(token, params);
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Créer un cours
export const createCours = createAsyncThunk('cours/create', async (coursData, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        return await coursService.createCours(coursData, token);
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Mettre à jour un cours
export const updateCours = createAsyncThunk('cours/update', async ({ id, coursData }, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        return await coursService.updateCours(id, coursData, token);
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

// Supprimer un cours
export const deleteCours = createAsyncThunk('cours/delete', async (id, thunkAPI) => {
    try {
        const token = thunkAPI.getState().auth.user.token;
        return await coursService.deleteCours(id, token);
    } catch (error) {
        const message = (error.response?.data?.message) || error.message || error.toString();
        return thunkAPI.rejectWithValue(message);
    }
});

export const coursSlice = createSlice({
    name: 'cours',
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
            // Get All
            .addCase(getCours.pending, (state) => { state.isLoading = true; })
            .addCase(getCours.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.cours = action.payload.data;
            })
            .addCase(getCours.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Create
            .addCase(createCours.pending, (state) => { state.isLoading = true; })
            .addCase(createCours.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                if (action.payload && action.payload.data) {
                    state.cours.unshift(action.payload.data);
                }
            })
            .addCase(createCours.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update
            .addCase(updateCours.pending, (state) => { state.isLoading = true; })
            .addCase(updateCours.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                if (action.payload && action.payload.data) {
                    state.cours = state.cours.map((c) =>
                        c._id === action.payload.data._id ? action.payload.data : c
                    );
                }
            })
            .addCase(updateCours.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete
            .addCase(deleteCours.pending, (state) => { state.isLoading = true; })
            .addCase(deleteCours.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.cours = state.cours.filter((c) => c._id !== action.payload.id);
            })
            .addCase(deleteCours.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = coursSlice.actions;
export default coursSlice.reducer;
