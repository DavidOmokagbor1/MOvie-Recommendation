import React from 'react';
import FocusableCard from './FocusableCard';
import './Rail.css';

/**
 * Horizontal rail: section title + scrollable row of FocusableCards.
 * Props: title, items[], onItemSelect, [optional] renderCard, showAddButton, onAdd, getSelected,
 *        onWatchTrailer?, loadMore?, showingCount?, totalCount?
 */
function Rail({ title, items = [], onItemSelect, renderCard, showAddButton, onAdd, getSelected, onWatchTrailer, loadMore, showingCount, totalCount }) {
  if (!items || items.length === 0) {
    return (
      <section className="rail" aria-label={title}>
        <h2 className="rail__title">{title}</h2>
        <div className="rail__scroll" data-rail-id={title}>
          <p className="rail__empty">Nothing here yet.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="rail" aria-label={title}>
      <div className="rail__header">
        <h2 className="rail__title">{title}</h2>
        {typeof showingCount === 'number' && typeof totalCount === 'number' && totalCount > 0 && (
          <span className="rail__count" aria-live="polite">
            Showing {showingCount} of {totalCount} movies
          </span>
        )}
      </div>
      <div className="rail__scroll" role="list" data-rail-id={title}>
        {items.map((item) => {
          const key = item.id != null ? item.id : item.title;
          const selected = getSelected ? getSelected(item) : false;
          if (renderCard) {
            return (
              <div key={key} role="listitem" className="rail__item">
                {renderCard(item, selected)}
              </div>
            );
          }
          return (
            <div key={key} role="listitem" className="rail__item">
              <FocusableCard
                item={item}
                onSelect={onItemSelect}
                selected={selected}
                showAddButton={showAddButton}
                onAdd={onAdd}
                onWatchTrailer={onWatchTrailer}
              />
            </div>
          );
        })}
      </div>
      {loadMore && (
        <div className="rail__load-more-wrap">
          <button type="button" className="rail__load-more" onClick={loadMore} aria-label="Load more movies">
            Load more movies
          </button>
        </div>
      )}
    </section>
  );
}

export default Rail;
