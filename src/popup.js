// src/popup.js

"use strict";

import React, { Component } from 'react';
import {
    Input
} from 'reactstrap';

export default class PopUp extends Component {
    constructor(props) {
        super(props);
        this.state = {
            comment: "",
        };

        this.handleSubmit = this.handleSubmit.bind(this);
    }

    handleSubmit() {
        // this.props.toggle();
    }

    render() {
        return (
            <div className="popup">
                <Input type="textarea" name="newComment" id="newComment"
                    placeholder="Skriv kommentar" data-testid="newComment"
                    value={this.state.comment}
                />
                <button onClick={this.handleSubmit}>Spara kommentar</button>
            </div>
        );
    }
}
