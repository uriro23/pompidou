'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function(api, $state, $filter,
                                    currentOrder, today, utils, lov, customers, eventTypes,
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



      this.orderChanged = function () {
        this.isChanged = true;
      };

    // general tab
    this.setCustomer = function () {
      this.orderChanged();
      this.errors.customer = false;
    };

    this.setEventDate = function () {
      var thisOrder = this.order.attributes;
      this.orderChanged();
      this.errors.eventDate = thisOrder.eventDate < new Date();  // past dates not allowed
    };

    this.setNoOfParticipants = function () {
      this.orderChanged();
      this.errors.noOfParticipants = this.noOfParticipants != Number(this.noOfParticipants) ||
          Number(this.noOfParticipants <= 0);
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
        this.isAddItem = false;
        this.filterText = '';
        this.calcSubTotal();
        this.orderChanged();
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
      };

      this.setPrice = function (ind) {
        var thisOrder = this.order.attributes;
        var thisItem = thisOrder.items[ind];
        
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
      };


    // financial tab
// TODO: in converting from access remember in access discount is positive
    this.setDiscountRate = function () {
      var thisOrder = this.order.attributes;

      this.errors.discountRate = Number(thisOrder.discountRate) != thisOrder.discountRate || Number(thisOrder.discountRate) < 0;
      thisOrder.discount =  - thisOrder.subTotal * thisOrder.discountRate / 100;
      this.calcTotal();
      this.orderChanged();
    };

    this.setDiscountCause = function () {
      var thisOrder = this.order.attributes;

      if (this.order.view.discountCause.tId === 0) {
        thisOrder.discount = 0;
      } else {
        this.setDiscountRate();
      }
      this.calcTotal();
      this.orderChanged();
    };

    this.setTransportationBonus = function () {
      var thisOrder = this.order.attributes;

      if (thisOrder.isTransportationBonus) {
        thisOrder.transportationBonus = - thisOrder.transportation;
      } else {
        thisOrder.transportationBonus = 0;
      }
      this.calcTotal();
      this.orderChanged();
    };

    this.setTransportation = function () {
      var thisOrder = this.order.attributes;

      this.errors.transportationInclVat = Number(thisOrder.transportationInclVat) != thisOrder.transportationInclVat ||
        Number(thisOrder.transportationInclVat) < 0;
        if (thisOrder.isBusinessEvent) {
          thisOrder.transportation = thisOrder.transportationInclVat / (1 + thisOrder.vatRate);
        } else {
          thisOrder.transportation = thisOrder.transportationInclVat;
        }
      this.setTransportationBonus();
      this.calcTotal();
      this.orderChanged();
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
        this.setTransportation(); // recalc considering vat reduced or not
        this.calcSubTotal();
        this.orderChanged();
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

    // common
    // ------

//TODO: before saving, check if customer is empty

      this.saveOrder = function () {
        var thisOrder = this.order.attributes;

        // check for errors
        for (var fieldName in this.errors) {
          if (this.errors[fieldName]) {
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

        thisOrder.noOfParticipants = Number(this.noOfParticipants);
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

        // delete errors property in items
        for (i=0;i<thisOrder.items.length;i++) {
          delete thisOrder.items[i].errors;
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
        this.backupOrderAttr = utils.nonRecursiveClone(this.order.attributes);
        this.backupOrderView = utils.nonRecursiveClone(this.order.view);
        this.isChanged = false;
      };

      this.deleteOrder = function () {
        return api.deleteObj (this.order).then (function (obj) {
          $state.go('orderList');
        })
       };

    this.cancel = function () {
      this.order.attributes = utils.nonRecursiveClone(this.backupOrderAttr);
      this.order.view = utils.nonRecursiveClone(this.backupOrderView);
      this.isChanged = false;
    };



    // main block
    var i;
    this.isNewOrder = $state.current.name === 'newOrder';
    this.eventTypes = eventTypes;
    this.bidTextTypes = bidTextTypes;
    this.orderStatuses = lov.orderStatuses;
    this.categories = categories;
    this.currentCategory = this.categories[0];
    this.measurementUnits = measurementUnits;
    this.discountCauses = discountCauses;
    this.vatRate = vat[0].vatRate;
    this.today = today;
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
    this.errors = {};


    if ($state.current.name === 'editOrder') {
      var that = this;
      this.order = currentOrder;
      this.order.view = {};
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
// TODO: change alert to modal, give option to accept/decline new rate and if accepted, to change prices (yes or no)
      if (this.order.attributes.vatRate != this.vatRate) {
        alert ("VAT rate changed from "+ this.order.attributes.vatRate + " to " + this.vatRate);
        this.order.attributes.vatRate = this.vatRate;
      }
    }  else { // new order
      this.order = api.initOrder();
      this.order.view = {};
      this.order.view.customer = {};
     this.order.attributes.eventDate = new Date();
      this.noOfParticipants = 1;
      this.order.view.orderStatus = this.orderStatuses[0]; // set to "New"
      this.order.view.discountCause = this.discountCauses[0]; // set to "no"
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
      this.errors.customer = true; // empty customer is error
    }
    this.calcSubTotal();

    // TODO: change clone to to deep cloning except for selection items which should be copied as references to same item
    // we clone (rather than just assign) so we get a new copy and not a ref to the same object, so the backup is not updated
    // when the order is.
    // we use non recursive clone (just the top level of the object) so that embedded objects still reference the same thing
    // e.g. the embedded customer object backupOrderView must point to the same object as the customer object in order.view
    // or else the select tag on the page won't work.
    this.backupOrderAttr = utils.nonRecursiveClone(this.order.attributes);
    this.backupOrderView = utils.nonRecursiveClone(this.order.view);
    this.isChanged = false;


  });




