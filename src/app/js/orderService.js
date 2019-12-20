'use strict';

angular.module('myApp')

  .service('orderService', function ($rootScope, $state, api, lov, dater, colorsPromise) {


    this.calcTotal = function (quote, order) {
      var subTotal = 0;
      var subTotalForStat = 0; // doest not include extra services, except disposables and liquids
      var foodPrice = 0;
      var transportation = 0;
      var priceIncrease = 0;
      var extraServices = 0;
      var boxCount = 0;
      var satiety = 0;
      var isHeavyweight = false;
      var priceIncreaseItem;
      lov.specialTypes.forEach(function(st) {
        if (order.attributes.taskData) {
          delete order.attributes.taskData[st.exists];
          delete order.attributes.taskData[st.desc];
        }
      });
      quote.items.forEach(function(thisItem) {
        if (thisItem.category.type !== 4) {  // not priceIncrease
          if (!thisItem.isFreeItem) {
            if (thisItem.category.type === 5) {
              // exclude extraServices from total for stats, except disposables and liquids
              if (thisItem.specialType === 1 || thisItem.specialType === 5 ) {
                subTotalForStat += thisItem.price;
              }
              extraServices += thisItem.price;
            } else  {
              subTotal += thisItem.price;
              subTotalForStat += thisItem.price;
            }
            if (thisItem.category.type === 3) {  // just to display transportation  on order list
              transportation += thisItem.price;
            } else if (thisItem.category.type < 3) {
              foodPrice += thisItem.price;
            }
            }
          boxCount += thisItem.boxCount;
          satiety += thisItem.satietyIndex;
          if (thisItem.category.type === 2) {  // heavy food category
            isHeavyweight = true;
          }
          if (thisItem.specialType) {
            var specialType = lov.specialTypes.filter(function(st) {
              return st.id === thisItem.specialType;
            })[0];
            if (!order.attributes.taskData) {
              order.attributes.taskData = {};
            }
            order.attributes.taskData[specialType.exist] = true;
            if (order.attributes.taskData[specialType.desc]) {
              order.attributes.taskData[specialType.desc] += (', ' + thisItem.productDescription);
            } else {
              order.attributes.taskData[specialType.desc] = thisItem.productDescription;
            }
          }
        } else {
          priceIncreaseItem = thisItem;
        }
      });

      if (priceIncreaseItem) {
        priceIncrease = priceIncreaseItem.price = subTotal * priceIncreaseItem.quantity / 100;
      }

      quote.subTotal = Math.round(subTotal);
      quote.foodPrice = Math.round(foodPrice);
      quote.transportation = Math.round(transportation);
      quote.priceIncrease = Math.round(priceIncrease);
      quote.extraServices = Math.round(extraServices);
      quote.discount = Math.round(-(subTotal * quote.discountRate / 100));
      quote.perPerson = Math.round((quote.subTotal + quote.discount) / order.attributes.noOfParticipants);
      quote.boxEstimate = boxCount;
      quote.satietyIndex = satiety;
      quote.isHeavyweight = isHeavyweight;

      if(quote.isFixedPrice) {
        quote.total = quote.fixedPrice;
        quote.totalBeforeVat = quote.transportationInclVat = quote.vat = 0;
        quote.totalForStat = quote.fixedPrice / (1 + order.attributes.vatRate);  // stat is before vat
      } else {
        quote.totalForStat = subTotalForStat +
          quote.discount +
          quote.priceIncrease;
        quote.totalBeforeVat = quote.subTotal + quote.discount + quote.priceIncrease + quote.extraServices;;
        if (order.attributes.isBusinessEvent) {
          quote.vat = Math.round(quote.totalBeforeVat * order.attributes.vatRate);
          quote.total = quote.totalBeforeVat + quote.vat;
          quote.transportationInclVat = quote.transportation * (1 + order.attributes.vatRate); // just to display on order list
        } else {
          quote.vat = 0;
          quote.total = quote.totalBeforeVat;
          quote.totalForStat = quote.totalForStat / (1 + order.attributes.vatRate);  // stat is before vat
          quote.transportationInclVat = quote.transportation;
        }
      }

      quote.balance = quote.total - quote.advance;

      // the following are for displaying vat in invoice even if non business event
      quote.totalBeforeVatForInvoice = quote.total / (1 + order.attributes.vatRate);
      quote.vatForInvoice = quote.totalBeforeVatForInvoice * order.attributes.vatRate;


      this.checkTasks(order);
    };

    this.orderChanged = function (order, field) {
      order.view.isChanged = true;
      if (field) {
        order.view.changes[field] = true;
      }
      this.checkTasks(order);  // check if change influenced status of tasks
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
      quote.credits = 0;
      quote.transportationInclVat = 0;  // just to display on order list
      quote.transportation = 0;  // just to display on order list
      quote.extraServices = 0;
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
      if (view.cancelReason) {
        thisOrder.cancelReason = view.cancelReason.tId;
      }
      thisOrder.tasks = [];
      thisOrder.taskDetails = [];
      view.columns.forEach(function(column) {
      column.phases.forEach(function(phase) {
        var pTasks = phase.tasks.map(function(t) {
          return {
            tId: t.tId,
            isDone: t.isDone,
            isShow: t.isShow,
            isDisabled: t.isDisabled
          };
        });
        thisOrder.tasks = thisOrder.tasks.concat(pTasks);
        phase.tasks.forEach(function(t) {
          var tDetails = t.details.map(function(d) {
            return {
              tId: d.tId,
              isDone: d.isDone,
              inputText: d.inputText,
              boolean: d.boolean
            };
          });
          thisOrder.taskDetails = thisOrder.taskDetails.concat(tDetails);
        });
      });
      });
      console.log('task to save:');
      console.log(thisOrder.tasks);
      console.log('details to save:');
      console.log(thisOrder.taskDetails);

      console.log(view);
      // thisOrder.customer = view.customer.id;
      // thisOrder.contact = view.contact.id;
      if (!thisOrder.contact) {   // if contact is changed to null, make sure it is deleted in parse. see api.saveObj
        if (order.delAttributes) {
          order.delAttributes.contact = true
        } else {
          order.delAttributes = {contact: true}
        }
      }
      if (!thisOrder.referrer) {   // if referrer is changed to null, make sure it is deleted in parse. see api.saveObj
        if (order.delAttributes) {
          order.delAttributes.referrer = true
        } else {
          order.delAttributes = {referrer: true}
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

    this.checkTasks = function (order) {
      var columns = order.view.columns;
      columns.forEach(function(column) {
        column.phases.forEach(function(phase) {
          phase.tasks.forEach(function(task) {
            task.details.forEach(function(detail) {
              if (detail.type === 1) {
                detail.isDone = Boolean(eval(detail.attributeName));
              }
              if (detail.type === 3) {
                detail.inputText = order.attributes.taskData[detail.attributeName]
              }
           });
          });
        });
      });
      columns.forEach(function(column) {
      column.phases.forEach(function(phase) {
        phase.isDone = true;
        phase.tasks.forEach(function(task) {
          task.isDisabled = false;  // task is disabled as long as one of its details is shown and required and not done
          var unDoneCnt = 0; // automatically mark task done if all its details are done
          var doneCnt = 0;
          task.details.forEach(function(detail) {
            if(detail.condition) {
              detail.isShow = Boolean(eval(detail.condition)); // evaluate condition to show detail
            } else {
              detail.isShow = true;
            }
            if (detail.isRequired && detail.isShow && !detail.isDone) {
              task.isDisabled = true;
              task.isDone = false;
            }
            if (detail.isDone) {
              doneCnt++
            } else {
              unDoneCnt++;
            }
          });
          if (doneCnt && !unDoneCnt) {  // at least one done detail and no undone details
            task.isDone = true;
          }
          if (!task.isDone) {
            phase.isDone = false;
          }
        });
      });
      });
      };

    // used to update the header object in order. This is a flattening mechanism, so when retrieving lists of orders
    // it will not be necessary to load all the quotes objects, just the total etc. from the active quote, and the last
    // activity. it should be called before all save operations on Order

    this.setupOrderHeader = function (order) {
      var currentQuote = order.quotes[order.activeQuote];
      var done = '';
      var undone = '';
      if (typeof order.taskData !== 'undefined') {
        var t = order.taskData;
        if (t.isSurpriseParty) {
          done += 'הפתעה,';
        }
        if (t.isEquipRental && !t.isEquipRentalDone) {
          undone += 'השכרת ציוד,';
        }
        if (t.isEquipRental && t.isEquipRentalDone) {
          done += 'השכרת ציוד,';
        }
        if (t.isCustomerEquipRental) {
          done += 'השכרה לקוח,';
        }
        if (t.isDisposableDishes && !t.isDisposableDishesDone) {
          undone += 'ח"פ,';
        }
        if (t.isDisposableDishes && t.isDisposableDishesDone) {
          done += 'ח"פ,';
        }
        if (t.isWaiters && !t.isWaitersDone) {
          undone += 'מלצרים,';
        }
        if (t.isWaiters && t.isWaitersDone) {
          done += 'מלצרים,';
        }
        if (t.isEventManager && !t.isEventManagerDone) {
          undone += 'מנהל ארוע,';
        }
        if (t.isEventManager && t.isEventManagerDone) {
          done += 'מנהל ארוע,';
        }
        if (t.isLiquids && !t.isLiquidsDone) {
          undone += 'שתיה,';
        }
        if (t.isLiquids && t.isLiquidsDone) {
          done += 'שתיה,';
        }
        if (t.isOtherExtras && !t.isOtherExtrasDone) {
          if (t.otherExtras) {
            undone += (t.otherExtras + ',');
          }
        }
        if (t.isOtherExtras && t.isOtherExtrasDone) {
          if (t.otherExtras) {
            done += (t.otherExtras + ',');
          }
        }
        if (undone.length) { // trim trailing ,
          undone = undone.slice(0, undone.length - 1)
        }
        if (done.length) { // trim trailing ,
          done = done.slice(0, done.length - 1)
        }
      }
      if (currentQuote) {
        order.header = {
          'title': currentQuote.title,
          'menuType': currentQuote.menuType,
          'total': currentQuote.total,
          'totalForStat': currentQuote.totalForStat,
          'balance': currentQuote.balance,
          'transportationInclVat': currentQuote.transportationInclVat,
          'discountRate': currentQuote.discountRate,
          'isHeavyweight': currentQuote.isHeavyweight,
          'activityDate': order.activities.length ? order.activities[0].date : undefined,
          'activityText': order.activities.length ? order.activities[0].text.slice(0, 30) : undefined,
          'extraDone': done,
          'extraUndone': undone
        };
      } else {  // no quotes maybe in case of lead
        order.header = {
          'title': 'פניה',
          'menuType': null,
          'total': 0,
          'totalForStat': 0,
          'balance': 0,
          'transportationInclVat': 0,
          'discountRate': 0,
          'isHeavyweight': false,
          'activityDate': order.activities.length ? order.activities[0].date : undefined,
          'activityText': order.activities.length ? order.activities[0].text.slice(0, 30) : undefined,
          'extraDone': done,
          'extraUndone': undone
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
              order.attributes.orderStatus === 0 ||
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
        if (order.view.orderStatus.id >= 1 && order.view.orderStatus.id <= 5 && // new status
            !order.attributes.bidDate) {
          order.attributes.bidDate = new Date();
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
