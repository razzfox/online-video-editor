pip install --upgrade youtube_dl

# ffmpeg modules require that ffmpeg is already installed (including all necessary encoding libraries like libmp3lame or libx264
brew install ffmpeg

npm install

####
# Run API for development in a browser
npm run dev

# Run in electron
npm run start

# Possibly use 'concurrently' for development
    "start": "concurrently \"cross-env BROWSER=none npm react-scripts start\" \"wait-on http://localhost:3000 && electron .\"",

####
# Deploy electron app:
npm run build
