import Skeleton from "../Skeleton/Skeleton"
import styles from "./WorkoutsPageSkeleton.module.css"

export default function WorkoutsPageSkeleton() {
    return (
        <div className={styles.workoutsSkeleton}>
            <Skeleton width="30%" height="60px" borderRadius="50px" />

            {/* Блоки тренировок (обычно 2-3) */}
            <div>
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className={styles.workoutsSkeleton__workoutBlock}>
                        <Skeleton
                            width="100%"
                            borderRadius="30px"
                            style={{ aspectRatio: 16 / 9 }}
                        />

                        {/* Блок упражнений */}
                        <div className={styles.workoutsSkeleton__exercisesBlock}>
                            <Skeleton width="40%" height="35px" borderRadius="50px" />

                            {/* Список упражнений */}
                            <div className={styles.workoutsSkeleton__exercisesList}>
                                {Array.from({ length: 6 }).map((_, j) => (
                                    <div key={j} className={styles.workoutsSkeleton__progress}>
                                        <Skeleton width="100%" height="30px" borderRadius="50px" />
                                        <Skeleton width="100%" height="10px" borderRadius="50px" />
                                    </div>
                                ))}
                            </div>

                            {/* Кнопки прогресса */}
                            <Skeleton
                                width="320px"
                                height="52px"
                                borderRadius="50px"
                                className={styles.workoutsSkeleton__btn}
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
