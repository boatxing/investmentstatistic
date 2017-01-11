/**
 * Created by kejunsheng on 2015/11/5.
 */
define(function (require, exports, module) {
	var page = require("pagemodule");
	var tableData = {
		pageIndex: 0,
		pageSize: 20,
		name: ''
	};
	var radioGroup = null;

	exports.init = function () {
		//初始化分页组件
		initPage();
		//绑定事件
		bindEvent();
		//初始化
		initRadio();
	};

	/**
  * 初始化分页组件
     * @param pageCount 总页数
  */
	function initPage(pageCount) {
		var opt = {
			callback: function (pageIndex) {
				tableData.pageIndex = pageIndex * 1.0;
				getTableData();
			}
		};
		typeof pageCount != 'undefined' && (opt.pageCount = pageCount);
		$('#pageController').setPage(opt);
	}

	function initRadio() {
		//radio的参数配置
		var radioOption = {
			nodeid: "radiogroup",
			type: "radio", //checkbox、radio
			shape: 'circular', //square(方形)、circular(圆形)
			skin: 1, //1、2、3
			content: [{
				text: '运营权限',
				param: '0',
				checked: true
			}, {
				text: '开发权限',
				param: '1'
			}],
			checkEv: function (_param) {}
		};
		radioGroup = new srtcheck(radioOption); //创建选择组件
		radioGroup.init(); //进行初始化
	}

	/**
  * 绑定事件
  */
	function bindEvent() {
		$('#search').off().on('click', function () {
			//获取查询条件
			var text = $('#searchtext').val();
			if (text == '') {
				//设置额外参数为空
				tableData.name = "";
			} else {
				//设置额外参数
				tableData.name = "%" + text + "%";
			}
			tableData.pageIndex = 0;
			getTableData(function (result) {
				initPage(result.count);
			});
		});
		$('#btn-add').off().on('click', function () {
			//获取ERP帐号数据
			var text = $('#erpname').val();
			if (!text) {
				//没有输入ERP帐号
				alert("请输入ERP帐号");
				return;
			}
			//增加ERP帐号到数据库
			addERP(text, radioGroup.getDate());
		});
		$('#dataTable a').off().on('click', function () {
			var _this = this;
			//更新ERP帐号权限到数据库
			upRole(function () {
				$(_this).parent().prev().html("开发权限");
				$(_this).remove();
			}, $(this).attr('param'));
		});
	}

	/**
  * 根据分页按钮来查询数据的数据
  */
	function getTableData(callback) {
		$.ajax({
			type: "GET",
			url: location.href + "/list",
			data: tableData,
			dataType: "json",
			success: function (result) {
				if (result.retcode != 0) {
					alert(result.msg);
				} else {
					$('#dataTable tbody tr').remove();
					$('#dataTable tbody').append(result.list);
					bindEvent();
					callback && callback(result);
				}
			},
			error: function () {
				alert('操作失败');
			}
		});
	}

	/**
  * 根据id来更新用户的权限
  * @param callback         回调函数
  * @param id               ERP帐号的ID
  */
	function upRole(callback, id) {
		$.ajax({
			type: "GET",
			url: location.href + "/updaterole",
			data: {
				id: id
			},
			dataType: "json",
			success: function (result) {
				if (result.retcode == 0) {
					callback();
				} else {
					alert(result.msg);
				}
			}
		});
	}

	/**
  * 增加ERP帐号
  * @param name             增加的ERP帐号
  * @param role             新增加的ERP帐号对应的权限
  */
	function addERP(name, role) {
		$.ajax({
			type: "GET",
			url: location.href + "/add",
			data: {
				name: name,
				role: role
			},
			dataType: "json",
			success: function (result) {
				alert(result.msg);
				if (result.retcode == 0) {
					location.reload();
				}
			}
		});
	}
});

//选择组件
function srtcheck(opt) {
	this._option = {
		nodeid: "",
		type: "checkbox",
		shape: 'square',
		skin: 1,
		content: [],
		checkEv: function () {},
		noCheckEv: function () {}
	};
	this._tpl = '<li class="srt-{shape}"><span></span><div class="srt-text">{text}</div></li>';
	//判断传递过来的option
	if (typeof opt != "object") {
		opt = {};
	}
	//拼接option
	for (var item in this._option) {
		opt[item] && (this._option[item] = opt[item]);
	}
	//获取父节点
	if (typeof this._option.nodeid == "string") {
		this._option.nodeid = $("#" + this._option.nodeid);
	} else {
		this._option.nodeid = $(this._option.nodeid);
	}
}
//初始化函数
srtcheck.prototype.init = function () {
	var _ul = this.createBody();
	this._option.nodeid.append(_ul);
	this.bindEvent();
};
//初始化body
srtcheck.prototype.createBody = function () {
	var _this = this;
	var _ul = $('<ul class="srt-ul"></ul>');
	var shape = this._option.shape;
	this._option.content.forEach(function (item) {
		var tpl = $(_this._tpl.replace('{shape}', shape).replace('{text}', item.text));
		if (item.param) {
			$(tpl).find('span').attr("t_param", item.param);
		}
		if (item.checked) {
			$(tpl).find('span').addClass('checked' + _this._option.skin);
		}
		$(_ul).append(tpl);
	});
	return _ul;
};
//绑定事件
srtcheck.prototype.bindEvent = function () {
	var _this = this;
	var shape = this._option.shape;
	var skin = 'checked' + this._option.skin;
	var type = this._option.type;
	if (type == 'checkbox') {
		this._option.nodeid.find('span').off().on("click", function () {
			var param = $(this).attr('t_param');
			if ($(this).hasClass(skin)) {
				$(this).removeClass(skin);
				_this._option.noCheckEv(param);
			} else {
				$(this).addClass(skin);
				_this._option.checkEv(param);
			}
		});
	} else {
		this._option.nodeid.find('span').off().on("click", function () {
			if (!$(this).hasClass(skin)) {
				var param = $(this).attr('t_param');
				_this._option.nodeid.find('span').removeClass(skin);
				$(this).addClass(skin);
				_this._option.checkEv(param);
			}
		});
	}
};
//获取数据
srtcheck.prototype.getDate = function () {
	if (this._option.type == "radio") {
		//radio的情况
		var data = this._option.nodeid.find('.checked' + this._option.skin).attr('t_param');
		return data;
	}
};