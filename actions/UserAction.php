<?php
namespace app\actions;

use Yii;
use yii\rest\CreateAction;
use yii\helpers\Url;
use app\models\User;
use app\models\Profile;

class CreateUserAction extends CreateAction {

  public function run() {
    $params = Yii::$app->getRequest()->getBodyParams();
  }
}

