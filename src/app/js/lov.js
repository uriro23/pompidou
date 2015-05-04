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

.factory('today',function() {
    var today = new Date();
    today.setHours(0);
    today.setMinutes(0);
    today.setSeconds(0);
    today.setMilliseconds(0);
    return today;
  })

// load lovs from DB - just once
  .factory('eventTypesPromise', function (api) {
    return api.queryEventTypes().then(function (res) {
      return res.map(function (obj) {
        var o = obj.attributes;
        return o;
      });
    });
  })

  .factory('bidTextTypesPromise', function (api) {
    return api.queryBidTextTypes().then(function (res) {
      return res.map(function (obj) {
        var o = obj.attributes;
        return o;
      });
    });
  })

    .factory('categoriesPromise', function (api) {
      return api.queryCategories(1).then(function (res) { // we actually load product domain categories only. used in order views
        return res.map(function (obj) {
          var o = obj.attributes;
          return o;
        });
      });
    })

    .factory('allCategoriesPromise', function (api) {
      return api.queryCategories().then(function (res) { // all domains for work order
        return res.map(function (obj) {
          var o = obj.attributes;
          return o;
        });
      });
    })

    .factory('measurementUnitsPromise', function (api) {
    return api.queryMeasurementUnits().then(function (res) {
      return res.map(function (obj) {
        var o = obj.attributes;
        return o;
      });
    });
  })

  .factory('discountCausesPromise', function (api) {
    return api.queryDiscountCauses().then(function (res) {
      return res.map(function (obj) {
        var o = obj.attributes;
        return o;
      });
    });
  })

  .factory('configPromise', function (api) {
    return api.queryConfig().then(function (res) {
      return res.map(function (obj) {
        var o = obj.attributes;
        return o;
      });
    });
  })

 .value ('lov',
  {
    company: 'פומפידו',

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
        label: 'מרכיבים',
        single: 'מרכיב',
        forWorkItem: 'הכנות'
      },
      {
        id: 3,
        label: 'חומרים',
        single: 'חומר',
        forWorkItem: 'קניות'
      }
    ],
    orderStatuses: [
      {
        id: 1,
        name: 'חדש',
        _noClone: true
      },
      {
        id: 2,
        name: 'בדיון',
        _noClone: true
      },
      {
        id: 3,
        name: 'סוכם',
        _noClone: true
      }, /*
      {
        id: 4,
        name: 'בביצוע',
        _noClone: true
      },
      {
        id: 5,
        name: 'בוצע',
        _noClone: true
      }, */
      {
        id: 6,
        name: 'בוטל',
        _noClone: true
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
        label: 'הצעת מחיר',
        isRealDocumentType: true
      },
      {
        id: 2,
        label: 'הזמנה',
        isRealDocumentType: true
      },
      {
        id: 3,
        label: 'דוא"ל',
        isRealDocumentType: false
      }
    ],
    accessBoxItemId: 332,
    accessUnhandledItemComponent: 417,
    accessUnhandledItemMaterial: 418
  }
);