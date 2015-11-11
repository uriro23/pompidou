'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function (api, $state, $filter, $modal, $rootScope,
                                     currentOrder, bids, lov, today, eventTypes,
                                     bidTextTypes, categories, measurementUnits, discountCauses, config) {

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

      var t = thisOrder.subTotal
            + thisOrder.discount
            + thisOrder.transportation
            + thisOrder.transportationBonus
            + thisOrder.bonusValue;
      if (thisOrder.isBusinessEvent) {
        var v = t * thisOrder.vatRate;
      } else {
        v = 0;
      }
      thisOrder.total = Math.round(t + v);
      if (thisOrder.isBusinessEvent) {
        thisOrder.totalBeforeVat = thisOrder.total / (1 + thisOrder.vatRate);
      } else {
        thisOrder.totalBeforeVat = thisOrder.total;
      }
      thisOrder.rounding = thisOrder.totalBeforeVat - t;
      thisOrder.vat = thisOrder.total - thisOrder.totalBeforeVat;

      // the following are for displaying vat in invoice even if non business event
      t = thisOrder.isFixedPrice ? thisOrder.fixedPrice : thisOrder.total;
      thisOrder.totalBeforeVatForInvoice = t / (1 + thisOrder.vatRate);
      thisOrder.vatForInvoice = thisOrder.totalBeforeVatForInvoice * thisOrder.vatRate;
    };

    this.calcSubTotal = function () {
      var thisOrder = this.order.attributes;

      var subTotal = 0;
      var boxCount = 0;
      var satiety = 0;
      var bonus = 0;
      var transportationBonus = 0;
      var isOldFreeItems;
      for (i = 0; i < thisOrder.items.length; i++) {
        var thisItem = thisOrder.items[i];
        subTotal += thisItem.price;
        boxCount += thisItem.boxCount;
        satiety += thisItem.satietyIndex;
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
      thisOrder.subTotal = subTotal;
      thisOrder.boxEstimate = boxCount;
      thisOrder.satietyIndex = satiety;
      thisOrder.bonusValue = bonus;
      thisOrder.transportationBonus = transportationBonus;
      thisOrder.discount = -((subTotal+bonus+transportationBonus) * thisOrder.discountRate / 100);
      thisOrder.credits = thisOrder.bonusValue + thisOrder.transportationBonus + thisOrder.discount;

      this.calcTotal();
    };

    this.handleVatRateChange = function () {
      if (this.order.attributes.vatRate != this.vatRate && !this.isReadOnly) {
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
              for (var i = 0; i < that.order.attributes.items.length; i++) {
                var it1 = that.order.attributes.items[i];
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
              for (var j = 0; j < that.order.attributes.items.length; j++) {
                var it2 = that.order.attributes.items[j];
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
      window.onblur = function () {
        alert('יש שינויים שלא נשמרו')
      };
      $rootScope.menuStatus = 'empty';
    };

     // items tab

    this.calcItemsTabErrors = function () { // called upon tab deselection to determine if error dummy tab should be displayed
      outer_loop:
        for (i = 0; i < this.order.attributes.items.length; i++) {
          var thisItem = this.order.attributes.items[i];
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
                                  this.order.view.errors.transportationInclVat ||
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

      // check for errors
      for (var fieldName in this.order.view.errors) {
        if (this.order.view.errors.hasOwnProperty(fieldName)) {
          if (this.order.view.errors[fieldName]) {
            alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
            return;
          }
        }
      }
      // check for errors in items
      for (i = 0; i < thisOrder.items.length; i++) {
        var thisItem = thisOrder.items[i];
        for (fieldName in thisItem.errors) {
          if (thisItem.errors.hasOwnProperty(fieldName)) {
            if (thisItem.errors[fieldName]) {
              alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
              return;
            }
          }
        }
      }

      if (this.order.view.eventType) {
        thisOrder.eventType = this.order.view.eventType.tId;
      }
      if (this.order.view.startBidTextType) {
        thisOrder.startBidTextType = this.order.view.startBidTextType.tId;
      }
      if (this.order.view.endBidTextType) {
        thisOrder.endBidTextType = this.order.view.endBidTextType.tId;
      }
      if (this.order.view.discountCause) {
        thisOrder.discountCause = this.order.view.discountCause.tId;
      }
      thisOrder.customer = this.order.view.customer.id;
      thisOrder.contact = this.order.view.contact.id;
      if (!thisOrder.contact) {   // if contact is changed to null, make sure it is deleted in parse. see api.saveObj
        if (this.order.delAttributes) {
          this.order.delAttributes.contact = true
        } else {
          this.order.delAttributes = {contact: true}
        }
      }
      thisOrder.orderStatus = this.order.view.orderStatus.id;

      // wipe errors and changes indication from items
      for (i = 0; i < thisOrder.items.length; i++) {
        thisOrder.items[i].errors = {};
        thisOrder.items[i].isChanged = false;
      }

      // sort items by category and productDescription
      thisOrder.items.sort(function (a, b) {
        if (a.category.order > b.category.order) {
          return 1;
        } else if (a.category.order < b.category.order) {
          return -1
        } else if (a.productDescription > b.productDescription) {
          return 1
        } else return -1;
      });

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
      this.order.view.isChanged = false;
      window.onbeforeunload = function () {
      };
      window.onblur = function () {
      };
      $rootScope.menuStatus = 'show';
      this.order.view.changes = {};
      this.backupOrderAttr = angular.copy(this.order.attributes);
    };


    this.setupOrderView = function () {
      this.order.view = {};
      this.order.view.errors = {};
      this.order.view.changes = {};
      if ($state.current.name === 'editOrder' || $state.current.name === 'dupOrder') {
        var that = this;
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
          return (obj.tId === that.order.attributes.discountCause);
        })[0];
        if ($state.current.name === 'dupOrder') {
          this.order.view.errors.eventDate = true; // empty event date is error
        }
      } else { // newOrder
        this.order.view.customer = {};
        this.order.view.contact = {};
        this.order.view.orderStatus = this.orderStatuses[0]; // set to "New"
        this.order.view.discountCause = this.discountCauses[0]; // set to "no"
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
    var that = this;
    this.isNewOrder = $state.current.name === 'newOrder' || $state.current.name === 'dupOrder'; // used for view heading
    this.bids = bids;
    this.eventTypes = eventTypes;
    this.bidTextTypes = bidTextTypes;
    this.orderStatuses = lov.orderStatuses;
    this.categories = categories;
    this.measurementUnits = measurementUnits;
    this.discountCauses = discountCauses;
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
      this.order.attributes.activities = [];
      this.setupOrderView();
      this.setReadOnly();
      this.handleVatRateChange();
    } else { // new order
      $rootScope.title = lov.company + ' - אירוע חדש';
      this.order = api.initOrder();
      this.setupOrderView();
      this.order.attributes.includeRemarksInBid = false;
      this.order.attributes.items = [];
      this.order.attributes.vatRate = this.vatRate;
      this.order.attributes.subTotal = 0;
      this.order.attributes.discountRate = 0;
      this.order.attributes.discount = 0;
      this.order.attributes.bonusValue = 0;
      this.order.attributes.credits = 0;
      this.order.attributes.transportationInclVat = 0;
      this.order.attributes.transportation = 0;
      this.order.attributes.transportationBonus = 0;
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
