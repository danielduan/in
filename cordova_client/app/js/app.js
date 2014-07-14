URL = "https://in-app.herokuapp.com/";

(function(){
	'use strict';
	var Onsen = angular.module('In', ['onsen.directives']);

	Onsen.controller('signup', function($scope) {
		$scope.signup_submitted = false;
		$scope.status = '';

		$scope.register = function() {
			if (!$scope.email) {
				$scope.status = "Please enter an email."
			} else if (!$scope.username) {
				$scope.status = "Please enter a username."
			} else if (!$scope.password || !$scope.confirm_password) {
				$scope.status = "Please enter a password."
			} else if ($scope.password !== !$scope.confirm_password) {
				$scope.status = "Passwords do not match."
			}

			$scope.status = '';

			$scope.registration = {
				email: $scope.email,
				password: $scope.password,
				username: $scope.username
			}
			
			console.log($scope.registration);

			$.ajax({
	        type: 'POST',
	        url: URL + 'mobile/signup/',
					data: $scope.registration,
	        timeout: 60 * 1000
	    }).done(function (msg) {
	        $scope.status = msg;
	    }).fail(function (jqXHR, textStatus) {
	        $scope.status = textStatus;
	    });
		}

	});
})();

//var Onsen = angular.module('Onsen',[]);
