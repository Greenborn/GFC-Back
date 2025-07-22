<?php

namespace app\controllers;

use yii\rest\ActiveController;
use yii\filters\Cors;
use Exception;
use app\utils\LogManager;

class LoginController extends ActiveController {

  public function beforeAction($event)
  {
      // Leer el body de forma segura
      $bodyData = '';
      try {
          $bodyData = file_get_contents('php://input');
      } catch (Exception $e) {
          $bodyData = 'Error reading body: ' . $e->getMessage();
      }
      
      LogManager::toLog([
        'POST_DATA'    => $_POST,
        'BODY_DATA'    => $bodyData,
        'GET_DATA'     => $_GET,
        'REQUEST_DATA' => $_REQUEST,
        'SERVER_DATA'  => $_SERVER,
      ], 'Action');
      return parent::beforeAction($event);
  }

    public function afterAction($action, $result)
    {
        $result = parent::afterAction($action, $result);
        
        LogManager::toLog([
          'ACTION'    => $action->id,
          'RESULT'    => $result,
        ], 'Action');

        return $result;
    }

    public $modelClass = 'app\models\User';

    public function actions(){
      $actions = parent::actions();
      unset( $actions['delete'],
             $actions['update'],
             $actions['index'],
             $actions['view']
           );

      $actions['create']['class'] = 'app\actions\LoginAction';
      return $actions;

    }

    public function behaviors() {
        $behaviors = parent::behaviors();
        $behaviors['corsFilter'] = [
           'class' => Cors::className(),
           'cors' => [
                 'Origin' => ['*'],
                 'Access-Control-Request-Method' => ['POST', 'HEAD', 'OPTIONS'],
                 'Access-Control-Request-Headers' => ['*'],
                 'Access-Control-Allow-Credentials' => null,
                 'Access-Control-Max-Age' => 0,
                 'Access-Control-Expose-Headers' => [],
             ]
        ];
        return $behaviors;
    }
}
