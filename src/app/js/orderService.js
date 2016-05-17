'use strict';

angular.module('myApp')

  .service('orderService', function () {

    // used to update the header object in order. This is a flattening mechanism, so when retrieving lists of orders
    // it will not be necessary to load all the quotes objects, just the total etc. from the active quote, and the last
    // activity. it should be called before all save operations on Order

    this.setupOrderHeader = function (order) {
      var currentQuote = order.quotes[order.activeQuote];
      order.header = {
        'total': currentQuote.total,
        'balance': currentQuote.balance,
        'transportationInclVat': currentQuote.transportationInclVat,
        'discountRate': currentQuote.discountRate,
        'activityDate': order.activities.length?order.activities[0].date:undefined,
        'activityText': order.activities.length?order.activities[0].text:undefined
      }
    };


  })
