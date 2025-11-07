import React, { useState } from 'react';
import { toast } from 'react-toastify';
import './Contact.css';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    toast.success('Thank you for your message! We will get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="contact-hero-content">
          <h1 className="contact-title">
            <span className="title-icon">📞</span>
            Get in Touch
          </h1>
          <p className="contact-subtitle">We're here to help. Reach out to us anytime!</p>
        </div>
      </div>

      <div className="container">
        <div className="contact-content">
          {/* Contact Info Cards */}
          <div className="contact-info-section">
            <div className="info-card">
              <div className="info-icon">📧</div>
              <h3>Email Us</h3>
              <p>Send us an email anytime!</p>
              <a href="mailto:support@crisisconnect.com" className="contact-link">
                support@crisisconnect.com
              </a>
            </div>

            <div className="info-card">
              <div className="info-icon">📱</div>
              <h3>Call Us</h3>
              <p>Available 24/7 for emergencies</p>
              <a href="tel:+911234567890" className="contact-link">
                +91-123-456-7890
              </a>
            </div>

            <div className="info-card">
              <div className="info-icon">📍</div>
              <h3>Visit Us</h3>
              <p>Our headquarters</p>
              <span className="contact-link">123 Emergency Street, New Delhi, India</span>
            </div>

            <div className="info-card">
              <div className="info-icon">⏰</div>
              <h3>Response Time</h3>
              <p>We typically respond within</p>
              <span className="contact-link highlight">Less than 5 minutes</span>
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-wrapper">
            <div className="form-header">
              <h2>Send us a Message</h2>
              <p>Fill out the form below and we'll get back to you as soon as possible.</p>
            </div>
            
            <form onSubmit={handleSubmit} className="contact-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">
                    <span className="label-icon">👤</span>
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="Enter your full name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email">
                    <span className="label-icon">✉️</span>
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control"
                    placeholder="your.email@example.com"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="subject">
                  <span className="label-icon">📋</span>
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="What is this regarding?"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="message">
                  <span className="label-icon">💬</span>
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  className="form-control"
                  rows="6"
                  placeholder="Tell us more about your inquiry..."
                  required
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary btn-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="submit-content">
                    <span className="spinner"></span>
                    Sending...
                  </span>
                ) : (
                  <span className="submit-content">
                    <span className="submit-icon">🚀</span>
                    Send Message
                  </span>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Additional Info Section */}
        <div className="contact-extra">
          <div className="extra-card">
            <div className="extra-icon">🆘</div>
            <h3>Emergency Support</h3>
            <p>For urgent matters, please use our emergency alert system on the home page.</p>
          </div>
          <div className="extra-card">
            <div className="extra-icon">💡</div>
            <h3>FAQ</h3>
            <p>Check out our frequently asked questions for quick answers to common queries.</p>
          </div>
          <div className="extra-card">
            <div className="extra-icon">🤝</div>
            <h3>Volunteer</h3>
            <p>Interested in joining our volunteer network? Register as a volunteer today!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
