/**
 * Funktionstests.
 *
 * @author Nenad Cuturic
 */
/* jshint node: true */
/* jshint esversion: 8 */
"use strict";

import React from "react";
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';
import { unmountComponentAtNode } from "react-dom";

let container = null;

beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
});

afterEach(() => {
    // cleanup on exiting
    unmountComponentAtNode(container);
    container.remove();
    container = null;
});

// expect(screen.getByText(/folinodocs/i)).toBeInTheDocument();

describe("Title", () => {
    it("renders title", async () => {
        act(() => {
            render(<App />, container);
        });

        expect(screen.getByRole('heading', { name: /text editor baserad på react and tinymce/i }))
            .toBeInTheDocument();
    });
});

describe("Klick on 'Redigera fil'", () => {
    it("Should expand menu", async () => {
        act(() => {
            render(<App />, container);
        });
        const anchor = await Promise.resolve(screen.getByRole('link', { name: /redigera fil/i }));
        // console.log(screen.getByRole('link', { name: /redigera fil/i }));
        // userEvent.type(document.body, 'a');
        // screen.debug(screen.getAllByRole('listitem'));

        fireEvent.click(anchor);
        let res = await screen.findAllByTestId(/Test/i);

        //screen.debug(res);
        expect(res).not.toBeNull();
    });
});

describe("Klick on 'Spara'", () => {
    it("Should show input", async () => {
        render(<App />, container);
        const anchor = screen.getByTestId("Spara");

        // screen.debug(anchor);
        fireEvent.click(anchor);
        const res = await screen.findByTestId("docName");

        // screen.debug(res);

        expect(res).not.toBeNull();
    });
});

describe("Klick on 'Spara som'", () => {
    it("Should show input", async () => {
        render(<App />, container);
        const anchor = screen.getByTestId("Spara som");

        // screen.debug(anchor);
        fireEvent.click(anchor);
        let res = await screen.findByTestId("docName");

        expect(res).not.toBeNull();
    });
});
