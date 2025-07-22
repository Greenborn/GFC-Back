<?php
namespace app\actions;

use Yii;
use yii\rest\IndexAction;
use yii\helpers\Url;
use yii\web\BadRequestHttpException;

use app\models\Contest;
use app\models\ContestResult;

class ContestResultViewAction extends IndexAction {
    public function run() {
        \Yii::$app->response->format = \yii\web\Response::FORMAT_JSON;
        $query_params = Yii::$app->getRequest()->getQueryParams();
        $contest_id = $query_params['filter']['contest_id'];
        $profile_id = false;

        if (isset($query_params['filter']['profile_id']))
            $profile_id = $query_params['filter']['profile_id'];

        $contest    = Contest::findOne([ 'id' => $contest_id ]);
        $resultados = ContestResult::find()
                            ->where(['contest_id' => $contest_id])
                            ->joinWith('image')
                            ->joinWith('image.thumbnail')
                            ->orderBy(['code' => SORT_ASC]);

        if ($contest->judged){
            $resultados = $resultados
                            ->joinWith('image.profile')
                            ->joinWith('metric');
        }

        if ($profile_id && $contest->judged)
            $resultados = $resultados->andWhere(['image.profile_id' => $profile_id]);

        $resultados = $resultados->asArray()->all();
        return [
            "items" => $resultados,
            "_meta" => [
                "totalCount" => count($resultados),
                "pageCount" => 1,
                "currentPage" => 1,
                "perPage" => 1000
            ],
            "_links" => [
                "self" => [
                    "href" => "https://gfc.prod-api.greenborn.com.ar/contest-result?viewpage=contest-result&expand=image.profile%2Cimage.thumbnail&filter%5Bcontest_id%5D=35&page=1&per-page=1000"
                ],
                "first" => [
                    "href" => "https://gfc.prod-api.greenborn.com.ar/contest-result?viewpage=contest-result&expand=image.profile%2Cimage.thumbnail&filter%5Bcontest_id%5D=35&page=1&per-page=1000"
                ],
                "last" => [
                    "href" => "https://gfc.prod-api.greenborn.com.ar/contest-result?viewpage=contest-result&expand=image.profile%2Cimage.thumbnail&filter%5Bcontest_id%5D=35&page=1&per-page=1000"
                ]
            ]
        ];
    }
}