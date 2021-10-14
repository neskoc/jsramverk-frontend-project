
let config = require("./config/db/config.json");

config.azure_base_url = process.env.AZURE_BASE_URL || config.azure_base_url;

let dsn = config.azure_base_url;

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();

    if (process.env.REACT_APP_LOCAL === 'true') {
        dsn = "http://localhost:1337";
    }
}

module.exports = {
    client: {
        service: {
            name: "jsramverk-editor-app",
            url: `${dsn}/graphql`
        }
    }
};
