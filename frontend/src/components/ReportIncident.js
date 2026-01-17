import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import './ReportIncident.css';

const ReportIncident = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    location: '',
    type: '',
    severity: 3,
    description: '',
    latitude: 0,
    longitude: 0
  });
  const [gettingLocation, setGettingLocation] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if running on HTTPS or localhost
  useEffect(() => {
    const isSecureContext = window.isSecureContext ||
      window.location.protocol === 'https:' ||
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1';
    if (!isSecureContext && navigator.geolocation) {
      console.warn('ReportIncident: Geolocation may require HTTPS. Current protocol:', window.location.protocol);
    }
  }, []);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setGettingLocation(true);
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000 // Accept cached location up to 1 minute old
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setFormData({
          ...formData,
          latitude: latitude,
          longitude: longitude
        });
        setGettingLocation(false);
        toast.success('Location captured successfully!');
      },
      (error) => {
        setGettingLocation(false);
        let errorMessage = 'Failed to get location. ';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage += 'Please allow location access or enter coordinates manually.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage += 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage += 'Location request timed out. Please try again.';
            break;
          default:
            errorMessage += 'Unknown error occurred.';
        }
        toast.error(errorMessage);
      },
      options
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'severity' ? parseInt(value) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.location || !formData.type || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Validate coordinates
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);

    if (isNaN(lat) || isNaN(lng) || lat === 0 || lng === 0) {
      toast.error('Please capture your location or enter valid coordinates');
      return;
    }

    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      toast.error('Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180');
      return;
    }

    // Validate severity
    if (formData.severity < 1 || formData.severity > 5) {
      toast.error('Severity must be between 1 and 5');
      return;
    }

    setSubmitting(true);

    try {
      const response = await api.post('/api/incidents/report', {
        location: formData.location,
        type: formData.type,
        severity: formData.severity,
        description: formData.description,
        latitude: lat,
        longitude: lng
      });

      toast.success('Incident reported successfully! Admin will review and verify.');
      setFormData({
        location: '',
        type: '',
        severity: 3,
        description: '',
        latitude: 0,
        longitude: 0
      });
    } catch (error) {
      console.error('Error reporting incident:', error);
      toast.error(error.response?.data?.message || 'Failed to report incident');
    } finally {
      setSubmitting(false);
    }
  };

  const incidentTypes = [
    'Fire',
    'Flood',
    'Earthquake',
    'Medical Emergency',
    'Structural Collapse',
    'Power Outage',
    'Water Supply Issue',
    'Transportation Disruption',
    'Other'
  ];

  return (
    <div className="report-incident-page" style={{
      height: '100vh',
      overflow: 'hidden',
      padding: '100px 20px 20px', // Increased top padding to clear navbar
      background: `linear-gradient(rgba(5, 10, 20, 0.92), rgba(5, 10, 20, 0.92)), url(${process.env.PUBLIC_URL}/assets/admin_bg.png)`, // Full page BG
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <div className="report-incident-card" style={{
        background: `linear-gradient(rgba(5, 10, 20, 0.95), rgba(5, 10, 20, 0.95)), url(${process.env.PUBLIC_URL}/assets/report_modal_bg.png)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        border: '1px solid rgba(255, 51, 102, 0.5)',
        boxShadow: '0 0 50px rgba(255, 51, 102, 0.2)',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '100%'
      }}>
        <div className="report-incident-header">
          <h2 style={{
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
          }}>
            🚨 Unified Incident Report
          </h2>
          <p style={{ color: '#aaa' }}>Secure tactical channel for civilian emergency reporting.</p>
        </div>

        <form onSubmit={handleSubmit} className="report-incident-form">
          <div className="form-group-grid">
            <div className="form-group">
              <label>Incident Type</label>
              <select name="type" value={formData.type} onChange={handleChange} required>
                <option value="">Select Type...</option>
                {incidentTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Location Name</label>
              <input type="text" name="location" value={formData.location} onChange={handleChange} placeholder="e.g. Sector 4 Plaza" required />
            </div>
          </div>

          <div className="form-group-grid">
            <div className="form-group">
              <label>Severity Level (1-5)</label>
              <select name="severity" value={formData.severity} onChange={handleChange} required>
                {[1, 2, 3, 4, 5].map(num => <option key={num} value={num}>{num} - {num === 5 ? 'Critical' : num === 1 ? 'Low' : 'Standard'}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Coordinates</label>
              <button type="button" onClick={handleGetLocation} className="btn-detect">
                {gettingLocation ? '🛰️ Linking Satellites...' : '📍 GPS Auto-Detect'}
              </button>
            </div>
          </div>

          <div className="form-group">
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <input type="number" placeholder="Lat" value={formData.latitude} readOnly style={{ background: 'rgba(0,0,0,0.5)', color: '#00ff9d' }} />
              <input type="number" placeholder="Long" value={formData.longitude} readOnly style={{ background: 'rgba(0,0,0,0.5)', color: '#00ff9d' }} />
            </div>
          </div>

          <div className="form-group">
            <label>Tactical Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe situation parameters..."
              rows="4"
              required
            />
          </div>

          <button type="submit" className="submit-btn-tactical" disabled={submitting}>
            {submitting ? 'TRANSMITTING...' : '⚠️ TRANSMIT ALERT'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReportIncident;


