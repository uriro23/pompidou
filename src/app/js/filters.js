'use strict';

/* Filters */

angular.module('myApp').
  filter('interpolate', ['version', function (version) {
    return function (text) {
      return String(text).replace(/\%VERSION\%/mg, version);
    }
  }])
  .filter('checkMark', function () {
    return function (input) {
      return input ? '\u2713' : ' ';
    };
  })

    //source: http://stackoverflow.com/questions/30100124/angularjs-display-timestamp-date-in-different-timezones
  .filter('formatTime', function() {
    return function(input, format) {
     // check to make sure a moment object was passed
      if (!moment.isMoment(input)) {
        // do nothing
        return input;
      } else {
        return input.format(format);
      }
    };
  })

  //source: http://stackoverflow.com/questions/30100124/angularjs-display-timestamp-date-in-different-timezones
  .filter('convertTimezone', function() {
    return function(input, timezone) {
      var output;
      if (!input) {
        return undefined;
      }
     output = angular.copy(input).tz(timezone);
     if (moment.isMoment(output)) {
        return output;
      } else {
        console.log('bad event date or time');
        console.log(input);
        return input;
      }
    };
  });

