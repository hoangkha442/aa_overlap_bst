
// import  { useEffect, useMemo, useRef, useState } from "react";
// import Konva from "konva";
// import { Layer, Line, Rect, RegularPolygon, Star, Stage, Text } from "react-konva";
// import type { SimStepState, Point } from "../sim/overlapSearch2D";

// export type Phase = 0 | 1 | 2 | 3 | 4;

// type Props = {
//   state: SimStepState;
//   width: number;
//   height: number;
//   phase: Phase;
//   overlayText: string;

//   // zoom/pan controlled from App
//   zoom: number;
//   onZoomChange: (z: number) => void;
//   stagePos: { x: number; y: number };
//   onStagePosChange: (p: { x: number; y: number }) => void;

//   // picking target
//   pickingEnabled: boolean;
//   onHover?: (rawWorld: Point | null, snappedWorld: Point | null) => void;
//   onPick?: (snappedWorld: Point) => void;
// };

// function clamp(n: number, lo: number, hi: number) {
//   return Math.max(lo, Math.min(hi, n));
// }

// function fitScale(Lx: number, Ly: number, width: number, height: number, pad = 28) {
//   const sx = (width - 2 * pad) / Math.max(1e-6, Lx);
//   const sy = (height - 2 * pad) / Math.max(1e-6, Ly);
//   const s = Math.min(sx, sy);
//   return { s, pad };
// }

// function toCanvas(p: Point, Lx: number, Ly: number, width: number, height: number, pad = 28) {
//   const { s } = fitScale(Lx, Ly, width, height, pad);
//   const x = pad + p.x * s;
//   const y = height - pad - p.y * s;
//   return { x, y, s, pad };
// }

// function fromCanvas(px: { x: number; y: number }, Lx: number, Ly: number, width: number, height: number, pad = 28) {
//   const { s } = fitScale(Lx, Ly, width, height, pad);
//   const x = (px.x - pad) / s;
//   const y = (height - pad - px.y) / s;
//   return { x, y };
// }

// function nearestIndex(arr: number[], v: number) {
//   let lo = 0, hi = arr.length - 1;
//   while (lo < hi) {
//     const mid = Math.floor((lo + hi) / 2);
//     if (arr[mid] < v) lo = mid + 1;
//     else hi = mid;
//   }
//   const i = lo;
//   if (i <= 0) return 0;
//   if (i >= arr.length) return arr.length - 1;
//   return Math.abs(arr[i] - v) < Math.abs(arr[i - 1] - v) ? i : i - 1;
// }

// function snapToGrid(xs: number[], ys: number[], p: Point) {
//   const ix = nearestIndex(xs, p.x);
//   const iy = nearestIndex(ys, p.y);
//   return { x: xs[ix], y: ys[iy] };
// }

// function maskToPoints(mask: boolean[][], xs: number[], ys: number[]) {
//   const pts: Point[] = [];
//   for (let r = 0; r < mask.length; r++) {
//     for (let c = 0; c < mask[0].length; c++) {
//       if (mask[r][c]) pts.push({ x: xs[c], y: ys[r] });
//     }
//   }
//   return pts;
// }

// function rectFromBBox(
//   bbox: { xMin: number; xMax: number; yMin: number; yMax: number },
//   Lx: number,
//   Ly: number,
//   width: number,
//   height: number
// ) {
//   const tl = toCanvas({ x: bbox.xMin, y: bbox.yMax }, Lx, Ly, width, height);
//   const br = toCanvas({ x: bbox.xMax, y: bbox.yMin }, Lx, Ly, width, height);
//   return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
// }

// function bracketLines(x: number, y: number, w: number, h: number, len = 16) {
//   const x0 = x, y0 = y;
//   const x1 = x + w, y1 = y + h;

//   return [
//     [x0, y0, x0 + len, y0], [x0, y0, x0, y0 + len],
//     [x1, y0, x1 - len, y0], [x1, y0, x1, y0 + len],
//     [x0, y1, x0 + len, y1], [x0, y1, x0, y1 - len],
//     [x1, y1, x1 - len, y1], [x1, y1, x1, y1 - len],
//   ];
// }

