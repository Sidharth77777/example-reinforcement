import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";

export default function Home() {
  return (
    <div className="min-h-screen bg-black px-4 sm:py-5 py-10 sm:px-6 lg:px-10">
      <HeroSection />
      <HowItWorks />
    </div>
  );
}