'use strict';

angular.module('myApp')
  .controller('DocumentsCtrl', function ($scope, $modal, $filter, $location,
                                         api, orderService, accountingService,
                                         secrets, lov) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.bidTextTypes = $scope.orderModel.bidTextTypes;
    this.orderStatuses = $scope.orderModel.orderStatuses; // needed for setupOrderView
    this.user = $scope.orderModel.user;
    this.isProd = $scope.orderModel.isProd;
    this.descChangeActions = $scope.orderModel.descChangeActions;
    this.config = $scope.orderModel.config;

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
      that.bids = bids.map (function (bid) {
        bid.downloadUrl = that.downloadBid(bid);
        return bid;
      });
      that.isBidsLoading = false;
    });


    this.orderChanged = function (field) {
      orderService.orderChanged(this.order,field);
    };

    this.setOrderDocTextType = function () {
      this.order.properties.orderDocTextTypes = angular.copy(this.bidTextTypes.filter(function (t) {
        return t.isInclude;
      }));
      orderService.orderChanged(this.order,'orderTextType');
    };

    function createBidForQuote (quote, docType, bidDesc) {
      var bid = api.initBid();
      bid.properties.version = lov.version;
      bid.properties.documentType = docType;
      bid.properties.menuType = quote.menuType;
      bid.properties.orderId = that.order.id;
      bid.properties.date = new Date();
      bid.properties.order = that.order.properties;
      bid.properties.total = that.total;
      bid.properties.customer = that.order.view.customer;
      if (docType === 0) {  // backup
        bid.properties.desc = bidDesc;
      } else {
        bid.properties.desc = bidDesc + ' ' + quote.title;
      }
      bid.properties.uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }); // source: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
      // we generate a date string for eventDate and eventTime so PDF generation will have correct date and time
      var ed = that.order.properties.eventDate;
      if (ed) {
        bid.properties.eventDateStr = ed.getDate() + '/' + (ed.getMonth() + 1) + '/' + ed.getFullYear();
      }
      var et = that.order.properties.eventTime;
      if (et) {
        bid.properties.eventTimeStr = et.getHours() + ':' + et.getMinutes();
      }
      return bid;
    }

    this.findWarnings = function (quote) {
      var warnings = [];
      var seq = 0;
      // warning I: missing transportation item
      var isTransportation = false;
      quote.items.forEach(function(item) {
        if (item.category.type === 3) {
          isTransportation = true;
        }
      });
      if (!isTransportation && !this.order.properties.taskData.isSelfDelivery) {
        warnings.push({
          id: quote.menuType.tId * 1000 + seq++,
          type: 1,
          menuType: quote.menuType,
          text: 'חסר פריט משלוח'
        })
      }
      // warning II: Saturday event w/o price increase
      if (this.order.properties.eventDate.getDay() === 6) {// event on Saturday
        var isPriceIncrease = false;
        quote.items.forEach(function(item) {
          if (item.category.type === 4) {
            isPriceIncrease = true;
          }
        });
        if (!isPriceIncrease) {
          warnings.push({
            id: quote.menuType.tId * 1000 + seq++,
            type: 2,
            menuType: quote.menuType,
            text: 'חסר פריט תוספת שבת וחג'
          })
        }
      }
      // warning III: Equipment rental w/o rental transportation item
      var isRenatl = false;
      var isRentalTransportation = false;
      quote.items.forEach(function(item) {
        if (item.category.type === 5 && item.specialType === 2) {  // equip rental
          isRenatl = true;
          if (item.catalogId === that.config.rentalTransportationItem) {
            isRentalTransportation = true;
          }
        }
      });
      if (isRenatl && !isRentalTransportation) {
        warnings.push({
          id: quote.menuType.tId * 1000 + seq++,
          type: 3,
          menuType: quote.menuType,
          text: 'חסר פריט הובלת השכרת ציוד'
        })
      }
      return warnings;
    }

    this.createBid = function (docType,bidToRestore) {
      if (this.order.view.isChanged) {
        return;
      }

      var that = this;
      var bids = [];
      var warnings = [];
      if (docType === 0 || docType === 2 || this.isOnlyActiveQuote) { // if creating backup or order doc, pick active quote only
        warnings = warnings.concat(this.findWarnings(this.order.view.quote));
        bids.push(createBidForQuote(this.order.view.quote, docType, this.bidDesc));
      } else {
        this.order.properties.quotes.forEach(function (quote) {
          if (quote.items.length) { // skip empty quotes
            warnings = warnings.concat(that.findWarnings(quote));
            bids.push(createBidForQuote(quote, docType, that.bidDesc));
          }
        });
      }
      this.bidDesc = '';
      this.isOnlyActiveQuote = false;

      if (warnings.length) {
        var quoteWarningsModal = $modal.open({
          templateUrl: 'app/partials/order/quoteWarnings.html',
          controller: 'QuoteWarningsCtrl as quoteWarningsModel',
          resolve: {
            warnings: function () {
              return warnings;
            }
          },
          size: 'sm'
        });

        quoteWarningsModal.result.then(function (isIgnore) {
          if (isIgnore) {
            that.saveBids(bids,docType,bidToRestore);
          }
        })
      } else {
        that.saveBids(bids,docType,bidToRestore);
      }
    };

  this.saveBids = function (bids,docType,bidToRestore) {
    if (docType === 0) {    // restore
      that.order.properties = bidToRestore.properties.order;
      that.setupOrderView();
      orderService.setupOrderHeader(that.order.properties);
      api.saveObj(that.order)
        .then(function () {
          api.queryOrder(that.order.id)   // requery order to get new update timestamp
            .then(function(ord) {
              //that.order.updatedAt = ord[0].updatedAt;
              alert('האירוע שוחזר לגרסה ' + bidToRestore.properties.desc + ' מתאריך ' +
                $filter('date')(bidToRestore.properties.date, 'dd/MM/yyyy HH:mm'))
            });
        })
    }
    return api.saveObjects(bids)
        .then(function () {
         that.isBidsLoading = true;
         return api.queryBidsByOrder(that.order.id)  // requery bids for view
            .then(function (bids) {
              that.bids = bids.map (function (bid) {
                bid.downloadUrl = that.downloadBid(bid);
                return bid;
              });
              that.isBidsLoading = false;
           })
        })
    };

    this.restoreBid = function (bid) {
      var that = this;
      if (this.order.view.isChanged) {
        return;
      }
      this.bidDesc = 'גיבוי לפני שחזור לתאריך ' + $filter('date')(bid.properties.date, 'dd/MM/yyyy HH:mm');
      this.createBid(0,bid);
    };

    this.delBid = function (bid) {
      var that = this;
      return api.deleteObj(bid)
        .then(function () {
          that.isBidsLoading = true;
          return api.queryBidsByOrder(that.order.id)
            .then(function (bids) {
              that.bids = bids.map (function (bid) {
                bid.downloadUrl = that.downloadBid(bid);
                return bid;
              });
              that.isBidsLoading = false;
            })
        })
    };

    this.downloadBid = function (bid) {
      var serviceUrl = 'https://v2.convertapi.com/web/to/pdf?Secret='+secrets.prod.web2pdfSecret;
      var baseUrl = $location.absUrl();
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim isFromNew flag
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim orderId
      baseUrl = baseUrl.slice(0, baseUrl.lastIndexOf('/')); // trim state name ('editOrder')

      var sourceUrl = (bid.properties.documentType===4 || bid.properties.documentType === 2)
          ? baseUrl + '/quote/' + bid.properties.uuid : (bid.properties.documentType === 1)
          ? baseUrl + '/bid/' + bid.properties.uuid : baseUrl + '/quote2/' + bid.properties.uuid;
      var encodedSource = encodeURIComponent(sourceUrl);
      var params = "download=attachment&ConversionDelay=7&" +
        "MarginBottom=5&MarginTop=5&MarginLeft=5&MarginRight=5&PageSize=a4" +
        "&FileName=" +
        encodeURIComponent("הצעת מחיר " +
        bid.properties.customer.firstName + " " +
        bid.properties.customer.lastName + " " +
        (bid.properties.eventDateStr ?
          (bid.properties.eventDateStr.replace('/','-').replace('/','-')) :
          "") + " " + bid.properties.desc);
      var payload = "&url="+encodedSource+"&"+params;
      var url = serviceUrl+payload;
      return (url);
    };


    this.sendMail = function () {
      var that = this;
      if (this.user.attributes.isSalesPerson &&
        this.user.attributes.username !== this.order.properties.createdBy) {
        alert ('אינך יכול לשלוח מייל באירוע שלא יצרת');
        return;
      }
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
          },
          user: function () {
            return that.user;
          }
        },
        size: 'lg'
      });

      sendMailModal.result.then(function () {
      });


    };

    this.sendWhatsApp = function () {
      var that = this;
      if (this.user.attributes.isSalesPerson &&
        this.user.attributes.username !== this.order.properties.createdBy) {
        alert ('אינך יכול לשלוח הודעה באירוע שלא יצרת');
        return;
      }
      var sendWhatsAppModal = $modal.open({
        templateUrl: 'app/partials/order/sendWhatsApp.html',
        controller: 'SendWhatsAppCtrl as sendWhatsAppModel',
        resolve: {
          order: function () {
            return that.order;
          },
          bids: function () {
            return that.bids;
          },
          bidTextTypes: function () {
            return that.bidTextTypes;
          },
          user: function () {
            return that.user;
          }
        },
        size: 'lg'
      });

      sendWhatsAppModal.result.then(function () {
      });


    };

    this.sendEquipMail = function () {
      var that = this;
      if (this.user.attributes.isSalesPerson) {
        alert ('אינך יכול לשלוח הזמנת ציוד');
        return;
      }
      var sendEquipMailModal = $modal.open({
        templateUrl: 'app/partials/order/sendEquipMail.html',
        controller: 'SendEquipMailCtrl as sendEquipMailModel',
        resolve: {
          order: function () {
            return that.order;
          },
            user: function () {
            return that.user;
          },
          config: ['configPromise', function (configPromise) {
            return configPromise;
          }]
        },
        size: 'lg'
      });

      sendEquipMailModal.result.then(function () {
      });


    };

    this.sendFeedbackMail = function () {
      var that = this;
      if (this.user.attributes.isSalesPerson) {
        alert ('אינך יכול לשלוח בקשת משוב');
        return;
      }
      var sendFeedbackMailModal = $modal.open({
        templateUrl: 'app/partials/order/sendFeedbackMail.html',
        controller: 'SendFeedbackMailCtrl as sendFeedbackMailModel',
        resolve: {
          order: function () {
            return that.order;
          },
          customer: ['api', function (api) {
            if (that.order.properties.customer) {
              return api.queryCustomers(that.order.properties.customer).then(function (objs) {
                return objs[0].properties;
              })
            } else {
              return null;
            }
          }],
          user: function () {
            return that.user;
          },
          config: ['configPromise', function (configPromise) {
            return configPromise;
          }]
        },
        size: 'lg'
      });

      sendFeedbackMailModal.result.then(function () {
      });


    };

    this.createAccountingOrder = function() {
      accountingService.documentTypes(false);
      //accountingService.createOrder(this.isProd, this.order);
      //alert('הזמנה מספר 1234 נוצרה');
    };


  });
