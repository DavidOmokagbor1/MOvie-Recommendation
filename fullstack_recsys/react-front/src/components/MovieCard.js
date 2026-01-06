import React from 'react';
import { Card, Button, Icon, Image, Label } from 'semantic-ui-react';
import './MovieCard.css';

class MovieCard extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isHovered: false
    };
  }

  handleMouseEnter = () => {
    this.setState({ isHovered: true });
  };

  handleMouseLeave = () => {
    this.setState({ isHovered: false });
  };

  render() {
    const { movie, onAdd, onMovieClick, isSelected } = this.props;
    const { isHovered } = this.state;

    return (
      <Card 
        className={`movie-card ${isSelected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
        onMouseEnter={this.handleMouseEnter}
        onMouseLeave={this.handleMouseLeave}
        onClick={() => onMovieClick && onMovieClick(movie)}
      >
        <div className="movie-card-poster">
          {movie.poster ? (
            <Image 
              src={movie.poster} 
              alt={movie.title}
              className="poster-image"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          ) : (
            <div className="poster-placeholder">
              <Icon name="film" size="big" />
              <span>No Poster</span>
            </div>
          )}
          
          {/* Overlay on hover */}
          <div className={`poster-overlay ${isHovered ? 'visible' : ''}`}>
            <div className="overlay-content">
              <Button 
                circular 
                icon 
                size="large"
                color="red"
                className="play-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMovieClick && onMovieClick(movie);
                }}
              >
                <Icon name="play" />
              </Button>
              <Button 
                circular 
                icon 
                size="small"
                color={isSelected ? "green" : "grey"}
                className="add-button"
                onClick={(e) => {
                  e.stopPropagation();
                  onAdd && onAdd(movie);
                }}
              >
                <Icon name={isSelected ? "check" : "plus"} />
              </Button>
            </div>
          </div>

          {/* Add button badge */}
          {!isHovered && (
            <div className="add-badge" onClick={(e) => {
              e.stopPropagation();
              onAdd && onAdd(movie);
            }}>
              <Icon name={isSelected ? "check circle" : "plus circle"} />
            </div>
          )}
        </div>

        <Card.Content className="movie-card-content">
          <Card.Header className="movie-title">{movie.title}</Card.Header>
          <Card.Meta className="movie-meta">
            <span className="movie-genre">{movie.genre?.split(',')[0] || 'Unknown'}</span>
            {movie.date && (
              <span className="movie-date"> • {new Date(movie.date).getFullYear()}</span>
            )}
          </Card.Meta>
        </Card.Content>
      </Card>
    );
  }
}

export default MovieCard;




