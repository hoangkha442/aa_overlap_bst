
// import seedrandom from "seedrandom";

// export type CutDim = "x" | "y";
// export type Point = { x: number; y: number };

// export type SimConfig = {
//   Lx: number;
//   Ly: number;
//   nx: number;
//   ny: number;

//   alpha: number;        // overlap control (0..0.24)
//   sigma: number;        // noise std (dB)
//   samplesPerStep: number; // M: number of measurements per step (averaged)
//   safeMode: boolean;    // guarantee demo won't eliminate target

//   P0: number;
//   eta: number;
//   sensorFrac: number;
// };

// export type RegionStats = {
//   total: number;
//   rows: number;
//   cols: number;
//   xMin: number;
//   xMax: number;
//   yMin: number;
//   yMax: number;
//   spanX: number;
//   spanY: number;
// };

// export type SimStepState = {
//   step: number;
//   xs: number[];
//   ys: number[];

//   before: boolean[][];  // region before cut (n_prev)
//   active: boolean[][];  // region after choosing (n_after)

//   H1: boolean[][];
//   H2: boolean[][];
//   overlap: boolean[][];
//   chosen: boolean[][];

//   cutDim: CutDim;
//   mid: number;
//   delta: number;

//   sensors: [Point, Point];
//   z: [number, number];

//   target: Point;
//   targetKept: boolean;

//   bbox: { xMin: number; xMax: number; yMin: number; yMax: number };

//   maxLL_H1: number;
//   maxLL_H2: number;
//   chosenName: "H1" | "H2";

//   // new: make UI explainable
//   nPrev: RegionStats;
//   nAfter: RegionStats;
//   samplesUsed: number;
//   sigmaEff: number;
//   forcedChoice: boolean; // true if safeMode flipped the decision
// };

// function linspace(a: number, b: number, n: number) {
//   if (n <= 1) return [a];
//   const arr: number[] = [];
//   const step = (b - a) / (n - 1);
//   for (let i = 0; i < n; i++) arr.push(a + i * step);
//   return arr;
// }

// function zerosBool(h: number, w: number, v = false) {
//   return Array.from({ length: h }, () => Array.from({ length: w }, () => v));
// }

// function cloneBool(m: boolean[][]) {
//   return m.map((row) => row.slice());
// }

// function anyRow(m: boolean[][], r: number) {
//   for (let c = 0; c < m[0].length; c++) if (m[r][c]) return true;
//   return false;
// }

// function anyCol(m: boolean[][], c: number) {
//   for (let r = 0; r < m.length; r++) if (m[r][c]) return true;
//   return false;
// }

// function activeIndices(mask: boolean[][]) {
//   const rows: number[] = [];
//   const cols: number[] = [];
//   for (let r = 0; r < mask.length; r++) if (anyRow(mask, r)) rows.push(r);
//   for (let c = 0; c < mask[0].length; c++) if (anyCol(mask, c)) cols.push(c);
//   return { rows, cols };
// }

// function regionStats(mask: boolean[][], xs: number[], ys: number[]): RegionStats {
//   const { rows, cols } = activeIndices(mask);

//   let total = 0;
//   for (let r = 0; r < mask.length; r++) for (let c = 0; c < mask[0].length; c++) if (mask[r][c]) total++;

//   if (!rows.length || !cols.length) {
//     return { total, rows: rows.length, cols: cols.length, xMin: 0, xMax: 0, yMin: 0, yMax: 0, spanX: 0, spanY: 0 };
//   }

//   const xMin = xs[cols[0]];
//   const xMax = xs[cols[cols.length - 1]];
//   const yMin = ys[rows[0]];
//   const yMax = ys[rows[rows.length - 1]];

//   return {
//     total,
//     rows: rows.length,
//     cols: cols.length,
//     xMin,
//     xMax,
//     yMin,
//     yMax,
//     spanX: xMax - xMin,
//     spanY: yMax - yMin,
//   };
// }

