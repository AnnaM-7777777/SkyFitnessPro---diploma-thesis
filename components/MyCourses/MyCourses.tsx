import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { apiFetch } from "@/libs/apiConfig";
import type { Course } from "@/types/course";
import styles from "./MyCourses.module.css";

type UserCourse = {
    courseId: string;
    progress: number; // 0-100
    addedAt: string;
};

export default function MyCourses() {
    const [courses, setCourses] = useState<Course[]>([]);
    const [userCourses, setUserCourses] = useState<UserCourse[]>([]);
    const [loading, setLoading] = useState(true);

    // Загружаем список курсов пользователя из localStorage
    useEffect(() => {
        const saved = localStorage.getItem("fitness_user_courses");
        if (saved) {
            setUserCourses(JSON.parse(saved));
        }
        setLoading(false);
    }, []);

    // Загружаем данные курсов с API
    useEffect(() => {
        if (userCourses.length === 0) {
            setCourses([]);
            return;
        }

        const fetchCourses = async () => {
            try {
                const courseData = await Promise.all(
                    userCourses.map(async (uc) => {
                        const course = await apiFetch(
                            `/courses/${uc.courseId}`,
                        );
                        return { ...course, progress: uc.progress };
                    }),
                );
                setCourses(courseData);
            } catch (err) {
                console.error("Ошибка загрузки курсов:", err);
            }
        };

        fetchCourses();
    }, [userCourses]);

    // Удалить курс
    const handleRemoveCourse = (courseId: string) => {
        const updated = userCourses.filter((uc) => uc.courseId !== courseId);
        setUserCourses(updated);
        localStorage.setItem("fitness_user_courses", JSON.stringify(updated));
        setCourses(courses.filter((c) => c._id !== courseId));
    };

    // Обновить прогресс (заглушка)
    const handleUpdateProgress = (courseId: string, newProgress: number) => {
        const updated = userCourses.map((uc) =>
            uc.courseId === courseId ? { ...uc, progress: newProgress } : uc,
        );
        setUserCourses(updated);
        localStorage.setItem("fitness_user_courses", JSON.stringify(updated));
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
                const userCourse = userCourses.find(
                    (uc) => uc.courseId === course._id,
                );
                const progress = userCourse?.progress || 0;

                return (
                    <div key={course._id} className={styles.courseCard}>
                        {/* Кнопка удалить */}
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

                        {/* Изображение курса */}
                        <div className={styles.courseCard__image}>
                            <Image
                                src={course.image || "/img/1-yoga-l.png"}
                                alt={course.nameRU || course.title || "Курс"}
                                fill
                                style={{ objectFit: "cover" }}
                            />
                        </div>

                        {/* Информация */}
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

                            {/* Прогресс */}
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

                            {/* Кнопка действия */}
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
