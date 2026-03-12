import { Camera, Brain, Cog, Trash2, ArrowRight, ArrowDown } from "lucide-react"

export default function HowItWorks() {
  const steps = [
    {
      icon: Camera,
      title: "Camera Scans Waste",
      description: "Camera detects waste types",
    },
    {
      icon: Brain,
      title: "AI Identifies Material",
      description: "AI analyzes waste material",
    },
    {
      icon: Cog,
      title: "Smart Sorting Mechanism",
      description: "Automated sorting process",
    },
    {
      icon: Trash2,
      title: "Sorted Into Bins",
      description: "Waste placed in correct bins",
    },
  ]

  return (
    <section className="w-full bg-gray-50 py-20 px-4">

      {/* TITLE WITH LINES */}
      <div className="flex items-center justify-center gap-4 mb-16">
        <div className="flex-1 h-[1px] bg-gray-300 max-w-[300]" />
        <h2 className="text-2xl md:text-3xl font-semibold text-center">
          How It Works
        </h2>
        <div className="flex-1 h-[1px] bg-gray-300 max-w-[300]" />
      </div>

      {/* STEPS */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-10">

        {steps.map((step, index) => {
          const Icon = step.icon

          return (
            <div
              key={index}
              className="flex flex-col md:flex-row items-center gap-6"
            >

              {/* STEP CARD */}
              <div className="flex flex-col items-center text-center max-w-[200px]">

                <div className="w-16 h-16 bg-white shadow-md rounded-xl flex items-center justify-center mb-4">
                  <Icon size={30} />
                </div>

                <h3 className="font-semibold text-lg">
                  {step.title}
                </h3>

                <p className="text-sm text-gray-600 mt-1">
                  {step.description}
                </p>

              </div>

              {/* DESKTOP ARROW */}
              {index !== steps.length - 1 && (
                <ArrowRight
                  className="hidden md:block text-gray-400"
                  size={28}
                />
              )}

              {/* MOBILE ARROW */}
              {index !== steps.length - 1 && (
                <ArrowDown
                  className="md:hidden text-gray-400"
                  size={28}
                />
              )}
            </div>
          )
        })}

      </div>
    </section>
  )
}