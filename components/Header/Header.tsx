import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import styles from "./Header.module.css"
import Logo from "../../components/Logo/Logo"

interface HeaderProps {
    showTitle?: boolean // По умолчанию true
}

export default function Header({ showTitle = true }: HeaderProps) {
    const { user, logout, isLoading } = useAuth()

    // Стейт для управления меню профиля
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const menuRef = useRef<HTMLDivElement>(null)

    // Закрыть меню при клике вне его области
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsMenuOpen(false)
            }
        }

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside)
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside)
        }
    }, [isMenuOpen])

    // Закрыть меню при нажатии Escape
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === "Escape" && isMenuOpen) {
                setIsMenuOpen(false)
            }
        }

        if (isMenuOpen) {
            document.addEventListener("keydown", handleEscape)
        }

        return () => {
            document.removeEventListener("keydown", handleEscape)
        }
    }, [isMenuOpen])

    // Обработчик выхода
    const handleLogout = async () => {
        try {
            await logout()
            setIsMenuOpen(false)
        } catch (err) {
            console.error("Ошибка при выходе:", err)
        }
    }

    return (
        <header className={styles.header}>
            <div className={styles.header__container}>
                <Logo />

                {/* Условный рендеринг заголовка */}
                {showTitle && (
                    <p className={styles.header__text}>Онлайн-тренировки для занятий дома</p>
                )}
            </div>

            <div className={styles.header__auth}>
                {/* УСЛОВНЫЙ РЕНДЕРИНГ: показываем разные кнопки в зависимости от авторизации */}

                {isLoading ? (
                    // Показываем индикатор загрузки, пока проверяем авторизацию
                    <div className={styles.header__loading}>⏳</div>
                ) : user ? (
                    // Пользователь АВТОРИЗОВАН → показываем меню профиля
                    <div className={styles.header__profileMenu} ref={menuRef}>
                        <button
                            className={styles.profileMenu__btn}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-expanded={isMenuOpen}
                            aria-label="Меню профиля"
                        >
                            {/* Универсальная иконка аватара */}
                            <div className={styles.profileMenu__userAvatar}>
                                <Image
                                    src="/img/icon.png"
                                    alt="Аватар"
                                    width={42}
                                    height={42}
                                    priority
                                    style={{
                                        objectFit: "cover",
                                        borderRadius: "50%",
                                    }}
                                />
                            </div>

                            {/* Имя пользователя */}
                            <span className={styles.profileMenu__userName}>
                                {user.name || user.email?.split("@")[0] || "Профиль"}
                            </span>

                            {/* Стрелка */}
                            <svg
                                className={`${styles.profileMenu__chevron} ${
                                    isMenuOpen ? styles.profileMenu__chevronUp : ""
                                }`}
                                width="20"
                                height="20"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    d="M4 6l4 4 4-4"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                />
                            </svg>
                        </button>

                        {/* Выпадающее меню профиля */}
                        {isMenuOpen && (
                            <div className={styles.header__dropdownMenu}>
                                <div className={styles.dropdownMenu__userName}>
                                    {user.name || "Пользователь"}
                                </div>

                                <div className={styles.dropdownMenu__userEmail}>{user.email}</div>

                                <Link
                                    href="/profile"
                                    className={`${styles.dropdownMenu__btn} btn-primary`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Мой профиль
                                </Link>

                                <button
                                    className={`${styles.dropdownMenu__btn} btn-secondary`}
                                    onClick={handleLogout}
                                >
                                    Выйти
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Пользователь НЕ авторизован → показываем кнопку "Войти"
                    <Link href="/?modal=login" className={`${styles.header__btnLogin} btn-primary`}>
                        Войти
                    </Link>
                )}
            </div>
        </header>
    )
}
