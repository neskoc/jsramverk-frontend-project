// src/signupForm.js

"use strict";

import React, { Component } from 'react';

let config = require("./config/db/config.json");

let dsn = config.azure_base_url;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();

    if (process.env.REACT_APP_LOCAL === 'true') {
        dsn = "http://localhost:1337";
    }
}

export default class SignUpForm extends Component {
    constructor(props) {
        super(props);
        this.state = {
            email: "",
            password: "",
            touched: {
                email: false,
                password: false
            }
        };

        this.handleEmailChange = this.handleEmailChange.bind(this);
        this.handlePasswordChange = this.handlePasswordChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.canBeSubmitted = this.canBeSubmitted.bind(this);
        this.loginUser = this.loginUser.bind(this);
    }

    validate(email, password) {
        // true means invalid, so our conditions got reversed
        return {
            email: email.length === 0,
            password: password.length === 0
        };
    }

    handleEmailChange(evt) {
        this.setState({ email: evt.target.value });
    }

    handlePasswordChange(evt)  {
        this.setState({ password: evt.target.value });
    }

    handleBlur(field)  {
        console.log(field);
    }

    async handleSubmit(evt) {
        if (!this.canBeSubmitted()) {
            evt.preventDefault();
            return;
        }
        const { email, password } = this.state;

        console.log(evt.target.name);
        if (evt.target.name === 'login') {
            await this.loginUser(email, password)
                // .then(() => {
                //     console.log(`Logged in with email: ${email} password: ${password}`);
                // })
                .catch(err => {
                    console.error(err);
                });
        } else {
            await this.registerUser(email, password)
                .then(() => {
                    // console.log(`Signed up with email: ${email} password: ${password}`);
                    this.loginUser(email, password);
                })
                .catch(err => {
                    console.error(err);
                });
        }
    }

    canBeSubmitted() {
        const errors = this.validate(this.state.email, this.state.password);
        const isDisabled = Object.keys(errors).some(x => errors[x]);

        return !isDisabled;
    }

    async registerUser(email, password) {
        const data = {
            email: email,
            password: password,
            api_key: config.api_key
        };

        await fetch(`${dsn}/auth/register`, {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            },
            method: 'PUT'
        })
            .then(function () {
                console.log("registered");
            })
            .catch((err) => {
                console.log(err);
            });
    }

    async loginUser(email, password) {
        let that = this;
        const data = {
            email: email,
            password: password,
            api_key: config.api_key
        };

        // console.log("data: ");
        // console.log(JSON.stringify(data));
        await fetch(`${dsn}/auth/login`, {
            body: JSON.stringify(data),
            headers: {
                'content-type': 'application/json'
            },
            method: 'POST'
        })
            .then(function (response) {
                return response.json();
            })
            .then(function (res) {
                // console.log(res.data.token);
                that.props.updateToken(res.data.token, email);
            })
            .catch((err) => {
                console.log(err);
            });
    }

    render() {
        const errors = this.validate(this.state.email, this.state.password);
        const isDisabled = Object.keys(errors).some(x => errors[x]);
        const shouldMarkError = field => {
            const hasError = errors[field];
            const shouldShow = this.state.touched[field];

            return hasError ? shouldShow : false;
        };

        return (
            <div className="form">
                <label>
                    E-post:
                </label>
                <input
                    className={shouldMarkError("email") ? "error" : ""}
                    type="text"
                    value={this.state.email}
                    onChange={this.handleEmailChange}
                />
                <label>
                    Lösenord:
                </label>
                <input
                    className={shouldMarkError("password") ? "error" : ""}
                    type="password"
                    value={this.state.password}
                    onChange={this.handlePasswordChange}
                />
                <button onClick={this.handleSubmit}
                    name="register" disabled={isDisabled}>
                    Register
                </button>
                <button onClick={this.handleSubmit} name="login" disabled={isDisabled}>
                    Login
                </button>
            </div>
        );
    }
}
