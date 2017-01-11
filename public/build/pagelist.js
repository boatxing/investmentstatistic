/**
created by jiansuna on 2015/11/05
*/
define(function (require, exports, module) {
	var page = require('pagemodule'); //分页组件
	var dialog = require('modal'); //提示语组件

	var pageSize = 20; //每页条数
	var hasInitPage = false;

	exports.init = function () {
		initPage();
		bindEvent();
	};
	/**
  * 绑定事件
  * */
	function bindEvent() {
		//搜索框绑定回车事件
		$("#searchPageInput").keydown(function (event) {
			if (event.which == "13") {
				event.preventDefault();
				search();
			};
		});
		//绑定搜索按钮的点击事件
		$('#searchPageBtn').click(function () {
			search();
		});
		//绑定删除事件
		$('#pagelistTable').off('click.del').on('click.del', '.btn-del', function () {
			var $selected = $(this).parents('tr');
			delPage($selected);
		});
	}
	/**
  * 分页组件初始化
  * */
	function initPage(pageCount, pageIndex) {
		hasInitPage = true;
		var opt = {
			callback: loadData
		};
		typeof pageCount != 'undefined' && (opt.pageCount = pageCount);
		typeof pageIndex != 'undefined' && (opt.pageIndex = pageIndex);
		$('#pageController').setPage(opt);
	}

	/**
  * 搜索指定页面
  * */
	function search() {
		$('#pageController').empty();
		hasInitPage = false;
		var params = {
			name: $.trim($('#searchPageInput').val()),
			act: 'search'
		};
		$.ajax({
			url: '/page/pagelist',
			data: params,
			dataType: 'json',
			success: function (datas) {
				show(datas.list, datas.pagecount);
			},
			error: function (datas) {
				dialog.error({
					title: '温馨提示',
					msg: datas.responseText,
					onHidden: null //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
				});
			}
		});
	}

	/**
  * 删除指定页面
  * */
	function delPage($selected) {
		var params = {
			pageid: $selected.attr('id')
		};
		//弹出删除确认框
		dialog.confirm({
			title: '温馨提示',
			msg: '确定要删除该页面吗',
			okText: "确定",
			cancelText: "取消",
			onConfirm: function () {
				$.ajax({
					url: '/page/delpage',
					data: params,
					dataType: 'json',
					success: function (datas) {
						dialog.success({
							title: '温馨提示',
							msg: datas.msg,
							onHidden: function () {
								//模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
								window.location.reload();
							}
						});
					},
					error: function (datas) {
						dialog.error({
							title: '温馨提示',
							msg: datas.responseText,
							onHidden: null //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
						});
					}
				});
			}, //点击“确认按钮”时的回调
			onCancel: null //点击“取消按钮”时的回调
		});
	}

	/**
  * 查询分页数据
  * @param pageIndex 页号，从零开始
  * @param callback 如果没有callback，调用show
  */
	function loadData(pageIndex, callback) {
		$.ajax({
			url: '/page/pagelist',
			data: { act: 'search', pageIndex: pageIndex, pageSize: pageSize, name: $.trim($('#searchPageInput').val()) },
			success: function (data) {
				callback ? callback(data.list) : show(data.list, data.pagecount, pageIndex);
			},
			error: function () {
				dialog.error("拉取数据失败！");
			}
		});
	}

	/**
  * 显示分页
  * @param data 分页数据
  * @param count 总的页数
  */
	function show(data, pageCount) {
		$('#pagelistTable tbody').html(data);
		$('#pageController').attr('pagecount', pageCount);
		!hasInitPage && initPage();
		window.scrollTo(0, 0);
	}
});