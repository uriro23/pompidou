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
        $rootScope.digest();
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
    var order = new Order();
    return order;
  }

   this.queryOrders = function () {
    var orderQuery = new Parse.Query(Order);
     return query(orderQuery);
  };


  //  OrderNum
  //  --------

  var OrderNum = Parse.Object.extend("OrderNum");

  this.queryOrderNum = function () {
      var orderNumQuery = new Parse.Query(OrderNum);
      return query(orderNumQuery);
  }

  // Customer
  // --------

  var Customer = Parse.Object.extend("Customer");

  this.initCustomer = function () {
    var customer = new Customer();
    return customer;
  }

  this.queryCustomers = function () {
    var customerQuery = new Parse.Query(Customer);
    customerQuery.ascending("firstName");
    return query(customerQuery);
  };


  // Catalog
  // -------

  var Catalog = Parse.Object.extend("Catalog");

  this.initCatalog = function () {
    var catalog = new Catalog();
    return catalog;
  }

  this.queryCatalog = function (domain) {
    var catalogQuery = new Parse.Query(Catalog);
    catalogQuery.equalTo('domain',domain);
    return query(catalogQuery);
  };



  // EventType
  // -----------

  var EventType = Parse.Object.extend("EventType");

  this.queryEventTypes = function () {
    var eventTypesQuery = new Parse.Query(EventType);
    eventTypesQuery.ascending("tId");
    return query(eventTypesQuery);
  };

  // BidTextType
  // -----------

  var BidTextType = Parse.Object.extend("BidTextType");

  this.queryBidTextTypes = function () {
    var bidTextTypesQuery = new Parse.Query(BidTextType);
    bidTextTypesQuery.ascending("tId");
    return query(bidTextTypesQuery);
  };

  // Category
  // -----------

  var Category = Parse.Object.extend("Category");

  this.queryCategories = function (domain) {
    var categoriesQuery = new Parse.Query(Category);
    categoriesQuery.equalTo('domain',domain);
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


});
