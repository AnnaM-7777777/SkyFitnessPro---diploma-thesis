import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/libs/apiConfig";
import type { Course } from "@/types/course";
import courseStyles from "@/components/CourseCard/CourseCard.module.css";
import styles from "./MyCourses.module.css";
import WorkoutSelectionModal from "@/components/WorkoutSelectionModal/WorkoutSelectionModal";

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
    const router = useRouter();
    const [courses, setCourses] = useState<CourseWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });
    const [showCustomCursor, setShowCustomCursor] = useState(false);
    const [showWorkoutModal, setShowWorkoutModal] = useState(false);
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(
        null,
    );

    // Обработчик кнопки:
    const handleStartTraining = async (courseId: string, progress: number) => {
        if (progress >= 100) {
            // Если прогресс 100% — сбрасываем
            if (confirm("Сбросить весь прогресс по курсу и начать сначала?")) {
                try {
                    await apiFetch(`/courses/${courseId}/reset`, {
                        method: "PATCH",
                    });
                    // Перезагружаем для обновления прогресса
                    window.location.reload();
                } catch (err) {
                    console.error("Ошибка сброса прогресса:", err);
                    alert("Не удалось сбросить прогресс");
                }
            }
        } else if (progress > 0) {
            // Если есть прогресс — открываем следующую незавершённую тренировку
            await openNextIncompleteWorkout(courseId);
        } else {
            // Если прогресс 0% — открываем модалку выбора
            setSelectedCourseId(courseId);
            setShowWorkoutModal(true);
        }
    };

    // Функция для открытия следующей незавершённой тренировки
    const openNextIncompleteWorkout = async (courseId: string) => {
        try {
            // Получаем все тренировки курса
            const workouts = await apiFetch<
                Array<{ _id: string; name: string }>
            >(`/courses/${courseId}/workouts`);

            // Получаем прогресс по всем тренировкам
            const progressData = await apiFetch<{
                workoutsProgress: Array<{
                    workoutId: string;
                    workoutCompleted: boolean;
                }>;
            }>(`/users/me/progress?courseId=${courseId}`);

            // Находим первую незавершённую тренировку
            const incompleteWorkout = workouts.find((workout) => {
                const workoutProgress = progressData.workoutsProgress.find(
                    (wp) => wp.workoutId === workout._id,
                );
                return !workoutProgress?.workoutCompleted;
            });

            if (incompleteWorkout) {
                // Открываем найденную тренировку
                router.push(
                    `/courses/${courseId}/workouts?selected=${incompleteWorkout._id}`,
                );
            } else {
                // Если все завершены — открываем первую
                router.push(
                    `/courses/${courseId}/workouts?selected=${workouts[0]?._id}`,
                );
            }
        } catch (err) {
            console.error("Ошибка поиска следующей тренировки:", err);
            // В случае ошибки — открываем модалку
            setSelectedCourseId(courseId);
            setShowWorkoutModal(true);
        }
    };

    useEffect(() => {
        if (!token) {
            setLoading(false);
            return;
        }

        const fetchMyCourses = async () => {
            try {
                setLoading(true);

                // Проверяем кэш для списка курсов пользователя
                const cachedUser = sessionStorage.getItem("user_data_cache");
                let selectedCourses: string[] = [];

                if (cachedUser) {
                    const { data, timestamp } = JSON.parse(cachedUser);
                    // Кэш действителен 30 секунд
                    if (Date.now() - timestamp < 30000) {
                        selectedCourses = data;
                    } else {
                        // Кэш устарел
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
                    // Кэша нет
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

                if (!selectedCourses || selectedCourses.length === 0) {
                    setCourses([]);
                    return;
                }

                // Загружаем данные курсов с задержкой, чтобы не перегружать сервер
                const coursesData = [];
                for (const courseId of selectedCourses) {
                    try {
                        // Проверяем кэш для конкретного курса
                        const cachedCourse = sessionStorage.getItem(
                            `course_${courseId}`,
                        );
                        let course;

                        if (cachedCourse) {
                            const { data, timestamp } =
                                JSON.parse(cachedCourse);
                            if (Date.now() - timestamp < 60000) {
                                // Кэш действителен 60 секунд
                                course = data;
                            } else {
                                course = await apiFetch<Course>(
                                    `/courses/${courseId}`,
                                );
                                sessionStorage.setItem(
                                    `course_${courseId}`,
                                    JSON.stringify({
                                        data: course,
                                        timestamp: Date.now(),
                                    }),
                                );
                            }
                        } else {
                            course = await apiFetch<Course>(
                                `/courses/${courseId}`,
                            );
                            sessionStorage.setItem(
                                `course_${courseId}`,
                                JSON.stringify({
                                    data: course,
                                    timestamp: Date.now(),
                                }),
                            );
                        }

                        // Получаем прогресс
                        const progressResponse = await apiFetch<{
                            progress: number;
                        }>(`/users/me/progress?courseId=${courseId}`);
                        course.progress = progressResponse.progress || 0;

                        coursesData.push(course);

                        // Задержка 100мс между запросами
                        await new Promise((resolve) =>
                            setTimeout(resolve, 100),
                        );
                    } catch (err) {
                        console.error(
                            `Ошибка загрузки курса ${courseId}:`,
                            err,
                        );
                    }
                }

                setCourses(coursesData);
            } catch (err: unknown) {
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
                <p className={styles.empty__text}>
                    У вас пока нет добавленных курсов
                </p>

                <Link href="/" className={`${styles.empty__btn} btn-primary`}>
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
                                    <span className={styles.progressText}>
                                        Прогресс: {progress}%
                                    </span>

                                    <div className={styles.progressBar}>
                                        <div
                                            className={styles.progressFill}
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Кнопка "Начать тренировки" */}
                                <button
                                    className={`${styles.startButton} btn-primary`}
                                    onClick={() =>
                                        handleStartTraining(
                                            course._id,
                                            progress,
                                        )
                                    }
                                >
                                    {progress === 0
                                        ? "Начать тренировки"
                                        : progress >= 100
                                          ? "Начать снова"
                                          : "Продолжить"}
                                </button>
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

            {/* Модалка выбора тренировки — один раз в самом конце */}
            {showWorkoutModal && selectedCourseId && (
                <WorkoutSelectionModal
                    courseId={selectedCourseId}
                    onClose={() => {
                        setShowWorkoutModal(false);
                        setSelectedCourseId(null);
                    }}
                />
            )}
        </>
    );
}
