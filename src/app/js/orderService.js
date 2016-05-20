'use strict';

angular.module('myApp')

  .service('orderService', function ($rootScope) {

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
