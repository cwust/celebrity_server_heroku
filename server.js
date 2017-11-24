'use strict';

const express = require('express');
const SocketServer = require('ws').Server;
const Case = require('case');
var session = require('express-session')
var MemoryStore = require('memorystore')(session)
var cors = require('cors')

const CelebrityEngine = require('./celebrity-engine');

const PORT = process.env.PORT || 3000;

const app = express();

app.use(session({
  store: new MemoryStore({
    checkPeriod: 86400000 // prune expired entries every 24h
  }),
  resave: false,
  saveUninitialized: true,
  secret: 'cwustcelebrity',
  secure: false
}));


const corsOptions = {
  origin: 'http://localhost:8100',
  credentials: true,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

app.use(cors(corsOptions));


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

    console.log(req.session);
    console.log('req.session.data before', req.session.data);
    
    req.session.data = 1;
    req.session.save(() => {
      console.log('req.session.data after ', req.session.data);
      res.send(JSON.stringify(result));
    });

    if (result.playerInfo) {
      req.session.playerInfo = result.playerInfo;
      req.session.save();
    }

    
  };

  app
    .post(route, handler)
    .get(route, handler);
}

app.listen(PORT, () => console.log(`Listening on ${ PORT }`));

