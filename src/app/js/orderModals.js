'use strict';

angular.module('myApp')
  .controller('AckDelOrderCtrl', function ($modalInstance, order, dater) {
  this.order = order;
  this.currentCustomer = order.view.currentCustomer;
  this.days = parseInt((order.properties.eventDate - dater.today()) / (24 * 3600 * 1000));  // need parseInt because of DST difference
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
      return (item.catalogPrice !== catEntry.properties.price ||
        item.catalogQuantity !== catEntry.properties.priceQuantity);
    });
    this.changedItems.forEach(function (item) {
      var catEntry = catalog.filter(function (cat) {
        return cat.id === item.catalogId;
      })[0];
      var priceInclVat = item.quantity * catEntry.properties.price / catEntry.properties.priceQuantity;
      if (order.properties.isBusinessEvent) {
        item.newPrice = priceInclVat / (1 + order.properties.vatRate);
      } else {
        item.newPrice = priceInclVat;
      }
    });

    this.setChangeAll = function() {
      var that = this;
      this.changedItems.forEach(function(item) {
        item.isChangePrice = that.isChangeAll;
      });
    };

    this.done = function () {
      var isChanged = false;
      for (var i = 0; i < this.changedItems.length; i++) {
        var item = this.changedItems[i];
        if (item.isChangePrice) {
          var catEntry = catalog.filter(function (cat) {
            return cat.id === item.catalogId;
          })[0];
          item.price = item.newPrice;
          item.catalogPrice = catEntry.properties.price;
          item.catalogQuantity = catEntry.properties.priceQuantity;
          if (order.properties.isBusinessEvent) {
            item.priceInclVat = item.price * (1 + order.properties.vatRate);
            item.priceBeforeVat = item.price;
          } else {
            item.priceInclVat = item.price;
            item.priceBeforeVat = item.price / (1 + order.properties.vatRate);
          }
          item.isForcedPrice = false;
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


  .controller('SendMailCtrl', function ($modalInstance, $location, api, orderService, lov,
                                        order, bids, bidTextTypes, user,
                                        pdfService, gmailClientLowLevel, $scope, $filter, $q) {
    var that = this;
    this.order = order;
    this.bids = bids;
    this.attachmentType = 'pdf';
    // reset isInclude checkbox from previous sends
    for (var i = 0; i < this.bids.length; i++) {
      bids[i].isInclude = false;
    }
    this.bidTextTypes = bidTextTypes;
    this.documentTypes = lov.documentTypes;
    this.mail = {
      from: user.attributes.email,
      to: '',
      cc: '',
      subject: 'אירוע השף בקופסה בתאריך '+ $filter('date')(order.properties.eventDate,'dd/MM/yyyy'),
      text: ''
    };
    this.msg = '';
    api.queryCustomers(order.properties.customer)
      .then(function (custs) {
        that.customer = custs[0].properties;
        if (that.customer.email) {
          that.mail.to = that.customer.email;
          if (api.getEnvironment() === 'test') {
            that.mail.to = 'test.' + that.mail.to
          }
        }
        if (order.properties.contact) {
          api.queryCustomers(order.properties.contact)
            .then(function (conts) {
              that.contact = conts[0].properties;
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
      return lov.documentTypes[doc.properties.documentType].isRealDocumentType
    };

    $scope.editorOptions = {
      height: '150',
      removePlugins: 'elementspath'
    };

    this.doEmail = function (op) {
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
            uuid: bid.properties.uuid,
            desc: bid.properties.desc,
            documentType: bid.properties.documentType,
            orderId: bid.properties.orderId,
            date: bid.properties.date,
            customer: bid.properties.customer
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
          } else  if (bid.documentType === 1) {
            msgText += '<a href="' + baseUrl + '/bid/' + bid.uuid + '">הצגה</a><span>  <span>';
            msgText += '<a href="' + baseUrl + '/bidPrint/' + bid.uuid + '">הדפסה</a>';
          } else { // assume documentType === 5
            msgText += '<a href="' + baseUrl + '/quote2/' + bid.uuid + '">הצגה</a><span>  <span>';
            msgText += '<a href="' + baseUrl + '/quote2Print/' + bid.uuid + '">הדפסה</a>';
          }
        })
        msgText += '<br/>';
      } else {    // pdf
        pdfSource = this.mail.attachedBids.map(function (bid) {
          var url = (bid.documentType===4 || bid.documentType === 2)
            ? baseUrl + '/quote/' + bid.uuid : (bid.documentType === 1)
              ? baseUrl + '/bid/' + bid.uuid : baseUrl + '/quote2/' + bid.uuid;
          return {url: url, fileName: bid.desc+'.pdf', documentType: bid.documentType};
        });
      }
      pdfService.getPdfCollection(pdfSource, true)
        .then(function(pdfResult) {
            that.mail.attachments = pdfResult;
            that.mail.text = '<div dir="rtl">' + msgText + '</div>';
            gmailClientLowLevel.doEmail(op,that.mail)
              .then(function () {
                  var newMail = api.initMail();
                  newMail.properties.orderId = order.id;
                  newMail.properties.date = new Date();
                  newMail.properties.customer = that.customer;
                  newMail.properties.contact = that.contact;
                  newMail.properties.to = that.mail.to;
                  newMail.properties.cc = that.mail.cc;
                  newMail.properties.subject = that.mail.subject;
                  newMail.properties.text = that.mail.text;
                  newMail.properties.attachmentType = that.attachmentType;
                  newMail.properties.attachments = that.mail.attachedBids;
                  api.saveObj(newMail)
                    .then(function (mail) {
                      var activity = {
                        date: new Date(),
                        text: 'נשלח דואל עם ' + bidCnt + ' הצעות מחיר',
                        mail: mail.id
                      };
                      order.properties.activities.splice(0, 0, activity);
                      if (typeof order.properties.mailCount === 'undefined') {
                        order.properties.mailCount = 1;  // this is needed for tasks
                      } else {
                        order.properties.mailCount++;
                      }
                      orderService.checkTasks(order);
                      orderService.saveOrder(order);
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
          },
          function(error) {
            console.log(error);
            alert(error);
          });

      $modalInstance.close();
    };

    this.cancel = function () {
      $modalInstance.dismiss();
    };

    function transformRequest (req)  {
      return req;
    }


    this.getWhatsAppUrl = function () {
      var waUrl = "https://wa.me/";
      var waPhone = this.customer ? "972" + this.customer.mobilePhone.slice(1) : "";
      waUrl += waPhone;
      waUrl += "?text=";
      var waText = encodeURI(this.msg);
      waUrl += waText;
      console.log("url="+waUrl);
      return waUrl;
    }

  })
  .controller('SendWhatsAppCtrl', function ($modalInstance, $location, api, orderService, lov,
                                        order, bids, bidTextTypes, user,
                                        pdfService, gmailClientLowLevel, $scope, $filter, $q) {
    var that = this;
    this.order = order;
    this.bids = bids;
    // reset isInclude checkbox from previous sends
    bids.forEach(function(bid) {
      bid.isInclude = false;
    })
    this.bidTextTypes = bidTextTypes;
    this.documentTypes = lov.documentTypes;
    this.msg = '';
    api.queryCustomers(order.properties.customer)
      .then(function (custs) {
        that.customer = custs[0].properties;
        that.phone = that.customer.mobilePhone;
      });

    this.setText = function () {
      this.msg = this.mailTextType.whatsAppText;
    };

    this.isShowDocument = function (doc) {
      return lov.documentTypes[doc.properties.documentType].isRealDocumentType
    };

    this.getWhatsAppUrl = function (op) {
      var that = this;
      this.attachedBids = [];
      var bidCnt = 0;
      var baseUrl = $location.absUrl();
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim isFromNew flag
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim orderId
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim state name ('editOrder')
      var waUrl = "https://wa.me/";
      if (this.phone) {
        waUrl += ("972" + this.phone.slice(1));
      }
      waUrl += "?text=";
      var msgText = this.msg;

      bids.forEach(function(bid) {
        if (bid.isInclude) {
          that.attachedBids.push({    // this is the original bid object without the content of the order
            uuid: bid.properties.uuid,
            desc: bid.properties.desc,
            documentType: bid.properties.documentType,
            orderId: bid.properties.orderId,
            date: bid.properties.date,
            customer: bid.properties.customer
          });
          bidCnt++;
        }
      });
      msgText += ' ';
        this.attachedBids.forEach(function(bid) {
         // msgText += (bid.desc + ' ');
          if (bid.documentType === 4 || bid.documentType === 2) {
            msgText += (baseUrl + '/quote/' + bid.uuid + ' ')
          } else  if (bid.documentType === 1) {
            msgText += (baseUrl + '/bid/' + bid.uuid + ' ')
          } else { // assume documentType === 5
            msgText += (baseUrl + '/quote2/' + bid.uuid + ' ')
          }
        })
      var res = encodeURI(waUrl+msgText);
        var i = res.indexOf('#');
        while (i>-1) {
          res = res.slice(0,i).concat('%23',res.slice(i+1));
          i = res.indexOf('#');
        }
      console.log(res);
      return res;
      }

      // $modalInstance.close();


    this.cancel = function () {
      $modalInstance.dismiss();
    };

  })

  .controller('SendEquipMailCtrl', function ($modalInstance, $location, api, orderService, lov,
                                             order, user, config,
                                             gmailClientLowLevel, $scope, $filter) {
    var that = this;
    this.order = order;
    this.documentTypes = lov.documentTypes;
    this.mail = {
      from: user.attributes.email,
      to: config.equipRentalMail,
      cc: '',
      subject: 'הזמנת ציוד לאירוע השף בקופסה בתאריך '+ $filter('date')(order.properties.eventDate,'dd/MM/yyyy'),
      text: '',
      attachments: []
    };
    this.msg = "<p>שלום</p><p>מבקש הצעת מחיר עבור השכרת ציוד לאירוע כמפורט ברשימה להלן.</p>" +
      "<p><span>האירוע יתקיים בתאריך </span><span></span>" + order.properties.eventDate.toLocaleDateString('en-IL') +
      "</span><span>&nbsp;</span><span>במיקום</span><span>&nbsp</span><span>" +
      (order.properties.taskData.address?order.properties.taskData.address:"לא ידוע") + "</span></p>" +
      "<p>בברכה</p><p>יובל</p><p>טל' 054-7514061</p>";
    this.table = renderEquipTable(order);


    this.setText = function () {
      this.msg = this.mailTextType.mailText;
    };

    $scope.editorOptions = {
      height: '150',
      removePlugins: 'elementspath'
    };

    function renderEquipTable (ord) {
      var table = "<p></p><table><thead><tr><th><label>פריט</label></th><th><label>כמות</label></th></tr></thead><tbody>";
      var items = ord.properties.quotes[ord.properties.activeQuote].items;
      var equipRentalItems = items.filter(function (item) {
        return (item.category.type === 5 && item.specialType === 2);  // equip rentals
      });
      if (equipRentalItems.length === 0) {
        alert('אין השכרת ציוד באירוע זה');
        return "<p>אין הזמנת ציוד באירוע זה</p>";
      }
      equipRentalItems.forEach(function(item) {
        table += "<tr><td>";
        table += item.productDescription;
        table += "</td><td>";
        table += item.quantity;
        table += "</td></tr>";
      });
      table += "<tr><td></td><td></td></tr><tr><td></td><td></td></tr></tbody></table>";
      return table;
    }

    this.doEmail = function (op) {
      var that = this;
      var msgText = this.msg + this.table;


      that.mail.text = '<div dir="rtl">' + msgText + '</div>';
      gmailClientLowLevel.doEmail(op,that.mail)
        .then(function () {
            var activity = {
              date: new Date(),
              text: 'נשלח מייל לספק ציוד להשכרה',
            };
            order.properties.activities.splice(0, 0, activity);
            orderService.saveOrder(order);
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

      $modalInstance.close();
    };

    this.cancel = function () {
      $modalInstance.dismiss();
    };


  })

  .controller('SendFeedbackMailCtrl', function ($modalInstance, $location, $q,
                                             api, orderService, lov, dater,
                                             order, customer, user, config,
                                             gmailClientLowLevel, $scope, $filter) {
    var that = this;
    this.order = order;
    this.customer = customer;
    this.documentTypes = lov.documentTypes;
    this.isSendCoupon = true;  // default value
    this.mail = {
      from: user.attributes.email,
      to: customer.email ? customer.email : '', // stam
      cc: '',
      subject: 'נשמח לקבל ממך משוב על האירוע שלך',
      text: '',
      attachments: []
    };
    if (api.getEnvironment() === 'test') {
      this.mail.to = 'test.' + that.mail.to
    }


    this.msg = "><p>שלום</p>" +
      "<p>תודה שבחרת בשף בקופסה לאירוע החשוב שלך. אנו מוקירים כל לקוח ולקוחה, וחשוב לנו שתמיד תהיו מרוצים. כחלק מהשאיפה שלנו למצויינות ולשיפור תמידי, אבקש ממך להקדיש מספר דקות למילוי המשוב הקצר כאן.</p>" +
     "<p>בתודה מראש,</p><p>יובל רוזנן, השף בקופסה</p><p>טל' 054-7514061</p>";


    this.setText = function () {
      this.msg = this.mailTextType.mailText;
    };

    $scope.editorOptions = {
      height: '150',
      removePlugins: 'elementspath'
    };

    this.generateCouponAndEmail = function (op) {
      var that = this;
      if (this.order.properties.couponIssuedType &&
        this.order.properties.couponIssuedType !== config.couponType) {
        alert ('נשלח לאירוע כבר משוב עם קופון מסוג אחר. לא ניתן לשלוח שוב');
        return;
      }
      if (!this.isSendCoupon || this.order.properties.couponIssued) {
        this.doEmail(op); // send w/o coupon or with previous coupon
        return;
      }
      var coupon = Math.floor(Math.random()*899999 + 100000); // range 100000 - 999999
      api.queryOrdersByCouponIssued(coupon,['number']) // check if exists
        .then (function(res1) {
          if (res1.length) {  // exists - retry
            that.generateCouponAndEmail(op);
          } else {
            that.order.properties.couponIssued = coupon;
            that.order.properties.couponIssuedType = config.couponType;
            var expiery = angular.copy(dater.today());
            expiery.setMonth(expiery.getMonth()+6);
            that.order.properties.couponExpiryDate = expiery;
            that.doEmail(op); // changes in order will be saved by doEmail
          }
        })
    }

    this.doEmail = function (op) {
      var that = this;
      var couponStr = this.order.properties.couponIssued.toString().replace(/(\d{3})(\d{3})/,'$1-$2');
       //  var form = 'https://form.jotform.com/211281742689058';  // without coupon
        var form = 'https://form.jotform.com/212334723271448';
        form += ('?input25=' + (this.customer ? (this.customer.firstName + ' ' + this.customer.lastName) : '<אין לקוח>'));
        form += ('&email=' + this.customer.email);
        form += ('&input26[day]=' + this.order.properties.eventDate.getDate());
        form += ('&input26[month]=' + (this.order.properties.eventDate.getMonth() + 1));
        form += ('&input26[year]=' + this.order.properties.eventDate.getFullYear());
        form += ('&input27=' + (this.isPremiumDelivery ? 'כן' : 'לא'));
        form += ('&input28=' + (this.isWaiters ? 'כן' : 'לא'));
        form += ('&input29=' + (this.isExternalDelivery ? 'כן' : 'לא'));
        form += ('&input30=' + (this.isSentFeedbackMail ? 'כן' : 'לא'));
        form += ('&input48=' + (this.isSendCoupon ? 'כן' : 'לא'));
        form += ('&coupon=' + couponStr);
        form += ('&couponexpirydate[day]=' + this.order.properties.couponExpiryDate.getDate());
        form += ('&couponexpirydate[month]=' + (this.order.properties.couponExpiryDate.getMonth() + 1));
        form += ('&couponexpirydate[year]=' + this.order.properties.couponExpiryDate.getFullYear());
        console.log(form);
        var link = '<a href="' + encodeURI(form) +
          '">כאן</a>';
        var beforeLink = "<p>שלום</p>" +
          "<p>תודה שבחרת בשף בקופסה לאירוע החשוב שלך. אנו מוקירים כל לקוח ולקוחה, וחשוב לנו שתמיד תהיו מרוצים. כחלק מהשאיפה שלנו למצויינות ולשיפור תמידי, אבקש ממך להקדיש מספר דקות למילוי המשוב הקצר ";
        var afterLink = "</p><p>בתודה מראש,</p><p>יובל רוזנן, השף בקופסה</p><p>טל' 054-7514061</p>";
        that.mail.text = '<div dir="rtl">' + beforeLink + link + afterLink + '</div>';

        gmailClientLowLevel.doEmail(op, that.mail)
          .then(function () {
              var activity = {
                date: new Date(),
                text: 'נשלח מייל בקשת משוב',
              };
              order.properties.activities.splice(0, 0, activity);
              orderService.saveOrder(order);
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

        $modalInstance.close();
    };

    this.cancel = function () {
      $modalInstance.dismiss();
    };


  })

  .controller('ShowMailCtrl', function ($modalInstance, mail) {
    this.mail = mail;

    this.close = function () {
      $modalInstance.close();
    }

  })

  .controller('CancelReasonCtrl', function ($modalInstance, order, cancelReasons) {
    this.cancelReasons = cancelReasons;
    if (order.properties.cancelReason) {
      this.cancelReason = cancelReasons.filter(function (cr) {
        return cr.tId === order.properties.cancelReason;
      })[0];
    }
    this.cancelReasonText = order.properties.cancelReasonText;

    this.save = function () {
      var res = {
        cancelReason: this.cancelReason ? this.cancelReason.tId : undefined,
        cancelReasonText: this.cancelReasonText
      };
      $modalInstance.close(res);
    };
  })

  .controller('QuoteWarningsCtrl', function ($modalInstance, warnings) {
    this.warnings = warnings;

    this.ignore = function () {
      $modalInstance.close(true);
    };

    this.cancel = function () {
      $modalInstance.close(false);
    };

  })

  .controller('ApplyCouponCtrl', function ($modalInstance, order, config, api, dater) {



    this.checkCoupon = function() {
      var that = this;
      this.isValid = false;
      this.errors = [];
      var fields = ['number','eventDate','customer','couponIssued','couponExpiryDate','couponIssuedType'];
      if (typeof this.couponApplied !== 'number' ||
                this.couponApplied < 100000 || this.couponApplied > 999999) {
        alert ('מספר הקופון צ"ל בן 6 ספרות');
        return;
      }
      this.loadCouponInfo();
     }

    this.changeCoupon = function() {
      this.isCouponApplied = false;
    }

    this.loadCouponInfo = function () {
      var that = this;
      this.isValid = false;
      this.errors = [];
      this.isReferringCustomer = false;
      var fields = ['number','eventDate','customer','couponIssued','couponExpiryDate','couponIssuedType'];
      api.queryOrdersByCouponIssued(this.couponApplied,fields)
        .then(function(ords) {
          if (ords.length === 0) {
            alert('מספר קופון לא קיים');
          } else {
            var issuingOrder = ords[0];
            that.couponAppliedType = issuingOrder.properties.couponIssuedType;
            if (issuingOrder.properties.couponExpiryDate < dater.today()) {
              that.errors.push('קופון פג תוקף בתאריך '+issuingOrder.properties.couponExpiryDate.toString());
            }
            api.queryOrdersByCouponApplied(that.couponApplied,fields)
              .then(function(ords2) {
                if (ords2.length > 0) {
                  that.errors.push('הקופון נוצל כבר '+ords2.length+' פעמים');
                }
                that.isChecked = true;
                if (that.errors.length === 0) {
                  that.isValid = true;
                }
                if (issuingOrder.properties.customer && order.properties.customer &&
                  (issuingOrder.properties.customer !== order.properties.customer)) {
                  that.isReferringCustomer = true;
                  api.queryCustomers(issuingOrder.properties.customer)
                    .then(function(cust) {
                      that.referringCustomer = {
                        firstName: cust[0].properties.firstName,
                        lastName: cust[0].properties.lastName,
                        phone: cust[0].properties.mobilePhone ? cust[0].properties.mobilePhone :
                          cust[0].properties.homePhone ? cust[0].properties.homePhone :
                            cust[0].properties.workPhone,
                        email: cust[0].properties.email
                      };
                    });
                }
              });
          }
        });
    }

    this.save = function () {
      order.properties.couponApplied = this.couponApplied;
      order.properties.couponAppliedType = this.couponAppliedType;
      $modalInstance.close(true);
    };

    this.cancel = function () {
      $modalInstance.close(false);
    };

    // main block

    this.isChecked = false;
    this.couponApplied = order.properties.couponApplied;
    if (this.couponApplied) {
      this.isCouponApplied = true;
      this.loadCouponInfo();
    }

  })

  .controller('EditTextCtrl', function ($modalInstance, text, title) {
    this.text = text;
    this.title = title;

  this.save = function () {
    $modalInstance.close(this.text);
  };

  this.cancel = function () {
    $modalInstance.close(false);
  };
});

