'use strict';

angular.module('myApp')

  .service('accountingService', function ($q, $rootScope, $timeout, secrets) {

    this.createOrder = function (isProd, order) {
      var q = $q.defer();
      var serviceUrl = 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Document.New';
      var request = {
        api_token: isProd?secrets.prod.accountingToken:secrets.test.accountingToken,
        document_type: 999,  // todo: find document type
        customer_id: 0, // create new or find existing
        last_name: order.view.customer.lastName,
        first_name: order.view.customer.firstName,
        address: order.view.customer.address,
        phone: order.view.customer.mobilePhone,

      };
      var jsonRqst = JSON.stringify(request);


      $.ajax({
        url: serviceUrl,
        data: jsonRqst,
        processData: false,
        contentType: false,
        method: 'POST',
        success: function(data) {
          q.resolve(data.Files[0].FileData);
        },
        error: function () {
          q.reject();
        }
      });
      return q.promise;
    };

    var transformRequest =function (obj) {
      var str = [];
      for (var p in obj)
        if (obj.hasOwnProperty(p)) {
          str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
        }
      return str.join("&");
    };


    this.documentTypes = function (isProd) {
      var that = this;
      var q = $q.defer();
      var serviceUrl = 'https://api.rivhit.co.il/online/RivhitOnlineAPI.svc/Document.TypeList';
      var request = {
        "api_token": isProd?secrets.prod.accountingToken:secrets.test.accountingToken

      };
      var jsonRqst = JSON.stringify(request);
      console.log('request = '+jsonRqst);

      var xhr = new XMLHttpRequest();
      xhr.open('POST', serviceUrl, true);
      xhr.responseType = 'json';
      xhr.onload = function () {
        if (this.status === 200) {
          var type = xhr.getResponseHeader('Content-Type');
          console.log('response:');
          console.log(this.response);
          q.resolve(this.response);
        } else {
          console.log('bad:');
          console.log(this);
          q.reject(this);
        }
      };
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.send(transformRequest(request));
      /*
      $.ajax({
        url: serviceUrl,
        data: '{"api_token" : "decd03e5-e35c-41e8-84f7-fba2fb483928","document_type":2147483647}',
        processData: false,
        contentType: false,
        method: 'POST',
        success: function(data) {
          console.log('TypeList success');
          console.log(data);
          q.resolve(data);
        },
        error: function (error) {
          console.log('typeList error');
          console.log(error);
          q.reject();
        }
      });
         */
      return q.promise;
    };


  });
