/**
 * Created by zhuguangjie on 2018/10/18.
 */
new Vue({
    el: '#App',
    data: {
        addressList: [],
        host: base.conf.host,
        USERTOKEN: base.login.getTk(),
        items: [],
        checkId: -1,
        prizeId: _.URISearch("id"),
        orderType: _.URISearch("otype"),
    },
    mounted: function () {
        this.getAddressList();
    },
    methods: {
        getAddressList: function () {
            var self = this;
            var url = self.host + "/useraddress/list";
            console.log("getAddressList=>" + this.USERTOKEN)
            $.ajax({
                url: url,
                dataType: 'json',
                headers: {
                    'X-SMINER-USERTOKEN': this.USERTOKEN
                },
                success: function (res) {
                    if (res.code == 0) {
                        for (var i = 0; i < res.data.length; i++) {
                            if (res.data[i].id == self.checkId || (self.checkId == -1 && i == 0)) {
                                self.checkId = res.data[i].id
                                res.data[i].isSeled = true
                            } else {
                                res.data[i].isSeled = false;
                            }
                        }
                        console.log(res.data)
                        self.items = res.data;
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
        },
        radioSel: function (i) {
            var self = this;
            var selectItem = this.items[i]
            if (selectItem.id != self.checkId) {
                var flag = !selectItem.isSeled;
                self.items.map(function (item, index, array) {
                    self.$set(self.items[index], "isSeled", false);
                });
                self.$set(selectItem, "isSeled", flag);
                self.checkId = flag ? selectItem.id : -1;
                console.log(self.checkId);
            }
        },
        goEdit: function (addressId) {
            console.log('去编辑了' + addressId);
            var self = this
            WebView.jsBridge.callHandler('appEditAddress', addressId, function (data) {
                console.log('编辑成功');
                self.getAddressList();
            });
        },
        goAdd: function () {
            console.log('去添加了');
            var self = this
            WebView.jsBridge.callHandler('appEditAddress', "", function () {
                console.log('添加成功');
                self.getAddressList();
            });
        },
        gotoReceive: function () {
            $(".bit_confirm_zone").fadeIn();
        },
        goBack: function () {
            var referrer= document.referrer;
            if (referrer.indexOf("/activity/r1.html")) {
                document.location.href = referrer
            } else {
                window.history.back()
            }
        },
        confirmNO: function () {
            $(".bit_confirm_zone").fadeOut();
        },
        confirmOK: function () {
            var self = this;
            var url = self.host + "/order/gotoReceive";
            var param = {
                id: self.prizeId,
                userAddressId: self.checkId,
                orderType: self.orderType
            };
            $.ajax({
                url: url,
                type: 'post',
                dataType: 'json',
                data:JSON.stringify(param),
                headers: {
                    'X-SMINER-USERTOKEN': this.USERTOKEN,
                    'Content-Type': 'application/json',
                },
                success: function (res) {
                    if (res.code == 0) {
                        console.log(res.msg)
                        if (self.orderType == 1) {
                            window.location.href = "../lotteryDraw/userPList.html"
                        } else if (self.orderType == 2) {
                            window.location.href = "../activity/r1.html"
                        }
                    } else {
                        console.log(res.msg)
                    }
                },
                error: function (resp) {
                    if (resp.status = '401') {
                        self.toLogin()
                    }
                }
            })
        }
    }
})