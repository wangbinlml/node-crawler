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

var base_url = "http://www.news.cn";
// 目标网址
var url = "http://qc.wa.news.cn/nodeart/list?nid=113352&pgnum=1&cnt=35&tp=1&orderby=0?callback=jQuery17107707921640328721_1497495826166&_="+new Date().getTime();
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
            var random = utils.GetRandomNum(5110, 5120);
            var time = new Date().getTime();
            //一个月前
            var timestamps = parseInt((time) / 1000);
            //最后一篇文章ID
            var arch = dede_archives_findOne();
            var id = parseInt(arch[0]['id'])+1;
            console.log("=========开始ID是======： ", id);
            var typeid = 1;
            var order = 1;
            var list = [];
            //列表
            var json = utils.getSync(url).wait();
            json = json.replace("jQuery17107707921640328721_1497495826166(","").replace("})","}");
            var obj = JSON.parse(json);
            if(obj.status == 0) {
                var dt = obj.data.list;
                console.log("===========总共"+dt.length+'条数据======')
                for(var i = 0; i<dt.length; i++) {
                    var dtObj = dt[i];
                    var shorttitle = dtObj.Abstract;
                    var url2 = dtObj.LinkUrl;
                    var title = dtObj.Title;
                    var source = dtObj.SourceName;
                    var date2 = dtObj.PubTime.substr(0,10);
                    var keyword =  dtObj.keyword;
                    var src = dtObj.allPics[0];

                    var exists = dede_archives_find(title);
                    if (exists.length == 0 && (date2 == today)) {
                        list.push({
                            title: title,
                            url: url2
                        });
                        console.log(title + "===" + url2);
                        var $2 = utils.requestSync(url2, 'utf-8').wait();
                        var plum = $2('');
                        $2('.zan-wap').replaceWith(plum);
                        $2('.p-jc').replaceWith(plum);
                        $2('.p-kwap').replaceWith(plum);
                        $2('iframe').replaceWith(plum);
                        $2('.lb').replaceWith(plum);
                        var content = $2('#p-detail').html();
                        if (!content) {
                            content = $2("#content").html();
                        }

                        if (content) {
                            var flag = 'h,c,a,s';
                            var $3 = cheerio.load(content);
                            //var img = $3("img");
                            //var src = img.first().attr('src');
                            var litpic = "";
                            /*if (src != "") {
                                console.log("下载封面： " + src);
                                var apath = typeid + "_" + new Date().getTime() + Math.floor(Math.random() * 100000);
                                var path = apath + src.substr(-4, 4);
                                //var bbath = apath +"_145_105" + src.substr(-4, 4);
                                //var cbath = apath +"_240_120" + src.substr(-4, 4);
                                //var dbath = apath +"_580_326" + src.substr(-4, 4);
                                //var ebath = apath +"_390_292" + src.substr(-4, 4);
                                var img_url = src;
                                console.log(img_url)
                                utils.downloadSync(img_url, dir, path).wait();
                                //定制尺寸缩略图
                                // utils.downloadSync(img_url, dir, bbath).wait();
                                // utils.downloadSync(img_url, dir, cbath).wait();
                                //utils.downloadSync(img_url, dir, dbath).wait();
                                //utils.downloadSync(img_url, dir, ebath).wait();
                                flag = flag + ",p,f";
                                litpic = uploads_dir + '/' + path;
                                console.log("下载完成,路径： " + path);
                            }*/
                            //替换文中的图片路径
                            /*$3("img").each(function () {
                                var src = $(this).attr('src');
                                if (src.indexOf('http') != 1) {
                                    var img_url = url.substring(0, url.lastIndexOf("/") + 1) + src;
                                    content = content.replace(src, img_url);
                                }
                            });*/
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
                                shorttitle: shorttitle,
                                color: "",
                                writer: "拉姆",
                                source: source,
                                litpic: litpic,
                                pubdate: timestamps,
                                senddate: timestamps,
                                mid: 1,
                                keywords: keyword,
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
                    }else {
                        console.log("已经存在该文章啦！！！")
                    }
                    order++;
                    id++;
                }
            } else {
                console.log("=======采集出错了=========")
            }
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
