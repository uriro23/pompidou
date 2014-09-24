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
      catalogItem.attributes.productDescription = accessCatalog[i].ProductName;
      catalogItem.attributes.measurementUnit = Number(accessCatalog[i].MeasureUnit);
      catalogItem.attributes.priceQuantity = Number(accessCatalog[i].PriceQuantity);
      catalogItem.attributes.price = Number(accessCatalog[i].CatPrice);
      catalogItem.attributes.productionQuantity = Number(accessCatalog[i].ProductionQuantity);
      catalogItem.attributes.domain = Number(accessCatalog[i].Domain);
      catalogItem.attributes.accessKey = Number(accessCatalog[i].ItemId);
      console.log('converting item ' + accessCatalog[i].ItemId);
      api.saveObj(catalogItem). then (function (obj) {
          cvCatalog(i+1)
      });
    }
  }
);
