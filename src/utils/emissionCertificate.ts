/**
 * Cryptographic Proof of Air-Gap Optical Emission Engine
 * Generates an immutable, digitally signed certificate for every completed transmission.
 * Serves as legal and security audit proof for isolated air-gap data stations.
 */

import { AirGapEmissionCertificate, TransmissionEncodingMode, ChromaMultiplexMode } from '../types/index';
import { calculateSha256 } from './crypto';

export interface GenerateCertificateParams {
  stationId: string;
  stationName: string;
  transferId: string;
  fileName?: string;
  fileType?: string;
  totalBytes: number;
  totalFrames: number;
  encodingMode: TransmissionEncodingMode;
  chromaMode?: ChromaMultiplexMode;
  encryptionMode: string;
  payloadSha256: string;
  envelopeHash?: string;
  cyclesCompleted: number;
  shutterFps: number;
  displayCount: number;
  stationSigningKey?: string;
}

/**
 * Derives a cryptographic digital seal (HMAC-SHA256 signature)
 */
async function generateDigitalSeal(dataToSign: string, secretKey: string): Promise<string> {
  try {
    const enc = new TextEncoder();
    const keyData = enc.encode(secretKey || 'Sayeh-Military-Station-Signing-Key-2026');
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: 'SHA-256' } },
      false,
      ['sign']
    );
    const signature = await window.crypto.subtle.sign('HMAC', cryptoKey, enc.encode(dataToSign));
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch {
    // Deterministic fallback
    return calculateSha256(new TextEncoder().encode(dataToSign + secretKey));
  }
}

/**
 * Format timestamp in Persian Jalali calendar
 */
export function formatJalaliDateTime(timestamp: number): string {
  try {
    const date = new Date(timestamp);
    const formatter = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Tehran',
    });
    return formatter.format(date);
  } catch {
    return new Date(timestamp).toLocaleString();
  }
}

/**
 * Generate official Air-Gap Optical Emission Certificate
 */
export async function createEmissionCertificate(
  params: GenerateCertificateParams
): Promise<AirGapEmissionCertificate> {
  const timestamp = Date.now();
  const certId = `CERT-EMIT-${timestamp.toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const utcFormatted = new Date(timestamp).toISOString();
  const jalaliFormatted = formatJalaliDateTime(timestamp);

  const payloadSummary = `${certId}|${params.stationId}|${params.transferId}|${params.payloadSha256}|${params.totalBytes}|${params.totalFrames}|${utcFormatted}`;
  const digitalSignatureHex = await generateDigitalSeal(
    payloadSummary,
    params.stationSigningKey || params.stationId
  );

  // Compact QR wire payload for scanner verification
  // Format: AIRD:CERT:v1:<certId>:<stationId>:<txId>:<shaPrefix>:<bytes>:<frames>:<sigPrefix>
  const qrWireCertificate = `AIRD:CERT:v1:${certId}:${params.stationId}:${params.transferId}:${params.payloadSha256.substring(0, 16)}:${params.totalBytes}:${params.totalFrames}:${digitalSignatureHex.substring(0, 16)}`;

  return {
    certificateId: certId,
    stationId: params.stationId,
    stationName: params.stationName,
    transferId: params.transferId,
    fileName: params.fileName || 'unnamed-payload',
    fileType: params.fileType || 'application/octet-stream',
    totalBytes: params.totalBytes,
    totalFrames: params.totalFrames,
    encodingMode: params.encodingMode,
    chromaMode: params.chromaMode,
    encryptionMode: params.encryptionMode,
    payloadSha256: params.payloadSha256,
    envelopeHash: params.envelopeHash,
    timestamp,
    timestampFormattedUtc: utcFormatted,
    timestampFormattedJalali: jalaliFormatted,
    cyclesCompleted: Math.max(1, params.cyclesCompleted),
    shutterFps: params.shutterFps,
    displayCount: params.displayCount,
    securityIssuer: 'SAYEH Optical Air-Gap Data Diode Authority',
    digitalSignatureHex,
    qrWireCertificate,
  };
}

/**
 * Download certificate as formatted JSON file
 */
export function downloadCertificateJson(cert: AirGapEmissionCertificate): void {
  const jsonStr = JSON.stringify(cert, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AirGap-Certificate-${cert.certificateId}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Download certificate as official readable Persian/English audit manifest
 */
export function downloadCertificateText(cert: AirGapEmissionCertificate): void {
  const text = `================================================================================
          گواهی دیجیتال تابش نوری و خروج داده از شکاف هوایی (AIR-GAP)
              OFFICIAL AIR-GAP OPTICAL EMISSION CERTIFICATE
================================================================================
شناسه گواهی امنیتی (Certificate ID) : ${cert.certificateId}
شناسه ایستگاه فرستنده (Station ID)  : ${cert.stationId}
نام ایستگاه (Station Name)          : ${cert.stationName}
شناسه مخابره (Transfer ID)          : ${cert.transferId}
مرجع تایید اصالت (Security Issuer)  : ${cert.securityIssuer}

--------------------------------------------------------------------------------
مشخصات محموله و داده‌های مخابره‌شده (PAYLOAD METRICS)
--------------------------------------------------------------------------------
نام فایل (File Name)                : ${cert.fileName}
نوع محتوا (Content Type)            : ${cert.fileType}
حجم دقیق بایت‌ها (Total Bytes)       : ${cert.totalBytes.toLocaleString('fa-IR')} بایت (${cert.totalBytes} B)
تعداد فریم‌های نوری (Optical Frames) : ${cert.totalFrames} فریم
الگوریتم کدگذاری (Encoding Mode)    : ${cert.encodingMode === 'fountain' ? 'کدهای فواره‌ای ضد ریزش (Fountain Zero-Sync v3)' : 'استاندارد ترتیبی (Sequential v2)'}
الگوریتم رمزنگاری (Encryption)      : ${cert.encryptionMode}
تعداد دورهای پخش (Cycles Broadcast) : ${cert.cyclesCompleted} دور کامل
نرخ شاتر نوری (Shutter Speed)        : ${cert.shutterFps} فریم بر ثانیه (FPS)
چیدمان نمایشگر (Grid Layout)        : ${cert.displayCount}x GRID

--------------------------------------------------------------------------------
امضای دیجیتال و هش جامع یکپارچگی (CRYPTOGRAPHIC PROOF & INTEGRITY)
--------------------------------------------------------------------------------
هش محتوا (Plaintext SHA-256)        : ${cert.payloadSha256}
هش پاکت رمز (Envelope SHA-256)      : ${cert.envelopeHash || 'N/A'}
مُهر موم دیجیتال (Digital Signature): ${cert.digitalSignatureHex}

--------------------------------------------------------------------------------
برچسب زمانی ثبت (TIMESTAMP)
--------------------------------------------------------------------------------
زمان رسمی شمسی (Iran Time - IRST)   : ${cert.timestampFormattedJalali}
زمان استاندارد جهانی (UTC / ISO)    : ${cert.timestampFormattedUtc}

================================================================================
این سند بر اساس استانداردهای ایزولاسیون یکسویه داده (Air-Gap Data Diode) به صورت
خودکار توسط سامانه امن سایه صادر شده و هرگونه جعل در محتوا هش را باطل می‌کند.
================================================================================`;

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `AirGap-Certificate-${cert.certificateId}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
