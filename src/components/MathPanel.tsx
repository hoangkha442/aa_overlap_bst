import { useEffect, useMemo, useRef, useState } from "react";
import { Card, Collapse,  Space, Tag, Typography } from "antd";
import type { CollapseProps } from "antd";
import { FormulaBlock } from "./FormulaBlock";
import type { Point } from "../sim/overlapSearch2D";

const { Text } = Typography;

export type FormulaId =
  | "partition"
  | "grid_step"
  | "likelihood"
  | "choose_region"
  | "ml_geometry";

export type PhaseKey =
  | "before"
  | "partition"
  | "overlap"
  | "measure"
  | "choose"
  | "after";

export type MathState = {
  alpha: number;
  sigma: number;
  M: number;
  sigmaEff: number;

  // n_prev / n_new
  nPrev: { nx: number; ny: number; n: number };
  nNew: { nx: number; ny: number; n: number };

  // partition
  splitDim: "x" | "y";
  mid: number;
  delta: number;

  // sensors/target (để thay số minh hoạ μ(target))
  P0: number;
  eta: number;
  sensors: [Point, Point];
  target: Point;

  // measurement (optional)
  zbar?: [number, number];
  // optional: mu of chosen k (nếu bạn có trong state)
  muChosen?: [number, number];

  // decision (optional)
  maxLL_H1?: number;
  maxLL_H2?: number;
  chosenHyp?: "H1" | "H2";
  forced?: boolean;
};

function r2(x: number) {
  return Math.round(x * 100) / 100;
}

function substitutionLatex(active: FormulaId, s: MathState) {
  const eps = 1e-6;

  // common values
  const s1 = s.sensors[0];
  const s2 = s.sensors[1];
  const t = s.target;

  const d1 = Math.hypot(t.x - s1.x, t.y - s1.y);
  const d2 = Math.hypot(t.x - s2.x, t.y - s2.y);

  const muT1 = s.P0 - 10 * s.eta * Math.log10(d1 + eps);
  const muT2 = s.P0 - 10 * s.eta * Math.log10(d2 + eps);

  if (active === "partition") {
    const nCut = s.splitDim === "x" ? s.nPrev.nx : s.nPrev.ny;
    const leftSize = Math.ceil(nCut / 2);
    const rawDelta = Math.round((0.5 + s.alpha) * nCut) - leftSize;
    const delta = Math.max(0, rawDelta);
    return String.raw`
\begin{aligned}
n^{(t-1)}_{d_t} &= ${nCut}\\
\text{leftSize} &= \lceil ${nCut}/2 \rceil = ${leftSize}\\
\delta_t &= \max\big(0,\;\text{round}((\tfrac12+\alpha)n^{(t-1)}_{d_t})-\text{leftSize}\big)\\
&= \max(0,\;\text{round}((\tfrac12+${r2(s.alpha)})\cdot ${nCut})-${leftSize})\\
&= \max(0,\;${rawDelta}) = ${delta}\\[6pt]
\text{cutDim} &= ${s.splitDim.toUpperCase()},\quad \text{mid}=${r2(s.mid)}
\end{aligned}
`;
  }

  if (active === "likelihood" || active === "ml_geometry") {
    const z = s.zbar ? `[${r2(s.zbar[0])},\\;${r2(s.zbar[1])}]` : "\\bar z";
    const mu = s.muChosen
      ? `[${r2(s.muChosen[0])},\\;${r2(s.muChosen[1])}]`
      : "\\mu(k)";
    const llTarget = s.zbar
      ? -(
          ((s.zbar[0] - muT1) ** 2 + (s.zbar[1] - muT2) ** 2) /
          (2 * s.sigmaEff ** 2)
        )
      : null;

    return String.raw`
\begin{aligned}
\sigma_{\text{eff}} &= \frac{\sigma}{\sqrt{M}}
= \frac{${r2(s.sigma)}}{\sqrt{${s.M}}}
\approx ${r2(s.sigmaEff)}\\[6pt]
\mu(\text{target}) &= \big[\mu_1,\mu_2\big]
= \Big[${r2(muT1)},\;${r2(muT2)}\Big]\\[6pt]
\ell(k) &\propto -\frac{\lVert ${z}-\mu(k)\rVert^2}{2\sigma_{\text{eff}}^2}\\
\bar z &= ${z},\quad \mu(k)=${mu}
${
  llTarget !== null
    ? String.raw`\\[6pt]\ell(\text{target})\propto ${llTarget.toFixed(6)}`
    : ""
}
\end{aligned}
`;
  }

  if (active === "choose_region") {
    const a = s.maxLL_H1 ?? NaN;
    const b = s.maxLL_H2 ?? NaN;
    return String.raw`
\begin{aligned}
\text{Score}(H_1) &= \max_{k\in H_1}\ell(k) \approx ${
      isNaN(a) ? "\\text{(n/a)}" : a.toFixed(6)
    }\\
\text{Score}(H_2) &= \max_{k\in H_2}\ell(k) \approx ${
      isNaN(b) ? "\\text{(n/a)}" : b.toFixed(6)
    }\\[6pt]
H_t &= \arg\max_{i\in\{1,2\}} \text{Score}(H_i) \Rightarrow \text{chosen}=${
      s.chosenHyp ?? "\\text{(n/a)}"
    }\\
n_{\text{prev}}&=${s.nPrev.n}\;\to\;n_{\text{new}}=${s.nNew.n}
\end{aligned}
`;
  }

  return String.raw`\text{No substitution for this formula yet.}`;
}

