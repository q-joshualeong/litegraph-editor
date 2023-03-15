const express = require('express');
const path = require('path');

const port = 8000;

const app = express()
app.use(express.static(path.join(__dirname)))
app.use("/lib", express.static(path.join(__dirname, "../lib"))); //Serves resources

const server = app.listen(port);