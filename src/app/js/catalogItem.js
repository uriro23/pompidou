'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogItemCtrl', function ($state, $modal, $rootScope, $scope, api, lov,
                                           currentItem, currentDomain, currentCategory,
                                           allCategories, productNames,measurementUnits,
                                           sensitivities, config) {

    var model = this;
    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.get('username');
    } else {
      $state.go('login');
    }

    model.user = user;

    model.setChanged = function (bool) {
      if (bool) {
        model.item.isChanged = true;
        window.onbeforeunload = function () {   // force the user to commit or abort changes before moving
          return 'יש שינויים שלא נשמרו';
        };
        /*
        window.onblur = function () {
          alert('יש שינויים שלא נשמרו')
        };
        */
        $rootScope.menuStatus = 'empty';
      } else {
        model.item.isChanged = false;
        window.onbeforeunload = function () {
        };
        window.onblur = function () {
        };
        $rootScope.menuStatus = 'show';
      }
    };

    function isNameInUse (productName,id) {
      var res = false;
      productNames.forEach(function(name) {
        if (name.name === productName && name.id !== id && !name.isDeleted) {
          res = true;
        }
      });
      return res;
    }

   // Main Tab

    model.setProductName = function () {
       model.item.errors.productName =
        !model.item.properties.productName || model.item.properties.productName.length === 0;
      if (!model.item.errors.productName) {
        if (isNameInUse(model.item.properties.productName,model.item.id)) {
          model.item.errors.productName = 'dup';
        }
      }
       model.setChanged(true);
    };

    model.setProductDescription = function () {
      model.item.errors.productDescription =
        !model.item.properties.productDescription || model.item.properties.productDescription.length === 0;
      if (model.currentDomain.id === 1 && model.item.isCopyToShortDesc) {
        model.item.properties.shortDescription = model.item.properties.productDescription;
      }
      model.setChanged(true);
    };

    model.setShortDescription = function () {
      model.item.isCopyToShortDesc =
        model.item.properties.productDescription === model.item.properties.shortDescription;
      model.setChanged(true);
    };

    model.setMeasurementUnit = function () {
      model.item.view.prodMeasurementUnit = model.item.view.measurementUnit;
      model.item.properties.muFactor = 1;
      model.setChanged(true);
    };

    model.setProdMeasurementUnit = function () {
      if (model.item.view.prodMeasurementUnit.tId === model.item.view.measurementUnit.tId) {
        model.item.properties.muFactor = 1;
      }
      model.setChanged(true);
    };

    model.setMuFactor = function () {
      model.item.errors.muFactor =
        (model.currentDomain.id === 1 || Boolean(model.item.properties.muFactor)) &&
        ((model.item.properties.muFactor != Number(model.item.properties.muFactor) ||
          Number(model.item.properties.muFactor) <= 0));
      model.setChanged(true);
    };

    model.setPriceQuantity = function () {
      model.item.errors.priceQuantity =
        (model.currentDomain.id === 1 || Boolean(model.item.properties.priceQuantity)) &&
        ((model.item.properties.priceQuantity != Number(model.item.properties.priceQuantity) ||
          Number(model.item.properties.priceQuantity) <= 0));
      model.setChanged(true);
    };

    model.setPrice = function () {
      model.item.errors.price =
        (model.currentDomain.id === 1 || Boolean(model.item.properties.price)) &&
        ((model.item.properties.price != Number(model.item.properties.price) ||
        Number(model.item.properties.price) <= 0));
      model.setChanged(true);
    };

    model.setProductionQuantity = function () {
      model.item.errors.productionQuantity =
        model.item.properties.productionQuantity != Number(model.item.properties.productionQuantity) ||
        Number(model.item.properties.productionQuantity) <= 0;
       model.setChanged(true);
    };

    model.setMinTime = function (ind) {
      model.item.errors.minTime =
        model.item.properties.minTime != Number(model.item.properties.minTime) ||
        Number(model.item.properties.minTime) < 0;
      model.setChanged(true);
    };

    model.setMaxTime = function (ind) {
      model.item.errors.maxTime =
        model.item.properties.maxTime != Number(model.item.properties.maxTime) ||
        Number(model.item.properties.maxTime) < 0;
      model.setChanged(true);
    };

    // Exit List Tab

    model.addExitListItem = function () {
      model.item.properties.exitList.push({
        item: '',
        measurementUnit: measurementUnits[0]
      });
      model.setChanged(true);
    };

    model.delExitListItem = function (ind) {
      model.item.properties.exitList.splice(ind, 1);
      model.setChanged(true);
    };

    // Components Tab

   model.setCompCategory = function(comDomain) {
    api.queryCatalogByCategory(comDomain.currentCategory.tId)
      .then(function(res) {
        comDomain.categoryItems = res.filter(function(itm) {
          return !itm.properties.isDeleted;
        }).map(function(itm) {
          itm.view = {};
          itm.view.compQuantity = null;
          itm.view.category = comDomain.currentCategory;
          itm.view.measurementUnit = measurementUnits.filter(function(mes) {
            return mes.tId===itm.properties.measurementUnit;
          })[0];
          itm.view.prodMeasurementUnit = measurementUnits.filter(function(mes) {
            return mes.tId===itm.properties.prodMeasurementUnit;
          })[0];
          itm.view.packageMeasurementUnit = measurementUnits.filter(function(mes) {
            return mes.tId===itm.properties.packageMeasurementUnit;
          })[0];
          itm.isError = true;  // has to specify quantity
          return itm;
        }).sort(function(a,b) {
          if (a.properties.productName > b.properties.productName) {
            return 1;
          } else {
            return -1;
          }
        });
      });
   };

   model.setCompItem = function(compDomain) {
     console.log('adding:');
     console.log(compDomain.currentItem);
     var temp = compDomain.compItems.filter(function(item) {
       return item.id === compDomain.currentItem.id;
     });
     if (temp.length) {
       alert (compDomain.currentItem.properties.productName+ ' כבר נמצא ברשימה')
     } else {
       compDomain.compItems.push(compDomain.currentItem);
       model.setChanged(true);
     }
   };

   model.delItem = function(compDomain,ind) {
     compDomain.compItems.splice(ind,1);
     model.setChanged(true);
   };

   model.setCompQuantity = function(component) {
     component.isError =
       component.view.compQuantity != Number(component.view.compQuantity) ||
       Number(component.view.compQuantity) <= 0;
     model.setChanged(true);
  };

    // loads catalog items for the components of the current item
   model.loadComponentItems = function() {
     model.compDomains = lov.domains.filter(function(dom) {
       return dom.id > currentDomain;
     });
     model.compDomains.forEach(function(dom){
       dom.categories = allCategories.filter(function(cat){
         return cat.domain===dom.id;
       });
       dom.currentCategory = dom.categories[0];
       dom.compItems = [];
       model.setCompCategory(dom);
     });
     var ids = model.item.properties.components.map(function(comp) {
       return comp.id;
     }).filter(function(id) {
       return id !== config.unhandledItemComponent && id !== config.unhandledItemMaterial;

     });
     api.queryCatalogByIds(ids)
       .then(function(res) {
         res.forEach(function(comp) {
           comp.view = {};
           comp.view.compQuantity = model.item.properties.components.filter(function(comp2) {
             return comp2.id===comp.id;
           })[0].quantity;
           comp.view.category = allCategories.filter(function(cat) {
             return cat.tId===comp.properties.category;
           })[0];
           comp.view.measurementUnit = measurementUnits.filter(function(mes) {
             return mes.tId===comp.properties.measurementUnit;
           })[0];
           comp.view.prodMeasurementUnit = measurementUnits.filter(function(mes) {
             return mes.tId===comp.properties.prodMeasurementUnit;
           })[0];
           comp.view.packageMeasurementUnit = measurementUnits.filter(function(mes) {
             return mes.tId===comp.properties.packageMeasurementUnit;
           })[0];
           comp.isError = false;
           var ourDomain = model.compDomains.filter(function(d) {
             return d.id===comp.properties.domain;
           })[0];
           ourDomain.compItems.push(comp);
         });
       });
   };

   model.addItem = function (domain,category) {
     $state.go('newCatalogItem',{'domain':domain, 'category':category});
   };

   // sensitivities tab

    model.filterAvailableSensitivities = function () {
      model.sensitivities = sensitivities.filter(function(sen) {
        var temp = model.item.properties.sensitivities.filter(function(s) {
          return s.tId === sen.tId;
        });
        return (temp.length===0);
      });

    };

    model.addSensitivity = function () {
      model.item.properties.sensitivities.push(model.sensitivity);
      model.filterAvailableSensitivities();
      model.setChanged(true);
    };

    model.delSensitivity = function (ind) {
      model.item.properties.sensitivities.splice(ind,1);
      model.filterAvailableSensitivities();
      model.setChanged(true);
    };

   // usage tab

    model.findUsage = function() {
      api.queryCatalog()
        .then(function(catalog) {
          model.usages = catalog.filter(function(cat) {
            var isUsage = false;
            if (!cat.properties.isDeleted) {    // don't show deleted usages
              cat.properties.components.forEach(function (comp) {
                if (comp.id === model.item.id) {
                  cat.quantity = comp.quantity;   // extract quantity of usage
                  isUsage = true;
                }
              });
            }
            return isUsage;
          });
          model.usages.forEach(function(usage) {
            usage.domain = usage.properties.domain;   // for view ng-repeat filtering by domain
            usage.category = allCategories.filter(function(category) {
              return category.tId === usage.properties.category;
            })[0];
            usage.measurementUnit = measurementUnits.filter(function(mu) {
              return mu.tId === usage.properties.measurementUnit;
            })[0];
            usage.prodMeasurementUnit = measurementUnits.filter(function(mu) {
              return mu.tId === usage.properties.prodMeasurementUnit;
            })[0];
            usage.packageMeasurementUnit = measurementUnits.filter(function(mu) {
              return mu.tId === usage.properties.packageMeasurementUnit;
            })[0];
          });
        });
    };

   // General

   model.saveItem = function() {
     var hasErrors = false;
     for (var e in model.item.errors) {
       if (model.item.errors.hasOwnProperty(e)) {
         if (model.item.errors[e]) {
           hasErrors = true;
           console.log('error in item property:');
           console.log(e);
         }
       }
     }
     model.compDomains.forEach(function(d) {
       d.compItems.forEach(function(i) {
         if (i.isError) {
           hasErrors = true;
           console.log('error in component domain:');
           console.log(d);
           console.log('in item:');
           console.log(i);
         }
       });
     });
     if(hasErrors) {
       alert('לא ניתן לשמור. תקן קודם את השגיאות המסומנות');
       return;
     }
     if (!model.item.view.category.tId) {
       alert('Missing category');
       return;
     } else {
       model.item.properties.category = model.item.view.category.tId;
     }
     if (!model.item.view.measurementUnit.tId) {
       alert('Missing measurement unit');
       return;
     }
     if (model.item.properties.domain === 1 && !model.item.view.prodMeasurementUnit.tId) {
       alert('Missing prod measurement unit');
       return;
     }
     if (!model.item.view.minTimeUnit) {
       model.item.view.minTimeUnit = lov.timeUnits[0];
     }
     if (!model.item.view.maxTimeUnit) {
       model.item.view.maxTimeUnit = lov.timeUnits[0];
     }
     model.item.properties.measurementUnit = model.item.view.measurementUnit.tId;
     if (model.item.properties.domain === 1) {
       model.item.properties.prodMeasurementUnit = model.item.view.prodMeasurementUnit.tId;
     }
     if (model.item.view.packageMeasurementUnit) {
       model.item.properties.packageMeasurementUnit = model.item.view.packageMeasurementUnit.tId;
     }
     if (model.item.view.specialType) {
       model.item.properties.specialType = model.item.view.specialType.id;
     }
     model.item.properties.minTimeUnit = model.item.view.minTimeUnit.id;
     model.item.properties.maxTimeUnit = model.item.view.maxTimeUnit.id;
     model.item.properties.muFactor = Number(model.item.properties.muFactor);
     model.item.properties.priceQuantity = Number(model.item.properties.priceQuantity);
     model.item.properties.price = Number(model.item.properties.price);
     model.item.properties.productionQuantity = Number(model.item.properties.productionQuantity);
     model.item.properties.minTime = Number(model.item.properties.minTime);
     model.item.properties.maxTime = Number(model.item.properties.maxTime);
     model.item.properties.components = [];
     model.compDomains.forEach(function(d) {
       d.compItems.forEach(function(c) {
         var comp = {
           id: c.id,
           domain: c.properties.domain,
           quantity: c.view.compQuantity
         };
         model.item.properties.components.push(comp);
       });
     });
     // if no components/materials were specified insert dummy
     if (model.currentDomain.id === 1 && model.item.properties.components.length === 0) {
       model.item.properties.components.push({
         id: config.unhandledItemComponent,
         domain: 2,
         quantity: 1
       });
       model.item.properties.components.push({
         id: config.unhandledItemMaterial,
         domain: 3,
         quantity: 1
       });
     }

     api.saveObj(model.item)
       .then(function(obj) {
         if (model.isNewItem) {
           model.item = obj;
           model.isNewItem = false;
           model.setupItemView();
           model.loadComponentItems();
         }
         model.setChanged(false);
       });
   };

   model.dupItem = function() {
     var tempItem = api.initCatalog();
     tempItem.properties = model.item.properties;
     model.item = tempItem;
     model.item.isCopyToShortDesc = model.item.properties.productDescription===model.item.properties.shortDescription;
     model.setupItemView();
     model.setChanged(false);
     model.loadComponentItems();
     model.isNewItem = true;
     model.isMainTabActive = true;
   };

   model.setIsDeleted = function() {
     model.setChanged(true);
     if (model.item.properties.isDeleted) {
       if (model.item.errors.productName === 'dup') { // if its deleted, never mind its being duplicate
         model.item.errors.productName = false;
       }
     } else {  // if it isn't deleted any more, productName must be unique in domain
       if (isNameInUse(model.item.properties.productName,model.item.id)) {
         model.item.errors.productName = 'dup';
       }
     }
   };

    model.editItem = function (id) {
      $state.go('editCatalogItem', {'id':id});
    };



    model.setupItemView = function() {
      model.item.view = {};
      model.item.errors = {};
      if (model.isNewItem) {
        model.item.view.category = model.categories.filter(function(cat) {
          return cat.tId===currentCategory;
        })[0];
        model.item.errors.productName = true;
        if (model.currentDomain.id<3) {
          model.item.errors.productionQuantity = true;
        }
        if (model.currentDomain.id===1) {
          model.item.errors.productDescription = true;
          model.item.errors.priceQuantity = true;
          model.item.errors.price = true;
        }
        model.item.view.measurementUnit = measurementUnits.filter(function(mu) {
          return mu.isDefault;
        })[0];
        model.item.view.prodMeasurementUnit = measurementUnits.filter(function(mu) {
          return mu.isDefault;
        })[0];
        model.item.view.packageMeasurementUnit = measurementUnits[0];
        model.item.view.minTimeUnit = lov.timeUnits[0];
        model.item.view.maxTimeUnit = lov.timeUnits[0];
        model.item.isCopyToShortDesc = true;
      } else {
        model.item.view.category = model.categories.filter(function (cat) {
          return cat.tId === model.item.properties.category;
        }) [0];
        model.item.view.measurementUnit = model.measurementUnits.filter(function (mes) {
          return mes.tId === model.item.properties.measurementUnit;
        }) [0];
        model.item.view.prodMeasurementUnit = model.measurementUnits.filter(function (mes) {
          return mes.tId === model.item.properties.prodMeasurementUnit;
        }) [0];
        model.item.view.packageMeasurementUnit = model.measurementUnits.filter(function (mes) {
          return mes.tId === model.item.properties.packageMeasurementUnit;
        }) [0];
        if (typeof model.item.properties.specialType === 'number') {
          model.item.view.specialType = lov.specialTypes.filter(function (st) {
            return st.id === model.item.properties.specialType;
          }) [0];
        }
        if (typeof model.item.properties.minTimeUnit === 'number') {
          model.item.view.minTimeUnit = lov.timeUnits.filter(function (tu) {
            return tu.id === model.item.properties.minTimeUnit;
          }) [0];
        }
        if (typeof model.item.properties.maxTimeUnit === 'number') {
          model.item.view.maxTimeUnit = lov.timeUnits.filter(function (tu) {
            return tu.id === model.item.properties.maxTimeUnit;
          }) [0];
        }
        model.item.properties.exitList.forEach(function(ex) {
          ex.measurementUnit = measurementUnits.filter(function(mu) {
            return mu.tId === ex.measurementUnit.tId;
          })[0];
        });
      }
      model.backupItemAttr = angular.copy(model.item.properties);
    };

    model.cancel = function () {
      model.item.properties = angular.copy(model.backupItemAttr);
      model.setupItemView();
      model.loadComponentItems();
      model.setChanged(false);
    };

    model.back = function () {
      history.back();
    };

    model.getOrders = function () {
      var fieldList = [
        'orderStatus','noOfParticipants','eventDate','eventTime','orderStatus',
        'isDateUnknown',
        'customer','number','header','quotes', 'createdBy'
      ];
      model.isProcessing = true;
      model.setOrderTableParams();
      api.queryCustomers()
        .then(function(custs) {
          var to = new Date(2099,11,31);
          var from = new Date(new Date().getUTCFullYear()-1,new Date().getMonth(),new Date().getDate());
          api.queryOrdersByRange('eventDate',from,to,fieldList)
            .then(function (orders) {
              model.orders = orders.filter(function (ord) {
                if (ord.properties.orderStatus===6) {
                  return false;
                } else {
              var res= false;
              ord.properties.quotes.forEach(function(q) {
                    q.items.forEach(function(itm) {
                      if (itm.catalogId===model.item.id) {
                        res = true;
                      }
                    });
                  });
                  return res;
                }
              });
              model.orders.forEach(function(ord) {
                ord.view = {
                  'customer': custs.filter(function(cust) {
                    return cust.id === ord.properties.customer;
                  })[0],
                  'orderStatus': lov.orderStatuses.filter (function(st) {
                    return st.id === ord.properties.orderStatus;
                  })[0]
                    };
                ord.view.customer.anyPhone =
                  ord.view.customer.properties.mobilePhone?ord.view.customer.properties.mobilePhone:
                    ord.view.customer.properties.homePhone?ord.view.customer.properties.homePhone:
                      ord.view.customer.properties.workPhone?ord.view.customer.properties.workPhone:undefined;
              });
              model.orders.sort(function(a,b) {
                var ad = a.properties.eventDate;
                var at = a.properties.eventTime;
                var bd = b.properties.eventDate;
                var bt = b.properties.eventTime;
                var a1 = ad.getDate() - 1 + ad.getMonth()*31 + (ad.getFullYear()-2010)*372;
                if (at) {
                  a1 +=  at.getHours()/24 + at.getMinutes()/1440;
                }
                var b1 = bd.getDate() - 1 + bd.getMonth()*31 + (bd.getFullYear()-2010)*372;
                if (bt) {
                  b1 +=  bt.getHours()/24 + bt.getMinutes()/1440;
                }
                return b1 - a1;
              });
              model.isProcessing = false;
              model.setOrderTableParams();
            })
        });
     };

    var tabThis;

    model.setOrderTableParams = function () {
      if (tabThis) {
        tabThis.queryType = 'catalog';
        tabThis.isProcessing = model.isProcessing;
        tabThis.orders = model.orders;
        tabThis.isDisableLink = model.item.isChanged;
        tabThis.user = model.user.attributes;
      }
    };



    $scope.initOrderTableParams = function (t) {
      tabThis = t;
    };


    // main block
    model.isMainTabActive = true;
    model.currentDomain = lov.domains[currentDomain];
    model.categories = allCategories.filter(function(cat) {
      return cat.domain===currentDomain;
    });
    model.isOrderNumbers = config.isOrderNumbers;
    model.measurementUnits = measurementUnits;
    model.sensitivities = sensitivities;
    model.timeUnits = lov.timeUnits;
    model.specialTypes = lov.specialTypes;
    model.isNewItem = $state.current.name==='newCatalogItem';
   if (model.isNewItem) {
     $rootScope.title = 'קטלוג - פריט חדש';
     model.item = api.initCatalog();
     model.item.properties.domain = lov.domains.filter(function(dom) {
       return dom.id===currentDomain;
     })[0].id;
     model.item.properties.muFactor = 1;
     model.item.properties.priceQuantity = null;
     model.item.properties.price = null;
     model.item.properties.productionQuantity = null;
     model.item.properties.minTime = null;
     model.item.properties.maxTime = null;
     if (model.currentDomain.id === 1) {
       model.item.properties.isInMenu = true;
     }
     model.item.properties.exitList = [];
     model.item.properties.components = [];
     model.item.properties.sensitivities = [];
   } else {
     $rootScope.title = 'קטלוג - ' + currentItem.properties.productName;
     model.item = currentItem;
     }

   model.item.isCopyToShortDesc = model.item.properties.productDescription===model.item.properties.shortDescription;
   model.setupItemView();
   model.setChanged(false);
   model.loadComponentItems();
   model.filterAvailableSensitivities();
  })

  .controller('AckDelCatalogCtrl', function ($modalInstance, item) {
    model.item = item;

    model.setYes = function () {
      $modalInstance.close(true);
    };

    model.setNo = function () {
      $modalInstance.close(false);
    };
  });



