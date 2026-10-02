import React, { useState } from 'react';
import { Language, TransmitterCoreConfig, ChromaMultiplexMode, AntiGlareTheme } from '../types/index';
import { 
  Radio, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Save, 
  Download, 
  RefreshCw, 
  Check, 
  Sliders, 
  Layers, 
  Camera, 
  Cpu, 
  Server,
  Play,
  Zap,
  Palette,
  Sun
} from 'lucide-react';

interface Props {
  lang: Language;
  config: TransmitterCoreConfig;
  onSaveConfig: (updated: TransmitterCoreConfig) => void;
  onExportStandaloneTx?: () => void;
}

export const TransmitterCoreSettings: React.FC<Props> = ({
  lang,
  config,
  onSaveConfig,
  onExportStandaloneTx,
}) => {
  const [stationId, setStationId] = useState(config.stationId || 'TX-CORE-DIODE-01');
  const [stationName, setStationName] = useState(config.stationName || 'ایستگاه فرستنده سامانه امن یکسویه هوشمند');
  const [defaultFps, setDefaultFps] = useState(config.defaultFps || 3);
  const [defaultChunkSize, setDefaultChunkSize] = useState(config.defaultChunkSize || 240);
  const [defaultErrorCorrection, setDefaultErrorCorrection] = useState(config.defaultErrorCorrection || 'L');
  const [defaultDisplayCount, setDefaultDisplayCount] = useState(config.defaultDisplayCount || 1);
  const [lockAsDedicatedSender, setLockAsDedicatedSender] = useState(config.lockAsDedicatedSender || false);
  const [requireManualStartOnNewFile, setRequireManualStartOnNewFile] = useState(
    config.requireManualStartOnNewFile !== false
  );
  const [defaultCyclesPerItem, setDefaultCyclesPerItem] = useState(
    config.defaultCyclesPerItem !== undefined ? config.defaultCyclesPerItem : 1
  );
  const [defaultAutoAdvance, setDefaultAutoAdvance] = useState(
    config.defaultAutoAdvance !== undefined ? config.defaultAutoAdvance : true
  );
  const [defaultChromaMode, setDefaultChromaMode] = useState<ChromaMultiplexMode>(
    config.defaultChromaMode || 'mono'
  );
  const [defaultAntiGlareTheme, setDefaultAntiGlareTheme] = useState<AntiGlareTheme>(
    config.defaultAntiGlareTheme || 'additive_dark'
  );
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig({
      stationId,
      stationName,
      defaultFps,
      defaultChunkSize,
      defaultErrorCorrection,
      defaultDisplayCount,
      lockAsDedicatedSender,
      requireManualStartOnNewFile,
      defaultCyclesPerItem,
      defaultAutoAdvance,
      defaultChromaMode,
      defaultAntiGlareTheme,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-slate-900/80 p-5 shadow-sm dark:shadow-xl transition-colors">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 shrink-0">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                {lang === 'fa' ? 'تنظیمات هسته مستقل فرستنده (TX Core)' : 'Transmitter Core Settings'}
                <span className="text-xs px-2 py-0.5 rounded-full font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 font-bold">
                  TX STATION
                </span>
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {lang === 'fa'
                  ? 'پیکربندی پارامترهای موتور تولید نوری، نرخ شاتر، سایز پکت‌ها و قفل ایزولاسیون سخت‌افزاری ایستگاه فرستنده.'
                  : 'Configure independent optical diode parameters, default transmission speeds, and hardware isolation lock.'}
              </p>
            </div>
          </div>

          {onExportStandaloneTx && (
            <button
              onClick={onExportStandaloneTx}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs transition cursor-pointer shadow-xs shrink-0"
              title={lang === 'fa' ? 'راهنمای راه‌اندازی آفلاین فرستنده' : 'Offline Transmitter Guide'}
            >
              <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'fa' ? 'راهنمای راه‌اندازی آفلاین' : 'Offline Guide'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Station Identity */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Cpu className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'fa' ? 'شناسه و مشخصات ایستگاه فرستنده' : 'Transmitter Station Identity'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'نام ایستگاه ارسال:' : 'Station Name:'}
              </label>
              <input
                type="text"
                value={stationName}
                onChange={(e) => setStationName(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3.5 py-2 text-xs text-slate-900 dark:text-white font-medium"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'کد / شناسه ایستگاه (Station ID):' : 'Station Identifier:'}
              </label>
              <input
                type="text"
                value={stationId}
                onChange={(e) => setStationId(e.target.value)}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3.5 py-2 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Default Optical Transmission Parameters */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
            <Sliders className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {lang === 'fa' ? 'تنظیمات پیش‌فرض دیود نوری' : 'Default Optical Diode Parameters'}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'پیش‌فرض نرخ شاتر (FPS):' : 'Default Shutter FPS:'}
              </label>
              <select
                value={defaultFps}
                onChange={(e) => setDefaultFps(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-emerald-300"
              >
                <option value={1}>1 FPS (1000ms)</option>
                <option value={2}>2 FPS (500ms)</option>
                <option value={3}>3 FPS (333ms - بهترین وب‌کم)</option>
                <option value={5}>5 FPS (200ms)</option>
                <option value={8}>8 FPS (125ms)</option>
                <option value={10}>10 FPS (100ms - پرسرعت)</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'پیش‌فرض حجم هر قطعه:' : 'Default Chunk Size:'}
              </label>
              <select
                value={defaultChunkSize}
                onChange={(e) => setDefaultChunkSize(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-cyan-300"
              >
                <option value={180}>180 B ({lang === 'fa' ? 'درشت‌ترین دانه‌ها' : 'Ultra Chunky'})</option>
                <option value={240}>240 B ({lang === 'fa' ? 'استاندارد بهینه' : 'Standard'})</option>
                <option value={350}>350 B ({lang === 'fa' ? 'متوسط' : 'Medium'})</option>
                <option value={500}>500 B ({lang === 'fa' ? 'متراکم' : 'Dense'})</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'سطح تصحیح خطا (ECC):' : 'Error Correction Level:'}
              </label>
              <select
                value={defaultErrorCorrection}
                onChange={(e) => setDefaultErrorCorrection(e.target.value as 'L' | 'M' | 'Q' | 'H')}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-purple-300"
              >
                <option value="L">Level L (7% بازیابی - کمترین چگالی)</option>
                <option value="M">Level M (15% بازیابی - استاندارد)</option>
                <option value="Q">Level Q (25% بازیابی - مقاوم در برابر نویز)</option>
                <option value="H">Level H (30% بازیابی - بالاترین مقاومت)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 3: Manual Transmission Start Policy */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'سیاست شروع پخش و تایید دستی کاربر' : 'Transmission Start & User Confirmation Policy'}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'fa'
                    ? 'تعیین اینکه آیا پس از افزودن فایل یا دریافت داده از سامانه‌ها، پخش نوری منتظر کلیک مستقیم کاربر بماند.'
                    : 'Configure whether optical transmission begins automatically or pauses until user clicks Start.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={requireManualStartOnNewFile}
              dir="ltr"
              onClick={() => setRequireManualStartOnNewFile(!requireManualStartOnNewFile)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner ${
                requireManualStartOnNewFile ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                  requireManualStartOnNewFile ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className={`p-3.5 rounded-xl border text-xs leading-relaxed transition-colors ${
            requireManualStartOnNewFile
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
              : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {requireManualStartOnNewFile ? (
              <div className="flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-emerald-950 dark:text-emerald-300">
                    {lang === 'fa' ? 'حالت فعال (پیش‌فرض امنیتی): شروع صرفاً با کلیک دستی کاربر' : 'Active (Default Security): Manual User Confirmation Required'}
                  </span>
                  <span className="text-[11px] mt-0.5 block">
                    {lang === 'fa'
                      ? 'پس از اضافه شدن هر فایل به صف (چه دستی و چه از طریق وب‌سرویس‌ها)، فرستنده روی حالت آماده‌باش می‌ماند و فریم‌ها تنها زمانی که کاربر روی دکمه شروع کلیک کند پخش می‌شوند.'
                      : 'When files are queued (manually or via APIs), transmission is held in standby until the user clicks Start.'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2">
                <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block text-slate-900 dark:text-slate-200">
                    {lang === 'fa' ? 'شروع خودکار و بلادرنگ (بدون تایید)' : 'Automatic Instant Broadcast'}
                  </span>
                  <span className="text-[11px] mt-0.5 block">
                    {lang === 'fa'
                      ? 'به‌محض بارگذاری یا دریافت داده از سامانه‌ها، پخش نوری فریم‌ها بدون مکث و فوری آغاز خواهد شد.'
                      : 'Optical frames will start transmitting immediately upon loading or receiving without pause.'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Loop Count & Repetition Prevention Policy */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'سیاست تعداد دورهای پخش و جلوگیری از تکرار بیهوده' : 'Broadcast Loop Count & Redundancy Policy'}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'fa'
                    ? 'تعیین سقف دورهای پخش هر سند نوری. پس از پایان سقف تعیین‌شده، پخش متوقف می‌شود تا از انتشار نوری بیهوده داده‌ها جلوگیری گردد.'
                    : 'Set broadcast cycle limits per document. Once finished, optical emission stops to prevent redundant exposure.'}
                </p>
              </div>
            </div>

            {/* Loop count preset buttons */}
            <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              {[
                { val: 1, labelFa: '۱ دور (متوقف پس از پایان)', labelEn: '1 Loop (Stop)', shortFa: '۱ دور', shortEn: '1x' },
                { val: 2, labelFa: '۲ دور (اطمینان بالا)', labelEn: '2 Loops', shortFa: '۲ دور', shortEn: '2x' },
                { val: 3, labelFa: '۳ دور', labelEn: '3 Loops', shortFa: '۳ دور', shortEn: '3x' },
                { val: 5, labelFa: '۵ دور', labelEn: '5 Loops', shortFa: '۵ دور', shortEn: '5x' },
                { val: 0, labelFa: 'نامحدود (تکرار بی‌پایان)', labelEn: 'Infinite Loop', shortFa: 'بی‌نهایت', shortEn: '∞' },
              ].map((opt) => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setDefaultCyclesPerItem(opt.val)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    defaultCyclesPerItem === opt.val
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                  title={lang === 'fa' ? opt.labelFa : opt.labelEn}
                >
                  {lang === 'fa' ? opt.shortFa : opt.shortEn}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs">
            <div className="space-y-0.5">
              <span className="font-bold text-slate-900 dark:text-white block">
                {lang === 'fa' ? 'انتقال خودکار به فایل بعدی صف (Auto-Advance Queue):' : 'Auto-advance to next queued document:'}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block">
                {lang === 'fa'
                  ? 'پس از پایان دورهای تعیین‌شده سند فعلی، بلافاصله سند بعدی صف پخش شود. با پایان کل صف، فرآیند متوقف خواهد شد.'
                  : 'Immediately switch to the next queued item after completing cycles. Stops when queue is finished.'}
              </span>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={defaultAutoAdvance}
              dir="ltr"
              onClick={() => setDefaultAutoAdvance(!defaultAutoAdvance)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-cyan-500/50 shadow-inner ${
                defaultAutoAdvance ? 'bg-cyan-600' : 'bg-slate-300 dark:bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                  defaultAutoAdvance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Section 5: RGB Optical Chroma-Multiplexing & Anti-Glare Calibration */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>{lang === 'fa' ? 'مالتی‌پلکس نوری سه‌رنگ (RGB Chroma 3x) و کالیبراسیون ضد بازتاب' : 'RGB Chroma Multiplexing & Anti-Glare'}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono bg-cyan-100 dark:bg-cyan-950 text-cyan-800 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700 font-bold">
                    300% SPEED
                  </span>
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'fa'
                    ? 'ارسال ۳ کیوآرکد مستقل در کانال‌های قرمز (650nm)، سبز (532nm) و آبی (450nm) در یک فریم نوری جهت ۳ برابر کردن پهنای باند.'
                    : 'Transmits 3 independent QR packets across Red, Green, and Blue optical channels in a single frame.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'حالت پیش‌فرض مالتی‌پلکس نوری:' : 'Default Optical Multiplex Mode:'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'mono' as const, labelFa: '⚡ تک‌رنگ (BW 1x)', labelEn: 'Mono Standard (1x)' },
                  { id: 'rgb_3x' as const, labelFa: '🌈 سه‌رنگ (RGB 3x)', labelEn: 'RGB Chroma (3x)' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDefaultChromaMode(item.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition cursor-pointer text-center ${
                      defaultChromaMode === item.id
                        ? 'bg-cyan-50 dark:bg-cyan-950/80 border-cyan-500 text-cyan-700 dark:text-cyan-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lang === 'fa' ? item.labelFa : item.labelEn}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                {lang === 'fa' ? 'تم نوری و کالیبراسیون ضد بازتاب:' : 'Optical Tone & Anti-Glare Calibration:'}
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { id: 'additive_dark' as const, labelFa: 'تیره اشباع', labelEn: 'Dark Additive' },
                  { id: 'subtractive_light' as const, labelFa: 'روشن CMY', labelEn: 'Subtractive Light' },
                  { id: 'anti_glare' as const, labelFa: 'ضد بازتاب فسفری', labelEn: 'Anti-Glare' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setDefaultAntiGlareTheme(item.id)}
                    className={`p-2 rounded-xl border text-[11px] font-bold transition cursor-pointer text-center ${
                      defaultAntiGlareTheme === item.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/80 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lang === 'fa' ? item.labelFa : item.labelEn}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 6: Hardware Air-Gap Optical Diode Assurance */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'تضمین دیود نوری یکسویه سخت‌افزاری (Air-Gap Data Diode)' : 'Dedicated Hardware Optical Data Diode'}
                </h2>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {lang === 'fa'
                    ? 'این سامانه به‌صورت صددرصد اختصاصی فرستنده (TX Only) ایزوله شده است و فاقد هرگونه کد یا ماژول دریافت داده می‌باشد.'
                    : 'This system is architecturally locked to Transmitter (TX Only) mode with zero receiver code paths.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 border-emerald-300 dark:border-emerald-600 text-emerald-900 dark:text-emerald-300 shadow-xs">
              <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{lang === 'fa' ? 'هسته فرستنده اختصاصی' : 'Dedicated TX Core'}</span>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {savedSuccess ? (
            <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
              <Check className="w-4 h-4" />
              {lang === 'fa' ? 'تنظیمات هسته فرستنده با موفقیت ذخیره شد.' : 'Transmitter settings saved successfully.'}
            </span>
          ) : (
            <span className="text-xs text-slate-500 font-mono">
              {lang === 'fa' ? 'تنظیمات به‌طور مستقل در حافظه ایستگاه فرستنده ثبت می‌شود.' : 'Saved independently in TX station storage.'}
            </span>
          )}

          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{lang === 'fa' ? 'ذخیره تنظیمات هسته فرستنده' : 'Save Transmitter Config'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
