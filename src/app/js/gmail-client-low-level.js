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
            "attaches" : [{
              type: 'application/pdf',
              name: 'uriburi.pdf',
              base64: pdfEncoded
            }]
          }));
        });
      });
    };

    this.getPdf = function () {

      return $http({
        method: 'POST',
        url: 'https://do.convertapi.com/Web2Pdf',
        headers: {'Content-Type': 'application/x-www-form-urlencoded',
          responseType: 'arraybuffer'},
        transformRequest: function(obj) {
          var str = [];
          for(var p in obj)
            str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
          return str.join("&");
        },
        data: {
          ApiKey: 966567133,
          //CUrl: 'http://pompidou-test.rosenan.net/#/bid/60d062ae-de69-4971-9c39-518acb3321c7'
          CUrl: 'http://www.whatismyip.net/'
        }
      })
        .then(function (response){

           return Base64.encode(response.data, true);
        //return btoa(unescape(encodeURIComponent(response.data)));
        //var p = $q.defer();
        ////var blob = new Blob([response.data], {type: 'application/pdf'});
        //var blob = new Blob(["this is my file"], {type: 'application/pdf'});
        //var a = new FileReader();
        //a.onload = function(e) {
        //  // Capture result here
        //  p.resolve("this is another file");
        //  console.log(e.target.result);
        //};
        //a.readAsArrayBuffer(blob);
        //return p.promise;
        ////return Base64.encode(response.data, true);
      }, function() {console.error('BAHHH')});
    }

  }

  angular
    .module('myApp')
    .service('gmailClientLowLevel', GmailClientLowLevel);

})();
