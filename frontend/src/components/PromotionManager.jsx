import React, { useState, useEffect } from 'react';
import SafeLottie from './SafeLottie';
import astroAnim from './Astronaut.json';
import API_BASE from '../config';

function PromotionManager() {
  const [step, setStep] = useState(1); // 1: Review, 2: Promote
  const [feeSettings, setFeeSettings] = useState({
    fee_class_8: 550, fee_class_9: 550, fee_class_10: 600,
    fee_class_8_old: 550, fee_class_9_old: 550, fee_class_10_old: 600,
    fee_class_8_from: "April", fee_class_9_from: "April", fee_class_10_from: "April"
});
  const [feeMessage, setFeeMessage] = useState("");
  const [reviewClass, setReviewClass] = useState("8");
  const [students, setStudents] = useState([]);
  const [selectedAdms, setSelectedAdms] = useState([]); // List of students to remove
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // Promotion State
  const [gradYear, setGradYear] = useState(new Date().getFullYear().toString());
  const [resetFees, setResetFees] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/settings/fees`)
        .then(res => res.json())
        .then(data => setFeeSettings(data))
        .catch(err => console.error("Fee settings load failed", err));
}, []);

  useEffect(() => {
    fetchStudents();
    setSelectedAdms([]);
  }, [reviewClass]);

  const fetchStudents = async () => {
    try {
        // Re-using the report endpoint to get a quick list
        const res = await fetch(`${API_BASE}/reports/index?class_std=${reviewClass}`);
        const data = await res.json();
        // Combine boys and girls into one flat list
        setStudents([...data.boys, ...data.girls]);
    } catch (err) { console.error(err); }
  };

  const toggleSelection = (adm) => {
    if (selectedAdms.includes(adm)) {
        setSelectedAdms(selectedAdms.filter(a => a !== adm));
    } else {
        setSelectedAdms([...selectedAdms, adm]);
    }
  };

  const handleBatchDiscontinue = async () => {
    if (selectedAdms.length === 0) return alert("Select students first.");
    if (!window.confirm(`Are you sure you want to remove ${selectedAdms.length} students from the active list?`)) return;

    setLoading(true);
    try {
        const res = await fetch(`${API_BASE}/students/discontinue-batch`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                admission_numbers: selectedAdms,
                reason: "Year-End Transfer/Left",
                date_left: new Date().toISOString().split('T')[0]
            })
        });
        const data = await res.json();
        if (res.ok) {
            setMessage(`✅ ${data.message}`);
            fetchStudents(); // Refresh list
            setSelectedAdms([]);
        } else {
            setMessage("❌ Error removing students.");
        }
    } catch (err) { setMessage("❌ Connection Error"); }
    setLoading(false);
  };

  const saveFeeSettings = async () => {
    try {
        const res = await fetch(`${API_BASE}/settings/fees`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(feeSettings)
        });
        if (res.ok) {
            setFeeMessage("✅ Fee settings saved!");
            setTimeout(() => setFeeMessage(""), 3000);
        } else {
            setFeeMessage("❌ Failed to save.");
        }
    } catch (err) {
        setFeeMessage("❌ Connection error.");
    }
 };

  const handleFinalPromotion = async () => {
     if (!window.confirm("⚠️ FINAL WARNING: This will graduate Class 10 and move Class 8 & 9 up. Ensure you have removed leavers first. Continue?")) return;
     
     setLoading(true);
     try {
         const res = await fetch(`${API_BASE}/promote-year-end`, {
             method: "POST", headers: { "Content-Type": "application/json" },
             body: JSON.stringify({ graduation_year: gradYear, reset_fees: resetFees })
         });
         const data = await res.json();
         if (res.ok) {
             setMessage(`🎉 SUCCESS: ${data.message}`);
             setStep(3); // Success Screen
         } else {
             setMessage("❌ Promotion Failed.");
         }
     } catch (err) { setMessage("❌ Error connecting."); }
     setLoading(false);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>
      {/* --- HEADER: ABSOLUTE POSITIONING (Guaranteed Placement) --- */}
      <div className="flex justify-between items-start mb-2" style={{ position: 'relative' }}>
          
          {/* Title (Standard Flow) */}
          <h2 className="text-2xl font-bold mt-4">🚀 Year-End Promotion Wizard</h2>
          
          {/* Astronaut (Forced to Right Edge) */}
          <div style={{ 
              position: 'absolute',
              right: '-30px',   // Pushes it slightly past the edge
              top: '-20px',     // Adjusts vertical height
              width: "180px", 
              height: "180px",
              pointerEvents: 'none' // Ensures clicks go through if it overlaps anything
          }}>
              <SafeLottie animationData={astroAnim} />
          </div>
      </div>

      {/* FEE SETTINGS CARD */}
<div className="card-glass" style={{ padding: "20px", marginBottom: "25px", border: "1px solid #e0f2fe", backgroundColor: "#f0f9ff" }}>
    <h3 style={{ margin: "0 0 15px 0", color: "#0369a1", fontSize: "16px" }}>💰 Monthly Fee Settings</h3>
    
    {/* TABLE LAYOUT */}
    <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "15px" }}>
        <thead>
            <tr style={{ backgroundColor: "#e0f2fe" }}>
                <th style={{ padding: "8px 12px", textAlign: "left", fontSize: "12px", color: "#0369a1" }}>Class</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "12px", color: "#0369a1" }}>Current Rate (₹)</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "12px", color: "#0369a1" }}>Old Rate (₹)</th>
                <th style={{ padding: "8px 12px", textAlign: "center", fontSize: "12px", color: "#0369a1" }}>New Rate From</th>
            </tr>
        </thead>
        <tbody>
            {[
                { label: "Class 8", key: "8" },
                { label: "Class 9", key: "9" },
                { label: "Class 10", key: "10" }
            ].map(({ label, key }) => (
                <tr key={key} style={{ borderBottom: "1px solid #bae6fd" }}>
                    <td style={{ padding: "10px 12px", fontWeight: "bold", color: "#374151" }}>{label}</td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <input
                            type="number"
                            value={feeSettings[`fee_class_${key}`]}
                            onChange={e => setFeeSettings(prev => ({ ...prev, [`fee_class_${key}`]: parseInt(e.target.value) || 0 }))}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "90px", fontSize: "15px", fontWeight: "bold", textAlign: "center" }}
                        />
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <input
                            type="number"
                            value={feeSettings[`fee_class_${key}_old`]}
                            onChange={e => setFeeSettings(prev => ({ ...prev, [`fee_class_${key}_old`]: parseInt(e.target.value) || 0 }))}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", width: "90px", fontSize: "15px", textAlign: "center", color: "#6b7280" }}
                        />
                    </td>
                    <td style={{ padding: "10px 12px", textAlign: "center" }}>
                        <select
                            value={feeSettings[`fee_class_${key}_from`]}
                            onChange={e => setFeeSettings(prev => ({ ...prev, [`fee_class_${key}_from`]: e.target.value }))}
                            style={{ padding: "6px 10px", border: "1px solid #cbd5e1", borderRadius: "6px", fontSize: "13px" }}
                        >
                            {["April","May","June","July","August","September","October","November","December","January","February","March"].map(m => (
                                <option key={m} value={m}>{m}</option>
                            ))}
                        </select>
                    </td>
                </tr>
            ))}
        </tbody>
    </table>

    <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
        <button
            onClick={saveFeeSettings}
            style={{ padding: "8px 20px", backgroundColor: "#0369a1", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "bold" }}
        >
            💾 Save Fee Settings
        </button>
        <span style={{ fontSize: "12px", color: "#64748b" }}>
            💡 Set "New Rate From" to April if the rate applies for the full year.
        </span>
        {feeMessage && <span style={{ fontSize: "13px", color: feeMessage.includes("✅") ? "#15803d" : "#dc2626", fontWeight: "bold" }}>{feeMessage}</span>}
    </div>
</div>

      {/* STEPPER */}
      <div style={{ display: "flex", justifyContent: "center", gap: "20px", marginBottom: "30px" }}>
        <div style={{ padding: "10px 20px", borderRadius: "20px", backgroundColor: step === 1 ? "#3498db" : "#bdc3c7", color: "white", fontWeight: "bold" }}>1. Review Leavers</div>
        <div style={{ padding: "10px 20px", borderRadius: "20px", backgroundColor: step === 2 ? "#e67e22" : "#bdc3c7", color: "white", fontWeight: "bold" }}>2. Promote All</div>
      </div>

      {message && <div style={{ textAlign: "center", padding: "15px", backgroundColor: "#d4edda", marginBottom: "20px", borderRadius: "5px" }}>{message}</div>}

      {/* STEP 1: REVIEW LEAVERS */}
      {step === 1 && (
        <div style={{ backgroundColor: "white", padding: "20px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)" }}>
            <h3>Step 1: Identify Leavers</h3>
            <p style={{ color: "#7f8c8d" }}>Select students who are <strong>NOT</strong> continuing to the next class.</p>
            
            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "15px" }}>
                <label>Review Class:</label>
                <select value={reviewClass} onChange={(e) => setReviewClass(e.target.value)} style={{ padding: "8px" }}>
                    <option value="8">Class 8</option>
                    <option value="9">Class 9</option>
                    <option value="10">Class 10</option>
                </select>
                <button onClick={fetchStudents} style={{ padding: "8px", cursor: "pointer" }}>Refresh</button>
            </div>

            <div style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #eee", padding: "10px", marginBottom: "15px" }}>
                {students.map(s => (
                    <label key={s.adm} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px", borderBottom: "1px solid #f9f9f9", cursor: "pointer", backgroundColor: selectedAdms.includes(s.adm) ? "#ffebee" : "white" }}>
                        <input type="checkbox" checked={selectedAdms.includes(s.adm)} onChange={() => toggleSelection(s.adm)} />
                        <strong>{s.name}</strong> <small>({s.adm})</small>
                    </label>
                ))}
                {students.length === 0 && <p>No active students in this class.</p>}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button 
                    onClick={handleBatchDiscontinue} 
                    disabled={selectedAdms.length === 0 || loading}
                    style={{ padding: "10px 20px", backgroundColor: "#c0392b", color: "white", border: "none", borderRadius: "5px", cursor: "pointer", opacity: selectedAdms.length === 0 ? 0.5 : 1 }}
                >
                    {loading ? "Processing..." : `⛔ Remove ${selectedAdms.length} Selected Students`}
                </button>

                <button onClick={() => setStep(2)} style={{ padding: "10px 20px", backgroundColor: "#3498db", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}>
                    Next Step →
                </button>
            </div>
        </div>
      )}

      {/* STEP 2: PROMOTE */}
      {step === 2 && (
        <div style={{ backgroundColor: "white", padding: "30px", borderRadius: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", textAlign: "center" }}>
            <h3>Step 2: Execute Promotion</h3>
            <p>This action is irreversible. Please confirm settings.</p>

            <div style={{ display: "inline-block", textAlign: "left", backgroundColor: "#f8f9fa", padding: "20px", borderRadius: "8px", margin: "20px 0" }}>
                <div style={{ marginBottom: "10px" }}>
                    ✅ <strong>Class 10</strong> will move to <strong>Alumni</strong> (Year: <input value={gradYear} onChange={e=>setGradYear(e.target.value)} style={{width:"60px"}}/>)
                </div>
                <div style={{ marginBottom: "10px" }}>✅ <strong>Class 9</strong> will become <strong>Class 10</strong></div>
                <div style={{ marginBottom: "10px" }}>✅ <strong>Class 8</strong> will become <strong>Class 9</strong></div>
                <div>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                        <input type="checkbox" checked={resetFees} onChange={e => setResetFees(e.target.checked)} />
                        <span>🗑️ Reset Fee Records for new year?</span>
                    </label>
                    {resetFees && (
                        <div style={{ marginTop: "8px", padding: "10px 14px", backgroundColor: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "6px", fontSize: "13px", color: "#B91C1C" }}>
                            ⚠️ <strong>Warning:</strong> This will permanently delete <strong>all fee records</strong> for every student. This cannot be undone. Only check this if you want a clean slate for the new academic year.
                        </div>
                    )}
                </div>
            </div>

            <br/>
            <button 
                onClick={handleFinalPromotion} 
                disabled={loading}
                style={{ padding: "15px 30px", fontSize: "18px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "5px", cursor: "pointer" }}
            >
                {loading ? "Promoting..." : "🚀 RUN PROMOTION"}
            </button>
             <br/><br/>
            <button onClick={() => setStep(1)} style={{ background: "none", border: "none", color: "#7f8c8d", textDecoration: "underline", cursor: "pointer" }}>← Back to Review</button>
        </div>
      )}

      {/* STEP 3: SUCCESS */}
      {step === 3 && (
        <div style={{ textAlign: "center", padding: "50px" }}>
            <h1 style={{ fontSize: "50px" }}>🎉</h1>
            <h2>New Academic Year Started!</h2>
            <p>The database has been updated successfully.</p>
        </div>
      )}

    </div>
  );
}

export default PromotionManager;