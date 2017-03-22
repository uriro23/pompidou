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
    var that = this;
    api.queryCatalogByCategory(comDomain.currentCategory.tId)
      .then(function(res) {
        comDomain.categoryItems = res.map(function(itm) {
          itm.view = {};
          itm.view.compQuantity = null;
          itm.view.category = comDomain.currentCategory;
          itm.view.measurementUnit = measurementUnits.filter(function(mes) {
            return mes.tId===itm.attributes.measurementUnit;
          })[0];
          itm.isError = true;  // has to specify quantity
          return itm;
        });
      });
   };

   this.setCompItem = function(compDomain) {
     compDomain.compItems.push(compDomain.currentItem);
     this.setChanged(true);
   };

   this.delItem = function(compDomain,ind) {
     compDomain.compItems.splice(ind,1);
     this.setChanged(true);
   };

   this.setCompQuantity = function(component) {
     component.isError =
       component.view.compQuantity != Number(component.view.compQuantity) ||
       Number(component.view.compQuantity) <= 0;
     this.setChanged(true);
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
       that.setCompCategory(dom);
     });
     var ids = this.item.attributes.components.map(function(comp) {
       return comp.id;
     }).filter(function(id) {
       return id !== config.unhandledItemComponent && id !== config.unhandledItemMaterial;

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
           comp.isError = false;
           var ourDomain = that.compDomains.filter(function(d) {
             return d.id===comp.attributes.domain;
           })[0];
           ourDomain.compItems.push(comp);
         });
       });
   };

   // General

   this.saveItem = function() {
     var that = this;
     var hasErrors = false;
     for (var e in this.item.errors) {
       if (this.item.errors.hasOwnProperty(e)) {
         if (this.item.errors[e]) {
           hasErrors = true;
         }
       }
     }
     this.compDomains.forEach(function(d) {
       d.compItems.forEach(function(i) {
         if (i.isError) {
           hasErrors = true;
         }
       });
     });
     if(hasErrors) {
       alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
       return;
     }
     if (!this.item.view.category.tId) {
       alert('Missing category');
       return;
     } else {
       this.item.attributes.category = this.item.view.category.tId;
     }
     if (!this.item.view.measurementUnit.tId) {
       alert('Missing measurement unit');
       return;
     }
     if (!this.item.view.minTimeUnit) {
       this.item.view.minTimeUnit = lov.timeUnits[0];
     }
     if (!this.item.view.maxTimeUnit) {
       this.item.view.maxTimeUnit = lov.timeUnits[0];
     }
     this.item.attributes.measurementUnit = this.item.view.measurementUnit.tId;
     this.item.attributes.minTimeUnit = this.item.view.minTimeUnit.id;
     this.item.attributes.maxTimeUnit = this.item.view.maxTimeUnit.id;
     this.item.attributes.priceQuantity = Number(this.item.attributes.priceQuantity);
     this.item.attributes.price = Number(this.item.attributes.price);
     this.item.attributes.productionQuantity = Number(this.item.attributes.productionQuantity);
     this.item.attributes.minTime = Number(this.item.attributes.minTime);
     this.item.attributes.maxTime = Number(this.item.attributes.maxTime);
     this.item.attributes.components = [];
     this.compDomains.forEach(function(d) {
       d.compItems.forEach(function(c) {
         var comp = {
           id: c.id,
           domain: c.attributes.domain,
           quantity: c.view.compQuantity
         };
         that.item.attributes.components.push(comp);
       });
     });
     // if no components/materials were specified insert dummy
     if (this.currentDomain.id === 1 && this.item.attributes.components.length === 0) {
       this.item.attributes.components.push({
         id: config.unhandledItemComponent,
         domain: 2,
         quantity: 1
       });
       this.item.attributes.components.push({
         id: config.unhandledItemMaterial,
         domain: 3,
         quantity: 1
       });
     }

     api.saveObj(this.item)
       .then(function(obj) {
         if (that.isNewItem) {
           that.item = obj;
           that.isNewItem = false;
           that.setupItemView();
           that.loadComponentItems();
         }
         that.setChanged(false);
       });
   };

   this.dupItem = function() {
     var tempItem = api.initCatalog();
     tempItem.attributes = this.item.attributes;
     this.item = tempItem;
     this.item.isCopyToShortDesc = this.item.attributes.productDescription===this.item.attributes.shortDescription;
     this.setupItemView();
     this.setChanged(false);
     this.loadComponentItems();
     this.isNewItem = true;
   };

   this.delItem = function() {
     var that = this;
     var ackDelModal = $modal.open({
       templateUrl: 'app/partials/catalogAckDelete.html',
       controller: 'AckDelCatalogCtrl as ackDelCatalogModel',
       resolve: {
         item: function () {
           return that.item;
         }
       },
       size: 'sm'
     });

     ackDelModal.result.then(function (isDelete) {
       if (isDelete) {
         api.deleteObj(that.item)
           .then(function() {
             $state.go('catalogList', {'domain':currentDomain, 'category': currentCategory});
           });
        }
       });
    };


    this.setupItemView = function() {
      this.item.view = {};
      this.item.errors = {};
      if (this.isNewItem) {
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
      this.loadComponentItems();
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
   if (this.isNewItem) {
     this.item = api.initCatalog();
     this.item.attributes.domain = lov.domains.filter(function(dom) {
       return dom.id===currentDomain;
     })[0].id;
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
     }

   this.item.isCopyToShortDesc = this.item.attributes.productDescription===this.item.attributes.shortDescription;
   this.setupItemView();
   this.setChanged(false);
   this.loadComponentItems();
  })

  .controller('AckDelCatalogCtrl', function ($modalInstance, item) {
    this.item = item;

    this.setYes = function () {
      $modalInstance.close(true);
    };

    this.setNo = function () {
      $modalInstance.close(false);
    };
  });



