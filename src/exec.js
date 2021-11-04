// src/exec.js

"use strict";

import { Buffer } from 'buffer';

const config = require("./config/db/config.json");

export default async function execjs(code) {
    const execjsUrl = config.execjs_url;
    const data = {
        // code: btoa(code),
        code: Buffer.from(code).toString('base64')
    };

    const res = await fetch(execjsUrl, {
        url: execjsUrl,
        body: JSON.stringify(data),
        headers: {
            'content-type': 'application/json'
        },
        method: 'POST'
    }).then(response => {
        return response.json();
    }).then(result => {
        return Buffer.from(result.data, 'base64').toString('utf-8');
    }).catch(err => console.error(err));

    return await Promise.resolve(res);
}
