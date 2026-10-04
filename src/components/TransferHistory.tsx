import React from 'react';
import { Language, AuditLog } from '../types/index';
import { 
  History, 
  Download, 
  Trash2, 
  ArrowUpRight, 
  ShieldCheck, 
  FileText,
  Clock,
  Radio
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
  const exportAsJson = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sayeh-tx-audit-logs-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-r dark:from-slate-900/90 dark:via-slate-900/50 dark:to-purple-950/20 p-5 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-600 dark:text-purple-400 shrink-0">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {lang === 'fa' ? 'سوابق و دفتر کل ارسال (TX Ledger)' : 'Transmitter Transmission Ledger'}
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono font-bold bg-purple-100 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-500/40">
                  {logs.length} {lang === 'fa' ? 'رکورد' : 'Records'}
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {lang === 'fa'
                  ? 'ثبت کلیه بسته‌ها، اسناد و محموله‌های رمزنگاری شده مخابره شده توسط این ایستگاه فرستنده نوری همراه با هش اصالت SHA-256.'
                  : 'Immutable record of encrypted payloads and files optically transmitted by this station with SHA-256 integrity hashes.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {logs.length > 0 && (
              <>
                <button
                  onClick={exportAsJson}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                  <span>{lang === 'fa' ? 'خروجی لاگ (JSON)' : 'Export JSON'}</span>
                </button>
                <button
                  onClick={onClearLogs}
                  className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs font-semibold shadow-xs transition cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>{lang === 'fa' ? 'پاکسازی تاریخچه' : 'Clear Logs'}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Logs Table / List */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 overflow-hidden shadow-sm transition-colors">
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
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">{lang === 'fa' ? 'نوع عملیات' : 'Operation'}</th>
                  <th className="py-3 px-4">{lang === 'fa' ? 'عنوان / نام فایل' : 'Payload / File'}</th>
                  <th className="py-3 px-4">{lang === 'fa' ? 'حجم داده' : 'Size'}</th>
                  <th className="py-3 px-4 font-mono">شناسه انتقال (ID)</th>
                  <th className="py-3 px-4 font-mono">اثر انگشت امنیتی (SHA-256)</th>
                  <th className="py-3 px-4">{lang === 'fa' ? 'زمان ارسال' : 'Timestamp'}</th>
                  <th className="py-3 px-4 text-center">{lang === 'fa' ? 'وضعیت' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 border border-emerald-300 dark:border-emerald-800 text-[11px] font-bold">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>{lang === 'fa' ? 'ارسال نوری' : 'Optical TX'}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-900 dark:text-white font-bold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                      <span className="truncate max-w-xs">{log.fileName || (lang === 'fa' ? 'متن رمزنگاری شده' : 'Encrypted Text')}</span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 font-mono">
                      {(log.totalBytes / 1024).toFixed(2)} KB
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-purple-700 dark:text-purple-400" dir="ltr">
                      {log.transferId}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400" dir="ltr">
                      <span title={log.sha256}>
                        {log.sha256.substring(0, 8)}...{log.sha256.substring(log.sha256.length - 8)}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap font-mono text-[11px]" dir="ltr">
                      <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                        <span>{lang === 'fa' ? 'تأیید شده' : 'Verified'}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
