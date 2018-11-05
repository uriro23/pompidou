'use strict';

angular.module('myApp')

  .service('api', function ($q, $rootScope, secrets, today) {

  this.getEnvironment = function () {
    return this.environment
  };

  this.setEnvironment = function (env) {
    console.log('initializing '+env);
    Parse.initialize(secrets[env].parseKey, secrets[env].parseSecret);
    if (env === 'test') {
      Parse.serverURL = 'https://pompidou-test.herokuapp.com';
    } else {
      Parse.serverURL = 'https://pompidou-prod.herokuapp.com';
    }
      $rootScope.environment = this.environment = env;
  };

// Generic functions
// -----------------

  this.saveObj = function (obj) {
    var promise = $q.defer();
    if (obj.delAttributes) {  // unset attributes
      for (var delAttr in obj.delAttributes) {
        if (obj.delAttributes.hasOwnProperty(delAttr)) {
          obj.unset(delAttr)
        }
      }
    }
    for (var attr in obj.attributes) {
      if (obj.attributes.hasOwnProperty(attr)) {
        obj.set(attr, obj.attributes[attr])
      }
    }
    var newObj = angular.copy(obj);  // to avoid parse error 121
    newObj.save({}, {
      success: function (o) {
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

  // saves an array of objects in parallel
  this.saveObjects = function (objs) {
    var promises = [];
    for (var i = 0; i < objs.length; i++) {
      if (objs[i].delAttributes) {  // unset attributes
        for (var delAttr in objs[i].delAttributes) {
          if (objs[i].delAttributes.hasOwnProperty(delAttr)) {
            objs[i].unset(delAttr)
          }
        }
      }
      for (var attr in objs[i].attributes) {
        if (objs[i].attributes.hasOwnProperty(attr)) {
          objs[i].set(attr, objs[i].attributes[attr]);
        }
      }

      promises.push(angular.copy(objs[i]).save()); // clone to avoid parse error 121
    }
    return Parse.Promise.when(promises);
  };


  this.deleteObj = function (obj) {
    var promise = $q.defer();
    obj.destroy({
      success: function (o) {
        //console.log('object '+ o.id+' deleted');
        promise.resolve(o);
        $rootScope.$digest();
      },
      error: function (model, error) {
        console.log(error);
        alert('delete Error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest();
      }
    });
    return promise.promise;
  };

  // deletes an array of objects in parallel
  this.deleteObjects = function (objs) {
    var promises = [];
    for (var i = 0; i < objs.length; i++) {
      promises.push(objs[i].destroy());
    }
    return Parse.Promise.when(promises);
  };

    function query(qry) {
      var pageSize = 1000;
      var skip = 0;
      var results = [];
      qry.limit(pageSize);
      var promise = $q.defer();

      // this function is called recursively to fetch a page of objects (up to 1000 - a limit set by Parse)
      function queryPage (sk) {
        qry.skip(sk);
        qry.find({
          success: function (objs) {
            results = results.concat(objs);
            if (objs.length === pageSize) { // maybe more results needed
              skip += pageSize;
              queryPage(skip);
            } else {
             promise.resolve(results);
             $rootScope.$digest();
            }
          },
          error: function (err) {
            promise.reject (err);
            $rootScope.$digest();
          }
        });
      }

      queryPage(skip);
      return promise.promise;

    }

  // Order
  // -----

  var Order = Parse.Object.extend("Order");

  this.initOrder = function () {
    return new Order();
  };

    this.queryOrder = function (id) {
      var orderQuery = new Parse.Query(Order);
      orderQuery.equalTo('objectId', id);
      return query(orderQuery);
    };

     this.queryAllOrders = function (fields) {
      var orderQuery = new Parse.Query(Order);
      if (fields) {
        orderQuery.select(fields);
      }
      return query(orderQuery);
     };


    this.queryOrdersByCustomer = function (cust,fields) {
    var orderQuery = new Parse.Query(Order);
    if (cust) {
      orderQuery.equalTo('customer', cust);
    }
      if (fields) {
        orderQuery.select(fields);
      }
      return query(orderQuery);
  };

  this.queryTemplateOrders = function (fields) {
    var orderQuery = new Parse.Query(Order);
    orderQuery.exists('template');
    if (fields) {
      orderQuery.select(fields);
    }
    return query(orderQuery);
  };

  this.queryFutureOrders = function (fields) {
    var orderQuery = new Parse.Query(Order);
    orderQuery.greaterThanOrEqualTo('eventDate', today);
     if (fields) {
      orderQuery.select(fields);
    }
    return query(orderQuery);
  };

   this.queryOrdersByRange = function (field, from, to, fields) {
      var orderQuery = new Parse.Query(Order);
      orderQuery.lessThanOrEqualTo(field, to);
      orderQuery.greaterThanOrEqualTo(field, from);
      if (fields) {
        orderQuery.select(fields);
      }
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
    bidQuery.equalTo("orderId", orderId);
    bidQuery.descending("date");
    return query(bidQuery);
  };

    this.queryBidByUuid = function (uuid) {
      var bidQuery = new Parse.Query(Bid);
      bidQuery.equalTo("uuid", uuid);
      return query(bidQuery);
    };

    this.queryAllBids = function (fields) {
      var bidQuery = new Parse.Query(Bid);
      if (fields) {
        bidQuery.select(fields);
      }
      return query(bidQuery);
    };

    // Mail
  // -----

  var Mail = Parse.Object.extend("Mail");

  this.initMail = function () {
    return new Mail();
  };

  this.queryMails = function (id) {
    var mailQuery = new Parse.Query(Mail);
    if (id) {
      mailQuery.equalTo("objectId", id);
    }
    return query(mailQuery);
  };

  this.queryMailsByOrder = function (orderId) {
    var mailQuery = new Parse.Query(Mail);
    mailQuery.equalTo("orderId", orderId);
    mailQuery.descending("date");
    return query(mailQuery);
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
      customerQuery.equalTo('objectId', id);
    }
    customerQuery.ascending("firstName");
    return query(customerQuery);
  };

  // WorkOrder
  // ---------

  var WorkOrder = Parse.Object.extend("WorkOrder");

  this.initWorkOrder = function () {
    return new WorkOrder();
  };

  this.queryWorkOrder = function (woId,domain) {
    var workOrderQuery = new Parse.Query(WorkOrder);
    workOrderQuery.equalTo('woId',woId);
    if (domain) {
      workOrderQuery.equalTo('domain', domain);
    }
    return query(workOrderQuery);
  };


  // WorkOrderIndex
  // ----------------

  var WorkOrderIndex = Parse.Object.extend("WorkOrderIndex");

  this.queryWorkOrderIndex = function () {
    var q = new Parse.Query(WorkOrderIndex);
    q.ascending('woId');
    return query(q);
  };


  // Catalog
  // -------

  var Catalog = Parse.Object.extend("Catalog");

  this.initCatalog = function () {
    return new Catalog();
  };

    this.queryCatalog = function (domain,fields) {
      var catalogQuery = new Parse.Query(Catalog);
      if (domain) {
        catalogQuery.equalTo('domain', domain);
      }
      if (fields) {
        catalogQuery.select(fields);
      }
      return query(catalogQuery);
    };

    this.queryCatalogById = function (id) {
      var catalogQuery = new Parse.Query(Catalog);
      if (id) {
        catalogQuery.equalTo('objectId', id);
      }
      return query(catalogQuery);
    };

    this.queryCatalogByCategory = function (category) {
    var catalogQuery = new Parse.Query(Catalog);
    catalogQuery.equalTo('category', category);
    return query(catalogQuery);
  };

  this.queryCatalogByIds = function (ids) { // returns catalog items with id matching member of param array
    var catalogQuery = new Parse.Query(Catalog);
    catalogQuery.containedIn('objectId', ids);
    return query(catalogQuery);
  };


   // BidTextType
  // -----------

  var BidTextType = Parse.Object.extend("BidTextType");

  this.queryBidTextTypes = function (id) {
    var bidTextTypesQuery = new Parse.Query(BidTextType);
    if (id) {
      bidTextTypesQuery.equalTo("tId", id);
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
        discountCausesQuery.equalTo("tId", id);
      }
      discountCausesQuery.ascending("tId");
      return query(discountCausesQuery);
    };


    // ReferralSource
    // -------------

    var ReferralSource = Parse.Object.extend("ReferralSource");

    this.queryReferralSources = function (id) {
      var referralSourcesQuery = new Parse.Query(ReferralSource);
      if (id) {
        referralSourcesQuery.equalTo("tId", id);
      }
      referralSourcesQuery.ascending("order");
      return query(referralSourcesQuery);
    };

    // Sensitivity
    // -------------

    var Sensitivity = Parse.Object.extend("Sensitivity");

    this.querySensitivities = function (id) {
      var sensitivitiesQuery = new Parse.Query(Sensitivity);
      if (id) {
        sensitivitiesQuery.equalTo("tId", id);
      }
      sensitivitiesQuery.ascending("order");
      return query(sensitivitiesQuery);
    };

    // MenuType
    // --------

    var MenuType = Parse.Object.extend("MenuType");

    this.queryMenuTypes = function (id) {
      var menuTypesQuery = new Parse.Query(MenuType);
      if (id) {
        menuTypesQuery.equalTo("tId", id);
      }
      menuTypesQuery.ascending("order");
      return query(menuTypesQuery);
    };


    // color
    // ---------------

    var Color = Parse.Object.extend("Color");

    this.queryColors = function () {
      var colorsQuery = new Parse.Query(Color);
      colorsQuery.ascending("tId");
      return query(colorsQuery);
    };

    // employee
    // ---------------

    var Employee = Parse.Object.extend("Employee");

    this.queryEmployees = function () {
      var employeesQuery = new Parse.Query(Employee);
      employeesQuery.ascending("tId");
      return query(employeesQuery);
    };

    // pRole
    // ---------------

    var PRole = Parse.Object.extend("PRole");

    this.queryPRoles = function () {
      var pRolesQuery = new Parse.Query(PRole);
      pRolesQuery.ascending("tId");
      return query(pRolesQuery);
    };

    // config
  // ------

  var Config = Parse.Object.extend("Config");

  this.queryConfig = function () {
    var configQuery = new Parse.Query(Config);
    return query(configQuery);
  };

  // user
  // ----

  this.initUser = function () {
    return new Parse.User();
  };

  this.userSignUp = function (obj) {
    var promise = $q.defer();
    for (var attr in obj.attributes) {
      if (obj.attributes.hasOwnProperty(attr)) {
        obj.set(attr, obj.attributes[attr])
      }
    }
    obj.signUp({}, {
      success: function (o) {
        promise.resolve(o);
        $rootScope.$digest();
      },
      error: function (model, error) {
        alert('SignUp Error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest();
      }
    });
    return promise.promise;
  };

  this.userLogin = function (username, pwd) {
    var promise = $q.defer();
    Parse.User.logIn(username, pwd, {
      success: function (user) {
        promise.resolve(user);
        $rootScope.$digest()
      },
      error: function (model, error) {
        alert('Login error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest()
      }
    });
    return promise.promise;
  };

  this.userLogout = function () {
    Parse.User.logOut();
  };

  this.userPasswordReset = function (email) {
    var promise = $q.defer();
    Parse.User.requestPasswordReset(email, {
      success: function () {
        promise.resolve();
        $rootScope.$digest()
      },
      error: function (error) {
        alert('Password reset error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest()
      }
    });
    return promise.promise;
  };

  this.getCurrentUser = function () {
    return Parse.User.current();
  };

  this.queryUsers = function (username) {
    var userQuery = new Parse.Query(Parse.User);
    if (username) {
      userQuery.equalTo('username', username);
    }
    return query(userQuery);
  };

 // role
  // ----

    /*  only first time
     this.createRole = function (name, admin, users) {
    var promise = $q.defer();
    var roleACL = new Parse.ACL();
    for (var i = 0; i < users.length; i++) {
      roleACL.setReadAccess(users[i], true);
    }
    roleACL.setWriteAccess(admin, true);
    var role = new Parse.Role(name, roleACL);
    role.getUsers().add(users);
    role.save({}, {
      success: function (r) {
        console.log('role:');
        console.log(r);
        promise.resolve(r);
        $rootScope.$digest();
      },
      error: function (model, error) {
        alert('Role Save Error ' + error.code + ", " + error.message);
        promise.reject();
        $rootScope.$digest();
      }
    })
  };
  */

    this.queryRoles = function(name) {
      var roleQuery = new Parse.Query(Parse.Role);
      if (name) {
        roleQuery.equalTo('name',name);
      }
      return query(roleQuery);
    };

    this.queryUsersInRole = function(role) {
      var rel = role.getUsers();
     return query(rel.query());
     };

    this.addUserToRole = function(role,user) {
      var promise = $q.defer();
      var acl = role.get('ACL').setReadAccess(user,true);
      role.getUsers().add(user);
      role.save({}, {
        success: function (r) {
          promise.resolve(r);
          $rootScope.$digest();
        },
        error: function (model, error) {
          alert('Role Save Error ' + error.code + ", " + error.message);
          promise.reject();
          $rootScope.$digest();
        }
      });
      return promise.promise;
    };



    // main block

    if (window.location.href.indexOf('localhost') === -1) { // not localhost meaning prod
      this.setEnvironment('prod');
    } else {
      this.setEnvironment('test');
    }


  });
