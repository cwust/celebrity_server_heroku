'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const path = require('path');
const Case = require('case');

const CelebrityEngine = require('./celebrity-engine');

const PORT = process.env.PORT || 3000;

const server = express();

console.log('CelebrityEngine', CelebrityEngine);

for (let method in CelebrityEngine) {
  let route = '/' + Case.kebab(method);
  console.log('route', route);
  let handler = (req, res) => {

    let result;
    try {
      result = CelebrityEngine[method](req);
    } catch (err) {
      result: {error: err.message};
      console.error('Error', err);
    }
    console.log('result', result);

    res.send(JSON.stringify(result));
  };

  server
    .post(route, handler)
    .get(route, handler);
}

server.listen(PORT, () => console.log(`Listening on ${ PORT }`));

