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
  this.order.packingTime = angular.copy(this.currentOrder.exitTime);
  this.order.packingTime.setHours(this.order.packingTime.getHours()-1);
  this.order.expiryTime = angular.copy(this.currentOrder.eventDate);
  this.order.expiryTime.setHours(this.currentOrder.eventTime.getHours()+12);
  this.order.expiryTime.setMinutes(this.currentOrder.eventTime.getMinutes());
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

});
