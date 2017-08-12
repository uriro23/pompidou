'use strict';

/* Controllers */
angular.module('myApp')
  .controller('Catalog2Ctrl', function ($state, $rootScope, api, lov,
                                        currentDomain, currentCategory, measurementUnits) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - קטלוג';

    this.addItem = function () {
     $state.go('newCatalogItem', {'domain':this.currentDomain.id, 'category':this.currentCategory.tId});
     };

    this.editItem = function (id) {
      $state.go('editCatalogItem', {'id':id});
    };

     this.filterItems = function(){
      var that = this;
      this.categoryItems = this.catalog.filter(function(cat) {
        return cat.attributes.category===that.currentCategory.tId &&
            cat.attributes.productDescription.indexOf(that.filterText)>-1 &&
            (that.includeDeleted || !cat.attributes.isDeleted);
      });
    };

    this.setCategory = function () {
      $state.go('catalogList',{'domain':this.currentDomain.id,'category':this.currentCategory.tId});
     };

    this.setDomain = function () {
      var that = this;
      this.categoryItems = [];
      return api.queryCategories(that.currentDomain.id)
        .then(function (results) {
          that.categories = results.map(function (cat) {
            return cat.attributes;
          });
          that.currentCategory = that.categories[0];
          that.setCategory();
        });
    };

    this.initDomain = function () {
      var that = this;
      this.categoryItems = [];
      return api.queryCategories(that.currentDomain.id)
        .then(function (results) {
          that.categories = results.map(function (cat) {
            return cat.attributes;
          });
            that.currentCategory = that.categories.filter(function(cat) {
              return cat.tId === currentCategory;
            })[0];
          return api.queryCatalogByCategory(that.currentCategory.tId)
            .then(function (results) {
              that.catalog = results.sort(function (a, b) {
                if (a.attributes.productDescription > b.attributes.productDescription) {
                  return 1;
                } else {
                  return -1;
                }
              });
              // enrich catalog data
              that.catalog.forEach(function(cat) {
                cat.view = {};
                cat.view.category = that.categories.filter(function (categ) {
                  return categ.tId === cat.attributes.category;
                }) [0];
                cat.view.measurementUnit = that.measurementUnits.filter(function (mes) {
                  return mes.tId === cat.attributes.measurementUnit;
                }) [0];
                if (typeof cat.attributes.minTimeUnit === 'number') {
                  cat.view.minTimeUnit = lov.timeUnits.filter(function (tu) {
                    return tu.id === cat.attributes.minTimeUnit;
                  }) [0];
                }
                if (typeof cat.attributes.maxTimeUnit === 'number') {
                  cat.view.maxTimeUnit = lov.timeUnits.filter(function (tu) {
                    return tu.id === cat.attributes.maxTimeUnit;
                  }) [0];
                }
                cat.isChanged = false;
              });
              that.filterText = '';
              that.filterItems();
            });
        });
    };


    // main block
    this.domains = angular.copy(lov.domains);  // clone so that the splice won't affect the original lov
    this.domains.splice(0, 1);   // drop "events" domain
    this.currentDomain = this.domains[currentDomain-1];
    this.measurementUnits = measurementUnits;
    this.timeUnits = lov.timeUnits;
    this.initDomain();
  });


