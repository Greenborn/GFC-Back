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
use app\models\MetricAbm;
use app\models\Image;
use app\models\ContestResult;
use app\models\Fotoclub;
use app\models\Profile;
use app\models\Category;
use app\models\Section;
use app\models\FotoclubRanking;
use app\models\ProfileContest;
use app\models\ProfilesRankingCategorySection;

function comienzo_temporada(){
  return strtotime('first day of January', time());
}

function actualizar_ranking(){
  echo "Actualizando ranking \n";
  $comienzo_temporada = comienzo_temporada();

  $perfiles  = Profile::find()->all();
  $fotoclubs = Fotoclub::find()->all();
  $categorias = Category::find()->all();
  $metricas = MetricAbm::find()->all();
  $secciones = Section::find()->all();
  
  //Se inicializa tabla ranking fotoclub
  for ($c=0; $c < count($fotoclubs); $c++){
    $rank_fotoclub = FotoclubRanking::find()->where(['fotoclub_id' => $fotoclubs[$c]->id])->one();
    
    if(!$rank_fotoclub){
      $rank_fotoclub              = new FotoclubRanking();
      $rank_fotoclub->fotoclub_id = $fotoclubs[$c]->id;
      $rank_fotoclub->name        = $fotoclubs[$c]->name;
    }

    $rank_fotoclub->score             = 0;
    $rank_fotoclub->puntaje_temporada = 0;
    $rank_fotoclub->prizes            = '{}';
    $rank_fotoclub->premios_temporada = '{}';
    $rank_fotoclub->porc_efectividad_anual = json_encode([
      'premiadas' => 0, 'totales' => 0, 'porcentaje' => 0
    ]);
    $rank_fotoclub->save(false);
  }
    
  //se inicializa tabla de ranking de concursantes
  for ($c=0; $c < count($perfiles); $c++){
    $perfil = $perfiles[$c];
    $nombre = $perfil->last_name.', '.$perfil->name;

    for ($cc=0; $cc < count($categorias); $cc++){
      for ($ss=0; $ss < count($secciones); $ss++){
        $rank = ProfilesRankingCategorySection::find()->where([ 
          'profile_id'  => $perfil->id, 
          'category_id' => $categorias[$cc]->id, 
          'section_id'  => $secciones[$ss]->id ])->one();
        if (!$rank){
          echo "No se encontro registro de ranking, creando nuevo registro \n";
          $rank = new ProfilesRankingCategorySection();   
        }
        $rank->score_total       = 0;
        $rank->puntaje_temporada = 0;
        $rank->prizes            = '{}';
        $rank->premios_temporada = '{}';
        $rank->name              = $nombre;
        $rank->profile_id        = $perfil->id;
        $rank->category_id       = $categorias[$cc]->id;
        $rank->section_id        = $secciones[$ss]->id;

        $rank->save(false);
      }
    }
  }

  //Se recorren los resultados y se actualizan los rnakings
  $resultados_concurso = ContestResult::find()->all();
  for ( $c = 0; $c < count($resultados_concurso); $c++ ){
    $resultado = $resultados_concurso[$c];
    
    $rank_fotoclub = FotoclubRanking::find()->where(['fotoclub_id' => $resultado->image->profile->fotoclub_id])->one();
    if ($rank_fotoclub){
      echo "ACtualizando fotoclub ".$rank_fotoclub->id."\n";
      //se actualiza el porcentaje de efectividad del fotoclub
      $efectividad = json_decode($rank_fotoclub->porc_efectividad_anual);
      if (strtotime($resultado->contest->end_date) >= $comienzo_temporada){
        $efectividad->totales += 1;
        
        if ($resultado->metric->score > 0){
          $efectividad->premiadas += 1;
        }

        $efectividad->porcentaje = $efectividad->premiadas / ($efectividad->totales / 100);
      }
      $rank_fotoclub->porc_efectividad_anual = json_encode($efectividad);  

      //Se actualizan el puntaje
      if (strtotime($resultado->contest->end_date) >= $comienzo_temporada){
        $rank_fotoclub->puntaje_temporada += $resultado->metric->score;
      }
      $rank_fotoclub->score += $resultado->metric->score;

      //Se actualizan los premios obtenidos
      $premios_totales   = json_decode($rank_fotoclub->prizes, true);
      $premios_temporada = json_decode($rank_fotoclub->premios_temporada, true);

      if (!isset($premios_totales[ $resultado->metric->prize ])){
        $premios_totales[ $resultado->metric->prize ] = 0;
      } else {
        $premios_totales[ $resultado->metric->prize ] += 1;
      }
      if (strtotime($resultado->contest->end_date) >= $comienzo_temporada){
        if (!isset($premios_temporada[ $resultado->metric->prize ])){
          $premios_temporada[ $resultado->metric->prize ] = 0;
        } else {
          $premios_temporada[ $resultado->metric->prize ] += 1;
        }
      }

      $rank_fotoclub->prizes = json_encode($premios_totales);
      $rank_fotoclub->premios_temporada = json_encode($premios_temporada);

      //se guarda
      $rank_fotoclub->save(false);  
    }

    //se busca inscripcion
    $inscripcion = ProfileContest::find()->where([
      'profile_id'  => $resultado->image->profile->id,
      'contest_id'  => $resultado->contest_id
    ])->one();

    if ($inscripcion){
      $concursante_rank = ProfilesRankingCategorySection::find()->where([ 
        'profile_id'  => $resultado->image->profile->id, 
        'category_id' => $inscripcion->category_id, 
        'section_id'  => $resultado->section_id ])->one();

      if ($concursante_rank){
        echo 'Actualizando ranking: '.$resultado->image->profile->id." \n";

        //Se actualiza puntaje
        $concursante_rank->score_total += $resultado->metric->score;
        if (strtotime($resultado->contest->end_date) >= $comienzo_temporada){
          $concursante_rank->puntaje_temporada += $resultado->metric->score;
        }

        //se actualizan premios
        $premios_totales   = json_decode($concursante_rank->prizes, true);
        $premios_temporada = json_decode($concursante_rank->premios_temporada, true);
  
        if (!isset($premios_totales[ $resultado->metric->prize ])){
          $premios_totales[ $resultado->metric->prize ] = 0;
        } else {
          $premios_totales[ $resultado->metric->prize ] += 1;
        }
        if (strtotime($resultado->contest->end_date) >= $comienzo_temporada){
          if (!isset($premios_temporada[ $resultado->metric->prize ])){
            $premios_temporada[ $resultado->metric->prize ] = 0;
          } else {
            $premios_temporada[ $resultado->metric->prize ] += 1;
          }
        }
  
        $concursante_rank->prizes = json_encode($premios_totales);
        $concursante_rank->premios_temporada = json_encode($premios_temporada);

        $concursante_rank->save(false);
      }
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
