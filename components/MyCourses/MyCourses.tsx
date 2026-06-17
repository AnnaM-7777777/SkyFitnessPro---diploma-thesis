import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import Image from "next/image"
import { useAuth } from "@/context/AuthContext"
import { apiFetch } from "@/libs/apiConfig"
import type { Course } from "@/types/course"
import courseStyles from "@/components/CourseCard/CourseCard.module.css"
import styles from "./MyCourses.module.css"
import WorkoutSelectionModal from "@/components/WorkoutSelectionModal/WorkoutSelectionModal"
import Toast from "@/components/Toast/Toast"

type UserData = {
    email: string
    selectedCourses: string[]
}

type WorkoutProgress = {
    workoutId: string
    workoutCompleted: boolean
    progressData: number[]
}

type CourseProgressData = {
    courseId: string
    courseCompleted: boolean
    workoutsProgress: WorkoutProgress[]
}

type CourseWithProgress = Course & {
    progress: number
    hasSelectedWorkouts?: boolean
    hasProgress?: boolean
}

const COURSE_IMAGES: Record<string, string> = {
    Йога: "/img/1-yoga.jpg",
    Стретчинг: "/img/2-stretching.jpg",
    Фитнес: "/img/3-fitness.jpg",
    "Степ-аэробика": "/img/4-aerobics.jpg",
    Бодифлекс: "/img/5-bodyflex.jpg",
    Yoga: "/img/1-yoga.jpg",
    Stretching: "/img/2-stretching.jpg",
    Fitness: "/img/3-fitness.jpg",
    Aerobics: "/img/4-aerobics.jpg",
    Bodyflex: "/img/5-bodyflex.jpg",
}

// Определяем класс для позиционирования фона по названию курса
// (аналогично CourseCard, используем классы из courseStyles)
const getCourseBgClass = (title: string): string => {
    const lowerTitle = title.toLowerCase()

    if (lowerTitle.includes("йог") || lowerTitle.includes("yoga")) return courseStyles.bg_yoga
    if (
        lowerTitle.includes("стретч") ||
        lowerTitle.includes("растяж") ||
        lowerTitle.includes("stretching")
    )
        return courseStyles.bg_stretching
    if (lowerTitle.includes("фитнес") || lowerTitle.includes("fitness"))
        return courseStyles.bg_fitness
    if (lowerTitle.includes("аэроб") || lowerTitle.includes("aerob"))
        return courseStyles.bg_aerobics
    if (lowerTitle.includes("бодифлекс") || lowerTitle.includes("bodyflex"))
        return courseStyles.bg_bodyflex

    return courseStyles.bg_yoga
}

