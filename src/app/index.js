'use strict';

angular.module('pompidou', ['ui.router', 'ui.bootstrap','mwl.calendar']);

// Declare app level module which depends on filters, and services
angular.module('myApp', [
  'ui.router','ui.bootstrap', 'ngCkeditor', 'ngSanitize', 'ui.select', 'pompidou'
]).
config(function($stateProvider, $urlRouterProvider) {
  $urlRouterProvider.otherwise(function ($injector) {
    var $state = $injector.get('$state');
    $state.go('login');
  });
  $stateProvider
   .state('login', {
      url: '/login',
      templateUrl: 'app/partials/login.html',
      controller: 'LoginCtrl as loginModel'
    })
    .state('orderList', {
      url: '/orderListView/:queryType',
      templateUrl: 'app/partials/orderList.html',
      controller: 'OrderListCtrl as orderListModel',
      resolve: {
        queryType: ['$stateParams', function ($stateParams) {
          return $stateParams.queryType;
        }],
        customers: ['api', function (api) {
          return api.queryCustomers().then(function (objs) {
            return objs;
          });
        }],
        cancelReasons: ['cancelReasonsPromise', function (cancelReasonsPromise) {
          return cancelReasonsPromise;
        }],
        recentOpenings: ['api', function(api) {
          var from = new Date(new Date().setDate(new Date().getDate()-14));
          var to = new Date();
          return api.queryOrdersByRange('createdAt',from,to,['number','template'])
            .then(function(objs) {
              return objs;
            });
        }],
        recentClosings: ['api', function(api) {
          var from = new Date(new Date().setDate(new Date().getDate()-14));
          var to = new Date();
          return api.queryOrdersByRange('closingDate',from,to,['number','closingDate','template','header','vatRate'])
            .then(function(objs) {
              return objs;
            });
        }],
        colors: ['colorsPromise', function (colorsPromise) {
          return colorsPromise;
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
        isFromNew: [function () {
          return 0;
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
        cancelReasons: ['cancelReasonsPromise', function (cancelReasonsPromise) {
          return cancelReasonsPromise;
        }],
        menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
          return menuTypesPromise;
        }],
        colors: ['colorsPromise', function (colorsPromise) {
          return colorsPromise;
        }],
        employees: ['employeesPromise', function (employeesPromise) {
          return employeesPromise;
        }],
        pRoles: ['pRolesPromise', function (pRolesPromise) {
          return pRolesPromise;
        }],
        config: ['configPromise', function (configPromise) {
          return configPromise;
        }],
        categories: ['categoriesPromise', function (categoriesPromise) {
          return categoriesPromise;
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
        isFromNew: [function () {
          return 0;
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
        cancelReasons: ['cancelReasonsPromise', function (cancelReasonsPromise) {
          return cancelReasonsPromise;
        }],
        menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
          return menuTypesPromise;
        }],
        colors: ['colorsPromise', function (colorsPromise) {
          return colorsPromise;
        }],
        employees: ['employeesPromise', function (employeesPromise) {
          return employeesPromise;
        }],
        pRoles: ['pRolesPromise', function (pRolesPromise) {
          return pRolesPromise;
        }],
        config: ['configPromise', function (configPromise) {
          return configPromise;
        }],
        categories: ['categoriesPromise', function (categoriesPromise) {
          return categoriesPromise;
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
        isFromNew: [function () {
          return 0;
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
        cancelReasons: ['cancelReasonsPromise', function (cancelReasonsPromise) {
          return cancelReasonsPromise;
        }],
        menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
          return menuTypesPromise;
        }],
        colors: ['colorsPromise', function (colorsPromise) {
          return colorsPromise;
        }],
        employees: ['employeesPromise', function (employeesPromise) {
          return employeesPromise;
        }],
        pRoles: ['pRolesPromise', function (pRolesPromise) {
          return pRolesPromise;
        }],
        config: ['configPromise', function (configPromise) {
          return configPromise;
        }],
        categories: ['categoriesPromise', function (categoriesPromise) {
          return categoriesPromise;
        }],
          bidTextTypes: ['bidTextTypesPromise', function (bidTextTypesPromise) {
          return bidTextTypesPromise;
        }]
      }
    })
    .state('editOrder', {
      url: '/editOrderView/:id/:isFromNew',
      templateUrl: 'app/partials/order.html',
      controller: 'OrderCtrl as orderModel',
      resolve: {
        currentOrder: ['$stateParams', 'api', function ($stateParams, api) {
          return api.queryOrder($stateParams.id).then(function (objs) {
            return objs[0];
          });
        }],
        isFromNew: ['$stateParams', function ($stateParams) {
          return Number($stateParams.isFromNew);
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
        cancelReasons: ['cancelReasonsPromise', function (cancelReasonsPromise) {
          return cancelReasonsPromise;
        }],
        menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
          return menuTypesPromise;
        }],
        colors: ['colorsPromise', function (colorsPromise) {
          return colorsPromise;
        }],
        employees: ['employeesPromise', function (employeesPromise) {
          return employeesPromise;
        }],
        pRoles: ['pRolesPromise', function (pRolesPromise) {
          return pRolesPromise;
        }],
        config: ['configPromise', function (configPromise) {
          return configPromise;
        }],
        categories: ['categoriesPromise', function (categoriesPromise) {
          return categoriesPromise;
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
        colors: ['colorsPromise', function (colorsPromise) {
          return colorsPromise;
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

    .state('snacksAndDesserts', {
      url: '/snacksAndDesserts/:woId',
      templateUrl: 'app/partials/snacksAndDesserts.html',
      controller: 'SnacksAndDessertsCtrl as snacksAndDessertsModel',
      resolve: {
        catalog: ['api', function (api) {
          return api.queryCatalog(1).then(function (obj) {
            return obj;
          });
        }],
        categories: ['categoriesPromise', function (categoriesPromise) {
          return categoriesPromise;
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

    .state('stickers', {
      url: '/stickers/:woId',
      templateUrl: 'app/partials/stickers.html',
      controller: 'StickersCtrl as stickersModel',
      resolve: {
        catalog: ['api', function (api) {
          return api.queryCatalog(1).then(function (obj) {
            return obj;
          });
        }],
        categories: ['categoriesPromise', function (categoriesPromise) {
          return categoriesPromise;
        }],
        config: ['api', function (api) {
          return api.queryConfig().then(function (res) {
            return res[0].attributes;
          });
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

    .state('catalogList', {
      url: '/catalogList/:domain/:category',
      templateUrl: 'app/partials/catalogList.html',
      controller: 'Catalog2Ctrl as catalogListModel',
      resolve: {
        currentDomain: ['$stateParams', function ($stateParams) {
          return Number($stateParams.domain);
        }],
        currentCategory: ['$stateParams', function ($stateParams) {
          return Number($stateParams.category);
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }]
      }
    })

    .state('newCatalogItem', {
      url: '/newCatalogItem/:domain/:category',
      templateUrl: 'app/partials/catalogItem.html',
      controller: 'CatalogItemCtrl as catalogItemModel',
      resolve: {
        currentItem: [function () {
          return null;
        }],
        currentDomain: ['$stateParams', function ($stateParams) {
          return Number($stateParams.domain);
        }],
        currentCategory: ['$stateParams', function ($stateParams) {
          return Number($stateParams.category);
        }],
        allCategories: ['api', function (api) {
         return api.queryCategories().then (function (res) {
            return res.map(function (obj) {
              return obj.attributes;
            });
          });
        }],
        productNames: ['$stateParams','api', function ($stateParams, api) {
            return api.queryCatalog(Number($stateParams.domain),['productName']).then(function(names) {
              return names.map(function(name) {
                return {
                  id:   name.id,
                  name: name.attributes.productName,
                  isDeleted: name.attributes.isDeleted
                };
              });
            });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        sensitivities: ['sensitivitiesPromise', function (sensitivitiesPromise) {
          return sensitivitiesPromise;
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
        productNames: ['$stateParams','api', function ($stateParams, api) {
          return api.queryCatalogById($stateParams.id).then(function (objs) {
            return api.queryCatalog(objs[0].attributes.domain,['productName']).then(function(names) {
              return names.map(function(name) {
                return {
                  id:   name.id,
                  name: name.attributes.productName,
                  isDeleted: name.attributes.isDeleted
                };
              });
            });
          });
        }],
        measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
          return measurementUnitsPromise;
        }],
        sensitivities: ['sensitivitiesPromise', function (sensitivitiesPromise) {
          return sensitivitiesPromise;
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
      measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
        return measurementUnitsPromise;
      }],
      sensitivities: ['sensitivitiesPromise', function (sensitivitiesPromise) {
        return sensitivitiesPromise;
      }],
      employees: ['employeesPromise', function (employeesPromise) {
        return employeesPromise;
      }],
      pRoles: ['pRolesPromise', function (pRolesPromise) {
        return pRolesPromise;
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
      menuTypes: ['menuTypesPromise', function (menuTypesPromise) {
        return menuTypesPromise;
      }],
      referralSources: ['referralSourcesPromise', function (referralSourcesPromise) {
        return referralSourcesPromise;
      }],
      cancelReasons: ['cancelReasonsPromise', function (cancelReasonsPromise) {
        return cancelReasonsPromise;
      }],
      customers: ['api', function (api) {
        return api.queryCustomers().then(function (objs) {
          return objs;
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
        return api.queryCatalog(). then (function(catalog) {
          return catalog;
        });
      }],
      measurementUnits: ['measurementUnitsPromise', function (measurementUnitsPromise) {
        return measurementUnitsPromise;
      }],
      pRoles: ['pRolesPromise', function (pRolesPromise) {
        return pRolesPromise;
      }],
      categories: ['categoriesPromise', function (categoriesPromise) {
        return categoriesPromise;
      }],
      colors: ['colorsPromise', function (colorsPromise) {
        return colorsPromise;
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
    })
.state ('sensitivityList', {
    url: '/sensitivityList/:id',
    templateUrl: 'app/partials/sensitivityList.html',
    controller: 'SensitivityListCtrl as sensitivityListModel',
    resolve: {
      order: ['$stateParams', 'api', function ($stateParams, api) {
        return api.queryOrder ($stateParams.id).then (function (orders) {
          return orders[0];
        });
      }],
      sensitivities: ['sensitivitiesPromise', function (sensitivitiesPromise) {
        return sensitivitiesPromise;
      }],
      catalog: ['api', function(api) {
        return api.queryCatalog(1). then (function(catalog) {
          return catalog;
        });
      }],
      customers: ['api', function (api) {
        return api.queryCustomers().then(function (objs) {
          return objs;
        });
      }],
      colors: ['colorsPromise', function (colorsPromise) {
        return colorsPromise;
      }]
    }
  });
});

