import React, { useState, useEffect } from 'react';
import { BadgeCheck, Download } from 'lucide-react';
import api from '../utils/api';

export default function CertificatesPage() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    api.get('/donor-certificates/my')
      .then(res => setCerts(res.data?.certificates || []))
      .finally(() => setLoading(false));
  }, []);

  const download = async (id, certNumber) => {
    setDownloadingId(id);
    try {
      const res = await api.get(`/donor-certificates/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Could not download certificate. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <div className="anim-up">
      <div className="page-title">My Certificates</div>
      <div className="page-sub">Donation certificates issued to you</div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 60, color: 'var(--slate-500)' }}>Loading…</div>
      ) : certs.length === 0 ? (
        <div className="card"><div className="card-body empty-state" style={{ padding: 50 }}>
          <BadgeCheck size={32} style={{ opacity: .4, marginBottom: 10 }} />
          <h3>No certificates yet</h3>
          <p>Certificates are issued after your donations are recorded and approved.</p>
        </div></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {certs.map(c => (
            <div key={c._id} className="card" style={{ margin: 0, background: c.status === 'revoked' ? 'var(--slate-50)' : '#fff' }}>
              <div className="card-body">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <BadgeCheck size={26} color={c.status === 'revoked' ? 'var(--slate-400)' : 'var(--red-600)'} />
                  <span className={`status-badge ${c.status === 'valid' ? 'status-approved' : 'status-rejected'}`}>
                    {c.status === 'valid' ? 'Valid' : 'Revoked'}
                  </span>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{c.certificateNumber}</div>
                <div style={{ fontSize: 12.5, color: 'var(--slate-500)', marginBottom: 2 }}>
                  {c.bloodGroup} · {c.totalDonationsAtIssue} donations at issue
                </div>
                <div style={{ fontSize: 12, color: 'var(--slate-400)', marginBottom: 16 }}>
                  Issued {new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>
                <button
                  className="btn-main"
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                  disabled={downloadingId === c._id}
                  onClick={() => download(c._id, c.certificateNumber)}
                >
                  <Download size={14} /> {downloadingId === c._id ? 'Downloading…' : 'Download PDF'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}