export default function MyCourses() {
    const { token } = useAuth()
    const router = useRouter()
    const [courses, setCourses] = useState<CourseWithProgress[]>([])
    const [loading, setLoading] = useState(true)
    const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 })
    const [showCustomCursor, setShowCustomCursor] = useState(false)
    const [showWorkoutModal, setShowWorkoutModal] = useState(false)
    const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
    const [isNavigating, setIsNavigating] = useState(false)
    const [toast, setToast] = useState<{
        message: string
        type: "error" | "success"
    } | null>(null)

    // Защита курсора от мобильных устройств
    const [hasHover, setHasHover] = useState(false)

    useEffect(() => {
        const mediaQuery = window.matchMedia("(hover: hover) and (pointer: fine)")
        setHasHover(mediaQuery.matches)
    }, [])

    // Функция загрузки курсов (вынесена отдельно)
    const fetchMyCourses = async (isRefresh = false) => {
        if (!token) return

        try {
            if (!isRefresh) {
                setLoading(true)
            }

            const response = await apiFetch<{ user: UserData }>("/users/me")
            const rawSelectedCourses = response.user.selectedCourses || []

            // Убираем дубликаты через Set
            const selectedCourses = Array.from(new Set(rawSelectedCourses))

            if (!selectedCourses || selectedCourses.length === 0) {
                setCourses([])
                return
            }

            const coursesData = []
            for (const courseId of selectedCourses) {
                try {
                    const course = await apiFetch<CourseWithProgress>(`/courses/${courseId}`)

                    // Получаем прогресс по курсу
                    const progressResponse = await apiFetch<{
                        courseId: string
                        courseCompleted: boolean
                        workoutsProgress?: Array<{
                            workoutId: string
                            workoutCompleted: boolean
                            progressData: number[]
                        }>
                    }>(`/users/me/progress?courseId=${courseId}`)

                    // Проверяем, есть ли выбранные тренировки в sessionStorage
                    const selectedWorkoutsJson = sessionStorage.getItem(
                        `selected_workouts_${courseId}`
                    )
                    const hasSelectedWorkouts = !!selectedWorkoutsJson

                    const workoutsProgress = progressResponse.workoutsProgress || []

                    // Считаем прогресс по выбранным тренировкам
                    let completedWorkouts = 0
                    let totalSelectedWorkouts = 0

                    // Функция проверки: есть ли у тренировки хоть какой-то прогресс
                    const hasAnyProgress = (wp: {
                        progressData: number[]
                        workoutCompleted: boolean
                    }): boolean => {
                        return (
                            wp.workoutCompleted ||
                            (wp.progressData && wp.progressData.some((val) => val > 0))
                        )
                    }

                    if (hasSelectedWorkouts && selectedWorkoutsJson) {
                        const selectedIds: string[] = JSON.parse(selectedWorkoutsJson)
                        totalSelectedWorkouts = selectedIds.length

                        // Считаем тренировки с любым прогрессом среди выбранных
                        completedWorkouts = workoutsProgress.filter((wp) => {
                            return selectedIds.includes(wp.workoutId) && hasAnyProgress(wp)
                        }).length
                    } else {
                        totalSelectedWorkouts = workoutsProgress.length
                        completedWorkouts = workoutsProgress.filter((wp) =>
                            hasAnyProgress(wp)
                        ).length
                    }

                    const progress =
                        totalSelectedWorkouts > 0
                            ? Math.round((completedWorkouts / totalSelectedWorkouts) * 100)
                            : 0

                    // Проверяем: есть ли уже начатые тренировки
                    const hasProgress = workoutsProgress.length > 0

                    // Добавляем флаги
                    course.hasSelectedWorkouts = hasSelectedWorkouts
                    course.hasProgress = hasProgress
                    course.progress = progress

                    coursesData.push(course)

                    await new Promise((resolve) => setTimeout(resolve, 100))
                } catch (err) {
                    // Игнорируем прерванные запросы (HMR, переход между страницами)
                    if (
                        err instanceof Error &&
                        (err.message.includes("Failed to fetch") ||
                            err.message.includes("Abort") ||
                            err.name === "AbortError")
                    ) {
                        return // Тихо выходим
                    }

                    console.error(`Ошибка загрузки курса ${courseId}:`, err)
                }
            }

            setCourses(coursesData)
        } catch (err: unknown) {
            console.error("Ошибка загрузки курсов:", err)
        } finally {
            setLoading(false)
        }
    }

    // Загрузка при монтировании (первый вход)
    useEffect(() => {
        if (!token) {
            setLoading(false)
            return
        }

        fetchMyCourses(false)
    }, [token])

    // Обновление при каждом возврате на страницу
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible" && token && !loading) {
                fetchMyCourses(true)
            }
        }

        document.addEventListener("visibilitychange", handleVisibilityChange)

        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange)
        }
    }, [token, loading])

    // Обработчик кнопки:

    const handleStartTraining = async (
        courseId: string,
        progress: number,
        hasProgress: boolean
    ) => {
        // Блокируем повторные клики
        if (isNavigating) return

        if (progress >= 100) {
            if (confirm("Курс завершён! Сбросить прогресс и начать сначала?")) {
                try {
                    setIsNavigating(true)
                    await apiFetch(`/courses/${courseId}/reset`, {
                        method: "PATCH",
                    })

                    sessionStorage.removeItem(`selected_workouts_${courseId}`)
                    sessionStorage.removeItem(`course_${courseId}`)

                    await fetchMyCourses(true)
                } catch (err) {
                    console.error("Ошибка сброса прогресса:", err)
                    alert("Не удалось сбросить прогресс")
                } finally {
                    setIsNavigating(false)
                }
            }
        } else if (hasProgress) {
            setIsNavigating(true)
            await openNextIncompleteWorkout(courseId)
            setIsNavigating(false)
        } else {
            setSelectedCourseId(courseId)
            setShowWorkoutModal(true)
        }
    }

    // Функция для открытия следующей незавершённой тренировки
    const openNextIncompleteWorkout = async (courseId: string) => {
        try {
            const workouts = await apiFetch<Array<{ _id: string; name: string }>>(
                `/courses/${courseId}/workouts`
            )

            const progressData = await apiFetch<{
                workoutsProgress: Array<{
                    workoutId: string
                    workoutCompleted: boolean
                }>
            }>(`/users/me/progress?courseId=${courseId}`)

            const incompleteWorkout = workouts.find((workout) => {
                const workoutProgress = progressData.workoutsProgress.find(
                    (wp) => wp.workoutId === workout._id
                )
                return !workoutProgress?.workoutCompleted
            })

            const targetWorkout = incompleteWorkout || workouts[0]

            if (targetWorkout) {
                // Используем Promise и игнорируем ошибку прерывания
                router
                    .push(`/courses/${courseId}/workouts?selected=${targetWorkout._id}`)
                    .catch((err) => {
                        // Игнорируем ошибку прерывания маршрута
                        if (err instanceof Error && !err.message.includes("Abort")) {
                            console.error("Ошибка перехода:", err)
                        }
                    })
            }
        } catch (err) {
            console.error("Ошибка поиска следующей тренировки:", err)
            setSelectedCourseId(courseId)
            setShowWorkoutModal(true)
        }
    }

    const handleRemoveCourse = async (courseId: string) => {
        // Сбрасываем кастомный курсор сразу при клике
        setShowCustomCursor(false)

        try {
            await apiFetch(`/users/me/courses/${courseId}`, {
                method: "DELETE",
            })

            setCourses(courses.filter((c) => c._id !== courseId))

            setToast({
                message: "Курс удалён из профиля",
                type: "success",
            })
            setTimeout(() => setToast(null), 3000)
        } catch (err) {
            if (err instanceof Error && err.message.includes("не был добавлен")) {
                setCourses(courses.filter((c) => c._id !== courseId))

                setToast({
                    message: "Курс удалён из профиля",
                    type: "success",
                })
                setTimeout(() => setToast(null), 3000)
                return
            }

            console.error("Ошибка удаления курса:", err)

            setToast({
                message: "Не удалось удалить курс",
                type: "error",
            })
            setTimeout(() => setToast(null), 3000)
        }
    }

    // Кастомный курсор — с защитой от мобильных
    const handleMouseEnter = () => {
        if (hasHover) setShowCustomCursor(true)
    }
    const handleMouseLeave = () => {
        if (hasHover) setShowCustomCursor(false)
    }

    useEffect(() => {
        if (!hasHover) return

        const handleMouseMove = (e: MouseEvent) => {
            setCursorPos({
                x: e.clientX,
                y: e.clientY,
            })
        }

        window.addEventListener("mousemove", handleMouseMove)
        return () => window.removeEventListener("mousemove", handleMouseMove)
    }, [hasHover])

    if (loading) {
        return <div className={styles.loading}>Загрузка курсов...</div>
    }

    if (courses.length === 0) {
        return (
            <div className={styles.empty}>
                <p className={styles.empty__text}>У вас пока нет добавленных курсов</p>

                <Link href="/" className={`${styles.empty__btn} btn-primary`}>
                    Выбрать курс
                </Link>
            </div>
        )
    }

    return (
        <>
            <div className={styles.myCourses}>
                {courses.map((course) => {
                    const progress = course.progress || 0
                    const title = course.nameRU || course.title || course.name || "Курс"
                    const bgImage =
                        course.imageBG ||
                        course.image ||
                        COURSE_IMAGES[title] ||
                        COURSE_IMAGES[title.split(" ")[0]] ||
                        "/img/1-yoga.jpg"

                    // Получаем класс для позиционирования фона
                    const bgClass = getCourseBgClass(title)

                    return (
                        <article key={course._id} className={courseStyles.cards__course}>
                            <div
                                className={`${courseStyles.cards__bg} ${bgClass}`}
                                style={{
                                    backgroundImage: `url("${bgImage}")`,
                                }}
                            >
                                <button
                                    className={courseStyles.cards__btnAddCourse}
                                    aria-label="Удалить курс"
                                    onClick={() => handleRemoveCourse(course._id)}
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
                                    <h3 className={courseStyles.cards__name}>{title}</h3>
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
                                        {course.dailyDurationInMinutes?.from || 20}-
                                        {course.dailyDurationInMinutes?.to || 50} мин/день
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
                                            course.hasProgress || false
                                        )
                                    }
                                    disabled={isNavigating}
                                >
                                    {isNavigating
                                        ? "Загрузка..."
                                        : progress >= 100
                                          ? "Начать снова"
                                          : course.hasProgress
                                            ? "Продолжить"
                                            : "Начать тренировки"}
                                </button>
                            </div>
                        </article>
                    )
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
                        setShowWorkoutModal(false)
                        setSelectedCourseId(null)
                    }}
                />
            )}

            {/* Toast уведомление */}
            {toast && (
                <Toast
                    key={toast.message}
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
        </>
    )
}
