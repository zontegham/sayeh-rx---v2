import React from 'react';
import { Language } from '../types/index';
import { 
  Monitor, 
  Usb, 
  ShieldAlert, 
  X,
  Radio
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const OfflinePwaExportModal: React.FC<Props> = ({ isOpen, onClose, lang }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-6 shadow-2xl text-slate-800 dark:text-slate-200 max-h-[90vh] overflow-y-auto space-y-5 transition-colors">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {lang === 'fa' 
                ? 'راهنمای راه‌اندازی آفلاین و ایزوله (Air-Gap Deployment Guide)' 
                : 'Offline Air-Gap Deployment Guide'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
          {/* Method 1 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
              <Monitor className="w-4 h-4" />
              <span>
                {lang === 'fa' 
                  ? 'روش اول: نصب مستقیم به عنوان نرم‌افزار مستقل دسکتاپ (PWA Desktop App)' 
                  : 'Method 1: Install as Native Desktop App (PWA)'}
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-200">
              {lang === 'fa'
                ? 'این سامانه استاندارد کامل Progressive Web App را پیاده‌سازی کرده است. در مرورگر (Google Chrome یا Microsoft Edge) روی آیکون نصب در نوار آدرس کلیک کنید. برنامه با آیکون مستقل روی دسکتاپ و منوی استارت ویندوز قرار می‌گیرد و به صورت پنجره اختصاصی و بدون نیاز به نوار مرورگر اجرا می‌شود.'
                : 'This system is built with full Progressive Web App support. In Google Chrome or Microsoft Edge, click the Install App button in the URL bar. The app installs to your Start Menu and Desktop, launching in a dedicated window.'}
            </p>
          </div>

          {/* Method 2 */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-bold">
              <Usb className="w-4 h-4" />
              <span>
                {lang === 'fa' 
                  ? 'روش دوم: استقرار بر روی رایانه ایزوله فرستنده (Air-Gapped Transmitter PC)' 
                  : 'Method 2: Deploying to Isolated Air-Gapped Transmitter PC'}
              </span>
            </div>
            <p className="text-slate-700 dark:text-slate-200">
              {lang === 'fa'
                ? 'به دلیل سرویس‌ورکر (Service Worker) و ذخیره‌سازی محلی کامل، تمامی فرآیندهای بارگذاری اسناد، هش‌گذاری، رمزنگاری پیشرفته نظامی و پخش نوری فریم‌های QR به صورت ۱۰۰٪ آفلاین و بدون وابستگی به هیچ سرور خارجی در مرورگر اجرا می‌شوند.'
                : 'All document loading, hashing, military-grade encryption, and optical QR transmission run 100% locally and offline in the browser engine via Web Crypto. Zero external servers or internet connection are required.'}
            </p>
          </div>

          {/* Security Protocols */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <ShieldAlert className="w-4 h-4" />
              <span>
                {lang === 'fa' ? 'پروتکل‌های امنیتی رعایت شده:' : 'Security & Air-Gap Protocols Enforced:'}
              </span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-400">
              <li>
                <strong>AES-GCM 256:</strong> {lang === 'fa' ? 'رمزنگاری تصدیق‌شده ۲۵۶ بیتی با مقاومت در برابر حملات جعل' : 'Authenticated encryption with tamper detection'}
              </li>
              <li>
                <strong>PBKDF2 SHA-256:</strong> {lang === 'fa' ? 'مشتق‌سازی کلید با ۱۰۰,۰۰۰ دور محاسباتی و سالت ۱۶ بایتی تصادفی' : '100,000 PBKDF2 iterations with CSPRNG 16-byte salt'}
              </li>
              <li>
                <strong>Optical Diode Link:</strong> {lang === 'fa' ? 'جلوگیری فیزیکی از نشت اطلاعات، ارتباط کاملاً یک‌طرفه با دوربین' : 'Strictly unidirectional optical data link preventing any backchannel leak'}
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium cursor-pointer"
          >
            {lang === 'fa' ? 'بستن' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
