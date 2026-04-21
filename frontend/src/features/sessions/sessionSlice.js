import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import sessionService from './sessionService';

const initialState = {
    sessions: [],
    session: null,
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Créer une nouvelle session
export const createSession = createAsyncThunk(
    'sessions/create',
    async (sessionData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.createSession(sessionData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer toutes les sessions
export const getAllSessions = createAsyncThunk(
    'sessions/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.getAllSessions(token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer les sessions de l'enseignant
export const getTeacherSessions = createAsyncThunk(
    'sessions/getTeacherSessions',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.getTeacherSessions(token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer une session par ID
export const getSessionById = createAsyncThunk(
    'sessions/getById',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.getSessionById(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Ajouter un cours à une session
export const ajouterCoursSession = createAsyncThunk(
    'sessions/addCours',
    async ({ sessionId, coursData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.ajouterCoursSession(sessionId, coursData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Marquer une session comme terminée
export const completeSession = createAsyncThunk(
    'sessions/complete',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.completeSession(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Activer/Désactiver la publication d'une session
export const togglePublishSession = createAsyncThunk(
    'sessions/togglePublish',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.togglePublishSession(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Mettre à jour une session
export const updateSession = createAsyncThunk(
    'sessions/update',
    async ({ id, sessionData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.updateSession(id, sessionData, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Supprimer une session
export const deleteSession = createAsyncThunk(
    'sessions/delete',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await sessionService.deleteSession(id, token);
        } catch (error) {
            const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const sessionSlice = createSlice({
    name: 'sessions',
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
            // Create Session
            .addCase(createSession.pending, (state) => { state.isLoading = true; })
            .addCase(createSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.sessions.push(action.payload.session);
            })
            .addCase(createSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get All Sessions
            .addCase(getAllSessions.pending, (state) => { state.isLoading = true; })
            .addCase(getAllSessions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.sessions = action.payload.sessions;
            })
            .addCase(getAllSessions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get Teacher Sessions
            .addCase(getTeacherSessions.pending, (state) => { state.isLoading = true; })
            .addCase(getTeacherSessions.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.sessions = action.payload.sessions;
            })
            .addCase(getTeacherSessions.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Get Session By ID
            .addCase(getSessionById.pending, (state) => { state.isLoading = true; })
            .addCase(getSessionById.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.session = action.payload.session;
            })
            .addCase(getSessionById.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Add Course to Session
            .addCase(ajouterCoursSession.pending, (state) => { state.isLoading = true; })
            .addCase(ajouterCoursSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.session = action.payload.session;
                state.sessions = state.sessions.map((s) => s._id === action.payload.session._id ? action.payload.session : s);
            })
            .addCase(ajouterCoursSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Complete Session
            .addCase(completeSession.pending, (state) => { state.isLoading = true; })
            .addCase(completeSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.sessions = state.sessions.map((s) => s._id === action.payload.session._id ? action.payload.session : s);
            })
            .addCase(completeSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Toggle Publish Session
            .addCase(togglePublishSession.pending, (state) => { state.isLoading = true; })
            .addCase(togglePublishSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.sessions = state.sessions.map((s) => s._id === action.payload.session._id ? action.payload.session : s);
            })
            .addCase(togglePublishSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Session
            .addCase(updateSession.pending, (state) => { state.isLoading = true; })
            .addCase(updateSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.sessions = state.sessions.map((s) => s._id === action.payload.session._id ? action.payload.session : s);
                if (state.session && state.session._id === action.payload.session._id) {
                    state.session = action.payload.session;
                }
            })
            .addCase(updateSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Delete Session
            .addCase(deleteSession.pending, (state) => { state.isLoading = true; })
            .addCase(deleteSession.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.sessions = state.sessions.filter((s) => s._id !== action.meta.arg);
            })
            .addCase(deleteSession.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset } = sessionSlice.actions;
export default sessionSlice.reducer;
