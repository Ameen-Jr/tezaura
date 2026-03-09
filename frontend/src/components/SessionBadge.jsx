import React, { useState, useEffect } from 'react';
import API_BASE from '../config';

const SessionBadge = () => {
  const [year, setYear] = useState("Loading...");

  useEffect(() => {
    // Fetch the real academic year from your backend
    const fetchYear = async () => {
      try {
        const res = await fetch(`${API_BASE}/settings/academic-year`);
        if (res.ok) {
            const data = await res.json();
            setYear(data.academic_year || "2025-26");
        }
      } catch (e) {
        setYear("2025-26"); // Fallback
      }
    };
    fetchYear();
  }, []);

  return (
    <div className="session-badge">
      <style>{`
        .session-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background-color: white;
          border: 1px solid #E5E7EB;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 13px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          transition: all 0.2s;
        }

        .session-badge:hover {
            border-color: #4F46E5;
            transform: translateY(-1px);
            box-shadow: 0 4px 6px rgba(79, 70, 229, 0.1);
        }

        .dot {
          width: 8px;
          height: 8px;
          background-color: #10B981; /* Green for Active */
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
          70% { box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
          100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        .label {
            color: #6B7280;
            font-weight: 500;
        }

        .value {
            color: #111827;
            font-weight: 800;
            letter-spacing: 0.5px;
        }
      `}</style>

      <div className="dot"></div>
      <span className="label">Academic Year:</span>
      <span className="value">{year}</span>
    </div>
  );
};

export default SessionBadge;