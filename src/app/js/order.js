'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function (api, $state, $filter, $modal, $rootScope, orderService,
                                     currentOrder, lov, today, eventTypes,
                                     bidTextTypes, categories, measurementUnits,
                                     discountCauses, referralSources, menuTypes, config) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }

    this.setReadOnly = function () {
      this.isReadOnly = this.order.attributes.eventDate &&
                        this.order.attributes.eventDate < today &&
                        !this.order.attributes.template;
    };

    this.handleVatRateChange = function () {
      if (this.order.attributes.vatRate != this.vatRate && !this.isReadOnly) {
        var that = this;
        var quote = this.order.view.quote;
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

        //todo: change vat rate for multiple quotes
        vatChangeModal.result.then(function (res) {
          switch (res) {
            case '0':   // don't change vatRate
              break;
            case '1':   // change vatRate, don't change prices
              that.order.attributes.vatRate = that.vatRate;
              for (var i = 0; i < quote.items.length; i++) {
                var it1 = quote.items[i];
                it1.priceBeforeVat = it1.priceInclVat / (1 + that.vatRate);
                if (that.order.attributes.isBusinessEvent) {
                  it1.price = it1.priceBeforeVat;
                }
              }
              orderService.orderChanged(that.order,'isBusinessEvent');
              orderService.calcSubTotal(that.order);
              break;
            case '2':   // change vatRate, change prices
              that.order.attributes.vatRate = that.vatRate;
              for (var j = 0; j < quote.items.length; j++) {
                var it2 = quote.items[j];
                it2.priceInclVat = it2.priceBeforeVat * (1 + that.vatRate);
                if (!that.order.attributes.isBusinessEvent) {
                  it2.price = it2.priceInclVat;
                }
              }
              orderService.orderChanged(that.order,'isBusinessEvent');
              orderService.calcSubTotal(that.order);
              break;
          }
        });
      }
    };


   // items tab

    // todo: adapt for multiple quotes
    this.calcItemsTabErrors = function () { // called upon tab deselection to determine if error dummy tab should be displayed
      outer_loop:
        for (i = 0; i < this.order.view.quote.items.length; i++) {
          var thisItem = this.order.view.quote.items[i];
          for (var fieldName in thisItem.errors) {
            if (thisItem.errors.hasOwnProperty(fieldName)) {
              if (thisItem.errors[fieldName]) {
                this.isErrorItemsTab = true;
                break outer_loop;
              }
            }
          }
        }
    };

    this.switchItemsTab = function () { // called upon dummy error Items tab selection, causes real tab to display
      this.isItemsTabActive = true;
      this.isErrorItemsTab = false;
    };



    // financial tab

    this.calcFinancialTabErrors = function () { // called upon tab deselection to determine if error dummy tab should be displayed
      this.isErrorFinancialTab =  this.order.view.errors.discountRate ||
                                   this.order.view.errors.fixedPrice;
    };

    this.switchFinancialTab = function () { // called upon dummy error financial tab selection, causes real tab to display
      this.isFinancialTabActive = true;
      this.isErrorFinancialTab = false;
    };


    // activities tab
    // --------------

    // Documents tab
    // -------------

     // prev orders tab
    // ---------------

    this.getPrevOrders = function () {
      var that = this;
      var fieldList = [
        'orderStatus','noOfParticipants','eventDate','eventTime','orderStatus','customer','number','eventType','header'
      ];
      if (this.order.view.customer.id,fieldList) {
        api.queryOrdersByCustomer(this.order.view.customer.id)
          .then(function (orders) {
            that.prevOrders = orders.filter(function (ord) {
              return ord.id !== that.order.id;    // exclude current order
            });
            that.prevOrders.forEach(function(ord) {
              ord.view = {
                'orderStatus': lov.orderStatuses.filter (function(st) {
                  return st.id === ord.attributes.orderStatus;
                })[0],
                'eventType': ord.attributes.eventType ?
                    eventTypes.filter(function (et) {
                    return et.tId === ord.attributes.eventType;
                })[0]
                  : undefined
              }
            })
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
      orderService.saveOrder (this.order);
    };


    this.setupOrderView = function () {
      this.order.view = {};
      this.order.view.errors = {};
      this.order.view.changes = {};
      if ($state.current.name === 'editOrder' || $state.current.name === 'dupOrder') {  // existing order
        var that = this;
        this.order.view.quote = that.order.attributes.quotes[that.order.attributes.activeQuote]; // load active quote
        api.queryCustomers(that.order.attributes.customer)
          .then(function (custs) {
          if (!custs.length) {
            alert('customer not found');
            console.log('customer not found');
            console.log(that.order.attributes.customer);
          }
          that.order.view.customer = custs[0].attributes;
          that.order.view.customer.id = custs[0].id;
          // that.getPrevOrders();
        });
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
        this.order.view.eventType = eventTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.eventType);
        })[0];
        this.order.view.startBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.startBidTextType);
        })[0];
        this.order.view.endBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.endBidTextType);
        })[0];
        this.order.view.orderStatus = this.orderStatuses.filter(function (obj) {
          return (obj.id === that.order.attributes.orderStatus);
        })[0];
        this.order.view.discountCause = discountCauses.filter(function (obj) {
          return (obj.tId === that.order.view.quote.discountCause);
        })[0];
        this.order.view.referralSource = referralSources.filter(function (obj) {
          return (obj.tId === that.order.attributes.referralSource);
        })[0];
        this.order.view.menuType = menuTypes.filter(function(obj) {
          return (obj.tId === that.order.view.quote.menuType);
        })[0];
        this.order.view.endBoxType = menuTypes.filter(function(obj) {
          return (obj.tId === that.order.view.quote.endBoxType);
        })[0];
        this.order.view.endTextType = bidTextTypes.filter(function(obj) {
          return (obj.tId === that.order.view.quote.endTextType);
        })[0];
        if ($state.current.name === 'dupOrder') {
          this.order.view.errors.eventDate = true; // empty event date is error
        }
      } else { // newOrder
        this.order.view.quote = {};
        this.order.view.quote.categories = angular.copy(this.categories); // used to edit category descriptions
        for (var i=0;i<this.order.view.quote.categories.length;i++) {
          this.order.view.quote.categories[i].isShowDescription = true;
        }
        this.order.view.quote.items = [];
        this.order.view.customer = {};
        this.order.view.contact = {};
        this.order.view.orderStatus = this.orderStatuses[0]; // set to "New"
        this.order.view.discountCause = this.discountCauses[0]; // set to "no"
        this.order.view.referralSource = this.referralSources[0]; // set to "unknown"
        this.order.view.errors.eventDate = true; // empty event date is error
        this.order.view.errors.customer = true; // empty customer is error
        this.order.view.errors.noOfParticipants = true; // empty no of participants is error
       }
    };

    this.cancel = function () {
      window.onbeforeunload = function () {
      };
      window.onblur = function () {
      };
      $rootScope.menuStatus = 'show';
      this.order.attributes = angular.copy(this.order.backupOrderAttr);
      this.setupOrderView();
    };


    // main block
    var i;
    this.isNewOrder = $state.current.name === 'newOrder' || $state.current.name === 'dupOrder'; // used for view heading
    this.eventTypes = eventTypes;
    this.bidTextTypes = bidTextTypes;
    this.orderStatuses = lov.orderStatuses;
    this.categories = categories;
    this.measurementUnits = measurementUnits;
    this.discountCauses = discountCauses;
    this.referralSources = referralSources;
    this.menuTypes = menuTypes;
    this.config = config;
    this.vatRate = config.vatRate;
    this.activityDate = new Date();
    this.isItemsTabActive = true;

    if ($state.current.name === 'editOrder') {
      this.order = currentOrder;
      $rootScope.title = lov.company + ' - אירוע ' + this.order.attributes.number;
      this.setupOrderView();
      this.setReadOnly();
      this.handleVatRateChange();
      if(!this.order.view.quote.advance) {
        this.order.view.quote.advance = 0;   // to avoid NaN results on balance for old orders
      }
    } else if ($state.current.name === 'dupOrder') {
      $rootScope.title = lov.company + ' - אירוע חדש';
      this.order = api.initOrder();
      this.order.attributes = currentOrder.attributes;
      this.order.attributes.eventDate = undefined;
      this.order.attributes.eventTime = undefined;
      this.order.attributes.exitTime = undefined;
      this.order.attributes.activities = [];
      this.setupOrderView();
      this.setReadOnly();
      this.handleVatRateChange();
      if(!this.order.view.quote.advance) {
        this.order.view.quote.advance = 0;   // to avoid NaN results on balance for old orders
      }
    } else { // new order
      $rootScope.title = lov.company + ' - אירוע חדש';
      this.order = api.initOrder();
      this.setupOrderView();
      this.order.attributes.includeRemarksInBid = false;
      this.order.attributes.quotes = [];
      this.order.attributes.activeQuote= 0;
      this.order.attributes.quotes[this.order.attributes.activeQuote] = this.order.view.quote;
      this.order.attributes.vatRate = this.vatRate;
      this.order.view.quote.subTotal = 0;
      this.order.view.quote.discountRate = 0;
      this.order.view.quote.discount = 0;
      this.order.view.quote.bonusValue = 0;
      this.order.view.quote.credits = 0;
      this.order.view.quote.transportationInclVat = 0;  // just to display on order list
      this.order.view.quote.transportation = 0;  // just to display on order list
      this.order.view.quote.transportationBonus = 0;
      this.order.view.quote.oldTransportation = 0;
      this.order.view.quote.advance = 0;
      this.order.attributes.activities = [];
      this.setReadOnly();
    }
    orderService.calcSubTotal(this.order);

    this.order.view.isChanged = false;
    window.onbeforeunload = function () {
    };
    window.onblur = function () {
    };
    $rootScope.menuStatus = 'show';
    this.order.backupOrderAttr = angular.copy(this.order.attributes);


  });
