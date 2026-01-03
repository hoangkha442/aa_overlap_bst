import { Card, Descriptions, Space, Tabs } from "antd";
import type { SimStepState } from "../../sim/overlapSearch2D";
import { MathPanel, type FormulaId, type PhaseKey, type MathState } from "../MathPanel";
import { formatPt } from "../../app/uiHelpers";

export function InspectorPanel(props: {
  state: SimStepState;
  cursor: number;
  historyLen: number;

  advanceMode: "step" | "phase";
  phase: number;

  activePhase: PhaseKey;
  activeFormula: FormulaId;
  mathState: MathState;
}) {
  const { state, cursor, historyLen, advanceMode, phase, activePhase, activeFormula, mathState } = props;

  return (
    <Card size="small" title="Inspector" style={{ borderRadius: 12 }}>
      <Tabs
        defaultActiveKey="stats"
        items={[
          {
            key: "stats",
            label: "Stats",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="Step">{state.step}</Descriptions.Item>
                  <Descriptions.Item label="view">
                    {cursor}/{historyLen - 1}
                  </Descriptions.Item>
                  <Descriptions.Item label="Phase">
                    {advanceMode === "phase" ? `${phase + 1}/5` : "—"}
                  </Descriptions.Item>
                  <Descriptions.Item label="n_prev → n_new">
                    {state.nPrev.total} → {state.nAfter.total}
                  </Descriptions.Item>
                  <Descriptions.Item label="cutDim / mid">
                    {state.cutDim.toUpperCase()} / {state.mid.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="delta">{state.delta}</Descriptions.Item>
                  <Descriptions.Item label="M / σ_eff">
                    {state.samplesUsed} / {state.sigmaEff.toFixed(2)}
                  </Descriptions.Item>
                  <Descriptions.Item label="z̄">
                    [{state.z[0].toFixed(2)}, {state.z[1].toFixed(2)}]
                  </Descriptions.Item>
                  <Descriptions.Item label="maxLL(H1)/maxLL(H2)">
                    {state.maxLL_H1.toFixed(3)} / {state.maxLL_H2.toFixed(3)}
                  </Descriptions.Item>
                  <Descriptions.Item label="chosen">{state.step === 0 ? "—" : state.chosenName}</Descriptions.Item>
                  <Descriptions.Item label="target">{formatPt(state.target)}</Descriptions.Item>
                </Descriptions>
              </Space>
            ),
          },
          {
            key: "math",
            label: "Math",
            children: (
              <div style={{ height: "72vh", minHeight: 340 }}>
                <MathPanel activePhase={activePhase} activeFormula={activeFormula} mathState={mathState} />
              </div>
            ),
          },
        ]}
      />
    </Card>
  );
}
