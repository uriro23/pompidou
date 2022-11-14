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

    this.dayName = function(dat) {
      var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
      return dayNames[dat.getDay()]+"'";
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
        return wo.properties.domain >= domain;
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
                workItem.properties.originalQuantity = workItem.properties.quantity;
                workItem.properties.backTrace.push({
                  id: inWorkOrderItem.id,
                  domain: 0,
                  quantity: item.quantity,
                  prepScope: inWorkOrderItem.properties.prepScope
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
                  workItem.properties.productDescription = item.productDescription;
                }
                workItem.properties.quantity = workItem.properties.originalQuantity = item.quantity;
                if (inWorkOrderItem.properties.order.orderStatus === 2) {
                  workItem.properties.notFinalQuantity = item.quantity;
                }
                workItem.properties.category = item.category;
                workItem.properties.domain = 1;
                workItem.properties.measurementUnit = item.measurementUnit;
                workItem.properties.backTrace = [{
                  id: inWorkOrderItem.id,
                  domain: 0,
                  quantity: item.quantity,
                  prepScope: inWorkOrderItem.properties.prepScope
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
                  workItem.properties.orderQuant[orderInd].productDescription = item.productDescription;
                }
                that.workOrder.push(workItem);
              }
            }
          });
        }
      });
   };

    function calcQuantity (orders, isService) {
      var quantity = 0;
      orders.forEach(function(order) {
        if (order.prepScope === 'all' ||
          (isService && order.prepScope === 'service') ||
          (!isService && order.prepScope === 'prep')) {
          quantity += order.quantity;
        }
      });
       return quantity;
    }

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
          if (inCatObj) {
            var inCatItem = inCatObj.properties;
            inCatItem.components.forEach(function(component) {
              if (component.domain === targetDomain) {
                var temp = that.workOrder.filter(function (wi, ind) {
                  if (wi.properties.catalogId === component.id) {
                    workItemInd = ind;
                    return true;
                  }
                });
                if (temp.length > 0) {  // item already exists, just add quantity
                  workItem = that.workOrder[workItemInd];
                    var menuItemActualQuantity = component.domain===2 ?
                      calcQuantity(inWorkItem.backTrace, workItem.properties.category.type === 11)
                      : inWorkItem.quantity;
                  workItem.properties.quantity +=
                    menuItemActualQuantity * component.quantity / inCatItem.productionQuantity;
                  workItem.properties.originalQuantity = workItem.properties.quantity;
                  if (menuItemActualQuantity > 0) { // don't create bt if prep not in prepScope
                    workItem.properties.backTrace.push({
                      id: inWorkOrder.id,
                      domain: inWorkItem.domain,
                      quantity: menuItemActualQuantity * component.quantity / inCatItem.productionQuantity
                    });
                  }
                } else {
                  var outCatObj = catalog.filter(function (cat) {
                    return cat.id === component.id;
                  })[0];
                  if (outCatObj) {    // if component has been deleted from catalog, skip it
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
                    menuItemActualQuantity = component.domain===2 ?
                      calcQuantity(inWorkItem.backTrace, workItem.properties.category.type === 11)
                      : inWorkItem.quantity;
                    workItem.properties.quantity = menuItemActualQuantity * component.quantity / inCatItem.productionQuantity;
                    workItem.properties.originalQuantity = workItem.properties.quantity;
                    workItem.properties.backTrace = [{
                      id: inWorkOrder.id,
                      domain: inWorkItem.domain,
                      quantity: menuItemActualQuantity * component.quantity / inCatItem.productionQuantity
                    }];
                    workItem.properties.select = "delay";
                    if (menuItemActualQuantity > 0) { // don't create item if not in prepScope
                      that.workOrder.push(workItem);
                    }
                  } else {
                    alert('output catalog item ' + component.id + ' has been deleted');
                  }
                }
              }
            });
          } else {
            alert('input catalog item ' + inWorkItem.catalogId + ' has been deleted');
          }
        }
      });
    };

    // for each preparation, create an array of menu items in which it appears for detailed listing
    this.createMenuItemView = function() {
      var that = this;
      this.workOrder.forEach(function(currentPrep) {
        if(currentPrep.properties.domain === 2) {
          currentPrep.properties.menuItems = [];
          currentPrep.properties.backTrace.forEach(function (currentBackTrace) {
            var currentMenuItem = {};
            currentMenuItem.id = currentBackTrace.id;
            currentMenuItem.quantity = currentBackTrace.quantity;
            var originalMenuItem = that.workOrder.filter(function (wo) {
              return wo.id === currentBackTrace.id;
            })[0];
            currentMenuItem.productName = originalMenuItem.properties.productName;
            currentMenuItem.orders = [];  // initialize orders array: set seq to unique values for ng-repeat
            for (var n = 0; n < that.woOrders.length; n++) {
              currentMenuItem.orders[n] = {seq: n, quantity: 0};
            }
            var totalQuantity = 0;
            originalMenuItem.properties.backTrace.forEach(function (ord) {
              totalQuantity += ord.quantity;
            });
            var m;
            originalMenuItem.properties.backTrace.forEach(function (currentOrder) {
              var temp = that.woOrders.filter(function (ord, ind) {
                if (ord.id === currentOrder.id) {
                  m = ind;
                }
              });
              currentMenuItem.orders[m].quantity += currentBackTrace.quantity * currentOrder.quantity / totalQuantity;
            });
            currentPrep.properties.menuItems.push(currentMenuItem);
          });
        }
      });
    };

    // for each preparation, create an array of orders in which menuItems containing this preparation appear.
    // each entry contains an array of menuItems.
    // this is an inverse of the prep menuItems array.
    //
    this.createPrepOrderView = function () {
      var that = this;
      this.workOrder.forEach(function (currentPrep) {
        if (currentPrep.properties.domain === 2) {
          currentPrep.properties.orders = [];
          currentPrep.properties.backTrace.forEach(function (prepBackTrace) {
            var originalMenuItem = that.workOrder.filter(function(mi) {
              return mi.id === prepBackTrace.id;
            })[0];
            var viewMenuItemIndex;
            var t = currentPrep.properties.menuItems.filter(function(mi,ind) {
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
              var temp = currentPrep.properties.orders.filter(function(ord) {
                return ord.id === miBackTrace.id;
              });
              var currentOrder;
              if (temp.length===0) {  // first appearance of this order
                var originalOrder = that.woOrders.filter(function(ord) {
                  return ord.id === miBackTrace.id;
                })[0];
                var orderObj = {
                  id: originalOrder.id,
                  customer: originalOrder.properties.customer.firstName,
                  date: originalOrder.properties.order.eventDate,
                  day: that.dayName(originalOrder.properties.order.eventDate),
                  totalQuantity: 0,
                  menuItems: [],
                  select: 'delay'
                };
                currentPrep.properties.menuItems.forEach(function(mu,ind) {
                  orderObj.menuItems[ind] = {
                    seq: ind,
                    quantity: 0
                  }
                });
                currentPrep.properties.orders.push(orderObj);
                currentOrder = currentPrep.properties.orders[currentPrep.properties.orders.length-1];
              } else {
                currentOrder = temp[0];
             }
              var prepQuantity =
                ((currentPrep.properties.category.type===11 &
                    (miBackTrace.prepScope==='all' || miBackTrace.prepScope==='service')) ||
                  (currentPrep.properties.category.type!==11 &
                    (miBackTrace.prepScope==='all' || miBackTrace.prepScope==='prep') ) )
                  ?  miBackTrace.quantity : 0;
              currentOrder.menuItems[viewMenuItemIndex].quantity +=
                prepQuantity * prepComponent.quantity / menuItemCatalog.properties.productionQuantity;
              currentOrder.totalQuantity +=
                prepQuantity * prepComponent.quantity / menuItemCatalog.properties.productionQuantity;
            });
          });
          currentPrep.properties.orders = currentPrep.properties.orders.filter(function(ord) {
            return ord.totalQuantity > 0;
          })
          currentPrep.properties.orders.sort(function(a,b) {
            return a.date - b.date;
          });
         }
      });
    };

    // decide if item will be shown
    this.isShowItem = function (woItem) {
      var that = this;
      var isShowByStock = that.isIncludeStock ? true : !woItem.properties.isInStock;
      var isItemToday = woItem.properties.select==='today';
      if (woItem.properties.select==='mix') {
        woItem.properties.orders.forEach(function(ord) {
          if (ord.select === 'today') {
            isItemToday = true;
          }
         });
      }
      var isShowByToday = that.isShowTodayOnly ? isItemToday : true;
      return isShowByStock && isShowByToday;
    };

    // propagate selection to all preps in domain
    this.setGlobalSelect = function() {
      var that = this;
      this.workOrder.forEach(function(woItem) {
        if (woItem.properties.domain === 2) {
          woItem.properties.select = that.select;
          that.setPrepSelect(woItem, false);
        }
      });
    };

    // propogate selection to all orders in prep item and save item
    this.setPrepSelect = function (woItem, isDirect) {
      if (woItem.properties.domain === 2) {  // should always be
        if (isDirect) {
          that.select = 'mix';
        }
        woItem.properties.orders.forEach(function(ord) {
          ord.select = woItem.properties.select;
        });
        api.saveObj(woItem);
      }
    };

    // if select values of all orders in prep are identical, set select value of prep accordingly
    // else set prep's select to "mix" which disables its control
    this.setPrepOrderSelect = function (woItem) {
      if (woItem.properties.domain === 2) {  // should always be
        that.select = 'mix';
        var s = 'none';
        woItem.properties.orders.forEach(function(ord) {
          if (s === 'none') {
            s = ord.select;
          } else if (s !== ord.select) {
            s = 'mix';
          }
        });
        woItem.properties.select = s;
        api.saveObj(woItem);
      }
    };

    this.saveWoItem = function (woItem) {
      api.saveObj(woItem);
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
              viewItem.properties.customer = customers.filter(function (cust) {
                return cust.id === order.properties.customer;
              })[0].properties;
            viewItem.properties.orderStatus = lov.orderStatuses.filter(function(st) {
              return st.id === order.properties.orderStatus;
            })[0];
            viewItem.properties.color = colors.filter(function(color) {  // copy order's color to wo
              return color.tId === order.properties.color;
            })[0];
            viewItem.properties.prepScope = 'all';
            viewItem.isInWorkOrder = false;
            that.orderView.push(viewItem);
            }
          });
          var ordersToSave = [];  // now include all orders from prev order view in wo
          that.orderView.forEach(function(ovOrder){
            if (that.prevOrdersInWo.filter(function (po) {
                return po.properties.order.number === ovOrder.properties.order.number;
              }).length > 0) { // order was in prev wo
               ordersToSave.push(ovOrder);
              ovOrder.isToBeTemporarilyDeleted = true;
            }
          });
          that.orderView = that.orderView.filter(function (ov) {
            return !ov.isToBeTemporarilyDeleted;
          });
          api.saveObjects(ordersToSave)
            .then(function () {
               api.queryWorkOrder(woId) // we assume that the only records in wo are those just stored
                .then(function (ov) { // requery them to get their ids
                  ov.forEach(function(o) {
                    that.workOrder.push(o);
                    o.isInWorkOrder = true;
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
                  that.orderView.forEach(function(o) {
                  });
                  that.createSmallOrderView();
                });
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
            viewItem.properties.customer = customers.filter(function (cust) {
              return cust.id === ord.properties.customer;
            })[0].properties;
            viewItem.properties.orderStatus = lov.orderStatuses.filter(function(st) {
              return st.id === ord.properties.orderStatus;
            })[0];
            viewItem.isInWorkOrder = true;
            that.orderView.push(viewItem);
          });
          api.saveObjects(that.orderView)
            .then(function() {
              api.queryWorkOrder(woId)    // requery to get ids
                .then(function(woOrders) {
                  woOrders.forEach(function(wo) {
                    wo.isInWorkOrder = true;
                  });
                  that.orderView = that.workOrder = woOrders;
                  that.createSmallOrderView();
                  that.createWorkOrderDomain(1);
                });
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
            that.orderView[ind] = newItem;
            that.createSmallOrderView();
          });
      }
 //     for (var dd = 1; dd < 5; dd++) {                     // set all further domains as invalid
 //       this.woIndex.properties.domainStatus[dd] = false;
 //     }
 //     api.saveObj(this.woIndex);
    };

    this.setPrepScope = function(ind) {
      api.saveObj(this.orderView[ind]);
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
          that.isActiveTab = [true, false, false, false]; // show orders tab
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
              for (var dd = 0; dd < 5; dd++) {                     // all domains - invalid
                that.woIndex.properties.domainStatus[dd] = false;
              }
              api.saveObj(that.woIndex);
              that.isWoValid = true;
            });
        }
      });
    };

    this.saveWorkOrder = function (domain) {
      var woItemsToSave = this.workOrder.filter(function (wo) {
        return wo.properties.domain === domain;
      });
      this.isProcessing = true;
       return api.saveObjects(woItemsToSave)
        .then(function () {
          that.isProcessing = false;
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
        if (wo.select === 'mix') { // force display order details for preps whose timing selection is mixed
          woi.isShowDetails = true;
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
        if (woi.properties.select !== 'mix') {
          woi.isShowDetails = that.isShowDetails;
        }
      })
    };

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
          return wo.properties.domain < targetDomain;
        });
        if (targetDomain === 1) {
          that.createOrderItems();
        } else if (targetDomain === 2) {
          that.createComponents(2);
          that.createMenuItemView();
          that.createPrepOrderView();
        } else if (targetDomain === 3) {
          that.createComponents(3);
        } else {
          that.createComponents(4);
        }
        that.saveWorkOrder(targetDomain)
          .then(function () {
            api.queryWorkOrder(woId)    // requery work order to get ids for newly created items
              .then(function (wo) {
                that.workOrder = wo;
                var tt = that.workOrder.filter(function(ttt) {
                  return ttt.properties.domain === targetDomain;
                });
                that.splitWorkOrder();
               for (var d = 0; d < 5; d++) {
                  that.isActiveTab[d] = false;
                }
                that.isActiveTab[targetDomain] = true;
                that.woIndex.properties.domainStatus[targetDomain] = true; // the domain just created is valid
                if (targetDomain < 3) {
                  for (var dd = targetDomain + 1; dd < 5; dd++) {                     // all further domains - invalid
                    that.woIndex.properties.domainStatus[dd] = false;
                  }
                }
                api.saveObj(that.woIndex);
              });
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

    this.switchWorkOrders = function () {
      var that = this;
      woId = this.woIndex.properties.woId;
       this.isProcessing = true;
      api.queryWorkOrder(woId)
        .then(function(wo) {
          that.workOrder = wo;
          that.createSmallOrderView();
          that.orderView = [];
          that.isActiveTab = [false, true, false, false]; // show menu items by default
          that.splitWorkOrder();
          // check if any order in wo has passed or has been changed since last wo creation
          that.isWoValid = true;
          api.queryFutureOrders(['number'])
            .then(function(futureOrders) {
              that.woOrders.forEach(function(woOrder) {
                var ord = futureOrders.filter(function(futureOrder) {
                  return futureOrder.properties.number === woOrder.properties.order.number;
                })[0];
                if (!ord) {
                  that.isWoValid = false;
                } else if (ord.updatedAt > that.woIndex.updatedAt) {
                  that.isWoValid = false;
                }
              });
              if (!that.isWoValid) {
                that.createNewWorkOrder(true);
              }
              that.isProcessing = false;
            });
        });
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
    this.isShowDelay = this.isShowToday = this.isShowDone = true;
    this.switchWorkOrders();
  });
