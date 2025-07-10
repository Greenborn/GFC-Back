<?php

namespace app\controllers;

use yii\rest\ActiveController;

class ChangePasswordController extends BaseController {

    public $modelClass = 'app\models\User';

    public function actions(){
      $actions = parent::actions();
      unset( $actions['delete'],
             $actions['create'],
             $actions['index'],
             $actions['view']
           );

      $actions['update']['class'] = 'app\actions\ChangePasswordAction';
      return $actions;

    }

}