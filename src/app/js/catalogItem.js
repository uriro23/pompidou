'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogItemCtrl', function ($state, $modal, $rootScope, api, lov,
                                           currentItem, currentDomain, currentCategory,
                                           allCategories, measurementUnits, config) {

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
        this.item.isChanged = true;
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
        this.item.isChanged = false;
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


    // Main Tab

    this.setProductDescription = function () {
      this.item.errors.productDescription =
        !this.item.attributes.productDescription || this.item.attributes.productDescription.length === 0;
      if (this.currentDomain.id === 1 && this.item.isCopyToShortDesc) {
        this.item.attributes.shortDescription = this.item.attributes.productDescription;
      }
      this.setChanged(true);
    };

    this.setShortDescription = function () {
      this.item.isCopyToShortDesc =
        this.item.attributes.productDescription === this.item.attributes.shortDescription;
      this.setChanged(true);
    };

    this.setPriceQuantity = function () {
      this.item.errors.priceQuantity =
        (this.currentDomain.id === 1 || Boolean(this.item.attributes.priceQuantity)) &&
        ((this.item.attributes.priceQuantity != Number(this.item.attributes.priceQuantity) ||
        Number(this.item.attributes.priceQuantity) <= 0));
      this.setChanged(true);
    };

    this.setPrice = function () {
      this.item.errors.price =
        (this.currentDomain.id === 1 || Boolean(this.item.attributes.price)) &&
        ((this.item.attributes.price != Number(this.item.attributes.price) ||
        Number(this.item.attributes.price) <= 0));
      this.setChanged(true);
    };

    this.setProductionQuantity = function () {
      this.item.errors.productionQuantity =
        this.item.attributes.productionQuantity != Number(this.item.attributes.productionQuantity) ||
        Number(this.item.attributes.productionQuantity) <= 0;
      this.setChanged(true);
    };

    this.setMinTime = function (ind) {
      this.item.errors.minTime =
        this.item.attributes.minTime != Number(this.item.attributes.minTime) ||
        Number(this.item.attributes.minTime) < 0;
      this.setChanged(true);
    };

    this.setMaxTime = function (ind) {
      this.item.errors.maxTime =
        this.item.attributes.maxTime != Number(this.item.attributes.maxTime) ||
        Number(this.item.attributes.maxTime) < 0;
      this.setChanged(true);
    };

    // Exit List Tab

    //TODO: set focus on added item
    this.addExitListItem = function () {
      this.item.attributes.exitList.push({item: ''});
      this.setChanged(true);
    };

    this.delExitListItem = function (ind) {
      this.item.attributes.exitList.splice(ind, 1);
      this.setChanged(true);
    };

    // Components Tab

   this.setCompCategory = function(comDomain) {
      api.queryCatalogByCategory(comDomain.currentCategory.tId)
        .then(function(res) {
          comDomain.itemNames = res.map(function(c) {
            return {
              id: c.id,
              productDescription: c.attributes.productDescription
            };
          });
        });
   };

    // loads catalog items for the components of the current item
   this.loadComponentItems = function() {
     var that = this;
     this.compDomains = lov.domains.filter(function(dom) {
       return dom.id > currentDomain;
     });
     this.compDomains.forEach(function(dom){
       dom.categories = allCategories.filter(function(cat){
         return cat.domain===dom.id;
       });
       dom.currentCategory = dom.categories[0];
       dom.compItems = [];
       api.queryCatalogByCategory(dom.currentCategory.tId)
         .then(function(res) {
           dom.itemNames = res.map(function(c) {
             return {
               id: c.id,
               productDescription: c.attributes.productDescription
             };
           });
         });
     });
      console.log('compDomains:');
      console.log(this.compDomains);
     var ids = this.item.attributes.components.map(function(comp) {
       return comp.id;
     });
     api.queryCatalogByIds(ids)
       .then(function(res) {
         res.forEach(function(comp) {
           comp.view = {};
           comp.view.compQuantity = that.item.attributes.components.filter(function(comp2) {
             return comp2.id===comp.id;
           })[0].quantity;
           comp.view.category = allCategories.filter(function(cat) {
             return cat.tId===comp.attributes.category;
           })[0];
           comp.view.measurementUnit = measurementUnits.filter(function(mes) {
             return mes.tId===comp.attributes.measurementUnit;
           })[0];
           var ourDomain = that.compDomains.filter(function(d) {
             return d.id===comp.attributes.domain;
           })[0];
           ourDomain.compItems.push(comp);
         });
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

    this.setupItemView = function () {
      this.item.view = {};
      this.item.errors = {};
      if (this.isNewItem) { // todo: set to false on save
        this.item.view.category = this.categories.filter(function(cat) {
          return cat.tId===currentCategory;
        })[0];
        this.item.errors.productDescription = true;
        this.item.errors.productionQuantity = true;
        if (this.currentDomain.id===1) {
          this.item.errors.priceQuantity = true;
          this.item.errors.price = true;
        }
        this.item.view.measurementUnit = measurementUnits[0];
        this.item.view.minTimeUnit = lov.timeUnits[0];
        this.item.view.maxTimeUnit = lov.timeUnits[0];
        this.item.isCopyToShortDesc = true;
      } else {
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
      this.backupItemAttr = angular.copy(this.item.attributes);
    };

    this.cancel = function () {
      this.item.attributes = angular.copy(this.backupItemAttr);
      this.setupItemView();
      this.setChanged(false);
    };

    this.close = function () {
      $state.go('catalogList', {'domain':currentDomain, 'category': currentCategory});
    };

    // main block
    var that = this;
    this.isMainTabActive = true;
    this.currentDomain = lov.domains[currentDomain];
    this.categories = allCategories.filter(function(cat) {
      return cat.domain===currentDomain;
    });
    this.measurementUnits = measurementUnits;
    this.timeUnits = lov.timeUnits;
    this.isNewItem = $state.current.name==='newCatalogItem' || $state.current.name==='dupCatalogItem';
   if (this.isNewItem) { // todo: set to false on save
     this.item = api.initCatalog();
     this.item.attributes.domain = lov.domains.filter(function(dom) {
       return dom.id===currentDomain;
     });
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
     if (currentItem.attributes.components.length) {
       console.log('components:');
       console.log(currentItem.attributes.components);
     }
     }
     this.item.isCopyToShortDesc = this.item.attributes.productDescription===this.item.attributes.shortDescription;

   this.setupItemView();
   this.setChanged(false);

    that.loadComponentItems();
  });


