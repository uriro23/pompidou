'use strict';

/* Controllers */
angular.module('myApp')
  .controller('AdminCtrl', function (api, $state, $rootScope, orderService,
                                     lov, config, bidTextTypes, menuTypes,
                                     measurementUnits, categories, allCategories, sensitivities,
                                     discountCauses, role, employees, pRoles,
                                     phases, taskTypes, taskDetails) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.get('username');
    } else {
      $state.go('login');
    }
    $rootScope.title = 'ניהול';

  this.isEnvTabActive =true;

  this.domains = angular.copy(lov.domains);
  this.domains.splice(0,1);

  this.categories = categories;
  this.sensitivities = sensitivities;
  this.measurementUnits = measurementUnits;
  this.stickerTypes = lov.stickerTypes;


    // vat
    // ---

    this.vatRate = config.properties.vatRate * 100;
    this.vatError = false;

    this.setVat = function () {
      this.vatError = this.vatRate !== Number(this.vatRate) || this.vatRate < 0 || this.vatRate > 50;
    };

    this.updateVat = function () {
      if (this.vatError) {
        alert('מע"מ שגוי. יש לתקן לפני העדכון');
        return;
      }
      config.properties.vatRate = this.vatRate / 100;
      api.saveObj(config);
    };

    // order identification
    // determines how orders will be identified in stickers, exitlist, workorder: by color, numbers or both

    this.isOrderColors = config.properties.isOrderColors;
    this.isOrderNumbers = config.properties.isOrderNumbers;

    this.setOrderIdent = function () {
      config.properties.isOrderColors = this.isOrderColors;
      config.properties.isOrderNumbers = this.isOrderNumbers;
      api.saveObj(config);
    };

    // pwd
    // ---

    this.setPwd = function () {
      if (!this.pwd1) {
        alert('נא להקיש סיסמה');
        this.pwd2 = null;
        return;
      }
      if (this.pwd1.length < 6) {
        alert('סיסמה קצרה מדי - צריכה להיות בת 6 תווים לפחות');
        this.pwd1 = this.pwd2 = null;
        return;
      }
      if (this.pwd1 !== this.pwd2) {
        alert('הסיסמאות אינן זהות');
        this.pwd1 = this.pwd2 = null;
        return;
      }
      user.set('password',this.pwd1);
      var that = this;
      api.saveObj(user)
        .then(function () {
          that.pwd1 = that.pwd2 = null;
          alert('הסיסמה הוחלפה בהצלחה');
        });
    };


    // users
    // -----

    this.refreshUsers = function() {
      var that = this;
      this.isUserRefresh = true;
      api.queryUsers()
        .then(function(users) {
          api.queryUsersInRole(role)
            .then(function(usersInRole) {
              users.forEach(function(user) {
                user.isInRole = usersInRole.filter(function(ru) {
                  return ru.get('username') === user.get('username');
                }).length>0;
              });
            });
          that.users = users;
          that.isUserRefresh = false;
        });
    };

    this.isNewUser = false;
    this.refreshUsers();

    this.newUser = function () {
      this.isNewUser = true;
      this.user = api.initUser();
    };

    this.createUser = function () {
      this.isNewUser = false;
      api.userSignUp(this.user)
        .then(function(user) {  // signUp changes the current user, so we have to force a new login
          alert('User '+user.get('username')+' created.\nPlease login and add user to role.');
          $state.go('login');
         });
    };

    this.cancelNewUser = function () {
      this.isNewUser = false;
    };

    this.addUserToRole = function(user) {
      var that = this;
      api.addUserToRole(role,user)
        .then(function(){
          that.refreshUsers();
        })
    };

    /*  only first time
    this.createRole = function () {
      if (api.getCurrentUser().properties.username !== 'uri') {
        alert('current user not allowed to create role');
      } else {
        api.queryUsers()
          .then(function (users) {
            api.createRole('everyone', api.getCurrentUser(), users);
          });
      }
    };
    */

    this.resetPwd = function (usr) {
      api.userPasswordReset(usr.properties.email)
        .then(function () {
          alert('נשלח מייל להחלפת סיסמה');
        });
    };

    // stickers tab

    this.setStickerData = function() {
      var that = this;
      api.queryStickerParams()
          .then(function (p) {
            that.stickerParams = p[0];
            var d = new Date();
            d.setSeconds(0,0);
            var dd = angular.copy(d);
            dd.setHours(0,0,0,0);
            that.stickerParams.properties.stickerType = that.stickerType.id;
            that.stickerParams.properties.productName = undefined;
            api.unset(that.stickerParams,'productName');
            that.stickerParams.properties.productionDate = angular.copy(d);
            that.stickerParams.properties.freezeDate = angular.copy(d);
            that.stickerParams.properties.customerName = undefined;
            api.unset(that.stickerParams,'customerName');
            that.stickerParams.properties.eventDate = dd;
            that.isStickerEmpty = true;
            that.isStickeParamsSaved = false;
          });
    };

    this.stickerDataChanged = function () {
      this.isStickeParamsSaved = false;
    };

    this.saveStickerParams = function () {
      var that = this;
      api.saveObj(this.stickerParams)
          .then(function() {
            that.isStickeParamsSaved = true;
          })
    };

    // env tab

    this.switchEnv = function () {
      if (api.getEnvironment()==='test') {
        alert('הנך עובר לטפל בנתוני סביבת הייצור');
        api.setEnvironment('prod');
      } else {
        api.setEnvironment('test');
      }
      $state.go('login');
    };

    this.loadDB = function () {
      if (api.getEnvironment()==='test') {
        alert ('switch to prod first');
        return;
      }
      $rootScope.dbData = {
        signiture : 'asdfg'
      };
      api.queryCatalog()
        .then(function(catalog) {
          $rootScope.dbData.catalog = catalog.map(function (cat) {
            cat.properties.prodId = cat.id;
            return cat.properties;
          });
          console.log($rootScope.dbData.catalog.length+' catalog entries loaded');
          api.queryTemplateOrders()
            .then(function (templates) {
              console.log(templates.length+' templates loaded');
              var templates2 = templates.map(function (temp) {
                temp.properties.prodId = temp.id;
                return temp.properties;
              });
              var from = new Date(2023,0,1,0,0,0,0);
              var to = new Date(2023,11,31,23,59,59,999);
              api.queryOrdersByRange('createdAt',from,to)
                .then(function (orders) {
                  console.log(orders.length+' orders created in 2023 loaded');
                  var orders2 = orders.filter(function(ord) {
                    return !ord.template;
                  }).map(function (ord2) {
                    ord2.properties.prodId = ord2.id;
                    return ord2.properties;
                  });
                  $rootScope.dbData.orders = templates2.concat(orders2);
                  // find customers and contacts in orders
                  var orderCustomers = [];
                  $rootScope.dbData.orders.forEach(function (ord) {
                    if (ord.customer) {
                      if (orderCustomers.filter(function (cust) {
                        return cust === ord.customer;
                      }).length === 0) {
                        orderCustomers.push(ord.customer);
                      }
                    }
                    if (ord.contact) {
                      if (orderCustomers.filter(function (cust) {
                        return cust === ord.contact;
                      }).length === 0) {
                        orderCustomers.push(ord.contact);
                      }
                    }
                  });
                  api.queryCustomersByIds(orderCustomers)
                    .then(function(customers) {
                      console.log(customers.length+' cusomers loaded');
                      $rootScope.dbData.customers = customers.map(function(cust) {
                        cust.properties.prodId = cust.id;
                        return cust.properties;
                      });
                      api.queryConfig()
                        .then(function(conf) {
                          console.log('config loaded');
                          $rootScope.dbData.config = conf.map(function(conf2) {
                            return conf2.properties;
                          });
                        });
                    });
                });
            });
        });
    };


    this.deleteCatalog = function() {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to delete catalog? if not close this page');
      if ($rootScope.dbData.signiture !== 'asdfg') {
        alert('prod data not loaded');
        return;
      }
      api.queryCatalog(undefined,[])
        .then(function(catalog) {
          api.deleteObjects(catalog)
            .then(function() {
              alert('catalog deleted from test');
            });
        });
    };

    this.deleteOrders = function() {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to delete all orders? if not close this page');
      if ($rootScope.dbData.signiture !== 'asdfg') {
        alert('prod data not loaded');
        return;
      }
      api.queryAllOrders([])
        .then(function(orders) {
          api.deleteObjects(orders)
            .then(function() {
              alert('all orders deleted from test');
            });
        });
    };

    this.deleteCustomers = function() {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to delete customers? if not close this page');
      if ($rootScope.dbData.signiture !== 'asdfg') {
        alert('prod data not loaded');
        return;
      }
      api.queryCustomers(undefined,[])
        .then(function(customers) {
          api.deleteObjects(customers)
            .then(function() {
              alert('all customers deleted from test');
            });
        });
    };

    function saveSlices (items) {
       if (items.length <= 100) {
        console.log('saving '+items.length+' items');
        return api.saveObjects(items)
      } else {
        console.log('saving 100 items');
        return api.saveObjects(items.slice(0,100))
          .then(function() {
            items.splice(0,100);
            saveSlices(items);
          });
      }
    }

    this.loadOrders = function() {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to load orders? if not close this page');
      if ($rootScope.dbData.signiture !== 'asdfg') {
        alert('prod data not loaded');
        return;
      }
      var items = [];
      $rootScope.dbData.orders.forEach(function(inp) {
        var item = api.initOrder();
        item.properties = inp;
        items.push(item);
      });
      console.log('saving '+items.length+' items');
      api.saveObjects(items)
        .then(function() {
          alert('orders loaded from prod');
        });
    };


    this.loadCustomers3 = function() {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to load customers? if not close this page');
      if ($rootScope.dbData.signiture !== 'asdfg') {
        alert('prod data not loaded');
        return;
      }
      var items = [];
      $rootScope.dbData.customers.forEach(function(inp) {
        var item = api.initCustomer();
        item.properties = inp;
        items.push(item);
      });
      console.log('saving '+items.length+' items');
      api.saveObjects(items)
        .then(function() {
          alert('customers loaded from prod');
        });
    };

    this.loadCatalog = function() {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to load catalog? if not close this page');
      if ($rootScope.dbData.signiture !== 'asdfg') {
        alert('prod data not loaded');
        return;
      }
      var items = [];
      $rootScope.dbData.catalog.forEach(function(inp) {
        var item = api.initCatalog();
        item.properties = inp;
        items.push(item);
      });
      console.log('saving '+items.length+' items');
      saveSlices(items);
    };

    this.loadConfig = function() {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to load config? if not close this page');
      if ($rootScope.dbData.signiture !== 'asdfg') {
        alert('prod data not loaded');
        return;
      }
      var items = [];
      $rootScope.dbData.config.forEach(function(inp) {
        var item = api.initConfig();
        item.properties = inp;
        items.push(item);
      });
      console.log('saving '+items.length+' items');
      api.saveObjects(items)
        .then(function() {
          alert('config loaded from prod');
        });
    };

    function newId(oldId,items,attrName,record) {
      if (oldId) {
        var match = items.filter(function (item) {
          return item.properties.prodId === oldId;
        })[0];
        if (!match) {
          console.log('couldnt fix id of' + attrName + ' ' + oldId);
          console.log(record);
          return "badbadbad";
        } else {
          return match.id;
        }
      } else {
        return undefined;
      }

    };

    this.fixOrders = function () {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to fix ids in orders? if not close this page');
      api.queryAllOrders(['customer','contact','quotes','prodId'])
        .then(function (orders) {
          api.queryCatalog(1, ['domain', 'productName', 'prodId'])
            .then(function (catalog) {
              api.queryCustomers(undefined,['prodId'])
                .then(function (customers2) {
                  var customers = customers2.filter(function (cust) {
                    return cust.properties.prodId;
                  });
                  orders.forEach(function (ord) {
                    ord.properties.customer = newId(ord.properties.customer, customers, 'customer', ord);
                    ord.properties.contact = newId(ord.properties.contact, customers, 'contact', ord);
                    ord.properties.quotes.forEach(function (quote) {
                      quote.items.forEach(function (item) {
                        item.catalogId = newId(item.catalogId,catalog,'catalogId',ord);
                      });
                    });
                  });
                  api.saveObjects(orders)
                    .then(function () {
                      alert(orders.length+' orders fixed');
                    });
                });
            });
        });
    };

    this.fixCatalog = function () {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to fix ids in catalog? if not close this page');
      api.queryCatalog(undefined, ['domain', 'productName','components','prodId'])
        .then(function (catalog) {
          catalog.forEach(function (catItem) {
            if (catItem.properties.components) {
              catItem.properties.components.forEach(function (comp) {
                comp.id = newId(comp.id,catalog,'components',catItem);
              })
            }
          });
          saveSlices(catalog);
        });
    };

    this.fixConfig = function () {
      if (api.getEnvironment()==='prod') {
        alert ('switch to test first');
        return;
      }
      alert('want to fix ids in config? if not close this page');
      api.queryCatalog(undefined,['domain', 'productName', 'prodId'])
        .then(function (catalog) {
          config.properties.unhandledItemComponent =
            newId(config.properties.unhandledItemComponent,catalog,'unhandledItemComponent',config.properties);
          config.properties.unhandledItemMaterial =
            newId(config.properties.unhandledItemMaterial,catalog,'unhandledItemMaterial',config.properties);
          config.properties.satietyIndexItem =
            newId(config.properties.satietyIndexItem,catalog,'satietyIndexItem',config.properties);
          config.properties.boxItem =
            newId(config.properties.boxItem,catalog,'boxItem',config.properties);
          config.properties.outOfFridgeItem =
            newId(config.properties.outOfFridgeItem,catalog,'outOfFridgeItem',config.properties);
          config.properties.snacksTraysItem =
            newId(config.properties.snacksTraysItem,catalog,'snacksTraysItem',config.properties);
          config.properties.dessertsTraysItem =
            newId(config.properties.dessertsTraysItem,catalog,'dessertsTraysItem',config.properties);
          config.properties.sandwichesTraysItem =
            newId(config.properties.sandwichesTraysItem,catalog,'sandwichesTraysItem',config.properties);
          config.properties.rentalTransportationItem =
            newId(config.properties.rentalTransportationItem,catalog,'rentalTransportationItem',config.properties);
          config.properties.unhandledPrepComponent =
            newId(config.properties.unhandledPrepComponent,catalog,'unhandledPrepComponent',config.properties);
          api.saveObj(config);
          console.log('config fixed');
        });
     };

    // copy taskTypes and taskDetails from test to prod
    // you have to start the app from test (localhost:) and change environment to prod
    this.copyTasks = function() {
      if (api.getEnvironment()==='test') {
        alert ('switch to prod first');
        return;
      }
      alert('want to copy task definitions from test to prod? if not close this page')
      // first delete existing phases, taskTypes and taskDetails
      api.queryPhases()
        .then(function(phases) {
          api.deleteObjects(phases)
            .then(function() {
              api.queryTaskTypes()
                .then(function(types) {
                  api.deleteObjects(types)
                    .then(function() {
                      api.queryTaskDetails()
                        .then(function(details) {
                          api.deleteObjects(details)
                            .then(function() {
                              alert('old prod task definitions deleted, press OK to continue');
                              // now we create new taskTypes and taskDetails
                              var tt = [];
                              var p;
                              var pc = 0;
                              var tc = 0;
                              var dc = 0;
                              phases.forEach(function(h) {
                                p = api.initPhase();
                                p.properties = h;
                                tt.push(p);
                                pc++;
                              })
                              taskTypes.forEach(function(t) {
                                p = api.initTaskType();
                                p.properties = t;
                                tt.push(p);
                                tc++;
                              })
                              taskDetails.forEach(function(d) {
                                p = api.initTaskDetail();
                                p.properties = d;
                                tt.push(p);
                                dc++;
                              })
                              alert ('ready to write '+pc+' phases, '+tc+' tasks and '+dc+' details?');
                              api.saveObjects(tt)
                                .then(function() {
                                  alert('done');
                                })
                            });
                        });
                    });
                });
            });
        });

    };

