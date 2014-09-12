'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogCtrl', function($state, api, catalog, lov, measurementUnits, categories) {
    this.domains = lov.domains;
    this.currentDomain = lov.domains[0];
    this.categories = categories;
    this.measurementUnits = measurementUnits;
    this.catalog = catalog;
    this.isChanged = false;

    // enrich catalog data
    for (var i=0; i<this.catalog.length; i++) {
      var that = this;
      this.catalog[i].view = {};
      this.catalog[i].isChanged = false;
      this.catalog[i].view.category = categories.filter (function (cat) {
        return cat.tId === that.catalog[i].attributes.category;
      }) [0];
      this.catalog[i].view.measurementUnit = measurementUnits.filter (function (mes) {
        return mes.tId === that.catalog[i].attributes.measurementUnit;
      }) [0];
    }

    this.itemChanged = function (ind) {
      this.catalog[ind].isChanged = true;
      this.isChanged = true;
    }

    this.updateItems = function () {
      for (var i=0; i<this.catalog.length; i++) {
        if (this.catalog[i].isChanged) {
          this.catalog[i].attributes.category = this.catalog[i].view.category.tId;
          this.catalog[i].attributes.measurementUnit = this.catalog[i].view.measurementUnit.tId;
          this.catalog[i].attributes.priceQuantity = Number(this.catalog[i].attributes.priceQuantity);
          this.catalog[i].attributes.price = Number(this.catalog[i].attributes.price);
          this.catalog[i].attributes.productionQuantity = Number(this.catalog[i].attributes.productionQuantity);
          api.saveObj (this.catalog[i]);
          this.catalog[i].isChanged = false;
        }
      }
      this.isChanged = false;
    }

    this.addItem = function () {
      var newItem = api.initCatalog();
      newItem.view = {};
      newItem.isChanged = true;
      newItem.attributes.domain = this.currentDomain.id;
      newItem.view.category = categories[0];
      newItem.view.measurementUnit = measurementUnits[0];
      newItem.attributes.priceQuantity = 0;
      newItem.attributes.price = 0;
      newItem.attributes.productionQuantity = 0;
      this.catalog.splice (0,0,newItem); // add new item at the front of the array
      this.isChanged = true;
    }

  });


