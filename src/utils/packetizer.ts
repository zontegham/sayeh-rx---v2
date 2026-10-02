/**
 * Packetizer for Optical Air-Gap Diode Transmitter
 * Splits encrypted envelopes into sequential QR frames with CRC32 verification
 */

import { ChunkPacket, EncryptedEnvelope } from '../types/index';

// Simple fast CRC32 for chunk validation
export function crc32(str: string): string {
  let crc = 0 ^ (-1);
  for (let i = 0; i < str.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ str.charCodeAt(i)) & 0xff];
  }
  return ((crc ^ (-1)) >>> 0).toString(16).padStart(8, '0');
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
}

/**
 * Split an encrypted envelope string into QR frame chunks
 * Uses adaptive chunk sizing and preallocated arrays to prevent memory crashes on heavy payloads
 */
export function packetizeEnvelope(
  envelope: EncryptedEnvelope,
  chunkSize: number = 420
): { chunks: string[]; packets: ChunkPacket[] } {
  const envelopeJson = JSON.stringify(envelope);
  const totalLength = envelopeJson.length;

  // Auto-adaptive chunk size: scale up chunk size for large payloads to prevent exploding chunk counts
  let effectiveChunkSize = chunkSize;
  if (totalLength > 3_000_000) {
    effectiveChunkSize = Math.max(chunkSize, 1200);
  } else if (totalLength > 1_500_000) {
    effectiveChunkSize = Math.max(chunkSize, 950);
  } else if (totalLength > 500_000) {
    effectiveChunkSize = Math.max(chunkSize, 720);
  } else if (totalLength > 100_000) {
    effectiveChunkSize = Math.max(chunkSize, 480);
  }

  const totalChunks = Math.max(1, Math.ceil(totalLength / effectiveChunkSize));

  const fullHash = envelope.hash ? envelope.hash.substring(0, 16) : '00000000';
  const fileNameSafe = envelope.fileName ? btoa(encodeURIComponent(envelope.fileName)) : '';
  const fileTypeSafe = envelope.fileType ? btoa(envelope.fileType) : '';

  const chunks: string[] = new Array(totalChunks);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * effectiveChunkSize;
    const end = Math.min(start + effectiveChunkSize, totalLength);
    const chunkData = envelopeJson.substring(start, end);
    const chunkHash = crc32(chunkData);

    // Wire protocol: AIRD:v2:<id>:<idx>:<total>:<chunkCrc>:<fullHash>:<bytes>:<fname>:<ftype>:<data>
    chunks[i] = `AIRD:v2:${envelope.transferId}:${i + 1}:${totalChunks}:${chunkHash}:${fullHash}:${envelope.totalBytes}:${fileNameSafe}:${fileTypeSafe}:${chunkData}`;
  }

  return { chunks, packets: [] };
}
