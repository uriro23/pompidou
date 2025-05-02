'use strict';

angular.module('myApp')
  .controller('HeaderCtrl', function ($scope, $modal, api, orderService, dater) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.orderStatuses = $scope.orderModel.orderStatuses;
    this.eventTimeRanges = $scope.orderModel.eventTimeRanges;
    this.showSummary = $scope.orderModel.showSummary;


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
            } else if (custType === 1) {
              return that.order.view.contact.id;
            } else {
              return that.order.view.referrer.id;
            }
          },
          modalHeader: function () {
            return custHeader;
          },
          isOptionalSelect: function () {
            return custType !== 1; // for contact or referrer selection in modal is optional
          }
        },
        size: 'lg'
      });

      selectCustomer.result.then(function (cust) {
        if (custType === 1) {
          that.order.view.customer = cust;
          that.order.properties.customer = cust.id;
          if (cust.isWholesaleCustomer) {
            that.order.properties.isWholesaleEvent = true;
            if (!that.order.properties.noOfParticipants)
            {
              that.order.properties.noOfParticipants = 1; // so it won't cause problems later
            }
          }
          that.order.properties.taskData.address = cust.address;
          orderService.orderChanged(that.order,'customer');
          orderService.upgradeOrderStatus(that.order);
          that.order.view.errors.customer = false;
          that.getPrevOrders();
       } else if (custType === 2) {
          that.order.view.contact = cust;
          that.order.properties.contact = cust.id;
          orderService.orderChanged(that.order,'customer');
          that.order.view.errors.contact = false;
        } else {  // referrer
          that.order.view.referrer = cust;
          that.order.properties.referrer = cust.id;
          orderService.orderChanged(that.order,'referrer');
          that.order.view.errors.referrer = false;
        }
      }), function () {
      };

    };


    this.setNoOfParticipants = function () {
      var that = this;
      orderService.orderChanged(this.order,'header');
      this.order.view.errors.noOfParticipants = orderService.checkParticipants (this.order);
      if (!this.order.view.errors.noOfParticipants) {
        orderService.upgradeOrderStatus(this.order);
        this.order.properties.quotes.forEach(function(quote) { // recalc all quotes to update price per person
         orderService.calcTotal(quote,that.order);
        })
      }
    };

    this.setChildren = function () {
      var thisOrder = this.order.properties;
      orderService.orderChanged(this.order,'header');
      this.order.view.errors.children = thisOrder.children < 0;
    };

    this.statusChanged = function () {
      var orderStatus = this.order.view.orderStatus;
      // if (orderStatus.id === 6) {
      //   $scope.orderModel.isActiveGeneralTab = true;
      //   this.order.view.errors.cancelReason = !this.order.view.cancelReason &&
      //                                         !this.order.properties.template;
      // }
      if (orderStatus.id > 1 && orderStatus.id < 6) {
        if(this.order.properties.isDateUnknown) {
          this.order.properties.eventDate = undefined;
          this.order.properties.isDateUnknown = false;
          this.order.view.errors.eventDate = true;
        }
      }
      if (orderStatus.id > 0 && orderStatus.id < 6) {
        this.order.view.errors.customer = !this.order.properties.customer;
      }
      if (orderStatus.id > 2 && orderStatus.id !== 6) {
        if (!this.order.properties.taskData.isCoordinationCall) {
          alert('שים לב! לא סומן ביצוע שיחת תאום');
        }
      }
      this.order.view.errors.noOfParticipants = orderService.checkParticipants (this.order);
       this.setReadOnly();
      orderService.orderChanged(this.order,'header');
    };

    this.checkEventDate = function () {
      var thisOrder = this.order.properties;
      this.order.view.errors.eventDate = !thisOrder.eventDate ||
          (!this.order.view.isAllowPastDate && thisOrder.eventDate < dater.today());
      if (thisOrder.eventDate >= dater.today()) {
        this.order.view.isAllowPastDate = false;
      }
      };

    this.setEventDate = function () {
      var thisOrder = this.order.properties;
      orderService.orderChanged(this.order,'header');
      this.checkEventDate();
      if (thisOrder.eventDate > orderService.horizonDate() || thisOrder.eventDate < dater.today()) {
        api.unset(this.order,'color');
        this.order.view.color = undefined;
        orderService.orderChanged(this.order,'color');
      }
      this.setReadOnly();
    };

    this.setKnownDate = function () {
      var thisOrder = this.order.properties;
      orderService.orderChanged(this.order,'header');
      if (!thisOrder.isDateUnknown) { // isUnknownDate should always be false here
        thisOrder.eventDate = undefined;
        this.order.view.errors.eventDate = true;
      }
    };

    this.setDateUnknown = function () {
      var thisOrder = this.order.properties;
      orderService.orderChanged(this.order,'header');
      thisOrder.eventDate = new Date(2199,11,31,0,0,0,0);
      thisOrder.isDateUnknown = true;
      this.order.view.errors.eventDate = false;
    };

   this.setEventTime = function () {
      var thisOrder = this.order.properties;
      orderService.setRangeLabels (thisOrder.eventTime, this.eventTimeRanges);
      if (!this.order.view.eventTimeRange) { // set range to default
        this.order.view.eventTimeRange = this.eventTimeRanges.filter(function(range) {
          return range.id === 1;
        })[0];
      }
      if (thisOrder.isExitTimeExplicit) {
        this.order.view.errors.exitTime = true; // let user reconsider exit time
      } else {
        if (thisOrder.eventTime) {
          thisOrder.exitTime = angular.copy(thisOrder.eventTime);
          thisOrder.exitTime.setMinutes(
            thisOrder.exitTime.getMinutes() - this.order.view.eventTimeRange.value / 2
          ); // set to middle of range
          thisOrder.exitTime.setHours(thisOrder.exitTime.getHours() - 1); // default - one hour before eventTime
        } else {
          thisOrder.exitTime = undefined;
        }
      }
      orderService.orderChanged(this.order,'header');
    };

    this.setExitTime = function () {
      var thisOrder = this.order.properties;
      thisOrder.isExitTimeExplicit = true;
      this.order.view.errors.exitTime = Boolean(thisOrder.exitTime > thisOrder.eventTime);
      orderService.orderChanged(this.order,'header');
    };

    this.showDetails = function(bool) {
      this.showSummary.is = !bool;
    }

  });
