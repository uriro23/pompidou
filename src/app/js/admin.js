'use strict';

/* Controllers */
angular.module('myApp')
  .controller('AdminCtrl', function (api, $state, $rootScope, orderService,
                                     lov, config, bidTextTypes, menuTypes, categories, discountCauses, role) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - ניהול';

  this.isEnvTabActive =true;

    // vat
    // ---

    this.vatRate = config.attributes.vatRate * 100;
    this.vatError = false;

    this.setVat = function () {
      this.vatError = this.vatRate !== Number(this.vatRate) || this.vatRate < 0 || this.vatRate > 50;
    };

    this.updateVat = function () {
      if (this.vatError) {
        alert('מע"מ שגוי. יש לתקן לפני העדכון');
        return;
      }
      config.attributes.vatRate = this.vatRate / 100;
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
      user.attributes.password = this.pwd1;
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
      if (api.getCurrentUser().attributes.username !== 'uri') {
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
      api.userPasswordReset(usr.attributes.email)
        .then(function () {
          alert('נשלח מייל להחלפת סיסמה');
        });
    };

    // env

    this.switchEnv = function () {
      if (api.getEnvironment()==='test') {
        alert('הנך עובר לטפל בנתוני סביבת הייצור');
        api.setEnvironment('prod');
      } else {
        api.setEnvironment('test');
      }
      $state.go('login');
    };

    this.catalogReport = function() {
      var that = this;
      api.queryCatalog(1)
        .then(function(catItems) {
          var noCompItems = catItems.filter(function(cat) {  // return only items with no components
            var comps = cat.attributes.components.filter(function(comp) {
              return comp.id !== config.attributes.unhandledItemComponent &&
                     comp.id !== config.attributes.unhandledItemMaterial;
            });
            return !comps.length;
          }).map(function(cat) {
            cat.view = {};
            cat.view.count = 0;
            cat.view.category = categories.filter(function(c) {
              return c.tId===cat.attributes.category;
            })[0];
            return cat;
          });
          var from = new Date(new Date().getFullYear()-1,new Date().getMonth(),new Date().getDate);
          var to = new Date(2099,11,31);
          api.queryOrdersByRange('eventDate',from,to)
            .then(function(ords) {
              ords.forEach(function(ord) {
                var ordItems = ord.attributes.quotes[ord.attributes.activeQuote].items;
                ordItems.forEach(function(itm) {
                  noCompItems.forEach(function(noComp) {
                    if (noComp.id===itm.catalogId) {
                      noComp.view.count++;
                    }
                  });
                });
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

    // quote conversion  1/2016

    this.createNewQuoteData = function () {
      api.queryAllOrders()
        .then (function(orders) {
        console.log('read '+orders.length+' orders');
        for (var i=0;i<orders.length;i++) {
          var order = orders[i].attributes;
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
          orderService.setupOrderHeader(orders[i].attributes);
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
            order.attributes.version = lov.version; // set version to current
            if (order.attributes.quotes.length > 1) {  // already new version, maybe corrupt but don't handle it
              console.log('multiple quotes on order '+order.attributes.number);
            } else {
              var quote = order.attributes.quotes[0];
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
                console.log('order '+order.attributes.number+' old mt '+quote.menuType);
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
                    if (bid.attributes.menuType) {
                      bid.attributes.version = 4;
                    } else if (bid.attributes.order.quotes) {
                      bid.attributes.version = 3;
                    } else {
                      bid.attributes.version = 2;
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

        });

