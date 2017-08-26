'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CatalogItemCtrl', function ($state, $modal, $rootScope, $scope, api, lov,
                                           currentItem, currentDomain, currentCategory,
                                           allCategories, productNames,measurementUnits, eventTypes, config) {

    var model = this;
    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }

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
        !model.item.attributes.productName || model.item.attributes.productName.length === 0;
      if (!model.item.errors.productName) {
        if (isNameInUse(model.item.attributes.productName,model.item.id)) {
          model.item.errors.productName = 'dup';
        }
      }
       model.setChanged(true);
    };

    model.setProductDescription = function () {
      model.item.errors.productDescription =
        !model.item.attributes.productDescription || model.item.attributes.productDescription.length === 0;
      if (model.currentDomain.id === 1 && model.item.isCopyToShortDesc) {
        model.item.attributes.shortDescription = model.item.attributes.productDescription;
      }
      model.setChanged(true);
    };

    model.setShortDescription = function () {
      model.item.isCopyToShortDesc =
        model.item.attributes.productDescription === model.item.attributes.shortDescription;
      model.setChanged(true);
    };

    model.setPriceQuantity = function () {
      model.item.errors.priceQuantity =
        (model.currentDomain.id === 1 || Boolean(model.item.attributes.priceQuantity)) &&
        ((model.item.attributes.priceQuantity != Number(model.item.attributes.priceQuantity) ||
        Number(model.item.attributes.priceQuantity) <= 0));
      model.setChanged(true);
    };

    model.setPrice = function () {
      model.item.errors.price =
        (model.currentDomain.id === 1 || Boolean(model.item.attributes.price)) &&
        ((model.item.attributes.price != Number(model.item.attributes.price) ||
        Number(model.item.attributes.price) <= 0));
      model.setChanged(true);
    };

    model.setProductionQuantity = function () {
      model.item.errors.productionQuantity =
        model.item.attributes.productionQuantity != Number(model.item.attributes.productionQuantity) ||
        Number(model.item.attributes.productionQuantity) <= 0;
       model.setChanged(true);
    };

    model.setMinTime = function (ind) {
      model.item.errors.minTime =
        model.item.attributes.minTime != Number(model.item.attributes.minTime) ||
        Number(model.item.attributes.minTime) < 0;
      model.setChanged(true);
    };

    model.setMaxTime = function (ind) {
      model.item.errors.maxTime =
        model.item.attributes.maxTime != Number(model.item.attributes.maxTime) ||
        Number(model.item.attributes.maxTime) < 0;
      model.setChanged(true);
    };

    // Exit List Tab

    //TODO: set focus on added item
    model.addExitListItem = function () {
      model.item.attributes.exitList.push({item: ''});
      model.setChanged(true);
    };

    model.delExitListItem = function (ind) {
      model.item.attributes.exitList.splice(ind, 1);
      model.setChanged(true);
    };

    // Components Tab

   model.setCompCategory = function(comDomain) {
    api.queryCatalogByCategory(comDomain.currentCategory.tId)
      .then(function(res) {
        comDomain.categoryItems = res.filter(function(itm) {
          return !itm.attributes.isDeleted;
        }).map(function(itm) {
          itm.view = {};
          itm.view.compQuantity = null;
          itm.view.category = comDomain.currentCategory;
          itm.view.measurementUnit = measurementUnits.filter(function(mes) {
            return mes.tId===itm.attributes.measurementUnit;
          })[0];
          itm.isError = true;  // has to specify quantity
          return itm;
        }).sort(function(a,b) {
          if (a.attributes.productName > b.attributes.productName) {
            return 1;
          } else {
            return -1;
          }
        });
      });
   };

   model.setCompItem = function(compDomain) {
     compDomain.compItems.push(compDomain.currentItem);
     model.setChanged(true);
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
     var ids = model.item.attributes.components.map(function(comp) {
       return comp.id;
     }).filter(function(id) {
       return id !== config.unhandledItemComponent && id !== config.unhandledItemMaterial;

     });
     api.queryCatalogByIds(ids)
       .then(function(res) {
         res.forEach(function(comp) {
           comp.view = {};
           comp.view.compQuantity = model.item.attributes.components.filter(function(comp2) {
             return comp2.id===comp.id;
           })[0].quantity;
           comp.view.category = allCategories.filter(function(cat) {
             return cat.tId===comp.attributes.category;
           })[0];
           comp.view.measurementUnit = measurementUnits.filter(function(mes) {
             return mes.tId===comp.attributes.measurementUnit;
           })[0];
           comp.isError = false;
           var ourDomain = model.compDomains.filter(function(d) {
             return d.id===comp.attributes.domain;
           })[0];
           ourDomain.compItems.push(comp);
         });
       });
   };

   model.addItem = function (domain,category) {
     $state.go('newCatalogItem',{'domain':domain, 'category':category});
   };

   // usage tab

    model.findUsage = function() {
      api.queryCatalog()
        .then(function(catalog) {
          model.usages = catalog.filter(function(cat) {
            var isUsage = false;
            cat.attributes.components.forEach(function(comp) {
              if (comp.id === model.item.id) {
                cat.quantity = comp.quantity;   // extract quantity of usage
                isUsage = true;
              }
            });
            return isUsage;
          });
          model.usages.forEach(function(usage) {
            usage.domain = usage.attributes.domain;   // for view ng-repeat filtering by domain
            usage.category = allCategories.filter(function(category) {
              return category.tId === usage.attributes.category;
            })[0];
            usage.measurementUnit = measurementUnits.filter(function(mu) {
              return mu.tId === usage.attributes.measurementUnit;
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
         }
       }
     }
     model.compDomains.forEach(function(d) {
       d.compItems.forEach(function(i) {
         if (i.isError) {
           hasErrors = true;
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
       model.item.attributes.category = model.item.view.category.tId;
     }
     if (!model.item.view.measurementUnit.tId) {
       alert('Missing measurement unit');
       return;
     }
     if (!model.item.view.minTimeUnit) {
       model.item.view.minTimeUnit = lov.timeUnits[0];
     }
     if (!model.item.view.maxTimeUnit) {
       model.item.view.maxTimeUnit = lov.timeUnits[0];
     }
     model.item.attributes.measurementUnit = model.item.view.measurementUnit.tId;
     model.item.attributes.minTimeUnit = model.item.view.minTimeUnit.id;
     model.item.attributes.maxTimeUnit = model.item.view.maxTimeUnit.id;
     model.item.attributes.priceQuantity = Number(model.item.attributes.priceQuantity);
     model.item.attributes.price = Number(model.item.attributes.price);
     model.item.attributes.productionQuantity = Number(model.item.attributes.productionQuantity);
     model.item.attributes.minTime = Number(model.item.attributes.minTime);
     model.item.attributes.maxTime = Number(model.item.attributes.maxTime);
     model.item.attributes.components = [];
     model.compDomains.forEach(function(d) {
       d.compItems.forEach(function(c) {
         var comp = {
           id: c.id,
           domain: c.attributes.domain,
           quantity: c.view.compQuantity
         };
         model.item.attributes.components.push(comp);
       });
     });
     // if no components/materials were specified insert dummy
     if (model.currentDomain.id === 1 && model.item.attributes.components.length === 0) {
       model.item.attributes.components.push({
         id: config.unhandledItemComponent,
         domain: 2,
         quantity: 1
       });
       model.item.attributes.components.push({
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
     tempItem.attributes = model.item.attributes;
     model.item = tempItem;
     model.item.isCopyToShortDesc = model.item.attributes.productDescription===model.item.attributes.shortDescription;
     model.setupItemView();
     model.setChanged(false);
     model.loadComponentItems();
     model.isNewItem = true;
     model.isMainTabActive = true;
   };

   model.setIsDeleted = function() {
     model.setChanged(true);
     if (model.item.attributes.isDeleted) {
       if (model.item.errors.productName === 'dup') { // if its deleted, never mind its being duplicate
         model.item.errors.productName = false;
       }
     } else {  // if it isn't deleted any more, productName must be unique in domain
       if (isNameInUse(model.item.attributes.productName,model.item.id)) {
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
        model.item.errors.productDescription = true;
        model.item.errors.productionQuantity = true;
        if (model.currentDomain.id===1) {
          model.item.errors.priceQuantity = true;
          model.item.errors.price = true;
        }
        model.item.view.measurementUnit = measurementUnits[0];
        model.item.view.minTimeUnit = lov.timeUnits[0];
        model.item.view.maxTimeUnit = lov.timeUnits[0];
        model.item.isCopyToShortDesc = true;
      } else {
        model.item.view.category = model.categories.filter(function (cat) {
          return cat.tId === model.item.attributes.category;
        }) [0];
        model.item.view.measurementUnit = model.measurementUnits.filter(function (mes) {
          return mes.tId === model.item.attributes.measurementUnit;
        }) [0];
        if (typeof model.item.attributes.minTimeUnit === 'number') {
          model.item.view.minTimeUnit = lov.timeUnits.filter(function (tu) {
            return tu.id === model.item.attributes.minTimeUnit;
          }) [0];
        }
        if (typeof model.item.attributes.maxTimeUnit === 'number') {
          model.item.view.maxTimeUnit = lov.timeUnits.filter(function (tu) {
            return tu.id === model.item.attributes.maxTimeUnit;
          }) [0];
        }
      }
      model.backupItemAttr = angular.copy(model.item.attributes);
    };

    model.cancel = function () {
      model.item.attributes = angular.copy(model.backupItemAttr);
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
        'customer','number','eventType','header','quotes'
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
                if (ord.attributes.orderStatus===6) {
                  return false;
                } else {
              var res= false;
              ord.attributes.quotes.forEach(function(q) {
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
                    return cust.id === ord.attributes.customer;
                  })[0],
                  'orderStatus': lov.orderStatuses.filter (function(st) {
                    return st.id === ord.attributes.orderStatus;
                  })[0],
                  'eventType': ord.attributes.eventType ?
                    eventTypes.filter(function (et) {
                      return et.tId === ord.attributes.eventType;
                    })[0]
                    : undefined
                };
                ord.view.customer.anyPhone =
                  ord.view.customer.attributes.mobilePhone?ord.view.customer.attributes.mobilePhone:
                    ord.view.customer.attributes.homePhone?ord.view.customer.attributes.homePhone:
                      ord.view.customer.attributes.workPhone?ord.view.customer.attributes.workPhone:undefined;
              });
              model.orders.sort(function(a,b) {
                var ad = a.attributes.eventDate;
                var at = a.attributes.eventTime;
                var bd = b.attributes.eventDate;
                var bt = b.attributes.eventTime;
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
    model.measurementUnits = measurementUnits;
    model.timeUnits = lov.timeUnits;
    model.isNewItem = $state.current.name==='newCatalogItem';
   if (model.isNewItem) {
     $rootScope.title = 'קטלוג - פריט חדש';
     model.item = api.initCatalog();
     model.item.attributes.domain = lov.domains.filter(function(dom) {
       return dom.id===currentDomain;
     })[0].id;
     model.item.attributes.priceQuantity = null;
     model.item.attributes.price = null;
     model.item.attributes.productionQuantity = null;
     model.item.attributes.minTime = null;
     model.item.attributes.maxTime = null;
     if (model.currentDomain.id === 1) {
       model.item.attributes.isInMenu = true;
     }
     model.item.attributes.exitList = [];
     model.item.attributes.components = [];
   } else {
     $rootScope.title = 'קטלוג - ' + currentItem.attributes.productName;
     model.item = currentItem;
     }

   model.item.isCopyToShortDesc = model.item.attributes.productDescription===model.item.attributes.shortDescription;
   model.setupItemView();
   model.setChanged(false);
   model.loadComponentItems();
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



