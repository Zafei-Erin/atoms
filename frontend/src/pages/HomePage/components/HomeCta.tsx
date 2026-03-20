import { useRef, useState, useEffect } from "react";
import { ChevronLeftIcon, ChevronRightIcon, ArrowBendIcon } from "../../../icons";
import { BUILD_CATEGORIES } from "../data/buildCategories";

// Shared chip style helpers
const chipBase: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "5px 12px",
  fontSize: "12.5px",
  borderRadius: "999px",
  whiteSpace: "nowrap",
  cursor: "pointer",
  flexShrink: 0,
  transition: "background 0.15s, box-shadow 0.15s",
};

const chipDefault: React.CSSProperties = {
  ...chipBase,
  border: "1px solid #d1d5db",
  background: "transparent",
  color: "#4b5563",
};

interface HomeCtaProps {
  onIdeaClick?: (prompt: string) => void;
}

export function HomeCta({ onIdeaClick }: HomeCtaProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [showLeftBtn, setShowLeftBtn] = useState(false);
  const [showRightBtn, setShowRightBtn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const checkScroll = () => {
    if (trackRef.current) {
      const { scrollLeft, clientWidth, scrollWidth } = trackRef.current;
      setShowLeftBtn(scrollLeft > 0);
      setShowRightBtn(
        scrollWidth > clientWidth && scrollLeft + clientWidth < scrollWidth - 1,
      );
    }
  };

  useEffect(() => {
    const track = trackRef.current;
    if (track) {
      checkScroll();
      track.addEventListener("scroll", checkScroll);
      window.addEventListener("resize", checkScroll);

      return () => {
        track.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, []);

  const scrollLeft = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: -200, behavior: "smooth" });
    }
  };

  const scrollRight = () => {
    if (trackRef.current) {
      trackRef.current.scrollBy({ left: 200, behavior: "smooth" });
    }
  };

  const scrollButtonStyle = {
    width: "24px",
    height: "24px",
    background: "white",
    border: "1px solid #e5e7eb",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    color: "#6b7280",
    cursor: "pointer",
  };

  const activeCategory = BUILD_CATEGORIES.find(
    (c) => c.label === selectedCategory,
  );

  return (
    <div className="w-full pt-3 flex flex-col gap-3">
      {/* What to build */}
      <div className="flex flex-col gap-1.5">
        <p className="text-xs">What would you like to build?</p>
        <div className="relative" style={{ overflow: "hidden" }}>
          {/* Scrollable track */}
          <div
            ref={trackRef}
            className="flex items-center gap-2"
            style={{
              overflowX: "auto",
              paddingBottom: "2px",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {BUILD_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat.label;
              return (
                <div
                  key={cat.label}
                  style={{
                    ...chipDefault,
                    ...(isSelected
                      ? {
                          background: "#111827",
                          borderColor: "#111827",
                          color: "white",
                        }
                      : {}),
                  }}
                  onClick={() =>
                    setSelectedCategory(isSelected ? null : cat.label)
                  }
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "white";
                      e.currentTarget.style.boxShadow =
                        "0 1px 3px rgba(0,0,0,0.08)";
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = "transparent";
                      e.currentTarget.style.boxShadow = "none";
                    }
                  }}
                >
                  <span
                    style={{
                      color: isSelected ? "white" : "#9ca3af",
                      display: "flex",
                    }}
                  >
                    {cat.icon}
                  </span>
                  <span>{cat.label}</span>
                </div>
              );
            })}
          </div>

          {/* Left fade + arrow button */}
          {showLeftBtn && (
            <div
              className="absolute left-0 top-0 bottom-0.5 flex items-center pointer-events-none"
              style={{
                width: "48px",
                background: "linear-gradient(to left, transparent, #f4f4f4)",
              }}
            >
              <button
                onClick={scrollLeft}
                className="pointer-events-auto flex items-center justify-center rounded-full"
                style={scrollButtonStyle}
              >
                <ChevronLeftIcon size={12} />
              </button>
            </div>
          )}

          {/* Right fade + arrow button */}
          {showRightBtn && (
            <div
              className="absolute right-0 top-0 bottom-0.5 flex items-center justify-end pointer-events-none"
              style={{
                width: "48px",
                background: "linear-gradient(to right, transparent, #f4f4f4)",
              }}
            >
              <button
                onClick={scrollRight}
                className="pointer-events-auto flex items-center justify-center rounded-full"
                style={scrollButtonStyle}
              >
                <ChevronRightIcon size={12} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Explore ideas — only shown after a category is selected */}
      {activeCategory && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs">Explore ideas</p>
          <div className="flex items-center gap-2 flex-wrap">
            {activeCategory.ideas.map((idea) => (
              <div
                key={idea.title}
                style={chipDefault}
                onClick={() => onIdeaClick?.(idea.content)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "white";
                  e.currentTarget.style.boxShadow =
                    "0 1px 3px rgba(0,0,0,0.08)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <span>{idea.title}</span>
                <span
                  style={{ color: "#9ca3af", display: "flex", flexShrink: 0 }}
                >
                  <ArrowBendIcon />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
