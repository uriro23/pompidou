'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
angular.module('myApp').
  value('version', '0.1')
  .service ('api', function($q, $rootScope,secrets) {
  Parse.initialize(secrets.parseKey, secrets.parseSecret);

// Generic functions
// -----------------

  this.saveObj = function (obj) {
    var promise = $q.defer();
    for (var fieldName in obj.attributes) {
      obj.set (fieldName, obj.attributes[fieldName]);
    }
    obj.save({}, {
      success: function (o) {
        console.log (o.attributes);
        promise.resolve(o);
        $rootScope.$digest();
      },
      error: function (model, error) {
        alert('Save Error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest();
      }
    });
    return promise.promise;
  };


  this.deleteObj = function (obj) {
    var promise = $q.defer();
    obj.destroy({
      success: function (o) {
        console.log('object '+ o.id+' deleted')
        promise.resolve(o);
        $rootScope.$digest();
      },
      error: function (model, error) {
        console.log (error);
        alert('delete Error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest();
      }
    });
    return promise.promise;
  };


  function query(qry) {
    var promise = $q.defer();
    qry.find({
      success: function (results) {
        promise.resolve(results);
        $rootScope.$digest();
      },
      error: function (error) {
        promise.reject(error);
        $rootScope.$digest();
      }
    });
    return promise.promise;
  }

  // Order
  // -----

  var Order = Parse.Object.extend("Order");

  this.initOrder = function () {
    return new Order();
  };

  this.queryOrders = function (id) {
    var orderQuery = new Parse.Query(Order);
    if (id) {
      orderQuery.equalTo('objectId',id);
    }
    orderQuery.limit(1000);
    return query(orderQuery);
  };

  this.queryOrdersForWorkOrder = function (typ) {
    var orderQuery = new Parse.Query(Order);
    if (typ===1) {
      orderQuery.equalTo('isMarkedForWorkOrder', true);
    } else {
      orderQuery.equalTo('isInWorkOrder', true);
    }
    orderQuery.limit(1000);
    return query(orderQuery);
  };

  this.queryFutureOrders = function (today) {
    var orderQuery = new Parse.Query(Order);
    orderQuery.greaterThanOrEqualTo('eventDate',today);
     orderQuery.limit(1000);
    return query(orderQuery);
  };


  //  OrderNum
  //  --------

  var OrderNum = Parse.Object.extend("OrderNum");

  this.queryOrderNum = function () {
      var orderNumQuery = new Parse.Query(OrderNum);
      return query(orderNumQuery);
  };

  // Bid
  // -----

  var Bid = Parse.Object.extend("Bid");

  this.initBid = function () {
    return new Bid();
   };

  this.queryBidsByOrder = function (orderId) {
    var bidQuery = new Parse.Query(Bid);
    bidQuery.equalTo("orderId",orderId);
    bidQuery.descending("date");
    return query(bidQuery);
  };

  this.queryBidById = function (id) {
    var bidQuery = new Parse.Query(Bid);
    bidQuery.equalTo("objectId",id);
    return query(bidQuery);
  };

  // Customer
  // --------

  var Customer = Parse.Object.extend("Customer");

  this.initCustomer = function () {
    return new Customer();
  };

  this.queryCustomers = function (id) {
    var customerQuery = new Parse.Query(Customer);
    if (id) {
      customerQuery.equalTo('objectId',id);
    }
    customerQuery.limit(1000);
    customerQuery.ascending("firstName");
    return query(customerQuery);
  };

  // WorkOrder
  // ---------

  var WorkOrder = Parse.Object.extend("WorkOrder");

  this.initWorkOrder = function () {
    return new WorkOrder();
  };

  this.queryWorkOrder = function () {
    var workOrderQuery = new Parse.Query(WorkOrder);
    workOrderQuery.limit(1000);
    return query(workOrderQuery);
  };

  // Catalog
  // -------

  var Catalog = Parse.Object.extend("Catalog");

  this.initCatalog = function () {
   return new Catalog();
  };

  this.queryCatalog = function (domain) {
    var catalogQuery = new Parse.Query(Catalog);
    if (domain) {
      catalogQuery.equalTo('domain', domain);
    }
    catalogQuery.limit(1000);
    return query(catalogQuery);
  };

  this.queryCatalogByCategory = function (category) {
    var catalogQuery = new Parse.Query(Catalog);
    catalogQuery.equalTo('category',category);
    return query(catalogQuery);
  };



  // EventType
  // -----------

  var EventType = Parse.Object.extend("EventType");

  this.queryEventTypes = function (id) {
    var eventTypesQuery = new Parse.Query(EventType);
    if (id) {
      eventTypesQuery.equalTo("tId",id);
    }
    eventTypesQuery.ascending("tId");
    return query(eventTypesQuery);
  };

  // BidTextType
  // -----------

  var BidTextType = Parse.Object.extend("BidTextType");

  this.queryBidTextTypes = function (id) {
    var bidTextTypesQuery = new Parse.Query(BidTextType);
    if (id) {
      bidTextTypesQuery.equalTo("tId",id);
    }
    bidTextTypesQuery.ascending("tId");
    return query(bidTextTypesQuery);
  };

  // Category
  // -----------

  var Category = Parse.Object.extend("Category");

  this.queryCategories = function (domain) {
    var categoriesQuery = new Parse.Query(Category);
    if (domain) {
      categoriesQuery.equalTo('domain', domain);
    }
    categoriesQuery.ascending("tId");
    return query(categoriesQuery);
  };

  // MeasurementUnit
  // ---------------

  var MeasurementUnit = Parse.Object.extend("MeasurementUnit");

  this.queryMeasurementUnits = function () {
    var measurementUnitsQuery = new Parse.Query(MeasurementUnit);
    measurementUnitsQuery.ascending("tId");
    return query(measurementUnitsQuery);
  };

  // DiscountCause
  // -------------

  var DiscountCause = Parse.Object.extend("DiscountCause");

  this.queryDiscountCauses = function (id) {
    var discountCausesQuery = new Parse.Query(DiscountCause);
    if (id) {
      discountCausesQuery.equalTo("tId",id);
    }
    discountCausesQuery.ascending("tId");
    return query(discountCausesQuery);
  };


  // config
  // ------

  var Config = Parse.Object.extend("Config");

  this.queryConfig = function () {
    var configQuery = new Parse.Query(Config);
    return query(configQuery);
  };


  //
  //  CONVERSION
  //  ----------
  //
  // AccessCatalog and related tables
  // -------------

  var AccessCatalog = Parse.Object.extend("AccessCatalog");

  this.queryAccessCatalog = function () {
    var accessCatalogQuery = new Parse.Query(AccessCatalog);
    accessCatalogQuery.limit(1000);
    accessCatalogQuery.descending('Domain'); // so that when converting subitems (components) the target items will already be there
    return query(accessCatalogQuery);
  };

  var AccessComponents = Parse.Object.extend("AccessComponents");

  this.queryAccessComponents = function (catId) {
    var accessComponentsQuery = new Parse.Query(AccessComponents);
    accessComponentsQuery.equalTo('CompItemId',catId);
    return query(accessComponentsQuery);
  };

  var AccessCatalogSubitems = Parse.Object.extend("AccessCatalogSubitems");

  this.queryAccessCatalogSubitems = function (catId) {
    var accessCatalogSubitemsQuery = new Parse.Query(AccessCatalogSubitems);
    accessCatalogSubitemsQuery.equalTo('ContainerId',catId);
    return query(accessCatalogSubitemsQuery);
  };

  //
  // Access Customers
  //
  var AccessCustomers = Parse.Object.extend("AccessCustomers");

  this.queryAccessCustomers = function () {
    var accessCustomersQuery = new Parse.Query(AccessCustomers);
    accessCustomersQuery.limit(1000);
    accessCustomersQuery.ascending('CustomerId');
    return query(accessCustomersQuery);
  };

  //
  // Access Orders
  //
  var AccessOrders = Parse.Object.extend("AccessOrders");

  this.queryAccessOrders = function () {
    var accessOrdersQuery = new Parse.Query(AccessOrders);
    accessOrdersQuery.limit(1000);
    accessOrdersQuery.ascending('OrderId');
    return query(accessOrdersQuery);
  };

  //
  // Access OrderItems
  //
  var AccessOrderItems = Parse.Object.extend("AccessOrderItems");

  this.queryAccessOrderItems = function (orderId) {
    var accessOrderItemsQuery = new Parse.Query(AccessOrderItems);
    accessOrderItemsQuery.equalTo('OrderId',orderId);
    accessOrderItemsQuery.limit(1000);
    accessOrderItemsQuery.ascending('ItemId');
    return query(accessOrderItemsQuery);
  };

  //
  // Access OrderActivities
  //
  var AccessOrderActivities = Parse.Object.extend("AccessOrderActivities");

  this.queryAccessOrderActivities = function (orderId) {
    var accessOrderActivitiesQuery = new Parse.Query(AccessOrderActivities);
    accessOrderActivitiesQuery.equalTo('ActivityOrder',orderId);
    accessOrderActivitiesQuery.limit(1000);
    accessOrderActivitiesQuery.descending('Id'); // ActivityTime is string, no good for sort
    return query(accessOrderActivitiesQuery);
  };

});
