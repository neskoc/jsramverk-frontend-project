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

describe("Click on 'text' and run ExecJS", () => {
    it("Should change link", async () => {
        let anchor = "Anchor";

        act(() => {
            render(<App />, rootContainer);
        });


        // await Promise.resolve(screen.findByTestId('EditorType'));

        await waitFor(() => {
            anchor = screen.getByTestId('EditorType');
            expect(anchor).toHaveTextContent('text');
        });

        await waitFor(() => {
            fireEvent.click(anchor);
            expect(anchor).toHaveTextContent('code');
        });

        await waitFor(() => {
            anchor = screen.getByTestId('execjs');
            expect(anchor).toHaveTextContent('ExecJS');
        });

        // fireEvent.click(anchor);
        // await waitFor(() => {
        //     let div = screen.getByTestId('execjsResult');
        //     expect(div).toHaveTextContent('Test ExecJS');
        // });

        // expect(console.log.mock.calls.length).toBe(1);
        // await Promise.resolve(expect(console.log.mock.calls[0][0]).toBe('Test ExecJS'));
    });
});

describe("Click on 'Export2Pdf'", () => {
    let dom;
    it("Should fetch document", async () => {
        act(() => {
            dom = render(<App value="<p>Test</p>"/>, rootContainer);
        });
        // console.log(dom);

        // await Promise.resolve(screen.findByTestId("Spara"));
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
});

describe("Click on 'Skicka inbjudan", () => {
    it("Should add hidden div with the response 'Queued. Thank you.'", async () => {
        let anchor;

        act(() => {
            render(<App />, rootContainer);
        });


        // await Promise.resolve(screen.findByTestId('EditorType'));

        await waitFor(() => {
            anchor = screen.getByTestId('sendInvitation');
            fireEvent.click(anchor);
        });

        await waitFor(() => {
            let div = screen.getByTestId('mailgun');
            expect(div).toHaveTextContent('Queued. Thank you.');
        });
    });
});

describe("Get document 'Test' from DB", () => {
    it("Should show one comment 'Test comment'", async () => {
        let anchor;

        act(() => {
            render(<App />, rootContainer);
        });


        // await Promise.resolve(screen.findByTestId('EditorType'));

        await waitFor(() => {
            anchor = screen.getByTestId('Redigera fil');
        });

        fireEvent.click(anchor);
        await waitFor(() => {
            anchor = screen.getByTestId('Test');
        });

        fireEvent.click(anchor);
        await waitFor(() => {
            let div = screen.getByTestId('comment-1');
            expect(div).toHaveTextContent('Test comment');
        });
    });
});
