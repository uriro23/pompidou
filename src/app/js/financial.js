'use strict';

angular.module('myApp')
  .controller('FinancialCtrl', function ($scope, $modal, api, orderService) {

    // references to members of parent order controller
    this.order = $scope.orderModel.order;
    this.discountCauses = $scope.orderModel.discountCauses;
    this.readOnly = $scope.orderModel.readOnly;


    this.updateFromCatalog = function () {
      var that = this;
      var updateFromCatalogModal = $modal.open({
        templateUrl: 'app/partials/order/updateFromCatalog.html',
        controller: 'UpdateFromCatalogCtrl as updateFromCatalogModel',
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

      updateFromCatalogModal.result.then(function (isChanged) {
        if (isChanged) {
          orderService.calcTotal(that.order.view.quote,that.order);
          orderService.quoteChanged(that.order);
        }
      })

    };

    this.quoteChanged = function(attr) {
      orderService.quoteChanged(this.order,attr);

    };


    this.setDiscountRate = function () {
      var thisQuote = this.order.view.quote;

      thisQuote.errors.discountRate = Number(thisQuote.discountRate) != thisQuote.discountRate || Number(thisQuote.discountRate) < 0;
      orderService.calcTotal(thisQuote,this.order);
      orderService.quoteChanged(this.order,'discountRate');
    };

    this.setDiscountCause = function () {
      var thisQuote = this.order.view.quote;

      if (thisQuote.discountCause.tId === 0) {
        thisQuote.discount = 0;
      } else {
        this.setDiscountRate();
      }
      orderService.calcTotal(thisQuote,this.order);
      orderService.quoteChanged(this.order,'discountCause');
    };


    this.setFixedPrice = function () {
      var thisQuote = this.order.view.quote;

      if (!thisQuote.isFixedPrice) {
        thisQuote.fixedPrice = 0;
        thisQuote.isNoTotal = false;
      } else {
        thisQuote.errors.fixedPrice =
          Number(thisQuote.fixedPrice) != thisQuote.fixedPrice || Number(thisQuote.fixedPrice) < 0;
      }

      orderService.calcTotal(thisQuote,this.order);
      orderService.quoteChanged(this.order,'fixedPrice');
    };

    this.setAdvance = function () {
      var thisQuote = this.order.view.quote;
      orderService.calcTotal(thisQuote,this.order);
      orderService.quoteChanged(this.order,'advance');
    };

    this.setNoQuantities = function() {
      orderService.quoteChanged(this.order,'noQuantities');
    };

    this.setNoParticipants = function() {
      orderService.quoteChanged(this.order,'noParticipants');
    };

  });
