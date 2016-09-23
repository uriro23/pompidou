'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CalendarCtrl', function ($rootScope, $state, moment, api,  lov, calendarConfig, customers) {
    $rootScope.menuStatus = 'show';
    var model = this;

    console.log(calendarConfig);


    model.setMonth = function(direction) {
      if (direction === 0) {
        model.calendarDate = new Date();
      } else {
        model.calendarDate = new Date(model.calendarDate.getFullYear(),model.calendarDate.getMonth()+1*direction,1);
      }
      var from = new Date(model.calendarDate.getFullYear(),model.calendarDate.getMonth(),1);
      var to = new Date(model.calendarDate.getFullYear(),model.calendarDate.getMonth()+1,1);
      api.queryOrdersByRange('eventDate',from,to,
        'number,eventDate,eventTime,exitTime,orderStatus,customer,noOfParticipants,template,header'
      )
        .then(function(orders) {
          model.orders = orders.filter(function(ord) {
            return ord.attributes.orderStatus !== 6 // don't show canceled events
              && !ord.attributes.template           // don't show templates
              && (ord.attributes.eventDate>new Date() || ord.attributes.orderStatus !== 1); // don't show past 'new' events
          });
          model.orders.forEach(function(ord) {
            ord.view = {
              customer: customerNames.filter(function(cust) {
                return cust.id===ord.attributes.customer;
              })[0],
              orderStatus: lov.orderStatuses.filter(function(os) {
                return os.id===ord.attributes.orderStatus
              })[0]
            }
          });
          model.events = model.orders.map(function(ord) {
            var d = new Date(
              ord.attributes.eventDate.getFullYear(),
              ord.attributes.eventDate.getMonth(),
              ord.attributes.eventDate.getDate(),
              ord.attributes.eventTime?ord.attributes.eventTime.getHours():12,
              ord.attributes.eventTime?ord.attributes.eventTime.getMinutes():0
            );
            return {
              title: 'אירוע ' + ord.attributes.number + ': סטטוס ' + ord.view.orderStatus.name + ', לקוח '
              + ord.view.customer.name + ', '
              + ord.attributes.noOfParticipants + ' משתתפים, '
              + 'סכום ' + ord.attributes.header.total + ' ש"ח',
              color: ord.attributes.orderStatus === 1 ? calendarConfig.colorTypes.info :
                ord.attributes.orderStatus === 2 ? calendarConfig.colorTypes.warning :
                  calendarConfig.colorTypes.success,
              startsAt: d,
              endsAt: new Date(moment(d).add(1, 'hour')),
              orderId: ord.id
            }
          });
        });
    };

    model.eventClicked = function(calendarEvent) {
      $state.go('editOrder',{'id':calendarEvent.orderId});
    };

    model.cellClicked = function(calendarDate,calendarCell) {
      console.log('cell clicked');
      console.log(calendarDate);
      console.log(calendarCell);

    };

    // main block

    model.calendarView = 'month';
    var customerNames = customers.map(function(cust) {
      var name = '';
      if (cust.attributes.firstName) {
        name+=cust.attributes.firstName;
      }
      if (cust.attributes.lastName) {
        name+=' ';
        name+=cust.attributes.lastName;
      }
      return {
        id: cust.id,
        name: name
      }
    });
    model.setMonth(0);


  });
