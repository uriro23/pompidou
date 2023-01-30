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
  .controller('AckEndDayCtrl', function ($modalInstance, todaysPreps) {

    this.todaysPreps = todaysPreps;

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


  this.workOrderItem = workOrderItem;
  this.workOrder = workOrder;
  this.backTrace = [];
  generateTrace(workOrderItem, 0, 0, 0, workOrder, this.backTrace);

  this.done = function () {
    $modalInstance.close();
  };


});

