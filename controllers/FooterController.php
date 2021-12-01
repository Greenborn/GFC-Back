<?php
namespace app\controllers;

use yii\rest\ActiveController;


class FooterController extends BaseController {

    protected bool $autenticator = false;
    public $modelClass = 'app\models\Footer';

}