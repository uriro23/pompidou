'use strict';

/* Controllers */
angular.module('myApp')
  .controller('WorkOrder2Ctrl', function (api, $state, $filter, $modal, $q, $rootScope,
                                         lov, config, catalog, allCategories, measurementUnits, colors, dater,
                                         customers, woIndexes) {


    $rootScope.menuStatus = 'show';
    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }
    $rootScope.title = 'פקודת עבודה חדשה';

 });
