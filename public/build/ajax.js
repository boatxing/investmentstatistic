/**
 * Created by xingzhizhou on 2015/12/30.
 */

/**
 * ajax组件支持json和jsonp，xml三种方式
 * @author xingzhizhou
 * @version v2015/7/20
 * @description. 从zepto独立出来的ajax组件
 */
define(function (require, exports, module) {
    /**
     * var _ajax = require("ajax");
     * ajax请求：
     * _ajax.load({
     *     url: '',
     *     data: {},
     *     success: function(data){},
     *     error: function(ret){} //ret: timeout 超时，默认6s|parsererror 返回数据解析失败|status xmlHttpRequest状态码 返回 0 有可能是 302 404
     * })
     *
     * jsonp请求：
     * _ajax.load({
     *     url: '',
     *     data: {},
     *     dataType: 'jsonp',
     *     success: function(data){},
     *     error: function(ret){} //ret: timeout|load|error
     * })
     * 从zepto独立出来的ajax组件，增加了如下优化：
     * 给请求加上了token校验码
     * 自动判断是否跨域，如果跨域自动加上withCredentials头部
     * 默认6s超时
     * 出错时向外部传递timeout、load、error错误， 经测试 load 302，error 404 504
     * 会覆盖zepto的ajax方法
     */
    var _cacheThisModule_;

    var ajaxSettings = {
        // Default type of request
        type: 'GET',
        // Callback that is executed before request
        success: empty,
        // Callback that is executed the the server drops error
        error: empty,
        // Callback that is executed on request complete (both: error and success)
        complete: empty,
        // The context for the callbacks
        context: null,
        // Whether to trigger "global" Ajax events
        global: true,
        // Transport
        xhr: function () {
            return new window.XMLHttpRequest();
        },
        dataType: 'json',
        // MIME types mapping
        // IIS returns Javascript as "application/x-javascript"
        accepts: {
            script: 'text/javascript, application/javascript, application/x-javascript',
            json: 'application/json',
            xml: 'application/xml, text/xml',
            html: 'text/html',
            text: 'text/plain'
        },
        // Whether the request is to another domain
        crossDomain: false,
        // Default timeout
        timeout: 6,
        // Whether data should be serialized to string
        processData: true,
        // Whether the browser should be allowed to cache GET responses
        cache: false
    };

    var jsonpID = 0;

    //jsonp callback方法的后缀解决一些接口的callback方法不支持数字的问题
    var callbackSuffix = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', "L", 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'W', 'X', 'Y', 'Z'];

    exports.load = ajax;

    function ajax(options) {
        if (!options) return false;
        var settings = options;
        for (key in ajaxSettings) {
            typeof settings[key] == 'undefined' && (settings[key] = ajaxSettings[key]);
        }

        settings.url = settings.url.replace(/^http:/, "");

        //域名https升级，所有type为GET的转成jsonp
        //if(/get/i.test(options.type) && options.dataType == 'json'){
        //    options.dataType = 'jsonp';
        //}

        //判断是否跨域
        if (!settings.crossDomain) settings.crossDomain = /^([\w-]+:)?\/\/([^\/]+)/.test(settings.url) && RegExp.$2 != window.location.host;

        if (settings.crossDomain) settings.xhrFields = { withCredentials: true };

        if (!settings.url) settings.url = window.location.toString();
        serializeData(settings);

        var dataType = settings.dataType,
            hasPlaceholder = /\?.+=\?/.test(settings.url);
        if (hasPlaceholder) dataType = 'jsonp';

        if (settings.cache === false || (!options || options.cache !== true) && ('script' == dataType || 'jsonp' == dataType)) settings.url = appendQuery(settings.url, '_=' + Date.now());

        if ('jsonp' == dataType) {
            if (!hasPlaceholder) settings.url = appendQuery(settings.url, settings.jsonp ? settings.jsonp + '=?' : settings.jsonp === false ? '' : 'callback=?');
            settings.url = addToken(settings.url, "ls");
            return ajaxJSONP(settings);
        }

        //post请求用form表单模拟
        if (settings.method.toLowerCase() == 'post') {
            return ajaxPost(settings);
        }

        //如果是fiddler映射测试，修改域名解决跨域问题
        if (/[?&]ajaxtest=1/.test(location.search) && dataType == 'json') settings.url = settings.url.replace("http://wq.jd.com", "http://wqs.jd.com");

        settings.url = addToken(settings.url, "ajax");
        var mime = settings.accepts[dataType],
            headers = {},
            setHeader = function (name, value) {
            headers[name.toLowerCase()] = [name, value];
        },
            protocol = /^([\w-]+:)\/\//.test(settings.url) ? RegExp.$1 : window.location.protocol,
            xhr = settings.xhr(),
            nativeSetHeader = xhr.setRequestHeader,
            abortTimeout;

        if (!settings.crossDomain) setHeader('X-Requested-With', 'XMLHttpRequest');
        setHeader('Accept', mime || '*/*');
        if (mime = settings.mimeType || mime) {
            if (mime.indexOf(',') > -1) mime = mime.split(',', 2)[0];
            xhr.overrideMimeType && xhr.overrideMimeType(mime);
        }
        if (settings.contentType || settings.contentType !== false && settings.data && settings.type.toUpperCase() != 'GET') setHeader('Content-Type', settings.contentType || 'application/x-www-form-urlencoded');

        if (settings.headers) for (name in settings.headers) setHeader(name, settings.headers[name]);
        xhr.setRequestHeader = setHeader;

        xhr.onreadystatechange = function () {
            if (xhr.readyState == 4) {
                xhr.onreadystatechange = empty;
                clearTimeout(abortTimeout);
                var result,
                    error = false;
                if (xhr.status >= 200 && xhr.status < 300 || xhr.status == 304 || xhr.status == 0 && protocol == 'file:') {
                    dataType = dataType || mimeToDataType(settings.mimeType || xhr.getResponseHeader('content-type'));
                    result = xhr.responseText;

                    try {
                        // http://perfectionkills.com/global-eval-what-are-the-options/
                        if (dataType == 'script') (1, eval)(result);else if (dataType == 'xml') result = xhr.responseXML;else if (dataType == 'json') result = /^\s*$/.test(result) ? null : parseJSON(result);
                    } catch (e) {
                        error = e;
                    }
                    if (error) ajaxError(error, 'parsererror', xhr, settings);else ajaxSuccess(result, xhr, settings);
                } else {
                    ajaxError(xhr.statusText || null, xhr.status + "", xhr, settings);
                }
            }
        };

        var async = 'async' in settings ? settings.async : true;
        xhr.open(settings.type, settings.url, async, settings.username, settings.password);
        if (settings.xhrFields) for (name in settings.xhrFields) xhr[name] = settings.xhrFields[name];

        for (name in headers) nativeSetHeader.apply(xhr, headers[name]);

        if (settings.timeout > 0) abortTimeout = setTimeout(function () {
            xhr.onreadystatechange = empty;
            xhr.abort();
            ajaxError(null, 'timeout', xhr, settings);
        }, settings.timeout * 1000);

        // avoid sending empty string (#319)
        xhr.send(settings.data ? settings.data : null);
        return xhr;
    }

    function parseJSON(data) {
        if (!data || typeof data != "string") {
            return data;
        }
        data = data.replace(/^\s+|\s+$/g, "");
        if (!data) return data;

        return JSON.parse(data);
    };

    function ajaxJSONP(options) {
        var _callbackName = options.jsonpCallback,
            callbackName = (typeof _callbackName == 'function' ? _callbackName() : _callbackName) || 'jsonpCBK' + callbackSuffix[jsonpID++ % callbackSuffix.length],
            script = document.createElement('script'),

        //originalCallback = window[callbackName],
        responseData,
            xhr = { abort: abort },
            abortTimeout,
            abort = function (errorType) {
            isTimeout = 1;
            console.log(options.url, "timeout");
            ajaxError(null, "timeout", xhr, options);
        },
            isTimeout = 0;

        script.charset = options.charset || "utf-8";
        script.onload = script.onerror = function (e, errorType) {
            clearTimeout(abortTimeout);
            if (isTimeout) {
                console.log("load break off");
                return false;
            }
            if (e.type == 'error' || !responseData) {
                console.log(options.url, errorType || e.type || 'error');
                //302 e.type  load
                //404 502 e.type error
                ajaxError(null, errorType || e.type || 'error', xhr, options);
            } else {
                ajaxSuccess(responseData[0], xhr, options);
            }
            /*
             window[callbackName] = originalCallback;
             if (responseData && typeof originalCallback == 'function')
             originalCallback(responseData[0]);
              originalCallback = responseData = undefined;*/
        };

        window[callbackName] = function () {
            responseData = arguments;
        };

        script.src = options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName);
        document.head.appendChild(script);

        if (options.timeout > 0) abortTimeout = setTimeout(function () {
            abort('timeout');
        }, options.timeout * 1000);

        return xhr;
    }

    function ajaxPost(options) {
        var _callbackName = options.jsonpCallback,
            callbackName = (typeof _callbackName == 'function' ? _callbackName() : _callbackName) || 'jsonpCBK' + callbackSuffix[jsonpID++ % callbackSuffix.length],
            abortTimeout,
            xhr = { abort: abort },
            abort = function (errorType) {
            isTimeout = 1;
            console.log(options.url, "timeout");
            ajaxError(null, "timeout", xhr, options);
        },
            isTimeout = 0;

        window[callbackName] = function () {
            clearTimeout(abortTimeout);
            responseData = arguments;
            ajaxSuccess(responseData[0], xhr, options);
        };

        //如果是跨域post请求，用form表单
        formPost(options.url.replace(/\?(.+)=\?/, '?$1=' + callbackName), options.isFile);

        if (options.timeout > 0) abortTimeout = setTimeout(function () {
            window[callbackName] = empty;
            abort('timeout');
        }, options.timeout * 1000);
    }

    /**
     * 跨域的post请求用form模拟
     *
     */
    function formPost(url, isFile) {
        var form = document.getElementById("ajaxPostForm");
        var iframe = document.getElementById("ajaxPostIframe");
        if (!form) {
            form = document.createElement("form");
            form.id = "ajaxPostForm";
            iframe = document.createElement("iframe");
            iframe.height = 0;
            iframe.width = 0;
            iframe.id = iframe.name = "ajaxPostIframe";
            form.style.display = "none";
            document.body.appendChild(iframe);
            document.body.appendChild(form);
        }
        form.target = "ajaxPostIframe";
        form.action = url;
        form.method = "POST";
        form.enctype = isFile ? "multipart/form-data" : "application/x-www-form-urlencoded";
        form.submit();
    }

    function ajaxSuccess(data, xhr, settings) {
        var context = settings.context,
            status = 'success';
        settings.success.call(context, data, status, xhr);
        ajaxComplete(status, xhr, settings);
    }
    // type: "timeout", "error", "abort", "parsererror"
    function ajaxError(error, type, xhr, settings, deferred) {
        var context = settings.context;
        settings.error.call(context, type, error, xhr);
        ajaxComplete(type, xhr, settings);
    }
    // status: "success", "notmodified", "error", "timeout", "abort", "parsererror"
    function ajaxComplete(status, xhr, settings) {
        var context = settings.context;
        settings.complete.call(context, status, xhr);
    }

    function empty() {}

    function serializeData(options) {
        if (options.processData && options.data && typeof options.data != "string") options.data = param(options.data);
        if (options.data && (!options.type || options.type.toUpperCase() == 'GET')) options.url = appendQuery(options.url, options.data), options.data = undefined;
    }

    function mimeToDataType(mime) {
        if (mime) mime = mime.split(';', 2)[0];
        return mime && (mime == htmlType ? 'html' : mime == jsonType ? 'json' : scriptTypeRE.test(mime) ? 'script' : xmlTypeRE.test(mime) && 'xml') || 'text';
    }

    function appendQuery(url, query) {
        if (query == '') return url;
        return (url + '&' + query).replace(/[&?]{1,2}/, '?');
    }

    function addToken(url, type) {
        //type标识请求的方式,ls表loadscript，j132标识jquery，j126标识base，lk标识普通链接,fr标识form表单,ow打开新窗口
        var token = getToken();
        //只支持http和https协议，当url中无协议头的时候，应该检查当前页面的协议头
        if (url == "" || (url.indexOf("://") < 0 ? location.href : url).indexOf("http") != 0) {
            return url;
        }
        if (url.indexOf("#") != -1) {
            var f1 = url.match(/\?.+\#/);
            if (f1) {
                var t = f1[0].split("#"),
                    newPara = [t[0], "&g_tk=", token, "&g_ty=", type, "#", t[1]].join("");
                return url.replace(f1[0], newPara);
            } else {
                var t = url.split("#");
                return [t[0], "?g_tk=", token, "&g_ty=", type, "#", t[1]].join("");
            }
        }
        //无论如何都把g_ty带上，用户服务器端判断请求的类型
        return token == "" ? url + (url.indexOf("?") != -1 ? "&" : "?") + "g_ty=" + type : url + (url.indexOf("?") != -1 ? "&" : "?") + "g_tk=" + token + "&g_ty=" + type;
    };

    function getToken() {
        var skey = getCookie("wq_skey"),
            token = skey == null ? "" : time33(skey);
        return token;
    };

    function time33(str) {
        //哈希time33算法
        for (var i = 0, len = str.length, hash = 5381; i < len; ++i) {
            hash += (hash << 5) + str.charAt(i).charCodeAt();
        };
        return hash & 0x7fffffff;
    }

    function getCookie(name) {
        //读取COOKIE
        var reg = new RegExp("(^| )" + name + "(?:=([^;]*))?(;|$)"),
            val = document.cookie.match(reg);
        return val ? val[2] ? unescape(val[2]) : "" : null;
    }

    var escape = encodeURIComponent;

    function serialize(params, obj) {
        for (var key in obj) {
            params.add(key, obj[key]);
        }
    }

    function param(obj) {
        var params = [];
        params.add = function (k, v) {
            this.push(escape(k) + '=' + escape(v));
        };
        serialize(params, obj);
        return params.join('&').replace(/%20/g, '+');
    }

    //与子iframe传递消息---域名不同
    window.addEventListener('message', function (e) {
        if (!e || !e.data) return false;
        var callback = e.data.callback;
        if (callback && window[callback]) {
            window[callback](e.data.data);
        }
    });

    //if(typeof $ != 'undefined')$.ajax = ajax;
});