'use strict';

/* Controllers */
angular.module('myApp')
  .controller('QuoteCtrl', function (api, $state, $filter, $rootScope, $timeout,
                                   bid, lov, config, categories,
                                   bidTextTypes, menuTypes, isPrintQuote) {
    $rootScope.menuStatus = 'hide';

    if (bid) {
      this.docNotAvailable = false;

      this.bid = bid;

      this.categories = categories;
      this.config = config;
      this.currentOrder = this.bid.attributes.order;
      if (this.currentOrder.quotes) {
        this.currentQuote = this.currentOrder.quotes[this.currentOrder.activeQuote];
      } else {
        this.currentQuote = this.currentOrder;  // so we can read bids produced before the conversion
      }

      this.customer = bid.attributes.customer;

      this.isYuvalTest = this.customer.accessKey==='176'; // set prod debug option for customer Yuval

      console.log('isYuvalTest='+this.isYuvalTest);

      $rootScope.title = lov.company    // set title so PDF file will be named correctly
      + this.bid.attributes.documentType === 1 ? ' - הצעת מחיר ' : ' - הזמנה '
      + (this.customer.firstName ? this.customer.firstName : '')
      + ' ' + (this.customer.lastName ? this.customer.lastName : '')
      + ' ' + this.bid.attributes.desc;

      var that = this;

     //fetch menu type
      if (that.currentOrder.menuType) {
        this.menuType = menuTypes.filter(function (menu) {
          return menu.tId === that.currentQuote.menuType
        })[0];
      }

       //filter categories - only those in order and not transportation
      this.filteredCategories = this.categories.filter(function (cat) {
        if (cat.isTransportation) {
          return false
        }
        var categoryItems = that.currentQuote.items.filter(function (item) {
          return (item.category.tId === cat.tId);
        });
        return categoryItems.length;
      });

      this.filteredCategories.sort(function(a,b) {
        return a.order - b.order;
      });

      // filter items for current category
      this.setupCategoryItems = function (catId) {
        this.categoryItems = that.currentQuote.items.filter(function (item) {
          return (item.category.tId === catId);
        })
      };

      // filter transportation items
      this.setupTransportationItems = function () {
        this.transportationItems = that.currentQuote.items.filter(function (item) {
          return (item.category.isTransportation);
        });
      };


      if (isPrintQuote) {
        $timeout(function () {
          window.print()
        }, 100)
      }
    } else {  // bid not there - show error msg on page
      this.docNotAvailable = true
    }

  });
