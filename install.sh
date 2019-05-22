pip install --upgrade youtube_dl

# ffmpeg modules require that ffmpeg is already installed (including all necessary encoding libraries like libmp3lame or libx264
brew install ffmpeg

npm install

####
# Run API for development in a browser
bash watchman-simple.sh node src/videoAPI.js
npm run react-start

# Possibly use 'concurrently' for development
    "start": "concurrently \"cross-env BROWSER=none npm react-scripts start\" \"wait-on http://localhost:3000 && electron .\"",

####
# Deploy:
npm run build
