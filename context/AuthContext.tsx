import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { useRouter } from "next/router";
import {
    login as authLogin,
    register as authRegister,
    fitnessLogin,
    fitnessRegister,
    type AuthUser,
} from "@/libs/apiAuth";

type User = {
    _id: string;
    email: string;
    name: string;
    imageUrl?: string;
} | null;

type AuthContextType = {
    user: User;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name?: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
};

// Функция проверки пароля по требованиям фитнес-API
const validateFitnessPassword = (password: string): string | null => {
    if (password.length < 6)
        return "Пароль должен содержать минимум 6 символов";
    if (!/[A-ZА-ЯЁ]/.test(password))
        return "Пароль должен содержать хотя бы одну заглавную букву";

    // Считаем спецсимволы
    const specialChars = password.match(/[^a-zA-Z0-9а-яА-ЯёЁ\s]/g);
    if (!specialChars || specialChars.length < 2) {
        return "Пароль должен содержать минимум 2 спецсимвола (например: @!#?)";
    }

    return null; // Ошибок нет
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const savedToken = localStorage.getItem("fitness_token");
        const savedUser = localStorage.getItem("fitness_user");

        if (savedToken && savedUser) {
            setToken(savedToken);
            setUser(JSON.parse(savedUser));
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string) => {
        try {
            // 1. Логин в основном API (для профиля)
            const authUser: AuthUser = await authLogin({
                login: email,
                password,
            });

            // 2. Логин в фитнес-API (для курсов)
            const fitnessData = await fitnessLogin(email, password);

            // 3. Сохраняем JWT токен от фитнес-API
            localStorage.setItem("fitness_token", fitnessData.token);
            localStorage.setItem(
                "fitness_user",
                JSON.stringify({
                    _id: authUser._id,
                    email: authUser.login,
                    name: authUser.name,
                    imageUrl: authUser.imageUrl,
                }),
            );

            setToken(fitnessData.token);
            setUser({
                _id: authUser._id,
                email: authUser.login,
                name: authUser.name,
                imageUrl: authUser.imageUrl,
            });

            router.push("/");
        } catch (err: any) {
            throw new Error(err.message || "Ошибка входа");
        }
    };

    const register = async (email: string, password: string, name?: string) => {
        // Проверяем пароль перед отправкой
        const passwordError = validateFitnessPassword(password);
        if (passwordError) {
            throw new Error(passwordError); // Покажем это пользователю в Toast
        }

        try {
            // 1. Регистрация в основном API
            const authUser: AuthUser = await authRegister({
                login: email,
                password,
                name: name || email.split("@")[0],
            });

            // 2. Регистрация в фитнес-API
            await fitnessRegister(email, password);

            // 3. Логин в фитнес-API после регистрации
            const fitnessData = await fitnessLogin(email, password);

            // 4. Сохраняем JWT токен
            localStorage.setItem("fitness_token", fitnessData.token);
            localStorage.setItem(
                "fitness_user",
                JSON.stringify({
                    _id: authUser._id,
                    email: authUser.login,
                    name: authUser.name,
                    imageUrl: authUser.imageUrl,
                }),
            );

            setToken(fitnessData.token);
            setUser({
                _id: authUser._id,
                email: authUser.login,
                name: authUser.name,
                imageUrl: authUser.imageUrl,
            });

            router.push("/");
        } catch (err: any) {
            throw new Error(err.message || "Ошибка регистрации");
        }
    };

    const logout = () => {
        localStorage.removeItem("fitness_token");
        localStorage.removeItem("fitness_user");
        setToken(null);
        setUser(null);
        router.push("/");
    };

    return (
        <AuthContext.Provider
            value={{ user, token, login, register, logout, isLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx)
        throw new Error("useAuth должен использоваться внутри <AuthProvider>");
    return ctx;
}