// function chooseCutDim(mask: boolean[][], xs: number[], ys: number[]) {
//   const stats = regionStats(mask, xs, ys);
//   const cutDim: CutDim = stats.spanX >= stats.spanY ? "x" : "y";
//   const { rows, cols } = activeIndices(mask);
//   return { cutDim, ...stats, rowsIdx: rows, colsIdx: cols };
// }

// function computeDelta(nPrev: number, alpha: number) {
//   const half = Math.ceil(0.5 * nPrev);
//   let newN = Math.round((0.5 + alpha) * nPrev);
//   newN = Math.max(newN, half);
//   const delta = Math.max(0, newN - half);
//   return { newN, delta };
// }

// // Path-loss mean in dB: mu(d) = P0 - 10*eta*log10(d + eps)
// function pathlossDb(d: number, P0: number, eta: number, eps = 1e-3) {
//   return P0 - 10 * eta * Math.log10(d + eps);
// }

// function dist(a: Point, b: Point) {
//   const dx = a.x - b.x;
//   const dy = a.y - b.y;
//   return Math.hypot(dx, dy);
// }

// // Box-Muller normal(0,1)
// function randn(rng: seedrandom.PRNG) {
//   let u = 0, v = 0;
//   while (u === 0) u = rng();
//   while (v === 0) v = rng();
//   return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
// }

// function placeSensorsSymmetric(
//   cutDim: CutDim,
//   mid: number,
//   bbox: { xMin: number; xMax: number; yMin: number; yMax: number },
//   sensorFrac: number
// ): [Point, Point] {
//   const cx = 0.5 * (bbox.xMin + bbox.xMax);
//   const cy = 0.5 * (bbox.yMin + bbox.yMax);

//   if (cutDim === "x") {
//     const span = Math.max(1e-6, bbox.xMax - bbox.xMin);
//     const s = sensorFrac * span;
//     return [{ x: mid - s, y: cy }, { x: mid + s, y: cy }];
//   } else {
//     const span = Math.max(1e-6, bbox.yMax - bbox.yMin);
//     const s = sensorFrac * span;
//     return [{ x: cx, y: mid - s }, { x: cx, y: mid + s }];
//   }
// }

// // function buildPartitions(activeBefore: boolean[][], xs: number[], ys: number[], alpha: number) {
// //   const info = chooseCutDim(activeBefore, xs, ys);
// //   const { cutDim, rowsIdx, colsIdx } = info;

// //   const H1 = cloneBool(activeBefore);
// //   const H2 = cloneBool(activeBefore);

// //   let mid = 0;
// //   let delta = 0;

// //   if (cutDim === "x") {
// //     const nPrev = colsIdx.length;
// //     const midCol = colsIdx[Math.floor(nPrev / 2)];
// //     mid = xs[midCol];

// //     ({ delta } = computeDelta(nPrev, alpha));

// //     const leftMax = Math.min(colsIdx[colsIdx.length - 1], midCol + delta);
// //     const rightMin = Math.max(colsIdx[0], midCol - delta);

// //     for (let r = 0; r < activeBefore.length; r++) {
// //       for (let c = 0; c < activeBefore[0].length; c++) {
// //         if (c > leftMax) H1[r][c] = false;
// //         if (c < rightMin) H2[r][c] = false;
// //       }
// //     }
// //   } else {
// //     const nPrev = rowsIdx.length;
// //     const midRow = rowsIdx[Math.floor(nPrev / 2)];
// //     mid = ys[midRow];

// //     ({ delta } = computeDelta(nPrev, alpha));

// //     const lowMax = Math.min(rowsIdx[rowsIdx.length - 1], midRow + delta);
// //     const highMin = Math.max(rowsIdx[0], midRow - delta);

// //     for (let r = 0; r < activeBefore.length; r++) {
// //       for (let c = 0; c < activeBefore[0].length; c++) {
// //         if (r > lowMax) H1[r][c] = false;
// //         if (r < highMin) H2[r][c] = false;
// //       }
// //     }
// //   }

// //   const overlap = zerosBool(activeBefore.length, activeBefore[0].length, false);
// //   for (let r = 0; r < activeBefore.length; r++) {
// //     for (let c = 0; c < activeBefore[0].length; c++) overlap[r][c] = H1[r][c] && H2[r][c];
// //   }

