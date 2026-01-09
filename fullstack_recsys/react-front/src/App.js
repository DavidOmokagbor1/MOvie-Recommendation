import React from 'react';
// import logo from './logo.svg';
import './App.css';
import config from './config';
import Toast from './components/Toast'
import MovieDetailEnhanced from './components/MovieDetailEnhanced'
import { Container, Icon, Button, Modal, Label, Loader, Dimmer, Dropdown, Message, Input } from "semantic-ui-react"
import _ from "lodash";

class App extends React.Component {
  constructor(props){
    super(props);

    this.state = {
      fullMovies: [],
      candidates: [],
      candidatesShow: [],
      selected: [],
      recommended: [],
      searchKey: "title",
      searchValue: "",
      modelKey: "EASE",
      modalOpen: false,
      selectedMovie: null,
      selectedMovieDetails: null,
      loadingMovies: true,
      loadingRecommendations: false,
      loadingMovieDetails: false,
      displayLimit: 48, // Show 48 movies at a time (multiple of 2, 3, 4, 6 for grid)
      trendingMovies: [],
      currentTrendingIndex: 0,
      loadingTrending: true
    }
    this.loadMovieDB = this.loadMovieDB.bind(this);
    this.loadTrendingMovies = this.loadTrendingMovies.bind(this);
    this.onRefreshClick = this.onRefreshClick.bind(this)
    this.onCandidateClick = this.onCandidateClick.bind(this)
    this.onSelectedClick = this.onSelectedClick.bind(this)
    this.onRecommendClick = this.onRecommendClick.bind(this)
    this.onSearchClick = this.onSearchClick.bind(this)
    this.onSearchChange = this.onSearchChange.bind(this)
    this.onSelectChange = this.onSelectChange.bind(this)
    this.onModelSelectClick = this.onModelSelectClick.bind(this)
    this.onMovieClick = this.onMovieClick.bind(this)
    this.closeModal = this.closeModal.bind(this)
    this.loadMore = this.loadMore.bind(this)
    this.toastRef = React.createRef();

    this.loadMovieDB();
    this.loadTrendingMovies();
  }

