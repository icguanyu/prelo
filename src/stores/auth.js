import { ref } from "vue";
import { defineStore } from "pinia";
import axios from "axios";
import { Auth, Users } from "@/api/auth";

const TOKEN_KEY = "prelo-token";
const USER_KEY = "prelo-user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || "");
  const user = ref(
    (() => {
      try {
        return JSON.parse(localStorage.getItem(USER_KEY)) || null;
      } catch {
        return null;
      }
    })()
  );
  const isLoading = ref(false);

  const setToken = (value) => {
    token.value = value;
    localStorage.setItem(TOKEN_KEY, value);
    axios.defaults.headers.common["Authorization"] = `Bearer ${value}`;
  };

  const setUser = (userObj) => {
    user.value = userObj;
    if (userObj) {
      localStorage.setItem(USER_KEY, JSON.stringify(userObj));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  };

  const register = async ({ name, email, password }) => {
    if (isLoading.value) return null;
    isLoading.value = true;
    try {
      const res = await Auth.Register({ name, email, password });
      const newToken = res.data?.token;
      if (newToken) {
        setToken(newToken);
        await fetchUser();
      }
      return newToken || null;
    } finally {
      isLoading.value = false;
    }
  };

  const login = async ({ email, password }) => {
    if (isLoading.value) return null;

    isLoading.value = true;
    try {
      const res = await Auth.Login({ email, password });

      const newToken = res.data.token;
      if (!newToken) {
        throw new Error("登入失敗，未取得 token");
      }
      setToken(newToken);
      // 取得用戶資訊
      await fetchUser();
      return newToken;
    } finally {
      isLoading.value = false;
    }
  };

  const fetchUser = async () => {
    try {
      const res = await Users.Me();
      setUser(res.data);
    } catch (error) {
      setUser(null);
      console.error("fetch user error:", error);
    }
  };

  const logout = () => {
    token.value = "";
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    delete axios.defaults.headers.common["Authorization"];
  };

  return {
    token,
    user,
    isLoading,
    login,
    register,
    logout,
    fetchUser,
    setToken,
    setUser,
  };
});
