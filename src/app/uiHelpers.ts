import type { Point, SimStepState } from "../sim/overlapSearch2D";

export function formatPt(p: Point) {
  return `(${p.x.toFixed(2)}, ${p.y.toFixed(2)})`;
}

export function maskToIds(mask: boolean[][], nx: number) {
  const ids: number[] = [];
  for (let r = 0; r < mask.length; r++) {
    for (let c = 0; c < mask[0].length; c++) {
      if (mask[r][c]) ids.push(r * nx + c + 1);
    }
  }
  return ids;
}

export function formatSet(ids: number[], limit = 28) {
  if (ids.length === 0) return "{ }";
  if (ids.length <= limit) return `{ ${ids.join(", ")} }`;
  return `{ ${ids.slice(0, limit).join(", ")}, … } (| |=${ids.length})`;
}

export function buildOverlayText(args: {
  overlayEnabled: boolean;
  state: SimStepState;
  nx: number;
  cursor: number;
  historyLen: number;
  advanceMode: "step" | "phase";
  phase: number; // 0..4
}) {
  const { overlayEnabled, state, nx, cursor, historyLen, advanceMode, phase } = args;
  if (!overlayEnabled) return "";

  const nPrev = `${state.nPrev.rows}×${state.nPrev.cols}=${state.nPrev.total}`;
  const nNew = `${state.nAfter.rows}×${state.nAfter.cols}=${state.nAfter.total}`;

  const H1 = formatSet(maskToIds(state.H1, nx), 26);
  const H2 = formatSet(maskToIds(state.H2, nx), 26);
  const OV = formatSet(maskToIds(state.overlap, nx), 26);

  const head = `Step ${state.step} | view=${cursor}/${historyLen - 1} | phase=${
    advanceMode === "phase" ? `${phase + 1}/5` : "—"
  }`;

  const lineN = `n_prev=${nPrev}  →  n_new=${nNew}`;
  const lineH1 = `H1=${H1}`;
  const lineH2 = `H2=${H2}`;
  const lineOv = `Overlap=${OV}`;

  let reason = "Reason: —";
  if (state.step === 0) {
    reason = "Reason: init";
  } else if (advanceMode === "step") {
    reason =
      `Reason: choose ${state.chosenName} since maxLL(H1)=${state.maxLL_H1.toFixed(
        3
      )} vs maxLL(H2)=${state.maxLL_H2.toFixed(3)}` + (state.forcedChoice ? " | SAFE" : "");
  } else {
    if (phase === 1) {
      reason = `Reason: cutDim=argmax(spanX,spanY) | mid=${state.mid.toFixed(2)} | Δ=${state.delta}`;
    } else if (phase === 3) {
      reason = `Reason: σ_eff=σ/√M=${state.sigmaEff.toFixed(2)} with M=${state.samplesUsed}; z̄=[${state.z[0].toFixed(
        2
      )}, ${state.z[1].toFixed(2)}]`;
    } else if (phase === 4) {
      reason =
        `Reason: choose ${state.chosenName} since maxLL(H1)=${state.maxLL_H1.toFixed(
          3
        )} vs maxLL(H2)=${state.maxLL_H2.toFixed(3)}` + (state.forcedChoice ? " | SAFE" : "");
    }
  }

  return [head, lineN, lineH1, lineH2, lineOv, reason].join("\n");
}
