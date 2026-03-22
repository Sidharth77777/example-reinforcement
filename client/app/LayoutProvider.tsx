import Footer from "./components/Footer";
import Header from "./components/Header";

export default function LayoutProvider({ children }: { children: React.ReactNode }) {
    return (
        <div className="bg-[#000]">
            <Header />

            {children}
            
            <Footer />
        </div>
    )
}