import React, { useState, useEffect, useRef } from 'react';
import SafeLottie from './SafeLottie';
import backupAnim from './backupAnim.json';
import API_BASE from '../config';

const BackupManager = () => {
  const [downloading, setDownloading] = useState(false);
  const [downloadMsg, setDownloadMsg] = useState("");
  const [restoring, setRestoring] = useState(false);
  const [driveStatus, setDriveStatus] = useState({ folder_configured: false, folder_id: "", last_backup: "Never", key_file_present: false, token_authorized: false });
  const [driveFolderId, setDriveFolderId] = useState("");
  const [driveUploading, setDriveUploading] = useState(false);
  const [driveMessage, setDriveMessage] = useState("");
  const [authorizing, setAuthorizing] = useState(false);

  // Modal States
  const [showModal, setShowModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [confirmText, setConfirmText] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(`${API_BASE}/settings/drive-status`)
      .then(res => res.json())
      .then(data => {
        setDriveStatus(data);
        setDriveFolderId(data.folder_id || "");
      })
      .catch(() => { });
  }, []);

  // --- DOWNLOAD LOGIC ---

  const authorizeGoogle = async () => {
    setAuthorizing(true);
    setDriveMessage("Opening browser for Google authorization... Complete the sign-in then return here.");
    try {
      const res = await fetch(`${API_BASE}/backup/drive-authorize`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDriveMessage(`✅ ${data.message}`);
        // Re-fetch status to update token_authorized
        const statusRes = await fetch(`${API_BASE}/settings/drive-status`);
        const statusData = await statusRes.json();
        setDriveStatus(statusData);
      } else {
        setDriveMessage(`❌ ${data.detail}`);
      }
    } catch {
      setDriveMessage("❌ Connection error.");
    }
    setAuthorizing(false);
    setTimeout(() => setDriveMessage(""), 6000);
  };

  const saveDriveFolder = async () => {
    if (!driveFolderId.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/settings/drive-folder`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder_id: driveFolderId.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setDriveMessage("✅ Folder ID saved!");
        setDriveStatus(prev => ({ ...prev, folder_configured: true, folder_id: driveFolderId.trim() }));
      } else {
        setDriveMessage("❌ Failed to save.");
      }
    } catch {
      setDriveMessage("❌ Connection error.");
    }
    setTimeout(() => setDriveMessage(""), 3000);
  };

  const runDriveBackupNow = async () => {
    setDriveUploading(true);
    setDriveMessage("⏳ Uploading to Google Drive...");
    try {
      const res = await fetch(`${API_BASE}/backup/drive-now`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setDriveMessage(`✅ ${data.message}`);
        setDriveStatus(prev => ({ ...prev, last_backup: new Date().toLocaleString() }));
      } else {
        setDriveMessage(`❌ ${data.detail}`);
      }
    } catch {
      setDriveMessage("❌ Connection error.");
    }
    setDriveUploading(false);
    setTimeout(() => setDriveMessage(""), 6000);
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadMsg("");
    try {
      const response = await fetch(`${API_BASE}/backup/download`);
      if (!response.ok) throw new Error(`Server error ${response.status}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tezaura_Backup_${new Date().toISOString().slice(0, 10)}.zip`;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      // Delay revoke so WebView2 has time to start the download
      setTimeout(() => window.URL.revokeObjectURL(url), 2000);
      setDownloadMsg("Downloaded to your Downloads folder.");
      setTimeout(() => setDownloadMsg(""), 5000);
    } catch (error) {
      setDownloadMsg("Backup Failed: " + error.message);
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
        {downloadMsg && (
          <div style={{
            marginTop: "12px", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold",
            backgroundColor: downloadMsg.includes("Downloaded") ? "#ECFDF5" : "#FEF2F2",
            color: downloadMsg.includes("Downloaded") ? "#065F46" : "#B91C1C",
            border: `1px solid ${downloadMsg.includes("Downloaded") ? "#A7F3D0" : "#FECACA"}`
          }}>
            {downloadMsg.includes("Downloaded") ? "✅ " : "❌ "}{downloadMsg}
          </div>
        )}

        {/* CRITICAL ADVICE (Unchanged) */}
        <div className="info-text">
          <strong style={{ color: "#F59E0B" }}>⚠️ CRITICAL ADVICE:</strong>
          <br />
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

      {/* --- GOOGLE DRIVE SECTION --- */}
      <div className="card" style={{ width: "600px" }}>
        <h3 style={{ margin: "0 0 5px 0" }}>☁️ Google Drive Auto-Backup</h3>
        <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "5px" }}>
          Uploads automatically every 7 days when the app starts. Backups older than 90 days are deleted from Drive automatically.
        </p>
        <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "20px" }}>
          Last backup: <strong>{driveStatus.last_backup}</strong>
        </p>

        {/* OAuth status indicators */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
          <div style={{
            display: "flex", alignItems: "center", gap: "8px",
            padding: "8px 12px", borderRadius: "6px",
            backgroundColor: driveStatus.key_file_present ? "#ECFDF5" : "#FEF9C3",
            border: `1px solid ${driveStatus.key_file_present ? "#A7F3D0" : "#FDE68A"}`
          }}>
            <span style={{ fontSize: "16px" }}>{driveStatus.key_file_present ? "✅" : "⚠️"}</span>
            <span style={{ fontSize: "13px", color: driveStatus.key_file_present ? "#065F46" : "#92400E", fontWeight: "bold" }}>
              {driveStatus.key_file_present ? "client_secret.json found" : "client_secret.json not found — place it next to the app"}
            </span>
          </div>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 12px", borderRadius: "6px",
            backgroundColor: driveStatus.token_authorized ? "#EFF6FF" : "#F5F3FF",
            border: `1px solid ${driveStatus.token_authorized ? "#BFDBFE" : "#DDD6FE"}`
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{driveStatus.token_authorized ? "🔑" : "🔒"}</span>
              <span style={{ fontSize: "13px", color: driveStatus.token_authorized ? "#1E40AF" : "#5B21B6", fontWeight: "bold" }}>
                {driveStatus.token_authorized ? "Authorized (token.json active)" : "Not authorized — click to sign in with Google"}
              </span>
            </div>
            {driveStatus.key_file_present && !driveStatus.token_authorized && (
              <button
                onClick={authorizeGoogle}
                disabled={authorizing}
                style={{
                  padding: "6px 14px", backgroundColor: "#4F46E5", color: "white",
                  border: "none", borderRadius: "6px", cursor: authorizing ? "not-allowed" : "pointer",
                  fontWeight: "bold", fontSize: "13px", whiteSpace: "nowrap"
                }}
              >
                {authorizing ? "Opening..." : "Authorize with Google"}
              </button>
            )}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div>
            <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px", color: "#374151" }}>
              Google Drive Folder ID
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              <input
                type="text"
                value={driveFolderId}
                onChange={e => setDriveFolderId(e.target.value)}
                placeholder="e.g. 1A2B3C4D5E6F7G8H9I0J"
                style={{
                  flex: 1, padding: "8px 12px", borderRadius: "6px",
                  border: "1px solid #E5E7EB", fontSize: "13px", fontFamily: "monospace"
                }}
              />
              <button
                onClick={saveDriveFolder}
                style={{
                  padding: "8px 16px", backgroundColor: "#ECFDF5",
                  color: "#059669", border: "1px solid #10B981",
                  borderRadius: "6px", cursor: "pointer", fontWeight: "bold",
                  whiteSpace: "nowrap"
                }}
              >
                Save
              </button>
            </div>
            <p style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "5px", marginBottom: 0 }}>
              Open the Drive folder in browser → copy the ID from the URL: drive.google.com/drive/folders/<strong>THIS_PART</strong>
            </p>
          </div>

          {driveStatus.folder_configured && driveStatus.token_authorized && (
            <button
              onClick={runDriveBackupNow}
              disabled={driveUploading}
              style={{
                padding: "10px", backgroundColor: driveUploading ? "#D1FAE5" : "#ECFDF5",
                color: "#059669", border: "1px solid #10B981",
                borderRadius: "6px", cursor: driveUploading ? "not-allowed" : "pointer",
                fontWeight: "bold", fontSize: "14px"
              }}
            >
              {driveUploading ? "⏳ Uploading..." : "⬆ Upload to Drive Now"}
            </button>
          )}

          {driveMessage && (
            <div style={{
              padding: "10px 14px", borderRadius: "6px", fontSize: "13px", fontWeight: "bold",
              backgroundColor: driveMessage.includes("✅") ? "#ECFDF5" : driveMessage.includes("⏳") ? "#EFF6FF" : "#FEF2F2",
              color: driveMessage.includes("✅") ? "#065F46" : driveMessage.includes("⏳") ? "#1E40AF" : "#B91C1C",
              border: `1px solid ${driveMessage.includes("✅") ? "#A7F3D0" : driveMessage.includes("⏳") ? "#BFDBFE" : "#FECACA"}`
            }}>
              {driveMessage}
            </div>
          )}

          {/* Setup instructions collapsible */}
          <details style={{ fontSize: "12px", color: "#6B7280" }}>
            <summary style={{ cursor: "pointer", fontWeight: "bold", color: "#374151", marginBottom: "6px" }}>
              ⚙️ First-time setup instructions (OAuth 2.0)
            </summary>
            <div style={{
              marginTop: "8px", padding: "12px", backgroundColor: "#F9FAFB",
              borderRadius: "6px", lineHeight: "1.8", border: "1px solid #E5E7EB"
            }}>
              <strong>1.</strong> Install dependency: <code style={{ backgroundColor: "#E5E7EB", padding: "1px 6px", borderRadius: "3px" }}>pip install google-auth-oauthlib google-api-python-client</code><br />
              <strong>2.</strong> Go to <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" style={{ color: "#3B82F6" }}>console.cloud.google.com</a> → New Project<br />
              <strong>3.</strong> Enable <strong>Google Drive API</strong> for the project<br />
              <strong>4.</strong> Go to <strong>APIs &amp; Services → Credentials → Create Credentials → OAuth client ID</strong><br />
              <strong>5.</strong> Application type: <strong>Desktop app</strong> → Create → Download JSON<br />
              <strong>6.</strong> Rename the downloaded file to <code style={{ backgroundColor: "#E5E7EB", padding: "1px 6px", borderRadius: "3px" }}>client_secret.json</code><br />
              <strong>7.</strong> Place <code style={{ backgroundColor: "#E5E7EB", padding: "1px 6px", borderRadius: "3px" }}>client_secret.json</code> next to <code style={{ backgroundColor: "#E5E7EB", padding: "1px 6px", borderRadius: "3px" }}>tezaura-backend.exe</code> in the install folder<br />
              <strong>8.</strong> Click <strong>"Authorize with Google"</strong> above — sign in with your Gmail and allow access<br />
              <strong>9.</strong> Create a Google Drive folder → paste its ID above → click Save<br />
              <em style={{ color: "#9CA3AF" }}>token.json will be auto-created and refreshed — you only need to authorize once.</em>
            </div>
          </details>
        </div>
      </div>

      {/* --- CONFIRMATION MODAL --- */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 style={{ margin: "0 0 10px 0" }}>⚠️ Confirm Restore</h3>
            <p style={{ fontSize: "14px", color: "#374151" }}>
              You are about to replace the current database with:
              <br /><strong>{selectedFile?.name}</strong>
            </p>

            <div className="warning-text">
              This action cannot be undone from the app.<br />
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