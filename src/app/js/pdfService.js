'use strict';

angular.module('myApp')

  .service('pdfService', function ($q, $rootScope, secrets) {


    function _arrayBufferToBase64( buffer ) {
      var binary = '';
      var bytes = new Uint8Array( buffer );
      var len = bytes.byteLength;
      for (var i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
      }
      return window.btoa( binary );
    }
    var transformRequest =function (obj) {
      var str = [];
      for (var p in obj)
      if (obj.hasOwnProperty(p)) {
        str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
      }
      return str.join("&");
    };

    this.getPdf = function (sourceUrl) {
      var q = $q.defer();
      var serviceUrl = 'https://do.convertapi.com/Web2Pdf';
      var xhr = new XMLHttpRequest();
      xhr.open('POST', serviceUrl, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (this.status === 200) {
          var type = xhr.getResponseHeader('Content-Type');
          var blob = new Blob([this.response], { type: type });
          q.resolve(_arrayBufferToBase64(this.response));
        } else {
          q.reject(this);
        }
      };
      xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
      xhr.send(transformRequest({
        ApiKey: secrets.prod.web2pdfKey,
        CUrl: sourceUrl
      }));
      return q.promise;
    };


    this.getPdfCollection = function (sourceList, firstTime) {
      var that = this;
      if (firstTime) {
        this.pdfArray = [];
        this.promise = $q.defer();
      }
      if (sourceList.length) {
        var source = sourceList.pop();
        console.log('converting ' + source.url);
        this.getPdf(source.url)
          .then(function (pdf) {
            that.pdfArray.push({
              type: 'application/pdf',
              name: source.fileName,
              base64: pdf
            });
            that.getPdfCollection(sourceList, false);
           });
        return this.promise.promise;
      } else {
        this.promise.resolve(this.pdfArray);
      }

    };


  });
