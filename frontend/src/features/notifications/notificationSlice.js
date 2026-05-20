import axios from 'axios';
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = '/api/notifications';

// Clé Publique VAPID (la même générée sur le backend)
const VAPID_PUBLIC_KEY = 'BFjwshTxTFrIRwCzG2HmiYMYR8U0hwpQfi8_5Cv4neSG9zDSL9mVMwQDM_-Hvamc5AFNKViYhcmzLGmBDVPGviQ';

// Fonction utilitaire : convertit la clé VAPID en format que le navigateur comprend
function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

// Enregistrer le Service Worker et demander la permission
export const subscribeToPush = createAsyncThunk(
    'notifications/subscribe',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;

            // 1. Enregistrer le Service Worker (le script arrière-plan)
            const registration = await navigator.serviceWorker.register('/sw.js');

            // 2. Demander la permission à l'utilisateur
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                return thunkAPI.rejectWithValue('Permission refusée par l\'utilisateur.');
            }

            // 3. Obtenir le "Ticket" (Subscription) du navigateur
            const subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
            });

            // 4. Envoyer le "Ticket" à votre Backend pour l'enregistrer
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.post(`${API_URL}/subscribe`, subscription.toJSON(), config);

            return true;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Récupérer la liste des notifications de l'utilisateur
export const getMyNotifications = createAsyncThunk(
    'notifications/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user?.token;
            if (!token) return thunkAPI.rejectWithValue('No token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(API_URL, config);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            if (error.response?.status === 401) {
                localStorage.removeItem('user');
                thunkAPI.dispatch({ type: 'auth/logout/fulfilled' });
            }
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Marquer une notification comme lue
export const markNotificationAsRead = createAsyncThunk(
    'notifications/markRead',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`${API_URL}/${id}/read`, {}, config);
            return id;
        } catch (error) {
            const message = error.response?.data?.message || error.message || error.toString();
            return thunkAPI.rejectWithValue(message);
        }
    }
);

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        notifications: [],
        isSubscribed: false,
        isLoading: false,
        isError: false,
        message: '',
    },
    reducers: {
        reset: (state) => {
            state.isLoading = false;
            state.isError = false;
            state.message = '';
        },
    },
    extraReducers: (builder) => {
        builder
            // S'abonner
            .addCase(subscribeToPush.pending, (state) => { state.isLoading = true; })
            .addCase(subscribeToPush.fulfilled, (state) => {
                state.isLoading = false;
                state.isSubscribed = true;
            })
            .addCase(subscribeToPush.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Récupérer les notifications
            .addCase(getMyNotifications.fulfilled, (state, action) => {
                state.notifications = action.payload;
            })
            // Marquer comme lue
            .addCase(markNotificationAsRead.fulfilled, (state, action) => {
                const notif = state.notifications.find(n => n._id === action.payload);
                if (notif) notif.isRead = true;
            });
    },
});

export const { reset } = notificationSlice.actions;
export default notificationSlice.reducer;
