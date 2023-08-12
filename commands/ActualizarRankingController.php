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

function inicicializa_rank_fotoclub( $fotoclubs ){
  $aux = [];
  for ($c=0; $c < count($fotoclubs); $c++) 
    $aux[$fotoclubs[$c]->id] = [
      'sumatoria_puntos'   => 0, 
      'resumen_premios'    => [], 
      'cant_presentadas'   => 0,
      'cant_premiadas'     => 0,
    ];
  return $aux;
}

function inicializa_puntuaciones_perfiles( $categorias, $secciones) {
  $aux = [];
  for ($c=0; $c < count($categorias); $c++) {
    $aux[$categorias[$c]->id] = [];

    for ($i=0; $i < count($secciones); $i ++)
      $aux[ $categorias[$c]->id ][ $secciones[$i]->id ] = [];
  }
  return $aux;
}

function inicializa_inscripciones( $concursos_pasados ){
  $aux = [];
  for ($c = 0; $c < count($concursos_pasados); $c++)
    $aux[ $concursos_pasados[$c]->id ] = ProfileContest::find()->where(['contest_id'  => $concursos_pasados[$c]->id])->all();
  return $aux;
}

function get_resultados_concursos( $concursos_pasados ){
  $aux = [];
  for ($c = 0; $c < count($concursos_pasados); $c++){
    $aux[ $concursos_pasados[$c]->id ] = ContestResult::find()->where(['contest_id'  => $concursos_pasados[$c]->id])->all();

    for ($i = 0; $i < count($aux[ $concursos_pasados[$c]->id ]); $i ++){
      $aux[ $concursos_pasados[$c]->id ][ $i ] = [
        'datos_metrica'   => Metric::find()->where(['id'  => $aux[ $concursos_pasados[$c]->id ][ $i ]->metric_id ])->one(),
        'datos_resultado' => $aux[ $concursos_pasados[$c]->id ][ $i ]
      ];
      echo $aux[ $concursos_pasados[$c]->id ][ $i ][ 'datos_metrica' ]->prize.' ';
    }
  }
  return $aux;
}

function add_inscripcion_a_puntuacion_perfil( $puntuaciones_perfiles, $concursos_pasados, $array_inscripciones, $resultados_concursos){
  $aux = $puntuaciones_perfiles;

  for ($c=0; $c < count($concursos_pasados); $c++){
    for ($j = 0; $j < count($array_inscripciones[ $concursos_pasados[$c]->id ]); $j++){
      $inscripcion = $array_inscripciones[ $concursos_pasados[$c]->id ][$j];

      $secciones_perfil = get_contest_sections_from_perfil( $resultados_concursos, $inscripcion->profile_id, $inscripcion->contest_id );
      for ($k=0; $k < count($secciones_perfil); $k++)
        if ( !isset($aux[ $inscripcion->category_id ][ $secciones_perfil[$k] ][ $inscripcion->profile_id ]) ){
          $aux[ $inscripcion->category_id ][ $secciones_perfil[$k] ][ $inscripcion->profile_id ] = [
            'todas_puntuaciones' => [],
            'resumen_premios'    => [],
            'cant_presentadas'   => 0,
            'cant_premiadas'     => 0,
            'sumatoria_puntos'   => 0
          ];
          echo '['.$inscripcion->category_id.';'.$secciones_perfil[$k].';'.$inscripcion->profile_id.'] ';
        }
      
    }
  }

  return $aux;
}

function add_puntuaciones_a_puntuacion_perfil( $puntuaciones_perfiles, $concursos_pasados, $resultados_concursos, $array_inscripciones ){
  $aux = $puntuaciones_perfiles;

  for ($c=0; $c < count($concursos_pasados); $c++){
    for($i=0; $i < count($resultados_concursos[ $concursos_pasados[$c]->id ]); $i++) {

      $resultado = $resultados_concursos[ $concursos_pasados[$c]->id ][$i];

      $datos_participante = get_profile_from_result( $array_inscripciones, $resultado );
      $aux[ $datos_participante['category_id'] ][ $resultado['datos_resultado']->section_id ][ $datos_participante['profile_id'] ]['todas_puntuaciones'][] = $resultado;
           
      echo '['.$datos_participante['category_id'].';'.$resultado['datos_resultado']->section_id.';'.$datos_participante['profile_id'].'] > '.$resultado['datos_metrica']->prize.' ';
      
    }
  }

  return $aux;
}

