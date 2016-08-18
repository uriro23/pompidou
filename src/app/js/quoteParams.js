'use strict';

angular.module('myApp')
  .controller('QuoteParamsCtrl', function ($scope, $modal, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;
    this.menuTypes = $scope.orderModel.menuTypes;
    this.bidTextTypes = $scope.orderModel.bidTextTypes;


    this.filterCategories = function () {
      var currentQuote = this.order.view.quote;
     var that = this;
      if (currentQuote.categories) {   // false for old orders
        this.filteredCategories = currentQuote.categories.filter(function (qCat) {
          var temp = currentQuote.items.filter(function (itm) {
            return itm.category.tId === qCat.tId;
          });
          return temp.length;
        });
      } else {
        this.filteredCategories = [];
      }
    };

    this.setMenuType = function () {
      this.order.view.quote.endBoxType = this.order.view.quote.menuType;
      this.quoteMenuChanged();
    };

    this.quoteMenuChanged = function () {
      orderService.quoteChanged(this.order,'quoteMenuSelections');
    };

    this.setEndText = function () {
      this.order.view.quote.endText = this.order.view.quote.endTextType.mailText;
      orderService.quoteChanged(this.order,'quoteMenuSelections');
      orderService.quoteChanged(this.order,'quoteEndText');
    };

    this.editEndText = function () {
      var that = this;
      var editTextModal = $modal.open({
        templateUrl: 'app/partials/order/editText.html',
        controller: 'EditTextCtrl as editTextModel',
        resolve: {
          text: function () {
            return that.order.view.quote.endText;
          },
          title: function () {
            return 'עדכון טקסט סיום';
          }
        },
        size: 'lg'
      });

      editTextModal.result.then(function (txt) {
        if (txt) {
          that.order.view.quote.endText = txt;
          orderService.quoteChanged(that.order,'quoteEndText');
        }
      });
      };

    this.categoryChanged = function (ind) {
      this.filteredCategories[ind].isChanged = true;
      orderService.quoteChanged(this.order);
    };

   // main block
    this.filterCategories();

  });

