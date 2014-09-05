'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CustomerCtrl', function(api, currentCustomer) {

// test if existing customer or new one
    if (currentCustomer) {
      this.customer = currentCustomer;
    } else {
      this.customer = api.initCustomer();
    }

    this.submitCustomer = function (isValid) {
      if (isValid) {
        this.saveCustomer ();
      } else {
        alert ('פרטי לקוח לא תקינים');
      }

    }

    this.saveCustomer = function () {
      api.saveObj (this.customer);
    };

//TODO: clicking "new customer" link when page is shown with existing customer, does not refresh
//TODO: delete button not shown after new customer is created
//TODO: route to customerList page after deletion
    this.deleteCustomer = function () {
      api.deleteObj (this.customer);
    };
  });




