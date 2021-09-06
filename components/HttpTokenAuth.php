<?php
namespace app\components;

use Yii;
use yii\filters\auth\HttpBearerAuth;

class HttpTokenAuth extends HttpBearerAuth{

  public static function getToken(){
    $auth = Yii::$app->request->headers->get('Authorization');
    $auth = explode(" ", trim($auth));

    return $auth[1];

  }

}
