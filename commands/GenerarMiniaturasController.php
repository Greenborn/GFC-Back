<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\Image;

class GenerarMiniaturasController extends Controller {
    public function actionIndex( ) {
      echo "Regenerando Miniaturas \n";

      $fotografias = Image::find()->all();
      
      for ($i=0; $i < count($fotografias); $i++ ){
        $foto = $fotografias[$i];
        $foto->regenerateThumbnail($foto->id);
      }
    }
}