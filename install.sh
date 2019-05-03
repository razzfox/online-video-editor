#pip install --upgrade youtube_dl

# this script breaks when the youtube api changes -- stay updated
npm install youtube-dl

# Warning: electron does not support ES6 (yes, in 2019),
# so youtube-dl.js needs to remove the spread operator

npm install

# ffmpeg modules require that ffmpeg is already installed (including all necessary encoding libraries like libmp3lame or libx264
brew install ffmpeg

# Run API for development
bash watchman-simple.sh node src/videoAPI.js
