import React, { useState, useRef } from 'react';
import SafeLottie from './SafeLottie';           
import backupAnim from './backupAnim.json';
import API_BASE from '../config';

const BackupManager = () => {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  
  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmText, setConfirmText] = useState("");
  
  const fileInputRef = useRef(null);

  // --- DOWNLOAD LOGIC ---
  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch('${API_BASE}/backup/download');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ClassFlow_Backup_${new Date().toISOString().slice(0,10)}.db`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("Backup Failed! Check backend connection.");
    }
    setDownloading(false);
  };

  // --- RESTORE LOGIC ---
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setShowModal(true); // Open the Confirmation Modal
    }
  };

  const executeRestore = async () => {
    if (confirmText !== "OVERWRITE") return;

    setRestoring(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const res = await fetch(`${API_BASE}/backup/restore`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        alert("✅ Restore Successful!\n\nThe application will now reload to apply changes.");
        window.location.reload(); // Reload app to fetch new data
      } else {
        alert("❌ Restore Failed.");
      }
    } catch (e) {
      alert("Error uploading file.");
    }
    
    setRestoring(false);
    setShowModal(false);
    setConfirmText("");
  };

  return (
    <div className="backup-wrapper">
      <style>{`
        .backup-wrapper { padding: 40px; display: flex; flex-direction: column; align-items: center; gap: 30px; }
        
        /* CARD STYLES */
        .card { background: white; width: 600px; padding: 30px; border-radius: 16px; border: 1px solid #E5E7EB; box-shadow: 0 4px 6px rgba(0,0,0,0.05); text-align: center; }
        
        .btn { padding: 12px 24px; border-radius: 8px; font-weight: bold; cursor: pointer; border: none; transition: 0.2s; font-size: 14px; }
        .btn-download { background: #ECFDF5; color: #059669; border: 1px solid #10B981; }
        .btn-download:hover { background: #10B981; color: white; }

        .danger-zone { border: 1px dashed #EF4444; background: #FEF2F2; margin-top: 20px; }
        .danger-title { color: #B91C1C; font-weight: bold; margin-bottom: 10px; display: block; }
        .btn-restore { background: #EF4444; color: white; }
        .btn-restore:hover { background: #DC2626; }

        /* CRITICAL ADVICE BOX */
        .info-text { 
            color: #6B7280; font-size: 13px; line-height: 1.5; 
            background: #F9FAFB; padding: 15px; border-radius: 8px; 
            margin-top: 20px; text-align: left; border: 1px solid #E5E7EB; 
        }

        /* MODAL OVERLAY */
        .modal-overlay {
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
            display: flex; align-items: center; justify-content: center; z-index: 1000;
        }
        .modal-content {
            background: white; padding: 30px; border-radius: 12px; width: 450px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); text-align: left;
        }
        .warning-text { color: #DC2626; font-size: 14px; background: #FEF2F2; padding: 10px; border-radius: 6px; margin: 15px 0; border-left: 4px solid #DC2626; }
        .input-confirm {
            width: 100%; padding: 10px; border: 2px solid #E5E7EB; border-radius: 6px;
            font-size: 16px; margin-bottom: 20px; text-transform: uppercase;
        }
        .modal-actions { display: flex; justify-content: flex-end; gap: 10px; }
      `}</style>

      {/* --- DOWNLOAD SECTION --- */}
      {/* --- DOWNLOAD SECTION (Updated with Animation) --- */}
      <div className="card">
        
        {/* ANIMATION CONTAINER */}
        <div style={{ width: "180px", height: "150px", margin: "0 auto 10px" }}>
            <SafeLottie animationData={backupAnim} />
        </div>

        <h2 style={{ margin: "0 0 10px 0" }}>🛡️ Data Backup</h2>
        <p style={{ color: "#6B7280", marginBottom: "25px", fontSize: "14px" }}>
            Securely save your entire database to the cloud or local drive.
        </p>
        
        <button className="btn btn-download" onClick={handleDownload} disabled={downloading}>
          {downloading ? "Generating..." : "⬇ Download Backup File"}
        </button>

        {/* CRITICAL ADVICE (Unchanged) */}
        <div className="info-text">
            <strong style={{ color: "#F59E0B" }}>⚠️ CRITICAL ADVICE:</strong>
            <br/>
            After downloading, email this file to yourself or save it to a Google Drive folder immediately. 
            If this computer is formatted, this file is your <strong>only way</strong> to restore the data.
        </div>
      </div>

      {/* --- RESTORE SECTION (DANGER ZONE) --- */}
      <div className="card danger-zone">
        <span className="danger-title">⚠️ RESTORE ZONE</span>
        <p style={{ fontSize: "13px", color: "#7F1D1D", marginBottom: "20px" }}>
          Uploading a file here will <strong>REPLACE</strong> all current student data.
        </p>
        
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileSelect} 
            style={{ display: 'none' }} 
            accept=".db"
        />
        
        <button className="btn btn-restore" onClick={() => fileInputRef.current.click()}>
          ⬆ Upload & Restore Backup
        </button>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Confirm Restore</h3>
            <p style={{ fontSize: "14px", color: "#374151" }}>
              You are about to replace the current database with: 
              <br/><strong>{selectedFile?.name}</strong>
            </p>

            <div className="warning-text">
                This action cannot be undone from the app.<br/>
                All current data will be overwritten.
            </div>

            <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>
                Type "OVERWRITE" to confirm:
            </label>
            <input 
                type="text" 
                className="input-confirm"
                placeholder="OVERWRITE"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
            />

            <div className="modal-actions">
                <button className="btn" style={{ background: "#F3F4F6" }} onClick={() => setShowModal(false)}>Cancel</button>
                <button 
                    className="btn btn-restore" 
                    onClick={executeRestore}
                    disabled={confirmText !== "OVERWRITE" || restoring}
                    style={{ opacity: confirmText === "OVERWRITE" ? 1 : 0.5 }}
                >
                    {restoring ? "Restoring..." : "Yes, Overwrite Data"}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BackupManager;