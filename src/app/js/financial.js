'use strict';

angular.module('myApp')
  .controller('FinancialCtrl', function ($scope, $modal, api, orderService) {

    // references to members of parent order controller
    this.order = $scope.orderModel.order;
    this.discountCauses = $scope.orderModel.discountCauses;
    this.readOnly = $scope.orderModel.readOnly;


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
          orderService.calcSubTotal(that.order.view.quote, that.order.attributes.isBusinessEvent, that.order.attributes.vatRate);
          orderService.quoteChanged(that.order);
        }
      })

    };


    this.setDiscountRate = function () {
      var thisQuote = this.order.view.quote;

      thisQuote.errors.discountRate = Number(thisQuote.discountRate) != thisQuote.discountRate || Number(thisQuote.discountRate) < 0;
      orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
      orderService.quoteChanged(this.order,'discountRate');
    };

    this.setDiscountCause = function () {
      var thisQuote = this.order.view.quote;

      if (thisQuote.discountCause.tId === 0) {
        thisQuote.discount = 0;
      } else {
        this.setDiscountRate();
      }
      orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
      orderService.quoteChanged(this.order,'discountCause');
    };


    this.setFixedPrice = function () {
      var thisQuote = this.order.view.quote;

       thisQuote.errors.fixedPrice = Number(thisQuote.fixedPrice) != thisQuote.fixedPrice ||
                              Number(thisQuote.fixedPrice) < 0;
       orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
       orderService.quoteChanged(this.order,'fixedPrice');
    };

    this.setAdvance = function () {
      var thisQuote = this.order.view.quote;
      orderService.calcSubTotal(thisQuote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
      orderService.quoteChanged(this.order,'advance');
    };

    this.setNoQuantities = function() {
      orderService.quoteChanged(this.order,'noQuantities');
    };

  });
