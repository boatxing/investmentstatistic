/**
 *
 */
define(function (require, exports, module) {
    var ejs = require("ejs");
    var modal = require("modal");

    var pageList = [];
    var ppmsItemId = 1;

    exports.init = function () {
        for (var i in pageMess) {
            pageMess[i].pageData = JSON.parse(pageMess[i].pageData);
            pageList.push(pageMess[i]);
            pageMess[i].treeNodes = [];
            //第一级默认展开和选中
            pageMess[i].pageData.forEach(function (item, index) {
                item.selected = 1;
                item.fold = 0;
                //
                if (index < 10) item.show = 1;else item.show = 0;
            });
            console.log("formatData", i, pageMess[i].pageFormat);
            formatData(pageMess[i].pageInfo.id, pageMess[i].pageData, pageMess[i].pageFormat, pageMess[i].treeNodes, "pageData", i, true);
        }

        updatePage(pageList);
        addEvent();
        /*
        ReactDOM.render(React.createElement(PageContainer, { pageList: pageList }), document.getElementById('container'), function () {
            window.wookmark = new Wookmark('#container', {
                itemWidth: 526, // Optional min width of a grid item
                offset: 10, // Optional the distance from grid to parent
                comparator: comparatorName
            });
             function comparatorName(a, b) {
                return parseInt($(a).data('itemid')) < $(b).data('itemid') ? -1 : 1;
            }
        });*/
    };

    function addEvent() {
        //页面片删除
        pubsubflux.subscribe("segmentDel", function (pageId) {
            console.log("segmentDel subscribe", pageId);
            for (var i = 0; i < pageList.length; i++) {
                if (pageList[i].pageInfo.id == pageId) {
                    pageList.splice(i, 1);
                    break;
                }
            }

            updatePage(pageList);
        });

        //保存页面片
        pubsubflux.subscribe("segmentSave", function (pageId) {});

        //发布页面片到gamma
        pubsubflux.subscribe("segment2Gamma", function (pageId) {});

        //发布页面片到idc
        pubsubflux.subscribe("segment2Idc", function (pageId) {});

        //导出
        pubsubflux.subscribe("segmentExport", function (pageId) {});

        //导入
        pubsubflux.subscribe("segmentImport", function (pageId) {});

        //关闭弹出浮层
        pubsubflux.subscribe("eidtcontentfloatclose", function () {
            console.log("eidtcontentfloatclose");
            updatePage(pageList);
            $('#editcontentFloat').hide();
        });
    }

    function formatData(id, pageData, pageFormat, treeNodes, path, pageId, init) {
        var treeNode = {};
        if (pageFormat[0] && pageFormat[0].nick != "ppms_itemName") {
            pageFormat.unshift({
                nick: 'ppms_itemName',
                name: '内容名称',
                type: 'text',
                empty: false
            });
        }
        pageData.ppmsDataTpl = pageFormat;
        pageData.forEach(function (item, index) {
            item.ppmsDataTpl = pageFormat;
            item.ppmsItemId = init || !item.ppmsItemId ? ppmsItemId++ : item.ppmsItemId;
            item.ppmsItemPid = id;

            item.path = path + "[" + index + "]";
            item.pageId = pageId;
            treeNode = {
                text: item.ppms_itemName,
                id: item.ppmsItemId,
                path: item.path,
                pageId: pageId,
                pId: id,
                fold: !item.fold ? 0 : 1,
                selected: item.selected
            };
            treeNodes.push(treeNode);
            for (var i in item) {
                if ($.isArray(item[i])) {
                    for (var j in pageFormat) {
                        if (pageFormat[j].nick == i) {
                            item[i].path = item.path + "['" + pageFormat[j].nick + "']";
                            item[i].pageId = pageId;
                            item[i].ppms_itemName = pageFormat[j].name;
                            treeNode.nodes = treeNode.nodes ? treeNode.nodes : [];
                            treeNode.nodes.push({
                                text: pageFormat[j].name,
                                id: pageFormat[j].nick,
                                pId: item.ppmsItemId,
                                pageId: pageId,
                                path: item[i].path,
                                fold: item[i].fold,
                                selected: item[i].selected,
                                nodes: []
                            });
                            formatData(item.ppmsItemId, item[i], pageFormat[j].dataFormat, treeNode.nodes[treeNode.nodes.length - 1].nodes, item[i].path, pageId);
                        }
                    }
                }
            }
            treeNode = null;
        });
    }

    function clearSelected(pageData) {
        pageData.forEach(function (item) {
            item.selected = 0;
            for (var i in item) {
                if ($.isArray(item[i])) {
                    item[i].selected = 0;
                    clearSelected(item[i]);
                }
            }
        });
    }

    function getSelectedItem(pageData) {
        var item = null;
        var itemTemp = null;
        if (!pageData) return null;
        for (var i = 0; i < pageData.length; i++) {
            item = pageData[i];
            if (item.selected) return item;
            for (var j in item) {
                if ($.isArray(item[j])) {
                    if (item[j].selected) return item[j];
                    itemTemp = getSelectedItem(item[j]);
                    if (itemTemp) return itemTemp;
                }
            }
        }
    }

    /**
     * 从path中解析出当前树、最上层的index、当前level、当前item、上一级item
     */
    function parsePath(pageId, path) {
        console.log("parsePath", pageId, path);
        //获取segmentPanel ContentItem(最外层的)index
        var m = /pageData\[(\d+)\]/.exec(path);
        var index = m[1];
        console.log("index", index);
        var treeNodes = [pageMess[pageId].treeNodes[index]];
        //获取当前的level
        var level = path.split("]").length - 1;
        console.log("level", level);

        //获取当前Item
        var currItem = eval("pageMess[" + pageId + "]." + path);
        //获取上一级
        var paths = path.split("]");
        paths = paths.slice(0, -2).join("]") + "]";
        console.log("pre path", paths);
        var preItem = level == 1 ? pageMess[pageId].pageData : eval("pageMess[" + pageId + "]." + paths);

        var selectedItem = pageMess[pageId].pageData[index] ? getSelectedItem([pageMess[pageId].pageData[index]]) : null;
        console.log("get selected item:", selectedItem);
        return {
            treeNodes: treeNodes,
            index: index,
            currLevel: level,
            currItem: currItem,
            preItem: preItem,
            position: parseInt(path.slice(path.lastIndexOf("[") + 1, -1)),
            selectedItem: selectedItem
        };
    }

    //折叠
    pubsubflux.subscribe("ContentTableFold", function (pageId) {
        console.log("ContentTableFold subscribe", pageId);
        pageMess[pageId].pageData.forEach(function (item, index) {
            if (index < 10) item.show = 1;else item.show = 0;
        });

        updatePage(pageList);
    });

    //展开
    pubsubflux.subscribe("ContentTableunFold", function (pageId) {
        console.log("ContentTableunFold subscribe", pageId);
        pageMess[pageId].pageData.forEach(function (item) {
            item.show = 1;
        });

        updatePage(pageList);
    });

    //删除一个页面片
    pubsubflux.subscribe("SegmentPanelDel", function (pageId) {
        console.log("SegmentPanelDel subscribe", pageId);
        for (var i = 0; i < pageList.length; i++) {
            if (pageList[i].pageInfo.id == pageId) {
                pageList.splice(i, 1);
                break;
            }
        }

        updatePage(pageList);
    });

    //ContentItem点击编辑
    pubsubflux.subscribe("contentItemEdit", function (pageId, path) {
        console.log("contentItemEdit", pageId, path);
        var info = parsePath(pageId, path);
        //页面片panel点击编辑，需要弹出浮层
        if (info.currLevel == 1) {
            $('#editcontentFloat').show();
            updateContentEditorFloat({ treeNodes: info.treeNodes, pageData: info.selectedItem });
        } else {
            updateContentEditorFloat({ treeNodes: info.treeNodes, pageData: info.currItem });
        }
    });

    //ContentItem点击上移、下移、顶部、底部 direction  0 上移  1 下移 2 到顶部 3 到底部
    pubsubflux.subscribe("contentItemMove", function (pageId, path, direction) {
        console.log("contentItemMove", pageId, path, direction);
        var info = parsePath(pageId, path);
        var preItem = info.preItem;
        //上移
        if (direction == 0) {
            console.log("position:" + info.position);
            if (info.position == 0) return false;
            var item = preItem[info.position - 1];
            preItem[info.position - 1] = info.currItem;
            preItem[info.position] = item;
        }

        //下移
        if (direction == 1) {
            if (info.position == preItem.length - 1) return false;
            var item = preItem[info.position + 1];
            preItem[info.position + 1] = info.currItem;
            preItem[info.position] = item;
        }

        //移到顶部
        if (direction == 2) {
            if (info.position == 0) return false;
            var item = preItem[info.position];
            preItem.splice(info.position, 1);
            preItem.unshift(item);
        }

        //移到底部
        if (direction == 3) {
            if (info.position == preItem.length - 1) return false;
            var item = preItem[info.position];
            preItem.splice(info.position, 1);
            preItem.push(item);
        }

        pageMess[pageId].treeNodes = [];
        formatData(pageId, pageMess[pageId].pageData, pageMess[pageId].pageFormat, pageMess[pageId].treeNodes, "pageData", pageId, false);
        if (info.currLevel == 1) {
            console.log("render PageContainer");
            updatePage(pageList);
        } else {
            console.log("render ContentEditorFloat", info.selectedItem);
            updateContentEditorFloat({ treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: info.selectedItem });

            //ReactDOM.render(React.createElement(ContentEditorFloat, { treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: info.selectedItem }), document.getElementById("editcontentFloatBody"));
        }
    });

    //删除
    pubsubflux.subscribe("contentItemDel", function (pageId, path) {
        console.log("contentItemDel", pageId, path);
        var info = parsePath(pageId, path);
        var preItem = info.preItem;
        preItem.splice(info.position, 1);
        pageMess[pageId].treeNodes = [];
        formatData(pageId, pageMess[pageId].pageData, pageMess[pageId].pageFormat, pageMess[pageId].treeNodes, "pageData", pageId, false);
        if (info.currLevel == 1) {
            console.log("render PageContainer");
            updatePage(pageList);
        } else {
            console.log("render ContentEditorFloat");
            updateContentEditorFloat({ treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: info.selectedItem });

            //ReactDOM.render(React.createElement(ContentEditorFloat, { treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: info.selectedItem }), document.getElementById("editcontentFloatBody"));
        }
    });

    //点击树节点
    pubsubflux.subscribe("treeNodeClick", function (pageId, path) {
        console.log("treeNodeClick subscribe", pageId, path);
        console.log("clear selected");
        var info = parsePath(pageId, path);
        //清除selected状态
        clearSelected([pageMess[pageId].pageData[info.index]]);
        var currItem = info.currItem;
        currItem.fold = currItem.fold == 0 ? 1 : 0;
        currItem.selected = 1;
        pageMess[pageId].treeNodes = [];
        formatData(pageId, pageMess[pageId].pageData, pageMess[pageId].pageFormat, pageMess[pageId].treeNodes, "pageData", pageId, false);
        updateContentEditorFloat({ treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: info.currItem });

        //ReactDOM.render(React.createElement(ContentEditorFloat, { treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: info.currItem }), document.getElementById("editcontentFloatBody"));
    });

    //表单保存
    pubsubflux.subscribe("contentformsave", function (pageId, path, data) {
        console.log("contentformsave subscribe", pageId, path, data);
        var info = parsePath(pageId, path);
        var preItem = info.preItem;
        console.log("find", preItem.length, data.ppmsItemId);
        var item = null;
        for (var i = 0; i < preItem.length; i++) {
            if (preItem[i].ppmsItemId == data.ppmsItemId) {
                item = preItem[i];
                break;
            }
        }

        if (item) {
            //编辑
            console.log("编辑");
            for (var i in data) {
                if ($.isArray(data[i])) {
                    delete data[i];
                }
            }
            $.extend(item, data);
            console.log(item);
            if (info.currLevel != 1) {
                clearSelected([pageMess[pageId].pageData[info.index]]);
                preItem.selected = 1;
            }
            //item = data;
        } else {
                console.log("新增");
                console.log(data);
                data.show = 1;
                preItem.push(data);
                //第一层增加，通知展开
                if (info.currLevel == 1) {
                    pubsubflux.publish("SegmentPanelUnfold", pageId);
                }
            }
        pageMess[pageId].treeNodes = [];
        console.log(typeof pageMess[pageId].pageFormat);
        formatData(pageId, pageMess[pageId].pageData, pageMess[pageId].pageFormat, pageMess[pageId].treeNodes, "pageData", pageId, false);
        console.log("pageData type:" + $.isArray(info.currItem));
        if (info.currLevel == 1) {
            console.log("render PageContainer");
            updatePage(pageList);
            updateContentEditorFloat({ treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: pageMess[pageId].pageData[info.index] });
            //ReactDOM.render(React.createElement(ContentEditorFloat, { treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: pageMess[pageId].pageData[info.index] }), document.getElementById("editcontentFloatBody"));
        } else {
                console.log("render ContentEditorFloat", preItem);
                updateContentEditorFloat({ treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: preItem });
                //ReactDOM.render(React.createElement(ContentEditorFloat, { treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: preItem }), document.getElementById("editcontentFloatBody"));
            }
    });

    //最外层点击新增
    pubsubflux.subscribe("contentformaddlevel1", function (pageId, path) {
        console.log("contentformaddlevel1 subscribe", pageId);

        var ppmsItemData = {};
        pageMess[pageId].pageFormat.forEach(function (item) {
            ppmsItemData[item.nick] = item.type == "level" ? [] : "";
        });
        ppmsItemData.pageId = pageId;
        ppmsItemData.path = "pageData[" + pageMess[pageId].pageData.length + "]";
        ppmsItemData.ppmsItemId = ppmsItemId++;
        ppmsItemData.ppmsDataTpl = pageMess[pageId].pageFormat;
        console.log(ppmsItemData);
        updateContentEditorFloat({ treeNodes: [], pageData: ppmsItemData });
        //ReactDOM.render(React.createElement(ContentEditorFloat, { treeNodes: [], pageData: ppmsItemData }), document.getElementById("editcontentFloatBody"));

        $('#editcontentFloat').show();
    });

    //新增
    pubsubflux.subscribe("contentformadd", function (pageId, path, data) {
        console.log("contentformadd subscribe", pageId, path);
        var info = parsePath(pageId, path);
        var currItem = info.currItem;
        console.log(currItem);
        var ppmsItemData = {};
        currItem.ppmsDataTpl.forEach(function (item) {
            ppmsItemData[item.nick] = item.type == "level" ? [] : "";
        });
        ppmsItemData.pageId = currItem.pageId;
        ppmsItemData.path = currItem.path + "[" + currItem.length + "]";
        ppmsItemData.ppmsItemId = ppmsItemId++;
        ppmsItemData.ppmsDataTpl = currItem.ppmsDataTpl;
        updateContentEditorFloat({ treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: ppmsItemData });
        //ReactDOM.render(React.createElement(ContentEditorFloat, { treeNodes: [pageMess[pageId].treeNodes[info.index]], pageData: ppmsItemData }), document.getElementById("editcontentFloatBody"));
    });

    function MsgCenter() {}

    function ViewUpdate() {}
});