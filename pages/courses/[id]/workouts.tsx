import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Header from "@/components/Header/Header";
import { apiFetch } from "@/libs/apiConfig";
import ProgressModal from "@/components/ProgressModal/ProgressModal";
import SuccessModal from "@/components/SuccessModal/SuccessModal";
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
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const selectedRef = useRef<HTMLDivElement | null>(null);
    const hasLoaded = useRef(false);

    useEffect(() => {
        if (!courseId || hasLoaded.current) return;
        hasLoaded.current = true;

        const fetchWorkouts = async () => {
            try {
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

                // Загружаем прогресс только для выбранных тренировок
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
                workoutsProgress: Array<{
                    workoutId: string;
                    workoutCompleted: boolean;
                    progressData: number[];
                }>;
            }>(`/users/me/progress?courseId=${courseIdStr}`);

            const workoutsWithProgress = workoutsData.map((workout) => {
                const workoutProgress = progressData.workoutsProgress.find(
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
                        ...workout,
                        exerciseProgress,
                    };
                }

                return workout;
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
        const match = url.match(
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
        );
        return match ? match[1] : null;
    };

    const handleProgressSaved = () => {
        setShowSuccessModal(true);
        setActiveWorkout(null);

        // Перезагружаем прогресс через 1.5 секунды (после закрытия модалки)
        setTimeout(async () => {
            if (courseId) {
                const data = await apiFetch<Workout[]>(
                    `/courses/${courseId}/workouts`,
                );

                // Применяем фильтрацию из sessionStorage
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

    if (loading) {
        return (
            <div className={styles.container}>
                <Header />
                <div className={styles.loading}>Загрузка тренировок...</div>
            </div>
        );
    }

    if (workouts.length === 0) {
        return (
            <div className={styles.container}>
                <Header />
                <div className={styles.empty}>Тренировки не найдены</div>
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <Header />

            <main className={styles.main}>
                <h1 className={styles.title}>Тренировки курса</h1>

                {workouts.map((workout) => {
                    const videoId = getYouTubeId(workout.video);
                    const isSelected = selected === workout._id;
                    const hasProgress = !!workout.exerciseProgress;

                    return (
                        <div
                            key={workout._id}
                            ref={isSelected ? selectedRef : null}
                            className={`${styles.workoutBlock} ${
                                isSelected ? styles.workoutBlockSelected : ""
                            }`}
                        >
                            <h2 className={styles.workoutTitle}>
                                {workout.name}
                            </h2>

                            {/* Видео */}
                            <div className={styles.videoWrapper}>
                                {videoId ? (
                                    <iframe
                                        src={`https://www.youtube.com/embed/${videoId}`}
                                        title={workout.name}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className={styles.video}
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
                                    Упражнения тренировки
                                </h3>

                                <div className={styles.exercisesList}>
                                    {workout.exercises.map(
                                        (exercise, index) => {
                                            const progress =
                                                workout.exerciseProgress
                                                    ? workout.exerciseProgress[
                                                          index
                                                      ]?.progress || 0
                                                    : 0;

                                            return (
                                                <div
                                                    key={exercise._id}
                                                    className={
                                                        styles.exerciseItem
                                                    }
                                                >
                                                    <span
                                                        className={
                                                            styles.exerciseName
                                                        }
                                                    >
                                                        {exercise.name}
                                                    </span>
                                                    <span
                                                        className={
                                                            styles.exerciseQuantity
                                                        }
                                                    >
                                                        {exercise.quantity} раз
                                                    </span>

                                                    {/* Прогресс бар */}
                                                    {hasProgress && (
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
                                                    )}
                                                </div>
                                            );
                                        },
                                    )}
                                </div>
                            </div>

                            {/* Кнопка прогресса */}
                            <button
                                className={`${styles.progressButton} btn-primary`}
                                onClick={() => setActiveWorkout(workout)}
                            >
                                {hasProgress
                                    ? "Обновить свой прогресс"
                                    : "Заполнить свой прогресс"}
                            </button>
                        </div>
                    );
                })}
            </main>

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
                                  // Пересчитываем процент обратно в количество
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
        </div>
    );
}
