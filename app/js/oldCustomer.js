'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OldCustomerCtrl', function($state, api, currentCustomer) {

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
      return api.saveObj(this.customer).then(function (obj) {
          if ($state.current.name === 'newCusomer') {
            $state.go ('editCustomer',{id:obj.id});
          }
      });
    };

    this.deleteCustomer = function () {
      return api.deleteObj (this.customer).then (function (obj) {
          $state.go ('customerList');
      })
    };
  });




