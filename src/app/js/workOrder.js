'use strict';

/* Controllers */
angular.module('myApp')
  .controller('WorkOrderCtrl', function (api, $state, $filter, $modal, $q, $rootScope,
                                         lov, catalog, allCategories, measurementUnits, today,
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
        return wo.attributes.domain >= domain;
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
      var workItemInd;
      var orderInd;
      var that = this;
      this.workOrder.forEach(function(inWorkOrderItem) {
        var inWorkItem = inWorkOrderItem.attributes;
        if (inWorkItem.domain === 0) {
          var items = inWorkItem.order.quotes[inWorkItem.order.activeQuote].items;
          items.forEach(function(item) {
            var temp = that.workOrder.filter(function (workItem, ind) {
              if (workItem.attributes.catalogId === item.catalogId) {
                workItemInd = ind;
                return true;
              }
            });
            if (temp.length > 0) {  // item already in list, just add quantity
              workItem = that.workOrder[workItemInd];
              workItem.attributes.quantity += item.quantity;
              workItem.attributes.originalQuantity = workItem.attributes.quantity;
              workItem.attributes.backTrace.push({
                id: inWorkOrderItem.id,
                domain: 0,
                quantity: item.quantity
              });
              that.woOrders.forEach(function(o,i) {
                if (o.id === inWorkOrderItem.id) {
                  orderInd = i;
                }
              });
              workItem.attributes.orderQuant[orderInd].quantity = item.quantity;
              if (item.isDescChanged) {
                workItem.attributes.orderQuant[orderInd].productDescription = item.productDescription;
            }
            } else { // create new item
              workItem = api.initWorkOrder();
              workItem.attributes.woId = woId;
              workItem.attributes.catalogId = item.catalogId;
              var catItem = catalog.filter(function (cat) {
                return cat.id === item.catalogId;
              })[0];
              workItem.attributes.productName = catItem.attributes.productName;
              workItem.attributes.quantity = item.quantity;
              workItem.attributes.originalQuantity = workItem.attributes.quantity;
              workItem.attributes.category = item.category;
              workItem.attributes.domain = 1;
              workItem.attributes.measurementUnit = item.measurementUnit;
              workItem.attributes.backTrace = [{
                id: inWorkOrderItem.id,
                domain: 0,
                quantity: item.quantity
              }];
              workItem.attributes.orderQuant = []; // create array of order quantities for detailed menu item view
              for (var i=0;i<that.woOrders.length;i++) {  // initialize to all zero quantity
                workItem.attributes.orderQuant[i] = {
                  id: that.woOrders[i].id,    //id needed only for uniqueness of ng-repeat
                  quantity: 0
                };
              }
              temp = that.woOrders.filter(function(o,i) {
                if (o.id === inWorkOrderItem.id) {
                  orderInd = i;
                }
              });
              workItem.attributes.orderQuant[orderInd].quantity = item.quantity;
              if (item.isDescChanged) {
                workItem.attributes.orderQuant[orderInd].productDescription = item.productDescription;
              }
              that.workOrder.push(workItem);
            }
          });
        }
      });
   };

  this.createComponents = function (targetDomain) {
      var workItemInd;
      var workItem;
      var that = this;
      this.workOrder.forEach(function(inWorkOrder) {
        var inWorkItem = inWorkOrder.attributes;
        if (inWorkItem.domain > 0) {  // skip orders
          var inCatObj = catalog.filter(function (cat) {
            return cat.id === inWorkItem.catalogId;
          })[0];
          if (inCatObj) {
            var inCatItem = inCatObj.attributes;
            //for (var j = 0; j < inCatItem.components.length; j++) {
            inCatItem.components.forEach(function(component) {
              if (component.domain === targetDomain) {
                var temp = that.workOrder.filter(function (workItem, ind) {
                  if (workItem.attributes.catalogId === component.id) {
                    workItemInd = ind;
                    return true;
                  }
                });
                if (temp.length > 0) {  // item already exists, just add quantity
                  workItem = that.workOrder[workItemInd];
                  workItem.attributes.quantity += inWorkItem.quantity * component.quantity / inCatItem.productionQuantity;
                  workItem.attributes.originalQuantity = workItem.attributes.quantity;
                  workItem.attributes.backTrace.push({
                    id: inWorkOrder.id,
                    domain: inWorkItem.domain,
                    quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity
                  });
                } else {
                  var outCatObj = catalog.filter(function (cat) {
                    return cat.id === component.id;
                  })[0];
                  if (outCatObj) {    // if component has been deleted from catalog, skip it
                    var outCatItem = outCatObj.attributes;
                    workItem = api.initWorkOrder();
                    workItem.attributes.woId = woId;
                    workItem.attributes.catalogId = component.id;
                    workItem.attributes.productName = outCatItem.productName;
                    workItem.attributes.quantity = inWorkItem.quantity * component.quantity / inCatItem.productionQuantity;
                    workItem.attributes.originalQuantity = workItem.attributes.quantity;
                    workItem.attributes.category = allCategories.filter(function (cat) {
                      return cat.tId === outCatItem.category;
                    })[0];
                    workItem.attributes.domain = targetDomain;
                    workItem.attributes.measurementUnit = measurementUnits.filter(function (mes) {
                      return mes.tId === outCatItem.measurementUnit;
                    })[0];
                    workItem.attributes.backTrace = [{
                      id: inWorkOrder.id,
                      domain: inWorkItem.domain,
                      quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity
                    }];
                    that.workOrder.push(workItem);
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
        if(currentPrep.attributes.domain === 2) {
          currentPrep.attributes.menuItems = [];
          currentPrep.attributes.backTrace.forEach(function (currentBackTrace) {
            var currentMenuItem = {};
            currentMenuItem.id = currentBackTrace.id;
            currentMenuItem.quantity = currentBackTrace.quantity;
            var originalMenuItem = that.workOrder.filter(function (wo) {
              return wo.id === currentBackTrace.id;
            })[0];
            currentMenuItem.productName = originalMenuItem.attributes.productName;
            currentMenuItem.orders = [];  // initialize orders array: set seq to unique values for ng-repeat
            for (var n = 0; n < that.woOrders.length; n++) {
              currentMenuItem.orders[n] = {seq: n, quantity: 0};
            }
            var totalQuantity = 0;
            originalMenuItem.attributes.backTrace.forEach(function (ord) {
              totalQuantity += ord.quantity;
            });
            var m;
            originalMenuItem.attributes.backTrace.forEach(function (currentOrder) {
              var temp = that.woOrders.filter(function (ord, ind) {
                if (ord.id === currentOrder.id) {
                  m = ind;
                }
              });
              currentMenuItem.orders[m].quantity += currentBackTrace.quantity * currentOrder.quantity / totalQuantity;
            });
            currentPrep.attributes.menuItems.push(currentMenuItem);
          });
        }
      });
    };

    this.createOrderView = function () {
      var that = this;
      this.orderView = [];
      api.queryFutureOrders()
        .then(function (futureOrders) {
          //for (var j = 0; j < futureOrders.length; j++) {
          futureOrders.forEach(function(order) {
            if (order.attributes.orderStatus !== 6) {
              var viewItem = api.initWorkOrder();
              // create the object for now, but we don't store it until user decides to include it in WO
              viewItem.attributes.woId = woId;
              viewItem.attributes.domain = 0;
              viewItem.attributes.order = order.attributes;
              viewItem.attributes.order.id = order.id;
              viewItem.attributes.customer = customers.filter(function (cust) {
                return cust.id === order.attributes.customer;
              })[0].attributes;
            viewItem.attributes.orderStatus = lov.orderStatuses.filter(function(st) {
              return st.id === order.attributes.orderStatus;
            })[0];
            viewItem.isInWorkOrder = false;
            that.orderView.push(viewItem);
            }
          });
          var ordersToSave = [];  // now include all orders from prev order view in wo
          //for (var i = 0; i < that.orderView.length; i++) {
          that.orderView.forEach(function(ovOrder){
            if (that.prevOrdersInWo.filter(function (po) {
                return po.attributes.order.number === ovOrder.attributes.order.number;
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
                  //for (var k = 0; k < ov.length; k++) {
                  ov.forEach(function(o) {
                    that.workOrder.push(o);
                    o.isInWorkOrder = true;
                    that.orderView.push(o);
                  });
                  that.orderView.sort(function (a, b) {
                    if (a.attributes.order.eventDate > b.attributes.order.eventDate) {
                      return 1;
                    } else {
                      return -1;
                    }
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
            return ord.attributes.orderStatus !== 1 && ord.attributes.orderStatus !== 6;
          });
          orders.forEach(function(ord) {
            var viewItem = api.initWorkOrder();
            viewItem.attributes.woId = woId;
            viewItem.attributes.domain = 0;
            viewItem.attributes.order = ord.attributes;
            viewItem.attributes.order.id = ord.id;
            viewItem.attributes.customer = customers.filter(function (cust) {
              return cust.id === ord.attributes.customer;
            })[0].attributes;
            viewItem.attributes.orderStatus = lov.orderStatuses.filter(function(st) {
              return st.id === ord.attributes.orderStatus;
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
        return wo.attributes.domain === 0;
      }).sort(function(a,b) {
        if (a.attributes.order.eventDate > b.attributes.order.eventDate) {
          return 1;
        } else if (a.attributes.order.eventDate < b.attributes.order.eventDate) {
          return -1;
        } else if (a.id > b.id) {   // just that sort resultswill be deterministic
          return 1;
        } else {
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
        that.workOrder.splice(indToDelete, 1);
        api.deleteObj(that.orderView[ind])
          .then(function (obj) {
            // create new item with same content as deleted one so we can restore it in DB if user changes his mind
            var newItem = api.initWorkOrder();
            newItem.attributes = obj.attributes;
            that.orderView[ind] = newItem;
            that.createSmallOrderView();
          });
      }
 //     for (var dd = 1; dd < 4; dd++) {                     // set all further domains as invalid
 //       this.woIndex.attributes.domainStatus[dd] = false;
 //     }
 //     api.saveObj(this.woIndex);
    };

    this.createNewWorkOrder = function () {
      var that = this;
      var ackDelModal = $modal.open({
        templateUrl: 'app/partials/workOrder/ackDelete.html',
        controller: 'AckDelWorkOrderCtrl as ackDelWorkOrderModel',
        resolve: {
          workOrderType: function () {
            return that.woIndex.attributes.label;
          }
        },
        size: 'sm'
      });

      ackDelModal.result.then(function (isDelete) {
        if (isDelete) {
          that.isActiveTab = [true, false, false, false]; // show orders tab
          // first keep orders in existing work order so they will be inserted in the new wo
          that.prevOrdersInWo = that.workOrder.filter(function (o) {
            return o.attributes.domain === 0;
          });
          that.orderView = [];
          that.destroyWorkOrderDomains(0)
            .then(function () {
              that.workOrder = [];
              that.hierarchicalWorkOrder = [];
              that.woOrders = [];
              if (!that.woIndex.attributes.isQuery) {
                that.createOrderView();
              }
              for (var dd = 0; dd < 4; dd++) {                     // all domains - invalid
                that.woIndex.attributes.domainStatus[dd] = false;
              }
              api.saveObj(that.woIndex);
            });
        }
      });
    };

    this.saveWorkOrder = function (domain) {
      var woItemsToSave = this.workOrder.filter(function (wo) {
        return wo.attributes.domain === domain;
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

    this.splitWorkOrder = function () {
      // split wo by domains and categories
      var that = this;
      this.hierarchicalWorkOrder = [];
      for (var d = 1; d < 4; d++) {
        this.hierarchicalWorkOrder[d] = {
          categories: [],
          isShowAll: true
        };
      }
      this.workOrder.forEach(function(woi) {
        var wo = woi.attributes;
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
      for (d = 1; d < 4; d++) {
        this.hierarchicalWorkOrder[d].categories.sort(function (a, b) {
          return a.category.order - b.category.order;
        });
        for (var c = 0; c < this.hierarchicalWorkOrder[d].categories.length; c++) {
          this.hierarchicalWorkOrder[d].categories[c].list.sort(function (a, b) {
            if (a.attributes.productName < b.attributes.productName) {
              return -1;
            } else {
              return 1;
            }
          });
        }
      }

      // for order items domain only, add list of changed product descriptions per category
      this.hierarchicalWorkOrder[1].categories.forEach(function(cat) {
        cat.changedDescriptions = [];
        cat.list.forEach(function(woItem) {
          woItem.attributes.orderQuant.forEach(function(order,i) {
            if (order.productDescription){
              cat.changedDescriptions.push({
                event: that.woOrders[i].attributes.customer.firstName + ' ' +
                that.dayName(that.woOrders[i].attributes.order.eventDate),
                desc: order.productDescription
              });
            }
          });
        });
      });
    };

    this.createWorkOrderDomain = function (targetDomain) {
      var that = this;
      if (targetDomain===1) { // clicking <compute menuItems> signifies that order selection is complete
        this.woIndex.attributes.domainStatus[0] = true;
        api.saveObj(this.woIndex);
      }
      // destroy existing work order items of target and higher domains
      this.destroyWorkOrderDomains(targetDomain)
        .then(function () {
        that.workOrder = that.workOrder.filter(function (wo) {
          return wo.attributes.domain < targetDomain;
        });
        if (targetDomain === 1) {
          that.createOrderItems();
        } else if (targetDomain === 2) {
          that.createComponents(2);
          that.createMenuItemView();
        } else {
          that.createComponents(3);
        }
        that.saveWorkOrder(targetDomain)
          .then(function () {
            api.queryWorkOrder(woId)    // requery work order to get ids for newly created items
              .then(function (wo) {
                that.workOrder = wo;
                that.splitWorkOrder();
               for (var d = 0; d < 4; d++) {
                  that.isActiveTab[d] = false;
                }
                that.isActiveTab[targetDomain] = true;
                that.woIndex.attributes.domainStatus[targetDomain] = true; // the domain just created is valid
                for (var dd = targetDomain + 1; dd < 4; dd++) {                     // all further domains - invalid
                  that.woIndex.attributes.domainStatus[dd] = false;
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
        for (var dd = domain + 1; dd < 4; dd++) {                     // set all further domains as invalid
          that.woIndex.attributes.domainStatus[dd] = false;
        }
        api.saveObj(that.woIndex);
      });
    };

    this.setIsForToday = function (woItem) {
      if (woItem.attributes.isForToday) {
        woItem.attributes.quantityForToday = woItem.attributes.quantity;
      }
      this.saveWI(woItem);
    };

      this.delItem = function (dom, cat, item) {
      var that = this;
      api.deleteObj(this.hierarchicalWorkOrder[dom].categories[cat].list[item])
        .then(function (obj) {
        that.workOrder = that.workOrder.filter(function (wo) {
          return wo.id !== obj.id;
        });
        that.hierarchicalWorkOrder[dom].categories[cat].list.splice(item, 1);
        for (var dd = dom + 1; dd < 4; dd++) {                     // set all further domains as invalid
          that.woIndex.attributes.domainStatus[dd] = false;
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
              return wo.attributes.domain===2 && wo.attributes.isForToday;
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
            if (wo.attributes.domain===2 && wo.attributes.isForToday) {
              if (wo.attributes.quantityForToday >= wo.attributes.quantity) {
                deleteList.push(wo);
                wo.isToDelete = true;
              } else {
                wo.attributes.quantity -= wo.attributes.quantityForToday;
                wo.delAttributes = {quantityForToday: true}; // set to undefined on save
                wo.attributes.isForToday = false;
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
                  that.woIndex.attributes.domainStatus[3] = false;
                  api.saveObj(that.woIndex);
                });
            });
        }
      });
     };

    this.switchWorkOrders = function () {
      var that = this;
      woId = this.woIndex.attributes.woId;
       this.isProcessing = true;
      api.queryWorkOrder(woId)
        .then(function(wo) {
          that.workOrder = wo;
          that.createSmallOrderView();
          that.orderView = [];
          that.isActiveTab = [false, true, false, false]; // show menu items by default
          that.splitWorkOrder();
          that.isProcessing = false;
        });
    };

    // main block

    var that = this;
    this.catalog = catalog;
    this.domains = lov.domains;
    this.woIndexes = woIndexes;
    this.woIndex = this.woIndexes.filter(function(index) {
      return index.attributes.isDefault;
    })[0];
    this.fromDate = new Date(today);
    this.toDate = new Date(today);
    this.fromDate.setMonth(this.fromDate.getMonth()-1);
    this.toDate.setDate(this.toDate.getDate()-1);
    this.switchWorkOrders();
  });
