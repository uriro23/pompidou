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
      return (categoryItems.length > 0) && !cat.isTransportation && !cat.isPriceIncrease;
    });

    this.vec = [];
    var ind = -1;

    this.filteredCategories.forEach(function(category) {
      if (category.measurementUnit) {
        category.measurementUnitLabel = measurementUnits.filter(function(mu) {
          return mu.tId === category.measurementUnit;
        })[0].label;
      }

      ind++;
      that.vec[ind] = {
        ind: ind,
        level: 0,
        data: category
      };

      var catItems = that.currentQuote.items.filter(function (item) {
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
      if (catItems.length) {       // group items by productName, provided productDescription was not changed
        var j=0;
        category.items[j] = catItems[0];
        for (var i=1;i<catItems.length;i++) {
          if (catItems[i].productName===category.items[j].productName &&
            !catItems[i].isDescChanged && !category.items.isDescChanged) {
             category.items[j].quantity += catItems[i].quantity;
          } else {
            category.items[++j] = catItems[i];
          }
        }
      }

      category.items.forEach(function(item) {
        var catItem = that.catalog.filter(function (cat) {
          return cat.id === item.catalogId;
        })[0].attributes;
        // load package measurement unit from catalog
        item.packageMeasurementUnit = measurementUnits.filter(function(mu) {
          return mu.tId === catItem.packageMeasurementUnit;
        })[0];

        ind++;
        that.vec[ind] = {
          ind: ind,
          level: 1,
          data: item
      };

        catItem.exitList.forEach(function(ex) {
          ind++;
          that.vec[ind] = {
            ind: ind,
            level: 2,
            data: ex
          };
        });
      });
    });

    console.log(this.vec);

     // fetch item's exit list
    this.setupItemExitList = function (catId) {
      var thisItem = this.catalog.filter(function (item) {
        return item.id === catId
      })[0];
      this.exitList = thisItem.attributes.exitList;
    }

  });
