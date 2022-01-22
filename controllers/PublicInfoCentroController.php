<?php
namespace app\controllers;

use yii\rest\ActiveController;


class PublicInfoCentroController extends BaseController {

    protected bool $autenticator = false;

    public $modelClass = 'app\models\InfoCentro';

    public function actions(){
        $actions = parent::actions();
        unset( $actions['delete'],
               $actions['update'],
               $actions['create'],
             );
        return $actions;
    }
}