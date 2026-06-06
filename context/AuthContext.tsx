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
    type AuthUser,
} from "@/libs/apiAuth";

type User = {
    email: string;
    name?: string;
    imageUrl?: string;
    _id?: string;
} | null;

type AuthContextType = {
    user: User;
    token: string | null;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    // Восстанавливаем пользователя при загрузке страницы
    useEffect(() => {
        const savedToken = localStorage.getItem("fitness_token");
        const savedUser = localStorage.getItem("fitness_user");

        if (savedToken && savedUser) {
            try {
                setToken(savedToken);
                setUser(JSON.parse(savedUser));
            } catch (err) {
                console.error("Ошибка восстановления пользователя:", err);
                localStorage.removeItem("fitness_user");
            }
        }
        setIsLoading(false);
    }, []);

    // Вход
    const login = async (email: string, password: string) => {
        try {
            const user: AuthUser = await authLogin({ login: email, password });

            if (user.token) {
                localStorage.setItem("fitness_token", user.token);
                setToken(user.token);
            }

            // Сохраняем данные пользователя (они уже с сервера)
            const userData = {
                email: user.login,
                name: user.name,
                imageUrl: user.imageUrl,
                _id: user._id,
            };
            localStorage.setItem("fitness_user", JSON.stringify(userData));
            setUser(userData);

            router.push("/");
        } catch (err: any) {
            throw new Error(err.message || "Ошибка входа");
        }
    };

    // Регистрация
    const register = async (email: string, password: string) => {
        try {
            const user: AuthUser = await authRegister({
                login: email,
                password,
                name: email.split("@")[0],
            });

            if (user.token) {
                localStorage.setItem("fitness_token", user.token);
                setToken(user.token);
            }

            const userData = {
                email: user.login,
                name: user.name,
                imageUrl: user.imageUrl,
                _id: user._id,
            };
            localStorage.setItem("fitness_user", JSON.stringify(userData));
            setUser(userData);

            router.push("/");
        } catch (err: any) {
            throw new Error(err.message || "Ошибка регистрации");
        }
    };

    // Выход
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
