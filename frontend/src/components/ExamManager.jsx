import React, { useState, useEffect } from 'react';
import SafeLottie from './SafeLottie';
import examAnim from './examAnim.json';

function ExamManager() {
  const [view, setView] = useState("list"); 
  const [classStd, setClassStd] = useState("10");
  const [division, setDivision] = useState("");
  const [exams, setExams] = useState([]);
  const [message, setMessage] = useState("");

  const [newExam, setNewExam] = useState({ name: "", date: "", subject: "", max_marks: "50" });
  const [selectedExam, setSelectedExam] = useState(null);
  const [studentMarks, setStudentMarks] = useState([]); 
  
  // Overall Rank State
  const [selectedExamIds, setSelectedExamIds] = useState([]);
  const [overallRankList, setOverallRankList] = useState([]);

  const fetchExams = async () => {
    try {      
      const res = await fetch(`http://127.0.0.1:8000/exams?class_std=${classStd}&division=${division}`);
      const data = await res.json();
      setExams(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchExams();
    setSelectedExamIds([]); 
  }, [classStd, division]); 

  // --- NEW: Auto-refresh Mark Sheet when Division changes ---
  useEffect(() => {
    if (view === "mark" && selectedExam) {
        openMarking(selectedExam);
    }
  }, [division]);

  const handleCreate = async (e) => {
    e.preventDefault();
    const payload = { ...newExam, class_standard: classStd, max_marks: parseFloat(newExam.max_marks) };
    try {
      const res = await fetch("http://127.0.0.1:8000/exams", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
      });
      if (res.ok) {
        setMessage("✅ Exam Created!");
        setView("list");
        fetchExams();
        setNewExam({ name: "", date: "", subject: "", max_marks: "50" });
      }
    } catch (err) { setMessage("❌ Error creating exam"); }
  };

  const openMarking = async (exam) => {
    setSelectedExam(exam);
    setMessage("⏳ Loading students...");
    try {
      // 1. Fetch correct student list for this Class & Division
      const resStudents = await fetch(`http://127.0.0.1:8000/reports/index?class_std=${classStd}&division=${division}`);
      const dataStudents = await resStudents.json();    
      // 2. Fetch marks for the exam (even if it returns everyone)
      const resMarks = await fetch(`http://127.0.0.1:8000/exams/${exam.id}/results`);
      const dataMarks = await resMarks.json();
      if (resStudents.ok && resMarks.ok) {
        // Flatten the student list (Boys + Girls)
        const classList = [...(dataStudents.boys || []), ...(dataStudents.girls || [])];        
        // Merge Marks into the Class List
        const mergedList = classList.map(student => {
            // Find if this student has a mark entry
            const markEntry = (dataMarks.results || []).find(m => m.student_id === student.id || m.adm === student.adm);
            return {
                ...student,
                // If mark exists, use it. If 0, show empty string. Default to empty.
                marks: markEntry ? (markEntry.marks === 0 ? "" : markEntry.marks) : ""
            };
        });
        mergedList.sort((a, b) => a.name.localeCompare(b.name));
        setStudentMarks(mergedList); 
        setView("mark");
        setMessage("");
      } else { setMessage("❌ Error loading data"); }
    } catch (err) { console.error(err); setMessage("❌ Connection Error"); }
  };

  const handleMarkChange = (studentId, value) => {
    const updated = studentMarks.map(s => s.id === studentId ? { ...s, marks: value } : s);
    setStudentMarks(updated);
  };

  const submitMarks = async () => {
    const records = studentMarks.map(s => ({ 
        student_id: s.id, 
        marks_obtained: (s.marks === "" || s.marks === null) ? 0 : parseFloat(s.marks) 
    }));
    
    try {
      const res = await fetch("http://127.0.0.1:8000/marks", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam_id: selectedExam.id, records: records })
      });
      if (res.ok) {
        setMessage("✅ Marks Saved Successfully!");
        setTimeout(() => setView("list"), 1000);
      }
    } catch (err) { setMessage("❌ Save failed"); }
  };

  const openResult = async (exam) => {
    await openMarking(exam); 
    setView("result");
  };

  const toggleExamSelection = (examId) => {
    if (selectedExamIds.includes(examId)) {
        setSelectedExamIds(selectedExamIds.filter(id => id !== examId));
    } else {
        setSelectedExamIds([...selectedExamIds, examId]);
    }
  };

  const generateOverallRank = async () => {
    if (selectedExamIds.length === 0) {
        setMessage("⚠️ Select at least one exam.");
        return;
    }
    setMessage("⏳ Generating Rank List...");
    try {
        // 1. Fetch valid students for this Division (Source of Truth)
        const resStudents = await fetch(`http://127.0.0.1:8000/reports/index?class_std=${classStd}&division=${division}`);
        const dataStudents = await resStudents.json();
        
        // 2. Fetch the Rank Report (might return everyone)
        const resRank = await fetch("http://127.0.0.1:8000/reports/overall-rank", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ class_standard: classStd, division: division, exam_ids: selectedExamIds })
        });
        const dataRank = await resRank.json();
        if (resStudents.ok && resRank.ok) {
            // Flatten student list to get valid Admission Numbers for this division
            const validStudents = [...(dataStudents.boys || []), ...(dataStudents.girls || [])];
            const validAdms = validStudents.map(s => s.adm); // Array of valid IDs: ["1001", "1005", ...]
            let ranks = Array.isArray(dataRank) ? dataRank : [];
            // 3. Filter Rank List: Only keep students who exist in the Valid Division List
            if (division) {
                 ranks = ranks.filter(r => validAdms.includes(r.adm));
            }
            setOverallRankList(ranks);
            setView("overall");
            setMessage("");
        } else {
            setMessage("❌ Error generating report");
        }
    } catch (err) { console.error(err); setMessage("❌ Connection Error"); }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      
      <div className="print-header">
          <h1>Universal Trust</h1>
          <p>{view === "overall" ? "Overall Academic Performance" : `Exam Result: ${selectedExam?.name}`}</p>
          <p style={{ fontSize: "12pt" }}>Class: {classStd} {division ? ` - ${division}` : ""} | Generated: {new Date().toLocaleDateString()}</p>
      </div>

      {/* --- HEADER WITH ANIMATION --- */}
