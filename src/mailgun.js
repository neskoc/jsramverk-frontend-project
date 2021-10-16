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

        await mg.messages().send(data, function (error, body) {
            if (error) {
                alert(error);
            } else {
                console.log(body);
                alert("Invitation sent!");
            }
        });
    }

};

export default sendEmail;
