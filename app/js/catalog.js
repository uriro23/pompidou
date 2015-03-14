'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogCtrl', function($state, $modal, $rootScope, api, lov, measurementUnits) {

      $rootScope.menuStatus = 'show';
      var user = api.getCurrentUser();
      if (user) {
        $rootScope.username = user.attributes.username;
      } else {
        $state.go('login');
      }
      $rootScope.title = lov.company + ' - קטלוג';

    this.setChanged = function (bool) {
        if (bool) {
          this.isChanged = true;
          window.onbeforeunload = function () {   // force the user to commit or abort changes before moving
            return "יש שינויים שלא נשמרו"
          };
          window.onblur = function () {
            alert('יש שינויים שלא נשמרו')
          };
          $rootScope.menuStatus = 'empty';
        } else {
          this.isChanged = false;
          window.onbeforeunload = function () {};
          window.onblur = function () {};
          $rootScope.menuStatus = 'show';
        }
    };

    this.addItem = function () {
      var newItem = api.initCatalog();
      newItem.view = {};
      newItem.isChanged = true;
      newItem.attributes.domain = this.currentDomain.id;
      newItem.view.category = this.categories[0];
      newItem.view.measurementUnit = measurementUnits[0];
      newItem.attributes.priceQuantity = null;
      newItem.attributes.price = null;
      newItem.attributes.productionQuantity = null;
      if (this.currentDomain.id===1) {
        newItem.attributes.isInMenu = true;
      }
      newItem.attributes.exitList = [];
      newItem.attributes.components = [];
      newItem.isNewItem = true; // used to do validity checks on new items before storing them
      this.catalog.splice (0,0,newItem); // add new item at the front of the array
      this.setChanged(true);
    };

    this.itemChanged = function (ind) {
      this.catalog[ind].isChanged = true;
      this.setChanged(true);
    };

    this.setProductDescription = function (ind, updateShortDesc) {
      this.itemChanged(ind);
      this.catalog[ind].isProductDescriptionError =
        !this.catalog[ind].attributes.productDescription || this.catalog[ind].attributes.productDescription.length === 0;
      if (this.currentDomain.id===1 && updateShortDesc) {
        this.catalog[ind].attributes.shortDescription = this.catalog[ind].attributes.productDescription
      }
    };

   this.setPriceQuantity = function (ind) {
     this.itemChanged(ind);
     this.catalog[ind].isPriceQuantityError =
        (this.currentDomain.id === 1 || Boolean(this.catalog[ind].attributes.priceQuantity)) &&
        ((this.catalog[ind].attributes.priceQuantity != Number(this.catalog[ind].attributes.priceQuantity) ||
          Number(this.catalog[ind].attributes.priceQuantity) <= 0));
    };

    this.setPrice = function (ind) {
      this.itemChanged(ind);
      this.catalog[ind].isPriceError =
        (this.currentDomain.id === 1 || Boolean(this.catalog[ind].attributes.price)) &&
        ((this.catalog[ind].attributes.price != Number(this.catalog[ind].attributes.price) ||
           Number(this.catalog[ind].attributes.price) <= 0));
    };

    this.setProductionQuantity = function (ind) {
      this.itemChanged(ind);
      this.catalog[ind].isProductionQuantityError =
        this.catalog[ind].attributes.productionQuantity != Number(this.catalog[ind].attributes.productionQuantity) ||
        Number(this.catalog[ind].attributes.productionQuantity) <= 0;
    };

    this.updateExitList = function(ind) {
      var that = this;
      var exitListModal = $modal.open ({
        templateUrl: 'partials/catalogExitList.html',
        controller: 'CatalogExitListCtrl as catalogExitListModel',
        resolve: {
          catalogItem: function() {
            return that.catalog[ind];
          }
        },
        size: 'lg'
      });

      exitListModal.result.then (function () {
        that.itemChanged(ind);
      })
    };

    this.updateComponents = function(ind, targetDomain) {
      var that = this;
      var componentsModal = $modal.open ({
        templateUrl: 'partials/components.html',
        controller: 'ComponentsCtrl as componentsModel',
        resolve: {
          catalogItem: function() {
            return that.catalog[ind];
          },
          targetDomain: function() {
            return targetDomain;
          },
          targetCategories: function() {
            return api.queryCategories(targetDomain)
              .then (function(categories) {
                return categories.map(function(cat) {
                  return cat.attributes;
                });
            })
          },
          targetItems: function() {
            return api.queryCatalog(targetDomain)
              .then (function (items) {
                return items.filter(function (item) {
                  return !item.attributes.isDeleted
                });
            })
          },
          measurementUnits: function() {
            return measurementUnits;
          }
        },
        size: 'lg'
      });

      componentsModal.result.then (function () {
        that.itemChanged(ind);
      })
    };

    this.sortCatalog = function (catalog) {
      // sort results by category order and product description
      // first build a hash of category order by tId (which is the value stored in category field of catalog)
      var catOrder = [];
      for (var i=0;i<this.categories.length;i++) {
        catOrder[this.categories[i].tId] = this.categories[i].order;
      }
      return catalog.sort (function (a,b) {
        if (catOrder[a.attributes.category] > catOrder[b.attributes.category]) {
          return 1;
        } else if (catOrder[a.attributes.category] < catOrder[b.attributes.category]) {
          return -1;
        } else if (a.attributes.productDescription > b.attributes.productDescription ) {
          return 1;
        } else {
          return -1;
        }
      });
    };



     this.setDomain = function () {
      var that = this;
      this.setChanged(false);
      // if there have been changes in previous domain, save them
      return api.queryCategories(that.currentDomain.id)
        .then(function (results) {
          that.categories = results.map (function (cat) {
            return cat.attributes;
          });
          that.catalog = [];
          return api.queryCatalog (that.currentDomain.id)
            .then (function (results) {
            var tempCatalog = results.filter(function (cat) {
              return !cat.attributes.isDeleted
            });
            that.catalog = that.sortCatalog(tempCatalog);
            // enrich catalog data
            for (var i=0; i<that.catalog.length; i++) {
              that.catalog[i].view = {};
              that.catalog[i].view.category = that.categories.filter (function (cat) {
                return cat.tId === that.catalog[i].attributes.category;
              }) [0];
              that.catalog[i].view.measurementUnit = that.measurementUnits.filter (function (mes) {
                return mes.tId === that.catalog[i].attributes.measurementUnit;
              }) [0];
              that.catalog[i].isChanged = false;
            }
            that.setChanged(false);
          })
        })
    };

    // insert / update / logical delete all changed / marked catalog items
    this.updateItems = function () {
      var that = this;
      // first check if any errors exist
      for (var j=0;j<this.catalog.length; j++) {
        if (this.catalog[j].isNewItem) { // check that all invalid default values have been updated
          this.setProductDescription(j,false);
          this.setPriceQuantity(j);
          this.setPrice(j);
          this.setProductionQuantity(j);
        }
        if (this.catalog[j].isProductDescriptionError ||
          this.catalog[j].isPriceQuantityError ||
          this.catalog[j].isPriceError ||
          this.catalog[j].isProductionQuantityError) {
          alert ('לא ניתן לעדכן. תקן קודם את השגיאות המסומנות');
          return false;
        }
      }
      var itemsToUpdate = [];
      for (var i=0; i<this.catalog.length; i++) {
        if (this.catalog[i].isChanged) {
          if (!this.catalog[i].view.category.tId) {
            alert ('Missing category in line ' + i+1);
            return false;
          } else {
            this.catalog[i].attributes.category = this.catalog[i].view.category.tId;
          }
          if (!this.catalog[i].view.measurementUnit.tId) {
            alert ('Missing measurement unit in line ' + i+1);
            return false;
          }
          this.catalog[i].attributes.isDeleted = this.catalog[i].view.isDeleted;
          this.catalog[i].attributes.measurementUnit = this.catalog[i].view.measurementUnit.tId;
          this.catalog[i].attributes.priceQuantity = Number(this.catalog[i].attributes.priceQuantity);
          this.catalog[i].attributes.price = Number(this.catalog[i].attributes.price);
          this.catalog[i].attributes.productionQuantity = Number(this.catalog[i].attributes.productionQuantity);
          itemsToUpdate.push(this.catalog[i]);
          this.catalog[i].isChanged = false;
        }
      }

      this.catalog = [];
      api.saveObjects(itemsToUpdate)
        .then(function () {
          that.setDomain()
        });
      return true;
    };

    // main block
    this.setChanged(false);
    this.domains = angular.copy(lov.domains);  // clone so that the splice won't affect the original lov
    this.domains.splice(0,1);   // drop "events" domain
    this.currentDomain = this.domains[0];
    this.measurementUnits = measurementUnits;
    this.setDomain();
  });


