import React, { useState } from 'react';
import { FileText, Download, Users, Droplet, BarChart3, AlertCircle } from 'lucide-react';
import api from '../utils/api';

const REPORTS = [
  {
    key: 'dashboard-summary',
    title: 'Dashboard Summary Report',
    description: 'Full system overview — donor counts, hospital/blood bank stats, inventory levels, and recent blood requests.',
    icon: BarChart3,
    color: '#C41E3A',
    bg: 'var(--red-100)',
    filename: 'BloodCare-Dashboard-Summary.pdf',
  },
  {
    key: 'donors',
    title: 'Donors Report',
    description: 'Complete list of registered donors — name, blood group, contact, district, status, and total donations.',
    icon: Users,
    color: '#2563EB',
    bg: 'var(--blue-100)',
    filename: 'BloodCare-Donors-Report.pdf',
  },
  {
    key: 'blood-requests',
    title: 'Blood Requests Report',
    description: 'Full history of blood requests from hospitals — blood group, units, priority, and status.',
    icon: Droplet,
    color: '#D97706',
    bg: 'var(--amber-100)',
    filename: 'BloodCare-Blood-Requests-Report.pdf',
  },
];

export default function ReportsPage() {
  const [downloading, setDownloading] = useState(null);
  const [error, setError] = useState('');

  const handleDownload = async (report) => {
    setDownloading(report.key);
    setError('');
    try {
      const res = await api.get(`/reports/${report.key}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Report download error:', err);
      setError(`Failed to generate "${report.title}". Please try again.`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Reports</h1>
          <p>Generate and download PDF reports from real-time system data</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.2)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#B91C1C' }}>
          <AlertCircle size={15} /> {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
        {REPORTS.map(report => {
          const Icon = report.icon;
          const isLoading = downloading === report.key;
          return (
            <div key={report.key} className="card" style={{ padding: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: 'var(--r-sm)', background: report.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon size={22} color={report.color} />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--slate-900)', marginBottom: 8 }}>{report.title}</div>
              <div style={{ fontSize: 13, color: 'var(--slate-500)', lineHeight: 1.5, marginBottom: 20, minHeight: 60 }}>{report.description}</div>
              <button
                onClick={() => handleDownload(report)}
                disabled={isLoading}
                style={{
                  width: '100%', padding: '10px 16px', borderRadius: 'var(--r-sm)',
                  border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                  background: isLoading ? 'var(--slate-200)' : 'var(--red-600)',
                  color: isLoading ? 'var(--slate-500)' : '#fff',
                  fontSize: 13, fontWeight: 600, fontFamily: 'var(--font-body)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {isLoading ? (
                  <>Generating PDF...</>
                ) : (
                  <><Download size={15} /> Download PDF</>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24, padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileText size={18} color="var(--slate-400)" />
        <div style={{ fontSize: 12, color: 'var(--slate-500)' }}>
          All reports are generated on-demand from live database records, so the data is always current as of the moment you click download.
        </div>
      </div>
    </div>
  );
}