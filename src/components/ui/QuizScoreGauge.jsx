/**
 * QuizScoreGauge — Radial arc with correct/incorrect segments.
 * On hover: shows accuracy %. At rest: shows solved count.
 * Matches Stitch SCREEN_15 dashboard gauge card with Tailwind & Stitch classes.
 */
export default function QuizScoreGauge({ correct = 0, incorrect = 0, size = 112 }) {
    const total = correct + incorrect;
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

    // Arc parameters (220° sweep, like the Stitch design)
    const strokeWidth = 7.5;
    // SVG arc from the Stitch design
    const arcPath = 'M 20.6 72.8 A 38 38 0 1 1 79.4 72.8';
    const arcLength = 172.6; // total arc length

    const correctFraction = total > 0 ? correct / total : 0;
    const incorrectFraction = total > 0 ? incorrect / total : 0;

    const correctLength = correctFraction * arcLength;
    const incorrectOffset = correctLength;
    const incorrectLength = incorrectFraction * arcLength;

    return (
        <div
            className="group cursor-pointer select-none rounded-xl p-4 bg-[#141417] border border-[#27272a] shadow-sm flex items-center justify-between gap-3 transition-colors hover:border-[#383842] stitch-gauge-card"
            style={{ minHeight: 130 }}
        >
            {/* Gauge SVG */}
            <div className="relative shrink-0 flex items-center justify-center" style={{ width: size, height: size }}>
                <svg
                    width={size}
                    height={size}
                    viewBox="0 0 100 100"
                    style={{ display: 'block' }}
                    className="w-full h-full"
                >
                    {/* Track */}
                    <path
                        d={arcPath}
                        fill="none"
                        stroke="#201f1f"
                        strokeDasharray={arcLength}
                        strokeDashoffset="0"
                        strokeLinecap="round"
                        strokeWidth={strokeWidth}
                    />
                    {/* Correct (emerald) */}
                    {correct > 0 && (
                        <path
                            d={arcPath}
                            fill="none"
                            stroke="#34d399"
                            strokeDasharray={`${correctLength} ${arcLength}`}
                            strokeDashoffset="0"
                            strokeLinecap="round"
                            strokeWidth={strokeWidth}
                            style={{ transition: 'stroke-dasharray 600ms ease' }}
                        />
                    )}
                    {/* Incorrect (coral) */}
                    {incorrect > 0 && (
                        <path
                            d={arcPath}
                            fill="none"
                            stroke="#f87171"
                            strokeDasharray={`${incorrectLength} ${arcLength}`}
                            strokeDashoffset={-incorrectOffset}
                            strokeLinecap="round"
                            strokeWidth={strokeWidth}
                            style={{ transition: 'stroke-dasharray 600ms ease' }}
                        />
                    )}
                </svg>

                {/* Center: resting state — shows solved/total */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center transition-all duration-300 group-hover:opacity-0 group-hover:scale-90 group-active:opacity-0 stitch-gauge-center">
                    <div className="flex items-baseline justify-center">
                        <span className="text-lg font-bold text-white">{correct}</span>
                        <span className="text-xs text-[#a1a1aa] font-medium">/{total}</span>
                    </div>
                    <span className="text-[10px] text-[#a1a1aa] font-medium mt-0.5 flex items-center gap-0.5">
                        <span className="material-symbols-outlined text-[12px] text-emerald-400">check</span>
                        Solved
                    </span>
                </div>

                {/* Center: hover state — shows accuracy % */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-0 scale-90 transition-all duration-300 group-hover:opacity-100 group-hover:scale-100 group-active:opacity-100 group-active:scale-100 stitch-gauge-hover">
                    <span className="text-xl font-bold text-[#4b2bee] tracking-tight">
                        {accuracy}%
                    </span>
                    <span className="text-[10px] text-[#a1a1aa] font-medium mt-0.5">
                        Accuracy
                    </span>
                </div>
            </div>

            {/* Stats breakdown */}
            <div className="flex-1 flex flex-col justify-center gap-2 min-w-0">
                {/* Correct row */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1a1921] border border-[#27272a]/70">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                        <span className="text-xs font-semibold text-emerald-400">Correct</span>
                    </div>
                    <span className="text-xs font-bold text-white">
                        {correct}
                        <span className="text-[10px] font-normal text-[#a1a1aa]">/{total}</span>
                    </span>
                </div>
                {/* Incorrect row */}
                <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1a1921] border border-[#27272a]/70">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0" />
                        <span className="text-xs font-semibold text-rose-400">Incorrect</span>
                    </div>
                    <span className="text-xs font-bold text-white">
                        {incorrect}
                        <span className="text-[10px] font-normal text-[#a1a1aa]">/{total}</span>
                    </span>
                </div>
            </div>
        </div>
    );
}
