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

    });
