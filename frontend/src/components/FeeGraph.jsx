import React, { useState, useEffect } from 'react';

const FeeGraph = () => {
  const [data, setData] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // --- 1. FETCH REAL DATA FROM BACKEND ---
  useEffect(() => {
    fetch("http://127.0.0.1:8000/stats/monthly-fees")
      .then(res => res.json())
      .then(realData => {
        // Handle empty database case nicely
        if (!realData || realData.length === 0) {
            setData([{ label: 'No Data' }]);
        } else {
            setData(realData);
        }
      })
      .catch(err => {
          console.error("Error fetching graph data:", err);
          setData([{ label: 'Error' }]); 
      });
  }, []);

  // --- CONFIGURATION ---
  const width = 300; 
  const height = 100;
  const padding = 20;

  // Calculate Max Value dynamically (so graph scales automatically)
  const allValues = data.flatMap(d => Object.values(d).filter(v => typeof v === 'number'));
  const maxVal = allValues.length > 0 ? Math.max(...allValues) * 1.1 : 1000;

  // Extract Class Names dynamically (Find ALL unique keys in the data)
  const classes = [...new Set(
      data.flatMap(d => Object.keys(d).filter(k => k !== 'label'))
  )].sort();

  // --- PALETTE MANAGER ---
  const colorMap = {
    "10A": "#8b5cf6", "10B": "#3b82f6",
    "9A":  "#10b981", "9B":  "#34d399", "9": "#10b981",
    "8A":  "#f59e0b", "8B":  "#f97316", "8": "#f59e0b",
  };
  const fallbackColors = ["#ef4444", "#ec4899", "#6366f1", "#14b8a6"];

  const getColor = (cls, index) => {
    return colorMap[cls] || fallbackColors[index % fallbackColors.length];
  };

  // Helper: Scale Y value
  const getY = (val) => height - (val / maxVal) * (height - 20) - 10;
  
  // Helper: Scale X value
  const getX = (index) => padding + (index / (Math.max(data.length - 1, 1))) * (width - padding);

  // Helper: Generate SVG Path (Handles missing data safely)
  const getPath = (key) => {
    return data.map((d, i) => {
        const val = d[key] || 0; 
        return `${getX(i)},${getY(val)}`;
    }).join(" ");
  };

  return (
    <div style={{ width: "100%", height: "100%", position: "relative", fontFamily: "sans-serif" }}>
      
      {/* 1. Header & Dynamic Legend */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h3 style={{ margin: 0, color: "#334155", fontSize: "16px" }}>
            Monthly Cash Flow 
            <span style={{fontSize:"11px", color:"#94a3b8", fontWeight:"normal", marginLeft:"5px"}}>(In ₹)</span>
        </h3>
        <div style={{ display: "flex", flexWrap:"wrap", gap: "10px", fontSize: "11px", justifyContent:"flex-end", maxWidth:"50%" }}>
             {classes.map((cls, idx) => (
               <div key={cls} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: getColor(cls, idx) }}></div>
                  <span style={{ color: "#64748b", fontWeight: "600" }}>{cls}</span>
               </div>
             ))}
        </div>
      </div>

      {/* 2. THE INTERACTIVE GRAPH */}
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "80%", overflow: "visible" }}>
        
        {/* --- Y-AXIS (Amounts) --- */}
        {/* --- Y-AXIS (Amounts) --- */}
{[0, 0.25, 0.5, 0.75, 1].map(t => Math.round(maxVal * t)).map(val => (
            <g key={val}>
                <line x1={padding} y1={getY(val)} x2={width} y2={getY(val)} stroke="#e2e8f0" strokeWidth="0.5" strokeDasharray="3" />
                <text x={0} y={getY(val) + 2} fontSize="6" fill="#94a3b8" textAnchor="start">
                    {val === 0 ? "0" : (val/1000) + "k"}
                </text>
            </g>
        ))}

        {/* --- DYNAMIC LINES --- */}
        {classes.map((cls, idx) => {
            const color = getColor(cls, idx);
            return (
                <g key={cls}>
                    {/* The Line */}
                    <polyline 
                        points={getPath(cls)} 
                        fill="none" 
                        stroke={color} 
                        strokeWidth="2" 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        opacity={hoveredPoint && hoveredPoint.cls !== cls ? 0.2 : 1} 
                        style={{ transition: "opacity 0.2s" }}
                    />
                    
                    {/* Invisible Touch Targets */}
                    {data.map((d, i) => (
                        <circle 
                            key={i}
                            cx={getX(i)} 
                            cy={getY(d[cls] || 0)}
                            r="6" 
                            fill="transparent"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredPoint({ x: getX(i), y: getY(d[cls]), val: d[cls], label: d.label, cls: cls, color: color })}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                    ))}

                    {/* Visible Dots (Style) */}
                    {data.map((d, i) => (
                        <circle 
                            key={i + "_vis"}
                            cx={getX(i)} 
                            cy={getY(d[cls] || 0)}
                            r={hoveredPoint && hoveredPoint.cls === cls && hoveredPoint.x === getX(i) ? "3" : "1.5"}
                            fill="white"
                            stroke={color}
                            strokeWidth="1.5"
                            pointerEvents="none"
                            style={{ transition: "r 0.2s" }}
                        />
                    ))}
                </g>
            );
        })}

        {/* --- X-AXIS (Months) --- */}
        {data.map((d, i) => (
           <text key={i} x={getX(i)} y={height + 10} fontSize="7" fill="#94a3b8" textAnchor="middle">{d.label}</text>
        ))}

        {/* --- TOOLTIP --- */}
        {hoveredPoint && (
            <g>
                <rect 
                    x={hoveredPoint.x - 22} 
                    y={hoveredPoint.y - 28} 
                    width="44" 
                    height="18" 
                    rx="4" 
                    fill={hoveredPoint.color} 
                    stroke="white"
                    strokeWidth="1"
                    filter="drop-shadow(0px 2px 2px rgba(0,0,0,0.2))"
                />
                <polygon points={`${hoveredPoint.x},${hoveredPoint.y - 4} ${hoveredPoint.x - 4},${hoveredPoint.y - 10} ${hoveredPoint.x + 4},${hoveredPoint.y - 10}`} fill={hoveredPoint.color} />
                
                <text 
                    x={hoveredPoint.x} 
                    y={hoveredPoint.y - 16} 
                    fontSize="7" 
                    fontWeight="bold" 
                    fill="white" 
                    textAnchor="middle"
                >
                    ₹{(hoveredPoint.val / 1000).toFixed(1)}k
                </text>
            </g>
        )}

      </svg>
    </div>
  );
};

export default FeeGraph;