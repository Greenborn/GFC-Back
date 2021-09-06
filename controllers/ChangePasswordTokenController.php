<?php

namespace app\controllers;

use yii\rest\ActiveController;
use yii\filters\Cors;

class ChangePasswordTokenController extends BaseController {

    public $modelClass = 'app\models\User';

    public function actions(){
      $actions = parent::actions();
      unset( $actions['delete'],
             $actions['create'],
             $actions['index'],
             $actions['view']
           );

      $actions['update']['class'] = 'app\actions\ChangePasswordTokenAction';
     
      
      return $actions;
    }
/*
    public function behaviors() {
      $behaviors = parent::behaviors();
      $behaviors['corsFilter'] = [
         'class' => Cors::className(),
         'cors' => [
               'Origin' => ['*'],
               'Access-Control-Request-Method' => ['POST', 'PUT' , 'HEAD', 'OPTIONS'],
               'Access-Control-Request-Headers' => ['*'],
               'Access-Control-Allow-Credentials' => null,
               'Access-Control-Max-Age' => 0,
               'Access-Control-Expose-Headers' => [],
           ]
      ];
      return $behaviors;
    }
*/
}