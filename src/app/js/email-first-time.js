'use strict';

(function () {

  /* @ngInject */
  function emailFirstTimeExperience(gmailClientLowLevel) {
    return {
      template: '<div ng-if="authorized"><div ng-transclude></div></div>' +
      '<button class="connect" ng-if="!authorized" ng-click="onConnect()">Connect with your Google Account</button>',
      restrict: 'E',
      transclude: true,
      link: function postLink(scope) {
        scope.authorized = false;
        function authCallback(isAuthorized) {
          if (isAuthorized) {
            scope.authorized = true;
          }
        }

        scope.onConnect = function () {
          gmailClientLowLevel.authorize().then(authCallback);
        };
        gmailClientLowLevel.authenticateIfAuthorized().then(authCallback);
      }
    };
  }

  angular
    .module('myApp')
    .directive('emailFirstTimeExperience', emailFirstTimeExperience);

})();
