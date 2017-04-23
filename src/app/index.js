'use strict';

angular.module('pompidou', ['ui.router', 'ui.bootstrap','mwl.calendar']);

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
    .state('calendar', {
      url: '/calendarView',
      templateUrl: 'app/partials/calendar.html',
      controller: 'CalendarCtrl as calendarModel',
      resolve: {
        customers: ['api', function (api) {
          return api.queryCustomers().then(function (objs) {
            return objs;
          });
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
        woIndexes: ['api', function (api) {
          return api.queryWorkOrderIndex().then(function (obj) {
            return obj;
          });
        }]
      }
    })

    .state('todaysPrep', {
      url: '/todaysPrep/:woId',
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
        workOrder: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryWorkOrder(Number($stateParams.woId)).then(function (workItems) {
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

    .state('catalogList', {
      url: '/catalogList',
      templateUrl: 'app/partials/catalogList.html',
      controller: 'Catalog2Ctrl as catalogListModel',
      params: {
        domain: null,
        category: null
      },
      resolve: {
        currentDomain: ['$stateParams', function ($stateParams) {
          return $stateParams.domain;
        }],
        currentCategory: ['$stateParams', function ($stateParams) {
          return $stateParams.category;
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }]
      }
    })

    .state('newCatalogItem', {
      url: '/newCatalogItem',
      templateUrl: 'app/partials/catalogItem.html',
      controller: 'CatalogItemCtrl as catalogItemModel',
      params: {
        domain: null,
        category: null
      },
      resolve: {
        currentItem: [function () {
          return null;
        }],
        currentDomain: ['$stateParams', function ($stateParams) {
          return $stateParams.domain;
        }],
        currentCategory: ['$stateParams', function ($stateParams) {
          return $stateParams.category;
        }],
        allCategories: ['api', function (api) {
         return api.queryCategories().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            });
          });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
        }],
        config: ['api', function (api) {
          return api.queryConfig().then(function (res) {
            return res[0].attributes;
          });
        }]
      }
    })

    .state('editCatalogItem', {
      url: '/editCatalogItem/:id',
      templateUrl: 'app/partials/catalogItem.html',
      controller: 'CatalogItemCtrl as catalogItemModel',
      resolve: {
        currentItem: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCatalogById($stateParams.id).then(function (objs) {
            return objs[0];
          });
        }],
        currentDomain: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCatalogById($stateParams.id).then(function (objs) {
            return objs[0].attributes.domain;
          });
        }],
        currentCategory: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCatalogById($stateParams.id).then(function (objs) {
            return objs[0].attributes.category;
          });
        }],
        allCategories: ['api', function (api) {
          return api.queryCategories().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            });
          });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
        }],
        config: ['api', function (api) {
          return api.queryConfig().then(function (res) {
            return res[0].attributes;
          });
        }]
      }
    })

    .state('dupCatalogItem', {
      url: '/dupCatalogItem/:basedOnId',
      templateUrl: 'app/partials/catalogItem.html',
      controller: 'CatalogItemCtrl as catalogItemModel',
      resolve: {
        currentItem: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCatalogById($stateParams.basedOnId).then(function (objs) {
            return objs[0];
          });
        }],
        currentDomain: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCatalogById($stateParams.basedOnId).then(function (objs) {
            return objs[0].attributes.domain;
          });
        }],
        currentCategory: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryCatalogById($stateParams.basedOnId).then(function (objs) {
            return objs[0].attributes.category;
          });
        }],
        allCategories: ['api', function (api) {
          return api.queryCategories().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            });
          });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        eventTypes: ['eventTypesPromise', function (eventTypesPromise) {
          return eventTypesPromise;
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
      bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
        return bidTextTypesPromise;
      }],
      discountCauses: ['discountCausesPromise', function (discountCausesPromise) {
        return discountCausesPromise;
      }],
      categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }],
      menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
        return menuTypesPromise;
      }],
      role: ['api', function (api) {
        return api.queryRoles('everyone').then(function (res) {
          return res[0];
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
    .state ('quotePrint', {
    url: '/quotePrint/:uuid',
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
        return true;
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

