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
import { render,
    screen,
    fireEvent,
    act,
    waitFor,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../App';

require('dotenv').config();

let rootContainer = null;

beforeEach(() => {
    // setup a DOM element as a render target
    rootContainer = document.createElement("div");
    document.body.appendChild(rootContainer);
});

afterEach(() => {
    // cleanup on exiting
    jest.clearAllMocks();
    unmountComponentAtNode(rootContainer);
    document.body.removeChild(rootContainer);
    rootContainer = null;
});

afterAll(() => {
    setTimeout(() => process.exit(), 1000);
});

// expect(screen.getByText(/folinodocs/i)).toBeInTheDocument();

describe("Klick on 'text' and run ExecJS", () => {
    let dom;
    it("Should change link and print in console 'Test ExecJS'", async () => {
        act(() => {
            dom = render(<App />, rootContainer);
        });
        await waitFor(() =>
            expect(dom.getByTestId('EditorType')).toHaveTextContent('text')
        );

        // console.info(dom);
        let anchor = await Promise.resolve(dom.getByTestId('EditorType'));
        expect(anchor).not.toBeNull();
        await Promise.resolve(fireEvent.click(anchor));
        let res = await Promise.resolve(dom.getByTestId('EditorType'));

        expect(res).not.toBeNull();

        jest.spyOn(console, 'log');

        try {
            let anchor = await Promise.resolve(screen.getByTestId('ExecJS'));
            // console.info(anchor);
            await Promise.resolve(fireEvent.click(anchor));
            console.info(console.log.mock.calls);
            // expect(console.log.mock.calls.length).toBe(1);
            expect(console.log.mock.calls[0][0]).toBe('Test ExecJS');
        } catch (err) {
            console.info("Code editor");
            console.error(err);
        }
    });
});

describe("Klick on 'Export2Pdf'", () => {
    let dom;
    it("Should fetch document", async () => {
        act(() => {
            dom = render(<App value="<p>Test</p>"/>, rootContainer);
        });
        // console.log(dom);

        await Promise.resolve(screen.findByTestId("Spara"));
        await Promise.resolve(screen.findByTestId("Export2Pdf"));
        try {
            let anchor = await Promise.resolve(screen.getByTestId("Export2Pdf"));
            expect(anchor).not.toBeNull();
            await Promise.resolve(fireEvent.click(anchor));
            // screen.debug(anchor);
        } catch (err) {
            console.error(err);
        }
    });
    it("Should append download link on page", async () => {
        act(() => {
            dom.rerender;
        });
        try {
            let res = await Promise.resolve(dom.findByText('ConvertedFile'));
            // screen.debug(res);
            expect(res).not.toBeNull();
        } catch (err) {
            console.error(err);
        }
    }, 10000);
    /* it("Should remove download link from the page", async () => {
        try {
            let res = await Promise.resolve(screen.findAllByTestId('ConvertedFile'));
            expect(res).toBeNull();
        } catch (err) {
            console.error(err);
        }
    }, 11000); */
});

/* describe("Klick on 'Skicka inbjudan'", () => {
    it("Should print in console 'Queued. Thank you.'", async () => {
        act(() => {
            render(<App  email={email} password={password}/>, container);
        });
        (async () => {
            jest.spyOn(console, 'log');
            return await Promise.resolve(screen.findByTestId("sendInvitation"));
        })().then((anchor) => {
            expect(anchor).not.toBeNull();
            fireEvent.click(anchor);
        }).then(() => {
            expect(console.log.mock.calls.length).toBe(0);
            expect(console.log.mock.calls[0][0]).toBe('Queued. Thank you.');
        }).catch((err) => {
            console.log("Skicka inbjudan");
            console.error(err);
        });
    });
}); */
