// src/comment.js

"use strict";

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { unmountComponentAtNode } from 'react-dom';

export default class Comment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.id,
            comment: this.props.comment,
        };
    }

    handleClick(event) {
        console.log("id:");
        console.log(event.currentTarget.id);
        const id = event.currentTarget.id.slice(7);
        const commentId = `comment-${id}`;

        console.log(commentId);
        unmountComponentAtNode(document.getElementById(commentId));
    }

    render() {
        return (
            <div className = "comment"
                id={ `comment-${this.state.id}`
                }>
                <p>{ this.state.comment }</p>
                <button id={ `button-${this.state.id}`}  onClick={this.handleClick}>Ta bort</button>
            </div>
        );
    }
}

Comment.propTypes = {
    id: PropTypes.string.isRequired,
    comment: PropTypes.string.isRequired,
};
