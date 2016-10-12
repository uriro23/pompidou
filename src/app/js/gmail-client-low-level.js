/* global gapi */
'use strict';

(function () {
  var googleProperties = {
    //jscs:disable
    /* jshint ignore:start */
    cookiepolicy: 'single_host_origin',
    scope: 'https://www.googleapis.com/auth/gmail.compose',
    'response_type': 'token',
    'approval_prompt': 'auto',
    'client_id': '100000094440-7asn9vub4aolt0t7f2ou96hutu42rpnu.apps.googleusercontent.com'
    //jscs:enable
    /* jshint ignore:end */
  };

  /* @ngInject */
  function GmailClientLowLevel($q, $timeout, $http) {
    var isInitialized = $q.defer();
    var that = this;

    this.authenticateIfAuthorized = function () {
      var p = $q.defer();

      function immediateAuth() {
        if (!gapi || !gapi.auth || !gapi.auth.authorize) {
          $timeout(immediateAuth, 100);
          return;
        }
        var immediateProps = angular.extend({}, googleProperties, {immediate: true});
        gapi.auth.authorize(immediateProps).then(function () {
          p.resolve(true);
          initialize();
        }, function () {
          p.resolve(false);
        });
      }

      immediateAuth();
      return p.promise;
    };

    this.authorize = function () {
      return promiseTranslator(gapi.auth.authorize(googleProperties)).then(function () {
        initialize();
        return true;
      }, function () {
        return false;
      });
    };

    function initialize() {
      promiseTranslator(gapi.client.load('gmail', 'v1')).then(function () {
        isInitialized.resolve(true);
      });
    }

    function promiseTranslator(googlePromise) {
      var p = $q.defer();
      googlePromise.then(function (resp) {
        if (resp) {
          p.resolve(resp.result);
        } else {
          p.resolve();
        }
      }, function (err) {
        p.reject(err);
      });
      return p.promise;
    }

    function sendMessage(email) {
      // Web-safe base64
      var base64EncodedEmail = encodeUtf8(email).replace(/\//g, '_').replace(/\+/g, '-');
      return promiseTranslator(gapi.client.gmail.users.messages.send({
        userId: 'me',
        resource: {
          raw: base64EncodedEmail
        }
      }));
    }

    function encodeUtf8(toBeEncoded) {
      return btoa(unescape(encodeURIComponent(toBeEncoded)));
    }

    this.sendEmail = function (params) {
      var to = params.to,
        cc = params.cc,
        subject = params.subject,
        content = params.text;
      var emailHeaders = 'From: \'me\'\r\n' +
        'To:  ' + to + '\r\n' +
        'Cc:  ' + cc + '\r\n' +
        'Subject: =?utf-8?B?' + encodeUtf8(subject) + '?=\r\n' +
        'Content-Type: text/html; charset=utf-8\r\n' +
        'Content-Transfer-Encoding: 7BIT\r\n';

      return isInitialized.promise.then(function () {
        that.getPdf().then(function (pdfEncoded) {
          // return sendMessage(emailHeaders + '\r\n' + content);
          return sendMessage(Mime.toMimeTxt({
            "to": to,
            "cc": cc,
            "subject": subject,
            "from": "me",
            "body": content,
            // 'Content-Type': 'text/html; charset=utf-8',
            // 'Content-Transfer-Encoding': '7BIT',
            "cids": [],
            "attaches": [{
              type: 'application/pdf',
              name: 'uriburi.pdf',
              base64: pdfEncoded
            }]
          }));
        }, function (err) {
          console.error("error getting pdf", err);
        });
      });
    };

    function _arrayBufferToBase64( buffer ) {
      var binary = '';
      var bytes = new Uint8Array( buffer );
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
      }
      return window.btoa( binary );
    }
    var transformRequest =function (obj) {
      var str = [];
      for (var p in obj)
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      return str.join("&");
    };


    this.getPdf = function () {
      var q = $q.defer();
      var url = 'https://do.convertapi.com/Web2Pdf';
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (this.status === 200) {
          var type = xhr.getResponseHeader('Content-Type');
          var blob = new Blob([this.response], { type: type });
          q.resolve(_arrayBufferToBase64(this.response));
        } else {
          q.reject(this);
        }
      };
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.send(transformRequest({
        ApiKey: 966567133,
        CUrl: 'http://pompidou-test.rosenan.net/#/bid/60d062ae-de69-4971-9c39-518acb3321c7'
      }));
      return q.promise;
    };
  }

  angular
    .module('myApp')
    .service('gmailClientLowLevel', GmailClientLowLevel);

})();
