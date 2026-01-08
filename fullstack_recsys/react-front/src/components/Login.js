import React from 'react';
import { Form, Button, Message, Segment, Header, Icon } from 'semantic-ui-react';
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
      gender: ''
    };
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

  render() {
    const { showRegister, loading, error, username, password, email, age, gender } = this.state;

    return (
      <div className="login-container">
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
    );
  }
}

export default Login;
