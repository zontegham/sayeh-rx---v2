import React, { useState, useMemo } from 'react';
import { Language } from '../types/index';
import { 
  calculateTransferEstimate, 
  TransferEstimateResult,
  formatDuration 
} from '../utils/transferTimeEstimator';
import { 
  Clock, 
  Zap, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  Sparkles, 
  ChevronDown, 
  ChevronUp, 
  Gauge, 
  CheckCircle2
} from 'lucide-react';

interface Props {
  fileSizeBytes: number;
  fileName?: string;
  isBinary?: boolean;
  fps: number;
  displayCount: 1 | 2 | 4 | 8 | 16;
  chunkSize: number;
  autoAdaptiveDensity?: boolean;
  cyclesPerItem?: number;
  lang: Language;
  onApplyTuning?: (newFps: number, newDisplayCount: 1 | 2 | 4 | 8 | 16) => void;
  // Live broadcast status (optional)
  isCurrentlyBroadcasting?: boolean;
  currentBroadcastingPage?: number;
  totalBroadcastingPages?: number;
}

export const TransferTimePredictor: React.FC<Props> = ({
  fileSizeBytes,
  fileName,
  isBinary = true,
  fps,
  displayCount,
  chunkSize,
  autoAdaptiveDensity = true,
  cyclesPerItem = 1,
  lang,
  onApplyTuning,
  isCurrentlyBroadcasting = false,
  currentBroadcastingPage = 0,
  totalBroadcastingPages = 0,
}) => {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const [simFps, setSimFps] = useState(fps);
  const [simDisplayCount, setSimDisplayCount] = useState<1 | 2 | 4 | 8 | 16>(displayCount);

  // Active transmission estimate
  const currentEstimate: TransferEstimateResult = useMemo(() => {
    return calculateTransferEstimate(
      {
        fileSizeBytes,
        isBinary,
        fps,
        displayCount,
        chunkSize,
        autoAdaptiveDensity,
        cycles: cyclesPerItem,
      },
      lang
    );
  }, [fileSizeBytes, isBinary, fps, displayCount, chunkSize, autoAdaptiveDensity, cyclesPerItem, lang]);

  // Simulated estimate for "what-if" tuning
  const simulatedEstimate: TransferEstimateResult = useMemo(() => {
    return calculateTransferEstimate(
      {
        fileSizeBytes,
        isBinary,
        fps: simFps,
        displayCount: simDisplayCount,
        chunkSize,
        autoAdaptiveDensity,
        cycles: cyclesPerItem,
      },
      lang
    );
  }, [fileSizeBytes, isBinary, simFps, simDisplayCount, chunkSize, autoAdaptiveDensity, cyclesPerItem, lang]);

  // Live remaining time countdown during broadcast
  const liveRemainingSeconds = useMemo(() => {
    if (!isCurrentlyBroadcasting || totalBroadcastingPages <= 0) return null;
    const remainingPages = Math.max(0, totalBroadcastingPages - (currentBroadcastingPage + 1));
    return remainingPages / Math.max(1, fps);
  }, [isCurrentlyBroadcasting, totalBroadcastingPages, currentBroadcastingPage, fps]);

  if (fileSizeBytes <= 0) {
    return null;
  }

  const timeSavingsPercent = Math.max(
    0,
    Math.round(
      ((currentEstimate.singleCycleSeconds - simulatedEstimate.singleCycleSeconds) /
        Math.max(1, currentEstimate.singleCycleSeconds)) *
        100
    )
  );

  return (
    <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-900/90 shadow-sm dark:shadow-xl p-4 sm:p-5 transition-all space-y-4">
      {/* Header Bar: Centered on mobile & balanced on desktop */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800/80 text-center sm:text-start">
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            <Gauge className="w-4 h-4 animate-pulse" />
          </div>
          <div className="flex flex-col items-center sm:items-start">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h3 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white">
                {lang === 'fa' ? 'پیش‌بینی هوشمند زمان انتقال نوری' : 'Smart Optical Transfer Time Predictor'}
              </h3>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentEstimate.ratingColor}`}>
                {lang === 'fa' ? currentEstimate.ratingLabelFa : currentEstimate.ratingLabelEn}
              </span>
            </div>
            {fileName && (
              <p className="text-[11px] text-slate-600 dark:text-slate-400 truncate max-w-xs sm:max-w-md font-mono mt-0.5">
                {fileName}
              </p>
            )}
          </div>
        </div>

        {/* Live broadcast remaining badge & toggle simulator button */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isCurrentlyBroadcasting && liveRemainingSeconds !== null && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-300 font-mono text-xs font-bold animate-pulse">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {lang === 'fa' 
                  ? `باقیمانده دور فعلی: ${formatDuration(liveRemainingSeconds, lang)}` 
                  : `Loop ETA: ${formatDuration(liveRemainingSeconds, lang)}`}
              </span>
            </span>
          )}

          <button
            type="button"
            onClick={() => setIsSimulatorOpen(!isSimulatorOpen)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold cursor-pointer transition shadow-xs"
          >
            <Sliders className="w-3 h-3 text-cyan-600 dark:text-cyan-400" />
            <span>{lang === 'fa' ? 'شبیه‌ساز بهینه‌سازی سرعت' : 'Speed Simulator'}</span>
            {isSimulatorOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Prediction Display Cards (Clean 2-Column Responsive Centered Layout: Fits perfectly without breaking text) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Metric 1: Estimated Duration (Main KPI) */}
        <div className="p-3.5 rounded-xl bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800/60 flex flex-col items-center justify-center text-center min-w-0 w-full overflow-hidden shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold mb-1">
            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{lang === 'fa' ? 'مدت زمان ۱ دور پخش' : 'Single Cycle ETA'}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-900 dark:text-emerald-300 font-mono tracking-tight py-1 w-full text-center break-words">
            {currentEstimate.formattedSingleCycle}
          </div>
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 text-center w-full truncate">
            {lang === 'fa' ? `تعداد کل صفحات: ${currentEstimate.totalPages} فریم نوری` : `Total optical pages: ${currentEstimate.totalPages}`}
          </div>
        </div>

        {/* Metric 2: Recommended Camera Safe Time */}
        <div className="p-3.5 rounded-xl bg-cyan-50/90 dark:bg-cyan-950/30 border border-cyan-300 dark:border-cyan-800/60 flex flex-col items-center justify-center text-center min-w-0 w-full overflow-hidden shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>{lang === 'fa' ? 'زمان اطمینان وب‌کم' : 'Webcam Safe Window'}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-cyan-900 dark:text-cyan-300 font-mono tracking-tight py-1 w-full text-center break-words">
            {currentEstimate.formattedRecommended}
          </div>
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 text-center w-full truncate">
            {lang === 'fa' ? '+۳۰٪ حاشیه خطای دوربین' : '+30% camera buffer'}
          </div>
        </div>

        {/* Metric 3: Effective Optical Throughput */}
        <div className="p-3.5 rounded-xl bg-purple-50/90 dark:bg-purple-950/30 border border-purple-300 dark:border-purple-800/60 flex flex-col items-center justify-center text-center min-w-0 w-full overflow-hidden shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold mb-1">
            <Zap className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
            <span>{lang === 'fa' ? 'پهنای باند نوری' : 'Optical Bandwidth'}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-purple-900 dark:text-purple-300 font-mono tracking-tight py-1 w-full text-center break-words">
            {currentEstimate.formattedThroughput}
          </div>
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 text-center w-full truncate">
            {currentEstimate.opticalBitrateKbps} Kbps • {fps} FPS
          </div>
        </div>

        {/* Metric 4: Packets Breakdown */}
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center text-center min-w-0 w-full overflow-hidden shadow-xs">
          <div className="flex items-center justify-center gap-1.5 text-slate-800 dark:text-slate-200 text-xs font-bold mb-1">
            <Layers className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 shrink-0" />
            <span>{lang === 'fa' ? 'تقسیم‌بندی بسته‌ها' : 'Packet Details'}</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-950 dark:text-white font-mono tracking-tight py-1 w-full text-center break-words">
            {currentEstimate.totalChunks} <span className="text-xs font-normal text-slate-500">{lang === 'fa' ? 'قطعه' : 'chunks'}</span>
          </div>
          <div className="text-[11px] font-semibold text-slate-700 dark:text-slate-400 text-center w-full truncate">
            {displayCount}x GRID • {currentEstimate.effectiveChunkSize}B
          </div>
        </div>
      </div>

      {/* Smart Optimization Advice Banner: Centered and neat */}
      {currentEstimate.optimizationTipFa && (
        <div className="flex items-center justify-center text-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-950 dark:text-emerald-200 leading-relaxed font-semibold">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>
            {lang === 'fa' ? currentEstimate.optimizationTipFa : currentEstimate.optimizationTipEn}
          </span>
        </div>
      )}

      {/* Interactive Speed Simulator ("اگر تنظیمات را تغییر دهم چه می‌شود؟") */}
      {isSimulatorOpen && (
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in text-center">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-center gap-1.5">
              <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <span>{lang === 'fa' ? 'شبیه‌ساز آنی سرعت انتقال (تغییر پارامترها و مشاهده پیش‌بینی):' : 'Speed Simulator:'}</span>
            </span>
            {timeSavingsPercent > 0 && (
              <span className="text-xs font-bold font-mono px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 animate-bounce">
                {lang === 'fa' ? `${timeSavingsPercent}٪ سریع‌تر!` : `${timeSavingsPercent}% Faster!`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-center">
            {/* Simulator: Multi-QR Display Count */}
            <div className="flex flex-col items-center">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1.5 text-center">
                {lang === 'fa' ? 'تست چیدمان نمایش هم‌زمان کیوآرکدها:' : 'Simultaneous QR Count:'}
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-mono font-bold w-full max-w-xs mx-auto">
                {[1, 2, 4, 8].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setSimDisplayCount(cnt as 1 | 2 | 4 | 8 | 16)}
                    className={`py-2 px-1 rounded-xl border transition cursor-pointer text-center ${
                      simDisplayCount === cnt
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-400'
                    }`}
                  >
                    {cnt}x {cnt === 1 ? (lang === 'fa' ? '(تک)' : 'Single') : ''}
                  </button>
                ))}
              </div>
            </div>

            {/* Simulator: FPS Shutter Speed */}
            <div className="flex flex-col items-center">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-300 block mb-1.5 text-center">
                {lang === 'fa' ? 'تست نرخ شاتر (FPS):' : 'Shutter FPS Test:'}
              </label>
              <div className="grid grid-cols-5 gap-1.5 text-xs font-mono font-bold w-full max-w-xs mx-auto">
                {[1, 2, 3, 5, 8].map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setSimFps(f)}
                    className={`py-2 px-1 rounded-xl border transition cursor-pointer text-center ${
                      simFps === f
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-emerald-400'
                    }`}
                  >
                    {f} fps
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Simulator Result Comparison Box: Centered */}
          <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-start">
            <div className="text-xs space-y-1 text-center sm:text-start">
              <div className="text-slate-600 dark:text-slate-400 font-semibold">
                {lang === 'fa' ? 'پیش‌بینی با تنظیمات جدید شبیه‌سازی شده:' : 'Predicted with simulated settings:'}
              </div>
              <div className="text-base font-bold text-slate-950 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-black">
                  {simulatedEstimate.formattedSingleCycle}
                </span>
                <span className="text-xs text-slate-500">
                  ({simulatedEstimate.totalPages} {lang === 'fa' ? 'صفحه' : 'pages'})
                </span>
                <span className="text-xs font-mono text-purple-600 dark:text-purple-400 font-bold">
                  • {simulatedEstimate.formattedThroughput}
                </span>
              </div>
            </div>

            {onApplyTuning && (
              <button
                type="button"
                onClick={() => {
                  onApplyTuning(simFps, simDisplayCount);
                  setIsSimulatorOpen(false);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer shrink-0"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{lang === 'fa' ? 'اعمال فوری این تنظیمات' : 'Apply These Settings'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
