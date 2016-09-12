'use strict';

angular.module('myApp')
  .controller('DocumentsCtrl', function ($scope, $modal, $filter, api, orderService, lov) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.isReadOnly = $scope.orderModel.isReadOnly;
    this.bidTextTypes = $scope.orderModel.bidTextTypes;
    this.orderStatuses = $scope.orderModel.orderStatuses; // needed for setupOrderView

    // functions
    this.setupOrderView = $scope.orderModel.setupOrderView;
    this.getPrevOrders = $scope.orderModel.getPrevOrders; // needed for setupOrderView

    this.documentTypes = lov.documentTypes;

    var that = this;
    api.queryBidsByOrder(this.order.id).then (function (bids) { // lazy load bids
      that.bids = bids;
    });


    this.orderChanged = function (field) {
      orderService.orderChanged(this.order,field);
    };

    this.setOrderDocTextType = function () {
      this.order.attributes.orderDocTextTypes = angular.copy(this.bidTextTypes.filter(function (t) {
        return t.isInclude;
      }));
      orderService.orderChanged(this.order,'orderTextType');
    };


    this.createBid = function (docType) {
      if (this.order.view.isChanged) {
        return;
      }

      var that = this;
      var bids = [];
      this.order.attributes.quotes.forEach(function(quote) {
        var bid = api.initBid();
        bid.attributes.documentType = docType;
        bid.attributes.menuType = quote.menuType;
        bid.attributes.orderId = that.order.id;
        bid.attributes.date = new Date();
        bid.attributes.order = that.order.attributes;
        bid.attributes.total = that.total;
        bid.attributes.customer = that.order.view.customer;
        bid.attributes.desc = that.bidDesc+' '+quote.title;
        bid.attributes.uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
          var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        }); // source: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
        bids.push(bid);
      });
      this.bidDesc = null;
     return api.saveObjects(bids)
        .then(function () {
          return api.queryBidsByOrder(that.order.id)  // requery bids for view
            .then(function (bids) {
              that.bids = bids;
            })
        })
    };

    this.restoreBid = function (bid) {
      var that = this;
      if (this.order.view.isChanged) {
        return;
      }
      this.bidDesc = 'גיבוי לפני שחזור לתאריך ' + $filter('date')(bid.attributes.date, 'dd/MM/yyyy HH:mm');
      this.createBid(0)
        .then(function () {
          that.order.attributes = bid.attributes.order;
          that.setupOrderView();
          orderService.setupOrderHeader(that.order.attributes);
          api.saveObj(that.order)
            .then(function () {
              alert('האירוע שוחזר לגרסה ' + bid.attributes.desc + ' מתאריך ' +
              $filter('date')(bid.attributes.date, 'dd/MM/yyyy HH:mm'))
            })
        })
    };

    this.delBid = function (bid) {
      var that = this;
      return api.deleteObj(bid)
        .then(function () {
          return api.queryBidsByOrder(that.order.id)
            .then(function (bids) {
              that.bids = bids;
            })
        })
    };

    this.sendMail = function () {
      var that = this;
      var sendMailModal = $modal.open({
        templateUrl: 'app/partials/order/sendMail.html',
        controller: 'SendMailCtrl as sendMailModel',
        resolve: {
          order: function () {
            return that.order;
          },
          bids: function () {
            return that.bids;
          },
          bidTextTypes: function () {
            return that.bidTextTypes;
          }
        },
        size: 'lg'
      });

      sendMailModal.result.then(function () {
      });

    };


  });
