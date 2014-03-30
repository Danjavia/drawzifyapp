'use strict';

// Declare app level module which depends on filters, and services
angular.module( 'myApp',
      [ 'myApp.config', 'myApp.routes', 'myApp.filters', 'myApp.services', 'myApp.directives', 'myApp.controllers',
         'simpleLoginTools', 'routeSecurity' ]
   )

   .run([ 'loginService', '$rootScope', 'FBURL', function( loginService, $rootScope, FBURL ) {
      if( FBURL === 'https://INSTANCE.firebaseio.com' ) {
         // double-check that the app has been configured
         angular.element( document.body ).html( '<h1>Please configure app/js/config.js before running!</h1>' );
         setTimeout( function() {
            angular.element( document.body ).removeClass( 'hide' );
         }, 250 );
      }
      else {
         // establish authentication
         $rootScope.auth = loginService.init( '/login' );
         $rootScope.FBURL = FBURL;
      }
   }]);
;'use strict';

// Declare app level module which depends on filters, and services
angular.module( 'myApp.config', [] )

   // version of this seed app is compatible with angularFire 0.6
   // see tags for other versions: https://github.com/firebase/angularFire-seed/tags
   .constant( 'version', '0.2' )

   // where to redirect users if they need to authenticate (see module.routeSecurity)
   .constant( 'loginRedirectPath', '/login' )

   // your Firebase URL goes here
   .constant( 'FBURL', 'https://drawzifyapp.firebaseio.com' )

   //you can use this one to try out a demo of the seed
//   .constant('FBURL', 'https://angularfire-seed.firebaseio.com');


/*********************
 * !!FOR E2E TESTING!!
 *
 * Must enable email/password logins and manually create
 * the test user before the e2e tests will pass
 *
 * user: test@test.com
 * pass: test123
 */
;'use strict';

/* Controllers */

angular.module( 'myApp.controllers', [] )
   .controller( 'HomeCtrl', [ '$scope', 'syncData', function( $scope, syncData ) {
      syncData( 'syncedValue' ).$bind( $scope, 'syncedValue' );
   }])

  .controller( 'ChatCtrl', [ '$scope', 'syncData', function( $scope, syncData ) {
      $scope.newMessage = null;

      // constrain number of messages by limit into syncData
      // add the array into $scope.messages
      $scope.messages = syncData( 'messages', 10 );

      // add new messages to the list
      $scope.addMessage = function() {
         if( $scope.newMessage ) {
            $scope.messages.$add({ text: $scope.newMessage });
            $scope.newMessage = null;
         }
      };
   }])

   .controller( 'LoginCtrl', [ '$scope', 'loginService', '$location', function( $scope, loginService, $location ) {
      $scope.email = null;
      $scope.pass = null;
      $scope.confirm = null;
      $scope.createMode = false;

      $scope.login = function( cb ) {
         $scope.err = null;
         if( ! $scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( ! $scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else {
            loginService.login( $scope.email, $scope.pass, function( err, user ) {
               $scope.err = err? err + '' : null;
               if( !err ) {
                  cb && cb( user );
               }
            });
         }
      };

      $scope.createAccount = function() {
         $scope.err = null;
         if( assertValidLoginAttempt() ) {
            loginService.createAccount( $scope.email, $scope.pass, function( err, user ) {
               if( err ) {
                  $scope.err = err? err + '' : null;
               }
               else {
                  // must be logged in before I can write to my profile
                  $scope.login( function() {
                     loginService.createProfile( user.uid, user.email );
                     $location.path( '/account' );
                  });
               }
            });
         }
      };

      function assertValidLoginAttempt() {
         if( ! $scope.email ) {
            $scope.err = 'Please enter an email address';
         }
         else if( ! $scope.pass ) {
            $scope.err = 'Please enter a password';
         }
         else if( $scope.pass !== $scope.confirm ) {
            $scope.err = 'Passwords do not match';
         }
         return ! $scope.err;
      }
   }])

   .controller( 'AccountCtrl', [ '$scope', 'loginService', 'changeEmailService', 'firebaseRef', 'syncData', '$location', 'FBURL', function( $scope, loginService, changeEmailService, firebaseRef, syncData, $location, FBURL ) {
      $scope.syncAccount = function() {
         $scope.user = {};
         syncData( [ 'users', $scope.auth.user.uid ] ).$bind( $scope, 'user' ).then( function( unBind ) {
            $scope.unBindAccount = unBind;
         });
      };
      // set initial binding
      $scope.syncAccount();

      $scope.logout = function() {
         loginService.logout();
      };

      $scope.oldpass = null;
      $scope.newpass = null;
      $scope.confirm = null;

      $scope.reset = function() {
         $scope.err = null;
         $scope.msg = null;
         $scope.emailerr = null;
         $scope.emailmsg = null;
      };

      $scope.updatePassword = function() {
         $scope.reset();
         loginService.changePassword( buildPwdParms() );
      };

      $scope.updateEmail = function() {
        $scope.reset();
        // disable bind to prevent junk data being left in firebase
        $scope.unBindAccount();
        changeEmailService( buildEmailParms() );
      };

      function buildPwdParms() {
         return {
            email: $scope.auth.user.email,
            oldpass: $scope.oldpass,
            newpass: $scope.newpass,
            confirm: $scope.confirm,
            callback: function( err ) {
               if( err ) {
                  $scope.err = err;
               }
               else {
                  $scope.oldpass = null;
                  $scope.newpass = null;
                  $scope.confirm = null;
                  $scope.msg = 'Password updated!';
               }
            }
         };
      }
      function buildEmailParms() {
         return {
            newEmail: $scope.newemail,
            pass: $scope.pass,
            callback: function( err ) {
               if( err ) {
                  $scope.emailerr = err;
                  // reinstate binding
                  $scope.syncAccount();
               }
               else {
                  // reinstate binding
                  $scope.syncAccount();
                  $scope.newemail = null;
                  $scope.pass = null;
                  $scope.emailmsg = 'Email updated!';
               }
            }
         };
      }

   }]);;'use strict';

/* Directives */


angular.module('myApp.directives', []).
  directive('appVersion', ['version', function(version) {
    return function(scope, elm, attrs) {
      elm.text(version);
    };
  }]);
;'use strict';

/* Filters */

angular.module('myApp.filters', [])
   .filter('interpolate', ['version', function(version) {
      return function(text) {
         return String(text).replace(/\%VERSION\%/mg, version);
      }
   }])

   .filter('reverse', function() {
      function toArray(list) {
         var k, out = [];
         if( list ) {
            if( angular.isArray(list) ) {
               out = list;
            }
            else if( typeof(list) === 'object' ) {
               for (k in list) {
                  if (list.hasOwnProperty(k)) { out.push(list[k]); }
               }
            }
         }
         return out;
      }
      return function(items) {
         return toArray(items).slice().reverse();
      };
   });
;(function(angular) {
   angular.module('routeSecurity', [])
      .run(['$injector', '$location', '$rootScope', 'loginRedirectPath', function($injector, $location, $rootScope, loginRedirectPath) {
         if( $injector.has('$route') ) {
            new RouteSecurityManager($location, $rootScope, $injector.get('$route'), loginRedirectPath);
         }
      }]);

   function RouteSecurityManager($location, $rootScope, $route, path) {
      this._route = $route;
      this._location = $location;
      this._rootScope = $rootScope;
      this._loginPath = path;
      this._redirectTo = null;
      this._authenticated = !!($rootScope.auth && $rootScope.auth.user);
      this._init();
   }

   RouteSecurityManager.prototype = {
      _init: function() {
         var self = this;
         this._checkCurrent();

         // Set up a handler for all future route changes, so we can check
         // if authentication is required.
         self._rootScope.$on("$routeChangeStart", function(e, next) {
            self._authRequiredRedirect(next, self._loginPath);
         });

         self._rootScope.$on('$firebaseSimpleLogin:login', angular.bind(this, this._login));
         self._rootScope.$on('$firebaseSimpleLogin:logout', angular.bind(this, this._logout));
         self._rootScope.$on('$firebaseSimpleLogin:error', angular.bind(this, this._error));
      },

      _checkCurrent: function() {
         // Check if the current page requires authentication.
         if (this._route.current) {
            this._authRequiredRedirect(this._route.current, this._loginPath);
         }
      },

      _login: function() {
         this._authenticated = true;
         if( this._redirectTo ) {
            this._redirect(this._redirectTo);
            this._redirectTo = null;
         }
         else if( this._location.path() === this._loginPath ) {
            this._location.replace();
            this._location.path('/');
         }
      },

      _logout: function() {
         this._authenticated = false;
         this._checkCurrent();
      },

      _error: function() {
         if( !this._rootScope.auth || !this._rootScope.auth.user ) {
            this._authenticated = false;
         }
         this._checkCurrent();
      },

      _redirect: function(path) {
         this._location.replace();
         this._location.path(path);
      },

      // A function to check whether the current path requires authentication,
      // and if so, whether a redirect to a login page is needed.
      _authRequiredRedirect: function(route, path) {
         if (route.authRequired && !this._authenticated){
            if (route.pathTo === undefined) {
               this._redirectTo = this._location.path();
            } else {
               this._redirectTo = route.pathTo === path ? "/" : route.pathTo;
            }
            this._redirect(path);
         }
         else if( this._authenticated && this._location.path() === this._loginPath ) {
            this._redirect('/');
         }
      }
   };
})(angular);
;'use strict';

/**
 * This module monitors angularFire's authentication and performs actions based on authentication state.
 * directives/directive.ngcloakauth.js depends on this file
 *
 * Modify ng-cloak to hide content until FirebaseSimpleLogin resolves. Also
 * provides ng-show-auth methods for displaying content only when certain login
 * states are active.
 *
 * Just like other ng-cloak ops, this works best if you put the following into your CSS:
 [ng\:cloak], [ng-cloak], [data-ng-cloak], [x-ng-cloak], .ng-cloak, .x-ng-cloak {
        display: none !important;
   }
 *
 * See usage examples here: https://gist.github.com/katowulf/7328023
 */
angular.module('simpleLoginTools', [])

/**
 * A service that returns a promise object, which is resolved once $firebaseSimpleLogin
 * is initialized.
 *
 * <code>
 *    function(waitForAuth) {
 *        waitForAuth.then(function() {
 *            console.log('auth initialized');
 *        });
 *    }
 * </code>
 */
  .service('waitForAuth', function($rootScope, $q, $timeout) {
    function fn(err) {
      if($rootScope.auth) {
        $rootScope.auth.error = err instanceof Error? err.toString() : null;
      }
      for(var i=0; i < subs.length; i++) { subs[i](); }
      $timeout(function() {
        // force $scope.$apply to be re-run after login resolves
        def.resolve();
      });
    }

    var def = $q.defer(), subs = [];
    subs.push($rootScope.$on('$firebaseSimpleLogin:login', fn));
    subs.push($rootScope.$on('$firebaseSimpleLogin:logout', fn));
    subs.push($rootScope.$on('$firebaseSimpleLogin:error', fn));
    return def.promise;
  })

/**
 * A directive that wraps ng-cloak so that, instead of simply waiting for Angular to compile, it waits until
 * waitForAuth resolves (in other words, until the user's login status resolves via Firebase)
 *
 * <code>
 *    <div ng-cloak>Authentication has resolved.</div>
 * </code>
 */
  .config(function($provide) {
    // adapt ng-cloak to wait for auth before it does its magic
    $provide.decorator('ngCloakDirective', function($delegate, waitForAuth) {
      var directive = $delegate[0];
      // make a copy of the old directive
      var _compile = directive.compile;
      directive.compile = function(element, attr) {
        waitForAuth.then(function() {
          // after auth, run the original ng-cloak directive
          _compile.call(directive, element, attr);
        });
      };
      // return the modified directive
      return $delegate;
    });
  })

/**
 * A directive that shows elements only when the given authentication state is in effect
 *
 * <code>
 *    <div ng-show-auth="login">{{auth.user.id}} is logged in</div>
 *    <div ng-show-auth="logout">Logged out</div>
 *    <div ng-show-auth="error">An error occurred: {{auth.error}}</div>
 *    <div ng-show-auth="logout,error">This appears for logout or for error condition!</div>
 * </code>
 */
  .directive('ngShowAuth', function ($rootScope) {
    var loginState = 'logout';
    $rootScope.$on('$firebaseSimpleLogin:login',  function() { loginState = 'login'; });
    $rootScope.$on('$firebaseSimpleLogin:logout', function() { loginState = 'logout'; });
    $rootScope.$on('$firebaseSimpleLogin:error',  function() { loginState = 'error'; });

    function getExpectedState(scope, attr) {
      var expState = scope.$eval(attr);
      if( typeof(expState) !== 'string' && !angular.isArray(expState) ) {
        expState = attr;
      }
      if( typeof(expState) === 'string' ) {
        expState = expState.split(',');
      }
      return expState;
    }

    function inList(needle, list) {
      var res = false;
      angular.forEach(list, function(x) {
        if( x === needle ) {
          res = true;
          return true;
        }
        return false;
      });
      return res;
    }

    function assertValidStates(states) {
      if( !states.length ) {
        throw new Error('ng-show-auth directive must be login, logout, or error (you may use a comma-separated list)');
      }
      angular.forEach(states, function(s) {
        if( !inList(s, ['login', 'logout', 'error']) ) {
          throw new Error('Invalid state "'+s+'" for ng-show-auth directive, must be one of login, logout, or error');
        }
      });
      return true;
    }

    return {
      restrict: 'A',
      link: function(scope, el, attr) {
        var expState = getExpectedState(scope, attr.ngShowAuth);
        assertValidStates(expState);
        function fn() {
          var show = inList(loginState, expState);
          // sometimes if ngCloak exists on same element, they argue, so make sure that
          // this one always runs last for reliability
          setTimeout(function() {
            el.toggleClass('ng-cloak', !show);
          }, 0);
        }
        fn();
        $rootScope.$on('$firebaseSimpleLogin:login',  fn);
        $rootScope.$on('$firebaseSimpleLogin:logout', fn);
        $rootScope.$on('$firebaseSimpleLogin:error',  fn);
      }
    };
  });;"use strict";

angular.module('myApp.routes', ['ngRoute'])

   // configure views; the authRequired parameter is used for specifying pages
   // which should only be available while logged in
   .config(['$routeProvider', function($routeProvider) {
      $routeProvider.when( '/home', {
         templateUrl: 'partials/home.html',
         controller: 'HomeCtrl'
      });

      $routeProvider.when( '/chat', {
         templateUrl: 'partials/chat.html',
         controller: 'ChatCtrl'
      });

      $routeProvider.when( '/account', {
         authRequired: true, // must authenticate before viewing this page
         templateUrl: 'partials/account.html',
         controller: 'AccountCtrl'
      });

      $routeProvider.when( '/login', {
         templateUrl: 'partials/login.html',
         controller: 'LoginCtrl'
      });

      $routeProvider.when( '/draw', {
         //authRequired: true, // must authenticate before viewing this page
         templateUrl: 'partials/draw.html',
         // controller: 'LoginCtrl'
      });

      $routeProvider.otherwise({ redirectTo: '/home'});
   }]);;angular.module('myApp.service.changeEmail', ['myApp.service.login', 'myApp.service.firebase'])
   .factory('changeEmailService', ['$rootScope', 'firebaseRef', '$timeout', '$q', 'loginService',
      function($rootScope, firebaseRef, $timeout, $q, loginService) {
         var auth = $rootScope.auth;
         return function(opts) {
            var cb = opts.callback || function() {};
            var oldUid = auth.user.uid;
            var oldEmail = auth.user.email;
            var oldProfile;
            var refProfile = firebaseRef('users', oldUid);

            // promise functions
            var authenticate = function() {
               var d = $q.defer();
               loginService.login(oldEmail, opts.pass, function(err, user) {
                  if (err) {
                     d.reject(err);
                  } else {
                     d.resolve();
                  }
               });
               return d.promise;
            };

            var loadOldProfile = function() {
               var d = $q.defer();
               refProfile.once('value',
                  function(snap){
                     oldProfile = snap.val();
                     // update user profile to have new email
                     oldProfile.email = opts.newEmail;
                     d.resolve();
                  },
                  function(err){
                     d.reject(err);
                  });
               return d.promise;
            };

            var createNewAccount = function() {
               var d = $q.defer();
               loginService.createAccount(opts.newEmail, opts.pass, function(err, user) {
                  if (err) {
                     d.reject(err);
                  } else {
                     d.resolve();
                  }
               });
               return d.promise;
            };

            var copyProfile = function() {
               var d = $q.defer();
               var refNewProfile = firebaseRef('users', auth.user.uid);
               refNewProfile.set(oldProfile, function(err) {
                  if (err) {
                     d.reject(err);
                  } else {
                     d.resolve();
                  }
               });
               return d.promise;
            };

            var removeOldProfile = function() {
               var d = $q.defer();
               refProfile.remove(function(err) {
                  if (err) {
                     d.reject(err);
                  } else {
                     d.resolve();
                  }
               });
               return d.promise;
            };

            var removeOldLogin = function() {
               var d = $q.defer();
               auth.$removeUser(oldEmail, opts.pass).then(function() {
                  d.resolve();
               }, function(err) {
                  d.reject(err);
               });
               return d.promise;
            };

            var errorFn = function(err) {
               $timeout(function() { cb(err); });
            };
            // execute activities in order; first we authenticate the user
            authenticate()
               // then we fetch old account details
               .then( loadOldProfile )
               // then we create a new account
               .then( createNewAccount )
               // then we copy old account info
               .then( copyProfile )
               // and once they safely exist, then we can delete the old ones
               .then( removeOldProfile )
               .then( removeOldLogin )
               // success
               .then( function() { cb && cb(null) }, cb )
               .catch( errorFn );
      };
   }]);;
angular.module('myApp.service.firebase', ['firebase'])

// a simple utility to create references to Firebase paths
   .factory('firebaseRef', ['Firebase', 'FBURL', function(Firebase, FBURL) {
      /**
       * @function
       * @name firebaseRef
       * @param {String|Array...} path
       * @return a Firebase instance
       */
      return function(path) {
         return new Firebase(pathRef([FBURL].concat(Array.prototype.slice.call(arguments))));
      }
   }])

   // a simple utility to create $firebase objects from angularFire
   .service('syncData', ['$firebase', 'firebaseRef', function($firebase, firebaseRef) {
      /**
       * @function
       * @name syncData
       * @param {String|Array...} path
       * @param {int} [limit]
       * @return a Firebase instance
       */
      return function(path, limit) {
         var ref = firebaseRef(path);
         limit && (ref = ref.limit(limit));
         return $firebase(ref);
      }
   }]);

function pathRef(args) {
   for(var i=0; i < args.length; i++) {
      if( typeof(args[i]) === 'object' ) {
         args[i] = pathRef(args[i]);
      }
   }
   return args.join('/');
};
angular.module('myApp.service.login', ['firebase', 'myApp.service.firebase'])

   .factory('loginService', ['$rootScope', '$firebaseSimpleLogin', 'firebaseRef', 'profileCreator', '$timeout',
      function($rootScope, $firebaseSimpleLogin, firebaseRef, profileCreator, $timeout) {
         var auth = null;
         return {
            init: function() {
               return auth = $firebaseSimpleLogin(firebaseRef());
            },

            /**
             * @param {string} email
             * @param {string} pass
             * @param {Function} [callback]
             * @returns {*}
             */
            login: function(email, pass, callback) {
               assertAuth();
               auth.$login('password', {
                  email: email,
                  password: pass,
                  rememberMe: true
               }).then(function(user) {
                     if( callback ) {
                        callback(null, user);
                     }
                  }, callback);
            },

            logout: function() {
               assertAuth();
               auth.$logout();
            },

            changePassword: function(opts) {
               assertAuth();
               var cb = opts.callback || function() {};
               if( !opts.oldpass || !opts.newpass ) {
                  $timeout(function(){ cb('Please enter a password'); });
               }
               else if( opts.newpass !== opts.confirm ) {
                  $timeout(function() { cb('Passwords do not match'); });
               }
               else {
                  auth.$changePassword(opts.email, opts.oldpass, opts.newpass).then(function() { cb && cb(null) }, cb);
               }
            },

            createAccount: function(email, pass, callback) {
               assertAuth();
               auth.$createUser(email, pass).then(function(user) { callback && callback(null, user) }, callback);
            },

            createProfile: profileCreator
         };

         function assertAuth() {
            if( auth === null ) { throw new Error('Must call loginService.init() before using its methods'); }
         }
      }])

   .factory('profileCreator', ['firebaseRef', '$timeout', function(firebaseRef, $timeout) {
      return function(id, email, callback) {
         firebaseRef('users/'+id).set({email: email, name: firstPartOfEmail(email)}, function(err) {
            //err && console.error(err);
            if( callback ) {
               $timeout(function() {
                  callback(err);
               })
            }
         });

         function firstPartOfEmail(email) {
            return ucfirst(email.substr(0, email.indexOf('@'))||'');
         }

         function ucfirst (str) {
            // credits: http://kevin.vanzonneveld.net
            str += '';
            var f = str.charAt(0).toUpperCase();
            return f + str.substr(1);
         }
      }
   }]);
;(function() {
   'use strict';

   /* Services */

   angular.module('myApp.services', ['myApp.service.login', 'myApp.service.firebase', 'myApp.service.changeEmail'])

      // put your services here!
      // .service('serviceName', ['dependency', function(dependency) {}]);

})();

;//creamos el modulo y lo asignamos a app, para evitar escribir 
//cada vez angular.module("app"); que sería el getter
//angular.module("app", []); es el setter
var app = angular.module("app", []);
 
//realizamos la configuración del enrutado dependiendo de la url
//con el objeto $routeProvider haciendo uso de when
//en este caso, cuando estemos en la página principal, le decimos que
//cargue el archivo templates/index.html y que haga uso del controlador
//indexController, así en todos los casos
app.config(function($routeProvider){
    $routeProvider.when("/", {
        templateUrl : "../../../templates/index.html",
        controller : "indexController"
    })
    .when("/home", {
        templateUrl : "../../../templates/view.html",
        controller : "homeController"
    })
    .when("/login", {
        templateUrl : "templates/login.html",
        controller : "loginController"
    })
    //este es digamos, al igual que en un switch el default, en caso que 
    //no hayamos concretado que nos redirija a la página principal
    .otherwise({ reditrectTo : "/" });
});//desde aquí hacemos uso del objeto app que es nuestro modulo
//y de esta forma creamos un controlador, en este caso el controlador indexController,
//como vemos, hacemos uso de scope y sencillamente creamos un array y colocamos 
//dos objetos dentro de él
app.controller("indexController", function indexController($scope){
    $scope.usuarios = [
        {
            nombre : "Israel Parra",
            web : "http://uno-de-piera.com",
            edad : "32 años",
            profesion : "programador web"
        },
        {
            nombre : "Pepito",
            web : "http://pepito.com",
            edad : "? años",
            profesion : "vender palotes!"
        }
    ]
})
 
//más de lo mismo, pero en este caso creamos una variable llamada saludo y una función
//que gracias al objeto location y al método url nos redirigirá al login al hacer uso de ella
app.controller("homeController", function homeController($scope, $location){
    $scope.saludo = "Hola desde el controlador home";
    $scope.toLogin = function(){
        $location.url("/login");
    }
});
 
app.controller("loginController", function loginController($scope, $location){
    $scope.saludo = "Hola desde el controlador login";
    $scope.toHome = function(){
        $location.url("/home");
    }
});/**
 *
 * Color picker
 * Author: Stefan Petre www.eyecon.ro
 * 
 * Dual licensed under the MIT and GPL licenses
 * 
 */
(function ($) {
	var ColorPicker = function () {
		var
			ids = {},
			inAction,
			charMin = 65,
			visible,
			tpl = '<div class="colorpicker"><div class="colorpicker_color"><div><div></div></div></div><div class="colorpicker_hue"><div></div></div><div class="colorpicker_new_color"></div><div class="colorpicker_current_color"></div><div class="colorpicker_hex"><input type="text" maxlength="6" size="6" /></div><div class="colorpicker_rgb_r colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_rgb_g colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_rgb_b colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_h colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_s colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_hsb_b colorpicker_field"><input type="text" maxlength="3" size="3" /><span></span></div><div class="colorpicker_submit"></div></div>',
			defaults = {
				eventName: 'click',
				onShow: function () {},
				onBeforeShow: function(){},
				onHide: function () {},
				onChange: function () {},
				onSubmit: function () {},
				color: 'ff0000',
				livePreview: true,
				flat: false
			},
			fillRGBFields = function  (hsb, cal) {
				var rgb = HSBToRGB(hsb);
				$(cal).data('colorpicker').fields
					.eq(1).val(rgb.r).end()
					.eq(2).val(rgb.g).end()
					.eq(3).val(rgb.b).end();
			},
			fillHSBFields = function  (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(4).val(hsb.h).end()
					.eq(5).val(hsb.s).end()
					.eq(6).val(hsb.b).end();
			},
			fillHexFields = function (hsb, cal) {
				$(cal).data('colorpicker').fields
					.eq(0).val(HSBToHex(hsb)).end();
			},
			setSelector = function (hsb, cal) {
				$(cal).data('colorpicker').selector.css('backgroundColor', '#' + HSBToHex({h: hsb.h, s: 100, b: 100}));
				$(cal).data('colorpicker').selectorIndic.css({
					left: parseInt(150 * hsb.s/100, 10),
					top: parseInt(150 * (100-hsb.b)/100, 10)
				});
			},
			setHue = function (hsb, cal) {
				$(cal).data('colorpicker').hue.css('top', parseInt(150 - 150 * hsb.h/360, 10));
			},
			setCurrentColor = function (hsb, cal) {
				$(cal).data('colorpicker').currentColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			setNewColor = function (hsb, cal) {
				$(cal).data('colorpicker').newColor.css('backgroundColor', '#' + HSBToHex(hsb));
			},
			keyDown = function (ev) {
				var pressedKey = ev.charCode || ev.keyCode || -1;
				if ((pressedKey > charMin && pressedKey <= 90) || pressedKey == 32) {
					return false;
				}
				var cal = $(this).parent().parent();
				if (cal.data('colorpicker').livePreview === true) {
					change.apply(this);
				}
			},
			change = function (ev) {
				var cal = $(this).parent().parent(), col;
				if (this.parentNode.className.indexOf('_hex') > 0) {
					cal.data('colorpicker').color = col = HexToHSB(fixHex(this.value));
				} else if (this.parentNode.className.indexOf('_hsb') > 0) {
					cal.data('colorpicker').color = col = fixHSB({
						h: parseInt(cal.data('colorpicker').fields.eq(4).val(), 10),
						s: parseInt(cal.data('colorpicker').fields.eq(5).val(), 10),
						b: parseInt(cal.data('colorpicker').fields.eq(6).val(), 10)
					});
				} else {
					cal.data('colorpicker').color = col = RGBToHSB(fixRGB({
						r: parseInt(cal.data('colorpicker').fields.eq(1).val(), 10),
						g: parseInt(cal.data('colorpicker').fields.eq(2).val(), 10),
						b: parseInt(cal.data('colorpicker').fields.eq(3).val(), 10)
					}));
				}
				if (ev) {
					fillRGBFields(col, cal.get(0));
					fillHexFields(col, cal.get(0));
					fillHSBFields(col, cal.get(0));
				}
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
				cal.data('colorpicker').onChange.apply(cal, [col, HSBToHex(col), HSBToRGB(col)]);
			},
			blur = function (ev) {
				var cal = $(this).parent().parent();
				cal.data('colorpicker').fields.parent().removeClass('colorpicker_focus');
			},
			focus = function () {
				charMin = this.parentNode.className.indexOf('_hex') > 0 ? 70 : 65;
				$(this).parent().parent().data('colorpicker').fields.parent().removeClass('colorpicker_focus');
				$(this).parent().addClass('colorpicker_focus');
			},
			downIncrement = function (ev) {
				var field = $(this).parent().find('input').focus();
				var current = {
					el: $(this).parent().addClass('colorpicker_slider'),
					max: this.parentNode.className.indexOf('_hsb_h') > 0 ? 360 : (this.parentNode.className.indexOf('_hsb') > 0 ? 100 : 255),
					y: ev.pageY,
					field: field,
					val: parseInt(field.val(), 10),
					preview: $(this).parent().parent().data('colorpicker').livePreview					
				};
				$(document).bind('mouseup', current, upIncrement);
				$(document).bind('mousemove', current, moveIncrement);
			},
			moveIncrement = function (ev) {
				ev.data.field.val(Math.max(0, Math.min(ev.data.max, parseInt(ev.data.val + ev.pageY - ev.data.y, 10))));
				if (ev.data.preview) {
					change.apply(ev.data.field.get(0), [true]);
				}
				return false;
			},
			upIncrement = function (ev) {
				change.apply(ev.data.field.get(0), [true]);
				ev.data.el.removeClass('colorpicker_slider').find('input').focus();
				$(document).unbind('mouseup', upIncrement);
				$(document).unbind('mousemove', moveIncrement);
				return false;
			},
			downHue = function (ev) {
				var current = {
					cal: $(this).parent(),
					y: $(this).offset().top
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upHue);
				$(document).bind('mousemove', current, moveHue);
			},
			moveHue = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(4)
						.val(parseInt(360*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.y))))/150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			upHue = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upHue);
				$(document).unbind('mousemove', moveHue);
				return false;
			},
			downSelector = function (ev) {
				var current = {
					cal: $(this).parent(),
					pos: $(this).offset()
				};
				current.preview = current.cal.data('colorpicker').livePreview;
				$(document).bind('mouseup', current, upSelector);
				$(document).bind('mousemove', current, moveSelector);
			},
			moveSelector = function (ev) {
				change.apply(
					ev.data.cal.data('colorpicker')
						.fields
						.eq(6)
						.val(parseInt(100*(150 - Math.max(0,Math.min(150,(ev.pageY - ev.data.pos.top))))/150, 10))
						.end()
						.eq(5)
						.val(parseInt(100*(Math.max(0,Math.min(150,(ev.pageX - ev.data.pos.left))))/150, 10))
						.get(0),
					[ev.data.preview]
				);
				return false;
			},
			upSelector = function (ev) {
				fillRGBFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				fillHexFields(ev.data.cal.data('colorpicker').color, ev.data.cal.get(0));
				$(document).unbind('mouseup', upSelector);
				$(document).unbind('mousemove', moveSelector);
				return false;
			},
			enterSubmit = function (ev) {
				$(this).addClass('colorpicker_focus');
			},
			leaveSubmit = function (ev) {
				$(this).removeClass('colorpicker_focus');
			},
			clickSubmit = function (ev) {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').color;
				cal.data('colorpicker').origColor = col;
				setCurrentColor(col, cal.get(0));
				cal.data('colorpicker').onSubmit(col, HSBToHex(col), HSBToRGB(col), cal.data('colorpicker').el);
			},
			show = function (ev) {
				var cal = $('#' + $(this).data('colorpickerId'));
				cal.data('colorpicker').onBeforeShow.apply(this, [cal.get(0)]);
				var pos = $(this).offset();
				var viewPort = getViewport();
				var top = pos.top + this.offsetHeight;
				var left = pos.left;
				if (top + 176 > viewPort.t + viewPort.h) {
					top -= this.offsetHeight + 176;
				}
				if (left + 356 > viewPort.l + viewPort.w) {
					left -= 356;
				}
				cal.css({left: left + 'px', top: top + 'px'});
				if (cal.data('colorpicker').onShow.apply(this, [cal.get(0)]) != false) {
					cal.show();
				}
				$(document).bind('mousedown', {cal: cal}, hide);
				return false;
			},
			hide = function (ev) {
				if (!isChildOf(ev.data.cal.get(0), ev.target, ev.data.cal.get(0))) {
					if (ev.data.cal.data('colorpicker').onHide.apply(this, [ev.data.cal.get(0)]) != false) {
						ev.data.cal.hide();
					}
					$(document).unbind('mousedown', hide);
				}
			},
			isChildOf = function(parentEl, el, container) {
				if (parentEl == el) {
					return true;
				}
				if (parentEl.contains) {
					return parentEl.contains(el);
				}
				if ( parentEl.compareDocumentPosition ) {
					return !!(parentEl.compareDocumentPosition(el) & 16);
				}
				var prEl = el.parentNode;
				while(prEl && prEl != container) {
					if (prEl == parentEl)
						return true;
					prEl = prEl.parentNode;
				}
				return false;
			},
			getViewport = function () {
				var m = document.compatMode == 'CSS1Compat';
				return {
					l : window.pageXOffset || (m ? document.documentElement.scrollLeft : document.body.scrollLeft),
					t : window.pageYOffset || (m ? document.documentElement.scrollTop : document.body.scrollTop),
					w : window.innerWidth || (m ? document.documentElement.clientWidth : document.body.clientWidth),
					h : window.innerHeight || (m ? document.documentElement.clientHeight : document.body.clientHeight)
				};
			},
			fixHSB = function (hsb) {
				return {
					h: Math.min(360, Math.max(0, hsb.h)),
					s: Math.min(100, Math.max(0, hsb.s)),
					b: Math.min(100, Math.max(0, hsb.b))
				};
			}, 
			fixRGB = function (rgb) {
				return {
					r: Math.min(255, Math.max(0, rgb.r)),
					g: Math.min(255, Math.max(0, rgb.g)),
					b: Math.min(255, Math.max(0, rgb.b))
				};
			},
			fixHex = function (hex) {
				var len = 6 - hex.length;
				if (len > 0) {
					var o = [];
					for (var i=0; i<len; i++) {
						o.push('0');
					}
					o.push(hex);
					hex = o.join('');
				}
				return hex;
			}, 
			HexToRGB = function (hex) {
				var hex = parseInt(((hex.indexOf('#') > -1) ? hex.substring(1) : hex), 16);
				return {r: hex >> 16, g: (hex & 0x00FF00) >> 8, b: (hex & 0x0000FF)};
			},
			HexToHSB = function (hex) {
				return RGBToHSB(HexToRGB(hex));
			},
			RGBToHSB = function (rgb) {
				var hsb = {
					h: 0,
					s: 0,
					b: 0
				};
				var min = Math.min(rgb.r, rgb.g, rgb.b);
				var max = Math.max(rgb.r, rgb.g, rgb.b);
				var delta = max - min;
				hsb.b = max;
				if (max != 0) {
					
				}
				hsb.s = max != 0 ? 255 * delta / max : 0;
				if (hsb.s != 0) {
					if (rgb.r == max) {
						hsb.h = (rgb.g - rgb.b) / delta;
					} else if (rgb.g == max) {
						hsb.h = 2 + (rgb.b - rgb.r) / delta;
					} else {
						hsb.h = 4 + (rgb.r - rgb.g) / delta;
					}
				} else {
					hsb.h = -1;
				}
				hsb.h *= 60;
				if (hsb.h < 0) {
					hsb.h += 360;
				}
				hsb.s *= 100/255;
				hsb.b *= 100/255;
				return hsb;
			},
			HSBToRGB = function (hsb) {
				var rgb = {};
				var h = Math.round(hsb.h);
				var s = Math.round(hsb.s*255/100);
				var v = Math.round(hsb.b*255/100);
				if(s == 0) {
					rgb.r = rgb.g = rgb.b = v;
				} else {
					var t1 = v;
					var t2 = (255-s)*v/255;
					var t3 = (t1-t2)*(h%60)/60;
					if(h==360) h = 0;
					if(h<60) {rgb.r=t1;	rgb.b=t2; rgb.g=t2+t3}
					else if(h<120) {rgb.g=t1; rgb.b=t2;	rgb.r=t1-t3}
					else if(h<180) {rgb.g=t1; rgb.r=t2;	rgb.b=t2+t3}
					else if(h<240) {rgb.b=t1; rgb.r=t2;	rgb.g=t1-t3}
					else if(h<300) {rgb.b=t1; rgb.g=t2;	rgb.r=t2+t3}
					else if(h<360) {rgb.r=t1; rgb.g=t2;	rgb.b=t1-t3}
					else {rgb.r=0; rgb.g=0;	rgb.b=0}
				}
				return {r:Math.round(rgb.r), g:Math.round(rgb.g), b:Math.round(rgb.b)};
			},
			RGBToHex = function (rgb) {
				var hex = [
					rgb.r.toString(16),
					rgb.g.toString(16),
					rgb.b.toString(16)
				];
				$.each(hex, function (nr, val) {
					if (val.length == 1) {
						hex[nr] = '0' + val;
					}
				});
				return hex.join('');
			},
			HSBToHex = function (hsb) {
				return RGBToHex(HSBToRGB(hsb));
			},
			restoreOriginal = function () {
				var cal = $(this).parent();
				var col = cal.data('colorpicker').origColor;
				cal.data('colorpicker').color = col;
				fillRGBFields(col, cal.get(0));
				fillHexFields(col, cal.get(0));
				fillHSBFields(col, cal.get(0));
				setSelector(col, cal.get(0));
				setHue(col, cal.get(0));
				setNewColor(col, cal.get(0));
			};
		return {
			init: function (opt) {
				opt = $.extend({}, defaults, opt||{});
				if (typeof opt.color == 'string') {
					opt.color = HexToHSB(opt.color);
				} else if (opt.color.r != undefined && opt.color.g != undefined && opt.color.b != undefined) {
					opt.color = RGBToHSB(opt.color);
				} else if (opt.color.h != undefined && opt.color.s != undefined && opt.color.b != undefined) {
					opt.color = fixHSB(opt.color);
				} else {
					return this;
				}
				return this.each(function () {
					if (!$(this).data('colorpickerId')) {
						var options = $.extend({}, opt);
						options.origColor = opt.color;
						var id = 'collorpicker_' + parseInt(Math.random() * 1000);
						$(this).data('colorpickerId', id);
						var cal = $(tpl).attr('id', id);
						if (options.flat) {
							cal.appendTo(this).show();
						} else {
							cal.appendTo(document.body);
						}
						options.fields = cal
											.find('input')
												.bind('keyup', keyDown)
												.bind('change', change)
												.bind('blur', blur)
												.bind('focus', focus);
						cal
							.find('span').bind('mousedown', downIncrement).end()
							.find('>div.colorpicker_current_color').bind('click', restoreOriginal);
						options.selector = cal.find('div.colorpicker_color').bind('mousedown', downSelector);
						options.selectorIndic = options.selector.find('div div');
						options.el = this;
						options.hue = cal.find('div.colorpicker_hue div');
						cal.find('div.colorpicker_hue').bind('mousedown', downHue);
						options.newColor = cal.find('div.colorpicker_new_color');
						options.currentColor = cal.find('div.colorpicker_current_color');
						cal.data('colorpicker', options);
						cal.find('div.colorpicker_submit')
							.bind('mouseenter', enterSubmit)
							.bind('mouseleave', leaveSubmit)
							.bind('click', clickSubmit);
						fillRGBFields(options.color, cal.get(0));
						fillHSBFields(options.color, cal.get(0));
						fillHexFields(options.color, cal.get(0));
						setHue(options.color, cal.get(0));
						setSelector(options.color, cal.get(0));
						setCurrentColor(options.color, cal.get(0));
						setNewColor(options.color, cal.get(0));
						if (options.flat) {
							cal.css({
								position: 'relative',
								display: 'block'
							});
						} else {
							$(this).bind(options.eventName, show);
						}
					}
				});
			},
			showPicker: function() {
				return this.each( function () {
					if ($(this).data('colorpickerId')) {
						show.apply(this);
					}
				});
			},
			hidePicker: function() {
				return this.each( function () {
					if ($(this).data('colorpickerId')) {
						$('#' + $(this).data('colorpickerId')).hide();
					}
				});
			},
			setColor: function(col) {
				if (typeof col == 'string') {
					col = HexToHSB(col);
				} else if (col.r != undefined && col.g != undefined && col.b != undefined) {
					col = RGBToHSB(col);
				} else if (col.h != undefined && col.s != undefined && col.b != undefined) {
					col = fixHSB(col);
				} else {
					return this;
				}
				return this.each(function(){
					if ($(this).data('colorpickerId')) {
						var cal = $('#' + $(this).data('colorpickerId'));
						cal.data('colorpicker').color = col;
						cal.data('colorpicker').origColor = col;
						fillRGBFields(col, cal.get(0));
						fillHSBFields(col, cal.get(0));
						fillHexFields(col, cal.get(0));
						setHue(col, cal.get(0));
						setSelector(col, cal.get(0));
						setCurrentColor(col, cal.get(0));
						setNewColor(col, cal.get(0));
					}
				});
			}
		};
	}();
	$.fn.extend({
		ColorPicker: ColorPicker.init,
		ColorPickerHide: ColorPicker.hidePicker,
		ColorPickerShow: ColorPicker.showPicker,
		ColorPickerSetColor: ColorPicker.setColor
	});
})(jQuery);/* 
 * Context.js
 * Copyright Jacob Kelley
 * MIT License
 */

var context = context || (function () {
    
	var options = {
		fadeSpeed: 100,
		filter: function ($obj) {
			// Modify $obj, Do not return
		},
		above: 'auto',
		preventDoubleContext: true,
		compress: false
	};

	function initialize(opts) {
		
		options = jQuery.extend({}, options, opts);
		
		jQuery(document).on('click', 'html', function () {
			jQuery('.dropdown-context').fadeOut(options.fadeSpeed, function(){
				jQuery('.dropdown-context').css({display:''}).find('.drop-left').removeClass('drop-left');
			});
		});
		if(options.preventDoubleContext){
			jQuery(document).on('contextmenu', '.dropdown-context', function (e) {
				e.preventDefault();
			});
		}
		jQuery(document).on('mouseenter', '.dropdown-submenu', function(){
			var $sub = jQuery(this).find('.dropdown-context-sub:first'),
			subWidth = $sub.width(),
			subLeft = $sub.offset().left,
			collision = (subWidth+subLeft) > window.innerWidth;
			if(collision){
				$sub.addClass('drop-left');
			}
		});
		
	}

	function updateOptions(opts){
		options = jQuery.extend({}, options, opts);
	}

	function buildMenu(data, id, subMenu) {
		var subClass = (subMenu) ? ' dropdown-context-sub' : '',
			compressed = options.compress ? ' compressed-context' : '',
			$menu = jQuery('<ul class="dropdown-menu dropdown-context' + subClass + compressed+'" id="dropdown-' + id + '"></ul>');
        var i = 0, linkTarget = '';
        for(i; i<data.length; i++) {
        	if (typeof data[i].divider !== 'undefined') {
				$menu.append('<li class="divider"></li>');
			} else if (typeof data[i].header !== 'undefined') {
				$menu.append('<li class="nav-header">' + data[i].header + '</li>');
			} else {
				if (typeof data[i].href == 'undefined') {
					data[i].href = '#';
				}
				if (typeof data[i].target !== 'undefined') {
					linkTarget = ' target="'+data[i].target+'"';
				}
				if (typeof data[i].subMenu !== 'undefined') {
					$sub = ('<li class="dropdown-submenu"><a tabindex="-1" href="' + data[i].href + '">' + data[i].text + '</a></li>');
				} else {
					$sub = jQuery('<li><a tabindex="-1" href="' + data[i].href + '"'+linkTarget+'>' + data[i].text + '</a></li>');
				}
				if (typeof data[i].action !== 'undefined') {
					var actiond = new Date(),
						actionID = 'event-' + actiond.getTime() * Math.floor(Math.random()*100000),
						eventAction = data[i].action;
					$sub.find('a').attr('id', actionID);
					jQuery('#' + actionID).addClass('context-event');
					jQuery(document).on('click', '#' + actionID, eventAction);
				}
				$menu.append($sub);
				if (typeof data[i].subMenu != 'undefined') {
					var subMenuData = buildMenu(data[i].subMenu, id, true);
					$menu.find('li:last').append(subMenuData);
				}
			}
			if (typeof options.filter == 'function') {
				options.filter($menu.find('li:last'));
			}
		}
		return $menu;
	}

	function addContext(selector, data) {
		
		var d = new Date(),
			id = d.getTime(),
			$menu = buildMenu(data, id);
			
		jQuery('body').append($menu);
		
		jQuery(document).on( 'contextmenu', selector, function (e) {
			e.preventDefault();
			e.stopPropagation();
			
			jQuery( '.dropdown-context:not(.dropdown-context-sub)' ).hide();
			
			$dd = jQuery( '#dropdown-' + id );
			if ( typeof options.above == 'boolean' && options.above ) {
				$dd.addClass('dropdown-context-down').css({
					top: e.pageY - 20 - $('#dropdown-' + id).height(),
					left: e.pageX - 13
				}).fadeIn(options.fadeSpeed);
			} else if ( typeof options.above == 'string' && options.above == 'auto' ) {
				$dd.removeClass('dropdown-context-down');
				var autoH = $dd.height() + 12;
				if ((e.pageY + autoH) > jQuery('html').height()) {
					$dd.addClass('dropdown-context-down').css({
						top: e.pageY + 105 - autoH,
						left: e.pageX + 10
					}).fadeIn(options.fadeSpeed);
				} else {
					$dd.css({
						top: e.pageY + 10,
						left: e.pageX - 13
					}).fadeIn(options.fadeSpeed);
				}
			}
		});
	}
	
	function destroyContext(selector) {
		$(document).off('contextmenu', selector).off('click', '.context-event');
	}
	
	return {
		init: initialize,
		settings: updateOptions,
		attach: addContext,
		destroy: destroyContext
	};
})();;/**
* Gillie 0.3
* Micro Framework
*
* MIT Licensed.
* (c) 2013, Pablo Vallejo - https://PabloVallejo.github.io/gillie
*
* Based on Simple JavaScript Inheritance by John Resig, Backbone, jQuery and Underscore.
*/
( function( $, window ) {

    var

        // Gillie version
        version = '0.3'

    ,   initializing = false
    ,   fnTest = /xyz/.test( function(){ xyz; }) ? /\b_super\b/ : /.*/

        // Base class implementation
    ,   Gillie = function() { }

        // Extend a given object with all the properties in passed-in object(s)
        // Adapted from underscore `extend`
        // https://github.com/jashkenas/underscore/blob/master/underscore.js#L786
    ,   _extend = function( obj ) {

            $.each( [].slice.call( arguments, 1 ), function( key, source ) {

                if ( source ) {
                    for ( var prop in source ) {
                        obj[ prop ] = source[ prop ];
                    }
                }
            });

            return obj;
        };


    // Gillie.Events,
    // Events API which can be used for triggering `trigger` and
    // listening `on` to events.
    // Adapted from `Backbone.Events`
    // https://github.com/jashkenas/backbone/blob/master/backbone.js#L69
    var Events = Gillie.Events = {

            // Bind to events.
            on: function( name, callback, context ) {

                if ( ! eventsApi( this, 'on', name, [ callback, context ] ) || ! callback ) return this;
                this._events || ( this._events = {} );

                var events = this._events[ name ] || ( this._events[ name ] = [] );
                events.push({ callback: callback, context: context, ctx: context || this });
                return this;
            }

            // Trigger the callbacks for the event or events that have been bound.
        ,   trigger: function( name ) {

                if ( ! this._events ) return this;
                var args = [].slice.call( arguments, 1 );
                if ( ! eventsApi( this, 'trigger', name, args ) ) return this;

                var events = this._events[ name ];
                if ( events ) triggerEvents( events, args );
                return this;
            }

    };

    // Regex to split words.
    var  eventSplitter = /\s+/

        // API for events.
    ,   eventsApi = function( obj, action, name, rest ) {

            if ( ! name ) return;

            // Handle event maps.
            //
            //   { evt1: handle, evt2: handle2 }
            //
            if ( typeof name === 'object' ) {
                for ( var key in name ) {
                    obj[ action ].apply( obj, [ key, name[key] ].concat( rest ) );
                }
                return false;
            }


            // Handle space separated event names 'event1 event2 ...'.
            if ( eventSplitter.test( name ) ) {
                var names = name.split( eventSplitter );

                for ( var i = 0, l = names.length; i < l; i++ ) {
                    obj[ action ].apply( obj, [ names[i] ].concat( rest ) );
                }
                return false;
            }

            return true;
        }

        // Trigger events
    ,   triggerEvents = function( events, args ) {

            var ev, i = -1, l = events.length, a1 = args[ 0 ], a2 = args[ 1 ], a3 = args[ 2 ];

            switch( args.length ) {

                case 0: while( ++i < l ) ( ev = events[ i ] ).callback.call( ev.ctx ); return;
                case 1: while( ++i < l ) ( ev = events[ i ] ).callback.call( ev.ctx, a1 ); return;
                case 2: while( ++i < l ) ( ev = events[ i ] ).callback.call( ev.ctx, a1, a2 ); return;
                case 3: while( ++i < l ) ( ev = events[ i ] ).callback.call( ev.ctx, a1, a2, a3 ); return;
                default: while( ++i < l ) ( ev = events[ i ] ).callback.apply( ev.ctx, args );
            }

        };

    var listenMethods = { on: 'listenTo' };

    // Inversion-of-control versions of `on` and `once`. Tell *this* object to
    // listen to an event in another object ... keeping track of what it's
    // listening to.
    $.each( listenMethods, function( implementation, method ) {

        Events[ method ] = function( obj, name, callback ) {

            var listeners = this._listeners || ( this._listeners = {} )
            ,   id = obj._listenerId || ( obj._listenerId = uniqueId( 'l' ) );

            listeners[ id ] = obj;
            if ( typeof name === 'object' ) callback = this;
            obj[ implementation ]( name, callback, this );

            return this;
        };

    });


    // Gillie.Handler
    // Handlers are used to listen for DOM events, get data from them
    // and then route that data to a controller, view or model.
    var Handler = Gillie.Handler = function( options ) {

            if ( this.initialize ) this.initialize.apply( this, arguments );
            this.delegateEvents();
        }

        // Regex to split keys for `delegate` method.
    ,   delegateEventSplitter = /^(\S+)\s*(.*)$/;


    _extend( Handler.prototype, Events, {

            // Create a function that bound to a given object.
            // Adapted from underscore `_.bind()`.
            // https://github.com/jashkenas/underscore/blob/master/underscore.js#L583
            bind: function( func, context ) {
                return function() {
                    return func.apply( context, arguments );
                }
            }

            // Delegate the events passed from the `events` object.
            // https://github.com/jashkenas/backbone/blob/master/backbone.js#L1048
        ,   delegateEvents: function( events ) {

                if ( ! ( events || ( events = this.events ) ) ) return this;

                for( var key in events ) {
                    var method = events[ key ];

                    method = this[ events[ key ] ];
                    if ( ! method ) continue;

                    var match = key.match( delegateEventSplitter );
                    var eventName = match[ 1 ], selector = match[ 2 ]

                    // Element to bind events to. Take document as fallback.
                    ,   el = this.el || document;

                    // Method
                    method = this.bind( method, this );

                    if ( selector === '' ) {
                        $( el ).on( eventName, method );
                    } else {
                        $( el ).on( eventName, selector, method );
                    }
                }

                return this;
            }

    });


    // Gillie.Controller
    // Controllers are intended to handle the application main logic,
    // that is, handler methods call controller methods passing them data
    // from the DOM, then controller decides what to do with that data,
    // whether to send it to the server via the model, or just to process it
    // and send it to a view etc.
    var Controller = Gillie.Controller = function( options ) {

        if ( this.initialize ) this.initialize();
    }

    _extend( Controller.prototype, Events );


    // Gillie.Model
    // Models take care of talking to the server by making AJAX requests
    // and then triggering events so that views that are listening to them
    // can do actions with the returned data.
    var Model = Gillie.Model = function( attributes ) {
        var defaults;
        var attrs = attributes || {};
        this.cid = uniqueId( 'c' );
        this.attributes = {};
        if ( defaults = this.defaults ) {
            attrs = $.extend( {}, defaults, attrs );
        }

        // Set new attributes
        // this.set( attrs );
        this.attributes = attrs;
        if ( this.initialize ) this.initialize();

    };

    _extend( Model.prototype, Events, {


            // Set one attribute or several attributes, on the model.
            //
            // Setting attributes in a model instance.
            // model.set({ foo: 1, bar: 2 });
            //
            set: function( key, val, options ) {
                var attr,  attrs, current, unset;

                if ( key == null ) return this;

                // As Backbone's "set", handle both `"key"`, value
                // and `{ key: value }` - style arguments.
                if ( typeof key === 'object' ) {
                    attrs = key;
                    options = val;

                } else {
                    ( attrs = {} )[ key ] = val;
                }

                options || ( options = {} );

                // Get options
                unset = options.unset;

                // Store current attributes.
                current = this.attributes;

                // Set every attribute that was passed.
                for ( attr in attrs ) {
                    val = attrs[ attr ];

                    // Allways update the attribute.
                    unset ? delete current[ attr ] : current[ attr ] = val;
                }

                return this;

            }

            // Backbone's "get", which get the value of an ottribute.
        ,   get: function( attr ) {
                return this.attributes[ attr ];
            }

            // Remove an attribute from the model.
        ,   unset: function( attr, options ) {
                return this.set( attr, void 0, _extend( {}, options, { unset: true } ) );
            }

    });


    // Gillie.View
    // In Gillie, views are taken care of affecting DOM elements,
    // that means, they subscribe to models events, when these events
    // are triggered, views print the new data, of show feedback, etc.
    var View = Gillie.View = Controller;


    // Helpers
    var extend = function( prop ) {

        var _super = this.prototype, parent = this;

        // Instantiate a base class
        initializing = true;
        var prototype = new this();
        initializing = false;


        // Copy the properties over onto the new prototype
        for ( var name in prop ) {

            // Check whether we're overwriting an existing function
            prototype[ name ] = typeof prop[ name ] == "function" &&
                typeof _super[ name ] == "function" && fnTest.test( prop[ name ] ) ?
                ( function( name, fn ) {
                    return function() {
                        var tmp = this._super;

                        // Add a new ._super() method that is the same
                        // methods but on the super-class
                        this._super = _super[ name ];

                        // The method only need to be bound temporarily, so we
                        // remove it when we're done executing
                        var ret = fn.apply( this, arguments );
                        this._super = tmp;

                        return ret;
                    };
                })( name, prop[ name ] ) :
                prop[ name ];
        }


        // Class constructor
        function Gillie() {

            if ( ! initializing ) {
                parent.apply( this, arguments );
            }
        }

        // Populate our constructed prototype object
        Gillie.prototype = prototype;

        // Enforce the constructor to be what we expect
        Gillie.prototype.constructor = Gillie;

        // Make this class expendable
        Gillie.extend = arguments.callee;

        return Gillie;
    };

    // Generate a unique intener id ( unique within the entire client session ).
    // Useful for temporary DOM ids
    var idCounter = 0

    ,   uniqueId = function( prefix ) {
            var id = ++ idCounter + '';
            return prefix ? prefix + id : id;
        };



    // Make Handler, Model, View and Controller be extendible
    Gillie.Handler.extend = Gillie.Model.extend = Gillie.Controller.extend = Gillie.View.extend = extend;


    // Expose Gillie to the global scope
    window.Gillie = Gillie;

})( jQuery, this );;/* Blob.js
 * A Blob implementation.
 * 2013-12-27
 * 
 * By Eli Grey, http://eligrey.com
 * By Devin Samarin, https://github.com/eboyjr
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self, unescape */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/Blob.js/blob/master/Blob.js */

if (!(typeof Blob === "function" || typeof Blob === "object") || typeof URL === "undefined")
if ((typeof Blob === "function" || typeof Blob === "object") && typeof webkitURL !== "undefined") self.URL = webkitURL;
else var Blob = (function (view) {
	"use strict";

	var BlobBuilder = view.BlobBuilder || view.WebKitBlobBuilder || view.MozBlobBuilder || view.MSBlobBuilder || (function(view) {
		var
			  get_class = function(object) {
				return Object.prototype.toString.call(object).match(/^\[object\s(.*)\]$/)[1];
			}
			, FakeBlobBuilder = function BlobBuilder() {
				this.data = [];
			}
			, FakeBlob = function Blob(data, type, encoding) {
				this.data = data;
				this.size = data.length;
				this.type = type;
				this.encoding = encoding;
			}
			, FBB_proto = FakeBlobBuilder.prototype
			, FB_proto = FakeBlob.prototype
			, FileReaderSync = view.FileReaderSync
			, FileException = function(type) {
				this.code = this[this.name = type];
			}
			, file_ex_codes = (
				  "NOT_FOUND_ERR SECURITY_ERR ABORT_ERR NOT_READABLE_ERR ENCODING_ERR "
				+ "NO_MODIFICATION_ALLOWED_ERR INVALID_STATE_ERR SYNTAX_ERR"
			).split(" ")
			, file_ex_code = file_ex_codes.length
			, real_URL = view.URL || view.webkitURL || view
			, real_create_object_URL = real_URL.createObjectURL
			, real_revoke_object_URL = real_URL.revokeObjectURL
			, URL = real_URL
			, btoa = view.btoa
			, atob = view.atob
			
			, ArrayBuffer = view.ArrayBuffer
			, Uint8Array = view.Uint8Array
		;
		FakeBlob.fake = FB_proto.fake = true;
		while (file_ex_code--) {
			FileException.prototype[file_ex_codes[file_ex_code]] = file_ex_code + 1;
		}
		if (!real_URL.createObjectURL) {
			URL = view.URL = {};
		}
		URL.createObjectURL = function(blob) {
			var
				  type = blob.type
				, data_URI_header
			;
			if (type === null) {
				type = "application/octet-stream";
			}
			if (blob instanceof FakeBlob) {
				data_URI_header = "data:" + type;
				if (blob.encoding === "base64") {
					return data_URI_header + ";base64," + blob.data;
				} else if (blob.encoding === "URI") {
					return data_URI_header + "," + decodeURIComponent(blob.data);
				} if (btoa) {
					return data_URI_header + ";base64," + btoa(blob.data);
				} else {
					return data_URI_header + "," + encodeURIComponent(blob.data);
				}
			} else if (real_create_object_URL) {
				return real_create_object_URL.call(real_URL, blob);
			}
		};
		URL.revokeObjectURL = function(object_URL) {
			if (object_URL.substring(0, 5) !== "data:" && real_revoke_object_URL) {
				real_revoke_object_URL.call(real_URL, object_URL);
			}
		};
		FBB_proto.append = function(data/*, endings*/) {
			var bb = this.data;
			// decode data to a binary string
			if (Uint8Array && (data instanceof ArrayBuffer || data instanceof Uint8Array)) {
				var
					  str = ""
					, buf = new Uint8Array(data)
					, i = 0
					, buf_len = buf.length
				;
				for (; i < buf_len; i++) {
					str += String.fromCharCode(buf[i]);
				}
				bb.push(str);
			} else if (get_class(data) === "Blob" || get_class(data) === "File") {
				if (FileReaderSync) {
					var fr = new FileReaderSync;
					bb.push(fr.readAsBinaryString(data));
				} else {
					// async FileReader won't work as BlobBuilder is sync
					throw new FileException("NOT_READABLE_ERR");
				}
			} else if (data instanceof FakeBlob) {
				if (data.encoding === "base64" && atob) {
					bb.push(atob(data.data));
				} else if (data.encoding === "URI") {
					bb.push(decodeURIComponent(data.data));
				} else if (data.encoding === "raw") {
					bb.push(data.data);
				}
			} else {
				if (typeof data !== "string") {
					data += ""; // convert unsupported types to strings
				}
				// decode UTF-16 to binary string
				bb.push(unescape(encodeURIComponent(data)));
			}
		};
		FBB_proto.getBlob = function(type) {
			if (!arguments.length) {
				type = null;
			}
			return new FakeBlob(this.data.join(""), type, "raw");
		};
		FBB_proto.toString = function() {
			return "[object BlobBuilder]";
		};
		FB_proto.slice = function(start, end, type) {
			var args = arguments.length;
			if (args < 3) {
				type = null;
			}
			return new FakeBlob(
				  this.data.slice(start, args > 1 ? end : this.data.length)
				, type
				, this.encoding
			);
		};
		FB_proto.toString = function() {
			return "[object Blob]";
		};
		return FakeBlobBuilder;
	}(view));

	return function Blob(blobParts, options) {
		var type = options ? (options.type || "") : "";
		var builder = new BlobBuilder();
		if (blobParts) {
			for (var i = 0, len = blobParts.length; i < len; i++) {
				builder.append(blobParts[i]);
			}
		}
		return builder.getBlob(type);
	};
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));
;/* FileSaver.js
 * A saveAs() FileSaver implementation.
 * 2013-12-27
 *
 * By Eli Grey, http://eligrey.com
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/FileSaver.js/blob/master/FileSaver.js */

var saveAs = saveAs
  || (typeof navigator !== "undefined" && navigator.msSaveOrOpenBlob && navigator.msSaveOrOpenBlob.bind(navigator))
  || (function(view) {
	"use strict";
	var
		  doc = view.document
		  // only get URL when necessary in case BlobBuilder.js hasn't overridden it yet
		, get_URL = function() {
			return view.URL || view.webkitURL || view;
		}
		, URL = view.URL || view.webkitURL || view
		, save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a")
		, can_use_save_link =  !view.externalHost && "download" in save_link
		, click = function(node) {
			var event = doc.createEvent("MouseEvents");
			event.initMouseEvent(
				"click", true, false, view, 0, 0, 0, 0, 0
				, false, false, false, false, 0, null
			);
			node.dispatchEvent(event);
		}
		, webkit_req_fs = view.webkitRequestFileSystem
		, req_fs = view.requestFileSystem || webkit_req_fs || view.mozRequestFileSystem
		, throw_outside = function (ex) {
			(view.setImmediate || view.setTimeout)(function() {
				throw ex;
			}, 0);
		}
		, force_saveable_type = "application/octet-stream"
		, fs_min_size = 0
		, deletion_queue = []
		, process_deletion_queue = function() {
			var i = deletion_queue.length;
			while (i--) {
				var file = deletion_queue[i];
				if (typeof file === "string") { // file is an object URL
					URL.revokeObjectURL(file);
				} else { // file is a File
					file.remove();
				}
			}
			deletion_queue.length = 0; // clear queue
		}
		, dispatch = function(filesaver, event_types, event) {
			event_types = [].concat(event_types);
			var i = event_types.length;
			while (i--) {
				var listener = filesaver["on" + event_types[i]];
				if (typeof listener === "function") {
					try {
						listener.call(filesaver, event || filesaver);
					} catch (ex) {
						throw_outside(ex);
					}
				}
			}
		}
		, FileSaver = function(blob, name) {
			// First try a.download, then web filesystem, then object URLs
			var
				  filesaver = this
				, type = blob.type
				, blob_changed = false
				, object_url
				, target_view
				, get_object_url = function() {
					var object_url = get_URL().createObjectURL(blob);
					deletion_queue.push(object_url);
					return object_url;
				}
				, dispatch_all = function() {
					dispatch(filesaver, "writestart progress write writeend".split(" "));
				}
				// on any filesys errors revert to saving with object URLs
				, fs_error = function() {
					// don't create more object URLs than needed
					if (blob_changed || !object_url) {
						object_url = get_object_url(blob);
					}
					if (target_view) {
						target_view.location.href = object_url;
					} else {
                        window.open(object_url, "_blank");
                    }
					filesaver.readyState = filesaver.DONE;
					dispatch_all();
				}
				, abortable = function(func) {
					return function() {
						if (filesaver.readyState !== filesaver.DONE) {
							return func.apply(this, arguments);
						}
					};
				}
				, create_if_not_found = {create: true, exclusive: false}
				, slice
			;
			filesaver.readyState = filesaver.INIT;
			if (!name) {
				name = "download";
			}
			if (can_use_save_link) {
				object_url = get_object_url(blob);
				// FF for Android has a nasty garbage collection mechanism
				// that turns all objects that are not pure javascript into 'deadObject'
				// this means `doc` and `save_link` are unusable and need to be recreated
				// `view` is usable though:
				doc = view.document;
				save_link = doc.createElementNS("http://www.w3.org/1999/xhtml", "a");
				save_link.href = object_url;
				save_link.download = name;
				var event = doc.createEvent("MouseEvents");
				event.initMouseEvent(
					"click", true, false, view, 0, 0, 0, 0, 0
					, false, false, false, false, 0, null
				);
				save_link.dispatchEvent(event);
				filesaver.readyState = filesaver.DONE;
				dispatch_all();
				return;
			}
			// Object and web filesystem URLs have a problem saving in Google Chrome when
			// viewed in a tab, so I force save with application/octet-stream
			// http://code.google.com/p/chromium/issues/detail?id=91158
			if (view.chrome && type && type !== force_saveable_type) {
				slice = blob.slice || blob.webkitSlice;
				blob = slice.call(blob, 0, blob.size, force_saveable_type);
				blob_changed = true;
			}
			// Since I can't be sure that the guessed media type will trigger a download
			// in WebKit, I append .download to the filename.
			// https://bugs.webkit.org/show_bug.cgi?id=65440
			if (webkit_req_fs && name !== "download") {
				name += ".download";
			}
			if (type === force_saveable_type || webkit_req_fs) {
				target_view = view;
			}
			if (!req_fs) {
				fs_error();
				return;
			}
			fs_min_size += blob.size;
			req_fs(view.TEMPORARY, fs_min_size, abortable(function(fs) {
				fs.root.getDirectory("saved", create_if_not_found, abortable(function(dir) {
					var save = function() {
						dir.getFile(name, create_if_not_found, abortable(function(file) {
							file.createWriter(abortable(function(writer) {
								writer.onwriteend = function(event) {
									target_view.location.href = file.toURL();
									deletion_queue.push(file);
									filesaver.readyState = filesaver.DONE;
									dispatch(filesaver, "writeend", event);
								};
								writer.onerror = function() {
									var error = writer.error;
									if (error.code !== error.ABORT_ERR) {
										fs_error();
									}
								};
								"writestart progress write abort".split(" ").forEach(function(event) {
									writer["on" + event] = filesaver["on" + event];
								});
								writer.write(blob);
								filesaver.abort = function() {
									writer.abort();
									filesaver.readyState = filesaver.DONE;
								};
								filesaver.readyState = filesaver.WRITING;
							}), fs_error);
						}), fs_error);
					};
					dir.getFile(name, {create: false}, abortable(function(file) {
						// delete file if it already exists
						file.remove();
						save();
					}), abortable(function(ex) {
						if (ex.code === ex.NOT_FOUND_ERR) {
							save();
						} else {
							fs_error();
						}
					}));
				}), fs_error);
			}), fs_error);
		}
		, FS_proto = FileSaver.prototype
		, saveAs = function(blob, name) {
			return new FileSaver(blob, name);
		}
	;
	FS_proto.abort = function() {
		var filesaver = this;
		filesaver.readyState = filesaver.DONE;
		dispatch(filesaver, "abort");
	};
	FS_proto.readyState = FS_proto.INIT = 0;
	FS_proto.WRITING = 1;
	FS_proto.DONE = 2;

	FS_proto.error =
	FS_proto.onwritestart =
	FS_proto.onprogress =
	FS_proto.onwrite =
	FS_proto.onabort =
	FS_proto.onerror =
	FS_proto.onwriteend =
		null;

	view.addEventListener("unload", process_deletion_queue, false);
	return saveAs;
}(
	   typeof self !== "undefined" && self
	|| typeof window !== "undefined" && window
	|| this.content
));
// `self` is undefined in Firefox for Android content script context
// while `this` is nsIContentFrameMessageManager
// with an attribute `content` that corresponds to the window

if (typeof module !== "undefined") module.exports = saveAs;
;/*
  html2canvas 0.4.1 <http://html2canvas.hertzen.com>
  Copyright (c) 2013 Niklas von Hertzen

  Released under MIT License
*/

(function(window, document, undefined){

"use strict";

var _html2canvas = {},
previousElement,
computedCSS,
html2canvas;

_html2canvas.Util = {};

_html2canvas.Util.log = function(a) {
  if (_html2canvas.logging && window.console && window.console.log) {
    window.console.log(a);
  }
};

_html2canvas.Util.trimText = (function(isNative){
  return function(input) {
    return isNative ? isNative.apply(input) : ((input || '') + '').replace( /^\s+|\s+$/g , '' );
  };
})(String.prototype.trim);

_html2canvas.Util.asFloat = function(v) {
  return parseFloat(v);
};

(function() {
  // TODO: support all possible length values
  var TEXT_SHADOW_PROPERTY = /((rgba|rgb)\([^\)]+\)(\s-?\d+px){0,})/g;
  var TEXT_SHADOW_VALUES = /(-?\d+px)|(#.+)|(rgb\(.+\))|(rgba\(.+\))/g;
  _html2canvas.Util.parseTextShadows = function (value) {
    if (!value || value === 'none') {
      return [];
    }

    // find multiple shadow declarations
    var shadows = value.match(TEXT_SHADOW_PROPERTY),
      results = [];
    for (var i = 0; shadows && (i < shadows.length); i++) {
      var s = shadows[i].match(TEXT_SHADOW_VALUES);
      results.push({
        color: s[0],
        offsetX: s[1] ? s[1].replace('px', '') : 0,
        offsetY: s[2] ? s[2].replace('px', '') : 0,
        blur: s[3] ? s[3].replace('px', '') : 0
      });
    }
    return results;
  };
})();


_html2canvas.Util.parseBackgroundImage = function (value) {
    var whitespace = ' \r\n\t',
        method, definition, prefix, prefix_i, block, results = [],
        c, mode = 0, numParen = 0, quote, args;

    var appendResult = function(){
        if(method) {
            if(definition.substr( 0, 1 ) === '"') {
                definition = definition.substr( 1, definition.length - 2 );
            }
            if(definition) {
                args.push(definition);
            }
            if(method.substr( 0, 1 ) === '-' &&
                    (prefix_i = method.indexOf( '-', 1 ) + 1) > 0) {
                prefix = method.substr( 0, prefix_i);
                method = method.substr( prefix_i );
            }
            results.push({
                prefix: prefix,
                method: method.toLowerCase(),
                value: block,
                args: args
            });
        }
        args = []; //for some odd reason, setting .length = 0 didn't work in safari
        method =
            prefix =
            definition =
            block = '';
    };

    appendResult();
    for(var i = 0, ii = value.length; i<ii; i++) {
        c = value[i];
        if(mode === 0 && whitespace.indexOf( c ) > -1){
            continue;
        }
        switch(c) {
            case '"':
                if(!quote) {
                    quote = c;
                }
                else if(quote === c) {
                    quote = null;
                }
                break;

            case '(':
                if(quote) { break; }
                else if(mode === 0) {
                    mode = 1;
                    block += c;
                    continue;
                } else {
                    numParen++;
                }
                break;

            case ')':
                if(quote) { break; }
                else if(mode === 1) {
                    if(numParen === 0) {
                        mode = 0;
                        block += c;
                        appendResult();
                        continue;
                    } else {
                        numParen--;
                    }
                }
                break;

            case ',':
                if(quote) { break; }
                else if(mode === 0) {
                    appendResult();
                    continue;
                }
                else if (mode === 1) {
                    if(numParen === 0 && !method.match(/^url$/i)) {
                        args.push(definition);
                        definition = '';
                        block += c;
                        continue;
                    }
                }
                break;
        }

        block += c;
        if(mode === 0) { method += c; }
        else { definition += c; }
    }
    appendResult();

    return results;
};

_html2canvas.Util.Bounds = function (element) {
  var clientRect, bounds = {};

  if (element.getBoundingClientRect){
    clientRect = element.getBoundingClientRect();

    // TODO add scroll position to bounds, so no scrolling of window necessary
    bounds.top = clientRect.top;
    bounds.bottom = clientRect.bottom || (clientRect.top + clientRect.height);
    bounds.left = clientRect.left;

    bounds.width = element.offsetWidth;
    bounds.height = element.offsetHeight;
  }

  return bounds;
};

// TODO ideally, we'd want everything to go through this function instead of Util.Bounds,
// but would require further work to calculate the correct positions for elements with offsetParents
_html2canvas.Util.OffsetBounds = function (element) {
  var parent = element.offsetParent ? _html2canvas.Util.OffsetBounds(element.offsetParent) : {top: 0, left: 0};

  return {
    top: element.offsetTop + parent.top,
    bottom: element.offsetTop + element.offsetHeight + parent.top,
    left: element.offsetLeft + parent.left,
    width: element.offsetWidth,
    height: element.offsetHeight
  };
};

function toPX(element, attribute, value ) {
    var rsLeft = element.runtimeStyle && element.runtimeStyle[attribute],
        left,
        style = element.style;

    // Check if we are not dealing with pixels, (Opera has issues with this)
    // Ported from jQuery css.js
    // From the awesome hack by Dean Edwards
    // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

    // If we're not dealing with a regular pixel number
    // but a number that has a weird ending, we need to convert it to pixels

    if ( !/^-?[0-9]+\.?[0-9]*(?:px)?$/i.test( value ) && /^-?\d/.test(value) ) {
        // Remember the original values
        left = style.left;

        // Put in the new values to get a computed value out
        if (rsLeft) {
            element.runtimeStyle.left = element.currentStyle.left;
        }
        style.left = attribute === "fontSize" ? "1em" : (value || 0);
        value = style.pixelLeft + "px";

        // Revert the changed values
        style.left = left;
        if (rsLeft) {
            element.runtimeStyle.left = rsLeft;
        }
    }

    if (!/^(thin|medium|thick)$/i.test(value)) {
        return Math.round(parseFloat(value)) + "px";
    }

    return value;
}

function asInt(val) {
    return parseInt(val, 10);
}

function parseBackgroundSizePosition(value, element, attribute, index) {
    value = (value || '').split(',');
    value = value[index || 0] || value[0] || 'auto';
    value = _html2canvas.Util.trimText(value).split(' ');

    if(attribute === 'backgroundSize' && (!value[0] || value[0].match(/cover|contain|auto/))) {
        //these values will be handled in the parent function
    } else {
        value[0] = (value[0].indexOf( "%" ) === -1) ? toPX(element, attribute + "X", value[0]) : value[0];
        if(value[1] === undefined) {
            if(attribute === 'backgroundSize') {
                value[1] = 'auto';
                return value;
            } else {
                // IE 9 doesn't return double digit always
                value[1] = value[0];
            }
        }
        value[1] = (value[1].indexOf("%") === -1) ? toPX(element, attribute + "Y", value[1]) : value[1];
    }
    return value;
}

_html2canvas.Util.getCSS = function (element, attribute, index) {
    if (previousElement !== element) {
      computedCSS = document.defaultView.getComputedStyle(element, null);
    }

    var value = computedCSS[attribute];

    if (/^background(Size|Position)$/.test(attribute)) {
        return parseBackgroundSizePosition(value, element, attribute, index);
    } else if (/border(Top|Bottom)(Left|Right)Radius/.test(attribute)) {
      var arr = value.split(" ");
      if (arr.length <= 1) {
          arr[1] = arr[0];
      }
      return arr.map(asInt);
    }

  return value;
};

_html2canvas.Util.resizeBounds = function( current_width, current_height, target_width, target_height, stretch_mode ){
  var target_ratio = target_width / target_height,
    current_ratio = current_width / current_height,
    output_width, output_height;

  if(!stretch_mode || stretch_mode === 'auto') {
    output_width = target_width;
    output_height = target_height;
  } else if(target_ratio < current_ratio ^ stretch_mode === 'contain') {
    output_height = target_height;
    output_width = target_height * current_ratio;
  } else {
    output_width = target_width;
    output_height = target_width / current_ratio;
  }

  return {
    width: output_width,
    height: output_height
  };
};

function backgroundBoundsFactory( prop, el, bounds, image, imageIndex, backgroundSize ) {
    var bgposition =  _html2canvas.Util.getCSS( el, prop, imageIndex ) ,
    topPos,
    left,
    percentage,
    val;

    if (bgposition.length === 1){
      val = bgposition[0];

      bgposition = [];

      bgposition[0] = val;
      bgposition[1] = val;
    }

    if (bgposition[0].toString().indexOf("%") !== -1){
      percentage = (parseFloat(bgposition[0])/100);
      left = bounds.width * percentage;
      if(prop !== 'backgroundSize') {
        left -= (backgroundSize || image).width*percentage;
      }
    } else {
      if(prop === 'backgroundSize') {
        if(bgposition[0] === 'auto') {
          left = image.width;
        } else {
          if (/contain|cover/.test(bgposition[0])) {
            var resized = _html2canvas.Util.resizeBounds(image.width, image.height, bounds.width, bounds.height, bgposition[0]);
            left = resized.width;
            topPos = resized.height;
          } else {
            left = parseInt(bgposition[0], 10);
          }
        }
      } else {
        left = parseInt( bgposition[0], 10);
      }
    }


    if(bgposition[1] === 'auto') {
      topPos = left / image.width * image.height;
    } else if (bgposition[1].toString().indexOf("%") !== -1){
      percentage = (parseFloat(bgposition[1])/100);
      topPos =  bounds.height * percentage;
      if(prop !== 'backgroundSize') {
        topPos -= (backgroundSize || image).height * percentage;
      }

    } else {
      topPos = parseInt(bgposition[1],10);
    }

    return [left, topPos];
}

_html2canvas.Util.BackgroundPosition = function( el, bounds, image, imageIndex, backgroundSize ) {
    var result = backgroundBoundsFactory( 'backgroundPosition', el, bounds, image, imageIndex, backgroundSize );
    return { left: result[0], top: result[1] };
};

_html2canvas.Util.BackgroundSize = function( el, bounds, image, imageIndex ) {
    var result = backgroundBoundsFactory( 'backgroundSize', el, bounds, image, imageIndex );
    return { width: result[0], height: result[1] };
};

_html2canvas.Util.Extend = function (options, defaults) {
  for (var key in options) {
    if (options.hasOwnProperty(key)) {
      defaults[key] = options[key];
    }
  }
  return defaults;
};


/*
 * Derived from jQuery.contents()
 * Copyright 2010, John Resig
 * Dual licensed under the MIT or GPL Version 2 licenses.
 * http://jquery.org/license
 */
_html2canvas.Util.Children = function( elem ) {
  var children;
  try {
    children = (elem.nodeName && elem.nodeName.toUpperCase() === "IFRAME") ? elem.contentDocument || elem.contentWindow.document : (function(array) {
      var ret = [];
      if (array !== null) {
        (function(first, second ) {
          var i = first.length,
          j = 0;

          if (typeof second.length === "number") {
            for (var l = second.length; j < l; j++) {
              first[i++] = second[j];
            }
          } else {
            while (second[j] !== undefined) {
              first[i++] = second[j++];
            }
          }

          first.length = i;

          return first;
        })(ret, array);
      }
      return ret;
    })(elem.childNodes);

  } catch (ex) {
    _html2canvas.Util.log("html2canvas.Util.Children failed with exception: " + ex.message);
    children = [];
  }
  return children;
};

_html2canvas.Util.isTransparent = function(backgroundColor) {
  return (backgroundColor === "transparent" || backgroundColor === "rgba(0, 0, 0, 0)");
};
_html2canvas.Util.Font = (function () {

  var fontData = {};

  return function(font, fontSize, doc) {
    if (fontData[font + "-" + fontSize] !== undefined) {
      return fontData[font + "-" + fontSize];
    }

    var container = doc.createElement('div'),
    img = doc.createElement('img'),
    span = doc.createElement('span'),
    sampleText = 'Hidden Text',
    baseline,
    middle,
    metricsObj;

    container.style.visibility = "hidden";
    container.style.fontFamily = font;
    container.style.fontSize = fontSize;
    container.style.margin = 0;
    container.style.padding = 0;

    doc.body.appendChild(container);

    // http://probablyprogramming.com/2009/03/15/the-tiniest-gif-ever (handtinywhite.gif)
    img.src = "data:image/gif;base64,R0lGODlhAQABAIABAP///wAAACwAAAAAAQABAAACAkQBADs=";
    img.width = 1;
    img.height = 1;

    img.style.margin = 0;
    img.style.padding = 0;
    img.style.verticalAlign = "baseline";

    span.style.fontFamily = font;
    span.style.fontSize = fontSize;
    span.style.margin = 0;
    span.style.padding = 0;

    span.appendChild(doc.createTextNode(sampleText));
    container.appendChild(span);
    container.appendChild(img);
    baseline = (img.offsetTop - span.offsetTop) + 1;

    container.removeChild(span);
    container.appendChild(doc.createTextNode(sampleText));

    container.style.lineHeight = "normal";
    img.style.verticalAlign = "super";

    middle = (img.offsetTop-container.offsetTop) + 1;
    metricsObj = {
      baseline: baseline,
      lineWidth: 1,
      middle: middle
    };

    fontData[font + "-" + fontSize] = metricsObj;

    doc.body.removeChild(container);

    return metricsObj;
  };
})();

(function(){
  var Util = _html2canvas.Util,
    Generate = {};

  _html2canvas.Generate = Generate;

  var reGradients = [
  /^(-webkit-linear-gradient)\(([a-z\s]+)([\w\d\.\s,%\(\)]+)\)$/,
  /^(-o-linear-gradient)\(([a-z\s]+)([\w\d\.\s,%\(\)]+)\)$/,
  /^(-webkit-gradient)\((linear|radial),\s((?:\d{1,3}%?)\s(?:\d{1,3}%?),\s(?:\d{1,3}%?)\s(?:\d{1,3}%?))([\w\d\.\s,%\(\)\-]+)\)$/,
  /^(-moz-linear-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?))([\w\d\.\s,%\(\)]+)\)$/,
  /^(-webkit-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s([a-z\-]+)([\w\d\.\s,%\(\)]+)\)$/,
  /^(-moz-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s?([a-z\-]*)([\w\d\.\s,%\(\)]+)\)$/,
  /^(-o-radial-gradient)\(((?:\d{1,3}%?)\s(?:\d{1,3}%?)),\s(\w+)\s([a-z\-]+)([\w\d\.\s,%\(\)]+)\)$/
  ];

  /*
 * TODO: Add IE10 vendor prefix (-ms) support
 * TODO: Add W3C gradient (linear-gradient) support
 * TODO: Add old Webkit -webkit-gradient(radial, ...) support
 * TODO: Maybe some RegExp optimizations are possible ;o)
 */
  Generate.parseGradient = function(css, bounds) {
    var gradient, i, len = reGradients.length, m1, stop, m2, m2Len, step, m3, tl,tr,br,bl;

    for(i = 0; i < len; i+=1){
      m1 = css.match(reGradients[i]);
      if(m1) {
        break;
      }
    }

    if(m1) {
      switch(m1[1]) {
        case '-webkit-linear-gradient':
        case '-o-linear-gradient':

          gradient = {
            type: 'linear',
            x0: null,
            y0: null,
            x1: null,
            y1: null,
            colorStops: []
          };

          // get coordinates
          m2 = m1[2].match(/\w+/g);
          if(m2){
            m2Len = m2.length;
            for(i = 0; i < m2Len; i+=1){
              switch(m2[i]) {
                case 'top':
                  gradient.y0 = 0;
                  gradient.y1 = bounds.height;
                  break;

                case 'right':
                  gradient.x0 = bounds.width;
                  gradient.x1 = 0;
                  break;

                case 'bottom':
                  gradient.y0 = bounds.height;
                  gradient.y1 = 0;
                  break;

                case 'left':
                  gradient.x0 = 0;
                  gradient.x1 = bounds.width;
                  break;
              }
            }
          }
          if(gradient.x0 === null && gradient.x1 === null){ // center
            gradient.x0 = gradient.x1 = bounds.width / 2;
          }
          if(gradient.y0 === null && gradient.y1 === null){ // center
            gradient.y0 = gradient.y1 = bounds.height / 2;
          }

          // get colors and stops
          m2 = m1[3].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}(?:%|px))?)+/g);
          if(m2){
            m2Len = m2.length;
            step = 1 / Math.max(m2Len - 1, 1);
            for(i = 0; i < m2Len; i+=1){
              m3 = m2[i].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/);
              if(m3[2]){
                stop = parseFloat(m3[2]);
                if(m3[3] === '%'){
                  stop /= 100;
                } else { // px - stupid opera
                  stop /= bounds.width;
                }
              } else {
                stop = i * step;
              }
              gradient.colorStops.push({
                color: m3[1],
                stop: stop
              });
            }
          }
          break;

        case '-webkit-gradient':

          gradient = {
            type: m1[2] === 'radial' ? 'circle' : m1[2], // TODO: Add radial gradient support for older mozilla definitions
            x0: 0,
            y0: 0,
            x1: 0,
            y1: 0,
            colorStops: []
          };

          // get coordinates
          m2 = m1[3].match(/(\d{1,3})%?\s(\d{1,3})%?,\s(\d{1,3})%?\s(\d{1,3})%?/);
          if(m2){
            gradient.x0 = (m2[1] * bounds.width) / 100;
            gradient.y0 = (m2[2] * bounds.height) / 100;
            gradient.x1 = (m2[3] * bounds.width) / 100;
            gradient.y1 = (m2[4] * bounds.height) / 100;
          }

          // get colors and stops
          m2 = m1[4].match(/((?:from|to|color-stop)\((?:[0-9\.]+,\s)?(?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)\))+/g);
          if(m2){
            m2Len = m2.length;
            for(i = 0; i < m2Len; i+=1){
              m3 = m2[i].match(/(from|to|color-stop)\(([0-9\.]+)?(?:,\s)?((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\)/);
              stop = parseFloat(m3[2]);
              if(m3[1] === 'from') {
                stop = 0.0;
              }
              if(m3[1] === 'to') {
                stop = 1.0;
              }
              gradient.colorStops.push({
                color: m3[3],
                stop: stop
              });
            }
          }
          break;

        case '-moz-linear-gradient':

          gradient = {
            type: 'linear',
            x0: 0,
            y0: 0,
            x1: 0,
            y1: 0,
            colorStops: []
          };

          // get coordinates
          m2 = m1[2].match(/(\d{1,3})%?\s(\d{1,3})%?/);

          // m2[1] == 0%   -> left
          // m2[1] == 50%  -> center
          // m2[1] == 100% -> right

          // m2[2] == 0%   -> top
          // m2[2] == 50%  -> center
          // m2[2] == 100% -> bottom

          if(m2){
            gradient.x0 = (m2[1] * bounds.width) / 100;
            gradient.y0 = (m2[2] * bounds.height) / 100;
            gradient.x1 = bounds.width - gradient.x0;
            gradient.y1 = bounds.height - gradient.y0;
          }

          // get colors and stops
          m2 = m1[3].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}%)?)+/g);
          if(m2){
            m2Len = m2.length;
            step = 1 / Math.max(m2Len - 1, 1);
            for(i = 0; i < m2Len; i+=1){
              m3 = m2[i].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%)?/);
              if(m3[2]){
                stop = parseFloat(m3[2]);
                if(m3[3]){ // percentage
                  stop /= 100;
                }
              } else {
                stop = i * step;
              }
              gradient.colorStops.push({
                color: m3[1],
                stop: stop
              });
            }
          }
          break;

        case '-webkit-radial-gradient':
        case '-moz-radial-gradient':
        case '-o-radial-gradient':

          gradient = {
            type: 'circle',
            x0: 0,
            y0: 0,
            x1: bounds.width,
            y1: bounds.height,
            cx: 0,
            cy: 0,
            rx: 0,
            ry: 0,
            colorStops: []
          };

          // center
          m2 = m1[2].match(/(\d{1,3})%?\s(\d{1,3})%?/);
          if(m2){
            gradient.cx = (m2[1] * bounds.width) / 100;
            gradient.cy = (m2[2] * bounds.height) / 100;
          }

          // size
          m2 = m1[3].match(/\w+/);
          m3 = m1[4].match(/[a-z\-]*/);
          if(m2 && m3){
            switch(m3[0]){
              case 'farthest-corner':
              case 'cover': // is equivalent to farthest-corner
              case '': // mozilla removes "cover" from definition :(
                tl = Math.sqrt(Math.pow(gradient.cx, 2) + Math.pow(gradient.cy, 2));
                tr = Math.sqrt(Math.pow(gradient.cx, 2) + Math.pow(gradient.y1 - gradient.cy, 2));
                br = Math.sqrt(Math.pow(gradient.x1 - gradient.cx, 2) + Math.pow(gradient.y1 - gradient.cy, 2));
                bl = Math.sqrt(Math.pow(gradient.x1 - gradient.cx, 2) + Math.pow(gradient.cy, 2));
                gradient.rx = gradient.ry = Math.max(tl, tr, br, bl);
                break;
              case 'closest-corner':
                tl = Math.sqrt(Math.pow(gradient.cx, 2) + Math.pow(gradient.cy, 2));
                tr = Math.sqrt(Math.pow(gradient.cx, 2) + Math.pow(gradient.y1 - gradient.cy, 2));
                br = Math.sqrt(Math.pow(gradient.x1 - gradient.cx, 2) + Math.pow(gradient.y1 - gradient.cy, 2));
                bl = Math.sqrt(Math.pow(gradient.x1 - gradient.cx, 2) + Math.pow(gradient.cy, 2));
                gradient.rx = gradient.ry = Math.min(tl, tr, br, bl);
                break;
              case 'farthest-side':
                if(m2[0] === 'circle'){
                  gradient.rx = gradient.ry = Math.max(
                    gradient.cx,
                    gradient.cy,
                    gradient.x1 - gradient.cx,
                    gradient.y1 - gradient.cy
                    );
                } else { // ellipse

                  gradient.type = m2[0];

                  gradient.rx = Math.max(
                    gradient.cx,
                    gradient.x1 - gradient.cx
                    );
                  gradient.ry = Math.max(
                    gradient.cy,
                    gradient.y1 - gradient.cy
                    );
                }
                break;
              case 'closest-side':
              case 'contain': // is equivalent to closest-side
                if(m2[0] === 'circle'){
                  gradient.rx = gradient.ry = Math.min(
                    gradient.cx,
                    gradient.cy,
                    gradient.x1 - gradient.cx,
                    gradient.y1 - gradient.cy
                    );
                } else { // ellipse

                  gradient.type = m2[0];

                  gradient.rx = Math.min(
                    gradient.cx,
                    gradient.x1 - gradient.cx
                    );
                  gradient.ry = Math.min(
                    gradient.cy,
                    gradient.y1 - gradient.cy
                    );
                }
                break;

            // TODO: add support for "30px 40px" sizes (webkit only)
            }
          }

          // color stops
          m2 = m1[5].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\)(?:\s\d{1,3}(?:%|px))?)+/g);
          if(m2){
            m2Len = m2.length;
            step = 1 / Math.max(m2Len - 1, 1);
            for(i = 0; i < m2Len; i+=1){
              m3 = m2[i].match(/((?:rgb|rgba)\(\d{1,3},\s\d{1,3},\s\d{1,3}(?:,\s[0-9\.]+)?\))\s*(\d{1,3})?(%|px)?/);
              if(m3[2]){
                stop = parseFloat(m3[2]);
                if(m3[3] === '%'){
                  stop /= 100;
                } else { // px - stupid opera
                  stop /= bounds.width;
                }
              } else {
                stop = i * step;
              }
              gradient.colorStops.push({
                color: m3[1],
                stop: stop
              });
            }
          }
          break;
      }
    }

    return gradient;
  };

  function addScrollStops(grad) {
    return function(colorStop) {
      try {
        grad.addColorStop(colorStop.stop, colorStop.color);
      }
      catch(e) {
        Util.log(['failed to add color stop: ', e, '; tried to add: ', colorStop]);
      }
    };
  }

  Generate.Gradient = function(src, bounds) {
    if(bounds.width === 0 || bounds.height === 0) {
      return;
    }

    var canvas = document.createElement('canvas'),
    ctx = canvas.getContext('2d'),
    gradient, grad;

    canvas.width = bounds.width;
    canvas.height = bounds.height;

    // TODO: add support for multi defined background gradients
    gradient = _html2canvas.Generate.parseGradient(src, bounds);

    if(gradient) {
      switch(gradient.type) {
        case 'linear':
          grad = ctx.createLinearGradient(gradient.x0, gradient.y0, gradient.x1, gradient.y1);
          gradient.colorStops.forEach(addScrollStops(grad));
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, bounds.width, bounds.height);
          break;

        case 'circle':
          grad = ctx.createRadialGradient(gradient.cx, gradient.cy, 0, gradient.cx, gradient.cy, gradient.rx);
          gradient.colorStops.forEach(addScrollStops(grad));
          ctx.fillStyle = grad;
          ctx.fillRect(0, 0, bounds.width, bounds.height);
          break;

        case 'ellipse':
          var canvasRadial = document.createElement('canvas'),
            ctxRadial = canvasRadial.getContext('2d'),
            ri = Math.max(gradient.rx, gradient.ry),
            di = ri * 2;

          canvasRadial.width = canvasRadial.height = di;

          grad = ctxRadial.createRadialGradient(gradient.rx, gradient.ry, 0, gradient.rx, gradient.ry, ri);
          gradient.colorStops.forEach(addScrollStops(grad));

          ctxRadial.fillStyle = grad;
          ctxRadial.fillRect(0, 0, di, di);

          ctx.fillStyle = gradient.colorStops[gradient.colorStops.length - 1].color;
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(canvasRadial, gradient.cx - gradient.rx, gradient.cy - gradient.ry, 2 * gradient.rx, 2 * gradient.ry);
          break;
      }
    }

    return canvas;
  };

  Generate.ListAlpha = function(number) {
    var tmp = "",
    modulus;

    do {
      modulus = number % 26;
      tmp = String.fromCharCode((modulus) + 64) + tmp;
      number = number / 26;
    }while((number*26) > 26);

    return tmp;
  };

  Generate.ListRoman = function(number) {
    var romanArray = ["M", "CM", "D", "CD", "C", "XC", "L", "XL", "X", "IX", "V", "IV", "I"],
    decimal = [1000, 900, 500, 400, 100, 90, 50, 40, 10, 9, 5, 4, 1],
    roman = "",
    v,
    len = romanArray.length;

    if (number <= 0 || number >= 4000) {
      return number;
    }

    for (v=0; v < len; v+=1) {
      while (number >= decimal[v]) {
        number -= decimal[v];
        roman += romanArray[v];
      }
    }

    return roman;
  };
})();
function h2cRenderContext(width, height) {
  var storage = [];
  return {
    storage: storage,
    width: width,
    height: height,
    clip: function() {
      storage.push({
        type: "function",
        name: "clip",
        'arguments': arguments
      });
    },
    translate: function() {
      storage.push({
        type: "function",
        name: "translate",
        'arguments': arguments
      });
    },
    fill: function() {
      storage.push({
        type: "function",
        name: "fill",
        'arguments': arguments
      });
    },
    save: function() {
      storage.push({
        type: "function",
        name: "save",
        'arguments': arguments
      });
    },
    restore: function() {
      storage.push({
        type: "function",
        name: "restore",
        'arguments': arguments
      });
    },
    fillRect: function () {
      storage.push({
        type: "function",
        name: "fillRect",
        'arguments': arguments
      });
    },
    createPattern: function() {
      storage.push({
        type: "function",
        name: "createPattern",
        'arguments': arguments
      });
    },
    drawShape: function() {

      var shape = [];

      storage.push({
        type: "function",
        name: "drawShape",
        'arguments': shape
      });

      return {
        moveTo: function() {
          shape.push({
            name: "moveTo",
            'arguments': arguments
          });
        },
        lineTo: function() {
          shape.push({
            name: "lineTo",
            'arguments': arguments
          });
        },
        arcTo: function() {
          shape.push({
            name: "arcTo",
            'arguments': arguments
          });
        },
        bezierCurveTo: function() {
          shape.push({
            name: "bezierCurveTo",
            'arguments': arguments
          });
        },
        quadraticCurveTo: function() {
          shape.push({
            name: "quadraticCurveTo",
            'arguments': arguments
          });
        }
      };

    },
    drawImage: function () {
      storage.push({
        type: "function",
        name: "drawImage",
        'arguments': arguments
      });
    },
    fillText: function () {
      storage.push({
        type: "function",
        name: "fillText",
        'arguments': arguments
      });
    },
    setVariable: function (variable, value) {
      storage.push({
        type: "variable",
        name: variable,
        'arguments': value
      });
      return value;
    }
  };
}
_html2canvas.Parse = function (images, options) {
  window.scroll(0,0);

  var element = (( options.elements === undefined ) ? document.body : options.elements[0]), // select body by default
  numDraws = 0,
  doc = element.ownerDocument,
  Util = _html2canvas.Util,
  support = Util.Support(options, doc),
  ignoreElementsRegExp = new RegExp("(" + options.ignoreElements + ")"),
  body = doc.body,
  getCSS = Util.getCSS,
  pseudoHide = "___html2canvas___pseudoelement",
  hidePseudoElements = doc.createElement('style');

  hidePseudoElements.innerHTML = '.' + pseudoHide + '-before:before { content: "" !important; display: none !important; }' +
  '.' + pseudoHide + '-after:after { content: "" !important; display: none !important; }';

  body.appendChild(hidePseudoElements);

  images = images || {};

  function documentWidth () {
    return Math.max(
      Math.max(doc.body.scrollWidth, doc.documentElement.scrollWidth),
      Math.max(doc.body.offsetWidth, doc.documentElement.offsetWidth),
      Math.max(doc.body.clientWidth, doc.documentElement.clientWidth)
      );
  }

  function documentHeight () {
    return Math.max(
      Math.max(doc.body.scrollHeight, doc.documentElement.scrollHeight),
      Math.max(doc.body.offsetHeight, doc.documentElement.offsetHeight),
      Math.max(doc.body.clientHeight, doc.documentElement.clientHeight)
      );
  }

  function getCSSInt(element, attribute) {
    var val = parseInt(getCSS(element, attribute), 10);
    return (isNaN(val)) ? 0 : val; // borders in old IE are throwing 'medium' for demo.html
  }

  function renderRect (ctx, x, y, w, h, bgcolor) {
    if (bgcolor !== "transparent"){
      ctx.setVariable("fillStyle", bgcolor);
      ctx.fillRect(x, y, w, h);
      numDraws+=1;
    }
  }

  function capitalize(m, p1, p2) {
    if (m.length > 0) {
      return p1 + p2.toUpperCase();
    }
  }

  function textTransform (text, transform) {
    switch(transform){
      case "lowercase":
        return text.toLowerCase();
      case "capitalize":
        return text.replace( /(^|\s|:|-|\(|\))([a-z])/g, capitalize);
      case "uppercase":
        return text.toUpperCase();
      default:
        return text;
    }
  }

  function noLetterSpacing(letter_spacing) {
    return (/^(normal|none|0px)$/.test(letter_spacing));
  }

  function drawText(currentText, x, y, ctx){
    if (currentText !== null && Util.trimText(currentText).length > 0) {
      ctx.fillText(currentText, x, y);
      numDraws+=1;
    }
  }

  function setTextVariables(ctx, el, text_decoration, color) {
    var align = false,
    bold = getCSS(el, "fontWeight"),
    family = getCSS(el, "fontFamily"),
    size = getCSS(el, "fontSize"),
    shadows = Util.parseTextShadows(getCSS(el, "textShadow"));

    switch(parseInt(bold, 10)){
      case 401:
        bold = "bold";
        break;
      case 400:
        bold = "normal";
        break;
    }

    ctx.setVariable("fillStyle", color);
    ctx.setVariable("font", [getCSS(el, "fontStyle"), getCSS(el, "fontVariant"), bold, size, family].join(" "));
    ctx.setVariable("textAlign", (align) ? "right" : "left");

    if (shadows.length) {
      // TODO: support multiple text shadows
      // apply the first text shadow
      ctx.setVariable("shadowColor", shadows[0].color);
      ctx.setVariable("shadowOffsetX", shadows[0].offsetX);
      ctx.setVariable("shadowOffsetY", shadows[0].offsetY);
      ctx.setVariable("shadowBlur", shadows[0].blur);
    }

    if (text_decoration !== "none"){
      return Util.Font(family, size, doc);
    }
  }

  function renderTextDecoration(ctx, text_decoration, bounds, metrics, color) {
    switch(text_decoration) {
      case "underline":
        // Draws a line at the baseline of the font
        // TODO As some browsers display the line as more than 1px if the font-size is big, need to take that into account both in position and size
        renderRect(ctx, bounds.left, Math.round(bounds.top + metrics.baseline + metrics.lineWidth), bounds.width, 1, color);
        break;
      case "overline":
        renderRect(ctx, bounds.left, Math.round(bounds.top), bounds.width, 1, color);
        break;
      case "line-through":
        // TODO try and find exact position for line-through
        renderRect(ctx, bounds.left, Math.ceil(bounds.top + metrics.middle + metrics.lineWidth), bounds.width, 1, color);
        break;
    }
  }

  function getTextBounds(state, text, textDecoration, isLast, transform) {
    var bounds;
    if (support.rangeBounds && !transform) {
      if (textDecoration !== "none" || Util.trimText(text).length !== 0) {
        bounds = textRangeBounds(text, state.node, state.textOffset);
      }
      state.textOffset += text.length;
    } else if (state.node && typeof state.node.nodeValue === "string" ){
      var newTextNode = (isLast) ? state.node.splitText(text.length) : null;
      bounds = textWrapperBounds(state.node, transform);
      state.node = newTextNode;
    }
    return bounds;
  }

  function textRangeBounds(text, textNode, textOffset) {
    var range = doc.createRange();
    range.setStart(textNode, textOffset);
    range.setEnd(textNode, textOffset + text.length);
    return range.getBoundingClientRect();
  }

  function textWrapperBounds(oldTextNode, transform) {
    var parent = oldTextNode.parentNode,
    wrapElement = doc.createElement('wrapper'),
    backupText = oldTextNode.cloneNode(true);

    wrapElement.appendChild(oldTextNode.cloneNode(true));
    parent.replaceChild(wrapElement, oldTextNode);

    var bounds = transform ? Util.OffsetBounds(wrapElement) : Util.Bounds(wrapElement);
    parent.replaceChild(backupText, wrapElement);
    return bounds;
  }

  function renderText(el, textNode, stack) {
    var ctx = stack.ctx,
    color = getCSS(el, "color"),
    textDecoration = getCSS(el, "textDecoration"),
    textAlign = getCSS(el, "textAlign"),
    metrics,
    textList,
    state = {
      node: textNode,
      textOffset: 0
    };

    if (Util.trimText(textNode.nodeValue).length > 0) {
      textNode.nodeValue = textTransform(textNode.nodeValue, getCSS(el, "textTransform"));
      textAlign = textAlign.replace(["-webkit-auto"],["auto"]);

      textList = (!options.letterRendering && /^(left|right|justify|auto)$/.test(textAlign) && noLetterSpacing(getCSS(el, "letterSpacing"))) ?
      textNode.nodeValue.split(/(\b| )/)
      : textNode.nodeValue.split("");

      metrics = setTextVariables(ctx, el, textDecoration, color);

      if (options.chinese) {
        textList.forEach(function(word, index) {
          if (/.*[\u4E00-\u9FA5].*$/.test(word)) {
            word = word.split("");
            word.unshift(index, 1);
            textList.splice.apply(textList, word);
          }
        });
      }

      textList.forEach(function(text, index) {
        var bounds = getTextBounds(state, text, textDecoration, (index < textList.length - 1), stack.transform.matrix);
        if (bounds) {
          drawText(text, bounds.left, bounds.bottom, ctx);
          renderTextDecoration(ctx, textDecoration, bounds, metrics, color);
        }
      });
    }
  }

  function listPosition (element, val) {
    var boundElement = doc.createElement( "boundelement" ),
    originalType,
    bounds;

    boundElement.style.display = "inline";

    originalType = element.style.listStyleType;
    element.style.listStyleType = "none";

    boundElement.appendChild(doc.createTextNode(val));

    element.insertBefore(boundElement, element.firstChild);

    bounds = Util.Bounds(boundElement);
    element.removeChild(boundElement);
    element.style.listStyleType = originalType;
    return bounds;
  }

  function elementIndex(el) {
    var i = -1,
    count = 1,
    childs = el.parentNode.childNodes;

    if (el.parentNode) {
      while(childs[++i] !== el) {
        if (childs[i].nodeType === 1) {
          count++;
        }
      }
      return count;
    } else {
      return -1;
    }
  }

  function listItemText(element, type) {
    var currentIndex = elementIndex(element), text;
    switch(type){
      case "decimal":
        text = currentIndex;
        break;
      case "decimal-leading-zero":
        text = (currentIndex.toString().length === 1) ? currentIndex = "0" + currentIndex.toString() : currentIndex.toString();
        break;
      case "upper-roman":
        text = _html2canvas.Generate.ListRoman( currentIndex );
        break;
      case "lower-roman":
        text = _html2canvas.Generate.ListRoman( currentIndex ).toLowerCase();
        break;
      case "lower-alpha":
        text = _html2canvas.Generate.ListAlpha( currentIndex ).toLowerCase();
        break;
      case "upper-alpha":
        text = _html2canvas.Generate.ListAlpha( currentIndex );
        break;
    }

    return text + ". ";
  }

  function renderListItem(element, stack, elBounds) {
    var x,
    text,
    ctx = stack.ctx,
    type = getCSS(element, "listStyleType"),
    listBounds;

    if (/^(decimal|decimal-leading-zero|upper-alpha|upper-latin|upper-roman|lower-alpha|lower-greek|lower-latin|lower-roman)$/i.test(type)) {
      text = listItemText(element, type);
      listBounds = listPosition(element, text);
      setTextVariables(ctx, element, "none", getCSS(element, "color"));

      if (getCSS(element, "listStylePosition") === "inside") {
        ctx.setVariable("textAlign", "left");
        x = elBounds.left;
      } else {
        return;
      }

      drawText(text, x, listBounds.bottom, ctx);
    }
  }

  function loadImage (src){
    var img = images[src];
    return (img && img.succeeded === true) ? img.img : false;
  }

  function clipBounds(src, dst){
    var x = Math.max(src.left, dst.left),
    y = Math.max(src.top, dst.top),
    x2 = Math.min((src.left + src.width), (dst.left + dst.width)),
    y2 = Math.min((src.top + src.height), (dst.top + dst.height));

    return {
      left:x,
      top:y,
      width:x2-x,
      height:y2-y
    };
  }

  function setZ(element, stack, parentStack){
    var newContext,
    isPositioned = stack.cssPosition !== 'static',
    zIndex = isPositioned ? getCSS(element, 'zIndex') : 'auto',
    opacity = getCSS(element, 'opacity'),
    isFloated = getCSS(element, 'cssFloat') !== 'none';

    // https://developer.mozilla.org/en-US/docs/Web/Guide/CSS/Understanding_z_index/The_stacking_context
    // When a new stacking context should be created:
    // the root element (HTML),
    // positioned (absolutely or relatively) with a z-index value other than "auto",
    // elements with an opacity value less than 1. (See the specification for opacity),
    // on mobile WebKit and Chrome 22+, position: fixed always creates a new stacking context, even when z-index is "auto" (See this post)

    stack.zIndex = newContext = h2czContext(zIndex);
    newContext.isPositioned = isPositioned;
    newContext.isFloated = isFloated;
    newContext.opacity = opacity;
    newContext.ownStacking = (zIndex !== 'auto' || opacity < 1);

    if (parentStack) {
      parentStack.zIndex.children.push(stack);
    }
  }

  function renderImage(ctx, element, image, bounds, borders) {

    var paddingLeft = getCSSInt(element, 'paddingLeft'),
    paddingTop = getCSSInt(element, 'paddingTop'),
    paddingRight = getCSSInt(element, 'paddingRight'),
    paddingBottom = getCSSInt(element, 'paddingBottom');

    drawImage(
      ctx,
      image,
      0, //sx
      0, //sy
      image.width, //sw
      image.height, //sh
      bounds.left + paddingLeft + borders[3].width, //dx
      bounds.top + paddingTop + borders[0].width, // dy
      bounds.width - (borders[1].width + borders[3].width + paddingLeft + paddingRight), //dw
      bounds.height - (borders[0].width + borders[2].width + paddingTop + paddingBottom) //dh
      );
  }

  function getBorderData(element) {
    return ["Top", "Right", "Bottom", "Left"].map(function(side) {
      return {
        width: getCSSInt(element, 'border' + side + 'Width'),
        color: getCSS(element, 'border' + side + 'Color')
      };
    });
  }

  function getBorderRadiusData(element) {
    return ["TopLeft", "TopRight", "BottomRight", "BottomLeft"].map(function(side) {
      return getCSS(element, 'border' + side + 'Radius');
    });
  }

  var getCurvePoints = (function(kappa) {

    return function(x, y, r1, r2) {
      var ox = (r1) * kappa, // control point offset horizontal
      oy = (r2) * kappa, // control point offset vertical
      xm = x + r1, // x-middle
      ym = y + r2; // y-middle
      return {
        topLeft: bezierCurve({
          x:x,
          y:ym
        }, {
          x:x,
          y:ym - oy
        }, {
          x:xm - ox,
          y:y
        }, {
          x:xm,
          y:y
        }),
        topRight: bezierCurve({
          x:x,
          y:y
        }, {
          x:x + ox,
          y:y
        }, {
          x:xm,
          y:ym - oy
        }, {
          x:xm,
          y:ym
        }),
        bottomRight: bezierCurve({
          x:xm,
          y:y
        }, {
          x:xm,
          y:y + oy
        }, {
          x:x + ox,
          y:ym
        }, {
          x:x,
          y:ym
        }),
        bottomLeft: bezierCurve({
          x:xm,
          y:ym
        }, {
          x:xm - ox,
          y:ym
        }, {
          x:x,
          y:y + oy
        }, {
          x:x,
          y:y
        })
      };
    };
  })(4 * ((Math.sqrt(2) - 1) / 3));

  function bezierCurve(start, startControl, endControl, end) {

    var lerp = function (a, b, t) {
      return {
        x:a.x + (b.x - a.x) * t,
        y:a.y + (b.y - a.y) * t
      };
    };

    return {
      start: start,
      startControl: startControl,
      endControl: endControl,
      end: end,
      subdivide: function(t) {
        var ab = lerp(start, startControl, t),
        bc = lerp(startControl, endControl, t),
        cd = lerp(endControl, end, t),
        abbc = lerp(ab, bc, t),
        bccd = lerp(bc, cd, t),
        dest = lerp(abbc, bccd, t);
        return [bezierCurve(start, ab, abbc, dest), bezierCurve(dest, bccd, cd, end)];
      },
      curveTo: function(borderArgs) {
        borderArgs.push(["bezierCurve", startControl.x, startControl.y, endControl.x, endControl.y, end.x, end.y]);
      },
      curveToReversed: function(borderArgs) {
        borderArgs.push(["bezierCurve", endControl.x, endControl.y, startControl.x, startControl.y, start.x, start.y]);
      }
    };
  }

  function parseCorner(borderArgs, radius1, radius2, corner1, corner2, x, y) {
    if (radius1[0] > 0 || radius1[1] > 0) {
      borderArgs.push(["line", corner1[0].start.x, corner1[0].start.y]);
      corner1[0].curveTo(borderArgs);
      corner1[1].curveTo(borderArgs);
    } else {
      borderArgs.push(["line", x, y]);
    }

    if (radius2[0] > 0 || radius2[1] > 0) {
      borderArgs.push(["line", corner2[0].start.x, corner2[0].start.y]);
    }
  }

  function drawSide(borderData, radius1, radius2, outer1, inner1, outer2, inner2) {
    var borderArgs = [];

    if (radius1[0] > 0 || radius1[1] > 0) {
      borderArgs.push(["line", outer1[1].start.x, outer1[1].start.y]);
      outer1[1].curveTo(borderArgs);
    } else {
      borderArgs.push([ "line", borderData.c1[0], borderData.c1[1]]);
    }

    if (radius2[0] > 0 || radius2[1] > 0) {
      borderArgs.push(["line", outer2[0].start.x, outer2[0].start.y]);
      outer2[0].curveTo(borderArgs);
      borderArgs.push(["line", inner2[0].end.x, inner2[0].end.y]);
      inner2[0].curveToReversed(borderArgs);
    } else {
      borderArgs.push([ "line", borderData.c2[0], borderData.c2[1]]);
      borderArgs.push([ "line", borderData.c3[0], borderData.c3[1]]);
    }

    if (radius1[0] > 0 || radius1[1] > 0) {
      borderArgs.push(["line", inner1[1].end.x, inner1[1].end.y]);
      inner1[1].curveToReversed(borderArgs);
    } else {
      borderArgs.push([ "line", borderData.c4[0], borderData.c4[1]]);
    }

    return borderArgs;
  }

  function calculateCurvePoints(bounds, borderRadius, borders) {

    var x = bounds.left,
    y = bounds.top,
    width = bounds.width,
    height = bounds.height,

    tlh = borderRadius[0][0],
    tlv = borderRadius[0][1],
    trh = borderRadius[1][0],
    trv = borderRadius[1][1],
    brh = borderRadius[2][0],
    brv = borderRadius[2][1],
    blh = borderRadius[3][0],
    blv = borderRadius[3][1],

    topWidth = width - trh,
    rightHeight = height - brv,
    bottomWidth = width - brh,
    leftHeight = height - blv;

    return {
      topLeftOuter: getCurvePoints(
        x,
        y,
        tlh,
        tlv
        ).topLeft.subdivide(0.5),

      topLeftInner: getCurvePoints(
        x + borders[3].width,
        y + borders[0].width,
        Math.max(0, tlh - borders[3].width),
        Math.max(0, tlv - borders[0].width)
        ).topLeft.subdivide(0.5),

      topRightOuter: getCurvePoints(
        x + topWidth,
        y,
        trh,
        trv
        ).topRight.subdivide(0.5),

      topRightInner: getCurvePoints(
        x + Math.min(topWidth, width + borders[3].width),
        y + borders[0].width,
        (topWidth > width + borders[3].width) ? 0 :trh - borders[3].width,
        trv - borders[0].width
        ).topRight.subdivide(0.5),

      bottomRightOuter: getCurvePoints(
        x + bottomWidth,
        y + rightHeight,
        brh,
        brv
        ).bottomRight.subdivide(0.5),

      bottomRightInner: getCurvePoints(
        x + Math.min(bottomWidth, width + borders[3].width),
        y + Math.min(rightHeight, height + borders[0].width),
        Math.max(0, brh - borders[1].width),
        Math.max(0, brv - borders[2].width)
        ).bottomRight.subdivide(0.5),

      bottomLeftOuter: getCurvePoints(
        x,
        y + leftHeight,
        blh,
        blv
        ).bottomLeft.subdivide(0.5),

      bottomLeftInner: getCurvePoints(
        x + borders[3].width,
        y + leftHeight,
        Math.max(0, blh - borders[3].width),
        Math.max(0, blv - borders[2].width)
        ).bottomLeft.subdivide(0.5)
    };
  }

  function getBorderClip(element, borderPoints, borders, radius, bounds) {
    var backgroundClip = getCSS(element, 'backgroundClip'),
    borderArgs = [];

    switch(backgroundClip) {
      case "content-box":
      case "padding-box":
        parseCorner(borderArgs, radius[0], radius[1], borderPoints.topLeftInner, borderPoints.topRightInner, bounds.left + borders[3].width, bounds.top + borders[0].width);
        parseCorner(borderArgs, radius[1], radius[2], borderPoints.topRightInner, borderPoints.bottomRightInner, bounds.left + bounds.width - borders[1].width, bounds.top + borders[0].width);
        parseCorner(borderArgs, radius[2], radius[3], borderPoints.bottomRightInner, borderPoints.bottomLeftInner, bounds.left + bounds.width - borders[1].width, bounds.top + bounds.height - borders[2].width);
        parseCorner(borderArgs, radius[3], radius[0], borderPoints.bottomLeftInner, borderPoints.topLeftInner, bounds.left + borders[3].width, bounds.top + bounds.height - borders[2].width);
        break;

      default:
        parseCorner(borderArgs, radius[0], radius[1], borderPoints.topLeftOuter, borderPoints.topRightOuter, bounds.left, bounds.top);
        parseCorner(borderArgs, radius[1], radius[2], borderPoints.topRightOuter, borderPoints.bottomRightOuter, bounds.left + bounds.width, bounds.top);
        parseCorner(borderArgs, radius[2], radius[3], borderPoints.bottomRightOuter, borderPoints.bottomLeftOuter, bounds.left + bounds.width, bounds.top + bounds.height);
        parseCorner(borderArgs, radius[3], radius[0], borderPoints.bottomLeftOuter, borderPoints.topLeftOuter, bounds.left, bounds.top + bounds.height);
        break;
    }

    return borderArgs;
  }

  function parseBorders(element, bounds, borders){
    var x = bounds.left,
    y = bounds.top,
    width = bounds.width,
    height = bounds.height,
    borderSide,
    bx,
    by,
    bw,
    bh,
    borderArgs,
    // http://www.w3.org/TR/css3-background/#the-border-radius
    borderRadius = getBorderRadiusData(element),
    borderPoints = calculateCurvePoints(bounds, borderRadius, borders),
    borderData = {
      clip: getBorderClip(element, borderPoints, borders, borderRadius, bounds),
      borders: []
    };

    for (borderSide = 0; borderSide < 4; borderSide++) {

      if (borders[borderSide].width > 0) {
        bx = x;
        by = y;
        bw = width;
        bh = height - (borders[2].width);

        switch(borderSide) {
          case 0:
            // top border
            bh = borders[0].width;

            borderArgs = drawSide({
              c1: [bx, by],
              c2: [bx + bw, by],
              c3: [bx + bw - borders[1].width, by + bh],
              c4: [bx + borders[3].width, by + bh]
            }, borderRadius[0], borderRadius[1],
            borderPoints.topLeftOuter, borderPoints.topLeftInner, borderPoints.topRightOuter, borderPoints.topRightInner);
            break;
          case 1:
            // right border
            bx = x + width - (borders[1].width);
            bw = borders[1].width;

            borderArgs = drawSide({
              c1: [bx + bw, by],
              c2: [bx + bw, by + bh + borders[2].width],
              c3: [bx, by + bh],
              c4: [bx, by + borders[0].width]
            }, borderRadius[1], borderRadius[2],
            borderPoints.topRightOuter, borderPoints.topRightInner, borderPoints.bottomRightOuter, borderPoints.bottomRightInner);
            break;
          case 2:
            // bottom border
            by = (by + height) - (borders[2].width);
            bh = borders[2].width;

            borderArgs = drawSide({
              c1: [bx + bw, by + bh],
              c2: [bx, by + bh],
              c3: [bx + borders[3].width, by],
              c4: [bx + bw - borders[3].width, by]
            }, borderRadius[2], borderRadius[3],
            borderPoints.bottomRightOuter, borderPoints.bottomRightInner, borderPoints.bottomLeftOuter, borderPoints.bottomLeftInner);
            break;
          case 3:
            // left border
            bw = borders[3].width;

            borderArgs = drawSide({
              c1: [bx, by + bh + borders[2].width],
              c2: [bx, by],
              c3: [bx + bw, by + borders[0].width],
              c4: [bx + bw, by + bh]
            }, borderRadius[3], borderRadius[0],
            borderPoints.bottomLeftOuter, borderPoints.bottomLeftInner, borderPoints.topLeftOuter, borderPoints.topLeftInner);
            break;
        }

        borderData.borders.push({
          args: borderArgs,
          color: borders[borderSide].color
        });

      }
    }

    return borderData;
  }

  function createShape(ctx, args) {
    var shape = ctx.drawShape();
    args.forEach(function(border, index) {
      shape[(index === 0) ? "moveTo" : border[0] + "To" ].apply(null, border.slice(1));
    });
    return shape;
  }

  function renderBorders(ctx, borderArgs, color) {
    if (color !== "transparent") {
      ctx.setVariable( "fillStyle", color);
      createShape(ctx, borderArgs);
      ctx.fill();
      numDraws+=1;
    }
  }

  function renderFormValue (el, bounds, stack){

    var valueWrap = doc.createElement('valuewrap'),
    cssPropertyArray = ['lineHeight','textAlign','fontFamily','color','fontSize','paddingLeft','paddingTop','width','height','border','borderLeftWidth','borderTopWidth'],
    textValue,
    textNode;

    cssPropertyArray.forEach(function(property) {
      try {
        valueWrap.style[property] = getCSS(el, property);
      } catch(e) {
        // Older IE has issues with "border"
        Util.log("html2canvas: Parse: Exception caught in renderFormValue: " + e.message);
      }
    });

    valueWrap.style.borderColor = "black";
    valueWrap.style.borderStyle = "solid";
    valueWrap.style.display = "block";
    valueWrap.style.position = "absolute";

    if (/^(submit|reset|button|text|password)$/.test(el.type) || el.nodeName === "SELECT"){
      valueWrap.style.lineHeight = getCSS(el, "height");
    }

    valueWrap.style.top = bounds.top + "px";
    valueWrap.style.left = bounds.left + "px";

    textValue = (el.nodeName === "SELECT") ? (el.options[el.selectedIndex] || 0).text : el.value;
    if(!textValue) {
      textValue = el.placeholder;
    }

    textNode = doc.createTextNode(textValue);

    valueWrap.appendChild(textNode);
    body.appendChild(valueWrap);

    renderText(el, textNode, stack);
    body.removeChild(valueWrap);
  }

  function drawImage (ctx) {
    ctx.drawImage.apply(ctx, Array.prototype.slice.call(arguments, 1));
    numDraws+=1;
  }

  function getPseudoElement(el, which) {
    var elStyle = window.getComputedStyle(el, which);
    if(!elStyle || !elStyle.content || elStyle.content === "none" || elStyle.content === "-moz-alt-content" || elStyle.display === "none") {
      return;
    }
    var content = elStyle.content + '',
    first = content.substr( 0, 1 );
    //strips quotes
    if(first === content.substr( content.length - 1 ) && first.match(/'|"/)) {
      content = content.substr( 1, content.length - 2 );
    }

    var isImage = content.substr( 0, 3 ) === 'url',
    elps = document.createElement( isImage ? 'img' : 'span' );

    elps.className = pseudoHide + "-before " + pseudoHide + "-after";

    Object.keys(elStyle).filter(indexedProperty).forEach(function(prop) {
      // Prevent assigning of read only CSS Rules, ex. length, parentRule
      try {
        elps.style[prop] = elStyle[prop];
      } catch (e) {
        Util.log(['Tried to assign readonly property ', prop, 'Error:', e]);
      }
    });

    if(isImage) {
      elps.src = Util.parseBackgroundImage(content)[0].args[0];
    } else {
      elps.innerHTML = content;
    }
    return elps;
  }

  function indexedProperty(property) {
    return (isNaN(window.parseInt(property, 10)));
  }

  function injectPseudoElements(el, stack) {
    var before = getPseudoElement(el, ':before'),
    after = getPseudoElement(el, ':after');
    if(!before && !after) {
      return;
    }

    if(before) {
      el.className += " " + pseudoHide + "-before";
      el.parentNode.insertBefore(before, el);
      parseElement(before, stack, true);
      el.parentNode.removeChild(before);
      el.className = el.className.replace(pseudoHide + "-before", "").trim();
    }

    if (after) {
      el.className += " " + pseudoHide + "-after";
      el.appendChild(after);
      parseElement(after, stack, true);
      el.removeChild(after);
      el.className = el.className.replace(pseudoHide + "-after", "").trim();
    }

  }

  function renderBackgroundRepeat(ctx, image, backgroundPosition, bounds) {
    var offsetX = Math.round(bounds.left + backgroundPosition.left),
    offsetY = Math.round(bounds.top + backgroundPosition.top);

    ctx.createPattern(image);
    ctx.translate(offsetX, offsetY);
    ctx.fill();
    ctx.translate(-offsetX, -offsetY);
  }

  function backgroundRepeatShape(ctx, image, backgroundPosition, bounds, left, top, width, height) {
    var args = [];
    args.push(["line", Math.round(left), Math.round(top)]);
    args.push(["line", Math.round(left + width), Math.round(top)]);
    args.push(["line", Math.round(left + width), Math.round(height + top)]);
    args.push(["line", Math.round(left), Math.round(height + top)]);
    createShape(ctx, args);
    ctx.save();
    ctx.clip();
    renderBackgroundRepeat(ctx, image, backgroundPosition, bounds);
    ctx.restore();
  }

  function renderBackgroundColor(ctx, backgroundBounds, bgcolor) {
    renderRect(
      ctx,
      backgroundBounds.left,
      backgroundBounds.top,
      backgroundBounds.width,
      backgroundBounds.height,
      bgcolor
      );
  }

  function renderBackgroundRepeating(el, bounds, ctx, image, imageIndex) {
    var backgroundSize = Util.BackgroundSize(el, bounds, image, imageIndex),
    backgroundPosition = Util.BackgroundPosition(el, bounds, image, imageIndex, backgroundSize),
    backgroundRepeat = getCSS(el, "backgroundRepeat").split(",").map(Util.trimText);

    image = resizeImage(image, backgroundSize);

    backgroundRepeat = backgroundRepeat[imageIndex] || backgroundRepeat[0];

    switch (backgroundRepeat) {
      case "repeat-x":
        backgroundRepeatShape(ctx, image, backgroundPosition, bounds,
          bounds.left, bounds.top + backgroundPosition.top, 99999, image.height);
        break;

      case "repeat-y":
        backgroundRepeatShape(ctx, image, backgroundPosition, bounds,
          bounds.left + backgroundPosition.left, bounds.top, image.width, 99999);
        break;

      case "no-repeat":
        backgroundRepeatShape(ctx, image, backgroundPosition, bounds,
          bounds.left + backgroundPosition.left, bounds.top + backgroundPosition.top, image.width, image.height);
        break;

      default:
        renderBackgroundRepeat(ctx, image, backgroundPosition, {
          top: bounds.top,
          left: bounds.left,
          width: image.width,
          height: image.height
        });
        break;
    }
  }

  function renderBackgroundImage(element, bounds, ctx) {
    var backgroundImage = getCSS(element, "backgroundImage"),
    backgroundImages = Util.parseBackgroundImage(backgroundImage),
    image,
    imageIndex = backgroundImages.length;

    while(imageIndex--) {
      backgroundImage = backgroundImages[imageIndex];

      if (!backgroundImage.args || backgroundImage.args.length === 0) {
        continue;
      }

      var key = backgroundImage.method === 'url' ?
      backgroundImage.args[0] :
      backgroundImage.value;

      image = loadImage(key);

      // TODO add support for background-origin
      if (image) {
        renderBackgroundRepeating(element, bounds, ctx, image, imageIndex);
      } else {
        Util.log("html2canvas: Error loading background:", backgroundImage);
      }
    }
  }

  function resizeImage(image, bounds) {
    if(image.width === bounds.width && image.height === bounds.height) {
      return image;
    }

    var ctx, canvas = doc.createElement('canvas');
    canvas.width = bounds.width;
    canvas.height = bounds.height;
    ctx = canvas.getContext("2d");
    drawImage(ctx, image, 0, 0, image.width, image.height, 0, 0, bounds.width, bounds.height );
    return canvas;
  }

  function setOpacity(ctx, element, parentStack) {
    return ctx.setVariable("globalAlpha", getCSS(element, "opacity") * ((parentStack) ? parentStack.opacity : 1));
  }

  function removePx(str) {
    return str.replace("px", "");
  }

  var transformRegExp = /(matrix)\((.+)\)/;

  function getTransform(element, parentStack) {
    var transform = getCSS(element, "transform") || getCSS(element, "-webkit-transform") || getCSS(element, "-moz-transform") || getCSS(element, "-ms-transform") || getCSS(element, "-o-transform");
    var transformOrigin = getCSS(element, "transform-origin") || getCSS(element, "-webkit-transform-origin") || getCSS(element, "-moz-transform-origin") || getCSS(element, "-ms-transform-origin") || getCSS(element, "-o-transform-origin") || "0px 0px";

    transformOrigin = transformOrigin.split(" ").map(removePx).map(Util.asFloat);

    var matrix;
    if (transform && transform !== "none") {
      var match = transform.match(transformRegExp);
      if (match) {
        switch(match[1]) {
          case "matrix":
            matrix = match[2].split(",").map(Util.trimText).map(Util.asFloat);
            break;
        }
      }
    }

    return {
      origin: transformOrigin,
      matrix: matrix
    };
  }

  function createStack(element, parentStack, bounds, transform) {
    var ctx = h2cRenderContext((!parentStack) ? documentWidth() : bounds.width , (!parentStack) ? documentHeight() : bounds.height),
    stack = {
      ctx: ctx,
      opacity: setOpacity(ctx, element, parentStack),
      cssPosition: getCSS(element, "position"),
      borders: getBorderData(element),
      transform: transform,
      clip: (parentStack && parentStack.clip) ? Util.Extend( {}, parentStack.clip ) : null
    };

    setZ(element, stack, parentStack);

    // TODO correct overflow for absolute content residing under a static position
    if (options.useOverflow === true && /(hidden|scroll|auto)/.test(getCSS(element, "overflow")) === true && /(BODY)/i.test(element.nodeName) === false){
      stack.clip = (stack.clip) ? clipBounds(stack.clip, bounds) : bounds;
    }

    return stack;
  }

  function getBackgroundBounds(borders, bounds, clip) {
    var backgroundBounds = {
      left: bounds.left + borders[3].width,
      top: bounds.top + borders[0].width,
      width: bounds.width - (borders[1].width + borders[3].width),
      height: bounds.height - (borders[0].width + borders[2].width)
    };

    if (clip) {
      backgroundBounds = clipBounds(backgroundBounds, clip);
    }

    return backgroundBounds;
  }

  function getBounds(element, transform) {
    var bounds = (transform.matrix) ? Util.OffsetBounds(element) : Util.Bounds(element);
    transform.origin[0] += bounds.left;
    transform.origin[1] += bounds.top;
    return bounds;
  }

  function renderElement(element, parentStack, pseudoElement, ignoreBackground) {
    var transform = getTransform(element, parentStack),
    bounds = getBounds(element, transform),
    image,
    stack = createStack(element, parentStack, bounds, transform),
    borders = stack.borders,
    ctx = stack.ctx,
    backgroundBounds = getBackgroundBounds(borders, bounds, stack.clip),
    borderData = parseBorders(element, bounds, borders),
    backgroundColor = (ignoreElementsRegExp.test(element.nodeName)) ? "#efefef" : getCSS(element, "backgroundColor");


    createShape(ctx, borderData.clip);

    ctx.save();
    ctx.clip();

    if (backgroundBounds.height > 0 && backgroundBounds.width > 0 && !ignoreBackground) {
      renderBackgroundColor(ctx, bounds, backgroundColor);
      renderBackgroundImage(element, backgroundBounds, ctx);
    } else if (ignoreBackground) {
      stack.backgroundColor =  backgroundColor;
    }

    ctx.restore();

    borderData.borders.forEach(function(border) {
      renderBorders(ctx, border.args, border.color);
    });

    if (!pseudoElement) {
      injectPseudoElements(element, stack);
    }

    switch(element.nodeName){
      case "IMG":
        if ((image = loadImage(element.getAttribute('src')))) {
          renderImage(ctx, element, image, bounds, borders);
        } else {
          Util.log("html2canvas: Error loading <img>:" + element.getAttribute('src'));
        }
        break;
      case "INPUT":
        // TODO add all relevant type's, i.e. HTML5 new stuff
        // todo add support for placeholder attribute for browsers which support it
        if (/^(text|url|email|submit|button|reset)$/.test(element.type) && (element.value || element.placeholder || "").length > 0){
          renderFormValue(element, bounds, stack);
        }
        break;
      case "TEXTAREA":
        if ((element.value || element.placeholder || "").length > 0){
          renderFormValue(element, bounds, stack);
        }
        break;
      case "SELECT":
        if ((element.options||element.placeholder || "").length > 0){
          renderFormValue(element, bounds, stack);
        }
        break;
      case "LI":
        renderListItem(element, stack, backgroundBounds);
        break;
      case "CANVAS":
        renderImage(ctx, element, element, bounds, borders);
        break;
    }

    return stack;
  }

  function isElementVisible(element) {
    return (getCSS(element, 'display') !== "none" && getCSS(element, 'visibility') !== "hidden" && !element.hasAttribute("data-html2canvas-ignore"));
  }

  function parseElement (element, stack, pseudoElement) {
    if (isElementVisible(element)) {
      stack = renderElement(element, stack, pseudoElement, false) || stack;
      if (!ignoreElementsRegExp.test(element.nodeName)) {
        parseChildren(element, stack, pseudoElement);
      }
    }
  }

  function parseChildren(element, stack, pseudoElement) {
    Util.Children(element).forEach(function(node) {
      if (node.nodeType === node.ELEMENT_NODE) {
        parseElement(node, stack, pseudoElement);
      } else if (node.nodeType === node.TEXT_NODE) {
        renderText(element, node, stack);
      }
    });
  }

  function init() {
    var background = getCSS(document.documentElement, "backgroundColor"),
      transparentBackground = (Util.isTransparent(background) && element === document.body),
      stack = renderElement(element, null, false, transparentBackground);
    parseChildren(element, stack);

    if (transparentBackground) {
      background = stack.backgroundColor;
    }

    body.removeChild(hidePseudoElements);
    return {
      backgroundColor: background,
      stack: stack
    };
  }

  return init();
};

function h2czContext(zindex) {
  return {
    zindex: zindex,
    children: []
  };
}

_html2canvas.Preload = function( options ) {

  var images = {
    numLoaded: 0,   // also failed are counted here
    numFailed: 0,
    numTotal: 0,
    cleanupDone: false
  },
  pageOrigin,
  Util = _html2canvas.Util,
  methods,
  i,
  count = 0,
  element = options.elements[0] || document.body,
  doc = element.ownerDocument,
  domImages = element.getElementsByTagName('img'), // Fetch images of the present element only
  imgLen = domImages.length,
  link = doc.createElement("a"),
  supportCORS = (function( img ){
    return (img.crossOrigin !== undefined);
  })(new Image()),
  timeoutTimer;

  link.href = window.location.href;
  pageOrigin  = link.protocol + link.host;

  function isSameOrigin(url){
    link.href = url;
    link.href = link.href; // YES, BELIEVE IT OR NOT, that is required for IE9 - http://jsfiddle.net/niklasvh/2e48b/
    var origin = link.protocol + link.host;
    return (origin === pageOrigin);
  }

  function start(){
    Util.log("html2canvas: start: images: " + images.numLoaded + " / " + images.numTotal + " (failed: " + images.numFailed + ")");
    if (!images.firstRun && images.numLoaded >= images.numTotal){
      Util.log("Finished loading images: # " + images.numTotal + " (failed: " + images.numFailed + ")");

      if (typeof options.complete === "function"){
        options.complete(images);
      }

    }
  }

  // TODO modify proxy to serve images with CORS enabled, where available
  function proxyGetImage(url, img, imageObj){
    var callback_name,
    scriptUrl = options.proxy,
    script;

    link.href = url;
    url = link.href; // work around for pages with base href="" set - WARNING: this may change the url

    callback_name = 'html2canvas_' + (count++);
    imageObj.callbackname = callback_name;

    if (scriptUrl.indexOf("?") > -1) {
      scriptUrl += "&";
    } else {
      scriptUrl += "?";
    }
    scriptUrl += 'url=' + encodeURIComponent(url) + '&callback=' + callback_name;
    script = doc.createElement("script");

    window[callback_name] = function(a){
      if (a.substring(0,6) === "error:"){
        imageObj.succeeded = false;
        images.numLoaded++;
        images.numFailed++;
        start();
      } else {
        setImageLoadHandlers(img, imageObj);
        img.src = a;
      }
      window[callback_name] = undefined; // to work with IE<9  // NOTE: that the undefined callback property-name still exists on the window object (for IE<9)
      try {
        delete window[callback_name];  // for all browser that support this
      } catch(ex) {}
      script.parentNode.removeChild(script);
      script = null;
      delete imageObj.script;
      delete imageObj.callbackname;
    };

    script.setAttribute("type", "text/javascript");
    script.setAttribute("src", scriptUrl);
    imageObj.script = script;
    window.document.body.appendChild(script);

  }

  function loadPseudoElement(element, type) {
    var style = window.getComputedStyle(element, type),
    content = style.content;
    if (content.substr(0, 3) === 'url') {
      methods.loadImage(_html2canvas.Util.parseBackgroundImage(content)[0].args[0]);
    }
    loadBackgroundImages(style.backgroundImage, element);
  }

  function loadPseudoElementImages(element) {
    loadPseudoElement(element, ":before");
    loadPseudoElement(element, ":after");
  }

  function loadGradientImage(backgroundImage, bounds) {
    var img = _html2canvas.Generate.Gradient(backgroundImage, bounds);

    if (img !== undefined){
      images[backgroundImage] = {
        img: img,
        succeeded: true
      };
      images.numTotal++;
      images.numLoaded++;
      start();
    }
  }

  function invalidBackgrounds(background_image) {
    return (background_image && background_image.method && background_image.args && background_image.args.length > 0 );
  }

  function loadBackgroundImages(background_image, el) {
    var bounds;

    _html2canvas.Util.parseBackgroundImage(background_image).filter(invalidBackgrounds).forEach(function(background_image) {
      if (background_image.method === 'url') {
        methods.loadImage(background_image.args[0]);
      } else if(background_image.method.match(/\-?gradient$/)) {
        if(bounds === undefined) {
          bounds = _html2canvas.Util.Bounds(el);
        }
        loadGradientImage(background_image.value, bounds);
      }
    });
  }

  function getImages (el) {
    var elNodeType = false;

    // Firefox fails with permission denied on pages with iframes
    try {
      Util.Children(el).forEach(getImages);
    }
    catch( e ) {}

    try {
      elNodeType = el.nodeType;
    } catch (ex) {
      elNodeType = false;
      Util.log("html2canvas: failed to access some element's nodeType - Exception: " + ex.message);
    }

    if (elNodeType === 1 || elNodeType === undefined) {
      loadPseudoElementImages(el);
      try {
        loadBackgroundImages(Util.getCSS(el, 'backgroundImage'), el);
      } catch(e) {
        Util.log("html2canvas: failed to get background-image - Exception: " + e.message);
      }
      loadBackgroundImages(el);
    }
  }

  function setImageLoadHandlers(img, imageObj) {
    img.onload = function() {
      if ( imageObj.timer !== undefined ) {
        // CORS succeeded
        window.clearTimeout( imageObj.timer );
      }

      images.numLoaded++;
      imageObj.succeeded = true;
      img.onerror = img.onload = null;
      start();
    };
    img.onerror = function() {
      if (img.crossOrigin === "anonymous") {
        // CORS failed
        window.clearTimeout( imageObj.timer );

        // let's try with proxy instead
        if ( options.proxy ) {
          var src = img.src;
          img = new Image();
          imageObj.img = img;
          img.src = src;

          proxyGetImage( img.src, img, imageObj );
          return;
        }
      }

      images.numLoaded++;
      images.numFailed++;
      imageObj.succeeded = false;
      img.onerror = img.onload = null;
      start();
    };
  }

  methods = {
    loadImage: function( src ) {
      var img, imageObj;
      if ( src && images[src] === undefined ) {
        img = new Image();
        if ( src.match(/data:image\/.*;base64,/i) ) {
          img.src = src.replace(/url\(['"]{0,}|['"]{0,}\)$/ig, '');
          imageObj = images[src] = {
            img: img
          };
          images.numTotal++;
          setImageLoadHandlers(img, imageObj);
        } else if ( isSameOrigin( src ) || options.allowTaint ===  true ) {
          imageObj = images[src] = {
            img: img
          };
          images.numTotal++;
          setImageLoadHandlers(img, imageObj);
          img.src = src;
        } else if ( supportCORS && !options.allowTaint && options.useCORS ) {
          // attempt to load with CORS

          img.crossOrigin = "anonymous";
          imageObj = images[src] = {
            img: img
          };
          images.numTotal++;
          setImageLoadHandlers(img, imageObj);
          img.src = src;
        } else if ( options.proxy ) {
          imageObj = images[src] = {
            img: img
          };
          images.numTotal++;
          proxyGetImage( src, img, imageObj );
        }
      }

    },
    cleanupDOM: function(cause) {
      var img, src;
      if (!images.cleanupDone) {
        if (cause && typeof cause === "string") {
          Util.log("html2canvas: Cleanup because: " + cause);
        } else {
          Util.log("html2canvas: Cleanup after timeout: " + options.timeout + " ms.");
        }

        for (src in images) {
          if (images.hasOwnProperty(src)) {
            img = images[src];
            if (typeof img === "object" && img.callbackname && img.succeeded === undefined) {
              // cancel proxy image request
              window[img.callbackname] = undefined; // to work with IE<9  // NOTE: that the undefined callback property-name still exists on the window object (for IE<9)
              try {
                delete window[img.callbackname];  // for all browser that support this
              } catch(ex) {}
              if (img.script && img.script.parentNode) {
                img.script.setAttribute("src", "about:blank");  // try to cancel running request
                img.script.parentNode.removeChild(img.script);
              }
              images.numLoaded++;
              images.numFailed++;
              Util.log("html2canvas: Cleaned up failed img: '" + src + "' Steps: " + images.numLoaded + " / " + images.numTotal);
            }
          }
        }

        // cancel any pending requests
        if(window.stop !== undefined) {
          window.stop();
        } else if(document.execCommand !== undefined) {
          document.execCommand("Stop", false);
        }
        if (document.close !== undefined) {
          document.close();
        }
        images.cleanupDone = true;
        if (!(cause && typeof cause === "string")) {
          start();
        }
      }
    },

    renderingDone: function() {
      if (timeoutTimer) {
        window.clearTimeout(timeoutTimer);
      }
    }
  };

  if (options.timeout > 0) {
    timeoutTimer = window.setTimeout(methods.cleanupDOM, options.timeout);
  }

  Util.log('html2canvas: Preload starts: finding background-images');
  images.firstRun = true;

  getImages(element);

  Util.log('html2canvas: Preload: Finding images');
  // load <img> images
  for (i = 0; i < imgLen; i+=1){
    methods.loadImage( domImages[i].getAttribute( "src" ) );
  }

  images.firstRun = false;
  Util.log('html2canvas: Preload: Done.');
  if (images.numTotal === images.numLoaded) {
    start();
  }

  return methods;
};

_html2canvas.Renderer = function(parseQueue, options){

  // http://www.w3.org/TR/CSS21/zindex.html
  function createRenderQueue(parseQueue) {
    var queue = [],
    rootContext;

    rootContext = (function buildStackingContext(rootNode) {
      var rootContext = {};
      function insert(context, node, specialParent) {
        var zi = (node.zIndex.zindex === 'auto') ? 0 : Number(node.zIndex.zindex),
        contextForChildren = context, // the stacking context for children
        isPositioned = node.zIndex.isPositioned,
        isFloated = node.zIndex.isFloated,
        stub = {node: node},
        childrenDest = specialParent; // where children without z-index should be pushed into

        if (node.zIndex.ownStacking) {
          // '!' comes before numbers in sorted array
          contextForChildren = stub.context = { '!': [{node:node, children: []}]};
          childrenDest = undefined;
        } else if (isPositioned || isFloated) {
          childrenDest = stub.children = [];
        }

        if (zi === 0 && specialParent) {
          specialParent.push(stub);
        } else {
          if (!context[zi]) { context[zi] = []; }
          context[zi].push(stub);
        }

        node.zIndex.children.forEach(function(childNode) {
          insert(contextForChildren, childNode, childrenDest);
        });
      }
      insert(rootContext, rootNode);
      return rootContext;
    })(parseQueue);

    function sortZ(context) {
      Object.keys(context).sort().forEach(function(zi) {
        var nonPositioned = [],
        floated = [],
        positioned = [],
        list = [];

        // positioned after static
        context[zi].forEach(function(v) {
          if (v.node.zIndex.isPositioned || v.node.zIndex.opacity < 1) {
            // http://www.w3.org/TR/css3-color/#transparency
            // non-positioned element with opactiy < 1 should be stacked as if it were a positioned element with ‘z-index: 0’ and ‘opacity: 1’.
            positioned.push(v);
          } else if (v.node.zIndex.isFloated) {
            floated.push(v);
          } else {
            nonPositioned.push(v);
          }
        });

        (function walk(arr) {
          arr.forEach(function(v) {
            list.push(v);
            if (v.children) { walk(v.children); }
          });
        })(nonPositioned.concat(floated, positioned));

        list.forEach(function(v) {
          if (v.context) {
            sortZ(v.context);
          } else {
            queue.push(v.node);
          }
        });
      });
    }

    sortZ(rootContext);

    return queue;
  }

  function getRenderer(rendererName) {
    var renderer;

    if (typeof options.renderer === "string" && _html2canvas.Renderer[rendererName] !== undefined) {
      renderer = _html2canvas.Renderer[rendererName](options);
    } else if (typeof rendererName === "function") {
      renderer = rendererName(options);
    } else {
      throw new Error("Unknown renderer");
    }

    if ( typeof renderer !== "function" ) {
      throw new Error("Invalid renderer defined");
    }
    return renderer;
  }

  return getRenderer(options.renderer)(parseQueue, options, document, createRenderQueue(parseQueue.stack), _html2canvas);
};

_html2canvas.Util.Support = function (options, doc) {

  function supportSVGRendering() {
    var img = new Image(),
    canvas = doc.createElement("canvas"),
    ctx = (canvas.getContext === undefined) ? false : canvas.getContext("2d");
    if (ctx === false) {
      return false;
    }
    canvas.width = canvas.height = 10;
    img.src = [
    "data:image/svg+xml,",
    "<svg xmlns='http://www.w3.org/2000/svg' width='10' height='10'>",
    "<foreignObject width='10' height='10'>",
    "<div xmlns='http://www.w3.org/1999/xhtml' style='width:10;height:10;'>",
    "sup",
    "</div>",
    "</foreignObject>",
    "</svg>"
    ].join("");
    try {
      ctx.drawImage(img, 0, 0);
      canvas.toDataURL();
    } catch(e) {
      return false;
    }
    _html2canvas.Util.log('html2canvas: Parse: SVG powered rendering available');
    return true;
  }

  // Test whether we can use ranges to measure bounding boxes
  // Opera doesn't provide valid bounds.height/bottom even though it supports the method.

  function supportRangeBounds() {
    var r, testElement, rangeBounds, rangeHeight, support = false;

    if (doc.createRange) {
      r = doc.createRange();
      if (r.getBoundingClientRect) {
        testElement = doc.createElement('boundtest');
        testElement.style.height = "123px";
        testElement.style.display = "block";
        doc.body.appendChild(testElement);

        r.selectNode(testElement);
        rangeBounds = r.getBoundingClientRect();
        rangeHeight = rangeBounds.height;

        if (rangeHeight === 123) {
          support = true;
        }
        doc.body.removeChild(testElement);
      }
    }

    return support;
  }

  return {
    rangeBounds: supportRangeBounds(),
    svgRendering: options.svgRendering && supportSVGRendering()
  };
};
window.html2canvas = function(elements, opts) {
  elements = (elements.length) ? elements : [elements];
  var queue,
  canvas,
  options = {
    // general
    logging: false,
    elements: elements,
    background: "#fff",

    // preload options
    proxy: null,
    timeout: 0,    // no timeout
    useCORS: false, // try to load images as CORS (where available), before falling back to proxy
    allowTaint: false, // whether to allow images to taint the canvas, won't need proxy if set to true

    // parse options
    svgRendering: false, // use svg powered rendering where available (FF11+)
    ignoreElements: "IFRAME|OBJECT|PARAM",
    useOverflow: true,
    letterRendering: false,
    chinese: false,

    // render options

    width: null,
    height: null,
    taintTest: true, // do a taint test with all images before applying to canvas
    renderer: "Canvas"
  };

  options = _html2canvas.Util.Extend(opts, options);

  _html2canvas.logging = options.logging;
  options.complete = function( images ) {

    if (typeof options.onpreloaded === "function") {
      if ( options.onpreloaded( images ) === false ) {
        return;
      }
    }
    queue = _html2canvas.Parse( images, options );

    if (typeof options.onparsed === "function") {
      if ( options.onparsed( queue ) === false ) {
        return;
      }
    }

    canvas = _html2canvas.Renderer( queue, options );

    if (typeof options.onrendered === "function") {
      options.onrendered( canvas );
    }


  };

  // for pages without images, we still want this to be async, i.e. return methods before executing
  window.setTimeout( function(){
    _html2canvas.Preload( options );
  }, 0 );

  return {
    render: function( queue, opts ) {
      return _html2canvas.Renderer( queue, _html2canvas.Util.Extend(opts, options) );
    },
    parse: function( images, opts ) {
      return _html2canvas.Parse( images, _html2canvas.Util.Extend(opts, options) );
    },
    preload: function( opts ) {
      return _html2canvas.Preload( _html2canvas.Util.Extend(opts, options) );
    },
    log: _html2canvas.Util.log
  };
};

window.html2canvas.log = _html2canvas.Util.log; // for renderers
window.html2canvas.Renderer = {
  Canvas: undefined // We are assuming this will be used
};
_html2canvas.Renderer.Canvas = function(options) {
  options = options || {};

  var doc = document,
  safeImages = [],
  testCanvas = document.createElement("canvas"),
  testctx = testCanvas.getContext("2d"),
  Util = _html2canvas.Util,
  canvas = options.canvas || doc.createElement('canvas');

  function createShape(ctx, args) {
    ctx.beginPath();
    args.forEach(function(arg) {
      ctx[arg.name].apply(ctx, arg['arguments']);
    });
    ctx.closePath();
  }

  function safeImage(item) {
    if (safeImages.indexOf(item['arguments'][0].src ) === -1) {
      testctx.drawImage(item['arguments'][0], 0, 0);
      try {
        testctx.getImageData(0, 0, 1, 1);
      } catch(e) {
        testCanvas = doc.createElement("canvas");
        testctx = testCanvas.getContext("2d");
        return false;
      }
      safeImages.push(item['arguments'][0].src);
    }
    return true;
  }

  function renderItem(ctx, item) {
    switch(item.type){
      case "variable":
        ctx[item.name] = item['arguments'];
        break;
      case "function":
        switch(item.name) {
          case "createPattern":
            if (item['arguments'][0].width > 0 && item['arguments'][0].height > 0) {
              try {
                ctx.fillStyle = ctx.createPattern(item['arguments'][0], "repeat");
              }
              catch(e) {
                Util.log("html2canvas: Renderer: Error creating pattern", e.message);
              }
            }
            break;
          case "drawShape":
            createShape(ctx, item['arguments']);
            break;
          case "drawImage":
            if (item['arguments'][8] > 0 && item['arguments'][7] > 0) {
              if (!options.taintTest || (options.taintTest && safeImage(item))) {
                ctx.drawImage.apply( ctx, item['arguments'] );
              }
            }
            break;
          default:
            ctx[item.name].apply(ctx, item['arguments']);
        }
        break;
    }
  }

  return function(parsedData, options, document, queue, _html2canvas) {
    var ctx = canvas.getContext("2d"),
    newCanvas,
    bounds,
    fstyle,
    zStack = parsedData.stack;

    canvas.width = canvas.style.width =  options.width || zStack.ctx.width;
    canvas.height = canvas.style.height = options.height || zStack.ctx.height;

    fstyle = ctx.fillStyle;
    ctx.fillStyle = (Util.isTransparent(zStack.backgroundColor) && options.background !== undefined) ? options.background : parsedData.backgroundColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = fstyle;

    queue.forEach(function(storageContext) {
      // set common settings for canvas
      ctx.textBaseline = "bottom";
      ctx.save();

      if (storageContext.transform.matrix) {
        ctx.translate(storageContext.transform.origin[0], storageContext.transform.origin[1]);
        ctx.transform.apply(ctx, storageContext.transform.matrix);
        ctx.translate(-storageContext.transform.origin[0], -storageContext.transform.origin[1]);
      }

      if (storageContext.clip){
        ctx.beginPath();
        ctx.rect(storageContext.clip.left, storageContext.clip.top, storageContext.clip.width, storageContext.clip.height);
        ctx.clip();
      }

      if (storageContext.ctx.storage) {
        storageContext.ctx.storage.forEach(function(item) {
          renderItem(ctx, item);
        });
      }

      ctx.restore();
    });

    Util.log("html2canvas: Renderer: Canvas renderer done - returning canvas obj");

    if (options.elements.length === 1) {
      if (typeof options.elements[0] === "object" && options.elements[0].nodeName !== "BODY") {
        // crop image to the bounds of selected (single) element
        bounds = _html2canvas.Util.Bounds(options.elements[0]);
        newCanvas = document.createElement('canvas');
        newCanvas.width = Math.ceil(bounds.width);
        newCanvas.height = Math.ceil(bounds.height);
        ctx = newCanvas.getContext("2d");

        ctx.drawImage(canvas, bounds.left, bounds.top, bounds.width, bounds.height, 0, 0, bounds.width, bounds.height);
        canvas = null;
        return newCanvas;
      }
    }

    return canvas;
  };
};
})(window,document);;(function () {
   "use strict";

   if(!JSZip) {
      throw "JSZip not defined";
   }

   /*jshint -W004, -W030, -W032, -W033, -W034, -W040, -W056, -W061, -W064, -W093 */
   var context = {};
   (function () {

      // https://github.com/imaya/zlib.js
      // tag 0.1.6
      // file bin/deflate.min.js

/** @license zlib.js 2012 - imaya [ https://github.com/imaya/zlib.js ] The MIT License */(function() {'use strict';var l=void 0,p=this;function q(c,d){var a=c.split("."),b=p;!(a[0]in b)&&b.execScript&&b.execScript("var "+a[0]);for(var e;a.length&&(e=a.shift());)!a.length&&d!==l?b[e]=d:b=b[e]?b[e]:b[e]={}};var r="undefined"!==typeof Uint8Array&&"undefined"!==typeof Uint16Array&&"undefined"!==typeof Uint32Array;function u(c){var d=c.length,a=0,b=Number.POSITIVE_INFINITY,e,f,g,h,k,m,s,n,t;for(n=0;n<d;++n)c[n]>a&&(a=c[n]),c[n]<b&&(b=c[n]);e=1<<a;f=new (r?Uint32Array:Array)(e);g=1;h=0;for(k=2;g<=a;){for(n=0;n<d;++n)if(c[n]===g){m=0;s=h;for(t=0;t<g;++t)m=m<<1|s&1,s>>=1;for(t=m;t<e;t+=k)f[t]=g<<16|n;++h}++g;h<<=1;k<<=1}return[f,a,b]};function v(c,d){this.g=[];this.h=32768;this.c=this.f=this.d=this.k=0;this.input=r?new Uint8Array(c):c;this.l=!1;this.i=w;this.p=!1;if(d||!(d={}))d.index&&(this.d=d.index),d.bufferSize&&(this.h=d.bufferSize),d.bufferType&&(this.i=d.bufferType),d.resize&&(this.p=d.resize);switch(this.i){case x:this.a=32768;this.b=new (r?Uint8Array:Array)(32768+this.h+258);break;case w:this.a=0;this.b=new (r?Uint8Array:Array)(this.h);this.e=this.u;this.m=this.r;this.j=this.s;break;default:throw Error("invalid inflate mode");
}}var x=0,w=1;
v.prototype.t=function(){for(;!this.l;){var c=y(this,3);c&1&&(this.l=!0);c>>>=1;switch(c){case 0:var d=this.input,a=this.d,b=this.b,e=this.a,f=l,g=l,h=l,k=b.length,m=l;this.c=this.f=0;f=d[a++];if(f===l)throw Error("invalid uncompressed block header: LEN (first byte)");g=f;f=d[a++];if(f===l)throw Error("invalid uncompressed block header: LEN (second byte)");g|=f<<8;f=d[a++];if(f===l)throw Error("invalid uncompressed block header: NLEN (first byte)");h=f;f=d[a++];if(f===l)throw Error("invalid uncompressed block header: NLEN (second byte)");h|=
f<<8;if(g===~h)throw Error("invalid uncompressed block header: length verify");if(a+g>d.length)throw Error("input buffer is broken");switch(this.i){case x:for(;e+g>b.length;){m=k-e;g-=m;if(r)b.set(d.subarray(a,a+m),e),e+=m,a+=m;else for(;m--;)b[e++]=d[a++];this.a=e;b=this.e();e=this.a}break;case w:for(;e+g>b.length;)b=this.e({o:2});break;default:throw Error("invalid inflate mode");}if(r)b.set(d.subarray(a,a+g),e),e+=g,a+=g;else for(;g--;)b[e++]=d[a++];this.d=a;this.a=e;this.b=b;break;case 1:this.j(z,
A);break;case 2:B(this);break;default:throw Error("unknown BTYPE: "+c);}}return this.m()};
var C=[16,17,18,0,8,7,9,6,10,5,11,4,12,3,13,2,14,1,15],D=r?new Uint16Array(C):C,E=[3,4,5,6,7,8,9,10,11,13,15,17,19,23,27,31,35,43,51,59,67,83,99,115,131,163,195,227,258,258,258],F=r?new Uint16Array(E):E,G=[0,0,0,0,0,0,0,0,1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5,0,0,0],H=r?new Uint8Array(G):G,I=[1,2,3,4,5,7,9,13,17,25,33,49,65,97,129,193,257,385,513,769,1025,1537,2049,3073,4097,6145,8193,12289,16385,24577],J=r?new Uint16Array(I):I,K=[0,0,0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11,12,12,13,
13],L=r?new Uint8Array(K):K,M=new (r?Uint8Array:Array)(288),N,O;N=0;for(O=M.length;N<O;++N)M[N]=143>=N?8:255>=N?9:279>=N?7:8;var z=u(M),P=new (r?Uint8Array:Array)(30),Q,R;Q=0;for(R=P.length;Q<R;++Q)P[Q]=5;var A=u(P);function y(c,d){for(var a=c.f,b=c.c,e=c.input,f=c.d,g;b<d;){g=e[f++];if(g===l)throw Error("input buffer is broken");a|=g<<b;b+=8}g=a&(1<<d)-1;c.f=a>>>d;c.c=b-d;c.d=f;return g}
function S(c,d){for(var a=c.f,b=c.c,e=c.input,f=c.d,g=d[0],h=d[1],k,m,s;b<h;){k=e[f++];if(k===l)break;a|=k<<b;b+=8}m=g[a&(1<<h)-1];s=m>>>16;c.f=a>>s;c.c=b-s;c.d=f;return m&65535}
function B(c){function d(a,c,b){var d,f,e,g;for(g=0;g<a;)switch(d=S(this,c),d){case 16:for(e=3+y(this,2);e--;)b[g++]=f;break;case 17:for(e=3+y(this,3);e--;)b[g++]=0;f=0;break;case 18:for(e=11+y(this,7);e--;)b[g++]=0;f=0;break;default:f=b[g++]=d}return b}var a=y(c,5)+257,b=y(c,5)+1,e=y(c,4)+4,f=new (r?Uint8Array:Array)(D.length),g,h,k,m;for(m=0;m<e;++m)f[D[m]]=y(c,3);g=u(f);h=new (r?Uint8Array:Array)(a);k=new (r?Uint8Array:Array)(b);c.j(u(d.call(c,a,g,h)),u(d.call(c,b,g,k)))}
v.prototype.j=function(c,d){var a=this.b,b=this.a;this.n=c;for(var e=a.length-258,f,g,h,k;256!==(f=S(this,c));)if(256>f)b>=e&&(this.a=b,a=this.e(),b=this.a),a[b++]=f;else{g=f-257;k=F[g];0<H[g]&&(k+=y(this,H[g]));f=S(this,d);h=J[f];0<L[f]&&(h+=y(this,L[f]));b>=e&&(this.a=b,a=this.e(),b=this.a);for(;k--;)a[b]=a[b++-h]}for(;8<=this.c;)this.c-=8,this.d--;this.a=b};
v.prototype.s=function(c,d){var a=this.b,b=this.a;this.n=c;for(var e=a.length,f,g,h,k;256!==(f=S(this,c));)if(256>f)b>=e&&(a=this.e(),e=a.length),a[b++]=f;else{g=f-257;k=F[g];0<H[g]&&(k+=y(this,H[g]));f=S(this,d);h=J[f];0<L[f]&&(h+=y(this,L[f]));b+k>e&&(a=this.e(),e=a.length);for(;k--;)a[b]=a[b++-h]}for(;8<=this.c;)this.c-=8,this.d--;this.a=b};
v.prototype.e=function(){var c=new (r?Uint8Array:Array)(this.a-32768),d=this.a-32768,a,b,e=this.b;if(r)c.set(e.subarray(32768,c.length));else{a=0;for(b=c.length;a<b;++a)c[a]=e[a+32768]}this.g.push(c);this.k+=c.length;if(r)e.set(e.subarray(d,d+32768));else for(a=0;32768>a;++a)e[a]=e[d+a];this.a=32768;return e};
v.prototype.u=function(c){var d,a=this.input.length/this.d+1|0,b,e,f,g=this.input,h=this.b;c&&("number"===typeof c.o&&(a=c.o),"number"===typeof c.q&&(a+=c.q));2>a?(b=(g.length-this.d)/this.n[2],f=258*(b/2)|0,e=f<h.length?h.length+f:h.length<<1):e=h.length*a;r?(d=new Uint8Array(e),d.set(h)):d=h;return this.b=d};
v.prototype.m=function(){var c=0,d=this.b,a=this.g,b,e=new (r?Uint8Array:Array)(this.k+(this.a-32768)),f,g,h,k;if(0===a.length)return r?this.b.subarray(32768,this.a):this.b.slice(32768,this.a);f=0;for(g=a.length;f<g;++f){b=a[f];h=0;for(k=b.length;h<k;++h)e[c++]=b[h]}f=32768;for(g=this.a;f<g;++f)e[c++]=d[f];this.g=[];return this.buffer=e};
v.prototype.r=function(){var c,d=this.a;r?this.p?(c=new Uint8Array(d),c.set(this.b.subarray(0,d))):c=this.b.subarray(0,d):(this.b.length>d&&(this.b.length=d),c=this.b);return this.buffer=c};q("Zlib.RawInflate",v);q("Zlib.RawInflate.prototype.decompress",v.prototype.t);var T={ADAPTIVE:w,BLOCK:x},U,V,W,X;if(Object.keys)U=Object.keys(T);else for(V in U=[],W=0,T)U[W++]=V;W=0;for(X=U.length;W<X;++W)V=U[W],q("Zlib.RawInflate.BufferType."+V,T[V]);}).call(this); //@ sourceMappingURL=rawinflate.min.js.map


   }).call(context);
   /*jshint +W004, +W030, +W032, +W033, +W034, +W040, +W056, +W061, +W064, +W093 */

   var uncompress = function (input) {
      var inflate = new context.Zlib.RawInflate(input);
      return inflate.decompress();
   };

   var USE_TYPEDARRAY =
      (typeof Uint8Array !== 'undefined') &&
      (typeof Uint16Array !== 'undefined') &&
      (typeof Uint32Array !== 'undefined');


   // we add the compression method for JSZip
   if(!JSZip.compressions["DEFLATE"]) {
      JSZip.compressions["DEFLATE"] = {
         magic : "\x08\x00",
         uncompress : uncompress,
         uncompressInputType : USE_TYPEDARRAY ? "uint8array" : "array"
      };
   } else {
      JSZip.compressions["DEFLATE"].uncompress = uncompress;
      JSZip.compressions["DEFLATE"].uncompressInputType = USE_TYPEDARRAY ? "uint8array" : "array";
   }
})();

// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3:
;/**

JSZip - A Javascript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2011 David Duponchel <d.duponchel@gmail.com>
Dual licenced under the MIT license or GPLv3. See LICENSE.markdown.

**/
/*global JSZip */
(function (root) {
  "use strict";

   var JSZip = root.JSZip;

   var MAX_VALUE_16BITS = 65535;
   var MAX_VALUE_32BITS = -1; // well, "\xFF\xFF\xFF\xFF\xFF\xFF\xFF\xFF" is parsed as -1

   /**
    * Prettify a string read as binary.
    * @param {string} str the string to prettify.
    * @return {string} a pretty string.
    */
   var pretty = function (str) {
      var res = '', code, i;
      for (i = 0; i < (str||"").length; i++) {
         code = str.charCodeAt(i);
         res += '\\x' + (code < 16 ? "0" : "") + code.toString(16).toUpperCase();
      }
      return res;
   };

   /**
    * Find a compression registered in JSZip.
    * @param {string} compressionMethod the method magic to find.
    * @return {Object|null} the JSZip compression object, null if none found.
    */
   var findCompression = function (compressionMethod) {
      for (var method in JSZip.compressions) {
         if( !JSZip.compressions.hasOwnProperty(method) ) { continue; }
         if (JSZip.compressions[method].magic === compressionMethod) {
            return JSZip.compressions[method];
         }
      }
      return null;
   };

   // class DataReader {{{
   /**
    * Read bytes from a source.
    * Developer tip : when debugging, a watch on pretty(this.reader.data.slice(this.reader.index))
    * is very useful :)
    * @constructor
    * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to read.
    */
   function DataReader(data) {
      this.data = null; // type : see implementation
      this.length = 0;
      this.index = 0;
   }
   DataReader.prototype = {
      /**
       * Check that the offset will not go too far.
       * @param {string} offset the additional offset to check.
       * @throws {Error} an Error if the offset is out of bounds.
       */
      checkOffset : function (offset) {
         this.checkIndex(this.index + offset);
      },
      /**
       * Check that the specifed index will not be too far.
       * @param {string} newIndex the index to check.
       * @throws {Error} an Error if the index is out of bounds.
       */
      checkIndex : function (newIndex) {
         if (this.length < newIndex || newIndex < 0) {
            throw new Error("End of data reached (data length = " +
                            this.length + ", asked index = " +
                            (newIndex) + "). Corrupted zip ?");
         }
      },
      /**
       * Change the index.
       * @param {number} newIndex The new index.
       * @throws {Error} if the new index is out of the data.
       */
      setIndex : function (newIndex) {
         this.checkIndex(newIndex);
         this.index = newIndex;
      },
      /**
       * Skip the next n bytes.
       * @param {number} n the number of bytes to skip.
       * @throws {Error} if the new index is out of the data.
       */
      skip : function (n) {
         this.setIndex(this.index + n);
      },
      /**
       * Get the byte at the specified index.
       * @param {number} i the index to use.
       * @return {number} a byte.
       */
      byteAt : function(i) {
         // see implementations
      },
      /**
       * Get the next number with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {number} the corresponding number.
       */
      readInt : function (size) {
         var result = 0, i;
         this.checkOffset(size);
         for(i = this.index + size - 1; i >= this.index; i--) {
            result = (result << 8) + this.byteAt(i);
         }
         this.index += size;
         return result;
      },
      /**
       * Get the next string with a given byte size.
       * @param {number} size the number of bytes to read.
       * @return {string} the corresponding string.
       */
      readString : function (size) {
         return JSZip.utils.transformTo("string", this.readData(size));
      },
      /**
       * Get raw data without conversion, <size> bytes.
       * @param {number} size the number of bytes to read.
       * @return {Object} the raw data, implementation specific.
       */
      readData : function (size) {
         // see implementations
      },
      /**
       * Find the last occurence of a zip signature (4 bytes).
       * @param {string} sig the signature to find.
       * @return {number} the index of the last occurence, -1 if not found.
       */
      lastIndexOfSignature : function (sig) {
         // see implementations
      },
      /**
       * Get the next date.
       * @return {Date} the date.
       */
      readDate : function () {
         var dostime = this.readInt(4);
         return new Date(
            ((dostime >> 25) & 0x7f) + 1980, // year
            ((dostime >> 21) & 0x0f) - 1, // month
            (dostime >> 16) & 0x1f, // day
            (dostime >> 11) & 0x1f, // hour
            (dostime >> 5) & 0x3f, // minute
            (dostime & 0x1f) << 1); // second
      }
   };


   /**
    * Read bytes from a string.
    * @constructor
    * @param {String} data the data to read.
    */
   function StringReader(data, optimizedBinaryString) {
      this.data = data;
      if (!optimizedBinaryString) {
         this.data = JSZip.utils.string2binary(this.data);
      }
      this.length = this.data.length;
      this.index = 0;
   }
   StringReader.prototype = new DataReader();
   /**
    * @see DataReader.byteAt
    */
   StringReader.prototype.byteAt = function(i) {
      return this.data.charCodeAt(i);
   };
   /**
    * @see DataReader.lastIndexOfSignature
    */
   StringReader.prototype.lastIndexOfSignature = function (sig) {
      return this.data.lastIndexOf(sig);
   };
   /**
    * @see DataReader.readData
    */
   StringReader.prototype.readData = function (size) {
      this.checkOffset(size);
      // this will work because the constructor applied the "& 0xff" mask.
      var result = this.data.slice(this.index, this.index + size);
      this.index += size;
      return result;
   };


   /**
    * Read bytes from an Uin8Array.
    * @constructor
    * @param {Uint8Array} data the data to read.
    */
   function Uint8ArrayReader(data) {
      if (data) {
         this.data = data;
         this.length = this.data.length;
         this.index = 0;
      }
   }
   Uint8ArrayReader.prototype = new DataReader();
   /**
    * @see DataReader.byteAt
    */
   Uint8ArrayReader.prototype.byteAt = function(i) {
      return this.data[i];
   };
   /**
    * @see DataReader.lastIndexOfSignature
    */
   Uint8ArrayReader.prototype.lastIndexOfSignature = function (sig) {
      var sig0 = sig.charCodeAt(0),
      sig1 = sig.charCodeAt(1),
      sig2 = sig.charCodeAt(2),
      sig3 = sig.charCodeAt(3);
      for(var i = this.length - 4;i >= 0;--i) {
         if (this.data[i] === sig0 && this.data[i+1] === sig1 && this.data[i+2] === sig2 && this.data[i+3] === sig3) {
            return i;
         }
      }

      return -1;
   };
   /**
    * @see DataReader.readData
    */
   Uint8ArrayReader.prototype.readData = function (size) {
      this.checkOffset(size);
      var result = this.data.subarray(this.index, this.index + size);
      this.index += size;
      return result;
   };

   /**
    * Read bytes from a Buffer.
    * @constructor
    * @param {Buffer} data the data to read.
    */
   function NodeBufferReader(data) {
      this.data = data;
      this.length = this.data.length;
      this.index = 0;
   }
   NodeBufferReader.prototype = new Uint8ArrayReader();

   /**
    * @see DataReader.readData
    */
   NodeBufferReader.prototype.readData = function (size) {
      this.checkOffset(size);
      var result = this.data.slice(this.index, this.index + size);
      this.index += size;
      return result;
   };
   // }}} end of DataReader

   // class ZipEntry {{{
   /**
    * An entry in the zip file.
    * @constructor
    * @param {Object} options Options of the current file.
    * @param {Object} loadOptions Options for loading the data.
    */
   function ZipEntry(options, loadOptions) {
      this.options = options;
      this.loadOptions = loadOptions;
   }
   ZipEntry.prototype = {
      /**
       * say if the file is encrypted.
       * @return {boolean} true if the file is encrypted, false otherwise.
       */
      isEncrypted : function () {
         // bit 1 is set
         return (this.bitFlag & 0x0001) === 0x0001;
      },
      /**
       * say if the file has utf-8 filename/comment.
       * @return {boolean} true if the filename/comment is in utf-8, false otherwise.
       */
      useUTF8 : function () {
         // bit 11 is set
         return (this.bitFlag & 0x0800) === 0x0800;
      },
      /**
       * Prepare the function used to generate the compressed content from this ZipFile.
       * @param {DataReader} reader the reader to use.
       * @param {number} from the offset from where we should read the data.
       * @param {number} length the length of the data to read.
       * @return {Function} the callback to get the compressed content (the type depends of the DataReader class).
       */
      prepareCompressedContent : function (reader, from, length) {
         return function () {
            var previousIndex = reader.index;
            reader.setIndex(from);
            var compressedFileData = reader.readData(length);
            reader.setIndex(previousIndex);

            return compressedFileData;
         };
      },
      /**
       * Prepare the function used to generate the uncompressed content from this ZipFile.
       * @param {DataReader} reader the reader to use.
       * @param {number} from the offset from where we should read the data.
       * @param {number} length the length of the data to read.
       * @param {JSZip.compression} compression the compression used on this file.
       * @param {number} uncompressedSize the uncompressed size to expect.
       * @return {Function} the callback to get the uncompressed content (the type depends of the DataReader class).
       */
      prepareContent : function (reader, from, length, compression, uncompressedSize) {
         return function () {

            var compressedFileData = JSZip.utils.transformTo(compression.uncompressInputType, this.getCompressedContent());
            var uncompressedFileData = compression.uncompress(compressedFileData);

            if (uncompressedFileData.length !== uncompressedSize) {
               throw new Error("Bug : uncompressed data size mismatch");
            }

            return uncompressedFileData;
         };
      },
      /**
       * Read the local part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readLocalPart : function(reader) {
         var compression, localExtraFieldsLength;

         // we already know everything from the central dir !
         // If the central dir data are false, we are doomed.
         // On the bright side, the local part is scary  : zip64, data descriptors, both, etc.
         // The less data we get here, the more reliable this should be.
         // Let's skip the whole header and dash to the data !
         reader.skip(22);
         // in some zip created on windows, the filename stored in the central dir contains \ instead of /.
         // Strangely, the filename here is OK.
         // I would love to treat these zip files as corrupted (see http://www.info-zip.org/FAQ.html#backslashes
         // or APPNOTE#4.4.17.1, "All slashes MUST be forward slashes '/'") but there are a lot of bad zip generators...
         // Search "unzip mismatching "local" filename continuing with "central" filename version" on
         // the internet.
         //
         // I think I see the logic here : the central directory is used to display
         // content and the local directory is used to extract the files. Mixing / and \
         // may be used to display \ to windows users and use / when extracting the files.
         // Unfortunately, this lead also to some issues : http://seclists.org/fulldisclosure/2009/Sep/394
         this.fileNameLength = reader.readInt(2);
         localExtraFieldsLength = reader.readInt(2); // can't be sure this will be the same as the central dir
         this.fileName = reader.readString(this.fileNameLength);
         reader.skip(localExtraFieldsLength);

         if (this.compressedSize == -1 || this.uncompressedSize == -1) {
            throw new Error("Bug or corrupted zip : didn't get enough informations from the central directory " +
                            "(compressedSize == -1 || uncompressedSize == -1)");
         }

         compression = findCompression(this.compressionMethod);
         if (compression === null) { // no compression found
            throw new Error("Corrupted zip : compression " + pretty(this.compressionMethod) +
                            " unknown (inner file : " + this.fileName + ")");
         }
         this.decompressed = new JSZip.CompressedObject();
         this.decompressed.compressedSize = this.compressedSize;
         this.decompressed.uncompressedSize = this.uncompressedSize;
         this.decompressed.crc32 = this.crc32;
         this.decompressed.compressionMethod = this.compressionMethod;
         this.decompressed.getCompressedContent = this.prepareCompressedContent(reader, reader.index, this.compressedSize, compression);
         this.decompressed.getContent = this.prepareContent(reader, reader.index, this.compressedSize, compression, this.uncompressedSize);

         // we need to compute the crc32...
         if (this.loadOptions.checkCRC32) {
            this.decompressed = JSZip.utils.transformTo("string", this.decompressed.getContent());
            if (JSZip.prototype.crc32(this.decompressed) !== this.crc32) {
               throw new Error("Corrupted zip : CRC32 mismatch");
            }
         }
      },

      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readCentralPart : function(reader) {
         this.versionMadeBy          = reader.readString(2);
         this.versionNeeded          = reader.readInt(2);
         this.bitFlag                = reader.readInt(2);
         this.compressionMethod      = reader.readString(2);
         this.date                   = reader.readDate();
         this.crc32                  = reader.readInt(4);
         this.compressedSize         = reader.readInt(4);
         this.uncompressedSize       = reader.readInt(4);
         this.fileNameLength         = reader.readInt(2);
         this.extraFieldsLength      = reader.readInt(2);
         this.fileCommentLength      = reader.readInt(2);
         this.diskNumberStart        = reader.readInt(2);
         this.internalFileAttributes = reader.readInt(2);
         this.externalFileAttributes = reader.readInt(4);
         this.localHeaderOffset      = reader.readInt(4);

         if (this.isEncrypted()) {
            throw new Error("Encrypted zip are not supported");
         }

         this.fileName = reader.readString(this.fileNameLength);
         this.readExtraFields(reader);
         this.parseZIP64ExtraField(reader);
         this.fileComment = reader.readString(this.fileCommentLength);

         // warning, this is true only for zip with madeBy == DOS (plateform dependent feature)
         this.dir = this.externalFileAttributes & 0x00000010 ? true : false;
      },
      /**
       * Parse the ZIP64 extra field and merge the info in the current ZipEntry.
       * @param {DataReader} reader the reader to use.
       */
      parseZIP64ExtraField : function(reader) {

         if(!this.extraFields[0x0001]) {
            return;
         }

         // should be something, preparing the extra reader
         var extraReader = new StringReader(this.extraFields[0x0001].value);

         // I really hope that these 64bits integer can fit in 32 bits integer, because js
         // won't let us have more.
         if(this.uncompressedSize === MAX_VALUE_32BITS) {
            this.uncompressedSize = extraReader.readInt(8);
         }
         if(this.compressedSize === MAX_VALUE_32BITS) {
            this.compressedSize = extraReader.readInt(8);
         }
         if(this.localHeaderOffset === MAX_VALUE_32BITS) {
            this.localHeaderOffset = extraReader.readInt(8);
         }
         if(this.diskNumberStart === MAX_VALUE_32BITS) {
            this.diskNumberStart = extraReader.readInt(4);
         }
      },
      /**
       * Read the central part of a zip file and add the info in this object.
       * @param {DataReader} reader the reader to use.
       */
      readExtraFields : function(reader) {
         var start = reader.index,
             extraFieldId,
             extraFieldLength,
             extraFieldValue;

         this.extraFields = this.extraFields || {};

         while (reader.index < start + this.extraFieldsLength) {
            extraFieldId     = reader.readInt(2);
            extraFieldLength = reader.readInt(2);
            extraFieldValue  = reader.readString(extraFieldLength);

            this.extraFields[extraFieldId] = {
               id:     extraFieldId,
               length: extraFieldLength,
               value:  extraFieldValue
            };
         }
      },
      /**
       * Apply an UTF8 transformation if needed.
       */
      handleUTF8 : function() {
         if (this.useUTF8()) {
            this.fileName    = JSZip.prototype.utf8decode(this.fileName);
            this.fileComment = JSZip.prototype.utf8decode(this.fileComment);
         }
      }
   };
   // }}} end of ZipEntry

   //  class ZipEntries {{{
   /**
    * All the entries in the zip file.
    * @constructor
    * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary data to load.
    * @param {Object} loadOptions Options for loading the data.
    */
   function ZipEntries(data, loadOptions) {
      this.files = [];
      this.loadOptions = loadOptions;
      if (data) {
         this.load(data);
      }
   }
   ZipEntries.prototype = {
      /**
       * Check that the reader is on the speficied signature.
       * @param {string} expectedSignature the expected signature.
       * @throws {Error} if it is an other signature.
       */
      checkSignature : function(expectedSignature) {
         var signature = this.reader.readString(4);
         if (signature !== expectedSignature) {
            throw new Error("Corrupted zip or bug : unexpected signature " +
                            "(" + pretty(signature) + ", expected " + pretty(expectedSignature) + ")");
         }
      },
      /**
       * Read the end of the central directory.
       */
      readBlockEndOfCentral : function () {
         this.diskNumber                  = this.reader.readInt(2);
         this.diskWithCentralDirStart     = this.reader.readInt(2);
         this.centralDirRecordsOnThisDisk = this.reader.readInt(2);
         this.centralDirRecords           = this.reader.readInt(2);
         this.centralDirSize              = this.reader.readInt(4);
         this.centralDirOffset            = this.reader.readInt(4);

         this.zipCommentLength            = this.reader.readInt(2);
         this.zipComment                  = this.reader.readString(this.zipCommentLength);
      },
      /**
       * Read the end of the Zip 64 central directory.
       * Not merged with the method readEndOfCentral :
       * The end of central can coexist with its Zip64 brother,
       * I don't want to read the wrong number of bytes !
       */
      readBlockZip64EndOfCentral : function () {
         this.zip64EndOfCentralSize       = this.reader.readInt(8);
         this.versionMadeBy               = this.reader.readString(2);
         this.versionNeeded               = this.reader.readInt(2);
         this.diskNumber                  = this.reader.readInt(4);
         this.diskWithCentralDirStart     = this.reader.readInt(4);
         this.centralDirRecordsOnThisDisk = this.reader.readInt(8);
         this.centralDirRecords           = this.reader.readInt(8);
         this.centralDirSize              = this.reader.readInt(8);
         this.centralDirOffset            = this.reader.readInt(8);

         this.zip64ExtensibleData = {};
         var extraDataSize = this.zip64EndOfCentralSize - 44,
         index = 0,
         extraFieldId,
         extraFieldLength,
         extraFieldValue;
         while(index < extraDataSize) {
            extraFieldId     = this.reader.readInt(2);
            extraFieldLength = this.reader.readInt(4);
            extraFieldValue  = this.reader.readString(extraFieldLength);
            this.zip64ExtensibleData[extraFieldId] = {
               id:     extraFieldId,
               length: extraFieldLength,
               value:  extraFieldValue
            };
         }
      },
      /**
       * Read the end of the Zip 64 central directory locator.
       */
      readBlockZip64EndOfCentralLocator : function () {
         this.diskWithZip64CentralDirStart       = this.reader.readInt(4);
         this.relativeOffsetEndOfZip64CentralDir = this.reader.readInt(8);
         this.disksCount                         = this.reader.readInt(4);
         if (this.disksCount > 1) {
            throw new Error("Multi-volumes zip are not supported");
         }
      },
      /**
       * Read the local files, based on the offset read in the central part.
       */
      readLocalFiles : function() {
         var i, file;
         for(i = 0; i < this.files.length; i++) {
            file = this.files[i];
            this.reader.setIndex(file.localHeaderOffset);
            this.checkSignature(JSZip.signature.LOCAL_FILE_HEADER);
            file.readLocalPart(this.reader);
            file.handleUTF8();
         }
      },
      /**
       * Read the central directory.
       */
      readCentralDir : function() {
         var file;

         this.reader.setIndex(this.centralDirOffset);
         while(this.reader.readString(4) === JSZip.signature.CENTRAL_FILE_HEADER) {
            file = new ZipEntry({
               zip64: this.zip64
            }, this.loadOptions);
            file.readCentralPart(this.reader);
            this.files.push(file);
         }
      },
      /**
       * Read the end of central directory.
       */
      readEndOfCentral : function() {
         var offset = this.reader.lastIndexOfSignature(JSZip.signature.CENTRAL_DIRECTORY_END);
         if (offset === -1) {
            throw new Error("Corrupted zip : can't find end of central directory");
         }
         this.reader.setIndex(offset);
         this.checkSignature(JSZip.signature.CENTRAL_DIRECTORY_END);
         this.readBlockEndOfCentral();


         /* extract from the zip spec :
            4)  If one of the fields in the end of central directory
                record is too small to hold required data, the field
                should be set to -1 (0xFFFF or 0xFFFFFFFF) and the
                ZIP64 format record should be created.
            5)  The end of central directory record and the
                Zip64 end of central directory locator record must
                reside on the same disk when splitting or spanning
                an archive.
         */
         if (this.diskNumber                 === MAX_VALUE_16BITS ||
            this.diskWithCentralDirStart     === MAX_VALUE_16BITS ||
            this.centralDirRecordsOnThisDisk === MAX_VALUE_16BITS ||
            this.centralDirRecords           === MAX_VALUE_16BITS ||
            this.centralDirSize              === MAX_VALUE_32BITS ||
            this.centralDirOffset            === MAX_VALUE_32BITS
         ) {
            this.zip64 = true;

            /*
            Warning : the zip64 extension is supported, but ONLY if the 64bits integer read from
            the zip file can fit into a 32bits integer. This cannot be solved : Javascript represents
            all numbers as 64-bit double precision IEEE 754 floating point numbers.
            So, we have 53bits for integers and bitwise operations treat everything as 32bits.
            see https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Operators/Bitwise_Operators
            and http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-262.pdf section 8.5
            */

            // should look for a zip64 EOCD locator
            offset = this.reader.lastIndexOfSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            if (offset === -1) {
               throw new Error("Corrupted zip : can't find the ZIP64 end of central directory locator");
            }
            this.reader.setIndex(offset);
            this.checkSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_LOCATOR);
            this.readBlockZip64EndOfCentralLocator();

            // now the zip64 EOCD record
            this.reader.setIndex(this.relativeOffsetEndOfZip64CentralDir);
            this.checkSignature(JSZip.signature.ZIP64_CENTRAL_DIRECTORY_END);
            this.readBlockZip64EndOfCentral();
         }
      },
      prepareReader : function (data) {
         var type = JSZip.utils.getTypeOf(data);
         if (type === "string" && !JSZip.support.uint8array) {
            this.reader = new StringReader(data, this.loadOptions.optimizedBinaryString);
         } else if (type === "nodebuffer") {
            this.reader = new NodeBufferReader(data);
         } else {
            this.reader = new Uint8ArrayReader(JSZip.utils.transformTo("uint8array", data));
         }
      },
      /**
       * Read a zip file and create ZipEntries.
       * @param {String|ArrayBuffer|Uint8Array|Buffer} data the binary string representing a zip file.
       */
      load : function(data) {
         this.prepareReader(data);
         this.readEndOfCentral();
         this.readCentralDir();
         this.readLocalFiles();
      }
   };
   // }}} end of ZipEntries

   /**
    * Implementation of the load method of JSZip.
    * It uses the above classes to decode a zip file, and load every files.
    * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data to load.
    * @param {Object} options Options for loading the data.
    *  options.base64 : is the data in base64 ? default : false
    */
   JSZip.prototype.load = function(data, options) {
      var files, zipEntries, i, input;
      options = options || {};
      if(options.base64) {
         data = JSZip.base64.decode(data);
      }

      zipEntries = new ZipEntries(data, options);
      files = zipEntries.files;
      for (i = 0; i < files.length; i++) {
         input = files[i];
         this.file(input.fileName, input.decompressed, {
            binary:true,
            optimizedBinaryString:true,
            date:input.date,
            dir:input.dir
         });
      }

      return this;
   };

}(this));
// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3 foldmethod=marker:
;/**

JSZip - A Javascript class for generating and reading zip files
<http://stuartk.com/jszip>

(c) 2009-2012 Stuart Knightley <stuart [at] stuartk.com>
Dual licenced under the MIT license or GPLv3. See LICENSE.markdown.

Usage:
   zip = new JSZip();
   zip.file("hello.txt", "Hello, World!").file("tempfile", "nothing");
   zip.folder("images").file("smile.gif", base64Data, {base64: true});
   zip.file("Xmas.txt", "Ho ho ho !", {date : new Date("December 25, 2007 00:00:01")});
   zip.remove("tempfile");

   base64zip = zip.generate();

**/
// We use strict, but it should not be placed outside of a function because
// the environment is shared inside the browser.
// "use strict";

/**
 * Representation a of zip file in js
 * @constructor
 * @param {String=|ArrayBuffer=|Uint8Array=|Buffer=} data the data to load, if any (optional).
 * @param {Object=} options the options for creating this objects (optional).
 */
var JSZip = function(data, options) {
   // object containing the files :
   // {
   //   "folder/" : {...},
   //   "folder/data.txt" : {...}
   // }
   this.files = {};

   // Where we are in the hierarchy
   this.root = "";

   if (data) {
      this.load(data, options);
   }
};

JSZip.signature = {
   LOCAL_FILE_HEADER : "\x50\x4b\x03\x04",
   CENTRAL_FILE_HEADER : "\x50\x4b\x01\x02",
   CENTRAL_DIRECTORY_END : "\x50\x4b\x05\x06",
   ZIP64_CENTRAL_DIRECTORY_LOCATOR : "\x50\x4b\x06\x07",
   ZIP64_CENTRAL_DIRECTORY_END : "\x50\x4b\x06\x06",
   DATA_DESCRIPTOR : "\x50\x4b\x07\x08"
};

// Default properties for a new file
JSZip.defaults = {
   base64: false,
   binary: false,
   dir: false,
   date: null,
   compression: null
};

/*
 * List features that require a modern browser, and if the current browser support them.
 */
JSZip.support = {
   // contains true if JSZip can read/generate ArrayBuffer, false otherwise.
   arraybuffer : (function(){
      return typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
   })(),
   // contains true if JSZip can read/generate nodejs Buffer, false otherwise.
   nodebuffer : (function(){
      return typeof Buffer !== "undefined";
   })(),
   // contains true if JSZip can read/generate Uint8Array, false otherwise.
   uint8array : (function(){
      return typeof Uint8Array !== "undefined";
   })(),
   // contains true if JSZip can read/generate Blob, false otherwise.
   blob : (function(){
      // the spec started with BlobBuilder then replaced it with a construtor for Blob.
      // Result : we have browsers that :
      // * know the BlobBuilder (but with prefix)
      // * know the Blob constructor
      // * know about Blob but not about how to build them
      // About the "=== 0" test : if given the wrong type, it may be converted to a string.
      // Instead of an empty content, we will get "[object Uint8Array]" for example.
      if (typeof ArrayBuffer === "undefined") {
         return false;
      }
      var buffer = new ArrayBuffer(0);
      try {
         return new Blob([buffer], { type: "application/zip" }).size === 0;
      }
      catch(e) {}

      try {
         var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
         var builder = new BlobBuilder();
         builder.append(buffer);
         return builder.getBlob('application/zip').size === 0;
      }
      catch(e) {}

      return false;
   })()
};

JSZip.prototype = (function () {
   var textEncoder, textDecoder;
   if (
      JSZip.support.uint8array &&
      typeof TextEncoder === "function" &&
      typeof TextDecoder === "function"
   ) {
      textEncoder = new TextEncoder("utf-8");
      textDecoder = new TextDecoder("utf-8");
   }

   /**
    * Returns the raw data of a ZipObject, decompress the content if necessary.
    * @param {ZipObject} file the file to use.
    * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
    */
   var getRawData = function (file) {
      if (file._data instanceof JSZip.CompressedObject) {
         file._data = file._data.getContent();
         file.options.binary = true;
         file.options.base64 = false;

         if (JSZip.utils.getTypeOf(file._data) === "uint8array") {
            var copy = file._data;
            // when reading an arraybuffer, the CompressedObject mechanism will keep it and subarray() a Uint8Array.
            // if we request a file in the same format, we might get the same Uint8Array or its ArrayBuffer (the original zip file).
            file._data = new Uint8Array(copy.length);
            // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
            if (copy.length !== 0) {
               file._data.set(copy, 0);
            }
         }
      }
      return file._data;
   };

   /**
    * Returns the data of a ZipObject in a binary form. If the content is an unicode string, encode it.
    * @param {ZipObject} file the file to use.
    * @return {String|ArrayBuffer|Uint8Array|Buffer} the data.
    */
   var getBinaryData = function (file) {
      var result = getRawData(file), type = JSZip.utils.getTypeOf(result);
      if (type === "string") {
         if (!file.options.binary) {
            // unicode text !
            // unicode string => binary string is a painful process, check if we can avoid it.
            if (textEncoder) {
               return textEncoder.encode(result);
            }
            if (JSZip.support.nodebuffer) {
               return new Buffer(result, "utf-8");
            }
         }
         return file.asBinary();
      }
      return result;
   };

   /**
    * Transform this._data into a string.
    * @param {function} filter a function String -> String, applied if not null on the result.
    * @return {String} the string representing this._data.
    */
   var dataToString = function (asUTF8) {
      var result = getRawData(this);
      if (result === null || typeof result === "undefined") {
         return "";
      }
      // if the data is a base64 string, we decode it before checking the encoding !
      if (this.options.base64) {
         result = JSZip.base64.decode(result);
      }
      if (asUTF8 && this.options.binary) {
         // JSZip.prototype.utf8decode supports arrays as input
         // skip to array => string step, utf8decode will do it.
         result = JSZip.prototype.utf8decode(result);
      } else {
         // no utf8 transformation, do the array => string step.
         result = JSZip.utils.transformTo("string", result);
      }

      if (!asUTF8 && !this.options.binary) {
         result = JSZip.prototype.utf8encode(result);
      }
      return result;
   };
   /**
    * A simple object representing a file in the zip file.
    * @constructor
    * @param {string} name the name of the file
    * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data
    * @param {Object} options the options of the file
    */
   var ZipObject = function (name, data, options) {
      this.name = name;
      this._data = data;
      this.options = options;
   };

   ZipObject.prototype = {
      /**
       * Return the content as UTF8 string.
       * @return {string} the UTF8 string.
       */
      asText : function () {
         return dataToString.call(this, true);
      },
      /**
       * Returns the binary content.
       * @return {string} the content as binary.
       */
      asBinary : function () {
         return dataToString.call(this, false);
      },
      /**
       * Returns the content as a nodejs Buffer.
       * @return {Buffer} the content as a Buffer.
       */
      asNodeBuffer : function () {
         var result = getBinaryData(this);
         return JSZip.utils.transformTo("nodebuffer", result);
      },
      /**
       * Returns the content as an Uint8Array.
       * @return {Uint8Array} the content as an Uint8Array.
       */
      asUint8Array : function () {
         var result = getBinaryData(this);
         return JSZip.utils.transformTo("uint8array", result);
      },
      /**
       * Returns the content as an ArrayBuffer.
       * @return {ArrayBuffer} the content as an ArrayBufer.
       */
      asArrayBuffer : function () {
         return this.asUint8Array().buffer;
      }
   };

   /**
    * Transform an integer into a string in hexadecimal.
    * @private
    * @param {number} dec the number to convert.
    * @param {number} bytes the number of bytes to generate.
    * @returns {string} the result.
    */
   var decToHex = function(dec, bytes) {
      var hex = "", i;
      for(i = 0; i < bytes; i++) {
         hex += String.fromCharCode(dec&0xff);
         dec=dec>>>8;
      }
      return hex;
   };

   /**
    * Merge the objects passed as parameters into a new one.
    * @private
    * @param {...Object} var_args All objects to merge.
    * @return {Object} a new object with the data of the others.
    */
   var extend = function () {
      var result = {}, i, attr;
      for (i = 0; i < arguments.length; i++) { // arguments is not enumerable in some browsers
         for (attr in arguments[i]) {
            if (arguments[i].hasOwnProperty(attr) && typeof result[attr] === "undefined") {
               result[attr] = arguments[i][attr];
            }
         }
      }
      return result;
   };

   /**
    * Transforms the (incomplete) options from the user into the complete
    * set of options to create a file.
    * @private
    * @param {Object} o the options from the user.
    * @return {Object} the complete set of options.
    */
   var prepareFileAttrs = function (o) {
      o = o || {};
      /*jshint -W041 */
      if (o.base64 === true && o.binary == null) {
         o.binary = true;
      }
      /*jshint +W041 */
      o = extend(o, JSZip.defaults);
      o.date = o.date || new Date();
      if (o.compression !== null) o.compression = o.compression.toUpperCase();

      return o;
   };

   /**
    * Add a file in the current folder.
    * @private
    * @param {string} name the name of the file
    * @param {String|ArrayBuffer|Uint8Array|Buffer} data the data of the file
    * @param {Object} o the options of the file
    * @return {Object} the new file.
    */
   var fileAdd = function (name, data, o) {
      // be sure sub folders exist
      var parent = parentFolder(name), dataType = JSZip.utils.getTypeOf(data);
      if (parent) {
         folderAdd.call(this, parent);
      }

      o = prepareFileAttrs(o);

      if (o.dir || data === null || typeof data === "undefined") {
         o.base64 = false;
         o.binary = false;
         data = null;
      } else if (dataType === "string") {
         if (o.binary && !o.base64) {
            // optimizedBinaryString == true means that the file has already been filtered with a 0xFF mask
            if (o.optimizedBinaryString !== true) {
               // this is a string, not in a base64 format.
               // Be sure that this is a correct "binary string"
               data = JSZip.utils.string2binary(data);
            }
         }
      } else { // arraybuffer, uint8array, ...
         o.base64 = false;
         o.binary = true;

         if (!dataType && !(data instanceof JSZip.CompressedObject)) {
            throw new Error("The data of '" + name + "' is in an unsupported format !");
         }

         // special case : it's way easier to work with Uint8Array than with ArrayBuffer
         if (dataType === "arraybuffer") {
            data = JSZip.utils.transformTo("uint8array", data);
         }
      }

      var object = new ZipObject(name, data, o);
      this.files[name] = object;
      return object;
   };


   /**
    * Find the parent folder of the path.
    * @private
    * @param {string} path the path to use
    * @return {string} the parent folder, or ""
    */
   var parentFolder = function (path) {
      if (path.slice(-1) == '/') {
         path = path.substring(0, path.length - 1);
      }
      var lastSlash = path.lastIndexOf('/');
      return (lastSlash > 0) ? path.substring(0, lastSlash) : "";
   };

   /**
    * Add a (sub) folder in the current folder.
    * @private
    * @param {string} name the folder's name
    * @return {Object} the new folder.
    */
   var folderAdd = function (name) {
      // Check the name ends with a /
      if (name.slice(-1) != "/") {
         name += "/"; // IE doesn't like substr(-1)
      }

      // Does this folder already exist?
      if (!this.files[name]) {
         fileAdd.call(this, name, null, {dir:true});
      }
      return this.files[name];
   };

   /**
    * Generate a JSZip.CompressedObject for a given zipOject.
    * @param {ZipObject} file the object to read.
    * @param {JSZip.compression} compression the compression to use.
    * @return {JSZip.CompressedObject} the compressed result.
    */
   var generateCompressedObjectFrom = function (file, compression) {
      var result = new JSZip.CompressedObject(), content;

      // the data has not been decompressed, we might reuse things !
      if (file._data instanceof JSZip.CompressedObject) {
         result.uncompressedSize = file._data.uncompressedSize;
         result.crc32 = file._data.crc32;

         if (result.uncompressedSize === 0 || file.options.dir) {
            compression = JSZip.compressions['STORE'];
            result.compressedContent = "";
            result.crc32 = 0;
         } else if (file._data.compressionMethod === compression.magic) {
            result.compressedContent = file._data.getCompressedContent();
         } else {
            content = file._data.getContent();
            // need to decompress / recompress
            result.compressedContent = compression.compress(JSZip.utils.transformTo(compression.compressInputType, content));
         }
      } else {
         // have uncompressed data
         content = getBinaryData(file);
         if (!content || content.length === 0 || file.options.dir) {
            compression = JSZip.compressions['STORE'];
            content = "";
         }
         result.uncompressedSize = content.length;
         result.crc32 = this.crc32(content);
         result.compressedContent = compression.compress(JSZip.utils.transformTo(compression.compressInputType, content));
      }

      result.compressedSize = result.compressedContent.length;
      result.compressionMethod = compression.magic;

      return result;
   };

   /**
    * Generate the various parts used in the construction of the final zip file.
    * @param {string} name the file name.
    * @param {ZipObject} file the file content.
    * @param {JSZip.CompressedObject} compressedObject the compressed object.
    * @param {number} offset the current offset from the start of the zip file.
    * @return {object} the zip parts.
    */
   var generateZipParts = function(name, file, compressedObject, offset) {
      var data = compressedObject.compressedContent,
          utfEncodedFileName = this.utf8encode(file.name),
          useUTF8 = utfEncodedFileName !== file.name,
          o       = file.options,
          dosTime,
          dosDate;

      // date
      // @see http://www.delorie.com/djgpp/doc/rbinter/it/52/13.html
      // @see http://www.delorie.com/djgpp/doc/rbinter/it/65/16.html
      // @see http://www.delorie.com/djgpp/doc/rbinter/it/66/16.html

      dosTime = o.date.getHours();
      dosTime = dosTime << 6;
      dosTime = dosTime | o.date.getMinutes();
      dosTime = dosTime << 5;
      dosTime = dosTime | o.date.getSeconds() / 2;

      dosDate = o.date.getFullYear() - 1980;
      dosDate = dosDate << 4;
      dosDate = dosDate | (o.date.getMonth() + 1);
      dosDate = dosDate << 5;
      dosDate = dosDate | o.date.getDate();


      var header = "";

      // version needed to extract
      header += "\x0A\x00";
      // general purpose bit flag
      // set bit 11 if utf8
      header += useUTF8 ? "\x00\x08" : "\x00\x00";
      // compression method
      header += compressedObject.compressionMethod;
      // last mod file time
      header += decToHex(dosTime, 2);
      // last mod file date
      header += decToHex(dosDate, 2);
      // crc-32
      header += decToHex(compressedObject.crc32, 4);
      // compressed size
      header += decToHex(compressedObject.compressedSize, 4);
      // uncompressed size
      header += decToHex(compressedObject.uncompressedSize, 4);
      // file name length
      header += decToHex(utfEncodedFileName.length, 2);
      // extra field length
      header += "\x00\x00";


      var fileRecord = JSZip.signature.LOCAL_FILE_HEADER + header + utfEncodedFileName;

      var dirRecord = JSZip.signature.CENTRAL_FILE_HEADER +
      // version made by (00: DOS)
      "\x14\x00" +
      // file header (common to file and central directory)
      header +
      // file comment length
      "\x00\x00" +
      // disk number start
      "\x00\x00" +
      // internal file attributes TODO
      "\x00\x00" +
      // external file attributes
      (file.options.dir===true?"\x10\x00\x00\x00":"\x00\x00\x00\x00")+
      // relative offset of local header
      decToHex(offset, 4) +
      // file name
      utfEncodedFileName;


      return {
         fileRecord : fileRecord,
         dirRecord : dirRecord,
         compressedObject : compressedObject
      };
   };

   /**
    * An object to write any content to a string.
    * @constructor
    */
   var StringWriter = function () {
      this.data = [];
   };
   StringWriter.prototype = {
      /**
       * Append any content to the current string.
       * @param {Object} input the content to add.
       */
      append : function (input) {
         input = JSZip.utils.transformTo("string", input);
         this.data.push(input);
      },
      /**
       * Finalize the construction an return the result.
       * @return {string} the generated string.
       */
      finalize : function () {
         return this.data.join("");
      }
   };
   /**
    * An object to write any content to an Uint8Array.
    * @constructor
    * @param {number} length The length of the array.
    */
   var Uint8ArrayWriter = function (length) {
      this.data = new Uint8Array(length);
      this.index = 0;
   };
   Uint8ArrayWriter.prototype = {
      /**
       * Append any content to the current array.
       * @param {Object} input the content to add.
       */
      append : function (input) {
         if (input.length !== 0) {
            // with an empty Uint8Array, Opera fails with a "Offset larger than array size"
            input = JSZip.utils.transformTo("uint8array", input);
            this.data.set(input, this.index);
            this.index += input.length;
         }
      },
      /**
       * Finalize the construction an return the result.
       * @return {Uint8Array} the generated array.
       */
      finalize : function () {
         return this.data;
      }
   };

   // return the actual prototype of JSZip
   return {
      /**
       * Read an existing zip and merge the data in the current JSZip object.
       * The implementation is in jszip-load.js, don't forget to include it.
       * @param {String|ArrayBuffer|Uint8Array|Buffer} stream  The stream to load
       * @param {Object} options Options for loading the stream.
       *  options.base64 : is the stream in base64 ? default : false
       * @return {JSZip} the current JSZip object
       */
      load : function (stream, options) {
         throw new Error("Load method is not defined. Is the file jszip-load.js included ?");
      },

      /**
       * Filter nested files/folders with the specified function.
       * @param {Function} search the predicate to use :
       * function (relativePath, file) {...}
       * It takes 2 arguments : the relative path and the file.
       * @return {Array} An array of matching elements.
       */
      filter : function (search) {
         var result = [], filename, relativePath, file, fileClone;
         for (filename in this.files) {
            if ( !this.files.hasOwnProperty(filename) ) { continue; }
            file = this.files[filename];
            // return a new object, don't let the user mess with our internal objects :)
            fileClone = new ZipObject(file.name, file._data, extend(file.options));
            relativePath = filename.slice(this.root.length, filename.length);
            if (filename.slice(0, this.root.length) === this.root && // the file is in the current root
                search(relativePath, fileClone)) { // and the file matches the function
               result.push(fileClone);
            }
         }
         return result;
      },

      /**
       * Add a file to the zip file, or search a file.
       * @param   {string|RegExp} name The name of the file to add (if data is defined),
       * the name of the file to find (if no data) or a regex to match files.
       * @param   {String|ArrayBuffer|Uint8Array|Buffer} data  The file data, either raw or base64 encoded
       * @param   {Object} o     File options
       * @return  {JSZip|Object|Array} this JSZip object (when adding a file),
       * a file (when searching by string) or an array of files (when searching by regex).
       */
      file : function(name, data, o) {
         if (arguments.length === 1) {
            if (JSZip.utils.isRegExp(name)) {
               var regexp = name;
               return this.filter(function(relativePath, file) {
                  return !file.options.dir && regexp.test(relativePath);
               });
            } else { // text
               return this.filter(function (relativePath, file) {
                  return !file.options.dir && relativePath === name;
               })[0]||null;
            }
         } else { // more than one argument : we have data !
            name = this.root+name;
            fileAdd.call(this, name, data, o);
         }
         return this;
      },

      /**
       * Add a directory to the zip file, or search.
       * @param   {String|RegExp} arg The name of the directory to add, or a regex to search folders.
       * @return  {JSZip} an object with the new directory as the root, or an array containing matching folders.
       */
      folder : function(arg) {
         if (!arg) {
            return this;
         }

         if (JSZip.utils.isRegExp(arg)) {
            return this.filter(function(relativePath, file) {
               return file.options.dir && arg.test(relativePath);
            });
         }

         // else, name is a new folder
         var name = this.root + arg;
         var newFolder = folderAdd.call(this, name);

         // Allow chaining by returning a new object with this folder as the root
         var ret = this.clone();
         ret.root = newFolder.name;
         return ret;
      },

      /**
       * Delete a file, or a directory and all sub-files, from the zip
       * @param {string} name the name of the file to delete
       * @return {JSZip} this JSZip object
       */
      remove : function(name) {
         name = this.root + name;
         var file = this.files[name];
         if (!file) {
            // Look for any folders
            if (name.slice(-1) != "/") {
               name += "/";
            }
            file = this.files[name];
         }

         if (file) {
            if (!file.options.dir) {
               // file
               delete this.files[name];
            } else {
               // folder
               var kids = this.filter(function (relativePath, file) {
                  return file.name.slice(0, name.length) === name;
               });
               for (var i = 0; i < kids.length; i++) {
                  delete this.files[kids[i].name];
               }
            }
         }

         return this;
      },

      /**
       * Generate the complete zip file
       * @param {Object} options the options to generate the zip file :
       * - base64, (deprecated, use type instead) true to generate base64.
       * - compression, "STORE" by default.
       * - type, "base64" by default. Values are : string, base64, uint8array, arraybuffer, blob.
       * @return {String|Uint8Array|ArrayBuffer|Buffer|Blob} the zip file
       */
      generate : function(options) {
         options = extend(options || {}, {
            base64 : true,
            compression : "STORE",
            type : "base64"
         });

         JSZip.utils.checkSupport(options.type);

         var zipData = [], localDirLength = 0, centralDirLength = 0, writer, i;


         // first, generate all the zip parts.
         for (var name in this.files) {
            if ( !this.files.hasOwnProperty(name) ) { continue; }
            var file = this.files[name];

            var compressionName = file.options.compression || options.compression.toUpperCase();
            var compression = JSZip.compressions[compressionName];
            if (!compression) {
               throw new Error(compressionName + " is not a valid compression method !");
            }

            var compressedObject = generateCompressedObjectFrom.call(this, file, compression);

            var zipPart = generateZipParts.call(this, name, file, compressedObject, localDirLength);
            localDirLength += zipPart.fileRecord.length + compressedObject.compressedSize;
            centralDirLength += zipPart.dirRecord.length;
            zipData.push(zipPart);
         }

         var dirEnd = "";

         // end of central dir signature
         dirEnd = JSZip.signature.CENTRAL_DIRECTORY_END +
         // number of this disk
         "\x00\x00" +
         // number of the disk with the start of the central directory
         "\x00\x00" +
         // total number of entries in the central directory on this disk
         decToHex(zipData.length, 2) +
         // total number of entries in the central directory
         decToHex(zipData.length, 2) +
         // size of the central directory   4 bytes
         decToHex(centralDirLength, 4) +
         // offset of start of central directory with respect to the starting disk number
         decToHex(localDirLength, 4) +
         // .ZIP file comment length
         "\x00\x00";


         // we have all the parts (and the total length)
         // time to create a writer !
         switch(options.type.toLowerCase()) {
            case "uint8array" :
            case "arraybuffer" :
            case "blob" :
            case "nodebuffer" :
               writer = new Uint8ArrayWriter(localDirLength + centralDirLength + dirEnd.length);
               break;
            // case "base64" :
            // case "string" :
            default :
               writer = new StringWriter(localDirLength + centralDirLength + dirEnd.length);
               break;
         }

         for (i = 0; i < zipData.length; i++) {
            writer.append(zipData[i].fileRecord);
            writer.append(zipData[i].compressedObject.compressedContent);
         }
         for (i = 0; i < zipData.length; i++) {
            writer.append(zipData[i].dirRecord);
         }

         writer.append(dirEnd);

         var zip = writer.finalize();



         switch(options.type.toLowerCase()) {
            // case "zip is an Uint8Array"
            case "uint8array" :
            case "arraybuffer" :
            case "nodebuffer" :
               return JSZip.utils.transformTo(options.type.toLowerCase(), zip);
            case "blob" :
               return JSZip.utils.arrayBuffer2Blob(JSZip.utils.transformTo("arraybuffer", zip));

            // case "zip is a string"
            case "base64" :
               return (options.base64) ? JSZip.base64.encode(zip) : zip;
            default : // case "string" :
               return zip;
         }
      },

      /**
       *
       *  Javascript crc32
       *  http://www.webtoolkit.info/
       *
       */
      crc32 : function crc32(input, crc) {
         if (typeof input === "undefined" || !input.length) {
            return 0;
         }

         var isArray = JSZip.utils.getTypeOf(input) !== "string";

         var table = [
            0x00000000, 0x77073096, 0xEE0E612C, 0x990951BA,
            0x076DC419, 0x706AF48F, 0xE963A535, 0x9E6495A3,
            0x0EDB8832, 0x79DCB8A4, 0xE0D5E91E, 0x97D2D988,
            0x09B64C2B, 0x7EB17CBD, 0xE7B82D07, 0x90BF1D91,
            0x1DB71064, 0x6AB020F2, 0xF3B97148, 0x84BE41DE,
            0x1ADAD47D, 0x6DDDE4EB, 0xF4D4B551, 0x83D385C7,
            0x136C9856, 0x646BA8C0, 0xFD62F97A, 0x8A65C9EC,
            0x14015C4F, 0x63066CD9, 0xFA0F3D63, 0x8D080DF5,
            0x3B6E20C8, 0x4C69105E, 0xD56041E4, 0xA2677172,
            0x3C03E4D1, 0x4B04D447, 0xD20D85FD, 0xA50AB56B,
            0x35B5A8FA, 0x42B2986C, 0xDBBBC9D6, 0xACBCF940,
            0x32D86CE3, 0x45DF5C75, 0xDCD60DCF, 0xABD13D59,
            0x26D930AC, 0x51DE003A, 0xC8D75180, 0xBFD06116,
            0x21B4F4B5, 0x56B3C423, 0xCFBA9599, 0xB8BDA50F,
            0x2802B89E, 0x5F058808, 0xC60CD9B2, 0xB10BE924,
            0x2F6F7C87, 0x58684C11, 0xC1611DAB, 0xB6662D3D,
            0x76DC4190, 0x01DB7106, 0x98D220BC, 0xEFD5102A,
            0x71B18589, 0x06B6B51F, 0x9FBFE4A5, 0xE8B8D433,
            0x7807C9A2, 0x0F00F934, 0x9609A88E, 0xE10E9818,
            0x7F6A0DBB, 0x086D3D2D, 0x91646C97, 0xE6635C01,
            0x6B6B51F4, 0x1C6C6162, 0x856530D8, 0xF262004E,
            0x6C0695ED, 0x1B01A57B, 0x8208F4C1, 0xF50FC457,
            0x65B0D9C6, 0x12B7E950, 0x8BBEB8EA, 0xFCB9887C,
            0x62DD1DDF, 0x15DA2D49, 0x8CD37CF3, 0xFBD44C65,
            0x4DB26158, 0x3AB551CE, 0xA3BC0074, 0xD4BB30E2,
            0x4ADFA541, 0x3DD895D7, 0xA4D1C46D, 0xD3D6F4FB,
            0x4369E96A, 0x346ED9FC, 0xAD678846, 0xDA60B8D0,
            0x44042D73, 0x33031DE5, 0xAA0A4C5F, 0xDD0D7CC9,
            0x5005713C, 0x270241AA, 0xBE0B1010, 0xC90C2086,
            0x5768B525, 0x206F85B3, 0xB966D409, 0xCE61E49F,
            0x5EDEF90E, 0x29D9C998, 0xB0D09822, 0xC7D7A8B4,
            0x59B33D17, 0x2EB40D81, 0xB7BD5C3B, 0xC0BA6CAD,
            0xEDB88320, 0x9ABFB3B6, 0x03B6E20C, 0x74B1D29A,
            0xEAD54739, 0x9DD277AF, 0x04DB2615, 0x73DC1683,
            0xE3630B12, 0x94643B84, 0x0D6D6A3E, 0x7A6A5AA8,
            0xE40ECF0B, 0x9309FF9D, 0x0A00AE27, 0x7D079EB1,
            0xF00F9344, 0x8708A3D2, 0x1E01F268, 0x6906C2FE,
            0xF762575D, 0x806567CB, 0x196C3671, 0x6E6B06E7,
            0xFED41B76, 0x89D32BE0, 0x10DA7A5A, 0x67DD4ACC,
            0xF9B9DF6F, 0x8EBEEFF9, 0x17B7BE43, 0x60B08ED5,
            0xD6D6A3E8, 0xA1D1937E, 0x38D8C2C4, 0x4FDFF252,
            0xD1BB67F1, 0xA6BC5767, 0x3FB506DD, 0x48B2364B,
            0xD80D2BDA, 0xAF0A1B4C, 0x36034AF6, 0x41047A60,
            0xDF60EFC3, 0xA867DF55, 0x316E8EEF, 0x4669BE79,
            0xCB61B38C, 0xBC66831A, 0x256FD2A0, 0x5268E236,
            0xCC0C7795, 0xBB0B4703, 0x220216B9, 0x5505262F,
            0xC5BA3BBE, 0xB2BD0B28, 0x2BB45A92, 0x5CB36A04,
            0xC2D7FFA7, 0xB5D0CF31, 0x2CD99E8B, 0x5BDEAE1D,
            0x9B64C2B0, 0xEC63F226, 0x756AA39C, 0x026D930A,
            0x9C0906A9, 0xEB0E363F, 0x72076785, 0x05005713,
            0x95BF4A82, 0xE2B87A14, 0x7BB12BAE, 0x0CB61B38,
            0x92D28E9B, 0xE5D5BE0D, 0x7CDCEFB7, 0x0BDBDF21,
            0x86D3D2D4, 0xF1D4E242, 0x68DDB3F8, 0x1FDA836E,
            0x81BE16CD, 0xF6B9265B, 0x6FB077E1, 0x18B74777,
            0x88085AE6, 0xFF0F6A70, 0x66063BCA, 0x11010B5C,
            0x8F659EFF, 0xF862AE69, 0x616BFFD3, 0x166CCF45,
            0xA00AE278, 0xD70DD2EE, 0x4E048354, 0x3903B3C2,
            0xA7672661, 0xD06016F7, 0x4969474D, 0x3E6E77DB,
            0xAED16A4A, 0xD9D65ADC, 0x40DF0B66, 0x37D83BF0,
            0xA9BCAE53, 0xDEBB9EC5, 0x47B2CF7F, 0x30B5FFE9,
            0xBDBDF21C, 0xCABAC28A, 0x53B39330, 0x24B4A3A6,
            0xBAD03605, 0xCDD70693, 0x54DE5729, 0x23D967BF,
            0xB3667A2E, 0xC4614AB8, 0x5D681B02, 0x2A6F2B94,
            0xB40BBE37, 0xC30C8EA1, 0x5A05DF1B, 0x2D02EF8D
         ];

         if (typeof(crc) == "undefined") { crc = 0; }
         var x = 0;
         var y = 0;
         var byte = 0;

         crc = crc ^ (-1);
         for( var i = 0, iTop = input.length; i < iTop; i++ ) {
            byte = isArray ? input[i] : input.charCodeAt(i);
            y = ( crc ^ byte ) & 0xFF;
            x = table[y];
            crc = ( crc >>> 8 ) ^ x;
         }

         return crc ^ (-1);
      },

      // Inspired by http://my.opera.com/GreyWyvern/blog/show.dml/1725165
      clone : function() {
         var newObj = new JSZip();
         for (var i in this) {
            if (typeof this[i] !== "function") {
               newObj[i] = this[i];
            }
         }
         return newObj;
      },


      /**
       * http://www.webtoolkit.info/javascript-utf8.html
       */
      utf8encode : function (string) {
         // TextEncoder + Uint8Array to binary string is faster than checking every bytes on long strings.
         // http://jsperf.com/utf8encode-vs-textencoder
         // On short strings (file names for example), the TextEncoder API is (currently) slower.
         if (textEncoder) {
            var u8 = textEncoder.encode(string);
            return JSZip.utils.transformTo("string", u8);
         }
         if (JSZip.support.nodebuffer) {
            return JSZip.utils.transformTo("string", new Buffer(string, "utf-8"));
         }

         // array.join may be slower than string concatenation but generates less objects (less time spent garbage collecting).
         // See also http://jsperf.com/array-direct-assignment-vs-push/31
         var result = [], resIndex = 0;

         for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
               result[resIndex++] = String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
               result[resIndex++] = String.fromCharCode((c >> 6) | 192);
               result[resIndex++] = String.fromCharCode((c & 63) | 128);
            } else {
               result[resIndex++] = String.fromCharCode((c >> 12) | 224);
               result[resIndex++] = String.fromCharCode(((c >> 6) & 63) | 128);
               result[resIndex++] = String.fromCharCode((c & 63) | 128);
            }

         }

         return result.join("");
      },

      /**
       * http://www.webtoolkit.info/javascript-utf8.html
       */
      utf8decode : function (input) {
         var result = [], resIndex = 0;
         var type = JSZip.utils.getTypeOf(input);
         var isArray = type !== "string";
         var i = 0;
         var c = 0, c1 = 0, c2 = 0, c3 = 0;

         // check if we can use the TextDecoder API
         // see http://encoding.spec.whatwg.org/#api
         if (textDecoder) {
            return textDecoder.decode(
               JSZip.utils.transformTo("uint8array", input)
            );
         }
         if (JSZip.support.nodebuffer) {
            return JSZip.utils.transformTo("nodebuffer", input).toString("utf-8");
         }

         while ( i < input.length ) {

            c = isArray ? input[i] : input.charCodeAt(i);

            if (c < 128) {
               result[resIndex++] = String.fromCharCode(c);
               i++;
            } else if ((c > 191) && (c < 224)) {
               c2 = isArray ? input[i+1] : input.charCodeAt(i+1);
               result[resIndex++] = String.fromCharCode(((c & 31) << 6) | (c2 & 63));
               i += 2;
            } else {
               c2 = isArray ? input[i+1] : input.charCodeAt(i+1);
               c3 = isArray ? input[i+2] : input.charCodeAt(i+2);
               result[resIndex++] = String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
               i += 3;
            }

         }

         return result.join("");
      }
   };
}());

/*
 * Compression methods
 * This object is filled in as follow :
 * name : {
 *    magic // the 2 bytes indentifying the compression method
 *    compress // function, take the uncompressed content and return it compressed.
 *    uncompress // function, take the compressed content and return it uncompressed.
 *    compressInputType // string, the type accepted by the compress method. null to accept everything.
 *    uncompressInputType // string, the type accepted by the uncompress method. null to accept everything.
 * }
 *
 * STORE is the default compression method, so it's included in this file.
 * Other methods should go to separated files : the user wants modularity.
 */
JSZip.compressions = {
   "STORE" : {
      magic : "\x00\x00",
      compress : function (content) {
         return content; // no compression
      },
      uncompress : function (content) {
         return content; // no compression
      },
      compressInputType : null,
      uncompressInputType : null
   }
};

(function () {
   JSZip.utils = {
      /**
       * Convert a string to a "binary string" : a string containing only char codes between 0 and 255.
       * @param {string} str the string to transform.
       * @return {String} the binary string.
       */
      string2binary : function (str) {
         var result = "";
         for (var i = 0; i < str.length; i++) {
            result += String.fromCharCode(str.charCodeAt(i) & 0xff);
         }
         return result;
      },
      /**
       * Create a Uint8Array from the string.
       * @param {string} str the string to transform.
       * @return {Uint8Array} the typed array.
       * @throws {Error} an Error if the browser doesn't support the requested feature.
       * @deprecated : use JSZip.utils.transformTo instead.
       */
      string2Uint8Array : function (str) {
         return JSZip.utils.transformTo("uint8array", str);
      },

      /**
       * Create a string from the Uint8Array.
       * @param {Uint8Array} array the array to transform.
       * @return {string} the string.
       * @throws {Error} an Error if the browser doesn't support the requested feature.
       * @deprecated : use JSZip.utils.transformTo instead.
       */
      uint8Array2String : function (array) {
         return JSZip.utils.transformTo("string", array);
      },
      /**
       * Create a blob from the given ArrayBuffer.
       * @param {ArrayBuffer} buffer the buffer to transform.
       * @return {Blob} the result.
       * @throws {Error} an Error if the browser doesn't support the requested feature.
       */
      arrayBuffer2Blob : function (buffer) {
         JSZip.utils.checkSupport("blob");

         try {
            // Blob constructor
            return new Blob([buffer], { type: "application/zip" });
         }
         catch(e) {}

         try {
            // deprecated, browser only, old way
            var BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
            var builder = new BlobBuilder();
            builder.append(buffer);
            return builder.getBlob('application/zip');
         }
         catch(e) {}

         // well, fuck ?!
         throw new Error("Bug : can't construct the Blob.");
      },
      /**
       * Create a blob from the given string.
       * @param {string} str the string to transform.
       * @return {Blob} the result.
       * @throws {Error} an Error if the browser doesn't support the requested feature.
       */
      string2Blob : function (str) {
         var buffer = JSZip.utils.transformTo("arraybuffer", str);
         return JSZip.utils.arrayBuffer2Blob(buffer);
      }
   };

   /**
    * The identity function.
    * @param {Object} input the input.
    * @return {Object} the same input.
    */
   function identity(input) {
      return input;
   }

   /**
    * Fill in an array with a string.
    * @param {String} str the string to use.
    * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to fill in (will be mutated).
    * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated array.
    */
   function stringToArrayLike(str, array) {
      for (var i = 0; i < str.length; ++i) {
         array[i] = str.charCodeAt(i) & 0xFF;
      }
      return array;
   }

   /**
    * Transform an array-like object to a string.
    * @param {Array|ArrayBuffer|Uint8Array|Buffer} array the array to transform.
    * @return {String} the result.
    */
   function arrayLikeToString(array) {
      // Performances notes :
      // --------------------
      // String.fromCharCode.apply(null, array) is the fastest, see
      // see http://jsperf.com/converting-a-uint8array-to-a-string/2
      // but the stack is limited (and we can get huge arrays !).
      //
      // result += String.fromCharCode(array[i]); generate too many strings !
      //
      // This code is inspired by http://jsperf.com/arraybuffer-to-string-apply-performance/2
      var chunk = 65536;
      var result = [], len = array.length, type = JSZip.utils.getTypeOf(array), k = 0;

      var canUseApply = true;
      try {
         switch(type) {
            case "uint8array":
               String.fromCharCode.apply(null, new Uint8Array(0));
               break;
            case "nodebuffer":
               String.fromCharCode.apply(null, new Buffer(0));
               break;
         }
      } catch(e) {
         canUseApply = false;
      }

      // no apply : slow and painful algorithm
      // default browser on android 4.*
      if (!canUseApply) {
         var resultStr = "";
         for(var i = 0; i < array.length;i++) {
            resultStr += String.fromCharCode(array[i]);
         }
         return resultStr;
      }

      while (k < len && chunk > 1) {
         try {
            if (type === "array" || type === "nodebuffer") {
               result.push(String.fromCharCode.apply(null, array.slice(k, Math.min(k + chunk, len))));
            } else {
               result.push(String.fromCharCode.apply(null, array.subarray(k, Math.min(k + chunk, len))));
            }
            k += chunk;
         } catch (e) {
            chunk = Math.floor(chunk / 2);
         }
      }
      return result.join("");
   }

   /**
    * Copy the data from an array-like to an other array-like.
    * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayFrom the origin array.
    * @param {Array|ArrayBuffer|Uint8Array|Buffer} arrayTo the destination array which will be mutated.
    * @return {Array|ArrayBuffer|Uint8Array|Buffer} the updated destination array.
    */
   function arrayLikeToArrayLike(arrayFrom, arrayTo) {
      for(var i = 0; i < arrayFrom.length; i++) {
         arrayTo[i] = arrayFrom[i];
      }
      return arrayTo;
   }

   // a matrix containing functions to transform everything into everything.
   var transform = {};

   // string to ?
   transform["string"] = {
      "string" : identity,
      "array" : function (input) {
         return stringToArrayLike(input, new Array(input.length));
      },
      "arraybuffer" : function (input) {
         return transform["string"]["uint8array"](input).buffer;
      },
      "uint8array" : function (input) {
         return stringToArrayLike(input, new Uint8Array(input.length));
      },
      "nodebuffer" : function (input) {
         return stringToArrayLike(input, new Buffer(input.length));
      }
   };

   // array to ?
   transform["array"] = {
      "string" : arrayLikeToString,
      "array" : identity,
      "arraybuffer" : function (input) {
         return (new Uint8Array(input)).buffer;
      },
      "uint8array" : function (input) {
         return new Uint8Array(input);
      },
      "nodebuffer" : function (input) {
         return new Buffer(input);
      }
   };

   // arraybuffer to ?
   transform["arraybuffer"] = {
      "string" : function (input) {
         return arrayLikeToString(new Uint8Array(input));
      },
      "array" : function (input) {
         return arrayLikeToArrayLike(new Uint8Array(input), new Array(input.byteLength));
      },
      "arraybuffer" : identity,
      "uint8array" : function (input) {
         return new Uint8Array(input);
      },
      "nodebuffer" : function (input) {
         return new Buffer(new Uint8Array(input));
      }
   };

   // uint8array to ?
   transform["uint8array"] = {
      "string" : arrayLikeToString,
      "array" : function (input) {
         return arrayLikeToArrayLike(input, new Array(input.length));
      },
      "arraybuffer" : function (input) {
         return input.buffer;
      },
      "uint8array" : identity,
      "nodebuffer" : function(input) {
         return new Buffer(input);
      }
   };

   // nodebuffer to ?
   transform["nodebuffer"] = {
      "string" : arrayLikeToString,
      "array" : function (input) {
         return arrayLikeToArrayLike(input, new Array(input.length));
      },
      "arraybuffer" : function (input) {
         return transform["nodebuffer"]["uint8array"](input).buffer;
      },
      "uint8array" : function (input) {
         return arrayLikeToArrayLike(input, new Uint8Array(input.length));
      },
      "nodebuffer" : identity
   };

   /**
    * Transform an input into any type.
    * The supported output type are : string, array, uint8array, arraybuffer, nodebuffer.
    * If no output type is specified, the unmodified input will be returned.
    * @param {String} outputType the output type.
    * @param {String|Array|ArrayBuffer|Uint8Array|Buffer} input the input to convert.
    * @throws {Error} an Error if the browser doesn't support the requested output type.
    */
   JSZip.utils.transformTo = function (outputType, input) {
      if (!input) {
         // undefined, null, etc
         // an empty string won't harm.
         input = "";
      }
      if (!outputType) {
         return input;
      }
      JSZip.utils.checkSupport(outputType);
      var inputType = JSZip.utils.getTypeOf(input);
      var result = transform[inputType][outputType](input);
      return result;
   };

   /**
    * Return the type of the input.
    * The type will be in a format valid for JSZip.utils.transformTo : string, array, uint8array, arraybuffer.
    * @param {Object} input the input to identify.
    * @return {String} the (lowercase) type of the input.
    */
   JSZip.utils.getTypeOf = function (input) {
      if (typeof input === "string") {
         return "string";
      }
      if (Object.prototype.toString.call(input) === "[object Array]") {
         return "array";
      }
      if (JSZip.support.nodebuffer && Buffer.isBuffer(input)) {
         return "nodebuffer";
      }
      if (JSZip.support.uint8array && input instanceof Uint8Array) {
         return "uint8array";
      }
      if (JSZip.support.arraybuffer && input instanceof ArrayBuffer) {
         return "arraybuffer";
      }
   };

   /**
    * Cross-window, cross-Node-context regular expression detection
    * @param  {Object}  object Anything
    * @return {Boolean}        true if the object is a regular expression,
    * false otherwise
    */
   JSZip.utils.isRegExp = function (object) {
      return Object.prototype.toString.call(object) === "[object RegExp]";
   };

   /**
    * Throw an exception if the type is not supported.
    * @param {String} type the type to check.
    * @throws {Error} an Error if the browser doesn't support the requested type.
    */
   JSZip.utils.checkSupport = function (type) {
      var supported = true;
      switch (type.toLowerCase()) {
         case "uint8array":
            supported = JSZip.support.uint8array;
         break;
         case "arraybuffer":
            supported = JSZip.support.arraybuffer;
         break;
         case "nodebuffer":
            supported = JSZip.support.nodebuffer;
         break;
         case "blob":
            supported = JSZip.support.blob;
         break;
      }
      if (!supported) {
         throw new Error(type + " is not supported by this browser");
      }
   };


})();

(function (){
   /**
    * Represents an entry in the zip.
    * The content may or may not be compressed.
    * @constructor
    */
   JSZip.CompressedObject = function () {
         this.compressedSize = 0;
         this.uncompressedSize = 0;
         this.crc32 = 0;
         this.compressionMethod = null;
         this.compressedContent = null;
   };

   JSZip.CompressedObject.prototype = {
      /**
       * Return the decompressed content in an unspecified format.
       * The format will depend on the decompressor.
       * @return {Object} the decompressed content.
       */
      getContent : function () {
         return null; // see implementation
      },
      /**
       * Return the compressed content in an unspecified format.
       * The format will depend on the compressed conten source.
       * @return {Object} the compressed content.
       */
      getCompressedContent : function () {
         return null; // see implementation
      }
   };
})();

/**
 *
 *  Base64 encode / decode
 *  http://www.webtoolkit.info/
 *
 *  Hacked so that it doesn't utf8 en/decode everything
 **/
JSZip.base64 = (function() {
   // private property
   var _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";

   return {
      // public method for encoding
      encode : function(input, utf8) {
         var output = "";
         var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
         var i = 0;

         while (i < input.length) {

            chr1 = input.charCodeAt(i++);
            chr2 = input.charCodeAt(i++);
            chr3 = input.charCodeAt(i++);

            enc1 = chr1 >> 2;
            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
            enc4 = chr3 & 63;

            if (isNaN(chr2)) {
               enc3 = enc4 = 64;
            } else if (isNaN(chr3)) {
               enc4 = 64;
            }

            output = output +
               _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
               _keyStr.charAt(enc3) + _keyStr.charAt(enc4);

         }

         return output;
      },

      // public method for decoding
      decode : function(input, utf8) {
         var output = "";
         var chr1, chr2, chr3;
         var enc1, enc2, enc3, enc4;
         var i = 0;

         input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");

         while (i < input.length) {

            enc1 = _keyStr.indexOf(input.charAt(i++));
            enc2 = _keyStr.indexOf(input.charAt(i++));
            enc3 = _keyStr.indexOf(input.charAt(i++));
            enc4 = _keyStr.indexOf(input.charAt(i++));

            chr1 = (enc1 << 2) | (enc2 >> 4);
            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
            chr3 = ((enc3 & 3) << 6) | enc4;

            output = output + String.fromCharCode(chr1);

            if (enc3 != 64) {
               output = output + String.fromCharCode(chr2);
            }
            if (enc4 != 64) {
               output = output + String.fromCharCode(chr3);
            }

         }

         return output;

      }
   };
}());

// enforcing Stuk's coding style
// vim: set shiftwidth=3 softtabstop=3:
;/* canvas-toBlob.js
 * A canvas.toBlob() implementation.
 * 2013-12-27
 * 
 * By Eli Grey, http://eligrey.com and Devin Samarin, https://github.com/eboyjr
 * License: X11/MIT
 *   See LICENSE.md
 */

/*global self */
/*jslint bitwise: true, regexp: true, confusion: true, es5: true, vars: true, white: true,
  plusplus: true */

/*! @source http://purl.eligrey.com/github/canvas-toBlob.js/blob/master/canvas-toBlob.js */

(function(view) {
"use strict";
var
	  Uint8Array = view.Uint8Array
	, HTMLCanvasElement = view.HTMLCanvasElement
	, canvas_proto = HTMLCanvasElement && HTMLCanvasElement.prototype
	, is_base64_regex = /\s*;\s*base64\s*(?:;|$)/i
	, to_data_url = "toDataURL"
	, base64_ranks
	, decode_base64 = function(base64) {
		var
			  len = base64.length
			, buffer = new Uint8Array(len / 4 * 3 | 0)
			, i = 0
			, outptr = 0
			, last = [0, 0]
			, state = 0
			, save = 0
			, rank
			, code
			, undef
		;
		while (len--) {
			code = base64.charCodeAt(i++);
			rank = base64_ranks[code-43];
			if (rank !== 255 && rank !== undef) {
				last[1] = last[0];
				last[0] = code;
				save = (save << 6) | rank;
				state++;
				if (state === 4) {
					buffer[outptr++] = save >>> 16;
					if (last[1] !== 61 /* padding character */) {
						buffer[outptr++] = save >>> 8;
					}
					if (last[0] !== 61 /* padding character */) {
						buffer[outptr++] = save;
					}
					state = 0;
				}
			}
		}
		// 2/3 chance there's going to be some null bytes at the end, but that
		// doesn't really matter with most image formats.
		// If it somehow matters for you, truncate the buffer up outptr.
		return buffer;
	}
;
if (Uint8Array) {
	base64_ranks = new Uint8Array([
		  62, -1, -1, -1, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -1
		, -1, -1,  0, -1, -1, -1,  0,  1,  2,  3,  4,  5,  6,  7,  8,  9
		, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25
		, -1, -1, -1, -1, -1, -1, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35
		, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51
	]);
}
if (HTMLCanvasElement && !canvas_proto.toBlob) {
	canvas_proto.toBlob = function(callback, type /*, ...args*/) {
		  if (!type) {
			type = "image/png";
		} if (this.mozGetAsFile) {
			callback(this.mozGetAsFile("canvas", type));
			return;
		}
		var
			  args = Array.prototype.slice.call(arguments, 1)
			, dataURI = this[to_data_url].apply(this, args)
			, header_end = dataURI.indexOf(",")
			, data = dataURI.substring(header_end + 1)
			, is_base64 = is_base64_regex.test(dataURI.substring(0, header_end))
			, blob
		;
		if (Blob.fake) {
			// no reason to decode a data: URI that's just going to become a data URI again
			blob = new Blob
			if (is_base64) {
				blob.encoding = "base64";
			} else {
				blob.encoding = "URI";
			}
			blob.data = data;
			blob.size = data.length;
		} else if (Uint8Array) {
			if (is_base64) {
				blob = new Blob([decode_base64(data)], {type: type});
			} else {
				blob = new Blob([decodeURIComponent(data)], {type: type});
			}
		}
		callback(blob);
	};

	if (canvas_proto.toDataURLHD) {
		canvas_proto.toBlobHD = function() {
			to_data_url = "toDataURLHD";
			var blob = this.toBlob();
			to_data_url = "toDataURL";
			return blob;
		}
	} else {
		canvas_proto.toBlobHD = canvas_proto.toBlob;
	}
}
}(typeof self !== "undefined" && self || typeof window !== "undefined" && window || this.content || this));
;/**
*
*
* Utility helper
*
*/
( function( $, window, document, undefined ) {

	var UtilityHelper = function( a ) {

        //Array which will hold the sources of the images uploaded as additional
        this.smtImagesArray = [];

        //Array storing the source of the attachment, it is supposed to be just one
        // however we'll keep this as an array in the case we handle more than one attachment
        this.smtAttachmentsArray = [];

        //Array storing the tags of the current post, it is supposed to be as many tags as you need
        // that's why we'll keep this as an array in the case we handle more than one attachment
        this.smtDataTags = [];

        // Array storing last selected featured image
        this.smtFeaturedImage = '';

        // Store the value of the tags
        this.activeCategory = 'cat-graphic';

        // Store the list id for suggestion
        this.suggestList = 0;

        // Array of IDs for the bundle items
        this.premiumBundleItems = [];

        // we'll merge the categories data objects with the default object which holds the values that all the objects
        // share: Featured image, attachment, Additional Images

        /**
        * Hanle global notification close
        */
        this.handleGlobalNotificationClose();

        // Prototype month names
        this.protoMonthsNames();

        // Use jQuery noconflict
        $.noConflict();

        // Mustache templates cache
        this.mustacheCache = {};

	};

	UtilityHelper.prototype = {


            // Initializes some functions

            initialize: function() {

                this.toggleModal();
                this.timeAgo();
            }

    		/**
            * Helps in the process of making a ajax requests
            *
            * @param { object } Options for configuring the ajax request
            * @param { object } data object to be sent
            */
    	,	ajax: function( options, data ) {

                var result
                ,   defaults = {
                        type: 'post'
                    ,   url: window.aUrl
                    ,   data: data
                    ,   async: false
                    ,   success: function( data ) {
                                result = data;
                        }

                    ,   error: function ( XMLHttpRequest, textStatus, errorThrown ) {
                                console.log( "error :" + XMLHttpRequest.responseText );
                        }
                    }

                // Merge defaults and options
                options = $.extend( {}, defaults, options );

                // Do the ajax request
                $.ajax( options );

                // Return the response object
                return result;

            }

            /**
            * Sends an AJAX request to the database
            * in the specified `url` passing it `data` and
            * after that, triggers `event`
            *
            *   sync( 'wordpress_action', 'eventToTrigger', this, { arg1: 'value' } );
            *
            * @param { string } WordPress action name
            * @param { string } Event to trigger
            * @param { instance } instance
            * @return { obj } additional arguments
            */
        ,   sync: function( action, event, context, plusArgs ) {

                event || ( event = '' )
                var data = $.extend( {}, context.attributes, plusArgs, { action: action  } );

                for ( k in data ) {
                    if ( k == 'action' ) continue;
                    data[ k ] = JSON.stringify( data[ k ] );
                }

                options = {
                        async: true
                    ,   url: window.aUrl
                    ,   dataType: 'json'
                    ,   success: function( data ) {

                            if ( typeof context.attributes == 'object' ) {
                                return context.trigger( event, context.attributes, data );
                            }

                            return context.trigger( event, context.attributes, data );
                        }
                };

                return this.ajax( options, data );

            }


            /**
             * Little wrapper on $.post.
             *
             * @return { void }
             */
        ,   post: function( action, data, callback ) {

                var data = $.extend( {}, { action: action }, data );

                this.ajax(
                    {       async: true
                        ,   success: callback
                        ,   dataType: 'json'
                }, data );

            }



            /**
            * Shows a global notification whith a message and a icon of success or failure
            *
            * @param { string text } ( Message to be displayed )
            * @param { string link } ( Link not currently used )
            * @param { string type } ( Success or failure )
            */
        ,   showGlobalNotification: function( text, link, type, callback, timeout ) {

                var gNotification = '.global-notifications'
                ,   message = '.message'
                ,   messageType = '.type'
                ,   icon = '.global-notification-icon'
                ,   timeOut = timeout;


                // Set the message
                $( gNotification ).find( message ).text( text );


                // Clean the icon and global notification
                $( gNotification ).find( icon ).removeClass( 'icon-ok icon-remove icon-spinner' );
                $( gNotification ).removeClass( 'failure loading' );

                // Set icon
                if ( type === 'success' ) {
                   // $( gNotification ).find( icon ).addClass( 'icon-ok' );
                }
                else if ( type === 'failure' ) {
                    // $( gNotification ).find( icon ).addClass( 'icon-remove' );
                    $( gNotification ).addClass( 'failure' );
                }
                else if ( type === 'loading' ) {
                    $( gNotification ).find( icon ).addClass( 'icon-spinner' );
                    $( gNotification ).addClass( 'loading' );
                }

                // Center the global notification to the middle of the screen
                var windowWidth = $( window ).width()
                ,   windowHalf = windowWidth / 2
                ,   notificationHalf = $( gNotification ).width() / 2
                ,   notificationLeft = windowHalf - notificationHalf;

                $( gNotification ).css( 'left', notificationLeft + 'px' );

                $( gNotification ).show();

                // Hide global notifications after 10 secs
                if( timeOut != 0 ) {
                    setTimeout( function() {

                        $( gNotification ).fadeOut( function() {
                            $( gNotification ).find( message ).text( '' )
                        });

                        if ( callback !== null ) {
                            callback.call();
                        }

                    }, timeOut );
                }


            }

            /**
            * Show a global notification.
            *
            * @param { str } Notification text.
            * @param { str } type of notification.
            * @param { int } Duration
            */
        ,   alert: function( text, type, callback, timeout ) {

                ( timeout ) ? timeout : 5000;

                var fn = callback || null;

                if ( typeof type == 'undefined' ) type = 'success';
                return this.showGlobalNotification( text, '', type, fn, timeout );

            }

            /**
             * Close the global notification
             *
             * @param { fn } Callback
             * @return { void }
             */
        ,   closeAlert: function( fn ) {

                var gNotification = '.global-notifications';

                $( gNotification ).hide();
                if ( typeof fn == 'function' )  {
                    fn();
                }

            }


            /**
            * Shows a global notification whith a message and a icon of success or failure
            *
            * @param { string text } ( Message to be displayed )
            * @param { string link } ( Link not currently used )
            * @param { string type } ( Success or failure )
            * text, link, type, callback, timeout, top, left
            */
        ,   showGlobalNotificationUpdated: function( args ) {

                var gNotification = '.global-notifications'
                ,   message = '.message'
                ,   messageType = '.type'
                ,   success = '.icon-ok'
                ,   failure = '.icon-bell'
                ,   loading = '.icon-refresh'
                ,   timeOut = args.timeout || 10000
                ,   top = args.top || ""
                ,   left = args.left || "";

                // Set the message
                $( gNotification ).find( message ).html( args.text )


                // Set icon
                if ( args.type === 'success' )
                     $( gNotification ).find( success ).css( 'display', 'inline-block' )

                else if ( args.type === 'failure' )
                      $( gNotification ).find( failure ).css( 'display', 'inline-block' )

                else if ( args.type === 'loading' )
                      $( gNotification ).find( loading ).css( 'display', 'inline-block' )


                $( gNotification )
                    .addClass( "centered" )
                    .css({ "top": top, "margin-left": left })
                    .show();

                // Hide global notifications after 10 secs
                setTimeout( function() {

                    $( gNotification ).fadeOut( function() {
                        $( gNotification ).find( message ).text( '' );
                        $( gNotification ).find( success + ', ' + failure ).hide();
                        $( gNotification ).css({ "top": "", "margin-left": "" })
                            .removeClass( "centered" );
                    })

                    if ( args.callback != null ) {
                        args.callback.call();
                    }

                }, 10000 )


            }


            // Create the thumbnail for the uploaded images
        ,   createImageThumb: function( imgPath, id ) {

                if ( imgPath == null ) {
                    imgPath = '';
                }

                var thumbsContainer = $( '#bp-smt-img-dragger' )
                ,   bpImageTemplate = "<div class='bp-smt-uploads-image-item item-number-" + id + "'>" +
                                        "<img src='" + imgPath +  "'>" +
                                        "<div class='bp-smt-uploads-image-loader'>" +
                                            "<div class='bp-smt-uploads-image-progress'></div>" +
                                        "</div>" +
                                     "</div>"
                ,   preview = $( bpImageTemplate )

                ,   previewImage = $( 'img', preview )

                // Define image width and height
                previewImage.width = 80
                previewImage.height = 70

                // Append the preview to the dropbox-> bpImagesDragger
                preview.appendTo( thumbsContainer );

                return preview;
            }

            /**
            * Checks whether the response happens to be an error
            * based on the status
            *
            * @param { object } ajax response object
            * @return { bool }
            */
        ,   isAjaxError: function( data ) {

                if ( data.status == 200 ) {
                    return false;
                }
                else {
                    return true;
                }

            }

        ,   refreshPage: function() {

                location.reload( true )
            }

        ,   popover: function( el, elClass ,content, title ) {

                var popoverBox = '<div class="popover top popover-bppl ' + elClass + '"></div>'
                ,   popover = '.popover-bppl'
                ,   arrow = '<div class="arrow"></div>'
                ,   setTitle = '<h3 class="popover-title">' + title + '</h3>'
                ,   setContent = '<div class="popover-content">' + content + '</div>';

                // Popover
                $( el ).append( popoverBox );

                // Popover markup constructor
                $( popover )
                    .html( arrow + setTitle + setContent );

                $( popover ).show();
            }

            /**
            * Converts a cammelcased string to underscore one
            */
        ,   cammelCaseToUnderscore: function( string ) {

                return string.replace( /([A-Z])/g, function( $1 ) {

                    return "_" + $1 . toLowerCase();
                });
            }

            /**
            * Converts a cammelcased string to a spaced one.
            * `sampleStringHere` => `sample string here`
            */
        ,   cammelCaseToSpace: function( string ) {

                return string.replace( /([A-Z])/g, function( $1 ) {
                    return " " + $1 . toLowerCase();
                });
            }

            /**
            * Converts a cammelcased string to dashed one one
            * `sampleString`, `sample-string`
            */
        ,   cammelCaseToHyphen: function( string ) {

                return string.replace( /([A-Z])/g, function( $1 ) {

                    return "-" + $1 . toLowerCase();
                });
            }

            /**
            * Converts a dashed string `sample-string` to a
            * cammelcased one ``
            */
        ,   hyphenToCamelCase: function( string ) {

                return string.replace( /([-][a-z])/g, function( $1 ) {

                    return $1[ 1 ] . toUpperCase();
                });
            }

            /**
            * Converts hiphens to underscores
            */
        ,   hyphenToUnderscore: function( string ) {
                return string.replace( /([-])/g, function( $1 ) {

                    return "_";

                });
            }


            /**
            * Parses the content of a file and adds the nofollow rel to
            * all the links in the content
            */
        ,   parseAddNoFollow: function( string ) {

                return string.replace( /<a[^>]/g, function( $1 ) {

                    return '<a rel="nofollow" ';
                });
            }

            /**
            * Replaces spaces for hyphens
            * @param { string }
            */
        ,   spacesToHyphen: function( string ) {

                return string.replace( / /g, function( $1 ) {

                    return '_';
                });

            }

            /**
            * Replaces hyphes with spaces
            * @param { string }
            */
        ,   hyphenToSpace: function( string ) {

                 return string.replace( /([-])/g, function( $1 ) {

                    return " ";

                });
            }

            /**
            * Validate an string with te correct email format and
            * return false if it doesn't match
            */
        ,   validateEmailFormat: function( string ) {

                return this.isEmail( string );
            }

            /**
            * Check whether an string is a correct email
            * @param { str } String to test
            * @return { bool }
            */
        ,   isEmail: function( string ) {

                var emailExpression = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

                return emailExpression.test( string );
            }

            /**
            * Given an array of required fields, this function
            * checks whether the second argument have them
            */
        ,   validateEmptyFields: function( required, objectData, errors ) {


                $.each( required, function( key, value ) {

                    if ( objectData[ value ] == null || objectData[ value ] == "" ) {

                        errors.push( value );

                    }

                });

                return errors;

            }


            /**
            * Extract an object from form fields
            */
        ,   formToObject: function( formSelector, dropEmpty, convertCases ) {

                var object = {}
                ,   _this = this;

                if( convertCases == null || typeof convertCases == 'undefined' ) {
                    convertCases = true;
                }

                $( formSelector + ' :input' ).each(function() {

                    var idInput = $( this ).attr( 'id' )
                    ,   typeInput = $( this ).attr( 'type' )
                    ,   nameAttr = idInput;

                    // Convert the id to javascript variable format
                    if( convertCases && typeof idInput != 'undefined' ){
                        nameAttr = _this.hyphenToCamelCase( nameAttr );
                    }

                    // Validate the type of the element
                    switch ( typeInput ) {

                        case 'text':
                            object[ nameAttr ] = $( this ).val();
                            break;

                        case 'password':
                            object[ nameAttr ] = $( this ).val();
                            break;

                        case 'checkbox':
                            object[ nameAttr ] = $( this ).is( ':checked' );
                            break;

                        case 'radio':
                            nameAttr = $( this ).attr( 'name' );
                            nameAttr = _this.hyphenToCamelCase( nameAttr );
                            if( $( this ).is( ':checked' ) )
                                object[ nameAttr ] = $( this ).val();
                            break;
                    }

                });

                // get the text areas
                $( formSelector + ' textarea' ).each( function(){

                    var nameAttr = $( this ).data( 'name' );

                    if( convertCases ) {
                       nameAttr = _this.hyphenToCamelCase( nameAttr );
                    }

                    object[ nameAttr ] = $( this ).val();

                });


                // Drop empty attributes
                if( dropEmpty ) {

                    $.each( object, function( key, value ) {

                        if( object[ key ] == '' ) {

                            delete object[ key ];
                        }
                    });
                }


                return object;

            }


            /**
            * Removes the mce-data-href from a string
            */
        ,   removeMceHrefAttr: function( string ) {

                return string.replace( /data-mce-href="([^"]*)/g, function( $1 ) {

                    return '';

                });

            }

            /**
            * Turns an element fixed, receives four parameters and places the element
            * passed fixed at the specified topPosition.
            *
            * <code>
            *
            *       // Turn an element fixed at 390 pixels.
            *       utilities.turnFixed( 118, 100, 390, '.selector' );
            *
            * </code>
            *
            * @param { int } Position in which to leave the element when fixed
            * @param { int } left position in which to leave the element when fixed
            * @param { int } scrollTop size in which the element gets fixes
            * @param { string } element selector
            */
        ,   turnFixed: function( topPos, leftPos, fixedAt, selector ) {

                var scrollTop;

                // Bind to scroll event
                $( window ).scroll( function() {

                    scrollTop = $( window ).scrollTop();

                    if ( scrollTop >= fixedAt ) {
                        $( selector ).css({
                                'position': 'fixed'
                            ,   'top': topPos
                        });
                    }

                    else {
                        $( selector ).css({
                                'position': ''
                            ,   'top': ''
                        });
                    }

                });

            }


            /**
            * Trigger a fn when scrollTop is lower than triggerAt
            * otherwise, trigger fn2.
            *
            * @param { int } Where to trigger the first function
            * @param { fn } Function to execute when scrolltop
            *               is greather or equal than the passed.
            * @param { fn } Function to trigger when scrolltop
            *               is lower than the passed.
            * @return { void }
            */
        ,   scrollTopCallback: function( triggerAt, fn, fn2 ) {

                var scrollTop;

                // Bind to scroll event
                $( window ).scroll( function() {

                    scrollTop = $( window ).scrollTop();
                    if ( scrollTop >= triggerAt ) { fn(); }
                    else { fn2(); }

                });

            }

            /**
            * Maps form inputs generated when using serializeArray();
            * pusshes them to an array in a key( name ) value( value ) structure
            *
            * @param { array } serializeArray() generated array
            * @return { array } mapped array
            *
            */
        ,   mapFormInputs: function( data, type, dropEmpty ) {

                var formData = type || []
                ,   _this = this;

                $.each( data, function( key, val ) {

                    replaced = _this.hyphenToUnderscore( val.name );

                    if ( dropEmpty ) {

                        if ( val.value != "" ) {
                            formData[ replaced ] = val.value;
                        }

                        new Image()
                    }

                    else {
                        formData[ replaced ] = val.value;
                    }

                });

                return formData;

            }

            /**
            * Handle global notification closing
            */
        ,   handleGlobalNotificationClose: function() {

                var wrapper = '.global-notifications'
                ,   message = '.message'
                ,   success = '.icon-ok'
                ,   failure = '.icon-bell'
                ,   closeBtn = '.global-notifications-close';



                $( document ).mouseup( function( e ) {

                    if ( $( wrapper ).has( e.target ).length === 0 ) {
                        $( wrapper ).hide();
                        $( wrapper ).find( message ).text( '' );
                        $( wrapper ).find( success + ', ' + failure ).hide();
                        $( wrapper ).css({ "top": "", "margin-left": "" })
                            .removeClass( "centered" );

                    }

                });

                // CLose Button
                $( closeBtn ).click( function( e ) {

                    $( wrapper ).hide();
                        $( wrapper ).find( message ).text( '' );
                        $( wrapper ).find( success + ', ' + failure ).hide();
                        $( wrapper ).css({ "top": "", "margin-left": "" })
                            .removeClass( "centered" );


                });


            }

            /**
            * Hides an element when it is clicked outiside
            * @param { string } string for the jQuery selector like: ".my-class"
            * @return { null }
            */
        ,   closeOnClickOut: function( selector, callback ) {

                $( document ).mouseup( function( e ) {

                    if ( ! $( selector ).is( ":visible" ) ) {
                        return;
                    }

                    if ( $( selector ).has( e.target ).length === 0 ) {

                        $( selector ).hide();
                        if ( callback != null ) {
                            callback.call();
                        }

                    }

                });

            }

            /**
            * Checks whether the passed element has the passed role
            *
            * @param { }
            * @param { }
            * @return {  }
            */
        ,   isRole: function( element, role ) {

                var elemRole = $( element ).data( "role" );

                if ( elemRole == role ) {
                    return true;
                }

                return false;

            }

            /**
            * Inputs match
            * Refactor!
            */
        ,   inputsMatch: function( main, confirm, feedback ) {

                var _this = this;

                $( main ).on( 'keyup', function( e ) {

                    if ( $( confirm ).val() === $( main ).val() && $( main ).val() != '' ) {
                        $( feedback ).text( 'match' ).removeClass('error').addClass( 'success' );
                        _this.formErrors = false;
                    }

                    else {
                        $( feedback ).text( 'not match' ).removeClass('success').addClass( 'error' );
                        _this.formErrors = true;
                    }

                });

                $( confirm ).on( 'keyup', function( e ) {


                    if ( $( main ).val() != '' ) {

                        if ( $( main ).val() === $( confirm ).val() ) {
                            $( feedback ).text( 'match' ).removeClass('error').addClass( 'success' );
                            _this.formErrors = false;
                        }
                        else {
                            $( feedback ).text( 'not match' ).removeClass('success').addClass( 'error' );
                            _this.formErrors = true;
                        }

                    }

                });


            }

            /**
            * Converts an object to a JSON string
            *
            * @param { object }
            * @return { string }
            */
        ,   jsonStringify: function( object ) {

                var string;

                if ( JSON.stringify )  {
                    string = JSON.stringify( object );
                }

                else if ( JSON.encode ) {
                    string = JSON.encode( object );
                }

                return string;

            }


            /*
            * Sanitizes the editor content so that it can be
            * better compared with the original
            *
            * @param { string } content to sanitize
            * @return { string } sanitized content
            */
        ,   sanitizeForkContent: function( string ) {

                return string.replace( /[&]nbsp[;]/gi, function( $1 ) {

                    return " ";

                });

            }

        ,   isTagAddedYet: function( collection, item ) {

                if ( collection.length > 0 ) {

                    if( $.inArray( item, collection ) != -1 ) {

                        this.showGlobalNotification( 'This tag was added previously','', 'failure', null, 3000 );
                        return true;
                    }
                }

                return false;

            }

            /**
            * Resets form inputs
            */
        // ,   resetForm: function( form ) {

        //         $( form ).find( "input:text, input:password, input:file, select, textarea" ).val( "" );
        //         $( form ).find( "input:radio, input:checkbox" )
        //             .removeAttr( "checked" ).removeAttr( "selected" );

        //             // function resetForm( $form ) {
        //             //     $form.find('input:text, input:password, input:file, select, textarea').val('');
        //             //     $form.find('input:radio, input:checkbox')
        //             //         .removeAttr('checked').removeAttr('selected');
        //             // }
        //     }

                /**
                * Clears the inputs of a form
                * @param { object } Selector object for the form
                */
            ,   clearForm: function( form ) {

                    $( form ).find( 'input[type="text"]' ).each( function() {
                        $( this ).val( '' );
                    });

                    $( form ).find( 'input[type="password"]' ).each( function() {
                        $( this ).val( '' );
                    });

                    $( form ).find( 'textarea' ).each( function() {
                        $( this ).val( '' );
                    });
                }

                /**
                * Gets the form data
                * @param { obj || str } form object or selector
                * @return { obj } mapped form
                */
            ,   getFormData: function( form, dropEmpty ) {

                    var data, off, name
                    ,   _this = this;

                    if ( dropEmpty == null ) {
                        dropEmpty = true;
                    }

                    data = $( form ).serializeArray();
                    data = this.mapFormInputs( data, {}, dropEmpty );

                    $.each( data, function( key, value ) {
                        if ( value == "on" ) {
                            data[ key ] = true;
                        }
                    });

                    // Check for empty values
                    $( form ).find( "input[type=checkbox]" ).each( function() {
                        if ( ! $( this ).is( ":checked" ) ) {

                            name = $( this ).attr( "name" );
                            name = _this.hyphenToUnderscore( name );

                            // Unchecked
                            off = $( this ).data( 'off' );

                            if ( typeof off != 'undefined' ) {
                                data[ name ] = off;

                            } else {
                                data[ name ] = false;
                            }

                        }

                    });

                    return data;

                }


                /**
                * Add useful atributes to the Date class
                */
            ,   protoMonthsNames: function() {

                    // Prototype Date function
                    Date.prototype.getMonthName = function() {
                        return Date.monthsNames[ this.getMonth() ];
                    };

                    Date.prototype.getMonthNameShort = function() {
                        return Date.monthsNamesShort[ this.getMonth() ];
                    }

                    // Add month names
                    Date.monthsNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
                    Date.monthsNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

                }

                /*
                * Cheks whether an string is empty
                *
                * @param { string } string to test
                * @return { bool }
                */
            ,   isEmptyString: function( string ) {

                    // var filter=/^[0-9A-Za-z][A-Za-z0-9_.-]*@[A-Za-z0-9_-]+\.[A-Za-z0-9_.]+[A-za-z]$/;

                }

                /**
                * Adds trim method to the string object
                * if it does not have it
                */
            ,   handleStringTrim: function() {
                    if ( ! ( 'trim' in String.prototype ) ) {
                        String.prototype.trim = function() {
                            return this.replace( /^\s+/, '' ).replace( /\s+$/, '' );
                        };
                    }

                }

                /**
                * Opens a new window in the passed url
                */
            ,   openWindow: function( url, width, height ) {

                    var width = 575
                        height = 400;

                    options = 'status=1'
                            + ',width=' + width
                            + ',height=' + height
                            + ',top='+ ( $( window ).height() - height ) / 2
                            + ',left='+ ( $( window ).width() - width ) /2;

                    window.open( url, 'twitter', options);

                    return false;

                }

                /**
                * Removes an element from an array and
                * Splice it out.
                */
            ,   remove: function( array, item ) {

                    var index = array.indexOf( item );

                    if ( index == -1 ) {
                        return false;
                    }

                    // Delete
                    delete array[ index ];
                    array.splice( index, 1 );

                    return array;
                }

                /**
                * Removes an element from an array if present
                * otherwise, removes it.
                *
                * Remove by ID
                */
            ,   toggle: function( array, item ) {

                    var item = JSON.stringify( item );
                    $.each( array, function( key, val ) {
                        array[ key ] = JSON.stringify( val );
                    });

                    var index = array.indexOf( item );
                    if ( index == -1 ) {
                        array.push( item );
                    }

                    else {
                        array = this.remove( array, item );
                    }

                    // Return affected array
                    $.each( array, function( key, val ) {
                        array[ key ] = JSON.parse( val );
                    });

                    return array;

                }


                /**
                * All treatment for modal window
                */
            ,   toggleModal: function() {

                    var toggle = '.toggle-modal'
                    ,   backdrop = '.modal-backdrop';

                    $( toggle ).click( function( e ) {

                        e.preventDefault();

                        var selector = $( this ).data( 'modal' );

                        $( selector ).toggle();

                        // Reset the event stated in the hidden input `event`
                        // of the forms which is used to trigger such event
                        // when form operation ends.
                        $( selector ).find( 'input[name="event"]' )
                            .each( function() {
                                $( this ).attr( 'value', '' );
                            });

                        $( backdrop ).toggle();

                    });

                    $( backdrop ).click( function( e ) {

                        e.preventDefault();

                        $( this ).hide();
                        $( '.modal' ).hide();
                    });

                    $( document ).keyup( function( e ) {

                        if( e.keyCode == 27 ) {

                            $( '.modal-backdrop' ).hide();
                            $( '.modal' ).hide();
                        }
                    });
                }

            ,   openModal: function( selector ) {

                    $( selector ).toggle();
                    $( '.modal-backdrop' ).toggle();

                }

                /*
                * Calls the passed method with the
                * specified context
                */
            ,   bind: function( fn, context ) {

                    return function() {
                        return fn.apply( context, arguments );
                    }

                }

                /*
                * Prevent the backspace key from navigating back.
                */
            ,   preventBackBrowser: function() {

                    $( document ).keydown( function( e ){
                        if ( e.keyCode == 8 && e.target.tagName != 'INPUT' && e.target.tagName != 'TEXTAREA' ) {
                            e.preventDefault();
                        }
                    });
                }


                /**
                * Get the true hash value. Cannot use location.hash directly due to bug
                * in firefox where location.hash will always be decoded.
                * Adapted from backbone.
                */
            ,   getHash: function() {

                    var match = window.location.href.match( /(.*)$/ );
                    return match ? match[ 1 ] : '';
                }

                // Get normalized URL path without slash at the beginning.
                //
                //      // When URL is: ".com/wordpress/page/1", this method
                //      // will return "wordpress/page/1"
                //      var path = Utilities.getPath();
                //
            ,   getPath: function() {

                    var routeStripper = /^[#\/]|\s+$/g;

                    return History.getState().hash.replace( routeStripper, '' );
                }

                // Update URL path using `pushState`.
                //
                //      // Will set the URL to ".com/wordpress/page/1"
                //      utilities.updatePath( 'wordpress/page/1' );
                //
                //
            ,   updatePath: function( fragment ) {

                    History.pushState( {}, null, '/' + fragment ); // window.location.origin before '/'
                }

                /*
                * Time ago to show the time live
                */
            ,   timeAgo: function() {

                    $( "abbr.time-ago" ).timeago();
                }

                /**
                * Update the hash location by updating the current entry to
                * the browser history.
                * Adapted from backbone `_updateHash`.
                *
                * @param { string } hash to set
                */
            ,   updateHash: function( fragment ) {

                    var location = window.location;
                    var href = location.href.replace( /(javascript:|#).*$/, '' );

                    location.replace( href + '#' + fragment );

                }

                // Set data-src to src on images in a list
            ,   setImageUrl: function( selector ) {

                    $.each( $( selector + ' img' ), function( key, image ) {

                        var dataSrc = $( image ).data( 'src' );

                        $( image ).attr( 'src', dataSrc );

                    });
                }

                /**
                * Pluralize a string.
                *
                * @param { int }
                * @param { string }
                */
            ,   pluralize: function( count, singular, plural ) {

                    if ( plural == null )
                    plural = singular + 's';

                    return ( count == 1 ? singular : plural );
                }


                /**
                * Return a rendered template
                *
                * <code>
                *
                *       // Get template HTML.
                *       var html = utilities.render( 'person', { 'name': 'John' } );
                *
                *       // Use HTML.
                *       $( '.target' ).append( html );
                *
                * </code>
                *
                * @param { str } Template name
                * @param { obj } View object
                * @return { str } Rendered view
                */
            ,   render: function( templateName, data ) {

                    var template = this.mustacheCache[ templateName ]
                    ,   _this = this;

                    if ( ! template ) {

                        $.ajax({
                                url: window.Constants.JSTemplates + templateName + '.mustache'
                            ,   async: false
                            ,   type: 'get'
                            ,   data: null
                            ,   dataType: 'text'
                            ,   success: function( data )  {
                                    template = _this.mustacheCache[ templateName ] = data ;
                                }
                        });

                    }

                    return Mustache.to_html( template, data );
                }

                /**
                 * Get data from tag and return an object
                 * with underscored attribute names
                 *
                 * <code>
                 *
                 *       // Get clicked element data passing
                 *       // "event" as parameter.
                 *       var data = utilities.data( e );
                 *
                 * </code>
                 *
                 * @param { obj } "e" event from click
                 * @return { obj } underscored tag data object
                 */
            ,   data: function( e ) {

                    var target = e.currentTarget
                    ,   _this = this
                    ,   data = $( target ).data()
                    ,   clone = {};

                    $.each( data, function ( k, v ) {
                        clone[ _this.cammelCaseToUnderscore( k ) ] = v;
                    });

                    return clone;
                }

                /**
                 * Shorten a string
                 *
                 * <code>
                 *
                 *     //
                 *
                 * </code>
                 */
            ,   limit: function( string, limit, end ) {

                    if ( typeof end != 'string' ) {
                        end = '...';
                    }

                    if ( typeof string != 'string' )
                        return;

                    if ( string.length <= limit ) {
                        return string;
                    }

                    return string.substring( 0, limit ) + end;

                }

                // Return the passed number of words
            ,   words: function( string, words, end ) {

                    if ( typeof end != 'string' ) {
                        end = '...';
                    }

                    if ( typeof string != 'string' ) {
                        return false;
                    }

                    var parsed = string.split( ' ' ).slice( 0, words ).join( ' ' );

                    if ( parsed.length < string.length )
                        return parsed + end;

                    return parsed;

                }

                // Wrapper on top of console.log, to prevent compatibility
                // issues when on IE
            ,   log: function() {

                    var args = arguments
                    ,   sliced;

                    if ( typeof console === "object" && typeof console.log === "function" ) {

                        sliced = Array.prototype.slice.call( args );

                        // Print using console
                        console.log.apply( console, args );
                    }

                }


                /**
                * API
                */
            ,   API: function() {

                    utilities.get( 'env_category' );

                    // JavaScript API upgrade
                    // ----------------------
                    // Template methods
                    //  - Pluralize

                }


	};

    // Expose utilities to the global scope
    window.Bppl.Helpers.Utilities = new UtilityHelper();

    window.Bppl.Helpers.Utilities.initialize();


})( jQuery, this, this.document );
;jQuery( document ).on( 'ready', ev );

// Called on "ready" event 
function ev( event ) {

	// Main view instance
	var View = Gillie.Handler.extend({

	        initialize: function() {

	        	History.Adapter.bind( window, 'statechange', this.buildBreadcrumb );
	        	this.foundation; // Adding foundation to the project


				i = 0; // Valor dinumeracion div inicial
				sessionStorage.pin = 0;
				drawZone = document.getElementById( 'draw-zone' ); 
				// this.drawZone.onmousedown = drawBox;

				
            	this.contextMenu();
            	this.shortcuts;
            	this.themeActions;
            	// this.sortLayer();

				/**
				 * Shortcuts
				 */
				
				Mousetrap.bind( [ 'ctrl+n' ], this.newTheme );
				Mousetrap.bind( [ 'del' ], this.removeBox );
				Mousetrap.bind( [ 'esc' ], this.closeModal );
				Mousetrap.bind( [ 'ctrl+c' ], this.copyBox );
				Mousetrap.bind( [ 'ctrl+x' ], this.cutBox );
				Mousetrap.bind( [ 'ctrl+v' ], this.pasteBox );
				Mousetrap.bind( [ 'ctrl+alt+c' ], this.setDrawer );
				Mousetrap.bind( [ 'ctrl+1' ], this.zoomPlus );

				/* Long polling */
				// Long Polling (Recommened Technique - Creates An Open Connection To Server ∴ Fast)
				// (function poll(){
				//     $.ajax({ url: "/", success: function(data){
				//         //Update your dashboard gauge
				//         salesGauge.setValue(data.value);
				//     }, dataType: "json", complete: poll, timeout: 30000 });
				// })();
				// 
				// var imgData = "R0lGODdhBQAFAIACAAAAAP/eACwAAAAABQAFAAACCIwPkWerClIBADs=";
				// var zip = new JSZip();
				// zip.file("Hello.txt", "Hello World\n");
				// var img = zip.folder("images");
				// img.file("smile.gif", imgData, {base64: true});
				// var content = zip.generate();
				// location.href="data:application/zip;base64,"+content;
      
	        }

	    ,   events: {
	            	// 'mousedown #draw-zone': 'drawBox'
	            	'click .draw-container': 'newBox'	
	            ,	'click .begin': 'newDraw'	
	            ,	'click .draw-image': 'newImage'	
	            ,	'click .draw-film': 'newVideo'	
	            ,	'click .draw-youtube': 'newExternalVideo'	
	            ,	'click .draw-text': 'newText'	
	            ,	'click .newDraw': 'newDrawModal'	
	            ,	'click .close-reveal-modal': 'closeModal'
	            ,	'change .zoom input': 'zoom'
	            ,	'click .icon-signout': 'setToImg'
	        }

	        /**
	         * [sortLayer sort de layer into the draw]
	         * @return {[type]} [description]
	         */
	    ,	sortLayer: function () {
				// init the tree
			    jQuery( '.tree' ).aciTree({
				        ajax: {
				            url: 'json/checkbox-radio-button.json'
				        }
				    ,   sortable: true
			    });
	    	}

	        /**
			 * [drawBox Divs Creator Function]
			 * @param  { obj } event [Use de click to begin to draw a box container]
			 * @return { avoid }      this function doesn't return 
			 */
	    ,   drawBox: function( event ) {

	    		// Set the colopicker

            	jQuery( '.color-set' ).ColorPicker({ 
            			color: '#0000ff'
            		,	flat: true

            		,	onShow: function ( colpkr ) {
							jQuery( '.color-set' ).fadeIn( 500 );
							return false;
						}
					,	onHide: function ( colpkr ) {
							jQuery( '.color-set' ).fadeOut( 500 );
							return false;
						}
					,	onChange: function ( hsb, hex, rgb ) {
							jQuery( '.selected' ).css( 'backgroundColor', '#' + hex );
						}
        		});

	    		realPosition = jQuery( '#draw-zone' ).offset();
				yc = realPosition.top;
				xc = realPosition.left;

		        if ( event.which == 1 ) {
					if ( sessionStorage.pin == 0 ) { 
						var x = event.pageX - xc;
						var y = event.pageY - yc;
						switch ( sessionStorage.boxType ) {
							case 'img':
								var div = document.createElement( 'img' );
								div.src = 'http://fc05.deviantart.net/fs6/i/2005/100/1/0/Master_Universe_by_ANTIFAN_REAL.jpg';
							break;
							case 'iframe':
								var div = document.createElement( 'div' );
								jQuery( div ).addClass( 'embedded-video' );
							break;
							case 'video':
								var div = document.createElement( 'video' );
							break;
							default:
								var div = document.createElement( 'div' );
							break
						}
						jQuery( div ).addClass( 'box pulsar-zone-' + i );
						jQuery( div ).attr( 'boxname', '.pulsar-zone-' + i );
						jQuery( div ).attr( 'id', 'pulsar-zone-' + i );
						jQuery( div ).attr( 'boxnumber', i );
						i++;
						div.style.position = 'absolute';
						div.style.zIndex = 3;
						div.style.left = x + 'px';
						div.style.top = y + 'px';
						div.style.backgroundColor = 'rgba(0, 125, 230, .85)';
						div.style.overflow = 'hidden';
						drawZone.appendChild( div );
						drawZone.onmousemove = function ( event ) {
							div.style.width = ( event.pageX - xc - x ) + 'px';
							div.style.height = ( event.pageY - yc - y ) + 'px';
						}
						drawZone.onmouseup = function() {
							sessionStorage.pin = 1;
							drawZone.onmousemove = false;
						}
					}else{
						// sessionStorage.pin = 0;
						drawZone.onmousemove = false;
						drawZone.onclick = false;
					}
				}

				/**
				 * Attach the content to the action trigger. Use for context menu
				 */
				
				jQuery( '.box' ).bind( 'mousemove', function () {
					sessionStorage.selector = jQuery( this ).attr( 'boxname' );
				});

				jQuery( '.box' ).bind( 'click', function () {
					// pin = 1;
					jQuery( '.box:not(' + sessionStorage.selector + ')').removeClass('selected');
					jQuery( this ).addClass('selected');

					jQuery.pep.toggleAll( true );
					var el = jQuery( '.selected' );
					el.css({
						cursor: 'move'
					});
					el.pep({
						droppable:   '.box',
					  	// drag: function(ev, obj){
					  	// }
					});

					// view the tool
					jQuery( '.colors .sub-tools' ).show();
				});

				sessionStorage.theme = jQuery( '.draw-zone' ).html();
				
				Mousetrap.bind( [ 'enter' ], function() {
					// pin = 0;
					jQuery( '.box' ).removeClass('selected').css({ cursor: 'default' });
					jQuery.pep.toggleAll( false );
					jQuery( '.colors .sub-tools' ).hide();
				});

				jQuery( '.selected' ).dblclick( function () {
					jQuery( '.box' ).removeClass('selected').css({ cursor: 'default' });
					jQuery.pep.toggleAll( false );
					jQuery( '.colors .sub-tools' ).hide();
				});
	        }

	        /**
	         * Stop to draw boxes
	         */
	    , 	noDrawBox: function() {
	    		console.log( 'noDrawBox' );
	    		drawZone.onclick = false;
	    		drawZone.onmousedown = false;
	    	}

	        /**
	         * New Draw
	         */
	    , 	newDraw: function( e ) {

	    		e.preventDefault();
	    		// Variables
	    		var drawName = jQuery( 'input[name="theme_name"]' ).val()
	    		,	drawWidth = jQuery( 'input[name="theme_width"]' ).val()
	    		,	drawHeight = jQuery( 'input[name="theme_height"]' ).val()
	    		,	drawZone = jQuery( '.draw-zone' )
	    		,	newDrawAlert = '.new-draw-alert'
	    		,	winWidth = jQuery( window ).width()
	    		,	winHeight = jQuery( window ).height();

	    		if( ! drawName || ! drawWidth || ! drawHeight  ) {

	    			jQuery( newDrawAlert )
	    				.removeClass( 'info' )
	    				.addClass( 'warning' )
	    				.html( 'Pls, complete all the fields.' );

	    			jQuery( '.notifications input[required]' ).each( function() {

	    				if( jQuery( this ).val() == '' ) {
	    					jQuery( this ).addClass( 'danger' );
	    				}

	    				else if( jQuery( this ).val() != '' ) {
	    					jQuery( this ).removeClass( 'danger' );
	    				}
	    			});
	    			return;
	    		}
	    		else if( drawName && drawWidth && drawHeight ) {

	    			jQuery( '.notifications input[required]' ).removeClass( 'danger' )

	    		}


	    		if( jQuery( newDrawAlert ).hasClass( 'warning' ) ) {

	    			jQuery( newDrawAlert )
	    				.addClass( 'info' )
	    				.removeClass( 'warning' )
	    				.html( ' Your draw will be centered on your website. ' );

	    		}

	    		this.closeModal();

	    		jQuery( '#loading' ).show();

	    		// Set the draw-zone
	    		setTimeout( function() {
	    			jQuery( '#loading' ).hide();

	    			jQuery( '.main-panel' ).height( winHeight );

		    		drawZone.css({
		    				height: drawHeight
		    			// ,	marginLeft: - ( drawWidth / 2 + 75 )
		    			,	marginLeft: - ( drawWidth / 2 )
		    			,	marginTop: - ( drawHeight / 2 )
		    			,	width: drawWidth
		    			,	zoom: '100%'
		    		}).show();

		    		// if( drawWidth > ( winWidth - 250 ) || drawHeight > ( winHeight - 50 ) ) {
		    		// 	drawZone.css({ 
		    		// 		zoom: '66%'
		    		// 	});
		    		// }

		    		jQuery( '.zoom input' ).val( Math.ceil( drawZone.css( 'zoom' ) * 100 ) );

		    		// Stablish name for draw

		    		sessionStorage.drawname = drawName;

		    		// History.pushState( {}, null, '/draw/' + drawName ); // window.location.origin before '/'

	    		},1500);
	    		
	    	}

	        /**
	         * Set drawer
	         */
	    , 	setDrawer: function() {
	    		jQuery( '.notifications' ).foundation('reveal', 'open');
	    	}

	        /**
	         * New Box
	         */
	    , 	newBox: function() {
				sessionStorage.pin = 0;
				sessionStorage.boxType = 'box';
				drawZone.onmousedown = this.drawBox;
			}

	        /**
	         * New Image
	         */
	    , 	newImage: function() {
				sessionStorage.boxType = 'img';
				drawZone.onclick = this.drawBox;
			}

	        /**
	         * New Video
	         */
	    , 	newVideo: function() {
				sessionStorage.boxType = 'video';
				drawZone.onclick = this.drawBox;
			}

	        /**
	         * New Video from Youtube
	         */
	    , 	newExternalVideo: function() {
				sessionStorage.boxType = 'iframe';
				drawZone.onclick = this.drawBox;
			}

	        /**
	         * New text from font
	         */
	    , 	newText: function() {
				sessionStorage.boxType = 'span';
				drawZone.onclick = this.drawBox;
			}
	
			/**
			 * Use for give border radius to the element
			 */
		,	radius: function ( e ) {
				e.preventDefault();
				this.noDrawBox;
				var el = jQuery( sessionStorage.selector );
				el.css({
					borderRadius : '50%'
				});
			}

			/**
			 * Use for remove an specific element from the drawer-zone
			 */
		,	removeBox: function ( e ) {
				// e.preventDefault();
				this.noDrawBox;
				var el = jQuery( '.selected' );
				el.remove();
			}

			/**
			 * Use for move an specific element from the drawer-zone
			 */
		,	moveBox: function ( e ) {
				e.preventDefault();
				// this.noDrawBox;
				jQuery.pep.toggleAll( true );
				var el = jQuery( '.selected' );
				el.css({
					cursor: 'move'
				});
				el.pep({
					droppable:   '.box',
				  	// drag: function(ev, obj){
				  	// }
				});
			}

			/**
			 * Use for move an specific element from the drawer-zone
			 */
		,	cloneBox: function ( e ) {
				e.preventDefault();
				this.noDrawBox;
				var el = jQuery( '.selected' )
				,	valNumber = parseInt( el.attr( 'boxnumber' ) )
				,	nextVal = parseInt( el.attr( 'boxnumber' ) ) + 1;

				el.clone().attr( { 'boxname': '.pulsar-zone-' + nextVal, 'boxnumber': nextVal } )
					.addClass( 'pulsar-zone-' + nextVal )
					.removeClass( 'pulsar-zone-' + valNumber )
					.appendTo( '.draw-zone' );

				this.moveBox;
			}

		,	contextMenu: function() {
				/**
				 * Context menu
				 */

				context.init({
						fadeSpeed: 50
					,	filter: function ( $obj ){}
					,	above: 'auto'
					,	preventDoubleContext: true
					,	compress: false
				});

				context.attach('.selected', [
						{ header: 'Box Options' }

					,	{
								text: 'Options'
							,	subMenu: [
										{ header: 'Actions'}

									,	{
												text: 'Move'
											,	action: this.moveBox
										}	

									,	{
												text: 'Clone'
											,	action: this.cloneBox
										}

									,	{
												text: 'Remove'
											,	action: this.removeBox
										}	

									,	{
												text: 'Send to back'
											,	action: this.goBack
										}	

									,	{
												text: 'Bring to front'
											,	action: this.goFront
										}	
								]
						}

					,	{
								text: 'Set As'
							,	subMenu: 	[
										{ header: 'Set this box as' }

									,	{
												text: 'Image'
											,	action: this.setToImg
										}

									,	{
												text: 'Slider'
											,	action: this.setToSlide
										}	

									,	{
												text: 'Native Html5 video'
											,	action: this.setToVideo
										}

									,	{
												text: 'embedded-video'
											,	action: this.setToEmbed
										}	

								]
						}	
				]);
			}

			/**
			 * SetToImg
			 * This function prepares the box to been specific type
			 */
		,	setToImg: function () {

				var src = 'http://placehold.it/'
				,	img = '<img src="' + src + jQuery( '.selected' ).width() + 'x' + jQuery( '.selected' ).height() + '" class="img-embed" alt="" />'

				jQuery( '.selected' ).append( img );

				// Create image from draw zone object
				html2canvas(  document.getElementById( "draw-zone" ), {
				    onrendered: function( canvas ) {
				    	canvas.getContext("2d");
				    	// draw to canvas...
						canvas.toBlob( function ( blob ) {
						    // saveAs( blob, sessionStorage.drawname + ".png" );
						});
				    }
				}); // Don't delete
			}

			/**
			 * SetToSlide
			 * This function prepares the box to been specific type
			 */
		,	setToSlide: function ( e ) {

				e.preventDefault();

				var src = 'http://placehold.it/'
				,	id = jQuery( '.selected' ).attr( 'id' )
				,	img = '<img src="' + src + jQuery( '.selected' ).width() + 'x' + jQuery( '.selected' ).height() + '" class="img-embed" alt="" />'
				,	iview = jQuery( '<div id="iview-' + id + '"/>' )
				,	sld1 = jQuery( '<div data-iview:thumbnail="apps/pulsar/public/img/fnd1.jpg" data-iview:image="apps/pulsar/public/img/fnd1.jpg"/>' )
				,	caption1 = '<div class="iview-caption" data-x="0" data-y="0" data-width="400" data-height="300" data-transition="wipeRight" data-speed="700"> Content </div>'
				,	sld2 = jQuery( '<div data-iview:thumbnail="apps/pulsar/public/img/fnd2.jpg" data-iview:image="apps/pulsar/public/img/fnd2.jpg"/>' )
				,	caption2 = '<div class="iview-caption" data-x="70" data-y="70" data-transition="expandLeft">Caption Description</div>';

				// Set the slider size
				iview.width( jQuery( '.selected' ).width() );
				iview.height( jQuery( '.selected' ).height() );

				// Set the slider slides
				sld1.append( caption1 );
				sld2.append( caption2 );

				// Append to iview
				iview.append( sld1 ).append( sld2 );

				// Append to selected div
				jQuery( '.selected' ).append( iview );

				jQuery( '#' + id ).find( '#iview-' + id ).iView();	

				// var blob = new Blob( [ sessionStorage.theme ], { type: "text/html;charset=utf-8" } );

				// Set the savers
				// saveAs( blob, "index.html" );
			}

			/**
			 * SetToVideo
			 * This function prepares the box to been specific type
			 */
		,	setToVideo: function () {
				console.log( 'se hizoc' );
			}

			/**
			 * SetToEmbed
			 * This function prepares the box to been specific type
			 */
		,	setToEmbed: function () {
				console.log( 'se hizod' );
			}

			/**
			 * [copyBox Copy the selected element to the clipboard]
			 */
		,	copyBox: function () {

				var box = sessionStorage.selector;

				if ( jQuery( box ).hasClass( 'disabled' ) ) 
					jQuery( box ).removeClass( 'disabled' );

				sessionStorage.clipboard = box;
			}

			/**
			 * [copyBox Cut the selected element and put in to the clipboard]
			 */
		,	cutBox: function() {

				var box = sessionStorage.selector;

				jQuery( box ).addClass( 'disabled' );

				sessionStorage.clipboard = box;
			}

			/**
			 * Attach the content of clipboard to the selected box
			 */
		,	pasteBox: function() {

				var pasteVal = sessionStorage.clipboard
				,	pasteIn = sessionStorage.selector;

				jQuery( pasteVal ).appendTo( pasteIn );

				jQuery( pasteVal ).css( {
						left: 0
					,	top: 0
				} );

				if ( jQuery( pasteVal ).hasClass( 'disabled' ) ) 
					jQuery( pasteVal ).removeClass( 'disabled' );

			}

			/**
			 * New Draw Modal
			 */
		,	newDrawModal: function() {

				jQuery( '.notifications' ).foundation('reveal', 'open');

			}

			/**
			 * Close modals
			 */
		,	closeModal: function() {

				jQuery( '.pulsar-modal' ).foundation( 'reveal', 'close' );

			}

			/**
			 * Actions menu
			 */

		,	goFront: function () {
				jQuery( '.selected' ).css({
					zIndex: parseInt( jQuery( '.selected' ).css( 'z-index' ) ) + 1
				});
			}

		,	goBack: function () {
				jQuery( '.selected' ).css({
					zIndex: parseInt( jQuery( '.selected' ).css( 'z-index' ) ) - 1
				});
			}

			/**
			 * zoom plus
			 */
		,	zoomPlus: function() {
				jQuery( '.zoom input' ).val( 100 );
				jQuery( '.draw-zone' ).css({
			    		zoom: 100 + '%'
			    });
			}

		, 	zoom: function( e ) {
				e.preventDefault();
				jQuery( '.zoom input' ).on( 'change', function () {
				    jQuery( '.draw-zone' ).css({
				    		zoom: jQuery( this ).val() + '%'
				    });
				});
			}

			/**
			 * Realtime
			 */
			
		,	sendMessage: function () {
			  	counter++;

			  	// Creates a xRTML message
			 	var xrtmlMessage = xRTML.MessageManager.create({
			 	    trigger: 'newMessage',
			 	    action: 'insert',
			 	    data: {
			 	        count: counter
			 	    }
			 	});

			  	// Sends the message
				xRTML.ConnectionManager.sendMessage({
				  	connections: ['myConn'],
				  	channel: 'my_channel',
				  	content: xrtmlMessage
				});
			}

	});

	// Create instance
	var myView = new View();

}
;/* Modernizr 2.6.2 (Custom Build) | MIT & BSD
 * Build: http://modernizr.com/download/#-inlinesvg-svg-svgclippaths-touch-shiv-mq-cssclasses-teststyles-prefixes-ie8compat-load
 */
;window.Modernizr=function(a,b,c){function y(a){j.cssText=a}function z(a,b){return y(m.join(a+";")+(b||""))}function A(a,b){return typeof a===b}function B(a,b){return!!~(""+a).indexOf(b)}function C(a,b,d){for(var e in a){var f=b[a[e]];if(f!==c)return d===!1?a[e]:A(f,"function")?f.bind(d||b):f}return!1}var d="2.6.2",e={},f=!0,g=b.documentElement,h="modernizr",i=b.createElement(h),j=i.style,k,l={}.toString,m=" -webkit- -moz- -o- -ms- ".split(" "),n={svg:"http://www.w3.org/2000/svg"},o={},p={},q={},r=[],s=r.slice,t,u=function(a,c,d,e){var f,i,j,k,l=b.createElement("div"),m=b.body,n=m||b.createElement("body");if(parseInt(d,10))while(d--)j=b.createElement("div"),j.id=e?e[d]:h+(d+1),l.appendChild(j);return f=["&#173;",'<style id="s',h,'">',a,"</style>"].join(""),l.id=h,(m?l:n).innerHTML+=f,n.appendChild(l),m||(n.style.background="",n.style.overflow="hidden",k=g.style.overflow,g.style.overflow="hidden",g.appendChild(n)),i=c(l,a),m?l.parentNode.removeChild(l):(n.parentNode.removeChild(n),g.style.overflow=k),!!i},v=function(b){var c=a.matchMedia||a.msMatchMedia;if(c)return c(b).matches;var d;return u("@media "+b+" { #"+h+" { position: absolute; } }",function(b){d=(a.getComputedStyle?getComputedStyle(b,null):b.currentStyle)["position"]=="absolute"}),d},w={}.hasOwnProperty,x;!A(w,"undefined")&&!A(w.call,"undefined")?x=function(a,b){return w.call(a,b)}:x=function(a,b){return b in a&&A(a.constructor.prototype[b],"undefined")},Function.prototype.bind||(Function.prototype.bind=function(b){var c=this;if(typeof c!="function")throw new TypeError;var d=s.call(arguments,1),e=function(){if(this instanceof e){var a=function(){};a.prototype=c.prototype;var f=new a,g=c.apply(f,d.concat(s.call(arguments)));return Object(g)===g?g:f}return c.apply(b,d.concat(s.call(arguments)))};return e}),o.touch=function(){var c;return"ontouchstart"in a||a.DocumentTouch&&b instanceof DocumentTouch?c=!0:u(["@media (",m.join("touch-enabled),("),h,")","{#modernizr{top:9px;position:absolute}}"].join(""),function(a){c=a.offsetTop===9}),c},o.svg=function(){return!!b.createElementNS&&!!b.createElementNS(n.svg,"svg").createSVGRect},o.inlinesvg=function(){var a=b.createElement("div");return a.innerHTML="<svg/>",(a.firstChild&&a.firstChild.namespaceURI)==n.svg},o.svgclippaths=function(){return!!b.createElementNS&&/SVGClipPath/.test(l.call(b.createElementNS(n.svg,"clipPath")))};for(var D in o)x(o,D)&&(t=D.toLowerCase(),e[t]=o[D](),r.push((e[t]?"":"no-")+t));return e.addTest=function(a,b){if(typeof a=="object")for(var d in a)x(a,d)&&e.addTest(d,a[d]);else{a=a.toLowerCase();if(e[a]!==c)return e;b=typeof b=="function"?b():b,typeof f!="undefined"&&f&&(g.className+=" "+(b?"":"no-")+a),e[a]=b}return e},y(""),i=k=null,function(a,b){function k(a,b){var c=a.createElement("p"),d=a.getElementsByTagName("head")[0]||a.documentElement;return c.innerHTML="x<style>"+b+"</style>",d.insertBefore(c.lastChild,d.firstChild)}function l(){var a=r.elements;return typeof a=="string"?a.split(" "):a}function m(a){var b=i[a[g]];return b||(b={},h++,a[g]=h,i[h]=b),b}function n(a,c,f){c||(c=b);if(j)return c.createElement(a);f||(f=m(c));var g;return f.cache[a]?g=f.cache[a].cloneNode():e.test(a)?g=(f.cache[a]=f.createElem(a)).cloneNode():g=f.createElem(a),g.canHaveChildren&&!d.test(a)?f.frag.appendChild(g):g}function o(a,c){a||(a=b);if(j)return a.createDocumentFragment();c=c||m(a);var d=c.frag.cloneNode(),e=0,f=l(),g=f.length;for(;e<g;e++)d.createElement(f[e]);return d}function p(a,b){b.cache||(b.cache={},b.createElem=a.createElement,b.createFrag=a.createDocumentFragment,b.frag=b.createFrag()),a.createElement=function(c){return r.shivMethods?n(c,a,b):b.createElem(c)},a.createDocumentFragment=Function("h,f","return function(){var n=f.cloneNode(),c=n.createElement;h.shivMethods&&("+l().join().replace(/\w+/g,function(a){return b.createElem(a),b.frag.createElement(a),'c("'+a+'")'})+");return n}")(r,b.frag)}function q(a){a||(a=b);var c=m(a);return r.shivCSS&&!f&&!c.hasCSS&&(c.hasCSS=!!k(a,"article,aside,figcaption,figure,footer,header,hgroup,nav,section{display:block}mark{background:#FF0;color:#000}")),j||p(a,c),a}var c=a.html5||{},d=/^<|^(?:button|map|select|textarea|object|iframe|option|optgroup)$/i,e=/^(?:a|b|code|div|fieldset|h1|h2|h3|h4|h5|h6|i|label|li|ol|p|q|span|strong|style|table|tbody|td|th|tr|ul)$/i,f,g="_html5shiv",h=0,i={},j;(function(){try{var a=b.createElement("a");a.innerHTML="<xyz></xyz>",f="hidden"in a,j=a.childNodes.length==1||function(){b.createElement("a");var a=b.createDocumentFragment();return typeof a.cloneNode=="undefined"||typeof a.createDocumentFragment=="undefined"||typeof a.createElement=="undefined"}()}catch(c){f=!0,j=!0}})();var r={elements:c.elements||"abbr article aside audio bdi canvas data datalist details figcaption figure footer header hgroup mark meter nav output progress section summary time video",shivCSS:c.shivCSS!==!1,supportsUnknownElements:j,shivMethods:c.shivMethods!==!1,type:"default",shivDocument:q,createElement:n,createDocumentFragment:o};a.html5=r,q(b)}(this,b),e._version=d,e._prefixes=m,e.mq=v,e.testStyles=u,g.className=g.className.replace(/(^|\s)no-js(\s|$)/,"$1$2")+(f?" js "+r.join(" "):""),e}(this,this.document),function(a,b,c){function d(a){return"[object Function]"==o.call(a)}function e(a){return"string"==typeof a}function f(){}function g(a){return!a||"loaded"==a||"complete"==a||"uninitialized"==a}function h(){var a=p.shift();q=1,a?a.t?m(function(){("c"==a.t?B.injectCss:B.injectJs)(a.s,0,a.a,a.x,a.e,1)},0):(a(),h()):q=0}function i(a,c,d,e,f,i,j){function k(b){if(!o&&g(l.readyState)&&(u.r=o=1,!q&&h(),l.onload=l.onreadystatechange=null,b)){"img"!=a&&m(function(){t.removeChild(l)},50);for(var d in y[c])y[c].hasOwnProperty(d)&&y[c][d].onload()}}var j=j||B.errorTimeout,l=b.createElement(a),o=0,r=0,u={t:d,s:c,e:f,a:i,x:j};1===y[c]&&(r=1,y[c]=[]),"object"==a?l.data=c:(l.src=c,l.type=a),l.width=l.height="0",l.onerror=l.onload=l.onreadystatechange=function(){k.call(this,r)},p.splice(e,0,u),"img"!=a&&(r||2===y[c]?(t.insertBefore(l,s?null:n),m(k,j)):y[c].push(l))}function j(a,b,c,d,f){return q=0,b=b||"j",e(a)?i("c"==b?v:u,a,b,this.i++,c,d,f):(p.splice(this.i++,0,a),1==p.length&&h()),this}function k(){var a=B;return a.loader={load:j,i:0},a}var l=b.documentElement,m=a.setTimeout,n=b.getElementsByTagName("script")[0],o={}.toString,p=[],q=0,r="MozAppearance"in l.style,s=r&&!!b.createRange().compareNode,t=s?l:n.parentNode,l=a.opera&&"[object Opera]"==o.call(a.opera),l=!!b.attachEvent&&!l,u=r?"object":l?"script":"img",v=l?"script":u,w=Array.isArray||function(a){return"[object Array]"==o.call(a)},x=[],y={},z={timeout:function(a,b){return b.length&&(a.timeout=b[0]),a}},A,B;B=function(a){function b(a){var a=a.split("!"),b=x.length,c=a.pop(),d=a.length,c={url:c,origUrl:c,prefixes:a},e,f,g;for(f=0;f<d;f++)g=a[f].split("="),(e=z[g.shift()])&&(c=e(c,g));for(f=0;f<b;f++)c=x[f](c);return c}function g(a,e,f,g,h){var i=b(a),j=i.autoCallback;i.url.split(".").pop().split("?").shift(),i.bypass||(e&&(e=d(e)?e:e[a]||e[g]||e[a.split("/").pop().split("?")[0]]),i.instead?i.instead(a,e,f,g,h):(y[i.url]?i.noexec=!0:y[i.url]=1,f.load(i.url,i.forceCSS||!i.forceJS&&"css"==i.url.split(".").pop().split("?").shift()?"c":c,i.noexec,i.attrs,i.timeout),(d(e)||d(j))&&f.load(function(){k(),e&&e(i.origUrl,h,g),j&&j(i.origUrl,h,g),y[i.url]=2})))}function h(a,b){function c(a,c){if(a){if(e(a))c||(j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}),g(a,j,b,0,h);else if(Object(a)===a)for(n in m=function(){var b=0,c;for(c in a)a.hasOwnProperty(c)&&b++;return b}(),a)a.hasOwnProperty(n)&&(!c&&!--m&&(d(j)?j=function(){var a=[].slice.call(arguments);k.apply(this,a),l()}:j[n]=function(a){return function(){var b=[].slice.call(arguments);a&&a.apply(this,b),l()}}(k[n])),g(a[n],j,b,n,h))}else!c&&l()}var h=!!a.test,i=a.load||a.both,j=a.callback||f,k=j,l=a.complete||f,m,n;c(h?a.yep:a.nope,!!i),i&&c(i)}var i,j,l=this.yepnope.loader;if(e(a))g(a,0,l,0);else if(w(a))for(i=0;i<a.length;i++)j=a[i],e(j)?g(j,0,l,0):w(j)?B(j):Object(j)===j&&h(j,l);else Object(a)===a&&h(a,l)},B.addPrefix=function(a,b){z[a]=b},B.addFilter=function(a){x.push(a)},B.errorTimeout=1e4,null==b.readyState&&b.addEventListener&&(b.readyState="loading",b.addEventListener("DOMContentLoaded",A=function(){b.removeEventListener("DOMContentLoaded",A,0),b.readyState="complete"},0)),a.yepnope=k(),a.yepnope.executeStack=h,a.yepnope.injectJs=function(a,c,d,e,i,j){var k=b.createElement("script"),l,o,e=e||B.errorTimeout;k.src=a;for(o in d)k.setAttribute(o,d[o]);c=j?h:c||f,k.onreadystatechange=k.onload=function(){!l&&g(k.readyState)&&(l=1,c(),k.onload=k.onreadystatechange=null)},m(function(){l||(l=1,c(1))},e),i?k.onload():n.parentNode.insertBefore(k,n)},a.yepnope.injectCss=function(a,c,d,e,g,i){var e=b.createElement("link"),j,c=i?h:c||f;e.href=a,e.rel="stylesheet",e.type="text/css";for(j in d)e.setAttribute(j,d[j]);g||(n.parentNode.insertBefore(e,n),m(c,0))}}(this,document),Modernizr.load=function(){yepnope.apply(window,[].slice.call(arguments,0))},Modernizr.addTest("ie8compat",function(){return!window.addEventListener&&document.documentMode&&document.documentMode===7});
;/*global define:false */
/**
 * Copyright 2013 Craig Campbell
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Mousetrap is a simple keyboard shortcut library for Javascript with
 * no external dependencies
 *
 * @version 1.4.6
 * @url craig.is/killing/mice
 */
(function(window, document, undefined) {

    /**
     * mapping of special keycodes to their corresponding keys
     *
     * everything in this dictionary cannot use keypress events
     * so it has to be here to map to the correct keycodes for
     * keyup/keydown events
     *
     * @type {Object}
     */
    var _MAP = {
            8: 'backspace',
            9: 'tab',
            13: 'enter',
            16: 'shift',
            17: 'ctrl',
            18: 'alt',
            20: 'capslock',
            27: 'esc',
            32: 'space',
            33: 'pageup',
            34: 'pagedown',
            35: 'end',
            36: 'home',
            37: 'left',
            38: 'up',
            39: 'right',
            40: 'down',
            45: 'ins',
            46: 'del',
            91: 'meta',
            93: 'meta',
            224: 'meta'
        },

        /**
         * mapping for special characters so they can support
         *
         * this dictionary is only used incase you want to bind a
         * keyup or keydown event to one of these keys
         *
         * @type {Object}
         */
        _KEYCODE_MAP = {
            106: '*',
            107: '+',
            109: '-',
            110: '.',
            111 : '/',
            186: ';',
            187: '=',
            188: ',',
            189: '-',
            190: '.',
            191: '/',
            192: '`',
            219: '[',
            220: '\\',
            221: ']',
            222: '\''
        },

        /**
         * this is a mapping of keys that require shift on a US keypad
         * back to the non shift equivelents
         *
         * this is so you can use keyup events with these keys
         *
         * note that this will only work reliably on US keyboards
         *
         * @type {Object}
         */
        _SHIFT_MAP = {
            '~': '`',
            '!': '1',
            '@': '2',
            '#': '3',
            '$': '4',
            '%': '5',
            '^': '6',
            '&': '7',
            '*': '8',
            '(': '9',
            ')': '0',
            '_': '-',
            '+': '=',
            ':': ';',
            '\"': '\'',
            '<': ',',
            '>': '.',
            '?': '/',
            '|': '\\'
        },

        /**
         * this is a list of special strings you can use to map
         * to modifier keys when you specify your keyboard shortcuts
         *
         * @type {Object}
         */
        _SPECIAL_ALIASES = {
            'option': 'alt',
            'command': 'meta',
            'return': 'enter',
            'escape': 'esc',
            'mod': /Mac|iPod|iPhone|iPad/.test(navigator.platform) ? 'meta' : 'ctrl'
        },

        /**
         * variable to store the flipped version of _MAP from above
         * needed to check if we should use keypress or not when no action
         * is specified
         *
         * @type {Object|undefined}
         */
        _REVERSE_MAP,

        /**
         * a list of all the callbacks setup via Mousetrap.bind()
         *
         * @type {Object}
         */
        _callbacks = {},

        /**
         * direct map of string combinations to callbacks used for trigger()
         *
         * @type {Object}
         */
        _directMap = {},

        /**
         * keeps track of what level each sequence is at since multiple
         * sequences can start out with the same sequence
         *
         * @type {Object}
         */
        _sequenceLevels = {},

        /**
         * variable to store the setTimeout call
         *
         * @type {null|number}
         */
        _resetTimer,

        /**
         * temporary state where we will ignore the next keyup
         *
         * @type {boolean|string}
         */
        _ignoreNextKeyup = false,

        /**
         * temporary state where we will ignore the next keypress
         *
         * @type {boolean}
         */
        _ignoreNextKeypress = false,

        /**
         * are we currently inside of a sequence?
         * type of action ("keyup" or "keydown" or "keypress") or false
         *
         * @type {boolean|string}
         */
        _nextExpectedAction = false;

    /**
     * loop through the f keys, f1 to f19 and add them to the map
     * programatically
     */
    for (var i = 1; i < 20; ++i) {
        _MAP[111 + i] = 'f' + i;
    }

    /**
     * loop through to map numbers on the numeric keypad
     */
    for (i = 0; i <= 9; ++i) {
        _MAP[i + 96] = i;
    }

    /**
     * cross browser add event method
     *
     * @param {Element|HTMLDocument} object
     * @param {string} type
     * @param {Function} callback
     * @returns void
     */
    function _addEvent(object, type, callback) {
        if (object.addEventListener) {
            object.addEventListener(type, callback, false);
            return;
        }

        object.attachEvent('on' + type, callback);
    }

    /**
     * takes the event and returns the key character
     *
     * @param {Event} e
     * @return {string}
     */
    function _characterFromEvent(e) {

        // for keypress events we should return the character as is
        if (e.type == 'keypress') {
            var character = String.fromCharCode(e.which);

            // if the shift key is not pressed then it is safe to assume
            // that we want the character to be lowercase.  this means if
            // you accidentally have caps lock on then your key bindings
            // will continue to work
            //
            // the only side effect that might not be desired is if you
            // bind something like 'A' cause you want to trigger an
            // event when capital A is pressed caps lock will no longer
            // trigger the event.  shift+a will though.
            if (!e.shiftKey) {
                character = character.toLowerCase();
            }

            return character;
        }

        // for non keypress events the special maps are needed
        if (_MAP[e.which]) {
            return _MAP[e.which];
        }

        if (_KEYCODE_MAP[e.which]) {
            return _KEYCODE_MAP[e.which];
        }

        // if it is not in the special map

        // with keydown and keyup events the character seems to always
        // come in as an uppercase character whether you are pressing shift
        // or not.  we should make sure it is always lowercase for comparisons
        return String.fromCharCode(e.which).toLowerCase();
    }

    /**
     * checks if two arrays are equal
     *
     * @param {Array} modifiers1
     * @param {Array} modifiers2
     * @returns {boolean}
     */
    function _modifiersMatch(modifiers1, modifiers2) {
        return modifiers1.sort().join(',') === modifiers2.sort().join(',');
    }

    /**
     * resets all sequence counters except for the ones passed in
     *
     * @param {Object} doNotReset
     * @returns void
     */
    function _resetSequences(doNotReset) {
        doNotReset = doNotReset || {};

        var activeSequences = false,
            key;

        for (key in _sequenceLevels) {
            if (doNotReset[key]) {
                activeSequences = true;
                continue;
            }
            _sequenceLevels[key] = 0;
        }

        if (!activeSequences) {
            _nextExpectedAction = false;
        }
    }

    /**
     * finds all callbacks that match based on the keycode, modifiers,
     * and action
     *
     * @param {string} character
     * @param {Array} modifiers
     * @param {Event|Object} e
     * @param {string=} sequenceName - name of the sequence we are looking for
     * @param {string=} combination
     * @param {number=} level
     * @returns {Array}
     */
    function _getMatches(character, modifiers, e, sequenceName, combination, level) {
        var i,
            callback,
            matches = [],
            action = e.type;

        // if there are no events related to this keycode
        if (!_callbacks[character]) {
            return [];
        }

        // if a modifier key is coming up on its own we should allow it
        if (action == 'keyup' && _isModifier(character)) {
            modifiers = [character];
        }

        // loop through all callbacks for the key that was pressed
        // and see if any of them match
        for (i = 0; i < _callbacks[character].length; ++i) {
            callback = _callbacks[character][i];

            // if a sequence name is not specified, but this is a sequence at
            // the wrong level then move onto the next match
            if (!sequenceName && callback.seq && _sequenceLevels[callback.seq] != callback.level) {
                continue;
            }

            // if the action we are looking for doesn't match the action we got
            // then we should keep going
            if (action != callback.action) {
                continue;
            }

            // if this is a keypress event and the meta key and control key
            // are not pressed that means that we need to only look at the
            // character, otherwise check the modifiers as well
            //
            // chrome will not fire a keypress if meta or control is down
            // safari will fire a keypress if meta or meta+shift is down
            // firefox will fire a keypress if meta or control is down
            if ((action == 'keypress' && !e.metaKey && !e.ctrlKey) || _modifiersMatch(modifiers, callback.modifiers)) {

                // when you bind a combination or sequence a second time it
                // should overwrite the first one.  if a sequenceName or
                // combination is specified in this call it does just that
                //
                // @todo make deleting its own method?
                var deleteCombo = !sequenceName && callback.combo == combination;
                var deleteSequence = sequenceName && callback.seq == sequenceName && callback.level == level;
                if (deleteCombo || deleteSequence) {
                    _callbacks[character].splice(i, 1);
                }

                matches.push(callback);
            }
        }

        return matches;
    }

    /**
     * takes a key event and figures out what the modifiers are
     *
     * @param {Event} e
     * @returns {Array}
     */
    function _eventModifiers(e) {
        var modifiers = [];

        if (e.shiftKey) {
            modifiers.push('shift');
        }

        if (e.altKey) {
            modifiers.push('alt');
        }

        if (e.ctrlKey) {
            modifiers.push('ctrl');
        }

        if (e.metaKey) {
            modifiers.push('meta');
        }

        return modifiers;
    }

    /**
     * prevents default for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _preventDefault(e) {
        if (e.preventDefault) {
            e.preventDefault();
            return;
        }

        e.returnValue = false;
    }

    /**
     * stops propogation for this event
     *
     * @param {Event} e
     * @returns void
     */
    function _stopPropagation(e) {
        if (e.stopPropagation) {
            e.stopPropagation();
            return;
        }

        e.cancelBubble = true;
    }

    /**
     * actually calls the callback function
     *
     * if your callback function returns false this will use the jquery
     * convention - prevent default and stop propogation on the event
     *
     * @param {Function} callback
     * @param {Event} e
     * @returns void
     */
    function _fireCallback(callback, e, combo, sequence) {

        // if this event should not happen stop here
        if (Mousetrap.stopCallback(e, e.target || e.srcElement, combo, sequence)) {
            return;
        }

        if (callback(e, combo) === false) {
            _preventDefault(e);
            _stopPropagation(e);
        }
    }

    /**
     * handles a character key event
     *
     * @param {string} character
     * @param {Array} modifiers
     * @param {Event} e
     * @returns void
     */
    function _handleKey(character, modifiers, e) {
        var callbacks = _getMatches(character, modifiers, e),
            i,
            doNotReset = {},
            maxLevel = 0,
            processedSequenceCallback = false;

        // Calculate the maxLevel for sequences so we can only execute the longest callback sequence
        for (i = 0; i < callbacks.length; ++i) {
            if (callbacks[i].seq) {
                maxLevel = Math.max(maxLevel, callbacks[i].level);
            }
        }

        // loop through matching callbacks for this key event
        for (i = 0; i < callbacks.length; ++i) {

            // fire for all sequence callbacks
            // this is because if for example you have multiple sequences
            // bound such as "g i" and "g t" they both need to fire the
            // callback for matching g cause otherwise you can only ever
            // match the first one
            if (callbacks[i].seq) {

                // only fire callbacks for the maxLevel to prevent
                // subsequences from also firing
                //
                // for example 'a option b' should not cause 'option b' to fire
                // even though 'option b' is part of the other sequence
                //
                // any sequences that do not match here will be discarded
                // below by the _resetSequences call
                if (callbacks[i].level != maxLevel) {
                    continue;
                }

                processedSequenceCallback = true;

                // keep a list of which sequences were matches for later
                doNotReset[callbacks[i].seq] = 1;
                _fireCallback(callbacks[i].callback, e, callbacks[i].combo, callbacks[i].seq);
                continue;
            }

            // if there were no sequence matches but we are still here
            // that means this is a regular match so we should fire that
            if (!processedSequenceCallback) {
                _fireCallback(callbacks[i].callback, e, callbacks[i].combo);
            }
        }

        // if the key you pressed matches the type of sequence without
        // being a modifier (ie "keyup" or "keypress") then we should
        // reset all sequences that were not matched by this event
        //
        // this is so, for example, if you have the sequence "h a t" and you
        // type "h e a r t" it does not match.  in this case the "e" will
        // cause the sequence to reset
        //
        // modifier keys are ignored because you can have a sequence
        // that contains modifiers such as "enter ctrl+space" and in most
        // cases the modifier key will be pressed before the next key
        //
        // also if you have a sequence such as "ctrl+b a" then pressing the
        // "b" key will trigger a "keypress" and a "keydown"
        //
        // the "keydown" is expected when there is a modifier, but the
        // "keypress" ends up matching the _nextExpectedAction since it occurs
        // after and that causes the sequence to reset
        //
        // we ignore keypresses in a sequence that directly follow a keydown
        // for the same character
        var ignoreThisKeypress = e.type == 'keypress' && _ignoreNextKeypress;
        if (e.type == _nextExpectedAction && !_isModifier(character) && !ignoreThisKeypress) {
            _resetSequences(doNotReset);
        }

        _ignoreNextKeypress = processedSequenceCallback && e.type == 'keydown';
    }

    /**
     * handles a keydown event
     *
     * @param {Event} e
     * @returns void
     */
    function _handleKeyEvent(e) {

        // normalize e.which for key events
        // @see http://stackoverflow.com/questions/4285627/javascript-keycode-vs-charcode-utter-confusion
        if (typeof e.which !== 'number') {
            e.which = e.keyCode;
        }

        var character = _characterFromEvent(e);

        // no character found then stop
        if (!character) {
            return;
        }

        // need to use === for the character check because the character can be 0
        if (e.type == 'keyup' && _ignoreNextKeyup === character) {
            _ignoreNextKeyup = false;
            return;
        }

        Mousetrap.handleKey(character, _eventModifiers(e), e);
    }

    /**
     * determines if the keycode specified is a modifier key or not
     *
     * @param {string} key
     * @returns {boolean}
     */
    function _isModifier(key) {
        return key == 'shift' || key == 'ctrl' || key == 'alt' || key == 'meta';
    }

    /**
     * called to set a 1 second timeout on the specified sequence
     *
     * this is so after each key press in the sequence you have 1 second
     * to press the next key before you have to start over
     *
     * @returns void
     */
    function _resetSequenceTimer() {
        clearTimeout(_resetTimer);
        _resetTimer = setTimeout(_resetSequences, 1000);
    }

    /**
     * reverses the map lookup so that we can look for specific keys
     * to see what can and can't use keypress
     *
     * @return {Object}
     */
    function _getReverseMap() {
        if (!_REVERSE_MAP) {
            _REVERSE_MAP = {};
            for (var key in _MAP) {

                // pull out the numeric keypad from here cause keypress should
                // be able to detect the keys from the character
                if (key > 95 && key < 112) {
                    continue;
                }

                if (_MAP.hasOwnProperty(key)) {
                    _REVERSE_MAP[_MAP[key]] = key;
                }
            }
        }
        return _REVERSE_MAP;
    }

    /**
     * picks the best action based on the key combination
     *
     * @param {string} key - character for key
     * @param {Array} modifiers
     * @param {string=} action passed in
     */
    function _pickBestAction(key, modifiers, action) {

        // if no action was picked in we should try to pick the one
        // that we think would work best for this key
        if (!action) {
            action = _getReverseMap()[key] ? 'keydown' : 'keypress';
        }

        // modifier keys don't work as expected with keypress,
        // switch to keydown
        if (action == 'keypress' && modifiers.length) {
            action = 'keydown';
        }

        return action;
    }

    /**
     * binds a key sequence to an event
     *
     * @param {string} combo - combo specified in bind call
     * @param {Array} keys
     * @param {Function} callback
     * @param {string=} action
     * @returns void
     */
    function _bindSequence(combo, keys, callback, action) {

        // start off by adding a sequence level record for this combination
        // and setting the level to 0
        _sequenceLevels[combo] = 0;

        /**
         * callback to increase the sequence level for this sequence and reset
         * all other sequences that were active
         *
         * @param {string} nextAction
         * @returns {Function}
         */
        function _increaseSequence(nextAction) {
            return function() {
                _nextExpectedAction = nextAction;
                ++_sequenceLevels[combo];
                _resetSequenceTimer();
            };
        }

        /**
         * wraps the specified callback inside of another function in order
         * to reset all sequence counters as soon as this sequence is done
         *
         * @param {Event} e
         * @returns void
         */
        function _callbackAndReset(e) {
            _fireCallback(callback, e, combo);

            // we should ignore the next key up if the action is key down
            // or keypress.  this is so if you finish a sequence and
            // release the key the final key will not trigger a keyup
            if (action !== 'keyup') {
                _ignoreNextKeyup = _characterFromEvent(e);
            }

            // weird race condition if a sequence ends with the key
            // another sequence begins with
            setTimeout(_resetSequences, 10);
        }

        // loop through keys one at a time and bind the appropriate callback
        // function.  for any key leading up to the final one it should
        // increase the sequence. after the final, it should reset all sequences
        //
        // if an action is specified in the original bind call then that will
        // be used throughout.  otherwise we will pass the action that the
        // next key in the sequence should match.  this allows a sequence
        // to mix and match keypress and keydown events depending on which
        // ones are better suited to the key provided
        for (var i = 0; i < keys.length; ++i) {
            var isFinal = i + 1 === keys.length;
            var wrappedCallback = isFinal ? _callbackAndReset : _increaseSequence(action || _getKeyInfo(keys[i + 1]).action);
            _bindSingle(keys[i], wrappedCallback, action, combo, i);
        }
    }

    /**
     * Converts from a string key combination to an array
     *
     * @param  {string} combination like "command+shift+l"
     * @return {Array}
     */
    function _keysFromString(combination) {
        if (combination === '+') {
            return ['+'];
        }

        return combination.split('+');
    }

    /**
     * Gets info for a specific key combination
     *
     * @param  {string} combination key combination ("command+s" or "a" or "*")
     * @param  {string=} action
     * @returns {Object}
     */
    function _getKeyInfo(combination, action) {
        var keys,
            key,
            i,
            modifiers = [];

        // take the keys from this pattern and figure out what the actual
        // pattern is all about
        keys = _keysFromString(combination);

        for (i = 0; i < keys.length; ++i) {
            key = keys[i];

            // normalize key names
            if (_SPECIAL_ALIASES[key]) {
                key = _SPECIAL_ALIASES[key];
            }

            // if this is not a keypress event then we should
            // be smart about using shift keys
            // this will only work for US keyboards however
            if (action && action != 'keypress' && _SHIFT_MAP[key]) {
                key = _SHIFT_MAP[key];
                modifiers.push('shift');
            }

            // if this key is a modifier then add it to the list of modifiers
            if (_isModifier(key)) {
                modifiers.push(key);
            }
        }

        // depending on what the key combination is
        // we will try to pick the best event for it
        action = _pickBestAction(key, modifiers, action);

        return {
            key: key,
            modifiers: modifiers,
            action: action
        };
    }

    /**
     * binds a single keyboard combination
     *
     * @param {string} combination
     * @param {Function} callback
     * @param {string=} action
     * @param {string=} sequenceName - name of sequence if part of sequence
     * @param {number=} level - what part of the sequence the command is
     * @returns void
     */
    function _bindSingle(combination, callback, action, sequenceName, level) {

        // store a direct mapped reference for use with Mousetrap.trigger
        _directMap[combination + ':' + action] = callback;

        // make sure multiple spaces in a row become a single space
        combination = combination.replace(/\s+/g, ' ');

        var sequence = combination.split(' '),
            info;

        // if this pattern is a sequence of keys then run through this method
        // to reprocess each pattern one key at a time
        if (sequence.length > 1) {
            _bindSequence(combination, sequence, callback, action);
            return;
        }

        info = _getKeyInfo(combination, action);

        // make sure to initialize array if this is the first time
        // a callback is added for this key
        _callbacks[info.key] = _callbacks[info.key] || [];

        // remove an existing match if there is one
        _getMatches(info.key, info.modifiers, {type: info.action}, sequenceName, combination, level);

        // add this call back to the array
        // if it is a sequence put it at the beginning
        // if not put it at the end
        //
        // this is important because the way these are processed expects
        // the sequence ones to come first
        _callbacks[info.key][sequenceName ? 'unshift' : 'push']({
            callback: callback,
            modifiers: info.modifiers,
            action: info.action,
            seq: sequenceName,
            level: level,
            combo: combination
        });
    }

    /**
     * binds multiple combinations to the same callback
     *
     * @param {Array} combinations
     * @param {Function} callback
     * @param {string|undefined} action
     * @returns void
     */
    function _bindMultiple(combinations, callback, action) {
        for (var i = 0; i < combinations.length; ++i) {
            _bindSingle(combinations[i], callback, action);
        }
    }

    // start!
    _addEvent(document, 'keypress', _handleKeyEvent);
    _addEvent(document, 'keydown', _handleKeyEvent);
    _addEvent(document, 'keyup', _handleKeyEvent);

    var Mousetrap = {

        /**
         * binds an event to mousetrap
         *
         * can be a single key, a combination of keys separated with +,
         * an array of keys, or a sequence of keys separated by spaces
         *
         * be sure to list the modifier keys first to make sure that the
         * correct key ends up getting bound (the last key in the pattern)
         *
         * @param {string|Array} keys
         * @param {Function} callback
         * @param {string=} action - 'keypress', 'keydown', or 'keyup'
         * @returns void
         */
        bind: function(keys, callback, action) {
            keys = keys instanceof Array ? keys : [keys];
            _bindMultiple(keys, callback, action);
            return this;
        },

        /**
         * unbinds an event to mousetrap
         *
         * the unbinding sets the callback function of the specified key combo
         * to an empty function and deletes the corresponding key in the
         * _directMap dict.
         *
         * TODO: actually remove this from the _callbacks dictionary instead
         * of binding an empty function
         *
         * the keycombo+action has to be exactly the same as
         * it was defined in the bind method
         *
         * @param {string|Array} keys
         * @param {string} action
         * @returns void
         */
        unbind: function(keys, action) {
            return Mousetrap.bind(keys, function() {}, action);
        },

        /**
         * triggers an event that has already been bound
         *
         * @param {string} keys
         * @param {string=} action
         * @returns void
         */
        trigger: function(keys, action) {
            if (_directMap[keys + ':' + action]) {
                _directMap[keys + ':' + action]({}, keys);
            }
            return this;
        },

        /**
         * resets the library back to its initial state.  this is useful
         * if you want to clear out the current keyboard shortcuts and bind
         * new ones - for example if you switch to another page
         *
         * @returns void
         */
        reset: function() {
            _callbacks = {};
            _directMap = {};
            return this;
        },

       /**
        * should we stop this event before firing off callbacks
        *
        * @param {Event} e
        * @param {Element} element
        * @return {boolean}
        */
        stopCallback: function(e, element) {

            // if the element has the class "mousetrap" then no need to stop
            if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
                return false;
            }

            // stop for input, select, and textarea
            return element.tagName == 'INPUT' || element.tagName == 'SELECT' || element.tagName == 'TEXTAREA' || element.isContentEditable;
        },

        /**
         * exposes _handleKey publicly so it can be overwritten by extensions
         */
        handleKey: _handleKey
    };

    // expose mousetrap to the global object
    window.Mousetrap = Mousetrap;

    // expose mousetrap as an AMD module
    if (typeof define === 'function' && define.amd) {
        define(Mousetrap);
    }
}) (window, document);
;// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ Raphaël 2.1.0 - JavaScript Vector Library                          │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2008-2012 Dmitry Baranovskiy (http://raphaeljs.com)    │ \\
// │ Copyright © 2008-2012 Sencha Labs (http://sencha.com)              │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT (http://raphaeljs.com/license.html) license.│ \\
// └────────────────────────────────────────────────────────────────────┘ \\

(function(a){var b="0.3.4",c="hasOwnProperty",d=/[\.\/]/,e="*",f=function(){},g=function(a,b){return a-b},h,i,j={n:{}},k=function(a,b){var c=j,d=i,e=Array.prototype.slice.call(arguments,2),f=k.listeners(a),l=0,m=!1,n,o=[],p={},q=[],r=h,s=[];h=a,i=0;for(var t=0,u=f.length;t<u;t++)"zIndex"in f[t]&&(o.push(f[t].zIndex),f[t].zIndex<0&&(p[f[t].zIndex]=f[t]));o.sort(g);while(o[l]<0){n=p[o[l++]],q.push(n.apply(b,e));if(i){i=d;return q}}for(t=0;t<u;t++){n=f[t];if("zIndex"in n)if(n.zIndex==o[l]){q.push(n.apply(b,e));if(i)break;do{l++,n=p[o[l]],n&&q.push(n.apply(b,e));if(i)break}while(n)}else p[n.zIndex]=n;else{q.push(n.apply(b,e));if(i)break}}i=d,h=r;return q.length?q:null};k.listeners=function(a){var b=a.split(d),c=j,f,g,h,i,k,l,m,n,o=[c],p=[];for(i=0,k=b.length;i<k;i++){n=[];for(l=0,m=o.length;l<m;l++){c=o[l].n,g=[c[b[i]],c[e]],h=2;while(h--)f=g[h],f&&(n.push(f),p=p.concat(f.f||[]))}o=n}return p},k.on=function(a,b){var c=a.split(d),e=j;for(var g=0,h=c.length;g<h;g++)e=e.n,!e[c[g]]&&(e[c[g]]={n:{}}),e=e[c[g]];e.f=e.f||[];for(g=0,h=e.f.length;g<h;g++)if(e.f[g]==b)return f;e.f.push(b);return function(a){+a==+a&&(b.zIndex=+a)}},k.stop=function(){i=1},k.nt=function(a){if(a)return(new RegExp("(?:\\.|\\/|^)"+a+"(?:\\.|\\/|$)")).test(h);return h},k.off=k.unbind=function(a,b){var f=a.split(d),g,h,i,k,l,m,n,o=[j];for(k=0,l=f.length;k<l;k++)for(m=0;m<o.length;m+=i.length-2){i=[m,1],g=o[m].n;if(f[k]!=e)g[f[k]]&&i.push(g[f[k]]);else for(h in g)g[c](h)&&i.push(g[h]);o.splice.apply(o,i)}for(k=0,l=o.length;k<l;k++){g=o[k];while(g.n){if(b){if(g.f){for(m=0,n=g.f.length;m<n;m++)if(g.f[m]==b){g.f.splice(m,1);break}!g.f.length&&delete g.f}for(h in g.n)if(g.n[c](h)&&g.n[h].f){var p=g.n[h].f;for(m=0,n=p.length;m<n;m++)if(p[m]==b){p.splice(m,1);break}!p.length&&delete g.n[h].f}}else{delete g.f;for(h in g.n)g.n[c](h)&&g.n[h].f&&delete g.n[h].f}g=g.n}}},k.once=function(a,b){var c=function(){var d=b.apply(this,arguments);k.unbind(a,c);return d};return k.on(a,c)},k.version=b,k.toString=function(){return"You are running Eve "+b},typeof module!="undefined"&&module.exports?module.exports=k:typeof define!="undefined"?define("eve",[],function(){return k}):a.eve=k})(this),function(){function cF(a){for(var b=0;b<cy.length;b++)cy[b].el.paper==a&&cy.splice(b--,1)}function cE(b,d,e,f,h,i){e=Q(e);var j,k,l,m=[],o,p,q,t=b.ms,u={},v={},w={};if(f)for(y=0,z=cy.length;y<z;y++){var x=cy[y];if(x.el.id==d.id&&x.anim==b){x.percent!=e?(cy.splice(y,1),l=1):k=x,d.attr(x.totalOrigin);break}}else f=+v;for(var y=0,z=b.percents.length;y<z;y++){if(b.percents[y]==e||b.percents[y]>f*b.top){e=b.percents[y],p=b.percents[y-1]||0,t=t/b.top*(e-p),o=b.percents[y+1],j=b.anim[e];break}f&&d.attr(b.anim[b.percents[y]])}if(!!j){if(!k){for(var A in j)if(j[g](A))if(U[g](A)||d.paper.customAttributes[g](A)){u[A]=d.attr(A),u[A]==null&&(u[A]=T[A]),v[A]=j[A];switch(U[A]){case C:w[A]=(v[A]-u[A])/t;break;case"colour":u[A]=a.getRGB(u[A]);var B=a.getRGB(v[A]);w[A]={r:(B.r-u[A].r)/t,g:(B.g-u[A].g)/t,b:(B.b-u[A].b)/t};break;case"path":var D=bR(u[A],v[A]),E=D[1];u[A]=D[0],w[A]=[];for(y=0,z=u[A].length;y<z;y++){w[A][y]=[0];for(var F=1,G=u[A][y].length;F<G;F++)w[A][y][F]=(E[y][F]-u[A][y][F])/t}break;case"transform":var H=d._,I=ca(H[A],v[A]);if(I){u[A]=I.from,v[A]=I.to,w[A]=[],w[A].real=!0;for(y=0,z=u[A].length;y<z;y++){w[A][y]=[u[A][y][0]];for(F=1,G=u[A][y].length;F<G;F++)w[A][y][F]=(v[A][y][F]-u[A][y][F])/t}}else{var J=d.matrix||new cb,K={_:{transform:H.transform},getBBox:function(){return d.getBBox(1)}};u[A]=[J.a,J.b,J.c,J.d,J.e,J.f],b$(K,v[A]),v[A]=K._.transform,w[A]=[(K.matrix.a-J.a)/t,(K.matrix.b-J.b)/t,(K.matrix.c-J.c)/t,(K.matrix.d-J.d)/t,(K.matrix.e-J.e)/t,(K.matrix.f-J.f)/t]}break;case"csv":var L=r(j[A])[s](c),M=r(u[A])[s](c);if(A=="clip-rect"){u[A]=M,w[A]=[],y=M.length;while(y--)w[A][y]=(L[y]-u[A][y])/t}v[A]=L;break;default:L=[][n](j[A]),M=[][n](u[A]),w[A]=[],y=d.paper.customAttributes[A].length;while(y--)w[A][y]=((L[y]||0)-(M[y]||0))/t}}var O=j.easing,P=a.easing_formulas[O];if(!P){P=r(O).match(N);if(P&&P.length==5){var R=P;P=function(a){return cC(a,+R[1],+R[2],+R[3],+R[4],t)}}else P=bf}q=j.start||b.start||+(new Date),x={anim:b,percent:e,timestamp:q,start:q+(b.del||0),status:0,initstatus:f||0,stop:!1,ms:t,easing:P,from:u,diff:w,to:v,el:d,callback:j.callback,prev:p,next:o,repeat:i||b.times,origin:d.attr(),totalOrigin:h},cy.push(x);if(f&&!k&&!l){x.stop=!0,x.start=new Date-t*f;if(cy.length==1)return cA()}l&&(x.start=new Date-x.ms*f),cy.length==1&&cz(cA)}else k.initstatus=f,k.start=new Date-k.ms*f;eve("raphael.anim.start."+d.id,d,b)}}function cD(a,b){var c=[],d={};this.ms=b,this.times=1;if(a){for(var e in a)a[g](e)&&(d[Q(e)]=a[e],c.push(Q(e)));c.sort(bd)}this.anim=d,this.top=c[c.length-1],this.percents=c}function cC(a,b,c,d,e,f){function o(a,b){var c,d,e,f,j,k;for(e=a,k=0;k<8;k++){f=m(e)-a;if(z(f)<b)return e;j=(3*i*e+2*h)*e+g;if(z(j)<1e-6)break;e=e-f/j}c=0,d=1,e=a;if(e<c)return c;if(e>d)return d;while(c<d){f=m(e);if(z(f-a)<b)return e;a>f?c=e:d=e,e=(d-c)/2+c}return e}function n(a,b){var c=o(a,b);return((l*c+k)*c+j)*c}function m(a){return((i*a+h)*a+g)*a}var g=3*b,h=3*(d-b)-g,i=1-g-h,j=3*c,k=3*(e-c)-j,l=1-j-k;return n(a,1/(200*f))}function cq(){return this.x+q+this.y+q+this.width+" × "+this.height}function cp(){return this.x+q+this.y}function cb(a,b,c,d,e,f){a!=null?(this.a=+a,this.b=+b,this.c=+c,this.d=+d,this.e=+e,this.f=+f):(this.a=1,this.b=0,this.c=0,this.d=1,this.e=0,this.f=0)}function bH(b,c,d){b=a._path2curve(b),c=a._path2curve(c);var e,f,g,h,i,j,k,l,m,n,o=d?0:[];for(var p=0,q=b.length;p<q;p++){var r=b[p];if(r[0]=="M")e=i=r[1],f=j=r[2];else{r[0]=="C"?(m=[e,f].concat(r.slice(1)),e=m[6],f=m[7]):(m=[e,f,e,f,i,j,i,j],e=i,f=j);for(var s=0,t=c.length;s<t;s++){var u=c[s];if(u[0]=="M")g=k=u[1],h=l=u[2];else{u[0]=="C"?(n=[g,h].concat(u.slice(1)),g=n[6],h=n[7]):(n=[g,h,g,h,k,l,k,l],g=k,h=l);var v=bG(m,n,d);if(d)o+=v;else{for(var w=0,x=v.length;w<x;w++)v[w].segment1=p,v[w].segment2=s,v[w].bez1=m,v[w].bez2=n;o=o.concat(v)}}}}}return o}function bG(b,c,d){var e=a.bezierBBox(b),f=a.bezierBBox(c);if(!a.isBBoxIntersect(e,f))return d?0:[];var g=bB.apply(0,b),h=bB.apply(0,c),i=~~(g/5),j=~~(h/5),k=[],l=[],m={},n=d?0:[];for(var o=0;o<i+1;o++){var p=a.findDotsAtSegment.apply(a,b.concat(o/i));k.push({x:p.x,y:p.y,t:o/i})}for(o=0;o<j+1;o++)p=a.findDotsAtSegment.apply(a,c.concat(o/j)),l.push({x:p.x,y:p.y,t:o/j});for(o=0;o<i;o++)for(var q=0;q<j;q++){var r=k[o],s=k[o+1],t=l[q],u=l[q+1],v=z(s.x-r.x)<.001?"y":"x",w=z(u.x-t.x)<.001?"y":"x",x=bD(r.x,r.y,s.x,s.y,t.x,t.y,u.x,u.y);if(x){if(m[x.x.toFixed(4)]==x.y.toFixed(4))continue;m[x.x.toFixed(4)]=x.y.toFixed(4);var y=r.t+z((x[v]-r[v])/(s[v]-r[v]))*(s.t-r.t),A=t.t+z((x[w]-t[w])/(u[w]-t[w]))*(u.t-t.t);y>=0&&y<=1&&A>=0&&A<=1&&(d?n++:n.push({x:x.x,y:x.y,t1:y,t2:A}))}}return n}function bF(a,b){return bG(a,b,1)}function bE(a,b){return bG(a,b)}function bD(a,b,c,d,e,f,g,h){if(!(x(a,c)<y(e,g)||y(a,c)>x(e,g)||x(b,d)<y(f,h)||y(b,d)>x(f,h))){var i=(a*d-b*c)*(e-g)-(a-c)*(e*h-f*g),j=(a*d-b*c)*(f-h)-(b-d)*(e*h-f*g),k=(a-c)*(f-h)-(b-d)*(e-g);if(!k)return;var l=i/k,m=j/k,n=+l.toFixed(2),o=+m.toFixed(2);if(n<+y(a,c).toFixed(2)||n>+x(a,c).toFixed(2)||n<+y(e,g).toFixed(2)||n>+x(e,g).toFixed(2)||o<+y(b,d).toFixed(2)||o>+x(b,d).toFixed(2)||o<+y(f,h).toFixed(2)||o>+x(f,h).toFixed(2))return;return{x:l,y:m}}}function bC(a,b,c,d,e,f,g,h,i){if(!(i<0||bB(a,b,c,d,e,f,g,h)<i)){var j=1,k=j/2,l=j-k,m,n=.01;m=bB(a,b,c,d,e,f,g,h,l);while(z(m-i)>n)k/=2,l+=(m<i?1:-1)*k,m=bB(a,b,c,d,e,f,g,h,l);return l}}function bB(a,b,c,d,e,f,g,h,i){i==null&&(i=1),i=i>1?1:i<0?0:i;var j=i/2,k=12,l=[-0.1252,.1252,-0.3678,.3678,-0.5873,.5873,-0.7699,.7699,-0.9041,.9041,-0.9816,.9816],m=[.2491,.2491,.2335,.2335,.2032,.2032,.1601,.1601,.1069,.1069,.0472,.0472],n=0;for(var o=0;o<k;o++){var p=j*l[o]+j,q=bA(p,a,c,e,g),r=bA(p,b,d,f,h),s=q*q+r*r;n+=m[o]*w.sqrt(s)}return j*n}function bA(a,b,c,d,e){var f=-3*b+9*c-9*d+3*e,g=a*f+6*b-12*c+6*d;return a*g-3*b+3*c}function by(a,b){var c=[];for(var d=0,e=a.length;e-2*!b>d;d+=2){var f=[{x:+a[d-2],y:+a[d-1]},{x:+a[d],y:+a[d+1]},{x:+a[d+2],y:+a[d+3]},{x:+a[d+4],y:+a[d+5]}];b?d?e-4==d?f[3]={x:+a[0],y:+a[1]}:e-2==d&&(f[2]={x:+a[0],y:+a[1]},f[3]={x:+a[2],y:+a[3]}):f[0]={x:+a[e-2],y:+a[e-1]}:e-4==d?f[3]=f[2]:d||(f[0]={x:+a[d],y:+a[d+1]}),c.push(["C",(-f[0].x+6*f[1].x+f[2].x)/6,(-f[0].y+6*f[1].y+f[2].y)/6,(f[1].x+6*f[2].x-f[3].x)/6,(f[1].y+6*f[2].y-f[3].y)/6,f[2].x,f[2].y])}return c}function bx(){return this.hex}function bv(a,b,c){function d(){var e=Array.prototype.slice.call(arguments,0),f=e.join("␀"),h=d.cache=d.cache||{},i=d.count=d.count||[];if(h[g](f)){bu(i,f);return c?c(h[f]):h[f]}i.length>=1e3&&delete h[i.shift()],i.push(f),h[f]=a[m](b,e);return c?c(h[f]):h[f]}return d}function bu(a,b){for(var c=0,d=a.length;c<d;c++)if(a[c]===b)return a.push(a.splice(c,1)[0])}function bm(a){if(Object(a)!==a)return a;var b=new a.constructor;for(var c in a)a[g](c)&&(b[c]=bm(a[c]));return b}function a(c){if(a.is(c,"function"))return b?c():eve.on("raphael.DOMload",c);if(a.is(c,E))return a._engine.create[m](a,c.splice(0,3+a.is(c[0],C))).add(c);var d=Array.prototype.slice.call(arguments,0);if(a.is(d[d.length-1],"function")){var e=d.pop();return b?e.call(a._engine.create[m](a,d)):eve.on("raphael.DOMload",function(){e.call(a._engine.create[m](a,d))})}return a._engine.create[m](a,arguments)}a.version="2.1.0",a.eve=eve;var b,c=/[, ]+/,d={circle:1,rect:1,path:1,ellipse:1,text:1,image:1},e=/\{(\d+)\}/g,f="prototype",g="hasOwnProperty",h={doc:document,win:window},i={was:Object.prototype[g].call(h.win,"Raphael"),is:h.win.Raphael},j=function(){this.ca=this.customAttributes={}},k,l="appendChild",m="apply",n="concat",o="createTouch"in h.doc,p="",q=" ",r=String,s="split",t="click dblclick mousedown mousemove mouseout mouseover mouseup touchstart touchmove touchend touchcancel"[s](q),u={mousedown:"touchstart",mousemove:"touchmove",mouseup:"touchend"},v=r.prototype.toLowerCase,w=Math,x=w.max,y=w.min,z=w.abs,A=w.pow,B=w.PI,C="number",D="string",E="array",F="toString",G="fill",H=Object.prototype.toString,I={},J="push",K=a._ISURL=/^url\(['"]?([^\)]+?)['"]?\)$/i,L=/^\s*((#[a-f\d]{6})|(#[a-f\d]{3})|rgba?\(\s*([\d\.]+%?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+%?(?:\s*,\s*[\d\.]+%?)?)\s*\)|hsba?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\)|hsla?\(\s*([\d\.]+(?:deg|\xb0|%)?\s*,\s*[\d\.]+%?\s*,\s*[\d\.]+(?:%?\s*,\s*[\d\.]+)?)%?\s*\))\s*$/i,M={NaN:1,Infinity:1,"-Infinity":1},N=/^(?:cubic-)?bezier\(([^,]+),([^,]+),([^,]+),([^\)]+)\)/,O=w.round,P="setAttribute",Q=parseFloat,R=parseInt,S=r.prototype.toUpperCase,T=a._availableAttrs={"arrow-end":"none","arrow-start":"none",blur:0,"clip-rect":"0 0 1e9 1e9",cursor:"default",cx:0,cy:0,fill:"#fff","fill-opacity":1,font:'10px "Arial"',"font-family":'"Arial"',"font-size":"10","font-style":"normal","font-weight":400,gradient:0,height:0,href:"http://raphaeljs.com/","letter-spacing":0,opacity:1,path:"M0,0",r:0,rx:0,ry:0,src:"",stroke:"#000","stroke-dasharray":"","stroke-linecap":"butt","stroke-linejoin":"butt","stroke-miterlimit":0,"stroke-opacity":1,"stroke-width":1,target:"_blank","text-anchor":"middle",title:"Raphael",transform:"",width:0,x:0,y:0},U=a._availableAnimAttrs={blur:C,"clip-rect":"csv",cx:C,cy:C,fill:"colour","fill-opacity":C,"font-size":C,height:C,opacity:C,path:"path",r:C,rx:C,ry:C,stroke:"colour","stroke-opacity":C,"stroke-width":C,transform:"transform",width:C,x:C,y:C},V=/[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]/g,W=/[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/,X={hs:1,rg:1},Y=/,?([achlmqrstvxz]),?/gi,Z=/([achlmrqstvz])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,$=/([rstm])[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029,]*((-?\d*\.?\d*(?:e[\-+]?\d+)?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*)+)/ig,_=/(-?\d*\.?\d*(?:e[\-+]?\d+)?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,?[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*/ig,ba=a._radial_gradient=/^r(?:\(([^,]+?)[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*,[\x09\x0a\x0b\x0c\x0d\x20\xa0\u1680\u180e\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200a\u202f\u205f\u3000\u2028\u2029]*([^\)]+?)\))?/,bb={},bc=function(a,b){return a.key-b.key},bd=function(a,b){return Q(a)-Q(b)},be=function(){},bf=function(a){return a},bg=a._rectPath=function(a,b,c,d,e){if(e)return[["M",a+e,b],["l",c-e*2,0],["a",e,e,0,0,1,e,e],["l",0,d-e*2],["a",e,e,0,0,1,-e,e],["l",e*2-c,0],["a",e,e,0,0,1,-e,-e],["l",0,e*2-d],["a",e,e,0,0,1,e,-e],["z"]];return[["M",a,b],["l",c,0],["l",0,d],["l",-c,0],["z"]]},bh=function(a,b,c,d){d==null&&(d=c);return[["M",a,b],["m",0,-d],["a",c,d,0,1,1,0,2*d],["a",c,d,0,1,1,0,-2*d],["z"]]},bi=a._getPath={path:function(a){return a.attr("path")},circle:function(a){var b=a.attrs;return bh(b.cx,b.cy,b.r)},ellipse:function(a){var b=a.attrs;return bh(b.cx,b.cy,b.rx,b.ry)},rect:function(a){var b=a.attrs;return bg(b.x,b.y,b.width,b.height,b.r)},image:function(a){var b=a.attrs;return bg(b.x,b.y,b.width,b.height)},text:function(a){var b=a._getBBox();return bg(b.x,b.y,b.width,b.height)}},bj=a.mapPath=function(a,b){if(!b)return a;var c,d,e,f,g,h,i;a=bR(a);for(e=0,g=a.length;e<g;e++){i=a[e];for(f=1,h=i.length;f<h;f+=2)c=b.x(i[f],i[f+1]),d=b.y(i[f],i[f+1]),i[f]=c,i[f+1]=d}return a};a._g=h,a.type=h.win.SVGAngle||h.doc.implementation.hasFeature("http://www.w3.org/TR/SVG11/feature#BasicStructure","1.1")?"SVG":"VML";if(a.type=="VML"){var bk=h.doc.createElement("div"),bl;bk.innerHTML='<v:shape adj="1"/>',bl=bk.firstChild,bl.style.behavior="url(#default#VML)";if(!bl||typeof bl.adj!="object")return a.type=p;bk=null}a.svg=!(a.vml=a.type=="VML"),a._Paper=j,a.fn=k=j.prototype=a.prototype,a._id=0,a._oid=0,a.is=function(a,b){b=v.call(b);if(b=="finite")return!M[g](+a);if(b=="array")return a instanceof Array;return b=="null"&&a===null||b==typeof a&&a!==null||b=="object"&&a===Object(a)||b=="array"&&Array.isArray&&Array.isArray(a)||H.call(a).slice(8,-1).toLowerCase()==b},a.angle=function(b,c,d,e,f,g){if(f==null){var h=b-d,i=c-e;if(!h&&!i)return 0;return(180+w.atan2(-i,-h)*180/B+360)%360}return a.angle(b,c,f,g)-a.angle(d,e,f,g)},a.rad=function(a){return a%360*B/180},a.deg=function(a){return a*180/B%360},a.snapTo=function(b,c,d){d=a.is(d,"finite")?d:10;if(a.is(b,E)){var e=b.length;while(e--)if(z(b[e]-c)<=d)return b[e]}else{b=+b;var f=c%b;if(f<d)return c-f;if(f>b-d)return c-f+b}return c};var bn=a.createUUID=function(a,b){return function(){return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(a,b).toUpperCase()}}(/[xy]/g,function(a){var b=w.random()*16|0,c=a=="x"?b:b&3|8;return c.toString(16)});a.setWindow=function(b){eve("raphael.setWindow",a,h.win,b),h.win=b,h.doc=h.win.document,a._engine.initWin&&a._engine.initWin(h.win)};var bo=function(b){if(a.vml){var c=/^\s+|\s+$/g,d;try{var e=new ActiveXObject("htmlfile");e.write("<body>"),e.close(),d=e.body}catch(f){d=createPopup().document.body}var g=d.createTextRange();bo=bv(function(a){try{d.style.color=r(a).replace(c,p);var b=g.queryCommandValue("ForeColor");b=(b&255)<<16|b&65280|(b&16711680)>>>16;return"#"+("000000"+b.toString(16)).slice(-6)}catch(e){return"none"}})}else{var i=h.doc.createElement("i");i.title="Raphaël Colour Picker",i.style.display="none",h.doc.body.appendChild(i),bo=bv(function(a){i.style.color=a;return h.doc.defaultView.getComputedStyle(i,p).getPropertyValue("color")})}return bo(b)},bp=function(){return"hsb("+[this.h,this.s,this.b]+")"},bq=function(){return"hsl("+[this.h,this.s,this.l]+")"},br=function(){return this.hex},bs=function(b,c,d){c==null&&a.is(b,"object")&&"r"in b&&"g"in b&&"b"in b&&(d=b.b,c=b.g,b=b.r);if(c==null&&a.is(b,D)){var e=a.getRGB(b);b=e.r,c=e.g,d=e.b}if(b>1||c>1||d>1)b/=255,c/=255,d/=255;return[b,c,d]},bt=function(b,c,d,e){b*=255,c*=255,d*=255;var f={r:b,g:c,b:d,hex:a.rgb(b,c,d),toString:br};a.is(e,"finite")&&(f.opacity=e);return f};a.color=function(b){var c;a.is(b,"object")&&"h"in b&&"s"in b&&"b"in b?(c=a.hsb2rgb(b),b.r=c.r,b.g=c.g,b.b=c.b,b.hex=c.hex):a.is(b,"object")&&"h"in b&&"s"in b&&"l"in b?(c=a.hsl2rgb(b),b.r=c.r,b.g=c.g,b.b=c.b,b.hex=c.hex):(a.is(b,"string")&&(b=a.getRGB(b)),a.is(b,"object")&&"r"in b&&"g"in b&&"b"in b?(c=a.rgb2hsl(b),b.h=c.h,b.s=c.s,b.l=c.l,c=a.rgb2hsb(b),b.v=c.b):(b={hex:"none"},b.r=b.g=b.b=b.h=b.s=b.v=b.l=-1)),b.toString=br;return b},a.hsb2rgb=function(a,b,c,d){this.is(a,"object")&&"h"in a&&"s"in a&&"b"in a&&(c=a.b,b=a.s,a=a.h,d=a.o),a*=360;var e,f,g,h,i;a=a%360/60,i=c*b,h=i*(1-z(a%2-1)),e=f=g=c-i,a=~~a,e+=[i,h,0,0,h,i][a],f+=[h,i,i,h,0,0][a],g+=[0,0,h,i,i,h][a];return bt(e,f,g,d)},a.hsl2rgb=function(a,b,c,d){this.is(a,"object")&&"h"in a&&"s"in a&&"l"in a&&(c=a.l,b=a.s,a=a.h);if(a>1||b>1||c>1)a/=360,b/=100,c/=100;a*=360;var e,f,g,h,i;a=a%360/60,i=2*b*(c<.5?c:1-c),h=i*(1-z(a%2-1)),e=f=g=c-i/2,a=~~a,e+=[i,h,0,0,h,i][a],f+=[h,i,i,h,0,0][a],g+=[0,0,h,i,i,h][a];return bt(e,f,g,d)},a.rgb2hsb=function(a,b,c){c=bs(a,b,c),a=c[0],b=c[1],c=c[2];var d,e,f,g;f=x(a,b,c),g=f-y(a,b,c),d=g==0?null:f==a?(b-c)/g:f==b?(c-a)/g+2:(a-b)/g+4,d=(d+360)%6*60/360,e=g==0?0:g/f;return{h:d,s:e,b:f,toString:bp}},a.rgb2hsl=function(a,b,c){c=bs(a,b,c),a=c[0],b=c[1],c=c[2];var d,e,f,g,h,i;g=x(a,b,c),h=y(a,b,c),i=g-h,d=i==0?null:g==a?(b-c)/i:g==b?(c-a)/i+2:(a-b)/i+4,d=(d+360)%6*60/360,f=(g+h)/2,e=i==0?0:f<.5?i/(2*f):i/(2-2*f);return{h:d,s:e,l:f,toString:bq}},a._path2string=function(){return this.join(",").replace(Y,"$1")};var bw=a._preload=function(a,b){var c=h.doc.createElement("img");c.style.cssText="position:absolute;left:-9999em;top:-9999em",c.onload=function(){b.call(this),this.onload=null,h.doc.body.removeChild(this)},c.onerror=function(){h.doc.body.removeChild(this)},h.doc.body.appendChild(c),c.src=a};a.getRGB=bv(function(b){if(!b||!!((b=r(b)).indexOf("-")+1))return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:bx};if(b=="none")return{r:-1,g:-1,b:-1,hex:"none",toString:bx};!X[g](b.toLowerCase().substring(0,2))&&b.charAt()!="#"&&(b=bo(b));var c,d,e,f,h,i,j,k=b.match(L);if(k){k[2]&&(f=R(k[2].substring(5),16),e=R(k[2].substring(3,5),16),d=R(k[2].substring(1,3),16)),k[3]&&(f=R((i=k[3].charAt(3))+i,16),e=R((i=k[3].charAt(2))+i,16),d=R((i=k[3].charAt(1))+i,16)),k[4]&&(j=k[4][s](W),d=Q(j[0]),j[0].slice(-1)=="%"&&(d*=2.55),e=Q(j[1]),j[1].slice(-1)=="%"&&(e*=2.55),f=Q(j[2]),j[2].slice(-1)=="%"&&(f*=2.55),k[1].toLowerCase().slice(0,4)=="rgba"&&(h=Q(j[3])),j[3]&&j[3].slice(-1)=="%"&&(h/=100));if(k[5]){j=k[5][s](W),d=Q(j[0]),j[0].slice(-1)=="%"&&(d*=2.55),e=Q(j[1]),j[1].slice(-1)=="%"&&(e*=2.55),f=Q(j[2]),j[2].slice(-1)=="%"&&(f*=2.55),(j[0].slice(-3)=="deg"||j[0].slice(-1)=="°")&&(d/=360),k[1].toLowerCase().slice(0,4)=="hsba"&&(h=Q(j[3])),j[3]&&j[3].slice(-1)=="%"&&(h/=100);return a.hsb2rgb(d,e,f,h)}if(k[6]){j=k[6][s](W),d=Q(j[0]),j[0].slice(-1)=="%"&&(d*=2.55),e=Q(j[1]),j[1].slice(-1)=="%"&&(e*=2.55),f=Q(j[2]),j[2].slice(-1)=="%"&&(f*=2.55),(j[0].slice(-3)=="deg"||j[0].slice(-1)=="°")&&(d/=360),k[1].toLowerCase().slice(0,4)=="hsla"&&(h=Q(j[3])),j[3]&&j[3].slice(-1)=="%"&&(h/=100);return a.hsl2rgb(d,e,f,h)}k={r:d,g:e,b:f,toString:bx},k.hex="#"+(16777216|f|e<<8|d<<16).toString(16).slice(1),a.is(h,"finite")&&(k.opacity=h);return k}return{r:-1,g:-1,b:-1,hex:"none",error:1,toString:bx}},a),a.hsb=bv(function(b,c,d){return a.hsb2rgb(b,c,d).hex}),a.hsl=bv(function(b,c,d){return a.hsl2rgb(b,c,d).hex}),a.rgb=bv(function(a,b,c){return"#"+(16777216|c|b<<8|a<<16).toString(16).slice(1)}),a.getColor=function(a){var b=this.getColor.start=this.getColor.start||{h:0,s:1,b:a||.75},c=this.hsb2rgb(b.h,b.s,b.b);b.h+=.075,b.h>1&&(b.h=0,b.s-=.2,b.s<=0&&(this.getColor.start={h:0,s:1,b:b.b}));return c.hex},a.getColor.reset=function(){delete this.start},a.parsePathString=function(b){if(!b)return null;var c=bz(b);if(c.arr)return bJ(c.arr);var d={a:7,c:6,h:1,l:2,m:2,r:4,q:4,s:4,t:2,v:1,z:0},e=[];a.is(b,E)&&a.is(b[0],E)&&(e=bJ(b)),e.length||r(b).replace(Z,function(a,b,c){var f=[],g=b.toLowerCase();c.replace(_,function(a,b){b&&f.push(+b)}),g=="m"&&f.length>2&&(e.push([b][n](f.splice(0,2))),g="l",b=b=="m"?"l":"L");if(g=="r")e.push([b][n](f));else while(f.length>=d[g]){e.push([b][n](f.splice(0,d[g])));if(!d[g])break}}),e.toString=a._path2string,c.arr=bJ(e);return e},a.parseTransformString=bv(function(b){if(!b)return null;var c={r:3,s:4,t:2,m:6},d=[];a.is(b,E)&&a.is(b[0],E)&&(d=bJ(b)),d.length||r(b).replace($,function(a,b,c){var e=[],f=v.call(b);c.replace(_,function(a,b){b&&e.push(+b)}),d.push([b][n](e))}),d.toString=a._path2string;return d});var bz=function(a){var b=bz.ps=bz.ps||{};b[a]?b[a].sleep=100:b[a]={sleep:100},setTimeout(function(){for(var c in b)b[g](c)&&c!=a&&(b[c].sleep--,!b[c].sleep&&delete b[c])});return b[a]};a.findDotsAtSegment=function(a,b,c,d,e,f,g,h,i){var j=1-i,k=A(j,3),l=A(j,2),m=i*i,n=m*i,o=k*a+l*3*i*c+j*3*i*i*e+n*g,p=k*b+l*3*i*d+j*3*i*i*f+n*h,q=a+2*i*(c-a)+m*(e-2*c+a),r=b+2*i*(d-b)+m*(f-2*d+b),s=c+2*i*(e-c)+m*(g-2*e+c),t=d+2*i*(f-d)+m*(h-2*f+d),u=j*a+i*c,v=j*b+i*d,x=j*e+i*g,y=j*f+i*h,z=90-w.atan2(q-s,r-t)*180/B;(q>s||r<t)&&(z+=180);return{x:o,y:p,m:{x:q,y:r},n:{x:s,y:t},start:{x:u,y:v},end:{x:x,y:y},alpha:z}},a.bezierBBox=function(b,c,d,e,f,g,h,i){a.is(b,"array")||(b=[b,c,d,e,f,g,h,i]);var j=bQ.apply(null,b);return{x:j.min.x,y:j.min.y,x2:j.max.x,y2:j.max.y,width:j.max.x-j.min.x,height:j.max.y-j.min.y}},a.isPointInsideBBox=function(a,b,c){return b>=a.x&&b<=a.x2&&c>=a.y&&c<=a.y2},a.isBBoxIntersect=function(b,c){var d=a.isPointInsideBBox;return d(c,b.x,b.y)||d(c,b.x2,b.y)||d(c,b.x,b.y2)||d(c,b.x2,b.y2)||d(b,c.x,c.y)||d(b,c.x2,c.y)||d(b,c.x,c.y2)||d(b,c.x2,c.y2)||(b.x<c.x2&&b.x>c.x||c.x<b.x2&&c.x>b.x)&&(b.y<c.y2&&b.y>c.y||c.y<b.y2&&c.y>b.y)},a.pathIntersection=function(a,b){return bH(a,b)},a.pathIntersectionNumber=function(a,b){return bH(a,b,1)},a.isPointInsidePath=function(b,c,d){var e=a.pathBBox(b);return a.isPointInsideBBox(e,c,d)&&bH(b,[["M",c,d],["H",e.x2+10]],1)%2==1},a._removedFactory=function(a){return function(){eve("raphael.log",null,"Raphaël: you are calling to method “"+a+"” of removed object",a)}};var bI=a.pathBBox=function(a){var b=bz(a);if(b.bbox)return b.bbox;if(!a)return{x:0,y:0,width:0,height:0,x2:0,y2:0};a=bR(a);var c=0,d=0,e=[],f=[],g;for(var h=0,i=a.length;h<i;h++){g=a[h];if(g[0]=="M")c=g[1],d=g[2],e.push(c),f.push(d);else{var j=bQ(c,d,g[1],g[2],g[3],g[4],g[5],g[6]);e=e[n](j.min.x,j.max.x),f=f[n](j.min.y,j.max.y),c=g[5],d=g[6]}}var k=y[m](0,e),l=y[m](0,f),o=x[m](0,e),p=x[m](0,f),q={x:k,y:l,x2:o,y2:p,width:o-k,height:p-l};b.bbox=bm(q);return q},bJ=function(b){var c=bm(b);c.toString=a._path2string;return c},bK=a._pathToRelative=function(b){var c=bz(b);if(c.rel)return bJ(c.rel);if(!a.is(b,E)||!a.is(b&&b[0],E))b=a.parsePathString(b);var d=[],e=0,f=0,g=0,h=0,i=0;b[0][0]=="M"&&(e=b[0][1],f=b[0][2],g=e,h=f,i++,d.push(["M",e,f]));for(var j=i,k=b.length;j<k;j++){var l=d[j]=[],m=b[j];if(m[0]!=v.call(m[0])){l[0]=v.call(m[0]);switch(l[0]){case"a":l[1]=m[1],l[2]=m[2],l[3]=m[3],l[4]=m[4],l[5]=m[5],l[6]=+(m[6]-e).toFixed(3),l[7]=+(m[7]-f).toFixed(3);break;case"v":l[1]=+(m[1]-f).toFixed(3);break;case"m":g=m[1],h=m[2];default:for(var n=1,o=m.length;n<o;n++)l[n]=+(m[n]-(n%2?e:f)).toFixed(3)}}else{l=d[j]=[],m[0]=="m"&&(g=m[1]+e,h=m[2]+f);for(var p=0,q=m.length;p<q;p++)d[j][p]=m[p]}var r=d[j].length;switch(d[j][0]){case"z":e=g,f=h;break;case"h":e+=+d[j][r-1];break;case"v":f+=+d[j][r-1];break;default:e+=+d[j][r-2],f+=+d[j][r-1]}}d.toString=a._path2string,c.rel=bJ(d);return d},bL=a._pathToAbsolute=function(b){var c=bz(b);if(c.abs)return bJ(c.abs);if(!a.is(b,E)||!a.is(b&&b[0],E))b=a.parsePathString(b);if(!b||!b.length)return[["M",0,0]];var d=[],e=0,f=0,g=0,h=0,i=0;b[0][0]=="M"&&(e=+b[0][1],f=+b[0][2],g=e,h=f,i++,d[0]=["M",e,f]);var j=b.length==3&&b[0][0]=="M"&&b[1][0].toUpperCase()=="R"&&b[2][0].toUpperCase()=="Z";for(var k,l,m=i,o=b.length;m<o;m++){d.push(k=[]),l=b[m];if(l[0]!=S.call(l[0])){k[0]=S.call(l[0]);switch(k[0]){case"A":k[1]=l[1],k[2]=l[2],k[3]=l[3],k[4]=l[4],k[5]=l[5],k[6]=+(l[6]+e),k[7]=+(l[7]+f);break;case"V":k[1]=+l[1]+f;break;case"H":k[1]=+l[1]+e;break;case"R":var p=[e,f][n](l.slice(1));for(var q=2,r=p.length;q<r;q++)p[q]=+p[q]+e,p[++q]=+p[q]+f;d.pop(),d=d[n](by(p,j));break;case"M":g=+l[1]+e,h=+l[2]+f;default:for(q=1,r=l.length;q<r;q++)k[q]=+l[q]+(q%2?e:f)}}else if(l[0]=="R")p=[e,f][n](l.slice(1)),d.pop(),d=d[n](by(p,j)),k=["R"][n](l.slice(-2));else for(var s=0,t=l.length;s<t;s++)k[s]=l[s];switch(k[0]){case"Z":e=g,f=h;break;case"H":e=k[1];break;case"V":f=k[1];break;case"M":g=k[k.length-2],h=k[k.length-1];default:e=k[k.length-2],f=k[k.length-1]}}d.toString=a._path2string,c.abs=bJ(d);return d},bM=function(a,b,c,d){return[a,b,c,d,c,d]},bN=function(a,b,c,d,e,f){var g=1/3,h=2/3;return[g*a+h*c,g*b+h*d,g*e+h*c,g*f+h*d,e,f]},bO=function(a,b,c,d,e,f,g,h,i,j){var k=B*120/180,l=B/180*(+e||0),m=[],o,p=bv(function(a,b,c){var d=a*w.cos(c)-b*w.sin(c),e=a*w.sin(c)+b*w.cos(c);return{x:d,y:e}});if(!j){o=p(a,b,-l),a=o.x,b=o.y,o=p(h,i,-l),h=o.x,i=o.y;var q=w.cos(B/180*e),r=w.sin(B/180*e),t=(a-h)/2,u=(b-i)/2,v=t*t/(c*c)+u*u/(d*d);v>1&&(v=w.sqrt(v),c=v*c,d=v*d);var x=c*c,y=d*d,A=(f==g?-1:1)*w.sqrt(z((x*y-x*u*u-y*t*t)/(x*u*u+y*t*t))),C=A*c*u/d+(a+h)/2,D=A*-d*t/c+(b+i)/2,E=w.asin(((b-D)/d).toFixed(9)),F=w.asin(((i-D)/d).toFixed(9));E=a<C?B-E:E,F=h<C?B-F:F,E<0&&(E=B*2+E),F<0&&(F=B*2+F),g&&E>F&&(E=E-B*2),!g&&F>E&&(F=F-B*2)}else E=j[0],F=j[1],C=j[2],D=j[3];var G=F-E;if(z(G)>k){var H=F,I=h,J=i;F=E+k*(g&&F>E?1:-1),h=C+c*w.cos(F),i=D+d*w.sin(F),m=bO(h,i,c,d,e,0,g,I,J,[F,H,C,D])}G=F-E;var K=w.cos(E),L=w.sin(E),M=w.cos(F),N=w.sin(F),O=w.tan(G/4),P=4/3*c*O,Q=4/3*d*O,R=[a,b],S=[a+P*L,b-Q*K],T=[h+P*N,i-Q*M],U=[h,i];S[0]=2*R[0]-S[0],S[1]=2*R[1]-S[1];if(j)return[S,T,U][n](m);m=[S,T,U][n](m).join()[s](",");var V=[];for(var W=0,X=m.length;W<X;W++)V[W]=W%2?p(m[W-1],m[W],l).y:p(m[W],m[W+1],l).x;return V},bP=function(a,b,c,d,e,f,g,h,i){var j=1-i;return{x:A(j,3)*a+A(j,2)*3*i*c+j*3*i*i*e+A(i,3)*g,y:A(j,3)*b+A(j,2)*3*i*d+j*3*i*i*f+A(i,3)*h}},bQ=bv(function(a,b,c,d,e,f,g,h){var i=e-2*c+a-(g-2*e+c),j=2*(c-a)-2*(e-c),k=a-c,l=(-j+w.sqrt(j*j-4*i*k))/2/i,n=(-j-w.sqrt(j*j-4*i*k))/2/i,o=[b,h],p=[a,g],q;z(l)>"1e12"&&(l=.5),z(n)>"1e12"&&(n=.5),l>0&&l<1&&(q=bP(a,b,c,d,e,f,g,h,l),p.push(q.x),o.push(q.y)),n>0&&n<1&&(q=bP(a,b,c,d,e,f,g,h,n),p.push(q.x),o.push(q.y)),i=f-2*d+b-(h-2*f+d),j=2*(d-b)-2*(f-d),k=b-d,l=(-j+w.sqrt(j*j-4*i*k))/2/i,n=(-j-w.sqrt(j*j-4*i*k))/2/i,z(l)>"1e12"&&(l=.5),z(n)>"1e12"&&(n=.5),l>0&&l<1&&(q=bP(a,b,c,d,e,f,g,h,l),p.push(q.x),o.push(q.y)),n>0&&n<1&&(q=bP(a,b,c,d,e,f,g,h,n),p.push(q.x),o.push(q.y));return{min:{x:y[m](0,p),y:y[m](0,o)},max:{x:x[m](0,p),y:x[m](0,o)}}}),bR=a._path2curve=bv(function(a,b){var c=!b&&bz(a);if(!b&&c.curve)return bJ(c.curve);var d=bL(a),e=b&&bL(b),f={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},g={x:0,y:0,bx:0,by:0,X:0,Y:0,qx:null,qy:null},h=function(a,b){var c,d;if(!a)return["C",b.x,b.y,b.x,b.y,b.x,b.y];!(a[0]in{T:1,Q:1})&&(b.qx=b.qy=null);switch(a[0]){case"M":b.X=a[1],b.Y=a[2];break;case"A":a=["C"][n](bO[m](0,[b.x,b.y][n](a.slice(1))));break;case"S":c=b.x+(b.x-(b.bx||b.x)),d=b.y+(b.y-(b.by||b.y)),a=["C",c,d][n](a.slice(1));break;case"T":b.qx=b.x+(b.x-(b.qx||b.x)),b.qy=b.y+(b.y-(b.qy||b.y)),a=["C"][n](bN(b.x,b.y,b.qx,b.qy,a[1],a[2]));break;case"Q":b.qx=a[1],b.qy=a[2],a=["C"][n](bN(b.x,b.y,a[1],a[2],a[3],a[4]));break;case"L":a=["C"][n](bM(b.x,b.y,a[1],a[2]));break;case"H":a=["C"][n](bM(b.x,b.y,a[1],b.y));break;case"V":a=["C"][n](bM(b.x,b.y,b.x,a[1]));break;case"Z":a=["C"][n](bM(b.x,b.y,b.X,b.Y))}return a},i=function(a,b){if(a[b].length>7){a[b].shift();var c=a[b];while(c.length)a.splice(b++,0,["C"][n](c.splice(0,6)));a.splice(b,1),l=x(d.length,e&&e.length||0)}},j=function(a,b,c,f,g){a&&b&&a[g][0]=="M"&&b[g][0]!="M"&&(b.splice(g,0,["M",f.x,f.y]),c.bx=0,c.by=0,c.x=a[g][1],c.y=a[g][2],l=x(d.length,e&&e.length||0))};for(var k=0,l=x(d.length,e&&e.length||0);k<l;k++){d[k]=h(d[k],f),i(d,k),e&&(e[k]=h(e[k],g)),e&&i(e,k),j(d,e,f,g,k),j(e,d,g,f,k);var o=d[k],p=e&&e[k],q=o.length,r=e&&p.length;f.x=o[q-2],f.y=o[q-1],f.bx=Q(o[q-4])||f.x,f.by=Q(o[q-3])||f.y,g.bx=e&&(Q(p[r-4])||g.x),g.by=e&&(Q(p[r-3])||g.y),g.x=e&&p[r-2],g.y=e&&p[r-1]}e||(c.curve=bJ(d));return e?[d,e]:d},null,bJ),bS=a._parseDots=bv(function(b){var c=[];for(var d=0,e=b.length;d<e;d++){var f={},g=b[d].match(/^([^:]*):?([\d\.]*)/);f.color=a.getRGB(g[1]);if(f.color.error)return null;f.color=f.color.hex,g[2]&&(f.offset=g[2]+"%"),c.push(f)}for(d=1,e=c.length-1;d<e;d++)if(!c[d].offset){var h=Q(c[d-1].offset||0),i=0;for(var j=d+1;j<e;j++)if(c[j].offset){i=c[j].offset;break}i||(i=100,j=e),i=Q(i);var k=(i-h)/(j-d+1);for(;d<j;d++)h+=k,c[d].offset=h+"%"}return c}),bT=a._tear=function(a,b){a==b.top&&(b.top=a.prev),a==b.bottom&&(b.bottom=a.next),a.next&&(a.next.prev=a.prev),a.prev&&(a.prev.next=a.next)},bU=a._tofront=function(a,b){b.top!==a&&(bT(a,b),a.next=null,a.prev=b.top,b.top.next=a,b.top=a)},bV=a._toback=function(a,b){b.bottom!==a&&(bT(a,b),a.next=b.bottom,a.prev=null,b.bottom.prev=a,b.bottom=a)},bW=a._insertafter=function(a,b,c){bT(a,c),b==c.top&&(c.top=a),b.next&&(b.next.prev=a),a.next=b.next,a.prev=b,b.next=a},bX=a._insertbefore=function(a,b,c){bT(a,c),b==c.bottom&&(c.bottom=a),b.prev&&(b.prev.next=a),a.prev=b.prev,b.prev=a,a.next=b},bY=a.toMatrix=function(a,b){var c=bI(a),d={_:{transform:p},getBBox:function(){return c}};b$(d,b);return d.matrix},bZ=a.transformPath=function(a,b){return bj(a,bY(a,b))},b$=a._extractTransform=function(b,c){if(c==null)return b._.transform;c=r(c).replace(/\.{3}|\u2026/g,b._.transform||p);var d=a.parseTransformString(c),e=0,f=0,g=0,h=1,i=1,j=b._,k=new cb;j.transform=d||[];if(d)for(var l=0,m=d.length;l<m;l++){var n=d[l],o=n.length,q=r(n[0]).toLowerCase(),s=n[0]!=q,t=s?k.invert():0,u,v,w,x,y;q=="t"&&o==3?s?(u=t.x(0,0),v=t.y(0,0),w=t.x(n[1],n[2]),x=t.y(n[1],n[2]),k.translate(w-u,x-v)):k.translate(n[1],n[2]):q=="r"?o==2?(y=y||b.getBBox(1),k.rotate(n[1],y.x+y.width/2,y.y+y.height/2),e+=n[1]):o==4&&(s?(w=t.x(n[2],n[3]),x=t.y(n[2],n[3]),k.rotate(n[1],w,x)):k.rotate(n[1],n[2],n[3]),e+=n[1]):q=="s"?o==2||o==3?(y=y||b.getBBox(1),k.scale(n[1],n[o-1],y.x+y.width/2,y.y+y.height/2),h*=n[1],i*=n[o-1]):o==5&&(s?(w=t.x(n[3],n[4]),x=t.y(n[3],n[4]),k.scale(n[1],n[2],w,x)):k.scale(n[1],n[2],n[3],n[4]),h*=n[1],i*=n[2]):q=="m"&&o==7&&k.add(n[1],n[2],n[3],n[4],n[5],n[6]),j.dirtyT=1,b.matrix=k}b.matrix=k,j.sx=h,j.sy=i,j.deg=e,j.dx=f=k.e,j.dy=g=k.f,h==1&&i==1&&!e&&j.bbox?(j.bbox.x+=+f,j.bbox.y+=+g):j.dirtyT=1},b_=function(a){var b=a[0];switch(b.toLowerCase()){case"t":return[b,0,0];case"m":return[b,1,0,0,1,0,0];case"r":return a.length==4?[b,0,a[2],a[3]]:[b,0];case"s":return a.length==5?[b,1,1,a[3],a[4]]:a.length==3?[b,1,1]:[b,1]}},ca=a._equaliseTransform=function(b,c){c=r(c).replace(/\.{3}|\u2026/g,b),b=a.parseTransformString(b)||[],c=a.parseTransformString(c)||[];var d=x(b.length,c.length),e=[],f=[],g=0,h,i,j,k;for(;g<d;g++){j=b[g]||b_(c[g]),k=c[g]||b_(j);if(j[0]!=k[0]||j[0].toLowerCase()=="r"&&(j[2]!=k[2]||j[3]!=k[3])||j[0].toLowerCase()=="s"&&(j[3]!=k[3]||j[4]!=k[4]))return;e[g]=[],f[g]=[];for(h=0,i=x(j.length,k.length);h<i;h++)h in j&&(e[g][h]=j[h]),h in k&&(f[g][h]=k[h])}return{from:e,to:f}};a._getContainer=function(b,c,d,e){var f;f=e==null&&!a.is(b,"object")?h.doc.getElementById(b):b;if(f!=null){if(f.tagName)return c==null?{container:f,width:f.style.pixelWidth||f.offsetWidth,height:f.style.pixelHeight||f.offsetHeight}:{container:f,width:c,height:d};return{container:1,x:b,y:c,width:d,height:e}}},a.pathToRelative=bK,a._engine={},a.path2curve=bR,a.matrix=function(a,b,c,d,e,f){return new cb(a,b,c,d,e,f)},function(b){function d(a){var b=w.sqrt(c(a));a[0]&&(a[0]/=b),a[1]&&(a[1]/=b)}function c(a){return a[0]*a[0]+a[1]*a[1]}b.add=function(a,b,c,d,e,f){var g=[[],[],[]],h=[[this.a,this.c,this.e],[this.b,this.d,this.f],[0,0,1]],i=[[a,c,e],[b,d,f],[0,0,1]],j,k,l,m;a&&a instanceof cb&&(i=[[a.a,a.c,a.e],[a.b,a.d,a.f],[0,0,1]]);for(j=0;j<3;j++)for(k=0;k<3;k++){m=0;for(l=0;l<3;l++)m+=h[j][l]*i[l][k];g[j][k]=m}this.a=g[0][0],this.b=g[1][0],this.c=g[0][1],this.d=g[1][1],this.e=g[0][2],this.f=g[1][2]},b.invert=function(){var a=this,b=a.a*a.d-a.b*a.c;return new cb(a.d/b,-a.b/b,-a.c/b,a.a/b,(a.c*a.f-a.d*a.e)/b,(a.b*a.e-a.a*a.f)/b)},b.clone=function(){return new cb(this.a,this.b,this.c,this.d,this.e,this.f)},b.translate=function(a,b){this.add(1,0,0,1,a,b)},b.scale=function(a,b,c,d){b==null&&(b=a),(c||d)&&this.add(1,0,0,1,c,d),this.add(a,0,0,b,0,0),(c||d)&&this.add(1,0,0,1,-c,-d)},b.rotate=function(b,c,d){b=a.rad(b),c=c||0,d=d||0;var e=+w.cos(b).toFixed(9),f=+w.sin(b).toFixed(9);this.add(e,f,-f,e,c,d),this.add(1,0,0,1,-c,-d)},b.x=function(a,b){return a*this.a+b*this.c+this.e},b.y=function(a,b){return a*this.b+b*this.d+this.f},b.get=function(a){return+this[r.fromCharCode(97+a)].toFixed(4)},b.toString=function(){return a.svg?"matrix("+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)].join()+")":[this.get(0),this.get(2),this.get(1),this.get(3),0,0].join()},b.toFilter=function(){return"progid:DXImageTransform.Microsoft.Matrix(M11="+this.get(0)+", M12="+this.get(2)+", M21="+this.get(1)+", M22="+this.get(3)+", Dx="+this.get(4)+", Dy="+this.get(5)+", sizingmethod='auto expand')"},b.offset=function(){return[this.e.toFixed(4),this.f.toFixed(4)]},b.split=function(){var b={};b.dx=this.e,b.dy=this.f;var e=[[this.a,this.c],[this.b,this.d]];b.scalex=w.sqrt(c(e[0])),d(e[0]),b.shear=e[0][0]*e[1][0]+e[0][1]*e[1][1],e[1]=[e[1][0]-e[0][0]*b.shear,e[1][1]-e[0][1]*b.shear],b.scaley=w.sqrt(c(e[1])),d(e[1]),b.shear/=b.scaley;var f=-e[0][1],g=e[1][1];g<0?(b.rotate=a.deg(w.acos(g)),f<0&&(b.rotate=360-b.rotate)):b.rotate=a.deg(w.asin(f)),b.isSimple=!+b.shear.toFixed(9)&&(b.scalex.toFixed(9)==b.scaley.toFixed(9)||!b.rotate),b.isSuperSimple=!+b.shear.toFixed(9)&&b.scalex.toFixed(9)==b.scaley.toFixed(9)&&!b.rotate,b.noRotation=!+b.shear.toFixed(9)&&!b.rotate;return b},b.toTransformString=function(a){var b=a||this[s]();if(b.isSimple){b.scalex=+b.scalex.toFixed(4),b.scaley=+b.scaley.toFixed(4),b.rotate=+b.rotate.toFixed(4);return(b.dx||b.dy?"t"+[b.dx,b.dy]:p)+(b.scalex!=1||b.scaley!=1?"s"+[b.scalex,b.scaley,0,0]:p)+(b.rotate?"r"+[b.rotate,0,0]:p)}return"m"+[this.get(0),this.get(1),this.get(2),this.get(3),this.get(4),this.get(5)]}}(cb.prototype);var cc=navigator.userAgent.match(/Version\/(.*?)\s/)||navigator.userAgent.match(/Chrome\/(\d+)/);navigator.vendor=="Apple Computer, Inc."&&(cc&&cc[1]<4||navigator.platform.slice(0,2)=="iP")||navigator.vendor=="Google Inc."&&cc&&cc[1]<8?k.safari=function(){var a=this.rect(-99,-99,this.width+99,this.height+99).attr({stroke:"none"});setTimeout(function(){a.remove()})}:k.safari=be;var cd=function(){this.returnValue=!1},ce=function(){return this.originalEvent.preventDefault()},cf=function(){this.cancelBubble=!0},cg=function(){return this.originalEvent.stopPropagation()},ch=function(){if(h.doc.addEventListener)return function(a,b,c,d){var e=o&&u[b]?u[b]:b,f=function(e){var f=h.doc.documentElement.scrollTop||h.doc.body.scrollTop,i=h.doc.documentElement.scrollLeft||h.doc.body.scrollLeft,j=e.clientX+i,k=e.clientY+f;if(o&&u[g](b))for(var l=0,m=e.targetTouches&&e.targetTouches.length;l<m;l++)if(e.targetTouches[l].target==a){var n=e;e=e.targetTouches[l],e.originalEvent=n,e.preventDefault=ce,e.stopPropagation=cg;break}return c.call(d,e,j,k)};a.addEventListener(e,f,!1);return function(){a.removeEventListener(e,f,!1);return!0}};if(h.doc.attachEvent)return function(a,b,c,d){var e=function(a){a=a||h.win.event;var b=h.doc.documentElement.scrollTop||h.doc.body.scrollTop,e=h.doc.documentElement.scrollLeft||h.doc.body.scrollLeft,f=a.clientX+e,g=a.clientY+b;a.preventDefault=a.preventDefault||cd,a.stopPropagation=a.stopPropagation||cf;return c.call(d,a,f,g)};a.attachEvent("on"+b,e);var f=function(){a.detachEvent("on"+b,e);return!0};return f}}(),ci=[],cj=function(a){var b=a.clientX,c=a.clientY,d=h.doc.documentElement.scrollTop||h.doc.body.scrollTop,e=h.doc.documentElement.scrollLeft||h.doc.body.scrollLeft,f,g=ci.length;while(g--){f=ci[g];if(o){var i=a.touches.length,j;while(i--){j=a.touches[i];if(j.identifier==f.el._drag.id){b=j.clientX,c=j.clientY,(a.originalEvent?a.originalEvent:a).preventDefault();break}}}else a.preventDefault();var k=f.el.node,l,m=k.nextSibling,n=k.parentNode,p=k.style.display;h.win.opera&&n.removeChild(k),k.style.display="none",l=f.el.paper.getElementByPoint(b,c),k.style.display=p,h.win.opera&&(m?n.insertBefore(k,m):n.appendChild(k)),l&&eve("raphael.drag.over."+f.el.id,f.el,l),b+=e,c+=d,eve("raphael.drag.move."+f.el.id,f.move_scope||f.el,b-f.el._drag.x,c-f.el._drag.y,b,c,a)}},ck=function(b){a.unmousemove(cj).unmouseup(ck);var c=ci.length,d;while(c--)d=ci[c],d.el._drag={},eve("raphael.drag.end."+d.el.id,d.end_scope||d.start_scope||d.move_scope||d.el,b);ci=[]},cl=a.el={};for(var cm=t.length;cm--;)(function(b){a[b]=cl[b]=function(c,d){a.is(c,"function")&&(this.events=this.events||[],this.events.push({name:b,f:c,unbind:ch(this.shape||this.node||h.doc,b,c,d||this)}));return this},a["un"+b]=cl["un"+b]=function(a){var c=this.events||[],d=c.length;while(d--)if(c[d].name==b&&c[d].f==a){c[d].unbind(),c.splice(d,1),!c.length&&delete this.events;return this}return this}})(t[cm]);cl.data=function(b,c){var d=bb[this.id]=bb[this.id]||{};if(arguments.length==1){if(a.is(b,"object")){for(var e in b)b[g](e)&&this.data(e,b[e]);return this}eve("raphael.data.get."+this.id,this,d[b],b);return d[b]}d[b]=c,eve("raphael.data.set."+this.id,this,c,b);return this},cl.removeData=function(a){a==null?bb[this.id]={}:bb[this.id]&&delete bb[this.id][a];return this},cl.hover=function(a,b,c,d){return this.mouseover(a,c).mouseout(b,d||c)},cl.unhover=function(a,b){return this.unmouseover(a).unmouseout(b)};var cn=[];cl.drag=function(b,c,d,e,f,g){function i(i){(i.originalEvent||i).preventDefault();var j=h.doc.documentElement.scrollTop||h.doc.body.scrollTop,k=h.doc.documentElement.scrollLeft||h.doc.body.scrollLeft;this._drag.x=i.clientX+k,this._drag.y=i.clientY+j,this._drag.id=i.identifier,!ci.length&&a.mousemove(cj).mouseup(ck),ci.push({el:this,move_scope:e,start_scope:f,end_scope:g}),c&&eve.on("raphael.drag.start."+this.id,c),b&&eve.on("raphael.drag.move."+this.id,b),d&&eve.on("raphael.drag.end."+this.id,d),eve("raphael.drag.start."+this.id,f||e||this,i.clientX+k,i.clientY+j,i)}this._drag={},cn.push({el:this,start:i}),this.mousedown(i);return this},cl.onDragOver=function(a){a?eve.on("raphael.drag.over."+this.id,a):eve.unbind("raphael.drag.over."+this.id)},cl.undrag=function(){var b=cn.length;while(b--)cn[b].el==this&&(this.unmousedown(cn[b].start),cn.splice(b,1),eve.unbind("raphael.drag.*."+this.id));!cn.length&&a.unmousemove(cj).unmouseup(ck)},k.circle=function(b,c,d){var e=a._engine.circle(this,b||0,c||0,d||0);this.__set__&&this.__set__.push(e);return e},k.rect=function(b,c,d,e,f){var g=a._engine.rect(this,b||0,c||0,d||0,e||0,f||0);this.__set__&&this.__set__.push(g);return g},k.ellipse=function(b,c,d,e){var f=a._engine.ellipse(this,b||0,c||0,d||0,e||0);this.__set__&&this.__set__.push(f);return f},k.path=function(b){b&&!a.is(b,D)&&!a.is(b[0],E)&&(b+=p);var c=a._engine.path(a.format[m](a,arguments),this);this.__set__&&this.__set__.push(c);return c},k.image=function(b,c,d,e,f){var g=a._engine.image(this,b||"about:blank",c||0,d||0,e||0,f||0);this.__set__&&this.__set__.push(g);return g},k.text=function(b,c,d){var e=a._engine.text(this,b||0,c||0,r(d));this.__set__&&this.__set__.push(e);return e},k.set=function(b){!a.is(b,"array")&&(b=Array.prototype.splice.call(arguments,0,arguments.length));var c=new cG(b);this.__set__&&this.__set__.push(c);return c},k.setStart=function(a){this.__set__=a||this.set()},k.setFinish=function(a){var b=this.__set__;delete this.__set__;return b},k.setSize=function(b,c){return a._engine.setSize.call(this,b,c)},k.setViewBox=function(b,c,d,e,f){return a._engine.setViewBox.call(this,b,c,d,e,f)},k.top=k.bottom=null,k.raphael=a;var co=function(a){var b=a.getBoundingClientRect(),c=a.ownerDocument,d=c.body,e=c.documentElement,f=e.clientTop||d.clientTop||0,g=e.clientLeft||d.clientLeft||0,i=b.top+(h.win.pageYOffset||e.scrollTop||d.scrollTop)-f,j=b.left+(h.win.pageXOffset||e.scrollLeft||d.scrollLeft)-g;return{y:i,x:j}};k.getElementByPoint=function(a,b){var c=this,d=c.canvas,e=h.doc.elementFromPoint(a,b);if(h.win.opera&&e.tagName=="svg"){var f=co(d),g=d.createSVGRect();g.x=a-f.x,g.y=b-f.y,g.width=g.height=1;var i=d.getIntersectionList(g,null);i.length&&(e=i[i.length-1])}if(!e)return null;while(e.parentNode&&e!=d.parentNode&&!e.raphael)e=e.parentNode;e==c.canvas.parentNode&&(e=d),e=e&&e.raphael?c.getById(e.raphaelid):null;return e},k.getById=function(a){var b=this.bottom;while(b){if(b.id==a)return b;b=b.next}return null},k.forEach=function(a,b){var c=this.bottom;while(c){if(a.call(b,c)===!1)return this;c=c.next}return this},k.getElementsByPoint=function(a,b){var c=this.set();this.forEach(function(d){d.isPointInside(a,b)&&c.push(d)});return c},cl.isPointInside=function(b,c){var d=this.realPath=this.realPath||bi[this.type](this);return a.isPointInsidePath(d,b,c)},cl.getBBox=function(a){if(this.removed)return{};var b=this._;if(a){if(b.dirty||!b.bboxwt)this.realPath=bi[this.type](this),b.bboxwt=bI(this.realPath),b.bboxwt.toString=cq,b.dirty=0;return b.bboxwt}if(b.dirty||b.dirtyT||!b.bbox){if(b.dirty||!this.realPath)b.bboxwt=0,this.realPath=bi[this.type](this);b.bbox=bI(bj(this.realPath,this.matrix)),b.bbox.toString=cq,b.dirty=b.dirtyT=0}return b.bbox},cl.clone=function(){if(this.removed)return null;var a=this.paper[this.type]().attr(this.attr());this.__set__&&this.__set__.push(a);return a},cl.glow=function(a){if(this.type=="text")return null;a=a||{};var b={width:(a.width||10)+(+this.attr("stroke-width")||1),fill:a.fill||!1,opacity:a.opacity||.5,offsetx:a.offsetx||0,offsety:a.offsety||0,color:a.color||"#000"},c=b.width/2,d=this.paper,e=d.set(),f=this.realPath||bi[this.type](this);f=this.matrix?bj(f,this.matrix):f;for(var g=1;g<c+1;g++)e.push(d.path(f).attr({stroke:b.color,fill:b.fill?b.color:"none","stroke-linejoin":"round","stroke-linecap":"round","stroke-width":+(b.width/c*g).toFixed(3),opacity:+(b.opacity/c).toFixed(3)}));return e.insertBefore(this).translate(b.offsetx,b.offsety)};var cr={},cs=function(b,c,d,e,f,g,h,i,j){return j==null?bB(b,c,d,e,f,g,h,i):a.findDotsAtSegment(b,c,d,e,f,g,h,i,bC(b,c,d,e,f,g,h,i,j))},ct=function(b,c){return function(d,e,f){d=bR(d);var g,h,i,j,k="",l={},m,n=0;for(var o=0,p=d.length;o<p;o++){i=d[o];if(i[0]=="M")g=+i[1],h=+i[2];else{j=cs(g,h,i[1],i[2],i[3],i[4],i[5],i[6]);if(n+j>e){if(c&&!l.start){m=cs(g,h,i[1],i[2],i[3],i[4],i[5],i[6],e-n),k+=["C"+m.start.x,m.start.y,m.m.x,m.m.y,m.x,m.y];if(f)return k;l.start=k,k=["M"+m.x,m.y+"C"+m.n.x,m.n.y,m.end.x,m.end.y,i[5],i[6]].join(),n+=j,g=+i[5],h=+i[6];continue}if(!b&&!c){m=cs(g,h,i[1],i[2],i[3],i[4],i[5],i[6],e-n);return{x:m.x,y:m.y,alpha:m.alpha}}}n+=j,g=+i[5],h=+i[6]}k+=i.shift()+i}l.end=k,m=b?n:c?l:a.findDotsAtSegment(g,h,i[0],i[1],i[2],i[3],i[4],i[5],1),m.alpha&&(m={x:m.x,y:m.y,alpha:m.alpha});return m}},cu=ct(1),cv=ct(),cw=ct(0,1);a.getTotalLength=cu,a.getPointAtLength=cv,a.getSubpath=function(a,b,c){if(this.getTotalLength(a)-c<1e-6)return cw(a,b).end;var d=cw(a,c,1);return b?cw(d,b).end:d},cl.getTotalLength=function(){if(this.type=="path"){if(this.node.getTotalLength)return this.node.getTotalLength();return cu(this.attrs.path)}},cl.getPointAtLength=function(a){if(this.type=="path")return cv(this.attrs.path,a)},cl.getSubpath=function(b,c){if(this.type=="path")return a.getSubpath(this.attrs.path,b,c)};var cx=a.easing_formulas={linear:function(a){return a},"<":function(a){return A(a,1.7)},">":function(a){return A(a,.48)},"<>":function(a){var b=.48-a/1.04,c=w.sqrt(.1734+b*b),d=c-b,e=A(z(d),1/3)*(d<0?-1:1),f=-c-b,g=A(z(f),1/3)*(f<0?-1:1),h=e+g+.5;return(1-h)*3*h*h+h*h*h},backIn:function(a){var b=1.70158;return a*a*((b+1)*a-b)},backOut:function(a){a=a-1;var b=1.70158;return a*a*((b+1)*a+b)+1},elastic:function(a){if(a==!!a)return a;return A(2,-10*a)*w.sin((a-.075)*2*B/.3)+1},bounce:function(a){var b=7.5625,c=2.75,d;a<1/c?d=b*a*a:a<2/c?(a-=1.5/c,d=b*a*a+.75):a<2.5/c?(a-=2.25/c,d=b*a*a+.9375):(a-=2.625/c,d=b*a*a+.984375);return d}};cx.easeIn=cx["ease-in"]=cx["<"],cx.easeOut=cx["ease-out"]=cx[">"],cx.easeInOut=cx["ease-in-out"]=cx["<>"],cx["back-in"]=cx.backIn,cx["back-out"]=cx.backOut;var cy=[],cz=window.requestAnimationFrame||window.webkitRequestAnimationFrame||window.mozRequestAnimationFrame||window.oRequestAnimationFrame||window.msRequestAnimationFrame||function(a){setTimeout(a,16)},cA=function(){var b=+(new Date),c=0;for(;c<cy.length;c++){var d=cy[c];if(d.el.removed||d.paused)continue;var e=b-d.start,f=d.ms,h=d.easing,i=d.from,j=d.diff,k=d.to,l=d.t,m=d.el,o={},p,r={},s;d.initstatus?(e=(d.initstatus*d.anim.top-d.prev)/(d.percent-d.prev)*f,d.status=d.initstatus,delete d.initstatus,d.stop&&cy.splice(c--,1)):d.status=(d.prev+(d.percent-d.prev)*(e/f))/d.anim.top;if(e<0)continue;if(e<f){var t=h(e/f);for(var u in i)if(i[g](u)){switch(U[u]){case C:p=+i[u]+t*f*j[u];break;case"colour":p="rgb("+[cB(O(i[u].r+t*f*j[u].r)),cB(O(i[u].g+t*f*j[u].g)),cB(O(i[u].b+t*f*j[u].b))].join(",")+")";break;case"path":p=[];for(var v=0,w=i[u].length;v<w;v++){p[v]=[i[u][v][0]];for(var x=1,y=i[u][v].length;x<y;x++)p[v][x]=+i[u][v][x]+t*f*j[u][v][x];p[v]=p[v].join(q)}p=p.join(q);break;case"transform":if(j[u].real){p=[];for(v=0,w=i[u].length;v<w;v++){p[v]=[i[u][v][0]];for(x=1,y=i[u][v].length;x<y;x++)p[v][x]=i[u][v][x]+t*f*j[u][v][x]}}else{var z=function(a){return+i[u][a]+t*f*j[u][a]};p=[["m",z(0),z(1),z(2),z(3),z(4),z(5)]]}break;case"csv":if(u=="clip-rect"){p=[],v=4;while(v--)p[v]=+i[u][v]+t*f*j[u][v]}break;default:var A=[][n](i[u]);p=[],v=m.paper.customAttributes[u].length;while(v--)p[v]=+A[v]+t*f*j[u][v]}o[u]=p}m.attr(o),function(a,b,c){setTimeout(function(){eve("raphael.anim.frame."+a,b,c)})}(m.id,m,d.anim)}else{(function(b,c,d){setTimeout(function(){eve("raphael.anim.frame."+c.id,c,d),eve("raphael.anim.finish."+c.id,c,d),a.is(b,"function")&&b.call(c)})})(d.callback,m,d.anim),m.attr(k),cy.splice(c--,1);if(d.repeat>1&&!d.next){for(s in k)k[g](s)&&(r[s]=d.totalOrigin[s]);d.el.attr(r),cE(d.anim,d.el,d.anim.percents[0],null,d.totalOrigin,d.repeat-1)}d.next&&!d.stop&&cE(d.anim,d.el,d.next,null,d.totalOrigin,d.repeat)}}a.svg&&m&&m.paper&&m.paper.safari(),cy.length&&cz(cA)},cB=function(a){return a>255?255:a<0?0:a};cl.animateWith=function(b,c,d,e,f,g){var h=this;if(h.removed){g&&g.call(h);return h}var i=d instanceof cD?d:a.animation(d,e,f,g),j,k;cE(i,h,i.percents[0],null,h.attr());for(var l=0,m=cy.length;l<m;l++)if(cy[l].anim==c&&cy[l].el==b){cy[m-1].start=cy[l].start;break}return h},cl.onAnimation=function(a){a?eve.on("raphael.anim.frame."+this.id,a):eve.unbind("raphael.anim.frame."+this.id);return this},cD.prototype.delay=function(a){var b=new cD(this.anim,this.ms);b.times=this.times,b.del=+a||0;return b},cD.prototype.repeat=function(a){var b=new cD(this.anim,this.ms);b.del=this.del,b.times=w.floor(x(a,0))||1;return b},a.animation=function(b,c,d,e){if(b instanceof cD)return b;if(a.is(d,"function")||!d)e=e||d||null,d=null;b=Object(b),c=+c||0;var f={},h,i;for(i in b)b[g](i)&&Q(i)!=i&&Q(i)+"%"!=i&&(h=!0,f[i]=b[i]);if(!h)return new cD(b,c);d&&(f.easing=d),e&&(f.callback=e);return new cD({100:f},c)},cl.animate=function(b,c,d,e){var f=this;if(f.removed){e&&e.call(f);return f}var g=b instanceof cD?b:a.animation(b,c,d,e);cE(g,f,g.percents[0],null,f.attr());return f},cl.setTime=function(a,b){a&&b!=null&&this.status(a,y(b,a.ms)/a.ms);return this},cl.status=function(a,b){var c=[],d=0,e,f;if(b!=null){cE(a,this,-1,y(b,1));return this}e=cy.length;for(;d<e;d++){f=cy[d];if(f.el.id==this.id&&(!a||f.anim==a)){if(a)return f.status;c.push({anim:f.anim,status:f.status})}}if(a)return 0;return c},cl.pause=function(a){for(var b=0;b<cy.length;b++)cy[b].el.id==this.id&&(!a||cy[b].anim==a)&&eve("raphael.anim.pause."+this.id,this,cy[b].anim)!==!1&&(cy[b].paused=!0);return this},cl.resume=function(a){for(var b=0;b<cy.length;b++)if(cy[b].el.id==this.id&&(!a||cy[b].anim==a)){var c=cy[b];eve("raphael.anim.resume."+this.id,this,c.anim)!==!1&&(delete c.paused,this.status(c.anim,c.status))}return this},cl.stop=function(a){for(var b=0;b<cy.length;b++)cy[b].el.id==this.id&&(!a||cy[b].anim==a)&&eve("raphael.anim.stop."+this.id,this,cy[b].anim)!==!1&&cy.splice(b--,1);return this},eve.on("raphael.remove",cF),eve.on("raphael.clear",cF),cl.toString=function(){return"Raphaël’s object"};var cG=function(a){this.items=[],this.length=0,this.type="set";if(a)for(var b=0,c=a.length;b<c;b++)a[b]&&(a[b].constructor==cl.constructor||a[b].constructor==cG)&&(this[this.items.length]=this.items[this.items.length]=a[b],this.length++)},cH=cG.prototype;cH.push=function(){var a,b;for(var c=0,d=arguments.length;c<d;c++)a=arguments[c],a&&(a.constructor==cl.constructor||a.constructor==cG)&&(b=this.items.length,this[b]=this.items[b]=a,this.length++);return this},cH.pop=function(){this.length&&delete this[this.length--];return this.items.pop()},cH.forEach=function(a,b){for(var c=0,d=this.items.length;c<d;c++)if(a.call(b,this.items[c],c)===!1)return this;return this};for(var cI in cl)cl[g](cI)&&(cH[cI]=function(a){return function(){var b=arguments;return this.forEach(function(c){c[a][m](c,b)})}}(cI));cH.attr=function(b,c){if(b&&a.is(b,E)&&a.is(b[0],"object"))for(var d=0,e=b.length;d<e;d++)this.items[d].attr(b[d]);else for(var f=0,g=this.items.length;f<g;f++)this.items[f].attr(b,c);return this},cH.clear=function(){while(this.length)this.pop()},cH.splice=function(a,b,c){a=a<0?x(this.length+a,0):a,b=x(0,y(this.length-a,b));var d=[],e=[],f=[],g;for(g=2;g<arguments.length;g++)f.push(arguments[g]);for(g=0;g<b;g++)e.push(this[a+g]);for(;g<this.length-a;g++)d.push(this[a+g]);var h=f.length;for(g=0;g<h+d.length;g++)this.items[a+g]=this[a+g]=g<h?f[g]:d[g-h];g=this.items.length=this.length-=b-h;while(this[g])delete this[g++];return new cG(e)},cH.exclude=function(a){for(var b=0,c=this.length;b<c;b++)if(this[b]==a){this.splice(b,1);return!0}},cH.animate=function(b,c,d,e){(a.is(d,"function")||!d)&&(e=d||null);var f=this.items.length,g=f,h,i=this,j;if(!f)return this;e&&(j=function(){!--f&&e.call(i)}),d=a.is(d,D)?d:j;var k=a.animation(b,c,d,j);h=this.items[--g].animate(k);while(g--)this.items[g]&&!this.items[g].removed&&this.items[g].animateWith(h,k,k);return this},cH.insertAfter=function(a){var b=this.items.length;while(b--)this.items[b].insertAfter(a);return this},cH.getBBox=function(){var a=[],b=[],c=[],d=[];for(var e=this.items.length;e--;)if(!this.items[e].removed){var f=this.items[e].getBBox();a.push(f.x),b.push(f.y),c.push(f.x+f.width),d.push(f.y+f.height)}a=y[m](0,a),b=y[m](0,b),c=x[m](0,c),d=x[m](0,d);return{x:a,y:b,x2:c,y2:d,width:c-a,height:d-b}},cH.clone=function(a){a=new cG;for(var b=0,c=this.items.length;b<c;b++)a.push(this.items[b].clone());return a},cH.toString=function(){return"Raphaël‘s set"},a.registerFont=function(a){if(!a.face)return a;this.fonts=this.fonts||{};var b={w:a.w,face:{},glyphs:{}},c=a.face["font-family"];for(var d in a.face)a.face[g](d)&&(b.face[d]=a.face[d]);this.fonts[c]?this.fonts[c].push(b):this.fonts[c]=[b];if(!a.svg){b.face["units-per-em"]=R(a.face["units-per-em"],10);for(var e in a.glyphs)if(a.glyphs[g](e)){var f=a.glyphs[e];b.glyphs[e]={w:f.w,k:{},d:f.d&&"M"+f.d.replace(/[mlcxtrv]/g,function(a){return{l:"L",c:"C",x:"z",t:"m",r:"l",v:"c"}[a]||"M"})+"z"};if(f.k)for(var h in f.k)f[g](h)&&(b.glyphs[e].k[h]=f.k[h])}}return a},k.getFont=function(b,c,d,e){e=e||"normal",d=d||"normal",c=+c||{normal:400,bold:700,lighter:300,bolder:800}[c]||400;if(!!a.fonts){var f=a.fonts[b];if(!f){var h=new RegExp("(^|\\s)"+b.replace(/[^\w\d\s+!~.:_-]/g,p)+"(\\s|$)","i");for(var i in a.fonts)if(a.fonts[g](i)&&h.test(i)){f=a.fonts[i];break}}var j;if(f)for(var k=0,l=f.length;k<l;k++){j=f[k];if(j.face["font-weight"]==c&&(j.face["font-style"]==d||!j.face["font-style"])&&j.face["font-stretch"]==e)break}return j}},k.print=function(b,d,e,f,g,h,i){h=h||"middle",i=x(y(i||0,1),-1);var j=r(e)[s](p),k=0,l=0,m=p,n;a.is(f,e)&&(f=this.getFont(f));if(f){n=(g||16)/f.face["units-per-em"];var o=f.face.bbox[s](c),q=+o[0],t=o[3]-o[1],u=0,v=+o[1]+(h=="baseline"?t+ +f.face.descent:t/2);for(var w=0,z=j.length;w<z;w++){if(j[w]=="\n")k=0,B=0,l=0,u+=t;else{var A=l&&f.glyphs[j[w-1]]||{},B=f.glyphs[j[w]];k+=l?(A.w||f.w)+(A.k&&A.k[j[w]]||0)+f.w*i:0,l=1}B&&B.d&&(m+=a.transformPath(B.d,["t",k*n,u*n,"s",n,n,q,v,"t",(b-q)/n,(d-v)/n]))}}return this.path(m).attr({fill:"#000",stroke:"none"})},k.add=function(b){if(a.is(b,"array")){var c=this.set(),e=0,f=b.length,h;for(;e<f;e++)h=b[e]||{},d[g](h.type)&&c.push(this[h.type]().attr(h))}return c},a.format=function(b,c){var d=a.is(c,E)?[0][n](c):arguments;b&&a.is(b,D)&&d.length-1&&(b=b.replace(e,function(a,b){return d[++b]==null?p:d[b]}));return b||p},a.fullfill=function(){var a=/\{([^\}]+)\}/g,b=/(?:(?:^|\.)(.+?)(?=\[|\.|$|\()|\[('|")(.+?)\2\])(\(\))?/g,c=function(a,c,d){var e=d;c.replace(b,function(a,b,c,d,f){b=b||d,e&&(b in e&&(e=e[b]),typeof e=="function"&&f&&(e=e()))}),e=(e==null||e==d?a:e)+"";return e};return function(b,d){return String(b).replace(a,function(a,b){return c(a,b,d)})}}(),a.ninja=function(){i.was?h.win.Raphael=i.is:delete Raphael;return a},a.st=cH,function(b,c,d){function e(){/in/.test(b.readyState)?setTimeout(e,9):a.eve("raphael.DOMload")}b.readyState==null&&b.addEventListener&&(b.addEventListener(c,d=function(){b.removeEventListener(c,d,!1),b.readyState="complete"},!1),b.readyState="loading"),e()}(document,"DOMContentLoaded"),i.was?h.win.Raphael=a:Raphael=a,eve.on("raphael.DOMload",function(){b=!0})}(),window.Raphael.svg&&function(a){var b="hasOwnProperty",c=String,d=parseFloat,e=parseInt,f=Math,g=f.max,h=f.abs,i=f.pow,j=/[, ]+/,k=a.eve,l="",m=" ",n="http://www.w3.org/1999/xlink",o={block:"M5,0 0,2.5 5,5z",classic:"M5,0 0,2.5 5,5 3.5,3 3.5,2z",diamond:"M2.5,0 5,2.5 2.5,5 0,2.5z",open:"M6,1 1,3.5 6,6",oval:"M2.5,0A2.5,2.5,0,0,1,2.5,5 2.5,2.5,0,0,1,2.5,0z"},p={};a.toString=function(){return"Your browser supports SVG.\nYou are running Raphaël "+this.version};var q=function(d,e){if(e){typeof d=="string"&&(d=q(d));for(var f in e)e[b](f)&&(f.substring(0,6)=="xlink:"?d.setAttributeNS(n,f.substring(6),c(e[f])):d.setAttribute(f,c(e[f])))}else d=a._g.doc.createElementNS("http://www.w3.org/2000/svg",d),d.style&&(d.style.webkitTapHighlightColor="rgba(0,0,0,0)");return d},r=function(b,e){var j="linear",k=b.id+e,m=.5,n=.5,o=b.node,p=b.paper,r=o.style,s=a._g.doc.getElementById(k);if(!s){e=c(e).replace(a._radial_gradient,function(a,b,c){j="radial";if(b&&c){m=d(b),n=d(c);var e=(n>.5)*2-1;i(m-.5,2)+i(n-.5,2)>.25&&(n=f.sqrt(.25-i(m-.5,2))*e+.5)&&n!=.5&&(n=n.toFixed(5)-1e-5*e)}return l}),e=e.split(/\s*\-\s*/);if(j=="linear"){var t=e.shift();t=-d(t);if(isNaN(t))return null;var u=[0,0,f.cos(a.rad(t)),f.sin(a.rad(t))],v=1/(g(h(u[2]),h(u[3]))||1);u[2]*=v,u[3]*=v,u[2]<0&&(u[0]=-u[2],u[2]=0),u[3]<0&&(u[1]=-u[3],u[3]=0)}var w=a._parseDots(e);if(!w)return null;k=k.replace(/[\(\)\s,\xb0#]/g,"_"),b.gradient&&k!=b.gradient.id&&(p.defs.removeChild(b.gradient),delete b.gradient);if(!b.gradient){s=q(j+"Gradient",{id:k}),b.gradient=s,q(s,j=="radial"?{fx:m,fy:n}:{x1:u[0],y1:u[1],x2:u[2],y2:u[3],gradientTransform:b.matrix.invert()}),p.defs.appendChild(s);for(var x=0,y=w.length;x<y;x++)s.appendChild(q("stop",{offset:w[x].offset?w[x].offset:x?"100%":"0%","stop-color":w[x].color||"#fff"}))}}q(o,{fill:"url(#"+k+")",opacity:1,"fill-opacity":1}),r.fill=l,r.opacity=1,r.fillOpacity=1;return 1},s=function(a){var b=a.getBBox(1);q(a.pattern,{patternTransform:a.matrix.invert()+" translate("+b.x+","+b.y+")"})},t=function(d,e,f){if(d.type=="path"){var g=c(e).toLowerCase().split("-"),h=d.paper,i=f?"end":"start",j=d.node,k=d.attrs,m=k["stroke-width"],n=g.length,r="classic",s,t,u,v,w,x=3,y=3,z=5;while(n--)switch(g[n]){case"block":case"classic":case"oval":case"diamond":case"open":case"none":r=g[n];break;case"wide":y=5;break;case"narrow":y=2;break;case"long":x=5;break;case"short":x=2}r=="open"?(x+=2,y+=2,z+=2,u=1,v=f?4:1,w={fill:"none",stroke:k.stroke}):(v=u=x/2,w={fill:k.stroke,stroke:"none"}),d._.arrows?f?(d._.arrows.endPath&&p[d._.arrows.endPath]--,d._.arrows.endMarker&&p[d._.arrows.endMarker]--):(d._.arrows.startPath&&p[d._.arrows.startPath]--,d._.arrows.startMarker&&p[d._.arrows.startMarker]--):d._.arrows={};if(r!="none"){var A="raphael-marker-"+r,B="raphael-marker-"+i+r+x+y;a._g.doc.getElementById(A)?p[A]++:(h.defs.appendChild(q(q("path"),{"stroke-linecap":"round",d:o[r],id:A})),p[A]=1);var C=a._g.doc.getElementById(B),D;C?(p[B]++,D=C.getElementsByTagName("use")[0]):(C=q(q("marker"),{id:B,markerHeight:y,markerWidth:x,orient:"auto",refX:v,refY:y/2}),D=q(q("use"),{"xlink:href":"#"+A,transform:(f?"rotate(180 "+x/2+" "+y/2+") ":l)+"scale("+x/z+","+y/z+")","stroke-width":(1/((x/z+y/z)/2)).toFixed(4)}),C.appendChild(D),h.defs.appendChild(C),p[B]=1),q(D,w);var F=u*(r!="diamond"&&r!="oval");f?(s=d._.arrows.startdx*m||0,t=a.getTotalLength(k.path)-F*m):(s=F*m,t=a.getTotalLength(k.path)-(d._.arrows.enddx*m||0)),w={},w["marker-"+i]="url(#"+B+")";if(t||s)w.d=Raphael.getSubpath(k.path,s,t);q(j,w),d._.arrows[i+"Path"]=A,d._.arrows[i+"Marker"]=B,d._.arrows[i+"dx"]=F,d._.arrows[i+"Type"]=r,d._.arrows[i+"String"]=e}else f?(s=d._.arrows.startdx*m||0,t=a.getTotalLength(k.path)-s):(s=0,t=a.getTotalLength(k.path)-(d._.arrows.enddx*m||0)),d._.arrows[i+"Path"]&&q(j,{d:Raphael.getSubpath(k.path,s,t)}),delete d._.arrows[i+"Path"],delete d._.arrows[i+"Marker"],delete d._.arrows[i+"dx"],delete d._.arrows[i+"Type"],delete d._.arrows[i+"String"];for(w in p)if(p[b](w)&&!p[w]){var G=a._g.doc.getElementById(w);G&&G.parentNode.removeChild(G)}}},u={"":[0],none:[0],"-":[3,1],".":[1,1],"-.":[3,1,1,1],"-..":[3,1,1,1,1,1],". ":[1,3],"- ":[4,3],"--":[8,3],"- .":[4,3,1,3],"--.":[8,3,1,3],"--..":[8,3,1,3,1,3]},v=function(a,b,d){b=u[c(b).toLowerCase()];if(b){var e=a.attrs["stroke-width"]||"1",f={round:e,square:e,butt:0}[a.attrs["stroke-linecap"]||d["stroke-linecap"]]||0,g=[],h=b.length;while(h--)g[h]=b[h]*e+(h%2?1:-1)*f;q(a.node,{"stroke-dasharray":g.join(",")})}},w=function(d,f){var i=d.node,k=d.attrs,m=i.style.visibility;i.style.visibility="hidden";for(var o in f)if(f[b](o)){if(!a._availableAttrs[b](o))continue;var p=f[o];k[o]=p;switch(o){case"blur":d.blur(p);break;case"href":case"title":case"target":var u=i.parentNode;if(u.tagName.toLowerCase()!="a"){var w=q("a");u.insertBefore(w,i),w.appendChild(i),u=w}o=="target"?u.setAttributeNS(n,"show",p=="blank"?"new":p):u.setAttributeNS(n,o,p);break;case"cursor":i.style.cursor=p;break;case"transform":d.transform(p);break;case"arrow-start":t(d,p);break;case"arrow-end":t(d,p,1);break;case"clip-rect":var x=c(p).split(j);if(x.length==4){d.clip&&d.clip.parentNode.parentNode.removeChild(d.clip.parentNode);var z=q("clipPath"),A=q("rect");z.id=a.createUUID(),q(A,{x:x[0],y:x[1],width:x[2],height:x[3]}),z.appendChild(A),d.paper.defs.appendChild(z),q(i,{"clip-path":"url(#"+z.id+")"}),d.clip=A}if(!p){var B=i.getAttribute("clip-path");if(B){var C=a._g.doc.getElementById(B.replace(/(^url\(#|\)$)/g,l));C&&C.parentNode.removeChild(C),q(i,{"clip-path":l}),delete d.clip}}break;case"path":d.type=="path"&&(q(i,{d:p?k.path=a._pathToAbsolute(p):"M0,0"}),d._.dirty=1,d._.arrows&&("startString"in d._.arrows&&t(d,d._.arrows.startString),"endString"in d._.arrows&&t(d,d._.arrows.endString,1)));break;case"width":i.setAttribute(o,p),d._.dirty=1;if(k.fx)o="x",p=k.x;else break;case"x":k.fx&&(p=-k.x-(k.width||0));case"rx":if(o=="rx"&&d.type=="rect")break;case"cx":i.setAttribute(o,p),d.pattern&&s(d),d._.dirty=1;break;case"height":i.setAttribute(o,p),d._.dirty=1;if(k.fy)o="y",p=k.y;else break;case"y":k.fy&&(p=-k.y-(k.height||0));case"ry":if(o=="ry"&&d.type=="rect")break;case"cy":i.setAttribute(o,p),d.pattern&&s(d),d._.dirty=1;break;case"r":d.type=="rect"?q(i,{rx:p,ry:p}):i.setAttribute(o,p),d._.dirty=1;break;case"src":d.type=="image"&&i.setAttributeNS(n,"href",p);break;case"stroke-width":if(d._.sx!=1||d._.sy!=1)p/=g(h(d._.sx),h(d._.sy))||1;d.paper._vbSize&&(p*=d.paper._vbSize),i.setAttribute(o,p),k["stroke-dasharray"]&&v(d,k["stroke-dasharray"],f),d._.arrows&&("startString"in d._.arrows&&t(d,d._.arrows.startString),"endString"in d._.arrows&&t(d,d._.arrows.endString,1));break;case"stroke-dasharray":v(d,p,f);break;case"fill":var D=c(p).match(a._ISURL);if(D){z=q("pattern");var F=q("image");z.id=a.createUUID(),q(z,{x:0,y:0,patternUnits:"userSpaceOnUse",height:1,width:1}),q(F,{x:0,y:0,"xlink:href":D[1]}),z.appendChild(F),function(b){a._preload(D[1],function(){var a=this.offsetWidth,c=this.offsetHeight;q(b,{width:a,height:c}),q(F,{width:a,height:c}),d.paper.safari()})}(z),d.paper.defs.appendChild(z),q(i,{fill:"url(#"+z.id+")"}),d.pattern=z,d.pattern&&s(d);break}var G=a.getRGB(p);if(!G.error)delete f.gradient,delete k.gradient,!a.is(k.opacity,"undefined")&&a.is(f.opacity,"undefined")&&q(i,{opacity:k.opacity}),!a.is(k["fill-opacity"],"undefined")&&a.is(f["fill-opacity"],"undefined")&&q(i,{"fill-opacity":k["fill-opacity"]});else if((d.type=="circle"||d.type=="ellipse"||c(p).charAt()!="r")&&r(d,p)){if("opacity"in k||"fill-opacity"in k){var H=a._g.doc.getElementById(i.getAttribute("fill").replace(/^url\(#|\)$/g,l));if(H){var I=H.getElementsByTagName("stop");q(I[I.length-1],{"stop-opacity":("opacity"in k?k.opacity:1)*("fill-opacity"in k?k["fill-opacity"]:1)})}}k.gradient=p,k.fill="none";break}G[b]("opacity")&&q(i,{"fill-opacity":G.opacity>1?G.opacity/100:G.opacity});case"stroke":G=a.getRGB(p),i.setAttribute(o,G.hex),o=="stroke"&&G[b]("opacity")&&q(i,{"stroke-opacity":G.opacity>1?G.opacity/100:G.opacity}),o=="stroke"&&d._.arrows&&("startString"in d._.arrows&&t(d,d._.arrows.startString),"endString"in d._.arrows&&t(d,d._.arrows.endString,1));break;case"gradient":(d.type=="circle"||d.type=="ellipse"||c(p).charAt()!="r")&&r(d,p);break;case"opacity":k.gradient&&!k[b]("stroke-opacity")&&q(i,{"stroke-opacity":p>1?p/100:p});case"fill-opacity":if(k.gradient){H=a._g.doc.getElementById(i.getAttribute("fill").replace(/^url\(#|\)$/g,l)),H&&(I=H.getElementsByTagName("stop"),q(I[I.length-1],{"stop-opacity":p}));break};default:o=="font-size"&&(p=e(p,10)+"px");var J=o.replace(/(\-.)/g,function(a){return a.substring(1).toUpperCase()});i.style[J]=p,d._.dirty=1,i.setAttribute(o,p)}}y(d,f),i.style.visibility=m},x=1.2,y=function(d,f){if(d.type=="text"&&!!(f[b]("text")||f[b]("font")||f[b]("font-size")||f[b]("x")||f[b]("y"))){var g=d.attrs,h=d.node,i=h.firstChild?e(a._g.doc.defaultView.getComputedStyle(h.firstChild,l).getPropertyValue("font-size"),10):10;if(f[b]("text")){g.text=f.text;while(h.firstChild)h.removeChild(h.firstChild);var j=c(f.text).split("\n"),k=[],m;for(var n=0,o=j.length;n<o;n++)m=q("tspan"),n&&q(m,{dy:i*x,x:g.x}),m.appendChild(a._g.doc.createTextNode(j[n])),h.appendChild(m),k[n]=m}else{k=h.getElementsByTagName("tspan");for(n=0,o=k.length;n<o;n++)n?q(k[n],{dy:i*x,x:g.x}):q(k[0],{dy:0})}q(h,{x:g.x,y:g.y}),d._.dirty=1;var p=d._getBBox(),r=g.y-(p.y+p.height/2);r&&a.is(r,"finite")&&q(k[0],{dy:r})}},z=function(b,c){var d=0,e=0;this[0]=this.node=b,b.raphael=!0,this.id=a._oid++,b.raphaelid=this.id,this.matrix=a.matrix(),this.realPath=null,this.paper=c,this.attrs=this.attrs||{},this._={transform:[],sx:1,sy:1,deg:0,dx:0,dy:0,dirty:1},!c.bottom&&(c.bottom=this),this.prev=c.top,c.top&&(c.top.next=this),c.top=this,this.next=null},A=a.el;z.prototype=A,A.constructor=z,a._engine.path=function(a,b){var c=q("path");b.canvas&&b.canvas.appendChild(c);var d=new z(c,b);d.type="path",w(d,{fill:"none",stroke:"#000",path:a});return d},A.rotate=function(a,b,e){if(this.removed)return this;a=c(a).split(j),a.length-1&&(b=d(a[1]),e=d(a[2])),a=d(a[0]),e==null&&(b=e);if(b==null||e==null){var f=this.getBBox(1);b=f.x+f.width/2,e=f.y+f.height/2}this.transform(this._.transform.concat([["r",a,b,e]]));return this},A.scale=function(a,b,e,f){if(this.removed)return this;a=c(a).split(j),a.length-1&&(b=d(a[1]),e=d(a[2]),f=d(a[3])),a=d(a[0]),b==null&&(b=a),f==null&&(e=f);if(e==null||f==null)var g=this.getBBox(1);e=e==null?g.x+g.width/2:e,f=f==null?g.y+g.height/2:f,this.transform(this._.transform.concat([["s",a,b,e,f]]));return this},A.translate=function(a,b){if(this.removed)return this;a=c(a).split(j),a.length-1&&(b=d(a[1])),a=d(a[0])||0,b=+b||0,this.transform(this._.transform.concat([["t",a,b]]));return this},A.transform=function(c){var d=this._;if(c==null)return d.transform;a._extractTransform(this,c),this.clip&&q(this.clip,{transform:this.matrix.invert()}),this.pattern&&s(this),this.node&&q(this.node,{transform:this.matrix});if(d.sx!=1||d.sy!=1){var e=this.attrs[b]("stroke-width")?this.attrs["stroke-width"]:1;this.attr({"stroke-width":e})}return this},A.hide=function(){!this.removed&&this.paper.safari(this.node.style.display="none");return this},A.show=function(){!this.removed&&this.paper.safari(this.node.style.display="");return this},A.remove=function(){if(!this.removed&&!!this.node.parentNode){var b=this.paper;b.__set__&&b.__set__.exclude(this),k.unbind("raphael.*.*."+this.id),this.gradient&&b.defs.removeChild(this.gradient),a._tear(this,b),this.node.parentNode.tagName.toLowerCase()=="a"?this.node.parentNode.parentNode.removeChild(this.node.parentNode):this.node.parentNode.removeChild(this.node);for(var c in this)this[c]=typeof this[c]=="function"?a._removedFactory(c):null;this.removed=!0}},A._getBBox=function(){if(this.node.style.display=="none"){this.show();var a=!0}var b={};try{b=this.node.getBBox()}catch(c){}finally{b=b||{}}a&&this.hide();return b},A.attr=function(c,d){if(this.removed)return this;if(c==null){var e={};for(var f in this.attrs)this.attrs[b](f)&&(e[f]=this.attrs[f]);e.gradient&&e.fill=="none"&&(e.fill=e.gradient)&&delete e.gradient,e.transform=this._.transform;return e}if(d==null&&a.is(c,"string")){if(c=="fill"&&this.attrs.fill=="none"&&this.attrs.gradient)return this.attrs.gradient;if(c=="transform")return this._.transform;var g=c.split(j),h={};for(var i=0,l=g.length;i<l;i++)c=g[i],c in this.attrs?h[c]=this.attrs[c]:a.is(this.paper.customAttributes[c],"function")?h[c]=this.paper.customAttributes[c].def:h[c]=a._availableAttrs[c];return l-1?h:h[g[0]]}if(d==null&&a.is(c,"array")){h={};for(i=0,l=c.length;i<l;i++)h[c[i]]=this.attr(c[i]);return h}if(d!=null){var m={};m[c]=d}else c!=null&&a.is(c,"object")&&(m=c);for(var n in m)k("raphael.attr."+n+"."+this.id,this,m[n]);for(n in this.paper.customAttributes)if(this.paper.customAttributes[b](n)&&m[b](n)&&a.is(this.paper.customAttributes[n],"function")){var o=this.paper.customAttributes[n].apply(this,[].concat(m[n]));this.attrs[n]=m[n];for(var p in o)o[b](p)&&(m[p]=o[p])}w(this,m);return this},A.toFront=function(){if(this.removed)return this;this.node.parentNode.tagName.toLowerCase()=="a"?this.node.parentNode.parentNode.appendChild(this.node.parentNode):this.node.parentNode.appendChild(this.node);var b=this.paper;b.top!=this&&a._tofront(this,b);return this},A.toBack=function(){if(this.removed)return this;var b=this.node.parentNode;b.tagName.toLowerCase()=="a"?b.parentNode.insertBefore(this.node.parentNode,this.node.parentNode.parentNode.firstChild):b.firstChild!=this.node&&b.insertBefore(this.node,this.node.parentNode.firstChild),a._toback(this,this.paper);var c=this.paper;return this},A.insertAfter=function(b){if(this.removed)return this;var c=b.node||b[b.length-1].node;c.nextSibling?c.parentNode.insertBefore(this.node,c.nextSibling):c.parentNode.appendChild(this.node),a._insertafter(this,b,this.paper);return this},A.insertBefore=function(b){if(this.removed)return this;var c=b.node||b[0].node;c.parentNode.insertBefore(this.node,c),a._insertbefore(this,b,this.paper);return this},A.blur=function(b){var c=this;if(+b!==0){var d=q("filter"),e=q("feGaussianBlur");c.attrs.blur=b,d.id=a.createUUID(),q(e,{stdDeviation:+b||1.5}),d.appendChild(e),c.paper.defs.appendChild(d),c._blur=d,q(c.node,{filter:"url(#"+d.id+")"})}else c._blur&&(c._blur.parentNode.removeChild(c._blur),delete c._blur,delete c.attrs.blur),c.node.removeAttribute("filter")},a._engine.circle=function(a,b,c,d){var e=q("circle");a.canvas&&a.canvas.appendChild(e);var f=new z(e,a);f.attrs={cx:b,cy:c,r:d,fill:"none",stroke:"#000"},f.type="circle",q(e,f.attrs);return f},a._engine.rect=function(a,b,c,d,e,f){var g=q("rect");a.canvas&&a.canvas.appendChild(g);var h=new z(g,a);h.attrs={x:b,y:c,width:d,height:e,r:f||0,rx:f||0,ry:f||0,fill:"none",stroke:"#000"},h.type="rect",q(g,h.attrs);return h},a._engine.ellipse=function(a,b,c,d,e){var f=q("ellipse");a.canvas&&a.canvas.appendChild(f);var g=new z(f,a);g.attrs={cx:b,cy:c,rx:d,ry:e,fill:"none",stroke:"#000"},g.type="ellipse",q(f,g.attrs);return g},a._engine.image=function(a,b,c,d,e,f){var g=q("image");q(g,{x:c,y:d,width:e,height:f,preserveAspectRatio:"none"}),g.setAttributeNS(n,"href",b),a.canvas&&a.canvas.appendChild(g);var h=new z(g,a);h.attrs={x:c,y:d,width:e,height:f,src:b},h.type="image";return h},a._engine.text=function(b,c,d,e){var f=q("text");b.canvas&&b.canvas.appendChild(f);var g=new z(f,b);g.attrs={x:c,y:d,"text-anchor":"middle",text:e,font:a._availableAttrs.font,stroke:"none",fill:"#000"},g.type="text",w(g,g.attrs);return g},a._engine.setSize=function(a,b){this.width=a||this.width,this.height=b||this.height,this.canvas.setAttribute("width",this.width),this.canvas.setAttribute("height",this.height),this._viewBox&&this.setViewBox.apply(this,this._viewBox);return this},a._engine.create=function(){var b=a._getContainer.apply(0,arguments),c=b&&b.container,d=b.x,e=b.y,f=b.width,g=b.height;if(!c)throw new Error("SVG container not found.");var h=q("svg"),i="overflow:hidden;",j;d=d||0,e=e||0,f=f||512,g=g||342,q(h,{height:g,version:1.1,width:f,xmlns:"http://www.w3.org/2000/svg"}),c==1?(h.style.cssText=i+"position:absolute;left:"+d+"px;top:"+e+"px",a._g.doc.body.appendChild(h),j=1):(h.style.cssText=i+"position:relative",c.firstChild?c.insertBefore(h,c.firstChild):c.appendChild(h)),c=new a._Paper,c.width=f,c.height=g,c.canvas=h,c.clear(),c._left=c._top=0,j&&(c.renderfix=function(){}),c.renderfix();return c},a._engine.setViewBox=function(a,b,c,d,e){k("raphael.setViewBox",this,this._viewBox,[a,b,c,d,e]);var f=g(c/this.width,d/this.height),h=this.top,i=e?"meet":"xMinYMin",j,l;a==null?(this._vbSize&&(f=1),delete this._vbSize,j="0 0 "+this.width+m+this.height):(this._vbSize=f,j=a+m+b+m+c+m+d),q(this.canvas,{viewBox:j,preserveAspectRatio:i});while(f&&h)l="stroke-width"in h.attrs?h.attrs["stroke-width"]:1,h.attr({"stroke-width":l}),h._.dirty=1,h._.dirtyT=1,h=h.prev;this._viewBox=[a,b,c,d,!!e];return this},a.prototype.renderfix=function(){var a=this.canvas,b=a.style,c;try{c=a.getScreenCTM()||a.createSVGMatrix()}catch(d){c=a.createSVGMatrix()}var e=-c.e%1,f=-c.f%1;if(e||f)e&&(this._left=(this._left+e)%1,b.left=this._left+"px"),f&&(this._top=(this._top+f)%1,b.top=this._top+"px")},a.prototype.clear=function(){a.eve("raphael.clear",this);var b=this.canvas;while(b.firstChild)b.removeChild(b.firstChild);this.bottom=this.top=null,(this.desc=q("desc")).appendChild(a._g.doc.createTextNode("Created with Raphaël "+a.version)),b.appendChild(this.desc),b.appendChild(this.defs=q("defs"))},a.prototype.remove=function(){k("raphael.remove",this),this.canvas.parentNode&&this.canvas.parentNode.removeChild(this.canvas);for(var b in this)this[b]=typeof this[b]=="function"?a._removedFactory(b):null};var B=a.st;for(var C in A)A[b](C)&&!B[b](C)&&(B[C]=function(a){return function(){var b=arguments;return this.forEach(function(c){c[a].apply(c,b)})}}(C))}(window.Raphael),window.Raphael.vml&&function(a){var b="hasOwnProperty",c=String,d=parseFloat,e=Math,f=e.round,g=e.max,h=e.min,i=e.abs,j="fill",k=/[, ]+/,l=a.eve,m=" progid:DXImageTransform.Microsoft",n=" ",o="",p={M:"m",L:"l",C:"c",Z:"x",m:"t",l:"r",c:"v",z:"x"},q=/([clmz]),?([^clmz]*)/gi,r=/ progid:\S+Blur\([^\)]+\)/g,s=/-?[^,\s-]+/g,t="position:absolute;left:0;top:0;width:1px;height:1px",u=21600,v={path:1,rect:1,image:1},w={circle:1,ellipse:1},x=function(b){var d=/[ahqstv]/ig,e=a._pathToAbsolute;c(b).match(d)&&(e=a._path2curve),d=/[clmz]/g;if(e==a._pathToAbsolute&&!c(b).match(d)){var g=c(b).replace(q,function(a,b,c){var d=[],e=b.toLowerCase()=="m",g=p[b];c.replace(s,function(a){e&&d.length==2&&(g+=d+p[b=="m"?"l":"L"],d=[]),d.push(f(a*u))});return g+d});return g}var h=e(b),i,j;g=[];for(var k=0,l=h.length;k<l;k++){i=h[k],j=h[k][0].toLowerCase(),j=="z"&&(j="x");for(var m=1,r=i.length;m<r;m++)j+=f(i[m]*u)+(m!=r-1?",":o);g.push(j)}return g.join(n)},y=function(b,c,d){var e=a.matrix();e.rotate(-b,.5,.5);return{dx:e.x(c,d),dy:e.y(c,d)}},z=function(a,b,c,d,e,f){var g=a._,h=a.matrix,k=g.fillpos,l=a.node,m=l.style,o=1,p="",q,r=u/b,s=u/c;m.visibility="hidden";if(!!b&&!!c){l.coordsize=i(r)+n+i(s),m.rotation=f*(b*c<0?-1:1);if(f){var t=y(f,d,e);d=t.dx,e=t.dy}b<0&&(p+="x"),c<0&&(p+=" y")&&(o=-1),m.flip=p,l.coordorigin=d*-r+n+e*-s;if(k||g.fillsize){var v=l.getElementsByTagName(j);v=v&&v[0],l.removeChild(v),k&&(t=y(f,h.x(k[0],k[1]),h.y(k[0],k[1])),v.position=t.dx*o+n+t.dy*o),g.fillsize&&(v.size=g.fillsize[0]*i(b)+n+g.fillsize[1]*i(c)),l.appendChild(v)}m.visibility="visible"}};a.toString=function(){return"Your browser doesn’t support SVG. Falling down to VML.\nYou are running Raphaël "+this.version};var A=function(a,b,d){var e=c(b).toLowerCase().split("-"),f=d?"end":"start",g=e.length,h="classic",i="medium",j="medium";while(g--)switch(e[g]){case"block":case"classic":case"oval":case"diamond":case"open":case"none":h=e[g];break;case"wide":case"narrow":j=e[g];break;case"long":case"short":i=e[g]}var k=a.node.getElementsByTagName("stroke")[0];k[f+"arrow"]=h,k[f+"arrowlength"]=i,k[f+"arrowwidth"]=j},B=function(e,i){e.attrs=e.attrs||{};var l=e.node,m=e.attrs,p=l.style,q,r=v[e.type]&&(i.x!=m.x||i.y!=m.y||i.width!=m.width||i.height!=m.height||i.cx!=m.cx||i.cy!=m.cy||i.rx!=m.rx||i.ry!=m.ry||i.r!=m.r),s=w[e.type]&&(m.cx!=i.cx||m.cy!=i.cy||m.r!=i.r||m.rx!=i.rx||m.ry!=i.ry),t=e;for(var y in i)i[b](y)&&(m[y]=i[y]);r&&(m.path=a._getPath[e.type](e),e._.dirty=1),i.href&&(l.href=i.href),i.title&&(l.title=i.title),i.target&&(l.target=i.target),i.cursor&&(p.cursor=i.cursor),"blur"in i&&e.blur(i.blur);if(i.path&&e.type=="path"||r)l.path=x(~c(m.path).toLowerCase().indexOf("r")?a._pathToAbsolute(m.path):m.path),e.type=="image"&&(e._.fillpos=[m.x,m.y],e._.fillsize=[m.width,m.height],z(e,1,1,0,0,0));"transform"in i&&e.transform(i.transform);if(s){var B=+m.cx,D=+m.cy,E=+m.rx||+m.r||0,G=+m.ry||+m.r||0;l.path=a.format("ar{0},{1},{2},{3},{4},{1},{4},{1}x",f((B-E)*u),f((D-G)*u),f((B+E)*u),f((D+G)*u),f(B*u))}if("clip-rect"in i){var H=c(i["clip-rect"]).split(k);if(H.length==4){H[2]=+H[2]+ +H[0],H[3]=+H[3]+ +H[1];var I=l.clipRect||a._g.doc.createElement("div"),J=I.style;J.clip=a.format("rect({1}px {2}px {3}px {0}px)",H),l.clipRect||(J.position="absolute",J.top=0,J.left=0,J.width=e.paper.width+"px",J.height=e.paper.height+"px",l.parentNode.insertBefore(I,l),I.appendChild(l),l.clipRect=I)}i["clip-rect"]||l.clipRect&&(l.clipRect.style.clip="auto")}if(e.textpath){var K=e.textpath.style;i.font&&(K.font=i.font),i["font-family"]&&(K.fontFamily='"'+i["font-family"].split(",")[0].replace(/^['"]+|['"]+$/g,o)+'"'),i["font-size"]&&(K.fontSize=i["font-size"]),i["font-weight"]&&(K.fontWeight=i["font-weight"]),i["font-style"]&&(K.fontStyle=i["font-style"])}"arrow-start"in i&&A(t,i["arrow-start"]),"arrow-end"in i&&A(t,i["arrow-end"],1);if(i.opacity!=null||i["stroke-width"]!=null||i.fill!=null||i.src!=null||i.stroke!=null||i["stroke-width"]!=null||i["stroke-opacity"]!=null||i["fill-opacity"]!=null||i["stroke-dasharray"]!=null||i["stroke-miterlimit"]!=null||i["stroke-linejoin"]!=null||i["stroke-linecap"]!=null){var L=l.getElementsByTagName(j),M=!1;L=L&&L[0],!L&&(M=L=F(j)),e.type=="image"&&i.src&&(L.src=i.src),i.fill&&(L.on=!0);if(L.on==null||i.fill=="none"||i.fill===null)L.on=!1;if(L.on&&i.fill){var N=c(i.fill).match(a._ISURL);if(N){L.parentNode==l&&l.removeChild(L),L.rotate=!0,L.src=N[1],L.type="tile";var O=e.getBBox(1);L.position=O.x+n+O.y,e._.fillpos=[O.x,O.y],a._preload(N[1],function(){e._.fillsize=[this.offsetWidth,this.offsetHeight]})}else L.color=a.getRGB(i.fill).hex,L.src=o,L.type="solid",a.getRGB(i.fill).error&&(t.type in{circle:1,ellipse:1}||c(i.fill).charAt()!="r")&&C(t,i.fill,L)&&(m.fill="none",m.gradient=i.fill,L.rotate=!1)}if("fill-opacity"in i||"opacity"in i){var P=((+m["fill-opacity"]+1||2)-1)*((+m.opacity+1||2)-1)*((+a.getRGB(i.fill).o+1||2)-1);P=h(g(P,0),1),L.opacity=P,L.src&&(L.color="none")}l.appendChild(L);var Q=l.getElementsByTagName("stroke")&&l.getElementsByTagName("stroke")[0],T=!1;!Q&&(T=Q=F("stroke"));if(i.stroke&&i.stroke!="none"||i["stroke-width"]||i["stroke-opacity"]!=null||i["stroke-dasharray"]||i["stroke-miterlimit"]||i["stroke-linejoin"]||i["stroke-linecap"])Q.on=!0;(i.stroke=="none"||i.stroke===null||Q.on==null||i.stroke==0||i["stroke-width"]==0)&&(Q.on=!1);var U=a.getRGB(i.stroke);Q.on&&i.stroke&&(Q.color=U.hex),P=((+m["stroke-opacity"]+1||2)-1)*((+m.opacity+1||2)-1)*((+U.o+1||2)-1);var V=(d(i["stroke-width"])||1)*.75;P=h(g(P,0),1),i["stroke-width"]==null&&(V=m["stroke-width"]),i["stroke-width"]&&(Q.weight=V),V&&V<1&&(P*=V)&&(Q.weight=1),Q.opacity=P,i["stroke-linejoin"]&&(Q.joinstyle=i["stroke-linejoin"]||"miter"),Q.miterlimit=i["stroke-miterlimit"]||8,i["stroke-linecap"]&&(Q.endcap=i["stroke-linecap"]=="butt"?"flat":i["stroke-linecap"]=="square"?"square":"round");if(i["stroke-dasharray"]){var W={"-":"shortdash",".":"shortdot","-.":"shortdashdot","-..":"shortdashdotdot",". ":"dot","- ":"dash","--":"longdash","- .":"dashdot","--.":"longdashdot","--..":"longdashdotdot"};Q.dashstyle=W[b](i["stroke-dasharray"])?W[i["stroke-dasharray"]]:o}T&&l.appendChild(Q)}if(t.type=="text"){t.paper.canvas.style.display=o;var X=t.paper.span,Y=100,Z=m.font&&m.font.match(/\d+(?:\.\d*)?(?=px)/);p=X.style,m.font&&(p.font=m.font),m["font-family"]&&(p.fontFamily=m["font-family"]),m["font-weight"]&&(p.fontWeight=m["font-weight"]),m["font-style"]&&(p.fontStyle=m["font-style"]),Z=d(m["font-size"]||Z&&Z[0])||10,p.fontSize=Z*Y+"px",t.textpath.string&&(X.innerHTML=c(t.textpath.string).replace(/</g,"&#60;").replace(/&/g,"&#38;").replace(/\n/g,"<br>"));var $=X.getBoundingClientRect();t.W=m.w=($.right-$.left)/Y,t.H=m.h=($.bottom-$.top)/Y,t.X=m.x,t.Y=m.y+t.H/2,("x"in i||"y"in i)&&(t.path.v=a.format("m{0},{1}l{2},{1}",f(m.x*u),f(m.y*u),f(m.x*u)+1));var _=["x","y","text","font","font-family","font-weight","font-style","font-size"];for(var ba=0,bb=_.length;ba<bb;ba++)if(_[ba]in i){t._.dirty=1;break}switch(m["text-anchor"]){case"start":t.textpath.style["v-text-align"]="left",t.bbx=t.W/2;break;case"end":t.textpath.style["v-text-align"]="right",t.bbx=-t.W/2;break;default:t.textpath.style["v-text-align"]="center",t.bbx=0}t.textpath.style["v-text-kern"]=!0}},C=function(b,f,g){b.attrs=b.attrs||{};var h=b.attrs,i=Math.pow,j,k,l="linear",m=".5 .5";b.attrs.gradient=f,f=c(f).replace(a._radial_gradient,function(a,b,c){l="radial",b&&c&&(b=d(b),c=d(c),i(b-.5,2)+i(c-.5,2)>.25&&(c=e.sqrt(.25-i(b-.5,2))*((c>.5)*2-1)+.5),m=b+n+c);return o}),f=f.split(/\s*\-\s*/);if(l=="linear"){var p=f.shift();p=-d(p);if(isNaN(p))return null}var q=a._parseDots(f);if(!q)return null;b=b.shape||b.node;if(q.length){b.removeChild(g),g.on=!0,g.method="none",g.color=q[0].color,g.color2=q[q.length-1].color;var r=[];for(var s=0,t=q.length;s<t;s++)q[s].offset&&r.push(q[s].offset+n+q[s].color);g.colors=r.length?r.join():"0% "+g.color,l=="radial"?(g.type="gradientTitle",g.focus="100%",g.focussize="0 0",g.focusposition=m,g.angle=0):(g.type="gradient",g.angle=(270-p)%360),b.appendChild(g)}return 1},D=function(b,c){this[0]=this.node=b,b.raphael=!0,this.id=a._oid++,b.raphaelid=this.id,this.X=0,this.Y=0,this.attrs={},this.paper=c,this.matrix=a.matrix(),this._={transform:[],sx:1,sy:1,dx:0,dy:0,deg:0,dirty:1,dirtyT:1},!c.bottom&&(c.bottom=this),this.prev=c.top,c.top&&(c.top.next=this),c.top=this,this.next=null},E=a.el;D.prototype=E,E.constructor=D,E.transform=function(b){if(b==null)return this._.transform;var d=this.paper._viewBoxShift,e=d?"s"+[d.scale,d.scale]+"-1-1t"+[d.dx,d.dy]:o,f;d&&(f=b=c(b).replace(/\.{3}|\u2026/g,this._.transform||o)),a._extractTransform(this,e+b);var g=this.matrix.clone(),h=this.skew,i=this.node,j,k=~c(this.attrs.fill).indexOf("-"),l=!c(this.attrs.fill).indexOf("url(");g.translate(-0.5,-0.5);if(l||k||this.type=="image"){h.matrix="1 0 0 1",h.offset="0 0",j=g.split();if(k&&j.noRotation||!j.isSimple){i.style.filter=g.toFilter();var m=this.getBBox(),p=this.getBBox(1),q=m.x-p.x,r=m.y-p.y;i.coordorigin=q*-u+n+r*-u,z(this,1,1,q,r,0)}else i.style.filter=o,z(this,j.scalex,j.scaley,j.dx,j.dy,j.rotate)}else i.style.filter=o,h.matrix=c(g),h.offset=g.offset();f&&(this._.transform=f);return this},E.rotate=function(a,b,e){if(this.removed)return this;if(a!=null){a=c(a).split(k),a.length-1&&(b=d(a[1]),e=d(a[2])),a=d(a[0]),e==null&&(b=e);if(b==null||e==null){var f=this.getBBox(1);b=f.x+f.width/2,e=f.y+f.height/2}this._.dirtyT=1,this.transform(this._.transform.concat([["r",a,b,e]]));return this}},E.translate=function(a,b){if(this.removed)return this;a=c(a).split(k),a.length-1&&(b=d(a[1])),a=d(a[0])||0,b=+b||0,this._.bbox&&(this._.bbox.x+=a,this._.bbox.y+=b),this.transform(this._.transform.concat([["t",a,b]]));return this},E.scale=function(a,b,e,f){if(this.removed)return this;a=c(a).split(k),a.length-1&&(b=d(a[1]),e=d(a[2]),f=d(a[3]),isNaN(e)&&(e=null),isNaN(f)&&(f=null)),a=d(a[0]),b==null&&(b=a),f==null&&(e=f);if(e==null||f==null)var g=this.getBBox(1);e=e==null?g.x+g.width/2:e,f=f==null?g.y+g.height/2:f,this.transform(this._.transform.concat([["s",a,b,e,f]])),this._.dirtyT=1;return this},E.hide=function(){!this.removed&&(this.node.style.display="none");return this},E.show=function(){!this.removed&&(this.node.style.display=o);return this},E._getBBox=function(){if(this.removed)return{};return{x:this.X+(this.bbx||0)-this.W/2,y:this.Y-this.H,width:this.W,height:this.H}},E.remove=function(){if(!this.removed&&!!this.node.parentNode){this.paper.__set__&&this.paper.__set__.exclude(this),a.eve.unbind("raphael.*.*."+this.id),a._tear(this,this.paper),this.node.parentNode.removeChild(this.node),this.shape&&this.shape.parentNode.removeChild(this.shape);for(var b in this)this[b]=typeof this[b]=="function"?a._removedFactory(b):null;this.removed=!0}},E.attr=function(c,d){if(this.removed)return this;if(c==null){var e={};for(var f in this.attrs)this.attrs[b](f)&&(e[f]=this.attrs[f]);e.gradient&&e.fill=="none"&&(e.fill=e.gradient)&&delete e.gradient,e.transform=this._.transform;return e}if(d==null&&a.is(c,"string")){if(c==j&&this.attrs.fill=="none"&&this.attrs.gradient)return this.attrs.gradient;var g=c.split(k),h={};for(var i=0,m=g.length;i<m;i++)c=g[i],c in this.attrs?h[c]=this.attrs[c]:a.is(this.paper.customAttributes[c],"function")?h[c]=this.paper.customAttributes[c].def:h[c]=a._availableAttrs[c];return m-1?h:h[g[0]]}if(this.attrs&&d==null&&a.is(c,"array")){h={};for(i=0,m=c.length;i<m;i++)h[c[i]]=this.attr(c[i]);return h}var n;d!=null&&(n={},n[c]=d),d==null&&a.is(c,"object")&&(n=c);for(var o in n)l("raphael.attr."+o+"."+this.id,this,n[o]);if(n){for(o in this.paper.customAttributes)if(this.paper.customAttributes[b](o)&&n[b](o)&&a.is(this.paper.customAttributes[o],"function")){var p=this.paper.customAttributes[o].apply(this,[].concat(n[o]));this.attrs[o]=n[o];for(var q in p)p[b](q)&&(n[q]=p[q])}n.text&&this.type=="text"&&(this.textpath.string=n.text),B(this,n)}return this},E.toFront=function(){!this.removed&&this.node.parentNode.appendChild(this.node),this.paper&&this.paper.top!=this&&a._tofront(this,this.paper);return this},E.toBack=function(){if(this.removed)return this;this.node.parentNode.firstChild!=this.node&&(this.node.parentNode.insertBefore(this.node,this.node.parentNode.firstChild),a._toback(this,this.paper));return this},E.insertAfter=function(b){if(this.removed)return this;b.constructor==a.st.constructor&&(b=b[b.length-1]),b.node.nextSibling?b.node.parentNode.insertBefore(this.node,b.node.nextSibling):b.node.parentNode.appendChild(this.node),a._insertafter(this,b,this.paper);return this},E.insertBefore=function(b){if(this.removed)return this;b.constructor==a.st.constructor&&(b=b[0]),b.node.parentNode.insertBefore(this.node,b.node),a._insertbefore(this,b,this.paper);return this},E.blur=function(b){var c=this.node.runtimeStyle,d=c.filter;d=d.replace(r,o),+b!==0?(this.attrs.blur=b,c.filter=d+n+m+".Blur(pixelradius="+(+b||1.5)+")",c.margin=a.format("-{0}px 0 0 -{0}px",f(+b||1.5))):(c.filter=d,c.margin=0,delete this.attrs.blur)},a._engine.path=function(a,b){var c=F("shape");c.style.cssText=t,c.coordsize=u+n+u,c.coordorigin=b.coordorigin;var d=new D(c,b),e={fill:"none",stroke:"#000"};a&&(e.path=a),d.type="path",d.path=[],d.Path=o,B(d,e),b.canvas.appendChild(c);var f=F("skew");f.on=!0,c.appendChild(f),d.skew=f,d.transform(o);return d},a._engine.rect=function(b,c,d,e,f,g){var h=a._rectPath(c,d,e,f,g),i=b.path(h),j=i.attrs;i.X=j.x=c,i.Y=j.y=d,i.W=j.width=e,i.H=j.height=f,j.r=g,j.path=h,i.type="rect";return i},a._engine.ellipse=function(a,b,c,d,e){var f=a.path(),g=f.attrs;f.X=b-d,f.Y=c-e,f.W=d*2,f.H=e*2,f.type="ellipse",B(f,{cx:b,cy:c,rx:d,ry:e});return f},a._engine.circle=function(a,b,c,d){var e=a.path(),f=e.attrs;e.X=b-d,e.Y=c-d,e.W=e.H=d*2,e.type="circle",B(e,{cx:b,cy:c,r:d});return e},a._engine.image=function(b,c,d,e,f,g){var h=a._rectPath(d,e,f,g),i=b.path(h).attr({stroke:"none"}),k=i.attrs,l=i.node,m=l.getElementsByTagName(j)[0];k.src=c,i.X=k.x=d,i.Y=k.y=e,i.W=k.width=f,i.H=k.height=g,k.path=h,i.type="image",m.parentNode==l&&l.removeChild(m),m.rotate=!0,m.src=c,m.type="tile",i._.fillpos=[d,e],i._.fillsize=[f,g],l.appendChild(m),z(i,1,1,0,0,0);return i},a._engine.text=function(b,d,e,g){var h=F("shape"),i=F("path"),j=F("textpath");d=d||0,e=e||0,g=g||"",i.v=a.format("m{0},{1}l{2},{1}",f(d*u),f(e*u),f(d*u)+1),i.textpathok=!0,j.string=c(g),j.on=!0,h.style.cssText=t,h.coordsize=u+n+u,h.coordorigin="0 0";var k=new D(h,b),l={fill:"#000",stroke:"none",font:a._availableAttrs.font,text:g};k.shape=h,k.path=i,k.textpath=j,k.type="text",k.attrs.text=c(g),k.attrs.x=d,k.attrs.y=e,k.attrs.w=1,k.attrs.h=1,B(k,l),h.appendChild(j),h.appendChild(i),b.canvas.appendChild(h);var m=F("skew");m.on=!0,h.appendChild(m),k.skew=m,k.transform(o);return k},a._engine.setSize=function(b,c){var d=this.canvas.style;this.width=b,this.height=c,b==+b&&(b+="px"),c==+c&&(c+="px"),d.width=b,d.height=c,d.clip="rect(0 "+b+" "+c+" 0)",this._viewBox&&a._engine.setViewBox.apply(this,this._viewBox);return this},a._engine.setViewBox=function(b,c,d,e,f){a.eve("raphael.setViewBox",this,this._viewBox,[b,c,d,e,f]);var h=this.width,i=this.height,j=1/g(d/h,e/i),k,l;f&&(k=i/e,l=h/d,d*k<h&&(b-=(h-d*k)/2/k),e*l<i&&(c-=(i-e*l)/2/l)),this._viewBox=[b,c,d,e,!!f],this._viewBoxShift={dx:-b,dy:-c,scale:j},this.forEach(function(a){a.transform("...")});return this};var F;a._engine.initWin=function(a){var b=a.document;b.createStyleSheet().addRule(".rvml","behavior:url(#default#VML)");try{!b.namespaces.rvml&&b.namespaces.add("rvml","urn:schemas-microsoft-com:vml"),F=function(a){return b.createElement("<rvml:"+a+' class="rvml">')}}catch(c){F=function(a){return b.createElement("<"+a+' xmlns="urn:schemas-microsoft.com:vml" class="rvml">')}}},a._engine.initWin(a._g.win),a._engine.create=function(){var b=a._getContainer.apply(0,arguments),c=b.container,d=b.height,e,f=b.width,g=b.x,h=b.y;if(!c)throw new Error("VML container not found.");var i=new a._Paper,j=i.canvas=a._g.doc.createElement("div"),k=j.style;g=g||0,h=h||0,f=f||512,d=d||342,i.width=f,i.height=d,f==+f&&(f+="px"),d==+d&&(d+="px"),i.coordsize=u*1e3+n+u*1e3,i.coordorigin="0 0",i.span=a._g.doc.createElement("span"),i.span.style.cssText="position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;",j.appendChild(i.span),k.cssText=a.format("top:0;left:0;width:{0};height:{1};display:inline-block;position:relative;clip:rect(0 {0} {1} 0);overflow:hidden",f,d),c==1?(a._g.doc.body.appendChild(j),k.left=g+"px",k.top=h+"px",k.position="absolute"):c.firstChild?c.insertBefore(j,c.firstChild):c.appendChild(j),i.renderfix=function(){};return i},a.prototype.clear=function(){a.eve("raphael.clear",this),this.canvas.innerHTML=o,this.span=a._g.doc.createElement("span"),this.span.style.cssText="position:absolute;left:-9999em;top:-9999em;padding:0;margin:0;line-height:1;display:inline;",this.canvas.appendChild(this.span),this.bottom=this.top=null},a.prototype.remove=function(){a.eve("raphael.remove",this),this.canvas.parentNode.removeChild(this.canvas);for(var b in this)this[b]=typeof this[b]=="function"?a._removedFactory(b):null;return!0};var G=a.st;for(var H in E)E[b](H)&&!G[b](H)&&(G[H]=function(a){return function(){var b=arguments;return this.forEach(function(c){c[a].apply(c,b)})}}(H))}(window.Raphael)