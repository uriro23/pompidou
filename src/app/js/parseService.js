// 'use strict';  // removed to allow assignment to obj.attributes in save

angular.module('myApp')

  .service('api', function ($q, $rootScope, secrets, dater) {

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


    for (var propName in obj.properties) {
      if (obj.properties.hasOwnProperty(propName)) {
        obj.set(propName, obj.properties[propName])
      }
    }

    if (obj.delAttributes) {  // unset attributes
      for (var delAttr in obj.delAttributes) {
        if (obj.delAttributes.hasOwnProperty(delAttr)) {
          obj.unset(delAttr)
        }
      }
      obj.delAttributes = undefined;
    }

    obj.save().then(function(o) {
        promise.resolve(o);
        $rootScope.$digest();
      },
      function (error) {
        alert('Save Error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest();
    });
    return promise.promise;
  };

  // saves an array of objects in parallel
  this.saveObjects = function (objs) {
    var promises = [];
    for (var i = 0; i < objs.length; i++) {
      for (var propName in objs[i].properties) {
        if (objs[i].properties.hasOwnProperty(propName)) {
          objs[i].set(propName, objs[i].properties[propName])
        }
      }
      if (objs[i].delAttributes) {  // unset attributes
        for (var delAttr in objs[i].delAttributes) {
          if (objs[i].delAttributes.hasOwnProperty(delAttr)) {
            objs[i].unset(delAttr)
          }
        }
        objs[i].delAttributes = undefined;
      }

      promises.push(angular.copy(objs[i]).save()); // clone to avoid parse error 121
    }
    return Promise.all(promises);
  };


  this.deleteObj = function (obj) {
    var promise = $q.defer();
    obj.destroy().then( function(o) {
        promise.resolve(o);
        $rootScope.$digest();
      },
      function (error) {
        alert('delete Error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest();
    });
    return promise.promise;
  };

  // deletes an array of objects in parallel
  this.deleteObjects = function (objs) {
    var promises = [];
    for (var i = 0; i < objs.length; i++) {
      promises.push(objs[i].destroy());
    }
    return Promise.all(promises);
  };

    function query(qry) {
      var pageSize = 1000;
      var skip = 0;
      var results = [];
      qry.limit(pageSize);
      var promise = $q.defer();

      // this function is called recursively to fetch a page of objects (up to 1000 - a limit set by Parse)
      // function queryPage (sk) {
      //   qry.skip(sk);
      //   qry.find({
      //     success: function (objs) {
      //       results = results.concat(objs);
      //       if (objs.length === pageSize) { // maybe more results needed
      //         skip += pageSize;
      //         queryPage(skip);
      //       } else {
      //         promise.resolve(results);
      //         $rootScope.$digest();
      //       }
      //     },
      //     error: function (err) {
      //       promise.reject (err);
      //       $rootScope.$digest();
      //     }
      //   });
      // }
      //
      function queryPage (sk) {
        qry.skip(sk);
        qry.find().then (function(objs) {
          objs.forEach(function(obj) {
            obj.properties = angular.copy(obj.attributes);
          });
            results = results.concat(objs);
            if (objs.length === pageSize) { // maybe more results needed
              skip += pageSize;
              queryPage(skip);
            } else {
              promise.resolve(results);
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
    var t = new Order();
    t.properties = angular.copy(t.attributes);
    return t;
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
    orderQuery.greaterThanOrEqualTo('eventDate', dater.today());
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
    var t = new Bid();
    t.properties = angular.copy(t.attributes);
    return t;
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
    var t = new Mail();
    t.properties = angular.copy(t.attributes);
    return t;
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
    var t = new Customer();
    t.properties = angular.copy(t.attributes);
    return t;
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
    var t = new WorkOrder();
    t.properties = angular.copy(t.attributes);
    return t;
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
    var t = new Catalog();
    t.properties = angular.copy(t.attributes);
    return t;
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
    categoriesQuery.ascending("order");
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

    // CancelReason
    // ------------

    var CancelReason = Parse.Object.extend("CancelReason");

    this.queryCancelReasons = function (id) {
      var cancelReasonsQuery = new Parse.Query(CancelReason);
      if (id) {
        cancelReasonsQuery.equalTo("tId", id);
      }
      cancelReasonsQuery.ascending("order");
      return query(cancelReasonsQuery);
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

     // TaskType
    // -------------

    var TaskType = Parse.Object.extend("TaskType");

    this.initTaskType = function () {
      var t = new TaskType();
      t.properties = angular.copy(t.attributes);
      return t;
    };

    this.queryTaskTypes = function (id) {
      var q = new Parse.Query(TaskType);
      if (id) {
        q.equalTo("tId", id);
      }
      q.ascending("order");
      return query(q);
    };


    // TaskDetail
    // -------------

    var TaskDetail = Parse.Object.extend("TaskDetail");

    this.initTaskDetail = function () {
      var t = new TaskDetail();
      t.properties = angular.copy(t.attributes);
      return t;
    };

    this.queryTaskDetails = function (id) {
      var q = new Parse.Query(TaskDetail);
      if (id) {
        q.equalTo("tId", id);
      }
      q.ascending("task");
      q.ascending("order");
      return query(q);
    };


    // Phase
    // -------------

    var Phase = Parse.Object.extend("Phase");

    this.initPhase = function () {
      var t = new Phase();
      t.properties = angular.copy(t.attributes);
      return t;
    };


    this.queryPhases = function (id) {
      var q = new Parse.Query(Phase);
      if (id) {
        q.equalTo("tId", id);
      }
      q.ascending("order");
      return query(q);
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
    var t = new Parse.User();
    t.properties = angular.copy(t.attributes);
    return t;
  };

  this.userSignUp = function (obj) {
    var promise = $q.defer();
    for (var propName in obj.properties) {
      if (obj.properties.hasOwnProperty(propName)) {
        obj.set(propName, obj.properties[propName])
      }
    }
    obj.signUp().then(function (o) {
        promise.resolve(o);
        $rootScope.$digest();
      }, function (error) {
        alert('SignUp Error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest();
    });
    return promise.promise;
  };

    // this.userLogin = function (username, pwd) {
    //   var promise = $q.defer();
    //   Parse.User.logIn(username, pwd, {
    //     success: function (user) {
    //       promise.resolve(user);
    //       $rootScope.$digest()
    //     },
    //     error: function (model, error) {
    //       alert('Login error ' + error.code + ", " + error.message);
    //       promise.reject(error);
    //       $rootScope.$digest()
    //     }
    //   });
    //   return promise.promise;
    // };

    this.userLogin = function (username, pwd) {
      var promise = $q.defer();
      Parse.User.logIn(username, pwd)
        .then(function(user) {
          promise.resolve(user);
          $rootScope.$digest();
      }, function(error) {
          alert('Login error ' + error.code + ", " + error.message);
          promise.reject(error);
          $rootScope.$digest()
        });
      return promise.promise;
    };

  this.userLogout = function () {
    Parse.User.logOut();
  };

  this.userPasswordReset = function (email) {
    var promise = $q.defer();
    Parse.User.requestPasswordReset(email)
      .then(function () {
        promise.resolve();
        $rootScope.$digest()
      }, function (error) {
        alert('Password reset error ' + error.code + ", " + error.message);
        promise.reject(error);
        $rootScope.$digest()
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
      role.save().then(function (r) {
          promise.resolve(r);
          $rootScope.$digest();
        }, function (error) {
          alert('Role Save Error ' + error.code + ", " + error.message);
          promise.reject();
          $rootScope.$digest();
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
