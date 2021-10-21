<?php
namespace app\controllers;

use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

use app\modules\v1\models\User;



class UserController extends BaseController {

    public $modelClass = 'app\models\User';

    public function actions(){
        $actions = parent::actions();
        $actions['create']['class'] = 'app\actions\UserCreateAction';
        $actions['update']['class'] = 'app\actions\UserUpdateAction';
        return $actions;
    } 
      
    public function actionIndex() {
       return new ActiveDataProvider([
         'query' => User::find(),
       ]);
    }

}
