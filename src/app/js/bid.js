'use strict';

/* Controllers */
angular.module('myApp')
  .controller('BidCtrl', function (api, $state, $filter, $rootScope, $timeout,
                                   bid, lov, config, categories,
                                   bidTextTypes, eventTypes, discountCauses, isPrintBid) {
    $rootScope.menuStatus = 'hide';

    if (bid) {
      this.docNotAvailable = false;
      var that = this;

      this.bid = bid;

      this.categories = categories;
      this.config = config;
      this.currentOrder = this.bid.attributes.order;
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

      this.isYuvalTest = this.customer.accessKey==='176'; // set prod debug option for customer Yuval

      console.log('isYuvalTest='+this.isYuvalTest);

      $rootScope.title = lov.company  +  // set title so PDF file will be named correctly
      this.bid.attributes.documentType === 1 ? ' - הצעת מחיר ' : ' - הזמנה ' +
      (this.customer.firstName ? this.customer.firstName : '') +
       ' ' + (this.customer.lastName ? this.customer.lastName : '') +
       ' ' + this.bid.attributes.desc;

      var that = this;
      //fetch start bid text type
      if (that.currentOrder.startBidTextType) {
        this.startBidTextType = bidTextTypes.filter(function (btt) {
          return btt.tId === that.currentOrder.startBidTextType;
        })[0];
      }

      // fetch end bid text type
      if (that.currentOrder.endBidTextType) {
        this.endBidTextType = bidTextTypes.filter(function (btt) {
          return btt.tId === that.currentOrder.endBidTextType;
        })[0];
      }
      //fetch event type
      if (that.currentOrder.eventType) {
        this.eventType = eventTypes.filter(function (evt) {
          return evt.tId === that.currentOrder.eventType;
        })[0];
      }

      //fetch discount cause
      if (this.currentQuote.discountCause) {
        if (typeof this.currentQuote.discountCause === 'number') {  // pre multiple quotes bid
          this.discountCause = discountCauses.filter(function (dsc) {
            return dsc.tId === that.currentQuote.discountCause;
          })[0];
        } else {  // in new bids discountCause object is stores in quote
          this.discoutCause = this.currentQuote.discountCause;
        }
      }

      //filter categories - only those in order and not transportation
      this.filteredCategories = this.categories.filter(function (cat) {
        if (cat.isTransportation) {
          return false;
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
        });
      };

      // filter transportation items
      this.setupTransportationItems = function () {
        this.transportationItems = that.currentQuote.items.filter(function (item) {
          return (item.category.isTransportation);
        });
      };


      if (isPrintBid) {
        $timeout(function () {
          window.print();
        }, 100);
      }
    } else {  // bid not there - show error msg on page
      this.docNotAvailable = true;
    }

  });
