import React, { useState, useEffect } from 'react';
import SafeLottie from './SafeLottie';
import examAnim from './examAnim.json';
import API_BASE from '../config';

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
  // Term Exam State
    const [termExamName, setTermExamName] = useState("");
    const [termExamDate, setTermExamDate] = useState("");
    const [termSubjects, setTermSubjects] = useState([]);
    const [groupedExams, setGroupedExams] = useState([]);
    const [activeTermExam, setActiveTermExam] = useState(null);
    const [marksheetData, setMarksheetData] = useState([]);
    const [marksheetSortBy, setMarksheetSortBy] = useState("name");
    const [splitGender, setSplitGender] = useState(false);
    const [selectedTermExams, setSelectedTermExams] = useState([]);
    const [isSelectMode, setIsSelectMode] = useState(false);

  const fetchExams = async () => {
    try {      
      const res = await fetch(`${API_BASE}/exams?class_std=${classStd}&division=${division}`);
      const data = await res.json();
      setExams(data);
    } catch (err) { console.error(err); }
  };

  const getDefaultSubjects = (cls) => {
    if (cls === "8") {
        return [
            { subject_name: "LAN-I",  max_marks: 40, sort_order: 0 },
            { subject_name: "LAN-II", max_marks: 40, sort_order: 1 },
            { subject_name: "ENG",    max_marks: 40, sort_order: 2 },
            { subject_name: "HINDI",  max_marks: 40, sort_order: 3 },
            { subject_name: "PHY",    max_marks: 20, sort_order: 4 },
            { subject_name: "CHE",    max_marks: 20, sort_order: 5 },
            { subject_name: "BIO",    max_marks: 20, sort_order: 6 },
            { subject_name: "SS",     max_marks: 40, sort_order: 7 },
            { subject_name: "MATHS",  max_marks: 40, sort_order: 8 },
        ];
    } else {
        return [
            { subject_name: "LAN-I",  max_marks: 40, sort_order: 0 },
            { subject_name: "LAN-II", max_marks: 40, sort_order: 1 },
            { subject_name: "ENG",    max_marks: 80, sort_order: 2 },
            { subject_name: "HINDI",  max_marks: 40, sort_order: 3 },
            { subject_name: "PHY",    max_marks: 40, sort_order: 4 },
            { subject_name: "CHE",    max_marks: 40, sort_order: 5 },
            { subject_name: "BIO",    max_marks: 40, sort_order: 6 },
            { subject_name: "SS",     max_marks: 80, sort_order: 7 },
            { subject_name: "MATHS",  max_marks: 80, sort_order: 8 },
        ];
    }
    };

    const fetchGroupedExams = async () => {
    try {
        const res = await fetch(`${API_BASE}/exams/grouped?class_std=${classStd}&division=${division}`);
        const data = await res.json();
        setGroupedExams(data);
    } catch (err) { console.error(err); }
};

const openTermMarksheet = async (termExam) => {
    setActiveTermExam(termExam);
    setMessage("⏳ Loading marksheet...");
    try {
        // 1. Fetch students for this class & division
        const resStudents = await fetch(`${API_BASE}/reports/index?class_std=${classStd}&division=${division}`);
        const dataStudents = await resStudents.json();
        const classList = [...(dataStudents.boys || []), ...(dataStudents.girls || [])];

        // 2. For each subject (exam_id), fetch existing marks
        const markMap = {}; // { student_id: { exam_id: marks } }
        for (const subj of termExam.subjects) {
            const resMarks = await fetch(`${API_BASE}/exams/${subj.exam_id}/results`);
            const dataMarks = await resMarks.json();
            (dataMarks.results || []).forEach(r => {
                if (!markMap[r.id]) markMap[r.id] = {};
                markMap[r.id][subj.exam_id] = r.marks === 0 ? "" : r.marks;
            });
        }

        // 3. Build marksheet rows
        const rows = classList.map(student => ({
            ...student,
            marks: termExam.subjects.reduce((acc, subj) => {
                acc[subj.exam_id] = markMap[student.id]?.[subj.exam_id] ?? "";
                return acc;
            }, {})
        }));

        rows.sort((a, b) => a.name.localeCompare(b.name));
        setMarksheetData(rows);
        setMarksheetSortBy("name");
        setView("marksheet");
        setMessage("");
    } catch (err) { console.error(err); setMessage("❌ Connection Error"); }
    };

    const handleCreateTermExam = async (e) => {
    e.preventDefault();
    if (!termExamName || !termExamDate) {
        setMessage("⚠️ Please enter exam name and date.");
        return;
    }
    const payload = {
        name: termExamName,
        date: termExamDate,
        class_standard: classStd,
        division: division,
        subjects: termSubjects.map((s, i) => ({ ...s, sort_order: i }))
    };
    try {
        const res = await fetch(`${API_BASE}/exams/term`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });
        if (res.ok) {
            setMessage("✅ Term Exam Created!");
            setView("list");
            fetchExams();
            fetchGroupedExams();
            setTermExamName("");
            setTermExamDate("");
        } else { setMessage("❌ Error creating exam"); }
    } catch (err) { setMessage("❌ Connection Error"); }
    };

    const handleMarksheetChange = (studentId, examId, value) => {
    setMarksheetData(prev => prev.map(s =>
        s.id === studentId
            ? { ...s, marks: { ...s.marks, [examId]: value } }
            : s
    ));
};

