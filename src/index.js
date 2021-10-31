// src/index.js

"use strict";

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { App } from './App';
import 'bootstrap/dist/css/bootstrap.min.css';

// const path = require('path');

const shouldProvideCredentials = false;

if (shouldProvideCredentials) {
    // require('dotenv').config({ path: path.resolve(__dirname, '.env.test') });
    require('dotenv').config();

    const email = process.env.REACT_APP_EMAIL,
        password = process.env.REACT_APP_PASS;

    ReactDOM.render(
        <React.StrictMode>
            <App email={email} password={password}/>
        </React.StrictMode>,
        document.getElementById('root')
    );
} else {
    ReactDOM.render(
        <React.StrictMode>
            <App />
        </React.StrictMode>,
        document.getElementById('root')
    );
}
