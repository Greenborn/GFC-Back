<?php
namespace app\actions;

use Yii;
use yii\rest\UpdateAction;
use yii\helpers\Url;
use app\models\User;
use app\models\Profile;
use app\models\Role;
use yii\web\BadRequestHttpException;

class ValidateVerifyCodeAction extends UpdateAction {

  public function run($id) {
    $params = Yii::$app->getRequest()->getBodyParams();
    
    $response = Yii::$app->getResponse();
    $response->format = \yii\web\Response::FORMAT_JSON;

    $out = [ 'success' => false ];

    if (!isset($params['sign_up_verif_code'])){
      return $out;
    }

    if (!isset($params['sign_up_verif_token'])){
      return $out;
    }

    $user = User::find()->where( ['sign_up_verif_token' => $params['sign_up_verif_token']] )->one();
    if (!$user || $user->sign_up_verif_code !==  $params['sign_up_verif_code']){
      return $out;
    }

    $user->status              = 1;
    $user->sign_up_verif_code  = Null;
    $user->sign_up_verif_token = Null;
    $out['success'] = $user->save(false);
    
    return $out;
  }
}
