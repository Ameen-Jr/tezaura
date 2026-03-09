import React, { useState, useEffect } from 'react';
import API_BASE from '../config';

function ReportsDashboard({ onViewProfile }) {
  const [reportType, setReportType] = useState("index"); 
  const [classStd, setClassStd] = useState("10"); 
  const [division, setDivision] = useState("");
  const [month, setMonth] = useState("December");
  const [year, setYear] = useState(new Date().getFullYear().toString()); 
  const [session, setSession] = useState("Day"); // <--- NEW STATE
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  // NEW: Discontinued State
  const [discontinuedYears, setDiscontinuedYears] = useState([]);
  const [selectedDiscYear, setSelectedDiscYear] = useState("");

  // --- INTERACTIVE HIGHLIGHT STATE ---
  const [hoveredDay, setHoveredDay] = useState(null);
  const [hoveredStudent, setHoveredStudent] = useState(null);
  
  // Alumni State
  const [alumniYears, setAlumniYears] = useState([]);
  const [selectedGradYear, setSelectedGradYear] = useState("");

  const months = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];

  useEffect(() => {
    if (reportType === "alumni") {
        fetch(`${API_BASE}/alumni/years`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setAlumniYears(data);
                    if (data.length > 0) setSelectedGradYear(data[0]);
                }
            })
            .catch(err => console.error("Alumni Year Fetch Error:", err));
    }
    else if (reportType === "discontinued") {
        fetch(`${API_BASE}/reports/discontinued-years`)
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setDiscontinuedYears(data);
                    if (data.length > 0) setSelectedDiscYear(data[0]);
                }
            })
            .catch(err => console.error("Fetch Error:", err));
    }
  }, [reportType]);

  const generateReport = async () => {
    setLoading(true);
    setReportData(null); 
    let url = "";
    
    if (reportType === "index") {
        url = `${API_BASE}/reports/index?class_std=${classStd}&division=${division}`;
    } else if (reportType === "pending") {
        url = `${API_BASE}/reports/pending-fees?class_std=${classStd}&month=${month}&division=${division}`;
    } else if (reportType === "attendance") {
        // --- UPDATED: Now includes &session=${session} ---
        // Adds &session=${session} to the end
url = `${API_BASE}/reports/attendance-monthly?class_std=${classStd}&month=${month}&year=${year}&division=${division}&session=${session}`;
    } else if (reportType === "alumni") {
        url = `${API_BASE}/alumni/list?year=${selectedGradYear}`;
    }
    else if (reportType === "discontinued") {
        url = `${API_BASE}/reports/discontinued-list?year=${selectedDiscYear}`;
    }

    try {
        const res = await fetch(url);
        const data = await res.json();
        
        if (res.ok) {
            setReportData(data);
        } else {
            alert(`Error: ${data.detail || "Failed to load report"}`);
        }
    } catch (err) {
        console.error("Connection Error:", err);
        alert("Connection Error. Is the backend running?");
    }
    setLoading(false);
  };

  const handleStudentClick = async (adm) => {
    try {
        const res = await fetch(`${API_BASE}/students/lookup/${adm}`);
        if (res.ok) {
            const fullStudent = await res.json();
            onViewProfile(fullStudent);
        } else {
            alert("Error: Profile not found.");
        }
    } catch (err) { alert("Connection Error"); }
  };

  const calculateTotalPending = () => {
    if (!reportData || !reportData.defaulters) return 0;
    return reportData.defaulters.reduce((sum, student) => sum + student.total_due, 0);
  };

  const daysInMonth = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'));

  return (
    <div style={{ width: "98%", margin: "0 auto", padding: "10px", fontFamily: "sans-serif" }}>
      
      {/* HEADER */}
      <div className="print-only">
          <h1>Universal Trust</h1>
          <p>Education & Learning Centre</p>
          <hr style={{ margin: "10px 0", borderTop: "1px solid #000" }} />
          <h3 style={{ textAlign: "center", margin: "10px 0" }}>
              {reportType === "attendance" ? `Attendance Report (${session}): ${month} ${year}` : 
               reportType === "pending" ? `Pending Fees: ${month}` : 
               "Student Report"}
          </h3>
      </div>

      <h2 className="no-print" style={{ textAlign: "center", color: "#2c3e50", marginBottom: "10px" }}>📊 Class Reports</h2>

      {/* CONTROLS */}
      <div className="no-print card-glass" style={{ display: "flex", gap: "10px", padding: "15px", flexWrap: "wrap", alignItems: "center", marginBottom: "15px", backgroundColor: "#f8f9fa" }}>
        
        <select value={reportType} onChange={(e) => {setReportType(e.target.value); setReportData(null);}} style={{ padding: "8px", borderRadius: "4px" }}>
            <option value="index">Index Report</option>
            <option value="pending">Pending Fee Report</option>
            <option value="attendance">Monthly Attendance</option>
            <option value="alumni">🎓 Alumni Batch List</option>
            <option value="discontinued">🚫 Discontinued Students</option>
        </select>
        
       

        {reportType === "alumni" ? (
            <select value={selectedGradYear} onChange={(e) => setSelectedGradYear(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }}>
                {alumniYears.map(y => <option key={y} value={y}>Batch {y}</option>)}
            </select>
        ) : reportType === "discontinued" ? (
            <select value={selectedDiscYear} onChange={(e) => setSelectedDiscYear(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }}>
                {discontinuedYears.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
        ) : (
            
            <>
                <select value={classStd} onChange={(e) => setClassStd(e.target.value)} style={{ padding: "8px", width: "80px", borderRadius: "4px" }}>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                </select>

                <select value={division} onChange={(e) => setDivision(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }}>
                    <option value="">All / None</option>
                    <option value="A">Division A</option>
                    <option value="B">Division B</option>
                    <option value="C">Division C</option>
                </select>
            </>
        )}

        {(reportType === "pending" || reportType === "attendance") && (
    <>
        <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        
        {/* NEW: Year Selector to fix the 2025/2026 issue */}
        <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: "8px", borderRadius: "4px", width: "80px" }}>
            <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
            <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
        </select>
    </>
)}

        {/* --- NEW: SESSION SELECTOR (Only for Attendance) --- */}
        {reportType === "attendance" && (
            <select 
                value={session} 
                onChange={(e) => setSession(e.target.value)} 
                style={{ 
                    padding: "8px", borderRadius: "4px", fontWeight: "bold",
                    backgroundColor: session === "Night" ? "#1f2937" : "white",
                    color: session === "Night" ? "white" : "black"
                }}
            >
                <option value="Day">☀️ Day</option>
                <option value="Night">🌙 Night</option>
            </select>
        )}

        <button onClick={generateReport} style={{ padding: "8px 15px", backgroundColor: "#2980b9", color: "white", border: "none", cursor: "pointer", borderRadius: "4px" }}>
            {loading ? "Loading..." : "Generate"}
        </button>

        {reportData && (
            <button onClick={() => window.print()} style={{ padding: "8px 15px", backgroundColor: "#34495e", color: "white", border: "none", cursor: "pointer", marginLeft: "auto", borderRadius: "4px" }}>
                🖨️ Print
            </button>
        )}
      </div>

        {/* --- EMPTY STATE: LIVE ANALYTICS ANIMATION (NEW) --- */}
      {!reportData && !loading && (
        <div className="card-glass" style={{ 
            marginTop: "40px", 
            padding: "60px", 
            textAlign: "center", 
            background: "linear-gradient(135deg, #ffffff 0%, #f3f4f6 100%)",
            border: "1px solid #fff", 
            borderRadius: "15px",
            display: "flex", 
            flexDirection: "column", 
            alignItems: "center", 
            justifyContent: "center",
            minHeight: "300px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)"
        }}>
            <style>{`
                .growth-container { display: flex; align-items: flex-end; gap: 12px; height: 120px; position: relative; }
                .g-bar { width: 20px; background: linear-gradient(to top, #3b82f6, #60a5fa); border-radius: 4px 4px 0 0; animation: bounce-growth 2s ease-in-out infinite; opacity: 0.8; position: relative; }
                .g-bar::after { content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 3px; background: #bfdbfe; box-shadow: 0 0 10px #3b82f6; }
                
                .gb1 { height: 40%; animation-delay: 0s; }
                .gb2 { height: 70%; animation-delay: 0.3s; background: linear-gradient(to top, #10b981, #34d399); }
                .gb3 { height: 50%; animation-delay: 0.1s; }
                .gb4 { height: 90%; animation-delay: 0.4s; background: linear-gradient(to top, #8b5cf6, #a78bfa); }
                .gb5 { height: 60%; animation-delay: 0.2s; }
                
                @keyframes bounce-growth {
                    0% { transform: scaleY(0.5); opacity: 0.6; }
                    50% { transform: scaleY(1.1); opacity: 1; }
                    100% { transform: scaleY(0.5); opacity: 0.6; }
                }
                
                .trend-pulse {
                    position: absolute; top: -40px; right: -20px;
                    padding: 5px 15px; background: #dcfce7; color: #166534;
                    border-radius: 20px; font-weight: bold; font-size: 12px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.05);
                    animation: float-pulse 3s infinite ease-in-out;
                }
                @keyframes float-pulse { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
            `}</style>
            
            <div style={{ position: "relative" }}>
                <div className="growth-container">
                    <div className="g-bar gb1"></div>
                    <div className="g-bar gb2"></div>
                    <div className="g-bar gb3"></div>
                    <div className="g-bar gb4"></div>
                    <div className="g-bar gb5"></div>
                </div>
                <div className="trend-pulse">📈 Live Data Ready</div>
            </div>

            <h3 style={{ marginTop: "30px", color: "#374151" }}>Analytics Dashboard</h3>
            <p style={{ color: "#6b7280", maxWidth: "400px", lineHeight: "1.5" }}>
                Select a report type above to view real-time student performance, fee tracking, and attendance metrics.
            </p>
        </div>
      )}

      {/* RESULTS AREA */}
      <div style={{ marginTop: "10px" }}>
        
        {/* REPORT 1: INDEX */}
        {reportType === "index" && reportData && reportData.boys && (
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                 <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <h3>Total Strength: <span style={{ color: "#e67e22" }}>{reportData.total_students}</span></h3>
                </div>
                <div style={{ display: "flex", gap: "20px" }}>
                    <div style={{ flex: 1, backgroundColor: "white", padding: "15px", border: "1px solid #ddd" }}>
                        <h3 style={{ color: "#1565c0", textAlign: "center" }}>👦 Boys ({reportData.boys.length})</h3>
                        <ul style={{ paddingLeft: "0", listStyleType: "none" }}>
                            {reportData.boys.map((s, idx) => (
                                <li key={s.adm} className="animate-row" style={{ borderBottom: "1px solid #f0f0f0", padding: "8px",
        animationDelay: `${idx * 0.05}s` }}>
                                    <span onClick={() => handleStudentClick(s.adm)} style={{ cursor: "pointer", color: "#2c3e50" }}>{idx+1}. {s.name}</span> 
                                    <small style={{ marginLeft: "10px", color: "#999" }}>({s.school})</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div style={{ flex: 1, backgroundColor: "white", padding: "15px", border: "1px solid #ddd" }}>
                        <h3 style={{ color: "#c2185b", textAlign: "center" }}>👧 Girls ({reportData.girls.length})</h3>
                        <ul style={{ paddingLeft: "0", listStyleType: "none" }}>
                            {reportData.girls.map((s, idx) => (
                                <li key={s.adm} className="animate-row" style={{ borderBottom: "1px solid #f0f0f0", padding: "8px",
        animationDelay: `${idx * 0.05}s` }}>
                                    <span onClick={() => handleStudentClick(s.adm)} style={{ cursor: "pointer", color: "#2c3e50" }}>{idx+1}. {s.name}</span> 
                                    <small style={{ marginLeft: "10px", color: "#999" }}>({s.school})</small>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        )}

        {/* REPORT 2: PENDING FEES */}
        {reportType === "pending" && reportData && reportData.defaulters && (
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <h3 style={{ color: "#c0392b", textAlign: "center" }}>Total Pending: ₹{calculateTotalPending()}</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
                    <thead>
                        <tr style={{borderBottom: "2px solid #ddd", textAlign: "left"}}>
                            <th style={{padding: "10px"}}>Student</th>
                            <th style={{padding: "10px"}}>Missing Months</th>
                            <th style={{padding: "10px"}}>Due</th>
                        </tr>
                    </thead>
                    <tbody>
    {reportData.defaulters.map((d, idx) => ( // <--- Ensure 'idx' is here
        <tr 
            key={d.adm} 
            className="animate-row" // <--- ADD THIS
            style={{
                borderBottom: "1px solid #eee",
                animationDelay: `${idx * 0.05}s` // <--- ADD THIS
            }}
        >
            <td style={{padding: "10px"}}>{d.name} <small>({d.adm})</small></td>
            <td style={{padding: "10px", color: "#e74c3c"}}>{d.pending_months.join(", ")}</td>
            <td style={{padding: "10px", fontWeight: "bold"}}>₹{d.total_due}</td>
        </tr>
    ))}
</tbody>
                </table>
            </div>
        )}

        {/* --- REPORT 3: HIGH DENSITY COMPACT ATTENDANCE --- */}
        {reportType === "attendance" && reportData && Array.isArray(reportData.students) && (
            <div style={{ backgroundColor: "white", borderRadius: "8px", border: "1px solid #e5e7eb", overflow: "hidden" }}>
                
                {/* 1. SUMMARY HEADER */}
                <div style={{display: "flex", gap: "20px", padding: "10px 15px", backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb", alignItems:"center"}}>
                    <div style={{ fontSize: "14px", fontWeight: "bold", color: "#374151" }}>CLASS SUMMARY ({session}):</div>
                    <div style={{padding: "5px 15px", backgroundColor: "#ECFDF5", color: "#065F46", borderRadius: "15px", fontWeight: "bold", border: "1px solid #A7F3D0", fontSize: "13px"}}>
                        📅 Working Days: {reportData.total_class_days}
                    </div>
                    <div style={{padding: "5px 15px", backgroundColor: "#EFF6FF", color: "#1E40AF", borderRadius: "15px", fontWeight: "bold", border: "1px solid #BFDBFE", fontSize: "13px"}}>
                        📈 Avg %: {reportData.class_percentage}%
                    </div>
                </div>

                {/* 2. FULL-SCREEN FIXED TABLE */}
                <div style={{ width: "100%" }}>
                    <table style={{ 
                        width: "100%", 
                        borderCollapse: "collapse", 
                        fontSize: "10px",   
                        tableLayout: "fixed" 
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: "#1f2937", color: "white" }}>
                                <th style={{ 
                                    padding: "8px", textAlign: "left", width: "15%", 
                                    position: "sticky", left: 0, backgroundColor: "#1f2937", 
                                    borderRight: "1px solid #374151", zIndex: 20
                                }}>
                                    STUDENT NAME
                                </th>
                                {daysInMonth.map(day => (
                                    <th 
                                        key={day} 
                                        style={{ 
                                            textAlign: "center", padding: "8px 0", cursor: "default",
                                            backgroundColor: hoveredDay === day ? "#374151" : "transparent"
                                        }}
                                        onMouseEnter={() => setHoveredDay(day)}
                                        onMouseLeave={() => setHoveredDay(null)}
                                    >
                                        {parseInt(day)}
                                    </th>
                                ))}
                                <th style={{ width: "3%", backgroundColor: "#065F46" }}>P</th>
                                <th style={{ width: "3%", backgroundColor: "#991B1B" }}>A</th>
                                <th style={{ width: "4%", backgroundColor: "#1E40AF" }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.students.map((student, idx) => (
                                <tr 
                                    key={student.adm} 
                                    className="animate-row"
                                    style={{ 
                                        borderBottom: "1px solid #f3f4f6",
                                        backgroundColor: hoveredStudent === student.adm ? "#f3f4f6" : "white",
                                        height: "30px",
                                        animationDelay: `${idx * 0.03}s`
                                    }}
                                    onMouseEnter={() => setHoveredStudent(student.adm)}
                                    onMouseLeave={() => setHoveredStudent(null)}
                                >
                                    {/* STICKY NAME COLUMN */}
                                    <td style={{ 
                                        padding: "0 8px", fontWeight: "600", color: "#1f2937",
                                        position: "sticky", left: 0, 
                                        backgroundColor: hoveredStudent === student.adm ? "#f3f4f6" : "white",
                                        borderRight: "1px solid #e5e7eb", zIndex: 10,
                                        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis"
                                    }}>
                                        <span onClick={() => handleStudentClick(student.adm)} style={{ cursor: "pointer" }}>
                                            {idx + 1}. {student.name}
                                        </span>
                                    </td>

                                    {/* ATTENDANCE CELLS */}
                                    {daysInMonth.map(day => {
                                        const dayInt = parseInt(day);
                                        const status = student.attendance ? student.attendance[dayInt] : null;
                                        const isCrosshair = hoveredDay === day || hoveredStudent === student.adm;
                                        
                                        let cellColor = isCrosshair ? "#f9fafb" : "white";
                                        let textColor = "#E5E7EB"; 
                                        let symbol = "·"; 

                                        if (status === "P") {
                                            cellColor = isCrosshair ? "#D1FAE5" : "#ECFDF5";
                                            textColor = "#059669";
                                            symbol = "●";
                                        } else if (status === "A") {
                                            cellColor = isCrosshair ? "#FEE2E2" : "#FEF2F2";
                                            textColor = "#DC2626";
                                            symbol = "✖";
                                        }

                                        return (
                                            <td 
                                                key={day} 
                                                style={{ 
                                                    textAlign: "center", borderRight: "1px solid #f9fafb",
                                                    backgroundColor: cellColor, color: textColor,
                                                    fontWeight: "bold", fontSize: "11px", padding: 0
                                                }}
                                                onMouseEnter={() => {setHoveredDay(day); setHoveredStudent(student.adm);}}
                                                onMouseLeave={() => {setHoveredDay(null); setHoveredStudent(null);}}
                                            >
                                                {symbol}
                                            </td>
                                        );
                                    })}

                                    {/* STATS COLUMNS */}
                                    <td style={{ textAlign: "center", fontWeight: "bold", color: "#059669", backgroundColor: "#ECFDF5", borderLeft: "2px solid #e5e7eb" }}>
                                        {student.present_days}
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: "bold", color: "#DC2626", backgroundColor: "#FEF2F2" }}>
                                        {reportData.total_class_days - student.present_days}
                                    </td>
                                    <td style={{ textAlign: "center", fontWeight: "bold", color: student.percentage < 75 ? "#DC2626" : "#1D4ED8" }}>
                                        {student.percentage}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* REPORT 4: ALUMNI LIST */}
        {reportType === "alumni" && reportData && Array.isArray(reportData) && (
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <h3 style={{ borderBottom: "2px solid #2c3e50", paddingBottom: "10px" }}>🎓 SSLC Batch {selectedGradYear} Alumni</h3>
                {reportData.length === 0 ? <p>No records found.</p> : (
                    <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
                        <thead>
                            <tr style={{ background: "#f8f9fa", textAlign: "left" }}>
                                <th style={{ padding: "12px" }}>Sl No</th>
                                <th style={{ padding: "12px" }}>Name</th>
                                <th style={{ padding: "12px" }}>Class</th>
                                <th style={{ padding: "12px" }}>School</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reportData.map((s, idx) => (
                                <tr key={s.adm} className="animate-row" style={{ borderBottom: "1px solid #eee", animationDelay: `${idx * 0.05}s` }}>
                                    <td style={{ padding: "12px" }}>{idx + 1}</td>
                                    <td style={{ padding: "12px" }}>
                                        <span onClick={() => handleStudentClick(s.adm)} style={{ fontWeight: "bold", cursor: "pointer", color: "#2980b9" }}>
                                            {s.name}
                                        </span>
                                    </td>
                                    <td style={{ padding: "12px" }}>{s.class} {s.div}</td>
                                    <td style={{ padding: "12px", color: "#666" }}>{s.school}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        )}

        {/* REPORT 5: DISCONTINUED LIST (NEW) */}
        {reportType === "discontinued" && reportData && Array.isArray(reportData) && (
            <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                <h3 style={{ borderBottom: "2px solid #c0392b", paddingBottom: "10px", color: "#c0392b" }}>🚫 Discontinued Students ({selectedDiscYear})</h3>
                <table style={{ width: "100%", borderCollapse: "collapse", backgroundColor: "white" }}>
                    <thead>
                        <tr style={{ background: "#FEF2F2", textAlign: "left" }}>
                            <th style={{ padding: "12px", color: "#991B1B" }}>Sl No</th>
                            <th style={{ padding: "12px", color: "#991B1B" }}>Name</th>
                            <th style={{ padding: "12px", color: "#991B1B" }}>Class</th>
                            <th style={{ padding: "12px", color: "#991B1B" }}>School</th>
                            <th style={{ padding: "12px", color: "#991B1B" }}>Date Left</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reportData.map((s, idx) => (
                            <tr key={s.adm} className="animate-row" style={{ borderBottom: "1px solid #eee", animationDelay: `${idx * 0.05}s` }}>
                                <td style={{ padding: "12px" }}>{idx + 1}</td>
                                <td style={{ padding: "12px" }}>
                                    <span onClick={() => handleStudentClick(s.adm)} style={{ fontWeight: "bold", cursor: "pointer", color: "#c0392b" }}>
                                        {s.name}
                                    </span>
                                </td>
                                <td style={{ padding: "12px" }}>{s.class} {s.div}</td>
                                <td style={{ padding: "12px", color: "#666" }}>{s.school}</td>
                                <td style={{ padding: "12px", fontWeight: "bold" }}>{s.date}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}

      </div>
    </div>
  );
}

export default ReportsDashboard;