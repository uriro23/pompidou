'use strict';

/* Controllers */
angular.module('myApp')
  .controller('ConversionCtrl', function($state, api, lov, measurementUnits, categories, accessCatalog) {

    console.log('loaded '+ accessCatalog.length + ' catalog items');

    this.convertCatalog = function () {
      cvCatalog(0);
    }
    
    var cvCatalog = function (i) {
      if (i >= accessCatalog.length) {
        return;
      }
      var catalogItem = api.initCatalog();
      catalogItem.attributes.category = Number(accessCatalog[i].Category);
      if (catalogItem.attributes.category === 2 ||
          catalogItem.attributes.category === 3 ||
          catalogItem.attributes.category === 11 ||
          catalogItem.attributes.category === 35) {
        catalogItem.attributes.category = 1;
      }
      catalogItem.attributes.productDescription = accessCatalog[i].ProductName;
      catalogItem.attributes.measurementUnit = Number(accessCatalog[i].MeasureUnit);
      if (accessCatalog[i].PriceQuantity) {
        catalogItem.attributes.priceQuantity = Number(accessCatalog[i].PriceQuantity);
      }
      if (accessCatalog[i].CatPrice) {
        catalogItem.attributes.price = Number(accessCatalog[i].CatPrice);
      }
      if (accessCatalog[i].ProductionQuantity) {
        catalogItem.attributes.productionQuantity = Number(accessCatalog[i].ProductionQuantity);
      }
      catalogItem.attributes.domain = Number(accessCatalog[i].Domain);
      catalogItem.attributes.accessKey = Number(accessCatalog[i].ItemId);
      api.saveObj(catalogItem). then (function (obj) {
          cvCatalog(i+1)
      });
    }
  }
);