// export default function Board2D({
//   state,
//   width,
//   height,
//   phase,
//   overlayText,
//   zoom,
//   onZoomChange,
//   stagePos,
//   onStagePosChange,
//   pickingEnabled,
//   onHover,
//   onPick,
// }: Props) {
//   const stageRef = useRef<Konva.Stage>(null);

//   const Lx = state.xs[state.xs.length - 1] - state.xs[0];
//   const Ly = state.ys[state.ys.length - 1] - state.ys[0];

//   const beforePts = useMemo(() => maskToPoints(state.before, state.xs, state.ys), [state]);
//   const H1Pts = useMemo(() => maskToPoints(state.H1, state.xs, state.ys), [state]);
//   const H2Pts = useMemo(() => maskToPoints(state.H2, state.xs, state.ys), [state]);
//   const overlapPts = useMemo(() => maskToPoints(state.overlap, state.xs, state.ys), [state]);
//   const afterPts = useMemo(() => maskToPoints(state.active, state.xs, state.ys), [state]);

//   const beforeRect = rectFromBBox(
//     { xMin: state.nPrev.xMin, xMax: state.nPrev.xMax, yMin: state.nPrev.yMin, yMax: state.nPrev.yMax },
//     Lx, Ly, width, height
//   );
//   const afterRect = rectFromBBox(
//     { xMin: state.nAfter.xMin, xMax: state.nAfter.xMax, yMin: state.nAfter.yMin, yMax: state.nAfter.yMax },
//     Lx, Ly, width, height
//   );

//   const targetC = toCanvas(state.target, Lx, Ly, width, height);
//   const s1C = toCanvas(state.sensors[0], Lx, Ly, width, height);
//   const s2C = toCanvas(state.sensors[1], Lx, Ly, width, height);

//   const cutLine = useMemo(() => {
//     if (state.step === 0) return null;
//     const mid = state.mid;
//     if (state.cutDim === "x") {
//       const a = toCanvas({ x: mid, y: 0 }, Lx, Ly, width, height);
//       const b = toCanvas({ x: mid, y: Ly }, Lx, Ly, width, height);
//       return [a.x, a.y, b.x, b.y];
//     } else {
//       const a = toCanvas({ x: 0, y: mid }, Lx, Ly, width, height);
//       const b = toCanvas({ x: Lx, y: mid }, Lx, Ly, width, height);
//       return [a.x, a.y, b.x, b.y];
//     }
//   }, [state, width, height, Lx, Ly]);

//   const showBefore = phase >= 0;
//   const showPartitions = phase >= 1;
//   const showOverlap = phase >= 2;
//   const showSensors = phase >= 3;
//   const showAfter = phase >= 4;

//   const [hoverStage, setHoverStage] = useState<{ x: number; y: number } | null>(null);
//   console.log('hoverStage: ', hoverStage);
//   const [hoverWorld, setHoverWorld] = useState<Point | null>(null);
//   const [hoverSnap, setHoverSnap] = useState<Point | null>(null);

//   const updateHover = () => {
//     const stage = stageRef.current;
//     if (!stage) return;
//     const pos = stage.getPointerPosition();
//     if (!pos) {
//       setHoverStage(null);
//       setHoverWorld(null);
//       setHoverSnap(null);
//       onHover?.(null, null);
//       return;
//     }

//     // Convert pointer -> local coordinates by inverting stage transform
//     const tr = stage.getAbsoluteTransform().copy();
//     tr.invert();
//     const local = tr.point(pos);

//     const w = fromCanvas({ x: local.x, y: local.y }, Lx, Ly, width, height);
//     const raw: Point = { x: w.x, y: w.y };
//     const snapped = snapToGrid(state.xs, state.ys, raw);

//     setHoverStage(pos);
//     setHoverWorld(raw);
//     setHoverSnap(snapped);
//     onHover?.(raw, snapped);
//   };

//   useEffect(() => {
//     // clear hover when step changes
//     setHoverStage(null);
//     setHoverWorld(null);
//     setHoverSnap(null);
//     onHover?.(null, null);
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [state.step]);

