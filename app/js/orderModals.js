'use strict';

angular.module('myApp')
.controller ('AckDelOrderCtrl', function($modalInstance, order, today) {
  this.order = order;
  this.currentCustomer = order.view.currentCustomer;
  this.days = parseInt((order.attributes.eventDate - today)/(24*3600*1000));  // need parseInt because of DST difference
  this.daysDirection = 'בעוד';
  if (this.days<0) {
    this.days = -this.days;
    this.daysDirection = 'לפני';
  }

  this.setYes = function() {
    $modalInstance.close (true);
  };

  this.setNo = function() {
    $modalInstance.close (false);
  };
})

  .controller('VatChangeCtrl', function($modalInstance, orderVat, currentVat) {
    this.orderVat = orderVat;
    this.currentVat = currentVat;
    this.action = 0;

    this.done = function() {
      $modalInstance.close(this.action);
    }
  })

  .controller('UpdatePricesCtrl', function ($modalInstance, order, catalog) {
    var that = this;
    this.changedItems = order.attributes.items.filter(function (item) {
      var catEntry = catalog.filter(function (cat) {
          return cat.id === item.catalogId;
      })[0];
      return (item.catalogPrice !== catEntry.attributes.price ||
             item.catalogQuantity !== catEntry.attributes.priceQuantity) && !item.isFreeItem;
    });
    for (var i=0;i<this.changedItems.length;i++) {
      var item = this.changedItems[i];
      var catEntry = catalog.filter(function (cat) {
        return cat.id === item.catalogId;
      })[0];
      var priceInclVat =  item.quantity * catEntry.attributes.price / catEntry.attributes.priceQuantity;
      if (order.attributes.isBusinessEvent) {
        item.newPrice = priceInclVat / (1 + order.attributes.vatRate);
      } else {
        item.newPrice = priceInclVat;
      }
    }

    this.done = function () {
      var isChanged = false;
      for (var i=0;i<this.changedItems.length;i++) {
        var item = this.changedItems[i];
        if (item.isChangePrice) {
          var catEntry = catalog.filter(function (cat) {
            return cat.id === item.catalogId;
          })[0];
          item.price = item.newPrice;
          item.catalogPrice = catEntry.attributes.price;
          item.catalogQuantity = catEntry.attributes.priceQuantity;
          if (order.attributes.isBusinessEvent) {
            item.priceInclVat = item.price * (1 + order.attributes.vatRate);
            item.priceBeforeVat = item.price;
          } else {
            item.priceInclVat = item.price;
            item.priceBeforeVat = item.price / (1 + order.attributes.vatRate);
          }
          item.isChanged = true;
          isChanged = true;
        }
      }
      $modalInstance.close(isChanged);
    };

    this.cancel = function () {
      $modalInstance.dismiss();
    }
  })

.controller('SendMailCtrl', function ($modalInstance, api, lov, order, bids, bidTextTypes) {
    var that = this;
    this.order = order;
    this.bids = bids;
    this.bidTextTypes = bidTextTypes;
    this.documentTypes = lov.documentTypes;
    api.queryCustomers(order.attributes.customer)
      .then(function (custs) {
        that.customer = custs[0].attributes;
        if (order.attributes.contact) {
          api.queryCustomers(order.attributes.contact)
            .then(function (conts) {
              that.contact = conts[0].attributes
            })
        }
      });

    this.setText = function () {
      this.mailText = this.mailTextType.mailText;
    };

    this.isShowDocument = function (doc) {
      return lov.documentTypes[doc.attributes.documentType].isRealDocumentType
    };

    this.doSend = function () {
      // real stuff here
      $modalInstance.close();
    };

    this.cancel = function () {
      $modalInstance.dismiss();
    }
});

