import React, { useState, useEffect, useRef } from 'react';
import API_BASE from '../config';

function ExamHistorySection({ examHistory, marksThreshold }) {
  const [expanded, setExpanded] = useState({});
  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div>
      <div style={{ fontSize: "13px", fontWeight: "700", color: "#374151", marginBottom: "8px" }}>Exam History</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        {examHistory.map((exam, i) => {
          const key = `${exam.name}||${exam.date}`;
          const isOpen = expanded[key];
          const avgPct = exam.subjects && exam.subjects.length > 0
            ? Math.round(exam.subjects.reduce((s, x) => s + x.pct, 0) / exam.subjects.length)
            : exam.pct || 0;
          return (
            <div key={i} style={{ border: "1px solid #f1f5f9", borderRadius: "8px", overflow: "hidden" }}>
              <div onClick={() => toggle(key)} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 10px", cursor: "pointer", backgroundColor: isOpen ? "#f8fafc" : "white" }}>
                <span style={{ fontSize: "11px", color: "#94a3b8" }}>{isOpen ? "▾" : "▸"}</span>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#374151", flex: 1 }}>{exam.name}</div>
                <div style={{ fontSize: "10px", color: "#94a3b8", marginRight: "6px" }}>{exam.date}</div>
                <div style={{ width: "50px", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${avgPct}%`, backgroundColor: avgPct >= marksThreshold ? "#22c55e" : "#ef4444", borderRadius: "3px" }} />
                </div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: avgPct >= marksThreshold ? "#22c55e" : "#ef4444", width: "35px", textAlign: "right" }}>{avgPct}%</div>
              </div>
              {isOpen && exam.subjects && (
                <div style={{ padding: "4px 10px 10px 26px", backgroundColor: "#f8fafc", display: "flex", flexDirection: "column", gap: "5px" }}>
                  {exam.subjects.map((sub, j) => (
                    <div key={j} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ fontSize: "11px", color: "#6b7280", width: "90px", flexShrink: 0 }}>{sub.subject}</div>
                      <div style={{ flex: 1, height: "5px", backgroundColor: "#e5e7eb", borderRadius: "3px", overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${sub.pct}%`, backgroundColor: sub.pct >= marksThreshold ? "#22c55e" : "#ef4444", borderRadius: "3px" }} />
                      </div>
                      <div style={{ fontSize: "11px", color: "#374151", width: "60px", textAlign: "right" }}>{sub.marks}/{sub.max} ({sub.pct}%)</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Analytics() {
  const [classStd, setClassStd] = useState("10");
  const [division, setDivision] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [attThreshold, setAttThreshold] = useState(75);
  const [marksThreshold, setMarksThreshold] = useState(50);
  const [hoveredStudent, setHoveredStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const svgRef = useRef(null);

  useEffect(() => {
    fetchData();
  }, [classStd, division]);

  const fetchData = async () => {
    setLoading(true);
    setSelectedStudent(null);
    try {
      const res = await fetch(`${API_BASE}/analytics/class-performance?class_std=${classStd}&division=${division}`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const getZone = (s) => {
    if (s.attendance_pct < attThreshold && s.avg_marks_pct < marksThreshold) return "risk";
    if (s.attendance_pct >= attThreshold && s.avg_marks_pct >= marksThreshold) return "good";
    return "average";
  };

  const zoneColors = { risk: "#ef4444", average: "#f59e0b", good: "#22c55e" };
  const zoneLabels = { risk: "At Risk", average: "Needs Attention", good: "Performing Well" };
  const zoneBg = { risk: "#fef2f2", average: "#fffbeb", good: "#f0fdf4" };
  const zoneBorder = { risk: "#fecaca", average: "#fde68a", good: "#bbf7d0" };

  const atRisk = students.filter(s => getZone(s) === "risk");
  const average = students.filter(s => getZone(s) === "average");
  const good = students.filter(s => getZone(s) === "good");

  // Scatter plot dimensions
  const W = 500, H = 340;
  const PAD = 45;
  const chartW = W - PAD * 2;
  const chartH = H - PAD * 2;

  const getX = (pct) => PAD + (pct / 100) * chartW;
  const getY = (pct) => PAD + chartH - (pct / 100) * chartH;

  const trendIcon = (t) => t === "improving" ? "▲" : t === "declining" ? "▼" : "→";
  const trendColor = (t) => t === "improving" ? "#22c55e" : t === "declining" ? "#ef4444" : "#94a3b8";

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>

      {/* PRINT HEADER */}
      <div className="print-only">
        <h1>Universal Trust, Kunnuvazhy</h1>
        <p>Education & Learning Centre</p>
        <hr style={{ margin: "10px 0", borderTop: "1px solid #000" }} />
        <h3 style={{ textAlign: "center", margin: "10px 0" }}>
          Student Analytics Report
        </h3>
        <p style={{ textAlign: "center", margin: "4px 0 0", fontSize: "13pt" }}>
          Class {classStd}{division ? ` — Division ${division}` : ""}
        </p>
      </div>

      {/* CONTROLS */}
      <div className="card-glass" style={{ padding: "16px 20px", marginBottom: "24px", display: "flex", gap: "20px", alignItems: "flex-end", flexWrap: "wrap", backgroundColor: "white" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#6b7280", marginBottom: "5px", textTransform: "uppercase" }}>Class</label>
          <select value={classStd} onChange={e => setClassStd(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "14px" }}>
            <option value="8">Class 8</option>
            <option value="9">Class 9</option>
            <option value="10">Class 10</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#6b7280", marginBottom: "5px", textTransform: "uppercase" }}>Division</label>
          <select value={division} onChange={e => setDivision(e.target.value)} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "14px" }}>
            <option value="">All</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#6b7280", marginBottom: "5px", textTransform: "uppercase" }}>
            Attendance Threshold: <span style={{ color: "#ef4444" }}>{attThreshold}%</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="range" min="0" max="100" value={attThreshold} onChange={e => setAttThreshold(Number(e.target.value))}
              style={{ width: "120px", accentColor: "#ef4444" }} />
            <input type="number" min="0" max="100" value={attThreshold} onChange={e => setAttThreshold(Number(e.target.value))}
              style={{ width: "55px", padding: "4px 6px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "13px", fontWeight: "700", color: "#ef4444", textAlign: "center" }} />
          </div>
        </div>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: "#6b7280", marginBottom: "5px", textTransform: "uppercase" }}>
            Marks Threshold: <span style={{ color: "#f59e0b" }}>{marksThreshold}%</span>
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="range" min="0" max="100" value={marksThreshold} onChange={e => setMarksThreshold(Number(e.target.value))}
              style={{ width: "120px", accentColor: "#f59e0b" }} />
            <input type="number" min="0" max="100" value={marksThreshold} onChange={e => setMarksThreshold(Number(e.target.value))}
              style={{ width: "55px", padding: "4px 6px", borderRadius: "6px", border: "1px solid #e5e7eb", fontSize: "13px", fontWeight: "700", color: "#f59e0b", textAlign: "center" }} />
          </div>
        </div>
        <button onClick={fetchData} style={{ padding: "8px 20px", backgroundColor: "#4f46e5", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold", height: "36px" }}>
          Refresh
        </button>
        <button
          onClick={() => window.print()}
          className="no-print"
          style={{
            padding: "8px 20px",
            backgroundColor: "#111827",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontWeight: "bold",
            height: "36px"
          }}
        >
          🖨 Print
        </button>


      </div>

      {loading && <div style={{ textAlign: "center", padding: "60px", color: "#6b7280" }}>⏳ Analysing class data...</div>}

      {!loading && students.length > 0 && (
        <>
          {/* CLASS HEALTH CARDS */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginBottom: "24px" }}>
            {[
              { zone: "risk", count: atRisk.length, icon: "🚨", desc: "Low attendance & marks" },
              { zone: "average", count: average.length, icon: "⚠️", desc: "One metric below threshold" },
              { zone: "good", count: good.length, icon: "✅", desc: "Both metrics above threshold" },
            ].map(({ zone, count, icon, desc }) => (
              <div key={zone} style={{ padding: "20px", backgroundColor: zoneBg[zone], border: `1px solid ${zoneBorder[zone]}`, borderRadius: "12px", borderLeft: `4px solid ${zoneColors[zone]}` }}>
                <div style={{ fontSize: "24px", marginBottom: "4px" }}>{icon}</div>
                <div style={{ fontSize: "32px", fontWeight: "800", color: zoneColors[zone] }}>{count}</div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#374151" }}>{zoneLabels[zone]}</div>
                <div style={{ fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>{desc}</div>
              </div>
            ))}
          </div>

          {/* SCATTER PLOT + AT RISK LIST */}
          <div className="no-print" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>

            {/* SCATTER PLOT */}
            <div className="card-glass no-print" style={{ padding: "20px", backgroundColor: "white" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>Performance Map</div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Attendance % vs Avg Marks % · click a dot to inspect</div>
              <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto" }}>
                {/* Zone backgrounds */}
                {/* Bottom-left: risk */}
                <rect x={PAD} y={getY(marksThreshold)} width={getX(attThreshold) - PAD} height={getY(0) - getY(marksThreshold)} fill="#fef2f2" opacity="0.6" />
                {/* Top-right: good */}
                <rect x={getX(attThreshold)} y={PAD} width={W - PAD - getX(attThreshold)} height={getY(marksThreshold) - PAD} fill="#f0fdf4" opacity="0.6" />

                {/* Grid lines */}
                {[0, 25, 50, 75, 100].map(v => (
                  <g key={v}>
                    <line x1={PAD} y1={getY(v)} x2={W - PAD} y2={getY(v)} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={PAD - 6} y={getY(v) + 4} fontSize="9" fill="#94a3b8" textAnchor="end">{v}%</text>
                    <line x1={getX(v)} y1={PAD} x2={getX(v)} y2={H - PAD} stroke="#f1f5f9" strokeWidth="1" />
                    <text x={getX(v)} y={H - PAD + 14} fontSize="9" fill="#94a3b8" textAnchor="middle">{v}%</text>
                  </g>
                ))}

                {/* Threshold lines */}
                <line x1={getX(attThreshold)} y1={PAD} x2={getX(attThreshold)} y2={H - PAD} stroke="#ef4444" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />
                <line x1={PAD} y1={getY(marksThreshold)} x2={W - PAD} y2={getY(marksThreshold)} stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="5 3" opacity="0.6" />

                {/* Axis labels */}
                <text x={W / 2} y={H - 2} fontSize="10" fill="#6b7280" textAnchor="middle">Attendance %</text>
                <text x={10} y={H / 2} fontSize="10" fill="#6b7280" textAnchor="middle" transform={`rotate(-90, 10, ${H / 2})`}>Avg Marks %</text>

                {/* Dots */}
                {students.map((s) => {
                  const zone = getZone(s);
                  const color = zoneColors[zone];
                  const cx = getX(s.attendance_pct);
                  const cy = getY(s.avg_marks_pct);
                  const isHov = hoveredStudent?.adm === s.adm;
                  const isSel = selectedStudent?.adm === s.adm;
                  return (
                    <g key={s.adm}>
                      {(isHov || isSel) && <circle cx={cx} cy={cy} r="12" fill={color} opacity="0.2" />}
                      <circle
                        cx={cx} cy={cy}
                        r={isHov || isSel ? "7" : "5"}
                        fill={color}
                        stroke="white"
                        strokeWidth="2"
                        style={{ cursor: "pointer", transition: "r 0.15s" }}
                        onMouseEnter={() => setHoveredStudent(s)}
                        onMouseLeave={() => setHoveredStudent(null)}
                        onClick={() => setSelectedStudent(s === selectedStudent ? null : s)}
                      />
                      {/* Tooltip on hover */}
                      {isHov && (
                        <g>
                          <rect x={cx + 10} y={cy - 22} width="100" height="26" rx="5" fill="#0f172a" opacity="0.9" />
                          <text x={cx + 60} y={cy - 12} fontSize="9" fill="#94a3b8" textAnchor="middle">{s.name}</text>
                          <text x={cx + 60} y={cy - 2} fontSize="9" fill="white" textAnchor="middle" fontWeight="700">
                            Att: {s.attendance_pct}% · Marks: {s.avg_marks_pct}%
                          </text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* SELECTED STUDENT DETAIL or AT RISK LIST */}
            <div className="card-glass" style={{ padding: "20px", backgroundColor: "white", overflowY: "auto", maxHeight: "440px" }}>
              {selectedStudent ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#111827" }}>{selectedStudent.name}</div>
                      <div style={{ fontSize: "12px", color: "#6b7280" }}>{selectedStudent.school || "N/A"}</div>
                    </div>
                    <button onClick={() => setSelectedStudent(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "18px", color: "#9ca3af" }}>✕</button>
                  </div>

                  {/* Stats */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", marginBottom: "16px" }}>
                    {[
                      { label: "Attendance", value: `${selectedStudent.attendance_pct}%`, color: selectedStudent.attendance_pct >= attThreshold ? "#22c55e" : "#ef4444" },
                      { label: "Avg Marks", value: `${selectedStudent.avg_marks_pct}%`, color: selectedStudent.avg_marks_pct >= marksThreshold ? "#22c55e" : "#ef4444" },
                      { label: "Trend", value: trendIcon(selectedStudent.trend), color: trendColor(selectedStudent.trend) },
                    ].map(({ label, value, color }) => (
                      <div key={label} style={{ padding: "12px", backgroundColor: "#f9fafb", borderRadius: "8px", textAlign: "center" }}>
                        <div style={{ fontSize: "22px", fontWeight: "800", color }}>{value}</div>
                        <div style={{ fontSize: "11px", color: "#6b7280" }}>{label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Zone badge */}
                  <div style={{ padding: "8px 14px", backgroundColor: zoneBg[getZone(selectedStudent)], border: `1px solid ${zoneBorder[getZone(selectedStudent)]}`, borderRadius: "6px", marginBottom: "16px", fontSize: "13px", fontWeight: "600", color: zoneColors[getZone(selectedStudent)] }}>
                    {zoneLabels[getZone(selectedStudent)]}
                  </div>

                  {/* Exam history - collapsible by term */}
                  {selectedStudent.exam_history.length > 0 && (
                    <ExamHistorySection examHistory={selectedStudent.exam_history} marksThreshold={marksThreshold} />
                  )}
                </>
              ) : (
                <>
                  <div style={{ fontSize: "15px", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>🚨 At Risk Students</div>
                  <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "12px" }}>Click a dot on the map to inspect any student</div>
                  {atRisk.length === 0 ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#22c55e", fontWeight: "700" }}>✅ No at-risk students!</div>
                  ) : (
                    atRisk.map(s => (
                      <div key={s.adm} onClick={() => setSelectedStudent(s)} style={{ padding: "10px 12px", borderRadius: "8px", marginBottom: "6px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = "#fee2e2"}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = "#fef2f2"}>
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "14px", color: "#111827" }}>{s.name}</div>
                          <div style={{ fontSize: "11px", color: "#6b7280" }}>{s.adm}</div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "700" }}>Att: {s.attendance_pct}%</div>
                          <div style={{ fontSize: "12px", color: "#ef4444", fontWeight: "700" }}>Marks: {s.avg_marks_pct}%</div>
                        </div>
                        <span style={{ color: trendColor(s.trend), fontWeight: "bold", fontSize: "16px" }}>{trendIcon(s.trend)}</span>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </div>

          {/* FULL STUDENT TABLE */}
          <div className="card-glass" style={{ backgroundColor: "white", overflow: "hidden" }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#111827" }}>All Students — Class {classStd} {division}</div>
            </div>
            <table className="print-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#f9fafb" }}>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "700" }}>#</th>
                  <th style={{ padding: "10px 16px", textAlign: "left", fontSize: "12px", color: "#6b7280", fontWeight: "700" }}>Name</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: "12px", color: "#6b7280", fontWeight: "700" }}>Attendance</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: "12px", color: "#6b7280", fontWeight: "700" }}>Avg Marks</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: "12px", color: "#6b7280", fontWeight: "700" }}>Exams</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: "12px", color: "#6b7280", fontWeight: "700" }}>Trend</th>
                  <th style={{ padding: "10px 16px", textAlign: "center", fontSize: "12px", color: "#6b7280", fontWeight: "700" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const renderRow = (s, idx) => {
                    const zone = getZone(s);
                    return (
                      <tr key={s.adm} onClick={() => setSelectedStudent(s)}
                        style={{ borderBottom: "1px solid #f9fafb", cursor: "pointer", transition: "background 0.15s" }}
                        onMouseOver={e => e.currentTarget.style.backgroundColor = "#f9fafb"}
                        onMouseOut={e => e.currentTarget.style.backgroundColor = "white"}>
                        <td style={{ padding: "10px 16px", color: "#9ca3af", fontSize: "13px" }}>{idx + 1}</td>
                        <td style={{ padding: "10px 16px", fontWeight: "600", fontSize: "14px", color: "#111827" }}>{s.name}</td>
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                            <div style={{ width: "60px", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${s.attendance_pct}%`, backgroundColor: s.attendance_pct >= attThreshold ? "#22c55e" : "#ef4444", borderRadius: "3px" }} />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: s.attendance_pct >= attThreshold ? "#22c55e" : "#ef4444" }}>{s.attendance_pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}>
                            <div style={{ width: "60px", height: "6px", backgroundColor: "#f1f5f9", borderRadius: "3px", overflow: "hidden" }}>
                              <div style={{ height: "100%", width: `${s.avg_marks_pct}%`, backgroundColor: s.avg_marks_pct >= marksThreshold ? "#22c55e" : "#ef4444", borderRadius: "3px" }} />
                            </div>
                            <span style={{ fontSize: "12px", fontWeight: "700", color: s.avg_marks_pct >= marksThreshold ? "#22c55e" : "#ef4444" }}>{s.avg_marks_pct}%</span>
                          </div>
                        </td>
                        <td style={{ padding: "10px 16px", textAlign: "center", fontSize: "13px", color: "#6b7280" }}>{s.exam_count}</td>
                        <td style={{ padding: "10px 16px", textAlign: "center", fontSize: "16px", fontWeight: "bold", color: trendColor(s.trend) }}>{trendIcon(s.trend)}</td>
                        <td style={{ padding: "10px 16px", textAlign: "center" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "20px", fontSize: "11px", fontWeight: "700", backgroundColor: zoneBg[zone], color: zoneColors[zone], border: `1px solid ${zoneBorder[zone]}` }}>
                            {zoneLabels[zone]}
                          </span>
                        </td>
                      </tr>
                    );
                  };
                  const boys = students.filter(s => s.gender === "Male");
                  const girls = students.filter(s => s.gender === "Female");
                  return (
                    <>
                      {boys.length > 0 && (
                        <tr><td colSpan="7" style={{ padding: "8px 16px", backgroundColor: "#EFF6FF", color: "#1e40af", fontWeight: "700", fontSize: "12px", borderBottom: "1px solid #BFDBFE" }}>
                          👦 Boys ({boys.length})
                        </td></tr>
                      )}
                      {boys.map((s, idx) => renderRow(s, idx))}
                      {girls.length > 0 && (
                        <tr><td colSpan="7" style={{ padding: "8px 16px", backgroundColor: "#FDF2F8", color: "#9d174d", fontWeight: "700", fontSize: "12px", borderBottom: "1px solid #FBCFE8" }}>
                          👧 Girls ({girls.length})
                        </td></tr>
                      )}
                      {girls.map((s, idx) => renderRow(s, idx))}
                    </>
                  );
                })()}
              </tbody>
            </table>
          </div>
        </>
      )}

      {!loading && students.length === 0 && (
        <div style={{ textAlign: "center", padding: "80px", color: "#6b7280" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>📊</div>
          <div style={{ fontWeight: "700" }}>No student data found for this class.</div>
        </div>
      )}
    </div>
  );
}

export default Analytics;