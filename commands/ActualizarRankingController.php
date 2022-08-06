<?php
/**
 * @link http://www.yiiframework.com/
 * @copyright Copyright (c) 2008 Yii Software LLC
 * @license http://www.yiiframework.com/license/
 */

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\Metric;
use app\models\Image;
use app\models\ContestResult;
use app\models\Fotoclub;
use app\models\Profile;
use app\models\ProfilesRanking;
use app\models\FotoclubRanking;


function actualizar_ranking(){
  echo "Actualizando ranking \n";

  $perfiles  = Profile::find()->all();
  $fotoclubs = Fotoclub::find()->all();
  
  for ($c=0; $c < count($fotoclubs); $c++){
    $rank_fotoclub = FotoclubRanking::find()->where(['id' => $fotoclubs[$c]->id])->one();
    
    if(!$rank_fotoclub){
      $rank_fotoclub              = new FotoclubRanking();
      $rank_fotoclub->fotoclub_id = $fotoclubs[$c]->id;
      $rank_fotoclub->name        = $fotoclubs[$c]->name;
      
    }

    $rank_fotoclub->score       = 0;
    $rank_fotoclub->prizes      = '[]';
    $rank_fotoclub->save(false);
  }
  

  for ($c=0; $c < count($perfiles); $c++){
    $perfil = $perfiles[$c];

    $nombre = $perfil->last_name.', '.$perfil->name;
    echo "Perfil: ".$nombre."\n";

    $rank = ProfilesRanking::find()->where([ 'profile_id' => $perfil->id ])->one();
    if (!$rank){
      echo "No se encontro registro de ranking, creando nuevo registro \n";
      $rank             = new ProfilesRanking();
      $rank->name       = $nombre;
      $rank->profile_id = $perfil->id;
      $rank->score      = 0;
      $rank->prizes     = '[]';
      $rank->save(false);
    }

    $puntaje = 0;
    $premios = [];

    echo "Buscando premios \n";
    $fotos = Image::find()->where(['profile_id' => $perfil->id])->all();
    for ($i=0; $i < count($fotos); $i++){
      $foto = $fotos[$i];

      $calificacion = ContestResult::find()->where([ 'image_id' => $foto->id ])->one();

      if ($calificacion){
        $calificacion = $calificacion->metric;

        echo "-> Foto ".$foto->title." premio ".$calificacion->prize." puntaje ".$calificacion->score."\n";

        $puntaje +=  $calificacion->score;
        
        if (!isset($premios[$calificacion->prize])){
          $premios[$calificacion->prize] = 0;
        }

        $premios[$calificacion->prize] += 1;
      }            
    }

    echo "Añadiendo premios al ranking \n";
    $rank->score  = $puntaje;
    $rank->prizes = json_encode($premios);
    $rank->save(false);

    $rank_fotoclub = FotoclubRanking::find()->where(['fotoclub_id' => $perfil->fotoclub_id])->one();
    if ($rank_fotoclub){
      $rank_fotoclub->score += $puntaje;

      $premios_fotoclub = json_decode($rank_fotoclub->prizes, true);
      
      foreach($premios as $k => $v) {
        if (!isset($premios_fotoclub[$k])){
          $premios_fotoclub[$k] = 0;
        } 
        $premios_fotoclub[$k] += $premios[$k];
      }
      
      $rank_fotoclub->prizes = json_encode( $premios_fotoclub );
      $rank_fotoclub->save(false);
    }
    
  }
}

class ActualizarRankingController extends Controller
{

    public function actionIndex()
    {
        actualizar_ranking();
        return ExitCode::OK;
    }
}
