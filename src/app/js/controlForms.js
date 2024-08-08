'use strict';

/* Controllers */
angular.module('myApp')
    .controller('CombinedFormCtrl', function ($rootScope, $state, $timeout, order, catalog) {

      // includes finalCheckForm && samplingForm

      $rootScope.menuStatus = 'hide';
      if ($state.current.name === 'finalCheckForm') {
        $rootScope.title = 'טופס בחינה סופית';
        this.formType = 1;
      } else if ($state.current.name === 'samplingForm') {
        $rootScope.title = 'טופס דגימות';
        this.formType = 2;
      } else {
        $rootScope.title = 'טופס משולב';
        this.formType = 3;
      }

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

      $timeout(function() {
        window.print();
      },1000);

    })
    .controller('BlastChillerFormCtrl', function ($rootScope, $timeout, dater,
                                                  workOrder, catalog) {

      $rootScope.menuStatus = 'hide';
      $rootScope.title = "טופס בלאסט צ'ילר";

      var that = this;
      this.today = dater.today();

      var LPP = 13;
      var MIN_EMPTY = 5;  // minium empty lines at the end of each category

      this.categories = [];
      workOrder.forEach(function(woItem) {
        if (woItem.properties.domain === 4 && woItem.properties.quantityForToday > 0) {
          var catalogEntry = catalog.filter(function(cat) {
            return cat.id === woItem.properties.catalogId;
          })[0];
          if (catalogEntry.properties.isBlastChiller) {
            var currCategory = that.categories.filter(function (cat) {
              return cat.tId === woItem.properties.category.tId;
            })[0];
            if (!currCategory) { // new category
              that.categories.push(woItem.properties.category);
              currCategory = that.categories[that.categories.length-1];
              currCategory.items = [];
            }
            currCategory.items.push({
              id: woItem.id,
              name: catalogEntry.properties.externalName
            });
          }
        }
        });

      this.categories.forEach(function (category) {
        category.items.sort(function (a,b) {
          if (a.name > b.name) {
            return 1;
          } else {
            return -1;
          }
        });

        category.pages = [];
        var pageInd = 0;
        var lineInd = 0;
        category.pages.push({
          items: [],
          emptyLines: []
        });
        category.items.forEach(function (item) {
          category.pages[pageInd].items.push(item);
          lineInd++;
          if (lineInd >= LPP) {
            category.pages.push({
              items: [],
              emptyLines: []
            });
            pageInd++;
            lineInd = 0;
          }
        });
        // add empty lines to fill last page
        var emptyLineCnt = LPP-lineInd;
        for (lineInd=lineInd;lineInd<LPP;lineInd++) {
          category.pages[pageInd].emptyLines.push({
            seq: lineInd
          });
        }
        if (emptyLineCnt < MIN_EMPTY) { // add page with all lines empty
          category.pages.push({
            items: [],
            emptyLines: []
          });
          pageInd++;
          for (lineInd=0;lineInd<LPP;lineInd++) {
            category.pages[pageInd].emptyLines.push({
              seq: lineInd
            });
          }
        }
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
