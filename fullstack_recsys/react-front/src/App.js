import React from 'react';
// import logo from './logo.svg';
import './App.css';
import config from './config';
import Toast from './components/Toast'
import Login from './components/Login'
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
      trendingMovies: [],
      currentTrendingIndex: 0,
      isAuthenticated: false,
      user: null,
      showLogin: false
    }
    this.loadMovieDB = this.loadMovieDB.bind(this);
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
    this.handleLogin = this.handleLogin.bind(this)
    this.handleLogout = this.handleLogout.bind(this)
    this.showLoginPage = this.showLoginPage.bind(this)
    this.toastRef = React.createRef();
    this.trendingInterval = null;
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.setState({
          isAuthenticated: true,
          user: user,
          showLogin: false
        });
      } catch (e) {
        // Invalid user data, clear it
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      }
    } else {
      // Show login page if not authenticated
      this.setState({ showLogin: true });
    }
    
    // Load movies after component is mounted (only if authenticated)
    if (this.state.isAuthenticated || !token) {
      this.loadMovieDB();
    }
    
    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
    // Start auto-sliding trending movies
    this.startTrendingAutoSlide();
  }

  componentWillUnmount() {
    this._isMounted = false;
    // Clean up keyboard listeners
    document.removeEventListener('keydown', this.handleKeyDown);
    // Clear trending auto-slide interval
    if (this.trendingInterval) {
      clearInterval(this.trendingInterval);
      this.trendingInterval = null;
    }
  }

  startTrendingAutoSlide = () => {
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

  loadTrendingMovies = (allMovies) => {
    const trendingUrl = `${config.API_URL}/api/trending`;
    
    fetch(trendingUrl, {
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
        const trendingMovies = data.result || [];
        if (trendingMovies.length > 0) {
          console.log(`[loadTrendingMovies] Loaded ${trendingMovies.length} trending movies from API`);
          if (this._isMounted) {
            this.setState({ trendingMovies: trendingMovies });
          }
        } else {
          // Fallback to date-based sorting
          this.setTrendingFromMovies(allMovies);
        }
      })
      .catch(error => {
        console.warn('[loadTrendingMovies] Error loading trending movies, using date-based fallback:', error);
        // Fallback to date-based sorting
        this.setTrendingFromMovies(allMovies);
      });
  }

  setTrendingFromMovies = (movies) => {
    const trendingMovies = movies
      .filter(m => m && m.poster && m.poster !== 'null' && m.poster !== 'None' && !m.poster.includes('via.placeholder.com'))
      .sort((a, b) => {
        // Sort by date (most recent first)
        const dateA = a.date ? new Date(a.date).getTime() : 0;
        const dateB = b.date ? new Date(b.date).getTime() : 0;
        return dateB - dateA; // Descending order (newest first)
      })
      .slice(0, 10); // Top 10 most recent movies with posters
    
    console.log(`[setTrendingFromMovies] Fallback trending movies selected: ${trendingMovies.length}`);
    this.setState({ trendingMovies: trendingMovies });
  }

  loadMovieDB(){
    // Only load if not already loaded and component is mounted
    if (!this._isMounted) {
      console.warn('[loadMovieDB] Component not mounted, skipping load');
      return;
    }
    
    this.setState({ loadingMovies: true });
    const apiUrl = `${config.API_URL}/init`;
    
    console.log(`[loadMovieDB] Attempting to load movies from: ${apiUrl}`);
    console.log(`[loadMovieDB] API_URL config:`, config.API_URL);
    
    // Add timeout to fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal
    })
      .then(response => {
        console.log(`[loadMovieDB] Response status: ${response.status}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log(`[loadMovieDB] Received data:`, data);
        console.log(`[loadMovieDB] Data keys:`, Object.keys(data));
        
        // Ensure data.result is an array
        let movies = [];
        if (Array.isArray(data.result)) {
          movies = data.result;
        } else if (Array.isArray(data)) {
          movies = data;
        } else if (data && data.result) {
          console.warn('[loadMovieDB] data.result is not an array:', typeof data.result);
          movies = [];
        }
        
        console.log(`[loadMovieDB] Successfully loaded ${movies.length} movies`);
        if (movies.length > 0) {
          console.log('[loadMovieDB] Sample movie:', movies[0]);
          // Log poster info for debugging
          const moviesWithPosters = movies.filter(m => m.poster && m.poster !== 'null' && m.poster !== null);
          console.log(`[loadMovieDB] Movies with posters: ${moviesWithPosters.length} out of ${movies.length}`);
          if (moviesWithPosters.length > 0) {
            console.log('[loadMovieDB] Sample poster URL:', moviesWithPosters[0].poster);
          }
        }
        
        if (movies.length === 0) {
          console.warn('[loadMovieDB] No movies received from API');
          if (this.toastRef.current) {
            this.toastRef.current.show('No movies found in database. Please check the backend server is running on port 5555.', 'warning');
          }
        }
        
        // Load trending movies (will use API if available, otherwise date-based fallback)
        this.loadTrendingMovies(movies);
        
        this.setState((prevState) => ({
          fullMovies: movies,
          candidates: movies,
          candidatesShow: movies,
          selected: prevState.selected,
          recommended: prevState.recommended,
          loadingMovies: false
        }));
        
        console.log(`[loadMovieDB] State updated. candidatesShow.length: ${movies.length}`);
      })
      .catch((error) => {
        clearTimeout(timeoutId); // Clear timeout on error
        console.error('[loadMovieDB] Error loading movies:', error);
        console.error('[loadMovieDB] Error details:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        });
        if (this._isMounted) {
          this.setState({ loadingMovies: false });
        }
        if (this.toastRef.current) {
          const errorMessage = error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')
            ? `Cannot connect to backend at ${config.API_URL}. Please ensure the backend server is running on port 5555.`
            : `Failed to load movies: ${error.message || 'Unknown error'}. Please check the backend server.`;
          this.toastRef.current.show(errorMessage, 'error');
        }
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
        candidatesShow: prevState.candidates
      }))
    }
    else {
      const re = new RegExp(_.escapeRegExp(query), "i");
      const isMatch = type === "title" 
        ? result => result && result.title && typeof result.title === 'string' && re.test(result.title) 
        : result => result && result.genre && typeof result.genre === 'string' && re.test(result.genre);
      // Filter candidates based on search - search through ALL candidates, exclude selected ones
      const selectedIds = new Set(this.state.selected.map(m => m?.id).filter(id => id !== undefined && id !== null));
      const results = this.state.candidates.filter(movie => {
        // Only show movies that match search AND are not currently selected
        const matchesSearch = isMatch(movie);
        const notSelected = movie && movie.id !== undefined && movie.id !== null && !selectedIds.has(movie.id);
        return matchesSearch && notSelected;
      });
      this.setState((prevState) => ({
        ...prevState,
        candidatesShow: results
      }))
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
    // Validate movieId
    if (!movieId || (typeof movieId !== 'number' && typeof movieId !== 'string')) {
      console.warn('[fetchMovieDetails] Invalid movieId:', movieId);
      this.setState({ loadingMovieDetails: false });
      return;
    }
    
    // Only update state if component is still mounted
    if (!this._isMounted) {
      console.warn('[fetchMovieDetails] Component not mounted, skipping');
      return;
    }
    
    this.setState({ loadingMovieDetails: true });
    
    try {
      const apiUrl = `${config.API_URL}/api/movies/${movieId}/details`;
      if (process.env.NODE_ENV === 'development') {
      console.log(`Fetching movie details from: ${apiUrl}`);
      }
      
      // Add timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!this._isMounted) {
        console.warn('[fetchMovieDetails] Component unmounted during fetch');
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        if (this._isMounted) {
          this.setState({
            selectedMovieDetails: data.result || null,
            loadingMovieDetails: false
          });
        }
      } else {
        // If enhanced details fail, just use basic movie info (graceful degradation)
        console.warn(`Failed to fetch movie details: HTTP ${response.status}`);
        if (this._isMounted) {
          this.setState({
            loadingMovieDetails: false
            // Keep selectedMovieDetails as null, will use basic movie info
          });
        }
      }
    } catch (error) {
      // Only update state if component is still mounted
      if (!this._isMounted) {
        console.warn('[fetchMovieDetails] Component unmounted, skipping error handling');
        return;
      }
      
      console.error('Error fetching movie details:', error);
      this.setState({
        loadingMovieDetails: false
        // Graceful degradation: will use basic movie info from selectedMovie
      });
      
      // Only show error for critical failures, not for missing enhanced details
      if (error.name !== 'AbortError' && this.toastRef.current) {
        const errorMessage = error.message?.includes('Failed to fetch') || error.message?.includes('ERR_CONNECTION_REFUSED')
          ? `Cannot connect to backend. Enhanced details unavailable.`
          : `Enhanced movie details unavailable.`;
        this.toastRef.current.show(errorMessage, 'warning'); // Use warning, not error, since basic info still works
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

  handleLogin = (user, token) => {
    this.setState({
      isAuthenticated: true,
      user: user,
      showLogin: false
    });
    // Load movies after login
    this.loadMovieDB();
  }

  handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    this.setState({
      isAuthenticated: false,
      user: null,
      showLogin: true,
      selected: [],
      recommended: []
    });
    if (this.toastRef.current) {
      this.toastRef.current.show('Logged out successfully', 'info');
    }
  }

  showLoginPage = () => {
    this.setState({ showLogin: true });
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
    const headers = { 'Content-Type': 'application/json' };
    // Add auth token if user is logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const requestOptions = {
      method: 'POST',
      headers: headers,
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
    
    // Use async fetch with retry logic for better reliability
    const fetchWithRetry = async (url, options, retries = 2) => {
      for (let i = 0; i <= retries; i++) {
        try {
          const response = await fetch(url, options);
          if (!response.ok) {
            // Don't retry on client errors (4xx), only server errors (5xx) and network errors
            if (response.status >= 500 && i < retries) {
              // Wait before retry for server errors (exponential backoff)
              await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
              continue;
            }
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          return response;
        } catch (error) {
          if (i === retries) throw error;
          // Wait before retry (exponential backoff) for network errors
          await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    };
    
    fetchWithRetry(recommendUrl, requestOptions)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        // Only update state if component is still mounted
        if (!this._isMounted) {
          console.warn('[onRecommendClick] Component unmounted, skipping state update');
          return;
        }
        
        if (process.env.NODE_ENV === 'development') {
        console.log('=== Recommendation API Response ===');
        console.log('Full response:', data);
        }
        if (process.env.NODE_ENV === 'development') {
        console.log('Response keys:', Object.keys(data));
        }
        
        // Check for error in response
        if (data.error) {
          const errorMessages = {
            'API_TIMEOUT': 'Recommendation service is taking too long. Please try again in a moment.',
            'API_CONNECTION_ERROR': 'Cannot connect to recommendation service. The service may be starting up.',
            'API_ERROR': 'Recommendation service is unavailable. Please try again later.',
            'NO_RECOMMENDATIONS': 'No recommendations found for the selected movies. Try selecting different movies.',
            'MOVIES_NOT_FOUND': 'Recommended movies not found in database.',
            'INVALID_RESPONSE': 'Invalid response from recommendation service.',
            'INTERNAL_ERROR': 'An internal error occurred. Please try again.'
          };
          
          const userMessage = errorMessages[data.error] || data.message || 'An error occurred while getting recommendations.';
          
          if (this.toastRef.current) {
            this.toastRef.current.show(userMessage, 'error');
          }
          
          this.setState({ loadingRecommendations: false });
          return;
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
        
        // Ensure recommendations have required fields (id, title at minimum)
        const validRecommendations = recommendations.filter(rec => 
          rec && 
          rec.id !== undefined && 
          rec.id !== null && 
          rec.title
        );
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`Valid recommendations: ${validRecommendations.length} out of ${recommendations.length}`);
        }
        
        // Use requestAnimationFrame for smooth UI updates
        requestAnimationFrame(() => {
          if (this._isMounted) {
            this.setState((prevState) => ({
              fullMovies: prevState.fullMovies,
              candidates: prevState.candidates,
              selected: prevState.selected,
              recommended: validRecommendations,
              loadingRecommendations: false
            }));
          }
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
    // Debug logging - always log to help diagnose issues
    const filteredMovies = this.state.candidatesShow?.filter(movie => movie && movie.id !== undefined && movie.id !== null && movie.title) || [];
    console.log('[render] State:', {
      fullMovies: this.state.fullMovies?.length || 0,
      candidates: this.state.candidates?.length || 0,
      candidatesShow: this.state.candidatesShow?.length || 0,
      filteredMovies: filteredMovies.length,
      loadingMovies: this.state.loadingMovies,
      firstCandidate: this.state.candidatesShow?.[0],
      firstFiltered: filteredMovies[0]
    });
    
    // Log if there's a mismatch
    if (this.state.candidatesShow?.length > 0 && filteredMovies.length === 0) {
      console.error('[render] ERROR: candidatesShow has items but filter removes all!', {
        sampleMovie: this.state.candidatesShow[0],
        sampleHasId: this.state.candidatesShow[0]?.id !== undefined,
        sampleHasTitle: !!this.state.candidatesShow[0]?.title
      });
    }
    
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
              {this.state.isAuthenticated && this.state.user && (
                <div style={{ marginLeft: '15px', display: 'flex', alignItems: 'center', gap: '10px', borderLeft: '1px solid rgba(255,255,255,0.3)', paddingLeft: '15px' }}>
                  <span style={{ color: '#fff', fontWeight: '500' }}>👤 {this.state.user.username}</span>
                  <Button 
                    size="small" 
                    onClick={this.handleLogout}
                    style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }}
                  >
                    Logout
                  </Button>
                </div>
              )}
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
              ref={(ref) => this.searchDropdownRef = ref}
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

        {/* Main Content - Rotten Tomatoes Style Layout */}
        <Container className="main-container" style={{ padding: '40px 20px', maxWidth: '1800px' }}>
          {this.state.loadingMovies ? (
            <Dimmer active inverted>
              <Loader size="large">Loading Movies...</Loader>
            </Dimmer>
          ) : (
            <div className="rottentomatoes-layout">
              {/* Hero Section: Trending Now - Auto-Sliding Carousel */}
              {this.state.trendingMovies.length > 0 && (
              <div className="trending-hero-section">
                <div className="trending-header">
                  <div>
                    <h1 className="trending-title">
                      <Icon name="fire" color="red" />
                      Trending Now
                    </h1>
                    <p className="trending-subtitle">Discover what's hot right now</p>
                  </div>
                  <div className="trending-indicators">
                    {this.state.trendingMovies.map((_, index) => (
                      <div
                        key={index}
                        className={`trending-dot ${index === this.state.currentTrendingIndex ? 'active' : ''}`}
                        onClick={() => this.setState({ currentTrendingIndex: index })}
                      />
                    ))}
                  </div>
                </div>
                <div className="trending-carousel-container">
                  <div 
                    className="trending-carousel"
                    style={{
                      transform: `translateX(-${this.state.currentTrendingIndex * 100}%)`
                    }}
                  >
                    {this.state.trendingMovies.map((movie, index) => {
                      const hasValidPoster = movie.poster && 
                        typeof movie.poster === 'string' &&
                        movie.poster.trim().length > 0 &&
                        movie.poster !== 'null' &&
                        movie.poster !== 'None' &&
                        !movie.poster.includes('via.placeholder.com');
                      
                      return (
                        <div key={movie.id || index} className="trending-slide">
                          <div className="trending-poster" onClick={() => this.onMovieClick(movie)}>
                            {hasValidPoster ? (
                              <img 
                                src={movie.poster} 
                                alt={movie.title || 'Movie poster'}
                                loading="eager"
                                onError={(e) => {
                                  try {
                                    const img = e.target;
                                    img.style.display = 'none';
                                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E';
                                    let placeholder = img.nextElementSibling;
                                    if (!placeholder || !placeholder.classList?.contains('trending-placeholder')) {
                                      placeholder = img.parentElement?.querySelector('.trending-placeholder');
                                    }
                                    if (placeholder) {
                                      placeholder.style.display = 'flex';
                                    }
                                  } catch (error) {
                                    console.error('Error handling image load failure:', error);
                                  }
                                }}
                              />
                            ) : null}
                            <div 
                              className="trending-placeholder" 
                              style={{ display: hasValidPoster ? 'none' : 'flex' }}
                            >
                              <Icon name="film" size="massive" />
                            </div>
                            <div className="trending-overlay">
                              <div className="trending-content">
                                <h2 className="trending-movie-title">{movie.title || 'Unknown Title'}</h2>
                                <p className="trending-movie-info">{movie.genre || 'Unknown'} • {movie.date || 'Unknown'}</p>
                                <div className="trending-actions">
                                  <Button 
                                    icon 
                                    labelPosition='left' 
                                    className="trending-add-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      this.onCandidateClick(movie);
                                    }}
                                  >
                                    <Icon name="plus" />
                                    Add to List
                                  </Button>
                                  <Button 
                                    icon 
                                    labelPosition='left' 
                                    className="trending-info-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      this.onMovieClick(movie);
                                    }}
                                  >
                                    <Icon name="info circle" />
                                    Details
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              )}

              {/* Section 1: Available Movies - Rotten Tomatoes Style */}
              <div className="rt-section">
                <div className="rt-section-header">
                  <div>
                    <h2 className="rt-section-title">Available Movies</h2>
                    <p className="rt-section-subtitle">{this.state.candidatesShow.length} movies available</p>
                  </div>
                </div>
                {this.state.candidatesShow.length > 0 ? (
                  <div className="movies-carousel">
                      {this.state.candidatesShow
                        .filter(movie => movie && movie.id !== undefined && movie.id !== null && movie.title)
                        .map(movie => {
                          const isSelected = this.state.selected.some(m => m.id === movie.id);
                          // Check if poster URL is valid (not a placeholder that will fail)
                          // Allow any valid URL, only filter out known problematic placeholders
                          const hasValidPoster = movie.poster && 
                            typeof movie.poster === 'string' &&
                            movie.poster.trim().length > 0 &&
                            movie.poster !== 'null' &&
                            movie.poster !== 'None' &&
                            !movie.poster.includes('via.placeholder.com');
                          
                          return (
                            <div key={`movie-${movie.id}`} className={`movie-card-carousel ${isSelected ? 'selected' : ''}`}>
                              <div className="movie-card-modern">
                                <div className="movie-poster-modern" onClick={() => this.onMovieClick(movie)}>
                                  {hasValidPoster ? (
                                    <img 
                                      src={movie.poster} 
                                      alt={movie.title || 'Movie poster'}
                                      loading="lazy"
                                      onError={(e) => {
                                        // Hide broken image and show placeholder instead
                                        try {
                                          const img = e.target;
                                          img.style.display = 'none';
                                          // Prevent further retry attempts
                                          img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E';
                                          // Find placeholder - try nextElementSibling first, then parent querySelector
                                          let placeholder = img.nextElementSibling;
                                          if (!placeholder || !placeholder.classList?.contains('poster-placeholder-modern')) {
                                            placeholder = img.parentElement?.querySelector('.poster-placeholder-modern');
                                          }
                                          if (placeholder) {
                                            placeholder.style.display = 'flex';
                                          }
                                        } catch (error) {
                                          console.error('Error handling image load failure:', error);
                                        }
                                      }}
                                    />
                                  ) : null}
                                  <div 
                                    className="poster-placeholder-modern" 
                                    style={{ display: hasValidPoster ? 'none' : 'flex' }}
                                  >
                                    <Icon name="film" size="big" />
                                  </div>
                                  {/* Always visible add button in top-right */}
                                  <div 
                                    className="add-button-badge"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      this.onCandidateClick(movie);
                                    }}
                                    title={isSelected ? "Remove from selection" : "Add to selection"}
                                  >
                                    <Icon name={isSelected ? "check circle" : "plus circle"} size="large" />
                                  </div>
                                  {/* Overlay with button on hover */}
                                  <div className="movie-overlay">
                                    <Button 
                                      icon 
                                      circular 
                                      size="large"
                                      className={isSelected ? "remove-btn" : "add-btn"}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        this.onCandidateClick(movie);
                                      }}
                                      title={isSelected ? "Remove from selection" : "Add to selection"}
                                    >
                                      <Icon name={isSelected ? "check" : "plus"} />
                                    </Button>
                                  </div>
                                </div>
                                <div className="movie-info-modern">
                                  <h3 onClick={() => this.onMovieClick(movie)}>{movie.title || 'Unknown Title'}</h3>
                                  <p>{movie.genre || 'Unknown'} • {movie.date || 'Unknown'}</p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                  </div>
                ) : (
                  <Message info className="empty-message-modern">
                    <Message.Header>No movies found</Message.Header>
                    <p>Try adjusting your search criteria or click the logo to refresh.</p>
                  </Message>
                )}
              </div>

              {/* Section 2: Selected Movies - Rotten Tomatoes Style */}
              {this.state.selected.length > 0 && (
              <div className="rt-section">
                <div className="rt-section-header">
                  <div>
                    <h2 className="rt-section-title">Your Selected Movies</h2>
                    <p className="rt-section-subtitle">{this.state.selected.length} movie{this.state.selected.length !== 1 ? 's' : ''} selected</p>
                  </div>
                </div>
                <div className="movies-carousel">
                      {this.state.selected.map(movie => {
                        const hasValidPoster = movie.poster && 
                          typeof movie.poster === 'string' &&
                          movie.poster.trim().length > 0 &&
                          movie.poster !== 'null' &&
                          movie.poster !== 'None' &&
                          !movie.poster.includes('via.placeholder.com');
                        
                        return (
                          <div key={movie.id} className="movie-card-carousel">
                            <div className="movie-card-modern">
                              <div className="movie-poster-modern" onClick={() => this.onMovieClick(movie)}>
                                {hasValidPoster ? (
                                  <img 
                                    src={movie.poster} 
                                    alt={movie.title}
                                    loading="lazy"
                                    onError={(e) => {
                                      try {
                                        const img = e.target;
                                        img.style.display = 'none';
                                        img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E';
                                        let placeholder = img.nextElementSibling;
                                        if (!placeholder || !placeholder.classList?.contains('poster-placeholder-modern')) {
                                          placeholder = img.parentElement?.querySelector('.poster-placeholder-modern');
                                        }
                                        if (placeholder) {
                                          placeholder.style.display = 'flex';
                                        }
                                      } catch (error) {
                                        console.error('Error handling image load failure:', error);
                                      }
                                    }}
                                  />
                                ) : null}
                                <div 
                                  className="poster-placeholder-modern" 
                                  style={{ display: hasValidPoster ? 'none' : 'flex' }}
                                >
                                  <Icon name="film" />
                                </div>
                                <div className="movie-overlay">
                                  <Button 
                                    icon 
                                    circular 
                                    size="small"
                                    className="remove-btn"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      this.onSelectedClick(movie);
                                    }}
                                  >
                                    <Icon name="times" />
                                  </Button>
                                </div>
                              </div>
                              <div className="movie-info-modern">
                                <h4 onClick={() => this.onMovieClick(movie)}>{movie.title}</h4>
                                <p>{movie.genre}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                </div>
              </div>
              )}

              {/* Section 3: Recommendations - Rotten Tomatoes Style */}
              {this.state.recommended.length > 0 && (
              <div className="rt-section">
                <div className="rt-section-header">
                  <div>
                    <h2 className="rt-section-title">Recommendations</h2>
                    <p className="rt-section-subtitle">
                      {this.state.recommended.length} recommendation{this.state.recommended.length !== 1 ? 's' : ''} using {this.state.modelKey}
                    </p>
                  </div>
                </div>
                {this.state.loadingRecommendations ? (
                  <Dimmer active inverted>
                    <Loader size="large">Loading Recommendations...</Loader>
                  </Dimmer>
                ) : (
                  <div className="movies-carousel">
                    {this.state.recommended.map(movie => {
                      const hasValidPoster = movie.poster && 
                        typeof movie.poster === 'string' &&
                        movie.poster.trim().length > 0 &&
                        movie.poster !== 'null' &&
                        movie.poster !== 'None' &&
                        !movie.poster.includes('via.placeholder.com');
                      
                      return (
                        <div key={movie.id} className="movie-card-carousel recommended">
                          <div className="movie-card-modern">
                            <div className="movie-poster-modern" onClick={() => this.onMovieClick(movie)}>
                              {hasValidPoster ? (
                                <img 
                                  src={movie.poster} 
                                  alt={movie.title}
                                  loading="lazy"
                                  onError={(e) => {
                                    try {
                                      const img = e.target;
                                      img.style.display = 'none';
                                      img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg"%3E%3C/svg%3E';
                                      let placeholder = img.nextElementSibling;
                                      if (!placeholder || !placeholder.classList?.contains('poster-placeholder-modern')) {
                                        placeholder = img.parentElement?.querySelector('.poster-placeholder-modern');
                                      }
                                      if (placeholder) {
                                        placeholder.style.display = 'flex';
                                      }
                                    } catch (error) {
                                      console.error('Error handling image load failure:', error);
                                    }
                                  }}
                                />
                              ) : null}
                              <div 
                                className="poster-placeholder-modern" 
                                style={{ display: hasValidPoster ? 'none' : 'flex' }}
                              >
                                <Icon name="film" />
                              </div>
                              <div className="recommendation-badge">
                                <Icon name="fire" color="red" />
                              </div>
                            </div>
                            <div className="movie-info-modern">
                              <h4 onClick={() => this.onMovieClick(movie)}>{movie.title}</h4>
                              <p>{movie.genre} • {movie.date}</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              )}

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
