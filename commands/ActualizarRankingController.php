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
use app\models\Contest;
use app\models\Section;
use app\models\FotoclubRanking;
use app\models\ProfileContest;
use app\models\ProfilesRankingCategorySection;


function comienzo_temporada(){
  return strtotime('first day of January', time());
}

function get_contest_sections_from_perfil( $resultados_concursos, $id_perfil, $id_concurso ){
  $secciones = [];
  $fotos_subidas = Image::find()->where([ 'profile_id' => $id_perfil ])->all();
  
  for ($c = 0; $c < count($fotos_subidas); $c++){
    //buscamos la foto dentro del arreglo de resultados
    $seccion_foto = '';
    for ($i = 0; $i < count($resultados_concursos[ $id_concurso ]); $i++ )
      if ($resultados_concursos[ $id_concurso ][$i]['datos_resultado']->image_id === $fotos_subidas[$c]->id){
        $seccion_foto = $resultados_concursos[ $id_concurso ][$i]['datos_resultado']->section_id;
        break;
      }

    if ($seccion_foto != ''){
      $encontrada = false;

      for ($j=0; $j < count($secciones); $j++)
        if ($secciones[$j] == $seccion_foto){
          $encontrada = true;
          break;
        }
      
      if (!$encontrada) {
        $secciones[] = $seccion_foto;
      } 
    } else {
      //echo "Error!";
    } 
  }
  return $secciones;
}

function get_profile_from_result( $array_inscripciones, $resultado ){
  $foto_subida = Image::find()->where([ 'id' => $resultado['datos_resultado']['image_id'] ])->one();
  
  $encontrada = false;
  for ($c=0; $c < count($array_inscripciones[ $resultado['datos_resultado']->contest_id ]); $c++ ){
    $inscripcion = $array_inscripciones[ $resultado['datos_resultado']->contest_id ][$c];
    if ($inscripcion->profile_id == $foto_subida->profile_id && $inscripcion->contest_id == $resultado['datos_resultado']->contest_id ){
      $encontrada = $inscripcion;
      break;
    }
  }
  return [ 'profile_id' => $foto_subida->profile_id, 'category_id' => $inscripcion->category_id ];
}

function score_from_metric($metric){

}

