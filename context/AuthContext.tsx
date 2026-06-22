import { createContext, useContext, useState, useEffect, ReactNode } from "react"
import { useRouter } from "next/router"
import { fitnessLogin, fitnessRegister } from "@/libs/apiAuth"

type User = {
    email: string
    name: string
    imageUrl?: string
} | null

type AuthContextType = {
    user: User
    token: string | null
    isLoading: boolean
    login: (email: string, password: string) => Promise<void>
    register: (email: string, password: string, name?: string) => Promise<void>
    logout: () => void
}

// Функция проверки пароля по требованиям фитнес-API
const validateFitnessPassword = (password: string): string | null => {
    if (password.length < 6) return "Пароль должен содержать минимум 6 символов"
    if (!/[A-ZА-ЯЁ]/.test(password)) return "Пароль должен содержать хотя бы одну заглавную букву"

    const specialChars = password.match(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/g)
    if (!specialChars || specialChars.length < 2) {
        return "Пароль должен содержать минимум 2 спецсимвола (например: @!#?)"
    }

    return null
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>(null)
    const [token, setToken] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const router = useRouter()

    // Функция сохранения сессии (упрощённая)
    const saveUserSession = (email: string, name: string, fitnessToken: string) => {
        const userData = {
            email,
            name,
            imageUrl: "/img/avatar.png", // Дефолтный аватар
        }

        localStorage.setItem("fitness_token", fitnessToken)
        localStorage.setItem("fitness_user", JSON.stringify(userData))

        setToken(fitnessToken)
        setUser(userData)
    }

    // Восстановление сессии из localStorage
    useEffect(() => {
        const fitnessToken = localStorage.getItem("fitness_token")
        const fitnessUser = localStorage.getItem("fitness_user")

        if (fitnessToken && fitnessUser) {
            try {
                setToken(fitnessToken)
                setUser(JSON.parse(fitnessUser))
            } catch (err) {
                console.error("Ошибка парсинга user из localStorage:", err)
                localStorage.removeItem("fitness_token")
                localStorage.removeItem("fitness_user")
            }
        }

        setIsLoading(false)
    }, [])

    // Авторизация только через фитнес-API
    const login = async (email: string, password: string) => {
        try {
            const fitnessData = await fitnessLogin(email, password)

            // Извлекаем имя из email (часть до @)
            const name = email.split("@")[0]

            saveUserSession(email, name, fitnessData.token)
            router.push("/")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Ошибка входа"
            throw new Error(message)
        }
    }

    // Регистрация только через фитнес-API
    const register = async (email: string, password: string, name?: string) => {
        const passwordError = validateFitnessPassword(password)
        if (passwordError) {
            throw new Error(passwordError)
        }

        try {
            await fitnessRegister(email, password)
            const fitnessData = await fitnessLogin(email, password)

            const userName = name || email.split("@")[0]

            saveUserSession(email, userName, fitnessData.token)
            router.push("/")
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Ошибка регистрации"
            throw new Error(message)
        }
    }

    const logout = () => {
        localStorage.removeItem("fitness_token")
        localStorage.removeItem("fitness_user")
        setToken(null)
        setUser(null)
        router.push("/")
    }

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error("useAuth должен использоваться внутри <AuthProvider>")
    return ctx
}
