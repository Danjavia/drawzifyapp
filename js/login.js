$( document ).on( 'ready', function ( ) {

	$( '.login' ).on( 'submit', function () {
		var email = $( '#email' ).val();
		var password = $( '#password' ).val();
		authClient.createUser( email, password, function( error,  user ) {
		  	if ( ! error ) {
		  	  	console.log( 'User Id: ' + user.id + ', Email: ' + user.email );
		  	} else {
		  	  	console.log( error );
		  	}
		});
	});
});