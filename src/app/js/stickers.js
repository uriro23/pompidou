'use strict';

/* Controllers */
angular.module('myApp')

  .controller('StickersCtrl', function (api, $state, $rootScope,
                                                 catalog, categories, config,
                                                 workOrder) {
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'מדבקות';

    var CATEGORY_SNACKS = 1;
    var CATEGORY_DESSERTS = 8;

    var ordCategories;

    function splitMenuItemsByCategory  (orders) {
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
          var globalCategory = ordCategories[catInd].category.tId === CATEGORY_SNACKS ||
                               ordCategories[catInd].category.tId === CATEGORY_DESSERTS;
          if (globalCategory) {                       // for snacks and desserts produce category stickers
            var boxComponent = catalogEntry.attributes.components.filter(function(comp) { // instead of item stickers
              return comp.id === config.boxItem;
            });
            if (boxComponent.length > 0) {
              var thisOrd = ordCategories[catInd].orders.filter(function(ord) {
                return ord.number === order.order.number;
              })[0];
              thisOrd.quantity += item.quantity / catalogEntry.attributes.priceQuantity * boxComponent[0].quantity;
            }
          }
          var stickerItem = {
            number: order.order.number,
            label: catalogEntry.attributes.stickerLabel,
            quantity: globalCategory ?                    // for global categories, count only exitList sub items
                      catalogEntry.attributes.exitList.length :
              Math.ceil(
                item.quantity /
                catalogEntry.attributes.priceQuantity *
                catalogEntry.attributes.stickerQuantity
              ) + catalogEntry.attributes.exitList.length,
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
      this.stickerLine[stickerI].stickers[stickerJ] = angular.copy(sticker);
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

    this.renderNewLine = function() {
      stickerI++;
      stickerJ = 0;
      this.stickerLine[stickerI]= {
        stickers: []
      };
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

    ordCategories = [];

    splitMenuItemsByCategory(woOrders);
    ordCategories = ordCategories.filter(function(cat) {
      return !(cat.category.isTransportation || cat.category.isPriceIncrease);
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

    console.log(ordCategories);


    var STICKER_WIDTH = 3;
    this.stickerLine = [];
    var stickerI = 0;
    var stickerJ = 0;
    this.stickerLine[0] = {
      stickers: []
    };
    this.renderStickers();

    console.log(this.stickerLine);
  })


  .controller('SnacksAndDessertsCtrl', function (api, $state, $rootScope,
                                          catalog, categories, measurementUnits,
                                          workOrder) {
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'חטיפים וקינוחים';

    var CATEGORY_SNACKS = 1;
    var CATEGORY_DESSERTS = 8;

    function editItems (order, category, catalog) {
      return order.order.quotes[order.order.activeQuote].items.filter(function(item) {
        return item.category.tId === category;
      }).map(function(item) {
        var catalogItem = catalog.filter(function(cat) {
          return cat.id===item.catalogId;
        })[0].attributes;
        return {
          productName: catalogItem.productName,
          productDescription: item.productDescription,
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
      order.snacks = editItems(order,CATEGORY_SNACKS,catalog);
      order.desserts = editItems(order,CATEGORY_DESSERTS,catalog);
    });


  });

/*
    this.splitMenuItemsByCategory = function () {
      var that = this;
      this.categories = [];
      workOrder.forEach(function(wo) {
        if (wo.domain === 1) {
          var catInd;
          var temp = that.categories.filter(function (c, ind) {
            if (c.category.tId === wo.category.tId) {
              catInd = ind;
              return true;
            }
          });
          if (!temp.length) {  // if category appears for 1st time, create it's object
            that.categories.splice(0, 0, {
              category: wo.category,
              list: []
            });
            catInd = 0;
          }
          that.categories[catInd].list.push(wo); //add wo item to proper category list
        }
      });
      // sort categories of each domain and items within category
        this.categories.sort(function (a, b) {
          return a.category.order - b.category.order;
        });
        this.categories.forEach(function(cat) {
          cat.list.sort(function (a, b) {
            if (a.productName > b.productName) {
              return 1;
            } else if (a.productName < b.productName){
              return -1;
            } else {
              return 0;
            }
          });
        });
    };
*/