// workOrder tab
    this.loadWoIndexes = function() {
      var that = this;
      api.queryWorkOrderIndex()
        .then(function(woIndexes) {
          that.woIndexes = woIndexes;
        });
    };

    this.deleteWorkOrder = function() {
      var that = this;
      if (this.woIndex) {
        api.queryWorkOrder(this.woIndex.properties.woId)
          .then(function(workOrder) {
            alert('ימחקו '+workOrder.length+' רשומות של פקודת העבודה '+that.woIndex.properties.label);
            api.deleteObjects(workOrder)
              .then(function() {
                alert('בוצע');
              });
          });
      }
    };

    this.catalogReport = function() {
      var that = this;
      api.queryCatalog(1)
        .then(function(catItems) {
          var noCompItems = catItems.filter(function(cat) {  // return only items with no components
            var comps = cat.properties.components.filter(function(comp) {
              return comp.id !== config.properties.unhandledItemComponent &&
                comp.id !== config.properties.unhandledItemMaterial  &&
                comp.id !== config.properties.satietyIndexItem;
            });
            var category = categories.filter(function (categ) {
              return categ.tId === cat.properties.category;
            })[0];
            return comps.length===0 && category.type < 3; // skip technical and non food items
          }).map(function(cat) {
            cat.view = {};
            cat.view.count = 0;
            cat.view.category = categories.filter(function(c) {
              return c.tId===cat.properties.category;
            })[0];
            return cat;
          });
          var from = new Date(new Date().getFullYear()-1,new Date().getMonth(),new Date().getDate());
          var to = new Date(2099,11,31);
          api.queryOrdersByRange('eventDate',from,to)
            .then(function(ords) {
              ords.forEach(function(ord) {
                if (ord.properties.quotes.length) {
                  var ordItems = ord.properties.quotes[ord.properties.activeQuote].items;
                  ordItems.forEach(function (itm) {
                    noCompItems.forEach(function (noComp) {
                      if (noComp.id === itm.catalogId) {
                        noComp.view.count++;
                      }
                    });
                  });
                }
              });
              that.catalog = noCompItems.filter(function(cat) {
                return cat.view.count;
              }).sort(function(a,b) {
                if (a.view.category.order<b.view.category.order) {
                  return -1
                } else {
                  if (a.view.category.order>b.view.category.order) {
                    return 1
                  } else {
                    if (a.view.count<b.view.count) {
                      return 1
                    } else {
                      return -1
                    }
                  }
                }});
            });
        });
    };

    this.catalogReport2 = function() {
      var that = this;
      api.queryCatalog(1)
        .then(function(catItems) {
          var noCompItems = catItems.filter(function(cat) {  // return only items with no components
            var comps = cat.properties.components.filter(function(comp) {
              return comp.domain === 3;
            });
            var category = categories.filter(function (categ) {
              return categ.tId === cat.properties.category;
            })[0];
            return comps.length && category.type < 3; // skip technical and non food items
          }).map(function(cat) {
            cat.view = {};
            cat.view.count = 0;
            cat.view.category = categories.filter(function(c) {
              return c.tId===cat.properties.category;
            })[0];
            return cat;
          });
          var from = new Date(new Date().getFullYear()-1,new Date().getMonth(),new Date().getDate());
          var to = new Date(2099,11,31);
          api.queryOrdersByRange('eventDate',from,to)
            .then(function(ords) {
              ords.forEach(function(ord) {
                if (ord.properties.quotes.length) {
                  var ordItems = ord.properties.quotes[ord.properties.activeQuote].items;
                  ordItems.forEach(function (itm) {
                    noCompItems.forEach(function (noComp) {
                      if (noComp.id === itm.catalogId) {
                        noComp.view.count++;
                      }
                    });
                  });
                }
              });
              that.catalog = noCompItems.filter(function(cat) {
                return cat.view.count;
              }).sort(function(a,b) {
                if (a.view.category.order<b.view.category.order) {
                  return -1
                } else {
                  if (a.view.category.order>b.view.category.order) {
                    return 1
                  } else {
                    if (a.view.count<b.view.count) {
                      return 1
                    } else {
                      return -1
                    }
                  }
                }});
            });
        });
    };

    this.selectCatItem = function(id) {
      $state.go('editCatalogItem', {'id':id});
    };

    this.productTreeInit = function() {
      this.isCatalogLoading = true;
      var that = this;
      api.queryCatalog()
        .then(function(cat) {
          that.catalog = cat;
          api.queryCategories()
            .then(function(allCategories) {
              that.allCategories = allCategories.map(function(cat) {
                return cat.properties;
              });
            });
          that.isCatalogLoading = false;
        });
    };

    this.productTree = function() {
      var that = this;
      api.queryCatalogByCategory(this.productTreeCategory.tId)
        .then(function(res) {
          that.dishes = res.filter(function(cat) {  // return only items with components
            var comps = cat.properties.components.filter(function(comp) {
              return comp.id !== config.properties.unhandledItemComponent &&
                comp.id !== config.properties.unhandledItemMaterial  &&
                comp.id !== config.properties.satietyIndexItem;
            });
            return comps.length && !cat.properties.isDeleted;
          }).sort(function(a,b) {
            if (a.properties.productName > b.properties.productName) {
              return 1;
            } else {
              return -1;
            }
          });
          that.dishes.forEach(function(dish) {
            dish.preparations = [];
            dish.materials = [];
            dish.measurementUnit = measurementUnits.filter(function(mu) {
              return mu.tId === dish.properties.measurementUnit;
            })[0];
            dish.properties.components.filter(function(comp) {
              return comp.id !== config.properties.unhandledItemComponent &&
                comp.id !== config.properties.unhandledItemMaterial  &&
                comp.id !== config.properties.satietyIndexItem;
            }).forEach(function(component) {
              var compCatalog = angular.copy(that.catalog.filter(function(cat) {
                return cat.id === component.id;
              })[0]);
              compCatalog.category = that.allCategories.filter(function(cat) {
                return cat.tId === compCatalog.properties.category;
              })[0];
              compCatalog.quantity = component.quantity;
              compCatalog.measurementUnit = measurementUnits.filter(function(mu) {
                return mu.tId === compCatalog.properties.measurementUnit;
              })[0];
              if (component.domain === 2) {
                compCatalog.materials = [];
                compCatalog.properties.components.forEach(function(prepMaterial) {
                  var materialCatalog = angular.copy(that.catalog.filter(function(cat) {
                    return cat.id === prepMaterial.id;
                  })[0]);
                  materialCatalog.category = that.allCategories.filter(function(cat) {
                    return cat.tId === materialCatalog.properties.category;
                  })[0];
                  materialCatalog.quantity = prepMaterial.quantity;
                  materialCatalog.measurementUnit = measurementUnits.filter(function(mu) {
                    return mu.tId === materialCatalog.properties.measurementUnit;
                  })[0];
                  compCatalog.materials.push(materialCatalog);
                });
                compCatalog.materials.sort(function(a,b) {
                  if (a.category.order > b.category.order) {
                    return 1;
                  } else if (a.category.order < b.category.order) {
                    return -1;
                  } else if (a.properties.productName > b.properties.productName) {
                    return 1;
                  } else {
                    return -1;
                  }
                })
                dish.preparations.push(compCatalog);
              } else {
                dish.materials.push(compCatalog);
              }
            })
            dish.preparations.sort(function(a,b) {
              if (a.category.order > b.category.order) {
                return 1;
              } else if (a.category.order < b.category.order) {
                return -1;
              } else if (a.properties.productName > b.properties.productName) {
                return 1;
              } else {
                return -1;
              }
            })
            dish.materials.sort(function(a,b) {
              if (a.category.order > b.category.order) {
                return 1;
              } else if (a.category.order < b.category.order) {
                return -1;
              } else if (a.properties.productName > b.properties.productName) {
                return 1;
              } else {
                return -1;
              }
            })
          });
        });
    };



    this.loadDishesCatalog = function() {
      var that = this;
      this.isProcessing = true;
      api.queryCategories(1)
        .then(function(categories) {
          that.categories = categories.map(function(cat) {
            return cat.properties;
          });
          api.queryCatalog(1)
            .then(function(catalog) {
              console.log(catalog.length+' menu items loaded');
              catalog = catalog.filter(function(c) {
                return !c.properties.isDeleted;
              });
              console.log(catalog.length+' undeleted items');
              catalog.forEach(function(cat) {
                cat.category = cat.properties.category; // for ng-repeat filter
                cat.measurementUnitObj = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.measurementUnit;
                })[0];
                if (!cat.measurementUnitObj) {
                  console.log('MU not found for '+cat.properties.measurementUnit);
                } else {
                  cat.measurementUnitLabel = cat.measurementUnitObj.label;
                }
                cat.categoryObject = that.categories.filter(function(cat2) {
                  return cat2.tId === cat.properties.category;
                })[0];
                cat.exitListLength = cat.properties.exitList.length;
                cat.measurementUnit = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.measurementUnit;
                })[0];
                cat.prodMeasurementUnit = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.prodMeasurementUnit;
                })[0];
                cat.packageMeasurementUnit = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.packageMeasurementUnit;
                })[0];
              });
              that.productNameItems = catalog;
              that.productNameCategoryItems = [];
              that.isProcessing = false;
            });
        });
    };
    this.filterProductNameDomain = function() {
      var that = this;
      this.isProcessing = true;
      api.queryCategories(this.productNamesDomain.id)
        .then(function(categories) {
          that.categories = categories.map(function(cat) {
            return cat.properties;
          });
          api.queryCatalog(that.productNamesDomain.id)
            .then(function(catalog) {
              console.log(catalog.length+' menu items loaded');
              catalog = catalog.filter(function(c) {
                return !c.properties.isDeleted;
              });
              console.log(catalog.length+' undeleted items');
              catalog.forEach(function(cat) {
                cat.category = cat.properties.category; // for ng-repeat filter
                cat.measurementUnitObj = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.measurementUnit;
                })[0];
                if (!cat.measurementUnitObj) {
                  console.log('MU not found for '+cat.properties.measurementUnit);
                } else {
                  cat.measurementUnitLabel = cat.measurementUnitObj.label;
                }
                cat.categoryObject = that.categories.filter(function(cat2) {
                  return cat2.tId === cat.properties.category;
                })[0];
                cat.exitListLength = cat.properties.exitList.length;
                cat.measurementUnit = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.measurementUnit;
                })[0];
                cat.prodMeasurementUnit = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.prodMeasurementUnit;
                })[0];
                cat.packageMeasurementUnit = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.packageMeasurementUnit;
                })[0];
             });
              that.productNameItems = catalog;
              that.productNameCategoryItems = [];
              that.isProcessing = false;
            });
        });
    };

    this.filterProductNameCategory = function() {
      var that = this;
      this.productNameCategoryItems = this.productNameItems.filter(function(cat) {
        return cat.properties.category === that.productNamesCategory.tId;
      }).sort(function(a,b) {
        if (a.properties.productName > b.properties.productName) {
          return 1;
        } else {
          return -1;
        }
      });
      this.productNameCategoryItems.forEach(function(item) {
        item.sensArray = angular.copy(sensitivities);
        item.properties.sensitivities.forEach(function(trueSens) {
          item.sensArray.forEach(function(potSens) {
            if (potSens.tId === trueSens.tId) {
              potSens.isTrue = true;
            }
          });
        });
       })
    };

    this.setDisableLink = function() {
      var that = this;
      this.isDisableLink = false;
      this.productNameItems.forEach(function(d) {
        if (d.isChanged) {
          that.isDisableLink = true;
        }
      });
    };

    this.productNameItemChanged = function(cat) {
      cat.errors = !cat.properties.productName || cat.properties.productName.length===0;
      if (!cat.errors && !cat.properties.isDeleted) {
        var tmp = this.productNameItems.filter(function(cat2) {
          return (cat2.properties.productName === cat.properties.productName) &&
            (cat2.id !== cat.id) && !cat2.properties.isDeleted;
        });
        cat.errors = (tmp.length>0);
      }
      cat.isChanged = !cat.errors;
      this.setDisableLink();
    };

    this.saveProductNameitem = function(cat) {
      cat.category = cat.properties.category = cat.categoryObject.tId;
      cat.properties.sensitivities = cat.sensArray.filter(function(sen) {
        return sen.isTrue;
      });
      cat.properties.measurementUnit = cat.measurementUnit.tId;
      if (cat.prodMeasurementUnit) {
        cat.properties.prodMeasurementUnit = cat.prodMeasurementUnit.tId;
      }
      if (cat.packageMeasurementUnit) {
        cat.properties.packageMeasurementUnit = cat.packageMeasurementUnit.tId;
      }
      api.saveObj(cat);
      cat.isChanged = false;
      this.setDisableLink();
    };

    // no boxes
    this.loadNoBoxes = function() {
      var that = this;
      api.queryCatalog(1)
        .then(function(catalog) {
          var snacksAndDesserts = catalog.filter(function(cat) {
            return cat.properties.category === 1 || cat.properties.category === 8;
          });
          that.noBoxes = snacksAndDesserts.filter(function(cat2) {
            var tmp = cat2.properties.components.filter(function(comp) {
              return comp.id === config.properties.boxItem;
            });
            if (tmp.length === 0) return true;
          }).sort(function(a,b) {
            if (a.properties.category > b.properties.category) {
              return 1;
            } else if (a.properties.category < b.properties.category) {
              return -1;
            } else if (a.properties.productName > b.properties.productName) {
              return 1;
            } else {
              return -1;
            }
          });
        });
    };

    // xfer shoppings in category אריזה from under dishes to under prep who has אריזה actions
    this.loadXferShopping = function (item) {
      var that = this;
      this.xferShoppingList = [];
      this.xferCatalog = [
        {
          domain: 1,
          items: []
        },
        {
          domain: 2,
          items: []
        },
        {
          domain: 3,
          items: []
        },
        {
          domain: 4,
          items: []
        }
      ];
      api.queryCatalog()
        .then(function(catalog) {
          catalog.forEach(function(cat) {
            var catDomain = that.xferCatalog.filter(function(xf) {
              return xf.domain === cat.properties.domain;
            })[0];
            catDomain.items.push(cat);
          });
          var catDishes = that.xferCatalog.filter(function(xf) {
            return xf.domain === 1;
          })[0];
          var catPreps = that.xferCatalog.filter(function(xf) {
            return xf.domain === 2;
          })[0];
          var catShoppings = that.xferCatalog.filter(function(xf) {
            return xf.domain === 3;
          })[0];
          var catActions = that.xferCatalog.filter(function(xf) {
            return xf.domain === 4;
          })[0];
          var ind = 0;
          catDishes.items.forEach(function(mi) {
            if (!mi.properties.isDeleted) {
            mi.properties.components.forEach(function(mic) {
              if (mic.domain === 3 &&
                  mic.id !== config.properties.unhandledItemMaterial &&
                  mic.id !== config.properties.boxItem &&
                  mic.id !== config.properties.satietyIndexItem) {
                // exclude unhandled item, boxItem & satiety index
                var shop = catShoppings.items.filter(function(cat) {
                  return cat.id === mic.id;
                })[0];
                if (!shop.properties.isDeleted) {
                  // for now ignore the packaging stuff
                  if (/*shop.properties.category === 21*/ false) { // אריזות
                  // now find preps that have actions in category 58 - אריזה
                  var preps = [];
                  mi.properties.components.forEach(function (mic2) {
                    if (mic2.domain === 2) {
                      var isFirstTime = true;
                      var prep = catPreps.items.filter(function (pr) {
                        return pr.id === mic2.id;
                      })[0];
                      if (!prep.properties.isDeleted) {
                         prep.properties.components.forEach(function (pc) {
                          if (pc.domain === 4) {
                            var action = catActions.items.filter(function (ac) {
                              return ac.id === pc.id;
                            })[0];
                            if (!action.properties.isDeleted &&
                                action.properties.category === 58 &&
                                isFirstTime) {
                              preps.push(prep);
                              isFirstTime = false; // if multiple packaging actions for prep, use only one
                            }
                          }
                        })
                      }
                    }
                  });
                  var status, err;
                  if (preps.length === 0) {
                    status = 'אין הכנה מתאימה';
                    err = 1;
                  } else if (preps.length > 1) {
                    status = 'בחר הכנה';
                    err = 2;
                  } else {
                    var suggestedPrep = preps[0];
                    status = '';
                    err = 0;
                  }
                  that.xferShoppingList.push({
                    ind: ++ind,
                    dish: mi,
                    dishCategory: categories.filter(function(cat) {
                      return cat.tId === mi.properties.category;
                    })[0],
                    component: mic,
                    shoppingName: shop.properties.productName,
                    suggestedPrep: suggestedPrep,
                    preps: preps,
                    status: status,
                    err: err,
                    isDone: false
                  });
                } else { // not packaging
                    var temp = mi.properties.components.filter(function(mc) {
                      return mc.domain === 2;
                    });
                    if (temp.length === 1) { // if single prep under dish - use it
                      suggestedPrep = catPreps.items.filter(function(pr) {
                        return pr.id === temp[0].id;
                      })[0];
                      status = "";
                      err = 0;
                    } else if (temp.length > 1) {
                      preps = [];
                      mi.properties.components.forEach(function(mc) {
                        if (mc.domain === 2) {
                          var temp2 = catPreps.items.filter(function(pr) {
                            return pr.id === mc.id;
                          })[0];
                          preps.push(temp2);
                        }
                      });
                      status = "בחר הכנה";
                      err = 3;
                    } else { // no preps
                      preps = undefined;
                      status = "אין הכנה";
                      err = 4;
                    }
                      that.xferShoppingList.push({
                      ind: ++ind,
                      dish: mi,
                      dishCategory: categories.filter(function(cat) {
                        return cat.tId === mi.properties.category;
                      })[0],
                      component: mic,
                      shoppingName: shop.properties.productName,
                      suggestedPrep: suggestedPrep,
                      preps: preps,
                      status: status,
                      err: err,
                      isDone: false
                    });
                  }
               }
                }
              });
            }
            });
          that.xferShoppingList.sort(function(a,b) {
            if (a.dishCategory.order > b.dishCategory.order) {
              return 1;
            } else if (a.dishCategory.order < b.dishCategory.order) {
              return -1;
            } else if (a.dish.properties.productName > b.dish.properties.productName) {
              return 1;
            } else if (a.dish.properties.productName < b.dish.properties.productName) {
              return -1;
            } else return a.shoppingName - b.shoppingName;
              });
          });
    };

    this.doXfer = function (item) {
      var that = this;
      var ind;
      var temp = item.dish.properties.components.filter(function(cp,i){
        if (cp.id === item.component.id) {
          ind = i;
          return true;
        } else {
          return false;
        }
      });
      if (ind) {
        item.dish.properties.components.splice(ind,1); // delete component from dish
        item.suggestedPrep.properties.components.push(item.component); // insert it in prep
        api.saveObj(item.dish) // save dish & prep
          .then(function() {
            api.saveObj(item.suggestedPrep)
              .then(function() {
                item.isDone = true;
              });
          });
      } else {
        alert('המצרך לא נמצא במנה');
      }
    };

    this.loadShoppingsForSuppliers = function () {
      var that = this;
      api.queryCatalog(3,['productName','category','supplier'])
          .then(function(shoppings) {
            that.shoppingsForSuppliers = shoppings;
            api.queryCategories(3)
                .then(function(shoppingCategories) {
                  that.shoppingCategories = shoppingCategories.map (function(cat) {
                    return cat.properties;
                  });
                });
          });
    };

    this.filterShoppingCategory = function () {
      var that = this;
      this.shoppingItemsForSuppliers = this.shoppingsForSuppliers.filter(function(item) {
        return item.properties.category === that.shoppingCategory.tId && !item.properties.isDeleted;
      });
      this.shoppingItemsForSuppliers.forEach(function (item) {
        if (!item.properties.supplier && that.shoppingCategory.defaultSupplier) {
          item.properties.supplier = that.shoppingCategory.defaultSupplier;
          item.isChanged = true;
          that.isAnySupplierchanged = true;
        }
      });
    };

    this.setSupplier = function (item) {
      item.isChanged = true;
      this.isAnySupplierchanged = true;
    };

    this.saveShoppingItems = function (item) {
      var that = this;
      var itemsToUpdate = this.shoppingItemsForSuppliers.filter(function (item) {
        return item.isChanged === true;
      });
      api.saveObjects(itemsToUpdate)
          .then(function() {
          });
      that.shoppingItemsForSuppliers.forEach(function (item) {
        item.isChanged = false;
      });
      that.isAnySupplierchanged = false;
    };

    this.loadSnacksAndPetifoursBoxes = function () {
      var that = this;
      api.queryCatalog()
          .then(function(catalogItems) {
            console.log(catalogItems.length+' catalog items read');
            api.queryOrdersByRange('eventDate', new Date(2023,6,1), new Date(2026,11,31))
              .then(function(orders) {
                console.log(orders.length+' orders read');
                var itemIds = [];
                orders.forEach(function(order) {
                  if (order.properties.quotes[order.properties.activeQuote]) {
                  var items = order.properties.quotes[order.properties.activeQuote].items;
                  items.forEach(function (item) {
                    if (item.category.tId === 1 || item.category.tId === 8) {
                      var temp = itemIds.filter(function (id) {
                        return id === item.catalogId;
                      });
                      if (temp.length === 0) {
                        itemIds.push(item.catalogId);
                      }
                    }
                  });
                }
                });
                console.log(itemIds.length+' different snacks and petifours in orders');
                that.catalogDishes = catalogItems.filter(function(cat) {
                  var temp = itemIds.filter(function(id) {
                    return id === cat.id;
                  });
                  return temp.length>0 && !cat.properties.isDeleted;
                });
                console.log(that.catalogDishes.length+' valid dishes from catalog');
                that.catalogDishes.sort(function(a,b) {
                  if (a.properties.category > b.properties.category) {
                    return 1;
                  } else if (a.properties.category < b.properties.category) {
                    return -1;
                  } else if (a.properties.productName > b.properties.productName) {
                    return 1;
                  } else if (a.properties.productName < b.properties.productName) {
                    return -1;
                  } else {
                    return 0;
                  }
                })
                that.catalogDishes.forEach(function(dish) {
                  dish.view = {};
                  dish.view.category = categories.filter(function(category) {
                    return category.tId === dish.properties.category;
                  })[0];
                  dish.view.dishMeasurementUnit = measurementUnits.filter(function(mu) {
                    return mu.tId === dish.properties.prodMeasurementUnit;
                  })[0];
                  var temp = dish.properties.components.filter(function(comp) {
                    return comp.id === config.properties.boxItem;
                  });
                  dish.view.dishBoxQuantity = temp.length ? temp[0].quantity : undefined;
                });
              });
    });
  };


    // customers tab
    this.loadCustomers = function() {
      var that = this;
      var fields = ['customer','eventDate','orderStatus'];
      api.queryCustomers()
        .then(function(customers) {
          api.queryOrdersByRange('eventDate', new Date(2015,5,1),new Date(2099,12,31),fields)
            .then(function(orders) {
              customers.forEach(function(customer) {
                customer.view = {
                  noOfSuccesses: 0,
                  noOfFailures: 0,
                  lastEventDate : new Date(2000,1,1)
                };
                orders.forEach(function(order) {
                  if (order.properties.customer === customer.id) {
                    if (order.properties.eventDate > customer.view.lastEventDate) {
                      customer.view.lastEventDate = order.properties.eventDate;
                    }
                    if (order.properties.orderStatus === 0 ||
                        order.properties.orderStatus === 1 ||
                        order.properties.orderStatus === 6) {
                      customer.view.noOfFailures++;
                    } else {
                      customer.view.noOfSuccesses++;
                    }
                  }
                })
              });
              that.customers = customers.filter(function(cust) {
                return cust.view.noOfSuccesses + cust.view.noOfFailures;
              });
            });
        });
    };

