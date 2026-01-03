// src/components/FormulaBlock.tsx
import React, { forwardRef } from "react";
import { BlockMath } from "react-katex";

type FormulaBlockProps = {
  title?: React.ReactNode; 
  latex: string;
  active?: boolean;
  subtle?: boolean;
};

export const FormulaBlock = forwardRef<HTMLDivElement, FormulaBlockProps>(
  ({ title, latex, active, subtle }, ref) => {
    return (
      <div
        ref={ref}
        style={{
          border: active ? "2px solid #1677ff" : "1px solid rgba(0,0,0,0.08)",
          background: active
            ? "rgba(22,119,255,0.06)"
            : subtle
            ? "rgba(0,0,0,0.02)"
            : "white",
          borderRadius: 12,
          padding: 12,
          transition: "all 150ms ease",
        }}
      >
        {title ? (
          <div style={{ fontWeight: 600, marginBottom: 8, opacity: 0.85 }}>
            {title}
          </div>
        ) : null}

        <div style={{ overflowX: "auto" }}>
          <BlockMath math={latex} />
        </div>
      </div>
    );
  }
);

FormulaBlock.displayName = "FormulaBlock";
