'use strict';

angular.module('myApp')
  .controller('HeaderCtrl', function ($scope, $modal, api, today) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;
    this.eventTypes = $scope.orderModel.eventTypes;
    this.orderStatuses = $scope.orderModel.orderStatuses;

    // functions
    this.orderChanged = $scope.orderModel.orderChanged;
    this.getPrevOrders =  $scope.orderModel.getPrevOrders;
    this.setReadOnly =  $scope.orderModel.setReadOnly;

    this.setCustomer = function (custType, custHeader) {  // custType: 1 = primary, 2 = secondary
      var that = this;

      var selectCustomer = $modal.open({
        templateUrl: 'app/partials/customer.html',
        controller: 'CustomerCtrl as customerModel',
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
          that.orderChanged('customer');
          that.order.view.errors.customer = false;
          that.getPrevOrders();
        } else if (custType === 2) {
          that.order.view.contact = cust;
          that.orderChanged('contact');
          that.order.view.errors.contact = false;
        } else {
          alert('error - bad customer type: ' + custType);
        }
      }), function () {
      };

    };

    this.setEventDate = function () {
      var thisOrder = this.order.attributes;
      this.orderChanged('header');
      this.order.view.errors.eventDate = !thisOrder.eventDate || thisOrder.eventDate < today;  // past dates not allowed
      this.setReadOnly();
    };

    this.setNoOfParticipants = function () {
      var thisOrder = this.order.attributes;
      this.orderChanged('header');
      this.order.view.errors.noOfParticipants = !Boolean(thisOrder.noOfParticipants) || thisOrder.noOfParticipants <= 0;
    };

    /*
    this.transformNewEventType = function (str) {
      var newEventType = {
        tId: 123,   // todo: max tId + 1
        label: str
      };
      console.log(newEventType);
      return newEventType
    };
  */
  });
