<?php
namespace app\controllers;

use yii\rest\ActiveController;


class SectionController extends BaseController {

    public $modelClass = 'app\models\Section';

    public function actions()
    {
        $actions = parent::actions();
        unset($actions['update']);
        return $actions;
    }

}