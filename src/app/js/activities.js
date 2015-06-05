'use strict';

angular.module('myApp')
  .controller('ActivitiesCtrl', function ($scope, $modal, api) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;

    // functions
    this.orderChanged = $scope.orderModel.orderChanged;

    this.activityText = '';

    this.addActivity = function () {
      if (this.activityText.length > 0) {
        this.order.attributes.activities.splice(0, 0, {date: new Date(), text: this.activityText});
        this.activityText = '';
        this.orderChanged();
      }
    };

    this.delActivity = function (ind) {
      this.order.attributes.activities.splice(ind, 1);
      this.orderChanged();
    };

    this.showMail = function (mailId) {
      var showMailModal = $modal.open({
        templateUrl: 'app/partials/order/showMail.html',
        controller: 'ShowMailCtrl as showMailModel',
        resolve: {
          mail: function () {
            return api.queryMails(mailId)
              .then(function (mails) {
                return mails[0].attributes
              })
          }
        },
        size: 'lg'
      });

      showMailModal.result.then(function () {
      });
    };


  });
