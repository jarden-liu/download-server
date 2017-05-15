const express = require('express');
const fs = require('fs');
const ip = require('ip');
const request = require('request');
const progress = require('request-progress');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);


const port = 6666;

io.on("connection", function(socket) {
    console.log("一个新连接");
});

app.get('/get-file-list', (req, res) => {
    var fileList = [];
    fs.readdir('assets', (err, files) => {
        files.forEach(file => {
            fileList.push({file, url: `http://${ip.address()}:${port}/${file}`});
        });
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(fileList));
    });
});

app.get('/download-file', (req, res) => {
    var url = req.query.url;

    // var url = 'http://dlsw.baidu.com/sw-search-sp/soft/82/37326/tongyi_BDdl_rj_1.7.0.104.1438935973.exe';
    var filename = url.replace(/^.*[\\\/]/, '');
    if (!filename) {
      return res.send('无效URL');
    }

    res.redirect('/progress');
    var _state;
    try{
      progress(request(url)).on('progress', (state) => {
          _state = state;
          io.sockets.emit('download-progress', {state});
      })
      .on('error', function(error) {
          io.sockets.emit('download-error', {error});
      })
      .on('end', function() {
          Object.assign(_state, {percent: 1});
          io.sockets.emit('download-progress', {state:_state});
      })
      .pipe(fs.createWriteStream(`./assets/${filename}`));
    }catch(error){
      setTimeout(function () {
        io.sockets.emit('download-error', {error});
      }, 500);
    }

});


app.get('/progress', (req, res) => {
    var data = fs.readFileSync('www/index.html');
    res.send(data.toString());
});

app.use(express.static('assets'));

http.listen(6666, (err) => {
    err && console.log(err);
    console.log(`Listen http://${ip.address()}:${port}`);
});
