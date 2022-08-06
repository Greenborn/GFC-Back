<?php

namespace app\controllers;

use Yii;
use yii\web\Controller;

use app\models\ProfilesRanking;
use app\models\FotoclubRanking;

class RankingController extends Controller {
    public function actionGetranks() {
      \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
      return [
        'profiles'  => ProfilesRanking::find()->asArray()->all(),
        'fotoclubs' => FotoclubRanking::find()->asArray()->all()
      ];
    }
}