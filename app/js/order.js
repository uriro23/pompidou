'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function(api, $state, $filter, currentOrder, today, lov, customers, eventTypes, bidTextTypes) {
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

// test if existing order or new one
   if (currentOrder) {
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
   } else {
     this.order = api.initOrder();
     this.currentOrderCustomer = {};
//     this.eventDate = $filter('date')(new Date(),'yyyy-MM-dd');
     this.eventDate = today;
     this.order.attributes.noOfParticipants = 0;
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
      return api.saveObj (this.order).then (function (obj) {
        if ($state.current.name === 'newOrder') {
          $state.go ('editOrder',{id:obj.id});
        }
      })
    };

    this.deleteOrder = function () {
      return api.deleteObj (this.order).then (function (obj) {
        $state.go('orderList');
      })
     };
  });




