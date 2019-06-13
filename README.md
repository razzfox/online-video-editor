# Running
Run the videoAPI backend by itself (e.g. on a server) to manage videos and run youtube-dl to download them
`node src/videoAPI.js`

Run the React frontend development server (for development in a browser)
`npm run react-start`

Run the electron app, which starts each backend and frontend servers
`npm start`

# Design
This app shows off three modern programming frameworks:
- a backend RESTful API framework (Node/ExpressJS)
- a modern, cross-platform frontend framework (React)
- and, a desktop-integration framework (Electron)

In addition to these programming paradigms:
- background processing
- pre-caching
- XPC, cross-process communication
- state synchronization (frontend and backend)
- lazy-loading (fast UI responsiveness)

