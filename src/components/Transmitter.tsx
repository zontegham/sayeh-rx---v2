import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import QRCode from 'qrcode';
import { 
  EncryptedEnvelope, 
  Language, 
  AuditLog,
  QueueItem
} from '../types/index';
import { 
  encryptPayload, 
  evaluatePasswordStrength, 
  generateRandom256BitKey,
  calculateSha256,
  bufferToBase64
} from '../utils/crypto';
import { packetizeEnvelope } from '../utils/packetizer';
import { 
  savePayloadData, 
  getPayloadData, 
  deletePayloadData, 
  clearAllPayloads 
} from '../utils/payloadStorage';
import { 
  Lock, 
  Key, 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Maximize,
  Maximize2, 
  Minimize2, 
  FileUp, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Sliders, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Download,
  Copy,
  Check,
  Sparkles,
  Layers,
  Camera,
  Grid,
  Table,
  HelpCircle,
  Hash,
  QrCode,
  ZoomIn,
  ZoomOut,
  Columns,
  Plus,
  Minus,
  ListOrdered,
  Focus,
  ScanLine,
  Target,
  Sun,
  Clock,
  Inbox,
  X
} from 'lucide-react';
import { WizardConfig } from './WorkflowWizardModal';
import { TransmissionQueueManager } from './TransmissionQueueManager';
import { TransferTimePredictor } from './TransferTimePredictor';

interface Props {
  lang: Language;
  onLogAudit: (log: AuditLog) => void;
  injectedPayload?: string | null;
  onClearInjectedPayload?: () => void;
  wizardConfig?: WizardConfig | null;
  onOpenWizard?: () => void;
  requireManualStartOnNewFile?: boolean;
}

