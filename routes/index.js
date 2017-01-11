/**
 * 页面内容router
 * @author zerahuang(huangshaolu)
 * @version 2015/12/13
 * @description
 */
var express = require('express');
var router = express.Router();
var app = express();
var xlsx = require('node-xlsx');
var fs = require("fs");
var multiparty = require('multiparty');
var logger = require("../src/utils/log").logger("pagecontent");

router.get("/", function(req, res, next){
	logger.info("/");
	res.render("fileUpload", {title: "请上传文件"});
});

/**
 * 页面片数据导出excel
 */
router.post('/excelExport', function(req, res, next){
	logger.info('/excelExport');
	//页面片数据
	//拼接pageData
	var pageData = "";
	var pageDataIndex = req.body.pageDataIndex;
	for(var i = 0; i < pageDataIndex; i++){
		logger.info("pageDateIndex", i);
		pageData += req.body["pageData" + i];
	}
	logger.info("parse pageData");
	pageData = JSON.parse(pageData);
	//数据模板
	var pageFormat = JSON.parse(decodeURIComponent(req.body.pageFormat));
	//页面片id
	var pageId = req.body.pageId;
	var path = req.body.path;
	logger.info("pageId=", pageId);
	logger.info("path=", path);
	var ppmsItemName = req.body.ppmsItemName;
	//生成excel data
	var excelData = pagecontentmodel.getSegmentExcelData(pageData, pageFormat, pageId, path);
	//logger.debug(excelData);
	logger.info("xlsx build");
	//生成excel
	var buffer = xlsx.build([{name: decodeURIComponent(ppmsItemName), data: excelData}]);

	logger.info("send");
	res.set({
		'Content-Type': 'application/vnd.openxmlformats;charset=utf8',
		"Content-Disposition": "attachment; filename=" + pageId +"-" + ppmsItemName +".xlsx"
	})
	res.send(buffer);
})

/**
 * 获取excel数据
 */
router.post('/excelImport', function(req, res, next){
	logger.info("/excelImport");
	//生成multiparty对象，并配置上传目标路径
	var form = new multiparty.Form({uploadDir: './public/files/'});
	logger.info("上传完成")
	//上传完成后处理
	form.parse(req, function(err, fields, files) {
		if(err){
			logger.error("上传失败", err);
			res.json({retcode: 1, message: '上传失败,' + err});
			return false;
		}

		var file = files.file[0];
		fs.readFile(file.path, function(err, content) {
			if(err){
				logger.error("读取excel失败");
				res.json({retcode: 2, message: '读取excel失败'});
				return false;
			}
			logger.info("parse", file.originalFilename);
			var list = xlsx.parse(content);

			logger.info("读取文件内容成功", list.length);
			//logger.info("excel 文件内容", list);

			res.set({
				'Content-Type': 'application/vnd.openxmlformats;charset=utf8',
				"Content-Disposition": "attachment; filename=xxx.xlsx"
			})
			res.send(operate(list));
		});
	});
});

function operate(list){
	console.log("operate");
	//买断式数据导入表

	//债券评级表
	//质押式
	for(var i of list){
		console.log(i.name);
	}
	return "";
}

module.exports = router;