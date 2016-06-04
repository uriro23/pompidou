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
      if (that.currentQuote.menuType) {
        this.menuType = menuTypes.filter(function (menu) {
          return menu.tId === that.currentQuote.menuType
        })[0];
      } else {
        this.menuType = menuTypes[0];
      }

      this.quoteHeading = this.bid.attributes.order.eventName;
      if (this.quoteHeading && this.menuType.tId) {
        this.quoteHeading += ' - ';
      }
      if (this.menuType.tId) {
        this.quoteHeading += this.menuType.label;
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

      //merge with updated category descriptions
       this.filteredCategories = this.filteredCategories.map (function(cat) {
        var updCat = that.currentQuote.categories.filter(function(uCat) {
          return cat.tId === uCat.tId;
        })[0];
         // if category does not appear in updated quote list, this means user hasn't refreshed the list since category
        // was added, so we take the original description for it
        if (!updCat) {
          return cat;
        }
        var newCat = cat;
        if (updCat.isShowDescription) {
          newCat.description = updCat.description;
       } else {
          newCat.description = '';
        }
        return newCat;
      });

      this.filteredCategories.sort(function(a,b) {
        return a.order - b.order;
      });

      // filter items for current category
      this.setupCategoryItems = function (catId) {
        this.categoryItems = that.currentQuote.items.filter(function (item) {
          return (item.category.tId === catId);
        });
        this.categoryPrice = this.categoryItems.reduce(function(prev,currentItem) { //sum category item prices
          return prev + currentItem.price;
        },0)
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
  

