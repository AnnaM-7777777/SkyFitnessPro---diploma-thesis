import Image from "next/image"
import { useEffect } from "react"
import styles from "./ModalUniversalNotifications.module.css"

export type ModalType = "confirm" | "success" | "error" | "info"

export interface ModalProps {
    type?: ModalType
    title: string
    message?: string
    confirmText?: string
    cancelText?: string
    onConfirm?: () => void
    onCancel?: () => void
    onClose?: () => void
    autoClose?: number
    icon?: string
}

export default function Modal({
    type = "confirm",
    title,
    message,
    confirmText = "Подтвердить",
    cancelText = "Отмена",
    onConfirm,
    onCancel,
    onClose,
    autoClose,
    icon,
}: ModalProps) {
    useEffect(() => {
        if (autoClose && onClose) {
            const timer = setTimeout(() => {
                onClose()
            }, autoClose)
            return () => clearTimeout(timer)
        }
    }, [autoClose, onClose])

    const handleOverlayClick = () => {
        if (onClose) onClose()
    }

    const handleModalClick = (e: React.MouseEvent) => {
        e.stopPropagation()
    }

    // Иконки по умолчанию для разных типов
    const defaultIcons: Record<ModalType, string> = {
        success: "/img/checkmark.svg",
        error: "/img/error.svg",
        info: "/img/info.svg",
        confirm: "",
    }

    // Используем кастомную иконку или дефолтную
    const currentIcon = icon || defaultIcons[type]

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal} onClick={handleModalClick}>
                {/* Уведомление успеха / ошибки / инфо */}
                {type !== "confirm" && (
                    <div className={styles.successModal}>
                        <h2 className={styles.successModal__title}>{title}</h2>
                        
                        <Image src={currentIcon} alt={type} width={57} height={57} priority />
                    </div>
                )}

                {/* Уведомление подтверждения действия */}
                {type === "confirm" && (
                    <div className={styles.confirmModal}>
                        <h2 className={styles.confirmModal__title}>{title}</h2>

                        {message && <p className={styles.confirmModal__message}>{message}</p>}

                        <div className={styles.confirmModal__buttons}>
                            {onCancel && (
                                <button
                                    className={`${styles.buttons__cancelBtn} btn-secondary`}
                                    onClick={onCancel}
                                >
                                    {cancelText}
                                </button>
                            )}

                            {onConfirm && (
                                <button
                                    className={`${styles.buttons__confirmBtn} btn-primary`}
                                    onClick={onConfirm}
                                >
                                    {confirmText}
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
