/**
 * Created by liuqiao on 2015/11/15.
 */
define(function (require, exports, module) {
	var page = require("pagemodule");
	var modal = require("modal");
	var datamodule = require("datamodule");

	var datatpl = {
		isSearching: false, //是否点击了搜索
		size: 3 //每页大小 TODO
	},
	    self = datatpl;
	datatpl.addEvent = function () {

		//创建
		$('#create_module').click(function () {
			datamodule.create({
				onConfirm: function (ret) {
					self.isSearching = false;
					loadDataPerPage(0, function () {
						modal.success({ msg: '新增数据模板成功~~' });
						self.initPager();
					});
				}
			});
		});

		//搜索
		$('#search_txt').keyup(function (e) {
			if (e.which == 13) {
				$('#search_btn').click();
			}
		});

		$('#search_btn').click(function () {
			//点击了搜索
			self.isSearching = true;
			var txt = encodeURIComponent($('#search_txt').val().trim());
			loadData('/page/datatpls?action=search&txt=' + txt + '&_t=' + Date.now(), function (datas) {
				if (datas.retcode == 0) {
					$('tbody').html(datas.data);
					$('#pageController').attr('pagecount', datas.pageCount);
					self.initPager();
				}
			});
		});

		$(document.body).on('click', '[data-action]', function () {
			var $elem = $(this);
			var action = $elem.attr('data-action');
			var id = $elem.attr('data-id');
			if (action == 'delete') {
				modal.confirm({
					msg: '确认删除该条数据模版？',
					onCancel: noop,
					onConfirm: function () {
						loadData('/page/datatpls?id=' + id + '&action=delete&_t=' + Date.now(), function (datas) {
							if (datas.retcode == 0) {
								loadDataPerPage(0, function () {
									modal.success({ msg: '删除成功' });
									self.initPager();
								});
							} else if (datas.retcode == 1) {
								modal.error({ msg: '删除失败，请稍后再试~' });
							}
						});
					}
				});
				//编辑	
			} else if (action == 'edit') {
					datamodule.edit({
						id: id,
						onConfirm: function (ret, opts) {
							modal.success({ msg: '更新数据模板成功~~' });
							$elem.closest('tr').html('<td>' + id + '</td><td>' + opts.name + '</td><td>' + opts.info + '</td><td>xingzhizhou</td><td>' + now() + '</td><td class="center "><a class="btn btn-info" data-action="edit" data-id="' + id + '" title="编辑"><i class="fa fa-edit "></i></a><a class="btn btn-danger" data-action="delete" data-id="' + id + '" title="删除"><i class="fa fa-trash-o "></i></a></td>');
						}
					});
					//查看	
				} else if (action == 'review') {
						datamodule.show({ id: id });
					}
		});
	};

	/**
    * 初始化分页组件
    * @param pageCount 总页数
    * @param pageIndex 当前页号
    */
	datatpl.initPager = function (pageCount, pageIndex) {

		var opt = {
			callback: loadDataPerPage
		};

		typeof pageCount != 'undefined' && (opt.pageCount = pageCount);
		typeof pageIndex != 'undefined' && (opt.pageIndex = pageIndex);
		$('#pageController').setPage(opt);
	};

	exports.init = function () {

		datatpl.initPager();
		datatpl.addEvent();
	};

	//按页码加载数据
	function loadDataPerPage(index, cbk) {
		var txt = '',
		    url = '';
		//是否点击了搜索	
		if (self.isSearching) {
			txt = encodeURIComponent($('#search_txt').val().trim());
			url = '/page/datatpls?action=search&txt=' + txt + '&start=' + index + '&size=' + self.size + '&_t=' + Date.now();
		} else {
			url = '/page/datatpls?action=get&start=' + index + '&size=' + self.size + '&_t=' + Date.now();
		}

		loadData(url, function (datas) {
			if (datas.retcode == 0) {
				$('tbody').html(datas.data);
				datas.pageCount && $('#pageController').attr('pagecount', datas.pageCount);
				cbk && cbk();
			}
		});
	}

	function loadData(url, callback) {
		$.getJSON(url, function (d) {
			callback(d);
		});
	}
	//格式化当前时间
	function now() {
		var d = new Date();
		return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ' ' + ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2);
	}

	function noop() {}
});