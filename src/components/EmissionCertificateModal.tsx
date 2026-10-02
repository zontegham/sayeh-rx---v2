import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { AirGapEmissionCertificate, Language } from '../types/index';
import { 
  downloadCertificateJson, 
  downloadCertificateText 
} from '../utils/emissionCertificate';
import { 
  ShieldCheck, 
  Award, 
  Download, 
  FileText, 
  Printer, 
  X, 
  Check, 
  Copy, 
  QrCode, 
  Clock, 
  Hash, 
  Server, 
  Layers,
  Sparkles,
  Lock
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  certificate: AirGapEmissionCertificate | null;
  lang: Language;
}

export const EmissionCertificateModal: React.FC<Props> = ({
  isOpen,
  onClose,
  certificate,
  lang,
}) => {
  const [certQrSvg, setCertQrSvg] = useState<string>('');
  const [copiedHash, setCopiedHash] = useState(false);
  const [copiedSig, setCopiedSig] = useState(false);

  useEffect(() => {
    if (!certificate || !isOpen) return;

    QRCode.toString(certificate.qrWireCertificate, {
      type: 'svg',
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((svg) => setCertQrSvg(svg))
      .catch((err) => console.error('Failed to generate certificate QR:', err));
  }, [certificate, isOpen]);

  if (!isOpen || !certificate) return null;

  const handleCopy = (text: string, type: 'hash' | 'sig') => {
    navigator.clipboard.writeText(text);
    if (type === 'hash') {
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } else {
      setCopiedSig(true);
      setTimeout(() => setCopiedSig(false), 2000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border-2 border-emerald-500 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Certificate Header Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 border-b border-emerald-500/40 text-white select-none">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 shadow-inner">
                <Award className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest text-emerald-400 font-bold uppercase block">
                  Official Air-Gap Emission Record
                </span>
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                  <span>{lang === 'fa' ? 'گواهی دیجیتال تابش نوری شکاف هوایی' : 'Air-Gap Optical Emission Certificate'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30">
                    VERIFIED
                  </span>
                </h2>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs font-mono text-emerald-200/90 gap-2 pt-3 border-t border-emerald-500/20">
            <span>{certificate.certificateId}</span>
            <span>{certificate.timestampFormattedJalali}</span>
          </div>
        </div>

        {/* Certificate Body */}
        <div className="p-5 sm:p-6 space-y-5 text-slate-900 dark:text-white">
          {/* Top Grid: Station & Payload Overview with Certificate QR Code */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="md:col-span-2 space-y-3">
              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <span>{lang === 'fa' ? 'ایستگاه صادرکننده:' : 'Originating Station:'}</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{certificate.stationId}</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white truncate" title={certificate.stationName}>
                  {certificate.stationName}
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <span>{lang === 'fa' ? 'شناسه مخابره (TX ID):' : 'Transfer ID:'}</span>
                  <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400">{certificate.transferId}</span>
                </div>
              </div>

              {/* Payload Metrics Table */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{lang === 'fa' ? 'نام سند:' : 'File Name:'}</span>
                  <span className="font-bold truncate block mt-0.5 text-slate-900 dark:text-white" title={certificate.fileName}>
                    {certificate.fileName}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{lang === 'fa' ? 'حجم داده:' : 'Payload Size:'}</span>
                  <span className="font-mono font-bold block mt-0.5 text-slate-900 dark:text-white">
                    {certificate.totalBytes.toLocaleString('fa-IR')} {lang === 'fa' ? 'بایت' : 'Bytes'}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{lang === 'fa' ? 'فریم‌های نوری:' : 'Optical Frames:'}</span>
                  <span className="font-mono font-bold block mt-0.5 text-emerald-600 dark:text-emerald-400">
                    {certificate.totalFrames} {lang === 'fa' ? 'فریم' : 'Frames'} ({certificate.cyclesCompleted} {lang === 'fa' ? 'دور' : 'Loops'})
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{lang === 'fa' ? 'کدگذاری و کانال نوری:' : 'Encoding & Channel:'}</span>
                  <span className="font-bold block mt-0.5 text-purple-600 dark:text-purple-400 truncate">
                    {certificate.encodingMode === 'fountain' ? 'فواره‌ای v3' : 'ترتیبی v2'}
                    {certificate.chromaMode === 'rgb_3x' ? ' • RGB 3x' : ' • Mono 1x'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Certificate Verification QR */}
            <div className="flex flex-col items-center justify-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-center space-y-2">
              <div 
                className="w-36 h-36 p-1.5 rounded-xl bg-white shadow-md flex items-center justify-center aspect-square select-none [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:block"
                dangerouslySetInnerHTML={{ __html: certQrSvg }}
              />
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <QrCode className="w-3 h-3 text-emerald-500" />
                <span>{lang === 'fa' ? 'بارکد احراز ممیزی' : 'Auditor Verify QR'}</span>
              </span>
            </div>
          </div>

          {/* Cryptographic Hashes & Signatures */}
          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold flex items-center gap-1">
                  <Hash className="w-3.5 h-3.5 text-cyan-500" />
                  <span>{lang === 'fa' ? 'هش رمزنگاری محتوا (SHA-256):' : 'Plaintext SHA-256 Hash:'}</span>
                </span>
                <button
                  onClick={() => handleCopy(certificate.payloadSha256, 'hash')}
                  className="flex items-center gap-1 text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer"
                >
                  {copiedHash ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedHash ? (lang === 'fa' ? 'کپی شد' : 'Copied') : (lang === 'fa' ? 'کپی هش' : 'Copy')}</span>
                </button>
              </div>
              <div className="font-mono text-[11px] font-bold text-slate-800 dark:text-slate-200 break-all select-all">
                {certificate.payloadSha256}
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                <span className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{lang === 'fa' ? 'مُهر موم دیجیتال فرستنده (Digital Signature Seal):' : 'Station Digital Signature:'}</span>
                </span>
                <button
                  onClick={() => handleCopy(certificate.digitalSignatureHex, 'sig')}
                  className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  {copiedSig ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSig ? (lang === 'fa' ? 'کپی شد' : 'Copied') : (lang === 'fa' ? 'کپی امضا' : 'Copy')}</span>
                </button>
              </div>
              <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-400 break-all select-all font-semibold">
                {certificate.digitalSignatureHex}
              </div>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => downloadCertificateJson(certificate)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer shadow-xs"
              title={lang === 'fa' ? 'دانلود فایل ساختاریافته JSON جهت اتوماسیون و ممیزی' : 'Download JSON certificate'}
            >
              <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
              <span>{lang === 'fa' ? 'دریافت گواهی (JSON)' : 'Export JSON'}</span>
            </button>

            <button
              onClick={() => downloadCertificateText(certificate)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer shadow-xs"
              title={lang === 'fa' ? 'دانلود سند رسمی متنی با تقویم شمسی' : 'Download official text manifest'}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'fa' ? 'سند ممیزی (TXT)' : 'Export Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold transition cursor-pointer shadow-xs"
              title={lang === 'fa' ? 'چاپ رسمی گواهی جهت بایگانی حراست' : 'Print certificate'}
            >
              <Printer className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>{lang === 'fa' ? 'چاپ رسمی' : 'Print'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            {lang === 'fa' ? 'بستن پنجره' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
