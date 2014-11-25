'use strict';

/* Controllers */
angular.module('myApp')
.controller ('AckDelOrderCtrl', function($modalInstance, order) {
  this.order = order;

  this.setYes = function() {
    $modalInstance.close (true);
  };

  this.setNo = function() {
    $modalInstance.close (false);
  };



});