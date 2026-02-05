import React, { useState, useEffect, useRef } from 'react';
import './Hero.css';
import { HERO_POSTER_DELAY_MS, HERO_TRAILER_PLAY_MS } from '../constants/heroTiming';

/**
 * Full-width hero for one featured item.
 * Props: item, ctaLabel?, onCtaClick?, trailerKey? – poster → trailer → poster (cycle).
 * Trailer plays muted (browser autoplay policy). Use "Watch trailer" for sound in new tab.
 */
function Hero({ item, ctaLabel = 'Get recommendations', onCtaClick, trailerKey }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [pauseTrailer, setPauseTrailer] = useState(false); // pause when hero out of view
  const heroRef = useRef(null);

  useEffect(() => {
    if (!trailerKey) {
      setShowTrailer(false);
      return;
    }
    setShowTrailer(false);
    const timeouts = [];

    function runCycle() {
      timeouts.push(setTimeout(() => {
        setShowTrailer(true);
        timeouts.push(setTimeout(() => {
          setShowTrailer(false);
          runCycle();
        }, HERO_TRAILER_PLAY_MS));
      }, HERO_POSTER_DELAY_MS));
    }
    runCycle();

    return () => timeouts.forEach(t => clearTimeout(t));
  }, [item?.id, trailerKey]);

  // Pause trailer when hero is out of view (only after it has been visible once)
  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    let hasBeenVisible = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) hasBeenVisible = true;
        setPauseTrailer(hasBeenVisible && !entry.isIntersecting);
      },
      { threshold: 0.1, rootMargin: '0px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  if (!item) return null;

  const bgUrl = item.backdropUrl || item.poster || item.posterUrl;
  const trailerSrc = trailerKey && !pauseTrailer
    ? `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerKey}`
    : null;
  const trailerVisible = showTrailer && trailerSrc;
  const trailerUrl = trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null;

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ' ') && onCtaClick) {
      e.preventDefault();
      onCtaClick(item);
    }
  };

  return (
    <div className="hero" role="banner" ref={heroRef}>
      <div className="hero__bg">
        {bgUrl && (
          <img
            src={bgUrl}
            alt=""
            className={`hero__bg-img ${trailerVisible ? 'hero__bg-img--hidden' : ''}`}
          />
        )}
        {trailerKey && (
          <div className={`hero__trailer ${trailerVisible ? 'hero__trailer--visible' : ''}`}>
            <div className="hero__trailer-iframe-wrap">
              {trailerVisible && (
                <iframe
                  title={`Trailer for ${item.title || 'featured'}`}
                  src={trailerSrc}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="hero__trailer-iframe"
                />
              )}
            </div>
          </div>
        )}
        <div className="hero__overlay" aria-hidden="true" />
      </div>
      <div className="hero__content">
        <h1
          className="hero__title hero__title--clickable"
          onClick={() => onCtaClick && onCtaClick(item)}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-label={`${item.title || 'Featured'}, view details`}
        >
          {item.title || 'Featured'}
        </h1>
        {item.subtitle && <p className="hero__subtitle">{item.subtitle}</p>}
        {item.genre && !item.subtitle && <p className="hero__subtitle">{item.genre}</p>}
        {item.date && (
          <p className="hero__meta">
            {typeof item.date === 'string' && item.date.length >= 4 ? item.date.substring(0, 4) : item.date}
          </p>
        )}
        <div className="hero__cta-wrap">
          {trailerUrl && (
            <button
              type="button"
              className="hero__cta"
              onClick={() => window.open(trailerUrl, '_blank', 'noopener,noreferrer')}
              aria-label="Watch trailer in new tab"
            >
              Watch trailer
            </button>
          )}
          <button
            type="button"
            className={trailerUrl ? 'hero__cta hero__cta--secondary' : 'hero__cta'}
            onClick={() => onCtaClick && onCtaClick(item)}
            onKeyDown={handleKeyDown}
            aria-label={ctaLabel}
          >
            {trailerUrl ? 'View details' : (ctaLabel || 'View details')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Hero;
