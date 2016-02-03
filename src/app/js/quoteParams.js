'use strict';

angular.module('myApp')
  .controller('QuoteParamsCtrl', function ($scope, $modal) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;
    this.menuTypes = $scope.orderModel.menuTypes;
    this.bidTextTypes = $scope.orderModel.bidTextTypes;
    this.referralSources = $scope.orderModel.referralSources;

    // functions
    this.orderChanged = $scope.orderModel.orderChanged;
    this.setupOrderView = $scope.orderModel.setupOrderView;



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
      this.order.view.quote.menuType = this.order.view.menuType.tId;
      this.order.view.endBoxType = this.order.view.menuType;
      this.orderChanged('quoteMenuSelections');
    };

    this.setEndBoxType = function () {
      this.order.view.quote.endBoxType = this.order.view.endBoxType.tId;
      this.orderChanged('quoteMenuSelections');
    };

    this.setEndText = function () {
      this.order.view.quote.endTextType = this.order.view.endTextType.tId;
      this.order.view.quote.endText = this.order.view.endTextType.mailText;
      this.orderChanged('quoteMenuSelections');
      this.orderChanged('quoteEndText');
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
          that.orderChanged('quoteEndText');
        }
      });


      };

    // todo: move all lov collections of quote into the quote object (discountCause, menuType)

    // todo: handle menuType in order common parts (like referralSource)

    this.categoryChanged = function (ind) {
      this.filteredCategories[ind].isChanged = true;
      this.orderChanged();
    };

   // main block
    this.filterCategories();

  });

