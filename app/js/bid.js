'use strict';

/* Controllers */
angular.module('myApp')
  .controller('BidCtrl', function(api, $state, $filter, $rootScope,
                                    currentOrder, utils, lov) {
    this.order = currentOrder;
    //$rootScope.hideMenu = true;

  });