const getSortedMarksheet = () => {
    const rows = [...marksheetData];
    if (marksheetSortBy === "name") {
        return rows.sort((a, b) => a.name.localeCompare(b.name));
    } else if (marksheetSortBy === "rank") {
        return rows.sort((a, b) => {
            const totalA = Object.values(a.marks).reduce((s, v) => s + (parseFloat(v) || 0), 0);
            const totalB = Object.values(b.marks).reduce((s, v) => s + (parseFloat(v) || 0), 0);
            return totalB - totalA;
        });
    } else {
        // Sort by specific subject exam_id
        return rows.sort((a, b) => (parseFloat(b.marks[marksheetSortBy]) || 0) - (parseFloat(a.marks[marksheetSortBy]) || 0));
    }
};

const submitMarksheet = async () => {
    const records = [];
    marksheetData.forEach(student => {
        Object.entries(student.marks).forEach(([examId, marks]) => {
            records.push({
                student_id: student.id,
                exam_id: parseInt(examId),
                marks_obtained: marks === "" ? 0 : parseFloat(marks)
            });
        });
    });
    try {
        const res = await fetch(`${API_BASE}/marks/bulk`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ records })
        });
        if (res.ok) {
            setMessage("✅ Marksheet Saved!");
            setTimeout(() => setView("list"), 1000);
        } else { setMessage("❌ Save failed"); }
    } catch (err) { setMessage("❌ Connection Error"); }
    };

    const handleDeleteTermExams = async () => {
    if (selectedTermExams.length === 0) return;
    const confirmed = window.confirm(
        `⚠️ Delete ${selectedTermExams.length} selected exam(s)?\n\nThis will permanently remove all marks entered for these exams. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
        // Collect all exam_ids from selected term exam names
        const examIdsToDelete = [];
        groupedExams.forEach(termExam => {
            if (selectedTermExams.includes(termExam.name)) {
                termExam.subjects.forEach(s => examIdsToDelete.push(s.exam_id));
            }
        });

        // Delete each exam_id (existing DELETE endpoint handles marks cleanup)
        await Promise.all(examIdsToDelete.map(id =>
            fetch(`${API_BASE}/exams/${id}`, { method: "DELETE" })
        ));

        setMessage(`🗑️ ${selectedTermExams.length} exam(s) deleted.`);
        setSelectedTermExams([]);
        setIsSelectMode(false);
        fetchGroupedExams();
    } catch (err) {
        setMessage("❌ Error deleting exams.");
    }
    };

    const toggleTermExamSelection = (name) => {
    setSelectedTermExams(prev =>
        prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
    };

  useEffect(() => {
    fetchExams();
    fetchGroupedExams();
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
      const res = await fetch(`${API_BASE}/exams`, {
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
      const resStudents = await fetch(`${API_BASE}/reports/index?class_std=${classStd}&division=${division}`);
      const dataStudents = await resStudents.json();    
      // 2. Fetch marks for the exam (even if it returns everyone)
      const resMarks = await fetch(`${API_BASE}/exams/${exam.id}/results`);
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
      const res = await fetch(`${API_BASE}/marks`, {
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

  const handleDeleteExam = async (exam) => {
    const confirmed = window.confirm(
        `⚠️ Delete "${exam.name}" (${exam.subject})?\n\nThis will permanently remove the exam AND all entered marks. This cannot be undone.`
    );
    if (!confirmed) return;

    try {
        const res = await fetch(`${API_BASE}/exams/${exam.id}`, {
            method: "DELETE"
        });
        if (res.ok) {
            setMessage(`🗑️ "${exam.name}" deleted successfully.`);
            // Also deselect it from the rank checkboxes if it was selected
            setSelectedExamIds(prev => prev.filter(id => id !== exam.id));
            fetchExams();
        } else {
            setMessage("❌ Failed to delete exam.");
        }
    } catch (err) {
        setMessage("❌ Connection error during delete.");
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
        const resStudents = await fetch(`${API_BASE}/reports/index?class_std=${classStd}&division=${division}`);
        const dataStudents = await resStudents.json();
        
        // 2. Fetch the Rank Report (might return everyone)
        const resRank = await fetch(`${API_BASE}/reports/overall-rank`, {
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
    <div style={{ maxWidth: view === "marksheet" ? "100%" : "900px", margin: "0 auto", padding: view === "marksheet" ? "20px 40px" : "20px", fontFamily: "sans-serif" }}>
      
      <div className="print-header">
          <h1>Universal Trust</h1>
          {view === "marksheet" && activeTermExam ? (
    <p style={{ fontSize: "12pt" }}>Class: {classStd} {division ? ` - ${division}` : ""} | {activeTermExam.name}</p>
) : (
    <>
        <p>{view === "overall" ? "Overall Academic Performance" : `Exam Result: ${selectedExam?.name}`}</p>
        <p style={{ fontSize: "12pt" }}>Class: {classStd} {division ? ` - ${division}` : ""} | Generated: {new Date().toLocaleDateString()}</p>
    </>
)}
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
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <label><strong>Division:</strong></label>
                        <select value={division} onChange={(e) => setDivision(e.target.value)} style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc" }}>
                            <option value="">All</option>
                            <option value="A">A</option>
                            <option value="B">B</option>
                            <option value="C">C</option>
                        </select>
                    </div>
                <button onClick={() => { setTermSubjects(getDefaultSubjects(classStd)); setView("create-term"); }} style={{ padding: "8px 15px", backgroundColor: "#27ae60", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>+ New Exam</button>
            </div>
        </div>
      )}

      {message && <div className="no-print" style={{ textAlign: "center", padding: "10px", backgroundColor: "#fff3cd", marginBottom: "15px", borderRadius: "5px" }}>{message}</div>}


      {/* TERM EXAM GROUPED CARDS */}
      {view === "list" && groupedExams.length > 0 && (
    <div style={{ marginTop: "30px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #3498db", paddingBottom: "8px", marginBottom: "20px" }}>
            <h3 style={{ color: "#2c3e50", margin: 0 }}>📋 Term Exams</h3>
            <div style={{ display: "flex", gap: "10px" }}>
                {isSelectMode && selectedTermExams.length > 0 && (
                    <button onClick={handleDeleteTermExams} style={{ padding: "6px 14px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                        🗑️ Delete ({selectedTermExams.length})
                    </button>
                )}
                <button onClick={() => { setIsSelectMode(!isSelectMode); setSelectedTermExams([]); }}
                    style={{ padding: "6px 14px", backgroundColor: isSelectMode ? "#95a5a6" : "#34495e", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                    {isSelectMode ? "Cancel" : "✂️ Select"}
                </button>
            </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
            {groupedExams.map((termExam, index) => {
                const isSelected = selectedTermExams.includes(termExam.name);
                return (
                    <div key={index} className="card-glass" onClick={() => isSelectMode && toggleTermExamSelection(termExam.name)}
                        style={{ padding: "20px", borderLeft: `5px solid ${isSelected ? "#e74c3c" : "#8e44ad"}`, outline: isSelected ? "2px solid #e74c3c" : "none", cursor: isSelectMode ? "pointer" : "default", backgroundColor: isSelected ? "#fff5f5" : "white", transition: "all 0.15s ease" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <h3 style={{ margin: "0 0 5px 0", color: "#2c3e50" }}>{termExam.name}</h3>
                            {isSelectMode && (
                                <div style={{ width: "20px", height: "20px", borderRadius: "50%", border: "2px solid #e74c3c", backgroundColor: isSelected ? "#e74c3c" : "white", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                    {isSelected && <span style={{ color: "white", fontSize: "12px" }}>✓</span>}
                                </div>
                            )}
                        </div>
                        <p style={{ margin: "0 0 8px 0", fontSize: "12px", color: "#95a5a6" }}>📅 {termExam.date}</p>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "5px", marginBottom: "12px" }}>
                            {termExam.subjects.map(s => (
                                <span key={s.exam_id} style={{ backgroundColor: "#f0e6ff", color: "#6c3483", padding: "2px 8px", borderRadius: "10px", fontSize: "12px" }}>
                                    {s.subject} / {s.max_marks}
                                </span>
                            ))}
                        </div>
                        {!isSelectMode && (
                            <button onClick={() => openTermMarksheet(termExam)} style={{ width: "100%", padding: "8px", cursor: "pointer", backgroundColor: "#8e44ad", color: "white", border: "none", borderRadius: "4px" }}>
                                🗂️ Open Marksheet
                            </button>
                        )}
                    </div>
                );
            })}
        </div>
    </div>
    )}


                {/* VIEW: CREATE TERM EXAM */}
{view === "create-term" && (
    <div className="card-glass" style={{ maxWidth: "650px", margin: "0 auto", padding: "30px" }}>
        <h3>📋 Create Term Exam</h3>
        <form onSubmit={handleCreateTermExam} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input placeholder="Exam Name (e.g. Christmas Exam 2025)" value={termExamName} onChange={e => setTermExamName(e.target.value)} required style={{ padding: "10px" }} />
            <input type="date" value={termExamDate} onChange={e => setTermExamDate(e.target.value)} required style={{ padding: "10px" }} />

            <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <strong>Subjects & Max Marks</strong>
                    <button type="button" onClick={() => setTermSubjects([...termSubjects, { subject_name: "", max_marks: 40, sort_order: termSubjects.length }])}
                        style={{ padding: "4px 10px", backgroundColor: "#2980b9", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>+ Add Subject</button>
                </div>
                {termSubjects.map((subj, index) => (
                    <div key={index} style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
                        <input
                            placeholder="Subject name"
                            value={subj.subject_name}
                            onChange={e => setTermSubjects(termSubjects.map((s, i) => i === index ? { ...s, subject_name: e.target.value } : s))}
                            style={{ flex: 2, padding: "8px" }}
                        />
                        <input
                            type="number"
                            value={subj.max_marks}
                            onChange={e => setTermSubjects(termSubjects.map((s, i) => i === index ? { ...s, max_marks: parseFloat(e.target.value) } : s))}
                            style={{ flex: 1, padding: "8px" }}
                        />
                        <button type="button" onClick={() => setTermSubjects(termSubjects.filter((_, i) => i !== index))}
                            style={{ padding: "6px 10px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>✕</button>
                    </div>
                ))}
            </div>

            <div style={{ display: "flex", gap: "10px" }}>
                <button type="submit" style={{ flex: 1, padding: "10px", backgroundColor: "#27ae60", color: "white", border: "none" }}>Create Exam</button>
                <button type="button" onClick={() => setView("list")} style={{ flex: 1, padding: "10px", backgroundColor: "#95a5a6", color: "white", border: "none" }}>Cancel</button>
            </div>
        </form>
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

      {/* VIEW: TERM EXAM MARKSHEET */}
{view === "marksheet" && activeTermExam && (
    <div>
        <style>{`
    input[type=number]::-webkit-inner-spin-button, 
    input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    
    @media print {
        table { border-collapse: collapse !important; width: 100% !important; }
        th { 
            background-color: #4a235a !important; 
            color: white !important; 
            border: 2px solid #000 !important; 
            padding: 6px 4px !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }
        td { 
            border: 1.5px solid #555 !important; 
            padding: 5px 4px !important; 
            text-align: center !important;
        }
        td:nth-child(2) { text-align: left !important; }
        input { 
            border: none !important; 
            font-size: 11pt !important;
            width: 100% !important;
            text-align: center !important;
        }
        tr:nth-child(even) td { background-color: #f5f0ff !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        h4 { margin: 8px 0 4px 0 !important; font-size: 11pt !important; }
h4.girls-header { page-break-before: always !important; }
    }
`}</style>
        <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <button onClick={() => setView("list")} style={{ padding: "8px 15px", cursor: "pointer" }}>← Back</button>
                <h3 style={{ margin: 0 }}>🗂️ {activeTermExam.name}</h3>
            </div>
            <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <label style={{ fontWeight: "bold" }}>Sort by:</label>
                <select value={marksheetSortBy} onChange={e => setMarksheetSortBy(e.target.value)} style={{ padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}>
                    <option value="name">Name</option>
                    <option value="rank">Total / Rank</option>
                    {activeTermExam.subjects.map(s => (
                        <option key={s.exam_id} value={s.exam_id}>{s.subject}</option>
                    ))}
                </select>
                <button onClick={() => setSplitGender(!splitGender)} style={{ padding: "8px 15px", backgroundColor: splitGender ? "#8e44ad" : "#bdc3c7", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>
    {splitGender ? "👫 Split: ON" : "👫 Split: OFF"}
</button>
<button onClick={submitMarksheet} style={{ padding: "8px 20px", backgroundColor: "#27ae60", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>💾 Save</button>
                <button onClick={() => window.print()} style={{ padding: "8px 15px", backgroundColor: "#34495e", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>🖨️ Print</button>
            </div>
        </div>

        {(() => {
    const renderTable = (rows, labelOffset = 0) => {
        const maxTotal = activeTermExam.subjects.reduce((s, subj) => s + subj.max_marks, 0);
        return (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "15px", tableLayout: "fixed", marginBottom: "30px" }}>
                <thead>
                    <tr style={{ backgroundColor: "#8e44ad", color: "white" }}>
                        <th style={{ padding: "6px", textAlign: "left", width: "30px" }}>#</th>
                        <th style={{ padding: "6px", textAlign: "left", width: "18%" }}>Student Name</th>
                        {activeTermExam.subjects.map(s => (
                            <th key={s.exam_id} style={{ padding: "6px", textAlign: "center" }}>
                                {s.subject}<br />
                                <span style={{ fontSize: "10px", opacity: 0.8 }}>/{s.max_marks}</span>
                            </th>
                        ))}
                        <th style={{ padding: "6px", textAlign: "center", width: "6%" }}>Total</th>
                        <th style={{ padding: "6px", textAlign: "center", width: "5%" }}>%</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((student, index) => {
                        const total = Object.values(student.marks).reduce((s, v) => s + (parseFloat(v) || 0), 0);
                        const pct = maxTotal > 0 ? ((total / maxTotal) * 100).toFixed(1) : 0;
                        const absIndex = labelOffset + index;
                        return (
                            <tr key={student.id} style={{ borderBottom: "1px solid #eee", backgroundColor: index % 2 === 0 ? "#fafafa" : "white" }}>
                                <td style={{ padding: "8px", color: "#999" }}>{index + 1}</td>
                                <td style={{ padding: "8px", fontWeight: "bold" }}>{student.name}</td>
                                {activeTermExam.subjects.map((subj, subjIndex) => (
                                    <td key={subj.exam_id} style={{ padding: "2px", textAlign: "center" }}>
                                        <input
                                            type="number"
                                            data-row={absIndex}
                                            data-col={subjIndex}
                                            value={student.marks[subj.exam_id]}
                                            onChange={e => handleMarksheetChange(student.id, subj.exam_id, e.target.value)}
                                            onKeyDown={e => {
                                                const totalCols = activeTermExam.subjects.length;
                                                const totalRows = getSortedMarksheet().length;
                                                let row = absIndex, col = subjIndex;
                                                if (e.key === "ArrowRight" || (e.key === "Enter" && !e.shiftKey)) { col = Math.min(col + 1, totalCols - 1); }
                                                else if (e.key === "ArrowLeft") { col = Math.max(col - 1, 0); }
                                                else if (e.key === "ArrowDown") { row = Math.min(row + 1, totalRows - 1); }
                                                else if (e.key === "ArrowUp") { row = Math.max(row - 1, 0); }
                                                else return;
                                                e.preventDefault();
                                                const next = document.querySelector(`input[data-row="${row}"][data-col="${col}"]`);
                                                if (next) next.focus();
                                            }}
                                            style={{ width: "100%", padding: "4px 2px", textAlign: "center", border: "1px solid #ddd", borderRadius: "3px", fontSize: "15px", boxSizing: "border-box", MozAppearance: "textfield", appearance: "textfield" }}
                                            min="0"
                                            max={subj.max_marks}
                                        />
                                    </td>
                                ))}
                                <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold" }}>{total} / {maxTotal}</td>
                                <td style={{ padding: "8px", textAlign: "center", fontWeight: "bold", color: pct >= 50 ? "#27ae60" : "#e74c3c" }}>{pct}%</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        );
    };

    const allRows = getSortedMarksheet();

    if (!splitGender) {
        return <div style={{ width: "100%" }}>{renderTable(allRows, 0)}</div>;
    }

    const boys = allRows.filter(s => s.gender === "Male");
    const girls = allRows.filter(s => s.gender === "Female");

    return (
        <div style={{ width: "100%" }}>
            {boys.length > 0 && (
                <>
                    <h4 style={{ color: "#2980b9", margin: "10px 0 8px 0" }}>👦 Boys ({boys.length})</h4>
                    {renderTable(boys, 0)}
                </>
            )}
            {girls.length > 0 && (
                <>
                    <h4 className="girls-header" style={{ color: "#e91e8c", margin: "10px 0 8px 0" }}>👧 Girls ({girls.length})</h4>
                    {renderTable(girls, boys.length)}
                </>
            )}
        </div>
    );
})()}

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