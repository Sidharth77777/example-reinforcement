export default function OverView() {
  return (
    <section className="w-full mt-10 bg-white py-20 px-4 sm:px-6">

      <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-12 items-center">

        {/* TEXT CONTENT */}
        <div className="space-y-6 text-center md:text-left">

          <h2 className="text-3xl sm:text-4xl font-bold">
            Live Dashboard Overview
          </h2>

          <ul className="space-y-3 text-gray-600 text-base sm:text-lg">

            <li className="flex items-center justify-center md:justify-start gap-3">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Monitor Waste in Real Time
            </li>

            <div className="flex-1 h-[1px] bg-gray-300 max-w-[500]" />

            <li className="flex items-center justify-center md:justify-start gap-3">
              <span className="w-2 h-2 bg-gray-400 rounded-full"></span>
              Analyze Sorting Data
            </li>

          </ul>

        </div>

        {/* IMAGE CONTAINER */}
        <div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center">

          {/* IMAGE WILL GO HERE */}

          {/*
          <Image
            src="/dashboard.png"
            alt="Dashboard Preview"
            fill
            className="object-cover"
          />
          */}

        </div>

      </div>

    </section>
  )
}