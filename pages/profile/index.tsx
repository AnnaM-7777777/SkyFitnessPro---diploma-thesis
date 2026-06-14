import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Profile from "@/components/Profile/Profile";
import Header from "@/components/Header/Header";
import MyCourses from "@/components/MyCourses/MyCourses";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
    const router = useRouter();
    const { token, isLoading } = useAuth();

    // replace вместо push
    useEffect(() => {
        if (!isLoading && !token) {
            router.replace("/?modal=login");
        }
    }, [isLoading, token, router]);

    // Разделяем состояния для лучшего UX
    if (isLoading) {
        return (
            <div className={styles.profilePage}>
                <Header showTitle={false} />
                <div className={styles.loading}>Загрузка...</div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className={styles.profilePage}>
                <Header showTitle={false} />
                <div className={styles.loading}>Перенаправление...</div>
            </div>
        );
    }

    return (
        <div className={styles.profilePage}>
            <Header showTitle={false} />

            <main className={styles.profilePage__content}>
                <h2 className={styles.profilePage__title}>Профиль</h2>
                <Profile />

                <h2 className={styles.profilePage__title}>Мои курсы</h2>
                <MyCourses />
            </main>
        </div>
    );
}
