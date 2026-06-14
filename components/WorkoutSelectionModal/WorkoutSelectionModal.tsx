import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/router";
import { apiFetch } from "@/libs/apiConfig";
import styles from "./WorkoutSelectionModal.module.css";

interface Workout {
    _id: string;
    name: string;
    video: string;
    exercises: Array<{
        _id: string;
        name: string;
        quantity: number;
    }>;
}

interface WorkoutSelectionModalProps {
    courseId: string;
    onClose: () => void;
}

export default function WorkoutSelectionModal({
    courseId,
    onClose,
}: WorkoutSelectionModalProps) {
    const router = useRouter();
    const [workouts, setWorkouts] = useState<Workout[]>([]);
    const [loading, setLoading] = useState(true);
    // Массив выбранных ID вместо одного
    const [selectedWorkouts, setSelectedWorkouts] = useState<string[]>([]);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWorkouts = async () => {
            try {
                const data = await apiFetch<Workout[]>(
                    `/courses/${courseId}/workouts`,
                );
                setWorkouts(data);
            } catch (err) {
                console.error("Ошибка загрузки тренировок:", err);
                setError("Не удалось загрузить тренировки");
            } finally {
                setLoading(false);
            }
        };

        fetchWorkouts();
    }, [courseId]);

    const handleToggle = (workoutId: string) => {
        setSelectedWorkouts((prev) =>
            prev.includes(workoutId)
                ? prev.filter((id) => id !== workoutId)
                : [...prev, workoutId],
        );
    };

    const handleStart = () => {
        if (selectedWorkouts.length > 0) {
            sessionStorage.setItem(
                `selected_workouts_${courseId}`,
                JSON.stringify(selectedWorkouts),
            );

            router.push(`/courses/${courseId}/workouts`);
            onClose();
        }
    };

    if (loading) {
        return (
            <div className={styles.overlay} onClick={onClose}>
                <div
                    className={styles.modal}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className={styles.loading}>Загрузка тренировок...</div>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.blockTitle}>
                    <h2 className={styles.title}>Выберите тренировку</h2>
                </div>

                <div className={styles.scrollContainer}>
                    <div className={styles.workoutList}>
                        {workouts.map((workout) => (
                            <label
                                key={workout._id}
                                className={styles.workoutItem}
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedWorkouts.includes(
                                        workout._id,
                                    )}
                                    onChange={() => handleToggle(workout._id)}
                                    className={styles.checkbox}
                                    aria-label={`Выбрать тренировку: ${workout.name}`}
                                />

                                <div className={styles.workoutInfo}>
                                    <div className={styles.workoutName}>
                                        {workout.name}
                                    </div>
                                    <div className={styles.workoutMeta}>
                                        {workout.exercises.length} упражнений
                                    </div>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                
                <div className={styles.blockButton}>
                    <button
                        className={`${styles.startButton} btn-primary`}
                        onClick={handleStart}
                        disabled={selectedWorkouts.length === 0}
                    >
                        Начать
                    </button>
                </div>
            </div>
        </div>
    );
}
