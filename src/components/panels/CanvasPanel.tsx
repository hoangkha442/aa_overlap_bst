import { Badge, Card, Divider, Space, Tag, Typography } from "antd";
import Board2D, { type Phase } from "../Board2D";
import type { Point, SimStepState } from "../../sim/overlapSearch2D";
import { useResizeBox } from "../../app/useResizeBox";

const { Text } = Typography;

export function CanvasPanel(props: {
  found: boolean;

  state: SimStepState;
  phase: Phase;

  zoom: number;
  onZoom: (z: number) => void;

  stagePos: { x: number; y: number };
  onStagePos: (p: { x: number; y: number }) => void;

  overlayEnabled: boolean;
  overlayText: string;

  picking: boolean;
  onHover: (raw: Point | null, snap: Point | null) => void;
  onPick: (snap: Point) => void;
}) {
  const {
    found,
    state,
    phase,
    zoom,
    onZoom,
    stagePos,
    onStagePos,
    overlayEnabled,
    overlayText,
    picking,
    onHover,
    onPick,
  } = props;

  const { ref, box } = useResizeBox(720, 340);

  return (
    <Card
      size="small"
      title={
        <Space>
          <Badge status={found ? "success" : "processing"} />
          <Text strong>Canvas</Text>
          <Text type="secondary">wheel=zoom · drag=pan</Text>
        </Space>
      }
      extra={
        <Space>
          <Tag color="blue">H1</Tag>
          <Tag color="orange">H2</Tag>
          <Tag color="purple">Overlap</Tag>
          <Tag color="green">After</Tag>
          <Tag color="red">Target</Tag>
        </Space>
      }
      style={{ borderRadius: 12 }}
      bodyStyle={{ padding: 10 }}
    >
      <div ref={ref} style={{ width: "100%", height: "60vh", minHeight: 380 }}>
        <Board2D
          state={state}
          width={box.w}
          height={box.h}
          phase={phase}
          overlayText={""}
          zoom={zoom}
          onZoomChange={onZoom}
          stagePos={stagePos}
          onStagePosChange={onStagePos}
          pickingEnabled={picking}
          onHover={onHover}
          onPick={onPick}
        />
      </div>

      {overlayEnabled && (
        <>
          <Divider style={{ margin: "10px 0" }} />
          <div
            style={{
              padding: 10,
              border: "1px solid #f0f0f0",
              borderRadius: 10,
              background: "#fafafa",
              maxHeight: 160,

              overflowY: "auto",
              overflowX: "hidden",
            }}
          >
            <Text
              type="secondary"
              style={{ display: "block", marginBottom: 6 }}
            >
              Overlay
            </Text>
            <pre
              style={{
                margin: 0,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 12,
                lineHeight: 1.35,
                fontFamily:
                  'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
              }}
            >
              {overlayText}
            </pre>
          </div>
        </>
      )}
    </Card>
  );
}
