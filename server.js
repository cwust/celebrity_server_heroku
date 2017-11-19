'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');

const Sequence = require('./sequence');
const CelebrityServer = require('./celebrity-server');

const PORT = process.env.PORT || 3000;
const INDEX = path.join(__dirname, 'index.html');

const server = express()
  .use((req, res) => res.sendFile(INDEX) )
  .listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

const connections = {};

const RESPONSE = 1;
const BROADCAST = 2;

wss.on('connection', (ws) => {
  let playerId = Sequence.next();
  connections[playerId] = ws;
  ws.on('close', () => delete connections[playerId]);    
  ws.on('message', (data) => {
    data = JSON.parse(data);
    if (!data.callId || !data.method) {
      ws.send(JSON.stringify({error: 'Error, malformed request: ' + data }));
      return;
    }

    let {callId, method} = data;
    let params = data.params ? data.params : {};
    
    let handler =  CelebrityServer[method];
    if (!handler) {
      ws.send(JSON.stringify({callId, error: 'Method not found: ' + method }));
    } else {
      let result = handler(params, playerId);
      ws.send(JSON.stringify({type: RESPONSE, callId, result}));
    }
  }) ;
});

CelebrityServer.setBroadcastHandler((msg, params, ids) => {
  for (let id of ids) {
    connections[id].send(JSON.stringify({type: BROADCAST, msg, params}));
  }
});