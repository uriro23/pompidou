'use strict';

/* Controllers */
angular.module('myApp')
   .controller('OrderListCtrl', function ($rootScope, $state, $scope, $modal,
                                          api, lov, orderService, dater, queryType, customers,
                                          referralSources, cancelReasons,
                                          recentOpenings, recentClosings, colors, config) {
      var that = this;
    var user = api.getCurrentUser();
    this.user = user;
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = 'אירועים';

     $rootScope.menuStatus = user.attributes.isSalesPerson ? 'small' : user.attributes.isKitchenStaff ? 'small' : 'show';

     // for kitchen staff force future query
     if (user.attributes.isKitchenStaff && queryType !== 'future') {
       $state.go('orderList',{'queryType':'future'});
     }

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
         return !order.properties.template && order.createdAt>=week.start && order.createdAt<week.end;
       }).length;
       week.closingVec = recentClosings.filter(function(order) {
         return !order.properties.template &&
           order.properties.closingDate>=week.start && order.properties.closingDate<week.end;
       });
       week.closings = week.closingVec.length;
       week.closingTotal = 0;
       week.closingVec.forEach(function(cl) {
         week.closingTotal += (cl.properties.header.total / (1 + cl.properties.vatRate));
       });
       week.closingTotal = Math.round(week.closingTotal);
     });

 //  filters fetchedOrders according to different criteria and sorts on ascending/descending eventDate depending on future events only flag
//  function is called from ng-change of criteria controls, as well as from initialization code below
    this.filterOrders = function () {
      var that = this;
        this.orders = fetchedOrders.filter(function (ord) {
          return (!that.filterByCustomer.id ||
            ord.properties.customer === that.filterByCustomer.id ||
            ord.properties.contact === that.filterByCustomer.id) &&
            (!that.filterByStatus || ord.properties.orderStatus === that.filterByStatus.id)
        });

      if (!this.isIncludecanceled) {
        this.orders = this.orders.filter(function (ord) {
          return ord.properties.orderStatus!==6
        })
      }

      this.noOfDisplayedOrders = this.orders.length;

      this.orders.sort(function (a, b) {
        if (that.queryType === 'templates') {
          if (a.properties.header.menuType.label > b.properties.header.menuType.label) {
            return 1;
          } else if (a.properties.header.menuType.label < b.properties.header.menuType.label) {
            return -1;
          } else if (a.properties.template > b.properties.template) {
            return 1
          } else {
            return -1
          }
        } else if(that.queryType === 'sales') {
          return b.createdAt - a.createdAt;
        } else {
          var ad = a.properties.eventDate;
          var at = a.properties.eventTime;
          var bd = b.properties.eventDate;
          var bt = b.properties.eventTime;
          var a1 = ad.getDate() - 1 + ad.getMonth()*31 + (ad.getFullYear()-2010)*372;
          if (at) {
            a1 +=  at.getHours()/24 + at.getMinutes()/1440;
          }
          var b1 = bd.getDate() - 1 + bd.getMonth()*31 + (bd.getFullYear()-2010)*372;
          if (bt) {
            b1 +=  bt.getHours()/24 + bt.getMinutes()/1440;
          }
          return that.queryType === 'future' || that.queryType === 'invoices' ? a1 - b1 : b1 - a1;
         }
      });
      this.setOrderTableParams();
    };

