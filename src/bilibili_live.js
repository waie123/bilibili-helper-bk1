/**
 * Created by Ruo on 4/12/2016.
 */
(function () {
    if (location.hostname == 'live.bilibili.com') {
        if (!store.enabled) return;
        store.delete = function (key, value) {
            if (key === undefined) return;
            var o = store.get(key);
            if (o == undefined) return;
            if (value !== undefined && value !== null) {
                if (typeof value === 'string' || typeof value === 'number') {
                    o[value] && delete o[value];
                    store.set(key, o);
                }
            } else store.remove(key);
        };
        var Live = { scriptOptions: {}, hasInit: false, giftList: {}, mobileVerified: 0 };
        Live.addScriptByFile = function (fileName, options) {
            var a = document.createElement('script');
            a.id = 'bilibiliHelperScript'
            a.src = chrome.extension.getURL(fileName);
            typeof options == 'object' && a.setAttribute('options', JSON.stringify(options));
            document.body.appendChild(a);
        }
        Live.addScriptByText = function (text) {
            var a = document.createElement('script');
            a.innerHTML = text;
            document.body.appendChild(a);
        }
        Live.getDateDiff = function (startDate, endDate) {
            var startTime = new Date(Date.parse(startDate.replace(/-/g, "/"))).getTime();
            var endTime = new Date(Date.parse(endDate.replace(/-/g, "/"))).getTime();
            var dates = Math.abs((startTime - endTime)) / (1000 * 60 * 60 * 24);
            return dates;
        }
        Live.getRoomHTML = function (url) {
            return $.get('http://live.bilibili.com/' + url).promise();
        };
        Live.getRoomIdByUrl = function (url, callback) {
            var id = store.get('bilibili_helper_live_roomId')[url];
            if (id != undefined) callback(id);
            else Live.getRoomHTML(url).done(function (roomHtml) {
                var reg = new RegExp("var ROOMID = ([\\d]+)");
                var roomID = reg.exec(roomHtml)[1];
                if (roomID) {
                    var o;
                    (o = store.get('bilibili_helper_live_roomId'))[url] = roomID;
                    store.set('bilibili_helper_live_roomId', o);
                    if (typeof callback == 'function') callback(roomID);
                }
            }).fail(function (res) {
                if (res.status != 404) Live.getRoomIdByUrl(url, callback);
            });
        };
        Live.getUser = function () {
            return $.getJSON("/user/getuserinfo").promise();
        };
        Live.getMedalList = function () {
            return $.getJSON("http://live.bilibili.com/i/ajaxGetMyMedalList").promise();
        };
        Live.each = function (obj, fn) {
            if (!fn) return;
            if (obj instanceof Array) {
                var i = 0,
                    len = obj.length;
                for (; i < len; i++) {
                    if (fn.call(obj[i], i) == false)
                        break;
                }
            } else if (typeof obj === 'object') {
                var j = null;
                for (j in obj) {
                    if (fn.call(obj[j], j) == false)
                        break;
                }
            }
        };
        Live.getCookie = function (name) {
            var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");
            if (arr = document.cookie.match(reg))
                return unescape(arr[2]);
            else
                return null;
        };
        Live.setCookie = function (name, value, seconds) {
            seconds = seconds || 0;
            var expires = "";
            if (seconds != 0) {
                var date = new Date();
                date.setTime(date.getTime() + (seconds * 1000));
                expires = "; expires=" + date.toGMTString();
            }
            document.cookie = name + "=" + escape(value) + expires + "; path=/";
        };
        Live.liveQuickLogin = function () {
            if (!Live.getCookie("DedeUserID") && !Live.getCookie("LIVE_LOGIN_DATA")) {
                try {
                    if (!window.biliQuickLogin) {
                        $.getScript("https://static-s.bilibili.com/account/bili_quick_login.js", function (response, status) {
                            status === "success" && login();
                        });
                    } else {
                        login();
                    }
                } catch (tryErr) {
                    throw new Error(tryErr);
                }
            }

            function login() {
                if (window.biliQuickLogin) {
                    window.biliQuickLogin(function () { window.location.reload(); });
                    throw "Bilibili Live: ??????????????????????????????~~ -_-";
                } else {
                    throw "Bilibili Live: ?????????????????????????????????.";
                }
            }
        };
        Live.getRoomId = function () {
            return store.get('bilibili_helper_live_roomId')[location.pathname.substr(1)];
        };
        Live.getRoomInfo = function () {
            return $.getJSON("/live/getInfo?roomid=" + Live.roomId).promise();
        };
        Live.numFormat = function (num) {
            var number = num;
            if (num >= 10000) number = (num / 10000).toFixed(1) + '???';
            return number;
        };
        Live.rgb2hex = function (rgb) {
            function zero_fill_hex(num, digits) {
                var s = num.toString(16);
                while (s.length < digits)
                    s = "0" + s;
                return s;
            }

            if (rgb.charAt(0) == '#') return rgb;

            var ds = rgb.split(/\D+/);
            var decimal = Number(ds[1]) * 65536 + Number(ds[2]) * 256 + Number(ds[3]);
            return "#" + zero_fill_hex(decimal, 6);
        };
        Live.getDomType = function (t) {
            var e = Object.prototype.toString.call(t),
                n = /HTML.*.Element/;
            return "[object Object]" === e && t.jquery ? "jQuery Object" : "[object Object]" === e ? "Object" : "[object Number]" === e ? "Number" : "[object String]" === e ? "String" : "[object Array]" === e ? "Array" : "[object Boolean]" === e ? "Boolean" : "[object Function]" === e ? "Function" : "[object Null]" === e ? "null" : "[object Undefined]" === e ? "undefined" : e.match(n) ? "HTML Element" : "[object HTMLCollection]" === e ? "HTML Elements Collection" : null
        };
        Live.randomEmoji = {
            list: {
                happy: ["(?????????????)", "=???=???", "????????", "(/ ??? \\)", "(=????????=)", "(???'???'???)??????", "<(?????????????)>", "(??? ???????????????????? ???)", "(???,,??? ??? ???,,)??? ???"],
                shock: [",,???????,,", "(?????????????)", "??( ?? ??? ??|||)???", "???( ???_???)???", "(???????????????????)!?"],
                sad: ["???(??? ???? ??;)???", "?????????", "?????????", "?????????", "(??????????`)"],
                helpless: ["?????????", "?????????????????????", "_(:3 ??????)_", "_(????????:)_", "(/???????????)", "(???????)???"]
            },
            happy: function () {
                return Live.randomEmoji.list.happy[Math.floor(Math.random() * Live.randomEmoji.list.happy.length)]
            },
            sad: function () {
                return Live.randomEmoji.list.sad[Math.floor(Math.random() * Live.randomEmoji.list.sad.length)]
            },
            shock: function () {
                return Live.randomEmoji.list.shock[Math.floor(Math.random() * Live.randomEmoji.list.shock.length)]
            },
            helpless: function () {
                return Live.randomEmoji.list.helpless[Math.floor(Math.random() * Live.randomEmoji.list.helpless.length)]
            }
        };
        Live.countdown = function CountDown(param) {
            if (!(this instanceof Live.countdown)) {
                return new Live.countdown(param);
            }
            var dateNow = new Date(),
                endTime = param.endTime;

            if (!endTime || !(endTime instanceof Date) || endTime.getTime() <= dateNow.getTime()) {
                console.log("???????????????????????????");
                return;
            }

            // Definition: ???????????????.
            var interval = setInterval(function () {
                var ms = endTime.getTime() - dateNow.getTime(); // ????????????????????????: ??????.
                var mm = Math.floor(ms / 60 / 1000); // ????????????????????????: ??????.
                var s = ms - (mm * 60 * 1000); // ??????????????????????????????: ??????????????? - ?????????????????????
                var ss = Math.floor(s / 1000); // ???????????????????????????.
                mm = mm < 10 ? "0" + mm : mm;
                ss = ss < 10 ? "0" + ss : ss;

                // Action: ??? HTML ???????????????.
                var outputTime = mm + ":" + ss;
                if (Live.getDomType(param.element) === "jQuery Object") {
                    param.element.html(outputTime);
                } else {
                    param.element.innerHTML = outputTime;
                }

                // Action: ???????????????.
                if (mm == "00" && ss == "00") {
                    clearInterval(interval);
                    param.callback && param.callback();
                    return;
                }

                endTime.setSeconds(endTime.getSeconds() - 1);

            }, 1000);

            this.countDown = interval;
        };
        Live.countdown.prototype.clearCountdown = function () {
            clearInterval(this.countDown);
        };
        Live.console = {
            option: {
                display: {
                    "danmu": false,
                    "tv_end": false,
                    "gift": false,
                    "system": false,
                    "tv": false,
                    "sys_gift": true
                }
            },
            watcher: function (msg) {
                console.log("%c??????:" + msg, "color:#FFFFFF;background-color:#4fc1e9;padding:5px;border-radius:7px;line-height:30px;");
            },
            info: function (type, json) {
                if (type == 'danmu' && Live.console.option.display['danmu']) {
                    var danmu = json.info[1];
                    var userId = json.info[2][0];
                    var username = json.info[2][1];
                    var userUL = json.info[4][0];
                    var userULRank = json.info[4][1];
                    console.log("%c(UL:" + userUL + ')' + userId + '-' + username + ':' + danmu + ' ??????:' + userULRank, "color:#FFFFFF;background-color:#646c7a;padding:5px;border-radius:7px;line-height:30px;");
                } else if (type == 'system' && Live.console.option.display['system']) {
                    // var a = {
                    //     cmd: "SYS_MSG",
                    //     msg: "?????????????????????????????????44515????????? ?????????????????????????????????",
                    //     rep: 1,
                    //     styleType: 2,
                    //     url: "http://live.bilibili.com/44515"
                    // };
                    var msg = json.msg;
                    var url = json.url;
                    console.log("%c????????????:" + msg + ' ??????:' + url, "color:#FFFFFF;background-color:#e74e8f;padding:5px;border-radius:7px;line-height:30px;");
                } else if (type == 'tv_end' && Live.console.option.display['tv_end']) {
                    // var a = {
                    //     "cmd": "TV_END",
                    //     "data": {
                    //         "id": 5467,
                    //         "sname": "??????????????????",
                    //         "uname": "????????????Li"
                    //     },
                    //     "roomid": "20105"
                    // };
                    console.log(json);
                } else if (type == 'gift' && Live.console.option.display['gift']) {
                    // var a = {
                    //     "cmd": "SEND_GIFT",
                    //     "data": {
                    //         "giftName": "??????",
                    //         "num": 11,
                    //         "uname": "?????????",
                    //         "rcost": 26870158,
                    //         "uid": 7915142,
                    //         "top_list": [],
                    //         "timestamp": 1468160121,
                    //         "giftId": 1,
                    //         "giftType": 0,
                    //         "action": "??????",
                    //         "super": 0,
                    //         "price": 100,
                    //         "rnd": "1468156041",
                    //         "newMedal": 0,
                    //         "medal": 1,
                    //         "capsule": []
                    //     },
                    //     "roomid": 1029
                    // };
                    var gift = json.data['giftName'];
                    var count = json.data['num'];
                    var uname = json.data['uname'];
                    console.log("%c??????:" + gift + ' x' + count + ' ?????????:' + uname, "color:#FFFFFF;background-color:#ff8e29;padding:5px;border-radius:7px;line-height:30px;");
                } else if (type == 'sys_gift' && Live.console.option.display['sys_gift']) {
                    // var a = {
                    //     "cmd": "SYS_GIFT",
                    //     "msg": "???????????????:? ???Hoshilily???:??????????81688:??????????:?36:????100????????????1?????????????????????????????????????????????",
                    //     "tips": "????????????????????????????????????81688?????? ?????? ????????? 100 ???????????? 1 ?????????????????????????????????????????????",
                    //     "rep": 1,
                    //     "msgTips": 1,
                    //     "url": "http://live.bilibili.com/81688",
                    //     "roomid": 81688,
                    //     "rnd": "1468493403"
                    // };
                    console.log("%c????????????:" + json.tips + ' ??????:' + json.url, "color:#FFFFFF;background-color:#e74e8f;padding:5px;border-radius:7px;line-height:30px;");
                }
            }
        };
        Live.createPanel = function (parentDOM, toggleDom, eventName, className, id, callback) {
            var openEvent, closeEvent, d;
            switch (eventName) {
                case 'click':
                    openEvent = eventName;
                    closeEvent = eventName;
                    break;
                case 'mouseenter':
                case 'hover':
                case 'mouseover':
                    openEvent = 'mouseenter';
                    closeEvent = 'mouseleave';
                    break;
            }
            var panel = $('<div />').addClass('live-hover-panel arrow-top ' + className).attr('id', id);
            parentDOM.append(toggleDom, panel);
            toggleDom.off(openEvent).on(openEvent, function (t) {
                t.stopPropagation();
                $(window).click();
                if (panel.hasClass('show')) {
                    typeof $(window)[closeEvent] == 'function' && $(window)[closeEvent]();
                    return;
                }
                panel.addClass('show');

                function n(t) {
                    t.stopPropagation();
                    var e = t && (t.target || t.srcElement);
                    if (!$(e).hasClass(className) && !$(e).parents('.' + className).length) {
                        panel.addClass('out');
                        setTimeout(function () {
                            $(window).off(openEvent, n);
                            panel.removeClass('out').removeClass('show').css('display', '');
                        }, 300);
                    }
                }
                setTimeout(function () {
                    $(window).off(closeEvent).on(closeEvent, n);
                }, 1);
                if (typeof callback == 'function') callback();
            });
            return panel;
        };
        Live.liveToast = function (dom, type, msg) {
            if (n = type || "info", "success" !== n && "caution" !== n && "error" !== n && "info" !== n) return;
            var c = document.createDocumentFragment();
            var u = document.createElement("div");
            u.innerHTML = "<i class='toast-icon info'></i><span class='toast-text'>" + msg + Live.randomEmoji.helpless() + "</span>", u.className = "live-toast " + n;
            var d = null;
            switch (Live.getDomType(dom)) {
                case "HTML Element":
                    d = dom;
                    break;
                case "jQuery Object":
                    d = dom[0];
                    break;
                default:
                    throw new Error(a.consoleText.error + "????????? Live Toast ??????????????????????????? Dom ?????????????????? jQuery ??????.")
            }

            function o(t) {
                var e = t.offsetLeft;
                return null !== t.offsetParent ? e += o(t.offsetParent) : void 0, e
            }

            function i(t) {
                var e = t.offsetTop;
                return null !== t.offsetParent ? e += i(t.offsetParent) : void 0, e
            }

            var f = { width: $(d).width(), height: $(d).height() },
                p = o(d),
                m = i(d);
            $(u).css({ left: p + f.width });
            var v = 0;
            v = document.body.scrollTop, $(u).css({ top: m + f.height }), setTimeout(function () {
                $(u).addClass("out"), setTimeout(function () {
                    $(u).remove(), c = u = d = f = p = m = v = null
                }, 400)
            }, 2e3), c.appendChild(u), document.body.appendChild(c);
            var h = $(window).width(),
                g = u.offsetWidth,
                y = u.offsetLeft;
            0 > h - g - y && $(u).css({ left: h - g - 10 }), h = g = y = null
        };
        Live.doSign = {
            getSignInfo: function () {
                return $.getJSON("/sign/GetSignInfo").promise();
            },
            init: function () {
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'doSign',
                }, function (response) {
                    if (response['value'] == 'on') {
                        var username = store.get('bilibili_helper_userInfo')['username'];
                        var o;
                        (o = {})[username] = { today: false, date: undefined };
                        store.set('bilibili_helper_doSign', o);
                        Live.doSign.getSignInfo().done(function (data) {
                            if (data.code == 0 && data.data.status == 0) {
                                Live.doSign.sign();
                                // $('.sign-up-btn').click();
                                setInterval(Live.doSign.sign, 60000); //doSign per 1 min
                            } else if (data.code == 0 && data.data.status == 1) {
                                var username = store.get('bilibili_helper_userInfo')['username'];
                                var o;
                                (o = store.get('bilibili_helper_doSign'))[username] = { today: true, date: new Date().getDate() }
                                store.set('bilibili_helper_doSign', o);
                            }
                        });
                    }
                });
            },
            sign: function () {
                /*check login*/

                var date = new Date().getDate();
                var username = store.get('bilibili_helper_userInfo')['username'];
                if (!store.get('bilibili_helper_doSign')[username].today || store.get('bilibili_helper_doSign')[username].date != date) {
                    $.get("/sign/doSign", function (data) {
                        var e = JSON.parse(data),
                            msg;
                        //    {
                        //    "code": 0,
                        //    "msg": "ok",
                        //    "data": {
                        //        "text": "200\u94f6\u74dc\u5b50,3000\u7528\u6237\u7ecf\u9a8c\u503c",
                        //        "lottery": {"status": false, "lottery": {"id": "", "data": ""}},
                        //        "allDays": "30",
                        //        "hadSignDays": 22,
                        //        "remindDays": 8
                        //    }
                        //};
                        if (e.code == 0) {
                            //noinspection JSDuplicatedDeclaration
                            msg = new Notification("????????????", {
                                body: "????????????" + e.data.text,
                                icon: "//static.hdslb.com/live-static/images/7.png"
                            });
                            var o;
                            (o = store.get('bilibili_helper_doSign'))[username] = { today: true, date: date };
                            store.set('bilibili_helper_doSign', o);
                            setTimeout(function () {
                                msg.close();
                            }, 10000);
                            var spans = $('.body-container').find('.room-left-sidebar .sign-and-mission .sign-up-btn .dp-inline-block span');
                            $(spans[0]).hide(), $(spans[1]).show();
                        } else if (e.code == -500) {
                            msg = new Notification(eval("'" + e.msg + "'"), {
                                body: "??????????????????",
                                icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-1.gif"
                            });
                            var o;
                            (o = store.get('bilibili_helper_doSign'))[username] = { today: true, date: date };
                            store.set('bilibili_helper_doSign', o);
                            setTimeout(function () {
                                msg.close();
                            }, 10000);
                        } else {
                            msg = new Notification(eval("'" + e.msg + "'"), {
                                body: "",
                                icon: "//static.hdslb.com/live-static/live-room/images/gift-section/gift-1.gif"
                            });
                            setTimeout(function () {
                                msg.close();
                            }, 10000);
                        }
                    });
                }
            }
        };
        Live.Queue = function (which) {
            var o = {};
            o.id = new Date().getTime();
            o.which = which;
            o.total = 0;
            o.run = [];
            o.wait = [];
            o.error = [];
            o.success = [];
            o.cancel = [];
            o.add = function (appoint, state) {
                state = state == undefined ? 'wait' : state;
                o[state].push(appoint);
            };
            o.empty = function () {
                $('#quiz_helper').find(o.which + '-box *').addClass('hide');
                o.run = [];
                o.wait = [];
                o.error = [];
                o.cancel = [];
                o.success = [];
            };
            o.remove = function (appoint) {
                var index = o[appoint.state].indexOf(appoint);
                if (index != -1) {
                    o[appoint.state].splice(index, 1);
                    appoint.destory();
                }
            };
            o.pushQueue = function (appoint, state) {
                if (appoint.state != state) {
                    state = state == undefined ? 'wait' : state;
                    o.remove(appoint);
                    if (state != 'run') {
                        if (state == 'success') {
                            o.total += appoint.number;
                            //o.updateTotal();
                        }
                        appoint.state = state;
                        o.add(appoint, state);
                        appoint.create_dom().updateMenu();
                    } else {
                        appoint.state = 'run';
                        if (o.run.length > 0) {
                            var a = o.run.shift();
                            a.wait().updateMenu();
                            o.wait.unshift(a);
                        }
                        o.run.push(appoint);
                        appoint.create_dom(true).updateMenu();
                    }
                }
            };
            o.updateTotal = function () {
                Live.bet[o.which + '_sum_number'].text(o.total);
            };
            return o;
        };
        Live.Appoint = function (which, rate, number, state) {
            //var queueStr = {'0': 'cancel', '1': 'success', '2': 'error', '3': 'wait', '4': 'run'};
            var o = {};
            o.id = new Date().getTime();
            o.which = which;
            o.rate = rate;
            o.number = number;
            /*0:cancel,1:success,2:error,3:wait,4:run*/
            o.state = state == undefined ? 'wait' : state;
            o.emit = function (which, state) {
                /*set state*/
                o.state = state == undefined ? o.state : state;
                o.create_dom();

                /*emit*/
                Live.bet[which + '_box'].append(o.dom);
                Live.bet[which + '_queue'].pushQueue(o);
                Live.bet.checkQueue();
                return o;
            };
            o.create_dom = function (top) {
                if (o.dom == undefined) {
                    var rate_dom = $('<span>').addClass('rate').text(rate);
                    var number_dom = $('<h4>').addClass('number').text(Live.numFormat(o.number));
                    o.menu = $('<div>').addClass('menu');
                    o.dom = $('<div>').addClass('count').addClass(o.state).attr({
                        id: o.id,
                        rate: rate,
                        number: o.number
                    }).append(number_dom, rate_dom, $('<a>').addClass('close'), o.menu);
                    o.updateMenu();
                    var success_dom = Live.bet[which + '_box'].children('.success:last');
                    if (top) {
                        if (success_dom.length != 0) {
                            success_dom.after(o.dom);
                        } else Live.bet[which + '_box'].prepend(o.dom);
                    } else Live.bet[which + '_box'].append(o.dom);
                }
                return o;
            };
            o.updateMenu = function () {
                o.menu.empty();
                o.menu_delete = $('<span class="delete"></span>').off('click').click(function () {
                    Live.bet[o.which + '_queue'].remove(o);
                });
                o.menu_reset = $('<span class="reset"></span>').off('click').click(function () {
                    Live.bet[o.which + '_queue'].pushQueue(o, 'wait');
                });
                o.menu_run = $('<span class="run"></span>').off('click').click(function () {
                    Live.bet[o.which + '_queue'].pushQueue(o, 'run');
                });
                if (o.state == 'run' || o.state == 'success' || o.state == 'error' || o.state == 'cancel') {
                    o.menu.append(o.menu_reset, o.menu_delete);
                } else if (o.state == 'wait') {
                    o.menu.append(o.menu_run, o.menu_delete);
                }
                return o;
            };
            o.run = function (bet) {
                if (!bet) return false;
                o.state = 'run';
                /*deal style class*/
                o.dom.removeClass('cancel wait error success');
                if (!o.dom.hasClass('run')) o.dom.addClass('run');

                /*get data*/
                var w = (o.which == 'blue') ? 'a' : 'b';
                var bankerId = bet.silver[w].id;
                var rate = bet.silver[w].times;
                //var amount = bet.silver[w].amount;
                /*be canceled*/
                if (Live.bet.stop) clearInterval(store.get('bilibili_helper_quiz_bet')[Live.roomId]);
                if (rate >= o.rate) {
                    $.ajax({
                        url: 'http://live.bilibili.com/bet/addBettor',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            bankerId: bankerId,
                            amount: o.number,
                            token: Live.getCookie('LIVE_LOGIN_DATA')
                        },
                        complete: function (data) {
                            var b = JSON.parse(data.responseText);
                            if (b.code == -400) { //error
                                if (b.msg == '?????????,???????????????????????????') {} else o.error(b);
                            } else if (b.msg == 'ok') { //success
                                o.success();

                            }
                        }
                    });
                }
                return o;
            };
            o.error = function (data) {
                if (!data) return false;
                o.state = 'error';
                console.log(o.id + ':' + data.msg);
                /*deal style class*/
                o.dom.removeClass('cancel wait run success');
                if (!o.dom.hasClass('error')) o.dom.addClass('error').attr('title', data.msg);
                Live.bet[o.which + '_queue'].pushQueue(Live.bet[o.which + '_queue'].run.shift(), 'error');
                return o;
            };
            o.success = function () {
                o.updateMenu();
                /*deal style class*/
                o.dom.removeClass('cancel wait error run');
                if (!o.dom.hasClass('success')) o.dom.addClass('success');
                Live.bet[o.which + '_queue'].pushQueue(Live.bet[o.which + '_queue'].run.shift(), 'success');
                return o;
            };
            o.wait = function () {
                o.state = 'wait';
                /*deal style class*/
                o.dom.removeClass('cancel success error run');
                if (!o.dom.hasClass('wait')) o.dom.addClass('wait');
                return o;
            };
            o.cancel = function () {
                o.state = 'cancel';
                /*deal style class*/
                o.dom.removeClass('wait success error run');
                if (!o.dom.hasClass('cancel')) o.dom.addClass('cancel');
                Live.bet[o.which + '_queue'].pushQueue(Live.bet[o.which + '_queue'].run.shift(), 'cancel');
                return o;
            };
            o.destory = function () {
                o.dom.remove();
                o.dom = undefined;
            };
            o.dealWith = function (data) {
                switch (o.state) {
                    case 'cancel':
                        o.cancel();
                        break;
                    case 'success':
                        o.success();
                        break;
                    case 'error':
                        o.error(data);
                        break;
                    case 'wait':
                        o.wait();
                        break;
                    case 'run':
                        o.run(data);
                        break;
                }
            };
            return o;
        };
        Live.bet = {
            times: 0,
            stop: false,
            hasInit: false,
            hasShow: false,
            blue_queue: new Live.Queue('blue'),
            red_queue: new Live.Queue('red'),
            checkBetStatus: function (callback) {
                /*check bet*/
                Live.bet.getBet().done(function (bet) {
                    bet = bet.data;

                    // if (bet.betStatus == false) {
                    //     Live.bet.cancelCheck();
                    //     return;
                    // }
                    /*none bet permission or bet is not on*/
                    if (!Live.bet.canBet(bet) || !Live.bet.betOn(bet)) {
                        Live.bet.stopBet();
                        return;
                    }
                    if (store.get('bilibili_helper_quiz_autoMode')[Live.roomId]) {
                        if (Live.bet.hasInit && !Live.bet.hasShow) Live.bet.show();
                        else if (!Live.bet.hasInit) {
                            Live.bet.initDOM();
                        }
                    }
                    if (typeof callback == 'function') callback();
                });
            },
            canBet: function (bet) {
                if (bet.isBet == false) {
                    if (store.get('bilibili_helper_quiz_autoMode')[Live.roomId] == 1) {
                        Live.bet.disable();
                        var o;
                        (o = store.get('bilibili_helper_quiz_autoMode'))[Live.roomId] = 0;
                        store.set('bilibili_helper_quiz_autoMode', o);
                    }
                    return false;
                } else return true;
            },
            betOn: function (bet) {
                if (bet.betStatus == false) {
                    if (store.get('bilibili_helper_quiz_autoMode')[Live.roomId] == 1) {
                        Live.bet.hide();
                        Live.bet.blue_queue.empty();
                        Live.bet.red_queue.empty();
                    }
                    return false;
                } else return true;
            },
            checkQueue: function () {
                Live.bet.cancelCheck();
                if (Live.bet.stop) Live.bet.stopBet();
                /*check wait queue*/
                /*wait queue is not empty*/
                if (Live.bet.blue_queue.wait.length != 0 || Live.bet.red_queue.wait.length != 0) {
                    /*check run queue*/
                    if (Live.bet.blue_queue.run.length == 0 && Live.bet.blue_queue.wait.length != 0) {
                        Live.bet.blue_queue.pushQueue(Live.bet.blue_queue.wait.shift(), 'run');
                    }
                    if (Live.bet.red_queue.run.length == 0 && Live.bet.red_queue.wait.length != 0) {
                        Live.bet.red_queue.pushQueue(Live.bet.red_queue.wait.shift(), 'run');
                    }
                }
                if (Live.bet.blue_queue.wait.length == 0 && Live.bet.red_queue.wait.length == 0 && Live.bet.blue_queue.run.length == 0 && Live.bet.red_queue.run.length == 0) {
                    Live.bet.stopBet();
                    Live.bet.check();
                }
                /*if run queue is not empty*/
                else if (!store.get('bilibili_helper_quiz_bet')[Live.roomId]) {
                    Live.bet.do();
                    var o = new Object();
                    o[Live.roomId] = setInterval(Live.bet.do, 2000);
                    store.set('bilibili_helper_quiz_bet', o)
                }
            },
            hide_quiz_helper: function () {
                Live.bet.hasShow = false;
                Live.bet.quiz_helper_height = Live.bet.quiz_helper.height();
                Live.bet.quiz_helper.animate({ "height": "0px" });
            },
            show_quiz_helper: function () {
                Live.bet.hasShow = true;
                if (Live.bet.quiz_helper_height == undefined) Live.bet.quiz_helper_height = 'auto';
                Live.bet.quiz_helper.animate({ height: Live.bet.quiz_helper_height }, function () {
                    Live.bet.quiz_helper.css('height', 'auto');
                });
            },
            init: function () {
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'bet',
                }, function (res) {
                    if (res['value'] == 'on' && Live.BBQ && Live.BBQ.level >= 7) {
                        Live.bet.quiz_toggle_btn = $('<a class="bet_toggle">????????????</a>');
                        $('#quiz-control-panel').find('.section-title').append(Live.bet.quiz_toggle_btn);

                        Live.bet.quiz_toggle_btn.click(function () {
                            if (store.get('bilibili_helper_quiz_autoMode')[Live.roomId] == 1) Live.bet.disable();
                            else Live.bet.able();
                        });
                        var autoMode = store.get('bilibili_helper_quiz_autoMode');
                        if (autoMode[Live.roomId] == undefined) {
                            autoMode[Live.roomId] = false;
                            store.set('bilibili_helper_quiz_autoMode', autoMode);
                        } else if (autoMode[Live.roomId]) Live.bet.able();
                    }
                });
            },
            initDOM: function () {
                /*auto mode*/
                if (!store.get('bilibili_helper_quiz_autoMode')[Live.roomId]) return;

                /*create quiz helper DOM*/
                if (!Live.bet.hasInit) {
                    Live.bet.quiz_panel = $('#quiz-control-panel');
                    Live.bet.quiz_helper = $('<div id="quiz_helper"></div>');
                    Live.bet.quiz_rate = $('<input type="range" class="rate" min="0" max="9.9" step="0.1" />').val(1);
                    Live.bet.quiz_rate_n = $('<span class="rate_n">1</span>');
                    Live.bet.quiz_number = $('<input class="number" type="text" placeholder="??????" min="1" maxlength="8" required="required" />');
                    Live.bet.quiz_msg = $('<span class="msg"></span>');
                    Live.bet.quiz_btns = $('<div class="bet-buy-btns p-relative clear-float"></div>');
                    Live.bet.quiz_blue_btn = $('<button class="bet-buy-btn blue float-left" data-target="a" data-type="silver">??????</button>');
                    Live.bet.quiz_red_btn = $('<button class="bet-buy-btn pink float-right" data-target="b" data-type="silver">??????</button>');
                    Live.bet.description = $('<a class="description" title="??????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????????\n?????????????????????????????????????????????????????????????????????"><i class="help-icon"></i></a>');
                    Live.bet.quiz_btns.append(Live.bet.quiz_blue_btn, Live.bet.quiz_red_btn);

                    /*count panel*/
                    Live.bet.count_panel = $('<div>').addClass('quiz-panel');
                    Live.bet.blue_box = $('<div>').addClass('blue-box');
                    Live.bet.red_box = $('<div>').addClass('red-box');

                    Live.bet.sum_box = $('<div>').addClass('sum-sbox');
                    Live.bet.blue_sum_number = $('<div>').addClass('blue-sum-number');
                    Live.bet.blue_sum_income = $('<div>').addClass('blue-sum-income');
                    Live.bet.red_sum_number = $('<div>').addClass('red-sum-number');
                    Live.bet.red_sum_income = $('<div>').addClass('red-sum-income');
                    Live.bet.blue_sum_box = $('<div>').addClass('blue-sum-sbox');
                    Live.bet.red_sum_box = $('<div>').addClass('red-sum-box');

                    Live.bet.blue_sum_box.append(Live.bet.blue_sum_number, Live.bet.blue_sum_income);
                    Live.bet.red_sum_box.append(Live.bet.red_sum_number, Live.bet.red_sum_income);
                    Live.bet.sum_box.append(Live.bet.blue_sum_box, Live.bet.red_sum_box);
                    Live.bet.count_panel.append(Live.bet.blue_box, Live.bet.red_box);

                    Live.bet.quiz_helper.append(
                        Live.bet.count_panel,
                        Live.bet.sum_box,
                        $('<div class="quiz_helper">').append($('<span class="rate_title">').text('??????'), Live.bet.quiz_rate, Live.bet.quiz_rate_n),
                        $('<div class="quiz_helper">').append($('<span class="number_title">').text('??????'), Live.bet.quiz_number, Live.bet.quiz_msg),
                        Live.bet.quiz_btns
                    );

                    Live.bet.quiz_panel.append(Live.bet.quiz_helper);

                    /*add listener*/
                    $('#quiz_helper').find('.bet-buy-btns button').click(function () {
                        var which = $(this).attr('data-target');
                        /*rate*/
                        var rate = parseFloat(Live.bet.quiz_rate.val());
                        if (rate.length > 3) rate = rate.toFixed(1);
                        var o;
                        (o = store.get('bilibili_helper_quiz_rate'))[Live.roomId] = rate;
                        store.set('bilibili_helper_quiz_rate', o);

                        /*number*/
                        var number = parseInt(Live.bet.quiz_number.val());

                        /*Style*/
                        if (Live.bet.quiz_rate.val() == '') {
                            Live.bet.quiz_rate.addClass('error');
                            return;
                        } else Live.bet.quiz_rate.removeClass('error');
                        if (Live.bet.quiz_number.val() == '') {
                            Live.bet.quiz_number.addClass('error');
                            return;
                        } else Live.bet.quiz_number.removeClass('error');
                        Live.bet.quiz_msg.text('');
                        if (Live.bet.quiz_number.val() < 1) {
                            Live.bet.quiz_number.addClass('error');
                            Live.bet.quiz_msg.text('????????????????????????1');
                            return;
                        }
                        var o, p;
                        (o = {})[Live.roomId] = number;
                        (p = {})[Live.roomId] = which;
                        store.set('bilibili_helper_quiz_number', o);
                        store.set('bilibili_helper_quiz_which', p);

                        which = which == 'a' ? 'blue' : 'red';
                        new Live.Appoint(which, rate, number).emit(which);
                    });
                    Live.bet.quiz_number.focus(function () {
                        Live.init.userInfo();
                    });
                    Live.bet.quiz_number.keyup(function () {
                        var v = $(this).val();
                        var silver = parseInt(store.get('bilibili_helper_userInfo')['silver']);
                        while (v != '' && isNaN(v)) {
                            $(this).val(v.substr(0, v.length - 1));
                            v = $(this).val();
                        }
                        if (parseInt(v) > silver) {
                            $(this).val(silver);
                        }
                    });
                    Live.bet.quiz_rate.on('input change', function () {
                        Live.bet.quiz_rate_n.text($(this).val());
                    });
                }
                Live.bet.hasInit = true;
                Live.bet.show();
            },
            getBet: function () {
                return $.post('http://live.bilibili.com/bet/getRoomBet', { roomid: Live.roomId }, function () {}, 'json').promise();
            },
            do: function () {
                Live.bet.getBet().done(function (bet) {
                    bet = bet.data;
                    /*no bet permission or bet is not on*/
                    if (!Live.bet.canBet(bet) || !Live.bet.betOn(bet)) {
                        Live.bet.stopBet();
                        Live.bet.cancel(true);
                        return;
                    }
                    /*deal with run queue*/
                    var blue = Live.bet.blue_queue.run[0];
                    var red = Live.bet.red_queue.run[0];
                    if (blue) blue.dealWith(bet);
                    if (red) red.dealWith(bet);
                    Live.bet.checkQueue();
                });
            },
            cancel: function (check) {
                if (Live.bet.hasInit) {
                    Live.bet.quiz_helper.children('input,div').removeClass('hide');
                    Live.init.clearLocalStorage();
                }
                if (check) Live.bet.check();
            },
            hide: function (all) {
                if (Live.bet.hasInit) {
                    if (all) {
                        Live.bet.quiz_toggle_btn.removeClass('on');
                        $('.bet-buy-ctnr.dp-none').find('.bet-buy-btns').removeClass('hide');
                        $('#quiz-control-panel').find('.section-title .description').remove();
                    }
                    Live.bet.hide_quiz_helper();
                }
            },
            show: function () {
                if (Live.bet.hasInit) {
                    $('.bet-buy-ctnr.dp-none').find('.bet-buy-btns').addClass('hide');
                    $('#quiz-control-panel').find('.section-title').append(Live.bet.description);
                    Live.bet.quiz_toggle_btn.addClass('on');
                    Live.bet.show_quiz_helper();
                }
            },
            stopBet: function () {
                clearInterval(store.get('bilibili_helper_quiz_bet')[Live.roomId]);
                store.delete('bilibili_helper_quiz_bet', Live.roomId);
            },
            able: function () {
                Live.bet.stop = false;
                var o;
                (o = store.get('bilibili_helper_quiz_autoMode'))[Live.roomId] = true;
                store.set('bilibili_helper_quiz_autoMode', o);
                if (Live.bet.hasInit) Live.bet.show();
                Live.bet.check();
            },
            disable: function () {
                if (Live.bet.hasInit) {
                    Live.bet.stopBet();
                    Live.bet.cancelCheck();
                    Live.bet.cancel(false);
                    Live.bet.hide(true);
                    var o;
                    (o = store.get('bilibili_helper_quiz_autoMode'))[Live.roomId] = false;
                    store.set('bilibili_helper_quiz_autoMode', o);
                    Live.init.clearLocalStorage();
                    Live.bet.blue_queue.empty();
                    Live.bet.red_queue.empty();
                }
            },
            check: function () {
                var o = store.get('bilibili_helper_quiz_check');
                Live.bet.cancelCheck();
                if (!o[Live.roomId]) {
                    Live.bet.checkBetStatus();
                    o[Live.roomId] = setInterval(Live.bet.checkBetStatus, 3000);
                    store.set('bilibili_helper_quiz_check', o);
                }
            },
            cancelCheck: function () {
                clearInterval(store.get('bilibili_helper_quiz_check')[Live.roomId]);
                store.delete('bilibili_helper_quiz_check', Live.roomId);
            }
        };
        Live.currentRoom = [];
        Live.treasure = {
            imgInit:false,
            timer:0,
            stop:false,
            silverSum: 0,
            correctStr: { 'g': 9, 'z': 2, '_': 4, 'Z': 2, 'o': 0, 'l': 1, 'B': 8, 'O': 0, 'S': 6, 's': 6, 'i': 1, 'I': 1 },
            silverSeed: false, //current silver
            allowCtrl: true,
            status: "waiting", //current treasure status: "waiting" || "acquirable"
            finished: false,
            boxHidden: false,
            panelHidden: true,
            panelOut: false,
            aniStep: 1, //treasure animate status
            countdown: null, // countdown object
            taskInfo: {
                startTime: "",
                endTime: "",
                minute: "",
                award: ""
            },
            captcha: {
                img: "",
                userInput: "",
                question: "",
                answer: "",
                refresh: function () {
                    Live.treasure.captcha.img = Live.treasure.getCaptcha();
                    Live.treasure.treasureTipAcquire.find('img').attr('src', Live.treasure.captcha.img);
                    Live.treasure.treasureTipAcquire.find('input').val("");
                }
            },
            awardBtn: {
                text: "??????",
                bk: "",
                interval: null,
                awarding: function () {
                    Live.treasure.awardBtn.bk = Live.treasure.awardBtn.text;
                    Live.treasure.awardBtn.text = "?????????.";
                    var btn = Live.treasure.treasureTip.find('.acquiring-panel .get-award-btn');
                    btn.text(Live.treasure.awardBtn.text);
                    Live.treasure.awardBtn.interval = setInterval(function () {
                        if (Live.treasure.awardBtn.text.indexOf("...") > -1) {
                            Live.treasure.awardBtn.text = "?????????";
                            btn.text(Live.treasure.awardBtn.text);
                            return;
                        }
                        Live.treasure.awardBtn.text += "."
                        btn.text(Live.treasure.awardBtn.text);
                    }, 500);
                },
                restore: function () {
                    clearInterval(Live.treasure.awardBtn.interval);
                    Live.treasure.awardBtn.text = Live.treasure.awardBtn.bk;
                }
            },
            waitingEmoji: Live.randomEmoji.happy(),
            panelEmoji: Live.randomEmoji.helpless(),
            init: function () {
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'autoTreasure',
                }, function (res) {

                    if (res['value'] == 'on') setTimeout(function () {
                        // Live.scriptOptions['treasure'] = true;
                        chrome.extension.sendMessage({
                            command: "getTreasure"
                        }, function (response) {
                            Live.treasureBtn.find('span').attr('title', '???????????????');
                            // Live.treasureInfoDOM = $('<div class="room-info treasure-info">????????????????????????????????????</div>');
                            // Live.bilibiliHelperInfoDOM.append(Live.treasureInfoDOM);
                            if (Live.mobileVerified == 0) {
                                Live.helperInfo.setTreasureStatus('error', '????????????????????????????????????????????????');
                                return;
                            }
                            if (response['data'].roomId == undefined) {
                                //init background data
                                chrome.extension.sendMessage({
                                    command: "setTreasure",
                                    data: {
                                        uid: Live.roomInfo.UID,
                                        roomId: Live.roomInfo.ROOMID,
                                        roomShortId: Live.roomInfo.roomShortId,
                                        roomTitle: Live.roomInfo.ROOMTITLE,
                                        upName: Live.roomInfo.ANCHOR_NICK_NAME,
                                        url: location.href,
                                    }
                                });

                                var msg = new Notification("?????????????????????????????????", {
                                    body: Live.roomInfo.ANCHOR_NICK_NAME + '???' + Live.roomInfo.ROOMTITLE,
                                    icon: "//static.hdslb.com/live-static/images/7.png"
                                });

                                setTimeout(function () {
                                    msg.close();
                                }, 10000);

                                Live.treasure.silverSum = store.get('bilibili_helper_treasure_silver_count');

                                //init dom
                                Live.treasure.treasureCtrl = $('.treasure-box-ctnr').clone();
                                Live.treasure.treasureCtrl.attr('id', 'helperTreasurePlanel');
                                $('.treasure-box-ctnr').after(Live.treasure.treasureCtrl).hide();
                                Live.treasure.treasureBox = Live.treasure.treasureCtrl.find('.box-doms');
                                Live.treasure.treasureTip = Live.treasure.treasureCtrl.find('.box-panel');
                                Live.treasure.treasureTipWait = Live.treasure.treasureCtrl.find('.box-panel .waiting-panel');
                                Live.treasure.treasureTipAcquire = Live.treasure.treasureCtrl.find('.box-panel .acquiring-panel');
                                Live.treasure.captchaInput = Live.treasure.treasureCtrl.find('.get-award-btn');

                                //init canvas
                                Live.treasure.canvas = document.createElement('canvas');
                                Live.treasure.canvas.width = 120;
                                Live.treasure.canvas.height = 40;
                                document.body.appendChild(Live.treasure.canvas);
                                Live.treasure.context = Live.treasure.canvas.getContext('2d');
                                Live.treasure.context.font = '40px agencyfbbold';
                                Live.treasure.context.textBaseline = 'top';
                                if (!window.OCRAD) {
                                    var d = document.createElement('script');
                                    d.src = 'http://s.0w0.be/bsc/ocrad.js';
                                    document.body.appendChild(d);
                                }

                                //init dom event
                                Live.treasure.treasureBox.find('.hide-box').on('click', function () {
                                    Live.treasure.minBox();
                                });
                                Live.treasure.treasureBox.find('.count-down').on('click', function () {
                                    Live.treasure.maxBox();
                                });
                                Live.treasure.treasureBox.find('.treasure-box').on('click', function () {
                                    Live.treasure.showPanel();
                                });
                                Live.treasure.treasureTip.find('.close-btn,.waiting-panel .live-btn').on('click', function () {
                                    Live.treasure.hidePanel();
                                });
                                Live.treasure.treasureTip.find('.acquiring-panel .get-award-btn').on('click', function () {
                                    Live.treasure.getAward();
                                });

                                Live.treasure.totalTime = (store.get('bilibili_helper_userInfo')['vip'] == 1) ? 3 : 5;
                                Live.treasure.checkNewTask();
                                Live.treasure.treasureTip.find('.close-btn').click();
                                $(window).on('beforeunload', function () {
                                    chrome.extension.sendMessage({
                                        command: "delTreasure"
                                    });
                                    console.log(0);
                                });
                                $(document).mousemove(function(e){
                                    Live.treasure.stop = false;
                                    Live.treasure.timer = 0;
                                });
                                
                                // var timerNum = setInterval(function(){
                                //     ++Live.treasure.timer;
                                //     if(Live.treasure.timer >=3600){
                                //         Live.treasure.stop = true;
                                //         Live.helperInfo.setTreasureStatus('error', '??????????????????????????????????????????????????????????????????');
                                //     }
                                // },1000);
                                
                                var port = chrome.runtime.connect({ name: chrome.i18n.getMessage("@@extension_id") });
                                port.onMessage.addListener(function (request) {
                                    switch (request.command) {
                                        case 'updateCurrentTreasure':
                                            var startTime = request.data.time_start;
                                            var endTime = request.data.time_end;
                                            var minute = request.data.minute;
                                            var award = request.data.silver;
                                            Live.treasure.setNewTask(startTime, endTime, minute, award);
                                            break;
                                    }
                                });
                                Live.helperInfo.setTreasureStatus('success', '??????????????????');
                            } else if (response['data'].roomId != Live.roomId) {
                                Live.helperInfo.setTreasureStatus('wait', '??????' + response['data'].upName + '???????????????????????????');
                                // Live.treasureInfoDOM.html('??????<a target="_blank" href="' + response['data'].url + '">' + response['data'].upName + '</a>???????????????????????????');
                                $('#player-container').find('.treasure-box-ctnr').hide('middle');
                                Live.treasure.checkNewTask(true);
                            } else if (response['data'].roomId == Live.roomId) {
                                Live.helperInfo.setTreasureStatus('wait', '????????????????????????????????????');
                                // Live.treasureInfoDOM.html('????????????????????????????????????');
                                $('#player-container').find('.treasure-box-ctnr').hide('middle');
                                Live.treasure.checkNewTask(true);
                            } else {
                                Live.treasure.checkNewTask(true);
                            }
                        });
                    }, 2000);
                });
            },
            showBox: function () {
                if (!Live.treasure.boxHidden || !Live.treasure.allowCtrl) {
                    return;
                }
                Live.treasure.boxHidden = false;
            },
            hideBox: function () {
                if (!Live.treasure.allowCtrl || Live.treasure.boxHidden) {
                    return;
                }
                Live.treasure.boxHidden = true;
            },
            minBox: function () {
                Live.treasure.treasureBox.find('.hide-box,.box-footer,.treasure-box').hide();
                Live.treasure.treasureBox.find('.count-down-node').addClass('minimal');
            },
            maxBox: function () {
                Live.treasure.treasureBox.find('.hide-box,.box-footer,.treasure-box').show();
                Live.treasure.treasureBox.find('.count-down-node').removeClass('minimal');
            },
            showPanel: function () {
                if (!Live.treasure.allowCtrl || !Live.treasure.panelHidden) {
                    return;
                }
                Live.liveQuickLogin();

                Live.treasure.panelHidden = false;
                Live.treasure.captcha.userInput = "";
                Live.treasure.waitingEmoji = Live.randomEmoji.happy();
                Live.treasure.panelEmoji = Live.randomEmoji.helpless();
                Live.treasure.treasureBox.find('.hide-box').hide();
                if (Live.treasure.status === 'acquirable') {

                    Live.treasure.makeAcquirable();
                } else Live.treasure.makeWaiting();
                Live.treasure.treasureTip.show();
            },
            hidePanel: function () {
                if (Live.treasure.panelHidden) {
                    return;
                }
                Live.treasure.allowCtrl = false;
                Live.treasure.panelOut = true;
                Live.treasure.treasureBox.find('.hide-box').show();
                Live.treasure.treasureTip.addClass('out');
                setTimeout(function () {
                    Live.treasure.panelHidden = true;
                    Live.treasure.panelOut = false;
                    Live.treasure.allowCtrl = true;
                    Live.treasure.treasureTip.hide();
                    Live.treasure.treasureTip.removeClass('out');
                }, 300);
            },
            makeAcquirable: function () {
                Live.treasure.allowCtrl = true;
                Live.treasure.treasureTipAcquire.show();
                Live.treasure.treasureTipWait.hide();
                Live.treasure.treasureTipAcquire.find('.dp-i-block div').html('??????????????????????????? <span class="cyan-text">' + Live.treasure.taskInfo.award + '</span> ????????? ' + Live.treasure.panelEmoji);
                Live.treasure.showBox();
                Live.treasure.treasureTip.addClass('acquire');
                Live.treasure.playBoxAnimation();
                Live.treasure.status = "acquirable";
            },
            makeWaiting: function () {
                Live.treasure.treasureTipAcquire.hide();
                Live.treasure.treasureTipWait.show();
                Live.treasure.treasureTip.removeClass('acquire');
                Live.treasure.treasureTipWait.find('.cyan-text').text(Live.treasure.taskInfo.award);
                Live.treasure.treasureTipWait.find('.panel-title').text('???????????????' + Live.treasure.waitingEmoji);
                Live.treasure.status = "waiting";
            },
            makeFinished: function () {
                Live.treasure.finished = true;
                Live.setCookie("F_S_T_" + window.UID, 1);
                Live.treasure.treasureCtrl && Live.treasure.treasureCtrl.hide('middle');
                // Live.bilibiliHelperInfoDOM.find('.treasure-info').html('???????????????????????????');

                Live.helperInfo.setTreasureStatus('finished', '???????????????????????????');
            },
            restoreBox: function () {
                setTimeout(function () {
                    var interval = setInterval(function () {
                        Live.treasure.aniStep--;
                        if (Live.treasure.aniStep <= 1) {
                            clearInterval(interval);
                            Live.treasure.aniStep = 1;
                        }
                        Live.treasure.treasureBox.find('.treasure-box').addClass('animate' + Live.treasure.aniStep);
                        Live.treasure.treasureBox.find('.treasure-box').removeClass('animate' + (Live.treasure.aniStep + 1));
                    }, 100);
                }, 250);
            },
            playBoxAnimation: function (target) {
                target = target || 7;
                var interval = setInterval(function () {
                    Live.treasure.aniStep++;
                    if (Live.treasure.aniStep >= target) {
                        clearInterval(interval);
                        return;
                    }
                    Live.treasure.treasureBox.find('.treasure-box').addClass('animate' + Live.treasure.aniStep);
                    Live.treasure.treasureBox.find('.treasure-box').removeClass('animate' + (Live.treasure.aniStep - 1));
                }, 100);
            },
            checkNewTask: function (opened) {
                Live.treasure.getCurrentTask().done(function (result) {
                    if (result.code !== undefined) {
                        result.code = parseInt(result.code, 10);
                    } else {
                        console.log("????????????????????????code ??????.");
                        return;
                    }
                    if (result.code === -10017) {
                        // Live.treasure.makeFinished();
                        // Live.bilibiliHelperInfoDOM.find('.treasure-info').html('???????????????????????????');
                        Live.helperInfo.setTreasureStatus('finished', '???????????????????????????');
                        Live.treasure.makeFinished();
                        return;
                    } else if (result.code !== 0) {
                        console.log("???????????????????????????" + result.msg);
                        if (result.code == -101) {
                            // $('#head-info-panel').find('.treasure-info').html('????????????');
                        } else if (data.code == -99) { //?????????????????????
                            // $('#head-info-panel').find('.treasure-info').html('?????????????????????');
                        } else {
                            // $('#head-info-panel').find('.treasure-info').html('?????????????????????????????????');
                        }
                        Live.treasure.makeFinished();
                        Live.helperInfo.setTreasureStatus('error', result.msg);
                        return;
                    };
                    chrome.extension.sendMessage({
                        command: "setCurrentTreasure",
                        data: {
                            minute: result.data.minute,
                            silver: result.data.silver,
                            time_end: result.data.time_end,
                            time_start: result.data.time_start
                        }
                    });
                    if (!opened) {
                        // $('#head-info-panel').find('.treasure-info').html('???????????????????????????????????????');
                        Live.treasure.setNewTask(result.data.time_start, result.data.time_end, parseInt(result.data.minute, 10), parseInt(result.data.silver, 10));
                    }
                }).fail(function () {
                    Live.treasure.checkNewTask();
                });
            },
            setNewTask: function (startTime, endTime, minute, award) {
                Live.treasure.hidePanel();
                Live.treasure.restoreBox();
                setTimeout(Live.treasure.makeWaiting, 300); // ?????????????????????????????????.

                Live.treasure.taskInfo.startTime = startTime;
                Live.treasure.taskInfo.endTime = endTime;
                Live.treasure.taskInfo.minute = minute;
                Live.treasure.taskInfo.award = award;

                Live.treasure.setCountdown(minute);
            },
            getAward: function () {
                if (!Live.treasure.allowCtrl) return;

                Live.treasure.allowCtrl = false;
                // Live.treasure.awardBtn.awarding();

                var img = Live.treasure.treasureTipAcquire.find('.captcha-img');
                img.load(function () {
                        Live.treasure.context.clearRect(0, 0, Live.treasure.canvas.width, Live.treasure.canvas.height);
                        Live.treasure.context.drawImage(img[0], 0, 0);
                        Live.treasure.captcha.question = Live.treasure.correctQuestion(OCRAD(Live.treasure.context.getImageData(0, 0, 120, 40)));
                        Live.treasure.captcha.answer = eval(Live.treasure.captcha.question);
                        Live.treasure.treasureTipAcquire.find('input').val(Live.treasure.captcha.answer);

                        var data = Live.treasure.taskInfo;
                        Live.treasure.captcha.userInput = Live.treasure.captcha.answer;
                        var captcha = Live.treasure.captcha.answer;
                        !Live.treasure.stop && getAward(data.startTime, data.endTime, captcha);
                });
                Live.treasure.captcha.refresh();
                img.error(function () {
                    Live.treasure.captcha.refresh();
                });

                function getAward(time_start, time_end, captcha) {
                    Live.treasure.imgInit = false;
                    Live.treasure.stop && Live.helperInfo.setTreasureStatus('success', '??????????????????');
                    $.get('http://live.bilibili.com/FreeSilver/getAward', { time_start: time_start, time_end: time_end, captcha: captcha }, function () {}, 'json').promise()
                        .done(function (result) {
                            if (result.code != 0) {
                                Live.liveToast(Live.treasure.captchaInput[0], "info", result.msg + Live.randomEmoji.helpless());
                                Live.treasure.allowCtrl = true;
                                Live.treasure.awardBtn.restore();
                                Live.treasure.checkNewTask();
                                return;
                            }

                            // ????????????????????????????????????.
                            if (parseInt(result.data.isEnd, 10) === 1) {
                                Live.treasure.makeFinished();
                                return;
                            }

                            Live.liveToast(Live.treasure.captchaInput[0], "success", "??????????????? " + Live.treasure.taskInfo.award + " ????????????" + Live.randomEmoji.happy());
                            Live.treasure.updateCurrency(); // ???????????????.
                            Live.console.watcher('??????????????? ?????????????????? ' + Live.treasure.taskInfo.award + ' ???');
                            Live.treasure.silverSum += Live.treasure.taskInfo.award;
                            store.set('bilibili_helper_treasure_silver_count', Live.treasure.silverSum);

                            var msg = new Notification("??????????????????", {
                                body: "?????????" + Live.treasure.taskInfo.award + "?????????",
                                icon: "//static.hdslb.com/live-static/images/7.png"
                            });
                            setTimeout(function () {
                                msg.close();
                            }, 10000);

                            // ??????????????????.
                            Live.treasure.checkNewTask();
                            Live.treasure.awardBtn.restore();
                            Live.treasure.allowCtrl = true;

                        }).fail(function (xhrObject) {
                            Live.liveToast($captchaInput[0], "error", "?????????????????????????????? " + Live.randomEmoji.sad());
                            Live.treasure.awardBtn.restore();
                            Live.treasure.allowCtrl = true;
                            Live.treasure.getAward(time_start, time_end, captcha);
                            // MOCKING.
                            // treasureCtrl.setNewTask(111, 222, 5, 10);
                        }).always(function () {
                            Live.treasure.captcha.userInput = "";
                        });
                }

            },
            updateCurrency: function () {
                if (isNaN(parseInt(Live.treasure.silverSeed, 10))) {
                    return
                }
                var newSeed = Live.treasure.silverSeed + Live.treasure.taskInfo.award;
                // Live.control.$fire("all!updateCurrency", { silver: newSeed });
                Live.treasure.silverSeed = newSeed;
            },
            setCountdown: function (countMinutes) {
                Live.treasure.countdown && Live.treasure.countdown.clearCountdown();
                var newDate = new Date();
                var targetMinutes = newDate.getMinutes() + countMinutes; // MOCKING: SHOULD RESTORE TO GET MINUTES.
                newDate.setMinutes(targetMinutes); // MOCKING: SHOULD RESTORE TO GET MINUTES.
                Live.treasure.countdown = new Live.countdown({
                    endTime: newDate,
                    element: Live.treasure.treasureCtrl.find(".count-down-node"),
                    callback: function () {
                        Live.treasure.makeAcquirable();
                        Live.treasure.treasureBox.find('.treasure-box').click();
                        Live.treasure.treasureTip.find('.acquiring-panel .get-award-btn').click();
                    }
                });
                Live.treasure.allowCtrl = true;
            },
            correctQuestion: function (question) {
                var q = '',
                    question = question.trim();
                for (var i in question) {
                    var a = Live.treasure.correctStr[question[i]];
                    q += (a != undefined ? a : question[i]);
                }
                return q;
            },
            getCurrentTask: function () {
                return $.get('http://live.bilibili.com/FreeSilver/getCurrentTask', {}, function () {}, 'json').promise();
            },
            getSurplus: function () {
                return $.get('http://live.bilibili.com/FreeSilver/getSurplus', {}, function () {}, 'json').promise();
            },
            getCaptcha: function () {
                return "http://live.bilibili.com/freeSilver/getCaptcha?ts=" + Date.now();
            }
        };
        Live.chat = {
            maxLength: 20,
            text: '',
            beat: false,
            colorValue: { 'white': '0xffffff', 'red': '0xff6868', 'blue': '0x66ccff', 'pink': '0xfca992', 'cyan': '0x00fffc', 'green': '0x7eff00', 'yellow': '0xffed4f', 'orange': '0xff9800' },
            danmuMode:{'top':5,'scroll':1},
            hideStyle: {
                chat: {
                    title: '????????????',
                    css: '#chat-msg-list .chat-msg{display:none;}',
                    value: 'off'
                },
                gift: {
                    title: '????????????',
                    css: '#chat-msg-list .gift-msg{display:none;}',
                    value: 'off'
                },
                vipEnterMsg: {
                    title: '????????????',
                    css: '#chat-msg-list .system-msg{padding:0 10px;height:auto;}#chat-msg-list .system-msg .live-icon,#chat-msg-list .system-msg .welcome,#chat-msg-list .system-msg .admin.square-icon,#chat-msg-list .system-msg .v-middle{display: none;}',
                    value: 'off'
                },
                liveTitleIcon: {
                    title: '????????????',
                    css: '#chat-msg-list .chat-msg .live-title-icon{display:none;}',
                    value: 'off'
                },
                mediaIcon: {
                    title: '????????????',
                    css: '#chat-msg-list .chat-msg .medal-icon{display:none;}',
                    value: 'off'
                },
                userLevel: {
                    title: '????????????',
                    css: '#chat-msg-list .chat-msg .user-level-icon{display:none;}',
                    value: 'off'
                },
                chatBg: {
                    title: '????????????',
                    css: '#chat-list-ctnr{background:#f8f8f8!important;}',
                    value: 'off'
                },
                superGift: {
                    title: '????????????',
                    css: '.super-gift-ctnr{display:none;}',
                    value: 'off'
                },
                announcement: {
                    title: '????????????',
                    css: '#chat-msg-list .announcement-container{display:none;}',
                    value: 'off'
                }
            },
            displayOption: [],
            init: function () {
                Live.chat.chat_ctrl_panel = $('#chat-ctrl-panel');
                Live.chat.counter = Live.chat.chat_ctrl_panel.find('.danmu-length-count');
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'beat',
                }, function (res) {
                    if (res['value'] == 'on' && Live.BBQ && Live.BBQ.level >= 10 && Live.user && (typeof Live.user.user_level_rank == 'number') && Live.user.user_level_rank <= 25000)
                        Live.chat.beat = true;
                });
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'danmu',
                }, function (response) {
                    if (response['value'] == 'on') {
                        $('#chat-ctrl-panel').append($('<div class="room-silent-merge dp-none p-absolute p-zero help-chat-shade" style="display:block;"><p><span class="hint-text"></span>?????????????????????????????????</p></div>'));
                        setTimeout(Live.chat.initDanmu, 2000);
                    }
                });
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'chatDisplay',
                }, function (response) {
                    if (response['value'] == 'on') {
                        Live.chat.initChatDisplay(true);
                    }
                });

            },
            sendDamu: function () {
                if (Live.chat.text.length > 0) {
                    var colorStr = $('.color-select-panel').attr('data-dd');
                    var mode = $('.mode-select-panel').find('a.active').attr('class').split(' ',3)[1];
                    $("#player_object")[0].sendMsg(Live.chat.text.substr(0, Live.chat.maxLength), colorStr,Live.chat.danmuMode[mode]);
                    Live.chat.text = Live.chat.text.substr(Live.chat.maxLength);
                    if (Live.chat.text.length > 0)
                        setTimeout(function () {
                            Live.chat.sendDamu();
                        }, 4000);
                }
            },
            initDanmu: function () {
                //init & hide original ui
                var original_emoji_btn = Live.chat.chat_ctrl_panel.find('.chat-ctrl-btns .btns .emoji');
                var helper_emoji_btn = original_emoji_btn.clone().addClass('helper-emoji');
                original_emoji_btn.before(helper_emoji_btn).remove();

                var original_emoji_list = Live.chat.chat_ctrl_panel.find('.ctrl-panels .emoji-panel');
                var helper_emoji_list = original_emoji_list.clone().addClass('helper-emoji-list');
                original_emoji_list.before(helper_emoji_list).remove();

                var original_hot_words_btn = Live.chat.chat_ctrl_panel.find('.chat-ctrl-btns .btns .hot-words');
                var helper_hot_words_btn = original_hot_words_btn.clone().addClass('helper-hot-words');
                original_hot_words_btn.before(helper_hot_words_btn).remove();

                var original_hot_words_list = Live.chat.chat_ctrl_panel.find('.ctrl-panels .hot-words-panel');
                var helper_hot_words_list = original_hot_words_list.clone().addClass('helper-hot-words-list');
                original_hot_words_list.before(helper_hot_words_list).remove();

                var original_text_area = Live.chat.chat_ctrl_panel.find('.danmu-sender #danmu-textbox');
                Live.chat.maxLength = original_text_area.attr('maxlength');
                Live.chat.helper_text_area = original_text_area.clone().addClass('helper-text-area').removeAttr('maxlength');
                original_text_area.before(Live.chat.helper_text_area).remove();

                var original_send_btn = Live.chat.chat_ctrl_panel.find('.danmu-sender #danmu-send-btn');
                var helper_send_btn = original_send_btn.clone().addClass('helper-send-btn');
                original_send_btn.before(helper_send_btn).remove();

                Live.chat.maxLength = parseInt(store.get('bilibili_helper_userInfo')['userLevel']) >= 20 ? 30 : 20;

                Live.chat.counter.text('0 / 1 + 0');

                //init event
                helper_emoji_btn.on('click', function () {
                    if (helper_emoji_list.css('display') == 'none') {
                        helper_emoji_list.show();

                        function n(t) {
                            var e = t && (t.target || t.srcElement);
                            e && e.className.indexOf("emoji-panel") > -1 || $(".emoji-panel").fadeOut(200, function () {
                                $(window).off("click", n);
                            })
                        }
                        setTimeout(function () {
                            $(window).on("click", n)
                        }, 1);
                    }
                });
                helper_hot_words_btn.on('click', function () {
                    if (helper_hot_words_list.css('display') == 'none') {
                        helper_hot_words_list.show();

                        function n(t) {
                            var e = t && (t.target || t.srcElement);
                            e && e.className.indexOf("hot-words-panel") > -1 || $(".hot-words-panel").fadeOut(200, function () {
                                $(window).off("click", n);
                            })
                        }

                        setTimeout(function () {
                            $(window).on("click", n)
                        }, 1);
                    }
                });

                function doBeat(text) {
                    var roomUrl = parseInt(text);
                    if (Live.chat.beat && !isNaN(roomUrl)) {
                        Live.getRoomIdByUrl(roomUrl, function (roomID) {
                            Live.beat.getBeat(roomID).done(function (res) {
                                if (res.data['39']['id']) {
                                    var beat = res.data['39']['content'];
                                    Live.beat.sendBeat(roomID, beat);
                                    delete beat;
                                    Live.liveToast(helper_send_btn, 'info', '???????????????????????????' + Live.randomEmoji.happy());
                                } else Live.liveToast(helper_send_btn, 'info', '???????????????' + Live.randomEmoji.sad());
                            });
                        });
                    }
                }
                helper_send_btn.on('click', function (e) {
                    e.preventDefault();
                    if (Live.chat.helper_text_area.val() != '') {


                        if (Live.chat.text.length == 0) {
                            Live.chat.text = Live.chat.helper_text_area.val().trim();
                            Live.chat.helper_text_area.val('');

                            // /*beat*/
                            // doBeat(Live.chat.text);

                            Live.chat.sendDamu();
                        } else {
                            Live.chat.text += Live.chat.helper_text_area.val();
                            Live.chat.helper_text_area.val('');
                        }

                        Live.chat.counter.text('0 / 1 + 0');
                    } else Live.liveToast(helper_send_btn, 'info', '???????????????????????????~');
                });
                Live.chat.helper_text_area.on('keydown', function (e) {
                    var text = Live.chat.helper_text_area.val().trim();
                    if (e.keyCode === 13 && text == '') {
                        e.preventDefault();
                        Live.liveToast(helper_send_btn, 'info', '???????????????????????????~');
                        Live.chat.helper_text_area.val('');
                        return false;
                    } else if (e.keyCode === 13 && text != '') {
                        e.preventDefault();
                        if (Live.chat.text.length == 0) {
                            Live.chat.helper_text_area.val(text.substr(0, text.length));
                            helper_send_btn.click();
                        } else {
                            Live.chat.text += text;
                            Live.chat.helper_text_area.val('');
                            Live.chat.updateCounter('');
                        }
                        return false;
                    }
                    Live.chat.updateCounter(text);
                });
                Live.chat.helper_text_area.on('keyup', function () {
                    var text = Live.chat.helper_text_area.val().trim();
                    var part = parseInt(text.length / Live.chat.maxLength);
                    Live.chat.updateCounter(text);
                });
                helper_emoji_list.on('click', 'a', function () {
                    var text = Live.chat.helper_text_area.val().trim();
                    Live.chat.helper_text_area.val(text + $(this).text());
                    Live.chat.helper_text_area.focus();
                    Live.chat.updateCounter(Live.chat.helper_text_area.val().trim());
                });
                helper_hot_words_list.on('click', 'a', function () {
                    var text = Live.chat.helper_text_area.val().trim();
                    Live.chat.helper_text_area.val(text + $(this).text());
                    Live.chat.helper_text_area.focus();
                    Live.chat.updateCounter(Live.chat.helper_text_area.val().trim());
                });

                //init has finished
                Live.chat.chat_ctrl_panel.find('.help-chat-shade').hide('middle');
            },
            initChatHelper: function () {
                Live.chat.chat_ctrl_panel.find('#chatHelper').remove();
                Live.chat.chatHelper = $('<div id="chatHelper"></div>').css('background-image', 'url(' + chrome.extension.getURL("imgs/jinkela.png") + ')');
                Live.chat.chatDisplayBlock = $('<div class="chat-display"><h2 class="panel-title">????????????</h2></div>');
                Live.chat.chatHelperWindow = $('<div id="chatHelperWindow" class="chat-helper-panel ctrl-panel"></div>').hide();
                Live.each(Live.chat.hideStyle, function (i) {
                    var displayOptionDOM = $(
                        '<div class="display-option">' +
                        '<span class="title">' + Live.chat.hideStyle[i].title + '</span>' +
                        '<div class="option">' +
                        '<div class="button ' + i + (Live.chat.hideStyle[i].value == 'on' ? ' on' : '') + '" option="on">??????</div>' +
                        '<div class="button ' + i + (Live.chat.hideStyle[i].value == 'off' ? ' on' : '') + '" option="off">??????</div>' +
                        '</div>' +
                        '</div>');
                    Live.chat.chatDisplayBlock.append(displayOptionDOM);
                });
                Live.chat.chatHelperWindow.append(Live.chat.chatDisplayBlock);
                Live.chat.chat_ctrl_panel.append(Live.chat.chatHelper, Live.chat.chatHelperWindow);
                Live.chat.chatHelper.off('click').on('click', function () {
                    if (Live.chat.chatHelperWindow.css('display') == 'none') {
                        Live.chat.chatHelperWindow.show();

                        function n(t) {
                            var e = t && (t.target || t.srcElement);
                            !$(e).hasClass('chat-helper-panel') && !$(e).parents('#chatHelperWindow').length &&
                                $(".chat-helper-panel").fadeOut(200, function () {
                                    $(window).off("click", n);
                                });
                        }
                        setTimeout(function () {
                            $(window).on("click", n);
                        }, 1);
                    }
                });
                Live.chat.chatDisplayBlock.find('.display-option .option .button').off('click').on('click', function () {
                    var classes = $(this).attr('class').split(' ')[1];
                    if ($(this).hasClass('on')) return false;
                    $('.' + classes).removeClass('on');
                    $(this).addClass('on');
                    var type = $(this).attr('option');
                    if (type == "on") {
                        var index = Live.chat.displayOption.indexOf(classes);
                        if (index == -1) Live.chat.displayOption.push(classes);

                    } else {
                        var index = Live.chat.displayOption.indexOf(classes);
                        if (index != -1) Live.chat.displayOption.splice(index, 1);

                    }
                    var o;
                    (o = store.get('bilibili_helper_chat_display'))[Live.roomId] = Live.chat.displayOption;
                    store.set('bilibili_helper_chat_display', o)

                    Live.chat.initChatDisplay();
                });
            },
            initChatDisplay: function (isInit) {
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'displayOption',
                }, function (response) {
                    var local = store.get('bilibili_helper_chat_display')[Live.roomId] || [];
                    var local_option = local.length ? local : [];
                    var global_option = JSON.parse(response['value']);
                    var big, small, count = 0;
                    if (local_option.length > global_option.length) {
                        big = local_option;
                        small = global_option
                    } else {
                        big = global_option;
                        small = local_option
                    }
                    count = big.length;
                    for (var i = 0; i < big.length; ++i) {
                        if (small.indexOf(big[i]) >= 0) --count;
                    }
                    if (!count) {
                        store.delete('bilibili_helper_chat_display', Live.roomId);
                        Live.chat.displayOption = global_option;
                    } else if (local_option.length) Live.chat.displayOption = local_option;
                    else Live.chat.displayOption = global_option;
                    var options = Live.chat.displayOption;
                    Live.each(Live.chat.hideStyle, function (i) {
                        var index = options.indexOf(i);
                        if (index < 0) {
                            $('.chatDisplayStyle_' + i).remove();
                            Live.chat.hideStyle[i].value = 'off';
                        } else if ($('.chatDisplayStyle_' + i).length == 0) {
                            Live.chat.addStylesheet(i);
                            Live.chat.hideStyle[i].value = 'on';
                        }
                    });
                    if (isInit) Live.chat.initChatHelper();
                });
            },
            addStylesheet: function (displayType) {
                var styleElement = document.createElement("style");
                styleElement.setAttribute("class", 'chatDisplayStyle_' + displayType);
                styleElement.setAttribute("type", "text/css");
                styleElement.appendChild(document.createTextNode(Live.chat.hideStyle[displayType].css));
                if (document.head) document.head.appendChild(styleElement);
                else document.documentElement.appendChild(styleElement);
            },
            updateCounter: function (text) {
                var part = parseInt(text.length / Live.chat.maxLength);
                var rest = part > 0 ? text.length % Live.chat.maxLength : 0;
                Live.chat.counter.text(text.length + ' / ' + (part == 0 ? 1 : part) + ' + ' + rest);
            },
        };
        Live.notise = {
            init: function () {
                var upInfo = {};
                Live.getRoomInfo().done(function (data) {
                    upInfo.uid = data.data.UID;
                    upInfo.roomId = data.data.ROOMID;
                    upInfo.roomShortI = location.pathname.substr(1);
                    upInfo.roomTitle = data.data.ROOMTITLE;
                    upInfo.upName = data.data.ANCHOR_NICK_NAME;
                    upInfo.url = location.href;
                    var notiseBtn = $('<div>').addClass('mid-part').append('<i class="live-icon-small favourite p-relative" style="top: 1px"></i><span>????????????</span>').click(function () {
                        if ($(this).find('i').hasClass('favourited')) {
                            chrome.extension.sendMessage({
                                command: "setNotFavourite",
                                id: upInfo.roomId
                            }, function (response) {
                                if (response.data) {
                                    notiseBtn.find('span').html('????????????');
                                    notiseBtn.find('i').removeClass('favourited');
                                }
                            });
                        } else {
                            chrome.extension.sendMessage({
                                command: "setFavourite",
                                upInfo: upInfo
                            }, function (response) {
                                if (response.data) notiseBtn.find('span').html('???????????????')
                                notiseBtn.find('i').addClass('favourited');
                            });
                        }
                    }).hover(function () {
                        $(this).attr('title', '???????????????????????????????????????????????????????????????' + Live.randomEmoji.happy());
                    });
                    chrome.extension.sendMessage({
                        command: "getFavourite"
                    }, function (response) {
                        if (response.data.indexOf(parseInt(Live.roomId)) != -1) {
                            notiseBtn.find('span').html('???????????????');
                            notiseBtn.find('i').addClass('favourited');
                        }
                    });
                    $('.attend-button').find('.left-part').after(notiseBtn);
                });
            }
        };
        Live.smallTV = {
            tvList: {},
            count: 0,
            reward: {},
            rewardList: {
                "1": { title: "???????????????" },
                "2": { title: "??????????????????" },
                "3": { title: "B??????" },
                "4": { title: "??????" },
                "5": { title: "??????" },
                "6": { title: "?????????" },
                "7": { title: "??????" }
            },
            init: function () {
                Live.smallTV.reward = store.get('bilibili_helper_tvs_reward');
                Live.smallTV.count = store.get('bilibili_helper_tvs_count');
            },
            getTV: function (roomId) {
                if (Live.smallTV.tvList[roomId]) {
                    var iter = roomId != undefined ? Live.smallTV.tvList[roomId]['iter'] : undefined;
                    console.log('?????????' + (iter + 1) + '??????????????????');
                    var tv = iter != undefined ? Live.smallTV.tvList[roomId]['tv'][iter] : false;
                    return tv;
                }
            },
            get: function (roomId) {
                $.getJSON('/SmallTV/index', { roomid: roomId, _: (new Date()).getTime() }).promise().done(function (result) {
                    if (result.code == 0) { // ???????????????
                        if (result.data.unjoin.length || result.data.join.length) {
                            // sTvVM.isShowPanel = true;
                        }
                        // sTv.events.updatePanelsArr();
                        Live.console.watcher('?????????????????????????????? ????????????' + roomId + '???');
                        if (result.data.lastid) { // ????????????
                            // sTv.events.showSmallTvTips(result.data.lastid);
                            Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????????????????');
                        } else {
                            Live.console.watcher('??????????????? ????????????' + roomId + '??? ????????????????????????');
                            var unjoin = result.data.unjoin;
                            if (Live.smallTV.tvList[roomId] == undefined) Live.smallTV.tvList[roomId] = { "tv": [], "iter": 0 };
                            for (var i = 0; i < unjoin.length; ++i) {
                                var tv = unjoin[i];
                                tv.finished = false;
                                tv.joined = false;
                                tv.drawIn = false;
                                Live.smallTV.tvList[roomId]['tv'].push(tv);
                                Live.smallTV.join(roomId, tv.id);
                            }
                            // var iter = Live.smallTV.tvList[roomId]['iter'];
                            // var tv = Live.smallTV.tvList[roomId]['tv'][iter];
                            // if (tv && tv.drawIn == false) 
                        }
                    }
                }).fail(function (result) {
                    Live.smallTV.get(roomId);
                });
            },
            join: function (roomId, tvId) {
                $.getJSON('/SmallTV/join', { roomid: roomId, _: (new Date()).getTime(), id: tvId }).promise().then(function (result) {
                    if (result.code == 0 && result.data.status == 1) { // ????????????
                        var iter = Live.smallTV.tvList[roomId]['iter'];
                        Live.smallTV.tvList[roomId]['tv'][iter] = result.data;
                        Live.smallTV.tvList[roomId]['tv'][iter]['joined'] = true;
                        var time = new Date();
                        Live.smallTV.tvList[roomId]['tv'][iter].timestamp = {
                            year: time.getFullYear(),
                            month: time.getMonth(),
                            day: time.getDate(),
                            week: time.getDay(),
                            hour: time.getHours(),
                            min: time.getMinutes(),
                            sec: time.getSeconds()
                        };
                        Live.smallTV.count += 1;
                        store.set('bilibili_helper_tvs_count', Live.smallTV.count);
                        Live.watcher.pushNotification('tv', "????????????????????????", "????????????" + roomId + "???", "//static.hdslb.com/live-static/live-room/images/gift-section/gift-25.png")
                        Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????:' + tvId + ' ??????????????????');
                    } else if (result.code == 0 && result.data.status == 2) { // ??????????????????????????????????????????????????????????????????
                        // sTv.panels.drawingPanel.open();
                        Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????:' + tvId + ' ' + result.msg);
                    } else {
                        // sTv.panels.commonPanel("??????", result.msg);
                        Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????:' + tvId + ' ' + result.msg);
                    }
                });
            },
            getReward: function (tvId, roomId) {
                $.getJSON('/SmallTV/getReward', { id: tvId }).promise().then(function (result) {

                    if (result.code == 0 && result.data.status == 0) {
                        var iter = Live.smallTV.tvList[roomId]['iter'];
                        Live.smallTV.tvList[roomId]['tv'][iter]['reward'] = result.data.reward;
                        Live.smallTV.tvList[roomId]['tv'][iter]['win'] = result.data.win;
                        Live.smallTV.tvList[roomId]['tv'][iter]['fisished'] = true;
                        Live.smallTV.tvList[roomId]['iter'] = ++iter;
                        var reward_num = Live.smallTV.reward[result.data.reward.id];
                        if (reward_num == undefined) Live.smallTV.reward[result.data.reward.id] = 0;

                        Live.smallTV.reward[result.data.reward.id] += result.data.reward.num;
                        store.set('bilibili_helper_tvs_reward', Live.smallTV.reward);

                        var tv = Live.smallTV.tvList[roomId]['tv'][iter];
                        if (tv && tv.joined == false && tv.finished == false) Live.smallTV.join(roomId, tv.id);
                        if (result.data.reward.num) {
                            Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????:' + tvId + ' ??????' + Live.smallTV.rewardList[result.data.reward.id].title + "x" + result.data.reward.num);

                            if (Live.watcher.notifyOptions && Live.watcher.notifyOptions.tv) {
                                chrome.extension.sendMessage({
                                    command: "getTVReward",
                                    data: {
                                        roomId: roomId,
                                        rewardId: result.data.reward.id,
                                        rewardNum: result.data.reward.num,
                                        isWin: result.data.win
                                    }
                                });
                            }
                            Live.watcher.updateReward('tv');
                        } else Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????:' + tvId + ' ????????????????????????');

                        // Live.console.info('tv', { msg: '????????????????????????' });
                    } else if (result.code == 0 && result.data.status == 1) {
                        // sTv.panels.commonPanel("????????????", "?????????????????????????????????????????????????????????????????? (?????????)/");
                        Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????:' + tvId + ' ' + result.msg);
                    } else if (result.code == 0 && result.data.status == 2) {
                        // sTv.panels.drawingPanel.open();
                        // setTimeout(Live.smallTV.getReward(result.data.id, roomId), 1000);
                        Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????:' + tvId + ' ' + result.msg);
                    } else {
                        // sTv.panels.commonPanel("??????", result.msg);
                        Live.console.watcher('??????????????? ????????????' + roomId + '??? ??????:' + tvId + ' ' + result.msg);
                    }
                });
            }
        };
        Live.lottery = {
            lotteryMap: {},
            lotteries: {},
            iteratorMap: {},
            reward: {},
            rewardList: {},
            count: 0,
            init: function () {
                Live.lottery.count = store.get('bilibili_helper_lottery_count');
                if (isNaN(Live.lottery.count)) {
                    Live.lottery.count = 0;
                    store.set('bilibili_helper_lottery_count', 0);
                }
                Live.lottery.reward = store.get('bilibili_helper_lottery_reward');
                Live.lottery.rewardList = store.get('bilibili_helper_lottery_reward_list');
                if (typeof Live.lottery.reward != 'object') {
                    Live.lottery.reward = {};
                    store.set('bilibili_helper_lottery_reward', Live.lottery.reward);
                }
            },
            get: function (roomId) {
                // var result = {
                //     "code": 0,
                //     "msg": "\u83b7\u53d6\u6210\u529f",
                //     "data": [{
                //         "type": "lottery",
                //         "raffleId": 171,
                //         "time": 83,
                //         "status": false 0  ????????????  1  ??????????????? 2 ????????????
                //     }]
                // };
                $.getJSON('/eventRoom/check', { roomid: roomId }).promise().then(function (result) {
                    console.log(result);
                    if (result.code == -403) Live.console.watcher('???????????? ????????????????????????');
                    else if (result.code == 0 && result.data.length > 0) {
                        Live.console.watcher('??????????????????????????? ????????????' + roomId + '???');
                        if (Live.lottery.lotteryMap[roomId] == undefined) Live.lottery.lotteryMap[roomId] = [];
                        Live.each(result.data, function (index) {
                            // console.log(result.data, index)
                            var lottery = result.data[index];
                            var raffleId = lottery.raffleId;
                            if (Live.lottery.lotteries[raffleId] == undefined) { //new
                                var time = new Date();
                                lottery.timestamp = {
                                    year: time.getFullYear(),
                                    month: time.getMonth(),
                                    day: time.getDate(),
                                    week: time.getDay(),
                                    hour: time.getHours(),
                                    min: time.getMinutes(),
                                    sec: time.getSeconds()
                                };
                                Live.lottery.lotteries[raffleId] = lottery;
                                Live.lottery.lotteryMap[roomId].push(raffleId);
                                Live.console.watcher('???????????? ????????????' + roomId + '??? ??????:' + raffleId + ' ????????????????????? ');
                                Live.lottery.join(roomId, raffleId);
                            }
                        });
                    }
                }, function () {
                    Live.console.watcher('???????????? ????????????' + roomId + '??? ??????:' + raffleId + ' ????????????????????????');
                    Live.lottery.check(roomId);
                });
            },
            join: function (roomId, raffleId) {
                // var result = {
                //     code: 0,
                //     msg: "????????????",
                //     data: []
                // };
                $.getJSON('/eventRoom/join', { roomid: roomId, raffleId: raffleId }).promise().then(function (result) {
                    Live.console.watcher('???????????? ????????????' + roomId + '??? ??????:' + raffleId + ' ????????????');
                    Live.lottery.count += 1;
                    if (isNaN(Live.lottery.count)) Live.lottery.count = 1;
                    store.set('bilibili_helper_lottery_count', Live.lottery.count);
                    Live.watcher.pushNotification('lottery', "?????????????????????", "?????????:" + roomId + " ??????:" + raffleId, "//static.hdslb.com/live-static/live-room/images/gift-section/gift-36.png");
                    Live.lottery.lotteries[raffleId].setTimeoutNum = setTimeout(function () {
                        Live.lottery.getReward(roomId, raffleId, function (result, roomId, raffleId) {
                            var msg;
                            if (result.data.giftName != "") {
                                console.log(result.data);

                                //update gift id list
                                Live.lottery.rewardList[result.data.giftId] = { title: result.data.giftName };
                                store.set('bilibili_helper_lottery_reward_list', Live.lottery.rewardList);

                                Live.console.watcher("???????????? ????????????" + roomId + "??? ??????:" + raffleId + " ??????" + result.data.giftName + "x" + result.data.giftNum);
                                Live.watcher.pushNotification('lottery', "????????????" + roomId + "?????????????????????", "??????:" + raffleId + " ??????" + result.data.giftName + "x" + result.data.giftNum, "//static.hdslb.com/live-static/live-room/images/gift-section/gift-36.png");

                                //update reward list
                                var rewardCount = Live.lottery.reward[result.data.giftId];
                                if (rewardCount == undefined) rewardCount = 0;
                                Live.lottery.reward[result.data.giftId] = rewardCount + result.data.giftNum;
                                store.set('bilibili_helper_lottery_reward', Live.lottery.reward);
                                // Live.lottery.lotteries[raffleId].reward = result.data;
                                Live.watcher.updateReward('lottery');
                            } else {
                                Live.console.watcher("???????????? ????????????" + roomId + "??? ??????:" + raffleId + " " + result.msg);
                                Live.watcher.pushNotification('lottery', "????????????" + roomId + "?????????????????????", "??????:" + raffleId + " " + result.msg, "//static.hdslb.com/live-static/live-room/images/gift-section/gift-36.png");
                            }

                            // if ((Live.lottery.lotteryMap[roomId].length - 1) > Live.lottery.iteratorMap[roomId]) {
                            //     var iter = ++Live.lottery.iteratorMap[roomId];
                            //     var raffleId = Live.lottery.lotteryMap[roomId][iter];
                            //     Live.lottery.join(roomId, raffleId);
                            // }
                        });
                    }, (Live.lottery.lotteries[raffleId].time + 20) * 1000);
                }, function () {
                    Live.console.watcher('???????????? ????????????' + roomId + '??? ??????:' + raffleId + ' ????????????????????????');
                    Live.lottery.join(roomId, raffleId);
                });
            },
            getReward: function (roomId, raffleId, callback) {
                // var result = {
                //     code: 0,
                //     msg: "????????????????????????????????????????????????",
                //     data: {
                //         giftName: ""
                //     }
                // };
                // var result = {
                //     code: 0,
                //     msg: "????????????",
                //     data: {
                //         giftName: "??????",
                //         giftNum: 5,
                //         giftId: "1",
                //         raffleId: 964
                //     }
                // };
                $.getJSON('/eventRoom/notice', { roomid: roomId, raffleId: raffleId }).promise().then(function (result) {
                    if (typeof callback == 'function') callback(result, roomId, raffleId);
                }, function () {
                    Live.console.watcher('???????????? ????????????' + roomId + '??? ??????:' + raffleId + ' ????????????????????????');
                    Live.lottery.getReward(roomId, raffleId);
                });
            }
        };
        Live.watcher = {
            able: false,
            options: {
                tv: false,
                lottery: false
            },
            notifyStatus: false,
            notifyOptions: {
                tv: false,
                lottery: false
            },
            panelDOM: {
                ty: undefined,
                lottery: undefined
            },
            init: function (callback) {
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'watcher'
                }, function (res) {
                    if (res['value'] == 'on') setTimeout(function () {
                        chrome.extension.sendMessage({
                            command: "getWatcherRoom"
                        }, function (response) {
                            // Live.watcherInfoDOM = $('<div class="room-info watcher-info">???????????????????????????????????????</div>');
                            Live.watcherBtn.find('span').attr('title', '???????????????');
                            if (Live.mobileVerified) {
                                // Live.bilibiliHelperInfoDOM.append(Live.watcherInfoDOM);
                                if (response['data'].roomId == undefined) {
                                    //setWatcherRoom
                                    var roomId = Live.roomId;
                                    Live.getRoomInfo().done(function (data) {
                                        chrome.extension.sendMessage({
                                            command: "setWatcherRoom",
                                            data: {
                                                uid: data.data.UID,
                                                roomId: data.data.ROOMID,
                                                roomShortId: location.pathname.substr(1),
                                                roomTitle: data.data.ROOMTITLE,
                                                upName: data.data.ANCHOR_NICK_NAME,
                                                url: location.href
                                            }
                                        });
                                    });
                                    chrome.extension.sendMessage({
                                        command: "getOption",
                                        key: 'watchList',
                                    }, function (response) {
                                        var watchList = response['value'] ? JSON.parse(response['value']) : [];
                                        Live.scriptOptions['watcher'] = [];
                                        Live.each(watchList, function (i) {
                                            var option = Live.watcher.options[watchList[i]];
                                            if (option == false) {
                                                Live.watcher.options[watchList[i]] = true;
                                                Live.scriptOptions['watcher'].push(watchList[i]);
                                                Live.console.watcher('??????:' + watchList[i]);
                                            }
                                        });
                                        Live.watcher.initRewardPanel();
                                        $(window).on('beforeunload', function () {
                                            chrome.extension.sendMessage({
                                                command: "delWatcherRoom"
                                            });
                                            console.log(0);
                                        });

                                        if (Live.watcher.options['tv']) {
                                            Live.smallTV.init();
                                            Live.watcher.updateReward('tv');
                                        }
                                        if (Live.watcher.options['lottery']) {
                                            Live.lottery.init();
                                            Live.watcher.updateReward('lottery');
                                        }


                                        document.addEventListener("sendMessage", function (event) {
                                            var message = store.get('bilibili_helper_message');
                                            if (!message.cmd) return false;
                                            Live.watcher.classify(message);
                                        });
                                        Live.watcher.initData();
                                        if (typeof callback == 'function') callback();
                                    });
                                    chrome.extension.sendMessage({
                                        command: "getOption",
                                        key: 'watchNotify',
                                    }, function (response) {
                                        Live.watcher.notifyStatus = response['value'] == 'on';
                                    });
                                    chrome.extension.sendMessage({
                                        command: "getOption",
                                        key: 'watchNotifyList',
                                    }, function (response) {
                                        var notifyOptionsList = response['value'] ? JSON.parse(response['value']) : [];
                                        Live.each(notifyOptionsList, function (i) {
                                            var option = Live.watcher.notifyOptions[notifyOptionsList[i]];
                                            if (!option) Live.watcher.notifyOptions[notifyOptionsList[i]] = true;
                                        });
                                    });
                                    // Live.watcherInfoDOM.html('??????????????????????????????');

                                    Live.helperInfo.setWatcherStatus('success', '??????????????????');

                                } else {
                                    chrome.extension.sendMessage({
                                        command: "getOption",
                                        key: 'watchList',
                                    }, function (response) {
                                        var watchList = response['value'] ? JSON.parse(response['value']) : [];
                                        Live.each(watchList, function (i) {
                                            Live.watcher.options[watchList[i]] = true;
                                        });
                                        Live.watcher.initRewardPanel();
                                    });
                                    Live.helperInfo.setWatcherStatus('wait', '?????????????????????' + response['data'].upName + '?????????????????????');
                                    if (typeof callback == 'function') callback();
                                    // Live.watcherInfoDOM.html('??????????????????<a target="_blank" href="' + response['data'].url + '">' + response['data'].upName + '</a>??????????????????');
                                }

                                Live.watcher.able = true;
                            } else Live.helperInfo.setWatcherStatus('error', '????????????????????????????????????????????????');
                        });
                    }, 2000);
                });
            },
            initData: function () {
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'watcherDataClean'
                }, function (res) {
                    var oDate = store.get('bilibili_helper_watcher_data_date');
                    var currentYear = new Date().getFullYear(),
                        currentMonth = new Date().getMonth() + 1,
                        currentDay = new Date().getDate();
                    var date = currentYear + '-' + currentMonth + '-' + currentDay
                    if (res['value'] == '0') {
                        return;
                    } else if (res['value'] == '1') {
                        if (oDate == undefined) Live.watcher.cleanData();
                        else if (oDate != date) Live.watcher.cleanData();
                        store.set('bilibili_helper_watcher_data_date', date);
                    } else if (res['value'] == '2') {
                        if (!oDate || Live.getDateDiff(oDate, date) >= 7) {
                            Live.watcher.cleanData();
                            store.set('bilibili_helper_watcher_data_date', date);
                        }
                    }
                });
            },
            cleanData: function () {
                store.set('bilibili_helper_tvs_reward', {});
                store.set('bilibili_helper_tvs_count', 0);
                store.set('bilibili_helper_lottery_reward', {});
                store.set('bilibili_helper_lottery_count', 0);
            },
            classify: function (json) {
                switch (json.cmd) {
                    case 'DANMU_MSG':
                        Live.console.info('danmu', json);
                        break;
                    case 'SYS_MSG':
                        Live.console.info('system', json);
                        Live.watcher.options['tv'] && Live.watcher.dealWithSysMsg(json);
                        break;
                    case 'TV_END':
                        Live.console.info('tv_end', json);
                        break;
                    case 'SEND_GIFT':
                        Live.console.info('gift', json);
                        break;
                    case 'SYS_GIFT':
                        Live.console.info('sys_gift', json);
                        console.log(Live.watcher.options['lottery'])
                        Live.watcher.options['lottery'] && Live.watcher.dealWithSysGift(json);
                        break;
                }
            },
            dealWithSysMsg: function (json) {
                var msg = json.msg;
                if (msg[0] == "???" && json.url != "" && json.rep == 1 && json.styleType == 2) { //smallTV
                    var reg = new RegExp("???([\\S]+)??????????????????([\\d]+)???");
                    var res = reg.exec(msg);
                    var user = res[1];
                    var roomUrl = res[2];
                    Live.getRoomIdByUrl(roomUrl, function (roomId) {
                        Live.smallTV.get(roomId);
                    });
                } else if (msg[0] == "???" && json.url == "" && json.rep == 1 && json.styleType == 2) { //get smallTV
                    var reg = new RegExp("?????????([\\S]+)??????????????????([\\d]+)???");
                    var res = reg.exec(msg);
                    var user = res[1];
                    var url = res[2];
                    var roomId = store.get('bilibili_helper_live_roomId')[url];
                    var tv = Live.smallTV.getTV(roomId);
                    tv && Live.smallTV.getReward(tv.id, roomId);
                }
            },
            dealWithSysGift: function (json) {
                //"tips": "????????????????????????????????????81688?????? ?????? ????????? 100 ???????????? 1 ?????????????????????????????????????????????"
                // try {
                    var msg = json.tips;
                    if (typeof msg != 'string' && !json.giftId) return;
                    switch (json.giftId) {
                        case 39:
                            var reg = new RegExp("???????????????([0-9]+)???");
                            var res = reg.exec(msg);
                            console.log(res);
                            var roomUrl = res[1];
                            var number = res[2];
                            Live.getRoomIdByUrl(roomUrl, function (roomId) {
                                Live.beat.getBeat(roomId).done(function (res) {
                                    if (res.data['39']['id']) {
                                        var beat = res.data['39']['content'];
                                        Live.beat.sendBeat(roomId, beat);
                                        delete beat;
                                        var rewardCount = Live.lottery.reward['6'];
                                        if (rewardCount == undefined) rewardCount = 0;
                                        Live.lottery.reward['6'] = ++rewardCount;
                                        store.set('bilibili_helper_lottery_reward', Live.lottery.reward);
                                        Live.watcher.updateReward('lottery');
                                    }
                                });
                            });
                            break;
                    }
                // } catch (e) {
                //     console.log(e);
                //     return;
                // }
            },
            pushNotification: function (type, title, body, icon) {
                if (Live.watcher.notifyStatus && Live.watcher.notifyOptions[type]) {
                    var msg = new Notification(title, {
                        body: body,
                        icon: icon
                    });
                    setTimeout(function () {
                        msg.close();
                    }, 5000);
                }
            },
            initRewardPanel: function () {
                if (Live.watcher.options['tv']) {
                    Live.watcher.panelDOM.tv = $('<div />').addClass('tv reward-panel');
                    var tvCounter = $('<span />').addClass('reward-counter');
                    var title = $('<div />').addClass('reward-title').text('???????????????').append(tvCounter);
                    var container = $('<div />').addClass('reward-container');
                    Live.watcher.panelDOM.tv.append(title, container);
                    Live.watcherPanel.append(Live.watcher.panelDOM.tv);
                }
                if (Live.watcher.options['lottery']) {
                    Live.watcher.panelDOM.lottery = $('<div />').addClass('lottery reward-panel');
                    var lotteryCounter = $('<span />').addClass('reward-counter');
                    var title = $('<div />').addClass('reward-title').text('????????????').append(lotteryCounter);
                    var container = $('<div />').addClass('reward-container');
                    Live.watcher.panelDOM.lottery.append(title, container);
                    Live.watcherPanel.append(Live.watcher.panelDOM.lottery);
                }
            },
            updateReward: function (type) {
                var gifts = {},
                    counter = 0,
                    giftsList = undefined;
                if (Live.watcher.able) {
                    switch (type) {
                        case 'tv':
                            gifts = store.get('bilibili_helper_tvs_reward');
                            counter = store.get('bilibili_helper_tvs_count');
                            giftsList = Live.smallTV.rewardList;
                            break;
                        case 'lottery':
                            gifts = store.get('bilibili_helper_lottery_reward');
                            counter = store.get('bilibili_helper_lottery_count');
                            giftsList = store.get('bilibili_helper_lottery_reward_list');
                            break;
                    }
                    if (giftsList && Live.watcher.panelDOM[type]) {
                        Live.watcher.panelDOM[type].find('.reward-container').empty();
                        var length = 0;
                        Live.each(gifts, function (id) {
                            ++length;
                            var giftName = giftsList[id] ? giftsList[id].title : (Live.giftList[id] ? Live.giftList[id].title : "????????????"),
                                number = gifts[id];
                            var giftDOM = $('<span />').addClass('gift').text(giftName + 'x' + Live.numFormat(number));

                            Live.watcher.panelDOM[type].find('.reward-container').append(giftDOM);
                        });
                        if (!length) Live.watcher.panelDOM[type].find('.reward-container').append($('<span class="gift">??????????????????</span>'));
                    }
                    Live.watcher.panelDOM[type] && Live.watcher.panelDOM[type].find('.reward-counter').text(counter + ' ???');
                }
            }
        };
        Live.beat = {
            counter: 10,
            timer: -1,
            iter: 0,
            rounds: 0,
            interval: -1,
            init: function () {
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'beat',
                }, function (res) {
                    if (res['value'] == 'on') {
                        if (Live.BBQ && Live.BBQ.level >= 10) {
                            if (typeof Live.user.user_level_rank == 'string') {
                                console.log('UL rank >25000');
                            } else if (Live.user && Live.user.user_level_rank <= 25000) Live.scriptOptions['beat'] = true;
                        } else console.log('NONE BBQ Medal or BBQ level <10');
                    }
                });
                /*Live.beat.getRankList('month', 20160801).done(function (res) {
                    var roomList = store.get('bilibili_helper_beat_roomList');
                    for (var i = 0; i < res.length; ++i) {
                        roomId = res[i].roomid;
                        if (roomList.indexOf(roomId) == -1) roomList.push(roomId);
                    }
                    store.set('bilibili_helper_beat_roomList', roomList);
                });
                Live.beat.getRankList('month', 20160901).done(function (res) {
                    var roomList = store.get('bilibili_helper_beat_roomList');
                    for (var i = 0; i < res.length; ++i) {
                        roomId = res[i].roomid;
                        if (roomList.indexOf(roomId) == -1) roomList.push(roomId);
                    }
                    store.set('bilibili_helper_beat_roomList', roomList);
                });
                setInterval(function () {
                    var DO = new Date();
                    var day = DO.getDate() < 10 ? '0' + DO.getDate() : DO.getDate();
                    var month = DO.getMonth() < 10 ? '0' + (DO.getMonth() + 1) : DO.getMonth() + 1;
                    var year = DO.getFullYear();
                    var date = year + "" + month + "" + day;
                    Live.beat.getRankList('day', date).done(function (res) {
                        var roomList = store.get('bilibili_helper_beat_roomList');
                        for (var i = 0; i < res.length; ++i) {
                            roomId = res[i].roomid;
                            if (roomList.indexOf(roomId) == -1) roomList.push(roomId);
                        }
                        store.set('bilibili_helper_beat_roomList', roomList);
                    });
                }, 60000);

                function n(roomId) {
                    if (roomId == undefined) return;
                    Live.beat.getBeat(roomId).done(function (res) {
                        if (res.data['39']['id']) {
                            var beat = res.data['39']['content'];
                            Live.beat.sendBeat(roomId, beat);
                            delete beat;
                        }
                    });
                }
                Live.beat.interval = setInterval(function () {
                    var roomList = store.get('bilibili_helper_beat_roomList');
                    if (roomList.length > 0) Live.beat.rounds = Math.ceil(roomList.length / Live.beat.counter);
                    else return;
                    for (var i = 0; i < 10; ++i) {
                        var roomId = roomList[i + Live.beat.iter];
                        n(roomId);
                        delete roomId;
                    }
                    delete roomList;
                    Live.beat.iter += Live.beat.counter;
                    if (Live.beat.iter == Live.beat.rounds * Live.beat.counter) Live.beat.iter = 0;
                }, 5000);*/
            },
            sendBeat: function (roomId, beat) {
                $.ajax({ url: "http://live.bilibili.com/msg/send", type: "post", data: { color: 16777215, fontsize: 25, mode: 1, msg: beat, rnd: new Date().getTime(), roomid: roomId } })
            },
            getBeat: function (roomId) {
                return $.get('http://live.bilibili.com/SpecialGift/room/' + roomId, {}, function () {}, 'json').promise();
            },
            getRankList: function (datatype, day) {
                return $.get('http://live.bilibili.com/rank/getCond', { datatype: datatype, day: day, giftid: 39, usertype: 'master' }, function () {}, 'json').promise();
            }
        };
        Live.giftpackage = {
            giftPackageStatus: 0, // 0: ???????????? 1: ?????????????????????????????? 2:????????????????????????
            panelStatus: false,
            giftPackageData: {},
            giftPackageMap: {},
            giftSendAll: {
                open: function () {

                    var sendPanel = Live.giftpackage.giftSendPanel;
                    Live.giftpackage.sendLineSection.empty();
                    var giftsArray = [];
                    Live.each(Live.giftpackage.giftPackageMap, function (id) {
                        var gifts = Live.giftpackage.giftPackageMap[id];
                        Live.each(gifts, function (index) {
                            var gift = gifts[index];
                            var giftDOM = $('<span />').addClass('package-item').attr({
                                'title': gift.gift_name,
                                'gift_id': id,
                                'bag_id': gift.id
                            });
                            var giftItemDOM = $('<div />').addClass('gift-item gift-item-package gift-' + id);
                            if (gift.expireat > 0) giftItemDOM.html('<span class="expires">' + gift.expireat + '???</span>');
                            else if (gift.expireat == 0) giftItemDOM.html('<span class="expires">??????</span>');
                            else giftItemDOM.html('<span class="expires">??????</span>');

                            var giftConterDOM = $('<div />').addClass('gift-count').text('x' + gift.gift_num);
                            giftDOM.append(giftItemDOM, giftConterDOM);
                            Live.giftpackage.sendLineSection.append(giftDOM);
                            giftsArray.push(gift);
                        });
                    });
                    if (giftsArray.length > 0) {
                        $(document).click();
                        Live.giftpackage.sendLinePanel.show();
                        Live.giftpackage.giftSendLinePanel.giftsData = giftsArray;
                    }
                }
            },
            giftSendLinePanel: {
                line_id: null,
                giftsData: {},
                outTimeout: null,
                open: function (id) {
                    $(document).click();
                    Live.giftpackage.giftSendLinePanel.line_id = id;
                    Live.giftpackage.giftSendLinePanel.giftsData = Live.giftpackage.giftPackageMap[id];
                    var gifts = Live.giftpackage.giftSendLinePanel.giftsData;
                    var sendPanel = Live.giftpackage.giftSendPanel;
                    Live.giftpackage.sendLinePanel.show();
                    Live.giftpackage.sendLineSection.empty();
                    Live.each(Live.giftpackage.giftSendLinePanel.giftsData, function (index) {
                        var gift = gifts[index];
                        var giftDOM = $('<span />').addClass('package-item').attr({
                            'title': gift.gift_name,
                            'gift_id': id,
                            'bag_id': gift.id
                        });
                        var giftItemDOM = $('<div />').addClass('gift-item gift-item-package gift-' + id);
                        if (gift.expireat > 0) giftItemDOM.html('<span class="expires">' + gift.expireat + '???</span>');
                        else if (gift.expireat == 0) giftItemDOM.html('<span class="expires">??????</span>');
                        else giftItemDOM.html('<span class="expires">??????</span>');

                        var giftConterDOM = $('<div />').addClass('gift-count').text('x' + gift.gift_num);
                        giftDOM.append(giftItemDOM, giftConterDOM);
                        Live.giftpackage.sendLineSection.append(giftDOM);
                    });
                },
                close: function () {
                    var sendLinePanel = Live.giftpackage.giftSendLinePanel;
                    Live.giftpackage.sendLinePanel.addClass('hide out');
                    sendLinePanel.outTimeout = setTimeout(function () {
                        Live.giftpackage.sendLinePanel.removeClass('hide out').css('display', '');
                    }, 380);
                },
                sendLine: function (event) {
                    if (event.type === "keyup" && event.keyCode !== 13) {
                        return;
                    }
                    var element = event.target || event.srcElement;
                    var gifts = Live.giftpackage.giftSendLinePanel.giftsData;
                    var status = { complete: 0 };
                    Live.giftpackage.giftSendLinePanel.send(gifts, status, Live.giftpackage.giftSendLinePanel.callback);
                },
                send: function (gifts, status, callback) {
                    var gift = gifts[status.complete];
                    $.ajax({
                        url: "/giftBag/send",
                        type: "POST",
                        data: {
                            giftId: gift.gift_id,
                            roomid: Live.roomId,
                            ruid: Live.roomInfo.MASTERID,
                            num: gift.gift_num,
                            coinType: "silver",
                            Bag_id: gift.id,
                            timestamp: Date.now(),
                            rnd: store.get('bilibili_helper_live_danmu_rnd', Live.roomId),
                            token: Live.getCookie("LIVE_LOGIN_DATA") || ""
                        },
                        dataType: "JSON",
                        success: function (result) {
                            if (result.code == 0) {
                                console.log('??????????????????' + 'BagID:' + gift.id + ' ID:' + gift.gift_id + ' ??????:' + gift.gift_num + ' ??????:' + gift.expireat);
                                if (typeof callback == 'function') callback(gifts, status);
                            } else if (result.code == 1) {
                                console.log('???????????????????????????');
                                setTimeout(function () {
                                    Live.giftpackage.giftSendLinePanel.send(gift);
                                }, 500);

                            } else {
                                console.log(result);
                            }

                        }
                    });
                },
                callback: function (gifts, status) {
                    ++status.complete;
                    if (status.complete == gifts.length) {
                        Live.giftpackage.giftSendLinePanel.close();
                        console.log('??????????????????');
                    } else {
                        Live.giftpackage.giftSendLinePanel.send(gifts, status, Live.giftpackage.giftSendLinePanel.callback);
                    }
                }
            },
            giftSendPanel: {
                giftData: {
                    giftId: "",
                    giftName: "",
                    giftNum: 0,
                    type: "silver",
                    count: 1,
                    bagId: 0
                },
                show: false,
                out: false,
                outTimeout: null,
                toggleGiftPackage: function (event) {
                    event.stopPropagation();
                    Live.liveQuickLogin();
                    if (!Live.giftpackage.panelStatus) {
                        if (Live.giftpackage.giftPackageStatus == 1) { // ??????????????????????????????????????????
                            Live.giftpackage.giftPackageNewPanel.open();
                        } else {
                            Live.giftpackage.openGiftPackagePanel(); // ????????????????????????
                        }
                    } else {
                        Live.giftpackage.closeGiftPackagePanel();
                    }
                },
                open: function (giftId, giftName, giftNum, bigId) {
                    var sendPanel = Live.giftpackage.giftSendPanel;

                    sendPanel.giftData.giftId = giftId;
                    sendPanel.giftData.giftName = giftName;
                    sendPanel.giftData.giftNum = giftNum;
                    sendPanel.giftData.count = giftNum;
                    sendPanel.giftData.bagId = bigId;

                    $(document).click();
                    Live.giftpackage.sendNumberGroup.empty();
                    var numberGroup = ["1", "5", "10", "30", "50", "5%", "10%", "30%", "50%", "MAX"];
                    for (var i = 0; i < numberGroup.length; ++i) {
                        var numberBtn = $('<span />').addClass('number-btn').text(numberGroup[i]);
                        if (i < 5 && giftNum < parseInt(numberGroup[i])) numberBtn.addClass('disabled');
                        Live.giftpackage.sendNumberGroup.append(numberBtn);
                        numberBtn.off('click').on('click', function (e) {
                            var n = $(this).text();
                            switch (n) {
                                case '1':
                                case '5':
                                case '10':
                                case '30':
                                case '50':
                                    var num = parseInt(n);
                                    if (giftNum < num) num = giftNum;
                                    Live.giftpackage.sendGiftInput.val(num);
                                    break;
                                case '5%':
                                case '10%':
                                case '30%':
                                case '50%':
                                    var num = Math.ceil(parseInt(n.substr(0, n.length - 1)) * 0.01 * giftNum);
                                    if (giftNum < num) num = giftNum;
                                    Live.giftpackage.sendGiftInput.val(num);
                                    break;
                                case 'MAX':
                                    Live.giftpackage.sendGiftInput.val(giftNum)
                            }
                        });
                    }
                    Live.giftpackage.sendGiftImg.attr('class', 'gift-img float-left gift-' + giftId);
                    Live.giftpackage.sendGiftInfo.text('????????????????????? ' + giftNum + ' ?????????');
                    Live.giftpackage.sendGiftInput.val(giftNum).focus();
                    Live.giftpackage.sendPanel.show();

                    setTimeout(function () {
                        $(document).on("click", n);
                        var n = function (t) {
                            var e = t && (t.target || t.srcElement)
                            if (!$(e).hasClass('panel-content') && !$(e).parents('.panel-content').length) {
                                $(document).off("click", n);
                                Live.giftpackage.giftSendPanel.close();
                            }
                        }
                    }, 1);
                },
                close: function () {
                    var sendPanel = Live.giftpackage.giftSendPanel;
                    Live.giftpackage.sendPanel.addClass('hide out');
                    sendPanel.outTimeout = setTimeout(function () {
                        Live.giftpackage.sendPanel.removeClass('hide out').css('display', '');
                    }, 380);
                },
                sendGift: function (event) {
                    if (event.type === "keyup" && event.keyCode !== 13) {
                        return;
                    }

                    var element = event.target || event.srcElement;
                    var giftData = Live.giftpackage.giftSendPanel.giftData;
                    giftData.count = Live.giftpackage.sendGiftInput.val();
                    var num = parseInt(giftData.count, 10),
                        rnd = store.get('bilibili_helper_live_danmu_rnd', Live.roomId);


                    // ???????????????????????????????????????.
                    if (isNaN(num)) {
                        giftData.count = "";
                        Live.liveToast(Live.giftpackage.sendGiftInput, 'error', "?????????????????????????????? " + Live.randomEmoji.helpless());
                        return;
                    }
                    $.ajax({
                        url: "/giftBag/send",
                        type: "POST",
                        data: {
                            giftId: giftData.giftId,
                            roomid: Live.roomId,
                            ruid: Live.roomInfo.MASTERID,
                            num: giftData.count,
                            coinType: giftData.type,
                            Bag_id: giftData.bagId,
                            timestamp: Date.now(),
                            rnd: rnd,
                            token: Live.getCookie("LIVE_LOGIN_DATA") || ""
                        },
                        dataType: "JSON",
                        success: function (result) {
                            if (result.code == 0) {
                                console.log("Gift-sending is successful.");
                                Live.liveToast(element, "info", "Gift-sending is successful. " + Live.randomEmoji.helpless());
                                // ???????????????.
                                // Live.control.$fire("all!updateCurrency", {
                                //     gold: result.data.gold,
                                //     silver: result.data.silver
                                // });

                                // ??????????????????????????? Flash.
                                result.data.data.giftType == 1 && $("#player_object")[0].sendGift(result.data.data.giftId, result.data.data.num);

                                // ??????????????????.
                                // result.data.data.newMedal == 1 && Live.control.$fire("all!newFansMedalNotice", {
                                //     medalId: result.data.data.medal.medalId,
                                //     medalName: result.data.data.medal.medalName,
                                //     medalLevel: result.data.data.medal.level
                                // });

                                // ???????????????
                                // result.data.data.newTitle == 1 && Live.control.$fire("all!newTitleNotice", result.data.data.title);

                                // ?????????????????????????????????????????????.
                                // Edited By LancerComet at XX:XX (Afternoon), 2016.03.22.
                                var giftTarget = document.getElementById("gift-msg-1000"); // ????????????????????????.
                                function chatGiftList(json) {
                                    // ????????????
                                    var giftLtInfo = {
                                        uname: json.data.uname,
                                        num: json.data.num,
                                        giftName: json.data.giftName,
                                        giftId: json.data.giftId
                                    };

                                    giftTarget.innerHTML = '<div class="gift-msg-item"><span class="user-name-low">' + giftLtInfo.uname + '</span> ' +
                                        '<span class="action">??????' + giftLtInfo.giftName + '</span>' +
                                        '<div class="gift-img gift-' + giftLtInfo.giftId + '" role="img"></div>' +
                                        'X <span class="gift-count">' + giftLtInfo.num + '</span></div>';

                                }
                                if (parseInt(result.data.data.num, 10) < 10) {
                                    chatGiftList(result.data);
                                } else {
                                    // ????????????????????????.
                                    // window.liveRoomFuncs.addGiftHistory(result.data);
                                }

                                // console.log(result);
                                // ????????????.
                                // Live.control.$fire("all!superGift", result.data.data);

                                // ???????????????.
                                // Live.control.$fire("all!updateGiftTop", result.data.data.top_list);

                                // ?????????????????????
                                // Live.control.$fire("all!updateCapsuleData", result.data.data.capsule);

                                // ?????????????????????????????????????????????????????????
                                // if (result.data.data.giftId == 25) {
                                //     (function () {
                                //         var msgItem = {};
                                //         for (var i = 0; i < result.data.data.smalltv_msg.length; i++) {
                                //             msgItem = result.data.data.smalltv_msg[i];
                                //             msgItem.msg = msgItem.msg.replace(/\:\?/g, " ");
                                //             Live.control.$fire("all!addSysMsg", msgItem);
                                //         }
                                //     })();
                                // }

                                // ?????? Flash ??????????????????
                                if (result.data.data.notice_msg) {
                                    $("#player_object")[0].noticeGift(result.data.data.notice_msg);
                                }

                                // Callback
                                giftData.giftNum = result.data.remain;
                                Live.giftpackage.sendGiftInfo.text('????????????????????? ' + giftData.giftNum + ' ?????????');
                                Live.giftpackage.sendGiftInput.focus();
                                // ??? remain ??? 0 ??????????????????????????????
                                if (result.data.remain == 0) {
                                    // Live.liveToast(element,'error', "????????????????????? " + Live.randomEmoji.sad(), "caution");
                                    Live.giftpackage.sendGiftInput.val(0);
                                    Live.giftpackage.giftSendPanel.close();
                                    // getGiftPackageStatus(function (result) {
                                    //     Live.giftpackage.giftPackageStatus = result.data.result;
                                    // });
                                }
                            }

                            // ????????????????????????????????????????????????
                            else if (result.code == 1) {
                                console.log("????????????...");
                            }

                            // ????????????????????????????????????.
                            else if (result.code == -400 && result.msg == "????????????") {
                                // Live.control.$fire("all!noSeed");
                                Live.giftpackage.giftSendPanel.close();
                            }

                            // Error Handler.
                            else {
                                element && Live.liveToast(element, 'caution', result.msg + " " + Live.randomEmoji.sad());
                            }
                        },
                        error: function (result) {
                            element && Live.liveToast(element, "error", Live.randomEmoji.sad() + " ???????????????" + result.statusText + " " + Live.randomEmoji.sad());
                            // param.errorCallback && param.errorCallback();
                        }
                    });
                    // Live.control.$fire("all!sendGift", {
                    //     element: element,
                    //     type: "package",
                    //     data: {
                    //         giftId: giftData.giftId,
                    //         num: num,
                    //         coinType: giftData.type,
                    //         bagId: giftData.bagId
                    //     },
                    //     callback: function (result) {
                    //         if (result.code == 0) {
                    // giftData.giftNum = result.data.remain;
                    // // ??? remain ??? 0 ??????????????????????????????
                    // if (result.data.remain == 0) {
                    //     getGiftPackageStatus(function (result) {
                    //         Live.giftpackage.giftPackageStatus = result.data.result;
                    //     });
                    // }
                    //         }
                    //     }
                    // });
                }
            },
            giftPackageNewPanel: {
                data: [],
                show: false,
                out: false,
                outTimeout: null,
                open: function () {
                    var giftPackageNewPanel = Live.giftpackage.giftPackageNewPanel;
                    // ??????????????????????????????
                    Live.giftpackage.getSendGift(function (result) {
                        if (result.code == 0) {
                            Live.giftpackage.giftPackageNewPanel.data = result.data;
                        }
                    });
                },
                close: function () {
                    var giftPackageNewPanel = Live.giftpackage.giftPackageNewPanel;
                    giftPackageNewPanel.out = true;
                    giftPackageNewPanel.outTimeout = setTimeout(function () {
                        giftPackageNewPanel = null;
                        Live.giftpackage.giftPackageStatus = 2;
                        Live.giftpackage.openGiftPackagePanel(); // ????????????
                    }, 380);
                }
            },
            init: function () {
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'giftpackage'
                }, function (res) {
                    if (res['value'] == 'on') {
                        //init dom
                        $('#gift-panel').find('.control-panel .items-package').hide();

                        Live.giftpackage.controlPanel = $('#gift-panel').find('.control-panel');
                        Live.giftpackage.package = Live.giftpackage.controlPanel.find('.items-package').clone().css('display', 'inline-block');
                        Live.giftpackage.controlPanel.find('.items-package').after(Live.giftpackage.package);
                        Live.giftpackage.packageBtn = Live.giftpackage.package.find('.link');
                        Live.giftpackage.packagePanel = Live.giftpackage.package.find('.gifts-package-panel');
                        Live.giftpackage.packageContent = Live.giftpackage.package.find('.gifts-package-content');
                        Live.giftpackage.packagePanelTitle = Live.giftpackage.packagePanel.find('.gifts-package-title');
                        // if (Live.BBQ && Live.BBQ.level >= 5) {
                            Live.giftpackage.packagePanelCleanBtn = $('<span />').addClass('gifts-package-clean').text('????????????');
                            Live.giftpackage.packagePanelTitle.append(Live.giftpackage.packagePanelCleanBtn);
                        // }

                        Live.giftpackage.sendPanel = $('#gift-package-send-panel');
                        Live.giftpackage.sendContent = $('#gift-package-send-panel').find('.panel-content');
                        Live.giftpackage.sendGiftImg = Live.giftpackage.sendPanel.find('.gift-img');
                        Live.giftpackage.sendGiftInfo = Live.giftpackage.sendPanel.find('.gift-info p');
                        Live.giftpackage.sendGiftInput = Live.giftpackage.sendPanel.find('input').clone();
                        Live.giftpackage.sendPanel.find('input').after(Live.giftpackage.sendGiftInput).hide();
                        Live.giftpackage.sendGiftBtn = Live.giftpackage.sendPanel.find('button').clone();
                        Live.giftpackage.sendPanel.find('button').after(Live.giftpackage.sendGiftBtn).hide();
                        Live.giftpackage.sendNumberGroup = $('<div />').addClass('number-group');
                        Live.giftpackage.sendContent.append(Live.giftpackage.sendNumberGroup)

                        //send line dom
                        Live.giftpackage.sendLinePanel = $('#gift-package-send-panel').clone().attr('id', 'gift-package-send-line-panel');
                        Live.giftpackage.sendPanel.after(Live.giftpackage.sendLinePanel);
                        Live.giftpackage.sendLineSection = Live.giftpackage.sendLinePanel.find('.section').empty();
                        Live.giftpackage.sendLinePanel.find('input').hide();
                        Live.giftpackage.sendLineBtn = Live.giftpackage.sendLinePanel.find('button:eq(1)');

                        //init event
                        Live.giftpackage.packageBtn.off('click').on('click', function (e) {
                            Live.giftpackage.openGiftPackagePanel();
                        });

                        Live.giftpackage.sendContent.find('.close-btn').off('click').on('click', function (e) {
                            Live.giftpackage.giftSendPanel.close();
                        });
                        Live.giftpackage.sendLinePanel.find('.close-btn').off('click').on('click', function (e) {
                            Live.giftpackage.giftSendLinePanel.close();
                        });
                        Live.giftpackage.sendGiftInput.off('keydown').on('keydown', function (e) {
                            if (e.keyCode === 13 && Live.giftpackage.sendGiftInput.val() != '') Live.giftpackage.giftSendPanel.sendGift(e);
                        });
                        Live.giftpackage.sendGiftBtn.off('click').on('click', function (e) {
                            Live.giftpackage.giftSendPanel.sendGift(e);
                        });
                        Live.giftpackage.sendLineBtn.off('click').on('click', function (e) {
                            Live.giftpackage.giftSendLinePanel.sendLine(e);
                        });
                        Live.scriptOptions['giftpackage'] = true;
                    }
                });
            },
            initGiftsDOM: function (giftsData) {
                Live.giftpackage.packageContent.empty();
                Live.giftpackage.packagePanel.removeClass('big');
                Live.each(giftsData, function (id) {
                    var gifts = giftsData[id];
                    var giftsDOM = $('<div />').addClass('gift-item-group').attr('gift_id', id);
                    Live.each(gifts, function (index) {
                        var gift = gifts[index];
                        var giftDOM = $('<span />').addClass('package-item').attr({
                            'title': gift.gift_name,
                            'gift_id': id,
                            'bag_id': gift.id
                        });
                        var giftItemDOM = $('<div />').addClass('gift-item gift-item-package gift-' + id);
                        if (gift.expireat > 0) giftItemDOM.html('<span class="expires">' + gift.expireat + '???</span>');
                        else if (gift.expireat == 0) giftItemDOM.html('<span class="expires">??????</span>');
                        else giftItemDOM.html('<span class="expires">??????</span>');
                        var giftConterDOM = $('<div />').addClass('gift-count').text('x' + gift.gift_num);
                        giftDOM.append(giftItemDOM, giftConterDOM);
                        giftsDOM.append(giftDOM).css('width', (54 * gifts.length) + 'px');
                    });
                    var lineSendDOM = $('<div />').addClass('send_line').text('????????????');
                    var container = $('<div />').addClass('container').append(lineSendDOM, giftsDOM);
                    Live.giftpackage.packageContent.append(container);
                    if (gifts.length > 10) Live.giftpackage.packagePanel.addClass('big');
                });

                //init event
                Live.giftpackage.packagePanelCleanBtn && Live.giftpackage.packagePanelCleanBtn.off('click').on('click', function (e) {
                    Live.giftpackage.giftSendAll.open();
                });
                Live.giftpackage.packageContent.find('.package-item').off('click').on('click', function (e) {
                    var bagId = $(this).attr('bag_id');
                    var gift = Live.giftpackage.giftPackageData[bagId];
                    Live.giftpackage.giftSendPanel.open(gift.gift_id, gift.gift_name, gift.gift_num, gift.id);
                });
                Live.giftpackage.packageContent.find('.send_line').off('click').on('click', function (e) {
                    var gift_id = $(this).parent().find('.gift-item-group').attr('gift_id');
                    Live.giftpackage.giftSendLinePanel.open(gift_id);
                });
            },
            sortGifts: function (giftpackageData) {
                var r = {},
                    gs = giftpackageData;
                Live.giftpackage.giftPackageData = {};
                Live.each(gs, function (i) {
                    // expireat:"31???"
                    // gift_id:37
                    // gift_name:"??????"
                    // gift_num:39
                    // gift_price:"1000?????????"
                    // gift_type:3
                    // id:4473074
                    // uid:50623
                    var gift = gs[i];
                    Live.giftpackage.giftPackageData[gift.id] = gift;

                    if (gift.expireat == '??????') gift.expireat = 0;
                    else if (gift.expireat == 0) gift.expireat = -1;
                    else gift.expireat = parseInt(gift.expireat);
                    if (r[gift.gift_id] == undefined) r[gift.gift_id] = [];
                    var position = 0;
                    Live.each(r[gift.gift_id], function (index) {
                        if (gift.expireat < r[gift.gift_id][index].expireat && position >= index) position = index;
                        else if (position >= index) position = index + 1;
                    });
                    r[gift.gift_id].splice(position, 0, gift);
                });
                return r;
            },
            getGiftPackage: function () { //get package data
                return $.get('http://live.bilibili.com/gift/playerBag', {}, function () {}, 'json').promise();
            },
            getSendGift: function () { // get new gift
                return $.get('http://live.bilibili.com/giftBag/getSendGift', {}, function () {}, 'json').promise();
            },
            getGiftPackageStatus: function () { //get the info for 'if has new gift'
                return $.get('http://live.bilibili.com/giftBag/sendDaily', {}, function () {}, 'json').promise();
            },
            openGiftPackagePanel: function () {
                if (Live.giftpackage.packagePanel.css('display') != 'none') return;
                Live.giftpackage.getGiftPackage().then(function (result) {
                    Live.giftpackage.giftPackageMap = Live.giftpackage.sortGifts(result.data);
                    Live.giftpackage.initGiftsDOM(Live.giftpackage.giftPackageMap);
                    Live.giftpackage.packagePanel.show();
                });
                setTimeout(function () {
                    $(document).on("click", Live.giftpackage.closeGiftPackagePanel);
                }, 1);
            },
            closeGiftPackagePanel: function (t) {
                var e = t && (t.target || t.srcElement)
                if (!$(e).hasClass('gifts-package-panel') && !$(e).parents('.gifts-package-panel').length)
                    Live.giftpackage.packagePanel.hide(0, function () {
                        Live.giftpackage.panelStatus = false;
                        $(document).off("click", Live.giftpackage.closeGiftPackagePanel);
                    });
            }
        };
        Live.helperInfo = {
            setStatus: function (dom, className, statusClass) {
                if (dom.hasClass(statusClass)) return;
                else dom.attr('class', className).addClass(statusClass);
            },
            setWatcherStatus: function (statusClass, title) {
                Live.helperInfo.setStatus(Live.watcherBtn, 'watcher-info', statusClass);
                Live.watcherBtn.find('span').attr('title', title);
                Live.watcher.updateReward('tv');
                Live.watcher.updateReward('lottery');
            },
            setTreasureStatus: function (statusClass, title) {
                Live.helperInfo.setStatus(Live.treasureBtn, 'treasure-info', statusClass);
                Live.treasureBtn.find('span').attr('title', title);
            },
            initPanel: function () {
                var headPanel = $('#head-info-panel');
                var anchor = headPanel.find('.anchor-avatar');
                var infoPanel = headPanel.find('.info-ctnr');
                var roomInfo = infoPanel.find('.room-info');
                var roomControl = infoPanel.find('room-ctrl');
                var upLevel = infoPanel.find('.anchor-info-row .master-info');
                var roomTitleRow = roomInfo.find('.room-title-row');

                /*up more btn & panel*/
                var helperAnchorInfoBtn = $('<span />').addClass('helper-anchor-info-btn').text('??????');
                var helperAnchorInfoPanel = Live.createPanel(roomTitleRow, helperAnchorInfoBtn, 'click', 'helper-anchor-info-panel', 'helperAnchorInfoPanel');
                var area = roomInfo.find('.room-info.v-top:eq(0)');
                var tags = roomInfo.find('.room-info.v-top:eq(1)');
                var manage = roomInfo.find('.room-manage');
                var report = roomTitleRow.find('.report-link[href]');
                var share = roomTitleRow.find('.share-link');
                setTimeout(function () {
                    roomTitleRow.find('.report-link:not([href])').hide();
                }, 1000);
                helperAnchorInfoPanel.append(area, tags, manage, report, share);


                /*helper info panel*/
                Live.helperInfoRow = $('<div />').addClass('helper-info-panel').attr('id', 'helperInfoPanel');
                infoPanel.find('.room-info.float-left').append(Live.helperInfoRow);
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'watcher'
                }, function (res) {
                    if (res['value'] == 'on') {
                        Live.watcherBtn = $('<div />').addClass('watcher-info').html('<i class="watcher-info-icon" style="background-image:url(' + chrome.extension.getURL('imgs/icon.png') + ')"></i><span class="watcher-info-text">????????????</span>');
                        Live.helperInfoRow.append(Live.watcherBtn);
                        Live.watcherPanel = Live.createPanel(Live.helperInfoRow, Live.watcherBtn, 'click', 'watcher-info-panel', 'watcherInfoPanel', function () {
                            Live.watcher.updateReward('tv');
                            Live.watcher.updateReward('lottery');
                        });
                    }
                });
                chrome.extension.sendMessage({
                    command: "getOption",
                    key: 'autoTreasure'
                }, function (res) {
                    if (res['value'] == 'on') {
                        Live.treasureBtn = $('<div />').addClass('treasure-info').html('<i class="treasure-info-icon" style="background-image:url(' + chrome.extension.getURL('imgs/icon.png') + ')"></i><span class="treasure-info-text">???????????????</span>');
                        Live.helperInfoRow.append(Live.treasureBtn);
                        // Live.treasurePanel = Live.createPanel(Live.treasureBtn, 'click', 'treasure-info-panel', 'treasureInfoPanel');
                        // Live.treasureBtn.append(Live.treasurePanel);
                    }
                });

            }
        };
        Live.init = {
            do: function () {
                Live.init.localStorage();
                Live.init.userInfo(function () {
                    if (store.get('bilibili_helper_login', 'login')) {
                        // Live.bilibiliHelperInfoDOM = $('<div class="room-info bilibili-helper-info"></div>');
                        // $('.left-part.player-area').prepend(Live.bilibiliHelperInfoDOM);
                        if (location.pathname.substr(1) && !isNaN(location.pathname.substr(1))) {
                            /*get options*/
                            chrome.extension.sendMessage({
                                command: "getOption",
                                key: 'version',
                            }, function (response) {
                                Live.version = response.value;
                                var version = store.get('bilibili_helper_version');
                                if (!version || version != Live.version) store.set('bilibili_helper_version', Live.version);
                                $('#gift-panel').find('.control-panel').prepend("<div class=\"ctrl-item version\">?????????????????? v" + Live.version + " by <a href=\"http://weibo.com/guguke\" target=\"_blank\">@?????????www</a> <a href=\"http://weibo.com/ruo0037\" target=\"_blank\">@??????????????????</a></div>");
                                Live.init.style();
                                Live.init.medal();

                                Live.addScriptByText('(function(){if (location.pathname.substr(1) && !isNaN(location.pathname.substr(1))) {var a=function(f,d,c){if(!window.localStorage||!f){return}var e=window.localStorage;if(!e[f]){e[f]=JSON.stringify({})}var b=JSON.parse(e[f]);if(c==undefined){e[f]=typeof d=="string"?d.trim():JSON.stringify(d)}else{b[d]=typeof c=="string"?c.trim():JSON.stringify(c);e[f]=JSON.stringify(b)}};a("bilibili_helper_live_roomId",ROOMURL,ROOMID);a("bilibili_helper_live_danmu_rnd",ROOMURL,DANMU_RND);}})();');
                                Live.roomId = Live.getRoomId();
                                Live.getRoomInfo().done(function (data) {
                                    Live.init.giftList();
                                    Live.roomInfo = data.data;
                                    Live.roomInfo.roomShortId = location.pathname.substr(1);
                                    Live.helperInfo.initPanel();

                                    /*function init*/
                                    setTimeout(function () {
                                        if (Live.mobileVerified) {
                                            Live.doSign.init();
                                            Live.chat.init();
                                            Live.notise.init();
                                            Live.giftpackage.init();
                                            Live.bet.init();
                                            // Live.beat.init();
                                        }
                                        Live.treasure.init();
                                        Live.watcher.init(function () {
                                            Live.addScriptByFile('live-content-script.min.js', Live.scriptOptions);
                                        });
                                        Live.helperInfoRow.css('opacity', 1);
                                    }, 2500);
                                    Notification.requestPermission();
                                });
                            });


                            // if (autoMode[Live.roomId] == true) Live.bet.init();
                        }
                    }
                });
            },
            style: function () {
                //init stylesheet
                var l = $('document').find('#bilibiliHelperLive');
                if (l.length) l.remove();
                var styleLink = document.createElement("link");
                styleLink.setAttribute("id", 'bilibiliHelperLive');
                styleLink.setAttribute("type", "text/css");
                styleLink.setAttribute("rel", "stylesheet");
                styleLink.setAttribute('href', chrome.extension.getURL('live.min.css'));
                if (document.head) document.head.appendChild(styleLink);
                else document.documentElement.appendChild(styleLink);
            },
            giftList: function () {
                var giftsDom = $('.gifts-ctnr .gift-item[role=listitem]');
                if (giftsDom.length > 0)
                    for (var i = 0; i < giftsDom.length; ++i) {
                        var gift = $(giftsDom[i]);
                        var giftId = gift.attr('data-gift-id');
                        if (!isNaN(parseInt(giftId))) Live.giftList[giftId] = {
                            title: gift.attr('data-title'),
                            type: gift.attr('data-type'),
                            description: gift.attr('data-desc')
                        };
                    }
            },
            clearLocalStorage: function () {
                store.delete('bilibili_helper_quiz_bet', Live.roomId);
                store.delete('bilibili_helper_quiz_check', Live.roomId);
                store.delete('bilibili_helper_quiz_number', Live.roomId);
                store.delete('bilibili_helper_quiz_rate', Live.roomId);
                store.delete('bilibili_helper_quiz_which', Live.roomId);
                store.delete('bilibili_helper_doSign');
                store.delete('bilibili_helper_userInfo');
            },
            localStorage: function () {
                Live.init.clearLocalStorage();
                /*install init*/
                if (store.has('bilibili_helper_init')) Live.hasInit = true;
                else store.set('bilibili_helper_init', true);
                if (!store.has('bilibili_helper_live_roomId')) store.set('bilibili_helper_live_roomId', {});

                /*sign*/
                !store.has('bilibili_helper_doSign') && store.set('bilibili_helper_doSign', {});
                !store.has('bilibili_helper_userInfo') && store.set('bilibili_helper_userInfo', {});

                /*treasure*/
                !store.has('bilibili_helper_treasure_silver_count') && store.set('bilibili_helper_treasure_silver_count', 0);

                /*chat*/
                !store.has('bilibili_helper_chat_display') && store.set('bilibili_helper_chat_display', {});

                /*small tv*/
                !store.has('bilibili_helper_tvs_count') && store.set('bilibili_helper_tvs_count', 0);
                !store.has('bilibili_helper_tvs_reward') && store.set('bilibili_helper_tvs_reward', {});

                /*lottery*/
                !store.has('bilibili_helper_lottery_count') && store.set('bilibili_helper_lottery_count', 0);
                !store.has('bilibili_helper_lottery_reward') && store.set('bilibili_helper_lottery_reward', {});
                !store.has('bilibili_helper_lottery_reward_list') && store.set('bilibili_helper_lottery_reward_list', {});

                /*bet*/
                !store.has('bilibili_helper_quiz_autoMode') && store.set('bilibili_helper_quiz_autoMode', {});
                !store.has('bilibili_helper_quiz_check') && store.set('bilibili_helper_quiz_check', {});
                !store.has('bilibili_helper_quiz_bet') && store.set('bilibili_helper_quiz_bet', {});
                !store.has('bilibili_helper_quiz_rate') && store.set('bilibili_helper_quiz_rate', {});
                !store.has('bilibili_helper_quiz_number') && store.set('bilibili_helper_quiz_number', {});
                !store.has('bilibili_helper_quiz_which') && store.set('bilibili_helper_quiz_which', {});

                /*beat*/
                // !store.has('bilibili_helper_beat_history') && store.set('bilibili_helper_beat_history', {});
                !store.has('bilibili_helper_beat_roomList') && store.set('bilibili_helper_beat_roomList', []);

                // var tv_reward = store.get('bilibili_helper_tvs_reward');
                // var tv_count = store.get('bilibili_helper_tvs_count');
                // Live.addScriptByText('(function(){window.localStorage.clear();})();');
                // store.set('bilibili_helper_version', Live.version);
                // store.set('bilibili_helper_tvs_reward', tv_reward);
                // store.set('bilibili_helper_tvs_count', tv_count);
            },
            userInfo: function (callback) {
                return Live.getUser().done(function (user) {
                    if (user.code == 'REPONSE_OK') {
                        var user = user.data;
                        Live.user = user;
                        store.set('bilibili_helper_userInfo', {
                            username: user.uname,
                            userLevel: user.user_level,
                            silver: user.silver,
                            gold: user.gold,
                            face: user.face,
                            vip: user.vip,
                            svip: user.svip,
                            billCoin: user.billCoin,
                            rank: user.user_level_rank
                        });
                        store.set('bilibili_helper_login', true);
                        $.ajax({
                            dataType: 'json',
                            url: 'http://space.bilibili.com/ajax/member/MyInfo'
                        }).promise().done(function (res) {
                            if (res.data && res.data.mobile_verified == 1) {
                                Live.mobileVerified = 1;
                            } else {
                                Live.mobileVerified = 0;
                                console.log('?????????????????????????????????????????????');
                            }
                            if (callback && typeof callback == 'function') callback(user);
                        });
                    } else if (user.code == -101) store.remove('bilibili_helper_userInfo');
                });
            },
            medal: function () {
                Live.getMedalList().done(function (medalList) {
                    $.get('http://live.bilibili.com/i/medal').promise().done(function (html) {
                        var medalDOM = $(html);
                        var medalDOMList = medalDOM.find('.my-medal-section dl dd');
                        if (medalList.code == 0) {
                            medalList = medalList.data;
                            Live.medalList = medalList;
                            var length = medalList.length;
                            for (var i = 0; i < length; ++i) {
                                Live.medalList[i].rank = parseInt($(medalDOMList[i]).find('.col-4').text());
                                var medal = medalList[i];
                                if (medal.medalId == 4765) {
                                    Live.hasBBQ = true;
                                    Live.BBQ = medal;
                                } else Live.hasBBQ = false;
                            }
                        }
                    });

                });
            }
        };
        Live.init.do();
    }
})();