//   const handleWheel = (e: any) => {
//     e.evt.preventDefault();
//     const stage = stageRef.current;
//     if (!stage) return;

//     const oldScale = zoom;
//     const pointer = stage.getPointerPosition();
//     if (!pointer) return;

//     const scaleBy = 1.07;
//     const direction = e.evt.deltaY > 0 ? -1 : 1;
//     const newScale = clamp(direction > 0 ? oldScale * scaleBy : oldScale / scaleBy, 0.5, 3);

//     // zoom around pointer:
//     const mousePointTo = {
//       x: (pointer.x - stagePos.x) / oldScale,
//       y: (pointer.y - stagePos.y) / oldScale,
//     };

//     const newPos = {
//       x: pointer.x - mousePointTo.x * newScale,
//       y: pointer.y - mousePointTo.y * newScale,
//     };

//     onZoomChange(newScale);
//     onStagePosChange(newPos);
//   };

//   const onClick = () => {
//     if (!pickingEnabled) return;
//     if (!hoverSnap) return;
//     onPick?.(hoverSnap);
//   };

//   const drawPoints = (pts: Point[], fill: string, r: number, opacity: number) =>
//     pts.map((p, i) => {
//       const c = toCanvas(p, Lx, Ly, width, height);
//       return <Rect key={i} x={c.x - r} y={c.y - r} width={2 * r} height={2 * r} fill={fill} opacity={opacity} />;
//     });

//   // Crosshair for picking
//   const crosshair = useMemo(() => {
//     if (!pickingEnabled || !hoverSnap) return null;
//     const c = toCanvas(hoverSnap, Lx, Ly, width, height);
//     return (
//       <>
//         <Line points={[c.x - 12, c.y, c.x + 12, c.y]} stroke="#000" strokeWidth={2} />
//         <Line points={[c.x, c.y - 12, c.x, c.y + 12]} stroke="#000" strokeWidth={2} />
//       </>
//     );
//   }, [pickingEnabled, hoverSnap, Lx, Ly, width, height]);

//   // Hover label near cursor (in screen coords: use pos directly, but we are drawing in local coords, so convert)
//   const hoverLabel = useMemo(() => {
//     if (!hoverWorld || !hoverSnap) return null;

//     // label anchored near local coords (more stable when zoom/pan)
//     const stage = stageRef.current;
//     const pos = stage?.getPointerPosition();
//     if (!pos) return null;

//     const tr = stage!.getAbsoluteTransform().copy();
//     tr.invert();
//     const local = tr.point(pos);

//     const txt =
//       `hover: x=${hoverWorld.x.toFixed(2)}, y=${hoverWorld.y.toFixed(2)}\n` +
//       `snap : x*=${hoverSnap.x.toFixed(2)}, y*=${hoverSnap.y.toFixed(2)}`;

//     return (
//       <>
//         <Rect x={local.x + 12} y={local.y + 12} width={260} height={42} fill="#fff" opacity={0.85} stroke="#d9d9d9" />
//         <Text x={local.x + 18} y={local.y + 16} text={txt} fontSize={12} fill="#111" />
//       </>
//     );
//   }, [hoverWorld, hoverSnap]);

//   return (
//     <Stage
//       ref={stageRef}
//       width={width}
//       height={height}
//       draggable
//       scaleX={zoom}
//       scaleY={zoom}
//       x={stagePos.x}
//       y={stagePos.y}
//       onDragEnd={(e) => onStagePosChange({ x: e.target.x(), y: e.target.y() })}
//       onWheel={handleWheel}
//       onMouseMove={() => updateHover()}
//       onMouseLeave={() => {
//         setHoverStage(null);
//         setHoverWorld(null);
//         setHoverSnap(null);
//         onHover?.(null, null);
//       }}
//       onClick={onClick}
//       style={{ background: "#fff", borderRadius: 8 }}
//     >
//       <Layer>
//         {/* frame */}
//         <Rect x={12} y={12} width={width - 24} height={height - 24} stroke="#d9d9d9" strokeWidth={2} />

