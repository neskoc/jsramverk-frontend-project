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

let container = null;

beforeEach(() => {
    // setup a DOM element as a render target
    container = document.createElement("div");
    document.body.appendChild(container);
});

afterEach(() => {
    // cleanup on exiting
    jest.clearAllMocks();
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
            render(<App />, container);
        });

        expect(screen.getByRole('heading',
            { name: /Text editor baserad på React, TinyMCE och CodeMirror/i }))
            .toBeInTheDocument();
    });
});

describe("Klick on 'Redigera fil'", () => {
    it("Should expand menu", async () => {
        act(() => {
            render(<App />, container);
        });
        await Promise.resolve(screen.findByTestId("Redigera fil"));

        try {
            let anchor = await Promise.resolve(screen.getByTestId("Redigera fil"));
            fireEvent.click(anchor);
            // screen.debug(anchor);
        } catch (err) {
            console.error(err);
        }
        try {
            const res = await Promise.resolve(screen.findAllByTestId(/Test/i));
            // screen.debug(res);
            expect(res).not.toBeNull();
        } catch (err) {
            console.log("Redigera fil");
            console.error(err);
        }

        // console.log(screen.getByRole('link', { name: /redigera fil/i }));
        // userEvent.type(document.body, 'a');
        //screen.debug(res);
        // screen.debug(await Promise.resolve(screen.getAllByRole('listitem')));
    });
});

describe("Klick on 'Spara'", () => {
    it("Should show input", async () => {
        act(() => {
            render(<App />, container);
        });

        await Promise.resolve(screen.findByTestId("Spara"));

        try {
            let anchor = await Promise.resolve(screen.getByTestId("Spara"));
            fireEvent.click(anchor);
            // screen.debug(anchor);
        } catch (err) {
            console.error(err);
        }
        try {
            const res = await Promise.resolve(screen.findAllByTestId(/docName/i));
            // screen.debug(res);
            expect(res).not.toBeNull();
        } catch (err) {
            console.error(err);
        }
    });
});

describe("Klick on 'Spara som'", () => {
    it("Should show input", async () => {
        act(() => {
            render(<App />, container);
        });

        await Promise.resolve(screen.findByTestId("Spara som"));

        try {
            let anchor = await Promise.resolve(screen.getByTestId("Spara som"));
            fireEvent.click(anchor);
            // screen.debug(anchor);
        } catch (err) {
            console.error(err);
        }
        try {
            const res = await Promise.resolve(screen.findAllByTestId(/docName/i));
            // screen.debug(res);
            expect(res).not.toBeNull();
        } catch (err) {
            console.error(err);
        }
    });
});

describe("Klick on 'Export2Pdf'", () => {
    let dom;
    it("Should append download link on page", async () => {
        act(() => {
            dom = render(<App value="<p>Test</p>"/>, container);
        });
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
        try {
            let res = await Promise.resolve(dom.container.getElementsByClassName('ConvertedFile'));
            console.log(res);
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

/* describe("Klick on 'text' and run ExecJS", () => {
    it("Should change link and print in console 'Test ExecJS'", async () => {
        act(() => {
            render(<App  email={email} password={password}/>, container);
        });
        (async () => {
            return await Promise.resolve(screen.findByTestId("EditorType-text"));
        })().then((anchor) => fireEvent.click(anchor))
            .then(() => {
                try {
                    return screen.findByTestId('EditorType-code');
                } catch (err) {
                    console.log(err);
                    return null;
                }
            }).then((res) => expect(res).not.toBeNull())
            .then(() => {
                try {
                    jest.spyOn(console, 'log');
                    return screen.findByTestId('ExecJS');
                } catch (err) {
                    console.info(err);
                    return null;
                }
            }).then((anchor) => fireEvent.click(anchor))
            .then(() => {
                expect(console.log.mock.calls.length).toBe(1);
                expect(console.log.mock.calls[0][0]).toBe('Test ExecJS');
            })
            .catch((err) => {
                console.log("Code editor");
                console.error(err);
            });
    });
});

describe("Klick on 'Skicka inbjudan'", () => {
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
