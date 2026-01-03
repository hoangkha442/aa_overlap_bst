import { Button, Card, Descriptions, Divider, InputNumber, Segmented, Slider, Space, Switch, Tabs, Typography } from "antd";
import type { Point, SimConfig, SimStepState } from "../../sim/overlapSearch2D";
import { formatPt } from "../../app/uiHelpers";

const { Text } = Typography;

export function ControlsPanel(props: {
  // run
  advanceMode: "step" | "phase";
  onChangeAdvanceMode: (m: "step" | "phase") => void;

  prevDisabled: boolean;
  onPrev: () => void;

  found: boolean;
  onNext: () => void;

  auto: boolean;
  onToggleAuto: () => void;

  onReset: () => void;

  speedMs: number;
  onSpeedMs: (v: number) => void;

  // history
  cursor: number;
  historyLen: number;
  onCursor: (v: number) => void;
  onScrubToHistory: () => void;

  // zoom
  zoom: number;
  onZoom: (v: number) => void;
  onResetView: () => void;

  // target tab
  picking: boolean;
  onPicking: (v: boolean) => void;
  state: SimStepState;
  hoverRaw: Point | null;
  hoverSnap: Point | null;

  // seed
  seed: string;
  onSeed: (s: string) => void;
  onApplySeed: () => void;

  // settings
  config: SimConfig;
  onConfig: (c: SimConfig) => void;
  onApplySettings: () => void;
}) {
  const {
    advanceMode,
    onChangeAdvanceMode,
    prevDisabled,
    onPrev,
    found,
    onNext,
    auto,
    onToggleAuto,
    onReset,
    speedMs,
    onSpeedMs,
    cursor,
    historyLen,
    onCursor,
    onScrubToHistory,
    zoom,
    onZoom,
    onResetView,
    picking,
    onPicking,
    state,
    hoverRaw,
    hoverSnap,
    seed,
    onSeed,
    onApplySeed,
    config,
    onConfig,
    onApplySettings,
  } = props;

  return (
    <Card size="small" title="Controls" style={{ borderRadius: 12 }}>
      <Tabs
        defaultActiveKey="run"
        items={[
          {
            key: "run",
            label: "Run",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                  <Text>Advance</Text>
                  <Segmented
                    value={advanceMode}
                    options={[
                      { label: "Step", value: "step" },
                      { label: "Phase", value: "phase" },
                    ]}
                    onChange={(v) => onChangeAdvanceMode(v as "step" | "phase")}
                  />
                </Space>

                <Divider style={{ margin: "8px 0" }} />

                <Space wrap>
                  <Button onClick={onPrev} disabled={prevDisabled}>
                    Prev
                  </Button>
                  <Button type="primary" onClick={onNext} disabled={found}>
                    Next
                  </Button>
                  <Button type="primary" onClick={onToggleAuto} disabled={found}>
                    {auto ? "Pause" : "Start"}
                  </Button>
                  <Button onClick={onReset}>Reset</Button>
                </Space>

                <Divider style={{ margin: "8px 0" }} />

                <Text type="secondary">Speed (ms)</Text>
                <Slider min={250} max={1400} step={10} value={speedMs} onChange={onSpeedMs} />

                <Divider style={{ margin: "8px 0" }} />

                <Text type="secondary">History</Text>
                <Slider
                  min={0}
                  max={Math.max(0, historyLen - 1)}
                  step={1}
                  value={cursor}
                  onChange={(v) => {
                    onCursor(v);
                    onScrubToHistory();
                  }}
                />
                <Text type="secondary">
                  view={cursor}/{Math.max(0, historyLen - 1)}
                </Text>

                <Divider style={{ margin: "8px 0" }} />

                <Text type="secondary">Zoom</Text>
                <Slider min={0.5} max={3} step={0.01} value={zoom} onChange={onZoom} />
                <Button onClick={onResetView}>Reset view</Button>
              </Space>
            ),
          },
          {
            key: "target",
            label: "Target",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                  <Text>Pick mode</Text>
                  <Switch checked={picking} onChange={onPicking} />
                </Space>

                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="Current">{formatPt(state.target)}</Descriptions.Item>
                  <Descriptions.Item label="Hover raw">{hoverRaw ? formatPt(hoverRaw) : "—"}</Descriptions.Item>
                  <Descriptions.Item label="Hover snap">{hoverSnap ? formatPt(hoverSnap) : "—"}</Descriptions.Item>
                </Descriptions>

                <Divider style={{ margin: "8px 0" }} />

                <Text type="secondary">Seed</Text>
                <InputNumber
                  style={{ width: "100%" }}
                  value={Number(seed)}
                  onChange={(v) => onSeed(String(v ?? 7))}
                />
                <Button onClick={onApplySeed} block>
                  Apply seed
                </Button>
              </Space>
            ),
          },
          {
            key: "settings",
            label: "Settings",
            children: (
              <Space direction="vertical" style={{ width: "100%" }} size="middle">
                <Text type="secondary">alpha (overlap)</Text>
                <Slider
                  min={0}
                  max={0.24}
                  step={0.01}
                  value={config.alpha}
                  onChange={(v) => onConfig({ ...config, alpha: v })}
                />

                <Text type="secondary">sigma (noise)</Text>
                <Slider
                  min={0}
                  max={8}
                  step={0.1}
                  value={config.sigma}
                  onChange={(v) => onConfig({ ...config, sigma: v })}
                />

                <Text type="secondary">M (samples/step)</Text>
                <Slider
                  min={1}
                  max={60}
                  step={1}
                  value={config.samplesPerStep}
                  onChange={(v) => onConfig({ ...config, samplesPerStep: v })}
                />

                <Text type="secondary">sensorFrac</Text>
                <Slider
                  min={0.05}
                  max={0.45}
                  step={0.01}
                  value={config.sensorFrac}
                  onChange={(v) => onConfig({ ...config, sensorFrac: v })}
                />

                <Space align="center" style={{ justifyContent: "space-between", width: "100%" }}>
                  <Text>Safe mode</Text>
                  <Switch checked={config.safeMode} onChange={(v) => onConfig({ ...config, safeMode: v })} />
                </Space>

                <Divider style={{ margin: "8px 0" }} />

                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Text type="secondary">nx</Text>
                  <InputNumber
                    min={11}
                    max={151}
                    value={config.nx}
                    onChange={(v) => onConfig({ ...config, nx: Number(v ?? config.nx) })}
                  />
                </Space>

                <Space style={{ width: "100%", justifyContent: "space-between" }}>
                  <Text type="secondary">ny</Text>
                  <InputNumber
                    min={11}
                    max={151}
                    value={config.ny}
                    onChange={(v) => onConfig({ ...config, ny: Number(v ?? config.ny) })}
                  />
                </Space>

                <Button type="primary" onClick={onApplySettings} block>
                  Apply & Reset
                </Button>
              </Space>
            ),
          },
        ]}
      />
    </Card>
  );
}