//         {/* overlay text */}
//         <Rect x={16} y={16} width={width - 32} height={62} fill="#ffffff" opacity={0.88} />
//         <Text x={22} y={22} text={overlayText} fontSize={14} fill="#111" />
//         {state.forcedChoice && (
//           <Text
//             x={22}
//             y={46}
//             text="SAFE MODE: ML chọn nhầm do noise → đảo quyết định để không loại target."
//             fontSize={12}
//             fill="#cf1322"
//           />
//         )}

//         {/* BEFORE */}
//         {showBefore && drawPoints(beforePts, "#8c8c8c", 2.0, 0.18)}
//         {showBefore && (
//           <>
//             {bracketLines(beforeRect.x, beforeRect.y, beforeRect.w, beforeRect.h).map((pts, i) => (
//               <Line key={`b-${i}`} points={pts} stroke="#595959" strokeWidth={3} opacity={0.85} />
//             ))}
//             <Text x={beforeRect.x + 6} y={beforeRect.y - 18} text="before" fontSize={12} fill="#595959" />
//           </>
//         )}

//         {/* H1/H2 */}
//         {showPartitions && (
//           <>
//             {drawPoints(H1Pts, "#1677ff", 2.0, 0.12)}
//             {drawPoints(H2Pts, "#fa8c16", 2.0, 0.12)}
//           </>
//         )}

//         {/* overlap */}
//         {showOverlap && drawPoints(overlapPts, "#722ed1", 2.8, 0.40)}

//         {/* cut line */}
//         {showPartitions && cutLine && (
//           <Line points={cutLine} stroke="#000" strokeWidth={2} dash={[6, 6]} opacity={0.45} />
//         )}

//         {/* sensors */}
//         {showSensors && state.step > 0 && (
//           <>
//             <RegularPolygon x={s1C.x} y={s1C.y} sides={3} radius={10} fill="#000" opacity={0.85} />
//             <RegularPolygon x={s2C.x} y={s2C.y} sides={3} radius={10} fill="#000" opacity={0.85} />
//           </>
//         )}

//         {/* AFTER */}
//         {showAfter && drawPoints(afterPts, "#52c41a", 2.8, 0.50)}
//         {showAfter && state.step > 0 && (
//           <>
//             {bracketLines(afterRect.x, afterRect.y, afterRect.w, afterRect.h).map((pts, i) => (
//               <Line key={`a-${i}`} points={pts} stroke="#389e0d" strokeWidth={3} opacity={0.95} />
//             ))}
//             <Text x={afterRect.x + 6} y={afterRect.y - 18} text="after" fontSize={12} fill="#389e0d" />
//           </>
//         )}

//         {/* target always visible */}
//         <Star
//           x={targetC.x}
//           y={targetC.y}
//           numPoints={5}
//           innerRadius={6}
//           outerRadius={14}
//           fill={state.targetKept ? "#f5222d" : "#8c8c8c"}
//           opacity={0.95}
//         />

//         {/* picking UI */}
//         {/* {crosshair}
//         {hoverLabel} */}
//         {pickingEnabled ? crosshair : null}
// {pickingEnabled ? hoverLabel : null}

//       </Layer>
//     </Stage>
//   );
// }


import { useEffect, useMemo, useRef, useState } from "react";
import Konva from "konva";
import { Layer, Line, Rect, RegularPolygon, Star, Stage, Text } from "react-konva";
import type { Point, SimStepState } from "../sim/overlapSearch2D";

export type Phase = 0 | 1 | 2 | 3 | 4;

