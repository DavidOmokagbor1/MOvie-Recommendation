import React, { useState, useEffect, useRef } from 'react';
import './Hero.css';
import { HERO_POSTER_DELAY_MS, HERO_TRAILER_PLAY_MS } from '../constants/heroTiming';

const HERO_YOUTUBE_PLAYER_ID = 'hero-youtube-player';

/**
 * Full-width hero for one featured item.
 * Props: item, ctaLabel?, onCtaClick?, trailerKey? – poster → trailer → poster (cycle).
 * "Watch trailer" opens YouTube in new tab; title / "View details" open movie modal.
 * Unmute uses YouTube IFrame API to turn on audio in-place.
 */
function Hero({ item, ctaLabel = 'Get recommendations', onCtaClick, trailerKey }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [pauseTrailer, setPauseTrailer] = useState(false); // pause when hero out of view
  const [ytReady, setYtReady] = useState(false);
  const heroRef = useRef(null);
  const playerRef = useRef(null);
  const userRequestedUnmuteRef = useRef(false);

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

  // Use YouTube IFrame API when ready (script may load from index.html or we inject it)
  useEffect(() => {
    const markReady = () => setYtReady(true);
    if (window.YT && window.YT.Player) {
      markReady();
      return;
    }
    const onReady = () => markReady();
    window.addEventListener('youtube-api-ready', onReady);
    // If script not already loading from index.html, inject it
    if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        window.dispatchEvent(new Event('youtube-api-ready'));
      };
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      document.body.appendChild(script);
      return () => {
        window.removeEventListener('youtube-api-ready', onReady);
        window.onYouTubeIframeAPIReady = prev;
      };
    }
    return () => window.removeEventListener('youtube-api-ready', onReady);
  }, []);

  // Create YT player from our iframe (which has allow="autoplay" so unMute() works in modern browsers).
  useEffect(() => {
    if (!ytReady || !trailerKey || !showTrailer || pauseTrailer) {
      userRequestedUnmuteRef.current = false;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
      return;
    }
    const iframeEl = document.getElementById(HERO_YOUTUBE_PLAYER_ID);
    if (!iframeEl || playerRef.current) return;
    const player = new window.YT.Player(iframeEl, {
      events: {
        onReady: () => {
          playerRef.current = player;
          if (userRequestedUnmuteRef.current) {
            try {
              player.unMute();
              if (typeof player.setVolume === 'function') player.setVolume(100);
            } catch (_) {}
          }
        }
      }
    });
    playerRef.current = player;
    return () => {
      userRequestedUnmuteRef.current = false;
      try {
        if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();
      } catch (_) {}
      playerRef.current = null;
    };
  }, [ytReady, trailerKey, showTrailer, pauseTrailer]);

  const handleUnmute = (e) => {
    e.stopPropagation();
    if (!trailerKey) return;
    userRequestedUnmuteRef.current = true;
    const p = playerRef.current;
    if (p && typeof p.unMute === 'function') {
      try {
        p.unMute();
        if (typeof p.setVolume === 'function') p.setVolume(100);
      } catch (_) {
        window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank', 'noopener,noreferrer');
      }
    } else {
      window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank', 'noopener,noreferrer');
    }
  };

  if (!item) return null;

  const bgUrl = item.backdropUrl || item.poster || item.posterUrl;
  // Embed URL: enablejsapi=1 for API control; mute=1 for autoplay; allow="autoplay" on iframe so unMute() works
  const trailerEmbedUrl = trailerKey && !pauseTrailer
    ? `https://www.youtube.com/embed/${trailerKey}?enablejsapi=1&autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${trailerKey}`
    : null;
  const trailerVisible = showTrailer && trailerEmbedUrl;
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
            {/* Our iframe with allow="autoplay" so YT API unMute() works; we create YT.Player from it */}
            <div className="hero__trailer-iframe-wrap">
              {ytReady && trailerVisible && (
                <iframe
                  id={HERO_YOUTUBE_PLAYER_ID}
                  title={`Trailer for ${item.title || 'featured'}`}
                  src={trailerEmbedUrl}
                  frameBorder="0"
                  allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="hero__trailer-iframe"
                />
              )}
              {!ytReady && trailerVisible && (
                <iframe
                  title={`Trailer for ${item.title || 'featured'}`}
                  src={trailerEmbedUrl}
                  frameBorder="0"
                  allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="hero__trailer-iframe"
                />
              )}
            </div>
            {trailerVisible && (
              <button
                type="button"
                className="hero__unmute"
                onClick={handleUnmute}
                aria-label="Unmute trailer"
                title="Unmute"
              >
                <span className="hero__unmute-icon" aria-hidden="true">🔊</span>
                <span className="hero__unmute-label">Unmute</span>
              </button>
            )}
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
