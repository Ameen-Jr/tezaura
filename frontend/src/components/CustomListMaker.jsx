import React, { useState, useEffect } from 'react';
import API_BASE from '../config';

function CustomListMaker() {
  // State for Filters
  const [classStd, setClassStd] = useState("10");
  const [division, setDivision] = useState("A");
  
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
          <h1 style={{ textAlign: "center", margin: "0 0 10px 0" }}>Universal Trust</h1>
          <h3 style={{ textAlign: "center", margin: "0", color: "#555" }}>
              Class: {classStd} {division ? `(Div ${division})` : ""} | Date: _______________
          </h3>
      </div>

      {/* --- CONTROLS (Hidden when printing) --- */}
      <div className="no-print">
          <h2 style={{ color: "#2c3e50" }}>📋 Custom List Generator</h2>
          <p style={{ color: "#7f8c8d" }}>Create blank checklists for funds, field trips, or data collection.</p>

          <div className="card-glass" style={{ padding: "20px", background: "#f8f9fa", border: "1px solid #e9ecef", marginBottom: "20px" }}>
            
            {/* Selectors */}
            <div style={{ display: "flex", gap: "20px", marginBottom: "20px", alignItems: "center" }}>
                <div>
                    <label style={{ fontWeight: "bold", marginRight: "10px" }}>Class:</label>
                    <select value={classStd} onChange={(e) => setClassStd(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }}>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontWeight: "bold", marginRight: "10px" }}>Division:</label>
                    <select value={division} onChange={(e) => setDivision(e.target.value)} style={{ padding: "8px", borderRadius: "4px" }}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                    </select>
                </div>
            </div>

            {/* Add Column Input */}
            <div style={{ display: "flex", gap: "10px", alignItems: "center", borderTop: "1px solid #ddd", paddingTop: "20px" }}>
                <input 
                    type="text" 
                    placeholder="Enter Column Name (e.g. Amount)" 
                    value={newColName}
                    onChange={(e) => setNewColName(e.target.value)}
                    style={{ padding: "10px", width: "250px", border: "1px solid #ccc", borderRadius: "4px" }}
                />
                <button onClick={addColumn} style={{ padding: "10px 20px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                    + Add Column
                </button>
            </div>

            {/* Active Columns */}
            <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {columns.map((col, index) => (
                    <div key={index} style={{ padding: "5px 15px", backgroundColor: "#e0f2fe", color: "#0369a1", borderRadius: "20px", display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
                        {col}
                        <span onClick={() => removeColumn(index)} style={{ cursor: "pointer", color: "red", fontWeight: "bold" }}>×</span>
                    </div>
                ))}
            </div>

            {/* Print Button */}
            <div style={{ marginTop: "20px", textAlign: "right" }}>
                <button onClick={() => window.print()} style={{ padding: "12px 25px", backgroundColor: "#2c3e50", color: "white", border: "none", borderRadius: "4px", cursor: "pointer", fontWeight: "bold" }}>
                    🖨️ Print List
                </button>
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
            .main-content { margin-left: 0 !important; padding: 0 !important; }
            body { background: white !important; }
            .card-glass { box-shadow: none !important; border: none !important; }

            /* --- BOLD BORDERS FOR PRINT --- */
            table { border-collapse: collapse !important; width: 100%; }
            th, td { 
                border: 2px solid black !important; 
                color: black !important;
            }
            th { background-color: #eee !important; -webkit-print-color-adjust: exact; }
        }
      `}</style>

    </div>
  );
}

export default CustomListMaker;