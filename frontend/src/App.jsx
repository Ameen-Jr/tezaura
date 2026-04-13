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
import Analytics from './components/Analytics';
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
            style={{
              width: "350px", marginBottom: "6px",
              display: "block"
            }}
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
            onMouseOver={(e) => e.currentTarget.style.background = "#DC2626"}
            onMouseOut={(e) => e.currentTarget.style.background = "#EF4444"}
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
  const [yearPrompt, setYearPrompt] = useState(false);
  const [promptYear, setPromptYear] = useState("");
  const [yearError, setYearError] = useState("");
  const [feePrompt, setFeePrompt] = useState(false);
  const [promptFees, setPromptFees] = useState({ fee_class_8: 550, fee_class_9: 550, fee_class_10: 600 });

  // NEW — both fetches run in parallel
  useEffect(() => {
    const loadStats = async () => {
      try {
        const [statsRes, actRes, yearRes] = await Promise.all([
          fetch(`${API_BASE}/dashboard/stats`),
          fetch(`${API_BASE}/dashboard/activity`),
          fetch(`${API_BASE}/settings/academic-year`)
        ]);
        const statsData = await statsRes.json();
        setStats(statsData);
        if (actRes.ok) {
          const actData = await actRes.json();
          setActivities(actData);
        }
        if (yearRes.ok) {
          const yearData = await yearRes.json();
          const hasBeenSet = localStorage.getItem('tezaura-year-confirmed');
          if (!hasBeenSet) {
            setPromptYear(yearData.academic_year || "2025-26");
            setYearPrompt(true);
          }
        }
      } catch (e) { console.error("Stats error", e); }
    };
    loadStats();
  }, []);

  const validateYear = (val) => /^\d{4}-\d{2}$/.test(val);

  const confirmYear = async () => {
    if (!validateYear(promptYear)) {
      setYearError("Format must be YYYY-YY  e.g. 2026-27");
      return;
    }
    try {
      await fetch(`${API_BASE}/settings/academic-year`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ academic_year: promptYear })
      });
      localStorage.setItem('tezaura-year-confirmed', '1');
      setYearPrompt(false);
      setYearError("");
      // Show fee setup next
      setFeePrompt(true);
    } catch {
      setYearError("Failed to save. Check backend connection.");
    }
  };

  const confirmFees = async () => {
    try {
      await fetch(`${API_BASE}/settings/fees`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...promptFees,
          fee_class_8_old: promptFees.fee_class_8,
          fee_class_9_old: promptFees.fee_class_9,
          fee_class_10_old: promptFees.fee_class_10,
          fee_class_8_from: "April", fee_class_9_from: "April", fee_class_10_from: "April"
        })
      });
    } catch (e) { console.error(e); }
    setFeePrompt(false);
  };

  // Helper to choose the right icon/color based on data type
  const getActivityStyle = (type) => {
    switch (type) {
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
      {/* FEE SETUP PROMPT */}
      {feePrompt && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9000 }}>
          <div style={{ background: "#1e1b4b", border: "1px solid rgba(129,140,248,0.4)", borderRadius: "20px", padding: "40px", width: "440px", boxShadow: "0 25px 60px rgba(0,0,0,0.3)", textAlign: "center" }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>💰</div>
            <h2 style={{ margin: "0 0 8px", color: "#ffffff", fontSize: "22px" }}>Set Monthly Fees</h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>Set the standard monthly fee for each class. You can change these anytime from the <strong style={{ color: "#fff" }}>Promote Year</strong> section.</p>
            {[{ label: "Class 8", key: "fee_class_8" }, { label: "Class 9", key: "fee_class_9" }, { label: "Class 10", key: "fee_class_10" }].map(({ label, key }) => (
              <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", background: "rgba(255,255,255,0.06)", borderRadius: "12px", padding: "14px 18px" }}>
                <span style={{ color: "white", fontWeight: "700", fontSize: "16px" }}>{label}</span>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: "rgba(255,255,255,0.5)", fontSize: "18px" }}>₹</span>
                  <input type="number" value={promptFees[key]} onChange={e => setPromptFees(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                    style={{ width: "90px", fontSize: "20px", fontWeight: "800", textAlign: "center", padding: "8px", borderRadius: "8px", border: "2px solid rgba(129,140,248,0.4)", background: "rgba(255,255,255,0.08)", color: "white" }} />
                </div>
              </div>
            ))}
            <button onClick={confirmFees} style={{ width: "100%", padding: "14px", borderRadius: "12px", background: "linear-gradient(to right,#4F46E5,#7C3AED)", color: "white", border: "none", fontSize: "16px", fontWeight: "bold", cursor: "pointer", marginTop: "10px" }}>
              ✅ Save & Start Using App
            </button>
            <button onClick={() => setFeePrompt(false)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", cursor: "pointer", marginTop: "12px", fontSize: "13px" }}>Skip for now</button>
          </div>
        </div>
      )}

      {/* FIRST-LAUNCH ACADEMIC YEAR PROMPT */}
      {yearPrompt && (
        <div style={{
          position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)", display: "flex", alignItems: "center",
          justifyContent: "center", zIndex: 9000
        }}>
          <div style={{
            background: "#1e1b4b", border: "1px solid rgba(129,140,248,0.4)",
            borderRadius: "20px", padding: "40px", width: "420px",
            boxShadow: "0 25px 60px rgba(0,0,0,0.3)", textAlign: "center"
          }}>
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>🎓</div>
            <h2 style={{ margin: "0 0 8px", color: "#ffffff", fontSize: "22px" }}>
              Welcome to Tezaura!
            </h2>
            <p style={{ color: "#cbd5e1", fontSize: "14px", margin: "0 0 24px", lineHeight: 1.6 }}>
              Please confirm the <strong style={{ color: "#fff" }}>current Academic Year</strong> before using the app.
              This is saved permanently and can be changed later in Promotion settings.
            </p>
            <input
              value={promptYear}
              onChange={e => { setPromptYear(e.target.value); setYearError(""); }}
              placeholder="e.g. 2026-27"
              style={{
                width: "100%", fontSize: "24px", fontWeight: "800",
                textAlign: "center", letterSpacing: "2px", padding: "14px",
                borderRadius: "10px", marginBottom: "8px",
                border: yearError ? "2px solid #EF4444" : "2px solid var(--primary)"
              }}
            />
            {yearError && <p style={{ color: "#EF4444", fontSize: "13px", margin: "0 0 12px" }}>{yearError}</p>}
            <p style={{ color: "#94a3b8", fontSize: "12px", margin: "0 0 20px" }}>
              Format: YYYY-YY &nbsp;•&nbsp; e.g. 2026-27, 2027-28
            </p>
            <button
              onClick={confirmYear}
              style={{
                width: "100%", padding: "14px", borderRadius: "10px",
                background: "linear-gradient(to right, #4F46E5, #7C3AED)",
                color: "white", border: "none", fontSize: "16px",
                fontWeight: "bold", cursor: "pointer"
              }}
            >
              ✅ Confirm & Continue
            </button>
          </div>
        </div>
      )}

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
                <div key={`${item.type}-${item.sort_date}-${item.title.slice(0, 15)}-${index}`} style={{ display: 'flex', gap: '15px', marginBottom: '20px' }}>
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

  // If intro is running, show it. If not logged in, show login.
  if (showIntro) return <CinematicIntro onComplete={() => setShowIntro(false)} />;
  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  const handleViewProfile = (student) => {
    setSelectedStudent(student);
    setView("profile");
  };

  const ICONS = {
    home: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" /><path d="M9 21V12h6v9" />
      </svg>
    ),
    search: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="10" cy="10" r="6" /><circle cx="10" cy="10" r="2.5" strokeWidth="1.4" /><line x1="14.5" y1="14.5" x2="20" y2="20" />
      </svg>
    ),
    add: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M12 9v6M9 12h6" /><path d="M8 3l2 2M16 3l-2 2" />
      </svg>
    ),
    attendance: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /><path d="M8 14l2.5 2.5L16 11" />
      </svg>
    ),
    exams: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><path d="M14 2v6h6" /><path d="M9 13h6M9 17h4" />
      </svg>
    ),
    reports: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
    analytics: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><path d="M12 3v9l5 3" />
      </svg>
    ),
    fees: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="14" rx="2" /><path d="M2 10h20" /><circle cx="12" cy="15" r="2" /><path d="M6 3l3 3M18 3l-3 3" />
      </svg>
    ),
    library: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" /><path d="M9 7h6M9 11h4" />
      </svg>
    ),
    customlist: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /><path d="M9 12h6M9 16h4" />
      </svg>
    ),
    promote: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 19V5M5 12l7-7 7 7" /><path d="M5 19h14" />
      </svg>
    ),
    settings: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
    backup: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
    about: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><path d="M12 8v4M12 16h.01" />
      </svg>
    ),
  };

  const MenuItem = ({ id, label, icon }) => {
    const isActive = view === id;
    const getIconColor = () => {
      switch (id) {
        case 'home': return '#00c2ff';
        case 'add': return '#2cc56f';
        case 'fees': return '#ffc021';
        case 'attendance': return '#ff0080';
        case 'exams': return '#ac66f5';
        default: return 'inherit';
      }
    };

    return (
      <div
        onClick={() => setView(id)}
        className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
      >
        <span className="sidebar-item-icon" style={{ color: isActive ? getIconColor() : 'inherit' }}>
          {ICONS[icon] || ICONS.home}
        </span>
        <span className="sidebar-item-label">{label}</span>
        {isActive && <div style={{ position: 'absolute', right: '10px', width: '4px', height: '4px', background: '#fff', borderRadius: '50%', boxShadow: '0 0 8px #fff' }} />}
      </div>
    );
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", backgroundColor: "#F3F4F6" }}>

      <div className="sidebar">
        {/* BRANDING HEADER */}
        <div style={{
          padding: "25px 24px",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          background: "rgba(255,255,255,0.02)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          gap: "15px",
        }}>
          <img
            src="/assets/images/favicon.png"
            alt="Tezaura"
            style={{ height: "38px", width: "38px", filter: "drop-shadow(0 0 12px #00c2ff)" }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "800", letterSpacing: "1px", color: "#fff" }}>TEZAURA</h1>
            <span style={{ fontSize: "9px", color: "#00c2ff", letterSpacing: "2px", textTransform: "uppercase" }}>Universal Edition</span>
          </div>
        </div>

        <div style={{ padding: "20px 0", flex: 1, overflowY: "auto" }}>
          <div style={{ padding: "0 20px 10px", fontSize: "12px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase" }}>Main</div>
          <MenuItem id="home" label="Dashboard" icon="home" />
          <MenuItem id="search" label="Students" icon="search" />
          <MenuItem id="add" label="Admission" icon="add" />

          <div style={{ padding: "18px 20px 8px", fontSize: "11px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.8px" }}>Academic</div>
          <MenuItem id="attendance" label="Attendance" icon="attendance" />
          <MenuItem id="exams" label="Exams & Results" icon="exams" />
          <MenuItem id="reports" label="Reports" icon="reports" />
          <MenuItem id="analytics" label="Analytics" icon="analytics" />

          <div style={{ padding: "18px 20px 8px", fontSize: "11px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.8px" }}>Finance & Admin</div>
          <MenuItem id="fees" label="Fee Collection" icon="fees" />
          <MenuItem id="library" label="Library" icon="library" />
          <MenuItem id="customlist" label="Custom Lists" icon="customlist" />
          <MenuItem id="promote" label="Promote Year" icon="promote" />

          <div style={{ padding: "18px 20px 8px", fontSize: "11px", color: "#6B7280", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.8px" }}>Software</div>
          <MenuItem id="settings" label="Settings" icon="settings" />
          <MenuItem id="backup" label="Data Backup" icon="backup" />
          <MenuItem id="about" label="About & Credits" icon="about" />

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
              {view === "reports" && "Reports"}
              {view === "analytics" && "Student Analytics"}
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
          {view === "analytics" && <Analytics />}
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
