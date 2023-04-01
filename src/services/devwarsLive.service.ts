import * as _ from 'lodash';
import { EventEmitter } from 'events';
import io from 'socket.io-client';
import fetch from 'node-fetch';
import config from '../config';

class DevWarsLiveService extends EventEmitter {
    game = null;
    socket = null;

    connect() {
        this.socket = io(config.devwarsLive.url, { transports: ['websocket'] });

        this.socket.on('connect', () => {
            console.log('DevWarsLive connection established!');
        });

        this.socket.on('disconnect', () => {
            console.error('DevWarsLive connection lost!');
        })

        this.socket.on('init', () => {
            this.socket.emit('game.refresh');
        });

        this.socket.on('game.state', (game) => {
            this.game = game;
            this.emit('game.state', this.game);
        });
    }

    getStage() {
        return this.game?.stages[this.game.stageIndex] ?? null;
    }

    teamIdFromName(teamName) {
        if (!this.game) return null;

        const team = this.game.teams.find(team => team.name === teamName);
        if (!team) return null;

        return team.id;
    }

    isVotingOpen() {
        return this.getStage()?.type === 'vote' && this.game.stageEndAt > Date.now();
    }

    async fetch(url, options) {
        const res = await fetch(`${config.devwarsLive.url}/api/${url}`, _.merge({
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                apikey: config.devwarsLive.apiKey,
            },
        }, options));

        if (!res.ok) {
            const body = await res.json();
            throw new Error(body.error);
        }

        return res.json();
    }

    async getVotes() {
        try {
            return this.fetch('votes');
        } catch (e) {
            console.log(e);
        }
    }

    async getVotesForCategory(category) {
        const votes = await this.getVotes();
        return votes.filter(vote => vote.category === category);
    }

    async onVote(vote) {
        if (!this.game) return;

        try {
            const body = JSON.stringify({
                teamId: this.teamIdFromName(vote.team),
                twitchId: vote.user.id,
                twitchUsername: vote.user.username,
                category: vote.category,
            });

            return this.fetch('votes', { method: 'POST', body });
        } catch (e) {
            console.log(e);
        }
    }
}

export default new DevWarsLiveService();