export const Transmitter: React.FC<Props> = ({
  lang,
  onLogAudit,
  injectedPayload,
  onClearInjectedPayload,
  wizardConfig,
  onOpenWizard,
  requireManualStartOnNewFile = true,
}) => {
  // Input Data States (پیش‌فرض بر روی فایل / سند تنظیم شد)
  const [inputMode, setInputMode] = useState<'text' | 'file'>('file');
  const [textContent, setTextContent] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    type: string;
    size: number;
    base64Data: string;
  } | null>(null);

  // Security / Encryption States
  const [encryptEnabled, setEncryptEnabled] = useState<boolean>(true);
  const [passphrase, setPassphrase] = useState<string>('Sayeh#SecureKey2026!');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);

  // Optical Generation & Shutter Tuning
  const [chunkSize, setChunkSize] = useState<number>(240);
  const [fps, setFps] = useState<number>(3); // Camera Shutter Speed (Frames Per Second)
  const [displayCount, setDisplayCount] = useState<1 | 2 | 4 | 8 | 16>(1); // Number of QRs to display simultaneously (1 to 16)
  const [errorCorrection, setErrorCorrection] = useState<'L' | 'M' | 'Q' | 'H'>('L');
  const [qrSize, setQrSize] = useState<'standard' | 'large' | 'huge'>('standard');

  // Adaptive Optical Readability Engine (حل قطعی مشکل خوانایی در ابعاد کوچک)
  const [autoAdaptiveDensity, setAutoAdaptiveDensity] = useState<boolean>(true);
  const [readabilityPreset, setReadabilityPreset] = useState<'ultra' | 'balanced' | 'dense'>('ultra');
  const [focusedChunkIndex, setFocusedChunkIndex] = useState<number | null>(null);

  // Calculate effective chunk size based on adaptive optical rules & payload volume
  const effectiveChunkSize = useCallback(() => {
    // If payload is heavy (> 50KB or > 250KB), scale up chunk size to keep total frame count safe and fast
    const payloadSize = selectedFile ? selectedFile.size : new TextEncoder().encode(textContent).byteLength;
    if (payloadSize > 250 * 1024) {
      return Math.max(chunkSize, displayCount === 1 ? 750 : displayCount <= 4 ? 500 : 380);
    }
    if (payloadSize > 50 * 1024) {
      return Math.max(chunkSize, displayCount === 1 ? 500 : displayCount <= 4 ? 380 : 260);
    }

    if (!autoAdaptiveDensity) {
      return chunkSize;
    }
    if (readabilityPreset === 'ultra') {
      // Ultra readable: low density chunks -> Version 1-3 QR -> gigantic dots
      switch (displayCount) {
        case 16: return 75;
        case 8: return 95;
        case 4: return 125;
        case 2: return 160;
        default: return 200;
      }
    } else if (readabilityPreset === 'balanced') {
      switch (displayCount) {
        case 16: return 95;
        case 8: return 130;
        case 4: return 170;
        case 2: return 210;
        default: return 260;
      }
    } else {
      // Dense / High throughput
      switch (displayCount) {
        case 16: return 130;
        case 8: return 180;
        case 4: return 230;
        case 2: return 280;
        default: return 360;
      }
    }
  }, [autoAdaptiveDensity, readabilityPreset, displayCount, chunkSize, selectedFile, textContent])();

  // Zoom Scale & Interactive Display Layout Controls (60% to 220%)
  const [qrScale, setQrScale] = useState<number>(100);
  const [gridColumns, setGridColumns] = useState<'auto' | 2 | 3 | 4 | 6 | 8>('auto');
  const [matrixWidth, setMatrixWidth] = useState<'compact' | 'balanced' | 'wide' | 'full'>('wide');

  // In-memory store for heavy data to prevent localStorage quota crash
  const queueDataStore = useRef<Map<string, string>>(new Map());

  // Transmission Queue Manager State (Persisted safely in localStorage)
  const [queue, setQueue] = useState<QueueItem[]>(() => {
    try {
      const saved = localStorage.getItem('sayeh_tx_queue');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [activeQueueItemId, setActiveQueueItemId] = useState<string | null>(() => {
    try {
      const saved = localStorage.getItem('sayeh_tx_queue');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed[0].id;
      }
    } catch {}
    return null;
  });
  const [autoAdvanceQueue, setAutoAdvanceQueue] = useState<boolean>(() => {
    return localStorage.getItem('sayeh_tx_auto_advance') === 'true';
  });

  // Multi-cycle and optical transition delay states
  const [cyclesPerItem, setCyclesPerItem] = useState<number>(() => {
    const saved = localStorage.getItem('sayeh_tx_cycles_per_item');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [transitionDelaySec, setTransitionDelaySec] = useState<number>(() => {
    const saved = localStorage.getItem('sayeh_tx_transition_delay');
    return saved ? parseFloat(saved) : 1.5;
  });
  const [cyclesCompleted, setCyclesCompleted] = useState<number>(0);
  const [isTransitioningQueue, setIsTransitioningQueue] = useState<boolean>(false);
  const [transitionCountdown, setTransitionCountdown] = useState<number>(0);
  const isTransitioningRef = useRef<boolean>(false);

  // Batch file processing state
  const [isProcessingBatch, setIsProcessingBatch] = useState<boolean>(false);
  const [batchProgressText, setBatchProgressText] = useState<string>('');

  // Persist queue settings
  useEffect(() => {
    try {
      localStorage.setItem('sayeh_tx_auto_advance', autoAdvanceQueue ? 'true' : 'false');
    } catch {}
  }, [autoAdvanceQueue]);

  useEffect(() => {
    try {
      localStorage.setItem('sayeh_tx_cycles_per_item', cyclesPerItem.toString());
    } catch {}
  }, [cyclesPerItem]);

  useEffect(() => {
    try {
      localStorage.setItem('sayeh_tx_transition_delay', transitionDelaySec.toString());
    } catch {}
  }, [transitionDelaySec]);

  // Sync queue safely with localStorage: strip heavy payloads to prevent QuotaExceededError
  useEffect(() => {
    try {
      const safeQueue = queue.map((item) => {
        // If data exists, also ensure it's saved in IndexedDB payload store
        if (item.data) {
          savePayloadData(item.id, item.data).catch(() => {});
        }
        // Keep only lightweight metadata or small payload (< 16KB) in localStorage
        if (item.size > 16 * 1024) {
          return { ...item, data: '' };
        }
        return item;
      });
      localStorage.setItem('sayeh_tx_queue', JSON.stringify(safeQueue));
    } catch (e) {
      console.warn('Queue metadata sync warning:', e);
      try {
        const metadataOnly = queue.map((item) => ({ ...item, data: '' }));
        localStorage.setItem('sayeh_tx_queue', JSON.stringify(metadataOnly));
      } catch {}
    }
  }, [queue]);

  // Queue item activation: asynchronously loads payload from payloadStorage if not in memory
  const handleSelectActiveItem = useCallback(async (item: QueueItem) => {
    setActiveQueueItemId(item.id);
    setCyclesCompleted(0);
    setIsTransitioningQueue(false);
    isTransitioningRef.current = false;
    if (requireManualStartOnNewFile) {
      setHasUserStarted(false);
      setIsPlaying(false);
    }

    let itemData = item.data || queueDataStore.current.get(item.id);
    if (!itemData) {
      itemData = (await getPayloadData(item.id)) || '';
    }

    if (item.isBinary) {
      setInputMode('file');
      setSelectedFile({
        name: item.name,
        type: item.type,
        size: item.size,
        base64Data: itemData,
      });
    } else {
      setInputMode('text');
      setTextContent(itemData);
      setSelectedFile(null);
    }

    setQueue((prev) =>
      prev.map((q) => ({
        ...q,
        status: q.id === item.id ? 'broadcasting' : (q.status === 'completed' ? 'completed' : 'pending'),
      }))
    );
  }, []);

  // Add files to queue (multiple files supported with sequential asynchronous caching)
  const handleAddFilesToQueue = useCallback(async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    setIsProcessingBatch(true);
    const total = fileArray.length;
    const newItems: QueueItem[] = [];

    for (let i = 0; i < total; i++) {
      const file = fileArray[i];
      setBatchProgressText(
        lang === 'fa'
          ? `در حال پردازش و رمزنگاری بسته ${i + 1} از ${total} (${file.name})...`
          : `Processing and caching item ${i + 1} of ${total} (${file.name})...`
      );

      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(reader.error);
          reader.readAsDataURL(file);
        });

        const itemId = `queue-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`;
        queueDataStore.current.set(itemId, base64);
        await savePayloadData(itemId, base64);

        const newItem: QueueItem = {
          id: itemId,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: file.size <= 16 * 1024 ? base64 : '',
          isBinary: true,
          status: 'pending',
          createdAt: Date.now() + i,
        };

        newItems.push(newItem);
      } catch (err) {
        console.error('Failed to read file for queue:', file.name, err);
      }
    }

    setQueue((prev) => {
      const updated = [...prev, ...newItems];
      if (!activeQueueItemId && newItems.length > 0) {
        setTimeout(() => handleSelectActiveItem(newItems[0]), 50);
      }
      return updated;
    });

    setIsProcessingBatch(false);
    setBatchProgressText('');
  }, [lang, activeQueueItemId, handleSelectActiveItem]);

  // Add current text payload to queue (with heavy payload protection)
  const handleAddCurrentTextToQueue = useCallback(async () => {
    if (!textContent && !selectedFile) return;

    const itemId = `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    let payload = '';
    let name = '';
    let type = 'text/plain';
    let size = 0;
    let isBinary = false;

    if (inputMode === 'file' && selectedFile) {
      payload = selectedFile.base64Data;
      name = selectedFile.name;
      type = selectedFile.type || 'application/octet-stream';
      size = selectedFile.size;
      isBinary = true;
    } else {
      payload = textContent;
      name = `سند امن (${new Date().toLocaleTimeString('fa-IR')})`;
      type = 'text/plain';
      size = new TextEncoder().encode(textContent).byteLength;
      isBinary = false;
    }

    queueDataStore.current.set(itemId, payload);
    await savePayloadData(itemId, payload);

    const newItem: QueueItem = {
      id: itemId,
      name,
      type,
      size,
      data: size <= 16 * 1024 ? payload : '',
      isBinary,
      status: 'pending',
      createdAt: Date.now(),
    };

    setQueue((prev) => {
      const updated = [...prev, newItem];
      if (!activeQueueItemId) {
        setTimeout(() => handleSelectActiveItem(newItem), 50);
      }
      return updated;
    });
  }, [inputMode, textContent, selectedFile, activeQueueItemId, handleSelectActiveItem]);

  // Clear completed items from queue
  const handleClearCompletedQueue = useCallback(() => {
    setQueue((prev) => {
      const remaining = prev.filter((item) => item.status !== 'completed');
      prev.forEach((item) => {
        if (item.status === 'completed') {
          queueDataStore.current.delete(item.id);
          deletePayloadData(item.id).catch(() => {});
        }
      });
      return remaining;
    });
  }, []);

  // Reset all completed items to pending for re-broadcast
  const handleResetAllToPending = useCallback(() => {
    setCyclesCompleted(0);
    setQueue((prev) =>
      prev.map((item, idx) => ({
        ...item,
        status: idx === 0 ? 'broadcasting' : 'pending',
      }))
    );
    if (queue.length > 0) {
      handleSelectActiveItem(queue[0]);
    }
  }, [queue, handleSelectActiveItem]);

  // Clear entire queue and reset to standby
  const handleClearQueue = useCallback(async () => {
    queueDataStore.current.clear();
    await clearAllPayloads();
    setQueue([]);
    setActiveQueueItemId(null);
    setTextContent('');
    setSelectedFile(null);
    setEnvelope(null);
    setChunks([]);
    setRenderedSlotSvgs({});
    try {
      localStorage.removeItem('sayeh_tx_queue');
    } catch {}
  }, []);

  // Load demo sample payload on demand
  const handleLoadDemoData = useCallback(async () => {
    const demoPayload = JSON.stringify(
      {
        source: 'Online-FinTech-Core',
        status: 'AUTHORIZED',
        transaction_id: 'TX-9824-IR',
        amount_irr: 450000000,
        currency: 'IRR',
        beneficiary: 'IR880190000000123456789001',
        security_token: 'SEC-DIODE-VALID-2026',
        timestamp: new Date().toISOString(),
      },
      null,
      2
    );
    const itemId = `demo-${Date.now()}`;
    queueDataStore.current.set(itemId, demoPayload);
    await savePayloadData(itemId, demoPayload);

    setInputMode('text');
    setTextContent(demoPayload);
    setSelectedFile(null);

    const demoItem: QueueItem = {
      id: itemId,
      name: 'سند مالی و تراکنش نمونه (TX-9824)',
      type: 'application/json',
      size: 320,
      data: demoPayload,
      isBinary: false,
      status: 'broadcasting',
      createdAt: Date.now(),
    };
    setQueue([demoItem]);
    setActiveQueueItemId(demoItem.id);
  }, []);

  // Delete individual queue item
  const handleDeleteQueueItem = useCallback(async (id: string) => {
    queueDataStore.current.delete(id);
    await deletePayloadData(id);

    setQueue((prev) => {
      const filtered = prev.filter((item) => item.id !== id);
      if (activeQueueItemId === id) {
        if (filtered.length > 0) {
          setTimeout(() => handleSelectActiveItem(filtered[0]), 50);
        } else {
          setActiveQueueItemId(null);
          setTextContent('');
          setSelectedFile(null);
          setEnvelope(null);
          setChunks([]);
          setRenderedSlotSvgs({});
        }
      }
      return filtered;
    });
  }, [activeQueueItemId, handleSelectActiveItem]);

  // Reorder queue: move up
  const handleMoveUpQueue = useCallback((index: number) => {
    if (index === 0) return;
    setQueue((prev) => {
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  }, []);

  // Reorder queue: move down
  const handleMoveDownQueue = useCallback((index: number) => {
    setQueue((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
  }, []);

  // Helper for responsive grid columns class
  const getGridColsClass = (cols: 'auto' | 2 | 3 | 4 | 6 | 8, displayCnt: number, isWide: boolean) => {
    if (cols !== 'auto') {
      switch (cols) {
        case 2: return 'grid-cols-2';
        case 3: return 'grid-cols-2 sm:grid-cols-3';
        case 4: return 'grid-cols-2 sm:grid-cols-4';
        case 6: return 'grid-cols-3 sm:grid-cols-6';
        case 8: return 'grid-cols-4 sm:grid-cols-8';
      }
    }
    if (displayCnt === 1) return 'grid-cols-1';
    if (displayCnt === 2) return 'grid-cols-2';
    if (displayCnt === 4) return 'grid-cols-2 sm:grid-cols-4';
    if (displayCnt === 8) return isWide ? 'grid-cols-4 lg:grid-cols-8' : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-8';
    if (displayCnt === 16) return 'grid-cols-4 sm:grid-cols-8';
    return 'grid-cols-1';
  };

  // Animation & On-Demand High-Performance Rendering States
  const [chunks, setChunks] = useState<string[]>([]);
  const svgCacheRef = useRef<Map<string, string>>(new Map());
  const [renderedSlotSvgs, setRenderedSlotSvgs] = useState<Record<number, string>>({});
  const [currentPage, setCurrentPage] = useState<number>(0);
  const [hasUserStarted, setHasUserStarted] = useState<boolean>(!requireManualStartOnNewFile);
  const [isPlaying, setIsPlaying] = useState<boolean>(!requireManualStartOnNewFile);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isWideMode, setIsWideMode] = useState<boolean>(false);

  // High-performance windowed chunk matrix table states (prevents DOM bloat and crashes on thousands of chunks)
  const [ledgerPage, setLedgerPage] = useState<number>(0);
  const [followActiveChunk, setFollowActiveChunk] = useState<boolean>(true);
  const [jumpInput, setJumpInput] = useState<string>('');
  const LEDGER_PAGE_SIZE = 15;

  // Fullscreen viewport & container dimension observer
  const fullscreenCenterRef = useRef<HTMLDivElement | null>(null);
  const [fullscreenDimensions, setFullscreenDimensions] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
    height: typeof window !== 'undefined' ? Math.max(200, window.innerHeight - 150) : 800,
  });

  useEffect(() => {
    if (!isFullscreen) return;

    const measureDimensions = () => {
      if (fullscreenCenterRef.current) {
        const rect = fullscreenCenterRef.current.getBoundingClientRect();
        if (rect.width > 20 && rect.height > 20) {
          setFullscreenDimensions({ width: rect.width, height: rect.height });
          return;
        }
      }
      if (typeof window !== 'undefined') {
        setFullscreenDimensions({
          width: window.innerWidth * 0.96,
          height: Math.max(200, window.innerHeight - 150),
        });
      }
    };

    measureDimensions();

    const resizeObserver = new ResizeObserver(() => {
      measureDimensions();
    });

    if (fullscreenCenterRef.current) {
      resizeObserver.observe(fullscreenCenterRef.current);
    }

    window.addEventListener('resize', measureDimensions);
    window.addEventListener('orientationchange', measureDimensions);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', measureDimensions);
      window.removeEventListener('orientationchange', measureDimensions);
    };
  }, [isFullscreen]);

  // Dynamically calculate optimal CSS grid layout based on browser window / container aspect ratio
  // Ensures QR codes maintain a strictly square (1:1) aspect ratio while filling the maximum possible screen space
  const fullscreenGrid = useMemo(() => {
    const { width, height } = fullscreenDimensions;
    const gap = width < 640 ? 8 : 14;
    // Scale multiplier based on zoom slider (qrScale)
    const scaleFactor = Math.max(0.5, Math.min(2.2, qrScale / 100));

    // Usable screen real estate inside fullscreen center container
    const usableW = Math.max(60, width - (width < 640 ? 12 : 24));
    const usableH = Math.max(60, height - (height < 640 ? 12 : 24));

    const N = displayCount;

    let bestCols: number = 1;
    let bestRows: number = N;
    let maxItemSize = 0;

    if (gridColumns !== 'auto') {
      bestCols = Math.min(N, gridColumns);
      bestRows = Math.ceil(N / bestCols);
      const maxW = (usableW - (bestCols - 1) * gap) / bestCols;
      const maxH = (usableH - (bestRows - 1) * gap) / bestRows;
      maxItemSize = Math.max(20, Math.min(maxW, maxH));
    } else {
      // Test all candidate column counts from 1 to N
      // Find the column count that maximizes square item size (s) within aspect ratio bounds
      for (let c = 1; c <= N; c++) {
        const r = Math.ceil(N / c);
        const maxW = (usableW - (c - 1) * gap) / c;
        const maxH = (usableH - (r - 1) * gap) / r;
        const itemSize = Math.min(maxW, maxH);

        if (itemSize > maxItemSize) {
          maxItemSize = itemSize;
          bestCols = c;
          bestRows = r;
        }
      }
    }

    // Apply zoom scale factor
    const finalItemSize = Math.max(30, Math.floor(maxItemSize * scaleFactor));
    const totalGridW = Math.floor(bestCols * finalItemSize + (bestCols - 1) * gap);
    const totalGridH = Math.floor(bestRows * finalItemSize + (bestRows - 1) * gap);

    return {
      columns: bestCols,
      rows: bestRows,
      itemSize: finalItemSize,
      gridWidth: totalGridW,
      gridHeight: totalGridH,
      gap,
      gridTemplateColumns: `repeat(${bestCols}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${bestRows}, minmax(0, 1fr))`,
    };
  }, [fullscreenDimensions, displayCount, gridColumns, qrScale]);

  // Fullscreen Optical Calibration Test State
  const [isCalibrationOpen, setIsCalibrationOpen] = useState<boolean>(false);
  const [calibrationDensity, setCalibrationDensity] = useState<'low' | 'medium' | 'high'>('low');
  const [calibrationBgTone, setCalibrationBgTone] = useState<'pure_white' | 'anti_glare' | 'dark_inset'>('pure_white');
  const [calibrationSvg, setCalibrationSvg] = useState<string>('');

  useEffect(() => {
    let payload = 'SAYEH-TEST-PASS:0x5341594548 | CONTRAST:100% | ALIGN:PASS';
    let ec: 'L' | 'M' | 'H' = 'M';

    if (calibrationDensity === 'medium') {
      payload = 'SAYEH-CALIBRATION-STANDARD-TEST-PATTERN | BRIGHTNESS:OK | CONTRAST:100% | RESOLUTION:MEDIUM | SYNC:0x5341594548414952474150';
    } else if (calibrationDensity === 'high') {
      payload = 'SAYEH-CALIBRATION-HIGH-DENSITY-TEST-MATRIX | AIR-GAP OPTICAL LINK VERIFICATION PASS | TIMESTAMP:2026-CALIB | CHECKSUM:0xFA7190BC21EA | DENSITY:HIGH-THROUGHPUT';
    }

    QRCode.toString(payload, {
      type: 'svg',
      margin: 3,
      errorCorrectionLevel: ec,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    })
      .then((svg) => setCalibrationSvg(svg))
      .catch((err) => console.error('Failed to generate calibration QR:', err));
  }, [calibrationDensity]);

  const [envelope, setEnvelope] = useState<EncryptedEnvelope | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copiedRaw, setCopiedRaw] = useState<boolean>(false);

  // Frame dwell animation progress (0-100%)
  const [dwellProgress, setDwellProgress] = useState<number>(0);

  // Timer Ref
  const timerRef = useRef<number | null>(null);
  const dwellTimerRef = useRef<number | null>(null);
  const lastLoggedTransferId = useRef<string>('');
  const isAdvancingRef = useRef<boolean>(false);

  // Apply Wizard Config whenever completed
  useEffect(() => {
    if (wizardConfig) {
      if (wizardConfig.flow === 'manual_file') {
        setInputMode(wizardConfig.inputMode);
        if (wizardConfig.inputMode === 'text') {
          setTextContent(wizardConfig.textContent);
        } else if (wizardConfig.selectedFile) {
          setSelectedFile(wizardConfig.selectedFile);
        }
      } else if (wizardConfig.flow === 'system_integration') {
        setInputMode('text');
        if (wizardConfig.verifiedPayload) {
          setTextContent(wizardConfig.verifiedPayload);
        }
      }

      setEncryptEnabled(wizardConfig.encryptEnabled);
      if (wizardConfig.passphrase) setPassphrase(wizardConfig.passphrase);
      setFps(wizardConfig.shutterFps);
      setDisplayCount(wizardConfig.displayCount);
      setErrorCorrection(wizardConfig.errorCorrection);
    }
  }, [wizardConfig]);

  // Handle injected payload from Integration Hub
  useEffect(() => {
    if (injectedPayload) {
      setInputMode('text');
      setTextContent(injectedPayload);
      if (requireManualStartOnNewFile) {
        setHasUserStarted(false);
        setIsPlaying(false);
      }
      if (onClearInjectedPayload) onClearInjectedPayload();
    }
  }, [injectedPayload, onClearInjectedPayload, requireManualStartOnNewFile]);

  // Handle file selection (with auto-queueing)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (files.length > 1) {
      handleAddFilesToQueue(files);
      return;
    }

    const file = files[0];
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      setSelectedFile({
        name: file.name,
        type: file.type || 'application/octet-stream',
        size: file.size,
        base64Data: base64,
      });
      setInputMode('file');
      if (requireManualStartOnNewFile) {
        setHasUserStarted(false);
        setIsPlaying(false);
      }

      // Also ensure it is registered in the queue
      const existing = queue.find((q) => q.name === file.name && q.size === file.size);
      if (!existing) {
        const newItem: QueueItem = {
          id: `queue-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
          data: base64,
          isBinary: true,
          status: 'broadcasting',
          createdAt: Date.now(),
        };
        setQueue((prev) => [...prev, newItem]);
        setActiveQueueItemId(newItem.id);
      }
    };
    reader.readAsDataURL(file);
  };

  // Compile and packetize data
  const generateTransfer = useCallback(async () => {
    setIsProcessing(true);
    // Asynchronous yield to allow React to paint loading state
    await new Promise((r) => setTimeout(r, 10));

    try {
      let rawData = '';
      let meta: { fileName?: string; fileType?: string; isBinary?: boolean } = {};

      if (inputMode === 'file' && selectedFile) {
        rawData = selectedFile.base64Data;
        meta = {
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          isBinary: true,
        };
      } else if (inputMode === 'text' && textContent && textContent.trim()) {
        rawData = textContent;
        meta = {
          fileName: 'data.json',
          fileType: 'application/json',
          isBinary: false,
        };
      }

      // If no file or text is present, return early and keep transmitter in standby state
      if (!rawData || !rawData.trim()) {
        setEnvelope(null);
        setChunks([]);
        setRenderedSlotSvgs({});
        setIsProcessing(false);
        return;
      }

      let env: EncryptedEnvelope;

      if (encryptEnabled) {
        const pass = passphrase || 'AirDiode-Default-2026';
        env = await encryptPayload(rawData, pass, meta);
      } else {
        const dataBytes = new TextEncoder().encode(rawData);
        const hash = await calculateSha256(dataBytes);
        env = {
          version: 2,
          transferId: 'AIR-PLAIN-' + Math.random().toString(36).substring(2, 7).toUpperCase(),
          iv: '',
          salt: '',
          ciphertext: bufferToBase64(dataBytes),
          hash,
          totalBytes: dataBytes.byteLength,
          fileName: meta.fileName,
          fileType: meta.fileType,
          timestamp: Date.now(),
        };
      }

      // Yield again before packetizing to keep browser thread smooth
      await new Promise((r) => setTimeout(r, 0));

      setEnvelope(env);

      // Packetize with camera-optimized dynamic chunk size
      const { chunks: chunkList } = packetizeEnvelope(env, effectiveChunkSize);
      setChunks(chunkList);
      setCurrentPage(0);

      // Update chunk count on active queue item
      if (activeQueueItemId) {
        setQueue((prev) =>
          prev.map((item) =>
            item.id === activeQueueItemId ? { ...item, chunksCount: chunkList.length } : item
          )
        );
      }

      // Log once per unique transferId
      if (env.transferId !== lastLoggedTransferId.current) {
        lastLoggedTransferId.current = env.transferId;
        onLogAudit({
          id: 'tx-' + Date.now(),
          type: 'sent',
          fileName: meta.fileName,
          fileType: meta.fileType || 'text/plain',
          totalBytes: env.totalBytes,
          transferId: env.transferId,
          sha256: env.hash,
          timestamp: Date.now(),
          status: 'success',
        });
      }
    } catch (err) {
      console.error('Failed to generate optical transfer', err);
    } finally {
      setIsProcessing(false);
    }
  }, [inputMode, textContent, selectedFile, encryptEnabled, passphrase, effectiveChunkSize, displayCount, activeQueueItemId, onLogAudit]);

  useEffect(() => {
    generateTransfer();
  }, [generateTransfer]);

  // Exact pagination logic: total pages is Math.ceil(totalChunks / displayCount)
  const totalPages = Math.max(1, Math.ceil(chunks.length / displayCount));
  const activeChunkIndex = Math.min(Math.max(0, chunks.length - 1), currentPage * displayCount);

  // If displayCount or chunks change and currentPage exceeds totalPages, reset safely
  useEffect(() => {
    if (currentPage >= totalPages) {
      setCurrentPage(0);
    }
  }, [currentPage, totalPages]);

  // On-demand lazy rendering of QR SVGs for visible slots (+ prefetch next page)
  useEffect(() => {
    if (chunks.length === 0) {
      setRenderedSlotSvgs({});
      return;
    }

    let isMounted = true;
    const indicesToRender = new Set<number>();

    // Current page visible chunk indices
    for (let i = 0; i < displayCount; i++) {
      const idx = currentPage * displayCount + i;
      if (idx < chunks.length) indicesToRender.add(idx);
    }

    // Prefetch next page chunk indices for zero-latency instant transitions
    for (let i = 0; i < displayCount; i++) {
      const nextIdx = ((currentPage + 1) % totalPages) * displayCount + i;
      if (nextIdx < chunks.length) indicesToRender.add(nextIdx);
    }

    // Also include focusedChunkIndex if zoomed
    if (focusedChunkIndex !== null && focusedChunkIndex < chunks.length) {
      indicesToRender.add(focusedChunkIndex);
    }

    const dynamicMargin = displayCount >= 4 || qrScale < 90 ? 3 : 2;
    const dynamicEc = autoAdaptiveDensity && readabilityPreset === 'ultra' ? 'M' : errorCorrection;

    const renderPromises = Array.from(indicesToRender).map(async (idx) => {
      const chunk = chunks[idx];
      const cacheKey = `${chunk}_${dynamicMargin}_${dynamicEc}`;
      if (svgCacheRef.current.has(cacheKey)) {
        return { idx, svg: svgCacheRef.current.get(cacheKey)! };
      }
      try {
        const svg = await QRCode.toString(chunk, {
          type: 'svg',
          margin: dynamicMargin,
          errorCorrectionLevel: dynamicEc,
          color: { dark: '#000000', light: '#ffffff' },
        });
        if (svgCacheRef.current.size > 250) {
          const firstKey = svgCacheRef.current.keys().next().value;
          if (firstKey) svgCacheRef.current.delete(firstKey);
        }
        svgCacheRef.current.set(cacheKey, svg);
        return { idx, svg };
      } catch (e) {
        console.error('Failed to generate chunk SVG', e);
        return { idx, svg: '' };
      }
    });

    Promise.all(renderPromises).then((results) => {
      if (!isMounted) return;
      const next: Record<number, string> = {};
      results.forEach((r) => {
        if (r.svg) next[r.idx] = r.svg;
      });
      setRenderedSlotSvgs(next);
    });

    return () => {
      isMounted = false;
    };
  }, [chunks, currentPage, displayCount, totalPages, qrScale, autoAdaptiveDensity, readabilityPreset, errorCorrection, focusedChunkIndex]);

  // Clean transition to next queued item with optical delay
  const triggerQueueTransition = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsTransitioningQueue(true);

    // Mark current item as completed in queue
    setQueue((prevQueue) => {
      return prevQueue.map((item) =>
        item.id === activeQueueItemId ? { ...item, status: 'completed' as const } : item
      );
    });

    // Find next pending item (search after current, or wrap around to first pending)
    const curIdx = queue.findIndex((q) => q.id === activeQueueItemId);
    const nextPendingItem =
      queue.find((q, idx) => idx > curIdx && q.status === 'pending') ||
      queue.find((q) => q.status === 'pending' && q.id !== activeQueueItemId);

    if (!nextPendingItem) {
      // All items completed
      setIsTransitioningQueue(false);
      isTransitioningRef.current = false;
      return;
    }

    let count = Math.max(1, Math.round(transitionDelaySec));
    setTransitionCountdown(count);

    const intervalId = window.setInterval(() => {
      count -= 1;
      if (count > 0) {
        setTransitionCountdown(count);
      } else {
        clearInterval(intervalId);
        setIsTransitioningQueue(false);
        isTransitioningRef.current = false;
        handleSelectActiveItem(nextPendingItem);
        setCurrentPage(0);
      }
    }, 1000);
  }, [activeQueueItemId, queue, transitionDelaySec, handleSelectActiveItem]);

  // Handle completion of a full broadcast cycle
  const handleCycleComplete = useCallback(() => {
    if (!autoAdvanceQueue || queue.length <= 1) return;

    setCyclesCompleted((prev) => {
      const nextCycles = prev + 1;
      if (nextCycles >= cyclesPerItem) {
        triggerQueueTransition();
        return 0;
      }
      return nextCycles;
    });
  }, [autoAdvanceQueue, queue.length, cyclesPerItem, triggerQueueTransition]);

  // Carousel timer loop with camera shutter speed sync: advances PAGE BY PAGE.
  useEffect(() => {
    if (!isPlaying || totalPages <= 1 || chunks.length === 0 || isTransitioningQueue || isProcessing) {
      if (timerRef.current) clearInterval(timerRef.current);
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
      setDwellProgress(100);
      return;
    }

    const frameDurationMs = Math.max(100, Math.floor(1000 / fps));
    const dwellStep = 25;
    let elapsed = 0;

    dwellTimerRef.current = window.setInterval(() => {
      elapsed += dwellStep;
      const pct = Math.min(100, (elapsed / frameDurationMs) * 100);
      setDwellProgress(pct);
    }, dwellStep);

    timerRef.current = window.setInterval(() => {
      if (isTransitioningRef.current || isProcessing) return;
      elapsed = 0;
      setCurrentPage((prev) => {
        const next = (prev + 1) % totalPages;
        if (next === 0 && prev === totalPages - 1) {
          setTimeout(() => {
            handleCycleComplete();
          }, 0);
        }
        return next;
      });
    }, frameDurationMs);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (dwellTimerRef.current) clearInterval(dwellTimerRef.current);
    };
  }, [isPlaying, fps, chunks.length, totalPages, isTransitioningQueue, isProcessing, handleCycleComplete]);

  // Download current active QR code as PNG image
  const handleDownloadQrPng = async () => {
    const targetIdx = activeChunkIndex;
    if (!chunks[targetIdx]) return;
    try {
      const dataUrl = await QRCode.toDataURL(chunks[targetIdx], {
        width: 1000,
        margin: 2,
        errorCorrectionLevel: errorCorrection,
      });
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `sayeh-frame-${targetIdx + 1}-of-${chunks.length}.png`;
      a.click();
    } catch (e) {
      console.error('Download QR PNG failed', e);
    }
  };

  const handleDownloadQrSvg = async () => {
    const targetIdx = activeChunkIndex;
    let svg = renderedSlotSvgs[targetIdx];
    if (!svg && chunks[targetIdx]) {
      try {
        svg = await QRCode.toString(chunks[targetIdx], {
          type: 'svg',
          margin: 2,
          errorCorrectionLevel: errorCorrection,
        });
      } catch {}
    }
    if (!svg) return;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sayeh-frame-${targetIdx + 1}-of-${chunks.length}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRaw = () => {
    const targetIdx = activeChunkIndex;
    if (!chunks[targetIdx]) return;
    navigator.clipboard.writeText(chunks[targetIdx]);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const strength = evaluatePasswordStrength(passphrase);

  // Compute exact display slots:
  // For each of the displayCount slots on the current page:
  // If (currentPage * displayCount + i) < chunks.length, it displays the real QR chunk!
  // Otherwise, it is an empty slot placeholder box. NO CIRCULAR REPETITION!
  interface DisplaySlot {
    slotIndex: number;
    chunkIndex: number;
    hasChunk: boolean;
  }

  const slots: DisplaySlot[] = [];
  for (let i = 0; i < displayCount; i++) {
    const cIdx = currentPage * displayCount + i;
    slots.push({
      slotIndex: i,
      chunkIndex: cIdx,
      hasChunk: cIdx < chunks.length,
    });
  }

  const visibleIndices: number[] = slots.filter((s) => s.hasChunk).map((s) => s.chunkIndex);

  // Size styling
  const sizeClasses = {
    standard: 'max-w-[340px]',
    large: 'max-w-[420px]',
    huge: 'max-w-[500px]',
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Data Input & Shutter Controls (Cols 5 in normal, full-width or below QR in wide mode) */}
        <div className={`${isWideMode ? 'order-2 lg:col-span-12' : 'lg:col-span-5'} space-y-6`}>
          {/* Data Source Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-xs p-5 shadow-sm dark:shadow-lg transition-colors">
            <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                {lang === 'fa' ? 'ورودی داده‌ها یا فایل' : 'Data Payload or File'}
              </span>
              <div className="flex items-center p-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 text-xs">
                <button
                  type="button"
                  onClick={() => setInputMode('file')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-bold ${
                    inputMode === 'file'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'fa' ? 'فایل / سند' : 'File / Binary'}
                </button>
                <button
                  type="button"
                  onClick={() => setInputMode('text')}
                  className={`px-3 py-1 rounded-md transition cursor-pointer font-bold ${
                    inputMode === 'text'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {lang === 'fa' ? 'متن / JSON' : 'Text / JSON'}
                </button>
              </div>
            </div>

            {inputMode === 'text' ? (
              <div className="space-y-2">
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={lang === 'fa' ? 'متن، رکورد دیتابیس، تراکنش یا آبجکت JSON را وارد کنید...' : 'Enter text, JSON payload, or system telemetry...'}
                  rows={6}
                  dir="ltr"
                  className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 p-3 text-xs font-mono text-slate-900 dark:text-emerald-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 resize-none transition"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{textContent.length} {lang === 'fa' ? 'کاراکتر' : 'chars'}</span>
                  <span>~{new TextEncoder().encode(textContent).byteLength} {lang === 'fa' ? 'بایت' : 'bytes'}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500/60 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-100/60 dark:bg-slate-950/50 dark:hover:bg-slate-900/60 transition group">
                  <div className="flex flex-col items-center justify-center pt-4 pb-4 text-center px-4">
                    <FileUp className="w-7 h-7 text-slate-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition mb-1" />
                    <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      {lang === 'fa' ? 'کلیک کنید یا فایل را اینجا بکشید' : 'Click to browse or drag file here'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      PDF, ZIP, JSON, CSV, PNG, TXT, DOCX, BIN
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>

                {selectedFile && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-xs">
                    <div className="overflow-hidden">
                      <p className="font-semibold text-emerald-300 truncate">{selectedFile.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'binary'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-400">
                      READY
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Smart Optical Transfer Time Predictor Widget */}
          {((selectedFile && selectedFile.size > 0) || (textContent && textContent.trim().length > 0)) && (
            <TransferTimePredictor
              fileSizeBytes={selectedFile ? selectedFile.size : new TextEncoder().encode(textContent || '').byteLength}
              fileName={selectedFile ? selectedFile.name : (textContent.trim() ? (lang === 'fa' ? 'متن مستقیم ورودی' : 'Direct Text Payload') : undefined)}
              isBinary={inputMode === 'file'}
              fps={fps}
              displayCount={displayCount}
              chunkSize={chunkSize}
              autoAdaptiveDensity={autoAdaptiveDensity}
              cyclesPerItem={cyclesPerItem}
              lang={lang}
              onApplyTuning={(newFps, newDisplayCount) => {
                setFps(newFps);
                setDisplayCount(newDisplayCount);
              }}
              isCurrentlyBroadcasting={isPlaying && chunks.length > 0}
              currentBroadcastingPage={currentPage}
              totalBroadcastingPages={totalPages}
            />
          )}

          {/* Admin Transmission Queue Manager */}
          <TransmissionQueueManager
            queue={queue}
            activeItemId={activeQueueItemId}
            lang={lang}
            autoAdvance={autoAdvanceQueue}
            onToggleAutoAdvance={setAutoAdvanceQueue}
            onSelectActiveItem={handleSelectActiveItem}
            onDeleteItem={handleDeleteQueueItem}
            onClearQueue={handleClearQueue}
            onClearCompleted={handleClearCompletedQueue}
            onResetAllToPending={handleResetAllToPending}
            onMoveUp={handleMoveUpQueue}
            onMoveDown={handleMoveDownQueue}
            onAddFiles={handleAddFilesToQueue}
            onAddCurrentTextToQueue={handleAddCurrentTextToQueue}
            cyclesPerItem={cyclesPerItem}
            onChangeCyclesPerItem={setCyclesPerItem}
            transitionDelaySec={transitionDelaySec}
            onChangeTransitionDelaySec={setTransitionDelaySec}
            isProcessingBatch={isProcessingBatch}
            batchProgressText={batchProgressText}
            isTransitioning={isTransitioningQueue}
            transitionCountdown={transitionCountdown}
            fps={fps}
            displayCount={displayCount}
            chunkSize={chunkSize}
          />

          {/* Cryptography & AES-256 Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-xs p-5 shadow-sm dark:shadow-lg space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800/80 pb-3">
              <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                {lang === 'fa' ? 'امنیت و رمزنگاری داده‌ها' : 'Data Encryption (AES-GCM-256)'}
              </span>
              <div className="flex items-center gap-2.5">
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-colors ${
                  encryptEnabled
                    ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                }`}>
                  {encryptEnabled
                    ? (lang === 'fa' ? 'فعال (رمزنگاری)' : 'Encrypted')
                    : (lang === 'fa' ? 'غیرفعال (متن خام)' : 'Disabled')}
                </span>

                <button
                  type="button"
                  role="switch"
                  aria-checked={encryptEnabled}
                  dir="ltr"
                  onClick={() => setEncryptEnabled((prev) => !prev)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner ${
                    encryptEnabled ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  title={encryptEnabled ? (lang === 'fa' ? 'غیرفعال‌سازی رمزنگاری' : 'Disable encryption') : (lang === 'fa' ? 'فعال‌سازی رمزنگاری' : 'Enable encryption')}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                      encryptEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {!encryptEnabled && (
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    {lang === 'fa'
                      ? 'رمزنگاری غیرفعال است؛ فریم‌ها بدون کلید امنیتی و به‌صورت متن خام تولید می‌شوند.'
                      : 'Encryption is disabled; frames will be generated as unencrypted plaintext.'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setEncryptEnabled(true)}
                  className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shrink-0 cursor-pointer shadow-xs transition"
                >
                  {lang === 'fa' ? 'فعال‌سازی' : 'Enable'}
                </button>
              </div>
            )}

            {encryptEnabled && (
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <label className="text-slate-700 dark:text-slate-300 font-medium">
                      {lang === 'fa' ? 'گذرواژه رمزنگاری (کلید مشترک PSK):' : 'Pre-Shared Encryption Key (PSK):'}
                    </label>
                    <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                      PBKDF2 (100k rounds)
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassphrase ? 'text' : 'password'}
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      placeholder={lang === 'fa' ? 'کلید امنیتی را وارد کنید...' : 'Enter security passphrase...'}
                      className="w-full rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-300 dark:border-slate-800 px-3.5 py-2 text-xs font-mono text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/40"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute end-3 top-2 text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
                    >
                      {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Password Strength Indicator */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500 dark:text-slate-400">
                      {lang === 'fa' ? 'سطح امنیت گذرواژه:' : 'Security level:'}
                    </span>
                    <span className="font-semibold text-slate-700 dark:text-slate-200">
                      {lang === 'fa' ? strength.labelFa : strength.labelEn}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${strength.color}`}
                      style={{ width: `${(strength.score / 4) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Optical QR Display & Chunks Matrix Table (Cols 7 or Top Full-Width Cinema Stage in Wide Mode) */}
        <div className={`${isWideMode ? 'order-1 lg:col-span-12' : 'lg:col-span-7'} space-y-6`}>
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 backdrop-blur-xs p-5 sm:p-6 shadow-sm dark:shadow-xl flex flex-col items-center transition-colors">
            {/* Header info & Size Buttons */}
            <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-200 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isPlaying ? 'bg-emerald-400 opacity-75' : 'bg-slate-400 dark:bg-slate-500'}`}></span>
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${isPlaying ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-500'}`}></span>
                </span>
                <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                  {lang === 'fa' ? 'خروجی نوری کیوآرکد (Vector Optical Display)' : 'Vector Optical Display'}
                </span>
                {!hasUserStarted && chunks.length > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 font-mono font-bold border border-amber-300 dark:border-amber-500/40 animate-pulse">
                    {lang === 'fa' ? 'آماده‌باش (کلیک برای شروع)' : 'STANDBY (CLICK TO START)'}
                  </span>
                )}
                {displayCount > 1 && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-mono font-bold border border-cyan-200 dark:border-cyan-500/40">
                    {displayCount}x GRID
                  </span>
                )}
                {isWideMode && (
                  <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-500/40">
                    {lang === 'fa' ? 'صفحه عریض' : 'Widescreen'}
                  </span>
                )}
              </div>

              {/* QR Size buttons, Full-Width & Fullscreen Controls */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs gap-1">
                  <button
                    onClick={() => { setQrSize('standard'); setQrScale(100); }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                      qrScale === 100 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'fa' ? 'معمولی' : 'Normal'}
                  </button>
                  <button
                    onClick={() => { setQrSize('large'); setQrScale(140); }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                      qrScale === 140 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'fa' ? 'بزرگ' : 'Large'}
                  </button>
                  <button
                    onClick={() => { setQrSize('huge'); setQrScale(180); }}
                    className={`px-2.5 py-1 rounded-lg transition cursor-pointer font-bold ${
                      qrScale === 180 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {lang === 'fa' ? 'خیلی بزرگ' : 'Huge'}
                  </button>
                </div>

                {/* دکمه تمام‌عرض (حالت عریض افقی متناسب با مانیتورهای عریض) */}
                <button
                  onClick={() => setIsWideMode(!isWideMode)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition cursor-pointer shadow-xs ${
                    isWideMode
                      ? 'bg-cyan-100 hover:bg-cyan-200 border-cyan-300 text-cyan-950 font-extrabold dark:bg-cyan-950/80 dark:border-cyan-500/50 dark:text-cyan-300 shadow-cyan-950/20'
                      : 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-slate-200'
                  }`}
                  title={lang === 'fa' ? 'تغییر به حالت تمام‌عرض متناسب با نمایشگرهای عریض' : 'Toggle Full-Width Widescreen Mode'}
                >
                  <Maximize className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>{lang === 'fa' ? (isWideMode ? 'چینش عریض' : 'تمام‌عرض') : (isWideMode ? 'Wide View' : 'Full Width')}</span>
                </button>

                {/* دکمه تمام‌صفحه (Fullscreen) */}
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs transition cursor-pointer shadow-xs"
                  title={lang === 'fa' ? 'نمایش تمام‌صفحه (Fullscreen)' : 'Fullscreen Presentation'}
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{lang === 'fa' ? 'تمام‌صفحه' : 'Fullscreen'}</span>
                </button>
              </div>
            </div>

            {/* Direct Optical Tuning Controls Bar (تنظیم تعداد نمایش و نرخ شاتر دوربین مستقیماً در صفحه کیوآرکد) */}
            <div className="w-full mb-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-3 transition-colors">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* 1. تعداد نمایش QR ها (1 Single, 2 Dual, 4 Quad) */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <QrCode className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{lang === 'fa' ? 'تعداد نمایش کیوآرکد:' : 'QR Display Count:'}</span>
                  </span>
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                    {[
                      { count: 1, labelFa: 'تک', labelEn: '1x' },
                      { count: 2, labelFa: '۲ تایی', labelEn: '2x' },
                      { count: 4, labelFa: '۴ تایی', labelEn: '4x' },
                      { count: 8, labelFa: '۸ تایی', labelEn: '8x' },
                      { count: 16, labelFa: '۱۶ تایی (۴×۴)', labelEn: '16x Max' },
                    ].map((item) => (
                      <button
                        key={item.count}
                        onClick={() => setDisplayCount(item.count as 1 | 2 | 4 | 8 | 16)}
                        className={`px-2 py-1 rounded-md transition cursor-pointer text-xs font-bold ${
                          displayCount === item.count
                            ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950/20 dark:shadow-cyan-950/50'
                            : 'text-slate-700 dark:text-slate-300 hover:text-black dark:hover:text-white'
                        }`}
                      >
                        {lang === 'fa' ? item.labelFa : item.labelEn}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wizard Restart / Adjust Button */}
                {onOpenWizard && (
                  <button
                    onClick={onOpenWizard}
                    className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 dark:hover:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-500/40 px-3 py-1 rounded-xl transition cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{lang === 'fa' ? 'راه‌اندازی با ویزارد' : 'Re-open Wizard'}</span>
                  </button>
                )}
              </div>

              {/* 2. تنظیم شاتر دوربین در هر ثانیه (Camera Shutter Speed / FPS) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{lang === 'fa' ? 'شاتر دوربین در هر ثانیه:' : 'Camera Shutter / FPS:'}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded">
                    {fps} {lang === 'fa' ? 'فریم/ثانیه' : 'FPS'} ({Math.round(1000 / fps)}ms)
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {[1, 2, 3, 5, 8, 10].map((presetFps) => (
                    <button
                      key={presetFps}
                      onClick={() => setFps(presetFps)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono transition cursor-pointer ${
                        fps === presetFps
                          ? 'bg-emerald-500 text-slate-950 font-extrabold shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                      title={presetFps === 3 ? (lang === 'fa' ? 'بهترین حالت هماهنگ با شاتر وب‌کم' : 'Best for standard webcams') : ''}
                    >
                      {presetFps} {lang === 'fa' ? 'فریم' : 'fps'}{presetFps === 3 ? ' ★' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. تنظیم حجم هر قطعه و سطح تصحیح خطا (Chunk Size & Error Correction) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{lang === 'fa' ? 'حجم هر قطعه (بایت):' : 'Chunk Size:'}</span>
                  </span>
                  <select
                    value={chunkSize}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setChunkSize(val);
                      setAutoAdaptiveDensity(false);
                    }}
                    className="rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 px-2.5 py-1 text-xs text-slate-800 dark:text-cyan-300 font-mono font-bold cursor-pointer"
                  >
                    <option value={180}>180 B ({lang === 'fa' ? 'درشت و خوانا' : 'Light'})</option>
                    <option value={240}>240 B ({lang === 'fa' ? 'استاندارد بهینه' : 'Standard'})</option>
                    <option value={350}>350 B ({lang === 'fa' ? 'متوسط' : 'Medium'})</option>
                    <option value={500}>500 B ({lang === 'fa' ? 'فشرده' : 'Dense'})</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{lang === 'fa' ? 'تصحیح خطا:' : 'Error Corr:'}</span>
                  </span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono">
                    {(['L', 'M', 'Q', 'H'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => {
                          setErrorCorrection(lvl);
                          setAutoAdaptiveDensity(false);
                        }}
                        className={`px-2.5 py-0.5 rounded-md transition cursor-pointer font-bold ${
                          errorCorrection === lvl
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. کنترل ابعاد و زوم کیوآرکد و ستون‌های نمایش (Proportional Scale, Zoom Slider & Grid Columns) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
                {/* نوار زوم و اسلایدر ابعاد */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                    <span>{lang === 'fa' ? 'ابعاد و زوم کیوآرکد:' : 'QR Scale & Zoom:'}</span>
                  </span>
                  
                  <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                    <button
                      onClick={() => setQrScale((prev) => Math.max(60, prev - 10))}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title={lang === 'fa' ? 'کوچک‌تر' : 'Zoom Out'}
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <input
                      type="range"
                      min={60}
                      max={220}
                      step={5}
                      value={qrScale}
                      onChange={(e) => setQrScale(Number(e.target.value))}
                      className="w-20 sm:w-28 accent-emerald-500 cursor-pointer"
                    />
                    <button
                      onClick={() => setQrScale((prev) => Math.min(220, prev + 10))}
                      className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition cursor-pointer"
                      title={lang === 'fa' ? 'بزرگ‌تر' : 'Zoom In'}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-300 min-w-[38px] text-center">
                      {qrScale}%
                    </span>
                  </div>
                </div>

                {/* انتخاب ستون‌های ماتریس بر اساس مانیتور */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5">
                    <Columns className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                    <span>{lang === 'fa' ? 'تعداد ستون‌ها:' : 'Columns:'}</span>
                  </span>
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-mono">
                    {(['auto', 2, 3, 4, 6, 8] as const).map((col) => (
                      <button
                        key={col}
                        onClick={() => setGridColumns(col)}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer font-bold ${
                          gridColumns === col
                            ? 'bg-cyan-500 text-slate-950 shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {col === 'auto' ? (lang === 'fa' ? 'خودکار' : 'Auto') : `${col}x`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* عرض کادر ماتریس */}
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-700 dark:text-slate-300 font-semibold">
                    {lang === 'fa' ? 'عرض کادر:' : 'Width:'}
                  </span>
                  <div className="flex items-center p-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                    {(['compact', 'balanced', 'wide', 'full'] as const).map((w) => (
                      <button
                        key={w}
                        onClick={() => setMatrixWidth(w)}
                        className={`px-2 py-0.5 rounded-md transition cursor-pointer font-bold text-[11px] ${
                          matrixWidth === w
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                        }`}
                      >
                        {w === 'compact' ? (lang === 'fa' ? 'فشرده' : 'Compact') : w === 'balanced' ? (lang === 'fa' ? 'متعادل' : 'Balanced') : w === 'wide' ? (lang === 'fa' ? 'عریض' : 'Wide') : (lang === 'fa' ? 'تمام‌عرض' : 'Full')}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. بهینه‌ساز خوانایی اپتیکال برای دوربین (Optical Readability Booster) */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-emerald-500/5 -mx-3.5 -mb-3.5 p-3 rounded-b-2xl border-emerald-500/20">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <ScanLine className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>{lang === 'fa' ? 'تقویت خوانایی دوربین:' : 'Camera Readability Booster:'}</span>
                  </span>

                  {/* 3 Readability Presets */}
                  <div className="flex items-center p-0.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-2xs">
                    <button
                      onClick={() => setReadabilityPreset('ultra')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer font-bold text-xs flex items-center gap-1 ${
                        readabilityPreset === 'ultra'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                      title={lang === 'fa' ? 'خانه‌های فوق‌العاده درشت و خلوت (ایده‌آل برای خواندن توسط انواع وب‌کم و گوشی)' : 'Ultra high readability with chunky dots'}
                    >
                      <span>{lang === 'fa' ? '🟢 حداکثر خوانایی (خانه‌های درشت)' : 'Ultra Readable'}</span>
                    </button>

                    <button
                      onClick={() => setReadabilityPreset('balanced')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer font-bold text-xs ${
                        readabilityPreset === 'balanced'
                          ? 'bg-cyan-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{lang === 'fa' ? '🔵 متعادل' : 'Balanced'}</span>
                    </button>

                    <button
                      onClick={() => setReadabilityPreset('dense')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer font-bold text-xs ${
                        readabilityPreset === 'dense'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <span>{lang === 'fa' ? '🟣 متراکم (پرسرعت)' : 'Dense (Turbo)'}</span>
                    </button>
                  </div>
                </div>

                {/* Auto Adaptive Toggle & Live Effective Indicator */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={autoAdaptiveDensity}
                      onChange={(e) => setAutoAdaptiveDensity(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>{lang === 'fa' ? 'تطبیق خودکار با شبکه' : 'Auto-adapt density'}</span>
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                    {effectiveChunkSize}B / فریم
                  </span>
                </div>
              </div>
            </div>

            {/* QR Card Container: Scaled dynamically based on qrScale and matrixWidth */}
            <div 
              style={{
                maxWidth: matrixWidth === 'full' 
                  ? '100%' 
                  : matrixWidth === 'wide' 
                  ? `${Math.round(1550 * (qrScale / 100))}px` 
                  : matrixWidth === 'balanced'
                  ? `${Math.round(1080 * (qrScale / 100))}px`
                  : `${Math.round(740 * (qrScale / 100))}px`,
              }}
              className="w-full mx-auto transition-all duration-200 flex flex-col items-center justify-center"
            >
              {/* Manual User Start Confirmation Gate */}
              {chunks.length > 0 && !hasUserStarted && (
                <div className="w-full mb-3.5 p-3 sm:p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/90 border border-slate-300 dark:border-emerald-700/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in select-none">
                  <div className="flex items-center gap-2.5 text-center sm:text-start min-w-0">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0">
                      <Play className="w-4 h-4 fill-current animate-pulse" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs sm:text-sm font-black text-slate-950 dark:text-white flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                        <span className="text-slate-950 dark:text-white font-extrabold">{lang === 'fa' ? 'فایل آماده ارسال است (در انتظار دستور شروع شما)' : 'Payload Ready (Awaiting User Start)'}</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700">
                          {chunks.length} {lang === 'fa' ? 'قطعه نوری' : 'Frames'}
                        </span>
                      </h4>
                      <p className="text-[11px] font-semibold text-slate-800 dark:text-slate-300 mt-0.5">
                        {lang === 'fa'
                          ? 'برای آغاز چرخش فریم‌های کیوآرکد و مخابره به گیرنده، بر روی دکمه شروع فرآیند کلیک نمایید.'
                          : 'Click the button to initiate optical frame cycling and transmission.'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setHasUserStarted(true);
                      setIsPlaying(true);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md hover:scale-105 active:scale-95 transition cursor-pointer shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{lang === 'fa' ? 'شروع فرآیند ارسال نوری' : 'Start Transmission'}</span>
                  </button>
                </div>
              )}
              {chunks.length === 0 ? (
                /* Standby State: No files or data in transmission queue */
                <div className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-slate-50 dark:bg-slate-900/60 border-2 border-dashed border-slate-300 dark:border-slate-800 flex flex-col items-center justify-center text-center space-y-4 my-4 animate-in fade-in select-none">
                  <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shadow-inner">
                    <Inbox className="w-8 h-8" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                      {lang === 'fa' ? 'صف ارسال در حال حاضر خالی است' : 'Transmission Queue is Empty'}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                      {lang === 'fa'
                        ? 'هیچ فایلی یا متنی برای پخش کیوآرکد انتخاب نشده است. برای شروع انتقال نوری، فایلی را در صف قرار دهید یا متنی بنویسید.'
                        : 'No files or payload selected for transmission. Upload files, type text, or load demo sample data to start.'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                    <label className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition">
                      <FileUp className="w-4 h-4" />
                      <span>{lang === 'fa' ? 'انتخاب و افزودن فایل به صف' : 'Add File to Queue'}</span>
                      <input type="file" multiple className="hidden" onChange={handleFileChange} />
                    </label>
                    <button
                      onClick={handleLoadDemoData}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs cursor-pointer border border-slate-300 dark:border-slate-700 transition"
                    >
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>{lang === 'fa' ? 'بارگذاری داده نمونه (Demo)' : 'Load Demo Data'}</span>
                    </button>
                  </div>
                </div>
              ) : displayCount === 1 ? (
                /* Single QR View: Scales proportionally with qrScale */
                <div 
                  style={{
                    width: `${Math.round(380 * (qrScale / 100))}px`,
                    maxWidth: '96vw',
                  }}
                  className="relative p-5 sm:p-6 rounded-2xl bg-white shadow-2xl flex items-center justify-center aspect-square border-4 border-slate-300 dark:border-slate-700 transition-all duration-200 overflow-hidden"
                >
                  {renderedSlotSvgs[activeChunkIndex] ? (
                    <div
                      className="w-full h-full min-h-0 min-w-0 flex items-center justify-center select-none [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:aspect-square [&>svg]:object-contain [&>svg]:block [&>svg]:m-auto"
                      dangerouslySetInnerHTML={{ __html: renderedSlotSvgs[activeChunkIndex] }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
                      <RefreshCw className="w-8 h-8 animate-spin mb-2 text-emerald-600 dark:text-emerald-400" />
                      <span>Generating QR...</span>
                    </div>
                  )}

                  <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-emerald-500 pointer-events-none" />
                  <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-emerald-500 pointer-events-none" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-emerald-500 pointer-events-none" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-emerald-500 pointer-events-none" />
                </div>
              ) : (
                /* Multi-QR Grid (2, 4, 8, or 16 QRs): Resizes with gridColumns and qrScale. Empty slots shown as dashed boxes! */
                <div 
                  className={`w-full grid ${getGridColsClass(gridColumns, displayCount, isWideMode)} gap-2 sm:gap-3 transition-all duration-200`}
                >
                  {slots.map((slot) => (
                    slot.hasChunk ? (
                      <div
                        key={slot.chunkIndex}
                        onClick={() => setFocusedChunkIndex(slot.chunkIndex)}
                        className="group relative p-1.5 sm:p-2 rounded-2xl bg-white shadow-md flex flex-col items-center justify-between aspect-square border-2 border-slate-300 dark:border-slate-700 transition-all hover:border-emerald-500 hover:shadow-xl hover:scale-[1.02] cursor-pointer overflow-hidden"
                        title={lang === 'fa' ? `کلیک برای فوکوس و بزرگ‌نمایی فریم #${slot.chunkIndex + 1}` : `Click to zoom & focus frame #${slot.chunkIndex + 1}`}
                      >
                        {/* Dedicated mini header bar above QR: zero overlap with QR quiet zone */}
                        <div className="w-full shrink-0 flex items-center justify-between pb-0.5 px-1 text-[9px] sm:text-[10px] font-mono text-slate-700 border-b border-slate-100 select-none">
                          <span className="font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-slate-900">
                            #{slot.chunkIndex + 1}
                          </span>
                          <span className="hidden sm:inline-flex items-center gap-0.5 text-[8px] text-emerald-700 group-hover:text-emerald-800 font-sans font-semibold">
                            <Focus className="w-2.5 h-2.5" />
                            <span>{lang === 'fa' ? 'فوکوس' : 'Focus'}</span>
                          </span>
                        </div>

                        {/* Unobstructed Pure White QR Matrix */}
                        <div className="w-full flex-1 min-h-0 min-w-0 flex items-center justify-center p-1 sm:p-1.5 overflow-hidden select-none">
                          {renderedSlotSvgs[slot.chunkIndex] && (
                            <div
                              className="w-full h-full min-h-0 min-w-0 flex items-center justify-center select-none [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:aspect-square [&>svg]:object-contain [&>svg]:block [&>svg]:m-auto"
                              dangerouslySetInnerHTML={{ __html: renderedSlotSvgs[slot.chunkIndex] }}
                            />
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Empty Box Placeholder for unfilled slot (e.g. 7 of 16 used, remaining 9 are empty) */
                      <div
                        key={`empty-${slot.slotIndex}`}
                        className="relative p-2 rounded-xl border-2 border-dashed border-slate-300/80 dark:border-slate-700/60 bg-slate-100/40 dark:bg-slate-900/30 flex flex-col items-center justify-center aspect-square text-slate-400 dark:text-slate-600 select-none"
                      >
                        <span className="text-[10px] sm:text-xs font-mono font-bold">
                          {lang === 'fa' ? 'خالی' : 'Empty'}
                        </span>
                        <span className="text-[9px] font-mono opacity-50">
                          ({slot.slotIndex + 1})
                        </span>
                      </div>
                    )
                  ))}
                </div>
              )}
            </div>

            {/* Progress Bar & Frame Index Controls */}
            <div className={`w-full ${
              isWideMode
                ? (displayCount === 16 ? 'max-w-6xl' : displayCount === 8 ? 'max-w-5xl' : displayCount === 4 ? 'max-w-4xl' : displayCount === 2 ? 'max-w-2xl' : sizeClasses[qrSize])
                : (displayCount === 16 ? 'max-w-2xl sm:max-w-3xl' : displayCount === 8 ? 'max-w-xl sm:max-w-2xl' : displayCount === 4 ? 'max-w-md sm:max-w-lg' : sizeClasses[qrSize])
            } mt-4 space-y-2`}>
              <div className="flex flex-wrap items-center justify-between text-xs font-mono gap-1">
                <span className="text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>{lang === 'fa' ? 'صفحه / فریم نوری:' : 'Optical Page / Frame:'}</span>
                </span>

                <div className="flex items-center gap-2">
                  {chunks.length > 0 && isPlaying && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 animate-pulse" title={lang === 'fa' ? 'زمان تخمینی باقیمانده تا پایان دور فعلی' : 'Current loop remaining time'}>
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{lang === 'fa' ? 'باقیمانده دور:' : 'Loop ETA:'} {Math.max(0, Math.ceil((totalPages - (currentPage + 1)) / fps))}s</span>
                    </span>
                  )}

                  <span className="text-emerald-700 dark:text-emerald-400 font-black text-sm">
                    {chunks.length > 0
                      ? lang === 'fa'
                        ? `صفحه ${currentPage + 1} از ${totalPages} (قطعات ${currentPage * displayCount + 1} تا ${Math.min((currentPage + 1) * displayCount, chunks.length)} از ${chunks.length})`
                        : `Page ${currentPage + 1} of ${totalPages} (Chunks ${currentPage * displayCount + 1}–${Math.min((currentPage + 1) * displayCount, chunks.length)} of ${chunks.length})`
                      : '0 / 0'}
                  </span>
                </div>
              </div>

              {/* Dwell Progress bar */}
              <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700/60">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 transition-all duration-75"
                  style={{
                    width: `${dwellProgress}%`,
                  }}
                />
              </div>

              {/* Primary Playback & Frame Navigation Controls (کاملاً در مرکز صفحه) */}
              <div className="flex items-center justify-center gap-3 pt-3">
                <button
                  onClick={() => {
                    setCurrentPage((prev) => (prev + 1) % totalPages);
                  }}
                  className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white transition cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  title={lang === 'fa' ? 'فریم بعدی' : 'Next Frame'}
                >
                  <SkipForward className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    if (!hasUserStarted) {
                      setHasUserStarted(true);
                      setIsPlaying(true);
                    } else {
                      setIsPlaying(!isPlaying);
                    }
                  }}
                  className={`px-8 py-3 rounded-2xl flex items-center justify-center gap-2.5 text-sm font-bold transition cursor-pointer shadow-md hover:scale-105 active:scale-95 ${
                    !hasUserStarted
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20 ring-4 ring-emerald-500/30 animate-pulse'
                      : isPlaying
                      ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/20'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/20'
                  }`}
                >
                  {!hasUserStarted ? (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span className="text-white font-bold">{lang === 'fa' ? 'شروع فرآیند ارسال' : 'Start Transmission'}</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-5 h-5 fill-current" />
                      <span className="text-white font-bold">{lang === 'fa' ? 'توقف' : 'Pause'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-current" />
                      <span className="text-white font-bold">{lang === 'fa' ? 'ادامه پخش' : 'Resume'}</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => {
                    setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1));
                  }}
                  className="p-3 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white transition cursor-pointer shadow-xs hover:scale-105 active:scale-95"
                  title={lang === 'fa' ? 'فریم قبلی' : 'Previous Frame'}
                >
                  <SkipBack className="w-5 h-5" />
                </button>
              </div>

              {/* Utility Action Buttons (Copy, Download, Test in Receiver) */}
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
                <button
                  onClick={handleCopyRaw}
                  className="inline-flex items-center justify-center h-9 w-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs transition cursor-pointer shadow-xs shrink-0"
                  title={lang === 'fa' ? 'کپی رشته متنی کیوآرکد فعلی' : 'Copy current QR wire text'}
                >
                  {copiedRaw ? <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                </button>

                <button
                  onClick={handleDownloadQrPng}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
                  title={lang === 'fa' ? 'ذخیره فریم به عنوان فایل تصویر PNG' : 'Save frame as PNG image'}
                >
                  <Download className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                  <span>{lang === 'fa' ? 'دانلود PNG' : 'PNG'}</span>
                </button>

                <button
                  onClick={handleDownloadQrSvg}
                  className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 font-bold dark:bg-slate-800 dark:hover:bg-slate-700 dark:border-slate-700 dark:text-white text-xs transition cursor-pointer shadow-xs whitespace-nowrap"
                  title={lang === 'fa' ? 'ذخیره فریم به عنوان فایل برداری SVG' : 'Save frame as vector SVG'}
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{lang === 'fa' ? 'دانلود SVG' : 'SVG'}</span>
                </button>
              </div>
            </div>

            {/* جدول ماتریس بهینه‌سازی‌شده قطعات در حال ارسال (High-Performance Windowed Packet Ledger) */}
            <div className="w-full mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                    {lang === 'fa' ? 'فهرست بهینه قطعات فریم (Packet Ledger):' : 'Active Packet Chunks Ledger:'}
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800">
                    {chunks.length} {lang === 'fa' ? 'قطعه کل' : 'Total Chunks'}
                  </span>
                </div>

                {/* Ledger Navigation & Follow Switch */}
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={followActiveChunk}
                      onChange={(e) => setFollowActiveChunk(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500 w-3.5 h-3.5 cursor-pointer"
                    />
                    <span>{lang === 'fa' ? 'دنبال کردن فریم فعال' : 'Follow Active'}</span>
                  </label>

                  {chunks.length > LEDGER_PAGE_SIZE && (
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
                      <button
                        disabled={
                          (followActiveChunk ? Math.floor(activeChunkIndex / LEDGER_PAGE_SIZE) : ledgerPage) >=
                          Math.ceil(chunks.length / LEDGER_PAGE_SIZE) - 1
                        }
                        onClick={() => {
                          setFollowActiveChunk(false);
                          setLedgerPage((p) =>
                            Math.min(Math.ceil(chunks.length / LEDGER_PAGE_SIZE) - 1, p + 1)
                          );
                        }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title={lang === 'fa' ? 'صفحه بعد' : 'Next page'}
                      >
                        <SkipForward className="w-3 h-3" />
                      </button>

                      <span className="px-1 text-[11px] text-slate-700 dark:text-slate-300">
                        {((followActiveChunk ? Math.floor(activeChunkIndex / LEDGER_PAGE_SIZE) : ledgerPage) + 1)} /{' '}
                        {Math.max(1, Math.ceil(chunks.length / LEDGER_PAGE_SIZE))}
                      </span>

                      <button
                        disabled={
                          (followActiveChunk ? Math.floor(activeChunkIndex / LEDGER_PAGE_SIZE) : ledgerPage) === 0
                        }
                        onClick={() => {
                          setFollowActiveChunk(false);
                          setLedgerPage((p) => Math.max(0, p - 1));
                        }}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                        title={lang === 'fa' ? 'صفحه قبل' : 'Prev page'}
                      >
                        <SkipBack className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  {/* Jump directly to chunk */}
                  {chunks.length > 20 && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const num = parseInt(jumpInput, 10);
                        if (!isNaN(num) && num >= 1 && num <= chunks.length) {
                          setCurrentPage(Math.floor((num - 1) / displayCount));
                          setFollowActiveChunk(false);
                          setLedgerPage(Math.floor((num - 1) / LEDGER_PAGE_SIZE));
                          setJumpInput('');
                        }
                      }}
                      className="flex items-center gap-1"
                    >
                      <input
                        type="number"
                        min={1}
                        max={chunks.length}
                        placeholder={lang === 'fa' ? 'برو به قطعه #' : 'Go to #'}
                        value={jumpInput}
                        onChange={(e) => setJumpInput(e.target.value)}
                        className="w-20 px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-800 text-xs font-mono"
                      />
                    </form>
                  )}
                </div>
              </div>

              {/* Windowed Matrix Table: only renders 15 items in the DOM! */}
              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950/80">
                <table className="w-full text-right text-[11px]">
                  <thead className="bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 sticky top-0 font-bold">
                    <tr>
                      <th className="p-2 text-right">#</th>
                      <th className="p-2 text-right">{lang === 'fa' ? 'وضعیت نمایش' : 'Display Status'}</th>
                      <th className="p-2 text-right">{lang === 'fa' ? 'حجم قطعه' : 'Chunk Size'}</th>
                      <th className="p-2 text-right">CRC32</th>
                      <th className="p-2 text-right">{lang === 'fa' ? 'اقدام' : 'Action'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {(() => {
                      const curLedgerPage = followActiveChunk
                        ? Math.floor(activeChunkIndex / LEDGER_PAGE_SIZE)
                        : ledgerPage;
                      const startIdx = curLedgerPage * LEDGER_PAGE_SIZE;
                      const windowedChunks = chunks.slice(startIdx, startIdx + LEDGER_PAGE_SIZE);

                      return windowedChunks.map((rawChunk, sliceIdx) => {
                        const idx = startIdx + sliceIdx;
                        const isCurrent = visibleIndices.includes(idx);
                        const parts = rawChunk.split(':');
                        const chunkCrc = parts[5] || 'N/A';
                        const chunkLen = rawChunk.length;

                        return (
                          <tr
                            key={idx}
                            className={`transition ${
                              isCurrent
                                ? 'bg-emerald-50 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 font-bold'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
                            }`}
                          >
                            <td className="p-2 text-right font-mono font-bold">{idx + 1}</td>
                            <td className="p-2 text-right">
                              {isCurrent ? (
                                <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-bold">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-ping shrink-0" />
                                  <span>{lang === 'fa' ? 'در حال پخش روی شاتر' : 'ON SHUTTER'}</span>
                                </span>
                              ) : (
                                <span className="text-slate-400 dark:text-slate-500">
                                  {lang === 'fa' ? 'در نوبت چرخش' : 'Queued'}
                                </span>
                              )}
                            </td>
                            <td className="p-2 text-right text-slate-500 dark:text-slate-400 font-mono">{chunkLen} B</td>
                            <td className="p-2 text-right text-cyan-700 dark:text-cyan-400 font-mono" dir="ltr">{chunkCrc}</td>
                            <td className="p-2 text-right">
                              <button
                                onClick={() => {
                                  setCurrentPage(Math.floor(idx / displayCount));
                                  setIsPlaying(false);
                                }}
                                className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 dark:border-transparent text-[10px] transition cursor-pointer"
                              >
                                {lang === 'fa' ? 'نمایش' : 'Jump'}
                              </button>
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Transmission Statistics */}
            {envelope && (
              <div className="w-full mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {lang === 'fa' ? 'شناسه انتقال' : 'Transfer ID'}
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-700 dark:text-cyan-300 truncate block">
                    {envelope.transferId.substring(0, 10)}...
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {lang === 'fa' ? 'تعداد قطعات' : 'Total Chunks'}
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300">
                    {chunks.length} {lang === 'fa' ? 'کیوآر' : 'QRs'}
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {lang === 'fa' ? 'حجم کل' : 'Total Size'}
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-200">
                    {(envelope.totalBytes / 1024).toFixed(2)} KB
                  </span>
                </div>

                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800/80 text-center">
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    {lang === 'fa' ? 'زمان دور شاتر' : 'Cycle Time'}
                  </span>
                  <span className="text-xs font-mono font-bold text-purple-700 dark:text-purple-300">
                    {((chunks.length / (fps * displayCount)) || 0).toFixed(1)}s
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Fullscreen Presentation Modal - Responsive Scaling to Monitor Dimensions */}
      {isFullscreen && (
        <div className="fullscreen-presentation dark fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 p-3 sm:p-5 backdrop-blur-md overflow-hidden select-none">
          {/* Top Bar: Spans wide across monitor with Zoom Slider & Column Controls */}
          <div className="w-full max-w-[98vw] flex flex-wrap items-center justify-between gap-2.5 sm:gap-3 flex-shrink-0 px-2 sm:px-4">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="fs-status-pill text-xs sm:text-sm font-mono font-bold px-3.5 py-1.5 rounded-full border shadow-sm">
                {chunks.length > 0
                  ? lang === 'fa'
                    ? `صفحه ${currentPage + 1} از ${totalPages} (قطعات ${currentPage * displayCount + 1} تا ${Math.min((currentPage + 1) * displayCount, chunks.length)} از ${chunks.length})`
                    : `Page ${currentPage + 1} of ${totalPages} (Chunks ${currentPage * displayCount + 1}–${Math.min((currentPage + 1) * displayCount, chunks.length)} of ${chunks.length})`
                  : '0 / 0'}
              </span>

              {/* Shutter FPS pills */}
              <div className="fs-pill-container flex items-center rounded-xl p-1 border gap-1">
                {[1, 2, 3, 5, 8, 10].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFps(f)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition cursor-pointer ${
                      fps === f ? 'fs-pill-btn-active-emerald' : 'fs-pill-btn-inactive'
                    }`}
                  >
                    {f}fps
                  </button>
                ))}
              </div>

              {/* Display Count */}
              <div className="hidden sm:flex fs-pill-container items-center rounded-xl p-1 border text-xs font-mono gap-1">
                {[
                  { cnt: 1, label: '1x' },
                  { cnt: 2, label: '2x' },
                  { cnt: 4, label: '4x' },
                  { cnt: 8, label: '8x' },
                  { cnt: 16, label: '16x' },
                ].map((item) => (
                  <button
                    key={item.cnt}
                    onClick={() => setDisplayCount(item.cnt as 1 | 2 | 4 | 8 | 16)}
                    className={`px-3 py-1 rounded-lg transition cursor-pointer font-bold ${
                      displayCount === item.cnt
                        ? 'fs-pill-btn-active-cyan'
                        : 'fs-pill-btn-inactive'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Fullscreen Column Selector */}
              <div className="hidden lg:flex fs-pill-container items-center rounded-xl p-1 border text-xs font-mono gap-1">
                <span className="text-[10px] text-slate-400 px-1 font-bold">
                  {lang === 'fa' ? 'ستون:' : 'Cols:'}
                </span>
                {(['auto', 2, 4, 6, 8] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => setGridColumns(col)}
                    className={`px-2 py-0.5 rounded-lg transition cursor-pointer font-bold ${
                      gridColumns === col ? 'fs-pill-btn-active-cyan' : 'fs-pill-btn-inactive'
                    }`}
                  >
                    {col === 'auto' ? `Auto (${fullscreenGrid.columns}×${fullscreenGrid.rows})` : `${col}x`}
                  </button>
                ))}
              </div>

              {/* Fullscreen Interactive Zoom Slider */}
              <div className="flex fs-pill-container items-center rounded-xl p-1 border text-xs gap-1.5 shadow-sm">
                <button
                  onClick={() => setQrScale((prev) => Math.max(60, prev - 10))}
                  className="p-1 rounded-lg fs-pill-btn-inactive cursor-pointer"
                  title={lang === 'fa' ? 'کوچک‌تر' : 'Zoom Out'}
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <input
                  type="range"
                  min={60}
                  max={220}
                  step={5}
                  value={qrScale}
                  onChange={(e) => setQrScale(Number(e.target.value))}
                  className="w-20 sm:w-28 accent-emerald-400 cursor-pointer"
                  title={`${qrScale}%`}
                />
                <button
                  onClick={() => setQrScale((prev) => Math.min(220, prev + 10))}
                  className="p-1 rounded-lg fs-pill-btn-inactive cursor-pointer"
                  title={lang === 'fa' ? 'بزرگ‌تر' : 'Zoom In'}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
                <span className="font-mono text-xs font-black text-emerald-400 px-1 min-w-[36px] text-center">
                  {qrScale}%
                </span>
              </div>

              {/* Fullscreen Calibration Test Button */}
              <button
                onClick={() => setIsCalibrationOpen(!isCalibrationOpen)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border shadow-sm ${
                  isCalibrationOpen
                    ? 'bg-amber-500 text-slate-950 border-amber-300 font-black shadow-amber-500/40 ring-2 ring-amber-400'
                    : 'fs-pill-btn-inactive hover:text-amber-300 border-amber-500/40 text-amber-400 bg-amber-500/10'
                }`}
                title={lang === 'fa' ? 'تست کالیبراسیون و تنظیم روشنایی و بزرگ‌نمایی صفحه برای دوربین' : 'Camera Optical Calibration & Brightness Test'}
              >
                <Target className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'تست کالیبراسیون' : 'Calibration Test'}</span>
              </button>
            </div>

            <button
              onClick={() => setIsFullscreen(false)}
              className="fs-btn-dark p-2.5 rounded-full hover:bg-rose-600 transition cursor-pointer border shadow-md flex items-center justify-center"
              title={lang === 'fa' ? 'خروج از تمام‌صفحه' : 'Exit Fullscreen'}
            >
              <Minimize2 className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Center Display: Calibration Test Mode OR Standard Aspect-Ratio CSS Grid */}
          <div 
            ref={fullscreenCenterRef}
            className="flex-1 w-full h-full flex items-center justify-center p-2 sm:p-4 overflow-hidden"
          >
            {isCalibrationOpen ? (
              /* Dedicated Optical Calibration Test Studio */
              <div className="w-full h-full max-w-5xl flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-8 p-3 sm:p-6 bg-slate-950/80 border border-slate-800 rounded-3xl backdrop-blur-md overflow-y-auto animate-in fade-in select-none">
                {/* Left: High-Contrast Test QR Canvas with Alignment Reticles & Grayscale Wedge */}
                <div className="flex flex-col items-center justify-center flex-1 w-full max-w-md">
                  {/* Optical Reticle Card */}
                  <div
                    style={{
                      width: `${Math.min(460, Math.max(240, Math.round(340 * (qrScale / 100))))}px`,
                      height: `${Math.min(460, Math.max(240, Math.round(340 * (qrScale / 100))))}px`,
                    }}
                    className={`relative p-5 sm:p-7 rounded-3xl shadow-[0_0_80px_rgba(245,158,11,0.25)] flex items-center justify-center transition-all duration-150 select-none ${
                      calibrationBgTone === 'pure_white'
                        ? 'bg-white border-4 border-amber-500'
                        : calibrationBgTone === 'anti_glare'
                        ? 'bg-[#f1f5f9] border-4 border-amber-500'
                        : 'bg-black border-4 border-slate-700 p-8'
                    }`}
                  >
                    {/* Corner Optical Alignment Brackets */}
                    <div className="absolute top-2 left-2 w-5 h-5 border-t-4 border-l-4 border-amber-500 rounded-tl pointer-events-none" />
                    <div className="absolute top-2 right-2 w-5 h-5 border-t-4 border-r-4 border-amber-500 rounded-tr pointer-events-none" />
                    <div className="absolute bottom-2 left-2 w-5 h-5 border-b-4 border-l-4 border-amber-500 rounded-bl pointer-events-none" />
                    <div className="absolute bottom-2 right-2 w-5 h-5 border-b-4 border-r-4 border-amber-500 rounded-br pointer-events-none" />

                    {/* Dark Inset Inner Target Container if dark_inset selected */}
                    <div className={`w-full h-full flex items-center justify-center ${calibrationBgTone === 'dark_inset' ? 'bg-white p-4 rounded-2xl shadow-xl' : ''}`}>
                      {calibrationSvg ? (
                        <div
                          className="w-full h-full flex items-center justify-center select-none [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                          dangerouslySetInnerHTML={{ __html: calibrationSvg }}
                        />
                      ) : (
                        <div className="text-slate-400 font-mono text-xs">Generating Test Pattern...</div>
                      )}
                    </div>

                    {/* Live Dimension Badge */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-slate-900 border border-amber-500/60 text-amber-300 font-mono text-[10px] font-bold shadow-md whitespace-nowrap">
                      {Math.min(460, Math.max(240, Math.round(340 * (qrScale / 100))))}px • 100% CONTRAST
                    </div>
                  </div>

                  {/* Optical Grayscale Contrast & Brightness Calibration Wedge */}
                  <div className="w-full max-w-sm mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-mono font-bold text-slate-300">
                      <span className="flex items-center gap-1">
                        <Sun className="w-3.5 h-3.5 text-amber-400" />
                        <span>{lang === 'fa' ? 'طیف کالیبراسیون روشنایی / کنتراست:' : 'Grayscale Brightness Wedge:'}</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">0% → 100%</span>
                    </div>

                    {/* 9-step Grayscale Ramp */}
                    <div className="flex items-center h-6 w-full rounded-lg overflow-hidden border border-slate-700 shadow-inner">
                      {[
                        { pct: '0%', bg: '#000000', text: '#ffffff' },
                        { pct: '12%', bg: '#1f1f1f', text: '#ffffff' },
                        { pct: '25%', bg: '#3f3f3f', text: '#ffffff' },
                        { pct: '38%', bg: '#5f5f5f', text: '#ffffff' },
                        { pct: '50%', bg: '#7f7f7f', text: '#000000' },
                        { pct: '62%', bg: '#9e9e9e', text: '#000000' },
                        { pct: '75%', bg: '#bebebe', text: '#000000' },
                        { pct: '88%', bg: '#dedede', text: '#000000' },
                        { pct: '100%', bg: '#ffffff', text: '#000000' },
                      ].map((step, idx) => (
                        <div
                          key={idx}
                          style={{ backgroundColor: step.bg, color: step.text }}
                          className="flex-1 h-full flex items-center justify-center text-[8px] font-mono font-bold select-none"
                          title={`Grayscale ${step.pct}`}
                        >
                          {idx % 2 === 0 ? step.pct : ''}
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed text-center">
                      {lang === 'fa'
                        ? '💡 نکته: اگر پله‌های ۸۸٪ و ۱۰۰٪ در دوربین یکی دیده می‌شوند، روشنایی مانیتور را کم کنید تا خیرگی لنز حذف شود.'
                        : '💡 Tip: If 88% and 100% blend together in camera view, lower your screen brightness to eliminate optical glare.'}
                    </p>
                  </div>
                </div>

                {/* Right: Live Tuning Controls & Diagnostics */}
                <div className="flex flex-col justify-between flex-1 w-full max-w-md bg-slate-900/90 border border-slate-800 p-4 sm:p-5 rounded-2xl space-y-4">
                  <div>
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Target className="w-5 h-5 text-amber-400" />
                        <div>
                          <h4 className="text-sm font-bold text-white">
                            {lang === 'fa' ? 'تنظیمات اپتیکال برای دوربین' : 'Camera Optical Tuning'}
                          </h4>
                          <p className="text-[11px] text-slate-400">
                            {lang === 'fa' ? 'تنظیم اندازه و پس‌زمینه برای خوانش بی‌نقص' : 'Fine-tune scale & tone for instant lock'}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                        CALIBRATION
                      </span>
                    </div>

                    {/* 1. Zoom / Scale Slider */}
                    <div className="mt-3 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-semibold text-slate-300">
                          {lang === 'fa' ? 'بزرگ‌نمایی و مقیاس فریم (Zoom):' : 'QR Code Scale (Zoom):'}
                        </label>
                        <span className="font-mono text-amber-400 font-bold">{qrScale}%</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setQrScale((prev) => Math.max(60, prev - 10))}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs cursor-pointer border border-slate-700"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="range"
                          min={60}
                          max={220}
                          step={5}
                          value={qrScale}
                          onChange={(e) => setQrScale(Number(e.target.value))}
                          className="flex-1 accent-amber-400 cursor-pointer"
                        />
                        <button
                          onClick={() => setQrScale((prev) => Math.min(220, prev + 10))}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs cursor-pointer border border-slate-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* 2. Density / Module Complexity */}
                    <div className="mt-3 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        {lang === 'fa' ? 'تراکم خانه‌ها برای تست خوانش:' : 'Test Pattern Density:'}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <button
                          onClick={() => setCalibrationDensity('low')}
                          className={`py-1.5 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                            calibrationDensity === 'low'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang === 'fa' ? 'درشت (V1)' : 'Large (V1)'}
                        </button>
                        <button
                          onClick={() => setCalibrationDensity('medium')}
                          className={`py-1.5 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                            calibrationDensity === 'medium'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang === 'fa' ? 'متوسط (V4)' : 'Med (V4)'}
                        </button>
                        <button
                          onClick={() => setCalibrationDensity('high')}
                          className={`py-1.5 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                            calibrationDensity === 'high'
                              ? 'bg-amber-500 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang === 'fa' ? 'ریز (V7)' : 'Dense (V7)'}
                        </button>
                      </div>
                    </div>

                    {/* 3. Screen Tone / Anti-Glare Options */}
                    <div className="mt-3 space-y-1.5">
                      <label className="text-xs font-semibold text-slate-300 block">
                        {lang === 'fa' ? 'تنظیم پس‌زمینه (حذف بازتاب نور):' : 'Anti-Glare Background Tone:'}
                      </label>
                      <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                        <button
                          onClick={() => setCalibrationBgTone('pure_white')}
                          className={`py-1.5 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                            calibrationBgTone === 'pure_white'
                              ? 'bg-slate-200 text-slate-950 shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang === 'fa' ? 'سفید خالص' : 'Pure White'}
                        </button>
                        <button
                          onClick={() => setCalibrationBgTone('anti_glare')}
                          className={`py-1.5 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                            calibrationBgTone === 'anti_glare'
                              ? 'bg-cyan-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang === 'fa' ? 'ضد خیرگی' : 'Anti-Glare'}
                        </button>
                        <button
                          onClick={() => setCalibrationBgTone('dark_inset')}
                          className={`py-1.5 px-2 rounded-lg font-bold transition cursor-pointer text-center ${
                            calibrationBgTone === 'dark_inset'
                              ? 'bg-purple-600 text-white shadow-xs'
                              : 'text-slate-400 hover:text-white'
                          }`}
                        >
                          {lang === 'fa' ? 'کادر تاریک' : 'Dark Frame'}
                        </button>
                      </div>
                    </div>

                    {/* 4. Practical Checklist */}
                    <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === 'fa' ? 'فاصله مطلوب دوربین: ۲۰ تا ۴۰ سانتی‌متر' : 'Optimal distance: 20–40 cm'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === 'fa' ? 'روشنایی صفحه نمایش: بین ۵۰٪ تا ۷۰٪' : 'Monitor brightness: 50%–70%'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === 'fa' ? 'زاویه دوربین: روبرو و مستقیم به مانیتور' : 'Camera angle: Direct perpendicular'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Close & Return Button */}
                  <div className="pt-2">
                    <button
                      onClick={() => setIsCalibrationOpen(false)}
                      className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 hover:from-amber-400 hover:to-emerald-500 text-slate-950 hover:text-white font-extrabold text-xs transition cursor-pointer shadow-lg shadow-emerald-950/30 flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{lang === 'fa' ? 'تایید کالیبراسیون و شروع انتقال' : 'Confirm Calibration & Resume Transfer'}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : chunks.length === 0 ? (
              /* Fullscreen Standby State */
              <div className="w-full max-w-md p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4 my-auto select-none animate-in fade-in">
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center shadow-inner">
                  <Inbox className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-white">
                    {lang === 'fa' ? 'صف ارسال در حال حاضر خالی است' : 'Transmission Queue is Empty'}
                  </h3>
                  <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
                    {lang === 'fa'
                      ? 'هیچ فایلی برای پخش در تمام‌صفحه وجود ندارد. می‌توانید داده نمونه تستی را بارگذاری کنید یا تست کالیبراسیون را اجرا نمایید.'
                      : 'No payload in queue. You can load demo sample data or run camera calibration test.'}
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    onClick={handleLoadDemoData}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs cursor-pointer shadow-md transition"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>{lang === 'fa' ? 'بارگذاری داده نمونه (Demo)' : 'Load Demo Data'}</span>
                  </button>
                  <button
                    onClick={() => setIsCalibrationOpen(true)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/40 font-bold text-xs cursor-pointer transition"
                  >
                    <Target className="w-4 h-4" />
                    <span>{lang === 'fa' ? 'تست کالیبراسیون' : 'Calibration Test'}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* Standard Aspect-Ratio CSS Grid */
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: fullscreenGrid.gridTemplateColumns,
                  gridTemplateRows: fullscreenGrid.gridTemplateRows,
                  gap: `${fullscreenGrid.gap}px`,
                  width: `${fullscreenGrid.gridWidth}px`,
                  height: `${fullscreenGrid.gridHeight}px`,
                  maxWidth: '100%',
                  maxHeight: '100%',
                }}
                className="items-center justify-center transition-all duration-150 mx-auto"
              >
                {slots.map((slot) => (
                  slot.hasChunk ? (
                    <div
                      key={slot.chunkIndex}
                      onClick={() => setFocusedChunkIndex(slot.chunkIndex)}
                      className={`relative w-full h-full aspect-square ${
                        displayCount === 1 
                          ? 'p-4 sm:p-8 rounded-3xl bg-white shadow-[0_0_120px_rgba(16,185,129,0.35)] border-4 border-slate-700' 
                          : 'p-1.5 sm:p-2.5 rounded-2xl bg-white shadow-2xl border-2 border-slate-700'
                      } flex flex-col items-center justify-between transition-all hover:border-emerald-500 cursor-pointer select-none group overflow-hidden`}
                      title={lang === 'fa' ? `فریم #${slot.chunkIndex + 1} (کلیک برای فوکوس)` : `Frame #${slot.chunkIndex + 1} (Click to focus)`}
                    >
                      {displayCount > 1 && (
                        <div className="w-full shrink-0 flex items-center justify-between pb-0.5 px-1 text-[10px] sm:text-xs font-mono text-slate-700 border-b border-slate-100 select-none">
                          <span className="font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded text-slate-900 shadow-2xs">
                            #{slot.chunkIndex + 1}
                          </span>
                          <span className="text-[9px] text-slate-500 font-sans font-medium">
                            {slot.chunkIndex + 1}/{chunks.length}
                          </span>
                        </div>
                      )}
                      <div className="w-full flex-1 min-h-0 min-w-0 flex items-center justify-center p-1 sm:p-1.5 overflow-hidden select-none">
                        {renderedSlotSvgs[slot.chunkIndex] && (
                          <div
                            className="w-full h-full min-h-0 min-w-0 flex items-center justify-center select-none [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:aspect-square [&>svg]:object-contain [&>svg]:block [&>svg]:m-auto"
                            dangerouslySetInnerHTML={{ __html: renderedSlotSvgs[slot.chunkIndex] }}
                          />
                        )}
                      </div>
                    </div>
                  ) : (
                    /* Empty Slot Box Placeholder (e.g. 7 out of 16 used, remaining 9 are empty dashed boxes) */
                    <div
                      key={`fs-empty-${slot.slotIndex}`}
                      className="relative w-full h-full aspect-square p-2 rounded-2xl border-2 border-dashed border-slate-700/80 bg-slate-900/50 flex flex-col items-center justify-center text-slate-400 select-none"
                    >
                      <span className="text-xs sm:text-sm font-mono font-bold text-slate-400">
                        {lang === 'fa' ? 'خالی' : 'Empty'}
                      </span>
                      <span className="text-[10px] font-mono opacity-50">
                        ({slot.slotIndex + 1})
                      </span>
                    </div>
                  )
                ))}
              </div>
            )}
          </div>

          {/* Bottom Playback Navigation & Downloads */}
          <div className="w-full max-w-xl flex flex-wrap items-center justify-center gap-3 sm:gap-4 flex-shrink-0">
            <button
              onClick={() => setCurrentPage((prev) => (prev + 1) % totalPages)}
              className="fs-btn-dark p-3 rounded-xl border cursor-pointer shadow-md flex items-center justify-center"
              title={lang === 'fa' ? 'صفحه بعدی' : 'Next Page'}
            >
              <SkipForward className="w-5 h-5 text-white" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`px-8 py-3 rounded-2xl font-black text-sm cursor-pointer shadow-xl transition flex items-center gap-2 ${
                isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-950/40'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
              }`}
            >
              {isPlaying ? (lang === 'fa' ? 'توقف' : 'Pause') : (lang === 'fa' ? 'پخش' : 'Play')}
            </button>
            <button
              onClick={() => setCurrentPage((prev) => (prev > 0 ? prev - 1 : totalPages - 1))}
              className="fs-btn-dark p-3 rounded-xl border cursor-pointer shadow-md flex items-center justify-center"
              title={lang === 'fa' ? 'صفحه قبلی' : 'Previous Page'}
            >
              <SkipBack className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={handleDownloadQrPng}
              className="fs-btn-dark flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-white text-xs font-bold transition cursor-pointer shadow-md"
              title={lang === 'fa' ? 'دانلود فایل PNG' : 'Download PNG'}
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="text-white font-bold">PNG</span>
            </button>

            <button
              onClick={handleDownloadQrSvg}
              className="fs-btn-dark flex items-center gap-1.5 px-4 py-2.5 rounded-xl border text-white text-xs font-bold transition cursor-pointer shadow-md"
              title={lang === 'fa' ? 'دانلود فایل برداری SVG' : 'Download SVG'}
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="text-white font-bold">SVG</span>
            </button>
          </div>
        </div>
      )}

      {/* Optical Focus / Single QR Inspection Modal (بزرگ‌نمایی آنی فریم برای خواندن دوربین) */}
      {focusedChunkIndex !== null && chunks[focusedChunkIndex] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-md rounded-3xl bg-white dark:bg-slate-900 border-2 border-emerald-500 shadow-2xl p-6 space-y-4">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <Focus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <span>{lang === 'fa' ? `نمای فوکوس بزرگ فریم #${focusedChunkIndex + 1}` : `High-Visibility Frame #${focusedChunkIndex + 1}`}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-mono font-bold">
                      {focusedChunkIndex + 1} / {chunks.length}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {lang === 'fa' 
                      ? 'ابعاد حداکثری و کنتراست مطلق برای خوانده شدن قطعی توسط هر نوع دوربین' 
                      : 'Maximized dimension & contrast for immediate camera lock-on'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setFocusedChunkIndex(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Giant High-Contrast Pure White QR Canvas */}
            <div className="w-full flex items-center justify-center p-4 sm:p-6 bg-white rounded-2xl shadow-inner border-2 border-slate-200 aspect-square overflow-hidden">
              <div className="w-full h-full max-w-[320px] max-h-[320px] aspect-square flex items-center justify-center overflow-hidden">
                {renderedSlotSvgs[focusedChunkIndex] && (
                  <div
                    className="w-full h-full min-h-0 min-w-0 flex items-center justify-center select-none [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:w-auto [&>svg]:h-auto [&>svg]:aspect-square [&>svg]:object-contain [&>svg]:block [&>svg]:m-auto"
                    dangerouslySetInnerHTML={{ __html: renderedSlotSvgs[focusedChunkIndex] }}
                  />
                )}
              </div>
            </div>

            {/* Navigation & Controls */}
            <div className="flex items-center justify-between pt-2">
              <button
                onClick={() => setFocusedChunkIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : chunks.length - 1))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 text-xs font-bold transition cursor-pointer border border-slate-200 dark:border-slate-700"
              >
                <SkipBack className="w-3.5 h-3.5" />
                <span>{lang === 'fa' ? 'فریم قبلی' : 'Previous'}</span>
              </button>

              <button
                onClick={() => setFocusedChunkIndex(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-slate-700 transition cursor-pointer"
              >
                {lang === 'fa' ? 'بستن' : 'Close'}
              </button>

              <button
                onClick={() => setFocusedChunkIndex((prev) => (prev !== null && prev < chunks.length - 1 ? prev + 1 : 0))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition cursor-pointer shadow-md"
              >
                <span>{lang === 'fa' ? 'فریم بعدی' : 'Next'}</span>
                <SkipForward className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
