/**
 * 带搜索功能的下来列表
 * Created by xingzhizhou on 2015/11/13.
 * http://v3.bootcss.com/components/#input-groups-buttons-dropdowns
 */
define(function (require, exports, module) {
    var ejs = require("ejs");
    var tpl = require("selectlist.tpl");
    var modal = require("modal");

    $.fn.dropdownSelect = function (opt) {
        opt = $.extend({
            inputPlaceholder: '回车查找',
            dropdownText: '选择',
            listHeight: 300, //选择下拉列表高度
            onSelect: null, //选中某一项时触发的事件
            onChange: null, //选择发生变化时触发的事件
            init: null, //初始化下拉列表
            loadDataUrl: '', //加载数据的链接
            searchParamName: 'name' //搜索时的参数名称
        }, opt || {});
        return this.each(function () {
            var selectedItem = {
                text: "",
                val: ""
            };
            var searchData = {};
            var html = new ejs({ text: tpl }).render(opt);
            $(this).html(html);
            var that = this;
            loadData(opt.loadDataUrl, searchData, function (data) {
                that.data = data; //请求数据缓存
                if (opt.init && data) {
                    html = opt.init(data);
                    $(".dropdown-menu", that).html(html);
                }
            });
            $(this).on("click", "li", function () {
                $("li", that).removeClass("active");
                $(this).addClass("active");
                if (opt.onSelect) opt.onSelect(this);
                if (selectedItem.val != val && opt.onChange) opt.onChange(text, val, this);
                var text = $(this).attr("text");
                var val = $(this).attr("value");
                selectedItem.val = val;
                selectedItem.text = text;
            });

            //回车查找
            $("input", this).on("keyup", function (e) {
                e.preventDefault();
                if (e.which == 13) {
                    searchData = {};
                    var name = $.trim($(this).val());
                    name && (searchData[opt.searchParamName] = name);
                    loadData(opt.loadDataUrl, searchData, function (data) {
                        if (!data) {
                            modal.error("查询数据失败！");
                            return false;
                        }

                        if (opt.init && data) {
                            html = opt.init(data);
                            $(".dropdown-menu", that).html(html);
                            $("button", that).click();
                            selectedItem.val = "";
                            selectedItem.text = "";
                        }
                    });
                }
            }).on("blur", function () {
                $(this).val(selectedItem.text);
            });
        });
    };

    /**
     * 获取已经选择的item
     */
    $.fn.getSelectedItem = function () {
        this.each(function () {
            var selectedItem = $("li.active", this);
            return {
                text: selectedItem.attr("text"),
                val: selectedItem.attr("value")
            };
        });
    };

    /**
     * 拉取下拉列表数据
     * @param url 链接
     * @param data 查询参数
      * @param callback
     */
    function loadData(url, data, callback) {
        $.ajax({
            url: url,
            data: data
        }).done(function (data) {
            if (data.retcode == 0) {
                callback(data.data);
            } else {
                callback([]);
            }
        }).fail(function () {
            callback();
        });
    }
});