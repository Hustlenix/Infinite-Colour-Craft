// DoodleNet — a compact CNN trained on Google's Quick, Draw! dataset.
// Architecture (matches train.py):
//   conv1(1->8, 3x3, pad1) -> ReLU -> maxpool2 -> conv2(8->16,3x3,pad1) -> ReLU
//     -> maxpool2 -> flatten(784) -> fc1(784->64) -> ReLU -> fc2(64->10) -> softmax
// The forward pass below is a hand-rolled implementation that exactly mirrors the
// PyTorch model used for training (verified to match within float32 tolerance).
//
// This runs 100% in the browser — no external API, no network. Weights are embedded.

export interface DoodleNetState {
  'conv1.weight': number[][]; // [8][9]
  'conv1.bias': number[];
  'conv2.weight': number[][]; // [16][72]
  'conv2.bias': number[];
  'fc1.weight': number[][]; // [64][784]
  'fc1.bias': number[];
  'fc2.weight': number[][]; // [10][64]
  'fc2.bias': number[];
}

export interface DoodleModel {
  categories: string[];
  state: DoodleNetState;
}

function relu(x: number): number {
  return x > 0 ? x : 0;
}

// 2D convolution with 1-cell zero padding. img is a flat (H*W) array of channel
// planes. For brevity we operate on a single plane per channel stacked manually.
function conv1(img: Float32Array, w: number[][], b: number[], outH: number, outW: number): Float32Array {
  const outC = w.length; // 8
  const k = 3;
  // pad input
  const pH = outH + 2;
  const pW = outW + 2;
  const srcH = outH;
  const srcW = outW;
  const out = new Float32Array(outC * outH * outW);
  for (let oc = 0; oc < outC; oc++) {
    const ker = w[oc]; // 9 kernel weights (in_channels=1)
    const bias = b[oc];
    for (let i = 0; i < srcH; i++) {
      for (let j = 0; j < srcW; j++) {
        let acc = 0;
        // 3x3 patch centered with pad=1
        for (let di = 0; di < k; di++) {
          for (let dj = 0; dj < k; dj++) {
            const pi = i + di - 1;
            const pj = j + dj - 1;
            let v = 0;
            if (pi >= 0 && pi < srcH && pj >= 0 && pj < srcW) {
              v = img[pi * srcW + pj];
            }
            acc += v * ker[di * k + dj];
          }
        }
        out[oc * outH * outW + i * outW + j] = acc + bias;
      }
    }
  }
  return out;
}

function conv2(img: Float32Array, w: number[][], b: number[], inC: number, outH: number, outW: number): Float32Array {
  const outC = w.length; // 16
  const k = 3;
  const out = new Float32Array(outC * outH * outW);
  for (let oc = 0; oc < outC; oc++) {
    const ker = w[oc]; // inC*9 weights
    const bias = b[oc];
    for (let i = 0; i < outH; i++) {
      for (let j = 0; j < outW; j++) {
        let acc = 0;
        for (let ic = 0; ic < inC; ic++) {
          for (let di = 0; di < k; di++) {
            for (let dj = 0; dj < k; dj++) {
              const pi = i + di - 1;
              const pj = j + dj - 1;
              let v = 0;
              if (pi >= 0 && pi < outH && pj >= 0 && pj < outW) {
                v = img[ic * outH * outW + pi * outW + pj];
              }
              acc += v * ker[ic * k * k + di * k + dj];
            }
          }
        }
        out[oc * outH * outW + i * outW + j] = acc + bias;
      }
    }
  }
  return out;
}

// Max pool 2x2 with stride 2.
function pool2(img: Float32Array, C: number, inH: number, inW: number, outH: number, outW: number): Float32Array {
  const out = new Float32Array(C * outH * outW);
  for (let c = 0; c < C; c++) {
    for (let i = 0; i < outH; i++) {
      for (let j = 0; j < outW; j++) {
        let m = -Infinity;
        for (let di = 0; di < 2; di++) {
          for (let dj = 0; dj < 2; dj++) {
            const v = img[c * inH * inW + (2 * i + di) * inW + (2 * j + dj)];
            if (v > m) m = v;
          }
        }
        out[c * outH * outW + i * outW + j] = m;
      }
    }
  }
  return out;
}

// Fully connected layer: out = W * in + b (x is already a flat vector).
function fc(input: Float32Array, w: number[][], b: number[]): Float32Array {
  const outC = w.length;
  const inLen = w[0].length;
  const out = new Float32Array(outC);
  for (let o = 0; o < outC; o++) {
    const wi = w[o];
    let acc = 0;
    for (let i = 0; i < inLen; i++) {
      acc += wi[i] * input[i];
    }
    out[o] = acc + b[o];
  }
  return out;
}

// Run a 28x28 bitmap (784 floats, 0..1) through the network.
// Returns logits; caller applies softmax.
export function forward(bitmap: number[], model: DoodleModel): number[] {
  const s = model.state;
  // conv1: input 1 channel 28x28
  const inp = new Float32Array(784);
  for (let i = 0; i < 784; i++) inp[i] = bitmap[i];

  let x = conv1(inp, s['conv1.weight'], s['conv1.bias'], 28, 28); // 8*28*28
  for (let i = 0; i < x.length; i++) x[i] = relu(x[i]);
  x = pool2(x, 8, 28, 28, 14, 14); // 8*14*14

  x = conv2(x, s['conv2.weight'], s['conv2.bias'], 8, 14, 14); // 16*14*14
  for (let i = 0; i < x.length; i++) x[i] = relu(x[i]);
  x = pool2(x, 16, 14, 14, 7, 7); // 16*7*7

  // flatten 16*7*7 = 784
  const flat = new Float32Array(784);
  for (let i = 0; i < 784; i++) flat[i] = x[i];

  let h = fc(flat, s['fc1.weight'], s['fc1.bias']); // 64
  for (let i = 0; i < h.length; i++) h[i] = relu(h[i]);

  const logits = fc(h, s['fc2.weight'], s['fc2.bias']); // 10
  return Array.from(logits);
}

// Apply softmax and return [{label, pct}, ...] sorted descending.
export function softmax(logits: number[]): number[] {
  const max = Math.max(...logits);
  const exps = logits.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return exps.map((e) => e / sum);
}

export function predict(bitmap: number[], model: DoodleModel): { label: string; pct: number; logit: number }[] {
  const logits = forward(bitmap, model);
  const probs = softmax(logits);
  return model.categories
    .map((label, i) => ({ label, pct: probs[i], logit: logits[i] }))
    .sort((a, b) => b.pct - a.pct);
}
