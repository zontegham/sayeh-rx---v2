import React, { useState, useMemo } from 'react';
import { QueueItem, Language } from '../types/index';
import { calculateTransferEstimate, formatDuration } from '../utils/transferTimeEstimator';
import { 
  ListOrdered, 
  Trash2, 
  Plus, 
  Play, 
  Pause,
  ArrowUp, 
  ArrowDown, 
  CheckCircle2, 
  Clock, 
  FileText, 
  FileUp, 
  File, 
  RotateCcw,
  Sparkles,
  Layers,
  Check,
  Search,
  SlidersHorizontal,
  RefreshCw,
  AlertCircle,
  HardDrive,
  Eye,
  Flame,
  ShieldCheck,
  Lock,
  Tag,
  ArrowUpToLine,
  Filter,
  X
} from 'lucide-react';
import { DocumentInspectorModal } from './DocumentInspectorModal';

interface TransmissionQueueManagerProps {
  queue: QueueItem[];
  activeItemId: string | null;
  lang: Language;
  autoAdvance: boolean;
  onToggleAutoAdvance: (val: boolean) => void;
  onSelectActiveItem: (item: QueueItem) => void;
  onDeleteItem: (id: string) => void;
  onClearQueue: () => void;
  onClearCompleted?: () => void;
  onResetAllToPending?: () => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onAddFiles: (files: FileList | File[]) => void;
  onAddCurrentTextToQueue: () => void;
  cyclesPerItem?: number;
  onChangeCyclesPerItem?: (cycles: number) => void;
  transitionDelaySec?: number;
  onChangeTransitionDelaySec?: (sec: number) => void;
  isProcessingBatch?: boolean;
  batchProgressText?: string;
  isTransitioning?: boolean;
  transitionCountdown?: number;
  fps?: number;
  displayCount?: 1 | 2 | 4 | 8 | 16;
  chunkSize?: number;
  onUpdateItem?: (updated: QueueItem) => void;
  onReorderQueue?: (newQueue: QueueItem[]) => void;
}

