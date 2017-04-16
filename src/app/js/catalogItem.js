'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogItemCtrl', function ($state, $modal, $rootScope, api, lov,
                                           currentItem, currentDomain, currentCategory,
                                           allCategories, measurementUnits, config) {

    var model = this;
    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - קטלוג';

    model.setChanged = function (bool) {
      if (bool) {
        model.item.isChanged = true;
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
        model.item.isChanged = false;
        window.onbeforeunload = function () {
        };
        window.onblur = function () {
        };
        $rootScope.menuStatus = 'show';
      }
    };

   // Main Tab

    model.setProductDescription = function () {
      model.item.errors.productDescription =
        !model.item.attributes.productDescription || model.item.attributes.productDescription.length === 0;
      if (model.currentDomain.id === 1 && model.item.isCopyToShortDesc) {
        model.item.attributes.shortDescription = model.item.attributes.productDescription;
      }
      model.setChanged(true);
    };

    model.setShortDescription = function () {
      model.item.isCopyToShortDesc =
        model.item.attributes.productDescription === model.item.attributes.shortDescription;
      model.setChanged(true);
    };

    model.setPriceQuantity = function () {
      model.item.errors.priceQuantity =
        (model.currentDomain.id === 1 || Boolean(model.item.attributes.priceQuantity)) &&
        ((model.item.attributes.priceQuantity != Number(model.item.attributes.priceQuantity) ||
        Number(model.item.attributes.priceQuantity) <= 0));
      model.setChanged(true);
    };

    model.setPrice = function () {
      model.item.errors.price =
        (model.currentDomain.id === 1 || Boolean(model.item.attributes.price)) &&
        ((model.item.attributes.price != Number(model.item.attributes.price) ||
        Number(model.item.attributes.price) <= 0));
      model.setChanged(true);
    };

    model.setProductionQuantity = function () {
      model.item.errors.productionQuantity =
        model.item.attributes.productionQuantity != Number(model.item.attributes.productionQuantity) ||
        Number(model.item.attributes.productionQuantity) <= 0;
      model.setChanged(true);
    };

    model.setMinTime = function (ind) {
      model.item.errors.minTime =
        model.item.attributes.minTime != Number(model.item.attributes.minTime) ||
        Number(model.item.attributes.minTime) < 0;
      model.setChanged(true);
    };

    model.setMaxTime = function (ind) {
      model.item.errors.maxTime =
        model.item.attributes.maxTime != Number(model.item.attributes.maxTime) ||
        Number(model.item.attributes.maxTime) < 0;
      model.setChanged(true);
    };

    // Exit List Tab

    //TODO: set focus on added item
    model.addExitListItem = function () {
      model.item.attributes.exitList.push({item: ''});
      model.setChanged(true);
    };

    model.delExitListItem = function (ind) {
      model.item.attributes.exitList.splice(ind, 1);
      model.setChanged(true);
    };

    // Components Tab

   model.setCompCategory = function(comDomain) {
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

   model.setCompItem = function(compDomain) {
     compDomain.compItems.push(compDomain.currentItem);
     model.setChanged(true);
   };

   model.delItem = function(compDomain,ind) {
     compDomain.compItems.splice(ind,1);
     model.setChanged(true);
   };

   model.setCompQuantity = function(component) {
     component.isError =
       component.view.compQuantity != Number(component.view.compQuantity) ||
       Number(component.view.compQuantity) <= 0;
     model.setChanged(true);
  };

    // loads catalog items for the components of the current item
   model.loadComponentItems = function() {
     model.compDomains = lov.domains.filter(function(dom) {
       return dom.id > currentDomain;
     });
     model.compDomains.forEach(function(dom){
       dom.categories = allCategories.filter(function(cat){
         return cat.domain===dom.id;
       });
       dom.currentCategory = dom.categories[0];
       dom.compItems = [];
       model.setCompCategory(dom);
     });
     var ids = model.item.attributes.components.map(function(comp) {
       return comp.id;
     }).filter(function(id) {
       return id !== config.unhandledItemComponent && id !== config.unhandledItemMaterial;

     });
     api.queryCatalogByIds(ids)
       .then(function(res) {
         res.forEach(function(comp) {
           comp.view = {};
           comp.view.compQuantity = model.item.attributes.components.filter(function(comp2) {
             return comp2.id===comp.id;
           })[0].quantity;
           comp.view.category = allCategories.filter(function(cat) {
             return cat.tId===comp.attributes.category;
           })[0];
           comp.view.measurementUnit = measurementUnits.filter(function(mes) {
             return mes.tId===comp.attributes.measurementUnit;
           })[0];
           comp.isError = false;
           var ourDomain = model.compDomains.filter(function(d) {
             return d.id===comp.attributes.domain;
           })[0];
           ourDomain.compItems.push(comp);
         });
       });
   };

   // General

   model.saveItem = function() {
     var hasErrors = false;
     for (var e in model.item.errors) {
       if (model.item.errors.hasOwnProperty(e)) {
         if (model.item.errors[e]) {
           hasErrors = true;
         }
       }
     }
     model.compDomains.forEach(function(d) {
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
     if (!model.item.view.category.tId) {
       alert('Missing category');
       return;
     } else {
       model.item.attributes.category = model.item.view.category.tId;
     }
     if (!model.item.view.measurementUnit.tId) {
       alert('Missing measurement unit');
       return;
     }
     if (!model.item.view.minTimeUnit) {
       model.item.view.minTimeUnit = lov.timeUnits[0];
     }
     if (!model.item.view.maxTimeUnit) {
       model.item.view.maxTimeUnit = lov.timeUnits[0];
     }
     model.item.attributes.measurementUnit = model.item.view.measurementUnit.tId;
     model.item.attributes.minTimeUnit = model.item.view.minTimeUnit.id;
     model.item.attributes.maxTimeUnit = model.item.view.maxTimeUnit.id;
     model.item.attributes.priceQuantity = Number(model.item.attributes.priceQuantity);
     model.item.attributes.price = Number(model.item.attributes.price);
     model.item.attributes.productionQuantity = Number(model.item.attributes.productionQuantity);
     model.item.attributes.minTime = Number(model.item.attributes.minTime);
     model.item.attributes.maxTime = Number(model.item.attributes.maxTime);
     model.item.attributes.components = [];
     model.compDomains.forEach(function(d) {
       d.compItems.forEach(function(c) {
         var comp = {
           id: c.id,
           domain: c.attributes.domain,
           quantity: c.view.compQuantity
         };
         model.item.attributes.components.push(comp);
       });
     });
     // if no components/materials were specified insert dummy
     if (model.currentDomain.id === 1 && model.item.attributes.components.length === 0) {
       model.item.attributes.components.push({
         id: config.unhandledItemComponent,
         domain: 2,
         quantity: 1
       });
       model.item.attributes.components.push({
         id: config.unhandledItemMaterial,
         domain: 3,
         quantity: 1
       });
     }

     api.saveObj(model.item)
       .then(function(obj) {
         if (model.isNewItem) {
           model.item = obj;
           model.isNewItem = false;
           model.setupItemView();
           model.loadComponentItems();
         }
         model.setChanged(false);
       });
   };

   model.dupItem = function() {
     var tempItem = api.initCatalog();
     tempItem.attributes = model.item.attributes;
     model.item = tempItem;
     model.item.isCopyToShortDesc = model.item.attributes.productDescription===model.item.attributes.shortDescription;
     model.setupItemView();
     model.setChanged(false);
     model.loadComponentItems();
     model.isNewItem = true;
   };

    model.setupItemView = function() {
      model.item.view = {};
      model.item.errors = {};
      if (model.isNewItem) {
        model.item.view.category = model.categories.filter(function(cat) {
          return cat.tId===currentCategory;
        })[0];
        model.item.errors.productDescription = true;
        model.item.errors.productionQuantity = true;
        if (model.currentDomain.id===1) {
          model.item.errors.priceQuantity = true;
          model.item.errors.price = true;
        }
        model.item.view.measurementUnit = measurementUnits[0];
        model.item.view.minTimeUnit = lov.timeUnits[0];
        model.item.view.maxTimeUnit = lov.timeUnits[0];
        model.item.isCopyToShortDesc = true;
      } else {
        model.item.view.category = model.categories.filter(function (cat) {
          return cat.tId === model.item.attributes.category;
        }) [0];
        model.item.view.measurementUnit = model.measurementUnits.filter(function (mes) {
          return mes.tId === model.item.attributes.measurementUnit;
        }) [0];
        if (typeof model.item.attributes.minTimeUnit === 'number') {
          model.item.view.minTimeUnit = lov.timeUnits.filter(function (tu) {
            return tu.id === model.item.attributes.minTimeUnit;
          }) [0];
        }
        if (typeof model.item.attributes.maxTimeUnit === 'number') {
          model.item.view.maxTimeUnit = lov.timeUnits.filter(function (tu) {
            return tu.id === model.item.attributes.maxTimeUnit;
          }) [0];
        }
      }
      model.backupItemAttr = angular.copy(model.item.attributes);
    };

    model.cancel = function () {
      model.item.attributes = angular.copy(model.backupItemAttr);
      model.setupItemView();
      model.loadComponentItems();
      model.setChanged(false);
    };

    model.close = function () {
      $state.go('catalogList', {'domain':currentDomain, 'category': currentCategory});
    };

    // main block
    model.isMainTabActive = true;
    model.currentDomain = lov.domains[currentDomain];
    model.categories = allCategories.filter(function(cat) {
      return cat.domain===currentDomain;
    });
    model.measurementUnits = measurementUnits;
    model.timeUnits = lov.timeUnits;
    model.isNewItem = $state.current.name==='newCatalogItem' || $state.current.name==='dupCatalogItem';
   if (model.isNewItem) {
     model.item = api.initCatalog();
     model.item.attributes.domain = lov.domains.filter(function(dom) {
       return dom.id===currentDomain;
     })[0].id;
     model.item.attributes.priceQuantity = null;
     model.item.attributes.price = null;
     model.item.attributes.productionQuantity = null;
     model.item.attributes.minTime = null;
     model.item.attributes.maxTime = null;
     if (model.currentDomain.id === 1) {
       model.item.attributes.isInMenu = true;
     }
     model.item.attributes.exitList = [];
     model.item.attributes.components = [];
   } else {
     model.item = currentItem;
     }

   model.item.isCopyToShortDesc = model.item.attributes.productDescription===model.item.attributes.shortDescription;
   model.setupItemView();
   model.setChanged(false);
   model.loadComponentItems();
  })

  .controller('AckDelCatalogCtrl', function ($modalInstance, item) {
    model.item = item;

    model.setYes = function () {
      $modalInstance.close(true);
    };

    model.setNo = function () {
      $modalInstance.close(false);
    };
  });



