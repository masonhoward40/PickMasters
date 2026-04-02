import { X, Minus, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useRef } from "react";

/**
 * Modal for adjusting the line after initial selection
 * Mobile: Horizontal carousel/slider interface
 * Desktop: +/- buttons + carousel
 */
export function LineAdjustmentModal({
  isOpen,
  onClose,
  onConfirm,
  marketType, // "spread" or "total"
  selectedSide, // team name or "Over"/"Under"
  originalLine,
  adjustments, // array of adjustment values
  pointsArray, // array of points corresponding to adjustments
  gameInfo, // { awayTeam, homeTeam, gameDate }
}) {
  const [selectedAdjustmentIndex, setSelectedAdjustmentIndex] = useState(
    Math.floor(adjustments.length / 2),
  ); // Default to middle (0 adjustment)

  const carouselRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Reset to middle when modal opens
  useEffect(() => {
    if (isOpen) {
      const middleIndex = Math.floor(adjustments.length / 2);
      setSelectedAdjustmentIndex(middleIndex);

      // Scroll carousel to center on the middle option
      setTimeout(() => {
        if (carouselRef.current) {
          const itemWidth =
            carouselRef.current.scrollWidth / adjustments.length;
          carouselRef.current.scrollLeft =
            itemWidth * middleIndex -
            carouselRef.current.clientWidth / 2 +
            itemWidth / 2;
        }
      }, 100);
    }
  }, [isOpen, adjustments.length]);

  // Scroll carousel when selection changes
  useEffect(() => {
    if (carouselRef.current && isOpen) {
      const itemWidth = carouselRef.current.scrollWidth / adjustments.length;
      const scrollPosition =
        itemWidth * selectedAdjustmentIndex -
        carouselRef.current.clientWidth / 2 +
        itemWidth / 2;
      carouselRef.current.scrollTo({
        left: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [selectedAdjustmentIndex, adjustments.length, isOpen]);

  if (!isOpen) return null;

  const currentAdjustment = adjustments[selectedAdjustmentIndex];
  const adjustedLine = originalLine + currentAdjustment;
  const pointsAwarded = pointsArray[selectedAdjustmentIndex];

  const canDecrease = selectedAdjustmentIndex > 0;
  const canIncrease = selectedAdjustmentIndex < adjustments.length - 1;

  const handleDecrease = () => {
    if (canDecrease) {
      setSelectedAdjustmentIndex(selectedAdjustmentIndex - 1);
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      setSelectedAdjustmentIndex(selectedAdjustmentIndex + 1);
    }
  };

  const handleConfirm = () => {
    onConfirm({
      adjustment: currentAdjustment,
      adjustedLine: adjustedLine,
      pointsAwarded: pointsAwarded,
    });
    onClose();
  };

  // Touch/mouse drag handlers for carousel
  const handleMouseDown = (e) => {
    setIsDragging(true);
    setStartX(e.pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - carouselRef.current.offsetLeft);
    setScrollLeft(carouselRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault();
    const x = e.pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const x = e.touches[0].pageX - carouselRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    carouselRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    snapToNearestOption();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    snapToNearestOption();
  };

  const snapToNearestOption = () => {
    if (!carouselRef.current) return;

    const itemWidth = carouselRef.current.scrollWidth / adjustments.length;
    const scrollPosition =
      carouselRef.current.scrollLeft + carouselRef.current.clientWidth / 2;
    const nearestIndex = Math.round(scrollPosition / itemWidth);
    const clampedIndex = Math.max(
      0,
      Math.min(adjustments.length - 1, nearestIndex),
    );

    setSelectedAdjustmentIndex(clampedIndex);
  };

  // Format line display (no + prefix for totals, keep + for spreads)
  const formatLine = (value) => {
    if (marketType === "total") {
      return value.toFixed(1);
    }
    return (value > 0 ? "+" : "") + value.toFixed(1);
  };

  // Find the original line index (0 adjustment)
  const originalLineIndex = adjustments.indexOf(0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-black dark:bg-opacity-70 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl max-w-md w-full shadow-2xl border border-[#E6E6E6] dark:border-[#333333] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#E6E6E6] dark:border-[#333333]">
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-black dark:text-white font-sora">
              Adjust Your Line
            </h3>
            <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-0.5 truncate">
              {gameInfo.awayTeam} @ {gameInfo.homeTeam}
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 p-2 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] rounded-lg transition-colors flex-shrink-0"
          >
            <X size={18} className="text-[#6F6F6F] dark:text-[#AAAAAA]" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {/* Your Selection */}
          <div className="mb-4">
            <div className="text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter">
              YOUR SELECTION
            </div>
            <div className="bg-[#F5F5F5] dark:bg-[#1A1A1A] rounded-xl p-3 border border-[#E6E6E6] dark:border-[#333333]">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-bold text-black dark:text-white font-sora">
                    {selectedSide}
                  </div>
                  <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter mt-0.5">
                    {marketType === "spread" ? "Spread" : "Total"}{" "}
                    {formatLine(originalLine)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    Original
                  </div>
                  <div className="text-xl font-bold text-black dark:text-white font-sora">
                    {formatLine(originalLine)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Line Adjustment */}
          <div className="mb-4">
            <div className="text-xs font-medium text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter text-center">
              ADJUST LINE
            </div>

            {/* Desktop: Show +/- buttons ONLY */}
            <div className="hidden md:block mb-4">
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleDecrease}
                  disabled={!canDecrease}
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg
                    transition-all duration-150
                    ${
                      canDecrease
                        ? "bg-[#E6E6E6] dark:bg-[#333333] hover:bg-[#D9D9D9] dark:hover:bg-[#404040] active:scale-95 text-black dark:text-white"
                        : "bg-[#F5F5F5] dark:bg-[#1A1A1A] cursor-not-allowed opacity-40 text-[#6F6F6F] dark:text-[#AAAAAA]"
                    }
                  `}
                >
                  <Minus size={20} />
                </button>

                <div className="flex-1 text-center">
                  <div className="bg-gradient-to-br from-[#4F46E5] to-[#6366F1] dark:from-[#6366F1] dark:to-[#818CF8] rounded-xl p-3">
                    <div className="text-3xl font-bold text-white font-sora">
                      {formatLine(adjustedLine)}
                    </div>
                    <div className="text-white/90 dark:text-white/80 text-xs font-inter mt-1">
                      {currentAdjustment !== 0 && (
                        <>
                          {currentAdjustment > 0 ? "+" : ""}
                          {currentAdjustment.toFixed(1)} from original
                        </>
                      )}
                      {currentAdjustment === 0 && "Original line"}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleIncrease}
                  disabled={!canIncrease}
                  className={`
                    w-12 h-12 rounded-lg flex items-center justify-center font-bold text-lg
                    transition-all duration-150
                    ${
                      canIncrease
                        ? "bg-[#E6E6E6] dark:bg-[#333333] hover:bg-[#D9D9D9] dark:hover:bg-[#404040] active:scale-95 text-black dark:text-white"
                        : "bg-[#F5F5F5] dark:bg-[#1A1A1A] cursor-not-allowed opacity-40 text-[#6F6F6F] dark:text-[#AAAAAA]"
                    }
                  `}
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Desktop Points Display */}
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border border-[#16A34A] dark:border-[#40D677] rounded-lg px-3 py-1.5">
                  <span className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    If it hits:
                  </span>
                  <span className="text-lg font-bold text-[#16A34A] dark:text-[#40D677] font-sora">
                    +{pointsAwarded} pts
                  </span>
                </div>
              </div>
            </div>

            {/* Mobile: Carousel ONLY */}
            <div className="md:hidden">
              <div className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] mb-2 font-inter text-center">
                Swipe to adjust
              </div>

              {/* Carousel Container */}
              <div className="relative mb-3">
                {/* Carousel */}
                <div
                  ref={carouselRef}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory cursor-grab active:cursor-grabbing py-3 px-6"
                  style={{
                    scrollbarWidth: "none",
                    msOverflowStyle: "none",
                  }}
                >
                  {adjustments.map((adj, idx) => {
                    const lineValue = originalLine + adj;
                    const points = pointsArray[idx];
                    const isSelected = idx === selectedAdjustmentIndex;
                    const isOriginal = idx === originalLineIndex;

                    return (
                      <div
                        key={idx}
                        onClick={() => setSelectedAdjustmentIndex(idx)}
                        className={`
                          flex-shrink-0 w-20 snap-center transition-all duration-200 cursor-pointer
                          ${isSelected ? "scale-110" : "scale-90 opacity-50"}
                        `}
                      >
                        <div
                          className={`
                            rounded-xl p-2.5 text-center border-2 transition-all
                            ${
                              isSelected
                                ? "bg-gradient-to-br from-[#4F46E5] to-[#6366F1] dark:from-[#6366F1] dark:to-[#818CF8] border-[#4F46E5] dark:border-[#818CF8] shadow-lg"
                                : isOriginal
                                  ? "bg-[#FEF3C7] dark:bg-[rgba(251,191,36,0.15)] border-[#F59E0B] dark:border-[#FBB040]"
                                  : "bg-white dark:bg-[#262626] border-[#E6E6E6] dark:border-[#404040]"
                            }
                          `}
                        >
                          {isOriginal && (
                            <div className="text-[8px] font-bold text-[#F59E0B] dark:text-[#FBB040] mb-0.5 font-inter">
                              ORIG
                            </div>
                          )}
                          <div
                            className={`
                              text-xl font-bold font-sora
                              ${
                                isSelected
                                  ? "text-white"
                                  : isOriginal
                                    ? "text-[#F59E0B] dark:text-[#FBB040]"
                                    : "text-black dark:text-white"
                              }
                            `}
                          >
                            {formatLine(lineValue)}
                          </div>
                          <div
                            className={`
                              text-xs font-medium mt-0.5 font-inter
                              ${
                                isSelected
                                  ? "text-white/90"
                                  : isOriginal
                                    ? "text-[#F59E0B] dark:text-[#FBB040]"
                                    : "text-[#16A34A] dark:text-[#40D677]"
                              }
                            `}
                          >
                            +{points}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile Current Selection Display */}
              <div className="bg-gradient-to-br from-[#4F46E5] to-[#6366F1] dark:from-[#6366F1] dark:to-[#818CF8] rounded-xl p-3 text-center">
                <div className="text-white/80 dark:text-white/70 text-xs font-medium mb-0.5 font-inter">
                  SELECTED LINE
                </div>
                <div className="text-3xl font-bold text-white font-sora mb-0.5">
                  {formatLine(adjustedLine)}
                </div>
                <div className="text-white/90 dark:text-white/80 text-xs font-inter">
                  {currentAdjustment !== 0 && (
                    <>
                      {currentAdjustment > 0 ? "+" : ""}
                      {currentAdjustment.toFixed(1)} pts from original
                    </>
                  )}
                  {currentAdjustment === 0 && "Original line"}
                </div>
              </div>

              {/* Mobile Points Display */}
              <div className="mt-3 text-center">
                <div className="inline-flex items-center gap-2 bg-[#DCFCE7] dark:bg-[rgba(64,214,119,0.15)] border border-[#16A34A] dark:border-[#40D677] rounded-lg px-3 py-1.5">
                  <span className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter">
                    If it hits:
                  </span>
                  <span className="text-lg font-bold text-[#16A34A] dark:text-[#40D677] font-sora">
                    +{pointsAwarded} pts
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Helper Text */}
          <div className="mb-3 hidden sm:block">
            <div className="bg-[#E0E7FF] dark:bg-[rgba(99,102,241,0.1)] border border-[#4F46E5] dark:border-[#818CF8] rounded-lg p-2.5">
              <p className="text-xs text-[#6F6F6F] dark:text-[#AAAAAA] font-inter text-center">
                <span className="font-semibold text-black dark:text-white">
                  Harder lines = More points.
                </span>{" "}
                Moving the line in your favor decreases potential points.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border-2 border-[#D9D9D9] dark:border-[#404040] bg-white dark:bg-[#262626] text-black dark:text-white font-semibold transition-all duration-150 hover:bg-[#F5F5F5] dark:hover:bg-[#2A2A2A] active:scale-95 font-inter text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-b from-[#252525] to-[#0F0F0F] dark:from-[#FFFFFF] dark:to-[#E0E0E0] text-white dark:text-black font-semibold transition-all duration-150 hover:from-[#2d2d2d] hover:to-[#171717] dark:hover:from-[#F0F0F0] dark:hover:to-[#D0D0D0] active:scale-95 font-inter text-sm"
            >
              Confirm Pick
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
