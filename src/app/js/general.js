'use strict';

angular.module('myApp')
  .controller('GeneralCtrl', function ($scope, $state, $modal, api, orderService) {

    // references to members of parent order controller
    //objects
    this.order = $scope.orderModel.order;
    this.readOnly = $scope.orderModel.readOnly;
    this.user = $scope.orderModel.user;

    this.orderChanged = function (field) {
      orderService.orderChanged(this.order,field)
    };


    this.applyCoupon = function () {
      var that = this;
      var applyCouponModal = $modal.open({
        templateUrl: 'app/partials/order/applyCoupon.html',
        controller: 'ApplyCouponCtrl as applyCouponModel',
        resolve: {
          order: function () {
            return that.order;
          },
          config: ['configPromise', function (configPromise) {
            return configPromise;
          }]
        },
        size: 'lg'
      });

      applyCouponModal.result.then(function (save) {
        if (save) {
          if (that.order.properties.quotes) {  // recalc total for all quotes
            that.order.properties.quotes.forEach(function(quote) {
              orderService.calcTotal(quote,that.order);
            })
          }
          orderService.orderChanged(that.order,'couponApplied');
        }
      })

    };

    this.setBusinessEvent = function () {
      var that = this;
      var thisOrder = this.order.properties;

      thisOrder.quotes.forEach(function(quote) {
        quote.items.forEach(function(item) {
          item.price = thisOrder.isBusinessEvent ? item.priceBeforeVat : item.priceInclVat;
        });
        orderService.calcTotal(quote,that.order);
      });
      orderService.orderChanged(this.order,'isBusinessEvent');
    };

    this.setWholesaleEvent = function () {
      var that = this;
      var thisOrder = this.order.properties;

      if (thisOrder.isWholesaleEvent) {
        // use this opportunity to copy wholesalePrice from catalog to all items of order
        // first create array of all item catalog ids in order
        var itemIds = [];
        thisOrder.quotes.forEach(function (quote) {
          quote.items.forEach(function (item) {
            var temp = itemIds.filter(function (id) {
              return id === item.catalogId;
            });
            if (!temp.length) {
              itemIds.push(item.catalogId);
            }
          });
        });

        // now fetch relevant catalog items
        api.queryCatalogByIds(itemIds)
            .then(function (catalogItems) {
              thisOrder.quotes.forEach(function (quote) {
                quote.items.forEach(function (item) {
                  var catalogItem = catalogItems.filter(function (cat) {
                    return cat.id === item.catalogId;
                  })[0];
                  item.catalogWholesalePrice = catalogItem.properties.wholesalePrice;
                  // now update prices to wholesale if given
                  orderService.calcItemPrice(item,that.order);
                });
                orderService.calcTotal(quote, that.order);
              });
              orderService.orderChanged(that.order,'isWholesaleEvent');
            });
      } else {
        thisOrder.quotes.forEach(function (quote) {
          quote.items.forEach(function (item) {
            orderService.calcItemPrice(item,that.order);
          });
          orderService.calcTotal(quote, that.order);
        });
        orderService.orderChanged(this.order,'isWholesaleEvent');
      }
    };


    this.resetColor = function() {
      api.unset(this.order,'color');
      this.order.view.color = undefined;
      orderService.orderChanged(this.order,'color');
    };

    this.setTemplate = function() {
      this.order.view.errors.noOfParticipants = orderService.checkParticipants(this.order);
      orderService.orderChanged(this.order,'template');
    };

    this.duplicateOrder = function () {
      $state.go('dupOrder',{basedOnId:this.order.id});
    };

    this.deleteOrder = function () {
      var that = this;
      if (this.user.attributes.isSalesPerson &&
        this.user.attributes.username !== this.order.properties.createdBy) {
        alert ('אינך יכול לבטל אירוע שלא אתה יצרת');
        return;
      }
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
                              history.back();
                            })
                        })
                    })
                });
            })
        }
      });
    };


  })

  .controller('BonusesCtrl', function ($scope, $state, orderService) {
    this.order = $scope.orderModel.order;
    this.employees = $scope.orderModel.employees;

    this.roleChanged = function(ind) {
      this.order.properties.empBonuses[ind].isChanged = true;
      orderService.orderChanged(this.order);
    };
  });
