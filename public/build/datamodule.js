/*
*desc:  新增/编辑/查看数据模板弹出框，使用见各个方法前的注释
		show  查看
		edit 编辑
		create 新增
		
		onCancel 点击取消按钮时候的回调，可选
		onConfirm 点击确定按钮时候的回调，可选 
*author: liuqiao 
 date: 2015/11/19
*/
define(function (require, exports, module) {
	var ejs = require('ejs');
	var tpl = require('datamodule.tpl');
	var modal = require('modal');
	var xss = require('xss');
	var tplModule;
	var ids = []; //dataFormat填写的模板id

	//查看数据模板
	//传模板id：{id:xx}
	exports.show = function (opts) {
		opts = opts || {};
		opts.action = opts.action || 'show';
		loadDataById(opts.id, function (datas) {
			opts.name = datas.name;
			opts.info = datas.info;
			opts.content = datas.content;
			showDataModule(opts);
		});
	};

	//编辑数据模板
	//传模板id：{id:xx}
	exports.edit = function (opts) {
		opts = opts || {};
		opts.action = 'edit';
		this.show(opts);
	};

	//新增数据模板
	//可以不传参数
	exports.create = function (opts) {
		opts = opts || {};
		opts.action = 'create';
		showDataModule(opts);
	};

	//opts
	function showDataModule(opts) {
		var options = {
			txt: { create: '新增', edit: '编辑', show: '查看' },
			action: 'create',
			actionTxt: '新增',
			name: '',
			info: '',
			content: '',
			onCancel: noop,
			onConfirm: noop
		};

		options = extend(options, opts);
		options.actionTxt = options.txt[options.action];
		options.content = showInTexarea(options.content);
		// options.rows = options.content.match(/\n/g).length > 15 ? options.content.match(/\n/g).length : 15;

		if (!tplModule) {
			tplModule = $(new ejs({ text: tpl }).render(options));
			$("body").append(tplModule);
		} else {
			$('.modal-title', tplModule).text(options.actionTxt + '数据模板');
			$('#name', tplModule).val(options.name);
			$('#info', tplModule).val(options.info);
			$('#content', tplModule).val(options.content).attr('rows', options.rows);
		}
		//查看数据模板
		if (options.action == 'show') {
			$('#name,#info,#content', tplModule).attr('disabled', 'disabled');
		} else {
			$('#name,#info,#content', tplModule).removeAttr('disabled');
		}

		$(tplModule).modal();
		//取消按钮
		$('.btn-default', tplModule).off('click').on('click', function () {
			$(tplModule).modal('hide');
			options.onCancel();
		});
		//确认按钮
		$('.btn-primary', tplModule).off('click').on('click', function () {
			confirmCbk.call(options, options.onConfirm);
		});
	};

	function confirmCbk(cbk) {
		//更新或新增数据模板
		function doAction() {
			var opts = extend(this, params);
			//新增数据模版
			if (this.action == 'create') {
				postData('/page/datatpls?action=create', params, function (datas) {
					//retcode 为0 添加成功， 为2 重名了，1添加失败
					if (datas.retcode == 0) {
						$(tplModule).modal('hide');
						cbk && cbk(datas.retcode, opts);
					} else if (datas.retcode == 2) {
						alert('数据模板名字已存在，请重新命名~~');
					} else {
						alert(datas.message);
					}
				});
				//更新数据模版	
			} else if (this.action == 'edit') {
					params.id = this.id;

					postData('/page/datatpls?action=update', params, function (datas) {
						//retcode 为0 添加成功
						if (datas.retcode == 0) {
							$(tplModule).modal('hide');
							cbk && cbk(datas.retcode, opts);
						} else {
							alert('更新数据模版失败，请稍后再试~');
						}
					});
				}
		}

		//查看的不需要任何动作
		if (this.action == 'show') {
			$(tplModule).modal('hide');
			cbk && cbk();
			return;
		}

		var params = {
			name: $('#name', tplModule).val().trim(),
			info: $('#info', tplModule).val().trim(),
			content: $('#content', tplModule).val().trim(),
			type: 1
		};

		if (!params.name) {
			alert('请输入模板名字~');
			return;
		}
		if (!params.info) {
			alert('请输入模板描述~');
			return;
		}

		if (!params.content) {
			alert('请输入模板结构');
			return;
		} else if (!(params.content = vailiContent(params.content))) {
			return;
		}
		isIdsExist(doAction.bind(this));
	}

	function loadDataById(id, callback) {
		getData('/page/datatpls?id=' + id + '&action=review&_t=' + Date.now(), function (datas) {
			if (datas.retcode == 0) {
				callback && callback(datas.data);
			}
		});
	}

	//1.必须是JSON
	//2.name nick 必须填，type可选 默认text，validate 可选（检验是否是正则）
	//3.当type为level，必须有dataFormat，dataFormat为 模板id或者一个对象
	//
	function vailiContent(content, callback) {
		//是何种类型
		function isType(el, type) {
			if (typeof el == 'number' && isNaN(el)) {
				return false;
			}
			return {}.toString.call(el).toLowerCase() === '[object ' + type + ']';
		}
		//检验是否是JSON
		//是，返回 javascript object
		//否，返回 false
		function toJSON(text) {
			try {
				text = window.JSON.parse(text);
			} catch (ex) {
				return false;
			}
			return text;
		}
		//检查必填字段，name  nick
		//未填type,默认为 text
		function checkLogic(object) {
			object.type = object.type || 'text';
			if (!object.name) {
				return '请检查模板JSON结构中存在未填写的name字段~';
			}
			if (!object.nick || !/^[\$_a-zA-Z]/.test(object.nick)) {
				return '请检查模板JSON结构中存在nick字段且是合法的JS标识符~';
			}
			if (!{ 'date': 1, 'text': 1, 'img': 1, 'url': 1, 'select': 1, 'radio': 1, 'checkbox': 1, 'level': 1 }[object.type]) {
				return '请检查是否有非法的type值<br>type可选值为：date,text,img,url,<br>select,radio,checkbox,level';
			}
			if (object.type == 'level') {
				//如果不存在dataFormat
				if (!object.dataFormat) {
					return '请填写dataFormat字段';
					//查询是否存在此 模板id,先存放到 ids数组里
				} else if (isType(+object.dataFormat, 'number')) {
						ids.push(+object.dataFormat);

						//查询是否是合格的JSON	
					} else if (!isType(object.dataFormat, 'array')) {
							return 'dataFormat必须为模板id或对象数组格式';
						}
				//必须和data数组同时出现data:[{name:"", value: ""}...]
			} else if ({ 'select': 1, 'radio:': 1, 'checkbox': 1 }[object.type]) {
					if (!object.data || !Array.isArray(object.data)) {
						return 'type为select/radio/checkbox必须填写data字段~';
					}
					var existNameValue = object.data.every(function (props) {
						return props.name && props.value;
					});
					if (!existNameValue) {
						return '请检查data字段格式是否为"data":[{"name":"",value:""},...]~';
					}
				}
			//validate字段 必须要是正则表达式
			if (object.validate) {
				if (!/^\/.+\/[gmi]?$/.test(object.validate)) {
					return 'validate字段必须为合法的正则表达式~';
				}
			}
			return true;
		}

		var _alertTxt = '';
		//全局变量ids置空
		ids = [];
		//去掉换行符 空白字符
		content = content.replace(/\n/gm, '').replace(/\s+/g, '');
		//如果不是以[开头，]结尾，自动加上再去验证
		if (content.slice(0) != '[' && content.slice(-1) != ']') {
			content = '[' + content + ']';
		}

		if (content = toJSON(content)) {
			content.every(function (object) {
				_alertTxt = checkLogic(object);
				return _alertTxt === true ? true : false;
			});
		} else {
			_alertTxt = '请检查模板结构是合法的JSON格式~';
		}
		isType(_alertTxt, 'string') && alert(_alertTxt);

		return _alertTxt === true ? window.JSON.stringify(content).slice(1, -1) : false;
	}
	//判断模板id是否存在,支持批量，用英文逗号分隔	
	function isIdsExist(callback) {
		if (ids.length == 0) {
			callback && callback();
			return;
		}
		var idsStr = ids.toString();
		getData('/page/datatpls?action=queryexist&id=' + idsStr + '&_t=' + Date.now(), function (json) {
			var rtnIds = [],
			    missIds = [];

			if (json.retcode == 0) {
				if (json.data.length == ids.length) {
					callback && callback();
					//检验说明后台不存在次模板id	
				} else {
						for (var props in json.data) {
							rtnIds.push(json.data.id);
						}
						ids.forEach(function (id) {
							rtnIds.indexOf(id) == -1 && missIds.push(id);
						});
						alert('dataFormat对应的模板id[' + missIds.toString() + ']不存在~');
					}
			} else {
				alert(json.message);
			}
		});
	}

	function extend(target, source) {
		source = source || {};
		for (var key in source) {
			target[key] = source[key];
		}
		return target;
	}

	//增加\n换行显示
	function showInTexarea(text) {

		return text.replace(/\n/gm, '').replace(/(\},)/gm, '$1\n');
	}

	function getData(url, callback) {
		$.get(url, function (d) {
			callback(d);
		});
	}

	function postData(url, data, callback) {
		$.post(url, data, function (d) {
			callback(d);
		});
	}

	function alert(msg, callback) {
		modal.error({
			title: '温馨提示',
			msg: msg,
			onHidden: callback || noop
		});
	}

	function noop() {}
});