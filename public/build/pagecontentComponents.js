//内容item
"use strict";

var ContentItem = React.createClass({
    displayName: "ContentItem",

    edit: function edit() {
        pubsubflux.publish("contentItemEdit", this.props.data.pageId, this.props.data.path);
    },
    moveUp: function moveUp() {
        pubsubflux.publish("contentItemMove", this.props.data.pageId, this.props.data.path, 0);
    },
    moveDown: function moveDown() {
        pubsubflux.publish("contentItemMove", this.props.data.pageId, this.props.data.path, 1);
    },
    moveTop: function moveTop() {
        pubsubflux.publish("contentItemMove", this.props.data.pageId, this.props.data.path, 2);
    },
    moveBottom: function moveBottom() {
        pubsubflux.publish("contentItemMove", this.props.data.pageId, this.props.data.path, 3);
    },
    del: function del() {
        pubsubflux.publish("contentItemDel", this.props.data.pageId, this.props.data.path);
    },
    render: function render() {
        var ppmsItemData = this.props.data;
        var display = ppmsItemData.show == 1 ? '' : ppmsItemData.show == 0 ? 'none' : '';
        return React.createElement("tr", { className: "o_tableceil", id: ppmsItemData.ppmsItemId, style: { display: display } }, React.createElement("td", null, ppmsItemData.ppms_itemName), React.createElement("td", { className: "text-center" }, React.createElement("a", { href: "javascript:void(0)", operate: "o_top", onClick: this.moveTop }, React.createElement("span", { className: "fa fa-arrow-circle-up" })), "  ", React.createElement("a", { href: "javascript:void(0)", operate: "o_bottom", onClick: this.moveBottom }, React.createElement("span", { className: "fa fa-arrow-circle-down" })), "  ", React.createElement("a", { href: "javascript:void(0)", operate: "o_up", onClick: this.moveUp }, React.createElement("span", { className: "fa fa-arrow-up" })), "  ", React.createElement("a", { href: "javascript:void(0)", operate: "o_down", onClick: this.moveDown }, React.createElement("span", { className: "fa fa-arrow-down" })), "  ", React.createElement("a", { href: "javascript:void(0)", operate: "o_del", onClick: this.del }, React.createElement("span", { className: "fa fa-times" })), "    ", React.createElement("a", { href: "javascript:void(0)", "data-toggle": "modal", tag: "o_table_edit", onClick: this.edit }, "编辑")));
    }
});

//内容表
var ContentTable = React.createClass({
    displayName: "ContentTable",

    render: function render() {
        return React.createElement("table", { className: "table table-bordered table-condensed table-hover table-striped" }, React.createElement("tbody", { className: "listbody" }, this.props.pageData.map(function (item, index) {
            return React.createElement(ContentItem, { key: item.ppmsItemId, data: item });
        })));
    }
});

