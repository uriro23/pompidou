'use strict';

/* Controllers */
angular.module('myApp')
  .controller('BidCtrl', function (api, $state, $filter, $rootScope, $timeout,
                                   bid, lov, config, categories, moment,
                                   bidTextTypes, discountCauses, isPrintBid) {
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
      if (this.bid.attributes.version >= 4) { // bid with menuType
        this.currentQuote = this.currentOrder.quotes.filter(function (q) {  // find relevant quote in order
          return q.menuType.tId===that.bid.attributes.menuType.tId;
        })[0];
      } else if (this.bid.attributes.version === 3) { // bid w/o menuType but with quotes array
        this.currentQuote = this.currentOrder.quotes[this.currentOrder.activeQuote]; // use active quote of order
      } else {  // bid w/o quotes array
        this.currentQuote = this.currentOrder; // use body of order
      }


      this.customer = bid.attributes.customer;

      this.isYuvalTest = this.customer.accessKey==='176'; // set prod debug option for customer Yuval

      console.log('isYuvalTest='+this.isYuvalTest);

      $rootScope.title = lov.company  +  // set title so PDF file will be named correctly
        ' - הצעת מחיר ' +
      (this.customer.firstName ? this.customer.firstName : '') +
       ' ' + (this.customer.lastName ? this.customer.lastName : '') +
       ' ' + this.bid.attributes.desc;

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
