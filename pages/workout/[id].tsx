import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import Image from "next/image";
import Header from "@/components/Header/Header";
import { apiFetch } from "@/libs/apiConfig";
import styles from "./WorkoutPage.module.css";
import ProgressModal from "@/components/ProgressModal/ProgressModal";

// Тип для упражнения
interface Exercise {
    _id: string;
    name: string;
    quantity: number;
}

// Тип для тренировки
interface Workout {
    _id: string;
    name: string;
    video: string;
    exercises: Exercise[];
}

export default function WorkoutPage() {
    const router = useRouter();
    const { id } = router.query;
    const [workout, setWorkout] = useState<Workout | null>(null);
    const [loading, setLoading] = useState(true);

    const [showProgressModal, setShowProgressModal] = useState(false);
    const [courseId, setCourseId] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchWorkout = async () => {
            try {
                const data = await apiFetch<Workout>(`/workouts/${id}`);
                setWorkout(data);

                // Получаем courseId из query (если передан)
                const courseIdFromQuery = router.query.courseId as string;
                if (courseIdFromQuery) {
                    setCourseId(courseIdFromQuery);
                }
            } catch (err) {
                console.error("Ошибка загрузки тренировки:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkout();
    }, [id, router.query.courseId]);

    if (loading) {
        return (
            <div className={styles.container}>
                <Header />
                <div className={styles.loading}>Загрузка тренировки...</div>
            </div>
        );
    }

    if (!workout) {
        return (
            <div className={styles.container}>
                <Header />
                <div className={styles.error}>Тренировка не найдена</div>
            </div>
        );
    }

    // Извлекаем ID видео из YouTube ссылки для iframe
    const getYouTubeId = (url: string) => {
        const match = url.match(
            /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/,
        );
        return match ? match[1] : null;
    };

    const videoId = getYouTubeId(workout.video);

    return (
        <div className={styles.container}>
            <Header />

            <main className={styles.main}>
                <h1 className={styles.title}>{workout.name}</h1>

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

                {/* Список упражнений */}
                <div className={styles.exercisesBlock}>
                    <h2 className={styles.exercisesTitle}>
                        Упражнения тренировки
                    </h2>

                    <div className={styles.exercisesList}>
                        {workout.exercises.map((exercise) => (
                            <div
                                key={exercise._id}
                                className={styles.exerciseItem}
                            >
                                <span className={styles.exerciseName}>
                                    {exercise.name}
                                </span>
                                <span className={styles.exerciseQuantity}>
                                    {exercise.quantity} раз
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Кнопка заполнения прогресса */}
                <button
                    className={`${styles.progressButton} btn-primary`}
                    onClick={() => setShowProgressModal(true)}
                    disabled={!courseId}
                >
                    {courseId ? "Заполнить свой прогресс" : "Загрузка..."}
                </button>

                {showProgressModal && workout && courseId && (
                    <ProgressModal
                        courseId={courseId}
                        workoutId={workout._id}
                        exercises={workout.exercises}
                        onClose={() => setShowProgressModal(false)}
                        onSuccess={() => {
                            alert("Прогресс сохранён!");
                            // Здесь можно обновить данные тренировки
                        }}
                    />
                )}
            </main>
        </div>
    );
}
