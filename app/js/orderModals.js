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


  .controller('CustomerCtrl', function($modalInstance, api, customers, currentCustomerId) {

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
        if (this.isCustomerChanged) {
          this.filteredCustomers[ind] = this.backupCustomer;   // undo changes
        }
        this.filteredCustomers[ind].isSelected = false;
        this.currentCustomer = {};
      } else {
        if (this.currentCustomer) { // turn off previously selected item
          var temp = this.filteredCustomers.filter (function (cust,ind) {
            if (cust.id===that.currentCustomer.id) {
              if (that.isCustomerChanged) {
                that.filteredCustomers[ind] = that.backupCustomer;   // undo changes
              }
              that.filteredCustomers[ind].isSelected = false;
              return true;
            }
          })
        }
        this.filteredCustomers[ind].isSelected = true; // select current line
        this.currentCustomer = this.filteredCustomers[ind];
        this.backupCustomer = angular.copy(this.currentCustomer);
      }
      this.isCustomerChanged = false;
    };

    this.customerChanged = function () {
      this.isCustomerChanged = true;
    };

    this.updateCustomer = function () {
      var that = this;
      return api.saveObj(this.currentCustomer)
        .then (function () {
          that.isCustomerChanged = false;
        })

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
    // mark current customer's line as selected
    var that = this;
    this.currentCustomer = this.customers.filter (function (cust,ind) {
      if (cust.id===currentCustomerId) {
        that.customers[ind].isSelected = true;
        return true;
      }
    })[0];
    this.backupCustomer = angular.copy(this.currentCustomer); // do undo changes on change focus
    this.isCustomerChanged = false;
    this.filterText = '';
    this.filterList();

  });