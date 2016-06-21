'use strict';

/* Controllers */
angular.module('myApp')
  .controller('LoginCtrl', function (api, $state, $rootScope) {

    $rootScope.menuStatus = 'hide';
    if (api.getCurrentUser()) {  // if we come here from logout menu, we logout first
      api.userLogout();
     }

    this.doLogin = function () {
      api.userLogin(this.username, this.password)
        .then(function () {
          $state.go('orderList');
        })
    }
  })

  .controller('DefaultCtrl', function ($rootScope,badUrl) {

    $rootScope.menuStatus = 'hide';

    this.badUrl = badUrl;

  });