// //   return { cutDim, mid, delta, H1, H2, overlap, bbox: info };
// // }

// function buildPartitions(activeBefore: boolean[][], xs: number[], ys: number[], alpha: number) {
//   const info = chooseCutDim(activeBefore, xs, ys);
//   const { cutDim, rowsIdx, colsIdx } = info;

//   const H1 = cloneBool(activeBefore);
//   const H2 = cloneBool(activeBefore);

//   let mid = 0;
//   let delta = 0;

//   if (cutDim === "x") {
//     const n = colsIdx.length;
//     if (n <= 1) {
//       mid = xs[colsIdx[0]];
//       delta = 0;
//     } else {
//       const leftSize = Math.ceil(n / 2);         // size of left half
//       const boundaryLeft = leftSize - 1;         // index in colsIdx (last of left half)
//       ({ delta } = computeDelta(n, alpha));

//       // mid is BETWEEN boundaryLeft and boundaryLeft+1
//       const cL = colsIdx[boundaryLeft];
//       const cR = colsIdx[boundaryLeft + 1];
//       mid = 0.5 * (xs[cL] + xs[cR]);

//       // expand overlap by delta (in "index-space" of colsIdx)
//       const leftMaxIdx = Math.min(n - 1, boundaryLeft + delta);
//       const rightMinIdx = Math.max(0, (boundaryLeft + 1) - delta);

//       const leftMaxCol = colsIdx[leftMaxIdx];
//       const rightMinCol = colsIdx[rightMinIdx];

//       for (let r = 0; r < activeBefore.length; r++) {
//         for (let c = 0; c < activeBefore[0].length; c++) {
//           if (c > leftMaxCol) H1[r][c] = false;
//           if (c < rightMinCol) H2[r][c] = false;
//         }
//       }
//     }
//   } else {
//     const n = rowsIdx.length;
//     if (n <= 1) {
//       mid = ys[rowsIdx[0]];
//       delta = 0;
//     } else {
//       const leftSize = Math.ceil(n / 2);
//       const boundaryLow = leftSize - 1;
//       ({ delta } = computeDelta(n, alpha));

//       const rB = rowsIdx[boundaryLow];
//       const rT = rowsIdx[boundaryLow + 1];
//       mid = 0.5 * (ys[rB] + ys[rT]);

//       const lowMaxIdx = Math.min(n - 1, boundaryLow + delta);
//       const highMinIdx = Math.max(0, (boundaryLow + 1) - delta);

//       const lowMaxRow = rowsIdx[lowMaxIdx];
//       const highMinRow = rowsIdx[highMinIdx];

//       for (let r = 0; r < activeBefore.length; r++) {
//         for (let c = 0; c < activeBefore[0].length; c++) {
//           if (r > lowMaxRow) H1[r][c] = false;
//           if (r < highMinRow) H2[r][c] = false;
//         }
//       }
//     }
//   }

//   const overlap = zerosBool(activeBefore.length, activeBefore[0].length, false);
//   for (let r = 0; r < activeBefore.length; r++) {
//     for (let c = 0; c < activeBefore[0].length; c++) overlap[r][c] = H1[r][c] && H2[r][c];
//   }

//   return { cutDim, mid, delta, H1, H2, overlap, bbox: info };
// }

// export function initSim(config: SimConfig, seed = "7"): SimStepState {
//   const xs = linspace(0, config.Lx, config.nx);
//   const ys = linspace(0, config.Ly, config.ny);

//   const active = zerosBool(config.ny, config.nx, true);
//   const rng = seedrandom(seed);

//   const tx = Math.floor(rng() * config.nx);
//   const ty = Math.floor(rng() * config.ny);
//   const target: Point = { x: xs[tx], y: ys[ty] };

//   const empty = zerosBool(config.ny, config.nx, false);
//   const stats0 = regionStats(active, xs, ys);

//   return {
//     step: 0,
//     xs,
//     ys,

//     before: active,
//     active,

//     H1: empty,
//     H2: empty,
//     overlap: empty,
//     chosen: empty,

