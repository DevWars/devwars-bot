import bot from './common/bot';
import devWarsLiveService from './services/devwarsLive.service';
import devWarsWidgetsService from './services/devwarsWidgets.service';

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
