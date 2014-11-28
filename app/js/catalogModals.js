'use strict';

angular.module('myApp')
  .controller ('ExitListCtrl', function($modalInstance, catalogItem) {

  this.productDescription = catalogItem.attributes.productDescription;

    // create local copy of exitList so updates can be undone on cancel
  if (catalogItem.attributes.exitList) {
    this.exitList = catalogItem.attributes.exitList.slice();
  } else {  // for old catalog items without a list
    this.exitList = [];
  }

  //TODO: set focus on added item
  this.addItem = function () {
    this.exitList.push({item:''});
  };

  this.delItem = function (ind) {
    this.exitList.splice(ind,1);
  };

  this.done = function () {
    catalogItem.attributes.exitList = this.exitList.slice();
    $modalInstance.close();
  };

  this.cancel = function () {
    $modalInstance.dismiss();
  }
});
