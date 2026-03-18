import React, { useEffect, useState, useRef } from 'react';
import API_BASE from '../config';

function StudentProfile({ student, onBack }) {
  const [feeHistory, setFeeHistory] = useState([]);
  const [examHistory, setExamHistory] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [message, setMessage] = useState("");
  
  // SSLC Result State
  const [sslcData, setSslcData] = useState({
      lang_i: "", lang_ii: "", english: "", hindi: "", maths: "", 
      physics: "", chemistry: "", biology: "", social: "", it: ""
  });
  const [isFullAplus, setIsFullAplus] = useState(false);

  // Photo State
  const [newPhotoFile, setNewPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null); 

  // Discontinue State
  const [showDiscontinue, setShowDiscontinue] = useState(false);
  const [discontinueReason, setDiscontinueReason] = useState("");
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  const subjects = [
      { key: "lang_i", label: "First Language I" },
      { key: "lang_ii", label: "First Language II" },
      { key: "english", label: "English" },
      { key: "hindi", label: "Hindi" },
      { key: "maths", label: "Mathematics" },
      { key: "physics", label: "Physics" },
      { key: "chemistry", label: "Chemistry" },
      { key: "biology", label: "Biology" },
      { key: "social", label: "Social Science" },
      { key: "it", label: "IT" }
  ];

  const grades = ["A+", "A", "B+", "B", "C+", "C", "D+", "D", "E"];

  useEffect(() => {
    if (student) {
      setEditData(student);
      setNewPhotoFile(null);
      setPhotoPreview(null);

      // 1. Fetch Fees
      fetch(`${API_BASE}/fees/${student.admission_number}`)
        .then(res => res.json())
        .then(data => setFeeHistory(data))
        .catch(err => console.error(err));
        
      // 2. Fetch Exams
      fetch(`${API_BASE}/students/${student.admission_number}/exams`)
        .then(res => res.json())
        .then(data => setExamHistory(data))
        .catch(err => console.error(err));

      // 3. Fetch Attendance
      fetch(`${API_BASE}/attendance/${student.admission_number}`)
        .then(res => res.ok ? res.json() : { percentage: 0, present_days: 0, total_days: 0 })
        .then(data => setAttendanceStats(data))
        .catch(() => setAttendanceStats({ percentage: 0, present_days: 0, total_days: 0 }));

      // 4. Fetch SSLC Result
      if (student.class_standard === "10") {
          fetch(`${API_BASE}/students/${student.admission_number}/sslc-result`)
            .then(res => res.json())
            .then(data => {
                if (data.lang_i) {
                    setSslcData(data);
                    checkFullAplus(data);
                }
            })
            .catch(err => console.error(err));
      }

      // 5. NEW: Fetch Full Profile Status (Check if Discontinued)
      fetch(`${API_BASE}/students/lookup/${student.admission_number}`)
        .then(res => res.json())
        .then(data => {
            // Merge the status/reason into our display data
            setEditData(prev => ({ ...prev, ...data }));
        })
        .catch(err => console.error("Profile lookup failed", err));
    }
  }, [student]);

  const checkFullAplus = (data) => {
      const allAplus = Object.values(data).every(val => val === "A+");
      setIsFullAplus(allAplus);
  };

  if (!student) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? "N/A" : date.toLocaleDateString();
  };

  const handleChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleSslcChange = (key, value) => {
      const newData = { ...sslcData, [key]: value };
      setSslcData(newData);
      checkFullAplus(newData);
  };

  const setAllAplus = () => {
      const fullA = {};
      subjects.forEach(s => fullA[s.key] = "A+");
      setSslcData(fullA);
      setIsFullAplus(true);
  };

  const saveSslcResult = async () => {
      try {
          const payload = { ...sslcData, admission_number: student.admission_number };
          const res = await fetch(`${API_BASE}/students/sslc-result`, {
              method: "POST", headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
          });
          if (res.ok) {
              setMessage("✅ SSLC Results Saved!");
              setTimeout(() => setMessage(""), 3000);
          } else {
              alert("Failed to save results");
          }
      } catch (err) { alert("Connection Error"); }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setNewPhotoFile(file);
        setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setMessage("⏳ Saving changes...");
    try {
      if (newPhotoFile) {
          const photoData = new FormData();
          photoData.append("photo", newPhotoFile);
          const photoResponse = await fetch(`${API_BASE}/students/${student.admission_number}/photo`, {
              method: "POST", body: photoData,
          });
          if (!photoResponse.ok) throw new Error("Photo upload failed");
          const photoResult = await photoResponse.json();
          setEditData(prev => ({ ...prev, photo_path: photoResult.new_path })); 
      }
      const response = await fetch(`${API_BASE}/students/${student.admission_number}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editData),
      });
      if (response.ok) {
        setMessage("✅ Updated Successfully!");
        setIsEditing(false);
        Object.assign(student, editData); 
        if (photoPreview) URL.revokeObjectURL(photoPreview);
        setTimeout(() => setMessage(""), 3000);
      } else { setMessage("❌ Update Failed"); }
    } catch (error) { setMessage("❌ Error: " + error.message); }
  };

  const handleDiscontinue = async () => {
    if (!discontinueReason) return alert("Please enter a reason.");
    try {
        const res = await fetch(`${API_BASE}/students/${student.admission_number}/discontinue`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ reason: discontinueReason, date_left: new Date().toISOString().split('T')[0] })
        });
        if (res.ok) {
            alert("Student Discontinued.");
            onBack(); 
        } else {
            alert("Error updating status.");
        }
    } catch (err) { console.error(err); }
  };

  const inputStyle = { padding: "5px", width: "95%", borderRadius: "4px", border: "1px solid #ccc", marginBottom: "5px" };
  let imageSrc = photoPreview || (student.photo_path ? `${API_BASE}/photos/${student.photo_path}?t=${new Date().getTime()}` : null);

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      
      <div className="print-header">
          <h1>Universal Trust</h1>
          <p>Student Profile Report</p>
      </div>

      <div className="no-print" style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
          <button onClick={onBack} style={{ padding: "8px 15px", cursor: "pointer" }}>← Back to Search</button>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={() => window.print()} style={{ padding: "8px 20px", backgroundColor: "#34495e", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>🖨️ Print Profile</button>
            {isEditing ? (
                <>
                    <button onClick={handleSave} style={{ padding: "8px 20px", backgroundColor: "#27ae60", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>💾 Save</button>
                    <button onClick={() => setShowDiscontinue(true)} style={{ padding: "8px 20px", backgroundColor: "#c0392b", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>⛔ Discontinue</button>
                    <button onClick={() => { setIsEditing(false); setPhotoPreview(null); }} style={{ padding: "8px 20px", backgroundColor: "#95a5a6", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>Cancel</button>
                </>
            ) : (
                <button onClick={() => setIsEditing(true)} style={{ padding: "8px 20px", backgroundColor: "#3498db", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>✏️ Edit Profile</button>
            )}
          </div>
      </div>

      {message && <div className="no-print" style={{ textAlign: "center", padding: "10px", backgroundColor: message.includes("✅") ? "#d4edda" : "#f8d7da", color: message.includes("✅") ? "#155724" : "#721c24", marginBottom: "15px", borderRadius: "5px" }}>{message}</div>}

      {/* HEADER CARD */}
      <div className="card-glass" style={{ display: "flex", gap: "30px", padding: "30px", marginBottom: "20px", alignItems: "center" }}>
        <div style={{ flexShrink: 0, position: "relative" }}>
             {/* GOLDEN BADGE FOR FULL A+ */}
{isFullAplus && (
    <div style={{ 
        position: "absolute", 
        top: "-10px", 
        right: "-10px", 
        fontSize: "40px", 
        zIndex: 10, 
        filter: "drop-shadow(0 2px 5px rgba(0,0,0,0.3))",
        animation: "fadeInUp 0.6s ease-out" // <--- ADDED THIS LINE
    }}>
        🏅
    </div>
)}
             
             {imageSrc ? <img src={imageSrc} onClick={() => setShowPhotoModal(true)} style={{ width: "150px", height: "150px", borderRadius: "50%", objectFit: "cover", border: isFullAplus ? "5px solid #FFD700" : "5px solid #ecf0f1", boxShadow: isFullAplus ? "0 0 20px rgba(255, 215, 0, 0.6)" : "none", cursor: "zoom-in" }} />
             : <div style={{ width: "150px", height: "150px", borderRadius: "50%", backgroundColor: "#bdc3c7", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "50px", border: isFullAplus ? "5px solid #FFD700" : "5px solid #ecf0f1" }}>👤</div>}
             
             {isEditing && <div onClick={() => fileInputRef.current.click()} style={{ position: "absolute", bottom: "5px", left: "50%", transform: "translateX(-50%)", backgroundColor: "rgba(0,0,0,0.6)", color: "white", padding: "5px 10px", borderRadius: "20px", fontSize: "12px", cursor: "pointer", width: "80%", textAlign: "center" }}>📷 Change</div>}
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" style={{ display: "none" }} />
        </div>
        <div style={{ flex: 1 }}>
            {isEditing ? (
                <div>
                    <input name="name" value={editData.name} onChange={handleChange} style={{ fontSize: "24px", fontWeight: "bold", width: "100%", padding: "5px" }} />
                    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                        <input name="class_standard" value={editData.class_standard} onChange={handleChange} placeholder="Class" style={{ padding: "5px", width: "100px" }} />
                        <input name="division" value={editData.division || ""} onChange={handleChange} placeholder="Div" style={{ padding: "5px", width: "60px" }} />
                    </div>
                </div>
            ) : (
                <>
                    <h1 style={{ margin: "0 0 10px 0", color: "#2c3e50" }}>{editData.name} {isFullAplus && <span style={{fontSize: "0.6em", color: "#F39C12", verticalAlign: "middle"}}>(Full A+)</span>}</h1>
                    {/* --- DISCONTINUED WARNING LABEL --- */}
                    {editData.is_active === 0 && (
                        <div style={{
                            marginTop: "5px", marginBottom: "15px",
                            padding: "10px 15px",
                            background: "#FEF2F2",
                            borderLeft: "4px solid #EF4444",
                            borderRadius: "4px",
                            display: "flex", alignItems: "center", gap: "12px"
                        }}>
                            <span style={{ fontSize: "20px" }}>🚫</span>
                            <div>
                                <div style={{ color: "#991B1B", fontWeight: "bold", fontSize: "14px", textTransform: "uppercase" }}>
                                    INACTIVE STUDENT
                                </div>
                                <div style={{ color: "#B91C1C", fontSize: "13px" }}>
                                    {editData.discontinued_reason ? `Reason: ${editData.discontinued_reason}` : "Reason: Not Specified"}
                                    {editData.discontinued_date && <span style={{ opacity: 0.8 }}> • Left on: {formatDate(editData.discontinued_date)}</span>}
                                </div>
                            </div>
                        </div>
                    )}
                    <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
                        <span style={{ backgroundColor: "#e0f7fa", padding: "5px 10px", borderRadius: "5px", color: "#006064", fontWeight: "bold" }}>Class {editData.class_standard} {editData.division}</span>
                        <span style={{ backgroundColor: "#f3e5f5", padding: "5px 10px", borderRadius: "5px", color: "#4a148c" }}>Adm: {student.admission_number}</span>
                        <span style={{ backgroundColor: "#fff3e0", padding: "5px 10px", borderRadius: "5px", color: "#e65100" }}>Joined: {formatDate(student.admission_date)}</span>
                    </div>
                </>
            )}
            <div style={{ marginTop: "15px", color: "#7f8c8d" }}>
                {isEditing ? <textarea name="address" value={editData.address || ""} onChange={handleChange} placeholder="Address" style={{ width: "100%", height: "60px", padding: "5px" }} /> : <p>📍 {editData.address || "No Address Provided"}</p>}
            </div>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
        
        {/* PERSONAL DETAILS - Now Fully Restored */}
        <div className="card-glass" style={{ padding: "20px" }}>
            <h3 style={{ borderBottom: "2px solid #3498db", paddingBottom: "10px", color: "#3498db" }}>Personal Details</h3>
            
            <div style={{ marginBottom: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "8px", borderLeft: "4px solid #3498db" }}>
                <strong>📅 Attendance:</strong>
                {attendanceStats ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "5px" }}>
                        <div style={{ flex: 1, height: "10px", backgroundColor: "#e0e0e0", borderRadius: "5px", overflow: "hidden" }}>
                            <div 
  className="progress-fill" 
  style={{ 
    "--target-width": `${attendanceStats.percentage}%`, // CSS Variable for animation
    height: "100%", 
    backgroundColor: attendanceStats.percentage >= 75 ? "#27ae60" : "#e74c3c" 
  }}
    ></div>
                        </div>
                        <span style={{ fontWeight: "bold", color: attendanceStats.percentage >= 75 ? "#27ae60" : "#e74c3c" }}>{attendanceStats.percentage}%</span>
                    </div>
                ) : <span>Loading...</span>}
            </div>

            <p><strong>DOB:</strong> {isEditing ? <input type="date" name="dob" value={editData.dob || ""} onChange={handleChange} style={inputStyle} /> : formatDate(editData.dob)}</p>
            <p><strong>School:</strong> {isEditing ? <input name="school_name" value={editData.school_name || ""} onChange={handleChange} style={inputStyle} /> : editData.school_name}</p>
            <p><strong>Bus Stop:</strong> {isEditing ? <input name="bus_stop" value={editData.bus_stop || ""} onChange={handleChange} style={inputStyle} /> : editData.bus_stop}</p>
            <p><strong>Panchayat:</strong> {isEditing ? <input name="panchayat" value={editData.panchayat || ""} onChange={handleChange} style={inputStyle} /> : editData.panchayat}</p>
            <p><strong>Gender:</strong> {isEditing ? <select name="gender" value={editData.gender} onChange={handleChange} style={inputStyle}><option value="Male">Male</option><option value="Female">Female</option></select> : editData.gender}</p>
            
            {editData.class_standard === "10" && (
    <div style={{ marginTop: "10px", padding: "10px", backgroundColor: "#e8f6f3", border: "1px dashed #27ae60", borderRadius: "5px" }}>
        <p style={{ margin: 0, fontWeight: "bold", color: "#145a32", marginBottom: "6px" }}>SSLC Reg No:</p>
        {isEditing ? (
            <input name="sslc_number" value={editData.sslc_number || ""} onChange={handleChange} style={{ ...inputStyle, border: "1px solid #27ae60" }} placeholder="Enter Reg No" />
        ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "18px", fontWeight: "bold" }}>{editData.sslc_number || "Not Updated"}</span>
                {!editData.sslc_number && (
                    <button onClick={() => setIsEditing(true)} style={{ padding: "3px 10px", fontSize: "12px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}>
                        + Add
                    </button>
                )}
            </div>
        )}
    </div>
)}
        </div>

        {/* GUARDIAN DETAILS - Now Fully Restored */}
        <div className="card-glass" style={{ padding: "20px" }}>
            <h3 style={{ borderBottom: "2px solid #e67e22", paddingBottom: "10px", color: "#e67e22" }}>Guardian Details</h3>
            
            <p><strong>Father:</strong> {isEditing ? <input name="father_name" value={editData.father_name || ""} onChange={handleChange} style={inputStyle} /> : editData.father_name}</p>
            <p><strong>Occupation:</strong> {isEditing ? <input name="father_occupation" value={editData.father_occupation || ""} onChange={handleChange} style={inputStyle} /> : editData.father_occupation}</p>
            <p><strong>Phone:</strong> {isEditing ? <input name="father_phone" value={editData.father_phone || ""} onChange={handleChange} style={inputStyle} /> : editData.father_phone}</p>
            
            <hr style={{margin: "10px 0", borderTop: "1px solid #eee"}}/>
            
            <p><strong>Mother:</strong> {isEditing ? <input name="mother_name" value={editData.mother_name || ""} onChange={handleChange} style={inputStyle} /> : editData.mother_name}</p>
            <p><strong>Occupation:</strong> {isEditing ? <input name="mother_occupation" value={editData.mother_occupation || ""} onChange={handleChange} style={inputStyle} /> : editData.mother_occupation}</p>
            <p><strong>Phone:</strong> {isEditing ? <input name="mother_phone" value={editData.mother_phone || ""} onChange={handleChange} style={inputStyle} /> : editData.mother_phone}</p>
            
            <hr style={{margin: "10px 0", borderTop: "1px solid #eee"}}/>
            
            <p><strong>WhatsApp:</strong> {isEditing ? <input name="whatsapp_number" value={editData.whatsapp_number || ""} onChange={handleChange} style={inputStyle} /> : editData.whatsapp_number}</p>
        </div>
      </div>

      {/* --- SSLC RESULT SECTION --- */}
      {editData.class_standard === "10" && editData.sslc_number && (
    <div className="card-glass" style={{ marginTop: "20px", padding: "20px", border: "2px solid #F1C40F" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #F1C40F", paddingBottom: "10px", marginBottom: "15px" }}>
                  <h3 style={{ margin: 0, color: "#D35400" }}>🏆 SSLC Examination Results</h3>
                  <div className="no-print">
                      <button onClick={setAllAplus} style={{ padding: "5px 15px", backgroundColor: "#F39C12", color: "white", border: "none", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", marginRight: "10px" }}>✨ Full A+</button>
                      <button onClick={saveSslcResult} style={{ padding: "5px 15px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>Save Result</button>
                  </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: "10px" }}>
                  {subjects.map(sub => (
                      <div key={sub.key} style={{ display: "flex", flexDirection: "column" }}>
                          <label style={{ fontSize: "12px", fontWeight: "bold", color: "#555" }}>{sub.label}</label>
                          <select 
                              value={sslcData[sub.key] || ""} 
                              onChange={(e) => handleSslcChange(sub.key, e.target.value)}
                              style={{ padding: "8px", borderRadius: "5px", border: "1px solid #ccc", backgroundColor: sslcData[sub.key] === "A+" ? "#D4EFDF" : "white", fontWeight: sslcData[sub.key] === "A+" ? "bold" : "normal" }}
                          >
                              <option value="">-</option>
                              {grades.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* EXAMS & FEES */}
      <div className="card-glass" style={{ marginTop: "20px", padding: "20px" }}>
        <h3 style={{ borderBottom: "2px solid #8e44ad", paddingBottom: "10px", color: "#8e44ad" }}>📊 Internal Exams</h3>
        {examHistory.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                <thead><tr style={{ backgroundColor: "#f2f2f2", textAlign: "left" }}><th style={{ padding: "10px" }}>Exam</th><th style={{ padding: "10px" }}>Subject</th><th style={{ padding: "10px" }}>Marks</th><th style={{ padding: "10px" }}>%</th></tr></thead>
                <tbody>{examHistory.map((ex, index) => {
                     const pct = ((ex.marks / ex.max) * 100).toFixed(1);
                     return <tr key={index} style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: "10px" }}>{ex.exam}</td><td style={{ padding: "10px" }}>{ex.subject}</td><td style={{ padding: "10px", fontWeight: "bold" }}>{ex.marks}/{ex.max}</td><td style={{ padding: "10px" }}>{pct}%</td></tr>
                })}</tbody>
            </table>
        ) : <p style={{ color: "#7f8c8d" }}>No exam records.</p>}
      </div>

      <div className="card-glass" style={{ marginTop: "20px", padding: "20px" }}>
        <h3 style={{ borderBottom: "2px solid #27ae60", paddingBottom: "10px", color: "#27ae60" }}>💰 Fee History</h3>
        {feeHistory.length > 0 ? (
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
                <thead><tr style={{ backgroundColor: "#f2f2f2", textAlign: "left" }}><th style={{ padding: "10px" }}>Month/Year</th><th style={{ padding: "10px" }}>Date</th><th style={{ padding: "10px" }}>Amount</th></tr></thead>
                <tbody>{feeHistory.map((fee, index) => (<tr key={index} style={{ borderBottom: "1px solid #eee" }}><td style={{ padding: "10px" }}>{fee.month_year}</td><td style={{ padding: "10px" }}>{formatDate(fee.date_paid)}</td><td style={{ padding: "10px", fontWeight: "bold", color: "#27ae60" }}>₹{fee.amount}</td></tr>))}</tbody>
            </table>
        ) : <p style={{ color: "#7f8c8d" }}>No payments.</p>}
      </div>

      <div className="print-footer">ClassFlow Universal</div>

      {/* DISCONTINUE MODAL */}
      {showDiscontinue && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.8)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
            <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px", width: "350px", textAlign: "center" }}>
                <h3 style={{ color: "#c0392b" }}>⛔ Discontinue Student</h3>
                <p>This will move <strong>{student.name}</strong> to the inactive list.</p>
                <input 
                    placeholder="Reason (e.g. TC Issued, Drop out)" 
                    value={discontinueReason}
                    onChange={(e) => setDiscontinueReason(e.target.value)}
                    style={{ width: "100%", padding: "10px", marginBottom: "20px", borderRadius: "5px", border: "1px solid #ccc" }}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                    <button onClick={handleDiscontinue} style={{ flex: 1, padding: "10px", backgroundColor: "#c0392b", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>Confirm</button>
                    <button onClick={() => setShowDiscontinue(false)} style={{ flex: 1, padding: "10px", backgroundColor: "#95a5a6", color: "white", border: "none", cursor: "pointer", borderRadius: "5px" }}>Cancel</button>
                </div>
            </div>
        </div>
      )}
        {/* PHOTO LIGHTBOX MODAL */}
{showPhotoModal && imageSrc && (
    <div 
        onClick={() => setShowPhotoModal(false)}
        style={{ 
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%", 
            backgroundColor: "rgba(0,0,0,0.85)", display: "flex", 
            justifyContent: "center", alignItems: "center", zIndex: 2000,
            cursor: "zoom-out", backdropFilter: "blur(6px)"
        }}
    >
        <img 
            src={imageSrc} 
            style={{ 
                maxWidth: "80vw", maxHeight: "80vh", 
                borderRadius: "12px", objectFit: "contain",
                boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                border: isFullAplus ? "4px solid #FFD700" : "4px solid white"
            }} 
        />
    </div>
)}
    </div>
  );
}

export default StudentProfile;