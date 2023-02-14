'use strict';

angular.module('myApp')
  .controller('AckDelWorkOrderCtrl', function ($modalInstance, workOrderType) {

    this.workOrderType = workOrderType;

  this.setYes = function () {
    $modalInstance.close(true);
  };

  this.setNo = function () {
    $modalInstance.close(false);
  };
})

  .controller('WorkOrderBackTraceCtrl', function ($modalInstance, $filter, workOrderItem, workOrder, domains) {

  var seq = 0;
  var ident = ['', '', '-->', '---->', '------>'];

    var dayName = function(dat) {
      var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
      return dayNames[dat.getDay()]+"'";
    };


    function generateTrace(root, gen, sibling, quantity, workOrder, backTrace) {
    root.seq = seq++;
    root.generation = gen;
    root.isShow = gen === 1;
    root.sibling = sibling;
    root.ident = ident[gen];
    root.quantity = quantity;
    root.domain = domains[root.properties.domain];
    if (root.properties.domain === 0) {
      root.customer = root.view.customer.firstName;
      root.day = dayName(root.properties.order.eventDate);
    }
    backTrace.push(root);
    if (root.properties.domain > 0) {
      root.properties.backTrace.forEach(function(bti, ind) {
        var son = angular.copy(workOrder.filter(function (wo) {
          return wo.id === bti.id;
        })[0]);
        son.father = root.seq;
        generateTrace(son, gen + 1, ind, bti.quantity, workOrder, backTrace);
      });
    }
  }

  function findDescendants (root, backTrace) {
      var descendants = [];
      var cnt = 0;
      backTrace.forEach(function(bt) {
        if (bt.father === root.seq) {
          cnt++;
          descendants.push(bt);
        }
      });
      if (cnt) {
        descendants.forEach(function(descendant) {
          descendants = descendants.concat(findDescendants(descendant,backTrace));
        });
      }
      return descendants;
  }

  this.setExpand = function(ind) {
      var that = this;
     if (this.backTrace[ind].isExpand) {
        this.backTrace.forEach(function(bt) {
          if (bt.father === that.backTrace[ind].seq) {
            bt.isShow = true;
          }
        });
        } else {
       var descendants = findDescendants(that.backTrace[ind], that.backTrace);
       descendants.forEach(function(bt) {
          bt.isExpand = false;
          bt.isShow = false;
       });
      }
  };

  this.workOrderItem = workOrderItem;
  var workOrder2 = angular.copy(workOrder);
    workOrder2.forEach(function(woi) {
      if (woi.properties.domain > 0) {
        woi.properties.backTrace.sort(function (a, b) {
          return b.quantity - a.quantity;
        });
      }
  });
    var workOrderItem2 = angular.copy(workOrderItem);
    workOrderItem2.properties.backTrace.sort(function (a, b) {
      return b.quantity - a.quantity;
    });
  this.backTrace = [];
  generateTrace(workOrderItem2, 0, 0, 0, workOrder2, this.backTrace);

  this.done = function () {
    $modalInstance.close();
  };


});