//页面片panel
var SegmentPanel = React.createClass({
    displayName: "SegmentPanel",

    getInitialState: function getInitialState() {
        return { fold: 1 };
    },
    componentDidMount: function componentDidMount() {
        //锁定
        pubsubflux.subscribe("editLock", function (lockUser) {}.bind(this));

        //展开
        pubsubflux.subscribe("SegmentPanelUnfold", function () {
            console.log("SegmentPanelUnfold subscribe");
            this.setState({ fold: 0 });
            pubsubflux.publish("ContentTableunFold", this.props.page.pageInfo.id);
        }.bind(this));
    },
    componentWillUnmount: function componentWillUnmount() {
        pubsubflux.unsubscribe("editLock");
    },
    addItem: function addItem() {
        console.log("publish contentformaddlevel1", this.props.page.pageInfo.id);
        pubsubflux.publish("contentformaddlevel1", this.props.page.pageInfo.id);
    },
    foldToggle: function foldToggle() {
        console.log("foldToggle", this.state.fold);
        var fold = this.props.page.pageData.length <= 10 ? 0 : this.state.fold == 0 ? 1 : 0;
        this.setState({ fold: fold });
        if (fold == 0) {
            pubsubflux.publish("ContentTableunFold", this.props.page.pageInfo.id);
        } else {
            pubsubflux.publish("ContentTableFold", this.props.page.pageInfo.id);
        }
    },
    "delete": function _delete() {
        console.log("SegmentPanelDel", this.props.page.pageInfo.id);
        pubsubflux.publish("SegmentPanelDel", this.props.page.pageInfo.id);
    },
    save: function save() {},
    toGamma: function toGamma() {},
    toIdc: function toIdc() {},
    edit: function edit(index) {},
    render: function render() {
        var page = this.props.page;
        var fold = this.state.fold == 1 && page.pageData.length > 10 ? 'fa fa-angle-up' : 'fa fa-angle-down';
        var foldDisabled = page.pageData.length > 10 ? "" : "disabled";
        return React.createElement("li", { id: page.pageInfo.id }, React.createElement("div", { className: "box" }, React.createElement("header", null, React.createElement("div", null, React.createElement("h5", null, page.pageInfo.name, React.createElement("span", { className: "label label-warning" }, "被", page.pageInfo.lockuser, "锁定"))), React.createElement("div", { className: "toolbar text-right" }, React.createElement("div", { className: "btn-group" }, React.createElement("a", { href: "javascript:void(0)", disabled: foldDisabled, className: "btn btn-default btn-sm", "data-placement": "bottom", "data-toggle": "tooltip", onClick: this.foldToggle }, React.createElement("i", { className: fold })), React.createElement("a", { className: "btn btn-danger btn-sm", "data-placement": "bottom", onclick: this["delete"], "data-original-title": "删除", "data-toggle": "tooltip", onClick: this["delete"] }, React.createElement("i", { className: "fa fa-times" }))))), React.createElement("div", { className: "body" }, React.createElement(ContentTable, { pageData: page.pageData })), React.createElement("footer", null, React.createElement("div", { className: "row" }, React.createElement("div", { className: "col-sm-8" }, React.createElement("div", { className: "btn-group" }, React.createElement("a", { href: "javascript:void(0)", className: "btn btn-primary btn-sm", "data-placement": "bottom", "data-original-title": "保存", "data-toggle": "tooltip", tag: "publish", from: "local", to: "dev", segmentid: "17" }, React.createElement("span", { className: "fa fa-save" }), " 保存"), React.createElement("a", { href: "javascript:void(0)", className: "btn btn-primary btn-sm", "data-placement": "bottom", "data-original-title": "发布GAMMA", "data-toggle": "tooltip", tag: "publish", from: "dev", to: "gamma", segmentid: "17" }, React.createElement("span", { className: "glyphicon glyphicon-cloud-upload" }), " 发布GAMMA"), React.createElement("a", { href: "javascript:void(0)", className: "btn btn-warning btn-sm", "data-placement": "bottom", "data-original-title": "发布IDC", "data-toggle": "tooltip", tag: "publish", from: "gamma", to: "idc", segmentid: "17" }, React.createElement("span", { className: "fa fa-upload" }), " 发布IDC"))), React.createElement("div", { className: "col-sm-4 text-right" }, React.createElement("div", { className: "btn-group" }, React.createElement("a", { href: "javascript:void(0)", className: "btn btn-metis-5 btn-sm", "data-placement": "bottom", "data-original-title": "新增", "data-toggle": "tooltip", "data-tag": "addOuterCeil", onClick: this.addItem }, React.createElement("span", { className: "glyphicon glyphicon-plus" })), React.createElement("a", { href: "javascript:void(0)", className: "btn btn-metis-5 btn-sm", "data-placement": "bottom", "data-original-title": "导出excel", "data-toggle": "tooltip" }, React.createElement("span", { className: "glyphicon glyphicon-export" })), React.createElement("a", { href: "javascript:void(0)", className: "btn btn-metis-5 btn-sm", "data-placement": "bottom", "data-original-title": "导入", "data-toggle": "tooltip" }, React.createElement("span", { className: "glyphicon glyphicon-import" }))))))));
    }
});

