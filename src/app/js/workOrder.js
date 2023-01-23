'use strict';

/* Controllers */
angular.module('myApp')
  .controller('WorkOrderCtrl', function (api, $state, $filter, $modal, $q, $rootScope,
                                         lov, config, catalog, allCategories, measurementUnits, colors, dater,
                                         customers, woIndexes) {


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
          var prevDomain = domain === 4 ? 2 : domain - 1;
          if (domain === 1 || this.woIndex.properties.domainStatus[prevDomain]) {
            this.createWorkOrderDomain(domain);
          }
        }
  };

    this.setShowAll = function(domain) {
      var that = this;
      this.hierarchicalWorkOrder[domain].categories.forEach(function(cat) {
        cat.isShow = that.hierarchicalWorkOrder[domain].isShowAll;
      });
    };

    this.destroyWorkOrderDomains = function (domain) {
      var that = this;
      var woItemsToDelete = this.workOrder.filter(function (wo) {
        // for products domain, don't delete actions
        return domain===3 ? (wo.properties.domain === domain) : (wo.properties.domain >= domain);
      });
      this.isProcessing = true;
      return api.deleteObjects(woItemsToDelete)
        .then(function () {
          that.isProcessing = false;
        }, function () {
          alert('workOrder multiple delete failed');
          that.isProcessing = false;
        });
    };

