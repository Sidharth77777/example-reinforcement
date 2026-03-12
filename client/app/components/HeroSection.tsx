import { Button } from "@/components/ui/button"

export default function HeroSection() {
    return (
        <div className="w-full">

            <section className="bg-gray-50 pt-16 md:pt-20 pb-28 md:pb-32 px-4 sm:px-6">

                <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

                    <div className="space-y-6 text-center md:text-left">

                        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
                            AI-Powered <br /> Waste Sorting System
                        </h1>

                        <h4 className="text-gray-600 text-base sm:text-lg max-w-lg mx-auto md:mx-0">
                            Smart Solution for Hospital Waste Management
                        </h4>

                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-2 justify-center md:justify-start">

                            <Button className="px-12 cursor-pointer py-7 bg-[#2d7b53] text-xl font-medium shadow-sm hover:shadow-md transition">
                                Get Started
                            </Button>

                            <Button
                                variant="outline"
                                className="px-12 py-7 cursor-pointer text-xl font-medium hover:bg-gray-100 transition"
                            >
                                Watch Demo
                            </Button>

                        </div>

                    </div>

                    {/* IMAGE SECTION */}
                    <div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center">

                        {/* 
            <Image
              src="/hero-image.jpg"
              alt="AI Waste Sorting"
              fill
              className="object-cover"
            />
            */}

                    </div>

                </div>

            </section>

            {/* OVERLAY SECTION */}
            <section className="relative -mt-20 md:-mt-24 z-10 px-4 sm:px-6">

                <div className="max-w-7xl mt-15 mx-auto grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">

                    {/* CARD 1 */}
                    <div className="bg-white shadow-xl rounded-2xl p-6 flex gap-4 items-center sm:items-start hover:shadow-2xl transition">

                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {/* IMAGE */}
                        </div>

                        <div>
                            <h2 className="font-semibold text-base sm:text-lg">
                                AI Detection
                            </h2>

                            <h3 className="text-gray-600 text-sm">
                                Identifies Waste Types
                            </h3>
                        </div>

                    </div>

                    {/* CARD 2 */}
                    <div className="bg-white shadow-xl rounded-2xl p-6 flex gap-4 items-center sm:items-start hover:shadow-2xl transition">

                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {/* IMAGE */}
                        </div>

                        <div>
                            <h2 className="font-semibold text-base sm:text-lg">
                                Smart Classification
                            </h2>

                            <h3 className="text-gray-600 text-sm">
                                Automatically sorts waste
                            </h3>
                        </div>

                    </div>

                    {/* CARD 3 */}
                    <div className="bg-white shadow-xl rounded-2xl p-6 flex gap-4 items-center sm:items-start hover:shadow-2xl transition">

                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            {/* IMAGE */}
                        </div>

                        <div>
                            <h2 className="font-semibold text-base sm:text-lg">
                                Safer Disposal
                            </h2>

                            <h3 className="text-gray-600 text-sm">
                                Reduces hospital contamination
                            </h3>
                        </div>

                    </div>

                </div>

            </section>

        </div>
    )
}