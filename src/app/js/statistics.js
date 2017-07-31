'use strict';

/* Controllers */
angular.module('myApp')
  .controller('StatisticsCtrl', function ($rootScope, lov, api, today, referralSources) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - סטטיסטיקות';

    this.toDate = today;
    this.toDate.setDate(this.toDate.getDate()+1); // do until tomorrow, to include events of today
    this.fromDate = angular.copy(this.toDate);
    this.fromDate.setFullYear(this.toDate.getFullYear()-1);
    this.fromDate.setDate(1);
    this.filterBy = 'eventDate';
    var dateBias;
    var fetchedOrders = [];
    var filteredOrders = [];

    var participantsFactor = 10;
    var totalFactor = 1000;


    //this.loadOrders();

    this.loadOrders = function() {
      var that = this;

      this.monthStats = []; //  clear existing display
      this.monthTot = {};
      this.monthAvg = {};

      this.participantStats = []; //  clear existing display
      this.participantTot = {};
      this.participantAvg = {};

      this.totalStats = []; //  clear existing display
      this.totalTot = {};
      this.totalAvg = {};

      this.referralSourceStats = []; //  clear existing display
      this.referralSourceTot = {};
      this.referralSourceAvg = {};

      fetchedOrders = filteredOrders = [];

      dateBias = this.fromDate.getFullYear()*12 + this.fromDate.getMonth(); // this is index 0 of months array
      api.queryOrdersByRange(this.filterBy, this.fromDate, this.toDate)
        .then(function(orders) {
          fetchedOrders = orders.filter(function(ord) {
            return !ord.attributes.template;    // ignore templates
          });
          that.filterOrders();
       })
          };

    this.filterOrders = function () {
        var that = this;
        filteredOrders = fetchedOrders.filter (function (ord) {
          var currentOrder = ord.attributes;
          var currentQuote = currentOrder.quotes[currentOrder.activeQuote];
          if (that.fromTotal) {
            if (currentQuote.total < that.fromTotal) {
              return false;
            }
          }
          if (that.toTotal) {
            if (currentQuote.total > that.toTotal) {
              return false;
            }
          }
          if (that.fromParticipants) {
            if (currentOrder.noOfParticipants < that.fromParticipants) {
              return false;
            }
          }
          if (that.toParticipants) {
            if (currentOrder.noOfParticipants > that.toParticipants) {
              return false;
            }
          }
          return true;
        });
        this.doStat();
     };

    function doSegmentation (segArray, tot, avg, getIndex, getLabel) {
      // segArray - array for output of segmentation
      // tot - total object
      // avg - average object
      // getIndex - function that receives order as argument and returns index into segArray array for that order
      // getLabel - function that receives an index into segArray as argument and returns a display label for that index

      var tempVec = [];
      for (var i=0;i<filteredOrders.length;i++) {
        var currentOrder = filteredOrders[i].attributes;
        var currentQuote = currentOrder.quotes[currentOrder.activeQuote];
        var segIndex = getIndex (filteredOrders[i]);
        if (!tempVec[segIndex]) {  // first event for index
          tempVec[segIndex] = {'label': angular.copy(getLabel(segIndex)), 'potCount': 1, 'potTotal': currentQuote.total};
           if (currentOrder.orderStatus >= 2 && currentOrder.orderStatus <= 5) {  // actually happens
            tempVec[segIndex].actCount = 1;
            tempVec[segIndex].actTotal = currentQuote.total;
            tempVec[segIndex].actParticipants = currentOrder.noOfParticipants;
            tempVec[segIndex].actTransportation = currentQuote.transportationInclVat;

          } else {
            tempVec[segIndex].actCount = 0;
            tempVec[segIndex].actTotal = 0;
            tempVec[segIndex].actParticipants = 0;
            tempVec[segIndex].actTransportation = 0;
           }
        }  else {
         tempVec[segIndex].potCount++;
          tempVec[segIndex].potTotal += currentQuote.total;
          if (currentOrder.orderStatus >= 2 && currentOrder.orderStatus <= 5) {  // actually happens
            tempVec[segIndex].actCount++;
            tempVec[segIndex].actTotal += currentQuote.total;
            tempVec[segIndex].actParticipants += currentOrder.noOfParticipants;
            tempVec[segIndex].actTransportation += currentQuote.transportationInclVat;
          }
        }
      }
      segArray.splice(0,segArray.length); // clear output array
      tot.potCount = 0;
      tot.potTotal = 0;
      tot.actCount = 0;
      tot.actTotal = 0;
      tot.actParticipants = 0;
      tot.actTransportation = 0;
      for (var j=0;j<tempVec.length;j++) {
        if (tempVec[j]) {
          segArray.push(tempVec[j]);
          tot.potCount += tempVec[j].potCount;
          tot.potTotal += tempVec[j].potTotal;
          tot.actCount += tempVec[j].actCount;
          tot.actTotal += tempVec[j].actTotal;
          tot.actParticipants += tempVec[j].actParticipants;
          tot.actTransportation += tempVec[j].actTransportation;
        }
      }

      avg.potCount = tot.potCount / segArray.length;
      avg.potTotal = tot.potTotal / segArray.length;
      avg.actCount = tot.actCount / segArray.length;
      avg.actTotal = tot.actTotal / segArray.length;
      avg.actParticipants = tot.actParticipants / segArray.length;
      avg.actTransportation = tot.actTransportation / segArray.length;
  }

    this.doStat = function () {
      var that = this;

      // segmentation by months
      doSegmentation(this.monthStats, this.monthTot, this.monthAvg, function (ord) {
        var orderDate = that.filterBy === 'eventDate' ? ord.attributes.eventDate : ord.createdAt;
        return orderDate.getFullYear()*12+orderDate.getMonth()-dateBias;
      },function (ind) {
        var dateLabel =  angular.copy(that.fromDate);
        dateLabel.setMonth(that.fromDate.getMonth()+ind);
        return dateLabel;
      });
      // segmentation by participants
      doSegmentation(this.participantStats, this.participantTot, this.participantAvg, function (ord) {
        return  Math.floor((ord.attributes.noOfParticipants + 1) / participantsFactor);
      },function (ind) {
        return (ind * participantsFactor + 1) + '-' + ((ind+1) * participantsFactor);
      });
      // segmentation by total
      doSegmentation(this.totalStats, this.totalTot, this.totalAvg, function (ord) {
        return  Math.floor((ord.attributes.quotes[ord.attributes.activeQuote].total + 1) / totalFactor);
      },function (ind) {
        return (ind * totalFactor + 1) + '-' + ((ind+1) * totalFactor);
      });
      // segmentation by referralSource
      doSegmentation(this.referralSourceStats, this.referralSourceTot, this.referralSourceAvg, function (ord) {
        return ord.attributes.referralSource;
      },function (ind) {
        var s = referralSources.filter(function(r) {
          return r.tId === ind;
        });
        if (s.length) {
          return s[0].label;
        }
      });
    };

      this.loadOrders();

  });
