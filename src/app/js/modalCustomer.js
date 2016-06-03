'use strict';

angular.module('myApp')
  .controller('ModalCustomerCtrl', function ($modalInstance, api, customers, currentCustomerId, modalHeader, isOptionalSelect)
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
    function filterList (customers, filterAttr) {
      var filteredCustomers = [];
        if (! (filterAttr.firstName ||   // if all attributes are empty - no filter at all
          filterAttr.lastName ||
          filterAttr.mobilePhone ||
          filterAttr.homePhone ||
          filterAttr.workPhone ||
          filterAttr.email)) {
            filteredCustomers = customers;
        } else {
         filteredCustomers = customers.filter(function (cust) {
           var custAttr = cust.attributes;
           cust.matches = {};
           cust.matches.name = ((filterAttr.firstName || filterAttr.lastName) &&
              ((custAttr.firstName+custAttr.lastName).indexOf(filterAttr.firstName+filterAttr.lastName) === 0));
           cust.matches.mobilePhone =
             (filterAttr.mobilePhone && custAttr.mobilePhone.indexOf(filterAttr.mobilePhone) === 0) ||
             (filterAttr.homePhone && custAttr.mobilePhone.indexOf(filterAttr.homePhone) === 0) ||
             (filterAttr.workPhone && custAttr.mobilePhone.indexOf(filterAttr.workPhone) === 0);
           cust.matches.homePhone =
             (filterAttr.mobilePhone && custAttr.homePhone.indexOf(filterAttr.mobilePhone) === 0) ||
             (filterAttr.homePhone && custAttr.homePhone.indexOf(filterAttr.homePhone) === 0) ||
             (filterAttr.workPhone && custAttr.homePhone.indexOf(filterAttr.workPhone) === 0);
           cust.matches.workPhone =
             (filterAttr.mobilePhone && custAttr.workPhone.indexOf(filterAttr.mobilePhone) === 0) ||
             (filterAttr.homePhone && custAttr.workPhone.indexOf(filterAttr.homePhone) === 0) ||
             (filterAttr.workPhone && custAttr.workPhone.indexOf(filterAttr.workPhone) === 0);
           cust.matches.email = (filterAttr.email && custAttr.email.indexOf(filterAttr.email) === 0);
           return cust.matches.name ||
                  cust.matches.mobilePhone ||
                  cust.matches.homePhone ||
                  cust.matches.workPhone ||
                  cust.matches.email;
         });
        }
      return filteredCustomers;
    }

   function sortList (customers) {
      customers.sort(function (a, b) {
        if (a.attributes.firstName + a.attributes.lastName < b.attributes.firstName + b.attributes.lastName) {
          return -1
        } else {
          return 1
        }
      });
    }

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
        this.filteredCustomers = filterList(this.customers,this.currentCustomer.attributes);
      }
      this.isCustomerChanged = false;
    };

    this.customerChanged = function () {
      this.isCustomerChanged = true;
      this.filteredCustomers = filterList(this.customers,this.currentCustomer.attributes);
    };

    this.updateCustomer = function () {
      var that = this;
      if (this.state === 'new') {
        this.currentCustomer.isSelected = true;
        this.customers.splice(0, 0, this.currentCustomer);
        this.state = 'selected';
      }
      sortList(this.customers);
      this.filteredCustomers = filterList(this.customers,this.currentCustomer.attributes);
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
      this.filteredCustomers = filterList(this.customers,this.currentCustomer.attributes);
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
      this.state = 'selected';
    } else {
      this.currentCustomer = {};
      this.newCustomer();
    }
    this.backupCustomer = angular.copy(this.currentCustomer); // to undo changes on change focus
    this.isCustomerChanged = false;
    this.modalHeader = modalHeader;

    sortList(this.customers);
    this.filteredCustomers = filterList(this.customers,this.currentCustomer.attributes);
  });
