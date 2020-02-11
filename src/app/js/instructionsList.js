'use strict';

/* Controllers */
angular.module('myApp')
  .controller('InstructionsListCtrl', function (api, $state, $rootScope, order, moment, catalog, customers) {
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'רגישויות';


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


    this.instructions = [];
   currentQuote.items.forEach(function(item) {
      var catItem = catalog.filter(function(cat) {
        return cat.id === item.catalogId;
      })[0];
      if (catItem.attributes.instructions) {
        that.instructions.push({
          title: catItem.attributes.shortDescription,
          text: catItem.attributes.instructions
        })
      }
   });




  });
