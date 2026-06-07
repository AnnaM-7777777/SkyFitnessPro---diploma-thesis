import Profile from "@/components/Profile/Profile";
import Header from "@/components/Header/Header";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
    return (
        <div className={styles.profilePage}>
            <Header />
            <h2>Профиль</h2>
            <Profile />

            <h2>Мои курсы</h2>
            
            <section>
                
            </section>
        </div>
    );
}