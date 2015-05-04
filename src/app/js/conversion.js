'use strict';
//TODO: calculate totals for invoice
/* Controllers */
angular.module('myApp')
  .controller('ConversionCtrl', function($state,
                                         $rootScope,
                                         api,
                                         lov,
                                         config,
                                         measurementUnits,
                                         categories,
                                         accessCatalog,
                                         accessCustomers,
                                         accessOrders) {

      $rootScope.menuStatus = 'show';
      var user = api.getCurrentUser();
      if (user) {
        $rootScope.username = user.attributes.username;
      } else {
        $state.go('login');
      }
      $rootScope.title = lov.company + ' - הסבה';

    console.log('loaded '+ accessCatalog.length + ' catalog items');
    console.log('loaded '+ accessCustomers.length + ' customers');
    console.log('loaded '+ accessOrders.length + ' orders');


//  find customers without orders
    var customersWithoutOrders = 0;
    console.log('customers without orders:');
    for (var i=0;i<accessCustomers.length;i++) {
      accessCustomers[i].view = {};
      accessCustomers[i].view.orderCount = 0;
      for (var j=0;j<accessOrders.length;j++) {
        if (accessOrders[j].Customer === accessCustomers[i].CustomerId) {
          accessCustomers[i].view.orderCount++;
        }
      }
      if (accessCustomers[i].view.orderCount===0) {
        console.log(accessCustomers[i]);
        customersWithoutOrders++;
      }
    }
    console.log(customersWithoutOrders + ' customers without orders');

    // find duplicate customers by exact email
    var dupEmails = 0;
    for (i=0;i<accessCustomers.length;i++) {
      for (j=0;j<i;j++) {
        if (accessCustomers[i].Email && accessCustomers[i].Email !== 'test' &&
          accessCustomers[j].Email && accessCustomers[j].Email !== 'test' &&
          accessCustomers[i].view.orderCount && accessCustomers[j].view.orderCount &&
          accessCustomers[i].Email=== accessCustomers[j].Email) {
          console.log('dup email:');
          console.log(accessCustomers[i]);
          console.log(accessCustomers[j]);
          dupEmails++;
        }
      }
    }
    console.log('total ' + dupEmails + ' dup emails');

    // find duplicate customers by exact mobile
    var dupMobiles = 0;
    for (i=0;i<accessCustomers.length;i++) {
      for (j=0;j<i;j++) {
        if (accessCustomers[i].CellPhone && accessCustomers[j].CellPhone &&
          accessCustomers[i].view.orderCount && accessCustomers[j].view.orderCount &&
          accessCustomers[i].CellPhone=== accessCustomers[j].CellPhone) {
          console.log('dup mobile:');
          console.log(accessCustomers[i]);
          console.log(accessCustomers[j]);
          dupMobiles++;
        }
      }
    }
    console.log('total ' + dupMobiles + ' dup mobiles');

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
        api.saveObj(config);   // save with updated item ids for boxItem etc.
        console.log('saving config');
        console.log(config.attributes);
        return;
      }

      that.counter = i+1;
      var catalogItem = api.initCatalog();
      catalogItem.attributes.domain = Number(accessCatalog[i].Domain);
      catalogItem.attributes.accessKey = Number(accessCatalog[i].ItemId);
      catalogItem.attributes.category = Number(accessCatalog[i].Category);
      if (catalogItem.attributes.category === 2 ||
          catalogItem.attributes.category === 3 ||
          catalogItem.attributes.category === 11 ) {
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
      if (catalogItem.attributes.domain===1) {
        catalogItem.attributes.shortDescription = catalogItem.attributes.productDescription; // for printed menu
        catalogItem.attributes.isInMenu = true;
      }
         api.queryAccessComponents(accessCatalog[i].ItemId)
          .then (function(comps) {
          catalogItem.attributes.exitList = comps.map(function (comp) {
            return {item: comp.attributes.CompName};
          })
          api.queryAccessCatalogSubitems(accessCatalog[i].ItemId)
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
            api.saveObj(catalogItem)
              . then (function (obj) {
              idMap[obj.attributes.accessKey] = obj.id;
              if (obj.attributes.accessKey===lov.accessBoxItemId) {
                console.log('found boxItem id '+ obj.id)
                config.attributes.boxItem = obj.id;
              }
              if (obj.attributes.accessKey===lov.accessUnhandledItemComponent) {
                console.log('found unhandledItemComponent id '+ obj.id)
                config.attributes.unhandledItemComponent = obj.id;
              }
              if (obj.attributes.accessKey===lov.accessUnhandledItemMaterial) {
                console.log('found unhandledItemMaterial id '+ obj.id)
                config.attributes.unhandledItemMaterial = obj.id;
              }
              cvCatalog(i+1)
            });
          })
        })
    };

    this.convertCustomers = function() {
      this.isCancel = false;
      that.total = accessCustomers.length;
      cvCustomer(0,this.isSkipEmptyCustomers);
    };

    var cvCustomer = function (i,isSkipEmptyCustomers) {
      if (i>=accessCustomers.length || that.isCancel) {
        return;
      }

      if (isSkipEmptyCustomers && !accessCustomers[i].view.orderCount) { // skip customer without orders
        cvCustomer(i+1,isSkipEmptyCustomers);
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
          cvCustomer(i+1,isSkipEmptyCustomers);
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
        order.attributes.eventTime.setHours(order.attributes.eventTime.getHours()-2); // adjust timezone
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
      order.attributes.orderStatus = Number(accessOrders[i].OrderStatus)>1?  // make room for new value 2
          Number(accessOrders[i].OrderStatus)+1 : Number(accessOrders[i].OrderStatus);
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
      if (accessOrders[i].Total) {
        order.attributes.total = Number(accessOrders[i].Total);
      } else {
        order.attributes.Total = 0;
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
            if (!that.catalogIdMap[accessItems[k].attributes.ItemId]) {
              console.log('missing catalog entry for item '+
                          accessItems[k].attributes.ItemId+
                          ' in order '+
                          order.attributes.number);
            } else {
              var newItem = {};
              newItem.index = order.attributes.items.length; // make unique key for item - catalogId is not unique
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
              newItem.shortDescription = newItem.productDescription;
              newItem.isInMenu = true;
              if (accessItems[k].attributes.Quantity) {
                newItem.quantity = Number(accessItems[k].attributes.Quantity);
              } else {
                newItem.quantity = 0;
              }
              if (accessItems[k].attributes.Price) {
                newItem.price = Number(accessItems[k].attributes.Price);
              } else {
                newItem.price = 0;
              }
              if (order.attributes.isBusinessEvent) {
                newItem.priceInclVat = newItem.price * (1 + order.attributes.vatRate);
                newItem.priceBeforeVat = newItem.price;
              } else {
                newItem.priceInclVat = newItem.price;
                newItem.priceBeforeVat = newItem.price / (1 + order.attributes.vatRate);
              }
              newItem.isFreeItem = Boolean(Number(accessItems[k].attributes.IsFreeItem));
              var ct = Number(accessItems[k].attributes.Category); // combine categories same as in catalog conversion
              if (ct === 2 || ct === 3 || ct === 11) {
                ct = 1;
              }
              newItem.category = categories.filter(function (cat) {
                return cat.tId === ct;
              })[0];
              newItem.measurementUnit = measurementUnits.filter(function (mes) {
                return mes.tId === that.catalogIdMap[accessItems[k].attributes.ItemId].measurementUnit;
              })[0];

              var catPrice = newItem.catalogPrice * newItem.quantity / newItem.catalogQuantity;
              if (Math.abs(catPrice - newItem.price) > 0.1) {  // if price changed, catalog price is not relevant for conversion
                newItem.catalogPrice = 0;
                newItem.catalogQuantity = 1;
                that.itemschangedPrice++;
              }
              newItem.errors = {}; // initialize errors object

              that.itemCount++;
              order.attributes.items.push(newItem);
            }
          }
        order.attributes.items.sort(function (a,b) {
          if (a.category.order > b.category.order) {
            return 1;
          } else if (a.category.order < b.category.order) {
            return -1
          } else if (a.productDescription > b.productDescription) {
            return 1
          } else return -1;
        });
        api.queryAccessOrderActivities(accessOrders[i].OrderId)
          .then (function (activities) {
            for (var l=0;l<activities.length;l++) {
              var newActivity = {};
              newActivity.date = new Date(activities[l].attributes.ActivityTime);
              newActivity.date.setSeconds(l); // make date unique in order
              newActivity.text = activities[l].attributes.ActivityText;
              order.attributes.activities.push(newActivity);
              that.activityCount++;
            }
            order.attributes.activities.sort(function (a,b) {
              return a.date> b.date?-1:1
            });
            api.saveObj(order)
              .then (function() {
              cvOrder(i+1);
            })
        })
      });
    };

    this.cancel = function() {
      this.isCancel = true;
    };

    this.updateLastOrder = function() {
      return api.queryOrderNum()
        .then (function(res) {
        res[0].attributes.lastOrder = that.maxOrderNum;
        return api.saveObj(res[0])
      })
    };

  }
);