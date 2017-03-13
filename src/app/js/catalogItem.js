'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogItemCtrl', function ($state, $modal, $rootScope, api, lov,
                                           currentItem, currentDomain, currentCategory,
                                           categories, measurementUnits, config) {

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
          return 'יש שינויים שלא נשמרו';
        };
        /*
        window.onblur = function () {
          alert('יש שינויים שלא נשמרו')
        };
        */
        $rootScope.menuStatus = 'empty';
      } else {
        this.isChanged = false;
        window.onbeforeunload = function () {
        };
        window.onblur = function () {
        };
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
      newItem.view.minTimeUnit = lov.timeUnits[0];
      newItem.view.maxTimeUnit = lov.timeUnits[0];

      newItem.attributes.priceQuantity = null;
      newItem.attributes.price = null;
      newItem.attributes.productionQuantity = null;
      newItem.attributes.minTime = null;
      newItem.attributes.maxTime = null;
      if (this.currentDomain.id === 1) {
        newItem.attributes.isInMenu = true;
      }
      newItem.attributes.exitList = [];
      newItem.attributes.components = [];
      newItem.isNewItem = true; // used to do validity checks on new items before storing them
      this.catalog.splice(0, 0, newItem); // add new item at the front of the array
      this.setChanged(true);
    };


    this.setProductDescription = function (ind, updateShortDesc) {
      this.itemChanged(ind);
      this.catalog[ind].isProductDescriptionError =
        !this.catalog[ind].attributes.productDescription || this.catalog[ind].attributes.productDescription.length === 0;
      if (this.currentDomain.id === 1 && updateShortDesc) {
        this.catalog[ind].attributes.shortDescription = this.catalog[ind].attributes.productDescription;
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

    this.setMinTime = function (ind) {
      this.itemChanged(ind);
      this.catalog[ind].isMinTimeError =
        this.catalog[ind].attributes.minTime != Number(this.catalog[ind].attributes.minTime) ||
        Number(this.catalog[ind].attributes.minTime) < 0;
    };

    this.setMaxTime = function (ind) {
      this.itemChanged(ind);
      this.catalog[ind].isMaxTimeError =
        this.catalog[ind].attributes.maxTime != Number(this.catalog[ind].attributes.maxTime) ||
        Number(this.catalog[ind].attributes.maxTime) < 0;
    };

    this.updateExitList = function (ind) {
      var that = this;
      var exitListModal = $modal.open({
        templateUrl: 'app/partials/catalogExitList.html',
        controller: 'CatalogExitListCtrl as catalogExitListModel',
        resolve: {
          catalogItem: function () {
            return that.catalog[ind];
          }
        },
        size: 'lg'
      });

      exitListModal.result.then(function () {
        that.itemChanged(ind);
      });
    };

    this.updateComponents = function (ind, targetDomain) {
      var that = this;
      var componentsModal = $modal.open({
        templateUrl: 'app/partials/components.html',
        controller: 'ComponentsCtrl as componentsModel',
        resolve: {
          catalogItem: function () {
            return that.catalog[ind];
          },
          targetDomain: function () {
            return targetDomain;
          },
          targetCategories: function () {
            return api.queryCategories(targetDomain)
              .then(function (categories) {
              return categories.map(function (cat) {
                return cat.attributes;
              });
            });
          },
          targetItems: function () {
            return api.queryCatalog(targetDomain)
              .then(function (items) {
              return items.filter(function (item) {
                return !item.attributes.isDeleted;
              });
            });
          },
          config: ['api', function (api) {
            return api.queryConfig().then(function (res) {
              return res[0].attributes;
            });
          }],
          measurementUnits: function () {
            return measurementUnits;
          }
        },
        size: 'lg'
      });

      componentsModal.result.then(function () {
        that.itemChanged(ind);
      });
    };

    // insert / update / logical delete all changed / marked catalog items
    this.updateItems = function () {
      var that = this;
      // first check if any errors exist
      for (var j = 0; j < this.catalog.length; j++) {
        if (this.catalog[j].isNewItem) { // check that all invalid default values have been updated
          this.setProductDescription(j, false);
          this.setPriceQuantity(j);
          this.setPrice(j);
          this.setProductionQuantity(j);
        }
        if (this.catalog[j].isProductDescriptionError ||
          this.catalog[j].isPriceQuantityError ||
          this.catalog[j].isPriceError ||
          this.catalog[j].isProductionQuantityError ||
          this.catalog[j].isMinTimeError ||
          this.catalog[j].isMaxTimeError) {
          alert('לא ניתן לעדכן. תקן קודם את השגיאות המסומנות');
          return false;
        }
      }
      var itemsToUpdate = [];
      for (var i = 0; i < this.catalog.length; i++) {
        if (this.catalog[i].isChanged) {
          if (!this.catalog[i].view.category.tId) {
            alert('Missing category in line ' + i + 1);
            return false;
          } else {
            this.catalog[i].attributes.category = this.catalog[i].view.category.tId;
          }
          if (!this.catalog[i].view.measurementUnit.tId) {
            alert('Missing measurement unit in line ' + i + 1);
            return false;
          }
          if (!this.catalog[i].view.minTimeUnit) {
            this.catalog[i].view.minTimeUnit = lov.timeUnits[0];
          }
          if (!this.catalog[i].view.maxTimeUnit) {
            this.catalog[i].view.maxTimeUnit = lov.timeUnits[0];
          }
           this.catalog[i].attributes.isDeleted = this.catalog[i].view.isDeleted;
          this.catalog[i].attributes.measurementUnit = this.catalog[i].view.measurementUnit.tId;
          this.catalog[i].attributes.minTimeUnit = this.catalog[i].view.minTimeUnit.id;
          this.catalog[i].attributes.maxTimeUnit = this.catalog[i].view.maxTimeUnit.id;
          this.catalog[i].attributes.priceQuantity = Number(this.catalog[i].attributes.priceQuantity);
          this.catalog[i].attributes.price = Number(this.catalog[i].attributes.price);
          this.catalog[i].attributes.productionQuantity = Number(this.catalog[i].attributes.productionQuantity);
          this.catalog[i].attributes.minTime = Number(this.catalog[i].attributes.minTime);
          this.catalog[i].attributes.maxTime = Number(this.catalog[i].attributes.maxTime);
          // if no components/materials were specified insert dummy
          if (this.currentDomain.id === 1 && this.catalog[i].attributes.components.length === 0) {
            this.catalog[i].attributes.components.push({
              id: config.unhandledItemComponent,
              domain: 2,
              quantity: 1
            });
            this.catalog[i].attributes.components.push({
              id: config.unhandledItemMaterial,
              domain: 3,
              quantity: 1
            });
          }
          itemsToUpdate.push(this.catalog[i]);
          this.catalog[i].isChanged = false;
        }
      }

      this.catalog = [];
      api.saveObjects(itemsToUpdate)
        .then(function () {
          that.setDomain();
        });
      return true;
    };

    // main block
    var that = this;
    this.currentDomain = lov.domains[currentDomain];
    this.categories = categories;
    this.measurementUnits = measurementUnits;
    this.timeUnits = lov.timeUnits;
    this.isNewItem = $state.current.name==='newCatalogItem' || $state.current.name==='dupCatalogItem';
   if (this.isNewItem) {
     this.item = api.initCatalog();
     this.item.view = {};
     this.item.isChanged = true;
     this.item.attributes.domain = lov.domains.filter(function(dom) {
       return dom.id===currentDomain;
     });
     this.item.view.category = this.categories.filter(function(cat) {
       return cat.tId===currentCategory;
     })[0];
     this.item.view.measurementUnit = measurementUnits[0];
     this.item.view.minTimeUnit = lov.timeUnits[0];
     this.item.view.maxTimeUnit = lov.timeUnits[0];

     this.item.attributes.priceQuantity = null;
     this.item.attributes.price = null;
     this.item.attributes.productionQuantity = null;
     this.item.attributes.minTime = null;
     this.item.attributes.maxTime = null;
     if (this.currentDomain.id === 1) {
       this.item.attributes.isInMenu = true;
     }
     this.item.attributes.exitList = [];
     this.item.attributes.components = [];
   } else {
     this.item = currentItem;
     this.item.view = {};
     this.item.view.category = that.categories.filter(function (cat) {
       return cat.tId === that.item.attributes.category;
     }) [0];
     this.item.view.measurementUnit = that.measurementUnits.filter(function (mes) {
       return mes.tId === that.item.attributes.measurementUnit;
     }) [0];
     if (typeof this.item.attributes.minTimeUnit === 'number') {
       this.item.view.minTimeUnit = lov.timeUnits.filter(function (tu) {
         return tu.id === that.item.attributes.minTimeUnit;
       }) [0];
     }
     if (typeof this.item.attributes.maxTimeUnit === 'number') {
       this.item.view.maxTimeUnit = lov.timeUnits.filter(function (tu) {
         return tu.id === that.item.attributes.maxTimeUnit;
       }) [0];
     }
   }
    this.setChanged(false);
 });


