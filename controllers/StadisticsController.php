<?php
namespace app\controllers;

use yii\rest\ActiveController;


use app\components\HttpTokenAuth;
use app\models\VistaDetallePerfil;
use yii\filters\Cors;

class StadisticsController extends BaseController {

    public $modelClass = 'app\models\VistaDetallePerfil';
    public function prepareDataProvider(){
        return VistaDetallePerfil::find()->all();
     }

    public function actions(){

    $actions = parent::actions();

    // disable the "delete", "update" and "create" actions
    unset($actions['delete'], $actions['create'], $actions['update']);

    // customize the data provider preparation with the "prepareDataProvider()" method
    $actions['index']['prepareDataProvider'] = [$this, 'prepareDataProvider'];

    return $actions;
}

public function behaviors() {
    $behaviors = parent::behaviors();
    if ($this->autenticator){
      $behaviors['authenticator'] = [
          'class' => HttpTokenAuth::className(),
           'except' => ['options'],
      ];
    }
    $behaviors['corsFilter'] = [
       'class' => Cors::className(),
       'cors' => [
             'Origin' => ['*'],
             'Access-Control-Request-Method' => ['GET', 'HEAD', 'OPTIONS'],
             'Access-Control-Request-Headers' => ['*'],
             'Access-Control-Allow-Credentials' => null,
             'Access-Control-Max-Age' => 0,
             'Access-Control-Expose-Headers' => [],
         ]
    ];
    return $behaviors;
}


}
