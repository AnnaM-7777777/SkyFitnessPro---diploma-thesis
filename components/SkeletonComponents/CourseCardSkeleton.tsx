import Skeleton from "../Skeleton/Skeleton"
import styles from "./CourseCardSkeleton.module.css"

interface CourseCardSkeletonProps {
    count?: number
    showProgress?: boolean
    showButtons?: boolean
}

export default function CourseCardSkeleton({
    count = 1,
    showProgress = true,
    showButtons = true,
}: CourseCardSkeletonProps) {
    if (count > 1) {
        return Array.from({ length: count }).map((_, index) => (
            <CourseCardSkeletonItem
                key={index}
                showProgress={showProgress}
                showButtons={showButtons}
            />
        ))
    }

    return <CourseCardSkeletonItem showProgress={showProgress} showButtons={showButtons} />
}

function CourseCardSkeletonItem({
    showProgress = true,
    showButtons = true,
}: Omit<CourseCardSkeletonProps, "count">) {
    return (
        <div className={styles.cardSkeleton}>
            {/* Картинка и название курса */}
            <Skeleton
                width="100%"
                height="325px"
                borderRadius="30px"
                style={{
                    backgroundColor: "var(--bg-secondary)",
                }}
            />
            <Skeleton className={styles.cardSkeleton__title} />

            {/* Мета-информация (дни, минуты, сложность) */}
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

            {/* Прогресс-бар — заменили Fragment на div */}
            {showProgress && (
                <div>
                    <Skeleton
                        width="35%"
                        height="20px"
                        borderRadius="50px"
                        style={{
                            margin: "20px 0 10px",
                            backgroundColor: "var(--bg-secondary)",
                        }}
                    />
                    <Skeleton width="100%" height="8px" borderRadius="50px" />
                </div>
            )}

            {/* Кнопка */}
            {showButtons && (
                <Skeleton
                    width="100%"
                    height="50px"
                    borderRadius="50px"
                    style={{
                        marginTop: "40px",
                    }}
                />
            )}
        </div>
    )
}
