'use strict';

/* Controllers */
angular.module('myApp')

    .controller('StickersCtrl', function (api, $state, $rootScope, $timeout,
                                          catalog, categories, config,
                                          workOrder, order, customers, customer, color) {
      $rootScope.menuStatus = 'hide';
      $rootScope.title = 'מדבקות';

      var CATEGORY_SNACKS = 1;
      var CATEGORY_DESSERTS = 8;

      var ordCategories;

      this.isOrderColors = config.isOrderColors;
      this.isOrderNumbers = config.isOrderNumbers;

      // for stickers request from order we create a fictitious workorder with just that order
      if ($state.current.name === 'orderStickers') {
        workOrder = [
          {
            id: 'foo',
            domain: 0,
            order: order.properties,
            customer: customer,
            color: color
          }
        ]
      }

      function splitDishesByCategory  (orders) {
        orders.forEach(function (order) {
          order.order.quotes[order.order.activeQuote].items.forEach(function (item) {
            var catInd;
            var tmp = ordCategories.filter(function (cat, i) {
              if (cat.category.tId === item.category.tId) {
                catInd = i;
              }
              return cat.category.tId === item.category.tId;
            });
            if (!tmp.length) {  // new category
              ordCategories.splice(0, 0, {
                category: item.category,
                items: [],
                orders: orders.map(function(ord) {    // array to place quantity of category level stickers per order
                  return {
                    number: ord.order.number,
                    eventDate: ord.order.eventDate,
                    customer: ord.customer,
                    color: ord.color,
                    quantity: 0
                  }
                })
              });
              catInd = 0;
            }
            var catalogEntry = catalog.filter(function (ca) {
              return ca.id === item.catalogId;
            })[0];
            var isGlobalCategory = ordCategories[catInd].category.tId === CATEGORY_SNACKS ||
                ordCategories[catInd].category.tId === CATEGORY_DESSERTS;
            if (isGlobalCategory) {                       // for snacks and desserts produce category stickers
              var boxComponent = catalogEntry.properties.components.filter(function(comp) { // instead of item stickers
                return comp.id === config.boxItem;
              });
              if (boxComponent.length > 0) {
                var thisOrd = ordCategories[catInd].orders.filter(function(ord) {
                  return ord.number === order.order.number;
                })[0];
                thisOrd.quantity += item.quantity / catalogEntry.properties.productionQuantity * boxComponent[0].quantity;
              }
            }
            var stickerItem = {
              number: order.order.number,
              label: catalogEntry.properties.stickerLabel,
              quantity: isGlobalCategory ?                    // for global categories, count only exitList sub items
                  catalogEntry.properties.exitList.length :
                  Math.ceil(
                      item.quantity /
                      catalogEntry.properties.priceQuantity *
                      catalogEntry.properties.stickerQuantity
                  ) + catalogEntry.properties.exitList.length,
              eventDate: order.order.eventDate,
              customer: order.customer,
              color: order.color
            };
            ordCategories[catInd].items.push(stickerItem);
          });
        });
      }

      function sortStickers () {
        ordCategories.sort(function(a,b) {
          return  a.category.order - b.category.order;
        });
        ordCategories.forEach(function(cat) {
          cat.items.sort(function(a,b) {
            if (a.label < b.label) {
              return -1;
            } else if (a.label > b.label) {
              return 1;
            } else if (a.eventDate < b.eventDate) {
              return -1;
            } else if (a.eventDate > b.eventDate) {
              return 1;
            } else {
              return 0;
            }
          });
        });
      }

      this.renderSticker = function(sticker) {
        sticker.seq = stickerJ;  // for ng-repeat uniqueneness
        this.stickerPage[stickerP].lines[stickerI].stickers[stickerJ] = angular.copy(sticker);
        stickerJ++;
        if(stickerJ === STICKER_WIDTH) {
          this.renderNewLine();
        }
      };

      this.renderStickerGroup = function(stickerGroup) {
        for (var i = stickerGroup.quantity; i > 0; i--) {
          this.renderSticker (stickerGroup);
        }
      };

      this.renderNewPage = function() {
        stickerP++;
        this.stickerPage[stickerP] = {
          seq: stickerP+1,
          lines: [{
            seq: stickerI,
            stickers: []
          }]
        };
        stickerI = 0;
      };

      this.renderNewLine = function() {
        stickerI++;
        stickerJ = 0;
        if (stickerI < STICKER_HEIGHT) {    // if last line on page, don't initialize it
          this.stickerPage[stickerP].lines[stickerI] = {
            seq: stickerI,
            stickers: []
          };
        } else  {  // last line on page
          this.renderNewPage();
        }
      };

      this.renderStickers = function () {
        var that = this;
        var seq = 0;
        ordCategories.forEach(function(cat) {
          cat.orders.forEach(function(ord) {
            that.renderStickerGroup({
              label: cat.category.label,
              eventDate: ord.eventDate,
              customer: ord.customer,
              color: ord.color,
              quantity: ord.quantity,
              seq: seq
            });
          });
          cat.items.forEach(function(item) {
            that.renderStickerGroup({
              label: item.label,
              eventDate: item.eventDate,
              customer: item.customer,
              color: item.color,
              quantity: item.quantity,
              seq: seq
            });
          });
          if(stickerJ > 0) {
            that.renderNewLine();
          }
        });
      };

      this.dayName = function(dat) {
        var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
        return dayNames[dat.getDay()]+"'";
      };

      var woOrders = workOrder.filter(function(wo) { // create array of all orders in wo
        return wo.domain===0;
      });
      if ($state.current.name === 'woStickers') {
        woOrders.forEach(function (wo) {
          wo.customer = customers.filter(function (cust) {
            return cust.id === wo.order.customer;
          })[0].properties;
        })
      }

      ordCategories = [];

      splitDishesByCategory(woOrders);
      ordCategories = ordCategories.filter(function(cat) {
        return cat.category.type < 3;  // only food items
      });
      ordCategories.forEach(function(cat) {    // filter snacks and desserts who don't have exit list sub items
        if (cat.category.tId === CATEGORY_SNACKS || cat.category.tId === CATEGORY_DESSERTS) {
          cat.items = cat.items.filter(function(item){
            return item.quantity > 0;
          });
          cat.orders.forEach(function(ord) {
            ord.quantity = Math.ceil(ord.quantity);
          });
        }
      });
      sortStickers();

      var STICKER_HEIGHT = 11;
      var STICKER_WIDTH = 3;
      this.stickerPage = [];
      var stickerP = 0;
      var stickerI = 0;
      var stickerJ = 0;
      this.stickerPage[0] = {
        seq: 1,
        lines: [{
          seq: stickerI,
          stickers: []
        }]
      };
      this.renderStickers();

      $timeout(function() {
        window.print();
      },1000);

    })


