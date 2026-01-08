import React from 'react';
import { Form, Button, Message, Segment, Header, Icon } from 'semantic-ui-react';
import config from '../config';
import './Login.css';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      loading: false,
      error: null,
      showRegister: false,
      email: '',
      age: '',
      gender: '',
      trendingMovies: [],
      backgroundMovies: [],
      currentTrendingIndex: 0,
      trendingChanging: false
    };
    this.trendingInterval = null;
    this._isMounted = false;
  }

  componentDidMount() {
    this._isMounted = true;
    this.loadTrendingMovies();
    this.loadBackgroundMovies();
    this.startTrendingAutoSlide();
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this.trendingInterval) {
      clearInterval(this.trendingInterval);
      this.trendingInterval = null;
    }
  }

  loadTrendingMovies = () => {
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
        if (trendingMovies.length > 0 && this._isMounted) {
          this.setState({ trendingMovies: trendingMovies.slice(0, 5) });
        }
      })
      .catch(error => {
        console.warn('[Login] Error loading trending movies:', error);
      });
  }

  loadBackgroundMovies = () => {
    const moviesUrl = `${config.API_URL}/init`;
    
    fetch(moviesUrl, {
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
        const movies = data.result || [];
        // Get movies with valid posters for background
        const moviesWithPosters = movies
          .filter(m => m && m.poster && 
            m.poster !== 'null' && 
            m.poster !== 'None' && 
            !m.poster.includes('via.placeholder.com'))
          .slice(0, 20); // Use 20 movies for background grid
        
        if (this._isMounted) {
          this.setState({ backgroundMovies: moviesWithPosters });
        }
      })
      .catch(error => {
        console.warn('[Login] Error loading background movies:', error);
      });
  }

  startTrendingAutoSlide = () => {
    this.trendingInterval = setInterval(() => {
      if (!this._isMounted) return;
      
      const trendingCount = this.state.trendingMovies.length;
      if (trendingCount === 0) return;
      
      const nextIndex = (this.state.currentTrendingIndex + 1) % trendingCount;
      
      // Trigger fade animation
      this.setState({ trendingChanging: true });
      
      // Update index and reset animation after transition
      setTimeout(() => {
        if (!this._isMounted) return;
        this.setState({ 
          currentTrendingIndex: nextIndex,
          trendingChanging: false 
        });
      }, 400);
    }, 4000); // Change every 4 seconds
  }

  handleInputChange = (e, { name, value }) => {
    this.setState({ [name]: value, error: null });
  }

  handleLogin = async (e) => {
    if (e) e.preventDefault();
    const { username, password } = this.state;
    
    if (!username || !password) {
      this.setState({ error: 'Please enter both username and password' });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`${this.props.apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user || { username }));
        }
        
        // Call parent's onLogin callback
        if (this.props.onLogin) {
          this.props.onLogin(data.user || { username }, data.token);
        }
        
        if (this.props.toastRef && this.props.toastRef.current) {
          this.props.toastRef.current.show(`Welcome back, ${username}!`, 'success');
        }
      } else {
        this.setState({ 
          error: data.message || 'Login failed. Please check your credentials.',
          loading: false 
        });
      }
    } catch (error) {
      console.error('Login error:', error);
      this.setState({ 
        error: 'Cannot connect to server. Please ensure the backend is running.',
        loading: false 
      });
    }
  }

  handleRegister = async (e) => {
    if (e) e.preventDefault();
    const { username, password, email, age, gender } = this.state;
    
    if (!username || !password || !email) {
      this.setState({ error: 'Please fill in all required fields (username, password, email)' });
      return;
    }

    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`${this.props.apiUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          username, 
          password, 
          email,
          age: age ? parseInt(age) : -1,
          gender: gender || '-'
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Store token in localStorage
        if (data.token) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user || { username }));
        }
        
        // Call parent's onLogin callback
        if (this.props.onLogin) {
          this.props.onLogin(data.user || { username }, data.token);
        }
        
        if (this.props.toastRef && this.props.toastRef.current) {
          this.props.toastRef.current.show(`Account created! Welcome, ${username}!`, 'success');
        }
      } else {
        this.setState({ 
          error: data.message || 'Registration failed. Username or email may already exist.',
          loading: false 
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.setState({ 
        error: 'Cannot connect to server. Please ensure the backend is running.',
        loading: false 
      });
    }
  }

  toggleMode = () => {
    this.setState({ 
      showRegister: !this.state.showRegister, 
      error: null,
      username: '',
      password: '',
      email: '',
      age: '',
      gender: ''
    });
  }

  handleDemoLogin = async (e) => {
    if (e) e.preventDefault();
    // Auto-fill demo credentials
    this.setState({ 
      username: 'demo', 
      password: 'demo123',
      error: null 
    }, () => {
      // Submit login after state update
      setTimeout(() => {
        this.handleLogin(e);
      }, 100);
    });
  }

  handleTrendingClick = (index) => {
    if (index === this.state.currentTrendingIndex) return;
    this.setState({ currentTrendingIndex: index });
    // Reset interval
    if (this.trendingInterval) {
      clearInterval(this.trendingInterval);
    }
    this.startTrendingAutoSlide();
  }

  render() {
    const { showRegister, loading, error, username, password, email, age, gender, trendingMovies, backgroundMovies, currentTrendingIndex, trendingChanging } = this.state;
    const currentTrending = trendingMovies[currentTrendingIndex] || null;

    return (
      <div className="login-container">
        {/* Background movie posters grid */}
        <div className="login-background">
          {backgroundMovies.map((movie, index) => (
            <div key={movie.id || index} className="background-poster">
              {movie.poster && (
                <img 
                  src={movie.poster} 
                  alt={movie.title || 'Movie poster'}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              )}
            </div>
          ))}
          <div className="background-overlay"></div>
        </div>

        {/* Trending movie showcase */}
        {currentTrending && (
          <div className="trending-showcase">
            <div className={`trending-slide-container ${trendingChanging ? 'changing' : ''}`}>
              <div 
                className="trending-featured"
                style={{
                  backgroundImage: currentTrending.poster ? `url(${currentTrending.poster})` : 'none'
                }}
              >
                <div className="trending-featured-overlay">
                  <div className="trending-featured-content">
                    <Icon name="fire" className="trending-icon" />
                    <h3>Trending Now</h3>
                    <h2>{currentTrending.title || 'Featured Movie'}</h2>
                    <p>{currentTrending.genre || ''} • {currentTrending.date || ''}</p>
                  </div>
                </div>
              </div>
            </div>
            {trendingMovies.length > 1 && (
              <div className="trending-indicators">
                {trendingMovies.map((_, index) => (
                  <div
                    key={index}
                    className={`trending-dot ${index === currentTrendingIndex ? 'active' : ''}`}
                    onClick={() => this.handleTrendingClick(index)}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Login form */}
        <div className="login-form-wrapper">
          <Segment className="login-segment" raised>
            <Header as="h2" icon textAlign="center" className="login-header">
            <Icon name="film" />
            <Header.Content>
              {showRegister ? 'Create Account' : 'Welcome Back'}
            </Header.Content>
            <Header.Subheader>
              {showRegister 
                ? 'Sign up to get personalized movie recommendations' 
                : 'Sign in to continue to Movie Recommender'}
            </Header.Subheader>
          </Header>

          {error && (
            <Message negative>
              <Message.Header>Error</Message.Header>
              <p>{error}</p>
            </Message>
          )}

          {!showRegister && (
            <Message info style={{ marginBottom: '20px', textAlign: 'center' }}>
              <Message.Header>
                <Icon name="info circle" /> Try Demo Account
              </Message.Header>
              <p style={{ marginTop: '10px', fontSize: '14px' }}>
                <strong>Username:</strong> demo<br />
                <strong>Password:</strong> demo123
              </p>
              <Button 
                color="green" 
                size="small" 
                onClick={this.handleDemoLogin}
                loading={loading}
                disabled={loading}
                style={{ marginTop: '10px' }}
              >
                <Icon name="play" /> Try Demo Account
              </Button>
            </Message>
          )}

          <Form onSubmit={showRegister ? this.handleRegister : this.handleLogin} loading={loading}>
            <Form.Input
              icon="user"
              iconPosition="left"
              label="Username"
              placeholder="Enter your username"
              name="username"
              value={username}
              onChange={this.handleInputChange}
              required
              autoFocus
            />

            {showRegister && (
              <Form.Input
                icon="mail"
                iconPosition="left"
                label="Email"
                placeholder="Enter your email"
                name="email"
                type="email"
                value={email}
                onChange={this.handleInputChange}
                required
              />
            )}

            <Form.Input
              icon="lock"
              iconPosition="left"
              label="Password"
              placeholder="Enter your password"
              name="password"
              type="password"
              value={password}
              onChange={this.handleInputChange}
              required
            />

            {showRegister && (
              <>
                <Form.Input
                  icon="birthday"
                  iconPosition="left"
                  label="Age (Optional)"
                  placeholder="Enter your age"
                  name="age"
                  type="number"
                  value={age}
                  onChange={this.handleInputChange}
                  min="1"
                  max="120"
                />

                <Form.Select
                  label="Gender (Optional)"
                  placeholder="Select gender"
                  name="gender"
                  options={[
                    { key: 'M', text: 'Male', value: 'M' },
                    { key: 'F', text: 'Female', value: 'F' },
                    { key: 'O', text: 'Other', value: 'O' }
                  ]}
                  value={gender}
                  onChange={this.handleInputChange}
                />
              </>
            )}

            <Button
              type="submit"
              primary
              fluid
              size="large"
              loading={loading}
              disabled={loading}
            >
              {showRegister ? 'Create Account' : 'Sign In'}
            </Button>
          </Form>

          <div className="login-toggle">
            <Message info>
              {showRegister ? (
                <>
                  Already have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); this.toggleMode(); }}>
                    Sign in here
                  </a>
                </>
              ) : (
                <>
                  Don't have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); this.toggleMode(); }}>
                    Sign up here
                  </a>
                </>
              )}
            </Message>
          </div>
        </Segment>
        </div>
      </div>
    );
  }
}

export default Login;
