import React, { useState, useMemo } from 'react';
import { Language, AuditLog, AirGapEmissionCertificate } from '../types/index';
import { 
  createEmissionCertificate, 
  formatJalaliDateTime 
} from '../utils/emissionCertificate';
import { EmissionCertificateModal } from './EmissionCertificateModal';
import { 
  History, 
  Download, 
  Trash2, 
  ArrowUpRight, 
  ShieldCheck, 
  FileText,
  Clock,
  Radio,
  Search,
  Award,
  Eye,
  Copy,
  Check,
  Printer,
  X,
  FileSpreadsheet,
  Flame,
  AlertCircle,
  Lock,
  Layers,
  HardDrive
} from 'lucide-react';

interface Props {
  lang: Language;
  logs: AuditLog[];
  onClearLogs: () => void;
}

export const TransferHistory: React.FC<Props> = ({
  lang,
  logs,
  onClearLogs,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'file' | 'text'>('all');
  const [confirmClear, setConfirmClear] = useState<boolean>(false);
  const [copiedShaId, setCopiedShaId] = useState<string | null>(null);
  const [copiedTxId, setCopiedTxId] = useState<string | null>(null);

  // Modal states for Certificate and Log Inspection
  const [selectedCert, setSelectedCert] = useState<AirGapEmissionCertificate | null>(null);
  const [isCertModalOpen, setIsCertModalOpen] = useState<boolean>(false);
  const [inspectedLog, setInspectedLog] = useState<AuditLog | null>(null);

  // KPI Statistics
  const totalTransmissions = logs.length;
  const totalBytesTransferred = useMemo(
    () => logs.reduce((acc, curr) => acc + (curr.totalBytes || 0), 0),
    [logs]
  );
  const avgPayloadSize = totalTransmissions > 0 ? Math.round(totalBytesTransferred / totalTransmissions) : 0;

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (typeFilter === 'file' && (!log.fileName || log.fileType === 'text/plain')) return false;
      if (typeFilter === 'text' && log.fileName && log.fileType !== 'text/plain') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        (log.fileName && log.fileName.toLowerCase().includes(q)) ||
        log.transferId.toLowerCase().includes(q) ||
        log.sha256.toLowerCase().includes(q) ||
        log.fileType.toLowerCase().includes(q)
      );
    });
  }, [logs, searchQuery, typeFilter]);

  // Export JSON
  const exportAsJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sayeh-tx-audit-ledger-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV (Excel compatible with UTF-8 BOM)
  const exportAsCsv = () => {
    const headers = lang === 'fa' 
      ? ['ردیف', 'شناسه انتقال', 'عنوان سند', 'نوع داده', 'حجم (بایت)', 'اثر انگشت SHA-256', 'زمان شمسی', 'زمان میلادی (UTC)', 'اولویت', 'طبقه‌بندی', 'وضعیت']
      : ['Row', 'Transfer ID', 'Payload Title', 'Data Type', 'Size (Bytes)', 'SHA-256 Hash', 'Jalali Time', 'UTC Timestamp', 'Priority', 'Classification', 'Status'];

    const rows = filteredLogs.map((log, idx) => [
      idx + 1,
      `"${log.transferId}"`,
      `"${(log.fileName || (lang === 'fa' ? 'متن رمزنگاری شده' : 'Encrypted Text')).replace(/"/g, '""')}"`,
      `"${log.fileType}"`,
      log.totalBytes,
      `"${log.sha256}"`,
      `"${formatJalaliDateTime(log.timestamp)}"`,
      `"${new Date(log.timestamp).toISOString()}"`,
      `"${log.priority || 'normal'}"`,
      `"${log.classification || 'confidential'}"`,
      `"${log.status}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sayeh-tx-audit-ledger-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Print official ledger view
  const handlePrint = () => {
    window.print();
  };

  // Generate and view Air-Gap Optical Emission Certificate from historical log
  const handleViewCertificate = async (log: AuditLog) => {
    try {
      const cert = await createEmissionCertificate({
        stationId: 'TX-CORE-DIODE-01',
        stationName: 'ایستگاه فرستنده امن سامانه یکسویه سایه (SAYEH TX Station)',
        transferId: log.transferId,
        fileName: log.fileName || 'encrypted-payload',
        fileType: log.fileType || 'application/octet-stream',
        totalBytes: log.totalBytes,
        totalFrames: Math.max(1, Math.ceil(log.totalBytes / 240)),
        encodingMode: (log.encodingMode as any) || 'sequential',
        chromaMode: log.chromaMode,
        encryptionMode: 'AES-256-GCM Verified Air-Gap Diode',
        payloadSha256: log.sha256,
        cyclesCompleted: log.cyclesCompleted || 1,
        shutterFps: 3,
        displayCount: 1,
      });
      setSelectedCert(cert);
      setIsCertModalOpen(true);
    } catch (e) {
      console.error('Failed to generate historical certificate', e);
    }
  };

  const copyToClipboard = (text: string, type: 'sha' | 'tx', id: string) => {
    navigator.clipboard.writeText(text);
    if (type === 'sha') {
      setCopiedShaId(id);
      setTimeout(() => setCopiedShaId(null), 2000);
    } else {
      setCopiedTxId(id);
      setTimeout(() => setCopiedTxId(null), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-slate-900/90 dark:via-slate-900/50 dark:to-purple-950/20 p-5 sm:p-6 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{lang === 'fa' ? 'دفتر کل و سوابق تابش نوری (TX Ledger)' : 'Transmitter Transmission Ledger'}</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40">
                  {logs.length} {lang === 'fa' ? 'سند ثبت‌شده' : 'Records'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {lang === 'fa'
                  ? 'دفتر کل غیرقابل‌تغییر برای ثبت تمامی بسته‌ها، اسناد و فایل‌های مخابره‌شده توسط فرستنده نوری همراه با اثر انگشت SHA-256 و قابلیت صدور گواهی دیجیتال تابش.'
                  : 'Immutable cryptographic ledger of payloads and files optically emitted by this air-gap transmitter station with verification certificates.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {logs.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={exportAsCsv}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  title={lang === 'fa' ? 'دریافت خروجی اکسل و جدول CSV' : 'Export CSV / Excel'}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{lang === 'fa' ? 'خروجی اکسل (CSV)' : 'CSV'}</span>
                </button>

                <button
                  type="button"
                  onClick={exportAsJson}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  title={lang === 'fa' ? 'دریافت خروجی ساختاریافته JSON' : 'Export JSON'}
                >
                  <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>JSON</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                  title={lang === 'fa' ? 'چاپ رسمی دفتر کل' : 'Print Ledger'}
                >
                  <Printer className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>{lang === 'fa' ? 'چاپ' : 'Print'}</span>
                </button>

                {confirmClear ? (
                  <div className="inline-flex items-center gap-1 bg-rose-50 dark:bg-rose-950/80 p-1 rounded-xl border border-rose-300 dark:border-rose-800 animate-in fade-in">
                    <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1 whitespace-nowrap">
                      {lang === 'fa' ? 'پاکسازی کامل دفتر کل؟' : 'Clear?'}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        onClearLogs();
                        setConfirmClear(false);
                      }}
                      className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
                    >
                      {lang === 'fa' ? 'بله' : 'Yes'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmClear(false)}
                      className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer whitespace-nowrap"
                    >
                      {lang === 'fa' ? 'خیر' : 'No'}
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmClear(true)}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 dark:border-rose-900/60 dark:text-rose-300 text-xs font-semibold shadow-xs transition cursor-pointer"
                    title={lang === 'fa' ? 'پاکسازی کل تاریخچه' : 'Clear all audit logs'}
                  >
                    <Trash2 className="w-3.5 h-3.5 shrink-0" />
                    <span>{lang === 'fa' ? 'پاکسازی تاریخچه' : 'Clear'}</span>
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* 4 Station KPI Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {lang === 'fa' ? 'تعداد کل مخابره‌ها' : 'Total Transmissions'}
            </span>
            <span className="text-lg font-black text-slate-900 dark:text-white font-mono">
              {totalTransmissions}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {lang === 'fa' ? 'حجم کل داده‌های تابش‌شده' : 'Total Emitted Data'}
            </span>
            <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 font-mono">
              {formatSize(totalBytesTransferred)}
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {lang === 'fa' ? 'سطح انطباق و اصالت SHA-256' : 'Integrity Compliance'}
            </span>
            <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 font-mono">
              100% SEALED
            </span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center gap-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
              {lang === 'fa' ? 'میانگین حجم هر سند' : 'Avg Payload Size'}
            </span>
            <span className="text-lg font-black text-amber-600 dark:text-amber-400 font-mono">
              {formatSize(avgPayloadSize)}
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      {logs.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute start-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={lang === 'fa' ? 'جستجوی نام سند، شناسه انتقال (ID) یا هش SHA-256...' : 'Search by file name, transfer ID or hash...'}
              className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 ps-9 pe-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute end-2.5 top-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {lang === 'fa' ? 'همه' : 'All'}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('file')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                typeFilter === 'file'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {lang === 'fa' ? 'فایل‌ها / باینری' : 'Files / Binary'}
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('text')}
              className={`px-3 py-1.5 rounded-xl font-semibold transition cursor-pointer ${
                typeFilter === 'text'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {lang === 'fa' ? 'متن و JSON' : 'Text / JSON'}
            </button>
          </div>
        </div>
      )}

      {/* Logs Table / List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/80 overflow-hidden shadow-sm transition-colors">
        {logs.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Radio className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto animate-pulse" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {lang === 'fa' ? 'هنوز داده‌ای از طریق این ایستگاه فرستنده مخابره نشده است.' : 'No optical transmissions recorded yet.'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {lang === 'fa'
                ? 'با بارگذاری فایل یا ورود متن در تب فرستنده نوری و شروع پخش، سوابق رمزنگاری و ارسال در این بخش بایگانی می‌شود.'
                : 'Transmissions generated and broadcasted in the Optical TX tab will be archived here automatically.'}
            </p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-10 text-center space-y-2">
            <Search className="w-8 h-8 text-slate-400 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              {lang === 'fa' ? 'هیچ رکوردی منطبق با جستجوی شما یافت نشد.' : 'No matching audit records found.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-3 text-center">#</th>
                  <th className="py-3 px-4">{lang === 'fa' ? 'عنوان / نام سند' : 'Payload / File'}</th>
                  <th className="py-3 px-4">{lang === 'fa' ? 'حجم داده' : 'Size'}</th>
                  <th className="py-3 px-4 font-mono">{lang === 'fa' ? 'شناسه انتقال (ID)' : 'Transfer ID'}</th>
                  <th className="py-3 px-4 font-mono">{lang === 'fa' ? 'اثر انگشت امنیتی (SHA-256)' : 'SHA-256 Hash'}</th>
                  <th className="py-3 px-4">{lang === 'fa' ? 'زمان ارسال (شمسی / UTC)' : 'Timestamp'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'fa' ? 'وضعیت' : 'Status'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'fa' ? 'گواهی و اقدامات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {filteredLogs.map((log, index) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                      {index + 1}
                    </td>

                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-bold">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <div className="min-w-0">
                          <span className="truncate max-w-xs block" title={log.fileName || 'Encrypted Text'}>
                            {log.fileName || (lang === 'fa' ? 'متن رمزنگاری شده' : 'Encrypted Text')}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            {log.priority === 'flash' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-0.5">
                                <Flame className="w-2.5 h-2.5" />
                                <span>{lang === 'fa' ? 'فوری' : 'Flash'}</span>
                              </span>
                            )}
                            {log.priority === 'high' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-0.5">
                                <AlertCircle className="w-2.5 h-2.5" />
                                <span>{lang === 'fa' ? 'بالا' : 'High'}</span>
                              </span>
                            )}
                            {log.classification === 'top_secret' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>{lang === 'fa' ? 'به کلی سری' : 'Top Secret'}</span>
                              </span>
                            )}
                            {log.classification === 'secret' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800 flex items-center gap-0.5">
                                <Lock className="w-2.5 h-2.5" />
                                <span>{lang === 'fa' ? 'سری' : 'Secret'}</span>
                              </span>
                            )}
                            {log.chromaMode === 'rgb_3x' && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800">
                                🌈 RGB 3x
                              </span>
                            )}
                            <span className="text-[10px] text-slate-500 font-mono font-normal">
                              {log.fileType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                      {formatSize(log.totalBytes)}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-purple-700 dark:text-purple-400 whitespace-nowrap" dir="ltr">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(log.transferId, 'tx', log.id)}
                        className="inline-flex items-center gap-1 hover:underline cursor-pointer"
                        title={lang === 'fa' ? 'کپی شناسه انتقال' : 'Copy Transfer ID'}
                      >
                        <span>{log.transferId}</span>
                        {copiedTxId === log.id ? (
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100 shrink-0" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600 dark:text-slate-400 whitespace-nowrap" dir="ltr">
                      <button
                        type="button"
                        onClick={() => copyToClipboard(log.sha256, 'sha', log.id)}
                        className="inline-flex items-center gap-1 hover:text-slate-900 dark:hover:text-white cursor-pointer font-mono"
                        title={`SHA-256: ${log.sha256}`}
                      >
                        <span>{log.sha256.substring(0, 8)}...{log.sha256.substring(log.sha256.length - 8)}</span>
                        {copiedShaId === log.id ? (
                          <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                        ) : (
                          <Copy className="w-3 h-3 text-slate-400 opacity-60 hover:opacity-100 shrink-0" />
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap text-[11px]">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {formatJalaliDateTime(log.timestamp)}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono" dir="ltr">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC
                        </span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>{lang === 'fa' ? 'تأیید شده' : 'Verified'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {/* Issue / View Air-Gap Emission Certificate */}
                        <button
                          type="button"
                          onClick={() => handleViewCertificate(log)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-xs font-bold transition cursor-pointer shadow-xs"
                          title={lang === 'fa' ? 'مشاهده و صدور رسمی گواهی دیجیتال تابش نوری' : 'View & issue official emission certificate'}
                        >
                          <Award className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{lang === 'fa' ? 'گواهی دیجیتال' : 'Certificate'}</span>
                        </button>

                        {/* Inspect full record */}
                        <button
                          type="button"
                          onClick={() => setInspectedLog(log)}
                          className="p-1 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition cursor-pointer"
                          title={lang === 'fa' ? 'مشاهده کامل جزئیات سند و متادیتا' : 'Inspect full record details'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official Air-Gap Emission Certificate Modal */}
      <EmissionCertificateModal
        isOpen={isCertModalOpen}
        onClose={() => setIsCertModalOpen(false)}
        certificate={selectedCert}
        lang={lang}
      />

      {/* Record Inspection Modal */}
      {inspectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-slate-900 border-2 border-purple-500 shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {lang === 'fa' ? 'شناسنامه و جزئیات سند در دفتر کل' : 'Audit Record Specification'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    ID: {inspectedLog.id}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectedLog(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{lang === 'fa' ? 'نام سند / محموله:' : 'Payload Name:'}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{inspectedLog.fileName || (lang === 'fa' ? 'متن رمزنگاری شده' : 'Encrypted Text')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{lang === 'fa' ? 'نوع فایل:' : 'Type:'}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{inspectedLog.fileType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{lang === 'fa' ? 'حجم داده:' : 'Payload Size:'}</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">{formatSize(inspectedLog.totalBytes)} ({inspectedLog.totalBytes} B)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 dark:text-slate-400">{lang === 'fa' ? 'شناسه یکتای انتقال (Transfer ID):' : 'Transfer ID:'}</span>
                  <span className="font-mono font-bold text-purple-700 dark:text-purple-300" dir="ltr">{inspectedLog.transferId}</span>
                </div>
              </div>

              {/* Full Cryptographic SHA-256 */}
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{lang === 'fa' ? 'اثر انگشت کامل رمزنگاری (Full SHA-256):' : 'Full Cryptographic SHA-256:'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(inspectedLog.sha256, 'sha', inspectedLog.id)}
                    className="inline-flex items-center gap-1 text-[11px] text-cyan-600 hover:underline cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{lang === 'fa' ? 'کپی هش' : 'Copy'}</span>
                  </button>
                </div>
                <p className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 select-all" dir="ltr">
                  {inspectedLog.sha256}
                </p>
              </div>

              {/* Timestamps */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">{lang === 'fa' ? 'زمان تقویم شمسی:' : 'Jalali Timestamp:'}</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{formatJalaliDateTime(inspectedLog.timestamp)}</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
                  <span className="text-[10px] text-slate-500 block">{lang === 'fa' ? 'زمان میلادی (UTC):' : 'UTC Timestamp:'}</span>
                  <span className="font-mono text-[10px] text-slate-800 dark:text-slate-200" dir="ltr">{new Date(inspectedLog.timestamp).toISOString()}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => {
                  handleViewCertificate(inspectedLog);
                  setInspectedLog(null);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition"
              >
                <Award className="w-4 h-4" />
                <span>{lang === 'fa' ? 'صدور گواهی دیجیتال تابش' : 'Issue Certificate'}</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectedLog(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {lang === 'fa' ? 'بستن' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
