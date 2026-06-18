import { useRouter } from "next/router"
import { useEffect, useState, useRef, useMemo } from "react"
import Layout from "@/components/Layout/Layout"
import { apiFetch } from "@/libs/apiConfig"
import { useAuth } from "@/context/AuthContext"
import ProgressModal from "@/components/ProgressModal/ProgressModal"
import Modal, {
    ModalType,
} from "@/components/ModalUniversalNotifications/ModalUniversalNotifications"
import styles from "./WorkoutsPage.module.css"

interface Exercise {
    _id: string
    name: string
    quantity: number
}

interface Workout {
    _id: string
    name: string
    video: string
    exercises: Exercise[]
}

interface ExerciseProgress {
    name: string
    progress: number
}

interface WorkoutWithProgress extends Workout {
    exerciseProgress?: ExerciseProgress[]
}

export default function WorkoutsPage() {
    const router = useRouter()
    const { id, selected } = router.query
    const { token, isLoading } = useAuth()

    // Вычисляем courseId один раз через useMemo
    const courseId = useMemo(() => {
        if (!id) return ""
        return Array.isArray(id) ? id[0] : id
    }, [id])

    // Нормализуем selected через useMemo (защита от массива)
    const selectedId = useMemo(() => {
        if (!selected) return ""
        return Array.isArray(selected) ? selected[0] : selected
    }, [selected])

    const [workouts, setWorkouts] = useState<WorkoutWithProgress[]>([])
    const [loading, setLoading] = useState(true)
    const [activeWorkout, setActiveWorkout] = useState<WorkoutWithProgress | null>(null)
    const selectedRef = useRef<HTMLDivElement | null>(null)
    const [courseName, setCourseName] = useState<string>("")
    const [modal, setModal] = useState<{
        type: ModalType
        title: string
        message?: string
        onConfirm?: () => void
        autoClose?: number
        icon?: string
    } | null>(null)

    // Защита от неавторизованного доступа
    useEffect(() => {
        if (!isLoading && !token) {
            router.replace("/?modal=login")
        }
    }, [isLoading, token, router])

    // Загрузка тренировок — сбрасываем при смене courseId
    useEffect(() => {
        if (!courseId || !token) return

        const fetchWorkouts = async () => {
            setLoading(true)
            try {
                const courseData = await apiFetch<{
                    nameRU: string
                    nameEN: string
                }>(`/courses/${courseId}`)
                setCourseName(courseData.nameRU || courseData.nameEN || "Курс")

                const rawData = await apiFetch<Workout[]>(`/courses/${courseId}/workouts`)

                const data = await Promise.all(
                    rawData.map(async (workout) => {
                        if (!workout.video) {
                            try {
                                const fullWorkout = await apiFetch<Workout>(
                                    `/workouts/${workout._id}`
                                )
                                return { ...workout, ...fullWorkout }
                            } catch (err) {
                                console.error(
                                    `Не удалось загрузить тренировку ${workout._id}:`,
                                    err
                                )
                                return workout
                            }
                        }
                        return workout
                    })
                )

                const selectedWorkoutsJson = sessionStorage.getItem(`selected_workouts_${courseId}`)

                let workoutsToUse = data

                if (selectedWorkoutsJson) {
                    const selectedIds: string[] = JSON.parse(selectedWorkoutsJson)
                    workoutsToUse = data.filter((w) => selectedIds.includes(w._id))
                }

                await loadProgressForAllWorkouts(workoutsToUse, courseId)
            } catch (err) {
                console.error("Ошибка загрузки тренировок:", err)
            } finally {
                setLoading(false)
            }
        }

        fetchWorkouts()
    }, [courseId, token])

    // Загрузка прогресса для всех тренировок
    const loadProgressForAllWorkouts = async (workoutsData: Workout[], courseIdStr: string) => {
        try {
            const progressData = await apiFetch<{
                workoutsProgress?: Array<{
                    workoutId: string
                    workoutCompleted: boolean
                    progressData: number[]
                }>
            }>(`/users/me/progress?courseId=${courseIdStr}`)

            const workoutsWithProgress = workoutsData.map((workout) => {
                const workoutsProgress = progressData.workoutsProgress || []

                const workoutProgress = workoutsProgress.find((wp) => wp.workoutId === workout._id)

                // Проверяем, что exercises существует
                if (workoutProgress && workoutProgress.progressData && workout.exercises) {
                    const exerciseProgress = workout.exercises.map((exercise, index) => {
                        const userProgress = workoutProgress.progressData[index] || 0
                        const percentage =
                            exercise.quantity > 0
                                ? Math.min(
                                      100,
                                      Math.round((userProgress / exercise.quantity) * 100)
                                  )
                                : 0

                        return {
                            name: exercise.name,
                            progress: percentage,
                        }
                    })

                    return {
                        ...workout,
                        exerciseProgress,
                    }
                }

                return workout
            })

            setWorkouts(workoutsWithProgress)
        } catch (err) {
            console.error("Ошибка загрузки прогресса:", err)
        }
    }

    // Вынесенная функция перезагрузки прогресса (убираем дублирование)
    const reloadProgress = async () => {
        if (!courseId) return

        const data = await apiFetch<Workout[]>(`/courses/${courseId}/workouts`)

        const selectedWorkoutsJson = sessionStorage.getItem(`selected_workouts_${courseId}`)

        let workoutsToUse = data

        if (selectedWorkoutsJson) {
            const selectedIds: string[] = JSON.parse(selectedWorkoutsJson)
            workoutsToUse = data.filter((w) => selectedIds.includes(w._id))
        }

        await loadProgressForAllWorkouts(workoutsToUse, courseId)
    }

    // Автопрокрутка к выбранной тренировке
    useEffect(() => {
        if (selectedId && selectedRef.current && workouts.length > 0) {
            setTimeout(() => {
                selectedRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "center",
                })
            }, 300)
        }
    }, [selectedId, workouts])

    const getYouTubeId = (url: string) => {
        if (!url) return null

        if (url.includes("/embed/")) {
            return url
        }

        const patterns = [
            /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^"&?\/\s]{11})/,
            /youtube\.com\/shorts\/([^"&?\/\s]{11})/,
        ]

        for (const pattern of patterns) {
            const match = url.match(pattern)
            if (match) {
                return `https://www.youtube.com/embed/${match[1]}`
            }
        }

        return null
    }

    // Обработчик клика по кнопке "Заполнить прогресс"
    const handleProgressClick = async (workout: WorkoutWithProgress) => {
        if (workout.exercises && workout.exercises.length > 0) {
            setActiveWorkout(workout)
            return
        }

        try {
            const fullWorkout = await apiFetch<Workout>(`/workouts/${workout._id}`)

            setWorkouts((prev) =>
                prev.map((w) =>
                    w._id === workout._id ? { ...w, exercises: fullWorkout.exercises } : w
                )
            )

            if (!fullWorkout.exercises || fullWorkout.exercises.length === 0) {
                setModal({
                    type: "confirm",
                    title: "Тренировка не содержит упражнений",
                    message: "Засчитать прогресс и отметить как завершённую?",
                    onConfirm: async () => {
                        try {
                            await apiFetch(`/courses/${courseId}/workouts/${workout._id}`, {
                                method: "PATCH",
                                body: JSON.stringify({ progressData: [] }),
                            })

                            setModal({
                                type: "success",
                                title: "Тренировка отмечена как завершённая!",
                                autoClose: 2000,
                            })

                            handleProgressSaved()
                        } catch (err) {
                            setModal({
                                type: "error",
                                title: "Ошибка",
                                message: "Не удалось сохранить прогресс",
                                autoClose: 3000,
                            })
                        }
                    },
                })
                return
            }

            setActiveWorkout({
                ...workout,
                exercises: fullWorkout.exercises,
            })
        } catch (err) {
            setModal({
                type: "error",
                title: "Ошибка",
                message: "Не удалось загрузить упражнения",
                autoClose: 3000,
            })
        }
    }

    const handleProgressSaved = () => {
        setActiveWorkout(null)

        setModal({
            type: "success",
            title: "Ваш прогресс засчитан!",
            autoClose: 2000,
        })

        setTimeout(async () => {
            await reloadProgress()
        }, 1500)
    }

    // Сброс прогресса конкретной тренировки
    const handleResetWorkoutProgress = async (workoutId: string, exercisesCount: number) => {
        setModal({
            type: "confirm",
            title: "Сбросить прогресс?",
            message: "Это действие нельзя отменить. Вы уверены?",
            onConfirm: async () => {
                try {
                    const emptyProgress = Array(exercisesCount).fill(0)

                    await apiFetch(`/courses/${courseId}/workouts/${workoutId}`, {
                        method: "PATCH",
                        body: JSON.stringify({
                            progressData: emptyProgress,
                        }),
                    })

                    setModal({
                        type: "success",
                        title: "Ваш прогресс сброшен!",
                        autoClose: 2000,
                        icon: "/img/info.svg",
                    })

                    await reloadProgress()
                } catch (err) {
                    setModal({
                        type: "error",
                        title: "Ошибка",
                        message: "Не удалось сбросить прогресс",
                        autoClose: 3000,
                    })
                }
            },
        })
    }

    // Показываем loading при проверке авторизации
    if (isLoading) {
        return (
            <Layout showTitle={false}>
                <div className={styles.container}>
                    <div className={styles.loading}>Проверка авторизации...</div>
                </div>
            </Layout>
        )
    }

    // Если не авторизован — не рендерим
    if (!token) {
        return null
    }

    if (loading) {
        return (
            <Layout showTitle={false}>
                <div className={styles.container}>
                    <div className={styles.loading}>Загрузка тренировок...</div>
                </div>
            </Layout>
        )
    }

    if (workouts.length === 0) {
        return (
            <Layout showTitle={false}>
                <div className={styles.container}>
                    <div className={styles.empty}>Тренировки не найдены</div>
                </div>
            </Layout>
        )
    }

    return (
        <Layout showTitle={false} showScrollToTop={true}>
            <div className={styles.container}>
                <h2 className={styles.title}>{courseName}</h2>

                {workouts.map((workout) => {
                    const videoId = getYouTubeId(workout.video)
                    const isSelected = selectedId === workout._id
                    const hasProgress =
                        workout.exerciseProgress?.some((ep) => ep.progress > 0) ?? false

                    return (
                        <div
                            key={workout._id}
                            ref={isSelected ? selectedRef : null}
                            className={styles.workoutBlock}
                        >
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
                                                `❌ Видео "${workout.name}" не загрузилось`
                                            )
                                        }}
                                    />
                                ) : (
                                    <div className={styles.videoPlaceholder}>Видео недоступно</div>
                                )}
                            </div>

                            <div className={styles.exercisesBlock}>
                                <h3 className={styles.exercisesTitle}>{workout.name}</h3>

                                <div className={styles.exercisesList}>
                                    {workout.exercises?.map((exercise, index) => {
                                        const progress = workout.exerciseProgress
                                            ? workout.exerciseProgress[index]?.progress || 0
                                            : 0

                                        return (
                                            <div key={exercise._id} className={styles.exerciseItem}>
                                                <span className={styles.exerciseName}>
                                                    {exercise.name} {progress}%
                                                </span>

                                                <div className={styles.progressContainer}>
                                                    <div
                                                        className={styles.progressBar}
                                                        style={{
                                                            width: `${progress}%`,
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                <div className={styles.progressButtonsBlock}>
                                    <button
                                        className={`${styles.progressButton} btn-primary`}
                                        onClick={() => handleProgressClick(workout)}
                                    >
                                        {hasProgress
                                            ? "Обновить свой прогресс"
                                            : "Заполнить свой прогресс"}
                                    </button>

                                    {hasProgress && (
                                        <button
                                            className={`${styles.resetButton} btn-secondary`}
                                            onClick={() =>
                                                handleResetWorkoutProgress(
                                                    workout._id,
                                                    workout.exercises.length
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
                    )
                })}

                {activeWorkout && courseId && (
                    <ProgressModal
                        courseId={courseId}
                        workoutId={activeWorkout._id}
                        exercises={activeWorkout.exercises}
                        initialProgress={
                            activeWorkout.exerciseProgress
                                ? activeWorkout.exercises.map((exercise, index) => {
                                      const progress =
                                          activeWorkout.exerciseProgress?.[index]?.progress || 0
                                      return Math.round((progress / 100) * exercise.quantity)
                                  })
                                : undefined
                        }
                        onClose={() => setActiveWorkout(null)}
                        onSuccess={handleProgressSaved}
                    />
                )}

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
        </Layout>
    )
}
