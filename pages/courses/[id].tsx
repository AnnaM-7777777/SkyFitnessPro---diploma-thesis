import { useRouter } from "next/router";
import { useEffect, useState, useMemo } from "react";
import Layout from "@/components/Layout/Layout";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "@/libs/apiConfig";
import { MOCK_COURSES } from "@/libs/mockCourses";
import type { Course } from "@/types/course";
import styles from "./CoursePage.module.css";
import Image from "next/image";
import Link from "next/link";
import Toast from "@/components/Toast/Toast";

type UserData = {
    email: string;
    selectedCourses: string[];
};

// Определяем тему по названию курса
const getCourseThemeByTitle = (title: string) => {
    const lowerTitle = title.toLowerCase();

    if (lowerTitle.includes("йог")) {
        return {
            image: "/img/1-yoga-b.jpg",
            color: "rgba(255, 199, 0, 1)",
            backgroundSize: "auto 100%",
            backgroundPosition: "right",
        };
    }
    if (lowerTitle.includes("стретч") || lowerTitle.includes("растяж")) {
        return {
            image: "/img/2-stretching-b.jpg",
            color: "rgba(36, 145, 210, 1)",
            backgroundSize: "auto 100%",
            backgroundPosition: "right",
        };
    }
    if (lowerTitle.includes("фитнес") || lowerTitle.includes("fitness")) {
        return {
            image: "/img/3-fitness-b.jpg",
            color: "rgba(247, 160, 18, 1)",
            backgroundSize: "auto 100%",
            backgroundPosition: "right",
        };
    }
    if (lowerTitle.includes("аэроб") || lowerTitle.includes("aerob")) {
        return {
            image: "/img/4-aerobics-b.jpg",
            color: "rgba(255, 126, 101, 1)",
            backgroundSize: "auto 100%",
            backgroundPosition: "right",
        };
    }
    if (lowerTitle.includes("бодифлекс") || lowerTitle.includes("bodyflex")) {
        return {
            image: "/img/5-bodyflex-b.jpg",
            color: "rgba(125, 69, 140, 1)",
            backgroundSize: "auto 100%",
            backgroundPosition: "right",
        };
    }

    return {
        image: "/img/1-yoga-b.jpg",
        color: "rgba(255, 199, 0, 1)",
        backgroundSize: "auto 100%",
        backgroundPosition: "right",
    };
};

