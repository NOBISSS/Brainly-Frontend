import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { fetchCurrentUser } from "./userThunks";

interface User {
  name: string;
  email: string;
  gender: string;
}

interface UserState {
  user: User | null;
  loading: boolean;
}

const initialState: UserState = {
  user: null,
  loading: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,

  reducers: {
    // manually set user (login/register)
    setUserDetails(state, action: PayloadAction<User>) {
      state.user = action.payload;
    },

    // logout
    clearUserDetails(state) {
      state.user = null;
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentUser.pending, (state) => {
        state.loading = true;
      })

      .addCase(fetchCurrentUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload || null; // ⭐ SAFE
      })

      .addCase(fetchCurrentUser.rejected, (state) => {
        state.loading = false;
        state.user = null;
      });
  },
});

export const { setUserDetails, clearUserDetails } = userSlice.actions;
export default userSlice.reducer;
