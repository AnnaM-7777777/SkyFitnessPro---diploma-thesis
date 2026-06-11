import Profile from "@/components/Profile/Profile";
import Header from "@/components/Header/Header";
import MyCourses from "@/components/MyCourses/MyCourses";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
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
