'use strict';

function map(arr, mapper) {
    let res = [];
    for (let ind in arr) {
        res[ind] = mapper(arr[ind]);
    }
    return res;
}

function keys(obj) {
    let res = [];
    for (let key in obj) {
        res.push(key);
    }
    return res;
}

function values(obj) {
    let res = [];
    for (let key in obj) {
        res.push(obj[key]);
    }
    return res;
}

const Sequence = require('./sequence');

const CelebrityServer = {
    games: {},
    players: {},
    broadcastHandler: null
}

CelebrityServer.setBroadcastHandler = function(handler) {
    CelebrityServer.broadcastHandler = handler;
}

CelebrityServer.broadcastToAllPlayers = function (msg, params, game) {
    let ids = keys(game.players);
    CelebrityServer.broadcastHandler(msg, params, ids);
}

CelebrityServer.broadcastToGameOwner = function (msg, params, game) {
    CelebrityServer.broadcastHandler(msg, params, [game.ownerId]);
}

CelebrityServer.broadcastTeamPlayersUpdated = function (game) {
    CelebrityServer.broadcastToAllPlayers(
        'PLAYERS_UPDATED', 
        {
            team1: map(game.team1Ids, id => game.players[id]),
            team2: map(game.team2Ids, id => game.players[id]),
        },
        game        
    );    
}

CelebrityServer.broadcastAllPlayersReady = function () {
    CelebrityServer.broadcastToGameOwner(
        'ALL_PLAYERS_READY', 
        {},
        game        
    );    
}

CelebrityServer.echo = function(params) {
    return {echo: params.value};
};

CelebrityServer.createGame = function(params, playerId) {
    let { gameName, playerName } = params;

    let gameId = Sequence.next();

    let player = {
        id: playerId,
        name: playerName,
        team: 1,
        gameId
    }

    let game = {
        id: gameId,
        name: gameName,
        ownerId: playerId,
        players: {},
        team1Ids: [playerId],
        team2Ids: []
    }

    game.players[playerId] = player;

    CelebrityServer.games[gameId] = game;
    CelebrityServer.players[playerId] = player;

    return game;
}

CelebrityServer.connectToGame = function(params, playerId) {
    let { gameId, playerName } = params;

    let game = CelebrityServer.games[gameId];

    if (!game) {
        return {error: 'Cannot find game with id:', gameId};
    }
    
    let player = {
        id: playerId,
        name: playerName,
        team: 1,
        gameId
    }

    game.players[playerId] = player;
    game.team1Ids.push(playerId);

    CelebrityServer.broadcastTeamPlayersUpdated(game);
    CelebrityServer.players[playerId] = player;
    
    return game;
}

CelebrityServer.listGames = function() {
    return map(values(CelebrityServer.games), game => ({
        id: game.id,
        name: game.name
    }));
}

function getCurrentGame(playerId) {
    console.log('getCurrentGame playerId', playerId);
    console.log('getCurrentGame CelebrityServer.players', CelebrityServer.players);
    return CelebrityServer.games[CelebrityServer.players[playerId].gameId];
}

CelebrityServer.getGameTeams = function(params, playerId) {
    let game = getCurrentGame(playerId);

    return {
        team1: map(game.team1Ids, id => game.players[id]),
        team2: map(game.team2Ids, id => game.players[id]),
    };
}

CelebrityServer.changePlayerTeam = function (params, playerId) {
    console.log('CelebrityServer.changePlayerTeam', params, playerId);
    let targetPlayerId = params.playerId ? params.playerId : playerId;

    let game = getCurrentGame(playerId);

    if (game.ownerId != playerId && targetPlayerId != playerId) {
        return {error: 'Only the game owner can change other players team'};
    }
    
    let player = game.players[targetPlayerId];

    if (player.team !=1 && player.team != 2) {
        return {error: 'Cannot determine player team'};
    }

    let orig = player.team == 1 ? game.team1Ids : game.team2Ids;
    let dest = player.team == 1 ? game.team2Ids : game.team1Ids;

    let indOrig = orig.indexOf(playerId);
    let indDest = dest.indexOf(playerId);

    if (indOrig < 0) {
        return {error: 'Cannot find player in his/her team'};
    }
        
    if (indDest >= 0) {
        return {error: 'Player was already in target team'};
    }

    orig.splice(indOrig, 1);
    dest.push(playerId);

    player.team = player.team == 1 ? 2 : 1;

    console.log('CelebrityServer.changePlayerTeam result', game);
    CelebrityServer.broadcastTeamPlayersUpdated(game);
    
    return {ok: true};
}

CelebrityServer.setCurrentPlayerCelebrities = function (params, playerId) {
    let { celebrities } = params;

    if (celebrities.length < 10) {
        return {error: 'Player sent less celebrities than required (10)'};        
    }

    let game = getCurrentGame(playerId);
    let player = game.players[playerId];

    player.celebrities = celebrities;

    let allPlayersReady = true;
    for (let player of values(game.players)) {
        if (!player.celebrities || player.celebrities.length < 10) {
            allPlayersReady = false;
            break;
        }
    }

    if (allPlayersReady) {
        CelebrityServer.broadcastAllPlayersReady();
    }
}

CelebrityServer.kickPlayerFromGame = function(params, playerId) {
    let targetPlayerId = params.playerId ? params.playerId : playerId;

    let game = getCurrentGame(playerId);
    
    if (game.ownerId != playerId && targetPlayerId != playerId) {
        return {error: 'Only the game owner can kick other players'};
    }
    
    let player = game.players[targetPlayerId];

    if (player.team !=1 && player.team != 2) {
        return {error: 'Cannot determine player team'};
    }

    let orig = player.team == 1 ? game.team1Ids : game.team2Ids;

    let indOrig = orig.indexOf(playerId);

    if (indOrig < 0) {
        return {error: 'Cannot find player in his/her team'};
    }

    orig.splice(indOrig, 1);
    CelebrityServer.broadcastTeamPlayersUpdated(game);
}

exports = module.exports = CelebrityServer;