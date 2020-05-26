const splitargs = require('splitargs');

function isCommand(message) {
    if (typeof message !== 'string') return false;

    return message.trim().charAt(0) === '!';
}

function getCommandName(message) {
    const firstWord = message.trim().split(' ')[0];
    const command = firstWord.toLowerCase().substring(1);

    return command;
}

function parseArguments(message) {
    let args = message.trim().split(' ').slice(1).join(' ');

    if (args.match(/\|/)) {
        let options = args.split('|')[0];
        const optionsSpread = args
            .split('|')
            .slice(1)
            .map((opt) => opt.trim())
            .filter((question) => question.length > 1);

        options = splitargs(options);
        args = [...options, ...optionsSpread];
    } else {
        args = splitargs(args.trim());
    }

    return args.map((opt) => {
        if (opt.match(/^-?\d+$/)) {
            return Number.parseInt(opt, 10);
        }

        return opt.toLowerCase();
    });
}

function checkArgumentLength(inputArgs, commandArgs) {
    const unlimitedArgs = commandArgs.find((arg) => arg.includes('...'));

    if (!unlimitedArgs && inputArgs.length > commandArgs.length) {
        return 'Too many arguments provided.';
    }

    if (inputArgs.length < commandArgs.length) {
        return 'Too few arguments provided.';
    }

    return false;
}

function getArgumentProps(commandTemplate) {
    const argArr = commandTemplate.split(' ').splice(1);
    return argArr.map((arg) => arg.replace(/[<>]/g, ''));
}

function validNumber(number) {
    return !Number.isNaN(number) && number % 1 === 0 && number >= 0;
}

function formatCoins(number) {
    const formattedCoins = number.toLocaleString();
    return `devwarsCoin ${formattedCoins}`;
}

module.exports = {
    isCommand,
    getCommandName,
    parseArguments,
    checkArgumentLength,
    getArgumentProps,
    validNumber,
    formatCoins,
};
