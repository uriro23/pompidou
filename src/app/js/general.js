'use strict';

angular.module('myApp')
  .controller('GeneralCtrl', function ($scope, $state, $modal, api, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;
    this.referralSources = $scope.orderModel.referralSources;

    this.orderChanged = function (field) {
      orderService.orderChanged(this.order,field)
    };


    this.setBusinessEvent = function () {
      var thisOrder = this.order.attributes;

      thisOrder.quotes.forEach(function(quote) {
        quote.items.forEach(function(item) {
          item.price = thisOrder.isBusinessEvent ? item.priceBeforeVat : item.priceInclVat;
        });
        orderService.calcSubTotal(quote, thisOrder.isBusinessEvent, thisOrder.vatRate);
      });
      orderService.orderChanged(this.order,'isBusinessEvent');
    };


    this.duplicateOrder = function () {
      $state.go('dupOrder',{basedOnId:this.order.id});
    };

    this.deleteOrder = function () {
      var that = this;
      var ackDelModal = $modal.open({
        templateUrl: 'app/partials/order/ackDelete.html',
        controller: 'AckDelOrderCtrl as ackDelOrderModel',
        resolve: {
          order: function () {
            return that.order;
          }
        },
        size: 'sm'
      });

      ackDelModal.result.then(function (isDelete) {
        if (isDelete) {
          api.deleteObj(that.order)
            .then(function () { // cascade delete to bids and mails
              api.queryBidsByOrder(that.order.id)
                .then(function (bids) {
                  api.deleteObjects(bids)
                    .then(function () {
                      api.queryMailsByOrder(that.order.id)
                        .then(function (mails) {
                          api.deleteObjects(mails)
                            .then(function () {
                              history.back();
                            })
                        })
                    })
                });
            })
        }
      });
    };


  })

  .controller('BonusesCtrl', function ($scope, $state, orderService) {
    this.order = $scope.orderModel.order;
    this.employees = $scope.orderModel.employees;

    this.roleChanged = function(ind) {
      this.order.attributes.empBonuses[ind].isChanged = true;
      orderService.orderChanged(this.order);
    };
  });
