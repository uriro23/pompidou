'use strict';

/* Controllers */
angular.module('myApp')
  .controller('StatisticsCtrl', function ($rootScope, $scope, lov, api, dater, categories,
                                          menuTypes, referralSources, cancelReasons, customers) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = 'סטטיסטיקות';

    this.user = user;

    this.toDate = dater.today();
    this.toDate.setDate(this.toDate.getDate()+1); // do until tomorrow, to include events of today
    this.fromDate = dater.today();
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
      'orderStatus','noOfParticipants','eventDate','isDateUnknown',
      'customer','eventTime','number', 'exitTime','template', 'header',
      'vatRate', 'referralSource', 'cancelReason', 'createdBy', 'bidDate'
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

      this.cancelReasonStats = []; //  clear existing display
      this.cancelReasonTot = {};
      this.cancelReasonAvg = {};

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
            if (currentOrder.header.totalForStat < that.fromTotal) {
              return false;
            }
          }
          if (that.toTotal) {
            if (currentOrder.header.totalForStat > that.toTotal) {
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
        if (segIndex > -1) {  // if no index for this order - skip it
          if (!tempVec[segIndex]) {  // first event for index
            tempVec[segIndex] = {
              'label': angular.copy(getLabel(segIndex)),
              'leads': 1,
              'orders': [order]
            };
            if (orderAttr.bidDate) {
              tempVec[segIndex].bids = 1;
              tempVec[segIndex].bidsTotal = orderAttr.header.totalForStat;
            } else {
              tempVec[segIndex].bids = 0;
              tempVec[segIndex].bidsTotal = 0;
            }
            if (orderAttr.orderStatus >= 2 && orderAttr.orderStatus <= 5) {  // actually happens
              tempVec[segIndex].closed = 1;
              tempVec[segIndex].closedTotal = orderAttr.header.totalForStat;
              tempVec[segIndex].closedParticipants = orderAttr.noOfParticipants;
            } else {
              tempVec[segIndex].closed = 0;
              tempVec[segIndex].closedTotal = 0;
              tempVec[segIndex].closedParticipants = 0;
            }
          } else {
            tempVec[segIndex].leads++;
            if (orderAttr.bidDate) {
              tempVec[segIndex].bids++;
              tempVec[segIndex].bidsTotal += orderAttr.header.totalForStat;
            }
            if (orderAttr.orderStatus >= 2 && orderAttr.orderStatus <= 5) {  // actually happens
              tempVec[segIndex].closed++;
              tempVec[segIndex].closedTotal += orderAttr.header.totalForStat;
              tempVec[segIndex].closedParticipants += orderAttr.noOfParticipants;
            }
            tempVec[segIndex].orders.push(order);
            console.log('order '+orderAttr.number+', index '+segIndex+', tot '+orderAttr.header.totalForStat);
          }
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
      console.log(tempVec);
      segArray.splice(0,segArray.length); // clear output array
      tot.leads = 0;
      tot.bids = 0;
      tot.bidsTotal = 0;
      tot.closed = 0;
      tot.closedTotal = 0;
      tot.closedParticipants = 0;
      for (var j=0;j<tempVec.length;j++) {
        if (tempVec[j]) {
          segArray.push(tempVec[j]);
          tot.leads += tempVec[j].leads;
          tot.bids += tempVec[j].bids;
          tot.bidsTotal += tempVec[j].bidsTotal;
          tot.closed += tempVec[j].closed;
          tot.closedTotal += tempVec[j].closedTotal;
          tot.closedParticipants += tempVec[j].closedParticipants;
        }
      }

      avg.leads = tot.leads / segArray.length;
      avg.bids = tot.bids / segArray.length;
      avg.bidsTotal = tot.bidsTotal / segArray.length;
      avg.closed = tot.closed / segArray.length;
      avg.closedTotal = tot.closedTotal / segArray.length;
      avg.closedParticipants = tot.closedParticipants / segArray.length;
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
      console.log(this.monthStats);
      // segmentation by participants
      doSegmentation(this.participantStats, this.participantTot, this.participantAvg, function (ord) {
        if (ord.attributes.noOfParticipants) {
          return Math.floor((ord.attributes.noOfParticipants + 1) / participantsFactor);
        } else {
          return -1;  // for leads with no participants yet
        }
      },function (ind) {
        return (ind * participantsFactor + 1) + '-' + ((ind+1) * participantsFactor);
      });
      // segmentation by total
      doSegmentation(this.totalStats, this.totalTot, this.totalAvg, function (ord) {
        if (ord.attributes.header.totalForStat) {
          return Math.floor((ord.attributes.header.totalForStat + 1) / totalFactor);
        } else {
          return -1;
        }
      },function (ind) {
        return (ind * totalFactor + 1) + '-' + ((ind+1) * totalFactor);
      });
      // segmentation by total per participant
      doSegmentation(this.totalPerParticipantStats,
                     this.totalPerParticipantTot,
                     this.totalPerParticipantAvg,
                     function (ord) {
        if (ord.attributes.header.totalForStat) {
          return Math.floor((ord.attributes.header.totalForStat /
            ord.attributes.noOfParticipants + 1) / totalPerParticipantFactor);
        } else {
          return -1;
        }
      },function (ind) {
        return (ind * totalPerParticipantFactor + 1) + '-' + ((ind+1) * totalPerParticipantFactor);
      });
      // segmentation by menuType
      doSegmentation(this.menuTypeStats, this.menuTypeTot, this.menuTypeAvg, function (ord) {
        if (ord.attributes.header.menuType) {
          return ord.attributes.header.menuType.tId;
        } else {
          return -1;
        }
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
        if (ord.attributes.referralSource) {
          return ord.attributes.referralSource;
        } else {
          return -1;
        }
      },function (ind) {
        var s = referralSources.filter(function(r) {
          return r.tId === ind;
        });
        if (s.length) {
            return s[0].label;
          }
        });
      // segmentation by cancelReason
      doSegmentation(this.cancelReasonStats, this.cancelReasonTot, this.cancelReasonAvg, function (ord) {
        if (ord.attributes.cancelReason) {
          return ord.attributes.cancelReason;
        } else {
          return -1;
        }
      },function (ind) {
        var s = cancelReasons.filter(function(r) {
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
        order.view.isReadOnly = order.attributes.eventDate < dater.today() ||
                                order.view.orderStatus.id === 6;
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
      api.queryOrdersByRange('eventDate',from,dater.today(),fields)
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

    this.loadOrderCategories = function() {
      var that = this;
      this.categories = categories;
      this.categoryOrdersByMonth = [];
      this.catProcessing = true;
      api.queryOrdersByRange(this.filterBy, this.fromDate, this.toDate)
        .then(function(orders) {
          that.catProcessing = false;
          orders.forEach(function(order) {
            if (!order.attributes.template && order.attributes.orderStatus>=2 && order.attributes.orderStatus<=5) {
              var quote = order.attributes.quotes[order.attributes.activeQuote];
              if (!quote) {
                console.log(order);
              }
              if (!quote.isFixedPrice) {
                var orderDate = that.filterBy === 'eventDate' ? order.attributes.eventDate : order.createdAt;
                var monthInd = orderDate.getFullYear()*12+orderDate.getMonth()-dateBias;
                if (!that.categoryOrdersByMonth[monthInd]) {
                  var dateLabel =  angular.copy(that.fromDate);
                  dateLabel.setMonth(that.fromDate.getMonth()+monthInd);
                  that.categoryOrdersByMonth[monthInd] = {
                    isActive: true,
                    label: dateLabel,
                    categories: angular.copy(that.categories)
                   };
                  that.categoryOrdersByMonth[monthInd].categories.forEach(function(cat) {
                    cat.count = 0;
                    cat.total = 0;
                  });
                }
                quote.items.forEach(function(item) {
                  that.categoryOrdersByMonth[monthInd].categories.forEach(function(cat, ind) {
                    if (cat.tId === item.category.tId) {
                      cat.count++;
                      var price = item.category.type===4 ?
                        item.price / (1 + order.attributes.vatRate) :
                        item.priceBeforeVat;
                      if (quote.discountRate) {
                        price = price * (100 - quote.discountRate) / 100;
                      }
                      cat.total += price;
                      that.categories[ind].isActive = true;
                    }
                  });
                });
              }
            }
          });
          that.categoryOrdersByMonth.forEach(function(month) {
            if (month.isActive) {
              month.categories.forEach(function(cat,ind) {
                cat.isActive = that.categories[ind].isActive;
              });
            }
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
