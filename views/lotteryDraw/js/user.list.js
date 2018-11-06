/**
 * Created by zhuguangjie on 2018/10/18.
 */
$(function() {

    var utk = base.login.getTk();

    var openOrderDetailPop = function () {
        $("#js_order_detail").fadeIn("slow");
        $("#js_layeout_order_pop").fadeIn("slow")
    }

    var closeOrderDetailPop = function() {
        $("#js_order_detail").fadeOut("slow");
        $("#js_layeout_order_pop").fadeOut("slow")
    }

    $(document).on("click","#js_layeout_order_pop_close" ,function(){
        closeOrderDetailPop()
    });
    $(document).on("click","#js_order_detail_close" ,function(){
        closeOrderDetailPop()
    });

    $(document).on("click",".js-to-receive" ,function(){
        var id = $(this).attr('id')
        window.location.href = "../transaction/index.html?otype=1&id=" + id;
    });

    $(document).on("click",".js-to-order-detail", function () {
        var id = $(this).attr('id');
        var statusText = $(this).html();
        var url = base.conf.host + "/order/record";
        $.ajax({
            url: url,
            type: 'get',
            dataType: 'json',
            data:{
                recordId: id,
                type: '1'
            },
            headers: {
                'X-SMINER-USERTOKEN': utk
            },
            success: function (res) {
                if (res.code == 0 && res.data) {
                    $("#receiverAddress").empty().append(res.data.receiverAddress)
                    $("#receiverName").empty().append(res.data.receiverName)
                    $("#receiverPhone").empty().append(res.data.receiverPhone)
                    $("#orderNo").empty().append(res.data.orderNo)
                    $("#orderStatus").empty().append(statusText)
                    $("#remark").empty().append(res.data.remark)
                    openOrderDetailPop()
                } else {
                    console.log(res.msg)
                }
            },
            error: function (resp) {
                if (resp.status = '401') {
                    base.login.toLogin()
                }
            }
        })
    })

    //页面渲染
    var render = function(data) {
        var sb = new _.StringBuffer();
        var escapeDate = function(dateStr) {
            var a = _.dateParse(dateStr);
            var b = _.dateFormat(a, "yyyy/MM/dd HH:mm");
            return b;
        };
        if(data.length > 0) {
            sb.append('<table border="0">')
            for(var i = 0; i < data.length; i++) {
                sb.append('<tr>')
                sb.append('<td>'+ data[i].date +'</td>')
                sb.append('<td>'+ data[i].value + data[i].unit + data[i].name +'</td>')
                /*
                 *  type: R1(1, "R1"), R3(2, "R3"), BCH(3, "BCH")
                 *  status: 1, "待领取",2, "已领取",3, "待发货",4, "已发货"
                 *  逻辑说明 如果是R1和R3,判断 status 为1的时候 显示成按钮,所有文案都使用statusStr
                 * */
                if (data[i].type == 1 || data[i].type == 2) {
                    if (data[i].status == 1) {
                        sb.append('<td><span class="js-to-receive" id="'+ data[i].id +'">'+ data[i].statusStr +'</span></td>')
                    } else {
                        sb.append('<td><span class="js-to-order-detail" id="'+ data[i].id +'">'+ data[i].statusStr +'</span></td>')
                    }
                } else {
                    sb.append('<td>'+ data[i].statusStr +'</td>')
                }
                sb.append('</tr>')
            }
            sb.append('</table>')
        } else {
            sb.append('<div>暂无数据</div>');
        }
        return sb.toString();
    }
    var createLoadData = function(page, size) {

        // dropload
        $('#j-hasData').dropload({
            page: page,
            size: size,
            scrollArea: window,
            domDown: {
                domClass: 'dropload-down',
                domRefresh: '<div class="dropload-refresh">↑上拉加载更多</div>',
                domLoad: '<div class="dropload-load"><span class="loading"></span>数据加载中...</div>',
                domNoData: '<div class="dropload-noData">没有更多数据了</div>'
            },
            loadDownFn: function(me) {
                // 拼接HTML
                var result = '';
                var param = {
                    type: 1, // 1表示全部待服务订单
                    pageNum: me.opts.page,
                    pageSize: me.opts.size,
                }
                var noDefaultData = function(){
                    $('#j-hasData').hide();
                    $('#j-hasHeader').hide();
                    $('#j-noData').show();
                }
                $.ajax({
                    type: 'get',
                    url: base.conf.host + "/lottery/userprize/list",
                    data: param,
                    headers: {
                        'X-SMINER-USERTOKEN': utk
                    },
                    dataType: 'json',
                    success: function(ret) {
                        //ret.code = 1
                        if(ret.code == "0"){
                            if(ret.data.length && me.opts.page == 1) {
                                $('#j-hasData').show();
                                $('#j-hasHeader').show();
                                $('#j-noData').hide();
                                result = render(ret.data);
                                if(me.opts.page == 1){ //默认读第一页数据时，先清空dom
                                    $('#j-hasData').empty().append(result);
                                }else{//否则数据追加在dom上
                                    $('#j-hasData').append(result);
                                }
                                // 如果没有数据
                            } else {
                                if(me.opts.page == 1){ //只有第一次默认加载时没有数据才显示默认没有数据的交互
                                    noDefaultData();
                                }
                                // 锁定
                                me.lock();
                                // 无数据
                                me.noData();
                            }
                            // 为了测试，延迟1秒加载
                            me.opts.page++;
                            me.resetload();
                        }else if(ret.code == -2){
                            noDefaultData();
                            // 锁定
                            me.lock();
                            // 无数据
                            me.noData();
                            // 即使加载出错，也得重置
                            me.resetload();

                        }else{
                            noDefaultData();
                            // 锁定
                            me.lock();
                            // 无数据
                            me.noData();
                            // 即使加载出错，也得重置
                            me.resetload();
                        }
                    },
                    error: function(xhr, type) {
                        noDefaultData();
                        // 锁定
                        me.lock();
                        // 无数据
                        me.noData();
                        // 即使加载出错，也得重置
                        me.resetload();
                    }
                });
            },
            threshold: 50,
        });
    }
    createLoadData(1, 10);
});