  componentDidMount() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
    // Start auto-sliding trending movies
    this.startTrendingAutoSlide();
  }

  componentWillUnmount() {
    // Clean up keyboard listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    // Clear trending auto-slide interval
    if (this.trendingInterval) {
      clearInterval(this.trendingInterval);
      this.trendingInterval = null;
    }
  }

  startTrendingAutoSlide = () => {
    // Clear any existing interval
    if (this.trendingInterval) {
      clearInterval(this.trendingInterval);
    }
    // Auto-slide every 5 seconds
    this.trendingInterval = setInterval(() => {
      this.setState(prevState => {
        const trendingCount = prevState.trendingMovies.length;
        if (trendingCount === 0) return prevState;
        return {
          currentTrendingIndex: (prevState.currentTrendingIndex + 1) % trendingCount
        };
      });
    }, 5000);
  }


  handleKeyDown = (e) => {
    // Escape to close modal
    if (e.key === 'Escape' && this.state.modalOpen) {
      this.closeModal();
    }
    // Enter to search (when search input is focused)
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.placeholder === 'Search...') {
      const searchValue = e.target.value;
      this.onSearchClick(this.state.searchKey, searchValue);
    }
  }

  loadMovieDB(){
    this.setState({ loadingMovies: true });
    const apiUrl = `${config.API_URL}/init`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Attempting to load movies from: ${apiUrl}`);
    }
    
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Successfully loaded ${data.result?.length || 0} movies`);
        }
        this.setState((prevState) => ({
          fullMovies: data.result,
          candidates: data.result,
          candidatesShow: data.result,
          selected: prevState.selected,
          recommended: prevState.recommended,
          loadingMovies: false
        }));
      })
      .catch((error) => {
        console.error('Error loading movies:', error);
        this.setState({ loadingMovies: false });
        if (this.toastRef.current) {
          const errorMessage = error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')
            ? `Cannot connect to backend at ${config.API_URL}. Please ensure the backend server is running on port 5555.`
            : `Failed to load movies: ${error.message || 'Unknown error'}. Please check the backend server.`;
          this.toastRef.current.show(errorMessage, 'error');
        }
      });
  }

  loadTrendingMovies(){
    this.setState({ loadingTrending: true });
    const apiUrl = `${config.API_URL}/api/trending?limit=10`;
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Attempting to load trending movies from: ${apiUrl}`);
    }
    
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (process.env.NODE_ENV === 'development') {
          console.log(`Successfully loaded ${data.result?.length || 0} trending movies`);
        }
        this.setState({
          trendingMovies: data.result || [],
          loadingTrending: false,
          currentTrendingIndex: 0
        }, () => {
          // Restart auto-slide if it's not already running
          if (!this.trendingInterval && (data.result || []).length > 0) {
            this.startTrendingAutoSlide();
          }
        });
      })
      .catch((error) => {
        console.error('Error loading trending movies:', error);
        this.setState({ loadingTrending: false, trendingMovies: [] });
      });
  }

  onRefreshClick(){
    this.setState((prevState) => ({
      fullMovies: prevState.fullMovies,
      candidates: prevState.fullMovies,
      candidatesShow: prevState.fullMovies,
      selected: [],
      recommended: []
    }))
  }

  onCandidateClick(movie){
    // Use Set for O(1) lookup instead of O(n) array.includes()
    const selectedIds = new Set(this.state.selected.map(m => m.id));
    if (!selectedIds.has(movie.id)) {
      // Use filter for better performance than slice operations
      this.setState((prevState) => ({
        ...prevState,
        candidatesShow: prevState.candidatesShow.filter(m => m.id !== movie.id),
        selected: [...prevState.selected, movie],
      }))
    }
  }

  onSelectedClick(movie){
    // Use filter for better performance
    this.setState((prevState) => ({
        ...prevState,
        candidatesShow: [...prevState.candidatesShow, movie],
        selected: prevState.selected.filter(m => m.id !== movie.id),
      }))
  }

  onSearchChange(e, data) {
    this.setState((prevState) => ({
      ...prevState,
      searchValue: e.target.value
    }))
  }

  onSelectChange(e, data) {
    this.setState((prevState) => ({
      ...prevState,
      searchKey: data.value
    }))
  }

  onSearchClick(type, query) {
    if (query.length < 1){
      this.setState((prevState) => ({
        ...prevState,
        candidatesShow: prevState.candidates,
        displayLimit: 48 // Reset limit on clear
      }))
    }
    else {
      const re = new RegExp(_.escapeRegExp(query), "i");
      const isMatch = type === "title" ? result => re.test(result.title) : result => re.test(result.genre);
      const results = this.state.candidates.filter(isMatch)
      this.setState((prevState) => ({
        ...prevState,
        candidatesShow: results,
        displayLimit: 48 // Reset limit on search
      }))
    }
  }

  loadMore() {
    this.setState(prevState => ({
      displayLimit: prevState.displayLimit + 48
    }));
  }

  onModelSelectClick(e, data){
    const newModel = data.value;
    const oldModel = this.state.modelKey;
    
    // Don't do anything if model hasn't changed
    if (newModel === oldModel) {
      return;
    }
    
    if (process.env.NODE_ENV === 'development') {
    console.log(`Model changed from ${oldModel} to ${newModel}`);
    }
    
    // Clear recommendations when switching models - this is important!
    this.setState((prevState) => ({
      ...prevState,
      modelKey: newModel,
      recommended: [], // Clear previous recommendations
      loadingRecommendations: false
    }));
    
    // Show notification
    if (this.toastRef.current) {
      this.toastRef.current.show(`Model changed to ${newModel}. Select movies and click RECOMMEND to get new suggestions.`, 'info');
    }
  }

  onMovieClick(movie){
    this.setState({
      selectedMovie: movie,
      selectedMovieDetails: null,
      modalOpen: true,
      loadingMovieDetails: true
    })
    
    // Fetch enhanced movie details
    this.fetchMovieDetails(movie.id)
  }

  fetchMovieDetails = async (movieId) => {
    this.setState({ loadingMovieDetails: true });
    try {
      const apiUrl = `${config.API_URL}/api/movies/${movieId}/details`;
      if (process.env.NODE_ENV === 'development') {
      console.log(`Fetching movie details from: ${apiUrl}`);
      }
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        this.setState({
          selectedMovieDetails: data.result,
          loadingMovieDetails: false
        });
      } else {
        // If enhanced details fail, just use basic movie info
        console.warn(`Failed to fetch movie details: HTTP ${response.status}`);
        this.setState({
          loadingMovieDetails: false
        });
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
      this.setState({
        loadingMovieDetails: false
      });
      if (this.toastRef.current) {
        const errorMessage = error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')
          ? `Cannot connect to backend at ${config.API_URL}. Please ensure the backend server is running.`
          : `Failed to load movie details: ${error.message || 'Unknown error'}`;
        this.toastRef.current.show(errorMessage, 'error');
      }
    }
  }

  closeModal(){
    this.setState({
      modalOpen: false,
      selectedMovie: null,
      selectedMovieDetails: null,
      loadingMovieDetails: false
    })
  }
  
  onRecommendClick(){
    if (this.state.selected.length < 1){
      if (this.toastRef.current) {
        this.toastRef.current.show('Please select at least one movie to get recommendations!', 'warning');
      }
      return;
    }
    
    // Use setTimeout to defer setState and prevent blocking UI
    setTimeout(() => {
      this.setState({ loadingRecommendations: true });
    }, 0);
    
    // gather ids from selected list
    let context_ids = this.state.selected.map(movie => movie.id);
    // call recommend api
    const requestOptions = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        context: context_ids,
        model: this.state.modelKey})
    };
    const recommendUrl = `${config.API_URL}/recommend`;
    const selectedModel = this.state.modelKey;
    
    
    if (process.env.NODE_ENV === 'development') {
    console.log(`=== Recommendation Request ===`);
    console.log(`URL: ${recommendUrl}`);
    }
    if (process.env.NODE_ENV === 'development') {
    console.log(`Model: ${selectedModel}`);
    console.log(`Context IDs:`, context_ids);
    }
    if (process.env.NODE_ENV === 'development') {
    console.log(`Request body:`, JSON.stringify({ context: context_ids, model: selectedModel }));
    }
    
    // Use async fetch - non-blocking
    fetch(recommendUrl, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        if (process.env.NODE_ENV === 'development') {
        console.log('=== Recommendation API Response ===');
        console.log('Full response:', data);
        }
        if (process.env.NODE_ENV === 'development') {
        console.log('Response keys:', Object.keys(data));
        }
        
        // Handle different response formats
        let recommendations = [];
        if (data.result && Array.isArray(data.result)) {
          recommendations = data.result;
        } else if (Array.isArray(data)) {
          recommendations = data;
        } else if (data.recommendations && Array.isArray(data.recommendations)) {
          recommendations = data.recommendations;
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Successfully received ${recommendations.length} recommendations`);
          console.log('Recommendations array:', recommendations);
          if (recommendations.length > 0) {
            console.log('First recommendation:', recommendations[0]);
          }
        }
        
        // Ensure recommendations have required fields
        const validRecommendations = recommendations.filter(rec => rec && rec.id);
        if (process.env.NODE_ENV === 'development') {
          console.log(`Valid recommendations: ${validRecommendations.length} out of ${recommendations.length}`);
        }
        
        // Use requestAnimationFrame for smooth UI updates
        requestAnimationFrame(() => {
          this.setState((prevState) => ({
            fullMovies: prevState.fullMovies,
            candidates: prevState.candidates,
            selected: prevState.selected,
            recommended: validRecommendations,
            loadingRecommendations: false
          }));
        });
        
        if (this.toastRef.current) {
          if (validRecommendations.length > 0) {
            this.toastRef.current.show(`Found ${validRecommendations.length} recommendations using ${this.state.modelKey}!`, 'success');
          } else {
            this.toastRef.current.show('No recommendations found. Try selecting different movies or check if the ML API is running.', 'warning');
          }
        }
      })
      .catch((error) => {
        console.error('Error fetching recommendations:', error);
        // Use requestAnimationFrame for smooth UI updates
        requestAnimationFrame(() => {
          this.setState({ loadingRecommendations: false });
        });
        if (this.toastRef.current) {
          const errorMessage = error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')
            ? `Cannot connect to backend at ${config.API_URL}. Please ensure the backend server is running on port 5555.`
            : `Error fetching recommendations: ${error.message || 'Unknown error'}. Please try again.`;
          this.toastRef.current.show(errorMessage, 'error');
        }
      })
  }

  render(){
    return (
      <div className="App">
        <Toast ref={this.toastRef} />
        <header className="modern-header">
          <div className="header-left">
            <div className="header-logo" onClick={this.onRefreshClick} title="Refresh">
              <Icon name='film' className="logo-icon" />
              <span className="logo-text">MovieRec</span>
            </div>
          </div>
          <div className="header-center">
            <h1 className="app-title">Movie Recommender System</h1>
          </div>
          <div className="header-right">
            <div className="recommendation-controls">
              <Label pointing="right" style={{ color: '#8b9dc3', background: 'transparent', border: 'none' }}>
                Model:
              </Label>
              <Dropdown
                selection
                compact
                options={[
                  { key: 'ease', text: 'EASE', value: 'EASE' },
                  { key: 'itemknn', text: 'ItemKNN', value: 'ItemKNN' },
                  // NeuralMF and DeepFM require PyTorch - uncomment when PyTorch is installed
                  // { key: 'neuralmf', text: 'NeuralMF', value: 'NeuralMF' },
                  // { key: 'deepfm', text: 'DeepFM', value: 'DeepFM' },
                ]}
                value={this.state.modelKey}
                onChange={(e, data) => this.onModelSelectClick(e, data)}
                className="model-selector"
              />
              <Button 
                icon 
                labelPosition='left' 
                onClick={(e) => {
                  // Prevent blocking - defer handler execution
                  e.preventDefault();
                  e.stopPropagation();
                  setTimeout(() => this.onRecommendClick(), 0);
                }}
                className="primary recommend-btn"
                loading={this.state.loadingRecommendations}
                disabled={this.state.selected.length < 1 || this.state.loadingRecommendations}
                title={this.state.selected.length < 1 ? 'Select at least one movie first' : 'Get recommendations'}
              >
                <Icon name='fire' />
                RECOMMEND
              </Button>
            </div>
          </div>
        </header>
        
        {/* Search Bar - Integrated */}
        <div className="search-container">
          <div className="search-wrapper">
            <Input
              type='text'
              placeholder='Search movies by title or genre...'
              className="search-input"
              icon='search'
              iconPosition='left'
              value={this.state.searchValue}
              onChange={(e) => this.setState({ searchValue: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  this.onSearchClick(this.state.searchKey, this.state.searchValue);
                }
              }}
            />
            <Dropdown
              selection
              compact
              className="search-select"
              options={[
                { key: 'title', text: 'Title', value: 'title' },
                { key: 'genre', text: 'Genre', value: 'genre' },
              ]}
              value={this.state.searchKey}
              onChange={(e, data) => this.onSelectChange(e, data)}
            />
            <Button 
              className="search-button"
              onClick={() => this.onSearchClick(this.state.searchKey, this.state.searchValue)}
              disabled={!this.state.searchValue.trim()}
            >
              Search
            </Button>
            {this.state.searchValue && (
              <Button 
                icon
                className="clear-search"
                onClick={() => {
                  this.setState({ searchValue: '' });
                  this.onSearchClick(this.state.searchKey, '');
                }}
                title="Clear search"
              >
                <Icon name='times' />
              </Button>
            )}
          </div>
        </div>

        {/* Trendy Video Hero Section - Top Under Header */}
        {!this.state.loadingTrending && this.state.trendingMovies.length > 0 && (
          <div className="trendy-hero-section">
            <div className="trending-badge-hero">
              <Icon name="fire" />
              <span>TRENDING NOW</span>
            </div>
            <div className="trendy-hero-container">
              {this.state.trendingMovies.map((movie, index) => {
                const isActive = index === this.state.currentTrendingIndex;
                const hasValidPoster = movie.poster && 
                  typeof movie.poster === 'string' &&
                  movie.poster.trim().length > 0 &&
                  movie.poster !== 'null' &&
                  movie.poster !== 'None' &&
                  !movie.poster.includes('via.placeholder.com');
                
                return (
                  <div 
                    key={movie.id || index} 
                    className={`trendy-hero-slide ${isActive ? 'active' : ''}`}
                  >
                    {hasValidPoster ? (
                      <img 
                        src={movie.poster} 
                        alt={movie.title || 'Movie poster'}
                        className="trendy-hero-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="trendy-hero-placeholder">
                        <Icon name="film" size="massive" />
                      </div>
                    )}
                    
                    {/* Hero Overlay Content */}
                    <div className="trendy-hero-overlay">
                      <h1 className="trendy-hero-title">{movie.title || 'DECEIT'}</h1>
                      <p className="trendy-hero-subtitle">{movie.genre || 'A female undercover cop is used as a sexual lure for a suspected killer'}</p>
                      
                      <div className="trendy-hero-metadata">
                        <span>16+</span>
                        <span>•</span>
                        <span>CC</span>
                        <span>•</span>
                        <span>Serie</span>
                        <span>•</span>
                        <span>{movie.date ? new Date(movie.date).getFullYear() : '2026'}</span>
                        <span>•</span>
                        <span>1 season</span>
                      </div>
                      
                      <div className="trendy-hero-buttons">
                        <Button className="trendy-hero-play-btn">
                          <Icon name="play" />
                          Play
                        </Button>
                        <Button className="trendy-hero-download-btn">
                          <Icon name="download" />
                          Download
                        </Button>
                        <Button className="trendy-hero-favorite-btn" icon>
                          <Icon name="star" />
                        </Button>
                      </div>
                      
                      <div className="trendy-hero-tabs">
                        <div className="trendy-hero-tab active">SEASON 1</div>
                        <div className="trendy-hero-tab">CAST & CREW</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Bottom Indicators */}
            <div className="trendy-hero-indicators">
              {this.state.trendingMovies.map((_, index) => (
                <div
                  key={index}
                  className={`trendy-hero-dot ${index === this.state.currentTrendingIndex ? 'active' : ''}`}
                  onClick={() => this.setState({ currentTrendingIndex: index })}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Content - Horizontal Scrollable Sections */}
        <Container className="main-container" style={{ padding: '40px 20px', maxWidth: '1800px' }}>
          {this.state.loadingMovies ? (
            <Dimmer active inverted>
              <Loader size="large">Loading Movies...</Loader>
            </Dimmer>
          ) : (
            <div className="horizontal-sections-layout">
              {/* Section 1: Available Movies */}
              <div className="horizontal-section available-section">
                <div className="section-header-horizontal">
                  <Icon name="film" size="large" />
                  <div>
                    <h2>Available Movies</h2>
                    <p className="section-subtitle">{this.state.candidatesShow.length} movies available</p>
                  </div>
                </div>
                {this.state.candidatesShow.length > 0 ? (
                  <div className="horizontal-movies-scroll">
                    <div className="horizontal-movies-container">
                      {this.state.candidatesShow.slice(0, this.state.displayLimit).map(movie => {
                        const isSelected = this.state.selected.some(m => m.id === movie.id);
                        return (
                          <div key={movie.id} className={`movie-card-horizontal ${isSelected ? 'selected' : ''}`}>
                            <div className="movie-poster-horizontal" onClick={() => this.onMovieClick(movie)}>
                              {movie.poster ? (
                                <img src={movie.poster} alt={movie.title} />
                              ) : (
                                <div className="poster-placeholder-horizontal">
                                  <Icon name="film" size="big" />
                                </div>
                              )}
                              <div className="movie-overlay-horizontal">
                                <Button 
                                  icon 
                                  circular 
                                  size="small"
                                  className={isSelected ? "remove-btn-horizontal" : "add-btn-horizontal"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    this.onCandidateClick(movie);
                                  }}
                                >
                                  <Icon name={isSelected ? "check" : "plus"} />
                                </Button>
                              </div>
                            </div>
                            <div className="movie-info-horizontal">
                              <h3 onClick={() => this.onMovieClick(movie)}>{movie.title}</h3>
                              <p>{movie.genre} • {movie.date}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {this.state.candidatesShow.length > this.state.displayLimit && (
                      <div className="load-more-horizontal">
                        <Button 
                          basic 
                          inverted 
                          color="blue" 
                          onClick={this.loadMore}
                          className="load-more-btn"
                        >
                          Load More ({this.state.candidatesShow.length - this.state.displayLimit} remaining)
                        </Button>
                      </div>
                    )}
                  </div>
                ) : (
                  <Message info className="empty-message-horizontal">
                    <Message.Header>No movies found</Message.Header>
                    <p>Try adjusting your search criteria or click the logo to refresh.</p>
                  </Message>
                )}
              </div>

              {/* Section 2: Selected Movies */}
              <div className="horizontal-section selected-section">
                <div className="section-header-horizontal">
                  <Icon name="heart" color="red" size="large" />
                  <div>
                    <h2>Selected Movies</h2>
                    <p className="section-subtitle">{this.state.selected.length} selected</p>
                  </div>
                </div>
                {this.state.selected.length > 0 ? (
                  <div className="horizontal-movies-scroll">
                    <div className="horizontal-movies-container">
                      {this.state.selected.map(movie => (
                        <div key={movie.id} className="movie-card-horizontal selected-card">
                          <div className="movie-poster-horizontal" onClick={() => this.onMovieClick(movie)}>
                            {movie.poster ? (
                              <img src={movie.poster} alt={movie.title} />
                            ) : (
                              <div className="poster-placeholder-horizontal">
                                <Icon name="film" />
                              </div>
                            )}
                            <div className="movie-overlay-horizontal">
                              <Button 
                                icon 
                                circular 
                                size="small"
                                className="remove-btn-horizontal"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  this.onSelectedClick(movie);
                                }}
                              >
                                <Icon name="times" />
                              </Button>
                            </div>
                          </div>
                          <div className="movie-info-horizontal">
                            <h3 onClick={() => this.onMovieClick(movie)}>{movie.title}</h3>
                            <p>{movie.genre} • {movie.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Message info className="empty-message-horizontal">
                    <Message.Header>No Movies Selected</Message.Header>
                    <p>Click the <Icon name="plus" /> button on movies to add them here.</p>
                  </Message>
                )}
              </div>

              {/* Section 3: Recommendations */}
              <div className="horizontal-section recommendations-section">
                <div className="section-header-horizontal">
                  <Icon name="fire" color={this.state.recommended.length > 0 ? "red" : "grey"} size="large" />
                  <div>
                    <h2>Recommendations</h2>
                    <p className="section-subtitle">
                      {this.state.loadingRecommendations 
                        ? 'Loading...' 
                        : this.state.recommended.length > 0 
                          ? `${this.state.recommended.length} found using ${this.state.modelKey}`
                          : this.state.selected.length > 0
                            ? 'Click RECOMMEND to get suggestions'
                            : 'Select movies first'}
                    </p>
                  </div>
                </div>
                {this.state.loadingRecommendations ? (
                  <Dimmer active inverted>
                    <Loader size="large">Loading Recommendations...</Loader>
                  </Dimmer>
                ) : this.state.recommended.length > 0 ? (
                  <div className="horizontal-movies-scroll">
                    <div className="horizontal-movies-container">
                      {this.state.recommended.map(movie => (
                        <div key={movie.id} className="movie-card-horizontal recommended-card">
                          <div className="movie-poster-horizontal" onClick={() => this.onMovieClick(movie)}>
                            {movie.poster ? (
                              <img src={movie.poster} alt={movie.title} />
                            ) : (
                              <div className="poster-placeholder-horizontal">
                                <Icon name="film" />
                              </div>
                            )}
                            <div className="recommendation-badge-horizontal">
                              <Icon name="fire" color="red" />
                            </div>
                          </div>
                          <div className="movie-info-horizontal">
                            <h3 onClick={() => this.onMovieClick(movie)}>{movie.title}</h3>
                            <p>{movie.genre} • {movie.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Message info className="empty-message-horizontal">
                    <Message.Header>No Recommendations Yet</Message.Header>
                    <p>Select movies and click RECOMMEND to get personalized recommendations!</p>
                  </Message>
                )}
              </div>
            </div>
          )}
        </Container>
        <footer className="modern-footer">
          <p>&copy; 2024 Movie Recommender System. Built with React & Flask.</p>
        </footer>

        {/* Movie Details Modal */}
        <Modal
          open={this.state.modalOpen}
          onClose={this.closeModal}
          closeIcon
          size="large"
          className="movie-detail-modal"
        >
          <Modal.Content scrolling>
            {this.state.loadingMovieDetails ? (
              <Dimmer active inverted>
                <Loader size="large">Loading movie details...</Loader>
              </Dimmer>
            ) : (
              this.state.selectedMovie && (
                <MovieDetailEnhanced 
                  movie={this.state.selectedMovie}
                  enhanced={this.state.selectedMovieDetails?.enhanced}
                />
              )
            )}
          </Modal.Content>
        </Modal>
      </div>
    );
  }
}

export default App;
