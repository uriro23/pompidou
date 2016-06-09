'use strict';

angular.module('myApp')

  .service('customerService', function () {

    this.filterList = function (customers, filterAttr) {
      var filteredCustomers = [];
      if (! (filterAttr.firstName ||   // if all attributes are empty - no filter at all
        filterAttr.lastName ||
        filterAttr.mobilePhone ||
        filterAttr.homePhone ||
        filterAttr.workPhone ||
        filterAttr.email)) {
        customers.forEach(function(cust) {  // clear matches of previous filter
          cust.matches = {};
        });
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
    };

     this.sortList = function (customers) {
      customers.sort(function (a, b) {
        if (a.attributes.firstName + a.attributes.lastName < b.attributes.firstName + b.attributes.lastName) {
          return -1
        } else {
          return 1
        }
      });
    }


  });