function actualizar_ranking(){
  $puntuaciones_perfiles = [];
  $puntuaciones_fotoclub = [];
  $resultados_concursos  = [];
  $array_inscripciones   = [];

  echo "\n\n Actualizando ranking \n";
  $comienzo_temporada = comienzo_temporada();

  $perfiles   = Profile::find()->all();
  $fotoclubs  = Fotoclub::find()->where(['mostrar_en_ranking' => 1])->all();
  $categorias = Category::find()->all();
  $metricas   = MetricAbm::find()->all();
  $secciones  = Section::find()->all();
  
  echo "\n\n Inicializando arreglos de puntuaciones y perfiles \n";
  //Se inicializan los arreglos de perfiles fotoclubs con estrucutra de arbol Categorias -> Secciones -> Perfiles

  for ($c=0; $c < count($fotoclubs); $c++) 
    $puntuaciones_fotoclub[$fotoclubs[$c]->id] = [];
  
  for ($c=0; $c < count($categorias); $c++) {
    $puntuaciones_perfiles[$categorias[$c]->id] = [];

    for ($i=0; $i < count($secciones); $i ++)
      $puntuaciones_perfiles[ $categorias[$c]->id ][ $secciones[$i]->id ] = [];
  }

  echo "\n\n Obteniendo concursos a ser incluidos en el Ranking \n";
  //Se obtienen los concursos pasados dentro del último año
  $concursos_pasados = Contest::find()->where([ '>', 'end_date', date('d-m-Y', $comienzo_temporada) ])->all();

  //se obtienen las inscripciones de dichos concursos
  for ($c = 0; $c < count($concursos_pasados); $c++)
    $array_inscripciones[ $concursos_pasados[$c]->id ] = ProfileContest::find()->where(['contest_id'  => $concursos_pasados[$c]->id])->all();
  
  echo "\n\n Obteniendo resultados de concursos \n";
  //se obtienen los resultados de los concursos
  for ($c = 0; $c < count($concursos_pasados); $c++){
    $resultados_concursos[ $concursos_pasados[$c]->id ] = ContestResult::find()->where(['contest_id'  => $concursos_pasados[$c]->id])->all();

    for ($i = 0; $i < count($resultados_concursos[ $concursos_pasados[$c]->id ]); $i ++){
      $resultados_concursos[ $concursos_pasados[$c]->id ][ $i ] = [
        'datos_metrica'   => Metric::find()->where(['id'  => $resultados_concursos[ $concursos_pasados[$c]->id ][ $i ]->metric_id ])->one(),
        'datos_resultado' => $resultados_concursos[ $concursos_pasados[$c]->id ][ $i ]
      ];
      echo $resultados_concursos[ $concursos_pasados[$c]->id ][ $i ][ 'datos_metrica' ]->prize.' ';
    }
  }
  
  //Se recorren las inscripciones para asignar a puntuaciones_perfiles y luego cargar los resultados
  echo "\n\n Se recorren las inscripciones para asignar a puntuaciones_perfiles y luego cargar los resultados \n";
  for ($c=0; $c < count($concursos_pasados); $c++){
    for ($j = 0; $j < count($array_inscripciones[ $concursos_pasados[$c]->id ]); $j++){
      $inscripcion = $array_inscripciones[ $concursos_pasados[$c]->id ][$j];

      $secciones_perfil = get_contest_sections_from_perfil( $resultados_concursos, $inscripcion->profile_id, $inscripcion->contest_id );
      for ($k=0; $k < count($secciones_perfil); $k++)
        if ( !isset($puntuaciones_perfiles[ $inscripcion->category_id ][ $secciones_perfil[$k] ][ $inscripcion->profile_id ]) ){
          $puntuaciones_perfiles[ $inscripcion->category_id ][ $secciones_perfil[$k] ][ $inscripcion->profile_id ] = [];
          echo '['.$inscripcion->category_id.';'.$secciones_perfil[$k].';'.$inscripcion->profile_id.'] ';
        }
      
    }
  }

  // En este punto la estructura de puntuaciones_perfiles ya es un arbol de 3 lvls Categoria | seccion | profile_id
  echo "\n\n Se recorren las puntaciones para asignar puntación a arbol de calificaciones \n";
  for ($c=0; $c < count($concursos_pasados); $c++){
    for($i=0; $i < count($resultados_concursos[ $concursos_pasados[$c]->id ]); $i++) {
      $resultado = $resultados_concursos[ $concursos_pasados[$c]->id ][$i];

      $datos_participante = get_profile_from_result( $array_inscripciones, $resultado );
      if (!isset($puntuaciones_perfiles[ $datos_participante['category_id'] ][ $resultado['datos_resultado']->section_id ][ $datos_participante['profile_id'] ]))
        $puntuaciones_perfiles[ $datos_participante['category_id'] ][ $resultado['datos_resultado']->section_id ][ $datos_participante['profile_id'] ] = [];
      
      $nuevo = [
        'todas_puntuaciones' => [],
        'resumen_premios'    => [],
        'sumatoria_puntos'   => 0
      ];
      $nuevo['todas_puntuaciones'][] = $resultado;
      $puntuaciones_perfiles[ $datos_participante['category_id'] ][ $resultado['datos_resultado']->section_id ][ $datos_participante['profile_id'] ][] = $nuevo;
      
      echo '['.$datos_participante['category_id'].';'.$resultado['datos_resultado']->section_id.';'.$datos_participante['profile_id'].'] > '.$resultado['datos_metrica']->prize.' ';
      
    }
  }
  
  //Se recorre el arbol de calificaciones para realizar la sumatoria y expresar el resumen de los premios asigandos a cada uno
  echo "\n\n Se recorre el arbol de calificaciones para realizar la sumatoria y expresar el resumen de los premios asigandos a cada uno \n";
  $categorias_arbol = array_keys($puntuaciones_perfiles);
  for ($c=0; $c < count($categorias_arbol); $c++){
    $secciones_arbol = array_keys($puntuaciones_perfiles[$categorias_arbol[$c]]);
    for ($i = 0; $i < count($secciones_arbol); $i ++){
      $perfiles_seccion = array_keys( $puntuaciones_perfiles[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ] );
      for ($j=0; $j < count($perfiles_seccion); $j++){
        $calificaciones_participante = $puntuaciones_perfiles[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ][ $perfiles_seccion[$j] ];

        for ($k=0; $k < count($calificaciones_participante); $k++){
          $calificaciones = $calificaciones_participante[$k]['todas_puntuaciones'];

          for ($l=0; $l < count($calificaciones); $l++){
            //Se hace la sumatoria de los puntos
            
            $calificaciones_participante[$k]['sumatoria_puntos'] += $calificaciones[$l]['datos_metrica']->score;

            
            if (isset($calificaciones_participante[$k]['resumen_premios'][$calificaciones[$l]['datos_metrica']->prize])) {
              $calificaciones_participante[$k]['resumen_premios'][$calificaciones[$l]['datos_metrica']->prize] += 1;
            } else {
              $calificaciones_participante[$k]['resumen_premios'][$calificaciones[$l]['datos_metrica']->prize] = 1;
            }
            
          }
          
          echo 'Sumatoria: '.$perfiles_seccion[$j].' > '.$calificaciones_participante[$k]['sumatoria_puntos']."\n"; 
        }
        
      }
    }
  }

  ///Ya teniendo listo el arbol, podemos crear los registros correspondientes en la base de datos
  echo "\n\n Se guarda el ranking en la base de datos \n";
  $categorias_arbol = array_keys($puntuaciones_perfiles);
  for ($c=0; $c < count($categorias_arbol); $c++){
    $secciones_arbol = array_keys($puntuaciones_perfiles[$categorias_arbol[$c]]);
    for ($i = 0; $i < count($secciones_arbol); $i ++){
      $perfiles_seccion = array_keys( $puntuaciones_perfiles[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ] );
      for ($j=0; $j < count($perfiles_seccion); $j++){
        $calificaciones_participante = $puntuaciones_perfiles[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ][ $perfiles_seccion[$j] ];
        
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
