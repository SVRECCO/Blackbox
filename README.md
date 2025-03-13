# <div align="center">Blackbox - Discord Music Player</div>

<div align="center">
  <img src="https://techstarwebsolutions.com/images/static.png" alt="Blackbox Banner">
</div>

<div align="center">
  <a href="https://developer.mozilla.org/en-US/docs/Web/JavaScript"><img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js"></a>
  <a href="https://discord.js.org/"><img src="https://img.shields.io/badge/Discord-5865F2?style=for-the-badge&logo=discord&logoColor=white" alt="Discord"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT"></a>
</div>

<div align="center">
  <p>Blackbox is an open-source Discord bot that plays music files from a server folder. Instead of streaming from external sources, Blackbox manages a local library of audio files organized by genre!</p>
</div>


## Features

- Play local audio files from server folders
- Organize music by genres
- Upload audio files directly through Discord
- Basic playback controls (play, pause, resume, stop, skip)
- Queue management
- DJ role support
- Auto-completion for song selection

## Installation

1. Clone the repository
   ```bash
   git clone https://github.com/yourusername/blackbox.git
   cd blackbox
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   DISCORD_TOKEN=your_discord_bot_token
   DJ_ROLE_ID=your_dj_role_id
   AUDIO_FOLDER=./audio
   ```

4. Start the bot
   ```bash
   npm start
   ```

## Setup

1. Create a Discord application at [Discord Developer Portal](https://discord.com/developers/applications)
2. Add a bot to your application and copy the token
3. Enable the required Gateway Intents (SERVER MEMBERS, MESSAGE CONTENT, PRESENCE)
4. Invite the bot to your server with proper permissions
5. Create a DJ role in your server and copy its ID (optional)
6. Update your `.env` file with your bot token and DJ role ID
7. Run the bot

## Commands

- `/play [genre] [filename]` - Play an audio file from the specified genre
- `/upload [file] [genre]` - Upload an audio file to the server
- `/pause` - Pause the current song
- `/resume` - Resume the current song
- `/stop` - Stop the current song and clear the queue
- `/skip` - Skip to the next song in the queue
- `/clearqueue` - Clear the current queue

## Folder Structure

```
blackbox/
├── audio/
│   ├── pop/
│   ├── rock/
│   ├── alt rock/
│   ├── heavy metal/
│   ├── hip-hop/
│   ├── rap/
│   ├── classical/
│   ├── electronic/
│   └── other/
├── index.js
├── commands.js
├── audioPlayer.js
├── utils.js
├── .env
└── package.json
```

## Technologies Used

### Programming Languages
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat-square&logo=node.js&logoColor=white)

### NPM Packages
![discord.js](https://img.shields.io/badge/discord.js-5865F2?style=flat-square&logo=discord&logoColor=white) - Discord API client  
![discordjs/voice](https://img.shields.io/badge/@discordjs/voice-5865F2?style=flat-square&logo=discord&logoColor=white) - Voice support for Discord.js  
![dotenv](https://img.shields.io/badge/dotenv-ECD53F?style=flat-square&logo=npm&logoColor=black) - Environment configuration  
![nodemon](https://img.shields.io/badge/nodemon-76D04B?style=flat-square&logo=nodemon&logoColor=white) - Development dependency for auto-restarting

### Runtime Requirements
![Node.js](https://img.shields.io/badge/Node.js_v16.9.0+-43853D?style=flat-square&logo=node.js&logoColor=white)
![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=flat-square&logo=ffmpeg&logoColor=white) (for audio processing)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
