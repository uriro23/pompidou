'use strict';

/* Controllers */
angular.module('myApp')
    .controller('SamplingFormCtrl', function ($rootScope, $timeout, order, catalog) {

      $rootScope.menuStatus = 'hide';
      $rootScope.title = 'טופס דגימות';

      var that = this;

      this.currentOrder = order.properties;
      this.currentQuote = this.currentOrder.quotes[this.currentOrder.activeQuote];

      this.samples = this.currentQuote.items.filter(function(item) {
        var catalogItem = catalog.filter(function(cat) {
          return cat.id === item.catalogId;
        }).map(function(cat){
          return {
            isSensitiveDish: cat.properties.isSensitiveDish,
            stickerLabel: cat.properties.stickerLabel
          };
        })[0];
        item.stickerLabel = catalogItem.stickerLabel;
        return catalogItem.isSensitiveDish;
      });
      console.log(this.samples);

      $timeout(function() {
        window.print();
      },1000);

    })

    .controller('FinalCheckFormCtrl', function ($rootScope, $timeout, order, catalog) {

      $rootScope.menuStatus = 'hide';
      $rootScope.title = 'טופס בחינה סופית';

      var that = this;

      this.order = order;
      this.currentOrder = order.properties;
      this.currentQuote = this.currentOrder.quotes[this.currentOrder.activeQuote];
      if (this.currentOrder.eventTime) {
        this.order.packingTime = angular.copy(this.currentOrder.exitTime);
        this.order.packingTime.setHours(this.order.packingTime.getHours() - 1);
        this.order.expiryTime = angular.copy(this.currentOrder.eventDate);
        this.order.expiryTime.setHours(this.currentOrder.eventTime.getHours() + 12);
        this.order.expiryTime.setMinutes(this.currentOrder.eventTime.getMinutes());
      }
      this.dishes = this.currentQuote.items.filter(function(item) {
        var catalogItem = catalog.filter(function(cat) {
          return cat.id === item.catalogId;
        }).map(function(cat){
          return {
            stickerLabel: cat.properties.stickerLabel
          };
        })[0];
        item.stickerLabel = catalogItem.stickerLabel;
        return item.category.type < 3;
      });

      $timeout(function() {
        window.print();
      },1000);

    })
.controller('LogFormCtrl', function ($rootScope, $timeout, dater, workOrder, catalog) {

  $rootScope.menuStatus = 'hide';
  $rootScope.title = 'טופס יומן עבודה';

  var that = this;
  this.today = dater.today();

  that.logs = [];
  workOrder.forEach(function(woItem) {
    if (woItem.properties.domain === 3 && woItem.properties.quantityForToday > 0) {
      var log = {
        category: woItem.properties.category.label,
        categoryOrder: woItem.properties.category.order,
        productName: woItem.properties.productName,
        supplier: catalog.filter(function(cat) {
          return cat.id === woItem.properties.catalogId;
        })[0].properties.supplier,
        quantity: woItem.properties.quantityForToday,
        measurementUnit: woItem.properties.measurementUnit,
        dishIds: [],
        dishes:''
      };
      woItem.properties.backTrace.forEach(function(bt1) {
        if (bt1.domain === 2) { // handle only products under preps
          var prep = workOrder.filter(function(wo2) {
            return wo2.id === bt1.id;
          })[0];
          prep.properties.backTrace.forEach(function (bt2) {
            if (bt2.domain === 1) { // shd always be
              var dishCatalogId = workOrder.filter(function (wo1) {
                return wo1.id === bt2.id;
              })[0].properties.catalogId;
              var temp = log.dishIds.filter(function (dish) {
                return dish === dishCatalogId;
              });
              if (!temp.length) {
                log.dishIds.push(dishCatalogId);
                var dishName = catalog.filter(function (cat) {
                  return cat.id === dishCatalogId;
                })[0].properties.stickerLabel;
                if (log.dishes === '') {
                  log.dishes = dishName;
                } else {
                  log.dishes += (', ' + dishName);
                }
              }
            }
          });
        }
      });
      that.logs.push(log);
    }
  });

  this.logs.sort(function(a,b) {
    if (a.categoryOrder > b.categoryOrder) {
      return 1;
    } else if (a.categoryOrder < b.categoryOrder) {
      return -1;
    } else if (a.productName > b.productName) {
      return 1;
    } else {
      return -1;
    }
  });

  $timeout(function() {
    window.print();
  },1000);
});
