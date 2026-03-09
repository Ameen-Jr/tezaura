import React, { useState, useEffect, useRef } from 'react';

// COMPONENTS
import AddStudent from './components/AddStudent';
import SearchStudent from './components/SearchStudent';
import StudentProfile from './components/StudentProfile';
import FeeCollection from './components/FeeCollection';
import ReportsDashboard from './components/ReportsDashboard';
import AttendanceSheet from './components/AttendanceSheet';
import ExamManager from './components/ExamManager';
import LibraryManager from './components/LibraryManager';
import PromotionManager from './components/PromotionManager';
import CustomListMaker from './components/CustomListMaker';
import InteractiveMascot from './components/InteractiveMascot';
import SafeLottie from './components/SafeLottie';
import SessionBadge from './components/SessionBadge';
import About from './components/About';
import BackupManager from './components/BackupManager';
import settingsAnim from './components/settingsAnim.json';
import API_BASE from './config';

// --- PASSWORD HASHING UTILITY ---
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

//Splash Screen 
const CinematicIntro = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 4000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="cinematic-container">
      <style>{`
        .cinematic-container {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: radial-gradient(circle at 50% 20%, #12002b, #020207 70%);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          color: white;
        }

        /* Starfield */
        .stars::before {
          content: "";
          position: absolute;
          inset: -200%;
          background-image: radial-gradient(1px 1px at 20% 30%, #fff, transparent),
                            radial-gradient(1px 1px at 80% 70%, #fff, transparent),
                            radial-gradient(1px 1px at 50% 50%, #fff, transparent);
          opacity: 0.08;
          animation: drift 60s linear infinite;
        }

        @keyframes drift {
          from { transform: translateY(0); }
          to { transform: translateY(400px); }
        }

        /* Logo pulse */
        @keyframes holoPulse {
          0%,100% { filter: drop-shadow(0 0 15px #00c2ff); transform: scale(1); }
          50% { filter: drop-shadow(0 0 35px #7000ff); transform: scale(1.04); }
        }

        /* Light sweep */
        .sweep {
          position: absolute;
          width: 120%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #00c2ff, transparent);
          top: 50%;
          animation: sweep 2.5s infinite;
          opacity: 0.4;
        }

        @keyframes sweep {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }

        /* Loading beam */
        @keyframes load {
          from { width: 0; }
          to { width: 100%; }
        }

        @keyframes editionGlow {
  0% {
    opacity: 0.2;
    text-shadow: 0 0 4px rgba(0,194,255,0.2);
  }
  50% {
    opacity: 0.85;
    text-shadow: 0 0 14px rgba(0,194,255,0.7);
  }
  100% {
    opacity: 0.4;
    text-shadow: 0 0 6px rgba(0,194,255,0.3);
  }
}


      `}</style>

      <div className="stars" />

      <img
        src="/assets/images/logo-login-dark.png"
        alt="Tezaura"
        style={{
          width: "400px",
          marginBottom: "6px",
          display: "block",
          animation: "holoPulse 3s ease-in-out infinite",
        }}
      />

      <div
        style={{
          fontSize: "12px",
          letterSpacing: "6px",
          color: "#00c2ff",
          marginTop: "2px",
          animation: "editionGlow 3s ease-in-out infinite",
          opacity: 0.7
        }}
      >
        Universal Edition
      </div>

      <div style={{
        width: "240px",
        height: "3px",
        background: "rgba(255,255,255,0.1)",
        marginTop: "40px",
        overflow: "hidden",
        borderRadius: "3px"
      }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, #00c2ff, #7000ff)",
          animation: "load 3.6s ease-out forwards",
          boxShadow: "0 0 20px #00c2ff"
        }} />
      </div>

    </div>
  );
};


