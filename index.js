const express = require('express');

var app = express();

app.use(express.static('www'));

app.listen(6666,(err)=>{
  console.log(err);
});
