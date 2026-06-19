import { useRouter } from "next/router"
import { useEffect, useState, useMemo } from "react"
import Layout from "@/components/Layout/Layout"
import { useAuth } from "../../context/AuthContext"
import { apiFetch } from "@/libs/apiConfig"
import { MOCK_COURSES } from "@/libs/mockCourses"
import type { Course } from "@/types/course"
import styles from "./CoursePage.module.css"
import Image from "next/image"
import Link from "next/link"
import Toast from "@/components/Toast/Toast"
import CoursePageSkeleton from "@/components/SkeletonComponents/CoursePageSkeleton"

type UserData = {
    email: string
    selectedCourses: string[]
}

// Определяем тему по названию курса
const getCourseThemeByTitle = (title: string) => {
    const lowerTitle = title.toLowerCase()

    if (lowerTitle.includes("йог")) {
        return {
            image: "/img/1-yoga.jpg",
            color: "rgba(255, 199, 0, 1)",
            backgroundSize: "auto 220%",
            backgroundPosition: "center -230px",
            mobileClass: styles.header__image_yoga,
        }
    }
    if (lowerTitle.includes("стретч") || lowerTitle.includes("растяж")) {
        return {
            image: "/img/2-stretching.jpg",
            color: "rgba(36, 145, 210, 1)",
            backgroundSize: "auto 175%",
            backgroundPosition: "right 0",
            mobileClass: styles.header__image_stretching,
        }
    }
    if (lowerTitle.includes("фитнес") || lowerTitle.includes("fitness")) {
        return {
            image: "/img/3-fitness.jpg",
            color: "rgba(247, 160, 18, 1)",
            backgroundSize: "auto 250%",
            backgroundPosition: "center -35px",
            mobileClass: styles.header__image_fitness,
        }
    }
    if (lowerTitle.includes("аэроб") || lowerTitle.includes("aerob")) {
        return {
            image: "/img/4-aerobics.jpg",
            color: "rgba(255, 126, 101, 1)",
            backgroundSize: "auto 350%",
            backgroundPosition: "right -720px",
            mobileClass: styles.header__image_aerobics,
        }
    }
    if (lowerTitle.includes("бодифлекс") || lowerTitle.includes("bodyflex")) {
        return {
            image: "/img/5-bodyflex.jpg",
            color: "rgba(125, 69, 140, 1)",
            backgroundSize: "auto 165%",
            backgroundPosition: "center -165px",
            mobileClass: styles.header__image_bodyflex,
        }
    }

    return {
        image: "/img/1-yoga.jpg",
        color: "rgba(255, 199, 0, 1)",
        backgroundSize: "auto 220%",
        backgroundPosition: "center -230px",
        mobileClass: styles.header__image_yoga,
    }
}