//     cutDim: "x",
//     mid: 0,
//     delta: 0,

//     sensors: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
//     z: [0, 0],

//     target,
//     targetKept: true,

//     bbox: { xMin: stats0.xMin, xMax: stats0.xMax, yMin: stats0.yMin, yMax: stats0.yMax },

//     maxLL_H1: -Infinity,
//     maxLL_H2: -Infinity,
//     chosenName: "H1",

//     nPrev: stats0,
//     nAfter: stats0,

//     samplesUsed: 0,
//     sigmaEff: config.sigma,
//     forcedChoice: false,
//   };
// }

// export function stepSim(prev: SimStepState, config: SimConfig, seed: string): SimStepState {
//   const rng = seedrandom(`${seed}:${prev.step}`);

//   const activeBefore = prev.active;
//   const nPrev = regionStats(activeBefore, prev.xs, prev.ys);

//   const { cutDim, mid, delta, H1, H2, overlap, bbox } = buildPartitions(activeBefore, prev.xs, prev.ys, config.alpha);
//   const sensors = placeSensorsSymmetric(
//     cutDim,
//     mid,
//     { xMin: bbox.xMin, xMax: bbox.xMax, yMin: bbox.yMin, yMax: bbox.yMax },
//     config.sensorFrac
//   );

//   // --- averaged measurements to reduce noise ---
//   const M = Math.max(1, Math.floor(config.samplesPerStep));
//   const sigmaEff = config.sigma / Math.sqrt(M);

//   const muTrue1 = pathlossDb(dist(sensors[0], prev.target), config.P0, config.eta);
//   const muTrue2 = pathlossDb(dist(sensors[1], prev.target), config.P0, config.eta);

//   let z1 = 0;
//   let z2 = 0;
//   for (let i = 0; i < M; i++) {
//     z1 += muTrue1 + config.sigma * randn(rng);
//     z2 += muTrue2 + config.sigma * randn(rng);
//   }
//   z1 /= M;
//   z2 /= M;

//   const z: [number, number] = [z1, z2];

//   // ML (use sigmaEff for likelihood when using averaged z)
//   let maxLL_H1 = -Infinity;
//   let maxLL_H2 = -Infinity;

//   const sigma2 = sigmaEff * sigmaEff;

//   for (let r = 0; r < activeBefore.length; r++) {
//     for (let c = 0; c < activeBefore[0].length; c++) {
//       if (!activeBefore[r][c]) continue;

//       const p: Point = { x: prev.xs[c], y: prev.ys[r] };
//       const mu1 = pathlossDb(dist(sensors[0], p), config.P0, config.eta);
//       const mu2 = pathlossDb(dist(sensors[1], p), config.P0, config.eta);

//       // loglik ∝ -||z - mu||^2 / (2*sigmaEff^2)
//       const ll = -((z1 - mu1) ** 2 + (z2 - mu2) ** 2) / (2 * sigma2);

//       if (H1[r][c] && ll > maxLL_H1) maxLL_H1 = ll;
//       if (H2[r][c] && ll > maxLL_H2) maxLL_H2 = ll;
//     }
//   }

//   let chosenName: "H1" | "H2" = maxLL_H1 >= maxLL_H2 ? "H1" : "H2";
//   let chosen = chosenName === "H1" ? H1 : H2;

//   // target membership (on-grid)
//   const tx = prev.xs.findIndex((x) => x === prev.target.x);
//   const ty = prev.ys.findIndex((y) => y === prev.target.y);
//   let targetKept = tx >= 0 && ty >= 0 ? chosen[ty][tx] : true;

//   // --- GUARANTEE mode: never eliminate target in demo ---
//   let forcedChoice = false;
//   if (config.safeMode && tx >= 0 && ty >= 0 && !targetKept) {
//     forcedChoice = true;
//     chosenName = chosenName === "H1" ? "H2" : "H1";
//     chosen = chosenName === "H1" ? H1 : H2;
//     targetKept = true;
//   }

//   const nAfter = regionStats(chosen, prev.xs, prev.ys);

