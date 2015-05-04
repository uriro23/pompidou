'use strict';

angular.module('pompidou', ['ui.router', 'ui.bootstrap']);

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ui.router','ui.bootstrap', 'ngCkeditor', 'ngSanitize', 'ui.select', 'pompidou'
]).
config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise("/login");
  $stateProvider
    .state('login', {
      url: "/login",
      templateUrl: "app/partials/login.html",
      controller: "LoginCtrl as loginModel"
    })
    .state('orderList', {
      url: "/orderListView",
      templateUrl: "app/partials/orderList.html",
      controller: 'OrderListCtrl as orderListModel',
      resolve: {
        fetchedOrders: ['api', function (api) {
          return api.queryFutureOrders().then(function (objs) {
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
      templateUrl: "app/partials/order.html",
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
        config: ['configPromise', function (configPromise) {
          return configPromise;
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
      templateUrl: "app/partials/order.html",
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
        config: ['configPromise', function (configPromise) {
          return configPromise;
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
    .state('workOrder', {
      url: "/workOrderView",
      templateUrl: "app/partials/workOrder.html",
      controller: 'WorkOrderCtrl as workOrderModel',
      resolve: {
        catalog: ['api', function (api) {
          return api.queryCatalog().then(function (obj) {
            return obj; // here we return the complete catalog, including deleted items
          })
        }],
        allCategories: ['allCategoriesPromise', function (allCategoriesPromise) {
          return allCategoriesPromise;
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        customers: ['api', function (api) {
          return api.queryCustomers()
              .then(function (objs) {
                return objs;
          })
        }],
        workOrder: ['api', function (api) {
          return api.queryWorkOrder().then(function (obj) {
            return obj;
          })
        }]
      }
    })

    .state('catalog', {
      url: "/catalog",
      templateUrl: "app/partials/catalog.html",
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
        config: ['api', function (api) {
          return api.queryConfig().then(function (res) {
            return res[0].attributes;
          })
        }]
      }
     })

    .state ('admin', {
    url: "/admin",
    templateUrl: "app/partials/admin.html",
    controller: "AdminCtrl as adminModel",
    resolve: {
      config: ['api', function (api) {
        return api.queryConfig().then(function (res) {
          return res[0];
        })
      }],
      bidTextTypes: ['api', function (api) {
        return api.queryBidTextTypes().then(function (res) {
          return res;
        })
      }],
      categories: ['api', function (api) {
        return api.queryCategories().then (function (res) {
          return res;
        });
      }],
      eventTypes: ['api', function (api) {
        return api.queryEventTypes().then(function (res) {
          return res;
        })
      }],
      measurementUnits: ['api', function (api) {
        return api.queryMeasurementUnits().then(function (res) {
          return res;
        })
      }],
      discountCauses: ['api', function (api) {
        return api.queryDiscountCauses().then(function (res) {
          return res;
        })
      }],
      users: ['api', function (api) {
        return api.queryUsers().then(function (res) {
          return res;
        })
      }]
    }
  })

    .state('conversion', {
      url: "/conversion",
      templateUrl: "app/partials/conversion.html",
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
        config: ['api', function (api) {
          return api.queryConfig().then(function (res) {
            return res[0];
          })
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
    url: "/bid/:uuid",
    templateUrl: "app/partials/bid.html",
    controller: "BidCtrl as bidModel",
    resolve: {
      bid: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryBidByUuid ($stateParams.uuid).then (function (bids) {
          return bids[0];
        })
      }],
      config: ['configPromise', function (configPromise) {
        return configPromise;
      }],
      bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
        return bidTextTypesPromise;
      }],
      eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
        return eventTypesPromise;
      }],
      discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
        return discountCausesPromise;
      }],
       categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }],
      isPrintBid: [function () {
        return false
      }]

    }
  })
    .state ('bidPrint', {
    url: "/bidPrint/:uuid",
    templateUrl: "app/partials/bid.html",
    controller: "BidCtrl as bidModel",
    resolve: {
      bid: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryBidByUuid ($stateParams.uuid).then (function (bids) {
          return bids[0];
        })
      }],
      config: ['configPromise', function (configPromise) {
        return configPromise;
      }],
      bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
        return bidTextTypesPromise;
      }],
      eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
        return eventTypesPromise;
      }],
      discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
        return discountCausesPromise;
      }],
      categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }],
      isPrintBid: [function () {
          return true
      }]
    }
  })
    .state ('exitList', {
    url: "/exitList/:id",
    templateUrl: "app/partials/exitList.html",
    controller: "ExitListCtrl as exitListModel",
    resolve: {
      order: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryOrders ($stateParams.id).then (function (orders) {
          return orders[0];
        })
      }],
      catalog: ['api', function(api) {
        return api.queryCatalog(1). then (function(catalog) {
          return catalog.filter(function (cat) {
            return !cat.attributes.isDeleted;
          })
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
    .state ('menu', {
    url: "/menu/:id",
    templateUrl: "app/partials/menu.html",
    controller: "MenuCtrl as menuModel",
    resolve: {
      order: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryOrders ($stateParams.id).then (function (orders) {
          return orders[0];
        })
      }],
       categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }]
    }
  })
});

