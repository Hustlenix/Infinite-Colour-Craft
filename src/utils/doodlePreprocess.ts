/**
 * High-Quality Doodle Preprocessor for Quick, Draw! CNN (28x28 Grayscale)
 * 
 * Implements:
 * 1. Efficient single-pass bounding-box and center-of-mass detection with zero-copy isolation.
 * 2. High-Quality Area-Weighted Interpolation (INTER_AREA equivalent) for downscaling
 *    large 480px+ canvases to 28x28 without aliasing or missing thin strokes.
 * 3. Scale-Correct Adaptive Stroke Calibration to ensure strokes match the canonical
 *    1.6-2.2px stroke thickness of Google QuickDraw training tensors.
 * 4. Contrast normalization, noise gating, and balanced center-of-mass positioning
 *    for significantly higher classification accuracy.
 */

export interface PreprocessResult {
  bitmap: number[];
  hasStrokes: boolean;
  previewUrl: string;
}

const GRID = 28;
const TARGET_INNER_SIZE = 20; // 20x20 bounding box inside 28x28 (leaves 4px canonical margin)

/**
 * Area-weighted box filter interpolation (area integration).
 * Computes exact fractional pixel overlap to downscale arbitrary high-resolution
 * bounding boxes down to small neural grids with zero aliasing.
 */
function resampleAreaWeighted(
  src: Float32Array,
  srcW: number,
  srcH: number,
  dstW: number,
  dstH: number
): Float32Array {
  const dst = new Float32Array(dstW * dstH);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  for (let dy = 0; dy < dstH; dy++) {
    const sy0 = dy * yRatio;
    const sy1 = (dy + 1) * yRatio;
    const yStart = Math.floor(sy0);
    const yEnd = Math.min(srcH - 1, Math.floor(sy1));

    for (let dx = 0; dx < dstW; dx++) {
      const sx0 = dx * xRatio;
      const sx1 = (dx + 1) * xRatio;
      const xStart = Math.floor(sx0);
      const xEnd = Math.min(srcW - 1, Math.floor(sx1));

      let accum = 0;
      let totalArea = 0;

      for (let y = yStart; y <= yEnd; y++) {
        const yTop = Math.max(sy0, y);
        const yBottom = Math.min(sy1, y + 1);
        const yWeight = Math.max(0, yBottom - yTop);
        if (yWeight <= 0) continue;

        const rowOffset = y * srcW;

        for (let x = xStart; x <= xEnd; x++) {
          const xLeft = Math.max(sx0, x);
          const xRight = Math.min(sx1, x + 1);
          const xWeight = Math.max(0, xRight - xLeft);
          if (xWeight <= 0) continue;

          const area = xWeight * yWeight;
          accum += src[rowOffset + x] * area;
          totalArea += area;
        }
      }

      dst[dy * dstW + dx] = totalArea > 0 ? accum / totalArea : 0;
    }
  }

  return dst;
}

/**
 * Adaptive stroke scale correction:
 * On high-resolution canvases (like 480x480), downsampling by 20x can shrink
 * stroke thickness below 1 pixel in 28x28 space. QuickDraw CNN conv filters
 * expect solid lines with 1.6 - 2.2px thickness. This soft dilation kernel
 * widens thin lines while preserving curves and corners.
 */
function applyScaleCorrection(
  grid: Float32Array,
  w: number,
  h: number,
  expansionStrength: number
): Float32Array {
  if (expansionStrength <= 0) return grid;

  const out = new Float32Array(w * h);
  const directWeight = Math.min(0.75, expansionStrength * 0.7);
  const diagWeight = Math.min(0.45, expansionStrength * 0.4);

  for (let y = 0; y < h; y++) {
    const yOff = y * w;
    for (let x = 0; x < w; x++) {
      const centerVal = grid[yOff + x];
      let maxVal = centerVal;

      // 4-connected neighbors
      if (x > 0) maxVal = Math.max(maxVal, grid[yOff + x - 1] * directWeight);
      if (x < w - 1) maxVal = Math.max(maxVal, grid[yOff + x + 1] * directWeight);
      if (y > 0) maxVal = Math.max(maxVal, grid[(y - 1) * w + x] * directWeight);
      if (y < h - 1) maxVal = Math.max(maxVal, grid[(y + 1) * w + x] * directWeight);

      // 8-connected diagonals
      if (x > 0 && y > 0) maxVal = Math.max(maxVal, grid[(y - 1) * w + x - 1] * diagWeight);
      if (x < w - 1 && y > 0) maxVal = Math.max(maxVal, grid[(y - 1) * w + x + 1] * diagWeight);
      if (x > 0 && y < h - 1) maxVal = Math.max(maxVal, grid[(y + 1) * w + x - 1] * diagWeight);
      if (x < w - 1 && y < h - 1) maxVal = Math.max(maxVal, grid[(y + 1) * w + x + 1] * diagWeight);

      out[yOff + x] = Math.min(1.0, maxVal);
    }
  }

  return out;
}

