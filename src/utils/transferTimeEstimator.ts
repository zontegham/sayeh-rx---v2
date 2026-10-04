/**
 * Optical Air-Gap Transmission Time Predictor Engine
 * Accurately models transmission duration, frame counts, optical throughput,
 * and camera capture redundancy based on file payload size, shutter FPS, and multi-QR display count.
 */

import { Language } from '../types/index';

export interface TransferEstimateOptions {
  fileSizeBytes: number;
  isBinary?: boolean;
  fps?: number; // Shutter rate (frames per second)
  displayCount?: 1 | 2 | 4 | 8 | 16; // Multi-QR grid
  chunkSize?: number;
  autoAdaptiveDensity?: boolean;
  cycles?: number;
}

export interface TransferEstimateResult {
  fileSizeBytes: number;
  effectivePayloadBytes: number;
  effectiveChunkSize: number;
  totalChunks: number;
  totalPages: number;
  singleCycleSeconds: number;
  recommendedSeconds: number; // Single cycle + 30% camera sync buffer
  totalCyclesSeconds: number;
  opticalThroughputBytesPerSec: number;
  opticalBitrateKbps: number;
  formattedSingleCycle: string;
  formattedRecommended: string;
  formattedTotalDuration: string;
  formattedThroughput: string;
  speedRating: 'instant' | 'fast' | 'optimal' | 'moderate' | 'extended';
  ratingLabelFa: string;
  ratingLabelEn: string;
  ratingColor: string;
  optimizationTipFa?: string;
  optimizationTipEn?: string;
}

/**
 * Format raw seconds into localized readable time
 */
export function formatDuration(seconds: number, lang: Language = 'fa'): string {
  if (isNaN(seconds) || seconds <= 0) {
    return lang === 'fa' ? '۰ ثانیه' : '0s';
  }

  const totalSec = Math.round(seconds);

  if (totalSec < 60) {
    return lang === 'fa' ? `${totalSec} ثانیه` : `${totalSec}s`;
  }

  const mins = Math.floor(totalSec / 60);
  const remSec = totalSec % 60;

  if (mins < 60) {
    if (remSec === 0) {
      return lang === 'fa' ? `${mins} دقیقه` : `${mins}m`;
    }
    return lang === 'fa' 
      ? `${mins} دقیقه و ${remSec} ثانیه` 
      : `${mins}m ${remSec}s`;
  }

  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  return lang === 'fa' 
    ? `${hours} ساعت و ${remMins} دقیقه` 
    : `${hours}h ${remMins}m`;
}

/**
 * Calculate accurate transfer time predictions
 */
