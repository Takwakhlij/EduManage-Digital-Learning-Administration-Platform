import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import adminService from './adminService';

const initialState = {
    users: [],
    isError: false,
    isSuccess: false,
    isLoading: false,
    message: '',
};

// Get all users
export const getUsers = createAsyncThunk(
    'admin/getAll',
    async (_, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await adminService.getUsers(token);
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

// Create new user (Admin)
export const createUserAdmin = createAsyncThunk(
    'admin/createUser',
    async (userData, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await adminService.createUserAdmin(userData, token);
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

// Update user status
export const updateUserStatus = createAsyncThunk(
    'admin/updateStatus',
    async ({ id, status }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await adminService.updateUserStatus(id, status, token);
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

// Delete user
export const deleteUser = createAsyncThunk(
    'admin/delete',
    async (id, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            await adminService.deleteUser(id, token);
            return id;
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

// Update user details
export const updateUser = createAsyncThunk(
    'admin/update',
    async ({ id, userData }, thunkAPI) => {
        try {
            const token = thunkAPI.getState().auth.user.token;
            return await adminService.updateUser(id, userData, token);
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

export const adminSlice = createSlice({
    name: 'admin',
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
            .addCase(getUsers.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getUsers.fulfilled, (state, action) => {
                state.isLoading = false;
                state.users = action.payload;
            })
            .addCase(getUsers.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(createUserAdmin.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(createUserAdmin.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                // Prepend the new user to the list
                state.users = [action.payload, ...state.users];
            })
            .addCase(createUserAdmin.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            .addCase(updateUserStatus.fulfilled, (state, action) => {
                state.users = state.users.map((user) =>
                    user._id === action.payload._id ? action.payload : user
                );
            })
            .addCase(updateUser.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.users = state.users.map((user) =>
                    user._id === action.payload._id ? action.payload : user
                );
            })
            .addCase(deleteUser.fulfilled, (state, action) => {
                state.users = state.users.filter(
                    (user) => user._id !== action.payload
                );
            });
    },
});

export const { reset } = adminSlice.actions;
export default adminSlice.reducer;
