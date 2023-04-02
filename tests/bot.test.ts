import Command from '../src/common/Command';
import User from '../src/common/User';
import config from '../src/config';
import { parseArguments } from '../src/utils';

test('should only execute bot command if user is authorized', async () => {
    const adminCommand = new Command('@command', () => {});
    const modCommand = new Command('#command', () => {});
    const subscriberCommand = new Command('$command', () => {});
    const viewerCommand = new Command('!command', () => {});

    const admin = new User({ userId: '1', username: config.twitch.channel, mod: true, subscriber: false });
    const mod = new User({ id: '2', username: 'mod', mod: true, subscriber: false });
    const subscriber = new User({ id: '3', username: 'subscriber', mod: false, subscriber: true });
    const viewer = new User({ id: '4', username: 'user', mod: false, subscriber: false });

    expect(adminCommand.userHasPermission(admin)).toBeTruthy();
    expect(adminCommand.userHasPermission(mod)).toBeFalsy();
    expect(adminCommand.userHasPermission(subscriber)).toBeFalsy();
    expect(adminCommand.userHasPermission(viewer)).toBeFalsy();

    expect(modCommand.userHasPermission(admin)).toBeTruthy();
    expect(modCommand.userHasPermission(mod)).toBeTruthy();
    expect(modCommand.userHasPermission(subscriber)).toBeFalsy();
    expect(modCommand.userHasPermission(viewer)).toBeFalsy();

    expect(subscriberCommand.userHasPermission(admin)).toBeTruthy();
    expect(subscriberCommand.userHasPermission(mod)).toBeTruthy();
    expect(subscriberCommand.userHasPermission(subscriber)).toBeTruthy();
    expect(subscriberCommand.userHasPermission(viewer)).toBeFalsy();

    expect(viewerCommand.userHasPermission(admin)).toBeTruthy();
    expect(viewerCommand.userHasPermission(mod)).toBeTruthy();
    expect(viewerCommand.userHasPermission(subscriber)).toBeTruthy();
    expect(viewerCommand.userHasPermission(viewer)).toBeTruthy();
});

test('should split arguments into array by |, spaces, or single/double quotes', () => {
    const commandOne = '!bet 500 red';
    const commandTwo = '!poll 5 "What is your favorite editor?" | Visual Studio | Atom | Sublime Text';

    expect(parseArguments(commandOne)).toMatchObject([500, 'red']);
    expect(parseArguments(commandTwo)).toMatchObject([5, 'what is your favorite editor?', 'visual studio', 'atom', 'sublime text']);
});
