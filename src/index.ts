const bot = require('./common/bot');
const devWarsLiveService = require('./services/devwarsLive.service');
const devWarsWidgetsService = require('./services/devwarsWidgets.service');

// Register commands
require('./commands');
require('./commands/betting');
require('./commands/voting');
require('./commands/hype');

(async () => {
    devWarsLiveService.connect();
    devWarsWidgetsService.init();
    await bot.connect();
})();
