# Buzz In
A small web application which allows teams to buzz in for questions
## Setup Instructions
1. Download and install [Node.js](https://nodejs.org/en/) and [MongoDB](https://www.mongodb.com/). Node.js version 10.6 and MongoDB version 3.6.5 are recommended.
2. Clone this repository 
```
git clone https://github.com/CDogg99/buzz-in.git
cd buzz-in
```
3. Install dependencies
```
npm install --only=production
```
4. Update the fields in `config/config.js` and the username and password variables in `util/createDbOwner.js`
5. Start MongoDB without authentication enabled
```
mongod
```
6. Create the database owner
```
node util/createDbOwner.js
```
7. Change the `ip` variables in `index.js`, `create.js`, `game.js`, and `host.js` in `views/js/` to the host computer's network IP address
8. Restart MongoDB with authentication
```
mongod --auth
```
9. Start the web server
```
node index.js
```