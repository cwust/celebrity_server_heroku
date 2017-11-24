'use strict';

var CelebrityStore = require('./celebrity-store');

const CelebrityEngine = {};

CelebrityEngine.ping = () => {
    return {x: 1};
};

CelebrityEngine.createNewGame = (params) => {
    let { gameName, playerName } = params;

    let game = CelebrityStore.createNewGame(gameName);
    let player = CelebrityStore.createNewPlayer(playerName);

    game.ownerId = player.id;
    game.playerIds.push(player.id);
    game.team1Ids.push(player.id);

    player.team = 1;
    player.gameId = game.id;

    return {playerInfo: player};
};

CelebrityEngine.listGames = () => {
    let res = [];
    for (var gameId in CelebrityStore.games) {
      res.push({id: gameId, name: CelebrityStore.games[gameId].name});
    }

    return res;
}

exports = module.exports = CelebrityEngine;
