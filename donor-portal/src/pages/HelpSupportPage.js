import React from 'react';
import { Phone, Mail, MessageCircle } from 'lucide-react';

const FAQS = [
  { q: 'How often can I donate blood?', a: 'Most healthy adults can donate whole blood every 90 days (about 3 months). Your dashboard shows your exact next-eligible date.' },
  { q: 'What happens after I book an appointment?', a: 'The blood bank you selected is notified immediately. You can view or cancel your appointment any time from the Appointments page.' },
  { q: 'How do I get my donation certificate?', a: 'Certificates are issued once a donation is confirmed and recorded by a blood bank. You can download them anytime from My Certificates.' },
  { q: 'My eligibility status looks wrong. What do I do?', a: 'Eligibility is set by the hospital or blood bank after your screening. If you believe there\'s an error, please contact them directly or reach out to us below.' },
];

export default function HelpSupportPage() {
  return (
    <div className="anim-up">
      <div className="page-title">Help & Support</div>
      <div className="page-sub">We're here if you need anything</div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        <a href="tel:+94112345678" className="card" style={{ margin: 0, textDecoration: 'none', textAlign: 'center' }}>
          <div className="card-body">
            <Phone size={22} color="var(--red-600)" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-900)' }}>Call Us</div>
            <div style={{ fontSize: 12.5, color: 'var(--slate-500)' }}>+94 11 234 5678</div>
          </div>
        </a>
        <a href="mailto:support@bloodcare.lk" className="card" style={{ margin: 0, textDecoration: 'none', textAlign: 'center' }}>
          <div className="card-body">
            <Mail size={22} color="var(--red-600)" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-900)' }}>Email Us</div>
            <div style={{ fontSize: 12.5, color: 'var(--slate-500)' }}>support@bloodcare.lk</div>
          </div>
        </a>
        <div className="card" style={{ margin: 0, textAlign: 'center' }}>
          <div className="card-body">
            <MessageCircle size={22} color="var(--red-600)" style={{ marginBottom: 8 }} />
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--slate-900)' }}>Live Chat</div>
            <div style={{ fontSize: 12.5, color: 'var(--slate-500)' }}>Mon–Sat, 8AM–6PM</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><div className="card-title">Frequently Asked Questions</div></div>
        <div className="card-body" style={{ padding: 0 }}>
          {FAQS.map((f, i) => (
            <div key={i} style={{ padding: '18px 24px', borderBottom: i < FAQS.length - 1 ? '1px solid var(--slate-100)' : 'none' }}>
              <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 6, color: 'var(--slate-900)' }}>{f.q}</div>
              <div style={{ fontSize: 13, color: 'var(--slate-600)', lineHeight: 1.6 }}>{f.a}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}