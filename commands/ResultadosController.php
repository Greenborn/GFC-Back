<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\Contest;
use app\models\ContestResult;

const CACHE_PATH = "web/cache/";

class ResultadosController extends Controller
{

    public function refreshCacheContest( $id ){
        $resultados = ContestResult::find()
                            ->where(['contest_id' => $id])
                            ->joinWith('image')
                            ->joinWith('image.profile')
                            ->joinWith('image.thumbnail')
                            ->asArray()
                            ->all();

        $jsonResultados = json_encode($resultados);
        file_put_contents(CACHE_PATH."results_contest_".$id.".json", $jsonResultados);
        return $jsonResultados;
    }

    public function actionGenerarCacheResultados(){

        $concursos = Contest::find()->all();
        foreach ($concursos as $key => $concurso) {
            var_dump($this->refreshCacheContest($concurso->id));
        }
    }
}