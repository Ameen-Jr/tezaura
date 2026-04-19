import React, { useState } from 'react';
import SafeLottie from './SafeLottie';
import spaceBoyAnim from './space boy developer.json';
import favicon from './favicon.png';

// Opens URLs in the system default browser when running inside Tauri
const openExternal = (url) => {
  import('@tauri-apps/api/core')
    .then(({ invoke }) => invoke('open_url', { url }))
    .catch(() => window.open(url, '_blank'));
};

const About = () => {
  const [activeCard, setActiveCard] = useState('product'); // 'product' or 'dev'
  const [showModal, setShowModal] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [showTnC, setShowTnC] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Function to handle email copy inside modal
  const handleCopyInsideModal = (text) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000); // Reset after 2 seconds
  };

  return (
    <div className="portfolio-wrapper">
      {/* 1. LOAD ICONS FROM CDN */}
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.3/css/all.min.css" />

      <style>{`
        /* --- FONTS --- */
        @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;900&family=Righteous&family=Inter:wght@400;600;800&display=swap');

        /* --- LAYOUT & ATMOSPHERE --- */
        .portfolio-wrapper {
          height: 100vh;
          width: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
          font-family: 'Inter', system-ui, sans-serif;
          background-color: #f8fafc;
          perspective: 1200px;
          overflow: hidden;
          color: #1e293b;
        }

        /* Blobs */
        .blob-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; z-index: 0; pointer-events: none; }
        .blob { position: absolute; filter: blur(80px); opacity: 0.6; border-radius: 50%; animation: blob-float 10s infinite alternate; }
        .blob-1 { top: -10%; left: -5%; width: 600px; height: 600px; background: #c4b5fd; animation-delay: 0s; }
        .blob-2 { bottom: -10%; right: -5%; width: 500px; height: 500px; background: #a7f3d0; animation-delay: 2s; }
        .blob-3 { bottom: 30%; left: 30%; width: 400px; height: 400px; background: #fde68a; animation-delay: 4s; }
        @keyframes blob-float { 0% { transform: translate(0,0); } 100% { transform: translate(30px, 30px); } }

        /* --- DECK & CARD --- */
        .deck-container { position: relative; width: 500px; height: 640px; display: flex; justify-content: center; align-items: center; z-index: 10; }

        .glass-card {
          position: absolute; width: 100%; height: 100%;
          background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(20px);
          border-radius: 30px; border: 1px solid rgba(255, 255, 255, 0.9);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 12px; padding: 40px;
          transition: all 0.7s cubic-bezier(0.2, 0.8, 0.2, 1);
          backface-visibility: hidden;
        }

        .card-product { z-index: 20; }
        .card-product.inactive { transform: translateY(50px) scale(0.9) rotateX(-5deg); opacity: 0; z-index: 10; pointer-events: none; }
        .card-product.active { transform: translateY(0) scale(1) rotateX(0); opacity: 1; z-index: 20; }

        .card-dev { z-index: 10; }
        .card-dev.inactive { transform: translateY(-50px) scale(0.9) rotateX(5deg); opacity: 0; z-index: 10; pointer-events: none; }
        .card-dev.active { transform: translateY(0) scale(1) rotateX(0); opacity: 1; z-index: 20; }

        /* --- CONTENT STYLES --- */
        .app-icon-container {
          width: 85px; height: 85px; display: flex; align-items: center; justify-content: center;
          animation: float 6s ease-in-out infinite; margin-bottom: 5px;
          filter: drop-shadow(0 15px 25px rgba(37, 99, 235, 0.25));
        }
        .app-logo-img { width: 100%; height: 100%; object-fit: contain; }

        .title-large { font-size: 38px; font-weight: 900; color: #1e293b; margin: 0; letter-spacing: -1px; }
        .subtitle { font-size: 13px; text-transform: uppercase; letter-spacing: 2px; color: #64748b; font-weight: 700; }
        
        .dev-name-font {
            font-family: 'Orbitron', sans-serif; font-size: 36px; font-weight: 900;
            background: linear-gradient(135deg, #1e293b 0%, #4f46e5 100%);
            -webkit-background-clip: text; -webkit-text-fill-color: transparent;
            margin-top: -10px;
            margin-bottom: 5px;
        }

        /* HIGHLIGHTED ROLE */
        .dev-role-highlight {
            font-size: 14px; 
            text-transform: uppercase; 
            letter-spacing: 1.5px; 
            color: #334155; 
            font-weight: 800;
            background: linear-gradient(to right, #334155, #475569);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-top: 0px;
            border-bottom: 2px solid #e2e8f0;
            padding-bottom: 5px;
        }

        .edition-label {
            font-size: 11px; text-transform: uppercase; letter-spacing: 1px;
            color: #2563EB; background: #eff6ff; padding: 6px 18px; border-radius: 50px; border: 1px solid #60a5fa;
            font-weight: 800; margin-top: 5px; animation: neon-pulse 2s infinite ease-in-out;
        }
        .version-badge {
          margin: 15px 0; background: #fffbeb; color: #d97706; border: 1px solid #fcd34d;
          padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 700;
        }
        @keyframes neon-pulse {
            0% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.4); border-color: #60a5fa; }
            50% { box-shadow: 0 0 20px rgba(37, 99, 235, 0.6), 0 0 10px rgba(37, 99, 235, 0.4) inset; border-color: #3b82f6; }
            100% { box-shadow: 0 0 5px rgba(37, 99, 235, 0.4); border-color: #60a5fa; }
        }

        .desc-text { text-align: center; color: #475569; line-height: 1.6; font-size: 15px; max-width: 90%; margin: 0; }

        /* --- TECH TAGS --- */
        .tag-container { display: flex; flex-wrap: wrap; gap: 10px; justify-content: center; max-width: 450px; }
        .glow-tag { padding: 8px 16px; border-radius: 30px; font-size: 12px; font-weight: 700; transition: 0.3s; cursor: default; border: 1px solid transparent; display: flex; align-items: center; gap: 6px; }
        
        .glow-tag.react { background: #ECFDF5; color: #059669; } .glow-tag.react:hover { background: #059669; color: white; transform: scale(1.1); box-shadow: 0 0 20px rgba(5, 150, 105, 0.6); }
        .glow-tag.python { background: #FFFBEB; color: #D97706; } .glow-tag.python:hover { background: #D97706; color: white; transform: scale(1.1); box-shadow: 0 0 20px rgba(217, 119, 6, 0.6); }
        .glow-tag.db { background: #EFF6FF; color: #2563EB; } .glow-tag.db:hover { background: #2563EB; color: white; transform: scale(1.1); box-shadow: 0 0 20px rgba(37, 99, 235, 0.6); }
        .glow-tag.ui { background: #FDF2F8; color: #DB2777; } .glow-tag.ui:hover { background: #DB2777; color: white; transform: scale(1.1); box-shadow: 0 0 20px rgba(219, 39, 119, 0.6); }
        .glow-tag.sys { background: #F3E8FF; color: #7E22CE; } .glow-tag.sys:hover { background: #7E22CE; color: white; transform: scale(1.1); box-shadow: 0 0 20px rgba(126, 34, 206, 0.6); }
        
        /* AUTOMATION TAG (Cyan/Teal) */
        .glow-tag.auto { background: #ecfeff; color: #0891b2; } 
        .glow-tag.auto:hover { background: #06b6d4; color: white; transform: scale(1.1); box-shadow: 0 0 20px rgba(6, 182, 212, 0.6); }

        .glow-tag.lottie { background: #F0FDF4; color: #15803d; } .glow-tag.lottie:hover { background: #16a34a; color: white; transform: scale(1.1); box-shadow: 0 0 20px rgba(22, 163, 74, 0.6); }

        /* --- SOCIAL BUTTONS (CODEPEN STYLE) --- */
        .social-row {
            display: flex; justify-content: center; align-items: center; gap: 15px; width: 100%; margin-top: 15px;
        }

        .icon-button {
            background-color: white;
            border-radius: 50%; /* Perfect Circle */
            cursor: pointer;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 55px; /* Size adjusted for card */
            height: 55px;
            font-size: 24px;
            text-decoration: none;
            position: relative;
            border: 1px solid #e2e8f0;
            transition: all 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.05);
            overflow: hidden; /* Key for the fill effect */
        }

        /* The Filling Circle */
        .icon-button span {
            border-radius: 0;
            display: block;
            height: 0;
            width: 0;
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.3s;
            z-index: 0;
            border-radius: 50%;
        }

        .icon-button:hover span {
            width: 110%; height: 110%; /* Fills the whole button */
        }

        /* Icons */
        .icon-button i {
            position: relative;
            z-index: 10;
            transition: all 0.3s;
        }

        /* Specific Colors */
        .icon-button.linkedin i { color: #0077b5; }
        .icon-button.linkedin span { background-color: #0077b5; }
        
        .icon-button.github i { color: #333; }
        .icon-button.github span { background-color: #333; }

        .icon-button.gmail i { color: #db4437; }
        .icon-button.gmail span { background-color: #db4437; }

        /* Hover State Text Color */
        .icon-button:hover i { color: white; }
        
        /* Initial Button Hover Movement */
        .icon-button:hover { transform: translateY(-3px); box-shadow: 0 10px 20px rgba(0,0,0,0.15); }


        .swap-btn {
          background: transparent; color: #64748b; border: 1px solid #e2e8f0;
          padding: 10px 20px; border-radius: 10px; font-size: 12px; cursor: pointer;
          transition: 0.3s; margin-top: 10px;
        }
        .swap-btn:hover { background: #f1f5f9; color: #334155; }

        .copyright { font-size: 11px; color: #94a3b8; font-weight: 600; margin-top: 5px; }
        
        /* --- HIRE ME MODAL --- */
        .modal-overlay {
          position: absolute; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(5px);
          display: flex; justify-content: center; align-items: center;
          z-index: 100; animation: fadeIn 0.3s;
        }
        .modal-box {
          background: white; width: 340px; padding: 30px; border-radius: 24px;
          text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.25);
          animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .contact-row {
          display: flex; align-items: center; gap: 12px; background: #f1f5f9;
          padding: 12px; border-radius: 12px; margin-top: 12px; cursor: pointer;
          transition: 0.2s; border: 1px solid #e2e8f0;
        }
        .contact-row:hover { background: #e2e8f0; border-color: #cbd5e1; transform: translateX(5px); }
        
        @keyframes float { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes scaleIn { from { transform: scale(0.8); opacity: 0; } to { transform: scale(1); opacity: 1; } }

      `}</style>

      <div className="blob-container">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="deck-container">

        {/* --- CARD 1: PRODUCT INFO --- */}
        <div
          className={`glass-card card-product ${activeCard === 'product' ? 'active' : 'inactive'}`}
          onClick={() => activeCard === 'product' ? null : setActiveCard('product')}
        >
          <div className="app-icon-container">
            <img src={favicon} alt="Logo" className="app-logo-img" />
          </div>

          <h1 className="title-large">TEZAURA</h1>
          <div className="subtitle">Academic ERP System</div>

          <div className="edition-label">UNIVERSAL TRUST EDITION</div>
          <div className="version-badge">v1.0.0 Stable Build</div>

          <p className="desc-text">
            A complete enterprise solution for managing students, fees, libraries, and academic records.
            Engineered for speed, security, and simplicity.
          </p>

          <div className="tag-container">
            <span className="glow-tag react">⚛️ React JS</span>
            <span className="glow-tag python">🐍 Python FastAPI</span>
            <span className="glow-tag db">🗄️ SQLite</span>
            <span className="glow-tag sys">🔐 Local-First</span>
            <span className="glow-tag lottie">✨ LottieFiles</span>
          </div>

          <div style={{ width: "100%", marginTop: "10px", display: 'flex', justifyContent: 'center' }}>
            <button className="swap-btn" style={{ background: "#1e293b", color: "white", padding: "14px 30px", fontSize: "14px", border: "none" }}
              onClick={(e) => { e.stopPropagation(); setActiveCard('dev'); }}>
              Meet The Developer →
            </button>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            <button onClick={(e) => { e.stopPropagation(); setShowTnC(true); }} style={{ padding: '5px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Terms &amp; Conditions</button>
            <button onClick={(e) => { e.stopPropagation(); setShowPrivacy(true); }} style={{ padding: '5px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Privacy Policy</button>
          </div>
          <div className="copyright">© 2026 Tezaura. All Rights Reserved.</div>
        </div>

        {/* --- CARD 2: DEVELOPER PROFILE --- */}
        <div
          className={`glass-card card-dev ${activeCard === 'dev' ? 'active' : 'inactive'}`}
          onClick={() => activeCard === 'dev' ? null : setActiveCard('dev')}
        >
          <div style={{ width: "200px", height: "180px", marginTop: "-20px" }}>
            <SafeLottie animationData={spaceBoyAnim} />
          </div>

          <h2 className="dev-name-font">Ameen Jawhar</h2>

          {/* HIGHLIGHTED ROLE */}
          <div className="dev-role-highlight">Full Stack Engineer & UI/UX Designer</div>

          <p className="desc-text" style={{ marginTop: "20px" }}>
            "I build digital products that bridge the gap between complex logic and beautiful design.
            Tezaura is my flagship project."
          </p>

          <div className="tag-container">
            <span className="glow-tag ui">🎨 UI/UX Design</span>
            <span className="glow-tag db">📊 Data Vis</span>
            <span className="glow-tag sys">⚡ System Arch</span>
            <span className="glow-tag python">🐍 REST APIs</span>
            <span className="glow-tag react">💻 Full Stack</span>

            {/* NEW CYAN AUTOMATION TAG */}
            <span className="glow-tag auto">🤖 Automation</span>
          </div>

          {/* --- SOCIAL BUTTONS --- */}
          <div className="social-row">
            <div onClick={() => openExternal('https://www.linkedin.com/in/ameen-jawhar')} className="icon-button linkedin" style={{ cursor: 'pointer' }}>
              <i className="fab fa-linkedin-in"></i>
              <span></span>
            </div>

            <div onClick={() => openExternal('https://github.com/Ameen-Jr')} className="icon-button github" style={{ cursor: 'pointer' }}>
              <i className="fab fa-github"></i>
              <span></span>
            </div>

            {/* GMAIL BUTTON -> OPENS MODAL (FIXED SHAPE) */}
            <div
              className="icon-button gmail"
              onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
            >
              <i className="fas fa-envelope"></i>
              <span></span>
            </div>
          </div>

          <button className="swap-btn" onClick={(e) => { e.stopPropagation(); setActiveCard('product'); }}>
            ← Back to App Info
          </button>

        </div>

      </div>

      {/* --- HIRE ME MODAL --- */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>👋</div>
            <h2 style={{ color: "#1e293b", margin: 0, fontFamily: "'Righteous', cursive" }}>Let's Connect!</h2>
            <p style={{ color: "#64748b", fontSize: "14px", marginTop: "5px" }}>
              I'm open for freelance projects and internships.
            </p>

            {/* EMAIL ROW - CLICK TO COPY */}
            <div className="contact-row" onClick={() => handleCopyInsideModal("ameenjawhares@gmail.com")}>
              <span style={{ fontSize: "20px" }}>📧</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "bold" }}>EMAIL</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>
                  {copyFeedback ? "Copied! ✅" : "ameenjawhares@gmail.com"}
                </div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: "12px", color: copyFeedback ? "#22c55e" : "#3b82f6" }}>
                {copyFeedback ? "✓" : "Copy"}
              </span>
            </div>

            <div className="contact-row" onClick={() => openExternal('https://www.linkedin.com/in/ameen-jawhar')}>
              <span style={{ fontSize: "20px" }}>💼</span>
              <div style={{ textAlign: "left" }}>
                <div style={{ fontSize: "11px", color: "#94a3b8", fontWeight: "bold" }}>LINKEDIN</div>
                <div style={{ fontSize: "14px", fontWeight: "600", color: "#334155" }}>Message Me</div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: "12px", color: "#3b82f6" }}>Open</span>
            </div>

            <button
              style={{ marginTop: "20px", width: "100%", padding: "12px", background: "#f1f5f9", border: "none", borderRadius: "10px", color: "#64748b", fontWeight: "bold", cursor: "pointer" }}
              onClick={() => setShowModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
      {/* --- TERMS & CONDITIONS MODAL --- */}
      {showTnC && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px' }} onClick={() => setShowTnC(false)}>
          <div style={{ background: 'white', borderRadius: '16px', width: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '32px', color: '#1e293b' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Tezaura — Terms &amp; Conditions</h2>
              <button onClick={() => setShowTnC(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '700', color: '#6b7280' }}>✕ Close</button>
            </div>
            {[{ title: '1. Ownership', body: 'Tezaura is an independently developed software application. All rights, including code, design, and functionality, are owned by the developer. This software is not part of any employment duties unless explicitly agreed in writing.' }, { title: '2. License to Use', body: 'The tuition centre is granted a non-exclusive, non-transferable license to use Tezaura for internal academic and administrative purposes only. The software may not be copied, modified, distributed, or resold without permission.' }, { title: '3. Usage Scope', body: 'Tezaura is intended for managing student records, attendance, marks, and communication. It must be used only for lawful and ethical purposes.' }, { title: '4. Data Responsibility', body: 'All data entered into Tezaura (student details, marks, phone numbers, etc.) is the responsibility of the tuition centre. The developer is not responsible for: incorrect data entry, data loss due to user actions, or failure to maintain backups.' }, { title: '5. No Warranty', body: 'Tezaura is provided "as-is" without any guarantees of uninterrupted or error-free operation. While efforts are made to ensure reliability, no warranty is provided.' }, { title: '6. Limitation of Liability', body: 'The developer shall not be held liable for: loss of data, incorrect reports or calculations, financial or operational losses, or downtime or technical issues.' }, { title: '7. Support & Maintenance', body: "Basic support may be provided at the developer's discretion. Major updates, feature additions, or customizations may require separate agreement." }, { title: '8. Termination', body: 'The developer reserves the right to suspend or terminate access if the software is misused or if agreed terms are violated. The tuition centre may stop using the software at any time.' }, { title: '9. Acceptance', body: 'By using Tezaura, the user agrees to these Terms & Conditions.' }].map(s => (
              <div key={s.title} style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', marginBottom: '5px' }}>{s.title}</div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7' }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- PRIVACY POLICY MODAL --- */}
      {showPrivacy && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5000, padding: '20px' }} onClick={() => setShowPrivacy(false)}>
          <div style={{ background: 'white', borderRadius: '16px', width: '600px', maxHeight: '85vh', overflowY: 'auto', padding: '32px', color: '#1e293b' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '2px solid #f1f5f9', paddingBottom: '16px' }}>
              <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>Tezaura — Privacy Policy</h2>
              <button onClick={() => setShowPrivacy(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px 14px', cursor: 'pointer', fontWeight: '700', color: '#6b7280' }}>✕ Close</button>
            </div>
            {[{ title: '1. Data Collected', body: 'Tezaura may store the following information: student names and academic details, attendance and marks, and contact information (phone numbers).' }, { title: '2. Purpose of Data', body: 'This data is used solely for: managing student records, generating reports and progress cards, and communication with students/parents.' }, { title: '3. Data Ownership', body: 'All data belongs to the tuition centre using Tezaura. The developer does not claim ownership of any user data.' }, { title: '4. Data Sharing', body: 'Tezaura does not share, sell, or distribute data to third parties.' }, { title: '5. Data Security', body: 'Reasonable measures are taken to protect data; however, the tuition centre is responsible for maintaining backups and ensuring secure usage.' }, { title: '6. Third-Party Services', body: 'If features like messaging (e.g., WhatsApp) are used, they are subject to the policies of those services. The developer is not responsible for restrictions or bans imposed by such platforms.' }, { title: '7. Changes to Policy', body: 'This Privacy Policy may be updated when necessary. Continued use of the app implies acceptance of any changes.' }].map(s => (
              <div key={s.title} style={{ marginBottom: '18px' }}>
                <div style={{ fontWeight: '700', fontSize: '14px', color: '#1e293b', marginBottom: '5px' }}>{s.title}</div>
                <div style={{ fontSize: '13px', color: '#475569', lineHeight: '1.7' }}>{s.body}</div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default About;