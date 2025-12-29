import React from 'react';
import { Header, Icon, Message } from 'semantic-ui-react';
import MovieCard from './MovieCard';
import './MovieGrid.css';

class MovieGrid extends React.Component {
  render() {
    const { 
      movies, 
      title, 
      icon, 
      onAdd, 
      onMovieClick, 
      selectedMovies = [],
      emptyMessage = "No movies available"
    } = this.props;

    if (!movies || movies.length === 0) {
      return (
        <div className="movie-grid-container">
          <Header as="h2" className="section-header">
            {icon && <Icon name={icon} />}
            {title}
          </Header>
          <Message className="empty-message">
            <Icon name="film" />
            {emptyMessage}
          </Message>
        </div>
      );
    }

    return (
      <div className="movie-grid-container">
        <Header as="h2" className="section-header">
          {icon && <Icon name={icon} />}
          {title} <span className="movie-count">({movies.length})</span>
        </Header>
        <div className="movie-grid">
          {movies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              onAdd={onAdd}
              onMovieClick={onMovieClick}
              isSelected={selectedMovies.some(m => m.id === movie.id)}
            />
          ))}
        </div>
      </div>
    );
  }
}

export default MovieGrid;

