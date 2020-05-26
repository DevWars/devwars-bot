require('dotenv').config();

const axios = require('axios');
const devwarsApi = require('../../client');

const apiUrl = process.env.DEVWARS_API_URL;
const apiKey = process.env.DEVWARS_API_KEY;

const api = new devwarsApi(axios.create({ baseURL: apiUrl }));
api.body = { apiKey };

module.exports = api;
