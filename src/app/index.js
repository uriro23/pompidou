'use strict';

angular.module('pompidou', ['ui.router', 'ui.bootstrap']);

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ui.router','ui.bootstrap', 'ngCkeditor', 'ngSanitize', 'ui.select', 'pompidou'
]).
config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise(function ($injector, $location) {
    var $state = $injector.get('$state');
    /*  this is for pdfCrowd
    var l = $location.$$url.length;
    var i1 = $location.$$url.indexOf('/bid/');
    var p1 = $location.$$url.substr(i1+5,l-(i1+4));
    var i2 = $location.$$url.indexOf('%2Fbid%2F');
    var p2 = $location.$$url.substr(i2+9,l-(i2+8));
    if (i1>=0 && l > i1+5) {
      console.log('uuid1: ' + p1);
      $state.go('bid', {uuid: p1});
    } else if (i2>=0 && l > i2+9) {
      console.log('uuid2: ' + p2);
      $state.go('bid', {uuid: p2});
    } else {
      $state.go('default', {badUrl: $location.$$url});
    } */
    $state.go('default', {badUrl: $location.$$url});
  });
  $stateProvider
    .state('default', {
      url:'/default/:badUrl',
      templateUrl: 'app/partials/default.html',
      controller: 'DefaultCtrl as defaultModel',
      resolve: {
        badUrl: ['$stateParams', function($stateParams) {
          return $stateParams.badUrl;
        } ]
      }
    })
    .state('login', {
      url: '/login',
      templateUrl: 'app/partials/login.html',
      controller: 'LoginCtrl as loginModel'
    })
    .state('orderList', {
      url: '/orderListView',
      templateUrl: 'app/partials/orderList.html',
      controller: 'OrderListCtrl as orderListModel',
      resolve: {
        customers: ['api', function (api) {
          return api.queryCustomers().then(function (objs) {
            return objs;
          });
        }],
        eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
        }]
      }
    })
    .state('newOrder', {
      url: '/newOrderView',
      templateUrl: 'app/partials/order.html',
      controller: 'OrderCtrl as orderModel',
      resolve: {
        currentOrder: [function () {
          return null;
        }],
        customer: [function () {
          return null;
        }],
       measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
          return discountCausesPromise;
        }],
        referralSources: ['referralSourcesPromise', function (referralSourcesPromise) {
          return referralSourcesPromise;
        }],
        menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
          return menuTypesPromise;
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
    .state('newOrderByCustomer', {
      url: '/newOrderByCustomerView/:customerId',
      templateUrl: 'app/partials/order.html',
      controller: 'OrderCtrl as orderModel',
      resolve: {
        currentOrder: [function () {
          return null;
        }],
        customer: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCustomers($stateParams.customerId).then(function (objs) {
            return objs[0];
          });
        }],
       measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
          return discountCausesPromise;
        }],
        referralSources: ['referralSourcesPromise', function (referralSourcesPromise) {
          return referralSourcesPromise;
        }],
        menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
          return menuTypesPromise;
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
    .state('dupOrder', {
      url: '/dupOrderView/:basedOnId',
      templateUrl: 'app/partials/order.html',
      controller: 'OrderCtrl as orderModel',
      resolve: {
        currentOrder: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryOrder($stateParams.basedOnId).then(function (objs) {
            return objs[0];
          });
        }],
        customer: [function () {
          return null;
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
          return discountCausesPromise;
        }],
        referralSources: ['referralSourcesPromise', function (referralSourcesPromise) {
          return referralSourcesPromise;
        }],
        menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
          return menuTypesPromise;
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
      url: '/editOrderView/:id',
      templateUrl: 'app/partials/order.html',
      controller: 'OrderCtrl as orderModel',
      resolve: {
        currentOrder: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryOrder($stateParams.id).then(function (objs) {
            return objs[0];
          });
        }],
        customer: [function () {
          return null;
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
          return discountCausesPromise;
        }],
        referralSources: ['referralSourcesPromise', function (referralSourcesPromise) {
          return referralSourcesPromise;
        }],
        menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
          return menuTypesPromise;
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
    .state ('customerList', {
      url: '/customerListView',
      templateUrl: 'app/partials/customerList.html',
      controller: 'CustomerListCtrl as customerListModel',
      resolve: {
        customers: ['api', function (api) {
          return api.queryCustomers()
            .then(function (objs) {
              return objs;
            });
        }],
       eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
        }]
    }
  })
    .state('workOrder', {
      url: '/workOrderView',
      templateUrl: 'app/partials/workOrder.html',
      controller: 'WorkOrderCtrl as workOrderModel',
      resolve: {
        catalog: ['api', function (api) {
          return api.queryCatalog().then(function (obj) {
            return obj; // here we return the complete catalog, including deleted items
          });
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
            });
        }],
        workOrder: ['api', function (api) {
          return api.queryWorkOrder().then(function (obj) {
            return obj;
          });
        }]
      }
    })

    .state('todaysPrep', {
      url: '/todaysPrep',
      templateUrl: 'app/partials/todaysPrep.html',
      controller: 'TodaysPrepCtrl as todaysPrepModel',
      resolve: {
        catalog: ['api', function (api) {
          return api.queryCatalog(2).then(function (obj) {
            return obj; // we return all preparations, including deleted items
          });
        }],
        allCategories: ['allCategoriesPromise', function (allCategoriesPromise) {
          return allCategoriesPromise;
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        workOrder: ['api', function (api) {
          return api.queryWorkOrder().then(function (workItems) {
            return workItems.map(function (wi) {
              var att = wi.attributes;
              att.id = wi.id;
              return att;
            });
          });
        }]
      }
    })

    .state('catalog', {
      url: '/catalog',
      templateUrl: 'app/partials/catalog.html',
      controller: 'CatalogCtrl as catalogModel',
      resolve: {
        categories: ['api', function (api) {
          return api.queryCategories(1).then (function (res) {  // load by default categories of products domain
            return res.map(function (obj) {
              return obj.attributes;
            });
          });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        config: ['api', function (api) {
          return api.queryConfig().then(function (res) {
            return res[0].attributes;
          });
        }]
      }
     })

    .state ('admin', {
    url: '/admin',
    templateUrl: 'app/partials/admin.html',
    controller: 'AdminCtrl as adminModel',
    resolve: {
      config: ['api', function (api) {
        return api.queryConfig().then(function (res) {
          return res[0];
        });
      }],
      bidTextTypes: ['api', function (api) {
        return api.queryBidTextTypes().then(function (res) {
          return res;
        });
      }],
      categories: ['api', function (api) {
        return api.queryCategories().then (function (res) {
          return res;
        });
      }],
      eventTypes: ['api', function (api) {
        return api.queryEventTypes().then(function (res) {
          return res;
        });
      }],
      measurementUnits: ['api', function (api) {
        return api.queryMeasurementUnits().then(function (res) {
          return res;
        });
      }],
      discountCauses: ['api', function (api) {
        return api.queryDiscountCauses().then(function (res) {
          return res;
        });
      }],
      users: ['api', function (api) {
        return api.queryUsers().then(function (res) {
          return res;
        });
      }]
    }
  })

    .state ('statistics', {
    url: '/statistics',
    templateUrl: 'app/partials/statistics.html',
    controller: 'StatisticsCtrl as statisticsModel',
    resolve: {
      referralSources: ['referralSourcesPromise', function (referralSourcesPromise) {
        return referralSourcesPromise;
      }]
    }
  })

    .state('conversion', {
      url: '/conversion',
      templateUrl: 'app/partials/conversion.html',
      controller: 'ConversionCtrl as conversionModel',
      resolve: {
        categories: ['api', function (api) {
          return api.queryCategories().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            });
          });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        config: ['api', function (api) {
          return api.queryConfig().then(function (res) {
            return res[0];
          });
        }],
        accessCatalog: ['api', function (api) {
           return api.queryAccessCatalog().then (function (res) {
             return res.map(function (obj) {
               return obj.attributes;
             });
           });
        }],
        accessCustomers: ['api', function (api) {
          return api.queryAccessCustomers().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            });
          });
        }],
        accessOrders: ['api', function (api) {
          return api.queryAccessOrders().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            });
          });
        }]
      }
    })
    .state ('bid', {
    url: '/bid/:uuid',
    templateUrl: 'app/partials/bid.html',
    controller: 'BidCtrl as bidModel',
    resolve: {
      bid: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryBidByUuid ($stateParams.uuid).then (function (bids) {
          return bids[0];
        });
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
        return false;
      }]
    }
  })
    .state ('bidPrint', {
    url: '/bidPrint/:uuid',
    templateUrl: 'app/partials/bid.html',
    controller: 'BidCtrl as bidModel',
    resolve: {
      bid: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryBidByUuid ($stateParams.uuid).then (function (bids) {
          return bids[0];
        });
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
          return true;
      }]
    }
  })
    .state ('quote', {
    url: '/quote/:uuid',
    templateUrl: 'app/partials/quote.html',
    controller: 'QuoteCtrl as quoteModel',
    resolve: {
      bid: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryBidByUuid ($stateParams.uuid).then (function (bids) {
          return bids[0];
        });
      }],
      config: ['configPromise', function (configPromise) {
        return configPromise;
      }],
      bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
        return bidTextTypesPromise;
      }],
      menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
        return menuTypesPromise;
      }],
     categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }],
      isPrintQuote: [function () {
        return false;
      }]
   }
  })
    .state ('exitList', {
    url: '/exitList/:id',
    templateUrl: 'app/partials/exitList.html',
    controller: 'ExitListCtrl as exitListModel',
    resolve: {
      order: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryOrder ($stateParams.id).then (function (orders) {
          return orders[0];
        });
      }],
      catalog: ['api', function(api) {
        return api.queryCatalog(1). then (function(catalog) {
          return catalog.filter(function (cat) {
            return !cat.attributes.isDeleted;
          });
        });
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
    url: '/menu/:id',
    templateUrl: 'app/partials/menu.html',
    controller: 'MenuCtrl as menuModel',
    resolve: {
      order: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryOrder ($stateParams.id).then (function (orders) {
          return orders[0];
        });
      }],
       categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }]
    }
  });
});

