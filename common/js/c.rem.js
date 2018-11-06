/**
 * Created by zhuguangjie on 2018/11/6.
 */

(function (doc, win) {
    //px 转成 rem，   px*2/100
    var docEl = doc.documentElement,
        resizeEvt = 'orientationchange' in window ? 'orientationchange' : 'resize',
        recalc = function () {
            var clientWidth = docEl.clientWidth;
            if (clientWidth >= 750) {
                clientWidth = 750;
            }
            ;
            if (clientWidth <= 320) {
                clientWidth = 320;
            }
            if (!clientWidth) return;
            docEl.style.fontSize = 100 * (clientWidth / 750) + 'px';
        };
    if (!doc.addEventListener) return;
    win.addEventListener(resizeEvt, recalc, false);
    doc.addEventListener('DOMContentLoaded', recalc, false);
})(document, window);
