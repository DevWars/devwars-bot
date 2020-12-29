const _ = require('lodash');
const { Server } = require('socket.io');
const config = require('../config');
const bot = require('../common/bot');
const devwarsLiveService = require('./devwarsLive.service');

class DevWarsWidgetsService {
    server = null;
    _stage = null;

    init() {
        this.server = new Server(config.devwarsWidgets.port, { transports: ['websocket'] });
        this.server.on('connection', this.onConnection.bind(this));

        devwarsLiveService.on('game.state', (game) => {
            const stage = game?.stages[game.stageIndex].type || null;
            if (stage !== this._stage) {
                this._stage = stage;
                this.updateVotingState();
            }
        });
    }

    onConnection(socket) {
        socket.on('betting.state', () => {
            socket.emit('betting.state', this.getBettingState());
        });

        socket.on('voting.state', () => {
            socket.emit('voting.state', this.getVotingState());
        });
    }

    getBettingState() {
        const optionTotal = new Map();
        for (const bet of bot.betting.bets.values()) {
            const total = optionTotal.get(bet.option) ?? 0;
            optionTotal.set(bet.option, total + bet.amount);
        }

        const options = bot.betting.options.map((option) => {
            return { option, total: optionTotal.get(option) ?? 0 };
        });

        const state = _.pick(bot.betting, ['open', 'startAt', 'endAt']);
        return { ...state, options };
    }

    updateBettingState() {
        this.server.emit('betting.state', this.getBettingState());
    }

    broadcastBet(bet) {
        this.server.emit('betting.bet', bet);
    }

    getVotingState() {
        return { open: this._stage === 'vote' };
    }

    updateVotingState() {
        this.server.emit('voting.state', this.getVotingState());
    }

    broadcastVote(vote) {
        const user = { id: vote.user.id, username: vote.user.displayName };
        this.server.emit('voting.vote', { ...vote, user });
    }
}

module.exports = new DevWarsWidgetsService();
