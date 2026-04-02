import { useEffect, useRef, useState } from "react";

export function LineAdjustmentCarousel({
  adjustments,
  points,
  baseLine,
  selectedAdjustment,
  onSelect,
  betType,
  direction,
}) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Determine if this is an Over/Under bet
  const isOverUnder =
    betType === "over_under" || betType === "over" || betType === "under";

  // Format line value based on bet type
  const formatLineValue = (value) => {
    if (isOverUnder) {
      // Remove leading "+" for totals - just show the number
      return value.toFixed(1).replace(/^\+/, "");
    }
    // Keep "+" for spreads
    return (value > 0 ? "+" : "") + value.toFixed(1);
  };

  // Check scroll position and update arrow states
  const updateScrollArrows = () => {
    if (!scrollContainerRef.current) return;

    const container = scrollContainerRef.current;
    const { scrollLeft, scrollWidth, clientWidth } = container;

    setCanScrollLeft(scrollLeft > 10); // 10px threshold to avoid floating point issues
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  // Scroll to selected item on mount or when selection changes
  useEffect(() => {
    if (scrollContainerRef.current && selectedAdjustment !== null) {
      const selectedIndex = adjustments.indexOf(selectedAdjustment);
      if (selectedIndex !== -1) {
        const container = scrollContainerRef.current;
        const selectedCard = container.children[selectedIndex];
        if (selectedCard) {
          // Center the selected card
          const containerWidth = container.offsetWidth;
          const cardWidth = selectedCard.offsetWidth;
          const scrollLeft =
            selectedCard.offsetLeft - containerWidth / 2 + cardWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior: "smooth" });
        }
      }
    }
  }, [selectedAdjustment, adjustments]);

  // Update arrow states on mount and scroll
  useEffect(() => {
    updateScrollArrows();

    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", updateScrollArrows);
    window.addEventListener("resize", updateScrollArrows);

    return () => {
      container.removeEventListener("scroll", updateScrollArrows);
      window.removeEventListener("resize", updateScrollArrows);
    };
  }, [adjustments]);

  // Scroll left by one tile width
  const handleScrollLeft = () => {
    if (!scrollContainerRef.current) return;
    const tileWidth = 160 + 12; // tile width (160px) + gap (12px)
    scrollContainerRef.current.scrollBy({
      left: -tileWidth,
      behavior: "smooth",
    });
  };

  // Scroll right by one tile width
  const handleScrollRight = () => {
    if (!scrollContainerRef.current) return;
    const tileWidth = 160 + 12; // tile width (160px) + gap (12px)
    scrollContainerRef.current.scrollBy({
      left: tileWidth,
      behavior: "smooth",
    });
  };

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-black dark:text-white font-inter mb-3 px-1">
        Adjust Your Line
      </h3>

      {/* Carousel Container with Desktop Arrows */}
      <div className="relative">
        {/* Left Arrow - Desktop Only */}
        <button
          onClick={handleScrollLeft}
          disabled={!canScrollLeft}
          aria-label="Scroll left"
          className={`
            hidden md:flex
            absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10
            items-center justify-center
            w-10 h-10 rounded-full
            bg-white dark:bg-[#2A2A2A] 
            border-2 border-[#E6E6E6] dark:border-[#404040]
            shadow-lg
            transition-all duration-200
            ${
              canScrollLeft
                ? "opacity-100 hover:bg-[#F9FAFB] dark:hover:bg-[#333333] hover:border-[#D1D5DB] dark:hover:border-[#4A4A4A] cursor-pointer active:scale-95"
                : "opacity-0 pointer-events-none"
            }
          `}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-black dark:text-white"
          >
            <path
              d="M12.5 15L7.5 10L12.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {/* Scrollable Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-3 overflow-x-auto pb-4 px-1 snap-x snap-mandatory hide-scrollbar"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {adjustments.map((adj, idx) => {
            const adjustedLine = baseLine + adj;
            const pointsForAdj = points[idx];
            const isSelected = selectedAdjustment === adj;

            // Calculate the shift from the original line
            const shiftLabel =
              adj === 0
                ? "Original Line"
                : `Shift: ${adj > 0 ? "+" : ""}${adj}`;

            return (
              <button
                key={adj}
                onClick={() => onSelect(adj, adjustedLine, pointsForAdj)}
                className={`
                  flex-shrink-0 snap-center
                  w-[160px] p-4 rounded-2xl 
                  border-2 transition-all duration-200
                  active:scale-95
                  ${
                    isSelected
                      ? "border-[#4F46E5] dark:border-[#818CF8] bg-[#EEF2FF] dark:bg-[rgba(129,140,248,0.1)] shadow-lg scale-105"
                      : "border-[#E6E6E6] dark:border-[#333333] bg-white dark:bg-[#1E1E1E] hover:border-[#D1D5DB] dark:hover:border-[#404040]"
                  }
                `}
              >
                {/* Shift Label */}
                <div
                  className={`text-xs font-medium font-inter mb-2 ${
                    isSelected
                      ? "text-[#4F46E5] dark:text-[#818CF8]"
                      : "text-[#6F6F6F] dark:text-[#AAAAAA]"
                  }`}
                >
                  {shiftLabel}
                </div>

                {/* Adjusted Line - Big and Bold */}
                <div
                  className={`text-3xl font-bold font-sora mb-3 ${
                    isSelected
                      ? "text-[#4F46E5] dark:text-[#818CF8]"
                      : "text-black dark:text-white"
                  }`}
                >
                  {formatLineValue(adjustedLine)}
                </div>

                {/* Points Reward Badge */}
                <div
                  className={`
                    inline-flex items-center justify-center
                    px-3 py-1.5 rounded-full
                    ${
                      isSelected
                        ? "bg-[#16A34A] dark:bg-[#22C55E]"
                        : "bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)]"
                    }
                  `}
                >
                  <span
                    className={`text-sm font-bold font-sora ${
                      isSelected
                        ? "text-white"
                        : "text-[#16A34A] dark:text-[#40D677]"
                    }`}
                  >
                    +{pointsForAdj} pts
                  </span>
                </div>

                {/* Selection Indicator */}
                {isSelected && (
                  <div className="mt-3 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#4F46E5] dark:bg-[#818CF8]"></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Arrow - Desktop Only */}
        <button
          onClick={handleScrollRight}
          disabled={!canScrollRight}
          aria-label="Scroll right"
          className={`
            hidden md:flex
            absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10
            items-center justify-center
            w-10 h-10 rounded-full
            bg-white dark:bg-[#2A2A2A] 
            border-2 border-[#E6E6E6] dark:border-[#404040]
            shadow-lg
            transition-all duration-200
            ${
              canScrollRight
                ? "opacity-100 hover:bg-[#F9FAFB] dark:hover:bg-[#333333] hover:border-[#D1D5DB] dark:hover:border-[#4A4A4A] cursor-pointer active:scale-95"
                : "opacity-0 pointer-events-none"
            }
          `}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-black dark:text-white"
          >
            <path
              d="M7.5 15L12.5 10L7.5 5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* Scroll Hint - Mobile Only */}
      <div className="md:hidden text-center text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-2">
        ← Swipe to see more options →
      </div>

      {/* Hide scrollbar globally for this component */}
      <style jsx>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
