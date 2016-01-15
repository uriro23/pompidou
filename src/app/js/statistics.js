'use strict';

/* Controllers */
angular.module('myApp')
  .controller('StatisticsCtrl', function ($rootScope, lov, api, today) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - סטטיסטיקות';

    this.toDate = today;
    this.fromDate = angular.copy(this.toDate);
    this.fromDate.setFullYear(this.toDate.getFullYear()-1);
    this.fromDate.setDate(1);
    this.filterField = 'eventDate';
    var dateBias;
    this.fetchedOrders = [];
    this.filteredOrders = [];


    //this.loadOrders();

    this.loadOrders = function() {
      var that = this;

      dateBias = this.fromDate.getFullYear()*12 + this.fromDate.getMonth(); // this is index 0 of months array
      api.queryOrdersByRange(this.filterField, this.fromDate, this.toDate)
        .then(function(orders) {
          that.fetchedOrders = orders;
          that.filterOrders();
        })
          };

    this.filterOrders = function () {
        var that = this;
        this.isIncludeCanceled = this.isOnlyFinal ? false : this.isIncludeCanceled;
        this.filteredOrders = this.fetchedOrders.filter (function (ord) {
          return ord.attributes.orderStatus === 3 ||
            (ord.attributes.orderStatus < 3 && !that.isOnlyFinal) ||
            (ord.attributes.orderStatus === 6 && that.isIncludeCanceled);
        });
        this.doStat();
     };

    this.doStat = function () {
      var monthStats2 = [];
      for (var i=0;i<this.filteredOrders.length;i++) {
        var currentOrder = this.filteredOrders[i].attributes;
        var currentQuote = currentOrder.quotes[currentOrder.activeQuote];
        var orderDate = this.filterField === 'eventDate' ? currentOrder.eventDate : currentOrder.createdAt;
        orderDate.setDate(1);
        var monthInd = orderDate.getFullYear()*12+orderDate.getMonth()-dateBias;
        if (!monthStats2[monthInd]) {
          monthStats2[monthInd] = {'month': orderDate, 'count': 1, 'total': currentQuote.total};
        }  else {
          monthStats2[monthInd].count++;
          monthStats2[monthInd].total += currentQuote.total;
        }
      }
      this.monthStats = [];  // squeeze months array to eliminate empty months
      this.tot = {'count': 0, 'total': 0};
      for (var j=0;j<monthStats2.length;j++) {
        if (monthStats2[j]) {
          this.monthStats.push(monthStats2[j]);
          this.tot.count += monthStats2[j].count;
          this.tot.total += monthStats2[j].total;
        }
      }
      this.avg = {'count': this.tot.count / this.monthStats.length, 'total': this.tot.total / this.monthStats.length}
    };

    this.loadOrders();

  });
