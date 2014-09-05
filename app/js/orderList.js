'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderListCtrl', function(api, orders, lov, customers, eventTypes) {
    var allOrders = orders;
    this.isListFuture = true;
    this.isFilterTemplates = false;
    this.customerList = customers.map (function (cust) {
      var custDetail = cust.attributes;
      custDetail.id = cust.id;
      return custDetail;
    });
    this.filterByCustomer = null;

//  filters allOrders according to different criteria and sorts on ascending/descending eventDate depending on future events only flag
//  function is called from ng-change of criteria controls, as well as from initialization code below
    this.filterOrders = function () {
      var that = this;
      this.orders = [];
      for (var i=0;i<allOrders.length;i++){
        if ((!this.isListFuture || allOrders[i].attributes.eventDate > new Date()) &&
            (!this.filterByCustomer || allOrders[i].attributes.customer === this.filterByCustomer.id) &&
            (!this.isFilterTemplates || allOrders[i].attributes.template)
           )  {
          this.orders.push(allOrders[i])
        }
      }
      this.orders.sort (function (a,b) {
        if (that.isListFuture) {
          return a.attributes.eventDate - b.attributes.eventDate;
        } else {
          return b.attributes.eventDate - a.attributes.eventDate;
        }
      })
    }

//  enrich order with info on customers etc.
    for (var i=0;i<allOrders.length;i++) {
      allOrders[i].view = {};
      allOrders[i].view.customer = customers.filter (function (cust) {
        return cust.id === allOrders[i].attributes.customer;
      })[0];
      allOrders[i].view.eventType = eventTypes.filter (function (typ) {
        return typ.tId === allOrders[i].attributes.eventType;
      })[0];
      allOrders[i].view.orderStatus = lov.orderStatuses.filter (function (stat) {
        return stat.id === allOrders[i].attributes.orderStatus;
      })[0];
    }
    this.filterOrders();

  });

