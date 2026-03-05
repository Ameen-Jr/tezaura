import React, { useState, useEffect } from 'react';

function AddStudent() {
  const [formData, setFormData] = useState({
    admission_number: "", name: "", class_standard: "10", division: "A", gender: "Male",
    dob: "", school_name: "", address: "",
    father_name: "", father_occupation: "", father_phone: "",
    mother_name: "", mother_occupation: "", mother_phone: "",
    whatsapp_number: "", bus_stop: "", panchayat: "", remarks: "",
    sslc_number: "",
    admission_date: new Date().toISOString().split('T')[0] 
  });
  
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [message, setMessage] = useState("");
  const [recentAdmissions, setRecentAdmissions] = useState([]);
  const [acadYear, setAcadYear] = useState("Loading..."); // NEW STATE

  useEffect(() => {
    fetchHistory();
    fetchNextAdmNo();
    fetchAcademicYear(); // NEW CALL
  }, []);

  const fetchHistory = async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/students/recent-admissions");
        const data = await res.json();
        setRecentAdmissions(data);
    } catch (err) { console.error("History fetch error", err); }
  };

  const fetchNextAdmNo = async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/students/next-admission-number");
        const data = await res.json();
        if (data.next_admission_number) {
            setFormData(prev => ({ ...prev, admission_number: data.next_admission_number }));
        }
    } catch (err) { console.error("Next Adm No Error", err); }
  };

  // --- NEW: FETCH ACADEMIC YEAR ---
  const fetchAcademicYear = async () => {
    try {
        const res = await fetch("http://127.0.0.1:8000/settings/academic-year");
        const data = await res.json();
        setAcadYear(data.academic_year);
    } catch (err) { setAcadYear("2025-26"); }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
  
  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (file) {
        setPhoto(file);
        setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("⏳ Saving...");

    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    if (photo) data.append("photo", photo);

    try {
      const response = await fetch("http://127.0.0.1:8000/students", {
        method: "POST", body: data,
      });
      const result = await response.json();
      if (response.ok) {
        setMessage("✅ " + result.message);
        
        const nextNum = parseInt(formData.admission_number) + 1; 
        setFormData({ 
            ...formData, 
            admission_number: isNaN(nextNum) ? "" : nextNum.toString(),
            name: "", 
            father_name: "", father_occupation: "", father_phone: "",
            mother_name: "", mother_occupation: "", mother_phone: "",
            address: "", remarks: "", sslc_number: "", bus_stop: "", panchayat: "", school_name: ""
        }); 
        
        setPhoto(null);
        setPhotoPreview(null);
        fetchHistory(); 
        window.scrollTo(0, 0); 
        setTimeout(() => setMessage(""), 3000);
      } else {
        setMessage("❌ " + result.detail);
      }
    } catch (error) { setMessage("❌ Error: " + error.message); }
  };

  const SectionHeader = ({ icon, title, color }) => (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", borderBottom: `2px solid ${color}`, paddingBottom: "10px" }}>
        <span style={{ fontSize: "24px" }}>{icon}</span>
        <h3 style={{ margin: 0, color: "#374151" }}>{title}</h3>
    </div>
  );

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px", animation: "fadeIn 0.5s ease-in" }}>
      
      {/* --- TOP HEADER & TITLE --- */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
          <div>
            <h1 style={{ margin: 0, color: "#111827", fontSize: "28px" }}>🚀 New Student Admission</h1>
            <p style={{ color: "#6B7280", margin: "5px 0 0" }}>Create a new student profile for the academic year.</p>
          </div>
          <div style={{ backgroundColor: "#EEF2FF", padding: "10px 20px", borderRadius: "30px", color: "#4F46E5", fontWeight: "bold", border: "1px solid #C7D2FE" }}>
             Academic Year {acadYear} {/* DYNAMIC YEAR */}
          </div>
      </div>

      {message && <div style={{ padding: "15px", backgroundColor: message.includes("✅") ? "#ECFDF5" : "#FEF2F2", color: message.includes("✅") ? "#047857" : "#B91C1C", borderRadius: "10px", marginBottom: "20px", textAlign: "center", fontWeight: "bold", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>{message}</div>}

      <form onSubmit={handleSubmit}>
        
        {/* --- 1. THE "IDENTITY" CARD --- */}
        <div className="card-glass" style={{ padding: "30px", marginBottom: "25px", display: "flex", gap: "30px", alignItems: "flex-start", backgroundColor: "white" }}>
            
            {/* PHOTO UPLOAD ZONE */}
            <div style={{ width: "160px", flexShrink: 0, textAlign: "center" }}>
                <div style={{ 
                    width: "150px", height: "150px", borderRadius: "50%", 
                    backgroundColor: "#F3F4F6", border: "4px solid white", 
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", overflow: "hidden", 
                    margin: "0 auto 15px", position: "relative",
                    display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
                }} onClick={() => document.getElementById('photoInput').click()}>
                    {photoPreview ? (
                        <img src={photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Preview" />
                    ) : (
                        <span style={{ fontSize: "40px", color: "#9CA3AF" }}>📷</span>
                    )}
                    <div style={{ position: "absolute", bottom: 0, width: "100%", background: "rgba(0,0,0,0.5)", color: "white", fontSize: "10px", padding: "5px" }}>Click to Upload</div>
                </div>
                <input id="photoInput" type="file" onChange={handlePhoto} accept="image/*" style={{ display: "none" }} />
                <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "bold" }}>STUDENT PHOTO</div>
            </div>

            {/* KEY FIELDS */}
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ gridColumn: "span 2" }}>
                    <label style={{ display: "block", color: "#4B5563", fontSize: "12px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "5px" }}>Full Name of Student</label>
                    <input name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Arjun Krishna" style={{ width: "100%", fontSize: "20px", padding: "12px", fontWeight: "600", border: "2px solid #E5E7EB" }} />
                </div>
                <div>
                    <label style={{ fontWeight: "bold", color: "#4F46E5" }}>Admission No</label>
                    <input name="admission_number" value={formData.admission_number} onChange={handleChange} required style={{ width: "100%", backgroundColor: "#F3F4F6", fontWeight: "bold" }} />
                </div>
                <div>
                    <label style={{ fontWeight: "bold" }}>Date of Admission</label>
                    <input type="date" name="admission_date" value={formData.admission_date} onChange={handleChange} style={{ width: "100%" }} />
                </div>
                <div>
                    <label style={{ fontWeight: "bold" }}>Class</label>
                    <select name="class_standard" value={formData.class_standard} onChange={handleChange} style={{ width: "100%" }}>
                        <option value="8">Class 8</option>
                        <option value="9">Class 9</option>
                        <option value="10">Class 10</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontWeight: "bold" }}>Division</label>
                    <select name="division" value={formData.division} onChange={handleChange} style={{ width: "100%" }}>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="">None</option>
                    </select>
                </div>
            </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(450px, 1fr))", gap: "25px" }}>
            
            {/* --- 2. PERSONAL DETAILS --- */}
            <div className="card-glass" style={{ padding: "25px", backgroundColor: "#fff" }}>
                <SectionHeader icon="👤" title="Personal Details" color="#3B82F6" />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "15px" }}>
                    <div><label>Date of Birth</label><input type="date" name="dob" value={formData.dob} onChange={handleChange} style={{ width: "100%" }} /></div>
                    <div><label>Gender</label><select name="gender" value={formData.gender} onChange={handleChange} style={{ width: "100%" }}><option>Male</option><option>Female</option></select></div>
                    
                    <div style={{ gridColumn: "span 2" }}><label>School</label><input name="school_name" value={formData.school_name} onChange={handleChange} placeholder="Current School Name" style={{ width: "100%" }} /></div>
                    <div style={{ gridColumn: "span 2" }}><label>Address</label><textarea name="address" value={formData.address} onChange={handleChange} placeholder="House Name, Street, Post Office" style={{ width: "100%", height: "70px" }} /></div>
                    
                    <div><label>Bus Stop</label><input name="bus_stop" value={formData.bus_stop} onChange={handleChange} style={{ width: "100%" }} /></div>
                    <div><label>Panchayat</label><input name="panchayat" value={formData.panchayat} onChange={handleChange} style={{ width: "100%" }} /></div>
                </div>
            </div>

            {/* --- 3. GUARDIAN DETAILS --- */}
            <div className="card-glass" style={{ padding: "25px", backgroundColor: "#fff" }}>
                <SectionHeader icon="👪" title="Guardian Info" color="#F59E0B" />
                
                {/* Father */}
                <div style={{ backgroundColor: "#F9FAFB", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
                    <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>Father / Guardian</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ gridColumn: "span 2" }}><input name="father_name" value={formData.father_name} onChange={handleChange} placeholder="Name" style={{ width: "100%" }} /></div>
                        <div><input name="father_occupation" value={formData.father_occupation} onChange={handleChange} placeholder="Occupation" style={{ width: "100%" }} /></div>
                        <div><input name="father_phone" value={formData.father_phone} onChange={handleChange} placeholder="Phone" style={{ width: "100%" }} /></div>
                    </div>
                </div>

                {/* Mother */}
                <div style={{ backgroundColor: "#F9FAFB", padding: "15px", borderRadius: "8px" }}>
                     <div style={{ fontSize: "12px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase", marginBottom: "10px" }}>Mother</div>
                     <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div style={{ gridColumn: "span 2" }}><input name="mother_name" value={formData.mother_name} onChange={handleChange} placeholder="Name" style={{ width: "100%" }} /></div>
                        <div><input name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} placeholder="Occupation" style={{ width: "100%" }} /></div>
                        <div><input name="mother_phone" value={formData.mother_phone} onChange={handleChange} placeholder="Phone" style={{ width: "100%" }} /></div>
                    </div>
                </div>

                <div style={{ marginTop: "15px" }}>
                    <label>WhatsApp Number</label>
                    <input name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} placeholder="Primary Contact for Messages" style={{ width: "100%", borderColor: "#10B981" }} />
                </div>
            </div>

        </div>

        {/* --- 4. EXTRAS & SUBMIT --- */}
        <div className="card-glass" style={{ padding: "25px", marginTop: "25px", backgroundColor: "#fff" }}>
            <SectionHeader icon="📝" title="Additional Info" color="#8B5CF6" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div style={{ gridColumn: "span 2" }}>
                    <label>Remarks</label>
                    <input name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Medical issues, talents, or other notes..." style={{ width: "100%" }} />
                </div>
                {formData.class_standard === "10" && (
                    <div style={{ gridColumn: "span 2", padding: "15px", backgroundColor: "#ECFDF5", border: "1px dashed #059669", borderRadius: "8px" }}>
                        <label style={{ fontWeight: "bold", color: "#065F46" }}>SSLC Reg No (Required for Class 10)</label>
                        <input name="sslc_number" value={formData.sslc_number} onChange={handleChange} style={{ width: "100%", marginTop: "5px" }} />
                    </div>
                )}
            </div>
            
            <button type="submit" style={{ 
                width: "100%", marginTop: "20px", padding: "15px", 
                background: "linear-gradient(to right, #4F46E5, #7C3AED)", color: "white", 
                border: "none", borderRadius: "10px", fontSize: "18px", fontWeight: "bold", 
                cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(79, 70, 229, 0.2)"
            }}>
                ✅ Save & Admit Student
            </button>
        </div>

      </form>

      {/* --- HISTORY SECTION --- */}
      <div style={{ marginTop: "40px" }}>
          <h3 style={{ color: "#6B7280", borderBottom: "1px solid #E5E7EB", paddingBottom: "10px" }}>📜 Recent Admissions</h3>
          <div className="card-glass" style={{ padding: "0", overflow: "hidden", backgroundColor: "white" }}>
            {recentAdmissions.length === 0 ? <p style={{ padding: "20px", textAlign: "center", color: "#9CA3AF" }}>No recent admissions found.</p> : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                    <thead style={{ backgroundColor: "#F9FAFB" }}>
                        <tr>
                            <th style={{ padding: "15px", textAlign: "left", color: "#6B7280" }}>Adm No</th>
                            <th style={{ padding: "15px", textAlign: "left", color: "#6B7280" }}>Student Name</th>
                            <th style={{ padding: "15px", textAlign: "left", color: "#6B7280" }}>Class</th>
                            <th style={{ padding: "15px", textAlign: "left", color: "#6B7280" }}>School</th>
                            <th style={{ padding: "15px", textAlign: "right", color: "#6B7280" }}>Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentAdmissions.map((s, idx) => (
                            <tr key={idx} style={{ borderBottom: "1px solid #F3F4F6" }}>
                                <td style={{ padding: "15px", fontWeight: "bold", color: "#4F46E5" }}>{s.adm}</td>
                                <td style={{ padding: "15px", fontWeight: "600" }}>{s.name}</td>
                                <td style={{ padding: "15px" }}>{s.class} {s.div}</td>
                                <td style={{ padding: "15px" }}>{s.school || "-"}</td>
                                <td style={{ padding: "15px", textAlign: "right", color: "#6B7280" }}>{s.date || "N/A"}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
          </div>
      </div>

    </div>
  );
}

export default AddStudent;