//2.LoginScreen
const LoginScreen = ({ onLogin }) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const canvasRef = useRef(null);

  const handleLogin = async (e) => {
    e.preventDefault();
    const storedHash = localStorage.getItem("adminPasswordHash");
    // If no hash stored yet, compare against default hashed password
    const defaultHash = await hashPassword("admin@123");
    const inputHash = await hashPassword(password);
    const validHash = storedHash || defaultHash;
    if (inputHash === validHash) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  /* ===== LIQUID BACKGROUND ===== */
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    let width, height, particles;

    function init() {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles = Array.from({ length: 6 }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 400 + 250,
        h: Math.random() * 360,
        vx: (Math.random() - 0.5) * 1.2,
        vy: (Math.random() - 0.5) * 1.2,
      }));
    }

    let frameId;

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, width, height);

      particles.forEach(p => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        p.h += 0.3;

        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        g.addColorStop(0, `hsla(${p.h}, 85%, 60%, 0.7)`);
        g.addColorStop(1, "transparent");

        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });

      frameId = requestAnimationFrame(draw);
    }

    init();
    draw();
    window.addEventListener("resize", init);
    return () => {
      window.removeEventListener("resize", init);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div className="login-root">
      <style>{`
        :root {
          --glow-color: #00ffff;
          --border-angle: 0deg;
        }

        @property --border-angle {
          syntax: "<angle>";
          initial-value: 0deg;
          inherits: false;
        }

        .login-root {
          height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          font-family: Inter, sans-serif;
        }

        canvas {
          position: absolute;
          inset: 0;
          filter: blur(50px) contrast(160%);
          z-index: 1;
        }

        .border-wrap {
          position: relative;
          z-index: 10;
          padding: 2px;
          border-radius: 30px;
          background: conic-gradient(
            from var(--border-angle),
            transparent 70%,
            var(--glow-color),
            #ff00ff,
            var(--glow-color)
          );
          animation: rotate 4s linear infinite, float 3s ease-in-out infinite;
          box-shadow: 0 0 30px rgba(0,255,255,0.25);
        }

        @keyframes rotate {
          to { --border-angle: 360deg; }
        }

        @keyframes float {
          50% { transform: translateY(-16px); }
        }

        .glass {
          width: 350px;
          padding: 45px 35px;
          border-radius: 28px;
          background: rgba(38,13,56,0.35);
          backdrop-filter: blur(80px) saturate(200%);
          color: white;
          text-align: center;
          animation: ${error ? "shake 0.4s" : "none"};
        }

        @keyframes shake {
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }

        h2 {
          margin: 0 0 20px;
          font-weight: 300;
          letter-spacing: 8px;
          font-size: 18px;
          text-transform: uppercase;
        }

        input {
          width: 100%;
          padding: 14px;
          margin-top: 25px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 15px;
          color: white;
          text-align: center;
          outline: none;
          transition: 0.4s;
        }

        input:focus {
          border-color: var(--glow-color);
          box-shadow: 0 0 15px rgba(0,255,255,0.2);
          transform: scale(1.03);
        }

        button {
          width: 100%;
          padding: 16px;
          margin-top: 20px;
          border-radius: 15px;
          border: none;
          background: linear-gradient(90deg, #fff, rgba(255,255,255,0.7));
          font-weight: 900;
          letter-spacing: 2px;
          cursor: pointer;
          transition: 0.3s;
        }

        button:hover {
          letter-spacing: 4px;
          box-shadow: 0 0 25px var(--glow-color);
        }
      `}</style>

      <canvas ref={canvasRef} />

      <div className="border-wrap">
        <div className="glass">
          <img
            src="/assets/images/logo-login-dark.png"
            alt="Tezaura"
            style={{ width: "350px", marginBottom: "6px",
 display: "block" }}
          />
        <div
  style={{
    fontSize: "10px",
    letterSpacing: "4px",
    opacity: 0.55,
    marginBottom: "12px"
  }}
>
  UNIVERSAL EDITION
</div>

          <h2>SECURE ACCESS</h2>

          <form onSubmit={handleLogin}>
            <input
              type="password"
              placeholder="Enter Access Key"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />

            <button type="submit">PROCEED</button>
          </form>
        </div>
      </div>
    </div>
  );
};





