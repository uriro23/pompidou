'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function (api, $state, $filter, $modal, $rootScope, $scope,
                                     orderService, currentOrder, isFromNew, customer, lov, dater,
                                     bidTextTypes, categories, measurementUnits,
                                     discountCauses, referralSources, cancelReasons,
                                     menuTypes, colors, taskTypes, taskDetails, phases,
                                     employees, pRoles, config) {

    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }

    $rootScope.menuStatus = user.attributes.isSalesPerson ? 'small' : user.attributes.isKitchenStaff ? 'small' : 'show';

    this.user = user;

    var tabThis;

    this.showSummary = {
      is: true
    };

    this.setOrderTableParams = function () {
      if (tabThis) {
        tabThis.queryType = 'customer';
        tabThis.isProcessing = false;
        tabThis.orders = this.prevOrders;
        tabThis.isDisableLink = this.order.view.isChanged;
        if (this.user) { // todo: find why this is undefined sometimes
          tabThis.user = this.user.attributes;
        }
      }
    };

    $scope.initOrderTableParams = function (t) {
      tabThis = t;
    };

    this.setReadOnly = function () {
      this.readOnly.is = (this.order.properties.eventDate &&
                        this.order.properties.eventDate < dater.today() &&
                        !this.order.properties.template && !this.order.view.isEditable) ||
                      this.order.view.orderStatus.id === 6;  // canceled
    };

    this.setEditable = function () {
      this.setReadOnly();
    };

    this.handleVatRateChange = function () {
      if (this.order.properties.vatRate !== this.vatRate && !this.readOnly.is) {
        var that = this;
        var vatChangeModal = $modal.open({
          templateUrl: 'app/partials/order/vatChange.html',
          controller: 'VatChangeCtrl as vatChangeModel',
          resolve: {
            orderVat: function () {
              return that.order.properties.vatRate;
            },
            currentVat: function () {
              return that.vatRate;
            }
          },
          size: 'sm'
        });

        vatChangeModal.result.then(function (res) {
          switch (res) {
            case '0':   // don't change vatRate
              break;
            case '1':   // change vatRate, don't change prices
              that.order.properties.vatRate = that.vatRate;
              that.order.properties.quotes.forEach(function(quote) {
                quote.items.forEach(function(item) {
                  item.priceBeforeVat = item.priceInclVat / (1 + that.vatRate);
                  if (that.order.properties.isBusinessEvent) {
                    item.price = item.priceBeforeVat;
                  }
               });
               orderService.calcTotal(quote,that.order);
              });
            orderService.orderChanged(that.order,'isBusinessEvent');
            break;
            case '2':   // change vatRate, change prices
              that.order.properties.vatRate = that.vatRate;
              that.order.properties.quotes.forEach(function(quote) {
                quote.items.forEach(function(item) {
                  item.priceInclVat = item.priceBeforeVat * (1 + that.vatRate);
                  if (!that.order.properties.isBusinessEvent) {
                    item.price = item.priceInclVat;
                  }
                });
                orderService.calcTotal(quote,that.order);
              });
              orderService.orderChanged(that.order,'isBusinessEvent');
              break;
          }
        });
      }
    };


     // prev orders tab
    // ---------------

    this.getPrevOrders = function () {
      var that = this;
      var fieldList = [
        'orderStatus','noOfParticipants','eventDate','eventTime','orderStatus',
        'customer','number','header','createdBy'
      ];
      if (this.order.view.customer.id) {
        api.queryOrdersByCustomer(this.order.view.customer.id,fieldList)
          .then(function (orders) {
            that.prevOrders = orders.filter(function (ord) {
              return ord.id !== that.order.id;    // exclude current order
            });
            that.prevOrders.forEach(function(ord) {
              ord.view = {
                'orderStatus': lov.orderStatuses.filter (function(st) {
                  return st.id === ord.properties.orderStatus;
                })[0]
              }
            });
            that.setOrderTableParams();
          })
      }
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

    // common
    // ------

    this.saveOrder = function () {
      if (this.user.attributes.isSalesPerson &&
          this.user.attributes.username !== this.order.properties.createdBy) {
        alert('אינך יכול לעדכן אירוע שלא אתה יצרת');
      } else {
        orderService.saveOrder(this.order);
      }
    };


    this.setupOrderView = function () {
      var that = this;
      this.order.view = {};
      var view = this.order.view;
      var attr = this.order.properties;
      view.errors = {};
      view.changes = {};
      orderService.setDescChangeActions(this.order, this.descChangeActions); // initialize object for drop down in all items
      if ($state.current.name === 'editOrder' || $state.current.name === 'dupOrder') {  // existing order
        view.quote = attr.quotes[attr.activeQuote]; // load active quote
        if (view.quote && view.quote.endBoxType) {
          view.quote.endBoxType = menuTypes.filter(function (obj) { // so select in quoteParams will work
            return (obj.tId === that.order.view.quote.endBoxType.tId);
          })[0];
        }
        if (view.quote && view.quote.discountCause) {
          view.quote.discountCause = discountCauses.filter(function (dc) {
            return dc.tId === that.order.view.quote.discountCause.tId;
          })[0];
        }
        if(view.quote && view.quote.endTextType) {
          view.quote.endTextType = bidTextTypes.filter(function (obj) {
            return (obj.tId === that.order.view.quote.endTextType.tId);
          })[0];
        }
        view.startBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.properties.startBidTextType);
        })[0];
        view.endBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.properties.endBidTextType);
        })[0];
        view.orderStatus = this.orderStatuses.filter(function (obj) {
          return (obj.id === that.order.properties.orderStatus);
        })[0];
        view.eventTimeRange = this.eventTimeRanges.filter(function (obj) {
          return (obj.id === that.order.properties.eventTimeRange);
        })[0];
        view.referralSource = referralSources.filter(function (obj) {
          return (obj.tId === that.order.properties.referralSource);
        })[0];
        view.cancelReason = cancelReasons.filter(function (obj) {
          return (obj.tId === that.order.properties.cancelReason);
        })[0];
        if (attr.color) {
          view.color = colors.filter(function(obj) {
            return (obj.tId === that.order.properties.color);
          })[0];
        }

        if (that.order.properties.customer) {
          api.queryCustomers(that.order.properties.customer)
            .then(function (custs) {
              if (!custs.length) {
                alert('customer not found');
                console.log('customer not found');
                console.log(that.order.properties.customer);
              }
              that.order.view.customer = custs[0].properties;
              that.order.view.customer.id = custs[0].id;
              if (that.order.properties.template) {
                $rootScope.title = ' תבנית ' + that.order.properties.template;
              } else {
                $rootScope.title = ' - אירוע ' +
                  that.order.view.customer.firstName + ' ' +
                  that.order.view.customer.lastName + ' ' +
                  that.order.properties.eventDate.getDate() + '/' + (that.order.properties.eventDate.getMonth() + 1);
              }
            });
        } else {
          that.order.view.customer = {};
          if (that.order.properties.template) {
            $rootScope.title = ' תבנית ' + that.order.properties.template;
          } else {
            $rootScope.title = ' - אירוע ' +
              that.order.view.customer.firstName + ' ' +
              that.order.view.customer.lastName + ' ' +
              that.order.properties.eventDate.getDate() + '/' + (that.order.properties.eventDate.getMonth() + 1);
          }
        }
        if (that.order.properties.contact) {
          api.queryCustomers(that.order.properties.contact)
            .then(function (custs) {
              if (!custs.length) {
                alert('contact not found');
                console.log('contact not found');
                console.log(that.order.properties.contact);
              }
              that.order.view.contact = custs[0].properties;
              that.order.view.contact.id = custs[0].id;
            });
        } else {
          that.order.view.contact = {};
        }
        if (that.order.properties.referrer) {
          api.queryCustomers(that.order.properties.referrer)
            .then(function (custs) {
              if (!custs.length) {
                alert('referrer not found');
                console.log('referrer not found');
                console.log(that.order.properties.referrer);
              }
              that.order.view.referrer = custs[0].properties;
              that.order.view.referrer.id = custs[0].id;
            });
        } else {
          that.order.view.referrer = {};
        }
      } else { // newOrder or newOrderByCustomer
        if ($state.current.name === 'newOrderByCustomer') {
          view.customer = customer.properties;
          view.customer.id = customer.id;
        } else {
          view.customer = {};
        }
        view.contact = {};
        view.referrer = {};
        view.orderStatus = this.orderStatuses.filter(function (obj) {
          return (obj.id === 0);
        })[0];    // create as lead
        view.eventTimeRange = this.eventTimeRanges.filter(function (obj) {
          return (obj.id === 1);
        })[0];    // create as default half an hour
      }
      var allTasks = angular.copy(taskTypes);
      var allDetails = angular.copy(taskDetails);
      var allPhases = angular.copy(phases);
      view.columns = [];
      allPhases.forEach(function(phase) {
        if (!view.columns[phase.column]) {
          view.columns[phase.column] = {
            phases: []
          };
        }
        view.columns[phase.column].phases.push(phase);
      });
      view.columns.forEach(function(column) {
        column.phases.forEach(function (vPhase) {
          vPhase.tasks = allTasks.filter(function (t) {
            return t.phase === vPhase.tId;
          });
          vPhase.tasks.forEach(function (vTask) {
            vTask.details = allDetails.filter(function (detail) {
              return detail.task === vTask.tId;
            });
            vTask.details.forEach(function (vDetail) {
              if (attr.taskDetails) {
                attr.taskDetails.forEach(function (aDetail) {
                  if (aDetail.tId === vDetail.tId) {
                    vDetail.inputText = aDetail.inputText;
                    vDetail.boolean = aDetail.boolean;
                    vDetail.isDone = aDetail.isDone;
                    vDetail.isShow = aDetail.isShow;
                  }
                });
              } else {
                vDetail.isDone = false;
                vDetail.isShow = true;
              }
            });
            if (attr.tasks) {
              attr.tasks.forEach(function (aTask) {
                if (aTask.tId === vTask.tId) {
                  vTask.isDone = aTask.isDone;
                  vTask.isShow = aTask.isShow;
                  vTask.isDisabled = aTask.isDisabled;
                }
              });
            } else {
              vTask.isDone = false;
              vTask.isShow = true;
              vTask.isDisabled = false;
            }
          });
        });
      });

      orderService.setRangeLabels (this.order.properties.eventTime, this.eventTimeRanges);

    };

    this.selectQuote = function (mt) {
      var ind;
      this.order.properties.quotes.forEach(function(q,i) { // find relevant quote in array
        if (q.menuType.tId===mt.tId) {
          ind = i;
        }
      });
      this.order.view.quote = this.order.properties.quotes[ind];
      // make endBoxType point to member of menuTypes array, so select control in quoteParams view will work correctly
      if (this.order.view.quote.endBoxType) {
        this.order.view.quote.endBoxType = menuTypes.filter(function (mt) {
          return mt.tId === that.order.view.quote.endBoxType.tId;
        })[0];
      }
      if (this.order.view.quote.endTextType) {
        this.order.view.quote.endTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.view.quote.endTextType.tId);
        })[0];
      }
      if (this.order.view.quote.discountCause) {
        this.order.view.quote.discountCause = discountCauses.filter(function (dc) {
          return dc.tId === that.order.view.quote.discountCause.tId;
        })[0];
      }
    };

    this.deselectQuote = function (mt)  {
      var ind;
      this.order.properties.quotes.forEach(function(q,i) { // find relevant quote in array
        if (q.menuType.tId===mt.tId) {
          ind = i;
        }
      });
      // if we leave a quote tab to a non quote tab (like "docs"), load active quote to view
      // if another quote tab was selected, this will be overridden by selectQuote()
      this.order.view.quote = this.order.properties.quotes[this.order.properties.activeQuote];
    };

    this.cancel = function () {
      window.onbeforeunload = function () {
      };
      window.onblur = function () {
      };
      $rootScope.menuStatus = user.attributes.isSalesPerson ? 'small' : user.attributes.isKitchenStaff ? 'small' : 'show';
      this.order.properties = angular.copy(this.order.backupOrderAttr);
      this.setupOrderView();
      if (typeof this.order.properties.taskData === 'undefined') {
        this.order.properties.taskData = {};
      }
      this.order.properties.empBonuses.forEach(function(role) {
        if (role.employee) {
          role.employee = employees.filter(function(emp) {
            return emp.tId === role.employee.tId;
          })[0];
        }
      });

    };

    this.close = function() {
      if (isFromNew===1) {
        history.go(-2);
      } else {
        history.back();
      }
    };




    // main block
    var i;
    var that = this;
    this.isNewOrder = $state.current.name === 'newOrder'||
                      $state.current.name === 'dupOrder' ||
                      $state.current.name === 'newOrderByCustomer'; // used for view heading
    this.readOnly = {is:false}; // declared as object so it will be shared by ref among controllers
    this.bidTextTypes = bidTextTypes;
    this.orderStatuses = lov.orderStatuses;
    this.eventTimeRanges = angular.copy(lov.eventTimeRanges); // because timeRange labels are dynamic
    this.descChangeActions = lov.descChangeActions;
    this.categories = categories;
    this.measurementUnits = measurementUnits;
    this.discountCauses = discountCauses;
    this.referralSources = referralSources;
    this.cancelReasons = cancelReasons;
    this.menuTypes = menuTypes;
    this.employees = employees;
    this.taskTypes = taskTypes;
    this.taskDetails = taskDetails;
    this.config = config;
    this.vatRate = config.vatRate;
    this.isProd = config.isProd;
    this.activityDate = new Date();
    this.quoteViewType = 'items';
    var isHeaderChanged = false;

    if ($state.current.name === 'editOrder') {
      this.order = currentOrder;
      if (this.order.properties.quotes) {
        this.showSummary.is = new Boolean(this.order.properties.quotes.length);
      }
      this.setupOrderView();
      if (typeof this.order.properties.taskData === 'undefined') {
        this.order.properties.taskData = {};
      }
      // if (this.order.view.quote && this.order.view.orderStatus.id < 6) {
      //   this.isActiveQuoteTab = true;
      // } else {
      //   this.isActiveGeneralTab = true;
      // }
        if (this.order.properties.quotes.length) {
          this.isActiveQuoteTab = true;
        } else {
          this.isActiveQuoteManagementTab = true;
        }
      this.setReadOnly();
      this.order.properties.empBonuses.forEach(function(role) {
        if (role.employee) {
          role.employee = employees.filter(function(emp) {
            return emp.tId === role.employee.tId;
          })[0];
        }
      });

        this.handleVatRateChange();
      if(this.order.view.quote && !this.order.view.quote.advance) {
        this.order.view.quote.advance = 0;   // to avoid NaN results on balance for old orders
      }
    } else if ($state.current.name === 'dupOrder') {
      $rootScope.title = 'אירוע חדש';
      this.order = api.initOrder();
      this.order.properties = angular.copy(currentOrder.properties);
      this.order.properties.createdBy = this.user.attributes.username;
      this.order.properties.orderStatus = 0;  // set to proposal
      this.order.properties.isDateUnknown = true;
      this.order.properties.eventDate = new Date(2199,11,31,0,0,0,0);
      this.order.properties.eventTime = undefined;
      this.order.properties.exitTime = undefined;
      this.order.properties.bidDate = undefined;
      this.order.properties.closingDate = undefined;
      this.order.properties.activities = [];
      this.order.properties.taskData = {};
      if (this.order.properties.quotes) {
        this.showSummary.is = new Boolean(this.order.properties.quotes.length);
      }
      var activity = 'האירוע נוצר בשכפול אירוע '+currentOrder.properties.number+
          ' מתאריך '+new Intl.DateTimeFormat('en-US').format(currentOrder.properties.eventDate);
      this.order.properties.activities.splice(0,0,{date: new Date(), text: activity});
      // initialize employee bonuses array
      this.order.properties.empBonuses = angular.copy(pRoles);
      this.order.properties.empBonuses.forEach(function(role) {
        var temp = employees.filter(function(emp) {
          return emp.defaultRole === role.tId;
        });
        if (temp.length) {
          role.employee = temp[0];
        }
      });

      this.setupOrderView();
        if (this.order.properties.quotes.length) {
          this.isActiveQuoteTab = true;
        } else {
          this.isActiveQuoteManagementTab = true;
        }
     this.setReadOnly();
      this.handleVatRateChange();
      if (!this.order.view.quote.advance) {
        this.order.view.quote.advance = 0;   // to avoid NaN results on balance for old orders
      }
      isHeaderChanged = true;
    } else {  // new order or new order by customer
      $rootScope.title = 'אירוע חדש';
      this.showSummary.is = false;
      this.order = api.initOrder();
      this.order.properties.isDateUnknown = true;
      this.order.properties.eventDate = new Date(2199,11,31,0,0,0,0);
      this.order.properties.createdBy = this.user.attributes.username;
      if ($state.current.name === 'newOrderByCustomer') {
        this.order.properties.customer = customer.id;
      }
      this.setupOrderView();
      this.order.properties.version = lov.version;
      this.order.properties.includeRemarksInBid = false;
      this.order.properties.eventName = '';
      this.order.properties.quotes = [];
      this.order.properties.taskData = {};



      // initialize employee bonuses array
      this.order.properties.empBonuses = angular.copy(pRoles);
      this.order.properties.empBonuses.forEach(function(role) {
        var temp = employees.filter(function(emp) {
          return emp.defaultRole === role.tId;
        });
        if (temp.length) {
          role.employee = temp[0];
        }
      });

      var j = 0;  // count only initialCreate menuTypes
      menuTypes.forEach(function(mt) {  // on order creation, we create a quote for each menu type
        if (mt.isInitialCreate) {
          var quote = orderService.initQuote(mt, that.categories, that.discountCauses[0]);
          if (mt.isDefault) {
            quote.isActive = true;
            that.order.properties.activeQuote = j;
            that.order.view.quote = quote;
          }
          orderService.calcTotal(quote,that.order);

          that.order.properties.quotes.push(quote);
          j++;
        }
      });
      // if (j === 0) {    // no quotes created
      //   this.isActiveQuoteTab = false;
      //   this.isActiveGeneralTab = true;
      // }
        if (this.order.properties.quotes.length) {
          this.isActiveQuoteTab = true;
        } else {
          this.isActiveQuoteManagementTab = true;
        }
   this.order.properties.vatRate = this.vatRate;
      this.order.properties.activities = [];
      this.setReadOnly();
    }

    orderService.checkTasks(this.order);

    this.order.view.isChanged = false;
    if (isHeaderChanged) {
      orderService.orderChanged(this.order,'header');
      isHeaderChanged = false;
    }
    window.onbeforeunload = function () {
    };
    window.onblur = function () {
    };
    $rootScope.menuStatus = user.attributes.isSalesPerson ? 'small' : user.attributes.isKitchenStaff ? 'small' : 'show';
    this.order.backupOrderAttr = angular.copy(this.order.properties);


  });