.controller('DishStickersCtrl', function (api, $state, $rootScope, $timeout,
                                      catalog, categories, config, sensitivities,
                                      workOrder, order, customers, customer, color) {
  $rootScope.menuStatus = 'hide';
  $rootScope.title = 'מדבקות למנות';

  var CATEGORY_SNACKS = 1;
  var CATEGORY_DESSERTS = 8;
  var CATEGORY_DESSERTS2 = 49;

  var ordCategories;

  this.isOrderColors = config.isOrderColors;
  this.isOrderNumbers = config.isOrderNumbers;

  var outOfFridgeItem = catalog.filter(function(cat) {
    return cat.id === config.outOfFridgeItem;
  })[0];

  // for stickers request from order we create a fictitious workorder with just that order
  if ($state.current.name === 'orderDishStickers') {
    workOrder = [
      {
        id: 'foo',
        domain: 0,
        order: order.properties,
        customer: customer,
        color: color
      }
    ]
  }

  var allergies = sensitivities.filter(function (sen) {
    return sen.isAllergy;
  }).map(function (sen) {
    sen.isContains = sen.isPositive;
    return sen;
  });

  function splitDishesByCategory  (orders) {
    orders.forEach(function (order) {
      if (order.order.exitTime) {
        order.productionTime = angular.copy(order.order.exitTime);
        order.productionTime.setHours(order.productionTime.getHours() - 2);
      }
      order.order.quotes[order.order.activeQuote].items.forEach(function (item) {
        var catInd;
        var tmp = ordCategories.filter(function (cat, i) {
          if (cat.category.tId === item.category.tId) {
            catInd = i;
          }
          return cat.category.tId === item.category.tId;
        });
        if (!tmp.length) {  // new category
          ordCategories.splice(0, 0, {
            category: item.category,
            items: [],
            orders: orders.map(function(ord) {    // array to place quantity of category level stickers per order
              return {
                number: ord.order.number,
                eventDate: ord.order.eventDate,
                productionTime: ord.productionTime,
                customer: ord.customer,
                color: ord.color,
                quantity: 0,
                allergies: angular.copy(allergies),
                instructions: []
              }
            }),
          });
          catInd = 0;
        }
        var catalogEntry = catalog.filter(function (ca) {
          return ca.id === item.catalogId;
        })[0];
        var isGlobalCategory = ordCategories[catInd].category.tId === CATEGORY_SNACKS ||
            ordCategories[catInd].category.tId === CATEGORY_DESSERTS;
        if (isGlobalCategory) {                       // for snacks and desserts produce category stickers
          var boxComponent = catalogEntry.properties.components.filter(function(comp) { // instead of item stickers
            return comp.id === config.boxItem;
          });
          if (boxComponent.length > 0) {
            var thisOrd = ordCategories[catInd].orders.filter(function(ord) {
              return ord.number === order.order.number;
            })[0];
            thisOrd.quantity += item.quantity / catalogEntry.properties.productionQuantity * boxComponent[0].quantity;
            catalogEntry.properties.sensitivities.forEach(function(sen) {
              var allergy = thisOrd.allergies.filter(function(all) {
                return all.tId === sen.tId;
              })[0];
              if (allergy) { // for negative allergies (like nuts) is they appear once, mark contains
                if (!allergy.isPositive) {
                  allergy.isContains = true;
                   }
              }
            });
            thisOrd.allergies.forEach(function(all) {
              if (all.isPositive && !all.isContains) {
                var allergy = catalogEntry.properties.sensitivities.filter(function (sen) {
                  return sen.tId === all.tId;
                })[0];
                if (!allergy) { // for negative allergies (like gluten) if they don't appear once, mark contains
                  allergy.isContains = true;
                }
              }
            })
            if (ordCategories[catInd].category.tId === CATEGORY_DESSERTS ||
                ordCategories[catInd].category.tId === CATEGORY_DESSERTS2) {
              if (thisOrd.instructions.length === 0) {
                thisOrd.instructions.push(outOfFridgeItem.properties.externalName);
                thisOrd.instructions.push('יש להוציא מהמקרר סמוך להגשה');
              }
            }
          }
        }
        var stickerItem = {
          number: order.order.number,
          label: catalogEntry.properties.stickerLabel,
          quantity: isGlobalCategory ?                    // for global categories, count only exitList sub items
              catalogEntry.properties.exitList.length :
              Math.ceil(
                  item.quantity /
                  catalogEntry.properties.priceQuantity *
                  catalogEntry.properties.stickerQuantity
              ) + catalogEntry.properties.exitList.length,
          eventDate: order.order.eventDate,
          productionTime: order.productionTime,
          customer: order.customer,
          color: order.color,
          allergies: angular.copy(allergies),
          instructions: []
        };

        // calc item allergies
        catalogEntry.properties.sensitivities.forEach(function (sen) {
          var allergy = stickerItem.allergies.filter(function (sen2) {
            return sen2.tId === sen.tId;
          })[0];
          if (allergy) {
            allergy.isContains = !allergy.isContains;
          }
        });
        stickerItem.isAnyContains = stickerItem.allergies.filter(function (sen) {
          return sen.isContains;
        }).length > 0;
        stickerItem.isAnyMayContain = stickerItem.allergies.filter(function (sen) {
          return !sen.isContains;
        }).length > 0;

        // calc item instructions
        if (item.category.tId === CATEGORY_DESSERTS || item.category.tId === CATEGORY_DESSERTS2) {
          stickerItem.instructions.push(outOfFridgeItem.properties.externalName);
          stickerItem.instructions.push('יש להוציא מהמקרר סמוך להגשה');
        }
        if (catalogEntry.properties.isFridge) {
          stickerItem.instructions.push(outOfFridgeItem.properties.externalName);
        }
        if (catalogEntry.properties.isHeating) {
          stickerItem.instructions.push('60 דקות לפני ההגשה ' +
                                        outOfFridgeItem.properties.generalInstructions);
        }
        if (catalogEntry.properties.generalInstructions) {
          stickerItem.instructions.push(catalogEntry.properties.generalInstructions);
        }
        if (catalogEntry.properties.instructions) {
          stickerItem.instructions.push(catalogEntry.properties.instructionsMinutes +
                                        ' דקות לפני ההגשה ' + catalogEntry.properties.instructions);
        }


        ordCategories[catInd].items.push(stickerItem);
      });
    });
    ordCategories.forEach(function (cat) {
      cat.orders.forEach(function (ord) {
        ord.isAnyContains =  ord.allergies.filter(function (all) {
          return all.isContains;
        }).length > 0;
        ord.isAnyMayContain =  ord.allergies.filter(function (all) {
          return !all.isContains;
        }).length > 0;
      });
    });
  }

  function sortStickers () {
    ordCategories.sort(function(a,b) {
      return  a.category.order - b.category.order;
    });
    ordCategories.forEach(function(cat) {
      cat.items.sort(function(a,b) {
        if (a.label < b.label) {
          return -1;
        } else if (a.label > b.label) {
          return 1;
        } else if (a.eventDate < b.eventDate) {
          return -1;
        } else if (a.eventDate > b.eventDate) {
          return 1;
        } else {
          return 0;
        }
      });
    });
  }

  /*
  this.renderSticker = function(sticker) {
    sticker.seq = stickerJ;  // for ng-repeat uniqueneness
    this.stickerPage[stickerP].lines[stickerI].stickers[stickerJ] = angular.copy(sticker);
    stickerJ++;
    if(stickerJ === STICKER_WIDTH) {
      this.renderNewLine();
    }
  };

   */

  this.renderSticker = function(sticker) {
    sticker.seq = stickerJ;  // for ng-repeat uniqueneness
    this.stickerList[stickerJ] = angular.copy(sticker);
    stickerJ++;
  };

  this.renderStickerGroup = function(stickerGroup) {
    for (var i = stickerGroup.quantity; i > 0; i--) {
      this.renderSticker (stickerGroup);
    }
  };

  this.renderNewPage = function() {
    stickerP++;
    this.stickerPage[stickerP] = {
      seq: stickerP+1,
      lines: [{
        seq: stickerI,
        stickers: []
      }]
    };
    stickerI = 0;
  };

  this.renderNewLine = function() {
    stickerI++;
    stickerJ = 0;
    if (stickerI < STICKER_HEIGHT) {    // if last line on page, don't initialize it
      this.stickerPage[stickerP].lines[stickerI] = {
        seq: stickerI,
        stickers: []
      };
    } else  {  // last line on page
      this.renderNewPage();
    }
  };

  this.renderStickers = function () {
    var that = this;
    var seq = 0;
    ordCategories.forEach(function(cat) {
      cat.orders.forEach(function(ord) {
        that.renderStickerGroup({
          label: cat.category.label,
          eventDate: ord.eventDate,
          productionTime: ord.productionTime,
          customer: ord.customer,
          color: ord.color,
          quantity: ord.quantity,
          allergies: ord.allergies,
          isAnyContains: ord.isAnyContains,
          isAnyMayContain: ord.isAnyMayContain,
          instructions: ord.instructions,
          seq: seq
        });
      });
      cat.items.forEach(function(item) {
        that.renderStickerGroup({
          label: item.label,
          eventDate: item.eventDate,
          productionTime: item.productionTime,
          customer: item.customer,
          color: item.color,
          quantity: item.quantity,
          allergies: item.allergies,
          isAnyContains: item.isAnyContains,
          isAnyMayContain: item.isAnyMayContain,
          instructions: item.instructions,
          seq: seq
        });
      });
      if(stickerJ > 0) {
        that.renderNewLine();
      }
    });
  };

  this.dayName = function(dat) {
    var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
    return dayNames[dat.getDay()]+"'";
  };

  var woOrders = workOrder.filter(function(wo) { // create array of all orders in wo
    return wo.domain===0;
  });
  if ($state.current.name === 'woDishStickers') {
    woOrders.forEach(function (wo) {
      wo.customer = customers.filter(function (cust) {
        return cust.id === wo.order.customer;
      })[0].properties;
    })
  }

  ordCategories = [];

  splitDishesByCategory(woOrders);
  ordCategories = ordCategories.filter(function(cat) {
    return cat.category.type < 3;  // only food items
  });
  ordCategories.forEach(function(cat) {    // filter snacks and desserts which don't have exit list sub items
    if (cat.category.tId === CATEGORY_SNACKS || cat.category.tId === CATEGORY_DESSERTS) {
      cat.items = cat.items.filter(function(item){
        return item.quantity > 0;
      });
      cat.orders.forEach(function(ord) {
        ord.quantity = Math.ceil(ord.quantity);
      });
    }
  });
  sortStickers();

  var STICKER_HEIGHT = 4;
  var STICKER_WIDTH = 3;
  this.stickerPage = [];
  this.stickerList = [];
  var stickerP = 0;
  var stickerI = 0;
  var stickerJ = 0;
  this.stickerPage[0] = {
    seq: 1,
    lines: [{
      seq: stickerI,
      stickers: []
    }]
  };
  this.renderStickers();

  $timeout(function() {
    window.print();
  },1000);

})

