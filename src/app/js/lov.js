'use strict';

/* list of values */
angular.module('myApp')

  /*
   .factory('$exceptionHandler', function() {
   return function(exception, cause) {
   exception.message += ' (caused by "' + cause + '")';
   alert('תקלת תוכנה'+'\r\n'+exception.message);
   throw exception;
   };
   })

   */

  .factory('dater', function () {
    return {
      today: function() {
        var today = new Date();
        today.setHours(0);
        today.setMinutes(0);
        today.setSeconds(0);
        today.setMilliseconds(0);
        return today;
      }
    }
  })

// load lovs from DB - just once
  .factory('bidTextTypesPromise', function (api) {
    return api.queryBidTextTypes().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('categoriesPromise', function (api) {
    return api.queryCategories(1).then(function (res) { // we actually load product domain categories only. used in order views
      return res.map(function (obj) {
       return obj.properties;
       });
    });
  })

  .factory('allCategoriesPromise', function (api) {
    return api.queryCategories().then(function (res) { // all domains for work order
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('measurementUnitsPromise', function (api) {
    return api.queryMeasurementUnits().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('discountCausesPromise', function (api) {
    return api.queryDiscountCauses().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('referralSourcesPromise', function (api) {
    return api.queryReferralSources().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('cancelReasonsPromise', function (api) {
    return api.queryCancelReasons().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('sensitivitiesPromise', function (api) {
    return api.querySensitivities().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('menuTypesPromise', function (api) {
    return api.queryMenuTypes().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('colorsPromise', function (api) {
    return api.queryColors().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('taskTypesPromise', function (api) {
    return api.queryTaskTypes().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('taskDetailsPromise', function (api) {
    return api.queryTaskDetails().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('phasesPromise', function (api) {
    return api.queryPhases().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('employeesPromise', function (api) {
    return api.queryEmployees().then(function (res) {
       return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('pRolesPromise', function (api) {
    return api.queryPRoles().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      });
    });
  })

  .factory('configPromise', function (api) {
    return api.queryConfig().then(function (res) {
      return res.map(function (obj) {
        return obj.properties;
      })[0];
    });
  })

  .value('lov',
  {
    company: 'פומפידו',
    version: 4,   // used to version orders and bids in db

    // version 2: orders pre 'quotes' - exist only in bids
    // version 3: bids pre 'menuType'

    domains: [
      {
        id: 0,
        name: 'events',
        label: 'אירועים',
        single: 'אירוע',
        forWorkItem: 'אירועים'
      },
      {
        id: 1,
        name: 'dishes',
        label: 'מנות',
        single: 'מנה',
        forWorkItem: 'מנות'
      },
      {
        id: 2,
        name: 'preparations',
        label: 'הכנות',
        single: 'הכנה',
        forWorkItem: 'הכנות'
      },
      {
        id: 3,
        name: 'shopping',
        label: 'מצרכים',
        single: 'מצרך',
        forWorkItem: 'מצרכים'
      },
      {
        id: 4,
        mame: 'actions',
        label: 'מטלות',
        single: 'מטלה',
        forWorkItem: 'מטלות'
      }
    ],
    orderStatuses: [
      {
        id: 0,
        name: 'פניה',
        isSelectLead : true,
        isSelectDefault: true,
        isSelectNoCall: true,
        isSelectNoDate: true
      },
      {
        id: 1,
        name: 'הצעה',
        isSelectLead : false,
        isSelectDefault: true,
        isSelectNoCall: true,
        isSelectNoDate: true
      },
      {
        id: 2,
        name: 'בדיון',
        isSelectLead : false,
        isSelectDefault: true,
        isSelectNoCall: true,
        isSelectNoDate: false
      },
      {
        id: 3,
        name: 'סוכם',
        isSelectLead : false,
        isSelectDefault: true,
        isSelectNoCall: false,
        isSelectNoDate: false
      },
       {
         id: 4,
         name: 'מקדמה',
         isSelectLead : false,
         isSelectDefault: true,
         isSelectNoCall: false,
         isSelectNoDate: false
       },
       {
         id: 5,
         name: 'שולם',
         isSelectLead : false,
         isSelectDefault: true,
         isSelectNoCall: false,
         isSelectNoDate: false
       },
      {
        id: 6,
        name: 'בוטל',
        isSelectLead : true,
        isSelectDefault: true,
        isSelectNoCall: true,
        isSelectNoDate: true
      }
    ],

    eventTimeRanges: [
      {
        id: 0,
        label: 'בדיוק',
        value: 0
      },
      {
        id: 1,
        label: 'חצי שעה',
        value: 30
      },
      {
        id: 2,
        label: 'שעה',
        value: 60
      },
      {
        id: 3,
        label: 'שעה וחצי',
        value: 90
      },
      {
        id: 4,
        label: 'שעתיים',
        value: 120
      },
      {
        id: 5,
        label: '3 שעות',
        value: 180
      }
    ],

    categoryTypes: [
      {
        id: 1,
        name: 'lightFood'
      },
      {
        id: 2,
        name: 'heavyFood'
      },
      {
        id: 3,
        name: 'transportation'
      },
      {
        id: 4,
        name: 'priceIncrease'
      },
      {
        id: 5,
        name: 'extralServices'
      },
      {
        id: 6,
        name: 'midiatedServices'
      }
    ],

    specialTypes: [
      {
        id: 1,
        name: 'כלים חד פעמיים'
     },
      {
        id: 2,
        name: 'השכרת ציוד',
        exist: 'isEquipRental',
        desc: 'equipRental'
      },
      {
        id: 3,
        name: 'מלצרים',
        exist: 'isWaiters',
        desc: 'waiters'
      },
      {
        id: 4,
        name: 'מנהל אירוע',
        exist: 'isEventManager',
        desc: 'eventManager'
      },
      {
        id: 5,
        name: 'שתיה',
        exist: 'isLiquids',
        desc: 'liquids'
      },
      {
        id: 6,
        name: 'שרותים שונים',
        exist: 'isOtherExtras',
        desc: 'otherExtras'
      }
    ],
    documentTypes: [
      {
        id: 0,
        label: 'גיבוי',
        isRealDocumentType: false
      },
      {
        id: 1,
        label: 'הצעת מחיר ישנה',
        isRealDocumentType: false,
        order: 1
      },
      {
        id: 2,
        label: 'הזמנה',
        isRealDocumentType: false,
        order:3
      },
      {
        id: 3,
        label: 'דוא"ל',
        isRealDocumentType: false,
        order:0
      },
      {
        id: 4,
        label: 'הצעת מחיר קיימת',
        isRealDocumentType: false,
        order:2
      },
      {
        id: 5,
        label: 'הצעת מחיר',
        isRealDocumentType: true,
        order:4
      }
    ],

    printTypes: [
      {
        id: 0,
        label: 'ללקוח'
      },
      {
        id: 1,
        label: 'מדבקות'
      },
      {
        id: 2,
        label: 'למטבח'
      },
      {
        id: 3,
        label: 'טפסים'
      }
    ],

    workOrderDisplayModes : [
      {
        id: 1,
        label: 'עוד לא והיום',
        isShowTodayOnly: false,
        isShowDone: false
      },
      {
        id: 2,
        label: 'רק היום',
        isShowTodayOnly: true,
        isShowDone: false
      },
      {
        id: 3,
        label: 'הכל',
        isShowTodayOnly: false,
        isShowDone: true
      }
    ],

    stickerTypes: [
      {
        id: 0,
        label: 'מוצר בתהליך',
        isFreeze: false
      },
      {
        id: 1,
        label: 'מוצר בהקפאה',
        isFreeze: true
      },
      {
        id: 2,
        label: 'חומר גלם',
        isFreeze: false
      },
    ],

    descChangeActions: [
      {
        id: 0,
        label: 'מקור',
        isDescChanged: false,
        isCosmeticChange: false,
        isMajorChange: false,
        isKitchenRemark: false
      },
      {
        id: 1,
        label: 'לסרוויס',
        isDescChanged: true,
        isCosmeticChange: false,
        isMajorChange: false,
        isKitchenRemark: true
      },
      {
        id: 2,
        label: 'גם לאריזה',
        isDescChanged: true,
        isCosmeticChange: false,
        isMajorChange: true,
        isKitchenRemark: true
      },
      {
        id: 3,
        label: 'רק ללקוח',
        isDescChanged: true,
        isCosmeticChange: true,
        isMajorChange: false,
        isKitchenRemark: false
      }
    ],

    accessBoxItemId: 332,
    accessUnhandledItemComponent: 417,
    accessUnhandledItemMaterial: 418
  }
);
