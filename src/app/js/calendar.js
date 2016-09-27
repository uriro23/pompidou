'use strict';

/* Controllers */
angular.module('myApp')
  .controller('CalendarCtrl', function ($rootScope, $state, moment,
                                        api,  lov, calendarConfig, customers,
                                        googleCalendarService) {
    $rootScope.menuStatus = 'show';
    var model = this;

   // console.log(calendarConfig);

    model.setShowGoogleEvents = function() {
      if (model.isShowGoogleEvents) {
        model.events = model.pompidouEvents.concat(model.googleEvents);
      } else {
        model.events = model.pompidouEvents;
      }
    };


    model.setMonth = function(direction) {
      if (direction === 0) {
        model.calendarDate = new Date();
      } else {
        model.calendarDate = new Date(model.calendarDate.getFullYear(),model.calendarDate.getMonth()+1*direction,1);
      }
      var from = new Date(model.calendarDate.getFullYear(),model.calendarDate.getMonth()-1,22); // make sure the last /
      var to = new Date(model.calendarDate.getFullYear(),model.calendarDate.getMonth()+1,6);  // first week is covered
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
          model.pompidouEvents = model.orders.map(function(ord) {
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
          googleCalendarService.getGoogleEvents(from, to)
            .then(function(events) {
              model.googleEvents = events.items.map(function(item) {
                return {
                  title: 'אירוע חיצוני: '+item.summary,
                  color: calendarConfig.colorTypes.special,
                  startsAt: item.start.date ? new Date(item.start.date+' 0:0') : new Date(item.start.dateTime),
                  endsAt: item.end.date ? new Date(new Date(item.end.date+' 0:0')-1) : new Date(item.end.dateTime),
                  allDay: item.start.date // if he used date instead of dateTime its a whole day
                };
              });
             model.setShowGoogleEvents();
            });
        });
    };

    model.eventClicked = function(calendarEvent) {
      if (calendarEvent.orderId) {
        $state.go('editOrder', {'id': calendarEvent.orderId});
      }
    };

    model.cellClicked = function(calendarDate,calendarCell) {
      //console.log('cell clicked');
      //console.log(calendarDate);
      //console.log(calendarCell);

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

    // initialize access to google calendar
    googleCalendarService.authenticateIfAuthorized()
      .then(function(isAuthorized) {
        if (isAuthorized) {
          googleCalendarService.authorize()
            .then(function() {
              model.setMonth(0);
            });
        }
      });
  });
