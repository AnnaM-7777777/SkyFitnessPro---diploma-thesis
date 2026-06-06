import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import styles from "./Header.module.css";
import Logo from "../../components/Logo/Logo";

export default function Header() {
    const { user, logout, isLoading } = useAuth();

    // Стейт для управления меню профиля
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Закрыть меню при клике вне его области
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                menuRef.current &&
                !menuRef.current.contains(event.target as Node)
            ) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isMenuOpen]);

    // Обработчик выхода
    const handleLogout = async () => {
        try {
            await logout();
            setIsMenuOpen(false);
        } catch (err) {
            console.error("Ошибка при выходе:", err);
        }
    };

    return (
        <header className={styles.header}>
            <div className={styles.header__container}>
                <Logo />

                <p className={styles.container__text}>
                    Онлайн-тренировки для занятий дома
                </p>
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
                            className={styles.header__profileButton}
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            aria-expanded={isMenuOpen}
                            aria-label="Меню профиля"
                        >
                            {/* Универсальная иконка аватара */}
                            <div className={styles.header__userAvatar}>
                                <Image
                                    src="/img/icon.png"
                                    alt="add"
                                    width={42}
                                    height={42}
                                    priority
                                />
                            </div>

                            {/* Имя пользователя */}
                            <span className={styles.header__userName}>
                                {user.name ||
                                    user.email?.split("@")[0] ||
                                    "Профиль"}
                            </span>

                            {/* Стрелка */}
                            <svg
                                className={`${styles.header__chevron} ${
                                    isMenuOpen ? styles.header__chevronUp : ""
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
                                <div className={styles.header__userName}>
                                    {user.name || "Пользователь"}
                                </div>

                                <div className={styles.header__userEmail}>
                                    {user.email}
                                </div>

                                <Link
                                    href="/profile"
                                    className={`${styles.header__menuButton} btn-primary`}
                                    onClick={() => setIsMenuOpen(false)}
                                >
                                    Мой профиль
                                </Link>

                                <button
                                    className={`${styles.header__menuButton} btn-secondary`}
                                    onClick={handleLogout}
                                >
                                    Выйти
                                </button>
                            </div>
                        )}
                    </div>
                ) : (
                    // Пользователь НЕ авторизован → показываем кнопку "Войти"
                    <Link
                        href="/?modal=login"
                        className={`${styles.header__btnLogin} btn-primary`}
                    >
                        Войти
                    </Link>
                )}
            </div>
        </header>
    );
}
