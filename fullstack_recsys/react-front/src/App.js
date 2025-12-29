import React from 'react';
// import logo from './logo.svg';
import './App.css';
import CandidateTable from './components/CandidateTable'
import ContextTable from './components/ContextTable'
import RecommendTable from './components/RecommendTable'
import SearchForm from './components/SearchForm'
import Toast from './components/Toast'
import MovieDetailEnhanced from './components/MovieDetailEnhanced'
import MovieGrid from './components/MovieGrid'
import { Container, Icon, Button, Grid, Modal, Header, Label, Loader, Dimmer, Segment, Dropdown, Message, Input } from "semantic-ui-react"
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
      loadingMovieDetails: false
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
    this.toastRef = React.createRef();

    this.loadMovieDB();
  }

  componentDidMount() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', this.handleKeyDown);
  }

  componentWillUnmount() {
    // Clean up keyboard listeners
    document.removeEventListener('keydown', this.handleKeyDown);
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
    fetch('/init', {method: 'GET'})
      .then(response => response.json())
      .then(data => {
        this.setState((prevState) => ({
          fullMovies: data.result,
          candidates: data.result,
          candidatesShow: data.result,
          selected: prevState.selected,
          recommended: prevState.recommended,
          loadingMovies: false
        }));
      })
      .catch(() => {
        this.setState({ loadingMovies: false });
        if (this.toastRef.current) {
          this.toastRef.current.show('Failed to load movies. Please refresh the page.', 'error');
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
    // check if movie already exists in candidates
    let alreadyExists = this.state.selected.includes(movie)
    if (!alreadyExists) {
      let movieIndex = this.state.candidatesShow.indexOf(movie);
      this.setState((prevState) => ({
        ...prevState,
        candidatesShow: [...prevState.candidatesShow.slice(0, movieIndex), ...prevState.candidatesShow.slice(movieIndex+1, prevState.candidatesShow.length)],
        selected: [...prevState.selected, movie],
      }))
    }
  }

  onSelectedClick(movie){
    let alreadyExists = this.state.selected.includes(movie)
    if (alreadyExists) {
      let movieIndex = this.state.selected.indexOf(movie);
      console.log(movieIndex);
      this.setState((prevState) => ({
          ...prevState,
          candidatesShow: [...prevState.candidatesShow, movie],
          selected: [...prevState.selected.slice(0, movieIndex), ...prevState.selected.slice(movieIndex+1, prevState.selected.length)],
        }))
    }
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
      const isMatch = type === "title" ? result => re.test(result.title) : result => re.test(result.genre);
      const results = this.state.candidates.filter(isMatch).filter(data => this.state.candidatesShow.includes(data))
      this.setState((prevState) => ({
        ...prevState,
        candidatesShow: results
      }))
    }
  }
  onModelSelectClick(e, data){
    this.setState((prevState) => ({
      ...prevState,
      modelKey: data.value
    }))
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
    try {
      const response = await fetch(`/api/movies/${movieId}/details`)
      if (response.ok) {
        const data = await response.json()
        this.setState({
          selectedMovieDetails: data.result,
          loadingMovieDetails: false
        })
      } else {
        // If enhanced details fail, just use basic movie info
        this.setState({
          loadingMovieDetails: false
        })
      }
    } catch (error) {
      console.error('Error fetching movie details:', error)
      this.setState({
        loadingMovieDetails: false
      })
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
    this.setState({ loadingRecommendations: true });
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
    fetch('/recommend', requestOptions)
      .then(response => response.json())
      .then(data => {
        this.setState((prevState) => ({
          fullMovies: prevState.fullMovies,
          candidates: prevState.candidates,
          selected: prevState.selected,
          recommended: data.result,
          loadingRecommendations: false
        }));
        if (this.toastRef.current && data.result && data.result.length > 0) {
          this.toastRef.current.show(`Found ${data.result.length} recommendations using ${this.state.modelKey}!`, 'success');
        }
      })
      .catch(() => {
        if (this.toastRef.current) {
          this.toastRef.current.show('Error fetching recommendations. Please try again.', 'error');
        }
        this.setState({ loadingRecommendations: false });
      })
  }

  render(){
    return (
      <div className="App">
        <Toast ref={this.toastRef} />
        <header className="modern-header">
          <div className="header-left">
            <div className="header-logo" onClick={this.onRefreshClick}>
              <Icon name='film' className="logo-icon" />
            </div>
          </div>
          <div className="header-center">
            <h1 className="app-title">Movie Recommender System</h1>
          </div>
          <div className="header-right">
            <div className="recommendation-controls">
              <Dropdown
                selection
                compact
                options={[
                  { key: 'ease', text: 'EASE', value: 'EASE' },
                  { key: 'itemknn', text: 'ItemKNN', value: 'ItemKNN' },
                  { key: 'neuralmf', text: 'NeuralMF', value: 'NeuralMF' },
                  { key: 'deepfm', text: 'DeepFM', value: 'DeepFM' },
                ]}
                value={this.state.modelKey}
                onChange={(e, data) => this.onModelSelectClick(e, data)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  color: '#fff',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '8px'
                }}
              />
              <Button 
                icon 
                labelPosition='left' 
                onClick={this.onRecommendClick}
                className="primary"
                loading={this.state.loadingRecommendations}
                disabled={this.state.selected.length < 1 || this.state.loadingRecommendations}
              >
                <Icon name='fire' />
                RECOMMEND
              </Button>
            </div>
            <div className="author-info">
              <span>David Omokagbor</span>
              <a href='https://github.com/DavidOmokagbor1' target="_blank" rel="noopener noreferrer">
                <Icon name='github' />
              </a>
              <a href='https://github.com/DavidOmokagbor1/MOvie-Recommendation' target="_blank" rel="noopener noreferrer">
                <Icon name='wordpress' />
              </a>
            </div>
          </div>
        </header>
        {/* Search Bar */}
        <div className="search-container">
          <div className="search-wrapper">
            <Input
              type='text'
              placeholder='Search movies...'
              className="search-input"
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
            >
              <Icon name='search' />
              Search
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <Container className="main-container">
          {this.state.loadingMovies ? (
            <Dimmer active inverted>
              <Loader size="large">Loading Movies...</Loader>
            </Dimmer>
          ) : (
            <>
              <div className="content-section fade-in">
                <MovieGrid
                  movies={this.state.candidatesShow}
                  title="Available Movies"
                  icon="film"
                  onAdd={this.onCandidateClick}
                  onMovieClick={this.onMovieClick}
                  selectedMovies={this.state.selected}
                  emptyMessage="No movies found. Try adjusting your search criteria."
                />
              </div>

              {this.state.selected.length > 0 && (
                <div className="content-section fade-in">
                  <MovieGrid
                    movies={this.state.selected}
                    title="Selected Movies"
                    icon="heart"
                    onAdd={this.onSelectedClick}
                    onMovieClick={this.onMovieClick}
                    selectedMovies={this.state.selected}
                    emptyMessage="No movies selected"
                  />
                </div>
              )}
            </>
          )}
        </Container>
  
        {/* Recommendations */}
        {this.state.recommended.length > 0 && (
          <div className="recommendations-container fade-in">
            <Header as="h2" className="recommendations-header">
              <Icon name="fire" />
              Recommendations
            </Header>
            <div className="content-section">
              {this.state.loadingRecommendations ? (
                <Dimmer active inverted>
                  <Loader size="large">Loading Recommendations...</Loader>
                </Dimmer>
              ) : (
                <MovieGrid
                  movies={this.state.recommended}
                  title=""
                  onAdd={this.onCandidateClick}
                  onMovieClick={this.onMovieClick}
                  selectedMovies={this.state.selected}
                  emptyMessage="No recommendations available"
                />
              )}
            </div>
          </div>
        )}
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
