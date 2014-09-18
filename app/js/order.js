'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function(api, $state, $filter,
                                    currentOrder, today, utils, lov, customers, eventTypes,
                                    bidTextTypes, categories, measurementUnits, discountCauses, vat) {

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
       this.eventDate = $filter('date')(this.order.attributes.eventDate,'yyyy-MM-dd');
       if (this.order.attributes.vatRate != this.vatrate) {
         alert ("VAT rate changed from "+ this.order.attributes.vatRate + " to " + this.vatRate);
         this.order.attributes.vatRate = this.vatRate;
       }
    }  else { // new order
       this.order = api.initOrder();
       this.order.view = {};
       this.order.view.customer = {};
       this.eventDate = today;
       this.order.attributes.noOfParticipants = 1;
       this.order.view.orderStatus = this.orderStatuses[0]; // set to "New"
       this.order.view.discountCause = this.discountCauses[0]; // set to "no"
       this.order.attributes.includeRemarksInBid = false;
       this.order.attributes.items = [];
       this.order.attributes.vatRate = this.vatRate;
     }
    // we clone (rather than just assign) so we get a new copy and not a ref to the same object, so the backup is not updated
    // when the order is.
    // we use non recursive clone (just the top level of the object) so that embedded objects still reference the same thing
    // e.g. the embedded customer object backupOrderView must point to the same object as the customer object in order.view
    // or else the select tag on the page won't work.
     this.backupOrderAttr = utils.nonRecursiveClone(this.order.attributes);
     this.backupOrderView = utils.nonRecursiveClone(this.order.view);
     this.isChanged = false;

      this.orderChanged = function () {
        this.isChanged = true;
      };

      this.cancel = function () {
        this.order.attributes = utils.nonRecursiveClone(this.backupOrderAttr);
        this.order.view = utils.nonRecursiveClone(this.backupOrderView);
        this.isChanged = false;
      };

    // TODO: handle VAT
      this.calcTotal = function () {
        var t = this.order.attributes.subTotal +
                this.order.attributes.discount +
                this.order.attributes.transportation +
                this.order.attributes.transportationBonus;
        var r = Math.round(t);
        this.order.attributes.rounding = r - t;
        this.order.attributes.totalBeforeVat = r;
        this.order.attributes.vat = 0;
        this.order.attributes.total = this.order.attributes.totalBeforeVat + this.order.attributes.vat;
      };

      this.calcSubTotal = function () {
        var t = 0;
        for (var i=0;i<this.order.attributes.items.length;i++) {
          t += this.order.attributes.items[i].price;
        }
        this.order.attributes.subTotal = t;
        this.calcTotal();
      };

      this.setCategory = function () {
        var that = this;
        return api.queryCatalogByCategory (this.currentCategory.tId)
          .then (function (cat) {
            that.catalogData = cat.map (function (c) {
              var cc = c.attributes;
              cc.id = c.id;
              return cc;
            });
            that.catalogData.sort (function (a,b) {
              if (a.productDescription > b.productDescription) {
                return 1
              } else {
                return -1
              }
            });
            that.filteredCatalog = that.catalogData;
           })
      };

      this.addItem = function () {
        this.isAddItem = true;
        this.setCategory();
      };

      this.deleteItem = function (ind) {
        this.order.attributes.items.splice(ind,1);
        this.isChanged = true;
      };

      this.filterProducts = function () {
        var that = this;
        this.filteredCatalog = this.catalogData.filter(function (cat) {
          return cat.productDescription.indexOf (that.filterText)> -1;
        })
      };

      this.setProduct = function (catalogEntry) {
        this.order.attributes.items.splice(0,0,{});
        this.order.attributes.items[0].category = this.categories.filter(function (cat) {
            return cat.tId === catalogEntry.category;
        })[0];
        this.order.attributes.items[0].productDescription = catalogEntry.productDescription;
        this.order.attributes.items[0].measurementUnit = this.measurementUnits.filter(function (mes) {
          return mes.tId === catalogEntry.measurementUnit;
        })[0];
        this.order.attributes.items[0].catalogQuantity = catalogEntry.priceQuantity;  // for price computation
        this.order.attributes.items[0].quantity = catalogEntry.priceQuantity; // as default quantity
        this.order.attributes.items[0].catalogPrice = catalogEntry.price; // for price computation
        this.order.attributes.items[0].price = catalogEntry.price;  // as default price
        this.isAddItem = false;
        this.calcSubTotal();
        this.orderChanged();
      }

      this.setQuantity = function (ind) {
        if (Number(this.order.attributes.items[ind].quantity) !== this.order.attributes.items[ind].quantity) {
          this.order.attributes.items[ind].quantity = 0;
          this.order.attributes.items[ind].price = 0;
        } else {
          this.order.attributes.items[ind].price =
            this.order.attributes.items[ind].quantity *
            this.order.attributes.items[ind].catalogPrice /
            this.order.attributes.items[ind].catalogQuantity;
        };
        this.calcSubTotal();
        this.orderChanged();
      };

      this.setPrice = function () {
        this.calcSubTotal();
        this.orderChanged();
      };

      this.setFreeItem = function (ind) {
        if (this.order.attributes.items[ind].isFreeItem) {
          this.order.attributes.items[ind].price = 0;
        } else {
          this.order.attributes.items[ind].price =
            this.order.attributes.items[ind].quantity *
            this.order.attributes.items[ind].catalogPrice /
            this.order.attributes.items[ind].catalogQuantity;
        }
        this.calcSubTotal();
        this.orderChanged();
      };

