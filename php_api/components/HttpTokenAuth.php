<?php
namespace app\components;

use Yii;
use yii\filters\auth\HttpBearerAuth;

class HttpTokenAuth extends HttpBearerAuth{

  public static function getToken(){
    $auth = Yii::$app->request->headers->get('Authorization');
    
    // Si no hay header Authorization, retornar null
    if (empty($auth)) {
      return null;
    }
    
    // Verificar que el header tenga el formato correcto "Bearer <token>"
    $parts = explode(" ", trim($auth));
    
    // Si no hay suficientes partes o no es Bearer, retornar null
    if (count($parts) !== 2 || strtolower($parts[0]) !== 'bearer') {
      return null;
    }
    
    return $parts[1];
  }

}