.controller('SnacksAndDessertsCtrl', function (api, $state, $rootScope, $timeout,
                                                   catalog, config, categories, measurementUnits,
                                                   workOrder) {
      $rootScope.menuStatus = 'hide';
      $rootScope.title = 'חטיפים וקינוחים';

      var CATEGORY_SNACKS = 1;
      var CATEGORY_DESSERTS = 8;

      this.isOrderColors = config.isOrderColors;
      this.isOrderNumbers = config.isOrderNumbers;

      function editItems (order, category) {
        return order.order.quotes[order.order.activeQuote].items.filter(function(item) {
          return item.category.tId === category;
        }).map(function(item) {
          return {
            id: item.index,   // for ng-repeat track by
            productName: item.productName,
            productDescription: (item.isKitchenRemark && item.kitchenRemark) ?
                item.kitchenRemark :  item.productDescription,
            isDescChanged: item.isDescChanged & (!item.isCosmeticChange),
            quantity: item.quantity,
            measurementUnitLabel: item.measurementUnit.label
          }
        })
      }

      this.woOrders = workOrder.filter(function(wo) { // create array of all orders in wo
        return wo.domain===0;
      }).sort(function(a,b) {
        if (a.order.eventDate < b.order.eventDate) {
          return 1
        } else return -1
      });

      this.woOrders.forEach(function(order) {
        order.snacks = editItems(order,CATEGORY_SNACKS);
        order.desserts = editItems(order,CATEGORY_DESSERTS);
      });

      $timeout(function() {
        window.print();
      });
    })

    .controller('PackageStickersCtrl', function (api, lov, $state, $rootScope, $timeout,
                                                   catalog, config, allCategories,
                                                   workOrder, customers, displayMode) {
      $rootScope.menuStatus = 'hide';
      $rootScope.title = 'מדבקות אריזה';

       function dayName (dat) {
        var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
        return dayNames[dat.getDay()]+"'";
      }


      this.displayMode = lov.workOrderDisplayModes.filter(function (dm) {
        return dm.id === displayMode;
       })[0];


      var that = this;

      var orders = workOrder.filter(function (wo) {
        return wo.domain === 0;
      });
      orders.forEach(function (ord) {
        ord.firstName = customers.filter(function (cust) {
          return cust.id === ord.order.customer;
        })[0].properties.firstName;
        ord.day = dayName(ord.order.eventDate);
      });

      this.stickers = [];
      workOrder.forEach(function (wo) {
        if (wo.domain === 4 && (wo.category.type === 21 || wo.category.type === 22) ) {
          var catalogEntry = catalog.filter(function (cat) {
            return cat.id === wo.catalogId;
          })[0];
          wo.backTrace.forEach(function (bt) {
            var prep = workOrder.filter(function (wo2) {
              return wo2.id === bt.id;
            })[0];
            prep.orders.forEach(function (ord) {
              var isShow = false;
              if (that.displayMode.isShowTodayOnly) {
                if (ord.select === 'today') {
                  isShow = true;
                }
              } else if (that.displayMode.isShowDone) {
                isShow = true;
              } else {
                if (ord.select === 'delay' || ord.select === 'today') {
                  isShow = true;
                }
              }
              if (isShow) {
                var order = orders.filter(function (ord2) {
                  return ord2.id === ord.id;
                })[0];
                var sticker = {
                  label: catalogEntry.properties.externalName,
                  firstName: order.firstName,
                  day: order.day
                };
                that.stickers.push(sticker);
              }
            });
          })
         }
      })

      $timeout(function() {
        window.print();
      });
    });




