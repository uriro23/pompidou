'use strict';

/* Controllers */
angular.module('myApp')
  .controller('WarantyCtrl', function (api, $state, $rootScope, order, moment, customers) {
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'אחריות';

     var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }

    var currentOrder = order.attributes;
    var currentQuote = currentOrder.quotes[currentOrder.activeQuote];
    var that = this;

    this.customer = customers.filter(function(customer) {
      return customer.id === currentOrder.customer;
    })[0];

    this.eventDate = moment(currentOrder.eventDate);
  });
