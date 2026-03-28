import React, { useState, useEffect } from 'react';
import SafeLottie from './SafeLottie';
import bookAnim from './book.json';
import API_BASE from '../config';

function LibraryManager() {
  const [activeTab, setActiveTab] = useState("active"); // 'active' or 'issue'
  const [activeRecords, setActiveRecords] = useState([]);
  const [historyRecords, setHistoryRecords] = useState([]);
  const [message, setMessage] = useState("");

  // Issue Form State
  const [searchQuery, setSearchQuery] = useState(""); // User types name here
  const [searchResults, setSearchResults] = useState([]); // List of matches
  const [selectedStudent, setSelectedStudent] = useState(null); // The chosen student
  
  const [bookName, setBookName] = useState("");
  const [bookId, setBookId] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);

  // Return Modal
  const [returnModal, setReturnModal] = useState(null); 
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

  const [topReaders, setTopReaders] = useState([]);

  // Calculate Top 10 Readers (Current Academic Year: April - March)
  const calculateStats = (records) => {
    const stats = {};
    
    // --- DYNAMIC ACADEMIC YEAR LOGIC ---
    const today = new Date();
    const currentMonth = today.getMonth(); // 0 = Jan, 3 = April
    const currentYear = today.getFullYear();
    
    // If we are in Jan, Feb, or March (0, 1, 2), the academic year started LAST year.
    // Otherwise, it started THIS year.
    const startYear = currentMonth < 3 ? currentYear - 1 : currentYear;
    const academicYearStart = `${startYear}-04-01`; // April 1st

    records.forEach(r => {
      // 1. FILTER: Only count books from current academic year
      if (r.issue_date < academicYearStart) return;

      // 2. Create unique key
      // NEW
      const key = r.adm || r.student_name;  // adm now available from updated endpoint
      if (!stats[key]) {
        stats[key] = { 
            name: r.student_name,
            adm: r.adm,
            class: r.class_standard || r.class, 
            div: r.division || r.div, 
            count: 0 
        };
      }
      stats[key].count += 1;
    });
    
    // Convert to array, sort descending, take Top 10
    const sorted = Object.values(stats)
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
      
    setTopReaders(sorted);
  };

  useEffect(() => {
    fetchActiveRecords();
    fetchHistory(); // <--- Call this immediately so Top Readers loads on start
  }, []); // <--- Change dependency to empty array [] to run once on mount

  // NEW
  const fetchActiveRecords = async () => {
    try {
      const res = await fetch(`${API_BASE}/library/active`);
      if (res.ok) setActiveRecords(await res.json());
    } catch (err) { console.error("Failed to load active records", err); }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_BASE}/library/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryRecords(data);
        calculateStats(data);
      }
    } catch (err) { console.error("Failed to load history", err); }
  };

  // --- NEW SEARCH LOGIC ---
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);
    setSelectedStudent(null); // Reset selection if typing again

    if (val.length > 1) {
       const res = await fetch(`${API_BASE}/students/search?query=${val}`);
       const data = await res.json();
       setSearchResults(data.results || []);
    } else {
       setSearchResults([]);
    }
  };

  const selectStudent = (student) => {
      setSelectedStudent(student);
      setSearchQuery(student.name); // Set input to name
      setSearchResults([]); // Hide dropdown
  };

  const handleIssue = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
        setMessage("⚠️ Please select a student from the list.");
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/library/issue`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                admission_number: selectedStudent.admission_number, 
                book_name: bookName, 
                book_id: bookId, 
                issue_date: issueDate 
            })
        });
        if (res.ok) {
            setMessage(`✅ Book Issued to ${selectedStudent.name}!`);
            // Reset Form
            setSearchQuery(""); setSelectedStudent(null); setBookName(""); setBookId("");
            fetchActiveRecords();
            setTimeout(() => setMessage(""), 3000);
        } else {
            setMessage("❌ Issue Failed");
        }
    } catch (err) { setMessage("❌ Error connecting"); }
  };

  const confirmReturn = async () => {
    try {
        const res = await fetch(`${API_BASE}/library/return`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ record_id: returnModal, return_date: returnDate })
        });
        if (res.ok) {
            setMessage("✅ Book Returned!");
            setReturnModal(null);
            fetchActiveRecords();
            setTimeout(() => setMessage(""), 3000);
        }
    } catch (err) { setMessage("❌ Error"); }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      
      <div className="print-header">
          <h1>Universal Trust</h1>
          <p>Library Register Report</p>
          <p style={{ fontSize: "12pt" }}>Generated: {new Date().toLocaleDateString()}</p>
      </div>

      <h2 className="no-print" style={{ textAlign: "center", color: "#2c3e50" }}>📚 Library Register</h2>

      {/* TABS */}
      <div className="no-print" style={{ display: "flex", gap: "10px", marginBottom: "20px", justifyContent: "center" }}>
        <button onClick={() => setActiveTab("active")} style={{ padding: "10px 20px", backgroundColor: activeTab==="active"?"#2c3e50":"#ecf0f1", color: activeTab==="active"?"white":"black", border: "none", borderRadius: "5px", cursor: "pointer" }}>Active Issues</button>
        <button onClick={() => setActiveTab("issue")} style={{ padding: "10px 20px", backgroundColor: activeTab==="issue"?"#2980b9":"#ecf0f1", color: activeTab==="issue"?"white":"black", border: "none", borderRadius: "5px", cursor: "pointer" }}>Issue Book</button>
        <button onClick={() => setActiveTab("history")} style={{ padding: "10px 20px", backgroundColor: activeTab==="history"?"#7f8c8d":"#ecf0f1", color: activeTab==="history"?"white":"black", border: "none", borderRadius: "5px", cursor: "pointer" }}>History</button>
        {/* NEW BUTTON */}
        <button onClick={() => setActiveTab("top_readers")} style={{ padding: "10px 20px", backgroundColor: activeTab==="top_readers"?"#f1c40f":"#ecf0f1", color: activeTab==="top_readers"?"black":"black", border: "none", borderRadius: "5px", cursor: "pointer", fontWeight: "bold" }}>🏆 Top Readers</button>
      </div>

      {message && <div style={{ textAlign: "center", padding: "10px", backgroundColor: "#d4edda", marginBottom: "15px", borderRadius: "5px" }}>{message}</div>}

      {/* VIEW 1: ACTIVE REGISTER */}
      {activeTab === "active" && (
        <div>
        
    {/* --- HEADER: ANIMATION MOVED WAY UP --- */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
        
        {/* Left Side: Title */}
        <h1 style={{ margin: 0, marginTop: '20px' }}>Library Manager</h1>

        {/* Right Side: Animation Floating Above Button */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            
            {/* Animation Container */}
            <div style={{ 
                width: "180px", 
                height: "180px", 
                marginTop: "-250px",     // <--- MOVED WAY UP
                marginRight: "-10px", 
                mixBlendMode: 'multiply' // Keeps background transparent
            }}>
                <SafeLottie animationData={bookAnim} />
            </div>
        </div>
      </div>   

            {activeRecords.length === 0 ? <p style={{ textAlign: "center", color: "#7f8c8d" }}>No active issues. All books are in the library.</p> : (
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8f9fa", textAlign: "left" }}>
                            <th style={{ padding: "10px" }}>Student</th>
                            <th style={{ padding: "10px" }}>Class</th>
                            <th style={{ padding: "10px" }}>Book</th>
                            <th style={{ padding: "10px" }}>Issue Date</th>
                            <th style={{ padding: "10px" }} className="no-print">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activeRecords.map(r => (
                            <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "10px" }}><strong>{r.student_name}</strong></td>
                                <td style={{ padding: "10px" }}>{r.class} {r.div}</td>
                                <td style={{ padding: "10px" }}>{r.book_name} <br/><small style={{color:"#777"}}>#{r.book_id}</small></td>
                                <td style={{ padding: "10px" }}>{r.issue_date}</td>
                                <td style={{ padding: "10px" }} className="no-print">
                                    <button onClick={() => setReturnModal(r.id)} style={{ padding: "5px 10px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "3px", cursor: "pointer" }}>Return</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
      )}

      {/* VIEW 2: ISSUE BOOK FORM (UPDATED) */}
      {activeTab === "issue" && (
        <div style={{ maxWidth: "500px", margin: "0 auto", backgroundColor: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 5px 15px rgba(0,0,0,0.1)" }}>
            <h3>Issue New Book</h3>
            <form onSubmit={handleIssue} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                
                {/* --- STUDENT SEARCH INPUT --- */}
                <div style={{ position: "relative" }}>
                    <label style={{display:"block", marginBottom:"5px", fontWeight:"bold"}}>Search Student Name:</label>
                    <input 
                        value={searchQuery} 
                        onChange={handleSearchChange} 
                        placeholder="Start typing name..." 
                        required 
                        style={{ width: "100%", padding: "10px", boxSizing:"border-box", border: "1px solid #ccc", borderRadius: "4px" }} 
                    />
                    
                    {/* DROPDOWN RESULTS */}
                    {searchResults.length > 0 && (
                        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, backgroundColor: "white", border: "1px solid #ccc", zIndex: 10, maxHeight: "150px", overflowY: "auto", boxShadow: "0 4px 6px rgba(0,0,0,0.1)" }}>
                            {searchResults.map(s => (
                                <div 
                                    key={s.admission_number} 
                                    onClick={() => selectStudent(s)}
                                    style={{ padding: "10px", cursor: "pointer", borderBottom: "1px solid #eee", fontSize: "14px" }}
                                    onMouseOver={(e) => e.target.style.backgroundColor = "#f0f0f0"}
                                    onMouseOut={(e) => e.target.style.backgroundColor = "white"}
                                >
                                    <strong>{s.name}</strong> <span style={{color:"#777"}}>(Class {s.class_standard} {s.division})</span>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* SELECTED INDICATOR */}
                    {selectedStudent && (
                        <div style={{ marginTop: "5px", color: "#27ae60", fontSize: "14px", fontWeight: "bold" }}>
                            ✅ Selected: {selectedStudent.name} (Class {selectedStudent.class_standard} {selectedStudent.division})
                        </div>
                    )}
                </div>
                {/* --------------------------- */}

                <div>
                    <label style={{display:"block", marginBottom:"5px", fontWeight:"bold"}}>Book Name:</label>
                    <input value={bookName} onChange={e => setBookName(e.target.value)} required style={{ width: "100%", padding: "10px", boxSizing:"border-box" }} />
                </div>
                <div>
                    <label style={{display:"block", marginBottom:"5px", fontWeight:"bold"}}>Book ID (Accession No):</label>
                    <input value={bookId} onChange={e => setBookId(e.target.value)} required style={{ width: "100%", padding: "10px", boxSizing:"border-box" }} />
                </div>
                <div>
                    <label style={{display:"block", marginBottom:"5px", fontWeight:"bold"}}>Issue Date:</label>
                    <input type="date" value={issueDate} onChange={e => setIssueDate(e.target.value)} required style={{ width: "100%", padding: "10px", boxSizing:"border-box" }} />
                </div>
                <button type="submit" style={{ padding: "12px", backgroundColor: "#2980b9", color: "white", border: "none", fontSize: "16px", cursor: "pointer", borderRadius: "5px" }}>Issue Book</button>
            </form>
        </div>
      )}

      {/* VIEW 3: HISTORY */}
      {activeTab === "history" && (
        <div>
             <h3>📜 Recent Returns</h3>
             <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                    <tr style={{ backgroundColor: "#f8f9fa", textAlign: "left" }}>
                        <th style={{ padding: "10px" }}>Student</th>
                        <th style={{ padding: "10px" }}>Book</th>
                        <th style={{ padding: "10px" }}>Taken</th>
                        <th style={{ padding: "10px" }}>Returned</th>
                    </tr>
                </thead>
                <tbody>
                    {historyRecords.map(r => (
                        <tr key={r.id} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "10px" }}>{r.student_name} <small>({r.class}{r.div})</small></td>
                            <td style={{ padding: "10px" }}>{r.book_name} <small>#{r.book_id}</small></td>
                            <td style={{ padding: "10px" }}>{r.issue_date}</td>
                            <td style={{ padding: "10px", color: "#27ae60", fontWeight: "bold" }}>{r.return_date}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      )}

      {/* VIEW 4: TOP READERS */}
      {activeTab === "top_readers" && (
        <div>
             <h3 style={{ textAlign: "center", color: "#f39c12" }}>🏆 Hall of Fame: Top 10 Readers</h3>
             <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
                 <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#fef9e7", textAlign: "left", color: "#d35400" }}>
                            <th style={{ padding: "15px" }}>Rank</th>
                            <th style={{ padding: "15px" }}>Student Name</th>
                            <th style={{ padding: "15px" }}>Class</th>
                            <th style={{ padding: "15px", textAlign: "center" }}>Total Books Read</th>
                        </tr>
                    </thead>
                    <tbody>
                        {topReaders.map((reader, index) => (
                            <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                                <td style={{ padding: "15px" }}>
                                    <span style={{ 
                                        display: "inline-block", width: "30px", height: "30px", borderRadius: "50%", 
                                        backgroundColor: index === 0 ? "#f1c40f" : (index === 1 ? "#bdc3c7" : (index === 2 ? "#cd7f32" : "#ecf0f1")),
                                        color: index < 3 ? "white" : "#7f8c8d", textAlign: "center", lineHeight: "30px", fontWeight: "bold"
                                    }}>
                                        {index + 1}
                                    </span>
                                </td>
                                <td style={{ padding: "15px", fontWeight: index === 0 ? "bold" : "normal", fontSize: "16px" }}>
                                    {reader.name} {index === 0 && "👑"}
                                </td>
                                <td style={{ padding: "15px" }}>{reader.class} {reader.div}</td>
                                <td style={{ padding: "15px", textAlign: "center", fontWeight: "bold", color: "#2c3e50" }}>{reader.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
      )}

      {/* RETURN MODAL */}
      {returnModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "300px" }}>
                <h3>Confirm Return</h3>
                <label style={{ display: "block", marginBottom: "10px" }}>Return Date:</label>
                <input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} style={{ width: "100%", padding: "10px", marginBottom: "20px" }} />
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={confirmReturn} style={{ flex: 1, padding: "10px", backgroundColor: "#27ae60", color: "white", border: "none", cursor: "pointer" }}>Confirm</button>
                    <button onClick={() => setReturnModal(null)} style={{ flex: 1, padding: "10px", backgroundColor: "#e74c3c", color: "white", border: "none", cursor: "pointer" }}>Cancel</button>
                </div>
            </div>
        </div>
      )}

      <div className="print-footer">ClassFlow Universal</div>

    </div>
  );
}

export default LibraryManager;