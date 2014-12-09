'use strict';

/* Controllers */
angular.module('myApp')
  .controller('ConversionCtrl', function($state,
                                         api,
                                         lov,
                                         measurementUnits,
                                         categories,
                                         accessCatalog,
                                         accessCustomers,
                                         accessOrders) {

    console.log('loaded '+ accessCatalog.length + ' catalog items');
    console.log('loaded '+ accessCustomers.length + ' customers');
    console.log('loaded '+ accessOrders.length + ' orders');

    var idMap = []; // used to convert access catalog ids to parse ids for subitems (components)

    var that = this;

    var vatHistory = [
      {
        date: new Date('6/2/2013'), // american dates!!
        rate: 0.18
      },
      {
        date: new Date('9/1/2012'),
        rate: 0.17
      },
      {
        date: new Date('1/1/2010'),
        rate: 0.16
      }
    ];

    this.convertCatalog = function () {
      this.isCancel = false;
      that.total = accessCatalog.length;
      cvCatalog(0);
    };
    
    var cvCatalog = function (i) {
      if (i >= accessCatalog.length || that.isCancel) {
        return;
      }

      that.counter = i+1;
      var catalogItem = api.initCatalog();
      catalogItem.attributes.domain = Number(accessCatalog[i].Domain);
      catalogItem.attributes.accessKey = Number(accessCatalog[i].ItemId);
      catalogItem.attributes.category = Number(accessCatalog[i].Category);
      if (catalogItem.attributes.category === 2 ||
          catalogItem.attributes.category === 3 ||
          catalogItem.attributes.category === 11 ||
          catalogItem.attributes.category === 35) {
        catalogItem.attributes.category = 1;
      }
      catalogItem.attributes.productDescription = accessCatalog[i].ProductName;
      catalogItem.attributes.measurementUnit = Number(accessCatalog[i].MeasureUnit);
      if (accessCatalog[i].PriceQuantity) {
        catalogItem.attributes.priceQuantity = Number(accessCatalog[i].PriceQuantity);
      }
      if (accessCatalog[i].CatPrice) {
        catalogItem.attributes.price = Number(accessCatalog[i].CatPrice);
      }
      if (accessCatalog[i].ProductionQuantity) {
        catalogItem.attributes.productionQuantity = Number(accessCatalog[i].ProductionQuantity);
      }
        api.queryAccessComponents(accessCatalog[i].ItemId)
          .then (function(comps) {
          catalogItem.attributes.exitList = comps.map(function (comp) {
            return {item: comp.attributes.CompName};
          })
        })
          .then (function() {
            return api.queryAccessCatalogSubitems(accessCatalog[i].ItemId)
              .then (function (subs) {
                catalogItem.attributes.components = subs.map (function(sub) {
                  var c = {};
                  c.domain = Number(sub.attributes.ContainedDomain);
                  c.id = idMap[Number(sub.attributes.ContainedId)];
                  if (!c.id) {
                    console.log('--- No parse id for access key '+ sub.attributes.ContainedId + '. container is '+catalogItem.attributes.accessKey);
                  }
                  c.quantity = Number(sub.attributes.ContainedQuantity);
                  return c;
                }).filter (function(sub) {  // filter out some illegal items who have a bad contained id in access
                  return sub.id;
                })
            })
        })
          .then (function() {
            return api.saveObj(catalogItem)
          . then (function (obj) {
            idMap[obj.attributes.accessKey] = obj.id;
            cvCatalog(i+1)
            });
        })
    };

    this.convertCustomers = function() {
      this.isCancel = false;
      that.total = accessCustomers.length;
      cvCustomer(0);
    };

    var cvCustomer = function (i) {
      if (i>=accessCustomers.length || that.isCancel) {
        return;
      }

      that.counter = i+1;
      var customer = api.initCustomer();
      customer.attributes.accessKey = accessCustomers[i].CustomerId;
      customer.attributes.firstName = accessCustomers[i].FirstName;
      customer.attributes.lastName = accessCustomers[i].LastName;
      if (!accessCustomers[i].StreetAddress) {
        customer.attributes.address = accessCustomers[i].City;
      } else if (!accessCustomers[i].City) {
        customer.attributes.address = accessCustomers[i].StreetAddress
      } else {
        customer.attributes.address = accessCustomers[i].StreetAddress + ' ' + accessCustomers[i].City;
      }
      customer.attributes.mobilePhone = accessCustomers[i].CellPhone;
      customer.attributes.homePhone = accessCustomers[i].HomePhone;
      customer.attributes.workPhone = accessCustomers[i].WorkPhone;
      customer.attributes.email = accessCustomers[i].Email;

      api.saveObj(customer)
        .then (function() {
          cvCustomer(i+1);
      })
    };

    this.customerIdMap = [];
    this.catalogIdMap = [];
    this.maxOrderNum = 0;

    this.convertOrders = function() {
      this.isCancel = false;
      that.itemCount = 0; // check that all items have been handled
      that.itemschangedPrice = 0; // count items whose price has changed relative to catalog price
      that.activityCount = 0;
      that.total = accessOrders.length;
      // load customers and catalog for access id conversion
      return api.queryCustomers()
        .then (function(custs) {
          for (var j=0;j<custs.length;j++) {
            that.customerIdMap[custs[j].attributes.accessKey] = custs[j].id;
          }
        return api.queryCatalog(1)
          .then (function(cat) {
          for (var j=0;j<cat.length;j++) {
            that.catalogIdMap[cat[j].attributes.accessKey] = {
              id: cat[j].id,
              measurementUnit: cat[j].attributes.measurementUnit,
              quantity: cat[j].attributes.priceQuantity,
              price: cat[j].attributes.price
            };
          }
          cvOrder(0);
        })
      })


    };

    var cvOrder = function(i) {
      if (i>=accessOrders.length || that.isCancel) {
        console.log('itemCount: '+that.itemCount);
        console.log('items with changed catalog price: '+that.itemschangedPrice);
        console.log('activityCount: '+that.activityCount);
        return;
      }

      that.counter = i+1;
      var order = api.initOrder();
      order.attributes.customer = that.customerIdMap[Number(accessOrders[i].Customer)];
      order.attributes.deliveryLocation = accessOrders[i].DeliveryLocation;
      if (accessOrders[i].DiscountCause) {
        order.attributes.discountCause = Number(accessOrders[i].DiscountCause);
      }
      if (accessOrders[i].DiscountRate) {
        order.attributes.discountRate = Number(accessOrders[i].DiscountRate) * 100;
      } else {
        order.attributes.discountRate = 0;
      }
      if (accessOrders[i].ClosureText) {
        order.attributes.endBidTextType = Number(accessOrders[i].ClosureText);
      }
      order.attributes.eventDate = new Date(accessOrders[i].EventDate);
      if (accessOrders[i].DeliveryTime){
        order.attributes.eventTime = new Date(accessOrders[i].DeliveryTime);
      }
      order.attributes.eventType = Number(accessOrders[i].EventType);
      if (accessOrders[i].IncludeRemarksInBid) {
        order.attributes.includeRemarksInBid = Boolean(Number(accessOrders[i].IncludeRemarksInBid));
      }
      if (accessOrders[i].IsBusinessEvent) {
        order.attributes.isBusinessEvent = Boolean(Number(accessOrders[i].IsBusinessEvent));
      }
      if (accessOrders[i].IsTransportatinBonus) {
        order.attributes.isTransportationBonus = Boolean(Number(accessOrders[i].IsTransportatinBonus));
      }
      if (accessOrders[i].NoOfParticipants) {
        order.attributes.noOfParticipants = Number(accessOrders[i].NoOfParticipants);
      }
      order.attributes.number = Number(accessOrders[i].OrderId);
      order.attributes.orderStatus = Number(accessOrders[i].OrderStatus);
      order.attributes.remarks = accessOrders[i].Remarks;
      if (accessOrders[i].BidText) {
        order.attributes.startBidTextType = Number(accessOrders[i].BidText);
      }
      order.attributes.template = accessOrders[i].TemplateName;
      if (accessOrders[i].TransportationInclVAT) {
        order.attributes.transportationInclVat = Number(accessOrders[i].TransportationInclVAT);
      }
      if (accessOrders[i].VATRate) {
        order.attributes.vatRate = Number(accessOrders[i].VATRate);
      }
      if (!order.attributes.vatRate){  // in access non business events had zero vatRate so we insert the rate according to event date
        for (var j= 0;j<vatHistory.length;j++) {
          if (order.attributes.eventDate >= vatHistory[j].date) {
            order.attributes.vatRate = vatHistory[j].rate;
            break;
          }
        }
     }

      // computed fields
      if (accessOrders[i].Discount) {
        order.attributes.discount = -Number(accessOrders[i].Discount);
      } else {
        order.attributes.discount = 0;
      }
      if (accessOrders[i].Rounding) {
        order.attributes.rounding = Number(accessOrders[i].Rounding);
      } else {
        order.attributes.rounding = 0;
      }
      if (accessOrders[i].Subtotal) {
        order.attributes.subTotal = Number(accessOrders[i].Subtotal);
      } else {
        order.attributes.subTotal = 0;
      }
      if (accessOrders[i].total) {
        order.attributes.total = Number(accessOrders[i].total);
      } else {
        order.attributes.total = 0;
      }
      if (accessOrders[i].TotalBeforeVAT) {
        order.attributes.totalBeforeVat = Number(accessOrders[i].TotalBeforeVAT);
      } else {
        order.attributes.totalBeforeVat = 0;
      }
      if (accessOrders[i].Transportation) {
        order.attributes.transportation = Number(accessOrders[i].Transportation);
      } else {
        order.attributes.transportation = 0;
      }
      if (accessOrders[i].TransportationBonus) {
        order.attributes.transportationBonus = Number(accessOrders[i].TransportationBonus);
      } else {
        order.attributes.transportationBonus = 0;
      }
      if (accessOrders[i].VAT) {
        order.attributes.vat = Number(accessOrders[i].VAT);
      } else {
        order.attributes.vat = 0;
      }

      order.attributes.items = [];
      order.attributes.activities = [];

      if (order.attributes.number > that.maxOrderNum) {
        that.maxOrderNum = order.attributes.number;
      }

      api.queryAccessOrderItems(accessOrders[i].OrderId)
        .then (function (accessItems) {
          for (var k=0;k<accessItems.length;k++) {
            var newItem = {};
            newItem.catalogId = that.catalogIdMap[accessItems[k].attributes.ItemId].id;
            if (that.catalogIdMap[accessItems[k].attributes.ItemId].quantity) {
              newItem.catalogQuantity = that.catalogIdMap[accessItems[k].attributes.ItemId].quantity;
            } else {
              newItem.catalogQuantity = 0;
            }
            if (that.catalogIdMap[accessItems[k].attributes.ItemId].price) {
              newItem.catalogPrice = that.catalogIdMap[accessItems[k].attributes.ItemId].price;
            } else {
              newItem.catalogPrice = 0;
            }
            newItem.productDescription = accessItems[k].attributes.ItemDescription;
            if (accessItems[k].attributes.Quantity) {
              newItem.quantity = Number(accessItems[k].attributes.Quantity);
            } else {
              newItem.quantity = 0;
            }
            if(accessItems[k].attributes.Price) {
              newItem.price = Number(accessItems[k].attributes.Price);
            } else {
              newItem.price = 0 ;
            }
            if (order.attributes.isBusinessEvent) {
              newItem.priceInclVat = newItem.price * (1+order.attributes.vatRate);
              newItem.priceBeforeVat = newItem.price;
            } else {
              newItem.priceInclVat = newItem.price;
              newItem.priceBeforeVat = newItem.price / (1+order.attributes.vatRate);
            }
            newItem.isFreeItem = Boolean(Number(accessItems[k].attributes.IsFreeItem));
            var ct = Number(accessItems[k].attributes.Category); // combine categories same as in catalog conversion
            if (ct === 2 ||
              ct === 3 ||
              ct === 11 ||
              ct === 35) {
              ct = 1;
            }
            newItem.category = categories.filter(function (cat) {
              return cat.tId === ct;
            })[0];
            newItem.measurementUnit = measurementUnits.filter(function (mes) {
              return mes.tId === that.catalogIdMap[accessItems[k].attributes.ItemId].measurementUnit;
            })[0];

            var catPrice = newItem.catalogPrice * newItem.quantity / newItem.catalogQuantity;
            if (Math.abs(catPrice - newItem.price)> 0.1) {  // if price changed, catalog price is not relevant for conversion
              newItem.catalogPrice = 0;
              newItem.catalogQuantity = 0;
              that.itemschangedPrice++;
            }

              that.itemCount++;
              order.attributes.items.push(newItem);
          }
        api.queryAccessOrderActivities(accessOrders[i].OrderId)
          .then (function (activities) {
            for (var l=0;l<activities.length;l++) {
              var newActivity = {};
              newActivity.date = new Date(activities[l].attributes.ActivityTime);
              newActivity.text = activities[l].attributes.ActivityText;
              order.attributes.activities.push(newActivity);
              console.log(newActivity);
              that.activityCount++;
            }
            api.saveObj(order)
              .then (function() {
              cvOrder(i+1);
            })
        })
      });
    };

    this.cancel = function() {
      this.isCancel = true;
    }

    this.updateLastOrder = function() {
      return api.queryOrderNum()
        .then (function(res) {
        res[0].attributes.lastOrder = that.maxOrderNum;
        return api.saveObj(res[0])
      })
    }
  }
);
