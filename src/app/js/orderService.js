'use strict';

angular.module('myApp')

  .service('orderService', function ($rootScope, $state, api, lov, dater, colorsPromise) {

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
      var isHeavyweight = false;
      var isOldFreeItems;
      var priceIncreaseItem;
      quote.items.forEach(function(thisItem) {
        if (thisItem.category.type !== 4) {  // not priceIncrease
          subTotal += thisItem.price;
          boxCount += thisItem.boxCount;
          satiety += thisItem.satietyIndex;
          if (thisItem.category.type === 3) {  // just to displaytransportation  on order list
            transportation += thisItem.price;
          }
          if (thisItem.isFreeItem) {
            if (thisItem.price === 0) { // old style free item - issue alert
              isOldFreeItems = true;
            }
            if (thisItem.category.type === 3) {   // transportation category
              transportationBonus -= thisItem.price;
            } else {
              bonus -= thisItem.price;
            }
          }
          if (thisItem.category.type === 2) {  // heavy food category
            isHeavyweight = true;
          }
        } else {
          priceIncreaseItem = thisItem;
        }
      });

      if (priceIncreaseItem) {
        priceIncreaseItem.price = subTotal * priceIncreaseItem.quantity / 100;
        subTotal += priceIncreaseItem.price;
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
      quote.isHeavyweight = isHeavyweight;

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

    this.filterCategories = function (quote) {
      var res = [];
      if (quote.categories) {   // false for old orders
        res = quote.categories.filter(function (qCat) {
          var temp = quote.items.filter(function (itm) {
            return itm.category.tId === qCat.tId;
          });
          return temp.length;
        });
      }
      return res;
    };

    this.quoteChanged = function (order, field) {
      if (field) {
        order.view.quote.changes[field] = true;
      } else {
        order.view.quote.changes.general = true;
      }
      // calculate cumulative error for quoteData view, to show on radio button label
      order.view.quote.errors.quoteData = order.view.quote.errors.discountRate ||
                                          order.view.quote.errors.fixedPrice;
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

      // check if any quote has been created
      if (thisOrder.quotes.length===0) {
        if ((view.orderStatus.id > 0 && view.orderStatus.id < 6) ||
            thisOrder.template) {
          alert('לא ניתן לשמור. יש ליצור לפחות תפריט אחד');
          return;
        }
      }
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

      if (view.startBidTextType) {
        thisOrder.startBidTextType = view.startBidTextType.tId;
      }
      if (view.endBidTextType) {
        thisOrder.endBidTextType = view.endBidTextType.tId;
      }
      if (view.referralSource) {
        thisOrder.referralSource = view.referralSource.tId;
      }
      if (view.cancelReason) {
        thisOrder.cancelReason = view.cancelReason.tId;
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

      this.setStatus(order);

      // wipe changed indication from bonuses array
      thisOrder.empBonuses.forEach(function(role) {
        role.isChanged = false;
      });

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
            window.onbeforeunload = function () {
            };
            window.onblur = function () {
            };
            $rootScope.menuStatus = 'show';
            //  backup order for future cancel
            order.backupOrderAttr = angular.copy(order.attributes);
            $state.go('editOrder', {id: ord.id, isFromNew: 1});
          });
      } else {  // not new order
        this.setupOrderHeader(order.attributes);
        // check if order in DB was updated since we retrieved it
        api.queryOrder(order.id)
          .then(function(ord) {
            if (ord[0].updatedAt.toString() !== order.updatedAt.toString()) {
              alert ('האירוע עודכן בחלון אחר. לא ניתן לבצע את העדכון הנוכחי');
            } else {
              api.saveObj(order)
                .then(function() {
                  api.queryOrder(order.id)  // requery order to get current update time
                    .then(function(ord2) {
                      order.updatedAt = ord2[0].updatedAt;
                      view.isChanged = false;
                      view.changes = {};
                      window.onbeforeunload = function () {
                      };
                      window.onblur = function () {
                      };
                      $rootScope.menuStatus = 'show';
                      //  backup order for future cancel
                      order.backupOrderAttr = angular.copy(order.attributes);
                    });
                })
            }
          })
      }
    };

    // upgrade lead to bid status if 3 required attributes are given
    this.upgradeOrderStatus = function(order) {
      if (order.view.orderStatus.id === 0) {
        if (order.view.customer.id &&
            order.attributes.noOfParticipants &&
            order.attributes.quotes.length) {
          order.view.orderStatus = lov.orderStatuses.filter(function(os) {
            return os.id === 1;
          })[0];
        }
      }
    };


    // used to update the header object in order. This is a flattening mechanism, so when retrieving lists of orders
    // it will not be necessary to load all the quotes objects, just the total etc. from the active quote, and the last
    // activity. it should be called before all save operations on Order

    this.setupOrderHeader = function (order) {
      var currentQuote = order.quotes[order.activeQuote];
      if (currentQuote) {
        order.header = {
          'title': currentQuote.title,
          'menuType': currentQuote.menuType,
          'total': currentQuote.total,
          'balance': currentQuote.balance,
          'transportationInclVat': currentQuote.transportationInclVat,
          'discountRate': currentQuote.discountRate,
          'isHeavyweight': currentQuote.isHeavyweight,
          'activityDate': order.activities.length ? order.activities[0].date : undefined,
          'activityText': order.activities.length ? order.activities[0].text.slice(0, 30) : undefined
        };
      } else {  // no quotes maybe in case of lead
        order.header = {
          'title': 'פניה',
          'menuType': null,
          'total': 0,
          'balance': 0,
          'transportationInclVat': 0,
          'discountRate': 0,
          'isHeavyweight': false,
          'activityDate': order.activities.length ? order.activities[0].date : undefined,
          'activityText': order.activities.length ? order.activities[0].text.slice(0, 30) : undefined
        };
      }
    };

    this.setStatus = function(order) {
      if (order.view.orderStatus.id !== order.attributes.orderStatus) {
        var txt = ((typeof(order.attributes.orderStatus) === 'undefined')
          ?  'האירוע נוצר בסטטוס ' : 'סטטוס האירוע שונה ל- ') +
                  order.view.orderStatus.name;
        order.attributes.activities.splice(0, 0, {date: new Date(), text: txt});
        if (order.attributes.header) {
          // if called from orderList we  have to update header fields directly
          order.attributes.header.activityDate = order.attributes.activities[0].date;
          order.attributes.header.activityText = order.attributes.activities[0].text;
        }
        // in transition from not closed to closed, set closure date
        if (order.view.orderStatus.id >= 2 && order.view.orderStatus.id <= 5) {    // new status
          if (order.attributes.orderStatus === undefined ||
              order.attributes.orderStatus === 1 ||
              order.attributes.orderStatus === 6) { // prev status
            order.attributes.closingDate = new Date();
          }
        } else {
          if (order.delAttributes) {
            order.delAttributes.closingDate = true;
          } else {
            order.delAttributes = {closingDate: true};
          }
        }
        order.attributes.orderStatus = order.view.orderStatus.id;
      }
    };

    this.generateOrderColors = function() {

      var DAYS_TO_COLOR = 7;

      var fields = ['eventDate', 'eventTime', 'number','orderStatus','template','color'];
      var from = dater.today();
      var to = angular.copy(from);
      to.setDate(to.getDate()+ DAYS_TO_COLOR);
       api.queryOrdersByRange('eventDate',from,to,fields)
        .then(function(orders) {
            var newOrders = orders.filter(function(order) { // find orders without color assignment
            return  !order.attributes.template &&
              order.attributes.orderStatus >= 2 &&
              order.attributes.orderStatus <= 5 &&
              !order.attributes.color;
          });
          if (newOrders.length > 0) {
            console.log('found '+newOrders.length+' orders in immediate future without colors');
            newOrders.sort(function(a,b) {
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
              return a1 - b1;
            });
            var existingColors = orders.filter(function(order) {
              return order.attributes.color;
            }).map(function(order) {
              return order.attributes.color;
            });
               colorsPromise.then(function(allColors) {
                 // find a new color for each new order
                 newOrders.forEach(function(newOrder) {
                   var remainingColors = allColors.filter(function(allColor) {
                     var t1 = existingColors.filter(function(eColor) {
                       return eColor === allColor.tId;
                     });
                     return !t1.length; // if color was not previously in use, select it
                   });
                   if (remainingColors.length) {  // check if there are any colors to assigns to order
                     var selectedColor = remainingColors[0].tId;
                     console.log('selected color '+selectedColor+' for order '+newOrder.attributes.number);
                     newOrder.attributes.color = selectedColor;
                     existingColors.push(selectedColor);
                     api.saveObj(newOrder);
                   } else {
                     console.log('no color available for order ' + newOrder.attributes.number);
                   }
                 });
               });
          }
        });
    };

  });
