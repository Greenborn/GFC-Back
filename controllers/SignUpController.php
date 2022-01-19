<?php

namespace app\controllers;

use Yii;
use app\models\User;
use app\models\Profile;
use yii\web\Controller;
use yii\web\NotFoundHttpException;
use yii\filters\Cors;

class SignUpController extends BaseController
{
    public $modelClass = 'app\models\User';

    public function actions(){
      $actions = parent::actions();
      unset( $actions['delete'],
             $actions['index'],
             $actions['view']
           );

      $actions['create']['class'] = 'app\actions\SignUpAction';
      $actions['update']['class'] = 'app\actions\ValidateVerifyCodeAction';
      return $actions;

    }

    public $enableCsrfValidation = false; 
    protected bool $autenticator = false;

}