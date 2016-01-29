'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function (api, $state, $filter, $modal, $rootScope,
                                     currentOrder, bids, lov, today, eventTypes,
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

    this.calcTotal = function () {
      var thisOrder = this.order.attributes;
      var quote = this.order.view.quote;

      var t = quote.subTotal
            + quote.discount
            + quote.oldTransportation // old style
            + quote.transportationBonus
            + quote.bonusValue;
      if (thisOrder.isBusinessEvent) {
        var v = t * thisOrder.vatRate;
      } else {
        v = 0;
      }
      quote.total = Math.round(t + v);
      if (thisOrder.isBusinessEvent) {
        quote.totalBeforeVat = quote.total / (1 + thisOrder.vatRate);
        quote.transportationInclVat = quote.transportation * (1 + thisOrder.vatRate); // just to display on order list
      } else {
        quote.totalBeforeVat = quote.total;
        quote.transportationInclVat = quote.transportation;
      }
      quote.rounding = quote.totalBeforeVat - t;
      quote.vat = quote.total - quote.totalBeforeVat;

      // the following are for displaying vat in invoice even if non business event
      t = quote.isFixedPrice ? quote.fixedPrice : quote.total;
      quote.totalBeforeVatForInvoice = t / (1 + thisOrder.vatRate);
      quote.vatForInvoice = quote.totalBeforeVatForInvoice * thisOrder.vatRate;
    };

    this.calcSubTotal = function () {
      var thisOrder = this.order.attributes;
      var quote = this.order.view.quote;

      var subTotal = 0;
      var boxCount = 0;
      var satiety = 0;
      var bonus = 0;
      var transportationBonus = 0;
      var transportation = 0;
      var isOldFreeItems;
      for (i = 0; i < quote.items.length; i++) {
        var thisItem = quote.items[i];
        subTotal += thisItem.price;
        boxCount += thisItem.boxCount;
        satiety += thisItem.satietyIndex;
        if (thisItem.category.isTransportation) {  // just to display on order list
          transportation += thisItem.price;
        }
        if (thisItem.isFreeItem) {
          if (thisItem.price===0) { // old style free item - issue alert
            isOldFreeItems = true;
          }
          if (thisItem.category.isTransportation) {
            transportationBonus -= thisItem.price;
          } else {
            bonus -= thisItem.price;
          }
        }
      }

      if(isOldFreeItems) {
        alert('שים לב, יש באירוע פריטי בונוס ישנים עם מחיר 0, יש לעדכן את המחיר')
      }
      quote.subTotal = subTotal;
      quote.boxEstimate = boxCount;
      quote.satietyIndex = satiety;
      quote.bonusValue = bonus;
      quote.transportation = transportation;
      quote.transportationBonus = transportationBonus;
      quote.discount = -((subTotal+bonus+transportationBonus) * quote.discountRate / 100);
      quote.credits = quote.bonusValue + quote.transportationBonus + quote.discount;

      this.calcTotal();
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
              that.orderChanged('isBusinessEvent');
              that.calcSubTotal();
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
              that.orderChanged('isBusinessEvent');
              that.calcSubTotal();
              break;
          }
        });
      }
    };


    this.orderChanged = function (field) {
      this.order.view.isChanged = true;
      if (field) {
        this.order.view.changes[field] = true;
      }
      window.onbeforeunload = function () {   // force the user to comit or abort changes before moving
        return "יש שינויים שלא נשמרו"
      };
      /*
      window.onblur = function () {
        alert('יש שינויים שלא נשמרו')
      };
      */
      $rootScope.menuStatus = 'empty';
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
                console.log('found error in field '+fieldName+' of item '+i);
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
      if (this.order.view.customer.id) {
        api.queryOrdersByCustomer(this.order.view.customer.id)
          .then(function (orders) {
            that.prevOrders = orders.filter(function (ord) {
              return ord.id !== that.order.id;    // exclude current order
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
      var thisOrder = this.order.attributes;
      var view = this.order.view;
      var quote = view.quote;

      // check for errors
      for (var fieldName in view.errors) {
        if (view.errors.hasOwnProperty(fieldName)) {
          if (view.errors[fieldName]) {
            alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
            return;
          }
        }
      }
      // check for errors in items
      for (i = 0; i < quote.items.length; i++) {
        var thisItem = quote.items[i];
        for (fieldName in thisItem.errors) {
          if (thisItem.errors.hasOwnProperty(fieldName)) {
            if (thisItem.errors[fieldName]) {
              alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
              return;
            }
          }
        }
      }

      // todo: handle errors, isChanged and sort items on multiple quotes

      if (view.eventType) {
        thisOrder.eventType = view.eventType.tId;
      }
      if (view.startBidTextType) {
        thisOrder.startBidTextType = view.startBidTextType.tId;
      }
      if (view.endBidTextType) {
        thisOrder.endBidTextType = view.endBidTextType.tId;
      }
      if (view.discountCause) {
        quote.discountCause = view.discountCause.tId;
      }
      if (view.referralSource) {
        thisOrder.referralSource = view.referralSource.tId;
      }
      thisOrder.customer = view.customer.id;
      thisOrder.contact = view.contact.id;
      if (!thisOrder.contact) {   // if contact is changed to null, make sure it is deleted in parse. see api.saveObj
        if (this.order.delAttributes) {
          this.order.delAttributes.contact = true
        } else {
          this.order.delAttributes = {contact: true}
        }
      }
      thisOrder.orderStatus = view.orderStatus.id;

      // wipe errors and changes indication from items
      for (i = 0; i < quote.items.length; i++) {
        quote.items[i].errors = {};
        quote.items[i].isChanged = false;
      }

      // sort items by category and productDescription
      quote.items.sort(function (a, b) {
        if (a.category.order > b.category.order) {
          return 1;
        } else if (a.category.order < b.category.order) {
          return -1
        } else if (a.productDescription > b.productDescription) {
          return 1
        } else return -1;
      });

      for (i=0;i<quote.categories.length;i++) {
        quote.categories[i].isChanged = false;
      }

      // todo: handle multiple quotes
      this.order.attributes.quotes[0] = quote;

      //  if we save a new order for the first time we have to assign it an order number and bump the order number counter
      //  we do this in 4 steps by chaining 'then's
      if ($state.current.name === 'newOrder' || $state.current.name === 'dupOrder') {
        var that = this;
        //  I. query OrderNum class containing single counter object
        return api.queryOrderNum()
          //  II. bump counter and assign it to order
          .then(function (results) {
            that.order.attributes.number = results[0].attributes.lastOrder + 1;
            results[0].attributes.lastOrder = that.order.attributes.number;
            return api.saveObj(results[0]);
          })
          //  III. save order
          .then(function () {
          return api.saveObj(that.order);
        })
          //  IV. change state to editOrder
          .then(function (ord) {
          $state.go('editOrder', {id: ord.id});
        });
        // if not new order, just save it without waiting for resolve
      } else {
        api.saveObj(this.order);
      }
      //  backup order for future cancel
      view.isChanged = false;
      window.onbeforeunload = function () {
      };
      window.onblur = function () {
      };
      $rootScope.menuStatus = 'show';
      view.changes = {};
      this.backupOrderAttr = angular.copy(this.order.attributes);
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
          that.getPrevOrders();
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
      this.order.attributes = angular.copy(this.backupOrderAttr);
      this.setupOrderView();
    };


    // main block
    var i;
    this.isNewOrder = $state.current.name === 'newOrder' || $state.current.name === 'dupOrder'; // used for view heading
    this.bids = bids;
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
      this.order.attributes.activities = [];
      this.setReadOnly();
    }
    this.calcSubTotal();

    this.order.view.isChanged = false;
    window.onbeforeunload = function () {
    };
    window.onblur = function () {
    };
    $rootScope.menuStatus = 'show';
    this.backupOrderAttr = angular.copy(this.order.attributes);


  });