/*
    this.createOrderItems = function () {
      var workItem;
      var orderInd;
      var workItemInd;
      var that = this;
      this.workOrder.forEach(function(inWorkOrderItem) {
        if (inWorkOrderItem.properties.domain === 0) {
          var items =
            inWorkOrderItem.properties.order.quotes[inWorkOrderItem.properties.order.activeQuote].items;
          items.forEach(function(item) {
            if (item.category.type < 3) {  // exclude non food items
              if (item.isDescChanged && item.isCosmeticChange) {  // if only cosmetic change, ignore it for work order
                item.isDescChanged = false;
              }
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
                  !item.isDescChanged && !workItem.properties.isDescChanged &&
                  workItem.properties.catalogId === item.catalogId) {
                  workItemInd = ind;
                }
              });
              if (workItemInd) {  // item already in list, just add quantity
                workItem = that.workOrder[workItemInd];
                workItem.properties.quantity += item.quantity;
                if (inWorkOrderItem.properties.order.orderStatus === 2) {
                  workItem.properties.notFinalQuantity += item.quantity;
                }
                workItem.properties.backTrace.push({
                  id: inWorkOrderItem.id,
                  domain: 0,
                  quantity: item.quantity
                });
                that.woOrders.forEach(function (o, i) {
                  if (o.id === inWorkOrderItem.id) {
                    orderInd = i;
                  }
                });
                workItem.properties.orderQuant[orderInd].quantity += item.quantity;
              } else { // create new item
                workItem = api.initWorkOrder();
                workItem.properties.woId = woId;
                workItem.properties.catalogId = item.catalogId;
                workItem.properties.productName = item.productName;
                workItem.properties.isDescChanged = item.isDescChanged;
                if (item.isDescChanged) {
                  workItem.properties.productDescription =
                    // has to refer both to boolean and text field
                    // user might change status of description change after entering text
                    // user might also leave text empty
                    // in both cases, use changed productDescription
                    (item.isKitchenRemark && item.kitchenRemark) ?
                      item.kitchenRemark : item.productDescription;
                }
                workItem.properties.quantity = item.quantity;
                workItem.properties.quantityForToday = 0;
                if (inWorkOrderItem.properties.order.orderStatus === 2) {
                  workItem.properties.notFinalQuantity = item.quantity;
                }
                workItem.properties.category = item.category;
                workItem.properties.domain = 1;
                workItem.properties.measurementUnit = item.measurementUnit;
                workItem.properties.backTrace = [{
                  id: inWorkOrderItem.id,
                  domain: 0,
                  quantity: item.quantity
                }];
                workItem.properties.orderQuant = []; // create array of order quantities for detailed menu item view
                for (var i = 0; i < that.woOrders.length; i++) {  // initialize to all zero quantity
                  workItem.properties.orderQuant[i] = {
                    id: that.woOrders[i].id,    //id needed only for uniqueness of ng-repeat
                    quantity: 0,
                    status: that.woOrders[i].properties.order.orderStatus
                  };
                }
                that.woOrders.forEach(function (o, i) {
                  if (o.id === inWorkOrderItem.id) {
                    orderInd = i;
                  }
                });
                workItem.properties.orderQuant[orderInd].quantity = item.quantity;
                if (item.isDescChanged) {
                  workItem.properties.orderQuant[orderInd].productDescription =
                    workItem.properties.productDescription;
                }
                that.workOrder.push(workItem);
              }
            }
          });
        }
      });
    };
*/
    this.createOrderItems = function () {
      var workItem;
      var orderInd;
      var workItemInd;
      var that = this;
      this.changedOrders.forEach(function(changedOrder) {
        if (changedOrder.action === 'recalc') {
          var items =
        changedOrder.woItem.properties.order.quotes[changedOrder.woItem.properties.order.activeQuote].items;
          items.forEach(function (item) {
            if (item.category.type < 3) {  // exclude non food items
              if (item.isDescChanged && item.isCosmeticChange) {  // if only cosmetic change, ignore it for work order
                item.isDescChanged = false;
              }
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
                  !item.isDescChanged && !workItem.properties.isDescChanged &&
                  workItem.properties.catalogId === item.catalogId) {
                  workItemInd = ind;
                }
              });
              if (workItemInd) {  // item already in list, just add quantity
                workItem = that.workOrder[workItemInd];
                workItem.properties.quantity += item.quantity;
                if (changedOrder.woItem.properties.order.orderStatus === 2) {
                  workItem.properties.notFinalQuantity += item.quantity;
                }
                workItem.properties.backTrace.push({
                  id: changedOrder.woItem.id,
                  domain: 0,
                  quantity: item.quantity
                });
              } else { // create new item
                workItem = api.initWorkOrder();
                workItem.properties.woId = woId;
                workItem.properties.catalogId = item.catalogId;
                workItem.properties.productName = item.productName;
                workItem.properties.isDescChanged = item.isDescChanged;
                if (item.isDescChanged) {
                  workItem.properties.productDescription =
                    // has to refer both to boolean and text field
                    // user might change status of description change after entering text
                    // user might also leave text empty
                    // in both cases, use changed productDescription
                    (item.isKitchenRemark && item.kitchenRemark) ?
                      item.kitchenRemark : item.productDescription;
                }
                workItem.properties.quantity = item.quantity;
                if (changedOrder.woItem.properties.order.orderStatus === 2) {
                  workItem.properties.notFinalQuantity = item.quantity;
                }
                workItem.properties.category = item.category;
                workItem.properties.domain = 1;
                workItem.properties.measurementUnit = item.measurementUnit;
                workItem.properties.select = 'unknown';
                workItem.properties.backTrace = [{
                  id: changedOrder.woItem.id,
                  domain: 0,
                  quantity: item.quantity
                }];
                that.workOrder.push(workItem);
              }
              that.createViewForMenuItem(workItem);
            }
          });
        }
      });
    };

    // create targetDomain records based on lower domain components
  this.createComponents = function (targetDomain) {
      var workItemInd;
      var workItem;
      var that = this;
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
                    quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity,
                    quantityForToday: inWorkItem.domain===2 || inWorkItem.domain === 1 ? 0 :
                      inWorkItem.quantityForToday * component.quantity / inCatItem.productionQuantity,
                    quantityDone: inWorkItem.domain===2 || inWorkItem.domain === 1 ? 0 :
                      inWorkItem.quantityDone * component.quantity / inCatItem.productionQuantity
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
                    quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity,
                    quantityForToday: inWorkItem.domain===2 ? 0 :
                      inWorkItem.quantityForToday * component.quantity / inCatItem.productionQuantity,
                    quantityDone: inWorkItem.domain===2 ? 0 :
                      inWorkItem.quantityDone * component.quantity / inCatItem.productionQuantity,
                    select: targetDomain===2 ? "delay" : inWorkItem.select
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

    // create an array of menu items in which it appears for detailed listing
    this.createPrepMenuItemView = function(currentPrep) {
      var that = this;
         currentPrep.view.menuItems = [];
          var remarkCnt = 0;
          currentPrep.properties.backTrace.forEach(function (currentBackTrace) {
            var currentMenuItem = {};
            currentMenuItem.id = currentBackTrace.id;
            currentMenuItem.quantity = currentBackTrace.quantity;
            currentMenuItem.quantityForToday = 0;
            currentMenuItem.quantityDone = 0;
            var originalMenuItem = that.workOrder.filter(function (wo) {
              return wo.id === currentBackTrace.id;
            })[0];
            currentMenuItem.productName = originalMenuItem.properties.productName;
            if (originalMenuItem.properties.isDescChanged) {
              currentMenuItem.isRemark = true;
              currentMenuItem.remarkNo = ++remarkCnt;
              currentMenuItem.remarkText = originalMenuItem.properties.productDescription;
            }
            currentPrep.view.menuItems.push(currentMenuItem);
          });
    };

    // create an array of orders in which menuItems containing this preparation appear.
    // each entry contains an array of menuItems.
    this.createPrepOrderView = function (currentPrep) {
      var that = this;
       currentPrep.view.orders = [];
        currentPrep.properties.backTrace.forEach(function (prepBackTrace) {
          var originalMenuItem = that.workOrder.filter(function(mi) {
            return mi.id === prepBackTrace.id;
          })[0];
          var viewMenuItemIndex;
          var t = currentPrep.view.menuItems.filter(function(mi,ind) {
            if (mi.id === originalMenuItem.id) {
              viewMenuItemIndex = ind;
              return true;
            } else {
              return false;
            }
          })[0];
          var menuItemCatalog = that.catalog.filter(function(cat) {
            return cat.id === originalMenuItem.properties.catalogId;
          })[0];
          var prepCatalog = that.catalog.filter(function(cat) {
            return cat.id === currentPrep.properties.catalogId;
          })[0];
          var prepComponent = menuItemCatalog.properties.components.filter(function(comp) {
            return comp.id === prepCatalog.id;
          })[0];
           originalMenuItem.properties.backTrace.forEach(function(miBackTrace) {
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
                customer: originalOrder.view.customer.firstName,
                date: originalOrder.properties.order.eventDate,
                day: that.dayName(originalOrder.properties.order.eventDate),
                time: originalOrder.properties.order.eventTime,
                totalQuantity: 0,
                menuItems: [],
                select: 'delay'
              };
              currentPrep.view.menuItems.forEach(function(mu,ind) {
                orderObj.menuItems[ind] = {
                  seq: ind,
                  quantity: 0
                }
              });
              currentPrep.view.orders.push(orderObj);
              currentOrder = currentPrep.view.orders[currentPrep.view.orders.length-1];
            } else {
              currentOrder = temp[0];
           }
            var prepQuantity = miBackTrace.quantity;
            currentOrder.menuItems[viewMenuItemIndex].quantity +=
              prepQuantity * prepComponent.quantity / menuItemCatalog.properties.productionQuantity;
            currentOrder.totalQuantity +=
              prepQuantity * prepComponent.quantity / menuItemCatalog.properties.productionQuantity;
          });
        });
        // update select value based on prep item
      currentPrep.view.orders.forEach(function(ord) {
        var matchingOrder = currentPrep.properties.orders.filter(function(mOrd) {
          return mOrd.id === ord.id;
        })[0];
        ord.select = matchingOrder.select;
      });
      currentPrep.view.orders = currentPrep.view.orders.filter(function(ord) {
        return ord.totalQuantity > 0;
      });
      // update quantityForToday and quantityDone of menuItem array based on order's select values
      currentPrep.view.menuItems.forEach(function(menuItem, ind) {
        currentPrep.view.orders.forEach(function(ord) {
          if (ord.select === 'today') {
            menuItem.quantityForToday += ord.menuItems[ind].quantity;
          } else if (ord.select === 'done') {
            menuItem.quantityDone += ord.menuItems[ind].quantity;
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

    // find item's breakdown to individual orders, based on the prep order view it comes from
    this.createproductsAndActionsOrderView = function(currentItem,targetDomain) {
    var that = this;
      if (currentItem.properties.domain === targetDomain) {
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
              alert('המצרך '+itemCatalogItem.properties.productName+
                ' הוסר ממרכיביה של ההכנה '+prepCatalogItem.properties.productName+
                '. בצע חישוב מחדש של מצרכים');
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
                    menuItems: [],
                    select: prepOrder.select
                  };
                  currentItem.view.orders.push(currentOrder);
                } else {
                  currentOrder = temp[0];
                }
                currentOrder.totalQuantity +=
                  prepOrder.totalQuantity * component.quantity / prepCatalogItem.properties.productionQuantity;
              });
            }
          } else if (itemBackTrace.domain === 1) { // product item directly under menuItem
            var originalMenuItem = that.workOrder.filter(function (mi) {
              return mi.id === itemBackTrace.id;
            })[0];
            var miCatalogItem = that.catalog.filter(function (cat) {
              return cat.id === originalMenuItem.properties.catalogId;
            })[0];
            component = miCatalogItem.properties.components.filter(function (comp) {
              return comp.id === itemCatalogItem.id;
            })[0];
            if (!component) {
              alert('המצרך '+itemCatalogItem.properties.productName+
                          ' הוסר ממרכיביה של המנה '+miCatalogItem.properties.productName+
                          '. בצע חישוב מחדש של מצרכים');
            } else {
              originalMenuItem.properties.backTrace.forEach(function (bt) {
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
                    menuItems: [],
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
      }
    };

    // decide if item will be shown
    this.isShowItem = function (woItem) {
      var that = this;
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
      var that = this;
      var temp = cat.list.filter(function(woItem) {
        return that.isShowItem(woItem);
      });
      return temp.length;
    };

     // reset detailed view for today only, otherwise turn it on for mixed preps
    // also check if there are remarks for today's menuItems
    this.setPrepsTodayOnly = function () {
      var that = this;
      if (this.isShowTodayOnly[2]) {
        this.isOrderFilter = false;  // turn off order selection table
        this.isShowDone[2] = false;
        this.workOrder.forEach(function(woItem) {
          if (woItem.properties.domain === 2) {
            woItem.isShowDetails = that.isShowDetails[that.domain];
            woItem.isRemarkForToday = false;
            woItem.view.menuItems.forEach(function (mi) {
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
      var that = this;
      if (this.isShowDone[2]) {

      } else {
        this.workOrder.forEach(function(woItem) {
          if (woItem.properties.domain === 2) {
            woItem.isAnyRemarkNotDone = false;
            woItem.view.menuItems.forEach(function (mi) {
              if (mi.isRemark && mi.quantityDone===0) {
                woItem.isAnyRemarkNotDone = true;
              }
            })
          }
        });
      }
    };

    // sum quantity of all orders marked for today or done and of each menuItem they include
   this.computeSelectQuantities = function (woItem) {
      var quantToday = 0;
      var quantDone = 0;
      woItem.view.menuItems.forEach(function (mi0) {
        mi0.quantityForToday = 0;
        mi0.quantityDone = 0;
      });
      woItem.view.orders.forEach(function (ord) {
        if (ord.select === 'today') {
          quantToday += ord.totalQuantity;
          ord.menuItems.forEach(function(mi) {
            woItem.view.menuItems[mi.seq].quantityForToday += mi.quantity;
          });
        } else if (ord.select === 'done') {
          quantDone += ord.totalQuantity;
          ord.menuItems.forEach(function(mi) {
            woItem.view.menuItems[mi.seq].quantityDone += mi.quantity;
          });
        }
      });
     woItem.properties.quantityForToday = quantToday;
     woItem.properties.quantityDone = quantDone;
    };

    // propagate selection to all preps in domain
    this.setGlobalSelect = function() {
      var that = this;
      this.workOrder.forEach(function(woItem) {
        if (woItem.properties.domain === 0) {
          woItem.properties.select = that.select;
          woItem.properties.prepScope = 'all';
        } else if (woItem.properties.domain === 2) {
          woItem.properties.select = that.select;
          that.computeSelectQuantities(woItem);
          that.setPrepSelect(woItem, false);
        }
      });
    };

    // propogate selection for event to all its occurances in preps
    this.setOrderSelect = function(order) {
      var that = this;
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

    // "select" of order in preps is set according to 3 factors:
    // a. prepScope of order set now by user ("all", "prep", "done");
    // b. select value of order in prep ("delay", "today", "done");
    // c. is prep considered "prep" or "service" as determined by its category (type===11 => service).
    //
    // The following table depicts decision rules:
    // +--------+---------++-------------------------+-----------------------------------------------------+
    // |  prep  | prep    || order prepScope seting  |                                                     |
    // +  order |category ++-------+-------+---------+    remarks                                          |
    // | select | type    ||  all  | prep  | service |                                                     |
    // +--------+---------++-------+-------+---------+-----------------------------------------------------+
    // |        | prep    || today | today | N/C     |  select relevant preps for today                    |
    // | delay  +---------++-------+-------+---------|  leave irrelevant ones unchanged                    |
    // |        | service || today | N/C   | today   |                                                     |
    // +--------+---------++-------+-------+---------+-----------------------------------------------------+
    // |        | prep    || N/C   | N/C   | done    | selecting service for today implies preps are done  |
    // | today  +---------++-------+-------+---------|                                                     |
    // |        | service || N/C   | delay | N/C     | selecting prep for today implies service is delayed |
    // +--------+---------++-------+-------+---------+-----------------------------------------------------+
    // |        | prep    || N/C   | N/C   | N/C     |   if prep is done, don't change it                  |
    // | done   +---------++-------+-------+---------|                                                     |
    // |        | service || N/C   | N/C   | N/C     |                                                     |
    // +--------+---------++-------+-------+---------+-----------------------------------------------------+
    //
    //  this logic changes the select value of the order within the prep. the select value of the prep
    //  itself is changed, if necessary by calling setPrepOrderSelect function

    // propogates change of an order prepScope to all occurances of that order in preps
    this.setOrderPrepScope = function (woItem) {
      var that = this;
      api.saveObj(woItem);
      this.workOrder.forEach(function (woi) {
        var wo = woi.properties;
        if (wo.domain === 2) {
            woi.view.orders.forEach(function (ord) {
            if (ord.id === woItem.id) {
               if (ord.select === 'delay') {
                 if (woItem.properties.prepScope === 'all') {
                   ord.select = 'today'
                 } else if (woItem.properties.prepScope === 'prep') {
                   if (wo.category.type !== 11) { // not service
                     ord.select = 'today';
                   }
                 } else { // order prepscope is 'service'
                   if (wo.category.type === 11) {
                     ord.select = 'today';
                   }
                 }
               } else if (ord.select === 'today') {
                 if (woItem.properties.prepScope === 'prep') {
                   if (wo.category.type === 11) {
                     ord.select = 'delay'; // if prep was chosen, delay service preps
                   }
                 } else if (woItem.properties.prepScope === 'service') {
                   if (wo.category.type !== 11) {
                     ord.select = 'done'; // if service was chosen, assume preps are done
                   }
                 }
               }
            }
          });
          that.computeSelectQuantities(woi);
          that.setPrepOrderSelect(woi,woItem);
        }
      });
    };

     this.createOrderView = function () {
      var that = this;
      this.orderView = [];
      api.queryFutureOrders()
        .then(function (futureOrders) {
          futureOrders.forEach(function(order) {
            if (order.properties.orderStatus > 1 && order.properties.orderStatus < 6) {
              var viewItem = api.initWorkOrder();
              // create the object for now, but we don't store it until user decides to include it in WO
              viewItem.properties.woId = woId;
              viewItem.properties.domain = 0;
              viewItem.properties.order = order.properties;
              viewItem.properties.order.id = order.id;
              viewItem.properties.prepScope = 'all';
              viewItem.properties.select = 'delay';
              viewItem.isInWorkOrder = false;
              that.createViewForOrder(viewItem);
              that.orderView.push(viewItem);
            }
          });
          console.log('orderView before save:');
          console.log(that.orderView);
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
          // that.orderView = that.orderView.filter(function (ov) {
          //   return !ov.isToBeTemporarilyDeleted;
          // });
          api.saveObjects(ordersToSave)
            .then(function (ov) {
              console.log('orders saved:');
              console.log(ov);
                  ov.forEach(function(o) {
                    that.workOrder.push(o);
                    that.orderView.push(o);
                  });
              console.log('orderView after save:');
              console.log(that.orderView);
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
                });
        });
    };

    this.queryOrders = function () {
      var that = this;
      this.isProcessing = true;
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
      var that = this;
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

    this.createNewWorkOrder = function (isAutoDetect) {
      var that = this;
      var ackDelModal = $modal.open({
        templateUrl: isAutoDetect ? 'app/partials/workOrder/ackAutoDelete.html' : 'app/partials/workOrder/ackDelete.html',
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


    this.ignoreWorkOrderChanges = function () {
      that.isWoChanged = false;
      that.isWoMajorChange = false;
      that.isActiveTab = [false, true, false, false, false, false]; // show menu items tab
    };

    this.updateWorkOrder = function () {
      var that = this;
      //  phase 1: update orders
      var ordersToCreate = [];
      var ordersToUpdate = [];
      var ordersToDelete = [];
      this.changedOrders.forEach(function(changedOrder, ind) {
        if (changedOrder.action === 'delete') {
          ordersToDelete.push(changedOrder.woItem);
          that.workOrder = that.workOrder.filter(function(wo) {
            return wo.id !== changedOrder.woItem.id;
          });
        } else if (changedOrder.action === 'new') {
          if (changedOrder.isIncludeInWo) {
            ordersToCreate.push(changedOrder.woItem);
          }
        } else if (changedOrder.action === 'update') {
          ordersToUpdate.push(changedOrder.woItem);
        }
      });
      api.saveObjects(ordersToCreate)
        .then(function (orders) {
          if (ordersToCreate.length) {
            console.log(ordersToCreate.length+' orders created:');
            console.log(orders);
          }
          orders.forEach(function(ord) {
            that.workOrder.push(ord);
          });
          api.saveObjects(ordersToUpdate)
            .then(function() {
              if (ordersToUpdate.length) {
                console.log(ordersToUpdate.length+' orders updated:');
                console.log(ordersToUpdate);
              }
              api.deleteObjects(ordersToDelete)
                .then(function() {
                  if (ordersToDelete.length) {
                    console.log(ordersToDelete.length+' orders deleted:');
                    console.log(ordersToDelete);
                  }

                  //phase 2: update menu items
                  var menuItemsToCreate = [];
                  var menuItemsToUpdate = [];
                  var menuItemsToDelete = [];
                  that.changedOrders.forEach(function(changedOrder) {
                    if (changedOrder.action === 'delete' || changedOrder.action === 'recalc') {
                      // delete all mis for this order
                      that.workOrder.forEach(function (woi) {
                        var wo = woi.properties;
                        if (wo.domain === 1) {
                         wo.backTrace.forEach(function(bt, ind) {
                           if (bt.id === changedOrder.woItem.id) {
                             if (wo.backTrace.length === 1) { // mi only in this order, just delete it
                               menuItemsToDelete.push(woi);
                               woi.isToDelete = true;
                             } else {
                               wo.quantity -= bt.quantity;
                               if (changedOrder.woItem.properties.order.orderStatus === 2) {
                                 wo.notFinalQuantity -= bt.quantity;
                               }
                               //todo: handle notFinalQuantity when order status changes
                               bt.splice(ind,1);
                               menuItemsToUpdate.push(woi);
                             }
                           }
                         });
                        }
                      });
                    }
                    if (changedOrder.action === 'new' || changedOrder.action === 'recalc') {
                      // add all mis for this order
                    }
                    if (changedOrder.action === 'itemChange') {
                      // handle specific mis in order
                    }
                  });
                });
          });
      });
    };

    this.saveWorkOrder = function (domain) {
      var that = this;
      var woItemsToSave = this.workOrder.filter(function (woi) {
        return woi.properties.domain === domain;
      });
      this.isProcessing = true;
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
      var that = this;
      this.hierarchicalWorkOrder = [];
      for (var d = 1; d < 5; d++) {
        this.hierarchicalWorkOrder[d] = {
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
          woi.view.menuItems.forEach(function(mi) {
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
                isShow: true,
                list: []
              });
              catInd = 0;
            }
          that.hierarchicalWorkOrder[wo.domain].categories[catInd].list.push(woi); //add wo item to proper category list
        }
      });

      // sort categories of each domain and items within category
      for (d = 1; d < 5; d++) {
        this.hierarchicalWorkOrder[d].categories.sort(function (a, b) {
          return a.category.order - b.category.order;
        });
        for (var c = 0; c < this.hierarchicalWorkOrder[d].categories.length; c++) {
          this.hierarchicalWorkOrder[d].categories[c].list.sort(function (a, b) {
            if (a.properties.productName > b.properties.productName) {
              return 1;
            } else if (a.properties.productName < b.properties.productName){
              return -1;
            } else if (!a.properties.isDescChanged && b.properties.isDescChanged) {
              return -1;
            }else if (a.properties.isDescChanged && !b.properties.isDescChanged) {
              return 1;
            } else {
              return 0;
            }
          });
        }
      }

      // for order items domain only, add list of changed product descriptions per category
      this.hierarchicalWorkOrder[1].categories.forEach(function(cat) {
        cat.changedDescriptions = [];
        var descCnt = 0;
        cat.list.forEach(function(woItem) {
          if (woItem.properties.isDescChanged){
            cat.changedDescriptions.push({
              desc: woItem.properties.productDescription,
              cnt: ++descCnt
            });
            woItem.descCnt = descCnt;
          }
        });
      });
      };

    this.setGlobalDetail = function() {
      var that = this;
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
      var that = this;
      category.list.forEach(function(woi) {
        if (woi.properties.domain === 2) {
          if (that.isShowTodayOnly[2] || woi.properties.select !== 'mix') {
            woi.isShowDetails = category.isShowDetails;
          }
        } else {
          woi.isShowDetails = category.isShowDetails;
        }
      });
    };

    // create work order items for specified domain from lower domain itens
    this.createWorkOrderDomain = function (targetDomain) {
      var that = this;
      if (targetDomain===1) { // clicking <compute menuItems> signifies that order selection is complete
        this.woIndex.properties.domainStatus[0] = true;
        api.saveObj(this.woIndex);
      }
      // destroy existing work order items of target and higher domains
      this.destroyWorkOrderDomains(targetDomain)
        .then(function () {
        that.workOrder = that.workOrder.filter(function (wo) {
          // for products domain, include actions
          return targetDomain===3 ?
            (wo.properties.domain === 4 || wo.properties.domain < targetDomain) :
            (wo.properties.domain < targetDomain);
        });
        that.changedOrders = that.workOrder.filter(function(ord) {
          return ord.properties.domain === 0;
        }).map(function(woOrd) {
         return {
           id: Math.round(Math.random()*1000000),  // just for ng-repeat uniqueness
           reason: 'חדש',
            action: 'recalc',
            woItem: woOrd,
            items: []
         }
        });
        if (targetDomain === 1) {
          that.createOrderItems();
        } else {
          that.createComponents(targetDomain);
        }
        // if (targetDomain === 2) {
        //   that.createPrepMenuItemView();
        //   that.createPrepOrderView();
        // } else if (targetDomain === 3 || targetDomain === 4) {
        //   that.createproductsAndActionsOrderView(targetDomain);
        // }
        that.saveWorkOrder(targetDomain)
          .then(function () {
            that.splitWorkOrder();
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
            api.saveObj(that.woIndex);
            that.isIncludeStock[targetDomain] = true;
          });
      });
    };

    this.saveWI = function (woItem) {
      return api.saveObj(woItem);
    };

    this.setQuantity = function (woItem, domain) {
      this.saveWI (woItem)
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
      var that = this;
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

     this.preparationsEndDay = function () {
      var that = this;
      var ackEndDayModal = $modal.open({
        templateUrl: 'app/partials/workOrder/ackEndDay.html',
        controller: 'AckEndDayCtrl as ackEndDayModel',
        resolve: {
          todaysPreps: function () {
            return that.workOrder.filter(function(wo) {
              return wo.properties.domain===2 && wo.properties.isForToday;
            });
          }
        },
        size: 'lg'
      });

      ackEndDayModal.result.then(function (isEndDay) {
        if (isEndDay) {
          var saveList = [];
          var deleteList = [];
          for (var i=0;i<that.workOrder.length;i++) {
            var wo = that.workOrder[i];
            if (wo.properties.domain===2 && wo.properties.isForToday) {
              if (wo.properties.quantityForToday >= wo.properties.quantity) {
                deleteList.push(wo);
                wo.isToDelete = true;
              } else {
                wo.properties.quantity -= wo.properties.quantityForToday;
                wo.delAttributes = {quantityForToday: true}; // set to undefined on save
                wo.properties.isForToday = false;
                saveList.push(wo);
              }
            }
          }
          api.saveObjects(saveList)
            .then(function () {
              api.deleteObjects(deleteList)
                .then(function () {
                  that.workOrder = that.workOrder.filter (function(wo) {
                    return !wo.isToDelete;
                  });
                  that.splitWorkOrder();
                  that.woIndex.properties.domainStatus[3] = false;
                  api.saveObj(that.woIndex);
                });
            });
        }
      });
     };

    // check if any order in wo has passed or has been changed since last wo creation
     this.checkDiff = function () {
       that.isWoChanged = false;
       that.isWoMajorChange = false;
       that.changedOrders = [];
       var reason, action;
       var diffItems = [];
       return api.queryFutureOrders()
         .then(function(futureOrders) {
           that.woOrders.forEach(function (woOrder) {
             var ord = futureOrders.filter(function (futureOrder) {
               return futureOrder.properties.number === woOrder.properties.order.number;
             })[0];
             if (!ord) { // order occured in the past
               that.isWoChanged = true;
               that.isWoMajorChange = true;
               that.changedOrders.push({
                 id: Math.round(Math.random() * 1000000),  // just for ng-repeat uniqueness
                 reason: 'עבר',
                 action: 'delete',
                 woItem: woOrder,
                 items: diffItems
               });
             } else {
               ord.isInWo = true;
               if (ord.updatedAt > that.woIndex.updatedAt) { // order updated
                 that.isWoChanged = true;
                 if (ord.properties.orderStatus === 6 || ord.properties.orderStatus < 2) {
                   that.isWoMajorChange = true;
                   woOrder.properties.order = ord.properties;
                   woOrder.properties.order.id = ord.id;
                   reason = 'בוטל';
                   action = 'delete';
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
                       angular.copy(ord.properties.quotes[ord.properties.activeQuote].items),
                       angular.copy(woOrder.properties.order.quotes[woOrder.properties.order.activeQuote].items)
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
                       woOrder.properties.order = ord.properties;
                       woOrder.properties.order.id = ord.id;
                       reason = 'שינוי אחר';
                       action = 'none';
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
           });
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
             orderWoItem.properties.prepScope = 'all';
             orderWoItem.properties.select = 'delay';
             that.createViewForOrder(orderWoItem);
             that.changedOrders.push({
               id: Math.round(Math.random() * 1000000),  // just for ng-repeat uniqueness
               reason: 'חדש',
               action: 'new',
               woItem: orderWoItem,
               isIncludeInWo: true,
               items: diffItems
             });
           });
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

     this.createViewForMenuItem = function (woi) {
       woi.view = {};
       woi.view.orderQuant = []; // create array of order quantities for detailed menu item view
       for (var i = 0; i < that.woOrders.length; i++) {  // initialize to all zero quantity
         woi.view.orderQuant[i] = {
           id: that.woOrders[i].id,
           quantity: 0,
           status: that.woOrders[i].view.orderStatus
         };
       }
       woi.properties.backTrace.forEach(function(bt) {
         woi.view.orderQuant.forEach(function(oq) {
           if (oq.id === bt.id) {
             oq.quantity = bt.quantity;
           }
         });
       });
     };

     this.createViewForPrep = function (woi) {
       woi.view = {};
       this.createPrepMenuItemView(woi);
       this.createPrepOrderView(woi);
     };

     this.createViewForActionOrProduct = function (woi,targetDomain) {
       woi.view = {};
       this.createproductsAndActionsOrderView(woi,targetDomain);
     }

     this.createView = function () {
       var that = this;
       for (var domain=0;domain<5;domain++) {
         that.workOrder.forEach(function(woi) {
           if (woi.properties.domain === domain) {
             woi.view = {};
             switch (domain) {
               case 0:
                 that.createViewForOrder(woi);
                 break;
               case 1:
                 that.createViewForMenuItem(woi);
                 break;
               case 2:
                 that.createViewForPrep(woi);
                 break;
               case 3:
               case 4:
                 that.createViewForActionOrProduct(woi,domain);
                 break;
             }
           }
         })
       }
     };

    this.switchWorkOrders = function () {
      var that = this;
      woId = this.woIndex.properties.woId;
       this.isProcessing = true;
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
      var that = this;
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
              var newDescChange = newItem.isKitchenRemark || newItem.isMajorChange;
              var oldDescChange = oldItem.isKitchenRemark || oldItem.isMajorChange;
              if (newDescChange !== oldDescChange ||
                (newDescChange && oldDescChange && (newItem.productDescription !== oldItem.productDescription) ||
                  newItem.isKitchenRemark != oldItem.isKitchenRemark)) {
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
    var horizon = [6,5,4,3,4,3,2];
    // Sunday-Wednsday -> horizon till Saturday; Thursday-Saturday -> horizon till Monday
    this.horizonDate = new Date(dater.today());
    this.horizonDate.setDate(this.horizonDate.getDate() + horizon[this.horizonDate.getDay()]);
    this.isShowDone[2] = true; //todo: maybe shd be false by default?
    this.isShowDone[3] = true;
    this.isShowDone[4] = true;
    this.switchWorkOrders();
  });
