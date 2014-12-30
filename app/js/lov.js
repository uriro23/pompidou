'use strict';

/* list of values */
angular.module('myApp')

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
    domains: [
      {
        id: 1,
        label: 'מוצרים',
        single: 'מוצר',
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
        name: 'חדשה',
        _noClone: true
      },
      {
        id: 2,
        name: 'סוכמה',
        _noClone: true
      },
      {
        id: 3,
        name: 'בביצוע',
        _noClone: true
      },
      {
        id: 4,
        name: 'בוצעה',
        _noClone: true
      },
      {
        id: 5,
        name: 'בוטלה',
        _noClone: true
      },
      {
        id: 6,
        name: 'אלטרנטיבה',
        _noClone: true
      }
    ]
  }
);