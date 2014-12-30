'use strict';

/* Controllers */
angular.module('myApp')
  .controller('WorkOrderCtrl', function (api, $state, $filter, $modal,
                                         lov, catalog, markedOrders, inWorkOrders, workOrder) {

    this.destroyWorkOrder = function (domain,i) { // destroy recursively first item in array
      var that = this;
      if (i>=this.workOrder.length) {
        return;
      }
      if (this.workOrder[i].attributes.domain<domain) {  // don't destroy items of prior domains
        that.destroyWorkOrder(domain,i+1);
      } else {
        api.deleteObj(this.workOrder[i])
          .then(function () {
          that.workOrder.splice(i, 1); // remove item
          that.destroyWorkOrder(domain,i+1);  // destroy the rest
        })
      }
    };

    this.createOrderItems = function () {
      var workItemInd;
      for (var i=0;i<this.markedOrders.length;i++) {
        var items = this.markedOrders[i].attributes.items;
        for (var j=0;j<items.length;j++) {
          var item = items[j];
          var temp = this.workOrder.filter (function (workItem, ind) {
            if (workItem.attributes.catalogId===item.catalogId) {
              workItemInd = ind;
              return true;
            }
          });
          if (temp.length>0) {  // item already in list, just add quantity
            console.log('found existing item');
            console.log(item);
            console.log(temp[0]);
            this.workOrder[workItemInd].attributes.quantity += item.quantity;
          } else { // create new item
            console.log('creating new item');
            console.log(item);
            var workItem = api.initWorkOrder();
            workItem.attributes.catalogId = item.catalogId;
            // TODO: for cleanliness, productDescription should be taken from catalog. it might have been edited in order
            workItem.attributes.productDescription = item.productDescription;
            workItem.attributes.quantity = item.quantity;
            workItem.attributes.productionQuantity = item.productionQuantity;
            workItem.attributes.category = item.category;
            workItem.attributes.domain = 1;
            workItem.attributes.measurementUnit = item.measurementUnit;
            this.workOrder.push(workItem);
          }
        }
      }
    };

    this.createComponents = function (targetDomain) {

    };

    this.saveWO = function (domain,i) {

      var that = this;
      if (i>=this.workOrder.length) {
        return;
      }
      if (this.workOrder[i].attributes.domain !== domain) {
        that.saveWO(domain,i+1)
      } else {
        api.saveObj(this.workOrder[i])
          .then(function () {
          that.saveWO(domain, i + 1);
        })
      }
    };

    this.saveWorkOrder = function (domain) {
      this.saveWO(domain,0);
    };

    this.splitWorkOrder = function () {
      // split wo by domains and categories
      this.workOrderByCategory = [];
      for (var d = 1; d < 4; d++) {
        this.workOrderByCategory[d] = []; // init array of categories per domain
      }
      for (var i = 0; i < this.workOrder.length; i++) {
        var wo = this.workOrder[i].attributes;
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
      // destroy existing work order items of target and higher domains
      this.destroyWorkOrder(targetDomain,0);

      if (targetDomain===1) {
        this.createOrderItems();
      } else {
        this.createComponents(targetDomain);
      }

      this.saveWorkOrder(targetDomain);

      this.splitWorkOrder();

/*
      for (var i=0;i<inWorkOrders.length;i++) {
        inWorkOrders[i].attributes.isInWorkOrder = false;
        api.saveObj(inWorkOrders[i]);
      }

      for (var j=0;j<markedOrders.length;j++) {
        markedOrders[j].attributes.isMarkedForWorkOrder = false;
        markedOrders[j].attributes.isInWorkOrder = true;
        api.saveObj(markedOrders[j]);
      }
*/
    };

    this.setQuantity = function (woItem) {
      api.saveObj(woItem);
    };

    this.delItem = function (dom,cat,item) {
      var that = this;
      api.deleteObj(this.workOrderByCategory[dom][cat].list[item])
        .then (function () {
         that.workOrderByCategory[dom][cat].list.splice(item,1);
        });
    };

    // main block
    this.catalog = catalog;
    this.domains = lov.domains;
    this.markedOrders = markedOrders;
    this.inWorkOrders = inWorkOrders;
    this.workOrder = workOrder;
    this.splitWorkOrder();

  });
