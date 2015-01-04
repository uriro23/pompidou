'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogCtrl', function($state, $modal, api, lov, measurementUnits) {

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
      newItem.attributes.exitList = [];
      newItem.isNewItem = true; // used to do validity checks on new items before storing them
      this.catalog.splice (0,0,newItem); // add new item at the front of the array
      this.isChanged = true;
    };

    this.itemChanged = function (ind) {
      this.catalog[ind].isChanged = true;
      this.isChanged = true;
    };

    this.setProductDescription = function (ind) {
      this.itemChanged(ind);
      this.catalog[ind].isProductDescriptionError =
        !this.catalog[ind].attributes.productDescription || this.catalog[ind].attributes.productDescription.length === 0;
    };

   this.setPriceQuantity = function (ind) {
     this.itemChanged(ind);
     this.catalog[ind].isPriceQuantityError =
        (this.currentDomain.id === 1 || Boolean(this.catalog[ind].attributes.priceQuantity)) &&
        ((this.catalog[ind].attributes.priceQuantity != Number(this.catalog[ind].attributes.priceQuantity) ||
          Number(this.catalog[ind].attributes.priceQuantity) <= 0));
    };

    this.priceChanged = function (ind) {
      this.catalog[ind].isPriceChanged = true;
    };
    this.setPrice = function (ind) {
      if (!this.catalog[ind].isPriceChanged) {
        return;
      }
      this.itemChanged(ind);
      this.catalog[ind].isPriceError =
        (this.currentDomain.id === 1 || Boolean(this.catalog[ind].attributes.price)) &&
        ((this.catalog[ind].attributes.price != Number(this.catalog[ind].attributes.price) ||
           Number(this.catalog[ind].attributes.price) <= 0));
      this.catalog[ind].isPriceChanged = false;
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
                return items;
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



    // update / delete all changed / marked catalog items
    this.updateItems = function () {
      // first check if any errors exist
      for (var j=0;j<this.catalog.length; j++) {
        if (this.catalog[j].isNewItem) { // check that all invalid default values have been updated
          this.setProductDescription(j);
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
      for (var i=0; i<this.catalog.length; i++) {
        if (this.catalog[i].isDelete) {
          api.deleteObj (this.catalog[i]);
        } else if (this.catalog[i].isChanged) {
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
          this.catalog[i].attributes.measurementUnit = this.catalog[i].view.measurementUnit.tId;
          this.catalog[i].attributes.priceQuantity = Number(this.catalog[i].attributes.priceQuantity);
          this.catalog[i].attributes.price = Number(this.catalog[i].attributes.price);
          this.catalog[i].attributes.productionQuantity = Number(this.catalog[i].attributes.productionQuantity);
          api.saveObj (this.catalog[i]);
          this.catalog[i].isChanged = false;
        }
      }
      // now remove deleted items from array
      for (i=this.catalog.length-1;i>=0;i--) {
        if (this.catalog[i].isDelete) {
          this.catalog.splice(i,1);
        }
      }
      this.catalog = this.sortCatalog(this.catalog);
      this.isChanged = false;
      return true;
    };

    this.setDomain = function () {
      var that = this;
      // if there have been changes in previous domain, save them
      if (that.isChanged) {
        if (!that.updateItems()) {
          return;
        }
      }
      return api.queryCategories(that.currentDomain.id)
        .then(function (results) {
          that.categories = results.map (function (cat) {
            return cat.attributes;
          });
          return api.queryCatalog (that.currentDomain.id)
            .then (function (results) {
            that.catalog = that.sortCatalog(results);
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
            that.isChanged = false;
          })
        })
    };

    this.isChanged = false;
    this.domains = lov.domains;
    this.domains.splice(0,1);   // drop "events" domain
    this.currentDomain = lov.domains[0];
    this.measurementUnits = measurementUnits;
    this.setDomain();
  });


