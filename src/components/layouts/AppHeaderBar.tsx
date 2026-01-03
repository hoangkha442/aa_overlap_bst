import { Button, Space, Tag, Tooltip, Typography } from "antd";
import {
  AimOutlined,
  EyeOutlined,
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
} from "@ant-design/icons";

const { Title } = Typography;

export function AppHeaderBar(props: {
  title: string;
  status: "FOUND" | "SAFE" | "RUN";
  n: number;
  mode: "step" | "phase";
  overlay: boolean;
  onToggleOverlay: () => void;

  prevDisabled: boolean;
  onPrev: () => void;

  found: boolean;
  onNext: () => void;

  auto: boolean;
  onToggleAuto: () => void;

  onReset: () => void;

  picking: boolean;
  onTogglePicking: () => void;
}) {
  const {
    title,
    status,
    n,
    mode,
    overlay,
    onToggleOverlay,
    prevDisabled,
    onPrev,
    found,
    onNext,
    auto,
    onToggleAuto,
    onReset,
    picking,
    onTogglePicking,
  } = props;

  const statusTag =
    status === "FOUND" ? (
      <Tag color="success">FOUND</Tag>
    ) : status === "SAFE" ? (
      <Tag color="error">SAFE</Tag>
    ) : (
      <Tag color="processing">RUN</Tag>
    );

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <Space align="center" size={12}>
        <Title level={4} style={{ margin: 0, color: "#fff" }}>
          {title}
        </Title>
        {statusTag}
        <Tag color="default">n={n}</Tag>
        <Tag color="default">mode={mode.toUpperCase()}</Tag>
      </Space>

      <Space wrap>
        <Tooltip title="Overlay panel under canvas">
          <Button
            icon={<EyeOutlined />}
            onClick={onToggleOverlay}
            type={overlay ? "primary" : "default"}
          >
            Overlay
          </Button>
        </Tooltip>

        <Tooltip title="Prev">
          <Button icon={<StepBackwardOutlined />} onClick={onPrev} disabled={prevDisabled}>
            Prev
          </Button>
        </Tooltip>

        <Tooltip title="Next">
          <Button icon={<StepForwardOutlined />} onClick={onNext} disabled={found}>
            Next
          </Button>
        </Tooltip>

        <Tooltip title="Start/Pause">
          <Button
            icon={auto ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            onClick={onToggleAuto}
            type="primary"
            disabled={found}
          >
            {auto ? "Pause" : "Start"}
          </Button>
        </Tooltip>

        <Tooltip title="Reset">
          <Button icon={<ReloadOutlined />} onClick={onReset}>
            Reset
          </Button>
        </Tooltip>

        <Tooltip title="Pick Target">
          <Button icon={<AimOutlined />} onClick={onTogglePicking} type={picking ? "primary" : "default"}>
            Target
          </Button>
        </Tooltip>
      </Space>
    </div>
  );
}
