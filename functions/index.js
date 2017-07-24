const functions = require('firebase-functions');
const admin = require('firebase-admin');
const obfuscator = require('javascript-obfuscator');
admin.initializeApp(functions.config().firebase);


exports.publish_player = functions.database.ref('/users/{uid}/players/{playerId}/published').onWrite(event => {
  if (!event.data || !event.data.val()){
    return admin.database().ref('/players').child(event.params.playerId).remove();
  } else {
    return admin.database().ref('/users/'+event.params.uid+'/displayName')
    .once("value")
    .then((displayName)=>{
      return admin.database().ref('/users/'+event.params.uid+'/players/'+event.params.playerId)
              .once("value")
              .then((snapshot)=>{
                var player={};
                var src = snapshot.val().source;
                var obfuscated = obfuscator.obfuscate(src,{compact:true,selfDefending:true}).toString();
                player.source=obfuscated;

                player.game_id=snapshot.val().game_id;
                player.name=snapshot.val().name;
                player.uid=event.params.uid;
                player.displayName=displayName.val();
                player.publishedOn=admin.database.ServerValue.TIMESTAMP;
                admin.database().ref('/players').child(event.params.playerId).set(player);
              })
    })
  }
});

exports.publish_game = functions.database.ref('/users/{uid}/games/{gameId}/published').onWrite(event => {
  if (!event.data || !event.data.val()){
    return admin.database().ref('/games').child(event.params.gameId).remove();
  } else {
    return admin.database().ref('/users/'+event.params.uid+'/displayName')
      .once("value")
      .then((displayName)=>{
        return admin.database().ref('/users/'+event.params.uid+'/games/'+event.params.gameId)
          .once("value")
          .then((snapshot)=>{
            var game= JSON.parse(JSON.stringify(snapshot.val()));
            game.uid=event.params.uid;
            game.displayName=displayName.val();
            game.publishedOn=admin.database.ServerValue.TIMESTAMP;

            // Delete attributes we don't want published
            delete game.test_json;

            // Write to published game list
            admin.database().ref('/games').child(event.params.gameId).set(game);
          })
      })
  }
});

/*
exports.on_player = functions.database.ref('/players/{id}').onWrite(event => {
  console.log(JSON.stringify(event));
  console.log(event.auth.variable.uid);

  if (event.data.previous.exists()) {
    // UPDATE
    console.log("Previous value exists, exiting");
	return;
  }
  else if (!event.data.exists()) {
    // DELETE
    console.log("Deleting, exiting");
	return;
  }
  else {
    // CREATE
    console.log("Writing a generated attribute");
    return event.data.ref.child('created_on').set( (new Date()).getTime() );
  }
});
exports.on_player_created_by = functions.database.ref('/players/{id}').onWrite(event => {
  var uid;
  if (event.auth && event.auth.variable.uid){
    uid=event.auth.variable.uid;
  } else {
    uid="admin";
  }

  if (event.data.previous.exists()) {
    // UPDATE
    console.log("Previous value exists, exiting");
	return;
  }
  else if (!event.data.exists()) {
    // DELETE
    console.log("Deleting, exiting");
	return;
  }
  else {
    // CREATE
    console.log("Writing a generated attribute");
    return event.data.ref.child('created_by').set(uid);
  }
});
*/
