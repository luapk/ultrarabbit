import React, { useState, useEffect, useRef } from 'react';



const MusicPlayer = ({ embedded = false }) => {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);

  const tracks = [
    { title: 'VOID FREQUENCY', duration: '3:42' },
    { title: 'NEON BLOODLINE', duration: '4:18' },
    { title: 'SYSTEM COLLAPSE', duration: '5:01' },
  ];

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(() => {
        setProgress((prev) => (prev >= 100 ? 0 : prev + 0.5));
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  const containerStyle = embedded
    ? {
        backgroundColor: 'transparent',
        padding: '0',
        width: '100%',
        maxWidth: '400px',
        margin: '0 auto',
      }
    : {
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        backgroundColor: 'rgba(0,0,0,0.9)',
        border: '1px solid #333',
        padding: '16px 20px',
        zIndex: 100,
        minWidth: '280px',
      };

  return (
    <div style={containerStyle}>
      <div
        style={{
          fontFamily: '"Fira Code", monospace',
          fontSize: '10px',
          color: '#666',
          marginBottom: '8px',
        }}
      >
        NOW PLAYING
      </div>
      <div
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: '20px',
          color: '#fff',
          letterSpacing: '0.1em',
          marginBottom: '4px',
        }}
      >
        {tracks[currentTrack].title}
      </div>
      <div
        style={{
          fontFamily: '"Fira Code", monospace',
          fontSize: '11px',
          color: '#ff2d2d',
          marginBottom: '12px',
        }}
      >
        ULTRARABBIT • {tracks[currentTrack].duration}
      </div>

      <div
        style={{
          width: '100%',
          height: '2px',
          backgroundColor: '#222',
          marginBottom: '12px',
          cursor: 'pointer',
        }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          setProgress((x / rect.width) * 100);
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#ff2d2d',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={() => setCurrentTrack((prev) => (prev === 0 ? tracks.length - 1 : prev - 1))}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#fff')}
          onMouseLeave={(e) => (e.target.style.color = '#666')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
          </svg>
        </button>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          style={{
            background: '#ff2d2d',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.transform = 'scale(1.1)')}
          onMouseLeave={(e) => (e.target.style.transform = 'scale(1)')}
        >
          {isPlaying ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z" />
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="#000">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        <button
          onClick={() => setCurrentTrack((prev) => (prev === tracks.length - 1 ? 0 : prev + 1))}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#666',
            cursor: 'pointer',
            padding: '4px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={(e) => (e.target.style.color = '#fff')}
          onMouseLeave={(e) => (e.target.style.color = '#666')}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
          </svg>
        </button>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px' }}>
          {tracks.map((_, idx) => (
            <button
              key={idx}
              onClick={() => {
                setCurrentTrack(idx);
                setProgress(0);
              }}
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: idx === currentTrack ? '#ff2d2d' : '#333',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'background-color 0.2s',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const BurgerMenu = ({ isOpen, setIsOpen, scrollToSection }) => {
  const menuItems = [
    { name: 'ABOUT', id: 'about' },
    { name: 'GIGS', id: 'gigs' },
    { name: 'MERCH', id: 'merch', comingSoon: true },
    { name: 'LISTEN', id: 'listen' },
  ];

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 1001,
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '10px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span
            style={{
              display: 'block',
              width: '32px',
              height: '2px',
              backgroundColor: '#fff',
              transition: 'all 0.3s ease',
              transform: isOpen ? 'rotate(45deg) translate(6px, 6px)' : 'none',
            }}
          />
          <span
            style={{
              display: 'block',
              width: '32px',
              height: '2px',
              backgroundColor: '#fff',
              transition: 'all 0.3s ease',
              opacity: isOpen ? 0 : 1,
            }}
          />
          <span
            style={{
              display: 'block',
              width: '32px',
              height: '2px',
              backgroundColor: '#fff',
              transition: 'all 0.3s ease',
              transform: isOpen ? 'rotate(-45deg) translate(6px, -6px)' : 'none',
            }}
          />
        </div>
      </button>

      <nav
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: isOpen ? '100%' : '0',
          height: '100vh',
          backgroundColor: 'rgba(0,0,0,0.97)',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          transition: 'width 0.4s cubic-bezier(0.77, 0, 0.175, 1)',
        }}
      >
        {menuItems.map((item, index) => (
          <button
            key={item.name}
            onClick={() => {
              if (!item.comingSoon) {
                scrollToSection(item.id);
                setIsOpen(false);
              }
            }}
            style={{
              background: 'transparent',
              border: 'none',
              fontFamily: '"Bebas Neue", sans-serif',
              fontSize: 'clamp(48px, 10vw, 96px)',
              color: item.comingSoon ? '#333' : '#fff',
              cursor: item.comingSoon ? 'default' : 'pointer',
              letterSpacing: '0.1em',
              padding: '10px 40px',
              position: 'relative',
              transition: 'all 0.3s ease',
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateX(0)' : 'translateX(100px)',
              transitionDelay: `${index * 0.1}s`,
            }}
            onMouseEnter={(e) => {
              if (!item.comingSoon) {
                e.target.style.color = '#ff2d2d';
                e.target.style.letterSpacing = '0.2em';
              }
            }}
            onMouseLeave={(e) => {
              if (!item.comingSoon) {
                e.target.style.color = '#fff';
                e.target.style.letterSpacing = '0.1em';
              }
            }}
          >
            {item.name}
            {item.comingSoon && (
              <span
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-20px',
                  transform: 'translateY(-50%) rotate(-5deg)',
                  fontSize: '12px',
                  fontFamily: '"Fira Code", monospace',
                  color: '#ff2d2d',
                  border: '1px solid #ff2d2d',
                  padding: '4px 8px',
                  letterSpacing: '0.05em',
                }}
              >
                SOON
              </span>
            )}
          </button>
        ))}
      </nav>
    </>
  );
};


const SectionHeader = ({ title }) => {
  const headerRef = useRef(null);
  const [lineWidth, setLineWidth] = useState(0);

  useEffect(() => {
    if (headerRef.current) {
      setLineWidth(headerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (headerRef.current) {
        setLineWidth(headerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [title]);

  return (
    <div style={{ marginBottom: '48px' }}>
      <h2
        ref={headerRef}
        style={{
          fontFamily: '"Bebas Neue", sans-serif',
          fontSize: 'clamp(96px, 16vw, 144px)',
          color: '#fff',
          letterSpacing: '0.1em',
          marginBottom: '16px',
          lineHeight: 1,
          display: 'inline-block',
        }}
      >
        {title}
      </h2>
      <div
        style={{
          width: `${lineWidth}px`,
          height: '1px',
          backgroundColor: '#ff2d2d',
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  );
};

const AboutSection = () => {
  return (
    <section
      id="about"
      style={{
        minHeight: '100vh',
        backgroundColor: '#000',
        padding: '120px 40px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Giant background logo */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'url(logo.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.06,
          pointerEvents: 'none',
        }}
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '60px',
            alignItems: 'start',
          }}
        >
          <div>
            <SectionHeader title="ABOUT" />
            <p
              style={{
                fontFamily: '"Space Mono", monospace',
                fontSize: '14px',
                color: '#999',
                lineHeight: 2,
                marginBottom: '24px',
              }}
            >
              ULTRARABBIT are a music band formed by Andy H, Eva M and Paul K in 2026 in London. They create electronic dance music blending house, funk, disco, and rock while wearing sharp suits and rabbit ears.
            </p>
            <div
              style={{
                marginTop: '40px',
                display: 'flex',
                gap: '20px',
                flexWrap: 'wrap',
              }}
            >
              {['SPOTIFY', 'SOUNDCLOUD', 'BANDCAMP'].map((platform) => (
                <button
                  key={platform}
                  style={{
                    fontFamily: '"Fira Code", monospace',
                    fontSize: '11px',
                    padding: '12px 20px',
                    backgroundColor: 'transparent',
                    border: '1px solid #333',
                    color: '#666',
                    cursor: 'pointer',
                    letterSpacing: '0.1em',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.borderColor = '#ff2d2d';
                    e.target.style.color = '#ff2d2d';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.borderColor = '#333';
                    e.target.style.color = '#666';
                  }}
                >
                  {platform}
                </button>
              ))}
            </div>
          </div>

          {/* Band photo */}
          <div
            style={{
              aspectRatio: '9/16',
              maxWidth: '340px',
              width: '100%',
              backgroundColor: '#0a0a0a',
              border: '1px solid #1a1a1a',
              backgroundImage: 'url(photo.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Placeholder text — remove once photo.jpg is live */}
            <span style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: '#333', letterSpacing: '0.1em' }}>
              [ PHOTO.JPG ]
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};


const GigsSection = () => {
  const gigs = [
    { date: 'MAR 15', year: '2026', venue: 'THE WAREHOUSE', city: 'LONDON, UK', status: 'TICKETS' },
    { date: 'MAR 28', year: '2026', venue: 'CIRCUIT CLUB', city: 'BERLIN, DE', status: 'TICKETS' },
    { date: 'APR 12', year: '2026', venue: 'UNDERGROUND', city: 'AMSTERDAM, NL', status: 'SOON' },
    { date: 'APR 30', year: '2026', venue: 'NOISE FACTORY', city: 'PARIS, FR', status: 'SOON' },
  ];

  return (
    <section
      id="gigs"
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        padding: '120px 40px',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <SectionHeader title="GIGS" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {gigs.map((gig, index) => (
            <div
              key={index}
              style={{
                display: 'grid',
                gridTemplateColumns: '100px 1fr auto',
                gap: '40px',
                alignItems: 'center',
                padding: '32px 24px',
                backgroundColor: '#111',
                border: '1px solid #1a1a1a',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#161616';
                e.currentTarget.style.borderColor = '#ff2d2d';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#111';
                e.currentTarget.style.borderColor = '#1a1a1a';
              }}
            >
              <div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '32px', color: '#ff2d2d', lineHeight: 1 }}>
                  {gig.date}
                </div>
                <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: '#444' }}>
                  {gig.year}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: '#fff', letterSpacing: '0.05em' }}>
                  {gig.venue}
                </div>
                <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '12px', color: '#666' }}>
                  {gig.city}
                </div>
              </div>
              <button
                style={{
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '11px',
                  padding: '10px 24px',
                  backgroundColor: gig.status === 'TICKETS' ? '#ff2d2d' : 'transparent',
                  color: gig.status === 'TICKETS' ? '#000' : '#444',
                  border: gig.status === 'TICKETS' ? 'none' : '1px solid #333',
                  cursor: gig.status === 'TICKETS' ? 'pointer' : 'default',
                  letterSpacing: '0.1em',
                }}
              >
                {gig.status}
              </button>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '80px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((flyer) => (
            <div
              key={flyer}
              style={{
                aspectRatio: '3/4',
                backgroundColor: '#111',
                border: '1px solid #222',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff2d2d';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#222';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontFamily: '"Fira Code", monospace', fontSize: '12px', color: '#333' }}>
                [ FLYER {flyer} ]
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const MerchSection = () => {
  return (
    <section
      id="merch"
      style={{
        minHeight: '60vh',
        backgroundColor: '#000',
        padding: '120px 40px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(90deg, transparent, transparent 100px, rgba(255,45,45,0.02) 100px, rgba(255,45,45,0.02) 101px)',
        }}
      />
      <div style={{ textAlign: 'center', position: 'relative' }}>
        <h2
          style={{
            fontFamily: '"Bebas Neue", sans-serif',
            fontSize: 'clamp(96px, 16vw, 192px)',
            color: '#1a1a1a',
            letterSpacing: '0.2em',
            marginBottom: '24px',
          }}
        >
          MERCH
        </h2>
        <div
          style={{
            fontFamily: '"Fira Code", monospace',
            fontSize: '14px',
            color: '#ff2d2d',
            letterSpacing: '0.3em',
            animation: 'pulse 2s infinite',
          }}
        >
          [ COMING SOON ]
        </div>
        <p
          style={{
            fontFamily: '"Space Mono", monospace',
            fontSize: '12px',
            color: '#333',
            marginTop: '40px',
            maxWidth: '400px',
          }}
        >
          Apparel and artifacts loading... Enter your signal below for early access.
        </p>
        <div style={{ marginTop: '32px', display: 'flex', gap: '0', justifyContent: 'center' }}>
          <input
            type="email"
            placeholder="EMAIL@SIGNAL.COM"
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: '12px',
              padding: '14px 20px',
              backgroundColor: '#111',
              border: '1px solid #222',
              color: '#fff',
              outline: 'none',
              width: '240px',
              letterSpacing: '0.05em',
            }}
          />
          <button
            style={{
              fontFamily: '"Fira Code", monospace',
              fontSize: '12px',
              padding: '14px 24px',
              backgroundColor: '#ff2d2d',
              border: 'none',
              color: '#000',
              cursor: 'pointer',
              letterSpacing: '0.1em',
            }}
          >
            NOTIFY
          </button>
        </div>
      </div>
    </section>
  );
};

const ListenSection = () => {
  return (
    <section
      id="listen"
      style={{
        minHeight: '80vh',
        backgroundColor: '#050505',
        padding: '120px 40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ maxWidth: '600px', width: '100%', textAlign: 'center' }}>
        <SectionHeader title="LISTEN" />
        
        <div
          style={{
            backgroundColor: 'rgba(20, 20, 20, 0.8)',
            border: '1px solid #222',
            padding: '40px',
            marginTop: '20px',
          }}
        >
          <MusicPlayer embedded={true} />
        </div>

        <div style={{ marginTop: '60px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '11px', color: '#444', letterSpacing: '0.2em' }}>
            STREAM ON
          </div>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {['SPOTIFY', 'APPLE MUSIC', 'YOUTUBE', 'SOUNDCLOUD'].map((platform) => (
              <button
                key={platform}
                style={{
                  fontFamily: '"Fira Code", monospace',
                  fontSize: '10px',
                  padding: '12px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #222',
                  color: '#555',
                  cursor: 'pointer',
                  letterSpacing: '0.1em',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#ff2d2d';
                  e.target.style.color = '#ff2d2d';
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#222';
                  e.target.style.color = '#555';
                }}
              >
                {platform}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer
      style={{
        backgroundColor: '#000',
        borderTop: '1px solid #111',
        padding: '40px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontFamily: '"Bebas Neue", sans-serif', fontSize: '24px', color: '#fff', letterSpacing: '0.2em', marginBottom: '16px' }}>
        ULTRARABBIT
      </div>
      <a
        href="mailto:bounce@ultrarabbit.co.uk"
        style={{
          fontFamily: '"Fira Code", monospace',
          fontSize: '12px',
          color: '#666',
          letterSpacing: '0.1em',
          textDecoration: 'none',
          display: 'inline-block',
          marginBottom: '16px',
          transition: 'color 0.2s',
        }}
        onMouseEnter={(e) => (e.target.style.color = '#ff2d2d')}
        onMouseLeave={(e) => (e.target.style.color = '#666')}
      >
        bounce@ultrarabbit.co.uk
      </a>
      <div style={{ fontFamily: '"Fira Code", monospace', fontSize: '10px', color: '#333', letterSpacing: '0.1em' }}>
        © 2026 ALL RIGHTS RESERVED • BUILT IN THE VOID
      </div>
    </footer>
  );
};



export default function UltraRabbitWebsite() {
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div style={{ backgroundColor: '#000', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fira+Code:wght@400;500&family=Space+Mono&display=swap');
        
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        html {
          scroll-behavior: smooth;
        }
        
        body {
          background: #000;
          overflow-x: hidden;
        }
        
        ::selection {
          background: #ff2d2d;
          color: #000;
        }
        

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        

        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: #000;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #ff2d2d;
        }
      `}</style>

      <BurgerMenu isOpen={menuOpen} setIsOpen={setMenuOpen} scrollToSection={scrollToSection} />
      <AboutSection />
      <GigsSection />
      <MerchSection />
      <ListenSection />
      <Footer />
    </div>
  );
}
