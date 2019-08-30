'use strict';

angular.module('myApp')
  .controller('GeneralCtrl', function ($scope, $state, $modal, api, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.user = $scope.orderModel.user;

    this.orderChanged = function (field) {
      orderService.orderChanged(this.order,field)
    };


    this.setBusinessEvent = function () {
      var thisOrder = this.order.attributes;

      thisOrder.quotes.forEach(function(quote) {
        quote.items.forEach(function(item) {
          item.price = thisOrder.isBusinessEvent ? item.priceBeforeVat : item.priceInclVat;
        });
        orderService.calcTotal(quote,this.order);
      });
      orderService.orderChanged(this.order,'isBusinessEvent');
    };


    this.resetColor = function() {
      this.order.delAttributes = {color:true};
      this.order.view.color = undefined;
      orderService.orderChanged(this.order,'color');
    };

    this.setTemplate = function() {
      orderService.orderChanged(this.order,'template');
    };

    this.duplicateOrder = function () {
      $state.go('dupOrder',{basedOnId:this.order.id});
    };

    this.deleteOrder = function () {
      var that = this;
      if (this.user.attributes.isSalesPerson &&
        this.user.attributes.username !== this.order.attributes.createdBy) {
        alert ('אינך יכול לבטל אירוע שלא אתה יצרת');
        return;
      }
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
