'use strict';

/* Controllers */
angular.module('myApp')
  .controller('BidCtrl', function(api, $state, $filter,
                                    currentOrder, utils, lov) {
    this.order = currentOrder;
  });
