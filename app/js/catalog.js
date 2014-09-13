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
              that.catalog = results;
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
    }

    this.itemChanged = function (ind) {
      this.catalog[ind].isChanged = true;
      this.isChanged = true;
    }

    this.updateItems = function () {
      for (var i=0; i<this.catalog.length; i++) {
        if (this.catalog[i].isDelete) {
          api.deleteObj (this.catalog[i]);
        } else if (this.catalog[i].isChanged) {
          this.catalog[i].attributes.category = this.catalog[i].view.category.tId;
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
    }

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
      this.catalog.splice (0,0,newItem); // add new item at the front of the array
      this.isChanged = true;
    }

    this.domains = lov.domains;
    this.currentDomain = lov.domains[0];
    this.measurementUnits = measurementUnits;
    this.setDomain();
  });


