import React, { useState, useEffect } from 'react';
import InteractiveFace from './InteractiveFace';
import SafeLottie from './SafeLottie';
import successAnim from './success gif.json';
import API_BASE from '../config';

function AttendanceSheet() {
  const [classStd, setClassStd] = useState("10");
  const [division, setDivision] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [session, setSession] = useState("Day"); // NEW: Night Shift Support
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [acadYear, setAcadYear] = useState("...");

  // --- 1. FETCH STUDENTS ---
  useEffect(() => {
    fetchStudents();
  }, [classStd, division, date, session]);

  useEffect(() => {
  fetch(`${API_BASE}/settings/academic-year`)
    .then(res => res.json())
    .then(data => setAcadYear(data.academic_year || "2025-26"))
    .catch(() => setAcadYear("2025-26"));
}, []);

  const fetchStudents = async () => {
    setLoading(true);
    setMessage(""); // Clear any previous error on each fetch attempt
    try {
      // Get student list (Now includes School Name)
      const res1 = await fetch(`${API_BASE}/reports/index?class_std=${classStd}&division=${division}`);
      const data1 = await res1.json();
      let allStudents = [...(data1.boys || []), ...(data1.girls || [])].sort((a,b) => a.name.localeCompare(b.name));

      // Get existing status
      const monthName = new Date(date).toLocaleString('default', { month: 'long' });
      const yearStr = date.split("-")[0];
      const dayStr = parseInt(date.split("-")[2]); // Remove leading zeros

      // Fetch report for this specific Session (Day/Night)
      const res2 = await fetch(`${API_BASE}/reports/attendance-monthly?class_std=${classStd}&month=${monthName}&year=${yearStr}&session=${session}`);
      const data2 = await res2.json();

      const merged = allStudents.map(s => {
          const record = data2.students ? data2.students.find(r => r.adm === s.adm) : null;
          let currentStatus = "Present";
          
          // Check if today is marked
          if (record && record.attendance && record.attendance[dayStr]) {
              currentStatus = record.attendance[dayStr] === "P" ? "Present" : "Absent";
          }
          return { ...s, status: currentStatus };
      });
      setStudents(merged);
    } catch (err) {
      console.error(err);
      setMessage("❌ Could not load students. Please check that the server is running.");
    }
    setLoading(false);
  };

  const toggleStatus = (id) => {
    setStudents(students.map(s => 
        s.id === id ? { ...s, status: s.status === "Present" ? "Absent" : "Present" } : s
    ));
  };

  const saveAttendance = async () => {
    const payload = {
        date: date,
        session: session, // Send Session info
        records: students.map(s => ({ student_id: s.id, status: s.status }))
    };
    try {
        const res = await fetch(`${API_BASE}/attendance`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000); // Hide animation after 2 seconds
        }
    } catch (err) { setMessage("❌ Connection Error"); }
  };

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif", animation: "fadeIn 0.5s" }}>
      
      {/* Updated to remove gaps using negative margins */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "-30px", marginTop: "-20px" }}>
        <div>
            <h2 style={{ color: "#111827", margin: 0 }}>📅 Attendance Register</h2>
            <p style={{ color: "#6B7280", margin: "5px 0 0" }}>Mark daily attendance.</p>
        </div>
        
        {/* --- NEW: MASCOT + BADGE CONTAINER --- */}
        <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            
            {/* 1. The Mascot (Cropped to fit) */}
            <div style={{ 
                width: "170px", // Much Larger
                height: "170px", 
                borderRadius: "50%", 
                overflow: "hidden", 
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
            }}>
                <div style={{ width: "100%", height: "100%" }}>
                    <InteractiveFace />
                </div>
            </div>

            {/* 2. The Original Badge */}
            <div style={{ backgroundColor: "#EEF2FF", padding: "8px 15px", borderRadius: "20px", color: "#4F46E5", fontWeight: "bold", border: "1px solid #C7D2FE", fontSize: "14px" }}>
                Academic Year {acadYear}
            </div>
        </div>
      </div>

      {message && <div style={{ padding: "12px", backgroundColor: "#D1FAE5", color: "#065F46", borderRadius: "8px", marginBottom: "20px", textAlign: "center", fontWeight: "bold" }}>{message}</div>}

      {/* --- CONTROLS SECTION --- */}
      <div className="card-glass" style={{ padding: "20px", display: "flex", gap: "20px", alignItems: "center", marginBottom: "20px", backgroundColor: "#F9FAFB" }}>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#374151" }}>Select Class</label>
            <select value={classStd} onChange={(e) => setClassStd(e.target.value)} style={{ padding: "10px", width: "100px", border: "1px solid #D1D5DB", borderRadius: "6px" }}>
                <option value="8">8</option>
                <option value="9">9</option>
                <option value="10">10</option>
            </select>
          </div>

          {/* --- DIVISION SELECTOR (Updated) --- */}
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#374151" }}>Division</label>
            <select value={division} onChange={(e) => setDivision(e.target.value)} style={{ padding: "10px", width: "100px", border: "1px solid #D1D5DB", borderRadius: "6px" }}>
                <option value="">All / None</option> {/* <--- THIS WAS MISSING */}
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
            </select>
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#374151" }}>Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ padding: "8px", border: "1px solid #D1D5DB", borderRadius: "6px" }} />
          </div>
          <div>
            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#374151" }}>Session</label>
            <select value={session} onChange={(e) => setSession(e.target.value)} style={{ padding: "10px", width: "120px", border: "1px solid #D1D5DB", borderRadius: "6px", backgroundColor: session==="Night"?"#1f2937":"white", color: session==="Night"?"white":"black" }}>
                <option value="Day">☀️ Day</option>
                <option value="Night">🌙 Night</option>
            </select>
          </div>
          <button onClick={fetchStudents} style={{ height: "38px", marginTop: "18px", padding: "0 20px", backgroundColor: "#1F2937", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}>🔄 Load List</button>
      </div>

      {/* --- ATTENDANCE TABLE --- */}
      <div className="card-glass" style={{ padding: "0", backgroundColor: "white", overflow: "hidden" }}>
        {loading ? <p style={{ textAlign: "center", padding: "30px", color: "#6B7280" }}>⏳ Fetching student list...</p> : (
            <>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "20px", borderBottom: "1px solid #E5E7EB", backgroundColor: "#fff" }}>
                    <h3 style={{ margin: 0, color: "#111827" }}>Class {classStd} Roll Call ({session})</h3>
                    <div style={{ fontWeight: "bold", color: "#4F46E5" }}>Total: {students.length}</div>
                </div>

                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ backgroundColor: "#F9FAFB" }}>
                        <tr>
                            {/* SWAPPED COLUMNS HERE */}
                            <th style={{ padding: "15px", textAlign: "left", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>Student Name</th>
                            <th style={{ padding: "15px", textAlign: "left", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>School</th>
                            <th style={{ padding: "15px", textAlign: "center", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>Status</th>
                            <th style={{ padding: "15px", textAlign: "center", color: "#6B7280", borderBottom: "1px solid #E5E7EB" }}>Action</th>
                        </tr>
                    </thead>
                    <tbody>
    {/* BOYS SECTION */}
    {students.filter(s => s.gender === "Male").length > 0 && (
        <tr>
            <td colSpan="4" style={{ padding: "8px 15px", backgroundColor: "#EFF6FF", color: "#1e40af", fontWeight: "bold", fontSize: "13px", borderBottom: "1px solid #BFDBFE" }}>
                👦 Boys ({students.filter(s => s.gender === "Male").length})
            </td>
        </tr>
    )}
    {students.filter(s => s.gender === "Male").map((student, index) => (
        <tr 
            key={student.id} 
            onClick={() => toggleStatus(student.id)}
            style={{ 
                borderBottom: "1px solid #F3F4F6", 
                cursor: "pointer", 
                backgroundColor: index % 2 === 0 ? "white" : "#FAFAFA",
                transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F3F4F6"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#FAFAFA"}
        >
            <td style={{ padding: "15px", fontWeight: "600", color: "#111827", fontSize: "16px" }}>{student.name}</td>
            <td style={{ padding: "15px", color: "#4B5563" }}>{student.school || "-"}</td>
            <td style={{ padding: "15px", textAlign: "center" }}>
                <span style={{ 
                    padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
                    backgroundColor: student.status === "Present" ? "#ECFDF5" : "#FEF2F2",
                    color: student.status === "Present" ? "#047857" : "#B91C1C",
                    border: `1px solid ${student.status === "Present" ? "#A7F3D0" : "#FECACA"}`
                }}>
                    {student.status.toUpperCase()}
                </span>
            </td>
            <td style={{ padding: "15px", textAlign: "center" }}>
                <button style={{ 
                    padding: "5px 15px", cursor: "pointer", borderRadius: "5px", border: "none",
                    backgroundColor: student.status === "Present" ? "#EF4444" : "#10B981",
                    color: "white", fontSize: "12px"
                }}>
                    Mark {student.status === "Present" ? "Absent" : "Present"}
                </button>
            </td>
        </tr>
    ))}

    {/* GIRLS SECTION */}
    {students.filter(s => s.gender === "Female").length > 0 && (
        <tr>
            <td colSpan="4" style={{ padding: "8px 15px", backgroundColor: "#FDF2F8", color: "#9d174d", fontWeight: "bold", fontSize: "13px", borderBottom: "1px solid #FBCFE8", marginTop: "10px" }}>
                👧 Girls ({students.filter(s => s.gender === "Female").length})
            </td>
        </tr>
    )}
    {students.filter(s => s.gender === "Female").map((student, index) => (
        <tr 
            key={student.id} 
            onClick={() => toggleStatus(student.id)}
            style={{ 
                borderBottom: "1px solid #F3F4F6", 
                cursor: "pointer", 
                backgroundColor: index % 2 === 0 ? "white" : "#FAFAFA",
                transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#F3F4F6"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? "white" : "#FAFAFA"}
        >
            <td style={{ padding: "15px", fontWeight: "600", color: "#111827", fontSize: "16px" }}>{student.name}</td>
            <td style={{ padding: "15px", color: "#4B5563" }}>{student.school || "-"}</td>
            <td style={{ padding: "15px", textAlign: "center" }}>
                <span style={{ 
                    padding: "6px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold",
                    backgroundColor: student.status === "Present" ? "#ECFDF5" : "#FEF2F2",
                    color: student.status === "Present" ? "#047857" : "#B91C1C",
                    border: `1px solid ${student.status === "Present" ? "#A7F3D0" : "#FECACA"}`
                }}>
                    {student.status.toUpperCase()}
                </span>
            </td>
            <td style={{ padding: "15px", textAlign: "center" }}>
                <button style={{ 
                    padding: "5px 15px", cursor: "pointer", borderRadius: "5px", border: "none",
                    backgroundColor: student.status === "Present" ? "#EF4444" : "#10B981",
                    color: "white", fontSize: "12px"
                }}>
                    Mark {student.status === "Present" ? "Absent" : "Present"}
                </button>
            </td>
        </tr>
    ))}
</tbody>
                </table>

                {students.length > 0 && (
                    <div style={{ padding: "20px", borderTop: "1px solid #E5E7EB", backgroundColor: "#F9FAFB" }}>
                        <button onClick={saveAttendance} style={{ width: "100%", padding: "15px", background: "linear-gradient(to right, #4F46E5, #6366F1)", color: "white", border: "none", fontSize: "16px", fontWeight: "bold", borderRadius: "10px", cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.3)" }}>
                            💾 Save {session} Attendance
                        </button>
                    </div>
                )}
            </>
        )}
      </div>

        {/* --- SUCCESS ANIMATION MODAL --- */}
      {showSuccess && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: 'white',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
          }}>
            <div style={{ width: '200px', height: '200px', margin: '0 auto' }}>
              <SafeLottie animationData={successAnim} />
            </div>
            <h2 style={{ color: '#27ae60', margin: '20px 0 0 0' }}>Attendance Saved!</h2>
          </div>
        </div>
      )}

    </div>
  );
}

export default AttendanceSheet;