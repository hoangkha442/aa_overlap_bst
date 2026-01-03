import { useEffect, useRef, useState } from "react";

export function useResizeBox(minW = 720, minH = 340) {
  const ref = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 1100, h: 640 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver((entries) => {
      const cr = entries[0].contentRect;
      const w = Math.max(minW, Math.floor(cr.width));
      const h = Math.max(minH, Math.floor(Math.min(cr.height, w * 0.62)));
      setBox({ w, h });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [minW, minH]);

  return { ref, box };
}
