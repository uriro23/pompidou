'use strict';

/* Controllers */
angular.module('myApp')
  .controller('PackingListCtrl', function (api, $state, $filter, $rootScope,
                                        order, catalog, lov, config,
                                        measurementUnits, categories, pRoles, colors) {

    this.isOrderColors = config.isOrderColors;
    this.isOrderNumbers = config.isOrderNumbers;
    this.catalog = catalog;
    this.measurementUnits = measurementUnits;
    this.categories = categories;
    this.pRoles = pRoles.filter(function(role) {
      return role.isInExitList;
    });
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'רשימת אריזה';

    var CATEGORY_SNACKS = 1;
    var CATEGORY_SANDWICHES = 35;
    var CATEGORY_DESSERTS = 8;
    var CATEGORY_ACCESSORIES = 50;
    var MU_TRAYS = 4;
    var MU_GLASSES = 17;
    var DEFAULT_SNACKS_FACTOR = 40;

    this.currentOrder = order.properties;
    this.currentQuote = this.currentOrder.quotes[this.currentOrder.activeQuote];



    // fetch customer
    var that = this;
    api.queryCustomers(that.currentOrder.customer)
      .then(function (customers) {
      that.customer = customers[0].properties;
    });

    // fetch order's color
    if (this.currentOrder.color) {
      this.color = colors.filter(function (color) {
        return color.tId === that.currentOrder.color;
      })[0];
    }

    //scan all items for group labels
    this.groups = [];
    this.currentQuote.items.forEach(function(item) {
      var catItem = that.catalog.filter(function (cat) {
        return cat.id === item.catalogId;
      })[0].properties;
       if (catItem.groupLabel) {
        var found = false;
        that.groups.forEach(function(group) {
          if (group.label === catItem.groupLabel) {
            found = true;
            group.quantity += item.quantity;
          }
        });
        if (!found) {
          var group = {
            label: catItem.groupLabel,
            measurementUnit: measurementUnits.filter(function(mu) {
              return mu.tId === catItem.measurementUnit;
            })[0],
            quantity: item.quantity
          };
          that.groups.push(group);
        }
      }
    });

    // scan all items for accessories
    this.accessories = [];
    this.currentQuote.items.forEach(function(item) {
      var catItem = that.catalog.filter(function (cat) {
        return cat.id === item.catalogId;
      })[0].properties;
      catItem.components.forEach(function(comp) {
        if (comp.domain === 3) {
          var shoppingItem = that.catalog.filter(function(cat) {
            return cat.id === comp.id;
          })[0];
          if (shoppingItem.properties.category === CATEGORY_ACCESSORIES) {
            var found = false;
            that.accessories.forEach(function(acc) {
              if (acc.id === shoppingItem.id) {
                found = true;
                acc.quantity += comp.quantity / catItem.productionQuantity * item.quantity;
              }
            });
            if (!found) {
              var acc = {
                id: shoppingItem.id,
                name: shoppingItem.properties.productName,
                measurementUnit: measurementUnits.filter(function(mu) {
                  return mu.tId === shoppingItem.properties.measurementUnit;
                })[0],
                quantity: comp.quantity / catItem.productionQuantity * item.quantity
              };
              that.accessories.push(acc);
            }
          }
        }
      });

    });

    var exitListItems = angular.copy(this.currentQuote.items);

    //filter categories - only those in order and  are food
    this.filteredCategories = this.categories.filter(function (cat) {
      var categoryItems = exitListItems.filter(function (item) {
        return (item.category.tId === cat.tId) &&
               (cat.type < 3 || (cat.type === 5 && item.specialType === 1)); // include food and disposable dishes
      });
      return (categoryItems.length > 0);
    });

    this.vec = [];
    var ind = -1;
    this.totalTrays = 0;
    this.isExceptionalSnacks = false;

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
        return (item.category.tId === category.tId &&
          (category.type < 3 || (category.type === 5 && item.specialType === 1)) );  // include food and disposable dishes

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
      category.totalItem = -1; // totalItem is dummy item to hold computed # of trays
        var j=0;
      if (category.tId === CATEGORY_SNACKS) { // create dummy total item for snacks
        category.items[j] = {
          catalogId: config.snacksTraysItem,
          productName: 'מגשי חטיפים',
          packageQuantity: 0,
          glassPackageQuantity: 0, // really only used for desserts
          isTotalItem: true
        };
        category.totalItem = j++;
      }
      if (category.tId === CATEGORY_SANDWICHES) { // create dummy total item for sandwiches
        category.items[j] = {
          catalogId: config.sandwichesTraysItem,
          productName: 'מגשי כריכונים',
          packageQuantity: 0,
          glassPackageQuantity: 0, // really only used for desserts
          isTotalItem: true
        };
        category.totalItem = j++;
      }
      if (category.tId === CATEGORY_DESSERTS) { // create dummy total item for desserts
          category.items[j] = {
            catalogId: config.dessertsTraysItem,
            productName: 'מגשי פטיפורים',
            packageQuantity: 0,
            glassPackageQuantity: 0,
            isTotalItem: true
          };
        category.totalItem = j++;
        }
      if (catItems.length) {       // group items by productName, provided productDescription was not changed
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
         console.log('examining '+item.productName+ ', category '+category.tId);
        var catItem = that.catalog.filter(function (cat) {
          return cat.id === item.catalogId;
        })[0].properties;

       // load prodMeasurementUnit from catalog and compute prodQuantity
        item.prodMeasurementUnit = measurementUnits.filter(function(mu) {
          return mu.tId === catItem.prodMeasurementUnit;
        })[0];
        item.prodQuantity = item.quantity * catItem.muFactor;

        // load package measurement unit from catalog
        item.packageMeasurementUnit = measurementUnits.filter(function(mu) {
          return mu.tId === catItem.packageMeasurementUnit;
        })[0];

        item.packageFactor = catItem.packageFactor;

          if (item.isTotalItem) { // skip the item used to accumulate category total packages
         } else if (category.totalItem > -1 && item.packageMeasurementUnit.tId === MU_TRAYS) { // accumulate this item
           if (item.measurementUnit.tId === MU_GLASSES) { // accumulate glasses separately
             category.items[category.totalItem].glassPackageQuantity += (item.quantity / item.packageFactor);
             console.log('adding '+item.productName+' to glasses, category '+category.tId+' giving '+
               category.items[category.totalItem].glassPackageQuantity);
           } else {
             category.items[category.totalItem].packageQuantity += (item.quantity / item.packageFactor);
             console.log('adding '+item.productName+' to category '+category.tId+' giving '+
                            category.items[category.totalItem].packageQuantity);
             if (category.tId === CATEGORY_SNACKS && item.packageFactor !== DEFAULT_SNACKS_FACTOR) {
               category.items[category.totalItem].isExceptionalSnacks = true;
             }
           }
         } else { // no accumulation - compute package quantity for each item separately
           item.packageQuantity = Math.ceil(item.quantity / item.packageFactor);
           if (item.packageMeasurementUnit.tId === MU_TRAYS) {
             that.totalTrays += item.packageQuantity;
           }
         }
        if (item.packageMeasurementUnit.tId === item.prodMeasurementUnit.tId && item.packageFactor === 1) {
          item.displayName = item.productName; // because package quantity will be listed anyway
        } else {
          item.displayName = item.prodQuantity.toString() + ' ' + item.prodMeasurementUnit.label + ' ' + item.productName;
        }
        // add "main part" to name, if exitList is non empty
        if (catItem.exitList.length) {
          item.displayName += ' (החלק העיקרי)'
        }

         // skip accumulated items and items w/o package MU
        if ((category.totalItem > -1 && item.packageMeasurementUnit.tId === MU_TRAYS && !item.isTotalItem) ||
          item.packageMeasurementUnit.tId === 0) {
          item.isSkip = true;
        } else {
          ind++;
          that.vec[ind] = {
            ind: ind,
            level: 1,
            data: item
          };
        }

        // add exit list items
        catItem.exitList.forEach(function(ex) {
          ex.parentName = item.productName;
          if (item.isSkip) {
            ex.parentQuantity = item.prodQuantity;
            ex.parentMeasurementUnit = item.prodMeasurementUnit;
          }
          ex.isShowParentQuantity = item.isSkip;
          ex.quantity = Math.ceil(item.quantity / ex.factor);
          ind++;
          that.vec[ind] = {
            ind: ind,
            level: 2,
            data: ex
          };
        });
   });
      if (category.totalItem > -1) { // if accumulated packages - round up
        category.items[category.totalItem].packageQuantity =
          Math.ceil(category.items[category.totalItem].packageQuantity) +
          Math.ceil(category.items[category.totalItem].glassPackageQuantity);
        that.totalTrays += category.items[category.totalItem].packageQuantity; // all accumulated packages are trays
        if (category.items[category.totalItem].isExceptionalSnacks) {
          that.isExceptionalSnacks = true;
        }
      }
    });

     // fetch item's exit list
    this.setupItemExitList = function (catId) {
      var thisItem = this.catalog.filter(function (item) {
        return item.id === catId
      })[0];
      this.exitList = thisItem.properties.exitList;
    };

  });
