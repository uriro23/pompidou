'use strict';

angular.module('myApp')

  .service('orderService', function ($rootScope, $state, api, lov) {

    this.calcTotal = function (quote, isBusinessEvent, vatRate) {
     if(quote.isFixedPrice) {
        quote.total = quote.fixedPrice;
        quote.totalBeforeVat = quote.transportationInclVat = quote.rounding = quote.vat = 0;
      } else {
        var t = quote.subTotal
          + quote.discount
          + quote.oldTransportation // old style
          + quote.transportationBonus
          + quote.bonusValue;
        if (isBusinessEvent) {
          var v = t * vatRate;
        } else {
          v = 0;
        }
        quote.total = Math.round(t + v);
        if (isBusinessEvent) {
          quote.totalBeforeVat = quote.total / (1 + vatRate);
          quote.transportationInclVat = quote.transportation * (1 + vatRate); // just to display on order list
        } else {
          quote.totalBeforeVat = quote.total;
          quote.transportationInclVat = quote.transportation;
        }
        quote.rounding = quote.totalBeforeVat - t;
        quote.vat = quote.total - quote.totalBeforeVat;
      }

      quote.balance = quote.total - quote.advance;

      // the following are for displaying vat in invoice even if non business event
      quote.totalBeforeVatForInvoice = quote.total / (1 + vatRate);
      quote.vatForInvoice = quote.totalBeforeVatForInvoice * vatRate;
    };

    this.calcSubTotal = function (quote, isBusinessEvent, vatRate) {

      var subTotal = 0;
      var boxCount = 0;
      var satiety = 0;
      var bonus = 0;
      var transportationBonus = 0;
      var transportation = 0;
      var isOldFreeItems;
      for (var i = 0; i < quote.items.length; i++) {
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

      this.calcTotal(quote, isBusinessEvent, vatRate);
    };

    this.orderChanged = function (order, field) {
      order.view.isChanged = true;
      if (field) {
        order.view.changes[field] = true;
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

    function calcItemErrors (items) {
        for (var i = 0; i < items.length; i++) {
          var thisItem = items[i];
          for (var fieldName in thisItem.errors) {
            if (thisItem.errors.hasOwnProperty(fieldName)) {
              if (thisItem.errors[fieldName]) {
                return true;
              }
            }
          }
        }
      return false;
    }



    this.quoteChanged = function (order, field) {
      if (field) {
        order.view.quote.changes[field] = true;
      } else {
        order.view.quote.changes.general = true;
      }
      // calculate cumulative error for quoteData view, to show on radio button label
      order.view.quote.errors.quoteData = order.view.quote.errors.discountRate ||  order.view.quote.errors.fixedPrice;
      order.view.quote.errors.items = calcItemErrors (order.view.quote.items);
      this.orderChanged(order);
    };


    this.initQuote = function (mt, categories, discountCause) {
      var quote = {};
      quote.menuType = mt;
      quote.endBoxType = mt;
      quote.title = mt.label;
      quote.subTotal = 0;
      quote.discountCause = discountCause;
      quote.discountRate = 0;
      quote.discount = 0;
      quote.bonusValue = 0;
      quote.credits = 0;
      quote.transportationInclVat = 0;  // just to display on order list
      quote.transportation = 0;  // just to display on order list
      quote.transportationBonus = 0;
      quote.oldTransportation = 0;
      quote.advance = 0;
      quote.categories = angular.copy(categories); // used to edit category descriptions
      quote.categories.forEach (function(cat) {
        cat.isShowDescription = true;
      });
      quote.items = [];
      quote.isActive = false;
      quote.changes = {};
      quote.errors = {};
      return quote;
    };



    this.saveOrder = function (order) {
      var thisOrder = order.attributes;
      var view = order.view;

      // check for errors except in quotes
      for (var fieldName in view.errors) {
        if (view.errors.hasOwnProperty(fieldName)) {
          if (view.errors[fieldName]) {
            alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
            return;
          }
        }
      }

      // handle errors in quotes
      var err = false;
      thisOrder.quotes.forEach(function(q) {
        for (fieldName in q.errors) {
          if (q.errors.hasOwnProperty(fieldName)) {
            if (q.errors[fieldName]) {
              alert('לא ניתן לשמור. תקן קודם את השגיאות ב'+ q.title);
              err = true;
            }
          }
        }
     });

      if (err) {
        return;
      }

      if (view.eventType) {
        thisOrder.eventType = view.eventType.tId;
      }
      if (view.startBidTextType) {
        thisOrder.startBidTextType = view.startBidTextType.tId;
      }
      if (view.endBidTextType) {
        thisOrder.endBidTextType = view.endBidTextType.tId;
      }
      if (view.referralSource) {
        thisOrder.referralSource = view.referralSource.tId;
      }
      thisOrder.customer = view.customer.id;
      thisOrder.contact = view.contact.id;
      if (!thisOrder.contact) {   // if contact is changed to null, make sure it is deleted in parse. see api.saveObj
        if (order.delAttributes) {
          order.delAttributes.contact = true
        } else {
          order.delAttributes = {contact: true}
        }
      }
      thisOrder.orderStatus = view.orderStatus.id;


      // handle quotes
      thisOrder.quotes.forEach(function(q) {
        q.changes = {};
        // wipe errors and changes indication from items
        q.items.forEach(function (thisItem) {
          thisItem.errors = {};
          thisItem.isChanged = false;
        });

        // sort items by category and productDescription
        q.items.sort(function (a, b) {
          if (a.category.order > b.category.order) {
            return 1;
          } else if (a.category.order < b.category.order) {
            return -1
          } else if (a.productDescription > b.productDescription) {
            return 1
          } else return -1;
        });

        if (q.categories) {
          q.categories.forEach(function (cat) {
            cat.isChanged = false;
          });
        }
     });

      //  if we save a new order for the first time we have to assign it an order number and bump the order number counter
      //  we do this in 4 steps by chaining 'then's
      if ($state.current.name === 'newOrder' ||
          $state.current.name === 'dupOrder' ||
          $state.current.name === 'newOrderByCustomer') {
        var that = this;
        //  I. query OrderNum class containing single counter object
        return api.queryOrderNum()
          //  II. bump counter and assign it to order
          .then(function (results) {
            order.attributes.number = results[0].attributes.lastOrder + 1;
            results[0].attributes.lastOrder = order.attributes.number;
            return api.saveObj(results[0]);
          })
          //  III. save order
          .then(function () {
            that.setupOrderHeader(order.attributes);
            return api.saveObj(order);
          })
          //  IV. change state to editOrder
          .then(function (ord) {
            $state.go('editOrder', {id: ord.id});
          });
        // if not new order, just save it without waiting for resolve
      } else {
        this.setupOrderHeader(order.attributes);
        api.saveObj(order);
      }
      //  backup order for future cancel
      view.isChanged = false;
      window.onbeforeunload = function () {
      };
      window.onblur = function () {
      };
      $rootScope.menuStatus = 'show';
      view.changes = {};
      order.backupOrderAttr = angular.copy(order.attributes);
    };


    // used to update the header object in order. This is a flattening mechanism, so when retrieving lists of orders
    // it will not be necessary to load all the quotes objects, just the total etc. from the active quote, and the last
    // activity. it should be called before all save operations on Order

    this.setupOrderHeader = function (order) {
      var currentQuote = order.quotes[order.activeQuote];
      order.header = {
        'total': currentQuote.total,
        'balance': currentQuote.balance,
        'transportationInclVat': currentQuote.transportationInclVat,
        'discountRate': currentQuote.discountRate,
        'activityDate': order.activities.length?order.activities[0].date:undefined,
        'activityText': order.activities.length?order.activities[0].text:undefined
      }
    };


  });
