<?php
namespace app\controllers;

use Yii;
use yii\rest\ActiveController;
use yii\data\ActiveDataProvider;

class CompressedPhotosController extends BaseController {

    public $modelClass = 'app\models\ContestRecord';

    public function actions(){
        $actions = parent::actions();
        $actions['view']['class'] = 'app\actions\CompressedPhotosGetAction';
        return $actions;
    } 
}