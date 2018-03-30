/**
 * A game
 * @typedef {Object} Game
 * @prop {String} id
 * @prop {String} accessCode Code used to join game
 * @prop {Team[]} teams Array of teams
 * 
 * A team of players
 * @typedef {Object} Team
 * @prop {String} id
 * @prop {String} name Name of the team
 * @prop {Player[]} players Array of player IDs
 * @prop {Number} points The number of points the team has earned
 * 
 * A player
 * @typedef {Object} Player
 * @prop {String} id
 * @prop {String} name Name of the player
 */