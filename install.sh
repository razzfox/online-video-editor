# MacOS
brew install ffmpeg

# Android 
pkg install nodejs ffmpeg imagemagick


# Node modules require that youtube_dl and ffmpeg are already installed
pip install --upgrade youtube_dl

# Project
npm install

####
# Node module fix for android
ytdl="/data/data/com.termux/files/home/electron-gifs/node_modules/youtube-dl"
test -d $ytdl && mkdir ${ytdl}/bin/
test -d $ytdl && echo {\"path\":\"$(which youtube-dl)\"} > ${ytdl}/bin/details

# also remove electron dependencies from package.json before running npm install
