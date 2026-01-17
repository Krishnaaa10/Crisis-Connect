import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import io from 'socket.io-client';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './Dashboard.css';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // State
  const [showForm, setShowForm] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    type: '',
    severity: 3,
    description: '',
    latitude: 0,
    longitude: 0
  });

  // Socket ref
  const socketRef = useRef(null);

  // User's current location for map
  const [userLocation, setUserLocation] = useState(null);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]); // Default: New Delhi, India
  const [mapZoom, setMapZoom] = useState(10);

  // Check if running on HTTPS or localhost
  useEffect(() => {
    const isSecureContext = window.isSecureContext || window.location.protocol === 'https:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isSecureContext && navigator.geolocation) {
      console.warn('Dashboard: Geolocation may require HTTPS. Current protocol:', window.location.protocol);
    }
  }, []);

  // Fetch incidents reported by this user
  const {
    data: incidents = [],
    isLoading: incidentsLoading,
    error: incidentsError,
    refetch: refetchIncidents
  } = useQuery({
    queryKey: ['userIncidents', user?._id || user?.id],
    queryFn: async () => {
      const userId = user?._id || user?.id;
      const response = await api.get('/api/incidents/my-reports');
      return response.data || [];
    },
    enabled: !!(user?._id || user?.id) && user?.role === 'civilian',
    refetchInterval: 30000,
  });

  // Fetch old HelpRequests reported by this user
  const {
    data: helpRequests = [],
    isLoading: helpRequestsLoading,
    error: helpRequestsError,
    refetch: refetchHelpRequests
  } = useQuery({
    queryKey: ['userHelpRequests', user?._id || user?.id],
    queryFn: async () => {
      const response = await api.get('/api/requests');
      return response.data || [];
    },
    enabled: !!(user?._id || user?.id) && user?.role === 'civilian',
    refetchInterval: 30000,
  });

  // Fetch volunteer profile/tasks (for completeness, though mainly civilian view here)
  const { data: volunteerProfile, isLoading: volunteerProfileLoading } = useQuery({
    queryKey: ['volunteerProfile', user?._id || user?.id],
    queryFn: async () => {
      const userId = user?._id || user?.id;
      if (!userId) return null;
      try {
        const response = await api.get(`/api/tasks/user/${userId}`);
        return response.data;
      } catch (error) { return null; }
    },
    enabled: !!(user?._id || user?.id) && (user?.role === 'volunteer' || user?.role === 'admin'),
  });

  const { data: volunteerTasks = [], isLoading: volunteerTasksLoading } = useQuery({
    queryKey: ['volunteerTasks', volunteerProfile?._id],
    queryFn: async () => {
      if (!volunteerProfile?._id) return [];
      try {
        const response = await api.get(`/api/tasks/volunteer/${volunteerProfile._id}`);
        return response.data || [];
      } catch (error) { return []; }
    },
    enabled: !!volunteerProfile?._id,
    refetchInterval: 5000,
  });

  // Combine incidents and help requests
  const allItems = useMemo(() => {
    const items = [];
    incidents.forEach(incident => {
      let locationString = incident.location || 'Unknown';
      if (typeof locationString !== 'string') {
        locationString = incident.address ? incident.address :
          (incident.latitude ? `${incident.latitude}, ${incident.longitude}` : String(locationString));
      }
      items.push({
        _itemId: incident._id,
        _itemType: 'incident',
        displayType: incident.type,
        displayDescription: incident.description || '',
        displayLocation: locationString,
        displayCreatedAt: incident.createdAt,
        severity: incident.severity,
        status: incident.status,
        displayStatus: incident.status,
        ...incident
      });
    });

    helpRequests.forEach(request => {
      let displayStatus = 0;
      if (request.status === 'claimed') displayStatus = 2;
      else if (request.status === 'completed') displayStatus = 3;
      else if (request.status === 'verified') displayStatus = 1;

      let locationString = 'Unknown';
      if (request.location) {
        locationString = typeof request.location === 'string' ? request.location :
          (request.location.address ? request.location.address : JSON.stringify(request.location));
      }

      items.push({
        _itemId: request._id,
        _itemType: 'helpRequest',
        displayType: request.title || request.category || 'Help Request',
        displayDescription: request.description || '',
        displayLocation: locationString,
        displayCreatedAt: request.createdAt,
        priority: request.priority,
        status: request.status,
        displayStatus: displayStatus,
        ...request
      });
    });

    items.sort((a, b) => new Date(b.displayCreatedAt) - new Date(a.displayCreatedAt));
    return items;
  }, [incidents, helpRequests]);

  const requestsLoading = incidentsLoading || helpRequestsLoading;

  const refetchRequests = async () => {
    await Promise.all([refetchIncidents(), refetchHelpRequests()]);
  };

  // Fetch map data
  const { data: mapIncidents = [] } = useQuery({
    queryKey: ['mapIncidents'],
    queryFn: async () => {
      const response = await api.get('/api/incidents/map-data');
      return response.data || [];
    },
    enabled: user?.role === 'civilian',
    refetchInterval: 30000,
  });

  const { data: mapRequests = [] } = useQuery({
    queryKey: ['mapRequests'],
    queryFn: async () => {
      const response = await api.get('/api/requests/map-data');
      return response.data || [];
    },
    enabled: user?.role === 'civilian',
    refetchInterval: 30000,
  });

  // Geolocation
  useEffect(() => {
    if (user?.role !== 'civilian') return;
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);
        if (!isNaN(lat) && !isNaN(lng) && lat !== 0 && lng !== 0) {
          setUserLocation([lat, lng]);
          setMapCenter([lat, lng]);
          setMapZoom(13);
        }
      },
      (error) => console.warn('Dashboard: Could not get user location', error),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, [user?.role]);

  // Map Markers
  const mapMarkers = useMemo(() => {
    const markers = [];
    mapIncidents.forEach(incident => {
      if (incident.latitude && incident.longitude) {
        markers.push({
          id: `incident-${incident._id}`,
          type: 'incident',
          position: [incident.latitude, incident.longitude],
          data: incident
        });
      }
    });
    mapRequests.forEach(request => {
      if (request.latitude && request.longitude) {
        markers.push({
          id: `request-${request._id}`,
          type: 'helpRequest',
          position: [request.latitude, request.longitude],
          data: request
        });
      }
    });
    return markers;
  }, [mapIncidents, mapRequests]);

  // Create Incident Mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (submitData) => api.post('/api/incidents/report', submitData),
    onSuccess: () => {
      toast.success('Incident reported successfully!');
      setShowForm(false);
      setFormData({
        location: '', type: '', severity: 3, description: '', latitude: 0, longitude: 0
      });
      queryClient.invalidateQueries(['userIncidents', user?._id || user?.id]);
      refetchIncidents();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Failed to report incident'),
  });

  // Socket
  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!userId) return;

    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    socketRef.current = io(socketUrl, { reconnection: true });

    socketRef.current.on('new-incident', () => {
      queryClient.invalidateQueries(['userIncidents', userId]);
      queryClient.invalidateQueries(['mapIncidents']);
    });

    socketRef.current.on('incident-verified', () => {
      queryClient.invalidateQueries(['userIncidents', userId]);
      queryClient.invalidateQueries(['mapIncidents']);
    });

    return () => { if (socketRef.current) socketRef.current.disconnect(); };
  }, [user?._id, queryClient]);

  // Handle Location Click
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation not supported');
      return;
    }
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = Number(position.coords.latitude);
        const lng = Number(position.coords.longitude);
        setFormData(prev => ({ ...prev, latitude: lat, longitude: lng }));
        toast.success(`Location captured: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setGettingLocation(false);
      },
      (error) => {
        toast.error('Failed to get location');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.latitude || !formData.longitude) {
      toast.error('Please capture location first');
      return;
    }
    const submitData = {
      ...formData,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude)
    };
    createIncidentMutation.mutate(submitData);
  };

  // Stats
  const { data: statsData } = useQuery({
    queryKey: ['incidentStats'],
    queryFn: async () => {
      const response = await api.get('/api/incidents/stats');
      return response.data?.data || {};
    },
    refetchInterval: 10000,
  });

  const stats = useMemo(() => ({
    totalReported: statsData?.totalReported || 0,
    activeReports: statsData?.totalActive || 0,
    pendingReports: statsData?.pending || 0,
    completedReports: statsData?.resolved || 0
  }), [statsData]);

  // Recent Activity Feed
  const displayActivity = useMemo(() => {
    const recent = allItems.slice(0, 5);
    if (recent.length >= 5) return recent;

    const mockAlerts = [
      { _itemId: 'm1', displayType: 'SYSTEM', displayDescription: 'Weather Warning: Heavy rains expected.', displayCreatedAt: new Date().toISOString(), status: 2 },
      { _itemId: 'm2', displayType: 'NETWORK', displayDescription: 'Relief camp operational.', displayCreatedAt: new Date().toISOString(), status: 3 },
      { _itemId: 'm3', displayType: 'BROADCAST', displayDescription: 'Emergency lines active.', displayCreatedAt: new Date().toISOString(), status: 0 },
    ];
    return [...recent, ...mockAlerts].slice(0, 5);
  }, [allItems]);

  if (authLoading) return <div className="loading-container">Loading...</div>;

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">

        {/* 1. Header & Stats Row */}
        <div className="dashboard-header-row">
          <div className="stats-card">
            <span className="stat-label">Total Incidents</span>
            <span className="stat-value">{stats.totalReported}</span>
          </div>
          <div className="stats-card">
            <span className="stat-label">Active</span>
            <span className="stat-value active">{stats.activeReports}</span>
          </div>
          <div className="stats-card">
            <span className="stat-label">Pending</span>
            <span className="stat-value pending">{stats.pendingReports}</span>
          </div>
          <div className="stats-card">
            <span className="stat-label">Resolved</span>
            <span className="stat-value resolved">{stats.completedReports}</span>
          </div>
          <div className="stats-card system-status">
            <span className="stat-label">System Status</span>
            <span className="stat-value online">ONLINE</span>
          </div>
        </div>

        <div className="dashboard-main-grid">

          {/* 2. Main Column: Map & Guide */}
          <div className="main-content-col">

            {/* Confined Map Box */}
            <div className="map-panel-container">
              <div className="panel-header">
                <h3>📍 Live Incident Map</h3>
                <div className="map-controls">
                  <span className="live-indicator">● LIVE</span>
                </div>
              </div>
              <div className="map-wrapper">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  scrollWheelZoom={true}
                  style={{ width: '100%', height: '100%' }}
                  zoomControl={false}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  {userLocation && (
                    <CircleMarker
                      center={userLocation}
                      radius={8}
                      pathOptions={{ color: '#00f0ff', fillColor: '#00f0ff', fillOpacity: 0.8 }}
                    >
                      <Popup><div><h4 style={{ color: '#00f0ff', margin: 0 }}>YOU ARE HERE</h4></div></Popup>
                    </CircleMarker>
                  )}
                  {mapMarkers.map(marker => (
                    <Marker key={marker.id} position={marker.position}>
                      <Popup>
                        <strong>{marker.data.displayType || marker.data.type}</strong>
                        <br />
                        {marker.data.displayDescription || marker.data.description}
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>

            {/* Civilian Guide Section */}
            <div className="guide-panel-container">
              <div className="panel-header">
                <h3>📘 Civilian Crisis Guide</h3>
              </div>
              <div className="guide-content">
                <div className="guide-card">
                  <div className="guide-icon">🚨</div>
                  <h4>How to Report</h4>
                  <p>Spot a hazard? Click the <strong>Report Incident</strong> button. Provide accurate location and valid details. Every report verifies safety.</p>
                </div>
                <div className="guide-card">
                  <div className="guide-icon">🤝</div>
                  <h4>Offer Help</h4>
                  <p>Registered volunteers receive alerts. Civilians can assist by confirming hazards or providing supplies to local relief camps.</p>
                </div>
                <div className="guide-card">
                  <div className="guide-icon">🔔</div>
                  <h4>Stay Alert</h4>
                  <p>Watch the Live Feed for real-time updates. Avoid red zones on the map. Follow instructions from official broadcasts.</p>
                </div>
              </div>
            </div>

          </div>

          {/* 3. Sidebar Column: Feed & Actions */}
          <div className="sidebar-col">

            {/* Action Panel */}
            <div className="action-panel">
              <button className="primary-action-btn" onClick={() => setShowForm(true)}>
                🚨 REPORT INCIDENT
              </button>
              <div className="secondary-actions">
                <button className="action-btn" onClick={() => handleGetLocation()}>📍 Get Location</button>
                <button className="action-btn" onClick={() => navigate('/alerts')}>🔔 Alerts</button>
              </div>
            </div>

            {/* Live Feed */}
            <div className="feed-panel">
              <div className="panel-header">
                <h3>📡 Live Feed</h3>
              </div>
              <div className="feed-list">
                {displayActivity.map((item, index) => (
                  <div key={item._itemId || index} className="feed-item">
                    <div className="feed-item-header">
                      <span className={`type-tag ${item.displayType === 'SYSTEM' ? 'system' : ''}`}>{item.displayType}</span>
                      <span className="time-tag">{new Date(item.displayCreatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="feed-desc">{item.displayDescription.substring(0, 80)}...</p>
                    <span className={`status-dot status-${item.status}`}>
                      {item.status === 0 ? 'Pending' : item.status === 3 ? 'Resolved' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Modal Form Overlay */}
      {showForm && (
        <div className="modal-overlay">
          <div className="modal-content" style={{
            backgroundImage: `linear-gradient(rgba(5, 10, 20, 0.9), rgba(5, 10, 20, 0.9)), url(${process.env.PUBLIC_URL}/assets/report_modal_bg.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}>
            <div className="modal-header">
              <h3>📝 Report New Incident</h3>
              <button onClick={() => setShowForm(false)} className="close-btn">✖</button>
            </div>
            <form onSubmit={handleSubmit} className="incident-form">
              <div className="form-group">
                <label>Incident Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  required
                >
                  <option value="">Select Type...</option>
                  <option value="Fire">Fire Alert</option>
                  <option value="Medical">Medical Emergency</option>
                  <option value="Flood">Flood Warning</option>
                  <option value="Accident">Traffic Accident</option>
                  <option value="Other">Other Hazard</option>
                </select>
              </div>

              <div className="form-group">
                <label>Location Name</label>
                <input
                  type="text"
                  placeholder="e.g. Near Central Park Gate 4"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  required
                />
              </div>

              <div className="form-group row">
                <div className="half">
                  <label>Latitude</label>
                  <input type="number" step="any" value={formData.latitude} readOnly />
                </div>
                <div className="half">
                  <label>Longitude</label>
                  <input type="number" step="any" value={formData.longitude} readOnly />
                </div>
                <button type="button" className="get-loc-btn" onClick={handleGetLocation}>
                  📍 Detect
                </button>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe the situation..."
                  required
                />
              </div>

              <button type="submit" disabled={createIncidentMutation.isPending} className="submit-btn">
                {createIncidentMutation.isPending ? 'Reporting...' : '📢 SUBMIT REPORT'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
