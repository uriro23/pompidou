'use strict';

/* Controllers */
angular.module('myApp')
  .controller('SnacksAndDessertsCtrl', function (api, $state, $rootScope,
                                          catalog, categories, measurementUnits,
                                          workOrder) {
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'חטיפים וקינוחים';

    var CATEGORY_SNACKS = 1;
    var CATEGORY_DESSERTS = 8;

    function editItems (order, category, catalog) {
      return order.order.quotes[order.order.activeQuote].items.filter(function(item) {
        return item.category.tId === category;
      }).map(function(item) {
        var catalogItem = catalog.filter(function(cat) {
          return cat.id===item.catalogId;
        })[0].attributes;
        return {
          productName: catalogItem.productName,
          productDescription: item.productDescription,
          isDescChanged: item.isDescChanged & (!item.isCosmeticChange),
          quantity: item.quantity,
          measurementUnitLabel: item.measurementUnit.label
        }
      })
    }

    this.woOrders = workOrder.filter(function(wo) { // create array of all orders in wo
      return wo.domain===0;
    }).sort(function(a,b) {
      if (a.order.eventDate < b.order.eventDate) {
        return 1
      } else return -1
    });

    this.woOrders.forEach(function(order) {
      order.snacks = editItems(order,CATEGORY_SNACKS,catalog);
      order.desserts = editItems(order,CATEGORY_DESSERTS,catalog);
    });


  });
