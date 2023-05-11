'use strict';

/* Controllers */
angular.module('myApp')
  .controller('WorkOrderCtrl', function (api, $state, $filter, $modal, $q, $rootScope, $timeout,
                                         lov, config, catalog, allCategories, measurementUnits,
                                         colors, dater, customers, woIndexes, orderService) {


    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = 'פקודת עבודה';

    var woId;

    this.isShowTodayOnly = [];
    this.isShowDone = [];
    this.isIncludeStock = [];
    this.isShowDetails = [];
    this.isPrint = [];

    this.dayName = function(dat) {
      var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
      return dayNames[dat.getDay()]+"'";
    };

    this.setDomain = function(domain) {
      this.domain = domain;
        if (!this.woIndex.properties.domainStatus[domain]) {
          if (domain === 1) { // in case of dishes, create preps too, so updateWorkOrder will work properly
            this.createWorkOrderDomain(1)
              .then(function() {
                that.createWorkOrderDomain(2)
                  .then(function () {
                    that.createView();
                    that.splitWorkOrder();
                    that.isIncludeStock[domain] = true;
                    that.isActiveTab[2] = false; // return active tab to be dishes
                    that.isActiveTab[1] = true;
                  });
              })
          } else {
            var prevDomain = domain === 4 ? 2 : domain - 1;
            if (this.woIndex.properties.domainStatus[prevDomain]) {
              this.createWorkOrderDomain(domain)
                .then(function () {
                  that.createView();
                  that.splitWorkOrder();
                  that.isIncludeStock[domain] = true;
                });
            }
          }
        }
      if (domain === 4) { // force default show today only for actions
        that.isShowTodayOnly[4] = true;
      }
    };

    this.setShowAll = function(domain) {
      this.hierarchicalWorkOrder[domain].categories.forEach(function(cat) {
        cat.isShow = that.hierarchicalWorkOrder[domain].isShowAll;
      });
    };

    this.destroyWorkOrderDomains = function (domain) {
      var woItemsToDelete = this.workOrder.filter(function (wo) {
        // for products domain, don't delete actions
        return domain===3 ? (wo.properties.domain === domain) : (wo.properties.domain >= domain);
      });
      this.isProcessing = true;
      this.processMsg = 'מוחק רשומות ישנות';
      return api.deleteObjects(woItemsToDelete)
        .then(function () {
          that.isProcessing = false;
        }, function () {
          alert('workOrder multiple delete failed');
          that.isProcessing = false;
        });
    };

    this.createDishesDomain = function () {
      this.workOrder.forEach(function(woItem) {
        if (woItem.properties.domain === 0) {
          that.createDishes(woItem, undefined, undefined);
        }
      });
    };

    this.createDishes = function (order, dishesToCreate, dishesToUpdate) {
      var items = order.properties.order.quotes[order.properties.order.activeQuote].items;
      items.forEach(function(item) {
        if (item.category.type < 3) {
          that.createDish(order, item, dishesToCreate, dishesToUpdate);
        }
      });
    };


    this.createDish = function (order, item, dishesToCreate, dishesToUpdate) {
      var workItem;
      var workItemInd;
      // change measurement unit to prod mu and adjust quantity
      var catItem = catalog.filter(function (cat) {
        return cat.id === item.catalogId;
      })[0].properties;
      if (catItem.prodMeasurementUnit !== catItem.measurementUnit) {
        item.measurementUnit = measurementUnits.filter(function (mu) {
          return mu.tId === catItem.prodMeasurementUnit;
        })[0];
        item.quantity = item.quantity * catItem.muFactor;
      }
      workItemInd = undefined;
      that.workOrder.forEach(function (workItem, ind) { // items are grouped by catalogId,
        if (workItem.properties.domain === 1 && // unless their description is changed
          workItem.properties.catalogId === item.catalogId &&
          Boolean(item.personalAdjustment) === Boolean(workItem.properties.personalAdjustment) &&
          (!Boolean(item.personalAdjustment) ||
            item.personalAdjustment === workItem.properties.personalAdjustment)) {
          workItemInd = ind;
        }
      });
      if (workItemInd) {  // item already in list, just add quantity
        workItem = that.workOrder[workItemInd];
        if (dishesToUpdate) {
          if (!workItem.properties.originalQuantity) {
            workItem.properties.originalQuantity = workItem.properties.quantity;
          }
        }
        workItem.properties.quantity += item.quantity;
        var existingBt = workItem.properties.backTrace.filter(function(bt) {
          return bt.id === order.id;
        })[0];
        if (existingBt) {  // dish already appeared in same order
          existingBt.quantity += item.quantity;
        } else {
          workItem.properties.backTrace.push({
            id: order.id,
            domain: 0,
            quantity: item.quantity,
            originalQuantity: -1,
            status: order.properties.status
          });
        }
        if (dishesToUpdate && !workItem.isNewItem) { // don't update items just created. it will cause dups
          dishesToUpdate.push(workItem);
        }
        if (dishesToUpdate) { // set status only in updateWorkOrder
          if (!workItem.properties.status) {  // leave 'new' status unchanged
            workItem.properties.status = 'upd';
          }
        }
      } else { // create new item
        workItem = api.initWorkOrder();
        workItem.isNewItem = true;
        if (dishesToCreate) { // set status only in updateWorkOrder
          workItem.properties.status = 'new';
        }
        workItem.properties.woId = woId;
        workItem.properties.catalogId = item.catalogId;
        workItem.properties.productName = item.productName;
        workItem.properties.personalAdjustment = item.personalAdjustment;
         workItem.properties.quantity = item.quantity;
         workItem.properties.originalQuantity = -1;
        workItem.properties.category = item.category;
        workItem.properties.domain = 1;
        workItem.properties.measurementUnit = item.measurementUnit;
        workItem.properties.select = 'unknown';  // needed to handle products directly under dish
        workItem.properties.backTrace = [{
          id: order.id,
          domain: 0,
          originalQuantity: -1,
          quantity: item.quantity,
          status: order.properties.status
        }];
        workItem.deletedBackTrace = []; // needed in updatePreps
        that.workOrder.push(workItem);
        if (dishesToCreate) {
          dishesToCreate.push(workItem);
       }
      }
      that.createViewForDish(workItem);
      return workItem;
    };

    // create targetDomain records based on lower domain components
  this.createComponentsDomain = function (targetDomain) {
      var workItemInd;
      var workItem;
      this.workOrder.forEach(function(inWorkOrder) {
        var inWorkItem = inWorkOrder.properties;
        if (inWorkItem.domain > 0) {  // skip orders
          var inCatObj = catalog.filter(function (cat) {
            return cat.id === inWorkItem.catalogId;
          })[0];
          var inCatItem = inCatObj.properties;
          inCatItem.components.forEach(function (component) {
            if (component.domain === targetDomain) {
              var temp = that.workOrder.filter(function (wi, ind) {
                if (wi.properties.catalogId === component.id) {
                   workItemInd = ind;
                    return true;
                  }
               });
              if (temp.length > 0) {  // item already exists, just add quantity
                workItem = that.workOrder[workItemInd];
                workItem.properties.quantity +=
                  inWorkItem.quantity * component.quantity / inCatItem.productionQuantity;
                if (targetDomain > 2 && inWorkItem.domain === 2) {
                  workItem.properties.quantityForToday +=
                    inWorkItem.quantityForToday * component.quantity / inCatItem.productionQuantity;
                  workItem.properties.quantityDone +=
                    inWorkItem.quantityDone * component.quantity / inCatItem.productionQuantity;
                  if (inWorkItem.select !== workItem.properties.select) {
                    workItem.properties.select = 'mix';
                  }
                }
                if (targetDomain === 2) {
                  // adding orders that were not there before
                   inWorkItem.backTrace.forEach(function(bt) {
                    var prop = workItem.properties.orders.filter(function(p) {
                      return p.id === bt.id;
                    })[0];
                    if (!prop) {
                      workItem.properties.orders.push({
                        id: bt.id,
                        select: "delay"
                      });
                    }
                  });
                }
                workItem.properties.backTrace.push({
                    id: inWorkOrder.id,
                    domain: inWorkItem.domain,
                    quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity
                          });
              } else {  // first time component appears
                var outCatObj = catalog.filter(function (cat) {
                  return cat.id === component.id;
                })[0];
                if (outCatObj) {
                  var outCatItem = outCatObj.properties;
                  workItem = api.initWorkOrder();
                  workItem.properties.woId = woId;
                  workItem.properties.catalogId = component.id;
                  workItem.properties.productName = outCatItem.productName;
                  workItem.properties.category = allCategories.filter(function (cat) {
                    return cat.tId === outCatItem.category;
                  })[0];
                  workItem.properties.domain = targetDomain;
                  workItem.properties.measurementUnit = measurementUnits.filter(function (mes) {
                    return mes.tId === outCatItem.measurementUnit;
                  })[0];
                 workItem.properties.isInStock = outCatItem.isInStock;
                 workItem.properties.quantity = inWorkItem.quantity * component.quantity / inCatItem.productionQuantity;
                  workItem.properties.quantityForToday =
                    targetDomain===2 || inWorkItem.domain === 1 ? 0 :
                      inWorkItem.quantityForToday * component.quantity / inCatItem.productionQuantity;
                  workItem.properties.quantityDone =
                    targetDomain===2 || inWorkItem.domain === 1 ? 0 :
                      inWorkItem.quantityDone * component.quantity / inCatItem.productionQuantity;
                  workItem.properties.select =
                    targetDomain===2 ? "delay" : inWorkItem.select;
                  workItem.properties.backTrace = [{
                    id: inWorkOrder.id,
                    domain: inWorkItem.domain,
                    quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity
                 }];
                  // orders array in prep is used only to record the select state of order in prep
                  if (targetDomain === 2) {
                    workItem.properties.orders = inWorkItem.backTrace.map(function(bt) {
                      return {
                        id: bt.id,
                        select: "delay"
                      };
                    });
                  }
                  that.workOrder.push(workItem);
                } else {
                  alert('missing catalog entry for component '+ component.id+' of item '+inCatItem.productName);
                }
              }
              if (targetDomain === 2) {
                that.createViewForPrep(workItem);
              } else {
                that.createViewForActionOrProduct(workItem,targetDomain);
              }
            }
        });
       }
      });
    };

    // create an array of menu items in which prep appears for detailed listing
    this.createPrepDishView = function(currentPrep) {
         currentPrep.view.dishes = [];
          var remarkCnt = 0;
          currentPrep.properties.backTrace.forEach(function (currentBackTrace) {
            var currentDish = {};
            currentDish.id = currentBackTrace.id;
            currentDish.originalQuantity = currentBackTrace.originalQuantity;
            currentDish.quantity = currentBackTrace.quantity;
            currentDish.quantityForToday = 0;
            currentDish.quantityDone = 0;
            var originalDish = that.workOrder.filter(function (wo) {
              return wo.id === currentBackTrace.id;
            })[0];
            if (!originalDish) {
              console.log('originalDish missing for backTrace of '+currentPrep.properties.productName);
              console.log(currentPrep);
              console.log(currentBackTrace);
              return;
             }
              currentDish.status = originalDish.properties.status;
              currentDish.productName = originalDish.properties.productName;
              if (originalDish.properties.personalAdjustment) {
                currentDish.isRemark = true;
                currentDish.remarkNo = ++remarkCnt;
                currentDish.remarkText = originalDish.properties.personalAdjustment;
              }
            currentPrep.view.dishes.push(currentDish);
          });
    };

    // create an array of orders in which dishes containing this preparation appear.
    // each entry contains an array of dishes.
    this.createPrepOrderView = function (currentPrep) {
      currentPrep.isAlert = false; // to indicate changes in orders marked for today
       currentPrep.view.orders = [];
        currentPrep.properties.backTrace.forEach(function (prepBackTrace) {
          var originalDish = that.workOrder.filter(function(mi) {
            return mi.id === prepBackTrace.id;
          })[0];
          if (!originalDish) {
            console.log('originalDish missing for backTrace of '+currentPrep.properties.productName);
            console.log(currentPrep);
            console.log(prepBackTrace);
            return;
          }
          var viewDishIndex;
          currentPrep.view.dishes.forEach(function(mi,ind) {
            if (mi.id === originalDish.id) {
              viewDishIndex = ind;
            }
          });
          var dishCatalog = that.catalog.filter(function(cat) {
            return cat.id === originalDish.properties.catalogId;
          })[0];
          var prepCatalog = that.catalog.filter(function(cat) {
            return cat.id === currentPrep.properties.catalogId;
          })[0];
          var dishComponent = dishCatalog.properties.components.filter(function(comp) {
            return comp.id === prepCatalog.id;
          })[0];
          if (!dishComponent) {
            alert('ההכנה '+prepCatalog.properties.productName+' אינה בין רכיבי המנה '+
                  dishCatalog.properties.productName+'. חשב מחדש את ההכנות');
            return;
          }
           originalDish.properties.backTrace.forEach(function(miBackTrace) {
            var temp = currentPrep.view.orders.filter(function(ord) {
              return ord.id === miBackTrace.id;
            });
            var currentOrder;
            if (temp.length===0) {  // first appearance of this order
              var originalOrder = that.woOrders.filter(function(ord) {
                return ord.id === miBackTrace.id;
              })[0];
              var orderObj = {
                id: originalOrder.id,
                customer: originalOrder.view ? originalOrder.view.customer.firstName : '',
                date: originalOrder.properties.order.eventDate,
                day: that.dayName(originalOrder.properties.order.eventDate),
                time: originalOrder.properties.order.eventTime,
                totalOriginalQuantity: -1,
                totalQuantity: 0,
                dishes: [],
                select: 'delay',
                status: (originalOrder.properties.status==='new' || originalOrder.properties.status==='del') ?
                  originalOrder.properties.status : undefined
              };
              currentPrep.view.dishes.forEach(function(mu,ind) {
                orderObj.dishes[ind] = {
                  seq: ind,
                  originalQuantity: -1,
                  quantity: 0
                }
              });
              currentPrep.view.orders.push(orderObj);
              currentOrder = currentPrep.view.orders[currentPrep.view.orders.length-1];
            } else {
              currentOrder = temp[0];
           }
            // todo: how to mark a 'new' order that is caused by a new dish in an existing order
             // todo: (the dish's backtrace is 'upd' because the order was updated, not created)
             var prepQuantity = miBackTrace.quantity;
             currentOrder.dishes[viewDishIndex].quantity +=
               prepQuantity * dishComponent.quantity / dishCatalog.properties.productionQuantity;
             currentOrder.totalQuantity +=
               prepQuantity * dishComponent.quantity / dishCatalog.properties.productionQuantity;
             var prepOriginalQuantity = miBackTrace.originalQuantity;
             if (currentOrder.dishes[viewDishIndex].originalQuantity < 0) {
               currentOrder.dishes[viewDishIndex].originalQuantity = 0;
             }
             currentOrder.dishes[viewDishIndex].originalQuantity +=
               prepOriginalQuantity * dishComponent.quantity / dishCatalog.properties.productionQuantity;
             if (currentOrder.totalOriginalQuantity < 0) {
               currentOrder.totalOriginalQuantity = 0;
             }
             currentOrder.totalOriginalQuantity +=
               prepOriginalQuantity * dishComponent.quantity / dishCatalog.properties.productionQuantity;
             if (currentOrder.totalOriginalQuantity>0 && !currentOrder.status) {
               currentOrder.status = 'upd';
             }
           });
        });
        // update view select value based on prep DB item
      currentPrep.view.orders.forEach(function(ord) {
        var matchingOrder = currentPrep.properties.orders.filter(function(mOrd) {
          return mOrd.id === ord.id;
        })[0];
        if (matchingOrder) {
          ord.select = matchingOrder.select;
          if (ord.select === 'today') {
            if (ord.totalOriginalQuantity > 0) {
              currentPrep.isAlert = true;
              ord.isAlert = true;
            }
          } else if (ord.select === 'done') {
            if (ord.totalQuantity > ord.totalOriginalQuantity) {
              currentPrep.isAlert = true;
              ord.isAlert = true;
            }
          }
        } else {
          console.log('cant find matching order in prep record of '+currentPrep.properties.productName);
          console.log('view order:');
          console.log(ord);
          console.log('prep record:');
          console.log(currentPrep);
        }
      });

      currentPrep.view.orders = currentPrep.view.orders.filter(function(ord) {
        return ord.totalQuantity > 0 || ord.totalOriginalQuantity > 0;
      });

      // set alert if all existing orders are marked 'today' or 'done' and there are new orders
      var c1 = 0;
      var c2 = 0;
      currentPrep.view.orders.forEach(function(ord) {
        if (ord.select==='today' || ord.select==='done') {
          c1++;
        }
        if (ord.status==='new') {
          c2++;
        }
      });
      if (c1>0 && c2>0 && c1+c2===currentPrep.view.orders.length) {
        currentPrep.isAlert = true;
        currentPrep.view.orders.forEach(function(ord) {
          if (ord.status==='new') {
            ord.isAlert = true;
          }
        });
      }

      // update quantityForToday and quantityDone of dish array based on order's select values
      currentPrep.view.dishes.forEach(function(dish, ind) {
        currentPrep.view.orders.forEach(function(ord) {
          if (ord.select === 'today') {
            dish.quantityForToday += ord.dishes[ind].quantity;
          } else if (ord.select === 'done') {
            dish.quantityDone += ord.dishes[ind].quantity;
          }
        });
      });
      currentPrep.view.orders.sort(function(a,b) {
        var diff = a.date - b.date;
        if (diff) {
          return diff;
        }
        if (a.time && b.time) {
          diff = a.time - b.time;
          if (diff) {
            return diff;
          }
        }
        return a.id - b.id;
      });
    };

    // for actions, create array of preps for breakdown by prep and order, for snacks and desserts
    this.createActionsPrepsView = function (currentItem) {
      currentItem.view.preps = [];
      currentItem.properties.backTrace.forEach(function(itemBackTrace) {
        if (itemBackTrace.domain === 2) {
          var originalPrep = that.workOrder.filter(function (prep) {
            return prep.id === itemBackTrace.id;
          })[0];
          var prepCatalogItem = that.catalog.filter(function (cat) {
            return cat.id === originalPrep.properties.catalogId;
          })[0];
          currentItem.view.preps.push({
            id: originalPrep.id,
            name: prepCatalogItem.properties.externalName,
            quantity: originalPrep.properties.quantity,
            quantityForToday: originalPrep.properties.quantityForToday,
            quantityDone: originalPrep.properties.quantityDone
          });
        }
      });
    };

    // find item's breakdown to individual orders, based on the prep order view it comes from
    this.createProductsAndActionsOrderView = function(currentItem) {
      var itemCatalogItem = catalog.filter(function (cat) {
        return cat.id === currentItem.properties.catalogId;
      })[0];
      currentItem.view.orders = [];
      currentItem.properties.backTrace.forEach(function(itemBackTrace) {
        if (itemBackTrace.domain === 2) {
          var originalPrep = that.workOrder.filter(function (prep) {
            return prep.id === itemBackTrace.id;
          })[0];
          var prepCatalogItem = that.catalog.filter(function (cat) {
            return cat.id === originalPrep.properties.catalogId;
          })[0];
          var component = prepCatalogItem.properties.components.filter(function (comp) {
            return comp.id === itemCatalogItem.id;
          })[0];
          if (!component) {
            alert('המצרך / המטלה '+itemCatalogItem.properties.productName+
              ' הוסר ממרכיביה של ההכנה '+prepCatalogItem.properties.productName+
              '. בצע חישוב מחדש של מצרכים / מטלות');
          } else {
            originalPrep.view.orders.forEach(function (prepOrder) {
              var temp = currentItem.view.orders.filter(function (itemOrder) {
                return itemOrder.id === prepOrder.id && itemOrder.select === prepOrder.select;
              });
              var currentOrder;
              if (temp.length === 0) { // order doesn't exists in item
                currentOrder = {
                  id: prepOrder.id,
                  customer: prepOrder.customer,
                  date: prepOrder.date,
                  day: prepOrder.day,
                  time: prepOrder.time,
                  totalQuantity: 0,
                  preps: [],
                  select: prepOrder.select
                };
                if (currentItem.properties.domain === 4) {
                  currentItem.view.preps.forEach(function (prep, ind) {
                    currentOrder.preps[ind] = {
                      seq: ind,
                      quantity: 0,
                      quantityForToday: 0,
                      quantityDone: 0
                    };
                  });
                }
                currentItem.view.orders.push(currentOrder);
              } else {
                currentOrder = temp[0];
              }
              currentOrder.totalQuantity +=
                prepOrder.totalQuantity * component.quantity /
                    prepCatalogItem.properties.productionQuantity;
              var viewPrepIndex;
              if (currentItem.properties.domain === 4) {
                currentItem.view.preps.forEach(function (prep, ind) {
                  if (prep.id === originalPrep.id) {
                    viewPrepIndex = ind;
                  }
                });
                currentOrder.preps[viewPrepIndex].quantity = prepOrder.totalQuantity;
                if (currentOrder.select === 'today') {
                  currentOrder.preps[viewPrepIndex].quantityForToday = prepOrder.totalQuantity;
                }
                if (currentOrder.select === 'done') {
                  currentOrder.preps[viewPrepIndex].quantityDone = prepOrder.totalQuantity;
                }
              }
            });
          }
        } else if (itemBackTrace.domain === 1) { // product item directly under dish
          var originalDish = that.workOrder.filter(function (mi) {
            return mi.id === itemBackTrace.id;
          })[0];
          if (!originalDish) {
            console.log('cant find originalDish of product backTrace ' + currentItem.properties.productName);
            console.log(currentItem);
            console.log(itemBackTrace);
          }
          var miCatalogItem = that.catalog.filter(function (cat) {
            return cat.id === originalDish.properties.catalogId;
          })[0];
          component = miCatalogItem.properties.components.filter(function (comp) {
            return comp.id === itemCatalogItem.id;
          })[0];
          if (!component) {
            alert('המצרך / המטלה '+itemCatalogItem.properties.productName+
                        ' הוסר ממרכיביה של המנה '+miCatalogItem.properties.productName+
                        '. בצע חישוב מחדש של מצרכים / מטלות');
          } else {
            originalDish.properties.backTrace.forEach(function (bt) {
              var temp = currentItem.view.orders.filter(function (itemOrder) {
                return itemOrder.id === bt.id && itemOrder.select === 'unknown';
              });
              var originalOrder = that.workOrder.filter(function (ord) {
                return ord.id === bt.id;
              })[0];
              if (temp.length === 0) {
                var currentOrder = {
                  id: originalOrder.id,
                  customer: originalOrder.view.customer.firstName,
                  date: originalOrder.properties.order.eventDate,
                  day: that.dayName(originalOrder.properties.order.eventDate),
                  time: originalOrder.properties.order.eventTime,
                  totalQuantity: 0,
                  preps: [],
                  select: 'unknown'
                };
                currentItem.view.orders.push(currentOrder);
              } else {
                currentOrder = temp[0];
              }
              currentOrder.totalQuantity +=
                bt.quantity * component.quantity / miCatalogItem.properties.productionQuantity;
            });
          }
        }
      });
      currentItem.view.orders.sort(function(a,b) {
        var diff = a.date - b.date;
        if (diff) {
          return diff;
        }
        if (a.time && b.time) {
          diff = a.time - b.time;
          if (diff) {
            return diff;
          }
        }
        return a.id - b.id;
      });
    };

    // decide if item will be shown
    this.isShowItem = function (woItem) {
      var isItemToday = woItem.properties.select==='today';
      if (woItem.properties.select==='mix') {
        woItem.view.orders.forEach(function(ord) {
          if (ord.select === 'today') {
            isItemToday = true;
          }
        });
      }
      var isItemDone = woItem.properties.select==='done';
      if (woItem.properties.select==='mix') {
        woItem.view.orders.forEach(function(ord) {
          if (ord.select !== 'done') {
            isItemDone = false;
          }
        });
      }
      var isShowByStock = this.isIncludeStock[woItem.properties.domain] ? true : !woItem.properties.isInStock;
      var isShowByToday = this.isShowTodayOnly[this.domain] ? isItemToday : true;
      var isShowByDone = this.isShowDone[this.domain] ? true : !isItemDone;
      return isShowByStock && isShowByToday && isShowByDone;
    };

    // show category only if any of its items will be shown
    this.isShowCategory = function(cat) {
      var temp;
      if (cat.category.domain === 4) {
        temp = cat.lists[0].list.concat(cat.lists[1].list, cat.lists[2].list).filter(function (woItem) {
          return that.isShowItem(woItem);
        });
      } else {
        temp = cat.list.filter(function (woItem) {
          return that.isShowItem(woItem);
        });
      }
      return temp.length;
    };

     // reset detailed view for today only, otherwise turn it on for mixed preps
    // also check if there are remarks for today's dishes
    this.setPrepsTodayOnly = function () {
      if (this.isShowTodayOnly[2]) {
        this.isOrderFilter = false;  // turn off order selection table
        this.isShowDone[2] = false;
        this.workOrder.forEach(function(woItem) {
          if (woItem.properties.domain === 2) {
            woItem.isShowDetails = that.isShowDetails[that.domain];
            woItem.isRemarkForToday = false;
            woItem.view.dishes.forEach(function (mi) {
              if (mi.isRemark && mi.quantityForToday>0) {
                woItem.isRemarkForToday = true;
              }
            })
          }
        });
      } else {
        this.workOrder.forEach(function(woItem) {
          if (woItem.properties.domain === 2) {
            if (woItem.properties.select === 'mix') {
              woItem.isShowDetails = true;
            }
          }
        });
      }
    };

    this.setPrepsDone = function () {
      if (this.isShowDone[2]) {

      } else {
        this.workOrder.forEach(function(woItem) {
          if (woItem.properties.domain === 2) {
            woItem.isAnyRemarkNotDone = false;
            woItem.view.dishes.forEach(function (mi) {
              if (mi.isRemark && mi.quantityDone===0) {
                woItem.isAnyRemarkNotDone = true;
              }
            })
          }
        });
      }
    };

    // sum quantity of all orders marked for today or done and of each dish they include
   this.computeSelectQuantities = function (woItem) {
      var quantToday = 0;
      var quantDone = 0;
      woItem.view.dishes.forEach(function (mi0) {
        mi0.quantityForToday = 0;
        mi0.quantityDone = 0;
      });
      woItem.view.orders.forEach(function (ord) {
        if (ord.select === 'today') {
          quantToday += ord.totalQuantity;
          ord.dishes.forEach(function(mi) {
            woItem.view.dishes[mi.seq].quantityForToday += mi.quantity;
          });
        } else if (ord.select === 'done') {
          quantDone += ord.totalQuantity;
          ord.dishes.forEach(function(mi) {
            woItem.view.dishes[mi.seq].quantityDone += mi.quantity;
          });
        }
      });
     woItem.properties.quantityForToday = quantToday;
     woItem.properties.quantityDone = quantDone;
    };

     // propogate selection for event to all its occurances in preps
    this.setOrderSelect = function(order) {
      api.saveObj(order);
      this.workOrder.forEach(function (woi) {
        var wo = woi.properties;
        if (wo.domain === 2) {
          woi.view.orders.forEach(function (ord) {
            if (ord.id === order.id) {
              ord.select = order.properties.select;
              that.computeSelectQuantities(woi);
              that.setPrepOrderSelect(woi,order);
            }
          });
        }
      })
    };



    // propogate selection to all orders in prep item and save item
    this.setPrepSelect = function (woItem, isDirect) {
      if (woItem.properties.domain === 2) {  // should always be
        if (isDirect) {
          that.select = 'mix';
        }
        woItem.view.orders.forEach(function(ord) {
          ord.select = woItem.properties.select;
        });
        woItem.properties.orders.forEach(function(ord) {
          ord.select = woItem.properties.select;
        });
        this.computeSelectQuantities(woItem);
        //todo: invalidate further domains in other saves too
        api.saveObj(woItem)
          .then(function () {
            that.woIndex.properties.domainStatus[3] = false;
            that.woIndex.properties.domainStatus[4] = false;
            api.saveObj(that.woIndex);
          })
     }
    };

    // if select values of all orders in prep are identical, set select value of prep accordingly
    // else set prep's select to "mix" which disables its control
    //todo: if not showing done items, they should not cause item to be mixed
    //todo: also recall this when making done items visible / non visible
    this.setPrepOrderSelect = function (prep, order) {
      if (prep.properties.domain === 2) {  // should always be
        that.select = 'mix';
        var s = 'none';
        prep.view.orders.forEach(function(ord) {
          if (s === 'none') {
            s = ord.select;
          } else if (s !== ord.select) {
            s = 'mix';
          }
        });
        prep.properties.select = s;
        if (s === 'mix') {
          prep.isShowDetails = true;
        }
        this.computeSelectQuantities(prep);
        // copy select value from view to properties, to save it
         var propOrder = prep.properties.orders.filter(function(ord) {
          return ord.id === order.id;
        })[0];
        if (propOrder) {
          propOrder.select = prep.view.orders.filter(function (ord) {
            return ord.id === order.id;
          })[0].select;
        }
        api.saveObj(prep)
          .then(function () {
            that.woIndex.properties.domainStatus[3] = false;
            that.woIndex.properties.domainStatus[4] = false;
            api.saveObj(that.woIndex);
          })
      }
    };

     this.setOrderServiceToday = function (woItem) {
      api.saveObj(woItem);
      this.workOrder.forEach(function (woi) {
        if (woi.properties.domain === 2) {
          woi.view.orders.forEach(function (ord) {
            if (ord.id === woItem.id) {
              if (woi.properties.category.type === 11) {
                ord.select = woItem.properties.isServiceToday ? 'today' : 'delay';
              }
              if (woi.properties.category.type === 12) {
                ord.select = woItem.properties.isPreServiceToday ? 'today' : 'delay';
              }
            }
          });
          that.computeSelectQuantities(woi);
          that.setPrepOrderSelect(woi,woItem);
        }
      });
    };

     this.createOrderView = function () {
      this.orderView = [];
      this.processMsg = 'טוען אירועים עתידיים';
      api.queryFutureOrders()
        .then(function (futureOrders) {
          futureOrders.forEach(function(order) {
            if (order.properties.quotes[order.properties.activeQuote]) {
              var items = order.properties.quotes[order.properties.activeQuote].items;
            }
            if (order.properties.orderStatus > 1 && order.properties.orderStatus < 6) {
              var viewItem = api.initWorkOrder();
              // create the object for now, but we don't store it until user decides to include it in WO
              viewItem.properties.woId = woId;
              viewItem.properties.domain = 0;
              viewItem.properties.order = order.properties;
              viewItem.properties.order.id = order.id;
              viewItem.properties.select = 'delay';
              viewItem.isInWorkOrder = false;
              that.createViewForOrder(viewItem);
              that.orderView.push(viewItem);
            }
          });
          var ordersToSave = [];  // now include all orders from prev order view in wo
          that.orderView.forEach(function(ovOrder){
            if (that.prevOrdersInWo.filter(function (po) {
                return po.properties.order.number === ovOrder.properties.order.number;
              }).length > 0) { // order was in prev wo
              ovOrder.isInWorkOrder = true;
               ordersToSave.push(ovOrder);
              ovOrder.isToBeTemporarilyDeleted = true;
            }
          });
          that.orderView = that.orderView.filter(function (ov) {
            return !ov.isToBeTemporarilyDeleted;
          });
          that.processMsg = 'שומר אירועים';
          api.saveObjects(ordersToSave)
            .then(function (ov) {
                ov.forEach(function(o) {
                  that.workOrder.push(o);
                  that.orderView.push(o);
                  });
              that.orderView.sort(function (a, b) {
                if (a.properties.order.eventDate > b.properties.order.eventDate) {
                  return 1;
                } else if (a.properties.order.eventDate < b.properties.order.eventDate){
                  return -1;
                } else if (a.properties.order.exitTime > b.properties.order.exitTime) {
                  return 1;
                } else if (a.properties.order.exitTime < b.properties.order.exitTime) {
                  return -1;
                } else if (a.id > b.id) {
                  return 1;
                } else {
                  return -1;
                }
              });
             that.createSmallOrderView();
             $timeout(function() { }, 100);  // somehow needed for orderView to show correctly in view
          });
        });
    };

    this.queryOrders = function () {
      this.isProcessing = true;
      this.processMsg = 'טוען אירועים בטווח התאריכים';
      api.queryOrdersByRange('eventDate',this.fromDate,this.toDate)
        .then(function(ords) {
          var orders = ords.filter(function(ord) {
            return ord.properties.orderStatus > 1 && ord.properties.orderStatus < 6;
          });
          orders.forEach(function(ord) {
            var viewItem = api.initWorkOrder();
            viewItem.properties.woId = woId;
            viewItem.properties.domain = 0;
            viewItem.properties.order = ord.properties;
            viewItem.properties.order.id = ord.id;
            viewItem.isInWorkOrder = true;
            that.createViewForOrder(viewItem);
            that.orderView.push(viewItem);
          });
          that.processMsg = 'שומר אירועים בפקודה';
          api.saveObjects(that.orderView)
            .then(function(woOrders) {
               woOrders.forEach(function(wo) {
                wo.isInWorkOrder = true;
              });
              that.orderView = that.workOrder = woOrders;
              that.createSmallOrderView();
              that.createWorkOrderDomain(1);
            });
         });
    };

    this.createSmallOrderView = function () {
      this.woOrders = this.workOrder.filter(function (wo) {
        return wo.properties.domain === 0;
      }).sort(function(a,b) {
        if (a.properties.order.eventDate > b.properties.order.eventDate) {
          return 1;
        } else if (a.properties.order.eventDate < b.properties.order.eventDate) {
          return -1;
        } else if (a.properties.order.exitTime > b.properties.order.exitTime) {
          return 1;
        } else if (a.properties.order.exitTime < b.properties.order.exitTime) {
          return -1;
        } else if (a.id > b.id) {   // just that sort results will be deterministic
          return 1;
        } else  {
          return -1;
        }
      });
    };

    this.setOrderInWorkOrder = function (ind) {
      var indToDelete;
      if (this.orderView[ind].isInWorkOrder) {
        api.saveObj(this.orderView[ind])
          .then(function (obj) {
            that.orderView[ind] = obj;
            that.workOrder.push(that.orderView[ind]);
            that.createSmallOrderView();
          });
      } else {
        this.workOrder.forEach(function (wo, woInd) {
          if (wo.id === that.orderView[ind].id) {
            indToDelete = woInd;
          }
        });
        var savedProperties = that.orderView[ind].properties;
        that.workOrder.splice(indToDelete, 1);
        api.deleteObj(that.orderView[ind])
          .then(function () {
            // create new item with same content as deleted one so we can restore it in DB if user changes his mind
            var newItem = api.initWorkOrder();
            newItem.properties = savedProperties;
            that.createViewForOrder(newItem);
            //todo: fully initialize order item here
            that.orderView[ind] = newItem;
            that.createSmallOrderView();
           });
      }
 //     for (var dd = 1; dd < 5; dd++) {                     // set all further domains as invalid
 //       this.woIndex.properties.domainStatus[dd] = false;
 //     }
 //     api.saveObj(this.woIndex);
    };

    this.createNewWorkOrder = function () {
      var ackDelModal = $modal.open({
        templateUrl: 'app/partials/workOrder/ackDelete.html',
        controller: 'AckDelWorkOrderCtrl as ackDelWorkOrderModel',
        resolve: {
          workOrderType: function () {
            return that.woIndex.properties.label;
          }
        },
        size: 'sm'
      });

      ackDelModal.result.then(function (isDelete) {
        if (isDelete) {
          that.isActiveTab = [true, false, false, false, false, false]; // show orders tab
          // first keep orders in existing work order so they will be inserted in the new wo
          that.prevOrdersInWo = that.workOrder.filter(function (o) {
            return o.properties.domain === 0;
          });
          that.orderView = [];
          that.destroyWorkOrderDomains(0)
            .then(function () {
              that.workOrder = [];
              that.hierarchicalWorkOrder = [];
              that.woOrders = [];
              if (!that.woIndex.properties.isQuery) {
                that.createOrderView();
              }
              for (var d=0;d<5;d++) {
                that.woIndex.properties.domainStatus[d] = false;
              }
              api.saveObj(that.woIndex);
              that.isWoChanged = false;
            });
        }
      });
    };

    function unique (woItems) {
      var uniqueItems = [];
      woItems.forEach(function(woi) {
        if (uniqueItems.filter(function(woi2) {
          return woi2.id === woi.id;
        }).length === 0) {
          uniqueItems.push(woi);
        } else {
          console.log('dup update/delete:');
          console.log(woi);
        }
      });
      return uniqueItems;
    }


    this.ignoreWorkOrderChanges = function () {
      that.isWoChanged = false;
      that.isWoMajorChange = false;
      that.isActiveTab = [false, true, false, false, false, false]; // show menu items tab
    };

    // note: It would have been much more straightforward to update all item types together
    // following the changedOrders array only once.
    // However in order to update dishes, we need all the order records to be in place and
    // in order to update preps, we need all dish records to be in place
    // so we have to do the updates gradually (breath first).
    // Also, we can't delete items from workOrder array, before finishing all updates
    this.updateWorkOrder = function () {
      if (!((this.woIndex.properties.domainStatus[0] &&
            this.woIndex.properties.domainStatus[1] &&
            this.woIndex.properties.domainStatus[2]) ||
         (!this.woIndex.properties.domainStatus[0] &&
          !this.woIndex.properties.domainStatus[1] &&
          !this.woIndex.properties.domainStatus[2]))) {
        alert('בכדי לבצע עדכון צריך לחשב קודם מנות והכנות');
        return;
      }
      this.clearPreviousUpdates()
        .then(function() {
          that.updateOrders()
            .then(function() {
              that.updateDishes()
                .then(function() {
                  that.updatePreps()
                    .then(function() {
                      that.workOrder = that.workOrder.filter(function(woi) {
                        return !woi.isToDelete;
                      });
                      that.checkConsistency();
                     that.woIndex.properties.domainStatus = [true, true, true, false, false];
                      api.saveObj(that.woIndex);
                      that.createView();
                      that.splitWorkOrder();
                      that.isWoChanged = false;
                      that.isShowChanges = true;
                      that.setShowChanges();
                 //     that.changedOrders = [];
                      that.isActiveTab = [false, true, false, false, false, false]; // show menu items tab
                       console.log('update workOrder completed');
                    });
                });
            });
        });
    };

    // for preps, if showing changes, all preps must be visible
    this.setShowChanges = function () {
      if (this.isShowChanges) {
        this.isShowTodayOnly[2] = false;
        this.isShowDone[2] = true;
      } else {
        this.isShowDone[2] = false; // back to default
      }
    };

    // erases all marks of previous updateWorkOrder:
    // a. delete all items that have been marked for deletion both from workOrder array and from DB
    // b. delete backTrace entries with zero quantity
    // c. delete originalQuantity attribute of items and backtraces
    // d. delete status attribute of marked items
    this.clearPreviousUpdates = function() {
      console.log('clearing marks of previous update');
      var itemsToUpdate = [];
      var itemsToDelete = [];
      this.workOrder.forEach(function(woi) {
      var wo = woi.properties;
        if (wo.status === 'new' || wo.status === 'upd') {
          if (wo.domain > 0) {
            api.unset(woi, 'originalQuantity');
            wo.backTrace = wo.backTrace.filter(function (bt) {
              return bt.quantity > 0;
            });
            wo.backTrace.forEach(function (bt) {
              bt.originalQuantity = undefined;
              bt.status = undefined;
            });
          }
          api.unset(woi,'status');
          itemsToUpdate.push(woi);
        }
      });
      itemsToDelete = that.workOrder.filter(function(woi) {
        return woi.properties.status === 'del';
      });
      that.workOrder = that.workOrder.filter(function(woi) {
        return woi.properties.status !== 'del';
      });
      that.workOrder.forEach(function (prep) {
        if (prep.properties.domain === 2) {
          // keep only existing order entries
          var existingOrders = that.workOrder.filter(function (ord) {
            return ord.properties.domain === 0;
          });
          prep.properties.orders = prep.properties.orders.filter(function (ord) {
            return existingOrders.filter(function (exist) {
              return exist.id === ord.id;
            }).length > 0;
          });
          // adjust prep's select value according to remaining orders
          var s = 'none';
          prep.properties.orders.forEach(function (ord) {
            if (s === 'none') {
              s = ord.select;
            } else if (s !== ord.select) {
              s = 'mix';
            }
          });
          prep.properties.select = s;
          if (s === 'mix') {
            prep.isShowDetails = true;
          }
        }
      });
      this.processMsg = 'מנקה שינויים קודמים';
      return api.saveObjects(itemsToUpdate)
        .then(function() {
          console.log(itemsToUpdate.length+' items updated');
          that.processMsg = 'מוחק שינויים קודמים';
          return api.deleteObjects(itemsToDelete)
            .then(function() {
              console.log(itemsToDelete.length+' items deleted');
            });
        });
    };

    this.updateOrders = function () {
      var ordersToCreate = [];
      var ordersToUpdate = [];
      var ordersToDelete = [];
      this.changedOrders.forEach(function (changedOrder, ind) {
        if (changedOrder.action === 'past') { // past orders get deleted right away
          ordersToDelete.push(changedOrder.woItem);
          that.workOrder = that.workOrder.filter(function (woi) {
            return woi.id !== changedOrder.woItem.id;
          });
        } else if (changedOrder.action === 'delete') {
          changedOrder.woItem.properties.status = 'del';
          ordersToUpdate.push(changedOrder.woItem);
        } else if (changedOrder.action === 'new') {
          if (changedOrder.isIncludeInWo) {
            changedOrder.woItem.properties.status = 'new';
            ordersToCreate.push(changedOrder.woItem);
          }
        } else if (changedOrder.action === 'update' ||
                   changedOrder.action === 'recalc'||
                   changedOrder.action === 'itemChange') {
          changedOrder.woItem.properties.status = 'upd';
          ordersToUpdate.push(changedOrder.woItem);
        }
      });
      ordersToUpdate = unique(ordersToUpdate);
      ordersToDelete = unique(ordersToDelete);
      this.processMsg = 'יוצר אירועים';
      return api.saveObjects(ordersToCreate)
        .then(function (orders) {
          orders.forEach(function (order) {
            // save ids of newly created orders in changedOrders array
            that.changedOrders.forEach(function(co) {
              if (co.woItem.properties.order.id === order.properties.order.id) {
                co.woItem.id = order.id;
              }
            });
            that.workOrder.push(order);
          });
          console.log(orders.length + ' orders created');
          console.log(orders);
          that.processMsg = 'מעדכן אירועים';
          return api.saveObjects(ordersToUpdate)
            .then(function () {
              console.log(ordersToUpdate.length + ' orders updated');
              console.log(ordersToUpdate);
              that.processMsg = 'מוחק אירועים';
              return api.deleteObjects(ordersToDelete)
                .then(function () {
                  console.log(ordersToDelete.length + ' orders deleted');
                  console.log(ordersToDelete);
                  that.orderView = that.workOrder.filter(function(ord) {
                    return ord.properties.domain === 0;
                  }).sort(function (a, b) {
                    if (a.properties.order.eventDate > b.properties.order.eventDate) {
                      return 1;
                    } else if (a.properties.order.eventDate < b.properties.order.eventDate){
                      return -1;
                    } else if (a.properties.order.exitTime > b.properties.order.exitTime) {
                      return 1;
                    } else if (a.properties.order.exitTime < b.properties.order.exitTime) {
                      return -1;
                    } else if (a.id > b.id) {
                      return 1;
                    } else {
                      return -1;
                    }
                  });
                  that.createSmallOrderView();
                  $timeout(function() { }, 100);  // somehow needed for orderView to show correctly in view
                });
            })
        });
    };

    this.updateDishes = function() {
      var dishesToCreate = [];
      var dishesToUpdate = [];
      var dishesToDelete = [];
      this.workOrder.forEach(function(woi) {
        if (woi.properties.domain === 1) {
          woi.deletedBackTrace = [];
        }
      });
      this.changedOrders.forEach(function(changedOrder) {
        if (changedOrder.action === 'past') {
          // delete/adjust all dishes for this order without marking changes
          that.workOrder.forEach(function (dish) {
            if (dish.properties.domain === 1) {
             var matchingBt = undefined;
             var ind1;
             dish.properties.backTrace.forEach(function(bt, ind) {
               if (bt.id === changedOrder.woItem.id) {
                 matchingBt = bt;
                 ind1 = ind;
               }
             });
             if (matchingBt) { // found dish belonging to current order
               if (dish.properties.backTrace.length === 1) { // dish only in this order, just delete it
                 dishesToDelete.push(dish);
                 dish.isToDelete = true;
               } else {
                 dish.properties.quantity -= matchingBt.quantity;
                 dish.properties.backTrace[ind1].quantity = 0;
                 dish.deletedBackTrace.push(dish.properties.backTrace[ind1]);
                 dish.properties.backTrace.splice(ind1, 1);
                 dishesToUpdate.push(dish);
               }
             }
            }
          });
        } else if (changedOrder.action === 'delete' || changedOrder.action === 'recalc') {
          // delete/adjust all dishes for this order and mark changes
          that.workOrder.forEach(function (dish) {
            if (dish.properties.domain === 1) {
              var matchingBt = undefined;
              var ind1;
              dish.properties.backTrace.forEach(function(bt, ind) {
                if (bt.id === changedOrder.woItem.id) {
                  matchingBt = bt;
                  ind1 = ind;
                }
              });
              if (matchingBt) { // found dish belonging to current order
                if (dish.properties.backTrace.length === 1) { // dish only in this order
                  dish.properties.status = 'del';
                } else {
                  if (!dish.properties.status) {  // leave 'new' status unchanged
                    dish.properties.status = 'upd';
                  }
                }
                if (!dish.properties.originalQuantity) {
                  dish.properties.originalQuantity = dish.properties.quantity;
                }
                dish.properties.quantity -= matchingBt.quantity;
                matchingBt.originalQuantity = matchingBt.quantity;
                matchingBt.quantity = 0;
                matchingBt.status = 'del';
                dishesToUpdate.push(dish);
              }
            }
          });
        }
        if ((changedOrder.action === 'new' && changedOrder.isIncludeInWo) ||
             changedOrder.action === 'recalc') {
          // add/adjust all dishes for this order
          that.createDishes(changedOrder.woItem, dishesToCreate, dishesToUpdate);
        }
        if (changedOrder.action === 'itemChange') {
          // handle specific dish in order
          changedOrder.items.forEach(function(diffItem) {
            if (diffItem.action === 'delete' || diffItem.action === 'update') {
              var matchDishes = that.workOrder.filter(function(dish) {
                return dish.properties.domain === 1 &&
                   dish.properties.catalogId === diffItem.oldItem.catalogId &&
             (Boolean(dish.properties.personalAdjustment) === Boolean(diffItem.oldItem.personalAdjustment)) &&
                   (!dish.properties.personalAdjustment ||
                     dish.properties.personalAdjustment === diffItem.oldItem.personalAdjustment);
              });
              if (matchDishes.length === 0) {
                console.log('item to be updated / deleted not found in workOrder');
                console.log('order '+changedOrder.woItem.properties.order.number);
                console.log('item '+diffItem.oldItem.productName+', catalogId '+diffItem.oldItem.catalogId);
                console.log(diffItem);
                alert('המנה '+diffItem.oldItem.productName+
                      ' לא עודכנה באירוע '+changedOrder.woItem.properties.order.number+
                      '. לא נמצאה התאמה. ראה קונסול');
              } else if (matchDishes.length > 1) {
                console.log('multiple items to be updated / deleted found in workOrder');
                console.log('order '+changedOrder.woItem.properties.order.number);
                console.log('item '+diffItem.oldItem.productName);
                console.log('items found:');
                console.log(matchDishes);
                alert('המנה '+diffItem.oldItem.productName+
                  ' לא עודכנה באירוע '+changedOrder.woItem.properties.order.number+
                  '. נמצאה יותר מהתאמה אחת. ראה קונסול');
              } else { // valid - exactly one item found
                var dish = matchDishes[0];
                diffItem.matchDish = dish; // save for preps
                var matchDishBt = undefined;
                var ind3;
                dish.properties.backTrace.forEach(function(bt, ind) {
                  if (bt.id === changedOrder.woItem.id) {
                    matchDishBt = bt;
                    ind3 = ind;
                  }
                });
                if (!matchDishBt) {
                  console.log("can't find order "+changedOrder.woItem.properties.order.number+
                              " in backTrace of "+diffItem.oldItem.productName);
                  console.log('changedOrder:');
                  console.log(changedOrder);
                  console.log('dish:');
                  console.log(dish);
                } else {
                  if (!dish.properties.originalQuantity) {
                    dish.properties.originalQuantity = dish.properties.quantity;
                  }
                  if (!matchDishBt.originalQuantity) {
                    matchDishBt.originalQuantity = matchDishBt.quantity;
                  }
                  if (diffItem.action === 'delete') {
                    if (dish.properties.backTrace.length === 1 &&
                        matchDishBt.quantity === diffItem.oldItem.quantity) {
                      dish.properties.status = 'del';
                    } else {
                      if (!dish.properties.status) {  // leave 'new' status unchanged
                        dish.properties.status = 'upd';
                      }
                    }
                    dish.properties.quantity -= diffItem.oldItem.quantity;
                    matchDishBt.quantity -= diffItem.oldItem.quantity;
                    matchDishBt.status = 'del';
         //todo: test multiple occurances of same dish in order
                  } else {  // diffItem.action === 'update'
                    var quantityDiff = diffItem.newItem.quantity - diffItem.oldItem.quantity;
                    if (quantityDiff) {
                      dish.properties.quantity += quantityDiff;
                      matchDishBt.quantity += quantityDiff;
                      matchDishBt.status = 'upd';
                    }
                    // todo: how to mark description changes?
                    dish.properties.personalAdjustment =  diffItem.newItem.personalAdjustment;
                    dish.properties.status = 'upd';
                  }
                  dishesToUpdate.push(dish);
                }
              }
            } else if (diffItem.action === 'new') {
              diffItem.matchDish =
                that.createDish(changedOrder.woItem, diffItem.newItem, dishesToCreate, dishesToUpdate);
            };
          });
        }
      });
      dishesToUpdate = unique(dishesToUpdate);
      dishesToDelete = unique(dishesToDelete);
      this.processMsg = 'יוצר מנות';
       return api.saveObjects(dishesToCreate)
         .then(function(dishes) {
           that.workOrder = that.workOrder.filter(function(woi) { //exclude newly created dishes
             return !(woi.properties.domain === 1 && woi.isNewItem);
           });
           dishes.forEach(function(dish) {
             that.workOrder.push(dish);
           });
           console.log(dishes.length+' dishes created');
           console.log(dishes);
           that.processMsg = 'מעדכן מנות';
            return api.saveObjects(dishesToUpdate)
             .then(function() {
               console.log(dishesToUpdate.length+' dishes updated');
               console.log(dishesToUpdate);
               that.processMsg = 'מוחק מנות';
               return api.deleteObjects(dishesToDelete)
                 .then(function() {
                   console.log(dishesToDelete.length+' dishes deleted');
                   console.log(dishesToDelete);
                 });
             })
         });
    };

    this.updatePreps = function() {
      var prepsToCreate = [];
      var prepsToUpdate = [];
      var prepsToDelete = [];
      this.changedOrders.forEach(function(changedOrder) {
        if (changedOrder.action === 'past') {
          // delete/adjust all preps of dishes for this order
          that.workOrder.forEach(function (dish) {
            if (dish.properties.domain === 1) {
              var dishCatalogItem = catalog.filter(function(cat) {
                return cat.id === dish.properties.catalogId;
              })[0];
              // look for order in deleted dish backtrace entries too
              if (dish.properties.backTrace.concat(dish.deletedBackTrace).filter(function(bt) {
                return bt.id === changedOrder.woItem.id;
                    }).length > 0) { // found a dish which is included in current order
                // now find all preps whose backTrace points to this dish
                that.workOrder.forEach(function(prep) {
                  if (prep.properties.domain === 2) {
                    var matchingBt = undefined;
                    var ind1;
                    prep.properties.backTrace.forEach(function (bt, ind) {
                      if (bt.id === dish.id) {
                        matchingBt = bt;
                        ind1 = ind;
                      }
                    });
                    if (matchingBt) { // found prep which stems from current dish
                      var prepCatalogItem = catalog.filter(function (cat) {
                        return cat.id === prep.properties.catalogId;
                      })[0];
                      var dishComponent = dishCatalogItem.properties.components.filter(function (comp) {
                        return comp.id === prepCatalogItem.id;
                      })[0];
                      if (!dishComponent) {
                        alert('ההכנה ' + prep.properties.productName + ' לא נמצאה בין המרכיבים של המנה ' +
                          dish.properties.productName);
                        return;
                      }
                      if (prep.properties.backTrace.length === 1 && dish.isToDelete) {
                        // whole dish was deleted and prep only in this dish - delete prep
                        prepsToDelete.push(prep);
                        prep.isToDelete = true;
                      } else {
                        if (dish.isToDelete) {
                          // whole dish deleted, but prep belongs to other dishes too
                          prep.properties.quantity -= matchingBt.quantity;
                          prep.properties.backTrace.splice(ind1, 1);
                        } else {
                          // dish appears in other orders too - dish's quantity was adjusted
                          var oldQuant = matchingBt.quantity;
                          matchingBt.quantity =
                            dish.properties.quantity * dishComponent.quantity /
                            dishCatalogItem.properties.productionQuantity;
                          prep.properties.quantity -= (oldQuant - matchingBt.quantity);
                        }
                        // delete order's entry in prep
                        prep.properties.orders = prep.properties.orders.filter(function (ord) {
                          return ord.id !== changedOrder.woItem.id;
                        });
                        // adjust prep's select value according to remaining orders
                        var s = 'none';
                        prep.properties.orders.forEach(function (ord) {
                          if (s === 'none') {
                            s = ord.select;
                          } else if (s !== ord.select) {
                            s = 'mix';
                          }
                        });
                        prep.properties.select = s;
                        if (s === 'mix') {
                          prep.isShowDetails = true;
                        }
                        prepsToUpdate.push(prep);
                      }
                    }
                  }
                });
               }
            }
          });
        } else if (changedOrder.action === 'delete' || changedOrder.action === 'recalc') {
          // delete/adjust all preps of dishes for this order
          that.workOrder.forEach(function (dish) {
            if (dish.properties.domain === 1) {
              var dishCatalogItem = catalog.filter(function(cat) {
                return cat.id === dish.properties.catalogId;
              })[0];
              if (dish.properties.backTrace.filter(function(bt) {
                return bt.id === changedOrder.woItem.id;
              }).length > 0) { // found a dish which is included in current order
                // now find all preps whose backTrace points to this dish
                that.workOrder.forEach(function(prep) {
                  if (prep.properties.domain === 2) {
                    var matchingBt = undefined;
                    var ind1;
                    prep.properties.backTrace.forEach(function (bt, ind) {
                      if (bt.id === dish.id) {
                        matchingBt = bt;
                        ind1 = ind;
                      }
                    });
                    if (matchingBt) { // found prep which stems from current dish
                      var prepCatalogItem = catalog.filter(function (cat) {
                        return cat.id === prep.properties.catalogId;
                      })[0];
                      var dishComponent = dishCatalogItem.properties.components.filter(function (comp) {
                        return comp.id === prepCatalogItem.id;
                      })[0];
                      if (!dishComponent) {
                        alert('ההכנה ' + prep.properties.productName + ' לא נמצאה בין המרכיבים של המנה ' +
                          dish.properties.productName);
                        return;
                      }
                      if (!prep.properties.originalQuantity) {
                        prep.properties.originalQuantity = prep.properties.quantity;
                      }
                      if (!matchingBt.originalQuantity) {
                        matchingBt.originalQuantity = matchingBt.quantity;
                      }
                     if (prep.properties.backTrace.length === 1 && dish.properties.status === 'del') {
                        // whole dish was deleted and prep only in this dish - delete prep
                        prep.properties.status = 'del';
                        prep.properties.quantity = 0;
                        matchingBt.quantity = 0;
                        prepsToUpdate.push(prep);
                      } else {
                       if (!prep.properties.status) {  // leave 'new' status unchanged
                         prep.properties.status = 'upd';
                       }
                       if (dish.properties.status === 'del') {
                          // whole dish deleted, but prep belongs to other dishes too
                          prep.properties.quantity -= matchingBt.quantity;
                          matchingBt.quantity = 0;
                        } else {
                          // dish appears in other orders too - dish's quantity was adjusted
                          var oldQuant = matchingBt.quantity;
                          matchingBt.quantity =
                            dish.properties.quantity * dishComponent.quantity /
                            dishCatalogItem.properties.productionQuantity;
                          prep.properties.quantity -= (oldQuant - matchingBt.quantity);
                        }
                      prepsToUpdate.push(prep);
                      }
                    }
                  }
                });
              }
            }
          });
        }
        if ((changedOrder.action === 'new' && changedOrder.isIncludeInWo) ||
             changedOrder.action === 'recalc') {
          // add / adjust all preps of dishes for this order
          that.workOrder.forEach(function (dish) {
            if (dish.properties.domain === 1) {
              var dishCatalogItem = catalog.filter(function(cat) {
                return cat.id === dish.properties.catalogId;
              })[0];
              var dishBt = dish.properties.backTrace.filter(function(bt) {
                return bt.id === changedOrder.woItem.id;
                  })[0];
              if (dishBt) { // found a dish which is included in current order
                // now find all preps which are components of this dish
                dishCatalogItem.properties.components.forEach(function (comp) {
                  if (comp.domain === 2) {
                    var tempCat = catalog.filter(function(cat) {
                      return cat.id === comp.id
                    })[0];
                    var prep = that.workOrder.filter(function (woi) {
                      return woi.properties.catalogId === comp.id;
                    })[0];
                    if (prep) { // prep already in workOrder - adjust quantity
                     if (!prep.properties.originalQuantity) {
                       prep.properties.originalQuantity = prep.properties.quantity;
                     }
                      prep.properties.quantity +=
                        dishBt.quantity *
                        comp.quantity / dishCatalogItem.properties.productionQuantity;
                      var prepBt = prep.properties.backTrace.filter(function(bt) {
                        return bt.id === dish.id;
                      })[0];
                      if (prepBt) {
                        if (!prepBt.originalQuantity) {
                          prepBt.originalQuantity = prepBt.quantity;
                        }
                        prepBt.quantity += dishBt.quantity *
                          comp.quantity / dishCatalogItem.properties.productionQuantity;
                      } else {
                        prep.properties.backTrace.push({
                          id: dish.id,
                          domain: 1,
                          originalQuantity: -1,
                          quantity: dishBt.quantity *
                            comp.quantity / dishCatalogItem.properties.productionQuantity
                        });
                      }
                      if (!prep.properties.status) {  // leave 'new' status unchanged
                        prep.properties.status = 'upd';
                      }
                      if (prep.properties.select !== 'delay') {
                        prep.properties.select = 'mix';
                      }
                      var prepOrder = prep.properties.orders.filter(function(ord) {
                        ord.id === changedOrder.woItem.id;
                      })[0];
                      if (!prepOrder) { // new prep for this order
                        prep.properties.orders.push ({
                          id: changedOrder.woItem.id,
                          select: 'delay'
                        });
                      }
                      if (!prep.properties.status) {  // leave 'new' status unchanged
                        prep.properties.status = 'upd';
                      }
                      if (!prep.isNewItem) {  // if prep was just created, update will cause duplicates
                        prepsToUpdate.push(prep);
                      }
                    } else { // create new prep
                      var prepCatalogItem = catalog.filter(function (cat) {
                        return cat.id === comp.id;
                      })[0];
                      prep = api.initWorkOrder();
                      prep.isNewItem = true;
                      prep.properties.woId = woId;
                      prep.properties.catalogId = prepCatalogItem.id;
                      prep.properties.productName = prepCatalogItem.properties.productName;
                      prep.properties.category = allCategories.filter(function (cat) {
                        return cat.tId === prepCatalogItem.properties.category;
                      })[0];
                      prep.properties.domain = 2;
                      prep.properties.measurementUnit = measurementUnits.filter(function (mes) {
                        return mes.tId === prepCatalogItem.properties.measurementUnit;
                      })[0];
                      prep.properties.isInStock = prepCatalogItem.properties.isInStock;
                      prep.properties.originalQuantity = -1;
                      prep.properties.quantity = dishBt.quantity *
                                     comp.quantity / dishCatalogItem.properties.productionQuantity;
                      prep.properties.quantityForToday = 0;
                      prep.properties.quantityDone = 0;
                      prep.properties.select = 'delay';
                      prep.properties.backTrace = [{
                        id: dish.id,
                        domain: 1,
                        quantity: dishBt.quantity *
                                    comp.quantity / dishCatalogItem.properties.productionQuantity,
                        originalQuantity: -1
                      }];
                      prep.properties.orders = [{
                        id: changedOrder.woItem.id,
                        select: 'delay'
                      }];
                      prep.properties.status = 'new';
                      that.workOrder.push(prep);
                      prepsToCreate.push(prep);
                    }
                  }
                });
              }
            }
          });
        }
        if (changedOrder.action === 'itemChange') {
          // handle preps of specific dishes in order
          changedOrder.items.forEach(function(diffItem) {
               var dish = diffItem.matchDish;
               if (dish) {  // just make sure no catastrophy occured while creating dish
                 // if dish was newly created, matchDish points to a version without id (before save)
                 // we now have to find its saved version
                 if (!dish.id) {
                   dish = that.workOrder.filter(function(woi) {
                     return woi.properties.domain === 1 &&
                       woi.properties.catalogId === diffItem.matchDish.properties.catalogId &&
                       woi.properties.personalAdjustment === diffItem.matchDish.properties.personalAdjustment;
                   })[0];
                   if (!dish) {
                     console.log('didnt find saved dish');
                     console.log(diffItem.matchDish);
                     console.log(that.workOrder);
                     alert('תקלה. לא נמצאה מנה תואמת להכנה. ראה קונסול.')
                     return;
                   }
                 }
                 var dishCatalogItem = catalog.filter(function (cat) {
                   return cat.id === dish.properties.catalogId;
                 })[0];
                 var matchDishBt = undefined;
                 var ind3;
                 dish.properties.backTrace.concat(dish.deletedBackTrace)
                  .forEach(function (bt, ind) {
                     if (bt.id === changedOrder.woItem.id) {
                       matchDishBt = bt;
                       ind3 = ind;
                     }
                   });
                 if (!matchDishBt) {
                   console.log("can't find order " + changedOrder.woItem.properties.order.number +
                     " in backTrace of " + diffItem.oldItem.productName);
                   console.log('changedOrder:');
                   console.log(changedOrder);
                   console.log('dish:');
                   console.log(dish);
                 } else {
                   if (diffItem.action === 'delete' || diffItem.action === 'update') {
                     that.workOrder.forEach(function (prep) { // find all preps of dish
                     if (prep.properties.domain === 2) {
                       var prepBt = undefined;
                       var ind4;
                       prep.properties.backTrace.forEach(function (bt, ind) {
                         if (bt.id === dish.id) {
                           prepBt = bt;
                           ind4 = ind;
                         }
                       });
                       if (prepBt) {
                         var dishComponent = dishCatalogItem.properties.components.filter(function (comp) {
                           return comp.id === prep.properties.catalogId;
                         })[0];
                         if (!dishComponent) {
                           alert('ההכנה ' + prep.properties.productName + ' לא נמצאה בין המרכיבים של המנה ' +
                             dish.properties.productName);
                           return;
                         }
                         if (!prep.properties.originalQuantity) {
                           prep.properties.originalQuantity = prep.properties.quantity;
                         }
                         if (!prepBt.originalQuantity) {
                           prepBt.originalQuantity = prepBt.quantity;
                         }
                         if (diffItem.action === 'delete') {
                           if (dish.properties.status === 'del' &&
                               prep.properties.backTrace.length === 1) {
                             prep.properties.status = 'del';
                           } else if (dish.properties.status === 'del') {
                             prep.properties.quantity -= prepBt.quantity;
                             if (!prep.properties.status) {  // leave 'new' status unchanged
                               prep.properties.status = 'upd';
                             }
                           } else {
                             // dish's quantity was adjusted
                             var oldQuant = prepBt.quantity;
                             prepBt.quantity =
                               dish.properties.quantity * dishComponent.quantity /
                               dishCatalogItem.properties.productionQuantity;
                             prep.properties.quantity -= (oldQuant - prepBt.quantity);
                             if (!prep.properties.status) {  // leave 'new' status unchanged
                               prep.properties.status = 'upd';
                             }
                           }
                         } else { // action === 'update'
                           var addedDishQuantity = diffItem.newItem.quantity - diffItem.oldItem.quantity;
                           if (addedDishQuantity) {  // treat only quantity changes
                             var addedPrepQuantity = addedDishQuantity * dishComponent.quantity /
                               dishCatalogItem.properties.productionQuantity;
                             prepBt.quantity += addedPrepQuantity;
                             prep.properties.quantity += addedPrepQuantity;
                           }
                           if (!prep.properties.status) {  // leave 'new' status unchanged
                             prep.properties.status = 'upd';
                           }
                         }
                         prepsToUpdate.push(prep);
                       }
                     }
                   });
                 } else  {  // action === 'new'
                     dishCatalogItem.properties.components.forEach(function(dishComponent) {
                       if (dishComponent.domain === 2) {
                         var prep = that.workOrder.filter(function(woi) {
                           return woi.properties.catalogId === dishComponent.id;
                         })[0];
                         if (prep) {  // prep already exists, just update quantity
                           if (!prep.properties.originalQuantity) {
                             prep.properties.originalQuantity = prep.properties.quantity;
                           }
                           prep.properties.quantity += diffItem.newItem.quantity *
                             dishComponent.quantity / dishCatalogItem.properties.productionQuantity;
                           var prepBt = prep.properties.backTrace.filter(function (bt) {
                             return bt.id === dish.id;
                           })[0];
                           if (prepBt) {
                             if (!prepBt.originalQuantity) {
                               prepBt.originalQuantity = prepBt.quantity;
                             }
                             prepBt.quantity += diffItem.newItem.quantity *
                               dishComponent.quantity / dishCatalogItem.properties.productionQuantity;
                            } else {
                             prep.properties.backTrace.push({
                               id: dish.id,
                               domain: 1,
                               originalQuantity: -1,
                               quantity: diffItem.newItem.quantity *
                                 dishComponent.quantity / dishCatalogItem.properties.productionQuantity
                             });
                             if (!prep.properties.status) {  // leave 'new' status unchanged
                               prep.properties.status = 'upd';
                             }
                           }
                           var prepOrder = prep.properties.orders.filter(function (ord) {
                             return ord.id === changedOrder.woItem.id;
                           })[0];
                           if (prepOrder) {
                             //todo: handle select conflict
                           } else {
                             prep.properties.orders.push({
                               id: changedOrder.woItem.id,
                               select: 'delay'
                             });
                           }
                           prepsToUpdate.push(prep);
                         } else {  // new prep
                           var prepCatalogItem = catalog.filter(function (cat) {
                             return cat.id === dishComponent.id;
                           })[0];
                           prep = api.initWorkOrder();
                           prep.isNewItem = true;
                           prep.properties.woId = woId;
                           prep.properties.catalogId = prepCatalogItem.id;
                           prep.properties.productName = prepCatalogItem.properties.productName;
                           prep.properties.category = allCategories.filter(function (cat) {
                             return cat.tId === prepCatalogItem.properties.category;
                           })[0];
                           prep.properties.domain = 2;
                           prep.properties.measurementUnit = measurementUnits.filter(function (mes) {
                             return mes.tId === prepCatalogItem.properties.measurementUnit;
                           })[0];
                           prep.properties.isInStock = prepCatalogItem.properties.isInStock;
                           prep.properties.originalQuantity = -1;
                           prep.properties.quantity = diffItem.newItem.quantity *
                             dishComponent.quantity / dishCatalogItem.properties.productionQuantity;
                           prep.properties.quantityForToday = 0;
                           prep.properties.quantityDone = 0;
                           prep.properties.select = 'delay';
                           prep.properties.backTrace = [{
                             id: dish.id,
                             domain: 1,
                             originalQuantity: -1,
                             quantity: diffItem.newItem.quantity *
                               dishComponent.quantity / dishCatalogItem.properties.productionQuantity
                           }];
                           prep.properties.orders = [{
                             id: changedOrder.woItem.id,
                             select: 'delay'
                           }];
                           prep.properties.status = 'new';
                           that.workOrder.push(prep);
                           prepsToCreate.push(prep);
                         }
                       }
                     })
                   }
               }
             }
         });
        }
      });
      prepsToUpdate = unique(prepsToUpdate);
      prepsToDelete = unique(prepsToDelete);
      this.processMsg = 'יוצר הכנות';
      return api.saveObjects(prepsToCreate)
        .then(function(preps) {
          that.workOrder = that.workOrder.filter(function(woi) { //exclude newly created preps
            return !(woi.properties.domain === 2 && woi.isNewItem);
          });
          preps.forEach(function(prep) {
            that.workOrder.push(prep);
          });
          console.log(preps.length+' preps created');
          console.log(preps);
          that.processMsg = 'מעדכן הכנות';
          return api.saveObjects(prepsToUpdate)
            .then(function() {
              console.log(prepsToUpdate.length+' preps updated');
              console.log(prepsToUpdate);
              that.processMsg = 'מוחק הכנות';
              return api.deleteObjects(prepsToDelete)
                .then(function() {
                  console.log(prepsToDelete.length+' preps deleted');
                  console.log(prepsToDelete);
                });
            })
        });
    };

 // find any items whose backtrace points to non existing items
    this.checkConsistency = function() {
      console.log('starting consistency check');
      var bug = 0;
      this.workOrder.forEach(function(woi) {
        if (woi.properties.domain > 0) {
          woi.properties.backTrace.forEach(function(bt) {
            var rec = that.workOrder.filter(function (woi2) {
              return woi2.id === bt.id;
            });
            if (rec.length === 0) {
              console.log('domain '+woi.properties.domain+
                ', item '+woi.properties.productName+' points to non existent item '+
                ' id '+bt.id);
              console.log(bt);
              console.log(woi);
              bug++;
            }
          });
        }
      });
      if (bug) {
        console.log(bug+' inconsistencies found!');
        alert ('נמצאו '+bug+' פריטים עם הצבעות לא תקינות. ראה קונסול');
      } else {
        console.log('consistency check OK');
      }
    };

    // compares current wo to base wo to see if updates are done correctly
    // base wo should be created from scratch with same orders as current wo
    this.compareWorkOrder = function() {
      var baseWoId = this.baseWoIndex.properties.woId;
      this.isProcessing = true;
      this.processMsg = 'טוען פקודת עבודה להשוואה';
      api.queryWorkOrder(baseWoId)
        .then(function(baseWo) {
          that.baseWorkOrder = baseWo;
          that.isCompareActive = true;
          that.results = [];
          that.compareWorkOrderDomain(0,
            function(bWoi,woi){
             return bWoi.properties.order.id === woi.properties.order.id;
           },
            function(bWoi,woi) {
              return [];
          });
          that.compareWorkOrderDomain(1,
            function(bWoi,woi){
              return bWoi.properties.catalogId === woi.properties.catalogId &&
                bWoi.properties.personalAdjustment === woi.properties.personalAdjustment;
            },
            function(bWoi,woi) {
              return that.compareDishes(bWoi, woi);
          });
          that.compareWorkOrderDomain(2,
            function(bWoi,woi){
              return bWoi.properties.catalogId === woi.properties.catalogId;
           },
            function(bWoi,woi) {
              return that.comparePreps(bWoi, woi);
            });
          that.isProcessing = false;
        });
    };

    this.compareWorkOrderDomain = function (domain, isMatch, compareContents) {
      that.baseWorkOrder.forEach(function(bWoi) {
        if (bWoi.properties.domain === domain) {
          var matchingRecord = that.workOrder.filter(function(woi) {
            return woi.properties.domain === domain && isMatch(bWoi, woi);
          })[0];
          if (!matchingRecord) {
            that.results.push({
              domain: domain,
              type: 'missing',
              reason: 'חסר',
              baseRecord: bWoi,
              newRecord: undefined
            });
          } else {
            that.results = that.results.concat(compareContents(bWoi, matchingRecord));
          }
        }
      });
      that.workOrder.forEach(function(woi) {
        if (woi.properties.domain === domain) {
          var matchingRecord = that.baseWorkOrder.filter(function(bWoi) {
            return bWoi.properties.domain === domain && isMatch(bWoi, woi);
          })[0];
          if (!matchingRecord) {
            that.results.push({
              domain: domain,
              type: 'superfluous',
              reason: 'עודף',
              baseRecord: undefined,
              newRecord: woi
            });
          }
        }
      })
    };

    this.compareDishes = function (bWoi, woi) {
      var res = [];
      if (woi.properties.quantity !== bWoi.properties.quantity) {
        res.push({
          domain: bWoi.properties.domain,
          type: 'different',
          reason: 'כמות שונה',
          baseRecord: bWoi,
          newRecord: woi
        });
      }
      if (woi.properties.backTrace.length !== bWoi.properties.backTrace.length) {
        res.push({
          domain: bWoi.properties.domain,
          type: 'different',
          reason: 'מספר אירועים שונה',
          baseRecord: bWoi,
          newRecord: woi
        });
      }
      return res;
    };

    this.comparePreps = function (bWoi, woi) {
      var res = [];
      if (Math.round(woi.properties.quantity*200) !== Math.round(bWoi.properties.quantity*200)) {
        res.push({
          domain: bWoi.properties.domain,
          type: 'different',
          reason: 'כמות שונה',
          baseRecord: bWoi,
          newRecord: woi
        });
      }
      if (woi.properties.backTrace.length !== bWoi.properties.backTrace.length) {
        res.push({
          domain: bWoi.properties.domain,
          type: 'different',
          reason: 'מספר אירועים שונה',
          baseRecord: bWoi,
          newRecord: woi
        });
      }
      return res;
    };

    this.copyWorkOrder = function () {
      var targetWoId = this.targetWoIndex.properties.woId;
      this.isProcessing = true;
      this.processMsg = 'מעתיק פקודת עבודה';
      api.queryWorkOrder(targetWoId)
        .then(function(oldTarget) {
          console.log('target wo retrieved');
          api.deleteObjects(oldTarget)
            .then(function() {
              console.log('target wo deleted');
              var newTarget = [];
              that.workOrder.forEach(function(woi) {
                var t = api.initWorkOrder();
                t.properties = angular.copy(woi.properties);
                t.properties.woId = targetWoId;
                t.oldId = woi.id;
                newTarget.push(t);
              });
              api.saveObjects(newTarget)
                .then(function(newTarget2) {
                  console.log('target wo created from source');
                  var ids = newTarget2.map(function(woi) {
                    return {
                      old: woi.oldId,
                      new: woi.id
                    }
                  });
                  newTarget2.forEach(function(woi) {
                    if (woi.properties.domain > 0) {
                      woi.properties.backTrace.forEach(function(bt) {
                        var id2 = ids.filter(function(id3){
                          return id3.old === bt.id;
                        })[0];
                        bt.id = id2.new;
                      })
                    }
                  });
                  newTarget2.forEach(function(woi) {
                    if (woi.properties.domain === 2) {
                      woi.properties.orders.forEach(function(ord) {
                        var id2 = ids.filter(function(id3){
                          return id3.old === ord.id;
                        })[0];
                        ord.id = id2.new;
                      })
                    }
                  });
                  api.saveObjects(newTarget2)
                    .then(function() {
                      console.log('target backtraces and orders fixed');
                      var copyIndex = woIndexes.filter(function(ind) {
                        return ind.properties.woId === targetWoId;
                      })[0];
                      copyIndex.properties.domainStatus = that.woIndex.properties.domainStatus;
                      api.saveObj(copyIndex)
                        .then(function() {
                          that.isProcessing = false;
                          alert('פקודת העבודה הועתקה')
                        });
                    });
                });
            });
        });
    };

    this.saveWorkOrder = function (domain) {
      var woItemsToSave = this.workOrder.filter(function (woi) {
        return woi.properties.domain === domain;
      });
      this.isProcessing = true;
      this.processMsg = 'שומר '+lov.domains[domain].label;
       return api.saveObjects(woItemsToSave)
        .then(function (domainItems) {
          that.isProcessing = false;
          that.workOrder = that.workOrder.filter(function (woi) { // merge workOrder to add ids on new items
            return woi.properties.domain !== domain;
          }).concat(domainItems);
          }, function () {
          alert('workOrder multiple save failed');
          that.isProcessing = false;
        });
    };

    // split wo by domains and categories
    this.splitWorkOrder = function () {
      this.hierarchicalWorkOrder = [];
      for (var d = 1; d < 5; d++) {
        this.hierarchicalWorkOrder[d] = {
          domainId: d,
          categories: [],
          isShowAll: true
        };
      }
      this.workOrder.forEach(function(woi) {
        var wo = woi.properties;
        woi.isShow = !wo.isInStock;
        if (wo.domain === 2 && wo.select === 'mix') {
          woi.isShowDetails = true;
        }
        if (wo.domain === 2) {
          woi.isAnyRemark = false;
          woi.view.dishes.forEach(function(mi) {
            if (mi.isRemark) {
              woi.isAnyRemark = true;
            }
          });
        }
        if (wo.domain > 0) {
          var catInd;
          var temp = that.hierarchicalWorkOrder[wo.domain].categories.filter(function (c, ind) {
            if (c.category.tId === wo.category.tId) {
              catInd = ind;
              return true;
            }
          });
          if (!temp.length) {  // if category appears for 1st time, create it's object
            that.hierarchicalWorkOrder[wo.domain].categories.splice(0, 0, {
              category: wo.category,
              isShow: true
             });
            catInd = 0;
            if (wo.domain === 4) {
            that.hierarchicalWorkOrder[wo.domain].categories[0].lists = [
              {
                id: 0,
                label: 'הכנה לסרוויס',
                list: []
              },
              {
                id: 1,
                label: 'סרוויס',
                list: []
              },
              {
                id: 2,
                label: 'הכנות רגילות',
                list: []
              }
            ];
            } else {
              that.hierarchicalWorkOrder[wo.domain].categories[0].list = [];
            }
          }
          if (wo.domain === 4) {
            var service = wo.backTrace.filter(function (serv) { // is this action based on at least 1 prep
              return that.workOrder.filter(function(serv2) {
                return serv2.id === serv.id;
              })[0].properties.category.type === 11;
            });
            var preService = wo.backTrace.filter(function (serv) { // is this action based on at least 1 prep
              return that.workOrder.filter(function(serv2) {
                return serv2.id === serv.id;
              })[0].properties.category.type === 12;
            });
            if (preService.length) {
              that.hierarchicalWorkOrder[4].categories[catInd].lists[0].list.push(woi);
            } else if (service.length) {
              that.hierarchicalWorkOrder[4].categories[catInd].lists[1].list.push(woi);
            } else {
              that.hierarchicalWorkOrder[4].categories[catInd].lists[2].list.push(woi);
            }
          } else {
            that.hierarchicalWorkOrder[wo.domain].categories[catInd].list.push(woi);
          }
        }
      });

      // sort categories of each domain and items within category
      this.hierarchicalWorkOrder.forEach(function(domain) {
        domain.categories.sort(function (a, b) {
          return a.category.order - b.category.order;
        });
        if (domain.domainId === 4) {
          domain.categories.forEach(function (cat) {
            cat.lists.forEach(function (lis) {
              lis.list.sort(function (a, b) {
                if (a.properties.productName > b.properties.productName) {
                  return 1;
                } else if (a.properties.productName < b.properties.productName) {
                  return -1;
                } else if (a.properties.personalAdjustment > b.properties.personalAdjustment) {
                  return 1;
                } else if (a.properties.personalAdjustment < b.properties.personalAdjustment) {
                  return -1;
                } else {
                  return 0;
                }
              });
            });
          });
        } else {
          domain.categories.forEach(function (cat) {
            cat.list.sort(function (a, b) {
              if (a.properties.productName > b.properties.productName) {
                return 1;
              } else if (a.properties.productName < b.properties.productName) {
                return -1;
              } else if (a.properties.personalAdjustment > b.properties.personalAdjustment) {
                return 1;
              } else if (a.properties.personalAdjustment < b.properties.personalAdjustment) {
                return -1;
              } else {
                return 0;
              }
            });
          });
        }
      });

      // for dishes domain only, add list of changed product descriptions per category
      this.hierarchicalWorkOrder[1].categories.forEach(function(cat) {
        cat.changedDescriptions = [];
        var descCnt = 0;
        cat.list.forEach(function(woItem) {
          if (woItem.properties.personalAdjustment){
            cat.changedDescriptions.push({
              desc: woItem.properties.personalAdjustment,
              cnt: ++descCnt
            });
            woItem.descCnt = descCnt;
          }
        });
      });
    };

    this.setGlobalDetail = function() {
      this.workOrder.forEach(function(woi) {
        if (woi.properties.domain === that.domain) {
          if (woi.properties.domain === 2) {
            if (that.isShowTodayOnly[2] || woi.properties.select !== 'mix') {
              woi.isShowDetails = that.isShowDetails[2];
            }
          } else {
            woi.isShowDetails = that.isShowDetails[woi.properties.domain];
          }
        }
      });
      this.hierarchicalWorkOrder[that.domain].categories.forEach(function (cat) {
        cat.isShowDetails = that.isShowDetails[that.domain];
      });
    };

    this.setCategoryDetail = function(category) {
      if (this.domain === 4) {
        category.lists.forEach(function (lis) {
          lis.list.forEach(function (woi) {
            woi.isShowDetails = category.isShowDetails;
          })
        })
      } else {
        category.list.forEach(function (woi) {
          if (woi.properties.domain === 2) {
            if (that.isShowTodayOnly[2] || woi.properties.select !== 'mix') {
              woi.isShowDetails = category.isShowDetails;
            }
          } else {
            woi.isShowDetails = category.isShowDetails;
          }
        });
      }
    };

    // create work order items for specified domain from lower domain itens
    this.createWorkOrderDomain = function (targetDomain) {
      if (targetDomain===1) { // clicking <compute dishes> signifies that order selection is complete
        this.woIndex.properties.domainStatus[0] = true;
        // api.saveObj(this.woIndex); not needed here, will be saved later anyway
      }
      // destroy existing work order items of target and higher domains
      return this.destroyWorkOrderDomains(targetDomain)
        .then(function () {
        that.workOrder = that.workOrder.filter(function (wo) {
          // for products domain, include actions
          return targetDomain===3 ?
            (wo.properties.domain === 4 || wo.properties.domain < targetDomain) :
            (wo.properties.domain < targetDomain);
        });
        if (targetDomain === 1) {
          that.createDishesDomain();
        } else {
          that.createComponentsDomain(targetDomain);
        }
        return that.saveWorkOrder(targetDomain)
          .then(function () {
            that.isActiveTab.forEach(function(tab) {
              tab = false;
            });
            that.isActiveTab[targetDomain] = true;
            that.woIndex.properties.domainStatus[targetDomain] = true; // the domain just created is valid
            if (targetDomain < 3) {
              for (var dd = targetDomain + 1; dd < 5; dd++) {  // all further domains - invalid
                that.woIndex.properties.domainStatus[dd] = false;
              }
            }
            api.saveObj(that.woIndex)
              .then(function () {
              });
          });
      });
    };

   this.setQuantity = function (woItem, domain) {
      api.saveObj (woItem)
        .then(function () {
          if (domain < 3) {
            for (var dd = domain + 1; dd < 5; dd++) {                     // set all further domains as invalid
              that.woIndex.properties.domainStatus[dd] = false;
            }
          }
        api.saveObj(that.woIndex);
      });
    };

      this.delItem = function (dom, cat, item) {
        if (dom < 4) {  // not working for actions domain
          api.deleteObj(this.hierarchicalWorkOrder[dom].categories[cat].list[item])
            .then(function (obj) {
              that.workOrder = that.workOrder.filter(function (wo) {
                return wo.id !== obj.id;
              });
              that.hierarchicalWorkOrder[dom].categories[cat].list.splice(item, 1);
              if (dom < 3) {
                for (var dd = dom + 1; dd < 5; dd++) {                     // set all further domains as invalid
                  that.woIndex.properties.domainStatus[dd] = false;
                }
              }
              api.saveObj(that.woIndex);
            });
        }
    };

   this.backInfo = function (woItem) {
      var backTraceModal = $modal.open({
          templateUrl: 'app/partials/workOrder/backTrace.html',
        controller: 'WorkOrderBackTraceCtrl as workOrderBackTraceModel',
        resolve: {
          workOrderItem: function () {
            return woItem;
          },
          workOrder: function () {
            return that.workOrder;
          },
          domains: function () {
            return lov.domains;
          }
        },
        size: 'lg'
      });

      backTraceModal.result.then(function () {
      });

    };

      // check if any order in wo has passed or has been changed since last wo creation
     this.checkDiff = function () {
       that.isWoChanged = false;
       that.isWoMajorChange = false;
       that.changedOrders = [];
       var reason, action;
       var diffItems = [];
       this.processMsg = 'בודק אם יש שינויים באירועים';
       return api.queryFutureOrders()
         .then(function(futureOrders) {
           that.woOrders.forEach(function (woOrder) {
             if (woOrder.properties.status !== 'del') {
               var ord = futureOrders.filter(function (futureOrder) {
                 return futureOrder.properties.number === woOrder.properties.order.number;
               })[0];
               if (!ord) { // order occured in the past
                 if (that.woIndex.properties.isDefault) { // don't alert past orders for non default wos
                   that.isWoChanged = true;
                   that.isWoMajorChange = true;
                   that.changedOrders.push({
                     id: Math.round(Math.random() * 1000000),  // just for ng-repeat uniqueness
                     reason: 'עבר',
                     action: 'past',
                     woItem: woOrder,
                     items: diffItems
                   });
                 }
               } else {
                 ord.isInWo = true;
                 if (ord.updatedAt > that.woIndex.updatedAt) { // order updated
                   that.isWoChanged = true;
                   if (ord.properties.orderStatus === 6 || ord.properties.orderStatus < 2) {
                     that.isWoMajorChange = true;
                     woOrder.properties.order = ord.properties;
                     woOrder.properties.order.id = ord.id;
                     reason = 'בוטל';
                     // action = 'delete'; todo: temporary
                     action = 'past';
                   } else {
                     var dateDiff = ord.properties.eventDate - woOrder.properties.order.eventDate;
                     var timeDiff = (ord.properties.eventTime && woOrder.properties.order.eventTime) ?
                         ord.properties.eventTime - woOrder.properties.order.eventTime : 0;
                     if ((dateDiff !== 0 || timeDiff !== 0) && ord.properties.eventDate > that.horizonDate) {
                       that.isWoMajorChange = true;
                       woOrder.properties.order = ord.properties;
                       woOrder.properties.order.id = ord.id;
                       reason = 'נדחה';
                       action = 'delete';
                     } else if (ord.properties.quotes[ord.properties.activeQuote].menuType.tId !==
                         woOrder.properties.order.quotes[woOrder.properties.order.activeQuote].menuType.tId) {
                       that.isWoMajorChange = true;
                       woOrder.properties.order = ord.properties;
                       woOrder.properties.order.id = ord.id;
                       reason = 'תפריט אחר';
                       action = 'recalc';
                     } else {
                       diffItems = that.compareItems(
                           ord.properties.quotes[ord.properties.activeQuote].items,
                           woOrder.properties.order.quotes[woOrder.properties.order.activeQuote].items
                       );
                       if (diffItems.length) {
                         that.isWoMajorChange = true;
                         woOrder.properties.order = ord.properties;
                         woOrder.properties.order.id = ord.id;
                         reason = 'שינוי מנות';
                         action = 'itemChange';
                       } else if ((dateDiff !== 0 || timeDiff !== 0)
                           && ord.properties.eventDate <= that.horizonDate) {
                         that.isWoMajorChange = true;
                         woOrder.properties.order = ord.properties;
                         woOrder.properties.order.id = ord.id;
                         reason = 'הוזז';
                         action = 'update';
                       } else {
                         that.isWoMajorChange = true;
                         woOrder.properties.order = ord.properties;
                         woOrder.properties.order.id = ord.id;
                         reason = 'שינוי אחר';
                         action = 'update';
                       }
                     }
                   }
                   that.changedOrders.push({
                     id: Math.round(Math.random() * 1000000),  // just for ng-repeat uniqueness
                     reason: reason,
                     action: action,
                     woItem: woOrder,
                     items: diffItems
                   });
                 }
               }
             }
           });
           if (that.woIndex.properties.isDefault) { // don't alert new orders for non default wos
             var newOrders = futureOrders.filter(function (ord) {
               return !ord.isInWo &&
                   ord.properties.eventDate <= that.horizonDate &&
                   ord.properties.orderStatus > 1 &&
                   ord.properties.orderStatus < 6;
             });
             newOrders.forEach(function (newOrd) {
               that.isWoChanged = true;
               that.isWoMajorChange = true;
               var orderWoItem = api.initWorkOrder();
               // create the object for now, but we don't store it until user decides to include it in WO
               orderWoItem.properties.woId = woId;
               orderWoItem.properties.domain = 0;
               orderWoItem.properties.order = newOrd.properties;
               orderWoItem.properties.order.id = newOrd.id;
               orderWoItem.properties.select = 'delay';
               that.createViewForOrder(orderWoItem);
               that.changedOrders.push({
                 id: Math.round(Math.random() * 1000000),  // just for ng-repeat uniqueness
                 reason: 'אירוע חדש',
                 action: 'new',
                 woItem: orderWoItem,
                 isIncludeInWo: true,
                 items: diffItems
               });
             });
            }
         });
     };

     this.createViewForOrder = function(woi) {
       woi.view = {};
       woi.view.orderStatus = lov.orderStatuses.filter(function(os) {
         return os.id === woi.properties.order.orderStatus;
       })[0];
       woi.view.customer = customers.filter(function(c) {
         return c.id === woi.properties.order.customer;
       })[0].properties;
       if (woi.properties.order.color) {
         woi.view.color = colors.filter(function (color) {
           return color.tId === woi.properties.order.color;
         })[0];
       }
     };

     this.createViewForDish = function (woi) {
       woi.view = {};
       woi.view.orderQuant = []; // create array of order quantities for detailed menu item view
       for (var i = 0; i < that.woOrders.length; i++) {  // initialize to all zero quantity
         woi.view.orderQuant[i] = {
           id: that.woOrders[i].id,
           originalQuantity: -1,
           quantity: 0,
           orderStatus: that.woOrders[i].view ? that.woOrders[i].view.orderStatus : undefined,
           status: that.woOrders[i].properties.status
         };
       }
       woi.properties.backTrace.forEach(function(bt) {
         woi.view.orderQuant.forEach(function(oq) {
           if (oq.id === bt.id) {
             oq.originalQuantity = bt.originalQuantity;
             oq.quantity = bt.quantity;
             oq.status = bt.status;
           }
         });
       });
     };

     this.createViewForPrep = function (woi) {
       woi.view = {};
       this.createPrepDishView(woi);
       this.createPrepOrderView(woi);
     };

     this.createViewForActionOrProduct = function (woi,targetDomain) {
       woi.view = {};
       if (targetDomain === 4) {
         this.createActionsPrepsView(woi);
       }
       this.createProductsAndActionsOrderView(woi);
     }

     this.createView = function () {
       for (var domain=0;domain<5;domain++) {
         if (that.woIndex.properties.domainStatus[domain]) {
           that.workOrder.forEach(function (woi) {
             if (woi.properties.domain === domain) {
               woi.view = {};
               switch (domain) {
                 case 0:
                   that.createViewForOrder(woi);
                   break;
                 case 1:
                   that.createViewForDish(woi);
                   break;
                 case 2:
                   that.createViewForPrep(woi);
                   break;
                 case 3:
                 case 4:
                   that.createViewForActionOrProduct(woi, domain);
                   break;
               }
             }
           })
         }
       }
     };

     // setup list of workOrders to compare current woId against
     this.setupBaseWoIndexes = function() {
       this.baseWoIndexes = this.woIndexes.filter(function(woIndex) {
         return !woIndex.properties.isQuery && woIndex.properties.woId !== woId;
       });
     };

    this.switchWorkOrders = function () {
      woId = this.woIndex.properties.woId;
      this.setupBaseWoIndexes();
       this.isProcessing = true;
       this.processMsg = 'טוען פקודת עבודה';
       api.queryWorkOrder(woId)
        .then(function(wo) {
          that.workOrder = wo;
          that.createSmallOrderView();
          that.createView();
          that.orderView = [];
          that.splitWorkOrder();
          that.checkDiff()
            .then(function() {
              if (that.changedOrders.length) {
                that.isActiveTab = [false, false, false, false, false, true]; // show diff tab
              } else {
                that.isActiveTab = [false, true, false, false, false, false]; // show menu items tab
              }
              that.isProcessing = false;
              that.isIncludeStock[2] = true;
              that.isIncludeStock[3] = true;
              that.isIncludeStock[4] = true;
            });
        });
    };

    this.compareItems = function (newItems, oldItems) {
      var reason, action;
      var diffList = [];
      newItems.forEach(function(newItem) {
        if (newItem.category.type < 3) {
          var temp = oldItems.filter(function (it) {
            return it.index === newItem.index;
          });
          if (temp.length) {
            var oldItem = temp[0];
            var isDiff = false;
            oldItem.isVisited = true;
            if (newItem.catalogId !== oldItem.catalogId) {
              alert('שינוי לא סביר של פריט: ' + oldItem.productName + ' ל ' + newItem.productName);
            }
            if (newItem.quantity !== oldItem.quantity) {
              isDiff = true;
              reason = 'כמות';
              action = 'update';
            } else {
             if (newItem.personalAdjustment !== oldItem.personalAdjustment) {
                isDiff = true;
                reason = 'התאמה אישית';
                action = 'update';
              }
            }
          } else { // added item
            isDiff = true;
            reason = 'נוסף';
            action = 'new';
            oldItem = {};
          }
          if (isDiff) {
            diffList.push({
              newItem: newItem,
              oldItem: oldItem,
              reason: reason,
              action: action
            })
          }
        }
      });
      oldItems.forEach(function(oldItem) {
        if (!oldItem.isVisited) {
          if (oldItem.category.type < 3) {
            diffList.push({
              newItem: oldItem,  // for view: always use newItem for item's details
              oldItem: oldItem,
              reason: 'בוטל',
              action: 'delete'
            })
          }
        }
      });
      return diffList;
    };

    // main block

    var that = this;
    this.isProcessing = true;
    this.processMsg = 'טוען פקודת עבודה';
    this.isOrderColors = config.isOrderColors;
    this.isOrderNumbers = config.isOrderNumbers;
    this.catalog = catalog;
    this.domains = lov.domains;
    this.woIndexes = woIndexes;
    this.woIndex = this.woIndexes.filter(function(index) {
      return index.properties.isDefault;
    })[0];
    this.colors = colors.map(function(color) {
      color.style = {
        'color': color.fontColor,
        'background-color': color.backColor
      };
      return  color;
    });
    this.fromDate = new Date(dater.today());
    this.toDate = new Date(dater.today());
    this.fromDate.setMonth(this.fromDate.getMonth()-1);
    this.toDate.setDate(this.toDate.getDate()-1);
    this.horizonDate = orderService.horizonDate();
    this.isCompareActive = false;
    this.baseWoIndex = undefined;
    this.targetWoIndex = undefined;
    this.switchWorkOrders();
  });
