'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function(api, $state, $filter,
                                    currentOrder, bids, utils, lov, customers, eventTypes,
                                    bidTextTypes, categories, measurementUnits, discountCauses, vat) {


    this.calcTotal = function () {
      var thisOrder = this.order.attributes;

      var t = thisOrder.subTotal + thisOrder.discount + thisOrder.transportation + thisOrder.transportationBonus;
      if (thisOrder.isBusinessEvent) {
        var v = t * thisOrder.vatRate;
      } else {
        v = 0;
      }
      thisOrder.total = Math.round(t+v);
      if (thisOrder.isBusinessEvent) {
        thisOrder.totalBeforeVat =  thisOrder.total / (1 + thisOrder.vatRate);
      } else {
        thisOrder.totalBeforeVat =  thisOrder.total;
      }
      thisOrder.rounding = thisOrder.totalBeforeVat - t;
      thisOrder.vat = thisOrder.total - thisOrder.totalBeforeVat;
    };

    this.calcSubTotal = function () {
      var thisOrder = this.order.attributes;

      var t = 0;
      for (i=0;i<thisOrder.items.length;i++) {
        t += thisOrder.items[i].price;
      }
      thisOrder.subTotal = t;
      thisOrder.discount = -(t * thisOrder.discountRate / 100);
      this.calcTotal();
    };



      this.orderChanged = function (field) {
        this.order.view.isChanged = true;
        if (field) {
          this.order.view.changes[field] = true;
        }
      };

    // order header
    this.setCustomer = function () {
      var thisOrder = this.order.attributes;
      this.orderChanged('customer');
      this.order.view.errors.customer = false;
    };

    this.setEventDate = function () {
      var thisOrder = this.order.attributes;
      this.orderChanged('header');
      this.order.view.errors.eventDate = thisOrder.eventDate < new Date();  // past dates not allowed
    };

    this.setNoOfParticipants = function () {
      var thisOrder = this.order.attributes;
      this.orderChanged('header');
      this.order.view.errors.noOfParticipants = !Boolean(thisOrder.noOfParticipants) || thisOrder.noOfParticipants <= 0;
    };

    // items tab
     this.setCategory = function () {
        var that = this;
        var thisOrder = this.order.attributes;
        return api.queryCatalogByCategory (this.currentCategory.tId)
          .then (function (cat) {
            that.catalogData = cat.map (function (c) {
              var cc = c.attributes;
              cc.id = c.id;
              return cc;
            });
            // exclude items already in order
            that.filteredCatalog = that.catalogData.filter(function (cat) {
              for (i=0;i<thisOrder.items.length;i++) {
                if (thisOrder.items[i].catalogId === cat.id) {
                  return false;
                }
              }
              return true;
            });
            that.filteredCatalog.sort (function (a,b) {
              if (a.productDescription > b.productDescription) {
                return 1
              } else {
                return -1
              }
            });
            that.filterText = '';
           })
      };

      this.addItem = function () {
        this.isAddItem = true;
        this.setCategory();
      };

      this.deleteItem = function (ind) {
        this.order.attributes.items.splice(ind,1);
        this.orderChanged();
      };

      this.filterProducts = function () {
        var that = this;
        this.filteredCatalog = this.catalogData.filter(function (cat) {
          return cat.productDescription.indexOf (that.filterText)> -1;
        })
      };

      this.setProduct = function (catalogEntry) {
        var thisOrder = this.order.attributes;

        thisOrder.items.splice(0,0,{});
 
        var thisItem = thisOrder.items[0];
 
        thisItem.category = this.categories.filter(function (cat) {
            return cat.tId === catalogEntry.category;
        })[0];
        thisItem.catalogId = catalogEntry.id;
        thisItem.productDescription = catalogEntry.productDescription;
        thisItem.measurementUnit = this.measurementUnits.filter(function (mes) {
          return mes.tId === catalogEntry.measurementUnit;
        })[0];
        thisItem.catalogQuantity = catalogEntry.priceQuantity;  // for price computation
        thisItem.quantity = catalogEntry.priceQuantity; // as default quantity
        thisItem.catalogPrice = catalogEntry.price; // for price computation
        thisItem.priceInclVat = catalogEntry.price;  // prices in catalog include vat
        thisItem.priceBeforeVat = catalogEntry.price / (1 + thisOrder.vatRate);
        if (thisOrder.isBusinessEvent) {
          thisItem.price = thisItem.priceBeforeVat;
        } else {
          thisItem.price = thisItem.priceInclVat;
        }
        thisItem.errors = {}; // initialize errors object for new item
        thisItem.isChanged = true;
        this.isAddItem = false;
        this.filterText = '';
        this.calcSubTotal();
        this.orderChanged();
      };

      this.setProductDescription = function (ind) {
        var thisOrder = this.order.attributes;
        var thisItem = thisOrder.items[ind];

        thisItem.errors.productDescription = !Boolean(thisItem.productDescription);
        this.orderChanged();
        thisItem.isChanged = true;
      };

      this.setQuantity = function (ind) {
        var thisOrder = this.order.attributes;
        var thisItem = thisOrder.items[ind];
        
        thisItem.errors.quantity = Number(thisItem.quantity) != thisItem.quantity || Number(thisItem.quantity) < 0;
          thisItem.priceInclVat = thisItem.quantity * thisItem.catalogPrice / thisItem.catalogQuantity;
          thisItem.priceBeforeVat = thisItem.priceInclVat / (1 + thisOrder.vatRate);
          if (thisOrder.isBusinessEvent) {
            thisItem.price = thisItem.priceBeforeVat;
          } else {
            thisItem.price = thisItem.priceInclVat;
          }
        this.calcSubTotal();
        this.orderChanged();
        thisItem.isChanged = true;
      };

      this.priceChanged = function(ind) {
        this.order.attributes.items[ind].isPriceChanged = true;
      };

      this.setPrice = function (ind) {
        var thisOrder = this.order.attributes;
        var thisItem = thisOrder.items[ind];

        if (!thisItem.isPriceChanged) {
          return;
        }
        thisItem.errors.price = Number(thisItem.price) != thisItem.price || Number(thisItem.price) < 0;
        if (thisOrder.isBusinessEvent) {
          thisItem.priceInclVat = thisItem.price * (1 + thisOrder.vatRate);
          thisItem.priceBeforeVat = thisItem.price;
        } else {
          thisItem.priceInclVat = thisItem.price;
          thisItem.priceBeforeVat = thisItem.price / (1 + thisOrder.vatRate);
        }
        this.calcSubTotal();
        this.orderChanged();
        thisItem.isChanged = true;
        thisItem.isPriceChanged = false;
      };

      this.setFreeItem = function (ind) {
        var thisOrder = this.order.attributes;
        var thisItem = thisOrder.items[ind];

        if (thisItem.isFreeItem) {
          thisItem.price = 0;
          thisItem.priceInclVat = 0;
          thisItem.priceBeforeVat = 0;
        } else {
          this.setQuantity(ind);
        }
        this.calcSubTotal();
        this.orderChanged();
        thisItem.isChanged = true;
      };


    // financial tab
// TODO: in converting from access remember in access discount is positive
    this.setDiscountRate = function () {
      var thisOrder = this.order.attributes;

      this.order.view.errors.discountRate = Number(thisOrder.discountRate) != thisOrder.discountRate || Number(thisOrder.discountRate) < 0;
      thisOrder.discount =  - thisOrder.subTotal * thisOrder.discountRate / 100;
      this.calcTotal();
      this.orderChanged('discountRate');
    };

    this.setDiscountCause = function () {
      var thisOrder = this.order.attributes;

      if (this.order.view.discountCause.tId === 0) {
        thisOrder.discount = 0;
      } else {
        this.setDiscountRate();
      }
      this.calcTotal();
      this.orderChanged('discountCause');
    };

    this.setTransportationBonus = function () {
      var thisOrder = this.order.attributes;

      if (thisOrder.isTransportationBonus) {
        thisOrder.transportationBonus = - thisOrder.transportation;
      } else {
        thisOrder.transportationBonus = 0;
      }
      this.calcTotal();
      this.orderChanged('isTransportationBonus');
    };

    this.setTransportation = function (doIt) {
      var thisOrder = this.order.attributes;

      if (!doIt) {
        return;
      }
      this.order.view.errors.transportationInclVat = Number(thisOrder.transportationInclVat) != thisOrder.transportationInclVat ||
        Number(thisOrder.transportationInclVat) < 0;
        if (thisOrder.isBusinessEvent) {
          thisOrder.transportation = thisOrder.transportationInclVat / (1 + thisOrder.vatRate);
        } else {
          thisOrder.transportation = thisOrder.transportationInclVat;
        }
      this.setTransportationBonus();
      this.calcTotal();
      this.orderChanged('transportationInclVat');
      this.isTransportationChanged = false;
    };

      this.setBusinessEvent = function () {
        var thisOrder = this.order.attributes;

        if (thisOrder.isBusinessEvent) {
          for (i=0;i<thisOrder.items.length;i++) {
            thisOrder.items[i].price = thisOrder.items[i].priceBeforeVat;
          }
        } else {
          for (i=0;i<thisOrder.items.length;i++) {
            thisOrder.items[i].price = thisOrder.items[i].priceInclVat;
          }
        }
        this.setTransportation(true); // recalc considering vat reduced or not
        this.calcSubTotal();
        this.orderChanged('isBusinessEvent');
      };

    // activities tab
    // --------------

    this.addActivity = function () {
      if (this.activityText.length > 0) {
        this.order.attributes.activities.splice(0, 0, {date: new Date(), text: this.activityText});
        this.orderChanged();
      }
    };

    this.delActivity = function (ind) {
      this.order.attributes.activities.splice(ind,1);
      this.orderChanged();
    };

    // bids tab
    // --------

    this.createBid = function() {
      if (this.isChanged) {
        return;
      }
      this.bid = api.initBid();
      this.bid.attributes.orderId = this.order.id;
      this.bid.attributes.date = new Date();
      this.bid.attributes.order = this.order.attributes;
      var that = this;
      return api.saveObj(this.bid)
        .then (function () {
          return api.queryBidsByOrder(that.order.id)
            .then (function (bids) {
              that.bids = bids;
          })
      })
    };

    // common
    // ------

      this.saveOrder = function () {
        var thisOrder = this.order.attributes;

        // check for errors
        for (var fieldName in this.order.view.errors) {
          if (this.order.view.errors[fieldName]) {
            alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
            return;
          }
        }
        // check for errors in items
        for (i=0;i<thisOrder.items.length;i++) {
          var thisItem = thisOrder.items[i];
          for ( fieldName in thisItem.errors) {
            if (thisItem.errors[fieldName]) {
              alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
              return;
            }
          }
        }

        if (this.order.view.eventType) {
          thisOrder.eventType = this.order.view.eventType.tId;
        }
        if (this.order.view.startBidTextType) {
          thisOrder.startBidTextType = this.order.view.startBidTextType.tId;
        }
        if (this.order.view.endBidTextType) {
          thisOrder.endBidTextType = this.order.view.endBidTextType.tId;
        }
        if (this.order.view.discountCause) {
          thisOrder.discountCause = this.order.view.discountCause.tId;
        }
        thisOrder.customer = this.order.view.customer.id;
        thisOrder.orderStatus = this.order.view.orderStatus.id;

        // wipe errors and changes indication from items
        for (i=0;i<thisOrder.items.length;i++) {
          thisOrder.items[i].errors = {};
          thisOrder.items[i].isChanged = false;
        }

          //  if we save a new order for the first time we have to assign it an order number and bump the order number counter
  //  we do this in 4 steps by chaining 'then's
        if ($state.current.name === 'newOrder') {
          var that = this;
  //  I. query OrderNum class containing single counter object
          var orderNumQuery = new Parse.Query('OrderNum');
          return api.queryOrderNum()
  //  II. bump counter and assign it to order
            .then(function (results) {
              that.order.attributes.number = results[0].attributes.lastOrder + 1;
              results[0].attributes.lastOrder = that.order.attributes.number;
              return api.saveObj (results[0]);
            })
  //  III. save order
            .then (function () {
              return api.saveObj (that.order);
            })
  //  IV. change state to editOrder
            .then (function (ord) {
              $state.go ('editOrder',{id:ord.id});
            })
  // if not new order, just save it without waiting for resolve
        } else {
          api.saveObj (this.order);
        }
  //  backup order for future cancel
        this.order.view.isChanged = false;
        this.order.view.changes = {};
        this.backupOrderAttr = angular.copy(this.order.attributes);
      };

      this.deleteOrder = function () {
        return api.deleteObj (this.order).then (function (obj) {
          $state.go('orderList');
        })
       };

    this.setupOrderView = function () {
      this.order.view = {};
      this.order.view.errors = {};
      this.order.view.changes = {};
      if ($state.current.name === 'editOrder') {
        var that = this;
        var tempCustomer = customers.filter(function (cust) {
          return cust.id === that.order.attributes.customer;
        })[0];
        this.order.view.customer = tempCustomer.attributes;
        this.order.view.customer.id = tempCustomer.id;
        this.order.view.eventType = eventTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.eventType);
        })[0];
        this.order.view.startBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.startBidTextType);
        })[0];
        this.order.view.endBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.endBidTextType);
        })[0];
        this.order.view.orderStatus = this.orderStatuses.filter (function (obj) {
          return (obj.id === that.order.attributes.orderStatus);
        })[0];
        this.order.view.discountCause = discountCauses.filter(function (obj) {
          return (obj.tId === that.order.attributes.discountCause);
        })[0];
      } else {
        this.order.view.customer = {};
        this.order.view.orderStatus = this.orderStatuses[0]; // set to "New"
        this.order.view.discountCause = this.discountCauses[0]; // set to "no"
        this.order.view.errors.customer = true; // empty customer is error
        this.order.view.errors.noOfParticipants = true; // empty no of participants is error
      }
    };

    this.cancel = function () {
      console.log(this.order.attributes.items);
      this.order.attributes = this.backupOrderAttr;
      this.setupOrderView();
      console.log(this.order.attributes.items);
    };



    // main block
    var i;
    this.isNewOrder = $state.current.name === 'newOrder'; // used for view heading
    this.bids = bids;
    this.eventTypes = eventTypes;
    this.bidTextTypes = bidTextTypes;
    this.orderStatuses = lov.orderStatuses;
    this.categories = categories;
    this.currentCategory = this.categories[0]; // default to first category
    this.measurementUnits = measurementUnits;
    this.discountCauses = discountCauses;
    this.vatRate = vat[0].vatRate;
    this.customers = customers;
    this.customerList = customers.map (function (cust) {
      var custDetail = cust.attributes;
      custDetail.id = cust.id;
      return custDetail;
    });
    this.isAddItem = false;
    this.filterText='';
    this.activityDate = new Date();
    this.activityText = '';

    if ($state.current.name === 'editOrder') {
      this.order = currentOrder;
      this.setupOrderView();
// TODO: change alert to modal, give option to accept/decline new rate and if accepted, to change prices (yes or no)
      if (this.order.attributes.vatRate != this.vatRate) {
        alert ("VAT rate changed from "+ this.order.attributes.vatRate + " to " + this.vatRate);
        this.order.attributes.vatRate = this.vatRate;
      }
    }  else { // new order
      this.order = api.initOrder();
      this.setupOrderView();
      this.order.attributes.eventDate = new Date();
      this.order.attributes.includeRemarksInBid = false;
      this.order.attributes.items = [];
      this.order.attributes.vatRate = this.vatRate;
      this.order.attributes.subTotal = 0;
      this.order.attributes.discountRate = 0;
      this.order.attributes.discount = 0;
      this.order.attributes.transportationInclVat = 0;
      this.order.attributes.transportation = 0;
      this.order.attributes.transportationBonus = 0;
      this.order.attributes.activities = [];
    }
    this.calcSubTotal();

    this.order.view.isChanged = false;
    this.backupOrderAttr = angular.copy(this.order.attributes);


  });




