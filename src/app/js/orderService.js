'use strict';

angular.module('myApp')

  .service('orderService', function ($rootScope, $state, api, lov) {

    this.calcTotal = function (order) {
      var thisOrder = order.attributes;
      var quote = order.view.quote;
      if(quote.isFixedPrice) {
        quote.total = quote.fixedPrice;
        quote.totalBeforeVat = quote.transportationInclVat = quote.rounding = quote.vat = 0;
      } else {
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
      }

      quote.balance = quote.total - quote.advance;

      // the following are for displaying vat in invoice even if non business event
      quote.totalBeforeVatForInvoice = quote.total / (1 + thisOrder.vatRate);
      quote.vatForInvoice = quote.totalBeforeVatForInvoice * thisOrder.vatRate;
    };

    this.calcSubTotal = function (order) {
      var thisOrder = order.attributes;
      var quote = order.view.quote;

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

      this.calcTotal(order);
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



    this.saveOrder = function (order) {
      var thisOrder = order.attributes;
      var view = order.view;
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
        if (order.delAttributes) {
          order.delAttributes.contact = true
        } else {
          order.delAttributes = {contact: true}
        }
      }
      thisOrder.orderStatus = view.orderStatus.id;

      // wipe errors and changes indication from items
      for (var i = 0; i < quote.items.length; i++) {
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

      if (quote.categories) {
        for (i = 0; i < quote.categories.length; i++) {
          quote.categories[i].isChanged = false;
        }
      }

      // todo: handle multiple quotes
      order.attributes.quotes[0] = quote;

      //  if we save a new order for the first time we have to assign it an order number and bump the order number counter
      //  we do this in 4 steps by chaining 'then's
      if ($state.current.name === 'newOrder' || $state.current.name === 'dupOrder') {
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
