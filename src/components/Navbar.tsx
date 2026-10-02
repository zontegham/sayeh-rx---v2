import React from 'react';
import { 
  Language, 
  TransmitterTab 
} from '../types/index';
import { 
  QrCode, 
  Layers, 
  Key, 
  History, 
  Languages, 
  Sparkles, 
  Sun, 
  Moon, 
  Sliders,
  Radio,
  ShieldCheck,
  WifiOff
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { SayehLogo } from './SayehLogo';

interface Props {
  activeTab: TransmitterTab;
  setActiveTab: (tab: TransmitterTab) => void;
  lang: Language;
  setLang: (l: Language) => void;
  isOnline?: boolean;
  onOpenWizard?: () => void;
}

export const Navbar: React.FC<Props> = ({
  activeTab,
  setActiveTab,
  lang,
  setLang,
  isOnline = true,
  onOpenWizard,
}) => {
  const { theme, toggleTheme } = useTheme();

  // Transmitter Core Navigation Tabs (اختصاصی هسته فرستنده)
  const navItems = [
    {
      id: 'optical_tx' as TransmitterTab,
      labelFa: 'فرستنده نوری',
      labelEn: 'Optical TX',
      icon: QrCode,
      color: 'text-emerald-700 dark:text-emerald-400',
      activeBg: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-bold border-emerald-500/30',
    },
    {
      id: 'inbound_hub' as TransmitterTab,
      labelFa: 'هاب اتصال ورودی',
      labelEn: 'Inbound Data Hub',
      icon: Layers,
      color: 'text-blue-700 dark:text-blue-400',
      activeBg: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 font-bold border-blue-500/30',
    },
    {
      id: 'keys_tx' as TransmitterTab,
      labelFa: 'کلیدهای رمزنگاری',
      labelEn: 'TX Key Vault',
      icon: Key,
      color: 'text-amber-700 dark:text-amber-400',
      activeBg: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 font-bold border-amber-500/30',
    },
    {
      id: 'history_tx' as TransmitterTab,
      labelFa: 'سوابق ارسال',
      labelEn: 'TX Ledger',
      icon: History,
      color: 'text-purple-700 dark:text-purple-400',
      activeBg: 'bg-purple-500/10 text-purple-800 dark:text-purple-300 font-bold border-purple-500/30',
    },
    {
      id: 'settings_tx' as TransmitterTab,
      labelFa: 'تنظیمات فرستنده',
      labelEn: 'TX Settings',
      icon: Sliders,
      color: 'text-teal-700 dark:text-teal-400',
      activeBg: 'bg-teal-500/10 text-teal-800 dark:text-teal-300 font-bold border-teal-500/30',
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between py-2 md:h-16 gap-3">
          {/* Logo & Dedicated Station Identity */}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1.5 transition-colors shrink-0">
              <SayehLogo className="w-full h-full object-contain" size={32} />
            </div>

            <div className="flex flex-col justify-center">
              <div className="flex items-center gap-2">
                <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'سایه' : 'Sayeh'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                  <span>{lang === 'fa' ? 'فرستنده اختصاصی' : 'TX Dedicated'}</span>
                </span>
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 font-normal leading-tight">
                {lang === 'fa' 
                  ? 'ایستگاه فرستنده سامانه امن یکسویه هوشمند (شرکت ژئوتک)' 
                  : 'Intelligent Secure Unidirectional Transmitter Station'}
              </p>
            </div>
          </div>

          {/* Navigation Tabs - Dedicated exclusively for Transmitter */}
          <nav className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-w-full">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`inline-flex items-center justify-center gap-1.5 h-8 sm:h-8.5 px-3 py-1 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer border ${
                    isActive
                      ? `${item.activeBg} border`
                      : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800/80'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? item.color : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{lang === 'fa' ? item.labelFa : item.labelEn}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Step-by-Step Wizard Launcher Button */}
            {onOpenWizard && (
              <button
                onClick={onOpenWizard}
                className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 py-1.5 rounded-xl text-white text-xs font-semibold transition-colors cursor-pointer border shadow-xs whitespace-nowrap bg-emerald-600 hover:bg-emerald-700 border-emerald-600"
                title={lang === 'fa' ? 'شروع فرآیند انتقال با راهنمای گام‌به‌گام' : 'Setup Wizard'}
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-white" />
                <span className="hidden sm:inline">{lang === 'fa' ? 'راهنمای ارسال' : 'Wizard'}</span>
              </button>
            )}

            {/* Offline Isolation Indicator */}
            {!isOnline && (
              <span 
                className="hidden lg:inline-flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 font-mono"
                title={lang === 'fa' ? 'سیستم در حالت آفلاین کامل و ایزوله فیزیکی قرار دارد' : 'System is fully offline and physically isolated'}
              >
                <WifiOff className="w-3 h-3" />
                <span>Air-Gap</span>
              </span>
            )}

            {/* Theme Toggle (Dark / Light) */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center w-9 h-9 p-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-700 dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 text-xs transition-colors cursor-pointer shadow-xs shrink-0"
              title={theme === 'dark' ? (lang === 'fa' ? 'تغییر به تم روشن' : 'Light theme') : (lang === 'fa' ? 'تغییر به تم تاریک' : 'Dark theme')}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 shrink-0 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 shrink-0 text-slate-700" />
              )}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLang(lang === 'fa' ? 'en' : 'fa')}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 dark:border-slate-800 text-slate-800 font-bold dark:bg-slate-900 dark:hover:bg-slate-800 dark:text-slate-200 text-xs font-mono transition-colors cursor-pointer shadow-xs shrink-0 whitespace-nowrap"
              title={lang === 'fa' ? 'Switch to English' : 'تغییر زبان به فارسی'}
            >
              <Languages className="w-3.5 h-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'fa' ? 'EN' : 'فا'}</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