export function MathPanel(props: {
  activePhase: PhaseKey;
  activeFormula: FormulaId;
  mathState: MathState;
}) {
  const { activePhase, activeFormula, mathState } = props;

  // auto-scroll to ACTIVE
  const refs = useRef<Record<FormulaId, HTMLDivElement | null>>({
    partition: null,
    grid_step: null,
    likelihood: null,
    choose_region: null,
    ml_geometry: null,
  });

  useEffect(() => {
    const el = refs.current[activeFormula];
    if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [activeFormula]);

  // let user keep panels opened, but always open ACTIVE group
  const [userOpen, setUserOpen] = useState<string[]>(["core"]);
  const openKeys = Array.from(new Set([...userOpen, "core"]));

  const formulas = useMemo(() => {
    // Eq(2) partitions, Eq(4) likelihood, Eq(5) choose. (paper)
    const partition = String.raw`
\begin{aligned}
H_1^t &= \{k\in H_{t-1}\mid k_{d_t}\le m_{d_t}^t + \delta_t \Delta_{d_t}\}\\
H_2^t &= \{k\in H_{t-1}\mid k_{d_t}\ge m_{d_t}^t - \delta_t \Delta_{d_t}\}
\end{aligned}
`;

    const gridStep = String.raw`
\Delta_{d_t}=\frac{L_{d_t}^0}{n_{d_t}^{(0)}}
`;

    const likelihood = String.raw`
\ell(k)=\sum_{j=1}^{|S_t|}\log p\left(z_j^t \mid l_T=k\right)
`;

    const chooseRegion = String.raw`
H_t=\arg\max_{i\in\{1,2\}}\left\{\max_{k\in H_i^t}\ell(k)\right\}
`;

    // Gaussian → ML ~ nearest L2 (your code uses squared norm form)
    const mlGeometry = String.raw`
k_{\text{ML}}=\arg\min_{k\in H_{t-1}}\lVert \bar z-\mu(k)\rVert_2^2
\quad\Leftrightarrow\quad
\ell(k)\propto-\frac{\lVert \bar z-\mu(k)\rVert_2^2}{2\sigma_{\text{eff}}^2}
`;

    return { partition, gridStep, likelihood, chooseRegion, mlGeometry };
  }, []);

  const isActive = (id: FormulaId) => id === activeFormula;

  const labelNode = (id: FormulaId, title: string) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontWeight: isActive(id) ? 700 : 500 }}>{title}</span>
      {isActive(id) ? <Tag color="gold">ACTIVE</Tag> : <Tag>—</Tag>}
    </div>
  );

  const items: CollapseProps["items"] = [
    {
      key: "core",
      label: "Core formulas",
      children: (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Tag color="blue">Phase: {activePhase}</Tag>
            <Tag color="geekblue">Active: {activeFormula}</Tag>
          </div>
          <FormulaBlock
            ref={(el) => {
              refs.current.partition = el;
            }} 
            title={labelNode("partition", "Eq. Partition (H1/H2)")} 
            latex={formulas.partition}
            active={isActive("partition")}
          />
          <FormulaBlock
            ref={(el) => {
              refs.current.grid_step = el;
            }} 
            title={labelNode("grid_step", "Grid step Δ")}
            latex={formulas.gridStep}
            active={isActive("grid_step")}
            subtle
          />
          <FormulaBlock
            ref={(el) => {
              refs.current.likelihood = el;
            }} 
            title={labelNode("likelihood", "Eq. Likelihood update")}
            latex={formulas.likelihood}
            active={isActive("likelihood")}
          />
          <FormulaBlock
            ref={(el) => {
              refs.current.choose_region = el;
            }} 
            title={labelNode("choose_region", "Eq. Choose region")}
            latex={formulas.chooseRegion}
            active={isActive("choose_region")}
          />
          <FormulaBlock
            ref={(el) => {
              refs.current.ml_geometry = el;
            }} 
            title={labelNode(
              "ml_geometry",
              "ML geometry (Gaussian ⇔ nearest ℓ2)"
            )}
            latex={formulas.mlGeometry}
            active={isActive("ml_geometry")}
            subtle
          />
        </Space>
      ),
    },
    {
      key: "sub",
      label: "Substitution (theo step hiện tại)",
      children: (
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text type="secondary">
            Panel này tự đổi theo <b>ACTIVE</b>.
          </Text>
          <FormulaBlock
            latex={substitutionLatex(activeFormula, mathState)}
            active
          />
        </Space>
      ),
    },
  ];

  return (
    <Card
      size="small"
      title="Math"
      style={{ borderRadius: 12, height: "100%" }}
      bodyStyle={{
        padding: 12,
        height: "calc(100% - 48px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Scroll container riêng */}
      <div style={{ overflow: "auto", paddingRight: 6, height: "100%" }}>
        <Collapse
          items={items}
          activeKey={openKeys}
          onChange={(keys) =>
            setUserOpen(
              Array.isArray(keys) ? (keys as string[]) : [keys as string]
            )
          }
        />
      </div>
    </Card>
  );
}
