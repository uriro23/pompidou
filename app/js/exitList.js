'use strict';

/* Controllers */
angular.module('myApp')
  .controller('ExitListCtrl', function(api, $state, $filter, $rootScope,
                                       order, catalog, lov, measurementUnits, categories) {
    this.order = order;
    this.catalog = catalog;
    this.measurementUnits = measurementUnits;
    this.categories = categories;
    $rootScope.hideMenu = true;
    $rootScope.title = lov.company + ' - רשימת יציאה';

    // fetch customer
    var that = this;
    api.queryCustomers(order.attributes.customer)
      .then (function (customers) {
      that.customer = customers[0].attributes;
    });

    //filter categories - only those in order
    this.filteredCategories = this.categories.filter(function(cat) {
      var categoryItems = that.order.attributes.items.filter(function(item) {
        return (item.category.tId === cat.tId);
      });
      return categoryItems.length;
    });


    // filter items for current category
    this.setupCategoryItems = function(catId) {
      this.categoryItems = that.order.attributes.items.filter(function(item) {
        return (item.category.tId===catId);
      })
    };

    // fetch item's exit list
    this.setupItemExitList = function(catId) {
      var thisItem = this.catalog.filter(function(item) {
        return item.id === catId
      })[0];
      this.exitList = thisItem.attributes.exitList;
    }

  });
