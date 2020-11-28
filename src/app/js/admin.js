'use strict';

/* Controllers */
angular.module('myApp')
  .controller('AdminCtrl', function (api, $state, $rootScope, orderService,
                                     lov, config, bidTextTypes, menuTypes,
                                     measurementUnits, categories,sensitivities,
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

//

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
            return !comps.length;
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
          that.isCatalogLoading = false;
        });
    };

    this.productTree = function() {
      var that = this;
      api.queryCatalogByCategory(this.productTreeCategory.tId)
        .then(function(res) {
          that.menuItems = res.filter(function(cat) {  // return only items with components
            var comps = cat.properties.components.filter(function(comp) {
              return comp.id !== config.properties.unhandledItemComponent &&
                comp.id !== config.properties.unhandledItemMaterial  &&
                comp.id !== config.properties.satietyIndexItem;
            });
            return comps.length && !cat.properties.isDeleted;
          }).sort(function(a,b) {
            if (a.properties.productDescription > b.properties.productDescription) {
              return 1;
            } else {
              return -1;
            }
          });
          that.menuItems.forEach(function(menuItem) {
            menuItem.preparations = [];
            menuItem.materials = [];
            menuItem.measurementUnit = measurementUnits.filter(function(mu) {
              return mu.tId === menuItem.properties.measurementUnit;
            })[0];
            menuItem.properties.components.filter(function(comp) {
              return comp.id !== config.properties.unhandledItemComponent &&
                comp.id !== config.properties.unhandledItemMaterial  &&
                comp.id !== config.properties.satietyIndexItem;
            }).forEach(function(component) {
              var compCatalog = angular.copy(that.catalog.filter(function(cat) {
                return cat.id === component.id;
              })[0]);
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
                  materialCatalog.quantity = prepMaterial.quantity;
                  materialCatalog.measurementUnit = measurementUnits.filter(function(mu) {
                    return mu.tId === materialCatalog.properties.measurementUnit;
                  })[0];
                  compCatalog.materials.push(materialCatalog);
                });
                menuItem.preparations.push(compCatalog);
              } else {
                menuItem.materials.push(compCatalog);
              }
            })
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
              catalog.forEach(function(cat) {
                cat.category = cat.properties.category; // for ng-repeat filter
                cat.measurementUnitObj = measurementUnits.filter(function(mu) {
                  return mu.tId === cat.properties.measurementUnit;
                })[0];
                if (!cat.measurementUnitObj) {
                  console.log('MU not found for '+cat.properties.productName);
                } else {
                  cat.measurementUnitLabel = cat.measurementUnitObj.label;
                }
                 cat.categoryObject = that.categories.filter(function(cat2) {
                  return cat2.tId === cat.properties.category;
                })[0];
                cat.exitListLength = cat.properties.exitList.length;
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
    };

    this.saveProductNameitem = function(cat) {
      cat.category = cat.properties.category = cat.categoryObject.tId;
      cat.properties.sensitivities = cat.sensArray.filter(function(sen) {
        return sen.isTrue;
      });
      api.saveObj(cat);
      cat.isChanged = false;
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
      var fields = ['customer','eventDate','orderStatus'];
      api.queryCustomers()
        .then(function(customers) {
          api.queryOrdersByRange('eventDate', new Date(2015,5,1),new Date(2099,12,31),fields)
            .then(function(orders) {
              customers.forEach(function(customer) {
                customer.view = {
                  pastSuccesses: 0,
                  futureOrders: 0,
                  lastEventDate : new Date(2000,1,1)
                };
                orders.forEach(function(order) {
                  if (order.properties.customer === customer.id) {
                    if (order.properties.eventDate > customer.view.lastEventDate) {
                      customer.view.lastEventDate = order.properties.eventDate;
                    }
                    if (order.properties.eventDate < new Date(2019,10,1) && // since Nov 1st
                        order.properties.orderStatus > 1 &&
                        order.properties.orderStatus < 6) {
                      customer.view.pastSuccesses++;
                    }
                    if (order.properties.eventDate > new Date(2019,10,1) &&
                        order.properties.orderStatus < 6) {
                      customer.view.futureOrders++;
                    }
                   }
                })
              });
              that.customers = customers.filter(function(cust) {
                return cust.view.pastSuccesses && !cust.view.futureOrders;
              });
            });
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
     */
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
// end conversions

  });

