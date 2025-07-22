<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\ContestResult;
use app\models\ProfileContest;
use app\models\Contest;

const TMP_DIR = "./tmp/exportacion/";

class DescargarPremiosAnioController extends Controller {
  
  public function actionIndex( ) {
    echo "Exportando Premios Concurso \n";

    $fecha_ini = strtotime('first day of January', time());
    $concursos_pasados = Contest::find()
        ->where([ '>', 'end_date', date('d-m-Y', $fecha_ini) ])
        ->andWhere([ '=', 'organization_type', 'INTERNO' ])
        ->all();

    echo "seteando directorio temporal: \n";
    if (file_exists(TMP_DIR)){
      exec( 'rm -rf '. TMP_DIR );
    }
    mkdir(TMP_DIR);

    for ($i=0; $i < count($concursos_pasados); $i++ ){
        $concurso = $concursos_pasados[$i];
        $nombre_concurso = str_replace(' ', '_', preg_replace("/[^A-Za-z0-9 ]/", '', $concurso->name) );

        $resultadoConcurso = ContestResult::find()->where([ 'contest_id' => $concurso->id ])->all();
        $path = TMP_DIR.$nombre_concurso;
        if (!file_exists($path)){
          echo "creando directorio ".$path."\n";
          mkdir($path);
        }

        for ($c=0; $c < count($resultadoConcurso); $c++){
          $premio = $resultadoConcurso[$c]->metric->prize;
          
          if ($premio == 'MEDALLA DE HONOR' || $premio == '1er PREMIO'){
            echo "procesando imagen ".$resultadoConcurso[$c]->image->title. "  ". $premio ."\n";
            $premio = str_replace(' ', '_', $premio );
            $categoria = preg_replace("/[^A-Za-z0-9 ]/", '', ProfileContest::find()->where(['contest_id' => $concurso->id, 'profile_id' => $resultadoConcurso[$c]->image->profile->id ])->one()->category->name);
            $path = TMP_DIR.$nombre_concurso.'/'.$categoria;
            if (!file_exists($path)){
              echo "creando directorio ".$path."\n";
              mkdir($path);
            }

            $seccion = $resultadoConcurso[$c]->section->name;
            if (!file_exists(TMP_DIR.$nombre_concurso.'/'.$categoria.'/'.$seccion)){
              echo "creando directorio ".$seccion."\n";
              mkdir(TMP_DIR.$nombre_concurso.'/'.$categoria.'/'.$seccion);
            }

            $path = TMP_DIR.$nombre_concurso.'/'.$categoria.'/'.$seccion.'/'.$premio;
            if (!file_exists($path)){
              echo "creando directorio ".$path."\n";
              mkdir($path);
            }
      
            $name_autor = str_replace(' ', '_', preg_replace("/[^A-Za-z0-9 ]/", '_',$resultadoConcurso[$c]->image->profile->name.$resultadoConcurso[$c]->image->profile->last_name) );

            $destino = TMP_DIR.$nombre_concurso.'/'.$categoria.'/'.$seccion.'/'.$premio.'/';
            $destino .= $resultadoConcurso[$c]->image->code.$name_autor.".jpg";
            exec( "cp web/".$resultadoConcurso[$c]->image->url." ".$destino);
          }
          
        }
        
    }

    echo "comprimiendo nuevo directorio \n";
    exec('cd tmp && zip -r fotografias_ganadoras.zip exportacion');
  }
}