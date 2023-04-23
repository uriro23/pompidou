'use strict';

/* Controllers */
angular.module('myApp')
  .controller('SensitivityListCtrl', function (api, $state, $rootScope, $timeout, order, moment,
                                               sensitivities, catalog, customers, colors) {
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'רגישויות';

    this.colors = colors.map(function(color) {
      color.style = {
        'color': color.backColor
      };
      return  color;
    });


    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }

    var currentOrder = order.properties;
    var currentQuote = currentOrder.quotes[currentOrder.activeQuote];
    var that = this;

    this.customer = customers.filter(function(customer) {
      return customer.id === currentOrder.customer;
    })[0];

    // this.eventDate = moment(currentOrder.eventDate);
    this.eventDate = currentOrder.eventDate;


    // distribute menu items according to their sensitivities
    this.sensitivities = sensitivities;
    this.sensitivities.forEach(function(sen) {
      sen.colorObj = that.colors.filter(function(col) {
        return col.tId === sen.color;
      })[0];
      sen.items = [];
    });
    currentQuote.items.forEach(function(item) {
      var catItem = catalog.filter(function(cat) {
        return cat.id === item.catalogId;
      })[0];
      item.externalName = catItem.properties.externalName;
      catItem.properties.sensitivities.forEach(function(sen) {
        var currentSensitivity = that.sensitivities.filter(function(sen2) {
          return sen2.tId === sen.tId;
        })[0];
        var existingItem = currentSensitivity.items.filter(function(item2) {
          return item2.productName === item.productName;
        });
        if (existingItem.length === 0) {
          currentSensitivity.items.push(item);
        }
      });
    });

    $timeout(function() {
      window.print();
    },1000);

  });
