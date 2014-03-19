var myapp = angular.module( 'myapp', [ 'firebase' ] );

myapp.controller( 'BookCtrl', [ '$scope', 'angularFire',  
  	function BookCtrl( $scope, angularFire ) {
			var url = 'https://drawzifyapp.firebaseio.com/';
			var promise = angularFire( url, $scope, 'books', [] );
			$scope.newBook = {};
		
			promise.then( function() {
				startWatch( $scope );
			});
  	}
]);

function startWatch( $scope ) {  
 	$scope.add = function() {
		console.log( $scope.newBook );
		$scope.books.push( $scope.newBook );
		$scope.newBook = '';
 	}
}