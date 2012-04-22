var async = require('async');
//generate map
var map = require('./MapGenerator.js').generateMap();

console.log(map[1]);
var db = require('riak-js').getClient({host: "127.0.0.1", port: "8098" });


db.keys('test', function(err, dat) {
    console.log(err);
    console.log(dat);
});