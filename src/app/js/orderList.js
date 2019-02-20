'use strict';

/* Controllers */
angular.module('myApp')
   .controller('OrderListCtrl', function ($rootScope, $state, $scope, $modal,
                                          api, lov, orderService, dater, queryType, customers,
                                          cancelReasons,
                                          recentOpenings, recentClosings, colors) {
      var that = this;
    var user = api.getCurrentUser();
    this.user = user;
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = 'אירועים';

     $rootScope.menuStatus = user.attributes.isSalesPerson ? 'small' : 'show';

    if (user.attributes.username === 'yuval' || user.attributes.username === 'uri') {
      orderService.generateOrderColors();
    }

    var fetchedOrders = [];


    this.weeks=[{
      label: 'השבוע'
    },{
      label:  'בשבוע שעבר'
    }];
    this.weeks[0].start=dater.today();
    this.weeks[0].start.setDate(dater.today().getDate()-dater.today().getDay());
    this.weeks[0].end = new Date();
    this.weeks[1].start = new Date();
    this.weeks[1].start.setTime(this.weeks[0].start.getTime()-7*24*60*60*1000);
    this.weeks[1].end = this.weeks[0].start;

    this.weeks.forEach(function(week) {
       week.openings = recentOpenings.filter(function(order) {
         return !order.attributes.template && order.createdAt>=week.start && order.createdAt<week.end;
       }).length;
       week.closingVec = recentClosings.filter(function(order) {
         return !order.attributes.template &&
           order.attributes.closingDate>=week.start && order.attributes.closingDate<week.end;
       });
       week.closings = week.closingVec.length;
       week.closingTotal = 0;
       week.closingVec.forEach(function(cl) {
         week.closingTotal += (cl.attributes.header.total / (1 + cl.attributes.vatRate));
       });
       week.closingTotal = Math.round(week.closingTotal);
     });

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

      this.noOfDisplayedOrders = this.orders.length;

      this.orders.sort(function (a, b) {
        if (that.queryType === 'templates') {
          if (a.attributes.header.menuType.label > b.attributes.header.menuType.label) {
            return 1;
          } else if (a.attributes.header.menuType.label < b.attributes.header.menuType.label) {
            return -1;
          } else if (a.attributes.template > b.attributes.template) {
            return 1
          } else {
            return -1
          }
        } else {
          var ad = a.attributes.eventDate;
          var at = a.attributes.eventTime;
          var bd = b.attributes.eventDate;
          var bt = b.attributes.eventTime;
          var a1 = ad.getDate() - 1 + ad.getMonth()*31 + (ad.getFullYear()-2010)*372;
          if (at) {
            a1 +=  at.getHours()/24 + at.getMinutes()/1440;
          }
          var b1 = bd.getDate() - 1 + bd.getMonth()*31 + (bd.getFullYear()-2010)*372;
          if (bt) {
            b1 +=  bt.getHours()/24 + bt.getMinutes()/1440;
          }
          return that.queryType === 'future' ? a1 - b1 : b1 - a1;
         }
      });
      this.setOrderTableParams();
    };

//  enrich order with info on customers etc.
    this.enrichOrders = function () {
      var that = this;
      fetchedOrders.forEach(function(fetchedOrder) {
        fetchedOrder.view = {};
        fetchedOrder.view.customer = customers.filter(function (cust) {
          return cust.id === fetchedOrder.attributes.customer;
        })[0];
        fetchedOrder.view.customer.anyPhone =
          fetchedOrder.view.customer.attributes.mobilePhone?fetchedOrder.view.customer.attributes.mobilePhone:
            fetchedOrder.view.customer.attributes.homePhone?fetchedOrder.view.customer.attributes.homePhone:
              fetchedOrder.view.customer.attributes.workPhone?fetchedOrder.view.customer.attributes.workPhone:undefined;
        fetchedOrder.view.orderStatus = lov.orderStatuses.filter(function (stat) {
          return stat.id === fetchedOrder.attributes.orderStatus;
        })[0];
        if (fetchedOrder.attributes.color) {
          fetchedOrder.view.color = that.colors.filter(function (color) {
            return color.tId === fetchedOrder.attributes.color;
          })[0];
       }
        fetchedOrder.view.isReadOnly = fetchedOrder.attributes.eventDate < dater.today() ||
                                        fetchedOrder.view.orderStatus.id === 6;
      });
      this.noOfFetchedOrders = fetchedOrders.length;
      this.filterOrders();
      this.isProcessing = false;
      this.setOrderTableParams();
    };

    this.setQuery = function() {
      $state.go('orderList',{'queryType':this.queryType});
    };

     this.setQueryYear = function () {
       $state.go('orderList',{'queryType':String(this.queryYear)});
     };

     this.doQuery = function () {
      var that = this;
      this.orders = [];
      var fieldList = [
        'orderStatus','noOfParticipants','eventDate','isDateUnknown',
        'customer','eventTime','number','cancelReason','cancelReasonText',
        'exitTime','template','remarks','header', 'activities', 'color', 'createdBy'
      ];
      if (this.queryType !== 'year') {
        this.queryYear = undefined;
      }
      this.isProcessing = true;
      this.setOrderTableParams();
      switch (this.queryType) {
        case 'future':
          api.queryFutureOrders(fieldList).then(function (orders) {
            fetchedOrders = orders.filter (function (ord) {
              return !ord.attributes.template;
            });
            that.enrichOrders();
          });
          break;
        case 'templates':
          api.queryTemplateOrders(fieldList).then(function (orders) {
            fetchedOrders = orders.filter (function (ord) { // filter templates with empty string names
              return ord.attributes.template;
            });
            that.enrichOrders();
          });
          break;
       case 'debts':
         var fromDate = new Date(dater.today().getFullYear()-2,dater.today().getMonth(),dater.today().getDate()); // debts beyon 2 years are lost
         var toDate = new Date(dater.today().getFullYear(),dater.today().getMonth(),dater.today().getDate()-1);
          api.queryOrdersByRange('eventDate',fromDate,toDate,fieldList).then(function (orders) {
            fetchedOrders = orders.filter(function (ord) {
              return (ord.attributes.orderStatus===3 || ord.attributes.orderStatus===4) && // executed events not fully paid
                !ord.attributes.template;
            });
            that.enrichOrders();
          });
          break;
      case 'year':
        var fromDate2 = new Date(this.queryYear,0,1);
          var toDate2 = this.queryYear===new Date().getFullYear() ? // if current year, limit to past events
            new Date(dater.today().getFullYear(),dater.today().getMonth(),dater.today().getDate()-1) :
            new Date(this.queryYear,11,31);
          api.queryOrdersByRange('eventDate',fromDate2,toDate2,fieldList)
            .then(function(orders) {
              fetchedOrders = orders.filter(function(ord) {
                return !ord.attributes.template;
              });
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
      if (order.view.orderStatus.id === 6) {
        var cancelReasonModal = $modal.open({
          templateUrl: 'app/partials/order/cancelReason.html',
          controller: 'CancelReasonCtrl as cancelReasonModel',
          resolve: {
            order: function () {
              return order;
            },
            cancelReasons: function () {
              return cancelReasons;
            }
           },
          size: 'sm'
        });

        cancelReasonModal.result.then(function (res) {
          order.attributes.cancelReason = res.cancelReason;
          order.attributes.cancelReasonText = res.cancelReasonText;
          orderService.setStatus(order);
          api.saveObj(order);
        });
      } else {
        orderService.setStatus(order);
        api.saveObj(order);
      }
    };

    this.newOrder = function () {
      $state.go('newOrder');
    };

    var tabThis;

    this.setOrderTableParams = function () {
      if (tabThis) {
        tabThis.queryType = this.queryType;
        tabThis.isProcessing = this.isProcessing;
        tabThis.orders = this.orders;
        tabThis.isDisableLink = false;
        tabThis.user = this.user.attributes;
      }
    };

    $scope.initOrderTableParams = function (t) {
      tabThis = t;
   };

    // main block

     this.colors = colors.map(function(color) {
       color.style = {
         'color': color.fontColor,
         'background-color': color.backColor
       };
       return  color;
     });

     this.years = [];
    for (var y=new Date().getFullYear();y>=2012;y--) {
      this.years.push(y);
    }
    this.filterByCustomer = {};
    this.orderStatuses = lov.orderStatuses;
    if (queryType > '2000' && queryType < '3000') {
      this.queryType = 'year';
      this.queryYear = Number(queryType);
    }  else {
      this.queryType = queryType;
    }
    this.doQuery();
    this.isProcessing = false;
  })

  .controller('OrderTableCtrl', function($scope, $modal, api, dater) {
    $scope.$parent.initOrderTableParams(this);

    this.today = dater.today();

    this.showCustomerContactInfo = function (order) {
      var customerContactInfo = $modal.open({
        templateUrl: 'app/partials/order/customerContactInfo.html',
        controller: 'CustomerContactInfoCtrl as customerContactInfoModel',
        resolve: {
          customer: function () {
            return order.view.customer;
          }
        },
        size: 'sm'
      });

      customerContactInfo.result.then(function() {
      })
    };

    this.getLastBid = function (order) {
      api.queryBidsByOrder(order.id)
        .then(function (bids) {
          if (bids.length > 0) {
            window.open("#/bid/" + bids[0].attributes.uuid, "_blank");
          } else {
            alert('אין הצעות מחיר לאירוע')
          }
        })
    };
  })

  .controller('CustomerContactInfoCtrl', function ($modalInstance,customer) {
    this.customer = customer;
    this.close = function () {
      $modalInstance.close();
    }
  });