export function calculateTransferEstimate(
  options: TransferEstimateOptions,
  lang: Language = 'fa'
): TransferEstimateResult {
  const {
    fileSizeBytes,
    isBinary = true,
    fps = 3,
    displayCount = 1,
    chunkSize = 240,
    autoAdaptiveDensity = true,
    cycles = 1,
  } = options;

  if (fileSizeBytes <= 0) {
    return {
      fileSizeBytes: 0,
      effectivePayloadBytes: 0,
      effectiveChunkSize: chunkSize,
      totalChunks: 0,
      totalPages: 0,
      singleCycleSeconds: 0,
      recommendedSeconds: 0,
      totalCyclesSeconds: 0,
      opticalThroughputBytesPerSec: 0,
      opticalBitrateKbps: 0,
      formattedSingleCycle: formatDuration(0, lang),
      formattedRecommended: formatDuration(0, lang),
      formattedTotalDuration: formatDuration(0, lang),
      formattedThroughput: '0 B/s',
      speedRating: 'instant',
      ratingLabelFa: 'آنی',
      ratingLabelEn: 'Instant',
      ratingColor: 'text-emerald-500',
    };
  }

  // Model envelope overhead: Base64 expands binary data by ~33-37%, plus JSON cryptographic envelope (IV, Salt, Hash, Metadata) ~450B
  const effectivePayloadBytes = isBinary
    ? Math.ceil(fileSizeBytes * 1.37) + 450
    : fileSizeBytes + 350;

  // Adaptive chunk size calculation matching packetizeEnvelope in packetizer.ts
  let effChunkSize = chunkSize;
  if (autoAdaptiveDensity) {
    if (effectivePayloadBytes > 3_000_000) {
      effChunkSize = Math.max(chunkSize, 1200);
    } else if (effectivePayloadBytes > 1_500_000) {
      effChunkSize = Math.max(chunkSize, 950);
    } else if (effectivePayloadBytes > 500_000) {
      effChunkSize = Math.max(chunkSize, 720);
    } else if (effectivePayloadBytes > 100_000) {
      effChunkSize = Math.max(chunkSize, 480);
    } else if (effectivePayloadBytes > 50_000) {
      effChunkSize = Math.max(chunkSize, 360);
    }
  }

  // Total chunks and pages
  const totalChunks = Math.max(1, Math.ceil(effectivePayloadBytes / effChunkSize));
  const totalPages = Math.max(1, Math.ceil(totalChunks / displayCount));

  // Time calculations:
  // 1. Single cycle time (حداقل زمان تئوریک انتقال ۱ دور کامل)
  const safeFps = Math.max(1, fps);
  const singleCycleSeconds = totalPages / safeFps;

  // 2. Recommended time with 30% camera shutter sync & re-lock buffer
  const recommendedSeconds = singleCycleSeconds * 1.3;

  // 3. Multi-cycle time if looping is configured
  const totalCyclesSeconds = singleCycleSeconds * Math.max(1, cycles);

  // Optical throughput
  const opticalThroughputBytesPerSec = Math.round(
    fileSizeBytes / Math.max(0.1, singleCycleSeconds)
  );
  const opticalBitrateKbps = Number(
    ((fileSizeBytes * 8) / (Math.max(0.1, singleCycleSeconds) * 1000)).toFixed(1)
  );

  let formattedThroughput = '';
  if (opticalThroughputBytesPerSec < 1024) {
    formattedThroughput = `${opticalThroughputBytesPerSec} B/s`;
  } else if (opticalThroughputBytesPerSec < 1024 * 1024) {
    formattedThroughput = `${(opticalThroughputBytesPerSec / 1024).toFixed(1)} KB/s`;
  } else {
    formattedThroughput = `${(opticalThroughputBytesPerSec / (1024 * 1024)).toFixed(2)} MB/s`;
  }

  // Speed rating
  let speedRating: 'instant' | 'fast' | 'optimal' | 'moderate' | 'extended';
  let ratingLabelFa = '';
  let ratingLabelEn = '';
  let ratingColor = '';

  if (singleCycleSeconds <= 3) {
    speedRating = 'instant';
    ratingLabelFa = 'فوق‌العاده سریع (آنی)';
    ratingLabelEn = 'Instantaneous';
    ratingColor = 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';
  } else if (singleCycleSeconds <= 15) {
    speedRating = 'fast';
    ratingLabelFa = 'سریع و روان';
    ratingLabelEn = 'Fast Transfer';
    ratingColor = 'text-teal-500 bg-teal-500/10 border-teal-500/30';
  } else if (singleCycleSeconds <= 60) {
    speedRating = 'optimal';
    ratingLabelFa = 'استاندارد بهینه';
    ratingLabelEn = 'Optimal Speed';
    ratingColor = 'text-cyan-500 bg-cyan-500/10 border-cyan-500/30';
  } else if (singleCycleSeconds <= 180) {
    speedRating = 'moderate';
    ratingLabelFa = 'متوسط (حجم بالا)';
    ratingLabelEn = 'Moderate (Heavy)';
    ratingColor = 'text-amber-500 bg-amber-500/10 border-amber-500/30';
  } else {
    speedRating = 'extended';
    ratingLabelFa = 'زمان‌بر (داده بسیار حجیم)';
    ratingLabelEn = 'Extended Transfer';
    ratingColor = 'text-purple-500 bg-purple-500/10 border-purple-500/30';
  }

  // Contextual Optimization Tip
  let optimizationTipFa: string | undefined;
  let optimizationTipEn: string | undefined;

  if (displayCount === 1 && singleCycleSeconds > 15) {
    optimizationTipFa = '💡 با انتخاب چیدمان ۲ یا ۴ کیوآر همزمان، زمان انتقال نوری را به نصف یا یک‌چهارم کاهش دهید.';
    optimizationTipEn = '💡 Switch to 2x or 4x QR grid to cut optical transfer time by 50% to 75%.';
  } else if (fps < 5 && singleCycleSeconds > 25) {
    optimizationTipFa = '💡 اگر دوربین گیرنده وب‌کم با کیفیتی است، افزایش نرخ شاتر به ۵ FPS سرعت انتقال را ۶۶٪ بیشتر می‌کند.';
    optimizationTipEn = '💡 If receiver camera has high frame rate, increasing shutter to 5 FPS speeds transfer up by 66%.';
  } else if (singleCycleSeconds <= 10) {
    optimizationTipFa = '⚡ سرعت مخابره برای این فایل ایده‌آل است و وب‌کم در اولین دور تمامی فریم‌ها را ثبت می‌کند.';
    optimizationTipEn = '⚡ Optimal throughput: receiver camera will capture all frames in the first pass.';
  }

  return {
    fileSizeBytes,
    effectivePayloadBytes,
    effectiveChunkSize: effChunkSize,
    totalChunks,
    totalPages,
    singleCycleSeconds,
    recommendedSeconds,
    totalCyclesSeconds,
    opticalThroughputBytesPerSec,
    opticalBitrateKbps,
    formattedSingleCycle: formatDuration(singleCycleSeconds, lang),
    formattedRecommended: formatDuration(recommendedSeconds, lang),
    formattedTotalDuration: formatDuration(totalCyclesSeconds, lang),
    formattedThroughput,
    speedRating,
    ratingLabelFa,
    ratingLabelEn,
    ratingColor,
    optimizationTipFa,
    optimizationTipEn,
  };
}
