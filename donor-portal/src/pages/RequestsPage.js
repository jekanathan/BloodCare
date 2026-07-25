import React, { useState } from 'react';
import { CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const REQUESTS = [
  { _id: '1', hospital: { hospitalName: 'National Hospital Colombo', district: 'Colombo' }, bloodGroup: 'O+', unitsRequired: 2, priority: 'Emergency', urgencyLevel: 'High', patientAge: '45', patientCondition: 'Surgery', postedAt: '5 min ago', deadline: '2 hours', status: 'open' },
  { _id: '2', hospital: { hospitalName: 'Colombo South Teaching Hospital', district: 'Colombo' }, bloodGroup: 'O+', unitsRequired: 1, priority: 'Urgent', urgencyLevel: 'Medium', patientAge: '32', patientCondition: 'Accident', postedAt: '1 hr ago', deadline: '5 hours', status: 'open' },
  { _id: '3', hospital: { hospitalName: 'Asiri Medical Hospital', district: 'Colombo' }, bloodGroup: 'O-', unitsRequired: 1, priority: 'Urgent', urgencyLevel: 'High', patientAge: '28', patientCondition: 'Maternity', postedAt: '3 hrs ago', deadline: '8 hours', status: 'open' },
  { _id: '4', hospital: { hospitalName: 'Kandy Teaching Hospital', district: 'Kandy' }, bloodGroup: 'AB-', unitsRequired: 3, priority: 'Emergency', urgencyLevel: 'Critical', patientAge: '60', patientCondition: 'Heart surgery', postedAt: '6 hrs ago', deadline: '12 hours', status: 'open' },
];

const priorityStyle = { Emergency: { bg: '#FEE2E2', color: '#991B1B' }, Urgent: { bg: '#FEF3C7', color: '#92400E' }, Normal: { bg: 'var(--slate-100)', color: 'var(--slate-600)' } };

export default function RequestsPage() {
  const navigate = useNavigate();
  const [requests, setRequests]   = useState(REQUESTS);
  const [responded, setResponded] = useState({});

  const accept  = (id) => setResponded(p => ({ ...p, [id]: 'accepted' }));
  const decline = (id) => setResponded(p => ({ ...p, [id]: 'declined' }));

  return (
    <div className="anim-up">
      <div className="page-title">Blood Requests</div>
      <div className="page-sub">Active requests matching your blood group (O+)</div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Active Requests', value: requests.length, color: 'var(--red-600)' },
          { label: 'Accepted',        value: Object.values(responded).filter(v => v === 'accepted').length, color: 'var(--green-600)' },
          { label: 'Declined',        value: Object.values(responded).filter(v => v === 'declined').length, color: 'var(--slate-500)' },
        ].map(({ label, value, color }) => (
          <div key={label} className="dstat-card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)', color, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, color: 'var(--slate-500)' }}>{label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {requests.map(req => {
          const resp = responded[req._id];
          const ps   = priorityStyle[req.priority];

          return (
            <div key={req._id} className="card" style={{ overflow: 'visible' }}>
              {/* Header */}
              <div style={{ background: `linear-gradient(90deg, ${req.priority === 'Emergency' ? 'var(--red-600), #E8374F' : '#D97706, #F59E0B'})`, padding: '14px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontSize: 18 }}>{req.priority === 'Emergency' ? '🚨' : '⚠️'}</div>
                  <div>
                    <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{req.hospital.hospitalName}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,.7)' }}>📍 {req.hospital.district} &nbsp;·&nbsp; ⏰ Deadline: {req.deadline}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'rgba(255,255,255,.2)', color: '#fff', textTransform: 'uppercase' }}>{req.priority}</span>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,.7)' }}>Posted {req.postedAt}</span>
                </div>
              </div>

              <div style={{ padding: '20px 22px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
                  {[
                    { label: 'Blood Group', value: <span style={{ background: 'var(--red-100)', color: 'var(--red-700)', padding: '4px 12px', borderRadius: 8, fontWeight: 800, fontSize: 15, fontFamily: 'var(--font-display)' }}>{req.bloodGroup}</span> },
                    { label: 'Units Needed', value: `${req.unitsRequired} Units` },
                    { label: 'Urgency', value: req.urgencyLevel },
                    { label: 'Patient Age', value: `~${req.patientAge} yrs` },
                    { label: 'Condition', value: req.patientCondition },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.8px', color: 'var(--slate-400)', marginBottom: 6 }}>{label}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--slate-900)' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Response */}
                {resp === 'accepted' ? (
                  <div style={{ background: 'var(--green-50)', border: '1px solid var(--green-100)', borderRadius: 'var(--r)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <CheckCircle size={20} color="var(--green-600)" />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--green-700)' }}>Request Accepted!</div>
                      <div style={{ fontSize: 13, color: 'var(--green-600)' }}>Please book an appointment at the blood bank as soon as possible.</div>
                    </div>
                    <button className="btn-main" style={{ marginLeft: 'auto', width: 'auto', padding: '9px 18px', fontSize: 13 }} onClick={() => navigate('/appointments')}>
                      Book Appointment →
                    </button>
                  </div>
                ) : resp === 'declined' ? (
                  <div style={{ background: 'var(--slate-50)', border: '1px solid var(--slate-200)', borderRadius: 'var(--r)', padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--slate-500)', fontSize: 14 }}>
                    <X size={16} /> You declined this request.
                  </div>
                ) : (
                  <div className="request-actions">
                    <button className="btn-accept" onClick={() => accept(req._id)}>
                      <CheckCircle size={16} /> Accept & Donate
                    </button>
                    <button className="btn-decline" onClick={() => decline(req._id)}>Decline</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
