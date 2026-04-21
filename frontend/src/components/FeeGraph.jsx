import React, { useState, useEffect } from 'react';
import API_BASE from '../config';

const FeeGraph = () => {
  const [data, setData] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [hoveredMonth, setHoveredMonth] = useState(null);
  const [activeClasses, setActiveClasses] = useState({});
  const [defaulterData, setDefaulterData] = useState([]);

  // --- UNTOUCHED FETCH LOGIC ---
  useEffect(() => {
    fetch(`${API_BASE}/stats/monthly-fees`)
      .then(res => res.json())
      .then(realData => {
        if (!realData || realData.length === 0) {
          setData([{ label: 'No Data' }]);
        } else {
          setData(realData);
          // Init all classes as active
          const classes = [...new Set(
            realData.flatMap(d => Object.keys(d).filter(k => k !== 'label'))
          )].sort();
          const init = {};
          classes.forEach(c => init[c] = true);
          setActiveClasses(init);
        }
      })
      .catch(err => {
        console.error("Error fetching graph data:", err);
        setData([{ label: 'Error' }]);
      });
    fetch(`${API_BASE}/stats/monthly-defaulters`)
      .then(res => res.json())
      .then(d => setDefaulterData(d))
      .catch(err => console.error("Defaulter fetch error:", err));
  }, []);

  // --- UNTOUCHED CONFIGURATION ---
  const allValues = data.flatMap(d => Object.values(d).filter(v => typeof v === 'number'));
  const maxVal = allValues.length > 0 ? Math.max(...allValues) * 1.15 : 1000;

  const classes = [...new Set(
    data.flatMap(d => Object.keys(d).filter(k => k !== 'label'))
  )].sort();

  // Only show months that have actual fee data
  const activeData = data.filter(d =>
    Object.keys(d).some(k => k !== 'label' && d[k] > 0)
  );
  const displayData = activeData.length > 0 ? activeData : data;

  const colorMap = {
    "10": "#6366f1", "10A": "#6366f1", "10B": "#818cf8",
    "9": "#0ea5e9", "9A": "#0ea5e9", "9B": "#38bdf8",
    "8": "#f59e0b", "8A": "#f59e0b", "8B": "#fbbf24",
  };
  const fallbackColors = ["#ef4444", "#ec4899", "#14b8a6", "#84cc16"];
  const getColor = (cls, index) => colorMap[cls] || fallbackColors[index % fallbackColors.length];

  // --- SVG DIMENSIONS ---
  const W = 900;
  const H = 340;
  const PAD_LEFT = 68;
  const PAD_RIGHT = 20;
  const PAD_TOP = 15;
  const PAD_BOT = 30;
  const chartW = W - PAD_LEFT - PAD_RIGHT;
  const chartH = H - PAD_TOP - PAD_BOT;

  const getY = (val) => PAD_TOP + chartH - (val / maxVal) * chartH;
  const getX = (i) => PAD_LEFT + (i / Math.max(displayData.length - 1, 1)) * chartW;

  // Smooth bezier path
  const getSmoothPath = (key) => {
    const points = displayData.map((d, i) => ({ x: getX(i), y: getY(d[key] || 0) }));
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i].x + (points[i + 1].x - points[i].x) * 0.4;
      const cp1y = points[i].y;
      const cp2x = points[i + 1].x - (points[i + 1].x - points[i].x) * 0.4;
      const cp2y = points[i + 1].y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    return d;
  };

  // Area fill path
  const getAreaPath = (key) => {
    const points = displayData.map((d, i) => ({ x: getX(i), y: getY(d[key] || 0) }));
    if (points.length < 2) return "";
    let d = `M ${points[0].x} ${PAD_TOP + chartH}`;
    d += ` L ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const cp1x = points[i].x + (points[i + 1].x - points[i].x) * 0.4;
      const cp1y = points[i].y;
      const cp2x = points[i + 1].x - (points[i + 1].x - points[i].x) * 0.4;
      const cp2y = points[i + 1].y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i + 1].x} ${points[i + 1].y}`;
    }
    d += ` L ${points[points.length - 1].x} ${PAD_TOP + chartH} Z`;
    return d;
  };

  const formatVal = (v) => {
    if (!v) return "₹0";
    if (v >= 1000) return `₹${(v / 1000).toFixed(1)}k`;
    return `₹${v}`;
  };

  const toggleClass = (cls) => {
    setActiveClasses(prev => ({ ...prev, [cls]: !prev[cls] }));
  };

  // Best month
  const monthTotals = displayData.map(d => ({
    label: d.label,
    total: Object.entries(d).filter(([k]) => k !== 'label').reduce((s, [, v]) => s + v, 0)
  }));
  const bestMonth = monthTotals.reduce((a, b) => b.total > a.total ? b : a, { label: "-", total: 0 });

  // Total collected for active classes
  const activeClassList = classes.filter(cls => activeClasses[cls] !== false);
  const grandTotal = data.reduce((sum, d) => {
    return sum + activeClassList.reduce((s, cls) => s + (d[cls] || 0), 0);
  }, 0);
  const classLabel = activeClassList.length === 0
    ? 'No Classes Selected'
    : activeClassList.length === classes.length
      ? 'All Classes'
      : 'Class ' + activeClassList.join(', ');

  return (
    <div style={{ width: "100%", fontFamily: "'DM Sans', 'Segoe UI', sans-serif", userSelect: "none" }}>

      {/* TOP ROW: TITLE + STATS + LEGEND */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", flexWrap: "wrap", gap: "12px" }}>

        {/* Title */}
        <div>
          <div style={{ fontSize: "17px", fontWeight: "700", color: "#0f172a", letterSpacing: "-0.3px" }}>
            Monthly Fee Collection
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "2px" }}>
            Academic year · April → March
          </div>
        </div>

        {/* Quick Stats */}
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>Best Month</div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: "#0f172a", letterSpacing: "-0.5px" }}>{bestMonth.label}</div>
        </div>
      </div>

      {/* LEGEND - Clickable to toggle lines */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
        {classes.map((cls, idx) => {
          const color = getColor(cls, idx);
          const active = activeClasses[cls] !== false;
          return (
            <button
              key={cls}
              onClick={() => toggleClass(cls)}
              style={{
                display: "flex", alignItems: "center", gap: "6px",
                padding: "4px 10px", borderRadius: "20px", border: "1.5px solid",
                borderColor: active ? color : "#e2e8f0",
                backgroundColor: active ? `${color}18` : "#f8fafc",
                cursor: "pointer", transition: "all 0.15s",
                fontSize: "12px", fontWeight: "600",
                color: active ? color : "#94a3b8"
              }}
            >
              <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: active ? color : "#cbd5e1", transition: "background 0.15s" }} />
              Class {cls}
            </button>
          );
        })}
      </div>

      {/* SVG CHART */}
      <div style={{ position: "relative" }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: "100%", height: "100%", minHeight: "280px", overflow: "visible" }}
        >
          <defs>
            {classes.map((cls, idx) => {
              const color = getColor(cls, idx);
              return (
                <linearGradient key={cls} id={`grad-${cls}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={color} stopOpacity="0.01" />
                </linearGradient>
              );
            })}
          </defs>

          {/* GRID LINES */}
          {[0, 0.25, 0.5, 0.75, 1].map(t => {
            const val = Math.round(maxVal * t);
            const y = getY(val);
            return (
              <g key={t}>
                <line x1={PAD_LEFT} y1={y} x2={W - PAD_RIGHT} y2={y}
                  stroke={t === 0 ? "#cbd5e1" : "#f1f5f9"} strokeWidth={t === 0 ? "1" : "1"}
                  strokeDasharray={t === 0 ? "0" : "4 3"}
                />
                <text x={PAD_LEFT - 8} y={y + 4} fontSize="13" fill="#94a3b8" textAnchor="end">
                  {formatVal(val)}
                </text>
              </g>
            );
          })}

          {/* HOVER COLUMN HIGHLIGHT */}
          {hoveredMonth !== null && (
            <rect
              x={getX(hoveredMonth) - chartW / (displayData.length * 2)}
              y={PAD_TOP}
              width={chartW / data.length}
              height={chartH}
              fill="#f8fafc"
              rx="4"
            />
          )}

          {/* AREA FILLS */}
          {classes.map((cls, idx) => {
            if (!activeClasses[cls]) return null;
            return (
              <path
                key={`area-${cls}`}
                d={getAreaPath(cls)}
                fill={`url(#grad-${cls})`}
              />
            );
          })}

          {/* LINES */}
          {classes.map((cls, idx) => {
            if (!activeClasses[cls]) return null;
            const color = getColor(cls, idx);
            const isHovered = hoveredPoint && hoveredPoint.cls === cls;
            return (
              <path
                key={`line-${cls}`}
                d={getSmoothPath(cls)}
                fill="none"
                stroke={color}
                strokeWidth={isHovered ? "2.5" : "2"}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={hoveredPoint && !isHovered ? 0.25 : 1}
                style={{ transition: "opacity 0.2s, stroke-width 0.15s" }}
              />
            );
          })}

          {/* DOTS + HOVER ZONES */}
          {classes.map((cls, idx) => {
            if (!activeClasses[cls]) return null;
            const color = getColor(cls, idx);
            return displayData.map((d, i) => {
              const val = d[cls] || 0;
              const cx = getX(i);
              const cy = getY(val);
              const isActive = hoveredPoint && hoveredPoint.cls === cls && hoveredPoint.i === i;
              return (
                <g key={`dot-${cls}-${i}`}>
                  {/* Glow ring on hover */}
                  {isActive && (
                    <circle cx={cx} cy={cy} r="8" fill={color} opacity="0.15" />
                  )}
                  <circle
                    cx={cx} cy={cy}
                    r={isActive ? "4" : "2.5"}
                    fill="white"
                    stroke={color}
                    strokeWidth="2"
                    style={{ transition: "r 0.15s" }}
                    pointerEvents="none"
                  />
                  {/* Invisible hover target */}
                  <circle
                    cx={cx} cy={cy} r="12"
                    fill="transparent"
                    style={{ cursor: "crosshair" }}
                    onMouseEnter={() => { setHoveredPoint({ cls, i, val, color, x: cx, y: cy, label: d.label }); setHoveredMonth(i); }}
                    onMouseLeave={() => { setHoveredPoint(null); setHoveredMonth(null); }}
                  />
                </g>
              );
            });
          })}

          {/* X-AXIS LABELS */}
          {displayData.map((d, i) => (
            <text
              key={i}
              x={getX(i)} y={H - 4}
              fontSize="10" fill={hoveredMonth === i ? "#0f172a" : "#94a3b8"}
              textAnchor="middle" fontWeight={hoveredMonth === i ? "700" : "400"}
              style={{ transition: "fill 0.15s" }}
            >
              {d.label}
            </text>
          ))}

          {/* TOOLTIP */}
          {hoveredPoint && (() => {
            const tx = Math.min(Math.max(hoveredPoint.x, 60), W - 60);
            const ty = Math.max(hoveredPoint.y - 45, PAD_TOP + 5);
            return (
              <g>
                <rect x={tx - 38} y={ty} width="76" height="30" rx="6"
                  fill="#0f172a" opacity="0.92"
                  filter="drop-shadow(0px 3px 6px rgba(0,0,0,0.25))"
                />
                <text x={tx} y={ty + 12} fontSize="11" fill="#94a3b8" textAnchor="middle">
                  {hoveredPoint.label} · Class {hoveredPoint.cls}
                </text>
                <text x={tx} y={ty + 24} fontSize="13" fill="white" textAnchor="middle" fontWeight="700">
                  {formatVal(hoveredPoint.val)}
                </text>
                {/* Arrow */}
                <polygon
                  points={`${hoveredPoint.x},${hoveredPoint.y - 6} ${hoveredPoint.x - 5},${ty + 30} ${hoveredPoint.x + 5},${ty + 30}`}
                  fill="#0f172a" opacity="0.92"
                />
              </g>
            );
          })()}
        </svg>
      </div>

      {/* DEFAULTERS BAR */}
      {defaulterData.length > 0 && (
        <div style={{ marginTop: "12px" }}>
          <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "6px" }}>
            Defaulters per Month
          </div>
          <div style={{ display: "flex", gap: "4px", alignItems: "flex-end", height: "50px" }}>
            {defaulterData
              .filter(d => displayData.some(dd => dd.label === d.label))
              .map((d, i) => {
                const maxDefaulters = Math.max(...defaulterData.map(x => x.defaulters), 1);
                const barH = Math.max((d.defaulters / maxDefaulters) * 40, d.defaulters > 0 ? 4 : 0);
                const isHov = hoveredMonth !== null && displayData[hoveredMonth]?.label === d.label;
                return (
                  <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: "3px" }}>
                    {d.defaulters > 0 && (
                      <div style={{ fontSize: "12px", fontWeight: "700", color: isHov ? "#ef4444" : "#94a3b8", transition: "color 0.15s" }}>
                        {d.defaulters}
                      </div>
                    )}
                    <div style={{
                      width: "100%", height: `${barH}px`,
                      backgroundColor: isHov ? "#ef4444" : "#fecaca",
                      borderRadius: "3px 3px 0 0",
                      transition: "background 0.15s, height 0.3s",
                      minHeight: d.defaulters > 0 ? "4px" : "0"
                    }} />
                  </div>
                );
              })
            }
          </div>
        </div>
      )}

      {/* MONTH SUMMARY BAR (shows total per month on hover) */}
      {hoveredMonth !== null && displayData[hoveredMonth] && (() => {
        const d = displayData[hoveredMonth];
        const monthTotal = Object.entries(d)
          .filter(([k]) => k !== 'label')
          .reduce((s, [, v]) => s + v, 0);
        return (
          <div style={{
            marginTop: "8px", padding: "8px 14px",
            backgroundColor: "#f8fafc", borderRadius: "8px",
            display: "flex", justifyContent: "space-between", alignItems: "center",
            border: "1px solid #e2e8f0", fontSize: "12px"
          }}>
            <span style={{ color: "#64748b", fontWeight: "600" }}>
              {d.label} — Total collected
            </span>
            <span style={{ fontWeight: "800", color: "#0f172a", fontSize: "14px" }}>
              {formatVal(monthTotal)}
            </span>
          </div>
        );
      })()}

      {/* TOTAL COLLECTED (filtered by active/toggled classes) */}
      <div style={{
        marginTop: "16px",
        background: "linear-gradient(135deg, #1e293b, #0f4c81)",
        borderRadius: "12px", padding: "14px 20px",
        display: "flex", justifyContent: "space-between", alignItems: "center", color: "white"
      }}>
        <div>
          <div style={{ fontSize: "10px", opacity: 0.6, textTransform: "uppercase", letterSpacing: "1px", fontWeight: "700" }}>
            Total Collected — {classLabel}
          </div>
          <div style={{ fontSize: "26px", fontWeight: "800", marginTop: "2px", letterSpacing: "-0.5px" }}>
            ₹{grandTotal.toLocaleString('en-IN')}
          </div>
        </div>
        <div style={{ fontSize: "32px", opacity: 0.4 }}>💰</div>
      </div>

    </div>
  );
};

export default FeeGraph;