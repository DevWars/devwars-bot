import * as _ from 'lodash';
import { Server, Socket } from 'socket.io';
import config from '../config';
import bot, { BettingState } from '../common/bot';
import devwarsLiveService from './devwarsLive.service';
import { Vote } from '../commands/voting';
import { Bet, OptionSummary, createOptionSummaries } from '../commands/betting';

interface LiveVotingState {
    open: boolean;
}

interface LiveBettingState extends Pick<BettingState, 'open' | 'startAt' | 'endAt'> {
    options: OptionSummary[];
}

class DevWarsWidgetsService {
    server: Server | null = null;
    private _stage: string | null = null;

    init() {
        this.server = new Server(config.devwarsWidgets.port, { transports: ['websocket'] });
        this.server.on('connection', (socket: Socket) => this.onConnection(socket));

        devwarsLiveService.on('game.state', (game) => {
            const stage = game?.stages[game.stageIndex].type || null;
            if (stage !== this._stage) {
                this._stage = stage;
                this.updateVotingState();
            }
        });
    }

    onConnection(socket: Socket) {
        socket.on('betting.state', () => {
            socket.emit('betting.state', this.getBettingState());
        });

        socket.on('voting.state', () => {
            socket.emit('voting.state', this.getVotingState());
        });
    }

    getBettingState(): LiveBettingState {
        const state = _.pick(bot.betting, ['open', 'startAt', 'endAt']);
        return { ...state, options: createOptionSummaries() };
    }

    updateBettingState() {
        this.server?.emit('betting.state', this.getBettingState());
    }

    broadcastBet(bet: Bet) {
        this.server?.emit('betting.bet', bet);
    }

    getVotingState(): LiveVotingState {
        return { open: this._stage === 'vote' };
    }

    updateVotingState() {
        this.server?.emit('voting.state', this.getVotingState());
    }

    broadcastVote(vote: Vote) {
        const user = { id: vote.user.id, username: vote.user.displayName };
        this.server?.emit('voting.vote', { ...vote, user });
    }
}

export default new DevWarsWidgetsService();
