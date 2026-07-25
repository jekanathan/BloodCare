import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import io from 'socket.io-client';
import api from '../utils/api';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createIcon = (emoji, color) => L.divIcon({
  html: `<div style="background:${color};width:36px;height:36px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,.3);border:2px solid #fff;">
    <span style="transform:rotate(45deg);font-size:16px">${emoji}</span>
  </div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const ICONS = {
  donor:     createIcon('👤', '#C41E3A'),
  hospital:  createIcon('🏥', '#2563EB'),
  bloodbank: createIcon('🏦', '#7C3AED'),
  vehicle:   createIcon('🚑', '#16A34A'),
  emergency: createIcon('🚨', '#F59E0B'),
};

function timeAgo(date) {
  if (!date) return '';
  const diff = Math.floor((new Date() - new Date(date)) / 60000);
  if (diff < 1) return 'Just now';
  if (diff < 60) return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function LocationsPage() {
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [liveLocations, setLiveLocations] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isDark, setIsDark] = useState(document.body.classList.contains('dark-mode'));
  const socketRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [stats, setStats] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [timeline, setTimeline] = useState({ steps: [], hospital: '-' });

  useEffect(() => {
    const observer = new MutationObserver(() => setIsDark(document.body.classList.contains('dark-mode')));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchAll = () => {
    setLoading(true);
    setApiError('');
    Promise.all([
      api.get('/locations/overview'),
      api.get('/locations/timeline'),
      api.get('/locations/activity'),
    ])
      .then(([ov, tl, act]) => {
        setStats(ov.data?.stats || []);
        setMarkers(ov.data?.markers || []);
        setTimeline(tl.data || { steps: [], hospital: '-' });
        setNotifications((act.data?.activity || []).map(a => ({ ...a, read: false })));
      })
      .catch(err => {
        console.error('Locations fetch error:', err);
        setApiError('Could not load live location data from server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000); // refresh every 30s
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  // Socket.IO — real-time push updates (vehicle GPS, live tracking)
  useEffect(() => {
    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_admin');

    socketRef.current.on('location_updated', (data) => {
      setLiveLocations(prev => {
        const exists = prev.findIndex(l => l.requestId === data.requestId);
        if (exists >= 0) { const updated = [...prev]; updated[exists] = data; return updated; }
        return [...prev, data];
      });
      setNotifications(prev => [{
        id: `live-${Date.now()}`,
        text: `${data.name || 'Vehicle'} location updated`,
        time: new Date(),
        icon: '📍',
        read: false,
      }, ...prev.slice(0, 9)]);
    });

    socketRef.current.on('journey_status_updated', () => fetchAll());

    return () => socketRef.current?.disconnect();
    // eslint-disable-next-line
  }, []);

  const t = {
    bg: isDark ? '#0F172A' : '#F8FAFC',
    card: isDark ? '#1E293B' : '#fff',
    border: isDark ? '#334155' : '#E2E8F0',
    text: isDark ? '#F1F5F9' : '#0F172A',
    text2: isDark ? '#94A3B8' : '#64748B',
  };

  const filtered = filter === 'all' ? markers : markers.filter(l => l.type === filter);

  const FILTERS = [
    { key: 'all', label: 'All', icon: '🗺️' },
    { key: 'donor', label: 'Donors', icon: '👤' },
    { key: 'hospital', label: 'Hospitals', icon: '🏥' },
    { key: 'bloodbank', label: 'Blood Banks', icon: '🏦' },
    { key: 'emergency', label: 'Emergency', icon: '🚨' },
  ];

  // Data-driven insights (no fabricated claims — built only from real fetched stats)
  const insights = [];
  const emergencyStat = stats.find(s => s.label === 'Emergency Requests');
  const completedStat = stats.find(s => s.label === 'Completed Today');
  const vehiclesStat = stats.find(s => s.label === 'Vehicles Moving');
  const banksStat = stats.find(s => s.label === 'Blood Banks Online');
  if (emergencyStat && Number(emergencyStat.value) > 0) {
    insights.push({ icon: '🚨', text: `${emergencyStat.value} emergency request(s) currently active`, type: 'critical' });
  }
  if (vehiclesStat && Number(vehiclesStat.value) > 0) {
    insights.push({ icon: '🚑', text: `${vehiclesStat.value} vehicle(s) currently dispatched and en route`, type: 'warning' });
  }
  if (completedStat) {
    insights.push({ icon: '✅', text: `${completedStat.value} deliveries completed today`, type: 'success' });
  }
  if (banksStat) {
    insights.push({ icon: '🏦', text: `${banksStat.value} blood bank(s) online and approved`, type: 'info' });
  }

  return (
    <div style={{ background: t.bg, minHeight: '100vh', fontFamily: "'Inter',sans-serif" }}>

      {apiError && (
        <div style={{ background: 'rgba(234,179,8,.1)', border: '1px solid rgba(234,179,8,.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, fontSize: 13, color: '#92400E' }}>
          ⚠️ {apiError}
        </div>
      )}

      {/* STATS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 14, marginBottom: 20 }}>
        {(loading ? Array(6).fill(null) : stats).map((s, i) => (
          <div key={s?.label || i} style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: '14px 16px' }}>
            <div style={{ width: 36, height: 36, background: s ? `${s.color}1A` : t.border, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, marginBottom: 8 }}>{s?.icon || '·'}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: s?.color || t.text2, fontFamily: "'Plus Jakarta Sans',sans-serif" }}>{loading ? '—' : s?.value}</div>
            <div style={{ fontSize: 11, color: t.text2, marginTop: 2 }}>{s?.label || 'Loading...'}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>

        {/* MAP SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: t.text2, marginRight: 4 }}>FILTER:</span>
            {FILTERS.map(({ key, label, icon }) => (
              <button key={key} onClick={() => setFilter(key)} style={{
                padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                background: filter === key ? '#C41E3A' : isDark ? '#334155' : '#F1F5F9',
                color: filter === key ? '#fff' : t.text2,
                fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4,
                fontFamily: "'Inter',sans-serif",
              }}>{icon} {label}</button>
            ))}
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4ADE80', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: 11, color: '#4ADE80', fontWeight: 600 }}>LIVE</span>
            </div>
          </div>

          <div style={{ borderRadius: 16, overflow: 'hidden', border: `1px solid ${t.border}`, height: 520, position: 'relative' }}>
            <MapContainer center={[7.8731, 80.7718]} zoom={8} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url={isDark
                  ? 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
                  : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'}
                attribution='&copy; OpenStreetMap contributors'
              />
              {filtered.map(loc => (
                <Marker key={loc.id} position={[loc.lat, loc.lng]} icon={ICONS[loc.type]}
                  eventHandlers={{ click: () => setSelected(loc) }}>
                  <Popup>
                    <div style={{ fontFamily: "'Inter',sans-serif", minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{loc.name}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>📍 {loc.address}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>🩸 {loc.blood}</div>
                      <div style={{ fontSize: 12, color: '#64748B', marginBottom: 2 }}>📞 {loc.phone}</div>
                      <span style={{
                        display: 'inline-block', padding: '2px 8px', borderRadius: 100, fontSize: 10, fontWeight: 700,
                        background: loc.status === 'Critical' || loc.status === 'Urgent' ? '#FEE2E8' :
                          loc.status === 'Moving' || loc.status === 'Traveling' ? '#DCFCE7' : '#F1F5F9',
                        color: loc.status === 'Critical' || loc.status === 'Urgent' ? '#C41E3A' :
                          loc.status === 'Moving' || loc.status === 'Traveling' ? '#16A34A' : '#64748B',
                      }}>{loc.status}</span>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {liveLocations.map((loc, i) => (
                <Marker key={`live-${i}`} position={[loc.lat, loc.lng]} icon={ICONS[loc.type] || ICONS.vehicle}>
                  <Popup>
                    <div style={{ fontFamily: "'Inter',sans-serif" }}>
                      <div style={{ fontWeight: 700 }}>{loc.name} 🔴 LIVE</div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>Speed: {loc.speed || 0} km/h</div>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>

            <div style={{
              position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
              background: isDark ? 'rgba(15,23,42,.9)' : 'rgba(255,255,255,.95)',
              borderRadius: 10, padding: '10px 14px', border: `1px solid ${t.border}`, backdropFilter: 'blur(8px)',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: t.text2, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Legend</div>
              {[
                { icon: '👤', label: 'Donor', color: '#C41E3A' },
                { icon: '🏥', label: 'Hospital', color: '#2563EB' },
                { icon: '🏦', label: 'Blood Bank', color: '#7C3AED' },
                { icon: '🚨', label: 'Emergency', color: '#F59E0B' },
              ].map(({ icon, label, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <span style={{ fontSize: 12 }}>{icon}</span>
                  <span style={{ fontSize: 11, color: t.text, fontWeight: 500 }}>{label}</span>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          </div>

          {/* INSIGHTS — built only from real fetched stats, no fabricated claims */}
          {insights.length > 0 && (
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg,#C41E3A,#7C3AED)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📊</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: t.text }}>Live Insights</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {insights.map(({ icon, text, type }, i) => (
                  <div key={i} style={{
                    padding: '10px 12px', borderRadius: 8,
                    background: type === 'critical' ? 'rgba(196,30,58,.08)' : type === 'warning' ? 'rgba(245,158,11,.08)' : type === 'success' ? 'rgba(22,163,74,.08)' : 'rgba(37,99,235,.08)',
                    border: `1px solid ${type === 'critical' ? 'rgba(196,30,58,.2)' : type === 'warning' ? 'rgba(245,158,11,.2)' : type === 'success' ? 'rgba(22,163,74,.2)' : 'rgba(37,99,235,.2)'}`,
                    display: 'flex', gap: 8, alignItems: 'flex-start',
                  }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <span style={{ fontSize: 12, color: t.text, lineHeight: 1.4 }}>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT PANEL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {selected && (
            <div style={{ background: t.card, border: `2px solid #C41E3A`, borderRadius: 12, padding: 16, position: 'relative' }}>
              <button onClick={() => setSelected(null)} style={{ position: 'absolute', top: 10, right: 10, background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, color: t.text2 }}>×</button>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#C41E3A', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Selected Location</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: t.text, marginBottom: 4 }}>{selected.name}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[{ label: 'Type', value: selected.type }, { label: 'Status', value: selected.status }, { label: 'Blood', value: selected.blood }, { label: 'Phone', value: selected.phone }, { label: 'Address', value: selected.address }].map(({ label, value }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: t.text2 }}>{label}:</span>
                    <span style={{ color: t.text, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 12 }}>
                <a href={`tel:${selected.phone}`} style={{ padding: '8px', background: '#C41E3A', color: '#fff', borderRadius: 8, fontSize: 12, fontWeight: 600, textAlign: 'center', textDecoration: 'none' }}>📞 Call</a>
                <button style={{ padding: '8px', background: isDark ? '#334155' : '#F1F5F9', color: t.text, border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>🗺️ Navigate</button>
              </div>
            </div>
          )}

          {/* Emergency Timeline — real BloodRequest status */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>⏱️</span> Emergency Timeline
              <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'rgba(196,30,58,.1)', color: '#C41E3A' }}>LIVE</span>
            </div>
            {timeline.hospital && timeline.hospital !== '-' && (
              <div style={{ fontSize: 11, color: t.text2, marginBottom: 10 }}>{timeline.hospital}</div>
            )}
            {timeline.steps.length === 0 ? (
              <div style={{ fontSize: 12, color: t.text2, padding: '10px 0' }}>No active emergency requests right now.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {timeline.steps.map(({ label, done, active }, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, paddingBottom: i < timeline.steps.length - 1 ? 8 : 0 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%',
                        background: done ? '#C41E3A' : active ? '#F59E0B' : isDark ? '#334155' : '#E2E8F0',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 800,
                        boxShadow: active ? '0 0 0 3px rgba(245,158,11,.3)' : 'none',
                        animation: active ? 'pulse 1.5s infinite' : 'none',
                      }}>{done ? '✓' : active ? '●' : i + 1}</div>
                      {i < timeline.steps.length - 1 && (
                        <div style={{ width: 2, height: 16, background: done ? '#C41E3A' : isDark ? '#334155' : '#E2E8F0', marginTop: 2 }} />
                      )}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontSize: 11, fontWeight: active ? 700 : done ? 600 : 400, color: active ? '#F59E0B' : done ? t.text : t.text2 }}>{label}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Activity — real StockHistory + BloodRequest events */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🔔</span> Live Activity
              {notifications.filter(n => !n.read).length > 0 && (
                <span style={{ marginLeft: 'auto', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 100, background: '#C41E3A', color: '#fff' }}>
                  {notifications.filter(n => !n.read).length} new
                </span>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 200, overflowY: 'auto' }}>
              {notifications.length === 0 && !loading && (
                <div style={{ fontSize: 12, color: t.text2 }}>No recent activity.</div>
              )}
              {notifications.map(({ id, text, time, icon, read }) => (
                <div key={id} style={{
                  display: 'flex', gap: 8, alignItems: 'flex-start', padding: '8px 10px', borderRadius: 8,
                  background: !read ? (isDark ? 'rgba(196,30,58,.08)' : 'rgba(196,30,58,.04)') : 'transparent',
                  border: `1px solid ${!read ? 'rgba(196,30,58,.15)' : t.border}`,
                }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: t.text, lineHeight: 1.4, fontWeight: !read ? 600 : 400 }}>{text}</div>
                    <div style={{ fontSize: 10, color: t.text2, marginTop: 2 }}>{timeAgo(time)}</div>
                  </div>
                  {!read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C41E3A', flexShrink: 0, marginTop: 4 }} />}
                </div>
              ))}
            </div>
          </div>

          {/* Location List */}
          <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.text, marginBottom: 12 }}>📋 Active Locations ({filtered.length})</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {filtered.map(loc => (
                <div key={loc.id} onClick={() => setSelected(loc)} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                  border: `1px solid ${selected?.id === loc.id ? '#C41E3A' : t.border}`,
                  background: selected?.id === loc.id ? 'rgba(196,30,58,.06)' : 'transparent',
                }}>
                  <div style={{ fontSize: 18, flexShrink: 0 }}>
                    {loc.type === 'donor' ? '👤' : loc.type === 'hospital' ? '🏥' : loc.type === 'bloodbank' ? '🏦' : '🚨'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: t.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</div>
                    <div style={{ fontSize: 10, color: t.text2 }}>{loc.blood} • {loc.address}</div>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 100, whiteSpace: 'nowrap', flexShrink: 0,
                    background: loc.status === 'Critical' || loc.status === 'Urgent' ? '#FEE2E8' : loc.status === 'Moving' || loc.status === 'Active' ? '#DCFCE7' : '#F1F5F9',
                    color: loc.status === 'Critical' || loc.status === 'Urgent' ? '#C41E3A' : loc.status === 'Moving' || loc.status === 'Active' ? '#16A34A' : '#64748B',
                  }}>{loc.status}</span>
                </div>
              ))}
              {filtered.length === 0 && !loading && (
                <div style={{ fontSize: 12, color: t.text2 }}>No locations to show.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:.4;} }
        .leaflet-container { font-family: 'Inter', sans-serif !important; }
      `}</style>
    </div>
  );
}