<?php

namespace app\controllers;

use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;
use yii\filters\Cors;

use app\components\HttpTokenAuth;
use app\traits\Filterable;
use app\utils\LogManager;

class BaseController extends ActiveController {

    use Filterable;
    protected bool $autenticator = true;

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
                 'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
                 'Access-Control-Request-Headers' => ['*'],
                 'Access-Control-Allow-Credentials' => null,
                 'Access-Control-Max-Age' => 0,
                 'Access-Control-Expose-Headers' => [],
             ]
        ];
        return $behaviors;
    }

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
