import axios from "axios";

const AUTH_BASE_URL = "https://wedev-api.sky.pro/api";
const FITNESS_BASE_URL = "https://wedev-api.sky.pro/api/fitness";

const authApi = axios.create({
    baseURL: AUTH_BASE_URL,
    headers: {
        "Content-Type": "",
    },
});

const fitnessApi = axios.create({
    baseURL: FITNESS_BASE_URL,
    headers: {
        "Content-Type": "",
    },
});

authApi.interceptors.request.use((config) => {
    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("fitness_token")
            : null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export type AuthUser = {
    _id: string;
    login: string;
    name: string;
    token: string;
    imageUrl?: string;
    createdAt?: string;
    updatedAt?: string;
};

export type LoginCredentials = {
    login: string;
    password: string;
};

export type RegisterCredentials = LoginCredentials & {
    name: string;
};

// Авторизация в основном API
export const login = async (
    credentials: LoginCredentials,
): Promise<AuthUser> => {
    const response = await authApi.post<{ user: AuthUser }>(
        "/user/login",
        credentials,
    );
    return response.data.user;
};

// Регистрация в основном API
export const register = async (
    credentials: RegisterCredentials,
): Promise<AuthUser> => {
    const response = await authApi.post<{ user: AuthUser }>(
        "/user",
        credentials,
    );
    return response.data.user;
};

// Авторизация в фитнес-API
export const fitnessLogin = async (
    email: string,
    password: string,
): Promise<{ token: string }> => {
    const response = await fitnessApi.post<{ token: string }>("/auth/login", {
        email,
        password,
    });
    return response.data;
};

// Регистрация в фитнес-API
export const fitnessRegister = async (
    email: string,
    password: string,
): Promise<{ message: string }> => {
    const response = await fitnessApi.post<{ message: string }>(
        "/auth/register",
        { email, password },
    );
    return response.data;
};
