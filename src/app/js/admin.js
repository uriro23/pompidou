'use strict';

/* Controllers */
angular.module('myApp')
  .controller('AdminCtrl', function (api, $state, $rootScope, orderService,
                                     lov, config, bidTextTypes, categories, menuTypes,
                                     eventTypes, measurementUnits, discountCauses, users) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = lov.company + ' - ניהול';


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

    this.users = users;

    this.newUser = function () {
      this.user = api.initUser();
    };

    this.saveUser = function () {
      api.userSignUp(this.user);
    };


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
      api.queryAllOrders('quotes')
        .then(function(orders) {
          console.log('read '+orders.length+' orders');
          orders.forEach(function(order) {
            order.attributes.quotes.forEach(function(quote) {
              // convert lov values in quote from ids to objects
              quote.discountCause = discountCauses.filter(function (obj) {
                return (obj.tId === quote.discountCause);
              })[0];
              quote.menuType = menuTypes.filter(function(obj) {
                return (obj.tId === quote.menuType);
              })[0];
              quote.endBoxType = menuTypes.filter(function(obj) {
                return (obj.tId === quote.endBoxType);
              })[0];
              quote.endTextType = bidTextTypes.filter(function(obj) {
                return (obj.tId === quote.endTextType);
              })[0];
            })
          });
          console.log('updating orders');
          api.saveObjects(orders)
            .then(function() {
              console.log('orders updated');
            });
        })
    };

        });

