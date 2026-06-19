import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAuthStore = create(
  persist(
    (set) => ({
      authUser: null,
      token: null, // Persist middleware handles localStorage automatically

      // Save user and token after login
      setAuth: (user, token) => {
        set({ authUser: user, token: token });
      },

      // Clear user and token after logout
      logout: () => {
        set({ authUser: null, token: null });
      }
    }),
    {
      name: "chat_auth_storage", // Storage key name
    }
  )
);

export default useAuthStore;