//creamos el modulo y lo asignamos a app, para evitar escribir 
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
})