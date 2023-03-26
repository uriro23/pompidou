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
      var waitersFee = 0;
      var boxCount = 0;
      var satiety = 0;
      var isHeavyweight = false;
      var priceIncreaseItem;
     quote.items.forEach(function(thisItem) {
        if (thisItem.category.type !== 4) {  // not priceIncrease
          if (!thisItem.isFreeItem) {
            if (thisItem.category.type === 5) {
              // exclude extraServices from total for stats, except disposables and liquids
              if (thisItem.specialType === 1 || thisItem.specialType === 5 ) {
                subTotalForStat += thisItem.price;
              }
              extraServices += thisItem.price;
              if (thisItem.specialType === 3) {  // accumulate waiters fee which is deducted from invoice
                waitersFee += thisItem.price;
              }
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
      quote.waitersFee = Math.round(waitersFee);
      quote.discount = Math.round(-(subTotal * quote.discountRate / 100));
      quote.perPerson = Math.round((quote.subTotal + quote.discount) / order.properties.noOfParticipants);
      quote.boxEstimate = boxCount;
      quote.satietyIndex = satiety;
      quote.isHeavyweight = isHeavyweight;

      // compute coupon discount
      quote.couponDiscount = 0;
      if (order.properties.couponAppliedType) {
        if (order.properties.couponAppliedType === 1) {
          var totalForCoupon = quote.subTotal - quote.transportation - quote.extraServices;
          console.log('tot for coupon: ' + totalForCoupon);
          if (totalForCoupon > 1500) {
            quote.couponDiscount = -300;
            console.log('coupon applied');
          }
        }
      }

      if(quote.isFixedPrice) {
        quote.total = quote.fixedPrice;
        quote.totalBeforeVat = quote.transportationInclVat = quote.vat = 0;
        quote.totalForStat = quote.fixedPrice / (1 + order.properties.vatRate);  // stat is before vat
      } else {
        quote.totalForStat = subTotalForStat + quote.discount + quote.couponDiscount + quote.priceIncrease;
        quote.totalBeforeVat = quote.subTotal + quote.discount + quote.couponDiscount + quote.priceIncrease + quote.extraServices;;
        if (order.properties.isBusinessEvent) {
          quote.vat = Math.round(quote.totalBeforeVat * order.properties.vatRate);
          quote.total = quote.totalBeforeVat + quote.vat;
          quote.transportationInclVat = quote.transportation * (1 + order.properties.vatRate); // just to display on order list
          quote.waitersFee = quote.waitersFee * (1 + order.properties.vatRate);
        } else {
          quote.vat = 0;
          quote.total = quote.totalBeforeVat;
          quote.totalForStat = quote.totalForStat / (1 + order.properties.vatRate);  // stat is before vat
          quote.transportationInclVat = quote.transportation;
        }
      }

      quote.balance = quote.total - quote.advance;

      // the following are for displaying vat in invoice even if non business event
      // waiters fee is not included in invoice
       quote.totalBeforeVatForInvoice = (quote.total - quote.waitersFee) / (1 + order.properties.vatRate);


      this.checkTasks(order);
    };

    this.calcSpecialTypes = function(order) {
      lov.specialTypes.forEach(function(st) {
        if (order.properties.taskData) {
          delete order.properties.taskData[st.exist];
          delete order.properties.taskData[st.desc];
        }
      });
      order.properties.quotes[order.properties.activeQuote].items.forEach(function(thisItem) {
        if (thisItem.specialType) {
          var specialType = lov.specialTypes.filter(function (st) {
            return st.id === thisItem.specialType;
          })[0];
          if (!order.properties.taskData) {
            order.properties.taskData = {};
          }
          order.properties.taskData[specialType.exist] = true;
          order.properties.taskData[specialType.desc] = specialType.name;
          // if (order.properties.taskData[specialType.desc]) {
          //   order.properties.taskData[specialType.desc] += (', ' + thisItem.productName);
          // } else {
          //   order.properties.taskData[specialType.desc] = thisItem.productName;
          // }
        }
      });
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
      quote.couponDiscount = 0;
      quote.credits = 0;
      quote.transportationInclVat = 0;  // just to display on order list
      quote.transportation = 0;  // just to display on order list
      quote.extraServices = 0;
      quote.advance = 0;
      quote.categories = angular.copy(categories); // used to edit category descriptions
      quote.categories.forEach (function(cat) {
        cat.isShowDescription = false;
      });
      quote.items = [];
      quote.isActive = false;
      quote.changes = {};
      quote.errors = {};
      return quote;
    };



    this.saveOrder = function (order) {

      var thisOrder = order.properties;
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
      if (view.eventTimeRange) {
        thisOrder.eventTimeRange = view.eventTimeRange.id;
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

     // thisOrder.customer = view.customer.id;
      // thisOrder.contact = view.contact.id;
      if (!thisOrder.contact) {   // if contact is changed to null, make sure it is deleted in parse. see api.saveObj
        api.unset(order,'contact');
      }
      if (!thisOrder.referrer) {   // if referrer is changed to null, make sure it is deleted in parse. see api.saveObj
        api.unset(order,'referrer');
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
          } else if (a.category.type === 5) {  // for extraServices sort first by service type then product desc
           if (a.specialType > b.specialType) {
              return 1;
            } else if (a.specialType < b.specialType) {
              return -1;
            }
          }
          if (a.productDescription > b.productDescription) {
            return 1
          } else if (a.productDescription < b.productDescription) {
            return -1
          } else {
           return 0;
          }
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
            order.properties.number = results[0].properties.lastOrder + 1;
            results[0].properties.lastOrder = order.properties.number;
            return api.saveObj(results[0]);
          })
          //  III. save order
          .then(function () {
            that.setupOrderHeader(order.properties);
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
            order.backupOrderAttr = angular.copy(order.properties);
            $state.go('editOrder', {id: ord.id, isFromNew: 1});
          });
      } else {  // not new order
        this.setupOrderHeader(order.properties);
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
                      // order.updatedAt = ord2[0].updatedAt;
                      // todo: check consequences of not updatins order's updatedAt
                      view.isChanged = false;
                      view.changes = {};
                      window.onbeforeunload = function () {
                      };
                      window.onblur = function () {
                      };
                      $rootScope.menuStatus = 'show';
                      //  backup order for future cancel
                      order.backupOrderAttr = angular.copy(order.properties);
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
            order.properties.noOfParticipants &&
            order.properties.quotes.length) {
          order.view.orderStatus = lov.orderStatuses.filter(function(os) {
            return os.id === 1;
          })[0];
        }
      }
    };

    this.checkTasks = function (order) {
      var t = order.properties.taskData;
      // recalc location string
      t.encodedAddress = undefined;
      if (t.isSelfDelivery) {
        t.location = 'איסוף עצמי';
        t.isShowLocation = true;
      } else if (t.address) {
        t.encodedAddress = encodeURI(t.address);
        var i1 = t.address.lastIndexOf(',')+1;
        t.location = t.address.slice(i1);
        t.isShowLocation = true;
       } else {
        t.location = 'טרם נקבע';
        t.isShowLocation = false;
      }

      var columns = order.view.columns;
      columns.forEach(function(column) {
        column.phases.forEach(function(phase) {
          phase.tasks.forEach(function(task) {
            task.details.forEach(function(detail) {
              if (detail.type === 1) {
                detail.isDone = Boolean(eval(detail.attributeName));
              }
              if (detail.type === 2 || detail.type === 3 || detail.type === 4) { // if source given and field not changed, copy source
                if (detail.source && detail.changedAttribute &&
                    !t[detail.changedAttribute] && Boolean(eval(detail.source))) {
                  t[detail.attributeName] = eval(detail.source);
                }
                detail.inputText = t[detail.attributeName];
                detail.isDone = Boolean(detail.inputText);
             }
         });
          });
        });
      });
      columns.forEach(function(column) {
      column.phases.forEach(function(phase) {
        phase.isDone = true;
        phase.tasks.forEach(function(task) {
          if(task.condition) {
            task.isShow = Boolean(eval(task.condition)); // evaluate condition to show task
          } else {
            task.isShow = true;
          }
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
        if (t.isServiceOnSite) {
          undone += 'סרוויס באירוע,';
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
        if (t.location && t.isShowLocation) {
          done += ('מיקום: '+t.location+',');
        }
        if (!done.length && undone.length) { // trim trailing , only if undone is also the end of the list
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
          'totalBeforeVatForInvoice': currentQuote.totalBeforeVatForInvoice,
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
      if (order.view.orderStatus.id !== order.properties.orderStatus) {
        var txt = ((typeof(order.properties.orderStatus) === 'undefined')
          ?  'האירוע נוצר בסטטוס ' : 'סטטוס האירוע שונה ל- ') +
                  order.view.orderStatus.name;
        order.properties.activities.splice(0, 0, {date: new Date(), text: txt});
        if (order.properties.header) {
          // if called from orderList we  have to update header fields directly
          order.properties.header.activityDate = order.properties.activities[0].date;
          order.properties.header.activityText = order.properties.activities[0].text;
        }
        // in transition from not closed to closed, set closure date
        if (order.view.orderStatus.id >= 2 && order.view.orderStatus.id <= 5) {    // new status
          if (order.properties.orderStatus === undefined ||
              order.properties.orderStatus === 0 ||
              order.properties.orderStatus === 1 ||
              order.properties.orderStatus === 6) { // prev status
            order.properties.closingDate = new Date();
          }
        } else {
          api.unset(order,'closingDate');
          api.unset(order,'color');
       }
        if (order.view.orderStatus.id >= 1 && order.view.orderStatus.id <= 5 && // new status
            !order.properties.bidDate) {
          order.properties.bidDate = new Date();
        }
        order.properties.orderStatus = order.view.orderStatus.id;
      }
    };

    this.horizonDate = function() {
      var horizon = [6,5,4,3,4,3,2];
      // Sunday-Wednsday -> horizon till Saturday; Thursday-Saturday -> horizon till Monday
      var hDate = new Date(dater.today());
      hDate.setDate(hDate.getDate() + horizon[hDate.getDay()]);
      return hDate;
    };

    this.generateOrderColors = function() {
      var fields = ['eventDate', 'eventTime', 'number','orderStatus','template','color'];
      var from = dater.today();
      var to = this.horizonDate();
      api.queryOrdersByRange('eventDate',from,to,fields)
        .then(function(orders) {
            var newOrders = orders.filter(function(order) { // find orders without color assignment
            return  !order.properties.template &&
              order.properties.orderStatus >= 2 &&
              order.properties.orderStatus <= 5 &&
              !order.properties.color;
          });
          if (newOrders.length > 0) {
            console.log('found '+newOrders.length+' orders in immediate future without colors');
            newOrders.sort(function(a,b) {
              var ad = a.properties.eventDate;
              var at = a.properties.eventTime;
              var bd = b.properties.eventDate;
              var bt = b.properties.eventTime;
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
              return order.properties.color;
            }).map(function(order) {
              return order.properties.color;
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
                     console.log('selected color '+selectedColor+' for order '+newOrder.properties.number);
                     newOrder.properties.color = selectedColor;
                     existingColors.push(selectedColor);
                     api.saveObj(newOrder);
                   } else {
                     console.log('no color available for order ' + newOrder.properties.number);
                   }
                 });
               });
          }
        });
    };

    this.setDescChangeActions = function (order, descChangeActions) {
      var that = this;
      if (order.properties.quotes) {
        order.properties.quotes.forEach(function (quote) {
          quote.items.forEach(function (item) {
            if (item.isDescChanged) {
              item.descChangeAction = descChangeActions.filter(function (act) {
                return act.isDescChanged &&
                  (act.isCosmeticChange === Boolean(item.isCosmeticChange)) &&
                  (act.isMajorChange === Boolean(item.isMajorChange));
              })[0];
            }
          });
        });
      }
    };

  });
