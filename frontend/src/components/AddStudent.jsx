import React, { useState, useEffect } from 'react';
import API_BASE from '../config';

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
            const res = await fetch(`${API_BASE}/students/recent-admissions`);
            const data = await res.json();
            setRecentAdmissions(data);
        } catch (err) { console.error("History fetch error", err); }
    };

    const fetchNextAdmNo = async () => {
        try {
            const res = await fetch(`${API_BASE}/students/next-admission-number`);
            const data = await res.json();
            if (data.next_admission_number) {
                setFormData(prev => ({ ...prev, admission_number: data.next_admission_number }));
            }
        } catch (err) { console.error("Next Adm No Error", err); }
    };

    // --- NEW: FETCH ACADEMIC YEAR ---
    const fetchAcademicYear = async () => {
        try {
            const res = await fetch(`${API_BASE}/settings/academic-year`);
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
            const response = await fetch(`${API_BASE}/students`, {
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
        <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "20px 20px 40px", animation: "fadeIn 0.5s ease-in", fontFamily: "Inter, sans-serif" }}>
            <style>{`
        .adm-section {
          background: var(--bg-card, #fff);
          border-radius: 20px;
          border: 1px solid var(--border-color, #E5E7EB);
          padding: 28px 32px;
          margin-bottom: 24px;
          transition: box-shadow 0.2s;
        }
        .adm-section:hover { box-shadow: 0 8px 30px rgba(79,70,229,0.08); }
        .adm-section-title {
          display: flex; align-items: center; gap: 10px;
          font-size: 15px; font-weight: 800; letter-spacing: 0.3px;
          text-transform: uppercase; margin-bottom: 22px;
          padding-bottom: 14px; border-bottom: 2px solid;
        }
        .adm-label {
          display: block; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.6px;
          color: var(--text-muted, #9CA3AF); margin-bottom: 6px;
        }
        .adm-input {
          width: 100%; font-size: 14px; padding: 11px 14px !important;
          border-radius: 10px !important; border: 1.5px solid var(--border-color, #E5E7EB) !important;
          background: var(--bg-input, #F9FAFB) !important;
          color: var(--text-primary, #111827) !important;
          transition: border-color 0.2s, box-shadow 0.2s !important;
          box-sizing: border-box;
        }
        .adm-input:focus {
          border-color: #4F46E5 !important;
          box-shadow: 0 0 0 3px rgba(79,70,229,0.12) !important;
          background: #fff !important;
        }
        .adm-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; }
        .adm-grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 18px; }
        .adm-span-2 { grid-column: span 2; }

        /* Photo zone */
        .photo-zone {
          width: 130px; height: 130px; border-radius: 50%;
          background: linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);
          border: 3px dashed #A5B4FC;
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; cursor: pointer; transition: all 0.3s;
          overflow: hidden; position: relative; flex-shrink: 0;
        }
        .photo-zone:hover { border-color: #4F46E5; background: linear-gradient(135deg,#e0e7ff,#c7d2fe); transform: scale(1.03); }
        .photo-zone:hover .photo-overlay { opacity: 1; }
        .photo-overlay {
          position: absolute; inset: 0; background: rgba(79,70,229,0.55);
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transition: opacity 0.2s;
          font-size: 13px; font-weight: bold; color: white;
        }

        /* Pill badges for class selector */
        .class-pill {
          padding: 9px 22px; border-radius: 30px; font-size: 14px; font-weight: 700;
          border: 2px solid #E5E7EB; cursor: pointer; transition: all 0.2s;
          background: transparent; color: var(--text-secondary, #6B7280);
        }
        .class-pill.active { background: #4F46E5; color: white; border-color: #4F46E5; box-shadow: 0 4px 12px rgba(79,70,229,0.3); }
        .class-pill:hover:not(.active) { border-color: #4F46E5; color: #4F46E5; }

        /* Gender toggle */
        .gender-btn {
          flex: 1; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 700;
          border: 2px solid #E5E7EB; cursor: pointer; transition: all 0.2s;
          background: transparent; color: var(--text-secondary, #6B7280);
        }
        .gender-btn.male.active { background: #EFF6FF; color: #1D4ED8; border-color: #3B82F6; }
        .gender-btn.female.active { background: #FDF2F8; color: #BE185D; border-color: #EC4899; }

        /* Recent admissions table */
        .recent-row { transition: background 0.15s; cursor: default; }
        .recent-row:hover { background: var(--table-row-hover, #F9FAFB) !important; }

        @keyframes adm-slide-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .adm-section { animation: adm-slide-in 0.4s ease both; }
        .adm-section:nth-child(2) { animation-delay: 0.05s; }
        .adm-section:nth-child(3) { animation-delay: 0.1s; }
        .adm-section:nth-child(4) { animation-delay: 0.15s; }
        .adm-section:nth-child(5) { animation-delay: 0.2s; }
      `}</style>

            {/* ── HERO HEADER ── */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "28px" }}>
                <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
                        <div style={{ width: "44px", height: "44px", borderRadius: "14px", background: "linear-gradient(135deg,#4F46E5,#7C3AED)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", boxShadow: "0 6px 20px rgba(79,70,229,0.35)" }}>🎓</div>
                        <h1 style={{ margin: 0, fontSize: "26px", fontWeight: "800", color: "var(--text-primary, #111827)" }}>New Student Admission</h1>
                    </div>
                    <p style={{ margin: 0, color: "var(--text-secondary, #6B7280)", fontSize: "14px", paddingLeft: "56px" }}>Fill in the student details below to create a new profile.</p>
                </div>
                <div style={{ backgroundColor: "#EEF2FF", padding: "10px 20px", borderRadius: "30px", color: "#4F46E5", fontWeight: "800", border: "2px solid #C7D2FE", fontSize: "14px", whiteSpace: "nowrap" }}>
                    📅 {acadYear}
                </div>
            </div>

            {message && (
                <div style={{ padding: "14px 20px", backgroundColor: message.includes("✅") ? "#ECFDF5" : "#FEF2F2", color: message.includes("✅") ? "#047857" : "#B91C1C", borderRadius: "12px", marginBottom: "20px", textAlign: "center", fontWeight: "700", border: `1px solid ${message.includes("✅") ? "#A7F3D0" : "#FECACA"}` }}>
                    {message}
                </div>
            )}

            <form onSubmit={handleSubmit}>

                {/* ── SECTION 1: IDENTITY CARD ── */}
                <div className="adm-section" style={{ background: "linear-gradient(135deg, #fafbff 0%, #f3f4ff 100%)", borderColor: "#E0E7FF" }}>
                    <div className="adm-section-title" style={{ color: "#4F46E5", borderColor: "#C7D2FE" }}>
                        <span style={{ fontSize: "18px" }}>🪪</span> Student Identity
                    </div>

                    <div style={{ display: "flex", gap: "32px", alignItems: "flex-start" }}>
                        {/* Photo Upload */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px" }}>
                            <div className="photo-zone" onClick={() => document.getElementById('photoInput').click()}>
                                {photoPreview
                                    ? <img src={photoPreview} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Preview" />
                                    : <><span style={{ fontSize: "32px" }}>📷</span><span style={{ fontSize: "11px", color: "#6366F1", fontWeight: "700", marginTop: "4px" }}>Upload Photo</span></>
                                }
                                <div className="photo-overlay">📷 Change</div>
                            </div>
                            <input id="photoInput" type="file" onChange={handlePhoto} accept="image/*" style={{ display: "none" }} />
                            <span style={{ fontSize: "11px", color: "var(--text-muted, #9CA3AF)", fontWeight: "600", letterSpacing: "0.5px" }}>STUDENT PHOTO</span>
                        </div>

                        {/* Core fields */}
                        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "18px" }}>
                            {/* Full Name */}
                            <div>
                                <label className="adm-label">Full Name of Student *</label>
                                <input className="adm-input" name="name" value={formData.name} onChange={handleChange} required placeholder="e.g. Arjun Krishna" style={{ fontSize: "18px !important", fontWeight: "700" }} />
                            </div>

                            <div className="adm-grid-2">
                                <div>
                                    <label className="adm-label">Admission No *</label>
                                    <input className="adm-input" name="admission_number" value={formData.admission_number} onChange={handleChange} required style={{ fontWeight: "800", color: "#4F46E5 !important", letterSpacing: "1px" }} />
                                </div>
                                <div>
                                    <label className="adm-label">Date of Admission</label>
                                    <input type="date" className="adm-input" name="admission_date" value={formData.admission_date} onChange={handleChange} />
                                </div>
                            </div>

                            {/* Class pills */}
                            <div>
                                <label className="adm-label">Class *</label>
                                <div style={{ display: "flex", gap: "10px" }}>
                                    {["8", "9", "10"].map(cls => (
                                        <button key={cls} type="button" className={`class-pill${formData.class_standard === cls ? " active" : ""}`} onClick={() => setFormData({ ...formData, class_standard: cls })}>
                                            Class {cls}
                                        </button>
                                    ))}
                                    <div style={{ width: "1px", background: "#E5E7EB", margin: "0 6px" }} />
                                    {/* Division pills */}
                                    {["A", "B", "C", ""].map(div => (
                                        <button key={div || "none"} type="button" className={`class-pill${formData.division === div ? " active" : ""}`} onClick={() => setFormData({ ...formData, division: div })} style={{ minWidth: "52px" }}>
                                            {div || "—"}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── TWO COLUMN: PERSONAL + GUARDIAN ── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>

                    {/* ── SECTION 2: PERSONAL DETAILS ── */}
                    <div className="adm-section">
                        <div className="adm-section-title" style={{ color: "#0369A1", borderColor: "#BAE6FD" }}>
                            <span style={{ fontSize: "18px" }}>👤</span> Personal Details
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                            <div className="adm-grid-2">
                                <div>
                                    <label className="adm-label">Date of Birth</label>
                                    <input type="date" className="adm-input" name="dob" value={formData.dob} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="adm-label">Gender</label>
                                    <div style={{ display: "flex", gap: "8px" }}>
                                        <button type="button" className={`gender-btn male${formData.gender === "Male" ? " active" : ""}`} onClick={() => setFormData({ ...formData, gender: "Male" })}>♂ Male</button>
                                        <button type="button" className={`gender-btn female${formData.gender === "Female" ? " active" : ""}`} onClick={() => setFormData({ ...formData, gender: "Female" })}>♀ Female</button>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="adm-label">School</label>
                                <input className="adm-input" name="school_name" value={formData.school_name} onChange={handleChange} placeholder="Current School Name" />
                            </div>
                            <div>
                                <label className="adm-label">Address</label>
                                <textarea className="adm-input" name="address" value={formData.address} onChange={handleChange} placeholder="House Name, Street, Post Office" style={{ height: "72px", resize: "vertical" }} />
                            </div>
                            <div className="adm-grid-2">
                                <div>
                                    <label className="adm-label">Bus Stop</label>
                                    <input className="adm-input" name="bus_stop" value={formData.bus_stop} onChange={handleChange} />
                                </div>
                                <div>
                                    <label className="adm-label">Panchayat</label>
                                    <input className="adm-input" name="panchayat" value={formData.panchayat} onChange={handleChange} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── SECTION 3: GUARDIAN INFO ── */}
                    <div className="adm-section">
                        <div className="adm-section-title" style={{ color: "#B45309", borderColor: "#FDE68A" }}>
                            <span style={{ fontSize: "18px" }}>👪</span> Guardian Info
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                            {/* Father */}
                            <div style={{ background: "linear-gradient(135deg,#EFF6FF,#DBEAFE)", borderRadius: "12px", padding: "16px", border: "1px solid #BFDBFE" }}>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>👨 Father / Guardian</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <input className="adm-input" name="father_name" value={formData.father_name} onChange={handleChange} placeholder="Full Name" />
                                    <div className="adm-grid-2">
                                        <input className="adm-input" name="father_occupation" value={formData.father_occupation} onChange={handleChange} placeholder="Occupation" />
                                        <input className="adm-input" name="father_phone" value={formData.father_phone} onChange={handleChange} placeholder="Phone" />
                                    </div>
                                </div>
                            </div>
                            {/* Mother */}
                            <div style={{ background: "linear-gradient(135deg,#FDF2F8,#FCE7F3)", borderRadius: "12px", padding: "16px", border: "1px solid #FBCFE8" }}>
                                <div style={{ fontSize: "11px", fontWeight: "800", color: "#9D174D", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "12px" }}>👩 Mother</div>
                                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                                    <input className="adm-input" name="mother_name" value={formData.mother_name} onChange={handleChange} placeholder="Full Name" />
                                    <div className="adm-grid-2">
                                        <input className="adm-input" name="mother_occupation" value={formData.mother_occupation} onChange={handleChange} placeholder="Occupation" />
                                        <input className="adm-input" name="mother_phone" value={formData.mother_phone} onChange={handleChange} placeholder="Phone" />
                                    </div>
                                </div>
                            </div>
                            {/* WhatsApp */}
                            <div>
                                <label className="adm-label">WhatsApp Number</label>
                                <div style={{ position: "relative" }}>
                                    <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "16px" }}></span>
                                    <input className="adm-input" name="whatsapp_number" value={formData.whatsapp_number} onChange={handleChange} placeholder="Primary contact for messages" style={{ paddingLeft: "38px !important" }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── SECTION 4: ADDITIONAL INFO ── */}
                <div className="adm-section">
                    <div className="adm-section-title" style={{ color: "#7C3AED", borderColor: "#DDD6FE" }}>
                        <span style={{ fontSize: "18px" }}>📝</span> Additional Info
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                        <div>
                            <label className="adm-label">Remarks</label>
                            <input className="adm-input" name="remarks" value={formData.remarks} onChange={handleChange} placeholder="Medical issues, talents, or other notes..." />
                        </div>
                        {formData.class_standard === "10" && (
                            <div style={{ padding: "18px 20px", background: "linear-gradient(135deg,#ECFDF5,#D1FAE5)", borderRadius: "12px", border: "1px dashed #34D399", display: "flex", alignItems: "center", gap: "16px" }}>
                                <span style={{ fontSize: "28px" }}>🎓</span>
                                <div style={{ flex: 1 }}>
                                    <label className="adm-label" style={{ color: "#065F46" }}>SSLC Registration No <span style={{ color: "#EF4444" }}>*</span></label>
                                    <input className="adm-input" name="sslc_number" value={formData.sslc_number} onChange={handleChange} placeholder="Required for Class 10 only" style={{ borderColor: "#34D399 !important" }} />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ── SUBMIT BUTTON ── */}
                <button type="submit" style={{
                    width: "100%", padding: "18px", marginTop: "4px",
                    background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)",
                    color: "white", border: "none", borderRadius: "16px",
                    fontSize: "17px", fontWeight: "800", cursor: "pointer",
                    boxShadow: "0 8px 25px rgba(79,70,229,0.4)",
                    letterSpacing: "0.5px", transition: "transform 0.2s, box-shadow 0.2s"
                }}
                    onMouseOver={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 30px rgba(79,70,229,0.5)"; }}
                    onMouseOut={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = "0 8px 25px rgba(79,70,229,0.4)"; }}
                >
                    ✅ Save & Admit Student
                </button>

            </form>

            {/* ── RECENT ADMISSIONS ── */}
            <div style={{ marginTop: "40px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                    <span style={{ fontSize: "18px" }}>📜</span>
                    <h3 style={{ margin: 0, color: "var(--text-primary, #111827)", fontSize: "16px", fontWeight: "800" }}>Recent Admissions</h3>
                    <div style={{ flex: 1, height: "1px", background: "var(--border-color, #E5E7EB)", marginLeft: "8px" }} />
                </div>
                <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid var(--border-color, #E5E7EB)", background: "var(--bg-card, #fff)" }}>
                    {recentAdmissions.length === 0
                        ? <p style={{ padding: "24px", textAlign: "center", color: "var(--text-muted, #9CA3AF)" }}>No recent admissions found.</p>
                        : (
                            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                                <thead>
                                    <tr style={{ background: "linear-gradient(135deg,#4F46E5,#7C3AED)", color: "white" }}>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700" }}>Adm No</th>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700" }}>Student Name</th>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700" }}>Class</th>
                                        <th style={{ padding: "12px 16px", textAlign: "left", fontWeight: "700" }}>School</th>
                                        <th style={{ padding: "12px 16px", textAlign: "right", fontWeight: "700" }}>Joined</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentAdmissions.map((s, idx) => (
                                        <tr key={idx} className="recent-row" style={{ borderBottom: "1px solid var(--border-color, #F3F4F6)", background: idx % 2 === 0 ? "transparent" : "rgba(79,70,229,0.02)" }}>
                                            <td style={{ padding: "12px 16px", fontWeight: "800", color: "#4F46E5" }}>{s.adm}</td>
                                            <td style={{ padding: "12px 16px", fontWeight: "600", color: "var(--text-primary, #111827)" }}>{s.name}</td>
                                            <td style={{ padding: "12px 16px", color: "var(--text-secondary, #6B7280)" }}>{s.class} {s.div}</td>
                                            <td style={{ padding: "12px 16px", color: "var(--text-secondary, #6B7280)" }}>{s.school || "—"}</td>
                                            <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--text-muted, #9CA3AF)", fontSize: "13px" }}>{s.date || "N/A"}</td>
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