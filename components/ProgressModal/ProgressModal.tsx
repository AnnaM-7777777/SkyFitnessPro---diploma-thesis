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
    // Инициализируем массив пустыми строками (чтобы поля были пустыми, а не с нулями)
    const [progressData, setProgressData] = useState<(number | "")[]>(() => {
        if (!initialProgress || initialProgress.length === 0) {
            return exercises.map(() => "")
        }
        // Если есть initialProgress — подставляем числа, остальные поля — пустые
        return exercises.map((_, index) =>
            initialProgress[index] !== undefined ? initialProgress[index] : ""
        )
    })
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleInputChange = (index: number, value: string) => {
        const newData = [...progressData]

        // Если поле пустое — сохраняем пустую строку
        if (value === "") {
            newData[index] = ""
            setProgressData(newData)
            return
        }

        const numValue = parseInt(value)
        // Игнорируем невалидный ввод (буквы, спецсимволы)
        if (isNaN(numValue)) return

        // Валидация: только числа от 0 до 1000
        const clampedValue = Math.max(0, Math.min(numValue, 1000))
        newData[index] = clampedValue
        setProgressData(newData)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)
        setError(null)

        try {
            // При отправке конвертируем пустые значения в 0
            const submitData = progressData.map((value) => (value === "" ? 0 : value))

            await apiFetch(`/courses/${courseId}/workouts/${workoutId}`, {
                method: "PATCH",
                body: JSON.stringify({ progressData: submitData }),
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
                        {exercises.length === 0 ? (
                            <div className={styles.empty}>Нет упражнений для заполнения</div>
                        ) : (
                            exercises.map((exercise, index) => (
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
                            ))
                        )}
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
