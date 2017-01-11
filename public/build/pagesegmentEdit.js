/**
 * 页面片编辑
 * Created by xingzhizhou on 2015/11/13.
 */
define(function (require, exports, module) {
    var modal = require("modal");
    var datamodule = require("datamodule");
    var selectlist = require("selectlist");
    var moment = require("moment");
    var registerForm = document.getElementById('segmentForm');
    var userName = $(registerForm.creator).attr('userName');
    var flag = registerForm.id == "segmentForm"; //创建还是编辑页面片

    exports.init = function () {
        initDataTplList();
        addEvent();
    };

    /**
     * [addEvent description]
     */
    function addEvent() {
        if ($('#addDataModle').prop('checked')) {
            $('#addTplBtn').removeClass().addClass('btn btn-primary');
        }
        //点击自定义数据模板
        $('#addDataModle').click(function (event) {
            if ($(this).prop('checked')) {
                $(registerForm.dataTpl).attr('readonly', false);
                $('#addTplBtn').removeClass().addClass('btn btn-primary');
            } else {
                $(registerForm.dataTpl).attr('readonly', true);
                $('#addTplBtn').removeClass().addClass('btn disabled');
            }
        });
        //表单提交
        $('#submitbtn').click(function (e) {
            var errorMsg = checkForm();
            if (errorMsg) {
                modal.error({
                    title: '温馨提示',
                    msg: errorMsg,
                    onHidden: null
                });
                return false;
            }
            setFormvalue();
            $.ajax({
                type: "POST",
                url: "/page/segmentupdate",
                data: $("#segmentForm").serialize(),
                success: function (data) {
                    if (data.retcode == 0) {
                        updateMysegments(userName, data.id);
                        modal.success({
                            title: '温馨提示',
                            msg: '保存成功！',
                            onHidden: function () {
                                location.href = '/page/segments';
                            }
                        });
                    } else {
                        modal.error({
                            title: '温馨提示',
                            msg: '创建失败',
                            onHidden: function () {
                                location.href = '/page/segments';
                            }
                        });
                    }
                }
            });
        });
        //点击添加到数据模板
        $('#addTplBtn').click(function () {
            if ($('#addDataModle').prop('checked')) {
                addTodata($('#dataTpl').val());
            } else {
                return false;
            }
        });
    }

    /**
     * [updateMysegments 更新pageusers表]
     * @param  {[type]} userName [description]
     * @param  {[type]} data     [description]
     * @return {[type]}          [description]
     */
    function updateMysegments(userName, id) {
        $.ajax({
            url: "/page/updateMysegments",
            data: {
                "userName": userName,
                "id": id
            },
            success: function () {}
        });
    }

    /**
     * [addTodata 添加到数据模板]
     */
    function addTodata(modelcontent) {
        datamodule.create({
            content: modelcontent,
            onConfirm: function (ret) {
                initDataTplList();
                modal.success({
                    msg: '新增数据模板成功~~'
                });
            }
        });
    }

    /**
     * [checkForm 表单参数校验]
     * @return {[type]} [description]
     */
    function checkForm() {
        var errorMsg;
        var validator = new Validator();
        //页面片文件名校验
        validator.add(registerForm.name, [{
            strategy: 'isNonEmpty',
            errorMsg: '页面片文件名不能为空'
        }, {
            strategy: 'isRightname',
            errorMsg: '页面片文件必须以.html或者.shtml结尾'
        }]);
        //页面片描述检验
        validator.add(registerForm.info, [{
            strategy: 'isNonEmpty',
            errorMsg: '页面片描述不能为空'
        }]);
        //数据模板校验
        validator.add(registerForm.dataTpl, [{
            strategy: 'isNonEmpty',
            errorMsg: '数据模板内容不能为空'
        }]);
        //页面片模板校验
        validator.add(registerForm.htmlTemplate, [{
            strategy: 'isNonEmpty',
            errorMsg: '页面片模板内容不能为空'
        }]);
        errorMsg = validator.start();
        return errorMsg;
    }

    /**
     * [setFormvalue 创建和更新页面片表单数值设置]
     */
    function setFormvalue() {
        var nowTime = moment().format("YYYY-MM-DD HH:mm:ss");
        if (!flag) {
            //修改
            $(registerForm.operator).val(userName);
            $(registerForm.modifyTime).val(nowTime);
        } else {
            //创建
            var path = '/' + moment().year() + '/' + moment().month() + '/' + $(registerForm.name).val(),
                dataId;
            $(registerForm.createTime).val(nowTime);
            $(registerForm.modifyTime).val(nowTime);
            $(registerForm.path).val(path);
            $(registerForm.creator).val(userName);
            $(registerForm.operator).val(userName);
        }
        if ($('#addDataModle').prop('checked')) {
            //提交数据模板内容
            $(registerForm.dataTplId).val('');
            //$(registerForm.dataTpl).val();
        } else {
                //提交数据模板id
                $(registerForm.dataTplId).val($('#dataTplSelectList').attr('dataTplId'));
                $(registerForm.dataTpl).val('');
            }
    }

    /**
     * [initDataTplList description]
     * @return {[type]} [description]
     */
    function initDataTplList() {
        $('#dataTplSelectList').dropdownSelect({
            init: function (data) {
                var html = "",
                    $warp = $('#dataTplSelectList');
                if (!data || !data.length) return html;
                data.forEach(function (item) {
                    html += "<li text='" + item.name + "' value='" + item.id + "' content='" + item.content + "'><a href='javascript:void(0)'>" + item.name + "</a></a></li>";
                });
                if (!flag) {
                    for (var i = 0; i < data.length; i++) {
                        if (parseInt($warp.attr('datatplId')) == data[i].id) {
                            $warp.find('input').val(data[i].name);
                            var contenTextarea = $warp.parent('div').next().next();
                            contenTextarea.find('textarea').val(data[i].content);
                            break;
                        }
                    }
                }
                return html;
            },
            onSelect: function (liThis) {
                var $warp = $('#dataTplSelectList');
                $warp.find('input').val($(liThis).attr('text'));
                $warp.attr('dataTplId', $(liThis).attr('value'));
                var contenTextarea = $warp.parent('div').next().next();
                contenTextarea.find('textarea').val($(liThis).attr('content'));
            },
            loadDataUrl: '/page/datatpls/gettpljson',
            inputPlaceholder: '输入模板名称，回车查找'
        });

        if (flag) {
            $('#pageSelectList').dropdownSelect({
                init: function (data) {
                    var html = "";
                    data = data ? data : [];
                    if (!data || !data.length) return html;
                    data.forEach(function (item) {
                        html += "<li text='" + item.name + "' value='" + item.id + "'><a href='javascript:void(0)'>" + item.name + "</a></a></li>";
                    });
                    return html;
                },
                onSelect: function (liThis) {
                    var $warp = $('#pageSelectList');
                    $warp.find('input').val($(liThis).attr('text'));
                    $warp.attr('pageId', $(liThis).attr('value'));
                },
                loadDataUrl: '/page/qrypages',
                inputPlaceholder: '输入页面名称，回车查找'
            });
        }
    }

    /***********************策略对象**************************/
    var strategies = {
        isNonEmpty: function (value, errorMsg) {
            if (value === '') {
                return errorMsg;
            }
        },
        isRightname: function (value, errorMsg) {
            if (/html$/.test(value) == false) {
                return errorMsg;
            }
        }
    };
    /***********************Validator 类**************************/
    var Validator = function () {
        this.cache = [];
    };
    Validator.prototype.add = function (dom, rules) {
        var self = this;
        for (var i = 0, rule; rule = rules[i++];) {
            (function (rule) {
                var strategyAry = rule.strategy.split(':');
                var errorMsg = rule.errorMsg;
                self.cache.push(function () {
                    var strategy = strategyAry.shift();
                    strategyAry.unshift(dom.value);
                    strategyAry.push(errorMsg);
                    return strategies[strategy].apply(dom, strategyAry);
                });
            })(rule);
        }
    };
    Validator.prototype.start = function () {
        for (var i = 0, validatorFunc; validatorFunc = this.cache[i++];) {
            var errorMsg = validatorFunc();
            if (errorMsg) {
                return errorMsg;
            }
        }
    };
});