//desde aquí hacemos uso del objeto app que es nuestro modulo
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
})