// --- 3. SETTINGS & SECURITY COMPONENT ---
// --- 3. SETTINGS & SECURITY COMPONENT (Animation in Top Right) ---
const SettingsManager = () => {
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    
    const handleChangePassword = async () => {
        const storedHash = localStorage.getItem("adminPasswordHash");
        const defaultHash = await hashPassword("admin@123");
        const validHash = storedHash || defaultHash;
        const currentInputHash = await hashPassword(currentPass);

        if (currentInputHash !== validHash) {
            alert("❌ Current password is incorrect.");
            return;
        }
        if (newPass.length < 4) {
            alert("⚠️ New password is too short.");
            return;
        }
        if (newPass !== confirmPass) {
            alert("⚠️ New passwords do not match.");
            return;
        }
        
        const newHash = await hashPassword(newPass);
        localStorage.setItem("adminPasswordHash", newHash);
        localStorage.removeItem("adminPassword"); // Clean up old plain text key
        alert("✅ Password Updated Successfully!\n\nPlease use the new password next time.");
        setCurrentPass(""); setNewPass(""); setConfirmPass("");
    };

    return (
        <div style={{ maxWidth: "700px", margin: "0 auto", padding: "30px 20px" }}>
            
            {/* HEADER AREA: Title Left, Animation Right */}
            <div style={{ 
                display: "flex", 
                justifyContent: "space-between", 
                alignItems: "center", 
                marginBottom: "10px",
                borderBottom: "1px solid #E5E7EB",
                paddingBottom: "10px"
            }}>
                <div>
                    <h2 style={{ margin: "0 0 5px 0", color: "#111827" }}>⚙️ System Settings</h2>
                    <p style={{ margin: 0, fontSize: "13px", color: "#6B7280" }}>Manage security and configurations</p>
                </div>
                
                {/* ANIMATION (Maximum Size) */}
<div style={{ width: "280px", height: "220px", marginTop: "-40px", marginRight: "-20px" }}>
     <SafeLottie animationData={settingsAnim} />
</div>
            </div>
            
            {/* FORM AREA */}
            <div style={{ background: "#FEF2F2", border: "1px solid #FCA5A5", padding: "25px", borderRadius: "12px", marginTop: "20px" }}>
                <h3 style={{ margin: "0 0 20px 0", color: "#B91C1C", display: "flex", alignItems: "center", gap: "10px", fontSize: "16px" }}>
                    🔐 Security: Change Password
                </h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                    <div>
                        <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#7F1D1D" }}>Current Password</label>
                        <input 
                            type="password" 
                            value={currentPass} 
                            onChange={e => setCurrentPass(e.target.value)} 
                            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #FECACA", outline: "none", background: "white" }} 
                        />
                    </div>
                    
                    <div style={{ display: "flex", gap: "15px" }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#7F1D1D" }}>New Password</label>
                            <input 
                                type="password" 
                                value={newPass} 
                                onChange={e => setNewPass(e.target.value)} 
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #FECACA", outline: "none", background: "white" }} 
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: "block", fontSize: "12px", fontWeight: "bold", marginBottom: "5px", color: "#7F1D1D" }}>Confirm New</label>
                            <input 
                                type="password" 
                                value={confirmPass} 
                                onChange={e => setConfirmPass(e.target.value)} 
                                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #FECACA", outline: "none", background: "white" }} 
                            />
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleChangePassword}
                        style={{ 
                            background: "#EF4444", 
                            color: "white", 
                            padding: "12px", 
                            border: "none", 
                            marginTop: "10px", 
                            borderRadius: "8px",
                            fontWeight: "bold",
                            cursor: "pointer",
                            transition: "background 0.2s"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#DC2626"}
                        onMouseOut={(e) => e.target.style.background = "#EF4444"}
                    >
                        Update Password
                    </button>
                </div>
            </div>
            
            <p style={{ marginTop: "30px", fontSize: "13px", color: "#9CA3AF", textAlign: "center" }}>
                Tezaura Security Protocol • SHA-256 Hashed
            </p>
        </div>
    );
};

// --- DASHBOARD HOME WIDGET (Final Version) ---
function DashboardHome() {
  const [stats, setStats] = useState({ students: 0, demographics: {}, library: 0 });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
        try {
            const res = await fetch(`${API_BASE}/dashboard/stats`);
            const data = await res.json();
            setStats(data);
            // Fetch Activities
            const actRes = await fetch(`${API_BASE}/dashboard/activity`);
            if (actRes.ok) {
                const actData = await actRes.json();
                setActivities(actData);
            }
        } catch (e) { console.error("Stats error", e); }
    };
    loadStats();
  }, []);

  // Helper to choose the right icon/color based on data type
  const getActivityStyle = (type) => {
      switch(type) {
          case 'fee': return { icon: '💰', bg: '#ECFDF5' };           // Green
          case 'admission': return { icon: '🎓', bg: '#EFF6FF' };     // Blue
          case 'library_issue': return { icon: '📖', bg: '#FFF7ED' }; // Orange
          case 'library_return': return { icon: '📗', bg: '#F0FDF4' };// Light Green
          case 'absent': return { icon: '🚨', bg: '#FEF2F2' };        // Red (Alert)
          case 'exam': return { icon: '📝', bg: '#F5F3FF' };          // Purple
          default: return { icon: '🔔', bg: '#F3F4F6' };              // Grey
      }
  };

  return (
    <div style={{ animation: "fadeIn 0.5s" }}>
        
        {/* ANIMATION STYLES (Pulse Effect) */}
        <style>{`
          @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-5px); }
            100% { transform: translateY(0px); }
          }
        `}</style>

        {/* WELCOME HEADER WITH MASCOT */}
<div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "25px" }}>
    {/* Mascot floats here */}
    <div style={{ transform: "scale(1.2)" }}>
       <InteractiveMascot />
    </div>
    
    <div>
       <h2 style={{ fontSize: "28px", margin: 0, color: "#111827" }}>
         Welcome Back, Admin!
       </h2>
       <p style={{ margin: "4px 0 0", color: "#6B7280", fontSize: "14px" }}>
         Tezaura Systems are online and monitoring academic logistics.
       </p>
    </div>
