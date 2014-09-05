'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CustomerListCtrl', function(api) {
    this.customers = [];


    this.queryCustomers = function () {
      var that = this;
      api.queryCustomers().then(function (res) {
        that.customers = res;
      });
    };

    this.queryCustomers();
  });
