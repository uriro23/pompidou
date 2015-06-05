'use strict';

angular.module('myApp')
  .controller('FinancialCtrl', function ($scope, $modal, api) {

    // references to members of parent order controller
    this.order = $scope.orderModel.order;
    this.discountCauses = $scope.orderModel.discountCauses;
    this.isReadOnly = $scope.orderModel.isReadOnly;

    this.calcSubTotal = $scope.orderModel.calcSubTotal;
    this.calcTotal = $scope.orderModel.calcTotal;
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
          that.calcSubTotal();
          that.orderChanged();
        }
      })

    };


    this.setDiscountRate = function () {
      var thisOrder = this.order.attributes;

      this.order.view.errors.discountRate = Number(thisOrder.discountRate) != thisOrder.discountRate || Number(thisOrder.discountRate) < 0;
      thisOrder.discount = -thisOrder.subTotal * thisOrder.discountRate / 100;
      this.calcTotal();
      this.orderChanged('discountRate');
    };

    this.setDiscountCause = function () {
      var thisOrder = this.order.attributes;

      if (this.order.view.discountCause.tId === 0) {
        thisOrder.discount = 0;
      } else {
        this.setDiscountRate();
      }
      this.calcTotal();
      this.orderChanged('discountCause');
    };

    this.setTransportationBonus = function () {
      var thisOrder = this.order.attributes;

      if (thisOrder.isTransportationBonus) {
        thisOrder.transportationBonus = -thisOrder.transportation;
      } else {
        thisOrder.transportationBonus = 0;
      }
      this.calcTotal();
      this.orderChanged('isTransportationBonus');
    };

    this.setTransportation = function () {
      var thisOrder = this.order.attributes;
      this.order.view.errors.transportationInclVat = Number(thisOrder.transportationInclVat) != thisOrder.transportationInclVat ||
      Number(thisOrder.transportationInclVat) < 0;
      if (thisOrder.isBusinessEvent) {
        thisOrder.transportation = thisOrder.transportationInclVat / (1 + thisOrder.vatRate);
      } else {
        thisOrder.transportation = thisOrder.transportationInclVat;
      }
      this.setTransportationBonus();
      this.calcTotal();
      this.orderChanged('transportationInclVat');
    };

    this.setBusinessEvent = function () {
      var thisOrder = this.order.attributes;

      if (thisOrder.isBusinessEvent) {
        for (i = 0; i < thisOrder.items.length; i++) {
          thisOrder.items[i].price = thisOrder.items[i].priceBeforeVat;
        }
      } else {
        for (var i = 0; i < thisOrder.items.length; i++) {
          thisOrder.items[i].price = thisOrder.items[i].priceInclVat;
        }
      }
      this.setTransportation(); // recalc considering vat reduced or not
      this.calcSubTotal();
      this.orderChanged('isBusinessEvent');
    };

    this.setFixedPrice = function () {
      var thisOrder = this.order.attributes;
      this.order.view.errors.fixedPrice = Number(thisOrder.fixedPrice) != thisOrder.fixedPrice ||
      Number(thisOrder.fixedPrice) < 0;
      this.calcTotal();
      this.orderChanged('fixedPrice');
    };


  });
