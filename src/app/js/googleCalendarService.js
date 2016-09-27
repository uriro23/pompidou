/* global gapi */
'use strict';

(function () {
  var googleProperties = {
    //jscs:disable
    /* jshint ignore:start */
    cookiepolicy: 'single_host_origin',
    scope: 'https://www.googleapis.com/auth/calendar.readonly',
    'response_type': 'token',
    'approval_prompt': 'auto',
    'client_id': '271889187736-a62cs7ra9rdf5u2tnrbbor9p0s2ltttl.apps.googleusercontent.com'
    //jscs:enable
    /* jshint ignore:end */
  };

  /* @ngInject */
  function GoogleCalendarService($q, $timeout) {
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
      promiseTranslator(gapi.client.load('calendar', 'v3')).then(function () {
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

    function getEvents(from, to) {
      return promiseTranslator(gapi.client.calendar.events.list({
        'calendarId': 'primary',
        'timeMin': from.toISOString(),
        'timeMax': to.toISOString(),
        'showDeleted': false,
        'singleEvents': true,
        'orderBy': 'startTime'
      }));

    }

    this.getGoogleEvents = function(from, to) {
      return isInitialized.promise.then(function () {
        return getEvents(from, to);
      });
    }

  }

  angular
    .module('myApp')
    .service('googleCalendarService', GoogleCalendarService);

})();
