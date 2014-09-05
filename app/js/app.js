'use strict';


// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ui.router'
]).
config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/orderListView");
  $stateProvider
    .state('orderListState', {
      url: "/orderListView",
      templateUrl: "partials/orderList.html",
      controller: 'OrderListCtrl as orderListModel',
      resolve: {
        orders: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryOrders().then(function (objs) {
            return objs;
          })
        }],
        customers: ['$stateParams', 'api', function ($stateParams, api) {
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
        customers: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCustomers().then(function (objs) {
            return objs;
          })
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
        customers: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCustomers().then(function (objs) {
            return objs;
          })
        }],
        eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
        }],
        bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
          return bidTextTypesPromise;
        }]
      }
    })
    .state('customerListState', {
      url: "/customerListView",
      templateUrl: "partials/customerList.html",
      controller: 'CustomerListCtrl as customerListModel'
    })
    .state('customerState', {
      url: "/customerView/:id",
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
});

/*
.state('orderState', {
  url: "/orderView/:id",
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
    customers: ['$stateParams', 'api', function ($stateParams, api) {
      return api.queryCustomers().then(function (objs) {
        return objs;
      })
    }],
    eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
      return eventTypesPromise;
    }],
    bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
      return bidTextTypesPromise;
    }]
  }
})
*/