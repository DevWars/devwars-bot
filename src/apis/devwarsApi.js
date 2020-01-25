require('dotenv').config();
const axios = require('axios');

const apiUrl = process.env.DEVWARS_API_URL;
const apiKey = process.env.DEVWARS_API_KEY;

async function getCoins(twitchUser) {
    try {
        const req = await axios.get(`${apiUrl}/users/stats/coins`, {
            params: { twitchId: twitchUser.id },
        });
        return req.data || 0;
    } catch (e) {
        console.log(e);
    }
}

async function putCoins(updates) {
    // Simplify twitchUser object for API validation
    updates.forEach(({ user }, index) => {
        updates[index].twitchUser = { id: user.id, username: user.username };
        delete updates[index].user;
    });

    try {
        await axios.put(`${apiUrl}/oauth/twitch/coins`, {
            apiKey,
            updates,
        });
    } catch (e) {
        console.log(e);
    }
}

async function getActiveGame() {
    try {
        const req = await axios.get(`${apiUrl}/games/active`);
        return req.data;
    } catch (e) {
        console.log(e);
    }
}

async function endGame(gameId) {
    try {
        return await axios.post(`${apiUrl}/games/${gameId}/end/bot`, {
            apiKey,
        });
    } catch (e) {
        console.log(e);
    }
}

async function signUpForActiveGame(scheduleId, twitchUser) {
    try {
        return await axios.post(`${apiUrl}/applications/schedule/${scheduleId}/twitch?twitch_id=${twitchUser.id}`, {
            apiKey,
        });
    } catch (e) {
        console.log(e);
        return e;
    }
}

module.exports = {
    getCoins,
    putCoins,
    getActiveGame,
    endGame,
    signUpForActiveGame,
};
