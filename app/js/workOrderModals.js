'use strict';

angular.module('myApp')
    .controller ('WorkOrderBackTraceCtrl', function($modalInstance, workOrderItem, workOrder, domains) {

    var seq = 0;

    function generateTrace (root, quantity, workOrder,  backTrace) {
        root.seq = seq++;
        root.quantity = quantity;
        root.domain = domains[root.attributes.domain];
        if (root.attributes.domain === 0) {
            root.attributes.productDescription = 'אירוע ' +
                root.attributes.order.number + ' ' +
                root.attributes.customer.firstName + ' ' +
                root.attributes.customer.lastName
        }
        backTrace.push(root);
        if (root.attributes.domain > 0) {
             var bt = root.attributes.backTrace;
            for (var i = 0; i < bt.length; i++) {
                var son = angular.copy(workOrder.filter(function (wo) {
                    return wo.id === bt[i].id;
                })[0]);

                generateTrace(son, bt[i].quantity, workOrder, backTrace);
            }
        }
   }



    this.workOrderItem = workOrderItem;
    this.workOrder = workOrder;
    this.backTrace = [];
    generateTrace (workOrderItem, 0, workOrder, this.backTrace);

    this.done = function () {
      $modalInstance.close();
    }


    });

