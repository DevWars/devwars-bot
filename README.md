<div align="center">
  <br>
  <img alt="DEV" src="https://i.imgur.com/FxskbDN.png" width="500px">
  <h1>DevWars Bot</h1>
  <strong>DevWarsBot on twitch.tv/devwars</strong>
</div>
<br>
<p align="center">
    <a href="">
    <img src="https://img.shields.io/badge/Nodejs-v14.0.0-green.svg" alt="nodejs version">
    </a>
    <a href="http://typeorm.io/#/">
    <img src="https://img.shields.io/badge/tmi.js-v1.3.1-purple.svg" alt="tmi.js version">
    </a>
    <img src="https://flat.badgen.net/dependabot/DevWars/devwars-bot/?icon=dependabot" alt="Dependabot Badge" />
</p>

Welcome to the [DevWars](https://wwww.devwars.tv/) Bot codebase. This bot is responsible for many interactions during a live game, such as: betting, voting, earning coins, etc.

## What is DevWars?

[DevWars.tv](https://www.devwars.tv/) is a live game show for developers that is currently streamed on [Twitch](https://www.twitch.tv/devwars). People of all levels participate in an exhilarating battle to create the best website they can within 60 minutes. Teams are formed of 3 people, with the team's members each controlling a single language - HTML, CSS and JavaScript.

## Getting Started

### Prerequisites

-   [Nodejs](https://nodejs.org/en/): 14.0 or higher
-   [Twitch](https://dev.twitch.tv/docs/irc): Account username and oauth
-   (optional) [DevWars API](https://github.com/DevWars/devwars-api): Run DevWars API locally to test endpoints the bot hits

### Dependency Installation

Run `npm run install` to install dependent node_modules.

### Environment Variables

Make a copy of the `.env.example` file in the same directory and rename the given file to `.env`. This will be loaded up into the application when it first starts running. These are required configuration settings to ensure correct function. Process through the newly created file and make the required changes if needed.

**Twitch Config**

Make a copy of the `twitch.config.example.json` file and rename the given file to `twitch.config.json`. This will be loaded and maintained by the Twitch service, used to communicate to the api. Using a JSON file will allow the automatic updating/refreshing of the access token when it expires.

To obtain the initial `accessToken` and `refreshToken`:

1. Register Your Application [here](https://dev.twitch.tv/)
   - oAuth Redirect Url = `http://localhost`
   - Category = `Chat Bot`
2. Get `Code` with
```
GET https://id.twitch.tv/oauth2/authorize
    --data-urlencode
    ?response_type=code
    &client_id=<your client ID>
    &redirect_uri=<your redirect URI>
```
3. Get `accessToken` and `refreshToken`
```
POST https://id.twitch.tv/oauth2/token
    ?client_id=<your client ID>
    &client_secret=<your client secret>
    &code=<authorization code received above>
    &grant_type=authorization_code
    &redirect_uri=<your redirect URI>
```

### Testing

Running `npm run test` will start the testing process.

### Development

Running `npm start` will run the bot

## License

> You can check out the full license [here](https://github.com/DevWars/devwars-bot/blob/master/LICENSE.md)

This project is licensed under the terms of the **MIT** license.
