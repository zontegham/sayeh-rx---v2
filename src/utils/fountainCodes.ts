/**
 * Fountain Code (Luby Transform / Raptor-style) Engine for Optical Air-Gap Links
 * Enables Zero-Sync, Out-of-Order, and Anti-Drop optical data reception.
 * The receiver can start capturing at any second and reconstruct the full file
 * once any K + epsilon distinct packets are accumulated.
 */

import { EncryptedEnvelope } from '../types/index';
import { crc32 } from './packetizer';

export interface FountainPacket {
  frameIndex: number;
  totalK: number;
  degree: number;
  seed: number;
  sourceIndices: number[];
  chunkCrc: string;
  wireString: string;
}

export interface FountainOptions {
  chunkSize?: number;
  redundancyRatio?: number; // e.g. 0.35 = 35% parity repair frames
  autoAdaptiveDensity?: boolean;
}

/**
 * Fast deterministic 32-bit PRNG (Mulberry32)
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * String hash for deterministic seed derivation
 */
function hashStringSeed(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Fast byte-wise XOR of two buffers
 */
export function xorBuffers(a: Uint8Array, b: Uint8Array): Uint8Array {
  const len = Math.max(a.length, b.length);
  const out = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    out[i] = (i < a.length ? a[i] : 0) ^ (i < b.length ? b[i] : 0);
  }
  return out;
}

/**
 * Select degree d using a robust soliton-like distribution
 */
function sampleDegree(rand: () => number, K: number): number {
  if (K <= 1) return 1;
  const r = rand();
  if (r < 0.45) return 1;
  if (r < 0.75) return 2;
  if (r < 0.90) return 3;
  if (r < 0.97) return Math.min(K, 4);
  return Math.min(K, 5);
}

/**
 * Pick `count` unique random indices from 0..K-1
 */
function sampleIndices(rand: () => number, count: number, K: number): number[] {
  const indices = new Set<number>();
  let attempts = 0;
  while (indices.size < count && attempts < 100) {
    indices.add(Math.floor(rand() * K));
    attempts++;
  }
  // Fallback if set didn't fill
  if (indices.size < count) {
    for (let i = 0; i < K && indices.size < count; i++) {
      indices.add(i);
    }
  }
  return Array.from(indices).sort((a, b) => a - b);
}

/**
 * Generate Fountain Packets (Systematic + Parity Repair Packets)
 */
export function generateFountainPackets(
  envelope: EncryptedEnvelope,
  effectiveChunkSize: number,
  redundancyRatio: number = 0.4 // 40% parity frames
): { chunks: string[]; totalK: number; totalFrames: number } {
  const envelopeJson = JSON.stringify(envelope);
  const textEncoder = new TextEncoder();
  const rawBytes = textEncoder.encode(envelopeJson);
  const totalLength = rawBytes.length;

  const totalK = Math.max(1, Math.ceil(totalLength / effectiveChunkSize));
  const parityCount = Math.max(2, Math.round(totalK * redundancyRatio));
  const totalFrames = totalK + parityCount;

  // Split into K source byte blocks
  const sourceBlocks: Uint8Array[] = new Array(totalK);
  for (let i = 0; i < totalK; i++) {
    const start = i * effectiveChunkSize;
    const end = Math.min(start + effectiveChunkSize, totalLength);
    sourceBlocks[i] = rawBytes.slice(start, end);
  }

  const fullHash = envelope.hash ? envelope.hash.substring(0, 16) : '00000000';
  const fileNameSafe = envelope.fileName ? btoa(encodeURIComponent(envelope.fileName)) : '';
  const fileTypeSafe = envelope.fileType ? btoa(envelope.fileType) : '';
  const baseSeed = hashStringSeed(envelope.transferId);

  const chunks: string[] = new Array(totalFrames);

  // 1. Systematic packets (Degree = 1) -> Indices 0..K-1
  for (let i = 0; i < totalK; i++) {
    const block = sourceBlocks[i];
    const base64Data = btoa(String.fromCharCode(...block));
    const chunkHash = crc32(base64Data);
    const frameIndex = i + 1;
    // Protocol: AIRD:v3:FNT:<id>:<frameIdx>:<totalK>:<deg>:<seed>:<idxMask>:<crc>:<hash>:<bytes>:<fname>:<ftype>:<data>
    chunks[i] = `AIRD:v3:FNT:${envelope.transferId}:${frameIndex}:${totalK}:1:${i}:${i}:${chunkHash}:${fullHash}:${envelope.totalBytes}:${fileNameSafe}:${fileTypeSafe}:${base64Data}`;
  }

  // 2. Parity repair packets (Degree >= 2) -> Indices K..totalFrames-1
  for (let j = 0; j < parityCount; j++) {
    const frameIndex = totalK + j + 1;
    const seed = (baseSeed + frameIndex * 997) >>> 0;
    const rand = mulberry32(seed);

    const deg = sampleDegree(rand, totalK);
    const indices = sampleIndices(rand, Math.max(2, deg), totalK);

    // XOR all selected blocks
    let combined: Uint8Array = new Uint8Array(sourceBlocks[indices[0]]);
    for (let k = 1; k < indices.length; k++) {
      combined = xorBuffers(combined, sourceBlocks[indices[k]]);
    }

    const base64Data = btoa(String.fromCharCode(...combined));
    const chunkHash = crc32(base64Data);
    const indicesStr = indices.join(',');

    chunks[totalK + j] = `AIRD:v3:FNT:${envelope.transferId}:${frameIndex}:${totalK}:${indices.length}:${seed}:${indicesStr}:${chunkHash}:${fullHash}:${envelope.totalBytes}:${fileNameSafe}:${fileTypeSafe}:${base64Data}`;
  }

  return { chunks, totalK, totalFrames };
}
