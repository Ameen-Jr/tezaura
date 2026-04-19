import React, { useState, useEffect } from 'react';
import API_BASE from '../config';

function AttendanceReport() {
    const [classStd, setClassStd] = useState("10");
    const [month, setMonth] = useState("December");
    const [session, setSession] = useState("Day");
    const [data, setData] = useState(null);
    const [error, setError] = useState(null); // Store errors
    const [loading, setLoading] = useState(false);

    // Highlight state
    const [hoveredDay, setHoveredDay] = useState(null);

    const months = [
        "April", "May", "June", "July", "August", "September",
        "October", "November", "December", "January", "February", "March"
    ];
    const [year, setYear] = useState(new Date().getFullYear().toString());

    useEffect(() => {
        fetchReport();
    }, [classStd, month, session]);

    const fetchReport = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${API_BASE}/reports/attendance-monthly?class_std=${classStd}&month=${month}&year=${year}&session=${session}`);
            const result = await res.json();

            // Safety Check: Did the server return an error?
            if (!res.ok) {
                throw new Error(result.detail || "Server Error");
            }

            setData(result);
        } catch (err) {
            console.error("Report Error:", err);
            setError(err.message);
            setData(null);
        }
        setLoading(false);
    };

    // Generate 1-31 Days array
    const days = Array.from({ length: 31 }, (_, i) => i + 1);

    return (
        <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "100%", overflowX: "auto" }}>

            {/* HEADER CONTROLS */}
            <div className="no-print" style={{ display: "flex", gap: "15px", alignItems: "center", marginBottom: "20px", backgroundColor: "#f3f4f6", padding: "15px", borderRadius: "8px" }}>
                <h2 style={{ margin: 0, fontSize: "20px", marginRight: "auto" }}>📊 Monthly Report</h2>

                <select value={classStd} onChange={(e) => setClassStd(e.target.value)} style={{ padding: "8px", borderRadius: "5px" }}>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                </select>

                <select value={month} onChange={(e) => setMonth(e.target.value)} style={{ padding: "8px", borderRadius: "5px" }}>
                    {months.map(m => <option key={m}>{m}</option>)}
                </select>

                <select value={year} onChange={(e) => setYear(e.target.value)} style={{ padding: "8px", borderRadius: "5px", width: "80px" }}>
                    <option value={new Date().getFullYear() - 1}>{new Date().getFullYear() - 1}</option>
                    <option value={new Date().getFullYear()}>{new Date().getFullYear()}</option>
                </select>

                <select value={session} onChange={(e) => setSession(e.target.value)} style={{ padding: "8px", borderRadius: "5px", backgroundColor: session === "Night" ? "#1f2937" : "white", color: session === "Night" ? "white" : "black" }}>
                    <option value="Day">☀️ Day Report</option>
                    <option value="Night">🌙 Night Report</option>
                </select>

                <button onClick={() => {
                    const prev = document.title;
                    document.title = `Class ${classStd} ${session} Attendance ${month} ${year}`;
                    window.print();
                    document.title = prev;
                }} style={{ padding: "8px 15px", backgroundColor: "#374151", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>🖨️ Print</button>
            </div>

            {/* ERROR MESSAGE (Prevents White Screen) */}
            {error && (
                <div style={{ padding: "20px", backgroundColor: "#FEE2E2", color: "#B91C1C", border: "1px solid #FECACA", borderRadius: "8px", textAlign: "center", fontWeight: "bold" }}>
                    ⚠️ Error loading report: {error}
                    <br />
                    <small style={{ fontWeight: "normal" }}>Try restarting the backend server or checking the database.</small>
                </div>
            )}

            {loading && <p style={{ textAlign: "center", padding: "20px", color: "#6B7280" }}>⏳ Loading data...</p>}

            {/* STATS HEADER */}
            {data && !error && (
                <div style={{ display: "flex", gap: "20px", marginBottom: "20px" }}>
                    <div style={{ padding: "15px", backgroundColor: "#ECFDF5", border: "1px solid #10B981", borderRadius: "8px", flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "12px", color: "#065F46", textTransform: "uppercase", fontWeight: "bold" }}>Total Working Days</div>
                        <div style={{ fontSize: "24px", color: "#047857", fontWeight: "bold" }}>{data.total_class_days || 0} Days</div>
                    </div>
                    <div style={{ padding: "15px", backgroundColor: "#EFF6FF", border: "1px solid #3B82F6", borderRadius: "8px", flex: 1, textAlign: "center" }}>
                        <div style={{ fontSize: "12px", color: "#1E40AF", textTransform: "uppercase", fontWeight: "bold" }}>Class Attendance</div>
                        <div style={{ fontSize: "24px", color: "#1D4ED8", fontWeight: "bold" }}>{data.class_percentage || 0}%</div>
                    </div>
                </div>
            )}

            {/* FULL SCREEN TABLE */}
            {data && data.students && !error && (
                <div style={{ border: "1px solid #e5e7eb", borderRadius: "8px", overflow: "hidden" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", tableLayout: "fixed" }}>
                        <thead>
                            <tr style={{ backgroundColor: "#1f2937", color: "white" }}>
                                <th style={{ width: "200px", padding: "10px", textAlign: "left", position: "sticky", left: 0, backgroundColor: "#1f2937", zIndex: 10 }}>Student Name</th>
                                {days.map(d => (
                                    <th
                                        key={d}
                                        style={{
                                            padding: "5px 0",
                                            textAlign: "center",
                                            backgroundColor: hoveredDay === d ? "#374151" : "transparent",
                                            transition: "background 0.2s"
                                        }}
                                        onMouseEnter={() => setHoveredDay(d)}
                                        onMouseLeave={() => setHoveredDay(null)}
                                    >
                                        {d}
                                    </th>
                                ))}
                                <th style={{ width: "60px", padding: "5px" }}>Total</th>
                                <th style={{ width: "60px", padding: "5px" }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.students.map((student, idx) => (
                                <tr
                                    key={idx}
                                    style={{ borderBottom: "1px solid #e5e7eb", backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb" }}
                                >
                                    <td style={{
                                        padding: "8px 10px", fontWeight: "bold", borderRight: "1px solid #e5e7eb",
                                        position: "sticky", left: 0, backgroundColor: idx % 2 === 0 ? "white" : "#f9fafb", zIndex: 5,
                                        color: hoveredDay ? "#111827" : "#374151"
                                    }}>
                                        {student.name}
                                    </td>

                                    {days.map(d => {
                                        // Safe access to attendance object
                                        const status = (student.attendance || {})[d];
                                        let bgColor = "transparent";
                                        let content = "";

                                        if (status === "P") {
                                            bgColor = "#d1fae5";
                                            content = "✔";
                                        } else if (status === "A") {
                                            bgColor = "#fee2e2";
                                            content = "✖";
                                        }

                                        return (
                                            <td
                                                key={d}
                                                style={{
                                                    textAlign: "center",
                                                    backgroundColor: hoveredDay === d ? "#e5e7eb" : bgColor,
                                                    color: status === "P" ? "green" : (status === "A" ? "red" : "#ddd"),
                                                    borderRight: "1px solid #f3f4f6",
                                                    cursor: "default"
                                                }}
                                                onMouseEnter={() => setHoveredDay(d)}
                                                onMouseLeave={() => setHoveredDay(null)}
                                            >
                                                {content}
                                            </td>
                                        );
                                    })}

                                    <td style={{ textAlign: "center", fontWeight: "bold", borderLeft: "2px solid #e5e7eb" }}>{student.present_days}</td>
                                    <td style={{ textAlign: "center", fontWeight: "bold", color: student.percentage < 75 ? "red" : "green" }}>{student.percentage}%</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default AttendanceReport;