var bsapp = angular.module('battlescripts', ['firebase','ngSanitize']);

// Convert markdown to HTML
bsapp.filter('markdown', function() {
  return function(md) {
    if (!md) { return ""; }
    //return (typeof micromarkdown!="undefined") ? micromarkdown.parse(md) : md;
    return (typeof marked!="undefined") ? marked(md) : md;
  };
});

bsapp.directive('json', function() {
  return {
    restrict: 'A', // only activate on element attribute
    require: 'ngModel', // get a hold of NgModelController
    link: function(scope, element, attrs, ngModelCtrl) {
      function fromUser(text) {
        // Beware: trim() is not available in old browsers
        if (!text || text.trim() === '')
          return {};
        else
          // TODO catch SyntaxError, and set validation error..
          return angular.fromJson(text);
      }

      function toUser(object) {
          // better than JSON.stringify(), because it formats + filters $$hashKey etc.
          return angular.toJson(object, true);
      }

      // push() if faster than unshift(), and avail. in IE8 and earlier (unshift isn't)
      ngModelCtrl.$parsers.push(fromUser);
      ngModelCtrl.$formatters.push(toUser);

      // $watch(attrs.ngModel) wouldn't work if this directive created a new scope;
      // see http://stackoverflow.com/questions/14693052/watch-ngmodel-from-inside-directive-using-isolate-scope how to do it then
      scope.$watch(attrs.ngModel, function(newValue, oldValue) {
        if (newValue != oldValue) {
          ngModelCtrl.$setViewValue(toUser(newValue));
          // TODO avoid this causing the focus of the input to be lost..
          ngModelCtrl.$render();
        }
      }, true); // MUST use objectEquality (true) here, for some reason..
    }
  };
});

// A "reverse" filter for arrays
bsapp.filter('reverse', function() {
  return function(items) {
    return items.slice().reverse();
  };
});

// Filtering of log messages
bsapp.filter('log_filter',function() {
   return function(logs,log_player,log_game,log_match) {
       var show=[];
       angular.forEach(logs,function(msg) {
           if ( (log_player&&msg.type=="player_log") || (log_game&&msg.type=="game_log") || (log_match&&msg.type=="match_log")) {
               show.push(msg);
           }
       })
       return show;
   }
});

// CodeMirror
bsapp.directive("codemirror", function($timeout) {
  return {
    restrict: 'A',
    priority: 0,
    require: '^ngModel',
    link: function (scope, elems, attrs, model) {
      var elem = elems[0];

      if( window.CodeMirror === undefined ) throw new Error("The CodeMirror library is not available");
      if( !attrs.ngModel ) throw new Error("ng-model is required for linking code-mirror");
      if( elem.type !== "textarea" ) throw new Error("Only textarea is supported right now...");
      var editor = CodeMirror.fromTextArea(elem);

      var config = {
          mode: "javascript",
          indentUnit: 2,
          smartIndent: true,
          tabSize: 2,
          indentWithTabs: false,
          electricChars: true,
          lineWrapping: false,
          lineNumbers: true,
          undoDepth: 10,
          historyEventDelay: 200,
          viewportMargin:Infinity
        };
      for( var option in config )
        editor.setOption(option, config[option]);
      if (attrs.language) {
        editor.setOption('mode',attrs.language);
      }

      editor.setSize(null, elem.parentNode.clientHeight);

      //TODO Watch config scope.$watch(attr.codemirror, f(), true);
      //Fire digest on window resize
      window.addEventListener("resize", function() {
        $timeout(function() { //Prefered method to fire digest
          scope.$digest();
        });
      });

      //Keeps the model in sync
      editor.on("change", function(editor, changeObj) { //TODO use changeObj to increase speed???
        var newValue = editor.getValue();
        editor.save();
        scope.$apply(function() {
          model.$setViewValue(newValue);
        });
      });

      //Watches for model changes
      scope.$watch(attrs.ngModel, function(newValue, oldValue, scope) {
        if(newValue) {
          var position = editor.getCursor();
          var scroll = editor.getScrollInfo();
          // This is a dumb hack because setting the value while there is a delay in loading causes the editor to not display
          if (!elem.getAttribute('codemirrorinit')) {
            setTimeout(() => {
              editor.setValue(newValue);
              elem.setAttribute('codemirrorinit','done');
            }, 200);
          }
          else {
            editor.setValue(newValue);
          }
          editor.setCursor(position);
          editor.scrollTo(scroll.left, scroll.top);
        }
      });
    }
  };
});

