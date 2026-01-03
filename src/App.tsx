import { useEffect, useMemo, useState } from "react";
import { Layout, Modal, Row, Col } from "antd";

import type { PhaseKey, FormulaId, MathState } from "./components/MathPanel";
import { ControlsPanel } from "./components/panels/ControlsPanel";
import { CanvasPanel } from "./components/panels/CanvasPanel";
import { InspectorPanel } from "./components/panels/InspectorPanel";

import { type Phase } from "./components/Board2D";
import { initSim, stepSim, type Point, type SimConfig, type SimStepState } from "./sim/overlapSearch2D";
import { buildOverlayText } from "./app/uiHelpers";
import { useInterval } from "./app/useInterval";
import { AppHeaderBar } from "./components/layouts/AppHeaderBar";

const { Header, Content } = Layout;

export default function App() {
  const [seed, setSeed] = useState("7");

  const [config, setConfig] = useState<SimConfig>({
    Lx: 100,
    Ly: 60,
    nx: 41,
    ny: 25,

    alpha: 0.1,
    sigma: 2.0,
    samplesPerStep: 20,
    safeMode: true,

    P0: 0,
    eta: 2,
    sensorFrac: 0.25,
  });

  const [targetOverride, setTargetOverride] = useState<Point | null>(null);

  // ====== HISTORY + CURSOR ======
  const [history, setHistory] = useState<SimStepState[]>(() => [
    initSim(config, seed, targetOverride ?? undefined),
  ]);
  const [cursor, setCursor] = useState(0);
  const state = history[cursor];

  // ====== MODES ======
  const [advanceMode, setAdvanceMode] = useState<"step" | "phase">("phase");
  const [phase, setPhase] = useState<Phase>(0);

  // ====== PLAYBACK ======
  const [auto, setAuto] = useState(false);
  const [speedMs, setSpeedMs] = useState(650);

  // ====== VIEW ======
  const [overlay, setOverlay] = useState(true);

  // Zoom/Pan
  const [zoom, setZoom] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  // Target picking
  const [picking, setPicking] = useState(false);
  const [hoverRaw, setHoverRaw] = useState<Point | null>(null);
  const [hoverSnap, setHoverSnap] = useState<Point | null>(null);

  const found = state.nAfter.total === 1 && state.step > 0;

  useEffect(() => {
    if (found) setAuto(false);
  }, [found]);

  useEffect(() => {
    setAuto(false);
    setPhase(advanceMode === "step" ? 4 : 0);
  }, [advanceMode]);

  const reset = (keepTarget = true) => {
    setAuto(false);
    setZoom(1);
    setStagePos({ x: 0, y: 0 });
    setPicking(false);
    setHoverRaw(null);
    setHoverSnap(null);

    const t = keepTarget ? targetOverride ?? undefined : undefined;
    const s0 = initSim(config, seed, t);

    setHistory([s0]);
    setCursor(0);
    setPhase(advanceMode === "step" ? 4 : 0);
  };

  const pushNextStep = () => {
    const cur = history[cursor];
    const next = stepSim(cur, config, seed);

    const base = history.slice(0, cursor + 1);
    base.push(next);

    setHistory(base);
    setCursor(base.length - 1);
  };

  const goPrev = () => {
    setAuto(false);

    if (advanceMode === "phase") {
      if (phase > 0) {
        setPhase((p) => ((p - 1) as Phase));
        return;
      }
      if (cursor > 0) {
        setCursor((i) => i - 1);
        setPhase(4);
      }
      return;
    }

    if (cursor > 0) setCursor((i) => i - 1);
  };

  const advance = () => {
    if (found) return;

    if (advanceMode === "step") {
      pushNextStep();
      setPhase(4);
      return;
    }

    if (phase < 4) {
      setPhase((p) => ((p + 1) as Phase));
      return;
    }

    pushNextStep();
    setPhase(0);
  };

  useInterval(() => {
    if (!auto) return;
    advance();
  }, auto ? speedMs : null);

  const prevDisabled = advanceMode === "phase" ? (cursor === 0 && phase === 0) : cursor === 0;

  const status: "FOUND" | "SAFE" | "RUN" = found ? "FOUND" : state.forcedChoice ? "SAFE" : "RUN";

  const overlayText = useMemo(
    () =>
      buildOverlayText({
        overlayEnabled: overlay,
        state,
        nx: config.nx,
        cursor,
        historyLen: history.length,
        advanceMode,
        phase,
      }),
    [overlay, state, config.nx, cursor, history.length, advanceMode, phase]
  );

  // ====== Math mapping ======
  const activePhase: PhaseKey = useMemo(() => {
    if (state.step === 0) return "before";
    if (advanceMode === "step") return "after";
    if (phase === 0) return "before";
    if (phase === 1) return "partition";
    if (phase === 2) return "overlap";
    if (phase === 3) return "measure";
    return "choose";
  }, [state.step, advanceMode, phase]);

  const activeFormula: FormulaId = useMemo(() => {
    if (activePhase === "partition") return "partition";
    if (activePhase === "measure") return "likelihood";
    if (activePhase === "choose" || activePhase === "after") return "choose_region";
    return "partition";
  }, [activePhase]);

  const mathState: MathState = useMemo(() => {
    return {
      alpha: config.alpha,
      sigma: config.sigma,
      M: state.samplesUsed,
      sigmaEff: state.sigmaEff,

      nPrev: { nx: state.nPrev.cols, ny: state.nPrev.rows, n: state.nPrev.total },
      nNew: { nx: state.nAfter.cols, ny: state.nAfter.rows, n: state.nAfter.total },

      splitDim: state.cutDim,
      mid: state.mid,
      delta: state.delta,

      P0: config.P0,
      eta: config.eta,
      sensors: state.sensors,
      target: state.target,

      zbar: [state.z[0], state.z[1]],
      maxLL_H1: state.maxLL_H1,
      maxLL_H2: state.maxLL_H2,
      chosenHyp: state.chosenName,
      forced: state.forcedChoice,
    };
  }, [config, state]);

  const confirmPick = (p: Point) => {
    Modal.confirm({
      title: "Confirm Target",
      content: `Target (snapped): (${p.x.toFixed(2)}, ${p.y.toFixed(2)})`,
      okText: "Confirm",
      cancelText: "Cancel",
      onOk: () => {
        setTargetOverride(p);
        setPicking(false);
        setAuto(false);

        setZoom(1);
        setStagePos({ x: 0, y: 0 });

        const s0 = initSim(config, seed, p);
        setHistory([s0]);
        setCursor(0);
        setPhase(advanceMode === "step" ? 4 : 0);
      },
    });
  };

  return (
    <Layout style={{ minHeight: "100vh", overflow: "hidden" }}>
      <Header>
        <AppHeaderBar
          title="Overlapping Binary Search 2D"
          status={status}
          n={state.nAfter.total}
          mode={advanceMode}
          overlay={overlay}
          onToggleOverlay={() => setOverlay((v) => !v)}
          prevDisabled={prevDisabled}
          onPrev={goPrev}
          found={found}
          onNext={advance}
          auto={auto}
          onToggleAuto={() => setAuto((v) => !v)}
          onReset={() => reset(true)}
          picking={picking}
          onTogglePicking={() => {
            setPicking((v) => !v);
            setAuto(false);
          }}
        />
      </Header>

      <Content style={{ padding: 14 }}>
        <Row gutter={14}>
          <Col xs={24} lg={6} style={{ minWidth: 320 }}>
            <ControlsPanel
              advanceMode={advanceMode}
              onChangeAdvanceMode={(m) => setAdvanceMode(m)}
              prevDisabled={prevDisabled}
              onPrev={goPrev}
              found={found}
              onNext={advance}
              auto={auto}
              onToggleAuto={() => setAuto((v) => !v)}
              onReset={() => reset(true)}
              speedMs={speedMs}
              onSpeedMs={setSpeedMs}
              cursor={cursor}
              historyLen={history.length}
              onCursor={(v) => setCursor(v)}
              onScrubToHistory={() => {
                setAuto(false);
                if (advanceMode === "phase") setPhase(4);
              }}
              zoom={zoom}
              onZoom={setZoom}
              onResetView={() => {
                setZoom(1);
                setStagePos({ x: 0, y: 0 });
              }}
              picking={picking}
              onPicking={(v) => {
                setPicking(v);
                setAuto(false);
              }}
              state={state}
              hoverRaw={hoverRaw}
              hoverSnap={hoverSnap}
              seed={seed}
              onSeed={setSeed}
              onApplySeed={() => reset(true)}
              config={config}
              onConfig={setConfig}
              onApplySettings={() => reset(true)}
            />
          </Col>

          <Col xs={24} lg={12}>
            <CanvasPanel
              found={found}
              state={state}
              phase={advanceMode === "step" ? 4 : phase}
              zoom={zoom}
              onZoom={setZoom}
              stagePos={stagePos}
              onStagePos={setStagePos}
              overlayEnabled={overlay}
              overlayText={overlayText}
              picking={picking}
              onHover={(raw, snap) => {
                setHoverRaw(raw);
                setHoverSnap(snap);
              }}
              onPick={(p) => {
                if (!picking) return;
                confirmPick(p);
              }}
            />
          </Col>

          <Col xs={24} lg={6} style={{ minWidth: 320 }}>
            <InspectorPanel
              state={state}
              cursor={cursor}
              historyLen={history.length}
              advanceMode={advanceMode}
              phase={phase}
              activePhase={activePhase}
              activeFormula={activeFormula}
              mathState={mathState}
            />
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}