export default function CoursePage() {
    const router = useRouter();
    const { id } = router.query;
    const { user, token } = useAuth();
    const [course, setCourse] = useState<Course | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdded, setIsAdded] = useState(false);
    const [toast, setToast] = useState<{
        message: string;
        type: "error" | "success";
    } | null>(null);

    // Вычисляем courseId один раз через useMemo
    const courseId = useMemo(() => {
        if (!id) return "";
        return Array.isArray(id) ? id[0] : id;
    }, [id]);

    // 1. Загрузка данных курса
    useEffect(() => {
        if (!courseId) return;

        const fetchCourse = async () => {
            try {
                const data = await apiFetch(`/courses/${courseId}`);
                setCourse(data as Course);
            } catch {
                const mock = MOCK_COURSES.find(
                    (c) => c._id === courseId || c.id === courseId,
                );
                if (mock) setCourse(mock as Course);
            } finally {
                setLoading(false);
            }
        };

        fetchCourse();
    }, [courseId]);

    // 2. ПРОВЕРКА: Добавлен ли курс при загрузке страницы
    useEffect(() => {
        if (!token || !courseId) return;

        const checkIfAdded = async () => {
            try {
                const response = await apiFetch<{ user: UserData }>(
                    "/users/me",
                );
                const userData = response.user;
                const isCourseAdded =
                    userData.selectedCourses?.includes(courseId);
                setIsAdded(isCourseAdded || false);
            } catch (err) {
                console.error("Ошибка проверки курса:", err);
            }
        };

        checkIfAdded();
    }, [token, courseId]);

    // 3. Добавление курса
    const handleAddCourse = async () => {
        if (!user) {
            router.push(`/?modal=login`, undefined, { shallow: true });
            return;
        }

        try {
            await apiFetch("/users/me/courses", {
                method: "POST",
                body: JSON.stringify({ courseId }),
            });

            setIsAdded(true);

            setToast({
                message: "Курс успешно добавлен!",
                type: "success",
            });
            setTimeout(() => setToast(null), 3000);
        } catch (err: unknown) {
            if (
                err instanceof Error &&
                err.message.includes("уже был добавлен")
            ) {
                setIsAdded(true);
                return;
            }

            console.error("Ошибка добавления курса:", err);

            setToast({
                message: "Не удалось добавить курс",
                type: "error",
            });
            setTimeout(() => setToast(null), 3000);
        }
    };

    if (loading) {
        return (
            <Layout showTitle={true}>
                <div className={styles.loading}>
                    <p>Загрузка курса...</p>
                </div>
            </Layout>
        );
    }

    if (!course) {
        return (
            <Layout showTitle={true}>
                <div className={styles.notFound}>
                    <p>Курс не найден 😔</p>
                    <Link href="/" className="btn-primary">
                        ← На главную
                    </Link>
                </div>
            </Layout>
        );
    }

    const title = course.nameRU || course.title || course.name || "Курс";

    const {
        image: courseImage,
        color: courseColor,
        backgroundSize,
        backgroundPosition,
    } = getCourseThemeByTitle(title);

    return (
        <Layout showTitle={true}>
            <div className={styles.page}>
                {/* Шапка курса */}
                <section
                    className={styles.header}
                    style={{ backgroundColor: courseColor }}
                >
                    <div className={styles.header__content}>
                        <h1 className={styles.header__title}>{title}</h1>
                    </div>

                    <div
                        className={styles.header__image}
                        style={{
                            backgroundImage: `url(${courseImage})`,
                            backgroundSize: backgroundSize || "cover",
                            backgroundPosition:
                                backgroundPosition || "center top",
                            backgroundRepeat: "no-repeat",
                        }}
                    />
                </section>

                {/* Описание курса */}
                <section className={styles.description}>
                    <p className={styles.description__text}>
                        <span className={styles.description__title}>
                            {title} –{" "}
                        </span>
                        {course.description || "Описание курса будет здесь"}
                    </p>
                </section>

                {/* Блок "Подойдет для вас, если" */}
                <section className={styles.conditions}>
                    <h2 className={styles.title}>Подойдет для вас, если:</h2>

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
                        <h2 className={styles.title}>Направления</h2>

                        <div className={styles.directions__block}>
                            {course.directions.map((dir, i) => (
                                <div key={i} className={styles.direction}>
                                    <span className={styles.direction__span}>
                                        ⯌
                                    </span>
                                    <p className={styles.direction__text}>
                                        {dir}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* CTA-блок с бегуном */}
                <section className={styles.cta}>
                    <div className={styles.cta__content}>
                        <h2 className={styles.cta__title}>
                            Начните путь к новому телу
                        </h2>

                        {/* Исправлена проверка benefits */}
                        <ul className={styles.benefits}>
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
                            <button
                                disabled
                                className={`${styles.cta__btn} btn-primary`}
                            >
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

                    <div
                        className={styles.cta__imagesContainer}
                        style={{
                            backgroundImage: `url(/img/runner-vector.png)`,
                            backgroundSize: "auto 110%",
                            backgroundPosition: "-470px top",
                            backgroundRepeat: "no-repeat",
                        }}
                    >
                        <Image
                            src="/img/runner.png"
                            alt="Бегун"
                            width={600}
                            height={600}
                            priority
                            className={`${styles.cta__image} ${styles.img1}`}
                        />

                        <Image
                            src="/img/runner-blue.png"
                            alt="Бегун синий фон"
                            width={479}
                            height={542}
                            priority
                            className={`${styles.cta__image} ${styles.img2}`}
                        />
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
    );
}
