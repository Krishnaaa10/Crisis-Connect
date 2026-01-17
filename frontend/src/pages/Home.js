import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { Icon } from 'leaflet';
import api from '../utils/axiosConfig';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Home.css';

// Component to handle map center updates
function MapController({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);
  return null;
}

const Home = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: {
      latitude: null,
      longitude: null,
      address: ''
    },
    category: 'other',
    priority: 'medium'
  });
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState([28.6139, 77.2090]);
  const [userLocation, setUserLocation] = useState(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [requests, setRequests] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [mapZoom, setMapZoom] = useState(6);
  const [stats, setStats] = useState({ support: 0, response: 0, free: 0 });

  useEffect(() => {
    fetchActiveRequests();
    getCurrentLocation();

    // Animate stats counter
    const intervals = [];

    // Support: 24/7
    let supportCount = 0;
    const supportInterval = setInterval(() => {
      supportCount += 2;
      if (supportCount >= 24) {
        supportCount = 24;
        clearInterval(supportInterval);
      }
      setStats(prev => ({ ...prev, support: supportCount }));
    }, 30);
    intervals.push(supportInterval);

    // Response: <5
    let responseCount = 0;
    const responseInterval = setInterval(() => {
      responseCount += 0.2;
      if (responseCount >= 5) {
        responseCount = 5;
        clearInterval(responseInterval);
      }
      setStats(prev => ({ ...prev, response: responseCount }));
    }, 30);
    intervals.push(responseInterval);

    // Free: 100%
    let freeCount = 0;
    const freeInterval = setInterval(() => {
      freeCount += 5;
      if (freeCount >= 100) {
        freeCount = 100;
        clearInterval(freeInterval);
      }
      setStats(prev => ({ ...prev, free: freeCount }));
    }, 20);
    intervals.push(freeInterval);

    // Track mouse for parallax effects
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      intervals.forEach(interval => clearInterval(interval));
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser.');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation([latitude, longitude]);
        setMapCenter([latitude, longitude]);
        setMapZoom(18); // Auto zoom to street level when location is detected
        setFormData(prev => ({
          ...prev,
          location: {
            ...prev.location,
            latitude,
            longitude,
            address: prev.location.address || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
          }
        }));
        toast.success(`Location detected!`);
        setGettingLocation(false);
      },
      (error) => {
        setGettingLocation(false);
        toast.error('Location access denied. Please enable location permissions.');
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  };

  const fetchActiveRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      const response = await api.get('/api/requests');
      const activeRequests = (response.data || []).filter(
        r => r.status === 'pending' || r.status === 'claimed'
      );
      setRequests(activeRequests);
    } catch (error) {
      if (error.response?.status !== 401) {
        console.error('Error fetching requests:', error);
      }
    }
  };

  const handleLocationClick = () => {
    if (userLocation) {
      // Zoom to street level (18-19 for street view)
      setMapZoom(18);
      setMapCenter(userLocation);
      setFormData(prev => ({
        ...prev,
        location: {
          ...prev.location,
          latitude: userLocation[0],
          longitude: userLocation[1]
        }
      }));
      toast.success('Zoomed to your location');
    } else {
      getCurrentLocation();
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTriggerAlert = async (e) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please login to create an emergency alert');
      navigate('/login');
      return;
    }

    if (user.role !== 'civilian') {
      toast.error('Only civilians can create help requests');
      return;
    }

    if (!formData.title || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!formData.location || !formData.location.latitude || !formData.location.longitude) {
      toast.error('Please allow location access or provide location manually');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/requests', formData);
      toast.success('Emergency alert created successfully! Volunteers will be notified.');
      setFormData({
        title: '',
        description: '',
        location: {
          latitude: userLocation ? userLocation[0] : null,
          longitude: userLocation ? userLocation[1] : null,
          address: ''
        },
        category: 'other',
        priority: 'medium'
      });
      fetchActiveRequests();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create emergency alert';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return '#dc3545';
      case 'high': return '#fd7e14';
      case 'medium': return '#ffc107';
      case 'low': return '#28a745';
      default: return '#6c757d';
    }
  };

  const safetyTips = [
    {
      icon: '🏠',
      title: 'Before a Disaster',
      items: ['Create an emergency kit with water, food, and first aid', 'Have a family communication plan', 'Know evacuation routes from your area', 'Keep important documents in a waterproof container']
    },
    {
      icon: '⚠️',
      title: 'During an Emergency',
      items: ['Stay calm and assess the situation', 'Follow instructions from authorities', 'Use this platform to report your location and needs', 'Stay indoors if advised, or evacuate if necessary']
    },
    {
      icon: '📱',
      title: 'Using This Platform',
      items: ['Enable location services for faster response', 'Provide clear, detailed information about your situation', 'Update your status as the situation changes', 'Stay connected to receive help notifications']
    },
    {
      icon: '🆘',
      title: 'After a Disaster',
      items: ['Check for injuries and provide first aid if trained', 'Report your status as safe or needing assistance', 'Help others if you\'re able and safe to do so', 'Follow official recovery instructions']
    },
    {
      icon: '📻',
      title: 'Stay Informed',
      items: ['Keep a battery-powered radio for emergency updates', 'Follow official social media accounts for real-time alerts', 'Download emergency apps and enable notifications', 'Share verified information with family and neighbors']
    },
    {
      icon: '💼',
      title: 'Emergency Supplies',
      items: ['Maintain a 3-day supply of water (1 gallon per person per day)', 'Stock non-perishable food items and a manual can opener', 'Keep flashlights, batteries, and a first aid kit ready', 'Store important medications and copies of documents']
    }
  ];

  return (
    <div className="home-modern">
      {/* Animated Background Particles */}
      <div className="particles-background">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${5 + Math.random() * 10}s`
          }}></div>
        ))}
      </div>

      {/* Modern Hero Section */}
      <section className="hero-modern">
        <div className="hero-content-modern">
          <div className="hero-badge">
            <span className="pulse-dot"></span>
            Live Emergency Response System
          </div>
          <h1 className="hero-title-modern">
            <span className="title-line-1">Your Safety,</span>
            <span className="title-line-2">Our Priority</span>
          </h1>
          <p className="hero-subtitle-modern">
            Real-time disaster management platform connecting communities with instant emergency response
          </p>
          <div className="hero-stats-modern">
            <div className="hero-stat-item">
              <div className="stat-number-modern">{stats.support}<span className="stat-slash">/</span>7</div>
              <div className="stat-label-modern">Support</div>
            </div>
            <div className="stat-divider"></div>
            <div className="hero-stat-item">
              <div className="stat-number-modern">&lt;{Math.floor(stats.response)}</div>
              <div className="stat-label-modern">Min Response</div>
            </div>
            <div className="stat-divider"></div>
            <div className="hero-stat-item">
              <div className="stat-number-modern">{Math.floor(stats.free)}<span className="stat-percent">%</span></div>
              <div className="stat-label-modern">Free</div>
            </div>
          </div>
          <div className="hero-actions-modern">
            {!user ? (
              <>
                <button onClick={() => navigate('/register')} className="btn-hero-primary">
                  <span>Get Started Free</span>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <button onClick={() => navigate('/login')} className="btn-hero-secondary">
                  Sign In
                </button>
              </>
            ) : (
              <button onClick={() => navigate('/dashboard')} className="btn-hero-primary">
                <span>Go to Dashboard</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
          </div>
        </div>
        <div className="hero-visual-modern">
          <div className="hologram-effect-container">
            <div className="live-monitor-container">
              {/* Monitor Header */}
              <div className="monitor-header">
                <div className="status-indicator">
                  <span className="blink-dot"></span>
                  LIVE SYSTEM STATUS
                </div>
                <div className="system-id">SYS-OVW-01</div>
              </div>

              {/* Main Monitor Content */}
              <div className="monitor-content">
                {/* Left Side: Radar & Core Stats */}
                <div className="monitor-left">
                  <div className="radar-container">
                    <div className="radar-circle"></div>
                    <div className="radar-sweep"></div>
                    <div className="radar-blip blip-1"></div>
                    <div className="radar-blip blip-2"></div>
                    <div className="radar-center"></div>
                  </div>
                  <div className="core-stat-box">
                    <div className="stat-label">ACTIVE UNITS</div>
                    <div className="stat-value text-blue">42</div>
                  </div>
                </div>

                {/* Right Side: Activity Feed */}
                <div className="monitor-right">
                  <div className="feed-header">RECENT EVENTS</div>
                  <div className="activity-feed">
                    <div className="feed-item warning">
                      <span className="time">12:42</span>
                      <span className="message">⚠️ Flood Warning: Sector 4</span>
                    </div>
                    <div className="feed-item success">
                      <span className="time">12:40</span>
                      <span className="message">🚑 Unit 7 Arrived at Scene</span>
                    </div>
                    <div className="feed-item info">
                      <span className="time">12:38</span>
                      <span className="message">📡 Network Sync Complete</span>
                    </div>
                    <div className="feed-item warning">
                      <span className="time">12:35</span>
                      <span className="message">⚠️ High Water Level: Zone B</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Monitor Footer */}
              <div className="monitor-footer">
                <div className="footer-stat">
                  <span className="label">AVG RESPONSE</span>
                  <span className="value text-amber">3m 12s</span>
                </div>
                <div className="footer-stat">
                  <span className="label">SIGNAL STR</span>
                  <span className="value text-green">100%</span>
                </div>
              </div>

              {/* Decorative Corners */}
              <div className="corner-bracket top-left"></div>
              <div className="corner-bracket top-right"></div>
              <div className="corner-bracket bottom-left"></div>
              <div className="corner-bracket bottom-right"></div>
            </div>

            {/* Holographic Projection Base */}
            <div className="hologram-base"></div>
            <div className="hologram-scanner"></div>
          </div>
        </div>
      </section>

      {/* Quick Emergency Form - Floating */}
      {user && user.role === 'civilian' && (
        <section className="quick-emergency-section">
          <div className="quick-emergency-card">
            <div className="quick-emergency-header">
              <h3>🚨 Report Emergency</h3>
              <p>Get help in minutes, not hours</p>
            </div>
            <form onSubmit={handleTriggerAlert} className="quick-emergency-form">
              <div className="form-row-quick">
                <input
                  type="text"
                  placeholder="Emergency title..."
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  className="input-quick"
                  required
                />
                <select
                  value={formData.priority}
                  onChange={handleInputChange}
                  name="priority"
                  className="select-quick"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <textarea
                placeholder="Describe your emergency..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="textarea-quick"
                rows="2"
                required
              />
              <div className="form-actions-quick">
                <button
                  type="button"
                  onClick={getCurrentLocation}
                  className="btn-location-quick"
                  disabled={gettingLocation}
                >
                  {gettingLocation ? '📍 Getting...' : '📍 Use My Location'}
                </button>
                <button type="submit" className="btn-submit-quick" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Alert'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {/* Features Grid - Modern */}
      <section className="features-modern-section">
        <div className="container-modern">
          <div className="section-header-modern">
            <span className="section-label">Features</span>
            <h2 className="section-title-modern">How Crisis Connect Works</h2>
            <p className="section-description">Everything you need for emergency response in one platform</p>
          </div>
          <div className="features-grid-modern">
            <div className="feature-card-modern">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-modern">🚨</div>
              </div>
              <h3>Instant Alerts</h3>
              <p>Report emergencies with one click. Our system automatically notifies nearby volunteers and responders within seconds.</p>
              <div className="feature-link">Learn more →</div>
            </div>
            <div className="feature-card-modern">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-modern">📍</div>
              </div>
              <h3>Live Tracking</h3>
              <p>Real-time map visualization of all active incidents. Track response teams and coordinate rescue efforts efficiently.</p>
              <div className="feature-link">Learn more →</div>
            </div>
            <div className="feature-card-modern">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-modern">👥</div>
              </div>
              <h3>Volunteer Network</h3>
              <p>Connect with trained volunteers ready to help. Real-time coordination ensures rapid response to critical situations.</p>
              <div className="feature-link">Learn more →</div>
            </div>
            <div className="feature-card-modern">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-modern">⚡</div>
              </div>
              <h3>Fast Response</h3>
              <p>Average response time under 5 minutes. Our advanced notification system ensures help reaches you when it matters most.</p>
              <div className="feature-link">Learn more →</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Map Section - Tactical Satellite Interface */}
      <section className="map-section-modern">
        <div className="container-modern">
          <div className="map-header-modern">
            <div>
              <h2>Live Crisis Map</h2>
              <p>Real-time visualization of active emergencies and response teams</p>
            </div>
            <button onClick={handleLocationClick} className="btn-map-track">
              📍 Track My Location
            </button>
          </div>

          <div className="tactical-map-interface">
            {/* HUD Overlays */}
            <div className="tactical-hud-top">
              <div className="hud-status">
                <span className="status-dot"></span> SATELLITE LINK: ACTIVE
              </div>
              <div className="hud-coordinates">
                LAT: {mousePosition.x.toFixed(2)} | LONG: {mousePosition.y.toFixed(2)}
              </div>
            </div>

            <div className="tactical-grid-overlay"></div>
            <div className="corner-bracket-lg top-left"></div>
            <div className="corner-bracket-lg top-right"></div>
            <div className="corner-bracket-lg bottom-left"></div>
            <div className="corner-bracket-lg bottom-right"></div>

            <div className="live-feed-badge">
              <span className="record-dot"></span> LIVE FEED
            </div>

            <div className="map-container-tactical">
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                style={{ height: '100%', width: '100%', borderRadius: '4px' }} // Sharp corners for tactical look
                whenCreated={(mapInstance) => {
                  setTimeout(() => {
                    mapInstance.invalidateSize();
                  }, 100);
                }}
              >
                <MapController center={mapCenter} zoom={mapZoom} />
                {/* Dark Matter Tiles for Tactical Look */}
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />

                {/* User Location Marker */}
                {userLocation && (
                  <Marker
                    position={userLocation}
                    icon={new Icon({
                      iconUrl: `data:image/svg+xml;base64,${btoa(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
                          <circle cx="20" cy="20" r="18" fill="rgba(0, 183, 255, 0.2)" stroke="#00b7ff" stroke-width="2"/>
                          <circle cx="20" cy="20" r="6" fill="#00b7ff">
                            <animate attributeName="opacity" values="1;0.5;1" dur="1.5s" repeatCount="indefinite"/>
                          </circle>
                          <line x1="20" y1="0" x2="20" y2="40" stroke="#00b7ff" stroke-width="1" opacity="0.5"/>
                          <line x1="0" y1="20" x2="40" y2="20" stroke="#00b7ff" stroke-width="1" opacity="0.5"/>
                        </svg>`
                      )}`,
                      iconSize: [40, 40],
                      iconAnchor: [20, 20]
                    })}
                  >
                    <Popup>
                      <div className="popup-tactical">
                        <h4>📍 TARGET LOCATION</h4>
                        <p>
                          LAT: {userLocation[0].toFixed(6)}<br />
                          LNG: {userLocation[1].toFixed(6)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                )}

                {/* Emergency Request Markers */}
                {requests.map((request) => (
                  <Marker
                    key={request._id}
                    position={[request.location.latitude, request.location.longitude]}
                    icon={new Icon({
                      iconUrl: `data:image/svg+xml;base64,${btoa(
                        `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 30 30">
                          <path d="M15 2 L28 28 L2 28 Z" fill="${getPriorityColor(request.priority)}" stroke="white" stroke-width="2"/>
                          <text x="15" y="24" text-anchor="middle" fill="white" font-size="12" font-weight="bold">!</text>
                        </svg>`
                      )}`,
                      iconSize: [30, 30],
                      iconAnchor: [15, 30]
                    })}
                  >
                    <Popup>
                      <div className="popup-tactical">
                        <h4 style={{ color: getPriorityColor(request.priority) }}>⚠ ALERT: {request.priority.toUpperCase()}</h4>
                        <div className="popup-divider"></div>
                        <h5>{request.title}</h5>
                        <p>{request.description}</p>
                        <div className="status-badge-popup">STATUS: {request.status.toUpperCase()}</div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>
        </div>
      </section>

      {/* Safety Tips - Tabbed */}
      <section className="safety-tips-modern-section">
        <div className="container-modern">
          <div className="section-header-modern">
            <span className="section-label">Preparedness</span>
            <h2 className="section-title-modern">Emergency Preparedness Tips</h2>
            <p className="section-description">Stay safe with expert guidance for every situation</p>
          </div>
          <div className="tabs-container">
            <div className="tabs-header">
              {safetyTips.map((tip, index) => (
                <button
                  key={index}
                  className={`tab-button ${activeTab === index ? 'active' : ''}`}
                  onClick={() => setActiveTab(index)}
                >
                  <span className="tab-icon">{tip.icon}</span>
                  <span className="tab-text">{tip.title}</span>
                </button>
              ))}
            </div>
            <div className="tabs-content">
              <div className="tab-panel active">
                <div className="tip-content-card">
                  <div className="tip-header-card">
                    <div className="tip-icon-large">{safetyTips[activeTab].icon}</div>
                    <h3>{safetyTips[activeTab].title}</h3>
                  </div>
                  <ul className="tip-list-modern">
                    {safetyTips[activeTab].items.map((item, idx) => (
                      <li key={idx}>
                        <span className="check-icon">✓</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us - Modern */}
      <section className="why-choose-modern-section">
        <div className="container-modern">
          <div className="section-header-modern">
            <span className="section-label">Why Us</span>
            <h2 className="section-title-modern">Why Choose Crisis Connect?</h2>
          </div>
          <div className="benefits-grid-modern">
            <div className="benefit-card-modern">
              <div className="benefit-number">01</div>
              <h3>Lightning Fast</h3>
              <p>Our advanced notification system ensures help reaches you within minutes, not hours.</p>
            </div>
            <div className="benefit-card-modern">
              <div className="benefit-number">02</div>
              <h3>Nationwide Network</h3>
              <p>Connect with volunteers and responders across the entire country.</p>
            </div>
            <div className="benefit-card-modern">
              <div className="benefit-number">03</div>
              <h3>Secure & Private</h3>
              <p>Your data and location information are protected with enterprise-grade encryption.</p>
            </div>
            <div className="benefit-card-modern">
              <div className="benefit-number">04</div>
              <h3>Community Driven</h3>
              <p>Built by the community, for the community. Join thousands making a real difference.</p>
            </div>
            <div className="benefit-card-modern">
              <div className="benefit-number">05</div>
              <h3>Real-Time Updates</h3>
              <p>Track incidents, responses, and updates in real-time with live maps and notifications.</p>
            </div>
            <div className="benefit-card-modern">
              <div className="benefit-number">06</div>
              <h3>Reliable & Trusted</h3>
              <p>Used by thousands during real emergencies. Proven track record of successful rescues.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Modern */}
      <section className="testimonials-modern-section">
        <div className="container-modern">
          <div className="section-header-modern">
            <span className="section-label">Testimonials</span>
            <h2 className="section-title-modern">Trusted by Thousands</h2>
            <p className="section-description">Real stories from real people</p>
          </div>
          <div className="testimonials-grid-modern">
            <div className="testimonial-card-modern">
              <div className="testimonial-quote-icon">"</div>
              <p>Crisis Connect was a lifesaver during the recent floods. I reported my location, and help arrived faster than I ever expected. Truly an essential service!</p>
              <div className="testimonial-author-modern">
                <div className="author-avatar-modern">SJ</div>
                <div>
                  <div className="author-name-modern">Sarah Johnson</div>
                  <div className="author-role-modern">Flood Victim, Mumbai</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card-modern">
              <div className="testimonial-quote-icon">"</div>
              <p>As a volunteer, Crisis Connect makes it incredibly easy to find where help is most needed. The real-time alerts and coordination tools are invaluable.</p>
              <div className="testimonial-author-modern">
                <div className="author-avatar-modern">MT</div>
                <div>
                  <div className="author-name-modern">Mark Thompson</div>
                  <div className="author-role-modern">Volunteer, Delhi</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card-modern">
              <div className="testimonial-quote-icon">"</div>
              <p>The preparedness tips on Crisis Connect helped my family stay safe during the earthquake. Knowing what to do made all the difference.</p>
              <div className="testimonial-author-modern">
                <div className="author-avatar-modern">ER</div>
                <div>
                  <div className="author-name-modern">Emily Rodriguez</div>
                  <div className="author-role-modern">Prepared Citizen, Bangalore</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Modern */}
      {!user && (
        <section className="cta-modern-section">
          <div className="cta-content-modern">
            <h2>Ready to Make a Difference?</h2>
            <p>Join our community of volunteers or register to get help when you need it most.</p>
            <div className="cta-buttons-modern">
              <button onClick={() => navigate('/register')} className="btn-cta-primary">
                Register Now
              </button>
              <button onClick={() => navigate('/about')} className="btn-cta-secondary">
                Learn More
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
