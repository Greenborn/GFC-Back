<?php

namespace app\controllers;

use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;
use yii\filters\Cors;

use app\components\HttpTokenAuth;
use app\traits\Filterable;

class BaseController extends ActiveController {

    use Filterable;

    public $serializer = [
        'class' => 'yii\rest\Serializer',
        'collectionEnvelope' => 'items'
    ];

    // index: list resources page by page;
    // view: return the details of a specified resource;
    // create: create a new resource;
    // update: update an existing resource;
    // delete: delete the specified resource;
    // options: return the supported HTTP methods.
    public function actions(){
      $actions = parent::actions();
      $actions['index']['prepareDataProvider'] = [$this, 'prepareDataProvider'];
      return $actions;
    }

    public function behaviors() {
        $behaviors = parent::behaviors();
        $behaviors['authenticator'] = [
            'class' => HttpTokenAuth::className(),
             'except' => ['options'],
        ];
        $behaviors['corsFilter'] = [
           'class' => Cors::className(),
           'cors' => [
                 'Origin' => ['*'],
                 'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
                 'Access-Control-Request-Headers' => ['*'],
                 'Access-Control-Allow-Credentials' => null,
                 'Access-Control-Max-Age' => 0,
                 'Access-Control-Expose-Headers' => [],
             ]
        ];
        return $behaviors;
    }

    protected function getAccessToken(){
      return HttpTokenAuth::getToken();
    }

    public function prepareDataProvider(){
      $query = $this->modelClass::find();

      $query = $this->addFilterConditions($query);

      return new ActiveDataProvider([
        'query' => $query->orderBy(['id' => SORT_ASC]),
      ]);
    }

}
