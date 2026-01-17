
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import './AdminDashboard.css';

// Fix for Leaflet icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    pendingIncidents: 0,
    activeIncidents: 0,
    onlineVolunteers: 0,
    totalResources: 0
  });
  const [incidents, setIncidents] = useState([]);
  const [logs, setLogs] = useState([]);
  const [resources, setResources] = useState([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const socketRef = useRef(null);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Data Loading
  useEffect(() => {
    fetchDashboardData();
    setupSocket();
    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, []);

  const setupSocket = () => {
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl);

    socketRef.current.on('connect', () => addLog('SYSTEM', 'Connected to real-time network'));

    socketRef.current.on('new-incident', (data) => {
      addLog('ALERT', `New Incident Reported: ${data.type}`);
      fetchDashboardData();
    });

    socketRef.current.on('incident-verified', () => {
      addLog('INFO', 'Incident Verified');
      fetchDashboardData();
    });
  };

  const addLog = (type, message) => {
    setLogs(prev => [{
      id: Date.now(),
      time: new Date(),
      type,
      message
    }, ...prev].slice(0, 50));
  };

  const fetchDashboardData = async () => {
    try {
      console.log('Fetching Admin Dashboard Data...');
      // Use allSettled to prevent one failure from blocking others
      const results = await Promise.allSettled([
        api.get('/api/incidents'),
        api.get('/api/resources'),
        api.get('/api/incidents/stats')
      ]);

      const incidentsRes = results[0].status === 'fulfilled' ? results[0].value : null;
      const resourcesRes = results[1].status === 'fulfilled' ? results[1].value : null;
      const statsRes = results[2].status === 'fulfilled' ? results[2].value : null;

      if (results[0].status === 'rejected') console.error('Incidents fetch failed', results[0].reason);
      if (results[2].status === 'rejected') console.error('Stats fetch failed', results[2].reason);

      const allIncidents = incidentsRes?.data?.data || incidentsRes?.data || [];
      const allResources = resourcesRes?.data || [];

      setIncidents(allIncidents);
      setResources(allResources);

      // Calculate derived stats or use API
      const apiStats = statsRes?.data?.data || statsRes?.data || {};
      console.log('API Stats received:', apiStats);

      // Fallback/Mixed strategy: Use API if available, else local calc
      const pending = apiStats.pending !== undefined ? apiStats.pending : allIncidents.filter(i => i.status === 0).length;
      const active = apiStats.totalActive !== undefined ? apiStats.totalActive : allIncidents.filter(i => i.status === 1 || i.status === 2).length;

      // Mock volunteers for now if API doesn't return it or returns 0
      const onlineVols = apiStats.onlineVolunteers ? apiStats.onlineVolunteers : 12;

      setStats({
        pendingIncidents: pending,
        activeIncidents: active,
        onlineVolunteers: onlineVols,
        totalResources: allResources.length
      });

    } catch (error) {
      console.error('Failed to load dashboard data', error);
      // Don't toast error to avoid spamming user if just one part failed
    }
  };

  const handleVerify = async (id) => {
    try {
      await api.put(`/api/incidents/${id}/verify`);
      toast.success('Incident Verified');
      addLog('ACTION', `Incident ${id.slice(-4)} Verified`);
      fetchDashboardData();
    } catch (error) {
      toast.error('Verification Failed');
    }
  };

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <div className="admin-header-bar">
        <div className="brand-section">
          <h1>Command Center <span className="badge">ADMIN</span></h1>
        </div>
        <div className="system-status">
          <span className="status-indicator"><div className="blink"></div> SYSTEM ONLINE</span>
          <span>{currentTime.toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="stats-grid">
        <div className="stat-card warning">
          <div className="stat-info">
            <h3>Pending Verification</h3>
            <div className="value">{stats.pendingIncidents}</div>
          </div>
          <div className="stat-icon">⚠️</div>
        </div>
        <div className="stat-card alert">
          <div className="stat-info">
            <h3>Active Incidents</h3>
            <div className="value">{stats.activeIncidents}</div>
          </div>
          <div className="stat-icon">🚨</div>
        </div>
        <div className="stat-card success">
          <div className="stat-info">
            <h3>Units Available</h3>
            <div className="value">{stats.onlineVolunteers}</div>
          </div>
          <div className="stat-icon">🛡️</div>
        </div>
        <div className="stat-card">
          <div className="stat-info">
            <h3>Resources Deployed</h3>
            <div className="value">{stats.totalResources}</div>
          </div>
          <div className="stat-icon">📦</div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="dashboard-main">

        {/* Left: Incident Queue */}
        <div className="panel">
          <div className="panel-header">
            <h2>Priority Queue</h2>
            <button onClick={fetchDashboardData} className="action-btn" style={{ width: 'auto', padding: '5px 10px', margin: 0 }}>↻</button>
          </div>
          <div className="panel-content">
            {incidents.filter(i => i.status === 0).length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No pending incidents</div>
            ) : (
              incidents.filter(i => i.status === 0).map(incident => (
                <div key={incident._id} className="feed-item">
                  <div className="feed-meta">
                    <span style={{ color: '#ffea00' }}>PENDING VERIFICATION</span>
                    <span>{new Date(incident.createdAt).toLocaleTimeString()}</span>
                  </div>
                  <p className="feed-desc" style={{ fontWeight: 'bold', marginBottom: '5px' }}>{incident.type}</p>
                  <p className="feed-desc">{incident.description}</p>
                  <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
                    <button onClick={() => handleVerify(incident._id)} className="action-btn" style={{ marginBottom: 0 }}>
                      ✓ VERIFY
                    </button>
                    <a
                      href={`https://www.google.com/maps?q=${incident.latitude},${incident.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="action-btn danger"
                      style={{ marginBottom: 0, textDecoration: 'none', textAlign: 'center' }}
                    >
                      LOCATE
                    </a>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Center: Map & Live Feed */}
        <div className="panel map-panel" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="panel-header"><h2>Tactical Map</h2></div>
          <div style={{ flex: 2, minHeight: '300px', position: 'relative' }}>
            <MapContainer
              center={[20.5937, 78.9629]}
              zoom={5}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap'
              />
              {incidents.map(inc => (
                <Marker
                  key={inc._id}
                  position={[inc.latitude || 0, inc.longitude || 0]}
                >
                  <Popup>
                    <strong>{inc.type}</strong><br />
                    {inc.description}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>

          <div className="panel-header" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h2>Live Activity Feed</h2>
          </div>
          <div className="panel-content" style={{ flex: 1, maxHeight: '200px' }}>
            {logs.map(log => (
              <div key={log.id} className="feed-item">
                <div style={{ display: 'flex', gap: '10px' }}>
                  <span style={{ color: '#00f0ff', fontFamily: 'monospace' }}>[{log.time.toLocaleTimeString()}]</span>
                  <span style={{
                    color: log.type === 'ALERT' ? '#ff3366' :
                      log.type === 'ACTION' ? '#00ff9d' : '#e0e6ed'
                  }}>
                    {log.message}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Actions & Resources */}
        <div className="panel">
          <div className="panel-header"><h2>Admin Control</h2></div>
          <div className="panel-content">
            <button
              className="action-btn"
              onClick={() => navigate('/admin/incidents')}
            >
              🚨 INCIDENTS
            </button>
            <button
              className="action-btn"
              onClick={() => navigate('/admin/volunteers')}
            >
              👥 VOLUNTEERS
            </button>
            <button
              className="action-btn danger"
              onClick={() => navigate('/admin/incidents')}
            >
              📢 BROADCAST ALERT
            </button>
          </div>

          <div className="panel-header" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
            <h2>Resources</h2>
          </div>
          <div className="panel-content">
            {resources.slice(0, 5).map(res => (
              <div key={res._id} className="feed-item">
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#00f0ff' }}>{res.name}</span>
                  <span className="badge" style={{ fontSize: '10px' }}>{res.type}</span>
                </div>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '2px' }}>
                  {res.location?.address}
                </div>
              </div>
            ))}
            <button className="action-btn" style={{ marginTop: '10px' }} onClick={() => navigate('/admin/incidents')}>
              VIEW ALL
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
