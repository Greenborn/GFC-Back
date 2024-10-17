<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\Contest;
use app\models\ContestResult;

const CACHE_PATH = "/var/www/gfc.prod-api.greenborn.com.ar/web/cache/";

class ResultadosController extends Controller
{

    public static function refreshCacheContest( $id ){
        $contest    = Contest::findOne([ 'id' => $id ]);
        $resultados = ContestResult::find()
                            ->where(['contest_id' => $id])
                            ->joinWith('image')
                            ->joinWith('image.thumbnail')
                            ->orderBy(['code' => SORT_ASC]);

        if ($contest->judged)
            $resultados = $resultados->joinWith('image.profile');

        $resultados = $resultados->asArray()->all();

        $jsonResultados = json_encode($resultados);
        file_put_contents(CACHE_PATH."results_contest_".$id.".json", $jsonResultados);
        return $jsonResultados;
    }

    public function actionGenerarCacheResultados(){

        $concursos = Contest::find()->all();
        foreach ($concursos as $key => $concurso) {
            var_dump(self::refreshCacheContest($concurso->id));
        }
    }
}