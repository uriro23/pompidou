'use strict';

/* Controllers */
angular.module('myApp')
  .controller('SensitivityListCtrl', function (api, $state, $rootScope, order, moment,
                                               sensitivities, catalog, customers) {
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


    // distribute menu items according to their sensitivities
    this.sensitivities = sensitivities;
    this.sensitivities.forEach(function(sen) {
      sen.items = [];
    });
    currentQuote.items.forEach(function(item) {
      var catItem = catalog.filter(function(cat) {
        return cat.id === item.catalogId;
      })[0];
      catItem.attributes.sensitivities.forEach(function(sen) {
        var currentSensitivity = that.sensitivities.filter(function(sen2) {
          return sen2.tId === sen.tId;
        })[0];
        currentSensitivity.items.push(item);
      });
    });




  });
