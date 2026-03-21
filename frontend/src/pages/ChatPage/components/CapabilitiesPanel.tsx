import { useState } from "react";

const CAPABILITIES = [
  {
    title: "Generate images",
    description: "Alex can generate images.",
    bg: "from-indigo-200 via-purple-100 to-blue-200",
    blob1: "bg-purple-400",
    blob2: "bg-blue-400",
  },
  {
    title: "Write & debug code",
    description: "Alex can write and fix code.",
    bg: "from-emerald-100 via-teal-50 to-cyan-100",
    blob1: "bg-teal-400",
    blob2: "bg-cyan-300",
  },
  {
    title: "Build products",
    description: "Alex can scaffold entire apps.",
    bg: "from-orange-100 via-rose-50 to-pink-100",
    blob1: "bg-orange-400",
    blob2: "bg-rose-400",
  },
];

export function CapabilitiesPanel() {
  const [active, setActive] = useState(0);
  const cap = CAPABILITIES[active];

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="w-[300px] rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-[0_2px_12px_rgba(0,0,0,0.07)]">
        <div
          className={`h-[180px] bg-gradient-to-br ${cap.bg} relative overflow-hidden`}
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`size-24 rounded-full ${cap.blob1} blur-3xl opacity-40`}
            />
            <div
              className={`absolute size-14 rounded-full ${cap.blob2} blur-2xl opacity-60`}
            />
          </div>
        </div>
        <div className="px-4 py-3.5">
          <h3 className="text-[13px] font-semibold text-gray-900">
            {cap.title}
          </h3>
          <p className="text-[11px] text-gray-400 mt-0.5">{cap.description}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        {CAPABILITIES.map((cap, i) => (
          <button
            key={cap.title}
            onClick={() => setActive(i)}
            className={`rounded-full transition-all duration-300 ${
              i === active
                ? "w-5 h-1.5 bg-gray-600"
                : "size-1.5 bg-gray-300 hover:bg-gray-400"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
