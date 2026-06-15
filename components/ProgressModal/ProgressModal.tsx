import { useState } from "react"
import { apiFetch } from "@/libs/apiConfig"
import styles from "./ProgressModal.module.css"

interface Exercise {
    _id: string
    name: string
}

interface ProgressModalProps {
    courseId: string
    workoutId: string
    exercises: Exercise[]
    initialProgress?: number[]
    onClose: () => void
    onSuccess: () => void
}

export default function ProgressModal({
    courseId,
    workoutId,
    exercises,
    initialProgress,
    onClose,
    onSuccess,
}: ProgressModalProps) {
    // Инициализируем массив прогресса нулями
    const [progressData, setProgressData] = useState<number[]>(
        initialProgress || exercises.map(() => 0)
    )
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleInputChange = (index: number, value: string) => {
        const numValue = parseInt(value) || 0
        // Валидация: только числа >= 0
        const clampedValue = Math.max(0, Math.min(numValue, 1000))

        const newData = [...progressData]
        newData[index] = clampedValue
        setProgressData(newData)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            await apiFetch(`/courses/${courseId}/workouts/${workoutId}`, {
                method: "PATCH",
                body: JSON.stringify({ progressData }),
            })

            onSuccess()
            onClose()
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Ошибка сохранения прогресса")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <h2 className={styles.title}>Мой прогресс</h2>

                <div className={styles.scrollContainer}>
                    <div className={styles.exercisesList}>
                        {exercises.map((exercise, index) => (
                            <div key={exercise._id} className={styles.exerciseRow}>
                                <div className={styles.exerciseInfo}>
                                    <div className={styles.exerciseName}>{exercise.name}</div>
                                </div>

                                <input
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={progressData[index]}
                                    onChange={(e) => handleInputChange(index, e.target.value)}
                                    className={styles.input}
                                    disabled={isSubmitting}
                                    aria-label={`Прогресс для упражнения: ${exercise.name}`}
                                />
                            </div>
                        ))}
                    </div>
                </div>

                {error && <div className={styles.error}>{error}</div>}

                <div className={styles.buttonBlock}>
                    <button
                        className={`${styles.buttonSubmit} btn-primary`}
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Сохранение..." : "Сохранить"}
                    </button>
                </div>
            </div>
        </div>
    )
}