//   return {
//     step: prev.step + 1,
//     xs: prev.xs,
//     ys: prev.ys,

//     before: activeBefore,
//     active: chosen,

//     H1,
//     H2,
//     overlap,
//     chosen,

//     cutDim,
//     mid,
//     delta,

//     sensors,
//     z,

//     target: prev.target,
//     targetKept,

//     bbox: { xMin: bbox.xMin, xMax: bbox.xMax, yMin: bbox.yMin, yMax: bbox.yMax },

//     maxLL_H1,
//     maxLL_H2,
//     chosenName,

//     nPrev,
//     nAfter,

//     samplesUsed: M,
//     sigmaEff,
//     forcedChoice,
//   };
// }


import seedrandom from "seedrandom";

export type CutDim = "x" | "y";
export type Point = { x: number; y: number };

export type SimConfig = {
  Lx: number;
  Ly: number;
  nx: number;
  ny: number;

  alpha: number;          // overlap control (0..0.24)
  sigma: number;          // noise std (dB)
  samplesPerStep: number; // M
  safeMode: boolean;      // guarantee demo won't eliminate target

  P0: number;
  eta: number;
  sensorFrac: number;
};

export type RegionStats = {
  total: number;
  rows: number;
  cols: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
  spanX: number;
  spanY: number;
};

export type PartitionMeta = {
  cutDim: CutDim;
  nCut: number;         // number of active cols (if x) or active rows (if y)
  leftSize: number;     // ceil(nCut/2)
  boundaryIdx: number;  // left half last index (in active index list)
  leftMaxIdx: number;   // (boundaryIdx + delta) clamped
  rightMinIdx: number;  // (boundaryIdx+1 - delta) clamped
  mid: number;          // boundary midpoint in continuous coordinate
  delta: number;        // overlap thickness in "index space"
};

export type SimStepState = {
  step: number;
  xs: number[];
  ys: number[];

  before: boolean[][];  // n_prev mask
  active: boolean[][];  // n_after mask

  H1: boolean[][];
  H2: boolean[][];
  overlap: boolean[][];
  chosen: boolean[][];

  cutDim: CutDim;
  mid: number;
  delta: number;

  sensors: [Point, Point];
  z: [number, number];

  target: Point;
  targetKept: boolean;

  bbox: { xMin: number; xMax: number; yMin: number; yMax: number };

  maxLL_H1: number;
  maxLL_H2: number;
  chosenName: "H1" | "H2";
  llGap: number;        // maxLL_H1 - maxLL_H2

  nPrev: RegionStats;
  nAfter: RegionStats;

  samplesUsed: number;
  sigmaEff: number;
  forcedChoice: boolean;

  partMeta: PartitionMeta | null;
};

function linspace(a: number, b: number, n: number) {
  if (n <= 1) return [a];
  const arr: number[] = [];
  const step = (b - a) / (n - 1);
  for (let i = 0; i < n; i++) arr.push(a + i * step);
  return arr;
}

function zerosBool(h: number, w: number, v = false) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => v));
}

function cloneBool(m: boolean[][]) {
  return m.map((row) => row.slice());
}

function anyRow(m: boolean[][], r: number) {
  for (let c = 0; c < m[0].length; c++) if (m[r][c]) return true;
  return false;
}

function anyCol(m: boolean[][], c: number) {
  for (let r = 0; r < m.length; r++) if (m[r][c]) return true;
  return false;
}

function activeIndices(mask: boolean[][]) {
  const rows: number[] = [];
  const cols: number[] = [];
  for (let r = 0; r < mask.length; r++) if (anyRow(mask, r)) rows.push(r);
  for (let c = 0; c < mask[0].length; c++) if (anyCol(mask, c)) cols.push(c);
  return { rows, cols };
}

