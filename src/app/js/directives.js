'use strict';

/* Directives */


angular.module('myApp').
  directive('appVersion', ['version', function (version) {
    return function (scope, elm, attrs) {
      elm.text(version);
    };
  }])

  /*
   Source: github/fiestah/angular-money-directive
   This directive validates monetary inputs in "42.53" format (some additional work is needed for "32,00" European formats).
   Note that this is not designed to work with currency symbols. It largely behaves like Angular's implementation of type="number".

   It does a few things:

   Prevents entering non-numeric characters
   Prevents entering the minus sign when min >= 0
   Supports min and max like in <input type="number">
   Rounds the model value by precision, e.g. 42.219 will be rounded to 42.22 by default
   On blur, the input field is auto-formatted. Say if you enter 42, it will be formatted to 42.00
   */
  .directive('money', function () {
    'use strict';

    var NUMBER_REGEXP = /^\s*(\-|\+)?(\d+|(\d*(\.\d*)))\s*$/;

    function link(scope, el, attrs, ngModelCtrl) {
      var min = parseFloat(attrs.min || 0);
      var precision = parseFloat(attrs.precision || 2);
      var lastValidValue;

      function round(num) {
        var d = Math.pow(10, precision);
        return Math.round(num * d) / d;
      }

      function formatPrecision(value) {
        return parseFloat(value).toFixed(precision);
      }

      function formatViewValue(value) {
        return ngModelCtrl.$isEmpty(value) ? '' : '' + value;
      }


      ngModelCtrl.$parsers.push(function (value) {
        if (angular.isUndefined(value)) {
          value = '';
        }

        // Handle leading decimal point, like ".5"
        if (value.indexOf('.') === 0) {
          value = '0' + value;
        }

        // Allow "-" inputs only when min < 0
        if (value.indexOf('-') === 0) {
          if (min >= 0) {
            value = null;
            ngModelCtrl.$setViewValue('');
            ngModelCtrl.$render();
          } else if (value === '-') {
            value = '';
          }
        }

        var empty = ngModelCtrl.$isEmpty(value);
        if (empty || NUMBER_REGEXP.test(value)) {
          lastValidValue = (value === '')
            ? null
            : (empty ? value : parseFloat(value));
        } else {
          // Render the last valid input in the field
          ngModelCtrl.$setViewValue(formatViewValue(lastValidValue));
          ngModelCtrl.$render();
        }

        ngModelCtrl.$setValidity('number', true);
        return lastValidValue;
      });
      ngModelCtrl.$formatters.push(formatViewValue);

      var minValidator = function (value) {
        if (!ngModelCtrl.$isEmpty(value) && value < min) {
          ngModelCtrl.$setValidity('min', false);
          return undefined;
        } else {
          ngModelCtrl.$setValidity('min', true);
          return value;
        }
      };
      ngModelCtrl.$parsers.push(minValidator);
      ngModelCtrl.$formatters.push(minValidator);

      if (attrs.max) {
        var max = parseFloat(attrs.max);
        var maxValidator = function (value) {
          if (!ngModelCtrl.$isEmpty(value) && value > max) {
            ngModelCtrl.$setValidity('max', false);
            return undefined;
          } else {
            ngModelCtrl.$setValidity('max', true);
            return value;
          }
        };

        ngModelCtrl.$parsers.push(maxValidator);
        ngModelCtrl.$formatters.push(maxValidator);
      }

      // Round off
      if (precision > -1) {
        ngModelCtrl.$parsers.push(function (value) {
          return value ? round(value) : value;
        });
        ngModelCtrl.$formatters.push(function (value) {
          return value ? formatPrecision(value) : value;
        });
      }

      el.bind('blur', function () {
        var value = ngModelCtrl.$modelValue;
        if (value) {
          ngModelCtrl.$viewValue = formatPrecision(value);
          ngModelCtrl.$render();
        }
      });
    }

    return {
      restrict: 'A',
      require: 'ngModel',
      link: link
    };
  });
