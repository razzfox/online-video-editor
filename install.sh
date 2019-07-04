pip install --upgrade youtube_dl

# ffmpeg modules require that ffmpeg is already installed (including all necessary encoding libraries like libmp3lame or libx264
brew install ffmpeg

npm install

####
# Fix for android
ytdl="/data/data/com.termux/files/home/electron-gifs/node_modules/youtube-dl"
test -d $ytdl && mkdir ${ytdl}/bin/
test -d $ytdl && echo {\"path\":\"$(which youtube-dl)\"} > ${ytdl}/bin/details

# also remove electron dependencies from package.json before running npm install
