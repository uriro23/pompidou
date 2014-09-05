'use strict';

/* list of values */
angular.module('myApp')
// load eventType objects - just once
  .factory('eventTypesPromise', function (api) {
    return api.queryEventTypes().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory('bidTextTypesPromise', function (api) {
    return api.queryBidTextTypes().then(function (res) {
      return res.map(function (obj) {
        return obj.attributes;
      });
    });
  })

  .factory ('today',function ($filter) {
    return $filter('date')(new Date(),'yyyy-MM-dd');
})

 .value ('lov',
  {
    domains: [
      {
        id: 1,
        name: 'מוצרים',
        single: 'מוצר',
        forWorkItem: 'מנות'
      },
      {
        id: 2,
        name: 'מרכיבים',
        single: 'מרכיב',
        forWorkItem: 'הכנות'
      },
      {
        id: 3,
        name: 'חומרים',
        single: 'חומר',
        forWorkItem: 'קניות'
      }
    ],
    orderStatuses: [
      {
        id: 1,
        name: 'חדשה'
      },
      {
        id: 2,
        name: 'סוכמה'
      },
      {
        id: 3,
        name: 'בביצוע'
      },
      {
        id: 4,
        name: 'בוצעה'
      },
      {
        id: 5,
        name: 'בוטלה'
      },
      {
        id: 6,
        name: 'אלטרנטיבה'
      }
    ]
  }
);