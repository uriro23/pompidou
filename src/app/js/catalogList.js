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

    this.sortCatalog = function (catalog) {
      // sort results by category order and product description
      // first build a hash of category order by tId (which is the value stored in category field of catalog)
      var catOrder = [];
      for (var i = 0; i < this.categories.length; i++) {
        catOrder[this.categories[i].tId] = this.categories[i].order;
      }
      return catalog.sort(function (a, b) {
        if (catOrder[a.attributes.category] > catOrder[b.attributes.category]) {
          return 1;
        } else if (catOrder[a.attributes.category] < catOrder[b.attributes.category]) {
          return -1;
        } else if (a.attributes.productDescription > b.attributes.productDescription) {
          return 1;
        } else {
          return -1;
        }
      });
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
     this.filterText = '';
     this.filterItems();
    };

    this.setDomain = function () {
      var that = this;
      this.categoryItems = [];
     return api.queryCategories(that.currentDomain.id)
        .then(function (results) {
          that.categories = results.map(function (cat) {
            return cat.attributes;
          });
          if (currentCategory && that.currentDomain.id===currentDomain) {
            that.currentCategory = that.categories.filter(function(cat) {
              return cat.tId === currentCategory;
            })[0];
          } else {
            that.currentCategory = that.categories[0];
          }
            return api.queryCatalog(that.currentDomain.id)
            .then(function (results) {
            that.catalog = that.sortCatalog(results);
            // enrich catalog data
            for (var i = 0; i < that.catalog.length; i++) {
              that.catalog[i].view = {};
              that.catalog[i].view.category = that.categories.filter(function (cat) {
                return cat.tId === that.catalog[i].attributes.category;
              }) [0];
              that.catalog[i].view.measurementUnit = that.measurementUnits.filter(function (mes) {
                return mes.tId === that.catalog[i].attributes.measurementUnit;
              }) [0];
              if (typeof that.catalog[i].attributes.minTimeUnit === 'number') {
                that.catalog[i].view.minTimeUnit = lov.timeUnits.filter(function (tu) {
                  return tu.id === that.catalog[i].attributes.minTimeUnit;
                }) [0];
              }
              if (typeof that.catalog[i].attributes.maxTimeUnit === 'number') {
                that.catalog[i].view.maxTimeUnit = lov.timeUnits.filter(function (tu) {
                  return tu.id === that.catalog[i].attributes.maxTimeUnit;
                }) [0];
              }
              that.catalog[i].isChanged = false;
            }
            that.setCategory();
          });
       });
    };


    // main block
    this.domains = angular.copy(lov.domains);  // clone so that the splice won't affect the original lov
    this.domains.splice(0, 1);   // drop "events" domain
    if (currentDomain) {
      this.currentDomain = this.domains[currentDomain-1]
    } else {
      this.currentDomain = this.domains[0];
    }
    this.measurementUnits = measurementUnits;
    this.timeUnits = lov.timeUnits;
    this.setDomain();
  });


