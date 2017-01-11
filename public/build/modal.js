/**
 * 弹出对话框
 * Created by xingzhizhou on 2015/11/11.
 modal.info({
    title: '温馨提示',
	msg: '',
	onHidden: null //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
});
 modal.success({
    title: '温馨提示',
	msg: '',
	onHidden: null //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
});
 modal.error({
    title: '温馨提示',
	msg: '',
	onHidden: null //模态框被隐藏（并且同时在 CSS 过渡效果完成）之后被触发
});
 modal.confirm({
    title: '温馨提示',
	msg: '',
	okText: "确定",
    cancelText: "取消",
	onConfirm: null, //点击“确认按钮”时的回调
    onCancel: null //点击“确认按钮”时的回调
});
 modal.pop(id)    //居中弹出提示框

 modal.info(""); 直接传输msg参数
 */
define(function (require, exports, module) {
    var tpl = require("modal.tpl");
    var ejs = require("ejs");
    var infoModal = null;
    var successModal = null;
    var errorModal = null;
    var confirmModal = null;

    module.exports = {
        confirm: confirm,
        info: info,
        success: success,
        error: error
    };

    function info(opt) {
        if (typeof opt == "string") {
            opt = {
                msg: opt
            };
        }
        opt.type = 'info';
        opt.title = opt.title || "温馨提示";
        if (!infoModal) {
            infoModal = $(new ejs({ text: tpl }).render(opt));
            $("body").append(infoModal);
        } else {
            $('.modal-title', infoModal).text(opt.title);
            $('.modal-body', infoModal).html("<div class='alert alert-info' role='alert'>" + opt.msg + "</div>");
        }

        var marginTop = ($(window).height() - (opt.height || 220)) / 2 - 50;
        $('.modal-dialog', infoModal).css("marginTop", marginTop);
        $(infoModal).modal();
        //隐藏的回调事件
        if (opt.onHidden) {
            $(infoModal).off('hidden.bs.modal');
            $(infoModal).on('hidden.bs.modal', opt.onHidden);
        }

        return infoModal;
    }

    function success(opt) {
        if (typeof opt == "string") {
            opt = {
                msg: opt
            };
        }
        opt.type = 'success';
        opt.title = opt.title || "温馨提示";
        if (!successModal) {
            successModal = $(new ejs({ text: tpl }).render(opt));
            $("body").append(successModal);
        } else {
            $('.modal-title', successModal).text(opt.title);
            $('.modal-body', successModal).html("<div class='alert alert-success' role='alert'>" + opt.msg + "</div>");
        }

        var marginTop = ($(window).height() - (opt.height || 220)) / 2 - 50;
        $('.modal-dialog', successModal).css("marginTop", marginTop);
        $(successModal).modal();
        //隐藏的回调事件
        if (opt.onHidden) {
            $(successModal).off('hidden.bs.modal');
            $(successModal).on('hidden.bs.modal', opt.onHidden);
        }

        return successModal;
    }

    function error(opt) {
        if (typeof opt == "string") {
            opt = {
                msg: opt
            };
        }
        opt.type = 'error';
        opt.title = opt.title || "温馨提示";
        if (!errorModal) {
            errorModal = $(new ejs({ text: tpl }).render(opt));
            $("body").append(errorModal);
        } else {
            $('.modal-title', errorModal).text(opt.title);
            $('.modal-body', errorModal).html("<div class='alert alert-danger' role='alert'>" + opt.msg + "</div>");
        }

        var marginTop = ($(window).height() - (opt.height || 220)) / 2 - 50;
        $('.modal-dialog', errorModal).css("marginTop", marginTop);
        $(errorModal).modal();
        //隐藏的回调事件
        if (opt.onHidden) {
            $(errorModal).off('hidden.bs.modal');
            $(errorModal).on('hidden.bs.modal', opt.onHidden);
        }

        return errorModal;
    }

    function confirm(opt) {
        if (typeof opt == "string") {
            opt = {
                msg: opt
            };
        }
        var isConfirm = 0;
        opt.type = 'confirm';
        opt.title = opt.title || "温馨提示";
        opt.okText = opt.okText || "确定";
        opt.cancelText = opt.cancelText || "取消";
        if (!confirmModal) {
            confirmModal = $(new ejs({ text: tpl }).render(opt));
            $("body").append(confirmModal);
        } else {
            $('.modal-title', confirmModal).text(opt.title);
            $('.modal-body', confirmModal).html("<div class='alert alert-info' role='alert'>" + opt.msg + "</div>");
            $('.btn-primary', confirmModal).text(opt.okText);
            $('.btn-default', confirmModal).text(opt.cancelText);
        }

        var marginTop = ($(window).height() - (opt.height || 220)) / 2 - 50;
        $('.modal-dialog', confirmModal).css("marginTop", marginTop);
        $(confirmModal).modal();
        if (opt.onCancel || opt.onConfirm) {
            $(confirmModal).off("hidden.bs.modal").on("hidden.bs.modal", function () {
                !isConfirm ? opt.onCancel() : opt.onConfirm();
                isConfirm = 0;
            });
            $('.btn-primary', confirmModal).off("click").on("click", function () {
                isConfirm = 1;
                $(confirmModal).modal('hide');
            });
        }

        return confirmModal;
    }
});