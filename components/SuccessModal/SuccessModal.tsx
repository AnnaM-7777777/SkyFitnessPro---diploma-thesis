import Image from "next/image";
import styles from "./SuccessModal.module.css";

interface SuccessModalProps {
    onClose: () => void;
}

export default function SuccessModal({ onClose }: SuccessModalProps) {
    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.icon}>
                    <Image
                        src="/img/checkmark.png"
                        alt=""
                        width={48}
                        height={48}
                        priority
                    />
                </div>
                <h2 className={styles.title}>Ваш прогресс засчитан!</h2>
            </div>
        </div>
    );
}