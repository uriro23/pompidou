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
    this.sortedDocumentTypes = angular.copy(this.documentTypes).filter(function(dt) {
      return dt.isRealDocumentType;
    });
    this.sortedDocumentTypes.sort(function(a,b) {
      return a.order - b.order;
    });
    this.bidDesc = '';

    var that = this;
    this.isBidsLoading = true;
    api.queryBidsByOrder(this.order.id).then (function (bids) { // lazy load bids
      that.bids = bids;
      that.isBidsLoading = false;
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

    function createBidForQuote (quote, docType, bidDesc) {
      var bid = api.initBid();
      bid.attributes.version = lov.version;
      bid.attributes.documentType = docType;
      console.log('docType='+docType);
      bid.attributes.menuType = quote.menuType;
      bid.attributes.orderId = that.order.id;
      bid.attributes.date = new Date();
      bid.attributes.order = that.order.attributes;
      bid.attributes.total = that.total;
      bid.attributes.customer = that.order.view.customer;
      if (docType === 0) {  // backup
        bid.attributes.desc = bidDesc;
      } else {
        bid.attributes.desc = bidDesc + ' ' + quote.title;
      }
      bid.attributes.uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }); // source: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
      return bid;
    }

    this.createBid = function (docType) {
      if (this.order.view.isChanged) {
        return;
      }

      var that = this;
      var bids = [];
      if (docType === 0 || docType === 2 || this.isOnlyActiveQuote) { // if creating backup or order doc, pick active quote only
        bids.push(createBidForQuote(this.order.view.quote, docType, this.bidDesc));
      } else {
        this.order.attributes.quotes.forEach(function (quote) {
          if (quote.items.length) { // skip empty quotes
            bids.push(createBidForQuote(quote, docType, that.bidDesc));
          }
        });
      }
      this.bidDesc = '';
      this.isOnlyActiveQuote = false;

     return api.saveObjects(bids)
        .then(function () {
         that.isBidsLoading = true;
         return api.queryBidsByOrder(that.order.id)  // requery bids for view
            .then(function (bids) {
              that.bids = bids;
              that.isBidsLoading = false;
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
              api.queryOrder(that.order.id)   // requery order to get new update timestamp
                .then(function(ord) {
                  that.order.updatedAt = ord[0].updatedAt;
                  alert('האירוע שוחזר לגרסה ' + bid.attributes.desc + ' מתאריך ' +
                  $filter('date')(bid.attributes.date, 'dd/MM/yyyy HH:mm'))
                });
            })
        })
    };

    this.delBid = function (bid) {
      var that = this;
      return api.deleteObj(bid)
        .then(function () {
          that.isBidsLoading = true;
          return api.queryBidsByOrder(that.order.id)
            .then(function (bids) {
              that.bids = bids;
              that.isBidsLoading = false;
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
