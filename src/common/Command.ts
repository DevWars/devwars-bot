import { getArgumentProps, getCommandName } from '../utils';

const ROLE_PERMISSIONS = {
    admin: ['@', '#', '$', '!'],
    mod: ['#', '$', '!'],
    subscriber: ['$', '!'],
    user: ['!'],
};

export default class Command {
    constructor(template, action) {
        this.name = getCommandName(template);
        this.template = template;
        this.symbol = template.charAt(0);
        this.args = getArgumentProps(template);
        this.action = action;
    }

    userHasPermission(user) {
        const userPermissions = ROLE_PERMISSIONS[user.role];
        if (!userPermissions) return false;

        return userPermissions.includes(this.symbol);
    }
}
