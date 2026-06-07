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
    const { user } = useAuth();
    const [isAdded, setIsAdded] = useState(false);
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

    const handleAddCourse = async () => {
        if (!user) {
            setToast({
                message: "Сначала нужно войти, чтобы добавить курс",
                type: "error",
            });
            return;
        }

        try {
            // ПРАВИЛЬНЫЙ URL и тело запроса
            await apiFetch("/users/me/courses", {
                method: "POST",
                body: JSON.stringify({ courseId: course._id }),
            });

            setIsAdded(true);
            setToast({
                message: "Курс успешно добавлен!",
                type: "success",
            });
            setTimeout(() => setIsAdded(false), 2000);
        } catch (err: any) {
            console.error("Ошибка добавления курса:", err);
            setToast({
                message: err.message || "Ошибка при добавлении курса",
                type: "error",
            });
        }
    };

    const handleMouseEnter = () => setShowCustomCursor(true);
    const handleMouseLeave = () => setShowCustomCursor(false);

    // Глобальное отслеживание мыши для кастомного курсора
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
                        aria-label="Добавить курс"
                        onClick={handleAddCourse}
                        disabled={isAdded}
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                    >
                        <Image
                            src="/img/btnAddIcon.png"
                            alt="add"
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

                <div className={styles.customCursor__text}>Добавить курс</div>
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
