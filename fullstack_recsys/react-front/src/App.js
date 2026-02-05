import React from 'react';
// import logo from './logo.svg';
import './App.css';
import './AppleTV.css';
import config from './config';
import { TRENDING_SLIDE_INTERVAL_MS } from './constants/heroTiming';
import Toast from './components/Toast';
import MovieDetailEnhanced from './components/MovieDetailEnhanced';
import Hero from './components/Hero';
import Rail from './components/Rail';
import { Icon, Button, Modal, Label, Loader, Dimmer, Dropdown, Input } from "semantic-ui-react";
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
      loadingTrending: true,
      currentTrendingTrailerKey: null,
      trendingLoadError: null
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
    this.lastFocusedBeforeModal = null;

    this.loadMovieDB();
    this.loadTrendingMovies();
  }

  componentDidMount() {
    document.addEventListener('keydown', this.handleKeyDown);
    this.startTrendingAutoSlide();
    this.fetchTrendingTrailerIfNeeded();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.currentTrendingIndex !== this.state.currentTrendingIndex ||
        (prevState.trendingMovies.length === 0 && this.state.trendingMovies.length > 0)) {
      this.fetchTrendingTrailerIfNeeded();
    }
  }

  fetchTrendingTrailerIfNeeded = () => {
    const { trendingMovies, currentTrendingIndex } = this.state;
    if (!trendingMovies.length) return;
    const movie = trendingMovies[currentTrendingIndex] || trendingMovies[0];
    if (!movie || !movie.id) return;
    this.fetchTrendingTrailer(movie.id);
  };

  fetchTrendingTrailer = async (movieId) => {
    this.setState({ currentTrendingTrailerKey: null });
    try {
      const response = await fetch(`${config.API_URL}/api/movies/${movieId}/details`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) return;
      const data = await response.json();
      let key = data.result?.enhanced?.trailer_key || null;
      if (!key && data.result?.enhanced?.trailer_url) {
        const m = (data.result.enhanced.trailer_url || '').match(/(?:v=|\/)([a-zA-Z0-9_-]{11})(?:\?|&|$)/);
        if (m) key = m[1];
      }
      this.setState((prev) => {
        const current = prev.trendingMovies[prev.currentTrendingIndex];
        if (!current || String(current.id) !== String(movieId)) return null;
        return { currentTrendingTrailerKey: key };
      });
    } catch (err) {
      if (process.env.NODE_ENV === 'development') console.warn('Trending trailer fetch failed:', err);
    }
  };

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
    if (this.trendingInterval) {
      clearInterval(this.trendingInterval);
    }
    this.trendingInterval = setInterval(() => {
      this.setState(prevState => {
        const trendingCount = prevState.trendingMovies.length;
        if (trendingCount === 0) return prevState;
        return {
          currentTrendingIndex: (prevState.currentTrendingIndex + 1) % trendingCount
        };
      });
    }, TRENDING_SLIDE_INTERVAL_MS);
  }

  handleKeyDown = (e) => {
    if (e.key === 'Escape' && this.state.modalOpen) {
      this.closeModal();
    }
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.placeholder === 'Search...') {
      const searchValue = e.target.value;
      this.onSearchClick(this.state.searchKey, searchValue);
    }
    // Arrow keys in trending section: previous/next slide
    const inTrending = e.target.closest && e.target.closest('.trending-video-section');
    if (inTrending && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
      const n = this.state.trendingMovies.length;
      if (n > 0) {
        e.preventDefault();
        this.setState(prev => ({
          currentTrendingIndex: e.key === 'ArrowRight'
            ? (prev.currentTrendingIndex + 1) % n
            : (prev.currentTrendingIndex - 1 + n) % n
        }));
      }
    }
    // Arrow keys: move focus within a rail
    const rail = e.target.closest && e.target.closest('[data-rail-id]');
    if (rail && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) {
      const focusables = rail.querySelectorAll('.focusable-card[tabindex="0"]');
      const idx = Array.from(focusables).indexOf(e.target);
      if (idx >= 0) {
        e.preventDefault();
        const next = e.key === 'ArrowRight' ? idx + 1 : idx - 1;
        if (next >= 0 && next < focusables.length) focusables[next].focus();
      }
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
    this.setState({ loadingTrending: true, trendingLoadError: null });
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
        this.setState({ loadingTrending: false, trendingMovies: [], trendingLoadError: error });
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

  /** Fetch movie details and open trailer in new tab if available */
  openTrailerForMovie = async (item) => {
    if (!item || !item.id) return;
    try {
      const response = await fetch(`${config.API_URL}/api/movies/${item.id}/details`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) return;
      const data = await response.json();
      const key = data.result?.enhanced?.trailer_key;
      const url = data.result?.enhanced?.trailer_url;
      if (key) {
        window.open(`https://www.youtube.com/watch?v=${key}`, '_blank', 'noopener,noreferrer');
      } else if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else if (this.toastRef.current) {
        this.toastRef.current.show(`No trailer available for ${item.title || 'this movie'}`, 'info');
      }
    } catch (err) {
      if (this.toastRef.current) {
        this.toastRef.current.show('Could not load trailer.', 'error');
      }
    }
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
    this.lastFocusedBeforeModal = document.activeElement;
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
    }, () => {
      if (this.lastFocusedBeforeModal && typeof this.lastFocusedBeforeModal.focus === 'function') {
        this.lastFocusedBeforeModal.focus();
      }
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
      <div className="App apple-tv-layout">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <Toast ref={this.toastRef} />
        <header className="modern-header" role="banner">
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
        
        {/* Search - semantics and theme */}
        <section className="search-container" aria-label="Search movies">
          <div className="search-wrapper">
            <Input
              type="search"
              placeholder="Search movies by title or genre..."
              className="search-input"
              icon="search"
              iconPosition="left"
              value={this.state.searchValue}
              onChange={(e) => this.setState({ searchValue: e.target.value })}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  this.onSearchClick(this.state.searchKey, this.state.searchValue);
                }
              }}
              aria-label="Search movies by title or genre"
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
                aria-label="Clear search"
              >
                <Icon name="times" />
              </Button>
            )}
          </div>
        </section>

        {/* Trending: loading skeleton, error + retry, or hero + dots */}
        <section className="trending-video-section" aria-label="Trending video">
          <h2 className="trending-video-title">Trending video</h2>
          {this.state.loadingTrending && (
            <div className="trending-hero-skeleton" aria-hidden="true">
              <div className="trending-hero-skeleton__bar" />
              <p className="trending-hero-skeleton__text">Loading trending…</p>
            </div>
          )}
          {!this.state.loadingTrending && this.state.trendingMovies.length === 0 && (
            <div className="trending-hero-error">
              <p className="trending-hero-error__text">Trending unavailable.</p>
              <Button primary onClick={() => this.loadTrendingMovies()} aria-label="Retry loading trending">
                Retry
              </Button>
            </div>
          )}
          {!this.state.loadingTrending && this.state.trendingMovies.length > 0 && (
            <div className="trending-video-hero-wrap">
              <Hero
                item={this.state.trendingMovies[this.state.currentTrendingIndex] || this.state.trendingMovies[0]}
                ctaLabel="View details"
                onCtaClick={this.onMovieClick}
                trailerKey={this.state.currentTrendingTrailerKey}
              />
              <div className="hero-dots" role="tablist" aria-label="Trending slides">
                {this.state.trendingMovies.slice(0, 10).map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    role="tab"
                    tabIndex={0}
                    aria-selected={index === this.state.currentTrendingIndex}
                    aria-label={`Slide ${index + 1}, ${this.state.trendingMovies[index]?.title || ''}`}
                    className={`hero-dot ${index === this.state.currentTrendingIndex ? 'hero-dot--active' : ''}`}
                    onClick={() => this.setState({ currentTrendingIndex: index })}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <main className="main-container" style={{ padding: 'var(--space-24) var(--space-16)', maxWidth: '1800px', margin: '0 auto' }} role="main">
          <div id="main-content">
          {this.state.loadingMovies ? (
            <Dimmer active inverted>
              <Loader size="large">Loading Movies...</Loader>
            </Dimmer>
          ) : (
            <>
              <Rail
                title="Available movies"
                items={this.state.candidatesShow.slice(0, this.state.displayLimit)}
                onItemSelect={this.onMovieClick}
                showAddButton
                onAdd={this.onCandidateClick}
                getSelected={(item) => this.state.selected.some(m => m.id === item.id)}
                onWatchTrailer={this.openTrailerForMovie}
                loadMore={this.state.candidatesShow.length > this.state.displayLimit ? this.loadMore : null}
                showingCount={Math.min(this.state.candidatesShow.length, this.state.displayLimit)}
                totalCount={this.state.candidatesShow.length}
              />
              <Rail
                title="Selected movies"
                items={this.state.selected}
                onItemSelect={this.onMovieClick}
                showAddButton
                onAdd={this.onSelectedClick}
                getSelected={() => true}
                onWatchTrailer={this.openTrailerForMovie}
              />
              <Rail
                title="Recommended for you"
                items={this.state.recommended}
                onItemSelect={this.onMovieClick}
                onWatchTrailer={this.openTrailerForMovie}
              />
            </>
          )}
          </div>
        </main>
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
