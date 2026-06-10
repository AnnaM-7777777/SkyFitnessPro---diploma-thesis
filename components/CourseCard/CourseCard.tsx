import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/libs/apiConfig";
import Toast from "@/components/Toast/Toast";
import type { Course } from "@/types/course";
import styles from "./CourseCard.module.css";

interface CourseCardProps {
    course: Course;
}

// Тип теперь описывает вложенность, как возвращает сервер
type UserData = {
    email: string;
    selectedCourses: string[];
};

const COURSE_IMAGES: Record<string, string> = {
    Йога: "/img/1-yoga-l.png",
    Стретчинг: "/img/2-stretching-l.png",
    Фитнес: "/img/3-fitness-l.png",
    "Степ-аэробика": "/img/4-aerobics-l.png",
    Бодифлекс: "/img/5-bodyflex-l.png",
    Yoga: "/img/1-yoga-l.png",
    Stretching: "/img/2-stretching-l.png",
    Fitness: "/img/3-fitness-l.png",
    Aerobics: "/img/4-aerobics-l.png",
    Bodyflex: "/img/5-bodyflex-l.png",
};

export default function CourseCard({ course }: CourseCardProps) {
    const router = useRouter();
    const { user, token } = useAuth();
    const [isAdded, setIsAdded] = useState(false);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{
        message: string;
        type: "error" | "success";
    } | null>(null);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [showCustomCursor, setShowCustomCursor] = useState(false);

    const title = course.nameRU || course.title || course.name || "Курс";

    const bgImage =
        course.imageBG ||
        course.image ||
        COURSE_IMAGES[title] ||
        COURSE_IMAGES[title.split(" ")[0]] ||
        "/img/1-yoga-l.png";

    // Правильно читаем вложенный объект user
    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const checkIfAdded = async () => {
            try {
                const cachedData = sessionStorage.getItem("user_data_cache");
                let selectedCourses: string[] = [];

                if (cachedData) {
                    const { data, timestamp } = JSON.parse(cachedData);
                    if (Date.now() - timestamp < 30000) {
                        selectedCourses = data;
                    } else {
                        const response = await apiFetch<{ user: UserData }>(
                            "/users/me",
                        );
                        selectedCourses = response.user.selectedCourses || [];
                        sessionStorage.setItem(
                            "user_data_cache",
                            JSON.stringify({
                                data: selectedCourses,
                                timestamp: Date.now(),
                            }),
                        );
                    }
                } else {
                    const response = await apiFetch<{ user: UserData }>(
                        "/users/me",
                    );
                    selectedCourses = response.user.selectedCourses || [];
                    sessionStorage.setItem(
                        "user_data_cache",
                        JSON.stringify({
                            data: selectedCourses,
                            timestamp: Date.now(),
                        }),
                    );
                }

                const isCourseAdded = selectedCourses.includes(course._id);
                setIsAdded(isCourseAdded || false);
            } catch (err) {
                console.error("Ошибка проверки курса:", err);
            } finally {
                setLoading(false);
            }
        };

        checkIfAdded();
    }, [token, course._id]);

    // Добавление курса
    const handleAddCourse = async () => {
        if (!user) {
            setToast({
                message: "Сначала нужно войти, чтобы добавить курс",
                type: "error",
            });
            return;
        }

        try {
            await apiFetch("/users/me/courses", {
                method: "POST",
                body: JSON.stringify({ courseId: course._id }),
            });

            setIsAdded(true); // Мгновенно меняем кнопку на "-"

            sessionStorage.removeItem("user_data_cache"); // Очищаем кэш

            setToast({
                message: "Курс успешно добавлен!",
                type: "success",
            });
            setTimeout(() => setToast(null), 2000);
        } catch (err: unknown) {
            if (
                err instanceof Error &&
                err.message.includes("уже был добавлен")
            ) {
                setIsAdded(true);
                
                sessionStorage.removeItem("user_data_cache"); // Очищаем кэш

                return;
            }

            console.error("Ошибка добавления курса:", err);
            setToast({
                message:
                    err instanceof Error
                        ? err.message
                        : "Ошибка при добавлении курса",
                type: "error",
            });
            setTimeout(() => setToast(null), 2000);
        }
    };

    // Удаление курса
    const handleRemoveCourse = async () => {
        if (!user) return;

        try {
            await apiFetch(`/users/me/courses/${course._id}`, {
                method: "DELETE",
            });

            setIsAdded(false); // Мгновенно меняем кнопку на "+"

            sessionStorage.removeItem("user_data_cache");
            
            setToast({
                message: "Курс удалён из профиля",
                type: "success",
            });
            setTimeout(() => setToast(null), 2000);
        } catch (err: unknown) {
            console.error("Ошибка удаления курса:", err);
            setToast({
                message:
                    err instanceof Error
                        ? err.message
                        : "Ошибка при удалении курса",
                type: "error",
            });
            setTimeout(() => setToast(null), 2000);
        }
    };

    // Обработчик клика — переключение
    const handleToggleCourse = () => {
        if (isAdded) {
            handleRemoveCourse();
        } else {
            handleAddCourse();
        }
    };

    const handleMouseEnter = () => setShowCustomCursor(true);
    const handleMouseLeave = () => setShowCustomCursor(false);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setCursorPos({
                x: e.clientX,
                y: e.clientY,
            });
        };

        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    return (
        <>
            <article className={styles.cards__course}>
                <div className={styles.cards__bg}>
                    <Image
                        src={bgImage}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        style={{ objectFit: "cover" }}
                        priority
                    />

                    <button
                        className={styles.cards__btnAddCourse}
                        aria-label={isAdded ? "Удалить курс" : "Добавить курс"}
                        onClick={handleToggleCourse}
                        disabled={loading || !user}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Image
                            src={
                                isAdded
                                    ? "/img/btnDelIcon.png"
                                    : "/img/btnAddIcon.png"
                            }
                            alt={isAdded ? "remove" : "add"}
                            width={27}
                            height={27}
                            priority
                        />
                    </button>
                </div>

                <div className={styles.cards__content}>
                    <Link
                        href={`/courses/${course._id}`}
                        className={styles.cards__link}
                    >
                        <h3 className={styles.cards__name}>{title}</h3>
                    </Link>

                    <div className={styles.cards__meta}>
                        <span className={styles.cards__item}>
                            <Image
                                src="/img/calendar.svg"
                                alt=""
                                width={16}
                                height={16}
                                aria-hidden="true"
                            />
                            {course.durationInDays || 25} дней
                        </span>
                        <span className={styles.cards__item}>
                            <Image
                                src="/img/time.svg"
                                alt=""
                                width={16}
                                height={16}
                                aria-hidden="true"
                            />
                            {course.dailyDurationInMinutes?.from || 20}-
                            {course.dailyDurationInMinutes?.to || 50} мин/день
                        </span>
                    </div>

                    <span className={styles.cards__item}>
                        <Image
                            src="/img/signal-fill.svg"
                            alt=""
                            width={16}
                            height={16}
                            aria-hidden="true"
                        />
                        Сложность
                    </span>
                </div>
            </article>

            {/* Кастомный курсор */}
            <div
                className={`${styles.customCursor} ${showCustomCursor ? styles.customCursor_visible : ""}`}
                style={{ left: `${cursorPos.x}px`, top: `${cursorPos.y}px` }}
            >
                <div className={styles.customCursor__arrow}>
                    <Image
                        src="/img/customCursor.png"
                        alt=""
                        width={24}
                        height={24}
                        priority
                        style={{ objectFit: "contain" }}
                    />
                </div>

                <div className={styles.customCursor__text}>
                    {isAdded ? "Удалить курс" : "Добавить курс"}
                </div>
            </div>

            {/* Toast-уведомление */}
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    );
}
