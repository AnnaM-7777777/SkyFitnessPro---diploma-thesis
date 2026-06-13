import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Header from "@/components/Header/Header";
import { apiFetch } from "@/libs/apiConfig";
import ProgressModal from "@/components/ProgressModal/ProgressModal";
import Modal, {
    ModalType,
} from "@/components/ModalUniversalNotifications/ModalUniversalNotifications";
import styles from "./WorkoutsPage.module.css";

interface Exercise {
    _id: string;
    name: string;
    quantity: number;
}

interface Workout {
    _id: string;
    name: string;
    video: string;
    exercises: Exercise[];
}

interface ExerciseProgress {
    name: string;
    progress: number;
}

interface WorkoutWithProgress extends Workout {
    exerciseProgress?: ExerciseProgress[];
}

export default function WorkoutsPage() {
    const router = useRouter();
    const { id: courseId, selected } = router.query;
    const [workouts, setWorkouts] = useState<WorkoutWithProgress[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeWorkout, setActiveWorkout] =
        useState<WorkoutWithProgress | null>(null);
    const selectedRef = useRef<HTMLDivElement | null>(null);
    const hasLoaded = useRef(false);
    const [courseName, setCourseName] = useState<string>("");
    const [modal, setModal] = useState<{
        type: ModalType;
        title: string;
        message?: string;
        onConfirm?: () => void;
        autoClose?: number;
        icon?: string;
    } | null>(null);

    useEffect(() => {
        if (!courseId || hasLoaded.current) return;
        hasLoaded.current = true;

        const fetchWorkouts = async () => {
            try {
                const courseData = await apiFetch<{
                    nameRU: string;
                    nameEN: string;
                }>(`/courses/${courseId}`);
                setCourseName(courseData.nameRU || courseData.nameEN || "Курс");

                let data = await apiFetch<Workout[]>(
                    `/courses/${courseId}/workouts`,
                );

                // Если у тренировок нет video, загружаем полную информацию
                data = await Promise.all(
                    data.map(async (workout) => {
                        if (!workout.video) {
                            try {
                                const fullWorkout = await apiFetch<Workout>(
                                    `/workouts/${workout._id}`,
                                );
                                return { ...workout, ...fullWorkout };
                            } catch (err) {
                                console.error(
                                    `Не удалось загрузить тренировку ${workout._id}:`,
                                    err,
                                );
                                return workout;
                            }
                        }
                        return workout;
                    }),
                );

                const selectedWorkoutsJson = sessionStorage.getItem(
                    `selected_workouts_${courseId}`,
                );

                let workoutsToUse = data;

                if (selectedWorkoutsJson) {
                    const selectedIds: string[] =
                        JSON.parse(selectedWorkoutsJson);
                    workoutsToUse = data.filter((w) =>
                        selectedIds.includes(w._id),
                    );
                }

                await loadProgressForAllWorkouts(
                    workoutsToUse,
                    courseId as string,
                );
            } catch (err) {
                console.error("Ошибка загрузки тренировок:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();
    }, [courseId]);

    // Загрузка прогресса для всех тренировок
    const loadProgressForAllWorkouts = async (
        workoutsData: Workout[],
        courseIdStr: string,
    ) => {
        try {
            const progressData = await apiFetch<{
                workoutsProgress?: Array<{
                    workoutId: string;
                    workoutCompleted: boolean;
                    progressData: number[];
                }>;
            }>(`/users/me/progress?courseId=${courseIdStr}`);

            const workoutsWithProgress = workoutsData.map((workout) => {
                const workoutsProgress = progressData.workoutsProgress || [];

                const workoutProgress = workoutsProgress.find(
                    (wp) => wp.workoutId === workout._id,
                );

                if (workoutProgress && workoutProgress.progressData) {
                    const exerciseProgress = workout.exercises.map(
                        (exercise, index) => {
                            const userProgress =
                                workoutProgress.progressData[index] || 0;
                            const percentage =
                                exercise.quantity > 0
                                    ? Math.min(
                                          100,
                                          Math.round(
                                              (userProgress /
                                                  exercise.quantity) *
                                                  100,
                                          ),
                                      )
                                    : 0;

                            return {
                                name: exercise.name,
                                progress: percentage,
                            };
                        },
                    );

                    return {
                        ...workout, // Сохраняем все поля, включая video
                        exerciseProgress,
                    };
                }

                return workout; // Возвращаем оригинальный объект с video
            });

            setWorkouts(workoutsWithProgress);
        } catch (err) {
            console.error("Ошибка загрузки прогресса:", err);
        }
    };

    // Автопрокрутка к выбранной тренировке
    useEffect(() => {
        if (selected && selectedRef.current && workouts.length > 0) {
            setTimeout(() => {
                selectedRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                });
            }, 300);
        }
    }, [selected, workouts]);

    const getYouTubeId = (url: string) => {
        if (!url) return null;

        // Если это уже embed URL - возвращаем как есть
        if (url.includes("/embed/")) {
            return url;
        }

        // Если это watch URL - извлекаем ID
        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^"&?\/\s]{11})/,
            /youtube\.com\/shorts\/([^"&?\/\s]{11})/,
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return `https://www.youtube.com/embed/${match[1]}`;
            }
        }

        return null;
    };

    // Обработчик клика по кнопке "Заполнить прогресс"
    const handleProgressClick = async (workout: WorkoutWithProgress) => {
        if (workout.exercises && workout.exercises.length > 0) {
            setActiveWorkout(workout);
            return;
        }

        try {
            const fullWorkout = await apiFetch<Workout>(
                `/workouts/${workout._id}`,
            );

            setWorkouts((prev) =>
                prev.map((w) =>
                    w._id === workout._id
                        ? { ...w, exercises: fullWorkout.exercises }
                        : w,
                ),
            );

            if (!fullWorkout.exercises || fullWorkout.exercises.length === 0) {
                await apiFetch(`/courses/${courseId}/workouts/${workout._id}`, {
                    method: "PATCH",
                    body: JSON.stringify({ progressData: [] }),
                });

                setModal({
                    type: "success",
                    title: "Тренировка отмечена как завершённая!",
                    autoClose: 2000,
                });

                handleProgressSaved();
                return;
            }

            setActiveWorkout({
                ...workout,
                exercises: fullWorkout.exercises,
            });
        } catch (err) {
            setModal({
                type: "error",
                title: "Ошибка",
                message: "Не удалось загрузить упражнения",
                autoClose: 3000,
            });
        }
    };

    const handleProgressSaved = () => {
        setActiveWorkout(null);

        // Показываем модалку успеха
        setModal({
            type: "success",
            title: "Ваш прогресс засчитан!",
            autoClose: 2000,
        });

        // Перезагружаем прогресс через 1.5 секунды
        setTimeout(async () => {
            if (courseId) {
                const data = await apiFetch<Workout[]>(
                    `/courses/${courseId}/workouts`,
                );

                const selectedWorkoutsJson = sessionStorage.getItem(
                    `selected_workouts_${courseId}`,
                );

                let workoutsToUse = data;

                if (selectedWorkoutsJson) {
                    const selectedIds: string[] =
                        JSON.parse(selectedWorkoutsJson);
                    workoutsToUse = data.filter((w) =>
                        selectedIds.includes(w._id),
                    );
                }

                await loadProgressForAllWorkouts(
                    workoutsToUse,
                    courseId as string,
                );
            }
        }, 1500);
    };

    // Сброс прогресса конкретной тренировки
    const handleResetWorkoutProgress = async (
        workoutId: string,
        exercisesCount: number,
    ) => {
        setModal({
            type: "confirm",
            title: "Сбросить прогресс?",
            message: "Это действие нельзя отменить. Вы уверены?",
            onConfirm: async () => {
                try {
                    const emptyProgress = Array(exercisesCount).fill(0);

                    await apiFetch(
                        `/courses/${courseId}/workouts/${workoutId}`,
                        {
                            method: "PATCH",
                            body: JSON.stringify({
                                progressData: emptyProgress,
                            }),
                        },
                    );

                    setModal({
                        type: "success",
                        title: "Ваш прогресс сброшен!",
                        autoClose: 2000,
                        icon: "/img/info.svg",
                    });

                    // Перезагрузка прогресса
                    if (courseId) {
                        const data = await apiFetch<Workout[]>(
                            `/courses/${courseId}/workouts`,
                        );

                        const selectedWorkoutsJson = sessionStorage.getItem(
                            `selected_workouts_${courseId}`,
                        );

                        let workoutsToUse = data;

                        if (selectedWorkoutsJson) {
                            const selectedIds: string[] =
                                JSON.parse(selectedWorkoutsJson);
                            workoutsToUse = data.filter((w) =>
                                selectedIds.includes(w._id),
                            );
                        }

                        await loadProgressForAllWorkouts(
                            workoutsToUse,
                            courseId as string,
                        );
                    }
                } catch (err) {
                    setModal({
                        type: "error",
                        title: "Ошибка",
                        message: "Не удалось сбросить прогресс",
                        autoClose: 3000,
                    });
                }
            },
        });
    };

    if (loading) {
        return (
            <div className={styles.container}>
                <Header showTitle={false} />
                <div className={styles.loading}>Загрузка тренировок...</div>
            </div>
        );
    }

    if (workouts.length === 0) {
        return (
            <div className={styles.container}>
                <Header showTitle={false} />
                <div className={styles.empty}>Тренировки не найдены</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Header showTitle={false} />
            <h2 className={styles.title}>{courseName}</h2>

            {workouts.map((workout) => {
                const videoId = getYouTubeId(workout.video);
                const isSelected = selected === workout._id;
                const hasProgress =
                    workout.exerciseProgress?.some((ep) => ep.progress > 0) ??
                    false;

                return (
                    <div
                        key={workout._id}
                        ref={isSelected ? selectedRef : null}
                        className={styles.workoutBlock}
                    >
                        {/* Видео */}
                        <div className={styles.videoWrapper}>
                            {videoId ? (
                                <iframe
                                    src={videoId}
                                    title={workout.name}
                                    frameBorder="0"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                    className={styles.video}
                                    onError={() => {
                                        console.error(
                                            `❌ Видео "${workout.name}" не загрузилось`,
                                        );
                                    }}
                                />
                            ) : (
                                <div className={styles.videoPlaceholder}>
                                    Видео недоступно
                                </div>
                            )}
                        </div>

                        {/* Упражнения с прогрессом */}
                        <div className={styles.exercisesBlock}>
                            <h3 className={styles.exercisesTitle}>
                                {workout.name}
                            </h3>

                            <div className={styles.exercisesList}>
                                {workout.exercises.map((exercise, index) => {
                                    const progress = workout.exerciseProgress
                                        ? workout.exerciseProgress[index]
                                              ?.progress || 0
                                        : 0;

                                    return (
                                        <div
                                            key={exercise._id}
                                            className={styles.exerciseItem}
                                        >
                                            <span
                                                className={styles.exerciseName}
                                            >
                                                {exercise.name} {progress}%
                                            </span>

                                            {/* Прогресс бар */}
                                            <div
                                                className={
                                                    styles.progressContainer
                                                }
                                            >
                                                <div
                                                    className={
                                                        styles.progressBar
                                                    }
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Блок кнопок прогресса */}
                            <div className={styles.progressButtonsBlock}>
                                <button
                                    className={`${styles.progressButton} btn-primary`}
                                    onClick={() => handleProgressClick(workout)}
                                >
                                    {hasProgress
                                        ? "Обновить свой прогресс"
                                        : "Заполнить свой прогресс"}
                                </button>

                                {/* Кнопка сброса — только если есть прогресс */}
                                {hasProgress && (
                                    <button
                                        className={`${styles.resetButton} btn-secondary`}
                                        onClick={() =>
                                            handleResetWorkoutProgress(
                                                workout._id,
                                                workout.exercises.length,
                                            )
                                        }
                                    >
                                        Сбросить свой прогресс
                                    </button>
                                )}
                            </div>
                        </div>

                        <hr className={styles.exercisesLine} />
                    </div>
                );
            })}

            {/* Модалка прогресса */}
            {activeWorkout && courseId && (
                <ProgressModal
                    courseId={courseId as string}
                    workoutId={activeWorkout._id}
                    exercises={activeWorkout.exercises}
                    initialProgress={
                        activeWorkout.exerciseProgress
                            ? activeWorkout.exercises.map((exercise, index) => {
                                  const progress =
                                      activeWorkout.exerciseProgress?.[index]
                                          ?.progress || 0;
                                  return Math.round(
                                      (progress / 100) * exercise.quantity,
                                  );
                              })
                            : undefined
                    }
                    onClose={() => setActiveWorkout(null)}
                    onSuccess={handleProgressSaved}
                />
            )}

            {/* Модалка успеха */}
            {modal && (
                <Modal
                    type={modal.type}
                    title={modal.title}
                    message={modal.message}
                    onConfirm={modal.onConfirm}
                    onCancel={() => setModal(null)}
                    onClose={() => setModal(null)}
                    autoClose={modal.autoClose}
                    icon={modal.icon}
                />
            )}
        </div>
    );
}
