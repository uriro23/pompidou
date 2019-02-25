'use strict';

/* Controllers */
angular.module('myApp')
  .controller('LoginCtrl', function (api, $state, $rootScope) {

    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'login';
    if (api.getCurrentUser()) {  // if we come here from logout menu, we logout first
      api.userLogout();
     }

    this.doLogin = function () {
      api.userLogin(this.username, this.password)
        .then(function () {
          $state.go('orderList',{'queryType':'sales'});
        })
    }
  })

  .controller('DefaultCtrl', function ($rootScope,badUrl) {

    $rootScope.menuStatus = 'hide';
    $rootScope.title =  'תקלה';

    this.badUrl = badUrl;

  });
