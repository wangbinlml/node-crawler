/**
 * Created by root on 6/6/17.
 */

//依赖模块
var fs = require('fs');
var cheerio = require('cheerio');
var mysql = require('mysql');
var mkdirp = require('mkdirp');
var moment = require('moment');

var utils = require("./lib/utils");
var base_url = "http://www.xinhuanet.com";
// 目标网址
var url1 = "http://www.news.cn/tech/qqbb.htm";
var date = moment().format("YYMMDD");
var today = moment().format("YYYY-MM-DD");
// 本地存储目录
var uploads_dir = '/uploads/allimg/' + date;
var dir = './images' + uploads_dir;

// 创建目录
mkdirp.sync(dir);
(async () => {
        try {
            //var dede_uploads = await utils.query("select * from dede_archives where id=21");
            //console.log(dede_uploads);
            var random = await utils.GetRandomNum(5110, 5120);
            var time = new Date().getTime();
            //一个月前
            var timestamps = parseInt((time) / 1000);
            //最后一篇文章ID
            var arch = await dede_archives_findOne();
            var id = parseInt(arch[0]['id'])+1;
            console.log("=========开始ID是======： ", id);
            var typeid = 8;
            var order = 1;
            var list = [];
            //列表
            var $ = await utils.request(url1, 'utf-8');
            var data = $('.tabCon .con ul li');
            for(var i = 0; i<data.length;i++) {
                var dt = data[i];
                console.log("=====第" + order + "条======")
                var clearfix = dt.attribs.class;
                if (clearfix == "clearfix") {
                    var a = dt.children[1].children[0];
                    var span = dt.children[3].children[0];
                    var href = a.attribs.href;
                    var title = a.children[0]['data'];
                    var date2 = span.children[0]['data'].trim();

                    var exists = await dede_archives_find(title);
                    if (exists.length == 0) {
                        if (date2 == today) {
                            var url = href;
                            list.push({
                                title: title,
                                url: url
                            });
                            var $2 = await utils.request(url, 'utf-8');
                            var plum = $('<span></span>');
                            $2('.zan-wap').replaceWith(plum);
                            $2('.p-tags').replaceWith(plum);
                            $2('iframe').replaceWith(plum);
                            var content = $2('#p-detail').html();
                            if (!content) {
                                content = $2("#content").html();
                            }

                            if (content) {
                                var source = $2('.h-info').children().last().text().replace("来源：\r\n", "").trim();
                                if(!source){
                                    source = $2("span#source").text().replace("来源：\r\n", "").trim();
                                }
                                if(!source) {
                                    source = "新华网";
                                }
                                var flag = 'h,c,a,s';
                                var $3 = cheerio.load(content);
                                var img = $3("img");
                                var src = img.first().attr('src');
                                var litpic = "";
                                if (src != undefined) {
                                    console.log("下载封面： " + src);
                                    var apath = typeid + "_" + new Date().getTime() + Math.floor(Math.random() * 100000);
                                    var path = apath + src.substr(-4, 4);
                                    //var bbath = apath +"_145_105" + src.substr(-4, 4);
                                    //var cbath = apath +"_240_120" + src.substr(-4, 4);
                                    //var dbath = apath +"_580_326" + src.substr(-4, 4);
                                    //var ebath = apath +"_390_292" + src.substr(-4, 4);
                                    var img_url = url.substring(0, url.lastIndexOf("/") + 1) + src;
                                    console.log(img_url)
                                    await utils.download(img_url, dir, path);
                                    //定制尺寸缩略图
                                    // await utils.download(img_url, dir, bbath);
                                    // await utils.download(img_url, dir, cbath);
                                    //await utils.download(img_url, dir, dbath);
                                    //await utils.download(img_url, dir, ebath);
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
                                await dede_archives(archives);
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
                                await dede_addonarticle(addonarticle);
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
                                await dede_arctiny(arctiny);
                                console.log("==================");
                                console.log("保存dede_arctiny完成");
                                console.log("==================");
                                console.log("完成" + order + "====" + title);
                            }
                        }
                    } else {
                        console.log("已经存在该文章啦！！！")
                    }
                    order++;
                    id++;
                }
            }
        } catch (e) {
            console.log("Exception:", e);
        }
        process.exit(0);
    }
)();
//check archives
async function dede_archives_find(title) {
    var archives = await utils.query("select * from dede_archives where title= ?", title);
    return archives;
}
async function dede_archives_findOne() {
    var archives = await utils.query("select id from dede_archives order by id desc limit 1");
    return archives;
}
//保存archives
async function dede_archives(obj) {
    //(typeid,typeid2,sortrank,flag,ismake,channel,arcrank,click,money,title,shorttitle,color,writer,source,litpic,pubdate,senddate,mid,keywords,lastpost,scores,goodpost,badpost,voteid,notpost,description,filename,dutyadmin,tackid,mtype,weight)
    var archives = await utils.query("insert into dede_archives set ?", obj);
    return archives;
}

//保存dede_arctiny
async function dede_arctiny(obj) {
    //(id,typeid,typeid2,arcrank,channel,senddate,sortrank,mid) values (?,?,?,?,?,?,?,?)
    var uploads = await utils.query("insert into dede_arctiny set ?", obj);

}


//保存dede_arctiny
async function dede_addonarticle(obj) {
    //(id,typeid,typeid2,arcrank,channel,senddate,sortrank,mid) values (?,?,?,?,?,?,?,?)
    var uploads = await utils.query("insert into dede_addonarticle set ?", obj);
}
