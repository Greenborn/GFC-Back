<?php

namespace app\controllers;

use Yii;
use yii\web\Controller;
use yii\filters\Cors;

use app\models\ProfilesRankingCategorySection;
use app\models\FotoclubRanking;
use app\models\Section;
use app\models\Category;

class RankingController extends Controller {
    public function actionGetranks() {
      \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
      return [ 
        'items' => [
          'profiles'  => ProfilesRankingCategorySection::find()->asArray()->all(),
          'fotoclubs' => FotoclubRanking::find()->asArray()->all(),
          'Section'   => Section::find()->asArray()->all(),
          'Category'  => Category::find()->where(['mostrar_en_ranking' => 1])->asArray()->all()
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
