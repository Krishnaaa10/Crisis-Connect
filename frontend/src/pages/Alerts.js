import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { FaExclamationTriangle, FaInfoCircle, FaCheckCircle, FaExclamationCircle, FaClock, FaMapMarkerAlt, FaUser } from 'react-icons/fa';
import './Alerts.css';

const Alerts = () => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'broadcasts', 'incidents'
  const socketRef = React.useRef(null);

  const fetchAlerts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch both alerts and incidents
      const [alertsResponse, incidentsResponse] = await Promise.all([
        api.get('/api/alerts').catch(() => ({ data: [] })),
        api.get('/api/incidents').catch(() => ({ data: { data: [] } }))
      ]);

      setAlerts(alertsResponse.data || []);
      setIncidents(incidentsResponse.data?.data || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      if (error.response?.status !== 401) {
        toast.error('Failed to load alerts and incidents');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();

    if (!user) return;

    // Socket connection for real-time updates
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    const handleNewAlert = (alert) => {
      if (alert.isActive) {
        setAlerts((prev) => [alert, ...prev]);
        toast.info(`New alert: ${alert.title}`);
      }
    };

    const handleAlertUpdated = (alert) => {
      setAlerts((prev) =>
        prev.map((a) => (a._id === alert._id ? alert : a))
      );
    };

    const handleAlertDeleted = (data) => {
      const id = data?.id || data?._id || data;
      setAlerts((prev) => prev.filter((a) => a._id !== id));
    };

    const handleNewIncident = (incident) => {
      setIncidents((prev) => [incident, ...prev]);
      toast.info(`New incident reported: ${incident.type}`);
    };

    const handleIncidentUpdated = (incident) => {
      setIncidents((prev) =>
        prev.map((i) => (i._id === incident._id ? incident : i))
      );
    };

    socketRef.current.on('new-alert', handleNewAlert);
    socketRef.current.on('alert-updated', handleAlertUpdated);
    socketRef.current.on('alert-deleted', handleAlertDeleted);
    socketRef.current.on('incident-created', handleNewIncident);
    socketRef.current.on('incident-updated', handleIncidentUpdated);

    return () => {
      if (socketRef.current) {
        socketRef.current.off('new-alert', handleNewAlert);
        socketRef.current.off('alert-updated', handleAlertUpdated);
        socketRef.current.off('alert-deleted', handleAlertDeleted);
        socketRef.current.off('incident-created', handleNewIncident);
        socketRef.current.off('incident-updated', handleIncidentUpdated);
        socketRef.current.disconnect();
      }
    };
  }, [user]);

  const getAlertIcon = (type) => {
    switch (type) {
      case 'danger':
        return <FaExclamationCircle className="alert-icon" />;
      case 'warning':
        return <FaExclamationTriangle className="alert-icon" />;
      case 'success':
        return <FaCheckCircle className="alert-icon" />;
      default:
        return <FaInfoCircle className="alert-icon" />;
    }
  };

  const getAlertColor = (type) => {
    switch (type) {
      case 'danger':
        return '#dc3545';
      case 'warning':
        return '#ffc107';
      case 'success':
        return '#28a745';
      default:
        return '#17a2b8';
    }
  };

  const getIncidentSeverityColor = (severity) => {
    if (severity >= 5) return '#ff0055';
    if (severity >= 4) return '#ff7700';
    if (severity >= 3) return '#ffea00';
    return '#00ff9d';
  };

  const getStatusText = (status) => {
    switch (status) {
      case 0: return 'Pending';
      case 1: return 'Verified';
      case 2: return 'Ongoing';
      case 3: return 'Resolved';
      default: return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 0: return '#ffc107';
      case 1: return '#17a2b8';
      case 2: return '#ff7700';
      case 3: return '#28a745';
      default: return '#6c757d';
    }
  };

  const getTargetAudienceText = (audience) => {
    switch (audience) {
      case 'all':
        return 'All Users';
      case 'volunteers':
        return 'Volunteers';
      case 'civilians':
        return 'Civilians';
      default:
        return audience;
    }
  };

  const filteredData = () => {
    if (activeTab === 'broadcasts') return { alerts, incidents: [] };
    if (activeTab === 'incidents') return { alerts: [], incidents };
    return { alerts, incidents };
  };

  const { alerts: displayAlerts, incidents: displayIncidents } = filteredData();
  const totalCount = displayAlerts.length + displayIncidents.length;

  return (
    <div className="alerts-page">
      <div className="container">
        <div className="alerts-header">
          <h1>🚨 Alerts & Incidents</h1>
          <p className="alerts-subtitle">Real-time crisis updates and emergency broadcasts</p>
        </div>

        {/* Tab Navigation */}
        <div className="alerts-tabs">
          <button
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All ({alerts.length + incidents.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'broadcasts' ? 'active' : ''}`}
            onClick={() => setActiveTab('broadcasts')}
          >
            Broadcasts ({alerts.length})
          </button>
          <button
            className={`tab-btn ${activeTab === 'incidents' ? 'active' : ''}`}
            onClick={() => setActiveTab('incidents')}
          >
            Incidents ({incidents.length})
          </button>
        </div>

        {!user ? (
          <div className="alerts-login-prompt">
            <p>Please login to view active alerts and incidents.</p>
          </div>
        ) : loading ? (
          <div className="alerts-loading">
            <div className="loading-spinner"></div>
            <p>Loading data...</p>
          </div>
        ) : totalCount === 0 ? (
          <div className="alerts-empty">
            <FaInfoCircle style={{ fontSize: '48px', color: '#6c757d', marginBottom: '20px' }} />
            <h3>No Active Data</h3>
            <p>There are currently no active alerts or incidents.</p>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#999' }}>
              Check back later for updates or report an incident if you need assistance.
            </p>
          </div>
        ) : (
          <div className="alerts-list">
            {/* Display Alerts/Broadcasts */}
            {displayAlerts.map((alert) => (
              <div
                key={`alert-${alert._id}`}
                className="alert-card broadcast-card"
                style={{
                  borderLeft: `4px solid ${getAlertColor(alert.type)}`,
                  backgroundColor: `${getAlertColor(alert.type)}10`
                }}
              >
                <div className="alert-header">
                  <div className="alert-title-section">
                    <span style={{ color: getAlertColor(alert.type) }}>
                      {getAlertIcon(alert.type)}
                    </span>
                    <h3>{alert.title}</h3>
                  </div>
                  <div className="alert-badges">
                    <span className="alert-badge" style={{ backgroundColor: getAlertColor(alert.type) }}>
                      BROADCAST
                    </span>
                    <span className="alert-badge alert-badge-secondary">
                      {getTargetAudienceText(alert.targetAudience)}
                    </span>
                  </div>
                </div>
                <div className="alert-body">
                  <p>{alert.message}</p>
                </div>
                <div className="alert-footer">
                  <div className="alert-meta">
                    <FaClock style={{ fontSize: '12px', marginRight: '5px' }} />
                    <span>{new Date(alert.createdAt).toLocaleString()}</span>
                    {alert.createdBy && (
                      <>
                        <span style={{ margin: '0 10px' }}>•</span>
                        <span>By: {alert.createdBy.name || alert.createdBy.email}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Display Incidents */}
            {displayIncidents.map((incident) => (
              <div
                key={`incident-${incident._id}`}
                className="alert-card incident-card"
                style={{
                  borderLeft: `4px solid ${getIncidentSeverityColor(incident.severity)}`,
                  backgroundColor: `${getIncidentSeverityColor(incident.severity)}10`
                }}
              >
                <div className="alert-header">
                  <div className="alert-title-section">
                    <span style={{ color: getIncidentSeverityColor(incident.severity) }}>
                      <FaExclamationTriangle className="alert-icon" />
                    </span>
                    <h3>{incident.type}</h3>
                  </div>
                  <div className="alert-badges">
                    <span className="alert-badge" style={{ backgroundColor: getStatusColor(incident.status) }}>
                      {getStatusText(incident.status)}
                    </span>
                    <span className="alert-badge" style={{ backgroundColor: getIncidentSeverityColor(incident.severity) }}>
                      SEVERITY {incident.severity}
                    </span>
                  </div>
                </div>
                <div className="alert-body">
                  <p>{incident.description}</p>
                  <div className="incident-details">
                    <div className="detail-item">
                      <FaMapMarkerAlt style={{ marginRight: '5px' }} />
                      <span>{incident.location}</span>
                    </div>
                    {incident.reportedBy && (
                      <div className="detail-item">
                        <FaUser style={{ marginRight: '5px' }} />
                        <span>Reported by: {incident.reportedBy.name || incident.reportedBy.email}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="alert-footer">
                  <div className="alert-meta">
                    <FaClock style={{ fontSize: '12px', marginRight: '5px' }} />
                    <span>{new Date(incident.createdAt).toLocaleString()}</span>
                    {incident.acceptedBy && (
                      <>
                        <span style={{ margin: '0 10px' }}>•</span>
                        <span>Handled by: {incident.acceptedBy.name || 'Volunteer'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Alerts;
