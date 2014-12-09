'use strict';

angular.module('myApp')
.controller ('AckDelOrderCtrl', function($modalInstance, order, today) {
  this.order = order;
  this.customer = order.view.customer;
  this.days = parseInt((order.attributes.eventDate - today)/(24*3600*1000));  // need parseInt because of DST difference
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
})

.controller('VatChangeCtrl', function($modalInstance, orderVat, currentVat) {
    this.orderVat = orderVat;
    this.currentVat = currentVat;
    this.action = 0;

    this.done = function() {
      $modalInstance.close(this.action);
    }
  });