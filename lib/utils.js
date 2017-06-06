/**
 * Description:
 * Created by wangbin.
 * Date: 16-6-23
 * Time: 下午5:28
 */
var pool = require("./mysql").pool;
var fs = require('fs');
var Fiber = require('fibers');
var future = require('fibers/future');
var originRequest = require("request");
var iconv = require('iconv-lite');
var cheerio = require("cheerio");
var headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.65 Safari/537.36'
};

function request(url, callback) {
    var options = {
        url: url,
        encoding: null,
        headers: headers
    };
    originRequest(options, callback)
}

var querySync = future.wrap(function (sql, option, cb) {
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
});

var requestSync = future.wrap(function (url, charset, cb) {
    // 发送请求
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {// 发送请求
            var html = iconv.decode(body, charset || 'gb2312');
            var $ = cheerio.load(html, {decodeEntities: false});
            cb(null, $)
        } else {
            cb(error, null);
        }
    });
});

var GetRandomNum = function (Min, Max) {
    var Range = Max - Min;
    var Rand = Math.random();
    return (Min + Math.round(Rand * Range));
};

var download = function (url, dir, filename, callback) {
    var stream = fs.createWriteStream(dir + "/" + filename);
    originRequest(url).pipe(stream).on('close', callback);
};

var downloadSync = future.wrap(function (url, dir, filename, cb) {
    download(url, dir, filename, function () {
        cb(null, "下载成功")
    });
});
exports.querySync = querySync;
exports.requestSync = requestSync;
exports.GetRandomNum = GetRandomNum;
exports.downloadSync = downloadSync;
exports.request = request;