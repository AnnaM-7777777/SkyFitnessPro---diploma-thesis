import Skeleton from "../Skeleton/Skeleton"
import styles from "./CoursePageSkeleton.module.css"

export default function CoursePageSkeleton() {
    return (
        <div className={styles.coursePageSkeleton}>
            {/* Шапка: заголовок + картинка */}
            <section className={styles.coursePageSkeleton__header}>
                <Skeleton width="25%" height="66px" borderRadius="50px" className={styles.coursePageSkeleton__title}/>
                <Skeleton width="30%" height="100%" borderRadius="30px"  className={styles.coursePageSkeleton__Bg}/>
            </section>

            {/* Описание курса */}
            <section className={styles.coursePageSkeleton__description}>
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} width="100%" height="20px" borderRadius="50px" />
                ))}
            </section>

            {/* Блок "Подойдет для вас, если" */}
            <Skeleton width="50%" height="44px" borderRadius="50px" />

            <section className={styles.coursePageSkeleton__conditions}>
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} width="33.3%" height="141px" borderRadius="30px" className={styles.coursePageSkeleton__text}/>
                ))}
            </section>

            {/* Направления */}
            <Skeleton width="40%" height="44px" borderRadius="50px" />

            <section className={styles.coursePageSkeleton__directions}>
                {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} height="26px" borderRadius="50px" />
                ))}
            </section>

            {/* CTA-блок */}
            <section className={styles.coursePageSkeleton__cta}>
                <div className={styles.coursePageSkeleton__ctaContent}>
                    {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton
                            key={i}
                            width="80%"
                            height="40px"
                            borderRadius="50px"
                            style={{
                                marginBottom: "10px",
                            }}
                        />
                    ))}

                    <div className={styles.coursePageSkeleton__info}>
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className={styles.coursePageSkeleton__text}>
                                <Skeleton width="10px" height="10px" borderRadius="50px" />
                                <Skeleton width="400px" height="20px" borderRadius="50px" />
                            </div>
                        ))}

                        <Skeleton width="100%" height="52px" borderRadius="46px" />
                    </div>
                </div>

                <Skeleton width="100%" height="100%" borderRadius="30px"  className={styles.coursePageSkeleton__img}/>
            </section>
        </div>
    )
}
