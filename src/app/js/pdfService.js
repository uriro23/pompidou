'use strict';

angular.module('myApp')

  .service('pdfService', function ($q, $rootScope, $timeout, secrets) {


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

    this.getPdfNew = function (sourceUrl) {
      var q = $q.defer();
      var serviceUrl = 'https://v2.convertapi.com/html/to/pdf?Secret='+secrets.prod.web2pdfSecret;
      var xhr = new XMLHttpRequest();
      xhr.open('POST', serviceUrl, true);
      xhr.responseType = 'arraybuffer';
      xhr.onload = function () {
        if (this.status === 200) {
          var respStr = String.fromCharCode.apply(null, new Uint8Array(this.response));
          console.log(JSON.parse(respStr));
          var pdf = JSON.parse(respStr).Files[0].FileData;
          q.resolve(pdf);
        } else {
          q.reject(this);
        }
      };
      var formData = new FormData();
      formData.append('File', sourceUrl);
      formData.append('ConversionDelay', '2');
      formData.append('Scripts', 'true');
      formData.append('MarginBottom', '30');
      formData.append('CssMediaType', 'print');
      formData.append('Zoom', '1.5');
      xhr.send(formData);
      return q.promise;
    };


    this.getPdfOld = function (sourceUrl) {
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
        ApiKey: secrets.prod.web2pdfKeyOld,
        CUrl: sourceUrl,
        MarginBottom: 30
      }));
      return q.promise;
    };

    this.setPdfVersion = function(bool) {
      this.isNewPdfVersion = bool;
    };

    this.getPdf = function(sourceUrl) {
      if (this.isNewPdfVersion) {
        return this.getPdfNew(sourceUrl);
      } else {
        return this.getPdfOld(sourceUrl);
      }
    };


    this.getPdfCollection = function (sourceList, firstTime) {
      var that = this;
      if (firstTime) {
        this.pdfArray = [];
        this.promise = $q.defer();
        if (!sourceList.length) { // if no attachments, return empty array
          $timeout(function () {
            that.promise.resolve(that.pdfArray);
          }, 20);
          return this.promise.promise;
        }
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
