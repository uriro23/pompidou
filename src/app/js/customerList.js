'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CustomerListCtrl', function ($rootScope, $state, $modal, api,
                                            customerService, lov, customers, eventTypes) {
    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - רשימת לקוחות';

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
          this.filteredCustomers.forEach(function (cust, ind) {
            if (cust.id === that.currentCustomer.id) {
              if (that.isCustomerChanged) {
                that.filteredCustomers[ind] = angular.copy(that.backupCustomer);   // undo changes
              }
              that.filteredCustomers[ind].isSelected = false;
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
        this.filteredCustomers.forEach(function (cust, ind) {
          if (cust.id === that.currentCustomer.id) {
            if (that.isCustomerChanged) {
              that.filteredCustomers[ind] = angular.copy(that.backupCustomer);   // undo changes
            }
            that.filteredCustomers[ind].isSelected = false;
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


    function countOrders (customers) {
      var fieldList = ['customer'];
      api.queryAllOrders(fieldList)
        .then(function(orders) {
          customers.forEach(function (cust) {
            var t = orders.filter(function (ord) {
              return (ord.attributes.customer === cust.id)
            });
            cust.orderCount = t.length;
          })
        })
    }

    this.showOrders = function () {
      var that = this;
      var fieldList = [
        'orderStatus','noOfParticipants','eventDate','customer','eventTime','number',
        'exitTime','eventType','template','remarks','header'
      ];
      api.queryOrdersByCustomer(this.currentCustomer.id,fieldList)
        .then(function(ords) {
          that.customerOrders = ords;
          that.isShowOrders = true;
          that.customerOrders.forEach(function(ord) {
            ord.view = {
              'orderStatus': lov.orderStatuses.filter (function(st) {
                return st.id === ord.attributes.orderStatus;
              })[0],
              'eventType': ord.attributes.eventType ?
                eventTypes.filter(function (et) {
                  return et.tId === ord.attributes.eventType;
                })[0]
                : undefined
            }
          });
          that.customerOrders.sort (function(a,b) {
            return b.attributes.eventDate - a.attributes.eventDate;
          })
        });
     };



    this.createOrder = function () {
      $state.go('newOrderByCustomer',{'customerId':this.currentCustomer.id});
    };

    this.mergeCustomer = function (ind) {
      var that = this;
      var mergeSourceCustomer = this.filteredCustomers[ind];
      var customerMergeModal = $modal.open({
        templateUrl: 'app/partials/customer/merge.html',
        controller: 'CustomerMergeCtrl as customerMergeModel',
        resolve: {
          mergeTarget: function () {
            return that.currentCustomer;
          },
          mergeSource: function () {
            return mergeSourceCustomer;
          }
        },
        size: 'lg'
      });

      customerMergeModal.result.then(function (fieldList) {
        fieldList.forEach(function(field) {   // first update any customer attributes that might have changed
          if (field.isAttribute) {
            that.currentCustomer.attributes[field.name] = field.selectedValue;
          }
        });
        api.saveObj (that.currentCustomer)
          .then(function() {   // now update all orders of source customer to point to target customer
            api.queryOrdersByCustomer(mergeSourceCustomer.id,['customer'])
              .then(function(sourceCustOrders) {
                sourceCustOrders.forEach(function(ord) {
                  ord.attributes.customer = that.currentCustomer.id;
                });
                api.saveObjects(sourceCustOrders)
                  .then(function() {   // finally delete source customer
                    api.deleteObj(mergeSourceCustomer)
                      .then(function() {
                        var sourceInd;
                        that.customers.forEach(function(cust,ind) {
                          if (cust.id === mergeSourceCustomer.id) {
                            sourceInd = ind;
                          }
                        });
                        that.customers.splice(sourceInd, 1);
                        that.filteredCustomers = customerService.filterList(that.customers,
                                                                            that.currentCustomer.attributes,
                                                                            true);
                        countOrders(that.customers);
                      })
                })
              });
          })
     }, function() {
        // dismissed
      });
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
    var that = this;

   customerService.sortList(this.customers);
   this.currentCustomer = {};
   this.newCustomer();
   this.backupCustomer = angular.copy(this.currentCustomer); // to undo changes on change focus
   this.isCustomerChanged = false;

    countOrders (this.customers);
  })

  .controller('CustomerMergeCtrl', function ($modalInstance, mergeTarget, mergeSource) {

    this.fieldList =
    [
      {
        name:   'id',
        isAttribute:  false,
        type: 'text',
        valueSelect:  'none'
      },
      {
        name:   'firstName',
        isAttribute: true,
        label:   'שם פרטי',
        type:     'text'
      },
      {
        name:   'lastName',
        isAttribute: true,
        label:   'שם משפחה',
        type:     'text'
      },
      {
        name:   'mobilePhone',
        isAttribute: true,
        label:  'טלפון נייד',
        type:     'text'
      },
      {
        name:   'homePhone',
        isAttribute: true,
        label:  'טלפון בית',
        type:     'text'
      },
      {
        name:   'workPhone',
        isAttribute: true,
        label:  'טלפון עבודה',
        type:     'text'
      },
      {
        name:   'email',
        isAttribute: true,
        label:  'דואל',
        type:     'text'
      },
      {
        name:   'address',
        isAttribute: true,
        label:  'כתובת',
        type:     'text'
      },
      {
        name:   'createdAt',
        isAttribute: false,
        label:  'נוצר',
        type:     'date',
        valueSelect:  'readOnly'
      },
      {
        name:   'orderCount',
        isAttribute: false,
        label:  'אירועים',
        type:     'text',
        valueSelect:  'readOnly'
      }
    ];


    this.setValueSelect = function (field) {
      console.log('select value before');
      console.log(field);
      if (field.valueSelect === 'target') {
        field.selectedValue = field.targetValue;
      } else if (field.valueSelect === 'source') {
        field.selectedValue = field.sourceValue;
      }
      console.log('select value after');
      console.log(field);
    };

    this.doMerge = function () {
      $modalInstance.close(this.fieldList);
    };

    this.doCancel = function () {
      $modalInstance.dismiss();
    };

    // main block

    var that = this;
    this.fieldList.forEach(function(field,ind) {
      if (field.isAttribute) {
        field.sourceValue = mergeSource.attributes[field.name];
        field.targetValue = mergeTarget.attributes[field.name];
        if (field.targetValue) {
          field.valueSelect = 'target';
        } else if (field.sourceValue) {
          field.valueSelect = 'source';
        } else {
          field.valueSelect = 'none';
        }
        that.setValueSelect(field);
      } else {
        field.sourceValue = mergeSource[field.name];
        field.targetValue = mergeTarget[field.name];
      }
    });

  });
