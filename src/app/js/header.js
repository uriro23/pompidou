'use strict';

angular.module('myApp')
  .controller('HeaderCtrl', function ($scope, $modal, api, orderService, dater) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.orderStatuses = $scope.orderModel.orderStatuses;


    // functions
    this.getPrevOrders =  $scope.orderModel.getPrevOrders;
    this.setReadOnly =  $scope.orderModel.setReadOnly;
    this.setOrderTableParams = $scope.orderModel.setOrderTableParams;  // used in getPrevOrders

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
          that.order.attributes.customer = cust.id;
          orderService.orderChanged(that.order,'customer');
          orderService.upgradeOrderStatus(that.order);
          that.order.view.errors.customer = false;
          that.getPrevOrders();
       } else if (custType === 2) {
          that.order.view.contact = cust;
          that.order.attributes.contact = cust.id;
          orderService.orderChanged(that.order,'customer');
          that.order.view.errors.contact = false;
        } else {
          alert('error - bad customer type: ' + custType);
        }
      }), function () {
      };

    };

    function checkParticipants (order) {
      var thisOrder = order.attributes;
      return (order.view.orderStatus.id > 0 && order.view.orderStatus.id < 6 &&
        (!Boolean(thisOrder.noOfParticipants) || thisOrder.noOfParticipants <= 0)) ||
        ((order.view.orderStatus.id === 0 || order.view.orderStatus.id === 6) &&
          thisOrder.noOfParticipants < 0);
    }

    this.setNoOfParticipants = function () {
      orderService.orderChanged(this.order,'header');
      this.order.view.errors.noOfParticipants = checkParticipants (this.order);
      if (!this.order.view.errors.noOfParticipants) {
        orderService.upgradeOrderStatus(this.order);
      }
    };

    this.setChildren = function () {
      var thisOrder = this.order.attributes;
      orderService.orderChanged(this.order,'header');
      this.order.view.errors.children = thisOrder.children < 0;
    };

    this.statusChanged = function () {
      var orderStatus = this.order.view.orderStatus;
      if (orderStatus.id === 6) {
        $scope.orderModel.isActiveGeneralTab = true;
        this.order.view.errors.cancelReason = !this.order.view.cancelReason &&
                                              !this.order.attributes.template;
      }
      if (orderStatus.id > 1 && orderStatus.id < 6) {
        if(this.order.attributes.isDateUnknown) {
          this.order.attributes.eventDate = undefined;
          this.order.attributes.isDateUnknown = false;
          this.order.view.errors.eventDate = true;
        }
      }
      if (orderStatus.id > 0 && orderStatus.id < 6) {
        this.order.view.errors.customer = !this.order.attributes.customer;
      }
      this.order.view.errors.noOfParticipants = checkParticipants (this.order);
       this.setReadOnly();
      orderService.orderChanged(this.order,'header');
    };

    this.setEventDate = function () {
      var thisOrder = this.order.attributes;
      orderService.orderChanged(this.order,'header');
      this.order.view.errors.eventDate = !thisOrder.eventDate || thisOrder.eventDate < dater.today();  // past dates not allowed
      this.setReadOnly();
    };

    this.setKnownDate = function () {
      var thisOrder = this.order.attributes;
      orderService.orderChanged(this.order,'header');
      if (!thisOrder.isUnknownDate) { // isUnknownDate should always be false here
        thisOrder.eventDate = undefined;
        this.order.view.errors.eventDate = true;
      }
    };


  });
