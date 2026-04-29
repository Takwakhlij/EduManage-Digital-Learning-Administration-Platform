import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import actualiteService from './actualiteService';

const initialState = {
    actualites: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Obtenir toutes les actualités (Public)
export const getActualites = createAsyncThunk(
    'actualites/getAll',
    async (_, thunkAPI) => {
        try {
            return await actualiteService.getActualites();
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Créer une actualité (Admin)
export const createActualite = createAsyncThunk(
    'actualites/create',
    async (actualiteData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await actualiteService.createActualite(actualiteData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Modifier une actualité (Admin)
export const updateActualite = createAsyncThunk(
    'actualites/update',
    async (data, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await actualiteService.updateActualite(data.id, data.actualiteData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Supprimer une actualité (Admin)
export const deleteActualite = createAsyncThunk(
    'actualites/delete',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await actualiteService.deleteActualite(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const actualiteSlice = createSlice({
    name: 'actualite',
    initialState,
    reducers: {
        reset: (state) => initialState,
    },
    extraReducers: (builder) => {
        builder
            .addCase(getActualites.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getActualites.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.actualites = action.payload.data;
            })
            .addCase(getActualites.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createActualite.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createActualite.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.actualites.unshift(action.payload.data);
            })
            .addCase(createActualite.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateActualite.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateActualite.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                const index = state.actualites.findIndex(a => a._id === action.payload.data._id);
                if (index !== -1) {
                    state.actualites[index] = action.payload.data;
                }
            })
            .addCase(updateActualite.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(deleteActualite.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(deleteActualite.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Assuming action.meta.arg contains the id that was passed
                state.actualites = state.actualites.filter(
                    (actualite) => actualite._id !== action.meta.arg
                );
            })
            .addCase(deleteActualite.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = actualiteSlice.actions;
export default actualiteSlice.reducer;
