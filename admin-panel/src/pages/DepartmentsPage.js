import React, { useState, useEffect } from 'react';
import { Building2, Users } from 'lucide-react';
import api from '../utils/api';

const DEPT_ICONS = { Administration: '🏢', 'Blood Bank': '🩸', Laboratory: '🔬', 'Donor Services': '🧑‍🤝‍🧑', Inventory: '📦', 'Emergency Unit': '🚨', 'IT Support': '💻' };

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get('/staff-hr/departments')
      .then(res => setDepartments(res.data?.departments || []))
      .catch(() => setError('Could not load department data.'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="animate-fade">
      <div className="page-header">
        <div className="page-header-left">
          <h1>Departments</h1>
          <p>Staff grouped by department</p>
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {error}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16 }}>
        {loading && <div className="card"><div className="empty-state" style={{ padding: '30px' }}><p>Loading...</p></div></div>}
        {!loading && departments.map(d => (
          <div key={d.name} className="card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--blue-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{DEPT_ICONS[d.name] || '📁'}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--slate-900)' }}>{d.name}</div>
                <div style={{ fontSize: 11, color: 'var(--slate-400)', display: 'flex', alignItems: 'center', gap: 4 }}><Users size={11} /> {d.totalStaff} staff · {d.activeStaff} active</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {d.members.slice(0, 6).map(m => (
                <span key={m._id} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 100, background: m.status === 'active' ? 'var(--green-100)' : 'var(--slate-100)', color: m.status === 'active' ? 'var(--green-600)' : 'var(--slate-500)' }}>{m.name}</span>
              ))}
              {d.members.length > 6 && <span style={{ fontSize: 11, color: 'var(--slate-400)' }}>+{d.members.length - 6} more</span>}
            </div>
          </div>
        ))}
        {!loading && departments.length === 0 && (
          <div className="card" style={{ gridColumn: 'span 3' }}>
            <div className="empty-state"><Building2 size={36} style={{ margin: '0 auto 12px', opacity: .3 }} /><h3>No staff added yet</h3><p>Departments will appear here once staff members are added.</p></div>
          </div>
        )}
      </div>
    </div>
  );
}