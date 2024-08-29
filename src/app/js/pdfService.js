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

    this.getPdf = function (source) {
      var q = $q.defer();
      var serviceUrl = 'https://v2.convertapi.com/web/to/pdf?Secret='+secrets.prod.web2pdfSecret;
      var formData = new FormData();
      formData.append('Url', source.url);
      formData.append('ConversionDelay', 7);
      formData.append('MarginBottom', 5);
      formData.append('MarginTop', 5);
      formData.append('MarginRight', 5);
      formData.append('MarginLeft', 5);
      formData.append('PageSize', 'a4');
      formData.append('version', '117');
      // if (source.documentType === 5) {  // only for quote2
      //   formData.append('ViewportWidth', 1000);
      // }
    //  formData.append('CssMediaType', 'print');

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
        this.getPdf(source)
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
