'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function (api, $state, $filter, $modal, $rootScope, $scope,
                                     orderService, currentOrder, isFromNew, customer, lov, dater,
                                     bidTextTypes, categories, measurementUnits,
                                     discountCauses, referralSources, cancelReasons,
                                     menuTypes, colors, employees, pRoles, config) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }

    this.user = user;

    var tabThis;

    this.setOrderTableParams = function () {
      if (tabThis) {
        tabThis.queryType = 'customer';
        tabThis.isProcessing = false;
        tabThis.orders = this.prevOrders;
        tabThis.isDisableLink = this.order.view.isChanged;
        tabThis.user = this.user.attributes;
      }
    };

    $scope.initOrderTableParams = function (t) {
      tabThis = t;
    };

    this.setReadOnly = function () {
      this.readOnly.is = (this.order.attributes.eventDate &&
                        this.order.attributes.eventDate < dater.today() &&
                        !this.order.attributes.template) ||
                      this.order.view.orderStatus.id === 6;  // canceled
    };

    this.handleVatRateChange = function () {
      if (this.order.attributes.vatRate !== this.vatRate && !this.readOnly.is) {
        var that = this;
        var vatChangeModal = $modal.open({
          templateUrl: 'app/partials/order/vatChange.html',
          controller: 'VatChangeCtrl as vatChangeModel',
          resolve: {
            orderVat: function () {
              return that.order.attributes.vatRate;
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
              that.order.attributes.vatRate = that.vatRate;
              that.order.attributes.quotes.forEach(function(quote) {
                quote.items.forEach(function(item) {
                  item.priceBeforeVat = item.priceInclVat / (1 + that.vatRate);
                  if (that.order.attributes.isBusinessEvent) {
                    item.price = item.priceBeforeVat;
                  }
               });
               orderService.calcSubTotal(quote, that.order.attributes.isBusinessEvent, that.order.attributes.vatRate);
              });
            orderService.orderChanged(that.order,'isBusinessEvent');
            break;
            case '2':   // change vatRate, change prices
              that.order.attributes.vatRate = that.vatRate;
              that.order.attributes.quotes.forEach(function(quote) {
                quote.items.forEach(function(item) {
                  item.priceInclVat = item.priceBeforeVat * (1 + that.vatRate);
                  if (!that.order.attributes.isBusinessEvent) {
                    item.price = item.priceInclVat;
                  }
                });
                orderService.calcSubTotal(quote, that.order.attributes.isBusinessEvent, that.order.attributes.vatRate);
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
                  return st.id === ord.attributes.orderStatus;
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
            window.open("#/bid/" + bids[0].attributes.uuid, "_blank");
          } else {
            alert('אין הצעות מחיר לאירוע')
          }
        })

    };

    // common
    // ------

    this.saveOrder = function () {
      if (this.user.attributes.isSalesPerson &&
          this.user.attributes.username !== this.order.attributes.createdBy) {
        alert('אינך יכול לעדכן אירוע שלא אתה יצרת');
      } else {
        orderService.saveOrder(this.order);
      }
    };


    this.setupOrderView = function () {
      var that = this;
      this.order.view = {};
      this.order.view.errors = {};
      this.order.view.changes = {};
      if ($state.current.name === 'editOrder' || $state.current.name === 'dupOrder') {  // existing order
        this.order.view.quote = this.order.attributes.quotes[this.order.attributes.activeQuote]; // load active quote
        if (this.order.view.quote && this.order.view.quote.endBoxType) {
          this.order.view.quote.endBoxType = menuTypes.filter(function (obj) { // so select in quoteParams will work
            return (obj.tId === that.order.view.quote.endBoxType.tId);
          })[0];
        }
        if (this.order.view.quote && this.order.view.quote.discountCause) {
          this.order.view.quote.discountCause = discountCauses.filter(function (dc) {
            return dc.tId === that.order.view.quote.discountCause.tId;
          })[0];
        }
        if(this.order.view.quote && this.order.view.quote.endTextType) {
          this.order.view.quote.endTextType = bidTextTypes.filter(function (obj) {
            return (obj.tId === that.order.view.quote.endTextType.tId);
          })[0];
        }
        this.order.view.startBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.startBidTextType);
        })[0];
        this.order.view.endBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.endBidTextType);
        })[0];
        this.order.view.orderStatus = this.orderStatuses.filter(function (obj) {
          return (obj.id === that.order.attributes.orderStatus);
        })[0];
        this.order.view.referralSource = referralSources.filter(function (obj) {
          return (obj.tId === that.order.attributes.referralSource);
        })[0];
        this.order.view.cancelReason = cancelReasons.filter(function (obj) {
          return (obj.tId === that.order.attributes.cancelReason);
        })[0];
        if (this.order.attributes.color) {
          this.order.view.color = colors.filter(function(obj) {
            return (obj.tId === that.order.attributes.color);
          })[0];
        }

        if (that.order.attributes.customer) {
          api.queryCustomers(that.order.attributes.customer)
            .then(function (custs) {
              if (!custs.length) {
                alert('customer not found');
                console.log('customer not found');
                console.log(that.order.attributes.customer);
              }
              that.order.view.customer = custs[0].attributes;
              that.order.view.customer.id = custs[0].id;
              if (that.order.attributes.template) {
                $rootScope.title = ' תבנית ' + that.order.attributes.template;
              } else {
                $rootScope.title = ' - אירוע ' +
                  that.order.view.customer.firstName + ' ' +
                  that.order.view.customer.lastName + ' ' +
                  that.order.attributes.eventDate.getDate() + '/' + (that.order.attributes.eventDate.getMonth() + 1);
              }
            });
        } else {
          that.order.view.customer = {};
          if (that.order.attributes.template) {
            $rootScope.title = ' תבנית ' + that.order.attributes.template;
          } else {
            $rootScope.title = ' - אירוע ' +
              that.order.view.customer.firstName + ' ' +
              that.order.view.customer.lastName + ' ' +
              that.order.attributes.eventDate.getDate() + '/' + (that.order.attributes.eventDate.getMonth() + 1);
          }
        }
        if (that.order.attributes.contact) {
          api.queryCustomers(that.order.attributes.contact)
            .then(function (custs) {
              if (!custs.length) {
                alert('contact not found');
                console.log('contact not found');
                console.log(that.order.attributes.contact);
              }
              that.order.view.contact = custs[0].attributes;
              that.order.view.contact.id = custs[0].id;
            });
        } else {
          that.order.view.contact = {};
        }
       } else { // newOrder or newOrderByCustomer
        if ($state.current.name === 'newOrderByCustomer') {
          this.order.view.customer = customer.attributes;
          this.order.view.customer.id = customer.id;
        } else {
          this.order.view.customer = {};
        }
        this.order.view.contact = {};
        this.order.view.orderStatus = this.orderStatuses.filter(function (obj) {
          return (obj.id === 0);
        })[0];    // create as lead
        this.order.view.referralSource = this.referralSources[0]; // set to "unknown"
        this.order.view.cancelReason = this.cancelReasons[0]; // set to "unknown"
      }
    };

    this.selectQuote = function (mt) {
      var ind;
      this.order.attributes.quotes.forEach(function(q,i) { // find relevant quote in array
        if (q.menuType.tId===mt.tId) {
          ind = i;
        }
      });
      this.order.view.quote = this.order.attributes.quotes[ind];
      this.filteredCategories = orderService.filterCategories(this.order.view.quote);
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
      this.order.attributes.quotes.forEach(function(q,i) { // find relevant quote in array
        if (q.menuType.tId===mt.tId) {
          ind = i;
        }
      });
      // if we leave a quote tab to a non quote tab (like "docs"), load active quote to view
      // if another quote tab was selected, this will be overridden by selectQuote()
      this.order.view.quote = this.order.attributes.quotes[this.order.attributes.activeQuote];
    };

    this.cancel = function () {
      window.onbeforeunload = function () {
      };
      window.onblur = function () {
      };
      $rootScope.menuStatus = 'show';
      this.order.attributes = angular.copy(this.order.backupOrderAttr);
      this.setupOrderView();
      this.order.attributes.empBonuses.forEach(function(role) {
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
    this.categories = categories;
    this.measurementUnits = measurementUnits;
    this.discountCauses = discountCauses;
    this.referralSources = referralSources;
    this.cancelReasons = cancelReasons;
    this.menuTypes = menuTypes;
    this.employees = employees;
    this.config = config;
    this.vatRate = config.vatRate;
    this.isProd = config.isProd;
    this.activityDate = new Date();
    this.isItemsTabActive = true;
    this.quoteViewType = 'items';

    if ($state.current.name === 'editOrder') {
      this.order = currentOrder;
      this.setupOrderView();
      if (this.order.view.quote && this.order.view.orderStatus.id < 6) {
        this.isActiveQuoteTab = true;
      } else {
        this.isActiveGeneralTab = true;
      }
       this.setReadOnly();
      this.order.attributes.empBonuses.forEach(function(role) {
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
      this.order.attributes = currentOrder.attributes;
      this.order.attributes.createdBy = this.user.attributes.username;
      this.order.attributes.isDateUnknown = true;
      this.order.attributes.eventDate = new Date(2199,11,31,0,0,0,0);
      this.order.attributes.eventTime = undefined;
      this.order.attributes.exitTime = undefined;
      this.order.attributes.activities = [];

      // initialize employee bonuses array
      this.order.attributes.empBonuses = angular.copy(pRoles);
      this.order.attributes.empBonuses.forEach(function(role) {
        var temp = employees.filter(function(emp) {
          return emp.defaultRole === role.tId;
        });
        if (temp.length) {
          role.employee = temp[0];
        }
      });

      this.setupOrderView();
      this.setReadOnly();
      this.handleVatRateChange();
      if (!this.order.view.quote.advance) {
        this.order.view.quote.advance = 0;   // to avoid NaN results on balance for old orders
      }
    } else {  // new order or new order by customer
      $rootScope.title = 'אירוע חדש';
      this.order = api.initOrder();
      this.order.attributes.isDateUnknown = true;
      this.order.attributes.eventDate = new Date(2199,11,31,0,0,0,0);
      this.order.attributes.createdBy = this.user.attributes.username;
      if ($state.current.name === 'newOrderByCustomer') {
        this.order.attributes.customer = customer.id;
      }
      this.setupOrderView();
      this.order.attributes.version = lov.version;
      this.order.attributes.includeRemarksInBid = false;
      this.order.attributes.eventName = '';
      this.order.attributes.quotes = [];



      // initialize employee bonuses array
      this.order.attributes.empBonuses = angular.copy(pRoles);
      this.order.attributes.empBonuses.forEach(function(role) {
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
            that.order.attributes.activeQuote = j;
            that.order.view.quote = quote;
          }
          orderService.calcSubTotal(quote, that.order.attributes.isBusinessEvent, that.order.attributes.vatRate);

          that.order.attributes.quotes.push(quote);
          j++;
        }
      });
      if (j === 0) {    // no quotes created
        this.isActiveQuoteTab = false;
        this.isActiveGeneralTab = true;

      }
      this.order.attributes.vatRate = this.vatRate;
      this.order.attributes.activities = [];
      this.setReadOnly();
    }

    this.order.view.isChanged = false;
    window.onbeforeunload = function () {
    };
    window.onblur = function () {
    };
    $rootScope.menuStatus = 'show';
    this.order.backupOrderAttr = angular.copy(this.order.attributes);


  });
