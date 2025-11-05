import React from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaPhone, FaLinkedin, FaGithub, FaTwitter, FaMapMarkerAlt } from 'react-icons/fa';
import './About.css';

const About = () => {
  return (
    <div className="about-page">
      {/* Hero Section */}
      <div className="about-hero">
        <div className="container">
          <h1>Meet the Founder</h1>
          <p className="hero-subtitle">Building Solutions for Disaster Management & Emergency Response</p>
        </div>
      </div>

      {/* Founder Section */}
      <div className="container">
        <div className="founder-section">
          <div className="founder-image-container">
            <img 
              src={process.env.PUBLIC_URL + "/myphoto.jpg"} 
              alt="ShriKrishna Patel - Founder" 
              className="founder-image"
              onError={(e) => {
                console.error('Image failed to load:', e.target.src);
                // Fallback if image fails to load - use placeholder
                e.target.style.display = 'none';
                const placeholder = e.target.nextElementSibling;
                if (placeholder) placeholder.style.display = 'flex';
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', process.env.PUBLIC_URL + "/myphoto.jpg");
              }}
            />
            <div className="founder-image-placeholder" style={{ display: 'none' }}>
              <span>ShriKrishna Patel</span>
            </div>
          </div>
          <div className="founder-content">
            <h2>About the Founder</h2>
            <p className="founder-name">ShriKrishna Patel</p>
            <p className="founder-title">Founder & Lead Developer</p>
            <div className="founder-description">
              <p>
                Welcome to the Disaster Management & Volunteer Coordination System. I'm passionate about leveraging 
                technology to create meaningful solutions that help communities during crisis situations. This platform 
                was built with the vision of connecting those in need with volunteers and official agencies seamlessly.
              </p>
              <p>
                With years of experience in software development and a deep commitment to social impact, I've created 
                this system to bridge the gap between emergency response efforts and community support, ensuring that 
                help reaches those who need it most, when they need it most.
              </p>
              <p>
                Our mission is to create a more resilient and connected community where everyone can contribute to 
                disaster response efforts, whether you're someone in need, a volunteer, or an official agency 
                coordinating relief efforts.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="contact-section">
          <h2>Get in Touch</h2>
          <div className="contact-grid">
            <div className="contact-card">
              <FaEnvelope className="contact-icon" />
              <h3>Email</h3>
              <a href="mailto:krishnaspattel@gmail.com">krishnaspattel@gmail.com</a>
            </div>
            <div className="contact-card">
              <FaMapMarkerAlt className="contact-icon" />
              <h3>Location</h3>
              <p>Mumbai, Maharashtra</p>
            </div>
            <div className="contact-card">
              <FaLinkedin className="contact-icon" />
              <h3>LinkedIn</h3>
              <a href="https://www.linkedin.com/in/shrikrishnapatel10/" target="_blank" rel="noopener noreferrer">
                linkedin.com/in/shrikrishnapatel10
              </a>
            </div>
            <div className="contact-card">
              <FaGithub className="contact-icon" />
              <h3>GitHub</h3>
              <a href="https://github.com/Krishnaaa10" target="_blank" rel="noopener noreferrer">
                github.com/Krishnaaa10
              </a>
            </div>
            <div className="contact-card">
              <FaTwitter className="contact-icon" />
              <h3>Twitter</h3>
              <a href="https://x.com/krishnapatel_10?t=CS0_hEx3Dtx8e4ih7evqFA&s=09" target="_blank" rel="noopener noreferrer">
                @krishnapatel_10
              </a>
            </div>
          </div>
        </div>

        {/* Mission & Vision */}
        <div className="mission-section">
          <div className="mission-card">
            <h2>Our Mission</h2>
            <p>
              To create a comprehensive, real-time disaster management platform that connects communities, 
              volunteers, and agencies to ensure rapid and effective emergency response.
            </p>
          </div>
          <div className="mission-card">
            <h2>Our Vision</h2>
            <p>
              A world where technology empowers communities to respond quickly and effectively to disasters, 
              ensuring that no one faces a crisis alone.
            </p>
          </div>
        </div>

        {/* Call to Action */}
        <div className="cta-section">
          <h2>Join Us in Making a Difference</h2>
          <p>Whether you're looking to help or need assistance, we're here for you.</p>
          <div className="cta-buttons">
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/map" className="btn btn-secondary">View Map</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;




