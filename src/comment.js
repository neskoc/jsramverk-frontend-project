// src/comment.js

"use strict";

import React, { Component } from 'react';
import PropTypes from 'prop-types';

export default class Comment extends Component {
    constructor(props) {
        super(props);
        this.state = {
            id: this.props.id,
            comment: this.props.comment,
        };
    }

    render() {
        return (
            <div className = "comment" id={`comment-${this.state.id}`}>
                <p>{ this.state.comment }</p>
                <button id={ `button-${this.state.id}`}
                    onClick={this.props.handleCommentDelete}>Ta bort</button>
            </div>
        );
    }
}

Comment.propTypes = {
    id: PropTypes.number.isRequired,
    comment: PropTypes.string.isRequired,
    handleCommentDelete: PropTypes.func.isRequired,
};
