'use strict';

/* Controllers */
angular.module('myApp')
  .controller('StatisticsCtrl', function ($rootScope, $scope, lov, api, today, menuTypes, referralSources, customers) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = 'סטטיסטיקות';

    this.user = user;

    this.toDate = angular.copy(today);
    this.toDate.setDate(this.toDate.getDate()+1); // do until tomorrow, to include events of today
    this.fromDate = angular.copy(today);
    this.fromDate.setFullYear(this.toDate.getFullYear()-1);
    this.fromDate.setDate(1);
    this.filterBy = 'eventDate';
    this.filterByWeight = 'all';
    var fetchedOrders = [];
    var filteredOrders = [];
    var dateBias;
    var participantsFactor = 10;
    var totalFactor = 1000;
    var totalPerParticipantFactor = 20;

    var fieldList = [
      'orderStatus','noOfParticipants','eventDate','customer','eventTime','number',
      'exitTime','template', 'header', 'vatRate', 'referralSource', 'createdBy'
    ];

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

      this.totalPerParticipantStats = []; //  clear existing display
      this.totalPerParticipantTot = {};
      this.totalPerParticipantAvg = {};

      this.referralSourceStats = []; //  clear existing display
      this.referralSourceTot = {};
      this.referralSourceAvg = {};

      this.menuTypeStats = []; //  clear existing display
      this.menuTypeTot = {};
      this.menuTypeAvg = {};

      fetchedOrders = filteredOrders = [];

      dateBias = this.fromDate.getFullYear()*12 + this.fromDate.getMonth(); // this is index 0 of months array
      api.queryOrdersByRange(this.filterBy, this.fromDate, this.toDate, fieldList)
        .then(function(orders) {
          fetchedOrders = orders.filter(function(ord) {
            return !ord.attributes.template;    // ignore templates
          });
          that.filterOrders();
          that.isHideOrders = true;
          that.setOrderTableParams();
       })
          };

    this.filterOrders = function () {
        var that = this;
        filteredOrders = fetchedOrders.filter (function (ord) {
          var currentOrder = ord.attributes;
          if (that.fromTotal) {
            if (currentOrder.header.total/(1+currentOrder.vatRate) < that.fromTotal) {
              return false;
            }
          }
          if (that.toTotal) {
            if (currentOrder.header.total/(1+currentOrder.vatRate) > that.toTotal) {
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
          if (that.filterByWeight === 'light') {
            if (currentOrder.header.isHeavyweight) {
              return false;
            }
          }
          if (that.filterByWeight === 'heavy') {
            if (!currentOrder.header.isHeavyweight) {
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
      filteredOrders.forEach(function(order) {
        var orderAttr = order.attributes;
        var segIndex = getIndex (order);
        if (!tempVec[segIndex]) {  // first event for index
          tempVec[segIndex] = {
            'label': angular.copy(getLabel(segIndex)),
            'potCount': 1,
            'potTotal': orderAttr.header.total/(1+orderAttr.vatRate),
            'orders': [order]
          };
           if (orderAttr.orderStatus >= 2 && orderAttr.orderStatus <= 5) {  // actually happens
            tempVec[segIndex].actCount = 1;
            tempVec[segIndex].actTotal = orderAttr.header.total/(1+orderAttr.vatRate);
            tempVec[segIndex].actParticipants = orderAttr.noOfParticipants;
            tempVec[segIndex].actTransportation = orderAttr.header.transportationInclVat / (1+orderAttr.vatRate);

          } else {
            tempVec[segIndex].actCount = 0;
            tempVec[segIndex].actTotal = 0;
            tempVec[segIndex].actParticipants = 0;
            tempVec[segIndex].actTransportation = 0;
           }
        }  else {
         tempVec[segIndex].potCount++;
          tempVec[segIndex].potTotal += orderAttr.header.total/(1+orderAttr.vatRate);
          if (orderAttr.orderStatus >= 2 && orderAttr.orderStatus <= 5) {  // actually happens
            tempVec[segIndex].actCount++;
            tempVec[segIndex].actTotal += orderAttr.header.total/(1+orderAttr.vatRate);
            tempVec[segIndex].actParticipants += orderAttr.noOfParticipants;
            tempVec[segIndex].actTransportation += (orderAttr.header.transportationInclVat / (1+orderAttr.vatRate));
          }
          tempVec[segIndex].orders.push(order);
        }
      });
      tempVec.forEach(function(line) {
        line.orders.sort(function(a,b) {
          if(a.attributes.eventDate > b.attributes.eventDate) {
            return 1;
          } else {
            return -1;
          }
        });
      });
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
        return  Math.floor((ord.attributes.header.total / (1+ord.attributes.vatRate) + 1) / totalFactor);
      },function (ind) {
        return (ind * totalFactor + 1) + '-' + ((ind+1) * totalFactor);
      });
      // segmentation by total per participant
      doSegmentation(this.totalPerParticipantStats,
                     this.totalPerParticipantTot,
                     this.totalPerParticipantAvg,
                     function (ord) {
        return  Math.floor(((ord.attributes.header.total / (1+ord.attributes.vatRate)) /
          ord.attributes.noOfParticipants + 1) / totalPerParticipantFactor);
      },function (ind) {
        return (ind * totalPerParticipantFactor + 1) + '-' + ((ind+1) * totalPerParticipantFactor);
      });
      // segmentation by menuType
      doSegmentation(this.menuTypeStats, this.menuTypeTot, this.menuTypeAvg, function (ord) {
        return ord.attributes.header.menuType.tId;
      },function (ind) {
        var s = menuTypes.filter(function(r) {
          return r.tId === ind;
        });
        if (s.length) {
          return s[0].label;
        }
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

    this.setupLineOrders = function(lineArray,line) {
      this.ordersToShow = line.orders;
      this.ordersToShow.forEach(function(order) {
        order.view = {};
        order.view.customer = customers.filter(function (cust) {
          return cust.id === order.attributes.customer;
        })[0];
        order.view.customer.anyPhone =
          order.view.customer.attributes.mobilePhone?order.view.customer.attributes.mobilePhone:
            order.view.customer.attributes.homePhone?order.view.customer.attributes.homePhone:
              order.view.customer.attributes.workPhone?order.view.customer.attributes.workPhone:undefined;
        order.view.orderStatus = lov.orderStatuses.filter(function (stat) {
          return stat.id === order.attributes.orderStatus;
        })[0];
        order.view.isReadOnly = order.attributes.eventDate < today;
      });
      lineArray.forEach(function(lin) {
        lin.isBold = false
      });
      line.isBold = true;
      this.isHideOrders = false;
      this.setOrderTableParams();
    };


    this.deselectTab = function(array) {
      array.forEach(function(line) {
        line.isBold = false;
      });
      this.ordersToShow = [];
      this.isHideOrders = true;
      this.setOrderTableParams();
    };

    this.loadEmpBonuses = function () {
      var that = this;
      var from = new Date(2018,3,1);  // bonuses started 1/4/18
      //var to = new Date(2099,11,31);
      var fields = ['eventDate','empBonuses','template','orderStatus'];
      this.empBonuses = [];
      api.queryOrdersByRange('eventDate',from,today,fields)
        .then (function(orders) {
          orders.forEach(function(order) {
            if (!order.attributes.template && order.attributes.orderStatus!==1 && order.attributes.orderStatus!==6) {
              var calcMonth = order.attributes.eventDate.getFullYear()*12+order.attributes.eventDate.getMonth();
              var monthInd = -1;
              that.empBonuses.forEach(function(line, lineInd) {
                if (line.calcMonth === calcMonth) {
                  monthInd = lineInd;
                }
              });
              if (monthInd === -1) {
                that.empBonuses.push({
                  calcMonth: calcMonth,
                  month: order.attributes.eventDate,
                  employees: []
                });
                monthInd = that.empBonuses.length-1;
              }
              order.attributes.empBonuses.forEach(function(bonus) {
                if (bonus.isBonus && bonus.employee) {
                  var empInd = -1;
                  that.empBonuses[monthInd].employees.forEach(function(emp,empj) {
                    if (bonus.employee.tId === emp.tId) {
                      empInd = empj;
                    }
                  });
                  if (empInd === -1) {
                    that.empBonuses[monthInd].employees.push({
                      tId: bonus.employee.tId,
                      name: bonus.employee.name,
                      totBonuses: 0,
                      roles: []
                    });
                    empInd = that.empBonuses[monthInd].employees.length-1;
                  }
                  that.empBonuses[monthInd].employees[empInd].totBonuses++;
                  var roleInd = -1;
                  that.empBonuses[monthInd].employees[empInd].roles.forEach(function(role,rolej) {
                    if (bonus.tId === role.tId) {
                      roleInd = rolej;
                    }
                  });
                  if (roleInd === -1) {
                    that.empBonuses[monthInd].employees[empInd].roles.push({
                      tId: bonus.tId,
                      label: bonus.label,
                      bonuses: 0
                    });
                    roleInd = that.empBonuses[monthInd].employees[empInd].roles.length-1;
                    }
                  that.empBonuses[monthInd].employees[empInd].roles[roleInd].bonuses++;
                }
              });
            }
          });
          that.empBonuses.sort(function(a,b) {  // sort descending on month
            return b.calcMonth - a.calcMonth;
          });
        });
    };

    var tabThis;

    this.setOrderTableParams = function () {
      if (tabThis) {
        tabThis.queryType = 'statistics';
        tabThis.isProcessing = this.isHideOrders;
        tabThis.orders = this.ordersToShow;
        tabThis.isDisableLink = false;
        tabThis.user = this.user.attributes;
      }
    };

    $scope.initOrderTableParams = function (t) {
      tabThis = t;
    };



    this.loadOrders();
    this.isHideOrders = true;
    this.setOrderTableParams();

  });
