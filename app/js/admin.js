'use strict';

/* Controllers */
angular.module('myApp')
  .controller('AdminCtrl', function (api, $state, $rootScope,
                                         lov, config, bidTextTypes, categories,
                                         eventTypes, measurementUnits, discountCauses, users) {

    $rootScope.hideMenu = false;
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
      if(!this.pwd1) {
        alert('נא להקיש סיסמה');
        this.pwd2 = null;
        return;
      }
      if (this.pwd1.length < 6) {
        alert('סיסמה קצרה מדי - צריכה להיות בת 6 תווים לפחות');
        this.pwd1 = this.pwd2 = null;
        return;
      }
      if(this.pwd1 !== this.pwd2) {
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
        })
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
        })
    }

  });