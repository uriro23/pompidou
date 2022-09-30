'use strict';

angular.module('myApp')
  .controller('SummaryCtrl', function ($scope, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.taskTypes = $scope.orderModel.taskTypes;
    this.taskDetails = $scope.orderModel.taskDetails;
    this.phases = $scope.orderModel.phases;
    this.referralSources = $scope.orderModel.referralSources;
    this.cancelReasons = $scope.orderModel.cancelReasons;
    this.user = $scope.orderModel.user;

    this.orderDetails = this.order.properties.taskDetails;

    var that = this;

    this.details = [];
    this.taskDetails.forEach(function (detail) {
      if (that.orderDetails) {
        var oDetail = that.orderDetails.filter(function (oDet) {
          return oDet.tId === detail.tId;
        })[0];
      }
      if (oDetail) {
        if (oDetail.hasOwnProperty("boolean") ||
            oDetail.hasOwnProperty("inputText")) {
          var sDetail = {
            tId: detail.tId,
            description: detail.description,
            taskOrder: that.taskTypes.filter(function(task) {
              return task.tId === detail.task;
            })[0].order,
            detailOrder: detail.order,
            boolean: oDetail.boolean,
            inputText: oDetail.inputText
          };
          that.details.push(sDetail);
        }
      }
    });
    this.details.sort(function(a,b) {
      var res = a.taskOrder - b.taskOrder;
      if (res === 0) {
        res = a.detailOrder - b.detailOrder;
      }
      return res;
    })

    this.orderChanged = function (field) {
      orderService.orderChanged(this.order, field)
    };

  });
