import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Image from "next/image";
import styles from "./Profile.module.css";

export default function Profile() {
    const router = useRouter();
    const { user, logout, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className={styles.profile}>
                <div className={styles.profile__loading}>Загрузка...</div>
            </div>
        );
    }

    if (!user) {
        router.push("/");
        return null;
    }

    const userName = user.name || user.email?.split("@")[0] || "Пользователь";
    const userLogin = user.email || "Не указан";

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) {
            console.error("Ошибка при выходе:", err);
        }
    };

    return (
        <div className={styles.profile}>
            {/* Аватар пользователя */}
            <div className={styles.profile__avatar}>
                <Image
                    src={
                        user.imageUrl &&
                        !user.imageUrl.includes("yandexcloud") &&
                        !user.imageUrl.includes("skypro")
                            ? user.imageUrl
                            : "/img/avatar.png"
                    }
                    alt={userName}
                    width={197}
                    height={197}
                    priority
                    style={{ objectFit: "cover" }}
                    unoptimized
                />
            </div>

            <div className={styles.profile__userInfo}>
                {/* Имя пользователя */}
                <h2 className={styles.profile__name}>{userName}</h2>

                {/* Логин/Email */}
                <p className={styles.profile__login}>Логин: {userLogin}</p>

                {/* Кнопка выхода */}
                <button
                    className={`${styles.profile__logout} btn-secondary`}
                    onClick={handleLogout}
                    aria-label="Выйти из аккаунта"
                >
                    Выйти
                </button>
            </div>
        </div>
    );
}