type Props = {
  state: SimStepState;
  width: number;
  height: number;
  phase: Phase;
  overlayText: string;

  zoom: number;
  onZoomChange: (z: number) => void;
  stagePos: { x: number; y: number };
  onStagePosChange: (p: { x: number; y: number }) => void;

  pickingEnabled: boolean;
  onHover?: (rawWorld: Point | null, snappedWorld: Point | null) => void;
  onPick?: (snappedWorld: Point) => void;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function fitScale(Lx: number, Ly: number, width: number, height: number, pad = 28) {
  const sx = (width - 2 * pad) / Math.max(1e-6, Lx);
  const sy = (height - 2 * pad) / Math.max(1e-6, Ly);
  const s = Math.min(sx, sy);
  return { s, pad };
}

function toCanvas(p: Point, Lx: number, Ly: number, width: number, height: number, pad = 28) {
  const { s } = fitScale(Lx, Ly, width, height, pad);
  const x = pad + p.x * s;
  const y = height - pad - p.y * s;
  return { x, y, s, pad };
}

function fromCanvas(px: { x: number; y: number }, Lx: number, Ly: number, width: number, height: number, pad = 28) {
  const { s } = fitScale(Lx, Ly, width, height, pad);
  const x = (px.x - pad) / s;
  const y = (height - pad - px.y) / s;
  return { x, y };
}

function nearestIndex(arr: number[], v: number) {
  let lo = 0, hi = arr.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (arr[mid] < v) lo = mid + 1;
    else hi = mid;
  }
  const i = lo;
  if (i <= 0) return 0;
  if (i >= arr.length) return arr.length - 1;
  return Math.abs(arr[i] - v) < Math.abs(arr[i - 1] - v) ? i : i - 1;
}

function snapToGrid(xs: number[], ys: number[], p: Point) {
  const ix = nearestIndex(xs, p.x);
  const iy = nearestIndex(ys, p.y);
  return { x: xs[ix], y: ys[iy] };
}

function zerosBool(h: number, w: number, v = false) {
  return Array.from({ length: h }, () => Array.from({ length: w }, () => v));
}

function maskToPoints(mask: boolean[][], xs: number[], ys: number[]) {
  const pts: Point[] = [];
  for (let r = 0; r < mask.length; r++) {
    for (let c = 0; c < mask[0].length; c++) {
      if (mask[r][c]) pts.push({ x: xs[c], y: ys[r] });
    }
  }
  return pts;
}

function rectFromBBox(
  bbox: { xMin: number; xMax: number; yMin: number; yMax: number },
  Lx: number,
  Ly: number,
  width: number,
  height: number
) {
  const tl = toCanvas({ x: bbox.xMin, y: bbox.yMax }, Lx, Ly, width, height);
  const br = toCanvas({ x: bbox.xMax, y: bbox.yMin }, Lx, Ly, width, height);
  return { x: tl.x, y: tl.y, w: br.x - tl.x, h: br.y - tl.y };
}

function bracketLines(x: number, y: number, w: number, h: number, len = 16) {
  const x0 = x, y0 = y;
  const x1 = x + w, y1 = y + h;
  return [
    [x0, y0, x0 + len, y0], [x0, y0, x0, y0 + len],
    [x1, y0, x1 - len, y0], [x1, y0, x1, y0 + len],
    [x0, y1, x0 + len, y1], [x0, y1, x0, y1 - len],
    [x1, y1, x1 - len, y1], [x1, y1, x1, y1 - len],
  ];
}

