# Running
Run the backend by itself (e.g. on a server)
`node src/videoAPI.js`

Run the React development server
`npm run react-start`

Run them together
`npm run dev`

Run the Electron app in development mode
`npm start`

Build the Electron app (and React app) for production
`npm build`

Update the source code inside the Electron app (faster develepment)
`npm run update-build`


# Design
This app uses these modern frameworks/libraries:
- Express/Node backend for a RESTful API
- React for a client-side cross-platform frontend
- Electron to achieve desktop-class app integration


And these principals of the REST architecture:
- Uniform Interface: resources are accessed in a consistent  way and can be modified intuitively to access additional resources.
- Client-Server model: frontend and backend can evolve separately as long as the interface between them stays the same.
- Stateless: each request from the client should contain all the information necessary to service the request.
- Cacheable: immutible resources declare themselves as cachable.
- Layered System: some resources may exist on a server beyond where the frontend is directly connected, and access to that resource will be transparent, regardless of the layers it went through.
- Code on Demand: instead of passing static textual representations of resources (i.e. JSON), the client may pass explicit commands that execute on the server. This could be as simple as sending POST with a URL object, instructing the server to download that URL. 


REST stands for Representational State Transfer. It's paradigm is essentially to create a state, represent that as text, then transfer it to another server.
