'use strict';

/* Controllers */
angular.module('myApp')
  .controller('ExitListCtrl', function (api, $state, $filter, $rootScope,
                                        order, catalog, lov, measurementUnits, categories) {
    this.catalog = catalog;
    this.measurementUnits = measurementUnits;
    this.categories = categories;
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'רשימת יציאה';

    this.currentOrder = order.attributes;
    this.currentQuote = this.currentOrder.quotes[this.currentOrder.activeQuote];

    // fetch customer
    var that = this;
    api.queryCustomers(that.currentOrder.customer)
      .then(function (customers) {
      that.customer = customers[0].attributes;
    });

    //filter categories - only those in order
    this.filteredCategories = this.categories.filter(function (cat) {
      var categoryItems = that.currentQuote.items.filter(function (item) {
        return (item.category.tId === cat.tId);
      });
      return categoryItems.length;
    });


    // filter items for current category
    this.setupCategoryItems = function (catId) {
      this.categoryItems = that.currentQuote.items.filter(function (item) {
        return (item.category.tId === catId);
      })
    };

    // fetch item's exit list
    this.setupItemExitList = function (catId) {
      var thisItem = this.catalog.filter(function (item) {
        return item.id === catId
      })[0];
      this.exitList = thisItem.attributes.exitList;
    }

  });
