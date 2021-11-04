// src/popup.js

"use strict";

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

export default function HiddenDiv(props) {
    const [testId, setTestId] = useState('');
    const [content, setContent] = useState('');
    const [hidden, setHidden] = useState(true);

    useEffect(() => {
        setTestId(props.testId);
    }), [props.testId];

    useEffect(() => {
        setContent(props.text);
    }), [props.text];

    useEffect(() => {
        setHidden(props.hidden);
    }), [props.hidden];

    return (
        <div data-testid={testId}
            hidden={hidden}>
            {content}
        </div>
    );
}

HiddenDiv.propTypes = {
    testId: PropTypes.string,
    text: PropTypes.string,
    hidden: PropTypes.bool,
};
