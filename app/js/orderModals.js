'use strict';

/* Controllers */
angular.module('myApp')
.controller ('AckDelOrderCtrl', function($modalInstance, order) {
  this.order = order;
  this.customer = order.view.customer;
  this.days = Math.round((order.attributes.eventDate - new Date())/(24*3600*1000));
  this.daysDirection = 'בעוד';
  if (this.days<0) {
    this.days = -this.days;
    this.daysDirection = 'לפני';
  }

  this.setYes = function() {
    $modalInstance.close (true);
  };

  this.setNo = function() {
    $modalInstance.close (false);
  };



});