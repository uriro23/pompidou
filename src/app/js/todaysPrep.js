'use strict';

/* Controllers */
angular.module('myApp')
  .controller('TodaysPrepCtrl', function (api, $state, $filter, $modal, $q, $rootScope,
                                         lov, catalog, allCategories, measurementUnits, today,
                                         workOrder) {

    this.allOrders = workOrder.filter(function(wo) { // create array of all orders in wo
      return wo.domain===0;
    });
    this.allOrders.sort(function(a,b) {
      if (a.order.eventDate < b.order.eventDate) {
        return 1
      } else return -1
    });


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
        currentMenuItem.orders[this.allOrders.length-1] = {} // set array size to max for view
        var m;
        for (var k=0;k<originalMenuItem.backTrace.length;k++) {
         var temp = this.allOrders.filter(function(ord, ind) {
            if (ord.id===originalMenuItem.backTrace[k].id) {
              m = ind;
            }
          });
           currentMenuItem.orders[m] = {quantity: originalMenuItem.backTrace[k].quantity};
          }
        currentPrep.menuItems.push(currentMenuItem);
      }
    }

    this.dayName = function(dat) {
      var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
      return dayNames[dat.getDay()]+"'";
    }
  });

