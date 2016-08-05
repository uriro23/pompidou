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
  var ident = ['', '-', '--', '---', '----'];

    var dayName = function(dat) {
      var dayNames = ['א','ב','ג','ד','ה','ו','ש'];
      return dayNames[dat.getDay()]+"'";
    };


    function generateTrace(root, gen, quantity, workOrder, backTrace) {
    root.expand = seq === 0 ? '-' : root.attributes.domain === 0 ? '' : '+';      // initially expand root item
    root.seq = seq++;
    root.generation = gen;
    root.ident = ident[gen];
    root.isShow = gen < 2; // initially show root once expanded
    root.quantity = quantity;
    root.domain = domains[root.attributes.domain];
    if (root.attributes.domain === 0) {
      root.attributes.productDescription =
        root.attributes.customer.firstName + ' ' + dayName(root.attributes.order.eventDate);
    }
    backTrace.push(root);
    if (root.attributes.domain > 0) {
      var bt = root.attributes.backTrace;
      //for (var i = 0; i < bt.length; i++) {
      bt.forEach(function(bti) {
        var son = angular.copy(workOrder.filter(function (wo) {
          return wo.id === bti.id;
        })[0]);
        if (!son) {
          console.log('cant find son in backtrace');
          console.log('father:');
          console.log(root);
          console.log('bt:');
          console.log(bt);
        } else {
          son.father = root.seq;
          generateTrace(son, gen + 1, bti.quantity, workOrder, backTrace);
        }
      });
    }
  }

  this.setExpand = function (item) {
    item.expand = item.expand === '-' ? '+' : item.expand === '+' ? '-' : '';  // reverse expansion
    var sons = this.backTrace.filter(function (itm) {      // get all sons of expanded / collapsed item
      return itm.father === item.seq;
    });
    for (var i = 0; i < sons.length; i++) {   // actually changes items in this.backTrace
      sons[i].isShow = item.expand === '-';
    }

  };

  this.isShowItem = function (item) {
    return item.isShow;
  };

  this.workOrderItem = workOrderItem;
  this.workOrder = workOrder;
  this.backTrace = [];
  generateTrace(workOrderItem, 0, 0, workOrder, this.backTrace);

  this.done = function () {
    $modalInstance.close();
  };


});

