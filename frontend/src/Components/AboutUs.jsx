import React from 'react'
import MetaData from './Layout/MetaData'
import { FaCode, FaLaptopCode, FaGithub, FaLinkedin } from 'react-icons/fa'
import '../Styles/aboutus.css'

const AboutUs = () => {
    const developers = [
        {
            id: 1,
            name: "Developer One",
            github: "https://github.com/chokolateee",
            image: "/images/pau.png"
        },
        {
            id: 2,
            name: "Developer Two",
            github: "https://github.com/cyne-16",
            image: "/images/kim.jpg"
        }
    ]

    return (
        <>
            <MetaData title="About Us | FormulaHub" />
            
            <section className="about-hero f1-about-hero">
                <div className="racing-stripes"></div>
                <div className="about-hero-content">
                    <h1 className="about-hero-title">ABOUT FORMULA HUB</h1>
                    <p className="about-hero-subtitle">Engineered by Passionate Developers</p>
                </div>
            </section>

           <section className="about-tech">
                <div className="about-container">
                    <h2 className="tech-title">BUILT WITH CUTTING-EDGE TECHNOLOGY</h2>
                    <div className="tech-grid">
                        <div className="tech-item">
                            <div className="tech-icon">React</div>
                            <p>Frontend Framework</p>
                        </div>
                        <div className="tech-item">
                            <div className="tech-icon">Node.js</div>
                            <p>Backend Runtime</p>
                        </div>
                        <div className="tech-item">
                            <div className="tech-icon">MongoDB</div>
                            <p>Database</p>
                        </div>
                        <div className="tech-item">
                            <div className="tech-icon">Express</div>
                            <p>Web Framework</p>
                        </div>
                    </div>
                </div>
            </section>

            <section className="about-team">
                <div className="about-container">
                    <div className="team-header">
                        <h2 className="team-title">THE PIT CREW</h2>
                        <p className="team-subtitle">Meet the developers behind FormulaHub</p>
                    </div>
                    
                    <div className="developers-grid">
                        {developers.map((dev) => (
                            <div key={dev.id} className="developer-card">
                                <div className="developer-image-wrapper">
                                    <img 
                                        src={dev.image} 
                                        alt={dev.name}
                                        className="developer-image"
                                    />
                                    <div className="developer-overlay">
                                        <div className="developer-social">
                                            <a href={dev.github} target="_blank" rel="noopener noreferrer" className="social-link">
                                                <FaGithub />
                                            </a>
                                            <a href={dev.linkedin} target="_blank" rel="noopener noreferrer" className="social-link">
                                                <FaLinkedin />
                                            </a>
                                        </div>
                                    </div>
                                </div>
                                <div className="developer-info">
                                    <h3 className="developer-name">{dev.name}</h3>
                                    <p className="developer-role">{dev.role}</p>
                                    <div className="developer-specialty">
                                        <FaLaptopCode />
                                        <span>{dev.specialty}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            


             <section className="about-mission">
                <div className="about-container">
                    <div className="mission-content">
                        <div className="mission-icon">
                            <FaCode />
                        </div>
                        <h2 className="mission-title">OUR MISSION</h2>
                        <p className="mission-text">
                            FormulaHub is your premier destination for authentic F1 collectibles and racing memorabilia. 
                            We bring the thrill of Formula 1 racing to collectors worldwide, offering exclusive limited 
                            editions and officially licensed products that celebrate the sport's rich heritage.
                        </p>
                        <div className="mission-features">
                            <div className="mission-feature">
                                <span className="feature-number">100%</span>
                                <span className="feature-label">Authentic</span>
                            </div>
                            <div className="mission-feature">
                                <span className="feature-number">24/7</span>
                                <span className="feature-label">Support</span>
                            </div>
                            <div className="mission-feature">
                                <span className="feature-number">Fast</span>
                                <span className="feature-label">Delivery</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </>
    )
}

export default AboutUs