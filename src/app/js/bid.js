'use strict';

/* Controllers */
angular.module('myApp')
  .controller('BidCtrl', function (api, $state, $filter, $rootScope, $timeout,
                                   bid, lov, config, categories,
                                   bidTextTypes, eventTypes, discountCauses, isPrintBid) {
    $rootScope.menuStatus = 'hide';

    if (bid) {
      this.docNotAvailable = false;

      this.bid = bid;

      this.categories = categories;
      this.config = config;
      var currentOrder = this.bid.attributes.order;

      this.customer = bid.attributes.customer;

      $rootScope.title = lov.company    // set title so PDF file will be named correctly
      + this.bid.attributes.documentType === 1 ? ' - הצעת מחיר ' : ' - הזמנה '
      + (this.customer.firstName ? this.customer.firstName : '')
      + ' ' + (this.customer.lastName ? this.customer.lastName : '')
      + ' ' + this.bid.attributes.desc;


      //fetch start bid text type
      if (currentOrder.startBidTextType) {
        this.startBidTextType = bidTextTypes.filter(function (btt) {
          return btt.tId === currentOrder.startBidTextType
        })[0];
      }

      // fetch end bid text type
      if (currentOrder.endBidTextType) {
        this.endBidTextType = bidTextTypes.filter(function (btt) {
          return btt.tId === currentOrder.endBidTextType
        })[0];
      }
      //fetch event type
      if (currentOrder.eventType) {
        this.eventType = eventTypes.filter(function (evt) {
          return evt.tId === currentOrder.eventType
        })[0];
      }

      //fetch discount cause
      if (currentOrder.discountCause) {
        this.discountCause = discountCauses.filter(function (dsc) {
          return dsc.tId === currentOrder.discountCause
        })[0];
      }

      //filter categories - only those in order and not transportation
      this.filteredCategories = this.categories.filter(function (cat) {
        if (cat.isTransportation) {
          return false
        }
        var categoryItems = currentOrder.items.filter(function (item) {
          return (item.category.tId === cat.tId);
        });
        return categoryItems.length;
      });

      this.filteredCategories.sort(function(a,b) {
        return a.order - b.order;
      });

      // filter items for current category
      this.setupCategoryItems = function (catId) {
        this.categoryItems = currentOrder.items.filter(function (item) {
          return (item.category.tId === catId);
        })
      };

      // filter transportation items
      this.setupTransportationItems = function () {
        this.transportationItems = currentOrder.items.filter(function (item) {
          return (item.category.isTransportation);
        });
      };


      if (isPrintBid) {
        $timeout(function () {
          window.print()
        }, 100)
      }
    } else {  // bid not there - show error msg on page
      this.docNotAvailable = true
    }

  });
