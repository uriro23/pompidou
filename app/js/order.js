'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function(api, $state, $filter,
                                    currentOrder, today, lov, customers, eventTypes,
                                    bidTextTypes, categories, measurementUnits) {
   this.isNewOrder = $state.current.name === 'newOrder';
   this.eventTypes = eventTypes;
   this.bidTextTypes = bidTextTypes;
   this.orderStatuses = lov.orderStatuses;
   this.categories = categories;
   this.currentCategory = this.categories[0];
   this.measurementUnits = measurementUnits;
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
       this.order = currentOrder;
       var tempCustomer = customers.filter(function (cust) {
           return cust.id === currentOrder.attributes.customer;
       })[0];
       this.currentOrderCustomer = tempCustomer.attributes;
       this.currentOrderCustomer.id = tempCustomer.id;
       this.currentEventType = eventTypes.filter(function (obj) {
         return (obj.tId === currentOrder.attributes.eventType);
       })[0];
       this.currentStartBidTextType = bidTextTypes.filter(function (obj) {
         return (obj.tId === currentOrder.attributes.startBidTextType);
       })[0];
       this.currentEndBidTextType = bidTextTypes.filter(function (obj) {
         return (obj.tId === currentOrder.attributes.endBidTextType);
       })[0];
        this.currentOrderStatus = this.orderStatuses.filter (function (obj) {
           return (obj.id === currentOrder.attributes.orderStatus);
       })[0];
       this.eventDate = $filter('date')(this.order.attributes.eventDate,'yyyy-MM-dd');
   } else { // new order
       this.order = api.initOrder();
       this.currentOrderCustomer = {};
       this.eventDate = today;
       this.order.attributes.noOfParticipants = 1;
       this.currentOrderStatus = this.orderStatuses[0]; // set to "New"
       this.includeRemarksInBid = false;
       this.order.attributes.items = [];
   }

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
    }

    this.addItem = function () {
      this.isAddItem = true;
      this.setCategory();
    }

    this.deleteItem = function (ind) {
      this.order.attributes.items.splice(ind,1);
    }

    this.filterProducts = function () {
      var that = this;
      this.filteredCatalog = this.catalogData.filter(function (cat) {
        return cat.productDescription.indexOf (that.filterText)> -1;
      })
    }

    this.setProduct = function (catalogEntry) {
      this.order.attributes.items.splice(0,0,{});
      this.order.attributes.items[0].category = this.categories.filter(function (cat) {
          return cat.tId === catalogEntry.category;
      })[0];
      this.order.attributes.items[0].productDescription = catalogEntry.productDescription;
      this.order.attributes.items[0].measurementUnit = this.measurementUnits.filter(function (mes) {
        return mes.tId === catalogEntry.measurementUnit;
      })[0];
      this.order.attributes.items[0].quantity = catalogEntry.priceQuantity;
      this.order.attributes.items[0].price = catalogEntry.price;
      this.isAddItem = false;
    }

    this.submitOrder = function (isValid) {
        if (isValid) {
          this.saveOrder ();
        } else {
          alert ('הזמנה לא תקינה');
        }
    }

    this.saveOrder = function () {
      this.order.attributes.eventDate = new Date(this.eventDate);
      this.order.attributes.noOfParticipants = Number(this.order.attributes.noOfParticipants);
      if (this.currentEventType) {
        this.order.attributes.eventType = this.currentEventType.tId;
      }
      if (this.currentStartBidTextType) {
        this.order.attributes.startBidTextType = this.currentStartBidTextType.tId;
      }
      if (this.currentEndBidTextType) {
        this.order.attributes.endBidTextType = this.currentEndBidTextType.tId;
      }
      this.order.attributes.customer = this.currentOrderCustomer.id;
      this.order.attributes.orderStatus = this.currentOrderStatus.id;

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
//      return api.saveObj (this.order).then (function (obj) {
//        if ($state.current.name === 'newOrder') {
//          $state.go ('editOrder',{id:obj.id});
//        }
//      })
    };

    this.deleteOrder = function () {
      return api.deleteObj (this.order).then (function (obj) {
        $state.go('orderList');
      })
     };
  });