</div>
        
        <div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "20px",   // 🔽 reduce vertical gap
    alignItems: "stretch"  // 🔒 equal heights
  }}
>

            
            {/* CARD 1: TOTAL STRENGTH */}
            <div className="card-glass" style={{ padding: "18px", borderLeft: "5px solid #4F46E5", position: "relative", overflow: "hidden" }}>
                <div style={{ color: "#6B7280", fontSize: "14px", fontWeight: "bold", textTransform: "uppercase" }}>Total Active Students</div>
                <div style={{ fontSize: "100px", fontWeight: "800", color: "#111827", marginTop: "5px" }}>{stats.students}</div>
                <div style={{ position: "absolute", right: "-10px", bottom: "-10px", fontSize: "80px", opacity: "0.1", transform: "rotate(-15deg)" }}>🎓</div>
            </div>

            {/* CARD 2: DEMOGRAPHICS (New Feature) */}
            <div className="card-glass" style={{ padding: "16px", borderLeft: "5px solid #F59E0B" }}>
                <div style={{ color: "#6B7280", fontSize: "14px", fontWeight: "bold", textTransform: "uppercase", marginBottom: "15px" }}>Class-wise Strength</div>
                <table style={{ width: "100%", fontSize: "14px", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ color: "#9CA3AF", textAlign: "left", fontSize: "12px", borderBottom: "1px solid #eee" }}>
                            <th style={{ paddingBottom: "5px" }}>Class</th>
                            <th style={{ paddingBottom: "5px", color: "#3B82F6" }}>Boys</th>
                            <th style={{ paddingBottom: "5px", color: "#EC4899" }}>Girls</th>
                            <th style={{ paddingBottom: "5px", textAlign: "right" }}>Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {Object.keys(stats.demographics).length === 0 ? (
                            <tr><td colSpan="4" style={{ padding: "10px", textAlign: "center", color: "#ccc" }}>No Data</td></tr>
                        ) : (
                            Object.entries(stats.demographics).map(([cls, count]) => (
                                <tr key={cls} style={{ borderBottom: "1px solid #f9f9f9" }}>
                                    <td style={{ padding: "8px 0", fontWeight: "bold" }}>Class {cls}</td>
                                    <td style={{ padding: "8px 0", color: "#3B82F6", fontWeight: "600" }}>{count.Male}</td>
                                    <td style={{ padding: "8px 0", color: "#EC4899", fontWeight: "600" }}>{count.Female}</td>
                                    <td style={{ padding: "8px 0", textAlign: "right", fontWeight: "bold" }}>{count.Male + count.Female}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* CARD 3: SYSTEM STATUS (Animated) */}
            <div className="card-glass" style={{ padding: "18px", borderLeft: "5px solid #10B981", display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ color: "#6B7280", fontSize: "14px", fontWeight: "bold", textTransform: "uppercase" }}>System Health</div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "15px", marginTop: "15px" }}>
                    {/* The Pulsing Dot */}
                    <div style={{ 
                        width: "15px", height: "15px", backgroundColor: "#10B981", borderRadius: "50%",
                        animation: "pulse-green 2s infinite" 
                    }}></div>
                    
                    <div style={{ animation: "float 3s ease-in-out infinite" }}>
                        <div style={{ fontSize: "20px", fontWeight: "700", color: "#065F46" }}>Online & Live</div>
                        <div style={{ fontSize: "12px", color: "#10B981" }}>Database Connected</div>
                    </div>
                </div>
            </div>
        </div>

            {/* --- RECENT ACTIVITY TIMELINE (Beautiful & Useful) --- */}
        <div className="card-glass" style={{ 
            backgroundColor: 'white', 
            borderRadius: '15px', 
            padding: '25px', 
            boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
            flex: 1, // Fills remaining height
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column'
        }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#111827', fontSize: '18px', fontWeight: 'bold' }}>
                ⚡ Recent Activity
            </h3>

            <div style={{ overflowY: 'auto', paddingRight: '10px' }}>
                {activities.length > 0 ? (
                    activities.map((item, index) => {
                        const style = getActivityStyle(item.type); 
                        return (
                            <div key={index} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
                                <div style={{ 
                                    minWidth: '40px', height: '40px', borderRadius: '50%', backgroundColor: style.bg, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' 
                                }}>{style.icon}</div>
                                <div>
                                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>{item.title}</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{item.message}</div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '4px' }}>{item.timestamp}</div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div style={{ textAlign: 'center', color: '#9CA3AF', padding: '20px' }}>No recent activity.</div>
                )}
            </div>
        </div>


        </div>    
  );
}

// --- MAIN APP SHELL ---
function App() {
  const [view, setView] = useState("home"); 
  const [selectedStudent, setSelectedStudent] = useState(null); 

  // --- NEW LOGIC: INTRO & LOGIN ---
  const [showIntro, setShowIntro] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Set default password if not exists
    if (!localStorage.getItem("adminPassword")) localStorage.setItem("adminPassword", "admin@123");
  }, []);

  // If intro is running, show it. If not logged in, show login.
  if (showIntro) return <CinematicIntro onComplete={() => setShowIntro(false)} />;
  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setView("profile");
  };

  const MenuItem = ({ id, label, icon, color }) => (
    <div 
        onClick={() => setView(id)}
        style={{
            padding: "12px 20px",
            margin: "5px 10px",
            cursor: "pointer",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            gap: "12px",
            backgroundColor: view === id ? "rgba(255,255,255,0.15)" : "transparent",
            color: "white",
            fontWeight: view === id ? "bold" : "normal",
            transition: "all 0.2s"
        }}
        onMouseOver={(e) => { if(view!==id) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)" }}
        onMouseOut={(e) => { if(view!==id) e.currentTarget.style.backgroundColor = "transparent" }}
    >
        <span style={{ fontSize: "18px" }}>{icon}</span>
        <span>{label}</span>
        {view === id && <div style={{ marginLeft: "auto", width: "6px", height: "6px", borderRadius: "50%", backgroundColor: color || "#4F46E5" }}></div>}
    </div>
  );

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F3F4F6" }}>
      
      {/* 1. SIDEBAR */}
      <div className="sidebar" style={{ 
          width: "260px", 
          backgroundColor: "#111827", 
          color: "white", 
          display: "flex", 
          flexDirection: "column",
          position: "fixed",
          height: "100vh",
          boxShadow: "4px 0 10px rgba(0,0,0,0.1)",
          zIndex: 100
      }}>
        
        {/* BRANDING HEADER - CLEAN & HORIZONTAL */}
<div
  style={{
    padding: "20px 24px", // More padding for premium feel
    borderBottom: "1px solid rgba(255,255,255,0.05)",
    display: "flex",
    alignItems: "center",
    gap: "15px",
  }}
>
  {/* 1. The Orb Icon (Using the Favicon for perfect square ratio) */}
  <img
    src="/assets/images/favicon.png"
    alt="Tezaura"
    style={{
      height: "38px",
      width: "38px",
      filter: "drop-shadow(0 0 12px rgba(0, 194, 255, 0.4))", // Glowing Orb
    }}
  />

  {/* 2. The Text (Styled via Code to ensure readability) */}
  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
    <h1
      style={{
        margin: 0,
        fontSize: "22px",
        fontWeight: "800",
        letterSpacing: "1px",
        background: "linear-gradient(135deg, #ffffff 0%, #94a3b8 100%)", // Silver Gradient
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        fontFamily: "sans-serif", // Or 'Orbitron' if you imported it
      }}
    >
      TEZAURA
    </h1>
    <span
      style={{
        fontSize: "9px",
        color: "#64748b",
        letterSpacing: "2.5px",
        textTransform: "uppercase",
        marginTop: "-2px"
      }}
    >
      Admin Console
    </span>
  </div>
</div>

        <div style={{ padding: "20px 0", flex: 1, overflowY: "auto" }}>
            <div style={{ padding: "0 20px 10px", fontSize: "12px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase" }}>Main</div>
            <MenuItem id="home" label="Dashboard" icon="🏠" color="#60A5FA" />
            <MenuItem id="search" label="Student" icon="🎓" color="#34D399" />
            <MenuItem id="add" label="Admission" icon="➕" />
            
            <div style={{ padding: "20px 20px 10px", fontSize: "12px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase" }}>Academic</div>
            <MenuItem id="attendance" label="Attendance" icon="📅" color="#FBBF24" />
            <MenuItem id="exams" label="Exams & Results" icon="📝" color="#F472B6" />
            {/* Reports moved HERE */}
            <MenuItem id="reports" label="Reports" icon="📊" color="#A78BFA" />
            
            <div style={{ padding: "20px 20px 10px", fontSize: "12px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase" }}>Finance & Admin</div>
            <MenuItem id="fees" label="Fee Collection" icon="💰" color="#34D399" />
            <MenuItem id="library" label="Library" icon="📚" color="#F87171" />
            
            {/* Placed directly below Library as requested */}
            <MenuItem id="customlist" label="Custom Lists" icon="📋" color="#8B5CF6" />
            
            <MenuItem id="promote" label="Promote Year" icon="🚀" color="#F472B6" />
            
            {/* 👇 NEW SOFTWARE SECTION 👇 */}
            <div style={{ padding: "20px 20px 10px", fontSize: "12px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase" }}>Software</div>
            <MenuItem id="settings" label="Settings" icon="⚙️" color="#9CA3AF" />
            <MenuItem id="backup" label="Data Backup" icon="🛡️" color="#10B981" />
            <MenuItem id="about" label="About & Credits" icon="✨" color="#60A5FA" />
            {/* 👆 END NEW SECTION 👆 */}

        </div>

        <div style={{ padding: "20px", borderTop: "1px solid #374151", backgroundColor: "#1F2937" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "35px", height: "35px", borderRadius: "50%", backgroundColor: "#4F46E5", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>A</div>
                <div>
                    <div style={{ fontSize: "14px", fontWeight: "bold" }}>Admin User</div>
                    <div style={{ fontSize: "11px", color: "#9CA3AF" }}>Online</div>
                </div>
            </div>
        </div>
      </div>

      {/* 2. MAIN CONTENT AREA */}
      <div className="main-content" style={{ flex: 1, marginLeft: "260px", padding: "30px", overflowY: "auto" }}>
        
        {/* Header */}
        <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
            <div>
                <h2 style={{ margin: 0, fontSize: "24px", color: "#111827" }}>
                    {view === "home" && "Dashboard"}
                    {view === "search" && "Student Directory"}
                    {view === "add" && "New Admission"}
                    {view === "fees" && "Fee Collection"}
                    {view === "attendance" && "Attendance Register"}
                    {view === "exams" && "Examination Control"}
                    {view === "library" && "Library Management"}
                    {view === "reports" && "Reports & Analytics"}
                    {view === "customlist" && "Custom List Generator"}
                    {view === "promote" && "Year-End Promotion"}
                    {view === "profile" && "Student Profile"}
                    {view === "settings" && "Software Settings"}
                    {view === "backup" && "Data Safety Center"}
                    {view === "about" && "About & Credits"}
                </h2>
                <p style={{ margin: "5px 0 0", color: "#6B7280", fontSize: "14px" }}>
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </p>
            </div>
            
            <div>
                <SessionBadge />
            </div>

        </div>

        {/* Content */}
        <div style={{ minHeight: "80vh", animation: "fadeIn 0.3s ease-in-out" }}>
            {view === "home" && <DashboardHome />}
            {view === "add" && <AddStudent />}
            {view === "search" && <SearchStudent onViewProfile={handleViewProfile} />}
            {view === "fees" && <FeeCollection />}
            {view === "reports" && <ReportsDashboard onViewProfile={handleViewProfile} />}
            {view === "attendance" && <AttendanceSheet />}
            {view === "exams" && <ExamManager />}
            {view === "library" && <LibraryManager />}
            {view === "customlist" && <CustomListMaker />}
            {view === "promote" && <PromotionManager />}
            {view === "profile" && (
                <StudentProfile 
                    student={selectedStudent} 
                    onBack={() => setView("search")} 
                />
            )}
            {view === "settings" && <SettingsManager />}
            {view === "backup" && <BackupManager />}
            {view === "about" && <About />}
        </div>

      </div>

       

    </div>
  );
}

export default App;
