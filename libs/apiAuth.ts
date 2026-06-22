import axios from "axios"

const FITNESS_BASE_URL = "https://wedev-api.sky.pro/api/fitness"

const fitnessApi = axios.create({
    baseURL: FITNESS_BASE_URL,
    headers: {
        "Content-Type": "",
    },
})

// Авторизация в фитнес-API
export const fitnessLogin = async (email: string, password: string): Promise<{ token: string }> => {
    const response = await fitnessApi.post<{ token: string }>("/auth/login", {
        email,
        password,
    })
    return response.data
}

// Регистрация в фитнес-API
export const fitnessRegister = async (
    email: string,
    password: string
): Promise<{ message: string }> => {
    const response = await fitnessApi.post<{ message: string }>("/auth/register", {
        email,
        password,
    })
    return response.data
}
