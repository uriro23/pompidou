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

    this.addItem = function () {
     $state.go('newCatalogItem', {'domain':this.currentDomain.id, 'category':this.currentCategory.tId});
     };

    this.editItem = function (id) {
      $state.go('editCatalogItem', {'id':id});
    };

     this.filterItems = function(){
      var that = this;
      this.categoryItems = this.catalog.filter(function(cat) {
        return (cat.attributes.productName+' '+cat.attributes.productDescription).indexOf(that.filterText)>-1 &&
            (that.includeDeleted || !cat.attributes.isDeleted) &&
          (!that.isOnlyRemarks || cat.attributes.remarks);
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

    this.enrichCatalogData = function() {
      var that = this;
      this.catalog.forEach(function(cat) {
        cat.view = {};
        cat.view.category = that.categories.filter(function (categ) {
          return categ.tId === cat.attributes.category;
        }) [0];
        cat.view.measurementUnit = that.measurementUnits.filter(function (mes) {
          return mes.tId === cat.attributes.measurementUnit;
        }) [0];
        cat.view.prodMeasurementUnit = that.measurementUnits.filter(function (mes) {
          return mes.tId === cat.attributes.prodMeasurementUnit;
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
      this.filterText = '';
      this.filterItems();
    };

    this.fetchCategoryItems = function () {
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
            $rootScope.title = 'קטלוג - ' + that.currentCategory.label;
          return api.queryCatalogByCategory(that.currentCategory.tId)
            .then(function (results) {
              that.catalog = results.sort(function (a, b) {
                if (a.attributes.productName > b.attributes.productName) {
                  return 1;
                } else {
                  return -1;
                }
              });
              that.enrichCatalogData();
          });
        });
    };

    this.searchDomain = function () {
      var that = this;
      this.categoryItems = [];
      api.queryCatalog(this.currentDomain.id)
        .then(function(results) {
          that.catalog = results.filter(function(cat) {
            var bool = false;
            if (that.searchText.length) {
              bool = (cat.attributes.productName+' '+cat.attributes.productDescription).indexOf(that.searchText)>-1;
            } else bool = true;
            return bool;
          }).sort(function (a, b) {
            if (a.attributes.category > b.attributes.category) {
              return 1;
            } else if (a.attributes.category < b.attributes.category) {
              return -1
            } else if (a.attributes.productName > b.attributes.productName) {
              return 1;
            } else {
              return -1;
            }
          });
          that.enrichCatalogData();
        });
    };

    // main block
    this.domains = angular.copy(lov.domains);  // clone so that the splice won't affect the original lov
    this.domains.splice(0, 1);   // drop "events" domain
    this.currentDomain = this.domains[currentDomain-1];
    this.measurementUnits = measurementUnits;
    this.timeUnits = lov.timeUnits;
    this.searchText = '';
    this.fetchCategoryItems();
  });


