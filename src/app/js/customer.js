'use strict';

angular.module('myApp')
  .controller('CustomerCtrl', function ($modalInstance, api, customers, currentCustomerId, modalHeader, isOptionalSelect) {

    this.filterList = function () {
      var that = this;
      this.filteredCustomers = [];
      if (this.filterText === '$') {
        this.filteredCustomers = this.customers.filter(function (cust) {
          return cust.isSelected;
        })
      }
      if (this.filteredCustomers.length === 0) {  // not looking for selected item or no item is selected
        this.filteredCustomers = this.customers.filter(function (cust) {
          return (cust.attributes.firstName.indexOf(that.filterText) > -1) ||
            (cust.attributes.lastName.indexOf(that.filterText) > -1) ||
            (cust.attributes.mobilePhone.indexOf(that.filterText) > -1) ||
            (cust.attributes.homePhone.indexOf(that.filterText) > -1) ||
            (cust.attributes.workPhone.indexOf(that.filterText) > -1) ||
            (cust.attributes.email.indexOf(that.filterText) > -1) ||
            (cust.attributes.address.indexOf(that.filterText) > -1);
        })
      }
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

    this.selectLine = function (ind) {
      var that = this;
      if (this.filteredCustomers[ind].isSelected) { // if current line is selected, just turn it off
        if (this.isCustomerChanged) {
          this.filteredCustomers[ind] = angular.copy(this.backupCustomer);   // undo changes
        }
        this.filteredCustomers[ind].isSelected = false;
        this.currentCustomer = {};
        this.isInputEnabled = false;
      } else {
        if (this.currentCustomer.id) { // turn off previously selected item
          var temp = this.filteredCustomers.filter(function (cust, ind) {
            if (cust.id === that.currentCustomer.id) {
              if (that.isCustomerChanged) {
                that.filteredCustomers[ind] = angular.copy(that.backupCustomer);   // undo changes
              }
              that.filteredCustomers[ind].isSelected = false;
              return true;
            }
          })
        }
        this.filteredCustomers[ind].isSelected = true; // select current line
        this.currentCustomer = this.filteredCustomers[ind];
        this.backupCustomer = angular.copy(this.currentCustomer);
        this.isInputEnabled = true;
      }
      this.isCustomerChanged = false;
    };

    this.customerChanged = function () {
      this.isCustomerChanged = true;
    };

    this.updateCustomer = function () {
      var that = this;
      if (this.isNewCustomer) {
        this.currentCustomer.isSelected = true;
        this.customers.splice(0, 0, this.currentCustomer);
        this.isNewCustomer = false;
      }
      this.filterText = '$';
      this.sortList();
      return api.saveObj(this.currentCustomer)
        .then(function (obj) {
        that.currentCustomer = obj;
        that.isCustomerChanged = false;
      })

    };

    this.newCustomer = function () {
      var that = this;
      if (this.currentCustomer.id) { // turn off previously selected item
        var temp = this.filteredCustomers.filter(function (cust, ind) {
          if (cust.id === that.currentCustomer.id) {
            if (that.isCustomerChanged) {
              that.filteredCustomers[ind] = angular.copy(that.backupCustomer);   // undo changes
            }
            that.filteredCustomers[ind].isSelected = false;
            return true;
          }
        })
      }
      this.currentCustomer = api.initCustomer();
      this.currentCustomer.attributes.firstName = '';
      this.currentCustomer.attributes.lasstName = '';
      this.currentCustomer.attributes.mobilePhone = '';
      this.currentCustomer.attributes.homePhone = '';
      this.currentCustomer.attributes.workPhone = '';
      this.currentCustomer.attributes.email = '';
      this.currentCustomer.attributes.address = '';
      this.isNewCustomer = true;
      this.isInputEnabled = true;
      this.filterList();
    };

    this.doSelect = function () {
      if (this.currentCustomer.id) {
        var cust = this.currentCustomer.attributes;
        cust.id = this.currentCustomer.id;
        $modalInstance.close(cust);
      } else if (isOptionalSelect) {
        $modalInstance.close({}); // if none selected, return empty object (if allowed)
      }
    };

    this.doCancel = function () {
      $modalInstance.dismiss();
    };

    // main block

    // make customers array easy for filtering - no undefined fields
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
    // mark current customer's line as selected
    var that = this;
    if (currentCustomerId) {
      this.currentCustomer = this.customers.filter(function (cust, ind) {
        if (cust.id === currentCustomerId) {
          that.customers[ind].isSelected = true;
          return true;
        }
      })[0];
      this.filterText = '$';
      this.isInputEnabled = true;
    } else {
      this.currentCustomer = {};
      this.filterText = '';
      this.isInputEnabled = false;
    }
    this.backupCustomer = angular.copy(this.currentCustomer); // to undo changes on change focus
    this.isCustomerChanged = false;
    this.isNewCustomer = false;
    this.modalHeader = modalHeader;

    this.sortList();  // also does filter

  });
