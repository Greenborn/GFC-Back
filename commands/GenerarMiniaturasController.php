<?php

namespace app\commands;

use yii\console\Controller;
use yii\console\ExitCode;

use app\models\Image;

class GenerarMiniaturasController extends Controller {
    public function actionIndex( ) {
      echo "Regenerando Miniatturas \n";

      $fotografias = Image::find();
      var_dump($fotografias);
    }
}