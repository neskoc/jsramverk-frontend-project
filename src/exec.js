// src/exec.js

"use strict";

const config = require("./config/db/config.json");

export default async function execjs(code) {
    const execjsUrl = config.execjs_url;
    const data = {
        // code: btoa(code),
        code: Buffer.from(code).toString('base64')
    };

    console.log('data');
    console.log(data);
    await fetch(execjsUrl, {
        body: JSON.stringify(data),
        headers: {
            'content-type': 'application/json'
        },
        method: 'POST'
    }).then(function (response) {
        return response.json();
    }).then(function(result) {
        // let decodedOutput = atob(result.data);
        const decodedOutput = Buffer.from(result.data, 'base64').toString('utf-8');

        console.log(decodedOutput); // outputs: hej
    });
}
