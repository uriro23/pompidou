'use strict';

/* Controllers */
angular.module('myApp')
  .controller('TodaysPrepCtrl', function (api, $state, $filter, $modal, $q, $rootScope,
                                         lov, catalog, allCategories, measurementUnits, dater,
                                         workOrder) {

    var that = this;

    this.allOrders = workOrder.filter(function(wo) { // create array of all orders in wo
      return wo.domain===0;
    });
    this.allOrders.sort(function(a,b) {
      if (a.order.eventDate < b.order.eventDate) {
        return 1
      } else return -1
    });

    this.dailyDate = dater.today();

    this.todaysPreps = workOrder.filter(function (wi) {
        return wi.domain===2 && wi.isForToday;
    });
    this.todaysPreps.forEach(function(currentPrep) {
      currentPrep.menuItems = [];
      currentPrep.backTrace.forEach(function(currentBackTrace) {
        var currentMenuItem = {};
        currentMenuItem.id = currentBackTrace.id;
        currentMenuItem.quantity = currentBackTrace.quantity;
        var originalMenuItem = workOrder.filter(function (wo) {
          return wo.id === currentBackTrace.id;
        })[0];
        currentMenuItem.productName = originalMenuItem.productName;
        currentMenuItem.orders = [];  // initialize orders array: set seq to unique values for ng-repeat
        for (var n=0;n<that.allOrders.length;n++) {
          currentMenuItem.orders[n] = {seq:n, quantity:0};
        }
        var totalQuantity = 0;
        originalMenuItem.backTrace.forEach(function(ord) {
          totalQuantity += ord.quantity;
        });
        var m;
        originalMenuItem.backTrace.forEach(function(currentOrder) {
         var temp = that.allOrders.filter(function(ord, ind) {
            if (ord.id===currentOrder.id) {
              m = ind;
            }
          });
           currentMenuItem.orders[m].quantity += currentBackTrace.quantity * currentOrder.quantity / totalQuantity;
          });
        currentPrep.menuItems.push(currentMenuItem);
      });
  });

this.dayName = function(dat) {
      var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
      return dayNames[dat.getDay()]+"'";
    }
  });

