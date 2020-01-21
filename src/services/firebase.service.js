require('dotenv').config();
const _ = require('lodash');
const firebase = require('firebase-admin');

const serviceAccount = require('../../firebase.json');

firebase.initializeApp({
    credential: firebase.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_URL,
});

const frame = firebase.database().ref('frame');
const editor = firebase.database().ref('liveGame');

async function listenForStageChange(cb) {
    await editor.child('state').child('stage').on('value', snap => cb(snap.val()));
}

function resetFrame() {
    frame.update({
        lastUpdated: firebase.database.ServerValue.TIMESTAMP,
        timer: false,
        stage: 'objective',
        game: false,

        liveVoting: {
            duration: -1,
            timestamp: null,
            votingOn: 'ui',
            ui: {
                red: 0,
                blue: 0,
            },
            ux: {
                red: 0,
                blue: 0,
            },
            tiebreaker: {
                red: 0,
                blue: 0,
            },
        },

        betting: {
            duration: -1,
            timestamp: null,
            betters: [],
            red: 0,
            blue: 0,
        },

        poll: {
            duration: -1,
            timer: null,
            question: '',
            options: [],
        },
    });
}

async function setStage(stage) {
    await frame.child('stage').set(stage);
}

async function setBetting(minutes) {
    const duration = minutes * 60;

    await frame.child('betting').update({ duration, timestamp: Date.now() });
}

async function addBetOnFrame(user, amount, team) {
    const better = { name: user.username, team, amount, timestamp: Date.now() };
    await frame.child('betting').child('betters').push(better);
}

async function resetBetsOnFrame() {
    await frame.child('betting').child('betters').update({});
}

async function removeBetOnFrame(username) {
    await frame.child('betting').child('betters').once('value', async (snap) => {
        const betters = snap.val();
        const key = _.findKey(betters, better => better.name === username);
        await frame.child('betting').child('betters').child(key).remove();
    });
}

async function emptyFrameBetters() {
    await frame.child('betting').child('betters').remove();
}

async function setVoting(minutes) {
    const duration = minutes * 60;

    await frame.child('liveVoting').update({ duration, timestamp: Date.now() });
}

async function setVotingCategory(category) {
    await frame.child('liveVoting').child('votingOn').set(category);
}

async function addVoteOnFrame(team, category) {
    await frame.child('liveVoting').child(category).child(team)
        .transaction(currentNum => currentNum + 1);
}

async function setPoll(question, options, minutes) {
    const formattedOptions = options.map(option => ({ text: option, votes: 0 }));
    const duration = minutes * 60;

    await frame.child('poll').update({ question, options: formattedOptions, duration, timer: Date.now() });
}

async function updatePollScore(letter) {
    const letterIndex = letter.toUpperCase().charCodeAt(0) - 65;

    await frame.child('poll').child('options')
        .child(letterIndex).child('votes')
        .transaction(currentScore => currentScore + 1);
}

module.exports = {
    resetFrame,
    setStage,
    setBetting,
    addBetOnFrame,
    resetBetsOnFrame,
    removeBetOnFrame,
    emptyFrameBetters,
    setVoting,
    setVotingCategory,
    addVoteOnFrame,
    setPoll,
    updatePollScore,
    listenForStageChange,
};
