/**
 * XXX
 * @version 2016/3/28
 * @author luowenlin1
 */
define('fileupload', function (require, exports, module) {
    var dialog = require('modal');//提示语组件

    exports.init = function(){
        bindEvent();
    };
    
    /**
     * 绑定事件
     * */
    function bindEvent(){
        $("#uploadBtn").on("click",function(){
            //$("#uploadBtn").prop("disabled",true);
            setTimeout(function(){
                $("#file").val("");
            }, 1000);
        });
        $("#file").on("change",function(e){
            if($(this).val()){
                if(e.target.files&&e.target.files[0]&&e.target.files[0].size>10*1024*1024){
                    dialog.error("文件最大10M");
                    return;
                }
                $("#uploadBtn").removeAttr("disabled");
            }else{
                $("#uploadBtn").prop("disabled",true);
            }
        });
    }
});
