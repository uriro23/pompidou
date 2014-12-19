'use strict';

angular.module('myApp')
.controller ('AckDelOrderCtrl', function($modalInstance, order, today) {
  this.order = order;
  this.currentCustomer = order.view.currentCustomer;
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
  })


  .controller('CustomerCtrl', function($modalInstance, customers, currentCustomer) {

    this.filterList = function () {
      var that = this;
      this.filteredCustomers = this.customers.filter(function (cust) {
        return  (cust.attributes.firstName.indexOf(that.filterText) > -1) ||
          (cust.attributes.lastName.indexOf(that.filterText) > -1) ||
          (cust.attributes.mobilePhone.indexOf(that.filterText) > -1) ||
          (cust.attributes.homePhone.indexOf(that.filterText) > -1) ||
          (cust.attributes.workPhone.indexOf(that.filterText) > -1) ||
          (cust.attributes.email.indexOf(that.filterText) > -1) ||
          (cust.attributes.address.indexOf(that.filterText) > -1);
      })
    };

    this.selectLine = function (ind) {
      var that = this;
      if (this.filteredCustomers[ind].isSelected) { // if current line is selected, just turn it off
        this.filteredCustomers[ind].isSelected = false;
        this.currentCustomer = {};
      } else {
        if (this.currentCustomer) { // turn off previously selected item
          var temp = this.filteredCustomers.filter (function (cust,ind) {
            if (cust.id===that.currentCustomer.id) {
              that.filteredCustomers[ind].isSelected = false;
              return true;
            }
          })
        }
        this.filteredCustomers[ind].isSelected = true; // select current line
        this.currentCustomer = this.filteredCustomers[ind];
      }
    };

    this.customerChanged = function () {
      this.isCustomerChanged = true;
    };

    this.doSelect = function() {
      $modalInstance.close(this.currentCustomer);
    };

    // make customers array easy for filtering - no undefined fields
    this.customers = customers.map(function (cust) {
      var c = cust;
      c.attributes.firstName = cust.attributes.firstName?cust.attributes.firstName:'';
      c.attributes.lastName = cust.attributes.lastName?cust.attributes.lastName:'';
      c.attributes.mobilePhone = cust.attributes.mobilePhone?cust.attributes.mobilePhone:'';
      c.attributes.homePhone = cust.attributes.homePhone?cust.attributes.homePhone:'';
      c.attributes.workPhone = cust.attributes.workPhone?cust.attributes.workPhone:'';
      c.attributes.email = cust.attributes.email?cust.attributes.email:'';
      c.attributes.address = cust.attributes.address?cust.attributes.address:'';
      c.isSelected = false;
      return c;
    });

    this.currentCustomer = currentCustomer;
    console.log(this.currentCustomer);
    // mark current customer's line as selected
    var that = this;
    var temp = this.customers.filter (function (cust,ind) {
      if (cust.id===currentCustomer.id) {
        console.log('found cust '+cust.attributes.firstName);
        that.customers[ind].isSelected = true;
        return true;
      }
    });
    this.isCustomerChanged = false;
    this.filterText = '';
    this.filterList();

  });