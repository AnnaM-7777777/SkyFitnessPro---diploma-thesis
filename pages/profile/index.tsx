import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Profile from "@/components/Profile/Profile";
import Layout from "@/components/Layout/Layout";
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
            <Layout showTitle={false}>
                <div className={styles.profilePage}>
                    <div className={styles.loading}>Загрузка...</div>
                </div>
            </Layout>
        );
    }

    if (!token) {
        return (
            <Layout showTitle={false}>
                <div className={styles.profilePage}>
                    <div className={styles.loading}>Перенаправление...</div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout showTitle={false} showScrollToTop={true}>
            <div className={styles.profilePage}>
                <main className={styles.profilePage__content}>
                    <h2 className={styles.profilePage__title}>Профиль</h2>
                    <Profile />

                    <h2 className={styles.profilePage__title}>Мои курсы</h2>
                    <MyCourses />
                </main>
            </div>
        </Layout>
    );
}
