import HeroSection from "./components/HeroSection";
import HowItWorks from "./components/HowItWorks";
import OverView from "./components/OverView";

export default function Home() {
  return (
    <div className="p-5 min-h-screen bg-[#e1e6ec]">
      <HeroSection />
      <HowItWorks />
      <OverView />
    </div>
  )
}