/**
 created by huangshaolu on 2015/12/15
 */
define(function (require, exports, module) {
  var ejs = require("ejs");
  var pagecontent_list = require("pagecontent_list.tpl");
  var pagecontent_table = require("pagecontent_table.tpl");
  var modal = require("modal");

  //遍历寻找
  var _fatherReg = new RegExp("\\[([^\\[\\]]+)\\]$");

  exports.init = function () {
    initPage();
    bindEvent();
  };

  //初始化页面
  function initPage() {
    //处理数据
    for (var pageid in pageMess) {
      var nowData = pageMess[pageid];
      //编辑数据
      handlerData(nowData.pageData);

      //找到每个数组对应的数据模板
      function handlerData(posData) {
        if (posData instanceof Array) {
          //如果是数组，说明是最外层
          posData.forEach(function (ceil) {
            ceil._PPMSDATATPL_ = nowData.pageFormat;
            handlerData(ceil);
          });
        } else {
          //子类，不是最外层了
          for (i in posData) {
            if (posData[i] instanceof Array) {
              //是子类
              for (var j = 0, len = posData._PPMSDATATPL_.length; j < len; j++) {
                if (posData._PPMSDATATPL_[j].nick == i) {
                  //找到了当前level节点
                  posData[i].forEach(function (ceil) {
                    ceil._PPMSDATATPL_ = posData._PPMSDATATPL_[j].dataFormat;
                    handlerData(ceil);
                  });
                  break;
                }
              }
            }
          }
        }
      }
    }
    //渲染最外层的表格
    $("#tablearea").html(new ejs({ text: pagecontent_table }).render({ 'data': pageMess }));
    //渲染标题
    $("#page_head").text(pageInfo.name);
  }

  //事件绑定
  function bindEvent() {
    //点击编辑
    $("#tablearea").on("click", "[tag=o_table_edit]", function () {
      var pageid = $(this).parents(".o_tableceil").attr("pageid");
      var index = $(this).attr("index");
      var route = $(this).attr("route");
      //填充数据
      fillContent(pageid, index, route);
    });

    //点击左侧导航栏
    $("#contentdetail").on("click", ".lftlist", function () {
      // xuanContent($(this).attr("route"));
      var pageid = $("#modaltitle").attr("segmentid");
      var index = $("#submodaltitle").attr("route").match(/'pageData'\]\['(\d+)/)[1];
      fillContent(pageid, index, $(this).attr("route"));
    });

    //点击保存页面片信息
    $("#saveceil").on("click", function () {
      var pageid = $("#modaltitle").attr("segmentid");

      //保存当前修改的内容
      //获得当前数据的索引
      var _nowroute = $("#submodaltitle").attr("route");
      var _nowObj = eval(_nowroute);

      //如果没有的话，可能是新增
      var _fatherroute = _nowroute.replace(_fatherReg, "");
      var _father = eval(_fatherroute);
      if (!_nowObj) {
        //查找上一级
        if (_father[0]) {
          _father.push({
            _PPMSDATATPL_: _father[0]._PPMSDATATPL_
          });
        } else {
          var _grandfather = eval(_fatherroute.replace(_fatherReg, ""));
          var _myroute = _fatherroute.match(_fatherReg)[1].replace(/'/g, "");
          _father.push({
            _PPMSDATATPL_: _myroute == "pageData" ? _grandfather.pageFormat : _grandfather._PPMSDATATPL_.filter(function (ceil) {
              return ceil.nick == _myroute;
            })[0].dataFormat
          });
        }
        _nowObj = _father[_father.length - 1];
      }

      // _nowObj._PPMSDATATPL_.forEach(function(ceil){

      for (var i = 0, len = _nowObj._PPMSDATATPL_.length; i < len; i++) {
        var ceil = _nowObj._PPMSDATATPL_[i];
        if (ceil.type != "level") {
          //checkbox和radio需要单独处理
          if (ceil.type == "radio") {
            _nowObj[ceil.nick] = $("#contenttable [ceilid=" + ceil.nick + "]").find("input:checked").val();
          } else if (ceil.type == "checkbox") {
            var _value = [];
            $("#contenttable [ceilid=" + ceil.nick + "]").find("input:checked").each(function (index, ceil) {
              _value.push($(ceil).val());
            });
            _nowObj[ceil.nick] = _value.join();
          } else {
            var _me = $("#contenttable [ceilid=" + ceil.nick + "]");
            //这里可能有text，要做校验
            if (ceil.validate) {
              var _reg = new RegExp(ceil.validate);
              if (!_reg.test(_me.val())) {
                _me[0].focus();
                return false;
              } else {
                _nowObj[ceil.nick] = _me.val();
              }
            }
            _nowObj[ceil.nick] = _me.val();
          }
        } else {
          if (!_nowObj[ceil.nick]) {
            _nowObj[ceil.nick] = [];
          }
        }
        // });
      }
      //ppms_itemName特殊处理
      _nowObj.ppms_itemName = $("#contenttable [ceilid=ppms_itemName]").val();

      //上报页面片数据
      reportSegment(pageid, function () {
        //结束效果
        try {
          //往上回溯
          // xuanContent($("#submodaltitle").attr("route").replace(_fatherReg,""));
          var _nowroute = $("#submodaltitle").attr("route").replace(_fatherReg, "");
          var index = _nowroute.match(/'pageData'\]\['(\d+)/)[1];
          fillContent(pageid, index, _nowroute);
        } catch (e) {
          //关闭浮层
          $('#editcontent').modal("hide");
          //更新外层节点
          // var _tpl = window.Template({tpl: $("#listtpl").html()});
          // var html = _tpl.render({list:_father,pageid:pageid});

          var html = new ejs({ text: pagecontent_list }).render({ list: _father, pageid: pageid });
          $("#tablearea [segmentid=" + pageid + "]").find(".listbody").html(html);
        }
      });
    });

    //点击外部页面片上移
    $("#tablearea").on("click", "[operate=o_up]", function () {
      //上移数据
      operateData(this, "up");
    });
    //点击外部页面片下移
    $("#tablearea").on("click", "[operate=o_down]", function () {
      operateData(this, "down");
    });
    //点击外部页面片置顶
    $("#tablearea").on("click", "[operate=o_top]", function () {
      operateData(this, "top");
    });
    //点击外部页面片置底
    $("#tablearea").on("click", "[operate=o_bottom]", function () {
      operateData(this, "bottom");
    });
    //删除
    $("#tablearea").on("click", "[operate=o_del]", function () {
      if (confirm("你确定要删除吗？数据很难恢复哦")) {
        operateData(this, "del");
      }
    });

    //浮层内的移动
    $("#ceillist").on("click", "[operate=i_up]", function () {
      //上移数据
      operateinnerData(this, "up");
    });
    $("#ceillist").on("click", "[operate=i_down]", function () {
      //下移数据
      operateinnerData(this, "down");
    });
    $("#ceillist").on("click", "[operate=i_top]", function () {
      //置顶数据
      operateinnerData(this, "top");
    });
    $("#ceillist").on("click", "[operate=i_bottom]", function () {
      //置底数据
      operateinnerData(this, "bottom");
    });
    $("#ceillist").on("click", "[operate=i_del]", function () {
      //删除数据
      if (confirm("你确定要删除吗？数据很难恢复哦")) {
        operateinnerData(this, "del");
      }
    });

    //外层新增
    $("#tablearea").on("click", "[tag=addOuterCeil]", function () {
      var pageid = $(this).attr("pageid");
      var tlen = pageMess[pageid]['pageData'].length;
      fillContent(pageid, tlen, "pageMess['" + pageid + "']['pageData']['" + tlen + "']", true);
    });

    //新增内层
    $("#addInnerCeils").on("click", function () {
      var _parentRoute = $("#submodaltitle").attr("route");
      var _nowArr = eval(_parentRoute);
      if (!_nowArr || _nowArr.length == 0) {
        //如果还没有数据，需要新增的
        var _father = eval(_parentRoute.replace(_fatherReg, ""));
        var _myroute = _parentRoute.match(_fatherReg)[1].replace(/'/g, "");
        var _tpl = _father._PPMSDATATPL_.filter(function (ceil) {
          return ceil.nick == _myroute;
        })[0].dataFormat;
        _father[_myroute] = [];
      } else {
        var _tpl = _nowArr[0]._PPMSDATATPL_;
      }
      xuanContent(_parentRoute + "['" + (_nowArr ? _nowArr.length : "0") + "']", _tpl);
    });

    //发布
    $("#tablearea").on("click", "[tag=publish]", function () {
      var me = $(this);
      $.ajax({
        type: "get",
        url: "/page/publish",
        data: {
          from: me.attr("from"),
          to: me.attr("to"),
          segmentid: me.attr("segmentid")
        },
        dataType: "json",
        success: function (data) {
          if (data.ret == 0) {
            var href = data.path.replace("/export/wxsq/static/res/", "http://wqs.jd.com/");
            modal.success({
              title: '温馨提示',
              msg: '<div style="word-wrap: break-word;">生成/发布页面片成功：<a href="' + href + '" target="_blank">' + href + '</a></div>'
            });
          } else {
            alert("更新失败");
          }
        }
      });
    });
  }

  /**
   * 操作
   * @param  {Object} that    元素
   * @param  {String} operate 操作符
   */
  function operateinnerData(that, operate) {
    var _route = $("#submodaltitle").attr("route");
    var _tt = eval(_route);
    var index = $(that).parents("tr").eq(0).index();
    operating(_tt, index, operate);
    var pageid = $("#modaltitle").attr("segmentid");
    reportSegment(pageid, function () {
      fillContent(pageid, _route.match(/'pageData'\]\['(\d+)/)[1], _route);
    });
  }

  /**
   * 上报页面片数据
   * @param  {String}   pageid   Pageid
   * @param  {Function} callback 回调函数
   */
  function reportSegment(pageid, callback) {
    //生成上报数据
    var _o = {
      segmentid: pageid,
      content: {
        pageData: cloneObj(pageMess[pageid].pageData)
      }
    };

    //去掉多余的信息
    removeExtInfo(_o.content.pageData);

    function removeExtInfo(data) {
      data.forEach(function (ceil) {
        //移除_PPMSDATATPL
        delete ceil._PPMSDATATPL_;
        for (var i in ceil) {
          if (ceil[i] instanceof Array) {
            //如果是数组，继续
            removeExtInfo(ceil[i]);
          }
        }
      });
    }

    // var _tpl = window.Template({tpl: pageMess[pageid].htmlTpl});
    // var html = _tpl.render({datas:pageMess[pageid].pageData});
    var html = new ejs({ text: pageMess[pageid].htmlTpl }).render({ datas: pageMess[pageid].pageData });
    _o.html = html;

    //上报信息中
    // console.log(JSON.stringify(_o));
    $.ajax({
      type: "post",
      url: "/page/updatesegment",
      data: {
        sid: _o.segmentid,
        content: JSON.stringify(_o.content.pageData),
        html: _o.html
      },
      dataType: "json",
      success: function (data) {
        if (data.ret == 0) {
          callback();
        } else {
          alert("更新失败");
        }
      }
    });
  }

  /**
   * 操作数据
   */
  function operateData(that, operater) {
    var _root = $(that).parents(".o_tableceil");
    var index = _root.attr("index");
    var pageid = _root.attr("pageid");

    //操作元数据
    var _tt = pageMess[pageid].pageData;
    operating(_tt, index, operater);

    //上报到后台
    reportSegment(pageid, function () {
      //重新渲染这个区域
      // var _tpl = window.Template({tpl: $("#listtpl").html()});
      // var html = _tpl.render({list:_tt,pageid:pageid});
      var html = new ejs({ text: pagecontent_list }).render({ list: _tt, pageid: pageid });
      $(that).parents(".listbody").html(html);
    });
  }

  //操作中
  function operating(data, index, operater) {
    switch (operater) {
      case "up":
        data.splice(index - 1, 0, data.splice(index, 1)[0]);
        break;
      case "down":
        data.splice(index + 1, 0, data.splice(index, 1)[0]);
        break;
      case "top":
        data.splice(0, 0, data.splice(index, 1)[0]);
        break;
      case "bottom":
        data.splice(data.length - 1, 0, data.splice(index, 1)[0]);
        break;
      case "del":
        data.splice(index, 1);
        break;
    }
  }

  /**
   * 数组克隆
   * @param  {Object} obj 对象
   */
  function cloneObj(obj) {
    var newO = {};
    if (obj instanceof Array) {
      newO = [];
    }
    for (var key in obj) {
      var val = obj[key];
      newO[key] = typeof val === 'object' ? arguments.callee(val) : val;
    }
    return newO;
  };

  /**
   * 填充浮层数据
   * @param  {String} pageid pageid
   */
  function fillContent(pageid, index, route, isadd) {

    var _t = "";

    if (index >= pageMess[pageid].pageData.length) {
      var nowData = {
        _PPMSDATATPL_: pageMess[pageid].pageData.length == 0 ? pageMess[pageid].pageFormat : pageMess[pageid].pageData[0]._PPMSDATATPL_
      };
    } else {
      var nowData = pageMess[pageid].pageData[index];
    }

    //是否新增
    if (isadd) {
      $("#modaltitle").html("新增");
      $("#submodaltitle").parent().hide();
      $("#menuBar").parent().hide();
      $("#ceileditpanel").parent().attr("class", "col-md-12");
    } else {
      //标题
      $("#modaltitle").html(nowData.ppms_itemName);
      $("#submodaltitle").parent().show();
      $("#menuBar").parent().show();
      $("#ceileditpanel").parent().attr("class", "col-md-9");
    }
    $("#modaltitle").attr("segmentid", pageid);

    //渲染左侧导航
    var routestr = "pageMess['" + pageid + "']['pageData']['" + index + "']";
    xuanListBar(nowData, routestr, undefined, true);
    //渲染浮层左侧导航
    function xuanListBar(_tt, rstr, isArray, isfirst) {
      if (typeof isArray != "undefined" || isfirst) {
        //判断是否需要展开
        var unfolded = route.indexOf(rstr) == 0,
            isthis = route == rstr;
        _t += "<li class='" + (isthis ? "unfolded" : "folded") + "'><a class='lftlist' href='#' route=\"" + rstr + "\">" + _tt.ppms_itemName + "</a>";
        _t += "<ul class='listul' style='" + (!unfolded ? "display:none" : "") + "'>";
        xuanListBar(_tt, rstr);
        _t += "</ul>";
        _t += "</li>";
      } else {
        for (var i = 0, len = _tt._PPMSDATATPL_.length; i < len; i++) {
          var _nowtpl = _tt._PPMSDATATPL_[i];
          if (_nowtpl.type == "level") {
            //如果是数组
            //判断是否需要展开
            var unfolded = route.indexOf(rstr + "['" + _nowtpl.nick + "']") == 0,
                isthis = route == rstr + "['" + _nowtpl.nick + "']";

            _t += "<li class='" + (isthis ? "unfolded" : "folded") + "'><a class='lftlist' href='#' route=\"" + rstr + "['" + _nowtpl.nick + "']" + "\">" + _nowtpl.name + "</a>";
            if (_tt[_nowtpl.nick]) {
              //如果有值
              for (var j = 0, jlen = _tt[_nowtpl.nick].length; j < jlen; j++) {
                _t += "<ul class='listul' style='" + (!unfolded ? "display:none" : "") + "'>";
                xuanListBar(_tt[_nowtpl.nick][j], rstr + "['" + _nowtpl.nick + "']['" + j + "']", j);
                _t += "</ul>";
              }
              _t += "</li>";
            }
          }
        }
      }
    }
    $("#menuBar").html(_t);

    //渲染右侧具体信息
    xuanContent(route, isadd ? nowData._PPMSDATATPL_ : "");

    //弹出浮层
    $('#editcontent').modal({
      backdrop: "static"
    });
  }

  //渲染右侧具体信息
  function xuanContent(route, addinfo) {
    var _content = eval(route);
    var _ct = "",
        subtitle = "";
    if ((_content instanceof Array || !_content) && !addinfo) {
      if (!_content) {
        _content = [];
      }

      //上一级的基本信息
      var _fatherroute = route.replace(_fatherReg, "");
      var _nownick = route.match(_fatherReg)[1];
      var _nowconfig = eval(_fatherroute)._PPMSDATATPL_.filter(function (ceil) {
        return ceil.nick == _nownick.replace(/'/g, "");
      })[0];
      subtitle = _nowconfig.name;

      $("#ceileditpanel").hide();
      $("#ceillistpanel").show();
      $("#saveceil").hide();

      _content.forEach(function (ceil, index) {
        _ct += "<tr>\
          <td>&nbsp;&nbsp;" + (index + 1) + " : " + ceil.ppms_itemName + "</td>\
          <td class=\"text-center\">\
            <a href=\"#\" operate=\"i_top\"><span class=\"fa fa-arrow-circle-up\"></span></a>&nbsp;&nbsp;\
            <a href=\"#\" operate=\"i_bottom\"><span class=\"fa fa-arrow-circle-down\"></span></a>&nbsp;&nbsp;\
            <a href=\"#\" operate=\"i_up\"><span class=\"fa fa-arrow-up\"></span></a>&nbsp;&nbsp;\
            <a href=\"#\" operate=\"i_down\"><span class=\"fa fa-arrow-down\"></span></a>&nbsp;&nbsp;\
            <a href=\"#\" operate=\"i_del\"><span class=\"fa fa-times\"></span></a>&nbsp;&nbsp;&nbsp;&nbsp;\
            <a href=\"#\" class=\"lftlist\" route=\"" + route + "[" + index + "]" + "\">编辑</a>\
          </td>\
        </tr>";
      });

      $("#ceillist").html(_ct);
    } else {
      if (!_content) {
        _content = {};
      }
      $("#ceileditpanel").show();
      $("#ceillistpanel").hide();
      $("#saveceil").show();

      if (!addinfo) {
        //副标题
        subtitle = _content.ppms_itemName;
        var _data = _content._PPMSDATATPL_.concat();
      } else {
        var _data = addinfo.concat();
      }

      _data.unshift({
        name: "内容名称",
        nick: "ppms_itemName",
        type: "text"
      });
      _data.forEach(function (ceil) {
        //查询当前数据结构是否有数据
        var _relData = _content[ceil.nick];
        _ct += "<tr>\
          <td class=\"text-right\">" + (_relData ? "*" : "") + ceil.name + "：</td>";
        if (ceil.type == "level") {
          _ct += "<td style=\"font-weight:bold;\">" + (addinfo ? "新增后可编辑" : "请使用左侧导航辑内容") + "</td>";
        } else {
          //按照类型处理信息
          _ct += getTypeStr(ceil, _relData);

          // _ct += "<td><input ceilid=\"" + ceil.nick + "\" type=\"text\" class=\"form-control\" value=\"" + (_relData ? _relData : "") + "\"/></td>\
          // <td class=\"text-center\"><a href=\"#\" class=\"btn btn-primary btn-xs\">校验</a></td>";
        }
        _ct += "</tr>";
      });
      $("#contenttable").html(_ct);
      //为其下的输入框添加popover事件
      $("#contenttable [validate]").popover();
      //日期组件
      $("#contenttable [data-date-format]").datepicker();
    }
    //二级标题
    $("#submodaltitle").html(subtitle);
    $("#submodaltitle").attr("route", route);
  }

  /**
   * 返回不同类型的渲染字符串
   * @param  {Object} ceil 信息
   * @param  {String} data 处理结果
   * @description select,radio,checkbox,text要校验
   */
  function getTypeStr(ceil, data) {
    // _ct += "<td><input ceilid=\"" + ceil.nick + "\" type=\"text\" class=\"form-control\" value=\"" + (_relData ? _relData : "") + "\"/></td>\
    // <td class=\"text-center\"><a href=\"#\" class=\"btn btn-primary btn-xs\">校验</a></td>";
    var _t = "";
    switch (ceil.type) {
      case "select":
        _t = "<td><select ceilid=\"" + ceil.nick + "\">";
        var _datatpl = ceil.data.concat();
        _datatpl.unshift({
          name: "未选择",
          value: ""
        });
        _datatpl.forEach(function (cceil, index) {
          _t += "<option value=\"" + cceil.value + "\" " + (data == cceil.value ? "selected='selected'" : "") + ">" + cceil.name + "</option>";
        });
        _t += "</select></td>";
        break;
      case "radio":
        _t = "<td><div ceilid=\"" + ceil.nick + "\" type=\"radio\">";
        ceil.data.forEach(function (cceil) {
          _t += "<input type=\"radio\" name=\"" + ceil.nick + "\" value=\"" + cceil.value + "\" " + (data == cceil.value ? "checked='checked'" : "") + "/>" + cceil.name + "&nbsp;";
        });
        _t += "</div></td>";
        break;
      case "checkbox":
        _t = "<td><div ceilid=\"" + ceil.nick + "\" type=\"checkbox\">";
        if (data) {
          data = data.split(",");
        }
        ceil.data.forEach(function (cceil) {
          _t += "<input type=\"checkbox\" value=\"" + cceil.value + "\" " + (data && data.some(function (item) {
            return item == cceil.value;
          }) ? "checked='checked'" : "") + "/>" + cceil.name + "&nbsp;";
        });
        _t += "</div></td>";
        break;
      case "date":
        _t = "<td><input style=\"width:300px\" ceilid=\"" + ceil.nick + "\" type=\"text\" class=\"form-control\" value=\"" + (data ? data : "") + "\" onkeydown=\"return false\" data-date-format=\"yyyy/mm/dd\"/></td>";
        break;
      default:
        //默认是text
        _t = "<td><input style=\"width:300px\" ceilid=\"" + ceil.nick + "\" type=\"text\" class=\"form-control\" value=\"" + (data ? data : "") + "\" " + (ceil.validate ? "validate='" + ceil.validate + "' data-container=\"body\" data-toggle=\"popover\" data-placement=\"right\" data-trigger=\"focus\" data-content=\"" + ceil.valitext + "\"" : "") + "/></td>";
    }
    return _t;
  }
});