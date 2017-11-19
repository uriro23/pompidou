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
                                        pdfService, gmailClientLowLevel, $scope, $filter) {
    var that = this;
    this.order = order;
    this.bids = bids;
    this.attachmentType = 'link';
    // reset isInclude checkbox from previous sends
    for (var i = 0; i < this.bids.length; i++) {
      bids[i].isInclude = false;
    }
    this.bidTextTypes = bidTextTypes;
    this.documentTypes = lov.documentTypes;
    this.mail = {
      to: '',
      cc: '',
      subject: 'אירוע פומפידו בתאריך '+ $filter('date')(order.attributes.eventDate,'dd/MM/yyyy'),
      text: ''
    };
    this.msg = '';
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
      this.msg = this.mailTextType.mailText;
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
      var bidCnt = 0;
      var pdfSource = [];
      var baseUrl = $location.absUrl();
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim isFromNew flag
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim orderId
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim state name ('editOrder')
      var msgText = this.msg;

      bids.forEach(function(bid) {
        if (bid.isInclude) {
          that.mail.attachedBids.push({    // this is the original bid object without the content of the order
            uuid: bid.attributes.uuid,
            desc: bid.attributes.desc,
            documentType: bid.attributes.documentType,
            orderId: bid.attributes.orderId,
            date: bid.attributes.date,
            customer: bid.attributes.customer
          });
          bidCnt++;
        }
      });
      if (this.attachmentType==='link') {
       msgText += '<br/><br/><span>קישורים למסמכים:</span><br/>';
        this.mail.attachedBids.forEach(function(bid) {
          msgText += '<span>';
          msgText += (bid.desc + ' </span>');
          if (bid.documentType === 4 || bid.documentType === 2) {
            msgText += '<a href="' + baseUrl + '/quote/' + bid.uuid + '">הצגה</a><span>  <span>';
            msgText += '<a href="' + baseUrl + '/quotePrint/' + bid.uuid + '">הדפסה</a>';
          } else {
            msgText += '<a href="' + baseUrl + '/bid/' + bid.uuid + '">הצגה</a><span>  <span>';
            msgText += '<a href="' + baseUrl + '/bidPrint/' + bid.uuid + '">הדפסה</a>';
          }
          msgText += '<br/>';
          console.log(msgText);
        });
      } else {    // pdf
        pdfSource = this.mail.attachedBids.map(function (bid) {
          var url = (bid.documentType===4 || bid.documentType === 2)
            ? baseUrl + '/quote/' + bid.uuid : baseUrl + '/bid/' + bid.uuid;
          return {url: url, fileName: bid.desc+'.pdf'}
        });
      }
      pdfService.getPdfCollection(pdfSource, true)
        .then(function(pdfResult) {
          that.mail.attachments = pdfResult;
          that.mail.text = '<div dir="rtl">' + msgText + '</div>';
          console.log(that.mail.text);
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
              newMail.attributes.attachmentType = that.attachmentType;
              newMail.attributes.attachments = that.mail.attachedBids;
              api.saveObj(newMail)
                .then(function (mail) {
                  var activity = {
                    date: new Date(),
                    text: 'נשלח דואל עם ' + bidCnt + ' הצעות מחיר',
                    mail: mail.id
                  };
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

