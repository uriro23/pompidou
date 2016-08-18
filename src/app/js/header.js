'use strict';

angular.module('myApp')
  .controller('HeaderCtrl', function ($scope, $modal, api, orderService, today) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;
    this.eventTypes = $scope.orderModel.eventTypes;
    this.orderStatuses = $scope.orderModel.orderStatuses;

    // functions
    this.getPrevOrders =  $scope.orderModel.getPrevOrders;
    this.setReadOnly =  $scope.orderModel.setReadOnly;

    this.orderChanged = function (field) {
      orderService.orderChanged (this.order,field);
    };

    this.setCustomer = function (custType, custHeader) {  // custType: 1 = primary, 2 = secondary
      var that = this;

      var selectCustomer = $modal.open({
        templateUrl: 'app/partials/modalCustomer.html',
        controller: 'ModalCustomerCtrl as modalCustomerModel',
        resolve: {
          customers: function (api) {
            return api.queryCustomers()
              .then(function (custs) {
                return custs;
              });
          },
          currentCustomerId: function () {
            if (custType === 1) {
              return that.order.view.customer.id;
            } else {
              return that.order.view.contact.id;
            }
          },
          modalHeader: function () {
            return custHeader;
          },
          isOptionalSelect: function () {
            return custType === 2; // for contact selection in modal is optional
          }
        },
        size: 'lg'
      });

      selectCustomer.result.then(function (cust) {
        if (custType === 1) {
          that.order.view.customer = cust;
          orderService.orderChanged(that.order,'customer');
          that.order.view.errors.customer = false;
          that.getPrevOrders();
        } else if (custType === 2) {
          that.order.view.contact = cust;
          orderService.orderChanged(that.order,'customer');
          that.order.view.errors.contact = false;
        } else {
          alert('error - bad customer type: ' + custType);
        }
      }), function () {
      };

    };

    this.setEventDate = function () {
      var thisOrder = this.order.attributes;
      orderService.orderChanged(this.order,'header');
      this.order.view.errors.eventDate = !thisOrder.eventDate || thisOrder.eventDate < today;  // past dates not allowed
      this.setReadOnly();
    };

    this.setNoOfParticipants = function () {
      var thisOrder = this.order.attributes;
      orderService.orderChanged(this.order,'header');
      this.order.view.errors.noOfParticipants = !Boolean(thisOrder.noOfParticipants) || thisOrder.noOfParticipants <= 0;
    };

    this.setChildren = function () {
      var thisOrder = this.order.attributes;
      orderService.orderChanged(this.order,'header');
      console.log('children='+thisOrder.children);
      this.order.view.errors.children = thisOrder.children < 0;
    };

  });