<div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
    <div>
        <h2 style={{ color: "#2c3e50", margin: 0, fontSize: "28px" }}>Exam & Results Manager</h2>
        <p style={{ margin: "5px 0 0 0", color: "#7f8c8d" }}>Manage exams, marks, and rank lists.</p>
    </div>
    
    {/* Animation placed in the top-right corner */}
    <div style={{ width: "180px", height: "150px", marginRight: "10px" }}>
        <SafeLottie animationData={examAnim} />
    </div>
</div>

      {/* TOP CONTROLS */}
      {view === "list" && (
        <div>
            <div className="no-print card-glass" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", padding: "15px" }}>
                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <label><strong>Class:</strong></label>
                    <select value={classStd} onChange={(e) => setClassStd(e.target.value)} style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}>
                        <option value="8">8</option>
                        <option value="9">9</option>
                        <option value="10">10</option>
                    </select>
                </div>
                {/* REMOVED GLOBAL DIVISION SELECTOR FROM HERE */}
                <button onClick={() => setView("create")} style={{ padding: "8px 15px", backgroundColor: "#27ae60", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>+ New Exam</button>
            </div>
            
            {/* OVERALL RANK SECTION (Updated: Division Selector Added Here) */}
            <div className="no-print card-glass" style={{ backgroundColor: "#e8f6f3", padding: "20px", marginBottom: "20px", border: "1px solid #1abc9c" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <h3 style={{ margin: "0", color: "#16a085" }}>🏆 Generate Overall Rank List</h3>
                    
                    {/* --- DIVISION SELECTOR FOR RANKS --- */}
                    <select value={division} onChange={(e) => setDivision(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #16a085" }}>
                        <option value="">All Divisions</option>
                        <option value="A">Division A</option>
                        <option value="B">Division B</option>
                        <option value="C">Division C</option>
                    </select>
                </div>
                
                <p style={{ margin: "10px 0", fontSize: "14px", color: "#555" }}>Select exams to calculate cumulative rank:</p>
                
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", margin: "10px 0" }}>
                    {exams.length > 0 ? exams.map(exam => (
                        <label key={exam.id} style={{ display: "flex", alignItems: "center", gap: "5px", backgroundColor: "white", padding: "5px 10px", borderRadius: "15px", border: "1px solid #ccc", cursor: "pointer" }}>
                            <input type="checkbox" checked={selectedExamIds.includes(exam.id)} onChange={() => toggleExamSelection(exam.id)} />
                            <span style={{ fontWeight: "bold" }}>
    {exam.name} <span style={{ fontWeight: "normal", color: "#666", fontSize: "0.9em" }}>({exam.subject})</span>
                            </span> 
                        </label>
                    )) : <span style={{ color: "#7f8c8d" }}>No exams available.</span>}
                </div>
                
                <button onClick={generateOverallRank} style={{ padding: "8px 15px", backgroundColor: "#16a085", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>Generate Rank List</button>
            </div>
        </div>
      )}

      {message && <div className="no-print" style={{ textAlign: "center", padding: "10px", backgroundColor: "#fff3cd", marginBottom: "15px", borderRadius: "5px" }}>{message}</div>}

      {/* VIEW 1: EXAM LIST */}
      {view === "list" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "20px" }}>
            {exams.map(exam => (
                <div key={exam.id} className="card-glass" style={{ padding: "20px", borderLeft: "5px solid #3498db" }}>
                    <h3 style={{ margin: "0 0 5px 0" }}>{exam.name}</h3>
                    <p style={{ margin: 0, color: "#7f8c8d" }}>{exam.subject} | Max: {exam.max_marks}</p>
                    <p style={{ fontSize: "12px", color: "#95a5a6" }}>📅 {exam.date}</p>
                    <div style={{ marginTop: "15px", display: "flex", gap: "10px" }}>
                        <button onClick={() => openMarking(exam)} style={{ flex: 1, padding: "5px", cursor: "pointer", backgroundColor: "#f39c12", color: "white", border: "none" }}>🖊 Marks</button>
                        <button onClick={() => openResult(exam)} style={{ flex: 1, padding: "5px", cursor: "pointer", backgroundColor: "#34495e", color: "white", border: "none" }}>📊 Result</button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* VIEW 2: CREATE EXAM FORM */}
      {view === "create" && (
        <div className="card-glass" style={{ maxWidth: "500px", margin: "0 auto", padding: "30px" }}>
            <h3>Create New Exam</h3>
            <form onSubmit={handleCreate} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                <input placeholder="Name (e.g. Unit Test 1)" value={newExam.name} onChange={e => setNewExam({...newExam, name: e.target.value})} required style={{ padding: "10px" }} />
                <input placeholder="Subject" value={newExam.subject} onChange={e => setNewExam({...newExam, subject: e.target.value})} required style={{ padding: "10px" }} />
                <input type="date" value={newExam.date} onChange={e => setNewExam({...newExam, date: e.target.value})} required style={{ padding: "10px" }} />
                <input type="number" placeholder="Max Marks" value={newExam.max_marks} onChange={e => setNewExam({...newExam, max_marks: e.target.value})} required style={{ padding: "10px" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                    <button type="submit" style={{ flex: 1, padding: "10px", backgroundColor: "#27ae60", color: "white" }}>Create</button>
                    <button type="button" onClick={() => setView("list")} style={{ flex: 1, padding: "10px", backgroundColor: "#95a5a6", color: "white" }}>Cancel</button>
                </div>
            </form>
        </div>
      )}

      {/* VIEW 3: ENTER MARKS */}
      {/* VIEW 3: ENTER MARKS */}
      {view === "mark" && selectedExam && (
        <div>
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <h3>🖊 Enter Marks: {selectedExam.name}</h3>
                
                {/* --- NEW: DIVISION SELECTOR FOR MARKING --- */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <label style={{ fontWeight: "bold" }}>Filter:</label>
                    <select value={division} onChange={(e) => setDivision(e.target.value)} style={{ padding: "5px", borderRadius: "4px", border: "1px solid #ccc" }}>
                        <option value="">All Students</option>
                        <option value="A">Division A</option>
                        <option value="B">Division B</option>
                        <option value="C">Division C</option>
                    </select>
                    <button onClick={() => setView("list")} style={{ padding: "5px 10px", cursor: "pointer", marginLeft: "10px" }}>Cancel</button>
                </div>
            </div>
            <div className="card-glass" style={{ padding: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead><tr style={{ textAlign: "left", backgroundColor: "#f9f9f9" }}><th style={{ padding: "10px" }}>Student</th><th style={{ padding: "10px" }}>Marks (Max: {selectedExam.max_marks})</th></tr></thead>
                    <tbody>
                        {studentMarks.map((student, index) => (
                            <tr key={student.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "10px" }}><strong>{student.name}</strong> <span style={{color:"#777"}}>({student.adm})</span></td>
                                <td style={{ padding: "10px" }}>
                                    <input 
                                        id={`mark-input-${index}`}
                                        type="number" 
                                        value={student.marks} 
                                        onChange={(e) => handleMarkChange(student.id, e.target.value)} 
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                const nextInput = document.getElementById(`mark-input-${index + 1}`);
                                                if (nextInput) nextInput.focus();
                                            }
                                        }}
                                        style={{ padding: "8px", width: "80px", border: "1px solid #ccc", borderRadius: "4px" }} 
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button onClick={submitMarks} style={{ marginTop: "20px", width: "100%", padding: "15px", backgroundColor: "#2980b9", color: "white", border: "none", fontSize: "16px", cursor: "pointer" }}>💾 Save All Marks</button>
            </div>
        </div>
      )}

      {/* VIEW 4: INDIVIDUAL EXAM RESULT */}
      {view === "result" && selectedExam && (
        <div>
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <button onClick={() => setView("list")} style={{ padding: "8px 15px", cursor: "pointer" }}>← Back</button>
                <button onClick={() => window.print()} style={{ padding: "8px 20px", backgroundColor: "#34495e", color: "white", border: "none", cursor: "pointer" }}>🖨️ Print Result</button>
            </div>
            <div className="card-glass" style={{ padding: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#34495e", color: "white" }}>
                            <th style={{ padding: "10px", textAlign: "left" }}>Rank</th>
                            <th style={{ padding: "10px", textAlign: "left" }}>Student Name</th>
                            <th style={{ padding: "10px", textAlign: "center" }}>Marks Obtained</th>
                        </tr>
                    </thead>
                    <tbody>
                        {[...studentMarks].sort((a, b) => b.marks - a.marks).map((student, index) => (
                            <tr key={student.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "10px", fontWeight: "bold" }}>{index + 1}</td>
                                <td style={{ padding: "10px" }}>{student.name}</td>
                                <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold" }}>{student.marks || 0} / {selectedExam.max_marks}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* VIEW 5: OVERALL RANK LIST */}
      {view === "overall" && (
        <div>
             <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <button onClick={() => setView("list")} style={{ padding: "8px 15px", cursor: "pointer" }}>← Back</button>
                <button onClick={() => window.print()} style={{ padding: "8px 20px", backgroundColor: "#34495e", color: "white", border: "none", cursor: "pointer" }}>🖨️ Print Rank List</button>
            </div>
            <div className="card-glass" style={{ padding: "20px" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#16a085", color: "white" }}>
                            <th style={{ padding: "10px", textAlign: "left" }}>Rank</th>
                            <th style={{ padding: "10px", textAlign: "left" }}>Student Name</th>
                            <th style={{ padding: "10px", textAlign: "center" }}>Total Marks</th>
                            <th style={{ padding: "10px", textAlign: "center" }}>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {overallRankList.map((student, index) => (
                            <tr key={student.adm} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "10px", fontWeight: "bold" }}>{index + 1}</td>
                                <td style={{ padding: "10px" }}>{student.name}</td>
                                <td style={{ padding: "10px", textAlign: "center" }}>{student.total_obtained} / {student.total_max}</td>
                                <td style={{ padding: "10px", textAlign: "center", fontWeight: "bold", color: "#2c3e50" }}>{student.percentage}%</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

    </div>
  );
}

export default ExamManager;