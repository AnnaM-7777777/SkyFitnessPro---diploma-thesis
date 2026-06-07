import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/libs/apiConfig";
import type { Course } from "@/types/course";
import courseStyles from "@/components/CourseCard/CourseCard.module.css";
import styles from "./MyCourses.module.css";

type UserData = {
    email: string;
    selectedCourses: string[];
};

type WorkoutProgress = {
    workoutId: string;
    workoutCompleted: boolean;
    progressData: number[];
};

type CourseProgressData = {
    courseId: string;
    courseCompleted: boolean;
    workoutsProgress: WorkoutProgress[];
};

type CourseWithProgress = Course & { progress: number };

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

export default function MyCourses() {
    const { token } = useAuth();
    const [courses, setCourses] = useState<CourseWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [showCustomCursor, setShowCustomCursor] = useState(false);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchMyCourses = async () => {
            try {
                const response = await apiFetch<{ user: UserData }>(
                    "/users/me",
                );
                const userData = response.user;

                const courseIds = userData.selectedCourses || [];

                if (courseIds.length === 0) {
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                const coursesData = await Promise.all(
                    courseIds.map(async (courseId) => {
                        const course = await apiFetch<Course>(
                            `/courses/${courseId}`,
                        );

                        let progress = 0;
                        try {
                            const progressData =
                                await apiFetch<CourseProgressData>(
                                    `/users/me/progress?courseId=${courseId}`,
                                );

                            if (
                                progressData.workoutsProgress &&
                                progressData.workoutsProgress.length > 0
                            ) {
                                const completed =
                                    progressData.workoutsProgress.filter(
                                        (w) => w.workoutCompleted,
                                    ).length;
                                const total =
                                    progressData.workoutsProgress.length;
                                progress = Math.round(
                                    (completed / total) * 100,
                                );
                            }
                        } catch {
                            progress = 0;
                        }

                        return { ...course, progress };
                    }),
                );

                setCourses(coursesData);
            } catch (err) {
                console.error("Ошибка загрузки курсов:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMyCourses();
    }, [token]);

    const handleRemoveCourse = async (courseId: string) => {
        try {
            await apiFetch(`/users/me/courses/${courseId}`, {
                method: "DELETE",
            });
            setCourses(courses.filter((c) => c._id !== courseId));
        } catch (err) {
            console.error("Ошибка удаления курса:", err);
        }
    };

    // Кастомный курсор
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

    if (loading) {
        return <div className={styles.loading}>Загрузка курсов...</div>;
    }

    if (courses.length === 0) {
        return (
            <div className={styles.empty}>
                <p>У вас пока нет добавленных курсов</p>
                <Link href="/" className="btn-primary">
                    Выбрать курс
                </Link>
            </div>
        );
    }

    return (
        <>
            <div className={styles.myCourses}>
                {courses.map((course) => {
                    const progress = course.progress || 0;
                    const title =
                        course.nameRU || course.title || course.name || "Курс";
                    const bgImage =
                        course.imageBG ||
                        course.image ||
                        COURSE_IMAGES[title] ||
                        COURSE_IMAGES[title.split(" ")[0]] ||
                        "/img/1-yoga-l.png";

                    return (
                        <article
                            key={course._id}
                            className={courseStyles.cards__course}
                        >
                            <div className={courseStyles.cards__bg}>
                                <Image
                                    src={bgImage}
                                    alt={title}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    style={{ objectFit: "cover" }}
                                    priority
                                />

                                <button
                                    className={courseStyles.cards__btnAddCourse}
                                    aria-label="Удалить курс"
                                    onClick={() =>
                                        handleRemoveCourse(course._id)
                                    }
                                    onMouseEnter={handleMouseEnter}
                                    onMouseLeave={handleMouseLeave}
                                >
                                    <Image
                                        src="/img/btnDelIcon.png"
                                        alt="remove"
                                        width={27}
                                        height={27}
                                        priority
                                    />
                                </button>
                            </div>

                            <div className={courseStyles.cards__content}>
                                <Link
                                    href={`/courses/${course._id}`}
                                    className={courseStyles.cards__link}
                                >
                                    <h3 className={courseStyles.cards__name}>
                                        {title}
                                    </h3>
                                </Link>

                                <div className={courseStyles.cards__meta}>
                                    <span className={courseStyles.cards__item}>
                                        <Image
                                            src="/img/calendar.svg"
                                            alt=""
                                            width={16}
                                            height={16}
                                            aria-hidden="true"
                                        />
                                        {course.durationInDays || 25} дней
                                    </span>
                                    <span className={courseStyles.cards__item}>
                                        <Image
                                            src="/img/time.svg"
                                            alt=""
                                            width={16}
                                            height={16}
                                            aria-hidden="true"
                                        />
                                        {course.dailyDurationInMinutes?.from ||
                                            20}
                                        -
                                        {course.dailyDurationInMinutes?.to ||
                                            50}{" "}
                                        мин/день
                                    </span>
                                </div>

                                <span className={courseStyles.cards__item}>
                                    <Image
                                        src="/img/signal-fill.svg"
                                        alt=""
                                        width={16}
                                        height={16}
                                        aria-hidden="true"
                                    />
                                    Сложность
                                </span>

                                {/* Прогресс */}
                                <div className={styles.progressBlock}>
                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                    <span className={styles.progressText}>
                                        Прогресс: {progress}%
                                    </span>
                                </div>

                                {/* Кнопка "Начать тренировки" */}
                                <Link
                                    href={`/courses/${course._id}`}
                                    className={`${styles.startButton} btn-primary`}
                                >
                                    {progress === 0
                                        ? "Начать тренировки"
                                        : progress >= 100
                                          ? "Начать снова"
                                          : "Продолжить"}
                                </Link>
                            </div>
                        </article>
                    );
                })}
            </div>

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

                <div className={styles.customCursor__text}>Удалить курс</div>
            </div>
        </>
    );
}
