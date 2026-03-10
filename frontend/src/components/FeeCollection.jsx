import React, { useState, useEffect } from 'react';
import SafeLottie from './SafeLottie'; 
import feeAnim from './feeAnim.json';
import FeeGraph from './FeeGraph';
import API_BASE from '../config';

function FeeCollection() {
  const [view, setView] = useState("search");
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [feeHistory, setFeeHistory] = useState([]);
  const [paymentModal, setPaymentModal] = useState(null);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");

  const academicItems = [
    "Admission Fee", 
    "April", "May", "June", "July", "August", "September", 
    "October", "November", "December", "January", "February", "March"
  ];
  
  const currentYear = new Date().getFullYear(); 

  // --- SEARCH LOGIC ---
  const handleSearch = async (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 1) {
      const res = await fetch(`${API_BASE}/students/search?query=${val}`);
      const data = await res.json();
      setSearchResults(data.results || []);
    } else {
      setSearchResults([]);
    }
  };

  const selectStudent = async (student) => {
    setSelectedStudent(student);
    setView("grid");
    setSearchResults([]);
    setQuery("");
    fetchFeeStatus(student.admission_number);
  };

  const fetchFeeStatus = async (admNo) => {
    try {
      const res = await fetch(`${API_BASE}/fees/${admNo}`);
      const data = await res.json();
      setFeeHistory(data);
    } catch (err) { console.error(err); }
  };

  const getTargetAmount = (item) => {
    if (item === "Admission Fee") return null;
    return selectedStudent.class_standard === "10" ? 600 : 550;
    };

  const getPaidAmount = (item) => {
    const relevantFees = feeHistory.filter(record => record.month_year.includes(item));
    return relevantFees.reduce((sum, record) => sum + record.amount, 0);
  };

  // --- HANDLERS ---
  const handlePayClick = (item) => {
    const target = getTargetAmount(item);
    const paid = getPaidAmount(item);
    
    if (target !== null && paid >= target) return;

    const fullItemString = item === "Admission Fee" ? `Admission Fee ${currentYear}` : `${item} ${currentYear}`;
    
    let suggestedAmount = "";
    if (item !== "Admission Fee") {
        suggestedAmount = (target - paid).toString();
    }

    setPaymentModal(fullItemString);
    setAmount(suggestedAmount);
  };

  const confirmPayment = async (e) => {
    e.preventDefault();
    if (!amount) return;

    const payload = {
      admission_number: selectedStudent.admission_number,
      month_year: paymentModal,
      amount: parseFloat(amount),
      date_paid: new Date().toISOString().split('T')[0]
    };

    try {
      const res = await fetch(`${API_BASE}/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setMessage(`✅ Paid ₹${amount} for ${paymentModal}!`);
        fetchFeeStatus(selectedStudent.admission_number);
        setPaymentModal(null);
        setTimeout(() => setMessage(""), 3000);
      } else { setMessage("❌ Error saving fee"); }
    } catch (err) { setMessage("❌ Connection error"); }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px", fontFamily: "sans-serif" }}>

      {message && <div style={{ padding: "10px", backgroundColor: "#d4edda", color: "#155724", textAlign: "center", marginBottom: "15px", borderRadius: "5px" }}>{message}</div>}

      {/* --- VIEW: SEARCH & DASHBOARD --- */}
      {view === "search" && (
        <div style={{ animation: "fadeIn 0.5s" }}>
           
           {/* 1. STICKY SEARCH BAR (Stays at top while scrolling) */}
           <div style={{ marginBottom: "30px", position: "sticky", top: "10px", zIndex: 100 }}>
              <div style={{ 
                  background: "white", 
                  padding: "10px 15px", 
                  borderRadius: "50px", 
                  boxShadow: "0 10px 25px rgba(0,0,0,0.1)", 
                  display: "flex", 
                  alignItems: "center",
                  border: "1px solid #e2e8f0"
              }}>
                  <span style={{ fontSize: "20px", marginLeft: "10px", marginRight: "15px" }}>🔍</span>
                  <input 
                      type="text" 
                      placeholder="Search Student by Name or ID..." 
                      value={query}
                      onChange={handleSearch}
                      autoFocus
                      style={{ 
                          flex: 1, 
                          border: "none", 
                          outline: "none", 
                          fontSize: "18px", 
                          color: "#334155" 
                      }}
                  />
                  <button style={{
                      backgroundColor: "#2563eb", color: "white", border: "none", 
                      padding: "10px 25px", borderRadius: "30px", cursor: "pointer", fontWeight: "bold"
                  }}>
                      Find
                  </button>
              </div>

              {/* SEARCH RESULTS DROPDOWN (Appears only when searching) */}
              {searchResults.length > 0 && (
                 <div style={{ marginTop: "10px", background: "white", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.1)", overflow: "hidden", border: "1px solid #e2e8f0" }}>
                    {searchResults.map((student) => (
                      <div key={student.admission_number} onClick={() => selectStudent(student)} style={{ padding: "15px", borderBottom: "1px solid #eee", cursor: "pointer", display: "flex", justifyContent: "space-between", transition: "background 0.2s" }} onMouseOver={(e) => e.currentTarget.style.backgroundColor="#f9fafb"} onMouseOut={(e) => e.currentTarget.style.backgroundColor="white"}>
                          <span style={{ fontWeight: "bold", color: "#2c3e50" }}>{student.name}</span>
                          <span style={{ color: "#7f8c8d" }}>Class {student.class_standard} {student.division}</span>
                      </div>
                    ))}
                 </div>
              )}
           </div>

           {/* 2. HEADER & ANIMATION (Sits below search) */}
           <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "30px" }}>
              <div>
                  <h1 style={{ margin: "0 0 10px 0", color: "#1e293b", fontSize: "32px" }}>Fee Collection</h1>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "16px" }}>
                      Secure payments & financial tracking.
                  </p>
              </div>
              
              {/* Lottie Animation (Top Right) */}
              <div style={{ width: "200px", height: "200px" }}>
                  <SafeLottie animationData={feeAnim} />
              </div>
           </div>

           {/* 3. FEE TRENDS GRAPH (Pure SVG - Crash Proof) */}
           <div className="card-glass" style={{ 
              height: "350px", 
              borderRadius: "20px", 
              marginBottom: "40px",
              backgroundColor: "white",
              padding: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
              border: "1px solid #f1f5f9"
           }}>
              <FeeGraph />
           </div>

        </div>
      )}

      {/* --- GRID VIEW --- */}
      {view === "grid" && selectedStudent && (
        <div className="animate-row">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                    <h3 style={{ margin: "0", color: "#2c3e50" }}>{selectedStudent.name}</h3>
                    <span style={{ color: "#7f8c8d" }}>Class {selectedStudent.class_standard} (Target: ₹{selectedStudent.class_standard === "10" ? 600 : 550})</span>
                </div>
                <button onClick={() => setView("search")} style={{ padding: "8px 15px", cursor: "pointer", backgroundColor: "#95a5a6", color: "white", border: "none", borderRadius: "5px" }}>← Change Student</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "15px" }}>
                {academicItems.map((item) => {
                    const target = getTargetAmount(item);
                    const paid = getPaidAmount(item);
                    const isAdmission = item === "Admission Fee";
                    
                    let percentage = 0;
                    if (isAdmission) {
                        percentage = paid > 0 ? 100 : 0; 
                    } else {
                        percentage = Math.min((paid / target) * 100, 100);
                    }

                    const isFullyPaid = !isAdmission && paid >= target;

                    return (
                        <div 
                            key={item}
                            onClick={() => handlePayClick(item)}
                            className="card-glass"
                            style={{ 
                                height: "100px", 
                                borderRadius: "10px", 
                                display: "flex", 
                                flexDirection: "column", 
                                alignItems: "center", 
                                justifyContent: "center",
                                cursor: isFullyPaid ? "default" : "pointer",
                                border: isFullyPaid ? "2px solid #27ae60" : "1px solid #ccc",
                                position: "relative",
                                overflow: "hidden",
                                backgroundColor: "white"
                            }}
                        >
                            {/* Filling Background Animation */}
                            <div style={{
                                position: "absolute", bottom: 0, left: 0, width: `${percentage}%`, height: "100%",
                                backgroundColor: isAdmission ? "#fff3cd" : "#d4edda",
                                transition: "width 0.8s cubic-bezier(0.4, 0, 0.2, 1)", zIndex: 0
                            }}></div>

                            <div style={{ zIndex: 1, textAlign: "center" }}>
                                <span style={{ fontWeight: "bold", fontSize: isAdmission ? "14px" : "18px", display: "block", color: "#2c3e50" }}>{item}</span>
                                {paid > 0 ? (
                                    <span style={{ color: "#1e8449", fontSize: "12px", fontWeight: "bold" }}>
                                        {isAdmission ? `Paid: ₹${paid}` : `${paid} / ${target}`}
                                    </span>
                                ) : (
                                    <span style={{ color: "#e74c3c", fontSize: "12px" }}>-</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- NEW: GLASSMORPHISM MODAL (Fixes Black Shadow) --- */}
            {paymentModal && (
                <div style={{ 
                    position: "fixed", 
                    top: 0, 
                    left: 0, 
                    width: "100%", 
                    height: "100%", 
                    // BLUR EFFECT REPLACES BLACK SHADOW
                    backgroundColor: "rgba(0, 0, 0, 0.3)", 
                    backdropFilter: "blur(8px)", 
                    display: "flex", 
                    justifyContent: "center", 
                    alignItems: "center", 
                    zIndex: 1000 
                }}>
                    <div className="card-glass" style={{ 
                        backgroundColor: "white", 
                        padding: "30px", 
                        borderRadius: "15px", 
                        width: "350px", 
                        boxShadow: "0 20px 50px rgba(0,0,0,0.1)",
                        border: "1px solid rgba(255,255,255,0.8)"
                    }}>
                        <h3 style={{ marginTop: 0, color: "#2c3e50", textAlign: "center" }}>Payment for {paymentModal}</h3>
                        <p style={{ textAlign: "center", color: "#7f8c8d", fontSize: "14px", marginBottom: "20px" }}>Enter the amount received below.</p>
                        
                        <form onSubmit={confirmPayment}>
                            <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "12px", textTransform: "uppercase", color: "#95a5a6" }}>Amount (₹)</label>
                            <input 
                                type="number" 
                                value={amount} 
                                onChange={(e) => setAmount(e.target.value)} 
                                autoFocus 
                                required 
                                style={{ 
                                    width: "90%", 
                                    padding: "12px", 
                                    marginBottom: "20px", 
                                    fontSize: "20px", 
                                    borderRadius: "8px", 
                                    border: "2px solid #e0e0e0",
                                    outline: "none",
                                    fontWeight: "bold",
                                    color: "#2c3e50"
                                }} 
                            />
                            
                            <div style={{ display: "flex", gap: "10px" }}>
                                <button type="submit" style={{ flex: 1, padding: "12px", backgroundColor: "#27ae60", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", transition: "transform 0.1s" }}>Confirm Pay</button>
                                <button type="button" onClick={() => setPaymentModal(null)} style={{ flex: 1, padding: "12px", backgroundColor: "#e74c3c", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>Cancel</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
      )}
    </div>
  );
}

export default FeeCollection;