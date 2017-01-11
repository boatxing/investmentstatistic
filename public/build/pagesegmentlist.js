/**
 * Created by xingzhizhou on 2015/11/4.
 */
define(function (require, exports, module) {
    var page = require("pagemodule");
    var modal = require("modal");
    //页面片名称
    var name = null;
    //每页条数
    var pageSize = 15;
    //总页数
    var count = 0;

    exports.init = function () {
        initPage();

        addEvent();
    };

    function addEvent() {
        //搜索页面片
        $('#searchBtn').on('click', function () {
            name = $.trim($('#nameInput').val());
            loadData(0, function (data) {
                show(data.pageHtml);
                initPage(data.pageCount, 0);
            });
        });
    }

    /**
     * 查询分页数据
     * @param pageIndex 页号，从零开始
     * @param callback 如果没有callback，调用show
     */
    function loadData(pageIndex, callback) {
        $.ajax({
            url: '/page/segmentspagejson',
            data: { pageIndex: pageIndex, pageSize: pageSize, name: name },
            success: function (data) {
                if (data.retcode != 0) {
                    modal.error(data.message);
                    return false;
                }
                callback ? callback(data) : show(data.pageHtml, data.pageCount, pageIndex);
            },
            error: function () {
                modal.error("拉取数据失败！");
            }
        });
    }

    /**
     * 显示分页
     * @param data 分页数据
     * @param count 总的页数
     */
    function show(pageHtml, pageCount, pageIndex) {
        $('#segmentlist').html(pageHtml);

        //在翻页的过程中总页数发生变化，初始化分页
        if (pageCount && pageCount != count) {
            count = pageCount;
            initPage(count, pageIndex);
        }
    }

    /**
     * 初始化分页组件
     * @param pageCount 总页数
     * @param pageIndex 当前页号
     */
    function initPage(pageCount, pageIndex) {
        var opt = {
            callback: function (index) {
                loadData(index);
            }
        };

        typeof pageCount != 'undefined' && (opt.pageCount = pageCount);
        typeof pageIndex != 'undefined' && (opt.pageIndex = pageIndex);
        $('#pageController').setPage(opt);
    }
});