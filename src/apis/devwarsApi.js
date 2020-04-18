require("dotenv").config();
const axios = require("axios");

const apiUrl = process.env.DEVWARS_API_URL;
const apiKey = process.env.DEVWARS_API_KEY;

async function getCoins(twitchUser) {
    try {
        const req = await axios.get(`${apiUrl}/users/stats/coins`, {
            params: { twitchId: twitchUser.id, apiKey },
        });
        return req.data || 0;
    } catch (e) {
        console.log(e);
        return {
            error: e.response != null ? e.response.data.error : e.message,
            status: e.response != null ? e.response.status : 500,
        };
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
        return {
            error: e.response != null ? e.response.data.error : e.message,
            status: e.response != null ? e.response.status : 500,
        };
    }
}

async function getActiveGame() {
    try {
        const { data, status } = await axios.get(`${apiUrl}/games/active`);
        return { data, status };
    } catch (e) {
        console.log(e);
        return {
            error: e.response != null ? e.response.data.error : e.message,
            status: e.response != null ? e.response.status : 500,
        };
    }
}

async function endGame(gameId) {
    try {
        return await axios.post(`${apiUrl}/games/${gameId}/end/bot`, {
            apiKey,
        });
    } catch (e) {
        console.log(e);
        return {
            error: e.response != null ? e.response.data.error : e.message,
            status: e.response != null ? e.response.status : 500,
        };
    }
}

async function signUpForActiveGame(scheduleId, twitchUserId) {
    try {
        const url = `${apiUrl}/applications/schedule/${scheduleId}/twitch?twitch_id=${twitchUserId}`;
        return await axios.post(url, { apiKey });
    } catch (e) {
        console.log(e);
        return {
            error: e.response != null ? e.response.data.error : e.message,
            status: e.response != null ? e.response.status : 500,
        };
    }
}

module.exports = {
    getCoins,
    putCoins,
    getActiveGame,
    endGame,
    signUpForActiveGame,
};
