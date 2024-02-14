'use strict';

/* Controllers */
angular.module('myApp')

.controller('DishStickersCtrl', function (api, $state, $rootScope, $timeout,
                                      catalog, categories, config, sensitivities,
                                      workOrder, order, customers, customer, stickerType) {
  $rootScope.menuStatus = 'hide';
  if (stickerType === 2) {
    $rootScope.title = 'מדבקות לדגימות מזון';
  } else {
    $rootScope.title = 'מדבקות ללקוח';
  }

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
        customer: customer
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
        var catalogEntry = catalog.filter(function (ca) {
          return ca.id === item.catalogId;
        })[0];
        if (stickerType === 1 || catalogEntry.properties.isSensitiveDish) { // for food samples use only sensitive dishes
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
              orders: orders.map(function (ord) {    // array to place quantity of category level stickers per order
                return {
                  type: 0, // category sticker
                  number: ord.order.number,
                  eventDate: ord.order.eventDate,
                  productionTime: ord.productionTime,
                  customer: ord.customer,
                  quantity: 0,
                  allergies: angular.copy(allergies),
                  instructions: [],
                  isSensitiveDishSticker: stickerType === 2 && catalogEntry.properties.isSensitiveDish
                }
              }),
            });
            catInd = 0;
          }
          var isGlobalCategory = ordCategories[catInd].category.tId === CATEGORY_SNACKS ||
              ordCategories[catInd].category.tId === CATEGORY_DESSERTS;
          if (isGlobalCategory) {                       // for snacks and desserts produce category stickers
            console.log('dish in global category: '+item.productName);
            var boxComponent = catalogEntry.properties.components.filter(function (comp) { // instead of item stickers
              return comp.id === config.boxItem;
            });
            if (boxComponent.length > 0) {
              console.log('box dish in global category: '+item.productName);
              var thisOrd = ordCategories[catInd].orders.filter(function (ord) {
                return ord.number === order.order.number;
              })[0];
              thisOrd.quantity += item.quantity / catalogEntry.properties.productionQuantity * boxComponent[0].quantity;
              if (catalogEntry.properties.isSensitiveDish) { // if any dish in category is sensitive print category sticker
                console.log('sensitive dish in category: '+item.productName);
                thisOrd.isSensitiveDishSticker = true;
              }
              catalogEntry.properties.sensitivities.forEach(function (sen) {
                var allergy = thisOrd.allergies.filter(function (all) {
                  return all.tId === sen.tId;
                })[0];
                if (allergy) { // for negative allergies (like nuts) if they appear once, mark contains
                  if (!allergy.isPositive) {
                    allergy.isContains = true;
                  }
                }
              });
              thisOrd.allergies.forEach(function (all) {
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
            type: 1, // item sticker
            number: order.order.number,
            label: catalogEntry.properties.stickerLabel,
            quantity: isGlobalCategory ? 0 :  // for global categories, count only exitList sub items
                Math.ceil(
                    item.quantity / catalogEntry.properties.priceQuantity * catalogEntry.properties.stickerQuantity
                ),
            eventDate: order.order.eventDate,
            productionTime: order.productionTime,
            customer: order.customer,
            allergies: angular.copy(allergies),
            instructions: [],
            isSensitiveDishSticker: stickerType === 2
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

          // now add exitList stickers
          catalogEntry.properties.exitList.forEach(function (exitListItem) {
            var exitListSticker = {
              type: 2, // exit list sticker
              number: order.order.number,
              label: catalogEntry.properties.stickerLabel,
              subLabel: exitListItem.item,
              quantity: 1,
              eventDate: order.order.eventDate,
              productionTime: order.productionTime,
              customer: order.customer,
              isSensitiveDishSticker: false
            };
            ordCategories[catInd].items.push(exitListSticker);
          });
        }
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
      cat.orders.sort(function(a,b) {
        return a.number - b.number;
      });
      cat.items.sort(function(a,b) {
        if (a.label < b.label) {
          return -1;
        } else if (a.label > b.label) {
          return 1;
        } else if (a.number < b.number) {
          return -1;
        } else if (a.number > b.number) {
          return 1;
        } else  if (a.type < b.type) { // all main item stickers before exitList stickers
          return -1;
        } else if (a.type > b.type) {
          return 1;
        } else {
          return 0;
        }
      });
    });
  }

  this.renderSticker = function(sticker) {
    if (stickerType === 1 || sticker.isSensitiveDishSticker) { // for sensitive dish stickers, skip other stickers
      sticker.seq = seq++;  // for ng-repeat uniqueneness
      this.stickerList.push(angular.copy(sticker));
    }
  };

  this.renderStickerGroup = function(stickerGroup) {
    if (stickerType === 1) {
      for (var i = stickerGroup.quantity; i > 0; i--) {
        this.renderSticker(stickerGroup);
      }
    } else {
      this.renderSticker(stickerGroup);
    }
  };

  this.renderStickers = function () {
    var that = this;
    var seq = 0;
    ordCategories.forEach(function(cat) {
      cat.orders.forEach(function(ord) {
        that.renderStickerGroup({
          type: 0,
          label: cat.category.label,
          eventDate: ord.eventDate,
          productionTime: ord.productionTime,
          customer: ord.customer,
          quantity: ord.quantity,
          allergies: ord.allergies,
          isAnyContains: ord.isAnyContains,
          isAnyMayContain: ord.isAnyMayContain,
          instructions: ord.instructions,
          isSensitiveDishSticker: ord.isSensitiveDishSticker,
          seq: seq
        });
      });
      cat.items.forEach(function(item) {
        that.renderStickerGroup({
          type: item.type,
          label: item.label,
          subLabel: item.subLabel,
          eventDate: item.eventDate,
          productionTime: item.productionTime,
          customer: item.customer,
          quantity: item.quantity,
          allergies: item.allergies,
          isAnyContains: item.isAnyContains,
          isAnyMayContain: item.isAnyMayContain,
          instructions: item.instructions,
          isSensitiveDishSticker: item.isSensitiveDishSticker,
          seq: seq
        });
      });
    });
  };

  this.dayName = function(dat) {
    var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
    return dayNames[dat.getDay()]+"'";
  };

  var woOrders = workOrder.filter(function(wo) { // create array of all orders in wo
    return wo.domain===0 && wo.status !== 'del';
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

  this.stickerList = [];
  var seq = 0;
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
    })

    .controller('InprocessStickersCtrl', function($rootScope, $timeout, api, type, quantity, isContent) {
      $rootScope.menuStatus = 'hide';
      $rootScope.title = 'מדבקות בתהליך';

      var that = this;
      this.type = type;
      this.isContent = isContent;

      this.stickers = [];
      for (var i=0;i<quantity;i++) {
        this.stickers.push({
          seq: i
        });
      }

      if (isContent) {
        api.queryStickerParams()
            .then (function(s) {
              var stickerParams = s[0];
              that.productName = stickerParams.properties.productName;
              that.productionDate = stickerParams.properties.productionDate;
              that.freezeDate = stickerParams.properties.freezeDate;
              that.producer = stickerParams.properties.producer;
              that.validUntil = stickerParams.properties.validUntil;
              that.customerName = stickerParams.properties.customerName;
              that.eventDate = stickerParams.properties.eventDate;
              $timeout(function() {
                window.print();
              });
            });
      } else {
        $timeout(function () {
          window.print();
        });
      }
    });





