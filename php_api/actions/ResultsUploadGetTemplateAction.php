<?php
namespace app\actions;

use Yii;
use yii\rest\ViewAction;

use app\models\ContestResult;
use app\models\ProfileContest;
use app\utils\LogManager;
use app\models\MetricAbm;

const BASE_PATH    = '/var/www/gfc.prod-api.greenborn.com.ar/';
const RUNTIME_DIR  = 'runtime/';
const TEMP_DIR     = 'tmp/';
const TEMP_PATH    = BASE_PATH.RUNTIME_DIR.TEMP_DIR;
const WEB_PATH     = BASE_PATH.'web/';
const LOGS_PATH    = BASE_PATH.RUNTIME_DIR;

class ResultsUploadGetTemplateAction extends ViewAction {
    public function run( $id ) {
        $response = Yii::$app->getResponse();
        $response->format = \yii\web\Response::FORMAT_JSON;

        $response->data = [
            'status' => true,
            'download_url' => $this->get_juzge_template( $id ),
        ];                     
    }

    private function execCmd($cmd){
        $output_cmd=null;
        exec( $cmd, $output_cmd );
        LogManager::toLog([ 'cmd' => $cmd, 'out' => $output_cmd ], 'CompressedPhotosGetAction');
    }

    private function get_juzge_template( $concurso ){
        LogManager::toLog('Creando template de juzgamiento, concurso: '.$concurso, 'ResultsUploadGetTemplateAction');
        $template_dir = 'juzgamiento_concurso_'.$concurso.'/';

        chdir( TEMP_PATH );
        if (file_exists($template_dir)){
          $this->execCmd( 'rm -rf '.$template_dir);
        }
        $res_dir = mkdir( $template_dir, 0777, true );
        LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.$template_dir, 'ResultsUploadGetTemplateAction');

        $resultadoConcurso = ContestResult::find()->where([ 'contest_id' => $concurso ])->all();
        $metrics = MetricAbm::find()->all();
        for ($c=0; $c < count($resultadoConcurso); $c++){
              
            $categoria = ProfileContest::find()->where(['contest_id' => $concurso, 'profile_id' => $resultadoConcurso[$c]->image->profile->id ])->one()->category->name;
            if (!file_exists(TEMP_PATH.$template_dir.$categoria)){
              $res_dir = mkdir( TEMP_PATH.$template_dir.$categoria, 0777, true );
              LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.TEMP_PATH.$template_dir.$categoria, 'ResultsUploadGetTemplateAction');
            }
      
            $seccion = $resultadoConcurso[$c]->section->name;
            if (!file_exists(TEMP_PATH.$template_dir.$categoria.'/'.$seccion)){
              $res_dir = mkdir(TEMP_PATH.$template_dir.$categoria.'/'.$seccion, 0777, true);
              LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.TEMP_PATH.$template_dir.$categoria.'/'.$seccion, 'ResultsUploadGetTemplateAction');
            }

            for ($i=0; $i < count($metrics); $i++){
                $res_dir = mkdir(TEMP_PATH.$template_dir.$categoria.'/'.$seccion.'/'.$metrics[$i]->prize, 0777, true);
                LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.TEMP_PATH.$template_dir.$categoria.'/'.$seccion.'/'.$metrics[$i]->prize, 'ResultsUploadGetTemplateAction');
            }
        }

        chdir( TEMP_PATH );
        $arch_zip = 'juzgamiento_concurso_'.$concurso.'.zip';
        $this->execCmd('zip -r '.$arch_zip.' '.'juzgamiento_concurso_'.$concurso);

        $this->execCmd('mv '.$arch_zip.' '.WEB_PATH.$arch_zip);
        return $arch_zip;
    }
}