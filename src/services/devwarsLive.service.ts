import * as _ from 'lodash';
import { EventEmitter } from 'events';
import io, { Socket } from 'socket.io-client';
import fetch from 'node-fetch';
import { Timestamp } from '../common/bot';
import config from '../config';
import { Vote } from '../commands/voting';

interface Game {
    stages: LiveStage[];
    stageIndex: number;
    stageEndAt: Timestamp;
    teams: LiveTeam[];
}

interface LiveStage {
    type: string;
    meta: {
        category: string;
    };
}

interface LiveTeam {
    id: number;
    name: string;
}

interface LiveVote {
    id: number;
    category: string;
    twitchId: number;
    twitchUsername: string;
    game: Game;
    teamId: number;
    team: LiveTeam;
}

class DevWarsLiveService extends EventEmitter {
    game: Game | null = null;
    socket: Socket | null = null;

    connect() {
        this.socket = io(config.devwarsLive.url, { transports: ['websocket'] });

        this.socket.on('connect', () => {
            console.log('DevWarsLive connection established!');
        });

        this.socket.on('disconnect', () => {
            console.error('DevWarsLive connection lost!');
        });

        this.socket.on('init', () => {
            this.socket?.emit('game.refresh');
        });

        this.socket.on('game.state', (game: Game) => {
            this.game = game;
            this.emit('game.state', this.game);
        });
    }

    async apiFetch<T>(url: string, options?: object): Promise<T> {
        const res = await fetch(`${config.devwarsLive.url}/api/${url}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                apikey: config.devwarsLive.apiKey,
            },
            ...options,
        });

        if (!res.ok) {
            const body = await res.json();
            throw new Error((body as { error: string }).error);
        }

        return res.json() as Promise<T>;
    }

    getStage(): LiveStage | null {
        return this.game?.stages[this.game.stageIndex] ?? null;
    }

    teamIdFromName(teamName: string): number | null {
        if (!this.game) return null;

        const team = this.game.teams.find((team) => team.name === teamName);
        if (!team) return null;

        return team.id;
    }

    isVotingOpen(): boolean {
        const stage = this.getStage();
        const isElapsed = this.game?.stageEndAt ? this.game.stageEndAt > Date.now() : false;

        return stage?.type === 'vote' && isElapsed;
    }

    async getVotes(): Promise<LiveVote[]> {
        try {
            return this.apiFetch<LiveVote[]>('votes');
        } catch (e) {
            console.log(e);
            return [];
        }
    }

    async getVotesForCategory(category: string): Promise<LiveVote[]> {
        const votes = await this.getVotes();
        return votes.filter((vote) => vote.category === category);
    }

    async onVote(vote: Vote) {
        if (!this.game) return;

        try {
            const body = JSON.stringify({
                teamId: this.teamIdFromName(vote.team),
                twitchId: vote.user.id,
                twitchUsername: vote.user.username,
                category: vote.category,
            });

            await this.apiFetch<void>('votes', { method: 'POST', body });
        } catch (e) {
            console.log(e);
        }
    }
}

export default new DevWarsLiveService();
