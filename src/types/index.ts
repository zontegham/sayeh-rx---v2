export type Language = 'fa' | 'en';

export type Theme = 'dark' | 'light';

export type TransmitterTab = 'optical_tx' | 'inbound_hub' | 'keys_tx' | 'history_tx' | 'settings_tx';

export interface TransmitterCoreConfig {
  stationId: string;
  stationName: string;
  defaultFps: number;
  defaultChunkSize: number;
  defaultErrorCorrection: 'L' | 'M' | 'Q' | 'H';
  defaultDisplayCount: 1 | 2 | 4 | 8 | 16;
  lockAsDedicatedSender: boolean;
  requireManualStartOnNewFile?: boolean;
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
}

export interface QueueItem {
  id: string;
  name: string;
  type: string;
  size: number;
  data?: string; // Text or Base64 data (optional when persisted in IndexedDB)
  isBinary: boolean;
  status: 'pending' | 'broadcasting' | 'completed' | 'processing';
  createdAt: number;
  priority?: number;
  cyclesCompleted?: number;
  chunksCount?: number;
}

