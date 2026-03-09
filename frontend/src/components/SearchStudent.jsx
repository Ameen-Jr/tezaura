import React, { useState } from 'react';
import SafeLottie from './SafeLottie'; // <--- Import the helper
import coolAnim from './coolAnim.json'; // <--- Import your animation file
import API_BASE from '../config';

function SearchStudent({ onViewProfile }) {
  // --- EXISTING LOGIC (UNTOUCHED) ---
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState("");
  const [powerMode, setPowerMode] = useState(false);

  const handleSearch = async () => {
    if (!query) return;

    try {
      // Sends power_search=true if the toggle is ON
      const response = await fetch(`${API_BASE}/students/search?query=${query}&power_search=${powerMode}`);
      const data = await response.json();

      if (response.ok) {
        setResults(data.results);
        if (data.results.length === 0) {
            setMessage("No students found.");
        } else {
            setMessage("");
        }
      }
    } catch (error) {
      setMessage("❌ Error connecting to backend.");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "900px", margin: "0 auto", fontFamily: "sans-serif" }}>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ margin: "0 0 5px 0", color: "#1e293b", fontSize: "28px" }}>Student Directory</h2>
        <p style={{ margin: 0, color: "#64748b", fontSize: "14px" }}>Search for any student record instantly.</p>
      </div>
      {/* --- NEW ANIMATION STYLES --- */}
      <style>{`
        /* The Stack Container */
        .server-rack {
          position: relative;
          width: 140px;
          height: 160px;
          margin: 0 auto 30px auto;
          perspective: 1000px;
        }

        /* Server Blades */
        .blade {
          width: 120px;
          height: 35px;
          background: linear-gradient(90deg, #1e293b, #334155);
          border-radius: 6px;
          border: 1px solid #475569;
          position: absolute;
          left: 10px;
          box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          padding: 0 10px;
          justify-content: space-between;
          transform-style: preserve-3d;
          transition: transform 0.3s ease;
        }

        /* Stacking & Floating Animation */
        .b1 { top: 10px; z-index: 3; animation: float-stack 4s ease-in-out infinite; }
        .b2 { top: 55px; z-index: 2; animation: float-stack 4s ease-in-out infinite 0.2s; }
        .b3 { top: 100px; z-index: 1; animation: float-stack 4s ease-in-out infinite 0.4s; }

        @keyframes float-stack {
          0%, 100% { transform: translateY(0) rotateX(0); }
          50% { transform: translateY(-8px) rotateX(5deg); }
        }

        /* Status Lights (Blinking) */
        .lights { display: flex; gap: 4px; }
        .led { width: 6px; height: 6px; border-radius: 50%; background: #334155; }
        
        .b1 .led:nth-child(1) { background: #22c55e; animation: blink 1s infinite; }
        .b1 .led:nth-child(2) { background: #22c55e; animation: blink 1.5s infinite; }
        
        .b2 .led:nth-child(1) { background: #3b82f6; animation: blink 0.8s infinite; }
        .b2 .led:nth-child(3) { background: #3b82f6; animation: blink 1.2s infinite; }

        .b3 .led:nth-child(2) { background: #eab308; animation: blink 2s infinite; }

        @keyframes blink { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; box-shadow: 0 0 8px currentColor; } }

        /* The Data Scanner (Moving Bar) */
        .scanner-beam {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 2px;
          background: #4ade80;
          box-shadow: 0 0 15px #4ade80;
          opacity: 0.6;
          animation: scan-vertical 3s linear infinite;
          z-index: 10;
        }

        @keyframes scan-vertical {
          0% { top: 5px; opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { top: 150px; opacity: 0; }
        }
        
        /* Base Plate */
        .rack-base {
            position: absolute; bottom: 0; left: 0; width: 100%; height: 10px;
            background: #0f172a; border-radius: 50%;
            filter: blur(8px); opacity: 0.5;
            animation: shadow-pulse 4s infinite;
        }
        @keyframes shadow-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(0.8); } }

      `}</style>

      {/* --- POWERFUL SEARCH BAR --- */}
      {/* 1. Internal CSS for Animations */}
      <style>{`
        .search-box {
          display: flex;
          align-items: center;
          background: white;
          border-radius: 50px; /* Pill shape */
          padding: 8px 8px 8px 25px; /* Padding for text vs button */
          box-shadow: 0 4px 15px rgba(0,0,0,0.05);
          border: 2px solid transparent;
          transition: all 0.3s ease;
          margin-bottom: 30px;
        }
        .search-box:focus-within {
          /* Glows and Lifts up when typing */
          box-shadow: 0 10px 25px rgba(79, 70, 229, 0.15);
          border-color: #C7D2FE;
          transform: translateY(-2px);
        }
        .search-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 18px;
          color: #1F2937;
          background: transparent;
        }
        .search-input::placeholder { color: #9CA3AF; }
        .search-btn {
          background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
          color: white;
          border: none;
          border-radius: 40px;
          padding: 12px 35px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          transition: transform 0.2s;
          box-shadow: 0 4px 6px rgba(79, 70, 229, 0.2);
        }
        .search-btn:hover { transform: scale(1.05); }
        .search-btn:active { transform: scale(0.95); }
      `}</style>

        {/* POWER MODE TOGGLE */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "10px" }}>
          <label style={{ 
              display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", 
              background: powerMode ? "#fee2e2" : "#f1f5f9", // Red tint if ON
              padding: "8px 16px", borderRadius: "20px", transition: "0.3s"
          }}>
              <span style={{ fontSize: "13px", fontWeight: "bold", color: powerMode ? "#dc2626" : "#64748b" }}>
                  {powerMode ? "⚡ POWER SEARCH: ON" : "Active Students Only"}
              </span>
              
              {/* The Switch UI */}
              <div style={{ 
                  width: "40px", height: "22px", background: powerMode ? "#ef4444" : "#cbd5e1", 
                  borderRadius: "20px", position: "relative", transition: "0.3s" 
              }}>
                  <div style={{ 
                      width: "18px", height: "18px", background: "white", borderRadius: "50%", 
                      position: "absolute", top: "2px", 
                      left: powerMode ? "20px" : "2px", // Moves the circle
                      transition: "0.3s", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" 
                  }} />
              </div>

              <input 
                  type="checkbox" 
                  checked={powerMode} 
                  onChange={(e) => setPowerMode(e.target.checked)} 
                  style={{ display: "none" }} // Hide the real checkbox
              />
          </label>
      </div>

      {/* 2. The Bar Structure */}
      <div className="search-box">
          {/* Icon */}
          <span style={{ fontSize: "22px", marginRight: "15px", opacity: 0.5 }}>🔍</span>
          
          {/* Input Field (Invisible border) */}
          <input 
            className="search-input"
            type="text" 
            placeholder="Search by Name, Admission No, or Class..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus 
          />

          {/* Floating Gradient Button */}
          <button className="search-btn" onClick={handleSearch}>
              Find Student
          </button>
      </div>
      

      {message && <p style={{ color: message.includes("Error") ? "red" : "#7f8c8d", textAlign: "center", marginBottom: "15px" }}>{message}</p>}

      {results.length > 0 && (
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", backgroundColor: "white", borderRadius: "8px", overflow: "hidden", boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>
          <thead>
            <tr style={{ backgroundColor: "#ecf0f1", textAlign: "left", color: "#2c3e50" }}>
              <th style={{ padding: "15px" }}>Photo</th>
              <th style={{ padding: "15px" }}>Name</th>
              <th style={{ padding: "15px" }}>Class</th>
              <th style={{ padding: "15px" }}>School</th>
              <th style={{ padding: "15px" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {results.map((student) => (
              <tr key={student.admission_number} style={{ borderBottom: "1px solid #eee", transition: "background 0.2s" }}>
                <td style={{ padding: "10px 15px" }}>
                    {student.photo_path ? (
                        <img src={`${API_BASE}/photos/${student.photo_path}`} alt="student" style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: "2px solid #ddd" }} />
                    ) : ( <span style={{ fontSize: "30px" }}>👤</span> )}
                </td>
                
                <td style={{ padding: "15px", fontWeight: "bold", color: "#2c3e50" }}>{student.name}</td>
                
                <td style={{ padding: "15px" }}>{student.class_standard} {student.division ? `(${student.division})` : ""}</td>
                
                <td style={{ padding: "15px", color: "#555" }}>
                    {student.school_name || "N/A"}
                </td>
                
                <td style={{ padding: "15px" }}>
                    <button 
                        onClick={() => onViewProfile(student)}
                        style={{ padding: "8px 15px", backgroundColor: "#34495e", color: "white", border: "none", borderRadius: "4px", cursor: "pointer" }}
                    >
                        View Profile
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* --- 4. ANIMATION FOOTER (Big Version) --- */}
      <div className="card-glass" style={{ 
          marginTop: "40px", 
          padding: "0 50px", // Removed vertical padding, added horizontal
          background: "linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)", 
          borderRadius: "20px", 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          border: "1px solid #fff",
          opacity: 0.9,
          height: "350px", // <--- FIXED HEIGHT FOR THE BANNER
          overflow: "hidden" // Keeps the animation inside nicely
      }}>
          <div style={{ maxWidth: "50%", zIndex: 2 }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#334155", fontSize: "32px" }}>Universal Database</h3>
              <p style={{ margin: 0, color: "#64748b", fontSize: "18px", lineHeight: "1.6" }}>
                  A centralized, AI-powered directory for secure student record management.
              </p>
          </div>
          
          {/* --- GIANT ANIMATION CONTAINER --- */}
          <div style={{ 
              width: "500px",   // <--- HUGE WIDTH
              height: "400px",  // <--- HUGE HEIGHT
              marginRight: "-50px" // Slight negative margin to pull it to the edge
          }}>
              <SafeLottie animationData={coolAnim} />
          </div>
      </div>

    </div>  
  );
}        

export default SearchStudent;