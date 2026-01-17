import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import io from 'socket.io-client';
import { FaMapMarkerAlt, FaCheckCircle, FaTimesCircle, FaCheckDouble, FaTrophy, FaMedal, FaStar, FaBullhorn } from 'react-icons/fa';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import L from 'leaflet';
import './VolunteerDashboard.css';

const VolunteerDashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const socketRef = useRef(null);

  // Fetch Incident Stats (Ticker)
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['incidentStats'],
    queryFn: async () => {
      const response = await api.get('/api/incidents/stats');
      return response.data?.data || {};
    },
    refetchInterval: 10000,
  });

  // Fetch Available Incidents (Status 1: Verified)
  const { data: availableIncidents = [], isLoading: availableLoading } = useQuery({
    queryKey: ['availableIncidents'],
    queryFn: async () => {
      const response = await api.get('/api/incidents?status=1');
      return response.data.data || [];
    },
    refetchInterval: 5000,
  });

  // Fetch Ongoing Incidents (Status 2: Ongoing) - We will filter for "My Accepted" client-side
  const { data: ongoingIncidents = [], isLoading: ongoingLoading } = useQuery({
    queryKey: ['ongoingIncidents'],
    queryFn: async () => {
      const response = await api.get('/api/incidents?status=2');
      return response.data.data || [];
    },
    refetchInterval: 5000,
  });

  // Filter for "My Incidents"
  const myIncidents = useMemo(() => {
    return ongoingIncidents.filter(incident =>
      incident.acceptedBy?._id === user?._id || incident.acceptedBy === user?._id
    );
  }, [ongoingIncidents, user?._id]);

  // Socket setup
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socketRef.current.on('connect', () => {
      console.log('VolunteerDashboard: Socket connected');
    });

    // Listen for relevant events
    socketRef.current.on('incident-verified', () => {
      queryClient.invalidateQueries(['availableIncidents']);
      queryClient.invalidateQueries(['incidentStats']);
    });

    socketRef.current.on('incident-accepted', () => {
      queryClient.invalidateQueries(['availableIncidents']);
      queryClient.invalidateQueries(['ongoingIncidents']);
      queryClient.invalidateQueries(['incidentStats']);
    });

    socketRef.current.on('incident-resolved', () => {
      queryClient.invalidateQueries(['ongoingIncidents']);
      queryClient.invalidateQueries(['incidentStats']);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [queryClient, user?._id]);

  // Mutations
  const acceptMutation = useMutation({
    mutationFn: async (id) => {
      return api.put(`/api/incidents/${id}/accept`);
    },
    onSuccess: () => {
      toast.success('Incident accepted successfully!');
      queryClient.invalidateQueries(['availableIncidents']);
      queryClient.invalidateQueries(['ongoingIncidents']);
      queryClient.invalidateQueries(['incidentStats']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept incident');
    }
  });

  const resolveMutation = useMutation({
    mutationFn: async (id) => {
      return api.put(`/api/incidents/${id}/resolve`);
    },
    onSuccess: () => {
      toast.success('Incident resolved successfully!');
      queryClient.invalidateQueries(['ongoingIncidents']);
      queryClient.invalidateQueries(['incidentStats']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to resolve incident');
    }
  });

  const handleAccept = (id) => {
    if (window.confirm('Are you ready to respond to this incident?')) {
      acceptMutation.mutate(id);
    }
  };

  const handleResolve = (id) => {
    if (window.confirm('Have you completely resolved this incident?')) {
      resolveMutation.mutate(id);
    }
  };

  const getSeverityColor = (severity) => {
    if (severity >= 5) return '#ff0055'; // Neon Pink
    if (severity >= 4) return '#ff7700'; // Neon Orange
    if (severity >= 3) return '#ffea00'; // Neon Yellow
    return '#00ff9d'; // Neon Green
  };

  const openMap = (latitude, longitude) => {
    window.open(`https://www.google.com/maps?q=${latitude},${longitude}`, '_blank');
  };

  // Calculate achievements based on stats
  const achievements = useMemo(() => {
    const resolved = statsData?.myResolved || 0;
    const badges = [];

    if (resolved >= 1) badges.push({ icon: '🎖️', title: 'First Responder', desc: 'Completed first mission' });
    if (resolved >= 5) badges.push({ icon: '⭐', title: 'Reliable Unit', desc: '5 missions completed' });
    if (resolved >= 10) badges.push({ icon: '🏆', title: 'Elite Operator', desc: '10 missions completed' });
    if (resolved >= 25) badges.push({ icon: '💎', title: 'Crisis Legend', desc: '25 missions completed' });

    return badges;
  }, [statsData?.myResolved]);

  // Mock announcements (in production, fetch from API)
  const announcements = [
    { id: 1, type: 'alert', icon: '⚠️', text: 'Heavy rainfall expected in northern sectors. Stay alert.', time: '2h ago' },
    { id: 2, type: 'broadcast', icon: '📢', text: 'New training module available: Advanced First Aid', time: '5h ago' },
    { id: 3, type: 'success', icon: '✅', text: 'System maintenance completed successfully', time: '1d ago' }
  ];

  // Combine all incidents for map
  const allIncidents = useMemo(() => {
    return [...availableIncidents, ...ongoingIncidents];
  }, [availableIncidents, ongoingIncidents]);

  const loading = authLoading || statsLoading || availableLoading || ongoingLoading;

  if (loading && !statsData) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="volunteer-dashboard-page" style={{
      minHeight: '100vh',
      background: `linear-gradient(rgba(5, 10, 20, 0.95), rgba(5, 10, 20, 0.95)), url(${process.env.PUBLIC_URL}/assets/admin_bg.png)`,
      backgroundSize: 'cover',
      backgroundAttachment: 'fixed',
      color: '#e0e6ed',
      paddingTop: '80px',
      overflowX: 'hidden'
    }}>
      <div className="volunteer-container">
        {/* HUD Header */}
        <div className="hud-header">
          <div className="hud-title">
            <h1>🛡️ UNIT DASHBOARD</h1>
            <span className="operator-id">OP: {user?.name} | <span className="status-online">ONLINE</span></span>
          </div>
          <div className="hud-stats-ticker">
            <div className="hud-stat">
              <span className="label">GLOBAL REPORTS</span>
              <span className="value">{statsData?.totalReported || 0}</span>
            </div>
            <div className="hud-stat active">
              <span className="label">ACTION POOL</span>
              <span className="value">{statsData?.verified || 0}</span>
            </div>
            <div className="hud-stat mission">
              <span className="label">MY MISSIONS</span>
              <span className="value">{statsData?.myAccepted || 0}</span>
            </div>
            <div className="hud-stat resolved">
              <span className="label">RESOLVED</span>
              <span className="value">{statsData?.myResolved || 0}</span>
            </div>
          </div>
        </div>

        {/* System Announcements Banner */}
        <div className="announcements-banner">
          <div className="announcements-header">
            <FaBullhorn /> SYSTEM BROADCASTS
          </div>
          <div className="announcements-scroll">
            {announcements.map(ann => (
              <div key={ann.id} className={`announcement-item ${ann.type}`}>
                <span className="ann-icon">{ann.icon}</span>
                <span className="ann-text">{ann.text}</span>
                <span className="ann-time">{ann.time}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="command-grid-enhanced">
          {/* LEFT COLUMN: ACTIVE MISSIONS + MAP */}
          <div className="mission-column-enhanced">
            <div className="column-header">
              <h2>🚀 ACTIVE MISSIONS</h2>
              <div className="header-line"></div>
            </div>

            {myIncidents.length === 0 ? (
              <div className="empty-slot">
                <div className="radar-spinner"></div>
                <p>NO ACTIVE MISSIONS. STANDING BY.</p>
              </div>
            ) : (
              <div className="mission-stack">
                {myIncidents.map(incident => (
                  <div key={incident._id} className="mission-card active-mission-card">
                    <div className="card-status-bar">
                      <span className="status-text blink">IN PROGRESS</span>
                      <span className="priority-level" style={{ color: getSeverityColor(incident.severity) }}>
                        SEVERITY: {'█'.repeat(incident.severity)}
                      </span>
                    </div>
                    <h3>{incident.type}</h3>
                    <div className="mission-intel">
                      <p><span className="icon">📍</span> <strong>LOC:</strong> {incident.location}</p>
                      <p className="briefing">"{incident.description}"</p>
                    </div>
                    <div className="mission-actions">
                      <button className="btn-nav" onClick={() => openMap(incident.latitude, incident.longitude)}>
                        <FaMapMarkerAlt /> GPS NAV
                      </button>
                      <button className="btn-complete" onClick={() => handleResolve(incident._id)} disabled={resolveMutation.isPending}>
                        <FaCheckDouble /> COMPLETE MISSION
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Nearby Incidents Map */}
            <div className="map-section">
              <div className="column-header">
                <h2>📍 TACTICAL MAP</h2>
                <div className="header-line"></div>
              </div>
              <div className="map-container-wrapper">
                <MapContainer
                  center={[28.6139, 77.2090]}
                  zoom={10}
                  style={{ height: '350px', width: '100%', borderRadius: '8px' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; OpenStreetMap contributors'
                  />
                  {allIncidents.map(incident => (
                    incident.latitude && incident.longitude && (
                      <CircleMarker
                        key={incident._id}
                        center={[incident.latitude, incident.longitude]}
                        radius={10}
                        fillColor={getSeverityColor(incident.severity)}
                        color="#000"
                        weight={3}
                        fillOpacity={0.9}
                      >
                        <Popup>
                          <div style={{ minWidth: '150px' }}>
                            <strong>{incident.type}</strong><br />
                            <small>{incident.location}</small><br />
                            <span style={{ color: getSeverityColor(incident.severity) }}>
                              Severity: {incident.severity}/5
                            </span>
                          </div>
                        </Popup>
                      </CircleMarker>
                    )
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: INCIDENT POOL + ACHIEVEMENTS */}
          <div className="pool-column-enhanced">
            <div className="column-header">
              <h2>📡 INCIDENT POOL</h2>
              <span className="live-badge">LIVE FEED</span>
              <div className="header-line"></div>
            </div>

            <div className="pool-feed">
              {availableIncidents.length === 0 ? (
                <p className="pool-empty">ALL CLEAR. NO PENDING INCIDENTS.</p>
              ) : (
                availableIncidents.map(incident => (
                  <div key={incident._id} className="pool-card">
                    <div className="pool-card-header">
                      <span className="pool-type">{incident.type}</span>
                      <span className="pool-sev" style={{ color: getSeverityColor(incident.severity) }}>
                        LVL {incident.severity}
                      </span>
                    </div>
                    <p className="pool-loc">{incident.location}</p>
                    <button className="btn-accept-small" onClick={() => handleAccept(incident._id)} disabled={acceptMutation.isPending}>
                      <FaCheckCircle /> ACCEPT
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Achievements Section */}
            <div className="achievements-section">
              <div className="column-header">
                <h2>🏆 ACHIEVEMENTS</h2>
                <div className="header-line"></div>
              </div>
              <div className="achievements-grid">
                {achievements.length === 0 ? (
                  <div className="no-badges">
                    <p>Complete missions to unlock badges!</p>
                  </div>
                ) : (
                  achievements.map((badge, idx) => (
                    <div key={idx} className="badge-card">
                      <div className="badge-icon">{badge.icon}</div>
                      <div className="badge-info">
                        <h4>{badge.title}</h4>
                        <p>{badge.desc}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="progress-bar-section">
                <p className="progress-label">Next Milestone: {statsData?.myResolved >= 25 ? 'MAX RANK' : statsData?.myResolved >= 10 ? '25 Missions' : statsData?.myResolved >= 5 ? '10 Missions' : '5 Missions'}</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(((statsData?.myResolved || 0) / 25) * 100, 100)}%`
                    }}
                  ></div>
                </div>
                <p className="progress-count">{statsData?.myResolved || 0} / 25 Missions</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VolunteerDashboard;
