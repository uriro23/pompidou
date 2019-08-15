'use strict';

angular.module('myApp')
  .controller('TasksCtrl', function ($scope, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.taskTypes = $scope.orderModel.taskTypes;
    this.phases = $scope.orderModel.phases;
    this.referralSources = $scope.orderModel.referralSources;
    this.cancelReasons = $scope.orderModel.cancelReasons;
    this.foodTypes = $scope.orderModel.foodTypes;
    this.user = $scope.orderModel.user;

    this.tasks = this.order.view.tasks;

    this.orderChanged = function (field) {
      orderService.orderChanged(this.order, field)
    };

    this.taskChecked = function(task) {
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

    this.detailTextChanged = function(detail) {
      this.order.attributes.taskData[detail.attributeName] = detail.inputText;
      detail.isDone = Boolean(detail.inputText);
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

    this.detailBooleanSet = function(detail) {
      this.order.attributes.taskData[detail.attributeName] = detail.boolean;
      this.isDone = true;
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

    this.setReferralSource = function(detail) {
      this.order.attributes.referralSource = this.order.view.referralSource.tId;
      this.orderChanged('tasks');
    };

    this.setFoodType = function(detail) {
      if (this.order.view.foodType) {
        this.order.attributes.foodType = this.order.view.foodType.tId;
      } else {
        delete this.order.attributes.foodType;
        this.order.delAttributes = {foodType:true};
      }
      this.orderChanged('tasks');
    };

    this.setCancelReason = function(detail) {
      this.order.attributes.cancelReason = this.order.view.cancelReason.tId;
      this.orderChanged('tasks');
    };

  });
