<?php
namespace app\actions;

use Yii;
use yii\rest\ViewAction;

use app\models\ContestResult;
use app\models\Contest;
use app\models\ProfileContest;
use app\models\MetricAbm;
use app\utils\LogManager;

const BASE_PATH    = '/var/www/gfc.prod-api.greenborn.com.ar/';
const RUNTIME_DIR  = 'runtime/';
const TEMP_DIR     = 'tmp/';
const TEMP_PATH    = BASE_PATH.RUNTIME_DIR.TEMP_DIR;
const EXPOR_DIR    = 'exportacion/';
const WEB_PATH     = BASE_PATH.'web/';
const LOGS_PATH    = BASE_PATH.RUNTIME_DIR;

class CompressedPhotosGetAction extends ViewAction {

    public function run( $id ) {
        $params = Yii::$app->getRequest()->getBodyParams();

        $response = Yii::$app->getResponse();
        $response->format = \yii\web\Response::FORMAT_JSON;

        $response->data = [
            'status' => true,
            'download_url' => $this->photo_export( $id ),
        ];                     
    }

    private function execCmd($cmd){
      $output_cmd=null;
      exec( $cmd, $output_cmd );
      LogManager::toLog([ 'cmd' => $cmd, 'out' => $output_cmd ], 'CompressedPhotosGetAction');
    }

    public function photo_export( $concurso ) {
    
        $contest  = Contest::findOne([ 'id' => $concurso ]);
        $tipo_org = $contest->organization_type;
        $resultadoConcurso = ContestResult::find()->where([ 'contest_id' => $concurso ])->all();
        
        LogManager::toLog('Iniciando Exportación', 'CompressedPhotosGetAction');
                
        chdir( TEMP_PATH );
        if (file_exists(EXPOR_DIR)){
          $this->execCmd( 'rm -rf '.EXPOR_DIR );
        }
        $res_dir = mkdir( EXPOR_DIR, 0777, true );
        LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.EXPOR_DIR, 'CompressedPhotosGetAction');
    
        $metrics = MetricAbm::find()->where(["organization_type" => $tipo_org])->all();
        
        if ($tipo_org == 'EXTERNO_UNICEN'){
          if (!file_exists(TEMP_PATH.EXPOR_DIR.'/seleccionada')){
            $res_dir = mkdir(TEMP_PATH.EXPOR_DIR.'/seleccionada', 0777, true);
            LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.TEMP_PATH.EXPOR_DIR.'/seleccionada', 'CompressedPhotosGetAction');
          }
        }

        for ($c=0; $c < count($resultadoConcurso); $c++){
            $resultado_ = $resultadoConcurso[$c];  

            $categoria_path = preg_replace("/[^A-Za-z0-9 ]/", '', ProfileContest::find()->where(['contest_id' => $concurso, 'profile_id' => $resultado_->image->profile->id ])->one()->category->name );
            if (!file_exists(TEMP_PATH.EXPOR_DIR.$categoria_path)){
              $res_dir = mkdir( TEMP_PATH.EXPOR_DIR.$categoria_path, 0777, true );
              LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.TEMP_PATH.EXPOR_DIR.$categoria_path, 'CompressedPhotosGetAction');
            }
      
            $seccion = $resultado_->section->name;
            if (!file_exists(TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion)){
              $res_dir = mkdir(TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion, 0777, true);
              LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion, 'CompressedPhotosGetAction');
            }
// INTERNO y EXTERNO_0
            if ($tipo_org == 'INTERNO' || $tipo_org == 'EXTERNO_0'){
              for ($i=0; $i < count($metrics); $i++){
                $path = TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$metrics[$i]->prize;
                if (!file_exists( $path ))
                $res_dir = mkdir( $path, 0777, true);
                LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.$path, 'CompressedPhotosGetAction');
              }
        
              $origen  = WEB_PATH.$resultado_->image->url;
              $destino = TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$resultado_->image->code.".jpg";
              $res_copy = copy($origen, $destino);
              LogManager::toLog('Copiando '.($res_copy ? 'true': 'false').' : '.$origen.' > '.$destino, 'CompressedPhotosGetAction');
// EXTERNO_UNICEN
            } else if ($tipo_org == 'EXTERNO_UNICEN'){
              
              $organization = $resultado_->image->profile->fotoclub->name;
              
              if (!file_exists(TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$organization)){
                $res_dir = mkdir(TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$organization, 0777, true);
                LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$organization, 'CompressedPhotosGetAction');
              }

              if (!file_exists(TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$organization.'/seleccionada')){
                $res_dir = mkdir(TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$organization.'/seleccionada', 0777, true);
                LogManager::toLog('Creando dir: '.($res_dir ? 'true': 'false').' '.TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$organization.'/seleccionada', 'CompressedPhotosGetAction');
              }
        
              $origen  = WEB_PATH.$resultado_->image->url;
              $destino = TEMP_PATH.EXPOR_DIR.$categoria_path.'/'.$seccion.'/'.$organization.'/'.$resultado_->image->code.".jpg";
              $res_copy = copy($origen, $destino);
              LogManager::toLog('Copiando '.($res_copy ? 'true': 'false').' : '.$origen.' > '.$destino, 'CompressedPhotosGetAction');
            }
        }
        $arch_zip = 'concurso_'.$concurso.'.zip';

        chdir( TEMP_PATH );
    
        $this->execCmd('zip -r '.$arch_zip.' exportacion');

        $this->execCmd('mv '.$arch_zip.' '.WEB_PATH.$arch_zip);
        
        LogManager::toLog('Exportación finalizada', 'CompressedPhotosGetAction');
        return 'concurso_'.$concurso.'.zip';
        
        
    }
}
