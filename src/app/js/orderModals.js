'use strict';

angular.module('myApp')
  .controller('AckDelOrderCtrl', function ($modalInstance, order, today) {
  this.order = order;
  this.currentCustomer = order.view.currentCustomer;
  this.days = parseInt((order.attributes.eventDate - today) / (24 * 3600 * 1000));  // need parseInt because of DST difference
  this.daysDirection = 'בעוד';
  if (this.days < 0) {
    this.days = -this.days;
    this.daysDirection = 'לפני';
  }

  this.setYes = function () {
    $modalInstance.close(true);
  };

  this.setNo = function () {
    $modalInstance.close(false);
  };
})

  .controller('VatChangeCtrl', function ($modalInstance, orderVat, currentVat) {
    this.orderVat = orderVat;
    this.currentVat = currentVat;
    this.action = 0;

    this.done = function () {
      $modalInstance.close(this.action);
    }
  })

  .controller('UpdatePricesCtrl', function ($modalInstance, order, catalog) {
    var that = this;
    this.changedItems = order.view.quote.items.filter(function (item) {
      var catEntry = catalog.filter(function (cat) {
        return cat.id === item.catalogId;
      })[0];
      return (item.catalogPrice !== catEntry.attributes.price ||
        item.catalogQuantity !== catEntry.attributes.priceQuantity) && !item.isFreeItem;
    });
    for (var i = 0; i < this.changedItems.length; i++) {
      var item = this.changedItems[i];
      var catEntry = catalog.filter(function (cat) {
        return cat.id === item.catalogId;
      })[0];
      var priceInclVat = item.quantity * catEntry.attributes.price / catEntry.attributes.priceQuantity;
      if (order.attributes.isBusinessEvent) {
        item.newPrice = priceInclVat / (1 + order.attributes.vatRate);
      } else {
        item.newPrice = priceInclVat;
      }
    }

    this.done = function () {
      var isChanged = false;
      for (var i = 0; i < this.changedItems.length; i++) {
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

  .controller('SendMailCtrl', function ($modalInstance, $location, api, orderService, lov, order, bids, bidTextTypes,
                                        pdfService, gmailClientLowLevel, $scope) {
    var that = this;
    this.order = order;
    this.bids = bids;
    // reset isInclude checkbox from previous sends
    for (var i = 0; i < this.bids.length; i++) {
      bids[i].isInclude = false;
    }
    this.bidTextTypes = bidTextTypes;
    this.documentTypes = lov.documentTypes;
    this.mail = {
      to: '',
      cc: '',
      subject: 'אירוע פומפידו',
      text: ''
    };
    api.queryCustomers(order.attributes.customer)
      .then(function (custs) {
        that.customer = custs[0].attributes;
        if (that.customer.email) {
          that.mail.to = that.customer.email;
          if (api.getEnvironment() === 'test') {
            that.mail.to = 'test.' + that.mail.to
          }
        }
        if (order.attributes.contact) {
          api.queryCustomers(order.attributes.contact)
            .then(function (conts) {
              that.contact = conts[0].attributes;
              if (that.contact.email) {
                that.mail.cc = that.contact.email;
                if (api.getEnvironment() === 'test') {
                  that.mail.cc = 'test.' + that.mail.cc
                }
              }
            })
        }
      });


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
      var that = this;
      this.mail.attachedBids = [];
      var baseUrl = $location.absUrl();
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim orderId
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim state name ('editOrder')
      //     baseUrl = baseUrl+'/bid/';
      this.mail.text += '<br/><br/><span>קישורים למסמכים:</span><br/>';
      var bidCnt = 0;
      var orderCnt = 0;
      for (var i = 0; i < this.bids.length; i++) {
        if (bids[i].isInclude) {
          this.mail.attachedBids.push({    // this is the original bid object without the content of the order
            uuid: bids[i].attributes.uuid,
            desc: bids[i].attributes.desc,
            documentType: bids[i].attributes.documentType,
            orderId: bids[i].attributes.orderId,
            date: bids[i].attributes.date,
            customer: bids[i].attributes.customer
          });
//          this.mail.text += ('<a href="'+baseUrl+bids[i].attributes.uuid+'">');
          this.mail.text += '<span>';
          if (bids[i].attributes.documentType === 1 || bids[i].attributes.documentType === 4) {
            this.mail.text += 'הצעת מחיר: ';
            bidCnt++;
          } else {
            this.mail.text += 'הזמנה: ';
            orderCnt++;
          }
          this.mail.text += (bids[i].attributes.desc + ' </span>');
          if (bids[i].attributes.documentType === 4) {
            this.mail.text += '<a href="' + baseUrl + '/quote/' + bids[i].attributes.uuid + '">הצגה</a><span>  <span>';
            this.mail.text += '<a href="' + baseUrl + '/quotePrint/' + bids[i].attributes.uuid + '">הדפסה</a>';
          } else {
            this.mail.text += '<a href="' + baseUrl + '/bid/' + bids[i].attributes.uuid + '">הצגה</a><span>  <span>';
            this.mail.text += '<a href="' + baseUrl + '/bidPrint/' + bids[i].attributes.uuid + '">הדפסה</a>';
          }
          this.mail.text += '<br/>';
        }
      }
      this.mail.text = '<div dir="rtl">' + this.mail.text + '</div>';
      var pdfSource = this.mail.attachedBids.map(function(bid) {
        return {url: 'http://pompidou.rosenan.net/#' + '/bidPrint/' + bid.uuid, fileName: bid.desc}
      });
      pdfService.getPdfCollection(pdfSource, true)
        .then(function(pdfResult) {
          that.mail.attachments = pdfResult;
          gmailClientLowLevel.sendEmail(that.mail)
            .then(function () {
              var newMail = api.initMail();
              newMail.attributes.orderId = order.id;
              newMail.attributes.date = new Date();
              newMail.attributes.customer = that.customer;
              newMail.attributes.contact = that.contact;
              newMail.attributes.to = that.mail.to;
              newMail.attributes.cc = that.mail.cc;
              newMail.attributes.subject = that.mail.subject;
              newMail.attributes.text = that.mail.text;
              newMail.attributes.attachments = that.mail.attachedBids;
              api.saveObj(newMail)
                .then(function (mail) {
                  var activity = {
                    date: new Date(),
                    text: 'נשלח דואל עם ',
                    mail: mail.id
                  };
                  if (bidCnt) {
                    activity.text += (bidCnt + ' הצעות מחיר ')
                  }
                  if (orderCnt) {
                    activity.text += (orderCnt + ' הזמנות')
                  }
                  order.attributes.activities.splice(0, 0, activity);
                  orderService.setupOrderHeader(order.attributes);
                  api.saveObj(order);
                });
            },
            function (error) {
              console.log(error);
              var errText = 'send email error:\r\n';
              if (error.result) {
                if (error.result.error) {
                  errText += error.result.error.message
                }
              }
              alert(errText);
            }
          );
        });

      $modalInstance.close();
    };

    this.cancel = function () {
      $modalInstance.dismiss();
    }
  })
  .controller('ShowMailCtrl', function ($modalInstance, mail) {
    console.log(mail);
    this.mail = mail;

    this.close = function () {
      $modalInstance.close();
    }

  })

.controller('EditTextCtrl', function ($modalInstance, text, title) {
    this.text = text;
    this.title = title;

  this.update = function () {
    $modalInstance.close(this.text);
  };

  this.cancel = function () {
    $modalInstance.close(false);
  };
});

