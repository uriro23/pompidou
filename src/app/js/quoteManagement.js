'use strict';

angular.module('myApp')
  .controller('QuoteManagementCtrl', function ($scope, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;
    this.menuTypes = $scope.orderModel.menuTypes;
    this.categories = $scope.orderModel.categories;
    this.discountCauses = $scope.orderModel.discountCauses;


    this.setActiveQuote = function (ind) {
      this.order.attributes.quotes.forEach(function (quote) {
        quote.isActive = false;
      });
      this.order.attributes.quotes[ind].isActive = true;
      this.order.attributes.activeQuote = ind;
    };

    this.setRemainingMenuTypes = function () {  // build array of all menu types not in use in quotes
      var that = this;
      this.remainingMenuTypes = this.menuTypes.filter(function (mt) {
        var temp = that.order.attributes.quotes.filter(function (q) {
          return mt.tId === q.menuType.tId;
        });
        return temp.length === 0;
      });
    };

    this.addQuote = function () {
      if (this.newMenuType) {
        var quote = orderService.initQuote(this.newMenuType, this.categories, this.discountCauses[0]);
        this.order.view.quote = quote;  // just for calcSubTotal
        orderService.calcSubTotal(this.order);
        this.order.attributes.quotes.push(quote);
        this.setRemainingMenuTypes();
      }
    };

    this.delQuote = function (ind) {
      var that = this;
      this.order.attributes.quotes.splice(ind, 1);
      this.order.attributes.quotes.forEach(function (q, ind) { // active quote may have shifted, locate it again
        if (q.isActive) {
          that.order.attributes.activeQuote = ind;
        }
      });
      this.setRemainingMenuTypes();
    };

    //  main block

    this.setRemainingMenuTypes();


  });


