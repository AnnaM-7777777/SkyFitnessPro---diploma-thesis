import { useEffect, useState } from "react";
import styles from "./Toast.module.css";

interface ToastProps {
    message: string;
    type?: "error" | "success" | "info";
    onClose: () => void;
    duration?: number;
}

export default function Toast({
    message,
    type = "error",
    onClose,
    duration = 3000,
}: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Анимация появления
        setTimeout(() => setIsVisible(true), 10);

        // Автоматическое закрытие
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
        }, duration);

        return () => clearTimeout(timer);
    }, [duration]);

    return (
        <div
            className={`${styles.toast} ${styles[`toast__${type}`]} ${isVisible ? styles.toast_visible : ""}`}
        >
            <span className={styles.toast__message}>{message}</span>
        </div>
    );
}