export default function Board2D({
  state,
  width,
  height,
  phase,
  overlayText,
  zoom,
  onZoomChange,
  stagePos,
  onStagePosChange,
  pickingEnabled,
  onHover,
  onPick,
}: Props) {
  const stageRef = useRef<Konva.Stage>(null);

  const Lx = state.xs[state.xs.length - 1] - state.xs[0];
  const Ly = state.ys[state.ys.length - 1] - state.ys[0];

  const empty = useMemo(() => zerosBool(state.ys.length, state.xs.length, false), [state.xs.length, state.ys.length]);

  const beforePts = useMemo(() => maskToPoints(state.before ?? empty, state.xs, state.ys), [state, empty]);
  const H1Pts = useMemo(() => maskToPoints(state.H1 ?? empty, state.xs, state.ys), [state, empty]);
  const H2Pts = useMemo(() => maskToPoints(state.H2 ?? empty, state.xs, state.ys), [state, empty]);
  const overlapPts = useMemo(() => maskToPoints(state.overlap ?? empty, state.xs, state.ys), [state, empty]);
  const afterPts = useMemo(() => maskToPoints(state.active ?? empty, state.xs, state.ys), [state, empty]);

  const beforeRect = rectFromBBox(
    { xMin: state.nPrev.xMin, xMax: state.nPrev.xMax, yMin: state.nPrev.yMin, yMax: state.nPrev.yMax },
    Lx, Ly, width, height
  );
  const afterRect = rectFromBBox(
    { xMin: state.nAfter.xMin, xMax: state.nAfter.xMax, yMin: state.nAfter.yMin, yMax: state.nAfter.yMax },
    Lx, Ly, width, height
  );

  const targetC = toCanvas(state.target, Lx, Ly, width, height);
  const s1C = toCanvas(state.sensors[0], Lx, Ly, width, height);
  const s2C = toCanvas(state.sensors[1], Lx, Ly, width, height);

  const cutLine = useMemo(() => {
    if (state.step === 0) return null;
    const mid = state.mid;
    if (state.cutDim === "x") {
      const a = toCanvas({ x: mid, y: 0 }, Lx, Ly, width, height);
      const b = toCanvas({ x: mid, y: Ly }, Lx, Ly, width, height);
      return [a.x, a.y, b.x, b.y];
    } else {
      const a = toCanvas({ x: 0, y: mid }, Lx, Ly, width, height);
      const b = toCanvas({ x: Lx, y: mid }, Lx, Ly, width, height);
      return [a.x, a.y, b.x, b.y];
    }
  }, [state, width, height, Lx, Ly]);

  const showBefore = phase >= 0;
  const showPartitions = phase >= 1;
  const showOverlap = phase >= 2;
  const showSensors = phase >= 3;
  const showAfter = phase >= 4;

  const [hoverWorld, setHoverWorld] = useState<Point | null>(null);
  const [hoverSnap, setHoverSnap] = useState<Point | null>(null);

  const updateHover = () => {
    const stage = stageRef.current;
    if (!stage) return;
    const pos = stage.getPointerPosition();
    if (!pos) {
      setHoverWorld(null);
      setHoverSnap(null);
      onHover?.(null, null);
      return;
    }

    const tr = stage.getAbsoluteTransform().copy();
    tr.invert();
    const local = tr.point(pos);

    const w = fromCanvas({ x: local.x, y: local.y }, Lx, Ly, width, height);
    const raw: Point = { x: w.x, y: w.y };
    const snapped = snapToGrid(state.xs, state.ys, raw);

    setHoverWorld(raw);
    setHoverSnap(snapped);
    onHover?.(raw, snapped);
  };

  useEffect(() => {
    setHoverWorld(null);
    setHoverSnap(null);
    onHover?.(null, null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.step]);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    if (!stage) return;

    const oldScale = zoom;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const scaleBy = 1.07;
    const direction = e.evt.deltaY > 0 ? -1 : 1;
    const newScale = clamp(direction > 0 ? oldScale * scaleBy : oldScale / scaleBy, 0.5, 3);

    const mousePointTo = {
      x: (pointer.x - stagePos.x) / oldScale,
      y: (pointer.y - stagePos.y) / oldScale,
    };

    const newPos = {
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    };

    onZoomChange(newScale);
    onStagePosChange(newPos);
  };

  const onClick = () => {
    if (!pickingEnabled) return;
    if (!hoverSnap) return;
    onPick?.(hoverSnap);
  };

  const drawPoints = (pts: Point[], fill: string, r: number, opacity: number) =>
    pts.map((p, i) => {
      const c = toCanvas(p, Lx, Ly, width, height);
      return <Rect key={i} x={c.x - r} y={c.y - r} width={2 * r} height={2 * r} fill={fill} opacity={opacity} />;
    });

  const crosshair = useMemo(() => {
    if (!pickingEnabled || !hoverSnap) return null;
    const c = toCanvas(hoverSnap, Lx, Ly, width, height);
    return (
      <>
        <Line points={[c.x - 12, c.y, c.x + 12, c.y]} stroke="#000" strokeWidth={2} />
        <Line points={[c.x, c.y - 12, c.x, c.y + 12]} stroke="#000" strokeWidth={2} />
      </>
    );
  }, [pickingEnabled, hoverSnap, Lx, Ly, width, height]);

  const hoverLabel = useMemo(() => {
    if (!pickingEnabled || !hoverWorld || !hoverSnap) return null;

    const stage = stageRef.current;
    const pos = stage?.getPointerPosition();
    if (!pos) return null;

    const tr = stage!.getAbsoluteTransform().copy();
    tr.invert();
    const local = tr.point(pos);

    const txt =
      `raw: x=${hoverWorld.x.toFixed(2)} y=${hoverWorld.y.toFixed(2)}\n` +
      `snap: x=${hoverSnap.x.toFixed(2)} y=${hoverSnap.y.toFixed(2)}`;

    return (
      <>
        <Rect x={local.x + 12} y={local.y + 12} width={240} height={42} fill="#fff" opacity={0.90} stroke="#d9d9d9" />
        <Text x={local.x + 18} y={local.y + 16} text={txt} fontSize={12} fill="#111" />
      </>
    );
  }, [pickingEnabled, hoverWorld, hoverSnap]);

  // Overlay auto height
  const overlayLines = overlayText ? overlayText.split("\n").length : 0;
  const overlayH = Math.max(44, 18 * overlayLines + 16);

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      draggable
      scaleX={zoom}
      scaleY={zoom}
      x={stagePos.x}
      y={stagePos.y}
      onDragEnd={(e) => onStagePosChange({ x: e.target.x(), y: e.target.y() })}
      onWheel={handleWheel}
      onMouseMove={() => updateHover()}
      onMouseLeave={() => {
        setHoverWorld(null);
        setHoverSnap(null);
        onHover?.(null, null);
      }}
      onClick={onClick}
      style={{ background: "#fff", borderRadius: 10 }}
    >
      <Layer>
        {/* frame */}
        <Rect x={12} y={12} width={width - 24} height={height - 24} stroke="#d9d9d9" strokeWidth={2} />

        {/* overlay */}
        {overlayText ? (
          <>
            <Rect x={16} y={16} width={width - 32} height={overlayH} fill="#ffffff" opacity={0.90} stroke="#f0f0f0" />
            <Text x={22} y={22} text={overlayText} fontSize={13} fill="#111" lineHeight={1.25} />
          </>
        ) : null} 

        {showBefore && drawPoints(beforePts, "#8c8c8c", 2.0, 0.18)}
        {showBefore &&
          bracketLines(beforeRect.x, beforeRect.y, beforeRect.w, beforeRect.h).map((pts, i) => (
            <Line key={`b-${i}`} points={pts} stroke="#595959" strokeWidth={3} opacity={0.85} />
          ))}

        {/* H1/H2 */}
        {showPartitions && drawPoints(H1Pts, "#1677ff", 2.0, 0.12)}
        {showPartitions && drawPoints(H2Pts, "#fa8c16", 2.0, 0.12)}

        {/* overlap */}
        {showOverlap && drawPoints(overlapPts, "#722ed1", 2.8, 0.40)}

        {/* cut line */}
        {showPartitions && cutLine && <Line points={cutLine} stroke="#000" strokeWidth={2} dash={[6, 6]} opacity={0.45} />}

        {/* sensors */}
        {showSensors && state.step > 0 && (
          <>
            <RegularPolygon x={s1C.x} y={s1C.y} sides={3} radius={10} fill="#000" opacity={0.85} />
            <RegularPolygon x={s2C.x} y={s2C.y} sides={3} radius={10} fill="#000" opacity={0.85} />
          </>
        )}

        {/* AFTER */}
        {showAfter && drawPoints(afterPts, "#52c41a", 2.8, 0.50)}
        {showAfter && state.step > 0 &&
          bracketLines(afterRect.x, afterRect.y, afterRect.w, afterRect.h).map((pts, i) => (
            <Line key={`a-${i}`} points={pts} stroke="#389e0d" strokeWidth={3} opacity={0.95} />
          ))}

        {/* target */}
        <Star
          x={targetC.x}
          y={targetC.y}
          numPoints={5}
          innerRadius={6}
          outerRadius={14}
          fill={state.targetKept ? "#f5222d" : "#8c8c8c"}
          opacity={0.95}
        />

        {/* picking visuals */}
        {crosshair}
        {hoverLabel}
      </Layer>
    </Stage>
  );
}
