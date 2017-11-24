'use strict';

const uuidv4 = require('uuid/v4');

const CelebrityStore = {
  players: {},
  games: {}
};

function objectMap (cb) {
    let res = [];
    for (var i in this) {
      if (i !== 'map') {
        res.push(cb(this[i]));
      }
    }
    return res;
}

CelebrityStore.createNewGame = (gameName) => {

    let game = {
        id: uuidv4(),
        name: gameName,
        ownerId: null,
        playerIds: [],
        team1Ids: [],
        team2Ids: []
    };

    CelebrityStore.games[game.id] = game;

    return game;
}

CelebrityStore.createNewPlayer = (playerName) => {

    let player = {
        id: uuidv4(),
        name: playerName,
        team: null,
        gameId: null
    }

    CelebrityStore.players[player.id] = player;

    return player;
}


exports = module.exports = CelebrityStore;
