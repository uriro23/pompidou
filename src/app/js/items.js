'use strict';

angular.module('myApp')
  .controller('ItemsCtrl', function ($scope, api, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;
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
            if (a.productDescription > b.productDescription) {
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

    this.itemChanged = function (ind) {
       var thisItem = this.order.view.quote.items[ind];
      orderService.quoteChanged(this.order);
      thisItem.isChanged = true;
    };

    this.filterProducts = function () {
      var that = this;
      this.filteredCatalog = this.baseCatalog.filter(function (cat) {
        return cat.productDescription.indexOf(that.filterText) > -1;
      })
    };

    this.setProduct = function (catalogEntry) {
      var that = this;
      var thisOrder = this.order.attributes;
      var thisQuote = this.order.view.quote;
      var orderItems = thisQuote.items;

      var maxIndex = orderItems.length === 0 ? 0 : Math.max.apply(null, orderItems.map(function (itm) {
        return itm.index
      })) + 1;

      orderItems.splice(0, 0, {});
      var thisItem = orderItems[0];
      thisItem.index = maxIndex;
      thisItem.category = this.categories.filter(function (cat) {
        return cat.tId === catalogEntry.category;
      })[0];
      thisItem.catalogId = catalogEntry.id;
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

      thisItem.errors.productDescription = !Boolean(thisItem.productDescription);
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
      api.queryTemplateOrders(['template','noOfParticipants'])
        .then(function (temps) {
          that.templates = temps;
          that.templates.sort(function (a, b) {
            return a.attributes.template < b.attributes.template ? -1 : 1
          })
        })
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
      var thisOrder = this.order.attributes;
      var thisQuote = this.order.view.quote;
      var orderItems = thisQuote.items;
      api.queryOrder (template.id)
        .then(function (tmpl) {
          var templateItems = tmpl[0].attributes.quotes[tmpl[0].attributes.activeQuote].items;
          var templateCatalogIds = templateItems.map(function (itm) {
            return itm.catalogId
          });
          api.queryCatalogByIds(templateCatalogIds)
            .then(function (cat) {
              var templateCatalogItems = cat.filter(function (c) {
                return !c.attributes.isDeleted
              });
              templateCatalogItems = templateCatalogItems.map(function (c) {
                var ct = c.attributes;
                ct.id = c.id;
                return ct
              });
              for (var j = 0; j < templateItems.length; j++) {
                var templateItem = templateItems[j];
                var templateCatalogItem = templateCatalogItems.filter(function (cat) {
                  return cat.id === templateItem.catalogId
                })[0];
                if (!templateCatalogItem) {
                  alert('מנה ' + templateItem.productDescription + ' לא נמצאת בקטלוג. מדלג עליה')
                } else {   // fetch up to date price from catalog
                  templateItem.catalogPrice = templateCatalogItem.price;
                  templateItem.catalogQuantity = templateCatalogItem.priceQuantity;
                  if (that.isAdjustQuantity) {
                    templateItem.quantity = templateItem.quantity /
                    tmpl[0].attributes.noOfParticipants *
                    thisOrder.noOfParticipants;
                    var r = templateItem.measurementUnit.rounding;
                    if (!r) {
                      r = 1
                    }
                    templateItem.quantity = Math.ceil(templateItem.quantity / r) * r;  // round up
                  }
                  var thisItem = orderItems.filter(function (itm) {    // check if product exists in order
                    return itm.catalogId === templateItem.catalogId;
                  })[0];
                  if (thisItem) {
                    thisItem.quantity += templateItem.quantity;   // exists, just update quantity
                  } else {
                    var maxIndex = orderItems.length === 0 ? 0 : Math.max.apply(null, orderItems.map(function (itm) {
                      return itm.index
                    })) + 1;
                    orderItems.splice(0, 0, templateItem); // initialize new item as copied one
                    thisItem = orderItems[0];
                    thisItem.index = maxIndex;  // override original index
                  }
                  // now adjust price
                  thisItem.priceInclVat = thisItem.quantity * thisItem.catalogPrice / thisItem.catalogQuantity;
                  thisItem.priceBeforeVat = thisItem.priceInclVat / (1 + thisOrder.vatRate);
                  if (thisOrder.isBusinessEvent) {
                    thisItem.price = thisItem.priceBeforeVat;
                  } else {
                    thisItem.price = thisItem.priceInclVat;
                  }
                  thisItem.boxCount = thisItem.quantity * thisItem.productionBoxCount / thisItem.productionQuantity;
                  thisItem.satietyIndex = thisItem.quantity * thisItem.productionSatietyIndex / thisItem.productionQuantity;
                  thisItem.isChanged = true;
                }
              }
              orderService.calcSubTotal(thisQuote, that.order.attributes.isBusinessEvent, that.order.attributes.vatRate);
              orderService.quoteChanged(that.order);
              that.isAddTemplate = false;
            });

        });
   };



  });
