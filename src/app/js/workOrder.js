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
    $rootScope.title = lov.company + ' - פקודת עבודה';

    var woId;


    this.destroyWorkOrderDomains = function (domain) {
      var that = this;
      var woItemsToDelete = this.workOrder.filter(function (wo) {
        return wo.attributes.domain >= domain;
      });
      this.isProcessing = true;
      return api.deleteObjects(woItemsToDelete)
        .then(function () {
          that.isProcessing = false
        }, function () {
          alert('workOrder multiple delete failed');
          that.isProcessing = false;
        })
    };


    this.createOrderItems = function () {
      var workItem;
      var workItemInd;
      for (var i = 0; i < this.workOrder.length; i++) {
        var inWorkItem = this.workOrder[i].attributes;
        if (inWorkItem.domain === 0) {
          var items = inWorkItem.order.quotes[inWorkItem.order.activeQuote].items;
          for (var j = 0; j < items.length; j++) {
            var item = items[j];
            var temp = this.workOrder.filter(function (workItem, ind) {
              if (workItem.attributes.catalogId === item.catalogId) {
                workItemInd = ind;
                return true;
              }
            });
            if (temp.length > 0) {  // item already in list, just add quantity
              workItem = this.workOrder[workItemInd];
              workItem.attributes.quantity += item.quantity;
              workItem.attributes.originalQuantity = workItem.attributes.quantity;
              workItem.attributes.backTrace.push({
                id: this.workOrder[i].id,
                domain: 0,
                quantity: item.quantity
              });
            } else { // create new item
              workItem = api.initWorkOrder();
              workItem.attributes.woId = woId;
              workItem.attributes.catalogId = item.catalogId;
              var catItem = catalog.filter(function (cat) {
                return cat.id === item.catalogId;
              })[0];
              // if catalog item was deleted, use product description from first occurrence of menu item
              workItem.attributes.productDescription =
                catItem ? catItem.attributes.productDescription : item.productDescription;
              workItem.attributes.quantity = item.quantity;
              workItem.attributes.originalQuantity = workItem.attributes.quantity;
              workItem.attributes.category = item.category;
              workItem.attributes.domain = 1;
              workItem.attributes.measurementUnit = item.measurementUnit;
              workItem.attributes.backTrace = [{
                id: this.workOrder[i].id,
                domain: 0,
                quantity: item.quantity
              }];
              this.workOrder.push(workItem);
            }
          }
        }
      }
    };

    this.createComponents = function (targetDomain) {
      var workItemInd;
      var workItem;
      for (var i = 0; i < this.workOrder.length; i++) {
        var inWorkItem = this.workOrder[i].attributes;
        if (inWorkItem.domain > 0) {  // skip orders
          var inCatObj = catalog.filter(function (cat) {
            return cat.id === inWorkItem.catalogId;
          })[0];
          if (inCatObj) {
            var inCatItem = inCatObj.attributes;
            for (var j = 0; j < inCatItem.components.length; j++) {
              var component = inCatItem.components[j];
              if (component.domain === targetDomain) {
                var temp = this.workOrder.filter(function (workItem, ind) {
                  if (workItem.attributes.catalogId === component.id) {
                    workItemInd = ind;
                    return true;
                  }
                });
                if (temp.length > 0) {  // item already exists, just add quantity
                  workItem = this.workOrder[workItemInd];
                  workItem.attributes.quantity += inWorkItem.quantity * component.quantity / inCatItem.productionQuantity;
                  workItem.attributes.originalQuantity = workItem.attributes.quantity;
                  workItem.attributes.backTrace.push({
                    id: this.workOrder[i].id,
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
                    workItem.attributes.productDescription = outCatItem.productDescription;
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
                      id: this.workOrder[i].id,
                      domain: inWorkItem.domain,
                      quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity
                    }];
                    this.workOrder.push(workItem);
                  } else {
                    alert('output catalog item ' + component.id + ' has been deleted')
                  }
                }
              }
            }
          } else {
            alert('input catalog item ' + inWorkItem.catalogId + ' has been deleted')
          }
        }
      }

    };

    this.createOrderView = function () {
      var that = this;
      this.orderView = [];
      api.queryFutureOrders()
        .then(function (futureOrders) {
          for (var j = 0; j < futureOrders.length; j++) {
            if (futureOrders[j].attributes.orderStatus !== 6) {
              var viewItem = api.initWorkOrder();
              // create the object for now, but we don't store it until user decides to include it in WO
              viewItem.attributes.woId = woId;
              viewItem.attributes.domain = 0;
              viewItem.attributes.order = futureOrders[j].attributes;
              viewItem.attributes.order.id = futureOrders[j].id;
              viewItem.attributes.customer = customers.filter(function (cust) {
                return cust.id === futureOrders[j].attributes.customer;
              })[0].attributes;
            viewItem.attributes.orderStatus = lov.orderStatuses.filter(function(st) {
              return st.id === futureOrders[j].attributes.orderStatus;
            })[0];
            viewItem.isInWorkOrder = false;
            that.orderView.push(viewItem);
            }
          }
          var ordersToSave = [];  // now include all orders from prev order view in wo
          for (var i = 0; i < that.orderView.length; i++) {
            if (that.prevOrdersInWo.filter(function (po) {
                return po.attributes.order.number === that.orderView[i].attributes.order.number
              }).length > 0) { // order was in prev wo
              //that.orderView[i].attributes.isRequery = true;
              ordersToSave.push(that.orderView[i]);
              that.orderView[i].isToBeTemporarilyDeleted = true;
            }
          }
          that.orderView = that.orderView.filter(function (ov) {
            return !ov.isToBeTemporarilyDeleted
          });
          api.saveObjects(ordersToSave)
            .then(function () {
              api.queryWorkOrder(woId) // we assume that the only records in wo are those just stored
                .then(function (ov) { // requery them to get their ids
                  for (var k = 0; k < ov.length; k++) {
                    that.workOrder.push(ov[k]);
                    ov[k].isInWorkOrder = true;
                    that.orderView.push(ov[k])
                  }
                  that.orderView.sort(function (a, b) {
                    if (a.attributes.order.eventDate > b.attributes.order.eventDate) {
                      return 1
                    } else {
                      return -1
                    }
                  });
                  that.createSmallOrderView();
                })
            })
        });
    };

    this.createSmallOrderView = function () {
      this.woOrders = this.workOrder.filter(function (wo) {
        return wo.attributes.domain === 0
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
            that.createSmallOrderView()
          })
      } else {
        var temp = this.workOrder.filter(function (wo, woInd) {
          if (wo.id === that.orderView[ind].id) {
            indToDelete = woInd;
            return true;
          }
        });
        that.workOrder.splice(indToDelete, 1);
        api.deleteObj(that.orderView[ind])
          .then(function (obj) {
            // create new item with same content as deleted one so we can restore it in DB if user changes his mind
            var newItem = api.initWorkOrder();
            newItem.attributes = obj.attributes;
            that.orderView[ind] = newItem;
            that.createSmallOrderView()
          })
      }
      for (var dd = 1; dd < 4; dd++) {                     // set all further domains as invalid
        this.woIndex.attributes.domainStatus[dd] = false;
      }
      api.saveObj(this.woIndex);
    };

    this.selectOrders = function () {
      var that = this;
      var ackDelModal = $modal.open({
        templateUrl: 'app/partials/workOrder/ackDelete.html',
        controller: 'AckDelWorkOrderCtrl as ackDelWorkOrderModel',
        size: 'sm'
      });

      ackDelModal.result.then(function (isDelete) {
        if (isDelete) {
          that.isActiveTab = [true, false, false, false]; // show orders tab
          // first keep orders in existing work order so they will be inserted in the new wo
          that.prevOrdersInWo = that.workOrder.filter(function (o) {
            return o.attributes.domain === 0
          });
          that.orderView = [];
          that.destroyWorkOrderDomains(0)
            .then(function () {
              that.workOrder = [];
              that.workOrderByCategory = [];
              that.woOrders = [];
              that.createOrderView();
              that.ordersDisplayMode = 'select';
            })
        } else {
          that.ordersDisplayMode = 'show';
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
        })
    };

    this.splitWorkOrder = function () {
      // split wo by domains and categories
      this.workOrderByCategory = [];
      for (var d = 1; d < 4; d++) {
        this.workOrderByCategory[d] = []; // init array of categories per domain
      }
      for (var i = 0; i < this.workOrder.length; i++) {
        var wo = this.workOrder[i].attributes;
        if (wo.domain > 0) {
          var catInd;
          var temp = this.workOrderByCategory[wo.domain].filter(function (c, ind) {
            if (c.category.tId === wo.category.tId) {
              catInd = ind;
              return true;
            }
          });
          if (!temp.length) {  // if category appears for 1st time, create it's object
            this.workOrderByCategory[wo.domain].splice(0, 0, {category: wo.category, list: []});
            catInd = 0;
          }
          this.workOrderByCategory[wo.domain][catInd].list.push(this.workOrder[i]); //add wo item to proper category list
        }
      }

      // sort categories of each domain and items within category
      for (d = 1; d < 4; d++) {
        this.workOrderByCategory[d].sort(function (a, b) {
          return a.category.order - b.category.order;
        });
        for (var c = 0; c < this.workOrderByCategory[d].length; c++) {
          this.workOrderByCategory[d][c].list.sort(function (a, b) {
            if (a.attributes.productDescription < b.attributes.productDescription) {
              return -1
            } else {
              return 1
            }
          })
        }
      }
    };

    this.createWorkOrderDomain = function (targetDomain) {
      var that = this;
      this.ordersDisplayMode = 'show';
      // destroy existing work order items of target and higher domains
      this.destroyWorkOrderDomains(targetDomain)
        .then(function () {
        that.workOrder = that.workOrder.filter(function (wo) {
          return wo.attributes.domain < targetDomain;
        });
        if (targetDomain === 1) {
          that.createOrderItems();
        } else {
          that.createComponents(targetDomain);
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
      })
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
      })
    };

    this.setIsForToday = function (woItem) {
      if (woItem.attributes.isForToday) {
        woItem.attributes.quantityForToday = woItem.attributes.quantity;
      };
      this.saveWI(woItem);
    };

      this.delItem = function (dom, cat, item) {
      var that = this;
      api.deleteObj(this.workOrderByCategory[dom][cat].list[item])
        .then(function (obj) {
        that.workOrder = that.workOrder.filter(function (wo) {
          return wo.id !== obj.id;
        });
        that.workOrderByCategory[dom][cat].list.splice(item, 1);
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
      })

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
            })
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
          console.log ('updating '+saveList.length+' items');
          api.saveObjects(saveList)
            .then(function () {
              console.log('deleting '+deleteList+' items');
              api.deleteObjects(deleteList)
                .then(function () {
                  that.workOrder = that.workOrder.filter (function(wo) {
                    return !wo.isToDelete
                  });
                  that.splitWorkOrder();
                  console.log('updated workorder:')
                  console.log(that.workOrder);
                  that.woIndex.attributes.domainStatus[3] = false;
                  api.saveObj(that.woIndex);
                })
            })
        }
      })
     };

    this.switchWorkOrders = function () {
      var that = this;
      woId = this.woIndex.attributes.woId;
      this.ordersDisplayMode = 'show';
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
    this.switchWorkOrders();
  });
