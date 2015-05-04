'use strict';

/* Controllers */
angular.module('myApp')
  .controller('LoginCtrl', function (api, $state, $rootScope) {

    $rootScope.menuStatus = 'hide';
    if (api.getCurrentUser()) {  // if we come here from logout menu, we logout first
      api.userLogout();
      console.log(api.getCurrentUser());
    }

    this.doLogin = function () {
      api.userLogin(this.username, this.password)
        .then(function () {
          $state.go('orderList');
        })
    }
  });
