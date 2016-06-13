'use strict';

angular.module('myApp')

  .service('customerService', function () {

    this.filterList = function (customers, filterAttr, isIncludePrefixMatch) {
      var filteredCustomers = [];
      var isPrefixMatch = false;
      if (! (filterAttr.firstName ||   // if all attributes are empty - no filter at all
        filterAttr.lastName ||
        filterAttr.mobilePhone ||
        filterAttr.homePhone ||
        filterAttr.workPhone ||
        filterAttr.email)) {
        customers.forEach(function(cust) {  // clear matches of previous filter
          cust.matches = {};
          cust.isUniqueMatch = false;  // meaning match in unique identifier such as phone, used to offer merge
        });
        filteredCustomers = customers;
      } else {
        filteredCustomers = customers.filter(function (cust) {
          var custAttr = cust.attributes;
          cust.matches = {};
          cust.matches.name = (filterAttr.firstName && custAttr.firstName === filterAttr.firstName &&
                              !(filterAttr.lastName && custAttr.lastName && custAttr.lastName !== filterAttr.lastName)) ||
                              (filterAttr.lastName && custAttr.lastName === filterAttr.lastName &&
                              !(filterAttr.firstName && custAttr.firstName && custAttr.firstName !== filterAttr.firstName));
          // a name match occurs if there is a match in one element and no contradiction in the other (missing is OK)
          cust.matches.mobilePhone =
            (filterAttr.mobilePhone && custAttr.mobilePhone === filterAttr.mobilePhone) ||
            (filterAttr.homePhone && custAttr.mobilePhone === filterAttr.homePhone) ||
            (filterAttr.workPhone && custAttr.mobilePhone === filterAttr.workPhone);
           cust.matches.homePhone =
             (filterAttr.mobilePhone && custAttr.homePhone === filterAttr.mobilePhone) ||
             (filterAttr.homePhone && custAttr.homePhone === filterAttr.homePhone) ||
             (filterAttr.workPhone && custAttr.homePhone === filterAttr.workPhone);
          cust.matches.workPhone =
            (filterAttr.mobilePhone && custAttr.workPhone === filterAttr.mobilePhone) ||
            (filterAttr.homePhone && custAttr.workPhone === filterAttr.homePhone) ||
            (filterAttr.workPhone && custAttr.workPhone === filterAttr.workPhone);
          cust.matches.email = filterAttr.email && custAttr.email === filterAttr.email;
          if (isIncludePrefixMatch) {
            isPrefixMatch = ((filterAttr.firstName || filterAttr.lastName) &&
            ((custAttr.firstName + custAttr.lastName).indexOf(filterAttr.firstName + filterAttr.lastName) === 0)) ||
              (filterAttr.mobilePhone && custAttr.mobilePhone.indexOf(filterAttr.mobilePhone) === 0) ||
              (filterAttr.homePhone && custAttr.mobilePhone.indexOf(filterAttr.homePhone) === 0) ||
              (filterAttr.workPhone && custAttr.mobilePhone.indexOf(filterAttr.workPhone) === 0) ||
              (filterAttr.mobilePhone && custAttr.homePhone.indexOf(filterAttr.mobilePhone) === 0) ||
              (filterAttr.homePhone && custAttr.homePhone.indexOf(filterAttr.homePhone) === 0) ||
              (filterAttr.workPhone && custAttr.homePhone.indexOf(filterAttr.workPhone) === 0) ||
              (filterAttr.mobilePhone && custAttr.workPhone.indexOf(filterAttr.mobilePhone) === 0) ||
              (filterAttr.homePhone && custAttr.workPhone.indexOf(filterAttr.homePhone) === 0) ||
              (filterAttr.workPhone && custAttr.workPhone.indexOf(filterAttr.workPhone) === 0) ||
              (filterAttr.email && custAttr.email.indexOf(filterAttr.email) === 0);
          }
          cust.isUniqueMatch =
          cust.matches.mobilePhone ||
          cust.matches.homePhone ||
          cust.matches.workPhone ||
          cust.matches.email;
          return cust.matches.name ||
            cust.matches.mobilePhone ||
            cust.matches.homePhone ||
            cust.matches.workPhone ||
            cust.matches.email ||
            isPrefixMatch;
        });
      }
      return filteredCustomers;
    };

     this.sortList = function (customers) {
      customers.sort(function (a, b) {
        if (a.attributes.firstName + a.attributes.lastName < b.attributes.firstName + b.attributes.lastName) {
          return -1;
        } else {
          return 1;
        }
      });
    };


  });
