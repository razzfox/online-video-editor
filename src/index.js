import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
// Note: Express server is not meant to be spun up inside react; the node server
// can not run inside the client's browser context.

import './index.css';

ReactDOM.render(
  <App />,
  document.getElementsByTagName('main')[0]
)
