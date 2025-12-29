import React from 'react';
import { Message } from 'semantic-ui-react';

class Toast extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: false,
      message: '',
      type: 'info' // 'success', 'error', 'warning', 'info'
    };
  }

  show = (message, type = 'info') => {
    this.setState({
      visible: true,
      message,
      type
    });
    
    // Auto-hide after 3 seconds
    setTimeout(() => {
      this.hide();
    }, 3000);
  };

  hide = () => {
    this.setState({ visible: false });
  };

  render() {
    if (!this.state.visible) return null;

    const { message, type } = this.state;
    const colorMap = {
      success: 'green',
      error: 'red',
      warning: 'yellow',
      info: 'blue'
    };

    return (
      <Message
        color={colorMap[type] || 'blue'}
        onDismiss={this.hide}
        style={{
          position: 'fixed',
          top: '80px',
          right: '20px',
          zIndex: 2000,
          minWidth: '300px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          animation: 'slideInRight 0.3s ease-out'
        }}
      >
        <Message.Header>
          {type === 'success' && '✓ Success'}
          {type === 'error' && '✗ Error'}
          {type === 'warning' && '⚠ Warning'}
          {type === 'info' && 'ℹ Info'}
        </Message.Header>
        <p>{message}</p>
      </Message>
    );
  }
}

export default Toast;





