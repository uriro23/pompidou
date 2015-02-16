'use strict';

/* Controllers */
angular.module('myApp')
  .controller('BidCtrl', function(api, $state, $filter, $rootScope, bid, lov, config, measurementUnits, categories) {
      $rootScope.hideMenu = true;
      var user = api.getCurrentUser();
      if (user) {
        $rootScope.username = user.attributes.username;
      } else {
        $state.go('login');
      }

    this.bid = bid;

    this.measurementUnits = measurementUnits;
    this.categories = categories;
    this.config = config[0];
    var currentOrder = this.bid.attributes.order;
    
    this.customer = bid.attributes.customer;

    $rootScope.title = lov.company    // set title so PDF file will be named correctly
    + this.bid.attributes.documentType===1?' - הצעת מחיר ':' - הזמנה '
    + (this.customer.firstName?this.customer.firstName:'')
    + ' ' + (this.customer.lastName?this.customer.lastName:'')
    + ' ' + this.bid.attributes.desc;

    var that = this;


    //fetch start bid text type
    if (currentOrder.startBidTextType) {
      api.queryBidTextTypes(currentOrder.startBidTextType)
        .then (function (bidTexts) {
        that.startBidTextType = bidTexts[0].attributes;
      })
    }

    // fetch end bid text type
    if (currentOrder.endBidTextType) {
      api.queryBidTextTypes(currentOrder.endBidTextType)
        .then (function (bidTexts) {
        that.endBidTextType = bidTexts[0].attributes;
      })
    }
    //fetch event type
    if (currentOrder.eventType) {
      api.queryEventTypes(currentOrder.eventType)
        .then (function (res) {
        that.eventType = res[0].attributes;
      })
    }

    //fetch discount cause
    if (currentOrder.discountCause) {
      api.queryDiscountCauses(currentOrder.discountCause)
        .then (function (res) {
        that.discountCause = res[0].attributes;
      })
    }

    //filter categories - only those in order and not bonus
    this.filteredCategories = this.categories.filter(function(cat) {
      var categoryItems = currentOrder.items.filter(function(item) {
        return (item.category.tId === cat.tId && !item.isFreeItem);
      });
      return categoryItems.length;
    })


    // filter items for current category
    this.setupCategoryItems = function(catId) {
      this.categoryItems = currentOrder.items.filter(function(item) {
        return (item.category.tId===catId && !item.isFreeItem);
      })
    }

    // filter bonus items
    this.setupFreeItems = function() {
      this.freeItems = currentOrder.items.filter(function(item) {
        return (item.isFreeItem);
      })
    }



    });
