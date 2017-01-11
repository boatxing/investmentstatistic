/**
 created by jiansuna on 2015/11/18
 */
define(function (require, exports, module) {
    var ejs = require("ejs");
    var modal = require('modal'); //提示语组件
    var tpl = require('pagecreate.tpl'); //模版文件

    var pageid = window.location.search.slice(1).split('=')[1];
    var _segmentIds = '';
    var _hasTriggerSelect = false;

    exports.init = function () {
        initPage();
        bindEvent();
    };

    /**
     * 绑定事件
     * */
    function bindEvent() {
        //创建页面
        $('#createPageBtn').click(function () {
            createPage();
        });
        //搜索页面片
        $('#searchSegmentsBtn').click(function () {
            qrySegments({ 'name': $.trim($('#searchSegmentsInput').val()) });
        });
        //搜索框页面片绑定回车事件
        $("#searchSegmentsInput").keydown(function (event) {
            if (event.which == "13") {
                event.preventDefault();
                qrySegments({ 'name': $.trim($('#searchSegmentsInput').val()) });
            };
        });

        //选择页面片
        $('#segmentsBox, #segmentsSelected').on('click', '.list-group li', function () {
            $(this).toggleClass("selected");
        });
        $('#undo_redo_right').on('click', function (e) {
            e.preventDefault();
            moveToRight();
        });
        $('#undo_redo_left').on('click', function (e) {
            e.preventDefault();
            moveToLeft();
        });
        //双击移动
        $('#segmentsBox').on('dblclick', 'li', function () {
            $(this).addClass('selected').siblings().removeClass('selected');
            moveToRight();
        });
        $('#segmentsSelected').on('dblclick', 'li', function () {
            $(this).addClass('selected').siblings().removeClass('selected');
            moveToLeft();
        });
    }

    /**
     *
     *初始化页面信息
     * */
    function initPage() {
        if (typeof pageid !== 'undefined') {
            //此时为修改动做，要根据id查询该页面信息
            qryPageInfo();
        } else {
            qrySegments();
        }
    }

    /**
     * 查询page信息
     * */
    function qryPageInfo() {
        $.ajax({
            url: '/page/qryPageById',
            data: { 'pageid': pageid },
            dataType: 'json',
            success: function (datas) {
                //渲染对应的页面信息
                renderPage(datas.data[0]);
                //根据segmentIds查询页面所包含的信息
                _segmentIds = datas.data[0].segmentIds;
                qrySegments();
            },
            error: function (datas) {
                modal.error({
                    title: '温馨提示',
                    msg: datas.responseText,
                    onHidden: null //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
                });
            }
        });
    }

    /**
     *渲染页面信息
     * */
    function renderPage(data) {
        $('#pageName').val(data.name);
        $('#pageUrl').val(data.url);
        $('#expireDay').val(data.expireDays);
        $('#editor').val(data.editor);
        $('#publisher').val(data.publisher);
    }

    /**
     *查询页面片
     * */
    function qrySegments(params) {
        $.ajax({
            url: '/page/segmentsjson',
            data: params,
            dataType: 'json',
            success: function (datas) {
                show(datas.data);
            },
            error: function (datas) {
                modal.error({
                    title: '温馨提示',
                    msg: datas.responseText,
                    onHidden: null //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
                });
            }
        });
    }

    /**
     * 创建页面
     * */
    function createPage() {
        var segmentIds = [];
        var $selected = $('#segmentsSelected').find('li');
        var curTime = new Date().getFullYear() + '-' + zeroNum(new Date().getMonth() + 1) + '-' + zeroNum(new Date().getDate()) + ' ' + zeroNum(new Date().getHours()) + ':' + zeroNum(new Date().getMinutes()) + ':' + zeroNum(new Date().getSeconds());
        for (var i = 0, len = $selected.length; i < len; i++) {
            segmentIds.push($selected.eq(i).attr('segmentid'));
        }

        var params = {
            name: $.trim($('#pageName').val()),
            url: $.trim($('#pageUrl').val()),
            creator: 'xingzhizhou',
            expireDays: $.trim($('#expireDay').val()),
            editor: $.trim($('#editor').val()),
            publisher: $.trim($('#publisher').val()),
            segmentIds: segmentIds.join('|'),
            createTime: curTime,
            modifyTime: curTime,
            isDel: 0
        };
        if (params.name == '') {
            modal.error({
                title: '温馨提示',
                msg: '请输入页面名称',
                onHidden: function () {
                    $('#pageName').focus();
                }
            });
            return;
        }
        if (pageid != '') {
            params.id = pageid;
        }
        $.ajax({
            url: '/page/pagecreateact',
            data: params,
            dataType: 'json',
            success: function (datas) {
                modal.success({
                    title: '温馨提示',
                    msg: datas.msg,
                    onHidden: function () {
                        //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
                        window.location.href = '/page/pagelist';
                    }
                });
            },
            error: function (datas) {
                modal.error({
                    title: '温馨提示',
                    msg: datas.responseText,
                    onHidden: null //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
                });
            }
        });
    }

    /**
     *选择页面片
     * */
    function moveToRight() {
        _hasTriggerSelect = true;
        var $selectedSegments = $('#segmentsBox').find('.list-group li.selected').filter(function (index) {
            var curSegmentId = $('#segmentsBox').find('.list-group li.selected').eq(index).attr('segmentid');
            return $('#segmentsSelected').find('li[segmentid=' + curSegmentId + ']').length == 0;
        });
        if ($selectedSegments.length == 0) return;
        //复制元素
        var $toMoveSegments = [];
        for (var i = 0, len = $selectedSegments.length; i < len; i++) {
            $toMoveSegments.push("<li class=\"list-group-item\" segmentid=\"" + $selectedSegments.eq(i).attr("segmentid") + "\" title=\"" + $selectedSegments.eq(i).attr("title") + "\">" + $selectedSegments.eq(i).attr("title") + "</li>");
        }
        $selectedSegments.hide().removeClass('selected');
        if ($('#segmentsSelected').find('ul').length == 0) {
            $('#segmentsSelected').find('.panel.panel-default').remove();
            $('#segmentsSelected').append('<ul class="list-group" style="overflow-y: scroll;width: 220px;height: 216px;overflow-x: hidden;"></ul>');
        }
        $('#segmentsSelected').find('ul').append($toMoveSegments.join(''));
    }

    /**
     *移除所选页面片
     * */
    function moveToLeft() {
        var $selectedSegments = $('#segmentsSelected').find('.list-group li.selected');
        for (var i = 0, len = $selectedSegments.length; i < len; i++) {
            var curSegmentId = $selectedSegments.eq(i).attr('segmentId');
            $('#segmentsBox').find('li[segmentid="' + curSegmentId + '"]').show();
            $selectedSegments.eq(i).remove();
        }
        if ($('#segmentsSelected').find('.list-group li').length == 0) {
            $('#segmentsSelected').find('.list-group').remove();
            $('#segmentsSelected').append('<div class="panel panel-default"><div class="panel-body" style="height: 223px;"></div></div>');
        }
    }

    /**
     * 显示所查询的页面片
     * */
    function show(data) {
        var tplhtml = $(new ejs({ text: tpl }).render({ 'data': data }));
        $('#pageSegmentsBox').html(tplhtml);
        if (_segmentIds !== '') {
            //选择
            var segmentArr = _segmentIds.split('|');
            for (var i = 0, len = segmentArr.length; i < len; i++) {
                $('#pageSegmentsBox').find('li[segmentid=' + segmentArr[i] + ']').addClass('selected');
            }
            !_hasTriggerSelect && moveToRight();
        }
    }

    /**
     *处理时间
     * */
    function zeroNum(data) {
        data = data.toString();
        if (data.length < 2) {
            return '0' + data;
        } else {
            return data;
        }
    }
});