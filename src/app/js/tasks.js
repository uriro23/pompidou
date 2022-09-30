'use strict';

angular.module('myApp')
  .controller('TasksCtrl', function ($scope, orderService, api) {

    // taskDetail types
    // ----------------
    //
    // 0: desctription is just a comment for display
    // 1: isDone boolean for required fields of order (like customer, date, time)
    // 2: updateable single line text
    // 3: read only text
    // 4: updateable multi line text
    // 5: updateable boolean value

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
        this.order.properties.taskData[detail.attributeName] = detail.inputText;
      }
      detail.isDone = Boolean(detail.inputText);
      if (detail.changedAttribute) {
        this.order.properties.taskData[detail.changedAttribute] = true;
      }
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

    this.detailBooleanSet = function(detail) {
      if (detail.attributeName) {
        this.order.properties.taskData[detail.attributeName] = detail.boolean;
      }
      detail.isDone = detail.boolean;
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

    this.setReferralSource = function(detail) {
      this.order.properties.referralSource = this.order.view.referralSource.tId;
      detail.isDone = true;
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

  this.setCancelReason = function(detail) {
      this.order.properties.cancelReason = this.order.view.cancelReason.tId;
      detail.isDone = true;
      orderService.checkTasks(this.order);
      this.orderChanged('tasks');
    };

  this.saveCustomerAttribute = function(detail) {
    var that = this;
    api.queryCustomers(this.order.properties.customer)
      .then(function(custs) {
        custs[0].properties[detail.attributeName] = that.order.properties.taskData[detail.attributeName];
       api.saveObj(custs[0])
         .then(function(c) {
           if (detail.changedAttribute) {
             that.order.properties.taskData[detail.changedAttribute] = false;
           }
           orderService.checkTasks(that.order);
           that.orderChanged('tasks');
         })
       });
  };
  });