// TODO: in converting from access remember in access discount is positive
    this.setDiscount = function () {
      if (Number(this.order.attributes.discountRate) !== this.order.attributes.discountRate) {
        this.order.attributes.discountRate = 0;
        this.order.attributes.discount = 0;
      } else {
        this.order.attributes.discount =  - this.order.attributes.subTotal * this.order.attributes.discountRate / 100;
      }
      this.calcTotal();
      this.orderChanged();
    };

    this.setDiscountCause = function () {
      if (this.order.view.discountCause.tId === 0) {
        this.order.attributes.discount = 0;
      } else {
        this.setDiscount();
      }
      this.calcTotal();
      this.orderChanged();
    };

    this.setTransportationBonus = function () {
      if (this.order.attributes.isTransportationBonus) {
        this.order.attributes.transportationBonus = - this.order.attributes.transportation;
      } else {
        this.order.attributes.transportationBonus = 0;
      }
      this.calcTotal();
      this.orderChanged();
    };

    this.setTransportation = function () {
      if (Number(this.order.attributes.transportationInclVat) !== this.order.attributes.transportationInclVat) {
        this.order.attributes.transportationInclVat = 0;
        this.order.attributes.transportation = 0;
      } else {
        this.order.attributes.transportation = this.order.attributes.transportationInclVat;
        // TODO: reduce vat
      }
      this.setTransportationBonus();
      this.calcTotal();
      this.orderChanged();
    };

      this.saveOrder = function () {
        this.order.attributes.eventDate = new Date(this.eventDate);
        this.order.attributes.noOfParticipants = Number(this.order.attributes.noOfParticipants);
        if (this.order.view.eventType) {
          this.order.attributes.eventType = this.order.view.eventType.tId;
        }
        if (this.order.view.startBidTextType) {
          this.order.attributes.startBidTextType = this.order.view.startBidTextType.tId;
        }
        if (this.order.view.endBidTextType) {
          this.order.attributes.endBidTextType = this.order.view.endBidTextType.tId;
        }
        if (this.order.view.discountCause) {
          this.order.attributes.discountCause = this.order.view.discountCause.tId;
        }
        this.order.attributes.customer = this.order.view.customer.id;
        this.order.attributes.orderStatus = this.order.view.orderStatus.id;

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
    });