export const TransmissionQueueManager: React.FC<TransmissionQueueManagerProps> = ({
  queue,
  activeItemId,
  lang,
  autoAdvance,
  onToggleAutoAdvance,
  onSelectActiveItem,
  onDeleteItem,
  onClearQueue,
  onClearCompleted,
  onResetAllToPending,
  onMoveUp,
  onMoveDown,
  onAddFiles,
  onAddCurrentTextToQueue,
  cyclesPerItem = 1,
  onChangeCyclesPerItem,
  transitionDelaySec = 1.5,
  onChangeTransitionDelaySec,
  isProcessingBatch = false,
  batchProgressText = '',
  isTransitioning = false,
  transitionCountdown = 0,
  fps = 3,
  displayCount = 1,
  chunkSize = 240,
  onUpdateItem,
  onReorderQueue,
}) => {
  const [confirmClear, setConfirmClear] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [inspectedItem, setInspectedItem] = useState<QueueItem | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'flash' | 'high' | 'pending' | 'completed'>('all');

  const flashCount = queue.filter((i) => i.priority === 'flash').length;
  const highCount = queue.filter((i) => i.priority === 'high').length;
  const completedCount = queue.filter((i) => i.status === 'completed').length;
  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const totalBytes = useMemo(() => queue.reduce((acc, curr) => acc + curr.size, 0), [queue]);

  const handleSortByPriority = () => {
    if (!onReorderQueue) return;
    const priorityWeight: Record<string, number> = {
      flash: 4,
      high: 3,
      normal: 2,
      bulk: 1,
    };
    const sorted = [...queue].sort((a, b) => {
      const pA = priorityWeight[a.priority || 'normal'] || 2;
      const pB = priorityWeight[b.priority || 'normal'] || 2;
      if (pA !== pB) return pB - pA;
      return a.createdAt - b.createdAt;
    });
    onReorderQueue(sorted);
  };

  const handlePromoteToTop = (originalIndex: number) => {
    if (originalIndex === 0 || !onReorderQueue) return;
    const copy = [...queue];
    const [item] = copy.splice(originalIndex, 1);
    copy.unshift(item);
    onReorderQueue(copy);
  };

  const totalPredictedSeconds = useMemo(() => {
    if (queue.length === 0) return 0;
    return queue.reduce((acc, curr) => {
      const est = calculateTransferEstimate({
        fileSizeBytes: curr.size,
        isBinary: curr.isBinary,
        fps,
        displayCount,
        chunkSize,
        cycles: cyclesPerItem,
      });
      return acc + est.totalCyclesSeconds + (queue.length > 1 ? transitionDelaySec : 0);
    }, 0);
  }, [queue, fps, displayCount, chunkSize, cyclesPerItem, transitionDelaySec]);

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onAddFiles(e.target.files);
      e.target.value = '';
    }
  };

  const filteredQueue = useMemo(() => {
    let result = queue;
    if (priorityFilter === 'flash') {
      result = result.filter((i) => i.priority === 'flash');
    } else if (priorityFilter === 'high') {
      result = result.filter((i) => i.priority === 'high');
    } else if (priorityFilter === 'pending') {
      result = result.filter((i) => i.status === 'pending');
    } else if (priorityFilter === 'completed') {
      result = result.filter((i) => i.status === 'completed');
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase();
    return result.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.type.toLowerCase().includes(q) ||
        (item.customLabel && item.customLabel.toLowerCase().includes(q))
    );
  }, [queue, searchQuery, priorityFilter]);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 shadow-sm p-4 sm:p-5 transition-colors space-y-4">
      {/* Queue Header & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 shrink-0 flex items-center justify-center">
            <ListOrdered className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white flex flex-wrap items-center gap-1.5">
                <span>{lang === 'fa' ? 'صف ارسال هوشمند اسناد' : 'Transmission Queue Spooler'}</span>
                {lang === 'fa' && (
                  <span dir="ltr" className="text-xs font-mono font-normal text-slate-500 dark:text-slate-400 inline-block">
                    (Transmission Queue)
                  </span>
                )}
              </h3>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-cyan-100 dark:bg-cyan-950/80 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800 font-bold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shrink-0">
                <span>{queue.length} {lang === 'fa' ? 'قلم' : 'items'}</span>
                <span className="text-[11px] font-normal text-cyan-600 dark:text-cyan-400">
                  • {formatSize(totalBytes)}
                </span>
              </span>

              {queue.length > 0 && (
                <span className="text-xs px-2.5 py-0.5 rounded-full font-mono bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold whitespace-nowrap inline-flex items-center justify-center gap-1.5 shrink-0" title={lang === 'fa' ? 'پیش‌بینی زمان کل ارسال صف' : 'Total estimated queue duration'}>
                  <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'fa' ? 'زمان کل صف:' : 'Queue ETA:'} {formatDuration(totalPredictedSeconds, lang)}</span>
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {lang === 'fa'
                ? 'مدیریت ارسال ترتیبی فایل‌های حجیم و چندگانه با رمزنگاری ایمن، حافظه تفکیک‌شده و چرخه خودکار.'
                : 'Batch optical spooler with isolated payload storage, adaptive chunking, and auto-progression.'}
            </p>
          </div>
        </div>

        {/* Global Admin Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Add Multiple Files Button */}
          <label className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer transition shadow-xs whitespace-nowrap">
            <Plus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{lang === 'fa' ? 'افزودن فایل‌ها به صف' : 'Add Files to Queue'}</span>
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleFileInputChange}
              disabled={isProcessingBatch}
            />
          </label>

          {/* Add Current Payload */}
          <button
            onClick={onAddCurrentTextToQueue}
            disabled={isProcessingBatch}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer transition shadow-xs disabled:opacity-50 whitespace-nowrap"
            title={lang === 'fa' ? 'افزودن محتوای فعلی به انتهای صف' : 'Add current payload to queue'}
          >
            <FileText className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span>{lang === 'fa' ? 'افزودن پیام فعلی به صف' : 'Queue Current'}</span>
          </button>

          {/* Auto-Advance Toggle */}
          <button
            onClick={() => onToggleAutoAdvance(!autoAdvance)}
            className={`inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap ${
              autoAdvance
                ? 'bg-emerald-100 hover:bg-emerald-200 border-emerald-300 text-emerald-950 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-300'
                : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
            }`}
            title={lang === 'fa' ? 'حرکت خودکار به بسته بعدی پس از پایان ارسال بسته فعلی' : 'Auto-advance to next queued item after full transmission'}
          >
            <RotateCcw className={`w-3.5 h-3.5 shrink-0 ${autoAdvance ? 'text-emerald-600 dark:text-emerald-400' : ''}`} />
            <span>{lang === 'fa' ? (autoAdvance ? 'ارسال خودکار بعدی: روشن' : 'ارسال خودکار بعدی: خاموش') : (autoAdvance ? 'Auto Next: ON' : 'Auto Next: OFF')}</span>
          </button>

          {/* Toggle Advanced Queue Tuning */}
          <button
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
            className={`inline-flex items-center justify-center p-2 rounded-xl border text-xs transition cursor-pointer shadow-xs ${
              showAdvancedSettings
                ? 'bg-cyan-50 dark:bg-cyan-950/60 border-cyan-400 text-cyan-700 dark:text-cyan-300'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'
            }`}
            title={lang === 'fa' ? 'تنظیمات پیشرفته دور و تاخیر انتقال صف' : 'Advanced queue settings'}
          >
            <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
          </button>

          {/* Reset All to Pending */}
          {completedCount > 0 && onResetAllToPending && (
            <button
              onClick={onResetAllToPending}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition cursor-pointer shadow-xs whitespace-nowrap"
              title={lang === 'fa' ? 'تغییر وضعیت همه موارد تکمیل‌شده به در نوبت ارسال مجدد' : 'Reset all completed to pending'}
            >
              <RotateCcw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
              <span>{lang === 'fa' ? 'ارسال مجدد همه' : 'Replay All'}</span>
            </button>
          )}

          {/* Clear Completed Items */}
          {completedCount > 0 && onClearCompleted && (
            <button
              onClick={onClearCompleted}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700 text-xs font-semibold transition cursor-pointer shadow-xs whitespace-nowrap"
              title={lang === 'fa' ? 'حذف موارد ارسال‌شده از صف' : 'Clear completed items'}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>{lang === 'fa' ? `پاکسازی ${completedCount} ارسال‌شده` : `Clear ${completedCount} Done`}</span>
            </button>
          )}

          {/* Clear Queue (Admin Delete Entire Queue) */}
          {queue.length > 0 && (
            confirmClear ? (
              <div className="inline-flex items-center gap-1.5 bg-rose-50 dark:bg-rose-950/80 p-1 rounded-xl border border-rose-300 dark:border-rose-800 animate-in fade-in">
                <span className="text-[11px] font-bold text-rose-700 dark:text-rose-300 px-1 whitespace-nowrap">
                  {lang === 'fa' ? 'مطمئنید صف حذف شود؟' : 'Clear all?'}
                </span>
                <button
                  onClick={() => {
                    onClearQueue();
                    setConfirmClear(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition cursor-pointer whitespace-nowrap"
                >
                  {lang === 'fa' ? 'بله، حذف کل صف' : 'Yes, Delete All'}
                </button>
                <button
                  onClick={() => setConfirmClear(false)}
                  className="px-2 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs transition cursor-pointer whitespace-nowrap"
                >
                  {lang === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmClear(true)}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:hover:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-800 text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
                title={lang === 'fa' ? 'حذف کامل تمام اقلام موجود در صف' : 'Clear entire transmission queue'}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{lang === 'fa' ? 'حذف کامل صف' : 'Clear All'}</span>
              </button>
            )
          )}
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      {showAdvancedSettings && (
        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 space-y-3 animate-in fade-in text-xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            {/* Cycles per item */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'fa' ? 'تعداد دور پخش هر سند قبل از رفتن به بعدی:' : 'Broadcast loops per item:'}
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800">
                {[
                  { c: 1, labelFa: '۱ دور', labelEn: '1 loop' },
                  { c: 2, labelFa: '۲ دور', labelEn: '2 loops' },
                  { c: 3, labelFa: '۳ دور', labelEn: '3 loops' },
                  { c: 5, labelFa: '۵ دور', labelEn: '5 loops' },
                  { c: 0, labelFa: 'بی‌نهایت (∞)', labelEn: 'Infinite' },
                ].map((item) => (
                  <button
                    key={item.c}
                    onClick={() => onChangeCyclesPerItem && onChangeCyclesPerItem(item.c)}
                    className={`px-2.5 py-1 rounded-md font-mono font-bold transition cursor-pointer text-xs ${
                      cyclesPerItem === item.c
                        ? 'bg-cyan-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                    title={lang === 'fa' ? item.labelFa : item.labelEn}
                  >
                    {lang === 'fa' ? item.labelFa : item.labelEn}
                  </button>
                ))}
              </div>
            </div>

            {/* Inter-item transition delay */}
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {lang === 'fa' ? 'تاخیر مکث اپتیکال میان بسته‌ها:' : 'Optical transition gap:'}
              </span>
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-200 dark:bg-slate-800">
                {[
                  { sec: 0.5, label: '0.5s' },
                  { sec: 1.5, label: '1.5s' },
                  { sec: 3.0, label: '3s' },
                ].map((item) => (
                  <button
                    key={item.sec}
                    onClick={() => onChangeTransitionDelaySec && onChangeTransitionDelaySec(item.sec)}
                    className={`px-2.5 py-1 rounded-md font-mono font-bold transition cursor-pointer ${
                      transitionDelaySec === item.sec
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
            {lang === 'fa'
              ? '💡 تنظیم چند دور پخش (مثلاً ۲ دور) تضمین می‌کند که گیرنده‌های با نرخ فریم پایین یا دوربین‌های ضعیف، هیچ قطعه‌ای را از دست ندهند.'
              : '💡 Setting 2 or more loops ensures slower cameras capture 100% of packets before switching files.'}
          </p>
        </div>
      )}

      {/* Batch Processing Indicator */}
      {isProcessingBatch && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 border border-cyan-300 dark:border-cyan-800 text-cyan-900 dark:text-cyan-200 text-xs animate-pulse">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-600 dark:text-cyan-400 shrink-0" />
          <span className="font-semibold">
            {batchProgressText || (lang === 'fa' ? 'در حال ذخیره‌سازی و آماده‌سازی فایل‌ها در صف...' : 'Processing queue payload batch...')}
          </span>
        </div>
      )}

      {/* Inter-item Transition Notice */}
      {isTransitioning && (
        <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-400 dark:border-emerald-600 text-emerald-950 dark:text-emerald-200 text-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span className="font-bold">
              {lang === 'fa'
                ? `بسته با موفقیت مخابره شد. انتقال خودکار به فایل بعدی در ${transitionCountdown} ثانیه...`
                : `Item transmission finished. Advancing to next payload in ${transitionCountdown}s...`}
            </span>
          </div>
          <span className="font-mono text-xs font-black bg-emerald-200 dark:bg-emerald-900 px-2 py-0.5 rounded-full">
            {transitionCountdown}s
          </span>
        </div>
      )}

      {/* Search & Priority Filter Toolbar */}
      {queue.length > 0 && (
        <div className="space-y-2 pt-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="w-4 h-4 absolute start-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={lang === 'fa' ? 'جستجوی نام، برچسب یا فرمت سند در صف...' : 'Search queue by name, label or type...'}
                className="w-full rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 ps-9 pe-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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

            {/* Sort by Priority Button */}
            {onReorderQueue && queue.length > 1 && (
              <button
                type="button"
                onClick={handleSortByPriority}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:hover:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold transition cursor-pointer shadow-xs whitespace-nowrap"
                title={lang === 'fa' ? 'مرتب‌سازی هوشمند صف بر اساس درجه اولویت بسته‌ها (فوری، بالا، عادی)' : 'Sort queue by packet priority (Flash, High, Normal)'}
              >
                <Flame className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'fa' ? 'مرتب‌سازی اولویت‌ها' : 'Sort by Priority'}</span>
              </button>
            )}
          </div>

          {/* Priority / Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => setPriorityFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                priorityFilter === 'all'
                  ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{lang === 'fa' ? 'همه اسناد' : 'All'}</span>
              <span className="ms-1 font-mono text-[11px] opacity-80">({queue.length})</span>
            </button>

            {flashCount > 0 && (
              <button
                type="button"
                onClick={() => setPriorityFilter('flash')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  priorityFilter === 'flash'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/70 border border-rose-200 dark:border-rose-900/60'
                }`}
              >
                <Flame className="w-3 h-3 text-rose-500 fill-current" />
                <span>{lang === 'fa' ? 'فوری' : 'Flash'}</span>
                <span className="font-mono text-[11px]">({flashCount})</span>
              </button>
            )}

            {highCount > 0 && (
              <button
                type="button"
                onClick={() => setPriorityFilter('high')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  priorityFilter === 'high'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/70 border border-amber-200 dark:border-amber-900/60'
                }`}
              >
                <AlertCircle className="w-3 h-3 text-amber-500" />
                <span>{lang === 'fa' ? 'اولویت بالا' : 'High'}</span>
                <span className="font-mono text-[11px]">({highCount})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setPriorityFilter('pending')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                priorityFilter === 'pending'
                  ? 'bg-cyan-600 text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <Clock className="w-3 h-3 text-cyan-500" />
              <span>{lang === 'fa' ? 'در نوبت ارسال' : 'Pending'}</span>
              <span className="font-mono text-[11px]">({pendingCount})</span>
            </button>

            {completedCount > 0 && (
              <button
                type="button"
                onClick={() => setPriorityFilter('completed')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-semibold transition cursor-pointer ${
                  priorityFilter === 'completed'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-teal-50 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 hover:bg-teal-100 dark:hover:bg-teal-950/70 border border-teal-200 dark:border-teal-900/60'
                }`}
              >
                <CheckCircle2 className="w-3 h-3 text-teal-500" />
                <span>{lang === 'fa' ? 'ارسال‌شده' : 'Done'}</span>
                <span className="font-mono text-[11px]">({completedCount})</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Queue Items List */}
      {queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <Layers className="w-9 h-9 text-slate-400 dark:text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
            {lang === 'fa' ? 'صف ارسال در حال حاضر خالی است' : 'Transmission queue is empty'}
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
            {lang === 'fa'
              ? 'چندین فایل را هم‌زمان اضافه کنید تا یکی پس از دیگری با حافظه امن و ایزوله مخابره شوند.'
              : 'Add multiple files or payloads to batch queue for continuous optical transmission.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {filteredQueue.map((item) => {
            const isActive = item.id === activeItemId;
            const originalIndex = queue.findIndex((q) => q.id === item.id);

            return (
              <div
                key={item.id}
                className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-emerald-50/90 border-emerald-400 dark:bg-emerald-950/40 dark:border-emerald-500/60 shadow-sm'
                    : item.status === 'completed'
                    ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800/80 opacity-80'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Order & Metadata */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-mono font-bold shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}>
                    #{originalIndex + 1}
                  </span>

                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 shrink-0">
                    {item.isBinary ? <File className="w-4 h-4 text-cyan-600 dark:text-cyan-400" /> : <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate" title={item.name}>
                        {item.customLabel ? `${item.customLabel} (${item.name})` : item.name}
                      </span>

                      {/* Custom Label Tag */}
                      {item.customLabel && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 flex items-center gap-1">
                          <Tag className="w-2.5 h-2.5" />
                          <span>{item.customLabel}</span>
                        </span>
                      )}

                      {/* Priority Badges */}
                      {item.priority === 'flash' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 flex items-center gap-1 animate-pulse">
                          <Flame className="w-2.5 h-2.5 text-rose-600 dark:text-rose-400" />
                          <span>{lang === 'fa' ? 'فوری (Flash)' : 'Flash'}</span>
                        </span>
                      )}
                      {item.priority === 'high' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                          <span>{lang === 'fa' ? 'بالا (High)' : 'High'}</span>
                        </span>
                      )}
                      {item.priority === 'bulk' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          {lang === 'fa' ? 'فله‌ای' : 'Bulk'}
                        </span>
                      )}

                      {/* Security Classification Badges */}
                      {item.classification === 'top_secret' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-300 border border-red-300 dark:border-red-800 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{lang === 'fa' ? 'به کلی سری' : 'Top Secret'}</span>
                        </span>
                      )}
                      {item.classification === 'secret' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-100 dark:bg-orange-950 text-orange-800 dark:text-orange-300 border border-orange-300 dark:border-orange-800 flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          <span>{lang === 'fa' ? 'سری' : 'Secret'}</span>
                        </span>
                      )}
                      {item.classification === 'confidential' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>{lang === 'fa' ? 'محرمانه' : 'Confidential'}</span>
                        </span>
                      )}
                      {item.classification === 'financial' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800 flex items-center gap-1">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>{lang === 'fa' ? 'مالی' : 'Financial'}</span>
                        </span>
                      )}

                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600 animate-pulse">
                          {lang === 'fa' ? 'در حال ارسال نوری' : 'Transmitting'}
                        </span>
                      )}
                      {!isActive && item.status === 'completed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/80 text-teal-700 dark:text-teal-300 border border-teal-300 dark:border-teal-700 flex items-center gap-1">
                          <Check className="w-2.5 h-2.5" />
                          <span>{lang === 'fa' ? 'مخابره کامل شد' : 'Completed'}</span>
                        </span>
                      )}
                      {item.size > 200 * 1024 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                          <HardDrive className="w-2.5 h-2.5" />
                          <span>{lang === 'fa' ? 'داده حجیم ایزوله' : 'Isolated Heavy'}</span>
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 flex-wrap">
                      <span>{formatSize(item.size)}</span>
                      <span>•</span>
                      <span>{item.type || 'text/plain'}</span>
                      {item.sha256 && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded border border-slate-200 dark:border-slate-700" title={`SHA-256: ${item.sha256}`}>
                            SHA: {item.sha256.substring(0, 8)}...
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/80 text-[10px]" title={lang === 'fa' ? 'پیش‌بینی زمان ارسال نوری این فایل' : 'Estimated optical transfer duration'}>
                        <Clock className="w-2.5 h-2.5 text-emerald-500" />
                        <span>{calculateTransferEstimate({ fileSizeBytes: item.size, isBinary: item.isBinary, fps, displayCount, chunkSize, cycles: cyclesPerItem }, lang).formattedSingleCycle}</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Controls per item */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Promote directly to top (#1 in queue) */}
                  {onReorderQueue && originalIndex > 0 && (
                    <button
                      type="button"
                      onClick={() => handlePromoteToTop(originalIndex)}
                      className="p-1.5 rounded-lg border border-amber-200 dark:border-amber-900/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition cursor-pointer"
                      title={lang === 'fa' ? 'انتقال مستقیم به اول صف (#۱)' : 'Promote to top of queue (#1)'}
                    >
                      <ArrowUpToLine className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Document Inspector & Security Attributes */}
                  <button
                    type="button"
                    onClick={() => setInspectedItem(item)}
                    className="p-1.5 rounded-lg border border-cyan-200 dark:border-cyan-900/60 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-cyan-950/50 transition cursor-pointer"
                    title={lang === 'fa' ? 'بازرسی امنیتی، ویرایش اولویت، برچسب و هش SHA-256' : 'Inspect security attributes, label & SHA-256'}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Select as active / Transmit now */}
                  {!isActive ? (
                    <button
                      type="button"
                      onClick={() => onSelectActiveItem(item)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-950/50 dark:hover:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700 text-xs font-semibold transition cursor-pointer shadow-xs"
                      title={lang === 'fa' ? 'ارسال این فایل هم‌اکنون' : 'Transmit this item now'}
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{lang === 'fa' ? 'ارسال فوری' : 'Transmit'}</span>
                    </button>
                  ) : (
                    <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                      <span>{lang === 'fa' ? 'فعال' : 'Active'}</span>
                    </span>
                  )}

                  {/* Move Up */}
                  <button
                    type="button"
                    disabled={originalIndex === 0}
                    onClick={() => onMoveUp(originalIndex)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title={lang === 'fa' ? 'انتقال به اولویت بالاتر' : 'Move up'}
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  {/* Move Down */}
                  <button
                    type="button"
                    disabled={originalIndex === queue.length - 1}
                    onClick={() => onMoveDown(originalIndex)}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title={lang === 'fa' ? 'انتقال به اولویت پایین‌تر' : 'Move down'}
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Item from Queue */}
                  <button
                    type="button"
                    onClick={() => onDeleteItem(item.id)}
                    className="p-1.5 rounded-lg border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition cursor-pointer"
                    title={lang === 'fa' ? 'حذف این فایل از صف' : 'Delete from queue'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Inspector & Security Classification Modal */}
      {inspectedItem && (
        <DocumentInspectorModal
          isOpen={!!inspectedItem}
          onClose={() => setInspectedItem(null)}
          item={inspectedItem}
          lang={lang}
          onUpdateItem={(updated) => {
            if (onUpdateItem) onUpdateItem(updated);
            setInspectedItem(updated);
          }}
          onBroadcastNow={(itemToBroadcast) => {
            onSelectActiveItem(itemToBroadcast);
            setInspectedItem(null);
          }}
        />
      )}
    </div>
  );
};
