# Requirements

- node.js version 0.10.35 or higher
- npm version 2.3.0 or higher
- gulp.js 3.8.10 or higher

# Build

npm install

gulp clean package

# Note

At the moment this extension sends heartbeats to a hard coded project "thunderbird-test". The language is set to "Email"
(not sure if anything else makes sense here). And I am creating some kind of artificial file name (window title + ".eml").

You can change these values here while I am figuring out how to set these reasonably (see also Roadmap):

https://github.com/monkeysintown/thunderbird-wakatime/blob/develop/addon/modules/wakatime.jsm#L72

# Roadmap

- figure out how to map emails to projects (maybe extra field in new message window?)
- listen to open/save/close/key input on message windows
- check time between heartbeats
- maybe use the CLI to send the heartbeat (benefit: inherit offline capabilities of WakaTime)

