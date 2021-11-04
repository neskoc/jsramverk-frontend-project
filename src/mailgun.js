// src/mailgun.js

"use strict";

const config = require("./config/db/config.json");
const mailgun = require("mailgun-js");

const sendEmail = {
    sendInvitation: async (email) => {
        const DOMAIN = config.mailgun_domain;
        const mg = mailgun({apiKey: config.mailgun_api_key, domain: DOMAIN});
        const fullEmail = `email <${email}>`;

        const data = {
            from: 'Nenad Cuturic <cnesko@e.email>',
            to: fullEmail,
            subject: 'Editor invitation',
            text: `Please register here: ${config.client_url}`,
        };

        // await mg.messages().send(data, function (error, body) {
        //     if (error) {
        //         alert(error);
        //     } else {
        //         alert("Invitation sent!");
        //         return body.message;
        //     }
        // });
        const res = await mg.messages().send(data)
            .then(body => {
                if (process.env.NODE_ENV !== 'test') {
                    alert("Invitation sent!");
                }
                return body.message;
            }).catch (error => {
                if (process.env.NODE_ENV !== 'test') {
                    alert(error);
                }
                return error;
            });

        return await Promise.resolve(res);
    }

};

export default sendEmail;
