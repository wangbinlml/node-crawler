//依赖模块
var fs = require('fs');
var cheerio = require('cheerio');
var mysql = require('mysql');
var mkdirp = require('mkdirp');
var async = require('async');
var moment = require('moment');

var utils = require("./lib/utils");
var Fiber = require('fibers');
var future = require('fibers/future');

var base_url = "http://xuexiao.eol.cn";
// 目标网址
var url = "http://xuexiao.eol.cn/yep_school/school.s?cengci=%E5%B9%BC%E5%84%BF%E5%9B%AD_cengci";
var date = moment().format("YYMMDD");
var today = moment().format("YYYY-MM-DD");
// 本地存储目录
var uploads_dir = '/uploads/allimg/' + date;
var dir = './images' + uploads_dir;

// 创建目录
mkdirp(dir, function (err) {
    if (err) {
        console.log(err);
    }
});

Fiber(
    function () {
        try {
            var page = 1;
            var count= 0;
            var $ = utils.requestSync(url, 'utf-8').wait();
            writeFile("省,学校,联系电话,地址\n");
            $('.area_list ul li').each(function () {
                var a = $(this).children('a');
                var href = a.attr('href');
                var title = a.text();
                console.log("==="+title+"===========")
                if(title != "港澳台") {
                    //var last_href = $2('.page_num').children('a').last().attr('href');
                    //var count = last_href.substr(last_href.length-3);
                    for(var i = 1;i<= 50; i++) {
                        var url2 = base_url + href + "&page=" + i;
                        var $2 = utils.requestSync(url2, 'utf-8').wait();
                        $2('.search_result_list .xx_info').each(function () {
                            count++;
                            var p = $(this).children('p');
                            var schoolName = p.eq(0).text();
                            var phone = p.eq(1).children('span').eq(0).children('b').text();
                            if(phone.length<7){
                                phone = "";
                            }
                            var address = p.eq(2).children('b').text();
                            console.log("count="+count+"=;page="+i+'========='+title+','+schoolName+','+phone+','+address);
                            writeFile(title+','+schoolName+','+phone+','+address+"\n");
                        });
                    }
                }
            });
        } catch (e) {
            console.log("Exception:", e);
        }
    }
).run();

function writeFile(str) {
    fs.appendFile('./school_info.csv',str,'utf8',function(err){
        if(err)
        {
            console.log(err);
        }
    });
}
