'use strict';

/* Controllers */
angular.module('myApp')
  .controller('ServiceListCtrl', function (api, $state, $filter, $rootScope, $timeout,
                                        order, catalog, lov, config, workOrder, customers,
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
    $rootScope.title = 'רשימת סרוויס';

    var that = this;

    var CATEGORY_SNACKS = 1;
    var CATEGORY_SANDWICHES = 35;
    var CATEGORY_DESSERTS = 8;
    var CATEGORY_ACCESSORIES = 50;

    // for serviceList request from order we create a fictitious workorder with just that order
    if ($state.current.name === 'orderServiceList') {
      this.workOrder = [
        {
          id: 'foo',
          domain: 0,
          order: order.properties,
          customer: customers.filter(function (cust) {
            return cust.id === order.properties.customer;
          })[0].properties
        }
      ]
    } else { // 'woServiceList'
      this.workOrder = workOrder.filter(function (wo) {
        return wo.domain === 0;
      });
      this.workOrder.forEach(function (wo) {
        wo.customer = customers.filter(function (cust) {
          return cust.id === wo.order.customer;
        })[0].properties;
      })
    }

    this.workOrder.forEach(function (wo) {
      var currentOrder = wo.order;
      var currentQuote = currentOrder.quotes[currentOrder.activeQuote];

      // edit eventTimeRange
      var et = currentOrder.eventTime;
      if (et) {
        wo.eventTimeStr = et.getHours() + ':' + (et.getMinutes() ? et.getMinutes() : '00');
        if (currentOrder.eventTimeRange) {
          var rangeObj = lov.eventTimeRanges.filter(function (r) {
            return r.id === currentOrder.eventTimeRange;
          })[0];
          var beginTime = angular.copy(et);
          beginTime.setMinutes(et.getMinutes() - rangeObj.value);
          wo.eventTimeStr = et.getHours() + ':' +
            (et.getMinutes() ? et.getMinutes() : '00') + ' - ' +
            beginTime.getHours() + ':' +
            (beginTime.getMinutes() ? beginTime.getMinutes() : '00');
        }
      }

      // fetch order's color
      if (currentOrder.color) {
        wo.color = colors.filter(function (color) {
          return color.tId === currentOrder.color;
        })[0];
      }

      //scan all items for group labels
      wo.groups = [];
      currentQuote.items.forEach(function(item) {
        var catItem = that.catalog.filter(function (cat) {
          return cat.id === item.catalogId;
        })[0].properties;
         if (catItem.groupLabel) {
          var found = false;
          wo.groups.forEach(function(group) {
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
            wo.groups.push(group);
          }
        }
      });

      // scan all items for accessories
      wo.accessories = [];
      currentQuote.items.forEach(function(item) {
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
              wo.accessories.forEach(function(acc) {
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
                wo.accessories.push(acc);
              }
            }
          }
        });

      });

      // for snacks and desserts include in exit list only items which have sub items in their exit list
      var listItems = angular.copy(currentQuote.items);
      listItems.forEach(function(item) {
        if(item.category.tId === CATEGORY_SNACKS ||
           item.category.tId === CATEGORY_SANDWICHES||
           item.category.tId === CATEGORY_DESSERTS) {
          item.isExcludeWholeItem = true; // don't list snacks sandwiches and desserts in main list
            }
      });

      //filter categories - only those in order and  are food
      that.filteredCategories = that.categories.filter(function (cat) {
        var categoryItems = listItems.filter(function (item) {
          return (item.category.tId === cat.tId) && cat.type < 3;
        });
        return (categoryItems.length > 0);
      });

      wo.vec = [];
      var ind = -1;

      that.filteredCategories.forEach(function(category) {
        if (category.measurementUnit) {
          category.measurementUnitLabel = measurementUnits.filter(function(mu) {
            return mu.tId === category.measurementUnit;
          })[0].label;
        }

        if (category.tId !== CATEGORY_SNACKS &&
            category.tId !== CATEGORY_SANDWICHES &&
            category.tId !== CATEGORY_DESSERTS) {
          ind++;
          wo.vec[ind] = {
            ind: ind,
            level: 0,
            data: category
          };
        };

        var catItems = listItems.filter(function (item) {
          return (item.category.tId === category.tId && category.type < 3  && !item.isExcludeWholeItem);
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
          })[0].properties;
          // convert basic measurement unit to prod measurement unit, if needed
          if (catItem.prodMeasurementUnit !== catItem.measurementUnit) {
            item.measurementUnit = measurementUnits.filter(function(mu) {
              return mu.tId === catItem.prodMeasurementUnit;
            })[0];
            item.quantity = item.quantity * catItem.muFactor;
          }
          // load package measurement unit from catalog
          item.packageMeasurementUnit = measurementUnits.filter(function(mu) {
            return mu.tId === catItem.packageMeasurementUnit;
          })[0];
          if (item.isKitchenRemark && item.kitchenRemark) {
            item.productDescription = item.kitchenRemark;
          }

          ind++;
          wo.vec[ind] = {
            ind: ind,
            level: 1,
            data: item
        };
       });
      });



      function editItems (order, category, catalog, categories) {
        var categoryObject = categories.filter(function(c) {
          return c.tId === category;
        })[0];
        var categoryItems = order.quotes[order.activeQuote].items.filter(function(item) {
          return item.category.tId === category;
        }).map(function(item) {
          var catalogItem = catalog.filter(function(cat) {
            return cat.id===item.catalogId;
          })[0].properties;
          return {
            index: item.index,
            productName: catalogItem.productName,
            productDescription: (item.isKitchenRemark && item.kitchenRemark) ?
              item.kitchenRemark : item.productDescription,
            isDescChanged: item.isDescChanged & (!item.isCosmeticChange),
            quantity: item.quantity,
            measurementUnitLabel: item.measurementUnit.label
          }
        }).sort(function(a,b) {
          if (a.productName < b.productName) {
            return -1;
          } else if (a.productName > b.productName) {
            return 1;
          } else if (a.isDescChanged) {
            return 1;
          } else if (b.isDescChanged) {
            return -1;
          } else {
            return 0;
          }
        });
        // now unite items with same catalog name and without major description change
        var condensedItems = [];
        var j = 0;
        if (categoryItems.length > 0) {
          condensedItems[0] = categoryItems[0];
          for (var i = 1; i < categoryItems.length; i++) {
            if (categoryItems[i].productName === categoryItems[i - 1].productName && !categoryItems[i].isDescChanged) {
              condensedItems[j].quantity += categoryItems[i].quantity;
            } else {
              j++;
              condensedItems[j] = categoryItems[i];
            }
          }
        }
        return {
          id: category, // unique key for ng-repeat
          category: categoryObject,
          items: condensedItems
        };
      }

      wo.separates = [];
      wo.separates.push(editItems(currentOrder,CATEGORY_SNACKS,catalog,categories));
      wo.separates.push(editItems(currentOrder,CATEGORY_SANDWICHES,catalog,categories));
      wo.separates.push(editItems(currentOrder,CATEGORY_DESSERTS,catalog,categories));

      wo.splitSeparates = wo.separates.sort(function(a,b) {
        return (b.items.length - a.items.length);
      });
    });

    $timeout(function() {
      window.print();
    },1000);

  });
