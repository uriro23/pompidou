'use strict';

angular.module('myApp')
  .controller('QuoteManagementCtrl', function ($scope, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.menuTypes = $scope.orderModel.menuTypes;
    this.categories = $scope.orderModel.categories;
    this.discountCauses = $scope.orderModel.discountCauses;


    this.setQuoteChanged = function (ind) {
      this.order.properties.quotes[ind].changes.management = true;
      orderService.orderChanged(this.order);
    };

     this.setActiveQuote = function (ind) {
      this.order.properties.quotes.forEach(function (quote) {
        quote.isActive = false;
      });
      this.order.properties.quotes[ind].isActive = true;
      this.order.properties.activeQuote = ind;
      this.order.view.quote = this.order.properties.quotes[ind];
      orderService.calcSpecialTypes(this.order); // recalc special types in task for new active quote
      this.setQuoteChanged(ind);
    };

    this.setRemainingMenuTypes = function () {  // build array of all menu types not in use in quotes
      var that = this;
      this.remainingMenuTypes = this.menuTypes.filter(function (mt) {
        var temp = that.order.properties.quotes.filter(function (q) {
          return mt.tId === q.menuType.tId;
        });
        return temp.length === 0;
      });
    };

    this.addQuote = function () {
      if (this.newMenuType) {
        var quote = orderService.initQuote(this.newMenuType, this.categories,this.discountCauses[0]);
        quote.changes.management = true;
        orderService.calcTotal(quote,this.order);
       this.order.properties.quotes.push(quote);
       if (this.order.properties.quotes.length===1) { // first quote - make it active
         this.setActiveQuote(0);
       }
        this.setRemainingMenuTypes();
        orderService.orderChanged(this.order);
        orderService.upgradeOrderStatus(this.order);
      }
    };

    this.delQuote = function (ind) {
      var that = this;
      this.order.properties.quotes.splice(ind, 1);
      this.order.properties.quotes.forEach(function (q, ind) { // active quote may have shifted, locate it again
        if (q.isActive) {
          that.order.properties.activeQuote = ind;
        }
      });
      this.setRemainingMenuTypes();
      orderService.orderChanged(this.order);
    };

    //  main block

    this.setRemainingMenuTypes();


  });