function suma_puntuaciones_perfiles( $puntuaciones_perfiles ){
  $aux = $puntuaciones_perfiles;

  $categorias_arbol = array_keys($aux);
  for ($c=0; $c < count($categorias_arbol); $c++){
    $secciones_arbol = array_keys($aux[$categorias_arbol[$c]]);
    for ($i = 0; $i < count($secciones_arbol); $i ++){
      $perfiles_seccion = array_keys( $aux[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ] );
      for ($j=0; $j < count($perfiles_seccion); $j++){

        $ranking_participante = $aux[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ][ $perfiles_seccion[$j] ];
                
        //Se hace la sumatoria de los puntos
        $sumatoria        = 0;
        $cant_premiadas   = 0;
        $cant_presentadas = 0;
        $resumen_premios  = [];

        for ($k=0; $k < count($ranking_participante['todas_puntuaciones']); $k++){
          $calificaciones = $ranking_participante['todas_puntuaciones'][$k];
                    
          $sumatoria += $calificaciones['datos_metrica']->score;
          if ($calificaciones['datos_metrica']->score > 0)
            $cant_premiadas += 1;
          
          $cant_presentadas += 1;
          
          if (isset($resumen_premios[$calificaciones['datos_metrica']->prize])) {
            $resumen_premios[$calificaciones['datos_metrica']->prize] += 1;
          } else {
            $resumen_premios[$calificaciones['datos_metrica']->prize] = 1;
          }

        }
        
        $aux[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ][ $perfiles_seccion[$j] ] = [
          'sumatoria_puntos' => $sumatoria, 
          'resumen_premios'  => $resumen_premios,
          'cant_presentadas' => $cant_presentadas,
          'cant_premiadas'   => $cant_premiadas,
        ];
        echo $aux[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ][ $perfiles_seccion[$j] ]['sumatoria_puntos']." , ";
        echo 'Sumatoria: '.$perfiles_seccion[$j].' > '.$ranking_participante['sumatoria_puntos']."\n";
      }
    }
  }

  return $aux;
}

