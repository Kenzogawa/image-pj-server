const express = require('express');
const app = express();
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const recursive = require('recursive-readdir');

const http = require('http');
const PORT = process.env.PORT || 5000;
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: {
    origin: ['http://localhost:3000'],
  },
});
app.use('/images', express.static('../client/public/images'));

//クライアントと通信
io.on('connection', (socket) => {
  console.log(`[${socket.id}] クライアントと接続しました！`);

  //ファイル監視
  const watcher = chokidar.watch('../client/public/images', {
    awaitWriteFinish: true,
  });
  watcher.on('ready', () => {
    //追加
    watcher.on('add', (path) => {
      // const fileName = path.split('\\').pop();
      const fileName = path.split('/').pop();
      if (!fileName || !fileName.match(/_Thum/)) {
        return;
      }
      console.log(`add ${fileName}`);

      const filePath = `../client/public/images/${fileName}`;
      const imgBinary = fs.readFileSync(filePath, encoding);
      //クライアントへ送信
      socket.emit('img_data', [imgBinary, fileName], (ack) => {
        console.log(ack); //クライアントからの返値
      });
      console.log(`[${fileName}]を送信しました`);
    });
    //変更
    watcher.on('change', (path) => {
      // const fileName = path.split('\\').pop();
      const fileName = path.split('/').pop();
      if (!fileName || !fileName.match(/_Thum/)) {
        return;
      }
      console.log(`change ${fileName}`);

      const filePath = `../client/public/images/${fileName}`;
      const imgBinary = fs.readFileSync(filePath);
      //クライアントへ送信
      socket.emit('img_data', [imgBinary, fileName], (ack) => {
        console.log(ack); //クライアントからの返値
      });
      console.log(`[${fileName}]を送信しました`);
    });
  });

  //通信切断
  socket.on('disconnect', (reason) => {
    console.log(`[${socket.id}] 通信を切断しました！[理由:${reason}]`);
  });
});

server.listen(PORT, () => console.log(`server is running on ${PORT}`));
