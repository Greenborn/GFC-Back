<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\ContestResult;
use app\models\ProfileContest;

class ExportarFotosController extends Controller {
  public function actionIndex( $concurso ) {
    echo "Exportando Fotos concurso ".$concurso." \n";

    $resultadoConcurso = ContestResult::find()->where([ 'contest_id' => $concurso ])->all();
    
    echo "Se encontraron ".count($resultadoConcurso). " fotografias ";

    echo "seteando directorio temporal: \n";
    if (file_exists('commands/tmp/exportacion/')){
      exec( 'rm -rf '. 'commands/tmp/exportacion/' );
    }
    mkdir('commands/tmp/exportacion/');

    for ($c=0; $c < count($resultadoConcurso); $c++){
      echo "procesando imagen ".$resultadoConcurso[$c]->image->title. "\n";

      $categoria = ProfileContest::find()->where(['contest_id' => $concurso, 'profile_id' => $resultadoConcurso[$c]->image->profile->id ])->one()->category->name;
      if (!file_exists('commands/tmp/exportacion/'.$categoria)){
        echo "creando directorio ".$categoria."\n";
        mkdir('commands/tmp/exportacion/'.$categoria);
      }

      $seccion = $resultadoConcurso[$c]->section->name;
      if (!file_exists('commands/tmp/exportacion/'.$categoria.'/'.$seccion)){
        echo "creando directorio ".$seccion."\n";
        mkdir('commands/tmp/exportacion/'.$categoria.'/'.$seccion);
      }

      $destino = " commands/tmp/exportacion/".$categoria.'/'.$seccion.'/'.$resultadoConcurso[$c]->image->code.".jpg";

      exec( "cp web/".$resultadoConcurso[$c]->image->url.$destino);
    }

    echo "comprimiendo nuevo directorio \n";
    exec('zip -r commands/concurso_'.$concurso.'.zip commands/tmp/exportacion');
  }
}