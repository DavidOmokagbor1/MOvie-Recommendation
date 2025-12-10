import React from 'react';
// import logo from './logo.svg';
import './App.css';
import CandidateTable from './components/CandidateTable'
import ContextTable from './components/ContextTable'
import RecommendTable from './components/RecommendTable'
import SearchForm from './components/SearchForm'
import { Container, Icon, Button, Grid, Select, Modal, Header, Label, Loader, Dimmer, Segment, Dropdown } from "semantic-ui-react"
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
      loadingMovies: true,
      loadingRecommendations: false
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

    this.loadMovieDB();
  }

  loadMovieDB(){
    this.setState({ loadingMovies: true });
    fetch('/init', {method: 'GET'}).then(response =>
      response.json().then(data => {this.setState((prevState) => ({
        fullMovies: data.result,
        candidates: data.result,
        candidatesShow: data.result,
        selected: prevState.selected,
        recommended: prevState.recommended,
        loadingMovies: false
      }))}))
      .catch(() => this.setState({ loadingMovies: false }))
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
      modalOpen: true
    })
  }

  closeModal(){
    this.setState({
      modalOpen: false,
      selectedMovie: null
    })
  }
  
  onRecommendClick(){
    if (this.state.selected.length < 1){
      alert('Please select at least one movie to get recommendations!');
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
      .then(data => {this.setState((prevState) => ({
        fullMovies: prevState.fullMovies,
        candidates: prevState.candidates,
        selected: prevState.selected,
        recommended: data.result,
        loadingRecommendations: false
      }))})
      .catch(() => {
        alert('Error fetching recommendations. Please try again.');
        this.setState({ loadingRecommendations: false });
      })
  }

  render(){
    return (
      <div className="App">
        <header className="modern-header">
          <div className="header-left">
            <Icon link onClick={this.onRefreshClick} name='home' size="large" />
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
                ]}
                value={this.state.modelKey}
                onChange={(e, data) => this.onModelSelectClick(e, data)}
                style={{marginRight: '10px'}}
              />
              <Button 
                icon 
                labelPosition='left' 
                onClick={this.onRecommendClick}
                color='red'
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
        {/* body */}
        <Container className="main-container">
          <Grid>
            <Grid.Row columns={1}>
              <Grid.Column>
                <SearchForm 
                  onSearchChange={this.onSearchChange}
                  onSearchClick={this.onSearchClick}
                  onSelectChange={this.onSelectChange}
                  searchKey={this.state.searchKey}>
                </SearchForm>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row columns={2}>
              <Grid.Column>
                <Segment className="table-container">
                  <Header as="h3" className="table-header">
                    <Icon name="list" />
                    Available Movies
                  </Header>
                  {this.state.loadingMovies ? (
                    <Dimmer active inverted>
                      <Loader size="large">Loading Movies...</Loader>
                    </Dimmer>
                  ) : (
                    <CandidateTable 
                      fullMovies={this.state.fullMovies} 
                      candidateMovies={this.state.candidatesShow}
                      selectedMovies={this.state.selected}
                      onEvent={this.onCandidateClick}
                      onMovieClick={this.onMovieClick}
                      height={600}>
                    </CandidateTable>
                  )}
                </Segment>
              </Grid.Column>
              <Grid.Column>
                <Segment className="table-container">
                  <Header as="h3" className="table-header">
                    <Icon name="heart" />
                    Selected Movies ({this.state.selected.length})
                  </Header>
                  <ContextTable
                    fullMovies={this.state.fullMovies} 
                    contextMovies={this.state.selected}
                    onEvent={this.onSelectedClick}
                    onMovieClick={this.onMovieClick}
                    height={600}>
                  </ContextTable>
                </Segment>
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </Container>
  
        {/* Recommendation table */}
        {this.state.recommended.length > 0 && (
          <Container className="recommendations-container">
            <Segment className="table-container">
              <Header as="h2" className="recommendations-header">
                <Icon name="star" color="yellow" />
                Recommendations
                {this.state.loadingRecommendations && (
                  <Loader active inline size="small" style={{marginLeft: '10px'}} />
                )}
              </Header>
              <RecommendTable
                fullMovies={this.state.fullMovies} 
                recommendMovies={this.state.recommended}
                onMovieClick={this.onMovieClick}
                height={500}>
              </RecommendTable>
            </Segment>
          </Container>
        )}
        <footer className="modern-footer">
          <p>&copy; 2024 Movie Recommender System. Built with React & Flask.</p>
        </footer>

        {/* Movie Details Modal */}
        <Modal
          open={this.state.modalOpen}
          onClose={this.closeModal}
          closeIcon
          size="small"
        >
          <Header icon="film" content="Movie Details" />
          <Modal.Content>
            {this.state.selectedMovie && (
              <div>
                <Header as="h2" style={{marginBottom: '20px'}}>
                  {this.state.selectedMovie.title}
                </Header>
                <div style={{marginBottom: '15px'}}>
                  <Label size="large" color="blue">ID: {this.state.selectedMovie.id}</Label>
                </div>
                <div style={{marginBottom: '15px'}}>
                  <strong>Genre:</strong> 
                  <Label style={{marginLeft: '10px'}}>{this.state.selectedMovie.genre}</Label>
                </div>
                <div style={{marginBottom: '15px'}}>
                  <strong>Release Date:</strong> {this.state.selectedMovie.date}
                </div>
                {this.state.selectedMovie.poster && (
                  <div style={{marginTop: '20px', textAlign: 'center'}}>
                    <img 
                      src={this.state.selectedMovie.poster} 
                      alt={this.state.selectedMovie.title}
                      style={{maxWidth: '200px', maxHeight: '300px'}}
                    />
                  </div>
                )}
              </div>
            )}
          </Modal.Content>
          <Modal.Actions>
            <Button color="green" onClick={this.closeModal}>
              Close
            </Button>
          </Modal.Actions>
        </Modal>
      </div>
    );
  }
}

export default App;