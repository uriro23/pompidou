'use strict';

angular.module('myApp')
  .controller('FinancialCtrl', function ($scope, $modal, api, orderService) {

    // references to members of parent order controller
    this.order = $scope.orderModel.order;
    this.discountCauses = $scope.orderModel.discountCauses;
    this.isReadOnly = $scope.orderModel.isReadOnly;

    this.orderChanged = $scope.orderModel.orderChanged;


    this.updatePrices = function () {
      var that = this;
      var updatePricesModal = $modal.open({
        templateUrl: 'app/partials/order/updatePrices.html',
        controller: 'UpdatePricesCtrl as updatePricesModel',
        resolve: {
          order: function () {
            return that.order;
          },
          catalog: function () {
            return api.queryCatalog(1)
              .then(function (cat) {
                return cat; // deleted items are also returned
              })
          }
        },
        size: 'lg'
      });

      updatePricesModal.result.then(function (isChanged) {
        if (isChanged) {
          orderService.calcSubTotal(that.order);
          that.orderChanged();
        }
      })

    };


    this.setDiscountRate = function () {
      var thisQuote = this.order.view.quote;

      this.order.view.errors.discountRate = Number(thisQuote.discountRate) != thisQuote.discountRate || Number(thisQuote.discountRate) < 0;
      orderService.calcSubTotal(this.order);
      this.orderChanged('discountRate');
    };

    this.setDiscountCause = function () {
      var thisQuote = this.order.view.quote;

      if (this.order.view.discountCause.tId === 0) {
        thisQuote.discount = 0;
      } else {
        this.setDiscountRate();
      }
      orderService.calcTotal(this.order);
      this.orderChanged('discountCause');
    };

     this.setFixedPrice = function () {
      var thisQuote = this.order.view.quote;

      this.order.view.errors.fixedPrice = Number(thisQuote.fixedPrice) != thisQuote.fixedPrice ||
                              Number(thisQuote.fixedPrice) < 0;
       orderService.calcTotal(this.order);
       this.orderChanged('fixedPrice');
    };

    this.setAdvance = function () {
      orderService.calcTotal(this.order);
      this.orderChanged('advance');
    };


  });
