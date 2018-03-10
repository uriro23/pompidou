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

    this.getPdf = function (sourceUrl) {
      var q = $q.defer();
      var serviceUrl = 'https://v2.convertapi.com/web/to/pdf?Secret='+secrets.prod.web2pdfSecret;
      var formData = new FormData();
      formData.append('Url', sourceUrl);
      formData.append('ConversionDelay', '7');
      formData.append('MarginBottom', '30');

      $.ajax({
        url: serviceUrl,
        data: formData,
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
            if (pdf.length < 1500) {  // too small PDF means timeout
              return that.promise.reject('PDF timeout');
            }
            that.pdfArray.push({
              type: 'application/pdf',
              name: source.fileName,
              base64: pdf
            });
            that.getPdfCollection(sourceList, false);
           },
            (function(err) {
              that.promise.reject(err);
            })
          );
        return this.promise.promise;
      } else {
        this.promise.resolve(this.pdfArray);
      }

    };


  });