function agregar_puntuaciones_fotoclub( $puntuaciones_fotoclub, $puntuaciones_perfiles, $perfiles, $fotoclubs ){
  $aux = $puntuaciones_fotoclub;

  $categorias_arbol = array_keys($puntuaciones_perfiles);
  for ($c=0; $c < count($categorias_arbol); $c++){
    $secciones_arbol = array_keys($puntuaciones_perfiles[$categorias_arbol[$c]]);
    for ($i = 0; $i < count($secciones_arbol); $i ++){
      $perfiles_seccion = array_keys( $puntuaciones_perfiles[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ] );
      for ($j=0; $j < count($perfiles_seccion); $j++){
        $calificaciones_participante = $puntuaciones_perfiles[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ][ $perfiles_seccion[$j] ];

        $perfil = false;
        for ($k = 0; $k < count($perfiles); $k++)
          if ($perfiles[$k]->id == $perfiles_seccion[$j]){
            $perfil = $perfiles[$k];
            break;
          }
        
        $fotoclub = false;
        for ($k = 0; $k < count($fotoclubs); $k++)
          if ($fotoclubs[$k]->id == $perfil->fotoclub_id){
            $fotoclub = $fotoclubs[$k];
            break;
          }
        
        if (isset($aux[ $perfil->fotoclub_id ])){
          $aux[ $perfil->fotoclub_id ]['sumatoria_puntos'] += $calificaciones_participante['sumatoria_puntos'];
          $aux[ $perfil->fotoclub_id ]['cant_presentadas'] += $calificaciones_participante['cant_presentadas'];
          $aux[ $perfil->fotoclub_id ]['cant_premiadas']   += $calificaciones_participante['cant_premiadas'];
          $key_premios = array_keys($calificaciones_participante['resumen_premios']);

          for ($k=0; $k < count($key_premios); $k++) {
            if (!isset($aux[ $perfil->fotoclub_id ]['resumen_premios'][ $key_premios[$k] ])){
              $aux[ $perfil->fotoclub_id ]['resumen_premios'][ $key_premios[$k] ] = $calificaciones_participante['resumen_premios'][ $key_premios[$k] ];
              
            } else {
              $aux[ $perfil->fotoclub_id ]['resumen_premios'][ $key_premios[$k] ] += $calificaciones_participante['resumen_premios'][ $key_premios[$k] ];
            }
            
            echo "[".$perfil->fotoclub_id.";".$key_premios[$k].";".$aux[ $perfil->fotoclub_id ]['resumen_premios'][ $key_premios[$k] ]."]\n";
          }
          echo $aux[ $perfil->fotoclub_id ]['cant_presentadas'].' '.$aux[ $perfil->fotoclub_id ]['cant_premiadas']."\n\n";
        } else {
          echo "\n\n\n\n Error fotoclub no encontrado \n\n\n\n";
        }
          
      }
    }
  }

  return $aux;
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
  $puntuaciones_fotoclub = inicicializa_rank_fotoclub( $fotoclubs );
  $puntuaciones_perfiles = inicializa_puntuaciones_perfiles( $categorias, $secciones);

  echo "\n\n Obteniendo concursos a ser incluidos en el Ranking \n";
  //Se obtienen los concursos pasados dentro del último año
  $concursos_pasados = Contest::find()->where([ '>', 'end_date', date('d-m-Y', $comienzo_temporada) ])->all();

  //se obtienen las inscripciones de dichos concursos
  $array_inscripciones = inicializa_inscripciones( $concursos_pasados );
  
  echo "\n\n Obteniendo resultados de concursos \n";
  //se obtienen los resultados de los concursos
  $resultados_concursos = get_resultados_concursos( $concursos_pasados );
  
  //Se recorren las inscripciones para asignar a puntuaciones_perfiles y luego cargar los resultados
  echo "\n\n Se recorren las inscripciones para asignar a puntuaciones_perfiles y luego cargar los resultados \n";
  $puntuaciones_perfiles = add_inscripcion_a_puntuacion_perfil( $puntuaciones_perfiles, $concursos_pasados, $array_inscripciones, $resultados_concursos );

  // En este punto la estructura de puntuaciones_perfiles ya es un arbol de 3 lvls Categoria | seccion | profile_id
  echo "\n\n Se recorren las puntaciones para asignar puntación a arbol de calificaciones \n";
  $puntuaciones_perfiles = add_puntuaciones_a_puntuacion_perfil( $puntuaciones_perfiles, $concursos_pasados, $resultados_concursos, $array_inscripciones );
    
  //Se recorre el arbol de calificaciones para realizar la sumatoria y expresar el resumen de los premios asigandos a cada uno
  echo "\n\n Se recorre el arbol de calificaciones para realizar la sumatoria y expresar el resumen de los premios asigandos a cada uno \n";
  $puntuaciones_perfiles = suma_puntuaciones_perfiles( $puntuaciones_perfiles );
  
  echo "\n\n Se vacia tabla de ranking \n";
  ProfilesRankingCategorySection::deleteAll();

  ///Ya teniendo listo el arbol, podemos crear los registros correspondientes en la base de datos
  echo "\n\n Se guarda el ranking en la base de datos \n";
  $categorias_arbol = array_keys($puntuaciones_perfiles);
  for ($c=0; $c < count($categorias_arbol); $c++){
    $secciones_arbol = array_keys($puntuaciones_perfiles[$categorias_arbol[$c]]);
    for ($i = 0; $i < count($secciones_arbol); $i ++){
      $perfiles_seccion = array_keys( $puntuaciones_perfiles[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ] );
      for ($j=0; $j < count($perfiles_seccion); $j++){
        $calificaciones_participante = $puntuaciones_perfiles[ $categorias_arbol[$c] ][ $secciones_arbol[$i] ][ $perfiles_seccion[$j] ];

        $perfil = false;
        for ($k = 0; $k < count($perfiles); $k++)
          if ($perfiles[$k]->id == $perfiles_seccion[$j]){
            $perfil = $perfiles[$k];
            break;
          }
        
        $registro_ranking_profile                    = new ProfilesRankingCategorySection();
        $registro_ranking_profile->profile_id        = $perfiles_seccion[$j];
        $registro_ranking_profile->section_id        = $secciones_arbol[$i];
        $registro_ranking_profile->category_id       = $categorias_arbol[$c];
        $registro_ranking_profile->puntaje_temporada = $calificaciones_participante['sumatoria_puntos'];
        $registro_ranking_profile->score_total       = $calificaciones_participante['sumatoria_puntos'];
        $registro_ranking_profile->prizes            = json_encode( $calificaciones_participante['resumen_premios'] );
        if($registro_ranking_profile->prizes == '[]') $registro_ranking_profile->prizes= '{}';
        $registro_ranking_profile->name              = $perfil->name.' '.$perfil->last_name;
        $registro_ranking_profile->premios_temporada = json_encode( $calificaciones_participante['resumen_premios'] );
        $registro_ranking_profile->save();

        echo ' profile_id: '.$registro_ranking_profile->profile_id."\n";
        echo ' section_id: '.$registro_ranking_profile->section_id."\n";
        echo ' category_id: '.$registro_ranking_profile->category_id."\n";
        echo ' puntaje_temporada: '.$registro_ranking_profile->puntaje_temporada."\n";
        echo ' score_total: '.$registro_ranking_profile->score_total."\n";
        echo ' prizes: '.$registro_ranking_profile->prizes."\n";
        echo ' name: '.$registro_ranking_profile->name."\n";
        echo ' premios_temporada: '.$registro_ranking_profile->premios_temporada."\n\n";
      }
    }
  }

  //Se genera sumatoria por fotoclub
  echo "\n\n Se genera sumatoria de puntos por fotoclub \n";
  $puntuaciones_fotoclub = agregar_puntuaciones_fotoclub( $puntuaciones_fotoclub, $puntuaciones_perfiles, $perfiles, $fotoclubs );


  FotoclubRanking::deleteAll();

  echo "\n\n Se genera sumatoria de puntos por fotoclub \n";
  $keys_ = array_keys( $puntuaciones_fotoclub );
  for ($i=0; $i < count($keys_);$i++){
    $fotoclub = false;
    for($j=0; $j < count($fotoclubs); $j++) {
      if ($fotoclubs[$j]->id == $keys_[$i]){
        $fotoclub = $fotoclubs[$j];
        break;
      }
    }

    $new_record = new FotoclubRanking();
    $new_record->fotoclub_id = $keys_[$i];
    $new_record->name = $fotoclub->name;
    if ($puntuaciones_fotoclub[$keys_[$i]]['cant_premiadas'] != 0 && $puntuaciones_fotoclub[$keys_[$i]]['cant_presentadas'] != 0)
      $new_record->porc_efectividad_anual = json_encode([
        'premiadas'  => $puntuaciones_fotoclub[$keys_[$i]]['cant_premiadas'], 
        'totales'    => $puntuaciones_fotoclub[$keys_[$i]]['cant_presentadas'], 
        'porcentaje' => $puntuaciones_fotoclub[$keys_[$i]]['cant_premiadas'] / ( $puntuaciones_fotoclub[$keys_[$i]]['cant_presentadas'] / 100)
      ]);
    else
      $new_record->porc_efectividad_anual = json_encode([
        'premiadas'  => 0, 
        'totales'    => 0, 
        'porcentaje' => 0
      ]);
    $new_record->score = $puntuaciones_fotoclub[$keys_[$i]]['sumatoria_puntos'];
    $new_record->puntaje_temporada = $puntuaciones_fotoclub[$keys_[$i]]['sumatoria_puntos'];
    $new_record->prizes = json_encode( $puntuaciones_fotoclub[$keys_[$i]]['resumen_premios']);
    if($new_record->prizes == '[]') $new_record->prizes= '{}';
    $new_record->premios_temporada = $new_record->prizes;
    $new_record->save();
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