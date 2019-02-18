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
        return obj.attributes;
      });
    });
  })

  .factory('categoriesPromise', function (api) {
    return api.queryCategories(1).then(function (res) { // we actually load product domain categories only. used in order views
      return res.map(function (obj) {
       return obj.attributes;
       });
    });
  })

  .factory('allCategoriesPromise', function (api) {
    return api.queryCategories().then(function (res) { // all domains for work order
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('measurementUnitsPromise', function (api) {
    return api.queryMeasurementUnits().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('discountCausesPromise', function (api) {
    return api.queryDiscountCauses().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('referralSourcesPromise', function (api) {
    return api.queryReferralSources().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('cancelReasonsPromise', function (api) {
    return api.queryCancelReasons().then(function (res) {
      console.log(res);
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('sensitivitiesPromise', function (api) {
    return api.querySensitivities().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('menuTypesPromise', function (api) {
    return api.queryMenuTypes().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('colorsPromise', function (api) {
    return api.queryColors().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('employeesPromise', function (api) {
    return api.queryEmployees().then(function (res) {
       return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('pRolesPromise', function (api) {
    return api.queryPRoles().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('configPromise', function (api) {
    return api.queryConfig().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
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
        label: 'אירועים',
        single: 'אירוע',
        forWorkItem: 'אירועים'
      },
      {
        id: 1,
        label: 'מנות',
        single: 'מנה',
        forWorkItem: 'מנות'
      },
      {
        id: 2,
        label: 'הכנות',
        single: 'הכנה',
        forWorkItem: 'הכנות'
      },
      {
        id: 3,
        label: 'קניות',
        single: 'קניה',
        forWorkItem: 'קניות'
      }
    ],
    orderStatuses: [
      {
        id: 0,
        name: 'פניה',
        isSelectDefault: false,
        isSelectLead: true,
        isSelectLeadNoDate : true,
        isSelectNoDate: false
      },
      {
        id: 1,
        name: 'הצעה',
        isSelectDefault: true,
        isSelectLead: false,
        isSelectLeadNoDate : true,
        isSelectNoDate: true
      },
      {
        id: 2,
        name: 'בדיון',
        isSelectDefault: true,
        isSelectLead: false,
        isSelectLeadNoDate : false,
        isSelectNoDate: false
      },
      {
        id: 3,
        name: 'סוכם',
        isSelectDefault: true,
        isSelectLead: false,
        isSelectLeadNoDate : false,
        isSelectNoDate: false
      },
       {
         id: 4,
         name: 'מקדמה',
         isSelectDefault: true,
         isSelectLead: false,
         isSelectLeadNoDate : false,
         isSelectNoDate: false
       },
       {
         id: 5,
         name: 'שולם',
         isSelectDefault: true,
         isSelectLead: false,
         isSelectLeadNoDate : false,
         isSelectNoDate: false
       },
      {
        id: 6,
        name: 'בוטל',
        isSelectDefault: true,
        isSelectLead: true,
        isSelectLeadNoDate : true,
        isSelectNoDate: true
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
        isRealDocumentType: true,
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
        label: 'הצעת מחיר חדשה',
        isRealDocumentType: true,
        order:2
      }
    ],

    timeUnits: [
      {
        id: 0,
        label: 'ימים'
      },
      {
        id: 1,
        label: 'שעות'
      }
    ],

    accessBoxItemId: 332,
    accessUnhandledItemComponent: 417,
    accessUnhandledItemMaterial: 418
  }
);
