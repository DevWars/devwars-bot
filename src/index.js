const bot = require('./common/bot');

// Register commands
require('./commands');
require('./commands/game');
require('./commands/betting');
require('./commands/voting');
require('./commands/poll');
require('./commands/hype');

(async () => {
    // connect bot
    await bot.connect();
})();
