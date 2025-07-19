<?php
namespace app\controllers;

use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;
use Exception;

class FotoclubController extends BaseController {

    protected $autenticator = false;
    //TODO: solo no necesita autentificacion para get, para lo demas si, modificar¿? en footer tambien
    public $modelClass = 'app\models\Fotoclub';

    public function prepareDataProvider(){
        try {
            $query = $this->modelClass::find();
      
            $query = $this->addFilterConditions($query);
      
            return new ActiveDataProvider([
              'query' => $query->orderBy(['name' => SORT_ASC]),
              'pagination' => [
                    'pageSize' => 500
              ]
            ]);
        } catch (Exception $e) {
            // En caso de error, retornar una consulta básica
            error_log("Error en FotoclubController::prepareDataProvider: " . $e->getMessage());
            return new ActiveDataProvider([
                'query' => $this->modelClass::find()->orderBy(['name' => SORT_ASC]),
                'pagination' => [
                    'pageSize' => 500
                ]
            ]);
        }
    }

    public function behaviors() {
        $behaviors = parent::behaviors();
        
        // Asegurar que OPTIONS no pase por prepareDataProvider
        $behaviors['corsFilter'] = [
           'class' => \yii\filters\Cors::className(),
           'cors' => [
                 'Origin' => ['*'],
                 'Access-Control-Request-Method' => ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
                 'Access-Control-Request-Headers' => ['*'],
                 'Access-Control-Allow-Credentials' => false,
                 'Access-Control-Max-Age' => 86400,
                 'Access-Control-Expose-Headers' => ['Content-Length', 'Content-Range'],
             ]
        ];
        
        return $behaviors;
    }

}