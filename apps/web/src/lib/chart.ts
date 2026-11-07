import { useTheme } from "./theme";

const LIGHT = {
  primary: "hsl(231 64% 52%)",
  high: "hsl(0 72% 51%)",
  medium: "hsl(30 92% 44%)",
  low: "hsl(220 12% 55%)",
  ok: "hsl(160 78% 36%)",
  grid: "hsl(220 20% 91%)",
  axis: "hsl(220 11% 46%)",
  expected: "hsl(220 12% 62%)",
  cursor: "hsl(220 24% 92% / 0.6)",
  tooltipBg: "hsl(0 0% 100%)",
  tooltipBorder: "hsl(220 20% 88%)",
  tooltipText: "hsl(222 45% 11%)",
};

const DARK: typeof LIGHT = {
  primary: "hsl(228 82% 68%)",
  high: "hsl(2 78% 64%)",
  medium: "hsl(36 92% 58%)",
  low: "hsl(220 12% 62%)",
  ok: "hsl(158 65% 50%)",
  grid: "hsl(223 22% 20%)",
  axis: "hsl(220 13% 60%)",
  expected: "hsl(220 12% 52%)",
  cursor: "hsl(223 30% 22% / 0.5)",
  tooltipBg: "hsl(223 33% 13%)",
  tooltipBorder: "hsl(223 22% 24%)",
  tooltipText: "hsl(220 30% 96%)",
};

export function useChartColors() {
  const { theme } = useTheme();
  const c = theme === "dark" ? DARK : LIGHT;
  const tooltipStyle = {
    borderRadius: 10,
    border: `1px solid ${c.tooltipBorder}`,
    background: c.tooltipBg,
    color: c.tooltipText,
    boxShadow: "0 12px 32px -14px rgba(0,0,0,0.4)",
    fontSize: 12,
    padding: "8px 10px",
  };
  return { c, tooltipStyle };
}
