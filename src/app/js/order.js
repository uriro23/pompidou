'use strict';

/* Controllers */
angular.module('myApp')
  .controller('OrderCtrl', function (api, $state, $filter, $modal, $rootScope,
                                     currentOrder, bids, lov, today, eventTypes,
                                     bidTextTypes, categories, measurementUnits, discountCauses, config) {

    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }

    this.setReadOnly = function () {
      this.isReadOnly = this.order.attributes.eventDate &&
                        this.order.attributes.eventDate < today &&
                        !this.order.attributes.template;
    };

    this.calcTotal = function () {
      var thisOrder = this.order.attributes;

      var t = thisOrder.subTotal + thisOrder.discount + thisOrder.transportation + thisOrder.transportationBonus;
      if (thisOrder.isBusinessEvent) {
        var v = t * thisOrder.vatRate;
      } else {
        v = 0;
      }
      thisOrder.total = Math.round(t + v);
      if (thisOrder.isBusinessEvent) {
        thisOrder.totalBeforeVat = thisOrder.total / (1 + thisOrder.vatRate);
      } else {
        thisOrder.totalBeforeVat = thisOrder.total;
      }
      thisOrder.rounding = thisOrder.totalBeforeVat - t;
      thisOrder.vat = thisOrder.total - thisOrder.totalBeforeVat;

      // the following are for displaying vat in invoice even if non business event
      t = thisOrder.isFixedPrice ? thisOrder.fixedPrice : thisOrder.total;
      thisOrder.totalBeforeVatForInvoice = t / (1 + thisOrder.vatRate);
      thisOrder.vatForInvoice = thisOrder.totalBeforeVatForInvoice * thisOrder.vatRate;
    };

    this.calcSubTotal = function () {
      var thisOrder = this.order.attributes;

      var t = 0;
      var b = 0;
      var s = 0;
      for (i = 0; i < thisOrder.items.length; i++) {
        t += thisOrder.items[i].price;
        b += thisOrder.items[i].boxCount;
        s += thisOrder.items[i].satietyIndex;
      }
      thisOrder.subTotal = t;
      thisOrder.discount = -(t * thisOrder.discountRate / 100);
      thisOrder.boxEstimate = b;
      thisOrder.satietyIndex = s;
      this.calcTotal();
    };


    this.orderChanged = function (field) {
      this.order.view.isChanged = true;
      if (field) {
        this.order.view.changes[field] = true;
      }
      window.onbeforeunload = function () {   // force the user to comit or abort changes before moving
        return "יש שינויים שלא נשמרו"
      };
      window.onblur = function () {
        alert('יש שינויים שלא נשמרו')
      };
      $rootScope.menuStatus = 'empty';
    };

    // order header
    this.setCustomer = function (custType, custHeader) {  // custType: 1 = primary, 2 = secondary
      var that = this;

      var selectCustomer = $modal.open({
      templateUrl: 'app/partials/customer.html',
        controller: 'CustomerCtrl as customerModel',
        resolve: {
          customers: function (api) {
            return api.queryCustomers()
              .then(function (custs) {
              return custs;
            });
          },
          currentCustomerId: function () {
            if (custType === 1) {
              return that.order.view.customer.id;
            } else {
              return that.order.view.contact.id;
            }
          },
          modalHeader: function () {
            return custHeader;
          },
          isOptionalSelect: function () {
            return custType === 2; // for contact selection in modal is optional
          }
        },
        size: 'lg'
      });

      selectCustomer.result.then(function (cust) {
        if (custType === 1) {
          that.order.view.customer = cust;
          that.orderChanged('customer');
          that.order.view.errors.customer = false;
          that.getPrevOrders();
        } else if (custType === 2) {
          that.order.view.contact = cust;
          that.orderChanged('contact');
          that.order.view.errors.contact = false;
        } else {
          alert('error - bad customer type: ' + custType);
        }
      }), function () {
      };

    };

    this.setEventDate = function () {
      var thisOrder = this.order.attributes;
      this.orderChanged('header');
      this.order.view.errors.eventDate = !thisOrder.eventDate || thisOrder.eventDate < today;  // past dates not allowed
      this.setReadOnly();
    };

    this.setNoOfParticipants = function () {
      var thisOrder = this.order.attributes;
      this.orderChanged('header');
      this.order.view.errors.noOfParticipants = !Boolean(thisOrder.noOfParticipants) || thisOrder.noOfParticipants <= 0;
    };

    this.transformNewEventType = function (str) {
      var newEventType = {
        tId: 123,   // todo: max tId + 1
        label: str
      };
      console.log(newEventType);
      return newEventType
    };

    // general tab
    this.isShowTextType = function (textType) {
      return textType.documentType;
    };

    this.deleteOrder = function () {
      var that = this;
      var ackDelModal = $modal.open({
        templateUrl: 'app/partials/order/ackDelete.html',
        controller: 'AckDelOrderCtrl as ackDelOrderModel',
        resolve: {
          order: function () {
            return that.order;
          }
        },
        size: 'sm'
      });

      ackDelModal.result.then(function (isDelete) {
        if (isDelete) {
          api.deleteObj(that.order)
            .then(function () { // cascade delete to bids and mails
            api.queryBidsByOrder(that.order.id)
              .then(function (bids) {
                api.deleteObjects(bids)
                  .then(function () {
                    api.queryMailsByOrder(that.order.id)
                      .then(function (mails) {
                        api.deleteObjects(mails)
                          .then(function () {
                            $state.go('orderList');
                          })
                      })
                  })
              });
          })
        }
      });
    };

    // items tab

    this.calcItemsTabErrors = function () { // called upon tab deselection to determine if error dummy tab should be displayed
      outer_loop:
        for (i = 0; i < this.order.attributes.items.length; i++) {
          var thisItem = this.order.attributes.items[i];
          for (var fieldName in thisItem.errors) {
            if (thisItem.errors.hasOwnProperty(fieldName)) {
              if (thisItem.errors[fieldName]) {
                this.isErrorItemsTab = true;
                console.log('found error in field '+fieldName+' of item '+i);
                break outer_loop;
              }
            }
          }
        }
    };

    this.switchItemsTab = function () { // called upon dummy error Items tab selection, causes real tab to display
      this.isItemsTabActive = true;
      this.isErrorItemsTab = false;
    };



    // financial tab

    this.calcFinancialTabErrors = function () { // called upon tab deselection to determine if error dummy tab should be displayed
      this.isErrorFinancialTab =  this.order.view.errors.discountRate ||
                                  this.order.view.errors.transportationInclVat ||
                                  this.order.view.errors.fixedPrice;
    };

    this.switchFinancialTab = function () { // called upon dummy error financial tab selection, causes real tab to display
      this.isFinancialTabActive = true;
      this.isErrorFinancialTab = false;
    };


    // activities tab
    // --------------

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

    // Documents tab
    // -------------

    this.setOrderDocTextType = function () {
      this.order.attributes.orderDocTextTypes = angular.copy(this.bidTextTypes.filter(function (t) {
        return t.isInclude;
      }));
      this.orderChanged('orderTextType');
    };


    this.createBid = function (docType) {
      if (this.order.view.isChanged) {
        return;
      }
      this.bid = api.initBid();
      this.bid.attributes.documentType = docType;
      this.bid.attributes.orderId = this.order.id;
      this.bid.attributes.date = new Date();
      this.bid.attributes.order = this.order.attributes;
      this.bid.attributes.customer = this.order.view.customer;
      this.bid.attributes.desc = this.bidDesc;
      this.bid.attributes.uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      }); // source: http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
      this.bidDesc = null;
      var that = this;
      return api.saveObj(this.bid)
        .then(function () {
        return api.queryBidsByOrder(that.order.id)
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
            return bidTextTypes;
          }
        },
        size: 'lg'
      });

      sendMailModal.result.then(function () {
      });

    };

    // prev orders tab
    // ---------------

    this.getPrevOrders = function () {
      var that = this;
      if (this.order.view.customer.id) {
        api.queryOrdersByCustomer(this.order.view.customer.id)
          .then(function (orders) {
            that.prevOrders = orders.filter(function (ord) {
              return ord.id !== that.order.id;    // exclude current order
            })
          })
      }
    };

    this.getLastBid = function (order) {
      api.queryBidsByOrder(order.id)
        .then(function (bids) {
          if (bids.length > 0) {
            window.open("#/bid/" + bids[0].attributes.uuid, "_blank");
          } else {
            alert('אין הצעות מחיר לאירוע')
          }
        })

    };

    // common
    // ------

    this.saveOrder = function () {
      var thisOrder = this.order.attributes;

      // check for errors
      for (var fieldName in this.order.view.errors) {
        if (this.order.view.errors.hasOwnProperty(fieldName)) {
          if (this.order.view.errors[fieldName]) {
            alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
            return;
          }
        }
      }
      // check for errors in items
      for (i = 0; i < thisOrder.items.length; i++) {
        var thisItem = thisOrder.items[i];
        for (fieldName in thisItem.errors) {
          if (thisItem.errors.hasOwnProperty(fieldName)) {
            if (thisItem.errors[fieldName]) {
              alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
              return;
            }
          }
        }
      }

      if (this.order.view.eventType) {
        thisOrder.eventType = this.order.view.eventType.tId;
      }
      if (this.order.view.startBidTextType) {
        thisOrder.startBidTextType = this.order.view.startBidTextType.tId;
      }
      if (this.order.view.endBidTextType) {
        thisOrder.endBidTextType = this.order.view.endBidTextType.tId;
      }
      if (this.order.view.discountCause) {
        thisOrder.discountCause = this.order.view.discountCause.tId;
      }
      thisOrder.customer = this.order.view.customer.id;
      thisOrder.contact = this.order.view.contact.id;
      if (!thisOrder.contact) {   // if contact is changed to null, make sure it is deleted in parse. see api.saveObj
        if (this.order.delAttributes) {
          this.order.delAttributes.contact = true
        } else {
          this.order.delAttributes = {contact: true}
        }
      }
      thisOrder.orderStatus = this.order.view.orderStatus.id;

      // wipe errors and changes indication from items
      for (i = 0; i < thisOrder.items.length; i++) {
        thisOrder.items[i].errors = {};
        thisOrder.items[i].isChanged = false;
      }

      // sort items by category and productDescription
      thisOrder.items.sort(function (a, b) {
        if (a.category.order > b.category.order) {
          return 1;
        } else if (a.category.order < b.category.order) {
          return -1
        } else if (a.productDescription > b.productDescription) {
          return 1
        } else return -1;
      });

      //  if we save a new order for the first time we have to assign it an order number and bump the order number counter
      //  we do this in 4 steps by chaining 'then's
      if ($state.current.name === 'newOrder') {
        var that = this;
        //  I. query OrderNum class containing single counter object
        return api.queryOrderNum()
          //  II. bump counter and assign it to order
          .then(function (results) {
            that.order.attributes.number = results[0].attributes.lastOrder + 1;
            results[0].attributes.lastOrder = that.order.attributes.number;
            return api.saveObj(results[0]);
          })
          //  III. save order
          .then(function () {
          return api.saveObj(that.order);
        })
          //  IV. change state to editOrder
          .then(function (ord) {
          $state.go('editOrder', {id: ord.id});
        });
        // if not new order, just save it without waiting for resolve
      } else {
        api.saveObj(this.order);
      }
      //  backup order for future cancel
      this.order.view.isChanged = false;
      window.onbeforeunload = function () {
      };
      window.onblur = function () {
      };
      $rootScope.menuStatus = 'show';
      this.order.view.changes = {};
      this.backupOrderAttr = angular.copy(this.order.attributes);
    };


    this.setupOrderView = function () {
      this.order.view = {};
      this.order.view.errors = {};
      this.order.view.changes = {};
      if ($state.current.name === 'editOrder') {
        var that = this;
        api.queryCustomers(that.order.attributes.customer)
          .then(function (custs) {
          if (!custs.length) {
            alert('customer not found');
            console.log('customer not found');
            console.log(that.order.attributes.customer);
          }
          that.order.view.customer = custs[0].attributes;
          that.order.view.customer.id = custs[0].id;
          that.getPrevOrders();
        });
        if (that.order.attributes.contact) {
          api.queryCustomers(that.order.attributes.contact)
            .then(function (custs) {
            if (!custs.length) {
              alert('contact not found');
              console.log('contact not found');
              console.log(that.order.attributes.contact);
            }
            that.order.view.contact = custs[0].attributes;
            that.order.view.contact.id = custs[0].id;
          });
        } else {
          that.order.view.contact = {};
        }
        this.order.view.eventType = eventTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.eventType);
        })[0];
        this.order.view.startBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.startBidTextType);
        })[0];
        this.order.view.endBidTextType = bidTextTypes.filter(function (obj) {
          return (obj.tId === that.order.attributes.endBidTextType);
        })[0];
        this.order.view.orderStatus = this.orderStatuses.filter(function (obj) {
          return (obj.id === that.order.attributes.orderStatus);
        })[0];
        this.order.view.discountCause = discountCauses.filter(function (obj) {
          return (obj.tId === that.order.attributes.discountCause);
        })[0];
      } else {
        this.order.view.customer = {};
        this.order.view.contact = {};
        this.order.view.orderStatus = this.orderStatuses[0]; // set to "New"
        this.order.view.discountCause = this.discountCauses[0]; // set to "no"
        this.order.view.errors.eventDate = true; // empty event date is error
        this.order.view.errors.customer = true; // empty customer is error
        this.order.view.errors.noOfParticipants = true; // empty no of participants is error
        this.order.view.errors.transportationInclVat = true; // force it illegal on new Order
        this.isErrorFinancialTab =true; // cause dummy error financial tab to be displayed
      }
    };

    this.cancel = function () {
      window.onbeforeunload = function () {
      };
      window.onblur = function () {
      };
      $rootScope.menuStatus = 'show';
      this.order.attributes = angular.copy(this.backupOrderAttr);
      this.setupOrderView();
    };


    // main block
    var i;
    var that = this;
    this.isNewOrder = $state.current.name === 'newOrder'; // used for view heading
    this.bids = bids;
    this.eventTypes = eventTypes;
    this.bidTextTypes = bidTextTypes;
    this.orderStatuses = lov.orderStatuses;
    this.documentTypes = lov.documentTypes;
    this.categories = categories;
    this.measurementUnits = measurementUnits;
    this.discountCauses = discountCauses;
    this.config = config;
    this.vatRate = config[0].vatRate;
    this.activityDate = new Date();
    this.activityText = '';
    this.isItemsTabActive = true;

    if ($state.current.name === 'editOrder') {
      this.order = currentOrder;
      $rootScope.title = lov.company + ' - אירוע ' + this.order.attributes.number;

      this.setupOrderView();
      this.setReadOnly();

      // handle change of vat rate
      if (this.order.attributes.vatRate != this.vatRate && !this.isReadOnly) {
        var vatChangeModal = $modal.open({
          templateUrl: 'app/partials/order/vatChange.html',
          controller: 'VatChangeCtrl as vatChangeModel',
          resolve: {
            orderVat: function () {
              return that.order.attributes.vatRate;
            },
            currentVat: function () {
              return that.vatRate;
            }
          },
          size: 'sm'
        });

        vatChangeModal.result.then(function (res) {
          switch (res) {
            case '0':   // don't change vatRate
              break;
            case '1':   // change vatRate, don't change prices
              that.order.attributes.vatRate = that.vatRate;
              for (var i = 0; i < that.order.attributes.items.length; i++) {
                var it1 = that.order.attributes.items[i];
                it1.priceBeforeVat = it1.priceInclVat / (1 + that.vatRate);
                if (that.order.attributes.isBusinessEvent) {
                  it1.price = it1.priceBeforeVat;
                }
              }
              that.orderChanged('isBusinessEvent');
              that.calcSubTotal();
              break;
            case '2':   // change vatRate, change prices
              that.order.attributes.vatRate = that.vatRate;
              for (var j = 0; j < that.order.attributes.items.length; j++) {
                var it2 = that.order.attributes.items[j];
                it2.priceInclVat = it2.priceBeforeVat * (1 + that.vatRate);
                if (!that.order.attributes.isBusinessEvent) {
                  it2.price = it2.priceInclVat;
                }
              }
              that.orderChanged('isBusinessEvent');
              that.calcSubTotal();
              break;
          }
        });
      }
    } else { // new order
      $rootScope.title = lov.company + ' - אירוע חדש';
      this.order = api.initOrder();
      this.setupOrderView();
      // this.order.attributes.eventDate = today;
      this.order.attributes.includeRemarksInBid = false;
      this.order.attributes.items = [];
      this.order.attributes.vatRate = this.vatRate;
      this.order.attributes.subTotal = 0;
      this.order.attributes.discountRate = 0;
      this.order.attributes.discount = 0;
      this.order.attributes.transportationInclVat = ''; // force it illegal
      this.order.attributes.transportation = 0;
      this.order.attributes.transportationBonus = 0;
      this.order.attributes.activities = [];
      this.setReadOnly();
    }
    this.calcSubTotal();

    this.order.view.isChanged = false;
    window.onbeforeunload = function () {
    };
    window.onblur = function () {
    };
    $rootScope.menuStatus = 'show';
    this.backupOrderAttr = angular.copy(this.order.attributes);


  });