// File upload directive
// https://stackoverflow.com/questions/42238362/how-to-upload-files-with-angularfire-to-firebase-storage
bsapp.directive('fileModel',['$parse', function ($parse){
  return {
    restrict: 'A',
    link: function (scope, element, attrs) {
      element.bind('change', function () {
        $parse(attrs.fileModel)
          .assign(scope, element[0].files[0])
        scope.$apply();
      })
    }
  }
}]);

bsapp.factory('$battlescripts', ["$firebaseArray", "$firebaseObject","$firebaseAuth","$rootScope","$timeout", function($firebaseArray,$firebaseObject,$firebaseAuth,$rootScope,$timeout) {
	var api = {};

	// Util
  api.debounce = function(func, wait, immediate) {
    var timeout;
    if (typeof wait=="undefined") {
      wait = 300;
    }
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      $timeout.cancel(timeout);
      timeout = $timeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  //Initialize firebase
  var config = {

    apiKey: "AIzaSyDvWaytF9BXDJ0ra9hwqwPKnCM0LSWPAbM",
    authDomain: "battlescripts-161a3.firebaseapp.com",
    databaseURL: "https://battlescripts-161a3.firebaseio.com",
    projectId: "battlescripts-161a3",
    storageBucket: "battlescripts-161a3.appspot.com",
    messagingSenderId: "877337823986"

  };
  firebase.initializeApp(config);
  var gameRef=firebase.database().ref().child("games");
  var playerRef=firebase.database().ref().child("players");
  var userRef=firebase.database().ref().child("users");

  // AUTH
  // ----
  api.user = firebase.auth().currentUser;
  firebase.auth().onAuthStateChanged(function (user) {
    api.user = user || null;
    // This is a hack for convenience. Don't do this. Or do.
    // It injects the auth user into the scope of every controller on the page.
    if (user) {
      firebase.database().ref("users/" + user.uid).update({
        displayName: user.displayName
      });
    }
    else {
      user = {};
    }
      var inject = function(el) {
        //console.log(el, el.scope);
        if (el && el.scope) {
          var $scope = el.scope();
          $scope.$apply(function () {
            $scope.user = user;
          });
        }
        else {
          setTimeout(function() {
            inject(el);
          },100);
        }
      };
      angular.element('*[ng-controller]').each((i, el) => {
        inject(angular.element(el));
      });
  });
  api.if_logged_in = function() {
    return new Promise((resolve,reject)=>{
      $firebaseAuth().$waitForSignIn().then((user)=>{
        if (user) {
          return resolve(user);
        }
      });
    });
  };
  api.login = function() {
    return new Promise((resolve,reject)=>{
      if (api.user) {
        return resolve(api.user);
      }
      $firebaseAuth().$waitForSignIn().then((user)=>{
        if (user) {
          api.user=user;
          return resolve(user);
        }
        else {
          // Prompt the user to sign in using an auth provider
          if (!$('#auth-dialog').length) {
            $('<div id="auth-dialog" >Loading...</div>').appendTo( $('body') );
          }
          $('#auth-dialog').load("/auth.html",null,function() {
            // Animate Entrance
            setTimeout(function(){$('#auth-dialog').addClass('loaded');},100);
            // Attach listeners to the buttons
            $('#auth-dialog .auth-button').click(function() {
              var provider = $(this).attr('auth-provider');
              $firebaseAuth().$signInWithPopup(provider).then((userCredential)=>{
                api.user = userCredential.user;
                return resolve(api.user);
              }).catch((err)=>{
                reject(err);
              });
              $('#auth-dialog').remove();
            })
            $('#auth-dialog .auth-cancel').click(function() {
              $('#auth-dialog').remove();
              reject("Login canceled by user");
            });
          })
        }
      });
    });
  };
  api.logout = function() {
    return $firebaseAuth().$signOut();
  };

  // GAME methods
  // ------------
  api.get_all_games = ()=>$firebaseArray(gameRef).$loaded().catch(()=>{});

  api.get_my_games = ()=>{
    var userGameRef=firebase.database().ref("users/"+api.user.uid+"/games");
    return $firebaseArray(userGameRef).$loaded().catch(()=>[]);
  };

  api.get_game = (id) => $firebaseObject(gameRef.child(id)).$loaded().catch(()=>{});
  api.get_dev_game = (id) => $firebaseObject(firebase.database().ref("users/"+api.user.uid+"/games").child(id)).$loaded().catch(()=>{});

  api.search_games = function(params) {
    var param=Object.keys(params)[0];
    var val = params[param];
    var query = gameRef.orderByChild(param).equalTo(val);
    return $firebaseArray(query).$loaded();

  };
  api.save_game = function( game ) {
    if (game && game.$id) {
      return game.$save().then(ref=>$firebaseObject(ref).$loaded());
    }
    else {
      // Create
      var userGameRef=firebase.database().ref("users/"+api.user.uid+"/games");
      return $firebaseArray(userGameRef).$add( game ).then(ref=>$firebaseObject(ref).$loaded());
    }
  };
  api.delete_game = function( game ) {
    if (game && game.$id) {
      return game.$remove();
    }
  };

  // PLAYER methods
  // --------------
  api.get_all_players = ()=>$firebaseArray(playerRef).$loaded().catch(()=>[]);

  api.get_my_players = (game_id)=>{
    // game_id is optional, if missing then get all players for all games
    var userPlayerRef=firebase.database().ref("users/"+api.user.uid+"/players");
    if (game_id){
      var q = userPlayerRef.orderByChild("game_id").equalTo(game_id);
      return $firebaseArray(q).$loaded();
    } else {
      return $firebaseArray(userPlayerRef).$loaded().catch(()=>[]);
    }
  };

  api.get_player = (id) => $firebaseObject(firebase.database().ref("users/"+api.user.uid+"/players").child(id)).$loaded().catch(()=>{});

  api.search_players = function(params) {
    var param=Object.keys(params)[0];
    var val = params[param];
    var query = playerRef.orderByChild(param).equalTo(val);
    return $firebaseArray(query).$loaded();

  }
  api.save_player = function( player ) {
    if (player && player.$id) {
      // Update
      return player.$save().then(ref=>$firebaseObject(ref).$loaded());
    }
    else {
      // Create
      var userPlayerRef=firebase.database().ref("users/"+api.user.uid+"/players");
      return $firebaseArray(userPlayerRef).$add( player ).then(ref=>$firebaseObject(ref).$loaded());
    }
  };
  api.delete_player = function( player ) {
    if (player && player.$id) {
      return player.$remove();
    }
  };

  // UTIL methods
  // ------------

  // A quick shortcut to play a game
  api.play = function(Match, game_object, player_sources, options, match_end_handler, error_handler) {
    var game = new api.Game(game_object.source);
    var players = [];
    try {
      player_sources.forEach((code) => {
        players.push(new api.Player(code))
      });
    }
    catch(e) {
      error_handler(e);
      return;
    }
    var match = new Match(game, players, options);
    // Render
    match.subscribe("game.render", api.render);
    if (match_end_handler) {
      match.subscribe("match.end", match_end_handler);
    }
    $rootScope.$on('error/player',function(data,msg) {
      error_handler(msg);
    });
    match.start();
    return match;
  };

  // The prototype object for Games, providing useful helper methods
  api.game_prototype = function() {
    // Build an array of objects
    this.fill_array = function (num, o) {
      var a = [];
      for (var i = 0; i < num; i++) {
        if (typeof o === "object") {
          a[i] = JSON.parse(JSON.stringify(o));
        }
        else {
          a[i] = o;
        }
      }
      return a;
    };
    this.random = function (min, max) {
      if (typeof min==="undefined") { min=0; }
      if (typeof max==="undefined") { max=1; }
      min = Math.ceil(min);
      max = Math.floor(max);
      return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    this.clone = function(o) {
      return JSON.parse(JSON.stringify(o));
    };
  };

  // A wrapper to create a Game object from code and give it a prototype with useful functions
  api.Game = function(code,options) {
    var g = null;
    options = options || {};
    var wrapped=`
        g=(function(){
          var console={
            log:function(m){
              if (typeof m!=="string") { m=JSON.stringify(m); }
              ${(options.prevent_logging ? '' : '$rootScope.$broadcast("log/game",m);')}
            }
          };
          var module = {};
          ${code};
          return module.exports;
        })();
      `;
    try {
      eval(wrapped);
      g.prototype = new api.game_prototype();
    } catch(e) {
      throw "Game compilation error: "+e.toString();
    }
    return new g();
  };

  // A wrapper to create a Player object from code and enable debugging, etc.
  api.Player = function(code,options) {
    var p = null;
    options = options || {};
    if (!code) { return null; }
    // Eval the code and inspect it to make sure it meets requirements
    try {
      eval(`${code}`);
    }
    catch(e) {
      throw `Could not compile player code:${e.toString()} on line ${e.lineNumber}`;
    }
    // Wrap the player code to provide functionality in the web context
    try {
      var wrapped=`
        p=(function(){
          var console={
            log:function(m){
              if (typeof m!=="string") { m=JSON.stringify(m); }
              ${(options.prevent_logging ? '' : '$rootScope.$broadcast("log/player",m);')}
            }
          };
          var module = {};
          ${code};
          var f= module.exports;
          return f;
        })();
      `;
      eval(wrapped);
    } catch(e) {
      throw "Player compilation error: "+e.toString();
    }
    if (!p) {
      throw "Player code must use module.exports=... syntax!";
    }
    try {
      this.player = new p();
    }
    catch(e) {
      throw "Player code does not appear to be a constructor: "+e.toString();
    }
    if (typeof this.player.move!=="function") {
      throw "Player does not have a required move() function";
    }
    this.move = function(data, player_number) {
      var player_move = null;
      // Debugger functions (if defined) can return promises (async) or values (sync)
      return Promise.resolve( options.before_move ? options.before_move(data) : null)
        .then((changed_data)=>{
          player_move = this.player.move(changed_data || data, player_number);
          return options.after_move ? options.after_move(player_move) : player_move;
        }).then((changed_player_move)=>{
          return (typeof changed_player_move!=="undefined")?changed_player_move:player_move;
        });
    };
    this.error = function(err) {
      console.log(err);
      $rootScope.$broadcast("error/player",err);
      if (typeof this.player.error==="function") {
        return this.player.error(err);
      }
    };
  };

  // TODO: Wrapper function for Game debugging?

  // Canvas
  // ------
  api.render = function(data) {
    $rootScope.$broadcast("canvas/render",data);
  };
  api.init_canvas = function(template, css, json) {
    if (typeof template!=="string" && template && template.source) {
      // A game object was passed in
      var game = template;
      $rootScope.$broadcast("canvas/init",{"template":game.canvas,"css":game.css,"json":css||null});
    }
    else {
      $rootScope.$broadcast("canvas/init",{"template":template,"css":css,"json":json||null});
    }
  };

  return api;
}]);

// A general-purpose Canvas Controller for painting games
bsapp.controller("CanvasController", ["$scope", "$battlescripts", "$queryparam", "$compile", "$rootScope", "$element", "$timeout", function($scope, $battlescripts, $queryparam, $compile, $rootScope, $element, $timeout) {
  $scope.game={};
  if ($element.html().length===0) {
    $element.html("Loading...");
  }
  $rootScope.$on("canvas/render",function(msg,data) {
    $scope.game = data;
    $timeout(function() { $scope.$apply(); });
  });
  $rootScope.$on("canvas/init",function(msg,data) {
    // Populate and compile the Game canvas
    if (data.json) {
      $scope.game = data.json;
    }
    $element.html('');
    var canvas = "";
    if (data.css) {
      canvas += "<style>"+data.css+"</style>";
    }
    canvas += "<div>"+data.template+"</div>";
    $element.append($compile(canvas)($scope));
    $timeout(function() { $scope.$apply();  });
    });
}]);

bsapp.factory('$queryparam', function() {
  return {
    'get': function(key) {
      return (new URLSearchParams(window.location.search)).get(key);
    }
  };
});
