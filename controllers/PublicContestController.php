<?php
namespace app\controllers;

use yii\rest\ActiveController;


class PublicContestController extends BaseController {

    protected bool $autenticator = false;

    public $modelClass = 'app\models\Contest';

    public function actions(){
        $actions = parent::actions();
        unset( $actions['delete'],
               $actions['update'],
               $actions['create'],
             );
        return $actions;
    }
}