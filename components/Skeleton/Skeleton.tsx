import styles from "./Skeleton.module.css"
import { CSSProperties } from "react"

interface SkeletonProps {
    width?: string | number
    height?: string | number
    borderRadius?: string | number
    className?: string
    style?: CSSProperties
}

export default function Skeleton({
    width,
    height,
    borderRadius,
    className = "",
    style = {},
}: SkeletonProps) {
    return (
        <div
            className={`${styles.skeleton} ${className}`}
            style={
                {
                    width: String(width),
                    height: String(height),
                    borderRadius: String(borderRadius),
                    ...style,
                } as CSSProperties
            }
        />
    )
}
