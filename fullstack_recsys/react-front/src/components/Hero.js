import React, { useState, useEffect, useRef } from 'react';
import './Hero.css';
import { HERO_POSTER_DELAY_MS, HERO_TRAILER_PLAY_MS } from '../constants/heroTiming';

const HERO_YOUTUBE_PLAYER_ID = 'hero-youtube-player';

/**
 * Full-width hero for one featured item.
 * Trailer plays muted (autoplay policy); click Unmute to hear the 25s clip.
 * Uses a stable container we never unmount so YT API destroy() never conflicts with React (no removeChild crash).
 */
function Hero({ item, ctaLabel = 'Get recommendations', onCtaClick, trailerKey }) {
  const [showTrailer, setShowTrailer] = useState(false);
  const [pauseTrailer, setPauseTrailer] = useState(false);
  const [ytReady, setYtReady] = useState(false);
  const heroRef = useRef(null);
  const playerRef = useRef(null);

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

  // YouTube IFrame API: use when ready (script from index.html or we inject)
  useEffect(() => {
    const markReady = () => setYtReady(true);
    if (window.YT && window.YT.Player) {
      markReady();
      return;
    }
    const onReady = () => markReady();
    window.addEventListener('youtube-api-ready', onReady);
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

  // Create/destroy player only; container div is never unmounted (avoids removeChild crash)
  useEffect(() => {
    if (!ytReady || !trailerKey || !showTrailer || pauseTrailer) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
      return;
    }
    const el = document.getElementById(HERO_YOUTUBE_PLAYER_ID);
    if (!el || playerRef.current) return;
    const player = new window.YT.Player(HERO_YOUTUBE_PLAYER_ID, {
      videoId: trailerKey,
      playerVars: {
        autoplay: 1,
        mute: 1,
        loop: 1,
        playlist: trailerKey,
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        controls: 0,
      },
      events: {
        onReady: () => {
          playerRef.current = player;
        },
      },
    });
    playerRef.current = player;
    return () => {
      try {
        if (playerRef.current && playerRef.current.destroy) playerRef.current.destroy();
      } catch (_) {}
      playerRef.current = null;
    };
  }, [ytReady, trailerKey, showTrailer, pauseTrailer]);

  const handleUnmute = (e) => {
    e.stopPropagation();
    if (!trailerKey) return;
    window.open(`https://www.youtube.com/watch?v=${trailerKey}`, '_blank', 'noopener,noreferrer');
  };

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
            {/* Stable container: never unmount when ytReady so YT API never conflicts with React */}
            {ytReady && (
              <div
                id={HERO_YOUTUBE_PLAYER_ID}
                className={`hero__trailer-iframe-wrap ${trailerVisible ? '' : 'hero__trailer-iframe-wrap--hidden'}`}
                aria-hidden={!trailerVisible}
              />
            )}
            {!ytReady && trailerVisible && (
              <div className="hero__trailer-iframe-wrap">
                <iframe
                  title={`Trailer for ${item.title || 'featured'}`}
                  src={trailerSrc}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="hero__trailer-iframe"
                />
              </div>
            )}
            {trailerVisible && (
              <button
                type="button"
                className="hero__unmute"
                onClick={handleUnmute}
                aria-label="Hear trailer (opens in new tab)"
                title="Hear trailer"
              >
                <span className="hero__unmute-icon" aria-hidden="true">🔊</span>
                <span className="hero__unmute-label">Hear trailer</span>
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