function regionStats(mask: boolean[][], xs: number[], ys: number[]): RegionStats {
  const { rows, cols } = activeIndices(mask);

  let total = 0;
  for (let r = 0; r < mask.length; r++) for (let c = 0; c < mask[0].length; c++) if (mask[r][c]) total++;

  if (!rows.length || !cols.length) {
    return { total, rows: rows.length, cols: cols.length, xMin: 0, xMax: 0, yMin: 0, yMax: 0, spanX: 0, spanY: 0 };
  }

  const xMin = xs[cols[0]];
  const xMax = xs[cols[cols.length - 1]];
  const yMin = ys[rows[0]];
  const yMax = ys[rows[rows.length - 1]];

  return {
    total,
    rows: rows.length,
    cols: cols.length,
    xMin,
    xMax,
    yMin,
    yMax,
    spanX: xMax - xMin,
    spanY: yMax - yMin,
  };
}

function chooseCutDim(mask: boolean[][], xs: number[], ys: number[]) {
  const stats = regionStats(mask, xs, ys);
  const cutDim: CutDim = stats.spanX >= stats.spanY ? "x" : "y";
  const { rows, cols } = activeIndices(mask);
  return { cutDim, ...stats, rowsIdx: rows, colsIdx: cols };
}

function computeDelta(nPrev: number, alpha: number) {
  const half = Math.ceil(0.5 * nPrev);
  let newN = Math.round((0.5 + alpha) * nPrev);
  newN = Math.max(newN, half);
  const delta = Math.max(0, newN - half);
  return { newN, delta };
}

// Path-loss mean in dB: mu(d) = P0 - 10*eta*log10(d + eps)
function pathlossDb(d: number, P0: number, eta: number, eps = 1e-3) {
  return P0 - 10 * eta * Math.log10(d + eps);
}

function dist(a: Point, b: Point) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

