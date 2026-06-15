import { ReactNode } from "react";
import Header from "@/components/Header/Header";
import ScrollToTop from "@/components/ScrollToTop/ScrollToTop";

interface LayoutProps {
    children: ReactNode;
    showTitle?: boolean;
    showScrollToTop?: boolean;
}

export default function Layout({
    children,
    showTitle = true,
    showScrollToTop = false,
}: LayoutProps) {
    return (
        <>
            <Header showTitle={showTitle} />
            {children}
            {showScrollToTop && <ScrollToTop />}
        </>
    );
}
