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

const electron = window.require('electron')
const app = electron.remote.app

app.on('activate', event => console.log(event))

const fs = electron.remote.require('fs')

console.log('__dirname', __dirname)
console.log('fs.readdirSync(__dirname)', fs.readdirSync(__dirname))
