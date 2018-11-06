/**
 * Created by zhuguangjie on 2018/10/18.
 */
//禁止鼠标选择事件
document.body.style.webkitUserSelect = 'none'

new Vue({
    el: '#App',
    data: {
        maxPrize: {}, // 今日大奖
        winningItem: {}, // 中奖信息
        textZoneType: 1,// 1、未中奖 2、矿石 3、路由器 4、BCH 5、矿石不足 0、系统问题
        prizeListData: [], //奖品列表信息
        prizeIdMap: {}, // 记录奖项ID与奖品序列里下标对应关系{ID: index}
        topList: [],
        totalOreAmount: 0, //矿石总数
        doms : {
            c1: null,
            c2: null,
            ca: null
        },
        host: base.conf.host,
        USERTOKEN: base.login.getTk(),
        lotteryStatus: 'stop' // 转盘执行状态 转的时候值为 running, 停止时为 stop
    },
    mounted: function () {

        var me = this;

        this.getPrizeData(); //获取奖品数据

        this.initLottery(); //初始化转盘

        this.getTopList(); //今日top排行

        this.getTotalAmountQuery(); //矿石总数
    },
    methods: {
        toBCH: function () {
            console.log('去看矿石-appWinBCH')
            WebView.jsBridge.callHandler('appWinBCH', {}, function (data) { });
            this.closePop()
        },
        testToLogin: function () {
            base.login.toLogin();
        },
        closeWebview: function () {
            WebView.jsBridge.callHandler('appActivityFinish', {}, function () {});
        },
        //初始化滚动事件
        initScrollLi: function () {
            this.doms.c1 = document.getElementById("c1");
            this.doms.c2 = document.getElementById("c2");
            this.doms.ca = document.getElementById("ca");
            /*将第一个ul的值赋值给第二个  当第一个头部消失时 由第二个来显示*/
            this.doms.c2.innerHTML = this.doms.c1.innerHTML;
            setInterval(this.scrollLi,50);

        },
        scrollLi: function () {
            if(this.doms.ca.scrollTop >= this.doms.c1.offsetHeight){
                this.doms.ca.scrollTop = 0;
            }else{
                this.doms.ca.scrollTop++;
            }
        },
        //初始化转盘
        initLottery : function () {
            var self = this;
            var Deg = [0,45,90,135,180,225,270,315];
            function rotate1(index){

                index = typeof index == 'undefined' ? 0: index;

                var deg = 1800 + (360 - Deg[index]); // 默认转5圈+ 奖项偏移量

                console.log("deg=" + (360 - Deg[index]))


                TweenMax.set($(".inring"), {
                    rotation: 0
                });
                TweenMax.to($(".inring"), 8, {
                    rotation: deg,
                    //ease: Quint.easeOut,
                    onComplete: function(){
                        self.tweenMaxStop();
                    }
                });
            }
            //开始转动
            $(".btn").on("click",function(){

                if (self.lotteryStatus == 'running') return false;

                self.lotteryStatus = 'running'

                // 获取中奖奖品信息
                var url = self.host + "/lottery/userprize/lottery";
                $.ajax({
                    url: url,
                    type: 'post',
                    dataType: 'json',
                    headers: {
                        'X-SMINER-USERTOKEN': self.USERTOKEN,
                        'Content-Type': 'application/json'
                    },
                    success: function (res) {
                        if (res.code == 0) {
                            
                            //重新校正用户当前矿石,并且启用动画
                            self.getTotalAmountQuery(self.mineralCutDown);

                            self.winningItem = res.data;

                            console.log("winningItem", self.winningItem)

                            //1、未中奖 2、矿石 3、硬件(实物) 4、BCH 5、矿石不足 0、系统问题
                            if (self.winningItem.win) {

                                if (self.winningItem.type == 1 || self.winningItem.type == 2) {
                                    self.textZoneType = "3"
                                } else if (self.winningItem.type == 3) {
                                    self.textZoneType = "4"
                                } else if (self.winningItem.type == 4) {
                                    self.textZoneType = "2"
                                }
                            } else {
                                self.textZoneType = "1"
                            }

                            var index = self.prizeIdMap[self.winningItem.id].split("-")[0]

                            console.log('奖品下标:'+ index)

                            rotate1(index);

                        } else if (res.code == 30002){
                            self.textZoneType = "5"
                            self.lotteryStatus = 'stop'
                            self.openPop();
                        } else {
                            self.textZoneType = "0"
                            self.lotteryStatus = 'stop'
                            self.openPop();
                        }

                    },
                    error: function (resp) {
                        self.lotteryStatus = 'stop'
                        if (resp.status = '401') {
                            base.login.toLogin()
                        }
                    }
                })

            })
        },
        tweenMaxStop: function () {
            // 1-R1、2-R3、3-BCH、4-矿石
            this.openPop();
            this.lotteryStatus = 'stop'
        },
        joinTop: function (item) {
            console.log(item)
            var unit = item.unit ? item.unit : "";
            return item.prizeValue + unit
        },
        joinRes: function () {
            var value = this.winningItem.value;
            var name = this.winningItem.name;
            var unit = this.winningItem.unit ? this.winningItem.unit : " ";
            return value + unit + name
        },
        //获取奖品数据
        getPrizeData: function () {
            var self = this
            //var url = 'http://10.30.60.146:9080/mockjsdata/4/lottery/prize/list';
            var url = this.host + "/lottery/prize/list";
            $.ajax({
                url: url,
                dataType: 'json',
                headers: {
                    'X-SMINER-USERTOKEN': this.USERTOKEN
                },
                success: function (res) {
                    if (res.code == 0) {
                        self.prizeListData = res.data
                        console.log("prizeListData", self.prizeListData)
                        self.ctLevel(self.prizeListData)
                    }
                },
                error: function (resp) {
                    if (resp.status = '401') {
                        base.login.toLogin()
                    }
                }
            })
        },
        //计算获取奖品列表里prizeIdMap
        ctLevel: function (data) {

            var levelArr = []
            var levelMap = {}

            for (var i = 0; i < data.length; i++) {
                levelArr.push(data[i].level)
                levelMap[data[i].level] = data[i]
                this.prizeIdMap[data[i].id] = i + '-' + data[i].text;
            }
            //var max = Math.max.apply(Math, levelArr);

            //this.maxPrize = levelMap[max]

            //console.log("maxPrize", this.maxPrize)
            console.log("map", this.prizeIdMap)
        },
        //今日top排行
        getTopList: function () {
            var self = this;
            //var url = "http://10.30.60.146:9080/mockjsdata/4/lottery/userprize/top";
            var url = this.host + "/lottery/userprize/top";
            $.ajax({
                url: url,
                dataType: 'json',
                headers: {
                    'X-SMINER-USERTOKEN': this.USERTOKEN
                },
                success: function (res) {
                    if (res.code == 0) {
                        self.topList = res.data.concat(res.data)
                        setTimeout(function () {
                            self.initScrollLi(); //初始化滚动事件
                        },150)
                    }
                },
                error: function (resp) {
                    if (resp.status = '401') {
                        base.login.toLogin()
                    }
                }
            })
        },
        //矿石减去动画效果
        mineralCutDown: function () {
            $('.coutdown_animation').addClass('fadeOutUp');
            $('.ore-count span').addClass('changeColors');
        　　setTimeout(function(){
                $('.coutdown_animation').removeClass('fadeOutUp');
                $('.ore-count span').removeClass('changeColors');
        　　},1500);
        },
        //矿石总数
        getTotalAmountQuery: function (callback) {
            var self = this;
            var url = this.host + "/account/totalAmountQuery";
            console.log("X-SMINER-USERTOKEN:",this.USERTOKEN);
            $.ajax({
                url: url,
                dataType: 'json',
                headers: {
                    'X-SMINER-USERTOKEN': this.USERTOKEN
                },
                success: function (res) {
                    if (res.code == 0) {
                        console.log("矿石总数",res.data)
                        self.totalOreAmount = res.data.totalOreAmount;
                        if (callback) {
                            self.mineralCutDown()
                        }
                    }
                },
                error: function (resp) {
                    if (resp.status = '401') {
                        base.login.toLogin()
                    }
                }
            })
        },
        toLogin: function () {
            console.log('登录失效去登录')
        },
        //去奖品领取页面
        toTransaction: function () {
            window.location.href = "./userPList.html";
        },
        closePop: function () {
            console.log("close")
            $("#js-layer-out").hide();
            $("#js-msg-pop").hide();
        },
        openPop: function () {
            $("#js-layer-out").show();
            $("#js-msg-pop").show();
        },
        imgUrl: function(url) {
            if(url) {
                return "data:image/png;base64," + url
            } else {
                return "../../../reslib/images/user-default@3x.png"
            }
        },
        toStrategy: function () {
            window.location.href = "../explain/strategy.html?wap=y";
        }
    }
})