//内容编辑浮层
var ContentEditorFloat = React.createClass({
    displayName: "ContentEditorFloat",

    render: function render() {
        return React.createElement("div", { className: "row" }, React.createElement("div", { className: "col-md-3", style: { borderRight: "1px solid #e5e5e5", paddingLeft: 0, fontSize: "12" } }, React.createElement(TreeView, { fold: "0", treeNodes: this.props.treeNodes })), React.createElement(SegmentLevelPanel, { pageData: this.props.pageData }));
    }
});

//内容填写form
var ContentForm = React.createClass({
    displayName: "ContentForm",

    save: function save(e) {
        var data = $(e.target).parents("form").serializeArray();
        console.log("form save", this.props.pageData.pageId, this.props.pageData.path, this.props.pageData.ppmsItemId, data);
        var ppmsItemData = { ppmsItemId: this.props.pageData.ppmsItemId };
        data.forEach(function (item) {
            ppmsItemData[item.name] = item.value;
        });
        /*
         this.props.pageData.ppmsDataTpl.forEach(function(item){
         if(item.type == "level"){
         ppmsItemData[item.nick] = [];
         }
         })*/
        console.log(ppmsItemData);
        pubsubflux.publish("contentformsave", this.props.pageData.pageId, this.props.pageData.path, ppmsItemData);
    },
    render: function render() {
        var pagaData = this.props.pageData;
        var dataTpl = this.props.pageData.ppmsDataTpl;
        // var InputControl = if()
        return React.createElement("form", { className: "form-horizontal" }, dataTpl.map(function (item) {
            if (item.type == 'text') {
                return React.createElement(TxtInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
            if (item.type == 'select') {
                return React.createElement(SelectInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
            if (item.type == 'url') {
                return React.createElement(UrlInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
            if (item.type == 'img') {
                return React.createElement(ImageInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
            if (item.type == 'date') {
                return React.createElement(DateInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
            if (item.type == 'date') {
                return React.createElement(DateInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
            if (item.type == 'checkbox') {
                return React.createElement(DateInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
            if (item.type == 'radio') {
                return React.createElement(DateInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
            if (item.type == 'level') {
                return React.createElement(LevelInput, { key: item.nick, text: item, value: pagaData[item.nick] });
            }
        }), React.createElement("div", { className: "form-group" }, React.createElement("div", { className: "col-sm-offset-2 col-sm-10" }, React.createElement("button", { type: "button", onClick: this.save, className: "btn btn-default" }, "保存"))));
    }
});

//多级内容Panel
var SegmentLevelPanel = React.createClass({
    displayName: "SegmentLevelPanel",

    addItem: function addItem() {
        pubsubflux.publish("contentformadd", this.props.pageData.pageId, this.props.pageData.path);
    },
    render: function render() {
        if (!$.isArray(this.props.pageData)) {
            return React.createElement("div", { className: "col-md-9" }, React.createElement("p", null, "正在编辑：", React.createElement("span", { className: "label label-info" }, this.props.pageData.ppms_itemName)), React.createElement("div", { style: { width: "100%", border: "1px solid rgb(229, 229, 229)", borderRadius: "3px; padding: 10px" }, id: "contentFormPanel" }, React.createElement(ContentForm, { key: this.props.pageData.ppmsItemId, pageData: this.props.pageData })));
        } else {
            return React.createElement("div", { className: "col-md-9" }, React.createElement("p", null, "正在编辑：", React.createElement("span", { className: "label label-info" }, this.props.pageData.ppms_itemName)), React.createElement("div", null, React.createElement("a", { href: "javascript:void(0)", className: "btn btn-primary btn-xs", style: { float: "right", marginTop: "-30" }, onClick: this.addItem }, "新增"), React.createElement(ContentTable, { key: this.props.pageData.ppmsItemId, pageData: this.props.pageData })));
        }
    }
});

//左边树
var TreeView = React.createClass({
    displayName: "TreeView",

    render: function render() {
        var display = this.props.fold == 0 ? 'block' : 'none';
        return React.createElement("ul", { className: "listul", style: { display: display } }, this.props.treeNodes.map(function (node) {
            return React.createElement(TreeNode, { key: node.id, nodeData: node });
        }.bind(this)));
    }
});

//树节点
var TreeNode = React.createClass({
    displayName: "TreeNode",

    handClick: function handClick() {
        console.log("publish treeNodeClick");
        pubsubflux.publish("treeNodeClick", this.props.nodeData.pageId, this.props.nodeData.path);
    },
    render: function render() {
        var node = this.props.nodeData;
        var fold = node.fold == 0 ? 'unfolded' : 'folded';
        var selected = node.selected ? 'selected' : '';
        var calssName = fold + " " + selected;
        if (node.nodes) {
            return React.createElement("li", { className: calssName }, React.createElement("a", { "data-id": node.id, "data-pid": node.pId, onClick: this.handClick, className: "lftlist", href: "javascript:void(0)" }, node.text), React.createElement(TreeView, { fold: node.fold, treeNodes: node.nodes }));
        } else {
            return React.createElement("li", { className: selected }, React.createElement("a", { onClick: this.handClick, "data-id": node.id, "data-pid": node.pId, className: "lftlist", href: "javascript:void(0)" }, node.text));
        }
    }
});

//文本输入框
var TxtInput = React.createClass({
    displayName: "TxtInput",

    render: function render() {
        return React.createElement("div", { className: "form-group" }, React.createElement("label", { className: "col-sm-2 control-label" }, this.props.text.name), React.createElement("div", { className: "col-sm-10" }, React.createElement("input", { name: this.props.text.nick, type: "text", className: "form-control", placeholder: this.props.text.name, defaultValue: this.props.value })));
    }
});

var SelectOption = React.createClass({
    displayName: "SelectOption",

    render: function render() {
        var selected = this.props.item.value == this.props.value ? 'selected' : '';
        console.log("selectoption", selected);
        return React.createElement("option", { value: this.props.item.value, selected: selected }, this.props.item.name);
    }
});

var SelectInput = React.createClass({
    displayName: "SelectInput",

    render: function render() {
        return React.createElement("div", { className: "form-group" }, React.createElement("label", { className: "col-sm-2 control-label" }, this.props.text.name), React.createElement("div", { className: "col-sm-10" }, React.createElement("select", { name: this.props.text.nick, defaultValue: this.props.value }, this.props.text.data.map(function (item) {
            return React.createElement("option", { key: item.value, value: item.value }, item.name);
        }))));
    }
});

var LevelInput = React.createClass({
    displayName: "LevelInput",

    render: function render() {
        return React.createElement("div", { className: "form-group" }, React.createElement("label", { className: "col-sm-2 control-label" }, this.props.text.name), React.createElement("div", { className: "col-sm-10" }, "保存后，点击左侧菜单新增"));
    }
});

var UrlInput = React.createClass({
    displayName: "UrlInput",

    render: function render() {
        return React.createElement("div", { className: "form-group" }, React.createElement("label", { className: "col-sm-2 control-label" }, this.props.text.name), React.createElement("div", { className: "col-sm-10" }, React.createElement("input", { type: "text", name: this.props.text.nick, className: "form-control", placeholder: this.props.text.name, defaultValue: this.props.value })));
    }
});

var ImageInput = React.createClass({
    displayName: "ImageInput",

    render: function render() {
        return React.createElement("div", { className: "form-group" }, React.createElement("label", { className: "col-sm-2 control-label" }, this.props.text.name), React.createElement("div", { className: "col-sm-8" }, React.createElement("input", { type: "text", name: this.props.text.nick, className: "form-control", placeholder: this.props.text.name, defaultValue: this.props.value })), React.createElement("div", { className: "col-sm-2" }, React.createElement("button", null, "上传")));
    }
});

var DateInput = React.createClass({
    displayName: "DateInput",

    render: function render() {
        return React.createElement("div", { className: "form-group" }, React.createElement("label", { className: "col-sm-2 control-label" }, this.props.text.name), React.createElement("div", { className: "col-sm-10" }, React.createElement("input", { type: "text", name: this.props.text.nick, className: "form-control", placeholder: this.props.text.name, defaultValue: this.props.value })));
    }
});