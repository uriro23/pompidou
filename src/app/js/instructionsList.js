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

    // this.eventDate = moment(currentOrder.eventDate);
    this.eventDate = currentOrder.eventDate;

    this.isAnyFridge = false;
    this.isAllFridge = true;
    this.isDeserts = false;
    this.isAnyHeating = false;
    this.fridgeItems = [];
    this.instructions = [];
    this.generalInstructions = [];

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
            desc: catItem.properties.stickerLabel
          });
        } else {
          if (item.category.type < 3) {
            that.isAllFridge = false;
          }
        }
        if (catItem.properties.isHeating) {
          that.isAnyHeating = true;
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
        if (catItem.properties.generalInstructions) {
          temp = that.generalInstructions.filter(function (gi) {    // filter out same generalInstructions for multiple items
            return (gi.text === catItem.properties.generalInstructions);
          });
          if (temp.length === 0) {
            that.generalInstructions.push({
              id: catItem.id,
              text: catItem.properties.generalInstructions
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
        id: outOfFridgeItem.id + '-1',
        time: outOfFridgeItem.properties.instructionsMinutes,
        text: outOfFridgeItem.properties.instructions
      });
    }
    if (this.isAnyHeating) {
      this.instructions.push({
        id: outOfFridgeItem.id + '-2',
        time: 60,
        text: outOfFridgeItem.properties.generalInstructions
      })
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
