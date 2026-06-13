import Image from "next/image";
import { useEffect } from "react";
import styles from "./SuccessModal.module.css";

interface SuccessModalProps {
    onClose: () => void;
}

export default function SuccessModal({ onClose }: SuccessModalProps) {
    // Автозакрытие через 2 секунды
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 2000);

        // Очищаем таймер при размонтировании
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.icon}>
                    <h2 className={styles.title}>Ваш прогресс засчитан!</h2>
                    <Image
                        src="/img/checkmark.svg"
                        alt=""
                        width={57}
                        height={57}
                        priority
                    />
                </div>
            </div>
        </div>
    );
}
