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


    this.setQuoteChanged = function (ind) {
      this.order.attributes.quotes[ind].changes.management = true;
      orderService.orderChanged(this.order);
    };

    this.setActiveQuote = function (ind) {
      this.order.attributes.quotes.forEach(function (quote) {
        quote.isActive = false;
      });
      this.order.attributes.quotes[ind].isActive = true;
      this.order.attributes.activeQuote = ind;
      this.order.view.quote = this.order.attributes.quotes[ind];
      this.setQuoteChanged(ind);
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
        var quote = orderService.initQuote(this.newMenuType, this.categories,this.discountCauses[0]);
        quote.changes.management = true;
        orderService.calcSubTotal(quote, this.order.attributes.isBusinessEvent, this.order.attributes.vatRate);
       this.order.attributes.quotes.push(quote);
       if (this.order.attributes.quotes.length===1) { // first quote - make it active
         this.setActiveQuote(0);
       }
        this.setRemainingMenuTypes();
        orderService.orderChanged(this.order);
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
      orderService.orderChanged(this.order);
    };

    //  main block

    this.setRemainingMenuTypes();


  });


