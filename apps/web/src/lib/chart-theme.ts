export const chartTheme = {
  axisTick: { fontSize: 11, fill: "var(--muted-foreground)" },
  axisTickSmall: { fontSize: 10, fill: "var(--muted-foreground)" },
  axisTickMedium: { fontSize: 12, fill: "var(--muted-foreground)" },
  axisLine: { stroke: "var(--border)" },
  grid: { stroke: "var(--border)", strokeDasharray: "3 3" },
  tooltipContent: {
    fontSize: 12,
    borderRadius: 8,
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--foreground)",
  },
  tooltipCursor: { fill: "var(--muted)", opacity: 0.55 },
  legendStyle: { color: "var(--muted-foreground)", fontSize: 12 },
} as const;
