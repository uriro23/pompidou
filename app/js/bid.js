'use strict';

/* Controllers */
angular.module('myApp')
  .controller('BidCtrl', function(api, $state, $filter, $rootScope, bid) {
    console.log(bid);
    this.bid = bid;
    $rootScope.hideMenu = true;
    var currentOrder = this.bid.attributes.order;

    // fetch customer
    var that = this;
    api.queryCustomerById(currentOrder.customer)
      .then (function (customers) {
        that.customer = customers[0].attributes;
    })

    //fetch start bid text type
    if (currentOrder.startBidTextType) {
      api.queryBidTextTypeById(currentOrder.startBidTextType)
        .then (function (bidTexts) {
        that.startBidTextType = bidTexts[0].attributes;
      })
    }

    // fetch end bid text type
    if (currentOrder.endBidTextType) {
      api.queryBidTextTypeById(currentOrder.endBidTextType)
        .then (function (bidTexts) {
        that.endBidTextType = bidTexts[0].attributes;
      })
    }
  });
