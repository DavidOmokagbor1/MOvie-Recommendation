import React from 'react';
import { 
  Header, 
  Label, 
  Button, 
  Icon, 
  Image, 
  Segment, 
  Grid, 
  Divider
} from 'semantic-ui-react';
import './MovieDetail.css';

class MovieDetail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userScore: 74, // Default user score
      userVibe: null, // 'angry', 'thinking', 'happy'
      isLiked: false,
      isBookmarked: false
    };
  }

  formatRuntime = (minutes) => {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  formatCurrency = (amount) => {
    if (!amount || amount === 0) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit' 
      });
    } catch {
      return dateStr;
    }
  };

  handleVibeClick = (vibe) => {
    this.setState({ userVibe: vibe });
  };

  handleLike = () => {
    this.setState({ isLiked: !this.state.isLiked });
  };

  handleBookmark = () => {
    this.setState({ isBookmarked: !this.state.isBookmarked });
  };

  render() {
    const { movie, enhanced } = this.props;
    const { userScore, userVibe, isLiked, isBookmarked } = this.state;

    if (!movie) return null;

    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const backdropUrl = hasEnhanced && enhanced.backdrop_path;
    const posterUrl = movie.poster || (hasEnhanced && enhanced.poster_path);
    const genres = hasEnhanced && enhanced.genres ? enhanced.genres : 
                  (movie.genre ? movie.genre.split(',').map(g => g.trim()) : []);
    const cast = hasEnhanced ? (enhanced.cast || []) : [];
    const directors = hasEnhanced ? (enhanced.directors || []) : [];
    const writers = hasEnhanced ? (enhanced.writers || []) : [];
    const overview = hasEnhanced ? enhanced.overview : '';
    const tagline = hasEnhanced ? enhanced.tagline : '';
    const runtime = hasEnhanced ? enhanced.runtime : null;
    const budget = hasEnhanced ? enhanced.budget : null;
    const certification = hasEnhanced ? enhanced.certification : '';
    const voteAverage = hasEnhanced ? enhanced.vote_average : null;
    const releaseDate = hasEnhanced ? enhanced.release_date : movie.date;
    const status = hasEnhanced ? enhanced.status : '';
    const originalLanguage = hasEnhanced ? enhanced.original_language : '';
    const trailerUrl = hasEnhanced ? enhanced.trailer_url : null;

    return (
      <div className="movie-detail-container">
        {/* Backdrop Image */}
        {backdropUrl && (
          <div 
            className="movie-backdrop"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}

        <div className="movie-detail-content">
          <Grid>
            <Grid.Row>
              {/* Left Column - Poster */}
              <Grid.Column width={5}>
                <div className="poster-container">
                  {posterUrl ? (
                    <Image 
                      src={posterUrl} 
                      alt={movie.title}
                      className="movie-poster"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="poster-placeholder">
                      <Icon name="film" size="huge" />
                      <p>No Poster Available</p>
                    </div>
                  )}
                </div>
              </Grid.Column>

              {/* Right Column - Details */}
              <Grid.Column width={11}>
                {/* Title and Basic Info */}
                <Header as="h1" className="movie-title">
                  {movie.title}
                  {hasEnhanced && enhanced.original_title && enhanced.original_title !== movie.title && (
                    <span className="original-title">({enhanced.original_title})</span>
                  )}
                </Header>

                <div className="movie-meta">
                  {certification && (
                    <Label size="large" color="orange">{certification}</Label>
                  )}
                  {releaseDate && (
                    <span className="release-date">
                      {this.formatDate(releaseDate)} (US)
                    </span>
                  )}
                  {genres.length > 0 && (
                    <div className="genres">
                      {genres.map((genre, idx) => (
                        <Label key={idx} size="small">{genre}</Label>
                      ))}
                    </div>
                  )}
                  {runtime && (
                    <span className="runtime">{this.formatRuntime(runtime)}</span>
                  )}
                </div>

                {/* User Score and Interactions */}
                <div className="user-interactions">
                  <div className="user-score-section">
                    <div className="score-circle">
                      <span className="score-value">{userScore}%</span>
                    </div>
                    <div className="vibe-buttons">
                      <Button 
                        icon 
                        circular 
                        size="small"
                        className={userVibe === 'angry' ? 'active' : ''}
                        onClick={() => this.handleVibeClick('angry')}
                      >
                        <Icon name="frown" />
                      </Button>
                      <Button 
                        icon 
                        circular 
                        size="small"
                        className={userVibe === 'thinking' ? 'active' : ''}
                        onClick={() => this.handleVibeClick('thinking')}
                      >
                        <Icon name="meh" />
                      </Button>
                      <Button 
                        icon 
                        circular 
                        size="small"
                        className={userVibe === 'happy' ? 'active' : ''}
                        onClick={() => this.handleVibeClick('happy')}
                      >
                        <Icon name="smile" />
                      </Button>
                      <Button size="small" className="vibe-button">
                        What's your Vibe?
                      </Button>
                    </div>
                  </div>

                  <div className="action-buttons">
                    <Button 
                      icon 
                      circular 
                      size="small"
                      className={isLiked ? 'liked' : ''}
                      onClick={this.handleLike}
                    >
                      <Icon name={isLiked ? 'heart' : 'heart outline'} />
                    </Button>
                    <Button icon circular size="small">
                      <Icon name="bookmark" />
                    </Button>
                    <Button icon circular size="small">
                      <Icon name="list" />
                    </Button>
                    {trailerUrl && (
                      <Button 
                        color="red" 
                        size="small"
                        onClick={() => window.open(trailerUrl, '_blank')}
                      >
                        <Icon name="play" /> Play Trailer
                      </Button>
                    )}
                  </div>
                </div>

                {/* Tagline */}
                {tagline && (
                  <div className="tagline">
                    <em>{tagline}</em>
                  </div>
                )}

                {/* Overview */}
                {overview && (
                  <div className="overview-section">
                    <Header as="h3">Overview</Header>
                    <p>{overview}</p>
                  </div>
                )}

                {/* Crew */}
                {(directors.length > 0 || writers.length > 0) && (
                  <div className="crew-section">
                    {directors.length > 0 && (
                      <div className="crew-group">
                        <strong>Director{directors.length > 1 ? 's' : ''}: </strong>
                        {directors.map((d, idx) => (
                          <span key={d.id}>
                            {d.name}{idx < directors.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                    {writers.length > 0 && (
                      <div className="crew-group">
                        <strong>Writer{writers.length > 1 ? 's' : ''}: </strong>
                        {writers.map((w, idx) => (
                          <span key={w.id}>
                            {w.name}{idx < writers.length - 1 ? ', ' : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Grid.Column>
            </Grid.Row>

            {/* Cast Section */}
            {cast.length > 0 && (
              <>
                <Divider />
                <Grid.Row>
                  <Grid.Column width={16}>
                    <Header as="h3">Top Billed Cast</Header>
                    <div className="cast-container">
                      {cast.map((actor) => (
                        <div key={actor.id} className="cast-member">
                          {actor.profile_path ? (
                            <Image 
                              src={actor.profile_path} 
                              alt={actor.name}
                              className="cast-photo"
                              circular
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="cast-photo-placeholder">
                              <Icon name="user" />
                            </div>
                          )}
                          <div className="cast-name">{actor.name}</div>
                          <div className="cast-character">{actor.character}</div>
                        </div>
                      ))}
                    </div>
                  </Grid.Column>
                </Grid.Row>
              </>
            )}

            {/* Additional Info */}
            {hasEnhanced && (
              <>
                <Divider />
                <Grid.Row>
                  <Grid.Column width={8}>
                    <Segment>
                      <Header as="h4">Additional Information</Header>
                      {status && (
                        <div className="info-item">
                          <strong>Status:</strong> {status}
                        </div>
                      )}
                      {originalLanguage && (
                        <div className="info-item">
                          <strong>Original Language:</strong> {originalLanguage.toUpperCase()}
                        </div>
                      )}
                      {budget && (
                        <div className="info-item">
                          <strong>Budget:</strong> {this.formatCurrency(budget)}
                        </div>
                      )}
                      {voteAverage && (
                        <div className="info-item">
                          <strong>TMDB Rating:</strong> {voteAverage.toFixed(1)}/10
                        </div>
                      )}
                    </Segment>
                  </Grid.Column>
                  <Grid.Column width={8}>
                    <Segment>
                      <Header as="h4">Watch Now</Header>
                      <Button 
                        fluid 
                        color="blue"
                        size="large"
                        disabled
                      >
                        <Icon name="play" /> Available on Streaming Platforms
                      </Button>
                      <div className="social-links" style={{ marginTop: '15px', textAlign: 'center' }}>
                        <Button icon circular size="small">
                          <Icon name="facebook" />
                        </Button>
                        <Button icon circular size="small">
                          <Icon name="twitter" />
                        </Button>
                        <Button icon circular size="small">
                          <Icon name="instagram" />
                        </Button>
                        <Button icon circular size="small">
                          <Icon name="linkify" />
                        </Button>
                      </div>
                    </Segment>
                  </Grid.Column>
                </Grid.Row>
              </>
            )}
          </Grid>
        </div>
      </div>
    );
  }
}

export default MovieDetail;

