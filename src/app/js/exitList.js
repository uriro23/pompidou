'use strict';

/* Controllers */
angular.module('myApp')
  .controller('ExitListCtrl', function (api, $state, $filter, $rootScope,
                                        order, catalog, lov,
                                        measurementUnits, categories, pRoles) {
    this.catalog = catalog;
    this.measurementUnits = measurementUnits;
    this.categories = categories;
    this.pRoles = pRoles.filter(function(role) {
      return role.isInExitList;
    });
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'רשימת יציאה';

    const CATEGORY_SNACKS = 1;
    const CATEGORY_DESSERTS = 8;

    this.currentOrder = order.attributes;
    this.currentQuote = this.currentOrder.quotes[this.currentOrder.activeQuote];

    // fetch customer
    var that = this;
    api.queryCustomers(that.currentOrder.customer)
      .then(function (customers) {
      that.customer = customers[0].attributes;
    });

    // for snacks and desserts include in exit list only items which have sub items in their exit list
    var exitListItems = angular.copy(this.currentQuote.items);
    exitListItems.forEach(function(item) {
      if(item.category.tId === CATEGORY_SNACKS || item.category.tId === CATEGORY_DESSERTS) {
        var exitList = that.catalog.filter(function(cat) {
          return cat.id === item.catalogId;
        })[0].attributes.exitList;
        if (exitList.length === 0) {
          item.isDontPrint = true;
        }
      }
    });

    //filter categories - only those in order
    this.filteredCategories = this.categories.filter(function (cat) {
      var categoryItems = exitListItems.filter(function (item) {
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

      var catItems = exitListItems.filter(function (item) {
        return (item.category.tId === category.tId && !item.isDontPrint);
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
      catItems.forEach(function(item) {
        if (item.isDescChanged && item.isCosmeticChange) {
          item.isDescChanged = false;
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

     // fetch item's exit list
    this.setupItemExitList = function (catId) {
      var thisItem = this.catalog.filter(function (item) {
        return item.id === catId
      })[0];
      this.exitList = thisItem.attributes.exitList;
    }

  });
