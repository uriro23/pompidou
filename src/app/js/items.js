'use strict';

angular.module('myApp')
  .controller('ItemsCtrl', function ($scope, $state, api, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.categories = $scope.orderModel.categories;
    this.measurementUnits = $scope.orderModel.measurementUnits;
    this.config = $scope.orderModel.config;


    this.filterText = '';
    this.isAddItem = false;
    this.currentCategory = this.categories[0]; // default to first category


    this.setCategory = function () {
      var that = this;
      var thisOrder = this.order.attributes;
      return api.queryCatalogByCategory(this.currentCategory.tId)
        .then(function (cat) {
          that.baseCatalog = cat.filter(function (c) {
            return !c.attributes.isDeleted
          });
          that.baseCatalog = that.baseCatalog.map(function (c) {
            var cc = c.attributes;
            cc.id = c.id;
            cc.isInOrder = false; // check items already in order, just for attention
            var orderItems = that.order.view.quote.items;
            for (var i = 0; i < orderItems.length; i++) {
              if (orderItems[i].catalogId === c.id) {
                cc.isInOrder = true;
              }
            }
            return cc;
          });
          that.baseCatalog.sort(function (a, b) {
            if (a.productName > b.productName) {
              return 1
            } else {
              return -1
            }
          });
          that.filteredCatalog = that.baseCatalog;
          that.filterText = '';
        })
    };

    this.addItem = function (set) {
      if (set) {
        this.isAddItem = true;
        this.setCategory();
      } else {
        this.isAddItem = false;
      }
    };

    this.deleteItem = function (ind) {
      var thisQuote = this.order.view.quote;
      thisQuote.items.splice(ind, 1);
      orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
      orderService.quoteChanged(this.order);
    };

    this.editCatalogItem = function (ind) {
      var thisItem = this.order.view.quote.items[ind];
      $state.go('editCatalogItem',{'id':thisItem.catalogId});
    };

    this.itemChanged = function (ind) {
       var thisItem = this.order.view.quote.items[ind];
      orderService.quoteChanged(this.order);
      thisItem.isChanged = true;
    };

    this.filterProducts = function () {
      var that = this;
      this.filteredCatalog = this.baseCatalog.filter(function (cat) {
        return cat.productName.indexOf(that.filterText) > -1;
      })
    };

    this.setProduct = function (catalogEntry) {
      var that = this;
      var thisOrder = this.order.attributes;
      var thisQuote = this.order.view.quote;
      var orderItems = thisQuote.items;

        var c = this.categories.filter(function (cat) {
        return cat.tId === catalogEntry.category;
      })[0];

        //check for duplicate priceIncrease items - illegal
      if (c.type === 4) {  // priceIncrease
        var tmp = orderItems.filter(function(itm) {
          return (itm.category.type === 4);
        });
        if (tmp.length) {
          alert("אסור להוסיף יותר מתוספת מחיר אחת");
          return;
        }
      }

      var maxIndex = orderItems.length === 0 ? 0 : Math.max.apply(null, orderItems.map(function (itm) {
        return itm.index
      })) + 1;

      orderItems.splice(0, 0, {});
      var thisItem = orderItems[0];
      thisItem.index = maxIndex;

      thisItem.category = {   // take only required properties of category
        tId: c.tId,
        label: c.label,
        type: c.type,
        order: c.order
      };
      thisItem.catalogId = catalogEntry.id;
      thisItem.productName = catalogEntry.productName;
      thisItem.productDescription = catalogEntry.productDescription;
      thisItem.shortDescription = catalogEntry.shortDescription;
      thisItem.isInMenu = catalogEntry.isInMenu;
      thisItem.measurementUnit = this.measurementUnits.filter(function (mes) {
        return mes.tId === catalogEntry.measurementUnit;
      })[0];
      thisItem.catalogQuantity = catalogEntry.priceQuantity;  // for price computation
      thisItem.quantity = catalogEntry.priceQuantity; // as default quantity
      thisItem.productionQuantity = catalogEntry.productionQuantity;  // for box count computation
      thisItem.catalogPrice = catalogEntry.price; // for price computation
      thisItem.priceInclVat = catalogEntry.price;  // prices in catalog include vat
      thisItem.priceBeforeVat = catalogEntry.price / (1 + thisOrder.vatRate);
      if (thisOrder.isBusinessEvent) {
        thisItem.price = thisItem.priceBeforeVat;
      } else {
        thisItem.price = thisItem.priceInclVat;
      }
      var boxData = catalogEntry.components.filter(function (comp) {
        return comp.id === that.config.boxItem;
      });
      if (boxData.length === 0) {
        thisItem.productionBoxCount = 0;
      } else {
        thisItem.productionBoxCount = boxData[0].quantity;
      }
      thisItem.boxCount = thisItem.quantity * thisItem.productionBoxCount / thisItem.productionQuantity;

      var satietyIndexData = catalogEntry.components.filter(function (comp) {
        return comp.id === that.config.satietyIndexItem;
      });
      if (satietyIndexData.length === 0) {
        thisItem.productionSatietyIndex = 0;
      } else {
        thisItem.productionSatietyIndex = satietyIndexData[0].quantity;
      }
      thisItem.satietyIndex = thisItem.quantity * thisItem.productionSatietyIndex / thisItem.productionQuantity;

      thisItem.errors = {}; // initialize errors object for new item
      thisItem.isChanged = true;
      this.isAddItem = false;
      this.filterText = '';
      orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
      orderService.quoteChanged(this.order);
    };

    this.setProductDescription = function (ind) {
      var thisItem = this.order.view.quote.items[ind];
      thisItem.isDescChanged = true;
      thisItem.errors.productDescription = !Boolean(thisItem.productDescription);
      orderService.quoteChanged(this.order);
      thisItem.isChanged = true;
    };

    this.setCosmeticChange = function (ind ) {
      var thisItem = this.order.view.quote.items[ind];
      orderService.quoteChanged(this.order);
      thisItem.isChanged = true;
    };

    this.resetDescChange = function (ind) {
      var thisItem = this.order.view.quote.items[ind];
      api.queryCatalogById(thisItem.catalogId)
        .then(function(cat) {
          thisItem.productDescription = cat[0].attributes.productDescription;
          thisItem.isDescChanged = false;
        });
      orderService.quoteChanged(this.order);
      thisItem.isChanged = true;
    };

    this.setQuantity = function (ind) {
      var thisOrder = this.order.attributes;
      var thisQuote = this.order.view.quote;
      var thisItem = thisQuote.items[ind];

      thisItem.errors.quantity = Number(thisItem.quantity) != thisItem.quantity || Number(thisItem.quantity) < 0;
      thisItem.priceInclVat = thisItem.quantity * thisItem.catalogPrice / thisItem.catalogQuantity;
      thisItem.priceBeforeVat = thisItem.priceInclVat / (1 + thisOrder.vatRate);
      if (thisOrder.isBusinessEvent) {
        thisItem.price = thisItem.priceBeforeVat;
      } else {
        thisItem.price = thisItem.priceInclVat;
      }
      thisItem.boxCount = thisItem.quantity * thisItem.productionBoxCount / thisItem.productionQuantity;
      thisItem.satietyIndex = thisItem.quantity * thisItem.productionSatietyIndex / thisItem.productionQuantity;
      orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
      orderService.quoteChanged(this.order);
      thisItem.isForcedPrice = false;
      thisItem.isChanged = true;
    };

    this.setPrice = function (ind) {
      var thisOrder = this.order.attributes;
      var thisQuote = this.order.view.quote;
      var thisItem = thisQuote.items[ind];

      thisItem.errors.price = Number(thisItem.price) != thisItem.price || Number(thisItem.price) < 0;
      if (thisOrder.isBusinessEvent) {
        thisItem.priceInclVat = thisItem.price * (1 + thisOrder.vatRate);
        thisItem.priceBeforeVat = thisItem.price;
      } else {
        thisItem.priceInclVat = thisItem.price;
        thisItem.priceBeforeVat = thisItem.price / (1 + thisOrder.vatRate);
      }
      thisItem.isForcedPrice = true;
      orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
      orderService.quoteChanged(this.order);
      thisItem.isChanged = true;
    };

     this.setFreeItem = function (ind) {
      var thisQuote = this.order.view.quote;
      var thisItem = thisQuote.items[ind];
      orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
      orderService.quoteChanged(this.order);
      thisItem.isChanged = true;
    };

    this.getTemplates = function () {
      var that = this;
      api.queryTemplateOrders(['template','noOfParticipants','header','orderStatus'])
        .then(function (temps) {
          that.templates = temps.filter(function(t) {
            return t.attributes.orderStatus !== 6 && t.attributes.template;
          });
          that.templates.forEach(function(t) {
            t.isCurrentMenuType = (t.attributes.header.menuType.tId === that.order.view.quote.menuType.tId);
          });
          that.templates.sort(function (a, b) {
             if (a.attributes.header.menuType.label > b.attributes.header.menuType.label) {
              return 1;
            } else if (a.attributes.header.menuType.label < b.attributes.header.menuType.label) {
              return -1;
            } else return a.attributes.template > b.attributes.template ? 1 : -1;
            })
          });
    };

    // returns true if among templates are both such with menuType equal to current quote and such with different MT
    // used to decide if separator is needed
    this.isBothMenuTypes = function() {
      var isSame = false;
      var isDiff = false;
      if (this.templates) {
        this.templates.forEach(function (template) {
          if (template.isCurrentMenuType) {
            isSame = true;
          } else {
            isDiff = true;
          }
        });
        return isSame && isDiff;
      } else {
        return false;
      }
    };

    this.addTemplate = function (set) {
      if (set) {
        this.isAddTemplate = true;
        this.getTemplates();
      } else {
        this.isAddTemplate = false;
      }
    };

    this.setTemplate = function (template) {
      var that = this;
      return api.queryOrder (template.id)
       .then(function (tmpl) {
         var currTemplate = tmpl[0].attributes;
          that.addQuoteItems(currTemplate.quotes[currTemplate.activeQuote],false,currTemplate.noOfParticipants)
            .then(function() {
               that.isAddTemplate = false;
         });
       });
     };


    this.addQuote = function (set) {
      if (set) {
        this.isAddQuote = true;
        var thisQuote = this.order.view.quote;
        this.quotes = this.order.attributes.quotes.filter(function(quote) {  // exclude selected quote
          return quote.menuType.tId !== thisQuote.menuType.tId;
        });
      } else {
        this.isAddQuote = false;
      }
    };

    this.setQuote = function(quote) {
      var that = this;
      this.addQuoteItems(quote,true,0)
        .then(function() {
          that.isAddQuote = false;
        });
    };

    this.addQuoteItems = function (sourceQuote,isSameOrder,sourceNoOfParticipants) {
      var that = this;
      var targetOrder = this.order.attributes;
      var targetQuote = this.order.view.quote;
      var targetItems = targetQuote.items;
      var sourceCatalogIds = sourceQuote.items.map(function (itm) {
        return itm.catalogId
      });
      return api.queryCatalogByIds(sourceCatalogIds)
        .then(function (cat) {
          var sourceCatalogItems = cat.map(function (c) {
            var ct = c.attributes;
            ct.id = c.id;
            return ct
          });
          var isPriceConflict = false;
          sourceQuote.items.forEach(function(sourceItem) {
            var isDupPriceIncrease = false;
            if (sourceItem.category.type === 4) {   // skip duplicate priceIncrease items
              targetItems.forEach(function(dupItem) {
                if (dupItem.category.type === 4) {
                  isDupPriceIncrease = true;
                }
              });
            }
            if  (!isDupPriceIncrease) {
              var sourceCatalogItem = sourceCatalogItems.filter(function (cat) {
                return cat.id === sourceItem.catalogId
              })[0];
              // fetch up to date price from catalog
              if (!isSameOrder) {
                sourceItem.catalogPrice = sourceCatalogItem.price;
                sourceItem.catalogQuantity = sourceCatalogItem.priceQuantity;
                if (that.isAdjustQuantity && sourceItem.category.type < 3) {  // food category
                  sourceItem.quantity = sourceItem.quantity / sourceNoOfParticipants * targetOrder.noOfParticipants;
                  var r = sourceItem.measurementUnit.rounding;
                  if (!r) {
                    r = 1
                  }
                  sourceItem.quantity = Math.ceil(sourceItem.quantity / r) * r;  // round up
                  // if source item's price has been changed manually, we can't really adjust its price, so set error
                  sourceItem.errors.price = sourceItem.isForcedPrice;
                  }
              }
              var targetItem = targetItems.filter(function (itm) {    // check if product exists in order
                return (itm.catalogId === sourceItem.catalogId) &&
                        (itm.isFreeItem === sourceItem.isFreeItem) &&
                        !itm.isDescChanged && !sourceItem.isDescChanged &&
                        itm.category.type < 3; // keep non food items separate for easier manual inspection
              })[0];
              if (targetItem) {
                targetItem.quantity += sourceItem.quantity;   // exists, just update quantity
                // while merging two items, if one of them is forced price, set error to investigate manually
                targetItem.isForcedPrice = targetItem.errors.price =
                  sourceItem.isForcedPrice || targetItem.isForcedPrice;
                if (sourceItem.isForcedPrice) { // add forced source price to target.
                  targetItem.priceInclVat += sourceItem.priceInclVat;
                  targetItem.priceBeforeVat = targetItem.priceInclVat / (1 + targetOrder.vatRate);
                  if (targetOrder.isBusinessEvent) {
                    targetItem.price = targetItem.priceBeforeVat;
                  } else {
                    targetItem.price = targetItem.priceInclVat;
                  }
                }
              } else {
                var maxIndex = targetItems.length === 0 ? 0 : Math.max.apply(null, targetItems.map(function (itm) {
                  return itm.index
                })) + 1;
                targetItems.splice(0, 0, angular.copy(sourceItem)); // initialize new item as copied one
                targetItem = targetItems[0];
                targetItem.index = maxIndex;  // override original index
              }
              // now adjust price
              if (!targetItem.isForcedPrice) {
                targetItem.priceInclVat = targetItem.quantity * targetItem.catalogPrice / targetItem.catalogQuantity;
                targetItem.priceBeforeVat = targetItem.priceInclVat / (1 + targetOrder.vatRate);
                if (targetOrder.isBusinessEvent) {
                  targetItem.price = targetItem.priceBeforeVat;
                } else {
                  targetItem.price = targetItem.priceInclVat;
                }
              }
              if (targetItem.errors.price) {
                isPriceConflict = true;
              }
              targetItem.boxCount = targetItem.quantity * targetItem.productionBoxCount / targetItem.productionQuantity;
              targetItem.satietyIndex = targetItem.quantity * targetItem.productionSatietyIndex / targetItem.productionQuantity;
              targetItem.isChanged = true;
            }
          });
          if (isPriceConflict) {
            alert('קיימת בעיה של מחירים קבועים בתבנית המועתקת. בדוק שגיאות מסומנות בשדה המחיר')
          }
          orderService.calcSubTotal(targetQuote, targetOrder.isBusinessEvent, targetOrder.vatRate);
          orderService.quoteChanged(that.order);
        });
    };



  });
