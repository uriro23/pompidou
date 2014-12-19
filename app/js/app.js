'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ui.router','ui.bootstrap'
]).
config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/orderListView");
  $stateProvider
    .state('orderList', {
      url: "/orderListView",
      templateUrl: "partials/orderList.html",
      controller: 'OrderListCtrl as orderListModel',
      resolve: {
        orders: ['api', function (api) {
          return api.queryOrders().then(function (objs) {
            return objs;
          })
        }],
        customers: ['api', function (api) {
          return api.queryCustomers().then(function (objs) {
            return objs;
          })
        }],
        eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
        }]
      }
    })
    .state('newOrder', {
      url: "/newOrderView",
      templateUrl: "partials/order.html",
      controller: 'OrderCtrl as orderModel',
      resolve: {
        currentOrder: [function () {
          return null;
        }],
        bids: [function () {
          return null;
        }],
         measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
          return discountCausesPromise;
        }],
        vat: ['vatPromise', function (vatPromise) {
          return vatPromise;
        }],
        categories: ['categoriesPromise', function (categoriesPromise) {
          return categoriesPromise;
        }],
        eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
        }],
        bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
          return bidTextTypesPromise;
        }]
      }
    })
    .state('editOrder', {
      url: "/editOrderView/:id",
      templateUrl: "partials/order.html",
      controller: 'OrderCtrl as orderModel',
      resolve: {
        currentOrder: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryOrders($stateParams.id).then(function (objs) {
            return objs[0];
          });
        }],
        bids: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryBidsByOrder($stateParams.id).then (function (bids) {
            return bids;
          })
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
          return discountCausesPromise;
        }],
        vat: ['vatPromise', function (vatPromise) {
          return vatPromise;
        }],
        categories: ['categoriesPromise', function (categoriesPromise) {
          return categoriesPromise;
        }],
        eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
        }],
        bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
          return bidTextTypesPromise;
        }]
      }
    })
    .state('customerList', {
      url: "/customerListView",
      templateUrl: "partials/customerList.html",
      controller: 'CustomerListCtrl as customerListModel'
    })
    .state('newCustomer', {
      url: "/newCustomerView",
      templateUrl: "../partials/oldCustomer.html",
      controller: 'OldCustomerCtrl as oldCustomerModel',
      resolve: {
        currentCustomer: [function () {
          return null;
        }]
      }
    })
    .state('editCustomer', {
      url: "/editCustomerView/:id",
      templateUrl: "../partials/oldCustomer.html",
      controller: 'CustomerCtrl as customerModel',
      resolve: {
        currentCustomer: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCustomers($stateParams.id).then(function (objs) {
            return objs[0];
          });
        }]
      }
    })
    .state('catalog', {
      url: "/catalog",
      templateUrl: "partials/catalog.html",
      controller: 'CatalogCtrl as catalogModel',
      resolve: {
        categories: ['api', function (api) {
          return api.queryCategories(1).then (function (res) {  // load by default categories of products domain
            return res.map(function (obj) {
              return obj.attributes;
            })
          });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        catalog: ['api', function (api) {
            return api.queryCatalog(1).then (function (obj) { // load by default products domain
                return obj;
            })
        }]
      }
     })
    .state('conversion', {
      url: "/conversion",
      templateUrl: "partials/conversion.html",
      controller: "ConversionCtrl as conversionModel",
      resolve: {
        categories: ['api', function (api) {
          return api.queryCategories().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            })
          });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        accessCatalog: ['api', function (api) {
           return api.queryAccessCatalog().then (function (res) {
             return res.map(function (obj) {
               return obj.attributes;
             })
           })
        }],
        accessCustomers: ['api', function (api) {
          return api.queryAccessCustomers().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            })
          })
        }],
        accessOrders: ['api', function (api) {
          return api.queryAccessOrders().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            })
          })
        }]
      }
    })
    .state ('bid', {
    url: "/bid/:id",
    templateUrl: "partials/bid.html",
    controller: "BidCtrl as bidModel",
    resolve: {
      bid: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryBidById ($stateParams.id).then (function (bids) {
          return bids[0];
        })
      }],
      measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
        return measurementUnitsPromise;
      }],
      categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }]
    }
  })
    .state ('exitList', {
    url: "/exitList/:id",
    templateUrl: "partials/exitList.html",
    controller: "ExitListCtrl as exitListModel",
    resolve: {
      order: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryOrders ($stateParams.id).then (function (orders) {
          return orders[0];
        })
      }],
      catalog: ['api', function(api) {
        return api.queryCatalog(1). then (function(catalog) {
          return catalog;
        })
      }],
      measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
        return measurementUnitsPromise;
      }],
      categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }]
    }
  })
});

