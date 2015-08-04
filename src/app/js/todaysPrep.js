'use strict';

/* Controllers */
angular.module('myApp')
  .controller('TodaysPrepCtrl', function (api, $state, $filter, $modal, $q, $rootScope,
                                         lov, catalog, allCategories, measurementUnits, today,
                                         workOrder) {
    this.todaysPreps = workOrder.filter(function (wi) {
        return wi.domain===2 && wi.isForToday;
    });
    for (var i=0;i<this.todaysPreps.length;i++) {
      var currentPrep = this.todaysPreps[i];
      currentPrep.menuItems = [];
      for (var j=0;j<currentPrep.backTrace.length;j++) {
        var currentBackTrace = currentPrep.backTrace[j];
        var currentMenuItem = {};
        currentMenuItem.id = currentBackTrace.id;
        currentMenuItem.quantity = currentBackTrace.quantity;
        var originalMenuItem = workOrder.filter(function (wo) {
          return wo.id === currentBackTrace.id;
        })[0];
        currentMenuItem.productDescription = originalMenuItem.productDescription;
        currentMenuItem.orders = [];
        for (var k=0;k<originalMenuItem.backTrace.length;k++) {
          var order = {quantity:originalMenuItem.backTrace[k].quantity};
          currentMenuItem.orders.push(order);
        }
        currentPrep.menuItems.push(currentMenuItem);
      }
    }
  });
