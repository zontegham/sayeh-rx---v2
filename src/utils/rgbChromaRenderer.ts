/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * 
 * RGB Optical Chroma-Multiplexing Engine for Air-Gap Data Transmission
 * Multiplexes up to 3 independent packet payloads across Red, Green, and Blue optical channels
 * onto a single physical frame, yielding an immediate 300% throughput gain.
 */

import QRCode from 'qrcode';
import { AntiGlareTheme } from '../types/index';

export interface RgbChromaOptions {
  theme?: AntiGlareTheme;
  margin?: number;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
}

export interface RgbChromaResult {
  svg: string;
  version: number;
  matrixSize: number;
  activeChannels: {
    r: boolean;
    g: boolean;
    b: boolean;
  };
  channelChunks: {
    r: string;
    g?: string;
    b?: string;
  };
}

/**
 * Palette configurations for the optical chroma renderer
 */
const THEME_PALETTES = {
  additive_dark: {
    bg: '#050811',
    colors: {
      '000': null,             // Background
      '100': '#ff2222',       // Red channel (650nm)
      '010': '#00ff44',       // Green channel (532nm)
      '001': '#2266ff',       // Blue channel (450nm)
      '110': '#ffff00',       // R + G = Yellow
      '101': '#ff00ff',       // R + B = Magenta
      '011': '#00ffff',       // G + B = Cyan
      '111': '#ffffff',       // R + G + B = White (corner targets & overlaps)
    } as Record<string, string | null>,
  },
  subtractive_light: {
    bg: '#ffffff',
    colors: {
      '000': null,             // White background
      '100': '#e6005c',       // High-density ruby
      '010': '#00994d',       // High-density forest green
      '001': '#0066cc',       // High-density deep blue
      '110': '#b8860b',       // Overlap Gold
      '101': '#7a0099',       // Overlap Purple
      '011': '#007a87',       // Overlap Teal
      '111': '#000000',       // Tri-channel overlap = Pitch Black
    } as Record<string, string | null>,
  },
  anti_glare: {
    bg: '#090e17',
    colors: {
      '000': null,             // Anti-reflective matte obsidian
      '100': '#ff3b30',       // Luminescent high-contrast red
      '010': '#30d158',       // Luminescent phosphor green
      '001': '#0a84ff',       // Luminescent electric blue
      '110': '#ffd60a',       // Phosphor amber
      '101': '#ff375f',       // Luminescent rose
      '011': '#64d2ff',       // Luminescent cyan
      '111': '#ffffff',       // Pure white phosphor
    } as Record<string, string | null>,
  },
};

/**
 * Creates an RGB Chroma Multiplexed QR Code SVG containing up to 3 separate chunk payloads.
 */
export async function renderRgbChromaSvg(
  chunkR: string,
  chunkG?: string,
  chunkB?: string,
  options: RgbChromaOptions = {}
): Promise<RgbChromaResult> {
  const {
    theme = 'additive_dark',
    margin = 3,
    errorCorrectionLevel = 'M',
  } = options;

  if (!chunkR) {
    throw new Error('Chroma Red channel chunk is required.');
  }

  // 1. Measure required QR versions for available chunks
  const testOpts = { errorCorrectionLevel };
  const rawQrR = QRCode.create(chunkR, testOpts);
  const rawQrG = chunkG ? QRCode.create(chunkG, testOpts) : null;
  const rawQrB = chunkB ? QRCode.create(chunkB, testOpts) : null;

  // 2. Normalize to maximum common version so all 3 codes share the exact same grid dimensions
  const maxVersion = Math.max(
    rawQrR.version,
    rawQrG?.version ?? 1,
    rawQrB?.version ?? 1
  );

  // 3. Instantiate normalized QR codes
  const normOpts = { version: maxVersion, errorCorrectionLevel };
  const qrR = QRCode.create(chunkR, normOpts);
  const qrG = chunkG ? QRCode.create(chunkG, normOpts) : null;
  const qrB = chunkB ? QRCode.create(chunkB, normOpts) : null;

  const size = qrR.modules.size;
  const totalDim = size + margin * 2;
  const palette = THEME_PALETTES[theme] || THEME_PALETTES.additive_dark;

  // 4. Construct SVG paths with horizontal run-length compression for blazing rendering speed
  const rectsByColor: Record<string, string[]> = {};

  for (let r = 0; r < size; r++) {
    let currentCol: string | null = null;
    let spanStart = 0;
    let spanLen = 0;

    for (let c = 0; c < size; c++) {
      const bitR = qrR.modules.get(r, c);
      const bitG = qrG ? qrG.modules.get(r, c) : 0;
      const bitB = qrB ? qrB.modules.get(r, c) : 0;

      const key = `${bitR}${bitG}${bitB}`;
      const color = palette.colors[key];

      if (color === currentCol) {
        spanLen++;
      } else {
        if (currentCol && spanLen > 0) {
          if (!rectsByColor[currentCol]) rectsByColor[currentCol] = [];
          rectsByColor[currentCol].push(
            `M${margin + spanStart},${margin + r}h${spanLen}v1h-${spanLen}z`
          );
        }
        currentCol = color;
        spanStart = c;
        spanLen = 1;
      }
    }

    if (currentCol && spanLen > 0) {
      if (!rectsByColor[currentCol]) rectsByColor[currentCol] = [];
      rectsByColor[currentCol].push(
        `M${margin + spanStart},${margin + r}h${spanLen}v1h-${spanLen}z`
      );
    }
  }

  // 5. Assemble final clean, vector-sharp SVG string
  const pathElements = Object.entries(rectsByColor)
    .map(([color, paths]) => `<path fill="${color}" d="${paths.join('')}" />`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalDim} ${totalDim}" shape-rendering="crispEdges" width="100%" height="100%" style="background-color: ${palette.bg}; display: block; border-radius: 8px;">${pathElements}</svg>`;

  return {
    svg,
    version: maxVersion,
    matrixSize: size,
    activeChannels: {
      r: true,
      g: !!chunkG,
      b: !!chunkB,
    },
    channelChunks: {
      r: chunkR,
      g: chunkG,
      b: chunkB,
    },
  };
}

/**
 * Returns descriptive metadata for the optical wavelengths and channel statuses
 */
export function getRgbChannelTelemetry(
  channelCount: 1 | 2 | 3,
  theme: AntiGlareTheme
) {
  return [
    {
      channel: 'R' as const,
      colorName: 'قرمز نوری (Red)',
      wavelength: '650 nm',
      active: true,
      badgeColor: 'bg-red-500/20 text-red-500 border-red-500/40',
      dotColor: 'bg-red-500',
    },
    {
      channel: 'G' as const,
      colorName: 'سبز نوری (Green)',
      wavelength: '532 nm',
      active: channelCount >= 2,
      badgeColor: 'bg-green-500/20 text-green-500 border-green-500/40',
      dotColor: 'bg-green-500',
    },
    {
      channel: 'B' as const,
      colorName: 'آبی نوری (Blue)',
      wavelength: '450 nm',
      active: channelCount >= 3,
      badgeColor: 'bg-blue-500/20 text-blue-500 border-blue-500/40',
      dotColor: 'bg-blue-500',
    },
  ];
}
