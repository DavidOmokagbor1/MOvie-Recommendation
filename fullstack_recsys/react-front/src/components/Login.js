import React from 'react';
import { Button, Input, Icon, Message } from 'semantic-ui-react';
import './Login.css';
import config from '../config';

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      username: '',
      password: '',
      loading: false,
      error: null,
      showSignUp: false,
      signUpData: {
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        age: '',
        gender: ''
      },
      trendingMovies: [],
      currentTrendingIndex: 0,
      loadingTrending: true,
      sellingFastMovies: [],
      loadingSellingFast: true,
      isLoggedIn: false
    };
  }

  componentDidMount() {
    this.loadTrendingMovies();
    this.loadSellingFastMovies();
    this.startTrendingAutoSlide();
  }

  componentWillUnmount() {
    if (this.trendingInterval) {
      clearInterval(this.trendingInterval);
    }
  }

  loadTrendingMovies = async () => {
    this.setState({ loadingTrending: true });
    try {
      const apiUrl = `${config.API_URL}/api/trending?limit=10`;
      console.log('Loading trending movies from:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Trending movies loaded:', data);
        this.setState({
          trendingMovies: data.result || [],
          loadingTrending: false,
          currentTrendingIndex: 0
        }, () => {
          // Start auto-slide after movies are loaded
          if ((data.result || []).length > 0) {
            this.startTrendingAutoSlide();
          }
        });
      } else {
        console.error('Failed to load trending movies:', response.status);
        this.setState({ 
          loadingTrending: false,
          trendingMovies: []
        });
      }
    } catch (error) {
      console.error('Error loading trending movies:', error);
      this.setState({ 
        loadingTrending: false,
        trendingMovies: []
      });
    }
  }

  startTrendingAutoSlide = () => {
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

  loadSellingFastMovies = async () => {
    this.setState({ loadingSellingFast: true });
    try {
      const apiUrl = `${config.API_URL}/api/trending?limit=12`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        this.setState({
          sellingFastMovies: data.result || [],
          loadingSellingFast: false
        });
      } else {
        this.setState({ 
          loadingSellingFast: false,
          sellingFastMovies: []
        });
      }
    } catch (error) {
      console.error('Error loading selling fast movies:', error);
      this.setState({ 
        loadingSellingFast: false,
        sellingFastMovies: []
      });
    }
  }

  handleInputChange = (e) => {
    this.setState({
      [e.target.name]: e.target.value
    });
  }

  handleSignUpChange = (e) => {
    this.setState({
      signUpData: {
        ...this.state.signUpData,
        [e.target.name]: e.target.value
      }
    });
  }

  handleDemoLogin = async () => {
    this.setState({ loading: true, error: null });
    try {
      const response = await fetch(`${config.API_URL}/api/auth/demo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Demo login failed');
      }

      const data = await response.json();
      if (data.result && data.result.token) {
        localStorage.setItem('authToken', data.result.token);
        localStorage.setItem('user', JSON.stringify(data.result.user));
        // Trigger animation before calling onLogin
        this.setState({ isLoggedIn: true }, () => {
          // Wait for animation to complete before calling onLogin
          setTimeout(() => {
            if (this.props.onLogin) {
              this.props.onLogin(data.result.user, data.result.token);
            }
          }, 800);
        });
      }
    } catch (error) {
      this.setState({ error: 'Failed to login with demo account' });
    } finally {
      this.setState({ loading: false });
    }
  }

  handleLogin = async (e) => {
    e.preventDefault();
    this.setState({ loading: true, error: null });

    try {
      const response = await fetch(`${config.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.state.username,
          password: this.state.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      if (data.result && data.result.token) {
        localStorage.setItem('authToken', data.result.token);
        localStorage.setItem('user', JSON.stringify(data.result.user));
        // Trigger animation before calling onLogin
        this.setState({ isLoggedIn: true }, () => {
          // Wait for animation to complete before calling onLogin
          setTimeout(() => {
            if (this.props.onLogin) {
              this.props.onLogin(data.result.user, data.result.token);
            }
          }, 800);
        });
      }
    } catch (error) {
      this.setState({ error: error.message || 'Login failed. Please check your credentials.' });
    } finally {
      this.setState({ loading: false });
    }
  }

  handleSignUp = async (e) => {
    e.preventDefault();
    this.setState({ loading: true, error: null });

    const { signUpData } = this.state;

    if (signUpData.password !== signUpData.confirmPassword) {
      this.setState({ error: 'Passwords do not match' });
      this.setState({ loading: false });
      return;
    }

    try {
      const response = await fetch(`${config.API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: signUpData.username,
          email: signUpData.email,
          password: signUpData.password,
          age: parseInt(signUpData.age) || -1,
          gender: signUpData.gender || '-'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      if (data.result && data.result.token) {
        localStorage.setItem('authToken', data.result.token);
        localStorage.setItem('user', JSON.stringify(data.result.user));
        if (this.props.onLogin) {
          this.props.onLogin(data.result.user, data.result.token);
        }
      }
    } catch (error) {
      this.setState({ error: error.message || 'Registration failed' });
    } finally {
      this.setState({ loading: false });
    }
  }

  toggleSignUp = () => {
    this.setState({ 
      showSignUp: !this.state.showSignUp,
      error: null
    });
  }

  render() {
    const { loading, error, showSignUp, signUpData, trendingMovies, currentTrendingIndex, loadingTrending, sellingFastMovies, loadingSellingFast } = this.state;
    const currentTrendingMovie = trendingMovies[currentTrendingIndex] || null;
    const hasValidPoster = currentTrendingMovie?.poster && 
      typeof currentTrendingMovie.poster === 'string' &&
      currentTrendingMovie.poster.trim().length > 0 &&
      currentTrendingMovie.poster !== 'null' &&
      currentTrendingMovie.poster !== 'None' &&
      !currentTrendingMovie.poster.includes('via.placeholder.com');

    return (
      <div className="login-page">
        {/* Header - Center of Attraction */}
        <div className="login-header">
          <h1 className="login-title">
            <Icon name="film" className="title-icon" />
            Movie Recommender System
          </h1>
          <p className="login-subtitle">Discover Your Next Favorite Movie</p>
        </div>

        <div className="login-container">
          {/* Cinematic Hero Poster - Left Side (65%) */}
          <div className="hero-poster-section">
            <div className="trending-badge-hero">
              <Icon name="fire" />
              <span>TRENDING NOW</span>
            </div>
            <div className="hero-poster-container">
              {loadingTrending ? (
                <div className="hero-placeholder">
                  <Icon name="spinner" loading size="massive" />
                </div>
              ) : currentTrendingMovie && hasValidPoster ? (
                <img 
                  src={currentTrendingMovie.poster} 
                  alt={currentTrendingMovie.title || 'Movie poster'}
                  className="hero-poster-image"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="hero-placeholder">
                  <Icon name="film" size="massive" />
                </div>
              )}
              
              {/* Hero Overlay Content */}
              {!loadingTrending && currentTrendingMovie && (
                <div className="hero-overlay-content">
                  <h1 className="hero-title">{currentTrendingMovie.title || 'DECEIT'}</h1>
                  <p className="hero-subtitle">{currentTrendingMovie.genre ? `${currentTrendingMovie.genre} • ${currentTrendingMovie.title || 'A female undercover cop is used as a sexual lure for a suspected killer'}` : 'A female undercover cop is used as a sexual lure for a suspected killer'}</p>
                  
                  <div className="hero-metadata">
                    <span>16+</span>
                    <span>•</span>
                    <span>CC</span>
                    <span>•</span>
                    <span>Serie</span>
                    <span>•</span>
                    <span>{currentTrendingMovie.date ? new Date(currentTrendingMovie.date).getFullYear() : '2026'}</span>
                    <span>•</span>
                    <span>1 season</span>
                  </div>
                  
                  <div className="hero-buttons">
                    <Button className="hero-play-btn">
                      <Icon name="play" />
                      Play
                    </Button>
                    <Button className="hero-download-btn">
                      <Icon name="download" />
                      Download
                    </Button>
                    <Button className="hero-favorite-btn" icon>
                      <Icon name="star" />
                    </Button>
                  </div>
                  
                  <div className="hero-tabs">
                    <div className="hero-tab active">SEASON 1</div>
                    <div className="hero-tab">CAST & CREW</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Bottom Indicators */}
            <div className="hero-indicators">
              {trendingMovies.map((_, index) => (
                <div
                  key={index}
                  className={`hero-dot ${index === currentTrendingIndex ? 'active' : ''}`}
                  onClick={() => this.setState({ currentTrendingIndex: index })}
                />
              ))}
            </div>
            
            {/* Selling Fast Badge */}
            {!loadingSellingFast && sellingFastMovies.length > 0 && (
              <div className="selling-fast-badge">
                <Icon name="ticket" />
                <span>SELLING FAST IN CINEMAS</span>
              </div>
            )}
          </div>

          {/* Glassmorphism Login Card - Right Side (35%) */}
          <div className={`login-card ${this.state.isLoggedIn ? 'logged-in' : ''}`}>
            <div className="login-card-icon">
              <Icon name="grid layout" size="large" />
            </div>
            
            <h2 className="login-card-title">Welcome Back</h2>
            <p className="login-card-subtitle">Sign in to continue to Movie Recommender</p>

            {/* Demo Account Section */}
            <div className="demo-account-box">
              <div className="demo-info">
                <p><strong>Username:</strong> demo</p>
                <p><strong>Password:</strong> demo123</p>
              </div>
              <Button 
                className="demo-button"
                onClick={this.handleDemoLogin}
                loading={loading}
                disabled={loading}
              >
                <Icon name="play" />
                Try Demo Account
              </Button>
            </div>

            {error && (
              <Message negative className="login-error">
                {error}
              </Message>
            )}

            {!showSignUp ? (
              <form className="login-form" onSubmit={this.handleLogin}>
                <div className="form-group">
                  <Input
                    icon="user"
                    iconPosition="left"
                    placeholder="Enter your username"
                    name="username"
                    value={this.state.username}
                    onChange={this.handleInputChange}
                    className="login-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <Input
                    icon="lock"
                    iconPosition="left"
                    type="password"
                    placeholder="Enter your password"
                    name="password"
                    value={this.state.password}
                    onChange={this.handleInputChange}
                    className="login-input"
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  className="login-submit-button"
                  loading={loading}
                  disabled={loading}
                >
                  Sign In
                </Button>
              </form>
            ) : (
              <form className="login-form" onSubmit={this.handleSignUp}>
                <div className="form-group">
                  <Input
                    icon="user"
                    iconPosition="left"
                    placeholder="Username"
                    name="username"
                    value={signUpData.username}
                    onChange={this.handleSignUpChange}
                    className="login-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <Input
                    icon="mail"
                    iconPosition="left"
                    type="email"
                    placeholder="Email (optional)"
                    name="email"
                    value={signUpData.email}
                    onChange={this.handleSignUpChange}
                    className="login-input"
                  />
                </div>
                <div className="form-group">
                  <Input
                    icon="lock"
                    iconPosition="left"
                    type="password"
                    placeholder="Password"
                    name="password"
                    value={signUpData.password}
                    onChange={this.handleSignUpChange}
                    className="login-input"
                    required
                  />
                </div>
                <div className="form-group">
                  <Input
                    icon="lock"
                    iconPosition="left"
                    type="password"
                    placeholder="Confirm Password"
                    name="confirmPassword"
                    value={signUpData.confirmPassword}
                    onChange={this.handleSignUpChange}
                    className="login-input"
                    required
                  />
                </div>
                <Button 
                  type="submit"
                  className="login-submit-button"
                  loading={loading}
                  disabled={loading}
                >
                  Sign Up
                </Button>
              </form>
            )}

            <div className="login-footer">
              {!showSignUp ? (
                <p>
                  Don't have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); this.toggleSignUp(); }}>
                    Sign up here
                  </a>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <a href="#" onClick={(e) => { e.preventDefault(); this.toggleSignUp(); }}>
                    Sign in here
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Login;
