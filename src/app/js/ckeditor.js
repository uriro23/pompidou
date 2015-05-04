﻿/*
 Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
 For licensing, see LICENSE.html or http://ckeditor.com/license
 */
(function () {
  if (window.CKEDITOR && window.CKEDITOR.dom)return;
  window.CKEDITOR || (window.CKEDITOR = function () {
    var a = {
      timestamp: "DAED",
      version: "4.3",
      revision: "d2184ac",
      rnd: Math.floor(900 * Math.random()) + 100,
      _: {pending: []},
      status: "unloaded",
      basePath: function () {
        var b = window.CKEDITOR_BASEPATH || "";
        if (!b)for (var e = document.getElementsByTagName("script"), a = 0; a < e.length; a++) {
          var d = e[a].src.match(/(^|.*[\\\/])ckeditor(?:_basic)?(?:_source)?.js(?:\?.*)?$/i);
          if (d) {
            b = d[1];
            break
          }
        }
        -1 == b.indexOf(":/") && (b = 0 === b.indexOf("/") ? location.href.match(/^.*?:\/\/[^\/]*/)[0] + b : location.href.match(/^[^\?]*\/(?:)/)[0] +
        b);
        if (!b)throw'The CKEditor installation path could not be automatically detected. Please set the global variable "CKEDITOR_BASEPATH" before creating editor instances.';
        return b
      }(),
      getUrl: function (b) {
        -1 == b.indexOf(":/") && 0 !== b.indexOf("/") && (b = this.basePath + b);
        this.timestamp && ("/" != b.charAt(b.length - 1) && !/[&?]t=/.test(b)) && (b += (0 <= b.indexOf("?") ? "&" : "?") + "t=" + this.timestamp);
        return b
      },
      domReady: function () {
        function b() {
          try {
            document.addEventListener ? (document.removeEventListener("DOMContentLoaded", b,
              !1), e()) : document.attachEvent && "complete" === document.readyState && (document.detachEvent("onreadystatechange", b), e())
          } catch (a) {
          }
        }

        function e() {
          for (var e; e = a.shift();)e()
        }

        var a = [];
        return function (e) {
          a.push(e);
          "complete" === document.readyState && setTimeout(b, 1);
          if (1 == a.length)if (document.addEventListener)document.addEventListener("DOMContentLoaded", b, !1), window.addEventListener("load", b, !1); else if (document.attachEvent) {
            document.attachEvent("onreadystatechange", b);
            window.attachEvent("onload", b);
            e = !1;
            try {
              e = !window.frameElement
            } catch (d) {
            }
            if (document.documentElement.doScroll && e) {
              var j = function () {
                try {
                  document.documentElement.doScroll("left")
                } catch (e) {
                  setTimeout(j, 1);
                  return
                }
                b()
              };
              j()
            }
          }
        }
      }()
    }, d = window.CKEDITOR_GETURL;
    if (d) {
      var b = a.getUrl;
      a.getUrl = function (c) {
        return d.call(a, c) || b.call(a, c)
      }
    }
    return a
  }());
  CKEDITOR.event || (CKEDITOR.event = function () {
  }, CKEDITOR.event.implementOn = function (a) {
    var d = CKEDITOR.event.prototype, b;
    for (b in d)a[b] == void 0 && (a[b] = d[b])
  }, CKEDITOR.event.prototype = function () {
    function a(a) {
      var e = d(this);
      return e[a] || (e[a] = new b(a))
    }

    var d = function (b) {
      b = b.getPrivate && b.getPrivate() || b._ || (b._ = {});
      return b.events || (b.events = {})
    }, b = function (b) {
      this.name = b;
      this.listeners = []
    };
    b.prototype = {
      getListenerIndex: function (b) {
        for (var e = 0, a = this.listeners; e < a.length; e++)if (a[e].fn == b)return e;
        return -1
      }
    };
    return {
      define: function (b, e) {
        var f = a.call(this, b);
        CKEDITOR.tools.extend(f, e, true)
      }, on: function (b, e, f, d, n) {
        function j(a, g, l, u) {
          a = {name: b, sender: this, editor: a, data: g, listenerData: d, stop: l, cancel: u, removeListener: k};
          return e.call(f, a) === false ? false : a.data
        }

        function k() {
          u.removeListener(b, e)
        }

        var l = a.call(this, b);
        if (l.getListenerIndex(e) < 0) {
          l = l.listeners;
          f || (f = this);
          isNaN(n) && (n = 10);
          var u = this;
          j.fn = e;
          j.priority = n;
          for (var s = l.length - 1; s >= 0; s--)if (l[s].priority <= n) {
            l.splice(s + 1, 0, j);
            return {removeListener: k}
          }
          l.unshift(j)
        }
        return {removeListener: k}
      },
      once: function () {
        var b = arguments[1];
        arguments[1] = function (e) {
          e.removeListener();
          return b.apply(this, arguments)
        };
        return this.on.apply(this, arguments)
      }, capture: function () {
        CKEDITOR.event.useCapture = 1;
        var b = this.on.apply(this, arguments);
        CKEDITOR.event.useCapture = 0;
        return b
      }, fire: function () {
        var b = 0, e = function () {
          b = 1
        }, a = 0, h = function () {
          a = 1
        };
        return function (n, j, k) {
          var l = d(this)[n], n = b, u = a;
          b = a = 0;
          if (l) {
            var s = l.listeners;
            if (s.length)for (var s = s.slice(0), t, g = 0; g < s.length; g++) {
              if (l.errorProof)try {
                t = s[g].call(this,
                  k, j, e, h)
              } catch (r) {
              } else t = s[g].call(this, k, j, e, h);
              t === false ? a = 1 : typeof t != "undefined" && (j = t);
              if (b || a)break
            }
          }
          j = a ? false : typeof j == "undefined" ? true : j;
          b = n;
          a = u;
          return j
        }
      }(), fireOnce: function (b, e, a) {
        e = this.fire(b, e, a);
        delete d(this)[b];
        return e
      }, removeListener: function (b, e) {
        var a = d(this)[b];
        if (a) {
          var h = a.getListenerIndex(e);
          h >= 0 && a.listeners.splice(h, 1)
        }
      }, removeAllListeners: function () {
        var b = d(this), e;
        for (e in b)delete b[e]
      }, hasListeners: function (b) {
        return (b = d(this)[b]) && b.listeners.length > 0
      }
    }
  }());
  CKEDITOR.editor || (CKEDITOR.editor = function () {
    CKEDITOR._.pending.push([this, arguments]);
    CKEDITOR.event.call(this)
  }, CKEDITOR.editor.prototype.fire = function (a, d) {
    a in{instanceReady: 1, loaded: 1} && (this[a] = true);
    return CKEDITOR.event.prototype.fire.call(this, a, d, this)
  }, CKEDITOR.editor.prototype.fireOnce = function (a, d) {
    a in{instanceReady: 1, loaded: 1} && (this[a] = true);
    return CKEDITOR.event.prototype.fireOnce.call(this, a, d, this)
  }, CKEDITOR.event.implementOn(CKEDITOR.editor.prototype));
  CKEDITOR.env || (CKEDITOR.env = function () {
    var a = navigator.userAgent.toLowerCase(), d = window.opera, b = {
      ie: a.indexOf("trident/") > -1,
      opera: !!d && d.version,
      webkit: a.indexOf(" applewebkit/") > -1,
      air: a.indexOf(" adobeair/") > -1,
      mac: a.indexOf("macintosh") > -1,
      quirks: document.compatMode == "BackCompat",
      mobile: a.indexOf("mobile") > -1,
      iOS: /(ipad|iphone|ipod)/.test(a),
      isCustomDomain: function () {
        if (!this.ie)return false;
        var e = document.domain, b = window.location.hostname;
        return e != b && e != "[" + b + "]"
      },
      secure: location.protocol ==
      "https:"
    };
    b.gecko = navigator.product == "Gecko" && !b.webkit && !b.opera && !b.ie;
    if (b.webkit)a.indexOf("chrome") > -1 ? b.chrome = true : b.safari = true;
    var c = 0;
    if (b.ie) {
      c = b.quirks || !document.documentMode ? parseFloat(a.match(/msie (\d+)/)[1]) : document.documentMode;
      b.ie9Compat = c == 9;
      b.ie8Compat = c == 8;
      b.ie7Compat = c == 7;
      b.ie6Compat = c < 7 || b.quirks && c < 10
    }
    if (b.gecko) {
      var e = a.match(/rv:([\d\.]+)/);
      if (e) {
        e = e[1].split(".");
        c = e[0] * 1E4 + (e[1] || 0) * 100 + (e[2] || 0) * 1
      }
    }
    b.opera && (c = parseFloat(d.version()));
    b.air && (c = parseFloat(a.match(/ adobeair\/(\d+)/)[1]));
    b.webkit && (c = parseFloat(a.match(/ applewebkit\/(\d+)/)[1]));
    b.version = c;
    b.isCompatible = b.iOS && c >= 534 || !b.mobile && (b.ie && c > 6 || b.gecko && c >= 10801 || b.opera && c >= 9.5 || b.air && c >= 1 || b.webkit && c >= 522 || false);
    b.hidpi = window.devicePixelRatio >= 2;
    b.needsBrFiller = b.gecko || b.webkit || b.ie && c > 10;
    b.needsNbspFiller = b.ie && c < 11;
    b.cssClass = "cke_browser_" + (b.ie ? "ie" : b.gecko ? "gecko" : b.opera ? "opera" : b.webkit ? "webkit" : "unknown");
    if (b.quirks)b.cssClass = b.cssClass + " cke_browser_quirks";
    if (b.ie) {
      b.cssClass = b.cssClass + (" cke_browser_ie" +
        (b.quirks || b.version < 7 ? "6" : b.version));
      if (b.quirks)b.cssClass = b.cssClass + " cke_browser_iequirks"
    }
    if (b.gecko)if (c < 10900)b.cssClass = b.cssClass + " cke_browser_gecko18"; else if (c <= 11E3)b.cssClass = b.cssClass + " cke_browser_gecko19";
    if (b.air)b.cssClass = b.cssClass + " cke_browser_air";
    if (b.iOS)b.cssClass = b.cssClass + " cke_browser_ios";
    if (b.hidpi)b.cssClass = b.cssClass + " cke_hidpi";
    return b
  }());
  "unloaded" == CKEDITOR.status && function () {
    CKEDITOR.event.implementOn(CKEDITOR);
    CKEDITOR.loadFullCore = function () {
      if (CKEDITOR.status != "basic_ready")CKEDITOR.loadFullCore._load = 1; else {
        delete CKEDITOR.loadFullCore;
        var a = document.createElement("script");
        a.type = "text/javascript";
        a.src = CKEDITOR.basePath + "ckeditor.js";
        document.getElementsByTagName("head")[0].appendChild(a)
      }
    };
    CKEDITOR.loadFullCoreTimeout = 0;
    CKEDITOR.add = function (a) {
      (this._.pending || (this._.pending = [])).push(a)
    };
    (function () {
      CKEDITOR.domReady(function () {
        var a =
          CKEDITOR.loadFullCore, d = CKEDITOR.loadFullCoreTimeout;
        if (a) {
          CKEDITOR.status = "basic_ready";
          a && a._load ? a() : d && setTimeout(function () {
            CKEDITOR.loadFullCore && CKEDITOR.loadFullCore()
          }, d * 1E3)
        }
      })
    })();
    CKEDITOR.status = "basic_loaded"
  }();
  CKEDITOR.dom = {};
  (function () {
    var a = [], d = CKEDITOR.env.gecko ? "-moz-" : CKEDITOR.env.webkit ? "-webkit-" : CKEDITOR.env.opera ? "-o-" : CKEDITOR.env.ie ? "-ms-" : "";
    CKEDITOR.on("reset", function () {
      a = []
    });
    CKEDITOR.tools = {
      arrayCompare: function (b, a) {
        if (!b && !a)return true;
        if (!b || !a || b.length != a.length)return false;
        for (var e = 0; e < b.length; e++)if (b[e] != a[e])return false;
        return true
      }, clone: function (b) {
        var a;
        if (b && b instanceof Array) {
          a = [];
          for (var e = 0; e < b.length; e++)a[e] = CKEDITOR.tools.clone(b[e]);
          return a
        }
        if (b === null || typeof b != "object" ||
          b instanceof String || b instanceof Number || b instanceof Boolean || b instanceof Date || b instanceof RegExp)return b;
        a = new b.constructor;
        for (e in b)a[e] = CKEDITOR.tools.clone(b[e]);
        return a
      }, capitalize: function (b, a) {
        return b.charAt(0).toUpperCase() + (a ? b.slice(1) : b.slice(1).toLowerCase())
      }, extend: function (b) {
        var a = arguments.length, e, f;
        if (typeof(e = arguments[a - 1]) == "boolean")a--; else if (typeof(e = arguments[a - 2]) == "boolean") {
          f = arguments[a - 1];
          a = a - 2
        }
        for (var d = 1; d < a; d++) {
          var n = arguments[d], j;
          for (j in n)if (e ===
            true || b[j] == void 0)if (!f || j in f)b[j] = n[j]
        }
        return b
      }, prototypedCopy: function (b) {
        var a = function () {
        };
        a.prototype = b;
        return new a
      }, copy: function (b) {
        var a = {}, e;
        for (e in b)a[e] = b[e];
        return a
      }, isArray: function (b) {
        return Object.prototype.toString.call(b) == "[object Array]"
      }, isEmpty: function (b) {
        for (var a in b)if (b.hasOwnProperty(a))return false;
        return true
      }, cssVendorPrefix: function (b, a, e) {
        if (e)return d + b + ":" + a + ";" + b + ":" + a;
        e = {};
        e[b] = a;
        e[d + b] = a;
        return e
      }, cssStyleToDomStyle: function () {
        var b = document.createElement("div").style,
          a = typeof b.cssFloat != "undefined" ? "cssFloat" : typeof b.styleFloat != "undefined" ? "styleFloat" : "float";
        return function (e) {
          return e == "float" ? a : e.replace(/-./g, function (e) {
            return e.substr(1).toUpperCase()
          })
        }
      }(), buildStyleHtml: function (b) {
        for (var b = [].concat(b), a, e = [], f = 0; f < b.length; f++)if (a = b[f])/@import|[{}]/.test(a) ? e.push("<style>" + a + "</style>") : e.push('<link type="text/css" rel=stylesheet href="' + a + '">');
        return e.join("")
      }, htmlEncode: function (b) {
        return ("" + b).replace(/&/g, "&amp;").replace(/>/g, "&gt;").replace(/</g,
          "&lt;")
      }, htmlEncodeAttr: function (b) {
        return b.replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      }, htmlDecodeAttr: function (b) {
        return b.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      }, getNextNumber: function () {
        var b = 0;
        return function () {
          return ++b
        }
      }(), getNextId: function () {
        return "cke_" + this.getNextNumber()
      }, override: function (b, a) {
        var e = a(b);
        e.prototype = b.prototype;
        return e
      }, setTimeout: function (b, a, e, f, d) {
        d || (d = window);
        e || (e = d);
        return d.setTimeout(function () {
          f ? b.apply(e, [].concat(f)) :
            b.apply(e)
        }, a || 0)
      }, trim: function () {
        var b = /(?:^[ \t\n\r]+)|(?:[ \t\n\r]+$)/g;
        return function (a) {
          return a.replace(b, "")
        }
      }(), ltrim: function () {
        var b = /^[ \t\n\r]+/g;
        return function (a) {
          return a.replace(b, "")
        }
      }(), rtrim: function () {
        var b = /[ \t\n\r]+$/g;
        return function (a) {
          return a.replace(b, "")
        }
      }(), indexOf: function (b, a) {
        if (typeof a == "function")for (var e = 0, f = b.length; e < f; e++) {
          if (a(b[e]))return e
        } else {
          if (b.indexOf)return b.indexOf(a);
          e = 0;
          for (f = b.length; e < f; e++)if (b[e] === a)return e
        }
        return -1
      }, search: function (b,
                           a) {
        var e = CKEDITOR.tools.indexOf(b, a);
        return e >= 0 ? b[e] : null
      }, bind: function (b, a) {
        return function () {
          return b.apply(a, arguments)
        }
      }, createClass: function (b) {
        var a = b.$, e = b.base, f = b.privates || b._, d = b.proto, b = b.statics;
        !a && (a = function () {
          e && this.base.apply(this, arguments)
        });
        if (f)var n = a, a = function () {
          var e = this._ || (this._ = {}), a;
          for (a in f) {
            var b = f[a];
            e[a] = typeof b == "function" ? CKEDITOR.tools.bind(b, this) : b
          }
          n.apply(this, arguments)
        };
        if (e) {
          a.prototype = this.prototypedCopy(e.prototype);
          a.prototype.constructor = a;
          a.base =
            e;
          a.baseProto = e.prototype;
          a.prototype.base = function () {
            this.base = e.prototype.base;
            e.apply(this, arguments);
            this.base = arguments.callee
          }
        }
        d && this.extend(a.prototype, d, true);
        b && this.extend(a, b, true);
        return a
      }, addFunction: function (b, c) {
        return a.push(function () {
            return b.apply(c || this, arguments)
          }) - 1
      }, removeFunction: function (b) {
        a[b] = null
      }, callFunction: function (b) {
        var c = a[b];
        return c && c.apply(window, Array.prototype.slice.call(arguments, 1))
      }, cssLength: function () {
        var a = /^-?\d+\.?\d*px$/, c;
        return function (e) {
          c =
            CKEDITOR.tools.trim(e + "") + "px";
          return a.test(c) ? c : e || ""
        }
      }(), convertToPx: function () {
        var a;
        return function (c) {
          if (!a) {
            a = CKEDITOR.dom.element.createFromHtml('<div style="position:absolute;left:-9999px;top:-9999px;margin:0px;padding:0px;border:0px;"></div>', CKEDITOR.document);
            CKEDITOR.document.getBody().append(a)
          }
          if (!/%$/.test(c)) {
            a.setStyle("width", c);
            return a.$.clientWidth
          }
          return c
        }
      }(), repeat: function (a, c) {
        return Array(c + 1).join(a)
      }, tryThese: function () {
        for (var a, c = 0, e = arguments.length; c < e; c++) {
          var f =
            arguments[c];
          try {
            a = f();
            break
          } catch (d) {
          }
        }
        return a
      }, genKey: function () {
        return Array.prototype.slice.call(arguments).join("-")
      }, defer: function (a) {
        return function () {
          var c = arguments, e = this;
          window.setTimeout(function () {
            a.apply(e, c)
          }, 0)
        }
      }, normalizeCssText: function (a, c) {
        var e = [], f, d = CKEDITOR.tools.parseCssText(a, true, c);
        for (f in d)e.push(f + ":" + d[f]);
        e.sort();
        return e.length ? e.join(";") + ";" : ""
      }, convertRgbToHex: function (a) {
        return a.replace(/(?:rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\))/gi, function (a, e, b, d) {
          a =
            [e, b, d];
          for (e = 0; e < 3; e++)a[e] = ("0" + parseInt(a[e], 10).toString(16)).slice(-2);
          return "#" + a.join("")
        })
      }, parseCssText: function (a, c, e) {
        var f = {};
        if (e) {
          e = new CKEDITOR.dom.element("span");
          e.setAttribute("style", a);
          a = CKEDITOR.tools.convertRgbToHex(e.getAttribute("style") || "")
        }
        if (!a || a == ";")return f;
        a.replace(/&quot;/g, '"').replace(/\s*([^:;\s]+)\s*:\s*([^;]+)\s*(?=;|$)/g, function (a, e, b) {
          if (c) {
            e = e.toLowerCase();
            e == "font-family" && (b = b.toLowerCase().replace(/["']/g, "").replace(/\s*,\s*/g, ","));
            b = CKEDITOR.tools.trim(b)
          }
          f[e] =
            b
        });
        return f
      }, writeCssText: function (a, c) {
        var e, f = [];
        for (e in a)f.push(e + ":" + a[e]);
        c && f.sort();
        return f.join("; ")
      }, objectCompare: function (a, c, e) {
        var f;
        if (!a && !c)return true;
        if (!a || !c)return false;
        for (f in a)if (a[f] != c[f])return false;
        if (!e)for (f in c)if (a[f] != c[f])return false;
        return true
      }, objectKeys: function (a) {
        var c = [], e;
        for (e in a)c.push(e);
        return c
      }, convertArrayToObject: function (a, c) {
        var e = {};
        arguments.length == 1 && (c = true);
        for (var f = 0, d = a.length; f < d; ++f)e[a[f]] = c;
        return e
      }, fixDomain: function () {
        for (var a; ;)try {
          a =
            window.parent.document.domain;
          break
        } catch (c) {
          a = a ? a.replace(/.+?(?:\.|$)/, "") : document.domain;
          if (!a)break;
          document.domain = a
        }
        return !!a
      }, eventsBuffer: function (a, c) {
        function e() {
          d = (new Date).getTime();
          f = false;
          c()
        }

        var f, d = 0;
        return {
          input: function () {
            if (!f) {
              var c = (new Date).getTime() - d;
              c < a ? f = setTimeout(e, a - c) : e()
            }
          }, reset: function () {
            f && clearTimeout(f);
            f = d = 0
          }
        }
      }, enableHtml5Elements: function (a, c) {
        for (var e = ["abbr", "article", "aside", "audio", "bdi", "canvas", "data", "datalist", "details", "figcaption", "figure", "footer",
          "header", "hgroup", "mark", "meter", "nav", "output", "progress", "section", "summary", "time", "video"], f = e.length, d; f--;) {
          d = a.createElement(e[f]);
          c && a.appendChild(d)
        }
      }
    }
  })();
  CKEDITOR.dtd = function () {
    var a = CKEDITOR.tools.extend, d = function (a, e) {
      for (var b = CKEDITOR.tools.clone(a), f = 1; f < arguments.length; f++) {
        var e = arguments[f], c;
        for (c in e)delete b[c]
      }
      return b
    }, b = {}, c = {}, e = {
      address: 1,
      article: 1,
      aside: 1,
      blockquote: 1,
      details: 1,
      div: 1,
      dl: 1,
      fieldset: 1,
      figure: 1,
      footer: 1,
      form: 1,
      h1: 1,
      h2: 1,
      h3: 1,
      h4: 1,
      h5: 1,
      h6: 1,
      header: 1,
      hgroup: 1,
      hr: 1,
      menu: 1,
      nav: 1,
      ol: 1,
      p: 1,
      pre: 1,
      section: 1,
      table: 1,
      ul: 1
    }, f = {command: 1, link: 1, meta: 1, noscript: 1, script: 1, style: 1}, h = {}, n = {"#": 1}, j = {
      center: 1,
      dir: 1,
      noframes: 1
    };
    a(b, {
      a: 1,
      abbr: 1,
      area: 1,
      audio: 1,
      b: 1,
      bdi: 1,
      bdo: 1,
      br: 1,
      button: 1,
      canvas: 1,
      cite: 1,
      code: 1,
      command: 1,
      datalist: 1,
      del: 1,
      dfn: 1,
      em: 1,
      embed: 1,
      i: 1,
      iframe: 1,
      img: 1,
      input: 1,
      ins: 1,
      kbd: 1,
      keygen: 1,
      label: 1,
      map: 1,
      mark: 1,
      meter: 1,
      noscript: 1,
      object: 1,
      output: 1,
      progress: 1,
      q: 1,
      ruby: 1,
      s: 1,
      samp: 1,
      script: 1,
      select: 1,
      small: 1,
      span: 1,
      strong: 1,
      sub: 1,
      sup: 1,
      textarea: 1,
      time: 1,
      u: 1,
      "var": 1,
      video: 1,
      wbr: 1
    }, n, {acronym: 1, applet: 1, basefont: 1, big: 1, font: 1, isindex: 1, strike: 1, style: 1, tt: 1});
    a(c, e, b, j);
    d = {
      a: d(b, {a: 1, button: 1}),
      abbr: b,
      address: c,
      area: h,
      article: a({style: 1}, c),
      aside: a({style: 1}, c),
      audio: a({source: 1, track: 1}, c),
      b: b,
      base: h,
      bdi: b,
      bdo: b,
      blockquote: c,
      body: c,
      br: h,
      button: d(b, {a: 1, button: 1}),
      canvas: b,
      caption: c,
      cite: b,
      code: b,
      col: h,
      colgroup: {col: 1},
      command: h,
      datalist: a({option: 1}, b),
      dd: c,
      del: b,
      details: a({summary: 1}, c),
      dfn: b,
      div: a({style: 1}, c),
      dl: {dt: 1, dd: 1},
      dt: c,
      em: b,
      embed: h,
      fieldset: a({legend: 1}, c),
      figcaption: c,
      figure: a({figcaption: 1}, c),
      footer: c,
      form: c,
      h1: b,
      h2: b,
      h3: b,
      h4: b,
      h5: b,
      h6: b,
      head: a({title: 1, base: 1}, f),
      header: c,
      hgroup: {
        h1: 1,
        h2: 1, h3: 1, h4: 1, h5: 1, h6: 1
      },
      hr: h,
      html: a({head: 1, body: 1}, c, f),
      i: b,
      iframe: n,
      img: h,
      input: h,
      ins: b,
      kbd: b,
      keygen: h,
      label: b,
      legend: b,
      li: c,
      link: h,
      map: c,
      mark: b,
      menu: a({li: 1}, c),
      meta: h,
      meter: d(b, {meter: 1}),
      nav: c,
      noscript: a({link: 1, meta: 1, style: 1}, b),
      object: a({param: 1}, b),
      ol: {li: 1},
      optgroup: {option: 1},
      option: n,
      output: b,
      p: b,
      param: h,
      pre: b,
      progress: d(b, {progress: 1}),
      q: b,
      rp: b,
      rt: b,
      ruby: a({rp: 1, rt: 1}, b),
      s: b,
      samp: b,
      script: n,
      section: a({style: 1}, c),
      select: {optgroup: 1, option: 1},
      small: b,
      source: h,
      span: b,
      strong: b,
      style: n,
      sub: b,
      summary: b,
      sup: b,
      table: {caption: 1, colgroup: 1, thead: 1, tfoot: 1, tbody: 1, tr: 1},
      tbody: {tr: 1},
      td: c,
      textarea: n,
      tfoot: {tr: 1},
      th: c,
      thead: {tr: 1},
      time: d(b, {time: 1}),
      title: n,
      tr: {th: 1, td: 1},
      track: h,
      u: b,
      ul: {li: 1},
      "var": b,
      video: a({source: 1, track: 1}, c),
      wbr: h,
      acronym: b,
      applet: a({param: 1}, c),
      basefont: h,
      big: b,
      center: c,
      dialog: h,
      dir: {li: 1},
      font: b,
      isindex: h,
      noframes: c,
      strike: b,
      tt: b
    };
    a(d, {
      $block: a({audio: 1, dd: 1, dt: 1, figcaption: 1, li: 1, video: 1}, e, j),
      $blockLimit: {
        article: 1,
        aside: 1,
        audio: 1,
        body: 1,
        caption: 1,
        details: 1,
        dir: 1,
        div: 1,
        dl: 1,
        fieldset: 1,
        figcaption: 1,
        figure: 1,
        footer: 1,
        form: 1,
        header: 1,
        hgroup: 1,
        menu: 1,
        nav: 1,
        ol: 1,
        section: 1,
        table: 1,
        td: 1,
        th: 1,
        tr: 1,
        ul: 1,
        video: 1
      },
      $cdata: {script: 1, style: 1},
      $editable: {
        address: 1,
        article: 1,
        aside: 1,
        blockquote: 1,
        body: 1,
        details: 1,
        div: 1,
        fieldset: 1,
        figcaption: 1,
        footer: 1,
        form: 1,
        h1: 1,
        h2: 1,
        h3: 1,
        h4: 1,
        h5: 1,
        h6: 1,
        header: 1,
        hgroup: 1,
        nav: 1,
        p: 1,
        pre: 1,
        section: 1
      },
      $empty: {
        area: 1,
        base: 1,
        basefont: 1,
        br: 1,
        col: 1,
        command: 1,
        dialog: 1,
        embed: 1,
        hr: 1,
        img: 1,
        input: 1,
        isindex: 1,
        keygen: 1,
        link: 1,
        meta: 1,
        param: 1,
        source: 1,
        track: 1,
        wbr: 1
      },
      $inline: b,
      $list: {dl: 1, ol: 1, ul: 1},
      $listItem: {dd: 1, dt: 1, li: 1},
      $nonBodyContent: a({body: 1, head: 1, html: 1}, d.head),
      $nonEditable: {
        applet: 1,
        audio: 1,
        button: 1,
        embed: 1,
        iframe: 1,
        map: 1,
        object: 1,
        option: 1,
        param: 1,
        script: 1,
        textarea: 1,
        video: 1
      },
      $object: {
        applet: 1,
        audio: 1,
        button: 1,
        hr: 1,
        iframe: 1,
        img: 1,
        input: 1,
        object: 1,
        select: 1,
        table: 1,
        textarea: 1,
        video: 1
      },
      $removeEmpty: {
        abbr: 1,
        acronym: 1,
        b: 1,
        bdi: 1,
        bdo: 1,
        big: 1,
        cite: 1,
        code: 1,
        del: 1,
        dfn: 1,
        em: 1,
        font: 1,
        i: 1,
        ins: 1,
        label: 1,
        kbd: 1,
        mark: 1,
        meter: 1,
        output: 1,
        q: 1,
        ruby: 1,
        s: 1,
        samp: 1,
        small: 1,
        span: 1,
        strike: 1,
        strong: 1,
        sub: 1,
        sup: 1,
        time: 1,
        tt: 1,
        u: 1,
        "var": 1
      },
      $tabIndex: {a: 1, area: 1, button: 1, input: 1, object: 1, select: 1, textarea: 1},
      $tableContent: {caption: 1, col: 1, colgroup: 1, tbody: 1, td: 1, tfoot: 1, th: 1, thead: 1, tr: 1},
      $transparent: {a: 1, audio: 1, canvas: 1, del: 1, ins: 1, map: 1, noscript: 1, object: 1, video: 1},
      $intermediate: {
        caption: 1,
        colgroup: 1,
        dd: 1,
        dt: 1,
        figcaption: 1,
        legend: 1,
        li: 1,
        optgroup: 1,
        option: 1,
        rp: 1,
        rt: 1,
        summary: 1,
        tbody: 1,
        td: 1,
        tfoot: 1,
        th: 1,
        thead: 1,
        tr: 1
      }
    });
    return d
  }();
  CKEDITOR.dom.event = function (a) {
    this.$ = a
  };
  CKEDITOR.dom.event.prototype = {
    getKey: function () {
      return this.$.keyCode || this.$.which
    }, getKeystroke: function () {
      var a = this.getKey();
      if (this.$.ctrlKey || this.$.metaKey)a = a + CKEDITOR.CTRL;
      this.$.shiftKey && (a = a + CKEDITOR.SHIFT);
      this.$.altKey && (a = a + CKEDITOR.ALT);
      return a
    }, preventDefault: function (a) {
      var d = this.$;
      d.preventDefault ? d.preventDefault() : d.returnValue = false;
      a && this.stopPropagation()
    }, stopPropagation: function () {
      var a = this.$;
      a.stopPropagation ? a.stopPropagation() : a.cancelBubble = true
    }, getTarget: function () {
      var a =
        this.$.target || this.$.srcElement;
      return a ? new CKEDITOR.dom.node(a) : null
    }, getPhase: function () {
      return this.$.eventPhase || 2
    }, getPageOffset: function () {
      var a = this.getTarget().getDocument().$;
      return {
        x: this.$.pageX || this.$.clientX + (a.documentElement.scrollLeft || a.body.scrollLeft),
        y: this.$.pageY || this.$.clientY + (a.documentElement.scrollTop || a.body.scrollTop)
      }
    }
  };
  CKEDITOR.CTRL = 1114112;
  CKEDITOR.SHIFT = 2228224;
  CKEDITOR.ALT = 4456448;
  CKEDITOR.EVENT_PHASE_CAPTURING = 1;
  CKEDITOR.EVENT_PHASE_AT_TARGET = 2;
  CKEDITOR.EVENT_PHASE_BUBBLING = 3;
  CKEDITOR.dom.domObject = function (a) {
    if (a)this.$ = a
  };
  CKEDITOR.dom.domObject.prototype = function () {
    var a = function (a, b) {
      return function (c) {
        typeof CKEDITOR != "undefined" && a.fire(b, new CKEDITOR.dom.event(c))
      }
    };
    return {
      getPrivate: function () {
        var a;
        if (!(a = this.getCustomData("_")))this.setCustomData("_", a = {});
        return a
      }, on: function (d) {
        var b = this.getCustomData("_cke_nativeListeners");
        if (!b) {
          b = {};
          this.setCustomData("_cke_nativeListeners", b)
        }
        if (!b[d]) {
          b = b[d] = a(this, d);
          this.$.addEventListener ? this.$.addEventListener(d, b, !!CKEDITOR.event.useCapture) : this.$.attachEvent &&
          this.$.attachEvent("on" + d, b)
        }
        return CKEDITOR.event.prototype.on.apply(this, arguments)
      }, removeListener: function (a) {
        CKEDITOR.event.prototype.removeListener.apply(this, arguments);
        if (!this.hasListeners(a)) {
          var b = this.getCustomData("_cke_nativeListeners"), c = b && b[a];
          if (c) {
            this.$.removeEventListener ? this.$.removeEventListener(a, c, false) : this.$.detachEvent && this.$.detachEvent("on" + a, c);
            delete b[a]
          }
        }
      }, removeAllListeners: function () {
        var a = this.getCustomData("_cke_nativeListeners"), b;
        for (b in a) {
          var c = a[b];
          this.$.detachEvent ?
            this.$.detachEvent("on" + b, c) : this.$.removeEventListener && this.$.removeEventListener(b, c, false);
          delete a[b]
        }
      }
    }
  }();
  (function (a) {
    var d = {};
    CKEDITOR.on("reset", function () {
      d = {}
    });
    a.equals = function (a) {
      try {
        return a && a.$ === this.$
      } catch (c) {
        return false
      }
    };
    a.setCustomData = function (a, c) {
      var e = this.getUniqueId();
      (d[e] || (d[e] = {}))[a] = c;
      return this
    };
    a.getCustomData = function (a) {
      var c = this.$["data-cke-expando"];
      return (c = c && d[c]) && a in c ? c[a] : null
    };
    a.removeCustomData = function (a) {
      var c = this.$["data-cke-expando"], c = c && d[c], e, f;
      if (c) {
        e = c[a];
        f = a in c;
        delete c[a]
      }
      return f ? e : null
    };
    a.clearCustomData = function () {
      this.removeAllListeners();
      var a = this.$["data-cke-expando"];
      a && delete d[a]
    };
    a.getUniqueId = function () {
      return this.$["data-cke-expando"] || (this.$["data-cke-expando"] = CKEDITOR.tools.getNextNumber())
    };
    CKEDITOR.event.implementOn(a)
  })(CKEDITOR.dom.domObject.prototype);
  CKEDITOR.dom.node = function (a) {
    return a ? new CKEDITOR.dom[a.nodeType == CKEDITOR.NODE_DOCUMENT ? "document" : a.nodeType == CKEDITOR.NODE_ELEMENT ? "element" : a.nodeType == CKEDITOR.NODE_TEXT ? "text" : a.nodeType == CKEDITOR.NODE_COMMENT ? "comment" : a.nodeType == CKEDITOR.NODE_DOCUMENT_FRAGMENT ? "documentFragment" : "domObject"](a) : this
  };
  CKEDITOR.dom.node.prototype = new CKEDITOR.dom.domObject;
  CKEDITOR.NODE_ELEMENT = 1;
  CKEDITOR.NODE_DOCUMENT = 9;
  CKEDITOR.NODE_TEXT = 3;
  CKEDITOR.NODE_COMMENT = 8;
  CKEDITOR.NODE_DOCUMENT_FRAGMENT = 11;
  CKEDITOR.POSITION_IDENTICAL = 0;
  CKEDITOR.POSITION_DISCONNECTED = 1;
  CKEDITOR.POSITION_FOLLOWING = 2;
  CKEDITOR.POSITION_PRECEDING = 4;
  CKEDITOR.POSITION_IS_CONTAINED = 8;
  CKEDITOR.POSITION_CONTAINS = 16;
  CKEDITOR.tools.extend(CKEDITOR.dom.node.prototype, {
    appendTo: function (a, d) {
      a.append(this, d);
      return a
    }, clone: function (a, d) {
      var b = this.$.cloneNode(a), c = function (e) {
        e["data-cke-expando"] && (e["data-cke-expando"] = false);
        if (e.nodeType == CKEDITOR.NODE_ELEMENT) {
          d || e.removeAttribute("id", false);
          if (a)for (var e = e.childNodes, b = 0; b < e.length; b++)c(e[b])
        }
      };
      c(b);
      return new CKEDITOR.dom.node(b)
    }, hasPrevious: function () {
      return !!this.$.previousSibling
    }, hasNext: function () {
      return !!this.$.nextSibling
    }, insertAfter: function (a) {
      a.$.parentNode.insertBefore(this.$,
        a.$.nextSibling);
      return a
    }, insertBefore: function (a) {
      a.$.parentNode.insertBefore(this.$, a.$);
      return a
    }, insertBeforeMe: function (a) {
      this.$.parentNode.insertBefore(a.$, this.$);
      return a
    }, getAddress: function (a) {
      for (var d = [], b = this.getDocument().$.documentElement, c = this.$; c && c != b;) {
        var e = c.parentNode;
        e && d.unshift(this.getIndex.call({$: c}, a));
        c = e
      }
      return d
    }, getDocument: function () {
      return new CKEDITOR.dom.document(this.$.ownerDocument || this.$.parentNode.ownerDocument)
    }, getIndex: function (a) {
      var d = this.$, b = -1,
        c;
      if (!this.$.parentNode)return b;
      do if (!a || !(d != this.$ && d.nodeType == CKEDITOR.NODE_TEXT && (c || !d.nodeValue))) {
        b++;
        c = d.nodeType == CKEDITOR.NODE_TEXT
      } while (d = d.previousSibling);
      return b
    }, getNextSourceNode: function (a, d, b) {
      if (b && !b.call)var c = b, b = function (a) {
        return !a.equals(c)
      };
      var a = !a && this.getFirst && this.getFirst(), e;
      if (!a) {
        if (this.type == CKEDITOR.NODE_ELEMENT && b && b(this, true) === false)return null;
        a = this.getNext()
      }
      for (; !a && (e = (e || this).getParent());) {
        if (b && b(e, true) === false)return null;
        a = e.getNext()
      }
      return !a ||
      b && b(a) === false ? null : d && d != a.type ? a.getNextSourceNode(false, d, b) : a
    }, getPreviousSourceNode: function (a, d, b) {
      if (b && !b.call)var c = b, b = function (a) {
        return !a.equals(c)
      };
      var a = !a && this.getLast && this.getLast(), e;
      if (!a) {
        if (this.type == CKEDITOR.NODE_ELEMENT && b && b(this, true) === false)return null;
        a = this.getPrevious()
      }
      for (; !a && (e = (e || this).getParent());) {
        if (b && b(e, true) === false)return null;
        a = e.getPrevious()
      }
      return !a || b && b(a) === false ? null : d && a.type != d ? a.getPreviousSourceNode(false, d, b) : a
    }, getPrevious: function (a) {
      var d =
        this.$, b;
      do b = (d = d.previousSibling) && d.nodeType != 10 && new CKEDITOR.dom.node(d); while (b && a && !a(b));
      return b
    }, getNext: function (a) {
      var d = this.$, b;
      do b = (d = d.nextSibling) && new CKEDITOR.dom.node(d); while (b && a && !a(b));
      return b
    }, getParent: function (a) {
      var d = this.$.parentNode;
      return d && (d.nodeType == CKEDITOR.NODE_ELEMENT || a && d.nodeType == CKEDITOR.NODE_DOCUMENT_FRAGMENT) ? new CKEDITOR.dom.node(d) : null
    }, getParents: function (a) {
      var d = this, b = [];
      do b[a ? "push" : "unshift"](d); while (d = d.getParent());
      return b
    }, getCommonAncestor: function (a) {
      if (a.equals(this))return this;
      if (a.contains && a.contains(this))return a;
      var d = this.contains ? this : this.getParent();
      do if (d.contains(a))return d; while (d = d.getParent());
      return null
    }, getPosition: function (a) {
      var d = this.$, b = a.$;
      if (d.compareDocumentPosition)return d.compareDocumentPosition(b);
      if (d == b)return CKEDITOR.POSITION_IDENTICAL;
      if (this.type == CKEDITOR.NODE_ELEMENT && a.type == CKEDITOR.NODE_ELEMENT) {
        if (d.contains) {
          if (d.contains(b))return CKEDITOR.POSITION_CONTAINS + CKEDITOR.POSITION_PRECEDING;
          if (b.contains(d))return CKEDITOR.POSITION_IS_CONTAINED +
            CKEDITOR.POSITION_FOLLOWING
        }
        if ("sourceIndex"in d)return d.sourceIndex < 0 || b.sourceIndex < 0 ? CKEDITOR.POSITION_DISCONNECTED : d.sourceIndex < b.sourceIndex ? CKEDITOR.POSITION_PRECEDING : CKEDITOR.POSITION_FOLLOWING
      }
      for (var d = this.getAddress(), a = a.getAddress(), b = Math.min(d.length, a.length), c = 0; c <= b - 1; c++)if (d[c] != a[c]) {
        if (c < b)return d[c] < a[c] ? CKEDITOR.POSITION_PRECEDING : CKEDITOR.POSITION_FOLLOWING;
        break
      }
      return d.length < a.length ? CKEDITOR.POSITION_CONTAINS + CKEDITOR.POSITION_PRECEDING : CKEDITOR.POSITION_IS_CONTAINED +
      CKEDITOR.POSITION_FOLLOWING
    }, getAscendant: function (a, d) {
      var b = this.$, c;
      if (!d)b = b.parentNode;
      for (; b;) {
        if (b.nodeName && (c = b.nodeName.toLowerCase(), typeof a == "string" ? c == a : c in a))return new CKEDITOR.dom.node(b);
        try {
          b = b.parentNode
        } catch (e) {
          b = null
        }
      }
      return null
    }, hasAscendant: function (a, d) {
      var b = this.$;
      if (!d)b = b.parentNode;
      for (; b;) {
        if (b.nodeName && b.nodeName.toLowerCase() == a)return true;
        b = b.parentNode
      }
      return false
    }, move: function (a, d) {
      a.append(this.remove(), d)
    }, remove: function (a) {
      var d = this.$, b = d.parentNode;
      if (b) {
        if (a)for (; a = d.firstChild;)b.insertBefore(d.removeChild(a), d);
        b.removeChild(d)
      }
      return this
    }, replace: function (a) {
      this.insertBefore(a);
      a.remove()
    }, trim: function () {
      this.ltrim();
      this.rtrim()
    }, ltrim: function () {
      for (var a; this.getFirst && (a = this.getFirst());) {
        if (a.type == CKEDITOR.NODE_TEXT) {
          var d = CKEDITOR.tools.ltrim(a.getText()), b = a.getLength();
          if (d) {
            if (d.length < b) {
              a.split(b - d.length);
              this.$.removeChild(this.$.firstChild)
            }
          } else {
            a.remove();
            continue
          }
        }
        break
      }
    }, rtrim: function () {
      for (var a; this.getLast && (a =
        this.getLast());) {
        if (a.type == CKEDITOR.NODE_TEXT) {
          var d = CKEDITOR.tools.rtrim(a.getText()), b = a.getLength();
          if (d) {
            if (d.length < b) {
              a.split(d.length);
              this.$.lastChild.parentNode.removeChild(this.$.lastChild)
            }
          } else {
            a.remove();
            continue
          }
        }
        break
      }
      if (CKEDITOR.env.needsBrFiller)(a = this.$.lastChild) && (a.type == 1 && a.nodeName.toLowerCase() == "br") && a.parentNode.removeChild(a)
    }, isReadOnly: function () {
      var a = this;
      this.type != CKEDITOR.NODE_ELEMENT && (a = this.getParent());
      if (a && typeof a.$.isContentEditable != "undefined")return !(a.$.isContentEditable ||
      a.data("cke-editable"));
      for (; a;) {
        if (a.data("cke-editable"))break;
        if (a.getAttribute("contentEditable") == "false")return true;
        if (a.getAttribute("contentEditable") == "true")break;
        a = a.getParent()
      }
      return !a
    }
  });
  CKEDITOR.dom.window = function (a) {
    CKEDITOR.dom.domObject.call(this, a)
  };
  CKEDITOR.dom.window.prototype = new CKEDITOR.dom.domObject;
  CKEDITOR.tools.extend(CKEDITOR.dom.window.prototype, {
    focus: function () {
      this.$.focus()
    }, getViewPaneSize: function () {
      var a = this.$.document, d = a.compatMode == "CSS1Compat";
      return {
        width: (d ? a.documentElement.clientWidth : a.body.clientWidth) || 0,
        height: (d ? a.documentElement.clientHeight : a.body.clientHeight) || 0
      }
    }, getScrollPosition: function () {
      var a = this.$;
      if ("pageXOffset"in a)return {x: a.pageXOffset || 0, y: a.pageYOffset || 0};
      a = a.document;
      return {
        x: a.documentElement.scrollLeft || a.body.scrollLeft || 0, y: a.documentElement.scrollTop ||
        a.body.scrollTop || 0
      }
    }, getFrame: function () {
      var a = this.$.frameElement;
      return a ? new CKEDITOR.dom.element.get(a) : null
    }
  });
  CKEDITOR.dom.document = function (a) {
    CKEDITOR.dom.domObject.call(this, a)
  };
  CKEDITOR.dom.document.prototype = new CKEDITOR.dom.domObject;
  CKEDITOR.tools.extend(CKEDITOR.dom.document.prototype, {
    type: CKEDITOR.NODE_DOCUMENT, appendStyleSheet: function (a) {
      if (this.$.createStyleSheet)this.$.createStyleSheet(a); else {
        var d = new CKEDITOR.dom.element("link");
        d.setAttributes({rel: "stylesheet", type: "text/css", href: a});
        this.getHead().append(d)
      }
    }, appendStyleText: function (a) {
      if (this.$.createStyleSheet) {
        var d = this.$.createStyleSheet("");
        d.cssText = a
      } else {
        var b = new CKEDITOR.dom.element("style", this);
        b.append(new CKEDITOR.dom.text(a, this));
        this.getHead().append(b)
      }
      return d ||
        b.$.sheet
    }, createElement: function (a, d) {
      var b = new CKEDITOR.dom.element(a, this);
      if (d) {
        d.attributes && b.setAttributes(d.attributes);
        d.styles && b.setStyles(d.styles)
      }
      return b
    }, createText: function (a) {
      return new CKEDITOR.dom.text(a, this)
    }, focus: function () {
      this.getWindow().focus()
    }, getActive: function () {
      return new CKEDITOR.dom.element(this.$.activeElement)
    }, getById: function (a) {
      return (a = this.$.getElementById(a)) ? new CKEDITOR.dom.element(a) : null
    }, getByAddress: function (a, d) {
      for (var b = this.$.documentElement, c =
        0; b && c < a.length; c++) {
        var e = a[c];
        if (d)for (var f = -1, h = 0; h < b.childNodes.length; h++) {
          var n = b.childNodes[h];
          if (!(d === true && n.nodeType == 3 && n.previousSibling && n.previousSibling.nodeType == 3)) {
            f++;
            if (f == e) {
              b = n;
              break
            }
          }
        } else b = b.childNodes[e]
      }
      return b ? new CKEDITOR.dom.node(b) : null
    }, getElementsByTag: function (a, d) {
      if ((!CKEDITOR.env.ie || document.documentMode > 8) && d)a = d + ":" + a;
      return new CKEDITOR.dom.nodeList(this.$.getElementsByTagName(a))
    }, getHead: function () {
      var a = this.$.getElementsByTagName("head")[0];
      return a =
        a ? new CKEDITOR.dom.element(a) : this.getDocumentElement().append(new CKEDITOR.dom.element("head"), true)
    }, getBody: function () {
      return new CKEDITOR.dom.element(this.$.body)
    }, getDocumentElement: function () {
      return new CKEDITOR.dom.element(this.$.documentElement)
    }, getWindow: function () {
      return new CKEDITOR.dom.window(this.$.parentWindow || this.$.defaultView)
    }, write: function (a) {
      this.$.open("text/html", "replace");
      CKEDITOR.env.ie && (a = a.replace(/(?:^\s*<!DOCTYPE[^>]*?>)|^/i, '$&\n<script data-cke-temp="1">(' + CKEDITOR.tools.fixDomain +
        ")();<\/script>"));
      this.$.write(a);
      this.$.close()
    }, find: function (a) {
      return new CKEDITOR.dom.nodeList(this.$.querySelectorAll(a))
    }, findOne: function (a) {
      return (a = this.$.querySelector(a)) ? new CKEDITOR.dom.element(a) : null
    }, _getHtml5ShivFrag: function () {
      var a = this.getCustomData("html5ShivFrag");
      if (!a) {
        a = this.$.createDocumentFragment();
        CKEDITOR.tools.enableHtml5Elements(a, true);
        this.setCustomData("html5ShivFrag", a)
      }
      return a
    }
  });
  CKEDITOR.dom.nodeList = function (a) {
    this.$ = a
  };
  CKEDITOR.dom.nodeList.prototype = {
    count: function () {
      return this.$.length
    }, getItem: function (a) {
      if (a < 0 || a >= this.$.length)return null;
      return (a = this.$[a]) ? new CKEDITOR.dom.node(a) : null
    }
  };
  CKEDITOR.dom.element = function (a, d) {
    typeof a == "string" && (a = (d ? d.$ : document).createElement(a));
    CKEDITOR.dom.domObject.call(this, a)
  };
  CKEDITOR.dom.element.get = function (a) {
    return (a = typeof a == "string" ? document.getElementById(a) || document.getElementsByName(a)[0] : a) && (a.$ ? a : new CKEDITOR.dom.element(a))
  };
  CKEDITOR.dom.element.prototype = new CKEDITOR.dom.node;
  CKEDITOR.dom.element.createFromHtml = function (a, d) {
    var b = new CKEDITOR.dom.element("div", d);
    b.setHtml(a);
    return b.getFirst().remove()
  };
  CKEDITOR.dom.element.setMarker = function (a, d, b, c) {
    var e = d.getCustomData("list_marker_id") || d.setCustomData("list_marker_id", CKEDITOR.tools.getNextNumber()).getCustomData("list_marker_id"), f = d.getCustomData("list_marker_names") || d.setCustomData("list_marker_names", {}).getCustomData("list_marker_names");
    a[e] = d;
    f[b] = 1;
    return d.setCustomData(b, c)
  };
  CKEDITOR.dom.element.clearAllMarkers = function (a) {
    for (var d in a)CKEDITOR.dom.element.clearMarkers(a, a[d], 1)
  };
  CKEDITOR.dom.element.clearMarkers = function (a, d, b) {
    var c = d.getCustomData("list_marker_names"), e = d.getCustomData("list_marker_id"), f;
    for (f in c)d.removeCustomData(f);
    d.removeCustomData("list_marker_names");
    if (b) {
      d.removeCustomData("list_marker_id");
      delete a[e]
    }
  };
  (function () {
    function a(a) {
      var b = true;
      if (!a.$.id) {
        a.$.id = "cke_tmp_" + CKEDITOR.tools.getNextNumber();
        b = false
      }
      return function () {
        b || a.removeAttribute("id")
      }
    }

    function d(a, b) {
      return "#" + a.$.id + " " + b.split(/,\s*/).join(", #" + a.$.id + " ")
    }

    function b(a) {
      for (var b = 0, d = 0, n = c[a].length; d < n; d++)b = b + (parseInt(this.getComputedStyle(c[a][d]) || 0, 10) || 0);
      return b
    }

    CKEDITOR.tools.extend(CKEDITOR.dom.element.prototype, {
      type: CKEDITOR.NODE_ELEMENT,
      addClass: function (a) {
        var b = this.$.className;
        b && (RegExp("(?:^|\\s)" + a + "(?:\\s|$)",
          "").test(b) || (b = b + (" " + a)));
        this.$.className = b || a
      },
      removeClass: function (a) {
        var b = this.getAttribute("class");
        if (b) {
          a = RegExp("(?:^|\\s+)" + a + "(?=\\s|$)", "i");
          if (a.test(b))(b = b.replace(a, "").replace(/^\s+/, "")) ? this.setAttribute("class", b) : this.removeAttribute("class")
        }
        return this
      },
      hasClass: function (a) {
        return RegExp("(?:^|\\s+)" + a + "(?=\\s|$)", "").test(this.getAttribute("class"))
      },
      append: function (a, b) {
        typeof a == "string" && (a = this.getDocument().createElement(a));
        b ? this.$.insertBefore(a.$, this.$.firstChild) :
          this.$.appendChild(a.$);
        return a
      },
      appendHtml: function (a) {
        if (this.$.childNodes.length) {
          var b = new CKEDITOR.dom.element("div", this.getDocument());
          b.setHtml(a);
          b.moveChildren(this)
        } else this.setHtml(a)
      },
      appendText: function (a) {
        this.$.text != void 0 ? this.$.text = this.$.text + a : this.append(new CKEDITOR.dom.text(a))
      },
      appendBogus: function (a) {
        if (a || CKEDITOR.env.needsBrFiller || CKEDITOR.env.opera) {
          for (a = this.getLast(); a && a.type == CKEDITOR.NODE_TEXT && !CKEDITOR.tools.rtrim(a.getText());)a = a.getPrevious();
          if (!a || !a.is || !a.is("br")) {
            a = CKEDITOR.env.opera ? this.getDocument().createText("") : this.getDocument().createElement("br");
            CKEDITOR.env.gecko && a.setAttribute("type", "_moz");
            this.append(a)
          }
        }
      },
      breakParent: function (a) {
        var b = new CKEDITOR.dom.range(this.getDocument());
        b.setStartAfter(this);
        b.setEndAfter(a);
        a = b.extractContents();
        b.insertNode(this.remove());
        a.insertAfterNode(this)
      },
      contains: CKEDITOR.env.ie || CKEDITOR.env.webkit ? function (a) {
        var b = this.$;
        return a.type != CKEDITOR.NODE_ELEMENT ? b.contains(a.getParent().$) : b !=
        a.$ && b.contains(a.$)
      } : function (a) {
        return !!(this.$.compareDocumentPosition(a.$) & 16)
      },
      focus: function () {
        function a() {
          try {
            this.$.focus()
          } catch (b) {
          }
        }

        return function (b) {
          b ? CKEDITOR.tools.setTimeout(a, 100, this) : a.call(this)
        }
      }(),
      getHtml: function () {
        var a = this.$.innerHTML;
        return CKEDITOR.env.ie ? a.replace(/<\?[^>]*>/g, "") : a
      },
      getOuterHtml: function () {
        if (this.$.outerHTML)return this.$.outerHTML.replace(/<\?[^>]*>/, "");
        var a = this.$.ownerDocument.createElement("div");
        a.appendChild(this.$.cloneNode(true));
        return a.innerHTML
      },
      getClientRect: function () {
        var a = CKEDITOR.tools.extend({}, this.$.getBoundingClientRect());
        !a.width && (a.width = a.right - a.left);
        !a.height && (a.height = a.bottom - a.top);
        return a
      },
      setHtml: CKEDITOR.env.ie && CKEDITOR.env.version < 9 ? function (a) {
        try {
          var b = this.$;
          if (this.getParent())return b.innerHTML = a;
          var c = this.getDocument()._getHtml5ShivFrag();
          c.appendChild(b);
          b.innerHTML = a;
          c.removeChild(b);
          return a
        } catch (d) {
          this.$.innerHTML = "";
          b = new CKEDITOR.dom.element("body", this.getDocument());
          b.$.innerHTML = a;
          for (b = b.getChildren(); b.count();)this.append(b.getItem(0));
          return a
        }
      } : function (a) {
        return this.$.innerHTML = a
      },
      setText: function (a) {
        CKEDITOR.dom.element.prototype.setText = this.$.innerText != void 0 ? function (a) {
          return this.$.innerText = a
        } : function (a) {
          return this.$.textContent = a
        };
        return this.setText(a)
      },
      getAttribute: function () {
        var a = function (a) {
          return this.$.getAttribute(a, 2)
        };
        return CKEDITOR.env.ie && (CKEDITOR.env.ie7Compat || CKEDITOR.env.ie6Compat) ? function (a) {
          switch (a) {
            case "class":
              a = "className";
              break;
            case "http-equiv":
              a = "httpEquiv";
              break;
            case "name":
              return this.$.name;
            case "tabindex":
              a = this.$.getAttribute(a, 2);
              a !== 0 && this.$.tabIndex === 0 && (a = null);
              return a;
            case "checked":
              a = this.$.attributes.getNamedItem(a);
              return (a.specified ? a.nodeValue : this.$.checked) ? "checked" : null;
            case "hspace":
            case "value":
              return this.$[a];
            case "style":
              return this.$.style.cssText;
            case "contenteditable":
            case "contentEditable":
              return this.$.attributes.getNamedItem("contentEditable").specified ? this.$.getAttribute("contentEditable") : null
          }
          return this.$.getAttribute(a, 2)
        } : a
      }(),
      getChildren: function () {
        return new CKEDITOR.dom.nodeList(this.$.childNodes)
      },
      getComputedStyle: CKEDITOR.env.ie ? function (a) {
        return this.$.currentStyle[CKEDITOR.tools.cssStyleToDomStyle(a)]
      } : function (a) {
        var b = this.getWindow().$.getComputedStyle(this.$, null);
        return b ? b.getPropertyValue(a) : ""
      },
      getDtd: function () {
        var a = CKEDITOR.dtd[this.getName()];
        this.getDtd = function () {
          return a
        };
        return a
      },
      getElementsByTag: CKEDITOR.dom.document.prototype.getElementsByTag,
      getTabIndex: CKEDITOR.env.ie ? function () {
        var a = this.$.tabIndex;
        a === 0 && (!CKEDITOR.dtd.$tabIndex[this.getName()] && parseInt(this.getAttribute("tabindex"),
          10) !== 0) && (a = -1);
        return a
      } : CKEDITOR.env.webkit ? function () {
        var a = this.$.tabIndex;
        if (a == void 0) {
          a = parseInt(this.getAttribute("tabindex"), 10);
          isNaN(a) && (a = -1)
        }
        return a
      } : function () {
        return this.$.tabIndex
      },
      getText: function () {
        return this.$.textContent || this.$.innerText || ""
      },
      getWindow: function () {
        return this.getDocument().getWindow()
      },
      getId: function () {
        return this.$.id || null
      },
      getNameAtt: function () {
        return this.$.name || null
      },
      getName: function () {
        var a = this.$.nodeName.toLowerCase();
        if (CKEDITOR.env.ie && !(document.documentMode >
          8)) {
          var b = this.$.scopeName;
          b != "HTML" && (a = b.toLowerCase() + ":" + a)
        }
        return (this.getName = function () {
          return a
        })()
      },
      getValue: function () {
        return this.$.value
      },
      getFirst: function (a) {
        var b = this.$.firstChild;
        (b = b && new CKEDITOR.dom.node(b)) && (a && !a(b)) && (b = b.getNext(a));
        return b
      },
      getLast: function (a) {
        var b = this.$.lastChild;
        (b = b && new CKEDITOR.dom.node(b)) && (a && !a(b)) && (b = b.getPrevious(a));
        return b
      },
      getStyle: function (a) {
        return this.$.style[CKEDITOR.tools.cssStyleToDomStyle(a)]
      },
      is: function () {
        var a = this.getName();
        if (typeof arguments[0] == "object")return !!arguments[0][a];
        for (var b = 0; b < arguments.length; b++)if (arguments[b] == a)return true;
        return false
      },
      isEditable: function (a) {
        var b = this.getName();
        if (this.isReadOnly() || this.getComputedStyle("display") == "none" || this.getComputedStyle("visibility") == "hidden" || CKEDITOR.dtd.$nonEditable[b] || CKEDITOR.dtd.$empty[b] || this.is("a") && (this.data("cke-saved-name") || this.hasAttribute("name")) && !this.getChildCount())return false;
        if (a !== false) {
          a = CKEDITOR.dtd[b] || CKEDITOR.dtd.span;
          return !(!a || !a["#"])
        }
        return true
      },
      isIdentical: function (a) {
        var b = this.clone(0, 1), a = a.clone(0, 1);
        b.removeAttributes(["_moz_dirty", "data-cke-expando", "data-cke-saved-href", "data-cke-saved-name"]);
        a.removeAttributes(["_moz_dirty", "data-cke-expando", "data-cke-saved-href", "data-cke-saved-name"]);
        if (b.$.isEqualNode) {
          b.$.style.cssText = CKEDITOR.tools.normalizeCssText(b.$.style.cssText);
          a.$.style.cssText = CKEDITOR.tools.normalizeCssText(a.$.style.cssText);
          return b.$.isEqualNode(a.$)
        }
        b = b.getOuterHtml();
        a = a.getOuterHtml();
        if (CKEDITOR.env.ie && CKEDITOR.env.version < 9 && this.is("a")) {
          var c = this.getParent();
          if (c.type == CKEDITOR.NODE_ELEMENT) {
            c = c.clone();
            c.setHtml(b);
            b = c.getHtml();
            c.setHtml(a);
            a = c.getHtml()
          }
        }
        return b == a
      },
      isVisible: function () {
        var a = (this.$.offsetHeight || this.$.offsetWidth) && this.getComputedStyle("visibility") != "hidden", b, c;
        if (a && (CKEDITOR.env.webkit || CKEDITOR.env.opera)) {
          b = this.getWindow();
          if (!b.equals(CKEDITOR.document.getWindow()) && (c = b.$.frameElement))a = (new CKEDITOR.dom.element(c)).isVisible()
        }
        return !!a
      },
      isEmptyInlineRemoveable: function () {
        if (!CKEDITOR.dtd.$removeEmpty[this.getName()])return false;
        for (var a = this.getChildren(), b = 0, c = a.count(); b < c; b++) {
          var d = a.getItem(b);
          if (!(d.type == CKEDITOR.NODE_ELEMENT && d.data("cke-bookmark")) && (d.type == CKEDITOR.NODE_ELEMENT && !d.isEmptyInlineRemoveable() || d.type == CKEDITOR.NODE_TEXT && CKEDITOR.tools.trim(d.getText())))return false
        }
        return true
      },
      hasAttributes: CKEDITOR.env.ie && (CKEDITOR.env.ie7Compat || CKEDITOR.env.ie6Compat) ? function () {
        for (var a = this.$.attributes, b = 0; b <
        a.length; b++) {
          var c = a[b];
          switch (c.nodeName) {
            case "class":
              if (this.getAttribute("class"))return true;
            case "data-cke-expando":
              continue;
            default:
              if (c.specified)return true
          }
        }
        return false
      } : function () {
        var a = this.$.attributes, b = a.length, c = {"data-cke-expando": 1, _moz_dirty: 1};
        return b > 0 && (b > 2 || !c[a[0].nodeName] || b == 2 && !c[a[1].nodeName])
      },
      hasAttribute: function () {
        function a(b) {
          b = this.$.attributes.getNamedItem(b);
          return !(!b || !b.specified)
        }

        return CKEDITOR.env.ie && CKEDITOR.env.version < 8 ? function (b) {
          return b == "name" ?
            !!this.$.name : a.call(this, b)
        } : a
      }(),
      hide: function () {
        this.setStyle("display", "none")
      },
      moveChildren: function (a, b) {
        var c = this.$, a = a.$;
        if (c != a) {
          var d;
          if (b)for (; d = c.lastChild;)a.insertBefore(c.removeChild(d), a.firstChild); else for (; d = c.firstChild;)a.appendChild(c.removeChild(d))
        }
      },
      mergeSiblings: function () {
        function a(b, e, c) {
          if (e && e.type == CKEDITOR.NODE_ELEMENT) {
            for (var d = []; e.data("cke-bookmark") || e.isEmptyInlineRemoveable();) {
              d.push(e);
              e = c ? e.getNext() : e.getPrevious();
              if (!e || e.type != CKEDITOR.NODE_ELEMENT)return
            }
            if (b.isIdentical(e)) {
              for (var k =
                c ? b.getLast() : b.getFirst(); d.length;)d.shift().move(b, !c);
              e.moveChildren(b, !c);
              e.remove();
              k && k.type == CKEDITOR.NODE_ELEMENT && k.mergeSiblings()
            }
          }
        }

        return function (b) {
          if (b === false || CKEDITOR.dtd.$removeEmpty[this.getName()] || this.is("a")) {
            a(this, this.getNext(), true);
            a(this, this.getPrevious())
          }
        }
      }(),
      show: function () {
        this.setStyles({display: "", visibility: ""})
      },
      setAttribute: function () {
        var a = function (a, b) {
          this.$.setAttribute(a, b);
          return this
        };
        return CKEDITOR.env.ie && (CKEDITOR.env.ie7Compat || CKEDITOR.env.ie6Compat) ?
          function (b, c) {
            b == "class" ? this.$.className = c : b == "style" ? this.$.style.cssText = c : b == "tabindex" ? this.$.tabIndex = c : b == "checked" ? this.$.checked = c : b == "contenteditable" ? a.call(this, "contentEditable", c) : a.apply(this, arguments);
            return this
          } : CKEDITOR.env.ie8Compat && CKEDITOR.env.secure ? function (b, c) {
          if (b == "src" && c.match(/^http:\/\//))try {
            a.apply(this, arguments)
          } catch (d) {
          } else a.apply(this, arguments);
          return this
        } : a
      }(),
      setAttributes: function (a) {
        for (var b in a)this.setAttribute(b, a[b]);
        return this
      },
      setValue: function (a) {
        this.$.value =
          a;
        return this
      },
      removeAttribute: function () {
        var a = function (a) {
          this.$.removeAttribute(a)
        };
        return CKEDITOR.env.ie && (CKEDITOR.env.ie7Compat || CKEDITOR.env.ie6Compat) ? function (a) {
          a == "class" ? a = "className" : a == "tabindex" ? a = "tabIndex" : a == "contenteditable" && (a = "contentEditable");
          this.$.removeAttribute(a)
        } : a
      }(),
      removeAttributes: function (a) {
        if (CKEDITOR.tools.isArray(a))for (var b = 0; b < a.length; b++)this.removeAttribute(a[b]); else for (b in a)a.hasOwnProperty(b) && this.removeAttribute(b)
      },
      removeStyle: function (a) {
        var b =
          this.$.style;
        if (!b.removeProperty && (a == "border" || a == "margin" || a == "padding")) {
          var c = ["top", "left", "right", "bottom"], d;
          a == "border" && (d = ["color", "style", "width"]);
          for (var b = [], j = 0; j < c.length; j++)if (d)for (var k = 0; k < d.length; k++)b.push([a, c[j], d[k]].join("-")); else b.push([a, c[j]].join("-"));
          for (a = 0; a < b.length; a++)this.removeStyle(b[a])
        } else {
          b.removeProperty ? b.removeProperty(a) : b.removeAttribute(CKEDITOR.tools.cssStyleToDomStyle(a));
          this.$.style.cssText || this.removeAttribute("style")
        }
      },
      setStyle: function (a,
                          b) {
        this.$.style[CKEDITOR.tools.cssStyleToDomStyle(a)] = b;
        return this
      },
      setStyles: function (a) {
        for (var b in a)this.setStyle(b, a[b]);
        return this
      },
      setOpacity: function (a) {
        if (CKEDITOR.env.ie && CKEDITOR.env.version < 9) {
          a = Math.round(a * 100);
          this.setStyle("filter", a >= 100 ? "" : "progid:DXImageTransform.Microsoft.Alpha(opacity=" + a + ")")
        } else this.setStyle("opacity", a)
      },
      unselectable: function () {
        this.setStyles(CKEDITOR.tools.cssVendorPrefix("user-select", "none"));
        if (CKEDITOR.env.ie || CKEDITOR.env.opera) {
          this.setAttribute("unselectable",
            "on");
          for (var a, b = this.getElementsByTag("*"), c = 0, d = b.count(); c < d; c++) {
            a = b.getItem(c);
            a.setAttribute("unselectable", "on")
          }
        }
      },
      getPositionedAncestor: function () {
        for (var a = this; a.getName() != "html";) {
          if (a.getComputedStyle("position") != "static")return a;
          a = a.getParent()
        }
        return null
      },
      getDocumentPosition: function (a) {
        var b = 0, c = 0, d = this.getDocument(), j = d.getBody(), k = d.$.compatMode == "BackCompat";
        if (document.documentElement.getBoundingClientRect) {
          var l = this.$.getBoundingClientRect(), u = d.$.documentElement, s = u.clientTop ||
            j.$.clientTop || 0, t = u.clientLeft || j.$.clientLeft || 0, g = true;
          if (CKEDITOR.env.ie) {
            g = d.getDocumentElement().contains(this);
            d = d.getBody().contains(this);
            g = k && d || !k && g
          }
          if (g) {
            b = l.left + (!k && u.scrollLeft || j.$.scrollLeft);
            b = b - t;
            c = l.top + (!k && u.scrollTop || j.$.scrollTop);
            c = c - s
          }
        } else {
          j = this;
          for (d = null; j && !(j.getName() == "body" || j.getName() == "html");) {
            b = b + (j.$.offsetLeft - j.$.scrollLeft);
            c = c + (j.$.offsetTop - j.$.scrollTop);
            if (!j.equals(this)) {
              b = b + (j.$.clientLeft || 0);
              c = c + (j.$.clientTop || 0)
            }
            for (; d && !d.equals(j);) {
              b = b -
                d.$.scrollLeft;
              c = c - d.$.scrollTop;
              d = d.getParent()
            }
            d = j;
            j = (l = j.$.offsetParent) ? new CKEDITOR.dom.element(l) : null
          }
        }
        if (a) {
          j = this.getWindow();
          d = a.getWindow();
          if (!j.equals(d) && j.$.frameElement) {
            a = (new CKEDITOR.dom.element(j.$.frameElement)).getDocumentPosition(a);
            b = b + a.x;
            c = c + a.y
          }
        }
        if (!document.documentElement.getBoundingClientRect && CKEDITOR.env.gecko && !k) {
          b = b + (this.$.clientLeft ? 1 : 0);
          c = c + (this.$.clientTop ? 1 : 0)
        }
        return {x: b, y: c}
      },
      scrollIntoView: function (a) {
        var b = this.getParent();
        if (b) {
          do {
            (b.$.clientWidth && b.$.clientWidth <
            b.$.scrollWidth || b.$.clientHeight && b.$.clientHeight < b.$.scrollHeight) && !b.is("body") && this.scrollIntoParent(b, a, 1);
            if (b.is("html")) {
              var c = b.getWindow();
              try {
                var d = c.$.frameElement;
                d && (b = new CKEDITOR.dom.element(d))
              } catch (j) {
              }
            }
          } while (b = b.getParent())
        }
      },
      scrollIntoParent: function (a, b, c) {
        var d, j, k, l;

        function u(b, c) {
          if (/body|html/.test(a.getName()))a.getWindow().$.scrollBy(b, c); else {
            a.$.scrollLeft = a.$.scrollLeft + b;
            a.$.scrollTop = a.$.scrollTop + c
          }
        }

        function s(a, b) {
          var e = {x: 0, y: 0};
          if (!a.is(g ? "body" : "html")) {
            var c =
              a.$.getBoundingClientRect();
            e.x = c.left;
            e.y = c.top
          }
          c = a.getWindow();
          if (!c.equals(b)) {
            c = s(CKEDITOR.dom.element.get(c.$.frameElement), b);
            e.x = e.x + c.x;
            e.y = e.y + c.y
          }
          return e
        }

        function t(a, b) {
          return parseInt(a.getComputedStyle("margin-" + b) || 0, 10) || 0
        }

        !a && (a = this.getWindow());
        k = a.getDocument();
        var g = k.$.compatMode == "BackCompat";
        a instanceof CKEDITOR.dom.window && (a = g ? k.getBody() : k.getDocumentElement());
        k = a.getWindow();
        j = s(this, k);
        var r = s(a, k), w = this.$.offsetHeight;
        d = this.$.offsetWidth;
        var m = a.$.clientHeight, i =
          a.$.clientWidth;
        k = j.x - t(this, "left") - r.x || 0;
        l = j.y - t(this, "top") - r.y || 0;
        d = j.x + d + t(this, "right") - (r.x + i) || 0;
        j = j.y + w + t(this, "bottom") - (r.y + m) || 0;
        if (l < 0 || j > 0)u(0, b === true ? l : b === false ? j : l < 0 ? l : j);
        if (c && (k < 0 || d > 0))u(k < 0 ? k : d, 0)
      },
      setState: function (a, b, c) {
        b = b || "cke";
        switch (a) {
          case CKEDITOR.TRISTATE_ON:
            this.addClass(b + "_on");
            this.removeClass(b + "_off");
            this.removeClass(b + "_disabled");
            c && this.setAttribute("aria-pressed", true);
            c && this.removeAttribute("aria-disabled");
            break;
          case CKEDITOR.TRISTATE_DISABLED:
            this.addClass(b +
              "_disabled");
            this.removeClass(b + "_off");
            this.removeClass(b + "_on");
            c && this.setAttribute("aria-disabled", true);
            c && this.removeAttribute("aria-pressed");
            break;
          default:
            this.addClass(b + "_off");
            this.removeClass(b + "_on");
            this.removeClass(b + "_disabled");
            c && this.removeAttribute("aria-pressed");
            c && this.removeAttribute("aria-disabled")
        }
      },
      getFrameDocument: function () {
        var a = this.$;
        try {
          a.contentWindow.document
        } catch (b) {
          a.src = a.src
        }
        return a && new CKEDITOR.dom.document(a.contentWindow.document)
      },
      copyAttributes: function (a,
                                b) {
        for (var c = this.$.attributes, b = b || {}, d = 0; d < c.length; d++) {
          var j = c[d], k = j.nodeName.toLowerCase(), l;
          if (!(k in b))if (k == "checked" && (l = this.getAttribute(k)))a.setAttribute(k, l); else if (j.specified || CKEDITOR.env.ie && j.nodeValue && k == "value") {
            l = this.getAttribute(k);
            if (l === null)l = j.nodeValue;
            a.setAttribute(k, l)
          }
        }
        if (this.$.style.cssText !== "")a.$.style.cssText = this.$.style.cssText
      },
      renameNode: function (a) {
        if (this.getName() != a) {
          var b = this.getDocument(), a = new CKEDITOR.dom.element(a, b);
          this.copyAttributes(a);
          this.moveChildren(a);
          this.getParent() && this.$.parentNode.replaceChild(a.$, this.$);
          a.$["data-cke-expando"] = this.$["data-cke-expando"];
          this.$ = a.$
        }
      },
      getChild: function () {
        function a(b, c) {
          var e = b.childNodes;
          if (c >= 0 && c < e.length)return e[c]
        }

        return function (b) {
          var c = this.$;
          if (b.slice)for (; b.length > 0 && c;)c = a(c, b.shift()); else c = a(c, b);
          return c ? new CKEDITOR.dom.node(c) : null
        }
      }(),
      getChildCount: function () {
        return this.$.childNodes.length
      },
      disableContextMenu: function () {
        this.on("contextmenu", function (a) {
          a.data.getTarget().hasClass("cke_enable_context_menu") ||
          a.data.preventDefault()
        })
      },
      getDirection: function (a) {
        return a ? this.getComputedStyle("direction") || this.getDirection() || this.getParent() && this.getParent().getDirection(1) || this.getDocument().$.dir || "ltr" : this.getStyle("direction") || this.getAttribute("dir")
      },
      data: function (a, b) {
        a = "data-" + a;
        if (b === void 0)return this.getAttribute(a);
        b === false ? this.removeAttribute(a) : this.setAttribute(a, b);
        return null
      },
      getEditor: function () {
        var a = CKEDITOR.instances, b, c;
        for (b in a) {
          c = a[b];
          if (c.element.equals(this) && c.elementMode !=
            CKEDITOR.ELEMENT_MODE_APPENDTO)return c
        }
        return null
      },
      find: function (b) {
        var c = a(this), b = new CKEDITOR.dom.nodeList(this.$.querySelectorAll(d(this, b)));
        c();
        return b
      },
      findOne: function (b) {
        var c = a(this), b = this.$.querySelector(d(this, b));
        c();
        return b ? new CKEDITOR.dom.element(b) : null
      },
      forEach: function (a, b, c) {
        if (!c && (!b || this.type == b))var d = a(this);
        if (d !== false)for (var c = this.getChildren(), j = 0; j < c.count(); j++) {
          d = c.getItem(j);
          d.type == CKEDITOR.NODE_ELEMENT ? d.forEach(a, b) : (!b || d.type == b) && a(d)
        }
      }
    });
    var c = {
      width: ["border-left-width",
        "border-right-width", "padding-left", "padding-right"],
      height: ["border-top-width", "border-bottom-width", "padding-top", "padding-bottom"]
    };
    CKEDITOR.dom.element.prototype.setSize = function (a, c, d) {
      if (typeof c == "number") {
        if (d && (!CKEDITOR.env.ie || !CKEDITOR.env.quirks))c = c - b.call(this, a);
        this.setStyle(a, c + "px")
      }
    };
    CKEDITOR.dom.element.prototype.getSize = function (a, c) {
      var d = Math.max(this.$["offset" + CKEDITOR.tools.capitalize(a)], this.$["client" + CKEDITOR.tools.capitalize(a)]) || 0;
      c && (d = d - b.call(this, a));
      return d
    }
  })();
  CKEDITOR.dom.documentFragment = function (a) {
    a = a || CKEDITOR.document;
    this.$ = a.type == CKEDITOR.NODE_DOCUMENT ? a.$.createDocumentFragment() : a
  };
  CKEDITOR.tools.extend(CKEDITOR.dom.documentFragment.prototype, CKEDITOR.dom.element.prototype, {
    type: CKEDITOR.NODE_DOCUMENT_FRAGMENT,
    insertAfterNode: function (a) {
      a = a.$;
      a.parentNode.insertBefore(this.$, a.nextSibling)
    }
  }, !0, {
    append: 1,
    appendBogus: 1,
    getFirst: 1,
    getLast: 1,
    getParent: 1,
    getNext: 1,
    getPrevious: 1,
    appendTo: 1,
    moveChildren: 1,
    insertBefore: 1,
    insertAfterNode: 1,
    replace: 1,
    trim: 1,
    type: 1,
    ltrim: 1,
    rtrim: 1,
    getDocument: 1,
    getChildCount: 1,
    getChild: 1,
    getChildren: 1
  });
  (function () {
    function a(a, b) {
      var c = this.range;
      if (this._.end)return null;
      if (!this._.start) {
        this._.start = 1;
        if (c.collapsed) {
          this.end();
          return null
        }
        c.optimize()
      }
      var g, e = c.startContainer;
      g = c.endContainer;
      var l = c.startOffset, d = c.endOffset, i, f = this.guard, o = this.type, j = a ? "getPreviousSourceNode" : "getNextSourceNode";
      if (!a && !this._.guardLTR) {
        var p = g.type == CKEDITOR.NODE_ELEMENT ? g : g.getParent(), h = g.type == CKEDITOR.NODE_ELEMENT ? g.getChild(d) : g.getNext();
        this._.guardLTR = function (a, b) {
          return (!b || !p.equals(a)) && (!h || !a.equals(h)) && (a.type != CKEDITOR.NODE_ELEMENT || !b || !a.equals(c.root))
        }
      }
      if (a && !this._.guardRTL) {
        var k = e.type == CKEDITOR.NODE_ELEMENT ? e : e.getParent(), n = e.type == CKEDITOR.NODE_ELEMENT ? l ? e.getChild(l - 1) : null : e.getPrevious();
        this._.guardRTL = function (a, b) {
          return (!b || !k.equals(a)) && (!n || !a.equals(n)) && (a.type != CKEDITOR.NODE_ELEMENT || !b || !a.equals(c.root))
        }
      }
      var C = a ? this._.guardRTL : this._.guardLTR;
      i = f ? function (a, b) {
        return C(a, b) === false ? false : f(a, b)
      } : C;
      if (this.current)g = this.current[j](false, o, i); else {
        if (a)g.type ==
        CKEDITOR.NODE_ELEMENT && (g = d > 0 ? g.getChild(d - 1) : i(g, true) === false ? null : g.getPreviousSourceNode(true, o, i)); else {
          g = e;
          if (g.type == CKEDITOR.NODE_ELEMENT && !(g = g.getChild(l)))g = i(e, true) === false ? null : e.getNextSourceNode(true, o, i)
        }
        g && i(g) === false && (g = null)
      }
      for (; g && !this._.end;) {
        this.current = g;
        if (!this.evaluator || this.evaluator(g) !== false) {
          if (!b)return g
        } else if (b && this.evaluator)return false;
        g = g[j](false, o, i)
      }
      this.end();
      return this.current = null
    }

    function d(b) {
      for (var c, e = null; c = a.call(this, b);)e = c;
      return e
    }

    function b(a) {
      if (k(a))return false;
      if (a.type == CKEDITOR.NODE_TEXT)return true;
      if (a.type == CKEDITOR.NODE_ELEMENT) {
        if (a.is(CKEDITOR.dtd.$inline) || a.getAttribute("contenteditable") == "false")return true;
        var b;
        if (b = !CKEDITOR.env.needsBrFiller)if (b = a.is(l))a:{
          b = 0;
          for (var c = a.getChildCount(); b < c; ++b)if (!k(a.getChild(b))) {
            b = false;
            break a
          }
          b = true
        }
        if (b)return true
      }
      return false
    }

    CKEDITOR.dom.walker = CKEDITOR.tools.createClass({
      $: function (a) {
        this.range = a;
        this._ = {}
      }, proto: {
        end: function () {
          this._.end = 1
        }, next: function () {
          return a.call(this)
        },
        previous: function () {
          return a.call(this, 1)
        }, checkForward: function () {
          return a.call(this, 0, 1) !== false
        }, checkBackward: function () {
          return a.call(this, 1, 1) !== false
        }, lastForward: function () {
          return d.call(this)
        }, lastBackward: function () {
          return d.call(this, 1)
        }, reset: function () {
          delete this.current;
          this._ = {}
        }
      }
    });
    var c = {
      block: 1,
      "list-item": 1,
      table: 1,
      "table-row-group": 1,
      "table-header-group": 1,
      "table-footer-group": 1,
      "table-row": 1,
      "table-column-group": 1,
      "table-column": 1,
      "table-cell": 1,
      "table-caption": 1
    }, e = {
      absolute: 1,
      fixed: 1
    };
    CKEDITOR.dom.element.prototype.isBlockBoundary = function (a) {
      return this.getComputedStyle("float") == "none" && !(this.getComputedStyle("position")in e) && c[this.getComputedStyle("display")] ? true : !!(this.is(CKEDITOR.dtd.$block) || a && this.is(a))
    };
    CKEDITOR.dom.walker.blockBoundary = function (a) {
      return function (b) {
        return !(b.type == CKEDITOR.NODE_ELEMENT && b.isBlockBoundary(a))
      }
    };
    CKEDITOR.dom.walker.listItemBoundary = function () {
      return this.blockBoundary({br: 1})
    };
    CKEDITOR.dom.walker.bookmark = function (a, b) {
      function c(a) {
        return a &&
          a.getName && a.getName() == "span" && a.data("cke-bookmark")
      }

      return function (e) {
        var l, d;
        l = e && e.type != CKEDITOR.NODE_ELEMENT && (d = e.getParent()) && c(d);
        l = a ? l : l || c(e);
        return !!(b ^ l)
      }
    };
    CKEDITOR.dom.walker.whitespaces = function (a) {
      return function (b) {
        var c;
        b && b.type == CKEDITOR.NODE_TEXT && (c = !CKEDITOR.tools.trim(b.getText()) || CKEDITOR.env.webkit && b.getText() == "​");
        return !!(a ^ c)
      }
    };
    CKEDITOR.dom.walker.invisible = function (a) {
      var b = CKEDITOR.dom.walker.whitespaces();
      return function (c) {
        if (b(c))c = 1; else {
          c.type == CKEDITOR.NODE_TEXT &&
          (c = c.getParent());
          c = !c.$.offsetHeight
        }
        return !!(a ^ c)
      }
    };
    CKEDITOR.dom.walker.nodeType = function (a, b) {
      return function (c) {
        return !!(b ^ c.type == a)
      }
    };
    CKEDITOR.dom.walker.bogus = function (a) {
      function b(a) {
        return !h(a) && !n(a)
      }

      return function (c) {
        var e = CKEDITOR.env.needsBrFiller ? c.is && c.is("br") : c.getText && f.test(c.getText());
        if (e) {
          e = c.getParent();
          c = c.getNext(b);
          e = e.isBlockBoundary() && (!c || c.type == CKEDITOR.NODE_ELEMENT && c.isBlockBoundary())
        }
        return !!(a ^ e)
      }
    };
    CKEDITOR.dom.walker.temp = function (a) {
      return function (b) {
        b.type !=
        CKEDITOR.NODE_ELEMENT && (b = b.getParent());
        b = b && b.hasAttribute("data-cke-temp");
        return !!(a ^ b)
      }
    };
    var f = /^[\t\r\n ]*(?:&nbsp;|\xa0)$/, h = CKEDITOR.dom.walker.whitespaces(), n = CKEDITOR.dom.walker.bookmark(), j = CKEDITOR.dom.walker.temp();
    CKEDITOR.dom.walker.ignored = function (a) {
      return function (b) {
        b = h(b) || n(b) || j(b);
        return !!(a ^ b)
      }
    };
    var k = CKEDITOR.dom.walker.ignored(), l = function (a) {
      var b = {}, c;
      for (c in a)CKEDITOR.dtd[c]["#"] && (b[c] = 1);
      return b
    }(CKEDITOR.dtd.$block);
    CKEDITOR.dom.walker.editable = function (a) {
      return function (c) {
        return !!(a ^
        b(c))
      }
    };
    CKEDITOR.dom.element.prototype.getBogus = function () {
      var a = this;
      do a = a.getPreviousSourceNode(); while (n(a) || h(a) || a.type == CKEDITOR.NODE_ELEMENT && a.is(CKEDITOR.dtd.$inline) && !a.is(CKEDITOR.dtd.$empty));
      return a && (CKEDITOR.env.needsBrFiller ? a.is && a.is("br") : a.getText && f.test(a.getText())) ? a : false
    }
  })();
  CKEDITOR.dom.range = function (a) {
    this.endOffset = this.endContainer = this.startOffset = this.startContainer = null;
    this.collapsed = true;
    var d = a instanceof CKEDITOR.dom.document;
    this.document = d ? a : a.getDocument();
    this.root = d ? a.getBody() : a
  };
  (function () {
    function a() {
      var a = false, b = CKEDITOR.dom.walker.whitespaces(), c = CKEDITOR.dom.walker.bookmark(true), e = CKEDITOR.dom.walker.bogus();
      return function (g) {
        if (c(g) || b(g))return true;
        if (e(g) && !a)return a = true;
        return g.type == CKEDITOR.NODE_TEXT && (g.hasAscendant("pre") || CKEDITOR.tools.trim(g.getText()).length) || g.type == CKEDITOR.NODE_ELEMENT && !g.is(f) ? false : true
      }
    }

    function d(a) {
      var b = CKEDITOR.dom.walker.whitespaces(), c = CKEDITOR.dom.walker.bookmark(1);
      return function (e) {
        return c(e) || b(e) ? true : !a && h(e) ||
        e.type == CKEDITOR.NODE_ELEMENT && e.is(CKEDITOR.dtd.$removeEmpty)
      }
    }

    function b(a) {
      return function () {
        var b;
        return this[a ? "getPreviousNode" : "getNextNode"](function (a) {
          !b && k(a) && (b = a);
          return j(a) && !(h(a) && a.equals(b))
        })
      }
    }

    var c = function (a) {
      a.collapsed = a.startContainer && a.endContainer && a.startContainer.equals(a.endContainer) && a.startOffset == a.endOffset
    }, e = function (a, b, c, e) {
      a.optimizeBookmark();
      var g = a.startContainer, d = a.endContainer, f = a.startOffset, m = a.endOffset, i, q;
      if (d.type == CKEDITOR.NODE_TEXT)d = d.split(m);
      else if (d.getChildCount() > 0)if (m >= d.getChildCount()) {
        d = d.append(a.document.createText(""));
        q = true
      } else d = d.getChild(m);
      if (g.type == CKEDITOR.NODE_TEXT) {
        g.split(f);
        g.equals(d) && (d = g.getNext())
      } else if (f)if (f >= g.getChildCount()) {
        g = g.append(a.document.createText(""));
        i = true
      } else g = g.getChild(f).getPrevious(); else {
        g = g.append(a.document.createText(""), 1);
        i = true
      }
      var f = g.getParents(), m = d.getParents(), o, j, p;
      for (o = 0; o < f.length; o++) {
        j = f[o];
        p = m[o];
        if (!j.equals(p))break
      }
      for (var h = c, k, n, C, x = o; x < f.length; x++) {
        k =
          f[x];
        h && !k.equals(g) && (n = h.append(k.clone()));
        for (k = k.getNext(); k;) {
          if (k.equals(m[x]) || k.equals(d))break;
          C = k.getNext();
          if (b == 2)h.append(k.clone(true)); else {
            k.remove();
            b == 1 && h.append(k)
          }
          k = C
        }
        h && (h = n)
      }
      h = c;
      for (c = o; c < m.length; c++) {
        k = m[c];
        b > 0 && !k.equals(d) && (n = h.append(k.clone()));
        if (!f[c] || k.$.parentNode != f[c].$.parentNode)for (k = k.getPrevious(); k;) {
          if (k.equals(f[c]) || k.equals(g))break;
          C = k.getPrevious();
          if (b == 2)h.$.insertBefore(k.$.cloneNode(true), h.$.firstChild); else {
            k.remove();
            b == 1 && h.$.insertBefore(k.$,
              h.$.firstChild)
          }
          k = C
        }
        h && (h = n)
      }
      if (b == 2) {
        j = a.startContainer;
        if (j.type == CKEDITOR.NODE_TEXT) {
          j.$.data = j.$.data + j.$.nextSibling.data;
          j.$.parentNode.removeChild(j.$.nextSibling)
        }
        a = a.endContainer;
        if (a.type == CKEDITOR.NODE_TEXT && a.$.nextSibling) {
          a.$.data = a.$.data + a.$.nextSibling.data;
          a.$.parentNode.removeChild(a.$.nextSibling)
        }
      } else {
        if (j && p && (g.$.parentNode != j.$.parentNode || d.$.parentNode != p.$.parentNode)) {
          b = p.getIndex();
          i && p.$.parentNode == g.$.parentNode && b--;
          if (e && j.type == CKEDITOR.NODE_ELEMENT) {
            e = CKEDITOR.dom.element.createFromHtml('<span data-cke-bookmark="1" style="display:none">&nbsp;</span>',
              a.document);
            e.insertAfter(j);
            j.mergeSiblings(false);
            a.moveToBookmark({startNode: e})
          } else a.setStart(p.getParent(), b)
        }
        a.collapse(true)
      }
      i && g.remove();
      q && d.$.parentNode && d.remove()
    }, f = {
      abbr: 1,
      acronym: 1,
      b: 1,
      bdo: 1,
      big: 1,
      cite: 1,
      code: 1,
      del: 1,
      dfn: 1,
      em: 1,
      font: 1,
      i: 1,
      ins: 1,
      label: 1,
      kbd: 1,
      q: 1,
      samp: 1,
      small: 1,
      span: 1,
      strike: 1,
      strong: 1,
      sub: 1,
      sup: 1,
      tt: 1,
      u: 1,
      "var": 1
    }, h = CKEDITOR.dom.walker.bogus(), n = /^[\t\r\n ]*(?:&nbsp;|\xa0)$/, j = CKEDITOR.dom.walker.editable(), k = CKEDITOR.dom.walker.ignored(true);
    CKEDITOR.dom.range.prototype =
    {
      clone: function () {
        var a = new CKEDITOR.dom.range(this.root);
        a.startContainer = this.startContainer;
        a.startOffset = this.startOffset;
        a.endContainer = this.endContainer;
        a.endOffset = this.endOffset;
        a.collapsed = this.collapsed;
        return a
      }, collapse: function (a) {
      if (a) {
        this.endContainer = this.startContainer;
        this.endOffset = this.startOffset
      } else {
        this.startContainer = this.endContainer;
        this.startOffset = this.endOffset
      }
      this.collapsed = true
    }, cloneContents: function () {
      var a = new CKEDITOR.dom.documentFragment(this.document);
      this.collapsed ||
      e(this, 2, a);
      return a
    }, deleteContents: function (a) {
      this.collapsed || e(this, 0, null, a)
    }, extractContents: function (a) {
      var b = new CKEDITOR.dom.documentFragment(this.document);
      this.collapsed || e(this, 1, b, a);
      return b
    }, createBookmark: function (a) {
      var b, c, e, g, d = this.collapsed;
      b = this.document.createElement("span");
      b.data("cke-bookmark", 1);
      b.setStyle("display", "none");
      b.setHtml("&nbsp;");
      if (a) {
        e = "cke_bm_" + CKEDITOR.tools.getNextNumber();
        b.setAttribute("id", e + (d ? "C" : "S"))
      }
      if (!d) {
        c = b.clone();
        c.setHtml("&nbsp;");
        a && c.setAttribute("id",
          e + "E");
        g = this.clone();
        g.collapse();
        g.insertNode(c)
      }
      g = this.clone();
      g.collapse(true);
      g.insertNode(b);
      if (c) {
        this.setStartAfter(b);
        this.setEndBefore(c)
      } else this.moveToPosition(b, CKEDITOR.POSITION_AFTER_END);
      return {startNode: a ? e + (d ? "C" : "S") : b, endNode: a ? e + "E" : c, serializable: a, collapsed: d}
    }, createBookmark2: function () {
      function a(b) {
        var c = b.container, e = b.offset, g;
        g = c;
        var d = e;
        g = g.type != CKEDITOR.NODE_ELEMENT || d === 0 || d == g.getChildCount() ? 0 : g.getChild(d - 1).type == CKEDITOR.NODE_TEXT && g.getChild(d).type == CKEDITOR.NODE_TEXT;
        if (g) {
          c = c.getChild(e - 1);
          e = c.getLength()
        }
        c.type == CKEDITOR.NODE_ELEMENT && e > 1 && (e = c.getChild(e - 1).getIndex(true) + 1);
        if (c.type == CKEDITOR.NODE_TEXT) {
          g = c;
          for (d = 0; (g = g.getPrevious()) && g.type == CKEDITOR.NODE_TEXT;)d = d + g.getLength();
          e = e + d
        }
        b.container = c;
        b.offset = e
      }

      return function (b) {
        var c = this.collapsed, e = {
          container: this.startContainer,
          offset: this.startOffset
        }, g = {container: this.endContainer, offset: this.endOffset};
        if (b) {
          a(e);
          c || a(g)
        }
        return {
          start: e.container.getAddress(b), end: c ? null : g.container.getAddress(b),
          startOffset: e.offset, endOffset: g.offset, normalized: b, collapsed: c, is2: true
        }
      }
    }(), moveToBookmark: function (a) {
      if (a.is2) {
        var b = this.document.getByAddress(a.start, a.normalized), c = a.startOffset, e = a.end && this.document.getByAddress(a.end, a.normalized), a = a.endOffset;
        this.setStart(b, c);
        e ? this.setEnd(e, a) : this.collapse(true)
      } else {
        b = (c = a.serializable) ? this.document.getById(a.startNode) : a.startNode;
        a = c ? this.document.getById(a.endNode) : a.endNode;
        this.setStartBefore(b);
        b.remove();
        if (a) {
          this.setEndBefore(a);
          a.remove()
        } else this.collapse(true)
      }
    },
      getBoundaryNodes: function () {
        var a = this.startContainer, b = this.endContainer, c = this.startOffset, e = this.endOffset, g;
        if (a.type == CKEDITOR.NODE_ELEMENT) {
          g = a.getChildCount();
          if (g > c)a = a.getChild(c); else if (g < 1)a = a.getPreviousSourceNode(); else {
            for (a = a.$; a.lastChild;)a = a.lastChild;
            a = new CKEDITOR.dom.node(a);
            a = a.getNextSourceNode() || a
          }
        }
        if (b.type == CKEDITOR.NODE_ELEMENT) {
          g = b.getChildCount();
          if (g > e)b = b.getChild(e).getPreviousSourceNode(true); else if (g < 1)b = b.getPreviousSourceNode(); else {
            for (b = b.$; b.lastChild;)b =
              b.lastChild;
            b = new CKEDITOR.dom.node(b)
          }
        }
        a.getPosition(b) & CKEDITOR.POSITION_FOLLOWING && (a = b);
        return {startNode: a, endNode: b}
      }, getCommonAncestor: function (a, b) {
      var c = this.startContainer, e = this.endContainer, c = c.equals(e) ? a && c.type == CKEDITOR.NODE_ELEMENT && this.startOffset == this.endOffset - 1 ? c.getChild(this.startOffset) : c : c.getCommonAncestor(e);
      return b && !c.is ? c.getParent() : c
    }, optimize: function () {
      var a = this.startContainer, b = this.startOffset;
      a.type != CKEDITOR.NODE_ELEMENT && (b ? b >= a.getLength() && this.setStartAfter(a) :
        this.setStartBefore(a));
      a = this.endContainer;
      b = this.endOffset;
      a.type != CKEDITOR.NODE_ELEMENT && (b ? b >= a.getLength() && this.setEndAfter(a) : this.setEndBefore(a))
    }, optimizeBookmark: function () {
      var a = this.startContainer, b = this.endContainer;
      a.is && (a.is("span") && a.data("cke-bookmark")) && this.setStartAt(a, CKEDITOR.POSITION_BEFORE_START);
      b && (b.is && b.is("span") && b.data("cke-bookmark")) && this.setEndAt(b, CKEDITOR.POSITION_AFTER_END)
    }, trim: function (a, b) {
      var c = this.startContainer, e = this.startOffset, g = this.collapsed;
      if ((!a || g) && c && c.type == CKEDITOR.NODE_TEXT) {
        if (e)if (e >= c.getLength()) {
          e = c.getIndex() + 1;
          c = c.getParent()
        } else {
          var d = c.split(e), e = c.getIndex() + 1, c = c.getParent();
          if (this.startContainer.equals(this.endContainer))this.setEnd(d, this.endOffset - this.startOffset); else if (c.equals(this.endContainer))this.endOffset = this.endOffset + 1
        } else {
          e = c.getIndex();
          c = c.getParent()
        }
        this.setStart(c, e);
        if (g) {
          this.collapse(true);
          return
        }
      }
      c = this.endContainer;
      e = this.endOffset;
      if (!b && !g && c && c.type == CKEDITOR.NODE_TEXT) {
        if (e) {
          e >= c.getLength() ||
          c.split(e);
          e = c.getIndex() + 1
        } else e = c.getIndex();
        c = c.getParent();
        this.setEnd(c, e)
      }
    }, enlarge: function (a, b) {
      function c(a) {
        return a && a.type == CKEDITOR.NODE_ELEMENT && a.hasAttribute("contenteditable") ? null : a
      }

      switch (a) {
        case CKEDITOR.ENLARGE_INLINE:
          var e = 1;
        case CKEDITOR.ENLARGE_ELEMENT:
          if (this.collapsed)break;
          var g = this.getCommonAncestor(), d = this.root, f, m, i, q, o, j = false, p, k;
          p = this.startContainer;
          k = this.startOffset;
          if (p.type == CKEDITOR.NODE_TEXT) {
            if (k) {
              p = !CKEDITOR.tools.trim(p.substring(0, k)).length && p;
              j = !!p
            }
            if (p && !(q = p.getPrevious()))i = p.getParent()
          } else {
            k && (q = p.getChild(k - 1) || p.getLast());
            q || (i = p)
          }
          for (i = c(i); i || q;) {
            if (i && !q) {
              !o && i.equals(g) && (o = true);
              if (e ? i.isBlockBoundary() : !d.contains(i))break;
              if (!j || i.getComputedStyle("display") != "inline") {
                j = false;
                o ? f = i : this.setStartBefore(i)
              }
              q = i.getPrevious()
            }
            for (; q;) {
              p = false;
              if (q.type == CKEDITOR.NODE_COMMENT)q = q.getPrevious(); else {
                if (q.type == CKEDITOR.NODE_TEXT) {
                  k = q.getText();
                  /[^\s\ufeff]/.test(k) && (q = null);
                  p = /[\s\ufeff]$/.test(k)
                } else if ((q.$.offsetWidth > 0 || b && q.is("br")) && !q.data("cke-bookmark"))if (j && CKEDITOR.dtd.$removeEmpty[q.getName()]) {
                  k = q.getText();
                  if (/[^\s\ufeff]/.test(k))q = null; else for (var h = q.$.getElementsByTagName("*"), n = 0, C; C = h[n++];)if (!CKEDITOR.dtd.$removeEmpty[C.nodeName.toLowerCase()]) {
                    q = null;
                    break
                  }
                  q && (p = !!k.length)
                } else q = null;
                p && (j ? o ? f = i : i && this.setStartBefore(i) : j = true);
                if (q) {
                  p = q.getPrevious();
                  if (!i && !p) {
                    i = q;
                    q = null;
                    break
                  }
                  q = p
                } else i = null
              }
            }
            i && (i = c(i.getParent()))
          }
          p = this.endContainer;
          k = this.endOffset;
          i = q = null;
          o = j = false;
          if (p.type == CKEDITOR.NODE_TEXT) {
            p =
              !CKEDITOR.tools.trim(p.substring(k)).length && p;
            j = !(p && p.getLength());
            if (p && !(q = p.getNext()))i = p.getParent()
          } else(q = p.getChild(k)) || (i = p);
          for (; i || q;) {
            if (i && !q) {
              !o && i.equals(g) && (o = true);
              if (e ? i.isBlockBoundary() : !d.contains(i))break;
              if (!j || i.getComputedStyle("display") != "inline") {
                j = false;
                o ? m = i : i && this.setEndAfter(i)
              }
              q = i.getNext()
            }
            for (; q;) {
              p = false;
              if (q.type == CKEDITOR.NODE_TEXT) {
                k = q.getText();
                /[^\s\ufeff]/.test(k) && (q = null);
                p = /^[\s\ufeff]/.test(k)
              } else if (q.type == CKEDITOR.NODE_ELEMENT) {
                if ((q.$.offsetWidth >
                  0 || b && q.is("br")) && !q.data("cke-bookmark"))if (j && CKEDITOR.dtd.$removeEmpty[q.getName()]) {
                  k = q.getText();
                  if (/[^\s\ufeff]/.test(k))q = null; else {
                    h = q.$.getElementsByTagName("*");
                    for (n = 0; C = h[n++];)if (!CKEDITOR.dtd.$removeEmpty[C.nodeName.toLowerCase()]) {
                      q = null;
                      break
                    }
                  }
                  q && (p = !!k.length)
                } else q = null
              } else p = 1;
              p && j && (o ? m = i : this.setEndAfter(i));
              if (q) {
                p = q.getNext();
                if (!i && !p) {
                  i = q;
                  q = null;
                  break
                }
                q = p
              } else i = null
            }
            i && (i = c(i.getParent()))
          }
          if (f && m) {
            g = f.contains(m) ? m : f;
            this.setStartBefore(g);
            this.setEndAfter(g)
          }
          break;
        case CKEDITOR.ENLARGE_BLOCK_CONTENTS:
        case CKEDITOR.ENLARGE_LIST_ITEM_CONTENTS:
          i =
            new CKEDITOR.dom.range(this.root);
          d = this.root;
          i.setStartAt(d, CKEDITOR.POSITION_AFTER_START);
          i.setEnd(this.startContainer, this.startOffset);
          i = new CKEDITOR.dom.walker(i);
          var x, M, y = CKEDITOR.dom.walker.blockBoundary(a == CKEDITOR.ENLARGE_LIST_ITEM_CONTENTS ? {br: 1} : null), v = null, D = function (a) {
            if (a.type == CKEDITOR.NODE_ELEMENT && a.getAttribute("contenteditable") == "false")if (v) {
              if (v.equals(a)) {
                v = null;
                return
              }
            } else v = a; else if (v)return;
            var b = y(a);
            b || (x = a);
            return b
          }, e = function (a) {
            var b = D(a);
            !b && (a.is && a.is("br")) &&
            (M = a);
            return b
          };
          i.guard = D;
          i = i.lastBackward();
          x = x || d;
          this.setStartAt(x, !x.is("br") && (!i && this.checkStartOfBlock() || i && x.contains(i)) ? CKEDITOR.POSITION_AFTER_START : CKEDITOR.POSITION_AFTER_END);
          if (a == CKEDITOR.ENLARGE_LIST_ITEM_CONTENTS) {
            i = this.clone();
            i = new CKEDITOR.dom.walker(i);
            var F = CKEDITOR.dom.walker.whitespaces(), z = CKEDITOR.dom.walker.bookmark();
            i.evaluator = function (a) {
              return !F(a) && !z(a)
            };
            if ((i = i.previous()) && i.type == CKEDITOR.NODE_ELEMENT && i.is("br"))break
          }
          i = this.clone();
          i.collapse();
          i.setEndAt(d,
            CKEDITOR.POSITION_BEFORE_END);
          i = new CKEDITOR.dom.walker(i);
          i.guard = a == CKEDITOR.ENLARGE_LIST_ITEM_CONTENTS ? e : D;
          x = null;
          i = i.lastForward();
          x = x || d;
          this.setEndAt(x, !i && this.checkEndOfBlock() || i && x.contains(i) ? CKEDITOR.POSITION_BEFORE_END : CKEDITOR.POSITION_BEFORE_START);
          M && this.setEndAfter(M)
      }
    }, shrink: function (a, b, c) {
      if (!this.collapsed) {
        var a = a || CKEDITOR.SHRINK_TEXT, e = this.clone(), g = this.startContainer, d = this.endContainer, f = this.startOffset, m = this.endOffset, i = 1, q = 1;
        if (g && g.type == CKEDITOR.NODE_TEXT)if (f)if (f >=
          g.getLength())e.setStartAfter(g); else {
          e.setStartBefore(g);
          i = 0
        } else e.setStartBefore(g);
        if (d && d.type == CKEDITOR.NODE_TEXT)if (m)if (m >= d.getLength())e.setEndAfter(d); else {
          e.setEndAfter(d);
          q = 0
        } else e.setEndBefore(d);
        var e = new CKEDITOR.dom.walker(e), o = CKEDITOR.dom.walker.bookmark();
        e.evaluator = function (b) {
          return b.type == (a == CKEDITOR.SHRINK_ELEMENT ? CKEDITOR.NODE_ELEMENT : CKEDITOR.NODE_TEXT)
        };
        var k;
        e.guard = function (b, e) {
          if (o(b))return true;
          if (a == CKEDITOR.SHRINK_ELEMENT && b.type == CKEDITOR.NODE_TEXT || e && b.equals(k) ||
            c === false && b.type == CKEDITOR.NODE_ELEMENT && b.isBlockBoundary() || b.type == CKEDITOR.NODE_ELEMENT && b.hasAttribute("contenteditable"))return false;
          !e && b.type == CKEDITOR.NODE_ELEMENT && (k = b);
          return true
        };
        if (i)(g = e[a == CKEDITOR.SHRINK_ELEMENT ? "lastForward" : "next"]()) && this.setStartAt(g, b ? CKEDITOR.POSITION_AFTER_START : CKEDITOR.POSITION_BEFORE_START);
        if (q) {
          e.reset();
          (e = e[a == CKEDITOR.SHRINK_ELEMENT ? "lastBackward" : "previous"]()) && this.setEndAt(e, b ? CKEDITOR.POSITION_BEFORE_END : CKEDITOR.POSITION_AFTER_END)
        }
        return !(!i && !q)
      }
    }, insertNode: function (a) {
      this.optimizeBookmark();
      this.trim(false, true);
      var b = this.startContainer, c = b.getChild(this.startOffset);
      c ? a.insertBefore(c) : b.append(a);
      a.getParent() && a.getParent().equals(this.endContainer) && this.endOffset++;
      this.setStartBefore(a)
    }, moveToPosition: function (a, b) {
      this.setStartAt(a, b);
      this.collapse(true)
    }, moveToRange: function (a) {
      this.setStart(a.startContainer, a.startOffset);
      this.setEnd(a.endContainer, a.endOffset)
    }, selectNodeContents: function (a) {
      this.setStart(a, 0);
      this.setEnd(a,
        a.type == CKEDITOR.NODE_TEXT ? a.getLength() : a.getChildCount())
    }, setStart: function (a, b) {
      if (a.type == CKEDITOR.NODE_ELEMENT && CKEDITOR.dtd.$empty[a.getName()]) {
        b = a.getIndex();
        a = a.getParent()
      }
      this.startContainer = a;
      this.startOffset = b;
      if (!this.endContainer) {
        this.endContainer = a;
        this.endOffset = b
      }
      c(this)
    }, setEnd: function (a, b) {
      if (a.type == CKEDITOR.NODE_ELEMENT && CKEDITOR.dtd.$empty[a.getName()]) {
        b = a.getIndex() + 1;
        a = a.getParent()
      }
      this.endContainer = a;
      this.endOffset = b;
      if (!this.startContainer) {
        this.startContainer = a;
        this.startOffset =
          b
      }
      c(this)
    }, setStartAfter: function (a) {
      this.setStart(a.getParent(), a.getIndex() + 1)
    }, setStartBefore: function (a) {
      this.setStart(a.getParent(), a.getIndex())
    }, setEndAfter: function (a) {
      this.setEnd(a.getParent(), a.getIndex() + 1)
    }, setEndBefore: function (a) {
      this.setEnd(a.getParent(), a.getIndex())
    }, setStartAt: function (a, b) {
      switch (b) {
        case CKEDITOR.POSITION_AFTER_START:
          this.setStart(a, 0);
          break;
        case CKEDITOR.POSITION_BEFORE_END:
          a.type == CKEDITOR.NODE_TEXT ? this.setStart(a, a.getLength()) : this.setStart(a, a.getChildCount());
          break;
        case CKEDITOR.POSITION_BEFORE_START:
          this.setStartBefore(a);
          break;
        case CKEDITOR.POSITION_AFTER_END:
          this.setStartAfter(a)
      }
      c(this)
    }, setEndAt: function (a, b) {
      switch (b) {
        case CKEDITOR.POSITION_AFTER_START:
          this.setEnd(a, 0);
          break;
        case CKEDITOR.POSITION_BEFORE_END:
          a.type == CKEDITOR.NODE_TEXT ? this.setEnd(a, a.getLength()) : this.setEnd(a, a.getChildCount());
          break;
        case CKEDITOR.POSITION_BEFORE_START:
          this.setEndBefore(a);
          break;
        case CKEDITOR.POSITION_AFTER_END:
          this.setEndAfter(a)
      }
      c(this)
    }, fixBlock: function (a, b) {
      var c =
        this.createBookmark(), e = this.document.createElement(b);
      this.collapse(a);
      this.enlarge(CKEDITOR.ENLARGE_BLOCK_CONTENTS);
      this.extractContents().appendTo(e);
      e.trim();
      e.appendBogus();
      this.insertNode(e);
      this.moveToBookmark(c);
      return e
    }, splitBlock: function (a) {
      var b = new CKEDITOR.dom.elementPath(this.startContainer, this.root), c = new CKEDITOR.dom.elementPath(this.endContainer, this.root), e = b.block, d = c.block, f = null;
      if (!b.blockLimit.equals(c.blockLimit))return null;
      if (a != "br") {
        if (!e) {
          e = this.fixBlock(true, a);
          d =
            (new CKEDITOR.dom.elementPath(this.endContainer, this.root)).block
        }
        d || (d = this.fixBlock(false, a))
      }
      a = e && this.checkStartOfBlock();
      b = d && this.checkEndOfBlock();
      this.deleteContents();
      if (e && e.equals(d))if (b) {
        f = new CKEDITOR.dom.elementPath(this.startContainer, this.root);
        this.moveToPosition(d, CKEDITOR.POSITION_AFTER_END);
        d = null
      } else if (a) {
        f = new CKEDITOR.dom.elementPath(this.startContainer, this.root);
        this.moveToPosition(e, CKEDITOR.POSITION_BEFORE_START);
        e = null
      } else {
        d = this.splitElement(e);
        e.is("ul", "ol") || e.appendBogus()
      }
      return {
        previousBlock: e,
        nextBlock: d, wasStartOfBlock: a, wasEndOfBlock: b, elementPath: f
      }
    }, splitElement: function (a) {
      if (!this.collapsed)return null;
      this.setEndAt(a, CKEDITOR.POSITION_BEFORE_END);
      var b = this.extractContents(), c = a.clone(false);
      b.appendTo(c);
      c.insertAfter(a);
      this.moveToPosition(a, CKEDITOR.POSITION_AFTER_END);
      return c
    }, removeEmptyBlocksAtEnd: function () {
      function a(e) {
        return function (a) {
          return b(a) || (c(a) || a.type == CKEDITOR.NODE_ELEMENT && a.isEmptyInlineRemoveable()) || e.is("table") && a.is("caption") ? false : true
        }
      }

      var b = CKEDITOR.dom.walker.whitespaces(),
        c = CKEDITOR.dom.walker.bookmark(false);
      return function (b) {
        for (var c = this.createBookmark(), e = this[b ? "endPath" : "startPath"](), d = e.block || e.blockLimit, f; d && !d.equals(e.root) && !d.getFirst(a(d));) {
          f = d.getParent();
          this[b ? "setEndAt" : "setStartAt"](d, CKEDITOR.POSITION_AFTER_END);
          d.remove(1);
          d = f
        }
        this.moveToBookmark(c)
      }
    }(), startPath: function () {
      return new CKEDITOR.dom.elementPath(this.startContainer, this.root)
    }, endPath: function () {
      return new CKEDITOR.dom.elementPath(this.endContainer, this.root)
    }, checkBoundaryOfElement: function (a,
                                         b) {
      var c = b == CKEDITOR.START, e = this.clone();
      e.collapse(c);
      e[c ? "setStartAt" : "setEndAt"](a, c ? CKEDITOR.POSITION_AFTER_START : CKEDITOR.POSITION_BEFORE_END);
      e = new CKEDITOR.dom.walker(e);
      e.evaluator = d(c);
      return e[c ? "checkBackward" : "checkForward"]()
    }, checkStartOfBlock: function () {
      var b = this.startContainer, c = this.startOffset;
      if (CKEDITOR.env.ie && c && b.type == CKEDITOR.NODE_TEXT) {
        b = CKEDITOR.tools.ltrim(b.substring(0, c));
        n.test(b) && this.trim(0, 1)
      }
      this.trim();
      b = new CKEDITOR.dom.elementPath(this.startContainer, this.root);
      c = this.clone();
      c.collapse(true);
      c.setStartAt(b.block || b.blockLimit, CKEDITOR.POSITION_AFTER_START);
      b = new CKEDITOR.dom.walker(c);
      b.evaluator = a();
      return b.checkBackward()
    }, checkEndOfBlock: function () {
      var b = this.endContainer, c = this.endOffset;
      if (CKEDITOR.env.ie && b.type == CKEDITOR.NODE_TEXT) {
        b = CKEDITOR.tools.rtrim(b.substring(c));
        n.test(b) && this.trim(1, 0)
      }
      this.trim();
      b = new CKEDITOR.dom.elementPath(this.endContainer, this.root);
      c = this.clone();
      c.collapse(false);
      c.setEndAt(b.block || b.blockLimit, CKEDITOR.POSITION_BEFORE_END);
      b = new CKEDITOR.dom.walker(c);
      b.evaluator = a();
      return b.checkForward()
    }, getPreviousNode: function (a, b, c) {
      var e = this.clone();
      e.collapse(1);
      e.setStartAt(c || this.root, CKEDITOR.POSITION_AFTER_START);
      c = new CKEDITOR.dom.walker(e);
      c.evaluator = a;
      c.guard = b;
      return c.previous()
    }, getNextNode: function (a, b, c) {
      var e = this.clone();
      e.collapse();
      e.setEndAt(c || this.root, CKEDITOR.POSITION_BEFORE_END);
      c = new CKEDITOR.dom.walker(e);
      c.evaluator = a;
      c.guard = b;
      return c.next()
    }, checkReadOnly: function () {
      function a(b, c) {
        for (; b;) {
          if (b.type ==
            CKEDITOR.NODE_ELEMENT) {
            if (b.getAttribute("contentEditable") == "false" && !b.data("cke-editable"))return 0;
            if (b.is("html") || b.getAttribute("contentEditable") == "true" && (b.contains(c) || b.equals(c)))break
          }
          b = b.getParent()
        }
        return 1
      }

      return function () {
        var b = this.startContainer, c = this.endContainer;
        return !(a(b, c) && a(c, b))
      }
    }(), moveToElementEditablePosition: function (a, b) {
      if (a.type == CKEDITOR.NODE_ELEMENT && !a.isEditable(false)) {
        this.moveToPosition(a, b ? CKEDITOR.POSITION_AFTER_END : CKEDITOR.POSITION_BEFORE_START);
        return true
      }
      for (var c =
        0; a;) {
        if (a.type == CKEDITOR.NODE_TEXT) {
          b && this.endContainer && this.checkEndOfBlock() && n.test(a.getText()) ? this.moveToPosition(a, CKEDITOR.POSITION_BEFORE_START) : this.moveToPosition(a, b ? CKEDITOR.POSITION_AFTER_END : CKEDITOR.POSITION_BEFORE_START);
          c = 1;
          break
        }
        if (a.type == CKEDITOR.NODE_ELEMENT)if (a.isEditable()) {
          this.moveToPosition(a, b ? CKEDITOR.POSITION_BEFORE_END : CKEDITOR.POSITION_AFTER_START);
          c = 1
        } else if (b && a.is("br") && this.endContainer && this.checkEndOfBlock())this.moveToPosition(a, CKEDITOR.POSITION_BEFORE_START);
        else if (a.getAttribute("contenteditable") == "false" && a.is(CKEDITOR.dtd.$block)) {
          this.setStartBefore(a);
          this.setEndAfter(a);
          return true
        }
        var e = a, d = c, f = void 0;
        e.type == CKEDITOR.NODE_ELEMENT && e.isEditable(false) && (f = e[b ? "getLast" : "getFirst"](k));
        !d && !f && (f = e[b ? "getPrevious" : "getNext"](k));
        a = f
      }
      return !!c
    }, moveToClosestEditablePosition: function (a, b) {
      var c = new CKEDITOR.dom.range(this.root), e = 0, d, f = [CKEDITOR.POSITION_AFTER_END, CKEDITOR.POSITION_BEFORE_START];
      c.moveToPosition(a, f[b ? 0 : 1]);
      if (a.is(CKEDITOR.dtd.$block)) {
        if (d =
            c[b ? "getNextEditableNode" : "getPreviousEditableNode"]()) {
          e = 1;
          if (d.type == CKEDITOR.NODE_ELEMENT && d.is(CKEDITOR.dtd.$block) && d.getAttribute("contenteditable") == "false") {
            c.setStartAt(d, CKEDITOR.POSITION_BEFORE_START);
            c.setEndAt(d, CKEDITOR.POSITION_AFTER_END)
          } else c.moveToPosition(d, f[b ? 1 : 0])
        }
      } else e = 1;
      e && this.moveToRange(c);
      return !!e
    }, moveToElementEditStart: function (a) {
      return this.moveToElementEditablePosition(a)
    }, moveToElementEditEnd: function (a) {
      return this.moveToElementEditablePosition(a, true)
    }, getEnclosedNode: function () {
      var a =
        this.clone();
      a.optimize();
      if (a.startContainer.type != CKEDITOR.NODE_ELEMENT || a.endContainer.type != CKEDITOR.NODE_ELEMENT)return null;
      var a = new CKEDITOR.dom.walker(a), b = CKEDITOR.dom.walker.bookmark(false, true), c = CKEDITOR.dom.walker.whitespaces(true);
      a.evaluator = function (a) {
        return c(a) && b(a)
      };
      var e = a.next();
      a.reset();
      return e && e.equals(a.previous()) ? e : null
    }, getTouchedStartNode: function () {
      var a = this.startContainer;
      return this.collapsed || a.type != CKEDITOR.NODE_ELEMENT ? a : a.getChild(this.startOffset) || a
    }, getTouchedEndNode: function () {
      var a =
        this.endContainer;
      return this.collapsed || a.type != CKEDITOR.NODE_ELEMENT ? a : a.getChild(this.endOffset - 1) || a
    }, getNextEditableNode: b(), getPreviousEditableNode: b(1), scrollIntoView: function () {
      var a = new CKEDITOR.dom.element.createFromHtml("<span>&nbsp;</span>", this.document), b, c, e, d = this.clone();
      d.optimize();
      if (e = d.startContainer.type == CKEDITOR.NODE_TEXT) {
        c = d.startContainer.getText();
        b = d.startContainer.split(d.startOffset);
        a.insertAfter(d.startContainer)
      } else d.insertNode(a);
      a.scrollIntoView();
      if (e) {
        d.startContainer.setText(c);
        b.remove()
      }
      a.remove()
    }
    }
  })();
  CKEDITOR.POSITION_AFTER_START = 1;
  CKEDITOR.POSITION_BEFORE_END = 2;
  CKEDITOR.POSITION_BEFORE_START = 3;
  CKEDITOR.POSITION_AFTER_END = 4;
  CKEDITOR.ENLARGE_ELEMENT = 1;
  CKEDITOR.ENLARGE_BLOCK_CONTENTS = 2;
  CKEDITOR.ENLARGE_LIST_ITEM_CONTENTS = 3;
  CKEDITOR.ENLARGE_INLINE = 4;
  CKEDITOR.START = 1;
  CKEDITOR.END = 2;
  CKEDITOR.SHRINK_ELEMENT = 1;
  CKEDITOR.SHRINK_TEXT = 2;
  "use strict";
  (function () {
    function a(a) {
      if (!(arguments.length < 1)) {
        this.range = a;
        this.forceBrBreak = 0;
        this.enlargeBr = 1;
        this.enforceRealBlocks = 0;
        this._ || (this._ = {})
      }
    }

    function d(a, b, c) {
      for (a = a.getNextSourceNode(b, null, c); !f(a);)a = a.getNextSourceNode(b, null, c);
      return a
    }

    function b(a) {
      var b = [];
      a.forEach(function (a) {
        if (a.getAttribute("contenteditable") == "true") {
          b.push(a);
          return false
        }
      }, CKEDITOR.NODE_ELEMENT, true);
      return b
    }

    function c(a, e, d, f) {
      a:{
        f == void 0 && (f = b(d));
        for (var h; h = f.shift();)if (h.getDtd().p) {
          f = {element: h, remaining: f};
          break a
        }
        f = null
      }
      if (!f)return 0;
      if ((h = CKEDITOR.filter.instances[f.element.data("cke-filter")]) && !h.check(e))return c(a, e, d, f.remaining);
      e = new CKEDITOR.dom.range(f.element);
      e.selectNodeContents(f.element);
      e = e.createIterator();
      e.enlargeBr = a.enlargeBr;
      e.enforceRealBlocks = a.enforceRealBlocks;
      e.activeFilter = e.filter = h;
      a._.nestedEditable = {element: f.element, container: d, remaining: f.remaining, iterator: e};
      return 1
    }

    var e = /^[\r\n\t ]+$/, f = CKEDITOR.dom.walker.bookmark(false, true), h = CKEDITOR.dom.walker.whitespaces(true),
      n = function (a) {
        return f(a) && h(a)
      };
    a.prototype = {
      getNextParagraph: function (a) {
        var b, h, u, s, t, a = a || "p";
        if (this._.nestedEditable) {
          if (b = this._.nestedEditable.iterator.getNextParagraph(a)) {
            this.activeFilter = this._.nestedEditable.iterator.activeFilter;
            return b
          }
          this.activeFilter = this.filter;
          if (c(this, a, this._.nestedEditable.container, this._.nestedEditable.remaining)) {
            this.activeFilter = this._.nestedEditable.iterator.activeFilter;
            return this._.nestedEditable.iterator.getNextParagraph(a)
          }
          this._.nestedEditable =
            null
        }
        if (!this.range.root.getDtd()[a])return null;
        if (!this._.started) {
          var g = this.range.clone();
          g.shrink(CKEDITOR.SHRINK_ELEMENT, true);
          h = g.endContainer.hasAscendant("pre", true) || g.startContainer.hasAscendant("pre", true);
          g.enlarge(this.forceBrBreak && !h || !this.enlargeBr ? CKEDITOR.ENLARGE_LIST_ITEM_CONTENTS : CKEDITOR.ENLARGE_BLOCK_CONTENTS);
          if (!g.collapsed) {
            h = new CKEDITOR.dom.walker(g.clone());
            var r = CKEDITOR.dom.walker.bookmark(true, true);
            h.evaluator = r;
            this._.nextNode = h.next();
            h = new CKEDITOR.dom.walker(g.clone());
            h.evaluator = r;
            h = h.previous();
            this._.lastNode = h.getNextSourceNode(true);
            if (this._.lastNode && this._.lastNode.type == CKEDITOR.NODE_TEXT && !CKEDITOR.tools.trim(this._.lastNode.getText()) && this._.lastNode.getParent().isBlockBoundary()) {
              r = this.range.clone();
              r.moveToPosition(this._.lastNode, CKEDITOR.POSITION_AFTER_END);
              if (r.checkEndOfBlock()) {
                r = new CKEDITOR.dom.elementPath(r.endContainer, r.root);
                this._.lastNode = (r.block || r.blockLimit).getNextSourceNode(true)
              }
            }
            if (!this._.lastNode || !g.root.contains(this._.lastNode)) {
              this._.lastNode =
                this._.docEndMarker = g.document.createText("");
              this._.lastNode.insertAfter(h)
            }
            g = null
          }
          this._.started = 1;
          h = g
        }
        r = this._.nextNode;
        g = this._.lastNode;
        for (this._.nextNode = null; r;) {
          var w = 0, m = r.hasAscendant("pre"), i = r.type != CKEDITOR.NODE_ELEMENT, q = 0;
          if (i)r.type == CKEDITOR.NODE_TEXT && e.test(r.getText()) && (i = 0); else {
            var o = r.getName();
            if (CKEDITOR.dtd.$block[o] && r.getAttribute("contenteditable") == "false") {
              b = r;
              c(this, a, b);
              break
            } else if (r.isBlockBoundary(this.forceBrBreak && !m && {br: 1})) {
              if (o == "br")i = 1; else if (!h && !r.getChildCount() &&
                o != "hr") {
                b = r;
                u = r.equals(g);
                break
              }
              if (h) {
                h.setEndAt(r, CKEDITOR.POSITION_BEFORE_START);
                if (o != "br")this._.nextNode = r
              }
              w = 1
            } else {
              if (r.getFirst()) {
                if (!h) {
                  h = this.range.clone();
                  h.setStartAt(r, CKEDITOR.POSITION_BEFORE_START)
                }
                r = r.getFirst();
                continue
              }
              i = 1
            }
          }
          if (i && !h) {
            h = this.range.clone();
            h.setStartAt(r, CKEDITOR.POSITION_BEFORE_START)
          }
          u = (!w || i) && r.equals(g);
          if (h && !w)for (; !r.getNext(n) && !u;) {
            o = r.getParent();
            if (o.isBlockBoundary(this.forceBrBreak && !m && {br: 1})) {
              w = 1;
              i = 0;
              u || o.equals(g);
              h.setEndAt(o, CKEDITOR.POSITION_BEFORE_END);
              break
            }
            r = o;
            i = 1;
            u = r.equals(g);
            q = 1
          }
          i && h.setEndAt(r, CKEDITOR.POSITION_AFTER_END);
          r = d(r, q, g);
          if ((u = !r) || w && h)break
        }
        if (!b) {
          if (!h) {
            this._.docEndMarker && this._.docEndMarker.remove();
            return this._.nextNode = null
          }
          b = new CKEDITOR.dom.elementPath(h.startContainer, h.root);
          r = b.blockLimit;
          w = {div: 1, th: 1, td: 1};
          b = b.block;
          if (!b && r && !this.enforceRealBlocks && w[r.getName()] && h.checkStartOfBlock() && h.checkEndOfBlock() && !r.equals(h.root))b = r; else if (!b || this.enforceRealBlocks && b.getName() == "li") {
            b = this.range.document.createElement(a);
            h.extractContents().appendTo(b);
            b.trim();
            h.insertNode(b);
            s = t = true
          } else if (b.getName() != "li") {
            if (!h.checkStartOfBlock() || !h.checkEndOfBlock()) {
              b = b.clone(false);
              h.extractContents().appendTo(b);
              b.trim();
              t = h.splitBlock();
              s = !t.wasStartOfBlock;
              t = !t.wasEndOfBlock;
              h.insertNode(b)
            }
          } else if (!u)this._.nextNode = b.equals(g) ? null : d(h.getBoundaryNodes().endNode, 1, g)
        }
        if (s)(s = b.getPrevious()) && s.type == CKEDITOR.NODE_ELEMENT && (s.getName() == "br" ? s.remove() : s.getLast() && s.getLast().$.nodeName.toLowerCase() == "br" && s.getLast().remove());
        if (t)(s = b.getLast()) && s.type == CKEDITOR.NODE_ELEMENT && s.getName() == "br" && (!CKEDITOR.env.needsBrFiller || s.getPrevious(f) || s.getNext(f)) && s.remove();
        if (!this._.nextNode)this._.nextNode = u || b.equals(g) || !g ? null : d(b, 1, g);
        return b
      }
    };
    CKEDITOR.dom.range.prototype.createIterator = function () {
      return new a(this)
    }
  })();
  CKEDITOR.command = function (a, d) {
    this.uiItems = [];
    this.exec = function (b) {
      if (this.state == CKEDITOR.TRISTATE_DISABLED || !this.checkAllowed())return false;
      this.editorFocus && a.focus();
      return this.fire("exec") === false ? true : d.exec.call(this, a, b) !== false
    };
    this.refresh = function (a, b) {
      if (!this.readOnly && a.readOnly)return true;
      if (this.context && !b.isContextFor(this.context)) {
        this.disable();
        return true
      }
      if (!this.checkAllowed(true)) {
        this.disable();
        return true
      }
      this.startDisabled || this.enable();
      this.modes && !this.modes[a.mode] &&
      this.disable();
      return this.fire("refresh", {
        editor: a,
        path: b
      }) === false ? true : d.refresh && d.refresh.apply(this, arguments) !== false
    };
    var b;
    this.checkAllowed = function (c) {
      return !c && typeof b == "boolean" ? b : b = a.activeFilter.checkFeature(this)
    };
    CKEDITOR.tools.extend(this, d, {
      modes: {wysiwyg: 1},
      editorFocus: 1,
      contextSensitive: !!d.context,
      state: CKEDITOR.TRISTATE_DISABLED
    });
    CKEDITOR.event.call(this)
  };
  CKEDITOR.command.prototype = {
    enable: function () {
      this.state == CKEDITOR.TRISTATE_DISABLED && this.checkAllowed() && this.setState(!this.preserveState || typeof this.previousState == "undefined" ? CKEDITOR.TRISTATE_OFF : this.previousState)
    }, disable: function () {
      this.setState(CKEDITOR.TRISTATE_DISABLED)
    }, setState: function (a) {
      if (this.state == a || a != CKEDITOR.TRISTATE_DISABLED && !this.checkAllowed())return false;
      this.previousState = this.state;
      this.state = a;
      this.fire("state");
      return true
    }, toggleState: function () {
      this.state == CKEDITOR.TRISTATE_OFF ?
        this.setState(CKEDITOR.TRISTATE_ON) : this.state == CKEDITOR.TRISTATE_ON && this.setState(CKEDITOR.TRISTATE_OFF)
    }
  };
  CKEDITOR.event.implementOn(CKEDITOR.command.prototype);
  CKEDITOR.ENTER_P = 1;
  CKEDITOR.ENTER_BR = 2;
  CKEDITOR.ENTER_DIV = 3;
  CKEDITOR.config = {
    customConfig: "config.js",
    autoUpdateElement: !0,
    language: "",
    defaultLanguage: "en",
    contentsLangDirection: "",
    enterMode: CKEDITOR.ENTER_P,
    forceEnterMode: !1,
    shiftEnterMode: CKEDITOR.ENTER_BR,
    docType: "<!DOCTYPE html>",
    bodyId: "",
    bodyClass: "",
    fullPage: !1,
    height: 200,
    extraPlugins: "",
    removePlugins: "",
    protectedSource: [],
    tabIndex: 0,
    width: "",
    baseFloatZIndex: 1E4,
    blockedKeystrokes: [CKEDITOR.CTRL + 66, CKEDITOR.CTRL + 73, CKEDITOR.CTRL + 85]
  };
  (function () {
    function a(a, b, c, g, i) {
      var f = b.name;
      if ((g || typeof a.elements != "function" || a.elements(f)) && (!a.match || a.match(b))) {
        if (g = !i) {
          a:if (a.nothingRequired)g = true; else {
            if (i = a.requiredClasses) {
              f = b.classes;
              for (g = 0; g < i.length; ++g)if (CKEDITOR.tools.indexOf(f, i[g]) == -1) {
                g = false;
                break a
              }
            }
            g = e(b.styles, a.requiredStyles) && e(b.attributes, a.requiredAttributes)
          }
          g = !g
        }
        if (!g) {
          if (!a.propertiesOnly)c.valid = true;
          if (!c.allAttributes)c.allAttributes = d(a.attributes, b.attributes, c.validAttributes);
          if (!c.allStyles)c.allStyles =
            d(a.styles, b.styles, c.validStyles);
          if (!c.allClasses) {
            a = a.classes;
            b = b.classes;
            g = c.validClasses;
            if (a)if (a === true)b = true; else {
              for (var i = 0, f = b.length, m; i < f; ++i) {
                m = b[i];
                g[m] || (g[m] = a(m))
              }
              b = false
            } else b = false;
            c.allClasses = b
          }
        }
      }
    }

    function d(a, b, c) {
      if (!a)return false;
      if (a === true)return true;
      for (var e in b)c[e] || (c[e] = a(e, b[e]));
      return false
    }

    function b(a, b) {
      if (!a)return false;
      if (a === true)return a;
      if (typeof a == "string") {
        a = p(a);
        return a == "*" ? true : CKEDITOR.tools.convertArrayToObject(a.split(b))
      }
      if (CKEDITOR.tools.isArray(a))return a.length ?
        CKEDITOR.tools.convertArrayToObject(a) : false;
      var c = {}, e = 0, d;
      for (d in a) {
        c[d] = a[d];
        e++
      }
      return e ? c : false
    }

    function c(b) {
      if (b._.filterFunction)return b._.filterFunction;
      var c = /^cke:(object|embed|param)$/, e = /^(object|embed|param)$/;
      return b._.filterFunction = function (d, g, i, f, m, q, h) {
        var o = d.name, p, t = false;
        if (m)d.name = o = o.replace(c, "$1");
        if (i = i && i[o]) {
          j(d);
          for (o = 0; o < i.length; ++o)r(b, d, i[o]);
          k(d)
        }
        if (g) {
          var o = d.name, i = g.elements[o], B = g.generic, g = {
            valid: false, validAttributes: {}, validClasses: {}, validStyles: {},
            allAttributes: false, allClasses: false, allStyles: false
          };
          if (!i && !B) {
            f.push(d);
            return true
          }
          j(d);
          if (i) {
            o = 0;
            for (p = i.length; o < p; ++o)a(i[o], d, g, true, q)
          }
          if (B) {
            o = 0;
            for (p = B.length; o < p; ++o)a(B[o], d, g, false, q)
          }
          if (!g.valid) {
            f.push(d);
            return true
          }
          q = g.validAttributes;
          o = g.validStyles;
          i = g.validClasses;
          p = d.attributes;
          var B = d.styles, E = p["class"], n = p.style, w, L, C = [], s = [], u = /^data-cke-/, I = false;
          delete p.style;
          delete p["class"];
          if (!g.allAttributes)for (w in p)if (!q[w])if (u.test(w)) {
            if (w != (L = w.replace(/^data-cke-saved-/, "")) && !q[L]) {
              delete p[w];
              I = true
            }
          } else {
            delete p[w];
            I = true
          }
          if (g.allStyles) {
            if (n)p.style = n
          } else {
            for (w in B)o[w] ? C.push(w + ":" + B[w]) : I = true;
            if (C.length)p.style = C.sort().join("; ")
          }
          if (g.allClasses)E && (p["class"] = E); else {
            for (w in i)i[w] && s.push(w);
            s.length && (p["class"] = s.sort().join(" "));
            E && s.length < E.split(/\s+/).length && (I = true)
          }
          I && (t = true);
          if (!h && !l(d)) {
            f.push(d);
            return true
          }
        }
        if (m)d.name = d.name.replace(e, "cke:$1");
        return t
      }
    }

    function e(a, b) {
      if (!b)return true;
      for (var c = 0; c < b.length; ++c)if (!(b[c]in a))return false;
      return true
    }

    function f(a) {
      if (!a)return {};
      for (var a = a.split(/\s*,\s*/).sort(), b = {}; a.length;)b[a.shift()] = L;
      return b
    }

    function h(a) {
      for (var b, c, e, d, g = {}, i = 1, a = p(a); b = a.match(x);) {
        if (c = b[2]) {
          e = n(c, "styles");
          d = n(c, "attrs");
          c = n(c, "classes")
        } else e = d = c = null;
        g["$" + i++] = {elements: b[1], classes: c, styles: e, attributes: d};
        a = a.slice(b[0].length)
      }
      return g
    }

    function n(a, b) {
      var c = a.match(M[b]);
      return c ? p(c[1]) : null
    }

    function j(a) {
      if (!a.styles)a.styles = CKEDITOR.tools.parseCssText(a.attributes.style || "", 1);
      if (!a.classes)a.classes =
        a.attributes["class"] ? a.attributes["class"].split(/\s+/) : []
    }

    function k(a) {
      var b = a.attributes, c;
      delete b.style;
      delete b["class"];
      if (c = CKEDITOR.tools.writeCssText(a.styles, true))b.style = c;
      a.classes.length && (b["class"] = a.classes.sort().join(" "))
    }

    function l(a) {
      switch (a.name) {
        case "a":
          if (!a.children.length && !a.attributes.name)return false;
          break;
        case "img":
          if (!a.attributes.src)return false
      }
      return true
    }

    function u(a) {
      return !a ? false : a === true ? true : function (b) {
        return b in a
      }
    }

    function s() {
      return new CKEDITOR.htmlParser.element("br")
    }

    function t(a) {
      return a.type == CKEDITOR.NODE_ELEMENT && (a.name == "br" || o.$block[a.name])
    }

    function g(a, b, c) {
      var e = a.name;
      if (o.$empty[e] || !a.children.length)if (e == "hr" && b == "br")a.replaceWith(s()); else {
        a.parent && c.push({check: "it", el: a.parent});
        a.remove()
      } else if (o.$block[e] || e == "tr")if (b == "br") {
        if (a.previous && !t(a.previous)) {
          b = s();
          b.insertBefore(a)
        }
        if (a.next && !t(a.next)) {
          b = s();
          b.insertAfter(a)
        }
        a.replaceWithChildren()
      } else {
        var e = a.children, d;
        b:{
          d = o[b];
          for (var g = 0, i = e.length, f; g < i; ++g) {
            f = e[g];
            if (f.type ==
              CKEDITOR.NODE_ELEMENT && !d[f.name]) {
              d = false;
              break b
            }
          }
          d = true
        }
        if (d) {
          a.name = b;
          a.attributes = {};
          c.push({check: "parent-down", el: a})
        } else {
          d = a.parent;
          for (var g = d.type == CKEDITOR.NODE_DOCUMENT_FRAGMENT || d.name == "body", m, i = e.length; i > 0;) {
            f = e[--i];
            if (g && (f.type == CKEDITOR.NODE_TEXT || f.type == CKEDITOR.NODE_ELEMENT && o.$inline[f.name])) {
              if (!m) {
                m = new CKEDITOR.htmlParser.element(b);
                m.insertAfter(a);
                c.push({check: "parent-down", el: m})
              }
              m.add(f, 0)
            } else {
              m = null;
              f.insertAfter(a);
              d.type != CKEDITOR.NODE_DOCUMENT_FRAGMENT && (f.type ==
              CKEDITOR.NODE_ELEMENT && !o[d.name][f.name]) && c.push({check: "el-up", el: f})
            }
          }
          a.remove()
        }
      } else if (e == "style")a.remove(); else {
        a.parent && c.push({check: "it", el: a.parent});
        a.replaceWithChildren()
      }
    }

    function r(a, b, c) {
      var e, d;
      for (e = 0; e < c.length; ++e) {
        d = c[e];
        if ((!d.check || a.check(d.check, false)) && (!d.left || d.left(b))) {
          d.right(b, y);
          break
        }
      }
    }

    function w(a, b) {
      var c = b.getDefinition(), e = c.attributes, d = c.styles, g, i, f, m;
      if (a.name != c.element)return false;
      for (g in e)if (g == "class") {
        c = e[g].split(/\s+/);
        for (f = a.classes.join("|"); m =
          c.pop();)if (f.indexOf(m) == -1)return false
      } else if (a.attributes[g] != e[g])return false;
      for (i in d)if (a.styles[i] != d[i])return false;
      return true
    }

    function m(a, b) {
      var c, e;
      if (typeof a == "string")c = a; else if (a instanceof CKEDITOR.style)e = a; else {
        c = a[0];
        e = a[1]
      }
      return [{
        element: c, left: e, right: function (a, c) {
          c.transform(a, b)
        }
      }]
    }

    function i(a) {
      return function (b) {
        return w(b, a)
      }
    }

    function q(a) {
      return function (b, c) {
        c[a](b)
      }
    }

    var o = CKEDITOR.dtd, B = CKEDITOR.tools.copy, p = CKEDITOR.tools.trim, L = "cke-test", E = ["", "p", "br", "div"];
    CKEDITOR.filter = function (a) {
      this.allowedContent = [];
      this.disabled = false;
      this.editor = null;
      this.id = CKEDITOR.tools.getNextNumber();
      this._ = {rules: {}, transformations: {}, cachedTests: {}};
      CKEDITOR.filter.instances[this.id] = this;
      if (a instanceof CKEDITOR.editor) {
        a = this.editor = a;
        this.customConfig = true;
        var b = a.config.allowedContent;
        if (b === true)this.disabled = true; else {
          if (!b)this.customConfig = false;
          this.allow(b, "config", 1);
          this.allow(a.config.extraAllowedContent, "extra", 1);
          this.allow(E[a.enterMode] + " " + E[a.shiftEnterMode],
            "default", 1)
        }
      } else {
        this.customConfig = false;
        this.allow(a, "default", 1)
      }
    };
    CKEDITOR.filter.instances = {};
    CKEDITOR.filter.prototype = {
      allow: function (a, c, e) {
        if (this.disabled || this.customConfig && !e || !a)return false;
        this._.cachedChecks = {};
        var d, g;
        if (typeof a == "string")a = h(a); else if (a instanceof CKEDITOR.style) {
          g = a.getDefinition();
          e = {};
          a = g.attributes;
          e[g.element] = g = {styles: g.styles, requiredStyles: g.styles && CKEDITOR.tools.objectKeys(g.styles)};
          if (a) {
            a = B(a);
            g.classes = a["class"] ? a["class"].split(/\s+/) : null;
            g.requiredClasses =
              g.classes;
            delete a["class"];
            g.attributes = a;
            g.requiredAttributes = a && CKEDITOR.tools.objectKeys(a)
          }
          a = e
        } else if (CKEDITOR.tools.isArray(a)) {
          for (d = 0; d < a.length; ++d)g = this.allow(a[d], c, e);
          return g
        }
        var i, e = [];
        for (i in a) {
          g = a[i];
          g = typeof g == "boolean" ? {} : typeof g == "function" ? {match: g} : B(g);
          if (i.charAt(0) != "$")g.elements = i;
          if (c)g.featureName = c.toLowerCase();
          var f = g;
          f.elements = b(f.elements, /\s+/) || null;
          f.propertiesOnly = f.propertiesOnly || f.elements === true;
          var m = /\s*,\s*/, o = void 0;
          for (o in I) {
            f[o] = b(f[o], m) || null;
            var q = f, p = C[o], r = b(f[C[o]], m), t = f[o], j = [], k = true, w = void 0;
            r ? k = false : r = {};
            for (w in t)if (w.charAt(0) == "!") {
              w = w.slice(1);
              j.push(w);
              r[w] = true;
              k = false
            }
            for (; w = j.pop();) {
              t[w] = t["!" + w];
              delete t["!" + w]
            }
            q[p] = (k ? false : r) || null
          }
          f.match = f.match || null;
          this.allowedContent.push(g);
          e.push(g)
        }
        c = this._.rules;
        i = c.elements || {};
        a = c.generic || [];
        g = 0;
        for (f = e.length; g < f; ++g) {
          m = B(e[g]);
          o = m.classes === true || m.styles === true || m.attributes === true;
          q = m;
          p = void 0;
          for (p in I)q[p] = u(q[p]);
          r = true;
          for (p in C) {
            p = C[p];
            q[p] = CKEDITOR.tools.objectKeys(q[p]);
            q[p] && (r = false)
          }
          q.nothingRequired = r;
          if (m.elements === true || m.elements === null) {
            m.elements = u(m.elements);
            a[o ? "unshift" : "push"](m)
          } else {
            q = m.elements;
            delete m.elements;
            for (d in q)if (i[d])i[d][o ? "unshift" : "push"](m); else i[d] = [m]
          }
        }
        c.elements = i;
        c.generic = a.length ? a : null;
        return true
      }, applyTo: function (a, b, e, d) {
        if (this.disabled)return false;
        var i = [], f = !e && this._.rules, m = this._.transformations, q = c(this), p = this.editor && this.editor.config.protectedSource, h = false;
        a.forEach(function (a) {
          if (a.type == CKEDITOR.NODE_ELEMENT) {
            if (a.attributes["data-cke-filter"] ==
              "off")return false;
            if (!b || !(a.name == "span" && ~CKEDITOR.tools.objectKeys(a.attributes).join("|").indexOf("data-cke-")))q(a, f, m, i, b) && (h = true)
          } else if (a.type == CKEDITOR.NODE_COMMENT && a.value.match(/^\{cke_protected\}(?!\{C\})/)) {
            var c;
            a:{
              var e = decodeURIComponent(a.value.replace(/^\{cke_protected\}/, ""));
              c = [];
              var d, g, z;
              if (p)for (g = 0; g < p.length; ++g)if ((z = e.match(p[g])) && z[0].length == e.length) {
                c = true;
                break a
              }
              e = CKEDITOR.htmlParser.fragment.fromHtml(e);
              e.children.length == 1 && (d = e.children[0]).type == CKEDITOR.NODE_ELEMENT &&
              q(d, f, m, c, b);
              c = !c.length
            }
            c || i.push(a)
          }
        }, null, true);
        i.length && (h = true);
        for (var r, a = [], d = E[d || (this.editor ? this.editor.enterMode : CKEDITOR.ENTER_P)]; e = i.pop();)e.type == CKEDITOR.NODE_ELEMENT ? g(e, d, a) : e.remove();
        for (; r = a.pop();) {
          e = r.el;
          if (e.parent)switch (r.check) {
            case "it":
              o.$removeEmpty[e.name] && !e.children.length ? g(e, d, a) : l(e) || g(e, d, a);
              break;
            case "el-up":
              e.parent.type != CKEDITOR.NODE_DOCUMENT_FRAGMENT && !o[e.parent.name][e.name] && g(e, d, a);
              break;
            case "parent-down":
              e.parent.type != CKEDITOR.NODE_DOCUMENT_FRAGMENT && !o[e.parent.name][e.name] && g(e.parent, d, a)
          }
        }
        return h
      }, checkFeature: function (a) {
        if (this.disabled || !a)return true;
        a.toFeature && (a = a.toFeature(this.editor));
        return !a.requiredContent || this.check(a.requiredContent)
      }, disable: function () {
        this.disabled = true
      }, addContentForms: function (a) {
        if (!this.disabled && a) {
          var b, c, e = [], d;
          for (b = 0; b < a.length && !d; ++b) {
            c = a[b];
            if ((typeof c == "string" || c instanceof CKEDITOR.style) && this.check(c))d = c
          }
          if (d) {
            for (b = 0; b < a.length; ++b)e.push(m(a[b], d));
            this.addTransformations(e)
          }
        }
      }, addFeature: function (a) {
        if (this.disabled || !a)return true;
        a.toFeature && (a = a.toFeature(this.editor));
        this.allow(a.allowedContent, a.name);
        this.addTransformations(a.contentTransformations);
        this.addContentForms(a.contentForms);
        return this.customConfig && a.requiredContent ? this.check(a.requiredContent) : true
      }, addTransformations: function (a) {
        var b, c;
        if (!this.disabled && a) {
          var e = this._.transformations, d;
          for (d = 0; d < a.length; ++d) {
            b = a[d];
            var g = void 0, f = void 0, m = void 0, o = void 0, p = void 0, h = void 0;
            c = [];
            for (f = 0; f < b.length; ++f) {
              m = b[f];
              if (typeof m == "string") {
                m =
                  m.split(/\s*:\s*/);
                o = m[0];
                p = null;
                h = m[1]
              } else {
                o = m.check;
                p = m.left;
                h = m.right
              }
              if (!g) {
                g = m;
                g = g.element ? g.element : o ? o.match(/^([a-z0-9]+)/i)[0] : g.left.getDefinition().element
              }
              p instanceof CKEDITOR.style && (p = i(p));
              c.push({check: o == g ? null : o, left: p, right: typeof h == "string" ? q(h) : h})
            }
            b = g;
            e[b] || (e[b] = []);
            e[b].push(c)
          }
        }
      }, check: function (a, b, e) {
        if (this.disabled)return true;
        if (CKEDITOR.tools.isArray(a)) {
          for (var d = a.length; d--;)if (this.check(a[d], b, e))return true;
          return false
        }
        var g, i;
        if (typeof a == "string") {
          i = a + "<" +
            (b === false ? "0" : "1") + (e ? "1" : "0") + ">";
          if (i in this._.cachedChecks)return this._.cachedChecks[i];
          d = h(a).$1;
          g = d.styles;
          var m = d.classes;
          d.name = d.elements;
          d.classes = m = m ? m.split(/\s*,\s*/) : [];
          d.styles = f(g);
          d.attributes = f(d.attributes);
          d.children = [];
          m.length && (d.attributes["class"] = m.join(" "));
          if (g)d.attributes.style = CKEDITOR.tools.writeCssText(d.styles);
          g = d
        } else {
          d = a.getDefinition();
          g = d.styles;
          m = d.attributes || {};
          if (g) {
            g = B(g);
            m.style = CKEDITOR.tools.writeCssText(g, true)
          } else g = {};
          g = {
            name: d.element, attributes: m,
            classes: m["class"] ? m["class"].split(/\s+/) : [], styles: g, children: []
          }
        }
        var m = CKEDITOR.tools.clone(g), o = [], p;
        if (b !== false && (p = this._.transformations[g.name])) {
          for (d = 0; d < p.length; ++d)r(this, g, p[d]);
          k(g)
        }
        c(this)(m, this._.rules, b === false ? false : this._.transformations, o, false, !e, !e);
        b = o.length > 0 ? false : CKEDITOR.tools.objectCompare(g.attributes, m.attributes, true) ? true : false;
        typeof a == "string" && (this._.cachedChecks[i] = b);
        return b
      }, getAllowedEnterMode: function () {
        var a = ["p", "div", "br"], b = {
          p: CKEDITOR.ENTER_P, div: CKEDITOR.ENTER_DIV,
          br: CKEDITOR.ENTER_BR
        };
        return function (c, e) {
          var d = a.slice(), g;
          if (this.check(E[c]))return c;
          for (e || (d = d.reverse()); g = d.pop();)if (this.check(g))return b[g];
          return CKEDITOR.ENTER_BR
        }
      }()
    };
    var I = {styles: 1, attributes: 1, classes: 1}, C = {
      styles: "requiredStyles",
      attributes: "requiredAttributes",
      classes: "requiredClasses"
    }, x = /^([a-z0-9*\s]+)((?:\s*\{[!\w\-,\s\*]+\}\s*|\s*\[[!\w\-,\s\*]+\]\s*|\s*\([!\w\-,\s\*]+\)\s*){0,3})(?:;\s*|$)/i, M = {
      styles: /{([^}]+)}/,
      attrs: /\[([^\]]+)\]/,
      classes: /\(([^\)]+)\)/
    }, y = CKEDITOR.filter.transformationsTools =
    {
      sizeToStyle: function (a) {
        this.lengthToStyle(a, "width");
        this.lengthToStyle(a, "height")
      }, sizeToAttribute: function (a) {
      this.lengthToAttribute(a, "width");
      this.lengthToAttribute(a, "height")
    }, lengthToStyle: function (a, b, c) {
      c = c || b;
      if (!(c in a.styles)) {
        var e = a.attributes[b];
        if (e) {
          /^\d+$/.test(e) && (e = e + "px");
          a.styles[c] = e
        }
      }
      delete a.attributes[b]
    }, lengthToAttribute: function (a, b, c) {
      c = c || b;
      if (!(c in a.attributes)) {
        var e = a.styles[b], d = e && e.match(/^(\d+)(?:\.\d*)?px$/);
        d ? a.attributes[c] = d[1] : e == L && (a.attributes[c] =
          L)
      }
      delete a.styles[b]
    }, alignmentToStyle: function (a) {
      if (!("float"in a.styles)) {
        var b = a.attributes.align;
        if (b == "left" || b == "right")a.styles["float"] = b
      }
      delete a.attributes.align
    }, alignmentToAttribute: function (a) {
      if (!("align"in a.attributes)) {
        var b = a.styles["float"];
        if (b == "left" || b == "right")a.attributes.align = b
      }
      delete a.styles["float"]
    }, matchesStyle: w, transform: function (a, b) {
      if (typeof b == "string")a.name = b; else {
        var c = b.getDefinition(), e = c.styles, d = c.attributes, g, i, f, m;
        a.name = c.element;
        for (g in d)if (g ==
          "class") {
          c = a.classes.join("|");
          for (f = d[g].split(/\s+/); m = f.pop();)c.indexOf(m) == -1 && a.classes.push(m)
        } else a.attributes[g] = d[g];
        for (i in e)a.styles[i] = e[i]
      }
    }
    }
  })();
  (function () {
    CKEDITOR.focusManager = function (a) {
      if (a.focusManager)return a.focusManager;
      this.hasFocus = false;
      this.currentActive = null;
      this._ = {editor: a};
      return this
    };
    CKEDITOR.focusManager._ = {blurDelay: 200};
    CKEDITOR.focusManager.prototype = {
      focus: function (a) {
        this._.timer && clearTimeout(this._.timer);
        if (a)this.currentActive = a;
        if (!this.hasFocus && !this._.locked) {
          (a = CKEDITOR.currentInstance) && a.focusManager.blur(1);
          this.hasFocus = true;
          (a = this._.editor.container) && a.addClass("cke_focus");
          this._.editor.fire("focus")
        }
      },
      lock: function () {
        this._.locked = 1
      }, unlock: function () {
        delete this._.locked
      }, blur: function (a) {
        function d() {
          if (this.hasFocus) {
            this.hasFocus = false;
            var a = this._.editor.container;
            a && a.removeClass("cke_focus");
            this._.editor.fire("blur")
          }
        }

        if (!this._.locked) {
          this._.timer && clearTimeout(this._.timer);
          var b = CKEDITOR.focusManager._.blurDelay;
          a || !b ? d.call(this) : this._.timer = CKEDITOR.tools.setTimeout(function () {
            delete this._.timer;
            d.call(this)
          }, b, this)
        }
      }, add: function (a, d) {
        var b = a.getCustomData("focusmanager");
        if (!b ||
          b != this) {
          b && b.remove(a);
          var b = "focus", c = "blur";
          if (d)if (CKEDITOR.env.ie) {
            b = "focusin";
            c = "focusout"
          } else CKEDITOR.event.useCapture = 1;
          var e = {
            blur: function () {
              a.equals(this.currentActive) && this.blur()
            }, focus: function () {
              this.focus(a)
            }
          };
          a.on(b, e.focus, this);
          a.on(c, e.blur, this);
          if (d)CKEDITOR.event.useCapture = 0;
          a.setCustomData("focusmanager", this);
          a.setCustomData("focusmanager_handlers", e)
        }
      }, remove: function (a) {
        a.removeCustomData("focusmanager");
        var d = a.removeCustomData("focusmanager_handlers");
        a.removeListener("blur",
          d.blur);
        a.removeListener("focus", d.focus)
      }
    }
  })();
  CKEDITOR.keystrokeHandler = function (a) {
    if (a.keystrokeHandler)return a.keystrokeHandler;
    this.keystrokes = {};
    this.blockedKeystrokes = {};
    this._ = {editor: a};
    return this
  };
  (function () {
    var a, d = function (b) {
      var b = b.data, e = b.getKeystroke(), d = this.keystrokes[e], h = this._.editor;
      a = h.fire("key", {keyCode: e}) === false;
      if (!a) {
        d && (a = h.execCommand(d, {from: "keystrokeHandler"}) !== false);
        a || (a = !!this.blockedKeystrokes[e])
      }
      a && b.preventDefault(true);
      return !a
    }, b = function (b) {
      if (a) {
        a = false;
        b.data.preventDefault(true)
      }
    };
    CKEDITOR.keystrokeHandler.prototype = {
      attach: function (a) {
        a.on("keydown", d, this);
        if (CKEDITOR.env.opera || CKEDITOR.env.gecko && CKEDITOR.env.mac)a.on("keypress", b, this)
      }
    }
  })();
  (function () {
    CKEDITOR.lang = {
      languages: {
        af: 1,
        ar: 1,
        bg: 1,
        bn: 1,
        bs: 1,
        ca: 1,
        cs: 1,
        cy: 1,
        da: 1,
        de: 1,
        el: 1,
        "en-au": 1,
        "en-ca": 1,
        "en-gb": 1,
        en: 1,
        eo: 1,
        es: 1,
        et: 1,
        eu: 1,
        fa: 1,
        fi: 1,
        fo: 1,
        "fr-ca": 1,
        fr: 1,
        gl: 1,
        gu: 1,
        he: 1,
        hi: 1,
        hr: 1,
        hu: 1,
        id: 1,
        is: 1,
        it: 1,
        ja: 1,
        ka: 1,
        km: 1,
        ko: 1,
        ku: 1,
        lt: 1,
        lv: 1,
        mk: 1,
        mn: 1,
        ms: 1,
        nb: 1,
        nl: 1,
        no: 1,
        pl: 1,
        "pt-br": 1,
        pt: 1,
        ro: 1,
        ru: 1,
        si: 1,
        sk: 1,
        sl: 1,
        sq: 1,
        "sr-latn": 1,
        sr: 1,
        sv: 1,
        th: 1,
        tr: 1,
        ug: 1,
        uk: 1,
        vi: 1,
        "zh-cn": 1,
        zh: 1
      }, rtl: {ar: 1, fa: 1, he: 1, ku: 1, ug: 1}, load: function (a, d, b) {
        if (!a || !CKEDITOR.lang.languages[a])a = this.detect(d,
          a);
        this[a] ? b(a, this[a]) : CKEDITOR.scriptLoader.load(CKEDITOR.getUrl("lang/" + a + ".js"), function () {
          this[a].dir = this.rtl[a] ? "rtl" : "ltr";
          b(a, this[a])
        }, this)
      }, detect: function (a, d) {
        var b = this.languages, d = d || navigator.userLanguage || navigator.language || a, c = d.toLowerCase().match(/([a-z]+)(?:-([a-z]+))?/), e = c[1], c = c[2];
        b[e + "-" + c] ? e = e + "-" + c : b[e] || (e = null);
        CKEDITOR.lang.detect = e ? function () {
          return e
        } : function (a) {
          return a
        };
        return e || a
      }
    }
  })();
  CKEDITOR.scriptLoader = function () {
    var a = {}, d = {};
    return {
      load: function (b, c, e, f) {
        var h = typeof b == "string";
        h && (b = [b]);
        e || (e = CKEDITOR);
        var n = b.length, j = [], k = [], l = function (a) {
          c && (h ? c.call(e, a) : c.call(e, j, k))
        };
        if (n === 0)l(true); else {
          var u = function (a, b) {
            (b ? j : k).push(a);
            if (--n <= 0) {
              f && CKEDITOR.document.getDocumentElement().removeStyle("cursor");
              l(b)
            }
          }, s = function (b, c) {
            a[b] = 1;
            var e = d[b];
            delete d[b];
            for (var g = 0; g < e.length; g++)e[g](b, c)
          }, t = function (b) {
            if (a[b])u(b, true); else {
              var e = d[b] || (d[b] = []);
              e.push(u);
              if (!(e.length >
                1)) {
                var g = new CKEDITOR.dom.element("script");
                g.setAttributes({type: "text/javascript", src: b});
                if (c)if (CKEDITOR.env.ie && CKEDITOR.env.version < 11)g.$.onreadystatechange = function () {
                  if (g.$.readyState == "loaded" || g.$.readyState == "complete") {
                    g.$.onreadystatechange = null;
                    s(b, true)
                  }
                }; else {
                  g.$.onload = function () {
                    setTimeout(function () {
                      s(b, true)
                    }, 0)
                  };
                  g.$.onerror = function () {
                    s(b, false)
                  }
                }
                g.appendTo(CKEDITOR.document.getHead())
              }
            }
          };
          f && CKEDITOR.document.getDocumentElement().setStyle("cursor", "wait");
          for (var g = 0; g < n; g++)t(b[g])
        }
      },
      queue: function () {
        function a() {
          var b;
          (b = c[0]) && this.load(b.scriptUrl, b.callback, CKEDITOR, 0)
        }

        var c = [];
        return function (e, d) {
          var h = this;
          c.push({
            scriptUrl: e, callback: function () {
              d && d.apply(this, arguments);
              c.shift();
              a.call(h)
            }
          });
          c.length == 1 && a.call(this)
        }
      }()
    }
  }();
  CKEDITOR.resourceManager = function (a, d) {
    this.basePath = a;
    this.fileName = d;
    this.registered = {};
    this.loaded = {};
    this.externals = {};
    this._ = {waitingList: {}}
  };
  CKEDITOR.resourceManager.prototype = {
    add: function (a, d) {
      if (this.registered[a])throw'[CKEDITOR.resourceManager.add] The resource name "' + a + '" is already registered.';
      var b = this.registered[a] = d || {};
      b.name = a;
      b.path = this.getPath(a);
      CKEDITOR.fire(a + CKEDITOR.tools.capitalize(this.fileName) + "Ready", b);
      return this.get(a)
    }, get: function (a) {
      return this.registered[a] || null
    }, getPath: function (a) {
      var d = this.externals[a];
      return CKEDITOR.getUrl(d && d.dir || this.basePath + a + "/")
    }, getFilePath: function (a) {
      var d = this.externals[a];
      return CKEDITOR.getUrl(this.getPath(a) + (d ? d.file : this.fileName + ".js"))
    }, addExternal: function (a, d, b) {
      for (var a = a.split(","), c = 0; c < a.length; c++) {
        var e = a[c];
        b || (d = d.replace(/[^\/]+$/, function (a) {
          b = a;
          return ""
        }));
        this.externals[e] = {dir: d, file: b || this.fileName + ".js"}
      }
    }, load: function (a, d, b) {
      CKEDITOR.tools.isArray(a) || (a = a ? [a] : []);
      for (var c = this.loaded, e = this.registered, f = [], h = {}, n = {}, j = 0; j < a.length; j++) {
        var k = a[j];
        if (k)if (!c[k] && !e[k]) {
          var l = this.getFilePath(k);
          f.push(l);
          l in h || (h[l] = []);
          h[l].push(k)
        } else n[k] =
          this.get(k)
      }
      CKEDITOR.scriptLoader.load(f, function (a, e) {
        if (e.length)throw'[CKEDITOR.resourceManager.load] Resource name "' + h[e[0]].join(",") + '" was not found at "' + e[0] + '".';
        for (var f = 0; f < a.length; f++)for (var g = h[a[f]], r = 0; r < g.length; r++) {
          var j = g[r];
          n[j] = this.get(j);
          c[j] = 1
        }
        d.call(b, n)
      }, this)
    }
  };
  CKEDITOR.plugins = new CKEDITOR.resourceManager("plugins/", "plugin");
  CKEDITOR.plugins.load = CKEDITOR.tools.override(CKEDITOR.plugins.load, function (a) {
    var d = {};
    return function (b, c, e) {
      var f = {}, h = function (b) {
        a.call(this, b, function (a) {
          CKEDITOR.tools.extend(f, a);
          var b = [], l;
          for (l in a) {
            var n = a[l], s = n && n.requires;
            if (!d[l]) {
              if (n.icons)for (var t = n.icons.split(","), g = t.length; g--;)CKEDITOR.skin.addIcon(t[g], n.path + "icons/" + (CKEDITOR.env.hidpi && n.hidpi ? "hidpi/" : "") + t[g] + ".png");
              d[l] = 1
            }
            if (s) {
              s.split && (s = s.split(","));
              for (n = 0; n < s.length; n++)f[s[n]] || b.push(s[n])
            }
          }
          if (b.length)h.call(this,
            b); else {
            for (l in f) {
              n = f[l];
              if (n.onLoad && !n.onLoad._called) {
                n.onLoad() === false && delete f[l];
                n.onLoad._called = 1
              }
            }
            c && c.call(e || window, f)
          }
        }, this)
      };
      h.call(this, b)
    }
  });
  CKEDITOR.plugins.setLang = function (a, d, b) {
    var c = this.get(a), a = c.langEntries || (c.langEntries = {}), c = c.lang || (c.lang = []);
    c.split && (c = c.split(","));
    CKEDITOR.tools.indexOf(c, d) == -1 && c.push(d);
    a[d] = b
  };
  CKEDITOR.ui = function (a) {
    if (a.ui)return a.ui;
    this.items = {};
    this.instances = {};
    this.editor = a;
    this._ = {handlers: {}};
    return this
  };
  CKEDITOR.ui.prototype = {
    add: function (a, d, b) {
      b.name = a.toLowerCase();
      var c = this.items[a] = {type: d, command: b.command || null, args: Array.prototype.slice.call(arguments, 2)};
      CKEDITOR.tools.extend(c, b)
    }, get: function (a) {
      return this.instances[a]
    }, create: function (a) {
      var d = this.items[a], b = d && this._.handlers[d.type], c = d && d.command && this.editor.getCommand(d.command), b = b && b.create.apply(this, d.args);
      this.instances[a] = b;
      c && c.uiItems.push(b);
      if (b && !b.type)b.type = d.type;
      return b
    }, addHandler: function (a, d) {
      this._.handlers[a] =
        d
    }, space: function (a) {
      return CKEDITOR.document.getById(this.spaceId(a))
    }, spaceId: function (a) {
      return this.editor.id + "_" + a
    }
  };
  CKEDITOR.event.implementOn(CKEDITOR.ui);
  (function () {
    function a(a, c, f) {
      CKEDITOR.event.call(this);
      a = a && CKEDITOR.tools.clone(a);
      if (c !== void 0) {
        if (c instanceof CKEDITOR.dom.element) {
          if (!f)throw Error("One of the element modes must be specified.");
        } else throw Error("Expect element of type CKEDITOR.dom.element.");
        if (CKEDITOR.env.ie && CKEDITOR.env.quirks && f == CKEDITOR.ELEMENT_MODE_INLINE)throw Error("Inline element mode is not supported on IE quirks.");
        if (!(f == CKEDITOR.ELEMENT_MODE_INLINE ? c.is(CKEDITOR.dtd.$editable) || c.is("textarea") : f == CKEDITOR.ELEMENT_MODE_REPLACE ?
            !c.is(CKEDITOR.dtd.$nonBodyContent) : 1))throw Error('The specified element mode is not supported on element: "' + c.getName() + '".');
        this.element = c;
        this.elementMode = f;
        this.name = this.elementMode != CKEDITOR.ELEMENT_MODE_APPENDTO && (c.getId() || c.getNameAtt())
      } else this.elementMode = CKEDITOR.ELEMENT_MODE_NONE;
      this._ = {};
      this.commands = {};
      this.templates = {};
      this.name = this.name || d();
      this.id = CKEDITOR.tools.getNextId();
      this.status = "unloaded";
      this.config = CKEDITOR.tools.prototypedCopy(CKEDITOR.config);
      this.ui = new CKEDITOR.ui(this);
      this.focusManager = new CKEDITOR.focusManager(this);
      this.keystrokeHandler = new CKEDITOR.keystrokeHandler(this);
      this.on("readOnly", b);
      this.on("selectionChange", function (a) {
        e(this, a.data.path)
      });
      this.on("activeFilterChange", function () {
        e(this, this.elementPath(), true)
      });
      this.on("mode", b);
      this.on("instanceReady", function () {
        this.config.startupFocus && this.focus()
      });
      CKEDITOR.fire("instanceCreated", null, this);
      CKEDITOR.add(this);
      CKEDITOR.tools.setTimeout(function () {
        h(this, a)
      }, 0, this)
    }

    function d() {
      do var a = "editor" + ++s; while (CKEDITOR.instances[a]);
      return a
    }

    function b() {
      var a = this.commands, b;
      for (b in a)c(this, a[b])
    }

    function c(a, b) {
      b[b.startDisabled ? "disable" : a.readOnly && !b.readOnly ? "disable" : b.modes[a.mode] ? "enable" : "disable"]()
    }

    function e(a, b, c) {
      if (b) {
        var e, d, f = a.commands;
        for (d in f) {
          e = f[d];
          (c || e.contextSensitive) && e.refresh(a, b)
        }
      }
    }

    function f(a) {
      var b = a.config.customConfig;
      if (!b)return false;
      var b = CKEDITOR.getUrl(b), c = t[b] || (t[b] = {});
      if (c.fn) {
        c.fn.call(a, a.config);
        (CKEDITOR.getUrl(a.config.customConfig) == b || !f(a)) && a.fireOnce("customConfigLoaded")
      } else CKEDITOR.scriptLoader.queue(b, function () {
        c.fn = CKEDITOR.editorConfig ? CKEDITOR.editorConfig : function () {
        };
        f(a)
      });
      return true
    }

    function h(a, b) {
      a.on("customConfigLoaded", function () {
        if (b) {
          if (b.on)for (var c in b.on)a.on(c, b.on[c]);
          CKEDITOR.tools.extend(a.config, b, true);
          delete a.config.on
        }
        c = a.config;
        a.readOnly = !(!c.readOnly && !(a.elementMode == CKEDITOR.ELEMENT_MODE_INLINE ? a.element.is("textarea") ? a.element.hasAttribute("disabled") : a.element.isReadOnly() : a.elementMode ==
        CKEDITOR.ELEMENT_MODE_REPLACE && a.element.hasAttribute("disabled")));
        a.blockless = a.elementMode == CKEDITOR.ELEMENT_MODE_INLINE ? !(a.element.is("textarea") || CKEDITOR.dtd[a.element.getName()].p) : false;
        a.tabIndex = c.tabIndex || a.element && a.element.getAttribute("tabindex") || 0;
        a.activeEnterMode = a.enterMode = a.blockless ? CKEDITOR.ENTER_BR : c.enterMode;
        a.activeShiftEnterMode = a.shiftEnterMode = a.blockless ? CKEDITOR.ENTER_BR : c.shiftEnterMode;
        if (c.skin)CKEDITOR.skinName = c.skin;
        a.fireOnce("configLoaded");
        a.dataProcessor =
          new CKEDITOR.htmlDataProcessor(a);
        a.filter = a.activeFilter = new CKEDITOR.filter(a);
        n(a)
      });
      if (b && b.customConfig != void 0)a.config.customConfig = b.customConfig;
      f(a) || a.fireOnce("customConfigLoaded")
    }

    function n(a) {
      CKEDITOR.skin.loadPart("editor", function () {
        j(a)
      })
    }

    function j(a) {
      CKEDITOR.lang.load(a.config.language, a.config.defaultLanguage, function (b, c) {
        var e = a.config.title;
        a.langCode = b;
        a.lang = CKEDITOR.tools.prototypedCopy(c);
        a.title = typeof e == "string" || e === false ? e : [a.lang.editor, a.name].join(", ");
        if (CKEDITOR.env.gecko &&
          CKEDITOR.env.version < 10900 && a.lang.dir == "rtl")a.lang.dir = "ltr";
        if (!a.config.contentsLangDirection)a.config.contentsLangDirection = a.elementMode == CKEDITOR.ELEMENT_MODE_INLINE ? a.element.getDirection(1) : a.lang.dir;
        a.fire("langLoaded");
        k(a)
      })
    }

    function k(a) {
      a.getStylesSet(function (b) {
        a.once("loaded", function () {
          a.fire("stylesSet", {styles: b})
        }, null, null, 1);
        l(a)
      })
    }

    function l(a) {
      var b = a.config, c = b.plugins, e = b.extraPlugins, d = b.removePlugins;
      if (e)var f = RegExp("(?:^|,)(?:" + e.replace(/\s*,\s*/g, "|") + ")(?=,|$)",
        "g"), c = c.replace(f, ""), c = c + ("," + e);
      if (d)var o = RegExp("(?:^|,)(?:" + d.replace(/\s*,\s*/g, "|") + ")(?=,|$)", "g"), c = c.replace(o, "");
      CKEDITOR.env.air && (c = c + ",adobeair");
      CKEDITOR.plugins.load(c.split(","), function (c) {
        var e = [], d = [], i = [];
        a.plugins = c;
        for (var f in c) {
          var m = c[f], q = m.lang, h = null, t = m.requires, v;
          CKEDITOR.tools.isArray(t) && (t = t.join(","));
          if (t && (v = t.match(o)))for (; t = v.pop();)CKEDITOR.tools.setTimeout(function (a, b) {
            throw Error('Plugin "' + a.replace(",", "") + '" cannot be removed from the plugins list, because it\'s required by "' +
              b + '" plugin.');
          }, 0, null, [t, f]);
          if (q && !a.lang[f]) {
            q.split && (q = q.split(","));
            if (CKEDITOR.tools.indexOf(q, a.langCode) >= 0)h = a.langCode; else {
              h = a.langCode.replace(/-.*/, "");
              h = h != a.langCode && CKEDITOR.tools.indexOf(q, h) >= 0 ? h : CKEDITOR.tools.indexOf(q, "en") >= 0 ? "en" : q[0]
            }
            if (!m.langEntries || !m.langEntries[h])i.push(CKEDITOR.getUrl(m.path + "lang/" + h + ".js")); else {
              a.lang[f] = m.langEntries[h];
              h = null
            }
          }
          d.push(h);
          e.push(m)
        }
        CKEDITOR.scriptLoader.load(i, function () {
          for (var c = ["beforeInit", "init", "afterInit"], i = 0; i < c.length; i++)for (var f =
            0; f < e.length; f++) {
            var m = e[f];
            i === 0 && (d[f] && m.lang && m.langEntries) && (a.lang[m.name] = m.langEntries[d[f]]);
            if (m[c[i]])m[c[i]](a)
          }
          a.fireOnce("pluginsLoaded");
          b.keystrokes && a.setKeystroke(a.config.keystrokes);
          for (f = 0; f < a.config.blockedKeystrokes.length; f++)a.keystrokeHandler.blockedKeystrokes[a.config.blockedKeystrokes[f]] = 1;
          a.status = "loaded";
          a.fireOnce("loaded");
          CKEDITOR.fire("instanceLoaded", null, a)
        })
      })
    }

    function u() {
      var a = this.element;
      if (a && this.elementMode != CKEDITOR.ELEMENT_MODE_APPENDTO) {
        var b = this.getData();
        this.config.htmlEncodeOutput && (b = CKEDITOR.tools.htmlEncode(b));
        a.is("textarea") ? a.setValue(b) : a.setHtml(b);
        return true
      }
      return false
    }

    a.prototype = CKEDITOR.editor.prototype;
    CKEDITOR.editor = a;
    var s = 0, t = {};
    CKEDITOR.tools.extend(CKEDITOR.editor.prototype, {
      addCommand: function (a, b) {
        b.name = a.toLowerCase();
        var e = new CKEDITOR.command(this, b);
        this.mode && c(this, e);
        return this.commands[a] = e
      }, _attachToForm: function () {
        var a = this, b = a.element, c = new CKEDITOR.dom.element(b.$.form);
        if (b.is("textarea") && c) {
          var e = function (c) {
            a.updateElement();
            a._.required && (!b.getValue() && a.fire("required") === false) && c.data.preventDefault()
          };
          c.on("submit", e);
          if (c.$.submit && c.$.submit.call && c.$.submit.apply)c.$.submit = CKEDITOR.tools.override(c.$.submit, function (a) {
            return function () {
              e();
              a.apply ? a.apply(this) : a()
            }
          });
          a.on("destroy", function () {
            c.removeListener("submit", e)
          })
        }
      }, destroy: function (a) {
        this.fire("beforeDestroy");
        !a && u.call(this);
        this.editable(null);
        this.status = "destroyed";
        this.fire("destroy");
        this.removeAllListeners();
        CKEDITOR.remove(this);
        CKEDITOR.fire("instanceDestroyed",
          null, this)
      }, elementPath: function (a) {
        return (a = a || this.getSelection().getStartElement()) ? new CKEDITOR.dom.elementPath(a, this.editable()) : null
      }, createRange: function () {
        var a = this.editable();
        return a ? new CKEDITOR.dom.range(a) : null
      }, execCommand: function (a, b) {
        var c = this.getCommand(a), e = {name: a, commandData: b, command: c};
        if (c && c.state != CKEDITOR.TRISTATE_DISABLED && this.fire("beforeCommandExec", e) !== true) {
          e.returnValue = c.exec(e.commandData);
          if (!c.async && this.fire("afterCommandExec", e) !== true)return e.returnValue
        }
        return false
      },
      getCommand: function (a) {
        return this.commands[a]
      }, getData: function (a) {
        !a && this.fire("beforeGetData");
        var b = this._.data;
        if (typeof b != "string")b = (b = this.element) && this.elementMode == CKEDITOR.ELEMENT_MODE_REPLACE ? b.is("textarea") ? b.getValue() : b.getHtml() : "";
        b = {dataValue: b};
        !a && this.fire("getData", b);
        return b.dataValue
      }, getSnapshot: function () {
        var a = this.fire("getSnapshot");
        if (typeof a != "string") {
          var b = this.element;
          b && this.elementMode == CKEDITOR.ELEMENT_MODE_REPLACE && (a = b.is("textarea") ? b.getValue() : b.getHtml())
        }
        return a
      },
      loadSnapshot: function (a) {
        this.fire("loadSnapshot", a)
      }, setData: function (a, b, c) {
        if (b)this.on("dataReady", function (a) {
          a.removeListener();
          b.call(a.editor)
        });
        a = {dataValue: a};
        !c && this.fire("setData", a);
        this._.data = a.dataValue;
        !c && this.fire("afterSetData", a)
      }, setReadOnly: function (a) {
        a = a == void 0 || a;
        if (this.readOnly != a) {
          this.readOnly = a;
          this.keystrokeHandler.blockedKeystrokes[8] = +a;
          this.editable().setReadOnly(a);
          this.fire("readOnly")
        }
      }, insertHtml: function (a, b) {
        this.fire("insertHtml", {dataValue: a, mode: b})
      },
      insertText: function (a) {
        this.fire("insertText", a)
      }, insertElement: function (a) {
        this.fire("insertElement", a)
      }, focus: function () {
        this.fire("beforeFocus")
      }, checkDirty: function () {
        return this.status == "ready" && this._.previousValue !== this.getSnapshot()
      }, resetDirty: function () {
        this._.previousValue = this.getSnapshot()
      }, updateElement: function () {
        return u.call(this)
      }, setKeystroke: function () {
        for (var a = this.keystrokeHandler.keystrokes, b = CKEDITOR.tools.isArray(arguments[0]) ? arguments[0] : [[].slice.call(arguments, 0)], c,
               e, d = b.length; d--;) {
          c = b[d];
          e = 0;
          if (CKEDITOR.tools.isArray(c)) {
            e = c[1];
            c = c[0]
          }
          e ? a[c] = e : delete a[c]
        }
      }, addFeature: function (a) {
        return this.filter.addFeature(a)
      }, setActiveFilter: function (a) {
        if (!a)a = this.filter;
        if (this.activeFilter !== a) {
          this.activeFilter = a;
          this.fire("activeFilterChange");
          a === this.filter ? this.setActiveEnterMode(null, null) : this.setActiveEnterMode(a.getAllowedEnterMode(this.enterMode), a.getAllowedEnterMode(this.shiftEnterMode, true))
        }
      }, setActiveEnterMode: function (a, b) {
        a = a ? this.blockless ? CKEDITOR.ENTER_BR :
          a : this.enterMode;
        b = b ? this.blockless ? CKEDITOR.ENTER_BR : b : this.shiftEnterMode;
        if (this.activeEnterMode != a || this.activeShiftEnterMode != b) {
          this.activeEnterMode = a;
          this.activeShiftEnterMode = b;
          this.fire("activeEnterModeChange")
        }
      }
    })
  })();
  CKEDITOR.ELEMENT_MODE_NONE = 0;
  CKEDITOR.ELEMENT_MODE_REPLACE = 1;
  CKEDITOR.ELEMENT_MODE_APPENDTO = 2;
  CKEDITOR.ELEMENT_MODE_INLINE = 3;
  CKEDITOR.htmlParser = function () {
    this._ = {htmlPartsRegex: RegExp("<(?:(?:\\/([^>]+)>)|(?:!--([\\S|\\s]*?)--\>)|(?:([^\\s>]+)\\s*((?:(?:\"[^\"]*\")|(?:'[^']*')|[^\"'>])*)\\/?>))", "g")}
  };
  (function () {
    var a = /([\w\-:.]+)(?:(?:\s*=\s*(?:(?:"([^"]*)")|(?:'([^']*)')|([^\s>]+)))|(?=\s|$))/g, d = {
      checked: 1,
      compact: 1,
      declare: 1,
      defer: 1,
      disabled: 1,
      ismap: 1,
      multiple: 1,
      nohref: 1,
      noresize: 1,
      noshade: 1,
      nowrap: 1,
      readonly: 1,
      selected: 1
    };
    CKEDITOR.htmlParser.prototype = {
      onTagOpen: function () {
      }, onTagClose: function () {
      }, onText: function () {
      }, onCDATA: function () {
      }, onComment: function () {
      }, parse: function (b) {
        for (var c, e, f = 0, h; c = this._.htmlPartsRegex.exec(b);) {
          e = c.index;
          if (e > f) {
            f = b.substring(f, e);
            if (h)h.push(f); else this.onText(f)
          }
          f =
            this._.htmlPartsRegex.lastIndex;
          if (e = c[1]) {
            e = e.toLowerCase();
            if (h && CKEDITOR.dtd.$cdata[e]) {
              this.onCDATA(h.join(""));
              h = null
            }
            if (!h) {
              this.onTagClose(e);
              continue
            }
          }
          if (h)h.push(c[0]); else if (e = c[3]) {
            e = e.toLowerCase();
            if (!/="/.test(e)) {
              var n = {}, j;
              c = c[4];
              var k = !!(c && c.charAt(c.length - 1) == "/");
              if (c)for (; j = a.exec(c);) {
                var l = j[1].toLowerCase();
                j = j[2] || j[3] || j[4] || "";
                n[l] = !j && d[l] ? l : CKEDITOR.tools.htmlDecodeAttr(j)
              }
              this.onTagOpen(e, n, k);
              !h && CKEDITOR.dtd.$cdata[e] && (h = [])
            }
          } else if (e = c[2])this.onComment(e)
        }
        if (b.length >
          f)this.onText(b.substring(f, b.length))
      }
    }
  })();
  CKEDITOR.htmlParser.basicWriter = CKEDITOR.tools.createClass({
    $: function () {
      this._ = {output: []}
    }, proto: {
      openTag: function (a) {
        this._.output.push("<", a)
      }, openTagClose: function (a, d) {
        d ? this._.output.push(" />") : this._.output.push(">")
      }, attribute: function (a, d) {
        typeof d == "string" && (d = CKEDITOR.tools.htmlEncodeAttr(d));
        this._.output.push(" ", a, '="', d, '"')
      }, closeTag: function (a) {
        this._.output.push("</", a, ">")
      }, text: function (a) {
        this._.output.push(a)
      }, comment: function (a) {
        this._.output.push("<\!--", a, "--\>")
      }, write: function (a) {
        this._.output.push(a)
      },
      reset: function () {
        this._.output = [];
        this._.indent = false
      }, getHtml: function (a) {
        var d = this._.output.join("");
        a && this.reset();
        return d
      }
    }
  });
  "use strict";
  (function () {
    CKEDITOR.htmlParser.node = function () {
    };
    CKEDITOR.htmlParser.node.prototype = {
      remove: function () {
        var a = this.parent.children, d = CKEDITOR.tools.indexOf(a, this), b = this.previous, c = this.next;
        b && (b.next = c);
        c && (c.previous = b);
        a.splice(d, 1);
        this.parent = null
      }, replaceWith: function (a) {
        var d = this.parent.children, b = CKEDITOR.tools.indexOf(d, this), c = a.previous = this.previous, e = a.next = this.next;
        c && (c.next = a);
        e && (e.previous = a);
        d[b] = a;
        a.parent = this.parent;
        this.parent = null
      }, insertAfter: function (a) {
        var d = a.parent.children,
          b = CKEDITOR.tools.indexOf(d, a), c = a.next;
        d.splice(b + 1, 0, this);
        this.next = a.next;
        this.previous = a;
        a.next = this;
        c && (c.previous = this);
        this.parent = a.parent
      }, insertBefore: function (a) {
        var d = a.parent.children, b = CKEDITOR.tools.indexOf(d, a);
        d.splice(b, 0, this);
        this.next = a;
        (this.previous = a.previous) && (a.previous.next = this);
        a.previous = this;
        this.parent = a.parent
      }, getAscendant: function (a) {
        var d = typeof a == "function" ? a : typeof a == "string" ? function (b) {
          return b.name == a
        } : function (b) {
          return b.name in a
        }, b = this.parent;
        for (; b &&
               b.type == CKEDITOR.NODE_ELEMENT;) {
          if (d(b))return b;
          b = b.parent
        }
        return null
      }, wrapWith: function (a) {
        this.replaceWith(a);
        a.add(this);
        return a
      }, getIndex: function () {
        return CKEDITOR.tools.indexOf(this.parent.children, this)
      }, getFilterContext: function (a) {
        return a || {}
      }
    }
  })();
  "use strict";
  CKEDITOR.htmlParser.comment = function (a) {
    this.value = a;
    this._ = {isBlockLike: false}
  };
  CKEDITOR.htmlParser.comment.prototype = CKEDITOR.tools.extend(new CKEDITOR.htmlParser.node, {
    type: CKEDITOR.NODE_COMMENT,
    filter: function (a, d) {
      var b = this.value;
      if (!(b = a.onComment(d, b, this))) {
        this.remove();
        return false
      }
      if (typeof b != "string") {
        this.replaceWith(b);
        return false
      }
      this.value = b;
      return true
    },
    writeHtml: function (a, d) {
      d && this.filter(d);
      a.comment(this.value)
    }
  });
  "use strict";
  (function () {
    CKEDITOR.htmlParser.text = function (a) {
      this.value = a;
      this._ = {isBlockLike: false}
    };
    CKEDITOR.htmlParser.text.prototype = CKEDITOR.tools.extend(new CKEDITOR.htmlParser.node, {
      type: CKEDITOR.NODE_TEXT,
      filter: function (a, d) {
        if (!(this.value = a.onText(d, this.value, this))) {
          this.remove();
          return false
        }
      },
      writeHtml: function (a, d) {
        d && this.filter(d);
        a.text(this.value)
      }
    })
  })();
  "use strict";
  (function () {
    CKEDITOR.htmlParser.cdata = function (a) {
      this.value = a
    };
    CKEDITOR.htmlParser.cdata.prototype = CKEDITOR.tools.extend(new CKEDITOR.htmlParser.node, {
      type: CKEDITOR.NODE_TEXT,
      filter: function () {
      },
      writeHtml: function (a) {
        a.write(this.value)
      }
    })
  })();
  "use strict";
  CKEDITOR.htmlParser.fragment = function () {
    this.children = [];
    this.parent = null;
    this._ = {isBlockLike: true, hasInlineStarted: false}
  };
  (function () {
    function a(a) {
      return a.attributes["data-cke-survive"] ? false : a.name == "a" && a.attributes.href || CKEDITOR.dtd.$removeEmpty[a.name]
    }

    var d = CKEDITOR.tools.extend({
      table: 1,
      ul: 1,
      ol: 1,
      dl: 1
    }, CKEDITOR.dtd.table, CKEDITOR.dtd.ul, CKEDITOR.dtd.ol, CKEDITOR.dtd.dl), b = {
      ol: 1,
      ul: 1
    }, c = CKEDITOR.tools.extend({}, {html: 1}, CKEDITOR.dtd.html, CKEDITOR.dtd.body, CKEDITOR.dtd.head, {
      style: 1,
      script: 1
    });
    CKEDITOR.htmlParser.fragment.fromHtml = function (e, f, h) {
      function n(a) {
        var b;
        if (r.length > 0)for (var c = 0; c < r.length; c++) {
          var e =
            r[c], d = e.name, i = CKEDITOR.dtd[d], g = m.name && CKEDITOR.dtd[m.name];
          if ((!g || g[d]) && (!a || !i || i[a] || !CKEDITOR.dtd[a])) {
            if (!b) {
              j();
              b = 1
            }
            e = e.clone();
            e.parent = m;
            m = e;
            r.splice(c, 1);
            c--
          } else if (d == m.name) {
            l(m, m.parent, 1);
            c--
          }
        }
      }

      function j() {
        for (; w.length;)l(w.shift(), m)
      }

      function k(a) {
        if (a._.isBlockLike && a.name != "pre" && a.name != "textarea") {
          var b = a.children.length, c = a.children[b - 1], e;
          if (c && c.type == CKEDITOR.NODE_TEXT)(e = CKEDITOR.tools.rtrim(c.value)) ? c.value = e : a.children.length = b - 1
        }
      }

      function l(b, c, e) {
        var c = c || m || g,
          d = m;
        if (b.previous === void 0) {
          if (u(c, b)) {
            m = c;
            t.onTagOpen(h, {});
            b.returnPoint = c = m
          }
          k(b);
          (!a(b) || b.children.length) && c.add(b);
          b.name == "pre" && (q = false);
          b.name == "textarea" && (i = false)
        }
        if (b.returnPoint) {
          m = b.returnPoint;
          delete b.returnPoint
        } else m = e ? c : d
      }

      function u(a, b) {
        if ((a == g || a.name == "body") && h && (!a.name || CKEDITOR.dtd[a.name][h])) {
          var c, e;
          return (c = b.attributes && (e = b.attributes["data-cke-real-element-type"]) ? e : b.name) && c in CKEDITOR.dtd.$inline && !(c in CKEDITOR.dtd.head) && !b.isOrphan || b.type == CKEDITOR.NODE_TEXT
        }
      }

      function s(a, b) {
        return a in CKEDITOR.dtd.$listItem || a in CKEDITOR.dtd.$tableContent ? a == b || a == "dt" && b == "dd" || a == "dd" && b == "dt" : false
      }

      var t = new CKEDITOR.htmlParser, g = f instanceof CKEDITOR.htmlParser.element ? f : typeof f == "string" ? new CKEDITOR.htmlParser.element(f) : new CKEDITOR.htmlParser.fragment, r = [], w = [], m = g, i = g.name == "textarea", q = g.name == "pre";
      t.onTagOpen = function (e, g, f, h) {
        g = new CKEDITOR.htmlParser.element(e, g);
        if (g.isUnknown && f)g.isEmpty = true;
        g.isOptionalClose = h;
        if (a(g))r.push(g); else {
          if (e == "pre")q =
            true; else {
            if (e == "br" && q) {
              m.add(new CKEDITOR.htmlParser.text("\n"));
              return
            }
            e == "textarea" && (i = true)
          }
          if (e == "br")w.push(g); else {
            for (; ;) {
              h = (f = m.name) ? CKEDITOR.dtd[f] || (m._.isBlockLike ? CKEDITOR.dtd.div : CKEDITOR.dtd.span) : c;
              if (!g.isUnknown && !m.isUnknown && !h[e])if (m.isOptionalClose)t.onTagClose(f); else if (e in b && f in b) {
                f = m.children;
                (f = f[f.length - 1]) && f.name == "li" || l(f = new CKEDITOR.htmlParser.element("li"), m);
                !g.returnPoint && (g.returnPoint = m);
                m = f
              } else if (e in CKEDITOR.dtd.$listItem && !s(e, f))t.onTagOpen(e ==
              "li" ? "ul" : "dl", {}, 0, 1); else if (f in d && !s(e, f)) {
                !g.returnPoint && (g.returnPoint = m);
                m = m.parent
              } else {
                f in CKEDITOR.dtd.$inline && r.unshift(m);
                if (m.parent)l(m, m.parent, 1); else {
                  g.isOrphan = 1;
                  break
                }
              } else break
            }
            n(e);
            j();
            g.parent = m;
            g.isEmpty ? l(g) : m = g
          }
        }
      };
      t.onTagClose = function (a) {
        for (var b = r.length - 1; b >= 0; b--)if (a == r[b].name) {
          r.splice(b, 1);
          return
        }
        for (var c = [], e = [], d = m; d != g && d.name != a;) {
          d._.isBlockLike || e.unshift(d);
          c.push(d);
          d = d.returnPoint || d.parent
        }
        if (d != g) {
          for (b = 0; b < c.length; b++) {
            var i = c[b];
            l(i, i.parent)
          }
          m =
            d;
          d._.isBlockLike && j();
          l(d, d.parent);
          if (d == m)m = m.parent;
          r = r.concat(e)
        }
        a == "body" && (h = false)
      };
      t.onText = function (a) {
        if ((!m._.hasInlineStarted || w.length) && !q && !i) {
          a = CKEDITOR.tools.ltrim(a);
          if (a.length === 0)return
        }
        var e = m.name, g = e ? CKEDITOR.dtd[e] || (m._.isBlockLike ? CKEDITOR.dtd.div : CKEDITOR.dtd.span) : c;
        if (!i && !g["#"] && e in d) {
          t.onTagOpen(e in b ? "li" : e == "dl" ? "dd" : e == "table" ? "tr" : e == "tr" ? "td" : "");
          t.onText(a)
        } else {
          j();
          n();
          !q && !i && (a = a.replace(/[\t\r\n ]{2,}|[\t\r\n]/g, " "));
          a = new CKEDITOR.htmlParser.text(a);
          if (u(m, a))this.onTagOpen(h, {}, 0, 1);
          m.add(a)
        }
      };
      t.onCDATA = function (a) {
        m.add(new CKEDITOR.htmlParser.cdata(a))
      };
      t.onComment = function (a) {
        j();
        n();
        m.add(new CKEDITOR.htmlParser.comment(a))
      };
      t.parse(e);
      for (j(); m != g;)l(m, m.parent, 1);
      k(g);
      return g
    };
    CKEDITOR.htmlParser.fragment.prototype = {
      type: CKEDITOR.NODE_DOCUMENT_FRAGMENT, add: function (a, b) {
        isNaN(b) && (b = this.children.length);
        var c = b > 0 ? this.children[b - 1] : null;
        if (c) {
          if (a._.isBlockLike && c.type == CKEDITOR.NODE_TEXT) {
            c.value = CKEDITOR.tools.rtrim(c.value);
            if (c.value.length ===
              0) {
              this.children.pop();
              this.add(a);
              return
            }
          }
          c.next = a
        }
        a.previous = c;
        a.parent = this;
        this.children.splice(b, 0, a);
        if (!this._.hasInlineStarted)this._.hasInlineStarted = a.type == CKEDITOR.NODE_TEXT || a.type == CKEDITOR.NODE_ELEMENT && !a._.isBlockLike
      }, filter: function (a, b) {
        b = this.getFilterContext(b);
        a.onRoot(b, this);
        this.filterChildren(a, false, b)
      }, filterChildren: function (a, b, c) {
        if (this.childrenFilteredBy != a.id) {
          c = this.getFilterContext(c);
          if (b && !this.parent)a.onRoot(c, this);
          this.childrenFilteredBy = a.id;
          for (b = 0; b < this.children.length; b++)this.children[b].filter(a,
            c) === false && b--
        }
      }, writeHtml: function (a, b) {
        b && this.filter(b);
        this.writeChildrenHtml(a)
      }, writeChildrenHtml: function (a, b, c) {
        var d = this.getFilterContext();
        if (c && !this.parent && b)b.onRoot(d, this);
        b && this.filterChildren(b, false, d);
        b = 0;
        c = this.children;
        for (d = c.length; b < d; b++)c[b].writeHtml(a)
      }, forEach: function (a, b, c) {
        if (!c && (!b || this.type == b))var d = a(this);
        if (d !== false)for (var c = this.children, j = 0; j < c.length; j++) {
          d = c[j];
          d.type == CKEDITOR.NODE_ELEMENT ? d.forEach(a, b) : (!b || d.type == b) && a(d)
        }
      }, getFilterContext: function (a) {
        return a ||
          {}
      }
    }
  })();
  "use strict";
  (function () {
    function a() {
      this.rules = []
    }

    function d(b, c, e, d) {
      var h, n;
      for (h in c) {
        (n = b[h]) || (n = b[h] = new a);
        n.add(c[h], e, d)
      }
    }

    CKEDITOR.htmlParser.filter = CKEDITOR.tools.createClass({
      $: function (b) {
        this.id = CKEDITOR.tools.getNextNumber();
        this.elementNameRules = new a;
        this.attributeNameRules = new a;
        this.elementsRules = {};
        this.attributesRules = {};
        this.textRules = new a;
        this.commentRules = new a;
        this.rootRules = new a;
        b && this.addRules(b, 10)
      }, proto: {
        addRules: function (a, c) {
          var e;
          if (typeof c == "number")e = c; else if (c && "priority"in
            c)e = c.priority;
          typeof e != "number" && (e = 10);
          typeof c != "object" && (c = {});
          a.elementNames && this.elementNameRules.addMany(a.elementNames, e, c);
          a.attributeNames && this.attributeNameRules.addMany(a.attributeNames, e, c);
          a.elements && d(this.elementsRules, a.elements, e, c);
          a.attributes && d(this.attributesRules, a.attributes, e, c);
          a.text && this.textRules.add(a.text, e, c);
          a.comment && this.commentRules.add(a.comment, e, c);
          a.root && this.rootRules.add(a.root, e, c)
        }, applyTo: function (a) {
          a.filter(this)
        }, onElementName: function (a, c) {
          return this.elementNameRules.execOnName(a,
            c)
        }, onAttributeName: function (a, c) {
          return this.attributeNameRules.execOnName(a, c)
        }, onText: function (a, c) {
          return this.textRules.exec(a, c)
        }, onComment: function (a, c, e) {
          return this.commentRules.exec(a, c, e)
        }, onRoot: function (a, c) {
          return this.rootRules.exec(a, c)
        }, onElement: function (a, c) {
          for (var e = [this.elementsRules["^"], this.elementsRules[c.name], this.elementsRules.$], d, h = 0; h < 3; h++)if (d = e[h]) {
            d = d.exec(a, c, this);
            if (d === false)return null;
            if (d && d != c)return this.onNode(a, d);
            if (c.parent && !c.name)break
          }
          return c
        },
        onNode: function (a, c) {
          var e = c.type;
          return e == CKEDITOR.NODE_ELEMENT ? this.onElement(a, c) : e == CKEDITOR.NODE_TEXT ? new CKEDITOR.htmlParser.text(this.onText(a, c.value)) : e == CKEDITOR.NODE_COMMENT ? new CKEDITOR.htmlParser.comment(this.onComment(a, c.value)) : null
        }, onAttribute: function (a, c, e, d) {
          return (e = this.attributesRules[e]) ? e.exec(a, d, c, this) : d
        }
      }
    });
    CKEDITOR.htmlParser.filterRulesGroup = a;
    a.prototype = {
      add: function (a, c, e) {
        this.rules.splice(this.findIndex(c), 0, {value: a, priority: c, options: e})
      }, addMany: function (a,
                            c, e) {
        for (var d = [this.findIndex(c), 0], h = 0, n = a.length; h < n; h++)d.push({
          value: a[h],
          priority: c,
          options: e
        });
        this.rules.splice.apply(this.rules, d)
      }, findIndex: function (a) {
        for (var c = this.rules, e = c.length - 1; e >= 0 && a < c[e].priority;)e--;
        return e + 1
      }, exec: function (a, c) {
        var e = c instanceof CKEDITOR.htmlParser.node || c instanceof CKEDITOR.htmlParser.fragment, d = Array.prototype.slice.call(arguments, 1), h = this.rules, n = h.length, j, k, l, u;
        for (u = 0; u < n; u++) {
          if (e) {
            j = c.type;
            k = c.name
          }
          l = h[u];
          if (!a.nonEditable || l.options.applyToAll) {
            l =
              l.value.apply(null, d);
            if (l === false)return l;
            if (e) {
              if (l && (l.name != k || l.type != j))return l
            } else if (typeof l != "string")return l;
            l != void 0 && (d[0] = c = l)
          }
        }
        return c
      }, execOnName: function (a, c) {
        for (var e = 0, d = this.rules, h = d.length, n; c && e < h; e++) {
          n = d[e];
          if (!a.nonEditable || n.options.applyToAll)c = c.replace(n.value[0], n.value[1])
        }
        return c
      }
    }
  })();
  (function () {
    function a(a, d) {
      function g(a) {
        return a || CKEDITOR.env.needsNbspFiller ? new CKEDITOR.htmlParser.text(" ") : new CKEDITOR.htmlParser.element("br", {"data-cke-bogus": 1})
      }

      function m(a, e) {
        return function (d) {
          if (d.type != CKEDITOR.NODE_DOCUMENT_FRAGMENT) {
            var i = [], m = b(d), z, h;
            if (m)for (q(m, 1) && i.push(m); m;) {
              if (f(m) && (z = c(m)) && q(z))if ((h = c(z)) && !f(h))i.push(z); else {
                g(t).insertAfter(z);
                z.remove()
              }
              m = m.previous
            }
            for (m = 0; m < i.length; m++)i[m].remove();
            if (i = CKEDITOR.env.opera && !a || (typeof e == "function" ? e(d) !==
                false : e))if (!t && !CKEDITOR.env.needsBrFiller && d.type == CKEDITOR.NODE_DOCUMENT_FRAGMENT)i = false; else if (!t && !CKEDITOR.env.needsBrFiller && (document.documentMode > 7 || d.name in CKEDITOR.dtd.tr || d.name in CKEDITOR.dtd.$listItem))i = false; else {
              i = b(d);
              i = !i || d.name == "form" && i.name == "input"
            }
            i && d.add(g(a))
          }
        }
      }

      function q(a, b) {
        if ((!t || CKEDITOR.env.needsBrFiller) && a.type == CKEDITOR.NODE_ELEMENT && a.name == "br" && !a.attributes["data-cke-eol"])return true;
        var c;
        if (a.type == CKEDITOR.NODE_TEXT && (c = a.value.match(w))) {
          if (c.index) {
            (new CKEDITOR.htmlParser.text(a.value.substring(0,
              c.index))).insertBefore(a);
            a.value = c[0]
          }
          if (!CKEDITOR.env.needsBrFiller && t && (!b || a.parent.name in v))return true;
          if (!t)if ((c = a.previous) && c.name == "br" || !c || f(c))return true
        }
        return false
      }

      var p = {elements: {}}, t = d == "html", v = CKEDITOR.tools.extend({}, o), j;
      for (j in v)"#"in i[j] || delete v[j];
      for (j in v)p.elements[j] = m(t, a.config.fillEmptyBlocks !== false);
      p.root = m(t);
      p.elements.br = function (a) {
        return function (b) {
          if (b.parent.type != CKEDITOR.NODE_DOCUMENT_FRAGMENT) {
            var d = b.attributes;
            if ("data-cke-bogus"in d || "data-cke-eol"in
              d)delete d["data-cke-bogus"]; else {
              for (d = b.next; d && e(d);)d = d.next;
              var i = c(b);
              !d && f(b.parent) ? h(b.parent, g(a)) : f(d) && (i && !f(i)) && g(a).insertBefore(d)
            }
          }
        }
      }(t);
      return p
    }

    function d(a, b) {
      return a != CKEDITOR.ENTER_BR && b !== false ? a == CKEDITOR.ENTER_DIV ? "div" : "p" : false
    }

    function b(a) {
      for (a = a.children[a.children.length - 1]; a && e(a);)a = a.previous;
      return a
    }

    function c(a) {
      for (a = a.previous; a && e(a);)a = a.previous;
      return a
    }

    function e(a) {
      return a.type == CKEDITOR.NODE_TEXT && !CKEDITOR.tools.trim(a.value) || a.type == CKEDITOR.NODE_ELEMENT &&
        a.attributes["data-cke-bookmark"]
    }

    function f(a) {
      return a && (a.type == CKEDITOR.NODE_ELEMENT && a.name in o || a.type == CKEDITOR.NODE_DOCUMENT_FRAGMENT)
    }

    function h(a, b) {
      var c = a.children[a.children.length - 1];
      a.children.push(b);
      b.parent = a;
      if (c) {
        c.next = b;
        b.previous = c
      }
    }

    function n(a) {
      a = a.attributes;
      a.contenteditable != "false" && (a["data-cke-editable"] = a.contenteditable ? "true" : 1);
      a.contenteditable = "false"
    }

    function j(a) {
      a = a.attributes;
      switch (a["data-cke-editable"]) {
        case "true":
          a.contenteditable = "true";
          break;
        case "1":
          delete a.contenteditable
      }
    }

    function k(a) {
      return a.replace(I, function (a, b, c) {
        return "<" + b + c.replace(C, function (a, b) {
            if (!/^on/.test(b) && c.indexOf("data-cke-saved-" + b) == -1) {
              a = a.slice(1);
              return " data-cke-saved-" + a + " data-cke-" + CKEDITOR.rnd + "-" + a
            }
            return a
          }) + ">"
      })
    }

    function l(a, b) {
      return a.replace(b, function (a, b, c) {
        a.indexOf("<textarea") === 0 && (a = b + t(c).replace(/</g, "&lt;").replace(/>/g, "&gt;") + "</textarea>");
        return "<cke:encoded>" + encodeURIComponent(a) + "</cke:encoded>"
      })
    }

    function u(a) {
      return a.replace(y, function (a, b) {
        return decodeURIComponent(b)
      })
    }

    function s(a) {
      return a.replace(/<\!--(?!{cke_protected})[\s\S]+?--\>/g, function (a) {
        return "<\!--" + m + "{C}" + encodeURIComponent(a).replace(/--/g, "%2D%2D") + "--\>"
      })
    }

    function t(a) {
      return a.replace(/<\!--\{cke_protected\}\{C\}([\s\S]+?)--\>/g, function (a, b) {
        return decodeURIComponent(b)
      })
    }

    function g(a, b) {
      var c = b._.dataStore;
      return a.replace(/<\!--\{cke_protected\}([\s\S]+?)--\>/g, function (a, b) {
        return decodeURIComponent(b)
      }).replace(/\{cke_protected_(\d+)\}/g, function (a, b) {
        return c && c[b] || ""
      })
    }

    function r(a,
               b) {
      for (var c = [], e = b.config.protectedSource, d = b._.dataStore || (b._.dataStore = {id: 1}), i = /<\!--\{cke_temp(comment)?\}(\d*?)--\>/g, e = [/<script[\s\S]*?<\/script>/gi, /<noscript[\s\S]*?<\/noscript>/gi].concat(e), a = a.replace(/<\!--[\s\S]*?--\>/g, function (a) {
        return "<\!--{cke_tempcomment}" + (c.push(a) - 1) + "--\>"
      }), g = 0; g < e.length; g++)a = a.replace(e[g], function (a) {
        a = a.replace(i, function (a, b, e) {
          return c[e]
        });
        return /cke_temp(comment)?/.test(a) ? a : "<\!--{cke_temp}" + (c.push(a) - 1) + "--\>"
      });
      a = a.replace(i, function (a, b, e) {
        return "<\!--" +
          m + (b ? "{C}" : "") + encodeURIComponent(c[e]).replace(/--/g, "%2D%2D") + "--\>"
      });
      return a.replace(/(['"]).*?\1/g, function (a) {
        return a.replace(/<\!--\{cke_protected\}([\s\S]+?)--\>/g, function (a, b) {
          d[d.id] = decodeURIComponent(b);
          return "{cke_protected_" + d.id++ + "}"
        })
      })
    }

    CKEDITOR.htmlDataProcessor = function (b) {
      var c, e, i = this;
      this.editor = b;
      this.dataFilter = c = new CKEDITOR.htmlParser.filter;
      this.htmlFilter = e = new CKEDITOR.htmlParser.filter;
      this.writer = new CKEDITOR.htmlParser.basicWriter;
      c.addRules(B);
      c.addRules(p, {applyToAll: true});
      c.addRules(a(b, "data"), {applyToAll: true});
      e.addRules(L);
      e.addRules(E, {applyToAll: true});
      e.addRules(a(b, "html"), {applyToAll: true});
      b.on("toHtml", function (a) {
        var a = a.data, c = a.dataValue, c = r(c, b), c = l(c, M), c = k(c), c = l(c, x), c = c.replace(v, "$1cke:$2"), c = c.replace(F, "<cke:$1$2></cke:$1>"), c = CKEDITOR.env.opera ? c : c.replace(/(<pre\b[^>]*>)(\r\n|\n)/g, "$1$2$2"), e = a.context || b.editable().getName(), i;
        if (CKEDITOR.env.ie && CKEDITOR.env.version < 9 && e == "pre") {
          e = "div";
          c = "<pre>" + c + "</pre>";
          i = 1
        }
        e = b.document.createElement(e);
        e.setHtml("a" + c);
        c = e.getHtml().substr(1);
        c = c.replace(RegExp(" data-cke-" + CKEDITOR.rnd + "-", "ig"), " ");
        i && (c = c.replace(/^<pre>|<\/pre>$/gi, ""));
        c = c.replace(D, "$1$2");
        c = u(c);
        c = t(c);
        a.dataValue = CKEDITOR.htmlParser.fragment.fromHtml(c, a.context, a.fixForBody === false ? false : d(a.enterMode, b.config.autoParagraph))
      }, null, null, 5);
      b.on("toHtml", function (a) {
        a.data.filter.applyTo(a.data.dataValue, true, a.data.dontFilter, a.data.enterMode) && b.fire("dataFiltered")
      }, null, null, 6);
      b.on("toHtml", function (a) {
        a.data.dataValue.filterChildren(i.dataFilter,
          true)
      }, null, null, 10);
      b.on("toHtml", function (a) {
        var a = a.data, b = a.dataValue, c = new CKEDITOR.htmlParser.basicWriter;
        b.writeChildrenHtml(c);
        b = c.getHtml(true);
        a.dataValue = s(b)
      }, null, null, 15);
      b.on("toDataFormat", function (a) {
        var c = a.data.dataValue;
        a.data.enterMode != CKEDITOR.ENTER_BR && (c = c.replace(/^<br *\/?>/i, ""));
        a.data.dataValue = CKEDITOR.htmlParser.fragment.fromHtml(c, a.data.context, d(a.data.enterMode, b.config.autoParagraph))
      }, null, null, 5);
      b.on("toDataFormat", function (a) {
        a.data.dataValue.filterChildren(i.htmlFilter,
          true)
      }, null, null, 10);
      b.on("toDataFormat", function (a) {
        a.data.filter.applyTo(a.data.dataValue, false, true)
      }, null, null, 11);
      b.on("toDataFormat", function (a) {
        var c = a.data.dataValue, e = i.writer;
        e.reset();
        c.writeChildrenHtml(e);
        c = e.getHtml(true);
        c = t(c);
        c = g(c, b);
        a.data.dataValue = c
      }, null, null, 15)
    };
    CKEDITOR.htmlDataProcessor.prototype = {
      toHtml: function (a, b, c, e) {
        var d = this.editor, i, g, f;
        if (b && typeof b == "object") {
          i = b.context;
          c = b.fixForBody;
          e = b.dontFilter;
          g = b.filter;
          f = b.enterMode
        } else i = b;
        !i && i !== null && (i = d.editable().getName());
        return d.fire("toHtml", {
          dataValue: a,
          context: i,
          fixForBody: c,
          dontFilter: e,
          filter: g || d.filter,
          enterMode: f || d.enterMode
        }).dataValue
      }, toDataFormat: function (a, b) {
        var c, e, d;
        if (b) {
          c = b.context;
          e = b.filter;
          d = b.enterMode
        }
        !c && c !== null && (c = this.editor.editable().getName());
        return this.editor.fire("toDataFormat", {
          dataValue: a,
          filter: e || this.editor.filter,
          context: c,
          enterMode: d || this.editor.enterMode
        }).dataValue
      }
    };
    var w = /(?:&nbsp;|\xa0)$/, m = "{cke_protected}", i = CKEDITOR.dtd, q = ["caption", "colgroup", "col", "thead", "tfoot",
      "tbody"], o = CKEDITOR.tools.extend({}, i.$blockLimit, i.$block), B = {
      elements: {
        input: n,
        textarea: n
      }
    }, p = {attributeNames: [[/^on/, "data-cke-pa-on"], [/^data-cke-expando$/, ""]]}, L = {
      elements: {
        embed: function (a) {
          var b = a.parent;
          if (b && b.name == "object") {
            var c = b.attributes.width, b = b.attributes.height;
            if (c)a.attributes.width = c;
            if (b)a.attributes.height = b
          }
        }, a: function (a) {
          if (!a.children.length && !a.attributes.name && !a.attributes["data-cke-saved-name"])return false
        }
      }
    }, E = {
      elementNames: [[/^cke:/, ""], [/^\?xml:namespace$/, ""]],
      attributeNames: [[/^data-cke-(saved|pa)-/, ""], [/^data-cke-.*/, ""], ["hidefocus", ""]], elements: {
        $: function (a) {
          var b = a.attributes;
          if (b) {
            if (b["data-cke-temp"])return false;
            for (var c = ["name", "href", "src"], e, d = 0; d < c.length; d++) {
              e = "data-cke-saved-" + c[d];
              e in b && delete b[c[d]]
            }
          }
          return a
        }, table: function (a) {
          a.children.slice(0).sort(function (a, b) {
            var c, e;
            if (a.type == CKEDITOR.NODE_ELEMENT && b.type == a.type) {
              c = CKEDITOR.tools.indexOf(q, a.name);
              e = CKEDITOR.tools.indexOf(q, b.name)
            }
            if (!(c > -1 && e > -1 && c != e)) {
              c = a.parent ? a.getIndex() :
                -1;
              e = b.parent ? b.getIndex() : -1
            }
            return c > e ? 1 : -1
          })
        }, param: function (a) {
          a.children = [];
          a.isEmpty = true;
          return a
        }, span: function (a) {
          a.attributes["class"] == "Apple-style-span" && delete a.name
        }, html: function (a) {
          delete a.attributes.contenteditable;
          delete a.attributes["class"]
        }, body: function (a) {
          delete a.attributes.spellcheck;
          delete a.attributes.contenteditable
        }, style: function (a) {
          var b = a.children[0];
          if (b && b.value)b.value = CKEDITOR.tools.trim(b.value);
          if (!a.attributes.type)a.attributes.type = "text/css"
        }, title: function (a) {
          var b =
            a.children[0];
          !b && h(a, b = new CKEDITOR.htmlParser.text);
          b.value = a.attributes["data-cke-title"] || ""
        }, input: j, textarea: j
      }, attributes: {
        "class": function (a) {
          return CKEDITOR.tools.ltrim(a.replace(/(?:^|\s+)cke_[^\s]*/g, "")) || false
        }
      }
    };
    if (CKEDITOR.env.ie)E.attributes.style = function (a) {
      return a.replace(/(^|;)([^\:]+)/g, function (a) {
        return a.toLowerCase()
      })
    };
    var I = /<(a|area|img|input|source)\b([^>]*)>/gi, C = /\s(on\w+|href|src|name)\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|(?:[^ "'>]+))/gi, x = /(?:<style(?=[ >])[^>]*>[\s\S]*?<\/style>)|(?:<(:?link|meta|base)[^>]*>)/gi,
      M = /(<textarea(?=[ >])[^>]*>)([\s\S]*?)(?:<\/textarea>)/gi, y = /<cke:encoded>([^<]*)<\/cke:encoded>/gi, v = /(<\/?)((?:object|embed|param|html|body|head|title)[^>]*>)/gi, D = /(<\/?)cke:((?:html|body|head|title)[^>]*>)/gi, F = /<cke:(param|embed)([^>]*?)\/?>(?!\s*<\/cke:\1)/gi
  })();
  "use strict";
  CKEDITOR.htmlParser.element = function (a, d) {
    this.name = a;
    this.attributes = d || {};
    this.children = [];
    var b = a || "", c = b.match(/^cke:(.*)/);
    c && (b = c[1]);
    b = !(!CKEDITOR.dtd.$nonBodyContent[b] && !CKEDITOR.dtd.$block[b] && !CKEDITOR.dtd.$listItem[b] && !CKEDITOR.dtd.$tableContent[b] && !(CKEDITOR.dtd.$nonEditable[b] || b == "br"));
    this.isEmpty = !!CKEDITOR.dtd.$empty[a];
    this.isUnknown = !CKEDITOR.dtd[a];
    this._ = {isBlockLike: b, hasInlineStarted: this.isEmpty || !b}
  };
  CKEDITOR.htmlParser.cssStyle = function (a) {
    var d = {};
    ((a instanceof CKEDITOR.htmlParser.element ? a.attributes.style : a) || "").replace(/&quot;/g, '"').replace(/\s*([^ :;]+)\s*:\s*([^;]+)\s*(?=;|$)/g, function (a, c, e) {
      c == "font-family" && (e = e.replace(/["']/g, ""));
      d[c.toLowerCase()] = e
    });
    return {
      rules: d, populate: function (a) {
        var c = this.toString();
        if (c)a instanceof CKEDITOR.dom.element ? a.setAttribute("style", c) : a instanceof CKEDITOR.htmlParser.element ? a.attributes.style = c : a.style = c
      }, toString: function () {
        var a = [], c;
        for (c in d)d[c] && a.push(c, ":", d[c], ";");
        return a.join("")
      }
    }
  };
  (function () {
    function a(a) {
      return function (b) {
        return b.type == CKEDITOR.NODE_ELEMENT && (typeof a == "string" ? b.name == a : b.name in a)
      }
    }

    var d = function (a, b) {
      a = a[0];
      b = b[0];
      return a < b ? -1 : a > b ? 1 : 0
    }, b = CKEDITOR.htmlParser.fragment.prototype;
    CKEDITOR.htmlParser.element.prototype = CKEDITOR.tools.extend(new CKEDITOR.htmlParser.node, {
      type: CKEDITOR.NODE_ELEMENT, add: b.add, clone: function () {
        return new CKEDITOR.htmlParser.element(this.name, this.attributes)
      }, filter: function (a, b) {
        var d = this, h, n, b = d.getFilterContext(b);
        if (b.off)return true;
        if (!d.parent)a.onRoot(b, d);
        for (; ;) {
          h = d.name;
          if (!(n = a.onElementName(b, h))) {
            this.remove();
            return false
          }
          d.name = n;
          if (!(d = a.onElement(b, d))) {
            this.remove();
            return false
          }
          if (d !== this) {
            this.replaceWith(d);
            return false
          }
          if (d.name == h)break;
          if (d.type != CKEDITOR.NODE_ELEMENT) {
            this.replaceWith(d);
            return false
          }
          if (!d.name) {
            this.replaceWithChildren();
            return false
          }
        }
        h = d.attributes;
        var j, k;
        for (j in h) {
          k = j;
          for (n = h[j]; ;)if (k = a.onAttributeName(b, j))if (k != j) {
            delete h[j];
            j = k
          } else break; else {
            delete h[j];
            break
          }
          k && ((n = a.onAttribute(b,
            d, k, n)) === false ? delete h[k] : h[k] = n)
        }
        d.isEmpty || this.filterChildren(a, false, b);
        return true
      }, filterChildren: b.filterChildren, writeHtml: function (a, b) {
        b && this.filter(b);
        var f = this.name, h = [], n = this.attributes, j, k;
        a.openTag(f, n);
        for (j in n)h.push([j, n[j]]);
        a.sortAttributes && h.sort(d);
        j = 0;
        for (k = h.length; j < k; j++) {
          n = h[j];
          a.attribute(n[0], n[1])
        }
        a.openTagClose(f, this.isEmpty);
        this.writeChildrenHtml(a);
        this.isEmpty || a.closeTag(f)
      }, writeChildrenHtml: b.writeChildrenHtml, replaceWithChildren: function () {
        for (var a =
          this.children, b = a.length; b;)a[--b].insertAfter(this);
        this.remove()
      }, forEach: b.forEach, getFirst: function (b) {
        if (!b)return this.children.length ? this.children[0] : null;
        typeof b != "function" && (b = a(b));
        for (var e = 0, d = this.children.length; e < d; ++e)if (b(this.children[e]))return this.children[e];
        return null
      }, getHtml: function () {
        var a = new CKEDITOR.htmlParser.basicWriter;
        this.writeChildrenHtml(a);
        return a.getHtml()
      }, setHtml: function (a) {
        for (var a = this.children = CKEDITOR.htmlParser.fragment.fromHtml(a).children, b = 0,
               d = a.length; b < d; ++b)a[b].parent = this
      }, getOuterHtml: function () {
        var a = new CKEDITOR.htmlParser.basicWriter;
        this.writeHtml(a);
        return a.getHtml()
      }, split: function (a) {
        for (var b = this.children.splice(a, this.children.length - a), d = this.clone(), h = 0; h < b.length; ++h)b[h].parent = d;
        d.children = b;
        if (b[0])b[0].previous = null;
        if (a > 0)this.children[a - 1].next = null;
        this.parent.add(d, this.getIndex() + 1);
        return d
      }, removeClass: function (a) {
        var b = this.attributes["class"];
        if (b)(b = CKEDITOR.tools.trim(b.replace(RegExp("(?:\\s+|^)" + a +
          "(?:\\s+|$)"), " "))) ? this.attributes["class"] = b : delete this.attributes["class"]
      }, hasClass: function (a) {
        var b = this.attributes["class"];
        return !b ? false : RegExp("(?:^|\\s)" + a + "(?=\\s|$)").test(b)
      }, getFilterContext: function (a) {
        var b = [];
        a || (a = {off: false, nonEditable: false});
        !a.off && this.attributes["data-cke-processor"] == "off" && b.push("off", true);
        !a.nonEditable && this.attributes.contenteditable == "false" && b.push("nonEditable", true);
        if (b.length)for (var a = CKEDITOR.tools.copy(a), d = 0; d < b.length; d = d + 2)a[b[d]] = b[d +
        1];
        return a
      }
    }, true)
  })();
  (function () {
    var a = {};
    CKEDITOR.template = function (d) {
      if (a[d])this.output = a[d]; else {
        var b = d.replace(/'/g, "\\'").replace(/{([^}]+)}/g, function (a, b) {
          return "',data['" + b + "']==undefined?'{" + b + "}':data['" + b + "'],'"
        });
        this.output = a[d] = Function("data", "buffer", "return buffer?buffer.push('" + b + "'):['" + b + "'].join('');")
      }
    }
  })();
  delete CKEDITOR.loadFullCore;
  CKEDITOR.instances = {};
  CKEDITOR.document = new CKEDITOR.dom.document(document);
  CKEDITOR.add = function (a) {
    CKEDITOR.instances[a.name] = a;
    a.on("focus", function () {
      if (CKEDITOR.currentInstance != a) {
        CKEDITOR.currentInstance = a;
        CKEDITOR.fire("currentInstance")
      }
    });
    a.on("blur", function () {
      if (CKEDITOR.currentInstance == a) {
        CKEDITOR.currentInstance = null;
        CKEDITOR.fire("currentInstance")
      }
    });
    CKEDITOR.fire("instance", null, a)
  };
  CKEDITOR.remove = function (a) {
    delete CKEDITOR.instances[a.name]
  };
  (function () {
    var a = {};
    CKEDITOR.addTemplate = function (d, b) {
      var c = a[d];
      if (c)return c;
      c = {name: d, source: b};
      CKEDITOR.fire("template", c);
      return a[d] = new CKEDITOR.template(c.source)
    };
    CKEDITOR.getTemplate = function (d) {
      return a[d]
    }
  })();
  (function () {
    var a = [];
    CKEDITOR.addCss = function (d) {
      a.push(d)
    };
    CKEDITOR.getCss = function () {
      return a.join("\n")
    }
  })();
  CKEDITOR.on("instanceDestroyed", function () {
    CKEDITOR.tools.isEmpty(this.instances) && CKEDITOR.fire("reset")
  });
  CKEDITOR.TRISTATE_ON = 1;
  CKEDITOR.TRISTATE_OFF = 2;
  CKEDITOR.TRISTATE_DISABLED = 0;
  (function () {
    CKEDITOR.inline = function (a, d) {
      if (!CKEDITOR.env.isCompatible)return null;
      a = CKEDITOR.dom.element.get(a);
      if (a.getEditor())throw'The editor instance "' + a.getEditor().name + '" is already attached to the provided element.';
      var b = new CKEDITOR.editor(d, a, CKEDITOR.ELEMENT_MODE_INLINE), c = a.is("textarea") ? a : null;
      if (c) {
        b.setData(c.getValue(), null, true);
        a = CKEDITOR.dom.element.createFromHtml('<div contenteditable="' + !!b.readOnly + '" class="cke_textarea_inline">' + c.getValue() + "</div>", CKEDITOR.document);
        a.insertAfter(c);
        c.hide();
        c.$.form && b._attachToForm()
      } else b.setData(a.getHtml(), null, true);
      b.on("loaded", function () {
        b.fire("uiReady");
        b.editable(a);
        b.container = a;
        b.setData(b.getData(1));
        b.resetDirty();
        b.fire("contentDom");
        b.mode = "wysiwyg";
        b.fire("mode");
        b.status = "ready";
        b.fireOnce("instanceReady");
        CKEDITOR.fire("instanceReady", null, b)
      }, null, null, 1E4);
      b.on("destroy", function () {
        if (c) {
          b.container.clearCustomData();
          b.container.remove();
          c.show()
        }
        b.element.clearCustomData();
        delete b.element
      });
      return b
    };
    CKEDITOR.inlineAll = function () {
      var a, d, b;
      for (b in CKEDITOR.dtd.$editable)for (var c = CKEDITOR.document.getElementsByTag(b), e = 0, f = c.count(); e < f; e++) {
        a = c.getItem(e);
        if (a.getAttribute("contenteditable") == "true") {
          d = {element: a, config: {}};
          CKEDITOR.fire("inline", d) !== false && CKEDITOR.inline(a, d.config)
        }
      }
    };
    CKEDITOR.domReady(function () {
      !CKEDITOR.disableAutoInline && CKEDITOR.inlineAll()
    })
  })();
  CKEDITOR.replaceClass = "ckeditor";
  (function () {
    function a(a, c, h, n) {
      if (!CKEDITOR.env.isCompatible)return null;
      a = CKEDITOR.dom.element.get(a);
      if (a.getEditor())throw'The editor instance "' + a.getEditor().name + '" is already attached to the provided element.';
      var j = new CKEDITOR.editor(c, a, n);
      if (n == CKEDITOR.ELEMENT_MODE_REPLACE) {
        a.setStyle("visibility", "hidden");
        j._.required = a.hasAttribute("required");
        a.removeAttribute("required")
      }
      h && j.setData(h, null, true);
      j.on("loaded", function () {
        b(j);
        n == CKEDITOR.ELEMENT_MODE_REPLACE && (j.config.autoUpdateElement &&
        a.$.form) && j._attachToForm();
        j.setMode(j.config.startupMode, function () {
          j.resetDirty();
          j.status = "ready";
          j.fireOnce("instanceReady");
          CKEDITOR.fire("instanceReady", null, j)
        })
      });
      j.on("destroy", d);
      return j
    }

    function d() {
      var a = this.container, b = this.element;
      if (a) {
        a.clearCustomData();
        a.remove()
      }
      if (b) {
        b.clearCustomData();
        if (this.elementMode == CKEDITOR.ELEMENT_MODE_REPLACE) {
          b.show();
          this._.required && b.setAttribute("required", "required")
        }
        delete this.element
      }
    }

    function b(a) {
      var b = a.name, d = a.element, n = a.elementMode,
        j = a.fire("uiSpace", {space: "top", html: ""}).html, k = a.fire("uiSpace", {space: "bottom", html: ""}).html;
      c || (c = CKEDITOR.addTemplate("maincontainer", '<{outerEl} id="cke_{name}" class="{id} cke cke_reset cke_chrome cke_editor_{name} cke_{langDir} ' + CKEDITOR.env.cssClass + '"  dir="{langDir}" lang="{langCode}" role="application" aria-labelledby="cke_{name}_arialbl"><span id="cke_{name}_arialbl" class="cke_voice_label">{voiceLabel}</span><{outerEl} class="cke_inner cke_reset" role="presentation">{topHtml}<{outerEl} id="{contentId}" class="cke_contents cke_reset" role="presentation"></{outerEl}>{bottomHtml}</{outerEl}></{outerEl}>'));
      b = CKEDITOR.dom.element.createFromHtml(c.output({
        id: a.id,
        name: b,
        langDir: a.lang.dir,
        langCode: a.langCode,
        voiceLabel: [a.lang.editor, a.name].join(", "),
        topHtml: j ? '<span id="' + a.ui.spaceId("top") + '" class="cke_top cke_reset_all" role="presentation" style="height:auto">' + j + "</span>" : "",
        contentId: a.ui.spaceId("contents"),
        bottomHtml: k ? '<span id="' + a.ui.spaceId("bottom") + '" class="cke_bottom cke_reset_all" role="presentation">' + k + "</span>" : "",
        outerEl: CKEDITOR.env.ie ? "span" : "div"
      }));
      if (n == CKEDITOR.ELEMENT_MODE_REPLACE) {
        d.hide();
        b.insertAfter(d)
      } else d.append(b);
      a.container = b;
      j && a.ui.space("top").unselectable();
      k && a.ui.space("bottom").unselectable();
      d = a.config.width;
      n = a.config.height;
      d && b.setStyle("width", CKEDITOR.tools.cssLength(d));
      n && a.ui.space("contents").setStyle("height", CKEDITOR.tools.cssLength(n));
      b.disableContextMenu();
      CKEDITOR.env.webkit && b.on("focus", function () {
        a.focus()
      });
      a.fireOnce("uiReady")
    }

    CKEDITOR.replace = function (b, c) {
      return a(b, c, null, CKEDITOR.ELEMENT_MODE_REPLACE)
    };
    CKEDITOR.appendTo = function (b, c, d) {
      return a(b,
        c, d, CKEDITOR.ELEMENT_MODE_APPENDTO)
    };
    CKEDITOR.replaceAll = function () {
      for (var a = document.getElementsByTagName("textarea"), b = 0; b < a.length; b++) {
        var c = null, d = a[b];
        if (d.name || d.id) {
          if (typeof arguments[0] == "string") {
            if (!RegExp("(?:^|\\s)" + arguments[0] + "(?:$|\\s)").test(d.className))continue
          } else if (typeof arguments[0] == "function") {
            c = {};
            if (arguments[0](d, c) === false)continue
          }
          this.replace(d, c)
        }
      }
    };
    CKEDITOR.editor.prototype.addMode = function (a, b) {
      (this._.modes || (this._.modes = {}))[a] = b
    };
    CKEDITOR.editor.prototype.setMode =
      function (a, b) {
        var c = this, d = this._.modes;
        if (!(a == c.mode || !d || !d[a])) {
          c.fire("beforeSetMode", a);
          if (c.mode) {
            var j = c.checkDirty();
            c._.previousMode = c.mode;
            c.fire("beforeModeUnload");
            c.editable(0);
            c.ui.space("contents").setHtml("");
            c.mode = ""
          }
          this._.modes[a](function () {
            c.mode = a;
            j !== void 0 && !j && c.resetDirty();
            setTimeout(function () {
              c.fire("mode");
              b && b.call(c)
            }, 0)
          })
        }
      };
    CKEDITOR.editor.prototype.resize = function (a, b, c, d) {
      var j = this.container, k = this.ui.space("contents"), l = CKEDITOR.env.webkit && this.document && this.document.getWindow().$.frameElement,
        d = d ? j.getChild(1) : j;
      d.setSize("width", a, true);
      l && (l.style.width = "1%");
      k.setStyle("height", Math.max(b - (c ? 0 : (d.$.offsetHeight || 0) - (k.$.clientHeight || 0)), 0) + "px");
      l && (l.style.width = "100%");
      this.fire("resize")
    };
    CKEDITOR.editor.prototype.getResizable = function (a) {
      return a ? this.ui.space("contents") : this.container
    };
    var c;
    CKEDITOR.domReady(function () {
      CKEDITOR.replaceClass && CKEDITOR.replaceAll(CKEDITOR.replaceClass)
    })
  })();
  CKEDITOR.config.startupMode = "wysiwyg";
  (function () {
    function a(a) {
      var b = a.editor, e = a.data.path, f = e.blockLimit, m = a.data.selection, i = m.getRanges()[0], q;
      if (CKEDITOR.env.gecko || CKEDITOR.env.ie && CKEDITOR.env.needsBrFiller)if (m = d(m, e)) {
        m.appendBogus();
        q = CKEDITOR.env.ie
      }
      if (b.config.autoParagraph !== false && b.activeEnterMode != CKEDITOR.ENTER_BR && b.editable().equals(f) && !e.block && i.collapsed && !i.getCommonAncestor().isReadOnly()) {
        e = i.clone();
        e.enlarge(CKEDITOR.ENLARGE_BLOCK_CONTENTS);
        f = new CKEDITOR.dom.walker(e);
        f.guard = function (a) {
          return !c(a) || a.type ==
            CKEDITOR.NODE_COMMENT || a.isReadOnly()
        };
        if (!f.checkForward() || e.checkStartOfBlock() && e.checkEndOfBlock()) {
          b = i.fixBlock(true, b.activeEnterMode == CKEDITOR.ENTER_DIV ? "div" : "p");
          if (!CKEDITOR.env.needsBrFiller)(b = b.getFirst(c)) && (b.type == CKEDITOR.NODE_TEXT && CKEDITOR.tools.trim(b.getText()).match(/^(?:&nbsp;|\xa0)$/)) && b.remove();
          q = 1;
          a.cancel()
        }
      }
      q && i.select()
    }

    function d(a, b) {
      if (a.isFake)return 0;
      var d = b.block || b.blockLimit, e = d && d.getLast(c);
      if (d && d.isBlockBoundary() && (!e || !(e.type == CKEDITOR.NODE_ELEMENT &&
        e.isBlockBoundary())) && !d.is("pre") && !d.getBogus())return d
    }

    function b(a) {
      var b = a.data.getTarget();
      if (b.is("input")) {
        b = b.getAttribute("type");
        (b == "submit" || b == "reset") && a.data.preventDefault()
      }
    }

    function c(a) {
      return l(a) && u(a)
    }

    function e(a, b) {
      return function (c) {
        var d = CKEDITOR.dom.element.get(c.data.$.toElement || c.data.$.fromElement || c.data.$.relatedTarget);
        (!d || !b.equals(d) && !b.contains(d)) && a.call(this, c)
      }
    }

    function f(a) {
      var b, d = a.getRanges()[0], e = a.root, m = {table: 1, ul: 1, ol: 1, dl: 1};
      if (d.startPath().contains(m)) {
        var a =
          function (a) {
            return function (d, e) {
              e && (d.type == CKEDITOR.NODE_ELEMENT && d.is(m)) && (b = d);
              if (!e && c(d) && (!a || !j(d)))return false
            }
          }, i = d.clone();
        i.collapse(1);
        i.setStartAt(e, CKEDITOR.POSITION_AFTER_START);
        e = new CKEDITOR.dom.walker(i);
        e.guard = a();
        e.checkBackward();
        if (b) {
          i = d.clone();
          i.collapse();
          i.setEndAt(b, CKEDITOR.POSITION_AFTER_END);
          e = new CKEDITOR.dom.walker(i);
          e.guard = a(true);
          b = false;
          e.checkForward();
          return b
        }
      }
      return null
    }

    function h(a) {
      a.editor.focus();
      a.editor.fire("saveSnapshot")
    }

    function n(a, b) {
      var c =
        a.editor;
      !b && c.getSelection().scrollIntoView();
      setTimeout(function () {
        c.fire("saveSnapshot")
      }, 0)
    }

    CKEDITOR.editable = CKEDITOR.tools.createClass({
      base: CKEDITOR.dom.element, $: function (a, b) {
        this.base(b.$ || b);
        this.editor = a;
        this.hasFocus = false;
        this.setup()
      }, proto: {
        focus: function () {
          var a;
          if (CKEDITOR.env.webkit && !this.hasFocus) {
            a = this.editor._.previousActive || this.getDocument().getActive();
            if (this.contains(a)) {
              a.focus();
              return
            }
          }
          try {
            this.$[CKEDITOR.env.ie && this.getDocument().equals(CKEDITOR.document) ? "setActive" :
              "focus"]()
          } catch (b) {
            if (!CKEDITOR.env.ie)throw b;
          }
          if (CKEDITOR.env.safari && !this.isInline()) {
            a = CKEDITOR.document.getActive();
            a.equals(this.getWindow().getFrame()) || this.getWindow().focus()
          }
        }, on: function (a, b) {
          var c = Array.prototype.slice.call(arguments, 0);
          if (CKEDITOR.env.ie && /^focus|blur$/.exec(a)) {
            a = a == "focus" ? "focusin" : "focusout";
            b = e(b, this);
            c[0] = a;
            c[1] = b
          }
          return CKEDITOR.dom.element.prototype.on.apply(this, c)
        }, attachListener: function (a, b, c, d, e, i) {
          !this._.listeners && (this._.listeners = []);
          var f = Array.prototype.slice.call(arguments,
            1), f = a.on.apply(a, f);
          this._.listeners.push(f);
          return f
        }, clearListeners: function () {
          var a = this._.listeners;
          try {
            for (; a.length;)a.pop().removeListener()
          } catch (b) {
          }
        }, restoreAttrs: function () {
          var a = this._.attrChanges, b, c;
          for (c in a)if (a.hasOwnProperty(c)) {
            b = a[c];
            b !== null ? this.setAttribute(c, b) : this.removeAttribute(c)
          }
        }, attachClass: function (a) {
          var b = this.getCustomData("classes");
          if (!this.hasClass(a)) {
            !b && (b = []);
            b.push(a);
            this.setCustomData("classes", b);
            this.addClass(a)
          }
        }, changeAttr: function (a, b) {
          var c = this.getAttribute(a);
          if (b !== c) {
            !this._.attrChanges && (this._.attrChanges = {});
            a in this._.attrChanges || (this._.attrChanges[a] = c);
            this.setAttribute(a, b)
          }
        }, insertHtml: function (a, b) {
          h(this);
          s(this, b || "html", a)
        }, insertText: function (a) {
          h(this);
          var b = this.editor, c = b.getSelection().getStartElement().hasAscendant("pre", true) ? CKEDITOR.ENTER_BR : b.activeEnterMode, b = c == CKEDITOR.ENTER_BR, d = CKEDITOR.tools, a = d.htmlEncode(a.replace(/\r\n/g, "\n")), a = a.replace(/\t/g, "&nbsp;&nbsp; &nbsp;"), c = c == CKEDITOR.ENTER_P ? "p" : "div";
          if (!b) {
            var e = /\n{2}/g;
            if (e.test(a))var i = "<" + c + ">", f = "</" + c + ">", a = i + a.replace(e, function () {
                return f + i
              }) + f
          }
          a = a.replace(/\n/g, "<br>");
          b || (a = a.replace(RegExp("<br>(?=</" + c + ">)"), function (a) {
            return d.repeat(a, 2)
          }));
          a = a.replace(/^ | $/g, "&nbsp;");
          a = a.replace(/(>|\s) /g, function (a, b) {
            return b + "&nbsp;"
          }).replace(/ (?=<)/g, "&nbsp;");
          s(this, "text", a)
        }, insertElement: function (a, b) {
          b ? this.insertElementIntoRange(a, b) : this.insertElementIntoSelection(a)
        }, insertElementIntoRange: function (a, b) {
          var c = this.editor, d = c.config.enterMode, e = a.getName(),
            i = CKEDITOR.dtd.$block[e];
          if (b.checkReadOnly())return false;
          b.deleteContents(1);
          var f, h;
          if (i)for (; (f = b.getCommonAncestor(0, 1)) && (h = CKEDITOR.dtd[f.getName()]) && (!h || !h[e]);)if (f.getName()in CKEDITOR.dtd.span)b.splitElement(f); else if (b.checkStartOfBlock() && b.checkEndOfBlock()) {
            b.setStartBefore(f);
            b.collapse(true);
            f.remove()
          } else b.splitBlock(d == CKEDITOR.ENTER_DIV ? "div" : "p", c.editable());
          b.insertNode(a);
          return true
        }, insertElementIntoSelection: function (a) {
          var b = this.editor, d = b.activeEnterMode, b = b.getSelection(),
            e = b.getRanges(), m = a.getName(), m = CKEDITOR.dtd.$block[m], i, f, o;
          h(this);
          for (var k = e.length; k--;) {
            o = e[k];
            i = !k && a || a.clone(1);
            this.insertElementIntoRange(i, o) && !f && (f = i)
          }
          if (f) {
            o.moveToPosition(f, CKEDITOR.POSITION_AFTER_END);
            if (m)if ((a = f.getNext(function (a) {
                return c(a) && !j(a)
              })) && a.type == CKEDITOR.NODE_ELEMENT && a.is(CKEDITOR.dtd.$block))a.getDtd()["#"] ? o.moveToElementEditStart(a) : o.moveToElementEditEnd(f); else if (!a && d != CKEDITOR.ENTER_BR) {
              a = o.fixBlock(true, d == CKEDITOR.ENTER_DIV ? "div" : "p");
              o.moveToElementEditStart(a)
            }
          }
          b.selectRanges([o]);
          n(this, CKEDITOR.env.opera)
        }, setData: function (a, b) {
          b || (a = this.editor.dataProcessor.toHtml(a));
          this.setHtml(a);
          this.editor.fire("dataReady")
        }, getData: function (a) {
          var b = this.getHtml();
          a || (b = this.editor.dataProcessor.toDataFormat(b));
          return b
        }, setReadOnly: function (a) {
          this.setAttribute("contenteditable", !a)
        }, detach: function () {
          this.removeClass("cke_editable");
          var a = this.editor;
          this._.detach();
          delete a.document;
          delete a.window
        }, isInline: function () {
          return this.getDocument().equals(CKEDITOR.document)
        }, setup: function () {
          var a =
            this.editor;
          this.attachListener(a, "beforeGetData", function () {
            var b = this.getData();
            this.is("textarea") || a.config.ignoreEmptyParagraph !== false && (b = b.replace(k, function (a, b) {
              return b
            }));
            a.setData(b, null, 1)
          }, this);
          this.attachListener(a, "getSnapshot", function (a) {
            a.data = this.getData(1)
          }, this);
          this.attachListener(a, "afterSetData", function () {
            this.setData(a.getData(1))
          }, this);
          this.attachListener(a, "loadSnapshot", function (a) {
            this.setData(a.data, 1)
          }, this);
          this.attachListener(a, "beforeFocus", function () {
            var b =
              a.getSelection();
            (b = b && b.getNative()) && b.type == "Control" || this.focus()
          }, this);
          this.attachListener(a, "insertHtml", function (a) {
            this.insertHtml(a.data.dataValue, a.data.mode)
          }, this);
          this.attachListener(a, "insertElement", function (a) {
            this.insertElement(a.data)
          }, this);
          this.attachListener(a, "insertText", function (a) {
            this.insertText(a.data)
          }, this);
          this.setReadOnly(a.readOnly);
          this.attachClass("cke_editable");
          this.attachClass(a.elementMode == CKEDITOR.ELEMENT_MODE_INLINE ? "cke_editable_inline" : a.elementMode == CKEDITOR.ELEMENT_MODE_REPLACE ||
          a.elementMode == CKEDITOR.ELEMENT_MODE_APPENDTO ? "cke_editable_themed" : "");
          this.attachClass("cke_contents_" + a.config.contentsLangDirection);
          a.keystrokeHandler.blockedKeystrokes[8] = +a.readOnly;
          a.keystrokeHandler.attach(this);
          this.on("blur", function (a) {
            CKEDITOR.env.opera && CKEDITOR.document.getActive().equals(this.isInline() ? this : this.getWindow().getFrame()) ? a.cancel() : this.hasFocus = false
          }, null, null, -1);
          this.on("focus", function () {
            this.hasFocus = true
          }, null, null, -1);
          a.focusManager.add(this);
          if (this.equals(CKEDITOR.document.getActive())) {
            this.hasFocus =
              true;
            a.once("contentDom", function () {
              a.focusManager.focus()
            })
          }
          this.isInline() && this.changeAttr("tabindex", a.tabIndex);
          if (!this.is("textarea")) {
            a.document = this.getDocument();
            a.window = this.getWindow();
            var d = a.document;
            this.changeAttr("spellcheck", !a.config.disableNativeSpellChecker);
            var e = a.config.contentsLangDirection;
            this.getDirection(1) != e && this.changeAttr("dir", e);
            var h = CKEDITOR.getCss();
            if (h) {
              e = d.getHead();
              if (!e.getCustomData("stylesheet")) {
                h = d.appendStyleText(h);
                h = new CKEDITOR.dom.element(h.ownerNode ||
                  h.owningElement);
                e.setCustomData("stylesheet", h);
                h.data("cke-temp", 1)
              }
            }
            e = d.getCustomData("stylesheet_ref") || 0;
            d.setCustomData("stylesheet_ref", e + 1);
            this.setCustomData("cke_includeReadonly", !a.config.disableReadonlyStyling);
            this.attachListener(this, "click", function (a) {
              var a = a.data, b = (new CKEDITOR.dom.elementPath(a.getTarget(), this)).contains("a");
              b && (a.$.button != 2 && b.isReadOnly()) && a.preventDefault()
            });
            var m = {8: 1, 46: 1};
            this.attachListener(a, "key", function (b) {
              if (a.readOnly)return true;
              var c = b.data.keyCode,
                d;
              if (c in m) {
                var e = a.getSelection(), b = e.getRanges()[0], g = b.startPath(), h, j, k, c = c == 8;
                if (e = f(e)) {
                  a.fire("saveSnapshot");
                  b.moveToPosition(e, CKEDITOR.POSITION_BEFORE_START);
                  e.remove();
                  b.select();
                  a.fire("saveSnapshot");
                  d = 1
                } else if (b.collapsed)if ((h = g.block) && (k = h[c ? "getPrevious" : "getNext"](l)) && k.type == CKEDITOR.NODE_ELEMENT && k.is("table") && b[c ? "checkStartOfBlock" : "checkEndOfBlock"]()) {
                  a.fire("saveSnapshot");
                  b[c ? "checkEndOfBlock" : "checkStartOfBlock"]() && h.remove();
                  b["moveToElementEdit" + (c ? "End" : "Start")](k);
                  b.select();
                  a.fire("saveSnapshot");
                  d = 1
                } else if (g.blockLimit && g.blockLimit.is("td") && (j = g.blockLimit.getAscendant("table")) && b.checkBoundaryOfElement(j, c ? CKEDITOR.START : CKEDITOR.END) && (k = j[c ? "getPrevious" : "getNext"](l))) {
                  a.fire("saveSnapshot");
                  b["moveToElementEdit" + (c ? "End" : "Start")](k);
                  b.checkStartOfBlock() && b.checkEndOfBlock() ? k.remove() : b.select();
                  a.fire("saveSnapshot");
                  d = 1
                } else if ((j = g.contains(["td", "th", "caption"])) && b.checkBoundaryOfElement(j, c ? CKEDITOR.START : CKEDITOR.END))d = 1
              }
              return !d
            });
            a.blockless &&
            (CKEDITOR.env.ie && CKEDITOR.env.needsBrFiller) && this.attachListener(this, "keyup", function (b) {
              if (b.data.getKeystroke()in m && !this.getFirst(c)) {
                this.appendBogus();
                b = a.createRange();
                b.moveToPosition(this, CKEDITOR.POSITION_AFTER_START);
                b.select()
              }
            });
            this.attachListener(this, "dblclick", function (b) {
              if (a.readOnly)return false;
              b = {element: b.data.getTarget()};
              a.fire("doubleclick", b)
            });
            CKEDITOR.env.ie && this.attachListener(this, "click", b);
            !CKEDITOR.env.ie && !CKEDITOR.env.opera && this.attachListener(this, "mousedown",
              function (b) {
                var c = b.data.getTarget();
                if (c.is("img", "hr", "input", "textarea", "select")) {
                  a.getSelection().selectElement(c);
                  c.is("input", "textarea", "select") && b.data.preventDefault()
                }
              });
            CKEDITOR.env.gecko && this.attachListener(this, "mouseup", function (b) {
              if (b.data.$.button == 2) {
                b = b.data.getTarget();
                if (!b.getOuterHtml().replace(k, "")) {
                  var c = a.createRange();
                  c.moveToElementEditStart(b);
                  c.select(true)
                }
              }
            });
            if (CKEDITOR.env.webkit) {
              this.attachListener(this, "click", function (a) {
                a.data.getTarget().is("input", "select") &&
                a.data.preventDefault()
              });
              this.attachListener(this, "mouseup", function (a) {
                a.data.getTarget().is("input", "textarea") && a.data.preventDefault()
              })
            }
          }
        }
      }, _: {
        detach: function () {
          this.editor.setData(this.editor.getData(), 0, 1);
          this.clearListeners();
          this.restoreAttrs();
          var a;
          if (a = this.removeCustomData("classes"))for (; a.length;)this.removeClass(a.pop());
          a = this.getDocument();
          var b = a.getHead();
          if (b.getCustomData("stylesheet")) {
            var c = a.getCustomData("stylesheet_ref");
            if (--c)a.setCustomData("stylesheet_ref", c); else {
              a.removeCustomData("stylesheet_ref");
              b.removeCustomData("stylesheet").remove()
            }
          }
          delete this.editor
        }
      }
    });
    CKEDITOR.editor.prototype.editable = function (a) {
      var b = this._.editable;
      if (b && a)return 0;
      if (arguments.length)b = this._.editable = a ? a instanceof CKEDITOR.editable ? a : new CKEDITOR.editable(this, a) : (b && b.detach(), null);
      return b
    };
    var j = CKEDITOR.dom.walker.bogus(), k = /(^|<body\b[^>]*>)\s*<(p|div|address|h\d|center|pre)[^>]*>\s*(?:<br[^>]*>|&nbsp;|\u00A0|&#160;)?\s*(:?<\/\2>)?\s*(?=$|<\/body>)/gi, l = CKEDITOR.dom.walker.whitespaces(true), u = CKEDITOR.dom.walker.bookmark(false,
      true);
    CKEDITOR.on("instanceLoaded", function (b) {
      var c = b.editor;
      c.on("insertElement", function (a) {
        a = a.data;
        if (a.type == CKEDITOR.NODE_ELEMENT && (a.is("input") || a.is("textarea"))) {
          a.getAttribute("contentEditable") != "false" && a.data("cke-editable", a.hasAttribute("contenteditable") ? "true" : "1");
          a.setAttribute("contentEditable", false)
        }
      });
      c.on("selectionChange", function (b) {
        if (!c.readOnly) {
          var d = c.getSelection();
          if (d && !d.isLocked) {
            d = c.checkDirty();
            c.fire("lockSnapshot");
            a(b);
            c.fire("unlockSnapshot");
            !d && c.resetDirty()
          }
        }
      })
    });
    CKEDITOR.on("instanceCreated", function (a) {
      var b = a.editor;
      b.on("mode", function () {
        var a = b.editable();
        if (a && a.isInline()) {
          var c = b.title;
          a.changeAttr("role", "textbox");
          a.changeAttr("aria-label", c);
          c && a.changeAttr("title", c);
          if (c = this.ui.space(this.elementMode == CKEDITOR.ELEMENT_MODE_INLINE ? "top" : "contents")) {
            var d = CKEDITOR.tools.getNextId(), e = CKEDITOR.dom.element.createFromHtml('<span id="' + d + '" class="cke_voice_label">' + this.lang.common.editorHelp + "</span>");
            c.append(e);
            a.changeAttr("aria-describedby",
              d)
          }
        }
      })
    });
    CKEDITOR.addCss(".cke_editable{cursor:text}.cke_editable img,.cke_editable input,.cke_editable textarea{cursor:default}");
    var s = function () {
      function a(b) {
        return b.type == CKEDITOR.NODE_ELEMENT
      }

      function b(c, d) {
        var e, i, m, h, p = [], v = d.range.startContainer;
        e = d.range.startPath();
        for (var v = f[v.getName()], j = 0, o = c.getChildren(), k = o.count(), l = -1, n = -1, s = 0, r = e.contains(f.$list); j < k; ++j) {
          e = o.getItem(j);
          if (a(e)) {
            m = e.getName();
            if (r && m in CKEDITOR.dtd.$list)p = p.concat(b(e, d)); else {
              h = !!v[m];
              if (m == "br" && e.data("cke-eol") &&
                (!j || j == k - 1)) {
                s = (i = j ? p[j - 1].node : o.getItem(j + 1)) && (!a(i) || !i.is("br"));
                i = i && a(i) && f.$block[i.getName()]
              }
              l == -1 && !h && (l = j);
              h || (n = j);
              p.push({
                isElement: 1,
                isLineBreak: s,
                isBlock: e.isBlockBoundary(),
                hasBlockSibling: i,
                node: e,
                name: m,
                allowed: h
              });
              i = s = 0
            }
          } else p.push({isElement: 0, node: e, allowed: 1})
        }
        if (l > -1)p[l].firstNotAllowed = 1;
        if (n > -1)p[n].lastNotAllowed = 1;
        return p
      }

      function d(b, c) {
        var e = [], i = b.getChildren(), m = i.count(), g, h = 0, p = f[c], j = !b.is(f.$inline) || b.is("br");
        for (j && e.push(" "); h < m; h++) {
          g = i.getItem(h);
          a(g) && !g.is(p) ? e = e.concat(d(g, c)) : e.push(g)
        }
        j && e.push(" ");
        return e
      }

      function e(b) {
        return b && a(b) && (b.is(f.$removeEmpty) || b.is("a") && !b.isBlockBoundary())
      }

      function m(b, c, d, e) {
        var i = b.clone(), g, f;
        i.setEndAt(c, CKEDITOR.POSITION_BEFORE_END);
        if ((g = (new CKEDITOR.dom.walker(i)).next()) && a(g) && h[g.getName()] && (f = g.getPrevious()) && a(f) && !f.getParent().equals(b.startContainer) && d.contains(f) && e.contains(g) && g.isIdentical(f)) {
          g.moveChildren(f);
          g.remove();
          m(b, c, d, e)
        }
      }

      function i(b, c) {
        function d(b, c) {
          if (c.isBlock && c.isElement && !c.node.is("br") && a(b) && b.is("br")) {
            b.remove();
            return 1
          }
        }

        var e = c.endContainer.getChild(c.endOffset), i = c.endContainer.getChild(c.endOffset - 1);
        e && d(e, b[b.length - 1]);
        if (i && d(i, b[0])) {
          c.setEnd(c.endContainer, c.endOffset - 1);
          c.collapse()
        }
      }

      var f = CKEDITOR.dtd, h = {
        p: 1,
        div: 1,
        h1: 1,
        h2: 1,
        h3: 1,
        h4: 1,
        h5: 1,
        h6: 1,
        ul: 1,
        ol: 1,
        li: 1,
        pre: 1,
        dl: 1,
        blockquote: 1
      }, j = {p: 1, div: 1, h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1}, p = CKEDITOR.tools.extend({}, f.$inline);
      delete p.br;
      return function (h, o, k) {
        var l = h.editor;
        h.getDocument();
        var s = l.getSelection().getRanges()[0],
          u = false;
        if (o == "unfiltered_html") {
          o = "html";
          u = true
        }
        if (!s.checkReadOnly()) {
          var y = (new CKEDITOR.dom.elementPath(s.startContainer, s.root)).blockLimit || s.root, o = {
            type: o,
            dontFilter: u,
            editable: h,
            editor: l,
            range: s,
            blockLimit: y,
            mergeCandidates: [],
            zombies: []
          }, l = o.range, u = o.mergeCandidates, v, D, F, z;
          if (o.type == "text" && l.shrink(CKEDITOR.SHRINK_ELEMENT, true, false)) {
            v = CKEDITOR.dom.element.createFromHtml("<span>&nbsp;</span>", l.document);
            l.insertNode(v);
            l.setStartAfter(v)
          }
          D = new CKEDITOR.dom.elementPath(l.startContainer);
          o.endPath = F = new CKEDITOR.dom.elementPath(l.endContainer);
          if (!l.collapsed) {
            var y = F.block || F.blockLimit, X = l.getCommonAncestor();
            y && (!y.equals(X) && !y.contains(X) && l.checkEndOfBlock()) && o.zombies.push(y);
            l.deleteContents()
          }
          for (; (z = a(l.startContainer) && l.startContainer.getChild(l.startOffset - 1)) && a(z) && z.isBlockBoundary() && D.contains(z);)l.moveToPosition(z, CKEDITOR.POSITION_BEFORE_END);
          m(l, o.blockLimit, D, F);
          if (v) {
            l.setEndBefore(v);
            l.collapse();
            v.remove()
          }
          v = l.startPath();
          if (y = v.contains(e, false, 1)) {
            l.splitElement(y);
            o.inlineStylesRoot = y;
            o.inlineStylesPeak = v.lastElement
          }
          v = l.createBookmark();
          (y = v.startNode.getPrevious(c)) && a(y) && e(y) && u.push(y);
          (y = v.startNode.getNext(c)) && a(y) && e(y) && u.push(y);
          for (y = v.startNode; (y = y.getParent()) && e(y);)u.push(y);
          l.moveToBookmark(v);
          if (v = k) {
            v = o.range;
            if (o.type == "text" && o.inlineStylesRoot) {
              z = o.inlineStylesPeak;
              l = z.getDocument().createText("{cke-peak}");
              for (u = o.inlineStylesRoot.getParent(); !z.equals(u);) {
                l = l.appendTo(z.clone());
                z = z.getParent()
              }
              k = l.getOuterHtml().split("{cke-peak}").join(k)
            }
            z =
              o.blockLimit.getName();
            if (/^\s+|\s+$/.test(k) && "span"in CKEDITOR.dtd[z])var O = '<span data-cke-marker="1">&nbsp;</span>', k = O + k + O;
            k = o.editor.dataProcessor.toHtml(k, {
              context: null,
              fixForBody: false,
              dontFilter: o.dontFilter,
              filter: o.editor.activeFilter,
              enterMode: o.editor.activeEnterMode
            });
            z = v.document.createElement("body");
            z.setHtml(k);
            if (O) {
              z.getFirst().remove();
              z.getLast().remove()
            }
            if ((O = v.startPath().block) && !(O.getChildCount() == 1 && O.getBogus()))a:{
              var G;
              if (z.getChildCount() == 1 && a(G = z.getFirst()) && G.is(j)) {
                O =
                  G.getElementsByTag("*");
                v = 0;
                for (u = O.count(); v < u; v++) {
                  l = O.getItem(v);
                  if (!l.is(p))break a
                }
                G.moveChildren(G.getParent(1));
                G.remove()
              }
            }
            o.dataWrapper = z;
            v = k
          }
          if (v) {
            G = o.range;
            var O = G.document, A, k = o.blockLimit;
            v = 0;
            var J;
            z = [];
            var H, P, u = l = 0, K, R;
            D = G.startContainer;
            var y = o.endPath.elements[0], S;
            F = y.getPosition(D);
            X = !!y.getCommonAncestor(D) && F != CKEDITOR.POSITION_IDENTICAL && !(F & CKEDITOR.POSITION_CONTAINS + CKEDITOR.POSITION_IS_CONTAINED);
            D = b(o.dataWrapper, o);
            for (i(D, G); v < D.length; v++) {
              F = D[v];
              if (A = F.isLineBreak) {
                A =
                  G;
                K = k;
                var N = void 0, U = void 0;
                if (F.hasBlockSibling)A = 1; else {
                  N = A.startContainer.getAscendant(f.$block, 1);
                  if (!N || !N.is({div: 1, p: 1}))A = 0; else {
                    U = N.getPosition(K);
                    if (U == CKEDITOR.POSITION_IDENTICAL || U == CKEDITOR.POSITION_CONTAINS)A = 0; else {
                      K = A.splitElement(N);
                      A.moveToPosition(K, CKEDITOR.POSITION_AFTER_START);
                      A = 1
                    }
                  }
                }
              }
              if (A)u = v > 0; else {
                A = G.startPath();
                if (!F.isBlock && o.editor.config.autoParagraph !== false && (o.editor.activeEnterMode != CKEDITOR.ENTER_BR && o.editor.editable().equals(A.blockLimit) && !A.block) && (P = o.editor.activeEnterMode !=
                  CKEDITOR.ENTER_BR && o.editor.config.autoParagraph !== false ? o.editor.activeEnterMode == CKEDITOR.ENTER_DIV ? "div" : "p" : false)) {
                  P = O.createElement(P);
                  P.appendBogus();
                  G.insertNode(P);
                  CKEDITOR.env.needsBrFiller && (J = P.getBogus()) && J.remove();
                  G.moveToPosition(P, CKEDITOR.POSITION_BEFORE_END)
                }
                if ((A = G.startPath().block) && !A.equals(H)) {
                  if (J = A.getBogus()) {
                    J.remove();
                    z.push(A)
                  }
                  H = A
                }
                F.firstNotAllowed && (l = 1);
                if (l && F.isElement) {
                  A = G.startContainer;
                  for (K = null; A && !f[A.getName()][F.name];) {
                    if (A.equals(k)) {
                      A = null;
                      break
                    }
                    K = A;
                    A = A.getParent()
                  }
                  if (A) {
                    if (K) {
                      R = G.splitElement(K);
                      o.zombies.push(R);
                      o.zombies.push(K)
                    }
                  } else {
                    K = k.getName();
                    S = !v;
                    A = v == D.length - 1;
                    K = d(F.node, K);
                    for (var N = [], U = K.length, Y = 0, $ = void 0, aa = 0, ba = -1; Y < U; Y++) {
                      $ = K[Y];
                      if ($ == " ") {
                        if (!aa && (!S || Y)) {
                          N.push(new CKEDITOR.dom.text(" "));
                          ba = N.length
                        }
                        aa = 1
                      } else {
                        N.push($);
                        aa = 0
                      }
                    }
                    A && ba == N.length && N.pop();
                    S = N
                  }
                }
                if (S) {
                  for (; A = S.pop();)G.insertNode(A);
                  S = 0
                } else G.insertNode(F.node);
                if (F.lastNotAllowed && v < D.length - 1) {
                  (R = X ? y : R) && G.setEndAt(R, CKEDITOR.POSITION_AFTER_START);
                  l = 0
                }
                G.collapse()
              }
            }
            o.dontMoveCaret =
              u;
            o.bogusNeededBlocks = z
          }
          J = o.range;
          var V;
          R = o.bogusNeededBlocks;
          for (S = J.createBookmark(); H = o.zombies.pop();)if (H.getParent()) {
            P = J.clone();
            P.moveToElementEditStart(H);
            P.removeEmptyBlocksAtEnd()
          }
          if (R)for (; H = R.pop();)CKEDITOR.env.needsBrFiller ? H.appendBogus() : H.append(J.document.createText(" "));
          for (; H = o.mergeCandidates.pop();)H.mergeSiblings();
          J.moveToBookmark(S);
          if (!o.dontMoveCaret) {
            for (H = a(J.startContainer) && J.startContainer.getChild(J.startOffset - 1); H && a(H) && !H.is(f.$empty);) {
              if (H.isBlockBoundary())J.moveToPosition(H,
                CKEDITOR.POSITION_BEFORE_END); else {
                if (e(H) && H.getHtml().match(/(\s|&nbsp;)$/g)) {
                  V = null;
                  break
                }
                V = J.clone();
                V.moveToPosition(H, CKEDITOR.POSITION_BEFORE_END)
              }
              H = H.getLast(c)
            }
            V && J.moveToRange(V)
          }
          s.select();
          n(h)
        }
      }
    }()
  })();
  (function () {
    function a() {
      var a = this._.fakeSelection, b;
      if (a) {
        b = this.getSelection(1);
        if (!b || !b.isHidden()) {
          a.reset();
          a = 0
        }
      }
      if (!a) {
        a = b || this.getSelection(1);
        if (!a || a.getType() == CKEDITOR.SELECTION_NONE)return
      }
      this.fire("selectionCheck", a);
      b = this.elementPath();
      if (!b.compare(this._.selectionPreviousPath)) {
        if (CKEDITOR.env.webkit)this._.previousActive = this.document.getActive();
        this._.selectionPreviousPath = b;
        this.fire("selectionChange", {selection: a, path: b})
      }
    }

    function d() {
      u = true;
      if (!l) {
        b.call(this);
        l = CKEDITOR.tools.setTimeout(b,
          200, this)
      }
    }

    function b() {
      l = null;
      if (u) {
        CKEDITOR.tools.setTimeout(a, 0, this);
        u = false
      }
    }

    function c(a) {
      function b(c, d) {
        return !c || c.type == CKEDITOR.NODE_TEXT ? false : a.clone()["moveToElementEdit" + (d ? "End" : "Start")](c)
      }

      if (!(a.root instanceof CKEDITOR.editable))return false;
      var c = a.startContainer, d = a.getPreviousNode(s, null, c), e = a.getNextNode(s, null, c);
      return b(d) || b(e, 1) || !d && !e && !(c.type == CKEDITOR.NODE_ELEMENT && c.isBlockBoundary() && c.getBogus()) ? true : false
    }

    function e(a) {
      return a.getCustomData("cke-fillingChar")
    }

    function f(a, b) {
      var c = a && a.removeCustomData("cke-fillingChar");
      if (c) {
        if (b !== false) {
          var d, e = a.getDocument().getSelection().getNative(), g = e && e.type != "None" && e.getRangeAt(0);
          if (c.getLength() > 1 && g && g.intersectsNode(c.$)) {
            d = [e.anchorOffset, e.focusOffset];
            g = e.focusNode == c.$ && e.focusOffset > 0;
            e.anchorNode == c.$ && e.anchorOffset > 0 && d[0]--;
            g && d[1]--;
            var f;
            g = e;
            if (!g.isCollapsed) {
              f = g.getRangeAt(0);
              f.setStart(g.anchorNode, g.anchorOffset);
              f.setEnd(g.focusNode, g.focusOffset);
              f = f.collapsed
            }
            f && d.unshift(d.pop())
          }
        }
        c.setText(h(c.getText()));
        if (d) {
          c = e.getRangeAt(0);
          c.setStart(c.startContainer, d[0]);
          c.setEnd(c.startContainer, d[1]);
          e.removeAllRanges();
          e.addRange(c)
        }
      }
    }

    function h(a) {
      return a.replace(/\u200B( )?/g, function (a) {
        return a[1] ? " " : ""
      })
    }

    function n(a, b, c) {
      var d = a.on("focus", function (a) {
        a.cancel()
      }, null, null, -100);
      if (CKEDITOR.env.ie)var e = a.getDocument().on("selectionchange", function (a) {
        a.cancel()
      }, null, null, -100); else {
        var g = new CKEDITOR.dom.range(a);
        g.moveToElementEditStart(a);
        var f = a.getDocument().$.createRange();
        f.setStart(g.startContainer.$,
          g.startOffset);
        f.collapse(1);
        b.removeAllRanges();
        b.addRange(f)
      }
      c && a.focus();
      d.removeListener();
      e && e.removeListener()
    }

    function j(a) {
      var b = CKEDITOR.dom.element.createFromHtml('<div data-cke-hidden-sel="1" data-cke-temp="1" style="' + (CKEDITOR.env.ie ? "display:none" : "position:fixed;top:0;left:-1000px") + '">&nbsp;</div>', a.document);
      a.fire("lockSnapshot");
      a.editable().append(b);
      var c = a.getSelection(), d = a.createRange(), e = c.root.on("selectionchange", function (a) {
        a.cancel()
      }, null, null, 0);
      d.setStartAt(b, CKEDITOR.POSITION_AFTER_START);
      d.setEndAt(b, CKEDITOR.POSITION_BEFORE_END);
      c.selectRanges([d]);
      e.removeListener();
      a.fire("unlockSnapshot");
      a._.hiddenSelectionContainer = b
    }

    function k(a) {
      var b = {37: 1, 39: 1, 8: 1, 46: 1};
      return function (c) {
        var d = c.data.getKeystroke();
        if (b[d]) {
          var e = a.getSelection().getRanges(), g = e[0];
          if (e.length == 1 && g.collapsed)if ((d = g[d < 38 ? "getPreviousEditableNode" : "getNextEditableNode"]()) && d.type == CKEDITOR.NODE_ELEMENT && d.getAttribute("contenteditable") == "false") {
            a.getSelection().fake(d);
            c.data.preventDefault();
            c.cancel()
          }
        }
      }
    }

    var l, u, s = CKEDITOR.dom.walker.invisible(1), t = function () {
      function a(b) {
        return function (a) {
          var c = a.editor.createRange();
          c.moveToClosestEditablePosition(a.selected, b) && a.editor.getSelection().selectRanges([c]);
          return false
        }
      }

      function b(a) {
        return function (b) {
          var c = b.editor, d = c.createRange(), e;
          if (!(e = d.moveToClosestEditablePosition(b.selected, a)))e = d.moveToClosestEditablePosition(b.selected, !a);
          e && c.getSelection().selectRanges([d]);
          c.fire("saveSnapshot");
          b.selected.remove();
          if (!e) {
            d.moveToElementEditablePosition(c.editable());
            c.getSelection().selectRanges([d])
          }
          c.fire("saveSnapshot");
          return false
        }
      }

      var c = a(), d = a(1);
      return {37: c, 38: c, 39: d, 40: d, 8: b(), 46: b(1)}
    }();
    CKEDITOR.on("instanceCreated", function (b) {
      function c() {
        var a = e.getSelection();
        a && a.removeAllRanges()
      }

      var e = b.editor;
      e.on("contentDom", function () {
        var b = e.document, c = CKEDITOR.document, i = e.editable(), m = b.getBody(), h = b.getDocumentElement(), j = i.isInline(), l, n;
        CKEDITOR.env.gecko && i.attachListener(i, "focus", function (a) {
          a.removeListener();
          if (l !== 0)if ((a = e.getSelection().getNative()) &&
            a.isCollapsed && a.anchorNode == i.$) {
            a = e.createRange();
            a.moveToElementEditStart(i);
            a.select()
          }
        }, null, null, -2);
        i.attachListener(i, CKEDITOR.env.webkit ? "DOMFocusIn" : "focus", function () {
          l && CKEDITOR.env.webkit && (l = e._.previousActive && e._.previousActive.equals(b.getActive()));
          e.unlockSelection(l);
          l = 0
        }, null, null, -1);
        i.attachListener(i, "mousedown", function () {
          l = 0
        });
        if (CKEDITOR.env.ie || CKEDITOR.env.opera || j) {
          var s = function () {
            n = new CKEDITOR.dom.selection(e.getSelection());
            n.lock()
          };
          g ? i.attachListener(i, "beforedeactivate",
            s, null, null, -1) : i.attachListener(e, "selectionCheck", s, null, null, -1);
          i.attachListener(i, CKEDITOR.env.webkit ? "DOMFocusOut" : "blur", function () {
            e.lockSelection(n);
            l = 1
          }, null, null, -1);
          i.attachListener(i, "mousedown", function () {
            l = 0
          })
        }
        if (CKEDITOR.env.ie && !j) {
          var r;
          i.attachListener(i, "mousedown", function (a) {
            if (a.data.$.button == 2) {
              a = e.document.getSelection();
              if (!a || a.getType() == CKEDITOR.SELECTION_NONE)r = e.window.getScrollPosition()
            }
          });
          i.attachListener(i, "mouseup", function (a) {
            if (a.data.$.button == 2 && r) {
              e.document.$.documentElement.scrollLeft =
                r.x;
              e.document.$.documentElement.scrollTop = r.y
            }
            r = null
          });
          if (b.$.compatMode != "BackCompat") {
            if (CKEDITOR.env.ie7Compat || CKEDITOR.env.ie6Compat)h.on("mousedown", function (a) {
              function b(a) {
                a = a.data.$;
                if (e) {
                  var c = m.$.createTextRange();
                  try {
                    c.moveToPoint(a.x, a.y)
                  } catch (d) {
                  }
                  e.setEndPoint(g.compareEndPoints("StartToStart", c) < 0 ? "EndToEnd" : "StartToStart", c);
                  e.select()
                }
              }

              function d() {
                h.removeListener("mousemove", b);
                c.removeListener("mouseup", d);
                h.removeListener("mouseup", d);
                e.select()
              }

              a = a.data;
              if (a.getTarget().is("html") &&
                a.$.y < h.$.clientHeight && a.$.x < h.$.clientWidth) {
                var e = m.$.createTextRange();
                try {
                  e.moveToPoint(a.$.x, a.$.y)
                } catch (i) {
                }
                var g = e.duplicate();
                h.on("mousemove", b);
                c.on("mouseup", d);
                h.on("mouseup", d)
              }
            });
            if (CKEDITOR.env.version > 7 && CKEDITOR.env.version < 11) {
              h.on("mousedown", function (a) {
                if (a.data.getTarget().is("html")) {
                  c.on("mouseup", v);
                  h.on("mouseup", v)
                }
              });
              var v = function () {
                c.removeListener("mouseup", v);
                h.removeListener("mouseup", v);
                var a = CKEDITOR.document.$.selection, d = a.createRange();
                a.type != "None" && d.parentElement().ownerDocument ==
                b.$ && d.select()
              }
            }
          }
        }
        i.attachListener(i, "selectionchange", a, e);
        i.attachListener(i, "keyup", d, e);
        i.attachListener(i, CKEDITOR.env.webkit ? "DOMFocusIn" : "focus", function () {
          e.forceNextSelectionCheck();
          e.selectionChange(1)
        });
        if (j ? CKEDITOR.env.webkit || CKEDITOR.env.gecko : CKEDITOR.env.opera) {
          var D;
          i.attachListener(i, "mousedown", function () {
            D = 1
          });
          i.attachListener(b.getDocumentElement(), "mouseup", function () {
            D && d.call(e);
            D = 0
          })
        } else i.attachListener(CKEDITOR.env.ie ? i : b.getDocumentElement(), "mouseup", d, e);
        CKEDITOR.env.webkit &&
        i.attachListener(b, "keydown", function (a) {
          switch (a.data.getKey()) {
            case 13:
            case 33:
            case 34:
            case 35:
            case 36:
            case 37:
            case 39:
            case 8:
            case 45:
            case 46:
              f(i)
          }
        }, null, null, -1);
        i.attachListener(i, "keydown", k(e), null, null, -1)
      });
      e.on("contentDomUnload", e.forceNextSelectionCheck, e);
      e.on("dataReady", function () {
        delete e._.fakeSelection;
        delete e._.hiddenSelectionContainer;
        e.selectionChange(1)
      });
      e.on("loadSnapshot", function () {
        var a = e.editable().getLast(function (a) {
          return a.type == CKEDITOR.NODE_ELEMENT
        });
        a && a.hasAttribute("data-cke-hidden-sel") &&
        a.remove()
      }, null, null, 100);
      CKEDITOR.env.ie9Compat && e.on("beforeDestroy", c, null, null, 9);
      CKEDITOR.env.webkit && e.on("setData", c);
      e.on("contentDomUnload", function () {
        e.unlockSelection()
      });
      e.on("key", function (a) {
        if (e.mode == "wysiwyg") {
          var b = e.getSelection();
          if (b.isFake) {
            var c = t[a.data.keyCode];
            if (c)return c({editor: e, selected: b.getSelectedElement(), selection: b, keyEvent: a})
          }
        }
      })
    });
    CKEDITOR.on("instanceReady", function (a) {
      var b = a.editor;
      if (CKEDITOR.env.webkit) {
        b.on("selectionChange", function () {
          var a = b.editable(),
            c = e(a);
          c && (c.getCustomData("ready") ? f(a) : c.setCustomData("ready", 1))
        }, null, null, -1);
        b.on("beforeSetMode", function () {
          f(b.editable())
        }, null, null, -1);
        var c, d, a = function () {
          var a = b.editable();
          if (a)if (a = e(a)) {
            var g = b.document.$.defaultView.getSelection();
            g.type == "Caret" && g.anchorNode == a.$ && (d = 1);
            c = a.getText();
            a.setText(h(c))
          }
        }, g = function () {
          var a = b.editable();
          if (a)if (a = e(a)) {
            a.setText(c);
            if (d) {
              b.document.$.defaultView.getSelection().setPosition(a.$, a.getLength());
              d = 0
            }
          }
        };
        b.on("beforeUndoImage", a);
        b.on("afterUndoImage",
          g);
        b.on("beforeGetData", a, null, null, 0);
        b.on("getData", g)
      }
    });
    CKEDITOR.editor.prototype.selectionChange = function (b) {
      (b ? a : d).call(this)
    };
    CKEDITOR.editor.prototype.getSelection = function (a) {
      if ((this._.savedSelection || this._.fakeSelection) && !a)return this._.savedSelection || this._.fakeSelection;
      return (a = this.editable()) && this.mode == "wysiwyg" ? new CKEDITOR.dom.selection(a) : null
    };
    CKEDITOR.editor.prototype.lockSelection = function (a) {
      a = a || this.getSelection(1);
      if (a.getType() != CKEDITOR.SELECTION_NONE) {
        !a.isLocked &&
        a.lock();
        this._.savedSelection = a;
        return true
      }
      return false
    };
    CKEDITOR.editor.prototype.unlockSelection = function (a) {
      var b = this._.savedSelection;
      if (b) {
        b.unlock(a);
        delete this._.savedSelection;
        return true
      }
      return false
    };
    CKEDITOR.editor.prototype.forceNextSelectionCheck = function () {
      delete this._.selectionPreviousPath
    };
    CKEDITOR.dom.document.prototype.getSelection = function () {
      return new CKEDITOR.dom.selection(this)
    };
    CKEDITOR.dom.range.prototype.select = function () {
      var a = this.root instanceof CKEDITOR.editable ?
        this.root.editor.getSelection() : new CKEDITOR.dom.selection(this.root);
      a.selectRanges([this]);
      return a
    };
    CKEDITOR.SELECTION_NONE = 1;
    CKEDITOR.SELECTION_TEXT = 2;
    CKEDITOR.SELECTION_ELEMENT = 3;
    var g = typeof window.getSelection != "function", r = 1;
    CKEDITOR.dom.selection = function (a) {
      if (a instanceof CKEDITOR.dom.selection)var b = a, a = a.root;
      var c = a instanceof CKEDITOR.dom.element;
      this.rev = b ? b.rev : r++;
      this.document = a instanceof CKEDITOR.dom.document ? a : a.getDocument();
      this.root = a = c ? a : this.document.getBody();
      this.isLocked =
        0;
      this._ = {cache: {}};
      if (b) {
        CKEDITOR.tools.extend(this._.cache, b._.cache);
        this.isFake = b.isFake;
        this.isLocked = b.isLocked;
        return this
      }
      b = g ? this.document.$.selection : this.document.getWindow().$.getSelection();
      if (CKEDITOR.env.webkit)(b.type == "None" && this.document.getActive().equals(a) || b.type == "Caret" && b.anchorNode.nodeType == CKEDITOR.NODE_DOCUMENT) && n(a, b); else if (CKEDITOR.env.gecko)b && (this.document.getActive().equals(a) && b.anchorNode && b.anchorNode.nodeType == CKEDITOR.NODE_DOCUMENT) && n(a, b, true); else if (CKEDITOR.env.ie) {
        var d;
        try {
          d = this.document.getActive()
        } catch (e) {
        }
        if (g)b.type == "None" && (d && d.equals(this.document.getDocumentElement())) && n(a, null, true); else {
          (b = b && b.anchorNode) && (b = new CKEDITOR.dom.node(b));
          d && (d.equals(this.document.getDocumentElement()) && b && (a.equals(b) || a.contains(b))) && n(a, null, true)
        }
      }
      d = this.getNative();
      var f, h;
      if (d)if (d.getRangeAt)f = (h = d.rangeCount && d.getRangeAt(0)) && new CKEDITOR.dom.node(h.commonAncestorContainer); else {
        try {
          h = d.createRange()
        } catch (j) {
        }
        f = h && CKEDITOR.dom.element.get(h.item && h.item(0) ||
            h.parentElement())
      }
      if (!f || !(f.type == CKEDITOR.NODE_ELEMENT || f.type == CKEDITOR.NODE_TEXT) || !this.root.equals(f) && !this.root.contains(f)) {
        this._.cache.type = CKEDITOR.SELECTION_NONE;
        this._.cache.startElement = null;
        this._.cache.selectedElement = null;
        this._.cache.selectedText = "";
        this._.cache.ranges = new CKEDITOR.dom.rangeList
      }
      return this
    };
    var w = {
      img: 1,
      hr: 1,
      li: 1,
      table: 1,
      tr: 1,
      td: 1,
      th: 1,
      embed: 1,
      object: 1,
      ol: 1,
      ul: 1,
      a: 1,
      input: 1,
      form: 1,
      select: 1,
      textarea: 1,
      button: 1,
      fieldset: 1,
      thead: 1,
      tfoot: 1
    };
    CKEDITOR.dom.selection.prototype =
    {
      getNative: function () {
        return this._.cache.nativeSel !== void 0 ? this._.cache.nativeSel : this._.cache.nativeSel = g ? this.document.$.selection : this.document.getWindow().$.getSelection()
      }, getType: g ? function () {
      var a = this._.cache;
      if (a.type)return a.type;
      var b = CKEDITOR.SELECTION_NONE;
      try {
        var c = this.getNative(), d = c.type;
        if (d == "Text")b = CKEDITOR.SELECTION_TEXT;
        if (d == "Control")b = CKEDITOR.SELECTION_ELEMENT;
        if (c.createRange().parentElement())b = CKEDITOR.SELECTION_TEXT
      } catch (e) {
      }
      return a.type = b
    } : function () {
      var a = this._.cache;
      if (a.type)return a.type;
      var b = CKEDITOR.SELECTION_TEXT, c = this.getNative();
      if (!c || !c.rangeCount)b = CKEDITOR.SELECTION_NONE; else if (c.rangeCount == 1) {
        var c = c.getRangeAt(0), d = c.startContainer;
        if (d == c.endContainer && d.nodeType == 1 && c.endOffset - c.startOffset == 1 && w[d.childNodes[c.startOffset].nodeName.toLowerCase()])b = CKEDITOR.SELECTION_ELEMENT
      }
      return a.type = b
    }, getRanges: function () {
      var a = g ? function () {
        function a(b) {
          return (new CKEDITOR.dom.node(b)).getIndex()
        }

        var b = function (b, c) {
          b = b.duplicate();
          b.collapse(c);
          var d = b.parentElement();
          if (!d.hasChildNodes())return {container: d, offset: 0};
          for (var e = d.children, g, f, h = b.duplicate(), m = 0, j = e.length - 1, k = -1, v, l; m <= j;) {
            k = Math.floor((m + j) / 2);
            g = e[k];
            h.moveToElementText(g);
            v = h.compareEndPoints("StartToStart", b);
            if (v > 0)j = k - 1; else if (v < 0)m = k + 1; else return {container: d, offset: a(g)}
          }
          if (k == -1 || k == e.length - 1 && v < 0) {
            h.moveToElementText(d);
            h.setEndPoint("StartToStart", b);
            h = h.text.replace(/(\r\n|\r)/g, "\n").length;
            e = d.childNodes;
            if (!h) {
              g = e[e.length - 1];
              return g.nodeType != CKEDITOR.NODE_TEXT ?
              {container: d, offset: e.length} : {container: g, offset: g.nodeValue.length}
            }
            for (d = e.length; h > 0 && d > 0;) {
              f = e[--d];
              if (f.nodeType == CKEDITOR.NODE_TEXT) {
                l = f;
                h = h - f.nodeValue.length
              }
            }
            return {container: l, offset: -h}
          }
          h.collapse(v > 0 ? true : false);
          h.setEndPoint(v > 0 ? "StartToStart" : "EndToStart", b);
          h = h.text.replace(/(\r\n|\r)/g, "\n").length;
          if (!h)return {container: d, offset: a(g) + (v > 0 ? 0 : 1)};
          for (; h > 0;)try {
            f = g[v > 0 ? "previousSibling" : "nextSibling"];
            if (f.nodeType == CKEDITOR.NODE_TEXT) {
              h = h - f.nodeValue.length;
              l = f
            }
            g = f
          } catch (q) {
            return {
              container: d,
              offset: a(g)
            }
          }
          return {container: l, offset: v > 0 ? -h : l.nodeValue.length + h}
        };
        return function () {
          var a = this.getNative(), c = a && a.createRange(), d = this.getType();
          if (!a)return [];
          if (d == CKEDITOR.SELECTION_TEXT) {
            a = new CKEDITOR.dom.range(this.root);
            d = b(c, true);
            a.setStart(new CKEDITOR.dom.node(d.container), d.offset);
            d = b(c);
            a.setEnd(new CKEDITOR.dom.node(d.container), d.offset);
            a.endContainer.getPosition(a.startContainer) & CKEDITOR.POSITION_PRECEDING && a.endOffset <= a.startContainer.getIndex() && a.collapse();
            return [a]
          }
          if (d ==
            CKEDITOR.SELECTION_ELEMENT) {
            for (var d = [], e = 0; e < c.length; e++) {
              for (var i = c.item(e), g = i.parentNode, f = 0, a = new CKEDITOR.dom.range(this.root); f < g.childNodes.length && g.childNodes[f] != i; f++);
              a.setStart(new CKEDITOR.dom.node(g), f);
              a.setEnd(new CKEDITOR.dom.node(g), f + 1);
              d.push(a)
            }
            return d
          }
          return []
        }
      }() : function () {
        var a = [], b, c = this.getNative();
        if (!c)return a;
        for (var d = 0; d < c.rangeCount; d++) {
          var e = c.getRangeAt(d);
          b = new CKEDITOR.dom.range(this.root);
          b.setStart(new CKEDITOR.dom.node(e.startContainer), e.startOffset);
          b.setEnd(new CKEDITOR.dom.node(e.endContainer), e.endOffset);
          a.push(b)
        }
        return a
      };
      return function (b) {
        var c = this._.cache;
        if (c.ranges && !b)return c.ranges;
        if (!c.ranges)c.ranges = new CKEDITOR.dom.rangeList(a.call(this));
        if (b)for (var d = c.ranges, e = 0; e < d.length; e++) {
          var g = d[e];
          g.getCommonAncestor().isReadOnly() && d.splice(e, 1);
          if (!g.collapsed) {
            if (g.startContainer.isReadOnly())for (var b = g.startContainer, f; b;) {
              if ((f = b.type == CKEDITOR.NODE_ELEMENT) && b.is("body") || !b.isReadOnly())break;
              f && b.getAttribute("contentEditable") ==
              "false" && g.setStartAfter(b);
              b = b.getParent()
            }
            b = g.startContainer;
            f = g.endContainer;
            var h = g.startOffset, j = g.endOffset, k = g.clone();
            b && b.type == CKEDITOR.NODE_TEXT && (h >= b.getLength() ? k.setStartAfter(b) : k.setStartBefore(b));
            f && f.type == CKEDITOR.NODE_TEXT && (j ? k.setEndAfter(f) : k.setEndBefore(f));
            b = new CKEDITOR.dom.walker(k);
            b.evaluator = function (a) {
              if (a.type == CKEDITOR.NODE_ELEMENT && a.isReadOnly()) {
                var b = g.clone();
                g.setEndBefore(a);
                g.collapsed && d.splice(e--, 1);
                if (!(a.getPosition(k.endContainer) & CKEDITOR.POSITION_CONTAINS)) {
                  b.setStartAfter(a);
                  b.collapsed || d.splice(e + 1, 0, b)
                }
                return true
              }
              return false
            };
            b.next()
          }
        }
        return c.ranges
      }
    }(), getStartElement: function () {
      var a = this._.cache;
      if (a.startElement !== void 0)return a.startElement;
      var b;
      switch (this.getType()) {
        case CKEDITOR.SELECTION_ELEMENT:
          return this.getSelectedElement();
        case CKEDITOR.SELECTION_TEXT:
          var c = this.getRanges()[0];
          if (c) {
            if (c.collapsed) {
              b = c.startContainer;
              b.type != CKEDITOR.NODE_ELEMENT && (b = b.getParent())
            } else {
              for (c.optimize(); ;) {
                b = c.startContainer;
                if (c.startOffset == (b.getChildCount ? b.getChildCount() :
                    b.getLength()) && !b.isBlockBoundary())c.setStartAfter(b); else break
              }
              b = c.startContainer;
              if (b.type != CKEDITOR.NODE_ELEMENT)return b.getParent();
              b = b.getChild(c.startOffset);
              if (!b || b.type != CKEDITOR.NODE_ELEMENT)b = c.startContainer; else for (c = b.getFirst(); c && c.type == CKEDITOR.NODE_ELEMENT;) {
                b = c;
                c = c.getFirst()
              }
            }
            b = b.$
          }
      }
      return a.startElement = b ? new CKEDITOR.dom.element(b) : null
    }, getSelectedElement: function () {
      var a = this._.cache;
      if (a.selectedElement !== void 0)return a.selectedElement;
      var b = this, c = CKEDITOR.tools.tryThese(function () {
          return b.getNative().createRange().item(0)
        },
        function () {
          for (var a = b.getRanges()[0].clone(), c, d, e = 2; e && (!(c = a.getEnclosedNode()) || !(c.type == CKEDITOR.NODE_ELEMENT && w[c.getName()] && (d = c))); e--)a.shrink(CKEDITOR.SHRINK_ELEMENT);
          return d && d.$
        });
      return a.selectedElement = c ? new CKEDITOR.dom.element(c) : null
    }, getSelectedText: function () {
      var a = this._.cache;
      if (a.selectedText !== void 0)return a.selectedText;
      var b = this.getNative(), b = g ? b.type == "Control" ? "" : b.createRange().text : b.toString();
      return a.selectedText = b
    }, lock: function () {
      this.getRanges();
      this.getStartElement();
      this.getSelectedElement();
      this.getSelectedText();
      this._.cache.nativeSel = null;
      this.isLocked = 1
    }, unlock: function (a) {
      if (this.isLocked) {
        if (a)var b = this.getSelectedElement(), c = !b && this.getRanges(), d = this.isFake;
        this.isLocked = 0;
        this.reset();
        if (a)(a = b || c[0] && c[0].getCommonAncestor()) && a.getAscendant("body", 1) && (d ? this.fake(b) : b ? this.selectElement(b) : this.selectRanges(c))
      }
    }, reset: function () {
      this._.cache = {};
      this.isFake = 0;
      var a = this.root.editor;
      if (a && a._.fakeSelection && this.rev == a._.fakeSelection.rev) {
        delete a._.fakeSelection;
        var b = a._.hiddenSelectionContainer;
        if (b) {
          a.fire("lockSnapshot");
          b.remove();
          a.fire("unlockSnapshot")
        }
        delete a._.hiddenSelectionContainer
      }
      this.rev = r++
    }, selectElement: function (a) {
      var b = new CKEDITOR.dom.range(this.root);
      b.setStartBefore(a);
      b.setEndAfter(a);
      this.selectRanges([b])
    }, selectRanges: function (a) {
      this.reset();
      if (a.length)if (this.isLocked) {
        var b = CKEDITOR.document.getActive();
        this.unlock();
        this.selectRanges(a);
        this.lock();
        !b.equals(this.root) && b.focus()
      } else if (a.length == 1 && !a[0].collapsed && (b =
          a[0].getEnclosedNode()) && b.type == CKEDITOR.NODE_ELEMENT && b.getAttribute("contenteditable") == "false")this.fake(b); else {
        if (g) {
          var d = CKEDITOR.dom.walker.whitespaces(true), e = /\ufeff|\u00a0/, h = {table: 1, tbody: 1, tr: 1};
          if (a.length > 1) {
            b = a[a.length - 1];
            a[0].setEnd(b.endContainer, b.endOffset)
          }
          var b = a[0], a = b.collapsed, j, k, l, n = b.getEnclosedNode();
          if (n && n.type == CKEDITOR.NODE_ELEMENT && n.getName()in w && (!n.is("a") || !n.getText()))try {
            l = n.$.createControlRange();
            l.addElement(n.$);
            l.select();
            return
          } catch (s) {
          }
          (b.startContainer.type ==
          CKEDITOR.NODE_ELEMENT && b.startContainer.getName()in h || b.endContainer.type == CKEDITOR.NODE_ELEMENT && b.endContainer.getName()in h) && b.shrink(CKEDITOR.NODE_ELEMENT, true);
          l = b.createBookmark();
          var h = l.startNode, r;
          if (!a)r = l.endNode;
          l = b.document.$.body.createTextRange();
          l.moveToElementText(h.$);
          l.moveStart("character", 1);
          if (r) {
            e = b.document.$.body.createTextRange();
            e.moveToElementText(r.$);
            l.setEndPoint("EndToEnd", e);
            l.moveEnd("character", -1)
          } else {
            j = h.getNext(d);
            k = h.hasAscendant("pre");
            j = !(j && j.getText &&
              j.getText().match(e)) && (k || !h.hasPrevious() || h.getPrevious().is && h.getPrevious().is("br"));
            k = b.document.createElement("span");
            k.setHtml("&#65279;");
            k.insertBefore(h);
            j && b.document.createText("﻿").insertBefore(h)
          }
          b.setStartBefore(h);
          h.remove();
          if (a) {
            if (j) {
              l.moveStart("character", -1);
              l.select();
              b.document.$.selection.clear()
            } else l.select();
            b.moveToPosition(k, CKEDITOR.POSITION_BEFORE_START);
            k.remove()
          } else {
            b.setEndBefore(r);
            r.remove();
            l.select()
          }
        } else {
          r = this.getNative();
          if (!r)return;
          if (CKEDITOR.env.opera) {
            b =
              this.document.$.createRange();
            b.selectNodeContents(this.root.$);
            r.addRange(b)
          }
          this.removeAllRanges();
          for (l = 0; l < a.length; l++) {
            if (l < a.length - 1) {
              b = a[l];
              e = a[l + 1];
              k = b.clone();
              k.setStart(b.endContainer, b.endOffset);
              k.setEnd(e.startContainer, e.startOffset);
              if (!k.collapsed) {
                k.shrink(CKEDITOR.NODE_ELEMENT, true);
                j = k.getCommonAncestor();
                k = k.getEnclosedNode();
                if (j.isReadOnly() || k && k.isReadOnly()) {
                  e.setStart(b.startContainer, b.startOffset);
                  a.splice(l--, 1);
                  continue
                }
              }
            }
            b = a[l];
            e = this.document.$.createRange();
            j = b.startContainer;
            if (CKEDITOR.env.opera && b.collapsed && j.type == CKEDITOR.NODE_ELEMENT) {
              k = j.getChild(b.startOffset - 1);
              d = j.getChild(b.startOffset);
              if (!k && !d && j.is(CKEDITOR.dtd.$removeEmpty) || k && k.type == CKEDITOR.NODE_ELEMENT || d && d.type == CKEDITOR.NODE_ELEMENT) {
                b.insertNode(this.document.createText(""));
                b.collapse(1)
              }
            }
            if (b.collapsed && CKEDITOR.env.webkit && c(b)) {
              j = this.root;
              f(j, false);
              k = j.getDocument().createText("​");
              j.setCustomData("cke-fillingChar", k);
              b.insertNode(k);
              if ((j = k.getNext()) && !k.getPrevious() && j.type == CKEDITOR.NODE_ELEMENT &&
                j.getName() == "br") {
                f(this.root);
                b.moveToPosition(j, CKEDITOR.POSITION_BEFORE_START)
              } else b.moveToPosition(k, CKEDITOR.POSITION_AFTER_END)
            }
            e.setStart(b.startContainer.$, b.startOffset);
            try {
              e.setEnd(b.endContainer.$, b.endOffset)
            } catch (t) {
              if (t.toString().indexOf("NS_ERROR_ILLEGAL_VALUE") >= 0) {
                b.collapse(1);
                e.setEnd(b.endContainer.$, b.endOffset)
              } else throw t;
            }
            r.addRange(e)
          }
        }
        this.reset();
        this.root.fire("selectionchange")
      }
    }, fake: function (a) {
      var b = this.root.editor;
      this.reset();
      j(b);
      var c = this._.cache, d = new CKEDITOR.dom.range(this.root);
      d.setStartBefore(a);
      d.setEndAfter(a);
      c.ranges = new CKEDITOR.dom.rangeList(d);
      c.selectedElement = c.startElement = a;
      c.type = CKEDITOR.SELECTION_ELEMENT;
      c.selectedText = c.nativeSel = null;
      this.isFake = 1;
      this.rev = r++;
      b._.fakeSelection = this;
      this.root.fire("selectionchange")
    }, isHidden: function () {
      var a = this.getCommonAncestor();
      a && a.type == CKEDITOR.NODE_TEXT && (a = a.getParent());
      return !(!a || !a.data("cke-hidden-sel"))
    }, createBookmarks: function (a) {
      a = this.getRanges().createBookmarks(a);
      this.isFake && (a.isFake = 1);
      return a
    },
      createBookmarks2: function (a) {
        a = this.getRanges().createBookmarks2(a);
        this.isFake && (a.isFake = 1);
        return a
      }, selectBookmarks: function (a) {
      for (var b = [], c = 0; c < a.length; c++) {
        var d = new CKEDITOR.dom.range(this.root);
        d.moveToBookmark(a[c]);
        b.push(d)
      }
      a.isFake ? this.fake(b[0].getEnclosedNode()) : this.selectRanges(b);
      return this
    }, getCommonAncestor: function () {
      var a = this.getRanges();
      return !a.length ? null : a[0].startContainer.getCommonAncestor(a[a.length - 1].endContainer)
    }, scrollIntoView: function () {
      this.type != CKEDITOR.SELECTION_NONE &&
      this.getRanges()[0].scrollIntoView()
    }, removeAllRanges: function () {
      var a = this.getNative();
      try {
        a && a[g ? "empty" : "removeAllRanges"]()
      } catch (b) {
      }
      this.reset()
    }
    }
  })();
  "use strict";
  CKEDITOR.editor.prototype.attachStyleStateChange = function (a, d) {
    var b = this._.styleStateChangeCallbacks;
    if (!b) {
      b = this._.styleStateChangeCallbacks = [];
      this.on("selectionChange", function (a) {
        for (var d = 0; d < b.length; d++) {
          var f = b[d], h = f.style.checkActive(a.data.path) ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF;
          f.fn.call(this, h)
        }
      })
    }
    b.push({style: a, fn: d})
  };
  CKEDITOR.STYLE_BLOCK = 1;
  CKEDITOR.STYLE_INLINE = 2;
  CKEDITOR.STYLE_OBJECT = 3;
  (function () {
    function a(a, b) {
      for (var c, d; a = a.getParent();) {
        if (a.equals(b))break;
        if (a.getAttribute("data-nostyle"))c = a; else if (!d) {
          var e = a.getAttribute("contentEditable");
          e == "false" ? c = a : e == "true" && (d = 1)
        }
      }
      return c
    }

    function d(b) {
      var e = b.document;
      if (b.collapsed) {
        e = w(this, e);
        b.insertNode(e);
        b.moveToPosition(e, CKEDITOR.POSITION_BEFORE_END)
      } else {
        var g = this.element, f = this._.definition, h, i = f.ignoreReadonly, j = i || f.includeReadonly;
        j == void 0 && (j = b.root.getCustomData("cke_includeReadonly"));
        var k = CKEDITOR.dtd[g];
        if (!k) {
          h = true;
          k = CKEDITOR.dtd.span
        }
        b.enlarge(CKEDITOR.ENLARGE_INLINE, 1);
        b.trim();
        var l = b.createBookmark(), m = l.startNode, n = l.endNode, o = m, p;
        if (!i) {
          var r = b.getCommonAncestor(), i = a(m, r), r = a(n, r);
          i && (o = i.getNextSourceNode(true));
          r && (n = r)
        }
        for (o.getPosition(n) == CKEDITOR.POSITION_FOLLOWING && (o = 0); o;) {
          i = false;
          if (o.equals(n)) {
            o = null;
            i = true
          } else {
            var s = o.type == CKEDITOR.NODE_ELEMENT ? o.getName() : null, r = s && o.getAttribute("contentEditable") == "false", q = s && o.getAttribute("data-nostyle");
            if (s && o.data("cke-bookmark")) {
              o =
                o.getNextSourceNode(true);
              continue
            }
            if (r && j && CKEDITOR.dtd.$block[s])for (var u = o, x = c(u), B = void 0, E = x.length, I = 0, u = E && new CKEDITOR.dom.range(u.getDocument()); I < E; ++I) {
              var B = x[I], L = CKEDITOR.filter.instances[B.data("cke-filter")];
              if (L ? L.check(this) : 1) {
                u.selectNodeContents(B);
                d.call(this, u)
              }
            }
            x = s ? !k[s] || q ? 0 : r && !j ? 0 : (o.getPosition(n) | M) == M && (!f.childRule || f.childRule(o)) : 1;
            if (x)if ((x = o.getParent()) && ((x.getDtd() || CKEDITOR.dtd.span)[g] || h) && (!f.parentRule || f.parentRule(x))) {
              if (!p && (!s || !CKEDITOR.dtd.$removeEmpty[s] ||
                (o.getPosition(n) | M) == M)) {
                p = b.clone();
                p.setStartBefore(o)
              }
              s = o.type;
              if (s == CKEDITOR.NODE_TEXT || r || s == CKEDITOR.NODE_ELEMENT && !o.getChildCount()) {
                for (var s = o, W; (i = !s.getNext(C)) && (W = s.getParent(), k[W.getName()]) && (W.getPosition(m) | y) == y && (!f.childRule || f.childRule(W));)s = W;
                p.setEndAfter(s)
              }
            } else i = true; else i = true;
            o = o.getNextSourceNode(q || r)
          }
          if (i && p && !p.collapsed) {
            for (var i = w(this, e), r = i.hasAttributes(), q = p.getCommonAncestor(), s = {}, x = {}, B = {}, E = {}, T, Q, Z; i && q;) {
              if (q.getName() == g) {
                for (T in f.attributes)if (!E[T] &&
                  (Z = q.getAttribute(Q)))i.getAttribute(T) == Z ? x[T] = 1 : E[T] = 1;
                for (Q in f.styles)if (!B[Q] && (Z = q.getStyle(Q)))i.getStyle(Q) == Z ? s[Q] = 1 : B[Q] = 1
              }
              q = q.getParent()
            }
            for (T in x)i.removeAttribute(T);
            for (Q in s)i.removeStyle(Q);
            r && !i.hasAttributes() && (i = null);
            if (i) {
              p.extractContents().appendTo(i);
              p.insertNode(i);
              t.call(this, i);
              i.mergeSiblings();
              CKEDITOR.env.ie || i.$.normalize()
            } else {
              i = new CKEDITOR.dom.element("span");
              p.extractContents().appendTo(i);
              p.insertNode(i);
              t.call(this, i);
              i.remove(true)
            }
            p = null
          }
        }
        b.moveToBookmark(l);
        b.shrink(CKEDITOR.SHRINK_TEXT);
        b.shrink(CKEDITOR.NODE_ELEMENT, true)
      }
    }

    function b(a) {
      function b() {
        for (var a = new CKEDITOR.dom.elementPath(d.getParent()), c = new CKEDITOR.dom.elementPath(k.getParent()), e = null, g = null, f = 0; f < a.elements.length; f++) {
          var h = a.elements[f];
          if (h == a.block || h == a.blockLimit)break;
          l.checkElementRemovable(h) && (e = h)
        }
        for (f = 0; f < c.elements.length; f++) {
          h = c.elements[f];
          if (h == c.block || h == c.blockLimit)break;
          l.checkElementRemovable(h) && (g = h)
        }
        g && k.breakParent(g);
        e && d.breakParent(e)
      }

      a.enlarge(CKEDITOR.ENLARGE_INLINE,
        1);
      var c = a.createBookmark(), d = c.startNode;
      if (a.collapsed) {
        for (var e = new CKEDITOR.dom.elementPath(d.getParent(), a.root), f, h = 0, i; h < e.elements.length && (i = e.elements[h]); h++) {
          if (i == e.block || i == e.blockLimit)break;
          if (this.checkElementRemovable(i)) {
            var j;
            if (a.collapsed && (a.checkBoundaryOfElement(i, CKEDITOR.END) || (j = a.checkBoundaryOfElement(i, CKEDITOR.START)))) {
              f = i;
              f.match = j ? "start" : "end"
            } else {
              i.mergeSiblings();
              i.is(this.element) ? s.call(this, i) : g(i, q(this)[i.getName()])
            }
          }
        }
        if (f) {
          i = d;
          for (h = 0; ; h++) {
            j = e.elements[h];
            if (j.equals(f))break; else if (j.match)continue; else j = j.clone();
            j.append(i);
            i = j
          }
          i[f.match == "start" ? "insertBefore" : "insertAfter"](f)
        }
      } else {
        var k = c.endNode, l = this;
        b();
        for (e = d; !e.equals(k);) {
          f = e.getNextSourceNode();
          if (e.type == CKEDITOR.NODE_ELEMENT && this.checkElementRemovable(e)) {
            e.getName() == this.element ? s.call(this, e) : g(e, q(this)[e.getName()]);
            if (f.type == CKEDITOR.NODE_ELEMENT && f.contains(d)) {
              b();
              f = d.getNext()
            }
          }
          e = f
        }
      }
      a.moveToBookmark(c);
      a.shrink(CKEDITOR.NODE_ELEMENT, true)
    }

    function c(a) {
      var b = [];
      a.forEach(function (a) {
        if (a.getAttribute("contenteditable") ==
          "true") {
          b.push(a);
          return false
        }
      }, CKEDITOR.NODE_ELEMENT, true);
      return b
    }

    function e(a) {
      var b = a.getEnclosedNode() || a.getCommonAncestor(false, true);
      (a = (new CKEDITOR.dom.elementPath(b, a.root)).contains(this.element, 1)) && !a.isReadOnly() && m(a, this)
    }

    function f(a) {
      var b = a.getCommonAncestor(true, true);
      if (a = (new CKEDITOR.dom.elementPath(b, a.root)).contains(this.element, 1)) {
        var b = this._.definition, c = b.attributes;
        if (c)for (var d in c)a.removeAttribute(d, c[d]);
        if (b.styles)for (var e in b.styles)b.styles.hasOwnProperty(e) &&
        a.removeStyle(e)
      }
    }

    function h(a) {
      var b = a.createBookmark(true), c = a.createIterator();
      c.enforceRealBlocks = true;
      if (this._.enterMode)c.enlargeBr = this._.enterMode != CKEDITOR.ENTER_BR;
      for (var d, e = a.document, g; d = c.getNextParagraph();)if (!d.isReadOnly() && (c.activeFilter ? c.activeFilter.check(this) : 1)) {
        g = w(this, e, d);
        j(d, g)
      }
      a.moveToBookmark(b)
    }

    function n(a) {
      var b = a.createBookmark(1), c = a.createIterator();
      c.enforceRealBlocks = true;
      c.enlargeBr = this._.enterMode != CKEDITOR.ENTER_BR;
      for (var d, e; d = c.getNextParagraph();)if (this.checkElementRemovable(d))if (d.is("pre")) {
        (e =
          this._.enterMode == CKEDITOR.ENTER_BR ? null : a.document.createElement(this._.enterMode == CKEDITOR.ENTER_P ? "p" : "div")) && d.copyAttributes(e);
        j(d, e)
      } else s.call(this, d);
      a.moveToBookmark(b)
    }

    function j(a, b) {
      var c = !b;
      if (c) {
        b = a.getDocument().createElement("div");
        a.copyAttributes(b)
      }
      var d = b && b.is("pre"), e = a.is("pre"), g = !d && e;
      if (d && !e) {
        e = b;
        (g = a.getBogus()) && g.remove();
        g = a.getHtml();
        g = l(g, /(?:^[ \t\n\r]+)|(?:[ \t\n\r]+$)/g, "");
        g = g.replace(/[ \t\r\n]*(<br[^>]*>)[ \t\r\n]*/gi, "$1");
        g = g.replace(/([ \t\n\r]+|&nbsp;)/g,
          " ");
        g = g.replace(/<br\b[^>]*>/gi, "\n");
        if (CKEDITOR.env.ie) {
          var f = a.getDocument().createElement("div");
          f.append(e);
          e.$.outerHTML = "<pre>" + g + "</pre>";
          e.copyAttributes(f.getFirst());
          e = f.getFirst().remove()
        } else e.setHtml(g);
        b = e
      } else g ? b = u(c ? [a.getHtml()] : k(a), b) : a.moveChildren(b);
      b.replace(a);
      if (d) {
        var c = b, h;
        if ((h = c.getPrevious(x)) && h.type == CKEDITOR.NODE_ELEMENT && h.is("pre")) {
          d = l(h.getHtml(), /\n$/, "") + "\n\n" + l(c.getHtml(), /^\n/, "");
          CKEDITOR.env.ie ? c.$.outerHTML = "<pre>" + d + "</pre>" : c.setHtml(d);
          h.remove()
        }
      } else c &&
      r(b)
    }

    function k(a) {
      a.getName();
      var b = [];
      l(a.getOuterHtml(), /(\S\s*)\n(?:\s|(<span[^>]+data-cke-bookmark.*?\/span>))*\n(?!$)/gi, function (a, b, c) {
        return b + "</pre>" + c + "<pre>"
      }).replace(/<pre\b.*?>([\s\S]*?)<\/pre>/gi, function (a, c) {
        b.push(c)
      });
      return b
    }

    function l(a, b, c) {
      var d = "", e = "", a = a.replace(/(^<span[^>]+data-cke-bookmark.*?\/span>)|(<span[^>]+data-cke-bookmark.*?\/span>$)/gi, function (a, b, c) {
        b && (d = b);
        c && (e = c);
        return ""
      });
      return d + a.replace(b, c) + e
    }

    function u(a, b) {
      var c;
      a.length > 1 && (c = new CKEDITOR.dom.documentFragment(b.getDocument()));
      for (var d = 0; d < a.length; d++) {
        var e = a[d], e = e.replace(/(\r\n|\r)/g, "\n"), e = l(e, /^[ \t]*\n/, ""), e = l(e, /\n$/, ""), e = l(e, /^[ \t]+|[ \t]+$/g, function (a, b) {
          return a.length == 1 ? "&nbsp;" : b ? " " + CKEDITOR.tools.repeat("&nbsp;", a.length - 1) : CKEDITOR.tools.repeat("&nbsp;", a.length - 1) + " "
        }), e = e.replace(/\n/g, "<br>"), e = e.replace(/[ \t]{2,}/g, function (a) {
          return CKEDITOR.tools.repeat("&nbsp;", a.length - 1) + " "
        });
        if (c) {
          var g = b.clone();
          g.setHtml(e);
          c.append(g)
        } else b.setHtml(e)
      }
      return c || b
    }

    function s(a) {
      var b = this._.definition,
        c = b.attributes, b = b.styles, d = q(this)[a.getName()], e = CKEDITOR.tools.isEmpty(c) && CKEDITOR.tools.isEmpty(b), f;
      for (f in c)if (!((f == "class" || this._.definition.fullMatch) && a.getAttribute(f) != o(f, c[f]))) {
        e = a.hasAttribute(f);
        a.removeAttribute(f)
      }
      for (var h in b)if (!(this._.definition.fullMatch && a.getStyle(h) != o(h, b[h], true))) {
        e = e || !!a.getStyle(h);
        a.removeStyle(h)
      }
      g(a, d, p[a.getName()]);
      e && (this._.definition.alwaysRemoveElement ? r(a, 1) : !CKEDITOR.dtd.$block[a.getName()] || this._.enterMode == CKEDITOR.ENTER_BR && !a.hasAttributes() ?
        r(a) : a.renameNode(this._.enterMode == CKEDITOR.ENTER_P ? "p" : "div"))
    }

    function t(a) {
      for (var b = q(this), c = a.getElementsByTag(this.element), d, e = c.count(); --e >= 0;) {
        d = c.getItem(e);
        d.isReadOnly() || s.call(this, d)
      }
      for (var f in b)if (f != this.element) {
        c = a.getElementsByTag(f);
        for (e = c.count() - 1; e >= 0; e--) {
          d = c.getItem(e);
          d.isReadOnly() || g(d, b[f])
        }
      }
    }

    function g(a, b, c) {
      if (b = b && b.attributes)for (var d = 0; d < b.length; d++) {
        var e = b[d][0], g;
        if (g = a.getAttribute(e)) {
          var f = b[d][1];
          (f === null || f.test && f.test(g) || typeof f == "string" &&
          g == f) && a.removeAttribute(e)
        }
      }
      c || r(a)
    }

    function r(a, b) {
      if (!a.hasAttributes() || b)if (CKEDITOR.dtd.$block[a.getName()]) {
        var c = a.getPrevious(x), d = a.getNext(x);
        c && (c.type == CKEDITOR.NODE_TEXT || !c.isBlockBoundary({br: 1})) && a.append("br", 1);
        d && (d.type == CKEDITOR.NODE_TEXT || !d.isBlockBoundary({br: 1})) && a.append("br");
        a.remove(true)
      } else {
        c = a.getFirst();
        d = a.getLast();
        a.remove(true);
        if (c) {
          c.type == CKEDITOR.NODE_ELEMENT && c.mergeSiblings();
          d && (!c.equals(d) && d.type == CKEDITOR.NODE_ELEMENT) && d.mergeSiblings()
        }
      }
    }

    function w(a,
               b, c) {
      var d;
      d = a.element;
      d == "*" && (d = "span");
      d = new CKEDITOR.dom.element(d, b);
      c && c.copyAttributes(d);
      d = m(d, a);
      b.getCustomData("doc_processing_style") && d.hasAttribute("id") ? d.removeAttribute("id") : b.setCustomData("doc_processing_style", 1);
      return d
    }

    function m(a, b) {
      var c = b._.definition, d = c.attributes, c = CKEDITOR.style.getStyleText(c);
      if (d)for (var e in d)a.setAttribute(e, d[e]);
      c && a.setAttribute("style", c);
      return a
    }

    function i(a, b) {
      for (var c in a)a[c] = a[c].replace(I, function (a, c) {
        return b[c]
      })
    }

    function q(a) {
      if (a._.overrides)return a._.overrides;
      var b = a._.overrides = {}, c = a._.definition.overrides;
      if (c) {
        CKEDITOR.tools.isArray(c) || (c = [c]);
        for (var d = 0; d < c.length; d++) {
          var e = c[d], g, f;
          if (typeof e == "string")g = e.toLowerCase(); else {
            g = e.element ? e.element.toLowerCase() : a.element;
            f = e.attributes
          }
          e = b[g] || (b[g] = {});
          if (f) {
            var e = e.attributes = e.attributes || [], h;
            for (h in f)e.push([h.toLowerCase(), f[h]])
          }
        }
      }
      return b
    }

    function o(a, b, c) {
      var d = new CKEDITOR.dom.element("span");
      d[c ? "setStyle" : "setAttribute"](a, b);
      return d[c ? "getStyle" : "getAttribute"](a)
    }

    function B(a,
               b) {
      for (var c = a.document, d = a.getRanges(), e = b ? this.removeFromRange : this.applyToRange, g, f = d.createIterator(); g = f.getNextRange();)e.call(this, g);
      a.selectRanges(d);
      c.removeCustomData("doc_processing_style")
    }

    var p = {
      address: 1,
      div: 1,
      h1: 1,
      h2: 1,
      h3: 1,
      h4: 1,
      h5: 1,
      h6: 1,
      p: 1,
      pre: 1,
      section: 1,
      header: 1,
      footer: 1,
      nav: 1,
      article: 1,
      aside: 1,
      figure: 1,
      dialog: 1,
      hgroup: 1,
      time: 1,
      meter: 1,
      menu: 1,
      command: 1,
      keygen: 1,
      output: 1,
      progress: 1,
      details: 1,
      datagrid: 1,
      datalist: 1
    }, L = {
      a: 1, embed: 1, hr: 1, img: 1, li: 1, object: 1, ol: 1, table: 1, td: 1, tr: 1,
      th: 1, ul: 1, dl: 1, dt: 1, dd: 1, form: 1, audio: 1, video: 1
    }, E = /\s*(?:;\s*|$)/, I = /#\((.+?)\)/g, C = CKEDITOR.dom.walker.bookmark(0, 1), x = CKEDITOR.dom.walker.whitespaces(1);
    CKEDITOR.style = function (a, b) {
      var c = a.attributes;
      if (c && c.style) {
        a.styles = CKEDITOR.tools.extend({}, a.styles, CKEDITOR.tools.parseCssText(c.style));
        delete c.style
      }
      if (b) {
        a = CKEDITOR.tools.clone(a);
        i(a.attributes, b);
        i(a.styles, b)
      }
      c = this.element = a.element ? typeof a.element == "string" ? a.element.toLowerCase() : a.element : "*";
      this.type = a.type || (p[c] ? CKEDITOR.STYLE_BLOCK :
          L[c] ? CKEDITOR.STYLE_OBJECT : CKEDITOR.STYLE_INLINE);
      if (typeof this.element == "object")this.type = CKEDITOR.STYLE_OBJECT;
      this._ = {definition: a}
    };
    CKEDITOR.editor.prototype.applyStyle = function (a) {
      a.checkApplicable(this.elementPath()) && B.call(a, this.getSelection())
    };
    CKEDITOR.editor.prototype.removeStyle = function (a) {
      a.checkApplicable(this.elementPath()) && B.call(a, this.getSelection(), 1)
    };
    CKEDITOR.style.prototype = {
      apply: function (a) {
        B.call(this, a.getSelection())
      }, remove: function (a) {
        B.call(this, a.getSelection(),
          1)
      }, applyToRange: function (a) {
        return (this.applyToRange = this.type == CKEDITOR.STYLE_INLINE ? d : this.type == CKEDITOR.STYLE_BLOCK ? h : this.type == CKEDITOR.STYLE_OBJECT ? e : null).call(this, a)
      }, removeFromRange: function (a) {
        return (this.removeFromRange = this.type == CKEDITOR.STYLE_INLINE ? b : this.type == CKEDITOR.STYLE_BLOCK ? n : this.type == CKEDITOR.STYLE_OBJECT ? f : null).call(this, a)
      }, applyToObject: function (a) {
        m(a, this)
      }, checkActive: function (a) {
        switch (this.type) {
          case CKEDITOR.STYLE_BLOCK:
            return this.checkElementRemovable(a.block ||
              a.blockLimit, true);
          case CKEDITOR.STYLE_OBJECT:
          case CKEDITOR.STYLE_INLINE:
            for (var b = a.elements, c = 0, d; c < b.length; c++) {
              d = b[c];
              if (!(this.type == CKEDITOR.STYLE_INLINE && (d == a.block || d == a.blockLimit))) {
                if (this.type == CKEDITOR.STYLE_OBJECT) {
                  var e = d.getName();
                  if (!(typeof this.element == "string" ? e == this.element : e in this.element))continue
                }
                if (this.checkElementRemovable(d, true))return true
              }
            }
        }
        return false
      }, checkApplicable: function (a, b) {
        if (b && !b.check(this))return false;
        switch (this.type) {
          case CKEDITOR.STYLE_OBJECT:
            return !!a.contains(this.element);
          case CKEDITOR.STYLE_BLOCK:
            return !!a.blockLimit.getDtd()[this.element]
        }
        return true
      }, checkElementMatch: function (a, b) {
        var c = this._.definition;
        if (!a || !c.ignoreReadonly && a.isReadOnly())return false;
        var d = a.getName();
        if (typeof this.element == "string" ? d == this.element : d in this.element) {
          if (!b && !a.hasAttributes())return true;
          if (d = c._AC)c = d; else {
            var d = {}, e = 0, g = c.attributes;
            if (g)for (var f in g) {
              e++;
              d[f] = g[f]
            }
            if (f = CKEDITOR.style.getStyleText(c)) {
              d.style || e++;
              d.style = f
            }
            d._length = e;
            c = c._AC = d
          }
          if (c._length) {
            for (var h in c)if (h !=
              "_length") {
              e = a.getAttribute(h) || "";
              if (h == "style")a:{
                d = c[h];
                typeof d == "string" && (d = CKEDITOR.tools.parseCssText(d));
                typeof e == "string" && (e = CKEDITOR.tools.parseCssText(e, true));
                f = void 0;
                for (f in d)if (!(f in e && (e[f] == d[f] || d[f] == "inherit" || e[f] == "inherit"))) {
                  d = false;
                  break a
                }
                d = true
              } else d = c[h] == e;
              if (d) {
                if (!b)return true
              } else if (b)return false
            }
            if (b)return true
          } else return true
        }
        return false
      }, checkElementRemovable: function (a, b) {
        if (this.checkElementMatch(a, b))return true;
        var c = q(this)[a.getName()];
        if (c) {
          var d;
          if (!(c = c.attributes))return true;
          for (var e = 0; e < c.length; e++) {
            d = c[e][0];
            if (d = a.getAttribute(d)) {
              var g = c[e][1];
              if (g === null || typeof g == "string" && d == g || g.test(d))return true
            }
          }
        }
        return false
      }, buildPreview: function (a) {
        var b = this._.definition, c = [], d = b.element;
        d == "bdo" && (d = "span");
        var c = ["<", d], e = b.attributes;
        if (e)for (var g in e)c.push(" ", g, '="', e[g], '"');
        (e = CKEDITOR.style.getStyleText(b)) && c.push(' style="', e, '"');
        c.push(">", a || b.name, "</", d, ">");
        return c.join("")
      }, getDefinition: function () {
        return this._.definition
      }
    };
    CKEDITOR.style.getStyleText = function (a) {
      var b = a._ST;
      if (b)return b;
      var b = a.styles, c = a.attributes && a.attributes.style || "", d = "";
      c.length && (c = c.replace(E, ";"));
      for (var e in b) {
        var g = b[e], f = (e + ":" + g).replace(E, ";");
        g == "inherit" ? d = d + f : c = c + f
      }
      c.length && (c = CKEDITOR.tools.normalizeCssText(c, true));
      return a._ST = c + d
    };
    var M = CKEDITOR.POSITION_PRECEDING | CKEDITOR.POSITION_IDENTICAL | CKEDITOR.POSITION_IS_CONTAINED, y = CKEDITOR.POSITION_FOLLOWING | CKEDITOR.POSITION_IDENTICAL | CKEDITOR.POSITION_IS_CONTAINED
  })();
  CKEDITOR.styleCommand = function (a, d) {
    this.requiredContent = this.allowedContent = this.style = a;
    CKEDITOR.tools.extend(this, d, true)
  };
  CKEDITOR.styleCommand.prototype.exec = function (a) {
    a.focus();
    this.state == CKEDITOR.TRISTATE_OFF ? a.applyStyle(this.style) : this.state == CKEDITOR.TRISTATE_ON && a.removeStyle(this.style)
  };
  CKEDITOR.stylesSet = new CKEDITOR.resourceManager("", "stylesSet");
  CKEDITOR.addStylesSet = CKEDITOR.tools.bind(CKEDITOR.stylesSet.add, CKEDITOR.stylesSet);
  CKEDITOR.loadStylesSet = function (a, d, b) {
    CKEDITOR.stylesSet.addExternal(a, d, "");
    CKEDITOR.stylesSet.load(a, b)
  };
  CKEDITOR.editor.prototype.getStylesSet = function (a) {
    if (this._.stylesDefinitions)a(this._.stylesDefinitions); else {
      var d = this, b = d.config.stylesCombo_stylesSet || d.config.stylesSet;
      if (b === false)a(null); else if (b instanceof Array) {
        d._.stylesDefinitions = b;
        a(b)
      } else {
        b || (b = "default");
        var b = b.split(":"), c = b[0];
        CKEDITOR.stylesSet.addExternal(c, b[1] ? b.slice(1).join(":") : CKEDITOR.getUrl("styles.js"), "");
        CKEDITOR.stylesSet.load(c, function (b) {
          d._.stylesDefinitions = b[c];
          a(d._.stylesDefinitions)
        })
      }
    }
  };
  CKEDITOR.dom.comment = function (a, d) {
    typeof a == "string" && (a = (d ? d.$ : document).createComment(a));
    CKEDITOR.dom.domObject.call(this, a)
  };
  CKEDITOR.dom.comment.prototype = new CKEDITOR.dom.node;
  CKEDITOR.tools.extend(CKEDITOR.dom.comment.prototype, {
    type: CKEDITOR.NODE_COMMENT, getOuterHtml: function () {
      return "<\!--" + this.$.nodeValue + "--\>"
    }
  });
  "use strict";
  (function () {
    var a = {}, d = {}, b;
    for (b in CKEDITOR.dtd.$blockLimit)b in CKEDITOR.dtd.$list || (a[b] = 1);
    for (b in CKEDITOR.dtd.$block)b in CKEDITOR.dtd.$blockLimit || b in CKEDITOR.dtd.$empty || (d[b] = 1);
    CKEDITOR.dom.elementPath = function (b, e) {
      var f = null, h = null, n = [], j = b, k, e = e || b.getDocument().getBody();
      do if (j.type == CKEDITOR.NODE_ELEMENT) {
        n.push(j);
        if (!this.lastElement) {
          this.lastElement = j;
          if (j.is(CKEDITOR.dtd.$object) || j.getAttribute("contenteditable") == "false")continue
        }
        if (j.equals(e))break;
        if (!h) {
          k = j.getName();
          j.getAttribute("contenteditable") == "true" ? h = j : !f && d[k] && (f = j);
          if (a[k]) {
            var l;
            if (l = !f) {
              if (k = k == "div") {
                a:{
                  k = j.getChildren();
                  l = 0;
                  for (var u = k.count(); l < u; l++) {
                    var s = k.getItem(l);
                    if (s.type == CKEDITOR.NODE_ELEMENT && CKEDITOR.dtd.$block[s.getName()]) {
                      k = true;
                      break a
                    }
                  }
                  k = false
                }
                k = !k
              }
              l = k
            }
            l ? f = j : h = j
          }
        }
      } while (j = j.getParent());
      h || (h = e);
      this.block = f;
      this.blockLimit = h;
      this.root = e;
      this.elements = n
    }
  })();
  CKEDITOR.dom.elementPath.prototype = {
    compare: function (a) {
      var d = this.elements, a = a && a.elements;
      if (!a || d.length != a.length)return false;
      for (var b = 0; b < d.length; b++)if (!d[b].equals(a[b]))return false;
      return true
    }, contains: function (a, d, b) {
      var c;
      typeof a == "string" && (c = function (b) {
        return b.getName() == a
      });
      a instanceof CKEDITOR.dom.element ? c = function (b) {
        return b.equals(a)
      } : CKEDITOR.tools.isArray(a) ? c = function (b) {
        return CKEDITOR.tools.indexOf(a, b.getName()) > -1
      } : typeof a == "function" ? c = a : typeof a == "object" && (c =
        function (b) {
          return b.getName()in a
        });
      var e = this.elements, f = e.length;
      d && f--;
      if (b) {
        e = Array.prototype.slice.call(e, 0);
        e.reverse()
      }
      for (d = 0; d < f; d++)if (c(e[d]))return e[d];
      return null
    }, isContextFor: function (a) {
      var d;
      if (a in CKEDITOR.dtd.$block) {
        d = this.contains(CKEDITOR.dtd.$intermediate) || this.root.equals(this.block) && this.block || this.blockLimit;
        return !!d.getDtd()[a]
      }
      return true
    }, direction: function () {
      return (this.block || this.blockLimit || this.root).getDirection(1)
    }
  };
  CKEDITOR.dom.text = function (a, d) {
    typeof a == "string" && (a = (d ? d.$ : document).createTextNode(a));
    this.$ = a
  };
  CKEDITOR.dom.text.prototype = new CKEDITOR.dom.node;
  CKEDITOR.tools.extend(CKEDITOR.dom.text.prototype, {
    type: CKEDITOR.NODE_TEXT, getLength: function () {
      return this.$.nodeValue.length
    }, getText: function () {
      return this.$.nodeValue
    }, setText: function (a) {
      this.$.nodeValue = a
    }, split: function (a) {
      var d = this.$.parentNode, b = d.childNodes.length, c = this.getLength(), e = this.getDocument(), f = new CKEDITOR.dom.text(this.$.splitText(a), e);
      if (d.childNodes.length == b)if (a >= c) {
        f = e.createText("");
        f.insertAfter(this)
      } else {
        a = e.createText("");
        a.insertAfter(f);
        a.remove()
      }
      return f
    }, substring: function (a,
                            d) {
      return typeof d != "number" ? this.$.nodeValue.substr(a) : this.$.nodeValue.substring(a, d)
    }
  });
  (function () {
    function a(a, c, d) {
      var f = a.serializable, h = c[d ? "endContainer" : "startContainer"], n = d ? "endOffset" : "startOffset", j = f ? c.document.getById(a.startNode) : a.startNode, a = f ? c.document.getById(a.endNode) : a.endNode;
      if (h.equals(j.getPrevious())) {
        c.startOffset = c.startOffset - h.getLength() - a.getPrevious().getLength();
        h = a.getNext()
      } else if (h.equals(a.getPrevious())) {
        c.startOffset = c.startOffset - h.getLength();
        h = a.getNext()
      }
      h.equals(j.getParent()) && c[n]++;
      h.equals(a.getParent()) && c[n]++;
      c[d ? "endContainer" : "startContainer"] =
        h;
      return c
    }

    CKEDITOR.dom.rangeList = function (a) {
      if (a instanceof CKEDITOR.dom.rangeList)return a;
      a ? a instanceof CKEDITOR.dom.range && (a = [a]) : a = [];
      return CKEDITOR.tools.extend(a, d)
    };
    var d = {
      createIterator: function () {
        var a = this, c = CKEDITOR.dom.walker.bookmark(), d = [], f;
        return {
          getNextRange: function (h) {
            f = f == void 0 ? 0 : f + 1;
            var n = a[f];
            if (n && a.length > 1) {
              if (!f)for (var j = a.length - 1; j >= 0; j--)d.unshift(a[j].createBookmark(true));
              if (h)for (var k = 0; a[f + k + 1];) {
                for (var l = n.document, h = 0, j = l.getById(d[k].endNode), l = l.getById(d[k +
                1].startNode); ;) {
                  j = j.getNextSourceNode(false);
                  if (l.equals(j))h = 1; else if (c(j) || j.type == CKEDITOR.NODE_ELEMENT && j.isBlockBoundary())continue;
                  break
                }
                if (!h)break;
                k++
              }
              for (n.moveToBookmark(d.shift()); k--;) {
                j = a[++f];
                j.moveToBookmark(d.shift());
                n.setEnd(j.endContainer, j.endOffset)
              }
            }
            return n
          }
        }
      }, createBookmarks: function (b) {
        for (var c = [], d, f = 0; f < this.length; f++) {
          c.push(d = this[f].createBookmark(b, true));
          for (var h = f + 1; h < this.length; h++) {
            this[h] = a(d, this[h]);
            this[h] = a(d, this[h], true)
          }
        }
        return c
      }, createBookmarks2: function (a) {
        for (var c =
          [], d = 0; d < this.length; d++)c.push(this[d].createBookmark2(a));
        return c
      }, moveToBookmarks: function (a) {
        for (var c = 0; c < this.length; c++)this[c].moveToBookmark(a[c])
      }
    }
  })();
  (function () {
    function a() {
      return CKEDITOR.getUrl(CKEDITOR.skinName.split(",")[1] || "skins/" + CKEDITOR.skinName.split(",")[0] + "/")
    }

    function d(b) {
      var c = CKEDITOR.skin["ua_" + b], d = CKEDITOR.env;
      if (c)for (var c = c.split(",").sort(function (a, b) {
        return a > b ? -1 : 1
      }), e = 0, f; e < c.length; e++) {
        f = c[e];
        if (d.ie && (f.replace(/^ie/, "") == d.version || d.quirks && f == "iequirks"))f = "ie";
        if (d[f]) {
          b = b + ("_" + c[e]);
          break
        }
      }
      return CKEDITOR.getUrl(a() + b + ".css")
    }

    function b(a, b) {
      if (!f[a]) {
        CKEDITOR.document.appendStyleSheet(d(a));
        f[a] = 1
      }
      b && b()
    }

    function c(a) {
      var b = a.getById(h);
      if (!b) {
        b = a.getHead().append("style");
        b.setAttribute("id", h);
        b.setAttribute("type", "text/css")
      }
      return b
    }

    function e(a, b, c) {
      var d, e, g;
      if (CKEDITOR.env.webkit) {
        b = b.split("}").slice(0, -1);
        for (e = 0; e < b.length; e++)b[e] = b[e].split("{")
      }
      for (var f = 0; f < a.length; f++)if (CKEDITOR.env.webkit)for (e = 0; e < b.length; e++) {
        g = b[e][1];
        for (d = 0; d < c.length; d++)g = g.replace(c[d][0], c[d][1]);
        a[f].$.sheet.addRule(b[e][0], g)
      } else {
        g = b;
        for (d = 0; d < c.length; d++)g = g.replace(c[d][0], c[d][1]);
        CKEDITOR.env.ie &&
        CKEDITOR.env.version < 11 ? a[f].$.styleSheet.cssText = a[f].$.styleSheet.cssText + g : a[f].$.innerHTML = a[f].$.innerHTML + g
      }
    }

    var f = {};
    CKEDITOR.skin = {
      path: a, loadPart: function (c, d) {
        CKEDITOR.skin.name != CKEDITOR.skinName.split(",")[0] ? CKEDITOR.scriptLoader.load(CKEDITOR.getUrl(a() + "skin.js"), function () {
          b(c, d)
        }) : b(c, d)
      }, getPath: function (a) {
        return CKEDITOR.getUrl(d(a))
      }, icons: {}, addIcon: function (a, b, c, d) {
        a = a.toLowerCase();
        this.icons[a] || (this.icons[a] = {path: b, offset: c || 0, bgsize: d || "16px"})
      }, getIconStyle: function (a,
                                 b, c, d, e) {
        var f;
        if (a) {
          a = a.toLowerCase();
          b && (f = this.icons[a + "-rtl"]);
          f || (f = this.icons[a])
        }
        a = c || f && f.path || "";
        d = d || f && f.offset;
        e = e || f && f.bgsize || "16px";
        return a && "background-image:url(" + CKEDITOR.getUrl(a) + ");background-position:0 " + d + "px;background-size:" + e + ";"
      }
    };
    CKEDITOR.tools.extend(CKEDITOR.editor.prototype, {
      getUiColor: function () {
        return this.uiColor
      }, setUiColor: function (a) {
        var b = c(CKEDITOR.document);
        return (this.setUiColor = function (a) {
          var c = CKEDITOR.skin.chameleon, d = [[j, a]];
          this.uiColor = a;
          e([b], c(this,
            "editor"), d);
          e(n, c(this, "panel"), d)
        }).call(this, a)
      }
    });
    var h = "cke_ui_color", n = [], j = /\$color/g;
    CKEDITOR.on("instanceLoaded", function (a) {
      if (!CKEDITOR.env.ie || !CKEDITOR.env.quirks) {
        var b = a.editor, a = function (a) {
          a = (a.data[0] || a.data).element.getElementsByTag("iframe").getItem(0).getFrameDocument();
          if (!a.getById("cke_ui_color")) {
            a = c(a);
            n.push(a);
            var d = b.getUiColor();
            d && e([a], CKEDITOR.skin.chameleon(b, "panel"), [[j, d]])
          }
        };
        b.on("panelShow", a);
        b.on("menuShow", a);
        b.config.uiColor && b.setUiColor(b.config.uiColor)
      }
    })
  })();
  (function () {
    if (CKEDITOR.env.webkit)CKEDITOR.env.hc = false; else {
      var a = CKEDITOR.dom.element.createFromHtml('<div style="width:0px;height:0px;position:absolute;left:-10000px;border: 1px solid;border-color: red blue;"></div>', CKEDITOR.document);
      a.appendTo(CKEDITOR.document.getHead());
      try {
        CKEDITOR.env.hc = a.getComputedStyle("border-top-color") == a.getComputedStyle("border-right-color")
      } catch (d) {
        CKEDITOR.env.hc = false
      }
      a.remove()
    }
    if (CKEDITOR.env.hc)CKEDITOR.env.cssClass = CKEDITOR.env.cssClass + " cke_hc";
    CKEDITOR.document.appendStyleText(".cke{visibility:hidden;}");
    CKEDITOR.status = "loaded";
    CKEDITOR.fireOnce("loaded");
    if (a = CKEDITOR._.pending) {
      delete CKEDITOR._.pending;
      for (var b = 0; b < a.length; b++) {
        CKEDITOR.editor.prototype.constructor.apply(a[b][0], a[b][1]);
        CKEDITOR.add(a[b][0])
      }
    }
  })();
  /*
   Copyright (c) 2003-2013, CKSource - Frederico Knabben. All rights reserved.
   For licensing, see LICENSE.md or http://ckeditor.com/license
   */
  CKEDITOR.skin.name = "moono";
  CKEDITOR.skin.ua_editor = "ie,iequirks,ie7,ie8,gecko";
  CKEDITOR.skin.ua_dialog = "ie,iequirks,ie7,ie8,opera";
  CKEDITOR.skin.chameleon = function () {
    var b = function () {
      return function (b, e) {
        for (var a = b.match(/[^#]./g), c = 0; 3 > c; c++) {
          var f = a, h = c, d;
          d = parseInt(a[c], 16);
          d = ("0" + (0 > e ? 0 | d * (1 + e) : 0 | d + (255 - d) * e).toString(16)).slice(-2);
          f[h] = d
        }
        return "#" + a.join("")
      }
    }(), c = function () {
      var b = new CKEDITOR.template("background:#{to};background-image:-webkit-gradient(linear,lefttop,leftbottom,from({from}),to({to}));background-image:-moz-linear-gradient(top,{from},{to});background-image:-webkit-linear-gradient(top,{from},{to});background-image:-o-linear-gradient(top,{from},{to});background-image:-ms-linear-gradient(top,{from},{to});background-image:linear-gradient(top,{from},{to});filter:progid:DXImageTransform.Microsoft.gradient(gradientType=0,startColorstr='{from}',endColorstr='{to}');");
      return function (c,
                       a) {
        return b.output({from: c, to: a})
      }
    }(), f = {
      editor: new CKEDITOR.template("{id}.cke_chrome [border-color:{defaultBorder};] {id} .cke_top [ {defaultGradient}border-bottom-color:{defaultBorder};] {id} .cke_bottom [{defaultGradient}border-top-color:{defaultBorder};] {id} .cke_resizer [border-right-color:{ckeResizer}] {id} .cke_dialog_title [{defaultGradient}border-bottom-color:{defaultBorder};] {id} .cke_dialog_footer [{defaultGradient}outline-color:{defaultBorder};border-top-color:{defaultBorder};] {id} .cke_dialog_tab [{lightGradient}border-color:{defaultBorder};] {id} .cke_dialog_tab:hover [{mediumGradient}] {id} .cke_dialog_contents [border-top-color:{defaultBorder};] {id} .cke_dialog_tab_selected, {id} .cke_dialog_tab_selected:hover [background:{dialogTabSelected};border-bottom-color:{dialogTabSelectedBorder};] {id} .cke_dialog_body [background:{dialogBody};border-color:{defaultBorder};] {id} .cke_toolgroup [{lightGradient}border-color:{defaultBorder};] {id} a.cke_button_off:hover, {id} a.cke_button_off:focus, {id} a.cke_button_off:active [{mediumGradient}] {id} .cke_button_on [{ckeButtonOn}] {id} .cke_toolbar_separator [background-color: {ckeToolbarSeparator};] {id} .cke_combo_button [border-color:{defaultBorder};{lightGradient}] {id} a.cke_combo_button:hover, {id} a.cke_combo_button:focus, {id} .cke_combo_on a.cke_combo_button [border-color:{defaultBorder};{mediumGradient}] {id} .cke_path_item [color:{elementsPathColor};] {id} a.cke_path_item:hover, {id} a.cke_path_item:focus, {id} a.cke_path_item:active [background-color:{elementsPathBg};] {id}.cke_panel [border-color:{defaultBorder};] "),
      panel: new CKEDITOR.template(".cke_panel_grouptitle [{lightGradient}border-color:{defaultBorder};] .cke_menubutton_icon [background-color:{menubuttonIcon};] .cke_menubutton:hover .cke_menubutton_icon, .cke_menubutton:focus .cke_menubutton_icon, .cke_menubutton:active .cke_menubutton_icon [background-color:{menubuttonIconHover};] .cke_menuseparator [background-color:{menubuttonIcon};] a:hover.cke_colorbox, a:focus.cke_colorbox, a:active.cke_colorbox [border-color:{defaultBorder};] a:hover.cke_colorauto, a:hover.cke_colormore, a:focus.cke_colorauto, a:focus.cke_colormore, a:active.cke_colorauto, a:active.cke_colormore [background-color:{ckeColorauto};border-color:{defaultBorder};] ")
    };
    return function (g, e) {
      var a = g.uiColor, a = {
        id: "." + g.id,
        defaultBorder: b(a, -0.1),
        defaultGradient: c(b(a, 0.9), a),
        lightGradient: c(b(a, 1), b(a, 0.7)),
        mediumGradient: c(b(a, 0.8), b(a, 0.5)),
        ckeButtonOn: c(b(a, 0.6), b(a, 0.7)),
        ckeResizer: b(a, -0.4),
        ckeToolbarSeparator: b(a, 0.5),
        ckeColorauto: b(a, 0.8),
        dialogBody: b(a, 0.7),
        dialogTabSelected: c("#FFFFFF", "#FFFFFF"),
        dialogTabSelectedBorder: "#FFF",
        elementsPathColor: b(a, -0.6),
        elementsPathBg: a,
        menubuttonIcon: b(a, 0.5),
        menubuttonIconHover: b(a, 0.3)
      };
      return f[e].output(a).replace(/\[/g,
        "{").replace(/\]/g, "}")
    }
  }();
  CKEDITOR.plugins.add("dialogui", {
    onLoad: function () {
      var i = function (b) {
        this._ || (this._ = {});
        this._["default"] = this._.initValue = b["default"] || "";
        this._.required = b.required || !1;
        for (var a = [this._], d = 1; d < arguments.length; d++)a.push(arguments[d]);
        a.push(!0);
        CKEDITOR.tools.extend.apply(CKEDITOR.tools, a);
        return this._
      }, r = {
        build: function (b, a, d) {
          return new CKEDITOR.ui.dialog.textInput(b, a, d)
        }
      }, l = {
        build: function (b, a, d) {
          return new CKEDITOR.ui.dialog[a.type](b, a, d)
        }
      }, n = {
        isChanged: function () {
          return this.getValue() !=
            this.getInitValue()
        }, reset: function (b) {
          this.setValue(this.getInitValue(), b)
        }, setInitValue: function () {
          this._.initValue = this.getValue()
        }, resetInitValue: function () {
          this._.initValue = this._["default"]
        }, getInitValue: function () {
          return this._.initValue
        }
      }, o = CKEDITOR.tools.extend({}, CKEDITOR.ui.dialog.uiElement.prototype.eventProcessors, {
        onChange: function (b, a) {
          this._.domOnChangeRegistered || (b.on("load", function () {
            this.getInputElement().on("change", function () {
                b.parts.dialog.isVisible() && this.fire("change", {value: this.getValue()})
              },
              this)
          }, this), this._.domOnChangeRegistered = !0);
          this.on("change", a)
        }
      }, !0), s = /^on([A-Z]\w+)/, p = function (b) {
        for (var a in b)(s.test(a) || "title" == a || "type" == a) && delete b[a];
        return b
      };
      CKEDITOR.tools.extend(CKEDITOR.ui.dialog, {
        labeledElement: function (b, a, d, e) {
          if (!(4 > arguments.length)) {
            var c = i.call(this, a);
            c.labelId = CKEDITOR.tools.getNextId() + "_label";
            this._.children = [];
            CKEDITOR.ui.dialog.uiElement.call(this, b, a, d, "div", null, {role: "presentation"}, function () {
              var f = [], d = a.required ? " cke_required" : "";
              "horizontal" !=
              a.labelLayout ? f.push('<label class="cke_dialog_ui_labeled_label' + d + '" ', ' id="' + c.labelId + '"', c.inputId ? ' for="' + c.inputId + '"' : "", (a.labelStyle ? ' style="' + a.labelStyle + '"' : "") + ">", a.label, "</label>", '<div class="cke_dialog_ui_labeled_content"', a.controlStyle ? ' style="' + a.controlStyle + '"' : "", ' role="radiogroup" aria-labelledby="' + c.labelId + '">', e.call(this, b, a), "</div>") : (d = {
                type: "hbox", widths: a.widths, padding: 0, children: [{
                  type: "html", html: '<label class="cke_dialog_ui_labeled_label' + d + '" id="' + c.labelId +
                  '" for="' + c.inputId + '"' + (a.labelStyle ? ' style="' + a.labelStyle + '"' : "") + ">" + CKEDITOR.tools.htmlEncode(a.label) + "</span>"
                }, {
                  type: "html",
                  html: '<span class="cke_dialog_ui_labeled_content"' + (a.controlStyle ? ' style="' + a.controlStyle + '"' : "") + ">" + e.call(this, b, a) + "</span>"
                }]
              }, CKEDITOR.dialog._.uiElementBuilders.hbox.build(b, d, f));
              return f.join("")
            })
          }
        }, textInput: function (b, a, d) {
          if (!(3 > arguments.length)) {
            i.call(this, a);
            var e = this._.inputId = CKEDITOR.tools.getNextId() + "_textInput", c = {
              "class": "cke_dialog_ui_input_" +
              a.type, id: e, type: a.type
            };
            a.validate && (this.validate = a.validate);
            a.maxLength && (c.maxlength = a.maxLength);
            a.size && (c.size = a.size);
            a.inputStyle && (c.style = a.inputStyle);
            var f = this, h = !1;
            b.on("load", function () {
              f.getInputElement().on("keydown", function (a) {
                a.data.getKeystroke() == 13 && (h = true)
              });
              f.getInputElement().on("keyup", function (a) {
                if (a.data.getKeystroke() == 13 && h) {
                  b.getButton("ok") && setTimeout(function () {
                    b.getButton("ok").click()
                  }, 0);
                  h = false
                }
              }, null, null, 1E3)
            });
            CKEDITOR.ui.dialog.labeledElement.call(this,
              b, a, d, function () {
                var b = ['<div class="cke_dialog_ui_input_', a.type, '" role="presentation"'];
                a.width && b.push('style="width:' + a.width + '" ');
                b.push("><input ");
                c["aria-labelledby"] = this._.labelId;
                this._.required && (c["aria-required"] = this._.required);
                for (var d in c)b.push(d + '="' + c[d] + '" ');
                b.push(" /></div>");
                return b.join("")
              })
          }
        }, textarea: function (b, a, d) {
          if (!(3 > arguments.length)) {
            i.call(this, a);
            var e = this, c = this._.inputId = CKEDITOR.tools.getNextId() + "_textarea", f = {};
            a.validate && (this.validate = a.validate);
            f.rows = a.rows || 5;
            f.cols = a.cols || 20;
            f["class"] = "cke_dialog_ui_input_textarea " + (a["class"] || "");
            "undefined" != typeof a.inputStyle && (f.style = a.inputStyle);
            a.dir && (f.dir = a.dir);
            CKEDITOR.ui.dialog.labeledElement.call(this, b, a, d, function () {
              f["aria-labelledby"] = this._.labelId;
              this._.required && (f["aria-required"] = this._.required);
              var a = ['<div class="cke_dialog_ui_input_textarea" role="presentation"><textarea id="', c, '" '], b;
              for (b in f)a.push(b + '="' + CKEDITOR.tools.htmlEncode(f[b]) + '" ');
              a.push(">", CKEDITOR.tools.htmlEncode(e._["default"]),
                "</textarea></div>");
              return a.join("")
            })
          }
        }, checkbox: function (b, a, d) {
          if (!(3 > arguments.length)) {
            var e = i.call(this, a, {"default": !!a["default"]});
            a.validate && (this.validate = a.validate);
            CKEDITOR.ui.dialog.uiElement.call(this, b, a, d, "span", null, null, function () {
              var c = CKEDITOR.tools.extend({}, a, {id: a.id ? a.id + "_checkbox" : CKEDITOR.tools.getNextId() + "_checkbox"}, true), d = [], h = CKEDITOR.tools.getNextId() + "_label", g = {
                "class": "cke_dialog_ui_checkbox_input",
                type: "checkbox",
                "aria-labelledby": h
              };
              p(c);
              if (a["default"])g.checked =
                "checked";
              if (typeof c.inputStyle != "undefined")c.style = c.inputStyle;
              e.checkbox = new CKEDITOR.ui.dialog.uiElement(b, c, d, "input", null, g);
              d.push(' <label id="', h, '" for="', g.id, '"' + (a.labelStyle ? ' style="' + a.labelStyle + '"' : "") + ">", CKEDITOR.tools.htmlEncode(a.label), "</label>");
              return d.join("")
            })
          }
        }, radio: function (b, a, d) {
          if (!(3 > arguments.length)) {
            i.call(this, a);
            this._["default"] || (this._["default"] = this._.initValue = a.items[0][1]);
            a.validate && (this.validate = a.valdiate);
            var e = [], c = this;
            CKEDITOR.ui.dialog.labeledElement.call(this,
              b, a, d, function () {
                for (var d = [], h = [], g = (a.id ? a.id : CKEDITOR.tools.getNextId()) + "_radio", k = 0; k < a.items.length; k++) {
                  var j = a.items[k], i = j[2] !== void 0 ? j[2] : j[0], l = j[1] !== void 0 ? j[1] : j[0], m = CKEDITOR.tools.getNextId() + "_radio_input", n = m + "_label", m = CKEDITOR.tools.extend({}, a, {
                    id: m,
                    title: null,
                    type: null
                  }, true), i = CKEDITOR.tools.extend({}, m, {title: i}, true), o = {
                    type: "radio",
                    "class": "cke_dialog_ui_radio_input",
                    name: g,
                    value: l,
                    "aria-labelledby": n
                  }, q = [];
                  if (c._["default"] == l)o.checked = "checked";
                  p(m);
                  p(i);
                  if (typeof m.inputStyle !=
                    "undefined")m.style = m.inputStyle;
                  m.keyboardFocusable = true;
                  e.push(new CKEDITOR.ui.dialog.uiElement(b, m, q, "input", null, o));
                  q.push(" ");
                  new CKEDITOR.ui.dialog.uiElement(b, i, q, "label", null, {id: n, "for": o.id}, j[0]);
                  d.push(q.join(""))
                }
                new CKEDITOR.ui.dialog.hbox(b, e, d, h);
                return h.join("")
              });
            this._.children = e
          }
        }, button: function (b, a, d) {
          if (arguments.length) {
            "function" == typeof a && (a = a(b.getParentEditor()));
            i.call(this, a, {disabled: a.disabled || !1});
            CKEDITOR.event.implementOn(this);
            var e = this;
            b.on("load", function () {
              var a =
                this.getElement();
              (function () {
                a.on("click", function (a) {
                  e.click();
                  a.data.preventDefault()
                });
                a.on("keydown", function (a) {
                  a.data.getKeystroke()in{32: 1} && (e.click(), a.data.preventDefault())
                })
              })();
              a.unselectable()
            }, this);
            var c = CKEDITOR.tools.extend({}, a);
            delete c.style;
            var f = CKEDITOR.tools.getNextId() + "_label";
            CKEDITOR.ui.dialog.uiElement.call(this, b, c, d, "a", null, {
              style: a.style,
              href: "javascript:void(0)",
              title: a.label,
              hidefocus: "true",
              "class": a["class"],
              role: "button",
              "aria-labelledby": f
            }, '<span id="' + f +
              '" class="cke_dialog_ui_button">' + CKEDITOR.tools.htmlEncode(a.label) + "</span>")
          }
        }, select: function (b, a, d) {
          if (!(3 > arguments.length)) {
            var e = i.call(this, a);
            a.validate && (this.validate = a.validate);
            e.inputId = CKEDITOR.tools.getNextId() + "_select";
            CKEDITOR.ui.dialog.labeledElement.call(this, b, a, d, function () {
              var c = CKEDITOR.tools.extend({}, a, {id: a.id ? a.id + "_select" : CKEDITOR.tools.getNextId() + "_select"}, true), d = [], h = [], g = {
                id: e.inputId,
                "class": "cke_dialog_ui_input_select",
                "aria-labelledby": this._.labelId
              };
              d.push('<div class="cke_dialog_ui_input_',
                a.type, '" role="presentation"');
              a.width && d.push('style="width:' + a.width + '" ');
              d.push(">");
              if (a.size != void 0)g.size = a.size;
              if (a.multiple != void 0)g.multiple = a.multiple;
              p(c);
              for (var k = 0, j; k < a.items.length && (j = a.items[k]); k++)h.push('<option value="', CKEDITOR.tools.htmlEncode(j[1] !== void 0 ? j[1] : j[0]).replace(/"/g, "&quot;"), '" /> ', CKEDITOR.tools.htmlEncode(j[0]));
              if (typeof c.inputStyle != "undefined")c.style = c.inputStyle;
              e.select = new CKEDITOR.ui.dialog.uiElement(b, c, d, "select", null, g, h.join(""));
              d.push("</div>");
              return d.join("")
            })
          }
        }, file: function (b, a, d) {
          if (!(3 > arguments.length)) {
            void 0 === a["default"] && (a["default"] = "");
            var e = CKEDITOR.tools.extend(i.call(this, a), {definition: a, buttons: []});
            a.validate && (this.validate = a.validate);
            b.on("load", function () {
              CKEDITOR.document.getById(e.frameId).getParent().addClass("cke_dialog_ui_input_file")
            });
            CKEDITOR.ui.dialog.labeledElement.call(this, b, a, d, function () {
              e.frameId = CKEDITOR.tools.getNextId() + "_fileInput";
              var b = ['<iframe frameborder="0" allowtransparency="0" class="cke_dialog_ui_input_file" role="presentation" id="',
                e.frameId, '" title="', a.label, '" src="javascript:void('];
              b.push(CKEDITOR.env.ie ? "(function(){" + encodeURIComponent("document.open();(" + CKEDITOR.tools.fixDomain + ")();document.close();") + "})()" : "0");
              b.push(')"></iframe>');
              return b.join("")
            })
          }
        }, fileButton: function (b, a, d) {
          if (!(3 > arguments.length)) {
            i.call(this, a);
            var e = this;
            a.validate && (this.validate = a.validate);
            var c = CKEDITOR.tools.extend({}, a), f = c.onClick;
            c.className = (c.className ? c.className + " " : "") + "cke_dialog_ui_button";
            c.onClick = function (c) {
              var d =
                a["for"];
              if (!f || f.call(this, c) !== false) {
                b.getContentElement(d[0], d[1]).submit();
                this.disable()
              }
            };
            b.on("load", function () {
              b.getContentElement(a["for"][0], a["for"][1])._.buttons.push(e)
            });
            CKEDITOR.ui.dialog.button.call(this, b, c, d)
          }
        }, html: function () {
          var b = /^\s*<[\w:]+\s+([^>]*)?>/, a = /^(\s*<[\w:]+(?:\s+[^>]*)?)((?:.|\r|\n)+)$/, d = /\/$/;
          return function (e, c, f) {
            if (!(3 > arguments.length)) {
              var h = [], g = c.html;
              "<" != g.charAt(0) && (g = "<span>" + g + "</span>");
              var k = c.focus;
              if (k) {
                var j = this.focus;
                this.focus = function () {
                  ("function" == typeof k ? k : j).call(this);
                  this.fire("focus")
                };
                c.isFocusable && (this.isFocusable = this.isFocusable);
                this.keyboardFocusable = !0
              }
              CKEDITOR.ui.dialog.uiElement.call(this, e, c, h, "span", null, null, "");
              h = h.join("").match(b);
              g = g.match(a) || ["", "", ""];
              d.test(g[1]) && (g[1] = g[1].slice(0, -1), g[2] = "/" + g[2]);
              f.push([g[1], " ", h[1] || "", g[2]].join(""))
            }
          }
        }(), fieldset: function (b, a, d, e, c) {
          var f = c.label;
          this._ = {children: a};
          CKEDITOR.ui.dialog.uiElement.call(this, b, c, e, "fieldset", null, null, function () {
            var a = [];
            f && a.push("<legend" +
              (c.labelStyle ? ' style="' + c.labelStyle + '"' : "") + ">" + f + "</legend>");
            for (var b = 0; b < d.length; b++)a.push(d[b]);
            return a.join("")
          })
        }
      }, !0);
      CKEDITOR.ui.dialog.html.prototype = new CKEDITOR.ui.dialog.uiElement;
      CKEDITOR.ui.dialog.labeledElement.prototype = CKEDITOR.tools.extend(new CKEDITOR.ui.dialog.uiElement, {
        setLabel: function (b) {
          var a = CKEDITOR.document.getById(this._.labelId);
          1 > a.getChildCount() ? (new CKEDITOR.dom.text(b, CKEDITOR.document)).appendTo(a) : a.getChild(0).$.nodeValue = b;
          return this
        }, getLabel: function () {
          var b =
            CKEDITOR.document.getById(this._.labelId);
          return !b || 1 > b.getChildCount() ? "" : b.getChild(0).getText()
        }, eventProcessors: o
      }, !0);
      CKEDITOR.ui.dialog.button.prototype = CKEDITOR.tools.extend(new CKEDITOR.ui.dialog.uiElement, {
        click: function () {
          return !this._.disabled ? this.fire("click", {dialog: this._.dialog}) : !1
        },
        enable: function () {
          this._.disabled = !1;
          var b = this.getElement();
          b && b.removeClass("cke_disabled")
        },
        disable: function () {
          this._.disabled = !0;
          this.getElement().addClass("cke_disabled")
        },
        isVisible: function () {
          return this.getElement().getFirst().isVisible()
        },
        isEnabled: function () {
          return !this._.disabled
        },
        eventProcessors: CKEDITOR.tools.extend({}, CKEDITOR.ui.dialog.uiElement.prototype.eventProcessors, {
          onClick: function (b, a) {
            this.on("click", function () {
              a.apply(this, arguments)
            })
          }
        }, !0),
        accessKeyUp: function () {
          this.click()
        },
        accessKeyDown: function () {
          this.focus()
        },
        keyboardFocusable: !0
      }, !0);
      CKEDITOR.ui.dialog.textInput.prototype = CKEDITOR.tools.extend(new CKEDITOR.ui.dialog.labeledElement, {
        getInputElement: function () {
          return CKEDITOR.document.getById(this._.inputId)
        },
        focus: function () {
          var b = this.selectParentTab();
          setTimeout(function () {
            var a = b.getInputElement();
            a && a.$.focus()
          }, 0)
        }, select: function () {
          var b = this.selectParentTab();
          setTimeout(function () {
            var a = b.getInputElement();
            a && (a.$.focus(), a.$.select())
          }, 0)
        }, accessKeyUp: function () {
          this.select()
        }, setValue: function (b) {
          !b && (b = "");
          return CKEDITOR.ui.dialog.uiElement.prototype.setValue.apply(this, arguments)
        }, keyboardFocusable: !0
      }, n, !0);
      CKEDITOR.ui.dialog.textarea.prototype = new CKEDITOR.ui.dialog.textInput;
      CKEDITOR.ui.dialog.select.prototype =
        CKEDITOR.tools.extend(new CKEDITOR.ui.dialog.labeledElement, {
          getInputElement: function () {
            return this._.select.getElement()
          }, add: function (b, a, d) {
            var e = new CKEDITOR.dom.element("option", this.getDialog().getParentEditor().document), c = this.getInputElement().$;
            e.$.text = b;
            e.$.value = void 0 === a || null === a ? b : a;
            void 0 === d || null === d ? CKEDITOR.env.ie ? c.add(e.$) : c.add(e.$, null) : c.add(e.$, d);
            return this
          }, remove: function (b) {
            this.getInputElement().$.remove(b);
            return this
          }, clear: function () {
            for (var b = this.getInputElement().$; 0 <
            b.length;)b.remove(0);
            return this
          }, keyboardFocusable: !0
        }, n, !0);
      CKEDITOR.ui.dialog.checkbox.prototype = CKEDITOR.tools.extend(new CKEDITOR.ui.dialog.uiElement, {
        getInputElement: function () {
          return this._.checkbox.getElement()
        }, setValue: function (b, a) {
          this.getInputElement().$.checked = b;
          !a && this.fire("change", {value: b})
        }, getValue: function () {
          return this.getInputElement().$.checked
        }, accessKeyUp: function () {
          this.setValue(!this.getValue())
        }, eventProcessors: {
          onChange: function (b, a) {
            if (!CKEDITOR.env.ie || 8 < CKEDITOR.env.version)return o.onChange.apply(this,
              arguments);
            b.on("load", function () {
              var a = this._.checkbox.getElement();
              a.on("propertychange", function (b) {
                b = b.data.$;
                "checked" == b.propertyName && this.fire("change", {value: a.$.checked})
              }, this)
            }, this);
            this.on("change", a);
            return null
          }
        }, keyboardFocusable: !0
      }, n, !0);
      CKEDITOR.ui.dialog.radio.prototype = CKEDITOR.tools.extend(new CKEDITOR.ui.dialog.uiElement, {
        setValue: function (b, a) {
          for (var d = this._.children, e, c = 0; c < d.length && (e = d[c]); c++)e.getElement().$.checked = e.getValue() == b;
          !a && this.fire("change", {value: b})
        },
        getValue: function () {
          for (var b = this._.children, a = 0; a < b.length; a++)if (b[a].getElement().$.checked)return b[a].getValue();
          return null
        }, accessKeyUp: function () {
          var b = this._.children, a;
          for (a = 0; a < b.length; a++)if (b[a].getElement().$.checked) {
            b[a].getElement().focus();
            return
          }
          b[0].getElement().focus()
        }, eventProcessors: {
          onChange: function (b, a) {
            if (CKEDITOR.env.ie)b.on("load", function () {
              for (var a = this._.children, b = this, c = 0; c < a.length; c++)a[c].getElement().on("propertychange", function (a) {
                a = a.data.$;
                "checked" == a.propertyName &&
                this.$.checked && b.fire("change", {value: this.getAttribute("value")})
              })
            }, this), this.on("change", a); else return o.onChange.apply(this, arguments);
            return null
          }
        }
      }, n, !0);
      CKEDITOR.ui.dialog.file.prototype = CKEDITOR.tools.extend(new CKEDITOR.ui.dialog.labeledElement, n, {
        getInputElement: function () {
          var b = CKEDITOR.document.getById(this._.frameId).getFrameDocument();
          return 0 < b.$.forms.length ? new CKEDITOR.dom.element(b.$.forms[0].elements[0]) : this.getElement()
        }, submit: function () {
          this.getInputElement().getParent().$.submit();
          return this
        }, getAction: function () {
          return this.getInputElement().getParent().$.action
        }, registerEvents: function (b) {
          var a = /^on([A-Z]\w+)/, d, e = function (a, b, c, d) {
            a.on("formLoaded", function () {
              a.getInputElement().on(c, d, a)
            })
          }, c;
          for (c in b)if (d = c.match(a))this.eventProcessors[c] ? this.eventProcessors[c].call(this, this._.dialog, b[c]) : e(this, this._.dialog, d[1].toLowerCase(), b[c]);
          return this
        }, reset: function () {
          function b() {
            d.$.open();
            var b = "";
            e.size && (b = e.size - (CKEDITOR.env.ie ? 7 : 0));
            var i = a.frameId + "_input";
            d.$.write(['<html dir="' + g + '" lang="' + k + '"><head><title></title></head><body style="margin: 0; overflow: hidden; background: transparent;">', '<form enctype="multipart/form-data" method="POST" dir="' + g + '" lang="' + k + '" action="', CKEDITOR.tools.htmlEncode(e.action), '"><label id="', a.labelId, '" for="', i, '" style="display:none">', CKEDITOR.tools.htmlEncode(e.label), '</label><input id="', i, '" aria-labelledby="', a.labelId, '" type="file" name="', CKEDITOR.tools.htmlEncode(e.id || "cke_upload"), '" size="', CKEDITOR.tools.htmlEncode(0 <
            b ? b : ""), '" /></form></body></html><script>', CKEDITOR.env.ie ? "(" + CKEDITOR.tools.fixDomain + ")();" : "", "window.parent.CKEDITOR.tools.callFunction(" + f + ");", "window.onbeforeunload = function() {window.parent.CKEDITOR.tools.callFunction(" + h + ")}", "<\/script>"].join(""));
            d.$.close();
            for (b = 0; b < c.length; b++)c[b].enable()
          }

          var a = this._, d = CKEDITOR.document.getById(a.frameId).getFrameDocument(), e = a.definition, c = a.buttons, f = this.formLoadedNumber, h = this.formUnloadNumber, g = a.dialog._.editor.lang.dir, k = a.dialog._.editor.langCode;
          f || (f = this.formLoadedNumber = CKEDITOR.tools.addFunction(function () {
            this.fire("formLoaded")
          }, this), h = this.formUnloadNumber = CKEDITOR.tools.addFunction(function () {
            this.getInputElement().clearCustomData()
          }, this), this.getDialog()._.editor.on("destroy", function () {
            CKEDITOR.tools.removeFunction(f);
            CKEDITOR.tools.removeFunction(h)
          }));
          CKEDITOR.env.gecko ? setTimeout(b, 500) : b()
        }, getValue: function () {
          return this.getInputElement().$.value || ""
        }, setInitValue: function () {
          this._.initValue = ""
        }, eventProcessors: {
          onChange: function (b,
                              a) {
            this._.domOnChangeRegistered || (this.on("formLoaded", function () {
              this.getInputElement().on("change", function () {
                this.fire("change", {value: this.getValue()})
              }, this)
            }, this), this._.domOnChangeRegistered = !0);
            this.on("change", a)
          }
        }, keyboardFocusable: !0
      }, !0);
      CKEDITOR.ui.dialog.fileButton.prototype = new CKEDITOR.ui.dialog.button;
      CKEDITOR.ui.dialog.fieldset.prototype = CKEDITOR.tools.clone(CKEDITOR.ui.dialog.hbox.prototype);
      CKEDITOR.dialog.addUIElement("text", r);
      CKEDITOR.dialog.addUIElement("password", r);
      CKEDITOR.dialog.addUIElement("textarea",
        l);
      CKEDITOR.dialog.addUIElement("checkbox", l);
      CKEDITOR.dialog.addUIElement("radio", l);
      CKEDITOR.dialog.addUIElement("button", l);
      CKEDITOR.dialog.addUIElement("select", l);
      CKEDITOR.dialog.addUIElement("file", l);
      CKEDITOR.dialog.addUIElement("fileButton", l);
      CKEDITOR.dialog.addUIElement("html", l);
      CKEDITOR.dialog.addUIElement("fieldset", {
        build: function (b, a, d) {
          for (var e = a.children, c, f = [], h = [], g = 0; g < e.length && (c = e[g]); g++) {
            var i = [];
            f.push(i);
            h.push(CKEDITOR.dialog._.uiElementBuilders[c.type].build(b, c, i))
          }
          return new CKEDITOR.ui.dialog[a.type](b,
            h, f, d, a)
        }
      })
    }
  });
  CKEDITOR.DIALOG_RESIZE_NONE = 0;
  CKEDITOR.DIALOG_RESIZE_WIDTH = 1;
  CKEDITOR.DIALOG_RESIZE_HEIGHT = 2;
  CKEDITOR.DIALOG_RESIZE_BOTH = 3;
  (function () {
    function t() {
      for (var a = this._.tabIdList.length, b = CKEDITOR.tools.indexOf(this._.tabIdList, this._.currentTabId) + a, c = b - 1; c > b - a; c--)if (this._.tabs[this._.tabIdList[c % a]][0].$.offsetHeight)return this._.tabIdList[c % a];
      return null
    }

    function u() {
      for (var a = this._.tabIdList.length, b = CKEDITOR.tools.indexOf(this._.tabIdList, this._.currentTabId), c = b + 1; c < b + a; c++)if (this._.tabs[this._.tabIdList[c % a]][0].$.offsetHeight)return this._.tabIdList[c % a];
      return null
    }

    function G(a, b) {
      for (var c = a.$.getElementsByTagName("input"),
             e = 0, d = c.length; e < d; e++) {
        var g = new CKEDITOR.dom.element(c[e]);
        "text" == g.getAttribute("type").toLowerCase() && (b ? (g.setAttribute("value", g.getCustomData("fake_value") || ""), g.removeCustomData("fake_value")) : (g.setCustomData("fake_value", g.getAttribute("value")), g.setAttribute("value", "")))
      }
    }

    function P(a, b) {
      var c = this.getInputElement();
      c && (a ? c.removeAttribute("aria-invalid") : c.setAttribute("aria-invalid", !0));
      a || (this.select ? this.select() : this.focus());
      b && alert(b);
      this.fire("validated", {valid: a, msg: b})
    }

    function Q() {
      var a = this.getInputElement();
      a && a.removeAttribute("aria-invalid")
    }

    function R(a) {
      var a = CKEDITOR.dom.element.createFromHtml(CKEDITOR.addTemplate("dialog", S).output({
        id: CKEDITOR.tools.getNextNumber(),
        editorId: a.id,
        langDir: a.lang.dir,
        langCode: a.langCode,
        editorDialogClass: "cke_editor_" + a.name.replace(/\./g, "\\.") + "_dialog",
        closeTitle: a.lang.common.close,
        hidpi: CKEDITOR.env.hidpi ? "cke_hidpi" : ""
      })), b = a.getChild([0, 0, 0, 0, 0]), c = b.getChild(0), e = b.getChild(1);
      if (CKEDITOR.env.ie && !CKEDITOR.env.ie6Compat) {
        var d =
          "javascript:void(function(){" + encodeURIComponent("document.open();(" + CKEDITOR.tools.fixDomain + ")();document.close();") + "}())";
        CKEDITOR.dom.element.createFromHtml('<iframe frameBorder="0" class="cke_iframe_shim" src="' + d + '" tabIndex="-1"></iframe>').appendTo(b.getParent())
      }
      c.unselectable();
      e.unselectable();
      return {
        element: a,
        parts: {
          dialog: a.getChild(0),
          title: c,
          close: e,
          tabs: b.getChild(2),
          contents: b.getChild([3, 0, 0, 0]),
          footer: b.getChild([3, 0, 1, 0])
        }
      }
    }

    function H(a, b, c) {
      this.element = b;
      this.focusIndex = c;
      this.tabIndex =
        0;
      this.isFocusable = function () {
        return !b.getAttribute("disabled") && b.isVisible()
      };
      this.focus = function () {
        a._.currentFocusIndex = this.focusIndex;
        this.element.focus()
      };
      b.on("keydown", function (a) {
        a.data.getKeystroke()in{32: 1, 13: 1} && this.fire("click")
      });
      b.on("focus", function () {
        this.fire("mouseover")
      });
      b.on("blur", function () {
        this.fire("mouseout")
      })
    }

    function T(a) {
      function b() {
        a.layout()
      }

      var c = CKEDITOR.document.getWindow();
      c.on("resize", b);
      a.on("hide", function () {
        c.removeListener("resize", b)
      })
    }

    function I(a, b) {
      this._ =
      {dialog: a};
      CKEDITOR.tools.extend(this, b)
    }

    function U(a) {
      function b(b) {
        var c = a.getSize(), h = CKEDITOR.document.getWindow().getViewPaneSize(), o = b.data.$.screenX, j = b.data.$.screenY, n = o - e.x, m = j - e.y;
        e = {x: o, y: j};
        d.x += n;
        d.y += m;
        a.move(d.x + i[3] < f ? -i[3] : d.x - i[1] > h.width - c.width - f ? h.width - c.width + ("rtl" == g.lang.dir ? 0 : i[1]) : d.x, d.y + i[0] < f ? -i[0] : d.y - i[2] > h.height - c.height - f ? h.height - c.height + i[2] : d.y, 1);
        b.data.preventDefault()
      }

      function c() {
        CKEDITOR.document.removeListener("mousemove", b);
        CKEDITOR.document.removeListener("mouseup",
          c);
        if (CKEDITOR.env.ie6Compat) {
          var a = q.getChild(0).getFrameDocument();
          a.removeListener("mousemove", b);
          a.removeListener("mouseup", c)
        }
      }

      var e = null, d = null;
      a.getElement().getFirst();
      var g = a.getParentEditor(), f = g.config.dialog_magnetDistance, i = CKEDITOR.skin.margins || [0, 0, 0, 0];
      "undefined" == typeof f && (f = 20);
      a.parts.title.on("mousedown", function (f) {
        e = {x: f.data.$.screenX, y: f.data.$.screenY};
        CKEDITOR.document.on("mousemove", b);
        CKEDITOR.document.on("mouseup", c);
        d = a.getPosition();
        if (CKEDITOR.env.ie6Compat) {
          var k =
            q.getChild(0).getFrameDocument();
          k.on("mousemove", b);
          k.on("mouseup", c)
        }
        f.data.preventDefault()
      }, a)
    }

    function V(a) {
      var b, c;

      function e(d) {
        var e = "rtl" == i.lang.dir, j = o.width, C = o.height, D = j + (d.data.$.screenX - b) * (e ? -1 : 1) * (a._.moved ? 1 : 2), n = C + (d.data.$.screenY - c) * (a._.moved ? 1 : 2), x = a._.element.getFirst(), x = e && x.getComputedStyle("right"), y = a.getPosition();
        y.y + n > h.height && (n = h.height - y.y);
        if ((e ? x : y.x) + D > h.width)D = h.width - (e ? x : y.x);
        if (f == CKEDITOR.DIALOG_RESIZE_WIDTH || f == CKEDITOR.DIALOG_RESIZE_BOTH)j = Math.max(g.minWidth ||
          0, D - l);
        if (f == CKEDITOR.DIALOG_RESIZE_HEIGHT || f == CKEDITOR.DIALOG_RESIZE_BOTH)C = Math.max(g.minHeight || 0, n - k);
        a.resize(j, C);
        a._.moved || a.layout();
        d.data.preventDefault()
      }

      function d() {
        CKEDITOR.document.removeListener("mouseup", d);
        CKEDITOR.document.removeListener("mousemove", e);
        j && (j.remove(), j = null);
        if (CKEDITOR.env.ie6Compat) {
          var a = q.getChild(0).getFrameDocument();
          a.removeListener("mouseup", d);
          a.removeListener("mousemove", e)
        }
      }

      var g = a.definition, f = g.resizable;
      if (f != CKEDITOR.DIALOG_RESIZE_NONE) {
        var i = a.getParentEditor(),
          l, k, h, o, j, n = CKEDITOR.tools.addFunction(function (f) {
            o = a.getSize();
            var g = a.parts.contents;
            g.$.getElementsByTagName("iframe").length && (j = CKEDITOR.dom.element.createFromHtml('<div class="cke_dialog_resize_cover" style="height: 100%; position: absolute; width: 100%;"></div>'), g.append(j));
            k = o.height - a.parts.contents.getSize("height", !(CKEDITOR.env.gecko || CKEDITOR.env.opera || CKEDITOR.env.ie && CKEDITOR.env.quirks));
            l = o.width - a.parts.contents.getSize("width", 1);
            b = f.screenX;
            c = f.screenY;
            h = CKEDITOR.document.getWindow().getViewPaneSize();
            CKEDITOR.document.on("mousemove", e);
            CKEDITOR.document.on("mouseup", d);
            CKEDITOR.env.ie6Compat && (g = q.getChild(0).getFrameDocument(), g.on("mousemove", e), g.on("mouseup", d));
            f.preventDefault && f.preventDefault()
          });
        a.on("load", function () {
          var b = "";
          f == CKEDITOR.DIALOG_RESIZE_WIDTH ? b = " cke_resizer_horizontal" : f == CKEDITOR.DIALOG_RESIZE_HEIGHT && (b = " cke_resizer_vertical");
          b = CKEDITOR.dom.element.createFromHtml('<div class="cke_resizer' + b + " cke_resizer_" + i.lang.dir + '" title="' + CKEDITOR.tools.htmlEncode(i.lang.common.resize) +
            '" onmousedown="CKEDITOR.tools.callFunction(' + n + ', event )">' + ("ltr" == i.lang.dir ? "◢" : "◣") + "</div>");
          a.parts.footer.append(b, 1)
        });
        i.on("destroy", function () {
          CKEDITOR.tools.removeFunction(n)
        })
      }
    }

    function E(a) {
      a.data.preventDefault(1)
    }

    function J(a) {
      var b = CKEDITOR.document.getWindow(), c = a.config, e = c.dialog_backgroundCoverColor || "white", d = c.dialog_backgroundCoverOpacity, g = c.baseFloatZIndex, c = CKEDITOR.tools.genKey(e, d, g), f = w[c];
      f ? f.show() : (g = ['<div tabIndex="-1" style="position: ', CKEDITOR.env.ie6Compat ?
        "absolute" : "fixed", "; z-index: ", g, "; top: 0px; left: 0px; ", !CKEDITOR.env.ie6Compat ? "background-color: " + e : "", '" class="cke_dialog_background_cover">'], CKEDITOR.env.ie6Compat && (e = "<html><body style=\\'background-color:" + e + ";\\'></body></html>", g.push('<iframe hidefocus="true" frameborder="0" id="cke_dialog_background_iframe" src="javascript:'), g.push("void((function(){" + encodeURIComponent("document.open();(" + CKEDITOR.tools.fixDomain + ")();document.write( '" + e + "' );document.close();") + "})())"), g.push('" style="position:absolute;left:0;top:0;width:100%;height: 100%;filter: progid:DXImageTransform.Microsoft.Alpha(opacity=0)"></iframe>')),
        g.push("</div>"), f = CKEDITOR.dom.element.createFromHtml(g.join("")), f.setOpacity(void 0 != d ? d : 0.5), f.on("keydown", E), f.on("keypress", E), f.on("keyup", E), f.appendTo(CKEDITOR.document.getBody()), w[c] = f);
      a.focusManager.add(f);
      q = f;
      var a = function () {
        var a = b.getViewPaneSize();
        f.setStyles({width: a.width + "px", height: a.height + "px"})
      }, i = function () {
        var a = b.getScrollPosition(), c = CKEDITOR.dialog._.currentTop;
        f.setStyles({left: a.x + "px", top: a.y + "px"});
        if (c) {
          do {
            a = c.getPosition();
            c.move(a.x, a.y)
          } while (c = c._.parentDialog)
        }
      };
      F = a;
      b.on("resize", a);
      a();
      (!CKEDITOR.env.mac || !CKEDITOR.env.webkit) && f.focus();
      if (CKEDITOR.env.ie6Compat) {
        var l = function () {
          i();
          arguments.callee.prevScrollHandler.apply(this, arguments)
        };
        b.$.setTimeout(function () {
          l.prevScrollHandler = window.onscroll || function () {
            };
          window.onscroll = l
        }, 0);
        i()
      }
    }

    function K(a) {
      q && (a.focusManager.remove(q), a = CKEDITOR.document.getWindow(), q.hide(), a.removeListener("resize", F), CKEDITOR.env.ie6Compat && a.$.setTimeout(function () {
        window.onscroll = window.onscroll && window.onscroll.prevScrollHandler ||
          null
      }, 0), F = null)
    }

    var r = CKEDITOR.tools.cssLength, S = '<div class="cke_reset_all {editorId} {editorDialogClass} {hidpi}" dir="{langDir}" lang="{langCode}" role="dialog" aria-labelledby="cke_dialog_title_{id}"><table class="cke_dialog ' + CKEDITOR.env.cssClass + ' cke_{langDir}" style="position:absolute" role="presentation"><tr><td role="presentation"><div class="cke_dialog_body" role="presentation"><div id="cke_dialog_title_{id}" class="cke_dialog_title" role="presentation"></div><a id="cke_dialog_close_button_{id}" class="cke_dialog_close_button" href="javascript:void(0)" title="{closeTitle}" role="button"><span class="cke_label">X</span></a><div id="cke_dialog_tabs_{id}" class="cke_dialog_tabs" role="tablist"></div><table class="cke_dialog_contents" role="presentation"><tr><td id="cke_dialog_contents_{id}" class="cke_dialog_contents_body" role="presentation"></td></tr><tr><td id="cke_dialog_footer_{id}" class="cke_dialog_footer" role="presentation"></td></tr></table></div></td></tr></table></div>';
    CKEDITOR.dialog = function (a, b) {
      function c() {
        var a = m._.focusList;
        a.sort(function (a, b) {
          return a.tabIndex != b.tabIndex ? b.tabIndex - a.tabIndex : a.focusIndex - b.focusIndex
        });
        for (var b = a.length, c = 0; c < b; c++)a[c].focusIndex = c
      }

      function e(a) {
        var b = m._.focusList, a = a || 0;
        if (!(1 > b.length)) {
          var c = m._.currentFocusIndex;
          try {
            b[c].getInputElement().$.blur()
          } catch (f) {
          }
          for (var d = c = (c + a + b.length) % b.length; a && !b[d].isFocusable() && !(d = (d + a + b.length) % b.length, d == c););
          b[d].focus();
          "text" == b[d].type && b[d].select()
        }
      }

      function d(b) {
        if (m ==
          CKEDITOR.dialog._.currentTop) {
          var c = b.data.getKeystroke(), d = "rtl" == a.lang.dir;
          o = j = 0;
          if (9 == c || c == CKEDITOR.SHIFT + 9)c = c == CKEDITOR.SHIFT + 9, m._.tabBarMode ? (c = c ? t.call(m) : u.call(m), m.selectPage(c), m._.tabs[c][0].focus()) : e(c ? -1 : 1), o = 1; else if (c == CKEDITOR.ALT + 121 && !m._.tabBarMode && 1 < m.getPageCount())m._.tabBarMode = !0, m._.tabs[m._.currentTabId][0].focus(), o = 1; else if ((37 == c || 39 == c) && m._.tabBarMode)c = c == (d ? 39 : 37) ? t.call(m) : u.call(m), m.selectPage(c), m._.tabs[c][0].focus(), o = 1; else if ((13 == c || 32 == c) && m._.tabBarMode)this.selectPage(this._.currentTabId),
            this._.tabBarMode = !1, this._.currentFocusIndex = -1, e(1), o = 1; else if (13 == c) {
            c = b.data.getTarget();
            if (!c.is("a", "button", "select", "textarea") && (!c.is("input") || "button" != c.$.type))(c = this.getButton("ok")) && CKEDITOR.tools.setTimeout(c.click, 0, c), o = 1;
            j = 1
          } else if (27 == c)(c = this.getButton("cancel")) ? CKEDITOR.tools.setTimeout(c.click, 0, c) : !1 !== this.fire("cancel", {hide: !0}).hide && this.hide(), j = 1; else return;
          g(b)
        }
      }

      function g(a) {
        o ? a.data.preventDefault(1) : j && a.data.stopPropagation()
      }

      var f = CKEDITOR.dialog._.dialogDefinitions[b],
        i = CKEDITOR.tools.clone(W), l = a.config.dialog_buttonsOrder || "OS", k = a.lang.dir, h = {}, o, j;
      ("OS" == l && CKEDITOR.env.mac || "rtl" == l && "ltr" == k || "ltr" == l && "rtl" == k) && i.buttons.reverse();
      f = CKEDITOR.tools.extend(f(a), i);
      f = CKEDITOR.tools.clone(f);
      f = new L(this, f);
      i = R(a);
      this._ = {
        editor: a,
        element: i.element,
        name: b,
        contentSize: {width: 0, height: 0},
        size: {width: 0, height: 0},
        contents: {},
        buttons: {},
        accessKeyMap: {},
        tabs: {},
        tabIdList: [],
        currentTabId: null,
        currentTabIndex: null,
        pageCount: 0,
        lastTab: null,
        tabBarMode: !1,
        focusList: [],
        currentFocusIndex: 0,
        hasFocus: !1
      };
      this.parts = i.parts;
      CKEDITOR.tools.setTimeout(function () {
        a.fire("ariaWidget", this.parts.contents)
      }, 0, this);
      i = {position: CKEDITOR.env.ie6Compat ? "absolute" : "fixed", top: 0, visibility: "hidden"};
      i["rtl" == k ? "right" : "left"] = 0;
      this.parts.dialog.setStyles(i);
      CKEDITOR.event.call(this);
      this.definition = f = CKEDITOR.fire("dialogDefinition", {name: b, definition: f}, a).definition;
      if (!("removeDialogTabs"in a._) && a.config.removeDialogTabs) {
        i = a.config.removeDialogTabs.split(";");
        for (k = 0; k <
        i.length; k++)if (l = i[k].split(":"), 2 == l.length) {
          var n = l[0];
          h[n] || (h[n] = []);
          h[n].push(l[1])
        }
        a._.removeDialogTabs = h
      }
      if (a._.removeDialogTabs && (h = a._.removeDialogTabs[b]))for (k = 0; k < h.length; k++)f.removeContents(h[k]);
      if (f.onLoad)this.on("load", f.onLoad);
      if (f.onShow)this.on("show", f.onShow);
      if (f.onHide)this.on("hide", f.onHide);
      if (f.onOk)this.on("ok", function (b) {
        a.fire("saveSnapshot");
        setTimeout(function () {
          a.fire("saveSnapshot")
        }, 0);
        !1 === f.onOk.call(this, b) && (b.data.hide = !1)
      });
      if (f.onCancel)this.on("cancel",
        function (a) {
          !1 === f.onCancel.call(this, a) && (a.data.hide = !1)
        });
      var m = this, p = function (a) {
        var b = m._.contents, c = !1, d;
        for (d in b)for (var f in b[d])if (c = a.call(this, b[d][f]))return
      };
      this.on("ok", function (a) {
        p(function (b) {
          if (b.validate) {
            var c = b.validate(this), d = "string" == typeof c || !1 === c;
            d && (a.data.hide = !1, a.stop());
            P.call(b, !d, "string" == typeof c ? c : void 0);
            return d
          }
        })
      }, this, null, 0);
      this.on("cancel", function (b) {
        p(function (c) {
          if (c.isChanged())return !a.config.dialog_noConfirmCancel && !confirm(a.lang.common.confirmCancel) &&
          (b.data.hide = !1), !0
        })
      }, this, null, 0);
      this.parts.close.on("click", function (a) {
        !1 !== this.fire("cancel", {hide: !0}).hide && this.hide();
        a.data.preventDefault()
      }, this);
      this.changeFocus = e;
      var v = this._.element;
      a.focusManager.add(v, 1);
      this.on("show", function () {
        v.on("keydown", d, this);
        if (CKEDITOR.env.opera || CKEDITOR.env.gecko)v.on("keypress", g, this)
      });
      this.on("hide", function () {
        v.removeListener("keydown", d);
        (CKEDITOR.env.opera || CKEDITOR.env.gecko) && v.removeListener("keypress", g);
        p(function (a) {
          Q.apply(a)
        })
      });
      this.on("iframeAdded",
        function (a) {
          (new CKEDITOR.dom.document(a.data.iframe.$.contentWindow.document)).on("keydown", d, this, null, 0)
        });
      this.on("show", function () {
        c();
        if (a.config.dialog_startupFocusTab && 1 < m._.pageCount)m._.tabBarMode = !0, m._.tabs[m._.currentTabId][0].focus(); else if (!this._.hasFocus)if (this._.currentFocusIndex = -1, f.onFocus) {
          var b = f.onFocus.call(this);
          b && b.focus()
        } else e(1)
      }, this, null, 4294967295);
      if (CKEDITOR.env.ie6Compat)this.on("load", function () {
          var a = this.getElement(), b = a.getFirst();
          b.remove();
          b.appendTo(a)
        },
        this);
      U(this);
      V(this);
      (new CKEDITOR.dom.text(f.title, CKEDITOR.document)).appendTo(this.parts.title);
      for (k = 0; k < f.contents.length; k++)(h = f.contents[k]) && this.addPage(h);
      this.parts.tabs.on("click", function (a) {
        var b = a.data.getTarget();
        b.hasClass("cke_dialog_tab") && (b = b.$.id, this.selectPage(b.substring(4, b.lastIndexOf("_"))), this._.tabBarMode && (this._.tabBarMode = !1, this._.currentFocusIndex = -1, e(1)), a.data.preventDefault())
      }, this);
      k = [];
      h = CKEDITOR.dialog._.uiElementBuilders.hbox.build(this, {
        type: "hbox",
        className: "cke_dialog_footer_buttons", widths: [], children: f.buttons
      }, k).getChild();
      this.parts.footer.setHtml(k.join(""));
      for (k = 0; k < h.length; k++)this._.buttons[h[k].id] = h[k]
    };
    CKEDITOR.dialog.prototype = {
      destroy: function () {
        this.hide();
        this._.element.remove()
      }, resize: function () {
        return function (a, b) {
          if (!this._.contentSize || !(this._.contentSize.width == a && this._.contentSize.height == b))CKEDITOR.dialog.fire("resize", {
            dialog: this,
            width: a,
            height: b
          }, this._.editor), this.fire("resize", {width: a, height: b}, this._.editor),
            this.parts.contents.setStyles({
              width: a + "px",
              height: b + "px"
            }), "rtl" == this._.editor.lang.dir && this._.position && (this._.position.x = CKEDITOR.document.getWindow().getViewPaneSize().width - this._.contentSize.width - parseInt(this._.element.getFirst().getStyle("right"), 10)), this._.contentSize = {
            width: a,
            height: b
          }
        }
      }(), getSize: function () {
        var a = this._.element.getFirst();
        return {width: a.$.offsetWidth || 0, height: a.$.offsetHeight || 0}
      }, move: function (a, b, c) {
        var e = this._.element.getFirst(), d = "rtl" == this._.editor.lang.dir,
          g = "fixed" == e.getComputedStyle("position");
        CKEDITOR.env.ie && e.setStyle("zoom", "100%");
        if (!g || !this._.position || !(this._.position.x == a && this._.position.y == b))this._.position = {
          x: a,
          y: b
        }, g || (g = CKEDITOR.document.getWindow().getScrollPosition(), a += g.x, b += g.y), d && (g = this.getSize(), a = CKEDITOR.document.getWindow().getViewPaneSize().width - g.width - a), b = {top: (0 < b ? b : 0) + "px"}, b[d ? "right" : "left"] = (0 < a ? a : 0) + "px", e.setStyles(b), c && (this._.moved = 1)
      }, getPosition: function () {
        return CKEDITOR.tools.extend({}, this._.position)
      },
      show: function () {
        var a = this._.element, b = this.definition;
        !a.getParent() || !a.getParent().equals(CKEDITOR.document.getBody()) ? a.appendTo(CKEDITOR.document.getBody()) : a.setStyle("display", "block");
        if (CKEDITOR.env.gecko && 10900 > CKEDITOR.env.version) {
          var c = this.parts.dialog;
          c.setStyle("position", "absolute");
          setTimeout(function () {
            c.setStyle("position", "fixed")
          }, 0)
        }
        this.resize(this._.contentSize && this._.contentSize.width || b.width || b.minWidth, this._.contentSize && this._.contentSize.height || b.height || b.minHeight);
        this.reset();
        this.selectPage(this.definition.contents[0].id);
        null === CKEDITOR.dialog._.currentZIndex && (CKEDITOR.dialog._.currentZIndex = this._.editor.config.baseFloatZIndex);
        this._.element.getFirst().setStyle("z-index", CKEDITOR.dialog._.currentZIndex += 10);
        null === CKEDITOR.dialog._.currentTop ? (CKEDITOR.dialog._.currentTop = this, this._.parentDialog = null, J(this._.editor)) : (this._.parentDialog = CKEDITOR.dialog._.currentTop, this._.parentDialog.getElement().getFirst().$.style.zIndex -= Math.floor(this._.editor.config.baseFloatZIndex /
          2), CKEDITOR.dialog._.currentTop = this);
        a.on("keydown", M);
        a.on(CKEDITOR.env.opera ? "keypress" : "keyup", N);
        this._.hasFocus = !1;
        for (var e in b.contents)if (b.contents[e]) {
          var a = b.contents[e], d = this._.tabs[a.id], g = a.requiredContent, f = 0;
          if (d) {
            for (var i in this._.contents[a.id]) {
              var l = this._.contents[a.id][i];
              "hbox" == l.type || ("vbox" == l.type || !l.getInputElement()) || (l.requiredContent && !this._.editor.activeFilter.check(l.requiredContent) ? l.disable() : (l.enable(), f++))
            }
            !f || g && !this._.editor.activeFilter.check(g) ?
              d[0].addClass("cke_dialog_tab_disabled") : d[0].removeClass("cke_dialog_tab_disabled")
          }
        }
        CKEDITOR.tools.setTimeout(function () {
          this.layout();
          T(this);
          this.parts.dialog.setStyle("visibility", "");
          this.fireOnce("load", {});
          CKEDITOR.ui.fire("ready", this);
          this.fire("show", {});
          this._.editor.fire("dialogShow", this);
          this._.parentDialog || this._.editor.focusManager.lock();
          this.foreach(function (a) {
            a.setInitValue && a.setInitValue()
          })
        }, 100, this)
      }, layout: function () {
        var a = this.parts.dialog, b = this.getSize(), c = CKEDITOR.document.getWindow().getViewPaneSize(),
          e = (c.width - b.width) / 2, d = (c.height - b.height) / 2;
        CKEDITOR.env.ie6Compat || (b.height + (0 < d ? d : 0) > c.height || b.width + (0 < e ? e : 0) > c.width ? a.setStyle("position", "absolute") : a.setStyle("position", "fixed"));
        this.move(this._.moved ? this._.position.x : e, this._.moved ? this._.position.y : d)
      }, foreach: function (a) {
        for (var b in this._.contents)for (var c in this._.contents[b])a.call(this, this._.contents[b][c]);
        return this
      }, reset: function () {
        var a = function (a) {
          a.reset && a.reset(1)
        };
        return function () {
          this.foreach(a);
          return this
        }
      }(),
      setupContent: function () {
        var a = arguments;
        this.foreach(function (b) {
          b.setup && b.setup.apply(b, a)
        })
      }, commitContent: function () {
        var a = arguments;
        this.foreach(function (b) {
          CKEDITOR.env.ie && this._.currentFocusIndex == b.focusIndex && b.getInputElement().$.blur();
          b.commit && b.commit.apply(b, a)
        })
      }, hide: function () {
        if (this.parts.dialog.isVisible()) {
          this.fire("hide", {});
          this._.editor.fire("dialogHide", this);
          this.selectPage(this._.tabIdList[0]);
          var a = this._.element;
          a.setStyle("display", "none");
          this.parts.dialog.setStyle("visibility",
            "hidden");
          for (X(this); CKEDITOR.dialog._.currentTop != this;)CKEDITOR.dialog._.currentTop.hide();
          if (this._.parentDialog) {
            var b = this._.parentDialog.getElement().getFirst();
            b.setStyle("z-index", parseInt(b.$.style.zIndex, 10) + Math.floor(this._.editor.config.baseFloatZIndex / 2))
          } else K(this._.editor);
          if (CKEDITOR.dialog._.currentTop = this._.parentDialog)CKEDITOR.dialog._.currentZIndex -= 10; else {
            CKEDITOR.dialog._.currentZIndex = null;
            a.removeListener("keydown", M);
            a.removeListener(CKEDITOR.env.opera ? "keypress" : "keyup",
              N);
            var c = this._.editor;
            c.focus();
            setTimeout(function () {
              c.focusManager.unlock()
            }, 0)
          }
          delete this._.parentDialog;
          this.foreach(function (a) {
            a.resetInitValue && a.resetInitValue()
          })
        }
      }, addPage: function (a) {
        if (!a.requiredContent || this._.editor.filter.check(a.requiredContent)) {
          for (var b = [], c = a.label ? ' title="' + CKEDITOR.tools.htmlEncode(a.label) + '"' : "", e = CKEDITOR.dialog._.uiElementBuilders.vbox.build(this, {
            type: "vbox",
            className: "cke_dialog_page_contents",
            children: a.elements,
            expand: !!a.expand,
            padding: a.padding,
            style: a.style || "width: 100%;"
          }, b), d = this._.contents[a.id] = {}, g = e.getChild(), f = 0; e = g.shift();)!e.notAllowed && ("hbox" != e.type && "vbox" != e.type) && f++, d[e.id] = e, "function" == typeof e.getChild && g.push.apply(g, e.getChild());
          f || (a.hidden = !0);
          b = CKEDITOR.dom.element.createFromHtml(b.join(""));
          b.setAttribute("role", "tabpanel");
          e = CKEDITOR.env;
          d = "cke_" + a.id + "_" + CKEDITOR.tools.getNextNumber();
          c = CKEDITOR.dom.element.createFromHtml(['<a class="cke_dialog_tab"', 0 < this._.pageCount ? " cke_last" : "cke_first", c, a.hidden ?
            ' style="display:none"' : "", ' id="', d, '"', e.gecko && 10900 <= e.version && !e.hc ? "" : ' href="javascript:void(0)"', ' tabIndex="-1" hidefocus="true" role="tab">', a.label, "</a>"].join(""));
          b.setAttribute("aria-labelledby", d);
          this._.tabs[a.id] = [c, b];
          this._.tabIdList.push(a.id);
          !a.hidden && this._.pageCount++;
          this._.lastTab = c;
          this.updateStyle();
          b.setAttribute("name", a.id);
          b.appendTo(this.parts.contents);
          c.unselectable();
          this.parts.tabs.append(c);
          a.accessKey && (O(this, this, "CTRL+" + a.accessKey, Y, Z), this._.accessKeyMap["CTRL+" +
          a.accessKey] = a.id)
        }
      }, selectPage: function (a) {
        if (this._.currentTabId != a && !this._.tabs[a][0].hasClass("cke_dialog_tab_disabled") && !0 !== this.fire("selectPage", {
            page: a,
            currentPage: this._.currentTabId
          })) {
          for (var b in this._.tabs) {
            var c = this._.tabs[b][0], e = this._.tabs[b][1];
            b != a && (c.removeClass("cke_dialog_tab_selected"), e.hide());
            e.setAttribute("aria-hidden", b != a)
          }
          var d = this._.tabs[a];
          d[0].addClass("cke_dialog_tab_selected");
          CKEDITOR.env.ie6Compat || CKEDITOR.env.ie7Compat ? (G(d[1]), d[1].show(), setTimeout(function () {
            G(d[1],
              1)
          }, 0)) : d[1].show();
          this._.currentTabId = a;
          this._.currentTabIndex = CKEDITOR.tools.indexOf(this._.tabIdList, a)
        }
      }, updateStyle: function () {
        this.parts.dialog[(1 === this._.pageCount ? "add" : "remove") + "Class"]("cke_single_page")
      }, hidePage: function (a) {
        var b = this._.tabs[a] && this._.tabs[a][0];
        b && (1 != this._.pageCount && b.isVisible()) && (a == this._.currentTabId && this.selectPage(t.call(this)), b.hide(), this._.pageCount--, this.updateStyle())
      }, showPage: function (a) {
        if (a = this._.tabs[a] && this._.tabs[a][0])a.show(), this._.pageCount++,
          this.updateStyle()
      }, getElement: function () {
        return this._.element
      }, getName: function () {
        return this._.name
      }, getContentElement: function (a, b) {
        var c = this._.contents[a];
        return c && c[b]
      }, getValueOf: function (a, b) {
        return this.getContentElement(a, b).getValue()
      }, setValueOf: function (a, b, c) {
        return this.getContentElement(a, b).setValue(c)
      }, getButton: function (a) {
        return this._.buttons[a]
      }, click: function (a) {
        return this._.buttons[a].click()
      }, disableButton: function (a) {
        return this._.buttons[a].disable()
      }, enableButton: function (a) {
        return this._.buttons[a].enable()
      },
      getPageCount: function () {
        return this._.pageCount
      }, getParentEditor: function () {
        return this._.editor
      }, getSelectedElement: function () {
        return this.getParentEditor().getSelection().getSelectedElement()
      }, addFocusable: function (a, b) {
        if ("undefined" == typeof b)b = this._.focusList.length, this._.focusList.push(new H(this, a, b)); else {
          this._.focusList.splice(b, 0, new H(this, a, b));
          for (var c = b + 1; c < this._.focusList.length; c++)this._.focusList[c].focusIndex++
        }
      }
    };
    CKEDITOR.tools.extend(CKEDITOR.dialog, {
      add: function (a, b) {
        if (!this._.dialogDefinitions[a] ||
          "function" == typeof b)this._.dialogDefinitions[a] = b
      }, exists: function (a) {
        return !!this._.dialogDefinitions[a]
      }, getCurrent: function () {
        return CKEDITOR.dialog._.currentTop
      }, isTabEnabled: function (a, b, c) {
        a = a.config.removeDialogTabs;
        return !(a && a.match(RegExp("(?:^|;)" + b + ":" + c + "(?:$|;)", "i")))
      }, okButton: function () {
        var a = function (a, c) {
          c = c || {};
          return CKEDITOR.tools.extend({
            id: "ok",
            type: "button",
            label: a.lang.common.ok,
            "class": "cke_dialog_ui_button_ok",
            onClick: function (a) {
              a = a.data.dialog;
              !1 !== a.fire("ok", {hide: !0}).hide &&
              a.hide()
            }
          }, c, !0)
        };
        a.type = "button";
        a.override = function (b) {
          return CKEDITOR.tools.extend(function (c) {
            return a(c, b)
          }, {type: "button"}, !0)
        };
        return a
      }(), cancelButton: function () {
        var a = function (a, c) {
          c = c || {};
          return CKEDITOR.tools.extend({
            id: "cancel",
            type: "button",
            label: a.lang.common.cancel,
            "class": "cke_dialog_ui_button_cancel",
            onClick: function (a) {
              a = a.data.dialog;
              !1 !== a.fire("cancel", {hide: !0}).hide && a.hide()
            }
          }, c, !0)
        };
        a.type = "button";
        a.override = function (b) {
          return CKEDITOR.tools.extend(function (c) {
            return a(c,
              b)
          }, {type: "button"}, !0)
        };
        return a
      }(), addUIElement: function (a, b) {
        this._.uiElementBuilders[a] = b
      }
    });
    CKEDITOR.dialog._ = {uiElementBuilders: {}, dialogDefinitions: {}, currentTop: null, currentZIndex: null};
    CKEDITOR.event.implementOn(CKEDITOR.dialog);
    CKEDITOR.event.implementOn(CKEDITOR.dialog.prototype);
    var W = {
      resizable: CKEDITOR.DIALOG_RESIZE_BOTH,
      minWidth: 600,
      minHeight: 400,
      buttons: [CKEDITOR.dialog.okButton, CKEDITOR.dialog.cancelButton]
    }, z = function (a, b, c) {
      for (var e = 0, d; d = a[e]; e++)if (d.id == b || c && d[c] && (d = z(d[c],
          b, c)))return d;
      return null
    }, A = function (a, b, c, e, d) {
      if (c) {
        for (var g = 0, f; f = a[g]; g++) {
          if (f.id == c)return a.splice(g, 0, b), b;
          if (e && f[e] && (f = A(f[e], b, c, e, !0)))return f
        }
        if (d)return null
      }
      a.push(b);
      return b
    }, B = function (a, b, c) {
      for (var e = 0, d; d = a[e]; e++) {
        if (d.id == b)return a.splice(e, 1);
        if (c && d[c] && (d = B(d[c], b, c)))return d
      }
      return null
    }, L = function (a, b) {
      this.dialog = a;
      for (var c = b.contents, e = 0, d; d = c[e]; e++)c[e] = d && new I(a, d);
      CKEDITOR.tools.extend(this, b)
    };
    L.prototype = {
      getContents: function (a) {
        return z(this.contents,
          a)
      }, getButton: function (a) {
        return z(this.buttons, a)
      }, addContents: function (a, b) {
        return A(this.contents, a, b)
      }, addButton: function (a, b) {
        return A(this.buttons, a, b)
      }, removeContents: function (a) {
        B(this.contents, a)
      }, removeButton: function (a) {
        B(this.buttons, a)
      }
    };
    I.prototype = {
      get: function (a) {
        return z(this.elements, a, "children")
      }, add: function (a, b) {
        return A(this.elements, a, b, "children")
      }, remove: function (a) {
        B(this.elements, a, "children")
      }
    };
    var F, w = {}, q, s = {}, M = function (a) {
      var b = a.data.$.ctrlKey || a.data.$.metaKey, c =
        a.data.$.altKey, e = a.data.$.shiftKey, d = String.fromCharCode(a.data.$.keyCode);
      if ((b = s[(b ? "CTRL+" : "") + (c ? "ALT+" : "") + (e ? "SHIFT+" : "") + d]) && b.length)b = b[b.length - 1], b.keydown && b.keydown.call(b.uiElement, b.dialog, b.key), a.data.preventDefault()
    }, N = function (a) {
      var b = a.data.$.ctrlKey || a.data.$.metaKey, c = a.data.$.altKey, e = a.data.$.shiftKey, d = String.fromCharCode(a.data.$.keyCode);
      if ((b = s[(b ? "CTRL+" : "") + (c ? "ALT+" : "") + (e ? "SHIFT+" : "") + d]) && b.length)b = b[b.length - 1], b.keyup && (b.keyup.call(b.uiElement, b.dialog, b.key),
        a.data.preventDefault())
    }, O = function (a, b, c, e, d) {
      (s[c] || (s[c] = [])).push({
        uiElement: a,
        dialog: b,
        key: c,
        keyup: d || a.accessKeyUp,
        keydown: e || a.accessKeyDown
      })
    }, X = function (a) {
      for (var b in s) {
        for (var c = s[b], e = c.length - 1; 0 <= e; e--)(c[e].dialog == a || c[e].uiElement == a) && c.splice(e, 1);
        0 === c.length && delete s[b]
      }
    }, Z = function (a, b) {
      a._.accessKeyMap[b] && a.selectPage(a._.accessKeyMap[b])
    }, Y = function () {
    };
    (function () {
      CKEDITOR.ui.dialog = {
        uiElement: function (a, b, c, e, d, g, f) {
          if (!(4 > arguments.length)) {
            var i = (e.call ? e(b) : e) || "div",
              l = ["<", i, " "], k = (d && d.call ? d(b) : d) || {}, h = (g && g.call ? g(b) : g) || {}, o = (f && f.call ? f.call(this, a, b) : f) || "", j = this.domId = h.id || CKEDITOR.tools.getNextId() + "_uiElement";
            this.id = b.id;
            b.requiredContent && !a.getParentEditor().filter.check(b.requiredContent) && (k.display = "none", this.notAllowed = !0);
            h.id = j;
            var n = {};
            b.type && (n["cke_dialog_ui_" + b.type] = 1);
            b.className && (n[b.className] = 1);
            b.disabled && (n.cke_disabled = 1);
            for (var m = h["class"] && h["class"].split ? h["class"].split(" ") : [], j = 0; j < m.length; j++)m[j] && (n[m[j]] = 1);
            m = [];
            for (j in n)m.push(j);
            h["class"] = m.join(" ");
            b.title && (h.title = b.title);
            n = (b.style || "").split(";");
            b.align && (m = b.align, k["margin-left"] = "left" == m ? 0 : "auto", k["margin-right"] = "right" == m ? 0 : "auto");
            for (j in k)n.push(j + ":" + k[j]);
            b.hidden && n.push("display:none");
            for (j = n.length - 1; 0 <= j; j--)"" === n[j] && n.splice(j, 1);
            0 < n.length && (h.style = (h.style ? h.style + "; " : "") + n.join("; "));
            for (j in h)l.push(j + '="' + CKEDITOR.tools.htmlEncode(h[j]) + '" ');
            l.push(">", o, "</", i, ">");
            c.push(l.join(""));
            (this._ || (this._ = {})).dialog =
              a;
            "boolean" == typeof b.isChanged && (this.isChanged = function () {
              return b.isChanged
            });
            "function" == typeof b.isChanged && (this.isChanged = b.isChanged);
            "function" == typeof b.setValue && (this.setValue = CKEDITOR.tools.override(this.setValue, function (a) {
              return function (c) {
                a.call(this, b.setValue.call(this, c))
              }
            }));
            "function" == typeof b.getValue && (this.getValue = CKEDITOR.tools.override(this.getValue, function (a) {
              return function () {
                return b.getValue.call(this, a.call(this))
              }
            }));
            CKEDITOR.event.implementOn(this);
            this.registerEvents(b);
            this.accessKeyUp && (this.accessKeyDown && b.accessKey) && O(this, a, "CTRL+" + b.accessKey);
            var p = this;
            a.on("load", function () {
              var b = p.getInputElement();
              if (b) {
                var c = p.type in{
                  checkbox: 1,
                  ratio: 1
                } && CKEDITOR.env.ie && CKEDITOR.env.version < 8 ? "cke_dialog_ui_focused" : "";
                b.on("focus", function () {
                  a._.tabBarMode = false;
                  a._.hasFocus = true;
                  p.fire("focus");
                  c && this.addClass(c)
                });
                b.on("blur", function () {
                  p.fire("blur");
                  c && this.removeClass(c)
                })
              }
            });
            CKEDITOR.tools.extend(this, b);
            this.keyboardFocusable && (this.tabIndex = b.tabIndex ||
              0, this.focusIndex = a._.focusList.push(this) - 1, this.on("focus", function () {
              a._.currentFocusIndex = p.focusIndex
            }))
          }
        }, hbox: function (a, b, c, e, d) {
          if (!(4 > arguments.length)) {
            this._ || (this._ = {});
            var g = this._.children = b, f = d && d.widths || null, i = d && d.height || null, l, k = {role: "presentation"};
            d && d.align && (k.align = d.align);
            CKEDITOR.ui.dialog.uiElement.call(this, a, d || {type: "hbox"}, e, "table", {}, k, function () {
              var a = ['<tbody><tr class="cke_dialog_ui_hbox">'];
              for (l = 0; l < c.length; l++) {
                var b = "cke_dialog_ui_hbox_child", e = [];
                0 ===
                l && (b = "cke_dialog_ui_hbox_first");
                l == c.length - 1 && (b = "cke_dialog_ui_hbox_last");
                a.push('<td class="', b, '" role="presentation" ');
                f ? f[l] && e.push("width:" + r(f[l])) : e.push("width:" + Math.floor(100 / c.length) + "%");
                i && e.push("height:" + r(i));
                d && void 0 != d.padding && e.push("padding:" + r(d.padding));
                CKEDITOR.env.ie && (CKEDITOR.env.quirks && g[l].align) && e.push("text-align:" + g[l].align);
                0 < e.length && a.push('style="' + e.join("; ") + '" ');
                a.push(">", c[l], "</td>")
              }
              a.push("</tr></tbody>");
              return a.join("")
            })
          }
        }, vbox: function (a,
                           b, c, e, d) {
          if (!(3 > arguments.length)) {
            this._ || (this._ = {});
            var g = this._.children = b, f = d && d.width || null, i = d && d.heights || null;
            CKEDITOR.ui.dialog.uiElement.call(this, a, d || {type: "vbox"}, e, "div", null, {role: "presentation"}, function () {
              var b = ['<table role="presentation" cellspacing="0" border="0" '];
              b.push('style="');
              d && d.expand && b.push("height:100%;");
              b.push("width:" + r(f || "100%"), ";");
              CKEDITOR.env.webkit && b.push("float:none;");
              b.push('"');
              b.push('align="', CKEDITOR.tools.htmlEncode(d && d.align || ("ltr" == a.getParentEditor().lang.dir ?
                  "left" : "right")), '" ');
              b.push("><tbody>");
              for (var e = 0; e < c.length; e++) {
                var h = [];
                b.push('<tr><td role="presentation" ');
                f && h.push("width:" + r(f || "100%"));
                i ? h.push("height:" + r(i[e])) : d && d.expand && h.push("height:" + Math.floor(100 / c.length) + "%");
                d && void 0 != d.padding && h.push("padding:" + r(d.padding));
                CKEDITOR.env.ie && (CKEDITOR.env.quirks && g[e].align) && h.push("text-align:" + g[e].align);
                0 < h.length && b.push('style="', h.join("; "), '" ');
                b.push(' class="cke_dialog_ui_vbox_child">', c[e], "</td></tr>")
              }
              b.push("</tbody></table>");
              return b.join("")
            })
          }
        }
      }
    })();
    CKEDITOR.ui.dialog.uiElement.prototype = {
      getElement: function () {
        return CKEDITOR.document.getById(this.domId)
      }, getInputElement: function () {
        return this.getElement()
      }, getDialog: function () {
        return this._.dialog
      }, setValue: function (a, b) {
        this.getInputElement().setValue(a);
        !b && this.fire("change", {value: a});
        return this
      }, getValue: function () {
        return this.getInputElement().getValue()
      }, isChanged: function () {
        return !1
      }, selectParentTab: function () {
        for (var a = this.getInputElement(); (a = a.getParent()) &&
        -1 == a.$.className.search("cke_dialog_page_contents"););
        if (!a)return this;
        a = a.getAttribute("name");
        this._.dialog._.currentTabId != a && this._.dialog.selectPage(a);
        return this
      }, focus: function () {
        this.selectParentTab().getInputElement().focus();
        return this
      }, registerEvents: function (a) {
        var b = /^on([A-Z]\w+)/, c, e = function (a, b, c, d) {
          b.on("load", function () {
            a.getInputElement().on(c, d, a)
          })
        }, d;
        for (d in a)if (c = d.match(b))this.eventProcessors[d] ? this.eventProcessors[d].call(this, this._.dialog, a[d]) : e(this, this._.dialog,
          c[1].toLowerCase(), a[d]);
        return this
      }, eventProcessors: {
        onLoad: function (a, b) {
          a.on("load", b, this)
        }, onShow: function (a, b) {
          a.on("show", b, this)
        }, onHide: function (a, b) {
          a.on("hide", b, this)
        }
      }, accessKeyDown: function () {
        this.focus()
      }, accessKeyUp: function () {
      }, disable: function () {
        var a = this.getElement();
        this.getInputElement().setAttribute("disabled", "true");
        a.addClass("cke_disabled")
      }, enable: function () {
        var a = this.getElement();
        this.getInputElement().removeAttribute("disabled");
        a.removeClass("cke_disabled")
      }, isEnabled: function () {
        return !this.getElement().hasClass("cke_disabled")
      },
      isVisible: function () {
        return this.getInputElement().isVisible()
      }, isFocusable: function () {
        return !this.isEnabled() || !this.isVisible() ? !1 : !0
      }
    };
    CKEDITOR.ui.dialog.hbox.prototype = CKEDITOR.tools.extend(new CKEDITOR.ui.dialog.uiElement, {
      getChild: function (a) {
        if (1 > arguments.length)return this._.children.concat();
        a.splice || (a = [a]);
        return 2 > a.length ? this._.children[a[0]] : this._.children[a[0]] && this._.children[a[0]].getChild ? this._.children[a[0]].getChild(a.slice(1, a.length)) : null
      }
    }, !0);
    CKEDITOR.ui.dialog.vbox.prototype =
      new CKEDITOR.ui.dialog.hbox;
    (function () {
      var a = {
        build: function (a, c, e) {
          for (var d = c.children, g, f = [], i = [], l = 0; l < d.length && (g = d[l]); l++) {
            var k = [];
            f.push(k);
            i.push(CKEDITOR.dialog._.uiElementBuilders[g.type].build(a, g, k))
          }
          return new CKEDITOR.ui.dialog[c.type](a, i, f, e, c)
        }
      };
      CKEDITOR.dialog.addUIElement("hbox", a);
      CKEDITOR.dialog.addUIElement("vbox", a)
    })();
    CKEDITOR.dialogCommand = function (a, b) {
      this.dialogName = a;
      CKEDITOR.tools.extend(this, b, !0)
    };
    CKEDITOR.dialogCommand.prototype = {
      exec: function (a) {
        CKEDITOR.env.opera ?
          CKEDITOR.tools.setTimeout(function () {
            a.openDialog(this.dialogName)
          }, 0, this) : a.openDialog(this.dialogName)
      }, canUndo: !1, editorFocus: 1
    };
    (function () {
      var a = /^([a]|[^a])+$/, b = /^\d*$/, c = /^\d*(?:\.\d+)?$/, e = /^(((\d*(\.\d+))|(\d*))(px|\%)?)?$/, d = /^(((\d*(\.\d+))|(\d*))(px|em|ex|in|cm|mm|pt|pc|\%)?)?$/i, g = /^(\s*[\w-]+\s*:\s*[^:;]+(?:;|$))*$/;
      CKEDITOR.VALIDATE_OR = 1;
      CKEDITOR.VALIDATE_AND = 2;
      CKEDITOR.dialog.validate = {
        functions: function () {
          var a = arguments;
          return function () {
            var b = this && this.getValue ? this.getValue() :
              a[0], c = void 0, d = CKEDITOR.VALIDATE_AND, e = [], g;
            for (g = 0; g < a.length; g++)if ("function" == typeof a[g])e.push(a[g]); else break;
            g < a.length && "string" == typeof a[g] && (c = a[g], g++);
            g < a.length && "number" == typeof a[g] && (d = a[g]);
            var j = d == CKEDITOR.VALIDATE_AND ? !0 : !1;
            for (g = 0; g < e.length; g++)j = d == CKEDITOR.VALIDATE_AND ? j && e[g](b) : j || e[g](b);
            return !j ? c : !0
          }
        }, regex: function (a, b) {
          return function (c) {
            c = this && this.getValue ? this.getValue() : c;
            return !a.test(c) ? b : !0
          }
        }, notEmpty: function (b) {
          return this.regex(a, b)
        }, integer: function (a) {
          return this.regex(b,
            a)
        }, number: function (a) {
          return this.regex(c, a)
        }, cssLength: function (a) {
          return this.functions(function (a) {
            return d.test(CKEDITOR.tools.trim(a))
          }, a)
        }, htmlLength: function (a) {
          return this.functions(function (a) {
            return e.test(CKEDITOR.tools.trim(a))
          }, a)
        }, inlineStyle: function (a) {
          return this.functions(function (a) {
            return g.test(CKEDITOR.tools.trim(a))
          }, a)
        }, equals: function (a, b) {
          return this.functions(function (b) {
            return b == a
          }, b)
        }, notEqual: function (a, b) {
          return this.functions(function (b) {
            return b != a
          }, b)
        }
      };
      CKEDITOR.on("instanceDestroyed",
        function (a) {
          if (CKEDITOR.tools.isEmpty(CKEDITOR.instances)) {
            for (var b; b = CKEDITOR.dialog._.currentTop;)b.hide();
            for (var c in w)w[c].remove();
            w = {}
          }
          var a = a.editor._.storedDialogs, d;
          for (d in a)a[d].destroy()
        })
    })();
    CKEDITOR.tools.extend(CKEDITOR.editor.prototype, {
      openDialog: function (a, b) {
        var c = null, e = CKEDITOR.dialog._.dialogDefinitions[a];
        null === CKEDITOR.dialog._.currentTop && J(this);
        if ("function" == typeof e)c = this._.storedDialogs || (this._.storedDialogs = {}), c = c[a] || (c[a] = new CKEDITOR.dialog(this, a)), b && b.call(c,
          c), c.show(); else {
          if ("failed" == e)throw K(this), Error('[CKEDITOR.dialog.openDialog] Dialog "' + a + '" failed when loading definition.');
          "string" == typeof e && CKEDITOR.scriptLoader.load(CKEDITOR.getUrl(e), function () {
            "function" != typeof CKEDITOR.dialog._.dialogDefinitions[a] && (CKEDITOR.dialog._.dialogDefinitions[a] = "failed");
            this.openDialog(a, b)
          }, this, 0, 1)
        }
        CKEDITOR.skin.loadPart("dialog");
        return c
      }
    })
  })();
  CKEDITOR.plugins.add("dialog", {
    requires: "dialogui", init: function (t) {
      t.on("doubleclick", function (u) {
        u.data.dialog && t.openDialog(u.data.dialog)
      }, null, null, 999)
    }
  });
  (function () {
    CKEDITOR.plugins.add("a11yhelp", {
      requires: "dialog",
      availableLangs: {
        ar: 1,
        bg: 1,
        ca: 1,
        cs: 1,
        cy: 1,
        da: 1,
        de: 1,
        el: 1,
        en: 1,
        eo: 1,
        es: 1,
        et: 1,
        fa: 1,
        fi: 1,
        fr: 1,
        "fr-ca": 1,
        gl: 1,
        gu: 1,
        he: 1,
        hi: 1,
        hr: 1,
        hu: 1,
        id: 1,
        it: 1,
        ja: 1,
        km: 1,
        ko: 1,
        ku: 1,
        lt: 1,
        lv: 1,
        mk: 1,
        mn: 1,
        nb: 1,
        nl: 1,
        no: 1,
        pl: 1,
        pt: 1,
        "pt-br": 1,
        ro: 1,
        ru: 1,
        si: 1,
        sk: 1,
        sl: 1,
        sq: 1,
        sr: 1,
        "sr-latn": 1,
        sv: 1,
        th: 1,
        tr: 1,
        ug: 1,
        uk: 1,
        vi: 1,
        "zh-cn": 1
      },
      init: function (b) {
        var c = this;
        b.addCommand("a11yHelp", {
          exec: function () {
            var a = b.langCode, a = c.availableLangs[a] ? a : c.availableLangs[a.replace(/-.*/,
              "")] ? a.replace(/-.*/, "") : "en";
            CKEDITOR.scriptLoader.load(CKEDITOR.getUrl(c.path + "dialogs/lang/" + a + ".js"), function () {
              b.lang.a11yhelp = c.langEntries[a];
              b.openDialog("a11yHelp")
            })
          }, modes: {wysiwyg: 1, source: 1}, readOnly: 1, canUndo: !1
        });
        b.setKeystroke(CKEDITOR.ALT + 48, "a11yHelp");
        CKEDITOR.dialog.add("a11yHelp", this.path + "dialogs/a11yhelp.js")
      }
    })
  })();
  CKEDITOR.plugins.add("basicstyles", {
    init: function (c) {
      var e = 0, d = function (g, d, b, a) {
        if (a) {
          var a = new CKEDITOR.style(a), f = h[b];
          f.unshift(a);
          c.attachStyleStateChange(a, function (a) {
            !c.readOnly && c.getCommand(b).setState(a)
          });
          c.addCommand(b, new CKEDITOR.styleCommand(a, {contentForms: f}));
          c.ui.addButton && c.ui.addButton(g, {label: d, command: b, toolbar: "basicstyles," + (e += 10)})
        }
      }, h = {
        bold: ["strong", "b", ["span", function (a) {
          a = a.styles["font-weight"];
          return "bold" == a || 700 <= +a
        }]], italic: ["em", "i", ["span", function (a) {
          return "italic" ==
            a.styles["font-style"]
        }]], underline: ["u", ["span", function (a) {
          return "underline" == a.styles["text-decoration"]
        }]], strike: ["s", "strike", ["span", function (a) {
          return "line-through" == a.styles["text-decoration"]
        }]], subscript: ["sub"], superscript: ["sup"]
      }, b = c.config, a = c.lang.basicstyles;
      d("Bold", a.bold, "bold", b.coreStyles_bold);
      d("Italic", a.italic, "italic", b.coreStyles_italic);
      d("Underline", a.underline, "underline", b.coreStyles_underline);
      d("Strike", a.strike, "strike", b.coreStyles_strike);
      d("Subscript", a.subscript,
        "subscript", b.coreStyles_subscript);
      d("Superscript", a.superscript, "superscript", b.coreStyles_superscript);
      c.setKeystroke([[CKEDITOR.CTRL + 66, "bold"], [CKEDITOR.CTRL + 73, "italic"], [CKEDITOR.CTRL + 85, "underline"]])
    }
  });
  CKEDITOR.config.coreStyles_bold = {element: "strong", overrides: "b"};
  CKEDITOR.config.coreStyles_italic = {element: "em", overrides: "i"};
  CKEDITOR.config.coreStyles_underline = {element: "u"};
  CKEDITOR.config.coreStyles_strike = {element: "s", overrides: "strike"};
  CKEDITOR.config.coreStyles_subscript = {element: "sub"};
  CKEDITOR.config.coreStyles_superscript = {element: "sup"};
  (function () {
    var k = {
      exec: function (g) {
        var a = g.getCommand("blockquote").state, i = g.getSelection(), c = i && i.getRanges()[0];
        if (c) {
          var h = i.createBookmarks();
          if (CKEDITOR.env.ie) {
            var e = h[0].startNode, b = h[0].endNode, d;
            if (e && "blockquote" == e.getParent().getName())for (d = e; d = d.getNext();)if (d.type == CKEDITOR.NODE_ELEMENT && d.isBlockBoundary()) {
              e.move(d, !0);
              break
            }
            if (b && "blockquote" == b.getParent().getName())for (d = b; d = d.getPrevious();)if (d.type == CKEDITOR.NODE_ELEMENT && d.isBlockBoundary()) {
              b.move(d);
              break
            }
          }
          var f = c.createIterator();
          f.enlargeBr = g.config.enterMode != CKEDITOR.ENTER_BR;
          if (a == CKEDITOR.TRISTATE_OFF) {
            for (e = []; a = f.getNextParagraph();)e.push(a);
            1 > e.length && (a = g.document.createElement(g.config.enterMode == CKEDITOR.ENTER_P ? "p" : "div"), b = h.shift(), c.insertNode(a), a.append(new CKEDITOR.dom.text("﻿", g.document)), c.moveToBookmark(b), c.selectNodeContents(a), c.collapse(!0), b = c.createBookmark(), e.push(a), h.unshift(b));
            d = e[0].getParent();
            c = [];
            for (b = 0; b < e.length; b++)a = e[b], d = d.getCommonAncestor(a.getParent());
            for (a = {
              table: 1, tbody: 1,
              tr: 1, ol: 1, ul: 1
            }; a[d.getName()];)d = d.getParent();
            for (b = null; 0 < e.length;) {
              for (a = e.shift(); !a.getParent().equals(d);)a = a.getParent();
              a.equals(b) || c.push(a);
              b = a
            }
            for (; 0 < c.length;)if (a = c.shift(), "blockquote" == a.getName()) {
              for (b = new CKEDITOR.dom.documentFragment(g.document); a.getFirst();)b.append(a.getFirst().remove()), e.push(b.getLast());
              b.replace(a)
            } else e.push(a);
            c = g.document.createElement("blockquote");
            for (c.insertBefore(e[0]); 0 < e.length;)a = e.shift(), c.append(a)
          } else if (a == CKEDITOR.TRISTATE_ON) {
            b = [];
            for (d = {}; a = f.getNextParagraph();) {
              for (e = c = null; a.getParent();) {
                if ("blockquote" == a.getParent().getName()) {
                  c = a.getParent();
                  e = a;
                  break
                }
                a = a.getParent()
              }
              c && (e && !e.getCustomData("blockquote_moveout")) && (b.push(e), CKEDITOR.dom.element.setMarker(d, e, "blockquote_moveout", !0))
            }
            CKEDITOR.dom.element.clearAllMarkers(d);
            a = [];
            e = [];
            for (d = {}; 0 < b.length;)f = b.shift(), c = f.getParent(), f.getPrevious() ? f.getNext() ? (f.breakParent(f.getParent()), e.push(f.getNext())) : f.remove().insertAfter(c) : f.remove().insertBefore(c), c.getCustomData("blockquote_processed") ||
            (e.push(c), CKEDITOR.dom.element.setMarker(d, c, "blockquote_processed", !0)), a.push(f);
            CKEDITOR.dom.element.clearAllMarkers(d);
            for (b = e.length - 1; 0 <= b; b--) {
              c = e[b];
              a:{
                d = c;
                for (var f = 0, k = d.getChildCount(), j = void 0; f < k && (j = d.getChild(f)); f++)if (j.type == CKEDITOR.NODE_ELEMENT && j.isBlockBoundary()) {
                  d = !1;
                  break a
                }
                d = !0
              }
              d && c.remove()
            }
            if (g.config.enterMode == CKEDITOR.ENTER_BR)for (c = !0; a.length;)if (f = a.shift(), "div" == f.getName()) {
              b = new CKEDITOR.dom.documentFragment(g.document);
              c && (f.getPrevious() && !(f.getPrevious().type ==
              CKEDITOR.NODE_ELEMENT && f.getPrevious().isBlockBoundary())) && b.append(g.document.createElement("br"));
              for (c = f.getNext() && !(f.getNext().type == CKEDITOR.NODE_ELEMENT && f.getNext().isBlockBoundary()); f.getFirst();)f.getFirst().remove().appendTo(b);
              c && b.append(g.document.createElement("br"));
              b.replace(f);
              c = !1
            }
          }
          i.selectBookmarks(h);
          g.focus()
        }
      }, refresh: function (g, a) {
        this.setState(g.elementPath(a.block || a.blockLimit).contains("blockquote", 1) ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF)
      }, context: "blockquote",
      allowedContent: "blockquote", requiredContent: "blockquote"
    };
    CKEDITOR.plugins.add("blockquote", {
      init: function (g) {
        g.blockless || (g.addCommand("blockquote", k), g.ui.addButton && g.ui.addButton("Blockquote", {
          label: g.lang.blockquote.toolbar,
          command: "blockquote",
          toolbar: "blocks,10"
        }))
      }
    })
  })();
  (function () {
    function w(b) {
      function a() {
        var e = b.editable();
        e.on(q, function (b) {
          (!CKEDITOR.env.ie || !n) && u(b)
        });
        CKEDITOR.env.ie && e.on("paste", function (e) {
          r || (f(), e.data.preventDefault(), u(e), l("paste") || b.openDialog("paste"))
        });
        CKEDITOR.env.ie && (e.on("contextmenu", h, null, null, 0), e.on("beforepaste", function (b) {
          b.data && !b.data.$.ctrlKey && h()
        }, null, null, 0));
        e.on("beforecut", function () {
          !n && i(b)
        });
        var a;
        e.attachListener(CKEDITOR.env.ie ? e : b.document.getDocumentElement(), "mouseup", function () {
          a = setTimeout(function () {
              s()
            },
            0)
        });
        b.on("destroy", function () {
          clearTimeout(a)
        });
        e.on("keyup", s)
      }

      function c(e) {
        return {
          type: e, canUndo: "cut" == e, startDisabled: !0, exec: function () {
            "cut" == this.type && i();
            var e;
            var a = this.type;
            if (CKEDITOR.env.ie)e = l(a); else try {
              e = b.document.$.execCommand(a, !1, null)
            } catch (d) {
              e = !1
            }
            e || alert(b.lang.clipboard[this.type + "Error"]);
            return e
          }
        }
      }

      function d() {
        return {
          canUndo: !1, async: !0, exec: function (b, a) {
            var d = function (a, d) {
                a && g(a.type, a.dataValue, !!d);
                b.fire("afterCommandExec", {name: "paste", command: c, returnValue: !!a})
              },
              c = this;
            "string" == typeof a ? d({type: "auto", dataValue: a}, 1) : b.getClipboardData(d)
          }
        }
      }

      function f() {
        r = 1;
        setTimeout(function () {
          r = 0
        }, 100)
      }

      function h() {
        n = 1;
        setTimeout(function () {
          n = 0
        }, 10)
      }

      function l(e) {
        var a = b.document, d = a.getBody(), c = !1, i = function () {
          c = !0
        };
        d.on(e, i);
        (7 < CKEDITOR.env.version ? a.$ : a.$.selection.createRange()).execCommand(e);
        d.removeListener(e, i);
        return c
      }

      function g(e, a, d) {
        e = {type: e};
        if (d && !b.fire("beforePaste", e) || !a)return !1;
        e.dataValue = a;
        return b.fire("paste", e)
      }

      function i() {
        if (CKEDITOR.env.ie && !CKEDITOR.env.quirks) {
          var e = b.getSelection(), a, d, c;
          if (e.getType() == CKEDITOR.SELECTION_ELEMENT && (a = e.getSelectedElement()))d = e.getRanges()[0], c = b.document.createText(""), c.insertBefore(a), d.setStartBefore(c), d.setEndAfter(a), e.selectRanges([d]), setTimeout(function () {
            a.getParent() && (c.remove(), e.selectElement(a))
          }, 0)
        }
      }

      function k(a, d) {
        var c = b.document, i = b.editable(), k = function (b) {
          b.cancel()
        }, f = CKEDITOR.env.gecko && 10902 >= CKEDITOR.env.version, h;
        if (!c.getById("cke_pastebin")) {
          var o = b.getSelection(), v = o.createBookmarks(),
            j = new CKEDITOR.dom.element((CKEDITOR.env.webkit || i.is("body")) && !CKEDITOR.env.ie && !CKEDITOR.env.opera ? "body" : "div", c);
          j.setAttributes({id: "cke_pastebin", "data-cke-temp": "1"});
          CKEDITOR.env.opera && j.appendBogus();
          var g = 0, c = c.getWindow();
          f ? (j.insertAfter(v[0].startNode), j.setStyle("display", "inline")) : (CKEDITOR.env.webkit ? (i.append(j), j.addClass("cke_editable"), i.is("body") || (f = "static" != i.getComputedStyle("position") ? i : CKEDITOR.dom.element.get(i.$.offsetParent), g = f.getDocumentPosition().y)) : i.getAscendant(CKEDITOR.env.ie ||
          CKEDITOR.env.opera ? "body" : "html", 1).append(j), j.setStyles({
            position: "absolute",
            top: c.getScrollPosition().y - g + 10 + "px",
            width: "1px",
            height: Math.max(1, c.getViewPaneSize().height - 20) + "px",
            overflow: "hidden",
            margin: 0,
            padding: 0
          }));
          (f = j.getParent().isReadOnly()) ? (j.setOpacity(0), j.setAttribute("contenteditable", !0)) : j.setStyle("ltr" == b.config.contentsLangDirection ? "left" : "right", "-1000px");
          b.on("selectionChange", k, null, null, 0);
          CKEDITOR.env.webkit && (h = i.once("blur", k, null, null, -100));
          f && j.focus();
          f = new CKEDITOR.dom.range(j);
          f.selectNodeContents(j);
          var l = f.select();
          CKEDITOR.env.ie && (h = i.once("blur", function () {
            b.lockSelection(l)
          }));
          var m = CKEDITOR.document.getWindow().getScrollPosition().y;
          setTimeout(function () {
            if (CKEDITOR.env.webkit || CKEDITOR.env.opera)CKEDITOR.document[CKEDITOR.env.webkit ? "getBody" : "getDocumentElement"]().$.scrollTop = m;
            h && h.removeListener();
            CKEDITOR.env.ie && i.focus();
            o.selectBookmarks(v);
            j.remove();
            var a;
            if (CKEDITOR.env.webkit && (a = j.getFirst()) && a.is && a.hasClass("Apple-style-span"))j = a;
            b.removeListener("selectionChange",
              k);
            d(j.getHtml())
          }, 0)
        }
      }

      function o() {
        if (CKEDITOR.env.ie) {
          b.focus();
          f();
          var a = b.focusManager;
          a.lock();
          if (b.editable().fire(q) && !l("paste"))return a.unlock(), !1;
          a.unlock()
        } else try {
          if (b.editable().fire(q) && !b.document.$.execCommand("Paste", !1, null))throw 0;
        } catch (d) {
          return !1
        }
        return !0
      }

      function p(a) {
        if ("wysiwyg" == b.mode)switch (a.data.keyCode) {
          case CKEDITOR.CTRL + 86:
          case CKEDITOR.SHIFT + 45:
            a = b.editable();
            f();
            !CKEDITOR.env.ie && a.fire("beforepaste");
            (CKEDITOR.env.opera || CKEDITOR.env.gecko && 10900 > CKEDITOR.env.version) &&
            a.fire("paste");
            break;
          case CKEDITOR.CTRL + 88:
          case CKEDITOR.SHIFT + 46:
            b.fire("saveSnapshot"), setTimeout(function () {
              b.fire("saveSnapshot")
            }, 0)
        }
      }

      function u(a) {
        var d = {type: "auto"}, c = b.fire("beforePaste", d);
        k(a, function (b) {
          b = b.replace(/<span[^>]+data-cke-bookmark[^<]*?<\/span>/ig, "");
          c && g(d.type, b, 0, 1)
        })
      }

      function s() {
        if ("wysiwyg" == b.mode) {
          var a = m("paste");
          b.getCommand("cut").setState(m("cut"));
          b.getCommand("copy").setState(m("copy"));
          b.getCommand("paste").setState(a);
          b.fire("pasteState", a)
        }
      }

      function m(a) {
        if (t &&
          a in{paste: 1, cut: 1})return CKEDITOR.TRISTATE_DISABLED;
        if ("paste" == a)return CKEDITOR.TRISTATE_OFF;
        var a = b.getSelection(), d = a.getRanges();
        return a.getType() == CKEDITOR.SELECTION_NONE || 1 == d.length && d[0].collapsed ? CKEDITOR.TRISTATE_DISABLED : CKEDITOR.TRISTATE_OFF
      }

      var n = 0, r = 0, t = 0, q = CKEDITOR.env.ie ? "beforepaste" : "paste";
      (function () {
        b.on("key", p);
        b.on("contentDom", a);
        b.on("selectionChange", function (a) {
          t = a.data.selection.getRanges()[0].checkReadOnly();
          s()
        });
        b.contextMenu && b.contextMenu.addListener(function (a,
                                                             b) {
          t = b.getRanges()[0].checkReadOnly();
          return {cut: m("cut"), copy: m("copy"), paste: m("paste")}
        })
      })();
      (function () {
        function a(d, c, i, e, f) {
          var k = b.lang.clipboard[c];
          b.addCommand(c, i);
          b.ui.addButton && b.ui.addButton(d, {label: k, command: c, toolbar: "clipboard," + e});
          b.addMenuItems && b.addMenuItem(c, {label: k, command: c, group: "clipboard", order: f})
        }

        a("Cut", "cut", c("cut"), 10, 1);
        a("Copy", "copy", c("copy"), 20, 4);
        a("Paste", "paste", d(), 30, 8)
      })();
      b.getClipboardData = function (a, d) {
        function c(a) {
          a.removeListener();
          a.cancel();
          d(a.data)
        }

        function i(a) {
          a.removeListener();
          a.cancel();
          g = !0;
          d({type: h, dataValue: a.data})
        }

        function f() {
          this.customTitle = a && a.title
        }

        var k = !1, h = "auto", g = !1;
        d || (d = a, a = null);
        b.on("paste", c, null, null, 0);
        b.on("beforePaste", function (a) {
          a.removeListener();
          k = true;
          h = a.data.type
        }, null, null, 1E3);
        !1 === o() && (b.removeListener("paste", c), k && b.fire("pasteDialog", f) ? (b.on("pasteDialogCommit", i), b.on("dialogHide", function (a) {
          a.removeListener();
          a.data.removeListener("pasteDialogCommit", i);
          setTimeout(function () {
              g || d(null)
            },
            10)
        })) : d(null))
      }
    }

    function x(b) {
      if (CKEDITOR.env.webkit) {
        if (!b.match(/^[^<]*$/g) && !b.match(/^(<div><br( ?\/)?><\/div>|<div>[^<]*<\/div>)*$/gi))return "html"
      } else if (CKEDITOR.env.ie) {
        if (!b.match(/^([^<]|<br( ?\/)?>)*$/gi) && !b.match(/^(<p>([^<]|<br( ?\/)?>)*<\/p>|(\r\n))*$/gi))return "html"
      } else if (CKEDITOR.env.gecko || CKEDITOR.env.opera) {
        if (!b.match(/^([^<]|<br( ?\/)?>)*$/gi))return "html"
      } else return "html";
      return "htmlifiedtext"
    }

    function y(b, a) {
      function c(a) {
        return CKEDITOR.tools.repeat("</p><p>", ~~(a / 2)) +
          (1 == a % 2 ? "<br>" : "")
      }

      a = a.replace(/\s+/g, " ").replace(/> +</g, "><").replace(/<br ?\/>/gi, "<br>");
      a = a.replace(/<\/?[A-Z]+>/g, function (a) {
        return a.toLowerCase()
      });
      if (a.match(/^[^<]$/))return a;
      CKEDITOR.env.webkit && -1 < a.indexOf("<div>") && (a = a.replace(/^(<div>(<br>|)<\/div>)(?!$|(<div>(<br>|)<\/div>))/g, "<br>").replace(/^(<div>(<br>|)<\/div>){2}(?!$)/g, "<div></div>"), a.match(/<div>(<br>|)<\/div>/) && (a = "<p>" + a.replace(/(<div>(<br>|)<\/div>)+/g, function (a) {
          return c(a.split("</div><div>").length + 1)
        }) + "</p>"),
        a = a.replace(/<\/div><div>/g, "<br>"), a = a.replace(/<\/?div>/g, ""));
      if ((CKEDITOR.env.gecko || CKEDITOR.env.opera) && b.enterMode != CKEDITOR.ENTER_BR)CKEDITOR.env.gecko && (a = a.replace(/^<br><br>$/, "<br>")), -1 < a.indexOf("<br><br>") && (a = "<p>" + a.replace(/(<br>){2,}/g, function (a) {
          return c(a.length / 4)
        }) + "</p>");
      return p(b, a)
    }

    function z() {
      var b = new CKEDITOR.htmlParser.filter, a = {
        blockquote: 1,
        dl: 1,
        fieldset: 1,
        h1: 1,
        h2: 1,
        h3: 1,
        h4: 1,
        h5: 1,
        h6: 1,
        ol: 1,
        p: 1,
        table: 1,
        ul: 1
      }, c = CKEDITOR.tools.extend({br: 0}, CKEDITOR.dtd.$inline), d =
      {p: 1, br: 1, "cke:br": 1}, f = CKEDITOR.dtd, h = CKEDITOR.tools.extend({
        area: 1,
        basefont: 1,
        embed: 1,
        iframe: 1,
        map: 1,
        object: 1,
        param: 1
      }, CKEDITOR.dtd.$nonBodyContent, CKEDITOR.dtd.$cdata), l = function (a) {
        delete a.name;
        a.add(new CKEDITOR.htmlParser.text(" "))
      }, g = function (a) {
        for (var b = a, c; (b = b.next) && b.name && b.name.match(/^h\d$/);) {
          c = new CKEDITOR.htmlParser.element("cke:br");
          c.isEmpty = !0;
          for (a.add(c); c = b.children.shift();)a.add(c)
        }
      };
      b.addRules({
        elements: {
          h1: g, h2: g, h3: g, h4: g, h5: g, h6: g, img: function (a) {
            var a = CKEDITOR.tools.trim(a.attributes.alt ||
              ""), b = " ";
            a && !a.match(/(^http|\.(jpe?g|gif|png))/i) && (b = " [" + a + "] ");
            return new CKEDITOR.htmlParser.text(b)
          }, td: l, th: l, $: function (b) {
            var k = b.name, g;
            if (h[k])return !1;
            b.attributes = [];
            if ("br" == k)return b;
            if (a[k])b.name = "p"; else if (c[k])delete b.name; else if (f[k]) {
              g = new CKEDITOR.htmlParser.element("cke:br");
              g.isEmpty = !0;
              if (CKEDITOR.dtd.$empty[k])return g;
              b.add(g, 0);
              g = g.clone();
              g.isEmpty = !0;
              b.add(g);
              delete b.name
            }
            d[b.name] || delete b.name;
            return b
          }
        }
      }, {applyToAll: !0});
      return b
    }

    function A(b, a, c) {
      var a = new CKEDITOR.htmlParser.fragment.fromHtml(a),
        d = new CKEDITOR.htmlParser.basicWriter;
      a.writeHtml(d, c);
      var a = d.getHtml(), a = a.replace(/\s*(<\/?[a-z:]+ ?\/?>)\s*/g, "$1").replace(/(<cke:br \/>){2,}/g, "<cke:br />").replace(/(<cke:br \/>)(<\/?p>|<br \/>)/g, "$2").replace(/(<\/?p>|<br \/>)(<cke:br \/>)/g, "$1").replace(/<(cke:)?br( \/)?>/g, "<br>").replace(/<p><\/p>/g, ""), f = 0, a = a.replace(/<\/?p>/g, function (a) {
        if ("<p>" == a) {
          if (1 < ++f)return "</p><p>"
        } else if (0 < --f)return "</p><p>";
        return a
      }).replace(/<p><\/p>/g, "");
      return p(b, a)
    }

    function p(b, a) {
      b.enterMode ==
      CKEDITOR.ENTER_BR ? a = a.replace(/(<\/p><p>)+/g, function (a) {
        return CKEDITOR.tools.repeat("<br>", 2 * (a.length / 7))
      }).replace(/<\/?p>/g, "") : b.enterMode == CKEDITOR.ENTER_DIV && (a = a.replace(/<(\/)?p>/g, "<$1div>"));
      return a
    }

    CKEDITOR.plugins.add("clipboard", {
      requires: "dialog", init: function (b) {
        var a;
        w(b);
        CKEDITOR.dialog.add("paste", CKEDITOR.getUrl(this.path + "dialogs/paste.js"));
        b.on("paste", function (a) {
            var b = a.data.dataValue, f = CKEDITOR.dtd.$block;
            -1 < b.indexOf("Apple-") && (b = b.replace(/<span class="Apple-converted-space">&nbsp;<\/span>/gi,
              " "), "html" != a.data.type && (b = b.replace(/<span class="Apple-tab-span"[^>]*>([^<]*)<\/span>/gi, function (a, b) {
              return b.replace(/\t/g, "&nbsp;&nbsp; &nbsp;")
            })), -1 < b.indexOf('<br class="Apple-interchange-newline">') && (a.data.startsWithEOL = 1, a.data.preSniffing = "html", b = b.replace(/<br class="Apple-interchange-newline">/, "")), b = b.replace(/(<[^>]+) class="Apple-[^"]*"/gi, "$1"));
            if (b.match(/^<[^<]+cke_(editable|contents)/i)) {
              var h, l, g = new CKEDITOR.dom.element("div");
              for (g.setHtml(b); 1 == g.getChildCount() && (h =
                g.getFirst()) && h.type == CKEDITOR.NODE_ELEMENT && (h.hasClass("cke_editable") || h.hasClass("cke_contents"));)g = l = h;
              l && (b = l.getHtml().replace(/<br>$/i, ""))
            }
            CKEDITOR.env.ie ? b = b.replace(/^&nbsp;(?: |\r\n)?<(\w+)/g, function (b, d) {
              if (d.toLowerCase()in f) {
                a.data.preSniffing = "html";
                return "<" + d
              }
              return b
            }) : CKEDITOR.env.webkit ? b = b.replace(/<\/(\w+)><div><br><\/div>$/, function (b, d) {
              if (d in f) {
                a.data.endsWithEOL = 1;
                return "</" + d + ">"
              }
              return b
            }) : CKEDITOR.env.gecko && (b = b.replace(/(\s)<br>$/, "$1"));
            a.data.dataValue = b
          }, null,
          null, 3);
        b.on("paste", function (c) {
          var c = c.data, d = c.type, f = c.dataValue, h, l = b.config.clipboard_defaultContentType || "html";
          h = "html" == d || "html" == c.preSniffing ? "html" : x(f);
          "htmlifiedtext" == h ? f = y(b.config, f) : "text" == d && "html" == h && (f = A(b.config, f, a || (a = z(b))));
          c.startsWithEOL && (f = '<br data-cke-eol="1">' + f);
          c.endsWithEOL && (f += '<br data-cke-eol="1">');
          "auto" == d && (d = "html" == h || "html" == l ? "html" : "text");
          c.type = d;
          c.dataValue = f;
          delete c.preSniffing;
          delete c.startsWithEOL;
          delete c.endsWithEOL
        }, null, null, 6);
        b.on("paste",
          function (a) {
            a = a.data;
            b.insertHtml(a.dataValue, a.type);
            setTimeout(function () {
              b.fire("afterPaste")
            }, 0)
          }, null, null, 1E3);
        b.on("pasteDialog", function (a) {
          setTimeout(function () {
            b.openDialog("paste", a.data)
          }, 0)
        })
      }
    })
  })();
  (function () {
    CKEDITOR.plugins.add("panel", {
      beforeInit: function (a) {
        a.ui.addHandler(CKEDITOR.UI_PANEL, CKEDITOR.ui.panel.handler)
      }
    });
    CKEDITOR.UI_PANEL = "panel";
    CKEDITOR.ui.panel = function (a, b) {
      b && CKEDITOR.tools.extend(this, b);
      CKEDITOR.tools.extend(this, {className: "", css: []});
      this.id = CKEDITOR.tools.getNextId();
      this.document = a;
      this.isFramed = this.forceIFrame || this.css.length;
      this._ = {blocks: {}}
    };
    CKEDITOR.ui.panel.handler = {
      create: function (a) {
        return new CKEDITOR.ui.panel(a)
      }
    };
    var e = CKEDITOR.addTemplate("panel",
      '<div lang="{langCode}" id="{id}" dir={dir} class="cke cke_reset_all {editorId} cke_panel cke_panel {cls} cke_{dir}" style="z-index:{z-index}" role="presentation">{frame}</div>'), f = CKEDITOR.addTemplate("panel-frame", '<iframe id="{id}" class="cke_panel_frame" role="presentation" frameborder="0" src="{src}"></iframe>'), g = CKEDITOR.addTemplate("panel-frame-inner", '<!DOCTYPE html><html class="cke_panel_container {env}" dir="{dir}" lang="{langCode}"><head>{css}</head><body class="cke_{dir}" style="margin:0;padding:0" onload="{onload}"></body></html>');
    CKEDITOR.ui.panel.prototype = {
      render: function (a, b) {
        this.getHolderElement = function () {
          var a = this._.holder;
          if (!a) {
            if (this.isFramed) {
              var a = this.document.getById(this.id + "_frame"), b = a.getParent(), a = a.getFrameDocument();
              CKEDITOR.env.iOS && b.setStyles({overflow: "scroll", "-webkit-overflow-scrolling": "touch"});
              b = CKEDITOR.tools.addFunction(CKEDITOR.tools.bind(function () {
                this.isLoaded = !0;
                if (this.onLoad)this.onLoad()
              }, this));
              a.write(g.output(CKEDITOR.tools.extend({
                css: CKEDITOR.tools.buildStyleHtml(this.css), onload: "window.parent.CKEDITOR.tools.callFunction(" +
                b + ");"
              }, c)));
              a.getWindow().$.CKEDITOR = CKEDITOR;
              a.on("key" + (CKEDITOR.env.opera ? "press" : "down"), function (a) {
                var b = a.data.getKeystroke(), c = this.document.getById(this.id).getAttribute("dir");
                this._.onKeyDown && !1 === this._.onKeyDown(b) ? a.data.preventDefault() : (27 == b || b == ("rtl" == c ? 39 : 37)) && this.onEscape && !1 === this.onEscape(b) && a.data.preventDefault()
              }, this);
              a = a.getBody();
              a.unselectable();
              CKEDITOR.env.air && CKEDITOR.tools.callFunction(b)
            } else a = this.document.getById(this.id);
            this._.holder = a
          }
          return a
        };
        var c =
        {
          editorId: a.id,
          id: this.id,
          langCode: a.langCode,
          dir: a.lang.dir,
          cls: this.className,
          frame: "",
          env: CKEDITOR.env.cssClass,
          "z-index": a.config.baseFloatZIndex + 1
        };
        if (this.isFramed) {
          var d = CKEDITOR.env.air ? "javascript:void(0)" : CKEDITOR.env.ie ? "javascript:void(function(){" + encodeURIComponent("document.open();(" + CKEDITOR.tools.fixDomain + ")();document.close();") + "}())" : "";
          c.frame = f.output({id: this.id + "_frame", src: d})
        }
        d = e.output(c);
        b && b.push(d);
        return d
      }, addBlock: function (a, b) {
        b = this._.blocks[a] = b instanceof CKEDITOR.ui.panel.block ?
          b : new CKEDITOR.ui.panel.block(this.getHolderElement(), b);
        this._.currentBlock || this.showBlock(a);
        return b
      }, getBlock: function (a) {
        return this._.blocks[a]
      }, showBlock: function (a) {
        var a = this._.blocks[a], b = this._.currentBlock, c = !this.forceIFrame || CKEDITOR.env.ie ? this._.holder : this.document.getById(this.id + "_frame");
        b && b.hide();
        this._.currentBlock = a;
        CKEDITOR.fire("ariaWidget", c);
        a._.focusIndex = -1;
        this._.onKeyDown = a.onKeyDown && CKEDITOR.tools.bind(a.onKeyDown, a);
        a.show();
        return a
      }, destroy: function () {
        this.element &&
        this.element.remove()
      }
    };
    CKEDITOR.ui.panel.block = CKEDITOR.tools.createClass({
      $: function (a, b) {
        this.element = a.append(a.getDocument().createElement("div", {
          attributes: {
            tabindex: -1,
            "class": "cke_panel_block"
          }, styles: {display: "none"}
        }));
        b && CKEDITOR.tools.extend(this, b);
        this.element.setAttributes({
          role: this.attributes.role || "presentation",
          "aria-label": this.attributes["aria-label"],
          title: this.attributes.title || this.attributes["aria-label"]
        });
        this.keys = {};
        this._.focusIndex = -1;
        this.element.disableContextMenu()
      },
      _: {
        markItem: function (a) {
          -1 != a && (a = this.element.getElementsByTag("a").getItem(this._.focusIndex = a), (CKEDITOR.env.webkit || CKEDITOR.env.opera) && a.getDocument().getWindow().focus(), a.focus(), this.onMark && this.onMark(a))
        }
      }, proto: {
        show: function () {
          this.element.setStyle("display", "")
        }, hide: function () {
          (!this.onHide || !0 !== this.onHide.call(this)) && this.element.setStyle("display", "none")
        }, onKeyDown: function (a) {
          var b = this.keys[a];
          switch (b) {
            case "next":
              for (var a = this._.focusIndex, b = this.element.getElementsByTag("a"),
                     c; c = b.getItem(++a);)if (c.getAttribute("_cke_focus") && c.$.offsetWidth) {
                this._.focusIndex = a;
                c.focus();
                break
              }
              return !1;
            case "prev":
              a = this._.focusIndex;
              for (b = this.element.getElementsByTag("a"); 0 < a && (c = b.getItem(--a));)if (c.getAttribute("_cke_focus") && c.$.offsetWidth) {
                this._.focusIndex = a;
                c.focus();
                break
              }
              return !1;
            case "click":
            case "mouseup":
              return a = this._.focusIndex, (c = 0 <= a && this.element.getElementsByTag("a").getItem(a)) && (c.$[b] ? c.$[b]() : c.$["on" + b]()), !1
          }
          return !0
        }
      }
    })
  })();
  CKEDITOR.plugins.add("floatpanel", {requires: "panel"});
  (function () {
    function q(a, b, c, i, f) {
      var f = CKEDITOR.tools.genKey(b.getUniqueId(), c.getUniqueId(), a.lang.dir, a.uiColor || "", i.css || "", f || ""), h = g[f];
      h || (h = g[f] = new CKEDITOR.ui.panel(b, i), h.element = c.append(CKEDITOR.dom.element.createFromHtml(h.render(a), b)), h.element.setStyles({
        display: "none",
        position: "absolute"
      }));
      return h
    }

    var g = {};
    CKEDITOR.ui.floatPanel = CKEDITOR.tools.createClass({
      $: function (a, b, c, i) {
        function f() {
          d.hide()
        }

        c.forceIFrame = 1;
        c.toolbarRelated && a.elementMode == CKEDITOR.ELEMENT_MODE_INLINE &&
        (b = CKEDITOR.document.getById("cke_" + a.name));
        var h = b.getDocument(), i = q(a, h, b, c, i || 0), j = i.element, l = j.getFirst(), d = this;
        j.disableContextMenu();
        this.element = j;
        this._ = {
          editor: a,
          panel: i,
          parentElement: b,
          definition: c,
          document: h,
          iframe: l,
          children: [],
          dir: a.lang.dir
        };
        a.on("mode", f);
        a.on("resize", f);
        h.getWindow().on("resize", f)
      }, proto: {
        addBlock: function (a, b) {
          return this._.panel.addBlock(a, b)
        }, addListBlock: function (a, b) {
          return this._.panel.addListBlock(a, b)
        }, getBlock: function (a) {
          return this._.panel.getBlock(a)
        },
        showBlock: function (a, b, c, i, f, h) {
          var j = this._.panel, l = j.showBlock(a);
          this.allowBlur(!1);
          a = this._.editor.editable();
          this._.returnFocus = a.hasFocus ? a : new CKEDITOR.dom.element(CKEDITOR.document.$.activeElement);
          var d = this.element, a = this._.iframe, a = CKEDITOR.env.ie ? a : new CKEDITOR.dom.window(a.$.contentWindow), g = d.getDocument(), o = this._.parentElement.getPositionedAncestor(), p = b.getDocumentPosition(g), g = o ? o.getDocumentPosition(g) : {
            x: 0,
            y: 0
          }, m = "rtl" == this._.dir, e = p.x + (i || 0) - g.x, k = p.y + (f || 0) - g.y;
          if (m && (1 == c ||
            4 == c))e += b.$.offsetWidth; else if (!m && (2 == c || 3 == c))e += b.$.offsetWidth - 1;
          if (3 == c || 4 == c)k += b.$.offsetHeight - 1;
          this._.panel._.offsetParentId = b.getId();
          d.setStyles({top: k + "px", left: 0, display: ""});
          d.setOpacity(0);
          d.getFirst().removeStyle("width");
          this._.editor.focusManager.add(a);
          this._.blurSet || (CKEDITOR.event.useCapture = !0, a.on("blur", function (a) {
            this.allowBlur() && a.data.getPhase() == CKEDITOR.EVENT_PHASE_AT_TARGET && (this.visible && !this._.activeChild) && (delete this._.returnFocus, this.hide())
          }, this), a.on("focus",
            function () {
              this._.focused = !0;
              this.hideChild();
              this.allowBlur(!0)
            }, this), CKEDITOR.event.useCapture = !1, this._.blurSet = 1);
          j.onEscape = CKEDITOR.tools.bind(function (a) {
            if (this.onEscape && this.onEscape(a) === false)return false
          }, this);
          CKEDITOR.tools.setTimeout(function () {
            var a = CKEDITOR.tools.bind(function () {
              d.removeStyle("width");
              if (l.autoSize) {
                var a = l.element.getDocument(), a = (CKEDITOR.env.webkit ? l.element : a.getBody()).$.scrollWidth;
                CKEDITOR.env.ie && (CKEDITOR.env.quirks && a > 0) && (a = a + ((d.$.offsetWidth || 0) - (d.$.clientWidth ||
                  0) + 3));
                d.setStyle("width", a + 10 + "px");
                a = l.element.$.scrollHeight;
                CKEDITOR.env.ie && (CKEDITOR.env.quirks && a > 0) && (a = a + ((d.$.offsetHeight || 0) - (d.$.clientHeight || 0) + 3));
                d.setStyle("height", a + "px");
                j._.currentBlock.element.setStyle("display", "none").removeStyle("display")
              } else d.removeStyle("height");
              m && (e = e - d.$.offsetWidth);
              d.setStyle("left", e + "px");
              var b = j.element.getWindow(), a = d.$.getBoundingClientRect(), b = b.getViewPaneSize(), c = a.width || a.right - a.left, f = a.height || a.bottom - a.top, i = m ? a.right : b.width - a.left,
                g = m ? b.width - a.right : a.left;
              m ? i < c && (e = g > c ? e + c : b.width > c ? e - a.left : e - a.right + b.width) : i < c && (e = g > c ? e - c : b.width > c ? e - a.right + b.width : e - a.left);
              c = a.top;
              b.height - a.top < f && (k = c > f ? k - f : b.height > f ? k - a.bottom + b.height : k - a.top);
              if (CKEDITOR.env.ie) {
                b = a = new CKEDITOR.dom.element(d.$.offsetParent);
                b.getName() == "html" && (b = b.getDocument().getBody());
                b.getComputedStyle("direction") == "rtl" && (e = CKEDITOR.env.ie8Compat ? e - d.getDocument().getDocumentElement().$.scrollLeft * 2 : e - (a.$.scrollWidth - a.$.clientWidth))
              }
              var a = d.getFirst(),
                n;
              (n = a.getCustomData("activePanel")) && n.onHide && n.onHide.call(this, 1);
              a.setCustomData("activePanel", this);
              d.setStyles({top: k + "px", left: e + "px"});
              d.setOpacity(1);
              h && h()
            }, this);
            j.isLoaded ? a() : j.onLoad = a;
            CKEDITOR.tools.setTimeout(function () {
              var a = CKEDITOR.env.webkit && CKEDITOR.document.getWindow().getScrollPosition().y;
              this.focus();
              l.element.focus();
              if (CKEDITOR.env.webkit)CKEDITOR.document.getBody().$.scrollTop = a;
              this.allowBlur(true);
              this._.editor.fire("panelShow", this)
            }, 0, this)
          }, CKEDITOR.env.air ? 200 :
            0, this);
          this.visible = 1;
          this.onShow && this.onShow.call(this)
        }, focus: function () {
          if (CKEDITOR.env.webkit) {
            var a = CKEDITOR.document.getActive();
            !a.equals(this._.iframe) && a.$.blur()
          }
          (this._.lastFocused || this._.iframe.getFrameDocument().getWindow()).focus()
        }, blur: function () {
          var a = this._.iframe.getFrameDocument().getActive();
          a.is("a") && (this._.lastFocused = a)
        }, hide: function (a) {
          if (this.visible && (!this.onHide || !0 !== this.onHide.call(this))) {
            this.hideChild();
            CKEDITOR.env.gecko && this._.iframe.getFrameDocument().$.activeElement.blur();
            this.element.setStyle("display", "none");
            this.visible = 0;
            this.element.getFirst().removeCustomData("activePanel");
            if (a = a && this._.returnFocus)CKEDITOR.env.webkit && a.type && a.getWindow().$.focus(), a.focus();
            delete this._.lastFocused;
            this._.editor.fire("panelHide", this)
          }
        }, allowBlur: function (a) {
          var b = this._.panel;
          void 0 != a && (b.allowBlur = a);
          return b.allowBlur
        }, showAsChild: function (a, b, c, g, f, h) {
          this._.activeChild == a && a._.panel._.offsetParentId == c.getId() || (this.hideChild(), a.onHide = CKEDITOR.tools.bind(function () {
            CKEDITOR.tools.setTimeout(function () {
              this._.focused ||
              this.hide()
            }, 0, this)
          }, this), this._.activeChild = a, this._.focused = !1, a.showBlock(b, c, g, f, h), this.blur(), (CKEDITOR.env.ie7Compat || CKEDITOR.env.ie6Compat) && setTimeout(function () {
            a.element.getChild(0).$.style.cssText += ""
          }, 100))
        }, hideChild: function (a) {
          var b = this._.activeChild;
          b && (delete b.onHide, delete this._.activeChild, b.hide(), a && this.focus())
        }
      }
    });
    CKEDITOR.on("instanceDestroyed", function () {
      var a = CKEDITOR.tools.isEmpty(CKEDITOR.instances), b;
      for (b in g) {
        var c = g[b];
        a ? c.destroy() : c.element.hide()
      }
      a && (g =
      {})
    })
  })();
  CKEDITOR.plugins.add("menu", {
    requires: "floatpanel", beforeInit: function (k) {
      for (var g = k.config.menu_groups.split(","), m = k._.menuGroups = {}, l = k._.menuItems = {}, a = 0; a < g.length; a++)m[g[a]] = a + 1;
      k.addMenuGroup = function (b, a) {
        m[b] = a || 100
      };
      k.addMenuItem = function (a, c) {
        m[c.group] && (l[a] = new CKEDITOR.menuItem(this, a, c))
      };
      k.addMenuItems = function (a) {
        for (var c in a)this.addMenuItem(c, a[c])
      };
      k.getMenuItem = function (a) {
        return l[a]
      };
      k.removeMenuItem = function (a) {
        delete l[a]
      }
    }
  });
  (function () {
    function k(a) {
      a.sort(function (a, c) {
        return a.group < c.group ? -1 : a.group > c.group ? 1 : a.order < c.order ? -1 : a.order > c.order ? 1 : 0
      })
    }

    var g = '<span class="cke_menuitem"><a id="{id}" class="cke_menubutton cke_menubutton__{name} cke_menubutton_{state} {cls}" href="{href}" title="{title}" tabindex="-1"_cke_focus=1 hidefocus="true" role="menuitem" aria-haspopup="{hasPopup}" aria-disabled="{disabled}"';
    if (CKEDITOR.env.opera || CKEDITOR.env.gecko && CKEDITOR.env.mac)g += ' onkeypress="return false;"';
    CKEDITOR.env.gecko &&
    (g += ' onblur="this.style.cssText = this.style.cssText;"');
    var g = g + (' onmouseover="CKEDITOR.tools.callFunction({hoverFn},{index});" onmouseout="CKEDITOR.tools.callFunction({moveOutFn},{index});" ' + (CKEDITOR.env.ie ? 'onclick="return false;" onmouseup' : "onclick") + '="CKEDITOR.tools.callFunction({clickFn},{index}); return false;">'), m = CKEDITOR.addTemplate("menuItem", g + '<span class="cke_menubutton_inner"><span class="cke_menubutton_icon"><span class="cke_button_icon cke_button__{iconName}_icon" style="{iconStyle}"></span></span><span class="cke_menubutton_label">{label}</span>{arrowHtml}</span></a></span>'),
      l = CKEDITOR.addTemplate("menuArrow", '<span class="cke_menuarrow"><span>{label}</span></span>');
    CKEDITOR.menu = CKEDITOR.tools.createClass({
      $: function (a, b) {
        b = this._.definition = b || {};
        this.id = CKEDITOR.tools.getNextId();
        this.editor = a;
        this.items = [];
        this._.listeners = [];
        this._.level = b.level || 1;
        var c = CKEDITOR.tools.extend({}, b.panel, {
          css: [CKEDITOR.skin.getPath("editor")],
          level: this._.level - 1,
          block: {}
        }), j = c.block.attributes = c.attributes || {};
        !j.role && (j.role = "menu");
        this._.panelDefinition = c
      }, _: {
        onShow: function () {
          var a =
            this.editor.getSelection(), b = a && a.getStartElement(), c = this.editor.elementPath(), j = this._.listeners;
          this.removeAll();
          for (var e = 0; e < j.length; e++) {
            var i = j[e](b, a, c);
            if (i)for (var f in i) {
              var h = this.editor.getMenuItem(f);
              if (h && (!h.command || this.editor.getCommand(h.command).state))h.state = i[f], this.add(h)
            }
          }
        }, onClick: function (a) {
          this.hide();
          if (a.onClick)a.onClick(); else a.command && this.editor.execCommand(a.command)
        }, onEscape: function (a) {
          var b = this.parent;
          b ? b._.panel.hideChild(1) : 27 == a && this.hide(1);
          return !1
        },
        onHide: function () {
          this.onHide && this.onHide()
        }, showSubMenu: function (a) {
          var b = this._.subMenu, c = this.items[a];
          if (c = c.getItems && c.getItems()) {
            b ? b.removeAll() : (b = this._.subMenu = new CKEDITOR.menu(this.editor, CKEDITOR.tools.extend({}, this._.definition, {level: this._.level + 1}, !0)), b.parent = this, b._.onClick = CKEDITOR.tools.bind(this._.onClick, this));
            for (var j in c) {
              var e = this.editor.getMenuItem(j);
              e && (e.state = c[j], b.add(e))
            }
            var i = this._.panel.getBlock(this.id).element.getDocument().getById(this.id + ("" + a));
            setTimeout(function () {
              b.show(i,
                2)
            }, 0)
          } else this._.panel.hideChild(1)
        }
      }, proto: {
        add: function (a) {
          a.order || (a.order = this.items.length);
          this.items.push(a)
        }, removeAll: function () {
          this.items = []
        }, show: function (a, b, c, j) {
          if (!this.parent && (this._.onShow(), !this.items.length))return;
          var b = b || ("rtl" == this.editor.lang.dir ? 2 : 1), e = this.items, i = this.editor, f = this._.panel, h = this._.element;
          if (!f) {
            f = this._.panel = new CKEDITOR.ui.floatPanel(this.editor, CKEDITOR.document.getBody(), this._.panelDefinition, this._.level);
            f.onEscape = CKEDITOR.tools.bind(function (a) {
              if (!1 ===
                this._.onEscape(a))return !1
            }, this);
            f.onShow = function () {
              f._.panel.getHolderElement().getParent().addClass("cke cke_reset_all")
            };
            f.onHide = CKEDITOR.tools.bind(function () {
              this._.onHide && this._.onHide()
            }, this);
            h = f.addBlock(this.id, this._.panelDefinition.block);
            h.autoSize = !0;
            var d = h.keys;
            d[40] = "next";
            d[9] = "next";
            d[38] = "prev";
            d[CKEDITOR.SHIFT + 9] = "prev";
            d["rtl" == i.lang.dir ? 37 : 39] = CKEDITOR.env.ie ? "mouseup" : "click";
            d[32] = CKEDITOR.env.ie ? "mouseup" : "click";
            CKEDITOR.env.ie && (d[13] = "mouseup");
            h = this._.element =
              h.element;
            d = h.getDocument();
            d.getBody().setStyle("overflow", "hidden");
            d.getElementsByTag("html").getItem(0).setStyle("overflow", "hidden");
            this._.itemOverFn = CKEDITOR.tools.addFunction(function (a) {
              clearTimeout(this._.showSubTimeout);
              this._.showSubTimeout = CKEDITOR.tools.setTimeout(this._.showSubMenu, i.config.menu_subMenuDelay || 400, this, [a])
            }, this);
            this._.itemOutFn = CKEDITOR.tools.addFunction(function () {
              clearTimeout(this._.showSubTimeout)
            }, this);
            this._.itemClickFn = CKEDITOR.tools.addFunction(function (a) {
              var b =
                this.items[a];
              if (b.state == CKEDITOR.TRISTATE_DISABLED)this.hide(1); else if (b.getItems)this._.showSubMenu(a); else this._.onClick(b)
            }, this)
          }
          k(e);
          for (var d = i.elementPath(), d = ['<div class="cke_menu' + (d && d.direction() != i.lang.dir ? " cke_mixed_dir_content" : "") + '" role="presentation">'], g = e.length, m = g && e[0].group, l = 0; l < g; l++) {
            var n = e[l];
            m != n.group && (d.push('<div class="cke_menuseparator" role="separator"></div>'), m = n.group);
            n.render(this, l, d)
          }
          d.push("</div>");
          h.setHtml(d.join(""));
          CKEDITOR.ui.fire("ready",
            this);
          this.parent ? this.parent._.panel.showAsChild(f, this.id, a, b, c, j) : f.showBlock(this.id, a, b, c, j);
          i.fire("menuShow", [f])
        }, addListener: function (a) {
          this._.listeners.push(a)
        }, hide: function (a) {
          this._.onHide && this._.onHide();
          this._.panel && this._.panel.hide(a)
        }
      }
    });
    CKEDITOR.menuItem = CKEDITOR.tools.createClass({
      $: function (a, b, c) {
        CKEDITOR.tools.extend(this, c, {order: 0, className: "cke_menubutton__" + b});
        this.group = a._.menuGroups[this.group];
        this.editor = a;
        this.name = b
      }, proto: {
        render: function (a, b, c) {
          var g = a.id + ("" +
            b), e = "undefined" == typeof this.state ? CKEDITOR.TRISTATE_OFF : this.state, i = e == CKEDITOR.TRISTATE_ON ? "on" : e == CKEDITOR.TRISTATE_DISABLED ? "disabled" : "off", f = this.getItems, h = "&#" + ("rtl" == this.editor.lang.dir ? "9668" : "9658") + ";", d = this.name;
          this.icon && !/\./.test(this.icon) && (d = this.icon);
          a = {
            id: g,
            name: this.name,
            iconName: d,
            label: this.label,
            cls: this.className || "",
            state: i,
            hasPopup: f ? "true" : "false",
            disabled: e == CKEDITOR.TRISTATE_DISABLED,
            title: this.label,
            href: "javascript:void('" + (this.label || "").replace("'") + "')",
            hoverFn: a._.itemOverFn,
            moveOutFn: a._.itemOutFn,
            clickFn: a._.itemClickFn,
            index: b,
            iconStyle: CKEDITOR.skin.getIconStyle(d, "rtl" == this.editor.lang.dir, d == this.icon ? null : this.icon, this.iconOffset),
            arrowHtml: f ? l.output({label: h}) : ""
          };
          m.output(a, c)
        }
      }
    })
  })();
  CKEDITOR.config.menu_groups = "clipboard,form,tablecell,tablecellproperties,tablerow,tablecolumn,table,anchor,link,image,flash,checkbox,radio,textfield,hiddenfield,imagebutton,button,select,textarea,div";
  CKEDITOR.plugins.add("contextmenu", {
    requires: "menu", onLoad: function () {
      CKEDITOR.plugins.contextMenu = CKEDITOR.tools.createClass({
        base: CKEDITOR.menu, $: function (b) {
          this.base.call(this, b, {
            panel: {
              className: "cke_menu_panel",
              attributes: {"aria-label": b.lang.contextmenu.options}
            }
          })
        }, proto: {
          addTarget: function (b, d) {
            if (CKEDITOR.env.opera && !("oncontextmenu"in document.body)) {
              var c;
              b.on("mousedown", function (a) {
                a = a.data;
                if (2 != a.$.button)a.getKeystroke() == CKEDITOR.CTRL + 1 && b.fire("contextmenu", a); else if (!d || !(CKEDITOR.env.mac ?
                    a.$.metaKey : a.$.ctrlKey)) {
                  var g = a.getTarget();
                  c || (g = g.getDocument(), c = g.createElement("input"), c.$.type = "button", g.getBody().append(c));
                  c.setAttribute("style", "position:absolute;top:" + (a.$.clientY - 2) + "px;left:" + (a.$.clientX - 2) + "px;width:5px;height:5px;opacity:0.01")
                }
              });
              b.on("mouseup", function (a) {
                c && (c.remove(), c = void 0, b.fire("contextmenu", a.data))
              })
            }
            b.on("contextmenu", function (a) {
              a = a.data;
              if (!d || !(CKEDITOR.env.webkit ? e : CKEDITOR.env.mac ? a.$.metaKey : a.$.ctrlKey)) {
                a.preventDefault();
                var b = a.getTarget().getDocument(),
                  c = a.getTarget().getDocument().getDocumentElement(), f = !b.equals(CKEDITOR.document), b = b.getWindow().getScrollPosition(), h = f ? a.$.clientX : a.$.pageX || b.x + a.$.clientX, i = f ? a.$.clientY : a.$.pageY || b.y + a.$.clientY;
                CKEDITOR.tools.setTimeout(function () {
                  this.open(c, null, h, i)
                }, CKEDITOR.env.ie ? 200 : 0, this)
              }
            }, this);
            if (CKEDITOR.env.opera)b.on("keypress", function (a) {
              a = a.data;
              0 === a.$.keyCode && a.preventDefault()
            });
            if (CKEDITOR.env.webkit) {
              var e, f = function () {
                e = 0
              };
              b.on("keydown", function (a) {
                e = CKEDITOR.env.mac ? a.data.$.metaKey :
                  a.data.$.ctrlKey
              });
              b.on("keyup", f);
              b.on("contextmenu", f)
            }
          }, open: function (b, d, c, e) {
            this.editor.focus();
            b = b || CKEDITOR.document.getDocumentElement();
            this.editor.selectionChange(1);
            this.show(b, d, c, e)
          }
        }
      })
    }, beforeInit: function (b) {
      var d = b.contextMenu = new CKEDITOR.plugins.contextMenu(b);
      b.on("contentDom", function () {
        d.addTarget(b.editable(), !1 !== b.config.browserContextMenuOnCtrl)
      });
      b.addCommand("contextMenu", {
        exec: function () {
          b.contextMenu.open(b.document.getBody())
        }
      });
      b.setKeystroke(CKEDITOR.SHIFT + 121, "contextMenu");
      b.setKeystroke(CKEDITOR.CTRL + CKEDITOR.SHIFT + 121, "contextMenu")
    }
  });
  CKEDITOR.plugins.add("resize", {
    init: function (b) {
      var f, g, n, o, a = b.config, q = b.ui.spaceId("resizer"), h = b.element ? b.element.getDirection(1) : "ltr";
      !a.resize_dir && (a.resize_dir = "vertical");
      void 0 == a.resize_maxWidth && (a.resize_maxWidth = 3E3);
      void 0 == a.resize_maxHeight && (a.resize_maxHeight = 3E3);
      void 0 == a.resize_minWidth && (a.resize_minWidth = 750);
      void 0 == a.resize_minHeight && (a.resize_minHeight = 250);
      if (!1 !== a.resize_enabled) {
        var c = null, i = ("both" == a.resize_dir || "horizontal" == a.resize_dir) && a.resize_minWidth != a.resize_maxWidth,
          l = ("both" == a.resize_dir || "vertical" == a.resize_dir) && a.resize_minHeight != a.resize_maxHeight, j = function (d) {
            var e = f, m = g, c = e + (d.data.$.screenX - n) * ("rtl" == h ? -1 : 1), d = m + (d.data.$.screenY - o);
            i && (e = Math.max(a.resize_minWidth, Math.min(c, a.resize_maxWidth)));
            l && (m = Math.max(a.resize_minHeight, Math.min(d, a.resize_maxHeight)));
            b.resize(i ? e : null, m)
          }, k = function () {
            CKEDITOR.document.removeListener("mousemove", j);
            CKEDITOR.document.removeListener("mouseup", k);
            b.document && (b.document.removeListener("mousemove", j), b.document.removeListener("mouseup",
              k))
          }, p = CKEDITOR.tools.addFunction(function (d) {
            c || (c = b.getResizable());
            f = c.$.offsetWidth || 0;
            g = c.$.offsetHeight || 0;
            n = d.screenX;
            o = d.screenY;
            a.resize_minWidth > f && (a.resize_minWidth = f);
            a.resize_minHeight > g && (a.resize_minHeight = g);
            CKEDITOR.document.on("mousemove", j);
            CKEDITOR.document.on("mouseup", k);
            b.document && (b.document.on("mousemove", j), b.document.on("mouseup", k));
            d.preventDefault && d.preventDefault()
          });
        b.on("destroy", function () {
          CKEDITOR.tools.removeFunction(p)
        });
        b.on("uiSpace", function (a) {
          if ("bottom" ==
            a.data.space) {
            var e = "";
            i && !l && (e = " cke_resizer_horizontal");
            !i && l && (e = " cke_resizer_vertical");
            var c = '<span id="' + q + '" class="cke_resizer' + e + " cke_resizer_" + h + '" title="' + CKEDITOR.tools.htmlEncode(b.lang.common.resize) + '" onmousedown="CKEDITOR.tools.callFunction(' + p + ', event)">' + ("ltr" == h ? "◢" : "◣") + "</span>";
            "ltr" == h && "ltr" == e ? a.data.html += c : a.data.html = c + a.data.html
          }
        }, b, null, 100);
        b.on("maximize", function (a) {
          b.ui.space("resizer")[a.data == CKEDITOR.TRISTATE_ON ? "hide" : "show"]()
        })
      }
    }
  });
  (function () {
    var c = '<a id="{id}" class="cke_button cke_button__{name} cke_button_{state} {cls}"' + (CKEDITOR.env.gecko && 10900 <= CKEDITOR.env.version && !CKEDITOR.env.hc ? "" : '" href="javascript:void(\'{titleJs}\')"') + ' title="{title}" tabindex="-1" hidefocus="true" role="button" aria-labelledby="{id}_label" aria-haspopup="{hasArrow}"';
    if (CKEDITOR.env.opera || CKEDITOR.env.gecko && CKEDITOR.env.mac)c += ' onkeypress="return false;"';
    CKEDITOR.env.gecko && (c += ' onblur="this.style.cssText = this.style.cssText;"');
    var c =
        c + (' onkeydown="return CKEDITOR.tools.callFunction({keydownFn},event);" onfocus="return CKEDITOR.tools.callFunction({focusFn},event);"  onmousedown="return CKEDITOR.tools.callFunction({mousedownFn},event);" ' + (CKEDITOR.env.ie ? 'onclick="return false;" onmouseup' : "onclick") + '="CKEDITOR.tools.callFunction({clickFn},this);return false;"><span class="cke_button_icon cke_button__{iconName}_icon" style="{style}"'), c = c + '>&nbsp;</span><span id="{id}_label" class="cke_button_label cke_button__{name}_label" aria-hidden="false">{label}</span>{arrowHtml}</a>',
      m = CKEDITOR.addTemplate("buttonArrow", '<span class="cke_button_arrow">' + (CKEDITOR.env.hc ? "&#9660;" : "") + "</span>"), n = CKEDITOR.addTemplate("button", c);
    CKEDITOR.plugins.add("button", {
      beforeInit: function (a) {
        a.ui.addHandler(CKEDITOR.UI_BUTTON, CKEDITOR.ui.button.handler)
      }
    });
    CKEDITOR.UI_BUTTON = "button";
    CKEDITOR.ui.button = function (a) {
      CKEDITOR.tools.extend(this, a, {
        title: a.label, click: a.click || function (b) {
          b.execCommand(a.command)
        }
      });
      this._ = {}
    };
    CKEDITOR.ui.button.handler = {
      create: function (a) {
        return new CKEDITOR.ui.button(a)
      }
    };
    CKEDITOR.ui.button.prototype = {
      render: function (a, b) {
        var c = CKEDITOR.env, i = this._.id = CKEDITOR.tools.getNextId(), f = "", e = this.command, l;
        this._.editor = a;
        var d = {
          id: i, button: this, editor: a, focus: function () {
            CKEDITOR.document.getById(i).focus()
          }, execute: function () {
            this.button.click(a)
          }, attach: function (a) {
            this.button.attach(a)
          }
        }, o = CKEDITOR.tools.addFunction(function (a) {
          if (d.onkey)return a = new CKEDITOR.dom.event(a), !1 !== d.onkey(d, a.getKeystroke())
        }), p = CKEDITOR.tools.addFunction(function (a) {
          var b;
          d.onfocus && (b =
            !1 !== d.onfocus(d, new CKEDITOR.dom.event(a)));
          CKEDITOR.env.gecko && 10900 > CKEDITOR.env.version && a.preventBubble();
          return b
        }), j = 0, q = CKEDITOR.tools.addFunction(function () {
          if (CKEDITOR.env.opera) {
            var b = a.editable();
            b.isInline() && b.hasFocus && (a.lockSelection(), j = 1)
          }
        });
        d.clickFn = l = CKEDITOR.tools.addFunction(function () {
          j && (a.unlockSelection(1), j = 0);
          d.execute()
        });
        if (this.modes) {
          var k = {}, g = function () {
            var b = a.mode;
            b && (b = this.modes[b] ? void 0 != k[b] ? k[b] : CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED, b = a.readOnly && !this.readOnly ? CKEDITOR.TRISTATE_DISABLED : b, this.setState(b), this.refresh && this.refresh())
          };
          a.on("beforeModeUnload", function () {
            a.mode && this._.state != CKEDITOR.TRISTATE_DISABLED && (k[a.mode] = this._.state)
          }, this);
          a.on("activeFilterChange", g, this);
          a.on("mode", g, this);
          !this.readOnly && a.on("readOnly", g, this)
        } else if (e && (e = a.getCommand(e)))e.on("state", function () {
          this.setState(e.state)
        }, this), f += e.state == CKEDITOR.TRISTATE_ON ? "on" : e.state == CKEDITOR.TRISTATE_DISABLED ? "disabled" : "off";
        if (this.directional)a.on("contentDirChanged",
          function (b) {
            var c = CKEDITOR.document.getById(this._.id), d = c.getFirst(), b = b.data;
            b != a.lang.dir ? c.addClass("cke_" + b) : c.removeClass("cke_ltr").removeClass("cke_rtl");
            d.setAttribute("style", CKEDITOR.skin.getIconStyle(h, "rtl" == b, this.icon, this.iconOffset))
          }, this);
        e || (f += "off");
        var h = g = this.name || this.command;
        this.icon && !/\./.test(this.icon) && (h = this.icon, this.icon = null);
        c = {
          id: i,
          name: g,
          iconName: h,
          label: this.label,
          cls: this.className || "",
          state: f,
          title: this.title,
          titleJs: c.gecko && 10900 <= c.version && !c.hc ? "" :
            (this.title || "").replace("'", ""),
          hasArrow: this.hasArrow ? "true" : "false",
          keydownFn: o,
          mousedownFn: q,
          focusFn: p,
          clickFn: l,
          style: CKEDITOR.skin.getIconStyle(h, "rtl" == a.lang.dir, this.icon, this.iconOffset),
          arrowHtml: this.hasArrow ? m.output() : ""
        };
        n.output(c, b);
        if (this.onRender)this.onRender();
        return d
      }, setState: function (a) {
        if (this._.state == a)return !1;
        this._.state = a;
        var b = CKEDITOR.document.getById(this._.id);
        return b ? (b.setState(a, "cke_button"), a == CKEDITOR.TRISTATE_DISABLED ? b.setAttribute("aria-disabled", !0) :
          b.removeAttribute("aria-disabled"), a == CKEDITOR.TRISTATE_ON ? b.setAttribute("aria-pressed", !0) : b.removeAttribute("aria-pressed"), !0) : !1
      }, getState: function () {
        return this._.state
      }, toFeature: function (a) {
        if (this._.feature)return this._.feature;
        var b = this;
        !this.allowedContent && (!this.requiredContent && this.command) && (b = a.getCommand(this.command) || b);
        return this._.feature = b
      }
    };
    CKEDITOR.ui.prototype.addButton = function (a, b) {
      this.add(a, CKEDITOR.UI_BUTTON, b)
    }
  })();
  (function () {
    function w(a) {
      function d() {
        for (var b = i(), e = CKEDITOR.tools.clone(a.config.toolbarGroups) || n(a), f = 0; f < e.length; f++) {
          var k = e[f];
          if ("/" != k) {
            "string" == typeof k && (k = e[f] = {name: k});
            var j, d = k.groups;
            if (d)for (var h = 0; h < d.length; h++)j = d[h], (j = b[j]) && c(k, j);
            (j = b[k.name]) && c(k, j)
          }
        }
        return e
      }

      function i() {
        var b = {}, c, f, e;
        for (c in a.ui.items)f = a.ui.items[c], e = f.toolbar || "others", e = e.split(","), f = e[0], e = parseInt(e[1] || -1, 10), b[f] || (b[f] = []), b[f].push({
          name: c,
          order: e
        });
        for (f in b)b[f] = b[f].sort(function (b,
                                               a) {
          return b.order == a.order ? 0 : 0 > a.order ? -1 : 0 > b.order ? 1 : b.order < a.order ? -1 : 1
        });
        return b
      }

      function c(c, e) {
        if (e.length) {
          c.items ? c.items.push(a.ui.create("-")) : c.items = [];
          for (var f; f = e.shift();)if (f = "string" == typeof f ? f : f.name, !b || -1 == CKEDITOR.tools.indexOf(b, f))(f = a.ui.create(f)) && a.addFeature(f) && c.items.push(f)
        }
      }

      function h(b) {
        var a = [], e, d, h;
        for (e = 0; e < b.length; ++e)d = b[e], h = {}, "/" == d ? a.push(d) : CKEDITOR.tools.isArray(d) ? (c(h, CKEDITOR.tools.clone(d)), a.push(h)) : d.items && (c(h, CKEDITOR.tools.clone(d.items)),
          h.name = d.name, a.push(h));
        return a
      }

      var b = a.config.removeButtons, b = b && b.split(","), e = a.config.toolbar;
      "string" == typeof e && (e = a.config["toolbar_" + e]);
      return a.toolbar = e ? h(e) : d()
    }

    function n(a) {
      return a._.toolbarGroups || (a._.toolbarGroups = [{
          name: "document",
          groups: ["mode", "document", "doctools"]
        }, {name: "clipboard", groups: ["clipboard", "undo"]}, {
          name: "editing",
          groups: ["find", "selection", "spellchecker"]
        }, {name: "forms"}, "/", {name: "basicstyles", groups: ["basicstyles", "cleanup"]}, {
          name: "paragraph", groups: ["list",
            "indent", "blocks", "align", "bidi"]
        }, {name: "links"}, {name: "insert"}, "/", {name: "styles"}, {name: "colors"}, {name: "tools"}, {name: "others"}, {name: "about"}])
    }

    var t = function () {
      this.toolbars = [];
      this.focusCommandExecuted = !1
    };
    t.prototype.focus = function () {
      for (var a = 0, d; d = this.toolbars[a++];)for (var i = 0, c; c = d.items[i++];)if (c.focus) {
        c.focus();
        return
      }
    };
    var x = {
      modes: {wysiwyg: 1, source: 1}, readOnly: 1, exec: function (a) {
        a.toolbox && (a.toolbox.focusCommandExecuted = !0, CKEDITOR.env.ie || CKEDITOR.env.air ? setTimeout(function () {
            a.toolbox.focus()
          },
          100) : a.toolbox.focus())
      }
    };
    CKEDITOR.plugins.add("toolbar", {
      requires: "button", init: function (a) {
        var d, i = function (c, h) {
          var b, e = "rtl" == a.lang.dir, g = a.config.toolbarGroupCycling, g = void 0 === g || g;
          switch (h) {
            case 9:
            case CKEDITOR.SHIFT + 9:
              for (; !b || !b.items.length;)if (b = 9 == h ? (b ? b.next : c.toolbar.next) || a.toolbox.toolbars[0] : (b ? b.previous : c.toolbar.previous) || a.toolbox.toolbars[a.toolbox.toolbars.length - 1], b.items.length)for (c = b.items[d ? b.items.length - 1 : 0]; c && !c.focus;)(c = d ? c.previous : c.next) || (b = 0);
              c && c.focus();
              return !1;
            case e ? 37 : 39:
            case 40:
              b = c;
              do b = b.next, !b && g && (b = c.toolbar.items[0]); while (b && !b.focus);
              b ? b.focus() : i(c, 9);
              return !1;
            case e ? 39 : 37:
            case 38:
              b = c;
              do b = b.previous, !b && g && (b = c.toolbar.items[c.toolbar.items.length - 1]); while (b && !b.focus);
              b ? b.focus() : (d = 1, i(c, CKEDITOR.SHIFT + 9), d = 0);
              return !1;
            case 27:
              return a.focus(), !1;
            case 13:
            case 32:
              return c.execute(), !1
          }
          return !0
        };
        a.on("uiSpace", function (c) {
          if (c.data.space == a.config.toolbarLocation) {
            c.removeListener();
            a.toolbox = new t;
            var d = CKEDITOR.tools.getNextId(),
              b = ['<span id="', d, '" class="cke_voice_label">', a.lang.toolbar.toolbars, "</span>", '<span id="' + a.ui.spaceId("toolbox") + '" class="cke_toolbox" role="group" aria-labelledby="', d, '" onmousedown="return false;">'], d = !1 !== a.config.toolbarStartupExpanded, e, g;
            a.config.toolbarCanCollapse && a.elementMode != CKEDITOR.ELEMENT_MODE_INLINE && b.push('<span class="cke_toolbox_main"' + (d ? ">" : ' style="display:none">'));
            for (var n = a.toolbox.toolbars, f = w(a), k = 0; k < f.length; k++) {
              var j, l = 0, q, m = f[k], r;
              if (m)if (e && (b.push("</span>"),
                  g = e = 0), "/" === m)b.push('<span class="cke_toolbar_break"></span>'); else {
                r = m.items || m;
                for (var s = 0; s < r.length; s++) {
                  var o = r[s], u;
                  if (o)if (o.type == CKEDITOR.UI_SEPARATOR)g = e && o; else {
                    u = !1 !== o.canGroup;
                    if (!l) {
                      j = CKEDITOR.tools.getNextId();
                      l = {id: j, items: []};
                      q = m.name && (a.lang.toolbar.toolbarGroups[m.name] || m.name);
                      b.push('<span id="', j, '" class="cke_toolbar"', q ? ' aria-labelledby="' + j + '_label"' : "", ' role="toolbar">');
                      q && b.push('<span id="', j, '_label" class="cke_voice_label">', q, "</span>");
                      b.push('<span class="cke_toolbar_start"></span>');
                      var p = n.push(l) - 1;
                      0 < p && (l.previous = n[p - 1], l.previous.next = l)
                    }
                    u ? e || (b.push('<span class="cke_toolgroup" role="presentation">'), e = 1) : e && (b.push("</span>"), e = 0);
                    j = function (c) {
                      c = c.render(a, b);
                      p = l.items.push(c) - 1;
                      if (p > 0) {
                        c.previous = l.items[p - 1];
                        c.previous.next = c
                      }
                      c.toolbar = l;
                      c.onkey = i;
                      c.onfocus = function () {
                        a.toolbox.focusCommandExecuted || a.focus()
                      }
                    };
                    g && (j(g), g = 0);
                    j(o)
                  }
                }
                e && (b.push("</span>"), g = e = 0);
                l && b.push('<span class="cke_toolbar_end"></span></span>')
              }
            }
            a.config.toolbarCanCollapse && b.push("</span>");
            if (a.config.toolbarCanCollapse &&
              a.elementMode != CKEDITOR.ELEMENT_MODE_INLINE) {
              var v = CKEDITOR.tools.addFunction(function () {
                a.execCommand("toolbarCollapse")
              });
              a.on("destroy", function () {
                CKEDITOR.tools.removeFunction(v)
              });
              a.addCommand("toolbarCollapse", {
                readOnly: 1, exec: function (b) {
                  var a = b.ui.space("toolbar_collapser"), c = a.getPrevious(), e = b.ui.space("contents"), d = c.getParent(), f = parseInt(e.$.style.height, 10), h = d.$.offsetHeight, g = a.hasClass("cke_toolbox_collapser_min");
                  g ? (c.show(), a.removeClass("cke_toolbox_collapser_min"), a.setAttribute("title",
                    b.lang.toolbar.toolbarCollapse)) : (c.hide(), a.addClass("cke_toolbox_collapser_min"), a.setAttribute("title", b.lang.toolbar.toolbarExpand));
                  a.getFirst().setText(g ? "▲" : "◀");
                  e.setStyle("height", f - (d.$.offsetHeight - h) + "px");
                  b.fire("resize")
                }, modes: {wysiwyg: 1, source: 1}
              });
              a.setKeystroke(CKEDITOR.ALT + (CKEDITOR.env.ie || CKEDITOR.env.webkit ? 189 : 109), "toolbarCollapse");
              b.push('<a title="' + (d ? a.lang.toolbar.toolbarCollapse : a.lang.toolbar.toolbarExpand) + '" id="' + a.ui.spaceId("toolbar_collapser") + '" tabIndex="-1" class="cke_toolbox_collapser');
              d || b.push(" cke_toolbox_collapser_min");
              b.push('" onclick="CKEDITOR.tools.callFunction(' + v + ')">', '<span class="cke_arrow">&#9650;</span>', "</a>")
            }
            b.push("</span>");
            c.data.html += b.join("")
          }
        });
        a.on("destroy", function () {
          if (this.toolbox) {
            var a, d = 0, b, e, g;
            for (a = this.toolbox.toolbars; d < a.length; d++) {
              e = a[d].items;
              for (b = 0; b < e.length; b++)g = e[b], g.clickFn && CKEDITOR.tools.removeFunction(g.clickFn), g.keyDownFn && CKEDITOR.tools.removeFunction(g.keyDownFn)
            }
          }
        });
        a.on("uiReady", function () {
          var c = a.ui.space("toolbox");
          c && a.focusManager.add(c, 1)
        });
        a.addCommand("toolbarFocus", x);
        a.setKeystroke(CKEDITOR.ALT + 121, "toolbarFocus");
        a.ui.add("-", CKEDITOR.UI_SEPARATOR, {});
        a.ui.addHandler(CKEDITOR.UI_SEPARATOR, {
          create: function () {
            return {
              render: function (a, d) {
                d.push('<span class="cke_toolbar_separator" role="separator"></span>');
                return {}
              }
            }
          }
        })
      }
    });
    CKEDITOR.ui.prototype.addToolbarGroup = function (a, d, i) {
      var c = n(this.editor), h = 0 === d, b = {name: a};
      if (i) {
        if (i = CKEDITOR.tools.search(c, function (a) {
            return a.name == i
          })) {
          !i.groups && (i.groups =
            []);
          if (d && (d = CKEDITOR.tools.indexOf(i.groups, d), 0 <= d)) {
            i.groups.splice(d + 1, 0, a);
            return
          }
          h ? i.groups.splice(0, 0, a) : i.groups.push(a);
          return
        }
        d = null
      }
      d && (d = CKEDITOR.tools.indexOf(c, function (a) {
        return a.name == d
      }));
      h ? c.splice(0, 0, a) : "number" == typeof d ? c.splice(d + 1, 0, b) : c.push(a)
    }
  })();
  CKEDITOR.UI_SEPARATOR = "separator";
  CKEDITOR.config.toolbarLocation = "top";
  (function () {
    var k;

    function n(a, c) {
      function j(d) {
        d = i.list[d];
        if (d.equals(a.editable()) || "true" == d.getAttribute("contenteditable")) {
          var e = a.createRange();
          e.selectNodeContents(d);
          e.select()
        } else a.getSelection().selectElement(d);
        a.focus()
      }

      function s() {
        l && l.setHtml(o);
        delete i.list
      }

      var m = a.ui.spaceId("path"), l, i = a._.elementsPath, n = i.idBase;
      c.html += '<span id="' + m + '_label" class="cke_voice_label">' + a.lang.elementspath.eleLabel + '</span><span id="' + m + '" class="cke_path" role="group" aria-labelledby="' + m +
        '_label">' + o + "</span>";
      a.on("uiReady", function () {
        var d = a.ui.space("path");
        d && a.focusManager.add(d, 1)
      });
      i.onClick = j;
      var t = CKEDITOR.tools.addFunction(j), u = CKEDITOR.tools.addFunction(function (d, e) {
        var g = i.idBase, b, e = new CKEDITOR.dom.event(e);
        b = "rtl" == a.lang.dir;
        switch (e.getKeystroke()) {
          case b ? 39 : 37:
          case 9:
            return (b = CKEDITOR.document.getById(g + (d + 1))) || (b = CKEDITOR.document.getById(g + "0")), b.focus(), !1;
          case b ? 37 : 39:
          case CKEDITOR.SHIFT + 9:
            return (b = CKEDITOR.document.getById(g + (d - 1))) || (b = CKEDITOR.document.getById(g +
              (i.list.length - 1))), b.focus(), !1;
          case 27:
            return a.focus(), !1;
          case 13:
          case 32:
            return j(d), !1
        }
        return !0
      });
      a.on("selectionChange", function () {
        a.editable();
        for (var d = [], e = i.list = [], g = [], b = i.filters, c = !0, j = a.elementPath().elements, f, k = j.length; k--;) {
          var h = j[k], p = 0;
          f = h.data("cke-display-name") ? h.data("cke-display-name") : h.data("cke-real-element-type") ? h.data("cke-real-element-type") : h.getName();
          c = h.hasAttribute("contenteditable") ? "true" == h.getAttribute("contenteditable") : c;
          !c && !h.hasAttribute("contenteditable") &&
          (p = 1);
          for (var q = 0; q < b.length; q++) {
            var r = b[q](h, f);
            if (!1 === r) {
              p = 1;
              break
            }
            f = r || f
          }
          p || (e.unshift(h), g.unshift(f))
        }
        e = e.length;
        for (b = 0; b < e; b++)f = g[b], c = a.lang.elementspath.eleTitle.replace(/%1/, f), f = v.output({
          id: n + b,
          label: c,
          text: f,
          jsTitle: "javascript:void('" + f + "')",
          index: b,
          keyDownFn: u,
          clickFn: t
        }), d.unshift(f);
        l || (l = CKEDITOR.document.getById(m));
        g = l;
        g.setHtml(d.join("") + o);
        a.fire("elementsPathUpdate", {space: g})
      });
      a.on("readOnly", s);
      a.on("contentDomUnload", s);
      a.addCommand("elementsPathFocus", k);
      a.setKeystroke(CKEDITOR.ALT +
        122, "elementsPathFocus")
    }

    k = {
      editorFocus: !1, readOnly: 1, exec: function (a) {
        (a = CKEDITOR.document.getById(a._.elementsPath.idBase + "0")) && a.focus(CKEDITOR.env.ie || CKEDITOR.env.air)
      }
    };
    var o = '<span class="cke_path_empty">&nbsp;</span>', c = "";
    if (CKEDITOR.env.opera || CKEDITOR.env.gecko && CKEDITOR.env.mac)c += ' onkeypress="return false;"';
    CKEDITOR.env.gecko && (c += ' onblur="this.style.cssText = this.style.cssText;"');
    var v = CKEDITOR.addTemplate("pathItem", '<a id="{id}" href="{jsTitle}" tabindex="-1" class="cke_path_item" title="{label}"' +
      (CKEDITOR.env.gecko && 10900 > CKEDITOR.env.version ? ' onfocus="event.preventBubble();"' : "") + c + ' hidefocus="true"  onkeydown="return CKEDITOR.tools.callFunction({keyDownFn},{index}, event );" onclick="CKEDITOR.tools.callFunction({clickFn},{index}); return false;" role="button" aria-label="{label}">{text}</a>');
    CKEDITOR.plugins.add("elementspath", {
      init: function (a) {
        a._.elementsPath = {idBase: "cke_elementspath_" + CKEDITOR.tools.getNextNumber() + "_", filters: []};
        a.on("uiSpace", function (c) {
          "bottom" == c.data.space &&
          n(a, c.data)
        })
      }
    })
  })();
  (function () {
    function l(e, c, b) {
      b = e.config.forceEnterMode || b;
      "wysiwyg" == e.mode && (c || (c = e.activeEnterMode), e.elementPath().isContextFor("p") || (c = CKEDITOR.ENTER_BR, b = 1), e.fire("saveSnapshot"), c == CKEDITOR.ENTER_BR ? o(e, c, null, b) : p(e, c, null, b), e.fire("saveSnapshot"))
    }

    function q(e) {
      for (var e = e.getSelection().getRanges(!0), c = e.length - 1; 0 < c; c--)e[c].deleteContents();
      return e[0]
    }

    CKEDITOR.plugins.add("enterkey", {
      init: function (e) {
        e.addCommand("enter", {
          modes: {wysiwyg: 1}, editorFocus: !1, exec: function (c) {
            l(c)
          }
        });
        e.addCommand("shiftEnter", {
          modes: {wysiwyg: 1}, editorFocus: !1, exec: function (c) {
            l(c, c.activeShiftEnterMode, 1)
          }
        });
        e.setKeystroke([[13, "enter"], [CKEDITOR.SHIFT + 13, "shiftEnter"]])
      }
    });
    var t = CKEDITOR.dom.walker.whitespaces(), u = CKEDITOR.dom.walker.bookmark();
    CKEDITOR.plugins.enterkey = {
      enterBlock: function (e, c, b, i) {
        if (b = b || q(e)) {
          var f = b.document, j = b.checkStartOfBlock(), h = b.checkEndOfBlock(), a = e.elementPath(b.startContainer).block, k = c == CKEDITOR.ENTER_DIV ? "div" : "p", d;
          if (j && h) {
            if (a && (a.is("li") || a.getParent().is("li"))) {
              b =
                a.getParent();
              d = b.getParent();
              var i = !a.hasPrevious(), m = !a.hasNext(), k = e.getSelection(), g = k.createBookmarks(), j = a.getDirection(1), h = a.getAttribute("class"), n = a.getAttribute("style"), l = d.getDirection(1) != j, e = e.enterMode != CKEDITOR.ENTER_BR || l || n || h;
              if (d.is("li"))if (i || m)a[i ? "insertBefore" : "insertAfter"](d); else a.breakParent(d); else {
                if (e)if (d = f.createElement(c == CKEDITOR.ENTER_P ? "p" : "div"), l && d.setAttribute("dir", j), n && d.setAttribute("style", n), h && d.setAttribute("class", h), a.moveChildren(d), i || m)d[i ?
                  "insertBefore" : "insertAfter"](b); else a.breakParent(b), d.insertAfter(b); else if (a.appendBogus(!0), i || m)for (; f = a[i ? "getFirst" : "getLast"]();)f[i ? "insertBefore" : "insertAfter"](b); else for (a.breakParent(b); f = a.getLast();)f.insertAfter(b);
                a.remove()
              }
              k.selectBookmarks(g);
              return
            }
            if (a && a.getParent().is("blockquote")) {
              a.breakParent(a.getParent());
              a.getPrevious().getFirst(CKEDITOR.dom.walker.invisible(1)) || a.getPrevious().remove();
              a.getNext().getFirst(CKEDITOR.dom.walker.invisible(1)) || a.getNext().remove();
              b.moveToElementEditStart(a);
              b.select();
              return
            }
          } else if (a && a.is("pre") && !h) {
            o(e, c, b, i);
            return
          }
          if (h = b.splitBlock(k)) {
            c = h.previousBlock;
            a = h.nextBlock;
            e = h.wasStartOfBlock;
            j = h.wasEndOfBlock;
            if (a)g = a.getParent(), g.is("li") && (a.breakParent(g), a.move(a.getNext(), 1)); else if (c && (g = c.getParent()) && g.is("li"))c.breakParent(g), g = c.getNext(), b.moveToElementEditStart(g), c.move(c.getPrevious());
            if (!e && !j)a.is("li") && (d = b.clone(), d.selectNodeContents(a), d = new CKEDITOR.dom.walker(d), d.evaluator = function (a) {
              return !(u(a) ||
              t(a) || a.type == CKEDITOR.NODE_ELEMENT && a.getName()in CKEDITOR.dtd.$inline && !(a.getName()in CKEDITOR.dtd.$empty))
            }, (g = d.next()) && (g.type == CKEDITOR.NODE_ELEMENT && g.is("ul", "ol")) && (CKEDITOR.env.needsBrFiller ? f.createElement("br") : f.createText(" ")).insertBefore(g)), a && b.moveToElementEditStart(a); else {
              if (c) {
                if (c.is("li") || !r.test(c.getName()) && !c.is("pre"))d = c.clone()
              } else a && (d = a.clone());
              d ? i && !d.is("li") && d.renameNode(k) : g && g.is("li") ? d = g : (d = f.createElement(k), c && (m = c.getDirection()) && d.setAttribute("dir",
                m));
              if (f = h.elementPath) {
                i = 0;
                for (k = f.elements.length; i < k; i++) {
                  g = f.elements[i];
                  if (g.equals(f.block) || g.equals(f.blockLimit))break;
                  CKEDITOR.dtd.$removeEmpty[g.getName()] && (g = g.clone(), d.moveChildren(g), d.append(g))
                }
              }
              d.appendBogus();
              d.getParent() || b.insertNode(d);
              d.is("li") && d.removeAttribute("value");
              if (CKEDITOR.env.ie && e && (!j || !c.getChildCount()))b.moveToElementEditStart(j ? c : d), b.select();
              b.moveToElementEditStart(e && !j ? a : d)
            }
            b.select();
            b.scrollIntoView()
          }
        }
      }, enterBr: function (e, c, b, i) {
        if (b = b || q(e)) {
          var f =
            b.document, j = b.checkEndOfBlock(), h = new CKEDITOR.dom.elementPath(e.getSelection().getStartElement()), a = h.block, h = a && h.block.getName();
          !i && "li" == h ? p(e, c, b, i) : (!i && j && r.test(h) ? (j = a.getDirection()) ? (f = f.createElement("div"), f.setAttribute("dir", j), f.insertAfter(a), b.setStart(f, 0)) : (f.createElement("br").insertAfter(a), CKEDITOR.env.gecko && f.createText("").insertAfter(a), b.setStartAt(a.getNext(), CKEDITOR.env.ie ? CKEDITOR.POSITION_BEFORE_START : CKEDITOR.POSITION_AFTER_START)) : (a = "pre" == h && CKEDITOR.env.ie &&
          8 > CKEDITOR.env.version ? f.createText("\r") : f.createElement("br"), b.deleteContents(), b.insertNode(a), CKEDITOR.env.needsBrFiller ? (f.createText("﻿").insertAfter(a), j && a.getParent().appendBogus(), a.getNext().$.nodeValue = "", b.setStartAt(a.getNext(), CKEDITOR.POSITION_AFTER_START)) : b.setStartAt(a, CKEDITOR.POSITION_AFTER_END)), b.collapse(!0), b.select(), b.scrollIntoView())
        }
      }
    };
    var s = CKEDITOR.plugins.enterkey, o = s.enterBr, p = s.enterBlock, r = /^h[1-6]$/
  })();
  (function () {
    function j(a, b) {
      var d = {}, e = [], f = {
        nbsp: " ",
        shy: "­",
        gt: ">",
        lt: "<",
        amp: "&",
        apos: "'",
        quot: '"'
      }, a = a.replace(/\b(nbsp|shy|gt|lt|amp|apos|quot)(?:,|$)/g, function (a, h) {
        var c = b ? "&" + h + ";" : f[h];
        d[c] = b ? f[h] : "&" + h + ";";
        e.push(c);
        return ""
      });
      if (!b && a) {
        var a = a.split(","), c = document.createElement("div"), g;
        c.innerHTML = "&" + a.join(";&") + ";";
        g = c.innerHTML;
        c = null;
        for (c = 0; c < g.length; c++) {
          var i = g.charAt(c);
          d[i] = "&" + a[c] + ";";
          e.push(i)
        }
      }
      d.regex = e.join(b ? "|" : "");
      return d
    }

    CKEDITOR.plugins.add("entities", {
      afterInit: function (a) {
        var b =
          a.config;
        if (a = (a = a.dataProcessor) && a.htmlFilter) {
          var d = [];
          !1 !== b.basicEntities && d.push("nbsp,gt,lt,amp");
          b.entities && (d.length && d.push("quot,iexcl,cent,pound,curren,yen,brvbar,sect,uml,copy,ordf,laquo,not,shy,reg,macr,deg,plusmn,sup2,sup3,acute,micro,para,middot,cedil,sup1,ordm,raquo,frac14,frac12,frac34,iquest,times,divide,fnof,bull,hellip,prime,Prime,oline,frasl,weierp,image,real,trade,alefsym,larr,uarr,rarr,darr,harr,crarr,lArr,uArr,rArr,dArr,hArr,forall,part,exist,empty,nabla,isin,notin,ni,prod,sum,minus,lowast,radic,prop,infin,ang,and,or,cap,cup,int,there4,sim,cong,asymp,ne,equiv,le,ge,sub,sup,nsub,sube,supe,oplus,otimes,perp,sdot,lceil,rceil,lfloor,rfloor,lang,rang,loz,spades,clubs,hearts,diams,circ,tilde,ensp,emsp,thinsp,zwnj,zwj,lrm,rlm,ndash,mdash,lsquo,rsquo,sbquo,ldquo,rdquo,bdquo,dagger,Dagger,permil,lsaquo,rsaquo,euro"),
          b.entities_latin && d.push("Agrave,Aacute,Acirc,Atilde,Auml,Aring,AElig,Ccedil,Egrave,Eacute,Ecirc,Euml,Igrave,Iacute,Icirc,Iuml,ETH,Ntilde,Ograve,Oacute,Ocirc,Otilde,Ouml,Oslash,Ugrave,Uacute,Ucirc,Uuml,Yacute,THORN,szlig,agrave,aacute,acirc,atilde,auml,aring,aelig,ccedil,egrave,eacute,ecirc,euml,igrave,iacute,icirc,iuml,eth,ntilde,ograve,oacute,ocirc,otilde,ouml,oslash,ugrave,uacute,ucirc,uuml,yacute,thorn,yuml,OElig,oelig,Scaron,scaron,Yuml"), b.entities_greek && d.push("Alpha,Beta,Gamma,Delta,Epsilon,Zeta,Eta,Theta,Iota,Kappa,Lambda,Mu,Nu,Xi,Omicron,Pi,Rho,Sigma,Tau,Upsilon,Phi,Chi,Psi,Omega,alpha,beta,gamma,delta,epsilon,zeta,eta,theta,iota,kappa,lambda,mu,nu,xi,omicron,pi,rho,sigmaf,sigma,tau,upsilon,phi,chi,psi,omega,thetasym,upsih,piv"),
          b.entities_additional && d.push(b.entities_additional));
          var e = j(d.join(",")), f = e.regex ? "[" + e.regex + "]" : "a^";
          delete e.regex;
          b.entities && b.entities_processNumerical && (f = "[^ -~]|" + f);
          var f = RegExp(f, "g"), c = function (a) {
            return b.entities_processNumerical == "force" || !e[a] ? "&#" + a.charCodeAt(0) + ";" : e[a]
          }, g = j("nbsp,gt,lt,amp,shy", !0), i = RegExp(g.regex, "g"), k = function (a) {
            return g[a]
          };
          a.addRules({
            text: function (a) {
              return a.replace(i, k).replace(f, c)
            }
          })
        }
      }
    })
  })();
  CKEDITOR.config.basicEntities = !0;
  CKEDITOR.config.entities = !0;
  CKEDITOR.config.entities_latin = !0;
  CKEDITOR.config.entities_greek = !0;
  CKEDITOR.config.entities_additional = "#39";
  CKEDITOR.plugins.add("popup");
  CKEDITOR.tools.extend(CKEDITOR.editor.prototype, {
    popup: function (e, a, b, d) {
      a = a || "80%";
      b = b || "70%";
      "string" == typeof a && (1 < a.length && "%" == a.substr(a.length - 1, 1)) && (a = parseInt(window.screen.width * parseInt(a, 10) / 100, 10));
      "string" == typeof b && (1 < b.length && "%" == b.substr(b.length - 1, 1)) && (b = parseInt(window.screen.height * parseInt(b, 10) / 100, 10));
      640 > a && (a = 640);
      420 > b && (b = 420);
      var f = parseInt((window.screen.height - b) / 2, 10), g = parseInt((window.screen.width - a) / 2, 10), d = (d || "location=no,menubar=no,toolbar=no,dependent=yes,minimizable=no,modal=yes,alwaysRaised=yes,resizable=yes,scrollbars=yes") + ",width=" +
        a + ",height=" + b + ",top=" + f + ",left=" + g, c = window.open("", null, d, !0);
      if (!c)return !1;
      try {
        -1 == navigator.userAgent.toLowerCase().indexOf(" chrome/") && (c.moveTo(g, f), c.resizeTo(a, b)), c.focus(), c.location.href = e
      } catch (h) {
        window.open(e, null, d, !0)
      }
      return !0
    }
  });
  (function () {
    function g(a, c) {
      var d = [];
      if (c)for (var b in c)d.push(b + "=" + encodeURIComponent(c[b])); else return a;
      return a + (-1 != a.indexOf("?") ? "&" : "?") + d.join("&")
    }

    function i(a) {
      a += "";
      return a.charAt(0).toUpperCase() + a.substr(1)
    }

    function k() {
      var a = this.getDialog(), c = a.getParentEditor();
      c._.filebrowserSe = this;
      var d = c.config["filebrowser" + i(a.getName()) + "WindowWidth"] || c.config.filebrowserWindowWidth || "80%", a = c.config["filebrowser" + i(a.getName()) + "WindowHeight"] || c.config.filebrowserWindowHeight || "70%",
        b = this.filebrowser.params || {};
      b.CKEditor = c.name;
      b.CKEditorFuncNum = c._.filebrowserFn;
      b.langCode || (b.langCode = c.langCode);
      b = g(this.filebrowser.url, b);
      c.popup(b, d, a, c.config.filebrowserWindowFeatures || c.config.fileBrowserWindowFeatures)
    }

    function l() {
      var a = this.getDialog();
      a.getParentEditor()._.filebrowserSe = this;
      return !a.getContentElement(this["for"][0], this["for"][1]).getInputElement().$.value || !a.getContentElement(this["for"][0], this["for"][1]).getAction() ? !1 : !0
    }

    function m(a, c, d) {
      var b = d.params || {};
      b.CKEditor = a.name;
      b.CKEditorFuncNum = a._.filebrowserFn;
      b.langCode || (b.langCode = a.langCode);
      c.action = g(d.url, b);
      c.filebrowser = d
    }

    function j(a, c, d, b) {
      if (b && b.length)for (var e, g = b.length; g--;)if (e = b[g], ("hbox" == e.type || "vbox" == e.type || "fieldset" == e.type) && j(a, c, d, e.children), e.filebrowser)if ("string" == typeof e.filebrowser && (e.filebrowser = {
          action: "fileButton" == e.type ? "QuickUpload" : "Browse",
          target: e.filebrowser
        }), "Browse" == e.filebrowser.action) {
        var f = e.filebrowser.url;
        void 0 === f && (f = a.config["filebrowser" +
        i(c) + "BrowseUrl"], void 0 === f && (f = a.config.filebrowserBrowseUrl));
        f && (e.onClick = k, e.filebrowser.url = f, e.hidden = !1)
      } else if ("QuickUpload" == e.filebrowser.action && e["for"] && (f = e.filebrowser.url, void 0 === f && (f = a.config["filebrowser" + i(c) + "UploadUrl"], void 0 === f && (f = a.config.filebrowserUploadUrl)), f)) {
        var h = e.onClick;
        e.onClick = function (a) {
          var b = a.sender;
          return h && h.call(b, a) === false ? false : l.call(b, a)
        };
        e.filebrowser.url = f;
        e.hidden = !1;
        m(a, d.getContents(e["for"][0]).get(e["for"][1]), e.filebrowser)
      }
    }

    function h(a,
               c, d) {
      if (-1 !== d.indexOf(";")) {
        for (var d = d.split(";"), b = 0; b < d.length; b++)if (h(a, c, d[b]))return !0;
        return !1
      }
      return (a = a.getContents(c).get(d).filebrowser) && a.url
    }

    function n(a, c) {
      var d = this._.filebrowserSe.getDialog(), b = this._.filebrowserSe["for"], e = this._.filebrowserSe.filebrowser.onSelect;
      b && d.getContentElement(b[0], b[1]).reset();
      if (!("function" == typeof c && !1 === c.call(this._.filebrowserSe)) && !(e && !1 === e.call(this._.filebrowserSe, a, c)) && ("string" == typeof c && c && alert(c), a && (b = this._.filebrowserSe, d = b.getDialog(),
          b = b.filebrowser.target || null)))if (b = b.split(":"), e = d.getContentElement(b[0], b[1]))e.setValue(a), d.selectPage(b[0])
    }

    CKEDITOR.plugins.add("filebrowser", {
      requires: "popup", init: function (a) {
        a._.filebrowserFn = CKEDITOR.tools.addFunction(n, a);
        a.on("destroy", function () {
          CKEDITOR.tools.removeFunction(this._.filebrowserFn)
        })
      }
    });
    CKEDITOR.on("dialogDefinition", function (a) {
      for (var c = a.data.definition, d, b = 0; b < c.contents.length; ++b)if (d = c.contents[b])j(a.editor, a.data.name, c, d.elements), d.hidden && d.filebrowser && (d.hidden = !h(c, d.id, d.filebrowser))
    })
  })();
  (function () {
    function q(a) {
      var i = a.config, l = a.fire("uiSpace", {space: "top", html: ""}).html, o = function () {
        function f(a, c, e) {
          b.setStyle(c, t(e));
          b.setStyle("position", a)
        }

        function e(a) {
          var b = r.getDocumentPosition();
          switch (a) {
            case "top":
              f("absolute", "top", b.y - m - n);
              break;
            case "pin":
              f("fixed", "top", q);
              break;
            case "bottom":
              f("absolute", "top", b.y + (c.height || c.bottom - c.top) + n)
          }
          j = a
        }

        var j, r, k, c, h, m, s, l = i.floatSpaceDockedOffsetX || 0, n = i.floatSpaceDockedOffsetY || 0, p = i.floatSpacePinnedOffsetX || 0, q = i.floatSpacePinnedOffsetY ||
          0;
        return function (d) {
          if (r = a.editable())if (d && "focus" == d.name && b.show(), b.removeStyle("left"), b.removeStyle("right"), k = b.getClientRect(), c = r.getClientRect(), h = g.getViewPaneSize(), m = k.height, s = "pageXOffset"in g.$ ? g.$.pageXOffset : CKEDITOR.document.$.documentElement.scrollLeft, j) {
            m + n <= c.top ? e("top") : m + n > h.height - c.bottom ? e("pin") : e("bottom");
            var d = h.width / 2, d = 0 < c.left && c.right < h.width && c.width > k.width ? "rtl" == a.config.contentsLangDirection ? "right" : "left" : d - c.left > c.right - d ? "left" : "right", f;
            k.width > h.width ?
              (d = "left", f = 0) : (f = "left" == d ? 0 < c.left ? c.left : 0 : c.right < h.width ? h.width - c.right : 0, f + k.width > h.width && (d = "left" == d ? "right" : "left", f = 0));
            b.setStyle(d, t(("pin" == j ? p : l) + f + ("pin" == j ? 0 : "left" == d ? s : -s)))
          } else j = "pin", e("pin"), o(d)
        }
      }();
      if (l) {
        var b = CKEDITOR.document.getBody().append(CKEDITOR.dom.element.createFromHtml(u.output({
          content: l,
          id: a.id,
          langDir: a.lang.dir,
          langCode: a.langCode,
          name: a.name,
          style: "display:none;z-index:" + (i.baseFloatZIndex - 1),
          topId: a.ui.spaceId("top"),
          voiceLabel: a.lang.editorPanel + ", " +
          a.name
        }))), p = CKEDITOR.tools.eventsBuffer(500, o), e = CKEDITOR.tools.eventsBuffer(100, o);
        b.unselectable();
        b.on("mousedown", function (a) {
          a = a.data;
          a.getTarget().hasAscendant("a", 1) || a.preventDefault()
        });
        a.on("focus", function (b) {
          o(b);
          a.on("change", p.input);
          g.on("scroll", e.input);
          g.on("resize", e.input)
        });
        a.on("blur", function () {
          b.hide();
          a.removeListener("change", p.input);
          g.removeListener("scroll", e.input);
          g.removeListener("resize", e.input)
        });
        a.on("destroy", function () {
          g.removeListener("scroll", e.input);
          g.removeListener("resize",
            e.input);
          b.clearCustomData();
          b.remove()
        });
        a.focusManager.hasFocus && b.show();
        a.focusManager.add(b, 1)
      }
    }

    var u = CKEDITOR.addTemplate("floatcontainer", '<div id="cke_{name}" class="cke {id} cke_reset_all cke_chrome cke_editor_{name} cke_float cke_{langDir} ' + CKEDITOR.env.cssClass + '" dir="{langDir}" title="' + (CKEDITOR.env.gecko ? " " : "") + '" lang="{langCode}" role="application" style="{style}" aria-labelledby="cke_{name}_arialbl"><span id="cke_{name}_arialbl" class="cke_voice_label">{voiceLabel}</span><div class="cke_inner"><div id="{topId}" class="cke_top" role="presentation">{content}</div></div></div>'),
      g = CKEDITOR.document.getWindow(), t = CKEDITOR.tools.cssLength;
    CKEDITOR.plugins.add("floatingspace", {
      init: function (a) {
        a.on("loaded", function () {
          q(this)
        }, null, null, 20)
      }
    })
  })();
  CKEDITOR.plugins.add("listblock", {
    requires: "panel", onLoad: function () {
      var e = CKEDITOR.addTemplate("panel-list", '<ul role="presentation" class="cke_panel_list">{items}</ul>'), f = CKEDITOR.addTemplate("panel-list-item", '<li id="{id}" class="cke_panel_listItem" role=presentation><a id="{id}_option" _cke_focus=1 hidefocus=true title="{title}" href="javascript:void(\'{val}\')"  {onclick}="CKEDITOR.tools.callFunction({clickFn},\'{val}\'); return false;" role="option">{text}</a></li>'), g = CKEDITOR.addTemplate("panel-list-group",
        '<h1 id="{id}" class="cke_panel_grouptitle" role="presentation" >{label}</h1>');
      CKEDITOR.ui.panel.prototype.addListBlock = function (a, b) {
        return this.addBlock(a, new CKEDITOR.ui.listBlock(this.getHolderElement(), b))
      };
      CKEDITOR.ui.listBlock = CKEDITOR.tools.createClass({
        base: CKEDITOR.ui.panel.block, $: function (a, b) {
          var b = b || {}, c = b.attributes || (b.attributes = {});
          (this.multiSelect = !!b.multiSelect) && (c["aria-multiselectable"] = !0);
          !c.role && (c.role = "listbox");
          this.base.apply(this, arguments);
          this.element.setAttribute("role",
            c.role);
          c = this.keys;
          c[40] = "next";
          c[9] = "next";
          c[38] = "prev";
          c[CKEDITOR.SHIFT + 9] = "prev";
          c[32] = CKEDITOR.env.ie ? "mouseup" : "click";
          CKEDITOR.env.ie && (c[13] = "mouseup");
          this._.pendingHtml = [];
          this._.pendingList = [];
          this._.items = {};
          this._.groups = {}
        }, _: {
          close: function () {
            if (this._.started) {
              var a = e.output({items: this._.pendingList.join("")});
              this._.pendingList = [];
              this._.pendingHtml.push(a);
              delete this._.started
            }
          }, getClick: function () {
            this._.click || (this._.click = CKEDITOR.tools.addFunction(function (a) {
              var b = this.toggle(a);
              if (this.onClick)this.onClick(a, b)
            }, this));
            return this._.click
          }
        }, proto: {
          add: function (a, b, c) {
            var d = CKEDITOR.tools.getNextId();
            this._.started || (this._.started = 1, this._.size = this._.size || 0);
            this._.items[a] = d;
            a = {
              id: d,
              val: a,
              onclick: CKEDITOR.env.ie ? 'onclick="return false;" onmouseup' : "onclick",
              clickFn: this._.getClick(),
              title: c || a,
              text: b || a
            };
            this._.pendingList.push(f.output(a))
          }, startGroup: function (a) {
            this._.close();
            var b = CKEDITOR.tools.getNextId();
            this._.groups[a] = b;
            this._.pendingHtml.push(g.output({
              id: b,
              label: a
            }))
          }, commit: function () {
            this._.close();
            this.element.appendHtml(this._.pendingHtml.join(""));
            delete this._.size;
            this._.pendingHtml = []
          }, toggle: function (a) {
            var b = this.isMarked(a);
            b ? this.unmark(a) : this.mark(a);
            return !b
          }, hideGroup: function (a) {
            var b = (a = this.element.getDocument().getById(this._.groups[a])) && a.getNext();
            a && (a.setStyle("display", "none"), b && "ul" == b.getName() && b.setStyle("display", "none"))
          }, hideItem: function (a) {
            this.element.getDocument().getById(this._.items[a]).setStyle("display", "none")
          },
          showAll: function () {
            var a = this._.items, b = this._.groups, c = this.element.getDocument(), d;
            for (d in a)c.getById(a[d]).setStyle("display", "");
            for (var e in b)a = c.getById(b[e]), d = a.getNext(), a.setStyle("display", ""), d && "ul" == d.getName() && d.setStyle("display", "")
          }, mark: function (a) {
            this.multiSelect || this.unmarkAll();
            var a = this._.items[a], b = this.element.getDocument().getById(a);
            b.addClass("cke_selected");
            this.element.getDocument().getById(a + "_option").setAttribute("aria-selected", !0);
            this.onMark && this.onMark(b)
          },
          unmark: function (a) {
            var b = this.element.getDocument(), a = this._.items[a], c = b.getById(a);
            c.removeClass("cke_selected");
            b.getById(a + "_option").removeAttribute("aria-selected");
            this.onUnmark && this.onUnmark(c)
          }, unmarkAll: function () {
            var a = this._.items, b = this.element.getDocument(), c;
            for (c in a) {
              var d = a[c];
              b.getById(d).removeClass("cke_selected");
              b.getById(d + "_option").removeAttribute("aria-selected")
            }
            this.onUnmark && this.onUnmark()
          }, isMarked: function (a) {
            return this.element.getDocument().getById(this._.items[a]).hasClass("cke_selected")
          },
          focus: function (a) {
            this._.focusIndex = -1;
            var b = this.element.getElementsByTag("a"), c, d = -1;
            if (a)for (c = this.element.getDocument().getById(this._.items[a]).getFirst(); a = b.getItem(++d);) {
              if (a.equals(c)) {
                this._.focusIndex = d;
                break
              }
            } else this.element.focus();
            c && setTimeout(function () {
              c.focus()
            }, 0)
          }
        }
      })
    }
  });
  CKEDITOR.plugins.add("richcombo", {
    requires: "floatpanel,listblock,button", beforeInit: function (c) {
      c.ui.addHandler(CKEDITOR.UI_RICHCOMBO, CKEDITOR.ui.richCombo.handler)
    }
  });
  (function () {
    var c = '<span id="{id}" class="cke_combo cke_combo__{name} {cls}" role="presentation"><span id="{id}_label" class="cke_combo_label">{label}</span><a class="cke_combo_button" hidefocus=true title="{title}" tabindex="-1"' + (CKEDITOR.env.gecko && 10900 <= CKEDITOR.env.version && !CKEDITOR.env.hc ? "" : '" href="javascript:void(\'{titleJs}\')"') + ' hidefocus="true" role="button" aria-labelledby="{id}_label" aria-haspopup="true"';
    if (CKEDITOR.env.opera || CKEDITOR.env.gecko && CKEDITOR.env.mac)c += ' onkeypress="return false;"';
    CKEDITOR.env.gecko && (c += ' onblur="this.style.cssText = this.style.cssText;"');
    var c = c + (' onkeydown="return CKEDITOR.tools.callFunction({keydownFn},event,this);" onmousedown="return CKEDITOR.tools.callFunction({mousedownFn},event);"  onfocus="return CKEDITOR.tools.callFunction({focusFn},event);" ' + (CKEDITOR.env.ie ? 'onclick="return false;" onmouseup' : "onclick") + '="CKEDITOR.tools.callFunction({clickFn},this);return false;"><span id="{id}_text" class="cke_combo_text cke_combo_inlinelabel">{label}</span><span class="cke_combo_open"><span class="cke_combo_arrow">' +
      (CKEDITOR.env.hc ? "&#9660;" : CKEDITOR.env.air ? "&nbsp;" : "") + "</span></span></a></span>"), h = CKEDITOR.addTemplate("combo", c);
    CKEDITOR.UI_RICHCOMBO = "richcombo";
    CKEDITOR.ui.richCombo = CKEDITOR.tools.createClass({
      $: function (a) {
        CKEDITOR.tools.extend(this, a, {canGroup: !1, title: a.label, modes: {wysiwyg: 1}, editorFocus: 1});
        a = this.panel || {};
        delete this.panel;
        this.id = CKEDITOR.tools.getNextNumber();
        this.document = a.parent && a.parent.getDocument() || CKEDITOR.document;
        a.className = "cke_combopanel";
        a.block = {
          multiSelect: a.multiSelect,
          attributes: a.attributes
        };
        a.toolbarRelated = !0;
        this._ = {panelDefinition: a, items: {}}
      }, proto: {
        renderHtml: function (a) {
          var b = [];
          this.render(a, b);
          return b.join("")
        }, render: function (a, b) {
          function i() {
            var d = this.modes[a.mode] ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED;
            a.readOnly && !this.readOnly && (d = CKEDITOR.TRISTATE_DISABLED);
            this.setState(d);
            this.setValue("");
            d != CKEDITOR.TRISTATE_DISABLED && this.refresh && this.refresh()
          }

          var c = CKEDITOR.env, g = "cke_" + this.id, e = CKEDITOR.tools.addFunction(function (b) {
            j && (a.unlockSelection(1),
              j = 0);
            d.execute(b)
          }, this), f = this, d = {
            id: g, combo: this, focus: function () {
              CKEDITOR.document.getById(g).getChild(1).focus()
            }, execute: function (d) {
              var b = f._;
              if (b.state != CKEDITOR.TRISTATE_DISABLED)if (f.createPanel(a), b.on)b.panel.hide(); else {
                f.commit();
                var c = f.getValue();
                c ? b.list.mark(c) : b.list.unmarkAll();
                b.panel.showBlock(f.id, new CKEDITOR.dom.element(d), 4)
              }
            }, clickFn: e
          };
          a.on("activeFilterChange", i, this);
          a.on("mode", i, this);
          !this.readOnly && a.on("readOnly", i, this);
          var k = CKEDITOR.tools.addFunction(function (a,
                                                       b) {
            var a = new CKEDITOR.dom.event(a), c = a.getKeystroke();
            switch (c) {
              case 13:
              case 32:
              case 40:
                CKEDITOR.tools.callFunction(e, b);
                break;
              default:
                d.onkey(d, c)
            }
            a.preventDefault()
          }), l = CKEDITOR.tools.addFunction(function () {
            d.onfocus && d.onfocus()
          }), j = 0, m = CKEDITOR.tools.addFunction(function () {
            if (CKEDITOR.env.opera) {
              var b = a.editable();
              b.isInline() && b.hasFocus && (a.lockSelection(), j = 1)
            }
          });
          d.keyDownFn = k;
          c = {
            id: g,
            name: this.name || this.command,
            label: this.label,
            title: this.title,
            cls: this.className || "",
            titleJs: c.gecko && 10900 <=
            c.version && !c.hc ? "" : (this.title || "").replace("'", ""),
            keydownFn: k,
            mousedownFn: m,
            focusFn: l,
            clickFn: e
          };
          h.output(c, b);
          if (this.onRender)this.onRender();
          return d
        }, createPanel: function (a) {
          if (!this._.panel) {
            var b = this._.panelDefinition, c = this._.panelDefinition.block, h = b.parent || CKEDITOR.document.getBody(), g = "cke_combopanel__" + this.name, e = new CKEDITOR.ui.floatPanel(a, h, b), f = e.addListBlock(this.id, c), d = this;
            e.onShow = function () {
              this.element.addClass(g);
              d.setState(CKEDITOR.TRISTATE_ON);
              d._.on = 1;
              d.editorFocus && !a.focusManager.hasFocus && a.focus();
              if (d.onOpen)d.onOpen();
              a.once("panelShow", function () {
                f.focus(!f.multiSelect && d.getValue())
              })
            };
            e.onHide = function (b) {
              this.element.removeClass(g);
              d.setState(d.modes && d.modes[a.mode] ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED);
              d._.on = 0;
              if (!b && d.onClose)d.onClose()
            };
            e.onEscape = function () {
              e.hide(1)
            };
            f.onClick = function (a, b) {
              d.onClick && d.onClick.call(d, a, b);
              e.hide()
            };
            this._.panel = e;
            this._.list = f;
            e.getBlock(this.id).onHide = function () {
              d._.on = 0;
              d.setState(CKEDITOR.TRISTATE_OFF)
            };
            this.init && this.init()
          }
        }, setValue: function (a, b) {
          this._.value = a;
          var c = this.document.getById("cke_" + this.id + "_text");
          c && (!a && !b ? (b = this.label, c.addClass("cke_combo_inlinelabel")) : c.removeClass("cke_combo_inlinelabel"), c.setText("undefined" != typeof b ? b : a))
        }, getValue: function () {
          return this._.value || ""
        }, unmarkAll: function () {
          this._.list.unmarkAll()
        }, mark: function (a) {
          this._.list.mark(a)
        }, hideItem: function (a) {
          this._.list.hideItem(a)
        }, hideGroup: function (a) {
          this._.list.hideGroup(a)
        }, showAll: function () {
          this._.list.showAll()
        },
        add: function (a, b, c) {
          this._.items[a] = c || a;
          this._.list.add(a, b, c)
        }, startGroup: function (a) {
          this._.list.startGroup(a)
        }, commit: function () {
          this._.committed || (this._.list.commit(), this._.committed = 1, CKEDITOR.ui.fire("ready", this));
          this._.committed = 1
        }, setState: function (a) {
          if (this._.state != a) {
            var b = this.document.getById("cke_" + this.id);
            b.setState(a, "cke_combo");
            a == CKEDITOR.TRISTATE_DISABLED ? b.setAttribute("aria-disabled", !0) : b.removeAttribute("aria-disabled");
            this._.state = a
          }
        }, getState: function () {
          return this._.state
        },
        enable: function () {
          this._.state == CKEDITOR.TRISTATE_DISABLED && this.setState(this._.lastState)
        }, disable: function () {
          this._.state != CKEDITOR.TRISTATE_DISABLED && (this._.lastState = this._.state, this.setState(CKEDITOR.TRISTATE_DISABLED))
        }
      }, statics: {
        handler: {
          create: function (a) {
            return new CKEDITOR.ui.richCombo(a)
          }
        }
      }
    });
    CKEDITOR.ui.prototype.addRichCombo = function (a, b) {
      this.add(a, CKEDITOR.UI_RICHCOMBO, b)
    }
  })();
  CKEDITOR.plugins.add("format", {
    requires: "richcombo", init: function (a) {
      if (!a.blockless) {
        for (var f = a.config, c = a.lang.format, j = f.format_tags.split(";"), d = {}, k = 0, l = [], g = 0; g < j.length; g++) {
          var h = j[g], i = new CKEDITOR.style(f["format_" + h]);
          if (!a.filter.customConfig || a.filter.check(i))k++, d[h] = i, d[h]._.enterMode = a.config.enterMode, l.push(i)
        }
        0 !== k && a.ui.addRichCombo("Format", {
          label: c.label, title: c.panelTitle, toolbar: "styles,20", allowedContent: l, panel: {
            css: [CKEDITOR.skin.getPath("editor")].concat(f.contentsCss),
            multiSelect: !1, attributes: {"aria-label": c.panelTitle}
          }, init: function () {
            this.startGroup(c.panelTitle);
            for (var b in d) {
              var a = c["tag_" + b];
              this.add(b, d[b].buildPreview(a), a)
            }
          }, onClick: function (b) {
            a.focus();
            a.fire("saveSnapshot");
            var b = d[b], c = a.elementPath();
            a[b.checkActive(c) ? "removeStyle" : "applyStyle"](b);
            setTimeout(function () {
              a.fire("saveSnapshot")
            }, 0)
          }, onRender: function () {
            a.on("selectionChange", function (b) {
              var c = this.getValue(), b = b.data.path;
              this.refresh();
              for (var e in d)if (d[e].checkActive(b)) {
                e !=
                c && this.setValue(e, a.lang.format["tag_" + e]);
                return
              }
              this.setValue("")
            }, this)
          }, onOpen: function () {
            this.showAll();
            for (var b in d)a.activeFilter.check(d[b]) || this.hideItem(b)
          }, refresh: function () {
            var b = a.elementPath();
            if (b) {
              if (b.isContextFor("p"))for (var c in d)if (a.activeFilter.check(d[c]))return;
              this.setState(CKEDITOR.TRISTATE_DISABLED)
            }
          }
        })
      }
    }
  });
  CKEDITOR.config.format_tags = "p;h1;h2;h3;h4;h5;h6;pre;address;div";
  CKEDITOR.config.format_p = {element: "p"};
  CKEDITOR.config.format_div = {element: "div"};
  CKEDITOR.config.format_pre = {element: "pre"};
  CKEDITOR.config.format_address = {element: "address"};
  CKEDITOR.config.format_h1 = {element: "h1"};
  CKEDITOR.config.format_h2 = {element: "h2"};
  CKEDITOR.config.format_h3 = {element: "h3"};
  CKEDITOR.config.format_h4 = {element: "h4"};
  CKEDITOR.config.format_h5 = {element: "h5"};
  CKEDITOR.config.format_h6 = {element: "h6"};
  (function () {
    var b = {
      canUndo: !1, exec: function (a) {
        var b = a.document.createElement("hr");
        a.insertElement(b)
      }, allowedContent: "hr", requiredContent: "hr"
    };
    CKEDITOR.plugins.add("horizontalrule", {
      init: function (a) {
        a.blockless || (a.addCommand("horizontalrule", b), a.ui.addButton && a.ui.addButton("HorizontalRule", {
          label: a.lang.horizontalrule.toolbar,
          command: "horizontalrule",
          toolbar: "insert,40"
        }))
      }
    })
  })();
  CKEDITOR.plugins.add("htmlwriter", {
    init: function (b) {
      var a = new CKEDITOR.htmlWriter;
      a.forceSimpleAmpersand = b.config.forceSimpleAmpersand;
      a.indentationChars = b.config.dataIndentationChars || "\t";
      b.dataProcessor.writer = a
    }
  });
  CKEDITOR.htmlWriter = CKEDITOR.tools.createClass({
    base: CKEDITOR.htmlParser.basicWriter, $: function () {
      this.base();
      this.indentationChars = "\t";
      this.selfClosingEnd = " />";
      this.lineBreakChars = "\n";
      this.sortAttributes = 1;
      this._.indent = 0;
      this._.indentation = "";
      this._.inPre = 0;
      this._.rules = {};
      var b = CKEDITOR.dtd, a;
      for (a in CKEDITOR.tools.extend({}, b.$nonBodyContent, b.$block, b.$listItem, b.$tableContent))this.setRules(a, {
        indent: !b[a]["#"], breakBeforeOpen: 1, breakBeforeClose: !b[a]["#"], breakAfterClose: 1, needsSpace: a in
        b.$block && !(a in{li: 1, dt: 1, dd: 1})
      });
      this.setRules("br", {breakAfterOpen: 1});
      this.setRules("title", {indent: 0, breakAfterOpen: 0});
      this.setRules("style", {indent: 0, breakBeforeClose: 1});
      this.setRules("pre", {breakAfterOpen: 1, indent: 0})
    }, proto: {
      openTag: function (b) {
        var a = this._.rules[b];
        this._.afterCloser && (a && a.needsSpace && this._.needsSpace) && this._.output.push("\n");
        this._.indent ? this.indentation() : a && a.breakBeforeOpen && (this.lineBreak(), this.indentation());
        this._.output.push("<", b);
        this._.afterCloser = 0
      },
      openTagClose: function (b, a) {
        var c = this._.rules[b];
        a ? (this._.output.push(this.selfClosingEnd), c && c.breakAfterClose && (this._.needsSpace = c.needsSpace)) : (this._.output.push(">"), c && c.indent && (this._.indentation += this.indentationChars));
        c && c.breakAfterOpen && this.lineBreak();
        "pre" == b && (this._.inPre = 1)
      }, attribute: function (b, a) {
        "string" == typeof a && (this.forceSimpleAmpersand && (a = a.replace(/&amp;/g, "&")), a = CKEDITOR.tools.htmlEncodeAttr(a));
        this._.output.push(" ", b, '="', a, '"')
      }, closeTag: function (b) {
        var a = this._.rules[b];
        a && a.indent && (this._.indentation = this._.indentation.substr(this.indentationChars.length));
        this._.indent ? this.indentation() : a && a.breakBeforeClose && (this.lineBreak(), this.indentation());
        this._.output.push("</", b, ">");
        "pre" == b && (this._.inPre = 0);
        a && a.breakAfterClose && (this.lineBreak(), this._.needsSpace = a.needsSpace);
        this._.afterCloser = 1
      }, text: function (b) {
        this._.indent && (this.indentation(), !this._.inPre && (b = CKEDITOR.tools.ltrim(b)));
        this._.output.push(b)
      }, comment: function (b) {
        this._.indent && this.indentation();
        this._.output.push("<\!--", b, "--\>")
      }, lineBreak: function () {
        !this._.inPre && 0 < this._.output.length && this._.output.push(this.lineBreakChars);
        this._.indent = 1
      }, indentation: function () {
        !this._.inPre && this._.indentation && this._.output.push(this._.indentation);
        this._.indent = 0
      }, reset: function () {
        this._.output = [];
        this._.indent = 0;
        this._.indentation = "";
        this._.afterCloser = 0;
        this._.inPre = 0
      }, setRules: function (b, a) {
        var c = this._.rules[b];
        c ? CKEDITOR.tools.extend(c, a, !0) : this._.rules[b] = a
      }
    }
  });
  (function () {
    function k(a) {
      var d = this.editor, b = a.document, c = b.body;
      (a = b.getElementById("cke_actscrpt")) && a.parentNode.removeChild(a);
      (a = b.getElementById("cke_shimscrpt")) && a.parentNode.removeChild(a);
      CKEDITOR.env.gecko && (c.contentEditable = !1, 2E4 > CKEDITOR.env.version && (c.innerHTML = c.innerHTML.replace(/^.*<\!-- cke-content-start --\>/, ""), setTimeout(function () {
        var a = new CKEDITOR.dom.range(new CKEDITOR.dom.document(b));
        a.setStart(new CKEDITOR.dom.node(c), 0);
        d.getSelection().selectRanges([a])
      }, 0)));
      c.contentEditable = !0;
      CKEDITOR.env.ie && (c.hideFocus = !0, c.disabled = !0, c.removeAttribute("disabled"));
      delete this._.isLoadingData;
      this.$ = c;
      b = new CKEDITOR.dom.document(b);
      this.setup();
      CKEDITOR.env.ie && (b.getDocumentElement().addClass(b.$.compatMode), d.config.enterMode != CKEDITOR.ENTER_P && b.on("selectionchange", function () {
        var a = b.getBody(), c = d.getSelection(), e = c && c.getRanges()[0];
        e && (a.getHtml().match(/^<p>(?:&nbsp;|<br>)<\/p>$/i) && e.startContainer.equals(a)) && setTimeout(function () {
          e = d.getSelection().getRanges()[0];
          if (!e.startContainer.equals("body")) {
            a.getFirst().remove(1);
            e.moveToElementEditEnd(a);
            e.select()
          }
        }, 0)
      }));
      if (CKEDITOR.env.webkit || CKEDITOR.env.ie && 10 < CKEDITOR.env.version)b.getDocumentElement().on("mousedown", function (a) {
        a.data.getTarget().is("html") && setTimeout(function () {
          d.editable().focus()
        })
      });
      try {
        d.document.$.execCommand("2D-position", !1, !0)
      } catch (e) {
      }
      try {
        d.document.$.execCommand("enableInlineTableEditing", !1, !d.config.disableNativeTableHandles)
      } catch (g) {
      }
      if (d.config.disableObjectResizing)try {
        this.getDocument().$.execCommand("enableObjectResizing", !1,
          !1)
      } catch (f) {
        this.attachListener(this, CKEDITOR.env.ie ? "resizestart" : "resize", function (a) {
          a.data.preventDefault()
        })
      }
      (CKEDITOR.env.gecko || CKEDITOR.env.ie && "CSS1Compat" == d.document.$.compatMode) && this.attachListener(this, "keydown", function (a) {
        var b = a.data.getKeystroke();
        if (b == 33 || b == 34)if (CKEDITOR.env.ie)setTimeout(function () {
          d.getSelection().scrollIntoView()
        }, 0); else if (d.window.$.innerHeight > this.$.offsetHeight) {
          var c = d.createRange();
          c[b == 33 ? "moveToElementEditStart" : "moveToElementEditEnd"](this);
          c.select();
          a.data.preventDefault()
        }
      });
      CKEDITOR.env.ie && this.attachListener(b, "blur", function () {
        try {
          b.$.selection.empty()
        } catch (a) {
        }
      });
      d.document.getElementsByTag("title").getItem(0).data("cke-title", d.document.$.title);
      CKEDITOR.env.ie && (d.document.$.title = this._.docTitle);
      CKEDITOR.tools.setTimeout(function () {
        d.fire("contentDom");
        if (this._.isPendingFocus) {
          d.focus();
          this._.isPendingFocus = false
        }
        setTimeout(function () {
          d.fire("dataReady")
        }, 0);
        CKEDITOR.env.ie && setTimeout(function () {
          if (d.document) {
            var a = d.document.$.body;
            a.runtimeStyle.marginBottom = "0px";
            a.runtimeStyle.marginBottom = ""
          }
        }, 1E3)
      }, 0, this)
    }

    function l() {
      var a = [];
      if (8 <= CKEDITOR.document.$.documentMode) {
        a.push("html.CSS1Compat [contenteditable=false]{min-height:0 !important}");
        var d = [], b;
        for (b in CKEDITOR.dtd.$removeEmpty)d.push("html.CSS1Compat " + b + "[contenteditable=false]");
        a.push(d.join(",") + "{display:inline-block}")
      } else CKEDITOR.env.gecko && (a.push("html{height:100% !important}"), a.push("img:-moz-broken{-moz-force-broken-image-icon:1;min-width:24px;min-height:24px}"));
      a.push("html{cursor:text;*cursor:auto}");
      a.push("img,input,textarea{cursor:default}");
      return a.join("\n")
    }

    CKEDITOR.plugins.add("wysiwygarea", {
      init: function (a) {
        a.config.fullPage && a.addFeature({
          allowedContent: "html head title; style [media,type]; body (*)[id]; meta link [*]",
          requiredContent: "body"
        });
        a.addMode("wysiwyg", function (d) {
          function b(b) {
            b && b.removeListener();
            a.editable(new j(a, e.$.contentWindow.document.body));
            a.setData(a.getData(1), d)
          }

          var c = "document.open();" + (CKEDITOR.env.ie ? "(" + CKEDITOR.tools.fixDomain +
            ")();" : "") + "document.close();", c = CKEDITOR.env.air ? "javascript:void(0)" : CKEDITOR.env.ie ? "javascript:void(function(){" + encodeURIComponent(c) + "}())" : "", e = CKEDITOR.dom.element.createFromHtml('<iframe src="' + c + '" frameBorder="0"></iframe>');
          e.setStyles({width: "100%", height: "100%"});
          e.addClass("cke_wysiwyg_frame cke_reset");
          var g = a.ui.space("contents");
          g.append(e);
          if (c = CKEDITOR.env.ie || CKEDITOR.env.gecko)e.on("load", b);
          var f = a.title, h = a.lang.common.editorHelp;
          f && (CKEDITOR.env.ie && (f += ", " + h), e.setAttribute("title",
            f));
          var f = CKEDITOR.tools.getNextId(), i = CKEDITOR.dom.element.createFromHtml('<span id="' + f + '" class="cke_voice_label">' + h + "</span>");
          g.append(i, 1);
          a.on("beforeModeUnload", function (a) {
            a.removeListener();
            i.remove()
          });
          e.setAttributes({"aria-describedby": f, tabIndex: a.tabIndex, allowTransparency: "true"});
          !c && b();
          CKEDITOR.env.webkit && (c = function () {
            g.setStyle("width", "100%");
            e.hide();
            e.setSize("width", g.getSize("width"));
            g.removeStyle("width");
            e.show()
          }, e.setCustomData("onResize", c), CKEDITOR.document.getWindow().on("resize",
            c));
          a.fire("ariaWidget", e)
        })
      }
    });
    var j = CKEDITOR.tools.createClass({
      $: function (a) {
        this.base.apply(this, arguments);
        this._.frameLoadedHandler = CKEDITOR.tools.addFunction(function (a) {
          CKEDITOR.tools.setTimeout(k, 0, this, a)
        }, this);
        this._.docTitle = this.getWindow().getFrame().getAttribute("title")
      }, base: CKEDITOR.editable, proto: {
        setData: function (a, d) {
          var b = this.editor;
          if (d)this.setHtml(a), b.fire("dataReady"); else {
            this._.isLoadingData = !0;
            b._.dataStore = {id: 1};
            var c = b.config, e = c.fullPage, g = c.docType, f = CKEDITOR.tools.buildStyleHtml(l()).replace(/<style>/,
              '<style data-cke-temp="1">');
            e || (f += CKEDITOR.tools.buildStyleHtml(b.config.contentsCss));
            var h = c.baseHref ? '<base href="' + c.baseHref + '" data-cke-temp="1" />' : "";
            e && (a = a.replace(/<!DOCTYPE[^>]*>/i, function (a) {
              b.docType = g = a;
              return ""
            }).replace(/<\?xml\s[^\?]*\?>/i, function (a) {
              b.xmlDeclaration = a;
              return ""
            }));
            a = b.dataProcessor.toHtml(a);
            e ? (/<body[\s|>]/.test(a) || (a = "<body>" + a), /<html[\s|>]/.test(a) || (a = "<html>" + a + "</html>"), /<head[\s|>]/.test(a) ? /<title[\s|>]/.test(a) || (a = a.replace(/<head[^>]*>/, "$&<title></title>")) :
              a = a.replace(/<html[^>]*>/, "$&<head><title></title></head>"), h && (a = a.replace(/<head>/, "$&" + h)), a = a.replace(/<\/head\s*>/, f + "$&"), a = g + a) : a = c.docType + '<html dir="' + c.contentsLangDirection + '" lang="' + (c.contentsLanguage || b.langCode) + '"><head><title>' + this._.docTitle + "</title>" + h + f + "</head><body" + (c.bodyId ? ' id="' + c.bodyId + '"' : "") + (c.bodyClass ? ' class="' + c.bodyClass + '"' : "") + ">" + a + "</body></html>";
            CKEDITOR.env.gecko && (a = a.replace(/<body/, '<body contenteditable="true" '), 2E4 > CKEDITOR.env.version && (a = a.replace(/<body[^>]*>/,
              "$&<\!-- cke-content-start --\>")));
            c = '<script id="cke_actscrpt" type="text/javascript"' + (CKEDITOR.env.ie ? ' defer="defer" ' : "") + ">var wasLoaded=0;function onload(){if(!wasLoaded)window.parent.CKEDITOR.tools.callFunction(" + this._.frameLoadedHandler + ",window);wasLoaded=1;}" + (CKEDITOR.env.ie ? "onload();" : 'document.addEventListener("DOMContentLoaded", onload, false );') + "<\/script>";
            CKEDITOR.env.ie && 9 > CKEDITOR.env.version && (c += '<script id="cke_shimscrpt">window.parent.CKEDITOR.tools.enableHtml5Elements(document)<\/script>');
            a = a.replace(/(?=\s*<\/(:?head)>)/, c);
            this.clearCustomData();
            this.clearListeners();
            b.fire("contentDomUnload");
            var i = this.getDocument();
            try {
              i.write(a)
            } catch (j) {
              setTimeout(function () {
                i.write(a)
              }, 0)
            }
          }
        }, getData: function (a) {
          if (a)return this.getHtml();
          var a = this.editor, d = a.config, b = d.fullPage, c = b && a.docType, e = b && a.xmlDeclaration, g = this.getDocument(), b = b ? g.getDocumentElement().getOuterHtml() : g.getBody().getHtml();
          CKEDITOR.env.gecko && d.enterMode != CKEDITOR.ENTER_BR && (b = b.replace(/<br>(?=\s*(:?$|<\/body>))/,
            ""));
          b = a.dataProcessor.toDataFormat(b);
          e && (b = e + "\n" + b);
          c && (b = c + "\n" + b);
          return b
        }, focus: function () {
          this._.isLoadingData ? this._.isPendingFocus = !0 : j.baseProto.focus.call(this)
        }, detach: function () {
          var a = this.editor, d = a.document, b = a.window.getFrame();
          j.baseProto.detach.call(this);
          this.clearCustomData();
          d.getDocumentElement().clearCustomData();
          b.clearCustomData();
          CKEDITOR.tools.removeFunction(this._.frameLoadedHandler);
          (d = b.removeCustomData("onResize")) && d.removeListener();
          a.fire("contentDomUnload");
          b.remove()
        }
      }
    })
  })();
  CKEDITOR.config.disableObjectResizing = !1;
  CKEDITOR.config.disableNativeTableHandles = !0;
  CKEDITOR.config.disableNativeSpellChecker = !0;
  CKEDITOR.config.contentsCss = CKEDITOR.basePath + "contents.css";
  (function () {
    function e(b, a) {
      a || (a = b.getSelection().getSelectedElement());
      if (a && a.is("img") && !a.data("cke-realelement") && !a.isReadOnly())return a
    }

    function f(b) {
      var a = b.getStyle("float");
      if ("inherit" == a || "none" == a)a = 0;
      a || (a = b.getAttribute("align"));
      return a
    }

    CKEDITOR.plugins.add("image", {
      requires: "dialog", init: function (b) {
        CKEDITOR.dialog.add("image", this.path + "dialogs/image.js");
        var a = "img[alt,!src]{border-style,border-width,float,height,margin,margin-bottom,margin-left,margin-right,margin-top,width}";
        CKEDITOR.dialog.isTabEnabled(b, "image", "advanced") && (a = "img[alt,dir,id,lang,longdesc,!src,title]{*}(*)");
        b.addCommand("image", new CKEDITOR.dialogCommand("image", {
          allowedContent: a,
          requiredContent: "img[alt,src]",
          contentTransformations: [["img{width}: sizeToStyle", "img[width]: sizeToAttribute"], ["img{float}: alignmentToStyle", "img[align]: alignmentToAttribute"]]
        }));
        b.ui.addButton && b.ui.addButton("Image", {label: b.lang.common.image, command: "image", toolbar: "insert,10"});
        b.on("doubleclick", function (a) {
          var b =
            a.data.element;
          b.is("img") && (!b.data("cke-realelement") && !b.isReadOnly()) && (a.data.dialog = "image")
        });
        b.addMenuItems && b.addMenuItems({image: {label: b.lang.image.menu, command: "image", group: "image"}});
        b.contextMenu && b.contextMenu.addListener(function (a) {
          if (e(b, a))return {image: CKEDITOR.TRISTATE_OFF}
        })
      }, afterInit: function (b) {
        function a(a) {
          var d = b.getCommand("justify" + a);
          if (d) {
            if ("left" == a || "right" == a)d.on("exec", function (d) {
              var c = e(b), g;
              c && (g = f(c), g == a ? (c.removeStyle("float"), a == f(c) && c.removeAttribute("align")) :
                c.setStyle("float", a), d.cancel())
            });
            d.on("refresh", function (d) {
              var c = e(b);
              c && (c = f(c), this.setState(c == a ? CKEDITOR.TRISTATE_ON : "right" == a || "left" == a ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED), d.cancel())
            })
          }
        }

        a("left");
        a("right");
        a("center");
        a("block")
      }
    })
  })();
  CKEDITOR.config.image_removeLinkByEmptyURL = !0;
  (function () {
    function k(a, b) {
      var e, f;
      b.on("refresh", function (a) {
        var b = [i], c;
        for (c in a.data.states)b.push(a.data.states[c]);
        this.setState(CKEDITOR.tools.search(b, m) ? m : i)
      }, b, null, 100);
      b.on("exec", function (b) {
        e = a.getSelection();
        f = e.createBookmarks(1);
        b.data || (b.data = {});
        b.data.done = !1
      }, b, null, 0);
      b.on("exec", function () {
        a.forceNextSelectionCheck();
        e.selectBookmarks(f)
      }, b, null, 100)
    }

    var i = CKEDITOR.TRISTATE_DISABLED, m = CKEDITOR.TRISTATE_OFF;
    CKEDITOR.plugins.add("indent", {
      init: function (a) {
        var b = CKEDITOR.plugins.indent.genericDefinition;
        k(a, a.addCommand("indent", new b(!0)));
        k(a, a.addCommand("outdent", new b));
        a.ui.addButton && (a.ui.addButton("Indent", {
          label: a.lang.indent.indent,
          command: "indent",
          directional: !0,
          toolbar: "indent,20"
        }), a.ui.addButton("Outdent", {
          label: a.lang.indent.outdent,
          command: "outdent",
          directional: !0,
          toolbar: "indent,10"
        }));
        a.on("dirChanged", function (b) {
          var f = a.createRange(), j = b.data.node;
          f.setStartBefore(j);
          f.setEndAfter(j);
          for (var l = new CKEDITOR.dom.walker(f), c; c = l.next();)if (c.type == CKEDITOR.NODE_ELEMENT)if (!c.equals(j) &&
            c.getDirection()) {
            f.setStartAfter(c);
            l = new CKEDITOR.dom.walker(f)
          } else {
            var d = a.config.indentClasses;
            if (d)for (var g = b.data.dir == "ltr" ? ["_rtl", ""] : ["", "_rtl"], h = 0; h < d.length; h++)if (c.hasClass(d[h] + g[0])) {
              c.removeClass(d[h] + g[0]);
              c.addClass(d[h] + g[1])
            }
            d = c.getStyle("margin-right");
            g = c.getStyle("margin-left");
            d ? c.setStyle("margin-left", d) : c.removeStyle("margin-left");
            g ? c.setStyle("margin-right", g) : c.removeStyle("margin-right")
          }
        })
      }
    });
    CKEDITOR.plugins.indent = {
      genericDefinition: function (a) {
        this.isIndent = !!a;
        this.startDisabled = !this.isIndent
      }, specificDefinition: function (a, b, e) {
        this.name = b;
        this.editor = a;
        this.jobs = {};
        this.enterBr = a.config.enterMode == CKEDITOR.ENTER_BR;
        this.isIndent = !!e;
        this.relatedGlobal = e ? "indent" : "outdent";
        this.indentKey = e ? 9 : CKEDITOR.SHIFT + 9;
        this.database = {}
      }, registerCommands: function (a, b) {
        a.on("pluginsLoaded", function () {
          for (var a in b)(function (a, b) {
            var e = a.getCommand(b.relatedGlobal), c;
            for (c in b.jobs)e.on("exec", function (d) {
              d.data.done || (a.fire("lockSnapshot"), b.execJob(a, c) && (d.data.done = !0), a.fire("unlockSnapshot"), CKEDITOR.dom.element.clearAllMarkers(b.database))
            }, this, null, c), e.on("refresh", function (d) {
              d.data.states || (d.data.states = {});
              d.data.states[b.name + "@" + c] = b.refreshJob(a, c, d.data.path)
            }, this, null, c);
            a.addFeature(b)
          })(this, b[a])
        })
      }
    };
    CKEDITOR.plugins.indent.genericDefinition.prototype = {
      context: "p", exec: function () {
      }
    };
    CKEDITOR.plugins.indent.specificDefinition.prototype = {
      execJob: function (a, b) {
        var e = this.jobs[b];
        if (e.state != i)return e.exec.call(this, a)
      }, refreshJob: function (a,
                               b, e) {
        b = this.jobs[b];
        b.state = a.activeFilter.checkFeature(this) ? b.refresh.call(this, a, e) : i;
        return b.state
      }, getContext: function (a) {
        return a.contains(this.context)
      }
    }
  })();
  (function () {
    function s(e) {
      function g(b) {
        for (var f = d.startContainer, a = d.endContainer; f && !f.getParent().equals(b);)f = f.getParent();
        for (; a && !a.getParent().equals(b);)a = a.getParent();
        if (!f || !a)return !1;
        for (var h = f, f = [], c = !1; !c;)h.equals(a) && (c = !0), f.push(h), h = h.getNext();
        if (1 > f.length)return !1;
        h = b.getParents(!0);
        for (a = 0; a < h.length; a++)if (h[a].getName && k[h[a].getName()]) {
          b = h[a];
          break
        }
        for (var h = n.isIndent ? 1 : -1, a = f[0], f = f[f.length - 1], c = CKEDITOR.plugins.list.listToArray(b, o), g = c[f.getCustomData("listarray_index")].indent,
               a = a.getCustomData("listarray_index"); a <= f.getCustomData("listarray_index"); a++)if (c[a].indent += h, 0 < h) {
          var l = c[a].parent;
          c[a].parent = new CKEDITOR.dom.element(l.getName(), l.getDocument())
        }
        for (a = f.getCustomData("listarray_index") + 1; a < c.length && c[a].indent > g; a++)c[a].indent += h;
        f = CKEDITOR.plugins.list.arrayToList(c, o, null, e.config.enterMode, b.getDirection());
        if (!n.isIndent) {
          var i;
          if ((i = b.getParent()) && i.is("li"))for (var h = f.listNode.getChildren(), m = [], j, a = h.count() - 1; 0 <= a; a--)(j = h.getItem(a)) && (j.is &&
          j.is("li")) && m.push(j)
        }
        f && f.listNode.replace(b);
        if (m && m.length)for (a = 0; a < m.length; a++) {
          for (j = b = m[a]; (j = j.getNext()) && j.is && j.getName()in k;)CKEDITOR.env.needsNbspFiller && !b.getFirst(t) && b.append(d.document.createText(" ")), b.append(j);
          b.insertAfter(i)
        }
        f && e.fire("contentDomInvalidated");
        return !0
      }

      for (var n = this, o = this.database, k = this.context, l = e.getSelection(), l = (l && l.getRanges()).createIterator(), d; d = l.getNextRange();) {
        for (var b = d.getCommonAncestor(); b && !(b.type == CKEDITOR.NODE_ELEMENT && k[b.getName()]);)b =
          b.getParent();
        b || (b = d.startPath().contains(k)) && d.setEndAt(b, CKEDITOR.POSITION_BEFORE_END);
        if (!b) {
          var c = d.getEnclosedNode();
          c && (c.type == CKEDITOR.NODE_ELEMENT && c.getName()in k) && (d.setStartAt(c, CKEDITOR.POSITION_AFTER_START), d.setEndAt(c, CKEDITOR.POSITION_BEFORE_END), b = c)
        }
        b && (d.startContainer.type == CKEDITOR.NODE_ELEMENT && d.startContainer.getName()in k) && (c = new CKEDITOR.dom.walker(d), c.evaluator = i, d.startContainer = c.next());
        b && (d.endContainer.type == CKEDITOR.NODE_ELEMENT && d.endContainer.getName()in k) &&
        (c = new CKEDITOR.dom.walker(d), c.evaluator = i, d.endContainer = c.previous());
        if (b)return g(b)
      }
      return 0
    }

    function p(e, g) {
      g || (g = e.contains(this.context));
      return g && e.block && e.block.equals(g.getFirst(i))
    }

    function i(e) {
      return e.type == CKEDITOR.NODE_ELEMENT && e.is("li")
    }

    function t(e) {
      return u(e) && v(e)
    }

    var u = CKEDITOR.dom.walker.whitespaces(!0), v = CKEDITOR.dom.walker.bookmark(!1, !0), q = CKEDITOR.TRISTATE_DISABLED, r = CKEDITOR.TRISTATE_OFF;
    CKEDITOR.plugins.add("indentlist", {
      requires: "indent", init: function (e) {
        function g(e,
                   g) {
          i.specificDefinition.apply(this, arguments);
          this.requiredContent = ["ul", "ol"];
          e.on("key", function (g) {
            if ("wysiwyg" == e.mode && g.data.keyCode == this.indentKey) {
              var d = this.getContext(e.elementPath());
              if (d && (!this.isIndent || !p.call(this, e.elementPath(), d)))e.execCommand(this.relatedGlobal), g.cancel()
            }
          }, this);
          this.jobs[this.isIndent ? 10 : 30] = {
            refresh: this.isIndent ? function (e, d) {
              var b = this.getContext(d), c = p.call(this, d, b);
              return !b || !this.isIndent || c ? q : r
            } : function (e, d) {
              return !this.getContext(d) || this.isIndent ?
                q : r
            }, exec: CKEDITOR.tools.bind(s, this)
          }
        }

        var i = CKEDITOR.plugins.indent;
        i.registerCommands(e, {indentlist: new g(e, "indentlist", !0), outdentlist: new g(e, "outdentlist")});
        CKEDITOR.tools.extend(g.prototype, i.specificDefinition.prototype, {context: {ol: 1, ul: 1}})
      }
    })
  })();
  (function () {
    function g(a, b) {
      var c = j.exec(a), d = j.exec(b);
      if (c) {
        if (!c[2] && "px" == d[2])return d[1];
        if ("px" == c[2] && !d[2])return d[1] + "px"
      }
      return b
    }

    var i = CKEDITOR.htmlParser.cssStyle, h = CKEDITOR.tools.cssLength, j = /^((?:\d*(?:\.\d+))|(?:\d+))(.*)?$/i, l = {
      elements: {
        $: function (a) {
          var b = a.attributes;
          if ((b = (b = (b = b && b["data-cke-realelement"]) && new CKEDITOR.htmlParser.fragment.fromHtml(decodeURIComponent(b))) && b.children[0]) && a.attributes["data-cke-resizable"]) {
            var c = (new i(a)).rules, a = b.attributes, d = c.width, c =
              c.height;
            d && (a.width = g(a.width, d));
            c && (a.height = g(a.height, c))
          }
          return b
        }
      }
    }, k = CKEDITOR.plugins.add("fakeobjects", {
      init: function (a) {
        a.filter.allow("img[!data-cke-realelement,src,alt,title](*){*}", "fakeobjects")
      }, afterInit: function (a) {
        (a = (a = a.dataProcessor) && a.htmlFilter) && a.addRules(l)
      }
    });
    CKEDITOR.editor.prototype.createFakeElement = function (a, b, c, d) {
      var e = this.lang.fakeobjects, e = e[c] || e.unknown, b = {
        "class": b, "data-cke-realelement": encodeURIComponent(a.getOuterHtml()), "data-cke-real-node-type": a.type,
        alt: e, title: e, align: a.getAttribute("align") || ""
      };
      CKEDITOR.env.hc || (b.src = CKEDITOR.getUrl(k.path + "images/spacer.gif"));
      c && (b["data-cke-real-element-type"] = c);
      d && (b["data-cke-resizable"] = d, c = new i, d = a.getAttribute("width"), a = a.getAttribute("height"), d && (c.rules.width = h(d)), a && (c.rules.height = h(a)), c.populate(b));
      return this.document.createElement("img", {attributes: b})
    };
    CKEDITOR.editor.prototype.createFakeParserElement = function (a, b, c, d) {
      var e = this.lang.fakeobjects, e = e[c] || e.unknown, f;
      f = new CKEDITOR.htmlParser.basicWriter;
      a.writeHtml(f);
      f = f.getHtml();
      b = {
        "class": b,
        "data-cke-realelement": encodeURIComponent(f),
        "data-cke-real-node-type": a.type,
        alt: e,
        title: e,
        align: a.attributes.align || ""
      };
      CKEDITOR.env.hc || (b.src = CKEDITOR.getUrl(k.path + "images/spacer.gif"));
      c && (b["data-cke-real-element-type"] = c);
      d && (b["data-cke-resizable"] = d, d = a.attributes, a = new i, c = d.width, d = d.height, void 0 != c && (a.rules.width = h(c)), void 0 != d && (a.rules.height = h(d)), a.populate(b));
      return new CKEDITOR.htmlParser.element("img", b)
    };
    CKEDITOR.editor.prototype.restoreRealElement =
      function (a) {
        if (a.data("cke-real-node-type") != CKEDITOR.NODE_ELEMENT)return null;
        var b = CKEDITOR.dom.element.createFromHtml(decodeURIComponent(a.data("cke-realelement")), this.document);
        if (a.data("cke-resizable")) {
          var c = a.getStyle("width"), a = a.getStyle("height");
          c && b.setAttribute("width", g(b.getAttribute("width"), c));
          a && b.setAttribute("height", g(b.getAttribute("height"), a))
        }
        return b
      }
  })();
  CKEDITOR.plugins.add("link", {
    requires: "dialog,fakeobjects", onLoad: function () {
      function b(b) {
        return d.replace(/%1/g, "rtl" == b ? "right" : "left").replace(/%2/g, "cke_contents_" + b)
      }

      var a = "background:url(" + CKEDITOR.getUrl(this.path + "images" + (CKEDITOR.env.hidpi ? "/hidpi" : "") + "/anchor.png") + ") no-repeat %1 center;border:1px dotted #00f;background-size:16px;", d = ".%2 a.cke_anchor,.%2 a.cke_anchor_empty,.cke_editable.%2 a[name],.cke_editable.%2 a[data-cke-saved-name]{" + a + "padding-%1:18px;cursor:auto;}" + (CKEDITOR.plugins.link.synAnchorSelector ?
          "a.cke_anchor_empty{display:inline-block;}" : "") + ".%2 img.cke_anchor{" + a + "width:16px;min-height:15px;height:1.15em;vertical-align:" + (CKEDITOR.env.opera ? "middle" : "text-bottom") + ";}";
      CKEDITOR.addCss(b("ltr") + b("rtl"))
    }, init: function (b) {
      var a = "a[!href]";
      CKEDITOR.dialog.isTabEnabled(b, "link", "advanced") && (a = a.replace("]", ",accesskey,charset,dir,id,lang,name,rel,tabindex,title,type]{*}(*)"));
      CKEDITOR.dialog.isTabEnabled(b, "link", "target") && (a = a.replace("]", ",target,onclick]"));
      b.addCommand("link", new CKEDITOR.dialogCommand("link",
        {allowedContent: a, requiredContent: "a[href]"}));
      b.addCommand("anchor", new CKEDITOR.dialogCommand("anchor", {
        allowedContent: "a[!name,id]",
        requiredContent: "a[name]"
      }));
      b.addCommand("unlink", new CKEDITOR.unlinkCommand);
      b.addCommand("removeAnchor", new CKEDITOR.removeAnchorCommand);
      b.setKeystroke(CKEDITOR.CTRL + 76, "link");
      b.ui.addButton && (b.ui.addButton("Link", {
        label: b.lang.link.toolbar,
        command: "link",
        toolbar: "links,10"
      }), b.ui.addButton("Unlink", {label: b.lang.link.unlink, command: "unlink", toolbar: "links,20"}),
        b.ui.addButton("Anchor", {label: b.lang.link.anchor.toolbar, command: "anchor", toolbar: "links,30"}));
      CKEDITOR.dialog.add("link", this.path + "dialogs/link.js");
      CKEDITOR.dialog.add("anchor", this.path + "dialogs/anchor.js");
      b.on("doubleclick", function (a) {
        var c = CKEDITOR.plugins.link.getSelectedLink(b) || a.data.element;
        if (!c.isReadOnly())if (c.is("a")) {
          a.data.dialog = c.getAttribute("name") && (!c.getAttribute("href") || !c.getChildCount()) ? "anchor" : "link";
          b.getSelection().selectElement(c)
        } else if (CKEDITOR.plugins.link.tryRestoreFakeAnchor(b,
            c))a.data.dialog = "anchor"
      });
      b.addMenuItems && b.addMenuItems({
        anchor: {
          label: b.lang.link.anchor.menu,
          command: "anchor",
          group: "anchor",
          order: 1
        },
        removeAnchor: {label: b.lang.link.anchor.remove, command: "removeAnchor", group: "anchor", order: 5},
        link: {label: b.lang.link.menu, command: "link", group: "link", order: 1},
        unlink: {label: b.lang.link.unlink, command: "unlink", group: "link", order: 5}
      });
      b.contextMenu && b.contextMenu.addListener(function (a) {
        if (!a || a.isReadOnly())return null;
        a = CKEDITOR.plugins.link.tryRestoreFakeAnchor(b,
          a);
        if (!a && !(a = CKEDITOR.plugins.link.getSelectedLink(b)))return null;
        var c = {};
        a.getAttribute("href") && a.getChildCount() && (c = {
          link: CKEDITOR.TRISTATE_OFF,
          unlink: CKEDITOR.TRISTATE_OFF
        });
        if (a && a.hasAttribute("name"))c.anchor = c.removeAnchor = CKEDITOR.TRISTATE_OFF;
        return c
      })
    }, afterInit: function (b) {
      var a = b.dataProcessor, d = a && a.dataFilter, a = a && a.htmlFilter, c = b._.elementsPath && b._.elementsPath.filters;
      d && d.addRules({
        elements: {
          a: function (a) {
            var c = a.attributes;
            if (!c.name)return null;
            var d = !a.children.length;
            if (CKEDITOR.plugins.link.synAnchorSelector) {
              var a =
                d ? "cke_anchor_empty" : "cke_anchor", e = c["class"];
              if (c.name && (!e || 0 > e.indexOf(a)))c["class"] = (e || "") + " " + a;
              d && CKEDITOR.plugins.link.emptyAnchorFix && (c.contenteditable = "false", c["data-cke-editable"] = 1)
            } else if (CKEDITOR.plugins.link.fakeAnchor && d)return b.createFakeParserElement(a, "cke_anchor", "anchor");
            return null
          }
        }
      });
      CKEDITOR.plugins.link.emptyAnchorFix && a && a.addRules({
        elements: {
          a: function (a) {
            delete a.attributes.contenteditable
          }
        }
      });
      c && c.push(function (a, c) {
        if ("a" == c && (CKEDITOR.plugins.link.tryRestoreFakeAnchor(b,
            a) || a.getAttribute("name") && (!a.getAttribute("href") || !a.getChildCount())))return "anchor"
      })
    }
  });
  CKEDITOR.plugins.link = {
    getSelectedLink: function (b) {
      var a = b.getSelection(), d = a.getSelectedElement();
      return d && d.is("a") ? d : (a = a.getRanges()[0]) ? (a.shrink(CKEDITOR.SHRINK_TEXT), b.elementPath(a.getCommonAncestor()).contains("a", 1)) : null
    },
    fakeAnchor: CKEDITOR.env.opera || CKEDITOR.env.webkit,
    synAnchorSelector: CKEDITOR.env.ie && 11 > CKEDITOR.env.version,
    emptyAnchorFix: CKEDITOR.env.ie && 8 > CKEDITOR.env.version,
    tryRestoreFakeAnchor: function (b, a) {
      if (a && a.data("cke-real-element-type") && "anchor" == a.data("cke-real-element-type")) {
        var d =
          b.restoreRealElement(a);
        if (d.data("cke-saved-name"))return d
      }
    }
  };
  CKEDITOR.unlinkCommand = function () {
  };
  CKEDITOR.unlinkCommand.prototype = {
    exec: function (b) {
      var a = new CKEDITOR.style({element: "a", type: CKEDITOR.STYLE_INLINE, alwaysRemoveElement: 1});
      b.removeStyle(a)
    }, refresh: function (b, a) {
      var d = a.lastElement && a.lastElement.getAscendant("a", !0);
      d && "a" == d.getName() && d.getAttribute("href") && d.getChildCount() ? this.setState(CKEDITOR.TRISTATE_OFF) : this.setState(CKEDITOR.TRISTATE_DISABLED)
    }, contextSensitive: 1, startDisabled: 1, requiredContent: "a[href]"
  };
  CKEDITOR.removeAnchorCommand = function () {
  };
  CKEDITOR.removeAnchorCommand.prototype = {
    exec: function (b) {
      var a = b.getSelection(), d = a.createBookmarks(), c;
      if (a && (c = a.getSelectedElement()) && (CKEDITOR.plugins.link.fakeAnchor && !c.getChildCount() ? CKEDITOR.plugins.link.tryRestoreFakeAnchor(b, c) : c.is("a")))c.remove(1); else if (c = CKEDITOR.plugins.link.getSelectedLink(b))c.hasAttribute("href") ? (c.removeAttributes({
        name: 1,
        "data-cke-saved-name": 1
      }), c.removeClass("cke_anchor")) : c.remove(1);
      a.selectBookmarks(d)
    }, requiredContent: "a[name]"
  };
  CKEDITOR.tools.extend(CKEDITOR.config, {linkShowAdvancedTab: !0, linkShowTargetTab: !0});
  (function () {
    function E(c, k, e) {
      function b(b) {
        if ((d = a[b ? "getFirst" : "getLast"]()) && (!d.is || !d.isBlockBoundary()) && (m = k.root[b ? "getPrevious" : "getNext"](CKEDITOR.dom.walker.invisible(!0))) && (!m.is || !m.isBlockBoundary({br: 1})))c.document.createElement("br")[b ? "insertBefore" : "insertAfter"](d)
      }

      for (var j = CKEDITOR.plugins.list.listToArray(k.root, e), g = [], h = 0; h < k.contents.length; h++) {
        var f = k.contents[h];
        if ((f = f.getAscendant("li", !0)) && !f.getCustomData("list_item_processed"))g.push(f), CKEDITOR.dom.element.setMarker(e,
          f, "list_item_processed", !0)
      }
      f = null;
      for (h = 0; h < g.length; h++)f = g[h].getCustomData("listarray_index"), j[f].indent = -1;
      for (h = f + 1; h < j.length; h++)if (j[h].indent > j[h - 1].indent + 1) {
        g = j[h - 1].indent + 1 - j[h].indent;
        for (f = j[h].indent; j[h] && j[h].indent >= f;)j[h].indent += g, h++;
        h--
      }
      var a = CKEDITOR.plugins.list.arrayToList(j, e, null, c.config.enterMode, k.root.getAttribute("dir")).listNode, d, m;
      b(!0);
      b();
      a.replace(k.root);
      c.fire("contentDomInvalidated")
    }

    function x(c, k) {
      this.name = c;
      this.context = this.type = k;
      this.allowedContent =
        k + " li";
      this.requiredContent = k
    }

    function A(c, k, e, b) {
      for (var j, g; j = c[b ? "getLast" : "getFirst"](F);)(g = j.getDirection(1)) !== k.getDirection(1) && j.setAttribute("dir", g), j.remove(), e ? j[b ? "insertBefore" : "insertAfter"](e) : k.append(j, b)
    }

    function B(c) {
      var k;
      (k = function (e) {
        var b = c[e ? "getPrevious" : "getNext"](q);
        b && (b.type == CKEDITOR.NODE_ELEMENT && b.is(c.getName())) && (A(c, b, null, !e), c.remove(), c = b)
      })();
      k(1)
    }

    function C(c) {
      return c.type == CKEDITOR.NODE_ELEMENT && (c.getName()in CKEDITOR.dtd.$block || c.getName()in CKEDITOR.dtd.$listItem) &&
        CKEDITOR.dtd[c.getName()]["#"]
    }

    function y(c, k, e) {
      c.fire("saveSnapshot");
      e.enlarge(CKEDITOR.ENLARGE_LIST_ITEM_CONTENTS);
      var b = e.extractContents();
      k.trim(!1, !0);
      var j = k.createBookmark(), g = new CKEDITOR.dom.elementPath(k.startContainer), h = g.block, g = g.lastElement.getAscendant("li", 1) || h, f = new CKEDITOR.dom.elementPath(e.startContainer), a = f.contains(CKEDITOR.dtd.$listItem), f = f.contains(CKEDITOR.dtd.$list);
      h ? (h = h.getBogus()) && h.remove() : f && (h = f.getPrevious(q)) && v(h) && h.remove();
      (h = b.getLast()) && (h.type ==
      CKEDITOR.NODE_ELEMENT && h.is("br")) && h.remove();
      (h = k.startContainer.getChild(k.startOffset)) ? b.insertBefore(h) : k.startContainer.append(b);
      if (a && (b = w(a)))g.contains(a) ? (A(b, a.getParent(), a), b.remove()) : g.append(b);
      for (; e.checkStartOfBlock() && e.checkEndOfBlock();)f = e.startPath(), b = f.block, b.is("li") && (g = b.getParent(), b.equals(g.getLast(q)) && b.equals(g.getFirst(q)) && (b = g)), e.moveToPosition(b, CKEDITOR.POSITION_BEFORE_START), b.remove();
      e = e.clone();
      b = c.editable();
      e.setEndAt(b, CKEDITOR.POSITION_BEFORE_END);
      e = new CKEDITOR.dom.walker(e);
      e.evaluator = function (a) {
        return q(a) && !v(a)
      };
      (e = e.next()) && (e.type == CKEDITOR.NODE_ELEMENT && e.getName()in CKEDITOR.dtd.$list) && B(e);
      k.moveToBookmark(j);
      k.select();
      c.fire("saveSnapshot")
    }

    function w(c) {
      return (c = c.getLast(q)) && c.type == CKEDITOR.NODE_ELEMENT && c.getName()in r ? c : null
    }

    var r = {
      ol: 1,
      ul: 1
    }, G = CKEDITOR.dom.walker.whitespaces(), D = CKEDITOR.dom.walker.bookmark(), q = function (c) {
      return !(G(c) || D(c))
    }, v = CKEDITOR.dom.walker.bogus();
    CKEDITOR.plugins.list = {
      listToArray: function (c,
                             k, e, b, j) {
        if (!r[c.getName()])return [];
        b || (b = 0);
        e || (e = []);
        for (var g = 0, h = c.getChildCount(); g < h; g++) {
          var f = c.getChild(g);
          f.type == CKEDITOR.NODE_ELEMENT && f.getName()in CKEDITOR.dtd.$list && CKEDITOR.plugins.list.listToArray(f, k, e, b + 1);
          if ("li" == f.$.nodeName.toLowerCase()) {
            var a = {parent: c, indent: b, element: f, contents: []};
            j ? a.grandparent = j : (a.grandparent = c.getParent(), a.grandparent && "li" == a.grandparent.$.nodeName.toLowerCase() && (a.grandparent = a.grandparent.getParent()));
            k && CKEDITOR.dom.element.setMarker(k, f,
              "listarray_index", e.length);
            e.push(a);
            for (var d = 0, m = f.getChildCount(), i; d < m; d++)i = f.getChild(d), i.type == CKEDITOR.NODE_ELEMENT && r[i.getName()] ? CKEDITOR.plugins.list.listToArray(i, k, e, b + 1, a.grandparent) : a.contents.push(i)
          }
        }
        return e
      }, arrayToList: function (c, k, e, b, j) {
        e || (e = 0);
        if (!c || c.length < e + 1)return null;
        for (var g, h = c[e].parent.getDocument(), f = new CKEDITOR.dom.documentFragment(h), a = null, d = e, m = Math.max(c[e].indent, 0), i = null, n, l, p = b == CKEDITOR.ENTER_P ? "p" : "div"; ;) {
          var o = c[d];
          g = o.grandparent;
          n = o.element.getDirection(1);
          if (o.indent == m) {
            if (!a || c[d].parent.getName() != a.getName())a = c[d].parent.clone(!1, 1), j && a.setAttribute("dir", j), f.append(a);
            i = a.append(o.element.clone(0, 1));
            n != a.getDirection(1) && i.setAttribute("dir", n);
            for (g = 0; g < o.contents.length; g++)i.append(o.contents[g].clone(1, 1));
            d++
          } else if (o.indent == Math.max(m, 0) + 1)o = c[d - 1].element.getDirection(1), d = CKEDITOR.plugins.list.arrayToList(c, null, d, b, o != n ? n : null), !i.getChildCount() && (CKEDITOR.env.needsNbspFiller && !(7 < h.$.documentMode)) && i.append(h.createText(" ")),
            i.append(d.listNode), d = d.nextIndex; else if (-1 == o.indent && !e && g) {
            r[g.getName()] ? (i = o.element.clone(!1, !0), n != g.getDirection(1) && i.setAttribute("dir", n)) : i = new CKEDITOR.dom.documentFragment(h);
            var a = g.getDirection(1) != n, u = o.element, z = u.getAttribute("class"), v = u.getAttribute("style"), w = i.type == CKEDITOR.NODE_DOCUMENT_FRAGMENT && (b != CKEDITOR.ENTER_BR || a || v || z), s, x = o.contents.length, t;
            for (g = 0; g < x; g++)if (s = o.contents[g], D(s) && 1 < x)w ? t = s.clone(1, 1) : i.append(s.clone(1, 1)); else if (s.type == CKEDITOR.NODE_ELEMENT &&
              s.isBlockBoundary()) {
              a && !s.getDirection() && s.setAttribute("dir", n);
              l = s;
              var y = u.getAttribute("style");
              y && l.setAttribute("style", y.replace(/([^;])$/, "$1;") + (l.getAttribute("style") || ""));
              z && s.addClass(z);
              l = null;
              t && (i.append(t), t = null);
              i.append(s.clone(1, 1))
            } else w ? (l || (l = h.createElement(p), i.append(l), a && l.setAttribute("dir", n)), v && l.setAttribute("style", v), z && l.setAttribute("class", z), t && (l.append(t), t = null), l.append(s.clone(1, 1))) : i.append(s.clone(1, 1));
            t && ((l || i).append(t), t = null);
            i.type == CKEDITOR.NODE_DOCUMENT_FRAGMENT &&
            d != c.length - 1 && (CKEDITOR.env.needsBrFiller && (n = i.getLast()) && (n.type == CKEDITOR.NODE_ELEMENT && n.is("br")) && n.remove(), n = i.getLast(q), (!n || !(n.type == CKEDITOR.NODE_ELEMENT && n.is(CKEDITOR.dtd.$block))) && i.append(h.createElement("br")));
            n = i.$.nodeName.toLowerCase();
            ("div" == n || "p" == n) && i.appendBogus();
            f.append(i);
            a = null;
            d++
          } else return null;
          l = null;
          if (c.length <= d || Math.max(c[d].indent, 0) < m)break
        }
        if (k)for (c = f.getFirst(); c;) {
          if (c.type == CKEDITOR.NODE_ELEMENT && (CKEDITOR.dom.element.clearMarkers(k, c), c.getName()in
            CKEDITOR.dtd.$listItem && (e = c, h = j = b = void 0, b = e.getDirection()))) {
            for (j = e.getParent(); j && !(h = j.getDirection());)j = j.getParent();
            b == h && e.removeAttribute("dir")
          }
          c = c.getNextSourceNode()
        }
        return {listNode: f, nextIndex: d}
      }
    };
    var H = /^h[1-6]$/, F = CKEDITOR.dom.walker.nodeType(CKEDITOR.NODE_ELEMENT);
    x.prototype = {
      exec: function (c) {
        this.refresh(c, c.elementPath());
        var k = c.config, e = c.getSelection(), b = e && e.getRanges();
        if (this.state == CKEDITOR.TRISTATE_OFF) {
          var j = c.editable();
          if (j.getFirst(q)) {
            var g = 1 == b.length && b[0];
            (k =
              g && g.getEnclosedNode()) && (k.is && this.type == k.getName()) && this.setState(CKEDITOR.TRISTATE_ON)
          } else k.enterMode == CKEDITOR.ENTER_BR ? j.appendBogus() : b[0].fixBlock(1, k.enterMode == CKEDITOR.ENTER_P ? "p" : "div"), e.selectRanges(b)
        }
        for (var k = e.createBookmarks(!0), j = [], h = {}, b = b.createIterator(), f = 0; (g = b.getNextRange()) && ++f;) {
          var a = g.getBoundaryNodes(), d = a.startNode, m = a.endNode;
          d.type == CKEDITOR.NODE_ELEMENT && "td" == d.getName() && g.setStartAt(a.startNode, CKEDITOR.POSITION_AFTER_START);
          m.type == CKEDITOR.NODE_ELEMENT &&
          "td" == m.getName() && g.setEndAt(a.endNode, CKEDITOR.POSITION_BEFORE_END);
          g = g.createIterator();
          for (g.forceBrBreak = this.state == CKEDITOR.TRISTATE_OFF; a = g.getNextParagraph();)if (!a.getCustomData("list_block")) {
            CKEDITOR.dom.element.setMarker(h, a, "list_block", 1);
            for (var i = c.elementPath(a), d = i.elements, m = 0, i = i.blockLimit, n, l = d.length - 1; 0 <= l && (n = d[l]); l--)if (r[n.getName()] && i.contains(n)) {
              i.removeCustomData("list_group_object_" + f);
              (d = n.getCustomData("list_group_object")) ? d.contents.push(a) : (d = {root: n, contents: [a]},
                j.push(d), CKEDITOR.dom.element.setMarker(h, n, "list_group_object", d));
              m = 1;
              break
            }
            m || (m = i, m.getCustomData("list_group_object_" + f) ? m.getCustomData("list_group_object_" + f).contents.push(a) : (d = {
              root: m,
              contents: [a]
            }, CKEDITOR.dom.element.setMarker(h, m, "list_group_object_" + f, d), j.push(d)))
          }
        }
        for (n = []; 0 < j.length;)if (d = j.shift(), this.state == CKEDITOR.TRISTATE_OFF)if (r[d.root.getName()]) {
          b = c;
          f = d;
          d = h;
          g = n;
          m = CKEDITOR.plugins.list.listToArray(f.root, d);
          i = [];
          for (a = 0; a < f.contents.length; a++)if (l = f.contents[a], (l = l.getAscendant("li",
              !0)) && !l.getCustomData("list_item_processed"))i.push(l), CKEDITOR.dom.element.setMarker(d, l, "list_item_processed", !0);
          for (var l = f.root.getDocument(), p = void 0, o = void 0, a = 0; a < i.length; a++) {
            var u = i[a].getCustomData("listarray_index"), p = m[u].parent;
            p.is(this.type) || (o = l.createElement(this.type), p.copyAttributes(o, {
              start: 1,
              type: 1
            }), o.removeStyle("list-style-type"), m[u].parent = o)
          }
          d = CKEDITOR.plugins.list.arrayToList(m, d, null, b.config.enterMode);
          m = void 0;
          i = d.listNode.getChildCount();
          for (a = 0; a < i && (m = d.listNode.getChild(a)); a++)m.getName() ==
          this.type && g.push(m);
          d.listNode.replace(f.root);
          b.fire("contentDomInvalidated")
        } else {
          m = c;
          a = d;
          g = n;
          i = a.contents;
          b = a.root.getDocument();
          f = [];
          1 == i.length && i[0].equals(a.root) && (d = b.createElement("div"), i[0].moveChildren && i[0].moveChildren(d), i[0].append(d), i[0] = d);
          a = a.contents[0].getParent();
          for (l = 0; l < i.length; l++)a = a.getCommonAncestor(i[l].getParent());
          p = m.config.useComputedState;
          m = d = void 0;
          p = void 0 === p || p;
          for (l = 0; l < i.length; l++)for (o = i[l]; u = o.getParent();) {
            if (u.equals(a)) {
              f.push(o);
              !m && o.getDirection() &&
              (m = 1);
              o = o.getDirection(p);
              null !== d && (d = d && d != o ? null : o);
              break
            }
            o = u
          }
          if (!(1 > f.length)) {
            i = f[f.length - 1].getNext();
            l = b.createElement(this.type);
            g.push(l);
            for (p = g = void 0; f.length;)g = f.shift(), p = b.createElement("li"), g.is("pre") || H.test(g.getName()) || "false" == g.getAttribute("contenteditable") ? g.appendTo(p) : (g.copyAttributes(p), d && g.getDirection() && (p.removeStyle("direction"), p.removeAttribute("dir")), g.moveChildren(p), g.remove()), p.appendTo(l);
            d && m && l.setAttribute("dir", d);
            i ? l.insertBefore(i) : l.appendTo(a)
          }
        } else this.state ==
        CKEDITOR.TRISTATE_ON && r[d.root.getName()] && E.call(this, c, d, h);
        for (l = 0; l < n.length; l++)B(n[l]);
        CKEDITOR.dom.element.clearAllMarkers(h);
        e.selectBookmarks(k);
        c.focus()
      }, refresh: function (c, k) {
        var e = k.contains(r, 1), b = k.blockLimit || k.root;
        e && b.contains(e) ? this.setState(e.is(this.type) ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF) : this.setState(CKEDITOR.TRISTATE_OFF)
      }
    };
    CKEDITOR.plugins.add("list", {
      requires: "indentlist", init: function (c) {
        c.blockless || (c.addCommand("numberedlist", new x("numberedlist", "ol")), c.addCommand("bulletedlist",
          new x("bulletedlist", "ul")), c.ui.addButton && (c.ui.addButton("NumberedList", {
          label: c.lang.list.numberedlist,
          command: "numberedlist",
          directional: !0,
          toolbar: "list,10"
        }), c.ui.addButton("BulletedList", {
          label: c.lang.list.bulletedlist,
          command: "bulletedlist",
          directional: !0,
          toolbar: "list,20"
        })), c.on("key", function (k) {
          var e = k.data.keyCode;
          if (c.mode == "wysiwyg" && e in{8: 1, 46: 1}) {
            var b = c.getSelection().getRanges()[0], j = b && b.startPath();
            if (b && b.collapsed) {
              var j = new CKEDITOR.dom.elementPath(b.startContainer), g = e ==
                8, h = c.editable(), f = new CKEDITOR.dom.walker(b.clone());
              f.evaluator = function (a) {
                return q(a) && !v(a)
              };
              f.guard = function (a, b) {
                return !(b && a.type == CKEDITOR.NODE_ELEMENT && a.is("table"))
              };
              e = b.clone();
              if (g) {
                var a, d;
                if ((a = j.contains(r)) && b.checkBoundaryOfElement(a, CKEDITOR.START) && (a = a.getParent()) && a.is("li") && (a = w(a))) {
                  d = a;
                  a = a.getPrevious(q);
                  e.moveToPosition(a && v(a) ? a : d, CKEDITOR.POSITION_BEFORE_START)
                } else {
                  f.range.setStartAt(h, CKEDITOR.POSITION_AFTER_START);
                  f.range.setEnd(b.startContainer, b.startOffset);
                  if ((a =
                      f.previous()) && a.type == CKEDITOR.NODE_ELEMENT && (a.getName()in r || a.is("li"))) {
                    if (!a.is("li")) {
                      f.range.selectNodeContents(a);
                      f.reset();
                      f.evaluator = C;
                      a = f.previous()
                    }
                    d = a;
                    e.moveToElementEditEnd(d)
                  }
                }
                if (d) {
                  y(c, e, b);
                  k.cancel()
                } else if ((e = j.contains(r)) && b.checkBoundaryOfElement(e, CKEDITOR.START)) {
                  d = e.getFirst(q);
                  if (b.checkBoundaryOfElement(d, CKEDITOR.START)) {
                    a = e.getPrevious(q);
                    if (w(d)) {
                      if (a) {
                        b.moveToElementEditEnd(a);
                        b.select()
                      }
                    } else c.execCommand("outdent");
                    k.cancel()
                  }
                }
              } else if (d = j.contains("li")) {
                f.range.setEndAt(h,
                  CKEDITOR.POSITION_BEFORE_END);
                h = (j = d.getLast(q)) && C(j) ? j : d;
                d = 0;
                if ((a = f.next()) && a.type == CKEDITOR.NODE_ELEMENT && a.getName()in r && a.equals(j)) {
                  d = 1;
                  a = f.next()
                } else b.checkBoundaryOfElement(h, CKEDITOR.END) && (d = 1);
                if (d && a) {
                  b = b.clone();
                  b.moveToElementEditStart(a);
                  y(c, e, b);
                  k.cancel()
                }
              } else {
                f.range.setEndAt(h, CKEDITOR.POSITION_BEFORE_END);
                if ((a = f.next()) && a.type == CKEDITOR.NODE_ELEMENT && a.is(r)) {
                  a = a.getFirst(q);
                  if (j.block && b.checkStartOfBlock() && b.checkEndOfBlock()) {
                    j.block.remove();
                    b.moveToElementEditStart(a);
                    b.select()
                  } else if (w(a)) {
                    b.moveToElementEditStart(a);
                    b.select()
                  } else {
                    b = b.clone();
                    b.moveToElementEditStart(a);
                    y(c, e, b)
                  }
                  k.cancel()
                }
              }
              setTimeout(function () {
                c.selectionChange(1)
              })
            }
          }
        }))
      }
    })
  })();
  (function () {
    function Q(a, c, d) {
      return m(c) && m(d) && d.equals(c.getNext(function (a) {
          return !(z(a) || A(a) || p(a))
        }))
    }

    function u(a) {
      this.upper = a[0];
      this.lower = a[1];
      this.set.apply(this, a.slice(2))
    }

    function J(a) {
      var c = a.element;
      if (c && m(c) && (c = c.getAscendant(a.triggers, !0)) && a.editable.contains(c)) {
        var d = K(c, !0);
        if ("true" == d.getAttribute("contenteditable"))return c;
        if (d.is(a.triggers))return d
      }
      return null
    }

    function ga(a, c, d) {
      o(a, c);
      o(a, d);
      a = c.size.bottom;
      d = d.size.top;
      return a && d ? 0 | (a + d) / 2 : a || d
    }

    function r(a, c,
               d) {
      return c = c[d ? "getPrevious" : "getNext"](function (b) {
        return b && b.type == CKEDITOR.NODE_TEXT && !z(b) || m(b) && !p(b) && !v(a, b)
      })
    }

    function K(a, c) {
      if (a.data("cke-editable"))return null;
      for (c || (a = a.getParent()); a && !a.data("cke-editable");) {
        if (a.hasAttribute("contenteditable"))return a;
        a = a.getParent()
      }
      return null
    }

    function ha(a) {
      var c = a.doc, d = B('<span contenteditable="false" style="' + L + "position:absolute;border-top:1px dashed " + a.boxColor + '"></span>', c), b = this.path + "images/" + (n.hidpi ? "hidpi/" : "") + "icon.png";
      q(d,
        {
          attach: function () {
            this.wrap.getParent() || this.wrap.appendTo(a.editable, !0);
            return this
          },
          lineChildren: [q(B('<span title="' + a.editor.lang.magicline.title + '" contenteditable="false">&#8629;</span>', c), {
            base: L + "height:17px;width:17px;" + (a.rtl ? "left" : "right") + ":17px;background:url(" + b + ") center no-repeat " + a.boxColor + ";cursor:pointer;" + (n.hc ? "font-size: 15px;line-height:14px;border:1px solid #fff;text-align:center;" : "") + (n.hidpi ? "background-size: 9px 10px;" : ""),
            looks: ["top:-8px;" + CKEDITOR.tools.cssVendorPrefix("border-radius",
              "2px", 1), "top:-17px;" + CKEDITOR.tools.cssVendorPrefix("border-radius", "2px 2px 0px 0px", 1), "top:-1px;" + CKEDITOR.tools.cssVendorPrefix("border-radius", "0px 0px 2px 2px", 1)]
          }), q(B(R, c), {
            base: S + "left:0px;border-left-color:" + a.boxColor + ";",
            looks: ["border-width:8px 0 8px 8px;top:-8px", "border-width:8px 0 0 8px;top:-8px", "border-width:0 0 8px 8px;top:0px"]
          }), q(B(R, c), {
            base: S + "right:0px;border-right-color:" + a.boxColor + ";",
            looks: ["border-width:8px 8px 8px 0;top:-8px", "border-width:8px 8px 0 0;top:-8px", "border-width:0 8px 8px 0;top:0px"]
          })],
          detach: function () {
            this.wrap.getParent() && this.wrap.remove();
            return this
          },
          mouseNear: function () {
            o(a, this);
            var b = a.holdDistance, c = this.size;
            return c && a.mouse.y > c.top - b && a.mouse.y < c.bottom + b && a.mouse.x > c.left - b && a.mouse.x < c.right + b ? !0 : !1
          },
          place: function () {
            var b = a.view, c = a.editable, d = a.trigger, h = d.upper, g = d.lower, j = h || g, l = j.getParent(), k = {};
            this.trigger = d;
            h && o(a, h, !0);
            g && o(a, g, !0);
            o(a, l, !0);
            a.inInlineMode && C(a, !0);
            l.equals(c) ? (k.left = b.scroll.x, k.right = -b.scroll.x, k.width = "") : (k.left = j.size.left - j.size.margin.left +
              b.scroll.x - (a.inInlineMode ? b.editable.left + b.editable.border.left : 0), k.width = j.size.outerWidth + j.size.margin.left + j.size.margin.right + b.scroll.x, k.right = "");
            h && g ? k.top = h.size.margin.bottom === g.size.margin.top ? 0 | h.size.bottom + h.size.margin.bottom / 2 : h.size.margin.bottom < g.size.margin.top ? h.size.bottom + h.size.margin.bottom : h.size.bottom + h.size.margin.bottom - g.size.margin.top : h ? g || (k.top = h.size.bottom + h.size.margin.bottom) : k.top = g.size.top - g.size.margin.top;
            d.is(x) || k.top > b.scroll.y - 15 && k.top < b.scroll.y +
            5 ? (k.top = a.inInlineMode ? 0 : b.scroll.y, this.look(x)) : d.is(y) || k.top > b.pane.bottom - 5 && k.top < b.pane.bottom + 15 ? (k.top = a.inInlineMode ? b.editable.height + b.editable.padding.top + b.editable.padding.bottom : b.pane.bottom - 1, this.look(y)) : (a.inInlineMode && (k.top -= b.editable.top + b.editable.border.top), this.look(s));
            a.inInlineMode && (k.top--, k.top += b.editable.scroll.top, k.left += b.editable.scroll.left);
            for (var T in k)k[T] = CKEDITOR.tools.cssLength(k[T]);
            this.setStyles(k)
          },
          look: function (a) {
            if (this.oldLook != a) {
              for (var b =
                this.lineChildren.length, c; b--;)(c = this.lineChildren[b]).setAttribute("style", c.base + c.looks[0 | a / 2]);
              this.oldLook = a
            }
          },
          wrap: new M("span", a.doc)
        });
      for (c = d.lineChildren.length; c--;)d.lineChildren[c].appendTo(d);
      d.look(s);
      d.appendTo(d.wrap);
      d.unselectable();
      d.lineChildren[0].on("mouseup", function (b) {
        d.detach();
        N(a, function (b) {
          var c = a.line.trigger;
          b[c.is(D) ? "insertBefore" : "insertAfter"](c.is(D) ? c.lower : c.upper)
        }, !0);
        a.editor.focus();
        !n.ie && a.enterMode != CKEDITOR.ENTER_BR && a.hotNode.scrollIntoView();
        b.data.preventDefault(!0)
      });
      d.on("mousedown", function (a) {
        a.data.preventDefault(!0)
      });
      a.line = d
    }

    function N(a, c, d) {
      var b = new CKEDITOR.dom.range(a.doc), e = a.editor, f;
      n.ie && a.enterMode == CKEDITOR.ENTER_BR ? f = a.doc.createText(E) : (f = (f = K(a.element, !0)) && f.data("cke-enter-mode") || a.enterMode, f = new M(F[f], a.doc), f.is("br") || a.doc.createText(E).appendTo(f));
      d && e.fire("saveSnapshot");
      c(f);
      b.moveToPosition(f, CKEDITOR.POSITION_AFTER_START);
      e.getSelection().selectRanges([b]);
      a.hotNode = f;
      d && e.fire("saveSnapshot")
    }

    function U(a, c) {
      return {
        canUndo: !0,
        modes: {wysiwyg: 1}, exec: function () {
          function d(b) {
            var d = n.ie && 9 > n.version ? " " : E, f = a.hotNode && a.hotNode.getText() == d && a.element.equals(a.hotNode) && a.lastCmdDirection === !!c;
            N(a, function (d) {
              f && a.hotNode && a.hotNode.remove();
              d[c ? "insertAfter" : "insertBefore"](b);
              d.setAttributes({"data-cke-magicline-hot": 1, "data-cke-magicline-dir": !!c});
              a.lastCmdDirection = !!c
            });
            !n.ie && a.enterMode != CKEDITOR.ENTER_BR && a.hotNode.scrollIntoView();
            a.line.detach()
          }

          return function (b) {
            var b = b.getSelection().getStartElement(), e, b =
              b.getAscendant(V, 1);
            if (!W(a, b) && b && !b.equals(a.editable) && !b.contains(a.editable)) {
              if ((e = K(b)) && "false" == e.getAttribute("contenteditable"))b = e;
              a.element = b;
              e = r(a, b, !c);
              var f;
              m(e) && e.is(a.triggers) && e.is(ia) && (!r(a, e, !c) || (f = r(a, e, !c)) && m(f) && f.is(a.triggers)) ? d(e) : (f = J(a, b), m(f) && (r(a, f, !c) ? (b = r(a, f, !c)) && (m(b) && b.is(a.triggers)) && d(f) : d(f)))
            }
          }
        }()
      }
    }

    function v(a, c) {
      if (!c || !(c.type == CKEDITOR.NODE_ELEMENT && c.$))return !1;
      var d = a.line;
      return d.wrap.equals(c) || d.wrap.contains(c)
    }

    function m(a) {
      return a &&
        a.type == CKEDITOR.NODE_ELEMENT && a.$
    }

    function p(a) {
      if (!m(a))return !1;
      var c;
      if (!(c = X(a)))m(a) ? (c = {
        left: 1,
        right: 1,
        center: 1
      }, c = !(!c[a.getComputedStyle("float")] && !c[a.getAttribute("align")])) : c = !1;
      return c
    }

    function X(a) {
      return !!{absolute: 1, fixed: 1}[a.getComputedStyle("position")]
    }

    function G(a, c) {
      return m(c) ? c.is(a.triggers) : null
    }

    function W(a, c) {
      if (!c)return !1;
      for (var d = c.getParents(1), b = d.length; b--;)for (var e = a.tabuList.length; e--;)if (d[b].hasAttribute(a.tabuList[e]))return !0;
      return !1
    }

    function ja(a, c,
                d) {
      c = c[d ? "getLast" : "getFirst"](function (b) {
        return a.isRelevant(b) && !b.is(ka)
      });
      if (!c)return !1;
      o(a, c);
      return d ? c.size.top > a.mouse.y : c.size.bottom < a.mouse.y
    }

    function Y(a) {
      var c = a.editable, d = a.mouse, b = a.view, e = a.triggerOffset;
      C(a);
      var f = d.y > (a.inInlineMode ? b.editable.top + b.editable.height / 2 : Math.min(b.editable.height, b.pane.height) / 2), c = c[f ? "getLast" : "getFirst"](function (a) {
        return !(z(a) || A(a))
      });
      if (!c)return null;
      v(a, c) && (c = a.line.wrap[f ? "getPrevious" : "getNext"](function (a) {
        return !(z(a) || A(a))
      }));
      if (!m(c) ||
        p(c) || !G(a, c))return null;
      o(a, c);
      return !f && 0 <= c.size.top && 0 < d.y && d.y < c.size.top + e ? (a = a.inInlineMode || 0 === b.scroll.y ? x : s, new u([null, c, D, H, a])) : f && c.size.bottom <= b.pane.height && d.y > c.size.bottom - e && d.y < b.pane.height ? (a = a.inInlineMode || c.size.bottom > b.pane.height - e && c.size.bottom < b.pane.height ? y : s, new u([c, null, Z, H, a])) : null
    }

    function $(a) {
      var c = a.mouse, d = a.view, b = a.triggerOffset, e = J(a);
      if (!e)return null;
      o(a, e);
      var b = Math.min(b, 0 | e.size.outerHeight / 2), f = [], i, h;
      if (c.y > e.size.top - 1 && c.y < e.size.top + b)h = !1; else if (c.y > e.size.bottom - b && c.y < e.size.bottom + 1)h = !0; else return null;
      if (p(e) || ja(a, e, h) || e.getParent().is(aa))return null;
      var g = r(a, e, !h);
      if (g) {
        if (g && g.type == CKEDITOR.NODE_TEXT)return null;
        if (m(g)) {
          if (p(g) || !G(a, g) || g.getParent().is(aa))return null;
          f = [g, e][h ? "reverse" : "concat"]().concat([O, H])
        }
      } else e.equals(a.editable[h ? "getLast" : "getFirst"](a.isRelevant)) ? (C(a), h && c.y > e.size.bottom - b && c.y < d.pane.height && e.size.bottom > d.pane.height - b && e.size.bottom < d.pane.height ? i = y : 0 < c.y && c.y < e.size.top + b &&
      (i = x)) : i = s, f = [null, e][h ? "reverse" : "concat"]().concat([h ? Z : D, H, i, e.equals(a.editable[h ? "getLast" : "getFirst"](a.isRelevant)) ? h ? y : x : s]);
      return 0 in f ? new u(f) : null
    }

    function P(a, c, d, b) {
      for (var e = function () {
        var b = n.ie ? c.$.currentStyle : a.win.$.getComputedStyle(c.$, "");
        return n.ie ? function (a) {
          return b[CKEDITOR.tools.cssStyleToDomStyle(a)]
        } : function (a) {
          return b.getPropertyValue(a)
        }
      }(), f = c.getDocumentPosition(), i = {}, h = {}, g = {}, j = {}, l = t.length; l--;)i[t[l]] = parseInt(e("border-" + t[l] + "-width"), 10) || 0, g[t[l]] =
        parseInt(e("padding-" + t[l]), 10) || 0, h[t[l]] = parseInt(e("margin-" + t[l]), 10) || 0;
      (!d || b) && I(a, b);
      j.top = f.y - (d ? 0 : a.view.scroll.y);
      j.left = f.x - (d ? 0 : a.view.scroll.x);
      j.outerWidth = c.$.offsetWidth;
      j.outerHeight = c.$.offsetHeight;
      j.height = j.outerHeight - (g.top + g.bottom + i.top + i.bottom);
      j.width = j.outerWidth - (g.left + g.right + i.left + i.right);
      j.bottom = j.top + j.outerHeight;
      j.right = j.left + j.outerWidth;
      a.inInlineMode && (j.scroll = {top: c.$.scrollTop, left: c.$.scrollLeft});
      return q({border: i, padding: g, margin: h, ignoreScroll: d},
        j, !0)
    }

    function o(a, c, d) {
      if (!m(c))return c.size = null;
      if (c.size) {
        if (c.size.ignoreScroll == d && c.size.date > new Date - ba)return null
      } else c.size = {};
      return q(c.size, P(a, c, d), {date: +new Date}, !0)
    }

    function C(a, c) {
      a.view.editable = P(a, a.editable, c, !0)
    }

    function I(a, c) {
      a.view || (a.view = {});
      var d = a.view;
      if (c || !(d && d.date > new Date - ba)) {
        var b = a.win, d = b.getScrollPosition(), b = b.getViewPaneSize();
        q(a.view, {
          scroll: {
            x: d.x,
            y: d.y,
            width: a.doc.$.documentElement.scrollWidth - b.width,
            height: a.doc.$.documentElement.scrollHeight -
            b.height
          }, pane: {width: b.width, height: b.height, bottom: b.height + d.y}, date: +new Date
        }, !0)
      }
    }

    function la(a, c, d, b) {
      for (var e = b, f = b, i = 0, h = !1, g = !1, j = a.view.pane.height, l = a.mouse; l.y + i < j && 0 < l.y - i;) {
        h || (h = c(e, b));
        g || (g = c(f, b));
        !h && 0 < l.y - i && (e = d(a, {x: l.x, y: l.y - i}));
        !g && l.y + i < j && (f = d(a, {x: l.x, y: l.y + i}));
        if (h && g)break;
        i += 2
      }
      return new u([e, f, null, null])
    }

    CKEDITOR.plugins.add("magicline", {
      init: function (a) {
        var c = a.config, d = c.magicline_triggerOffset || 30, b = {
          editor: a,
          enterMode: c.enterMode,
          triggerOffset: d,
          holdDistance: 0 |
          d * (c.magicline_holdDistance || 0.5),
          boxColor: c.magicline_color || "#ff0000",
          rtl: "rtl" == c.contentsLangDirection,
          tabuList: ["data-cke-hidden-sel"].concat(c.magicline_tabuList || []),
          triggers: c.magicline_everywhere ? V : {table: 1, hr: 1, div: 1, ul: 1, ol: 1, dl: 1, form: 1, blockquote: 1}
        }, e, f, i;
        b.isRelevant = function (a) {
          return m(a) && !v(b, a) && !p(a)
        };
        a.on("contentDom", function () {
          var d = a.editable(), g = a.document, j = a.window;
          q(b, {editable: d, inInlineMode: d.isInline(), doc: g, win: j, hotNode: null}, !0);
          b.boundary = b.inInlineMode ? b.editable :
            b.doc.getDocumentElement();
          d.is(w.$inline) || (b.inInlineMode && !X(d) && d.setStyles({
            position: "relative",
            top: null,
            left: null
          }), ha.call(this, b), I(b), d.attachListener(a, "beforeUndoImage", function () {
            b.line.detach()
          }), d.attachListener(a, "beforeGetData", function () {
            b.line.wrap.getParent() && (b.line.detach(), a.once("getData", function () {
              b.line.attach()
            }, null, null, 1E3))
          }, null, null, 0), d.attachListener(b.inInlineMode ? g : g.getWindow().getFrame(), "mouseout", function (c) {
            if ("wysiwyg" == a.mode)if (b.inInlineMode) {
              var d = c.data.$.clientX,
                c = c.data.$.clientY;
              I(b);
              C(b, !0);
              var e = b.view.editable, f = b.view.scroll;
              if (!(d > e.left - f.x && d < e.right - f.x) || !(c > e.top - f.y && c < e.bottom - f.y))clearTimeout(i), i = null, b.line.detach()
            } else clearTimeout(i), i = null, b.line.detach()
          }), d.attachListener(d, "keyup", function () {
            b.hiddenMode = 0
          }), d.attachListener(d, "keydown", function (c) {
            if ("wysiwyg" == a.mode)switch (c = c.data.getKeystroke(), a.getSelection().getStartElement(), c) {
              case 2228240:
              case 16:
                b.hiddenMode = 1, b.line.detach()
            }
          }), d.attachListener(b.inInlineMode ? d : g, "mousemove",
            function (c) {
              f = !0;
              if (!("wysiwyg" != a.mode || a.readOnly || i)) {
                var d = {x: c.data.$.clientX, y: c.data.$.clientY};
                i = setTimeout(function () {
                  b.mouse = d;
                  i = b.trigger = null;
                  I(b);
                  if (f && !b.hiddenMode && a.focusManager.hasFocus && !b.line.mouseNear() && (b.element = ca(b, !0)))(b.trigger = Y(b) || $(b) || da(b)) && !W(b, b.trigger.upper || b.trigger.lower) ? b.line.attach().place() : (b.trigger = null, b.line.detach()), f = !1
                }, 30)
              }
            }), d.attachListener(j, "scroll", function () {
            "wysiwyg" == a.mode && (b.line.detach(), n.webkit && (b.hiddenMode = 1, clearTimeout(e),
              e = setTimeout(function () {
                b.mouseDown || (b.hiddenMode = 0)
              }, 50)))
          }), d.attachListener(ea ? g : j, "mousedown", function () {
            "wysiwyg" == a.mode && (b.line.detach(), b.hiddenMode = 1, b.mouseDown = 1)
          }), d.attachListener(ea ? g : j, "mouseup", function () {
            b.hiddenMode = 0;
            b.mouseDown = 0
          }), a.addCommand("accessPreviousSpace", U(b)), a.addCommand("accessNextSpace", U(b, !0)), a.setKeystroke([[c.magicline_keystrokePrevious, "accessPreviousSpace"], [c.magicline_keystrokeNext, "accessNextSpace"]]), a.on("loadSnapshot", function () {
            var c, d, e, f;
            for (f in{
              p: 1,
              br: 1, div: 1
            }) {
              c = a.document.getElementsByTag(f);
              for (e = c.count(); e--;)if ((d = c.getItem(e)).data("cke-magicline-hot")) {
                b.hotNode = d;
                b.lastCmdDirection = "true" === d.data("cke-magicline-dir") ? !0 : !1;
                return
              }
            }
          }), this.backdoor = {
            accessFocusSpace: N,
            boxTrigger: u,
            isLine: v,
            getAscendantTrigger: J,
            getNonEmptyNeighbour: r,
            getSize: P,
            that: b,
            triggerEdge: $,
            triggerEditable: Y,
            triggerExpand: da
          })
        }, this)
      }
    });
    var q = CKEDITOR.tools.extend, M = CKEDITOR.dom.element, B = M.createFromHtml, n = CKEDITOR.env, ea = CKEDITOR.env.ie && 9 > CKEDITOR.env.version,
      w = CKEDITOR.dtd, F = {}, D = 128, Z = 64, O = 32, H = 16, fa = 8, x = 4, y = 2, s = 1, E = " ", aa = w.$listItem, ka = w.$tableContent, ia = q({}, w.$nonEditable, w.$empty), V = w.$block, ba = 100, L = "width:0px;height:0px;padding:0px;margin:0px;display:block;z-index:9999;color:#fff;position:absolute;font-size: 0px;line-height:0px;", S = L + "border-color:transparent;display:block;border-style:solid;", R = "<span>" + E + "</span>";
    F[CKEDITOR.ENTER_BR] = "br";
    F[CKEDITOR.ENTER_P] = "p";
    F[CKEDITOR.ENTER_DIV] = "div";
    u.prototype = {
      set: function (a, c, d) {
        this.properties = a +
          c + (d || s);
        return this
      }, is: function (a) {
        return (this.properties & a) == a
      }
    };
    var ca = function () {
        return function (a, c, d) {
          if (!a.mouse)return null;
          var b = a.doc, e = a.line.wrap, d = d || a.mouse, f = new CKEDITOR.dom.element(b.$.elementFromPoint(d.x, d.y));
          c && v(a, f) && (e.hide(), f = new CKEDITOR.dom.element(b.$.elementFromPoint(d.x, d.y)), e.show());
          return !f || !(f.type == CKEDITOR.NODE_ELEMENT && f.$) || n.ie && 9 > n.version && !a.boundary.equals(f) && !a.boundary.contains(f) ? null : f
        }
      }(), z = CKEDITOR.dom.walker.whitespaces(), A = CKEDITOR.dom.walker.nodeType(CKEDITOR.NODE_COMMENT),
      da = function () {
        function a(a) {
          var b = a.element, e, f, i;
          if (!m(b) || b.contains(a.editable) || b.isReadOnly())return null;
          i = la(a, function (a, b) {
            return !b.equals(a)
          }, function (a, b) {
            return ca(a, !0, b)
          }, b);
          e = i.upper;
          f = i.lower;
          if (Q(a, e, f))return i.set(O, fa);
          if (e && b.contains(e))for (; !e.getParent().equals(b);)e = e.getParent(); else e = b.getFirst(function (b) {
            return c(a, b)
          });
          if (f && b.contains(f))for (; !f.getParent().equals(b);)f = f.getParent(); else f = b.getLast(function (b) {
            return c(a, b)
          });
          if (!e || !f)return null;
          o(a, e);
          o(a, f);
          if (!(a.mouse.y >
            e.size.top && a.mouse.y < f.size.bottom))return null;
          for (var b = Number.MAX_VALUE, h, g, j, l; f && !f.equals(e) && (g = e.getNext(a.isRelevant));)h = Math.abs(ga(a, e, g) - a.mouse.y), h < b && (b = h, j = e, l = g), e = g, o(a, e);
          if (!j || !l || !(a.mouse.y > j.size.top && a.mouse.y < l.size.bottom))return null;
          i.upper = j;
          i.lower = l;
          return i.set(O, fa)
        }

        function c(a, b) {
          return !(b && b.type == CKEDITOR.NODE_TEXT || A(b) || p(b) || v(a, b) || b.type == CKEDITOR.NODE_ELEMENT && b.$ && b.is("br"))
        }

        return function (c) {
          var b = a(c), e;
          if (e = b) {
            e = b.upper;
            var f = b.lower;
            e = !e || !f || p(f) ||
            p(e) || f.equals(e) || e.equals(f) || f.contains(e) || e.contains(f) ? !1 : G(c, e) && G(c, f) && Q(c, e, f) ? !0 : !1
          }
          return e ? b : null
        }
      }(), t = ["top", "left", "right", "bottom"]
  })();
  CKEDITOR.config.magicline_keystrokePrevious = CKEDITOR.CTRL + CKEDITOR.SHIFT + 51;
  CKEDITOR.config.magicline_keystrokeNext = CKEDITOR.CTRL + CKEDITOR.SHIFT + 52;
  (function () {
    function l(a) {
      if (!a || a.type != CKEDITOR.NODE_ELEMENT || "form" != a.getName())return [];
      for (var e = [], f = ["style", "className"], b = 0; b < f.length; b++) {
        var d = a.$.elements.namedItem(f[b]);
        d && (d = new CKEDITOR.dom.element(d), e.push([d, d.nextSibling]), d.remove())
      }
      return e
    }

    function o(a, e) {
      if (a && !(a.type != CKEDITOR.NODE_ELEMENT || "form" != a.getName()) && 0 < e.length)for (var f = e.length - 1; 0 <= f; f--) {
        var b = e[f][0], d = e[f][1];
        d ? b.insertBefore(d) : b.appendTo(a)
      }
    }

    function n(a, e) {
      var f = l(a), b = {}, d = a.$;
      e || (b["class"] = d.className ||
        "", d.className = "");
      b.inline = d.style.cssText || "";
      e || (d.style.cssText = "position: static; overflow: visible");
      o(f);
      return b
    }

    function p(a, e) {
      var f = l(a), b = a.$;
      "class"in e && (b.className = e["class"]);
      "inline"in e && (b.style.cssText = e.inline);
      o(f)
    }

    function q(a) {
      if (!a.editable().isInline()) {
        var e = CKEDITOR.instances, f;
        for (f in e) {
          var b = e[f];
          "wysiwyg" == b.mode && !b.readOnly && (b = b.document.getBody(), b.setAttribute("contentEditable", !1), b.setAttribute("contentEditable", !0))
        }
        a.editable().hasFocus && (a.toolbox.focus(),
          a.focus())
      }
    }

    CKEDITOR.plugins.add("maximize", {
      init: function (a) {
        function e() {
          var b = d.getViewPaneSize();
          a.resize(b.width, b.height, null, !0)
        }

        if (a.elementMode != CKEDITOR.ELEMENT_MODE_INLINE) {
          var f = a.lang, b = CKEDITOR.document, d = b.getWindow(), j, k, m, l = CKEDITOR.TRISTATE_OFF;
          a.addCommand("maximize", {
            modes: {wysiwyg: !CKEDITOR.env.iOS, source: !CKEDITOR.env.iOS},
            readOnly: 1,
            editorFocus: !1,
            exec: function () {
              var h = a.container.getChild(1), g = a.ui.space("contents");
              if ("wysiwyg" == a.mode) {
                var c = a.getSelection();
                j = c && c.getRanges();
                k = d.getScrollPosition()
              } else {
                var i = a.editable().$;
                j = !CKEDITOR.env.ie && [i.selectionStart, i.selectionEnd];
                k = [i.scrollLeft, i.scrollTop]
              }
              if (this.state == CKEDITOR.TRISTATE_OFF) {
                d.on("resize", e);
                m = d.getScrollPosition();
                for (c = a.container; c = c.getParent();)c.setCustomData("maximize_saved_styles", n(c)), c.setStyle("z-index", a.config.baseFloatZIndex - 5);
                g.setCustomData("maximize_saved_styles", n(g, !0));
                h.setCustomData("maximize_saved_styles", n(h, !0));
                g = {overflow: CKEDITOR.env.webkit ? "" : "hidden", width: 0, height: 0};
                b.getDocumentElement().setStyles(g);
                !CKEDITOR.env.gecko && b.getDocumentElement().setStyle("position", "fixed");
                (!CKEDITOR.env.gecko || !CKEDITOR.env.quirks) && b.getBody().setStyles(g);
                CKEDITOR.env.ie ? setTimeout(function () {
                  d.$.scrollTo(0, 0)
                }, 0) : d.$.scrollTo(0, 0);
                h.setStyle("position", CKEDITOR.env.gecko && CKEDITOR.env.quirks ? "fixed" : "absolute");
                h.$.offsetLeft;
                h.setStyles({"z-index": a.config.baseFloatZIndex - 5, left: "0px", top: "0px"});
                h.addClass("cke_maximized");
                e();
                g = h.getDocumentPosition();
                h.setStyles({
                  left: -1 *
                  g.x + "px", top: -1 * g.y + "px"
                });
                CKEDITOR.env.gecko && q(a)
              } else if (this.state == CKEDITOR.TRISTATE_ON) {
                d.removeListener("resize", e);
                g = [g, h];
                for (c = 0; c < g.length; c++)p(g[c], g[c].getCustomData("maximize_saved_styles")), g[c].removeCustomData("maximize_saved_styles");
                for (c = a.container; c = c.getParent();)p(c, c.getCustomData("maximize_saved_styles")), c.removeCustomData("maximize_saved_styles");
                CKEDITOR.env.ie ? setTimeout(function () {
                  d.$.scrollTo(m.x, m.y)
                }, 0) : d.$.scrollTo(m.x, m.y);
                h.removeClass("cke_maximized");
                CKEDITOR.env.webkit &&
                (h.setStyle("display", "inline"), setTimeout(function () {
                  h.setStyle("display", "block")
                }, 0));
                a.fire("resize")
              }
              this.toggleState();
              if (c = this.uiItems[0])g = this.state == CKEDITOR.TRISTATE_OFF ? f.maximize.maximize : f.maximize.minimize, c = CKEDITOR.document.getById(c._.id), c.getChild(1).setHtml(g), c.setAttribute("title", g), c.setAttribute("href", 'javascript:void("' + g + '");');
              "wysiwyg" == a.mode ? j ? (CKEDITOR.env.gecko && q(a), a.getSelection().selectRanges(j), (i = a.getSelection().getStartElement()) && i.scrollIntoView(!0)) :
                d.$.scrollTo(k.x, k.y) : (j && (i.selectionStart = j[0], i.selectionEnd = j[1]), i.scrollLeft = k[0], i.scrollTop = k[1]);
              j = k = null;
              l = this.state;
              a.fire("maximize", this.state)
            },
            canUndo: !1
          });
          a.ui.addButton && a.ui.addButton("Maximize", {
            label: f.maximize.maximize,
            command: "maximize",
            toolbar: "tools,10"
          });
          a.on("mode", function () {
            var b = a.getCommand("maximize");
            b.setState(b.state == CKEDITOR.TRISTATE_DISABLED ? CKEDITOR.TRISTATE_DISABLED : l)
          }, null, null, 100)
        }
      }
    })
  })();
  (function () {
    var c = {
      canUndo: !1, async: !0, exec: function (a) {
        a.getClipboardData({title: a.lang.pastetext.title}, function (b) {
          b && a.fire("paste", {type: "text", dataValue: b.dataValue});
          a.fire("afterCommandExec", {name: "pastetext", command: c, returnValue: !!b})
        })
      }
    };
    CKEDITOR.plugins.add("pastetext", {
      requires: "clipboard", init: function (a) {
        a.addCommand("pastetext", c);
        a.ui.addButton && a.ui.addButton("PasteText", {
          label: a.lang.pastetext.button,
          command: "pastetext",
          toolbar: "clipboard,40"
        });
        if (a.config.forcePasteAsPlainText)a.on("beforePaste",
          function (a) {
            "html" != a.data.type && (a.data.type = "text")
          });
        a.on("pasteState", function (b) {
          a.getCommand("pastetext").setState(b.data)
        })
      }
    })
  })();
  (function () {
    function h(a, d, f) {
      var b = CKEDITOR.cleanWord;
      b ? f() : (a = CKEDITOR.getUrl(a.config.pasteFromWordCleanupFile || d + "filter/default.js"), CKEDITOR.scriptLoader.load(a, f, null, !0));
      return !b
    }

    function i(a) {
      a.data.type = "html"
    }

    CKEDITOR.plugins.add("pastefromword", {
      requires: "clipboard", init: function (a) {
        var d = 0, f = this.path;
        a.addCommand("pastefromword", {
          canUndo: !1, async: !0, exec: function (a) {
            var e = this;
            d = 1;
            a.once("beforePaste", i);
            a.getClipboardData({title: a.lang.pastefromword.title}, function (c) {
              c && a.fire("paste",
                {type: "html", dataValue: c.dataValue});
              a.fire("afterCommandExec", {name: "pastefromword", command: e, returnValue: !!c})
            })
          }
        });
        a.ui.addButton && a.ui.addButton("PasteFromWord", {
          label: a.lang.pastefromword.toolbar,
          command: "pastefromword",
          toolbar: "clipboard,50"
        });
        a.on("pasteState", function (b) {
          a.getCommand("pastefromword").setState(b.data)
        });
        a.on("paste", function (b) {
          var e = b.data, c = e.dataValue;
          if (c && (d || /(class=\"?Mso|style=\"[^\"]*\bmso\-|w:WordDocument)/.test(c))) {
            var g = h(a, f, function () {
              if (g)a.fire("paste", e);
              else if (!a.config.pasteFromWordPromptCleanup || d || confirm(a.lang.pastefromword.confirmCleanup))e.dataValue = CKEDITOR.cleanWord(c, a)
            });
            g && b.cancel()
          }
        }, null, null, 3)
      }
    })
  })();
  CKEDITOR.plugins.add("removeformat", {
    init: function (a) {
      a.addCommand("removeFormat", CKEDITOR.plugins.removeformat.commands.removeformat);
      a.ui.addButton && a.ui.addButton("RemoveFormat", {
        label: a.lang.removeformat.toolbar,
        command: "removeFormat",
        toolbar: "cleanup,10"
      })
    }
  });
  CKEDITOR.plugins.removeformat = {
    commands: {
      removeformat: {
        exec: function (a) {
          for (var h = a._.removeFormatRegex || (a._.removeFormatRegex = RegExp("^(?:" + a.config.removeFormatTags.replace(/,/g, "|") + ")$", "i")), e = a._.removeAttributes || (a._.removeAttributes = a.config.removeFormatAttributes.split(",")), f = CKEDITOR.plugins.removeformat.filter, k = a.getSelection().getRanges(1), l = k.createIterator(), c; c = l.getNextRange();) {
            c.collapsed || c.enlarge(CKEDITOR.ENLARGE_ELEMENT);
            var i = c.createBookmark(), b = i.startNode, j = i.endNode,
              d = function (b) {
                for (var c = a.elementPath(b), e = c.elements, d = 1, g; (g = e[d]) && !g.equals(c.block) && !g.equals(c.blockLimit); d++)h.test(g.getName()) && f(a, g) && b.breakParent(g)
              };
            d(b);
            if (j) {
              d(j);
              for (b = b.getNextSourceNode(!0, CKEDITOR.NODE_ELEMENT); b && !b.equals(j);)d = b.getNextSourceNode(!1, CKEDITOR.NODE_ELEMENT), !("img" == b.getName() && b.data("cke-realelement")) && f(a, b) && (h.test(b.getName()) ? b.remove(1) : (b.removeAttributes(e), a.fire("removeFormatCleanup", b))), b = d
            }
            c.moveToBookmark(i)
          }
          a.forceNextSelectionCheck();
          a.getSelection().selectRanges(k)
        }
      }
    },
    filter: function (a, h) {
      for (var e = a._.removeFormatFilters || [], f = 0; f < e.length; f++)if (!1 === e[f](h))return !1;
      return !0
    }
  };
  CKEDITOR.editor.prototype.addRemoveFormatFilter = function (a) {
    this._.removeFormatFilters || (this._.removeFormatFilters = []);
    this._.removeFormatFilters.push(a)
  };
  CKEDITOR.config.removeFormatTags = "b,big,code,del,dfn,em,font,i,ins,kbd,q,s,samp,small,span,strike,strong,sub,sup,tt,u,var";
  CKEDITOR.config.removeFormatAttributes = "class,style,lang,width,height,align,hspace,valign";
  (function () {
    CKEDITOR.plugins.add("sourcearea", {
      init: function (a) {
        function d() {
          this.hide();
          this.setStyle("height", this.getParent().$.clientHeight + "px");
          this.setStyle("width", this.getParent().$.clientWidth + "px");
          this.show()
        }

        if (a.elementMode != CKEDITOR.ELEMENT_MODE_INLINE) {
          var e = CKEDITOR.plugins.sourcearea;
          a.addMode("source", function (e) {
            var b = a.ui.space("contents").getDocument().createElement("textarea");
            b.setStyles(CKEDITOR.tools.extend({
              width: CKEDITOR.env.ie7Compat ? "99%" : "100%", height: "100%", resize: "none",
              outline: "none", "text-align": "left"
            }, CKEDITOR.tools.cssVendorPrefix("tab-size", a.config.sourceAreaTabSize || 4)));
            b.setAttribute("dir", "ltr");
            b.addClass("cke_source cke_reset cke_enable_context_menu");
            a.ui.space("contents").append(b);
            b = a.editable(new c(a, b));
            b.setData(a.getData(1));
            CKEDITOR.env.ie && (b.attachListener(a, "resize", d, b), b.attachListener(CKEDITOR.document.getWindow(), "resize", d, b), CKEDITOR.tools.setTimeout(d, 0, b));
            a.fire("ariaWidget", this);
            e()
          });
          a.addCommand("source", e.commands.source);
          a.ui.addButton &&
          a.ui.addButton("Source", {label: a.lang.sourcearea.toolbar, command: "source", toolbar: "mode,10"});
          a.on("mode", function () {
            a.getCommand("source").setState("source" == a.mode ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF)
          })
        }
      }
    });
    var c = CKEDITOR.tools.createClass({
      base: CKEDITOR.editable, proto: {
        setData: function (a) {
          this.setValue(a);
          this.editor.fire("dataReady")
        }, getData: function () {
          return this.getValue()
        }, insertHtml: function () {
        }, insertElement: function () {
        }, insertText: function () {
        }, setReadOnly: function (a) {
          this[(a ? "set" :
            "remove") + "Attribute"]("readOnly", "readonly")
        }, detach: function () {
          c.baseProto.detach.call(this);
          this.clearCustomData();
          this.remove()
        }
      }
    })
  })();
  CKEDITOR.plugins.sourcearea = {
    commands: {
      source: {
        modes: {wysiwyg: 1, source: 1},
        editorFocus: !1,
        readOnly: 1,
        exec: function (c) {
          "wysiwyg" == c.mode && c.fire("saveSnapshot");
          c.getCommand("source").setState(CKEDITOR.TRISTATE_DISABLED);
          c.setMode("source" == c.mode ? "wysiwyg" : "source")
        },
        canUndo: !1
      }
    }
  };
  CKEDITOR.plugins.add("specialchar", {
    availableLangs: {
      ar: 1,
      bg: 1,
      ca: 1,
      cs: 1,
      cy: 1,
      de: 1,
      el: 1,
      en: 1,
      eo: 1,
      es: 1,
      et: 1,
      fa: 1,
      fi: 1,
      fr: 1,
      "fr-ca": 1,
      gl: 1,
      he: 1,
      hr: 1,
      hu: 1,
      id: 1,
      it: 1,
      ja: 1,
      km: 1,
      ku: 1,
      lv: 1,
      nb: 1,
      nl: 1,
      no: 1,
      pl: 1,
      pt: 1,
      "pt-br": 1,
      ru: 1,
      si: 1,
      sk: 1,
      sl: 1,
      sq: 1,
      sv: 1,
      th: 1,
      tr: 1,
      ug: 1,
      uk: 1,
      vi: 1,
      "zh-cn": 1
    }, requires: "dialog", init: function (a) {
      var c = this;
      CKEDITOR.dialog.add("specialchar", this.path + "dialogs/specialchar.js");
      a.addCommand("specialchar", {
        exec: function () {
          var b = a.langCode, b = c.availableLangs[b] ? b : c.availableLangs[b.replace(/-.*/,
            "")] ? b.replace(/-.*/, "") : "en";
          CKEDITOR.scriptLoader.load(CKEDITOR.getUrl(c.path + "dialogs/lang/" + b + ".js"), function () {
            CKEDITOR.tools.extend(a.lang.specialchar, c.langEntries[b]);
            a.openDialog("specialchar")
          })
        }, modes: {wysiwyg: 1}, canUndo: !1
      });
      a.ui.addButton && a.ui.addButton("SpecialChar", {
        label: a.lang.specialchar.toolbar,
        command: "specialchar",
        toolbar: "insert,50"
      })
    }
  });
  CKEDITOR.config.specialChars = "! &quot; # $ % &amp; ' ( ) * + - . / 0 1 2 3 4 5 6 7 8 9 : ; &lt; = &gt; ? @ A B C D E F G H I J K L M N O P Q R S T U V W X Y Z [ ] ^ _ ` a b c d e f g h i j k l m n o p q r s t u v w x y z { | } ~ &euro; &lsquo; &rsquo; &ldquo; &rdquo; &ndash; &mdash; &iexcl; &cent; &pound; &curren; &yen; &brvbar; &sect; &uml; &copy; &ordf; &laquo; &not; &reg; &macr; &deg; &sup2; &sup3; &acute; &micro; &para; &middot; &cedil; &sup1; &ordm; &raquo; &frac14; &frac12; &frac34; &iquest; &Agrave; &Aacute; &Acirc; &Atilde; &Auml; &Aring; &AElig; &Ccedil; &Egrave; &Eacute; &Ecirc; &Euml; &Igrave; &Iacute; &Icirc; &Iuml; &ETH; &Ntilde; &Ograve; &Oacute; &Ocirc; &Otilde; &Ouml; &times; &Oslash; &Ugrave; &Uacute; &Ucirc; &Uuml; &Yacute; &THORN; &szlig; &agrave; &aacute; &acirc; &atilde; &auml; &aring; &aelig; &ccedil; &egrave; &eacute; &ecirc; &euml; &igrave; &iacute; &icirc; &iuml; &eth; &ntilde; &ograve; &oacute; &ocirc; &otilde; &ouml; &divide; &oslash; &ugrave; &uacute; &ucirc; &uuml; &yacute; &thorn; &yuml; &OElig; &oelig; &#372; &#374 &#373 &#375; &sbquo; &#8219; &bdquo; &hellip; &trade; &#9658; &bull; &rarr; &rArr; &hArr; &diams; &asymp;".split(" ");
  CKEDITOR.plugins.add("menubutton", {
    requires: "button,menu", onLoad: function () {
      var d = function (c) {
        var a = this._, b = a.menu;
        a.state !== CKEDITOR.TRISTATE_DISABLED && (a.on && b ? b.hide() : (a.previousState = a.state, b || (b = a.menu = new CKEDITOR.menu(c, {
          panel: {
            className: "cke_menu_panel",
            attributes: {"aria-label": c.lang.common.options}
          }
        }), b.onHide = CKEDITOR.tools.bind(function () {
          var b = this.command ? c.getCommand(this.command).modes : this.modes;
          this.setState(!b || b[c.mode] ? a.previousState : CKEDITOR.TRISTATE_DISABLED);
          a.on = 0
        }, this),
        this.onMenu && b.addListener(this.onMenu)), this.setState(CKEDITOR.TRISTATE_ON), a.on = 1, setTimeout(function () {
          b.show(CKEDITOR.document.getById(a.id), 4)
        }, 0)))
      };
      CKEDITOR.ui.menuButton = CKEDITOR.tools.createClass({
        base: CKEDITOR.ui.button, $: function (c) {
          delete c.panel;
          this.base(c);
          this.hasArrow = !0;
          this.click = d
        }, statics: {
          handler: {
            create: function (c) {
              return new CKEDITOR.ui.menuButton(c)
            }
          }
        }
      })
    }, beforeInit: function (d) {
      d.ui.addHandler(CKEDITOR.UI_MENUBUTTON, CKEDITOR.ui.menuButton.handler)
    }
  });
  CKEDITOR.UI_MENUBUTTON = "menubutton";
  (function () {
    function o(a, c) {
      var b = 0, d;
      for (d in c)if (c[d] == a) {
        b = 1;
        break
      }
      return b
    }

    var j = "", r = function () {
      function a() {
        b.once("focus", g);
        b.once("blur", c)
      }

      function c(b) {
        var b = b.editor, c = d.getScayt(b), g = b.elementMode == CKEDITOR.ELEMENT_MODE_INLINE;
        c && (d.setPaused(b, !c.disabled), d.setControlId(b, c.id), c.destroy(!0), delete d.instances[b.name], g && a())
      }

      var b = this, g = function () {
        if (!("undefined" != typeof d.instances[b.name] || null != d.instances[b.name])) {
          var a = b.config, c = {};
          c.srcNodeRef = "BODY" == b.editable().$.nodeName ?
            b.document.getWindow().$.frameElement : b.editable().$;
          c.assocApp = "CKEDITOR." + CKEDITOR.version + "@" + CKEDITOR.revision;
          c.customerid = a.scayt_customerid || "1:WvF0D4-UtPqN1-43nkD4-NKvUm2-daQqk3-LmNiI-z7Ysb4-mwry24-T8YrS3-Q2tpq2";
          c.customDictionaryIds = a.scayt_customDictionaryIds || "";
          c.userDictionaryName = a.scayt_userDictionaryName || "";
          c.sLang = a.scayt_sLang || "en_US";
          c.onLoad = function () {
            CKEDITOR.env.ie && 8 > CKEDITOR.env.version || this.addStyle(this.selectorCss(), "padding-bottom: 2px !important;");
            b.editable().hasFocus && !d.isControlRestored(b) && this.focus()
          };
          a = window.scayt_custom_params;
          if ("object" == typeof a)for (var g in a)c[g] = a[g];
          d.getControlId(b) && (c.id = d.getControlId(b));
          var e = new window.scayt(c);
          e.afterMarkupRemove.push(function (a) {
            (new CKEDITOR.dom.element(a, e.document)).mergeSiblings()
          });
          if (c = d.instances[b.name])e.sLang = c.sLang, e.option(c.option()), e.paused = c.paused;
          d.instances[b.name] = e;
          try {
            e.setDisabled(!1 === d.isPaused(b))
          } catch (n) {
          }
          b.fire("showScaytState")
        }
      };
      b.elementMode == CKEDITOR.ELEMENT_MODE_INLINE ?
        a() : b.on("contentDom", g);
      b.on("contentDomUnload", function () {
        for (var a = CKEDITOR.document.getElementsByTag("script"), b = /^dojoIoScript(\d+)$/i, c = /^https?:\/\/svc\.webspellchecker\.net\/spellcheck\/script\/ssrv\.cgi/i, d = 0; d < a.count(); d++) {
          var g = a.getItem(d), e = g.getId(), f = g.getAttribute("src");
          e && (f && e.match(b) && f.match(c)) && g.remove()
        }
      });
      b.on("beforeCommandExec", function (a) {
        "source" == a.data.name && "source" == b.mode && d.markControlRestore(b)
      });
      b.on("afterCommandExec", function (a) {
        if (d.isScaytEnabled(b) && "wysiwyg" ==
          b.mode && ("undo" == a.data.name || "redo" == a.data.name))d.getScayt(b).setDisabled(!0), d.refresh_timeout && window.clearTimeout(d.refresh_timeout), d.refresh_timeout = window.setTimeout(function () {
          d.getScayt(b).setDisabled(!1);
          d.getScayt(b).focus();
          d.getScayt(b).refresh()
        }, 10)
      });
      b.on("destroy", c);
      b.on("setData", c);
      b.on("insertElement", function () {
        var a = d.getScayt(b);
        d.isScaytEnabled(b) && (CKEDITOR.env.ie && b.getSelection().unlock(!0), window.setTimeout(function () {
          a.focus();
          a.refresh()
        }, 10))
      }, this, null, 50);
      b.on("insertHtml",
        function () {
          var a = d.getScayt(b);
          d.isScaytEnabled(b) && (CKEDITOR.env.ie && b.getSelection().unlock(!0), window.setTimeout(function () {
            a.focus();
            a.refresh()
          }, 10))
        }, this, null, 50);
      b.on("scaytDialog", function (a) {
        a.data.djConfig = window.djConfig;
        a.data.scayt_control = d.getScayt(b);
        a.data.tab = j;
        a.data.scayt = window.scayt
      });
      var e = b.dataProcessor;
      (e = e && e.htmlFilter) && e.addRules({
        elements: {
          span: function (a) {
            if (a.attributes["data-scayt_word"] && a.attributes["data-scaytid"])return delete a.name, a
          }
        }
      });
      var e = CKEDITOR.plugins.undo.Image.prototype,
        f = "function" == typeof e.equalsContent ? "equalsContent" : "equals";
      e[f] = CKEDITOR.tools.override(e[f], function (a) {
        return function (b) {
          var c = this.contents, g = b.contents, e = d.getScayt(this.editor);
          e && d.isScaytReady(this.editor) && (this.contents = e.reset(c) || "", b.contents = e.reset(g) || "");
          e = a.apply(this, arguments);
          this.contents = c;
          b.contents = g;
          return e
        }
      });
      e = CKEDITOR.editor.prototype;
      e.checkDirty = CKEDITOR.tools.override(e.checkDirty, function (a) {
        return function () {
          var b = null, c = d.getScayt(this);
          c && d.isScaytReady(this) ?
            (b = c.reset(this.getSnapshot()), c = c.reset(this._.previousValue), b = b !== c) : b = a.apply(this);
          return b
        }
      });
      b.document && (b.elementMode != CKEDITOR.ELEMENT_MODE_INLINE || b.focusManager.hasFocus) && g()
    };
    CKEDITOR.plugins.scayt = {
      engineLoaded: !1, instances: {}, controlInfo: {}, setControlInfo: function (a, c) {
        a && (a.name && "object" != typeof this.controlInfo[a.name]) && (this.controlInfo[a.name] = {});
        for (var b in c)this.controlInfo[a.name][b] = c[b]
      }, isControlRestored: function (a) {
        return a && a.name && this.controlInfo[a.name] ? this.controlInfo[a.name].restored :
          !1
      }, markControlRestore: function (a) {
        this.setControlInfo(a, {restored: !0})
      }, setControlId: function (a, c) {
        this.setControlInfo(a, {id: c})
      }, getControlId: function (a) {
        return a && a.name && this.controlInfo[a.name] && this.controlInfo[a.name].id ? this.controlInfo[a.name].id : null
      }, setPaused: function (a, c) {
        this.setControlInfo(a, {paused: c})
      }, isPaused: function (a) {
        if (a && a.name && this.controlInfo[a.name])return this.controlInfo[a.name].paused
      }, getScayt: function (a) {
        return this.instances[a.name]
      }, isScaytReady: function (a) {
        return !0 ===
          this.engineLoaded && "undefined" !== typeof window.scayt && this.getScayt(a)
      }, isScaytEnabled: function (a) {
        return (a = this.getScayt(a)) ? !1 === a.disabled : !1
      }, getUiTabs: function (a) {
        var c = [], b = a.config.scayt_uiTabs || "1,1,1", b = b.split(",");
        b[3] = "1";
        for (var d = 0; 4 > d; d++)c[d] = "undefined" != typeof window.scayt && "undefined" != typeof window.scayt.uiTags ? parseInt(b[d], 10) && window.scayt.uiTags[d] : parseInt(b[d], 10);
        "object" == typeof a.plugins.wsc ? c.push(1) : c.push(0);
        return c
      }, loadEngine: function (a) {
        if (CKEDITOR.env.gecko && 10900 >
          CKEDITOR.env.version || CKEDITOR.env.opera || CKEDITOR.env.air)return a.fire("showScaytState");
        if (!0 === this.engineLoaded)return r.apply(a);
        if (-1 == this.engineLoaded)return CKEDITOR.on("scaytReady", function () {
          r.apply(a)
        });
        CKEDITOR.on("scaytReady", r, a);
        CKEDITOR.on("scaytReady", function () {
          this.engineLoaded = !0
        }, this, null, 0);
        this.engineLoaded = -1;
        var c = document.location.protocol, c = -1 != c.search(/https?:/) ? c : "http:", c = a.config.scayt_srcUrl || c + "//svc.webspellchecker.net/scayt26/loader__base.js", b = d.parseUrl(c).path +
          "/";
        void 0 == window.scayt ? (CKEDITOR._djScaytConfig = {
          baseUrl: b, addOnLoad: [function () {
            CKEDITOR.fireOnce("scaytReady")
          }], isDebug: !1
        }, CKEDITOR.document.getHead().append(CKEDITOR.document.createElement("script", {
          attributes: {
            type: "text/javascript",
            async: "true",
            src: c
          }
        }))) : CKEDITOR.fireOnce("scaytReady");
        return null
      }, parseUrl: function (a) {
        var c;
        return a.match && (c = a.match(/(.*)[\/\\](.*?\.\w+)$/)) ? {path: c[1], file: c[2]} : a
      }
    };
    var d = CKEDITOR.plugins.scayt, p = function (a, c, b, d, e, f, h) {
      a.addCommand(d, e);
      a.addMenuItem(d,
        {label: b, command: d, group: f, order: h})
    }, u = {
      preserveState: !0, editorFocus: !1, canUndo: !1, exec: function (a) {
        if (d.isScaytReady(a)) {
          var c = d.isScaytEnabled(a);
          this.setState(c ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_ON);
          a = d.getScayt(a);
          a.focus();
          a.setDisabled(c)
        } else!a.config.scayt_autoStartup && 0 <= d.engineLoaded && (a.focus(), this.setState(CKEDITOR.TRISTATE_DISABLED), d.loadEngine(a))
      }
    };
    CKEDITOR.plugins.add("scayt", {
      requires: "menubutton,dialog", beforeInit: function (a) {
        var c = a.config.scayt_contextMenuItemsOrder ||
          "suggest|moresuggest|control", b = "";
        if ((c = c.split("|")) && c.length)for (var d = 0; d < c.length; d++)b += "scayt_" + c[d] + (c.length != parseInt(d, 10) + 1 ? "," : "");
        a.config.menu_groups = b + "," + a.config.menu_groups
      }, checkEnvironment: function () {
        return CKEDITOR.env.opera || CKEDITOR.env.air ? 0 : 1
      }, init: function (a) {
        var c = a.dataProcessor && a.dataProcessor.dataFilter, b = {
          elements: {
            span: function (a) {
              var b = a.attributes;
              b && b["data-scaytid"] && delete a.name
            }
          }
        };
        c && c.addRules(b);
        var g = {}, e = {}, f = a.addCommand("scaytcheck", u);
        CKEDITOR.dialog.add("scaytcheck",
          CKEDITOR.getUrl(this.path + "dialogs/options.js"));
        c = d.getUiTabs(a);
        a.addMenuGroup("scaytButton");
        a.addMenuGroup("scayt_suggest", -10);
        a.addMenuGroup("scayt_moresuggest", -9);
        a.addMenuGroup("scayt_control", -8);
        var b = {}, h = a.lang.scayt;
        b.scaytToggle = {label: h.enable, command: "scaytcheck", group: "scaytButton"};
        1 == c[0] && (b.scaytOptions = {
          label: h.options, group: "scaytButton", onClick: function () {
            j = "options";
            a.openDialog("scaytcheck")
          }
        });
        1 == c[1] && (b.scaytLangs = {
          label: h.langs, group: "scaytButton", onClick: function () {
            j =
              "langs";
            a.openDialog("scaytcheck")
          }
        });
        1 == c[2] && (b.scaytDict = {
          label: h.dictionariesTab, group: "scaytButton", onClick: function () {
            j = "dictionaries";
            a.openDialog("scaytcheck")
          }
        });
        b.scaytAbout = {
          label: a.lang.scayt.about, group: "scaytButton", onClick: function () {
            j = "about";
            a.openDialog("scaytcheck")
          }
        };
        1 == c[4] && (b.scaytWSC = {label: a.lang.wsc.toolbar, group: "scaytButton", command: "checkspell"});
        a.addMenuItems(b);
        a.ui.add("Scayt", CKEDITOR.UI_MENUBUTTON, {
          label: h.title,
          title: CKEDITOR.env.opera ? h.opera_title : h.title,
          modes: {wysiwyg: this.checkEnvironment()},
          toolbar: "spellchecker,20",
          onRender: function () {
            f.on("state", function () {
              this.setState(f.state)
            }, this)
          },
          onMenu: function () {
            var b = d.isScaytEnabled(a);
            a.getMenuItem("scaytToggle").label = h[b ? "disable" : "enable"];
            var c = d.getUiTabs(a);
            return {
              scaytToggle: CKEDITOR.TRISTATE_OFF,
              scaytOptions: b && c[0] ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
              scaytLangs: b && c[1] ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
              scaytDict: b && c[2] ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
              scaytAbout: b && c[3] ? CKEDITOR.TRISTATE_OFF :
                CKEDITOR.TRISTATE_DISABLED,
              scaytWSC: c[4] ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED
            }
          }
        });
        a.contextMenu && a.addMenuItems && a.contextMenu.addListener(function (b, c) {
          if (!d.isScaytEnabled(a) || c.getRanges()[0].checkReadOnly())return null;
          var f = d.getScayt(a), n = f.getScaytNode();
          if (!n)return null;
          var i = f.getWord(n);
          if (!i)return null;
          var j = f.getLang(), l = a.config.scayt_contextCommands || "all", i = window.scayt.getSuggestion(i, j), l = l.split("|"), m;
          for (m in g) {
            delete a._.menuItems[m];
            delete a.commands[m]
          }
          for (m in e) {
            delete a._.menuItems[m];
            delete a.commands[m]
          }
          if (!i || !i.length) {
            p(a, "no_sugg", h.noSuggestions, "scayt_no_sugg", {
              exec: function () {
              }
            }, "scayt_control", 1, true);
            e.scayt_no_sugg = CKEDITOR.TRISTATE_OFF
          } else {
            g = {};
            e = {};
            m = a.config.scayt_moreSuggestions || "on";
            var j = false, s = a.config.scayt_maxSuggestions;
            typeof s != "number" && (s = 5);
            !s && (s = i.length);
            for (var k = 0, r = i.length; k < r; k = k + 1) {
              var q = "scayt_suggestion_" + i[k].replace(" ", "_"), t = function (a, b) {
                return {
                  exec: function () {
                    f.replace(a, b)
                  }
                }
              }(n, i[k]);
              if (k < s) {
                p(a, "button_" + q, i[k], q, t, "scayt_suggest",
                  k + 1);
                e[q] = CKEDITOR.TRISTATE_OFF
              } else if (m == "on") {
                p(a, "button_" + q, i[k], q, t, "scayt_moresuggest", k + 1);
                g[q] = CKEDITOR.TRISTATE_OFF;
                j = true
              }
            }
            if (j) {
              a.addMenuItem("scayt_moresuggest", {
                label: h.moreSuggestions,
                group: "scayt_moresuggest",
                order: 10,
                getItems: function () {
                  return g
                }
              });
              e.scayt_moresuggest = CKEDITOR.TRISTATE_OFF
            }
          }
          if (o("all", l) || o("ignore", l)) {
            p(a, "ignore", h.ignore, "scayt_ignore", {
              exec: function () {
                f.ignore(n)
              }
            }, "scayt_control", 2);
            e.scayt_ignore = CKEDITOR.TRISTATE_OFF
          }
          if (o("all", l) || o("ignoreall", l)) {
            p(a, "ignore_all",
              h.ignoreAll, "scayt_ignore_all", {
                exec: function () {
                  f.ignoreAll(n)
                }
              }, "scayt_control", 3);
            e.scayt_ignore_all = CKEDITOR.TRISTATE_OFF
          }
          if (o("all", l) || o("add", l)) {
            p(a, "add_word", h.addWord, "scayt_add_word", {
              exec: function () {
                window.scayt.addWordToUserDictionary(n)
              }
            }, "scayt_control", 4);
            e.scayt_add_word = CKEDITOR.TRISTATE_OFF
          }
          f.fireOnContextMenu && f.fireOnContextMenu(a);
          return e
        });
        c = function (b) {
          b.removeListener();
          CKEDITOR.env.opera || CKEDITOR.env.air ? f.setState(CKEDITOR.TRISTATE_DISABLED) : f.setState(d.isScaytEnabled(a) ?
            CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF)
        };
        a.on("showScaytState", c);
        a.on("instanceReady", c);
        if (a.config.scayt_autoStartup)a.on("instanceReady", function () {
          d.loadEngine(a)
        })
      }, afterInit: function (a) {
        var c, b = function (a) {
          if (a.hasAttribute("data-scaytid"))return !1
        };
        a._.elementsPath && (c = a._.elementsPath.filters) && c.push(b);
        a.addRemoveFormatFilter && a.addRemoveFormatFilter(b)
      }
    })
  })();
  (function () {
    CKEDITOR.plugins.add("stylescombo", {
      requires: "richcombo", init: function (c) {
        var j = c.config, f = c.lang.stylescombo, e = {}, i = [], k = [];
        c.on("stylesSet", function (b) {
          if (b = b.data.styles) {
            for (var a, h, d = 0, g = b.length; d < g; d++)if (a = b[d], !(c.blockless && a.element in CKEDITOR.dtd.$block) && (h = a.name, a = new CKEDITOR.style(a), !c.filter.customConfig || c.filter.check(a)))a._name = h, a._.enterMode = j.enterMode, a._.weight = d + 1E3 * (a.type == CKEDITOR.STYLE_OBJECT ? 1 : a.type == CKEDITOR.STYLE_BLOCK ? 2 : 3), e[h] = a, i.push(a), k.push(a);
            i.sort(function (a, b) {
              return a._.weight - b._.weight
            })
          }
        });
        c.ui.addRichCombo("Styles", {
          label: f.label,
          title: f.panelTitle,
          toolbar: "styles,10",
          allowedContent: k,
          panel: {
            css: [CKEDITOR.skin.getPath("editor")].concat(j.contentsCss),
            multiSelect: !0,
            attributes: {"aria-label": f.panelTitle}
          },
          init: function () {
            var b, a, c, d, g, e;
            g = 0;
            for (e = i.length; g < e; g++)b = i[g], a = b._name, d = b.type, d != c && (this.startGroup(f["panelTitle" + d]), c = d), this.add(a, b.type == CKEDITOR.STYLE_OBJECT ? a : b.buildPreview(), a);
            this.commit()
          },
          onClick: function (b) {
            c.focus();
            c.fire("saveSnapshot");
            var b = e[b], a = c.elementPath();
            c[b.checkActive(a) ? "removeStyle" : "applyStyle"](b);
            c.fire("saveSnapshot")
          },
          onRender: function () {
            c.on("selectionChange", function (b) {
              for (var a = this.getValue(), b = b.data.path.elements, c = 0, d = b.length, g; c < d; c++) {
                g = b[c];
                for (var f in e)if (e[f].checkElementRemovable(g, !0)) {
                  f != a && this.setValue(f);
                  return
                }
              }
              this.setValue("")
            }, this)
          },
          onOpen: function () {
            var b = c.getSelection().getSelectedElement(), b = c.elementPath(b), a = [0, 0, 0, 0];
            this.showAll();
            this.unmarkAll();
            for (var h in e) {
              var d =
                e[h], g = d.type;
              d.checkApplicable(b, c.activeFilter) ? a[g]++ : this.hideItem(h);
              d.checkActive(b) && this.mark(h)
            }
            a[CKEDITOR.STYLE_BLOCK] || this.hideGroup(f["panelTitle" + CKEDITOR.STYLE_BLOCK]);
            a[CKEDITOR.STYLE_INLINE] || this.hideGroup(f["panelTitle" + CKEDITOR.STYLE_INLINE]);
            a[CKEDITOR.STYLE_OBJECT] || this.hideGroup(f["panelTitle" + CKEDITOR.STYLE_OBJECT])
          },
          refresh: function () {
            var b = c.elementPath();
            if (b) {
              for (var a in e)if (e[a].checkApplicable(b, c.activeFilter))return;
              this.setState(CKEDITOR.TRISTATE_DISABLED)
            }
          },
          reset: function () {
            e =
            {};
            i = []
          }
        })
      }
    })
  })();
  (function () {
    function i(c) {
      return {
        editorFocus: !1, canUndo: !1, modes: {wysiwyg: 1}, exec: function (d) {
          if (d.editable().hasFocus) {
            var e = d.getSelection(), b;
            if (b = (new CKEDITOR.dom.elementPath(e.getCommonAncestor(), e.root)).contains({td: 1, th: 1}, 1)) {
              var e = d.createRange(), a = CKEDITOR.tools.tryThese(function () {
                var a = b.getParent().$.cells[b.$.cellIndex + (c ? -1 : 1)];
                a.parentNode.parentNode;
                return a
              }, function () {
                var a = b.getParent(), a = a.getAscendant("table").$.rows[a.$.rowIndex + (c ? -1 : 1)];
                return a.cells[c ? a.cells.length - 1 :
                  0]
              });
              if (!a && !c) {
                for (var f = b.getAscendant("table").$, a = b.getParent().$.cells, f = new CKEDITOR.dom.element(f.insertRow(-1), d.document), g = 0, h = a.length; g < h; g++)f.append((new CKEDITOR.dom.element(a[g], d.document)).clone(!1, !1)).appendBogus();
                e.moveToElementEditStart(f)
              } else if (a)a = new CKEDITOR.dom.element(a), e.moveToElementEditStart(a), (!e.checkStartOfBlock() || !e.checkEndOfBlock()) && e.selectNodeContents(a); else return !0;
              e.select(!0);
              return !0
            }
          }
          return !1
        }
      }
    }

    var h = {editorFocus: !1, modes: {wysiwyg: 1, source: 1}},
      g = {
        exec: function (c) {
          c.container.focusNext(!0, c.tabIndex)
        }
      }, f = {
        exec: function (c) {
          c.container.focusPrevious(!0, c.tabIndex)
        }
      };
    CKEDITOR.plugins.add("tab", {
      init: function (c) {
        for (var d = !1 !== c.config.enableTabKeyTools, e = c.config.tabSpaces || 0, b = ""; e--;)b += " ";
        if (b)c.on("key", function (a) {
          9 == a.data.keyCode && (c.insertHtml(b), a.cancel())
        });
        if (d)c.on("key", function (a) {
          (9 == a.data.keyCode && c.execCommand("selectNextCell") || a.data.keyCode == CKEDITOR.SHIFT + 9 && c.execCommand("selectPreviousCell")) && a.cancel()
        });
        c.addCommand("blur",
          CKEDITOR.tools.extend(g, h));
        c.addCommand("blurBack", CKEDITOR.tools.extend(f, h));
        c.addCommand("selectNextCell", i());
        c.addCommand("selectPreviousCell", i(!0))
      }
    })
  })();
  CKEDITOR.dom.element.prototype.focusNext = function (i, h) {
    var g = void 0 === h ? this.getTabIndex() : h, f, c, d, e, b, a;
    if (0 >= g)for (b = this.getNextSourceNode(i, CKEDITOR.NODE_ELEMENT); b;) {
      if (b.isVisible() && 0 === b.getTabIndex()) {
        d = b;
        break
      }
      b = b.getNextSourceNode(!1, CKEDITOR.NODE_ELEMENT)
    } else for (b = this.getDocument().getBody().getFirst(); b = b.getNextSourceNode(!1, CKEDITOR.NODE_ELEMENT);) {
      if (!f)if (!c && b.equals(this)) {
        if (c = !0, i) {
          if (!(b = b.getNextSourceNode(!0, CKEDITOR.NODE_ELEMENT)))break;
          f = 1
        }
      } else c && !this.contains(b) &&
      (f = 1);
      if (b.isVisible() && !(0 > (a = b.getTabIndex()))) {
        if (f && a == g) {
          d = b;
          break
        }
        a > g && (!d || !e || a < e) ? (d = b, e = a) : !d && 0 === a && (d = b, e = a)
      }
    }
    d && d.focus()
  };
  CKEDITOR.dom.element.prototype.focusPrevious = function (i, h) {
    for (var g = void 0 === h ? this.getTabIndex() : h, f, c, d, e = 0, b, a = this.getDocument().getBody().getLast(); a = a.getPreviousSourceNode(!1, CKEDITOR.NODE_ELEMENT);) {
      if (!f)if (!c && a.equals(this)) {
        if (c = !0, i) {
          if (!(a = a.getPreviousSourceNode(!0, CKEDITOR.NODE_ELEMENT)))break;
          f = 1
        }
      } else c && !this.contains(a) && (f = 1);
      if (a.isVisible() && !(0 > (b = a.getTabIndex())))if (0 >= g) {
        if (f && 0 === b) {
          d = a;
          break
        }
        b > e && (d = a, e = b)
      } else {
        if (f && b == g) {
          d = a;
          break
        }
        if (b < g && (!d || b > e))d = a, e = b
      }
    }
    d && d.focus()
  };
  CKEDITOR.plugins.add("table", {
    requires: "dialog", init: function (a) {
      function d(a) {
        return CKEDITOR.tools.extend(a || {}, {
          contextSensitive: 1, refresh: function (a, e) {
            this.setState(e.contains("table", 1) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED)
          }
        })
      }

      if (!a.blockless) {
        var b = a.lang.table;
        a.addCommand("table", new CKEDITOR.dialogCommand("table", {
          context: "table",
          allowedContent: "table{width,height}[align,border,cellpadding,cellspacing,summary];caption tbody thead tfoot;th td tr[scope];" + (a.plugins.dialogadvtab ?
          "table" + a.plugins.dialogadvtab.allowedContent() : ""),
          requiredContent: "table",
          contentTransformations: [["table{width}: sizeToStyle", "table[width]: sizeToAttribute"]]
        }));
        a.addCommand("tableProperties", new CKEDITOR.dialogCommand("tableProperties", d()));
        a.addCommand("tableDelete", d({
          exec: function (a) {
            var c = a.elementPath().contains("table", 1);
            if (c) {
              var b = c.getParent();
              1 == b.getChildCount() && !b.is("body", "td", "th") && (c = b);
              a = a.createRange();
              a.moveToPosition(c, CKEDITOR.POSITION_BEFORE_START);
              c.remove();
              a.select()
            }
          }
        }));
        a.ui.addButton && a.ui.addButton("Table", {label: b.toolbar, command: "table", toolbar: "insert,30"});
        CKEDITOR.dialog.add("table", this.path + "dialogs/table.js");
        CKEDITOR.dialog.add("tableProperties", this.path + "dialogs/table.js");
        a.addMenuItems && a.addMenuItems({
          table: {label: b.menu, command: "tableProperties", group: "table", order: 5},
          tabledelete: {label: b.deleteTable, command: "tableDelete", group: "table", order: 1}
        });
        a.on("doubleclick", function (a) {
          a.data.element.is("table") && (a.data.dialog = "tableProperties")
        });
        a.contextMenu &&
        a.contextMenu.addListener(function () {
          return {tabledelete: CKEDITOR.TRISTATE_OFF, table: CKEDITOR.TRISTATE_OFF}
        })
      }
    }
  });
  (function () {
    function p(e) {
      function d(a) {
        !(0 < b.length) && (a.type == CKEDITOR.NODE_ELEMENT && y.test(a.getName()) && !a.getCustomData("selected_cell")) && (CKEDITOR.dom.element.setMarker(c, a, "selected_cell", !0), b.push(a))
      }

      for (var e = e.getRanges(), b = [], c = {}, a = 0; a < e.length; a++) {
        var f = e[a];
        if (f.collapsed)f = f.getCommonAncestor(), (f = f.getAscendant("td", !0) || f.getAscendant("th", !0)) && b.push(f); else {
          var f = new CKEDITOR.dom.walker(f), g;
          for (f.guard = d; g = f.next();)if (g.type != CKEDITOR.NODE_ELEMENT || !g.is(CKEDITOR.dtd.table))if ((g =
              g.getAscendant("td", !0) || g.getAscendant("th", !0)) && !g.getCustomData("selected_cell"))CKEDITOR.dom.element.setMarker(c, g, "selected_cell", !0), b.push(g)
        }
      }
      CKEDITOR.dom.element.clearAllMarkers(c);
      return b
    }

    function o(e, d) {
      for (var b = p(e), c = b[0], a = c.getAscendant("table"), c = c.getDocument(), f = b[0].getParent(), g = f.$.rowIndex, b = b[b.length - 1], h = b.getParent().$.rowIndex + b.$.rowSpan - 1, b = new CKEDITOR.dom.element(a.$.rows[h]), g = d ? g : h, f = d ? f : b, b = CKEDITOR.tools.buildTableMap(a), a = b[g], g = d ? b[g - 1] : b[g + 1], b = b[0].length,
             c = c.createElement("tr"), h = 0; a[h] && h < b; h++) {
        var i;
        1 < a[h].rowSpan && g && a[h] == g[h] ? (i = a[h], i.rowSpan += 1) : (i = (new CKEDITOR.dom.element(a[h])).clone(), i.removeAttribute("rowSpan"), i.appendBogus(), c.append(i), i = i.$);
        h += i.colSpan - 1
      }
      d ? c.insertBefore(f) : c.insertAfter(f)
    }

    function q(e) {
      if (e instanceof CKEDITOR.dom.selection) {
        for (var d = p(e), b = d[0].getAscendant("table"), c = CKEDITOR.tools.buildTableMap(b), e = d[0].getParent().$.rowIndex, d = d[d.length - 1], a = d.getParent().$.rowIndex + d.$.rowSpan - 1, d = [], f = e; f <= a; f++) {
          for (var g =
            c[f], h = new CKEDITOR.dom.element(b.$.rows[f]), i = 0; i < g.length; i++) {
            var j = new CKEDITOR.dom.element(g[i]), l = j.getParent().$.rowIndex;
            1 == j.$.rowSpan ? j.remove() : (j.$.rowSpan -= 1, l == f && (l = c[f + 1], l[i - 1] ? j.insertAfter(new CKEDITOR.dom.element(l[i - 1])) : (new CKEDITOR.dom.element(b.$.rows[f + 1])).append(j, 1)));
            i += j.$.colSpan - 1
          }
          d.push(h)
        }
        c = b.$.rows;
        b = new CKEDITOR.dom.element(c[a + 1] || (0 < e ? c[e - 1] : null) || b.$.parentNode);
        for (f = d.length; 0 <= f; f--)q(d[f]);
        return b
      }
      e instanceof CKEDITOR.dom.element && (b = e.getAscendant("table"),
        1 == b.$.rows.length ? b.remove() : e.remove());
      return null
    }

    function r(e, d) {
      for (var b = d ? Infinity : 0, c = 0; c < e.length; c++) {
        var a;
        a = e[c];
        for (var f = d, g = a.getParent().$.cells, h = 0, i = 0; i < g.length; i++) {
          var j = g[i], h = h + (f ? 1 : j.colSpan);
          if (j == a.$)break
        }
        a = h - 1;
        if (d ? a < b : a > b)b = a
      }
      return b
    }

    function k(e, d) {
      for (var b = p(e), c = b[0].getAscendant("table"), a = r(b, 1), b = r(b), a = d ? a : b, f = CKEDITOR.tools.buildTableMap(c), c = [], b = [], g = f.length, h = 0; h < g; h++)c.push(f[h][a]), b.push(d ? f[h][a - 1] : f[h][a + 1]);
      for (h = 0; h < g; h++)c[h] && (1 < c[h].colSpan &&
      b[h] == c[h] ? (a = c[h], a.colSpan += 1) : (a = (new CKEDITOR.dom.element(c[h])).clone(), a.removeAttribute("colSpan"), a.appendBogus(), a[d ? "insertBefore" : "insertAfter"].call(a, new CKEDITOR.dom.element(c[h])), a = a.$), h += a.rowSpan - 1)
    }

    function u(e, d) {
      var b = e.getStartElement();
      if (b = b.getAscendant("td", 1) || b.getAscendant("th", 1)) {
        var c = b.clone();
        c.appendBogus();
        d ? c.insertBefore(b) : c.insertAfter(b)
      }
    }

    function t(e) {
      if (e instanceof CKEDITOR.dom.selection) {
        var e = p(e), d = e[0] && e[0].getAscendant("table"), b;
        a:{
          var c = 0;
          b = e.length -
            1;
          for (var a = {}, f, g; f = e[c++];)CKEDITOR.dom.element.setMarker(a, f, "delete_cell", !0);
          for (c = 0; f = e[c++];)if ((g = f.getPrevious()) && !g.getCustomData("delete_cell") || (g = f.getNext()) && !g.getCustomData("delete_cell")) {
            CKEDITOR.dom.element.clearAllMarkers(a);
            b = g;
            break a
          }
          CKEDITOR.dom.element.clearAllMarkers(a);
          g = e[0].getParent();
          (g = g.getPrevious()) ? b = g.getLast() : (g = e[b].getParent(), b = (g = g.getNext()) ? g.getChild(0) : null)
        }
        for (g = e.length - 1; 0 <= g; g--)t(e[g]);
        b ? m(b, !0) : d && d.remove()
      } else e instanceof CKEDITOR.dom.element &&
      (d = e.getParent(), 1 == d.getChildCount() ? d.remove() : e.remove())
    }

    function m(e, d) {
      var b = e.getDocument(), c = CKEDITOR.document;
      CKEDITOR.env.ie && 11 > CKEDITOR.env.version && (c.focus(), b.focus());
      b = new CKEDITOR.dom.range(b);
      if (!b["moveToElementEdit" + (d ? "End" : "Start")](e))b.selectNodeContents(e), b.collapse(d ? !1 : !0);
      b.select(!0)
    }

    function v(e, d, b) {
      e = e[d];
      if ("undefined" == typeof b)return e;
      for (d = 0; e && d < e.length; d++) {
        if (b.is && e[d] == b.$)return d;
        if (d == b)return new CKEDITOR.dom.element(e[d])
      }
      return b.is ? -1 : null
    }

    function s(e,
               d, b) {
      var c = p(e), a;
      if ((d ? 1 != c.length : 2 > c.length) || (a = e.getCommonAncestor()) && a.type == CKEDITOR.NODE_ELEMENT && a.is("table"))return !1;
      var f, e = c[0];
      a = e.getAscendant("table");
      var g = CKEDITOR.tools.buildTableMap(a), h = g.length, i = g[0].length, j = e.getParent().$.rowIndex, l = v(g, j, e);
      if (d) {
        var n;
        try {
          var m = parseInt(e.getAttribute("rowspan"), 10) || 1;
          f = parseInt(e.getAttribute("colspan"), 10) || 1;
          n = g["up" == d ? j - m : "down" == d ? j + m : j]["left" == d ? l - f : "right" == d ? l + f : l]
        } catch (z) {
          return !1
        }
        if (!n || e.$ == n)return !1;
        c["up" == d || "left" ==
        d ? "unshift" : "push"](new CKEDITOR.dom.element(n))
      }
      for (var d = e.getDocument(), o = j, m = n = 0, q = !b && new CKEDITOR.dom.documentFragment(d), s = 0, d = 0; d < c.length; d++) {
        f = c[d];
        var k = f.getParent(), t = f.getFirst(), r = f.$.colSpan, u = f.$.rowSpan, k = k.$.rowIndex, w = v(g, k, f), s = s + r * u, m = Math.max(m, w - l + r);
        n = Math.max(n, k - j + u);
        if (!b) {
          r = f;
          (u = r.getBogus()) && u.remove();
          r.trim();
          if (f.getChildren().count()) {
            if (k != o && t && (!t.isBlockBoundary || !t.isBlockBoundary({br: 1})))(o = q.getLast(CKEDITOR.dom.walker.whitespaces(!0))) && (!o.is || !o.is("br")) &&
            q.append("br");
            f.moveChildren(q)
          }
          d ? f.remove() : f.setHtml("")
        }
        o = k
      }
      if (b)return n * m == s;
      q.moveChildren(e);
      e.appendBogus();
      m >= i ? e.removeAttribute("rowSpan") : e.$.rowSpan = n;
      n >= h ? e.removeAttribute("colSpan") : e.$.colSpan = m;
      b = new CKEDITOR.dom.nodeList(a.$.rows);
      c = b.count();
      for (d = c - 1; 0 <= d; d--)a = b.getItem(d), a.$.cells.length || (a.remove(), c++);
      return e
    }

    function w(e, d) {
      var b = p(e);
      if (1 < b.length)return !1;
      if (d)return !0;
      var b = b[0], c = b.getParent(), a = c.getAscendant("table"), f = CKEDITOR.tools.buildTableMap(a), g = c.$.rowIndex,
        h = v(f, g, b), i = b.$.rowSpan, j;
      if (1 < i) {
        j = Math.ceil(i / 2);
        for (var i = Math.floor(i / 2), c = g + j, a = new CKEDITOR.dom.element(a.$.rows[c]), f = v(f, c), l, c = b.clone(), g = 0; g < f.length; g++)if (l = f[g], l.parentNode == a.$ && g > h) {
          c.insertBefore(new CKEDITOR.dom.element(l));
          break
        } else l = null;
        l || a.append(c, !0)
      } else {
        i = j = 1;
        a = c.clone();
        a.insertAfter(c);
        a.append(c = b.clone());
        l = v(f, g);
        for (h = 0; h < l.length; h++)l[h].rowSpan++
      }
      c.appendBogus();
      b.$.rowSpan = j;
      c.$.rowSpan = i;
      1 == j && b.removeAttribute("rowSpan");
      1 == i && c.removeAttribute("rowSpan");
      return c
    }

    function x(e, d) {
      var b = p(e);
      if (1 < b.length)return !1;
      if (d)return !0;
      var b = b[0], c = b.getParent(), a = c.getAscendant("table"), a = CKEDITOR.tools.buildTableMap(a), f = v(a, c.$.rowIndex, b), g = b.$.colSpan;
      if (1 < g)c = Math.ceil(g / 2), g = Math.floor(g / 2); else {
        for (var g = c = 1, h = [], i = 0; i < a.length; i++) {
          var j = a[i];
          h.push(j[f]);
          1 < j[f].rowSpan && (i += j[f].rowSpan - 1)
        }
        for (a = 0; a < h.length; a++)h[a].colSpan++
      }
      a = b.clone();
      a.insertAfter(b);
      a.appendBogus();
      b.$.colSpan = c;
      a.$.colSpan = g;
      1 == c && b.removeAttribute("colSpan");
      1 == g && a.removeAttribute("colSpan");
      return a
    }

    var y = /^(?:td|th)$/;
    CKEDITOR.plugins.tabletools = {
      requires: "table,dialog,contextmenu", init: function (e) {
        function d(a) {
          return CKEDITOR.tools.extend(a || {}, {
            contextSensitive: 1, refresh: function (a, b) {
              this.setState(b.contains({td: 1, th: 1}, 1) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED)
            }
          })
        }

        function b(a, b) {
          var c = e.addCommand(a, b);
          e.addFeature(c)
        }

        var c = e.lang.table;
        b("cellProperties", new CKEDITOR.dialogCommand("cellProperties", d({
          allowedContent: "td th{width,height,border-color,background-color,white-space,vertical-align,text-align}[colspan,rowspan]",
          requiredContent: "table"
        })));
        CKEDITOR.dialog.add("cellProperties", this.path + "dialogs/tableCell.js");
        b("rowDelete", d({
          requiredContent: "table", exec: function (a) {
            a = a.getSelection();
            m(q(a))
          }
        }));
        b("rowInsertBefore", d({
          requiredContent: "table", exec: function (a) {
            a = a.getSelection();
            o(a, !0)
          }
        }));
        b("rowInsertAfter", d({
          requiredContent: "table", exec: function (a) {
            a = a.getSelection();
            o(a)
          }
        }));
        b("columnDelete", d({
          requiredContent: "table", exec: function (a) {
            for (var a = a.getSelection(), a = p(a), b = a[0], c = a[a.length - 1], a = b.getAscendant("table"),
                   d = CKEDITOR.tools.buildTableMap(a), e, j, l = [], n = 0, o = d.length; n < o; n++)for (var k = 0, q = d[n].length; k < q; k++)d[n][k] == b.$ && (e = k), d[n][k] == c.$ && (j = k);
            for (n = e; n <= j; n++)for (k = 0; k < d.length; k++)c = d[k], b = new CKEDITOR.dom.element(a.$.rows[k]), c = new CKEDITOR.dom.element(c[n]), c.$ && (1 == c.$.colSpan ? c.remove() : c.$.colSpan -= 1, k += c.$.rowSpan - 1, b.$.cells.length || l.push(b));
            j = a.$.rows[0] && a.$.rows[0].cells;
            e = new CKEDITOR.dom.element(j[e] || (e ? j[e - 1] : a.$.parentNode));
            l.length == o && a.remove();
            e && m(e, !0)
          }
        }));
        b("columnInsertBefore",
          d({
            requiredContent: "table", exec: function (a) {
              a = a.getSelection();
              k(a, !0)
            }
          }));
        b("columnInsertAfter", d({
          requiredContent: "table", exec: function (a) {
            a = a.getSelection();
            k(a)
          }
        }));
        b("cellDelete", d({
          requiredContent: "table", exec: function (a) {
            a = a.getSelection();
            t(a)
          }
        }));
        b("cellMerge", d({
          allowedContent: "td[colspan,rowspan]",
          requiredContent: "td[colspan,rowspan]",
          exec: function (a) {
            m(s(a.getSelection()), !0)
          }
        }));
        b("cellMergeRight", d({
          allowedContent: "td[colspan]", requiredContent: "td[colspan]", exec: function (a) {
            m(s(a.getSelection(),
              "right"), !0)
          }
        }));
        b("cellMergeDown", d({
          allowedContent: "td[rowspan]", requiredContent: "td[rowspan]", exec: function (a) {
            m(s(a.getSelection(), "down"), !0)
          }
        }));
        b("cellVerticalSplit", d({
          allowedContent: "td[rowspan]", requiredContent: "td[rowspan]", exec: function (a) {
            m(w(a.getSelection()))
          }
        }));
        b("cellHorizontalSplit", d({
          allowedContent: "td[colspan]", requiredContent: "td[colspan]", exec: function (a) {
            m(x(a.getSelection()))
          }
        }));
        b("cellInsertBefore", d({
          requiredContent: "table", exec: function (a) {
            a = a.getSelection();
            u(a, !0)
          }
        }));
        b("cellInsertAfter", d({
          requiredContent: "table", exec: function (a) {
            a = a.getSelection();
            u(a)
          }
        }));
        e.addMenuItems && e.addMenuItems({
          tablecell: {
            label: c.cell.menu, group: "tablecell", order: 1, getItems: function () {
              var a = e.getSelection(), b = p(a);
              return {
                tablecell_insertBefore: CKEDITOR.TRISTATE_OFF,
                tablecell_insertAfter: CKEDITOR.TRISTATE_OFF,
                tablecell_delete: CKEDITOR.TRISTATE_OFF,
                tablecell_merge: s(a, null, !0) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
                tablecell_merge_right: s(a, "right", !0) ? CKEDITOR.TRISTATE_OFF :
                  CKEDITOR.TRISTATE_DISABLED,
                tablecell_merge_down: s(a, "down", !0) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
                tablecell_split_vertical: w(a, !0) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
                tablecell_split_horizontal: x(a, !0) ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED,
                tablecell_properties: 0 < b.length ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED
              }
            }
          },
          tablecell_insertBefore: {
            label: c.cell.insertBefore,
            group: "tablecell",
            command: "cellInsertBefore",
            order: 5
          },
          tablecell_insertAfter: {
            label: c.cell.insertAfter,
            group: "tablecell", command: "cellInsertAfter", order: 10
          },
          tablecell_delete: {label: c.cell.deleteCell, group: "tablecell", command: "cellDelete", order: 15},
          tablecell_merge: {label: c.cell.merge, group: "tablecell", command: "cellMerge", order: 16},
          tablecell_merge_right: {label: c.cell.mergeRight, group: "tablecell", command: "cellMergeRight", order: 17},
          tablecell_merge_down: {label: c.cell.mergeDown, group: "tablecell", command: "cellMergeDown", order: 18},
          tablecell_split_horizontal: {
            label: c.cell.splitHorizontal, group: "tablecell",
            command: "cellHorizontalSplit", order: 19
          },
          tablecell_split_vertical: {
            label: c.cell.splitVertical,
            group: "tablecell",
            command: "cellVerticalSplit",
            order: 20
          },
          tablecell_properties: {
            label: c.cell.title,
            group: "tablecellproperties",
            command: "cellProperties",
            order: 21
          },
          tablerow: {
            label: c.row.menu, group: "tablerow", order: 1, getItems: function () {
              return {
                tablerow_insertBefore: CKEDITOR.TRISTATE_OFF,
                tablerow_insertAfter: CKEDITOR.TRISTATE_OFF,
                tablerow_delete: CKEDITOR.TRISTATE_OFF
              }
            }
          },
          tablerow_insertBefore: {
            label: c.row.insertBefore,
            group: "tablerow", command: "rowInsertBefore", order: 5
          },
          tablerow_insertAfter: {label: c.row.insertAfter, group: "tablerow", command: "rowInsertAfter", order: 10},
          tablerow_delete: {label: c.row.deleteRow, group: "tablerow", command: "rowDelete", order: 15},
          tablecolumn: {
            label: c.column.menu, group: "tablecolumn", order: 1, getItems: function () {
              return {
                tablecolumn_insertBefore: CKEDITOR.TRISTATE_OFF,
                tablecolumn_insertAfter: CKEDITOR.TRISTATE_OFF,
                tablecolumn_delete: CKEDITOR.TRISTATE_OFF
              }
            }
          },
          tablecolumn_insertBefore: {
            label: c.column.insertBefore,
            group: "tablecolumn", command: "columnInsertBefore", order: 5
          },
          tablecolumn_insertAfter: {
            label: c.column.insertAfter,
            group: "tablecolumn",
            command: "columnInsertAfter",
            order: 10
          },
          tablecolumn_delete: {label: c.column.deleteColumn, group: "tablecolumn", command: "columnDelete", order: 15}
        });
        e.contextMenu && e.contextMenu.addListener(function (a, b, c) {
          return (a = c.contains({td: 1, th: 1}, 1)) && !a.isReadOnly() ? {
            tablecell: CKEDITOR.TRISTATE_OFF,
            tablerow: CKEDITOR.TRISTATE_OFF,
            tablecolumn: CKEDITOR.TRISTATE_OFF
          } : null
        })
      }, getSelectedCells: p
    };
    CKEDITOR.plugins.add("tabletools", CKEDITOR.plugins.tabletools)
  })();
  CKEDITOR.tools.buildTableMap = function (p) {
    for (var p = p.$.rows, o = -1, q = [], r = 0; r < p.length; r++) {
      o++;
      !q[o] && (q[o] = []);
      for (var k = -1, u = 0; u < p[r].cells.length; u++) {
        var t = p[r].cells[u];
        for (k++; q[o][k];)k++;
        for (var m = isNaN(t.colSpan) ? 1 : t.colSpan, t = isNaN(t.rowSpan) ? 1 : t.rowSpan, v = 0; v < t; v++) {
          q[o + v] || (q[o + v] = []);
          for (var s = 0; s < m; s++)q[o + v][k + s] = p[r].cells[u]
        }
        k += m - 1
      }
    }
    return q
  };
  (function () {
    function g(a) {
      this.editor = a;
      this.reset()
    }

    CKEDITOR.plugins.add("undo", {
      init: function (a) {
        function c(a) {
          b.enabled && !1 !== a.data.command.canUndo && b.save()
        }

        function d() {
          b.enabled = a.readOnly ? !1 : "wysiwyg" == a.mode;
          b.onChange()
        }

        var b = a.undoManager = new g(a), e = a.addCommand("undo", {
          exec: function () {
            b.undo() && (a.selectionChange(), this.fire("afterUndo"))
          }, startDisabled: !0, canUndo: !1
        }), f = a.addCommand("redo", {
          exec: function () {
            b.redo() && (a.selectionChange(), this.fire("afterRedo"))
          }, startDisabled: !0, canUndo: !1
        });
        a.setKeystroke([[CKEDITOR.CTRL + 90, "undo"], [CKEDITOR.CTRL + 89, "redo"], [CKEDITOR.CTRL + CKEDITOR.SHIFT + 90, "redo"]]);
        b.onChange = function () {
          e.setState(b.undoable() ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED);
          f.setState(b.redoable() ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED)
        };
        a.on("beforeCommandExec", c);
        a.on("afterCommandExec", c);
        a.on("saveSnapshot", function (a) {
          b.save(a.data && a.data.contentOnly)
        });
        a.on("contentDom", function () {
          a.editable().on("keydown", function (a) {
            a = a.data.getKey();
            (8 == a || 46 ==
            a) && b.type(a, 0)
          });
          a.editable().on("keypress", function (a) {
            b.type(a.data.getKey(), 1)
          })
        });
        a.on("beforeModeUnload", function () {
          "wysiwyg" == a.mode && b.save(!0)
        });
        a.on("mode", d);
        a.on("readOnly", d);
        a.ui.addButton && (a.ui.addButton("Undo", {
          label: a.lang.undo.undo,
          command: "undo",
          toolbar: "undo,10"
        }), a.ui.addButton("Redo", {label: a.lang.undo.redo, command: "redo", toolbar: "undo,20"}));
        a.resetUndo = function () {
          b.reset();
          a.fire("saveSnapshot")
        };
        a.on("updateSnapshot", function () {
          b.currentImage && b.update()
        });
        a.on("lockSnapshot",
          function (a) {
            b.lock(a.data && a.data.dontUpdate)
          });
        a.on("unlockSnapshot", b.unlock, b)
      }
    });
    CKEDITOR.plugins.undo = {};
    var f = CKEDITOR.plugins.undo.Image = function (a, c) {
      this.editor = a;
      a.fire("beforeUndoImage");
      var d = a.getSnapshot();
      CKEDITOR.env.ie && d && (d = d.replace(/\s+data-cke-expando=".*?"/g, ""));
      this.contents = d;
      c || (this.bookmarks = (d = d && a.getSelection()) && d.createBookmarks2(!0));
      a.fire("afterUndoImage")
    }, h = /\b(?:href|src|name)="[^"]*?"/gi;
    f.prototype = {
      equalsContent: function (a) {
        var c = this.contents, a = a.contents;
        if (CKEDITOR.env.ie && (CKEDITOR.env.ie7Compat || CKEDITOR.env.ie6Compat))c = c.replace(h, ""), a = a.replace(h, "");
        return c != a ? !1 : !0
      }, equalsSelection: function (a) {
        var c = this.bookmarks, a = a.bookmarks;
        if (c || a) {
          if (!c || !a || c.length != a.length)return !1;
          for (var d = 0; d < c.length; d++) {
            var b = c[d], e = a[d];
            if (b.startOffset != e.startOffset || b.endOffset != e.endOffset || !CKEDITOR.tools.arrayCompare(b.start, e.start) || !CKEDITOR.tools.arrayCompare(b.end, e.end))return !1
          }
        }
        return !0
      }
    };
    g.prototype = {
      type: function (a, c) {
        var d = !c && a != this.lastKeystroke,
          b = this.editor;
        if (!this.typing || c && !this.wasCharacter || d) {
          var e = new f(b), g = this.snapshots.length;
          CKEDITOR.tools.setTimeout(function () {
            var a = b.getSnapshot();
            CKEDITOR.env.ie && (a = a.replace(/\s+data-cke-expando=".*?"/g, ""));
            e.contents != a && g == this.snapshots.length && (this.typing = !0, this.save(!1, e, !1) || this.snapshots.splice(this.index + 1, this.snapshots.length - this.index - 1), this.hasUndo = !0, this.hasRedo = !1, this.modifiersCount = this.typesCount = 1, this.onChange())
          }, 0, this)
        }
        this.lastKeystroke = a;
        (this.wasCharacter =
          c) ? (this.modifiersCount = 0, this.typesCount++, 25 < this.typesCount ? (this.save(!1, null, !1), this.typesCount = 1) : setTimeout(function () {
          b.fire("change")
        }, 0)) : (this.typesCount = 0, this.modifiersCount++, 25 < this.modifiersCount ? (this.save(!1, null, !1), this.modifiersCount = 1) : setTimeout(function () {
          b.fire("change")
        }, 0))
      }, reset: function () {
        this.lastKeystroke = 0;
        this.snapshots = [];
        this.index = -1;
        this.limit = this.editor.config.undoStackSize || 20;
        this.currentImage = null;
        this.hasRedo = this.hasUndo = !1;
        this.locked = null;
        this.resetType()
      },
      resetType: function () {
        this.typing = !1;
        delete this.lastKeystroke;
        this.modifiersCount = this.typesCount = 0
      }, fireChange: function () {
        this.hasUndo = !!this.getNextImage(!0);
        this.hasRedo = !!this.getNextImage(!1);
        this.resetType();
        this.onChange()
      }, save: function (a, c, d) {
        if (this.locked)return !1;
        var b = this.snapshots;
        c || (c = new f(this.editor));
        if (!1 === c.contents)return !1;
        if (this.currentImage)if (c.equalsContent(this.currentImage)) {
          if (a || c.equalsSelection(this.currentImage))return !1
        } else this.editor.fire("change");
        b.splice(this.index +
          1, b.length - this.index - 1);
        b.length == this.limit && b.shift();
        this.index = b.push(c) - 1;
        this.currentImage = c;
        !1 !== d && this.fireChange();
        return !0
      }, restoreImage: function (a) {
        var c = this.editor, d;
        a.bookmarks && (c.focus(), d = c.getSelection());
        this.locked = 1;
        this.editor.loadSnapshot(a.contents);
        a.bookmarks ? d.selectBookmarks(a.bookmarks) : CKEDITOR.env.ie && (d = this.editor.document.getBody().$.createTextRange(), d.collapse(!0), d.select());
        this.locked = 0;
        this.index = a.index;
        this.currentImage = this.snapshots[this.index];
        this.update();
        this.fireChange();
        c.fire("change")
      }, getNextImage: function (a) {
        var c = this.snapshots, d = this.currentImage, b;
        if (d)if (a)for (b = this.index - 1; 0 <= b; b--) {
          if (a = c[b], !d.equalsContent(a))return a.index = b, a
        } else for (b = this.index + 1; b < c.length; b++)if (a = c[b], !d.equalsContent(a))return a.index = b, a;
        return null
      }, redoable: function () {
        return this.enabled && this.hasRedo
      }, undoable: function () {
        return this.enabled && this.hasUndo
      }, undo: function () {
        if (this.undoable()) {
          this.save(!0);
          var a = this.getNextImage(!0);
          if (a)return this.restoreImage(a),
            !0
        }
        return !1
      }, redo: function () {
        if (this.redoable() && (this.save(!0), this.redoable())) {
          var a = this.getNextImage(!1);
          if (a)return this.restoreImage(a), !0
        }
        return !1
      }, update: function (a) {
        if (!this.locked) {
          a || (a = new f(this.editor));
          for (var c = this.index, d = this.snapshots; 0 < c && this.currentImage.equalsContent(d[c - 1]);)c -= 1;
          d.splice(c, this.index - c + 1, a);
          this.index = c;
          this.currentImage = a
        }
      }, lock: function (a) {
        this.locked ? this.locked.level++ : a ? this.locked = {level: 1} : (a = new f(this.editor, !0), this.locked = {
          update: this.currentImage &&
          this.currentImage.equalsContent(a) ? a : null, level: 1
        })
      }, unlock: function () {
        if (this.locked && !--this.locked.level) {
          var a = this.locked.update, c = a && new f(this.editor, !0);
          this.locked = null;
          a && !a.equalsContent(c) && this.update()
        }
      }
    }
  })();
  CKEDITOR.config.wsc_removeGlobalVariable = !0;
  CKEDITOR.plugins.add("wsc", {
    requires: "dialog", parseApi: function (a) {
      a.config.wsc_onFinish = "function" === typeof a.config.wsc_onFinish ? a.config.wsc_onFinish : function () {
      };
      a.config.wsc_onClose = "function" === typeof a.config.wsc_onClose ? a.config.wsc_onClose : function () {
      }
    }, parseConfig: function (a) {
      a.config.wsc_customerId = a.config.wsc_customerId || CKEDITOR.config.wsc_customerId || "1:ua3xw1-2XyGJ3-GWruD3-6OFNT1-oXcuB1-nR6Bp4-hgQHc-EcYng3-sdRXG3-NOfFk";
      a.config.wsc_customDictionaryIds = a.config.wsc_customDictionaryIds ||
        CKEDITOR.config.wsc_customDictionaryIds || "";
      a.config.wsc_userDictionaryName = a.config.wsc_userDictionaryName || CKEDITOR.config.wsc_userDictionaryName || "";
      a.config.wsc_customLoaderScript = a.config.wsc_customLoaderScript || CKEDITOR.config.wsc_customLoaderScript;
      CKEDITOR.config.wsc_cmd = a.config.wsc_cmd || CKEDITOR.config.wsc_cmd || "spell";
      CKEDITOR.config.wsc_version = CKEDITOR.version + " | %Rev%"
    }, init: function (a) {
      this.parseConfig(a);
      this.parseApi(a);
      a.addCommand("checkspell", new CKEDITOR.dialogCommand("checkspell")).modes =
      {wysiwyg: !CKEDITOR.env.opera && !CKEDITOR.env.air && document.domain == window.location.hostname};
      "undefined" == typeof a.plugins.scayt && a.ui.addButton && a.ui.addButton("SpellChecker", {
        label: a.lang.wsc.toolbar,
        command: "checkspell",
        toolbar: "spellchecker,10"
      });
      CKEDITOR.dialog.add("checkspell", this.path + (CKEDITOR.env.ie && 8 >= CKEDITOR.env.version ? "dialogs/wsc_ie.js" : window.postMessage ? "dialogs/wsc.js" : "dialogs/wsc_ie.js"))
    }
  });
  (function () {
    function k(a, d) {
      CKEDITOR.tools.extend(this, {editor: a, editable: a.editable(), doc: a.document, win: a.window}, d, !0);
      this.frame = this.win.getFrame();
      this.inline = this.editable.isInline();
      this.target = this[this.inline ? "editable" : "doc"]
    }

    function l(a, d) {
      CKEDITOR.tools.extend(this, d, {editor: a}, !0)
    }

    function m(a, d) {
      var b = a.editable();
      CKEDITOR.tools.extend(this, {
        editor: a,
        editable: b,
        doc: a.document,
        win: a.window,
        container: CKEDITOR.document.getBody(),
        winTop: CKEDITOR.document.getWindow()
      }, d, !0);
      this.hidden =
      {};
      this.visible = {};
      this.inline = b.isInline();
      this.inline || (this.frame = this.win.getFrame());
      this.queryViewport();
      var c = CKEDITOR.tools.bind(this.queryViewport, this), e = CKEDITOR.tools.bind(this.hideVisible, this), g = CKEDITOR.tools.bind(this.removeAll, this);
      b.attachListener(this.winTop, "resize", c);
      b.attachListener(this.winTop, "scroll", c);
      b.attachListener(this.winTop, "resize", e);
      b.attachListener(this.win, "scroll", e);
      b.attachListener(this.inline ? b : this.frame, "mouseout", function (a) {
        var c = a.data.$.clientX, a =
          a.data.$.clientY;
        this.queryViewport();
        (c <= this.rect.left || c >= this.rect.right || a <= this.rect.top || a >= this.rect.bottom) && this.hideVisible();
        (c <= 0 || c >= this.winTopPane.width || a <= 0 || a >= this.winTopPane.height) && this.hideVisible()
      }, this);
      b.attachListener(a, "resize", c);
      b.attachListener(a, "mode", g);
      a.on("destroy", g);
      this.lineTpl = (new CKEDITOR.template(p)).output({
        lineStyle: CKEDITOR.tools.writeCssText(CKEDITOR.tools.extend({}, q, this.lineStyle, !0)),
        tipLeftStyle: CKEDITOR.tools.writeCssText(CKEDITOR.tools.extend({},
          n, {
            left: "0px",
            "border-left-color": "red",
            "border-width": "6px 0 6px 6px"
          }, this.tipCss, this.tipLeftStyle, !0)),
        tipRightStyle: CKEDITOR.tools.writeCssText(CKEDITOR.tools.extend({}, n, {
          right: "0px",
          "border-right-color": "red",
          "border-width": "6px 6px 6px 0"
        }, this.tipCss, this.tipRightStyle, !0))
      })
    }

    function i(a) {
      return a && a.type == CKEDITOR.NODE_ELEMENT && !(o[a.getComputedStyle("float")] || o[a.getAttribute("align")]) && !r[a.getComputedStyle("position")]
    }

    CKEDITOR.plugins.add("lineutils");
    CKEDITOR.LINEUTILS_BEFORE = 1;
    CKEDITOR.LINEUTILS_AFTER = 2;
    CKEDITOR.LINEUTILS_INSIDE = 4;
    k.prototype = {
      start: function (a) {
        var d = this, b = this.editor, c = this.doc, e, g, f, h = CKEDITOR.tools.eventsBuffer(50, function () {
          b.readOnly || "wysiwyg" != b.mode || (d.relations = {}, e = new CKEDITOR.dom.element(c.$.elementFromPoint(g, f)), d.traverseSearch(e), isNaN(g + f) || d.pixelSearch(e, g, f), a && a(d.relations, g, f))
        });
        this.listener = this.editable.attachListener(this.target, "mousemove", function (a) {
          g = a.data.$.clientX;
          f = a.data.$.clientY;
          h.input()
        });
        this.editable.attachListener(this.inline ?
          this.editable : this.frame, "mouseout", function () {
          h.reset()
        })
      }, stop: function () {
        this.listener && this.listener.removeListener()
      }, getRange: function () {
        var a = {};
        a[CKEDITOR.LINEUTILS_BEFORE] = CKEDITOR.POSITION_BEFORE_START;
        a[CKEDITOR.LINEUTILS_AFTER] = CKEDITOR.POSITION_AFTER_END;
        a[CKEDITOR.LINEUTILS_INSIDE] = CKEDITOR.POSITION_AFTER_START;
        return function (d) {
          var b = this.editor.createRange();
          b.moveToPosition(this.relations[d.uid].element, a[d.type]);
          return b
        }
      }(), store: function () {
        function a(a, b, c) {
          var e = a.getUniqueId();
          e in c ? c[e].type |= b : c[e] = {element: a, type: b}
        }

        return function (d, b) {
          var c;
          if (b & CKEDITOR.LINEUTILS_AFTER && i(c = d.getNext()) && c.isVisible())a(c, CKEDITOR.LINEUTILS_BEFORE, this.relations), b ^= CKEDITOR.LINEUTILS_AFTER;
          if (b & CKEDITOR.LINEUTILS_INSIDE && i(c = d.getFirst()) && c.isVisible())a(c, CKEDITOR.LINEUTILS_BEFORE, this.relations), b ^= CKEDITOR.LINEUTILS_INSIDE;
          a(d, b, this.relations)
        }
      }(), traverseSearch: function (a) {
        var d, b, c;
        do if (c = a.$["data-cke-expando"], !(c && c in this.relations)) {
          if (a.equals(this.editable))break;
          if (i(a))for (d in this.lookups)(b = this.lookups[d](a)) && this.store(a, b)
        } while (!(a && a.type == CKEDITOR.NODE_ELEMENT && "true" == a.getAttribute("contenteditable")) && (a = a.getParent()))
      }, pixelSearch: function () {
        function a(a, c, e, g, f) {
          for (var h = 0, j; f(e);) {
            e += g;
            if (25 == ++h)break;
            if (j = this.doc.$.elementFromPoint(c, e))if (j == a)h = 0; else if (d(a, j) && (h = 0, i(j = new CKEDITOR.dom.element(j))))return j
          }
        }

        var d = CKEDITOR.env.ie || CKEDITOR.env.webkit ? function (a, c) {
          return a.contains(c)
        } : function (a, c) {
          return !!(a.compareDocumentPosition(c) &
          16)
        };
        return function (b, c, d) {
          var g = this.win.getViewPaneSize().height, f = a.call(this, b.$, c, d, -1, function (a) {
            return 0 < a
          }), c = a.call(this, b.$, c, d, 1, function (a) {
            return a < g
          });
          if (f)for (this.traverseSearch(f); !f.getParent().equals(b);)f = f.getParent();
          if (c)for (this.traverseSearch(c); !c.getParent().equals(b);)c = c.getParent();
          for (; f || c;) {
            f && (f = f.getNext(i));
            if (!f || f.equals(c))break;
            this.traverseSearch(f);
            c && (c = c.getPrevious(i));
            if (!c || c.equals(f))break;
            this.traverseSearch(c)
          }
        }
      }(), greedySearch: function () {
        this.relations =
        {};
        for (var a = this.editable.getElementsByTag("*"), d = 0, b, c, e; b = a.getItem(d++);)if (!b.equals(this.editable) && (b.hasAttribute("contenteditable") || !b.isReadOnly()) && i(b) && b.isVisible())for (e in this.lookups)(c = this.lookups[e](b)) && this.store(b, c);
        return this.relations
      }
    };
    l.prototype = {
      locate: function () {
        function a(a, b) {
          var d = a.element[b === CKEDITOR.LINEUTILS_BEFORE ? "getPrevious" : "getNext"]();
          return d && i(d) ? (a.siblingRect = d.getClientRect(), b == CKEDITOR.LINEUTILS_BEFORE ? (a.siblingRect.bottom + a.elementRect.top) /
          2 : (a.elementRect.bottom + a.siblingRect.top) / 2) : b == CKEDITOR.LINEUTILS_BEFORE ? a.elementRect.top : a.elementRect.bottom
        }

        var d, b;
        return function (c) {
          this.locations = {};
          for (b in c)d = c[b], d.elementRect = d.element.getClientRect(), d.type & CKEDITOR.LINEUTILS_BEFORE && this.store(b, CKEDITOR.LINEUTILS_BEFORE, a(d, CKEDITOR.LINEUTILS_BEFORE)), d.type & CKEDITOR.LINEUTILS_AFTER && this.store(b, CKEDITOR.LINEUTILS_AFTER, a(d, CKEDITOR.LINEUTILS_AFTER)), d.type & CKEDITOR.LINEUTILS_INSIDE && this.store(b, CKEDITOR.LINEUTILS_INSIDE, (d.elementRect.top +
            d.elementRect.bottom) / 2);
          return this.locations
        }
      }(), sort: function () {
        var a, d, b, c, e, g;
        return function (f, h) {
          a = this.locations;
          d = [];
          for (c in a)for (e in a[c])if (b = Math.abs(f - a[c][e]), d.length) {
            for (g = 0; g < d.length; g++)if (b < d[g].dist) {
              d.splice(g, 0, {uid: +c, type: e, dist: b});
              break
            }
            g == d.length && d.push({uid: +c, type: e, dist: b})
          } else d.push({uid: +c, type: e, dist: b});
          return "undefined" != typeof h ? d.slice(0, h) : d
        }
      }(), store: function (a, d, b) {
        this.locations[a] || (this.locations[a] = {});
        this.locations[a][d] = b
      }
    };
    var n = {
      display: "block",
      width: "0px",
      height: "0px",
      "border-color": "transparent",
      "border-style": "solid",
      position: "absolute",
      top: "-6px"
    }, q = {
      height: "0px",
      "border-top": "1px dashed red",
      position: "absolute",
      "z-index": 9999
    }, p = '<div data-cke-lineutils-line="1" class="cke_reset_all" style="{lineStyle}"><span style="{tipLeftStyle}">&nbsp;</span><span style="{tipRightStyle}">&nbsp;</span></div>';
    m.prototype = {
      removeAll: function () {
        for (var a in this.hidden)this.hidden[a].remove(), delete this.hidden[a];
        for (a in this.visible)this.visible[a].remove(),
          delete this.visible[a]
      }, hideLine: function (a) {
        var d = a.getUniqueId();
        a.hide();
        this.hidden[d] = a;
        delete this.visible[d]
      }, showLine: function (a) {
        var d = a.getUniqueId();
        a.show();
        this.visible[d] = a;
        delete this.hidden[d]
      }, hideVisible: function () {
        for (var a in this.visible)this.hideLine(this.visible[a])
      }, placeLine: function (a, d) {
        var b, c, e;
        if (b = this.getStyle(a.uid, a.type)) {
          for (e in this.visible)if (this.visible[e].getCustomData("hash") !== this.hash) {
            c = this.visible[e];
            break
          }
          if (!c)for (e in this.hidden)if (this.hidden[e].getCustomData("hash") !==
            this.hash) {
            this.showLine(c = this.hidden[e]);
            break
          }
          c || this.showLine(c = this.addLine());
          c.setCustomData("hash", this.hash);
          this.visible[c.getUniqueId()] = c;
          c.setStyles(b);
          d && d(c)
        }
      }, getStyle: function (a, d) {
        var b = this.relations[a], c = this.locations[a][d], e = {};
        e.width = b.siblingRect ? Math.max(b.siblingRect.width, b.elementRect.width) : b.elementRect.width;
        e.top = this.inline ? c + this.winTopScroll.y : this.rect.top + this.winTopScroll.y + c;
        if (e.top - this.winTopScroll.y < this.rect.top || e.top - this.winTopScroll.y > this.rect.bottom)return !1;
        if (this.inline)e.left = b.elementRect.left; else if (0 < b.elementRect.left ? e.left = this.rect.left + b.elementRect.left : (e.width += b.elementRect.left, e.left = this.rect.left), 0 < (b = e.left + e.width - (this.rect.left + this.winPane.width)))e.width -= b;
        e.left += this.winTopScroll.x;
        for (var g in e)e[g] = CKEDITOR.tools.cssLength(e[g]);
        return e
      }, addLine: function () {
        var a = CKEDITOR.dom.element.createFromHtml(this.lineTpl);
        a.appendTo(this.container);
        return a
      }, prepare: function (a, d) {
        this.relations = a;
        this.locations = d;
        this.hash = Math.random()
      },
      cleanup: function () {
        var a, d;
        for (d in this.visible)a = this.visible[d], a.getCustomData("hash") !== this.hash && this.hideLine(a)
      }, queryViewport: function () {
        this.winPane = this.win.getViewPaneSize();
        this.winTopScroll = this.winTop.getScrollPosition();
        this.winTopPane = this.winTop.getViewPaneSize();
        this.rect = this.inline ? this.editable.getClientRect() : this.frame.getClientRect()
      }
    };
    var o = {left: 1, right: 1, center: 1}, r = {absolute: 1, fixed: 1};
    CKEDITOR.plugins.lineutils = {finder: k, locator: l, liner: m}
  })();
  (function () {
    function m(a) {
      this.editor = a;
      this.registered = {};
      this.instances = {};
      this.selected = [];
      this.widgetHoldingFocusedEditable = this.focused = null;
      this._ = {nextId: 0, upcasts: [], filters: {}};
      G(this);
      H(this);
      I(this);
      J(this);
      K(this);
      L(this);
      M(this)
    }

    function i(a, b, c, d, e) {
      var f = a.editor;
      CKEDITOR.tools.extend(this, d, {
        editor: f,
        id: b,
        inline: "span" == c.getParent().getName(),
        element: c,
        data: CKEDITOR.tools.extend({}, "function" == typeof d.defaults ? d.defaults() : d.defaults),
        dataReady: !1,
        inited: !1,
        ready: !1,
        edit: i.prototype.edit,
        focusedEditable: null,
        definition: d,
        repository: a,
        draggable: !1 !== d.draggable,
        _: {downcastFn: d.downcast && "string" == typeof d.downcast ? d.downcasts[d.downcast] : d.downcast}
      }, !0);
      this.inline && (CKEDITOR.env.ie && 9 > CKEDITOR.env.version) && (this.draggable = !1);
      a.fire("instanceCreated", this);
      N(this, d);
      this.init && this.init();
      this.inited = !0;
      (a = this.element.data("cke-widget-data")) && this.setData(JSON.parse(a));
      e && this.setData(e);
      this.dataReady = !0;
      q(this);
      this.fire("data", this.data);
      this.isInited() && f.editable().contains(this.wrapper) &&
      (this.ready = !0, this.fire("ready"))
    }

    function o(a, b, c) {
      CKEDITOR.dom.element.call(this, b.$);
      this.editor = a;
      b = this.filter = c.filter;
      CKEDITOR.dtd[this.getName()].p ? (this.enterMode = b ? b.getAllowedEnterMode(a.enterMode) : a.enterMode, this.shiftEnterMode = b ? b.getAllowedEnterMode(a.shiftEnterMode, !0) : a.shiftEnterMode) : this.enterMode = this.shiftEnterMode = CKEDITOR.ENTER_BR
    }

    function O(a, b) {
      a.addCommand(b.name, {
        exec: function () {
          function c() {
            a.widgets.finalizeCreation(g)
          }

          var d = a.widgets.focused;
          if (d && d.name == b.name)d.edit();
          else if (b.insert)b.insert(); else if (b.template) {
            var d = "function" == typeof b.defaults ? b.defaults() : b.defaults, d = CKEDITOR.dom.element.createFromHtml(b.template.output(d)), e, f = a.widgets.wrapElement(d, b.name), g = new CKEDITOR.dom.documentFragment(f.getDocument());
            g.append(f);
            (e = a.widgets.initOn(d, b)) ? (d = e.once("edit", function (b) {
              if (b.data.dialog)e.once("dialog", function (b) {
                var b = b.data, d, f;
                d = b.once("ok", c, null, null, 20);
                f = b.once("cancel", function () {
                  a.widgets.destroy(e, !0)
                });
                b.once("hide", function () {
                  d.removeListener();
                  f.removeListener()
                })
              }); else c()
            }, null, null, 999), e.edit(), d.removeListener()) : c()
          }
        },
        refresh: function (a, b) {
          this.setState(j(a.editable(), b.blockLimit) ? CKEDITOR.TRISTATE_DISABLED : CKEDITOR.TRISTATE_OFF)
        },
        context: "div",
        allowedContent: b.allowedContent,
        requiredContent: b.requiredContent,
        contentForms: b.contentForms,
        contentTransformations: b.contentTransformations
      })
    }

    function r(a, b) {
      a.focused = null;
      b.isInited() && (a.fire("widgetBlurred", {widget: b}), b.setFocused(!1))
    }

    function Q(a) {
      var b = a.parent;
      b.type == CKEDITOR.NODE_ELEMENT &&
      b.attributes["data-cke-widget-wrapper"] && b.replaceWith(a)
    }

    function s(a, b, c) {
      if (!c.allowedContent)return null;
      var d = this._.filters[a];
      d || (this._.filters[a] = d = {});
      (a = d[b]) || (d[b] = a = new CKEDITOR.filter(c.allowedContent));
      return a
    }

    function j(a, b) {
      return !b || b.equals(a) ? null : t(b) ? b : j(a, b.getParent())
    }

    function u(a) {
      return {
        tabindex: -1,
        contenteditable: "false",
        "data-cke-widget-wrapper": 1,
        "data-cke-filter": "off",
        "class": "cke_widget_wrapper cke_widget_new cke_widget_" + (a ? "inline" : "block")
      }
    }

    function v(a, b, c) {
      if (a.type ==
        CKEDITOR.NODE_ELEMENT) {
        var d = CKEDITOR.dtd[a.name];
        if (d && !d[c.name]) {
          var d = a.split(b), e = a.parent, b = d.getIndex();
          a.children.length || (b -= 1, a.remove());
          d.children.length || d.remove();
          return v(e, b, c)
        }
      }
      a.add(c, b)
    }

    function w(a) {
      return a.type == CKEDITOR.NODE_ELEMENT && !!a.attributes["data-widget"]
    }

    function p(a) {
      return a.type == CKEDITOR.NODE_ELEMENT && a.hasAttribute("data-widget")
    }

    function x(a, b) {
      return "boolean" == typeof a.inline ? a.inline : !!CKEDITOR.dtd.$inline[b]
    }

    function y(a) {
      return a.type == CKEDITOR.NODE_ELEMENT &&
        a.hasAttribute("data-cke-widget-wrapper")
    }

    function t(a) {
      return a.type == CKEDITOR.NODE_ELEMENT && a.hasAttribute("data-cke-widget-editable")
    }

    function R(a) {
      return a.hasAttribute("data-cke-temp")
    }

    function z(a, b) {
      var c = b.wrapper.getOuterHtml();
      b.wrapper.remove();
      a.widgets.destroy(b, !0);
      a.execCommand("paste", c);
      a.fire("unlockSnapshot")
    }

    function l(a, b, c, d) {
      var e = a.editor;
      e.fire("lockSnapshot");
      c ? (d = c.data("cke-widget-editable"), d = b.editables[d], a.widgetHoldingFocusedEditable = b, b.focusedEditable = d, c.addClass("cke_widget_editable_focused"),
      d.filter && e.setActiveFilter(d.filter), e.setActiveEnterMode(d.enterMode, d.shiftEnterMode)) : (d || b.focusedEditable.removeClass("cke_widget_editable_focused"), b.focusedEditable = null, a.widgetHoldingFocusedEditable = null, e.setActiveFilter(null), e.setActiveEnterMode(null, null));
      e.fire("unlockSnapshot")
    }

    function S(a) {
      a.contextMenu && a.contextMenu.addListener(function (b) {
        if (b = a.widgets.getByElement(b, !0))return b.fire("contextMenu", {})
      })
    }

    function T(a, b) {
      return CKEDITOR.tools.trim(b)
    }

    function G(a) {
      var b = a.editor;
      U(a);
      V(a);
      b.on("contentDomUnload", function () {
        a.destroyAll(!0)
      });
      b.on("paste", function (a) {
        a.data.dataValue = a.data.dataValue.replace(W, T)
      })
    }

    function V(a) {
      var b = a.editor, c = {};
      b.on("toDataFormat", function (b) {
        var e = CKEDITOR.tools.getNextNumber(), f = [];
        b.data.downcastingSessionId = e;
        c[e] = f;
        b.data.dataValue.forEach(function (b) {
          var c = b.attributes, d;
          if ("data-cke-widget-id"in c) {
            if (c = a.instances[c["data-cke-widget-id"]])d = b.getFirst(w), f.push({
              wrapper: b,
              element: d,
              widget: c
            }), "1" != d.attributes["data-cke-widget-keep-attr"] && delete d.attributes["data-widget"]
          } else if ("data-cke-widget-editable"in c)return delete c.contenteditable, b.setHtml(f[f.length - 1].widget.editables[c["data-cke-widget-editable"]].getData()), !1
        }, CKEDITOR.NODE_ELEMENT)
      }, null, null, 8);
      b.on("toDataFormat", function (a) {
        if (a.data.downcastingSessionId)for (var a = c[a.data.downcastingSessionId], b, f, g; b = a.shift();)f = b.widget, g = b.element, (f = f._.downcastFn && f._.downcastFn.call(f, g)) || (f = g), b.wrapper.replaceWith(f)
      }, null, null, 13)
    }

    function L(a) {
      var b = a.editor, c = CKEDITOR.plugins.lineutils;
      b.on("contentDom", function () {
        var d = b.editable();
        d.attachListener(d.isInline() ? d : b.document, "drop", function (c) {
          var d = c.data.$.dataTransfer.getData("text"), g, h;
          if (d) {
            try {
              g = JSON.parse(d)
            } catch (n) {
              return
            }
            if ("cke-widget" == g.type && (c.data.preventDefault(), g.editor == b.name && (h = a.instances[g.id])))h.focus(), b.fire("saveSnapshot"), b.fire("lockSnapshot", {dontUpdate: !0}), g = c.data.$, d = b.createRange(), c.data.testRange ? c.data.testRange.select() : (document.caretRangeFromPoint ? (c = b.document.$.caretRangeFromPoint(g.clientX,
              g.clientY), d.setStart(CKEDITOR.dom.node(c.startContainer), c.startOffset), d.collapse(!0)) : g.rangeParent ? (d.setStart(CKEDITOR.dom.node(g.rangeParent), g.rangeOffset), d.collapse(!0)) : document.body.createTextRange && (c = b.document.getBody().$.createTextRange(), c.moveToPoint(g.clientX, g.clientY), g = "cke-temp-" + (new Date).getTime(), c.pasteHTML('<span id="' + g + '">​</span>'), c = b.document.getById(g), d.moveToPosition(c, CKEDITOR.POSITION_BEFORE_START), c.remove()), d.select()), CKEDITOR.env.gecko ? setTimeout(z, 0, b, h) :
              z(b, h)
          }
        });
        CKEDITOR.tools.extend(a, {
          finder: new c.finder(b, {
            lookups: {
              "default": function (a) {
                if (!a.is(CKEDITOR.dtd.$listItem) && a.is(CKEDITOR.dtd.$block)) {
                  for (; a;) {
                    if (t(a))return;
                    a = a.getParent()
                  }
                  return CKEDITOR.LINEUTILS_BEFORE | CKEDITOR.LINEUTILS_AFTER
                }
              }
            }
          }),
          locator: new c.locator(b),
          liner: new c.liner(b, {
            lineStyle: {cursor: "move !important", "border-top-color": "#666"},
            tipLeftStyle: {"border-left-color": "#666"},
            tipRightStyle: {"border-right-color": "#666"}
          })
        }, !0)
      })
    }

    function J(a) {
      var b = a.editor;
      b.on("contentDom",
        function () {
          var c = b.editable(), d = c.isInline() ? c : b.document, e, f;
          c.attachListener(d, "mousedown", function (b) {
            var c = b.data.getTarget();
            if (!c.type)return !1;
            e = a.getByElement(c);
            f = 0;
            e && (e.inline && c.type == CKEDITOR.NODE_ELEMENT && c.hasAttribute("data-cke-widget-drag-handler") ? f = 1 : j(e.wrapper, c) ? e = null : (b.data.preventDefault(), CKEDITOR.env.ie || e.focus()))
          });
          c.attachListener(d, "mouseup", function () {
            e && f && (f = 0, e.focus())
          });
          CKEDITOR.env.ie && c.attachListener(d, "mouseup", function () {
            e && setTimeout(function () {
              e.focus();
              e = null
            })
          })
        });
      b.on("doubleclick", function (b) {
        var d = a.getByElement(b.data.element);
        if (d && !j(d.wrapper, b.data.element))return d.fire("doubleclick", {element: b.data.element})
      }, null, null, 1)
    }

    function K(a) {
      a.editor.on("key", function (b) {
        var c = a.focused, d = a.widgetHoldingFocusedEditable, e;
        c ? e = c.fire("key", {keyCode: b.data.keyCode}) : d && (c = b.data.keyCode, b = d.focusedEditable, c == CKEDITOR.CTRL + 65 ? (c = b.getBogus(), d = d.editor.createRange(), d.selectNodeContents(b), c && d.setEndAt(c, CKEDITOR.POSITION_BEFORE_START), d.select(),
          e = !1) : 8 == c || 46 == c ? (e = d.editor.getSelection().getRanges(), d = e[0], e = !(1 == e.length && d.collapsed && d.checkBoundaryOfElement(b, CKEDITOR[8 == c ? "START" : "END"]))) : e = void 0);
        return e
      }, null, null, 1)
    }

    function M(a) {
      function b(b) {
        a.focused && A(a.focused, "cut" == b.name)
      }

      var c = a.editor;
      c.on("contentDom", function () {
        var a = c.editable();
        a.attachListener(a, "copy", b);
        a.attachListener(a, "cut", b)
      })
    }

    function I(a) {
      var b = a.editor;
      b.on("selectionCheck", function () {
        a.fire("checkSelection")
      });
      a.on("checkSelection", a.checkSelection,
        a);
      b.on("selectionChange", function (c) {
        var d = (c = j(b.editable(), c.data.selection.getStartElement())) && a.getByElement(c), e = a.widgetHoldingFocusedEditable;
        if (e) {
          if (e !== d || !e.focusedEditable.equals(c))l(a, e, null), d && c && l(a, d, c)
        } else d && c && l(a, d, c)
      });
      b.on("dataReady", function () {
        B(a).commit()
      });
      b.on("blur", function () {
        var b;
        (b = a.focused) && r(a, b);
        (b = a.widgetHoldingFocusedEditable) && l(a, b, null)
      })
    }

    function U(a) {
      var b = a.editor, c = a._.upcasts, d, e;
      b.on("dataReady", function () {
        if (e)for (var c = b.editable().find(".cke_widget_wrapper"),
                     d, h, n = 0, P = c.count(); n < P; ++n)d = c.getItem(n), h = d.getFirst(p), h.type == CKEDITOR.NODE_ELEMENT && h.data("widget") ? (h.replace(d), a.wrapElement(h)) : d.remove();
        e = 0;
        a.destroyAll(!0);
        a.initOnAll()
      });
      b.on("afterPaste", function () {
        b.fire("lockSnapshot");
        var c = a.initOnAll();
        d && 1 == c.length && c[0].focus();
        b.fire("unlockSnapshot")
      });
      b.on("loadSnapshot", function (b) {
        /data-cke-widget/.test(b.data) && (e = 1);
        a.destroyAll(!0)
      }, null, null, 9);
      b.on("toHtml", function (b) {
          var e = [], h;
          b.data.dataValue.forEach(function (a) {
            if ("data-cke-widget-wrapper"in
              a.attributes)return (a = a.getFirst(w)) && e.push([a]), !1;
            if ("data-widget"in a.attributes)return e.push([a]), !1;
            if (c.length)for (var b, d, f, h = 0, i = c.length; h < i; ++h)if (b = c[h], f = {}, d = b[0](a, f))return d instanceof CKEDITOR.htmlParser.element && (a = d), a.attributes["data-cke-widget-data"] = JSON.stringify(f), e.push([a, b[1]]), !1
          }, CKEDITOR.NODE_ELEMENT);
          for (; h = e.pop();)Q(h[0]), a.wrapElement(h[0], h[1]);
          d = 1 == b.data.dataValue.children.length && b.data.dataValue.children[0].type == CKEDITOR.NODE_ELEMENT && b.data.dataValue.children[0].attributes["data-cke-widget-wrapper"]
        },
        null, null, 8)
    }

    function H(a) {
      function b() {
        a.fire("checkWidgets")
      }

      var c = a.editor, d = CKEDITOR.tools.eventsBuffer(a.MIN_WIDGETS_CHECK_INTERVAL, b), e = {
        16: 1,
        17: 1,
        18: 1,
        37: 1,
        38: 1,
        39: 1,
        40: 1,
        225: 1
      };
      c.on("contentDom", function () {
        var a = c.editable();
        a.attachListener(a.isInline() ? a : c.document, "keyup", function (a) {
          a.data.getKey()in e || d.input()
        }, null, null, 999)
      });
      c.on("contentDomUnload", d.reset);
      a.on("checkWidgets", a.checkWidgets, a);
      c.on("contentDomInvalidated", b)
    }

    function B(a) {
      var b = a.selected, c = [], d = b.slice(0), e = null;
      return {
        select: function (a) {
          0 > CKEDITOR.tools.indexOf(b, a) && c.push(a);
          a = CKEDITOR.tools.indexOf(d, a);
          0 <= a && d.splice(a, 1);
          return this
        }, focus: function (a) {
          e = a;
          return this
        }, commit: function () {
          var f = a.focused !== e, g;
          a.editor.fire("lockSnapshot");
          for (f && (g = a.focused) && r(a, g); g = d.pop();)b.splice(CKEDITOR.tools.indexOf(b, g), 1), g.isInited() && g.setSelected(!1);
          f && e && (a.focused = e, a.fire("widgetFocused", {widget: e}), e.setFocused(!0));
          for (; g = c.pop();)b.push(g), g.setSelected(!0);
          a.editor.fire("unlockSnapshot")
        }
      }
    }

    function C(a) {
      a.cancel()
    }

    function A(a, b) {
      var c = a.editor, d = c.document;
      if (!d.getById("cke_copybin")) {
        var e = c.blockless || CKEDITOR.env.ie ? "span" : "div", f = d.createElement(e), g = d.createElement(e), e = CKEDITOR.env.ie && 9 > CKEDITOR.env.version;
        g.setAttributes({id: "cke_copybin", "data-cke-temp": "1"});
        f.setStyles({position: "absolute", width: "1px", height: "1px", overflow: "hidden"});
        f.setStyle("ltr" == c.config.contentsLangDirection ? "left" : "right", "-5000px");
        f.setHtml('<span data-cke-copybin-start="1">​</span>' + a.wrapper.getOuterHtml() + '<span data-cke-copybin-end="1">​</span>');
        c.fire("saveSnapshot");
        c.fire("lockSnapshot");
        g.append(f);
        c.editable().append(g);
        var h = c.on("selectionChange", C, null, null, 0), i = a.repository.on("checkSelection", C, null, null, 0);
        if (e)var j = d.getDocumentElement().$, k = j.scrollTop;
        d = c.createRange();
        d.selectNodeContents(f);
        d.select();
        e && (j.scrollTop = k);
        setTimeout(function () {
          b || a.focus();
          g.remove();
          h.removeListener();
          i.removeListener();
          c.fire("unlockSnapshot");
          if (b) {
            a.repository.del(a);
            c.fire("saveSnapshot")
          }
        }, 100)
      }
    }

    function D() {
      var a = CKEDITOR.document.getActive(),
        b = this.editor, c = b.editable();
      (c.isInline() ? c : b.document.getWindow().getFrame()).equals(a) && b.focusManager.focus(c)
    }

    function E() {
      CKEDITOR.env.gecko && this.editor.unlockSelection();
      CKEDITOR.env.webkit || (this.editor.forceNextSelectionCheck(), this.editor.selectionChange(1))
    }

    function X(a) {
      if (a.draggable) {
        var b = a.editor;
        b.editable();
        var c = new CKEDITOR.dom.element("img", b.document), d = new CKEDITOR.dom.element("span", b.document);
        d.setAttributes({
          "class": "cke_reset cke_widget_drag_handler_container",
          style: "background:rgba(220,220,220,0.5);background-image:url(" +
          b.plugins.widget.path + "images/handle.png)"
        });
        c.setAttributes({
          "class": "cke_reset cke_widget_drag_handler",
          "data-cke-widget-drag-handler": "1",
          src: F,
          width: k,
          title: b.lang.widget.move,
          height: k
        });
        if (a.inline)c.setAttribute("draggable", "true"), c.on("dragstart", function (c) {
          c.data.$.dataTransfer.setData("text", JSON.stringify({type: "cke-widget", editor: b.name, id: a.id}))
        }); else c.on("mousedown", Y, a);
        d.append(c);
        a.wrapper.append(d);
        a.dragHandlerContainer = d
      }
    }

    function Y() {
      function a() {
        var a;
        for (j.reset(); a = g.pop();)a.removeListener();
        var b = h, c = this.repository.finder;
        a = this.repository.liner;
        var d = this.editor, e = this.editor.editable();
        CKEDITOR.tools.isEmpty(a.visible) || (b = c.getRange(b[0]), this.focus(), d.fire("saveSnapshot"), d.fire("lockSnapshot", {dontUpdate: 1}), d.getSelection().reset(), e.insertElementIntoRange(this.wrapper, b), this.focus(), d.fire("unlockSnapshot"), d.fire("saveSnapshot"));
        e.removeClass("cke_widget_dragging");
        a.hideVisible()
      }

      var b = this.repository.finder, c = this.repository.locator, d = this.repository.liner, e = this.editor,
        f = e.editable(), g = [], h = [], i = b.greedySearch(), j = CKEDITOR.tools.eventsBuffer(50, function () {
          k = c.locate(i);
          h = c.sort(l, 1);
          h.length && (d.prepare(i, k), d.placeLine(h[0]), d.cleanup())
        }), k, l;
      f.addClass("cke_widget_dragging");
      g.push(f.on("mousemove", function (a) {
        l = a.data.$.clientY;
        j.input()
      }));
      g.push(e.document.once("mouseup", a, this));
      g.push(CKEDITOR.document.once("mouseup", a, this))
    }

    function Z(a) {
      var b, c, d = a.editables;
      a.editables = {};
      if (a.editables)for (b in d)c = d[b], a.initEditable(b, "string" == typeof c ? {selector: c} :
        c)
    }

    function $(a) {
      if (a.mask) {
        var b = new CKEDITOR.dom.element("img", a.editor.document);
        b.setAttributes({src: F, "class": "cke_reset cke_widget_mask"});
        a.wrapper.append(b);
        a.mask = b
      }
    }

    function aa(a) {
      if (a.parts) {
        var b = {}, c, d;
        for (d in a.parts)c = a.wrapper.findOne(a.parts[d]), b[d] = c;
        a.parts = b
      }
    }

    function N(a, b) {
      ba(a);
      aa(a);
      Z(a);
      $(a);
      X(a);
      if (CKEDITOR.env.ie && 9 > CKEDITOR.env.version)a.wrapper.on("dragstart", function (b) {
        j(a, b.data.getTarget()) || b.data.preventDefault()
      });
      a.wrapper.removeClass("cke_widget_new");
      a.element.addClass("cke_widget_element");
      a.on("key", function (b) {
        b = b.data.keyCode;
        if (13 == b)a.edit(); else {
          if (b == CKEDITOR.CTRL + 67 || b == CKEDITOR.CTRL + 88) {
            A(a, b == CKEDITOR.CTRL + 88);
            return
          }
          if (b in ca || CKEDITOR.CTRL & b || CKEDITOR.ALT & b)return
        }
        return !1
      }, null, null, 999);
      a.on("doubleclick", function (b) {
        a.edit();
        b.cancel()
      });
      if (b.data)a.on("data", b.data);
      if (b.edit)a.on("edit", b.edit);
      if (a.draggable)a.on("data", function () {
          var b = a.dragHandlerContainer;
          b.setStyle("top", a.element.$.offsetTop - k + "px");
          b.setStyle("left", a.element.$.offsetLeft + "px")
        }, null, null,
        999)
    }

    function ba(a) {
      (a.wrapper = a.element.getParent()).setAttribute("data-cke-widget-id", a.id)
    }

    function q(a) {
      a.element.data("cke-widget-data", JSON.stringify(a.data))
    }

    var k = 15;
    CKEDITOR.plugins.add("widget", {
      requires: "lineutils", onLoad: function () {
        CKEDITOR.addCss(".cke_widget_wrapper{position:relative;outline:none}.cke_widget_inline{display:inline-block}.cke_widget_wrapper:hover>.cke_widget_element{outline:2px solid yellow;cursor:default}.cke_widget_wrapper:hover .cke_widget_editable{outline:2px solid yellow}.cke_widget_wrapper.cke_widget_focused>.cke_widget_element,.cke_widget_wrapper .cke_widget_editable.cke_widget_editable_focused{outline:2px solid #ace}.cke_widget_editable{cursor:text}.cke_widget_drag_handler_container{position:absolute;width:" +
          k + "px;height:0;opacity:0.75;transition:height 0s 0.2s}.cke_widget_wrapper:hover>.cke_widget_drag_handler_container{height:" + k + "px;transition:none}.cke_widget_drag_handler_container:hover{opacity:1}img.cke_widget_drag_handler{cursor:move;width:" + k + "px;height:" + k + "px;display:inline-block}.cke_widget_mask{position:absolute;top:0;left:0;width:100%;height:100%;display:block}.cke_editable.cke_widget_dragging, .cke_editable.cke_widget_dragging *{cursor:move !important}")
      }, beforeInit: function (a) {
        a.widgets =
          new m(a)
      }, afterInit: function (a) {
        var b = a.widgets.registered, c, d, e;
        for (d in b)c = b[d], (e = c.button) && a.ui.addButton && a.ui.addButton(CKEDITOR.tools.capitalize(c.name, !0), {
          label: e,
          command: c.name,
          toolbar: "insert,10"
        });
        S(a)
      }
    });
    m.prototype = {
      MIN_SELECTION_CHECK_INTERVAL: 500, MIN_WIDGETS_CHECK_INTERVAL: 1E3, add: function (a, b) {
        b = CKEDITOR.tools.prototypedCopy(b);
        b.name = a;
        b._ = b._ || {};
        this.editor.fire("widgetDefinition", b);
        b.template && (b.template = new CKEDITOR.template(b.template));
        O(this.editor, b);
        var c = b, d = c.upcast;
        if (d)if ("string" == typeof d)for (d = d.split(","); d.length;)this._.upcasts.push([c.upcasts[d.pop()], c.name]); else this._.upcasts.push([d, c.name]);
        b.button || this.editor.addFeature(b);
        return this.registered[a] = b
      }, checkSelection: function () {
        var a = this.editor.getSelection(), b = a.getSelectedElement(), c = B(this), d;
        if (b && (d = this.getByElement(b, !0)))return c.focus(d).select(d).commit();
        a = a.getRanges()[0];
        if (!a || a.collapsed)return c.commit();
        a = new CKEDITOR.dom.walker(a);
        for (a.evaluator = y; b = a.next();)c.select(this.getByElement(b));
        c.commit()
      }, checkWidgets: function () {
        if ("wysiwyg" == this.editor.mode) {
          var a = this.editor.editable(), b = this.instances, c;
          if (a) {
            for (c in b)a.contains(b[c].wrapper) || this.destroy(b[c], !0);
            var d = a.find(".cke_widget_wrapper");
            c = 0;
            for (a = d.count(); c < a; c++) {
              var b = d.getItem(c), e;
              if (e = !this.getByElement(b, !0)) {
                a:{
                  e = R;
                  for (var f = b; f = f.getParent();)if (e(f)) {
                    e = !0;
                    break a
                  }
                  e = !1
                }
                e = !e
              }
              e && (b.addClass("cke_widget_new"), this.initOn(b.getFirst(p)))
            }
          }
        }
      }, del: function (a) {
        if (this.focused === a) {
          var b = a.editor, c = b.createRange(),
            d;
          if (!(d = c.moveToClosestEditablePosition(a.wrapper, !0)))d = c.moveToClosestEditablePosition(a.wrapper, !1);
          d && b.getSelection().selectRanges([c])
        }
        a.wrapper.remove();
        this.destroy(a, !0)
      }, destroy: function (a, b) {
        this.widgetHoldingFocusedEditable === a && l(this, a, null, b);
        a.destroy(b);
        delete this.instances[a.id];
        this.fire("instanceDestroyed", a)
      }, destroyAll: function (a) {
        var b = this.instances, c, d;
        for (d in b)c = b[d], this.destroy(c, a)
      }, finalizeCreation: function (a) {
        if ((a = a.getFirst()) && y(a))this.editor.insertElement(a),
          a = this.getByElement(a), a.ready = !0, a.fire("ready"), a.focus()
      }, getByElement: function (a, b) {
        if (!a)return null;
        var c, d;
        for (d in this.instances)if (c = this.instances[d].wrapper, c.equals(a) || !b && c.contains(a))return this.instances[d];
        return null
      }, initOn: function (a, b, c) {
        b ? "string" == typeof b && (b = this.registered[b]) : b = this.registered[a.data("widget")];
        if (!b)return null;
        var d = this.wrapElement(a, b.name);
        return d ? d.hasClass("cke_widget_new") ? (a = new i(this, this._.nextId++, a, b, c), a.isInited() ? this.instances[a.id] =
          a : null) : this.getByElement(a) : null
      }, initOnAll: function (a) {
        for (var a = (a || this.editor.editable()).find(".cke_widget_new"), b = [], c, d = a.count(); d--;)(c = this.initOn(a.getItem(d).getFirst(p))) && b.push(c);
        return b
      }, wrapElement: function (a, b) {
        var c = null, d, e;
        if (a instanceof CKEDITOR.dom.element) {
          d = this.registered[b || a.data("widget")];
          if (!d)return null;
          if ((c = a.getParent()) && c.type == CKEDITOR.NODE_ELEMENT && c.data("cke-widget-wrapper"))return c;
          a.hasAttribute("data-cke-widget-keep-attr") || a.data("cke-widget-keep-attr",
            a.data("widget") ? 1 : 0);
          b && a.data("widget", b);
          e = x(d, a.getName());
          c = new CKEDITOR.dom.element(e ? "span" : "div");
          c.setAttributes(u(e));
          c.data("cke-display-name", d.pathName ? d.pathName : a.getName());
          a.getParent(!0) && c.replace(a);
          a.appendTo(c)
        } else if (a instanceof CKEDITOR.htmlParser.element) {
          d = this.registered[b || a.attributes["data-widget"]];
          if (!d)return null;
          if ((c = a.parent) && c.type == CKEDITOR.NODE_ELEMENT && c.attributes["data-cke-widget-wrapper"])return c;
          "data-cke-widget-keep-attr"in a.attributes || (a.attributes["data-cke-widget-keep-attr"] =
            a.attributes["data-widget"] ? 1 : 0);
          b && (a.attributes["data-widget"] = b);
          e = x(d, a.name);
          c = new CKEDITOR.htmlParser.element(e ? "span" : "div", u(e));
          c.attributes["data-cke-display-name"] = d.pathName ? d.pathName : a.name;
          d = a.parent;
          var f;
          d && (f = a.getIndex(), a.remove());
          c.add(a);
          d && v(d, f, c)
        }
        return c
      }, _tests_getNestedEditable: j, _tests_createEditableFilter: s
    };
    CKEDITOR.event.implementOn(m.prototype);
    i.prototype = {
      destroy: function (a) {
        this.fire("destroy");
        if (this.editables)for (var b in this.editables)this.destroyEditable(b,
          a);
        a || ("0" == this.element.data("cke-widget-keep-attr") && this.element.removeAttribute("data-widget"), this.element.removeAttributes(["data-cke-widget-data", "data-cke-widget-keep-attr"]), this.element.removeClass("cke_widget_element"), this.element.replace(this.wrapper));
        this.wrapper = null
      }, destroyEditable: function (a, b) {
        var c = this.editables[a];
        c.removeListener("focus", E);
        c.removeListener("blur", D);
        this.editor.focusManager.remove(c);
        b || (c.removeClass("cke_widget_editable"), c.removeClass("cke_widget_editable_focused"),
          c.removeAttributes(["contenteditable", "data-cke-widget-editable", "data-cke-enter-mode"]));
        delete this.editables[a]
      }, edit: function () {
        var a = {dialog: this.dialog}, b = this;
        this.fire("edit", a) && a.dialog && this.editor.openDialog(a.dialog, function (a) {
          var d, e;
          b.fire("dialog", a) && (d = a.on("show", function () {
            a.setupContent(b)
          }), e = a.on("ok", function () {
            var d, e = b.on("data", function (a) {
              d = 1;
              a.cancel()
            }, null, null, 0);
            b.editor.fire("saveSnapshot");
            a.commitContent(b);
            e.removeListener();
            d && (b.fire("data", b.data), b.editor.fire("saveSnapshot"))
          }),
            a.once("hide", function () {
              d.removeListener();
              e.removeListener()
            }))
        })
      }, initEditable: function (a, b) {
        var c = this.wrapper.findOne(b.selector);
        return c && c.is(CKEDITOR.dtd.$editable) ? (c = new o(this.editor, c, {filter: s.call(this.repository, this.name, a, b)}), this.editables[a] = c, c.setAttributes({
          contenteditable: "true",
          "data-cke-widget-editable": a,
          "data-cke-enter-mode": c.enterMode
        }), c.filter && c.data("cke-filter", c.filter.id), c.addClass("cke_widget_editable"), c.removeClass("cke_widget_editable_focused"), b.pathName &&
        c.data("cke-display-name", b.pathName), this.editor.focusManager.add(c), c.on("focus", E, this), CKEDITOR.env.ie && c.on("blur", D, this), c.setData(c.getHtml()), !0) : !1
      }, isInited: function () {
        return !(!this.wrapper || !this.inited)
      }, isReady: function () {
        return this.isInited() && this.ready
      }, focus: function () {
        var a = this.editor.getSelection();
        a && a.fake(this.wrapper);
        this.editor.focus()
      }, setData: function (a, b) {
        var c = this.data, d = 0;
        if ("string" == typeof a)c[a] !== b && (c[a] = b, d = 1); else {
          var e = a;
          for (a in e)c[a] !== e[a] && (d = 1, c[a] =
            e[a])
        }
        d && this.dataReady && (q(this), this.fire("data", c));
        return this
      }, setFocused: function (a) {
        this.wrapper[a ? "addClass" : "removeClass"]("cke_widget_focused");
        this.fire(a ? "focus" : "blur");
        return this
      }, setSelected: function (a) {
        this.wrapper[a ? "addClass" : "removeClass"]("cke_widget_selected");
        this.fire(a ? "select" : "deselect");
        return this
      }
    };
    CKEDITOR.event.implementOn(i.prototype);
    o.prototype = CKEDITOR.tools.extend(CKEDITOR.tools.prototypedCopy(CKEDITOR.dom.element.prototype), {
      setData: function (a) {
        a = this.editor.dataProcessor.toHtml(a,
          {context: this.getName(), filter: this.filter, enterMode: this.enterMode});
        this.setHtml(a)
      }, getData: function () {
        return this.editor.dataProcessor.toDataFormat(this.getHtml(), {
          context: this.getName(),
          filter: this.filter,
          enterMode: this.enterMode
        })
      }
    });
    var W = RegExp('^(?:<(?:div|span)(?: data-cke-temp="1")?(?: id="cke_copybin")?(?: data-cke-temp="1")?>)?(?:<(?:div|span)(?: style="[^"]+")?>)?<span [^>]*data-cke-copybin-start="1"[^>]*>.?</span>([\\s\\S]+)<span [^>]*data-cke-copybin-end="1"[^>]*>.?</span>(?:</(?:div|span)>)?(?:</(?:div|span)>)?$'),
      F = "data:image/gif;base64,R0lGODlhAQABAPABAP///wAAACH5BAEKAAAALAAAAAABAAEAAAICRAEAOw%3D%3D", ca = {
        37: 1,
        38: 1,
        39: 1,
        40: 1,
        8: 1,
        46: 1
      };
    CKEDITOR.plugins.widget = i;
    i.repository = m;
    i.nestedEditable = o
  })();
  (function () {
    function l(a) {
      if (!(a.name in{div: 1, p: 1}))return !1;
      var b = a.children;
      if (1 !== b.length)return !1;
      var b = b[0], c = b.name;
      return "img" != c && !("figure" == c && b.hasClass("caption")) ? !1 : "center" == CKEDITOR.tools.parseCssText(a.attributes.style || "", !0)["text-align"] ? !0 : !1
    }

    function z(a) {
      var b = a.data, b = {width: b.width, height: b.height}, a = a.parts.image, c;
      for (c in b)b[c] ? a.setAttribute(c, b[c]) : a.removeAttribute(c)
    }

    function A(a) {
      var b = a.editor, c = b.editable(), d = b.document, e = d.createElement("span");
      e.addClass("cke_image2_resizer");
      e.setAttribute("title", b.lang.image2.resizer);
      e.append(new CKEDITOR.dom.text("​", d));
      if (a.inline)a.wrapper.append(e); else {
        var f = a.element.getFirst(), h = d.createElement("span");
        h.addClass("cke_image2_resizer_wrapper");
        h.append(a.parts.image);
        h.append(e);
        a.element.append(h, !0);
        f.is("span") && f.remove()
      }
      e.on("mousedown", function (f) {
        function h(a, b, c) {
          var g = CKEDITOR.document, i = [];
          d.equals(g) || i.push(g.on(a, b));
          i.push(d.on(a, b));
          if (c)for (a = i.length; a--;)c.push(i.pop())
        }

        function g() {
          o = k + m * r;
          p = Math.round(o /
            q)
        }

        function i() {
          p = t - n;
          o = Math.round(p * q)
        }

        var v = a.parts.image, m = "right" == a.data.align ? -1 : 1, j = f.data.$.screenX, l = f.data.$.screenY, k = v.$.clientWidth, t = v.$.clientHeight, q = k / t, w = [], y = "cke_image2_s" + (!~m ? "w" : "e"), x, o, p, u, r, n, s;
        b.fire("saveSnapshot");
        h("mousemove", function (a) {
          x = a.data.$;
          r = x.screenX - j;
          n = l - x.screenY;
          s = Math.abs(r / n);
          1 == m ? 0 >= r ? 0 >= n ? g() : s >= q ? g() : i() : 0 >= n ? s >= q ? i() : g() : i() : 0 >= r ? 0 >= n ? s >= q ? i() : g() : i() : 0 >= n ? g() : s >= q ? g() : i();
          15 <= o && 15 <= p ? (v.setAttributes({width: o, height: p}), u = !0) : u = !1
        }, w);
        h("mouseup",
          function () {
            for (var g; g = w.pop();)g.removeListener();
            u && (a.setData({width: o, height: p}), b.fire("saveSnapshot"));
            c.removeClass(y);
            e.removeClass("cke_image2_resizing");
            u = !1
          }, w);
        c.addClass(y);
        e.addClass("cke_image2_resizing")
      });
      a.on("data", function () {
        e["right" == a.data.align ? "addClass" : "removeClass"]("cke_image2_resizer_left")
      })
    }

    function B(a) {
      var b = [];
      return function (c) {
        var d = a.getCommand("justify" + c);
        if (d) {
          b.push(function () {
            d.refresh(a, a.elementPath())
          });
          if (c in{right: 1, left: 1, center: 1})d.on("exec", function (d) {
            var f =
              t(a);
            if (f) {
              f.setData("align", c);
              for (f = b.length; f--;)b[f]();
              d.cancel()
            }
          });
          d.on("refresh", function (b) {
            var d = t(a), h = {right: 1, left: 1, center: 1};
            d && (this.setState(d.data.align == c ? CKEDITOR.TRISTATE_ON : c in h ? CKEDITOR.TRISTATE_OFF : CKEDITOR.TRISTATE_DISABLED), b.cancel())
          })
        }
      }
    }

    function t(a) {
      return (a = a.widgets.focused) && "image2" == a.name ? a : null
    }

    var C = /^\s*(\d+\%)\s*$/i;
    CKEDITOR.plugins.add("image2", {
      requires: "widget,dialog", icons: "image2", hidpi: !0, onLoad: function () {
        CKEDITOR.addCss(".cke_editable.cke_image2_sw, .cke_editable.cke_image2_sw *{cursor:sw-resize !important}.cke_editable.cke_image2_se, .cke_editable.cke_image2_se *{cursor:se-resize !important}.cke_image2_resizer{display:none;position:absolute;width:10px;height:10px;bottom:-5px;right:-5px;background:#000;outline:1px solid #fff;cursor:se-resize;}.cke_image2_resizer_wrapper{position:relative;display:inline-block;line-height:0;}.cke_image2_resizer.cke_image2_resizer_left{right:auto;left:-5px;cursor:sw-resize;}.cke_widget_wrapper:hover .cke_image2_resizer,.cke_image2_resizer.cke_image2_resizing{display:block}")
      },
      init: function (a) {
        var b = a.config, c = a.lang.image2;
        b.filebrowserImage2BrowseUrl = b.filebrowserImageBrowseUrl;
        b.filebrowserImage2UploadUrl = b.filebrowserImageUploadUrl;
        k.pathName = c.pathName;
        k.editables.caption.pathName = c.pathNameCaption;
        a.widgets.add("image2", k);
        a.ui.addButton && a.ui.addButton("image2", {
          label: a.lang.common.image,
          command: "image2",
          toolbar: "insert,10"
        });
        a.contextMenu && (a.addMenuGroup("image2", 10), a.addMenuItem("image2", {
          label: c.menu,
          command: "image2",
          group: "image2"
        }));
        CKEDITOR.dialog.add("image2",
          this.path + "dialogs/image2.js")
      }, afterInit: function (a) {
        var b = {left: 1, right: 1, center: 1, block: 1}, a = B(a), c;
        for (c in b)a(c)
      }
    });
    var k = {
      allowedContent: {
        div: {match: l, styles: "text-align"},
        figcaption: !0,
        figure: {classes: "!caption", styles: "float,display"},
        img: {attributes: "!src,alt,width,height", styles: "float"},
        p: {match: l, styles: "text-align"}
      },
      contentTransformations: [["img[width]: sizeToAttribute"]],
      editables: {caption: {selector: "figcaption", allowedContent: "br em strong sub sup u s; a[!href]"}},
      parts: {
        image: "img",
        caption: "figcaption"
      },
      dialog: "image2",
      template: '<img alt="" src="" />',
      data: function () {
        var a = this, b = a.editor;
        a.shiftState({
          element: a.element, oldState: a.oldData, newState: a.data, destroy: function () {
            this.destroyed || (b.widgets.focused == a && (this.focused = !0), b.widgets.destroy(a), this.destroyed = !0)
          }, init: function (c) {
            if (this.destroyed)a = b.widgets.initOn(c, "image2", a.data), this.focused && (a.focus(), delete this.focused), delete this.destroyed; else {
              var c = a, d = c.wrapper, e = c.data.align;
              "center" == e ? (c.inline || d.setStyle("text-align",
                "center"), d.removeStyle("float")) : (c.inline || d.removeStyle("text-align"), "none" == e ? d.removeStyle("float") : d.setStyle("float", e))
            }
          }
        });
        a.parts.image.setAttributes({src: a.data.src, "data-cke-saved-src": a.data.src, alt: a.data.alt});
        z(a);
        a.oldData = CKEDITOR.tools.extend({}, a.data)
      },
      init: function () {
        var a = CKEDITOR.plugins.image2, b = this.parts.image, c = {
          hasCaption: !!this.parts.caption,
          src: b.getAttribute("src"),
          alt: b.getAttribute("alt") || "",
          width: b.getAttribute("width") || "",
          height: b.getAttribute("height") || "",
          lock: this.ready ? a.checkHasNaturalRatio(b) : !0
        };
        c.align || (c.align = this.element.getStyle("float") || b.getStyle("float") || "none", this.element.removeStyle("float"), b.removeStyle("float"));
        c.hasCaption || this.wrapper.setStyle("line-height", "0");
        this.setData(c);
        A(this);
        this.shiftState = a.stateShifter(this.editor);
        this.on("contextMenu", function (a) {
          a.data.image2 = CKEDITOR.TRISTATE_OFF
        });
        this.on("dialog", function (a) {
          a.data.widget = this
        }, this)
      },
      upcast: function (a, b) {
        var c = {width: 1, height: 1}, d = a.name, e;
        if (!a.attributes["data-cke-realelement"] &&
          (l(a) ? ("div" == d && (e = a.getFirst("figure"), a.replaceWith(e), a = e), b.align = "center", e = a.getFirst("img")) : "figure" == d && a.hasClass("caption") ? e = a.getFirst("img") : "img" == d && (e = a), e)) {
          for (var f in c)(d = e.attributes[f]) && d.match(C) && delete e.attributes[f];
          return a
        }
      },
      downcast: function (a) {
        var b = a.attributes, c = this.data.align;
        if (!this.inline) {
          var d = a.getFirst("span"), e = d.getFirst("img");
          d.replaceWith(e)
        }
        c && "none" != c && (d = CKEDITOR.tools.parseCssText(b.style || ""), "center" == c && "p" != a.name ? a = a.wrapWith(new CKEDITOR.htmlParser.element("img" ==
        a.name ? "p" : "div", {style: "text-align:center"})) : c in{
          left: 1,
          right: 1
        } && (d["float"] = c), CKEDITOR.tools.isEmpty(d) || (b.style = CKEDITOR.tools.writeCssText(d)));
        return a
      }
    };
    CKEDITOR.plugins.image2 = {
      stateShifter: function (a) {
        function b(a, b) {
          return a.oldState ? a.oldState[b] !== a.newState[b] : !1
        }

        function c(a) {
          var b = f.createElement(e, {styles: {"text-align": "center"}});
          d(b, a);
          a.move(b);
          return b
        }

        function d(b, c) {
          if (c.getParent()) {
            var d = a.createRange();
            d.moveToPosition(c, CKEDITOR.POSITION_BEFORE_START);
            h.insertElementIntoRange(b,
              d);
            c.remove()
          } else b.replace(c)
        }

        var e = a.config.enterMode == CKEDITOR.ENTER_P ? "p" : "div", f = a.document, h = a.editable(), k = ["hasCaption", "align"], l = {
          align: function (a, d, e) {
            var f = a.newState.hasCaption, j = a.element;
            if (b(a, "align")) {
              if (!f && ("center" == e && (a.destroy(), a.element = c(j)), !b(a, "hasCaption") && "center" == d && "center" != e))a.destroy(), d = j.findOne("img"), d.replace(j), a.element = d
            } else"center" == e && (b(a, "hasCaption") && !f) && (a.destroy(), a.element = c(j));
            j.is("figure") && ("center" == e ? j.setStyle("display", "inline-block") :
              j.removeStyle("display"))
          }, hasCaption: function (a, c, e) {
            if (b(a, "hasCaption"))if (c = a.element, a.destroy(), e) {
              var e = c.findOne("img") || c, m = CKEDITOR.dom.element.createFromHtml('<figure class="caption"><img alt="" src="" /><figcaption>Caption</figcaption></figure>', f);
              d(m, c);
              e.replace(m.findOne("img"));
              a.element = m
            } else e = c.findOne("img"), e.replace(c), a.element = e
          }
        };
        return function (a) {
          for (var b = a.oldState, c = a.newState, d, e = 0; e < k.length; e++)d = k[e], l[d](a, b ? b[d] : null, c[d]);
          a.init(a.element)
        }
      }, checkHasNaturalRatio: function (a) {
        var b =
          a.$, a = this.getNatural(a);
        return Math.round(b.clientWidth / a.width * a.height) == b.clientHeight || Math.round(b.clientHeight / a.height * a.width) == b.clientWidth
      }, getNatural: function (a) {
        if (a.$.naturalWidth)a = {width: a.$.naturalWidth, height: a.$.naturalHeight}; else {
          var b = new Image;
          b.src = a.getAttribute("src");
          a = {width: b.width, height: b.height}
        }
        return a
      }
    }
  })();
  (function () {
    function h(b, e, c) {
      var i = [], g = [], a;
      for (a = 0; a < b.styleSheets.length; a++) {
        var d = b.styleSheets[a];
        if (!(d.ownerNode || d.owningElement).getAttribute("data-cke-temp") && !(d.href && "chrome://" == d.href.substr(0, 9)))try {
          for (var f = d.cssRules || d.rules, d = 0; d < f.length; d++)g.push(f[d].selectorText)
        } catch (h) {
        }
      }
      a = g.join(" ");
      a = a.replace(/(,|>|\+|~)/g, " ");
      a = a.replace(/\[[^\]]*/g, "");
      a = a.replace(/#[^\s]*/g, "");
      a = a.replace(/\:{1,2}[^\s]*/g, "");
      a = a.replace(/\s+/g, " ");
      a = a.split(" ");
      b = [];
      for (g = 0; g < a.length; g++)f =
        a[g], c.test(f) && !e.test(f) && -1 == CKEDITOR.tools.indexOf(b, f) && b.push(f);
      for (a = 0; a < b.length; a++)c = b[a].split("."), e = c[0].toLowerCase(), c = c[1], i.push({
        name: e + "." + c,
        element: e,
        attributes: {"class": c}
      });
      return i
    }

    CKEDITOR.plugins.add("stylesheetparser", {
      init: function (b) {
        b.filter.disable();
        var e;
        b.once("stylesSet", function (c) {
          c.cancel();
          b.once("contentDom", function () {
            b.getStylesSet(function (c) {
              e = c.concat(h(b.document.$, b.config.stylesheetParser_skipSelectors || /(^body\.|^\.)/i, b.config.stylesheetParser_validSelectors ||
                /\w+\.\w+/));
              b.getStylesSet = function (b) {
                if (e)return b(e)
              };
              b.fire("stylesSet", {styles: e})
            })
          })
        }, null, null, 1)
      }
    })
  })();
  (function () {
    var f = {
      preserveState: !0, editorFocus: !1, readOnly: 1, exec: function (a) {
        this.toggleState();
        this.refresh(a)
      }, refresh: function (a) {
        if (a.document) {
          var b = this.state == CKEDITOR.TRISTATE_ON ? "attachClass" : "removeClass";
          a.editable()[b]("cke_show_borders")
        }
      }
    };
    CKEDITOR.plugins.add("showborders", {
      modes: {wysiwyg: 1}, onLoad: function () {
        var a;
        a = (CKEDITOR.env.ie6Compat ? [".%1 table.%2,", ".%1 table.%2 td, .%1 table.%2 th", "{", "border : #d3d3d3 1px dotted", "}"] : ".%1 table.%2,;.%1 table.%2 > tr > td, .%1 table.%2 > tr > th,;.%1 table.%2 > tbody > tr > td, .%1 table.%2 > tbody > tr > th,;.%1 table.%2 > thead > tr > td, .%1 table.%2 > thead > tr > th,;.%1 table.%2 > tfoot > tr > td, .%1 table.%2 > tfoot > tr > th;{;border : #d3d3d3 1px dotted;}".split(";")).join("").replace(/%2/g,
          "cke_show_border").replace(/%1/g, "cke_show_borders ");
        CKEDITOR.addCss(a)
      }, init: function (a) {
        var b = a.addCommand("showborders", f);
        b.canUndo = !1;
        !1 !== a.config.startupShowBorders && b.setState(CKEDITOR.TRISTATE_ON);
        a.on("mode", function () {
          b.state != CKEDITOR.TRISTATE_DISABLED && b.refresh(a)
        }, null, null, 100);
        a.on("contentDom", function () {
          b.state != CKEDITOR.TRISTATE_DISABLED && b.refresh(a)
        });
        a.on("removeFormatCleanup", function (d) {
          d = d.data;
          a.getCommand("showborders").state == CKEDITOR.TRISTATE_ON && (d.is("table") && (!d.hasAttribute("border") ||
          0 >= parseInt(d.getAttribute("border"), 10))) && d.addClass("cke_show_border")
        })
      }, afterInit: function (a) {
        var b = a.dataProcessor, a = b && b.dataFilter, b = b && b.htmlFilter;
        a && a.addRules({
          elements: {
            table: function (a) {
              var a = a.attributes, b = a["class"], c = parseInt(a.border, 10);
              if ((!c || 0 >= c) && (!b || -1 == b.indexOf("cke_show_border")))a["class"] = (b || "") + " cke_show_border"
            }
          }
        });
        b && b.addRules({
          elements: {
            table: function (a) {
              var a = a.attributes, b = a["class"];
              b && (a["class"] = b.replace("cke_show_border", "").replace(/\s{2}/, " ").replace(/^\s+|\s+$/,
                ""))
            }
          }
        })
      }
    });
    CKEDITOR.on("dialogDefinition", function (a) {
      var b = a.data.name;
      if ("table" == b || "tableProperties" == b)if (a = a.data.definition, b = a.getContents("info").get("txtBorder"), b.commit = CKEDITOR.tools.override(b.commit, function (a) {
          return function (b, c) {
            a.apply(this, arguments);
            var e = parseInt(this.getValue(), 10);
            c[!e || 0 >= e ? "addClass" : "removeClass"]("cke_show_border")
          }
        }), a = (a = a.getContents("advanced")) && a.get("advCSSClasses"))a.setup = CKEDITOR.tools.override(a.setup, function (a) {
        return function () {
          a.apply(this,
            arguments);
          this.setValue(this.getValue().replace(/cke_show_border/, ""))
        }
      }), a.commit = CKEDITOR.tools.override(a.commit, function (a) {
        return function (b, c) {
          a.apply(this, arguments);
          parseInt(c.getAttribute("border"), 10) || c.addClass("cke_show_border")
        }
      })
    })
  })();
  (function () {
    CKEDITOR.plugins.add("templates", {
      requires: "dialog", init: function (a) {
        CKEDITOR.dialog.add("templates", CKEDITOR.getUrl(this.path + "dialogs/templates.js"));
        a.addCommand("templates", new CKEDITOR.dialogCommand("templates"));
        a.ui.addButton && a.ui.addButton("Templates", {
          label: a.lang.templates.button,
          command: "templates",
          toolbar: "doctools,10"
        })
      }
    });
    var c = {}, f = {};
    CKEDITOR.addTemplates = function (a, d) {
      c[a] = d
    };
    CKEDITOR.getTemplates = function (a) {
      return c[a]
    };
    CKEDITOR.loadTemplates = function (a, d) {
      for (var e =
        [], b = 0, c = a.length; b < c; b++)f[a[b]] || (e.push(a[b]), f[a[b]] = 1);
      e.length ? CKEDITOR.scriptLoader.load(e, d) : setTimeout(d, 0)
    }
  })();
  CKEDITOR.config.templates_files = [CKEDITOR.getUrl("plugins/templates/templates/default.js")];
  CKEDITOR.config.templates_replaceContent = !0;
  CKEDITOR.plugins.add("divarea", {
    afterInit: function (a) {
      a.addMode("wysiwyg", function (c) {
        var b = CKEDITOR.dom.element.createFromHtml('<div class="cke_wysiwyg_div cke_reset" hidefocus="true"></div>');
        a.ui.space("contents").append(b);
        b = a.editable(b);
        b.detach = CKEDITOR.tools.override(b.detach, function (a) {
          return function () {
            a.apply(this, arguments);
            this.remove()
          }
        });
        a.setData(a.getData(1), c);
        a.fire("contentDom")
      })
    }
  });
  (function () {
    function l(a, c) {
      var c = void 0 === c || c, b;
      if (c)b = a.getComputedStyle("text-align"); else {
        for (; !a.hasAttribute || !a.hasAttribute("align") && !a.getStyle("text-align");) {
          b = a.getParent();
          if (!b)break;
          a = b
        }
        b = a.getStyle("text-align") || a.getAttribute("align") || ""
      }
      b && (b = b.replace(/(?:-(?:moz|webkit)-)?(?:start|auto)/i, ""));
      !b && c && (b = "rtl" == a.getComputedStyle("direction") ? "right" : "left");
      return b
    }

    function g(a, c, b) {
      this.editor = a;
      this.name = c;
      this.value = b;
      this.context = "p";
      var c = a.config.justifyClasses, h = a.config.enterMode ==
      CKEDITOR.ENTER_P ? "p" : "div";
      if (c) {
        switch (b) {
          case "left":
            this.cssClassName = c[0];
            break;
          case "center":
            this.cssClassName = c[1];
            break;
          case "right":
            this.cssClassName = c[2];
            break;
          case "justify":
            this.cssClassName = c[3]
        }
        this.cssClassRegex = RegExp("(?:^|\\s+)(?:" + c.join("|") + ")(?=$|\\s)");
        this.requiredContent = h + "(" + this.cssClassName + ")"
      } else this.requiredContent = h + "{text-align}";
      this.allowedContent = {
        "caption div h1 h2 h3 h4 h5 h6 p pre td th li": {
          propertiesOnly: !0, styles: this.cssClassName ? null : "text-align", classes: this.cssClassName ||
          null
        }
      };
      a.config.enterMode == CKEDITOR.ENTER_BR && (this.allowedContent.div = !0)
    }

    function j(a) {
      var c = a.editor, b = c.createRange();
      b.setStartBefore(a.data.node);
      b.setEndAfter(a.data.node);
      for (var h = new CKEDITOR.dom.walker(b), d; d = h.next();)if (d.type == CKEDITOR.NODE_ELEMENT)if (!d.equals(a.data.node) && d.getDirection())b.setStartAfter(d), h = new CKEDITOR.dom.walker(b); else {
        var e = c.config.justifyClasses;
        e && (d.hasClass(e[0]) ? (d.removeClass(e[0]), d.addClass(e[2])) : d.hasClass(e[2]) && (d.removeClass(e[2]), d.addClass(e[0])));
        e = d.getStyle("text-align");
        "left" == e ? d.setStyle("text-align", "right") : "right" == e && d.setStyle("text-align", "left")
      }
    }

    g.prototype = {
      exec: function (a) {
        var c = a.getSelection(), b = a.config.enterMode;
        if (c) {
          for (var h = c.createBookmarks(), d = c.getRanges(), e = this.cssClassName, g, f, i = a.config.useComputedState, i = void 0 === i || i, k = d.length - 1; 0 <= k; k--) {
            g = d[k].createIterator();
            for (g.enlargeBr = b != CKEDITOR.ENTER_BR; f = g.getNextParagraph(b == CKEDITOR.ENTER_P ? "p" : "div");)if (!f.isReadOnly()) {
              f.removeAttribute("align");
              f.removeStyle("text-align");
              var j = e && (f.$.className = CKEDITOR.tools.ltrim(f.$.className.replace(this.cssClassRegex, ""))), m = this.state == CKEDITOR.TRISTATE_OFF && (!i || l(f, !0) != this.value);
              e ? m ? f.addClass(e) : j || f.removeAttribute("class") : m && f.setStyle("text-align", this.value)
            }
          }
          a.focus();
          a.forceNextSelectionCheck();
          c.selectBookmarks(h)
        }
      }, refresh: function (a, c) {
        var b = c.block || c.blockLimit;
        this.setState("body" != b.getName() && l(b, this.editor.config.useComputedState) == this.value ? CKEDITOR.TRISTATE_ON : CKEDITOR.TRISTATE_OFF)
      }
    };
    CKEDITOR.plugins.add("justify",
      {
        init: function (a) {
          if (!a.blockless) {
            var c = new g(a, "justifyleft", "left"), b = new g(a, "justifycenter", "center"), h = new g(a, "justifyright", "right"), d = new g(a, "justifyblock", "justify");
            a.addCommand("justifyleft", c);
            a.addCommand("justifycenter", b);
            a.addCommand("justifyright", h);
            a.addCommand("justifyblock", d);
            a.ui.addButton && (a.ui.addButton("JustifyLeft", {
              label: a.lang.justify.left,
              command: "justifyleft",
              toolbar: "align,10"
            }), a.ui.addButton("JustifyCenter", {
              label: a.lang.justify.center, command: "justifycenter",
              toolbar: "align,20"
            }), a.ui.addButton("JustifyRight", {
              label: a.lang.justify.right,
              command: "justifyright",
              toolbar: "align,30"
            }), a.ui.addButton("JustifyBlock", {
              label: a.lang.justify.block,
              command: "justifyblock",
              toolbar: "align,40"
            }));
            a.on("dirChanged", j)
          }
        }
      })
  })();
  CKEDITOR.config.plugins = 'dialogui,dialog,a11yhelp,basicstyles,blockquote,clipboard,panel,floatpanel,menu,contextmenu,resize,button,toolbar,elementspath,enterkey,entities,popup,filebrowser,floatingspace,listblock,richcombo,format,horizontalrule,htmlwriter,wysiwygarea,image,indent,indentlist,fakeobjects,link,list,magicline,maximize,pastetext,pastefromword,removeformat,sourcearea,specialchar,menubutton,scayt,stylescombo,tab,table,tabletools,undo,wsc,lineutils,widget,image2,stylesheetparser,showborders,templates,divarea,justify';
  CKEDITOR.config.skin = 'moono';
  (function () {
    var setIcons = function (icons, strip) {
      var path = CKEDITOR.getUrl('plugins/' + strip);
      icons = icons.split(',');
      for (var i = 0; i < icons.length; i++)CKEDITOR.skin.icons[icons[i]] = {
        path: path,
        offset: -icons[++i],
        bgsize: icons[++i]
      };
    };
    if (CKEDITOR.env.hidpi) setIcons('bold,0,,italic,24,,strike,48,,subscript,72,,superscript,96,,underline,120,,blockquote,144,,copy-rtl,168,,copy,192,,cut-rtl,216,,cut,240,,paste-rtl,264,,paste,288,,horizontalrule,312,,image,336,,indent-rtl,360,,indent,384,,outdent-rtl,408,,outdent,432,,anchor-rtl,456,,anchor,480,,link,504,,unlink,528,,bulletedlist-rtl,552,,bulletedlist,576,,numberedlist-rtl,600,,numberedlist,624,,maximize,648,,pastetext-rtl,672,,pastetext,696,,pastefromword-rtl,720,,pastefromword,744,,removeformat,768,,source-rtl,792,,source,816,,specialchar,840,,scayt,864,,table,888,,redo-rtl,912,,redo,936,,undo-rtl,960,,undo,984,,spellchecker,1008,,image2,1032,,templates-rtl,1056,,templates,1080,,justifyblock,1104,,justifycenter,1128,,justifyleft,1152,,justifyright,1176,', 'icons_hidpi.png'); else setIcons('bold,0,auto,italic,24,auto,strike,48,auto,subscript,72,auto,superscript,96,auto,underline,120,auto,blockquote,144,auto,copy-rtl,168,auto,copy,192,auto,cut-rtl,216,auto,cut,240,auto,paste-rtl,264,auto,paste,288,auto,horizontalrule,312,auto,image,336,auto,indent-rtl,360,auto,indent,384,auto,outdent-rtl,408,auto,outdent,432,auto,anchor-rtl,456,auto,anchor,480,auto,link,504,auto,unlink,528,auto,bulletedlist-rtl,552,auto,bulletedlist,576,auto,numberedlist-rtl,600,auto,numberedlist,624,auto,maximize,648,auto,pastetext-rtl,672,auto,pastetext,696,auto,pastefromword-rtl,720,auto,pastefromword,744,auto,removeformat,768,auto,source-rtl,792,auto,source,816,auto,specialchar,840,auto,scayt,864,auto,table,888,auto,redo-rtl,912,auto,redo,936,auto,undo-rtl,960,auto,undo,984,auto,spellchecker,1008,auto,image2,1032,auto,templates-rtl,1056,auto,templates,1080,auto,justifyblock,1104,auto,justifycenter,1128,auto,justifyleft,1152,auto,justifyright,1176,auto', 'icons.png');
  })();
  CKEDITOR.lang.languages = {"en": 1, "ru": 1};
}());
