//依赖模块
var fs = require('fs');
var mysql = require('mysql');
var mkdirp = require('mkdirp');
var async = require('async');
var moment = require('moment');

var utils = require("./lib/utils");
var Fiber = require('fibers');
var future = require('fibers/future');

var base_url = "https://www.4493.com"
// 目标网址
//var url = 'https://www.4493.com/xingganmote/index-1.htm';
var url = "https://www.4493.com/siwameitui/index-3.htm";
var date = moment().format("YYMMDD");
// 本地存储目录
var uploads_dir = '/uploads/allimg/' + date;
var dir = './images' + uploads_dir;

// 图片链接地址
var links = [];

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
            var arch = dede_archives_findOne();
            var id = parseInt(arch[0]['id'])+1;
            console.log("=========开始ID是======： ", id);
            var typeid = 27;
            var order = 1;
            //列表
            var $ = utils.requestSync(url,'gb2312').wait();
            $('.piclist li a').each(function () {

                var random = utils.GetRandomNum(1000,3000);
                var time = new Date().getTime();
                //一个月前
                var timestamps = parseInt((time-30*24*3600*1000)/1000);

                var href = $(this).attr('href');
                var img = $(this).children('img');
                var span = $(this).children('span');
                var src = img.attr('src');
                var title = span.text();
                var url2 = base_url + href;
                var obj = {
                    title: title,
                    src: src,
                    url: url2
                };
                console.log("=====第"+order+"条======")
                console.log("下载封面： " + src);
                var path = typeid + "_" +new Date().getTime() + Math.floor(Math.random()*100000) + src.substr(-4,4)
                utils.downloadSync(src, dir, path).wait();
                console.log("下载完成,路径： " + path);
                console.log("开始保存archives");
                var archives = {
                    id:id, typeid:typeid,typeid2:"0",sortrank:timestamps,flag:'p,f',ismake: -1,channel:2,arcrank:0,click:random,money:0,title: title,shorttitle:"",color:"",writer:"拉姆",source:"晨讯网",litpic:uploads_dir+'/'+path,pubdate:timestamps,senddate:timestamps,mid:1,keywords:'',lastpost:0,scores:0,goodpost:0,badpost:0,voteid:0,notpost:0,description:'',filename:'',dutyadmin:1,tackid:0,mtype:0,weight:20
                };
                dede_archives(archives);
                console.log("==================");
                console.log("保存archives完成");
                console.log("==================");
                console.log("开始保存dede_arctiny");
                var arctiny = {
                    id:id,typeid:typeid,typeid2:0,arcrank:0,channel:2,senddate:timestamps,sortrank:timestamps,mid:1
                };
                dede_arctiny(arctiny);
                console.log("==================");
                console.log("保存dede_arctiny完成");
                console.log("==================");
                console.log("开始获取详情.....");
                //详情
                var detail = [];
                var reals = [];
                var lastof = url2.lastIndexOf("/");
                var dbase_url = url2.substring(0, lastof+1);
                var $2 = utils.requestSync(url2,'gb2312').wait();
                var dsrc = $2(".picsboxcenter img").attr("src");
                var countpage = $2('.picmainer h1 span#allnum').text();

                path = new Date().getTime() + Math.floor(Math.random()*100000) + dsrc.substr(-4,4);
                detail.push(dsrc);
                reals.push(path);
                var imagesno = "{dede:pagestyle maxwidth='800' pagepicnum='"+countpage+"' ddmaxwidth='200' row='3' col='4' value='2'/}";
                imagesno = imagesno+"{dede:img ddimg='"+uploads_dir+'/'+path+"' text='' width='651' height='398'}"+uploads_dir+'/'+path+"{/dede:img}";

                console.log("总共照片"+countpage+"张.....");
                console.log("完成第1张照片.....");
                console.log("开始保存第1张照片dede_uploads");
                var uploads = {
                    arcid:id,title:title,url :uploads_dir+'/'+path,mediatype:0,width:0,height:0,playtime:0,filesize:120,uptime:timestamps,mid:1
                };
                dede_uploads(uploads);
                console.log("保存第1张照片dede_uploads完成");
                console.log("==================");
                for(var j = 2; j<countpage - 1; j++)
                {
                    var url3 = dbase_url + j+".htm"
                    $2 = utils.requestSync(url3,'gb2312').wait();
                    dsrc = $2(".picsboxcenter img").attr("src");
                    detail.push(dsrc);
                    path = new Date().getTime() + Math.floor(Math.random()*100000) + dsrc.substr(-4,4);
                    reals.push(path);
                    imagesno = imagesno+"{dede:img ddimg='"+uploads_dir+'/'+path+"' text='' width='651' height='398'}"+uploads_dir+'/'+path+"{/dede:img}";
                    console.log("完成第"+j+"张照片.....");
                    console.log("开始保存第"+j+"张照片dede_uploads");
                    var uploads = {
                        arcid:id,title:title,url :uploads_dir+'/'+path,mediatype:0,width:0,height:0,playtime:0,filesize:120,uptime:timestamps,mid:1
                    };
                    dede_uploads(uploads);
                    console.log("保存第"+j+"张照片dede_uploads完成");
                    console.log("==================");
                }
                obj['detail'] = detail;
                obj['reals'] = reals;
                //console.log(obj)
                links.push(obj);
                console.log("==================");
                console.log("开始保存dede_addonimages");
                var addonimages = {
                    aid:id ,typeid:typeid,pagestyle:2,maxwidth:800,imgurls: imagesno,row:3,col:4,isrm:1,ddmaxwidth:200,pagepicnum:countpage,templet:'',userip:'127.0.0.1',redirecturl:'',body:''
                }
                dede_addonimages(addonimages);
                console.log("保存dede_arctiny完成");
                console.log("==================");


                id ++;
                order ++;

                var countImg = detail.length;
                console.log("下载详情照片,共："+countImg+"张。");
                for (var p = 0; p< countImg; p++) {
                    var path = reals[p], src = detail[p];
                    utils.downloadSync(src, dir, path);
                    console.log("详情照片,第"+p+"张下载完成,路径： " + path);
                }

            });
            //console.log(links)
        } catch (e) {
            console.log("Exception:", e);
        }
    }
).run();

//保存archives
function dede_archives(obj){
    //(typeid,typeid2,sortrank,flag,ismake,channel,arcrank,click,money,title,shorttitle,color,writer,source,litpic,pubdate,senddate,mid,keywords,lastpost,scores,goodpost,badpost,voteid,notpost,description,filename,dutyadmin,tackid,mtype,weight)
    var archives = utils.querySync("insert into dede_archives set ?",obj).wait();
    return archives;
}
//保存dede_addonimages
function dede_addonimages(obj){
    //(aid,typeid,pagestyle,maxwidth,imgurls,row,col,isrm,ddmaxwidth,pagepicnum,templet,userip,redirecturl,body) values (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    var uploads = utils.querySync("insert into dede_addonimages set ?",obj).wait();

}
//保存dede_arctiny
function dede_arctiny(obj){
    //(id,typeid,typeid2,arcrank,channel,senddate,sortrank,mid) values (?,?,?,?,?,?,?,?)
    var uploads = utils.querySync("insert into dede_arctiny set ?",obj).wait();

}
//保存uploads
function dede_uploads(obj){
    //(arcid,title,url,mediatype,width,height,playtime,filesize,uptime,mid) values (?,?,?,?,?,?,?,?,?,?)
    var uploads = utils.querySync("insert into dede_uploads set ?",obj).wait();
}

function dede_archives_findOne() {
    var archives = utils.querySync("select id from dede_archives order by id desc limit 1").wait();
    return archives;
}
