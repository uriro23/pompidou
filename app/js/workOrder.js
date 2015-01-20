'use strict';

/* Controllers */
angular.module('myApp')
  .controller('WorkOrderCtrl', function (api, $state, $filter, $modal, $q, $rootScope,
                                         lov, catalog, allCategories, measurementUnits, today,
                                         customers, futureOrders, workOrder) {

      $rootScope.hideMenu = false;
      var user = api.getCurrentUser();
      if (user) {
        $rootScope.username = user.attributes.username;
      } else {
        $state.go('login');
      }
      $rootScope.title = lov.company + ' - פקודת עבודה';


    this.destroyWorkOrderDomains = function (domain) {
      var that = this;
      var promise = $q.defer();
      var woItemsToDelete = this.workOrder.filter(function (wo) {
        return wo.attributes.domain >= domain;
      });
      return api.deleteObjects(woItemsToDelete);
    };


     this.createOrderItems = function () {
       var workItem;
       var workItemInd;
       for (var i=0;i<this.workOrder.length;i++) {
         var inWorkItem = this.workOrder[i].attributes;
        if (inWorkItem.domain === 0) {
          var items = inWorkItem.order.items;
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
              workItem.attributes.backTrace.push({
                id:       this.workOrder[i].id,
                domain:   0,
                quantity: item.quantity
              });
            } else { // create new item
              workItem = api.initWorkOrder();
              workItem.attributes.catalogId = item.catalogId;
              workItem.attributes.productDescription = catalog.filter(function (cat) {
                return cat.id === item.catalogId;
              })[0].attributes.productDescription;
              workItem.attributes.quantity = item.quantity;
              workItem.attributes.category = item.category;
              workItem.attributes.domain = 1;
              workItem.attributes.measurementUnit = item.measurementUnit;
              workItem.attributes.backTrace = [{
                id:       this.workOrder[i].id,
                domain:   0,
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
      for (var i=0;i<this.workOrder.length;i++) {
        var inWorkItem = this.workOrder[i].attributes;
        if (inWorkItem.domain > 0) {  // skip orders
          var inCatItem = catalog.filter(function (cat) {
            return cat.id === inWorkItem.catalogId;
          })[0].attributes;
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
                var oldQuantity = workItem.attributes.quantity;
                workItem.attributes.quantity += inWorkItem.quantity * component.quantity / inCatItem.productionQuantity;
                workItem.attributes.backTrace.push({
                  id:       this.workOrder[i].id,
                  domain:   inWorkItem.domain,
                  quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity
                });
              } else {
                var outCatItem = catalog.filter(function (cat) {
                  return cat.id === component.id;
                })[0].attributes;
                workItem = api.initWorkOrder();
                workItem.attributes.catalogId = component.id;
                workItem.attributes.productDescription = outCatItem.productDescription;
                workItem.attributes.quantity = inWorkItem.quantity * component.quantity / inCatItem.productionQuantity;
                workItem.attributes.category = allCategories.filter(function (cat) {
                  return cat.tId === outCatItem.category;
                })[0];
                workItem.attributes.domain = targetDomain;
                workItem.attributes.measurementUnit = measurementUnits.filter(function (mes) {
                  return mes.tId === outCatItem.measurementUnit;
                })[0];
                workItem.attributes.backTrace = [{
                  id:       this.workOrder[i].id,
                  domain:   inWorkItem.domain,
                  quantity: inWorkItem.quantity * component.quantity / inCatItem.productionQuantity
                }];
                this.workOrder.push(workItem);
              }
            }
          }
        }
      }

    };

    this.saveWorkOrder = function (domain) {
      var woItemsToSave = this.workOrder.filter(function (wo) {
        return wo.attributes.domain === domain;
      });
      return api.saveObjects(woItemsToSave);
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
      // destroy existing work order items of target and higher domains
      this.destroyWorkOrderDomains(targetDomain)
        .then (function () {
        that.workOrder = that.workOrder.filter(function (wo) {
          return wo.attributes.domain < targetDomain;
        });
          if (targetDomain===1) {
            that.createOrderItems();
          } else {
            that.createComponents(targetDomain);
          }
          that.saveWorkOrder(targetDomain)
            .then(function () {
                that.splitWorkOrder();
                for (var d=0;d<4;d++) {
                  that.isActiveTab[d] = false;
                  that.isActiveTab[targetDomain] = true;
                }
                that.domainStatuses.attributes.status[targetDomain] = true; // the domain just created is valid
                for (var dd=targetDomain+1;dd<4;dd++) {                     // all further domains - invalid
                  that.domainStatuses.attributes.status[dd] = false;
                }
                api.saveObj(that.domainStatuses);
              });
      })
    };

      // create a view of orders in WO combined with all future orders
      this.createOrderView = function () {
        var that = this;
        this.orderView = [];
        for (var i=0;i<this.workOrder.length;i++) {
          if (this.workOrder[i].attributes.domain === 0) {
            this.workOrder[i].isInWorkOrder = true;
            this.orderView.push(this.workOrder[i]);
          }
        }
        for (var j=0;j<futureOrders.length;j++) {
          var temp = this.workOrder.filter(function (woItem) {  // if order already in WO, skip it
            return woItem.attributes.domain === 0 && woItem.attributes.order.id === futureOrders[j].id
         });
          if (temp.length === 0) {
            var viewItem = api.initWorkOrder();
               // create the object for now, but we don't store it until user decides to include it in WO
            viewItem.attributes.domain = 0;
            viewItem.attributes.order = futureOrders[j].attributes;
            viewItem.attributes.order.id = futureOrders[j].id;
            viewItem.attributes.customer = customers.filter(function (cust) {
              return cust.id === futureOrders[j].attributes.customer;
            })[0].attributes;
            viewItem.isInWorkOrder = false;
            this.orderView.push(viewItem);
          }
        }
        this.orderView.sort(function (a,b) {
          return a.attributes.order.eventDate > b.attributes.order.eventDate;
        })
      };

      this.setOrderInWorkOrder = function (ind) {
        var that = this;
        var indToDelete;
        if (this.orderView[ind].isInWorkOrder) {
          this.workOrder.push(this.orderView[ind]);
          api.saveObj(this.orderView[ind]);
        } else {
          var temp = this.workOrder.filter(function (wo, woInd) {
            if (wo.id === that.orderView[ind].id) {
              indToDelete = woInd;
              return true;
            }
          });
          this.workOrder.splice(indToDelete,1);
          api.deleteObj(this.orderView[ind])
              .then(function (obj) {
                  // create new item with same content as deleted one so we can restore it in DB if user changes his mind
                var newItem = api.initWorkOrder();
                newItem.attributes = obj.attributes;
                that.orderView[ind] = newItem;
              })
        }
        for (var dd=1;dd<4;dd++) {                     // set all further domains as invalid
          this.domainStatuses.attributes.status[dd] = false;
        }
        api.saveObj(this.domainStatuses);
      };
      
    this.setQuantity = function (woItem,domain) {
      api.saveObj(woItem)
        .then (function () {
          for (var dd=domain+1;dd<4;dd++) {                     // set all further domains as invalid
            that.domainStatuses.attributes.status[dd] = false;
          }
          api.saveObj(that.domainStatuses);
      })
    };

    this.delItem = function (dom,cat,item) {
      var that = this;
      api.deleteObj(this.workOrderByCategory[dom][cat].list[item])
        .then (function (obj) {
          that.workOrder = that.workOrder.filter(function (wo) {
            return wo.id !== obj.id;
          });
          that.workOrderByCategory[dom][cat].list.splice(item,1);
          for (var dd=dom+1;dd<4;dd++) {                     // set all further domains as invalid
            that.domainStatuses.attributes.status[dd] = false;
          }
          api.saveObj(that.domainStatuses);
          });
    };

      this.backInfo = function (woItem) {
        var backTraceModal = $modal.open ({
          templateUrl: 'partials/workOrderBackTrace.html',
          controller: 'WorkOrderBackTraceCtrl as workOrderBackTraceModel',
          resolve: {
            workOrderItem: function() {
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

        backTraceModal.result.then (function () {
        })

      };

    // main block
    var that = this;
    this.catalog = catalog;
    this.domains = lov.domains;
    this.workOrder = workOrder;
    this.createOrderView(); // order view is a logical OR of future orders and orders in work order. just for display
    this.isActiveTab = [true,false,false,false];
    this.splitWorkOrder();
    api.queryWorkOrderDomains()
      .then (function (doms) {
        if (doms.length === 0) {  // first time - initialize object
          that.domainStatuses = api.initWorkOrderDomains();
          that.domainStatuses.attributes.status = [true,false,false,false];
          api.saveObj(that.domainStatuses);
         } else {
          that.domainStatuses = doms[0];
        }
      });
  });