// modified customers tab: only customers who were a success in the past and don't have a future order
    this.loadCustomers2 = function() {
      var that = this;
      var fields = ['customer','eventDate','orderStatus','template'];
      api.queryCustomers()
        .then(function(customers) {
          api.queryOrdersByRange('eventDate', new Date(2015,5,1),new Date(2099,12,31),fields)
            .then(function(orders) {
              customers.forEach(function(customer) {
                customer.view = {
                  successes: 0
                };
                orders.forEach(function(order) {
                    if (order.properties.customer === customer.id &&
                        order.properties.orderStatus > 1 &&
                        order.properties.orderStatus < 6 && !order.properties.template) {
                      customer.view.successes++;
                    }
                });
              });
              that.customers = customers.filter(function(cust) {
                return (cust.view.successes  > 1);
              });
            });
        });
    };

    this.loadAllCustomers = function () {
      var that = this;
      api.queryCustomers()
          .then(function (customers) {
            that.customers = customers;
          });
    };


    // conversions

    /*
    // quote conversion  1/2016

    this.createNewQuoteData = function () {
      api.queryAllOrders()
        .then (function(orders) {
        console.log('read '+orders.length+' orders');
        for (var i=0;i<orders.length;i++) {
          var order = orders[i].properties;
          var quote = {};
          quote.name = 'תפריט';
          quote.items = order.items;
          quote.bonusValue = order.bonusValue;
          quote.bonusValue = order.bonusValue;
          quote.credits = order.credits;
          quote.discount = order.discount;
          quote.discountCause = order.discountCause;
          quote.discountRate = order.discountRate;
          quote.fixedPrice = order.fixedPrice;
          quote.isFixedPrice = order.isFixedPrice;
          quote.isTransportationBonus = order.isTransportationBonus;
          quote.rounding = order.rounding;
          quote.satietyIndex = order.satietyIndex;
          quote.subTotal = order.subTotal;
          quote.total = order.total;
          quote.totalBeforeVat = order.totalBeforeVat;
          quote.totalBeforeVatForInvoice = order.totalBeforeVatForInvoice;
          quote.oldTransportation = order.transportation;
          quote.transportationBonus = order.transportationBonus;
          quote.transportationInclVat = order.transportationInclVat;
          quote.vat = order.vat;
          quote.vatForInvoice = order.vatForInvoice;
          order.quotes = [];
          order.quotes.push(quote);
          order.activeQuote = 0;
        }
        console.log('updating orders');
        api.saveObjects(orders)
          .then(function() {
            console.log('orders updated');
          });
      });
    };

    this.dropOldQuoteData = function() {
      alert('not yet implemented');
    };

	// create order headers to optimize order lists
	//  5/2016
    this.createOrderHeaders = function () {
      api.queryAllOrders()
        .then (function(orders) {
        console.log('read '+orders.length+' orders');
        for (var i=0;i<orders.length;i++) {
          orderService.setupOrderHeader(orders[i].properties);
		}
       console.log('updating orders');
        api.saveObjects(orders)
          .then(function() {
            console.log('orders updated');
          });
      });
    };

    // multiple quotes conversion
    // 8/2016
    this.prepareMultipleQuotes = function () {
      // part 1: convert orders
      api.queryAllOrders('number,quotes')
        .then(function(orders) {
          console.log('read '+orders.length+' orders');
          orders.forEach(function(order) {
            order.properties.version = lov.version; // set version to current
            if (order.properties.quotes.length > 1) {  // already new version, maybe corrupt but don't handle it
              console.log('multiple quotes on order '+order.properties.number);
            } else {
              var quote = order.properties.quotes[0];
              quote.isActive = true;
              if (!quote.menuType) {
                quote.menuType = menuTypes.filter(function(mt) {
                  return mt.isDefault;
                })[0];
                quote.title = quote.menuType.label;
              }
              quote.endBoxType = quote.menuType;
              quote.errors = {};
              quote.changes = {};
              // convert lov values in quote from ids to objects
              if (typeof quote.discountCause === 'number') {
                quote.discountCause = discountCauses.filter(function (obj) {
                  return (obj.tId === quote.discountCause);
                })[0];
              }
              if (typeof quote.menuType === 'number') {
                console.log('order '+order.properties.number+' old mt '+quote.menuType);
                quote.menuType = menuTypes.filter(function (obj) {
                  return (obj.tId === quote.menuType);
                })[0];
              }
              if (typeof quote.endBoxType === 'number') {
                quote.endBoxType = menuTypes.filter(function (obj) {
                  return (obj.tId === quote.endBoxType);
                })[0];
              }
              if (typeof quote.endTextType === 'number') {
                quote.endTextType = bidTextTypes.filter(function (obj) {
                  return (obj.tId === quote.endTextType);
                })[0];
              }
            }
          });
          console.log('updating orders');
          api.saveObjects(orders)
            .then(function() {
              console.log('orders updated');

              // part 2: version bids

              api.queryAllBids('order,menuType,version')
                .then(function(bids) {
                  console.log('read '+bids.length+' bids');
                  bids.forEach(function(bid) {
                    if (bid.properties.menuType) {
                      bid.properties.version = 4;
                    } else if (bid.properties.order.quotes) {
                      bid.properties.version = 3;
                    } else {
                      bid.properties.version = 2;
                    }
                  });
                  console.log('updating bids');
                  api.saveObjects(bids)
                    .then(function() {
                      console.log('bids updated');
                    });
                });
            });
        })
    };


    // generate product name from product description
    this.generateProductNames = function () {
      api.queryCatalog()
        .then(function(catalog) {
          catalog.forEach(function(cat) { // generate names
            if (cat.properties.domain === 1) {
              var match = cat.properties.productDescription.match(/^\s*\S+\s+\S+\s+\S+\s*\S+/); // extract first 4 words of desc
              cat.properties.productName = match ? match[0] : cat.properties.productDescription;
            } else {
              cat.properties.productName = cat.properties.productDescription;
            }
          });
          catalog.sort(function(a,b) {  // sort to look for duplicates
            if (a.properties.domain < b.properties.domain) {
              return -1;
            } else if (a.properties.domain > b.properties.domain) {
              return 1;
            } else if(a.properties.productName < b.properties.productName) {
              return -1;
            } else if (a.properties.productName > b.properties.productName) {
              return 1;
            } else {
              return 0;
            }
          });
          var cnt = 0;
          for (var i=0;i<catalog.length;i++) {  // eliminate duplicates
            for (var j=i+1;j<catalog.length;j++) {
              if (catalog[i].properties.domain === catalog[j].properties.domain &&
                catalog[i].properties.productName === catalog[j].properties.productName) {
                catalog[j].properties.productName += String(j-i);
                cnt++;
              }
            }
          }
          console.log(cnt+' duplicates found');
          api.saveObjects(catalog)
            .then(function() {
              console.log('catalog updated');
            });
        });
    };

    function handleUpToYear (year,catalog) {
      console.log('doing '+year);
      var from = new Date(year,0,1,0,0,0,0);
      var to = new Date(year,11,31,23,59,59,999);
      return api.queryOrdersByRange('createdAt',from,to)
        .then(function(orders) {
          if (orders.length > 0) {
            console.log('read '+orders.length+' orders');
            var found = 0;
            var notFound = 0;
            orders.forEach(function(order) {
              order.properties.quotes.forEach(function(quote) {
                quote.items.forEach(function(item) {
                  var tmp = catalog.filter(function(cat) {
                    return cat.id === item.catalogId;
                  });
                  if (tmp.length > 0) {
                    item.productName = tmp[0].properties.productName;
                    found++;
                  } else {
                    notFound++;
                  }
                  // use this opportunity to refresh and condense category in item
                  var c = categories.filter(function(cat) {
                    return cat.tId === item.category.tId;
                  })[0];
                  item.category = {
                    tId: c.tId,
                    label: c.label,
                    isTransportation: c.isTransportation,
                    order: c.order
                  };
                });
              });
            });
            console.log('saving orders. '+found+' items found in catalog, '+notFound+' not found');
            api.saveObjects(orders)
              .then(function() {
                console.log('saved');
                handleUpToYear(year-1,catalog); // handle previous years
              });
          } else {
            console.log('no orders for '+year);
          }
        });
    }

    this.productNamesInItems = function() {
      api.queryCatalog(1)
        .then(function(catalog) {
          handleUpToYear(2017,catalog);
        });
    };

    this.addQuoteTitles = function() {
      var that = this;
      api.queryAllOrders()
        .then(function(orders) {
          console.log(orders.length+' orders read');
          orders.forEach(function(order) {
            order.properties.header.title = order.properties.quotes[order.properties.activeQuote].title;
          });
          console.log('writing '+orders.length+' orders');
          api.saveObjects(orders)
            .then(function() {
              console.log('done');
            });
        });
    };

    this.addMenuTypeToHeader = function() {
      var that = this;
      api.queryAllOrders()
        .then(function(orders) {
          console.log(orders.length+' orders read');
          orders.forEach(function(order) {
            order.properties.header.menuType = order.properties.quotes[order.properties.activeQuote].menuType;
          });
          console.log('writing '+orders.length+' orders');
          api.saveObjects(orders)
            .then(function() {
              console.log('done');
            });
        });
    };

    this.delPriceIncrease = function() {
      var that = this;
      api.queryAllOrders()
        .then(function(orders) {
          console.log(orders.length+' orders read');
          orders.forEach(function(order) {
            delete  order.properties.header.priceIncreaseRate;
            order.properties.quotes.forEach(function(quote) {
              delete quote.priceIncrease;
              delete quote.priceIncreaseRate;
              delete quote.priceIncreaseCause;
            });
          });
          console.log('writing '+orders.length+' orders');
          api.saveObjects(orders)
            .then(function() {
              console.log('done');
            });
        });
    };

    this.handleForcedPrices = function() {
      var that = this;
      var forcedCnt = 0;
      var itemCnt = 0;
      var forcedOrders = [];
      console.log('starting');
      api.queryAllOrders()
        .then(function(orders) {
          console.log(orders.length+' orders read');
          orders.forEach(function(order) {
            var isForced = false;
            order.properties.quotes.forEach(function (quote) {
              quote.items.forEach(function (item) {
                itemCnt++;
                if (Math.round(item.priceInclVat)
                  !== Math.round(item.catalogPrice / item.catalogQuantity * item.quantity)) {
                  forcedCnt++;
                  isForced = true;
                  item.isForcedPrice = true;
                }
              });
            });
            if (isForced) {
              forcedOrders.push(order);
            }
          });
          console.log('found '+forcedCnt+' forced items out of total items '+itemCnt+' in '+forcedOrders.length+' orders');
          console.log('writing '+forcedOrders.length+' forced price orders');
          api.saveObjects(forcedOrders)
            .then(function() {
              console.log('done');
            });
        });
    };

    this.handleHeavyweight = function() {
      var that = this;
      var hItemCnt = 0;
      var hOrderCnt = 0;
      var itemCnt = 0;
      var hOrders = [];
      console.log('starting');
      api.queryAllOrders()
        .then(function(orders) {
          console.log(orders.length+' orders read');
          orders.forEach(function(order) {
            order.properties.quotes.forEach(function (quote) {
              quote.isHeavyweight = false;
              quote.items.forEach(function (item) {
                itemCnt++;
                item.category.isHeavyweight = categories.filter(function(cat) {
                  return cat.tId === item.category.tId;
                })[0].isHeavyweight;
                if (item.category.isHeavyweight) {
                  quote.isHeavyweight = true;
                  hItemCnt++;
                }
              });
            });
            order.properties.header.isHeavyweight = order.properties.quotes[order.properties.activeQuote].isHeavyweight;
            if (order.properties.header.isHeavyweight) {
              hOrderCnt++;
              hOrders.push(order);
            }
           });
          console.log('found '+hItemCnt+' heavyweight items out of total '+itemCnt+' items in '+hOrderCnt+' orders');
          api.saveObjects(hOrders)
            .then(function() {
              console.log('done');
            });
        });
    };

    this.handlePackageMeasurementUnit = function() {
      api.queryCatalog(1)
        .then(function(catalog) {
          console.log('read '+catalog.length+' catalog items');
          catalog.forEach(function(cat) {
            cat.properties.packageMeasurementUnit = 0;
            cat.properties.exitList.forEach(function(ex) {
              ex.measurementUnit = measurementUnits[0];
            });
          });
          api.saveObjects(catalog)
            .then(function() {
              console.log('done');
            });
        })
    };

    this.handleEmpBonuses = function() {
      var that = this;
      var oldOrd = 0;
      var newOrd = 0;
      // initialize template employee bonuses array
      var empBonuses = angular.copy(pRoles);
      empBonuses.forEach(function(role) {
        var temp = employees.filter(function(emp) {
          return emp.defaultRole === role.tId;
        });
        if (temp.length) {
          role.employee = temp[0];
        }
      });

      console.log('starting');
      api.queryAllOrders(['eventDate'])
        .then(function(orders) {
          console.log(orders.length+' orders read');
          orders.forEach(function(order) {
            if (order.properties.eventDate > new Date(2018,3,0)) {
              newOrd++;
              order.properties.empBonuses = empBonuses;
            }
            else {
              oldOrd++;
              order.properties.empBonuses =[];
            }
             });
          console.log('handled '+oldOrd+' old events, '+newOrd+' new Events');
          api.saveObjects(orders)
            .then(function() {
              console.log('done');
            });
        });
    };




    // generate product name from product description
    this.generateStickerLabels = function () {
      api.queryCatalog(1)
        .then(function(catalog) {
          console.log(catalog.length+' items loaded');
          catalog.forEach(function(cat) { // generate names
              var match = cat.properties.productName.match(/^\s*\S+\s+\S+/); // extract first 2 words of name
              cat.properties.stickerLabel = match ? match[0] : cat.properties.productName;
              cat.properties.stickerQuantity = 1;
          });
            api.saveObjects(catalog)
            .then(function() {
              console.log('catalog updated');
            });
        });
    };

    this.orderCreatorName = function() {
      var that = this;
      console.log('starting');
      api.queryAllOrders('number')
        .then(function(orders) {
          console.log(orders.length+' orders read');
          orders.forEach(function(order) {
            order.properties.createdBy = 'yuval';
           });
            api.saveObjects(orders)
            .then(function() {
              console.log('done');
            });
        });
    };

    this.catalogSensitivities = function () {
      api.queryCatalog()
        .then(function(catalog) {
          console.log(catalog.length+' items loaded');
          catalog.forEach(function(cat) {
            cat.properties.sensitivities = [];
          });
          api.saveObjects(catalog)
            .then(function() {
              console.log('catalog updated');
            });
        });
    };

    this.fixExitListMeasurementUnit = function() {
      api.queryCatalog(1)
        .then(function(catalog) {
          console.log('read '+catalog.length+' catalog items');
          catalog.forEach(function(cat) {
            cat.properties.exitList.forEach(function(ex) {
              if (!ex.measurementUnit) {
                ex.measurementUnit = measurementUnits[0];
                console.log(cat.properties.productName);
              }
            });
          });
          api.saveObjects(catalog)
            .then(function() {
              console.log('done');
            });
        })
    };
    this.categoryType = function(target) {

      var fCnt = 0;
      var hCnt = 0;
      var tCnt = 0;
      var pCnt = 0;
      var iCnt = 0;
      var cCnt = 0;
      var qCnt = 0;

      function fixCategory (category) {
        var cnt = 0;
        var type;
        if (category.tId === 5 || category.tId === 6 || category.tId === 7) {
          delete category.isHeavyweight;
          hCnt++;
          cnt++;
          type = 2;
        }
        if (category.tId === 39) {
          delete category.isTransportation;
          tCnt++;
          cnt++;
          type = 3;
        }
        if (category.tId === 48) {
          delete category.isPriceIncrease;
          pCnt++;
          cnt++;
          type = 4;
        }
        if (cnt > 1) {
          console.log('multiple types');
          console.log(category);
          return false;
        } else if (cnt === 0) {
          fCnt++;
          type = 1;
          category.type = type;
          return true;
        } else {
          category.type = type;
          return true;
        }
      }

      function fixQuotes (quotes) {
        quotes.forEach(function(quote) {
          if (quote.categories) {
            qCnt++;
            quote.categories.forEach(function (category) {
              cCnt++;
              if (!fixCategory(category)) {
                console.log('bad category in quote');
                console.log(quote);
                return false;
              }
            });
          }
          quote.items.forEach(function(item) {
            iCnt++;
            if (!fixCategory(item.category)) {
              console.log('bad category in item');
              console.log(item);
              return false;
            }
          });
        });
        return true;
      }

      var that = this;
      console.log('starting');
      if (target === 1) {   // order
        api.queryAllOrders('quotes')
          .then(function(orders) {
            console.log('read '+orders.length+' orders');
            orders.forEach(function(order) {
              if (!fixQuotes(order.properties.quotes)) {
                console.log('bad order');
                console.log(order);
              }
            });
            console.log('quotes '+qCnt);
            console.log('quote categories '+cCnt);
            console.log('items '+iCnt);
            console.log('food '+fCnt);
            console.log('heavyWeight '+hCnt);
            console.log('transportation '+tCnt);
            console.log('priceIncrease '+pCnt);
            if (1===1) {
              console.log('saving orders');
              api.saveObjects(orders)
                .then(function () {
                  console.log('done')
                })
            }
          })
      } else {    // bid
        api.queryAllBids('order')
          .then(function(bids) {
            console.log('read '+bids.length+' bids');
            bids.forEach(function(bid) {
              if (bid.properties.order.quotes) {
                if (!fixQuotes(bid.properties.order.quotes)) {
                  console.log('bad bid');
                  console.log(bid);
                }
              }
            });
            console.log('quotes '+qCnt);
            console.log('quote categories '+cCnt);
            console.log('items '+iCnt);
            console.log('food '+fCnt);
            console.log('heavyWeight '+hCnt);
            console.log('transportation '+tCnt);
            console.log('priceIncrease '+pCnt);
            if (1===1) {
              console.log('saving bids');
              api.saveObjects(bids)
                .then(function () {
                  console.log('done')
                })
            }
          });
      }
    };

    this.quoteDate = function() {
      console.log('starting');
      api.queryAllOrders(['activities', 'closingDate', 'number', 'orderStatus'])
        .then(function(orders) {
          console.log ('read '+orders.length+' orders');
          var leadCnt = 0;
          var leadMinDate = new Date();
          var leadMinNum = 0;
          var bidCnt = 0;
          orders.forEach(function(order) {
            if (order.properties.activities.length) {
              if (order.properties.activities[order.properties.activities.length-1].text.includes('פניה')) {
                leadCnt++;
                if (order.createdAt < leadMinDate) {
                  leadMinDate = order.createdAt;
                  leadMinNum = order.properties.number;
                }
                var isBid = false;
                order.properties.activities.forEach(function(activity) {
                  if (activity.text.includes('הצעה')) {
                    isBid = true;
                    order.properties.bidDate = activity.date;
                  }
                });
                if (isBid) {
                  bidCnt++;
                  if (order.properties.orderStatus === 0) {
                    console.log('orderStatus conflict 1, order '+order.properties.number);
                  }
                } else {
                  if (order.properties.orderStatus !== 0 && order.properties.orderStatus !== 6 ) {
                    console.log('orderStatus conflict 2, order '+order.properties.number);
                  }

                }
              } else {
                order.properties.bidDate = order.createdAt;
              }
            } else {
              order.properties.bidDate = order.createdAt;
            }
          });
          console.log(leadCnt+' lead orders');
          console.log('starting at '+leadMinDate+' order number '+leadMinNum);
          console.log(bidCnt+' orders advanced to bid');
          console.log('updating orders');
          api.saveObjects(orders)
            .then(function() {
              console.log('done');
            })
        });
    };

    this.prodMu = function() {
      console.log('starting');
      api.queryCatalog(1,['measurementUnit'])
        .then(function(items) {
          console.log('read '+items.length+' items');
          items.forEach(function(item) {
           item.properties.prodMeasurementUnit = item.properties.measurementUnit;
           item.properties.muFactor = 1;
          });
          console.log('updating');
          api.saveObjects(items)
            .then(function() {
              console.log('done');
            });
        });
    };

    this.totForStat = function() {
      console.log('starting');
      api.queryAllOrders(['number','vatRate','quotes','activeQuote','header'])
        .then(function(orders) {
          console.log ('read '+orders.length+' orders');
          var badCount = 0;
          orders.forEach(function(order) {
            var quote = order.properties.quotes[order.properties.activeQuote];
            if (quote) {
              if (typeof quote.priceIncrease === 'undefined') {
                quote.priceIncrease = 0;
              }
              quote.totalForStat = (quote.subTotal + quote.discount + quote.priceIncrease) / (1+order.properties.vatRate);
              if (typeof quote.totalForStat !== 'number') {
                console.log('bad quote, order ' + order.properties.number);
                badCount++;
              }
              order.properties.header.totalForStat = quote.totalForStat;
            }
         });
          if (!badCount) {
            console.log('updating orders');
            api.saveObjects(orders)
              .then(function () {
                console.log('done');
              })
          }
        });
    };

  this.listExtra = function() {
      this.extraList = [];
      var totChange = 0;
      var extCnt = 0;
      var from = new Date(2019,0,1);
      var to = new Date(2030,11,31);
      api.queryOrdersByRange('eventDate',from,to)
        .then(function(orders) {
          console.log(orders.length+' orders read');
          var corrections = [];
          orders.forEach(function(order) {
            var oldOrder = angular.copy(order);
            var change = false;
            if (order.properties.quotes.length) {
              var quote = order.properties.quotes[order.properties.activeQuote];
              var oldQuote = angular.copy(quote);
              if (quote.extraServices) {
                extCnt++;
                console.log('order ' + order.properties.number + ' date ' + order.properties.eventDate);
                orderService.calcTotal(quote, order);
                if (quote.total !== oldQuote.total) {
                  totChange++;
                  console.log('---------- total changed ----------');
                }
                if (quote.extraServices !== oldQuote.extraServices ||
                  quote.totalForStat !== oldQuote.totalForStat ||
                  quote.total !== oldQuote.total) {
                  console.log('-- old: extra: ' + oldQuote.extraServices + ' totalForStat: ' + oldQuote.totalForStat + ' total: ' + oldQuote.total)
                  console.log('-- new: extra: ' + quote.extraServices + ' totalForStat: ' + quote.totalForStat + ' total: ' + quote.total)
                  if (!change) {
                    change = true;
                    order.properties.header.totalForStat = quote.totalForStat;
                    corrections.push(order);
                  }
                }
              }
            }
          });
          console.log(extCnt+' quotes with extra services');
          console.log(totChange+' totals changed');
          console.log(corrections.length+' corrections found');
          console.log('updating');
          api.saveObjects(corrections)
            .then(function(o) {
              console.log('done');
            })
        });
    };
    this.updateHeader = function() {
      var from = new Date(2019,0,1);
      var to = new Date(2030,11,31);
      api.queryOrdersByRange('eventDate',from,to)
        .then(function(orders) {
          console.log(orders.length + ' orders read');
          var corrections = [];
          orders.forEach(function (order) {
            if (order.properties.quotes.length) {
              var quote = order.properties.quotes[order.properties.activeQuote];
              if (quote.totalForStat !== order.properties.header.totalForStat) {
                console.log('order '+order.properties.number+' old: '+order.properties.header.totalForStat+', new: '+quote.totalForStat);
                order.properties.header.totalForStat = quote.totalForStat;
                corrections.push(order);
              }
            }
         });
          console.log(corrections.length + ' corrections found');
          console.log('updating');
          api.saveObjects(corrections)
            .then(function (o) {
              console.log('done');
            })
        })
    };
    this.specialTypes = function() {
      api.queryCatalogByCategory(51)
        .then(function(extraItems) {
          console.log(extraItems.length+' catalog items read');
          var from = new Date(2019,0,1);
          var to = new Date(2030,11,31);
          api.queryOrdersByRange('eventDate',from,to)
            .then(function(orders) {
              console.log(orders.length + ' orders read');
              var corrections = [];
              orders.forEach(function (order) {
                if (order.properties.quotes.length) {
                  var quote = order.properties.quotes[order.properties.activeQuote];
                  var isExtra = false;
                  quote.items.forEach(function(item) {
                    if (item.category.type===5 && !item.specialType) {
                      item.specialType = extraItems.filter(function(cat) {
                        return cat.id === item.catalogId;
                      })[0].properties.specialType;
                      isExtra = true;
                    }
                  });
                  if (isExtra) {
                    corrections.push(order);
                  }
                }
              });
              console.log(corrections.length + ' corrections found');
              console.log('updating');
              api.saveObjects(corrections)
                .then(function (o) {
                  console.log('done');
                })
            })
        })
   };
    this.packageFactor = function() {
      console.log('starting');
      api.queryCatalog(1,['packageFactor','exitList'])
        .then(function(items) {
          console.log('read '+items.length+' items');
          var elc = 0;
          items.forEach(function(item) {
            item.properties.packageFactor = 1;
            item.properties.exitList.forEach(function (el) {
              elc++;
              el.factor = 1000;   // set high default value
            });
          });
          console.log('set '+elc+' exitList factor values');
          console.log('updating');
          api.saveObjects(items)
            .then(function() {
              console.log('done');
            });

        });
    };
    this.isInStock = function() {
      console.log('starting');
      api.queryCatalog(undefined,['isInStock'])
        .then(function(items) {
          console.log('read '+items.length+' items');
          items.forEach(function(item) {
            item.properties.isInStock = false;
         });
          console.log('updating');
          api.saveObjects(items)
            .then(function() {
              console.log('done');
            });

        });
    };
    this.externalName = function() {
      console.log('starting');
      api.queryCatalog(1,['productName','externalName'])
        .then(function(items) {
          console.log('read '+items.length+' items');
          items.forEach(function(item) {
            item.properties.externalName = item.properties.productName;
          });
          console.log('updating');
          api.saveObjects(items)
            .then(function() {
              console.log('done');
            });

        });
    };
    this.prepTiming = function() {
      console.log('starting');
      api.queryCatalog(2,['domain','prepTiming'])
        .then(function(items) {
          console.log('read '+items.length+' items');
          items.forEach(function(item) {
            item.properties.prepTiming = 0;
          });
          console.log('updating');
          api.saveObjects(items)
            .then(function() {
              console.log('done');
            });

        });
    };

  this.unhandledPreps = function() {
     console.log('starting');
     api.queryCatalog(2,['domain','components'])
       .then(function(items) {
         var c = 0;
         console.log('read '+items.length+' items');
         items.forEach(function(item) {
           var temp = item.properties.components.filter(function(comp) {
             return comp.domain === 4;
           });
           if (temp.length === 0) {
             c++;
             item.properties.components.push({
               id: config.properties.unhandledPrepComponent,
               domain: 4,
               quantity: 1
             })
           }
         });
         console.log(c+' preps modified');
         console.log('updating');
         api.saveObjects(items)
           .then(function() {
             console.log('done');
           });

       });
   };

    this.undefinedBacktrace = function() {
      var that = this;
      api.queryWorkOrder(0,1)
        .then(function(dishes) {
          var backTraces = [];
          dishes.forEach(function(dish) {
            dish.properties.backTrace.forEach(function(bt) {
              if (!bt.id) {
                backTraces.push({
                  dishId: dish.id,
                  dishName: dish.properties.productName,
                  btDomain: bt.domain,
                  btQuantity: bt.quantity
                });
              }
            });
          });
          console.log(backTraces.length+' bad backTraces found');
          console.log(backTraces);
        });
    };

    function setPersonalAdjustment (item) {
      return !item.isDescChanged || item.isCosmeticChange ? '' :
        item.kitchenRemark ? item.kitchenRemark :
          item.productDescription;
    }

    this.personalAdjustment = function () {
      api.queryFutureOrders()
        .then(function (orders) {
          console.log('read '+orders.length+ ' future orders');
          orders.forEach(function(ord) {
            ord.properties.quotes.forEach(function(quote) {
              quote.items.forEach(function(item) {
                item.personalAdjustment = setPersonalAdjustment(item);
              })
            });
          });
          api.saveObjects(orders)
            .then(function() {
              console.log('updated');
              api.queryTemplateOrders()
                .then(function (orders) {
                  console.log('read '+orders.length+ ' templates');
                  orders.forEach(function (ord) {
                    ord.properties.quotes.forEach(function (quote) {
                      quote.items.forEach(function (item) {
                        item.personalAdjustment = setPersonalAdjustment(item);
                      });
                    });
                  });
                  api.saveObjects(orders)
                    .then(function () {
                      console.log('updated');
                    });
                });
            });
        });
    };
    this.addPopmidouBox = function() {
      var itemsToSave = [];
      api.queryCatalog(1)
        .then(function(catalog) {
          catalog.forEach(function (cat) {
            var box = cat.properties.components.filter(function (comp) {
              return comp.id === config.properties.boxItem;
            })[0];
            if (box) {
              cat.properties.components.push({
                id: api.getEnvironment() === 'test' ? 'fqzuYPmQLe' : 'IQPEcD7gru',
                domain: 3,
                quantity: box.quantity
              });
              itemsToSave.push(cat);
            }
          });
          console.log(itemsToSave.length+' catalog items changed');
          api.saveObjects(itemsToSave)
            .then(function () {
              console.log('done');
            })
        });
    };
    // remove one occurance of boxItem from components
    this.fixPopmidouBox = function() {
      var itemsToSave = [];
      api.queryCatalog(1)
        .then(function(catalog) {
          catalog.forEach(function (cat) {
            var ind;
            var box = cat.properties.components.filter(function (comp, i) {
              if (comp.id === config.properties.boxItem) {
                ind = i;
                return true;
              } else {
                return false;
              }
            })[0];
            if (box) {
              cat.properties.components.splice(ind,1);
               itemsToSave.push(cat);
            }
          });
          console.log(itemsToSave.length+' catalog items changed');
          api.saveObjects(itemsToSave)
            .then(function () {
              console.log('done');
            })
        });
    }

    this.updateSensitivities = function () {
      api.queryCatalog(1,['sensitivities'])
          .then(function(dishes) {
            console.log(dishes.length+' dishes read');
            dishes.forEach(function(dish) {
              dish.properties.sensitivities.forEach(function(sen, ind) {
                var sensitivity = sensitivities.filter(function (sen2) {
                  return sen2.tId === sen.tId;
                })[0];
                dish.properties.sensitivities[ind] = sensitivity;
              });
            });
            api.saveObjects(dishes)
                .then(function () {
                  console.log('done');
                });
          });
    };
    function trimPackageWords (name) {
      var packageWords = [
        'ואריזת',
        'אריזת',
        '- לארוז',
        '-לארוז',
        'לארוז',
        '- אריזה',
        '-אריזה',
        'אריזה'
      ];
      for (var i=0;i<packageWords.length;i++) {
        var newName = name.replace(packageWords[i],'');
        if (newName !== name) {
          return newName;
        }
      }
      return name;
    }

    this.packagingNames = function() {
      api.queryCatalog(4,['productName','externalName','domain','category','isDeleted'])
          .then(function(actions) {
            var cnt = 0;
            console.log(actions.length+' actions read');
            var filteredActions = actions.filter(function (act) {
              var category = allCategories.filter(function (cat) {
                return cat.tId === act.properties.category;
              })[0];
              return (category.type === 21 || category.type === 22) && !act.properties.isDeleted;
            });
            filteredActions.forEach(function(filt) {
              filt.properties.externalName = trimPackageWords(filt.properties.productName);
              if (filt.properties.externalName !== filt.properties.productName) {
                cnt++;
              }
            });
            console.log(filteredActions.length+' actions filtered');
            console.log(cnt+' actions changed');
            api.saveObjects(filteredActions)
                .then(function () {
                  console.log('done');
                });
          });
    };

    this.externalServicesForStat = function () {
      var changedOrders = 0;
      var changedQuotes = 0;
      var ordersToUpdate = [];
      var from = new Date(2022,0,1);
      var to = new Date(2030,11,31);
      api.queryOrdersByRange('eventDate',from,to)
          .then(function(orders) {
            console.log(orders.length + ' orders read');
            orders.forEach(function(order) {
                if (order.properties.quotes) {
                  order.properties.quotes.forEach(function(quote, ind) {
                    var oldTotal = quote.total;
                    orderService.calcTotal(quote,order,true); // don't do the checkTasks part
                    if (quote.total != oldTotal){
                      console.log('order '+order.properties.number+' quote '+ind+' total changed from '+oldTotal+' to '+quote.total);
                    }
                    changedQuotes++
                    if (ind === order.properties.activeQuote) {
                      orderService.setupOrderHeader(order.properties);
                    }
                  });
                  changedOrders++;
                  ordersToUpdate.push(order);
                }
            });
            console.log(changedOrders+ ' orders changed');
            console.log(changedQuotes+ ' quotes changed');
            saveSlices(ordersToUpdate);
          });
          };
    // end conversions
     */

  });

