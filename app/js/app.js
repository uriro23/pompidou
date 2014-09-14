'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ui.router'
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
        customers: ['api', function (api) {
          return api.queryCustomers().then(function (objs) {
            return objs;
          })
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
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
          return api.queryOrders().then(function (objs) {
            return objs.filter(function (obj) {
              return $stateParams.id === obj.id;
            })[0];
          });
        }],
        customers: ['api', function (api) {
          return api.queryCustomers().then(function (objs) {
            return objs;
          })
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
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
      templateUrl: "partials/customer.html",
      controller: 'CustomerCtrl as customerModel',
      resolve: {
        currentCustomer: [function () {
          return null;
        }]
      }
    })
    .state('editCustomer', {
      url: "/editCustomerView/:id",
      templateUrl: "partials/customer.html",
      controller: 'CustomerCtrl as customerModel',
      resolve: {
        currentCustomer: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCustomers().then(function (objs) {
            return objs.filter(function (obj) {
              return $stateParams.id === obj.id;
            })[0];
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
});

