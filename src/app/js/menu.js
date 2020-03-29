'use strict';

/* Controllers */
angular.module('myApp')
  .controller('MenuCtrl', function (api, $state, $filter, $rootScope, lov, order, categories) {
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'תפריט';

    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }


    var currentOrder = order.properties;
    var currentQuote = currentOrder.quotes[currentOrder.activeQuote];
    this.categories = categories;

    // fetch customer
    var that = this;

    //filter categories - only those in order
    this.filteredCategories = this.categories.filter(function (cat) {
      var categoryItems = currentQuote.items.filter(function (item) {
        return (item.category.tId === cat.tId && item.isInMenu);
      });
      return categoryItems.length;
    });


    // filter items for current category
    this.setupCategoryItems = function (catId) {
      this.categoryItems = currentQuote.items.filter(function (item) {
        return (item.category.tId === catId && item.isInMenu);
      })
    };

  });
