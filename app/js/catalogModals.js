'use strict';

angular.module('myApp')
  .controller ('CatalogExitListCtrl', function($modalInstance, catalogItem) {


  this.productDescription = catalogItem.attributes.productDescription;

  // create local copy of exitList so updates can be undone on cancel
  if (catalogItem.attributes.exitList) {
    this.exitList = catalogItem.attributes.exitList.slice();
  } else {  // for old catalog items without a list
    this.exitList = [];
  }

  //TODO: set focus on added item
  this.addItem = function () {
    this.exitList.push({item:''});
  };

  this.delItem = function (ind) {
    this.exitList.splice(ind,1);
  };

  this.done = function () {
    catalogItem.attributes.exitList = this.exitList.slice();
    $modalInstance.close();
  };

  this.cancel = function () {
    $modalInstance.dismiss();
  }
})
  .controller ('ComponentsCtrl', function($modalInstance,
                                          catalogItem,
                                          targetDomain,
                                          targetCategories,
                                          targetItems,
                                          measurementUnits) {


  this.setComponentView = function(compId) {
    var view = {};
    var catItem = targetItems.filter (function(cat) {
      return cat.id === compId;
    })[0];
    view.category = targetCategories.filter (function(cat) {
      return cat.tId === catItem.attributes.category;
    })[0];
    view.productDescription = catItem.attributes.productDescription;
    view.measurementUnit = measurementUnits.filter (function(mu) {
      return mu.tId === catItem.attributes.measurementUnit;
    })[0];
    return view;
  };

  this.productDescription = catalogItem.attributes.productDescription;
  this.productionQuantity = catalogItem.attributes.productionQuantity;
  this.targetDomain = targetDomain;
  this.targetCategories = targetCategories;
  this.currentCategory = targetCategories[0];
  this.targetItems = targetItems;
  this.measurementUnits = measurementUnits;

  var tempComponents = [];
  if (catalogItem.attributes.components) {
    tempComponents = catalogItem.attributes.components.filter (function (comp) {
      return (comp.domain === targetDomain);
    })
  }

  var that = this;
  this.components = tempComponents.map(function(comp) {
    var c = {};
    c.attr = comp;
    c.view = that.setComponentView(comp.id);
    return c;
  });

  this.setCategory = function () {
    var that = this;
    this.filteredItems = targetItems.filter (function (cat) {
      if (cat.attributes.category !== that.currentCategory.tId) {
        return false;
      }
      // exclude items already in list
      for (var i=0;i<that.components.length;i++) {
        if (that.components[i].attr.id === cat.id) {
          return false;
        }
      }
      return true;
    });
      this.filteredItems.sort (function (a,b) {
        if (a.attributes.productDescription > b.attributes.productDescription) {
          return 1
        } else {
          return -1
        }
      });
  };

  this.setItem = function() {
    var newItem = {};
    newItem.attr = {}; // attr is the object we are going to store. the rest of the item is for view only
    newItem.attr.id = this.currentItem.id;
    newItem.attr.domain = this.currentItem.attributes.domain;
    newItem.attr.quantity = 0;
    newItem.view = this.setComponentView (newItem.attr.id);
    this.components.push(newItem);
  };

  this.addItem = function () {
    this.isAddItem = true;
    this.setCategory();
  };

  this.delItem = function (ind) {
    this.components.splice(ind,1);
  };

  this.done = function () {
    // replace elements with matching domain in catalog components array while leaving other domains intact
    var globalComponents = [];
    if (catalogItem.attributes.components) {
      globalComponents = catalogItem.attributes.components.filter(function (comp) {
        return (comp.domain !== targetDomain);
      })
    }
    var localComponents = this.components.map (function(comp) {
      return comp.attr;
    });
    catalogItem.attributes.components = globalComponents.concat(localComponents);
    $modalInstance.close();
  };

  this.cancel = function () {
    $modalInstance.dismiss();
  };
  

});


