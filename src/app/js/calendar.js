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
      if (model.isGoogleCalendarAvailable && model.isShowGoogleEvents) {
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
            return ord.properties.orderStatus !== 6 // don't show canceled events
              && !ord.properties.template           // don't show templates
              && (ord.properties.eventDate>new Date() || ord.properties.orderStatus !== 1); // don't show past 'new' events
          });
          model.orders.forEach(function(ord) {
            ord.view = {
              customer: customerNames.filter(function(cust) {
                return cust.id===ord.properties.customer;
              })[0],
              orderStatus: lov.orderStatuses.filter(function(os) {
                return os.id===ord.properties.orderStatus
              })[0]
            }
          });
          model.pompidouEvents = model.orders.map(function(ord) {
            var d = new Date(
              ord.properties.eventDate.getFullYear(),
              ord.properties.eventDate.getMonth(),
              ord.properties.eventDate.getDate(),
              ord.properties.eventTime?ord.properties.eventTime.getHours():12,
              ord.properties.eventTime?ord.properties.eventTime.getMinutes():0
            );
            return {
              title: 'אירוע ' + ord.properties.number + ': סטטוס ' + ord.view.orderStatus.name + ', לקוח '
              + ord.view.customer.name + ', '
              + ord.properties.noOfParticipants + ' משתתפים, '
              + 'סכום ' + ord.properties.header.total + ' ש"ח',
              color: ord.properties.orderStatus === 1 ? calendarConfig.colorTypes.info :
                ord.properties.orderStatus === 2 ? calendarConfig.colorTypes.warning :
                  calendarConfig.colorTypes.success,
              startsAt: d,
              endsAt: new Date(moment(d).add(1, 'hour')),
              orderId: ord.id
            }
          });
          if(model.isGoogleCalendarAvailable) {
            googleCalendarService.getGoogleEvents(from, to)
              .then(function (events) {
                console.log('returned '+events.items.length+' google events');
                model.googleEvents = events.items.map(function (item) {
                  return {
                    title: 'אירוע חיצוני: ' + item.summary,
                    color: calendarConfig.colorTypes.special,
                    startsAt: item.start.date ? new Date(item.start.date + ' 0:0') : new Date(item.start.dateTime),
                    endsAt: item.end.date ? new Date(new Date(item.end.date + ' 0:0') - 1) : new Date(item.end.dateTime),
                    allDay: item.start.date // if he used date instead of dateTime its a whole day
                  };
                });
                model.setShowGoogleEvents();
              });
          } else {
            model.setShowGoogleEvents();
          }
        });
    };

    model.eventClicked = function(calendarEvent) {
      if (calendarEvent.orderId) {
        $state.go('editOrder', {'id': calendarEvent.orderId, isFromNew: 0});
      }
    };

    model.cellClicked = function(calendarDate,calendarCell) {
    };

    // main block

    model.calendarView = 'month';
    model.calendarDate = new Date();

    var customerNames = customers.map(function(cust) {
      var name = '';
      if (cust.properties.firstName) {
        name+=cust.properties.firstName;
      }
      if (cust.properties.lastName) {
        name+=' ';
        name+=cust.properties.lastName;
      }
      return {
        id: cust.id,
        name: name
      }
    });

    // initialize access to google calendar
    model.isGoogleCalendarAvailable = false;
    model.setMonth(0);  // if google calendar initialization hangs, we still get local events
    googleCalendarService.authenticateIfAuthorized()
      .then(function(isAuthorized) {
         if (isAuthorized) {
          googleCalendarService.authorize()
            .then(function() {
              model.isGoogleCalendarAvailable = true;
              console.log('authorize succeeded');
              model.setMonth(0);
            }, function() {
              console.log('authorize failed');
              model.setMonth(0);
            });
        } else {
           alert('לא ניתן להתחבר ליומן האירועים החיצוניים'+'\n'+'היכנס לחשבון gmail ונסה מחדש');
           model.setMonth(0);
         }
      }, function() {
        console.log('authenticateIfAuthorized failed');
        model.setMonth(0);
      });
  });
