<?php
namespace app\actions;

use Yii;
use yii\rest\ViewAction;

use app\models\ContestResult;
use app\models\ProfileContest;

const TEMP_PATH = '/var/www/gfc.api.greenborn.com.ar/web/tmp/exportacion/';
const WEB_PATH  = '/var/www/gfc.api.greenborn.com.ar/web/';

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

    public function photo_export( $concurso ) {
    
        $resultadoConcurso = ContestResult::find()->where([ 'contest_id' => $concurso ])->all();
        
        if (file_exists(TEMP_PATH)){
          exec( 'rm -rf '. TEMP_PATH );
        }
        mkdir(TEMP_PATH);
    
        for ($c=0; $c < count($resultadoConcurso); $c++){
              
          $categoria = ProfileContest::find()->where(['contest_id' => $concurso, 'profile_id' => $resultadoConcurso[$c]->image->profile->id ])->one()->category->name;
          if (!file_exists(TEMP_PATH.$categoria)){
            mkdir(TEMP_PATH.$categoria);
          }
    
          $seccion = $resultadoConcurso[$c]->section->name;
          if (!file_exists(TEMP_PATH.$categoria.'/'.$seccion)){
            mkdir(TEMP_PATH.$categoria.'/'.$seccion);
          }
    
          $destino = TEMP_PATH.$categoria.'/'.$seccion.'/'.$resultadoConcurso[$c]->image->code.".jpg";
    
          exec( "cp ".WEB_PATH.$resultadoConcurso[$c]->image->url.' '.$destino);
        }
    
        exec('zip -r '.WEB_PATH.'/concurso_'.$concurso.'.zip '.TEMP_PATH);
        
        return 'concurso_'.$concurso.'.zip';
      }
}
