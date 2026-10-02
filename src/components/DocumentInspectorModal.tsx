import React, { useState, useEffect } from 'react';
import { QueueItem, Language, DocumentPriority, SecurityClassification } from '../types/index';
import { calculateSha256 } from '../utils/crypto';
import { getPayloadData } from '../utils/payloadStorage';
import { 
  FileText, 
  File, 
  Image as ImageIcon, 
  ShieldCheck, 
  Hash, 
  HardDrive, 
  X, 
  Check, 
  Copy, 
  Radio, 
  Tag, 
  Clock, 
  Flame, 
  AlertTriangle, 
  Lock, 
  Play, 
  Eye, 
  Download,
  Info
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: QueueItem | null;
  lang: Language;
  onUpdateItem?: (updated: QueueItem) => void;
  onBroadcastNow?: (item: QueueItem) => void;
}

export const DocumentInspectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  lang,
  onUpdateItem,
  onBroadcastNow,
}) => {
  const [fullData, setFullData] = useState<string>('');
  const [calculatedSha256, setCalculatedSha256] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedSha, setCopiedSha] = useState<boolean>(false);
  const [copiedText, setCopiedText] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>('');
  const [priority, setPriority] = useState<DocumentPriority>('normal');
  const [classification, setClassification] = useState<SecurityClassification>('confidential');

  useEffect(() => {
    if (!item || !isOpen) {
      setFullData('');
      setCalculatedSha256('');
      return;
    }

    setCustomName(item.customLabel || item.name);
    setPriority(item.priority || 'normal');
    setClassification(item.classification || 'confidential');
    setLoading(true);

    const loadData = async () => {
      let data = item.data;
      if (!data) {
        data = (await getPayloadData(item.id)) || '';
      }
      setFullData(data);

      if (data) {
        try {
          const enc = new TextEncoder();
          const bytes = enc.encode(data);
          const hash = await calculateSha256(bytes);
          setCalculatedSha256(hash);
        } catch (e) {
          console.error('Failed to hash payload', e);
        }
      }
      setLoading(false);
    };

    loadData();
  }, [item, isOpen]);

  if (!isOpen || !item) return null;

  const handleSaveAttributes = () => {
    if (!onUpdateItem) return;
    onUpdateItem({
      ...item,
      customLabel: customName.trim() || item.name,
      priority,
      classification,
      sha256: calculatedSha256 || item.sha256,
    });
    onClose();
  };

  const isImage = item.isBinary && (
    item.type.startsWith('image/') || 
    /\.(png|jpe?g|svg|webp|gif|bmp|ico)$/i.test(item.name)
  );

  const isJsonOrText = !item.isBinary || item.type.includes('json') || item.type.includes('text') || item.type.includes('xml');

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto animate-in fade-in">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border-2 border-cyan-500 rounded-3xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 border-b border-cyan-500/30 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 text-cyan-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase tracking-wider block">
                Pre-Flight Payload Inspection & Integrity Seal
              </span>
              <h3 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                <span>{lang === 'fa' ? 'پیش‌نمایش محتوا و اعتبارسنجی سند در صف' : 'Document Content Inspector'}</span>
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-5 text-slate-900 dark:text-white max-h-[75vh] overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{lang === 'fa' ? 'نام اصلی فایل:' : 'File Name:'}</span>
              <span className="font-bold truncate block mt-0.5 text-slate-900 dark:text-white" title={item.name}>
                {item.name}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{lang === 'fa' ? 'حجم داده:' : 'Payload Size:'}</span>
              <span className="font-mono font-bold block mt-0.5 text-cyan-600 dark:text-cyan-400">
                {formatSize(item.size)} ({item.size.toLocaleString('fa-IR')} B)
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{lang === 'fa' ? 'نوع سند:' : 'Content Type:'}</span>
              <span className="font-mono truncate block mt-0.5 text-slate-700 dark:text-slate-300">
                {item.type || 'text/plain'}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block">{lang === 'fa' ? 'وضعیت در صف:' : 'Queue Status:'}</span>
              <span className="font-bold block mt-0.5 text-emerald-600 dark:text-emerald-400">
                {item.status === 'broadcasting' ? (lang === 'fa' ? 'در حال ارسال' : 'Transmitting') : item.status === 'completed' ? (lang === 'fa' ? 'تکمیل‌شده' : 'Completed') : (lang === 'fa' ? 'در انتظار پخش' : 'Pending')}
              </span>
            </div>
          </div>

          {/* Priority & Classification Configuration Bar */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-rose-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'fa' ? 'سطح اولویت مخابره (Priority):' : 'Priority Level:'}
                </span>
              </div>

              {/* Priority Buttons */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-800">
                {[
                  { p: 'flash', labelFa: '🔴 آنی / فوری (Flash)', labelEn: 'Flash', bg: 'bg-rose-600 text-white' },
                  { p: 'high', labelFa: '🟡 اولویت بالا (High)', labelEn: 'High', bg: 'bg-amber-500 text-slate-950' },
                  { p: 'normal', labelFa: '🔵 عادی (Normal)', labelEn: 'Normal', bg: 'bg-cyan-600 text-white' },
                  { p: 'bulk', labelFa: '⚪ پس‌زمینه (Bulk)', labelEn: 'Bulk', bg: 'bg-slate-600 text-white' },
                ].map((opt) => (
                  <button
                    key={opt.p}
                    type="button"
                    onClick={() => setPriority(opt.p as DocumentPriority)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                      priority === opt.p
                        ? `${opt.bg} shadow-xs font-black`
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'fa' ? opt.labelFa : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs pt-2.5 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-500" />
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'fa' ? 'طبقه‌بندی امنیتی (Security Classification):' : 'Security Classification:'}
                </span>
              </div>

              {/* Classification Badges */}
              <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-200 dark:bg-slate-800">
                {[
                  { c: 'unclassified', labelFa: 'عادی', labelEn: 'Unclassified', bg: 'bg-emerald-600 text-white' },
                  { c: 'confidential', labelFa: 'محرمانه', labelEn: 'Confidential', bg: 'bg-blue-600 text-white' },
                  { c: 'secret', labelFa: 'خیلی محرمانه', labelEn: 'Secret', bg: 'bg-amber-600 text-white' },
                  { c: 'top_secret', labelFa: 'به کلی سری', labelEn: 'Top Secret', bg: 'bg-rose-700 text-white' },
                  { c: 'financial', labelFa: 'تراکنش مالی / پایا', labelEn: 'Financial', bg: 'bg-purple-600 text-white' },
                ].map((opt) => (
                  <button
                    key={opt.c}
                    type="button"
                    onClick={() => setClassification(opt.c as SecurityClassification)}
                    className={`px-2 py-1 rounded-lg font-bold transition cursor-pointer text-xs ${
                      classification === opt.c
                        ? `${opt.bg} shadow-xs font-black`
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'fa' ? opt.labelFa : opt.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Label Input */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder={lang === 'fa' ? 'عنوان یا برچسب دلخواه برای این سند...' : 'Custom display label for this document...'}
                className="w-full text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Cryptographic Pre-Flight Integrity Verification (SHA-256) */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-emerald-900 dark:text-emerald-300">
              <span className="font-bold flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{lang === 'fa' ? 'اعتبارسنجی یکپارچگی سند (SHA-256 Checksum):' : 'Pre-Flight SHA-256 Integrity Verification:'}</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(calculatedSha256);
                  setCopiedSha(true);
                  setTimeout(() => setCopiedSha(false), 2000);
                }}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer"
              >
                {copiedSha ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                <span>{copiedSha ? (lang === 'fa' ? 'کپی شد' : 'Copied') : (lang === 'fa' ? 'کپی هش' : 'Copy Hash')}</span>
              </button>
            </div>
            <div className="font-mono text-[11px] font-bold text-emerald-950 dark:text-emerald-200 break-all select-all">
              {calculatedSha256 || (lang === 'fa' ? 'در حال محاسبه هش رمزی...' : 'Computing SHA-256...')}
            </div>
          </div>

          {/* Actual Content Viewer / Preview Canvas */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <span>{lang === 'fa' ? 'پیش‌نمایش بصری محتوا (Visual Content Preview):' : 'Visual Content Preview:'}</span>
              </span>

              {fullData && !isImage && (
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(fullData);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="flex items-center gap-1 text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer font-bold"
                >
                  {copiedText ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? (lang === 'fa' ? 'کپی شد' : 'Copied') : (lang === 'fa' ? 'کپی متن کامل' : 'Copy Text')}</span>
                </button>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 p-4 max-h-64 overflow-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8 text-xs text-slate-500">
                  {lang === 'fa' ? 'در حال بارگذاری محتوای سند از حافظه ایزوله...' : 'Loading document payload...'}
                </div>
              ) : isImage && fullData ? (
                /* Image Preview Canvas */
                <div className="flex flex-col items-center justify-center space-y-2">
                  <img
                    src={fullData}
                    alt={item.name}
                    className="max-h-56 max-w-full rounded-xl object-contain shadow-md border border-slate-300 dark:border-slate-700 bg-white"
                  />
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                    {item.name} ({formatSize(item.size)})
                  </span>
                </div>
              ) : isJsonOrText && fullData ? (
                /* Text / JSON Preview */
                <pre className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap break-all leading-relaxed select-text" dir="ltr">
                  {fullData.length > 50000 ? `${fullData.substring(0, 50000)}\n\n[... پیش‌نمایش به ۵۰,۰۰۰ کاراکتر اول محدود شد ...]` : fullData}
                </pre>
              ) : (
                /* Binary File Preview Summary */
                <div className="flex flex-col items-center justify-center py-6 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <File className="w-6 h-6" />
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white">
                    {item.name}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md">
                    {lang === 'fa'
                      ? `فایل باینری از نوع ${item.type || 'application/octet-stream'} به حجم ${formatSize(item.size)} آماده قطعه‌بندی و تبدیل به ماتریس‌های نوری کیوآرکد است.`
                      : `Binary payload ready for optical packetization and transmission.`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onBroadcastNow && (
              <button
                type="button"
                onClick={() => {
                  onBroadcastNow(item);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>{lang === 'fa' ? 'ارسال فوری این سند نوری' : 'Broadcast This Now'}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveAttributes}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
            >
              {lang === 'fa' ? 'ذخیره تغییرات اولویت و نام' : 'Save Changes'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              {lang === 'fa' ? 'انصراف' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
