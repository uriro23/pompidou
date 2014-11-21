'use strict';

/* Controllers */
angular.module('myApp')
  .controller('BidCtrl', function(api, $state, $filter, $rootScope,
                                    bid, utils, lov) {
    console.log(bid);
    this.bid = bid;
    //$rootScope.hideMenu = true;

  });
