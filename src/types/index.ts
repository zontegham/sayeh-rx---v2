export type Language = 'fa' | 'en';

export type Theme = 'dark' | 'light';

export type TransmitterTab = 'optical_tx' | 'inbound_hub' | 'keys_tx' | 'history_tx' | 'settings_tx';

export type ChromaMultiplexMode = 'mono' | 'rgb_3x';
export type AntiGlareTheme = 'additive_dark' | 'subtractive_light' | 'anti_glare';

export interface TransmitterCoreConfig {
  stationId: string;
  stationName: string;
  defaultFps: number;
  defaultChunkSize: number;
  defaultErrorCorrection: 'L' | 'M' | 'Q' | 'H';
  defaultDisplayCount: 1 | 2 | 4 | 8 | 16;
  lockAsDedicatedSender: boolean;
  requireManualStartOnNewFile?: boolean;
  defaultCyclesPerItem?: number;
  defaultAutoAdvance?: boolean;
  defaultChromaMode?: ChromaMultiplexMode;
  defaultAntiGlareTheme?: AntiGlareTheme;
}

export interface EncryptedEnvelope {
  version: number;
  transferId: string;
  iv: string; // Base64
  salt: string; // Base64
  ciphertext: string; // Base64
  hash: string; // SHA-256 of plaintext
  totalBytes: number;
  fileName?: string;
  fileType?: string;
  timestamp: number;
}

export interface ChunkPacket {
  version: number;
  transferId: string;
  index: number;
  total: number;
  fileName: string;
  fileType: string;
  totalBytes: number;
  chunkData: string;
  chunkHash: string;
  fullHash: string;
}

export interface SystemIntegrationConfig {
  id: string;
  name: string;
  type: 'inbound_poll' | 'inbound_webhook' | 'outbound_forward';
  targetUrl: string;
  method: 'GET' | 'POST' | 'PUT';
  headers: Record<string, string>;
  pollIntervalSec: number;
  active: boolean;
  lastSync?: number;
  lastStatus?: 'success' | 'error' | 'idle';
  lastPayload?: string;
}

export interface StoredKey {
  id: string;
  name: string;
  keyHex: string;
  createdAt: number;
  notes?: string;
}

export interface AuditLog {
  id: string;
  type: 'sent';
  fileName?: string;
  fileType: string;
  totalBytes: number;
  transferId: string;
  sha256: string;
  timestamp: number;
  status: 'success' | 'tampered' | 'corrupt';
  priority?: DocumentPriority;
  classification?: SecurityClassification;
  encodingMode?: string;
  chromaMode?: ChromaMultiplexMode;
  cyclesCompleted?: number;
}

export type DocumentPriority = 'flash' | 'high' | 'normal' | 'bulk';
export type SecurityClassification = 'unclassified' | 'confidential' | 'secret' | 'top_secret' | 'financial';

export interface QueueItem {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: string; // Text or Base64 data (optional when persisted in IndexedDB)
  isBinary: boolean;
  status: 'pending' | 'broadcasting' | 'completed' | 'processing';
  createdAt: number;
  priority?: DocumentPriority;
  classification?: SecurityClassification;
  sha256?: string;
  cyclesCompleted?: number;
  chunksCount?: number;
  customLabel?: string;
}

export type TransmissionEncodingMode = 'sequential' | 'fountain';

export interface AirGapEmissionCertificate {
  certificateId: string;
  stationId: string;
  stationName: string;
  transferId: string;
  fileName?: string;
  fileType: string;
  totalBytes: number;
  totalFrames: number;
  encodingMode: TransmissionEncodingMode;
  chromaMode?: ChromaMultiplexMode;
  encryptionMode: string;
  payloadSha256: string;
  envelopeHash?: string;
  timestamp: number;
  timestampFormattedUtc: string;
  timestampFormattedJalali: string;
  cyclesCompleted: number;
  shutterFps: number;
  displayCount: number;
  securityIssuer: string;
  digitalSignatureHex: string;
  qrWireCertificate: string;
}

