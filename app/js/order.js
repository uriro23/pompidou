'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function(api, $state, $filter, currentOrder, today, lov, customers, eventTypes, bidTextTypes) {
   this.isNewOrder = $state.current.name === 'newOrder';
   this.eventTypes = eventTypes;
   this.bidTextTypes = bidTextTypes;
   this.orderStatuses = lov.orderStatuses;
   this.today = today;
   this.customers = customers;
   this.customerList = customers.map (function (cust) {
     var custDetail = cust.attributes;
     custDetail.id = cust.id;
     return custDetail;
   });

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
//  we do this in 5 steps by chaining 'then's
      if ($state.current.name === 'newOrder') {
        var that = this;
//  I. query OrderNum class containing single counter object
        var orderNumQuery = new Parse.Query('OrderNum');
        return api.queryOrderNum()
//  II. bump counter and assign it to order
          .then(function (results) {
            that.order.attributes.number = results[0].attributes.lastOrder + 1;
            results[0].attributes.lastOrder = that.order.attributes.number;
            return results[0];
          })
//  III. save updated OrderNum object
          .then (function (orderNum) {
            return api.saveObj (orderNum);
          })
//  IV. save order
          .then (function () {
            return api.saveObj (that.order);
          })
//  V. change state to editOrder
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




