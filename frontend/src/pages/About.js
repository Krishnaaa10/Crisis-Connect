import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEnvelope, FaMapMarkerAlt, FaLinkedin, FaGithub, FaTwitter, FaRocket, FaShieldAlt, FaHeart, FaBolt } from 'react-icons/fa';
import './About.css';

const About = () => {
  const canvasRef = useRef(null);
  const [scrollY, setScrollY] = useState(0);

  // Particle animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = [];
    const particleCount = 100;

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 0.5 - 0.25;
        this.speedY = Math.random() * 0.5 - 0.25;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw() {
        ctx.fillStyle = `rgba(0, 240, 255, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(particle => {
        particle.update();
        particle.draw();
      });

      // Draw connections
      particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            ctx.strokeStyle = `rgba(0, 240, 255, ${0.15 * (1 - distance / 120)})`;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(animate);
    }

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const features = [
    { icon: <FaRocket />, title: 'Lightning Fast', desc: 'Real-time incident reporting and response', color: '#00f0ff' },
    { icon: <FaShieldAlt />, title: 'Secure Platform', desc: 'End-to-end encrypted communications', color: '#00ff9d' },
    { icon: <FaHeart />, title: 'Community First', desc: 'Built for people, powered by compassion', color: '#ff3366' },
    { icon: <FaBolt />, title: 'Always On', desc: '24/7 emergency response coordination', color: '#ffea00' }
  ];

  return (
    <div className="about-immersive">
      {/* Animated Background */}
      <canvas ref={canvasRef} className="particle-canvas"></canvas>

      {/* Hero Section with Parallax */}
      <section className="hero-immersive" style={{ transform: `translateY(${scrollY * 0.5}px)` }}>
        <div className="hero-glow"></div>
        <div className="hero-content">
          <div className="glitch-wrapper">
            <h1 className="glitch" data-text="CRISIS CONNECT">CRISIS CONNECT</h1>
          </div>
          <p className="hero-tagline">Where Technology Meets Humanity</p>
          <div className="hero-stats">
            <div className="stat-pill">
              <span className="stat-num">1000+</span>
              <span className="stat-label">Lives Impacted</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">24/7</span>
              <span className="stat-label">Always Active</span>
            </div>
            <div className="stat-pill">
              <span className="stat-num">500+</span>
              <span className="stat-label">Volunteers</span>
            </div>
          </div>
        </div>
        <div className="scroll-indicator">
          <div className="mouse"></div>
          <p>Scroll to explore</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="features-immersive">
        <div className="container-immersive">
          <h2 className="section-title" data-aos="fade-up">What Makes Us Different</h2>
          <div className="features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="feature-card-3d" data-aos="flip-left" data-aos-delay={idx * 100}>
                <div className="card-inner">
                  <div className="card-front" style={{ '--card-color': feature.color }}>
                    <div className="feature-icon">{feature.icon}</div>
                    <h3>{feature.title}</h3>
                  </div>
                  <div className="card-back" style={{ '--card-color': feature.color }}>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission Statement - Glassmorphism */}
      <section className="mission-immersive">
        <div className="container-immersive">
          <div className="glass-card" data-aos="zoom-in">
            <div className="glass-content">
              <h2>Our Mission</h2>
              <p className="mission-text">
                To revolutionize disaster response through cutting-edge technology,
                connecting communities in their darkest hours and transforming chaos into coordinated action.
              </p>
              <div className="mission-visual">
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay-1"></div>
                <div className="pulse-ring delay-2"></div>
                <div className="mission-icon">🌍</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section - Cinematic */}
      <section className="founder-immersive">
        <div className="container-immersive">
          <h2 className="section-title" data-aos="fade-up">The Visionary</h2>
          <div className="founder-showcase">
            <div className="founder-image-3d" data-aos="fade-right">
              <div className="image-wrapper">
                <div className="hologram-effect"></div>
                <img
                  src={process.env.PUBLIC_URL + "/myphoto.jpg"}
                  alt="ShriKrishna Patel"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
                <div className="founder-placeholder-3d" style={{ display: 'none' }}>
                  <span>SK</span>
                </div>
              </div>
              <div className="founder-label">
                <span className="label-line"></span>
                <span className="label-text">Founder & Architect</span>
                <span className="label-line"></span>
              </div>
            </div>
            <div className="founder-story" data-aos="fade-left">
              <h3>ShriKrishna Patel</h3>
              <p className="founder-quote">
                "In every crisis lies an opportunity to unite, to innovate, and to save lives.
                This platform is my contribution to a safer, more connected world."
              </p>
              <p className="founder-bio">
                A software engineer with a passion for social impact, ShriKrishna built Crisis Connect
                from the ground up to bridge the gap between technology and humanitarian response.
                With expertise in real-time systems and a heart for community service, he's on a mission
                to ensure no one faces disaster alone.
              </p>
              <div className="social-links-immersive">
                <a href="mailto:krishnaspattel@gmail.com" className="social-btn">
                  <FaEnvelope />
                </a>
                <a href="https://www.linkedin.com/in/shrikrishnapatel10/" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <FaLinkedin />
                </a>
                <a href="https://github.com/Krishnaaa10" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <FaGithub />
                </a>
                <a href="https://x.com/krishnapatel_10?t=CS0_hEx3Dtx8e4ih7evqFA&s=09" target="_blank" rel="noopener noreferrer" className="social-btn">
                  <FaTwitter />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Futuristic */}
      <section className="cta-immersive">
        <div className="cta-bg-animation"></div>
        <div className="container-immersive">
          <div className="cta-content-immersive" data-aos="zoom-in">
            <h2>Ready to Make a Difference?</h2>
            <p>Join thousands of volunteers and civilians making the world safer, one response at a time.</p>
            <div className="cta-buttons-immersive">
              <Link to="/register" className="btn-immersive primary">
                <span>Get Started</span>
                <div className="btn-glow"></div>
              </Link>
              <Link to="/contact" className="btn-immersive secondary">
                <span>Contact Us</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
