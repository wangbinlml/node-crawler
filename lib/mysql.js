var mysql = require('mysql');
var connInfo = require('../config/mysql').connInfo;
var pool;
if (pool == undefined) {
    pool  = mysql.createPool({
        host: connInfo.host,
        user: connInfo.user,
        password: connInfo.pass,
        database: connInfo.db,
        port: connInfo.port,
        charset: connInfo.charset
    });
}

exports.pool = pool;