//  enrich order with info on customers etc.
    this.enrichOrders = function () {
      var that = this;
      fetchedOrders.forEach(function(fetchedOrder) {
        fetchedOrder.view = {};
        if (fetchedOrder.properties.customer) {
          fetchedOrder.view.customer = customers.filter(function (cust) {
            return cust.id === fetchedOrder.properties.customer;
          })[0];
          fetchedOrder.view.customer.anyPhone =
            fetchedOrder.view.customer.properties.mobilePhone ? fetchedOrder.view.customer.properties.mobilePhone :
              fetchedOrder.view.customer.properties.homePhone ? fetchedOrder.view.customer.properties.homePhone :
                fetchedOrder.view.customer.properties.workPhone ? fetchedOrder.view.customer.properties.workPhone : undefined;
        }
        fetchedOrder.view.orderStatus = lov.orderStatuses.filter(function (stat) {
          return stat.id === fetchedOrder.properties.orderStatus;
        })[0];
        if (fetchedOrder.properties.color) {
          fetchedOrder.view.color = that.colors.filter(function (color) {
            return color.tId === fetchedOrder.properties.color;
          })[0];
        }
        if (fetchedOrder.properties.referralSource) {
          fetchedOrder.view.referralSource = referralSources.filter(function (rs) {
            return rs.tId === fetchedOrder.properties.referralSource;
          })[0];
        }
        if (fetchedOrder.properties.cancelReason) {
          fetchedOrder.view.cancelReason = cancelReasons.filter(function (cr) {
            return cr.tId === fetchedOrder.properties.cancelReason;
          })[0];
        }
        if (fetchedOrder.properties.tasks) {
          fetchedOrder.view.isInvoiceDone = fetchedOrder.properties.tasks.filter(function (task) {
            return task.tId === 16;  // !!! tId of invoice task  -- don't move it !!!
          })[0].isDone;
        } else {
          fetchedOrder.view.isInvoiceDone = false;
        }
          fetchedOrder.view.isReadOnly = fetchedOrder.properties.eventDate < dater.today() ||
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
        'customer','eventTime','number', 'referralSource', 'cancelReason','cancelReasonText',
        'exitTime','template','remarks','header', 'activities', 'tasks', 'taskData', 'color', 'createdBy'
      ];
      if (this.queryType !== 'year') {
        this.queryYear = undefined;
      }
      this.isProcessing = true;
      this.setOrderTableParams();
      switch (this.queryType) {
        case 'sales':
          api.queryFutureOrders(fieldList).then(function (orders) {
            fetchedOrders = orders.filter (function (ord) {
              return !ord.properties.template &&
                      (ord.properties.orderStatus === 0 ||
                        ord.properties.orderStatus === 1 ||
                        ord.properties.orderStatus === 6);
            });
            that.enrichOrders();
           });
          break;
        case 'future':
          api.queryFutureOrders(fieldList).then(function (orders) {
            fetchedOrders = orders.filter (function (ord) {
              return !ord.properties.template && !ord.properties.isDateUnknown;
            });
            that.enrichOrders();
          });
          break;
        case 'invoices':
          api.queryFutureOrders(fieldList).then(function (orders) {
            var CONST_INVOICE_PERIOD = 7;
            var endDate = dater.today();
            endDate.setDate(endDate.getDate() + CONST_INVOICE_PERIOD);
            fetchedOrders = orders.filter (function (ord) {
              return !ord.properties.template && !ord.properties.isDateUnknown &&
                (ord.properties.orderStatus === 3 || ord.properties.orderStatus === 4 || ord.properties.orderStatus === 5) &&
                ord.properties.eventDate < endDate;
            });
            that.enrichOrders();
          });
          break;
        case 'templates':
          api.queryTemplateOrders(fieldList).then(function (orders) {
            fetchedOrders = orders.filter (function (ord) { // filter templates with empty string names
              return ord.properties.template;
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
                return !ord.properties.template;
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
      if (order.view.orderStatus.id === 6 && !order.properties.template) {
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
          order.properties.cancelReason = res.cancelReason;
          order.properties.cancelReasonText = res.cancelReasonText;
          orderService.setStatus(order);
          api.saveObj(order);
        });
      } else {
        orderService.setStatus(order);
        api.saveObj(order);
      }
    };

    this.setInvoiceDone = function (order) {
      var invoiceTask = order.properties.tasks.filter(function(task) {
        return task.tId === 16; // !!! tId of invoice task  -- don't move it !!!
      })[0];
      invoiceTask.isDone = order.view.isInvoiceDone;
      api.saveObj(order);
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
        tabThis.isOrderColors = config.isOrderColors;
        tabThis.isOrderNumbers = config.isOrderNumbers;
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
            window.open("#/bid/" + bids[0].properties.uuid, "_blank");
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

