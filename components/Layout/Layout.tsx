import { ReactNode } from "react";
import Header from "@/components/Header/Header";

interface LayoutProps {
    children: ReactNode;
    showTitle?: boolean;
}

export default function Layout({ children, showTitle = true }: LayoutProps) {
    return (
        <>
            <Header showTitle={showTitle} />
            {children}
        </>
    );
}
