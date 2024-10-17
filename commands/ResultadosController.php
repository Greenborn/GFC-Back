<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\Contest;
use app\models\ContestResult;

const CACHE_PATH = "web/cache/";

class ResultadosController extends Controller
{
    public function actionGenerarCacheResultados(){

        $concursos = Contest::find()->all();
        foreach ($concursos as $key => $concurso) {
            $resultados = ContestResult::find()
                            ->where(['contest_id' => $concurso->id])
                            ->joinWith('image')
                            ->joinWith('image.profile')
                            ->joinWith('image.thumbnail')
                            ->asArray()
                            ->all();

            $jsonResultados = json_encode($resultados);
            file_put_contents(CACHE_PATH."results_contest_".$concurso->id.".json", $jsonResultados);
            var_dump($jsonResultados);
        }
    }
}