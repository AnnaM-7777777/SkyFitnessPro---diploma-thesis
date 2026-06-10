import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Header from "@/components/Header/Header";
import { apiFetch } from "@/libs/apiConfig";
import ProgressModal from "@/components/ProgressModal/ProgressModal";
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

export default function WorkoutsPage() {
    const router = useRouter();
    const { id: courseId, selected } = router.query;
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeWorkout, setActiveWorkout] = useState<Workout | null>(null);
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

                // Получаем выбранные тренировки из sessionStorage
                const selectedWorkoutsJson = sessionStorage.getItem(
                    `selected_workouts_${courseId}`,
                );

                if (selectedWorkoutsJson) {
                    const selectedIds: string[] =
                        JSON.parse(selectedWorkoutsJson);
                    const filtered = data.filter((w) =>
                        selectedIds.includes(w._id),
                    );
                    setWorkouts(filtered);
                } else {
                    setWorkouts(data);
                }
            } catch (err) {
                console.error("Ошибка загрузки тренировок:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();
    }, [courseId]);

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

                            {/* Упражнения */}
                            <div className={styles.exercisesBlock}>
                                <h3 className={styles.exercisesTitle}>
                                    Упражнения тренировки
                                </h3>

                                <div className={styles.exercisesList}>
                                    {workout.exercises.map((exercise) => (
                                        <div
                                            key={exercise._id}
                                            className={styles.exerciseItem}
                                        >
                                            <span
                                                className={styles.exerciseName}
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
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Кнопка прогресса */}
                            <button
                                className={`${styles.progressButton} btn-primary`}
                                onClick={() => setActiveWorkout(workout)}
                            >
                                Заполнить свой прогресс
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
                    onClose={() => setActiveWorkout(null)}
                    onSuccess={() => {
                        alert("Прогресс сохранён!");
                        setActiveWorkout(null);
                        // Перезагружаем для обновления прогресса
                        window.location.reload();
                    }}
                />
            )}
        </div>
    );
}
