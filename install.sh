# Node modules require that youtube_dl and ffmpeg are already installed

# MacOS
brew install nodejs ffmpeg imagemagick python

# Android 
pkg install nodejs ffmpeg imagemagick python

# youtube-dl must be upgraded on a regular basis in order to continue working (daily/weekly)
pip install --upgrade youtube_dl || pip3 install --upgrade youtube_dl

# Project
npm install

####
# Node module fix for android
ytdl="/data/data/com.termux/files/home/electron-gifs/node_modules/youtube-dl"
test -d $ytdl && mkdir ${ytdl}/bin/
test -d $ytdl && echo {\"path\":\"$(which youtube-dl)\"} > ${ytdl}/bin/details

# also remove electron dependencies from package.json before running npm install
