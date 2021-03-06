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
  function GmailClientLowLevel($q, $timeout) {
    var isInitialized = $q.defer();

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

    function createDraft(email) {
      // Web-safe base64
      var base64EncodedEmail = encodeUtf8(email).replace(/\//g, '_').replace(/\+/g, '-');
      return promiseTranslator(gapi.client.gmail.users.drafts.create({
        userId: 'me',
        resource: {
          message: {
            raw: base64EncodedEmail
          }
        }
      }));
    }

    function encodeUtf8(toBeEncoded) {
      return btoa(unescape(encodeURIComponent(toBeEncoded)));
    }

    this.doEmail = function (op,params) {
       return isInitialized.promise.then(function () {
        // return sendMessage(emailHeaders + '\r\n' + content);
        var mimeMsg =
          Mime.toMimeTxt({
            "to": params.to,
            "cc": params.cc,
            "subject": params.subject,
            "from": params.from,
            "body": params.text,
            "cids": [],
            "attaches": params.attachments
          });
        if (op === 'send') {
          return sendMessage(mimeMsg);
        } else {
          return createDraft(mimeMsg);
        }
      });
    };

  }

  angular
    .module('myApp')
    .service('gmailClientLowLevel', GmailClientLowLevel);

})();
