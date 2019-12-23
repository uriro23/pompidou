'use strict';

angular.module('myApp')
  .controller('TasksCtrl', function ($scope, orderService, api) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.taskTypes = $scope.orderModel.taskTypes;
    this.phases = $scope.orderModel.phases;
    this.referralSources = $scope.orderModel.referralSources;
    this.cancelReasons = $scope.orderModel.cancelReasons;
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
      if (detail.attributeName) {
        this.order.attributes.taskData[detail.attributeName] = detail.inputText;
      }
      detail.isDone = Boolean(detail.inputText);
      if (detail.changedAttribute) {
        this.order.attributes.taskData[detail.changedAttribute] = true;
      }
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

    this.detailBooleanSet = function(detail) {
      if (detail.attributeName) {
        this.order.attributes.taskData[detail.attributeName] = detail.boolean;
      }
      detail.isDone = detail.boolean;
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

    this.setReferralSource = function(detail) {
      this.order.attributes.referralSource = this.order.view.referralSource.tId;
      detail.isDone = true;
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

  this.setCancelReason = function(detail) {
      this.order.attributes.cancelReason = this.order.view.cancelReason.tId;
      detail.isDone = true;
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

  this.saveAddress = function(detail) {
    var that = this;
    api.queryCustomers(this.order.attributes.customer)
      .then(function(custs) {
        custs[0].attributes.address = that.order.attributes.taskData.address;
       api.saveObj(custs[0])
         .then(function(c) {
           if (detail.changedAttribute) {
             that.order.attributes.taskData[detail.changedAttribute] = false;
           }
           orderService.checkTasks(that.order);
           that.orderChanged('tasks');
         })
       });
  };
  });