export default function CoursePage() {
    const router = useRouter()
    const { id } = router.query
    const { user, token } = useAuth()
    const [course, setCourse] = useState<Course | null>(null)
    const [loading, setLoading] = useState(true)
    const [isAdded, setIsAdded] = useState(false)
    const [toast, setToast] = useState<{
        message: string
        type: "error" | "success"
    } | null>(null)

    // Вычисляем courseId один раз через useMemo
    const courseId = useMemo(() => {
        if (!id) return ""
        return Array.isArray(id) ? id[0] : id
    }, [id])

    // 1. Загрузка данных курса
    useEffect(() => {
        if (!courseId) return

        const fetchCourse = async () => {
            try {
                const data = await apiFetch(`/courses/${courseId}`)
                setCourse(data as Course)
            } catch {
                const mock = MOCK_COURSES.find((c) => c._id === courseId || c.id === courseId)
                if (mock) setCourse(mock as Course)
            } finally {
                setLoading(false)
            }
        }

        fetchCourse()
    }, [courseId])

    // 2. ПРОВЕРКА: Добавлен ли курс при загрузке страницы
    useEffect(() => {
        if (!token || !courseId) return

        const checkIfAdded = async () => {
            try {
                const response = await apiFetch<{ user: UserData }>("/users/me")
                const userData = response.user
                const isCourseAdded = userData.selectedCourses?.includes(courseId)
                setIsAdded(isCourseAdded)
            } catch (err) {
                console.error("Ошибка проверки курса:", err)
            }
        }

        checkIfAdded()
    }, [token, courseId])

    // 3. Добавление курса
    const handleAddCourse = async () => {
        if (!user) {
            router.push(`/?modal=login`, undefined, { shallow: true })
            return
        }

        try {
            await apiFetch("/users/me/courses", {
                method: "POST",
                body: JSON.stringify({ courseId }),
            })

            setIsAdded(true)

            setToast({
                message: "Курс успешно добавлен!",
                type: "success",
            })
            setTimeout(() => setToast(null), 3000)
        } catch (err: unknown) {
            if (err instanceof Error && err.message.includes("уже был добавлен")) {
                setIsAdded(true)
                return
            }

            console.error("Ошибка добавления курса:", err)

            setToast({
                message: "Не удалось добавить курс",
                type: "error",
            })
            setTimeout(() => setToast(null), 3000)
        }
    }

   if (loading) {
    return (
        <Layout showTitle={true} showScrollToTop={true}>
            <CoursePageSkeleton />
        </Layout>
    )
}

    if (!course) {
        return (
            <Layout showTitle={true} showScrollToTop={true}>
                <div className={styles.notFound}>
                    <p className={styles.notFound__text}>Курс не найден </p>

                    <Link href="/" className={`${styles.notFound__btn} btn-primary`}>
                        ← На главную
                    </Link>
                </div>
            </Layout>
        )
    }

    const title = course.nameRU || course.title || course.name || "Курс"

    const {
        image: courseImage,
        color: courseColor,
        backgroundSize,
        backgroundPosition,
        mobileClass,
    } = getCourseThemeByTitle(title)

    return (
        <Layout showTitle={true} showScrollToTop={true}>
            <div className={styles.page}>
                {/* Шапка курса */}
                <section className={styles.header} style={{ backgroundColor: courseColor }}>
                    <div className={styles.header__content}>
                        <h1 className={styles.header__title}>{title}</h1>
                    </div>

                    <div
                        className={`${styles.header__image} ${mobileClass}`}
                        style={{
                            backgroundImage: `url(${courseImage})`,
                            backgroundSize: backgroundSize || "cover",
                            backgroundPosition: backgroundPosition || "center top",
                            backgroundRepeat: "no-repeat",
                        }}
                    />
                </section>

                {/* Описание курса */}
                <section className={styles.description}>
                    <p className={styles.description__info}>
                        <span className={styles.description__boldedTerm}>{title} – </span>
                        {course.description || "Описание курса будет здесь"}
                    </p>
                </section>

                {/* Блок "Подойдет для вас, если" */}
                <section className={styles.conditions}>
                    <h2 className={styles.conditions__title}>Подойдет для вас, если:</h2>

                    <div className={styles.conditions__block}>
                        <div className={styles.condition}>
                            <span className={styles.condition__number}>1</span>

                            <p className={styles.condition__description}>
                                Давно хотели попробовать, но не решались начать
                            </p>
                        </div>

                        <div className={styles.condition}>
                            <span className={styles.condition__number}>2</span>
                            <p className={styles.condition__description}>
                                Хотите укрепить тело и улучшить самочувствие
                            </p>
                        </div>

                        <div className={styles.condition}>
                            <span className={styles.condition__number}>3</span>
                            <p className={styles.condition__description}>
                                Ищете активность для тела и души
                            </p>
                        </div>
                    </div>
                </section>

                {/* Направления */}
                {course.directions?.length && (
                    <section className={styles.directions}>
                        <h2 className={styles.directions__title}>Направления</h2>

                        <div className={styles.directions__block}>
                            {course.directions.map((dir, i) => (
                                <div key={i} className={styles.direction}>
                                    <svg
                                        className={styles.direction__span}
                                        width="20"
                                        height="20"
                                        viewBox="0 0 20 20"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                    >
                                        <path
                                            d="M9.21373 1.11751C9.3702 0.454433 9.44843 0.122896 9.57424 0.0482295C9.68259 -0.0160765 9.81741 -0.0160765 9.92576 0.0482295C10.0516 0.122896 10.1298 0.454434 10.2863 1.11751L11.0497 4.35302C11.3337 5.55636 11.4757 6.15803 11.7843 6.64596C12.0571 7.07744 12.4226 7.44285 12.854 7.71574C13.342 8.02432 13.9436 8.1663 15.147 8.45025L18.3825 9.21373C19.0456 9.3702 19.3771 9.44843 19.4518 9.57424C19.5161 9.68259 19.5161 9.81741 19.4518 9.92576C19.3771 10.0516 19.0456 10.1298 18.3825 10.2863L15.147 11.0497C13.9436 11.3337 13.342 11.4757 12.854 11.7843C12.4226 12.0571 12.0571 12.4226 11.7843 12.854C11.4757 13.342 11.3337 13.9436 11.0497 15.147L10.2863 18.3825C10.1298 19.0456 10.0516 19.3771 9.92576 19.4518C9.81741 19.5161 9.68259 19.5161 9.57424 19.4518C9.44843 19.3771 9.3702 19.0456 9.21373 18.3825L8.45025 15.147C8.1663 13.9436 8.02432 13.342 7.71574 12.854C7.44285 12.4226 7.07744 12.0571 6.64596 11.7843C6.15803 11.4757 5.55636 11.3337 4.35301 11.0497L1.11751 10.2863C0.454433 10.1298 0.122896 10.0516 0.0482295 9.92576C-0.0160765 9.81741 -0.0160765 9.68259 0.0482295 9.57424C0.122896 9.44843 0.454434 9.3702 1.11751 9.21373L4.35302 8.45025C5.55636 8.1663 6.15803 8.02432 6.64596 7.71574C7.07744 7.44285 7.44285 7.07744 7.71574 6.64596C8.02432 6.15803 8.1663 5.55636 8.45025 4.35301L9.21373 1.11751Z"
                                            fill="black"
                                        />
                                    </svg>

                                    <p className={styles.direction__text}>{dir}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* CTA-блок с бегуном */}
                <section className={styles.cta}>
                    <div className={styles.cta__content}>
                        <h2 className={styles.cta__title}>Начните путь к новому телу</h2>

                        <ul className={styles.cta__benefits}>
                            {(course.benefits?.length
                                ? course.benefits
                                : [
                                      "проработка всех групп мышц",
                                      "тренировка суставов",
                                      "улучшение циркуляции крови",
                                      "упражнения заряжают бодростью",
                                      "помогают противостоять стрессам",
                                  ]
                            ).map((benefit, i) => (
                                <li key={i}>{benefit}</li>
                            ))}
                        </ul>

                        {!user ? (
                            <button
                                onClick={handleAddCourse}
                                className={`${styles.cta__btn} btn-primary`}
                            >
                                Войдите, чтобы добавить курс
                            </button>
                        ) : isAdded ? (
                            <button disabled className={`${styles.cta__btn} btn-primary`}>
                                Курс уже добавлен ✓
                            </button>
                        ) : (
                            <button
                                onClick={handleAddCourse}
                                className={`${styles.cta__btn} btn-primary`}
                            >
                                Добавить курс
                            </button>
                        )}
                    </div>

                    {/* Блок с бегуном */}
                    <div className={styles.cta__images}>
                        <Image
                            src="/img/runner.png"
                            alt="Бегун"
                            width={487}
                            height={543}
                            priority
                            className={`${styles.cta__img} ${styles.img1}`}
                        />

                        <svg
                            width="629"
                            height="467"
                            viewBox="0 0 629 420"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`${styles.cta__img} ${styles.img2}`}
                        >
                            <path
                                d="M499.782 388.796C943.782 -230.705 47.9024 39.5477 24.1395 237.96C18.5256 284.834 82.2022 298.667 177.705 277.697C273.208 256.727 -131.258 411.114 54.5178 439.481"
                                stroke="#C6FF00"
                                strokeWidth="10.1395"
                            />
                        </svg>

                        <svg
                            width="54"
                            height="47"
                            viewBox="0 0 54 47"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            className={`${styles.cta__img} ${styles.img3}`}
                        >
                            <path
                                d="M2.82886 45.271C5.82886 36.771 20.0289 16.371 52.8289 2.771"
                                stroke="black"
                                strokeWidth="6"
                            />
                        </svg>
                    </div>
                </section>

                {/* Toast в конце */}
                {toast && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        onClose={() => setToast(null)}
                    />
                )}
            </div>
        </Layout>
    )
}
