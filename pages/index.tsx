import { useState, useEffect } from "react"
import { useRouter } from "next/router"
import Layout from "@/components/Layout/Layout"
import CourseCard from "../components/CourseCard/CourseCard"
import type { Course } from "@/types/course"
import styles from "./indexStyle.module.css"
import Image from "next/image"
import { apiFetch } from "@/libs/apiConfig"
import { MOCK_COURSES } from "@/libs/mockCourses"
import LoginModal from "../components/Auth/LoginModal"
import RegisterModal from "../components/Auth/RegisterModal"
import Toast from "@/components/Toast/Toast"
import Skeleton from "@/components/Skeleton/Skeleton"

export default function HomePage() {
    const [courses, setCourses] = useState<Course[]>([])
    const [loading, setLoading] = useState(true)

    // Состояние для модальных окон
    const [activeModal, setActiveModal] = useState<"login" | "register" | null>(null)
    const [toast, setToast] = useState<{
        message: string
        type: "error" | "success"
    } | null>(null)
    const router = useRouter()

    // Следим за изменением параметров в адресной строке
    useEffect(() => {
        const { modal } = router.query
        if (modal === "login") setActiveModal("login")
        else if (modal === "register") setActiveModal("register")
        else setActiveModal(null)
    }, [router.query])

    // Функция закрытия модального окна
    const closeModal = () => {
        router.push("/", undefined, { shallow: true })
        setActiveModal(null)
    }

    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await apiFetch("/courses")
                setCourses(Array.isArray(data) ? data : [])
            } catch (err) {
                setCourses(MOCK_COURSES as Course[])

                // Показываем уведомление об ошибке
                setToast({
                    message: "Не удалось загрузить курсы. Показаны примеры.",
                    type: "error",
                })
                setTimeout(() => setToast(null), 3000)
            } finally {
                setLoading(false)
            }
        }
        fetchCourses()
    }, [])

    return (
        <Layout showTitle={true} showScrollToTop={true}>
            <main className={styles.homePage}>
                <section className={styles.container__text}>
                    <h1 className={styles.text__title}>
                        Начните заниматься спортом и улучшите качество жизни
                    </h1>

                    <div className={styles.text__sloganWrapper}>
                        <div className={styles.text__sloganBlock}>
                            <p className={styles.text__sloganTitle}>Измени своё тело за полгода!</p>
                            <Image
                                className={styles.text__sloganImg}
                                src="/img/sloganImg.png"
                                width={30}
                                height={35}
                                alt="SkyFitnessPro"
                                priority
                            />
                        </div>
                    </div>
                </section>

                <section className={styles.container__cards}>
                    {loading ? (
                        <>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <div key={index} className={styles.cardSkeleton}>
                                    <Skeleton className={styles.cardSkeleton__img} />
                                    <Skeleton className={styles.cardSkeleton__title} />

                                    <div
                                        style={{
                                            margin: "20px 0 6px",
                                            display: "flex",
                                            gap: "6px",
                                        }}
                                    >
                                        <Skeleton width="30%" height="38px" borderRadius="50px" />

                                        <Skeleton width="60%" height="38px" borderRadius="50px" />
                                    </div>

                                    <Skeleton width="40%" height="38px" borderRadius="50px" />
                                </div>
                            ))}
                        </>
                    ) : courses.length > 0 ? (
                        courses.map((course) => (
                            <CourseCard key={course._id || course.id} course={course} />
                        ))
                    ) : (
                        <p className={styles.emptyText}>Курсов пока нет 😔</p>
                    )}
                </section>
            </main>

            {/* Рендерим модальные окна ПОВЕРХ главной страницы */}
            {activeModal === "login" && (
                <div className={styles.modalWrapper}>
                    <LoginModal onClose={closeModal} />
                </div>
            )}
            {activeModal === "register" && (
                <div className={styles.modalWrapper}>
                    <RegisterModal onClose={closeModal} />
                </div>
            )}

            {/* Toast уведомление */}
            {toast && (
                <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
            )}
        </Layout>
    )
}
