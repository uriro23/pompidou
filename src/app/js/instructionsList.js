'use strict';

/* Controllers */
angular.module('myApp')
  .controller('InstructionsListCtrl', function (api, $state, $rootScope, order, moment, catalog, customers, config) {
    $rootScope.menuStatus = 'hide';
    $rootScope.title = 'הוראות';

    var CATEGORY_PETIFOURS = 8;
    var CATEGORY_DESERTS = 49;


    var user = api.getCurrentUser();
    if (user) {
      $rootScope.username = user.attributes.username;
    } else {
      $state.go('login');
    }

    var currentOrder = order.properties;
    var currentQuote = currentOrder.quotes[currentOrder.activeQuote];
    var that = this;

    this.customer = customers.filter(function(customer) {
      return customer.id === currentOrder.customer;
    })[0];

    this.eventDate = moment(currentOrder.eventDate);

    this.isAnyFridge = false;
    this.isAllFridge = true;
    this.isDeserts = false;
    this.fridgeItems = [];
    this.instructions = [];

    var outOfFridgeItem = catalog.filter(function(cat) {
      return cat.id === config.outOfFridgeItem;
    })[0];

    currentQuote.items.forEach(function(item) {
      var catItem = catalog.filter(function(cat) {
        return cat.id === item.catalogId;
      })[0];
      // petifours and deserts go to fridge as one unit
      if (item.category.tId === CATEGORY_PETIFOURS || item.category.tId === CATEGORY_DESERTS) {
        that.isDeserts = true;
      } else {
        if (catItem.properties.isFridge) {
          that.isAnyFridge = true;
          that.fridgeItems.push({
            id: catItem.id,
            desc: catItem.properties.shortDescription
          });
        } else {
          if (item.category.type < 3) {
            that.isAllFridge = false;
          }
        }
        if (catItem.properties.instructions) {
          var temp = that.instructions.filter(function (inst) {    // filter out same instructions for multiple items
            return (inst.time === catItem.properties.instructionsMinutes && inst.text === catItem.properties.instructions);
          });
          if (temp.length === 0) {
            that.instructions.push({
              id: catItem.id,
              time: catItem.properties.instructionsMinutes,
              text: catItem.properties.instructions
            })
          }
        }
      }
    });
    if (this.isDeserts) {
      this.fridgeItems.push({
        id: outOfFridgeItem.id,
        desc: outOfFridgeItem.properties.shortDescription  // contains instruction to put deserts in fridge
      });
    }
    if (this.isAnyFridge) {
      this.instructions.push({
        id: outOfFridgeItem.id,
        time: outOfFridgeItem.properties.instructionsMinutes,
        text: outOfFridgeItem.properties.instructions
      });
    }
    this.instructions.sort(function(a,b) {
      if (a.time > b.time) {
        return -1;
      } else if (a.time < b.time) {
        return 1;
      } else {
        return 0;
      }
    });
 });
