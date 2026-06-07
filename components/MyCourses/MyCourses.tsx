import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/libs/apiConfig";
import type { Course } from "@/types/course";
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

export default function MyCourses() {
    const { token } = useAuth();
    const [courses, setCourses] = useState<CourseWithProgress[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchMyCourses = async () => {
            try {
                // 1. Получаем данные пользователя со списком ID курсов
                const userData = await apiFetch<UserData>("/users/me");
                const courseIds = userData.selectedCourses || [];

                if (courseIds.length === 0) {
                    setCourses([]);
                    setLoading(false);
                    return;
                }

                // 2. Для каждого курса загружаем данные и прогресс
                const coursesData = await Promise.all(
                    courseIds.map(async (courseId) => {
                        // Получаем данные курса
                        const course = await apiFetch<Course>(
                            `/courses/${courseId}`,
                        );

                        // Получаем прогресс
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

    // Удалить курс через API
    const handleRemoveCourse = async (courseId: string) => {
        try {
            await apiFetch<unknown>(`/users/me/courses/${courseId}`, {
                method: "DELETE",
            });
            setCourses(courses.filter((c) => c._id !== courseId));
        } catch (err) {
            console.error("Ошибка удаления курса:", err);
        }
    };

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
        <div className={styles.myCourses}>
            {courses.map((course) => {
                const progress = course.progress || 0;

                return (
                    <div key={course._id} className={styles.courseCard}>
                        <button
                            className={styles.courseCard__remove}
                            onClick={() => handleRemoveCourse(course._id)}
                            aria-label="Удалить курс"
                        >
                            <svg
                                width="16"
                                height="16"
                                viewBox="0 0 16 16"
                                fill="none"
                            >
                                <path
                                    d="M8 0L0 8l8 8 8-8-8-8z"
                                    fill="currentColor"
                                />
                            </svg>
                        </button>

                        <div className={styles.courseCard__image}>
                            <Image
                                src={
                                    course.imageBG ||
                                    course.image ||
                                    "/img/1-yoga-l.png"
                                }
                                alt={course.nameRU || course.title || "Курс"}
                                fill
                                style={{ objectFit: "cover" }}
                            />
                        </div>

                        <div className={styles.courseCard__info}>
                            <h3 className={styles.courseCard__title}>
                                {course.nameRU || course.title}
                            </h3>

                            <div className={styles.courseCard__meta}>
                                <span>{course.durationInDays || 25} дней</span>
                                <span>
                                    {course.dailyDurationInMinutes?.from || 20}-
                                    {course.dailyDurationInMinutes?.to || 50}{" "}
                                    мин/день
                                </span>
                            </div>

                            <div className={styles.courseCard__difficulty}>
                                Сложность: {course.difficulty || "Средняя"}
                            </div>

                            <div className={styles.courseCard__progress}>
                                <div className={styles.courseCard__progressBar}>
                                    <div
                                        className={
                                            styles.courseCard__progressFill
                                        }
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                                <span>Прогресс: {progress}%</span>
                            </div>

                            <Link
                                href={`/courses/${course._id}`}
                                className={`${styles.courseCard__button} btn-primary`}
                            >
                                {progress === 0
                                    ? "Начать тренировки"
                                    : progress >= 100
                                      ? "Начать снова"
                                      : "Продолжить"}
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
