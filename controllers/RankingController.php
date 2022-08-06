<?php

namespace app\controllers;

use Yii;
use yii\web\Controller;
use yii\filters\Cors;

use app\models\ProfilesRanking;
use app\models\FotoclubRanking;

class RankingController extends Controller {
    public function actionGetranks() {
      \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
      return [ 
        'items' => [
          'profiles'  => ProfilesRanking::find()->asArray()->all(),
          'fotoclubs' => FotoclubRanking::find()->asArray()->all()
        ]     
      ];
    }

    public function behaviors() {
      $behaviors = parent::behaviors();
      $behaviors['corsFilter'] = [
         'class' => Cors::className(),
         'cors' => [
               'Origin' => ['*'],
               'Access-Control-Request-Method' => ['GET', 'HEAD', 'OPTIONS'],
               'Access-Control-Request-Headers' => ['*'],
               'Access-Control-Allow-Credentials' => null,
               'Access-Control-Max-Age' => 0,
               'Access-Control-Expose-Headers' => [],
           ]
      ];
      return $behaviors;
  }
}
