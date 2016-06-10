'use strict';

angular.module('myApp')
  .controller('ModalCustomerCtrl', function ($modalInstance, api, customerService, customers, currentCustomerId, modalHeader, isOptionalSelect)
  {
    // state diagram
    //--------------
    //
    //       open not selected                                 open selected                                                  |
    //         |                                                   |
    //         V                                                   V
    //      +--------+                                        +--------+
    //      |  New   |  -------------- update --------------> |Selected|
    //      |        | <------------ deselect, new ---------- |        |
    //      +--------+                                        +--------+
    //
    this.selectLine = function (ind) {
      var that = this;
      if (this.filteredCustomers[ind].isSelected) { // if current line is selected, just turn it off
        if (this.isCustomerChanged) {
          this.filteredCustomers[ind] = angular.copy(this.backupCustomer);   // undo changes
        }
        this.filteredCustomers[ind].isSelected = false;
        this.currentCustomer = {};
        this.newCustomer();
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
        this.state = 'selected';
        this.filteredCustomers = customerService.filterList(this.customers,this.currentCustomer.attributes,false);
      }
      this.isCustomerChanged = false;
    };

    this.customerChanged = function () {
      this.isCustomerChanged = true;
      this.filteredCustomers = customerService.filterList(this.customers,this.currentCustomer.attributes,true);
    };

    this.clearChanges = function () {
      if (this.state === 'new') {
        this.newCustomer();
      } else {
        this.customers.forEach(function (cust, ind) {
          if (cust.id === that.currentCustomer.id) {
            that.currentCustomer = that.customers[ind] = angular.copy(that.backupCustomer);   // undo changes
          }
        });
        this.filteredCustomers = customerService.filterList(this.customers,this.currentCustomer.attributes,false);
        this.isCustomerChanged = false;
      }
    };

    this.updateCustomer = function () {
      var that = this;
      if (this.state === 'new') {
        this.currentCustomer.isSelected = true;
        this.customers.splice(0, 0, this.currentCustomer);
        this.state = 'selected';
      }
      customerService.sortList(this.customers);
      this.filteredCustomers = customerService.filterList(this.customers,this.currentCustomer.attributes,false);
      return api.saveObj(this.currentCustomer)
        .then(function (obj) {
        that.currentCustomer = obj;
        that.isCustomerChanged = false;
      });
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
      this.currentCustomer.attributes.lastName = '';
      this.currentCustomer.attributes.mobilePhone = '';
      this.currentCustomer.attributes.homePhone = '';
      this.currentCustomer.attributes.workPhone = '';
      this.currentCustomer.attributes.email = '';
      this.currentCustomer.attributes.address = '';
      this.state = 'new';
      this.filteredCustomers = customerService.filterList(this.customers,this.currentCustomer.attributes,true);
      this.isCustomerChanged = false;
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
    customerService.sortList(this.customers);
    if (currentCustomerId) {
      this.currentCustomer = this.customers.filter(function (cust, ind) {
        if (cust.id === currentCustomerId) {
          that.customers[ind].isSelected = true;
          return true;
        }
      })[0];
      this.state = 'selected';
      this.filteredCustomers = customerService.filterList(this.customers,this.currentCustomer.attributes,false);
    } else {
      this.currentCustomer = {};
      this.newCustomer();
    }
    this.backupCustomer = angular.copy(this.currentCustomer); // to undo changes on change focus
    this.isCustomerChanged = false;
    this.modalHeader = modalHeader;

  });
