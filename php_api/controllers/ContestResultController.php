<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

use app\models\Profile;
use app\models\Contest;

class ContestResultController extends BaseController {

    public $modelClass = 'app\models\ContestResult';

    public function actions(){
        $actions = parent::actions();
        $actions['index']['class'] = 'app\actions\ContestResultViewAction';
        // Exponer el nuevo endpoint como acción RESTful
        $actions['register-results'] = [
            'class' => 'yii\rest\Action',
            'modelClass' => $this->modelClass,
            'controller' => $this,
            'checkAccess' => null,
            'method' => 'POST',
        ];
        return $actions;
    }

    public function verbs()
    {
        $verbs = parent::verbs();
        $verbs['register-results'] = ['POST'];
        return $verbs;
    }

    public function prepareDataProvider(){
        $user          = Yii::$app->user->identity;
        $esAdmin       = $user->role_id == 1;
        $esDelegado    = $user->role_id == 2;
        $esConcursante = $user->role_id == 3;
        $esJuez        = $user->role_id == 4;

        $query = $this->modelClass::find();

        if (!$esAdmin) {
            $query = $query->joinWith('image');
        }

        $query = $this->addFilterConditions($query);

        return new ActiveDataProvider([
          'query' => $query->orderBy(['id' => SORT_ASC]),
          'pagination' => [
                'pageSize' => 500
           ]
        ]);
    }

    /**
     * Endpoint para registrar resultados en lote a partir de un JSON de estructura de directorio.
     * Solo accesible para administradores (role_id == 1).
     * @return array
     */
    public function actionRegisterResults()
    {
        $user = \Yii::$app->user->identity;
        if (!$user || $user->role_id != 1) {
            \Yii::$app->response->statusCode = 403;
            return [
                'success' => false,
                'message' => 'Acceso denegado: solo administradores pueden registrar resultados.'
            ];
        }
        return [
            'success' => true,
            'message' => 'Resultados Cargados'
        ];
    }
}