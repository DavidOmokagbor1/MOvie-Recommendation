import React from 'react';
import './FocusableCard.css';

/**
 * Focusable poster card for rails. Keyboard: Enter/Space triggers onSelect.
 * Props: item { id, title, poster? }, onSelect, selected?, [optional] showAddButton, onAdd, onWatchTrailer
 */
function FocusableCard({ item, onSelect, selected, showAddButton, onAdd, onWatchTrailer }) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onSelect) onSelect(item);
    }
  };

  const hasValidPoster = item.poster && typeof item.poster === 'string' && item.poster.trim() && item.poster !== 'null' && item.poster !== 'None';

  return (
    <div
      className={`focusable-card ${selected ? 'focusable-card--selected' : ''}`}
      role="button"
      tabIndex={0}
      onClick={() => onSelect && onSelect(item)}
      onKeyDown={handleKeyDown}
      aria-label={item.title ? `Open ${item.title}` : 'Open movie'}
    >
      <div className="focusable-card__poster">
        {hasValidPoster ? (
          <img src={item.poster} alt="" className="focusable-card__img" />
        ) : (
          <div className="focusable-card__placeholder" aria-hidden="true">
            <span className="focusable-card__placeholder-icon">🎬</span>
          </div>
        )}
        {showAddButton && onAdd && (
          <button
            type="button"
            className="focusable-card__add"
            onClick={(e) => {
              e.stopPropagation();
              onAdd(item);
            }}
            aria-label={selected ? 'Remove from selection' : 'Add to selection'}
          >
            {selected ? '−' : '+'}
          </button>
        )}
        {onWatchTrailer && (
          <button
            type="button"
            className="focusable-card__trailer"
            onClick={(e) => {
              e.stopPropagation();
              onWatchTrailer(item);
            }}
            aria-label={`Watch trailer for ${item.title || 'movie'}`}
            title="Watch trailer"
          >
            <span className="focusable-card__trailer-icon" aria-hidden="true">▶</span>
          </button>
        )}
      </div>
      <p className="focusable-card__label">{item.title || 'Unknown'}</p>
    </div>
  );
}

export default FocusableCard;
