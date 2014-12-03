'use strict';

/* Controllers */
angular.module('myApp')
  .controller('ConversionCtrl', function($state,
                                         api,
                                         lov,
                                         measurementUnits,
                                         categories,
                                         accessCatalog,
                                         accessCustomers) {

    console.log('loaded '+ accessCatalog.length + ' catalog items');
    console.log('loaded '+ accessCustomers.length + ' customers');

    var idMap = []; // used to convert access catalog ids to parse ids for subitems (components)

    this.convertCatalog = function () {
      cvCatalog(0);
    };
    
    var cvCatalog = function (i) {
      if (i >= accessCatalog.length) {
        return;
      }
      var catalogItem = api.initCatalog();
      catalogItem.attributes.domain = Number(accessCatalog[i].Domain);
      catalogItem.attributes.accessKey = Number(accessCatalog[i].ItemId);
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
        api.queryAccessComponents(accessCatalog[i].ItemId)
          .then (function(comps) {
          catalogItem.attributes.exitList = comps.map(function (comp) {
            return {item: comp.attributes.CompName};
          })
        })
          .then (function() {
            return api.queryAccessCatalogSubitems(accessCatalog[i].ItemId)
              .then (function (subs) {
                catalogItem.attributes.components = subs.map (function(sub) {
                  var c = {};
                  c.domain = Number(sub.attributes.ContainedDomain);
                  c.id = idMap[Number(sub.attributes.ContainedId)];
                  if (!c.id) {
                    console.log('--- No parse id for access key '+ sub.attributes.ContainedId + '. container is '+catalogItem.attributes.accessKey);
                  }
                  c.quantity = Number(sub.attributes.ContainedQuantity);
                  return c;
                }).filter (function(sub) {  // filter out some illegal items who have a bad contained id in access
                  return sub.id;
                })
            })
        })
          .then (function() {
            return api.saveObj(catalogItem)
          . then (function (obj) {
            idMap[obj.attributes.accessKey] = obj.id;
            cvCatalog(i+1)
            });
        })
    }

    this.convertCustomers = function() {
      cvCustomer(0);
    }

    var cvCustomer = function (i) {
      if (i>=accessCustomers.length) {
        return;
      }

      var customer = api.initCustomer();
      customer.attributes.firstName = accessCustomers[i].FirstName;
      customer.attributes.lastName = accessCustomers[i].LastName;
      if (!accessCustomers[i].StreetAddress) {
        customer.attributes.address = accessCustomers[i].City;
      } else if (!accessCustomers[i].City) {
        customer.attributes.address = accessCustomers[i].StreetAddress
      } else {
        customer.attributes.address = accessCustomers[i].StreetAddress + ' ' + accessCustomers[i].City;
      }
      customer.attributes.mobilePhone = accessCustomers[i].CellPhone;
      customer.attributes.homePhone = accessCustomers[i].HomePhone;
      customer.attributes.workPhone = accessCustomers[i].WorkPhone;
      customer.attributes.email = accessCustomers[i].Email;

      api.saveObj(customer)
        .then (function() {
          cvCustomer(i+1);
      })
    }
  }
);
