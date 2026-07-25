import React, { useState, useEffect } from 'react';
import { Award, Search, Download, Printer, QrCode, CheckCircle, X, Ban } from 'lucide-react';
import api from '../utils/api';

export default function DonorCertificatesPage() {
  const [donors, setDonors] = useState([]);
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [tab, setTab] = useState('eligible');
  const [search, setSearch] = useState('');
  const [generating, setGenerating] = useState({});
  const [qrModal, setQrModal] = useState(null);

  const fetchAll = () => {
    setLoading(true);
    setApiError('');
    Promise.all([
      api.get('/donors').catch(() => ({ data: { donors: [] } })),
      api.get('/donor-certificates').catch(() => ({ data: { certificates: [] } })),
    ]).then(([donorsRes, certRes]) => {
      setDonors(donorsRes.data?.donors || []);
      setCertificates(certRes.data?.certificates || []);
    }).catch(err => {
      console.error('Fetch certificates error:', err);
      setApiError('Could not load certificate data.');
    }).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const certifiedDonorIds = new Set(certificates.map(c => c.donor?._id));
  const eligibleDonors = donors.filter(d => d.status === 'approved' && (d.donations || 0) > 0);

  const filteredEligible = eligibleDonors.filter(d =>
    !search || d.name?.toLowerCase().includes(search.toLowerCase()) || d.nic?.includes(search)
  );
  const filteredCerts = certificates.filter(c =>
    !search || c.donorName?.toLowerCase().includes(search.toLowerCase()) || c.certificateNumber?.toLowerCase().includes(search.toLowerCase())
  );

  const generateCertificate = async (donorId) => {
    setGenerating(prev => ({ ...prev, [donorId]: true }));
    try {
      await api.post(`/donor-certificates/generate/${donorId}`);
      fetchAll();
      setTab('issued');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate certificate');
    } finally {
      setGenerating(prev => ({ ...prev, [donorId]: false }));
    }
  };

  const downloadCert = (id) => {
    api.get(`/donor-certificates/${id}/download`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'certificate.pdf');
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => alert('Failed to download certificate'));
  };

  const printCert = (id) => {
    api.get(`/donor-certificates/${id}/download`, { responseType: 'blob' })
      .then(res => {
        const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
        const win = window.open(url);
        if (win) win.onload = () => win.print();
      })
      .catch(() => alert('Failed to open certificate for printing'));
  };

  const revokeCert = async (id) => {
    if (!window.confirm('Revoke this certificate? It will show as invalid when verified via QR.')) return;
    try {
      await api.patch(`/donor-certificates/${id}/revoke`);
      fetchAll();
    } catch (err) {
      alert('Failed to revoke certificate');
    }
  };

  return (
    <div className="animate-fade">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid var(--red-600)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--red-600)', fontFamily: 'var(--font-display)' }}>{eligibleDonors.length}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Eligible for Certificate</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid var(--green-600)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--green-600)', fontFamily: 'var(--font-display)' }}>{certificates.filter(c => c.status === 'valid').length}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Issued Certificates</div>
        </div>
        <div className="card" style={{ padding: '16px 18px', borderTop: '3px solid var(--slate-400)' }}>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--slate-500)', fontFamily: 'var(--font-display)' }}>{certificates.filter(c => c.status === 'revoked').length}</div>
          <div style={{ fontSize: 12, color: 'var(--slate-500)', marginTop: 4 }}>Revoked</div>
        </div>
      </div>

      {apiError && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {apiError}
        </div>
      )}

      <div className="page-header">
        <div className="page-header-left">
          <h1>Donor Certificates</h1>
          <p>Generate, download, print and verify donation certificates</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--slate-100)', padding: 4, borderRadius: 'var(--r-sm)', width: 'fit-content' }}>
        {[
          { key: 'eligible', label: `Eligible Donors (${eligibleDonors.length})` },
          { key: 'issued', label: `Issued Certificates (${certificates.length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            padding: '7px 16px', borderRadius: 'var(--r-sm)', border: 'none', cursor: 'pointer',
            fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
            background: tab === t.key ? '#fff' : 'transparent',
            color: tab === t.key ? 'var(--slate-900)' : 'var(--slate-500)',
            boxShadow: tab === t.key ? 'var(--sh-sm)' : 'none',
          }}>{t.label}</button>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-body" style={{ padding: '14px 20px' }}>
          <div className="filters-bar">
            <div className="search-input-wrap">
              <Search size={14} />
              <input className="search-input" placeholder="Search by name, NIC, or certificate number..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
      </div>

      {tab === 'eligible' ? (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Donor</th><th>Blood Group</th><th>Total Donations</th><th>Certificate</th><th>Actions</th></tr></thead>
              <tbody>
                {loading && (<tr><td colSpan={5}><div className="empty-state"><p>Loading...</p></div></td></tr>)}
                {!loading && filteredEligible.map(d => {
                  const hasCert = certifiedDonorIds.has(d._id);
                  return (
                    <tr key={d._id}>
                      <td><div className="td-name">{d.name}</div><div className="td-sub">{d.nic}</div></td>
                      <td><span className="blood-badge">{d.bloodGroup}</span></td>
                      <td style={{ fontWeight: 700, color: 'var(--red-600)' }}>{d.donations}</td>
                      <td>
                        {hasCert
                          ? <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: 'var(--green-100)', color: 'var(--green-600)' }}>✓ Already Issued</span>
                          : <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>Not issued yet</span>}
                      </td>
                      <td>
                        <button className="action-btn btn-approve" style={{ padding: '6px 14px', fontSize: 12 }}
                          disabled={generating[d._id]}
                          onClick={() => generateCertificate(d._id)}>
                          <Award size={13} /> {generating[d._id] ? 'Generating...' : hasCert ? 'Regenerate' : 'Generate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {!loading && filteredEligible.length === 0 && (
                  <tr><td colSpan={5}>
                    <div className="empty-state">
                      <Award size={36} style={{ margin: '0 auto 12px', opacity: .3 }} />
                      <h3>No eligible donors</h3>
                      <p>Donors need at least 1 recorded donation to receive a certificate.</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-container">
            <table>
              <thead><tr><th>Certificate No.</th><th>Donor</th><th>Blood Group</th><th>Issued</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>
                {loading && (<tr><td colSpan={6}><div className="empty-state"><p>Loading...</p></div></td></tr>)}
                {!loading && filteredCerts.map(c => (
                  <tr key={c._id}>
                    <td style={{ fontSize: 12, fontFamily: 'monospace', fontWeight: 600 }}>{c.certificateNumber}</td>
                    <td>{c.donorName}</td>
                    <td><span className="blood-badge">{c.bloodGroup}</span></td>
                    <td style={{ fontSize: 12 }}>{new Date(c.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                    <td>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 100, background: c.status === 'valid' ? 'var(--green-100)' : 'var(--slate-100)', color: c.status === 'valid' ? 'var(--green-600)' : 'var(--slate-500)' }}>
                        {c.status === 'valid' ? '✓ Valid' : '✗ Revoked'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="icon-btn" title="Download PDF" onClick={() => downloadCert(c._id)}><Download size={13} /></button>
                        <button className="icon-btn" title="Print" onClick={() => printCert(c._id)}><Printer size={13} /></button>
                        <button className="icon-btn" title="QR Verify Link" onClick={() => setQrModal(c)}><QrCode size={13} /></button>
                        {c.status === 'valid' && (
                          <button className="icon-btn danger" title="Revoke" onClick={() => revokeCert(c._id)}><Ban size={13} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filteredCerts.length === 0 && (
                  <tr><td colSpan={6}>
                    <div className="empty-state">
                      <Award size={36} style={{ margin: '0 auto 12px', opacity: .3 }} />
                      <h3>No certificates issued yet</h3>
                      <p>Generate a certificate from the Eligible Donors tab.</p>
                    </div>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {qrModal && (
        <div className="modal-overlay" onClick={() => setQrModal(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Verification Link</div>
              <button onClick={() => setQrModal(null)} className="icon-btn"><X size={16} /></button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 13, color: 'var(--slate-600)', marginBottom: 12 }}>
                Anyone can scan the QR code on the PDF (or visit this link) to verify this certificate is genuine:
              </p>
              <div style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 8, padding: '10px 14px', fontSize: 12, fontFamily: 'monospace', wordBreak: 'break-all' }}>
                http://localhost:5000/api/donor-certificates/verify/{qrModal.certificateNumber}
              </div>
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--green-600)', fontSize: 13 }}>
                <CheckCircle size={16} /> QR code is embedded automatically in the downloaded PDF.
              </div>
            </div>
            <div className="modal-footer">
              <button className="action-btn btn-view" onClick={() => setQrModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}