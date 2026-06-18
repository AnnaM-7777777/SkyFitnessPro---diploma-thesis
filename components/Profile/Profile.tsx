import { useRouter } from "next/router"
import { useEffect } from "react"
import { useAuth } from "@/context/AuthContext"
import Image from "next/image"
import styles from "./Profile.module.css"

export default function Profile() {
    const router = useRouter()
    const { user, logout, isLoading } = useAuth()

    // Редирект через useEffect
    useEffect(() => {
        if (!isLoading && !user) {
            router.push("/")
        }
    }, [user, isLoading, router])

    if (isLoading) {
        return (
            <div className={styles.profile}>
                <div className={styles.profile__loading}>Загрузка...</div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    const userName = user.name || user.email?.split("@")[0] || "Пользователь"
    const userLogin = user.email || "Не указан"

    const handleLogout = async () => {
        try {
            await logout()
        } catch (err) {
            console.error("Ошибка при выходе:", err)
        }
    }

    const DEFAULT_AVATAR_DOMAINS = ["yandexcloud", "skypro"]

    const getAvatarUrl = (imageUrl?: string): string => {
        if (!imageUrl) return "/img/avatar.png"
        if (DEFAULT_AVATAR_DOMAINS.some((domain) => imageUrl.includes(domain))) {
            return "/img/avatar.png"
        }
        return imageUrl
    }

    return (
        <div className={styles.profile}>
            <div className={styles.profile__avatar}>
                <Image
                    src={getAvatarUrl(user.imageUrl)}
                    alt={userName}
                    width={197}
                    height={197}
                    priority
                    style={{ objectFit: "cover" }}
                    unoptimized
                />
            </div>

            <div className={styles.profile__userInfo}>
                <h2 className={styles.profile__name}>{userName}</h2>
                <p className={styles.profile__login}>Логин: {userLogin}</p>
                <button
                    className={`${styles.profile__logout} btn-secondary`}
                    onClick={handleLogout}
                    aria-label="Выйти из аккаунта"
                >
                    Выйти
                </button>
            </div>
        </div>
    )
}
