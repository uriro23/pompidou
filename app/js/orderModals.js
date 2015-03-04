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

.controller('SendMailCtrl', function ($modalInstance, $location, api, lov, order, bids, bidTextTypes, gmailClientLowLevel, $scope) {
    var that = this;
    this.order = order;
    this.bids = bids;
    // reset isInclude checkbox from previous sends
    for (var i=0;i<this.bids.length;i++) {
      bids[i].isInclude = false;
    }
    this.bidTextTypes = bidTextTypes;
    this.documentTypes = lov.documentTypes;
    api.queryCustomers(order.attributes.customer)
      .then(function (custs) {
        that.customer = custs[0].attributes;
        if (that.customer.email) {
          that.mail.to = 'test.' + that.customer.email; //todo: for production drop the 'test'
        }
        if (order.attributes.contact) {
          api.queryCustomers(order.attributes.contact)
            .then(function (conts) {
              that.contact = conts[0].attributes;
              if (that.contact.email) {
                that.mail.cc = 'test.' + that.contact.email; //todo: for production drop the 'test'
              }
            })
        }
      });

    this.mail = {
      subject:  'אירוע פומפידו'
     };

    this.setText = function () {
      this.mail.text = this.mailTextType.mailText;
    };

    this.isShowDocument = function (doc) {
      return lov.documentTypes[doc.attributes.documentType].isRealDocumentType
    };

    $scope.editorOptions = {
      height: '150',
      removePlugins: 'elementspath'
    };

    this.doSend = function () {
      this.mail.attachments = [];
      var baseUrl = $location.absUrl();
      baseUrl = baseUrl.slice(0,baseUrl.lastIndexOf('/'));
      baseUrl = baseUrl.slice(0,baseUrl.lastIndexOf('/'));
      baseUrl = baseUrl+'/bid/';
      for (var i=0;i<this.bids.length;i++) {
        if (bids[i].isInclude) {
          this.mail.attachments.push(baseUrl+bids[i].attributes.uuid);
          this.mail.text += ('<a href="'+baseUrl+bids[i].attributes.uuid+'">'+bids[i].attributes.desc+'</a><br/>')
        }
      }
      gmailClientLowLevel.sendEmail(this.mail);

      $modalInstance.close();
    };

    this.cancel = function () {
      $modalInstance.dismiss();
    }
});

