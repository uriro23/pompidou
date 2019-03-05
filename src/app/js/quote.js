'use strict';

/* Controllers */
angular.module('myApp')
  .controller('QuoteCtrl', function (api, $state, $filter, $rootScope, $timeout,
                                   bid, lov, config, categories, moment,
                                   bidTextTypes, menuTypes, isPrintQuote) {
    $rootScope.menuStatus = 'hide';

    if (bid) {
      this.docNotAvailable = false;

      var that = this;
      this.bid = bid;
      this.categories = categories;
      this.config = config;
      this.currentOrder = this.bid.attributes.order;
      this.eventDate = moment(this.currentOrder.eventDate);
      if (this.currentOrder.eventTime) {
        this.eventTime = moment(this.currentOrder.eventTime);
      }
      if (this.currentOrder.quotes) {
        if (this.bid.attributes.menuType) {
          this.currentQuote = this.currentOrder.quotes.filter(function (q) {
            return q.menuType.tId===that.bid.attributes.menuType.tId;
          })[0];
        } else { // bid before multiple quotes era -- use active quote
          this.currentQuote = this.currentOrder.quotes[this.currentOrder.activeQuote];
        }
      } else {
        this.currentQuote = this.currentOrder;  // so we can read bids produced before the conversion
      }

      this.customer = bid.attributes.customer;

      $rootScope.title = lov.company    // set title so PDF file will be named correctly
      + ' - הצעת מחיר '
      + (this.customer.firstName ? this.customer.firstName : '')
      + ' ' + (this.customer.lastName ? this.customer.lastName : '')
      + ' ' + this.bid.attributes.desc;


      //fetch menu type
      if (that.currentQuote.menuType) {
        if (typeof that.currentQuote.menuType === 'number') {  // bid pre multiple quotes
          this.menuType = menuTypes.filter(function (menu) {
            return menu.tId === that.currentQuote.menuType
          })[0];
        } else {  // bid supports multiple quotes
          this.menuType = that.currentQuote.menuType;
        }
      } else {  // no menuType at all - use default
        this.menuType = menuTypes.filter(function(mt) {
          return mt.isDefault;
        })[0];
      }

      //fetch end box type
      if (that.currentQuote.endBoxType) {
        if (typeof that.currentQuote.endBoxType === 'number') {  // bid pre multiple quotes
          this.endBoxType = menuTypes.filter(function (menu) {
            return menu.tId === that.currentQuote.endBoxType
          })[0];
        } else {  // bid supports multiple quotes
          this.endBoxType = that.currentQuote.endBoxType;
        }
      } else {  // no endBoxType at all - use default
        this.endBoxType = menuTypes.filter(function(mt) {
          return mt.isDefault;
        })[0];
      }

      this.quoteHeading = this.bid.attributes.order.eventName || '';
      if (this.quoteHeading && this.currentQuote.title) {
        this.quoteHeading += ' - ';
      }
      this.quoteHeading += this.currentQuote.title;


      //filter categories - only those in order not transportation and not priceIncrease
      this.filteredCategories = this.categories.filter(function (cat) {
        if (cat.type > 2) {  // discard non food categories
          return false
        }
        var categoryItems = that.currentQuote.items.filter(function (item) {
          return (item.category.tId === cat.tId);
        });
        return categoryItems.length;
      });

      //merge with updated category descriptions
       this.filteredCategories = this.filteredCategories.map (function(cat) {
         if (!that.currentQuote.categories) {   // for old orders
           return cat;
         }
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
          return (item.category.tId === catId && !item.isFreeItem);
        });
        this.categoryPrice = this.categoryItems.reduce(function(prev,currentItem) { //sum category item prices
          return prev + currentItem.price;
        },0);
      };

      // filter all bonus food and externalServices items
      this.setupBonusItems = function () {
        this.bonusItems = that.currentQuote.items.filter(function (item) {
          return item.isFreeItem && item.category.type < 3 ||
            item.isFreeItem && item.category.type === 5;
        });
      };

      this.setupTransportationItems = function () {
        this.category = categories.filter(function(cat) {
          return cat.type === 3;  // transportation
        })[0];
        this.transportationItems = that.currentQuote.items.filter(function (item) {
          return (item.category.type === 3); // transportation
        });
        this.categoryPrice = this.transportationItems.reduce(function(prev,currentItem) { //sum category item prices
          return prev + (currentItem.isFreeItem?0:currentItem.price);
        },0);
      };

      this.setupPriceIncreaseItems = function () {
        this.category = categories.filter(function(cat) {
          return cat.type === 4; // priceIncrease
        })[0];
        this.priceIncreaseItems = that.currentQuote.items.filter(function (item) {
          return (item.category.type === 4);  // priceIncrease
        });
        if (this.priceIncreaseItems.length) {
          this.categoryPrice = this.priceIncreaseItems[0].price;
        }
      };

      this.setupExternalServicesItems= function () {
        this.category = categories.filter(function(cat) {
          return cat.type === 5; // externalServices
        })[0];
        this.externalServicesItems = that.currentQuote.items.filter(function (item) {
          return (item.category.type === 5);  // externalServices
        });
        this.categoryPrice = this.externalServicesItems.reduce(function(prev,currentItem) { //sum category item prices
          return prev + (currentItem.isFreeItem?0:currentItem.price);
        },0);
      };

      // set indication for bonus items
      this.isBonusItems = this.currentQuote.items.filter(function(item) {
        return item.isFreeItem;
      }).length > 0;


      if (isPrintQuote) {
        $timeout(function () {
          window.print()
        }, 100)
      }
    } else {  // bid not there - show error msg on page
      this.docNotAvailable = true
    }


  });


