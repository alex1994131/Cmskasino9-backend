  const express = require('express');
  const mongoose = require('mongoose');
  const bodyParser = require('body-parser');
  const config = require('./db');
  const cors = require('cors');
  const app = express();
  const server = require("http").Server(app);
  const io = require("socket.io")(server);
  const SocketServer = require("./socket");
  const adminRouter = require("./router");
  const path = require("path");
  const DB = require("./config/index.json")

  mongoose.connect(DB.TESTDB, { useNewUrlParser: true ,useFindAndModify: false}).then((db) => { console.log('Database is connected') ;
    },err => { console.log('Can not connect to the database'+ err)}
  );
 
  app.use(cors());
  app.use(express.static('./client'));
  app.use(bodyParser.json({limit: "15360mb", type:'application/json'}));
  app.use(bodyParser.urlencoded({limit: "15360mb",extended: true,parameterLimit:5000000,type:'application/json'})); 
  app.use('/admin',adminRouter);

  SocketServer(io);

  app.get('*', (req, res) => {
    res.sendFile(path.join(config.DIR, 'client/index.html'));  
  });

  //    start server
  server.listen(config.ServerPort, () => {
    console.log(`Started server on => http://localhost:${config.ServerPort}`);
  });
  // in case of an error
  app.on('error', (appErr, appCtx) => {
  });