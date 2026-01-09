import React from 'react';
import { 
  Header, 
  Label, 
  Button, 
  Icon, 
  Image, 
  Segment, 
  Grid, 
  Divider,
  Tab,
  Card,
  Rating,
  Modal,
  Embed
} from 'semantic-ui-react';
import './MovieDetail.css';

class MovieDetailEnhanced extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      userScore: 74,
      userVibe: null,
      isLiked: false,
      isBookmarked: false,
      activeTab: 0,
      selectedImage: null,
      imageModalOpen: false,
      selectedVideo: null,
      videoModalOpen: false,
      currentVideoIndex: 0,
      currentContentIndex: 0
    };
    this.videoInterval = null;
    this.contentInterval = null;
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
        month: 'long', 
        day: 'numeric' 
      });
    } catch {
      return dateStr;
    }
  };

  formatReviewDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
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

  openImageModal = (image) => {
    this.setState({ selectedImage: image, imageModalOpen: true });
  };

  closeImageModal = () => {
    this.setState({ imageModalOpen: false, selectedImage: null });
  };

  openVideoModal = (video) => {
    this.setState({ selectedVideo: video, videoModalOpen: true });
  };

  closeVideoModal = () => {
    this.setState({ videoModalOpen: false, selectedVideo: null });
  };

  componentDidMount() {
    this._isMounted = true;
    this.startVideoAutoSlide();
    this.startContentAutoSlide();
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
      this.videoInterval = null;
    }
    if (this.contentInterval) {
      clearInterval(this.contentInterval);
      this.contentInterval = null;
    }
  }

  startVideoAutoSlide = () => {
    if (this.videoInterval) {
      clearInterval(this.videoInterval);
    }
    this.videoInterval = setInterval(() => {
      if (this._isMounted) {
        this.setState(prevState => {
          const { enhanced } = this.props;
          const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
          const videos = hasEnhanced ? (enhanced.videos || []) : [];
          const videoCount = videos.length;
          if (videoCount === 0) return prevState;
          return {
            currentVideoIndex: (prevState.currentVideoIndex + 1) % videoCount
          };
        });
      }
    }, 5000);
  }

  startContentAutoSlide = () => {
    if (this.contentInterval) {
      clearInterval(this.contentInterval);
    }
    this.contentInterval = setInterval(() => {
      if (this._isMounted) {
        this.setState(prevState => {
          const { enhanced } = this.props;
          const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
          const similar = hasEnhanced ? (enhanced.similar_movies || []) : [];
          const recommended = hasEnhanced ? (enhanced.recommended_movies || []) : [];
          const contentCount = Math.max(similar.length, recommended.length, 10);
          if (contentCount === 0) return prevState;
          return {
            currentContentIndex: (prevState.currentContentIndex + 1) % Math.max(contentCount - 3, 1)
          };
        });
      }
    }, 4000);
  }

  renderVerticalVideoCarousel = () => {
    const { enhanced } = this.props;
    const { currentVideoIndex } = this.state;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const videos = hasEnhanced ? (enhanced.videos || []) : [];
    
    if (videos.length === 0) {
      // Create placeholder videos if none available
      const placeholderVideos = [
        { id: '1', name: 'Trailer', thumbnail: null, key: null },
        { id: '2', name: 'Behind the Scenes', thumbnail: null, key: null },
        { id: '3', name: 'Featurette', thumbnail: null, key: null }
      ];
      return this.renderVideoCarouselContent(placeholderVideos, currentVideoIndex);
    }

    return this.renderVideoCarouselContent(videos, currentVideoIndex);
  }

  renderVideoCarouselContent = (videos, currentIndex) => {
    return (
      <div className="vertical-video-carousel-container">
        <div 
          className="vertical-video-carousel"
          style={{
            transform: `translateY(-${currentIndex * 100}%)`
          }}
        >
          {videos.map((video, index) => (
            <div key={video.id || index} className="vertical-video-slide">
              <div 
                className="vertical-video-card"
                onClick={() => this.openVideoModal(video)}
              >
                {video.thumbnail ? (
                  <img 
                    src={video.thumbnail} 
                    alt={video.name || 'Video'}
                    className="vertical-video-thumbnail"
                  />
                ) : (
                  <div className="vertical-video-placeholder">
                    <Icon name="play" size="big" />
                    <span>{video.name || 'Video'}</span>
                  </div>
                )}
                <div className="vertical-video-overlay">
                  <div className="vertical-video-play-button">
                    <Icon name="play" size="big" />
                  </div>
                  <div className="vertical-video-title">{video.name || 'Video'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="vertical-video-indicators">
          {videos.map((_, index) => (
            <div
              key={index}
              className={`vertical-video-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => this.setState({ currentVideoIndex: index })}
            />
          ))}
        </div>
      </div>
    );
  }

  renderContentCardsCarousel = () => {
    const { enhanced } = this.props;
    const { currentContentIndex } = this.state;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const similar = hasEnhanced ? (enhanced.similar_movies || []) : [];
    const recommended = hasEnhanced ? (enhanced.recommended_movies || []) : [];
    const cast = hasEnhanced ? (enhanced.cast || []) : [];
    
    // Combine all content sources and create more cards
    let allContent = [
      ...similar.slice(0, 5).map(movie => ({
        id: `similar-${movie.id}`,
        title: movie.title || movie.name,
        subtitle: movie.release_date ? new Date(movie.release_date).getFullYear() : '',
        image: movie.poster_path,
        type: 'movie'
      })),
      ...recommended.slice(0, 5).map(movie => ({
        id: `recommended-${movie.id}`,
        title: movie.title || movie.name,
        subtitle: movie.release_date ? new Date(movie.release_date).getFullYear() : '',
        image: movie.poster_path,
        type: 'movie'
      })),
      ...cast.slice(0, 10).map(actor => ({
        id: `cast-${actor.id}`,
        title: actor.name,
        subtitle: actor.character,
        image: actor.profile_path,
        type: 'cast'
      }))
    ];

    // If we don't have enough content, create placeholder cards
    while (allContent.length < 15) {
      allContent.push({
        id: `placeholder-${allContent.length}`,
        title: `Content ${allContent.length + 1}`,
        subtitle: 'More content coming soon',
        image: null,
        type: 'placeholder'
      });
    }

    const maxIndex = Math.max(0, allContent.length - 4);
    const cardWidth = 280 + 16; // card width + gap
    const translateX = Math.min(currentContentIndex, maxIndex) * (cardWidth * 0.25);

    return (
      <div className="content-cards-carousel-container">
        <div className="content-cards-header">
          <h3>More Content</h3>
        </div>
        <div 
          className="content-cards-carousel"
          style={{
            transform: `translateX(-${translateX}px)`
          }}
        >
          {allContent.map((item, index) => (
            <div key={item.id || index} className="content-card">
              {item.image ? (
                <img 
                  src={item.image} 
                  alt={item.title || 'Content'}
                  className="content-card-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div 
                className="content-card-placeholder"
                style={{ display: item.image ? 'none' : 'flex' }}
              >
                <Icon name={item.type === 'cast' ? 'user' : 'film'} size="big" />
              </div>
              <div className="content-card-info">
                <div className="content-card-title">{item.title || 'Content'}</div>
                {item.subtitle && (
                  <div className="content-card-subtitle">{item.subtitle}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  renderOverview = () => {
    const { movie, enhanced } = this.props;
    const { userScore, userVibe, isLiked, isBookmarked } = this.state;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    
    const posterUrl = movie.poster || (hasEnhanced && enhanced.poster_path);
    const genres = hasEnhanced && enhanced.genres ? enhanced.genres : 
                  (movie.genre ? movie.genre.split(',').map(g => g.trim()) : []);
    const directors = hasEnhanced ? (enhanced.directors || []) : [];
    const writers = hasEnhanced ? (enhanced.writers || []) : [];
    const overview = hasEnhanced ? enhanced.overview : '';
    const tagline = hasEnhanced ? enhanced.tagline : '';
    const runtime = hasEnhanced ? enhanced.runtime : null;
    const certification = hasEnhanced ? enhanced.certification : '';
    const releaseDate = hasEnhanced ? enhanced.release_date : movie.date;
    const trailerUrl = hasEnhanced ? enhanced.trailer_url : null;
    const homepage = hasEnhanced ? enhanced.homepage : null;
    const imdbId = hasEnhanced ? enhanced.imdb_id : null;

    return (
      <div className="overview-tab">
        <Grid>
          <Grid.Row>
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

            <Grid.Column width={11}>
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
                  <Button 
                    icon 
                    circular 
                    size="small"
                    className={isBookmarked ? 'bookmarked' : ''}
                    onClick={this.handleBookmark}
                  >
                    <Icon name={isBookmarked ? 'bookmark' : 'bookmark outline'} />
                  </Button>
                  <Button icon circular size="small">
                    <Icon name="list" />
                  </Button>
                  {trailerUrl && (
                    <Button 
                      color="red" 
                      size="small"
                      onClick={() => this.openVideoModal({ url: trailerUrl, name: 'Trailer' })}
                    >
                      <Icon name="play" /> Play Trailer
                    </Button>
                  )}
                </div>
              </div>

              {tagline && (
                <div className="tagline">
                  <em>{tagline}</em>
                </div>
              )}

              {overview && (
                <div className="overview-section">
                  <Header as="h3">Overview</Header>
                  <p>{overview}</p>
                </div>
              )}

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

              {/* External Links */}
              <div className="external-links" style={{ marginTop: '20px' }}>
                {imdbId && (
                  <Button 
                    as="a" 
                    href={`https://www.imdb.com/title/${imdbId}`} 
                    target="_blank"
                    size="small"
                  >
                    <Icon name="imdb" /> IMDb
                  </Button>
                )}
                {homepage && (
                  <Button 
                    as="a" 
                    href={homepage} 
                    target="_blank"
                    size="small"
                  >
                    <Icon name="home" /> Homepage
                  </Button>
                )}
                <div className="social-links" style={{ marginTop: '10px' }}>
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
              </div>
            </Grid.Column>
          </Grid.Row>
        </Grid>

        {/* Vertical Video Carousel - Under Header */}
        <div className="vertical-video-section">
          {this.renderVerticalVideoCarousel()}
        </div>

        {/* Content Cards Carousel - At Bottom */}
        <div className="content-cards-section">
          {this.renderContentCardsCarousel()}
        </div>
      </div>
    );
  };

  renderCastCrew = () => {
    const { enhanced } = this.props;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    
    if (!hasEnhanced) {
      return <div>No cast and crew information available.</div>;
    }

    const fullCast = enhanced.full_cast || enhanced.cast || [];
    const allCrew = enhanced.all_crew || [];

    // Group crew by department
    const crewByDept = {};
    allCrew.forEach(member => {
      const dept = member.department || 'Other';
      if (!crewByDept[dept]) {
        crewByDept[dept] = [];
      }
      crewByDept[dept].push(member);
    });

    return (
      <div className="cast-crew-tab">
        <Header as="h2">Cast</Header>
        <div className="cast-container">
          {fullCast.map((actor) => (
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

        <Divider />

        <Header as="h2">Crew</Header>
        {Object.keys(crewByDept).map(dept => (
          <div key={dept} style={{ marginBottom: '30px' }}>
            <Header as="h3">{dept}</Header>
            <div className="crew-grid">
              {crewByDept[dept].map((member) => (
                <div key={`${member.id}-${member.job}`} className="crew-member">
                  {member.profile_path ? (
                    <Image 
                      src={member.profile_path} 
                      alt={member.name}
                      className="crew-photo"
                      circular
                      size="small"
                    />
                  ) : (
                    <div className="crew-photo-placeholder">
                      <Icon name="user" />
                    </div>
                  )}
                  <div className="crew-name">{member.name}</div>
                  <div className="crew-job">{member.job}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  renderReviews = () => {
    const { enhanced } = this.props;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const reviews = hasEnhanced ? (enhanced.reviews || []) : [];

    if (reviews.length === 0) {
      return <div>No reviews available.</div>;
    }

    return (
      <div className="reviews-tab">
        <Header as="h2">Reviews ({reviews.length})</Header>
        {reviews.map((review) => (
          <Card key={review.id} fluid className="review-card">
            <Card.Content>
              <div className="review-header">
                {review.author_details.avatar_path ? (
                  <Image 
                    src={review.author_details.avatar_path} 
                    circular 
                    size="mini"
                    floated="left"
                  />
                ) : (
                  <Icon name="user circle" size="large" floated="left" />
                )}
                <div>
                  <Card.Header>
                    {review.author_details.name || review.author}
                    {review.author_details.rating && (
                      <Rating 
                        icon="star" 
                        defaultRating={review.author_details.rating / 2} 
                        maxRating={5} 
                        disabled
                        size="mini"
                        style={{ marginLeft: '10px' }}
                      />
                    )}
                  </Card.Header>
                  <Card.Meta>{this.formatReviewDate(review.created_at)}</Card.Meta>
                </div>
              </div>
              <Card.Description>
                <p style={{ whiteSpace: 'pre-wrap', marginTop: '15px' }}>
                  {review.content.length > 500 
                    ? `${review.content.substring(0, 500)}...` 
                    : review.content}
                </p>
                {review.content.length > 500 && review.url && (
                  <a href={review.url} target="_blank" rel="noopener noreferrer">
                    Read full review <Icon name="external" />
                  </a>
                )}
              </Card.Description>
            </Card.Content>
          </Card>
        ))}
      </div>
    );
  };

  renderSimilarMovies = () => {
    const { enhanced } = this.props;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const similar = hasEnhanced ? (enhanced.similar_movies || []) : [];
    const recommended = hasEnhanced ? (enhanced.recommended_movies || []) : [];

    return (
      <div className="similar-movies-tab">
        {similar.length > 0 && (
          <>
            <Header as="h2">Similar Movies</Header>
            <div className="movies-grid">
              {similar.map((movie) => (
                <Card 
                  key={movie.id} 
                  className="movie-card"
                  onClick={() => window.location.reload()} // Would navigate to movie
                >
                  {movie.poster_path ? (
                    <Image src={movie.poster_path} wrapped />
                  ) : (
                    <div className="movie-card-placeholder">
                      <Icon name="film" size="big" />
                    </div>
                  )}
                  <Card.Content>
                    <Card.Header>{movie.title}</Card.Header>
                    <Card.Meta>
                      {movie.release_date && new Date(movie.release_date).getFullYear()}
                      {movie.vote_average && ` • ${movie.vote_average.toFixed(1)} ⭐`}
                    </Card.Meta>
                    {movie.overview && (
                      <Card.Description>
                        {movie.overview.length > 100 
                          ? `${movie.overview.substring(0, 100)}...` 
                          : movie.overview}
                      </Card.Description>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </div>
          </>
        )}

        {recommended.length > 0 && (
          <>
            <Divider />
            <Header as="h2">Recommended Movies</Header>
            <div className="movies-grid">
              {recommended.map((movie) => (
                <Card 
                  key={movie.id} 
                  className="movie-card"
                  onClick={() => window.location.reload()}
                >
                  {movie.poster_path ? (
                    <Image src={movie.poster_path} wrapped />
                  ) : (
                    <div className="movie-card-placeholder">
                      <Icon name="film" size="big" />
                    </div>
                  )}
                  <Card.Content>
                    <Card.Header>{movie.title}</Card.Header>
                    <Card.Meta>
                      {movie.release_date && new Date(movie.release_date).getFullYear()}
                      {movie.vote_average && ` • ${movie.vote_average.toFixed(1)} ⭐`}
                    </Card.Meta>
                    {movie.overview && (
                      <Card.Description>
                        {movie.overview.length > 100 
                          ? `${movie.overview.substring(0, 100)}...` 
                          : movie.overview}
                      </Card.Description>
                    )}
                  </Card.Content>
                </Card>
              ))}
            </div>
          </>
        )}

        {similar.length === 0 && recommended.length === 0 && (
          <div>No similar or recommended movies available.</div>
        )}
      </div>
    );
  };

  renderImages = () => {
    const { enhanced } = this.props;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const images = hasEnhanced ? (enhanced.images || {}) : {};
    const posters = images.posters || [];
    const backdrops = images.backdrops || [];

    return (
      <div className="images-tab">
        {posters.length > 0 && (
          <>
            <Header as="h2">Posters ({posters.length})</Header>
            <div className="images-grid">
              {posters.map((img, idx) => (
                <div 
                  key={idx} 
                  className="image-item"
                  onClick={() => this.openImageModal(img)}
                >
                  <Image 
                    src={img.file_path} 
                    alt={`Poster ${idx + 1}`}
                    className="gallery-image"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {backdrops.length > 0 && (
          <>
            <Divider />
            <Header as="h2">Backdrops ({backdrops.length})</Header>
            <div className="images-grid">
              {backdrops.map((img, idx) => (
                <div 
                  key={idx} 
                  className="image-item"
                  onClick={() => this.openImageModal(img)}
                >
                  <Image 
                    src={img.file_path} 
                    alt={`Backdrop ${idx + 1}`}
                    className="gallery-image"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        {posters.length === 0 && backdrops.length === 0 && (
          <div>No images available.</div>
        )}
      </div>
    );
  };

  renderVideos = () => {
    const { enhanced } = this.props;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const videos = hasEnhanced ? (enhanced.videos || []) : [];

    if (videos.length === 0) {
      return <div>No videos available.</div>;
    }

    // Group videos by type
    const videosByType = {};
    videos.forEach(video => {
      const type = video.type || 'Other';
      if (!videosByType[type]) {
        videosByType[type] = [];
      }
      videosByType[type].push(video);
    });

    return (
      <div className="videos-tab">
        {Object.keys(videosByType).map(type => (
          <div key={type} style={{ marginBottom: '30px' }}>
            <Header as="h2">{type}s ({videosByType[type].length})</Header>
            <div className="videos-grid">
              {videosByType[type].map((video) => (
                <Card 
                  key={video.id} 
                  className="video-card"
                  onClick={() => this.openVideoModal(video)}
                >
                  {video.thumbnail && (
                    <div className="video-thumbnail">
                      <Image src={video.thumbnail} />
                      <div className="play-overlay">
                        <Icon name="play" size="big" />
                      </div>
                    </div>
                  )}
                  <Card.Content>
                    <Card.Header>{video.name}</Card.Header>
                  </Card.Content>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  renderWatchProviders = () => {
    const { enhanced } = this.props;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const providers = hasEnhanced ? (enhanced.watch_providers || {}) : {};

    const buy = providers.buy || [];
    const rent = providers.rent || [];
    const flatrate = providers.flatrate || [];

    if (buy.length === 0 && rent.length === 0 && flatrate.length === 0) {
      return (
        <div className="watch-providers-tab">
          <div>No watch providers available for this movie.</div>
        </div>
      );
    }

    return (
      <div className="watch-providers-tab">
        {flatrate.length > 0 && (
          <>
            <Header as="h2">Stream</Header>
            <div className="providers-grid">
              {flatrate.map((provider) => (
                <div key={provider.provider_id} className="provider-item">
                  {provider.logo_path ? (
                    <Image src={provider.logo_path} size="small" />
                  ) : (
                    <div className="provider-placeholder">
                      <Icon name="tv" />
                    </div>
                  )}
                  <div className="provider-name">{provider.provider_name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {rent.length > 0 && (
          <>
            <Divider />
            <Header as="h2">Rent</Header>
            <div className="providers-grid">
              {rent.map((provider) => (
                <div key={provider.provider_id} className="provider-item">
                  {provider.logo_path ? (
                    <Image src={provider.logo_path} size="small" />
                  ) : (
                    <div className="provider-placeholder">
                      <Icon name="tv" />
                    </div>
                  )}
                  <div className="provider-name">{provider.provider_name}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {buy.length > 0 && (
          <>
            <Divider />
            <Header as="h2">Buy</Header>
            <div className="providers-grid">
              {buy.map((provider) => (
                <div key={provider.provider_id} className="provider-item">
                  {provider.logo_path ? (
                    <Image src={provider.logo_path} size="small" />
                  ) : (
                    <div className="provider-placeholder">
                      <Icon name="tv" />
                    </div>
                  )}
                  <div className="provider-name">{provider.provider_name}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    );
  };

  renderDetails = () => {
    const { enhanced } = this.props;
    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;

    if (!hasEnhanced) {
      return <div>No additional details available.</div>;
    }

    const status = enhanced.status || '';
    const originalLanguage = enhanced.original_language || '';
    const budget = enhanced.budget || null;
    const revenue = enhanced.revenue || null;
    const productionCompanies = enhanced.production_companies || [];
    const productionCountries = enhanced.production_countries || [];
    const spokenLanguages = enhanced.spoken_languages || [];
    const keywords = enhanced.keywords || [];
    const voteAverage = enhanced.vote_average || null;
    const voteCount = enhanced.vote_count || null;

    return (
      <div className="details-tab">
        <Grid>
          <Grid.Row>
            <Grid.Column width={8}>
              <Segment>
                <Header as="h3">Status</Header>
                <p>{status || 'N/A'}</p>

                <Header as="h3">Original Language</Header>
                <p>{originalLanguage ? originalLanguage.toUpperCase() : 'N/A'}</p>

                <Header as="h3">Budget</Header>
                <p>{this.formatCurrency(budget)}</p>

                <Header as="h3">Revenue</Header>
                <p>{this.formatCurrency(revenue)}</p>

                {voteAverage && (
                  <>
                    <Header as="h3">TMDB Rating</Header>
                    <p>
                      <Rating 
                        icon="star" 
                        defaultRating={voteAverage / 2} 
                        maxRating={5} 
                        disabled
                      />
                      {' '}
                      {voteAverage.toFixed(1)}/10 ({voteCount?.toLocaleString()} votes)
                    </p>
                  </>
                )}
              </Segment>
            </Grid.Column>

            <Grid.Column width={8}>
              <Segment>
                {productionCompanies.length > 0 && (
                  <>
                    <Header as="h3">Production Companies</Header>
                    <ul>
                      {productionCompanies.map((company, idx) => (
                        <li key={idx}>{company}</li>
                      ))}
                    </ul>
                  </>
                )}

                {productionCountries.length > 0 && (
                  <>
                    <Header as="h3">Production Countries</Header>
                    <ul>
                      {productionCountries.map((country, idx) => (
                        <li key={idx}>{country}</li>
                      ))}
                    </ul>
                  </>
                )}

                {spokenLanguages.length > 0 && (
                  <>
                    <Header as="h3">Spoken Languages</Header>
                    <ul>
                      {spokenLanguages.map((lang, idx) => (
                        <li key={idx}>{lang}</li>
                      ))}
                    </ul>
                  </>
                )}

                {keywords.length > 0 && (
                  <>
                    <Header as="h3">Keywords</Header>
                    <div className="keywords-container">
                      {keywords.map((keyword, idx) => (
                        <Label key={idx} size="small">{keyword}</Label>
                      ))}
                    </div>
                  </>
                )}
              </Segment>
            </Grid.Column>
          </Grid.Row>
        </Grid>
      </div>
    );
  };

  render() {
    const { movie, enhanced } = this.props;
    const { imageModalOpen, selectedImage, videoModalOpen, selectedVideo } = this.state;

    if (!movie) return null;

    const hasEnhanced = enhanced && Object.keys(enhanced).length > 0;
    const backdropUrl = hasEnhanced && enhanced.backdrop_path;

    const panes = [
      { 
        menuItem: 'Overview', 
        render: () => <Tab.Pane>{this.renderOverview()}</Tab.Pane> 
      },
      { 
        menuItem: 'Cast & Crew', 
        render: () => <Tab.Pane>{this.renderCastCrew()}</Tab.Pane> 
      },
      { 
        menuItem: 'Reviews', 
        render: () => <Tab.Pane>{this.renderReviews()}</Tab.Pane> 
      },
      { 
        menuItem: 'Similar Movies', 
        render: () => <Tab.Pane>{this.renderSimilarMovies()}</Tab.Pane> 
      },
      { 
        menuItem: 'Images', 
        render: () => <Tab.Pane>{this.renderImages()}</Tab.Pane> 
      },
      { 
        menuItem: 'Videos', 
        render: () => <Tab.Pane>{this.renderVideos()}</Tab.Pane> 
      },
      { 
        menuItem: 'Watch', 
        render: () => <Tab.Pane>{this.renderWatchProviders()}</Tab.Pane> 
      },
      { 
        menuItem: 'Details', 
        render: () => <Tab.Pane>{this.renderDetails()}</Tab.Pane> 
      },
    ];

    return (
      <div className="movie-detail-container">
        {backdropUrl && (
          <div 
            className="movie-backdrop"
            style={{ backgroundImage: `url(${backdropUrl})` }}
          />
        )}

        <div className="movie-detail-content">
          <Tab 
            panes={panes} 
            menu={{ pointing: true, secondary: true, className: 'detail-tabs' }}
          />
        </div>

        {/* Image Modal */}
        <Modal
          open={imageModalOpen}
          onClose={this.closeImageModal}
          size="large"
          closeIcon
        >
          <Modal.Content image>
            {selectedImage && (
              <Image 
                src={selectedImage.file_path} 
                wrapped 
                size="massive"
              />
            )}
          </Modal.Content>
        </Modal>

        {/* Video Modal */}
        <Modal
          open={videoModalOpen}
          onClose={this.closeVideoModal}
          size="large"
          closeIcon
        >
          <Modal.Header>
            {selectedVideo?.name || 'Video'}
          </Modal.Header>
          <Modal.Content>
            {selectedVideo?.key && (
              <Embed
                id={selectedVideo.key}
                source="youtube"
                placeholder={selectedVideo.thumbnail}
              />
            )}
          </Modal.Content>
        </Modal>
      </div>
    );
  }
}

export default MovieDetailEnhanced;





