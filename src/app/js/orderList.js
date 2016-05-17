'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderListCtrl', function ($rootScope, $state, $modal, api, lov, today, customers, eventTypes) {
    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - רשימת אירועים';

    var fetchedOrders = [];

//  filters fetchedOrders according to different criteria and sorts on ascending/descending eventDate depending on future events only flag
//  function is called from ng-change of criteria controls, as well as from initialization code below
    this.filterOrders = function () {
      var that = this;
        this.orders = fetchedOrders.filter(function (ord) {
          return (!that.filterByCustomer.id ||
            ord.attributes.customer === that.filterByCustomer.id ||
            ord.attributes.contact === that.filterByCustomer.id) &&
            (!that.filterByStatus || ord.attributes.orderStatus === that.filterByStatus.id)
        });

      if (!this.isIncludecanceled) {
        this.orders = this.orders.filter(function (ord) {
          return ord.attributes.orderStatus!==6
        })
      }

      this.orders.sort(function (a, b) {
        if (that.queryType === 'future') {
          return a.attributes.eventDate - b.attributes.eventDate;
        } else {
          return b.attributes.eventDate - a.attributes.eventDate;
        }
      })
    };

//  enrich order with info on customers etc.
    this.enrichOrders = function () {
      for (var i = 0; i < fetchedOrders.length; i++) {
        fetchedOrders[i].view = {};
        fetchedOrders[i].view.customer = customers.filter(function (cust) {
          return cust.id === fetchedOrders[i].attributes.customer;
        })[0];
        fetchedOrders[i].view.eventType = eventTypes.filter(function (typ) {
          return typ.tId === fetchedOrders[i].attributes.eventType;
        })[0];
        fetchedOrders[i].view.orderStatus = lov.orderStatuses.filter(function (stat) {
          return stat.id === fetchedOrders[i].attributes.orderStatus;
        })[0];
        fetchedOrders[i].view.isReadOnly = fetchedOrders[i].attributes.eventDate < today;
      }
      this.filterOrders();
    };

    this.setQuery = function () {
      var that = this;
      this.orders = [];
      var fieldList = [
        'orderStatus','noOfParticipants','eventDate','customer','eventTime','number',
        'exitTime','eventType','template','header'
      ];
      var t0 = new Date();
      switch (this.queryType) {
        case 'future':
          api.queryFutureOrders(fieldList).then(function (orders) {
            console.log (that.queryType+': '+(new Date()-t0).toString());
            fetchedOrders = orders;
            that.enrichOrders();
          });
          break;
        case 'templates':
          api.queryTemplateOrders(fieldList).then(function (orders) {
            console.log (that.queryType+': '+(new Date()-t0).toString());
            fetchedOrders = orders;
            that.enrichOrders();
          });
          break;
        case 'past':
          api.queryPastOrders(fieldList).then(function (orders) {
            console.log (that.queryType+': '+(new Date()-t0).toString());
            fetchedOrders = orders;
            that.enrichOrders();
          });
          break;
        case 'debts':
          api.queryPastOrders(fieldList).then(function (orders) {
            console.log (that.queryType+': '+(new Date()-t0).toString());
            fetchedOrders = orders.filter(function (ord) {
              return ord.attributes.orderStatus===3 || ord.attributes.orderStatus===4; // executed events not fully paid
            });
            that.enrichOrders();
          });
          break;
        case 'all':
          api.queryAllOrders(fieldList).then(function (orders) {
            console.log (that.queryType+': '+(new Date()-t0).toString());
            console.log(orders[0]);
            fetchedOrders = orders;
            that.enrichOrders();
          });
          break;

      }
     };

    this.setCustomerFilter = function () {
      var that = this;

      var selectCustomer = $modal.open({
        templateUrl: 'app/partials/modalCustomer.html',
        controller: 'ModalCustomerCtrl as modalCustomerModel',
        resolve: {
          customers: function () {
            return customers;
          },
          currentCustomerId: function () {
            return that.filterByCustomer.id;
          },
          modalHeader: function () {
            return 'בחירת לקוח לסינון';
          },
          isOptionalSelect: function () {
            return true;  // if user returns without selection, filter is cleared
          }
        },
        size: 'lg'
      });

      selectCustomer.result.then(function (cust) {
        that.filterByCustomer = cust; // if no customer selected, empty object is returned
        that.filterOrders();
      }), function () {
      };

    };

    this.setStatusFilter = function() {
      this.filterOrders();
    };

    this.setStatus = function (order) {
      order.attributes.orderStatus = order.view.orderStatus.id;
      api.saveObj(order);
    };

    this.getLastBid = function (order) {
      api.queryBidsByOrder(order.id)
        .then(function (bids) {
          if (bids.length > 0) {
            //                 $state.go("bid",{id:bids[0].attributes.uuid})
            window.open("#/bid/" + bids[0].attributes.uuid, "_blank");
          } else {
            alert('אין הצעות מחיר לאירוע')
          }
        })

    };

    this.newOrder = function () {
      $state.go('newOrder');
    };


    this.filterByCustomer = {};
    this.orderStatuses = lov.orderStatuses;
    this.queryType = 'future';
    this.setQuery();


  });

