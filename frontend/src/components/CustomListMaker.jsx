import React, { useState, useEffect } from 'react';
import API_BASE from '../config';

function CustomListMaker() {
    // State for Filters
    const [classStd, setClassStd] = useState("10");
    const [division, setDivision] = useState("");
    const [listTitle, setListTitle] = useState("");

    // State for Data
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);

    // State for Custom Columns
    const [columns, setColumns] = useState([]);
    const [newColName, setNewColName] = useState("");

    // --- FETCH STUDENTS ---
    useEffect(() => {
        const fetchStudents = async () => {
            setLoading(true);
            try {
                const res = await fetch(`${API_BASE}/reports/index?class_std=${classStd}&division=${division}`);
                const data = await res.json();

                if (res.ok) {
                    const list = [...(data.boys || []), ...(data.girls || [])];
                    list.sort((a, b) => a.name.localeCompare(b.name));
                    setStudents(list);
                } else {
                    setStudents([]);
                }
            } catch (err) { console.error("Fetch error", err); }
            setLoading(false);
        };

        fetchStudents();
    }, [classStd, division]);

    // --- COLUMN HANDLERS ---
    const addColumn = () => {
        if (newColName.trim() !== "") {
            setColumns([...columns, newColName]);
            setNewColName("");
        }
    };

    const removeColumn = (indexToRemove) => {
        setColumns(columns.filter((_, index) => index !== indexToRemove));
    };

    return (
        <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>

            {/* --- HEADER FOR PRINT --- */}
            <div className="print-header" style={{ display: "none" }}>
                <h1 style={{ textAlign: "center", margin: "0 0 6px 0", fontSize: "20px" }}>Universal Trust, Kunnuvazhy</h1>
                <h2 style={{ textAlign: "center", margin: "0 0 4px 0", fontSize: "16px" }}>
                    {listTitle || "Student List"}
                </h2>
                <p style={{ textAlign: "center", margin: "0", fontSize: "13px", color: "#555" }}>
                    Class: {classStd}{division ? ` — Division ${division}` : ""} &nbsp;|&nbsp; Date: _______________  &nbsp;|&nbsp; Total: {students.length}
                </p>
                <hr style={{ margin: "10px 0", borderTop: "2px solid #000" }} />
            </div>

            {/* --- CONTROLS (Hidden when printing) --- */}
            <div className="no-print">
                <style>{`
                    .cl-pill-btn { padding:9px 20px; border-radius:30px; font-size:14px; font-weight:700; border:2px solid rgba(255,255,255,0.2); cursor:pointer; transition:all 0.2s; background:rgba(255,255,255,0.08); color:rgba(255,255,255,0.7); }
                    .cl-pill-btn.active { background:rgba(255,255,255,0.95); color:#0f172a; border-color:white; box-shadow:0 4px 12px rgba(0,0,0,0.3); }
                    .cl-pill-btn:hover:not(.active) { border-color:rgba(255,255,255,0.5); color:white; }
                    .col-tag { padding:8px 16px; background:linear-gradient(135deg,#667eea,#764ba2); color:white; border-radius:20px; display:flex; align-items:center; gap:8px; font-weight:700; font-size:13px; box-shadow:0 4px 12px rgba(102,126,234,0.3); }
                    .col-tag-x { cursor:pointer; background:rgba(255,255,255,0.25); border-radius:50%; width:18px; height:18px; display:flex; align-items:center; justify-content:center; font-size:11px; transition:background 0.2s; }
                    .col-tag-x:hover { background:rgba(255,255,255,0.5); }
                `}</style>

                {/* HEADER */}
                <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                    <div style={{ width: "50px", height: "50px", borderRadius: "16px", background: "linear-gradient(135deg,#0f172a,#1e3a5f)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", boxShadow: "0 6px 20px rgba(15,23,42,0.3)" }}>📋</div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "#0f172a" }}>Custom List Generator</h2>
                        <p style={{ margin: 0, fontSize: "13px", color: "#64748b" }}>Build printable checklists for funds, trips, or data collection</p>
                    </div>
                </div>

                <div style={{ background: "linear-gradient(135deg,#0f172a 0%,#1e3a5f 100%)", borderRadius: "20px", padding: "28px", marginBottom: "24px", boxShadow: "0 10px 30px rgba(15,23,42,0.25)" }}>

                    {/* Title Input */}
                    <div style={{ marginBottom: "20px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>List Title</div>
                        <input
                            type="text"
                            placeholder="e.g. Trip Fund Collection, Book Fee, July Attendance..."
                            value={listTitle}
                            onChange={(e) => setListTitle(e.target.value)}
                            style={{ width: "100%", padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: "15px", fontWeight: "600", outline: "none", boxSizing: "border-box" }}
                        />
                    </div>

                    {/* Class & Division Row */}
                    <div style={{ display: "flex", gap: "20px", alignItems: "flex-end", flexWrap: "wrap", marginBottom: "24px" }}>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Class</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {["8", "9", "10"].map(c => (
                                    <button key={c} className={`cl-pill-btn ${classStd === c ? "active" : ""}`} onClick={() => setClassStd(c)}>Class {c}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>Division</div>
                            <div style={{ display: "flex", gap: "8px" }}>
                                {[{ label: "All", val: "" }, { label: "A", val: "A" }, { label: "B", val: "B" }, { label: "C", val: "C" }].map(d => (
                                    <button key={d.val} className={`cl-pill-btn ${division === d.val ? "active" : ""}`} onClick={() => setDivision(d.val)}>{d.label}</button>
                                ))}
                            </div>
                        </div>
                        <div style={{ marginLeft: "auto" }}>
                            <button onClick={() => {
                                const prev = document.title;
                                const title = listTitle || `Class ${classStd}${division ? ` ${division}` : ""} List`;
                                document.title = title;
                                window.print();
                                document.title = prev;
                            }} style={{ padding: "12px 28px", background: "linear-gradient(135deg,#00c2ff,#0080ff)", color: "white", border: "none", borderRadius: "12px", cursor: "pointer", fontWeight: "800", fontSize: "14px", boxShadow: "0 4px 15px rgba(0,194,255,0.4)" }}>
                                🖨️ Print List
                            </button>
                        </div>
                    </div>

                    {/* Column Builder */}
                    <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: "20px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>Add Columns</div>
                        <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "14px" }}>
                            <input
                                type="text"
                                placeholder="e.g. Amount, Signature, Received..."
                                value={newColName}
                                onChange={(e) => setNewColName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && addColumn()}
                                style={{ flex: 1, padding: "12px 16px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.08)", color: "white", fontSize: "14px", outline: "none" }}
                            />
                            <button onClick={addColumn} style={{ padding: "12px 22px", background: "rgba(255,255,255,0.15)", color: "white", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "12px", cursor: "pointer", fontWeight: "700", fontSize: "14px", whiteSpace: "nowrap" }}>
                                + Add
                            </button>
                        </div>
                        {columns.length > 0 && (
                            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                                {columns.map((col, index) => (
                                    <div key={index} className="col-tag">
                                        {col}
                                        <span className="col-tag-x" onClick={() => removeColumn(index)}>✕</span>
                                    </div>
                                ))}
                            </div>
                        )}
                        {columns.length === 0 && (
                            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "13px", fontStyle: "italic" }}>No columns yet — add one above to get started</div>
                        )}
                    </div>
                </div>
            </div>

            {/* --- PREVIEW / PRINT TABLE --- */}
            <div className="card-glass" style={{ padding: "0", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#34495e", color: "white" }}>
                            <th style={{ padding: "12px", border: "1px solid #2c3e50", width: "50px" }}>#</th>
                            <th style={{ padding: "12px", border: "1px solid #2c3e50", textAlign: "left" }}>Student Name</th>
                            {columns.map((col, index) => (
                                <th key={index} style={{ padding: "12px", border: "1px solid #2c3e50", minWidth: "120px" }}>{col}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={2 + columns.length} style={{ padding: "20px", textAlign: "center" }}>Loading...</td></tr>
                        ) : (
                            students.map((student, index) => (
                                <tr key={student.id}>
                                    <td style={{ padding: "12px", border: "1px solid #ccc", textAlign: "center" }}>{index + 1}</td>
                                    <td style={{ padding: "12px", border: "1px solid #ccc", fontWeight: "bold" }}>{student.name}</td>
                                    {columns.map((_, i) => (
                                        <td key={i} style={{ padding: "12px", border: "1px solid #ccc" }}></td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* --- CSS STYLES --- */}
            <style>{`
        @media print {
            .no-print { display: none !important; }
            .print-header { display: block !important; }
            .sidebar { display: none !important; }
            .main-content { margin-left: 0 !important; padding: 10px !important; }
            body { background: white !important; }
            .card-glass { box-shadow: none !important; border: none !important; border-radius: 0 !important; }

            table { border-collapse: collapse !important; width: 100% !important; font-size: 12pt; }
            th {
                background-color: #1e293b !important;
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
                padding: 10px 12px !important;
                border: 1px solid #1e293b !important;
                font-weight: bold;
                text-align: center !important;
            }
            th:nth-child(2) { text-align: left !important; }
            td {
                border: 1px solid #94a3b8 !important;
                padding: 9px 12px !important;
                color: black !important;
            }
            td:first-child { text-align: center !important; color: #64748b !important; font-size: 11pt; }
            tr:nth-child(even) td { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            tr:last-child td { border-bottom: 2px solid #1e293b !important; }
        }
      `}</style>

        </div>
    );
}

export default CustomListMaker;