/**
 * Created by root on 6/6/17.
 */

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

var base_url = "http://www.gov.cn";
// 目标网址
var url = "http://www.gov.cn/xinwen/gundong.htm";
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
            //var dede_uploads = utils.querySync("select * from dede_archives where id=21").wait();
            //console.log(dede_uploads);
            var random = utils.GetRandomNum(5000, 5100);
            var time = new Date().getTime();
            //一个月前
            var timestamps = parseInt((time - 30 * 24 * 3600 * 1000) / 1000);
            //最后一篇文章ID
            var arch = dede_archives_findOne();
            var id = parseInt(arch[0]['id'])+1;
            console.log("=========开始ID是======： ", id);
            var typeid = 1;
            var order = 1;
            var list = [];
            //列表
            var $ = utils.requestSync(url, 'utf-8').wait();
            $('.news_box ul li h4').each(function () {
                console.log("=====第" + order + "条======")
                var a = $(this).children('a');
                var span = $(this).children('span');
                var href = a.attr('href');
                var title = a.text();
                var exists = dede_archives_find(title);
                if (exists.length == 0) {
                    var date2 = span.text().replace("\\r\\n").trim();
                    if (date2 == today) {
                        var url = base_url + href;
                        list.push({
                            title: title,
                            url: url
                        });
                        var $2 = utils.requestSync(url, 'utf-8').wait();
                        var content = $2('#UCAP-CONTENT').html();
                        var source = $2('.pages-date').children().first().text().replace("来源： ", "").trim();
                        var flag = 'h,c';
                        var $3 = cheerio.load(content);
                        var img = $3("img");
                        var src = img.first().attr('src');
                        var litpic = "";
                        if (src != undefined) {
                            console.log("下载封面： " + src);
                            var path = typeid + "_" + new Date().getTime() + Math.floor(Math.random() * 100000) + src.substr(-4, 4);
                            var img_url = url.substring(0, url.lastIndexOf("/") + 1) + src;
                            console.log(img_url)
                            utils.downloadSync(img_url, dir, path).wait();
                            console.log("下载完成,路径： " + path);
                            flag = flag + ",p,f";
                            litpic = uploads_dir + '/' + path;
                        }
                        //替换文中的图片路径
                        $3("img").each(function () {
                            var src = $(this).attr('src');
                            if (src.indexOf('http') != 1) {
                                var img_url = url.substring(0, url.lastIndexOf("/") + 1) + src;
                                content = content.replace(src, img_url);
                            }
                        });
                        console.log("开始保存archives");
                        var archives = {
                            id: id,
                            typeid: typeid,
                            typeid2: "0",
                            sortrank: timestamps,
                            flag: flag,
                            ismake: 1,
                            channel: 1,
                            arcrank: 0,
                            click: random,
                            money: 0,
                            title: title,
                            shorttitle: "",
                            color: "",
                            writer: "拉姆",
                            source: source,
                            litpic: litpic,
                            pubdate: timestamps,
                            senddate: timestamps,
                            mid: 1,
                            keywords: '',
                            lastpost: 0,
                            scores: 0,
                            goodpost: 0,
                            badpost: 0,
                            voteid: 0,
                            notpost: 0,
                            description: '',
                            filename: '',
                            dutyadmin: 1,
                            tackid: 0,
                            mtype: 0,
                            weight: 500
                        };
                        dede_archives(archives);
                        console.log("==================");
                        console.log("保存archives完成");
                        console.log("开始保存dede_addonarticle");
                        var addonarticle = {
                            aid: id,
                            typeid: typeid,
                            body: content,
                            redirecturl: "",
                            templet: "",
                            userip: "127.0.0.1"
                        }
                        dede_addonarticle(addonarticle);
                        console.log("保存dede_addonarticle完成");
                        console.log("==================");
                        console.log("开始保存dede_arctiny");
                        var arctiny = {
                            id: id,
                            typeid: typeid,
                            typeid2: 0,
                            arcrank: 0,
                            channel: 1,
                            senddate: timestamps,
                            sortrank: timestamps,
                            mid: 1
                        };
                        dede_arctiny(arctiny);
                        console.log("==================");
                        console.log("保存dede_arctiny完成");
                        console.log("==================");
                        console.log("完成" + order + "====" + title);
                    }
                    order++;
                    id++;
                } else {
                    console.log("已经存在该文章啦！！！")
                }
            });

        } catch (e) {
            console.log("Exception:", e);
        }
    }
).run();
//check archives
function dede_archives_find(title) {
    var archives = utils.querySync("select * from dede_archives where title= ?", title).wait();
    return archives;
}
function dede_archives_findOne() {
    var archives = utils.querySync("select id from dede_archives order by id desc limit 1").wait();
    return archives;
}
//保存archives
function dede_archives(obj) {
    //(typeid,typeid2,sortrank,flag,ismake,channel,arcrank,click,money,title,shorttitle,color,writer,source,litpic,pubdate,senddate,mid,keywords,lastpost,scores,goodpost,badpost,voteid,notpost,description,filename,dutyadmin,tackid,mtype,weight)
    var archives = utils.querySync("insert into dede_archives set ?", obj).wait();
    return archives;
}

//保存dede_arctiny
function dede_arctiny(obj) {
    //(id,typeid,typeid2,arcrank,channel,senddate,sortrank,mid) values (?,?,?,?,?,?,?,?)
    var uploads = utils.querySync("insert into dede_arctiny set ?", obj).wait();

}


//保存dede_arctiny
function dede_addonarticle(obj) {
    //(id,typeid,typeid2,arcrank,channel,senddate,sortrank,mid) values (?,?,?,?,?,?,?,?)
    var uploads = utils.querySync("insert into dede_addonarticle set ?", obj).wait();

}