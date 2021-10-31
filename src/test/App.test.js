/**
 * Funktionstests.
 *
 * @author Nenad Cuturic
 */
/* jshint node: true */
/* jshint esversion: 8 */
"use strict";

import React from "react";
import { unmountComponentAtNode } from "react-dom";
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

require('dotenv').config();

let container = null,
    email = process.env.TEST_EMAIL,
    password = process.env.TEST_PASS;

beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
});

afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    document.body.removeChild(container);
    container = null;
});

afterAll(() => {
    setTimeout(() => process.exit(), 1000);
});

// expect(screen.getByText(/folinodocs/i)).toBeInTheDocument();

describe("Title", () => {
    it("renders title", async () => {
        act(() => {
            render(<App  email={email} password={password}/>, container);
        });

        expect(screen.getByRole('heading',
            { name: /Text editor baserad på React, TinyMCE och CodeMirror/i }))
            .toBeInTheDocument();
    });
});

describe("Klick on 'Redigera fil'", () => {
    it("Should expand menu", async () => {
        act(() => {
            render(<App  email={email} password={password}/>, container);
        });
        (async () => {
            return await Promise.resolve(screen.findByTestId("Redigera fil"));
        })().then((anchor) => fireEvent.click(anchor))
            .then(() => {
                return screen.findAllByTestId(/Test/i);
            }).then((res) => expect(res).not.toBeNull());
        // console.log(screen.getByRole('link', { name: /redigera fil/i }));
        // userEvent.type(document.body, 'a');
        //screen.debug(res);
        // screen.debug(await Promise.resolve(screen.getAllByRole('listitem')));
    });
});

describe("Klick on 'Spara'", () => {
    it("Should show input", async () => {
        act(() => {
            render(<App  email={email} password={password}/>, container);
        });
        (async () => {
            return await Promise.resolve(screen.findByTestId("Spara"));
        })().then((anchor) => fireEvent.click(anchor))
            .then(() => {
                return screen.findAllByTestId('docName');
            }).then((res) => expect(res).not.toBeNull());
    });
});

describe("Klick on 'Spara som'", () => {
    it("Should show input", async () => {
        act(() => {
            render(<App  email={email} password={password}/>, container);
        });
        (async () => {
            return await Promise.resolve(screen.findByTestId("Spara som"));
        })().then((anchor) => fireEvent.click(anchor))
            .then(() => {
                return screen.findAllByTestId('docName');
            }).then((res) => expect(res).not.toBeNull());
    });
});
