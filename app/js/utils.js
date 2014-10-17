'use strict';

angular.module('myApp').

  service ('utils', function() {

  this.clone = function (obj) {
    if(obj == null || typeof(obj) != 'object' || obj._noClone)
      return obj;

    var temp = obj.constructor(); // changed

    for(var key in obj) {
      if(obj.hasOwnProperty(key)) {
        temp[key] = this.clone(obj[key]);
      }
    }
    return temp;
  };

  this.nonRecursiveClone = function (obj) {
    if(obj == null || typeof(obj) != 'object')
      return obj;

    var temp = obj.constructor(); // changed

    for(var key in obj) {
      if(obj.hasOwnProperty(key)) {
        temp[key] = obj[key];
      }
    }
    return temp;
  };

  })