export function preprocessCanvas(
  sourceCanvas: HTMLCanvasElement,
  isDarkMode: boolean
): PreprocessResult {
  const srcW = sourceCanvas.width;
  const srcH = sourceCanvas.height;
  const emptyBitmap = new Array<number>(GRID * GRID).fill(0);

  if (srcW === 0 || srcH === 0) {
    return { bitmap: emptyBitmap, hasStrokes: false, previewUrl: '' };
  }

  const srcCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
  if (!srcCtx) {
    return { bitmap: emptyBitmap, hasStrokes: false, previewUrl: '' };
  }

  // 1. Read pixel buffer from source canvas
  const imgData = srcCtx.getImageData(0, 0, srcW, srcH);
  const data = imgData.data;

  // Single-pass bounding box and stroke energy detector
  let minX = srcW;
  let minY = srcH;
  let maxX = 0;
  let maxY = 0;
  let strokePixelCount = 0;
  let sumWeightedX = 0;
  let sumWeightedY = 0;
  let totalStrokeEnergy = 0;

  // Step sampling for bounding box: step by 1 on standard resolutions
  for (let y = 0; y < srcH; y++) {
    const rowOffset = y * srcW * 4;
    for (let x = 0; x < srcW; x++) {
      const idx = rowOffset + x * 4;
      const a = data[idx + 3];
      if (a < 20) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      // Extract stroke intensity (0 = background, 1 = maximum stroke ink)
      let intensity = 0;
      if (isDarkMode) {
        if (lum > 40) {
          intensity = Math.min(1.0, ((lum - 40) / 180) * (a / 255));
        }
      } else {
        if (lum < 225) {
          intensity = Math.min(1.0, ((225 - lum) / 180) * (a / 255));
        }
      }

      if (intensity > 0.12) {
        strokePixelCount++;
        totalStrokeEnergy += intensity;
        sumWeightedX += x * intensity;
        sumWeightedY += y * intensity;

        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If no strokes or just accidental click dab (fewer than 15 pixels)
  if (strokePixelCount < 15 || minX > maxX || minY > maxY || totalStrokeEnergy < 4) {
    return { bitmap: emptyBitmap, hasStrokes: false, previewUrl: '' };
  }

  // 2. Add padding around bounding box to capture anti-aliased edges cleanly
  const edgePad = Math.max(4, Math.round(srcW * 0.015));
  const cropX0 = Math.max(0, minX - edgePad);
  const cropY0 = Math.max(0, minY - edgePad);
  const cropX1 = Math.min(srcW - 1, maxX + edgePad);
  const cropY1 = Math.min(srcH - 1, maxY + edgePad);

  const cropW = cropX1 - cropX0 + 1;
  const cropH = cropY1 - cropY0 + 1;

  // 3. Extract cropped intensity buffer
  const cropBuffer = new Float32Array(cropW * cropH);
  for (let cy = 0; cy < cropH; cy++) {
    const srcY = cropY0 + cy;
    const rowOffset = srcY * srcW * 4;
    const cropRowOffset = cy * cropW;

    for (let cx = 0; cx < cropW; cx++) {
      const srcX = cropX0 + cx;
      const idx = rowOffset + srcX * 4;
      const a = data[idx + 3];
      if (a < 15) continue;

      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const lum = 0.299 * r + 0.587 * g + 0.114 * b;

      let intensity = 0;
      if (isDarkMode) {
        if (lum > 35) {
          intensity = Math.min(1.0, ((lum - 35) / 190) * (a / 255));
        }
      } else {
        if (lum < 230) {
          intensity = Math.min(1.0, ((230 - lum) / 190) * (a / 255));
        }
      }

      if (intensity > 0.05) {
        cropBuffer[cropRowOffset + cx] = intensity;
      }
    }
  }

  // 4. Calculate scaling to fit into 20x20 maintaining aspect ratio
  const maxDim = Math.max(cropW, cropH);
  const scale = TARGET_INNER_SIZE / maxDim;
  const dstW = Math.max(1, Math.min(TARGET_INNER_SIZE, Math.round(cropW * scale)));
  const dstH = Math.max(1, Math.min(TARGET_INNER_SIZE, Math.round(cropH * scale)));

  // High-Quality Area-Weighted Interpolation Downsampling
  const resampled = resampleAreaWeighted(cropBuffer, cropW, cropH, dstW, dstH);

  // 5. Adaptive Stroke Calibration
  // Compute how much the stroke got compressed compared to original resolution
  // If downsampling factor is > 8x, thin strokes need soft morphological expansion
  const downsampleRatio = maxDim / TARGET_INNER_SIZE;
  const expansionFactor = Math.max(0, Math.min(1.0, (downsampleRatio - 6) / 14));
  const calibrated = applyScaleCorrection(resampled, dstW, dstH, expansionFactor);

  // 6. Placement & Center of Mass Alignment in 28x28 grid
  // Compute center of mass of the downsampled stroke
  let resampleEnergy = 0;
  let resampleX = 0;
  let resampleY = 0;
  for (let y = 0; y < dstH; y++) {
    const yOff = y * dstW;
    for (let x = 0; x < dstW; x++) {
      const v = calibrated[yOff + x];
      if (v > 0.08) {
        resampleEnergy += v;
        resampleX += x * v;
        resampleY += y * v;
      }
    }
  }

  // Default placement: bounding box centered in 28x28
  let posX = Math.floor((GRID - dstW) / 2);
  let posY = Math.floor((GRID - dstH) / 2);

  // Fine-tune with Center of Mass (weighted towards true optical center)
  if (resampleEnergy > 0) {
    const cmX = posX + (resampleX / resampleEnergy);
    const cmY = posY + (resampleY / resampleEnergy);
    const targetCM = 13.5; // True center of 28x28
    const shiftX = Math.round((targetCM - cmX) * 0.4);
    const shiftY = Math.round((targetCM - cmY) * 0.4);

    // Keep comfortably within 28x28 bounds
    posX = Math.max(1, Math.min(GRID - dstW - 1, posX + shiftX));
    posY = Math.max(1, Math.min(GRID - dstH - 1, posY + shiftY));
  }

  // 7. Stamp into 28x28 grid
  const fullGrid = new Float32Array(GRID * GRID);
  let peakVal = 0;

  for (let y = 0; y < dstH; y++) {
    const targetY = posY + y;
    if (targetY < 0 || targetY >= GRID) continue;
    const srcRow = y * dstW;
    const dstRow = targetY * GRID;

    for (let x = 0; x < dstW; x++) {
      const targetX = posX + x;
      if (targetX < 0 || targetX >= GRID) continue;
      const val = calibrated[srcRow + x];
      fullGrid[dstRow + targetX] = val;
      if (val > peakVal) peakVal = val;
    }
  }

  // 8. Dynamic Range Stretching & Contrast Boost (Matches QuickDraw distribution)
  const bitmap = new Array<number>(GRID * GRID);
  const normFactor = peakVal > 0.1 ? 1.0 / peakVal : 1.0;

  for (let i = 0; i < GRID * GRID; i++) {
    let v = fullGrid[i];
    if (v < 0.04) {
      bitmap[i] = 0;
      continue;
    }

    // Stretch to full 0..1 range
    v = v * normFactor;

    // Perceptual gamma curve to give solid core with smooth anti-aliased edges
    v = Math.min(1.0, Math.pow(v, 0.78) * 1.12);
    bitmap[i] = Math.round(v * 1000) / 1000;
  }

  // 9. Generate crisp sensor preview data URL
  let previewUrl = '';
  try {
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = GRID;
    previewCanvas.height = GRID;
    const pCtx = previewCanvas.getContext('2d');
    if (pCtx) {
      const pImgData = pCtx.createImageData(GRID, GRID);
      const pData = pImgData.data;

      for (let i = 0; i < GRID * GRID; i++) {
        const val = Math.round(bitmap[i] * 255);
        const idx = i * 4;
        pData[idx] = val;     // R
        pData[idx + 1] = val; // G
        pData[idx + 2] = val; // B
        pData[idx + 3] = 255; // Alpha
      }

      pCtx.putImageData(pImgData, 0, 0);
      previewUrl = previewCanvas.toDataURL();
    }
  } catch {
    // ignore
  }

  return { bitmap, hasStrokes: true, previewUrl };
}
