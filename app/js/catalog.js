'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogCtrl', function($state, api, lov, measurementUnits) {

    this.setDomain = function () {
      var that = this;
      return api.queryCategories(that.currentDomain.id)
        .then(function (results) {
          that.categories = results.map (function (cat) {
            return cat.attributes;
          });
          return api.queryCatalog (that.currentDomain.id)
            .then (function (results) {
            // sort results by category order and product description
            // first build an index of category order by tId (which is the value stored in category field of catalog)
            var catOrder = [];
            for (var i=0;i<that.categories.length;i++) {
              catOrder[that.categories[i].tId] = that.categories[i].order;
            }
              that.catalog = results.sort (function (a,b) {
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
              // enrich catalog data
              for (var i=0; i<that.catalog.length; i++) {
                that.catalog[i].view = {};
                that.catalog[i].isChanged = false;
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

    this.addItem = function () {
      var newItem = api.initCatalog();
      newItem.view = {};
      newItem.isChanged = true;
      newItem.attributes.domain = this.currentDomain.id;
      newItem.view.category = this.categories[0];
      newItem.view.measurementUnit = measurementUnits[0];
      newItem.attributes.priceQuantity = 0;
      newItem.attributes.price = 0;
      newItem.attributes.productionQuantity = 0;
      newItem.isNewItem = true; // used to do validity checks on new items before storing them
      this.catalog.splice (0,0,newItem); // add new item at the front of the array
      this.isChanged = true;
    }

    this.itemChanged = function (ind) {
      this.catalog[ind].isChanged = true;
      this.isChanged = true;
    };

    // productDescription
    this.productDescriptionChanged = function (ind) {
      this.catalog[ind].isProductDescriptionChanged = true;
    };

    this.setProductDescription = function (ind) {
      if (!this.catalog[ind].attributes.productDescription ||
          this.catalog[ind].attributes.productDescription.length === 0) {
        this.catalog[ind].isProductDescriptionError = true;
      } else {
        if (this.catalog[ind].isProductDescriptionChanged) {
          this.itemChanged(ind);
          this.catalog[ind].isProductDescriptionError = false;
        }
      }
      this.isProductDescriptionChanged = false;
    };

    // priceQuantity
    this.priceQuantityChanged = function (ind) {
      this.catalog[ind].isPriceQuantityChanged = true;
    };

    this.setPriceQuantity = function (ind) {
      if (this.catalog[ind].attributes.priceQuantity != Number(this.catalog[ind].attributes.priceQuantity) ||
          Number(this.catalog[ind].attributes.priceQuantity) <= 0) {
        this.catalog[ind].isPriceQuantityError = true;
      } else {
        if (this.catalog[ind].isPriceQuantityChanged) {
          this.itemChanged(ind);
          this.catalog[ind].isPriceQuantityError = false;
        }
      }
      this.isPriceQuantityChanged = false;
    };

    // price
    this.priceChanged = function (ind) {
      this.catalog[ind].isPriceChanged = true;
    };

    this.setPrice = function (ind) {
      if (this.catalog[ind].attributes.price != Number(this.catalog[ind].attributes.price) ||
        Number(this.catalog[ind].attributes.price) <= 0) {
        this.catalog[ind].isPriceError = true;
      } else {
        if (this.catalog[ind].isPriceChanged) {
          this.itemChanged(ind);
          this.catalog[ind].isPriceError = false;
        }
      }
      this.isPriceChanged = false;
    };

    // productionQuantity
    this.productionQuantityChanged = function (ind) {
      this.catalog[ind].isProductionQuantityChanged = true;
    };

    this.setProductionQuantity = function (ind) {
      if (this.catalog[ind].attributes.productionQuantity != Number(this.catalog[ind].attributes.productionQuantity) ||
        Number(this.catalog[ind].attributes.productionQuantity) <= 0) {
        this.catalog[ind].isProductionQuantityError = true;
      } else {
        if (this.catalog[ind].isProductionQuantityChanged) {
          this.itemChanged(ind);
          this.catalog[ind].isProductionQuantityError = false;
        }
      }
      this.isProductionQuantityChanged = false;
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
          return;
        }
      }
      for (var i=0; i<this.catalog.length; i++) {
        if (this.catalog[i].isDelete) {
          api.deleteObj (this.catalog[i]);
        } else if (this.catalog[i].isChanged) {
          if (!this.catalog[i].view.category.tId) {
            alert ('Missing category in line ' + i+1);
            return;
          } else {
            this.catalog[i].attributes.category = this.catalog[i].view.category.tId;
          }
          if (!this.catalog[i].view.measurementUnit.tId) {
            alert ('Missing measurement unit in line ' + i+1);
            return;
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
      this.isChanged = false;
      // TODO: sort items after save
    }

    this.domains = lov.domains;
    this.currentDomain = lov.domains[0];
    this.measurementUnits = measurementUnits;
    this.setDomain();
    //TODO: how to avoid mentioning classes in js code?
    this.changedClass = 'myChanged';
    this.errorClass = 'myError';
  });


