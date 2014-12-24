'use strict';

/* Controllers */
angular.module('myApp')
  .controller('MenuCtrl', function(api, $state, $filter, $rootScope, order, catalog, categories) {
    this.order = order;
    this.catalog = catalog;
    this.categories = categories;
    $rootScope.hideMenu = true;

    // fetch customer
    var that = this;

    //filter categories - only those in order
    this.filteredCategories = this.categories.filter(function(cat) {
      var categoryItems = that.order.attributes.items.filter(function(item) {
        return (item.category.tId === cat.tId);
      });
      return categoryItems.length;
    });


    // filter items for current category
    this.setupCategoryItems = function(catId) {
      this.categoryItems = that.order.attributes.items.filter(function(item) {
        return (item.category.tId===catId);
      })
    };

  });
