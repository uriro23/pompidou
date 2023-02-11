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

    this.createMenuItemsDomain = function () {
      var that = this;
      this.workOrder.forEach(function(woItem) {
        if (woItem.properties.domain === 0) {
          that.createOrderItems(woItem, undefined, undefined);
        }
      });
    };

    this.createOrderItems = function (order, dishesToCreate, dishesToUpdate) {
      var that = this;
      var items = order.properties.order.quotes[order.properties.order.activeQuote].items;
      items.forEach(function(item) {
        if (item.category.type < 3) {
          that.createItem(order, item, dishesToCreate, dishesToUpdate);
        }
      });
    };


    this.createItem = function (order, item, dishesToCreate, dishesToUpdate) {
      var workItem;
      var orderInd;
      var workItemInd;
      var that = this;
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
        workItem.properties.backTrace.push({
          id: order.id,
          domain: 0,
          quantity: item.quantity
        });
        if (dishesToUpdate && !workItem.isNewItem) { // don't update items just created. it will cause dups
          dishesToUpdate.push(workItem);
        }
      } else { // create new item
        workItem = api.initWorkOrder();
        workItem.isNewItem = true;
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
        workItem.properties.category = item.category;
        workItem.properties.domain = 1;
        workItem.properties.measurementUnit = item.measurementUnit;
        workItem.properties.select = 'unknown';
        workItem.properties.backTrace = [{
          id: order.id,
          domain: 0,
          quantity: item.quantity
        }];
        workItem.deletedBackTrace = []; // needed in updatePreps
        that.workOrder.push(workItem);
        if (dishesToCreate) {
          dishesToCreate.push(workItem);
       }
      }
      that.createViewForMenuItem(workItem);
      return workItem;
    };

    // create targetDomain records based on lower domain components
  this.createComponentsDomain = function (targetDomain) {
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
            if (!originalMenuItem) {
              console.log('originalMenuItem missing for backTrace of '+currentPrep.properties.productName);
              console.log(currentPrep);
              console.log(currentBackTrace);
            }
            currentMenuItem.productName = originalMenuItem.properties.productName;
            if (originalMenuItem.properties.isDescChanged) {
              currentMenuItem.isRemark = true;
              currentMenuItem.remarkNo = ++remarkCnt;
              currentMenuItem.remarkText = originalMenuItem.properties.productDescription;
            }
            currentPrep.view.menuItems.push(currentMenuItem);
          });
    };

    // create an array of orders in which dishes containing this preparation appear.
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
          var dishComponent = menuItemCatalog.properties.components.filter(function(comp) {
            return comp.id === prepCatalog.id;
          })[0];
          if (!dishComponent) {
            alert('ההכנה '+prepCatalog.properties.productName+' אינה בין רכיבי המנה '+
                  menuItemCatalog.properties.productName+'. חשב מחדש את ההכנות');
            return;
          }
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
              prepQuantity * dishComponent.quantity / menuItemCatalog.properties.productionQuantity;
            currentOrder.totalQuantity +=
              prepQuantity * dishComponent.quantity / menuItemCatalog.properties.productionQuantity;
          });
        });
        // update select value based on prep item
      currentPrep.view.orders.forEach(function(ord) {
        var matchingOrder = currentPrep.properties.orders.filter(function(mOrd) {
          return mOrd.id === ord.id;
        })[0];
        ord.select = matchingOrder.select;
        ord.addedQuantity = matchingOrder.addedQuantity;
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

    // note: It would have been much more straightforward to update all item types together
    // following the changedOrders array only once.
    // However in order to update dishes, we need all the order records to be in place and
    // in order to update preps, we need all dish records to be in place
    // so we have to do the updates gradually (breath first).
    // Also, we can't delete items from workOrder array, before finishing all updates
    this.updateWorkOrder = function () {
      var that = this;
      this.updateOrders()
        .then(function() {
          that.updateDishes()
            .then(function() {
              that.updatePreps()
                .then(function() {
                  that.workOrder = that.workOrder.filter(function(woi) {
                    return !woi.isToDelete;
                  });
                  console.log('workOrder after splices:');
                  console.log(that.workOrder);
                  that.woIndex.properties.domainStatus[0] = true;
                  that.woIndex.properties.domainStatus[1] = true;
                  that.woIndex.properties.domainStatus[2] = true;
                  that.woIndex.properties.domainStatus[3] = false;
                  that.woIndex.properties.domainStatus[4] = false;
                  api.saveObj(that.woIndex);
                  that.createView();
                  that.splitWorkOrder();
                  that.isWoChanged = false;
                  that.changedOrders = [];
                  that.isActiveTab = [false, true, false, false, false, false]; // show menu items tab
                   console.log('update workOrder completed');
                });
            });
        });
    };

    this.updateOrders = function () {
      var that = this;
      //  phase 1: update orders
      var ordersToCreate = [];
      var ordersToUpdate = [];
      var ordersToDelete = [];
      this.changedOrders.forEach(function (changedOrder, ind) {
        if (changedOrder.action === 'delete') {
          ordersToDelete.push(changedOrder.woItem);
          that.workOrder = that.workOrder.filter(function (wo) {
            return wo.id !== changedOrder.woItem.id;
          });
        } else if (changedOrder.action === 'new') {
          if (changedOrder.isIncludeInWo) {
            ordersToCreate.push(changedOrder.woItem);
          }
        } else if (changedOrder.action === 'update' || changedOrder.action === 'itemChange') {
          ordersToUpdate.push(changedOrder.woItem);
        }
      });
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
          return api.saveObjects(ordersToUpdate)
            .then(function () {
              console.log(ordersToUpdate.length + ' orders updated');
              console.log(ordersToUpdate);
              return api.deleteObjects(ordersToDelete)
                .then(function () {
                  console.log(ordersToDelete.length + ' orders deleted');
                  console.log(ordersToDelete);
                  that.orderView = that.workOrder.filter(function(ord) {
                    return ord.properties.domain === 0 && !ord.isToDelete;
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
      var that = this;
      var dishesToCreate = [];
      var dishesToUpdate = [];
      var dishesToDelete = [];
      that.workOrder.forEach(function(woi) {
        if (woi.properties.domain === 1) {
          woi.deletedBackTrace = [];
        }
      });
       that.changedOrders.forEach(function(changedOrder) {
        if (changedOrder.action === 'delete' || changedOrder.action === 'recalc') {
          // delete/adjust all dishes for this order
          that.workOrder.forEach(function (dish) {
            if (dish.properties.domain === 1) {
              // backtrace entries to orders from which dish has been deleted will be saved here
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
        }
        if ((changedOrder.action === 'new' && changedOrder.isIncludeInWo) ||
             changedOrder.action === 'recalc') {
          // add all dishes for this order
          that.createOrderItems(changedOrder.woItem, dishesToCreate, dishesToUpdate);
        }
        if (changedOrder.action === 'itemChange') {
          // handle specific dish in order
          changedOrder.items.forEach(function(diffItem) {
            if (diffItem.action === 'delete' || diffItem.action === 'update') {
              var matchDishes = that.workOrder.filter(function(dish) {
                return dish.properties.domain === 1 &&
                   dish.properties.catalogId === diffItem.oldItem.catalogId &&
                   (Boolean(dish.properties.isDescChanged) === Boolean(diffItem.oldItem.isDescChanged)) &&
                   (!dish.properties.isDescChanged ||
                     dish.properties.productDescription === diffItem.oldItem.productDescription);
              });
              if (matchDishes.length === 0) {
                console.log('item to be updated / deleted not found in workOrder');
                console.log('order '+changedOrder.woItem.properties.order.number);
                console.log('item '+diffItem.oldItem.productName+', catalogId '+diffItem.oldItem.catalogId);
                console.log(diffItem);
              } else if (matchDishes.length > 1) {
                console.log('multiple items to be updated / deleted found in workOrder');
                console.log('order '+changedOrder.woItem.properties.order.number);
                console.log('item '+diffItem.oldItem.productName);
                console.log(diffItem.oldItem.productName);
                console.log('items found:');
                console.log(matchDishes);
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
                  if (diffItem.action === 'delete') {
                    if (dish.properties.backTrace.length === 1) {
                      dishesToDelete.push(dish);
                      dish.isToDelete = true;
                    } else {
                      dish.properties.quantity -= diffItem.oldItem.quantity;
                      if (matchDishBt.quantity === diffItem.oldItem.quantity) {
                        dish.deletedBackTrace.push(matchDishBt);
                        dish.properties.backTrace.splice(ind3, 1);
                      } else { // more than one occurence of dish in same order
                        matchDishBt.quantity -= diffItem.oldItem.quantity;
                      }
                      dishesToUpdate.push(dish);
                    }
                  } else {  // diffItem.action === 'update'
                    var quantityDiff = diffItem.newItem.quantity - diffItem.oldItem.quantity;
                    if (quantityDiff) {
                      dish.properties.quantity += quantityDiff;
                      matchDishBt.quantity += quantityDiff;
                    }
                    dish.properties.isDescChanged =  diffItem.newItem.isDescChanged;
                    dish.properties.productDescription =  diffItem.newItem.productDescription;
                    dishesToUpdate.push(dish);
                  }
                 }
              }
            } else if (diffItem.action === 'new') {
              diffItem.matchDish =
                that.createItem(changedOrder.woItem, diffItem.newItem, dishesToCreate, dishesToUpdate);
            };
          });
        }
      });
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
           return api.saveObjects(dishesToUpdate)
             .then(function() {
               console.log(dishesToUpdate.length+' dishes updated');
               console.log(dishesToUpdate);
               return api.deleteObjects(dishesToDelete)
                 .then(function() {
                   console.log(dishesToDelete.length+' dishes deleted');
                   console.log(dishesToDelete);
                 });
             })
         });
    };

    this.updatePreps = function() {
      console.log('starting updatePreps');
      var that = this;
      var prepsToCreate = [];
      var prepsToUpdate = [];
      var prepsToDelete = [];
      that.changedOrders.forEach(function(changedOrder) {
        if (changedOrder.action === 'delete' || changedOrder.action === 'recalc') {
          console.log('deleting/adjusting preps for order '+changedOrder.woItem.properties.order.number);
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
                console.log('found dish '+dish.properties.productName+' in order');
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
                      var prepCatalogItem = catalog.filter(function(cat) {
                        return cat.id === prep.properties.catalogId;
                      })[0];
                      var dishComponent = dishCatalogItem.properties.components.filter(function(comp) {
                        return comp.id === prepCatalogItem.id;
                      })[0];
                      if (!dishComponent) {
                        alert ('ההכנה '+prep.properties.productName+' לא נמצאה בין המרכיבים של המנה '+
                                dish.properties.productName);
                        return;
                      }
                      console.log('found existing prep '+prep.properties.productName+' for dish');
                      if (prep.properties.backTrace.length === 1 && dish.isToDelete) {
                        // whole dish was deleted and prep only in this dish - delete prep
                        console.log('prep to be deleted');
                        prepsToDelete.push(prep);
                        prep.isToDelete = true;
                      } else if (dish.isToDelete) {
                        // whole dish deleted, but prep belongs to other dishes too
                        prep.properties.quantity -= matchingBt.quantity;
                        prep.properties.backTrace.splice(ind1, 1);
                        console.log('dish deleted. Adjust prep quantity to '+prep.properties.quantity);
                        prepsToUpdate.push(prep);
                      } else {
                        // dish's quantity was adjusted
                        var oldQuant = matchingBt.quantity;
                        matchingBt.quantity =
                          dish.properties.quantity * dishComponent.quantity /
                              dishCatalogItem.properties.productionQuantity;
                        prep.properties.quantity -= (oldQuant - matchingBt.quantity);
                        console.log('adjust prep quantity to '+prep.properties.quantity);
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
          console.log('creating preps for order '+changedOrder.woItem.properties.order.number);
          // add / adjust all preps of dishes for this order
          that.workOrder.forEach(function (dish) {
            if (dish.properties.domain === 1) {
              console.log('visiting dish '+dish.properties.productName);
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
                    console.log('looking at component '+tempCat.properties.productName);
                    console.log(tempCat);
                    console.log(comp);
                    var prep = that.workOrder.filter(function (woi) {
                      return woi.properties.catalogId === comp.id;
                    })[0];
                    if (prep) { // prep already in workOrder - adjust quantity
                     console.log('revisiting prep '+prep.properties.productName);
                      prep.properties.quantity +=
                        dishBt.quantity *
                        comp.quantity / dishCatalogItem.properties.productionQuantity;
                      var prepBt = prep.properties.backTrace.filter(function(bt) {
                        return bt.id === dish.id;
                      })[0];
                      if (prepBt) {
                        prepBt.quantity += dishBt.quantity *
                          comp.quantity / dishCatalogItem.properties.productionQuantity;
                      } else {
                        prep.properties.backTrace.push({
                          id: dish.id,
                          domain: 1,
                          quantity: dishBt.quantity *
                            comp.quantity / dishCatalogItem.properties.productionQuantity
                        });
                      }
                      if (prep.properties.select !== 'delay') {
                        prep.properties.select = 'mix';
                        prep.properties.warning = 1;
                        //todo: crear warnings when updating prep's select
                      }
                      var prepOrder = prep.properties.orders.filter(function(ord) {
                        ord.id === changedOrder.woItem.id;
                      })[0];
                      if (prepOrder) {
                        if (prepOrder.select !== 'delay') {
                          // warn user of added quantity to prep
                          prepOrder.addedQuantity += dish.properties.quantity *
                            comp.quantity / dishCatalogItem.properties.productionQuantity;
                        }
                      } else {
                        prep.properties.orders.push ({
                          id: changedOrder.woItem.id,
                          select: 'delay'
                        });
                      }
                      if (!prep.isNewItem) {  // if prep was just created, update will cause duplicates
                        prepsToUpdate.push(prep);
                      }
                    } else { // create new prep
                      var prepCatalogItem = catalog.filter(function (cat) {
                        return cat.id === comp.id;
                      })[0];
                      console.log('creating prep '+prepCatalogItem.properties.productName);
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
                      prep.properties.quantity = dishBt.quantity *
                                     comp.quantity / dishCatalogItem.properties.productionQuantity;
                      prep.properties.quantityForToday = 0;
                      prep.properties.quantityDone = 0;
                      prep.properties.select = 'delay';
                      prep.properties.backTrace = [{
                        id: dish.id,
                        domain: 1,
                        quantity: dishBt.quantity *
                                    comp.quantity / dishCatalogItem.properties.productionQuantity
                      }];
                      prep.properties.orders = [{
                        id: changedOrder.woItem.id,
                        select: 'delay'
                      }];
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
          console.log('changing specific items for order '+changedOrder.woItem.properties.order.number);
          changedOrder.items.forEach(function(diffItem) {
               var dish = diffItem.matchDish;
               if (dish) {  // just make sure no catastrophy occured while creating dish
                 // if dish was newly created, matchDish points to a version without id (before save)
                 // we now have to find its saved version
                 console.log('doing '+diffItem.action+' for dish '+dish.properties.productName);
                 if (!dish.id) {
                   dish = that.workOrder.filter(function(woi) {
                     return woi.properties.domain === 1 &&
                       woi.properties.catalogId === diffItem.matchDish.properties.catalogId &&
                       ((!woi.properties.isDescChanged && !diffItem.matchDish.properties.isDescChanged) ||
                       woi.properties.productDescription === diffItem.matchDish.properties.productDescription);
                   })[0];
                   if (!dish) {
                     console.log('didnt find saved dish');
                     console.log(diffItem.matchDish);
                     console.log(that.workOrder);
                   }
                 }
                 console.log('looking at dish '+dish.properties.productName);
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
                         console.log('found prep '+prep.properties.productName+' for dish');
                         var dishComponent = dishCatalogItem.properties.components.filter(function (comp) {
                           return comp.id === prep.properties.catalogId;
                         })[0];
                         if (!dishComponent) {
                           alert('ההכנה ' + prep.properties.productName + ' לא נמצאה בין המרכיבים של המנה ' +
                             dish.properties.productName);
                           return;
                         }
                         if (diffItem.action === 'delete') {
                           if (dish.isToDelete && prep.properties.backTrace.length === 1) {
                             prep.isToDelete = true;
                             console.log('prep to be deleted');
                             prepsToDelete.push(prep);
                           } else if (dish.isToDelete) {
                             prep.properties.quantity -= prepBt.quantity;
                             prep.properties.backTrace.splice(ind4, 1);
                             console.log('dish deleted, prep quantity set to '+prep.properties.quantity);
                             prepsToUpdate.push(prep);
                           } else {
                             // dish's quantity was adjusted
                             var oldQuant = prepBt.quantity;
                             prepBt.quantity =
                               dish.properties.quantity * dishComponent.quantity /
                               dishCatalogItem.properties.productionQuantity;
                             prep.properties.quantity -= (oldQuant - prepBt.quantity);
                             console.log('prep quantity set to '+prep.properties.quantity);
                             prepsToUpdate.push(prep);
                           }
                         } else { // action === 'update'
                           var addedDishQuantity = diffItem.newItem.quantity - diffItem.oldItem.quantity;
                           if (addedDishQuantity) {  // treat only quantity changes
                             var addedPrepQuantity = addedDishQuantity * dishComponent.quantity /
                               dishCatalogItem.properties.productionQuantity;
                             prepBt.quantity += addedPrepQuantity;
                             prep.properties.quantity += addedPrepQuantity;
                             console.log('prep quantity set to '+prep.properties.quantity);
                             prepsToUpdate.push(prep);
                           }
                         }
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
                           console.log('prep '+prep.properties.productName+' already exists');
                           prep.properties.quantity += diffItem.newItem.quantity *
                             dishComponent.quantity / dishCatalogItem.properties.productionQuantity;
                           var prepBt = prep.properties.backTrace.filter(function (bt) {
                             return bt.id === dish.id;
                           })[0];
                           if (prepBt) {
                             prepBt.quantity += diffItem.newItem.quantity *
                               dishComponent.quantity / dishCatalogItem.properties.productionQuantity;
                            } else {
                             prep.properties.backTrace.push({
                               id: dish.id,
                               domain: 1,
                               quantity: diffItem.newItem.quantity *
                                 dishComponent.quantity / dishCatalogItem.properties.productionQuantity
                             });
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
                           console.log('prep quantity set to '+prep.properties.quantity);
                           prepsToUpdate.push(prep);
                         } else {  // new prep
                           var prepCatalogItem = catalog.filter(function (cat) {
                             return cat.id === dishComponent.id;
                           })[0];
                           console.log('creating prep '+prepCatalogItem.properties.productName);
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
                           prep.properties.quantity = diffItem.newItem.quantity *
                             dishComponent.quantity / dishCatalogItem.properties.productionQuantity;
                           prep.properties.quantityForToday = 0;
                           prep.properties.quantityDone = 0;
                           prep.properties.select = 'delay';
                           prep.properties.backTrace = [{
                             id: dish.id,
                             domain: 1,
                             quantity: diffItem.newItem.quantity *
                               dishComponent.quantity / dishCatalogItem.properties.productionQuantity
                           }];
                           prep.properties.orders = [{
                             id: changedOrder.woItem.id,
                             select: 'delay'
                           }];
                           console.log('new prep:');
                           console.log(prep);
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
          return api.saveObjects(prepsToUpdate)
            .then(function() {
              console.log(prepsToUpdate.length+' preps updated');
              console.log(prepsToUpdate);
              return api.deleteObjects(prepsToDelete)
                .then(function() {
                  console.log(prepsToDelete.length+' preps deleted');
                  console.log(prepsToDelete);
                });
            })
        });
    };

    // compares current wo to base wo to see if updates are done correctly
    // base wo should be created from scratch with same orders as current wo
    this.compareWorkOrder = function() {
      var that = this;
      var baseWoId = this.baseWoIndex.properties.woId;
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
                (Boolean(bWoi.properties.isDescChanged) === Boolean(woi.properties.isDescChanged)) &&
                (!bWoi.properties.isDescChanged ||
                  bWoi.properties.productDescription === woi.properties.productDescription);
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
        if (targetDomain === 1) {
          that.createMenuItemsDomain();
        } else {
          that.createComponentsDomain(targetDomain);
        }
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

     // setup list of workOrders to compare current woId against
     this.setupBaseWoIndexes = function() {
       this.baseWoIndexes = this.woIndexes.filter(function(woIndex) {
         return !woIndex.properties.isQuery && woIndex.properties.woId !== woId;
       });
     };

    this.switchWorkOrders = function () {
      var that = this;
      woId = this.woIndex.properties.woId;
      this.setupBaseWoIndexes();
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
    this.horizonDate = orderService.horizonDate();
    this.isCompareActive = false;
    this.baseWoIndex = undefined;
    this.switchWorkOrders();
  });
