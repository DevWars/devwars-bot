import { splitArgs } from './splitArgs';
import Command from "../common/Command";

export type ParsedArgument = string | number;

export function isCommand(message: string) {
    if (typeof message !== 'string') return false;

    return message.trim().charAt(0) === '!';
}

export function getCommandName(message: string) {
    const firstWord = message.trim().split(' ')[0];
    const command = firstWord.toLowerCase().substring(1);

    return command;
}

// TODO: Refactor this to be more readable
export function parseArguments(message: string): ParsedArgument[] {
    let cleanedMessage = message.trim().split(' ').slice(1).join(' ');

    let args = undefined;
    if (cleanedMessage.match(/\|/)) {
        const optionsSpread = cleanedMessage.split('|').slice(1)
            .map(opt => opt.trim())
            .filter(question => question.length > 1);

        const options = splitArgs(cleanedMessage.split('|')[0]);
        args = [...options, ...optionsSpread];
    } else {
        args = splitArgs(cleanedMessage.trim());
    }

    return args.map((opt) => {
        if (opt.match(/^-?\d+$/)) {
            return Number.parseInt(opt, 10);
        }

        return opt.toLowerCase();
    });
}

export function checkArgumentLength(inputArgs: ParsedArgument[], commandArgs: Command['args']) {
    const unlimitedArgs = commandArgs.find(arg => arg.includes('...'));

    if (!unlimitedArgs && inputArgs.length > commandArgs.length) {
        return 'Too many arguments provided.';
    }

    if (inputArgs.length < commandArgs.length) {
        return 'Too few arguments provided.';
    }

    return false;
}

export function getArgumentProps(commandTemplate: Command['template']) {
    const argArr = commandTemplate.split(' ').splice(1);
    return argArr.map(arg => arg.replace(/[<>]/g, ''));
}

export function parseValidNumber(value: ParsedArgument): number | undefined {
    const number = Number(value);
    if (Number.isNaN(number)) return;

    const isValid = number % 1 === 0 && number >= 0;
    if (!isValid) return;

    return number;
}

export function coins(number: number | string) {
    const formattedCoins = number.toLocaleString();
    return `devwarsCoin ${formattedCoins}`;
}

export function minutesToMs(minutes: number) {
    return minutes * 60 * 1000;
}
