/**
 * Description:
 * Created by wangbin.
 * Date: 16-6-23
 * Time: 下午5:28
 */
var pool = require("./mysql").pool;
var fs = require('fs');
var http = require('http');
var originRequest = require("request");
var iconv = require('iconv-lite');
var cheerio = require("cheerio");
var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
};

var query = function (sql, option, cb) {
    if (typeof cb == "function") {
        pool.getConnection(function (err, conn) {
            if (err) {
                throw  err;
                return;
            }
            conn.query(sql, option, function (error, row) {
                conn.release();
                // Handle error after the release.
                if (error) throw error;
                cb(error, row);
            });
        });
    } else {
        return new Promise(function (resolve, reject) {
            pool.getConnection(function (err, conn) {
                if (err) {
                    reject(err);
                } else {
                    conn.query(sql, option, function (error, row) {
                        conn.release();
                        // Handle error after the release.
                        if (error) reject(error);
                        resolve(row);
                    });
                }
            });
        })
    }
}

var request = function (url, charset, cb) {
    // 发送请求
    var options = {
        url: url,
        encoding: null,
        headers: headers
    };
    if (typeof cb == "function") {
        originRequest(options, function (error, response, body) {
            if (!error && response.statusCode == 200) {// 发送请求
                var html = iconv.decode(body, charset || 'gb2312');
                var $ = cheerio.load(html, {decodeEntities: false});
                cb(null, $)
            } else {
                cb(error, null);
            }
        });
    } else {
        return new Promise(function (resolve, reject) {
            originRequest(options, function (error, response, body) {
                if (!error && response.statusCode == 200) {// 发送请求
                    var html = iconv.decode(body, charset || 'gb2312');
                    var $ = cheerio.load(html, {decodeEntities: false});
                    resolve($);
                } else {
                    reject(error);
                }
            });
        });
    }
};

var GetRandomNum = function (Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
};


var download = function (url, dir, filename, cb) {
    if (typeof cb == "function") {
        var stream = fs.createWriteStream(dir + "/" + filename);
        originRequest(url).pipe(stream).on('close', function () {
            cb(null, "下载成功")
        });
    } else {
        return new Promise(function (resolve, reject) {
            var stream = fs.createWriteStream(dir + "/" + filename);
            originRequest(url).pipe(stream).on('close', function () {
                resolve("下载成功");
            });
        });
    }
};

var get = function (url, cb) {
    if (typeof cb == "function") {
        http.get(url, function (res) {
            var data = "";
            res.on("data", function (buf) {
                data = data + buf;
            });
            res.on('end', function () {
                cb(null, data);
            });
        }).on('error', function (e) {
            cb("Got error: " + e.message);
        });
    } else {
        return new Promise(function (resolve, reject) {
            http.get(url, function (res) {
                var data = "";
                res.on("data", function (buf) {
                    data = data + buf;
                });
                res.on('end', function () {
                    resolve(data);
                });
            }).on('error', function (e) {
                reject("Got error: " + e.message)
            });
        });
    }
};


exports.get = get;
exports.query = query;
exports.request = request;
exports.GetRandomNum = GetRandomNum;
exports.download = download;
exports.request = request;