// Box-Muller normal(0,1)
function randn(rng: seedrandom.PRNG) {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

function placeSensorsSymmetric(
  cutDim: CutDim,
  mid: number,
  bbox: { xMin: number; xMax: number; yMin: number; yMax: number },
  sensorFrac: number
): [Point, Point] {
  const cx = 0.5 * (bbox.xMin + bbox.xMax);
  const cy = 0.5 * (bbox.yMin + bbox.yMax);

  if (cutDim === "x") {
    const span = Math.max(1e-6, bbox.xMax - bbox.xMin);
    const s = sensorFrac * span;
    return [{ x: mid - s, y: cy }, { x: mid + s, y: cy }];
  } else {
    const span = Math.max(1e-6, bbox.yMax - bbox.yMin);
    const s = sensorFrac * span;
    return [{ x: cx, y: mid - s }, { x: cx, y: mid + s }];
  }
}

/**
 * IMPORTANT FIX: boundary-based cut (mid between two grid points)
 * => never gets stuck at 2×2 with delta=0.
 */
function buildPartitions(activeBefore: boolean[][], xs: number[], ys: number[], alpha: number) {
  const info = chooseCutDim(activeBefore, xs, ys);
  const { cutDim, rowsIdx, colsIdx } = info;

  const H1 = cloneBool(activeBefore);
  const H2 = cloneBool(activeBefore);

  let mid = 0;
  let delta = 0;

  let partMeta: PartitionMeta | null = null;

  if (cutDim === "x") {
    const n = colsIdx.length;
    if (n <= 1) {
      mid = xs[colsIdx[0]];
      delta = 0;
      partMeta = {
        cutDim,
        nCut: n,
        leftSize: n,
        boundaryIdx: 0,
        leftMaxIdx: 0,
        rightMinIdx: 0,
        mid,
        delta,
      };
    } else {
      const leftSize = Math.ceil(n / 2);
      const boundaryIdx = leftSize - 1;
      ({ delta } = computeDelta(n, alpha));

      const cL = colsIdx[boundaryIdx];
      const cR = colsIdx[boundaryIdx + 1];
      mid = 0.5 * (xs[cL] + xs[cR]);

      const leftMaxIdx = Math.min(n - 1, boundaryIdx + delta);
      const rightMinIdx = Math.max(0, (boundaryIdx + 1) - delta);

      const leftMaxCol = colsIdx[leftMaxIdx];
      const rightMinCol = colsIdx[rightMinIdx];

      for (let r = 0; r < activeBefore.length; r++) {
        for (let c = 0; c < activeBefore[0].length; c++) {
          if (c > leftMaxCol) H1[r][c] = false;
          if (c < rightMinCol) H2[r][c] = false;
        }
      }

      partMeta = { cutDim, nCut: n, leftSize, boundaryIdx, leftMaxIdx, rightMinIdx, mid, delta };
    }
  } else {
    const n = rowsIdx.length;
    if (n <= 1) {
      mid = ys[rowsIdx[0]];
      delta = 0;
      partMeta = {
        cutDim,
        nCut: n,
        leftSize: n,
        boundaryIdx: 0,
        leftMaxIdx: 0,
        rightMinIdx: 0,
        mid,
        delta,
      };
    } else {
      const leftSize = Math.ceil(n / 2);
      const boundaryIdx = leftSize - 1;
      ({ delta } = computeDelta(n, alpha));

      const rB = rowsIdx[boundaryIdx];
      const rT = rowsIdx[boundaryIdx + 1];
      mid = 0.5 * (ys[rB] + ys[rT]);

      const leftMaxIdx = Math.min(n - 1, boundaryIdx + delta);
      const rightMinIdx = Math.max(0, (boundaryIdx + 1) - delta);

      const lowMaxRow = rowsIdx[leftMaxIdx];
      const highMinRow = rowsIdx[rightMinIdx];

      for (let r = 0; r < activeBefore.length; r++) {
        for (let c = 0; c < activeBefore[0].length; c++) {
          if (r > lowMaxRow) H1[r][c] = false;
          if (r < highMinRow) H2[r][c] = false;
        }
      }

      partMeta = { cutDim, nCut: n, leftSize, boundaryIdx, leftMaxIdx, rightMinIdx, mid, delta };
    }
  }

  const overlap = zerosBool(activeBefore.length, activeBefore[0].length, false);
  for (let r = 0; r < activeBefore.length; r++) {
    for (let c = 0; c < activeBefore[0].length; c++) overlap[r][c] = H1[r][c] && H2[r][c];
  }

  return { cutDim, mid, delta, H1, H2, overlap, bbox: info, partMeta };
}

function nearestIndex(arr: number[], v: number) {
  // simple linear or binary; arr is sorted
  let lo = 0, hi = arr.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  const i = lo;
  if (i <= 0) return 0;
  if (i >= arr.length) return arr.length - 1;
  // choose closer between i and i-1
  return Math.abs(arr[i] - v) < Math.abs(arr[i - 1] - v) ? i : i - 1;
}

export function initSim(config: SimConfig, seed = "7", targetOverride?: Point): SimStepState {
  const xs = linspace(0, config.Lx, config.nx);
  const ys = linspace(0, config.Ly, config.ny);

  const active = zerosBool(config.ny, config.nx, true);
  const rng = seedrandom(seed);

  let target: Point;
  if (targetOverride) {
    // snap override to nearest grid point
    const ix = nearestIndex(xs, targetOverride.x);
    const iy = nearestIndex(ys, targetOverride.y);
    target = { x: xs[ix], y: ys[iy] };
  } else {
    const tx = Math.floor(rng() * config.nx);
    const ty = Math.floor(rng() * config.ny);
    target = { x: xs[tx], y: ys[ty] };
  }

  const empty = zerosBool(config.ny, config.nx, false);
  const stats0 = regionStats(active, xs, ys);

  return {
    step: 0,
    xs,
    ys,

    before: active,
    active,

    H1: empty,
    H2: empty,
    overlap: empty,
    chosen: empty,

    cutDim: "x",
    mid: 0,
    delta: 0,

    sensors: [{ x: 0, y: 0 }, { x: 0, y: 0 }],
    z: [0, 0],

    target,
    targetKept: true,

    bbox: { xMin: stats0.xMin, xMax: stats0.xMax, yMin: stats0.yMin, yMax: stats0.yMax },

    maxLL_H1: -Infinity,
    maxLL_H2: -Infinity,
    chosenName: "H1",
    llGap: 0,

    nPrev: stats0,
    nAfter: stats0,

    samplesUsed: 0,
    sigmaEff: config.sigma,
    forcedChoice: false,

    partMeta: null,
  };
}

export function stepSim(prev: SimStepState, config: SimConfig, seed: string): SimStepState {
  const rng = seedrandom(`${seed}:${prev.step}`);

  const activeBefore = prev.active;
  const nPrev = regionStats(activeBefore, prev.xs, prev.ys);

  const { cutDim, mid, delta, H1, H2, overlap, bbox, partMeta } = buildPartitions(
    activeBefore,
    prev.xs,
    prev.ys,
    config.alpha
  );

  const sensors = placeSensorsSymmetric(
    cutDim,
    mid,
    { xMin: bbox.xMin, xMax: bbox.xMax, yMin: bbox.yMin, yMax: bbox.yMax },
    config.sensorFrac
  );

  // --- averaged measurement: zbar = mean of M samples -> sigmaEff = sigma/sqrt(M) ---
  const M = Math.max(1, Math.floor(config.samplesPerStep));
  const sigmaEff = config.sigma / Math.sqrt(M);

  const muTrue1 = pathlossDb(dist(sensors[0], prev.target), config.P0, config.eta);
  const muTrue2 = pathlossDb(dist(sensors[1], prev.target), config.P0, config.eta);

  let z1 = 0, z2 = 0;
  for (let i = 0; i < M; i++) {
    z1 += muTrue1 + config.sigma * randn(rng);
    z2 += muTrue2 + config.sigma * randn(rng);
  }
  z1 /= M; z2 /= M;
  const z: [number, number] = [z1, z2];

  // ML: loglik(k) ∝ -||z - mu(k)||^2 / (2*sigmaEff^2)
  let maxLL_H1 = -Infinity;
  let maxLL_H2 = -Infinity;
  const sigma2 = sigmaEff * sigmaEff;

  for (let r = 0; r < activeBefore.length; r++) {
    for (let c = 0; c < activeBefore[0].length; c++) {
      if (!activeBefore[r][c]) continue;

      const p: Point = { x: prev.xs[c], y: prev.ys[r] };
      const mu1 = pathlossDb(dist(sensors[0], p), config.P0, config.eta);
      const mu2 = pathlossDb(dist(sensors[1], p), config.P0, config.eta);

      const ll = -((z1 - mu1) ** 2 + (z2 - mu2) ** 2) / (2 * sigma2);

      if (H1[r][c] && ll > maxLL_H1) maxLL_H1 = ll;
      if (H2[r][c] && ll > maxLL_H2) maxLL_H2 = ll;
    }
  }

  let chosenName: "H1" | "H2" = maxLL_H1 >= maxLL_H2 ? "H1" : "H2";
  let chosen = chosenName === "H1" ? H1 : H2;

  // check membership of target in chosen region
  const tx = prev.xs.findIndex((x) => x === prev.target.x);
  const ty = prev.ys.findIndex((y) => y === prev.target.y);
  let targetKept = tx >= 0 && ty >= 0 ? chosen[ty][tx] : true;

  let forcedChoice = false;
  if (config.safeMode && tx >= 0 && ty >= 0 && !targetKept) {
    forcedChoice = true;
    chosenName = chosenName === "H1" ? "H2" : "H1";
    chosen = chosenName === "H1" ? H1 : H2;
    targetKept = true;
  }

  const nAfter = regionStats(chosen, prev.xs, prev.ys);
  const llGap = maxLL_H1 - maxLL_H2;

  return {
    step: prev.step + 1,
    xs: prev.xs,
    ys: prev.ys,

    before: activeBefore,
    active: chosen,

    H1,
    H2,
    overlap,
    chosen,

    cutDim,
    mid,
    delta,

    sensors,
    z,

    target: prev.target,
    targetKept,

    bbox: { xMin: bbox.xMin, xMax: bbox.xMax, yMin: bbox.yMin, yMax: bbox.yMax },

    maxLL_H1,
    maxLL_H2,
    chosenName,
    llGap,

    nPrev,
    nAfter,

    samplesUsed: M,
    sigmaEff,
    forcedChoice,

    partMeta,
  };
}
