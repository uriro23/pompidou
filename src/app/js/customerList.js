'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CustomerListCtrl', function ($rootScope, $state, $modal, api, lov, customers) {
    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - רשימת לקוחות';


    this.filterList = function () {
      var that = this;
      this.filteredCustomers = this.customers.filter(function (cust) {
        return ((cust.attributes.firstName+' '+cust.attributes.lastName).indexOf(that.filterText) > -1) ||
          (cust.attributes.mobilePhone.indexOf(that.filterText) > -1) ||
          (cust.attributes.homePhone.indexOf(that.filterText) > -1) ||
          (cust.attributes.workPhone.indexOf(that.filterText) > -1) ||
          (cust.attributes.email.indexOf(that.filterText) > -1) ||
          (cust.attributes.address.indexOf(that.filterText) > -1);
      });
  };

    this.sortList = function () {
      this.customers.sort(function (a, b) {
        if (a.attributes.firstName + a.attributes.lastName < b.attributes.firstName + b.attributes.lastName) {
          return -1
        } else {
          return 1
        }
      });
      this.filterList();
    };

    // main block

    this.customers = customers.map(function (cust) {
      var c = cust;
      c.attributes.firstName = cust.attributes.firstName ? cust.attributes.firstName : '';
      c.attributes.lastName = cust.attributes.lastName ? cust.attributes.lastName : '';
      c.attributes.mobilePhone = cust.attributes.mobilePhone ? cust.attributes.mobilePhone : '';
      c.attributes.homePhone = cust.attributes.homePhone ? cust.attributes.homePhone : '';
      c.attributes.workPhone = cust.attributes.workPhone ? cust.attributes.workPhone : '';
      c.attributes.email = cust.attributes.email ? cust.attributes.email : '';
      c.attributes.address = cust.attributes.address ? cust.attributes.address : '';
      c.isSelected = false;
      return c;
    });

    this.filterText = '';
    this.sortList();  // also does filter

  });
