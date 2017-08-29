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

    this.filteredCategories.forEach(function(category) {
      var tmp = that.currentQuote.items.filter(function (item) {
        return (item.category.tId === category.tId);
      }).sort(function(a,b) {
        if (a.productName > b.productName) {
          return 1;
        } else if (a.productName < b.productName) {
          return -1;
        } else if (a.isDescChanged && !b.isDescChanged) {
          return 1;
        } else if (!a.isDescChanged && b.isDescChanged) {
          return -1;
        } else {
          return 0;
        }
      });
      category.items = [];
      if (tmp.length) {       // group items by productName, provided productDescription was not changed
        var j=0;
        category.items[j] = tmp[0];
        for (var i=1;i<tmp.length;i++) {
          if (tmp[i].productName===category.items[j].productName &&
            !tmp[i].isDescChanged && !category.items.isDescChanged) {
             category.items[j].quantity += tmp[i].quantity;
          } else {
            category.items[++j] = tmp[i];
          }
        }
      }
    });

    // filter items for current category
    this.setupCategoryItems = function (catId) {
     };

    // fetch item's exit list
    this.setupItemExitList = function (catId) {
      var thisItem = this.catalog.filter(function (item) {
        return item.id === catId
      })[0];
      this.exitList = thisItem.attributes.exitList;
    }

  });
