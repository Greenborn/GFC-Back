<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\ContestResult;
use app\models\ProfileContest;
use app\models\Fotoclub;
use app\models\Contest;


$datos_concursos = [];

class ExportarFotografiasFCController extends Controller {
  
  public function actionIndex( $id_fotoclub ) {
    echo "Exportando Fotografias Fotoclub ".$id_fotoclub." \n";

    $fotoclub = Fotoclub::find()->where([ 'id' => $id_fotoclub ])->one();

    if ($fotoclub === null){
      echo "No se encontro fotoclub \n";
      return false;
    }

    echo "Fotoclub Encontrado ".$fotoclub->name." \n";

    $nombre_fc = str_replace(' ', '_', preg_replace("/[^A-Za-z0-9 ]/", '', $fotoclub->name) );
    $nombre_dir = 'exportacion_'.$nombre_fc;
    $subdirectorio = 'commands/tmp/'.$nombre_dir.'/';

    $concursos_pasados = Contest::find()->all();

    echo "seteando directorio temporal: \n";
    if (file_exists($subdirectorio)){
      exec( 'rm -rf '. $subdirectorio );
    }
    mkdir($subdirectorio);

    for ($i=0; $i < count($concursos_pasados); $i++ ){
      $concurso = $concursos_pasados[$i];
      $nombre_concurso = str_replace(' ', '_', preg_replace("/[^A-Za-z0-9 ]/", '', $concurso->name) );
      $datos_concursos[ $nombre_concurso ] = [];

      //buscamos los resultados del concurso
      $resultadoConcurso = ContestResult::find()->where([ 'contest_id' => $concurso->id ])->all();

      //Se crea sub directorio del concurso
      $path = $subdirectorio.$nombre_concurso;
      if (!file_exists($path)){
        echo "creando directorio ".$path."\n";
        mkdir($path);
      }

      for ($c=0; $c < count($resultadoConcurso); $c++){
        $premio = $resultadoConcurso[$c]->metric->prize;
        $img_fotoclub_id = $resultadoConcurso[$c]->image->profile->fotoclub_id;

        if ($img_fotoclub_id == $id_fotoclub){
          echo "procesando imagen ".$resultadoConcurso[$c]->image->title. "  ". $premio ."\n";
          $premio = str_replace(' ', '_', $premio );
          $categoria = preg_replace("/[^A-Za-z0-9 ]/", '', ProfileContest::find()->where(['contest_id' => $concurso->id, 'profile_id' => $resultadoConcurso[$c]->image->profile->id ])->one()->category->name);
          $path = $subdirectorio.$nombre_concurso.'/'.$categoria;
          if (!file_exists($path)){
            echo "creando directorio ".$path."\n";
            mkdir($path);
          }

          $seccion = $resultadoConcurso[$c]->section->name;
          if (!file_exists($subdirectorio.$nombre_concurso.'/'.$categoria.'/'.$seccion)){
            echo "creando directorio ".$seccion."\n";
            mkdir($subdirectorio.$nombre_concurso.'/'.$categoria.'/'.$seccion);
          }

          $path = $subdirectorio.$nombre_concurso.'/'.$categoria.'/'.$seccion.'/'.$premio;
          if (!file_exists($path)){
            echo "creando directorio ".$path."\n";
            mkdir($path);
          }
      
          $name_autor = str_replace(' ', '_', preg_replace("/[^A-Za-z0-9 ]/", '_',$resultadoConcurso[$c]->image->profile->name.$resultadoConcurso[$c]->image->profile->last_name) );

          $destino = " ".$subdirectorio.$nombre_concurso.'/'.$categoria.'/'.$seccion.'/'.$premio.'/';
          $destino .= $resultadoConcurso[$c]->image->code.'__'.$name_autor.".jpg";
          exec( "cp web/".$resultadoConcurso[$c]->image->url.$destino);
        }
        
      }
    }

    echo "comprimiendo nuevo directorio \n";
    exec('zip -r commands/'.$nombre_dir.'.zip '.$subdirectorio);
  }
}